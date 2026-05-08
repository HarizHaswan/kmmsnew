import React from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Calendar, 
  MessageSquare, 
  CreditCard, 
  ClipboardCheck, 
  Camera, 
  BarChart3,
  GraduationCap
} from "lucide-react";

// Use the generated images
import heroImg from "../assets/kindergarten_hero.png";
import featuresImg from "../assets/learning_activities.png";

const LandingPage = () => {
  const features = [
    {
      title: "Smart Attendance",
      description: "Real-time digital attendance tracking for students and staff with instant notifications.",
      icon: <ClipboardCheck className="w-6 h-6 text-primary-dark" />,
    },
    {
      title: "Activity Tracking",
      description: "Parents receive daily updates, photos, and 'blasts' about their child's learning journey.",
      icon: <Camera className="w-6 h-6 text-primary-dark" />,
    },
    {
      title: "Academic Progress",
      description: "Comprehensive progress reports and performance evaluation tools for every student.",
      icon: <BarChart3 className="w-6 h-6 text-primary-dark" />,
    },
    {
      title: "Integrated Payments",
      description: "Automated invoicing, fee management, and digital receipting for a paperless experience.",
      icon: <CreditCard className="w-6 h-6 text-primary-dark" />,
    },
    {
      title: "Seamless Communication",
      description: "Direct messaging and announcements keeping parents, teachers, and admins connected.",
      icon: <MessageSquare className="w-6 h-6 text-primary-dark" />,
    },
    {
      title: "Smart Scheduling",
      description: "Dynamic timetables and event calendars for better organization of kindergarten activities.",
      icon: <Calendar className="w-6 h-6 text-primary-dark" />,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-dark to-accent-dark bg-clip-text text-transparent">
                SmartKindy
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-primary-dark font-medium transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-primary-dark font-medium transition-colors">About</a>
              <Link to="/login" className="text-gray-600 hover:text-primary-dark font-medium transition-colors">Login</Link>
              <Link 
                to="/enroll" 
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Enroll Now
              </Link>
            </div>
            {/* Mobile login button only */}
            <div className="md:hidden">
              <Link to="/login" className="text-primary-dark font-bold">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-dark text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now Open for 2026 Enrollment
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Empowering the Next <span className="text-primary-dark">Generation</span> with SmartKindy
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
              The all-in-one Management & Monitoring System designed to streamline kindergarten operations and bridge the gap between parents and educators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/enroll" 
                className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-accent/40 transform hover:-translate-y-1"
              >
                Enroll Your Child <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 hover:border-primary text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:text-primary-dark"
              >
                Portal Login
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">500+</span> Happy parents already joined
              </p>
            </div>
          </div>
          <div className="relative animate-in fade-in slide-in-from-right duration-700">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-2xl -z-10"></div>
            <img 
              src={heroImg} 
              alt="Kindergarten Classroom" 
              className="rounded-3xl shadow-2xl border-8 border-white object-cover aspect-[4/3] w-full"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-xs animate-bounce-slow">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="font-bold text-gray-900">Activity Update</span>
              </div>
              <p className="text-sm text-gray-600 italic">"Adam just finished his first painting today! Check the gallery for photos."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary-dark mb-1">98%</div>
            <div className="text-gray-500 font-medium">Parent Satisfaction</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent-dark mb-1">24/7</div>
            <div className="text-gray-500 font-medium">Monitoring Access</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary-dark mb-1">100+</div>
            <div className="text-gray-500 font-medium">Daily Activities</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent-dark mb-1">Instant</div>
            <div className="text-gray-500 font-medium">Notifications</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-brand-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-primary-dark font-bold tracking-wider uppercase text-sm">Features</h2>
            <h3 className="text-4xl font-bold text-gray-900">Designed for Modern Early Education</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              SmartKindy provides all the tools you need to manage your kindergarten efficiently while keeping parents updated on their child's daily progress.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group"
              >
                <div className="bg-brand-bg w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section id="about" className="py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -inset-10 bg-accent/5 rounded-full blur-3xl -z-10"></div>
            <img 
              src={featuresImg} 
              alt="Learning Activities" 
              className="rounded-3xl shadow-xl object-cover aspect-video"
            />
          </div>
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-900 leading-tight">
              Real-time Monitoring & Transparency for Parents
            </h3>
            <p className="text-lg text-gray-600">
              We believe that parents should never miss a moment of their child's development. Our activity portal allows teachers to share photos, meals, and milestones instantly.
            </p>
            <ul className="space-y-4">
              {[
                "Daily activity logs with photos",
                "Instant announcement alerts",
                "Easy progress report access",
                "Direct teacher-parent messaging"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="bg-primary/20 p-1 rounded-full text-primary-dark">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-primary-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Ready to give your child the best early learning experience?
          </h2>
          <p className="text-xl text-primary-light/80">
            Join the SmartKindy family today and start your child's journey with us. Enrollment is simple and only takes a few minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              to="/enroll" 
              className="bg-white text-primary-dark px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all shadow-2xl"
            >
              Enroll Your Child Now
            </Link>
            <Link 
              to="/login" 
              className="bg-primary-dark border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all"
            >
              Already a Member? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SmartKindy</span>
            </div>
            <p className="max-w-sm">
              Making kindergarten management smarter, easier, and more transparent for everyone involved in a child's early education.
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4">Quick Links</h5>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><Link to="/enroll" className="hover:text-primary transition-colors">Enrollment</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4">Contact</h5>
            <ul className="space-y-2 text-sm">
              <li>Email: info@smartkindy.edu</li>
              <li>Phone: +60 3-1234 5678</li>
              <li>Address: 123 Jalan Edukasi, Kuala Lumpur, Malaysia</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          © 2026 SmartKindy. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
