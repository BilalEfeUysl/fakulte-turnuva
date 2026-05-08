import { invoke } from "@tauri-apps/api/core";

export type BackupBundle = {
  version: number;
  exported_at: string;
  [k: string]: unknown;
};

export function exportData(): Promise<BackupBundle> {
  return invoke<BackupBundle>("export_data");
}

export function importData(payload: BackupBundle): Promise<void> {
  return invoke<void>("import_data", { payload });
}
