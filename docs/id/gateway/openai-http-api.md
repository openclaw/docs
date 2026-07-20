---
read_when:
    - Mengintegrasikan alat yang mengharapkan OpenAI Chat Completions
summary: Ekspos endpoint HTTP `/v1/chat/completions` yang kompatibel dengan OpenAI dari Gateway
title: Penyelesaian percakapan OpenAI
x-i18n:
    generated_at: "2026-07-20T03:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc5a1a56972bb9070da0f8f60d6efd673cc1d1d516b730c55bc9d171fc7a5b3
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway dapat menyediakan permukaan Chat Completions kecil yang kompatibel dengan OpenAI. Permukaan ini **dinonaktifkan secara default**.

Setelah diaktifkan, Gateway menyediakan semua endpoint berikut pada port yang sama dengan Gateway (multipleks WS + HTTP):

| Metode | Jalur                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Permintaan dijalankan sebagai proses agen Gateway normal (jalur kode yang sama dengan `openclaw agent`), sehingga perutean, izin, dan konfigurasi sesuai dengan Gateway Anda.

## Mengaktifkan endpoint

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

Atur `enabled: false` (atau hilangkan) untuk menonaktifkannya.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai **akses operator penuh** ke instans Gateway:

- Token/kata sandi Gateway yang valid untuk endpoint ini setara dengan kredensial pemilik/operator, bukan cakupan sempit per pengguna.
- Permintaan dijalankan melalui jalur agen bidang kontrol yang sama dengan tindakan operator tepercaya, sehingga jika kebijakan agen target mengizinkan alat sensitif, endpoint ini dapat menggunakannya.
- Batasi hanya pada loopback/tailnet/ingres privat. Jangan mengeksposnya ke internet publik.

Matriks autentikasi:

| Jalur autentikasi                                                                                            | Perilaku                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`                            | Membuktikan kepemilikan rahasia Gateway bersama. Mengabaikan header `x-openclaw-scopes` apa pun dan memulihkan kumpulan cakupan operator default penuh: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Memperlakukan giliran percakapan sebagai giliran pengirim-pemilik. |
| HTTP pembawa identitas tepercaya (autentikasi proksi tepercaya, atau `gateway.auth.mode="none"` pada ingres privat) | Menghormati `x-openclaw-scopes` jika tersedia; jika tidak ada, kembali ke kumpulan cakupan operator default. Semantik pemilik hanya hilang ketika pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`. Memerlukan `operator.admin` untuk kontrol tingkat pemilik seperti `x-openclaw-model`.                        |

Lihat [Cakupan operator](/id/gateway/operator-scopes), [Keamanan](/id/gateway/security), dan [Akses jarak jauh](/id/gateway/remote).

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway (lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth) untuk detail mode tersebut):

| Mode                                | Cara mengautentikasi                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Atur melalui `gateway.auth.token` atau `OPENCLAW_GATEWAY_TOKEN`.                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Atur melalui `gateway.auth.password` atau `OPENCLAW_GATEWAY_PASSWORD`.                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | Rutekan melalui proksi sadar identitas yang dikonfigurasi; proksi tersebut menyuntikkan header identitas yang diperlukan. Proksi loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit. |
| `gateway.auth.mode="none"`          | Tidak memerlukan header autentikasi (hanya ingres privat).                                                                                                                                         |

Catatan:

- Pemanggil pada host yang sama yang melewati proksi pada Gateway `trusted-proxy` dapat langsung beralih ke `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Bukti header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP` apa pun akan mempertahankan permintaan pada jalur proksi tepercaya.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak upaya autentikasi gagal, endpoint mengembalikan `429` dengan header `Retry-After`.

## Kapan menggunakan endpoint ini

- Utamakan ini daripada menambahkan saluran bawaan baru jika integrasi Anda hanyalah permukaan operator/klien lain untuk Gateway yang sama.
- Untuk klien seluler native yang terhubung langsung ke Gateway jarak jauh, utamakan [WebChat](/id/web/webchat) atau [Protokol Gateway](/id/gateway/protocol) dengan alur bootstrap perangkat berpasangan/token perangkat, sehingga perangkat tidak memerlukan token/kata sandi HTTP bersama.
- Sebagai gantinya, buat Plugin saluran saat mengintegrasikan jaringan perpesanan eksternal yang memiliki pengguna, ruang, pengiriman Webhook, atau transportasi keluar sendiri. Lihat [Membuat Plugin](/id/plugins/building-plugins).

## Kontrak model yang mengutamakan agen

OpenClaw memperlakukan bidang `model` OpenAI sebagai **target agen**, bukan ID model penyedia mentah.

| Nilai `model`                                | Dirutekan ke                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | Agen default yang dikonfigurasi                                                                                                 |
| `openclaw/default`                           | Agen default yang dikonfigurasi (alias stabil; aman untuk ditulis secara permanen meskipun ID agen default sebenarnya berubah antarlingkungan) |
| `openclaw/<agentId>` atau `openclaw:<agentId>` | Agen tertentu                                                                                                           |
| `agent:<agentId>`                            | Agen tertentu (alias kompatibilitas)                                                                                     |

Header permintaan opsional:

| Header                                          | Efek                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Mengganti model backend untuk agen yang dipilih. Pemanggil bearer rahasia bersama dapat menggunakannya secara langsung; pemanggil pembawa identitas (proksi tepercaya, atau ingres privat tanpa autentikasi dengan `x-openclaw-scopes`) memerlukan `operator.admin`, jika tidak akan menerima `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Penggantian kompatibilitas untuk pemilihan agen.                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | Perutean sesi eksplisit. Ditolak dengan `400 invalid_request_error` jika menggunakan namespace internal yang dicadangkan (`subagent:`, `cron:`, `acp:`).                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | Menetapkan konteks saluran ingres sintetis untuk prompt/kebijakan yang sadar saluran.                                                                                                                                                                                              |

`/v1/models` mencantumkan target agen tingkat atas (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), bukan model penyedia backend dan bukan subagen; subagen tetap menjadi topologi eksekusi internal. Jika Anda menghilangkan `x-openclaw-model`, agen yang dipilih berjalan dengan model normal yang dikonfigurasi untuknya.

`/v1/embeddings` menggunakan ID `model` target agen yang sama. Kirim `x-openclaw-model` (dari pemanggil rahasia bersama, atau pemanggil pembawa identitas dengan `operator.admin`) untuk memilih model embedding tertentu; jika tidak, permintaan menggunakan penyiapan embedding normal milik agen yang dipilih.

## Perilaku sesi

Secara default, endpoint ini **tanpa status untuk setiap permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string `user` OpenAI, Gateway memperoleh kunci sesi stabil darinya sehingga panggilan berulang dapat berbagi sesi agen. Untuk aplikasi khusus, gunakan kembali nilai `user` yang sama per utas percakapan; hindari pengidentifikasi tingkat akun kecuali Anda ingin beberapa percakapan/perangkat berbagi satu sesi OpenClaw. Gunakan `x-openclaw-session-key` hanya ketika Anda memerlukan kontrol perutean eksplisit pada beberapa klien/utas, dengan kunci milik aplikasi yang menghindari namespace yang dicadangkan di atas.

## Batas permintaan

Endpoint menggunakan batas bawaan sebesar 20 MB per isi permintaan, 8 bagian `image_url`
dari pesan pengguna terbaru, dan 20 MB data gambar terdekode secara kumulatif.
Kebijakan sumber gambar tetap dapat dikonfigurasi di bawah
`gateway.http.endpoints.chatCompletions.images`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Pengaturan gambar memiliki nilai default:

| Kunci                   | Default                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `images.allowUrl`     | `false` (bagian `image_url` yang bersumber dari URL ditolak kecuali diaktifkan) |
| `images.maxBytes`     | 10MB per gambar                                                      |
| `images.maxRedirects` | 3                                                                   |
| `images.timeoutMs`    | 10s                                                                 |

Sumber `image_url` HEIC/HEIF diterima dan dinormalisasi menjadi JPEG sebelum dikirim ke penyedia melalui pemroses gambar bersama OpenClaw (Rastermill), yang beralih ke konverter sistem (`sips`, ImageMagick, GraphicsMagick, atau ffmpeg) untuk format yang memerlukan dukungan codec eksternal.

Catatan keamanan: memasukkan nama host ke daftar yang diizinkan tidak melewati pemblokiran IP privat/internal. Untuk Gateway yang terekspos ke internet, terapkan kontrol egress jaringan selain perlindungan tingkat aplikasi. Lihat [Keamanan](/id/gateway/security).

## Kontrak alat percakapan

`/v1/chat/completions` mendukung subset alat fungsi yang kompatibel dengan klien OpenAI Chat umum.

### Bidang permintaan yang didukung

| Bidang                     | Catatan                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Larik `{ "type": "function", "function": { ... } }`                                                                                         |
| `tool_choice`              | `"auto"`, `"none"`, `"required"`, atau `{ "type": "function", "function": { "name": "..." } }`                                                 |
| `messages[*].role: "tool"` | Giliran tindak lanjut                                                                                                                         |
| `messages[*].tool_call_id` | Mengaitkan hasil alat kembali ke panggilan alat sebelumnya                                                                                    |
| `max_completion_tokens`    | Angka; batas per panggilan untuk total token penyelesaian (termasuk token penalaran). Nama bidang saat ini; digunakan ketika bidang ini dan `max_tokens` sama-sama dikirim. |
| `max_tokens`               | Angka; alias lama, diabaikan ketika `max_completion_tokens` juga tersedia.                                                                    |
| `temperature`              | Angka 0-2; upaya terbaik, diteruskan ke penyedia hulu. `400 invalid_request_error` jika di luar rentang.                                       |
| `top_p`                    | Angka 0-1; upaya terbaik. `400 invalid_request_error` jika di luar rentang.                                                                    |
| `frequency_penalty`        | Angka -2.0 hingga 2.0; upaya terbaik. `400 invalid_request_error` jika di luar rentang.                                                        |
| `presence_penalty`         | Angka -2.0 hingga 2.0; upaya terbaik. `400 invalid_request_error` jika di luar rentang.                                                        |
| `seed`                     | Bilangan bulat; upaya terbaik. `400 invalid_request_error` untuk nilai bukan bilangan bulat.                                                   |
| `stop`                     | String atau larik hingga 4 string; upaya terbaik. `400 invalid_request_error` untuk lebih dari 4 urutan atau entri bukan string/kosong.         |

Semua bidang pengambilan sampel dan batas token menggunakan saluran parameter aliran agen yang sama dan diteruskan dengan upaya terbaik:

- Batas token: nama bidang pada wire dipilih oleh transport penyedia: `max_completion_tokens` untuk endpoint keluarga OpenAI, `max_tokens` untuk penyedia yang hanya menerima nama lama (Mistral, Chutes).
- `stop` dipetakan ke bidang penghentian transport: `stop` untuk backend Chat Completions, `stop_sequences` untuk Anthropic. OpenAI Responses API tidak memiliki parameter penghentian, sehingga `stop` tidak diterapkan pada model yang didukung Responses.
- Backend Codex Responses berbasis ChatGPT menggunakan pengambilan sampel tetap di sisi server dan menghapus `temperature`/`top_p` (bersama `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) sebelum permintaan mencapai backend tersebut.

### Varian yang tidak didukung

Mengembalikan `400 invalid_request_error` untuk:

- `tools` yang bukan larik, entri alat yang bukan fungsi, atau `tool.function.name` yang tidak ada
- varian `tool_choice` seperti `allowed_tools` dan `custom`
- nilai `tool_choice.function.name` yang tidak cocok dengan alat yang disediakan

Untuk `tool_choice: "required"` dan `tool_choice` yang disematkan ke fungsi, endpoint mempersempit kumpulan alat fungsi klien yang diekspos, menginstruksikan runtime untuk memanggil alat klien sebelum merespons, dan menghasilkan kesalahan jika respons agen tidak memiliki panggilan alat klien terstruktur yang cocok. Hal ini berlaku untuk daftar HTTP `tools` yang diberikan pemanggil, bukan untuk setiap alat agen internal OpenClaw.

### Bentuk respons alat non-streaming

Saat agen memanggil alat, respons menggunakan:

- `choices[0].finish_reason = "tool_calls"`
- entri `choices[0].message.tool_calls[]` dengan `id`, `type: "function"`, `function.name`, `function.arguments` (string JSON)
- Komentar asisten sebelum panggilan alat, dalam `choices[0].message.content` (mungkin kosong)

### Bentuk respons alat streaming

Saat `stream: true`, panggilan alat tiba sebagai potongan SSE inkremental: delta peran asisten awal, delta komentar asisten opsional, satu atau beberapa potongan `delta.tool_calls` yang membawa identitas alat dan fragmen argumen, lalu potongan akhir dengan `finish_reason: "tool_calls"` dan `data: [DONE]`.

Jika `stream_options.include_usage=true`, potongan penggunaan penutup dipancarkan sebelum `[DONE]`.

### Perulangan tindak lanjut alat

Setelah menerima `tool_calls`, jalankan fungsi yang diminta dan kirim permintaan tindak lanjut yang menyertakan pesan panggilan alat asisten sebelumnya serta satu atau beberapa pesan `role: "tool"` dengan `tool_call_id` yang cocok. Ini melanjutkan perulangan penalaran agen yang sama untuk menghasilkan jawaban akhir.

## Streaming (SSE)

Tetapkan `stream: true` untuk menerima Server-Sent Events:

- `Content-Type: text/event-stream`
- Setiap baris peristiwa adalah `data: <json>`
- Aliran berakhir dengan `data: [DONE]`

## Penyiapan cepat Open WebUI

- Base URL: `http://127.0.0.1:18789/v1`
- Docker on macOS base URL: `http://host.docker.internal:18789/v1`
- API key: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan: `GET /v1/models` mencantumkan `openclaw/default`, dan Open WebUI menggunakannya sebagai id model obrolan. Untuk penyedia/model backend tertentu, tetapkan model default normal agen, atau kirim `x-openclaw-model` (pemanggil dengan rahasia bersama, atau pemanggil yang membawa identitas dengan `operator.admin`).

Uji cepat sederhana:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jika perintah tersebut mengembalikan `openclaw/default`, sebagian besar penyiapan Open WebUI dapat terhubung dengan URL dasar dan token yang sama.

## Contoh

Sesi stabil untuk satu percakapan aplikasi:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Ringkas tugas saya untuk hari ini"}]
  }'
```

Gunakan kembali nilai `user` yang sama pada panggilan berikutnya untuk percakapan tersebut agar sesi agen yang sama berlanjut.

Non-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hai"}]
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hai"}]
  }'
```

Cantumkan model:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Ambil satu model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Buat embedding:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` mendukung `input` sebagai string atau larik string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Cakupan operator](/id/gateway/operator-scopes)
- [OpenAI](/id/providers/openai)
