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
					DEFAULT: '#4361ee', // Updated to match mockups
					light: '#EEF1FF',
					dark: '#3048C9',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: '#34A853', // Health green 
					foreground: 'white'
				},
				accent: {
					DEFAULT: '#F5B400', // Warning/highlight yellow
					foreground: 'black'
				},
				destructive: {
					DEFAULT: '#EA4335', // Error/alert red
					foreground: 'white'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
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
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite'
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: '100%',
						color: 'inherit',
						a: {
							color: 'var(--primary)',
							'&:hover': {
								color: 'var(--primary-dark)',
							},
							textDecoration: 'none',
						},
						h1: {
							color: 'var(--primary)',
							fontWeight: '700',
						},
						h2: {
							color: 'var(--primary)',
							fontWeight: '600',
						},
						h3: {
							color: 'var(--primary)',
							fontWeight: '600',
						},
						h4: {
							color: 'var(--primary)',
							fontWeight: '600',
						},
						code: {
							color: 'var(--primary)',
							backgroundColor: 'var(--primary-light)',
							padding: '0.25rem',
							borderRadius: '0.25rem',
							fontWeight: '500',
						},
						'code::before': {
							content: '""',
						},
						'code::after': {
							content: '""',
						},
						pre: {
							backgroundColor: 'var(--primary-light)',
							color: 'var(--primary)',
							borderRadius: '0.5rem',
							padding: '1rem',
						},
					},
				},
			},
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/typography"),
	],
} satisfies Config;
