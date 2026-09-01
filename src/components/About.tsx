import "./styles/About.css";
import { config } from "../config";

const About = () => {
  const paragraphs = Array.isArray(config.about.description)
    ? config.about.description
    : [config.about.description];

  return (
    <div className="about-section" id="about">
      <div className="about-container">
        <div className="about-me">
          <h3 className="title">{config.about.title}</h3>
          {paragraphs.map((para, index) => (
            <p key={index} className="para">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
