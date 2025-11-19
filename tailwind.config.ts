
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Nature-inspired color palette
				soil: {
					light: '#e4d4c2',
					DEFAULT: '#9b7653',
					dark: '#654321',
					'50': '#f5f0e8',
					'100': '#e8dcc8',
					'200': '#d4c0a0',
					'300': '#b89d75',
					'400': '#9b7653',
					'500': '#8a6547',
					'600': '#6d4f35',
					'700': '#563d2a',
					'800': '#453023',
					'900': '#3a2720'
				},
				plant: {
					light: '#c1e1c1',
					DEFAULT: '#4CAF50',
					dark: '#2e7d32',
					'50': '#e8f5e9',
					'100': '#c8e6c9',
					'200': '#a5d6a7',
					'300': '#81c784',
					'400': '#66bb6a',
					'500': '#4caf50',
					'600': '#43a047',
					'700': '#388e3c',
					'800': '#2e7d32',
					'900': '#1b5e20'
				},
				earth: {
					clay: '#a7613b',
					loam: '#8f784b',
					sand: '#c2b280',
					brown: '#8b6f47',
					tan: '#d2b48c',
					'50': '#faf8f5',
					'100': '#f0ebe3',
					'200': '#ddd4c4',
					'300': '#c2b280',
					'400': '#a8936a',
					'500': '#8f784b',
					'600': '#7a6540',
					'700': '#655237',
					'800': '#564730',
					'900': '#4a3d2a'
				},
				nature: {
					green: {
						light: '#a5d6a7',
						DEFAULT: '#66bb6a',
						dark: '#388e3c'
					},
					brown: {
						light: '#d4c0a0',
						DEFAULT: '#9b7653',
						dark: '#6d4f35'
					},
					earth: {
						light: '#e8dcc8',
						DEFAULT: '#b89d75',
						dark: '#8a6547'
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'grow': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'grow': 'grow 0.5s ease-out'
			},
			fontFamily: {
				hindi: ['Poppins', 'sans-serif'],
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
