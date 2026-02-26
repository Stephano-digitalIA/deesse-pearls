import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Auth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const { signIn, signUp, resetPassword, signInWithGoogle, signUpWithGoogle, user, session, isLoading } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginSchema = z.object({
    email: z.string().trim().email({ message: t('invalidEmail') }).max(255),
    password: z.string().min(6, { message: t('passwordMinLength') }).max(100),
  });

  const signupSchema = loginSchema.extend({
    firstName: z.string().trim().min(1, { message: t('firstNameRequired') }).max(50),
    lastName: z.string().trim().min(1, { message: t('lastNameRequired') }).max(50),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });

  // Redirect authenticated users to account page
  useEffect(() => {
    if (!isLoading && (user || session)) {
      navigate('/account', { replace: true });
    }
  }, [user, session, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const authResult = await signIn(email, password);
    setIsSubmitting(false);

    if (authResult.error) {
      if (authResult.needsRegistration) {
        // User not found - redirect to signup tab
        setActiveTab('signup');
        toast({
          title: t('accountNotFound') || 'Compte non trouvé',
          description: t('pleaseSignUpEmail') || 'Aucun compte trouvé avec cet email. Veuillez vous inscrire.',
          variant: "destructive",
        });
      } else {
        toast({
          title: t('loginError'),
          description: authResult.error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: t('loginSuccess'),
        description: t('welcome'),
      });
      navigate('/account');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
      firstName,
      lastName
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const authResult = await signUp(email, password, firstName, lastName);
    setIsSubmitting(false);

    if (authResult.error) {
      if (authResult.alreadyExists) {
        setActiveTab('login');
        toast({
          title: t('emailAlreadyUsed') || 'Email déjà utilisé',
          description: t('accountExistsLogin') || 'Un compte existe déjà avec cet email. Veuillez vous connecter.',
          variant: "destructive",
        });
      } else {
        toast({
          title: t('signupError'),
          description: authResult.error.message,
          variant: "destructive",
        });
      }
      return;
    }

    // Success - Supabase Auth sends the confirmation email automatically
    console.log('[Auth] Signup initiated successfully');
    setShowConfirmationDialog(true);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setErrors({});
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email || !email.includes('@')) {
      setErrors({ email: t('invalidEmail') });
      return;
    }

    setIsSubmitting(true);
    const { error } = await resetPassword(email);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: t('resetEmailSent'),
        description: t('resetEmailSentDesc'),
      });
    }
  };

  // Google Sign In - for existing users only
  const handleGoogleSignIn = async () => {
    console.log('[Auth Page] handleGoogleSignIn called');
    try {
      const result = await signInWithGoogle();
      console.log('[Auth Page] signInWithGoogle result:', result);

      if (result.error) {
        if (result.needsRegistration) {
          // User not registered - switch to signup tab
          setActiveTab('signup');
          toast({
            title: t('accountNotFound') || 'Compte non trouvé',
            description: t('pleaseSignUp') || 'Veuillez créer un compte avec Google.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('error'),
            description: `${result.error.message} (Google OAuth)`,
            variant: 'destructive',
          });
        }
      }
    } catch (err: any) {
      console.error('[Auth Page] handleGoogleSignIn exception:', err);
      toast({
        title: t('error'),
        description: err?.message || 'Erreur de connexion Google',
        variant: 'destructive',
      });
    }
  };

  // Google Sign Up - for new users
  const handleGoogleSignUp = async () => {
    console.log('[Auth Page] handleGoogleSignUp called');
    try {
      const { error } = await signUpWithGoogle();
      console.log('[Auth Page] signUpWithGoogle result - error:', error);

      if (error) {
        toast({
          title: t('error'),
          description: `${error.message} (Google OAuth)`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('signupSuccess') || 'Inscription réussie',
          description: t('accountCreated') || 'Votre compte a été créé avec succès.',
        });
      }
    } catch (err: any) {
      console.error('[Auth Page] handleGoogleSignUp exception:', err);
      toast({
        title: t('error'),
        description: err?.message || 'Erreur inscription Google',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-pearl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            <span className="text-gold">DEESSE</span> <span className="text-foreground">PEARLS</span>
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'login' ? t('loginToAccount') : t('createAccount')}
          </p>
        </div>

        <Card className="shadow-elegant border-border/50">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'signup'); resetForm(); }}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="data-[state=active]:bg-gold data-[state=active]:text-deep-black">
                  {t('login')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gold data-[state=active]:text-deep-black">
                  {t('signup')}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="login" className="mt-0">
                {showForgotPassword ? (
                  resetEmailSent ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-semibold mb-2">{t('resetEmailSent')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t('resetEmailSentDesc')}</p>
                      <Button
                        variant="outline"
                        onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
                        className="w-full"
                      >
                        {t('backToLogin')}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">{t('forgotPasswordDesc')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">{t('email')}</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('sending')}
                          </>
                        ) : (
                          t('sendResetLink')
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full"
                      >
                        {t('backToLogin')}
                      </Button>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t('password')}</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-gold hover:underline"
                        >
                          {t('forgotPassword')}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('loggingIn')}
                        </>
                      ) : (
                        t('loginButton')
                      )}
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      {t('continueWithGoogle')}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('firstName')}</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Marie"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={errors.firstName ? 'border-destructive' : ''}
                      />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('lastName')}</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Dupont"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={errors.lastName ? 'border-destructive' : ''}
                      />
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('password')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('signingUp')}
                      </>
                    ) : (
                      t('signupButton')
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignUp}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {t('signUpWithGoogle') || "S'inscrire avec Google"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('termsAgreement')}{' '}
          <a href="/terms" className="text-gold hover:underline">{t('termsOfSale')}</a>
          {' '}{t('and')}{' '}
          <a href="/privacy" className="text-gold hover:underline">{t('privacyPolicy')}</a>.
        </p>
      </motion.div>

      {/* Email Confirmation Dialog */}
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-gold" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              {t('confirmationEmailSent')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-center">
              <p className="text-base font-semibold text-foreground">{email}</p>

              <div className="bg-gold/5 rounded-lg p-4 space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">{t('checkYourEmail')}</p>
                    <p className="text-muted-foreground">{t('checkYourEmailDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">{t('securityNote')}</p>
                    <p className="text-muted-foreground">{t('securityNoteDesc')}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('emailSentBy')} <span className="font-semibold text-gold">DEESSE PEARLS</span> {t('viaSupabase')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Button
            onClick={() => setShowConfirmationDialog(false)}
            className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold mt-4"
          >
            {t('understood')}
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
