
import React, { useState, useEffect, useCallback } from 'react';
import { Property, PropertyType, TransactionType, User, AppView } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PropertyCard from './components/PropertyCard';
import PropertyForm from './components/PropertyForm';
import OwnerDashboard from './components/OwnerDashboard';
import PaymentModal from './components/PaymentModal';
import OwnerRegister from './components/OwnerRegister';
import OwnerLogin from './components/OwnerLogin';
import Footer from './components/Footer';
import ViewingRequestModal from './components/ViewingRequestModal';
import CreatorDashboard from './components/CreatorDashboard';

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    ownerId: 'u1',
    ownerName: 'John Doe',
    ownerPhone: '+123456789',
    title: 'Modern Villa with Ocean View',
    description: 'A beautiful 5-bedroom villa located in the heart of the coast. Includes a pool and garden.',
    location: 'Coastal Road, Malibu',
    price: 1500000,
    area: 4500,
    type: PropertyType.HOUSE,
    transaction: TransactionType.SALE,
    images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2', 'https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=4', 'https://picsum.photos/800/600?random=5', 'https://picsum.photos/800/600?random=6'],
    createdAt: Date.now(),
    beds: 5,
    rooms: 10,
    kitchens: 2,
    parlors: 3,
    toilets: 6,
    reportCount: 0
  },
  {
    id: '2',
    ownerId: 'u2',
    ownerName: 'Sarah Smith',
    ownerPhone: '+987654321',
    title: 'Commercial Land near Downtown',
    description: 'Perfect spot for a high-rise or warehouse. Zoned for commercial use.',
    location: 'Main St, Houston',
    price: 500000,
    area: 12000,
    type: PropertyType.LAND,
    transaction: TransactionType.SALE,
    images: ['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=13', 'https://picsum.photos/800/600?random=23', 'https://picsum.photos/800/600?random=33', 'https://picsum.photos/800/600?random=43', 'https://picsum.photos/800/600?random=53'],
    createdAt: Date.now(),
    beds: 0,
    rooms: 0,
    kitchens: 0,
    parlors: 0,
    toilets: 0,
    reportCount: 0
  },
  {
    id: '3',
    ownerId: 'u1',
    ownerName: 'John Doe',
    ownerPhone: '+123456789',
    title: 'Cozy Loft for Rent',
    description: 'Industrial style loft with high ceilings and plenty of light.',
    location: 'Brooklyn, NY',
    price: 3500,
    area: 1200,
    type: PropertyType.HOUSE,
    transaction: TransactionType.RENT,
    images: ['https://picsum.photos/800/600?random=4', 'https://picsum.photos/800/600?random=14', 'https://picsum.photos/800/600?random=24', 'https://picsum.photos/800/600?random=34', 'https://picsum.photos/800/600?random=44', 'https://picsum.photos/800/600?random=54'],
    createdAt: Date.now(),
    beds: 1,
    rooms: 3,
    kitchens: 1,
    parlors: 1,
    toilets: 1,
    reportCount: 0
  }
];

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'john@example.com', phone: '+123456789', hasPaid: true, properties: ['1', '3'] },
  { id: 'u2', name: 'Sarah Smith', email: 'sarah@example.com', phone: '+987654321', hasPaid: true, properties: ['2'] }
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewingModal, setShowViewingModal] = useState(false);
  
  // New Admin State: Controls whether the payment gateway is active
  const [paymentActive, setPaymentActive] = useState(true);
  
  // Temporary state to hold property details during the Reg -> Prop -> Payment flow
  const [pendingProperty, setPendingProperty] = useState<Omit<Property, 'id' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'createdAt'> | null>(null);

  // Handle Auth Persistence (Simulated)
  useEffect(() => {
    const savedUser = localStorage.getItem('rental_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleRegister = (name: string, email: string, phone: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      phone,
      hasPaid: false,
      properties: [],
    };
    setUser(newUser);
    localStorage.setItem('rental_user', JSON.stringify(newUser));
    // New flow: Go to add first property instead of payment immediately
    setView('ADD_FIRST_PROPERTY');
  };

  // Helper to save a property and update user state (used in both payment success and bypass flows)
  const saveNewProperty = (propData: Omit<Property, 'id' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'createdAt'>, currentUser: User) => {
    const newPropId = Math.random().toString(36).substr(2, 9);
    const newProp: Property = {
      ...propData,
      id: newPropId,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerPhone: currentUser.phone,
      createdAt: Date.now(),
      reportCount: 0
    };
    
    setProperties(prev => [newProp, ...prev]);
    
    const updatedUser = {
      ...currentUser,
      properties: [...currentUser.properties, newPropId]
    };

    return updatedUser;
  };

  const handleFirstPropertySubmit = (prop: Omit<Property, 'id' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'createdAt'>) => {
    // If payment is active, we must pause and pay
    if (paymentActive) {
      setPendingProperty(prop);
      setView('PAYMENT');
    } else {
      // If payment is NOT active (Creator Mode), save immediately and go to dashboard
      if (user) {
        const updatedUser = saveNewProperty(prop, user);
        // We don't mark as 'hasPaid' in DB so that if creator turns payment ON later, they might be prompted, 
        // OR we treat them as good for now.
        // For smoother UX, let's just update the local user state.
        setUser(updatedUser);
        localStorage.setItem('rental_user', JSON.stringify(updatedUser));
        setView('OWNER_DASHBOARD');
      }
    }
  };

  const findUserByPhone = (phone: string): User | undefined => {
    // Check mock users first
    const existingMock = MOCK_USERS.find(u => u.phone.replace(/\s/g, '') === phone.replace(/\s/g, ''));
    if (existingMock) return existingMock;
    
    // Check local storage (simulating DB for new users)
    const savedUser = localStorage.getItem('rental_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')) {
         return parsed;
      }
    }
    return undefined;
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('rental_user', JSON.stringify(loggedInUser));
    
    // If user hasn't paid, but Payment system is OFF, let them in.
    if (loggedInUser.hasPaid || !paymentActive) {
      setView('OWNER_DASHBOARD');
    } else {
      setView('PAYMENT');
    }
  };

  const handlePaymentSuccess = () => {
    if (user) {
      let updatedUser = { ...user, hasPaid: true };
      
      // If we have a pending property from the registration flow, save it now
      if (pendingProperty) {
         updatedUser = saveNewProperty(pendingProperty, updatedUser);
         setPendingProperty(null);
      }
      
      setUser(updatedUser);
      localStorage.setItem('rental_user', JSON.stringify(updatedUser));
      setView('OWNER_DASHBOARD');
    }
  };

  const handleAddProperty = (prop: Omit<Property, 'id' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'createdAt'>) => {
    if (!user) return;
    const updatedUser = saveNewProperty(prop, user);
    setUser(updatedUser);
    localStorage.setItem('rental_user', JSON.stringify(updatedUser));
    setView('OWNER_DASHBOARD');
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };
  
  const handleReportProperty = (id: string) => {
    setProperties(prev => prev.map(p => {
       if (p.id === id) {
          return { ...p, reportCount: (p.reportCount || 0) + 1 };
       }
       return p;
    }));
    alert("Thank you. This property has been flagged for review by our safety team.");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rental_user');
    setView('LANDING');
  };

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Aggregate all users for Creator Dashboard
  const allUsers = [...MOCK_USERS];
  if (user && !allUsers.find(u => u.id === user.id)) {
    allUsers.push(user);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        onNavigate={setView} 
        onLogout={handleLogout} 
        currentView={view} 
      />

      <main className="flex-grow">
        {view === 'LANDING' && (
          <>
            <Hero onSearch={(q) => { setSearchQuery(q); setView('SEARCH'); }} />
            <section className="py-16 px-4 md:px-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Featured Properties</h2>
                    <p className="text-slate-500 mt-2">Discover our top hand-picked listings.</p>
                  </div>
                  <button 
                    onClick={() => setView('SEARCH')}
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {properties.slice(0, 3).map(prop => (
                    <PropertyCard 
                      key={prop.id} 
                      property={prop} 
                      onClick={() => { setSelectedProperty(prop); setView('PROPERTY_DETAIL'); }} 
                      onReport={handleReportProperty}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'SEARCH' && (
          <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Find Your Perfect Place</h1>
              <input 
                type="text"
                placeholder="Search by title or location..."
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.length > 0 ? (
                filteredProperties.map(prop => (
                  <PropertyCard 
                    key={prop.id} 
                    property={prop} 
                    onClick={() => { setSelectedProperty(prop); setView('PROPERTY_DETAIL'); }} 
                    onReport={handleReportProperty}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400">
                  <p className="text-xl">No properties found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'PROPERTY_DETAIL' && selectedProperty && (
          <div className="max-w-5xl mx-auto py-12 px-4">
            <button onClick={() => setView('SEARCH')} className="mb-6 text-blue-600 hover:underline flex items-center gap-2">
              &larr; Back to Listings
            </button>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-full h-[400px] object-cover rounded-2xl" />
                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px]">
                  {selectedProperty.images.slice(1).map((img, i) => (
                    <img key={i} src={img} className="w-full h-[190px] object-cover rounded-2xl" />
                  ))}
                  {selectedProperty.images.length === 1 && (
                    <div className="w-full h-[190px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">No more images</div>
                  )}
                </div>
              </div>
              <div className="p-8">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedProperty.transaction === 'RENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        For {selectedProperty.transaction}
                        </span>
                        <button 
                          onClick={() => handleReportProperty(selectedProperty.id)}
                          className="text-xs text-red-400 hover:text-red-600 hover:underline flex items-center gap-1"
                        >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                           Report Scam
                        </button>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900">{selectedProperty.title}</h1>
                    <p className="text-slate-500 text-lg flex items-center gap-2 mt-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {selectedProperty.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-blue-600">${selectedProperty.price.toLocaleString()}{selectedProperty.transaction === 'RENT' ? '/mo' : ''}</p>
                    <p className="text-slate-500 font-medium">{selectedProperty.area.toLocaleString()} sq. ft</p>
                  </div>
                </div>

                {selectedProperty.type === PropertyType.HOUSE && (
                  <div className="flex flex-wrap gap-4 py-6 border-y border-slate-100 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 text-sm font-medium">Bedrooms</span>
                      <span className="text-slate-900 font-bold">{selectedProperty.beds || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 text-sm font-medium">Toilets</span>
                      <span className="text-slate-900 font-bold">{selectedProperty.toilets || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 text-sm font-medium">Kitchens</span>
                      <span className="text-slate-900 font-bold">{selectedProperty.kitchens || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 text-sm font-medium">Parlors</span>
                      <span className="text-slate-900 font-bold">{selectedProperty.parlors || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 text-sm font-medium">Total Rooms</span>
                      <span className="text-slate-900 font-bold">{selectedProperty.rooms || 0}</span>
                    </div>
                  </div>
                )}
                
                {selectedProperty.type === PropertyType.LAND && (
                   <div className="flex flex-wrap gap-4 py-6 border-y border-slate-100 mb-8">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 text-sm font-medium">Land Area</span>
                        <span className="text-slate-900 font-bold">{selectedProperty.area.toLocaleString()} sq. ft</span>
                      </div>
                   </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4">Description</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedProperty.description}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold mb-4">Owner Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                          {selectedProperty.ownerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedProperty.ownerName}</p>
                          <p className="text-sm text-slate-500">Verified Partner</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => setShowViewingModal(true)}
                          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          Request Viewing
                        </button>
                        
                        <a href={`tel:${selectedProperty.ownerPhone}`} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                          Call Owner
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {showViewingModal && (
              <ViewingRequestModal 
                propertyTitle={selectedProperty.title}
                ownerPhone={selectedProperty.ownerPhone}
                onClose={() => setShowViewingModal(false)}
              />
            )}
          </div>
        )}

        {view === 'LOGIN' && (
          <OwnerLogin 
            onLoginSuccess={handleLoginSuccess}
            onRegisterClick={() => setView('OWNER_REGISTER')}
            findUserByPhone={findUserByPhone}
          />
        )}

        {view === 'OWNER_REGISTER' && (
          <OwnerRegister 
            onRegister={handleRegister} 
            onLoginClick={() => setView('LOGIN')} 
          />
        )}
        
        {/* ADD_FIRST_PROPERTY is handled by PropertyForm but rendered cleanly over a background */}
        {view === 'ADD_FIRST_PROPERTY' && (
          <div className="relative">
             {/* Optional background or blurred layer behind the form if needed, though form has its own backdrop */}
             <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50"></div>
             <PropertyForm 
               onClose={handleLogout} // Cancelling here means logging out/cancelling registration
               onSubmit={handleFirstPropertySubmit}
               existingProperties={properties} 
             />
          </div>
        )}

        {view === 'PAYMENT' && user && (
          <PaymentModal onConfirm={handlePaymentSuccess} />
        )}

        {/* Dashboard: Shown if user has paid OR if payment is disabled via Creator Mode */}
        {view === 'OWNER_DASHBOARD' && user && (user.hasPaid || !paymentActive) && (
          <OwnerDashboard 
            user={user} 
            properties={properties.filter(p => p.ownerId === user.id)}
            onAddProperty={handleAddProperty}
            setAppView={setView}
          />
        )}
        
        {/* Payment Required Screen: Only shown if user hasn't paid AND payment is active */}
        {view === 'OWNER_DASHBOARD' && user && !user.hasPaid && paymentActive && (
          <div className="flex items-center justify-center py-20 px-4 text-center">
            <div className="max-w-md">
               <h2 className="text-2xl font-bold mb-4">Payment Required</h2>
               <p className="text-slate-500 mb-8">You need to pay the activation fee to manage your listings and add properties.</p>
               <button onClick={() => setView('PAYMENT')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Go to Payment</button>
            </div>
          </div>
        )}

        {view === 'CREATOR_DASHBOARD' && (
          <CreatorDashboard 
            users={allUsers}
            properties={properties}
            paymentActive={paymentActive}
            onTogglePayment={() => setPaymentActive(!paymentActive)}
            onDeleteProperty={handleDeleteProperty}
            onClose={() => setView('LANDING')}
          />
        )}
      </main>

      <Footer 
        onTogglePayment={() => setView('CREATOR_DASHBOARD')} 
      />
    </div>
  );
};

export default App;
