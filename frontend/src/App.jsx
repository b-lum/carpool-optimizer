// App.jsx
import { useState, useCallback } from 'react'
import MapView from './components/MapView'
import RosterImporter from './components/RosterImporter'
import CarBuilder from './components/CarBuilder'
import DestinationPicker from './components/DestinationPicker'
import OptimizeButton from './components/OptimizeButton'
import RoutePanel from './components/RoutePanel'
import CarGrid from './components/CarGrid'
import PeoplePool from './components/PeoplePool'
import { Car } from './models/Car'
import { Person } from './models/Person'
import { Roster } from './models/Roster'

export default function App() {
  const [roster, setRoster] = useState(new Roster())
  const [carInstances, setCarInstances] = useState([])
  const [destination, setDestination] = useState(null)
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  // sidelined: Set of emails — people excluded from auto-assign
  const [sidelined, setSidelined] = useState(new Set())
  const [usePublicOSRM, setUsePublicOSRM] = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const findByEmail = email => roster.get(email)
  const findByName = name => roster.toArray().find(p => p.name === name) ?? null

  // ── Load roster ────────────────────────────────────────────────────────────
  function handleRoster(rawPeople) {
    let next = new Roster()
    for (const p of rawPeople) {
      const person = new Person(p.name, p.email, p.address, p.status === 'Driver', [p.lat, p.lon])
      next = next.add(person)
    }
    setRoster(next)
    setCarInstances([])
    setSelected(null)
  }

  // ── Unassigned pool ────────────────────────────────────────────────────────
  const assignedNames = new Set(
    carInstances.flatMap(car => car.seats.filter(Boolean).map(p => p.name))
  )
  const unassigned = roster.toArray().filter(p => !assignedNames.has(p.name) && !sidelined.has(p.email))
  const sidelinedPeople = roster.toArray().filter(p => sidelined.has(p.email))

  // ── Car helpers ────────────────────────────────────────────────────────────
  function cloneCar(car) {
    const c = Object.create(Object.getPrototypeOf(car))
    Object.assign(c, car)
    c.seats = [...car.seats]
    return c
  }

  function addPersonToCar(car, person) {
    const index = car.seats.findIndex(s => !s)
    if (index === -1) return false
    car.seats[index] = person
    car.seatsTaken += 1
    return true
  }

  function removePersonFromCar(car, personName) {
    const index = car.seats.findIndex(s => s?.name === personName)
    if (index <= 0) return false // cannot remove driver or empty
    car.seats[index] = undefined
    car.seatsTaken -= 1
    return true
  }

  // ── Handle assignment from OptimizeButton ──────────────────────────────────
  function handleAssigned(assignedCars) {
    setCarInstances(prev => {
      const next = prev.map(c => cloneCar(c))

      for (const lc of assignedCars) {
        const car = next.find(c => c.id === lc.id)
        if (!car) continue

        const alreadyIn = new Set(car.seats.filter(Boolean).map(p => p.name))

        for (const legacyPassenger of lc.passengers) {
          if (alreadyIn.has(legacyPassenger.name)) continue

          const person =
            (legacyPassenger.email ? findByEmail(legacyPassenger.email) : null)
            ?? findByName(legacyPassenger.name)
            ?? legacyPassenger

          addPersonToCar(car, person)
          alreadyIn.add(person.name)
        }
      }

      return next
    })

    setSelected(null)
  }

  // ── Move people between pool and cars ──────────────────────────────────────
  const movePerson = useCallback(({ from, to }) => {
    setCarInstances(prev => {
      const next = prev.map(c => cloneCar(c))
      let person = null
      let fromCar = null
      let toCar = null

      if (from.type === 'pool') {
        person = findByName(from.personName)
      } else if (from.type === 'seat') {
        fromCar = next.find(c => c.id === from.carId)
        if (!fromCar) return prev
        person = fromCar.seats[from.index]
      }

      if (!person) return prev
      if (to.type === 'seat') {
        toCar = next.find(c => c.id === to.carId)
        if (!toCar) return prev
      }

      // Pool → Seat
      if (from.type === 'pool' && to.type === 'seat') {
        addPersonToCar(toCar, person)
        return next
      }

      // Seat → Pool
      if (from.type === 'seat' && to.type === 'pool') {
        removePersonFromCar(fromCar, person.name)
        return next
      }

      // Seat → Seat
      if (from.type === 'seat' && to.type === 'seat') {
        const targetPerson = toCar.seats[to.index]
        removePersonFromCar(fromCar, person.name)
        if (targetPerson) {
          removePersonFromCar(toCar, targetPerson.name)
          addPersonToCar(fromCar, targetPerson)
        }
        addPersonToCar(toCar, person)
        return next
      }

      return prev
    })
    setSelected(null)
  }, [roster])

  function sidelinePerson(person) {
    setSidelined(prev => new Set([...prev, person.email]))
    setSelected(null)
  }

  function unsidelinePerson(person) {
    setSidelined(prev => {
      const next = new Set(prev)
      next.delete(person.email)
      return next
    })
    setSelected(null)
  }

  function handleSidelineDrop(e) {
    e.preventDefault()
    const from = JSON.parse(e.dataTransfer.getData('application/json'))
    if (from.type === 'pool') {
      const person = findByName(from.personName)
      if (person) sidelinePerson(person)
    } else if (from.type === 'seat') {
      const car = carInstances.find(c => c.id === from.carId)
      const person = car?.seats[from.index]
      if (car && person) {
        setCarInstances(prev => {
          const next = prev.map(c => cloneCar(c))
          const fc = next.find(c => c.id === from.carId)
          if (fc) removePersonFromCar(fc, person.name)
          return next
        })
        sidelinePerson(person)
      }
    }
  }

  // ── Drag & Click handlers ──────────────────────────────────────────────────
  const dragHandler = useCallback((meta, index, person) => ({
    onDragStart: e => {
      e.dataTransfer.effectAllowed = 'move'
      const from = { ...meta, index, personName: person?.name ?? null }
      e.dataTransfer.setData('application/json', JSON.stringify(from))
    },
    onDragEnter: e => e.preventDefault(),
    onDragOver: e => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },
    onDrop: e => {
      e.preventDefault()
      const from = JSON.parse(e.dataTransfer.getData('application/json'))
      const to = { ...meta, index, personName: person?.name ?? null }
      movePerson({ from, to })
    },
  }), [movePerson])

  const handleCellClick = useCallback((meta, index, person) => {
    if (!selected && person) {
      setSelected({ ...meta, index, personName: person.name })
      return
    }
    if (selected) {
      movePerson({ from: selected, to: { ...meta, index } })
      setSelected(null)
    }
  }, [selected, movePerson])

  const handlePoolClick = useCallback((meta, index, person) => {
    if (!selected && person) {
      setSelected({ type: 'pool', index, personName: person.name })
      return
    }
    if (selected?.type === 'seat') {
      movePerson({ from: selected, to: { type: 'pool' } })
    }
  }, [selected, movePerson])

  // ── Legacy shape for OptimizeButton / RoutePanel ──────────────────────────
  const legacyCars = carInstances.map(car => ({
    id: car.id,
    driver: {
      ...car.driver,
      lat: car.driver.geolocation?.[0],
      lon: car.driver.geolocation?.[1],
    },
    color: car.color,
    capacity: car.seatCapacity,
    passengers: car.seats
      .slice(1)
      .filter(Boolean)
      .map(p => ({ ...p, lat: p.geolocation?.[0], lon: p.geolocation?.[1] })),
  }))

  const flatRoster = roster.toArray().filter(p => !sidelined.has(p.email)).map(p => ({
    name: p.name,
    email: p.email,
    address: p.address,
    status: p.driverStatus ? 'Driver' : 'Passenger',
    lat: p.geolocation?.[0],
    lon: p.geolocation?.[1],
  }))

  const rosterPeople = roster.toArray()

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <PeoplePool
        people={unassigned}
        selected={selected}
        onCellClick={handlePoolClick}
        dragHandler={dragHandler}
        usePublicOSRM={usePublicOSRM}
        onToggleOSRM={() => setUsePublicOSRM(o => !o)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          overflowX: 'auto',
          flexShrink: 0,
        }}>
          <TopSection title="1. Import Roster">
            <RosterImporter onRoster={handleRoster} />
            {roster.size > 0 && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                {roster.size} loaded · {rosterPeople.filter(p => p.driverStatus).length} drivers
              </div>
            )}
          </TopSection>

          <TopSection title="2. Destination">
            <DestinationPicker onDestination={setDestination} destination={destination} />
          </TopSection>

          <TopSection title="3. Build Cars">
            <CarBuilder
              roster={flatRoster}
              cars={legacyCars}
              setCars={(updater) => {
                const nextLegacy = typeof updater === 'function' ? updater(legacyCars) : updater
                const nextInstances = nextLegacy.map(lc => {
                  const existing = carInstances.find(c => c.id === lc.id)
                  if (existing) return existing
                  const driverPerson =
                    (lc.driver.email ? findByEmail(lc.driver.email) : null)
                    ?? findByName(lc.driver.name)
                    ?? lc.driver
                  const car = new Car(driverPerson, lc.capacity)
                  car.color = lc.color
                  car.id = lc.id
                  return car
                })
                setCarInstances(nextInstances)
              }}
            />
          </TopSection>

          <TopSection title="4. Fill &amp; Optimize">
            <OptimizeButton
              cars={legacyCars}
              roster={flatRoster}
              destination={destination}
              onRoutes={setRoutes}
              onAssigned={handleAssigned}
              onLoading={setLoading}
              onError={setError}
              usePublicOSRM={usePublicOSRM}
            />
            {error && <div style={{ marginTop: '6px', fontSize: '12px', color: '#b91c1c' }}>{error}</div>}
            {loading && <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>Optimizing…</div>}
          </TopSection>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          background: '#f3f4f6', display: 'flex',
          flexWrap: 'wrap', gap: '30px', alignContent: 'flex-start',
        }}>
          {carInstances.length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: '14px', margin: 'auto' }}>
              Add cars above to see seat grids here.
            </div>
          )}
          {carInstances.length > 0 && (
            <div style={{ width: '100%', fontSize: '12px', color: '#9ca3af' }}>
              {carInstances.reduce((sum, car) => sum + car.getAvailableSeats(), 0)} open seats
              across {carInstances.length} car{carInstances.length !== 1 ? 's' : ''}
            </div>
          )}
          {carInstances.map(car => (
            <CarGrid
              key={car.id}
              car={car}
              selected={selected}
              dragHandler={dragHandler}
              onCellClick={handleCellClick}
              onRemove={(index) => {
                setCarInstances(prev => {
                  const next = prev.map(c => cloneCar(c))
                  const fc = next.find(c => c.id === car.id)
                  if (fc) removePersonFromCar(fc, fc.seats[index]?.name)
                  return next
                })
                setSelected(null)
              }}
            />
          ))}

          {/* Sidelined — people excluded from auto-assign */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleSidelineDrop}
            style={{
              width: '100%',
              minHeight: '80px',
              marginTop: '10px',
              borderRadius: '10px',
              border: '2px dashed #d1d5db',
              background: '#fff',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Sidelined · {sidelinedPeople.length} — drag here to exclude from optimize
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sidelinedPeople.map(p => (
                <div
                  key={p.email}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'pool', personName: p.name }))
                    unsidelinePerson(p)
                  }}
                  onClick={() => unsidelinePerson(p)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {p.name}
                </div>
              ))}
              {sidelinedPeople.length === 0 && (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>Drop people here to bench them</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '500px', flexShrink: 0, borderLeft: '1px solid #e5e7eb', position: 'relative' }}>
        <MapView routes={routes} destination={destination} />
        {routes.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            maxHeight: '40%', overflowY: 'auto',
            background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px',
          }}>
            <RoutePanel routes={routes} cars={legacyCars} />
          </div>
        )}
      </div>
    </div>
  )
}

function TopSection({ title, children }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRight: '1px solid #e5e7eb',
      minWidth: '200px',
      maxWidth: '260px',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}