---
read_when:
    - Menambahkan dukungan Node lokasi atau UI izin
    - Merancang izin lokasi Android atau perilaku latar depan
summary: Perintah lokasi untuk Node (location.get), mode izin, dan perilaku latar depan Android
title: Perintah lokasi
x-i18n:
    generated_at: "2026-07-12T14:20:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Ringkasan

- `location.get` adalah perintah node yang dipanggil melalui `node.invoke` atau `openclaw nodes location get`.
- Dinonaktifkan secara default.
- Build Android pihak ketiga menggunakan pemilih: Nonaktif / Saat Digunakan / Selalu. Build Play tetap menggunakan Nonaktif / Saat Digunakan.
- Lokasi Akurat merupakan pengalih terpisah.

## Mengapa menggunakan pemilih (bukan sekadar pengalih)

Izin lokasi OS memiliki beberapa tingkat. Lokasi akurat juga merupakan izin OS yang terpisah (iOS 14+ "Precise", Android "fine" dibandingkan dengan "coarse"). Pemilih dalam aplikasi menentukan mode yang diminta, tetapi OS tetap menentukan izin yang benar-benar diberikan.

## Model pengaturan

Per perangkat node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Perilaku UI:

- Memilih `whileUsing` akan meminta izin latar depan.
- Memilih `always` dalam build Android pihak ketiga akan terlebih dahulu meminta izin latar depan, menjelaskan akses latar belakang, lalu membuka pengaturan aplikasi Android untuk izin **Allow all the time** yang terpisah.
- Build Android Play tidak mendeklarasikan izin lokasi latar belakang atau menampilkan `always`.
- Jika OS menolak tingkat yang diminta, aplikasi kembali ke tingkat tertinggi yang diberikan dan menampilkan status.

## Pemetaan izin (node.permissions)

Opsional. Node macOS melaporkan `location` melalui peta `permissions` pada `node.list`/`node.describe`; iOS/Android dapat menghilangkannya.

## Perintah: `location.get`

Dipanggil melalui `node.invoke`, atau pembantu CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parameter:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Flag CLI dipetakan secara langsung: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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

- `LOCATION_DISABLED`: pemilih dinonaktifkan.
- `LOCATION_PERMISSION_REQUIRED`: izin untuk mode yang diminta belum diberikan.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikasi berada di latar belakang, tetapi hanya izin Saat Digunakan yang diberikan.
- `LOCATION_TIMEOUT`: lokasi tidak diperoleh tepat waktu.
- `LOCATION_UNAVAILABLE`: kegagalan sistem atau tidak ada penyedia.

## Perilaku latar belakang

- Build Android pihak ketiga menerima `location.get` di latar belakang hanya jika pengguna memilih `Always` dan Android memberikan izin lokasi latar belakang. Layanan node persisten yang sudah ada menambahkan jenis layanan `location` dan menampilkan `Location: Always` saat aktif.
- Build Android Play dan mode `While Using` menolak `location.get` saat berada di latar belakang.
- Platform node lainnya mungkin berbeda.

## Integrasi model/peralatan

- Alat agen: tindakan `location_get` milik alat `nodes` (node wajib ditentukan).
- CLI: `openclaw nodes location get --node <id>`.
- Panduan agen: hanya panggil jika pengguna telah mengaktifkan lokasi dan memahami cakupannya.

## Teks UX (disarankan)

- Nonaktif: "Berbagi lokasi dinonaktifkan."
- Saat Digunakan: "Hanya saat OpenClaw terbuka."
- Selalu: "Izinkan pemeriksaan lokasi yang diminta saat OpenClaw berada di latar belakang."
- Akurat: "Gunakan lokasi GPS yang akurat. Nonaktifkan untuk membagikan perkiraan lokasi."

## Terkait

- [Ikhtisar node](/id/nodes)
- [Penguraian lokasi saluran](/id/channels/location)
- [Pengambilan gambar kamera](/id/nodes/camera)
- [Mode bicara](/id/nodes/talk)
