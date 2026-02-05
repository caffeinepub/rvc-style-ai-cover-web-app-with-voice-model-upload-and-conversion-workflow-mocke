import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type IdCounter = Nat;

  // Actor type without the counter.
  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    voiceModels : Map.Map<Text, { creator : Principal; name : Text; description : Text; audio : Storage.ExternalBlob; snapshotTime : Int }>;
    conversionJobs : Map.Map<Text, { creator : Principal; sourceVoiceId : Text; targetVoiceId : Text; inputVoiceAudio : Storage.ExternalBlob; status : { #processing : { uploadTime : Int }; #completed : { blob : Storage.ExternalBlob; uploadTime : Int; processingTime : Int } } }>;
  };

  // Actor with new counter field.
  type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    voiceModels : Map.Map<Text, { creator : Principal; name : Text; description : Text; audio : Storage.ExternalBlob; snapshotTime : Int }>;
    conversionJobs : Map.Map<Text, { creator : Principal; sourceVoiceId : Text; targetVoiceId : Text; inputVoiceAudio : Storage.ExternalBlob; status : { #processing : { uploadTime : Int }; #completed : { blob : Storage.ExternalBlob; uploadTime : Int; processingTime : Int } } }>;
    jobIdCounter : IdCounter;
  };

  public func run(old : OldActor) : NewActor {
    { old with jobIdCounter = 0 };
  };
};
