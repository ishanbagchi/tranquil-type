export interface Quote {
	text: string
	author: string
	source?: string
}

export const quotes: Quote[] = [
	{
		text: 'The only way to do great work is to love what you do.',
		author: 'Steve Jobs',
	},
	{
		text: 'In the middle of every difficulty lies opportunity.',
		author: 'Albert Einstein',
	},
	{
		text: 'It does not matter how slowly you go as long as you do not stop.',
		author: 'Confucius',
	},
	{
		text: "Life is what happens when you're busy making other plans.",
		author: 'John Lennon',
	},
	{
		text: 'The future belongs to those who believe in the beauty of their dreams.',
		author: 'Eleanor Roosevelt',
	},
	{
		text: 'It is during our darkest moments that we must focus to see the light.',
		author: 'Aristotle',
	},
	{
		text: 'Whoever is happy will make others happy too.',
		author: 'Anne Frank',
	},
	{
		text: 'Do not go where the path may lead, go instead where there is no path and leave a trail.',
		author: 'Ralph Waldo Emerson',
	},
	{
		text: 'You will face many defeats in life, but never let yourself be defeated.',
		author: 'Maya Angelou',
	},
	{
		text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
		author: 'Nelson Mandela',
	},
	{
		text: "In the end, it's not the years in your life that count. It's the life in your years.",
		author: 'Abraham Lincoln',
	},
	{
		text: 'Never let the fear of striking out keep you from playing the game.',
		author: 'Babe Ruth',
	},
	{
		text: 'Life is either a daring adventure or nothing at all.',
		author: 'Helen Keller',
	},
	{
		text: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
		author: 'Thomas A. Edison',
	},
	{
		text: 'You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.',
		author: 'Dr. Seuss',
	},
	{
		text: 'If life were predictable it would cease to be life and be without flavor.',
		author: 'Eleanor Roosevelt',
	},
	{
		text: 'If you want to live a happy life, tie it to a goal, not to people or things.',
		author: 'Albert Einstein',
	},
	{
		text: 'Never let the fear of striking out keep you from playing the game.',
		author: 'Babe Ruth',
	},
	{
		text: "Money and success don't change people; they merely amplify what is already there.",
		author: 'Will Smith',
	},
	{
		text: "Your time is limited, so don't waste it living someone else's life.",
		author: 'Steve Jobs',
	},
	{
		text: 'Not how long, but how well you have lived is the main thing.',
		author: 'Seneca',
	},
	{
		text: "If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough.",
		author: 'Oprah Winfrey',
	},
	{
		text: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
		author: 'James Cameron',
	},
	{
		text: 'You only live once, but if you do it right, once is enough.',
		author: 'Mae West',
	},
	{
		text: 'The two most important days in your life are the day you are born and the day you find out why.',
		author: 'Mark Twain',
	},
	{
		text: 'The secret of getting ahead is getting started.',
		author: 'Mark Twain',
	},
	{
		text: "It always seems impossible until it's done.",
		author: 'Nelson Mandela',
	},
	{
		text: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
		author: 'Robert Louis Stevenson',
	},
	{
		text: 'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
		author: 'Mother Teresa',
	},
	{
		text: 'When you reach the end of your rope, tie a knot in it and hang on.',
		author: 'Franklin D. Roosevelt',
	},
]

export function getRandomQuote(): Quote {
	return quotes[Math.floor(Math.random() * quotes.length)]
}
