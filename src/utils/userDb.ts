export interface UserRecord {
  username: string;
  passwordHash: string; // we will store it securely (or raw as it is local offline metadata simulator)
  role: "admin" | "user";
  isFirstAccess: boolean;
  name: string;
}

const DB_KEY = "agriJointUserDB";

// Initialize the database with default users if not already present
export function initializeUserDb(): UserRecord[] {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error("Erro ao ler DB de usuários, reiniciando...", e);
    }
  }

  const defaultUsers: UserRecord[] = [
    {
      username: "AdminLogin",
      passwordHash: "AdminSenha",
      role: "admin",
      isFirstAccess: true,
      name: "Administrador Geral"
    }
  ];

  localStorage.setItem(DB_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

// Get all users in the DB
export function getAllUsers(): UserRecord[] {
  return initializeUserDb();
}

// Save users array to storage
function saveUsers(users: UserRecord[]) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

// Find a user by username/email
export function findUserByUsername(username: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find(
    u => u.username.toLowerCase().trim() === username.toLowerCase().trim()
  );
}

// Handle password updates, registering the selection to DB and clearing first-access flags
export function updateUserPassword(username: string, newPassword: string): boolean {
  const users = getAllUsers();
  const userIndex = users.findIndex(
    u => u.username.toLowerCase().trim() === username.toLowerCase().trim()
  );

  if (userIndex === -1) return false;

  users[userIndex].passwordHash = newPassword;
  users[userIndex].isFirstAccess = false;
  saveUsers(users);
  return true;
}

// Check credentials and register if it is a new valid-looking email (fallback to prevent block)
export function checkCredentials(username: string, password: string): { 
  success: boolean; 
  user?: UserRecord; 
  error?: string;
} {
  const users = getAllUsers();
  const matchedUser = users.find(
    u => u.username.toLowerCase().trim() === username.toLowerCase().trim()
  );

  if (matchedUser) {
    if (matchedUser.passwordHash === password) {
      return { success: true, user: matchedUser };
    } else {
      return { success: false, error: "Senha incorreta." };
    }
  }

  // Fallback for custom user signin (e-mail validator auto registration)
  if (username.includes("@") && password.length >= 4) {
    const namePart = username.split("@")[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const newUser: UserRecord = {
      username: username,
      passwordHash: password,
      role: "user",
      isFirstAccess: false,
      name: formattedName
    };
    
    users.push(newUser);
    saveUsers(users);
    return { success: true, user: newUser };
  }

  return { success: false, error: "Credenciais não encontradas e formato inválido para cadastro rápido de produtor." };
}
