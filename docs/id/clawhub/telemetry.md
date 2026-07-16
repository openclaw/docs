---
read_when:
    - Mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi yang dikumpulkan oleh CLI ClawHub dan cara menonaktifkannya.
x-i18n:
    generated_at: "2026-07-16T17:59:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan telemetri CLI minimal untuk menghitung jumlah penginstalan agregat.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda telah masuk di CLI.
- Anda menjalankan `clawhub install <slug>`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda belum masuk, tidak ada yang dilaporkan.

## Data yang kami kumpulkan

Pada setiap `clawhub install` yang dilaporkan, CLI mengirimkan satu peristiwa penginstalan dengan upaya terbaik.

Peristiwa tersebut mencakup:

- `slug`: slug skill yang diinstal.
- `version`: versi yang diinstal, jika diketahui.

### Data yang _tidak_ kami kumpulkan

- Tidak ada jalur folder atau pengenal yang berasal dari folder.
- Tidak ada isi berkas.
- Tidak ada log per eksekusi, prompt, atau keluaran CLI lainnya.

## Jumlah penginstalan

ClawHub menyimpan penghitung agregat per skill:

- `installsAllTime`: pengguna unik yang telah melaporkan setidaknya satu penginstalan CLI untuk skill tersebut.
- `installsCurrent`: pengguna unik yang telah melaporkan penginstalan dan belum menghapus data
  telemetri mereka.

## Transparansi + kontrol pengguna

Semua orang hanya dapat melihat **penghitung penginstalan agregat**.

Menghapus akun Anda juga akan menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Tetapkan variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan variabel ini ditetapkan, CLI tidak akan mengirimkan telemetri penginstalan.
