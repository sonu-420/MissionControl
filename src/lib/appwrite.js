import { Account, Client, Databases, ID, Permission, Query, Role } from 'appwrite'

const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  todosCollectionId: import.meta.env.VITE_APPWRITE_TODOS_COLLECTION_ID,
}

const client = new Client()

if (appwriteConfig.endpoint && appwriteConfig.projectId) {
  client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId)
}

export const account = new Account(client)
export const databases = new Databases(client)
export const uniqueId = ID.unique
export const config = appwriteConfig

export function hasAppwriteConfig() {
  return Boolean(
    appwriteConfig.endpoint &&
      appwriteConfig.projectId &&
      appwriteConfig.databaseId &&
      appwriteConfig.todosCollectionId,
  )
}

export async function getCurrentUser() {
  return account.get()
}

export async function createUserAccount({ name, email, password }) {
  await account.create(ID.unique(), email, password, name)
  return account.createEmailPasswordSession(email, password)
}

export function signInWithEmail({ email, password }) {
  return account.createEmailPasswordSession(email, password)
}

export function signOutCurrentUser() {
  return account.deleteSession('current')
}

export async function listTodos(userId) {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.todosCollectionId,
    [Query.equal('userId', userId), Query.orderDesc('$createdAt')],
  )

  return response.documents
}

export function createTodo({ title, userId }) {
  return databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.todosCollectionId,
    ID.unique(),
    {
      title,
      completed: false,
      userId,
    },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  )
}

export function updateTodo(todoId, payload) {
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.todosCollectionId,
    todoId,
    payload,
  )
}

export function deleteTodo(todoId) {
  return databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.todosCollectionId,
    todoId,
  )
}
