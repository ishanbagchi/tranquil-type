import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { TypingArea } from './components/TypingArea'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
	return (
		<ThemeProvider>
			<PreferencesProvider>
				<div className="min-h-screen flex flex-col bg-bg text-text transition-colors duration-300">
					<Header />
					<main className="flex-1 flex flex-col items-center justify-center py-8">
						<TypingArea />
					</main>
					<Footer />
				</div>
			</PreferencesProvider>
		</ThemeProvider>
	)
}

export default App
