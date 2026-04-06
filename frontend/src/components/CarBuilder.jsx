import { useState } from 'react'

const CAR_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d']

export default function CarBuilder({ roster, cars, setCars }) {
  const [selectedDriver, setSelectedDriver] = useState('')
  const [capacity, setCapacity] = useState(4)

  const drivers = roster
  const usedDriverEmails = new Set(cars.map(c => c.driver.email))

  const availableDrivers = roster.filter(
   d => !usedDriverEmails.has(d.email)
  )
  function addCar() {
    const driver = roster.find(p => p.name === selectedDriver)
    if (!driver) return

    const newCar = {
      id: driver.email,
      driver,
      capacity: parseInt(capacity),
      color: CAR_COLORS[cars.length % CAR_COLORS.length],
      passengers: [],
    }

    setCars(prev => [...prev, newCar])
    setSelectedDriver('')
  }

  function removeCar(id) {
    setCars(prev => prev.filter(c => c.id !== id))
  }

  const selectStyle = {
    flex: 1,
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    background: '#fff',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {roster.length === 0 && (
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>Load a roster first.</div>
      )}

      {roster.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            style={selectStyle}
            value={selectedDriver}
            onChange={e => setSelectedDriver(e.target.value)}
          >
            <option value="">Select driver...</option>
            {availableDrivers.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={15}
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            style={{ width: '60px', padding: '9px 8px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px' }}
          />
          <button
            onClick={addCar}
            disabled={!selectedDriver}
            style={{
              padding: '9px 14px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: selectedDriver ? 'pointer' : 'not-allowed',
              opacity: selectedDriver ? 1 : 0.5,
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Car list */}
      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
         {cars.map(car => (
         <div key={car.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: '#f9fafb',
            borderRadius: '8px',
            borderLeft: `4px solid ${car.color}`,
         }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
               <div style={{ fontSize: '13px', fontWeight: 500 }}>{car.driver.name}</div>
               <div style={{ fontSize: '12px', color: '#6b7280' }}>Capacity: {car.capacity} seats</div>
            </div>
            <button
               onClick={() => removeCar(car.id)}
               style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}
            >
               ×
            </button>
         </div>
         ))}
      </div>

    </div>
  )
}