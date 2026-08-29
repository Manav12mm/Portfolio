import "./styles/QuotesTicker.css";

const row1Quotes = [
  { emoji: "🧠", text: "I don't always test my code, but when I do, I do it in production." },
  { emoji: "♟️", text: "Rated 3640 ELO in Chess, but still gets checkmated by 'undefined is not a function'." },
  { emoji: "⚡", text: "It's not a bug — it's an undocumented feature under extreme pressure!" },
  { emoji: "🤖", text: "AI won't replace developers... but a developer using AI will!" },
  { emoji: "☕", text: "Coffee → Code → Bug → StackOverflow → Genius Fix → Repeat." },
];

const row2Quotes = [
  { emoji: "🚀", text: "My code works on my machine... shipping my machine to production!" },
  { emoji: "🕶️", text: "Why do programmers prefer dark mode? Because light attracts bugs!" },
  { emoji: "💡", text: "There are 10 types of people: those who understand binary and those who don't." },
  { emoji: "🎨", text: "CSS is like magic: 3 hours trying to center a div, and then it vanishes." },
  { emoji: "🎯", text: "Eat. Sleep. Code. Checkmate. Repeat." },
];

const QuotesTicker = () => {
  return (
    <div className="quotes-ticker-section">
      <div className="quotes-ticker-header">
        <h4>Words to <span>Code & Live</span> By</h4>
      </div>
      <div className="quotes-ticker-wrapper">
        {/* Row 1: Sliding Left */}
        <div className="quotes-marquee row-left">
          <div className="quotes-track">
            {[...row1Quotes, ...row1Quotes, ...row1Quotes].map((quote, idx) => (
              <div className="quote-pill" key={`r1-${idx}`}>
                <span className="quote-emoji">{quote.emoji}</span>
                <span className="quote-text">{quote.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Sliding Right */}
        <div className="quotes-marquee row-right">
          <div className="quotes-track">
            {[...row2Quotes, ...row2Quotes, ...row2Quotes].map((quote, idx) => (
              <div className="quote-pill alt" key={`r2-${idx}`}>
                <span className="quote-emoji">{quote.emoji}</span>
                <span className="quote-text">{quote.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotesTicker;
