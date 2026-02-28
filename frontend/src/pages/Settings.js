import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Bell, Palette, Shield, HelpCircle, LogOut, ChevronRight, Moon, Sun, X, Check, Mail, Lock, Eye, EyeOff, MessageSquare, Send } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Modal component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <Card className="w-full max-w-md p-6 border-none shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>
      {children}
    </Card>
  </div>
);

// Theme colors
const themeColors = [
  { name: 'Coral', primary: '#E08E79', bg: 'bg-[#E08E79]' },
  { name: 'Sage', primary: '#88B088', bg: 'bg-[#88B088]' },
  { name: 'Mauve', primary: '#9A8C98', bg: 'bg-[#9A8C98]' },
  { name: 'Sky', primary: '#7B9EC5', bg: 'bg-[#7B9EC5]' },
  { name: 'Lavender', primary: '#B8A9C9', bg: 'bg-[#B8A9C9]' },
  { name: 'Rose', primary: '#D4A5A5', bg: 'bg-[#D4A5A5]' },
];

const SettingsSection = ({ title, children }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-bold font-heading text-foreground">{title}</h2>
    <Card className="p-0 border-none shadow-sm overflow-hidden divide-y divide-border/30">
      {children}
    </Card>
  </div>
);

const SettingsItem = ({ icon: Icon, label, description, action, onClick }) => (
  <div 
    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-medium text-foreground">{label}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    {action || <ChevronRight className="h-5 w-5 text-muted-foreground" />}
  </div>
);

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
  >
    <span 
      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`}
    />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { logout, user } = useAuth();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    assignments: true,
    announcements: false,
  });

  const [activeModal, setActiveModal] = useState(null);
  const [themeColor, setThemeColor] = useState(0);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    major: 'Computer Science',
    year: 'Junior Year',
  });
  
  // Security state
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [messageSent, setMessageSent] = useState(false);

  const handleSaveProfile = () => {
    setActiveModal(null);
    // Show a brief success indicator (in a real app, you'd save to backend)
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    setPasswords({ current: '', new: '', confirm: '' });
    setActiveModal(null);
  };

  const handleSendMessage = () => {
    setMessageSent(true);
    setTimeout(() => {
      setContactForm({ subject: '', message: '' });
      setMessageSent(false);
      setActiveModal(null);
    }, 2000);
  };

  const handleSignOut = () => {
    logout();
    setActiveModal(null);
    navigate('/login');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Modals */}
      {activeModal === 'profile' && (
        <Modal title="Personal Information" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'User'} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white text-xs">
                  <User className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Major</label>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <select
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option>Freshman Year</option>
                  <option>Sophomore Year</option>
                  <option>Junior Year</option>
                  <option>Senior Year</option>
                  <option>Graduate</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveProfile} className="flex-1 gap-2">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'security' && (
        <Modal title="Security Settings" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Two-Factor Authentication</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account</p>
              <Button variant="ghost" size="sm">Enable 2FA</Button>
            </div>
            
            <div className="border-t border-border/30 pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Current password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleChangePassword} className="flex-1">Update Password</Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'theme' && (
        <Modal title="Theme Color" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose your preferred accent color</p>
            <div className="grid grid-cols-3 gap-3">
              {themeColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setThemeColor(index)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    themeColor === index 
                      ? 'border-primary scale-105' 
                      : 'border-border/30 hover:border-border'
                  }`}
                >
                  <div className={`w-full h-8 rounded-lg ${color.bg} mb-2`} />
                  <span className="text-sm font-medium">{color.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={() => setActiveModal(null)} className="flex-1 gap-2">
                <Check className="h-4 w-4" />
                Apply Theme
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'help' && (
        <Modal title="Help Center" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            {[
              { q: 'How do I submit an assignment?', a: 'Go to your course, click on the assignment module, and use the upload area to submit your work.' },
              { q: 'How do I change my password?', a: 'Go to Settings > Security > Change Password and follow the prompts.' },
              { q: 'Can I download course materials?', a: 'Yes! Click on any module and use the Download button to save materials locally.' },
              { q: 'How do I contact my instructor?', a: 'Use the Discussion Board in your course or send them an email through the course page.' },
            ].map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors font-medium">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="p-3 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
            <Button variant="ghost" onClick={() => setActiveModal(null)} className="w-full mt-4">Close</Button>
          </div>
        </Modal>
      )}

      {activeModal === 'contact' && (
        <Modal title="Contact Support" onClose={() => setActiveModal(null)}>
          {messageSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Message Sent!</h3>
              <p className="text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="What do you need help with?"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleSendMessage} className="flex-1 gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {activeModal === 'signout' && (
        <Modal title="Sign Out" onClose={() => setActiveModal(null)}>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-muted-foreground mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleSignOut} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                Sign Out
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="p-6 border-none shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name || 'User'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground mt-1">{profile.major} • {profile.year}</p>
          </div>
          <Button variant="ghost" onClick={() => setActiveModal('profile')}>Edit Profile</Button>
        </div>
      </Card>

      {/* Account Settings */}
      <SettingsSection title="Account">
        <SettingsItem 
          icon={User}
          label="Personal Information"
          description="Update your name, email, and profile picture"
          onClick={() => navigate('/profile')}
        />
        <SettingsItem 
          icon={Shield}
          label="Security"
          description="Password and two-factor authentication"
          onClick={() => setActiveModal('security')}
        />
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection title="Notifications">
        <SettingsItem 
          icon={Bell}
          label="Email Notifications"
          description="Receive updates via email"
          action={
            <Toggle 
              enabled={notifications.email} 
              onChange={() => setNotifications(n => ({ ...n, email: !n.email }))}
            />
          }
        />
        <SettingsItem 
          icon={Bell}
          label="Push Notifications"
          description="Get notified on your device"
          action={
            <Toggle 
              enabled={notifications.push} 
              onChange={() => setNotifications(n => ({ ...n, push: !n.push }))}
            />
          }
        />
        <SettingsItem 
          icon={Bell}
          label="Assignment Reminders"
          description="Remind me before deadlines"
          action={
            <Toggle 
              enabled={notifications.assignments} 
              onChange={() => setNotifications(n => ({ ...n, assignments: !n.assignments }))}
            />
          }
        />
        <SettingsItem 
          icon={Bell}
          label="Course Announcements"
          description="Notify me of new announcements"
          action={
            <Toggle 
              enabled={notifications.announcements} 
              onChange={() => setNotifications(n => ({ ...n, announcements: !n.announcements }))}
            />
          }
        />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance">
        <SettingsItem 
          icon={darkMode ? Moon : Sun}
          label="Dark Mode"
          description="Toggle dark theme"
          action={
            <Toggle 
              enabled={darkMode} 
              onChange={toggleDarkMode}
            />
          }
        />
        <SettingsItem 
          icon={Palette}
          label="Theme Color"
          description="Customize accent colors"
          onClick={() => setActiveModal('theme')}
        />
      </SettingsSection>

      {/* Help & Support */}
      <SettingsSection title="Help & Support">
        <SettingsItem 
          icon={HelpCircle}
          label="Help Center"
          description="FAQs and tutorials"
          onClick={() => setActiveModal('help')}
        />
        <SettingsItem 
          icon={MessageSquare}
          label="Contact Support"
          description="Get help from our team"
          onClick={() => setActiveModal('contact')}
        />
      </SettingsSection>

      {/* Logout */}
      <Button 
        variant="ghost" 
        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
        onClick={() => setActiveModal('signout')}
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </Button>
    </div>
  );
};

export default Settings;
