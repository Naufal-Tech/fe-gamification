import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Globe,
  Heart,
  Lightbulb,
  Rocket,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState("mission");

  const stats = [
    {
      value: "50K+",
      label: "Active Users",
      icon: <Users className="w-6 h-6" />,
    },
    {
      value: "2M+",
      label: "Tasks Completed",
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      value: "95%",
      label: "User Satisfaction",
      icon: <Star className="w-6 h-6" />,
    },
    {
      value: "150+",
      label: "Countries Reached",
      icon: <Globe className="w-6 h-6" />,
    },
  ];

  const values = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Innovation First",
      description:
        "We constantly push boundaries to create groundbreaking productivity solutions that make work feel like play.",
      color: "yellow",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "User-Centric",
      description:
        "Every feature we build starts with understanding our users' needs and creating delightful experiences.",
      color: "red",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Trust & Transparency",
      description:
        "We believe in open communication, data privacy, and building lasting relationships with our community.",
      color: "blue",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Continuous Growth",
      description:
        "We embrace learning, experimentation, and personal development for both our team and users.",
      color: "green",
    },
  ];

  const timeline = [
    {
      year: "2020",
      title: "The Beginning",
      description:
        "Founded by a team of productivity enthusiasts who believed work should be engaging and fun.",
    },
    {
      year: "2021",
      title: "Beta Launch",
      description:
        "Launched our beta version with 1,000 early adopters who helped shape our gamification features.",
    },
    {
      year: "2022",
      title: "Global Expansion",
      description:
        "Reached 10,000 users across 50 countries and introduced our mobile app.",
    },
    {
      year: "2023",
      title: "Major Milestone",
      description:
        "Achieved 50,000 active users and won 'Best Productivity App' award.",
    },
    {
      year: "2024",
      title: "Innovation Era",
      description:
        "Launched AI-powered features and expanded our team to support global growth.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      image: "👩‍💼",
      description:
        "Former product lead at a Fortune 500 company, passionate about gamification",
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder",
      image: "👨‍💻",
      description:
        "Full-stack engineer with 15+ years building scalable platforms",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Design",
      image: "👩‍🎨",
      description:
        "Award-winning designer focused on creating delightful user experiences",
    },
    {
      name: "David Kim",
      role: "Head of Growth",
      image: "👨‍💼",
      description:
        "Growth expert who scaled multiple SaaS products to millions of users",
    },
  ];

  const colorClasses = {
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
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
                Our Story
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8"
            >
              Making Productivity
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mt-2">
                An Adventure
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed"
            >
              We're on a mission to transform how people approach their daily
              tasks by bringing the excitement of gaming into productivity.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-100">
                  <div className="flex justify-center text-purple-600 mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-gray-100 rounded-xl p-2">
                <button
                  onClick={() => setActiveTab("mission")}
                  className={`px-8 py-3 rounded-lg font-bold transition-all ${
                    activeTab === "mission"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Target className="w-5 h-5 inline mr-2" />
                  Our Mission
                </button>
                <button
                  onClick={() => setActiveTab("vision")}
                  className={`px-8 py-3 rounded-lg font-bold transition-all ${
                    activeTab === "vision"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Lightbulb className="w-5 h-5 inline mr-2" />
                  Our Vision
                </button>
              </div>
            </div>

            {/* Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 md:p-12 border-2 border-purple-100"
            >
              {activeTab === "mission" ? (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-4">
                      <Target className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Our Mission
                  </h2>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                    To empower individuals and teams to achieve their goals by
                    transforming productivity from a chore into an engaging,
                    rewarding experience. We believe that when work feels like
                    play, people unlock their full potential and build lasting,
                    positive habits.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-4">
                      <Lightbulb className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Our Vision
                  </h2>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                    To create a world where everyone looks forward to their
                    daily tasks, where productivity is celebrated as an
                    adventure, and where personal growth is as addictive as the
                    best games. We envision a future where work-life balance is
                    enhanced through gamification and positive reinforcement.
                  </p>
                </div>
              )}
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
              These principles guide everything we do and define who we are
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
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
                  className={`${colorClasses[value.color].bg} ${
                    colorClasses[value.color].text
                  } w-16 h-16 rounded-lg flex items-center justify-center mb-4`}
                >
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-purple-600">Journey</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a small startup to a global productivity platform
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative mb-8 last:mb-0"
              >
                <div className="flex items-start gap-6">
                  {/* Year Badge */}
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold text-lg shadow-lg">
                      {item.year}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-10 top-20 w-0.5 h-8 bg-gradient-to-b from-purple-300 to-blue-300"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our <span className="text-purple-600">Leadership Team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate individuals dedicated to revolutionizing productivity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-center"
              >
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-purple-600 font-semibold mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm">{member.description}</p>
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
              Join Us on This Adventure
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Be part of a community that's redefining productivity. Start your
              journey today and level up your daily routine.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold text-lg hover:shadow-xl transition-all"
              >
                <Award className="w-5 h-5 inline mr-2" />
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
              >
                <Users className="w-5 h-5 inline mr-2" />
                Join Our Team
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
