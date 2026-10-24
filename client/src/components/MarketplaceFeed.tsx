'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from './AuthModal';
import { Button } from './ui/button';
import { Search, MapPin, Plus } from 'lucide-react';

interface MarketplaceListing {
  id: string;
  item_name: string;
  category: string;
  materials: string[];
  condition: string;
  user_asking_price: number;
  ai_estimated_value: number;
  image_url?: string;
  status: 'available' | 'pending_pickup' | 'sold';
  location?: { city: string; address?: string };
  ai_analysis?: any;
}

interface MarketplaceFeedProps {
  currentUser: UserProfile;
  onNavigateToDashboard: () => void;
  onNavigateToScan: () => void;
}

const CATEGORIES = [
  'All',
  'Scrap Metal',
  'E-Waste',
  'Wood Furniture',
  'Plastics & Paper'
];

export default function MarketplaceFeed({
  currentUser,
  onNavigateToDashboard,
  onNavigateToScan,
}: MarketplaceFeedProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Booking Modal State
  const [bookingTarget, setBookingTarget] = useState<MarketplaceListing | null>(null);
  const [collectorName, setCollectorName] = useState<string>(currentUser.full_name);
  const [collectorPhone, setCollectorPhone] = useState<string>(currentUser.contact_info || '');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      params.append('status', 'available');

      const res = await fetch(`${backendUrl}/api/marketplace/listings?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setListings(json.listings || []);
      }
    } catch (e) {
      console.error('Failed to load marketplace listings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, searchTerm]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTarget) return;

    setIsSubmittingBooking(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/marketplace/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: bookingTarget.id,
          collectorId: currentUser.id,
          collectorName: collectorName || currentUser.full_name,
          collectorContact: collectorPhone || currentUser.contact_info,
        }),
      });

      if (res.ok) {
        setBookingSuccessMsg(`Reserved "${bookingTarget.item_name}".`);
        setTimeout(() => {
          setBookingSuccessMsg(null);
          setBookingTarget(null);
          fetchListings();
          onNavigateToDashboard();
        }, 1200);
      } else {
        const err = await res.json();
        alert(`Booking error: ${err.error || 'Failed to book item.'}`);
      }
    } catch (err: any) {
      alert(`Booking request failed: ${err.message}`);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search listings by material or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-lg focus:border-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <Button
          onClick={onNavigateToScan}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium gap-1.5 rounded-lg px-4 py-2 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Scan Item</span>
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Marketplace Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <span className="text-3xl block mb-2 text-slate-300">📦</span>
          <h3 className="text-sm font-semibold text-slate-800">No Listings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No items currently available under this category.
          </p>
          <Button onClick={onNavigateToScan} variant="outline" size="sm" className="text-xs">
            Create a Listing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="relative aspect-[4/3] bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-2.5">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=80'}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                    ${item.user_asking_price}
                  </span>
                  <span className="absolute bottom-2 left-2 bg-white/90 text-slate-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200">
                    {item.condition}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="uppercase">{item.category}</span>
                  <span>Est: ${item.ai_estimated_value}</span>
                </div>

                <h3 className="font-semibold text-slate-900 text-xs line-clamp-1">
                  {item.item_name}
                </h3>

                {item.materials && item.materials.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.materials.slice(0, 3).map((m, i) => (
                      <span key={i} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[120px]">{item.location?.city || 'Local Area'}</span>
                </span>

                <Button
                  onClick={() => setBookingTarget(item)}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium h-7 px-3 rounded"
                >
                  Book Pickup
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Drawer Modal */}
      {bookingTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-xl p-5 border border-slate-200 shadow-xl relative">
            <button
              type="button"
              onClick={() => setBookingTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>

            <h3 className="text-sm font-bold text-slate-900">
              Reserve Item for Pickup
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lock in your collection request for <strong>{bookingTarget.item_name}</strong> (${bookingTarget.user_asking_price}).
            </p>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={collectorPhone}
                  onChange={(e) => setCollectorPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-900 outline-none"
                />
              </div>

              {bookingSuccessMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg text-center">
                  {bookingSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingTarget(null)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
                >
                  {isSubmittingBooking ? 'Reserving...' : 'Confirm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
