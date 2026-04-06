// optimize.js
// Fills remaining empty seats in cars with unassigned people.
// Mirrors the fill() function in Lineup.js:
//   - Keeps existing manual passenger assignments intact
//   - Only assigns truly unassigned people to open seats
//   - Uses distance-based greedy assignment (nearest car first)
//   - Orders pickup stops with nearest-neighbor routing

function distance(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function optimizeCarpool(cars, roster, destination) {

  // ── 1. Clone cars, preserving existing passenger assignments ──────────────
  const assigned = cars.map(c => ({
    ...c,
    passengers: [...c.passengers],
  }))

  // ── 2. Build set of already-assigned names ────────────────────────────────
  const assignedNames = new Set()
  for (const car of assigned) {
    assignedNames.add(car.driver.name)
    for (const p of car.passengers) assignedNames.add(p.name)
  }

  // ── 3. Group unassigned people by location ────────────────────────────────
  // Round to ~100m precision so people at the "same" address bucket together
  const locationKey = p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`

  const buckets = new Map()
  for (const person of roster) {
    if (assignedNames.has(person.name)) continue
    const key = locationKey(person)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(person)
  }

  // ── 4. Sort groups largest → smallest ────────────────────────────────────
  const groups = [...buckets.values()].sort((a, b) => b.length - a.length)

  // ── 5. Assign groups to cars greedily ────────────────────────────────────
  // For each group, find the car that:
  //   a) has enough open seats for the whole group, AND
  //   b) is closest to the group's location
  // If no car fits the whole group, find the car with the most open seats,
  // fill it as much as possible, and re-queue the remainder as a smaller group.
  const openSeats = car =>
    car.capacity - 1 - car.passengers.length

  const queue = [...groups]

  while (queue.length > 0) {
    const group = queue.shift()
    const representative = group[0] // use first person for distance calc

    // Find best car that fits the whole group
    let bestCar = null
    let bestDist = Infinity
    for (const car of assigned) {
      if (openSeats(car) < group.length) continue
      const dist = distance(representative, car.driver)
      if (dist < bestDist) {
        bestDist = dist
        bestCar = car
      }
    }

    if (bestCar) {
      // Whole group fits — assign them all
      for (const p of group) bestCar.passengers.push(p)
    } else {
      // No car fits the whole group — find the car with the most open seats
      // (closest among tied cars) and partially fill it, re-queue the rest
      let partialCar = null
      let mostOpen = 0
      let closestDist = Infinity
      for (const car of assigned) {
        const open = openSeats(car)
        if (open <= 0) continue
        const dist = distance(representative, car.driver)
        if (open > mostOpen || (open === mostOpen && dist < closestDist)) {
          mostOpen = open
          closestDist = dist
          partialCar = car
        }
      }

      if (partialCar) {
        const toAdd = group.slice(0, mostOpen)
        const remainder = group.slice(mostOpen)
        for (const p of toAdd) partialCar.passengers.push(p)
        if (remainder.length > 0) queue.push(remainder) // retry the rest
      }
      // if no car has any open seats at all, these people just don't get assigned
    }
  }

  // ── 6. Order pickup stops with nearest-neighbor for each car ──────────────
  for (const car of assigned) {
    if (car.passengers.length === 0) continue

    const ordered = []
    let current = car.driver
    const remaining = [...car.passengers]

    while (remaining.length > 0) {
      let nearestIdx = 0
      let nearestDist = Infinity
      for (let i = 0; i < remaining.length; i++) {
        const dist = distance(current, remaining[i])
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIdx = i
        }
      }
      ordered.push(remaining[nearestIdx])
      current = remaining[nearestIdx]
      remaining.splice(nearestIdx, 1)
    }

    car.passengers = ordered
  }

  return assigned
}