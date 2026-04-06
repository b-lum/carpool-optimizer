export default function RosterPanel({ roster, cars }) {
  const assignedNames = cars.flatMap(c => [
    c.driver.name,
    ...c.passengers.map(p => p.name)
  ])

  const drivers = roster.filter(p => p.status === 'Driver')
  const passengers = roster.filter(p => p.status === 'Passenger')

  return (
    <div style={{
      width: '220px',
      borderLeft: '1px solid #e5e7eb',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Roster</h2>
        {roster.length > 0 && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            {roster.length} people
          </div>
        )}
      </div>

      {roster.length === 0 && (
        <div style={{ padding: '16px', fontSize: '13px', color: '#9ca3af' }}>
          No roster loaded yet.
        </div>
      )}

      {drivers.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Drivers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {drivers.map(p => (
              <PersonRow key={p.name} person={p} assigned={assignedNames.includes(p.name)} color={getCarColor(p.name, cars)} />
            ))}
          </div>
        </div>
      )}

      {passengers.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: drivers.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Passengers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {passengers.map(p => (
              <PersonRow key={p.name} person={p} assigned={assignedNames.includes(p.name)} color={getCarColor(p.name, cars)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PersonRow({ person, assigned, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      borderRadius: '6px',
      background: assigned ? '#f0f9ff' : 'transparent',
    }}>
      {/* Color dot — shows car color if assigned, gray if not */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: assigned && color ? color : '#e5e7eb',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: '13px', color: '#374151' }}>{person.name}</span>
    </div>
  )
}

function getCarColor(name, cars) {
  for (const car of cars) {
    if (car.driver.name === name) return car.color
    if (car.passengers.some(p => p.name === name)) return car.color
  }
  return null
}