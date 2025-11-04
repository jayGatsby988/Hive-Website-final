# Prevent Build Errors - Safe Development Practices

## What Just Happened?

The Next.js app crashed with a `ChunkLoadError`. This happens when:
1. Code changes break the build
2. Next.js cache gets corrupted
3. Development server needs restart

## ✅ Fixed! Server is running on http://localhost:3002

---

## 🛡️ How to Prevent This in the Future

### 1. Always Test Code Changes Gradually

**Before making changes:**
```bash
# Create a git branch first
git checkout -b feature/checkin-improvements

# Make one small change at a time
# Test after each change
npm run dev
```

**After making changes:**
```bash
# If site loads fine, commit
git add .
git commit -m "Added check-in logging"

# If site breaks, revert
git checkout .
```

### 2. Clear Cache When Things Break

If you see `ChunkLoadError` or similar:

```bash
# Stop the server (Ctrl+C)

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### 3. Check for TypeScript Errors Before Running

```bash
# Run TypeScript check
npm run build

# If it passes, it's safe to deploy
# If it fails, fix errors shown
```

### 4. Use ESLint to Catch Issues

```bash
# Check for code issues
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## 🚨 Emergency Recovery Steps

### If Website Won't Start:

**Step 1: Clear everything**
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

**Step 2: Check for syntax errors**
Open the file mentioned in error and look for:
- Missing brackets `}` or `)`
- Typos in variable names
- Missing imports

**Step 3: Revert recent changes**
```bash
git status  # See what changed
git diff    # See the actual changes
git checkout path/to/file  # Revert specific file
```

---

## 🎯 Safe Code Change Checklist

Before deploying ANY code changes:

- [ ] Tested locally (npm run dev works)
- [ ] No console errors in browser
- [ ] TypeScript compiles (npm run build)
- [ ] ESLint passes (npm run lint)
- [ ] All features still work
- [ ] Committed to git (can revert if needed)

---

## 📝 Code Quality Rules for Services.ts

### ✅ DO:
- Add detailed console.logs for debugging
- Use try/catch for error handling
- Check for null/undefined before using data
- Add type annotations

### ❌ DON'T:
- Use optional chaining without checking
- Throw errors without context
- Make breaking changes to function signatures
- Remove existing error handling

---

## 🔍 How to Debug Build Errors

### Read the Error Message:
```
ChunkLoadError: Loading chunk app/dashboard/admin/page failed
```

This tells you:
- **Error type**: ChunkLoadError (Next.js bundle issue)
- **Where**: app/dashboard/admin/page
- **What to do**: Clear .next cache and rebuild

### Common Error Types:

**1. ChunkLoadError**
- **Cause**: Next.js cache corruption
- **Fix**: `rm -rf .next && npm run dev`

**2. Module not found**
- **Cause**: Missing import or typo
- **Fix**: Check import statements

**3. Type errors**
- **Cause**: TypeScript type mismatch
- **Fix**: Add proper types or use `any` temporarily

**4. Syntax errors**
- **Cause**: Missing bracket, comma, etc.
- **Fix**: Check line number in error

---

## 🛠️ Useful Commands

### Development:
```bash
npm run dev          # Start development server
npm run build        # Test production build
npm run lint         # Check code quality
npm run type-check   # Check TypeScript (if configured)
```

### Cleanup:
```bash
rm -rf .next                    # Clear Next.js cache
rm -rf node_modules && npm i    # Reinstall dependencies
git clean -fdx                  # Nuclear option (removes ALL untracked files)
```

### Git Safety:
```bash
git status                      # See what changed
git diff lib/services.ts        # See changes in specific file
git checkout lib/services.ts    # Revert specific file
git checkout .                  # Revert ALL changes
git stash                       # Save changes temporarily
git stash pop                   # Restore stashed changes
```

---

## 🎓 Best Practices Going Forward

### 1. Use Feature Branches
```bash
git checkout -b feature/improve-checkin
# Make changes
# Test thoroughly
git checkout main
git merge feature/improve-checkin
```

### 2. Test Incrementally
- Make one small change
- Test it works
- Commit
- Repeat

### 3. Keep Backup of Working Code
```bash
# Before making risky changes
cp lib/services.ts lib/services.ts.backup

# If something breaks
mv lib/services.ts.backup lib/services.ts
```

### 4. Document Changes
```typescript
// Good:
async adminCheckIn(eventId: string, userId: string, adminId: string) {
  // Added 2024-11-03: Check for existing sessions before insert
  // This prevents duplicate active sessions
  const existing = await supabase...
}

// Bad:
async adminCheckIn(eventId: string, userId: string, adminId: string) {
  const existing = await supabase...  // No context
}
```

---

## 🚀 Current Status

✅ **Fixed Issues:**
- Cleared Next.js cache
- Server restarted successfully
- Running on http://localhost:3002
- All code changes preserved

✅ **Code Improvements Made:**
- Added detailed logging to adminCheckIn()
- Added detailed logging to adminCheckOut()
- Added duplicate session handling
- Added error recovery logic

✅ **Database Fixes Created:**
- COPY_PASTE_THIS_SQL.sql (fixes constraint)
- FIX_MISSING_COLUMNS.sql (adds required columns)
- SIMPLE_DIAGNOSE.sql (diagnoses issues)
- setup-all-checkin-rls.sql (fixes permissions)

---

## 📚 Additional Resources

- **Next.js Errors**: https://nextjs.org/docs/messages
- **React Error Boundaries**: For catching runtime errors
- **TypeScript Strict Mode**: Catch errors at compile time
- **Git Basics**: Learn branching and reverting

---

## 🎯 Next Steps

1. ✅ Server is running - open http://localhost:3002
2. ⏳ Enable Realtime in Supabase Dashboard
3. ⏳ Run FIX_MISSING_COLUMNS.sql
4. ⏳ Run SIMPLE_DIAGNOSE.sql
5. ⏳ Test check-in/out functionality

The website is back up and all improvements are preserved!

