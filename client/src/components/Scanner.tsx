'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Camera, Upload, RefreshCw, Play, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

interface EstimatedScrapValue {
  min: number;
  max: number;
  suggestedAskingPrice: number;
}

interface RestoreRecommendation {
  viable: boolean;
  headline: string;
  stepsSummary: string;
  materialsNeeded: string[];
  youtubeSearchQuery: string;
  suggestedProducts: string[];
}

interface SellRecommendation {
  scrapHeadline: string;
  marketDemand: 'High' | 'Medium' | 'Low';
  recommendedTitle: string;
  recommendedDescription: string;
}

interface AIAnalysis {
  itemName: string;
  category: string;
  materials: string[];
  condition: string;
  estimatedScrapValue: EstimatedScrapValue;
  restoreRecommendation: RestoreRecommendation;
  sellRecommendation: SellRecommendation;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

interface RestorationProduct {
  id: string;
  product_name: string;
  category: string;
  price: number;
  affiliate_link_or_internal_stock: string;
  description?: string;
  image_url?: string;
}

interface ScanResponse {
  success: boolean;
  imageUrl: string;
  analysis: AIAnalysis;
  youtubeTutorials: YouTubeVideo[];
  restorationProducts: RestorationProduct[];
}

export default function Scanner() {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'restore' | 'sell'>('restore');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Listing state
  const [askingPrice, setAskingPrice] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [listingPublished, setListingPublished] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg('Camera access unavailable. Please use the Upload button.');
      setCameraActive(false);
    }
  }, [cameraFacing]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();

    canvas.toBlob((blob) => {
      if (blob) {
        handleUploadAndScan(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    handleUploadAndScan(file);
  };

  const handleUploadAndScan = async (fileOrBlob: Blob | File) => {
    setIsScanning(true);
    setErrorMsg(null);
    setListingPublished(false);

    try {
      const formData = new FormData();
      formData.append('image', fileOrBlob, 'scan.jpg');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/scan`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Scan request returned HTTP ${response.status}`);
      }

      const data: ScanResponse = await response.json();
      setScanResult(data);
      setAskingPrice(data.analysis.estimatedScrapValue.suggestedAskingPrice || 15);

      if (!data.analysis.restoreRecommendation.viable) {
        setActiveTab('sell');
      } else {
        setActiveTab('restore');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePublishListing = async () => {
    if (!scanResult) return;
    setIsPublishing(true);

    try {
      // Get current user id from localStorage if available
      let currentUserId = '00000000-0000-0000-0000-000000000001';
      try {
        const saved = localStorage.getItem('recyclo_user');
        if (saved) currentUserId = JSON.parse(saved).id;
      } catch (e) {}

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/marketplace/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatorId: currentUserId,
          itemName: scanResult.analysis.sellRecommendation.recommendedTitle || scanResult.analysis.itemName,
          category: scanResult.analysis.category,
          materials: scanResult.analysis.materials,
          condition: scanResult.analysis.condition,
          aiEstimatedValue: scanResult.analysis.estimatedScrapValue.suggestedAskingPrice,
          userAskingPrice: askingPrice,
          imageUrl: scanResult.imageUrl || capturedImage,
          aiAnalysis: scanResult.analysis,
        }),
      });

      if (!response.ok) throw new Error('Listing submission failed.');
      setListingPublished(true);
    } catch (err: any) {
      alert(`Error publishing listing: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setScanResult(null);
    setListingPublished(false);
    setErrorMsg(null);
    startCamera();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Scanner Card */}
      {!scanResult && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="relative aspect-[4/3] w-full bg-slate-900 flex flex-col items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] bg-black/60 text-white px-2.5 py-1 rounded">
                      Camera Active
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <span className="text-xs bg-black/70 text-white px-3 py-1 rounded-full">
                      Point camera at object
                    </span>
                  </div>
                </div>

                {/* Camera Control Bar */}
                <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-6 px-4 z-10">
                  <button
                    type="button"
                    onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')}
                    className="p-2.5 bg-black/60 hover:bg-black/80 rounded-full text-white text-xs border border-white/20 transition-colors"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 bg-slate-900 rounded-full" />
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2.5 bg-black/60 hover:bg-black/80 rounded-full text-white text-xs border border-white/20 transition-colors"
                    title="Close camera"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-white flex flex-col items-center">
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Scan preview"
                    className="w-44 h-44 object-cover rounded-xl mb-4 border border-slate-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7" />
                  </div>
                )}

                <h3 className="text-base font-bold text-white mb-1">
                  Item Scanner
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Photograph an item to identify its materials and calculate fair market scrap and restoration value.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium py-2 rounded-lg"
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    <span>Open Camera</span>
                  </Button>

                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* Scanning Progress Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white z-20 space-y-2">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-white">Analyzing item composition...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Decision Engine: Restore vs. Sell */}
      {scanResult && (
        <div className="space-y-4 text-slate-900">
          {/* Header Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured Item"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {scanResult.analysis.category}
                  </span>
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {scanResult.analysis.condition}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {scanResult.analysis.itemName}
                </h2>
                <div className="flex flex-wrap gap-1 mt-1">
                  {scanResult.analysis.materials.map((m, i) => (
                    <span key={i} className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetScanner}
              className="text-xs font-medium gap-1 flex-shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Scan Another</span>
            </Button>
          </div>

          {/* Decision Engine Tab Selector */}
          <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('restore')}
              className={`pb-3 -mb-px transition-colors ${
                activeTab === 'restore'
                  ? 'border-b-2 border-slate-900 font-bold text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Restore & Upcycle
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sell')}
              className={`pb-3 -mb-px transition-colors ${
                activeTab === 'sell'
                  ? 'border-b-2 border-slate-900 font-bold text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sell / Scrap (${scanResult.analysis.estimatedScrapValue.suggestedAskingPrice})
            </button>
          </div>

          {/* TAB 1: RESTORE */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {scanResult.analysis.restoreRecommendation.headline}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {scanResult.analysis.restoreRecommendation.stepsSummary}
                </p>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    Recommended Materials:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {scanResult.analysis.restoreRecommendation.materialsNeeded.map((mat, i) => (
                      <span key={i} className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                        ✓ {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* YouTube Tutorial Videos */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-800">
                  Related Tutorials ({scanResult.youtubeTutorials.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scanResult.youtubeTutorials.map((video) => (
                    <a
                      key={video.videoId}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors flex flex-col shadow-xs"
                    >
                      <div className="relative aspect-video bg-slate-100">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <h5 className="text-xs font-medium text-slate-900 line-clamp-2">
                          {video.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {video.channelTitle}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SELL / SCRAP */}
          {activeTab === 'sell' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Estimated Fair Value</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    ${scanResult.analysis.estimatedScrapValue.suggestedAskingPrice.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Range: ${scanResult.analysis.estimatedScrapValue.min} – ${scanResult.analysis.estimatedScrapValue.max}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Market Demand</span>
                  <span className="text-xs font-semibold text-slate-900">
                    {scanResult.analysis.sellRecommendation.marketDemand}
                  </span>
                </div>
              </div>

              {/* Instant Listing Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900">
                  Publish to Marketplace
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Listing Title</label>
                  <input
                    type="text"
                    defaultValue={scanResult.analysis.sellRecommendation.recommendedTitle}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Asking Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-900 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Description</label>
                  <textarea
                    rows={3}
                    defaultValue={scanResult.analysis.sellRecommendation.recommendedDescription}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-slate-900 outline-none text-slate-700"
                  />
                </div>

                {listingPublished ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <h5 className="text-xs font-bold text-emerald-900">Item Listed on Marketplace</h5>
                    <p className="text-[11px] text-emerald-700">
                      Collectors can now find and reserve this item in the marketplace.
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={isPublishing}
                    onClick={handlePublishListing}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    {isPublishing ? 'Publishing...' : `Publish Listing ($${askingPrice})`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
