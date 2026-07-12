---
read_when:
    - Node terhubung tetapi alat kamera/kanvas/layar/eksekusi gagal
    - Anda perlu memahami model mental pemasangan Node dibandingkan dengan persetujuan
summary: Atasi masalah pemasangan Node, persyaratan berjalan di latar depan, izin, dan kegagalan alat
title: Pemecahan masalah Node
x-i18n:
    generated_at: "2026-07-12T14:21:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini ketika sebuah Node terlihat dalam status, tetapi alat Node gagal.

## Urutan perintah

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Kemudian jalankan pemeriksaan khusus Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Indikator kondisi sehat:

- Node terhubung dan dipasangkan untuk peran `node`.
- `nodes describe` mencantumkan kapabilitas yang Anda panggil.
- Persetujuan eksekusi menampilkan mode/daftar izin yang diharapkan.

## Persyaratan latar depan

`canvas.*`, `camera.*`, dan `screen.*` hanya dapat digunakan di latar depan pada Node iOS/Android.

Pemeriksaan dan perbaikan cepat:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jika Anda melihat `NODE_BACKGROUND_UNAVAILABLE`, tampilkan aplikasi Node di latar depan dan coba lagi.

## Matriks izin

| Kapabilitas                   | iOS                                           | Android                                               | Aplikasi Node macOS                  | Kode kegagalan umum                           |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ mikrofon untuk audio klip)          | Kamera (+ mikrofon untuk audio klip)                  | Kamera (+ mikrofon untuk audio klip) | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | Perekaman Layar (+ mikrofon opsional)         | Permintaan perekaman layar (+ mikrofon opsional)      | Perekaman Layar                     | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | tidak tersedia                                | tidak tersedia                                        | Aksesibilitas + Perekaman Layar      | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Saat Digunakan atau Selalu (bergantung mode)  | Lokasi latar depan/latar belakang berdasarkan mode    | Izin lokasi                          | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | tidak tersedia (jalur host Node)              | tidak tersedia (jalur host Node)                      | Persetujuan eksekusi diperlukan      | `SYSTEM_RUN_DENIED`                           |

## Pemasangan versus persetujuan

Tiga gerbang terpisah menentukan keberhasilan perintah Node:

1. **Pemasangan perangkat**: dapatkah Node ini terhubung ke Gateway?
2. **Kebijakan perintah Node Gateway**: apakah ID perintah RPC diizinkan oleh `gateway.nodes.allowCommands` / `denyCommands` dan pengaturan bawaan platform?
3. **Persetujuan eksekusi**: dapatkah Node ini menjalankan perintah shell tertentu secara lokal?

Pemasangan Node adalah gerbang identitas/kepercayaan, bukan sarana persetujuan per perintah. Untuk `system.run`, kebijakan per Node berada dalam berkas persetujuan eksekusi Node tersebut (`openclaw approvals get --node ...`), bukan dalam catatan pemasangan Gateway.

Pemeriksaan cepat:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Pemasangan tidak ada: setujui perangkat Node terlebih dahulu.
- `nodes describe` tidak mencantumkan perintah: periksa kebijakan perintah Node Gateway dan apakah Node benar-benar mendeklarasikan perintah tersebut saat terhubung.
- Pemasangan tidak bermasalah, tetapi `system.run` gagal: perbaiki persetujuan eksekusi/daftar izin pada Node tersebut.

Untuk eksekusi `host=node` yang memerlukan persetujuan, Gateway juga mengikat eksekusi ke `systemRunPlan` kanonis yang telah disiapkan. Jika pemanggil berikutnya mengubah perintah, direktori kerja, atau metadata sesi sebelum eksekusi yang disetujui diteruskan, Gateway akan menolak eksekusi karena ketidakcocokan persetujuan, alih-alih memercayai muatan yang telah diedit.

## Kode kesalahan Node yang umum

| Kode                                   | Arti                                                                                                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | Aplikasi berada di latar belakang; tampilkan di latar depan.                                                                                                                                                     |
| `CAMERA_DISABLED`                      | Tombol kamera dinonaktifkan dalam pengaturan Node.                                                                                                                                                               |
| `*_PERMISSION_REQUIRED`                | Izin sistem operasi tidak ada/ditolak.                                                                                                                                                                           |
| `LOCATION_DISABLED`                    | Mode lokasi dinonaktifkan.                                                                                                                                                                                       |
| `LOCATION_PERMISSION_REQUIRED`         | Mode lokasi yang diminta belum diberikan.                                                                                                                                                                        |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | Aplikasi berada di latar belakang, tetapi hanya memiliki izin Saat Digunakan.                                                                                                                                    |
| `COMPUTER_DISABLED`                    | Aktifkan **Allow Computer Control** di aplikasi macOS, lalu setujui pembaruan pemasangan.                                                                                                                         |
| `ACCESSIBILITY_REQUIRED`               | Berikan izin Accessibility kepada bundel aplikasi OpenClaw saat ini di macOS System Settings.                                                                                                                    |
| `SYSTEM_RUN_DENIED: approval required` | Permintaan eksekusi memerlukan persetujuan eksplisit.                                                                                                                                                            |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Perintah diblokir oleh mode daftar izin. Pada host Node Windows, bentuk pembungkus shell seperti `cmd.exe /c ...` dianggap tidak cocok dengan daftar izin dalam mode daftar izin, kecuali disetujui melalui alur permintaan. |

## Siklus pemulihan cepat

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jika masih mengalami kendala:

- Setujui ulang pemasangan perangkat.
- Buka kembali aplikasi Node (di latar depan).
- Berikan ulang izin sistem operasi.
- Buat ulang/sesuaikan kebijakan persetujuan eksekusi.

Untuk kontrol komputer, pastikan juga bahwa agen berkemampuan visi menyediakan alat `computer`, `screen.snapshot` berhasil dengan izin Perekaman Layar, dan `/phone status` menampilkan otorisasi Gateway sementara atau permanen yang Anda inginkan. Entri `gateway.nodes.denyCommands` selalu mengesampingkan `allowCommands`.

## Terkait

- [Ikhtisar Node](/id/nodes)
- [Node kamera](/id/nodes/camera)
- [Perintah lokasi](/id/nodes/location-command)
- [Penggunaan komputer](/id/nodes/computer-use)
- [Persetujuan eksekusi](/id/tools/exec-approvals)
- [Pemasangan Gateway](/id/gateway/pairing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Pemecahan masalah saluran](/id/channels/troubleshooting)
