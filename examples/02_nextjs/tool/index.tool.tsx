// import { getCurrentStreamableUI } from '@/context'
// import { Spinner } from '@/components/spinner'
// import { LocationCard } from '@/components/location-card'
//
// export async function getWeather (
//   location: string
// ) {
//   console.log('Getting the weather for', location)
//   const ui = getCurrentStreamableUI()
//   if (ui) {
//     ui.update(
//       <div>
//         Getting the weather for {location}...
//       </div>
//     )
//   }
//   await new Promise(resolve => setTimeout(resolve, 1000))
//   if (ui) {
//     ui.update(
//       <div>
//         The weather in {location} is sunny!
//       </div>
//     )
//   }
//   return 'Sunny'
// }
//
// /**
//  * Get user's current location
//  *
//  * user's current location, if it's null, return 'San Francisco, CA'
//  */
// export async function getCurrentLocation () {
//   console.log('Getting current location')
//   const ui = getCurrentStreamableUI()
//   if (ui) {
//     ui.append(
//       <div>
//         Getting current location <Spinner/>
//       </div>
//     )
//   }
//   await new Promise(resolve => setTimeout(resolve, 1000))
//   // if (ui) {
//   //   ui.update(<LocationCard/>)
//   // }
//   return null
// }

import { getCurrentStreamableUI } from '@/context'

export async function getMyUserID () {
  const ui = getCurrentStreamableUI()!
  ui.update('Getting user ID...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  return '12345'
}

export async function showUserInfo (
  userId: string
) {
  const ui = getCurrentStreamableUI()!
  ui.update('Getting user info...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  ui.update(
    <div>
      User ID: {userId}
      <br/>
      Name: John Doe
    </div>
  )
  return `User ID: ${userId}\nName: John Doe\nEmail: alex@gmail.com\nPhone: 123-456-7890\nAddress: 123 Main St\nCity: San Francisco\nState: CA\nZip: 94105\nCountry: USA\n`
}

export function getWeather (
  address: string
) {
  return `The weather in ${address} is sunny!`
}