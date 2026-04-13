'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, Search, MapPin, Check, AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { fcurrency } from '@/lib/utils';

interface PincodeData {
  id: number;
  pincode: string;
  regionName: string | null;
  divisionName: string | null;
  district: string | null;
  stateName: string | null;
  isDelivery: boolean;
  chargeType: 'FIXED' | 'PERCENTAGE' | 'BOTH';
  minCharge: number | null;
  percentageCharge: number | null;
}

function getAuthHeader(): HeadersInit {
  const auth = sessionStorage.getItem('adminAuth');
  if (auth) {
    return { 'Authorization': `Basic ${auth}` };
  }
  return {};
}

export default function PincodeManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PincodeData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingPincode, setEditingPincode] = useState<PincodeData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [districtFilter, setDistrictFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const handleSearch = async () => {
    if (!searchQuery && !districtFilter && !stateFilter) {
      setMessage({ type: 'error', text: 'Please enter a pincode, district, or state to search' });
      return;
    }

    setIsSearching(true);
    setMessage(null);
    setSearchResults([]);

    try {
      let url = '/api/pincodes?';
      if (searchQuery) url += `pincode=${searchQuery}`;
      if (districtFilter) url += `&district=${encodeURIComponent(districtFilter)}`;
      if (stateFilter) url += `&state=${encodeURIComponent(stateFilter)}`;

      const res = await fetch(url, { headers: getAuthHeader() });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Search failed');
      }
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to search pincodes' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleEdit = (pincode: PincodeData) => {
    setEditingPincode({ ...pincode });
  };

  const handleCancelEdit = () => {
    setEditingPincode(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPincode) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/pincodes/${editingPincode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          isDelivery: editingPincode.isDelivery,
          chargeType: editingPincode.chargeType,
          minCharge: editingPincode.minCharge,
          percentageCharge: editingPincode.percentageCharge,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Save failed');
      }

      const updated = await res.json();
      setSearchResults(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingPincode(null);
      setMessage({ type: 'success', text: 'Pincode settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save pincode settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Pincode Management</h1>
            <p className="text-gray-600">Configure delivery charges for specific pincodes</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Pincodes
            </CardTitle>
            <CardDescription>
              Search by pincode, district, or state to find and configure delivery settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="e.g., 515631"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="e.g., ANANTAPUR"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="e.g., ANDHRA PRADESH"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="h-5 w-5 inline mr-2" /> : <AlertTriangle className="h-5 w-5 inline mr-2" />}
            {message.text}
          </div>
        )}

        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({searchResults.length} pincodes)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((pincode) => (
                  <div
                    key={pincode.id}
                    className={`p-4 rounded-lg border ${
                      editingPincode?.id === pincode.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    {editingPincode?.id === pincode.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-lg">Pincode: {editingPincode.pincode}</h4>
                            <p className="text-sm text-gray-600">
                              {editingPincode.district}, {editingPincode.stateName}
                            </p>
                          </div>
                          <Badge variant={editingPincode.isDelivery ? 'default' : 'destructive'}>
                            {editingPincode.isDelivery ? 'Delivery Available' : 'No Delivery'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`delivery-${pincode.id}`}
                              checked={editingPincode.isDelivery}
                              onChange={(e) => setEditingPincode({ ...editingPincode, isDelivery: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor={`delivery-${pincode.id}`}>Delivery Available</Label>
                          </div>

                          <div className="space-y-2">
                            <Label>Charge Type</Label>
                            <Select
                              value={editingPincode.chargeType}
                              onValueChange={(value: 'FIXED' | 'PERCENTAGE' | 'BOTH') =>
                                setEditingPincode({ ...editingPincode, chargeType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">Fixed</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="BOTH">Min or %</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {(editingPincode.chargeType === 'FIXED' || editingPincode.chargeType === 'BOTH') && (
                            <div className="space-y-2">
                              <Label>Min Charge (₹)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={editingPincode.minCharge || 0}
                                onChange={(e) => setEditingPincode({ 
                                  ...editingPincode, 
                                  minCharge: parseFloat(e.target.value) || 0 
                                })}
                              />
                            </div>
                          )}

                          {(editingPincode.chargeType === 'PERCENTAGE' || editingPincode.chargeType === 'BOTH') && (
                            <div className="space-y-2">
                              <Label>Percentage (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={editingPincode.percentageCharge || 0}
                                onChange={(e) => setEditingPincode({ 
                                  ...editingPincode, 
                                  percentageCharge: parseFloat(e.target.value) || 0 
                                })}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{pincode.pincode}</h4>
                            <Badge variant={pincode.isDelivery ? 'default' : 'destructive'}>
                              {pincode.isDelivery ? 'Delivery' : 'No Delivery'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {pincode.district}, {pincode.stateName}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>
                              <strong>Type:</strong> {pincode.chargeType}
                            </span>
                            {pincode.minCharge !== null && (
                              <span>
                                <strong>Min:</strong> ₹{pincode.minCharge}
                              </span>
                            )}
                            {pincode.percentageCharge !== null && (
                              <span>
                                <strong>%:</strong> {pincode.percentageCharge}%
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => handleEdit(pincode)}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {searchResults.length === 0 && !isSearching && (searchQuery || districtFilter || stateFilter) && (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No pincodes found matching your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="h-24" />
    </div>
  );
}
