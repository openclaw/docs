---
read_when:
    - Anda ingin OpenClaw memulai server model lokal hanya saat modelnya dipilih
    - Anda menjalankan ds4, inferrs, vLLM, llama.cpp, MLX, atau server lokal lain yang kompatibel dengan OpenAI
    - Anda perlu mengontrol mulai dingin, kesiapan, dan penghentian saat menganggur untuk penyedia lokal
summary: Mulai server model lokal sesuai permintaan sebelum permintaan model OpenClaw
title: Layanan model lokal
x-i18n:
    generated_at: "2026-06-27T17:30:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` memungkinkan OpenClaw memulai server model lokal
milik provider sesuai kebutuhan. Ini adalah konfigurasi tingkat provider: ketika model
yang dipilih milik provider tersebut, OpenClaw memeriksa layanan, memulai proses jika
endpoint tidak aktif, menunggu kesiapan, lalu mengirim permintaan model.

Gunakan ini untuk server lokal yang mahal jika dibiarkan berjalan sepanjang hari, atau untuk
penyiapan manual ketika pemilihan model saja seharusnya cukup untuk menyalakan backend.

## Cara kerjanya

1. Permintaan model diselesaikan ke provider yang dikonfigurasi.
2. Jika provider tersebut memiliki `localService`, OpenClaw memeriksa `healthUrl`.
3. Jika pemeriksaan berhasil, OpenClaw menggunakan server yang sudah ada.
4. Jika pemeriksaan gagal, OpenClaw memulai `command` dengan `args`.
5. OpenClaw melakukan polling kesiapan hingga `readyTimeoutMs` berakhir.
6. Permintaan model dikirim melalui transport provider normal.
7. Jika OpenClaw memulai proses dan `idleStopMs` bernilai positif, proses
   dihentikan setelah permintaan in-flight terakhir menganggur selama durasi tersebut.

OpenClaw tidak memasang launchd, systemd, Docker, atau daemon untuk ini. Server
adalah proses turunan dari proses OpenClaw yang pertama kali membutuhkannya.

## Bentuk konfigurasi

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Bidang

- `command`: path executable absolut. Pencarian shell tidak digunakan.
- `args`: argumen proses. Tidak ada aturan ekspansi shell, pipe, globbing, atau quoting
  yang diterapkan.
- `cwd`: direktori kerja opsional untuk proses.
- `env`: variabel lingkungan opsional yang digabungkan di atas lingkungan proses
  OpenClaw.
- `healthUrl`: URL kesiapan. Jika dihilangkan, OpenClaw menambahkan `/models` ke
  `baseUrl`, sehingga `http://127.0.0.1:8000/v1` menjadi
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: tenggat kesiapan startup. Default: `120000`.
- `idleStopMs`: jeda penghentian saat menganggur untuk proses yang dimulai OpenClaw. `0` atau
  jika dihilangkan akan menjaga proses tetap hidup hingga OpenClaw keluar.

## Contoh Inferrs

Inferrs adalah backend `/v1` kustom yang kompatibel dengan OpenAI, sehingga API layanan lokal
yang sama berfungsi dengan entri provider `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

Ganti `command` dengan hasil dari `which inferrs` pada mesin yang menjalankan
OpenClaw.

## Contoh ds4

Untuk penyiapan lengkap, panduan ukuran konteks, dan perintah verifikasi, lihat
[ds4](/id/providers/ds4).

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

## Catatan operasional

- Satu proses OpenClaw mengelola proses turunan yang dimulainya. Proses OpenClaw lain
  yang melihat URL kesehatan yang sama sudah aktif akan menggunakannya kembali tanpa mengadopsinya.
- Startup diserialkan per perintah provider dan kumpulan argumen, sehingga permintaan
  serentak tidak memunculkan server duplikat untuk konfigurasi yang sama.
- Respons streaming aktif menahan lease; penghentian saat menganggur menunggu hingga penanganan
  body respons selesai.
- Gunakan `timeoutSeconds` pada provider lokal yang lambat agar cold start dan generasi panjang
  tidak terkena timeout permintaan model default.
- Gunakan `healthUrl` eksplisit jika server Anda mengekspos kesiapan di tempat selain
  `/v1/models`.

## Terkait

<CardGroup cols={2}>
  <Card title="Local models" href="/id/gateway/local-models" icon="server">
    Penyiapan model lokal, pilihan provider, dan panduan keamanan.
  </Card>
  <Card title="Inferrs" href="/id/providers/inferrs" icon="cpu">
    Jalankan OpenClaw melalui server lokal inferrs yang kompatibel dengan OpenAI.
  </Card>
</CardGroup>
