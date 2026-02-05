import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type JobStatus = {
    __kind__: "completed";
    completed: {
        blob: ExternalBlob;
        processingTime: Time;
        uploadTime: Time;
    };
} | {
    __kind__: "processing";
    processing: {
        uploadTime: Time;
    };
};
export interface VoiceModel {
    snapshotTime: Time;
    creator: Principal;
    audio: ExternalBlob;
    name: string;
    description: string;
}
export type Time = bigint;
export interface VoiceModelWithId {
    id: string;
    model: VoiceModel;
}
export interface ConversionJob {
    status: JobStatus;
    creator: Principal;
    inputVoiceAudio: ExternalBlob;
    targetVoiceId: string;
    sourceVoiceId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteVoiceModel(id: string): Promise<string>;
    getAllConversionJobs(): Promise<Array<ConversionJob>>;
    getAllVoiceModels(): Promise<Array<VoiceModel>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getJob(jobId: string): Promise<ConversionJob | null>;
    getOwnVoiceModelsWithIds(): Promise<Array<VoiceModelWithId>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVoiceModel(modelId: string): Promise<VoiceModel | null>;
    isCallerAdmin(): Promise<boolean>;
    makeVoiceConversionJob(sourceVoiceId: string, targetVoiceId: string, inputVoiceAudio: ExternalBlob): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadNewVoiceModel(name: string, description: string, voiceAudio: ExternalBlob): Promise<string>;
}
