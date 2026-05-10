---
read_when:
    - Anda ingin OpenClaw memulai server model lokal hanya saat modelnya dipilih
    - Anda menjalankan ds4, inferrs, vLLM, llama.cpp, MLX, atau server lokal lain yang kompatibel dengan OpenAI
    - Anda perlu mengendalikan inisialisasi dingin, kesiapan, dan penghentian saat tidak aktif untuk penyedia lokal
summary: Mulai server model lokal sesuai kebutuhan sebelum permintaan model OpenClaw
title: Layanan model lokal
x-i18n:
    generated_at: "2026-05-10T19:36:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` memungkinkan OpenClaw memulai server model lokal milik penyedia sesuai kebutuhan. Ini adalah konfigurasi tingkat penyedia: ketika model yang dipilih milik penyedia tersebut, OpenClaw memeriksa layanan, memulai proses jika endpoint tidak aktif, menunggu kesiapan, lalu mengirim permintaan model.

Gunakan ini untuk server lokal yang mahal jika dibiarkan berjalan sepanjang hari, atau untuk penyiapan manual ketika pemilihan model saja sudah cukup untuk menyalakan backend.

## Cara kerjanya

1. Permintaan model di-resolve ke penyedia yang dikonfigurasi.
2. Jika penyedia tersebut memiliki `localService`, OpenClaw memeriksa `healthUrl`.
3. Jika pemeriksaan berhasil, OpenClaw menggunakan server yang sudah ada.
4. Jika pemeriksaan gagal, OpenClaw memulai `command` dengan `args`.
5. OpenClaw melakukan polling kesiapan hingga `readyTimeoutMs` berakhir.
6. Permintaan model dikirim melalui transport penyedia normal.
7. Jika OpenClaw memulai proses dan `idleStopMs` bernilai positif, proses akan
   dihentikan setelah permintaan terakhir yang masih berjalan telah idle selama itu.

OpenClaw tidak memasang launchd, systemd, Docker, atau daemon untuk ini. Server
adalah proses anak dari proses OpenClaw yang pertama kali membutuhkannya.

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

## Kolom

- `command`: path executable absolut. Pencarian shell tidak digunakan.
- `args`: argumen proses. Tidak ada ekspansi shell, pipe, globbing, atau aturan
  quoting yang diterapkan.
- `cwd`: direktori kerja opsional untuk proses.
- `env`: variabel lingkungan opsional yang digabungkan di atas lingkungan proses
  OpenClaw.
- `healthUrl`: URL kesiapan. Jika dihilangkan, OpenClaw menambahkan `/models` ke
  `baseUrl`, sehingga `http://127.0.0.1:8000/v1` menjadi
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: tenggat kesiapan startup. Default: `120000`.
- `idleStopMs`: jeda shutdown idle untuk proses yang dimulai OpenClaw. `0` atau
  dihilangkan akan mempertahankan proses tetap hidup hingga OpenClaw keluar.

## Contoh Inferrs

Inferrs adalah backend `/v1` kustom yang kompatibel dengan OpenAI, sehingga API
layanan lokal yang sama berfungsi dengan entri penyedia `inferrs`.

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

- Satu proses OpenClaw mengelola anak proses yang dimulainya. Proses OpenClaw lain
  yang melihat URL health yang sama sudah aktif akan menggunakannya kembali tanpa mengadopsinya.
- Startup diserialkan per perintah penyedia dan set argumen, sehingga permintaan
  bersamaan tidak membuat server duplikat untuk konfigurasi yang sama.
- Respons streaming aktif memegang lease; shutdown idle menunggu hingga penanganan
  body respons selesai.
- Gunakan `timeoutSeconds` pada penyedia lokal yang lambat agar cold start dan generasi panjang
  tidak terkena timeout permintaan model default.
- Gunakan `healthUrl` eksplisit jika server Anda mengekspos kesiapan di tempat lain
  selain `/v1/models`.

## Terkait

<CardGroup cols={2}>
  <Card title="Local models" href="/id/gateway/local-models" icon="server">
    Penyiapan model lokal, pilihan penyedia, dan panduan keamanan.
  </Card>
  <Card title="Inferrs" href="/id/providers/inferrs" icon="cpu">
    Jalankan OpenClaw melalui server lokal inferrs yang kompatibel dengan OpenAI.
  </Card>
</CardGroup>
