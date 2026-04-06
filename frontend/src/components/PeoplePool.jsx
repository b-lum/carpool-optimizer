// PeoplePool.jsx
// Left panel: unassigned Person instances.
// Styled like the dragon boat Roster panel — scrollable, searchable, draggable.

import { useState } from 'react'

export default function PeoplePool({ people, selected, onCellClick, dragHandler, usePublicOSRM, onToggleOSRM }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const filtered = searchTerm
    ? people.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : people

  const drivers = filtered.filter(p => p.driverStatus === true)
  const passengers = filtered.filter(p => p.driverStatus === false)

  return (
    <div style={{
      width: '180px',
      flexShrink: 0,
      borderRight: '1px solid #e5e7eb',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Unassigned · {people.length}
          </div>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            title="Settings"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', borderRadius: '4px', lineHeight: 1,
              color: settingsOpen ? '#2563eb' : '#9ca3af',
              fontSize: '14px',
            }}
          >
            ⚙
          </button>
        </div>

        {/* Settings panel */}
        {settingsOpen && (
          <div style={{
            marginBottom: '8px',
            padding: '8px 10px',
            background: '#f3f4f6',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Routing
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div
                onClick={onToggleOSRM}
                style={{
                  width: '32px', height: '18px', borderRadius: '9px', flexShrink: 0,
                  background: usePublicOSRM ? '#2563eb' : '#d1d5db',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: usePublicOSRM ? '16px' : '2px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.3 }}>
                {usePublicOSRM ? 'Public OSRM' : 'Local server'}
              </span>
            </label>
            {usePublicOSRM && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                Uses router.project-osrm.org — no local server needed, rate limited.
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            boxSizing: 'border-box',
            outline: 'none',
            background: '#fff',
          }}
        />
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {drivers.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Drivers
            </div>
            {drivers.map((p, i) => (
              <PoolPersonCell
                key={p.name}
                person={p}
                isSelected={selected?.personName === p.name && selected?.type === 'pool'}
                dragProps={dragHandler({ type: 'pool' }, i, p)}
                onClick={() => onCellClick({ type: 'pool' }, i, p)}
              />
            ))}
          </div>
        )}

        {passengers.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Passengers
            </div>
            {passengers.map((p, i) => (
              <PoolPersonCell
                key={p.name}
                person={p}
                isSelected={selected?.personName === p.name && selected?.type === 'pool'}
                dragProps={dragHandler({ type: 'pool' }, drivers.length + i, p)}
                onClick={() => onCellClick({ type: 'pool' }, drivers.length + i, p)}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ fontSize: '12px', color: '#d1d5db', textAlign: 'center', marginTop: '20px' }}>
            {people.length === 0 ? "Everyone's assigned!" : 'No results'}
          </div>
        )}
      </div>
    </div>
  )
}

function PoolPersonCell({ person, isSelected, dragProps, onClick }) {
  return (
    <div
      draggable
      onClick={onClick}
      {...dragProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        marginBottom: '2px',
        borderRadius: '6px',
        border: `1px solid ${isSelected ? '#2563eb' : '#e5e7eb'}`,
        background: isSelected ? '#eff6ff' : '#fff',
        cursor: 'grab',
        userSelect: 'none',
        fontSize: '12px',
        fontWeight: 500,
        color: isSelected ? '#2563eb' : '#374151',
        transition: 'all 0.12s ease',
      }}
    >
      <span style={{ opacity: 0.5, fontSize: '10px' }}>
        {person.driverStatus ? '🚗' : '👤'}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {person.name}
      </span>
    </div>
  )
}