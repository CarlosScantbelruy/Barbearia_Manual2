import React, { useState, useEffect } from 'react'

// Config
const SHOP_NAME = 'Manual Barbearia'
const OWNER_WHATSAPP_NUMBER = '5592994329119' // used only when opening wa.me from client

const BARBERS = [ { id: 'carlos', name: 'Carlos' } ]
const SERVICES = [
  { id: 'corte-barba', name: 'Corte e Barba', price: 30 },
  { id: 'limpeza-pele', name: 'Limpeza de Pele', price: 10 },
]

function formatDateInput(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function App() {
  const [service, setService] = useState(SERVICES[0].id)
  const [barber, setBarber] = useState(BARBERS[0].id)
  const [date, setDate] = useState(formatDateInput(new Date()))
  const [time, setTime] = useState('10:00')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState([])

  // fetch bookings for admin view (simple load)
  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(setBookings).catch(() => setBookings([]))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const serviceObj = SERVICES.find(s => s.id === service)
    const barberObj = BARBERS.find(b => b.id === barber)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: serviceObj.name,
          barberName: barberObj.name,
          date, time, clientName: name, clientPhone: phone
        })
      })
      const data = await res.json()
      // open wa.me link to notify owner
      if (data.waLink) window.open(data.waLink, '_blank')
      alert('Agendamento realizado!')
      setName(''); setPhone('')
    } catch (err) {
      console.error(err)
      alert('Erro ao criar agendamento')
    } finally { setLoading(false) }
  }

  const sendReminder = (b) => {
    const msg = `Olá ${b.clientName}, lembrando do seu agendamento na ${SHOP_NAME} em ${b.date} às ${b.time} para ${b.serviceName}.`
    const link = `https://wa.me/${b.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`
    window.open(link, '_blank')
  }

  const updateStatus = async (id, status) => {
    await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    const res = await fetch('/api/bookings')
    setBookings(await res.json())
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">{SHOP_NAME}</h1>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Agende seu horário</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                Serviço
                <select value={service} onChange={(e)=>setService(e.target.value)} className="w-full p-2 mt-1 rounded text-black">
                  {SERVICES.map(s=> <option key={s.id} value={s.id}>{s.name} — R$ {s.price}</option>)}
                </select>
              </label>

              <label className="block">
                Barbeiro
                <select value={barber} onChange={(e)=>setBarber(e.target.value)} className="w-full p-2 mt-1 rounded text-black">
                  {BARBERS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>

              <div className="flex gap-2">
                <label className="flex-1">Data
                  <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full p-2 mt-1 rounded text-black" />
                </label>
                <label className="flex-1">Hora
                  <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="w-full p-2 mt-1 rounded text-black" />
                </label>
              </div>

              <label className="block">Nome
                <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full p-2 mt-1 rounded text-black" required />
              </label>

              <label className="block">Telefone (WhatsApp)
                <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full p-2 mt-1 rounded text-black" placeholder="559XXXXXXXXX" required />
              </label>

              <button type="submit" disabled={loading} className="w-full bg-yellow-400 text-black py-2 rounded font-semibold mt-2">{loading ? 'Agendando...' : 'Confirmar agendamento'}</button>
            </form>
          </section>

          <section className="bg-gray-900 p-6 rounded-lg shadow-lg max-h-[70vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Agendamentos</h2>
            {bookings.length === 0 ? <p>Nenhum agendamento.</p> : bookings.map(b => (
              <div key={b.id} className="p-3 mb-3 border border-gray-700 rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-yellow-300 font-semibold">{b.serviceName} — {b.barberName}</div>
                    <div className="text-lg font-bold">{b.clientName} — {b.clientPhone}</div>
                    <div className="text-sm">{b.date} at {b.time}</div>
                    <div className="text-xs mt-1">Status: <span className="font-semibold">{b.status}</span></div>
                    <div className="text-xs text-gray-400">ID: {b.id}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={()=>sendReminder(b)} className="px-3 py-1 bg-yellow-400 text-black rounded">Lembrar cliente</button>
                    <div className="flex gap-2">
                      <button onClick={()=>updateStatus(b.id, 'Atendido')} className="px-2 py-1 bg-green-600 rounded">Atendido</button>
                      <button onClick={()=>updateStatus(b.id, 'Cancelado')} className="px-2 py-1 bg-red-600 rounded">Cancelar</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </main>

        <footer className="mt-8 text-center text-sm text-gray-400">Design: Preto & Amarelo • Manual Barbearia</footer>
      </div>
    </div>
  )
}
