import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
        thisBooking.clickedTable;
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        // console.log('getData params', params);

        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings
                + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events
                + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events
                + '?' + params.eventsRepeat.join('&'),
        };

        // console.log('getData urls', urls);
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function (allResponses) {
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsRepeatResponse.json(),
                    eventsCurrentResponse.json(),

                ]);
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        // console.log('thisBooking.booked', thisBooking.booked);

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            // console.log('loop', hourBlock);

            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }
        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }

            if (
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    render(element) {
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        // console.log(thisBooking.dom.wrapper);
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
        thisBooking.dom.bookTable = thisBooking.dom.wrapper.querySelector(select.booking.bookButton);

        // console.log(thisBooking.dom.datePicker);
        // console.log(thisBooking.dom.bookTable);
    }

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener('click', function () {
            // thisBooking.removeBookedTable();
        });
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener('updated', function () {
            // thisBooking.removeBookedTable();
        });

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
            thisBooking.removeBookedTable();
            // console.log('działa');
        });

        thisBooking.dom.floorPlan.addEventListener('click', function (event) {
            thisBooking.initTables(event);
        });

        thisBooking.dom.bookTable.addEventListener('click', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();
        });
    }

    initTables(event) {
        const thisBooking = this;

        const target = event.target;
        console.log(target);
        if (!target.classList.contains(classNames.booking.tableBooked)) {
            if (target.classList.contains(classNames.table.exist)) {
                for (let table of thisBooking.dom.tables) {
                    // target.classList.add(classNames.booking.selectedTable);
                    if (table.classList.contains(classNames.booking.selectedTable)) {
                        target.classList.toggle(classNames.booking.selectedTable);
                        table.classList.remove(classNames.booking.selectedTable);
                        // console.log('działa selected');
                    } else {
                        target.classList.toggle(classNames.booking.selectedTable);
                        // const clickedTable = table.getAttribute('data-table');
                        thisBooking.clickedTable = target.getAttribute('data-table');
                        console.log('włącza się else');
                    }
                }
                console.log(thisBooking);
            } else {
                thisBooking.clickedTable = null;
            }
        } else {

            alert('Stolik jest już zajęty. Wybierz inny');
        }
        console.log(thisBooking.clickedTable);
    }

    removeBookedTable() {
        const thisBooking = this;

        for (let table of thisBooking.dom.tables) {
            table.classList.remove(classNames.booking.selectedTable);
            thisBooking.clickedTable = null;
        }
    }

    sendBooking() {
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.bookings;

        const payload = {
            date: thisBooking.datePicker.correctValue,
            hour: thisBooking.hourPicker.correctValue,
            table: thisBooking.clickedTable,
            // duration: thisCart.subTotalPrice,
            ppl: thisBooking.peopleAmount.correctValue,
            starters: [],
            // phone: [],
            // address: fgfd,
        };
        // for (let prod of thisCart.products) {
        //     payload.products.push(prod.getData());
        // }

        // const options = {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(payload),
        // };

        // fetch(url, options);
        console.log('payload', payload);
    }
    // bookedTable() {
    //     const thisBooking = this;
    //     let table = document.getElementById('floor_plan');
    //     let selectedDiv;

    //     table.onclick = function (event) {
    //         let target = event.target;
    //         target.classList.add('selected');
    //         // highlight(target);
    //     }
    //     function highlight(div) {
    //         if (selectedDiv) {
    //             selectedDiv.classList.remove('selected');
    //         }
    //         selectedDiv = div;
    //         selectedDiv.classList.add('selected');
    //     }
    // }
}


export default Booking;
