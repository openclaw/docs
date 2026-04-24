---
read_when:
    - Menambahkan dukungan node lokasi atau UI izin
    - Merancang izin lokasi Android atau perilaku foreground
summary: Perintah lokasi untuk node (location.get), mode izin, dan perilaku foreground Android
title: Perintah lokasi
x-i18n:
    generated_at: "2026-04-24T09:15:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## TL;DR

- `location.get` adalah perintah node (melalui `node.invoke`).
- Nonaktif secara default.
- Pengaturan aplikasi Android menggunakan selector: Off / While Using.
- Toggle terpisah: Precise Location.

## Mengapa selector (bukan hanya sakelar)

Izin OS bersifat multi-level. Kita dapat menampilkan selector di aplikasi, tetapi OS tetap menentukan izin aktual.

- iOS/macOS dapat menampilkan **While Using** atau **Always** di prompt/Settings sistem.
- Aplikasi Android saat ini hanya mendukung lokasi foreground.
- Precise location adalah izin terpisah (iOS 14+ “Precise”, Android “fine” vs “coarse”).

Selector di UI mengarahkan mode yang kita minta; grant aktual berada di pengaturan OS.

## Model pengaturan

Per perangkat node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Perilaku UI:

- Memilih `whileUsing` meminta izin foreground.
- Jika OS menolak level yang diminta, kembalikan ke level tertinggi yang diberikan dan tampilkan status.

## Pemetaan izin (`node.permissions`)

Opsional. Node macOS melaporkan `location` melalui peta izin; iOS/Android dapat menghilangkannya.

## Perintah: `location.get`

Dipanggil melalui `node.invoke`.

Param (disarankan):

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

Error (kode stabil):

- `LOCATION_DISABLED`: selector nonaktif.
- `LOCATION_PERMISSION_REQUIRED`: izin untuk mode yang diminta tidak ada.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikasi berada di latar belakang tetapi hanya While Using yang diizinkan.
- `LOCATION_TIMEOUT`: tidak mendapat fix tepat waktu.
- `LOCATION_UNAVAILABLE`: kegagalan sistem / tidak ada provider.

## Perilaku latar belakang

- Aplikasi Android menolak `location.get` saat berada di latar belakang.
- Biarkan OpenClaw tetap terbuka saat meminta lokasi di Android.
- Platform node lain dapat berbeda.

## Integrasi model/tooling

- Permukaan tool: tool `nodes` menambahkan aksi `location_get` (memerlukan node).
- CLI: `openclaw nodes location get --node <id>`.
- Pedoman agen: hanya panggil ketika pengguna mengaktifkan lokasi dan memahami cakupannya.

## Copy UX (disarankan)

- Off: “Berbagi lokasi dinonaktifkan.”
- While Using: “Hanya saat OpenClaw terbuka.”
- Precise: “Gunakan lokasi GPS presisi. Nonaktifkan untuk membagikan lokasi perkiraan.”

## Terkait

- [Parsing lokasi kanal](/id/channels/location)
- [Pengambilan gambar kamera](/id/nodes/camera)
- [Talk mode](/id/nodes/talk)
