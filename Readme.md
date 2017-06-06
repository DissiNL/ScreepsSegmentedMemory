#ScreepsSegmentedMemory Module for [Screeps](https://screeps.com)

Module created to handle RawMemory.segments for you!

Make sure to check the [functionality](Functionality.md)
Memory requirements are also [defined](MemoryLayout.md)


You can use it as follows:
```javascript
// ===========================
// Every tick:
SegMemory.init();
// ~your code until the end of the tick
var toEnable = SegMemory.endTick(); 
var activeSegments = SegMemory.endTick();// Creates a list of segments that should be active/set
if(activeSegments.rawMemorySegmentData){
    for(var data in RawMemory.segments){
        delete RawMemory.segments[data];
    }
    for(var data in activeSegments.rawMemorySegmentData){
        RawMemory.segments[data] = activeSegments.rawMemorySegmentData[data];
    }
}
RawMemory.setActiveSegments(activeSegments.nextEnabled);
// ===========================

// ================ Example code tick 1:
SegMemory.storeSegment("test",{test:true});
SegMemory.setActive("test");
// ===========================

// ================ Example code tick 2:
SegMemory.getSegment("test");
SegMemory.setCrucial("test");
// ===========================
```
