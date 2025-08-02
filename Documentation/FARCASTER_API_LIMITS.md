# Farcaster API Limitations and Validation

This document outlines all Farcaster API limitations that Story Weaver must comply with to ensure proper functionality.

## Cast Action Response Limitations

### Message Response Type
- **Message field**: Maximum 80 characters
- **Link field**: Optional, must use `http://` or `https://` protocol
- **Type field**: Must be exactly `"message"`

### Frame Response Type  
- **FrameUrl field**: Maximum 256 bytes
- **Type field**: Must be exactly `"frame"`
- **Protocol**: Must use `https://` for frameUrl

### Error Response Type
- **Message field**: Maximum 80 characters for error messages
- **HTTP Status**: Must be 4xx for client errors

## Cast Action Metadata Limitations

### Required Fields
- **Name**: Maximum 30 characters
- **Description**: Maximum 80 characters  
- **Icon**: Must be valid Octicon identifier (see full list in spec)
- **Action.type**: Must be `"post"`

### Optional Fields
- **AboutUrl**: Must use `http://` or `https://` protocol
- **Action.postUrl**: If not provided, clients POST to metadata URL

## Frame Specification Limits

### Meta Tags
- **fc:frame**: Must be `"vNext"` 
- **fc:frame:image**: Required, must be valid image URL
- **fc:frame:button:X**: Maximum 4 buttons (X = 1-4)
- **fc:frame:input:text**: Maximum 1 text input per frame

### Image Requirements
- **Aspect Ratios**: Only 1.91:1 or 1:1 supported
- **Protocol**: Must use `https://` for image URLs

## Story Weaver Implementation

Our cast action handler includes validation:

```typescript
function validateActionMessage(message: string): string {
  if (message.length <= 80) return message;
  return message.substring(0, 77) + "...";
}
```

### Response Examples

**New Story Created (Owner)**:
```json
{
  "message": "🧙‍♂️ New story created!",
  "link": "https://worthifyme.in/story/[story-id]"
}
```

**Story Already Exists**:
```json
{
  "message": "🔗 Story already exists!",
  "link": "https://worthifyme.in/story/[story-id]"
}
```

**Contribution Submitted**:
```json
{
  "message": "🎭 Contribution sent for review!",
  "link": "https://worthifyme.in/story/[story-id]"
}
```

**No Story for Cast**:
```json
{
  "message": "🧙‍♂️ No story yet! Explore existing stories.",
  "link": "https://worthifyme.in"
}
```

## Error Handling

All error responses comply with the 80-character limit:

```json
{
  "message": "Story weaving failed"
}
```

## Additional Constraints

- **Response Time**: Clients wait at least 5 seconds for action responses
- **HTTPS Only**: All URLs must use secure HTTPS protocol
- **JSON Format**: All responses must be valid JSON
- **Content-Type**: Must be `application/json` for JSON responses
- **CORS Headers**: Must include proper CORS headers for cross-origin requests

This ensures Story Weaver cast actions work reliably across all Farcaster clients.