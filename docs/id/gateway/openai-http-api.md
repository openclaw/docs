---
read_when:
    - Mengintegrasikan alat yang mengharapkan OpenAI Chat Completions
summary: Ekspos endpoint HTTP `/v1/chat/completions` yang kompatibel dengan OpenAI dari Gateway
title: Penyelesaian percakapan OpenAI
x-i18n:
    generated_at: "2026-07-12T14:13:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway dapat menyediakan antarmuka Chat Completions kecil yang kompatibel dengan OpenAI. Fitur ini **dinonaktifkan secara default**.

Setelah diaktifkan, Gateway menyediakan semua endpoint berikut pada port yang sama dengan Gateway (multipleks WS + HTTP):

| Metode | Jalur                  |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Permintaan dijalankan seperti proses agen Gateway biasa (jalur kode yang sama dengan `openclaw agent`), sehingga perutean, izin, dan konfigurasi sesuai dengan Gateway Anda.

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

Tetapkan `enabled: false` (atau hilangkan) untuk menonaktifkannya.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai **akses operator penuh** ke instans Gateway:

- Token/kata sandi Gateway yang valid untuk endpoint ini setara dengan kredensial pemilik/operator, bukan cakupan sempit per pengguna.
- Permintaan dijalankan melalui jalur agen bidang kontrol yang sama dengan tindakan operator tepercaya. Oleh karena itu, jika kebijakan agen target mengizinkan alat sensitif, endpoint ini dapat menggunakannya.
- Batasi akses hanya melalui local loopback/tailnet/akses masuk privat. Jangan mengeksposnya ke internet publik.

Matriks autentikasi:

| Jalur autentikasi                                                                                    | Perilaku                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`                          | Membuktikan kepemilikan rahasia bersama Gateway. Mengabaikan semua header `x-openclaw-scopes` dan memulihkan kumpulan cakupan operator default lengkap: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Memperlakukan giliran percakapan sebagai giliran pengirim-pemilik. |
| HTTP tepercaya dengan identitas (autentikasi trusted-proxy, atau `gateway.auth.mode="none"` pada akses masuk privat) | Mematuhi `x-openclaw-scopes` jika tersedia; menggunakan kumpulan cakupan operator default jika tidak tersedia. Semantik pemilik hanya hilang ketika pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`. Memerlukan `operator.admin` untuk kontrol tingkat pemilik seperti `x-openclaw-model`.                        |

Lihat [Cakupan operator](/id/gateway/operator-scopes), [Keamanan](/id/gateway/security), dan [Akses jarak jauh](/id/gateway/remote).

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway (lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth) untuk detail mode tersebut):

| Mode                                | Cara melakukan autentikasi                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Tetapkan melalui `gateway.auth.token` atau `OPENCLAW_GATEWAY_TOKEN`.                                                                                                |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Tetapkan melalui `gateway.auth.password` atau `OPENCLAW_GATEWAY_PASSWORD`.                                                                                       |
| `gateway.auth.mode="trusted-proxy"` | Rutekan melalui proksi sadar-identitas yang dikonfigurasi; proksi tersebut menyisipkan header identitas yang diperlukan. Proksi local loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit. |
| `gateway.auth.mode="none"`          | Tidak memerlukan header autentikasi (hanya akses masuk privat).                                                                                                                                      |

Catatan:

- Pemanggil pada host yang sama yang melewati proksi pada Gateway `trusted-proxy` dapat langsung menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai alternatif. Adanya header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP` membuat permintaan tetap menggunakan jalur trusted-proxy.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak upaya autentikasi gagal, endpoint mengembalikan `429` dengan header `Retry-After`.

## Kapan menggunakan endpoint ini

- Pilih endpoint ini daripada menambahkan kanal bawaan baru jika integrasi Anda hanya merupakan antarmuka operator/klien lain untuk Gateway yang sama.
- Untuk klien seluler native yang terhubung langsung ke Gateway jarak jauh, pilih [WebChat](/id/web/webchat) atau [Protokol Gateway](/id/gateway/protocol) dengan alur bootstrap perangkat yang dipasangkan/token perangkat, agar perangkat tidak memerlukan token/kata sandi HTTP bersama.
- Sebagai gantinya, buat Plugin kanal saat mengintegrasikan jaringan perpesanan eksternal yang memiliki pengguna, ruang, pengiriman Webhook, atau transportasi keluar sendiri. Lihat [Membangun Plugin](/id/plugins/building-plugins).

## Kontrak model yang mengutamakan agen

OpenClaw memperlakukan bidang `model` OpenAI sebagai **target agen**, bukan ID model penyedia mentah.

| Nilai `model`                                | Dirutekan ke                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                   | Agen default yang dikonfigurasi                                                                                                          |
| `openclaw/default`                           | Agen default yang dikonfigurasi (alias stabil; aman untuk ditulis langsung meskipun ID agen default sebenarnya berubah antarlingkungan) |
| `openclaw/<agentId>` atau `openclaw:<agentId>` | Agen tertentu                                                                                                                           |
| `agent:<agentId>`                            | Agen tertentu (alias kompatibilitas)                                                                                                     |

Header permintaan opsional:

| Header                                          | Efek                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Mengganti model backend untuk agen yang dipilih. Pemanggil bearer dengan rahasia bersama dapat langsung menggunakannya; pemanggil dengan identitas (trusted-proxy, atau akses masuk privat tanpa autentikasi dengan `x-openclaw-scopes`) memerlukan `operator.admin`, jika tidak akan menerima `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Penggantian kompatibilitas untuk pemilihan agen.                                                                                                                                                                                                                                                                                           |
| `x-openclaw-session-key: <sessionKey>`          | Perutean sesi eksplisit. Ditolak dengan `400 invalid_request_error` jika menggunakan namespace internal yang dicadangkan (`subagent:`, `cron:`, `acp:`).                                                                                                                                                                                    |
| `x-openclaw-message-channel: <channel>`         | Menetapkan konteks kanal akses masuk sintetis untuk prompt/kebijakan yang sadar kanal.                                                                                                                                                                                                                                                     |

`/v1/models` mencantumkan target agen tingkat atas (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), bukan model penyedia backend dan bukan subagen; subagen tetap menjadi topologi eksekusi internal. Jika Anda menghilangkan `x-openclaw-model`, agen yang dipilih berjalan dengan model normal yang dikonfigurasikan untuknya.

`/v1/embeddings` menggunakan ID `model` target agen yang sama. Kirim `x-openclaw-model` (dari pemanggil dengan rahasia bersama, atau pemanggil dengan identitas yang memiliki `operator.admin`) untuk memilih model embedding tertentu; jika tidak, permintaan menggunakan konfigurasi embedding normal milik agen yang dipilih.

## Perilaku sesi

Secara default, endpoint ini **tanpa status untuk setiap permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string `user` OpenAI, Gateway memperoleh kunci sesi stabil darinya sehingga panggilan berulang dapat berbagi sesi agen. Untuk aplikasi khusus, gunakan kembali nilai `user` yang sama untuk setiap utas percakapan; hindari pengidentifikasi tingkat akun kecuali Anda ingin beberapa percakapan/perangkat berbagi satu sesi OpenClaw. Gunakan `x-openclaw-session-key` hanya jika Anda memerlukan kontrol perutean eksplisit di beberapa klien/utas, dengan kunci milik aplikasi yang menghindari namespace yang dicadangkan di atas.

## Batas permintaan (konfigurasi)

Nilai default dapat disesuaikan di bawah `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
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

Nilai default jika dihilangkan:

| Kunci                 | Default                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                               |
| `maxImageParts`       | 8 (jumlah maksimum bagian `image_url` yang dibaca dari pesan pengguna terbaru)     |
| `maxTotalImageBytes`  | 20MB (total byte terdekode kumulatif di seluruh bagian `image_url` dalam satu permintaan) |
| `images.allowUrl`     | `false` (bagian `image_url` yang bersumber dari URL ditolak kecuali diaktifkan)    |
| `images.maxBytes`     | 10MB per gambar                                                                    |
| `images.maxRedirects` | 3                                                                                  |
| `images.timeoutMs`    | 10 detik                                                                           |

Sumber `image_url` HEIC/HEIF diterima dan dinormalisasi menjadi JPEG sebelum dikirim ke penyedia melalui pemroses gambar bersama OpenClaw (Rastermill), yang menggunakan konverter sistem (`sips`, ImageMagick, GraphicsMagick, atau ffmpeg) sebagai alternatif untuk format yang memerlukan dukungan codec eksternal.

Catatan keamanan: memasukkan nama host ke daftar yang diizinkan tidak melewati pemblokiran IP privat/internal. Untuk Gateway yang terekspos ke internet, terapkan kontrol lalu lintas keluar jaringan selain perlindungan tingkat aplikasi. Lihat [Keamanan](/id/gateway/security).

## Kontrak alat obrolan

`/v1/chat/completions` mendukung subset alat fungsi yang kompatibel dengan klien OpenAI Chat umum.

### Kolom permintaan yang didukung

| Kolom                      | Catatan                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Larik `{ "type": "function", "function": { ... } }`                                                                                                                   |
| `tool_choice`              | `"auto"`, `"none"`, `"required"`, atau `{ "type": "function", "function": { "name": "..." } }`                                                                         |
| `messages[*].role: "tool"` | Giliran tindak lanjut                                                                                                                                                 |
| `messages[*].tool_call_id` | Mengaitkan hasil alat kembali ke pemanggilan alat sebelumnya                                                                                                          |
| `max_completion_tokens`    | Angka; batas per pemanggilan untuk total token penyelesaian (termasuk token penalaran). Nama kolom saat ini; digunakan ketika kolom ini dan `max_tokens` dikirim.      |
| `max_tokens`               | Angka; alias lama, diabaikan ketika `max_completion_tokens` juga ada.                                                                                                 |
| `temperature`              | Angka 0–2; upaya terbaik, diteruskan ke penyedia hulu. `400 invalid_request_error` jika di luar rentang.                                                              |
| `top_p`                    | Angka 0–1; upaya terbaik. `400 invalid_request_error` jika di luar rentang.                                                                                           |
| `frequency_penalty`        | Angka -2.0 hingga 2.0; upaya terbaik. `400 invalid_request_error` jika di luar rentang.                                                                                |
| `presence_penalty`         | Angka -2.0 hingga 2.0; upaya terbaik. `400 invalid_request_error` jika di luar rentang.                                                                                |
| `seed`                     | Bilangan bulat; upaya terbaik. `400 invalid_request_error` untuk nilai bukan bilangan bulat.                                                                          |
| `stop`                     | String atau larik yang berisi hingga 4 string; upaya terbaik. `400 invalid_request_error` untuk lebih dari 4 urutan atau entri yang bukan string/kosong.               |

Semua kolom pengambilan sampel dan batas token menggunakan kanal parameter aliran agen yang sama dan diteruskan dengan upaya terbaik:

- Batas token: nama kolom pada protokol dipilih oleh transpor penyedia: `max_completion_tokens` untuk endpoint keluarga OpenAI, `max_tokens` untuk penyedia yang hanya menerima nama lama (Mistral, Chutes).
- `stop` dipetakan ke kolom penghentian transpor: `stop` untuk backend Chat Completions, `stop_sequences` untuk Anthropic. OpenAI Responses API tidak memiliki parameter penghentian, sehingga `stop` tidak diterapkan pada model yang didukung Responses.
- Backend Codex Responses berbasis ChatGPT menggunakan pengambilan sampel tetap di sisi server dan menghapus `temperature`/`top_p` (bersama dengan `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) sebelum permintaan mencapai backend tersebut.

### Varian yang tidak didukung

Mengembalikan `400 invalid_request_error` untuk:

- `tools` yang bukan larik, entri alat yang bukan fungsi, atau `tool.function.name` yang tidak ada
- varian `tool_choice` seperti `allowed_tools` dan `custom`
- nilai `tool_choice.function.name` yang tidak cocok dengan alat yang disediakan

Untuk `tool_choice: "required"` dan `tool_choice` yang disematkan ke fungsi, endpoint mempersempit kumpulan alat fungsi klien yang diekspos, menginstruksikan runtime untuk memanggil alat klien sebelum merespons, dan menghasilkan galat jika respons agen tidak memiliki pemanggilan alat klien terstruktur yang cocok. Ini berlaku untuk daftar HTTP `tools` yang diberikan pemanggil, bukan untuk setiap alat internal agen OpenClaw.

### Bentuk respons alat non-streaming

Ketika agen memanggil alat, respons menggunakan:

- `choices[0].finish_reason = "tool_calls"`
- Entri `choices[0].message.tool_calls[]` dengan `id`, `type: "function"`, `function.name`, `function.arguments` (string JSON)
- Komentar asisten sebelum pemanggilan alat, dalam `choices[0].message.content` (mungkin kosong)

### Bentuk respons alat streaming

Ketika `stream: true`, pemanggilan alat diterima sebagai potongan SSE bertahap: delta awal peran asisten, delta komentar asisten opsional, satu atau beberapa potongan `delta.tool_calls` yang membawa identitas alat dan fragmen argumen, lalu potongan terakhir dengan `finish_reason: "tool_calls"` dan `data: [DONE]`.

Jika `stream_options.include_usage=true`, potongan penggunaan penutup dikirim sebelum `[DONE]`.

### Perulangan tindak lanjut alat

Setelah menerima `tool_calls`, jalankan fungsi yang diminta dan kirim permintaan tindak lanjut yang menyertakan pesan pemanggilan alat asisten sebelumnya ditambah satu atau beberapa pesan `role: "tool"` dengan `tool_call_id` yang cocok. Ini melanjutkan perulangan penalaran agen yang sama untuk menghasilkan jawaban akhir.

## Streaming (SSE)

Tetapkan `stream: true` untuk menerima Server-Sent Events:

- `Content-Type: text/event-stream`
- Setiap baris peristiwa adalah `data: <json>`
- Aliran berakhir dengan `data: [DONE]`

## Penyiapan cepat Open WebUI

- URL dasar: `http://127.0.0.1:18789/v1`
- URL dasar Docker di macOS: `http://host.docker.internal:18789/v1`
- Kunci API: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan: `GET /v1/models` mencantumkan `openclaw/default`, dan Open WebUI menggunakannya sebagai ID model obrolan. Untuk penyedia/model backend tertentu, tetapkan model default normal agen, atau kirim `x-openclaw-model` (pemanggil dengan rahasia bersama, atau pemanggil beridentitas dengan `operator.admin`).

Uji cepat:

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
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Gunakan kembali nilai `user` yang sama pada pemanggilan berikutnya untuk percakapan tersebut agar sesi agen yang sama berlanjut.

Non-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
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
    "messages": [{"role":"user","content":"hi"}]
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
