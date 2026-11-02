'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Store, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">{sent ? 'Check your email' : 'Reset password'}</CardTitle>
            <CardDescription>
              {sent ? 'We sent a reset link to your email address' : 'Enter your email and we will send you a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  If an account exists with {email}, you will receive a password reset email shortly.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email address</label>
                  <Input
                    type="email"
                    placeholder="owner@shop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Mail className="h-4 w-4 mr-2 animate-pulse" /> Sending...</>
                  ) : (
                    <><Mail className="h-4 w-4 mr-2" /> Send reset link</>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Back to login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
