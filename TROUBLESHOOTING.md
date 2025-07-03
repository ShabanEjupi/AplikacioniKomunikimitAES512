# Troubleshooting Guide

## Common Issues and Solutions

### 1. File Upload Issues
**Problem**: "I can't see the file that was sent to me from alice"

**Solution**: 
- The file upload system has been fixed to use the correct server URL
- Files are now properly served with download links
- File messages now show as special formatted messages with download buttons

**To test**:
1. Login as one user (e.g., alice)
2. Select another user (e.g., testuser) 
3. Click the "📎 File" button
4. Upload a file
5. The message will show as "📎 File Shared" with a download link
6. Switch to the other user to see the file message

### 2. Video Call Issues
**Problem**: "When I make the first call it doesn't go to Alice"

**Solutions Applied**:
- Fixed user lookup in server - now properly matches usernames
- Added detailed logging for call initiation
- Fixed WebRTC offer/answer handling
- Added proper event handlers

**To test**:
1. Open two browser windows/tabs
2. Login as different users (alice, testuser)
3. In one window, select the other user and click "📹 Video Call"
4. The other window should show an incoming call notification
5. Accept the call to start video connection

### 3. Same-PC Video Call Issues
**Problem**: "Video call doesn't start and it doesn't get heard by each others side maybe that's why I'm testing it to the same pc and both can't take the mic and the camera at the same time"

**Solutions Applied**:
- Added special media constraints for same-PC testing
- Reduced video quality to prevent resource conflicts
- Added audio echo cancellation
- Muted local video to prevent feedback
- Added connection state monitoring

**Same-PC Testing Tips**:
- Use different browsers (Chrome and Firefox) for better resource separation
- Or use incognito/private windows
- The local video will be muted automatically to prevent echo
- Video quality is reduced for better performance

### 4. WebRTC Connection Debugging

The system now includes detailed logging for WebRTC:
- `🚀 Starting video call with: [username]`
- `📞 Found callee socket, sending call invitation`
- `📨 Received WebRTC offer from: [username]`
- `✅ Video call connected`

Check the browser console and server logs for these messages.

### 5. File System Issues

**Files are stored in**: `server/uploads/`
**File info is tracked in**: `server/uploads/files-info.json`

If files aren't accessible:
1. Check if the uploads directory exists
2. Check file permissions
3. Verify the server is running on the correct port (3001 for HTTPS)

## Testing Steps

### Complete Test Procedure:

1. **Start the servers**:
   ```powershell
   npm run install:all
   npm run start:demo
   ```

2. **Test File Sharing**:
   - Login as alice in first window
   - Login as testuser in second window
   - In alice's window: select testuser, click 📎, upload a file
   - In testuser's window: you should see a "📎 File Shared" message with download link

3. **Test Video Calling**:
   - In alice's window: select testuser, click 📹
   - In testuser's window: accept the incoming call
   - Both should see local and remote video streams

## Debug Information

The system includes a debug panel (toggle with the "🎓" button) that shows:
- Real-time security status
- WebRTC connection states
- Message encryption status
- System performance metrics

## Known Limitations

1. **Same-PC Testing**: Audio may have echo - this is normal for same-PC testing
2. **File Types**: Some file types may need additional MIME type configuration
3. **Camera Access**: Only one application can access camera at a time per browser

## Getting Help

If issues persist:
1. Check browser console for JavaScript errors
2. Check server logs for connection issues
3. Verify all dependencies are installed
4. Try using different browsers for testing
5. Restart the servers if needed

## Port Configuration

- HTTP Server: `http://localhost:3000`
- HTTPS Server: `https://localhost:3001` (used by client)
- TLS Server: `localhost:3002`

Make sure these ports are not blocked by firewall or used by other applications.
