import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

export default createVuetify({
  blueprint: md3,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#ffffff',
          surface: '#ffffff',
          'on-background': '#24282B',
          'on-surface': '#24282B',
          'surface-variant': '#f7f9f7',
          'on-surface-variant': '#687078',
          primary: '#17786b',
          'on-primary': '#ffffff',
          secondary: '#60796d',
          'on-secondary': '#ffffff',
          outline: '#e4eae6',
          'surface-accent': '#edf4ef',
          // The measurement card keeps its own contrasting surface and text colors.
          measurement: '#173f37',
          'measurement-end': '#245c50',
          'on-measurement': '#ffffff',
          'on-measurement-muted': '#c1dbd2',
          'measurement-highlight': '#a7dcb7',
          note: '#f8f7f2',
          'on-note': '#6b7464',
          'note-accent': '#697258',
          'note-outline': '#eeeade',
          error: '#b13a3a',
          'on-error': '#ffffff',
          'error-container': '#fff0ee',
          'on-error-container': '#b13a3a',
          shadow: '#1c392b',
        },
      },

      dark: {
        dark: true,
        colors: {
          background: '#121416',
          surface: '#1c1f22',
          'surface-variant': '#272b2e',
          'surface-accent': '#303638',
          // Text — neutral white and grey
          'on-background': '#f0f2f3',
          'on-surface': '#f0f2f3',
          'on-surface-variant': '#a5abb0',
          // Brand — preserve FitLog green
          primary: '#90d5bf',
          'on-primary': '#103a2e',
          secondary: '#acc4b7',
          'on-secondary': '#172d23',
          // Borders
          outline: '#41474a',
          // Measurement card — intentional green accent
          measurement: '#183e32',
          'measurement-end': '#245443',
          'on-measurement': '#f5faf7',
          'on-measurement-muted': '#cbd8d0',
          'measurement-highlight': '#a7dcb7',
          // Note card — neutral, subtle contrast
          note: '#262a2c',
          'on-note': '#e0e3e1',
          'note-accent': '#b5c692',
          'note-outline': '#404749',
          // Error states
          error: '#ffb4ab',
          'on-error': '#5f1414',
          'error-container': '#4a2523',
          'on-error-container': '#ffb4ab',
          shadow: '#000000',
        },
      },
    },
  },
})
