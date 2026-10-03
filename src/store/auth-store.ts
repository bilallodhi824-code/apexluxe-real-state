import { create } from "zustand";
import { isFirebaseConfigured, auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { dbService } from "@/lib/db-service";

export type UserRole = "superadmin" | "agency" | "agent" | "owner" | "customer" | "guest";

export interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: "verified" | "pending" | "unverified";
  avatar?: string;
  plan?: "economical" | "vip";
}

interface AuthState {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  isLocalMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserSession: (data: Partial<UserSession>) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  switchPlan: (plan: "economical" | "vip") => Promise<void>;
  checkSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isLocalMode: !isFirebaseConfigured,

  checkSession: () => {
    if (typeof window === "undefined") return;
    const session = localStorage.getItem("apex_user_session");
    if (session) {
      const parsed = JSON.parse(session);
      const current = get().user;
      if (!current || current.uid !== parsed.uid || current.role !== parsed.role) {
        set({ user: parsed });
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        // Fetch user profile from Firestore or LocalStorage
        const userDoc = await dbService.getUserById(fbUser.uid);
        let role: UserRole = "customer";
        
        if (userDoc) {
          role = userDoc.role;
        }

        const session: UserSession = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: fbUser.displayName || "Elite Member",
          role: role,
          status: fbUser.emailVerified ? "verified" : "pending",
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${fbUser.displayName || "EM"}`,
        };

        localStorage.setItem("apex_user_session", JSON.stringify(session));
        set({ user: session, loading: false });
        await dbService.logActivity("security", `User login successful (Firebase)`, session.uid);
        return true;
      } else {
        // High fidelity Local Mode
        await new Promise((r) => setTimeout(r, 600)); // Simulate delay
        
        const localUsers = JSON.parse(localStorage.getItem("apex_users") || "[]");
        const match = localUsers.find((u: any) => u.email === email);
        
        if (match) {
          const session: UserSession = {
            uid: match.uid,
            email: match.email,
            displayName: match.displayName,
            role: match.role as UserRole,
            status: match.status || "verified",
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${match.displayName}`,
            plan: match.plan || "vip",
          };
          localStorage.setItem("apex_user_session", JSON.stringify(session));
          set({ user: session, loading: false });
          await dbService.logActivity("security", `User login successful (Local Mode)`, session.uid);
          return true;
        } else {
          // If no user exists, let's auto-create it as a customer to make testing super smooth!
          const newUid = "user_" + Math.random().toString(36).substr(2, 9);
          const name = email.split("@")[0];
          const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
          
          const newUser = {
            uid: newUid,
            email,
            displayName: capitalizedName,
            role: "customer",
            status: "verified",
            plan: "vip",
          };
          localUsers.push(newUser);
          localStorage.setItem("apex_users", JSON.stringify(localUsers));

          const session: UserSession = {
            uid: newUid,
            email: newUser.email,
            displayName: newUser.displayName,
            role: "customer",
            status: "verified",
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${newUser.displayName}`,
            plan: "vip",
          };
          
          localStorage.setItem("apex_user_session", JSON.stringify(session));
          set({ user: session, loading: false });
          await dbService.logActivity("security", `Auto-registered new account: ${email} (Local Mode)`, session.uid);
          return true;
        }
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || "Invalid credentials", loading: false });
      return false;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      if (isFirebaseConfigured && auth) {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const fbUser = userCredential.user;

         // Check if user exists in database, otherwise create profile
         let userDoc = await dbService.getUserById(fbUser.uid);
         if (!userDoc) {
           userDoc = {
             email: fbUser.email || "",
             displayName: fbUser.displayName || "Elite Guest",
             role: "customer",
             status: "verified",
             createdAt: new Date().toISOString()
           };
           await dbService.createUserProfile(fbUser.uid, userDoc);
         }

         const session: UserSession = {
           uid: fbUser.uid,
           email: fbUser.email || "",
           displayName: fbUser.displayName || "Elite Guest",
           role: userDoc.role,
           status: "verified",
           avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${fbUser.displayName || "EG"}`,
         };

         localStorage.setItem("apex_user_session", JSON.stringify(session));
         set({ user: session, loading: false });
         await dbService.logActivity("security", `User Google login successful (Firebase)`, session.uid);
         return true;
      } else {
        // High fidelity Local Mode
        await new Promise((r) => setTimeout(r, 500));
        const session: UserSession = {
          uid: "user_google_mock",
          email: "google_VIP@apexluxe.com",
          displayName: "Google VIP Guest",
          role: "customer",
          status: "verified",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
        };
        localStorage.setItem("apex_user_session", JSON.stringify(session));
        set({ user: session, loading: false });
        await dbService.logActivity("security", `User Google login successful (Local Mode)`, session.uid);
        return true;
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || "Google Authentication failed", loading: false });
      return false;
    }
  },

  signUp: async (email, password, displayName, role) => {
    set({ loading: true, error: null });
    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        await updateProfile(fbUser, { displayName });
        
        // Add to users database
        await dbService.createUserProfile(fbUser.uid, {
          email,
          displayName,
          role,
          status: "pending",
          createdAt: new Date().toISOString()
        });

        const session: UserSession = {
          uid: fbUser.uid,
          email,
          displayName,
          role,
          status: "pending",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`,
        };

        localStorage.setItem("apex_user_session", JSON.stringify(session));
        set({ user: session, loading: false });
        await dbService.logActivity("security", `New account registered: ${email} (Firebase)`, session.uid);
        return true;
      } else {
        // High fidelity Local Mode
        await new Promise((r) => setTimeout(r, 600));
        const localUsers = JSON.parse(localStorage.getItem("apex_users") || "[]");
        
        if (localUsers.some((u: any) => u.email === email)) {
          throw new Error("An account with this email address already exists.");
        }

        const newUid = "user_" + Math.random().toString(36).substr(2, 9);
        const newUser = {
          uid: newUid,
          email,
          displayName,
          role,
          status: "verified",
        };
        localUsers.push(newUser);
        localStorage.setItem("apex_users", JSON.stringify(localUsers));

        const session: UserSession = {
          uid: newUid,
          email,
          displayName,
          role,
          status: "verified",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`,
          plan: "economical",
        };

        localStorage.setItem("apex_user_session", JSON.stringify(session));
        set({ user: session, loading: false });
        await dbService.logActivity("security", `New account registered: ${email} (Local Mode)`, session.uid);
        return true;
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || "Registration failed", loading: false });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      if (get().user) {
        await dbService.logActivity("security", `User logout`, get().user!.uid);
      }
      localStorage.removeItem("apex_user_session");
      set({ user: null, loading: false });
    } catch (err) {
      console.error(err);
      localStorage.removeItem("apex_user_session");
      set({ user: null, loading: false });
    }
  },

  updateUserSession: async (data) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...data };
    localStorage.setItem("apex_user_session", JSON.stringify(updated));
    set({ user: updated });
    
    // update in local users list
    const users = JSON.parse(localStorage.getItem("apex_users") || "[]");
    const idx = users.findIndex((u: any) => u.uid === current.uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      localStorage.setItem("apex_users", JSON.stringify(users));
    }
  },

  switchRole: async (role) => {
    const current = get().user;
    if (!current) return;
    
    const updated: UserSession = {
      ...current,
      role: role,
    };
    
    localStorage.setItem("apex_user_session", JSON.stringify(updated));
    set({ user: updated });
    await dbService.logActivity("security", `Session role dynamically switched to ${role}`, current.uid);
  },

  switchPlan: async (plan) => {
    const current = get().user;
    if (!current) return;

    const updated: UserSession = {
      ...current,
      plan: plan,
    };

    localStorage.setItem("apex_user_session", JSON.stringify(updated));
    set({ user: updated });

    // Update in local users database as well
    const users = JSON.parse(localStorage.getItem("apex_users") || "[]");
    const idx = users.findIndex((u: any) => u.uid === current.uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], plan };
      localStorage.setItem("apex_users", JSON.stringify(users));
    }

    await dbService.logActivity("security", `Membership subscription switched to ${plan}`, current.uid);
  },
}));
