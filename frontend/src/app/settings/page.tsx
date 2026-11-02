'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/store/auth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/services/api';
import { User, Smartphone, QrCode, CheckCircle2, XCircle, Loader2, Bot, ToggleLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface AutoReplyConfig {
  enabled: boolean;
  confidenceThreshold: number;
  welcomeMessage: string;
  autoReplyIntents: string[];
  includeCatalogInWelcome: boolean;
}

const ALL_INTENTS = [
  'GREETING',
  'NEW_ORDER',
  'UPDATE_ORDER',
  'CANCEL_ORDER',
  'DELIVERY_STATUS',
  'PAYMENT_CONFIRMATION',
  'PAYMENT_INQUIRY',
  'PRODUCT_INQUIRY',
  'COMPLAINT',
  'FEEDBACK',
  'INVOICE_REQUEST',
  'GENERAL_QUESTION',
  'UNKNOWN',
];

export default function SettingsPage() {
  const { merchant } = useAuth();
  const { on } = useSocket();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string>('disconnected');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [ar, setAr] = useState<AutoReplyConfig>({
    enabled: false,
    confidenceThreshold: 0.85,
    welcomeMessage: 'Namaste! 🏪 Welcome to {businessName}\n\n{productCatalog}\n\nReply with product name and quantity to place an order!',
    autoReplyIntents: ['GREETING', 'DELIVERY_STATUS', 'PAYMENT_INQUIRY', 'PRODUCT_INQUIRY'],
    includeCatalogInWelcome: true,
  });

  useEffect(() => {
    api.get('/merchant/auto-reply').then(({ data }) => {
      if (data.data) setAr(data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub1 = on('wa:qr', (data: { qr: string }) => {
      setQrCode(data.qr);
    });
    const unsub2 = on('wa:status', (data: { status: string }) => {
      setWaStatus(data.status);
      if (data.status === 'connected') setQrCode(null);
    });
    return () => { unsub1?.(); unsub2?.(); };
  }, [on]);

  const checkStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/whatsapp/status');
      setWaStatus(data.data.status);
    } catch {}
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/connect');
      await new Promise((r) => setTimeout(r, 3000));
      const { data } = await api.get('/whatsapp/qr');
      if (data.data?.qr) setQrCode(data.data.qr);
      setWaStatus('connecting');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post('/whatsapp/disconnect');
      setWaStatus('disconnected');
      setQrCode(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleIntent = (intent: string) => {
    setAr((prev) => ({
      ...prev,
      autoReplyIntents: prev.autoReplyIntents.includes(intent)
        ? prev.autoReplyIntents.filter((i) => i !== intent)
        : [...prev.autoReplyIntents, intent],
    }));
  };

  const handleSaveAutoReply = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/merchant/auto-reply', ar);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </CardTitle>
              <CardDescription>Update your business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name</label>
                  <Input defaultValue={merchant?.businessName} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Name</label>
                  <Input defaultValue={merchant?.ownerName} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue={merchant?.email} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input defaultValue={merchant?.phone} />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> WhatsApp Connection
              </CardTitle>
              <CardDescription>Connect your WhatsApp for automated messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4 text-center">
                {waStatus === 'connected' ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="py-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-emerald-600 mb-1">WhatsApp Connected</p>
                    <p className="text-xs text-muted-foreground mb-3">Your WhatsApp is active and receiving messages</p>
                    <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                      <XCircle className="h-4 w-4 mr-1" /> Disconnect
                    </Button>
                  </motion.div>
                ) : qrCode ? (
                  <div className="py-2">
                    <div className="mx-auto mb-3 flex h-48 w-48 items-center justify-center rounded-lg bg-white p-2 border">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`} alt="WhatsApp QR" className="h-full w-full" />
                    </div>
                    <p className="text-sm font-medium mb-1">Scan QR Code</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Open WhatsApp &gt; Linked Devices &gt; Link a Device
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setQrCode(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="py-4">
                    {loading ? (
                      <Loader2 className="h-16 w-16 text-muted-foreground mx-auto mb-3 animate-spin" />
                    ) : (
                      <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                    )}
                    <p className="text-sm font-medium mb-1">
                      {loading ? 'Generating QR Code...' : 'Ready to Connect'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {loading ? 'Please wait...' : 'Click below to link your WhatsApp'}
                    </p>
                    <Button size="sm" onClick={handleConnect} disabled={loading}>
                      {loading ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Connecting...</>
                      ) : (
                        <><QrCode className="h-4 w-4 mr-1" /> Generate QR Code</>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className={`flex items-center gap-3 rounded-lg p-3 ${
                waStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50'
                  : waStatus === 'connecting'
                  ? 'bg-amber-50 dark:bg-amber-950/50'
                  : 'bg-muted/50'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  waStatus === 'connected' ? 'bg-emerald-500' :
                  waStatus === 'connecting' ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                <span className={`text-sm ${
                  waStatus === 'connected' ? 'text-emerald-700 dark:text-emerald-300' :
                  waStatus === 'connecting' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'
                }`}>
                  {waStatus === 'connected' ? 'Connected' :
                   waStatus === 'connecting' ? 'Connecting...' : 'Not connected'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Auto-Reply Configuration
            </CardTitle>
            <CardDescription>Automatically respond to customer messages based on AI understanding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Enable Auto-Reply</p>
                <p className="text-xs text-muted-foreground">When enabled, AI will automatically reply to matching messages</p>
              </div>
              <button
                onClick={() => setAr((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ar.enabled ? 'bg-emerald-500' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ar.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {ar.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Confidence Threshold: {Math.round(ar.confidenceThreshold * 100)}%</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={ar.confidenceThreshold}
                    onChange={(e) => setAr((p) => ({ ...p, confidenceThreshold: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    AI will only auto-reply when confidence is above this threshold. Higher = safer.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Auto-Reply Intents</label>
                  <p className="text-xs text-muted-foreground">Select which message types should be auto-replied</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_INTENTS.map((intent) => (
                      <label
                        key={intent}
                        className={`flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer transition-colors ${
                          ar.autoReplyIntents.includes(intent) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={ar.autoReplyIntents.includes(intent)}
                          onChange={() => toggleIntent(intent)}
                          className="rounded"
                        />
                        <span className="text-sm">{intent.replace(/_/g, ' ').toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Welcome Message for New Customers</label>
                    <button
                      onClick={() => setAr((p) => ({ ...p, includeCatalogInWelcome: !p.includeCatalogInWelcome }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ar.includeCatalogInWelcome ? 'bg-emerald-500' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${ar.includeCatalogInWelcome ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Toggle to include product catalog in welcome message. Use {'{businessName}'} and {'{productCatalog}'} as placeholders.
                  </p>
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 text-sm"
                    value={ar.welcomeMessage}
                    onChange={(e) => setAr((p) => ({ ...p, welcomeMessage: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveAutoReply} disabled={saving}>
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-1" /> Save Auto-Reply Settings</>
                    )}
                  </Button>
                  {saved && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-600">
                      Settings saved!
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Shell>
  );
}
