import type { MetadataRoute } from 'next'

// Lets "Add to Home Screen" install the page as an app that opens full screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Good Neighbour',
    short_name: 'Good Neighbour',
    description: 'Is your camera being a good neighbour? Finds what a Ring camera records that is not yours.',
    start_url: '/privacy',
    display: 'standalone',
    background_color: '#F5F5F5',
    theme_color: '#F5F5F5',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
  }
}
