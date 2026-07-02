---
read_when:
    - Sedang mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri pemasangan yang dikumpulkan oleh CLI ClawHub dan cara untuk tidak ikut serta.
x-i18n:
    generated_at: "2026-07-02T17:47:38Z"
    model: gpt-5.5
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

Jika Anda belum masuk, tidak ada yang dilaporkan.

## Yang kami kumpulkan

Pada setiap `clawhub install` yang dilaporkan, CLI mengirim satu peristiwa instalasi dengan upaya terbaik.

Peristiwa tersebut mencakup:

- `slug`: slug skill yang diinstal.
- `version`: versi yang diinstal, jika diketahui.

### Yang _tidak_ kami kumpulkan

- Tidak ada jalur folder atau pengenal yang berasal dari folder.
- Tidak ada isi file.
- Tidak ada log per eksekusi, prompt, atau keluaran CLI lainnya.

## Jumlah instalasi

ClawHub menyimpan penghitung agregat per skill:

- `installsAllTime`: pengguna unik yang telah melaporkan setidaknya satu instalasi CLI untuk skill tersebut.
- `installsCurrent`: pengguna unik yang telah melaporkan instalasi dan belum menghapus
  telemetri mereka.

## Transparansi + kontrol pengguna

Semua orang hanya melihat **penghitung instalasi agregat**.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Tetapkan variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan pengaturan ini, CLI tidak akan mengirim telemetri instalasi.
