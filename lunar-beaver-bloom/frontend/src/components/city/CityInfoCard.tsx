import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const CityInfoCard = () => {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Discover Downtown Berkeley
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-lg mb-2">A City of Innovation & Culture</h4>
          <p className="text-muted-foreground leading-relaxed">
            Downtown Berkeley pulses with intellectual energy and creative spirit. Home to the world-renowned 
            UC Berkeley campus, this vibrant neighborhood has been a hub of progressive thought, artistic 
            expression, and culinary innovation since the 1960s. From the iconic Telegraph Avenue to the 
            hidden gems tucked away in converted warehouses, every corner tells a story of rebellion, 
            creativity, and community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">150+</div>
            <div className="text-sm text-muted-foreground">Independent Businesses</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">1868</div>
            <div className="text-sm text-muted-foreground">Year Founded</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Cultural Energy</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">What Makes Berkeley Special</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Berkeley isn't just a place—it's a state of mind. Where farm-to-table dining was born, where 
            independent bookstores thrive, and where every café doubles as a community gathering space. 
            The streets are lined with murals, the air filled with the aroma of artisan coffee and fresh 
            sourdough, and conversations range from quantum physics to social justice. This is where ideas 
            become movements, and where every visit reveals something new.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CityInfoCard;