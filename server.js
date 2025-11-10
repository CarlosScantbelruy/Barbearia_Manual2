
/**
 * Manual Barbearia - backend (Express)
 *
 * Instructions: fill environment variables or use a Firebase service account.
 * This file expects the following env variables:
 * - OWNER_WHATSAPP_NUMBER (e.g. 5592994329119)
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (with n as line breaks)
 *
 * Optional for Twilio:
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (whatsapp:+...)
 */

const express = require('express')
const cors = require('cors')
const axios = require('axios')
const admin = require('firebase-admin')
require('dotenv').config()

const OWNER_WHATSAPP_NUMBER = process.env.OWNER_WHATSAPP_NUMBER || '5592994329119'
const SHOP_NAME = 'Manual Barbearia'

// Init Firebase Admin
const firebaseConfigProvided = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
if (!firebaseConfigProvided) {
  console.warn('FIREBASE variables not found in env. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY')
}
try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // private key may include escaped newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/n/g, 'n') : undefined,
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
} catch (err) {
  console.error('Firebase initialization failed:', err.message)
}
const db = admin.firestore()

const app = express()
app.use(cors())
app.use(express.json())

// Create booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { serviceName, barberName, date, time, clientName, clientPhone } = req.body
    if (!serviceName || !barberName || !date || !time || !clientName || !clientPhone) {
      return res.status(400).json({ error: 'Dados incompletos' })
    }
    const booking = {
      serviceName, barberName, date, time, clientName, clientPhone,
      status: 'Confirmado', createdAt: new Date()
    }
    const ref = await db.collection('bookings').add(booking)

    const message = `Novo agendamento na ${SHOP_NAME}:nCliente: ${clientName}nTelefone: ${clientPhone}nServiço: ${serviceName}nBarbeiro: ${barberName}nData: ${date}nHora: ${time}nID: ${ref.id}`
    const waLink = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

    console.log('Notify link (wa.me):', waLink)

    res.status(201).json({ id: ref.id, waLink })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao criar agendamento' })
  }
})

// List bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get()
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao listar agendamentos' })
  }
})

// Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'Status obrigatório' })
    await db.collection('bookings').doc(id).update({ status })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao atualizar agendamento' })
  }
})

// Optional notify via Twilio or fallback to wa.me link
app.post('/api/notify', async (req, res) => {
  try {
    const { to, message } = req.body
    if (!to || !message) return res.status(400).json({ error: 'Parâmetros inválidos' })

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const sid = process.env.TWILIO_ACCOUNT_SID
      const token = process.env.TWILIO_AUTH_TOKEN
      const from = process.env.TWILIO_FROM
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: message }),
        { auth: { username: sid, password: token }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      return res.json({ success: true, via: 'twilio' })
    }
    const link = `https://wa.me/${to}?text=${encodeURIComponent(message)}`
    return res.json({ success: true, via: 'wa.me', link })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Falha ao enviar notificação' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`ManualBarbearia backend running on port ${PORT}`))
