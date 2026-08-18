import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for navigation
import { motion, AnimatePresence } from 'framer-motion'; // Assuming framer-motion is available for animations
import { useNavigate } from 'react-router-dom';
import { 
  Gem, 
  BarChart3, 
  Users, 
  Settings, 
  ShoppingCart, 
  FileText,
  ArrowRight,
  CreditCard,
  Shield,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Github,
  Linkedin,
  Twitter,
  Mail,
  CheckCircle, // For pricing plan features
  Rocket, // For workflow icon
  Package, // For workflow icon
  Box, // For workflow icon
  LineChart, // For workflow icon
  Medal, // For premium suite icon
  Bolt, // For advanced plan icon
  Dumbbell // For standard plan icon (example)
} from 'lucide-react';
import '../styles/LandingPage.css';

// Data for sections - based on screenshots

const navLinks = [
  { name: 'HOME', href: '#' },
  { name: 'FEATURES', href: '#features' },
  { name: 'TESTIMONIALS', href: '#testimonials' },
  { name: 'DEVELOPERS', href: '#developers' },
  { name: 'CONTACT', href: '#' },
];

const stats = [
  { value: '4.9/5', label: 'Average Rating' },
  { value: '500+', label: 'Happy Clients' },
  { value: '50+', label: 'Countries' },
  { value: '24/7', label: 'Support' },
];

const workflowSteps = [
  { number: '01', icon: <Rocket className="w-10 h-10 text-[#a78bfa]" />, title: 'Setup', description: 'Configure your jewelry business settings' },
  { number: '02', icon: <Package className="w-10 h-10 text-[#38b2ac]" />, title: 'Inventory', description: 'Add and organize your jewelry collection' },
  { number: '03', icon: <Box className="w-10 h-10 text-[#f6ad55]" />, title: 'Manage', description: 'Track sales and customer interactions' },
  { number: '04', icon: <LineChart className="w-10 h-10 text-[#fc8181]" />, title: 'Analyze', description: 'Review performance and optimize operations' },
];

const featuresList = [
  {
    icon: <Gem className="w-8 h-8" />,
    title: "Inventory Management",
    description: "Efficiently track and manage your jewelry inventory with real-time updates and comprehensive cataloging."
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Sales Analytics",
    description: "Get detailed insights into your sales performance and trends with advanced reporting and forecasting."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Customer Management",
    description: "Maintain comprehensive customer records and purchase history for better relationship management."
  },
  {
    icon: <Settings className="w-8 h-8" />,
    title: "Customizable Settings",
    description: "Tailor the system to your specific business needs with flexible configuration options."
  },
  {
    icon: <ShoppingCart className="w-8 h-8" />,
    title: "Smart Cart System",
    description: "Advanced cart management with real-time price updates and intelligent recommendations."
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Automated Billing",
    description: "Generate professional bills and invoices automatically with integrated payment processing."
  }
];

const testimonials = [
  {
    name: "David Kim",
    role: "CEO, Diamond Elite",
    image: "https://i.pravatar.cc/150?img=5", // Using a different image for variety
    rating: 5,
    review: "The blockchain security gives our customers complete confidence in their purchases. The transparency and immutable records have revolutionized trust in our business."
  },
  // Add more testimonials as needed
];

const pricingPlans = [
  {
    name: 'Standard',
    price: '$49',
    frequency: '/month',
    description: 'Perfect for small jewelry businesses and independent artisans',
    icon: <Dumbbell className="w-8 h-8 text-white" />,
    features: [
      'Up to 1,000 jewelry pieces',
      'Basic inventory management',
      'Standard analytics',
      'Email support',
      'Mobile app access',
      'Basic customer management',
    ]
  },
  {
    name: 'Advanced',
    price: '$149',
    frequency: '/month',
    description: 'Comprehensive solution for growing jewelry enterprises',
    icon: <Bolt className="w-8 h-8 text-white" />,
    popular: true,
    features: [
      'Unlimited jewelry pieces',
      'Advanced inventory management',
      'Comprehensive sales analytics',
      'Priority 24/7 support',
      'Custom integrations',
      'Advanced customer management',
      'Team collaboration tools',
    ]
  },
];

const developerInfo = {
  name: "Ansh Gaur",
  role: "Lead Developer",
  description: "Passionate full-stack developer with expertise in modern web technologies and jewelry management systems.",
  image: "/passportpic.jpg", // Use the provided local image
  skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'], // Example skills
  social: {
    github: "https://github.com/anshgaur",
    linkedin: "https://linkedin.com/in/anshgaur",
    twitter: "https://twitter.com/anshgaur"
  }
};

function LandingPage() {
  const navigate = useNavigate();
  const [currentReview, setCurrentReview] = useState(0);
  const [gradientPosition, setGradientPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % testimonials.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a3a] to-[#0a0a23] relative overflow-hidden">
      {/* Animated background gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 animate-gradient"
        style={{
          background: `linear-gradient(${gradientPosition}deg, #f3ba19, #ff6b6b, #4ecdc4, #f3ba19)`,
        }}
      />
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#11112a]/80 backdrop-blur-md border-b border-[#111]/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            {/* Replace with your actual logo */}
            <span className="text-2xl font-bold text-[#f3ba19]">AURUM<span className="text-white">BILL</span></span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-gray-300 hover:text-[#f3ba19] transition-colors font-semibold">
                {link.name}
              </a>
            ))}
          </div>

          {/* Get Started Button */}
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-[#f3ba19] to-[#e09600] text-[#000014] font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 hover-glow button-glow"
          >
            GET STARTED <ArrowRight className="w-4 h-4" />
          </button>

          {/* Mobile Menu Button (optional) */}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-20 z-10 text-center perspective-container">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-7xl font-bold text-white mb-4"
        >
          Jewelry Management <span className="gradient-text">Redefined</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
        >
          Experience the future of jewelry management with our premium 3D platform. Immersive, intelligent, and incredibly beautiful.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex justify-center gap-6 mb-20"
        >
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-bold rounded-lg hover:opacity-90 transition-opacity button-glow"
          >
            Start Free Trial
          </button>
          <button
            className="px-8 py-4 bg-[#11112a]/50 border border-[#333] text-white font-bold rounded-lg hover:bg-[#a78bfa]/20 transition-colors button-glow"
          >
            Watch Demo
          </button>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 glass-card py-8 px-4"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Workflow Section */}
      <div id="workflow" className="relative py-20 z-10 perspective-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl font-bold gradient-text mb-12"
          >
            Seamless Workflow
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="glass-card rounded-xl p-6 text-center hover-glow"
              >
                <div className="text-4xl font-bold mb-4 text-gray-600">{step.number}</div>
                <div className="mb-4 flex justify-center animate-radial-pulse">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Revolutionary Features Section */}
      <div id="features" className="relative py-20 z-10 perspective-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Revolutionary <span className="gradient-text">Features</span></h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the next generation of jewelry management with cutting-edge technology and intelligent automation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="glass-card rounded-xl p-6 animate-float"
              >
                <div className="text-[#f3ba19] mb-4 group-hover:scale-110 transition-transform animate-radial-pulse">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* What Our Clients Say Section */}
      <div id="testimonials" className="relative py-20 bg-[#11112a]/50 z-10 perspective-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold gradient-text mb-4">
              What Our Clients Say
            </h2>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReview}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="glass-card rounded-xl p-8 max-w-3xl mx-auto"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonials[currentReview].image}
                    alt={testimonials[currentReview].name}
                    className="w-16 h-16 rounded-full mr-4 border-2 border-[#f3ba19]"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{testimonials[currentReview].name}</h3>
                    <p className="text-gray-400">{testimonials[currentReview].role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonials[currentReview].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#f3ba19] fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 text-lg italic">"{testimonials[currentReview].review}"</p>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full glass-card text-white hover:bg-[#f3ba19] transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full glass-card text-white hover:bg-[#f3ba19] transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative py-20 z-10 perspective-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl font-bold gradient-text mb-12"
          >
            Get Started Today
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className={`glass-card rounded-xl p-8 text-left relative ${
                  plan.popular ? 'border-[#a78bfa] border-2' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white text-xs font-bold uppercase px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  {plan.icon} {plan.name}
                </h3>
                <p className="text-gray-400 mb-4 text-sm">{plan.description}</p>
                <div className="text-4xl font-bold text-white mb-4">
                  {plan.price}<span className="text-xl font-normal text-gray-400">{plan.frequency}</span>
                </div>
                <ul className="space-y-3 text-gray-300">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[#a78bfa] mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <p className="text-gray-400 mt-8 text-sm">
            All plans include a 14-day free trial • No setup fees • Cancel anytime
          </p>
          <p className="text-gray-400 text-sm mt-2">
             ✓ 99.9% Uptime SLA • ✓ SOC 2 Compliant • ✓ 24/7 Security Monitoring
          </p>

        </div>
      </div>

      {/* Meet the Creator Section */}
      <div id="developers" className="relative py-20 z-10 perspective-container bg-[#11112a]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl font-bold gradient-text mb-12"
          >
            Meet the Creator
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card rounded-xl p-8 max-w-md mx-auto text-center hover-glow"
          >
            <img
              src={developerInfo.image}
              alt={developerInfo.name}
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-[#f3ba19]/50"
            />
            <h3 className="text-xl font-semibold text-white mb-2">{developerInfo.name}</h3>
            <p className="text-gray-400 mb-4">{developerInfo.role}</p>
            <p className="text-gray-300 text-sm mb-4">{developerInfo.description}</p>
            
            {/* Skill Tags */}
            <div className="flex justify-center flex-wrap gap-2 mb-4">
              {developerInfo.skills.map((skill, index) => (
                <span key={index} className="bg-[#a78bfa]/20 text-[#a78bfa] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {skill}
                </span>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex justify-center space-x-4">
              <a href={developerInfo.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#f3ba19] transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href={developerInfo.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#f3ba19] transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href={developerInfo.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#f3ba19] transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-[#11112a]/90 backdrop-blur-md border-t border-[#111]/50 py-12 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-left mb-12">
            {/* Logo and Description */}
            <div>
              <div className="flex items-center mb-4">
                 {/* Replace with your actual logo */}
                <span className="text-2xl font-bold text-[#f3ba19]">AURUM<span className="text-white"></span></span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Revolutionizing jewelry management , AI-powered analytics, and security. Experience the future of luxury retail.
              </p>
              {/* Social Icons below description */}
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">
                  <Github className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
                {/* Add other social icons as needed */}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Status</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#f3ba19] transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          {/* Stay Updated Section */}
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#111]/50 pt-8">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              <p className="font-semibold text-white mb-2">Stay Updated</p>
              Get the latest updates on new features and jewelry industry insights.
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-2 rounded-lg bg-[#11112a]/70 border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f3ba19]"
              />
              <button className="px-6 py-2 bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#111]/50 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} AURUM. All rights reserved.</p>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default LandingPage; 