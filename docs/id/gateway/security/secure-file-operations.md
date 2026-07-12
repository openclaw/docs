---
read_when:
    - Mengubah akses file, ekstraksi arsip, penyimpanan ruang kerja, atau pembantu sistem file Plugin
summary: Cara OpenClaw menangani akses berkas lokal dengan aman, dan alasan pembantu Python fs-safe opsional dinonaktifkan secara bawaan
title: Operasi file yang aman
x-i18n:
    generated_at: "2026-07-12T14:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw menggunakan [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) untuk operasi berkas lokal yang sensitif terhadap keamanan: pembacaan/penulisan yang dibatasi pada direktori akar, penggantian atomik, ekstraksi arsip, ruang kerja sementara, status JSON, dan penanganan berkas rahasia.

Ini adalah **pagar pengaman pustaka** untuk kode OpenClaw tepercaya yang menerima nama jalur tidak tepercaya, bukan sandbox. Izin sistem berkas host, pengguna OS, kontainer, serta kebijakan agen/alat tetap menentukan cakupan dampak yang sebenarnya.

## Bawaan: tanpa pembantu Python

OpenClaw menetapkan pembantu Python POSIX fs-safe ke **nonaktif** secara bawaan:

- Gateway tidak boleh memulai proses pendamping Python persisten kecuali operator mengaktifkannya;
- sebagian besar instalasi tidak memerlukan pengerasan tambahan terhadap perubahan direktori induk;
- menonaktifkan Python menjaga perilaku runtime tetap dapat diprediksi di lingkungan desktop, Docker, CI, dan aplikasi terbundel.

OpenClaw hanya mengubah nilai _bawaan_. Pengaturan eksplisit selalu diutamakan:

```bash
# Perilaku bawaan OpenClaw: mekanisme alternatif fs-safe khusus Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Aktifkan pembantu jika tersedia, dengan mekanisme alternatif jika tidak tersedia.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Gagalkan secara tertutup jika pembantu tidak dapat dimulai.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Jalur eksplisit opsional untuk interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Nama variabel lingkungan generik fs-safe juga dapat digunakan: `FS_SAFE_PYTHON_MODE` dan `FS_SAFE_PYTHON`.

Gunakan `require` (bukan `auto`) ketika pembantu merupakan bagian dari postur keamanan Anda; `auto` secara diam-diam beralih ke perilaku khusus Node jika pembantu tidak dapat dimulai.

## Perlindungan yang tetap tersedia tanpa Python

Dengan pembantu dinonaktifkan, OpenClaw tetap memperoleh pagar pengaman khusus Node dari fs-safe:

- menolak pelolosan jalur relatif (`..`), jalur absolut, dan pemisah jalur ketika hanya nama sederhana yang diizinkan;
- menyelesaikan operasi melalui handel direktori akar tepercaya, bukan pemeriksaan ad hoc `path.resolve(...).startsWith(...)`;
- menolak pola tautan simbolis dan tautan keras pada API yang mensyaratkan kebijakan tersebut;
- membuka berkas dengan pemeriksaan identitas ketika API mengembalikan atau menggunakan isi berkas;
- menulis berkas status/konfigurasi melalui berkas sementara saudara + penggantian nama secara atomik;
- memberlakukan batas byte untuk pembacaan dan ekstraksi arsip;
- menerapkan mode berkas privat untuk rahasia dan berkas status ketika diwajibkan oleh API.

Hal ini mencakup model ancaman normal OpenClaw: kode Gateway tepercaya yang menangani masukan jalur tidak tepercaya dari model/Plugin/kanal dalam satu batas operator tepercaya.

## Perlindungan tambahan dari Python

Pada POSIX, pembantu opsional mempertahankan satu proses Python persisten dan menggunakan operasi sistem berkas relatif terhadap deskriptor berkas untuk perubahan direktori induk: penggantian nama, penghapusan, pembuatan direktori, pemeriksaan status/daftar, dan beberapa jalur penulisan.

Hal ini mempersempit celah kondisi balapan dengan UID yang sama ketika proses lain menukar direktori induk di antara validasi dan perubahan—pertahanan berlapis pada host tempat proses lokal tidak tepercaya dapat mengubah direktori yang sama dengan yang digunakan OpenClaw.

Jika penerapan Anda memiliki risiko tersebut dan Python dijamin tersedia, tetapkan:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Panduan untuk Plugin dan inti

- Akses berkas yang menghadap Plugin harus melalui pembantu `openclaw/plugin-sdk/*`, bukan `fs` mentah, ketika jalur berasal dari pesan, keluaran model, konfigurasi, atau masukan Plugin.
- Kode inti harus menggunakan pembungkus fs-safe di bawah `src/infra/*` agar kebijakan proses OpenClaw diterapkan secara konsisten.
- Ekstraksi arsip harus menggunakan pembantu arsip fs-safe dengan batas eksplisit untuk ukuran, jumlah entri, tautan, dan tujuan.
- Rahasia harus menggunakan pembantu rahasia OpenClaw atau pembantu rahasia/status privat fs-safe; jangan membuat sendiri pemeriksaan mode di sekitar `fs.writeFile`.
- Untuk isolasi dari pengguna lokal berbahaya, jangan hanya mengandalkan fs-safe. Jalankan Gateway terpisah dengan pengguna OS/host terpisah, atau gunakan sandboxing.

Terkait: [Keamanan](/id/gateway/security), [Sandboxing](/id/gateway/sandboxing), [Persetujuan eksekusi](/id/tools/exec-approvals), [Rahasia](/id/gateway/secrets).
