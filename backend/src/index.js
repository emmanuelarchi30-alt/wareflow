import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import WebSocket from 'ws';
import nodemailer from 'nodemailer';

globalThis.WebSocket = WebSocket;

const app = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

const supportSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(5000),
});

const mailTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const analyzeSchema = z.object({
  warehouseId: z.string().uuid(),
  imageBase64: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/support', async (req, res) => {
  try {
    const ticket = supportSchema.parse(req.body);
    if (!mailTransport) {
      return res.status(503).json({ error: 'El soporte por correo no está configurado en el backend.' });
    }
    await mailTransport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'developer@gmail.com',
      replyTo: ticket.email,
      subject: `[Wareflow] ${ticket.subject}`,
      text: `Solicitud de soporte\n\nNombre: ${ticket.name}\nCorreo: ${ticket.email}\n\n${ticket.message}`,
    });
    res.status(202).json({ message: 'Solicitud enviada correctamente.' });
  } catch (err) {
    const message = err instanceof z.ZodError ? 'Completa correctamente todos los campos.' : err.message;
    res.status(400).json({ error: message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { name, address, country, region, city, userId } = req.body;
    const { data, error } = await supabase
      .from('warehouses')
      .insert({ name, address, country, region, city, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/warehouses/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*, layout_analyses(count)')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/analyses', upload.single('image'), async (req, res) => {
  try {
    const { warehouseId, userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Imagen requerida' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('warehouse-images')
      .upload(`${warehouseId}/${Date.now()}-${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('warehouse-images')
      .getPublicUrl(uploadData.path);

    const { data: analysis, error: analysisError } = await supabase
      .from('layout_analyses')
      .insert({
        warehouse_id: warehouseId,
        image_url: urlData.publicUrl,
        status: 'processing',
      })
      .select()
      .single();
    if (analysisError) throw analysisError;

    res.json({ analysisId: analysis.id, imageUrl: urlData.publicUrl });

    processAnalysis(analysis.id, urlData.publicUrl, file.mimetype).catch(console.error);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

async function processAnalysis(analysisId, imageUrl, mimeType) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`No se pudo descargar la imagen (${response.status})`);
    const buffer = Buffer.from(await response.arrayBuffer());

    let imageBuffer = buffer;
    let sendMime = mimeType;

    try {
      const processed = await sharp(buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      imageBuffer = processed;
      sendMime = 'image/jpeg';
    } catch (sharpErr) {
      console.warn('Sharp falló, usando imagen original:', sharpErr.message);
    }

    const base64 = imageBuffer.toString('base64');

    const prompt = `Eres un ingeniero logístico experto. Analiza la imagen de un almacén/bodega y detecta los problemas reales que se ven en ella (cuellos de botella, pasillos bloqueados, espacio mal aprovechado, flujos cruzados, desorden, riesgo de seguridad).

Requisitos:
- SIEMPRE identifica al menos 1 problema real visible en la imagen (si no ves ninguno, describe el riesgo más probable).
- Las coordenadas x,y,width,height son porcentajes (0-100) relativos a la imagen.
- Responde EXCLUSIVAMENTE con un JSON válido (sin texto antes ni después, sin markdown), con este esquema exacto:
{
  "summary": "resumen ejecutivo de 1-2 frases del estado general",
  "zones": [
    {"type": "racking|aisle|loading|empty|obstacle", "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100, "description": "string"}
  ],
  "issues": [
    {"type": "bottleneck|wasted_space|blocked_aisle|poor_flow|disorganization", "severity": "critical|warning|good", "x": 0-100, "y": 0-100, "description": "descripción del problema visible", "recommendation": "solución concreta"}
  ],
  "recommendations": [
    {"priority": "high|medium|low", "description": "string", "impact": "string", "zoneType": "racking|aisle|loading|empty"}
  ]
}`;

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.1,
      timeout: 90000,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', source: { type: 'base64', media_type: sendMime, data: base64 } },
        ],
      }],
    });

    const content = msg.content[0].text;
    let parsed;
    try {
      parsed = JSON.parse(extractJson(content));
    } catch (parseErr) {
      console.warn('Primer parseo falló, reintentando:', parseErr.message);
      const retry = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.1,
        timeout: 60000,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `${prompt}\n\nIMPORTANTE: Tu respuesta anterior no era JSON válido. Devuelve SOLO el objeto JSON, sin markdown ni texto extra.` },
            { type: 'image', source: { type: 'base64', media_type: sendMime, data: base64 } },
          ],
        }],
      });
      const retryContent = retry.content[0].text;
      parsed = JSON.parse(extractJson(retryContent));
    }

    const safe = {
      summary: parsed.summary || `Análisis completado. Se detectaron ${parsed.issues?.length || 0} problemas y ${parsed.recommendations?.length || 0} recomendaciones.`,
      zones: Array.isArray(parsed.zones) ? parsed.zones : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };

    await supabase.from('layout_analyses').update({
      json_analysis: safe,
      status: 'completed',
    }).eq('id', analysisId);

    if (safe.issues.length) {
      const issues = safe.issues.map(issue => ({
        analysis_id: analysisId,
        type: issue.type,
        description: issue.description,
        severity: issue.severity,
        coordinates_x: issue.x,
        coordinates_y: issue.y,
      }));
      await supabase.from('detected_issues').insert(issues);
    }

    if (safe.recommendations.length) {
      const recs = safe.recommendations.map(rec => ({
        analysis_id: analysisId,
        description: rec.description,
        priority: rec.priority,
        estimated_impact: rec.impact,
      }));
      await supabase.from('recommendations').insert(recs);
    }
  } catch (err) {
    console.error('Analysis error:', err);
    await supabase.from('layout_analyses').update({
      status: 'failed',
      error_note: err.message,
    }).eq('id', analysisId);
  }
}

function extractJson(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Respuesta IA sin JSON');
  return match[0];
}

app.get('/api/analyses/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('layout_analyses')
      .select('*, detected_issues(*), recommendations(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/location/countries', async (req, res) => {
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.msg || 'No se pudieron cargar los países');
    const countries = Array.isArray(result.data) ? result.data : [];
    res.json(countries.map(c => ({ iso2: c.name, name: c.name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/location/states/:countryCode', async (req, res) => {
  try {
    const response = await fetch(`https://countriesnow.space/api/v0.1/countries/states/q?country=${encodeURIComponent(req.params.countryCode)}`);
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.msg || 'No se pudieron cargar las regiones');
    const states = result.data?.states || [];
    res.json(states.map(s => ({ iso2: s.name, name: s.name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/location/cities/:countryCode/:stateCode', async (req, res) => {
  try {
    const response = await fetch(`https://countriesnow.space/api/v0.1/countries/state/cities/q?country=${encodeURIComponent(req.params.countryCode)}&state=${encodeURIComponent(req.params.stateCode)}`);
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.msg || 'No se pudieron cargar las ciudades');
    const cities = Array.isArray(result.data) ? result.data : [];
    res.json(cities.map(name => ({ name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});