# 🧪 SPA Testing Guide

## Quick Start

### 1. Start Local Server
```bash
npm run dev
```

### 2. Open in Chrome
- URL: http://localhost:8787/
- Make sure Web Bluetooth flag is enabled:
  - `chrome://flags/#enable-experimental-web-platform-features`

---

## 🎯 Test Plan

### ✅ Test 1: Basic Connection
1. Click "CONNECT" button
2. Select "Nicla Sense ME" from Bluetooth dialog
3. **Expected**: 
   - Status dot turns green
   - "Connected to Nicla Sense ME" message
   - Sensors start streaming
   - 3D model starts rotating

### ✅ Test 2: Persistent Connection - History
1. Ensure device is connected (green dot)
2. Click "History" in top navigation
3. **Expected**:
   - Page switches instantly (no reload)
   - Green dot stays green
   - URL changes to `/#history`
   - No re-pairing required

### ✅ Test 3: Persistent Connection - Analytics
1. From History page (still connected)
2. Click "Analytics" in top navigation
3. **Expected**:
   - Page switches instantly
   - Green dot stays green
   - URL changes to `/#analytics`
   - Analytics data loads

### ✅ Test 4: Return to Dashboard
1. From Analytics page
2. Click "Dashboard" in top navigation
3. **Expected**:
   - Return to dashboard
   - Still connected (green dot)
   - Sensors still streaming
   - Charts updating in real-time

### ✅ Test 5: Browser Navigation
1. Click browser's BACK button
2. Click browser's FORWARD button
3. **Expected**:
   - Navigation works correctly
   - Connection persists throughout
   - Active page highlighted correctly

### ✅ Test 6: Recording Persistence
1. On Dashboard, click "START RECORDING"
2. Enter duration (e.g., "5" minutes)
3. **Expected**: Button turns red, shows "STOP RECORDING"
4. Click "History" to navigate away
5. **Expected**: Recording continues (red button still visible if you return)
6. Return to Dashboard
7. Click "STOP RECORDING"
8. **Expected**: Data saved, button returns to green

### ✅ Test 7: View Recorded Data
1. After stopping recording
2. Navigate to History
3. **Expected**: New session appears in list
4. Navigate to Analytics
5. **Expected**: Stats updated with new data

### ✅ Test 8: Disconnect and Reconnect
1. Click "DISCONNECT" button
2. **Expected**: 
   - Green dot turns gray
   - Status changes to "Not Connected"
   - Button changes to "CONNECT"
3. Navigate to History and Analytics
4. **Expected**: Navigation still works (just no live data)
5. Return to Dashboard
6. Click "CONNECT" again
7. **Expected**: Can reconnect without issues

---

## 🐛 Known Issues to Check

### Issue: Connection Drops on Navigation
**If this happens**:
- ❌ SPA not working correctly
- Check browser console for errors
- Check if `AppState.device` is null
- This is the main issue we're trying to fix!

### Issue: Charts Not Updating
**If this happens**:
- Check console for JavaScript errors
- Verify Plotly loaded correctly
- May need to reload page

### Issue: Recording Doesn't Save
**If this happens**:
- Check Network tab for failed API calls
- Check server terminal for errors
- Verify session was created successfully

---

## 📊 Success Criteria

### ✅ Must Work
- [ ] Connect to device once
- [ ] Navigate to all 3 pages
- [ ] Device stays connected (no re-pairing)
- [ ] Sensor data continues streaming
- [ ] Recording persists across navigation
- [ ] Browser back/forward works

### ⚠️ Should Work
- [ ] Charts update in real-time on all pages
- [ ] Connection status always accurate
- [ ] Navigation is instant (< 100ms)
- [ ] No console errors

### 💡 Nice to Have
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error messages are helpful

---

## 🔄 If It Fails

### Quick Revert
```bash
# Switch back to main branch
git checkout main

# Start the old version
npm run dev
```

### Debug Mode
```javascript
// In browser console, check:
console.log(AppState);
console.log(AppState.device);
console.log(AppState.isConnected);
```

---

## 📝 What to Report

If something doesn't work, please note:

1. **What you did**: Exact steps
2. **What happened**: Actual behavior
3. **What you expected**: Expected behavior
4. **Console errors**: Any red errors in console
5. **Browser**: Chrome version
6. **When it broke**: Which test step

---

## 🎉 If It Works!

If the BLE connection persists across all navigation:

```bash
# Merge to main
git checkout main
git merge feature/spa-persistent-ble
git push origin main
```

Then we can:
- Deploy to staging
- Update documentation
- Close the "persistent connection" issue
- Add more features!

---

## 🆘 Emergency Commands

### Stop Server
Press `Ctrl+C` in terminal

### Reset Everything
```bash
# Stop server
# Switch to main
git checkout main

# Delete feature branch (if needed)
git branch -D feature/spa-persistent-ble

# Restart
npm run dev
```

### Check Current Branch
```bash
git branch
# * shows current branch
```

---

## Next Steps After Testing

### If Successful ✅
1. Merge to main
2. Deploy to staging
3. Test on staging with real domain
4. Deploy to production

### If Issues ❌
1. Document what failed
2. Revert to main
3. Debug and fix
4. Re-test on feature branch

---

**Current Branch**: `feature/spa-persistent-ble`  
**Safe Branch**: `main` (unchanged)  
**Server**: `npm run dev` → http://localhost:8787/  
**Docs**: See `docs/SPA_IMPLEMENTATION.md` for details
