#ScreepsSegmentedMemory Functionality

ScreepsSegmentedMemory functions:

 
>  `SegMemory.setCrucial(<segmentName>)`
>  `SegMemory.unsetCrucial(<segmentName>)`
>  `SegMemory.setMaxCrucialSegments(<number>)`
>  `SegMemory.getMaxCrucialSegments()`
>  `SegMemory.requestActive(<segmentName>)`
>  `SegMemory.setInActive(<segmentName>)`
>  `SegMemory.isActive(<segmentName>)`
>  `SegMemory.markDirty(<segmentName>)`
>  `SegMemory.storeSegment(<segmentName>,<Object>)`
>  `SegMemory.getSegment(<segmentName>)`
>  `SegMemory.getSegmentVersion(<segmentName>)`


###  **`SegMemory.setCrucial(<segmentName>)`**

> ***can only be called when the segment you want to add to the crucial segments is active***

Used for defining a segment as crucial, it will be loaded and available every tick. 

Returns:

 - `SegMemory.OK` on OK
 - `SegMemory.ERR_NOT_ACTIVE` when segment is not active
 - `SegMemory.ERR_NO_SPACE` when segment is too big to save


###  **`SegMemory.unsetCrucial(<segmentName>, <boolean saveAsNormalSegment>)` **
Unsets a segment as important, when `saveAsNormalSegment` is set to true it will re-save it as 


###  **`SegMemory.setMaxCrucialSegments(<number>)` **

Sets the amount of segments that are usable for crucial segments. Number can be between 0 and 10 inclusive. 

> Please beware that, the more segments you reserve for crucial segments, the less space you have for other Segment SegMemory related actions.

Returns:
 - `SegMemory.OK` on OK
 - `SegMemory.ERR_INVALID_ARGS` when the segment number is not between 0 and 10
 - `SegMemory.ERR_FULL` when the segments are currently full

###  **`SegMemory.getMaxCrucialSegments()`**

Gets the amount of segments you've configured to use for crucial memory segments.
Returns:
 - Amount of segments

###  **`SegMemory.requestActive(<segmentName>)` **

Requests a segment to be activated for next few ticks

Returns:
 - `SegMemory.OK` on OK - Queues, next tick it will be active
 - `SegMemory.ERR_INVALID_ARGS` When the segment can't be found
 - `SegMemory.ERR_FULL` when the requested segments doesn't fit in the segment buffer for next tick

###  **`SegMemory.setInActive(<segmentName>)` **

Sets a segment as inactive for the ticks

Returns:
 - `SegMemory.OK` on OK - The segment will be removed next tick.
 - `SegMemory.ERR_INVALID_ARGS` When the segment can't be found


###  **`SegMemory.isActive(<segmentName>)`**
Checks if a segment with a given name is active

Returns:
    True/false

###  **`SegMemory.markDirty(<segmentName>)`**
Marks a certain memory segment as dirty. This can be used if the object from this segment was modified outside the scope of the caller.


Returns:
 - `SegMemory.OK` on OK - Queues, next tick it will be active
 - `SegMemory.ERR_INVALID_ARGS` When the segment can't be found
 - `SegMemory.ERR_FULL` when the dirty segments doesn't fit in the segments anymore

###  **`SegMemory.storeSegment(<segmentName>,<Object>)`**
Saves a certain segment with the given object as value.

Returns:
 - `SegMemory.OK` Will be stored in segments eventually.
 - `SegMemory.ERR_FULL` when the dirty segments doesn't fit in the segments anymore

###  **`SegMemory.getSegment(<segmentName>)`**

Gets a stored object from the segment-memory

Returns:
 - < Object > - The related object
 - `SegMemory.ERR_NOT_ACTIVE` when the dirty segment isn't active
 
###  **`SegMemory.getSegmentVersion(<segmentName>)`**
Gets a stored object from the segment-memory

Returns:
 - < Number > - The related object version.
 - `SegMemory.ERR_INVALID_ARGS` When the segment can't be found
