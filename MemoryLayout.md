#ScreepsSegmentedMemory memory layouts

Memory contents are located in:

    Memory.rawMemSegmentData
    
Sub objects are:
 1. data
 2. dirty
 3. bookKeeping

  
##1. Information about ***data***
####**Why is this needed?**
Segments can get bigger than 100 KB, which means they might have to be split up. We want to abstract this away and only keep references to where the data is located to reconstruct the data at a later time.
####**What does it contain?**

The `data` contains information which segment of `RawMemory.segments` is related to what data. 

The data structure it holds is as follows:
```javascript
{
    {segmentName}: [segment ID array] // 0 to max 5 segments
}
```
An example of the layout would be

```javascript
{
    PromotedPaths: [0,1,2],
    Matrixes: [4,5],
    Allies: [7,8]
}
```
Requesting a memory segment with a name will result in the engine reserving **X ** amount of segments to load for next tick.


##2 Information about ***dirty***

####**Why is this needed?**

This object is needed to store information before it's pushed to the segments. The pieces of data are deleted once the segment has been written. 

####**What does it contain?**


The `dirty` entry in `Memory.rawMemSegmentData` holds raw memory contents which hasn't been persisted yet due to the segments not being loaded.

The data structure it holds is as follows:
```javascript
{
    {segmentName}: {"String with memory contents that needs to be saved"}
                    // Maximum is 1000 KB of characters
}
```
An example of the layout would be

```javascript
{
    PromotedPaths: "Massive 256 KB string here",
    Matrixes: "Massive 128 KB string here",
    Allies: "Nothing here"
}
```
##3 Information about *bookKeeping*

####**Why is this needed?**

Different versions of different segments can be loaded on nodes at runtime. This versioning information is stored on global, and in memory. If there is a mismatch the data should be reloaded. If data is stored to the segments the version number here is altered to a new ID.

####**What does it contain?**

The `bookKeeping` entry in `Memory.rawMemSegmentData` holds versioning information about the segment.

The data structure it holds is as follows:
```javascript
{
    {segmentName}: <number>
                    
}
```
An example of the layout would be

```javascript
{
    PromotedPaths: 9001,
    Matrixes: 1337,
    Allies: 0
}
```