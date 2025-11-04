# Stats Display Format Reference

## Time Display Format

All volunteer hours are displayed in **HH:MM:SS** format for precise testing.

### Examples

| Database Value (hours) | Display Format | Breakdown |
|------------------------|----------------|-----------|
| 0.016667 | 0h 1m 0s | 1 minute exactly |
| 0.025000 | 0h 1m 30s | 1 minute 30 seconds |
| 0.041667 | 0h 2m 30s | 2 minutes 30 seconds |
| 1.000000 | 1h 0m 0s | 1 hour exactly |
| 1.500000 | 1h 30m 0s | 1.5 hours |
| 2.258333 | 2h 15m 30s | 2 hours 15 min 30 sec |
| 3.141667 | 3h 8m 30s | Pi hours 😄 |
| 12.345678 | 12h 20m 44s | Full precision |

## Conversion Formula

### Database to Display
```typescript
const hours = 2.258333  // From database

// Extract components
const h = Math.floor(hours)                           // 2
const remainingMinutes = (hours - h) * 60             // 15.5
const m = Math.floor(remainingMinutes)                // 15
const s = Math.floor((remainingMinutes - m) * 60)     // 30

// Display: "2h 15m 30s"
```

### Check-in/out to Hours
```typescript
const checkInTime = new Date('2025-11-04T17:30:00Z')
const checkOutTime = new Date('2025-11-04T19:45:30Z')

const milliseconds = checkOutTime.getTime() - checkInTime.getTime()
// = 8,130,000 ms

const hours = milliseconds / (1000 * 60 * 60)
// = 2.258333 hours

// Store with 6 decimal precision
const stored = parseFloat(hours.toFixed(6))
// = 2.258333
```

## Testing Scenarios

### Quick Tests (< 5 minutes)
Test volunteer hour tracking without waiting long:

| Wait Time | Expected Display | Use Case |
|-----------|------------------|----------|
| 30 sec | 0h 0m 30s | Quick check |
| 1 min | 0h 1m 0s | Minimum tracking |
| 2 min | 0h 2m 0s | Short test |
| 5 min | 0h 5m 0s | Validation |

### Real-world Tests
| Wait Time | Expected Display | Use Case |
|-----------|------------------|----------|
| 15 min | 0h 15m 0s | Short volunteer shift |
| 1 hour | 1h 0m 0s | Standard shift |
| 2.5 hours | 2h 30m 0s | Half-day event |
| 4 hours | 4h 0m 0s | Full volunteer day |

## Stats Page Calculations

### Total Hours (Current Organization)
```typescript
// Sum all hours from volunteer_hours table for this org
const totalDecimal = hours.reduce((sum, h) => sum + h.hours, 0)

// Convert to HH:MM:SS
const display = formatToHMS(totalDecimal)
```

### Average Hours per Event
```typescript
const avgHours = totalHours / totalEvents

// Display as decimal (not HH:MM:SS)
// Example: "2.5" means 2.5 hours average
```

### Recent Events
```typescript
// Each event shows its specific hours in HH:MM:SS
events.map(e => ({
  title: e.title,
  date: e.date,
  hours: formatToHMS(e.hours)  // e.g., "3h 15m 45s"
}))
```

### All Organizations Summary
```typescript
// For each org, sum total hours and show in HH:MM:SS
organizations.map(org => ({
  name: org.name,
  totalHours: formatToHMS(org.totalHours),  // e.g., "12h 30m 15s"
  eventCount: org.events.length
}))
```

## Database Precision

### Why 6 Decimal Places?

1 second accuracy requires:
```
1 second = 1/3600 hour = 0.000277... hours
```

To accurately represent seconds:
- 2 decimals: 0.01 hours = 36 seconds (too coarse)
- 4 decimals: 0.0001 hours = 0.36 seconds (better)
- 6 decimals: 0.000001 hours = 0.0036 seconds (perfect!)

### Storage Examples
```sql
-- Old way (2 decimals)
INSERT INTO volunteer_hours (hours) VALUES (2.25);  -- 2h 15m 0s

-- New way (6 decimals)
INSERT INTO volunteer_hours (hours) VALUES (2.258333);  -- 2h 15m 30s
```

## UI Display Rules

### When to Show HH:MM:SS
✅ Stats page total hours  
✅ Recent events list  
✅ Organization summaries  
✅ Event detail page activity log  

### When to Show Decimal
✅ Average hours per event (e.g., "2.5")  
✅ Charts and graphs  
✅ Database queries  
✅ API responses  

### Color Coding
- **Blue cards**: Total hours
- **Green cards**: Event counts
- **Purple cards**: Organization info
- **Yellow cards**: Averages and metrics
- **Yellow/Orange gradients**: Organization summaries

## Accessibility

### Screen Reader Format
```html
<span aria-label="2 hours 15 minutes 30 seconds">2h 15m 30s</span>
```

### Mobile Display
On small screens, format is preserved:
```
2h 15m 30s   (preferred)
2:15:30      (if space is critical)
```

## Edge Cases

| Scenario | Display | Notes |
|----------|---------|-------|
| 0 hours | 0h 0m 0s | User checked in/out instantly |
| < 1 sec | 0h 0m 0s | Rounds down |
| 24+ hours | 25h 30m 15s | Multi-day events |
| Negative | Error | Invalid check-in/out order |
| NULL | - | No data available |

## Testing Commands

### Check Database Precision
```sql
-- View stored precision
SELECT 
  id,
  hours,
  FLOOR(hours) as h,
  FLOOR((hours - FLOOR(hours)) * 60) as m,
  FLOOR(((hours - FLOOR(hours)) * 60 - FLOOR((hours - FLOOR(hours)) * 60)) * 60) as s
FROM volunteer_hours
WHERE user_id = 'your-user-id'
ORDER BY date DESC;
```

### Verify Check-in Duration
```sql
-- Calculate expected hours
SELECT 
  check_in_time,
  check_out_time,
  EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600 as calculated_hours
FROM event_checkins
WHERE user_id = 'your-user-id'
  AND check_out_time IS NOT NULL
ORDER BY check_in_time DESC;
```

## Future: Simplified Display

For production, you may want to simplify:

| Current (Testing) | Future (Production) | When to Switch |
|------------------|---------------------|----------------|
| 2h 15m 30s | 2.25 hours | After testing complete |
| 0h 2m 0s | 2 minutes | When users prefer it |
| 12h 30m 45s | 12.5 hours | Based on feedback |

But for now, **keep the HH:MM:SS format** for accurate testing! ✅

