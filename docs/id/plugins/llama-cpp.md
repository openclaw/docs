---
read_when:
    - Anda menginginkan inferensi teks lokal tanpa kunci API atau server model
    - Anda menginginkan embedding pencarian memori dari model GGUF lokal
    - Anda sedang mengonfigurasi memorySearch.provider = "local"
    - Anda memerlukan plugin OpenClaw yang memiliki runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Jalankan inferensi teks GGUF dan embedding memori secara lokal di OpenClaw dengan llama.cpp
title: Penyedia llama.cpp
x-i18n:
    generated_at: "2026-07-19T05:04:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8af1118ae65741519f81520e6c1c961e208e8dc2c9e1b250979c3758b8fe7c83
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` adalah plugin penyedia eksternal resmi untuk inferensi teks GGUF lokal dalam proses dan embedding. Plugin ini mendaftarkan penyedia teks `llama-cpp`, penyedia embedding `local`, dan memiliki runtime native `node-llama-cpp`.

Instal sebelum menggunakan inferensi lokal atau embedding memori lokal:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Paket npm utama `openclaw` tidak menyertakan `node-llama-cpp`. Menyimpan dependensi native dalam plugin ini mencegah pembaruan npm OpenClaw biasa menghapus runtime yang diinstal secara manual di dalam direktori paket OpenClaw.

## Inferensi teks lokal

Pilih **Model lokal (llama.cpp)** selama orientasi interaktif. OpenClaw meminta konfirmasi sebelum mengunduh model default:

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

Berkas Qwen3 4B Instruct 2507 Q4_K_M berukuran sekitar 2.5 GB. Alokasikan sekitar 3 GB RAM untuk bobot model, ditambah konteks dan beban tambahan runtime OpenClaw. Konteks default disesuaikan ukurannya secara otomatis dengan batas 8,192 token agar tetap praktis pada mesin dengan RAM 8 GB. Konfigurasikan konteks yang lebih besar hanya jika mesin memiliki memori yang cukup.

Pemeriksaan penemuan saat orientasi bersifat hanya-baca. Pemeriksaan ini menawarkan llama.cpp secara otomatis hanya ketika berkas GGUF default atau yang dikonfigurasi sudah berada dalam cache model; pemeriksaan ini tidak pernah mengunduh selama penemuan. Ollama dan LM Studio tetap menjadi pilihan layanan lokal yang terpisah dan mempertahankan alur penemuannya masing-masing. Memilih llama.cpp secara manual adalah jalur yang menampilkan permintaan untuk mengunduh model default.

Penyedia menggunakan templat percakapan yang disematkan dalam model GGUF dan pemanggilan fungsi native node-llama-cpp. Teks dialirkan token demi token. Panggilan alat dikembalikan ke OpenClaw untuk dieksekusi, bukan dijalankan di dalam node-llama-cpp.

### Menggunakan model GGUF lain

Tambahkan model ke `models.providers.llama-cpp`. Masukkan jalur lokal atau URI berkas `hf:` lengkap dalam `params.modelPath`:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

Inferensi tidak pernah mengunduh model yang tidak tersedia secara implisit. Untuk URI `hf:` khusus, unduh GGUF ke `modelCacheDir` terlebih dahulu. Penemuan menggunakan resolver cache hanya-baca milik node-llama-cpp, termasuk penamaan repositori, cabang, dan berkas terpisah.

## Konfigurasi embedding memori

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

`local.modelPath` secara default menggunakan URI `hf:` yang ditampilkan di atas (`embeddinggemma-300m-qat-Q8_0.gguf`). Arahkan ke URI `hf:` lain atau berkas `.gguf` lokal untuk menggunakan model lain. `local.modelCacheDir` mengganti lokasi penyimpanan cache model yang diunduh (default: `~/.node-llama-cpp/models`), dan `local.contextSize` menerima bilangan bulat atau `"auto"`.

Ketika `local.contextSize` berupa angka, penyedia juga memberikan persyaratan tersebut kepada penempatan lapisan GPU otomatis milik node-llama-cpp. Hal ini memungkinkan node-llama-cpp menyesuaikan model dan konteks embedding secara bersamaan sembari mempertahankan pemeriksaan keamanan memorinya. Dengan `"auto"`, node-llama-cpp mempertahankan penempatan otomatis normalnya.

## Runtime native

Gunakan Node 24 untuk jalur instalasi native yang paling lancar. Checkout sumber yang menggunakan pnpm mungkin perlu menyetujui dan membangun ulang dependensi native:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnostik runtime memori

Jalankan `openclaw memory status --deep` setelah penyedia dimuat untuk memeriksa backend dan build yang dipilih, nama perangkat, lapisan yang dialihkan ke GPU, ukuran konteks yang diminta, serta snapshot VRAM atau memori terpadu terakhir yang diamati. Nilai VRAM menyertakan stempel waktu pengamatan karena pembacaan status pasif tidak memuat ulang model atau melakukan polling pada perangkat.

Fakta terakhir yang diketahui juga dapat muncul dalam `openclaw doctor` ketika Gateway yang sedang berjalan telah menggunakan penyedia lokal. Perintah status atau doctor biasa tidak memuat model hanya untuk mengumpulkan diagnostik.

## Pemecahan masalah

Jika `node-llama-cpp` tidak tersedia atau gagal dimuat, OpenClaw melaporkan kegagalan dengan:

1. Instal plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Gunakan Node 24 untuk instalasi/pembaruan native.
3. Dari checkout sumber pnpm: `pnpm approve-builds`, lalu `pnpm rebuild node-llama-cpp`.

Untuk inferensi lokal tanpa dependensi native dalam proses, gunakan penyedia Ollama atau LM Studio sebagai gantinya. Untuk embedding lokal yang lebih mudah, atur `memorySearch.provider` ke penyedia embedding jarak jauh seperti `lmstudio`, `ollama`, `openai`, atau `voyage`.
