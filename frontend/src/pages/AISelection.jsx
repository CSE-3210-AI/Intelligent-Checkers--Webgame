import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ArrowRight, Brain, Zap, Target, Crown } from 'lucide-react';

const AISelection = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const navigate = useNavigate();

  const difficulties = [
    { 
      id: 'easy', 
      name: 'Easy', 
      desc: 'Perfect for beginners', 
      color: 'from-cyan-400 to-blue-600',
      icon: Zap,
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      ringColor: 'ring-cyan-600'
    },
    { 
      id: 'medium', 
      name: 'Medium', 
      desc: 'Balanced challenge', 
      color: 'from-sky-400 to-indigo-600',
      icon: Target,
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      ringColor: 'ring-indigo-600'
    },
    { 
      id: 'hard', 
      name: 'Hard', 
      desc: 'Advanced tactics', 
      color: 'from-indigo-500 to-violet-700',
      icon: Brain,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      ringColor: 'ring-violet-600'
    },
    { 
      id: 'expert', 
      name: 'Expert', 
      desc: 'Grandmaster level', 
      color: 'from-fuchsia-500 to-pink-700',
      icon: Crown,
      bgColor: 'bg-fuchsia-50',
      borderColor: 'border-fuchsia-200',
      ringColor: 'ring-pink-600'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 px-4 py-2 bg-blue-50 border-blue-200 text-blue-700">
            <Brain className="w-4 h-4 mr-2" />
            AI Opponent
          </Badge>
          
          <h1 className="cyber-heading text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Select AI Difficulty
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Choose your challenge level and test your skills against our intelligent AI
          </p>
        </div>

        {/* Difficulty Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {difficulties.map((diff) => {
            const IconComponent = diff.icon;
            return (
              <Card
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedDifficulty === diff.id
                    ? `ring-2 ${diff.ringColor} shadow-lg ${diff.borderColor} ${diff.bgColor}`
                    : 'hover:border-slate-300'
                }`}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-20 h-20 rounded-2xl mb-4 bg-gradient-to-br ${diff.color} flex items-center justify-center mx-auto shadow-lg`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{diff.name}</CardTitle>
                  <CardDescription className="text-base mt-2">{diff.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {diff.id === 'easy' && 'Recommended for beginners'}
                      {diff.id === 'medium' && 'Most popular'}
                      {diff.id === 'hard' && 'Challenging'}
                      {diff.id === 'expert' && 'For pros only'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="font-semibold w-full sm:w-auto"
          >
            <ChevronLeft className="mr-2 w-5 h-5" />
            Back
          </Button>
          <Button
            onClick={() => navigate('/game')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            Start Game
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AISelection;
