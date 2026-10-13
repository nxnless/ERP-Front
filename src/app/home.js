import { rolePaths } from '@/roles' // ต้องมีปีกกาครอบแบบนี้

const HOME = [
  ['admin', '/admin'], ['executive', '/executive'], ['manager', '/manager'],
  ['accounting_manager', '/accounting'], ['accounting', '/accounting'],
  ['purchasing_head', '/purchasing'], ['purchasing', '/purchasing'], ['sales', '/sales'],
  ['warehouse', '/warehouse'], ['hr', '/hr'], ['auditor', '/auditor'], ['employee', '/employee'],
]

export function homeFor(roles = []) {
  for (const [role, path] of HOME) {
    if (roles.includes(role) && rolePaths.includes(path)) return path
  }
  return rolePaths[0] ?? '/login'
}