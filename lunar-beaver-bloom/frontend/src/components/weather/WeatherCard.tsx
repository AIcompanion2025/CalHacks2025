import { Card, CardContent } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

const WeatherCard = () => {
  // Mock weather data (frontend-only)
  const weather = {
    temperature: 68,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 8
  };

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain')) return <CloudRain className="w-8 h-8" />;
    if (condition.includes('cloud')) return <Cloud className="w-8 h-8" />;
    return <Sun className="w-8 h-8" />;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{weather.temperature}°F</div>
            <div className="text-sm text-blue-100">{weather.condition}</div>
          </div>
          <div className="text-white/90">
            {getWeatherIcon()}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-blue-100">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>{weather.windSpeed} mph</span>
          </div>
          <div>Humidity: {weather.humidity}%</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;