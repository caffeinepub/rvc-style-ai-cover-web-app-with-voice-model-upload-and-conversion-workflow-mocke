import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  public type VoiceModel = {
    creator : Principal;
    name : Text;
    description : Text;
    audio : Storage.ExternalBlob;
    snapshotTime : Time.Time;
  };

  public type VoiceModelWithId = {
    id : Text;
    model : VoiceModel;
  };

  public type JobStatus = {
    #processing : {
      uploadTime : Time.Time;
    };
    #completed : {
      blob : Storage.ExternalBlob;
      uploadTime : Time.Time;
      processingTime : Time.Time;
    };
  };

  public type ConversionJob = {
    creator : Principal;
    sourceVoiceId : Text;
    targetVoiceId : Text;
    inputVoiceAudio : Storage.ExternalBlob;
    status : JobStatus;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let voiceModels = Map.empty<Text, VoiceModel>();
  let conversionJobs = Map.empty<Text, ConversionJob>();
  var jobIdCounter = 0;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func uploadNewVoiceModel(name : Text, description : Text, voiceAudio : Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload voice models");
    };

    let modelId = name.concat(caller.toText()).concat(Time.now().toText());

    let voiceModel : VoiceModel = {
      creator = caller;
      name;
      description;
      audio = voiceAudio;
      snapshotTime = Time.now();
    };

    voiceModels.add(modelId, voiceModel);
    modelId;
  };

  public shared ({ caller }) func makeVoiceConversionJob(sourceVoiceId : Text, targetVoiceId : Text, inputVoiceAudio : Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create conversion jobs");
    };

    switch (voiceModels.get(targetVoiceId)) {
      case (?model) {
        if (model.creator != caller) {
          Runtime.trap("Unauthorized: Can only use your own voice models");
        };
      };
      case (null) {
        Runtime.trap("Invalid voice ID");
      };
    };

    let jobId = targetVoiceId.concat(Nat32.fromNat(jobIdCounter).toText());

    jobIdCounter += 1;

    let conversionJob : ConversionJob = {
      creator = caller;
      sourceVoiceId;
      targetVoiceId;
      inputVoiceAudio;
      status = #processing({
        uploadTime = Time.now();
      });
    };

    conversionJobs.add(jobId, conversionJob);
    jobId;
  };

  public shared ({ caller }) func completeVoiceConversionJob(jobId : Text, outputBlob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete jobs");
    };

    switch (conversionJobs.get(jobId)) {
      case (?job) {
        if (job.creator != caller) {
          Runtime.trap("Unauthorized: Can only complete your own jobs");
        };
        let updatedJob : ConversionJob = {
          creator = job.creator;
          sourceVoiceId = job.sourceVoiceId;
          targetVoiceId = job.targetVoiceId;
          inputVoiceAudio = job.inputVoiceAudio;
          status = #completed({
            blob = outputBlob;
            processingTime = Time.now();
            uploadTime = Time.now();
          });
        };
        conversionJobs.add(jobId, updatedJob);
      };
      case (null) {
        Runtime.trap("Job not found");
      };
    };
  };

  public query ({ caller }) func getVoiceModel(modelId : Text) : async ?VoiceModel {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch voice models");
    };

    switch (voiceModels.get(modelId)) {
      case (?model) {
        if (model.creator != caller) {
          Runtime.trap("Unauthorized: Can only view your own voice models");
        };
        ?model;
      };
      case (null) {
        null;
      };
    };
  };

  public query ({ caller }) func getJob(jobId : Text) : async ?ConversionJob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch jobs");
    };

    switch (conversionJobs.get(jobId)) {
      case (?job) {
        if (job.creator != caller) {
          Runtime.trap("Unauthorized: Can only view your own jobs");
        };
        ?job;
      };
      case (null) {
        null;
      };
    };
  };

  public query ({ caller }) func getAllConversionJobs() : async [ConversionJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list jobs");
    };

    // Return only jobs created by the caller
    conversionJobs.values().toArray().filter(
      func(job) {
        job.creator == caller;
      }
    );
  };

  public query ({ caller }) func getAllVoiceModels() : async [VoiceModel] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list voice models");
    };

    // Return only voice models created by the caller
    voiceModels.values().toArray().filter(
      func(model) {
        model.creator == caller;
      }
    );
  };

  public query ({ caller }) func getOwnVoiceModelsWithIds() : async [VoiceModelWithId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list voice models");
    };

    let filteredEntries = voiceModels.entries().toArray().filter(
      func((id, model)) {
        model.creator == caller;
      }
    );

    filteredEntries.map(
      func((id, model)) {
        { id; model };
      }
    );
  };

  public shared ({ caller }) func deleteVoiceModel(id : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can delete voice models");
    };

    switch (voiceModels.get(id)) {
      case (?voiceModel) {
        if (voiceModel.creator != caller) {
          Runtime.trap("Unauthorized: Can only delete your own voice models");
        };
        voiceModels.remove(id);
        id;
      };
      case (null) {
        Runtime.trap("Voice model not found");
      };
    };
  };
};
