'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Truck, Search, MapPin, Check, AlertTriangle, Loader2, Save, X, Plus, Globe, Edit, Trash2, RotateCcw } from 'lucide-react';
import { fcurrency } from '@/lib/utils';

interface StateDelivery {
  id: number;
  stateName: string;
  isActive: boolean;
  chargeType: 'FIXED' | 'PERCENTAGE' | 'BOTH';
  minCharge: number;
  percentageCharge: number;
  freeDeliveryAbove: number;
  pincodesCount?: number;
}

interface PincodeDelivery {
  id: number;
  pincode: string;
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

interface StateOption {
  stateName: string;
  hasSettings: boolean;
}

interface PincodeOption {
  pincode: string;
  district: string | null;
  stateName: string | null;
}

export default function DeliveryManagementPage() {
  const [states, setStates] = useState<StateDelivery[]>([]);
  const [pincodeResults, setPincodeResults] = useState<PincodeDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'states' | 'pincodes'>('states');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showPincodeDialog, setShowPincodeDialog] = useState(false);
  const [editingState, setEditingState] = useState<StateDelivery | null>(null);
  const [editingPincode, setEditingPincode] = useState<PincodeDelivery | null>(null);
  
  const [stateForm, setStateForm] = useState({
    stateName: '',
    isActive: true,
    chargeType: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE' | 'BOTH',
    minCharge: 0,
    percentageCharge: 8,
    freeDeliveryAbove: 500,
  });
  
  const [pincodeForm, setPincodeForm] = useState({
    pincode: '',
    isDelivery: true,
    chargeType: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE' | 'BOTH',
    minCharge: 0,
    percentageCharge: 8,
  });

  const [stateSuggestions, setStateSuggestions] = useState<StateOption[]>([]);
  const [pincodeSuggestions, setPincodeSuggestions] = useState<PincodeOption[]>([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-states', { headers: getAuthHeader() });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setStates(data);
    } catch (error) {
      console.error('Failed to fetch states:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPincodes = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/pincodes?pincode=${searchQuery}&limit=50`, { headers: getAuthHeader() });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to search');
      }
      const data = await res.json();
      setPincodeResults(data);
      setActiveTab('pincodes');
    } catch (error) {
      console.error('Failed to search pincodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchStateSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setStateSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/delivery-states?search=${query}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setStateSuggestions(data.map((s: any) => ({ stateName: s.stateName, hasSettings: true })));
      }
    } catch (error) {
      console.error('Failed to search states:', error);
    }
  };

  const searchPincodeSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setPincodeSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/pincodes?pincode=${query}&limit=10`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setPincodeSuggestions(data.map((p: any) => ({ pincode: p.pincode, district: p.district, stateName: p.stateName })));
      }
    } catch (error) {
      console.error('Failed to search pincodes:', error);
    }
  };

  const handleToggleState = async (state: StateDelivery) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/delivery-states/${state.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ isActive: !state.isActive }),
      });
      
      if (res.ok) {
        setStates(prev => prev.map(s => s.id === state.id ? { ...s, isActive: !s.isActive } : s));
        setMessage({ type: 'success', text: `Delivery ${!state.isActive ? 'enabled' : 'disabled'} for ${state.stateName}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePincode = async (pincode: PincodeDelivery) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pincodes/${pincode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ isDelivery: !pincode.isDelivery }),
      });
      
      if (res.ok) {
        setPincodeResults(prev => prev.map(p => p.id === pincode.id ? { ...p, isDelivery: !p.isDelivery } : p));
        setMessage({ type: 'success', text: `Delivery ${!pincode.isDelivery ? 'enabled' : 'disabled'} for ${pincode.pincode}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddState = async () => {
    if (!stateForm.stateName) {
      setMessage({ type: 'error', text: 'State name is required' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/delivery-states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(stateForm),
      });
      
      if (res.ok) {
        const newState = await res.json();
        setStates(prev => [...prev, newState]);
        setShowStateDialog(false);
        setStateForm({
          stateName: '',
          isActive: true,
          chargeType: 'PERCENTAGE',
          minCharge: 0,
          percentageCharge: 8,
          freeDeliveryAbove: 500,
        });
        setMessage({ type: 'success', text: `Delivery settings added for ${stateForm.stateName}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add state' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditState = (state: StateDelivery) => {
    setEditingState(state);
    setStateForm({
      stateName: state.stateName,
      isActive: state.isActive,
      chargeType: state.chargeType,
      minCharge: state.minCharge,
      percentageCharge: state.percentageCharge,
      freeDeliveryAbove: state.freeDeliveryAbove,
    });
    setShowStateDialog(true);
  };

  const handleUpdateState = async () => {
    if (!editingState) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/delivery-states/${editingState.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(stateForm),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setStates(prev => prev.map(s => s.id === editingState.id ? updated : s));
        setShowStateDialog(false);
        setEditingState(null);
        setMessage({ type: 'success', text: 'State settings updated' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update state' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPincode = async () => {
    if (!pincodeForm.pincode || pincodeForm.pincode.length !== 6) {
      setMessage({ type: 'error', text: 'Valid 6-digit pincode is required' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pincodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(pincodeForm),
      });
      
      if (res.ok) {
        const newPincode = await res.json();
        setPincodeResults(prev => [newPincode, ...prev]);
        setShowPincodeDialog(false);
        setPincodeForm({
          pincode: '',
          isDelivery: true,
          chargeType: 'PERCENTAGE',
          minCharge: 0,
          percentageCharge: 8,
        });
        setMessage({ type: 'success', text: `Pincode ${pincodeForm.pincode} added` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add pincode' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditPincode = (pincode: PincodeDelivery) => {
    setEditingPincode(pincode);
    setPincodeForm({
      pincode: pincode.pincode,
      isDelivery: pincode.isDelivery,
      chargeType: pincode.chargeType,
      minCharge: pincode.minCharge ?? 0,
      percentageCharge: pincode.percentageCharge ?? 8,
    });
    setShowPincodeDialog(true);
  };

  const handleUpdatePincode = async () => {
    if (!editingPincode) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/pincodes/${editingPincode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(pincodeForm),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setPincodeResults(prev => prev.map(p => p.id === editingPincode.id ? updated : p));
        setShowPincodeDialog(false);
        setEditingPincode(null);
        setMessage({ type: 'success', text: 'Pincode settings updated' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update pincode' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStates = useMemo(() => {
    if (!searchQuery) return states;
    const query = searchQuery.toLowerCase();
    return states.filter(s => s.stateName.toLowerCase().includes(query));
  }, [states, searchQuery]);

  const getChargeTypeLabel = (type: string) => {
    switch (type) {
      case 'FIXED': return 'Fixed';
      case 'PERCENTAGE': return '%';
      case 'BOTH': return 'Min/%';
      default: return type;
    }
  };

  const handleResetAllSettings = async () => {
    if (!confirm('Are you sure you want to reset delivery settings for all pincodes? This will clear all custom delivery settings.')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pincodes?action=reset-all', {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `Reset delivery settings for ${data.updatedCount} pincodes` });
        if (pincodeResults.length > 0) {
          setPincodeResults(prev => prev.map(p => ({
            ...p,
            isDelivery: true,
            chargeType: 'PERCENTAGE',
            minCharge: null,
            percentageCharge: null,
          })));
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to reset settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Delivery Management</h1>
              <p className="text-gray-600">Configure delivery charges by state or pincode</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="h-5 w-5 inline mr-2" /> : <AlertTriangle className="h-5 w-5 inline mr-2" />}
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search state or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPincodes()}
            />
          </div>
          <Button variant="outline" onClick={searchPincodes}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === 'states' ? 'default' : 'outline'}
            onClick={() => setActiveTab('states')}
          >
            <Globe className="h-4 w-4 mr-2" />
            By State ({states.length})
          </Button>
          <Button
            variant={activeTab === 'pincodes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pincodes')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            By Pincode ({pincodeResults.length})
          </Button>
        </div>

        {activeTab === 'states' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Delivery by State</CardTitle>
                <CardDescription>Manage delivery charges by state</CardDescription>
              </div>
              <Button onClick={() => { setEditingState(null); setShowStateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add State
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredStates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No states found. Add delivery settings for a state to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">State</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Rate</th>
                        <th className="text-left py-3 px-4">Free Above</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStates.map((state) => (
                        <tr key={state.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Switch
                              checked={state.isActive}
                              onCheckedChange={() => handleToggleState(state)}
                              disabled={saving}
                            />
                          </td>
                          <td className="py-3 px-4 font-medium">{state.stateName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{getChargeTypeLabel(state.chargeType)}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            {state.chargeType === 'FIXED' 
                              ? `₹${state.minCharge}` 
                              : `${state.percentageCharge}%`}
                          </td>
                          <td className="py-3 px-4">₹{state.freeDeliveryAbove}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" onClick={() => handleEditState(state)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'pincodes' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Delivery by Pincode</CardTitle>
                <CardDescription>Manage specific pincodes</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetAllSettings} disabled={saving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
                <Button onClick={() => { setEditingPincode(null); setShowPincodeDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pincode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pincodeResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Search for pincodes above to manage specific locations.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Pincode</th>
                        <th className="text-left py-3 px-4">District</th>
                        <th className="text-left py-3 px-4">State</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Rate</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pincodeResults.map((pincode) => (
                        <tr key={pincode.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Switch
                              checked={pincode.isDelivery}
                              onCheckedChange={() => handleTogglePincode(pincode)}
                              disabled={saving}
                            />
                          </td>
                          <td className="py-3 px-4 font-medium">{pincode.pincode}</td>
                          <td className="py-3 px-4">{pincode.district || '-'}</td>
                          <td className="py-3 px-4">{pincode.stateName || '-'}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{getChargeTypeLabel(pincode.chargeType)}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            {pincode.chargeType === 'FIXED' 
                              ? `₹${pincode.minCharge}` 
                              : `${pincode.percentageCharge}%`}
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPincode(pincode)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingState ? 'Edit State Delivery' : 'Add State Delivery'}</DialogTitle>
              <DialogDescription>
                {editingState 
                  ? `Update delivery settings for ${editingState.stateName}` 
                  : 'Add delivery settings for a state. This will apply to all pincodes in that state.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingState && (
                <div className="space-y-2 relative">
                  <Label>State Name</Label>
                  <Input
                    placeholder="Search state..."
                    value={stateForm.stateName}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setStateForm({ ...stateForm, stateName: val });
                      searchStateSuggestions(val);
                      setShowStateSuggestions(true);
                    }}
                    onFocus={() => setShowStateSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                  />
                  {showStateSuggestions && stateSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {stateSuggestions.map((s, idx) => (
                        <div
                          key={`${s.stateName}-${idx}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onMouseDown={() => {
                            setStateForm({ ...stateForm, stateName: s.stateName });
                            setShowStateSuggestions(false);
                          }}
                        >
                          <span>{s.stateName}</span>
                          <Badge variant={s.hasSettings ? 'default' : 'outline'}>{s.hasSettings ? 'Configured' : 'New'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Delivery Active</Label>
                <Switch
                  checked={stateForm.isActive}
                  onCheckedChange={(checked) => setStateForm({ ...stateForm, isActive: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Charge Type</Label>
                <Select
                  value={stateForm.chargeType}
                  onValueChange={(value: 'FIXED' | 'PERCENTAGE' | 'BOTH') => setStateForm({ ...stateForm, chargeType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="BOTH">Min or Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(stateForm.chargeType === 'FIXED' || stateForm.chargeType === 'BOTH') && (
                <div className="space-y-2">
                  <Label>Minimum Charge (₹)</Label>
                  <Input
                    type="number"
                    value={stateForm.minCharge}
                    onChange={(e) => setStateForm({ ...stateForm, minCharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              {(stateForm.chargeType === 'PERCENTAGE' || stateForm.chargeType === 'BOTH') && (
                <div className="space-y-2">
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    value={stateForm.percentageCharge}
                    onChange={(e) => setStateForm({ ...stateForm, percentageCharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Free Delivery Above (₹)</Label>
                <Input
                  type="number"
                  value={stateForm.freeDeliveryAbove}
                  onChange={(e) => setStateForm({ ...stateForm, freeDeliveryAbove: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStateDialog(false)}>Cancel</Button>
              <Button onClick={editingState ? handleUpdateState : handleAddState} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingState ? 'Update' : 'Add State'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPincodeDialog} onOpenChange={setShowPincodeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPincode ? 'Edit Pincode Delivery' : 'Add Pincode Delivery'}</DialogTitle>
              <DialogDescription>
                {editingPincode 
                  ? `Update delivery settings for ${editingPincode.pincode}` 
                  : 'Add delivery settings for a specific pincode.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingPincode && (
                <div className="space-y-2 relative">
                  <Label>Pincode</Label>
                  <Input
                    placeholder="Search pincode..."
                    value={pincodeForm.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPincodeForm({ ...pincodeForm, pincode: val });
                      searchPincodeSuggestions(val);
                      setShowPincodeSuggestions(true);
                    }}
                    onFocus={() => setShowPincodeSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPincodeSuggestions(false), 200)}
                    maxLength={6}
                  />
                  {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {pincodeSuggestions.map((p, idx) => (
                        <div
                          key={`${p.pincode}-${idx}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onMouseDown={() => {
                            setPincodeForm({ ...pincodeForm, pincode: p.pincode });
                            setShowPincodeSuggestions(false);
                          }}
                        >
                          <span className="font-medium">{p.pincode}</span>
                          <span className="text-sm text-gray-500">{p.district}, {p.stateName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Delivery Active</Label>
                <Switch
                  checked={pincodeForm.isDelivery}
                  onCheckedChange={(checked) => setPincodeForm({ ...pincodeForm, isDelivery: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Charge Type</Label>
                <Select
                  value={pincodeForm.chargeType}
                  onValueChange={(value: 'FIXED' | 'PERCENTAGE' | 'BOTH') => setPincodeForm({ ...pincodeForm, chargeType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="BOTH">Min or Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(pincodeForm.chargeType === 'FIXED' || pincodeForm.chargeType === 'BOTH') && (
                <div className="space-y-2">
                  <Label>Minimum Charge (₹)</Label>
                  <Input
                    type="number"
                    value={pincodeForm.minCharge}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, minCharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              {(pincodeForm.chargeType === 'PERCENTAGE' || pincodeForm.chargeType === 'BOTH') && (
                <div className="space-y-2">
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    value={pincodeForm.percentageCharge}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, percentageCharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPincodeDialog(false)}>Cancel</Button>
              <Button onClick={editingPincode ? handleUpdatePincode : handleAddPincode} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPincode ? 'Update' : 'Add Pincode'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="h-24" />
      </div>
    </div>
  );
}