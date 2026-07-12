---
read_when:
    - Mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi yang dikumpulkan oleh CLI ClawHub dan cara menonaktifkannya.
x-i18n:
    generated_at: "2026-07-12T14:04:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan telemetri CLI minimal untuk menghitung jumlah instalasi agregat.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda masuk di CLI.
- Anda menjalankan `clawhub install <slug>`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda tidak masuk, tidak ada yang dilaporkan.

## Data yang kami kumpulkan

Pada setiap `clawhub install` yang dilaporkan, CLI mengirimkan satu peristiwa instalasi berbasis upaya terbaik.

Peristiwa tersebut mencakup:

- `slug`: slug Skills yang diinstal.
- `version`: versi yang diinstal, jika diketahui.

### Data yang _tidak_ kami kumpulkan

- Tidak ada jalur folder atau pengidentifikasi yang berasal dari folder.
- Tidak ada isi berkas.
- Tidak ada log per eksekusi, prompt, atau keluaran CLI lainnya.

## Jumlah instalasi

ClawHub mengelola penghitung agregat per Skills:

- `installsAllTime`: pengguna unik yang telah melaporkan setidaknya satu instalasi CLI untuk Skills tersebut.
- `installsCurrent`: pengguna unik yang telah melaporkan instalasi dan belum menghapus
  telemetri mereka.

## Transparansi + kontrol pengguna

Semua orang hanya dapat melihat **penghitung instalasi agregat**.

Menghapus akun Anda juga akan menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Atur variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Jika variabel ini diatur, CLI tidak akan mengirimkan telemetri instalasi.
