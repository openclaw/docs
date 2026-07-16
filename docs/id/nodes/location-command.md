---
read_when:
    - Menambahkan dukungan Node lokasi atau UI izin
    - Merancang izin lokasi Android atau perilaku latar depan
summary: Perintah lokasi untuk Node, mode izin platform, dan penyiapan GeoClue di Linux
title: Perintah lokasi
x-i18n:
    generated_at: "2026-07-16T18:12:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` adalah perintah node, yang dipanggil melalui `node.invoke` atau `openclaw nodes location get`.
- Nonaktif secara default.
- Build Android pihak ketiga menggunakan pemilih: Nonaktif / Saat Digunakan / Selalu. Build Play tetap menggunakan Nonaktif / Saat Digunakan.
- Lokasi Presisi adalah tombol alih terpisah.

## Mengapa menggunakan pemilih (bukan sekadar tombol alih)

Izin lokasi OS memiliki beberapa tingkat. Lokasi presisi juga merupakan izin OS terpisah (iOS 14+ "Precise", Android "fine" vs "coarse"). Pemilih dalam aplikasi menentukan mode yang diminta, tetapi OS tetap menentukan izin yang sebenarnya diberikan.

## Model pengaturan

Per perangkat node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Perilaku UI:

- Memilih `whileUsing` akan meminta izin latar depan.
- Memilih `always` dalam build Android pihak ketiga akan terlebih dahulu meminta izin latar depan, menjelaskan akses latar belakang, lalu membuka pengaturan aplikasi Android untuk memberikan izin **Allow all the time** secara terpisah.
- Build Android Play tidak mendeklarasikan izin lokasi latar belakang atau menampilkan `always`.
- Jika OS menolak tingkat yang diminta, aplikasi kembali ke tingkat tertinggi yang telah diberikan dan menampilkan status.

## Pemetaan izin (node.permissions)

Opsional. Node macOS melaporkan `location` melalui peta `permissions` pada `node.list`/`node.describe`; iOS/Android mungkin tidak menyertakannya.

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
- `LOCATION_PERMISSION_REQUIRED`: izin untuk mode yang diminta tidak tersedia.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikasi berada di latar belakang, tetapi hanya izin Saat Digunakan yang diberikan.
- `LOCATION_TIMEOUT`: lokasi tidak ditemukan tepat waktu.
- `LOCATION_UNAVAILABLE`: kegagalan sistem atau tidak ada penyedia.

## Perilaku latar belakang

- Build Android pihak ketiga menerima `location.get` di latar belakang hanya ketika pengguna memilih `Always` dan Android memberikan izin lokasi latar belakang. Layanan node persisten yang ada menambahkan jenis layanan `location` dan menampilkan `Location: Always` saat aktif.
- Build Android Play dan mode `While Using` menolak `location.get` saat berada di latar belakang.
- Platform node lainnya mungkin memiliki perilaku berbeda.

## Host node Linux

Plugin Node Linux bawaan menambahkan `location.get` ke layanan CLI `openclaw node`, termasuk host headless tanpa aplikasi desktop Linux. Lokasi dinonaktifkan secara default. Aktifkan di entri plugin, lalu mulai ulang layanan node:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Instal GeoClue2 dan demo `where-am-i` miliknya (`geoclue-2-demo` pada Debian dan Ubuntu). Pengguna layanan node harus diizinkan oleh kebijakan GeoClue dan agen otorisasi milik host.

Plugin menggunakan `where-am-i`, bukan serangkaian panggilan `busctl`. GeoClue mengaitkan pembuatan klien, properti, pemulaian, pembaruan, dan penghentian dengan satu koneksi klien D-Bus; demo mempertahankan seluruh siklus hidup tersebut bersama-sama, sedangkan subproses `busctl` yang terpisah tidak. Tidak ada dependensi npm yang ditambahkan.

Linux memetakan `coarse`, `balanced`, dan `precise` ke tingkat akurasi GeoClue `4`, `6`, dan `8`. Sistem memvalidasi `maxAgeMs` terhadap stempel waktu yang dikembalikan. Demo GeoClue tidak mengekspos penyedia yang dipilih, sehingga `source` adalah `unknown`; `isPrecise` bernilai true hanya ketika akurasi yang dilaporkan adalah 100 meter atau lebih baik.

Linux menggunakan kesalahan stabil yang sama: `LOCATION_DISABLED`, `LOCATION_TIMEOUT`, dan `LOCATION_UNAVAILABLE`.

## Integrasi model/peralatan

- Alat agen: tindakan `location_get` dari alat `nodes` (node diperlukan).
- CLI: `openclaw nodes location get --node <id>`.
- Pedoman agen: hanya panggil ketika pengguna telah mengaktifkan lokasi dan memahami cakupannya.

## Teks UX (disarankan)

- Nonaktif: "Berbagi lokasi dinonaktifkan."
- Saat Digunakan: "Hanya saat OpenClaw terbuka."
- Selalu: "Izinkan pemeriksaan lokasi yang diminta saat OpenClaw berada di latar belakang."
- Presisi: "Gunakan lokasi GPS presisi. Nonaktifkan untuk membagikan perkiraan lokasi."

## Terkait

- [Ringkasan node](/id/nodes)
- [Penguraian lokasi kanal](/id/channels/location)
- [Pengambilan gambar kamera](/id/nodes/camera)
- [Mode bicara](/id/nodes/talk)
