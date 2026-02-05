import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type VoiceModelId = Nat;
  public type ConversionJobId = Nat;
  public type VoiceProfileId = Nat;

  public type ModelMetadata = {
    name : Text;
    description : Text;
    format : Text;
    trainingData : [Text];
    createdAt : Time.Time;
  };

  public type VoiceModel = {
    id : VoiceModelId;
    owner : Principal;
    metadata : ModelMetadata;
    storage : Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  public type ConversionJobStatus = {
    #pending;
    #processing;
    #failed;
    #complete;
  };

  public type ConversionJob = {
    id : ConversionJobId;
    owner : Principal;
    modelId : VoiceModelId;
    inputAudio : Storage.ExternalBlob;
    resultAudio : ?Storage.ExternalBlob;
    status : ConversionJobStatus;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type VoiceProfile = {
    id : VoiceProfileId;
    owner : Principal;
    name : Text;
    modelId : ?VoiceModelId;
    createdAt : Time.Time;
  };

  var nextVoiceModelId = 1 : VoiceModelId;
  var nextConversionJobId = 1 : ConversionJobId;
  var nextVoiceProfileId = 1 : VoiceProfileId;

  let voiceModels = Map.empty<VoiceModelId, VoiceModel>();
  let conversionJobs = Map.empty<ConversionJobId, ConversionJob>();
  let voiceProfiles = Map.empty<VoiceProfileId, VoiceProfile>();
  let userVoiceModels = Map.empty<Principal, Set.Set<VoiceModelId>>();
  let userConversionJobs = Map.empty<Principal, Set.Set<ConversionJobId>>();

  // Initialize storage mixin
  include MixinStorage();

  // Initialize authorization system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public shared ({ caller }) func uploadVoiceModel(metadata : ModelMetadata, file : Storage.ExternalBlob) : async VoiceModelId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can upload models");
    };

    let modelId = nextVoiceModelId;
    nextVoiceModelId += 1;

    let voiceModel : VoiceModel = {
      id = modelId;
      owner = caller;
      metadata;
      storage = file;
      createdAt = Time.now();
    };

    voiceModels.add(modelId, voiceModel);

    // Track models per user
    let currentModels = switch (userVoiceModels.get(caller)) {
      case (null) { Set.empty<VoiceModelId>() };
      case (?models) { models };
    };
    currentModels.add(modelId);
    userVoiceModels.add(caller, currentModels);
    modelId;
  };

  public query ({ caller }) func getVoiceModelsByOwner() : async [VoiceModel] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can view their models");
    };

    switch (userVoiceModels.get(caller)) {
      case (null) { [] };
      case (?modelIds) {
        let modelsIter = modelIds.values().map(
          func(id) {
            switch (voiceModels.get(id)) {
              case (null) {
                Runtime.trap("Internal error: Voice model id " # id.toText() # " not found");
              };
              case (?model) { model };
            };
          }
        );
        modelsIter.toArray();
      };
    };
  };

  public shared ({ caller }) func createConversionJob(modelId : VoiceModelId, inputAudio : Storage.ExternalBlob) : async ConversionJobId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can create conversion jobs");
    };

    // Verify the model exists and caller has access to it
    let model = switch (voiceModels.get(modelId)) {
      case (null) { Runtime.trap("Voice model not found") };
      case (?model) { model };
    };

    if (model.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create jobs with your own models");
    };

    let jobId = nextConversionJobId;
    nextConversionJobId += 1;

    let conversionJob : ConversionJob = {
      id = jobId;
      owner = caller;
      modelId;
      inputAudio;
      resultAudio = null;
      status = #pending;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    conversionJobs.add(jobId, conversionJob);

    // Track jobs per user
    let currentJobs = switch (userConversionJobs.get(caller)) {
      case (null) { Set.empty<ConversionJobId>() };
      case (?jobs) { jobs };
    };
    currentJobs.add(jobId);
    userConversionJobs.add(caller, currentJobs);
    jobId;
  };

  public query ({ caller }) func getConversionJobsByOwner() : async [ConversionJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can view their conversion jobs");
    };

    switch (userConversionJobs.get(caller)) {
      case (null) { [] };
      case (?jobIds) {
        let jobsIter = jobIds.values().map(
          func(id) {
            switch (conversionJobs.get(id)) {
              case (null) {
                Runtime.trap("Internal error: Conversion job id " # id.toText() # " not found");
              };
              case (?job) { job };
            };
          }
        );
        jobsIter.toArray();
      };
    };
  };

  public shared ({ caller }) func processConversionJob(jobId : ConversionJobId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can process conversion jobs");
    };

    let job = switch (conversionJobs.get(jobId)) {
      case (null) { Runtime.trap("Conversion job not found") };
      case (?job) { job };
    };

    if (job.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the job owner can process this job");
    };

    let updatedJob = { job with status = #processing; updatedAt = Time.now() };
    conversionJobs.add(jobId, updatedJob);

    // Simulate processing by copying inputAudio to resultAudio
    let completedJob = {
      job with
      status = #complete;
      resultAudio = ?job.inputAudio;
      updatedAt = Time.now();
    };
    conversionJobs.add(jobId, completedJob);
  };

  public query ({ caller }) func getVoiceModel(modelId : VoiceModelId) : async ?VoiceModel {
    let model = switch (voiceModels.get(modelId)) {
      case (null) { return null };
      case (?model) { model };
    };

    // Only owner or admin can view a specific model
    if (model.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own models");
    };

    ?model;
  };

  public query ({ caller }) func getConversionJob(jobId : ConversionJobId) : async ?ConversionJob {
    let job = switch (conversionJobs.get(jobId)) {
      case (null) { return null };
      case (?job) { job };
    };

    // Only owner or admin can view a specific job
    if (job.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own conversion jobs");
    };

    ?job;
  };

  public shared ({ caller }) func deleteVoiceModel(modelId : VoiceModelId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can delete models");
    };

    let model = switch (voiceModels.get(modelId)) {
      case (null) { Runtime.trap("Voice model not found") };
      case (?model) { model };
    };

    if (model.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the model owner can delete this model");
    };

    voiceModels.remove(modelId);

    // Remove model from user's set of models
    switch (userVoiceModels.get(model.owner)) {
      case (null) { () };
      case (?models) {
        models.remove(modelId);
      };
    };
  };
};
