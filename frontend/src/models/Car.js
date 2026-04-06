/**
 * Class representing a car with seats and a driver.
 */
class Car {
    /**
     * @param {Person} driver - The driver of the car
     * @param {number} seatCapacity - Total number of seats including driver
     */
    constructor(driver, seatCapacity) {
        this.driver = driver;
        this.seatCapacity = seatCapacity;

        // Flattened seats array: first element is driver, rest are empty initially
        this.seats = [driver, ...new Array(seatCapacity - 1).fill(undefined)];
        this.seatsTaken = 1; // driver counts as taken
    }

    /**
     * Add a person to the next available seat
     * @param {Person} person
     * @throws {Error} if car is full
     */
    addPerson(person) {
        const nextIndex = this.seats.findIndex(s => s === undefined);
        if (nextIndex === -1) {
            throw new Error("Cannot add person: car is full");
        }
        this.seats[nextIndex] = person;
        this.seatsTaken += 1;
    }

    /**
     * Remove a person by their seat index
     * @param {number} index - index in the seats array (0 is driver, cannot remove)
     * @returns {Person | null} removed person, or null if empty/driver
     */
    removePersonByIndex(index) {
        if (index === 0) return null; // cannot remove driver
        if (!this.seats[index]) return null; // empty seat

        const removed = this.seats[index];
        this.seats[index] = undefined;
        this.seatsTaken -= 1;
        return removed;
    }

    /**
     * Returns the number of open seats (excluding driver)
     */
    getAvailableSeats() {
        return this.seatCapacity - this.seatsTaken;
    }
}

export { Car };