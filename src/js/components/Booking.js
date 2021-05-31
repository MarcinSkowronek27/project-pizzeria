import {templates} from '../settings.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        // thisBooking.initWidgets();
    }

    render(element) {
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        console.log(thisBooking.dom.wrapper.innerHTML);
    }

}


export default Booking;
