---
read_when:
    - Mengintegrasikan alat yang mengharapkan OpenAI Chat Completions
summary: Ekspos endpoint HTTP /v1/chat/completions yang kompatibel dengan OpenAI dari Gateway
title: Penyelesaian chat OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Saat permukaan HTTP Gateway yang kompatibel dengan OpenAI diaktifkan, ia juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dijalankan sebagai proses agen Gateway normal (codepath yang sama seperti `openclaw agent`), sehingga routing/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP umum:

- autentikasi rahasia bersama (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP pembawa identitas tepercaya (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar-identitas yang dikonfigurasi dan biarkan ia menyisipkan
  header identitas yang diperlukan
- autentikasi terbuka ingress privat (`gateway.auth.mode="none"`):
  tidak memerlukan header autentikasi

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber proxy tepercaya yang dikonfigurasi; proxy loopback host yang sama memerlukan
  `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terjadi terlalu banyak kegagalan autentikasi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan per pengguna yang sempit.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Permintaan berjalan melalui jalur agen control-plane yang sama seperti tindakan operator tepercaya.
- Tidak ada batas alat non-pemilik/per pengguna terpisah pada endpoint ini; begitu pemanggil lolos autentikasi Gateway di sini, OpenClaw memperlakukan pemanggil tersebut sebagai operator tepercaya untuk gateway ini.
- Untuk mode autentikasi rahasia bersama (`token` dan `password`), endpoint memulihkan default operator penuh normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP pembawa identitas tepercaya (misalnya autentikasi proxy tepercaya atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` saat ada dan jika tidak ada kembali ke kumpulan cakupan default operator normal.
- Jika kebijakan agen target mengizinkan alat sensitif, endpoint ini dapat menggunakannya.
- Pertahankan endpoint ini hanya pada loopback/tailnet/ingress privat; jangan mengeksposnya langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan kumpulan cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran pengirim-pemilik
- mode HTTP pembawa identitas tepercaya (misalnya autentikasi proxy tepercaya, atau `gateway.auth.mode="none"` pada ingress privat)
  - mengautentikasi sebagian identitas tepercaya luar atau batas deployment
  - menghormati `x-openclaw-scopes` saat header ada
  - kembali ke kumpulan cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik pemilik saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Lihat [Keamanan](/id/gateway/security) dan [Akses jarak jauh](/id/gateway/remote).

## Kontrak model yang mengutamakan agen

OpenClaw memperlakukan kolom `model` OpenAI sebagai **target agen**, bukan id model provider mentah.

- `model: "openclaw"` merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/default"` juga merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` merutekan ke agen tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` menimpa model backend untuk agen yang dipilih.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai penimpaan kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` sepenuhnya mengontrol routing sesi.
- `x-openclaw-message-channel: <channel>` menetapkan konteks kanal ingress sintetis untuk prompt dan kebijakan yang sadar kanal.

Alias kompatibilitas yang masih diterima:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Mengaktifkan endpoint

Atur `gateway.http.endpoints.chatCompletions.enabled` ke `true`:

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

## Menonaktifkan endpoint

Atur `gateway.http.endpoints.chatCompletions.enabled` ke `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Perilaku sesi

Secara default endpoint ini **stateless per permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string `user` OpenAI, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi satu sesi agen.

## Mengapa permukaan ini penting

Ini adalah kumpulan kompatibilitas dengan leverage tertinggi untuk frontend dan tooling yang di-host sendiri:

- Sebagian besar setup Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang sudah ada biasanya dapat memulai dengan `/v1/chat/completions`.
- Klien yang lebih agent-native makin sering memilih `/v1/responses`.

## Daftar model dan routing agen

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Daftar target agen OpenClaw.

    Id yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai `model` OpenAI.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Ini mencantumkan target agen tingkat atas, bukan model provider backend dan bukan sub-agen.

    Sub-agen tetap menjadi topologi eksekusi internal. Mereka tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` adalah alias stabil untuk agen default yang dikonfigurasi.

    Artinya klien dapat terus menggunakan satu id yang dapat diprediksi meskipun id agen default sebenarnya berubah antar lingkungan.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Gunakan `x-openclaw-model`.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jika Anda menghilangkannya, agen yang dipilih berjalan dengan pilihan model normal yang dikonfigurasi.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` menggunakan id `model` target-agen yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda memerlukan model embedding tertentu, kirimkan di `x-openclaw-model`.
    Tanpa header itu, permintaan diteruskan ke setup embedding normal agen yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Atur `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Kontrak alat chat

`/v1/chat/completions` mendukung subset alat fungsi yang kompatibel dengan klien OpenAI Chat umum.

### Kolom permintaan yang didukung

- `tools`: array dari `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- giliran lanjutan `messages[*].role: "tool"`
- `messages[*].tool_call_id` untuk mengikat hasil alat kembali ke panggilan alat sebelumnya
- `max_completion_tokens`: angka; batas per panggilan untuk total token completion (termasuk token reasoning). Nama kolom OpenAI Chat Completions saat ini; diprioritaskan saat `max_completion_tokens` dan `max_tokens` sama-sama dikirim.
- `max_tokens`: angka; alias lama yang diterima untuk kompatibilitas ke belakang. Diabaikan saat `max_completion_tokens` juga ada.

Saat salah satu kolom diatur, nilainya diteruskan ke provider upstream melalui kanal stream-param agen. Nama kolom wire aktual yang dikirim ke provider upstream dipilih oleh transport provider: `max_completion_tokens` untuk endpoint keluarga OpenAI, dan `max_tokens` untuk provider yang hanya menerima nama lama (seperti Mistral dan Chutes).

### Varian yang tidak didukung

Endpoint mengembalikan `400 invalid_request_error` untuk varian alat yang tidak didukung, termasuk:

- `tools` non-array
- entri alat non-fungsi
- `tool.function.name` yang hilang
- varian `tool_choice` seperti `allowed_tools` dan `custom`
- `tool_choice: "required"` (belum ditegakkan saat runtime; akan didukung setelah penegakan keras diimplementasikan)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (alasan yang sama seperti `required`)
- nilai `tool_choice.function.name` yang tidak cocok dengan `tools` yang disediakan

### Bentuk respons alat non-streaming

Saat agen memutuskan untuk memanggil alat, respons menggunakan:

- `choices[0].finish_reason = "tool_calls"`
- entri `choices[0].message.tool_calls[]` dengan:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (string JSON)

Komentar asisten sebelum panggilan alat dikembalikan di `choices[0].message.content` (mungkin kosong).

### Bentuk respons alat streaming

Saat `stream: true`, panggilan alat dipancarkan sebagai potongan SSE inkremental:

- delta peran asisten awal
- delta komentar asisten opsional
- satu atau beberapa potongan `delta.tool_calls` yang membawa identitas alat dan fragmen argumen
- potongan akhir dengan `finish_reason: "tool_calls"`
- `data: [DONE]`

Jika `stream_options.include_usage=true`, potongan usage penutup dipancarkan sebelum `[DONE]`.

### Loop tindak lanjut alat

Setelah menerima `tool_calls`, klien harus menjalankan fungsi yang diminta dan mengirim permintaan lanjutan yang menyertakan:

- pesan panggilan alat asisten sebelumnya
- satu atau beberapa pesan `role: "tool"` dengan `tool_call_id` yang cocok

Ini memungkinkan proses agen gateway melanjutkan loop reasoning yang sama dan menghasilkan jawaban asisten akhir.

## Setup cepat Open WebUI

Untuk koneksi Open WebUI dasar:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker di macOS: `http://host.docker.internal:18789/v1`
- API key: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan:

- `GET /v1/models` harus mencantumkan `openclaw/default`
- Open WebUI harus menggunakan `openclaw/default` sebagai id model chat
- Jika Anda menginginkan provider/model backend tertentu untuk agen tersebut, atur model default normal agen atau kirim `x-openclaw-model`

Smoke cepat:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jika itu mengembalikan `openclaw/default`, sebagian besar setup Open WebUI dapat terhubung dengan Base URL dan token yang sama.

## Contoh

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

Daftar model:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Ambil satu model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Buat embeddings:

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

Catatan:

- `/v1/models` mengembalikan target agen OpenClaw, bukan katalog penyedia mentah.
- `openclaw/default` selalu tersedia sehingga satu id stabil dapat digunakan di berbagai lingkungan.
- Override penyedia/model backend harus berada di `x-openclaw-model`, bukan di kolom `model` OpenAI.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [OpenAI](/id/providers/openai)
