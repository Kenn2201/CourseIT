/**
 * CreditContext is unified with AuthContext as the single live-verified source of truth.
 * Re-exports provided for backward compatibility.
 */
export {
  AuthProvider,
  AuthProvider as CreditProvider,
  useAuth,
  useUserCredits
} from './AuthContext';
