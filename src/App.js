import React, { useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherImpact, setWeatherImpact] = useState({
    productivity: 0,
    comfort: 0,
    activity: 0,
    recommendations: []
  });

  // Add back the quickPhrases array
  const quickPhrases = [
    "Sunny and warm",
    "Heavy rain",
    "Cloudy with light breeze",
    "Thunderstorm approaching",
    "Perfect spring weather"
  ];

  // Add back handleQuickPhrase function
  const handleQuickPhrase = (phrase) => {
    setText(phrase);
  };

  // Add back handleAnalyze function
  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          weather_data: {
            temp_c: weatherData?.current?.temp_c,
            condition: weatherData?.current?.condition?.text
          }
        }),
      });
      const data = await response.json();
      setResults(data);
      // Calculate weather impact based on sentiment and weather data
      calculateWeatherImpact(data, weatherData);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  // Add new function to calculate weather impact
  const calculateWeatherImpact = (sentimentData, weather) => {
    if (!weather) return;

    const temp = weather.current.temp_c;
    const condition = weather.current.condition.text.toLowerCase();

    // Example logic for calculating impacts
    const productivity = calculateProductivity(temp, condition, sentimentData.sentiment.polarity);
    const comfort = calculateComfort(temp, weather.current.humidity);
    const activity = calculateActivityScore(condition, temp);
    const recommendations = generateRecommendations(temp, condition);

    setWeatherImpact({
      productivity,
      comfort,
      activity,
      recommendations
    });
  };

  // Helper functions for calculations
  const calculateProductivity = (temp, condition, sentiment) => {
    // Simple example logic
    let score = 0.5;
    if (temp >= 18 && temp <= 24) score += 0.3;
    if (!condition.includes('rain') && !condition.includes('storm')) score += 0.2;
    return Math.min(Math.max(score + sentiment * 0.2, 0), 1);
  };

  const calculateComfort = (temp, humidity) => {
    // Simple comfort calculation
    const idealTemp = 21;
    const tempFactor = 1 - Math.abs(temp - idealTemp) / 20;
    const humidityFactor = 1 - Math.abs(humidity - 50) / 100;
    return Math.min(Math.max((tempFactor + humidityFactor) / 2, 0), 1);
  };

  const calculateActivityScore = (condition, temp) => {
    // Simple activity score calculation
    let score = 0.5;
    if (temp >= 15 && temp <= 25) score += 0.3;
    if (!condition.includes('rain') && !condition.includes('storm')) score += 0.2;
    return score;
  };

  const generateRecommendations = (temp, condition) => {
    const recs = [];
    
    if (temp >= 15 && temp <= 25 && !condition.includes('rain')) {
      recs.push({
        icon: "🏃‍♂️",
        title: "Perfect for Running",
        description: "Clear skies and moderate temperature make it ideal for outdoor exercise."
      });
    }

    if (!condition.includes('rain') && !condition.includes('storm')) {
      recs.push({
        icon: "🌳",
        title: "Park Visit",
        description: "Great conditions for a relaxing walk in the park."
      });
    }

    // Add indoor activities for bad weather
    if (condition.includes('rain') || condition.includes('storm')) {
      recs.push({
        icon: "🏠",
        title: "Indoor Activities",
        description: "Perfect time for indoor activities and relaxation."
      });
    }

    return recs;
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;
  
    setLoading(true);
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=62c706fcdb6d420899c164840253003&q=${encodeURIComponent(location)}&aqi=no`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      setWeatherData(data);
      
      // Generate weather description
      const weatherDescription = `The current weather in ${data.location.name} is ${data.current.condition.text.toLowerCase()} with a temperature of ${Math.round(data.current.temp_c)}°C. The humidity is ${data.current.humidity}% and wind speed is ${data.current.wind_kph} km/h. ${
        data.current.temp_c > 25 ? "It's quite warm today." :
        data.current.temp_c < 15 ? "It's rather cool today." :
        "The temperature is pleasant."
      }`;
      
      setText(weatherDescription);
    } catch (error) {
      console.error('Weather API Error:', error);
      alert('Failed to fetch weather data. Please check the city name and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Weather Sentiment Analyzer</h1>
        
        <div className="input-section">
          <form className="location-input" onSubmit={handleLocationSearch}>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter Indian city name"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Get Weather'}
            </button>
          </form>

          {weatherData && (
            <div className="current-weather">
              <h3>Current Weather in {weatherData.location.name}, {weatherData.location.region}</h3>
              <div className="weather-details">
                <p>
                  <span className="weather-icon">
                    <img src={weatherData.current.condition.icon} alt="weather icon" width="32" height="32" />
                  </span>
                  {weatherData.current.condition.text}
                </p>
                <p>🌡️ {Math.round(weatherData.current.temp_c)}°C</p>
                <p>💧 Humidity: {weatherData.current.humidity}%</p>
                <p>💨 Wind: {weatherData.current.wind_kph} km/h</p>
              </div>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the weather..."
            rows="4"
          />

          <div className="quick-input">
            {quickPhrases.map((phrase) => (
              <button 
                key={phrase}
                onClick={() => handleQuickPhrase(phrase)}
              >
                {phrase}
              </button>
            ))}
          </div>

          <div className="button-group">
            <button 
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Weather'}
            </button>
          </div>
        </div>

        {/* Replace the existing results section with this updated version */}
        {results && (
          <>
            <div className="results-section">
              <div className="sentiment-results">
                <h2>Sentiment Analysis</h2>
                <p>Overall: {results.sentiment.sentiment}</p>
                
                <div className="sentiment-meter">
                  <div 
                    className="sentiment-fill"
                    style={{
                      width: `${(results.sentiment.polarity + 1) * 50}%`,
                      backgroundColor: getSentimentColor(results.sentiment.polarity)
                    }}
                  />
                </div>
                
                <p>Polarity: {results.sentiment.polarity.toFixed(2)}</p>
                <p>Subjectivity: {results.sentiment.subjectivity.toFixed(2)}</p>
              </div>

              <div className="category-results">
                <h2>Weather Categories</h2>
                <ul>
                  {Object.entries(results.categories).map(([category]) => (
                    <li key={category}>
                      <span className="weather-icon">
                        {category.includes('sun') ? '☀️' : 
                         category.includes('rain') ? '🌧️' : 
                         category.includes('cloud') ? '☁️' : 
                         category.includes('wind') ? '💨' : 
                         category.includes('snow') ? '❄️' : '🌤️'}
                      </span>
                      {category.replace('_', ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {weatherImpact && (
              <>
                <div className="impact-section">
                  <h2>Weather Impact Analysis</h2>
                  <div className="impact-grid">
                    <div className="impact-card">
                      <div className="impact-icon">🎯</div>
                      <h3>Productivity</h3>
                      <div className="productivity-meter">
                        <div 
                          className="chart-fill"
                          style={{
                            width: `${weatherImpact.productivity * 100}%`,
                            background: '#4CAF50'
                          }}
                        />
                      </div>
                      <p>{Math.round(weatherImpact.productivity * 100)}% Optimal</p>
                    </div>
                    <div className="impact-card">
                      <div className="impact-icon">🌡️</div>
                      <h3>Comfort Level</h3>
                      <div className="productivity-meter">
                        <div 
                          className="chart-fill"
                          style={{
                            width: `${weatherImpact.comfort * 100}%`,
                            background: '#00b4db'
                          }}
                        />
                      </div>
                    </div>
                    <div className="impact-card">
                      <div className="impact-icon">🏃</div>
                      <h3>Activity Score</h3>
                      <div className="productivity-meter">
                        <div 
                          className="chart-fill"
                          style={{
                            width: `${weatherImpact.activity * 100}%`,
                            background: '#FFA726'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {results && results.recommendations && (
                  <div className="recommendation-panel">
                    <h2>Personalized Recommendations</h2>
                    <div className="recommendation-categories">
                      <div className="activity-suggestions">
                        <h3>Activities & Wellness</h3>
                        <div className="cards-grid">
                          {results.recommendations
                            .filter(rec => !['🌡️', '⚡', '🏘️', '📱', '🌱', '🚲', '📊', '🏡', '🌿'].includes(rec.icon))
                            .map((rec, index) => (
                              <div key={index} className="activity-card">
                                <div className="impact-icon">{rec.icon}</div>
                                <h3>{rec.title}</h3>
                                <p>{rec.description}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      <div className="climate-suggestions">
                        <h3>Climate Action & Sustainability</h3>
                        <div className="climate-categories">
                          <div className="climate-section">
                            <h4>Immediate Actions</h4>
                            <div className="cards-grid">
                              {results.recommendations
                                .filter(rec => ['🌡️', '⚡', '🌱', '🚲'].includes(rec.icon))
                                .map((rec, index) => (
                                  <div key={index} className="activity-card climate-card">
                                    <div className="impact-icon">{rec.icon}</div>
                                    <h3>{rec.title}</h3>
                                    <p>{rec.description}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                          
                          <div className="climate-section">
                            <h4>Resilience & Adaptation</h4>
                            <div className="cards-grid">
                              {results.recommendations
                                .filter(rec => ['🏘️', '📱', '🏡', '🌿'].includes(rec.icon))
                                .map((rec, index) => (
                                  <div key={index} className="activity-card climate-card resilience">
                                    <div className="impact-icon">{rec.icon}</div>
                                    <h3>{rec.title}</h3>
                                    <p>{rec.description}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                          
                          <div className="climate-section">
                            <h4>Climate Monitoring</h4>
                            <div className="cards-grid">
                              {results.recommendations
                                .filter(rec => ['📊', '🌡️', '📱'].includes(rec.icon) || rec.title.toLowerCase().includes('climate'))
                                .map((rec, index) => (
                                  <div key={index} className="activity-card climate-card monitoring">
                                    <div className="impact-icon">{rec.icon}</div>
                                    <h3>{rec.title}</h3>
                                    <p>{rec.description}</p>
                                    <div className="monitoring-stats">
                                      <span className="temp-data">🌡️ {weatherData?.current?.temp_c}°C</span>
                                      <span className="time-data">📅 {new Date().toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

const getSentimentColor = (polarity) => {
  if (polarity > 0.3) return '#4CAF50';
  if (polarity < -0.3) return '#f44336';
  return '#FFA726';
};