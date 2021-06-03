import {select, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

getData(){
    const thisBooking = this;

    const urls ={
        bookings: '',
        eventsCurrent: '',
        eventsRepeat: '',
        };

}

    render(element) {
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        // console.log(thisBooking.dom.datePicker);

        // console.log(thisBooking.dom.hoursAmount);
    }
    initWidgets(){
        const thisBooking = this;
        
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener('click', function(){

        });
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener('updated', function(){

        });

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        // thisBooking.dom.datePicker.addEventListener('click', function (){

        // });
        
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        // thisBooking.dom.hourPicker.addEventListener('click', function (){

        // });
    }
}


export default Booking;
