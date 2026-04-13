'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Percent, IndianRupee, Check, AlertTriangle, Loader2, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { fcurrency } from '@/lib/utils';

interface DeliverySettings {
  id: number;
  isActive: boolean;
  chargeType: 'FIXED' | 'PERCENTAGE' | 'BOTH';
  minCharge: number;
  percentageCharge: number;
  freeDeliveryAbove: number;
}

interface PincodeValidation {
  valid: boolean;
  pincode?: string;
  district?: string;
  state?: string;
  chargeType?: string;
  minCharge?: number;
  percentageCharge?: number;
  freeDeliveryAbove?: number;
  error?: string;
}

function getAuthHeader(): HeadersInit {
  const auth = sessionStorage.getItem('adminAuth');
  if (auth) {
    return { 'Authorization': `Basic ${auth}` };
  }
  return {};
}

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    chargeType: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE' | 'BOTH',
    minCharge: 0,
    percentageCharge: 8,
    freeDeliveryAbove: 500,
    isActive: true,
  });

  const [testPincode, setTestPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<PincodeValidation | null>(null);
  const [testingPincode, setTestingPincode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/delivery-settings', {
        headers: getAuthHeader(),
      });
      if (!res.ok && res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setSettings(data);
      setFormData({
        chargeType: data.chargeType || 'PERCENTAGE',
        minCharge: data.minCharge || 0,
        percentageCharge: data.percentageCharge || 8,
        freeDeliveryAbove: data.freeDeliveryAbove || 500,
        isActive: data.isActive ?? true,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/delivery-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        fetchSettings();
      } else if (res.status === 401) {
        window.location.href = '/admin/login';
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPincode = async () => {
    if (!testPincode || testPincode.length !== 6) {
      setPincodeResult({ valid: false, error: 'Please enter a valid 6-digit pincode' });
      return;
    }

    setTestingPincode(true);
    try {
      const res = await fetch(`/api/pincode?pincode=${testPincode}`);
      const data = await res.json();
      setPincodeResult(data);
    } catch (error) {
      setPincodeResult({ valid: false, error: 'Failed to validate pincode' });
    } finally {
      setTestingPincode(false);
    }
  };

  const getChargeTypeLabel = (type: string) => {
    switch (type) {
      case 'FIXED': return 'Fixed Charge';
      case 'PERCENTAGE': return 'Percentage of Cart';
      case 'BOTH': return 'Min Charge or Percentage (whichever is higher)';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Truck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Delivery Settings</h1>
            <p className="text-gray-600">Configure delivery charges based on pincodes</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Default Delivery Charges</CardTitle>
            <CardDescription>
              These settings apply when no specific pincode override is configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                Enable Delivery Charges
              </Label>
              <button
                id="isActive"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isActive ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Charge Type</Label>
                <Select
                  value={formData.chargeType}
                  onValueChange={(value: 'FIXED' | 'PERCENTAGE' | 'BOTH') =>
                    setFormData({ ...formData, chargeType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Fixed Charge Only
                      </div>
                    </SelectItem>
                    <SelectItem value="PERCENTAGE">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Percentage of Cart Total
                      </div>
                    </SelectItem>
                    <SelectItem value="BOTH">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Min Charge or Percentage (whichever is higher)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.chargeType === 'FIXED' || formData.chargeType === 'BOTH') && (
                <div className="space-y-2">
                  <Label htmlFor="minCharge">Minimum Charge (₹)</Label>
                  <Input
                    id="minCharge"
                    type="number"
                    min="0"
                    value={formData.minCharge}
                    onChange={(e) =>
                      setFormData({ ...formData, minCharge: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="e.g., 50"
                  />
                  <p className="text-xs text-gray-500">
                    This is the minimum delivery charge regardless of cart value
                  </p>
                </div>
              )}

              {(formData.chargeType === 'PERCENTAGE' || formData.chargeType === 'BOTH') && (
                <div className="space-y-2">
                  <Label htmlFor="percentageCharge">Percentage Charge (%)</Label>
                  <Input
                    id="percentageCharge"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.percentageCharge}
                    onChange={(e) =>
                      setFormData({ ...formData, percentageCharge: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="e.g., 8"
                  />
                  <p className="text-xs text-gray-500">
                    Percentage of the cart subtotal to charge as delivery fee
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="freeDeliveryAbove">Free Delivery Above (₹)</Label>
                <Input
                  id="freeDeliveryAbove"
                  type="number"
                  min="0"
                  value={formData.freeDeliveryAbove}
                  onChange={(e) =>
                    setFormData({ ...formData, freeDeliveryAbove: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="e.g., 500"
                />
                <p className="text-xs text-gray-500">
                  Orders above this amount will have free delivery
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              See how delivery charges will be calculated based on current settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cart Value:</span>
                  <span className="font-medium">₹200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Charge Type:</span>
                  <span className="font-medium">{getChargeTypeLabel(formData.chargeType)}</span>
                </div>
                {formData.chargeType !== 'FIXED' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Percentage:</span>
                    <span className="font-medium">{formData.percentageCharge}%</span>
                  </div>
                )}
                {formData.chargeType !== 'PERCENTAGE' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Charge:</span>
                    <span className="font-medium">{fcurrency(formData.minCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Free Delivery Above:</span>
                  <span className="font-medium">{fcurrency(formData.freeDeliveryAbove)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Delivery Charge:</span>
                  <span className="text-primary">
                    {200 >= formData.freeDeliveryAbove
                      ? 'Free'
                      : formData.chargeType === 'FIXED'
                      ? fcurrency(formData.minCharge)
                      : formData.chargeType === 'PERCENTAGE'
                      ? fcurrency((200 * formData.percentageCharge) / 100)
                      : fcurrency(
                          Math.max(
                            formData.minCharge,
                            (200 * formData.percentageCharge) / 100
                          )
                        )}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cart Value:</span>
                  <span className="font-medium">₹1,000</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Delivery Charge:</span>
                  <span className="text-primary">
                    {1000 >= formData.freeDeliveryAbove
                      ? 'Free'
                      : formData.chargeType === 'FIXED'
                      ? fcurrency(formData.minCharge)
                      : formData.chargeType === 'PERCENTAGE'
                      ? fcurrency((1000 * formData.percentageCharge) / 100)
                      : fcurrency(
                          Math.max(
                            formData.minCharge,
                            (1000 * formData.percentageCharge) / 100
                          )
                        )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Test Pincode Validation
            </CardTitle>
            <CardDescription>
              Test if a pincode is serviceable and see the calculated delivery charge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter 6-digit pincode"
                value={testPincode}
                onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="flex-1"
              />
              <Button onClick={handleTestPincode} disabled={testingPincode || testPincode.length !== 6}>
                {testingPincode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>

            {pincodeResult && (
              <div
                className={`p-4 rounded-lg ${
                  pincodeResult.valid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {pincodeResult.valid ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-800 font-medium">
                      <Check className="h-5 w-5" />
                      Delivery Available
                    </div>
                    <div className="text-sm text-green-700">
                      <p><strong>Pincode:</strong> {pincodeResult.pincode}</p>
                      {pincodeResult.district && <p><strong>District:</strong> {pincodeResult.district}</p>}
                      {pincodeResult.state && <p><strong>State:</strong> {pincodeResult.state}</p>}
                      <p><strong>Charge Type:</strong> {getChargeTypeLabel(pincodeResult.chargeType || 'PERCENTAGE')}</p>
                      {pincodeResult.percentageCharge && (
                        <p><strong>Percentage:</strong> {pincodeResult.percentageCharge}%</p>
                      )}
                      {pincodeResult.minCharge && (
                        <p><strong>Minimum Charge:</strong> ₹{pincodeResult.minCharge}</p>
                      )}
                      {pincodeResult.freeDeliveryAbove && (
                        <p><strong>Free Above:</strong> ₹{pincodeResult.freeDeliveryAbove}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{pincodeResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Pincode Configuration</CardTitle>
            <CardDescription>
              Set different delivery charges for specific pincodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/delivery-settings/pincodes">
              <Button variant="outline" className="w-full">
                <MapPin className="mr-2 h-4 w-4" />
                Manage Pincode Charges
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="h-24" />
    </div>
  );
}
