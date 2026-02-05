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
export interface ModelMetadata {
    name: string;
    createdAt: Time;
    description: string;
    trainingData: Array<string>;
    format: string;
}
export interface VoiceModel {
    id: VoiceModelId;
    owner: Principal;
    metadata: ModelMetadata;
    storage: ExternalBlob;
    createdAt: Time;
}
export type Time = bigint;
export type VoiceModelId = bigint;
export interface ConversionJob {
    id: ConversionJobId;
    status: ConversionJobStatus;
    owner: Principal;
    createdAt: Time;
    updatedAt: Time;
    inputAudio: ExternalBlob;
    resultAudio?: ExternalBlob;
    modelId: VoiceModelId;
}
export type ConversionJobId = bigint;
export enum ConversionJobStatus {
    pending = "pending",
    complete = "complete",
    processing = "processing",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createConversionJob(modelId: VoiceModelId, inputAudio: ExternalBlob): Promise<ConversionJobId>;
    deleteVoiceModel(modelId: VoiceModelId): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getConversionJob(jobId: ConversionJobId): Promise<ConversionJob | null>;
    getConversionJobsByOwner(): Promise<Array<ConversionJob>>;
    getVoiceModel(modelId: VoiceModelId): Promise<VoiceModel | null>;
    getVoiceModelsByOwner(): Promise<Array<VoiceModel>>;
    isCallerAdmin(): Promise<boolean>;
    processConversionJob(jobId: ConversionJobId): Promise<void>;
    uploadVoiceModel(metadata: ModelMetadata, file: ExternalBlob): Promise<VoiceModelId>;
}
