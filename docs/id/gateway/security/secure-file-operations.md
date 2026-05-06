---
read_when:
    - Mengubah akses berkas, ekstraksi arsip, penyimpanan ruang kerja, atau helper sistem berkas Plugin
summary: Cara OpenClaw menangani akses file lokal dengan aman, dan mengapa pembantu Python fs-safe opsional dinonaktifkan secara default
title: Operasi file yang aman
x-i18n:
    generated_at: "2026-05-06T09:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw menggunakan [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) untuk operasi file lokal yang sensitif terhadap keamanan: baca/tulis yang dibatasi root, penggantian atomik, ekstraksi arsip, workspace sementara, status JSON, dan penanganan file rahasia.

Tujuannya adalah **pagar pembatas pustaka** yang konsisten untuk kode OpenClaw tepercaya yang menerima nama jalur tidak tepercaya. Ini bukan sandbox. Izin filesystem host, pengguna OS, kontainer, dan kebijakan agen/alat tetap menentukan radius dampak yang sebenarnya.

## Default: tanpa helper Python

OpenClaw menonaktifkan helper Python POSIX fs-safe secara **default**.

Alasannya:

- Gateway tidak boleh menjalankan sidecar Python persisten kecuali operator memilih untuk mengaktifkannya;
- banyak instalasi tidak membutuhkan pengerasan tambahan untuk mutasi direktori induk;
- menonaktifkan Python membuat perilaku paket/runtime lebih mudah diprediksi di lingkungan desktop, Docker, CI, dan aplikasi terbundel.

OpenClaw hanya mengubah default. Jika Anda menetapkan mode secara eksplisit, fs-safe akan menghormatinya:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Nama fs-safe generik juga berfungsi: `FS_SAFE_PYTHON_MODE` dan `FS_SAFE_PYTHON`.

## Yang tetap terlindungi tanpa Python

Dengan helper dinonaktifkan, OpenClaw tetap menggunakan jalur Node dari fs-safe untuk:

- menolak escape jalur relatif seperti `..`, jalur absolut, dan pemisah jalur di tempat yang hanya mengizinkan nama;
- menyelesaikan operasi melalui handle root tepercaya, bukan pemeriksaan ad hoc `path.resolve(...).startsWith(...)`;
- menolak pola symlink dan hardlink pada API yang mewajibkan kebijakan tersebut;
- membuka file dengan pemeriksaan identitas ketika API mengembalikan atau memakai isi file;
- penulisan atomik ke temp saudara untuk file status/konfigurasi;
- batas byte untuk pembacaan dan ekstraksi arsip;
- mode privat untuk file rahasia dan status saat API mewajibkannya.

Perlindungan ini mencakup model ancaman OpenClaw normal: kode Gateway tepercaya yang menangani input jalur model/Plugin/saluran tidak tepercaya di dalam satu batas operator tepercaya.

## Yang ditambahkan Python

Pada POSIX, helper opsional fs-safe mempertahankan satu proses Python persisten dan menggunakan operasi filesystem relatif-fd untuk mutasi direktori induk seperti rename, remove, mkdir, stat/list, dan beberapa jalur tulis.

Ini mempersempit jendela race dengan UID yang sama, ketika proses lain dapat menukar direktori induk di antara validasi dan mutasi. Ini adalah defense in depth untuk host tempat proses lokal tidak tepercaya dapat memodifikasi direktori yang sama dengan yang sedang dioperasikan OpenClaw.

Jika deployment Anda memiliki risiko tersebut dan Python dijamin tersedia, gunakan:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Gunakan `require`, bukan `auto`, ketika helper merupakan bagian dari postur keamanan Anda; `auto` sengaja kembali ke perilaku khusus Node jika helper tidak tersedia.

## Panduan Plugin dan inti

- Akses file yang berhadapan dengan Plugin harus melalui helper `openclaw/plugin-sdk/*`, bukan `fs` mentah, ketika jalur berasal dari pesan, output model, konfigurasi, atau input Plugin.
- Kode inti harus menggunakan wrapper fs-safe lokal di bawah `src/infra/*` agar kebijakan proses OpenClaw diterapkan secara konsisten.
- Ekstraksi arsip harus menggunakan helper arsip fs-safe dengan batas ukuran, jumlah entri, tautan, dan tujuan yang eksplisit.
- Rahasia harus menggunakan helper rahasia OpenClaw atau helper rahasia/status-privat fs-safe; jangan membuat sendiri pemeriksaan mode di sekitar `fs.writeFile`.
- Jika Anda membutuhkan isolasi pengguna lokal yang bermusuhan, jangan mengandalkan fs-safe saja. Jalankan Gateway terpisah di bawah pengguna/host OS yang terpisah atau gunakan sandboxing.

Terkait: [Keamanan](/id/gateway/security), [Sandboxing](/id/gateway/sandboxing), [Persetujuan exec](/id/tools/exec-approvals), [Rahasia](/id/gateway/secrets).
