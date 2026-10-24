'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from './AuthModal';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Package, Users, CheckCircle2, Phone, Plus } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onNavigateToScan: () => void;
  onNavigateToMarketplace: () => void;
}

export default function UserDashboard({
  user,
  onNavigateToScan,
  onNavigateToMarketplace,
}: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings' | 'pickups'>('requests');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/marketplace/user/${user.id}/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user.id]);

  const handleCompletePickup = async (transactionId: string, listingId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/marketplace/complete-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, listingId }),
      });

      if (res.ok) {
        setActionMessage('Pickup completed and transaction logged.');
        setTimeout(() => setActionMessage(null), 4000);
        fetchDashboard();
      }
    } catch (err: any) {
      alert(`Error completing pickup: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading your account data...
      </div>
    );
  }

  const myListings = data?.myListings || [];
  const incomingRequests = data?.incomingRequests || [];
  const myBookings = data?.myBookings || [];

  // Real calculations based strictly on current user items
  const activeCount = myListings.filter((l: any) => l.status === 'available').length;
  const pendingCount = myListings.filter((l: any) => l.status === 'pending_pickup').length;
  const soldCount = myListings.filter((l: any) => l.status === 'sold').length;
  const totalEarned = myListings
    .filter((l: any) => l.status === 'sold')
    .reduce((sum: number, l: any) => sum + (Number(l.user_asking_price) || 0), 0);

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header Card - Minimal, clean, no gradients */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center text-lg font-bold">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user.full_name}</h2>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200 capitalize">
                {user.role === 'collector' ? 'Scrap Collector' : 'Waste Generator'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <Button
          onClick={onNavigateToScan}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium gap-1.5 rounded-lg px-3.5 py-2 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Listing</span>
        </Button>
      </div>

      {/* Metrics Row - Simple, real numbers only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Listed</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {myListings.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {activeCount} active
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Buyer Requests</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {incomingRequests.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {pendingCount} pending pickup
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Items Sold</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {soldCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Transferred items
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Earnings</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ${totalEarned.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            From completed sales
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`pb-3 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-b-2 border-slate-900 font-bold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Buyer Inquiries</span>
          {incomingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`pb-3 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === 'listings'
              ? 'border-b-2 border-slate-900 font-bold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>My Listed Products ({myListings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pickups')}
          className={`pb-3 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === 'pickups'
              ? 'border-b-2 border-slate-900 font-bold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>My Pickups ({myBookings.length})</span>
        </button>
      </div>

      {/* TAB 1: BUYER INQUIRIES */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <span className="text-2xl block mb-2 text-slate-400">📫</span>
              <h3 className="text-sm font-semibold text-slate-800">No Buyer Requests</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                When a collector or buyer reserves an item, their contact information and scheduled pickup will appear here.
              </p>
              <Button onClick={onNavigateToScan} variant="outline" size="sm" className="text-xs">
                Scan & List Item
              </Button>
            </div>
          ) : (
            incomingRequests.map((req: any) => (
              <div
                key={req.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  {req.listing?.image_url && (
                    <img
                      src={req.listing.image_url}
                      alt={req.listing.item_name}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        req.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {req.status === 'pending' ? 'Pickup Reserved' : 'Completed'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        ${req.final_price || req.listing?.user_asking_price}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">
                      {req.listing?.item_name || 'Marketplace Item'}
                    </h4>

                    {/* Buyer Information Box */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs space-y-1 mt-2">
                      <div className="text-slate-700 flex items-center gap-1.5">
                        <span className="font-medium">Buyer:</span>
                        <span className="font-semibold text-slate-900">{req.collector?.full_name}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone:</span>
                        <a href={`tel:${req.collector?.contact_info}`} className="text-slate-900 font-semibold underline">
                          {req.collector?.contact_info}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0 justify-center">
                  {req.status === 'pending' ? (
                    <Button
                      onClick={() => handleCompletePickup(req.id, req.listing_id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium py-2 px-3.5 rounded-lg"
                    >
                      Confirm Handover
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-center">
                      Completed & Transferred
                    </span>
                  )}
                  <a
                    href={`tel:${req.collector?.contact_info}`}
                    className="text-xs text-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Call Buyer
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MY LISTED PRODUCTS */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No Items Listed Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Scan scrap, broken appliances, or reusable materials to publish a listing.
              </p>
              <Button onClick={onNavigateToScan} variant="outline" size="sm" className="text-xs">
                Scan Item Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myListings.map((item: any) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                  <div>
                    {item.image_url && (
                      <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2.5 bg-slate-50 border border-slate-100">
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        item.status === 'available'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : item.status === 'pending_pickup'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        ${item.user_asking_price}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-xs mt-1 line-clamp-1">
                      {item.item_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.category} • {item.condition}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.location?.city || 'Local area'}</span>
                    {item.status === 'pending_pickup' && (
                      <span className="text-amber-700 font-medium">
                        Pickup pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY PICKUPS */}
      {activeTab === 'pickups' && (
        <div className="space-y-3">
          {myBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <span className="text-2xl block mb-2 text-slate-400">🚚</span>
              <h3 className="text-sm font-semibold text-slate-800">No Pickups Claimed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Browse available listings in the marketplace to source scrap and reusable goods.
              </p>
              <Button onClick={onNavigateToMarketplace} variant="outline" size="sm" className="text-xs">
                Browse Marketplace
              </Button>
            </div>
          ) : (
            myBookings.map((booking: any) => (
              <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {booking.listing?.image_url && (
                    <img
                      src={booking.listing.image_url}
                      alt={booking.listing.item_name}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-100 border border-slate-100"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">
                      {booking.listing?.item_name || 'Booked Item'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Price: ${booking.final_price} • {booking.listing?.location?.city || 'Local Area'}
                    </p>
                    <span className="text-[10px] font-medium text-emerald-700">
                      {booking.status === 'pending' ? 'Scheduled for Pickup' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
