import React from 'react';
import Timer from '../components/Timer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const Pomodoro: React.FC = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pomodoro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <Timer />
        </div>
      </CardContent>
    </Card>
  );
};

export default Pomodoro; 