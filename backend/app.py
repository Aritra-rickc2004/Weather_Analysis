from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Update this line

def analyze_sentiment(text):
    analysis = TextBlob(text)
    
    # Determine sentiment
    if analysis.sentiment.polarity > 0:
        sentiment = "positive"
    elif analysis.sentiment.polarity < 0:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return {
        'sentiment': sentiment,
        'polarity': analysis.sentiment.polarity,
        'subjectivity': analysis.sentiment.subjectivity
    }

def categorize_weather(text):
    categories = {
        'temperature': r'\b(?:hot|cold|warm|cool|degrees?|temperature)\b',
        'precipitation': r'\b(?:rain|snow|sleet|hail|shower|drizzle)\b',
        'wind': r'\b(?:wind|breeze|gust|storm)\b',
        'sky_condition': r'\b(?:sunny|cloudy|overcast|clear)\b'
    }
    
    results = {}
    for category, pattern in categories.items():
        if re.search(pattern, text.lower()):
            results[category] = True
    
    return results

def generate_recommendations(weather_data, sentiment_data):
    recommendations = []
    temp = weather_data.get('temp_c', 20)
    condition = weather_data.get('condition', '').lower()
    
    # Outdoor Activities
    if 15 <= temp <= 25 and 'rain' not in condition:
        recommendations.extend([
            {
                'icon': '🏃‍♂️',
                'title': 'Perfect for Exercise',
                'description': 'Ideal conditions for running, cycling, or outdoor workout.'
            },
            {
                'icon': '🌳',
                'title': 'Nature Activities',
                'description': 'Great weather for hiking, picnics, or garden visits.'
            }
        ])

    # Indoor Activities
    if 'rain' in condition or temp > 30 or temp < 10:
        recommendations.extend([
            {
                'icon': '🏠',
                'title': 'Indoor Wellness',
                'description': 'Perfect time for yoga, meditation, or home workouts.'
            },
            {
                'icon': '📚',
                'title': 'Learning Time',
                'description': 'Ideal conditions for reading or online courses.'
            }
        ])

    # Health & Wellness
    if temp > 30:
        recommendations.append({
            'icon': '💧',
            'title': 'Hydration Alert',
            'description': 'Remember to drink plenty of water and stay in shade.'
        })
    elif temp < 10:
        recommendations.append({
            'icon': '🧥',
            'title': 'Layer Up',
            'description': 'Wear warm clothes and protect against cold.'
        })

    # Mood-based Activities
    if sentiment_data['polarity'] < 0:
        recommendations.append({
            'icon': '🧘‍♀️',
            'title': 'Mood Boost',
            'description': 'Try some mood-lifting activities like music or art.'
        })

    # Productivity
    if 18 <= temp <= 24 and 'clear' in condition:
        recommendations.append({
            'icon': '💻',
            'title': 'Productivity Peak',
            'description': 'Perfect conditions for focused work or study.'
        })

    # Climate Action & Sustainability
    if temp > 30:
        recommendations.extend([
            {
                'icon': '🌱',
                'title': 'Energy Conservation',
                'description': 'Use natural ventilation when possible, minimize AC usage during peak hours.'
            },
            {
                'icon': '🌿',
                'title': 'Green Transport',
                'description': 'Consider walking or cycling for short distances to reduce carbon footprint.'
            }
        ])
    
    if 'rain' in condition:
        recommendations.append({
            'icon': '💧',
            'title': 'Water Conservation',
            'description': 'Collect rainwater for plants and garden use.'
        })
    
    if 'clear' in condition:
        recommendations.append({
            'icon': '☀️',
            'title': 'Solar Power',
            'description': 'Great day to utilize solar-powered devices and natural lighting.'
        })

    # Climate Awareness
    recommendations.append({
        'icon': '🌍',
        'title': 'Climate Impact',
        'description': f'Current temperature is {temp}°C. Track local climate patterns and contribute to weather monitoring.'
    })

    # Sustainable Living Tips
    if temp > 25 or temp < 15:
        recommendations.append({
            'icon': '♻️',
            'title': 'Eco-friendly Adaptation',
            'description': 'Use weather-appropriate, sustainable materials and clothing.'
        })

    return recommendations

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data.get('text', '')
    weather_data = data.get('weather_data', {})
    
    sentiment_result = analyze_sentiment(text)
    categories = categorize_weather(text)
    recommendations = generate_recommendations(weather_data, sentiment_result)
    
    return jsonify({
        'sentiment': sentiment_result,
        'categories': categories,
        'recommendations': recommendations
    })

if __name__ == '__main__':
    app.run(debug=True)