import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck
} from "lucide-react";
import { getPublicClasses } from "../api/classes";
import { enrollStudent } from "../api/students";
import { useToast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const Enrollment = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    classId: "",
    parentName: "",
    parentIcNumber: "",
    parentPhoneNumber: "",
    homeAddress: "",
    parentEmail: "",
    parentPassword: "",
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getPublicClasses();
        setClasses(data);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        toast({
          title: "Error",
          description: "Could not load class information. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await enrollStudent(formData);
      setSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "Your child's enrollment has been submitted. Please wait for admin approval.",
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong. Please check your details.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to SmartKindy!</h2>
          <p className="text-gray-600 leading-relaxed">
            Your enrollment application for <span className="font-bold text-gray-900">{formData.name}</span> has been received successfully.
          </p>
          <div className="bg-brand-bg p-4 rounded-2xl border border-gray-100 text-sm text-left">
            <p className="font-bold text-gray-900 mb-1">What happens next?</p>
            <ul className="space-y-2 text-gray-600">
              <li>• You will receive an email confirmation with your details shortly.</li>
              <li>• Our staff will review the application and check for class availability.</li>
              <li>• You will be notified via email once approved (usually within 24 hours).</li>
              <li>• Once approved, you can login to access your portal.</li>
            </ul>
          </div>
          <Link to="/" className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="max-w-4xl w-full flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-primary-dark font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1 rounded-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SmartKindy Enrollment</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary-dark px-8 py-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Student Enrollment Form</h1>
            <p className="text-primary-light opacity-90">Please fill in the details below to register your child at SmartKindy.</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
          {/* Student Information Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary-dark font-bold">1</div>
              <h2 className="text-xl font-bold text-gray-900">Student Information</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    name="name" 
                    placeholder="Enter student's full name" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Date of Birth *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    type="date" 
                    name="dateOfBirth" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Gender *</label>
                <select 
                  name="gender" 
                  className="w-full h-12 border rounded-xl px-4 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Preferred Class Group *</label>
                <select 
                  name="classId" 
                  className="w-full h-12 border rounded-xl px-4 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.classId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a Class</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.className} (Age {c.yearGroup})
                    </option>
                  ))}
                </select>
                {loading && <p className="text-xs text-gray-400">Loading classes...</p>}
              </div>
            </div>
          </section>

          {/* Parent Information Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent-dark font-bold">2</div>
              <h2 className="text-xl font-bold text-gray-900">Parent / Guardian Details</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Parent Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    name="parentName" 
                    placeholder="Enter parent's full name" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">IC Number / ID *</label>
                <div className="relative">
                  <ClipboardCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    name="parentIcNumber" 
                    placeholder="e.g., 900101-01-1234" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.parentIcNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    name="parentPhoneNumber" 
                    placeholder="e.g., 012-3456789" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.parentPhoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    type="email" 
                    name="parentEmail" 
                    placeholder="parent@example.com" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-700">Home Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                  <textarea 
                    name="homeAddress" 
                    placeholder="Enter full home address" 
                    className="w-full pl-10 pt-3 h-24 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={formData.homeAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Account Security Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">3</div>
              <h2 className="text-xl font-bold text-gray-900">Account Security</h2>
            </div>
            
            <div className="max-w-md space-y-4">
              <div className="flex items-start gap-3 bg-brand-bg p-4 rounded-2xl border border-gray-100">
                <AlertCircle className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  You will use this password to login to the SmartKindy portal to track your child's progress and manage payments.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Set Portal Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    type="password" 
                    name="parentPassword" 
                    placeholder="Min. 6 characters" 
                    className="pl-10 h-12 rounded-xl"
                    value={formData.parentPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-8">
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full h-14 bg-accent hover:bg-accent-dark text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-accent/40 transition-all transform hover:-translate-y-1 disabled:opacity-70"
            >
              {submitting ? "Submitting Application..." : "Submit Enrollment Application"}
            </Button>
            <p className="text-center text-sm text-gray-400 mt-4">
              By submitting, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-12 text-gray-500 text-sm">
        © 2026 SmartKindy Management System. Need help? <span className="text-primary-dark font-medium underline">Contact Support</span>
      </p>
    </div>
  );
};

export default Enrollment;
