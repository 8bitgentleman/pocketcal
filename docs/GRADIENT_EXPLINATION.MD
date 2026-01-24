The Color Decision Flow                                                                                                            
                                                                                                                                     
  1️⃣ Each Calendar Has a Color                                                                                                       
                                                                                                                                     
  Let me show you where calendars store their colors:                                                                                
                                                                                                                                     
⏺ Search(pattern: "interface EventGroup|type EventGroup", path: "src/store.ts", output_mode: "content")                              
  ⎿  Found 11 lines (ctrl+o to expand)                                                                                               
                                                                                                                                     
⏺ 2️⃣ Date Rendering Logic (Calendar.tsx:684-703)                                                                                     
                                                                                                                                     
  For every date, here's what happens:                                                                                               
                                                                                                                                     
  // 1. Find ALL calendars with events on this date                                                                                  
  const groupsWithDate = dateInfo.groups.filter(g => g.name !== "Unispace Holidays");                                                
                                                                                                                                     
  // 2. Make a decision based on how many calendars match:                                                                           
  if (groupsWithDate.length !== 1) return null;  // Multiple calendars? Use split colors                                             
                                                                                                                                     
  // 3. If exactly ONE calendar, grab its color                                                                                      
  const singleGroup = groupsWithDate[0];                                                                                             
                                                                                                                                     
  // 4. Generate gradient from that calendar's color                                                                                 
  return {                                                                                                                           
    background: createGradientFromColor(singleGroup.color), // Uses the calendar's hex color!                                        
    color: '#0a0a0a',                                                                                                                
  };                                                                                                                                 
                                                                                                                                     
  Visual Example:                                                                                                                    
                                                                                                                                     
  📅 January 14                                                                                                                      
  ├─ Check: Which calendars have events on Jan 14?                                                                                   
  ├─ Found: 1 calendar ("Work Events" with color "#ff6b35")                                                                          
  ├─ Decision: Use gradient!                                                                                                         
  └─ Result: createGradientFromColor("#ff6b35")                                                                                      
             → "linear-gradient(135deg, rgb(255,107,53), rgb(255,156,127))"                                                          
                                                                                                                                     
  📅 January 13 (multiple calendars overlap)                                                                                         
  ├─ Check: Which calendars have events on Jan 13?                                                                                   
  ├─ Found: 2 calendars ("Work" #ff6b35, "Personal" #10b981)                                                                         
  ├─ Decision: Multiple calendars = split colors                                                                                     
  └─ Result: Show color blocks (no gradient)                                                                                         
                                                                                                                                     
  3️⃣ Where Calendar Colors Come From                                                                                                 
                                                                                                                                     
  When you create a calendar in the sidebar, you assign it a color:                                                                  
                                                                                                                                     
⏺ Search(pattern: "addEventGroup|color.*=", path: "src/store.ts", output_mode: "content")                                            
  ⎿  Found 52 lines (ctrl+o to expand)                                                                                               
                                                                                                                                     
⏺ Search(pattern: "export const GROUP_COLORS|GROUP_COLORS =", path: "src", output_mode: "content")                                   
  ⎿  Found 21 lines (ctrl+o to expand)                                                                                               
                                                                                                                                     
⏺ Perfect! Here's the complete picture:                                                                                              
                                                                                                                                     
  🎨 Complete Color Flow                                                                                                             
                                                                                                                                     
  Step 1: Calendar Gets a Color (When Created)                                                                                       
                                                                                                                                     
  // store.ts line 20-33                                                                                                             
  export const GROUP_COLORS = [                                                                                                      
    { hex: "#24d05a", rgb: "rgb(36, 208, 90)" }, // green                                                                            
    { hex: "#f44336", rgb: "rgb(244 67 54)" },   // red                                                                              
    { hex: "#10a2f5", rgb: "rgb(16, 162, 245)" }, // blue                                                                            
    { hex: "#eb4888", rgb: "rgb(235, 72, 136)" }, // pink                                                                            
    { hex: "#e9bc3f", rgb: "rgb(233, 188, 63)" }, // yellow                                                                          
    // ... more colors for Pro users                                                                                                 
  ];                                                                                                                                 
                                                                                                                                     
  When you create a new calendar, it automatically gets assigned the next available color from this palette.                         
                                                                                                                                     
  Step 2: Date Checks Which Calendars Apply                                                                                          
                                                                                                                                     
  // For Jan 17:                                                                                                                     
  // ├─ "Work Events" has a date range that includes Jan 17? ✅ YES                                                                  
  // ├─ "Personal" has a date range that includes Jan 17? ❌ NO                                                                      
  // └─ Result: Only 1 calendar → Use "Work Events" color                                                                            
                                                                                                                                     
  Step 3: Gradient Generated from Calendar Color                                                                                     
                                                                                                                                     
  // "Work Events" calendar has color: "#24d05a" (green)                                                                             
  createGradientFromColor("#24d05a")                                                                                                 
  // ↓                                                                                                                               
  // Returns: "linear-gradient(135deg, rgb(36, 208, 90), rgb(174, 228, 196))"                                                        
  //                                    ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^                                                       
  //                                    Original green         30% lighter green                                                     
                                                                                                                                     
  Step 4: Applied as Inline Style                                                                                                    
                                                                                                                                     
  <div style={{                                                                                                                      
    background: "linear-gradient(135deg, rgb(36, 208, 90), rgb(174, 228, 196))",                                                     
    color: "#0a0a0a"                                                                                                                 
  }}>                                                                                                                                
    17                                                                                                                               
  </div>                                                                                                                             
                                                                                                                                     
  🔧 To Change Colors                                                                                                                
                                                                                                                                     
  Change the gradient style: Edit /src/utils/gradientUtils.ts                                                                        
  Change calendar palette: Edit GROUP_COLORS in /src/store.ts (lines 20-33)                                                          
  Change a specific calendar's color: Click the settings icon next to the calendar in the sidebar                                    
                                                                                                                                     
  So yes, each date pulls the color directly from the calendar that has an event on that date! 🎯