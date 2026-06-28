---
read_when:
    - Menambahkan dukungan node lokasi atau UI izin
    - Merancang izin lokasi Android atau perilaku latar depan
summary: Perintah lokasi untuk Node (location.get), mode izin, dan perilaku latar depan Android
title: Perintah lokasi
x-i18n:
    generated_at: "2026-05-06T09:19:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Ringkasan

- `location.get` adalah perintah node (melalui `node.invoke`).
- Nonaktif secara default.
- Pengaturan aplikasi Android menggunakan pemilih: Nonaktif / Saat Digunakan.
- Toggle terpisah: Lokasi Tepat.

## Mengapa pemilih (bukan sekadar switch)

Izin OS bertingkat. Kita dapat mengekspos pemilih dalam aplikasi, tetapi OS tetap menentukan pemberian izin yang sebenarnya.

- iOS/macOS dapat menampilkan **Saat Digunakan** atau **Selalu** di prompt/Pengaturan sistem.
- Aplikasi Android saat ini hanya mendukung lokasi foreground.
- Lokasi tepat adalah izin terpisah (iOS 14+ "Precise", Android "fine" vs "coarse").

Pemilih di UI mengarahkan mode yang kita minta; pemberian izin sebenarnya berada di pengaturan OS.

## Model pengaturan

Per perangkat node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Perilaku UI:

- Memilih `whileUsing` meminta izin foreground.
- Jika OS menolak tingkat yang diminta, kembalikan ke tingkat tertinggi yang diberikan dan tampilkan status.

## Pemetaan izin (node.permissions)

Opsional. Node macOS melaporkan `location` melalui peta izin; iOS/Android dapat menghilangkannya.

## Perintah: `location.get`

Dipanggil melalui `node.invoke`.

Parameter (disarankan):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload respons:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Kesalahan (kode stabil):

- `LOCATION_DISABLED`: pemilih nonaktif.
- `LOCATION_PERMISSION_REQUIRED`: izin tidak ada untuk mode yang diminta.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikasi berjalan di latar belakang tetapi hanya Saat Digunakan yang diizinkan.
- `LOCATION_TIMEOUT`: tidak ada fix tepat waktu.
- `LOCATION_UNAVAILABLE`: kegagalan sistem / tidak ada penyedia.

## Perilaku latar belakang

- Aplikasi Android menolak `location.get` saat berjalan di latar belakang.
- Biarkan OpenClaw tetap terbuka saat meminta lokasi di Android.
- Platform node lain mungkin berbeda.

## Integrasi model/tooling

- Permukaan tool: tool `nodes` menambahkan tindakan `location_get` (node wajib).
- CLI: `openclaw nodes location get --node <id>`.
- Panduan agen: hanya panggil saat pengguna mengaktifkan lokasi dan memahami cakupannya.

## Salinan UX (disarankan)

- Nonaktif: "Berbagi lokasi dinonaktifkan."
- Saat Digunakan: "Hanya saat OpenClaw terbuka."
- Tepat: "Gunakan lokasi GPS yang tepat. Matikan toggle untuk membagikan lokasi perkiraan."

## Terkait

- [Penguraian lokasi channel](/id/channels/location)
- [Pengambilan kamera](/id/nodes/camera)
- [Mode bicara](/id/nodes/talk)
