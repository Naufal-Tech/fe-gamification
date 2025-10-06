import { motion } from "framer-motion";
import { Flame, Target, Trophy, Zap } from "lucide-react";
import React from "react";

const FeatureSection = () => {
  const features = [
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Achievement System",
      description:
        "Unlock badges and trophies as you complete tasks and build streaks",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "XP & Leveling",
      description:
        "Earn experience points for every completed task and level up your profile",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Smart Goals",
      description: "Set and track meaningful goals with AI-powered suggestions",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: "Streak Tracking",
      description: "Build momentum with daily streaks and habit formation",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-900 via-gray-50 to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gamification That{" "}
            <span className="text-purple-600">Actually Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our scientifically-backed gamification system transforms mundane
            tasks into exciting challenges
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div
                className={`${feature.bgColor} ${feature.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
