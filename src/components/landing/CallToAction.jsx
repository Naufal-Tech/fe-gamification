import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import React from "react";

const CallToAction = () => {
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Daily Routine?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands who have already gamified their productivity and
            achieved their goals
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-lg flex items-center justify-center"
            >
              Start Free Trial
              <ChevronRight className="w-5 h-5 ml-2" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-8 py-4 border-2 border-purple-400 text-purple-200 rounded-lg font-bold text-lg hover:bg-purple-500/10"
            >
              View Demo
            </motion.button>
          </div>

          <div className="mt-8 text-gray-400">
            <p>Free 14-day trial • No credit card required • Cancel anytime</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
