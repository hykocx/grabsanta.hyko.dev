export const metadata = {
	title: "Grab Santa 🎅",
	description: "A festive Santa catching game made with Next.js and Tailwind CSS, featuring an arcade-style high score system.",
};

export default function layout({ children }) {
	return (
		<html>
			<body className="antialiased bg-black text-white">
                {children}
			</body>
		</html>
	);
}

