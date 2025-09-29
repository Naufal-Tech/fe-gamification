import { motion } from "framer-motion";
import { Award, Flame, Play, Sparkles, Star, Target } from "lucide-react";
import React, { useState } from "react";
import GameifiedTaskDemo from "./GameifiedTaskDemo";

const HeroSection = () => {
  const [streakCount] = useState(7);
  const [xpPoints] = useState(1250);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-20 lg:py-32">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center px-6 py-3 bg-purple-500/20 backdrop-blur-sm rounded-full text-purple-200 text-sm font-medium border border-purple-400/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Level Up Your Productivity
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Turn Tasks Into
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mt-2">
                Epic Quests
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Transform your daily routine into an adventure. Complete tasks, earn
            XP, unlock achievements, and build lasting habits through
            gamification.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            >
              <Play className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
              Start Your Quest
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-10 py-5 border-2 border-purple-400 text-purple-200 text-lg font-bold rounded-xl hover:bg-purple-500/20 backdrop-blur-sm transition-all"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Demo Interface and Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Stats */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="space-y-6"
            >
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-center text-orange-400 mb-3">
                  <Flame className="w-8 h-8 mr-3" />
                  <span className="font-bold text-4xl">{streakCount}</span>
                </div>
                <p className="text-gray-300 text-lg font-medium">Day Streak</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-center text-emerald-400 mb-3">
                  <Target className="w-8 h-8 mr-3" />
                  <span className="font-bold text-4xl">98%</span>
                </div>
                <p className="text-gray-300 text-lg font-medium">
                  Success Rate
                </p>
              </div>
            </motion.div>

            {/* Center Demo Interface */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="flex justify-center"
            >
              <GameifiedTaskDemo />
            </motion.div>

            {/* Right Stats */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="space-y-6"
            >
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-center text-yellow-400 mb-3">
                  <Star className="w-8 h-8 mr-3" />
                  <span className="font-bold text-4xl">
                    {xpPoints.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300 text-lg font-medium">XP Points</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-center text-blue-400 mb-3">
                  <Award className="w-8 h-8 mr-3" />
                  <span className="font-bold text-4xl">23</span>
                </div>
                <p className="text-gray-300 text-lg font-medium">
                  Achievements
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
