import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code,
  Gamepad2,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  Rocket,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

const JoinUsPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  const positions = [
    {
      id: 1,
      title: "Senior Full-Stack Developer",
      department: "Engineering",
      type: "Full-time",
      location: "Remote / Jakarta",
      icon: <Code className="w-6 h-6" />,
      color: "purple",
      description:
        "Build cutting-edge gamification features that millions will use daily",
      requirements: [
        "5+ years React & Node.js experience",
        "Passion for gamification & user engagement",
        "Experience with real-time applications",
      ],
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      type: "Full-time",
      location: "Remote / Jakarta",
      icon: <Sparkles className="w-6 h-6" />,
      color: "blue",
      description:
        "Craft delightful experiences that make productivity feel like play",
      requirements: [
        "3+ years product design experience",
        "Strong portfolio in gamification UI/UX",
        "Proficiency in Figma and design systems",
      ],
    },
    {
      id: 3,
      title: "Growth Marketing Manager",
      department: "Marketing",
      type: "Full-time",
      location: "Hybrid / Jakarta",
      icon: <Rocket className="w-6 h-6" />,
      color: "orange",
      description:
        "Drive user acquisition and turn productivity into a movement",
      requirements: [
        "4+ years growth marketing experience",
        "Data-driven approach to campaigns",
        "Experience with SaaS products",
      ],
    },
    {
      id: 4,
      title: "Community Manager",
      department: "Community",
      type: "Full-time",
      location: "Remote",
      icon: <Users className="w-6 h-6" />,
      color: "green",
      description:
        "Build and nurture our thriving community of productivity heroes",
      requirements: [
        "2+ years community management",
        "Excellent communication skills",
        "Passion for building engaged communities",
      ],
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Competitive Salary",
      description: "Industry-leading compensation with equity options",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Health & Wellness",
      description: "Comprehensive health insurance and wellness programs",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Learning Budget",
      description: "$2000/year for courses, conferences, and books",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "Work-Life Balance",
      description: "Flexible hours, unlimited PTO, and remote-first culture",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Career Growth",
      description: "Clear advancement paths and mentorship programs",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Innovation Time",
      description: "20% time for passion projects and experimentation",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const values = [
    {
      title: "Level Up Together",
      description:
        "We believe in continuous growth, both as individuals and as a team. Everyone's success is celebrated.",
    },
    {
      title: "Play to Win",
      description:
        "We bring game mechanics to work—ambitious goals, healthy competition, and celebrating victories big and small.",
    },
    {
      title: "User-Obsessed",
      description:
        "Every feature we build, every decision we make, starts with understanding and delighting our users.",
    },
    {
      title: "Embrace Experiments",
      description:
        "We're not afraid to try new things, fail fast, learn faster, and iterate until we achieve excellence.",
    },
  ];

  const colorClasses = {
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      border: "border-purple-300",
      hover: "hover:border-purple-500",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-300",
      hover: "hover:border-blue-500",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      border: "border-orange-300",
      hover: "hover:border-orange-500",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-300",
      hover: "hover:border-green-500",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-20 lg:py-25">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center px-6 py-3 bg-purple-500/20 backdrop-blur-sm rounded-full text-purple-200 text-sm font-medium border border-purple-400/30">
                <Rocket className="w-4 h-4 mr-2" />
                We're Hiring!
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8"
            >
              Join Our
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mt-2">
                Epic Team
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed"
            >
              Help us build the future of productivity. Where work feels like
              play and every day is a new quest to conquer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  document
                    .getElementById("open-positions")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
              >
                View Open Positions
                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-purple-600">Core Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape our culture
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg p-2 mr-4">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perks & <span className="text-purple-600">Benefits</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We invest in our team's success, happiness, and growth
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100"
              >
                <div
                  className={`${benefit.bgColor} ${benefit.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}
                >
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Open <span className="text-purple-600">Positions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find your next adventure. We're looking for talented individuals
              to join our quest
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-6">
            {positions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 ${
                  selectedRole === position.id
                    ? colorClasses[position.color].border
                    : "border-gray-200"
                } ${colorClasses[position.color].hover} cursor-pointer`}
                onClick={() =>
                  setSelectedRole(
                    selectedRole === position.id ? null : position.id
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div
                      className={`${colorClasses[position.color].bg} ${
                        colorClasses[position.color].text
                      } w-14 h-14 rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}
                    >
                      {position.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {position.title}
                        </h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                          {position.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-3">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {position.location}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {position.department}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        {position.description}
                      </p>

                      {selectedRole === position.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <h4 className="font-bold text-gray-900 mb-3">
                            Key Requirements:
                          </h4>
                          <ul className="space-y-2 mb-6">
                            {position.requirements.map((req, idx) => (
                              <li
                                key={idx}
                                className="flex items-start text-gray-700"
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                {req}
                              </li>
                            ))}
                          </ul>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold flex items-center"
                          >
                            Apply Now
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                      selectedRole === position.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Don't See the Perfect Role?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              We're always looking for exceptional talent. Send us your resume
              and let's talk about how you can contribute to our mission.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold text-lg flex items-center justify-center mx-auto hover:shadow-xl transition-all"
            >
              <Mail className="w-5 h-5 mr-2" />
              Send General Application
            </motion.button>

            <div className="mt-8 text-purple-100">
              <p>Or email us directly at careers@yourcompany.com</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default JoinUsPage;
