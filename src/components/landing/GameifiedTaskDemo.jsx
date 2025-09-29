import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Plus, Star } from "lucide-react";
import React, { useState } from "react";

const GameifiedTaskDemo = () => {
  const [tasks] = useState([
    { id: 1, text: "Complete morning workout", completed: true, xp: 50 },
    { id: 2, text: "Finish project proposal", completed: false, xp: 100 },
    { id: 3, text: "Read 30 pages", completed: false, xp: 30 },
    { id: 4, text: "Meditate for 15 minutes", completed: true, xp: 25 },
  ]);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalXP = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.xp, 0);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Today's Quests</h3>
        <div className="flex items-center text-yellow-600">
          <Star className="w-5 h-5 mr-1" />
          <span className="font-bold">{totalXP} XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Daily Progress</span>
          <span>
            {completedTasks}/{tasks.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedTasks / tasks.length) * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center p-3 rounded-lg border-2 ${
                task.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200 hover:border-purple-300"
              } cursor-pointer transition-all`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                  task.completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-purple-500"
                }`}
              >
                {task.completed && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span
                className={`flex-1 ${
                  task.completed
                    ? "text-gray-500 line-through"
                    : "text-gray-800"
                }`}
              >
                {task.text}
              </span>
              <div className="flex items-center text-yellow-600">
                <Star className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{task.xp}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Task Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New Quest
      </motion.button>
    </div>
  );
};

export default GameifiedTaskDemo;
