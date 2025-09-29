import { motion } from "framer-motion";
import { CheckCircle2, Flame, Target, Trophy } from "lucide-react";
import React from "react";

const StatSection = () => {
  const stats = [
    {
      value: "50K+",
      label: "Active Users",
      icon: <Trophy className="w-6 h-6" />,
    },
    {
      value: "2M+",
      label: "Tasks Completed",
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      value: "95%",
      label: "Goal Achievement",
      icon: <Target className="w-6 h-6" />,
    },
    {
      value: "30+",
      label: "Day Avg Streak",
      icon: <Flame className="w-6 h-6" />,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Join the Productivity Revolution
          </h2>
          <p className="text-xl text-purple-100">
            Thousands of users are already leveling up their daily routines
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex justify-center text-yellow-400 mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-purple-100">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatSection;
