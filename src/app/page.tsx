"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Gauge, Fuel, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLoadScript } from "@react-google-maps/api";

interface CalculationResults {
  distance: number | null;
  fuelRequired: number | null;
  gasPrice: number | null;
  totalCost: number | null;
  startAddress: string;
  endAddress: string;
  efficiency: string;
}

const libraries: ["places"] = ["places"];

export default function Home() {
  // Form state
  const [startAddress, setStartAddress] = useState<string>("");
  const [endAddress, setEndAddress] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [mileageValue, setMileageValue] = useState<string>("");
  const [gasPriceValue, setGasPriceValue] = useState<string>("");
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // Calculation results state
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [error, setError] = useState<string>("");
  
  // Refs for input elements
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const calculateDistance = async (origin: string, destination: string): Promise<number> => {
    const service = new google.maps.DistanceMatrixService();
    
    try {
      const response = await service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      });

      if (response.rows[0].elements[0].status === "OK") {
        return response.rows[0].elements[0].distance.value / 1000;
      }
      throw new Error("Unable to calculate distance");
    } catch (_err) {
      throw new Error("Distance calculation failed");
      console.error(_err);
    }
  };

  const calculateFuelRequired = (distanceInKm: number, efficiency: string): number => {
    const efficiencyValue = parseFloat(efficiency);
    
    if (isNaN(efficiencyValue)) {
      throw new Error("Invalid efficiency value");
    }

    return (distanceInKm / 100) * efficiencyValue;
  };

  const setupAutocomplete = (inputElement: HTMLInputElement, setAddress: (address: string) => void) => {
    const autocomplete = new google.maps.places.Autocomplete(inputElement, {
      types: ["address"],
      componentRestrictions: { country: "ca" }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place?.formatted_address) {
        setAddress(place.formatted_address);
      }
    });

    return autocomplete;
  };

  const initializeAutocomplete = useCallback(() => {
    if (!isLoaded || !window.google) return;

    if (startInputRef.current) {
      setupAutocomplete(startInputRef.current, setStartAddress);
    }

    if (endInputRef.current) {
      setupAutocomplete(endInputRef.current, setEndAddress);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && !showResults) {
      initializeAutocomplete();
    }
  }, [isLoaded, showResults, initializeAutocomplete]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCalculating(true);
    setError("");
    
    try {
      const gasPrice = parseFloat(gasPriceValue);
      if (isNaN(gasPrice) || gasPrice <= 0) {
        throw new Error("Please enter a valid gas price");
      }

      const distanceInKm = await calculateDistance(startAddress, endAddress);
      const fuelInLitres = calculateFuelRequired(distanceInKm, mileageValue);
      const cost = fuelInLitres * gasPrice;

      setCalculationResults({
        distance: distanceInKm,
        fuelRequired: fuelInLitres,
        gasPrice: gasPrice,
        totalCost: cost,
        startAddress,
        endAddress,
        efficiency: mileageValue
      });
      setShowResults(true);

    } catch (_err) {
      setError(_err instanceof Error ? _err.message : "An unknown error occurred");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleNewGastimation = () => {
    setShowResults(false);
    setCalculationResults(null);
    setStartAddress("");
    setEndAddress("");
    setMileageValue("");
    setGasPriceValue("");
    setError("");

    // Reset input fields
    if (startInputRef.current) startInputRef.current.value = "";
    if (endInputRef.current) endInputRef.current.value = "";

    // Reinitialize autocomplete (will be handled by useEffect)
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>Error loading Google Maps</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
            Gastimator
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
            Get accurate gas cost estimates for your trips.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Card className="p-6 shadow-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur">
            <div className="space-y-6">
              {!showResults ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Route Details Section */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Route Details
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="start">Start Address</Label>
                        <Input
                          id="start"
                          ref={startInputRef}
                          type="text"
                          placeholder="Enter starting address"
                          onChange={(e) => setStartAddress(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end">End Address</Label>
                        <Input
                          id="end"
                          ref={endInputRef}
                          type="text"
                          placeholder="Enter destination address"
                          onChange={(e) => setEndAddress(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Vehicle Efficiency Section */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Vehicle Efficiency
                    </h2>
                    <div>
                      <Label htmlFor="mileage">Vehicle Efficiency (L/100km)</Label>
                      <Input
                        id="mileage"
                        type="number"
                        step="0.1"
                        placeholder="Enter L/100km"
                        value={mileageValue}
                        onChange={(e) => setMileageValue(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Gas Price Section */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Fuel className="w-5 h-5" />
                      Fuel Price
                    </h2>
                    <div>
                      <Label htmlFor="gasPrice">Price per Litre (CAD)</Label>
                      <Input
                        id="gasPrice"
                        type="number"
                        step="0.001"
                        placeholder="Enter current gas price per litre"
                        value={gasPriceValue}
                        onChange={(e) => setGasPriceValue(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isCalculating || !startAddress || !endAddress || !mileageValue || !gasPriceValue}
                  >
                    {isCalculating ? "Calculating..." : "Calculate Route"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-center mb-6">Trip Summary</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Route Details
                        </h3>
                        <div className="space-y-2 pl-7">
                          <p><span className="font-medium">From:</span> {calculationResults?.startAddress}</p>
                          <p><span className="font-medium">To:</span> {calculationResults?.endAddress}</p>
                          <p><span className="font-medium">Distance:</span> {calculationResults?.distance?.toFixed(1)} km</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Gauge className="w-5 h-5" />
                          Vehicle Details
                        </h3>
                        <div className="space-y-2 pl-7">
                          <p><span className="font-medium">Efficiency:</span> {calculationResults?.efficiency} L/100km</p>
                          <p><span className="font-medium">Fuel Required:</span> {calculationResults?.fuelRequired?.toFixed(2)} L</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Fuel className="w-5 h-5" />
                          Cost Breakdown
                        </h3>
                        <div className="space-y-2 pl-7">
                          <p><span className="font-medium">Gas Price:</span> {calculationResults?.gasPrice?.toFixed(3)} CAD/L</p>
                          <p className="text-xl font-bold mt-4">
                            Total Cost: {calculationResults?.totalCost?.toFixed(2)} CAD
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleNewGastimation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    New Gastimation
                  </Button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}