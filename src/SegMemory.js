var SEGMEMORY_INTER_TICK_GLOBAL = {};
SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache = {};
SEGMEMORY_INTER_TICK_GLOBAL.crucialData = {};

global.CONST_MEMORY_SEGMENT_MAX_SIZE = 102399;
var segMem = class SegMemory {

    static get CONFIG_DEFAULTS() {
        return {
            maxCrucial: 5,
            usableSegments: 8, // leave 2 for other libraries to use
            startIndex: 10,
            endIndex: 99
        };
    }
    static get CRUCIAL_SEGMENT_NAME() {
        return "Crucial"
    };
    static get ERR_INVALID_ARGS() {
        return -2;
    }

    static get ERR_FULL() {
        return -3;
    }

    static get ERR_NOT_ACTIVE() {
        return -4;
    }

    static get OK() {
        return -1;
    }

    static getSegmentDataRegister() {
        if (!Memory.__rawMemSegmentData.data) {
            Memory.__rawMemSegmentData.data = {};
        }
        return Memory.__rawMemSegmentData.data;
    }
    static getBookKeeping() {
        if (!Memory.__rawMemSegmentData.bookKeeping) {
            Memory.__rawMemSegmentData.bookKeeping = {};
        }
        return Memory.__rawMemSegmentData.bookKeeping;

    }
    static getConfig() {
        if (!Memory.__rawMemSegmentData.config) {
            Memory.__rawMemSegmentData.config = {};
        }
        return Memory.__rawMemSegmentData.config;
    }
    static getConfigByIndexKey(theKey) {
        var config = this.getConfig();
        if (config[theKey]) {
            return config[theKey];
        }
        return SegMemory.CONFIG_DEFAULTS[theKey];
    }

    static getUsableSegments() {
        return this.getConfigByIndexKey("usableSegments");
    }

    static getStartMemoryIndex() {
        return this.getConfigByIndexKey("startIndex");
    }

    static getEndMemoryIndex() {
        return this.getConfigByIndexKey("endIndex");
    }
    static getMaxCrucialSegments() {
        return this.getConfigByIndexKey("maxCrucial");
    }

    static getCrucialSegments() {
        var config = this.getConfig();
        if (!config.crucialSegment) {
            config.crucialSegment = {};
        }
        return config.crucialSegment;
    }

    static getActiveSegments() {
        var config = this.getConfig();
        if (!config.activeSegment) {
            config.activeSegment = {};
        }
        return config.activeSegment;
    }

    static getDirtySegments() {
        var config = this.getConfig();
        if (!config.dirtySegments) {
            config.dirtySegments = {};
        }
        return config.dirtySegments;
    }

    static init() {
        if (!Memory.__rawMemSegmentData) {
            Memory.__rawMemSegmentData = {};
        }
        SEGMEMORY_INTER_TICK_GLOBAL.tickData = {};
        SEGMEMORY_INTER_TICK_GLOBAL.tickData.active_segments = Object.keys(RawMemory.segments);
        return this.initializeCrucialSegment();
    }

    static endTick() {
        var nextEnabled = [];
        var crucials = this.getSegmentIndexesFromRegistry(SegMemory.CRUCIAL_SEGMENT_NAME);
        for (var i = 0; i < crucials.length; i++) {
            nextEnabled.push(crucials[i]);
        }
        var activeSegments = this.getActiveSegments();
        for (var segmentName in activeSegments) {
            var toAdd = this.getSegmentIndexesFromRegistry(segmentName);
            for (var i = 0; i < toAdd.length; i++) {
                nextEnabled.push(toAdd[i]);
            }
        }


        this.storeDirtyMemory(nextEnabled);
        return nextEnabled;
    }

    static storeDirtyMemory(nextEnabled) {
        var dirtySegmentObject = this.getDirtySegments();
        var dirtySegments = Object.keys(dirtySegmentObject);
        if (dirtySegments.length == 0) {
            return;
        }
        var maxUsable = this.getUsableSegments();
        var toBeUsedDuringStorage = maxUsable - nextEnabled.length;

        for (var segmentName in dirtySegments) {
            var toSave = dirtySegments[segmentName];
            var dataLocations = this.getSegmentObjectFromRegistry(toSave);
            var splitData = dataLocations.dirty;
            if (!splitData) {
                delete dirtySegmentObject[toSave];
            }
            var neededFreeSpaces = splitData.length;
            for (var dataLocation in dataLocations.s) {
                if (_.contains(nextEnabled, dataLocations.s[dataLocation])) {
                    neededFreeSpaces--;
                }
            }

            if (neededFreeSpaces > toBeUsedDuringStorage) {
                continue;
            }

            toBeUsedDuringStorage -= neededFreeSpaces;
            for (var i = 0; i < splitData.length; i++) {
                RawMemory.segments[dataLocations.s[i]] = splitData[i];
            }
            console.log("Saved new version of " + toSave);
            delete dataLocations.dirty;
            delete dirtySegmentObject[toSave];
        }
    }

    static splitToSegmentSizedData(theData) {
        if (theData.length < CONST_MEMORY_SEGMENT_MAX_SIZE) {
            return [theData];
        }
        var ret = [];
        for (var offset = 0, strLen = theData.length; offset < strLen; offset += CONST_MEMORY_SEGMENT_MAX_SIZE) {
            ret.push(theData.substring(offset, offset + CONST_MEMORY_SEGMENT_MAX_SIZE));
        }
        return ret;
    }

    static initializeCrucialSegment() {
        var bookKeeping = this.getBookKeeping();
        var version = this.getSegmentVersion(SegMemory.CRUCIAL_SEGMENT_NAME);
        if (version == SegMemory.ERR_INVALID_ARGS) {
            this.storeSegment(SegMemory.CRUCIAL_SEGMENT_NAME, "{}");
        }

        if (!this.areAllMemorySegmentsActive(SegMemory.CRUCIAL_SEGMENT_NAME)) {
            return SegMemory.ERR_NOT_ACTIVE;
        }
        if (!this.validateGLobalCacheForSegment(SegMemory.CRUCIAL_SEGMENT_NAME)) {
            try {
                SEGMEMORY_INTER_TICK_GLOBAL.crucialData = JSON.parse(this.getCombinedDataFromRegistery(SegMemory.CRUCIAL_SEGMENT_NAME));
                SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[SegMemory.CRUCIAL_SEGMENT_NAME] = {
                    tick: this.getSegmentVersion(SegMemory.CRUCIAL_SEGMENT_NAME)
                };
                console.log("Cache miss on crucial data! " + version);
            } catch (error) {
                console.log("Memory got corrupted: " + this.getCombinedDataFromRegistery(SegMemory.CRUCIAL_SEGMENT_NAME));
            }
        }
    }

    static areAllMemorySegmentsActive(theSegmentName) {
        var dataLocations = this.getSegmentIndexesFromRegistry(theSegmentName);
        for (var i = 0; i < dataLocations.length; i++) {
            if (!RawMemory.segments[dataLocations[i]]) {
                return false;
            }
        }
        return true;
    }

    static getCombinedDataFromRegistery(theSegmentName) {
        var dataLocations = this.getSegmentIndexesFromRegistry(theSegmentName);
        var data = "";
        for (var i = 0; i < dataLocations.length; i++) {

            data += RawMemory.segments[dataLocations[i]];
        }
        return data;
    }

    static storeSegment(theSegmentName, theData) {
        var version = this.getSegmentVersion(theSegmentName);

        if (version == SegMemory.ERR_INVALID_ARGS) {
            this.initializeSegment(theSegmentName);
        }
        if (this.isCrucialSegment(theSegmentName)) {
            console.log("Can't store crucial segments yet!");
            // TODO fix
            return;
        }

        console.log("Storing new segment with name " + theSegmentName);

        // Generate data we need to store
        var dataToStore;
        var isObject = false;
        if (typeof theData === "string" || theData instanceof String) {
            dataToStore = theData;
        } else {
            dataToStore = JSON.stringify(theData);
            // needed so we know what to serialize to later
            isObject = true;
        }

        var dataSegmentsNeeded = Math.max(1, Math.ceil(dataToStore.length / CONST_MEMORY_SEGMENT_MAX_SIZE));
        var segments = this.getSegmentIndexesFromRegistry(theSegmentName);
        console.log("Needed:[" + dataSegmentsNeeded + "] current: [" + segments.length + "]");

        // Allocate or de-allocate segments
        if (segments.length < dataSegmentsNeeded) {
            var result = this.allocateExtraSegment(theSegmentName, dataSegmentsNeeded);
            if (result === SegMemory.ERR_FULL) {
                return result;
            }
        } else if (segments.length > dataSegmentsNeeded) {
            this.releaseSingleSegmentFor(theSegmentName, dataSegmentsNeeded);
        }

        // Mark as dirty....
        var segmentObject = this.getSegmentObjectFromRegistry(theSegmentName);
        segmentObject.dirty = this.splitToSegmentSizedData(dataToStore);
        if (isObject) {
            segmentObject.o = true;
        } else {
            delete segmentObject.o;
        }
        this.getDirtySegments()[theSegmentName] = true;

        // Increase version....
        var now = this.getSegmentVersion(theSegmentName);
        var next = now + 1;
        this.setSegmentVersion(theSegmentName, next);

        // Set cache details
        SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName] = {
            data: theData,
            tick: next
        }

        return SegMemory.OK;
    }

    static allocateExtraSegment(theSegmentName, theNeededSegmentCount) {
        var segments = this.getSegmentIndexesFromRegistry(theSegmentName);
        var startIndex = this.getStartMemoryIndex();
        var endIndex = this.getEndMemoryIndex();
        var buildUsedIndex = this.buildSegmentUsageIndex();

        for (var i = startIndex; i <= endIndex; i++) {
            if (!buildUsedIndex[i]) {
                // Not used yet!
                segments.push(i);
                if (segments.length === theNeededSegmentCount) {
                    return SegMemory.OK;
                }
            }
        }
        return SegMemory.ERR_FULL;
    }

    static releaseSingleSegmentFor(theSegmentName, theNeededSegmentCount) {
        var segments = this.getSegmentIndexesFromRegistry(theSegmentName);

        while (segments.length > theNeededSegmentCount) {
            segments.pop();
        }

    }

    static buildSegmentUsageIndex() {
        var registerData = this.getSegmentDataRegister();
        var usedSegmentRegister = {};
        for (var segmentDataObjectName in registerData) {
            if (this.isCrucialSegment(segmentDataObjectName)) {
                continue;
            }
            var segmentDataObject = registerData[segmentDataObjectName];
            for (var i = 0; i < segmentDataObject.s.length; i++) {
                usedSegmentRegister[segmentDataObject.s[i]] = true;
            }
        }
        return usedSegmentRegister;
    }

    static getSegmentObjectFromRegistry(theSegmentName) {
        var registerData = this.getSegmentDataRegister();
        if (!registerData[theSegmentName]) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        return registerData[theSegmentName];
    }

    static getSegmentIndexesFromRegistry(theSegmentName) {
        var registerData = this.getSegmentDataRegister();
        if (!registerData[theSegmentName]) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        return registerData[theSegmentName].s;
    }

    static initializeSegment(theSegmentName) {
        console.log("Initializing new segment with name " + theSegmentName);
        var bookKeeping = this.getBookKeeping();
        var segmentDataRegister = this.getSegmentDataRegister();
        bookKeeping[theSegmentName] = Game.time;
        segmentDataRegister[theSegmentName] = {
            s: []
        };
    }


    static getSegment(theSegmentName) {
        if (this.validateGLobalCacheForSegment(theSegmentName)) {
            return SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName].data;
        }

        var registerData = this.getSegmentObjectFromRegistry(theSegmentName);
        if (registerData === SegMemory.ERR_INVALID_ARGS) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        var segmentData;
        if (this.isCrucialSegment(theSegmentName)) {
            var segmentData = SEGMEMORY_INTER_TICK_GLOBAL.crucialData[theSegmentName];
        } else if (this.areAllMemorySegmentsActive(theSegmentName)) {
            segmentData = this.getCombinedDataFromRegistery(theSegmentName);
        }

        if (registerData.o) {
            try {
                segmentData = JSON.parse(segmentData);
            } catch (error) {
                console.log("Memory of segment [" + theSegmentName + "] got corrupted");
            }
        }
        SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName] = {
            data: segmentData,
            tick: this.getSegmentVersion(theSegmentName)
        }
        return SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName].data;

    }
    static isCrucialSegment(theSegmentName) {
        return this.getCrucialSegments()[theSegmentName] === true;
    }

    static validateGLobalCacheForSegment(theSegmentName) {
        if (!SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName]) {
            return false;
        }
        var bookKeeping = this.getBookKeeping();
        if (!bookKeeping[theSegmentName]) {
            return false;
        }
        if (SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName].tick != bookKeeping[theSegmentName]) {
            delete SEGMEMORY_INTER_TICK_GLOBAL.loadedDataCache[theSegmentName];
            return false;
        }
        return true;
    }

    static getSegmentVersion(theSegmentName) {
        if (this.getCrucialSegments()[theSegmentName]) {
            return this.getSegmentVersion(SegMemory.CRUCIAL_SEGMENT_NAME);
        }
        var bookKeeping = this.getBookKeeping();
        if (!bookKeeping[theSegmentName]) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        return bookKeeping[theSegmentName];
    }

    static setSegmentVersion(theSegmentName, theVersion) {
        var bookKeeping = this.getBookKeeping();
        bookKeeping[theSegmentName] = theVersion;
    }

    static setCrucial(theSegmentName) {
        if (this.getSegmentVersion(theSegmentName) === SegMemory.ERR_INVALID_ARGS) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        if (this.isCrucialSegment(theSegmentName)) {
            return SegMemory.OK;
        }

        var dataToPort = this.getSegment(theSegmentName);
        var registerData = this.getSegmentObjectFromRegistry(theSegmentName);
        if (registerData.o) {
            delete registerData.o;
        }

        SEGMEMORY_INTER_TICK_GLOBAL.crucialData[theSegmentName] = dataToPort;

        delete this.getSegmentObjectFromRegistry(theSegmentName).s;
        delete this.getActiveSegments()[theSegmentName];
        this.getCrucialSegments()[theSegmentName] = true;
        this.storeSegment(SegMemory.CRUCIAL_SEGMENT_NAME, SEGMEMORY_INTER_TICK_GLOBAL.crucialData);
    }

    static unsetCrucial(theSegmentName, saveAsNormalSegment) {

    }

    static setActive(theSegmentName) {
        if (this.getSegmentVersion(theSegmentName) === SegMemory.ERR_INVALID_ARGS) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        if (this.getActiveSegments()[theSegmentName]) {
            return SegMemory.OK;
        }

        var total = this.getActiveTotalSegments() + this.getSegmentIndexesFromRegistry(theSegmentName).length;
        if (total > this.getUsableSegments()) {
            return SegMemory.ERR_FULL;
        }
        this.getActiveSegments()[theSegmentName] = true;
        return SegMemory.OK;
    }
    static setInActive(theSegmentName) {
        if (this.getSegmentVersion(theSegmentName) === SegMemory.ERR_INVALID_ARGS) {
            return SegMemory.ERR_INVALID_ARGS;
        }
        delete this.getActiveSegments()[theSegmentName];
        return SegMemory.OK;
    }
    static getActiveTotalSegments() {
        var activeSegments = Object.keys(this.getActiveSegments());
        var totalActiveSegmentsCounter = 0;
        for (var i = 0; i < activeSegments.length; i++) {
            var activeSegmentName = activeSegments[i];
            totalActiveSegmentsCounter += this.getSegmentIndexesFromRegistry(activeSegmentName).length
        }
        totalActiveSegmentsCounter += this.getSegmentIndexesFromRegistry(SegMemory.CRUCIAL_SEGMENT_NAME).length
        return totalActiveSegmentsCounter;
    }

}

module.exports = segMem;