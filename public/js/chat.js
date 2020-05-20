// // created a client side socket.io
// const socket = io()

// // Elements
// const $messageForm = document.querySelector('#message-form')
// const $messageFormInput = $messageForm.querySelector('input')
// const $messageFormButton = $messageForm.querySelector('button')
// const $sendButton = document.querySelector('#send-location')
// const $messages = document.querySelector('#messages')

// //Templates
// const messageTemplate = document.querySelector('#message-template').innerHTML
// const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML

// //Options
// //ignore ?
// const { username, room } = QS.parse(location.search, { ignoreQueryPrefix: true})


// // Listening for message event and a message is passed as argument
// socket.on('message', (message) => {
//     console.log(message)

//     //rendering the message to be sent to html
//     const html = Mustache.render(messageTemplate, {
//         message: message
//     })

//     //beforeend specifies that the new msg is inserted in bottom after previous message
//     $messages.insertAdjacentHTML('beforeend', html)
// })

// // Listening for locationMessage event and a message is passed as argument(string)
// socket.on('locationMessage' , (url) => {
//     console.log(url)

//         //rendering the message to be sent to html
//     const html = Mustache.render(locationMessageTemplate, {
//         url: url
//     })

//         //beforeend specifies that the new msg is inserted in bottom after previous message
//     $messages.insertAdjacentHTML('beforeend', html)

// })


// //adding event listener on submit button
// $messageForm.addEventListener('submit', (e) => {

//     // to prevent the default behaviour
//     e.preventDefault()

//     //disabling the button after submit button is pressed
//     $messageFormButton.setAttribute('disabled', 'disabled')
    
//     //getting the message value from input field in index.html
//     const message = e.target.elements.message.value

//     //emitting a sendMessage event with message and error callback
//     socket.emit('sendMessage', message, (error) => {
        
//         // if a message is sent then button is re-enabled
//         $messageFormButton.removeAttribute('disabled')

//         //clearing the form field and putting focus back on formInput field
//         $messageFormInput.value = ''
//         $messageFormInput.focus()


//         if (error) {
//             return console.log(error)
//         }
//         // If no error is passed in callback that means message was delivered successfully.
//         console.log('The message was delivered')
//     })
// })

// //click event listener on sendLocation Button
// $sendButton.addEventListener('click', () => {

//      if (!navigator.geolocation) {
//             return alert('Geo Location is not supported by your browser')
//      }

//      //If locationsend button is pressed once it will be disabled
//      $sendButton.setAttribute('disabled', 'disabled')

//      //If we are able to get location of user emit sendLocation Event and pass latitude and longiitude
//      navigator.geolocation.getCurrentPosition((position) => {
//        // console.log(position)
//         socket.emit('sendLocation', {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude
//         }, (acknowledgment) => {

//             // If acknowledgement is recieved re-enable the sendLocation button
//             $sendButton.removeAttribute('disabled')
//             console.log(acknowledgment)
//         })
//      })
// })

// socket.emit('join', {username, room})


const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }



}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href ='/'
    }
})