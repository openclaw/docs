---
read_when:
    - Anda ingin embedding pencarian memori dari model GGUF lokal
    - Anda sedang mengonfigurasi memorySearch.provider = "local"
    - Anda memerlukan plugin OpenClaw yang memiliki runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instal penyedia resmi llama.cpp untuk embedding memori GGUF lokal
title: Penyedia llama.cpp
x-i18n:
    generated_at: "2026-07-12T14:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` adalah plugin penyedia eksternal resmi untuk embedding GGUF
lokal. Plugin ini mendaftarkan ID penyedia embedding `local` dan memiliki
dependensi runtime `node-llama-cpp` yang digunakan oleh `memorySearch.provider: "local"`.

Instal sebelum menggunakan embedding memori lokal:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Paket npm utama `openclaw` tidak menyertakan `node-llama-cpp`. Menempatkan
dependensi native di dalam plugin ini mencegah pembaruan npm OpenClaw biasa
menghapus runtime yang diinstal secara manual di dalam direktori paket OpenClaw.

## Konfigurasi

Atur `memorySearch.provider` ke `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

Nilai bawaan `local.modelPath` adalah URI `hf:` yang ditampilkan di atas (`embeddinggemma-300m-qat-Q8_0.gguf`).
Arahkan ke URI `hf:` lain atau berkas `.gguf` lokal untuk menggunakan model
lain. `local.modelCacheDir` mengganti lokasi penyimpanan cache model yang diunduh
(nilai bawaan: `~/.node-llama-cpp/models`), dan `local.contextSize` menerima
bilangan bulat atau `"auto"`.

Saat `local.contextSize` berupa angka, penyedia juga memberikan persyaratan tersebut
kepada penempatan lapisan GPU otomatis milik node-llama-cpp. Hal ini memungkinkan node-llama-cpp menempatkan
model dan konteks embedding secara bersamaan sambil tetap mempertahankan pemeriksaan
keamanan memorinya. Dengan `"auto"`, node-llama-cpp mempertahankan penempatan otomatis normalnya.

## Runtime Native

Gunakan Node 24 untuk jalur instalasi native yang paling lancar. Checkout sumber yang menggunakan
pnpm mungkin perlu menyetujui dan membangun ulang dependensi native:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnostik runtime

Jalankan `openclaw memory status --deep` setelah penyedia dimuat untuk memeriksa
backend dan build yang dipilih, nama perangkat, lapisan yang dialihkan ke GPU, ukuran
konteks yang diminta, serta cuplikan VRAM atau memori terpadu yang terakhir diamati. Nilai VRAM
menyertakan stempel waktu pengamatan karena pembacaan status pasif tidak
memuat ulang model atau melakukan polling pada perangkat.

Fakta terakhir yang diketahui tersebut juga dapat muncul di `openclaw doctor` ketika
Gateway yang sedang berjalan telah menggunakan penyedia lokal. Perintah status atau doctor biasa
tidak memuat model hanya untuk mengumpulkan diagnostik.

## Pemecahan masalah

Jika `node-llama-cpp` tidak tersedia atau gagal dimuat, OpenClaw melaporkan kegagalan
beserta langkah-langkah berikut:

1. Instal plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Gunakan Node 24 untuk instalasi/pembaruan native.
3. Dari checkout sumber pnpm: `pnpm approve-builds`, lalu `pnpm rebuild node-llama-cpp`.

Untuk embedding lokal yang lebih mudah tanpa langkah build native, atur
`memorySearch.provider` ke penyedia embedding jarak jauh seperti `lmstudio`,
`ollama`, `openai`, atau `voyage`.
