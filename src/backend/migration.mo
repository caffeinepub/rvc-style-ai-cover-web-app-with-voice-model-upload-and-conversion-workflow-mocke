import Map "mo:core/Map";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";

module {
  // Old types just for migration
  type VoiceModelId = Nat;
  type ConversionJobId = Nat;
  type VoiceProfileId = Nat;

  type ModelMetadata = {
    name : Text;
    description : Text;
    format : Text;
    trainingData : [Text];
    createdAt : Int;
  };

  type VoiceModel = {
    id : VoiceModelId;
    owner : Principal;
    metadata : ModelMetadata;
    storage : Storage.ExternalBlob;
    createdAt : Int;
  };

  type ConversionJobStatus = {
    #pending;
    #processing;
    #failed;
    #complete;
  };

  type ConversionJob = {
    id : ConversionJobId;
    owner : Principal;
    modelId : VoiceModelId;
    inputAudio : Storage.ExternalBlob;
    resultAudio : ?Storage.ExternalBlob;
    status : ConversionJobStatus;
    createdAt : Int;
    updatedAt : Int;
  };

  type VoiceProfile = {
    id : VoiceProfileId;
    owner : Principal;
    name : Text;
    modelId : ?VoiceModelId;
    createdAt : Int;
  };

  type OldActor = {
    voiceModels : Map.Map<VoiceModelId, VoiceModel>;
    conversionJobs : Map.Map<ConversionJobId, ConversionJob>;
    voiceProfiles : Map.Map<VoiceProfileId, VoiceProfile>;
    userVoiceModels : Map.Map<Principal, Set.Set<VoiceModelId>>;
    userConversionJobs : Map.Map<Principal, Set.Set<ConversionJobId>>;
    nextVoiceModelId : VoiceModelId;
    nextConversionJobId : ConversionJobId;
    nextVoiceProfileId : VoiceProfileId;
  };

  type NewActor = {};

  public func run(_old : OldActor) : NewActor {
    // Remove all conversion job and voice model data
    {};
  };
};
