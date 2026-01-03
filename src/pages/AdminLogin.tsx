import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, UserPlus, Home, ShieldAlert, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 15;

interface BlockStatus {
  isBlocked: boolean;
  remainingMinutes: number;
  attemptCount: number;
}

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [activeTab, setActiveTab] = useState('login');
  const [accessDenied, setAccessDenied] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  
  const { signIn, signUp, user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if email is blocked
  const checkBlockStatus = async (userEmail: string): Promise<BlockStatus> => {
    try {
      const { data, error } = await supabase
        .from('admin_access_blocks')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle();
      
      if (error || !data) {
        return { isBlocked: false, remainingMinutes: 0, attemptCount: 0 };
      }

      const now = new Date();
      const blockedUntil = data.blocked_until ? new Date(data.blocked_until) : null;

      if (blockedUntil && blockedUntil > now) {
        const remainingMs = blockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        return { isBlocked: true, remainingMinutes, attemptCount: data.attempt_count };
      }

      // Block expired, reset if needed
      if (blockedUntil && blockedUntil <= now) {
        await supabase
          .from('admin_access_blocks')
          .delete()
          .eq('email', userEmail.toLowerCase());
        return { isBlocked: false, remainingMinutes: 0, attemptCount: 0 };
      }

      return { isBlocked: false, remainingMinutes: 0, attemptCount: data.attempt_count };
    } catch (error) {
      console.error('Failed to check block status:', error);
      return { isBlocked: false, remainingMinutes: 0, attemptCount: 0 };
    }
  };

  // Increment attempt count and potentially block
  const recordFailedAttempt = async (userEmail: string): Promise<BlockStatus> => {
    try {
      const normalizedEmail = userEmail.toLowerCase();
      
      // Check existing record
      const { data: existing } = await supabase
        .from('admin_access_blocks')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      const newAttemptCount = (existing?.attempt_count || 0) + 1;
      const shouldBlock = newAttemptCount >= MAX_ATTEMPTS;
      const blockedUntil = shouldBlock 
        ? new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000).toISOString()
        : null;

      if (existing) {
        await supabase
          .from('admin_access_blocks')
          .update({
            attempt_count: newAttemptCount,
            blocked_until: blockedUntil
          })
          .eq('email', normalizedEmail);
      } else {
        await supabase
          .from('admin_access_blocks')
          .insert({
            email: normalizedEmail,
            attempt_count: newAttemptCount,
            blocked_until: blockedUntil
          });
      }

      return {
        isBlocked: shouldBlock,
        remainingMinutes: shouldBlock ? BLOCK_DURATION_MINUTES : 0,
        attemptCount: newAttemptCount
      };
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
      return { isBlocked: false, remainingMinutes: 0, attemptCount: 0 };
    }
  };

  // Log unauthorized access attempt
  const logUnauthorizedAccess = async (userEmail: string, userId?: string, attemptType = 'unauthorized_admin_access') => {
    try {
      await supabase.from('admin_access_logs').insert({
        user_id: userId || null,
        email: userEmail,
        user_agent: navigator.userAgent,
        attempt_type: attemptType
      });
    } catch (error) {
      console.error('Failed to log access attempt:', error);
    }
  };

  // Track if we already logged an access attempt for this session
  const [hasLoggedAttempt, setHasLoggedAttempt] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        // Admin logged in - clear any blocks and log successful access
        const adminEmail = (user.email || '').toLowerCase();
        supabase
          .from('admin_access_blocks')
          .delete()
          .eq('email', adminEmail);
        
        // Log successful admin access (only once per session)
        if (!hasLoggedAttempt) {
          setHasLoggedAttempt(true);
          logAccessAttempt(user.email || 'unknown', user.id, 'admin_login_success');
        }
        
        navigate('/admin');
      } else if (!hasLoggedAttempt) {
        // User is logged in but not admin - show access denied and log (only once)
        setAccessDenied(true);
        setHasLoggedAttempt(true);
        logUnauthorizedAccess(user.email || 'unknown', user.id);
        recordFailedAttempt(user.email || 'unknown').then(setBlockStatus);
      }
    }
  }, [user, isAdmin, isLoading, navigate, hasLoggedAttempt]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAccessDenied(false);
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Check if blocked before attempting login
    const currentBlockStatus = await checkBlockStatus(email);
    if (currentBlockStatus.isBlocked) {
      setBlockStatus(currentBlockStatus);
      toast({
        title: "Accès temporairement bloqué",
        description: `Trop de tentatives. Réessayez dans ${currentBlockStatus.remainingMinutes} minutes.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message === 'Invalid login credentials' 
          ? "Identifiants incorrects" 
          : error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Note: the useEffect will handle checking admin status after login
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1500);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas" });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: "Erreur d'inscription",
        description: error.message === 'User already registered'
          ? "Cet email est déjà utilisé"
          : error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    toast({
      title: "Compte créé",
      description: "Votre compte a été créé. Demandez à un administrateur de vous attribuer le rôle admin.",
    });
    
    setActiveTab('login');
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBlocked = blockStatus?.isBlocked;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-pearl px-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Administration</CardTitle>
          <CardDescription>
            Connectez-vous ou créez un compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBlocked && (
            <Alert variant="destructive" className="mb-4">
              <Clock className="h-4 w-4" />
              <AlertTitle>Accès temporairement bloqué</AlertTitle>
              <AlertDescription>
                Trop de tentatives d'accès non autorisées. Veuillez réessayer dans {blockStatus.remainingMinutes} minute{blockStatus.remainingMinutes > 1 ? 's' : ''}.
              </AlertDescription>
            </Alert>
          )}
          {accessDenied && !isBlocked && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Accès refusé</AlertTitle>
              <AlertDescription>
                Vous n'avez pas les droits d'administration
              </AlertDescription>
            </Alert>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" disabled={isBlocked}>Connexion</TabsTrigger>
              <TabsTrigger value="signup" disabled={isBlocked}>Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting || isBlocked}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting || isBlocked}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || isBlocked}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting || isBlocked}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting || isBlocked}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting || isBlocked}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || isBlocked}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Créer un compte
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
