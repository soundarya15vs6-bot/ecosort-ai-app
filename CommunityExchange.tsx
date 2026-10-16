import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  MapPin,
  Clock,
  Plus,
  Search,
  MessageCircle,
  CheckCircle2,
  Share2,
  Sparkles,
  Coins,
  X,
  Send,
  Coffee,
  Wine,
  Layers,
  Hammer,
  AlertCircle,
  DollarSign,
  Store,
  Tag,
} from 'lucide-react';
import { CommunityListing, CommunityWantedRequest, WasteAnalysisResult } from '../types/recycling';
import { INITIAL_COMMUNITY_LISTINGS, INITIAL_WANTED_REQUESTS } from '../data/mockData';

interface CommunityExchangeProps {
  onEarnCoins: (amount: number, reason: string) => void;
  prefillFromScan?: WasteAnalysisResult | null;
}

export const CommunityExchange: React.FC<CommunityExchangeProps> = ({
  onEarnCoins,
  prefillFromScan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'available' | 'wanted'>('available');
  const [listings, setListings] = useState<CommunityListing[]>(INITIAL_COMMUNITY_LISTINGS);
  const [wantedRequests, setWantedRequests] = useState<CommunityWantedRequest[]>(INITIAL_WANTED_REQUESTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(Boolean(prefillFromScan));
  const [selectedListingForClaim, setSelectedListingForClaim] = useState<CommunityListing | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [neighborChatInput, setNeighborChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);

  // New Listing Form State
  const [newTitle, setNewTitle] = useState(prefillFromScan ? `Surplus ${prefillFromScan.itemName}` : '');
  const [newCategory, setNewCategory] = useState(prefillFromScan?.suggestedCommunityCategory || 'Moving Boxes & Cardboard');
  const [newQuantity, setNewQuantity] = useState('1 unit');
  const [newDescription, setNewDescription] = useState(prefillFromScan ? 'Clean, sorted and ready for neighborhood reuse.' : '');
  const [newPickupType, setNewPickupType] = useState<'Porch Pickup' | 'Direct Handoff' | 'Curbside Box'>('Porch Pickup');
  const [newLocation, setNewLocation] = useState('Oakridge Central / 5th St');
  const [newListingType, setNewListingType] = useState<'Donation' | 'DIY Revend'>('Donation');
  const [newRevendPrice, setNewRevendPrice] = useState('$8.00');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  useEffect(() => {
    if (prefillFromScan) {
      if (prefillFromScan.reverseVending?.diyRevendingOption) {
        setNewListingType('DIY Revend');
        setNewTitle(prefillFromScan.reverseVending.diyRevendingOption.title);
        setNewRevendPrice(prefillFromScan.reverseVending.diyRevendingOption.estimatedResaleValue || '$8.00');
        setNewCategory('DIY Revend / Upcycled Items');
        setNewDescription(
          `Upcycled item created from ${prefillFromScan.itemName}. Cleaned and crafted into functional home utility. Steps taken: ${prefillFromScan.reverseVending.diyRevendingOption.revendSteps.join(' ')}`
        );
      } else {
        setNewListingType('Donation');
        setNewTitle(`Clean ${prefillFromScan.itemName}`);
        setNewCategory(prefillFromScan.suggestedCommunityCategory || 'Moving Boxes & Cardboard');
        setNewDescription(`Clean, pre-sorted ${prefillFromScan.itemName} diverted from landfill. Ready for neighbor reuse.`);
      }
      if (prefillFromScan.scannedImageUrl) {
        setNewImageUrl(prefillFromScan.scannedImageUrl);
      }
      setIsPostModalOpen(true);
    }
  }, [prefillFromScan]);

  const categories = [
    'All',
    'DIY Revend / Upcycled Items',
    'Moving Boxes & Cardboard',
    'Glass Jars & Storage',
    'Packaging & Bubblewrap',
    'Gardening & Compost',
    'Wood & Pallets',
  ];

  const filteredListings = listings.filter((l) => {
    if (selectedCategory !== 'All' && l.category !== selectedCategory) return false;
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase()) && !l.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newListing: CommunityListing = {
      id: `LIST-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      quantity: newQuantity,
      condition: 'Clean Surplus',
      description: newDescription || 'Clean surplus material available for neighbor pickup.',
      donorName: 'You (Local Resident)',
      donorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      distanceMiles: 0.1,
      locationArea: newLocation,
      pickupType: newPickupType,
      status: 'Available',
      createdAt: 'Just now',
      iconName: newListingType === 'DIY Revend' ? 'Sparkles' : 'Package',
      imageUrl: newImageUrl || undefined,
      listingType: newListingType,
      revendPrice: newListingType === 'DIY Revend' ? newRevendPrice : undefined,
    };

    setListings([newListing, ...listings]);
    setIsPostModalOpen(false);
    onEarnCoins(80, newListingType === 'DIY Revend' ? `Listed DIY Revended item ${newTitle}` : `Shared ${newTitle} on Community Board`);
    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewImageUrl('');
  };

  const handleOpenClaimModal = (listing: CommunityListing) => {
    setSelectedListingForClaim(listing);
    setClaimSuccessMessage(null);
    setNeighborChatInput('');
    setChatMessages([
      {
        sender: listing.donorName,
        text: `Hi neighbor! Thanks for keeping materials out of landfill. ${listing.pickupType === 'Porch Pickup' ? 'Items are placed safe on the porch under the awning.' : 'Let me know when you can stop by!'}`,
        time: 'Just now',
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!neighborChatInput.trim()) return;
    const newMsg = {
      sender: 'You',
      text: neighborChatInput,
      time: 'Just now',
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setNeighborChatInput('');

    // Simulate neighbor reply
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: selectedListingForClaim?.donorName || 'Neighbor',
          text: 'Sounds great! I will keep them ready for you. See you soon!',
          time: 'Just now',
        },
      ]);
    }, 1200);
  };

  const handleConfirmReservation = () => {
    if (!selectedListingForClaim) return;
    setListings((prev) =>
      prev.map((l) => (l.id === selectedListingForClaim.id ? { ...l, status: 'Reserved', claimedBy: 'You' } : l))
    );
    setClaimSuccessMessage(`Successfully reserved! Pickup code: #ECO-${Math.floor(1000 + Math.random() * 9000)}. Address coordinates shared.`);
    onEarnCoins(20, `Reserved ${selectedListingForClaim.title}`);
  };

  const handleFulfillWanted = (wanted: CommunityWantedRequest) => {
    setWantedRequests((prev) => prev.filter((w) => w.id !== wanted.id));
    onEarnCoins(80, `Helped neighbor with ${wanted.title}`);
    alert(`Thank you! ${wanted.requestedBy} was notified and will connect with you for pickup.`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Hyperlocal Material Circularity</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Neighborhood Donation Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Give clean cardboard boxes, glass jars, bubble wrap, or scrap wood to neighbors who need them instead of throwing them away.
          </p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-teal-900/30 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Give Surplus Material (+80 Coins)</span>
        </button>
      </div>

      {/* Community Impact Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Materials In Circulation</p>
          <p className="text-xl sm:text-2xl font-black text-teal-400 mt-1">
            {listings.length + 42} items
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Within 1.5 mile radius</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Cardboard Diverted</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            184 Boxes
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Saved from municipal bin</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Glass Jars Reused</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            96 Jars
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">By local cooks & gardeners</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Active Neighbors</p>
          <p className="text-xl sm:text-2xl font-black text-sky-400 mt-1">
            64 Residents
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Oakridge & West Meadow</p>
        </div>
      </div>

      {/* Sub Tabs: Available Materials vs Wanted Requests */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveSubTab('available')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'available'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Available Free Materials ({filteredListings.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('wanted')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'wanted'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Neighbors Seeking Materials ({wantedRequests.length})</span>
        </button>
      </div>

      {/* AVAILABLE MATERIALS VIEW */}
      {activeSubTab === 'available' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cardboard, jars, pallets, bubble wrap..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col justify-between hover:border-teal-500/40 transition-all shadow-lg group"
              >
                <div>
                  {/* Photo Preview if uploaded */}
                  {item.imageUrl && (
                    <div className="relative h-44 w-full bg-black overflow-hidden border-b border-slate-800">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold text-teal-300 border border-teal-500/30">
                          {item.listingType === 'DIY Revend' ? '✨ DIY Revend' : '🌿 Neighbor Donation'}
                        </span>
                      </div>
                      {item.revendPrice && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
                          {item.revendPrice}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Top line info */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[11px] font-bold">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.createdAt}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-teal-200 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      {!item.imageUrl && item.revendPrice && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs shrink-0">
                          {item.revendPrice}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-3 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Quantity:</span>
                        <span className="font-semibold text-white">{item.quantity}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Pickup Style:</span>
                        <span className="font-medium text-emerald-400">{item.pickupType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.donorAvatar}
                      alt={item.donorName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div className="text-[11px]">
                      <p className="text-white font-medium">{item.donorName}</p>
                      <p className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-400" />
                        {item.distanceMiles} mi away
                      </p>
                    </div>
                  </div>

                  {item.status === 'Available' ? (
                    <button
                      onClick={() => handleOpenClaimModal(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                        item.listingType === 'DIY Revend'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                          : 'bg-teal-500/15 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300'
                      }`}
                    >
                      {item.listingType === 'DIY Revend' ? `Buy (${item.revendPrice || '$8'})` : 'Claim Free'}
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                      Reserved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEIGHBORS WANTED REQUESTS VIEW */}
      {activeSubTab === 'wanted' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-200">
              Have any of these materials at home? Fulfilling a neighbor&apos;s request earns you <strong className="text-amber-300">+80 EcoCoins</strong> and avoids cardboard or containers going to waste!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wantedRequests.map((wanted) => (
              <div
                key={wanted.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                      {wanted.category}
                    </span>
                    <span className="text-[11px] font-bold text-rose-400">
                      Needed: {wanted.dateNeeded}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {wanted.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2">
                    &ldquo;{wanted.message}&rdquo;
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seeking:</span>
                      <span className="font-semibold text-white">{wanted.quantityNeeded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requested by:</span>
                      <span className="font-medium text-white">{wanted.requestedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    {wanted.distanceMiles} miles away
                  </span>

                  <button
                    onClick={() => handleFulfillWanted(wanted)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    I Have This (+80 Coins)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POST SURPLUS MATERIAL MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-black text-white">
                  {newListingType === 'DIY Revend' ? 'List DIY Revend & Upcycled Item' : 'Give Trash / Material to Neighbors'}
                </h3>
                <p className="text-xs text-slate-400">
                  {newListingType === 'DIY Revend'
                    ? 'Earn cash/rewards and +100 EcoCoins by revending upcycled creations'
                    : 'Earn +80 EcoCoins by keeping usable materials circulating locally'}
                </p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* Listing Type Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Exchange Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewListingType('Donation');
                      if (newCategory === 'DIY Revend / Upcycled Items') setNewCategory('Moving Boxes & Cardboard');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      newListingType === 'Donation'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🌿 Free Donation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewListingType('DIY Revend');
                      setNewCategory('DIY Revend / Upcycled Items');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      newListingType === 'DIY Revend'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>✨ DIY Revend / Resale</span>
                  </button>
                </div>
              </div>

              {/* Scanned Image Preview if available */}
              {newImageUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <img
                    src={newImageUrl}
                    alt="Item"
                    className="w-14 h-14 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 block">Photo Attached from Live Scan</span>
                    <span className="text-slate-400 text-[11px]">Your uploaded photo will be shown to neighbors</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 10 Clean Cardboard Moving Boxes or Upcycled Succulent Planter"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="DIY Revend / Upcycled Items">DIY Revend / Upcycled Items</option>
                    <option value="Moving Boxes & Cardboard">Moving Boxes & Cardboard</option>
                    <option value="Glass Jars & Storage">Glass Jars & Storage</option>
                    <option value="Packaging & Bubblewrap">Packaging & Bubblewrap</option>
                    <option value="Gardening & Compost">Gardening & Compost</option>
                    <option value="Wood & Pallets">Wood & Pallets</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {newListingType === 'DIY Revend' ? 'Asking Resale Price' : 'Quantity'}
                  </label>
                  {newListingType === 'DIY Revend' ? (
                    <input
                      type="text"
                      value={newRevendPrice}
                      onChange={(e) => setNewRevendPrice(e.target.value)}
                      placeholder="e.g. $8.00 or 50 EcoCoins"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="e.g. 8 boxes, 12 jars"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Pickup Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Porch Pickup', 'Direct Handoff', 'Curbside Box'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setNewPickupType(type)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        newPickupType === type
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Location / Cross Streets
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Oakridge Central / 4th Ave"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Short Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Flattened clean cardboard, tape removed, dry, ready on porch."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-900/30 transition-all cursor-pointer active:scale-95"
              >
                {newListingType === 'DIY Revend'
                  ? `Publish DIY Revend Listing (${newRevendPrice || '$8'} • +100 EcoCoins)`
                  : 'Publish to Neighborhood Board (+80 EcoCoins)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CLAIM / RESERVE & NEIGHBOR CHAT MODAL */}
      {selectedListingForClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-400">
                  Claim Surplus Material
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedListingForClaim.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedListingForClaim(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {claimSuccessMessage ? (
              <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Pickup Reserved!</h4>
                <p className="text-xs text-emerald-200">{claimSuccessMessage}</p>
                <p className="text-xs text-slate-400">
                  Donor: {selectedListingForClaim.donorName} • {selectedListingForClaim.locationArea} ({selectedListingForClaim.pickupType})
                </p>
                <button
                  onClick={() => setSelectedListingForClaim(null)}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Offered by:</span>
                  <span className="text-white font-semibold">{selectedListingForClaim.donorName}</span>
                </div>

                {/* Neighbor Chat Simulation */}
                <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/70 h-44 overflow-y-auto space-y-2 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-500 mb-0.5">{msg.sender}</span>
                      <div
                        className={`p-2.5 rounded-xl max-w-[85%] ${
                          msg.sender === 'You'
                            ? 'bg-teal-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={neighborChatInput}
                    onChange={(e) => setNeighborChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Send a quick message to coordinate pickup..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleConfirmReservation}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Confirm Claim & Reserve Material (+20 Coins)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
