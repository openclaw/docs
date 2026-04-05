---
read_when:
    - Menambahkan dukungan node lokasi atau UI izin
    - Merancang izin lokasi Android atau perilaku foreground
summary: Command lokasi untuk node (`location.get`), mode izin, dan perilaku foreground Android
title: Command Lokasi
x-i18n:
    generated_at: "2026-04-05T13:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Command lokasi (node)

## TL;DR

- `location.get` adalah command node (melalui `node.invoke`).
- Nonaktif secara default.
- Pengaturan app Android menggunakan pemilih: Off / While Using.
- Toggle terpisah: Precise Location.

## Mengapa pemilih (bukan hanya sakelar)

Izin OS memiliki beberapa level. Kita dapat menampilkan pemilih di dalam app, tetapi OS tetap menentukan grant yang sebenarnya.

- iOS/macOS dapat menampilkan **While Using** atau **Always** di prompt/Pengaturan sistem.
- App Android saat ini hanya mendukung lokasi foreground.
- Lokasi presisi adalah grant terpisah (iOS 14+ “Precise”, Android “fine” vs “coarse”).

Pemilih di UI menentukan mode yang kita minta; grant yang sebenarnya berada di pengaturan OS.

## Model pengaturan

Per perangkat node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Perilaku UI:

- Memilih `whileUsing` meminta izin foreground.
- Jika OS menolak level yang diminta, kembalikan ke level tertinggi yang diberikan dan tampilkan status.

## Pemetaan izin (`node.permissions`)

Opsional. Node macOS melaporkan `location` melalui peta izin; iOS/Android dapat mengabaikannya.

## Command: `location.get`

Dipanggil melalui `node.invoke`.

Params (disarankan):

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

- `LOCATION_DISABLED`: pemilih nonaktif.
- `LOCATION_PERMISSION_REQUIRED`: izin untuk mode yang diminta tidak ada.
- `LOCATION_BACKGROUND_UNAVAILABLE`: app berada di latar belakang tetapi hanya While Using yang diizinkan.
- `LOCATION_TIMEOUT`: tidak ada fix tepat waktu.
- `LOCATION_UNAVAILABLE`: kegagalan sistem / tidak ada penyedia.

## Perilaku latar belakang

- App Android menolak `location.get` saat berada di latar belakang.
- Biarkan OpenClaw tetap terbuka saat meminta lokasi di Android.
- Platform node lain mungkin berbeda.

## Integrasi model/tooling

- Permukaan tool: tool `nodes` menambahkan action `location_get` (node wajib).
- CLI: `openclaw nodes location get --node <id>`.
- Pedoman agen: panggil hanya saat pengguna telah mengaktifkan lokasi dan memahami cakupannya.

## Teks UX (disarankan)

- Off: “Berbagi lokasi dinonaktifkan.”
- While Using: “Hanya saat OpenClaw terbuka.”
- Precise: “Gunakan lokasi GPS presisi. Nonaktifkan untuk membagikan lokasi perkiraan.”
