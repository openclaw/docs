---
read_when:
    - Anda ingin OpenClaw memulai server model lokal hanya ketika penyedia model atau embedding-nya dipilih
    - Anda menjalankan ds4, inferrs, vLLM, llama.cpp, MLX, atau server lokal lain yang kompatibel dengan OpenAI
    - Anda perlu mengontrol mulai dingin, kesiapan, dan penghentian saat menganggur untuk penyedia lokal
summary: Mulai server model lokal sesuai permintaan sebelum permintaan model dan embedding OpenClaw
title: Layanan model lokal
x-i18n:
    generated_at: "2026-07-12T14:12:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` memulai server model lokal milik penyedia sesuai permintaan. Ketika permintaan model atau embedding memilih penyedia tersebut, OpenClaw memeriksa endpoint kesehatan, memulai proses jika tidak aktif, menunggu hingga siap, lalu mengirimkan permintaan. Gunakan fitur ini agar server lokal yang mahal tidak perlu terus berjalan sepanjang hari.

## Cara kerjanya

1. Permintaan model atau embedding diarahkan ke penyedia yang dikonfigurasi.
2. Jika penyedia tersebut memiliki `localService`, OpenClaw memeriksa `healthUrl`.
3. Jika pemeriksaan berhasil, OpenClaw menggunakan server yang sudah berjalan.
4. Jika pemeriksaan gagal, OpenClaw menjalankan `command` dengan `args`.
5. OpenClaw melakukan polling pada endpoint kesehatan hingga `readyTimeoutMs` berakhir.
6. Permintaan diteruskan melalui transport model atau embedding yang normal.
7. Jika OpenClaw memulai proses dan `idleStopMs` ditetapkan, OpenClaw menghentikan proses setelah permintaan aktif terakhir menganggur selama durasi tersebut.

OpenClaw tidak memasang launchd, systemd, Docker, atau daemon apa pun untuk ini. Server merupakan proses anak biasa dari proses OpenClaw yang pertama kali membutuhkannya.

Proses mulai diserialkan untuk setiap kombinasi penyedia serta perintah/argumen/lingkungan yang dikonfigurasi, sehingga permintaan obrolan dan embedding bersamaan untuk layanan yang sama tidak memulai server duplikat. Setiap permintaan mempertahankan sewanya sendiri hingga penanganan respons selesai, sehingga penghentian saat menganggur menunggu setiap permintaan model dan embedding yang sedang berlangsung. Alias penyedia yang dikonfigurasi tetap berbeda: dua alias dapat mengarah ke host GPU yang berbeda tanpa digabungkan ke id adaptor Ollama, LM Studio, atau yang kompatibel dengan OpenAI yang sama.

Jika proses OpenClaw lain sudah memiliki server yang sehat pada `healthUrl` yang sama, proses ini menggunakannya kembali tanpa mengambil alih pengelolaannya (setiap proses hanya mengelola proses anak yang dimulainya sendiri). Log mulai dan keluar menyertakan bagian akhir keluaran proses anak yang dibatasi dan disunting, beserta detail waktu dan keluarnya proses; nilai lingkungan yang dikonfigurasi tidak pernah ditampilkan.

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

Tetapkan `timeoutSeconds` pada entri penyedia (bukan `localService`) agar proses mulai dingin yang lambat dan pembuatan keluaran yang panjang tidak mencapai batas waktu default permintaan model. Tetapkan `healthUrl` secara eksplisit setiap kali server Anda menyediakan status kesiapan di lokasi selain `/models` pada URL dasar.

## Bidang

| Bidang           | Wajib | Deskripsi                                                                                                                               |
| ---------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | ya    | Jalur absolut berkas yang dapat dieksekusi. Tidak ada pencarian PATH shell.                                                             |
| `args`           | tidak | Argumen proses. Tidak ada ekspansi shell, pipe, globbing, atau pengutipan.                                                              |
| `cwd`            | tidak | Direktori kerja untuk proses.                                                                                                           |
| `env`            | tidak | Variabel lingkungan yang digabungkan di atas lingkungan proses OpenClaw.                                                               |
| `healthUrl`      | tidak | URL kesiapan. Nilai default adalah `baseUrl` dengan tambahan `/models` (`http://127.0.0.1:8000/v1` menjadi `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | tidak | Tenggat kesiapan saat proses mulai. Default: `120000`.                                                                                  |
| `idleStopMs`     | tidak | Jeda penghentian saat menganggur untuk proses yang dimulai OpenClaw. `0` atau jika dihilangkan akan membuatnya tetap aktif hingga OpenClaw keluar. |

## Contoh Inferrs

Inferrs adalah backend `/v1` khusus yang kompatibel dengan OpenAI, sehingga API `localService` yang sama dapat digunakan dengan entri penyedia `inferrs`:

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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Ganti `command` dengan hasil `which inferrs` pada mesin yang menjalankan OpenClaw. Penyiapan lengkap inferrs: [Inferrs](/id/providers/inferrs).

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

Perintah penyiapan lengkap, penentuan ukuran konteks, dan verifikasi: [ds4](/id/providers/ds4).

## Terkait

<CardGroup cols={2}>
  <Card title="Model lokal" href="/id/gateway/local-models" icon="server">
    Penyiapan model lokal, pilihan penyedia, dan panduan keamanan.
  </Card>
  <Card title="Inferrs" href="/id/providers/inferrs" icon="cpu">
    Jalankan OpenClaw melalui server lokal inferrs yang kompatibel dengan OpenAI.
  </Card>
</CardGroup>
