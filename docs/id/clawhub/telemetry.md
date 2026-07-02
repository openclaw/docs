---
read_when:
    - Sedang mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi yang dikumpulkan oleh CLI ClawHub dan cara memilih keluar.
x-i18n:
    generated_at: "2026-07-02T08:51:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan telemetri CLI minimal untuk menghitung jumlah pemasangan agregat.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda masuk di CLI.
- Anda menjalankan `clawhub install <slug>`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda tidak masuk, tidak ada yang dilaporkan.

## Apa yang kami kumpulkan

Pada setiap `clawhub install` yang dilaporkan, CLI mengirim satu peristiwa pemasangan upaya-terbaik.

Peristiwa tersebut mencakup:

- `slug`: slug skill yang dipasang.
- `version`: versi yang dipasang, jika diketahui.

### Apa yang _tidak_ kami kumpulkan

- Tidak ada jalur folder atau pengenal yang berasal dari folder.
- Tidak ada isi file.
- Tidak ada log per eksekusi, prompt, atau keluaran CLI lainnya.

## Jumlah pemasangan

ClawHub mempertahankan penghitung agregat per skill:

- `installsAllTime`: pengguna unik yang telah melaporkan setidaknya satu pemasangan CLI untuk skill tersebut.
- `installsCurrent`: pengguna unik yang telah melaporkan pemasangan dan belum menghapus
  telemetri mereka.

## Transparansi + kontrol pengguna

Semua orang hanya melihat **penghitung pemasangan agregat**.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Tetapkan variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan ini ditetapkan, CLI tidak akan mengirim telemetri pemasangan.
