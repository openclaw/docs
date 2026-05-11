---
read_when:
    - Mengintegrasikan alat yang memerlukan OpenAI Chat Completions
summary: Ekspos endpoint HTTP /v1/chat/completions yang kompatibel dengan OpenAI dari Gateway
title: Penyelesaian percakapan OpenAI
x-i18n:
    generated_at: "2026-05-11T20:29:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Ketika permukaan HTTP yang kompatibel dengan OpenAI milik Gateway diaktifkan, Gateway juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dijalankan sebagai proses agen Gateway biasa (jalur kode yang sama seperti `openclaw agent`), sehingga perutean/izin/konfigurasi sesuai dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP umum:

- autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP pembawa identitas tepercaya (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar identitas yang dikonfigurasi dan biarkan proxy menyuntikkan
  header identitas yang diperlukan
- autentikasi terbuka ingress privat (`gateway.auth.mode="none"`):
  tidak memerlukan header autentikasi

Catatan:

- Ketika `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Ketika `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Ketika `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber proxy tepercaya yang dikonfigurasi; proxy loopback host yang sama memerlukan
  `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak kegagalan autentikasi terjadi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial owner/operator.
- Permintaan berjalan melalui jalur agen control-plane yang sama seperti tindakan operator tepercaya.
- Tidak ada batas alat non-owner/per pengguna yang terpisah pada endpoint ini; setelah pemanggil lolos autentikasi Gateway di sini, OpenClaw memperlakukan pemanggil tersebut sebagai operator tepercaya untuk gateway ini.
- Untuk mode autentikasi shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP pembawa identitas tepercaya (misalnya autentikasi proxy tepercaya atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` saat ada dan jika tidak ada akan kembali ke set cakupan default operator normal.
- Jika kebijakan agen target mengizinkan alat sensitif, endpoint ini dapat menggunakannya.
- Pertahankan endpoint ini hanya pada loopback/tailnet/ingress privat; jangan mengeksposnya langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran pengirim-owner
- mode HTTP pembawa identitas tepercaya (misalnya autentikasi proxy tepercaya, atau `gateway.auth.mode="none"` pada ingress privat)
  - mengautentikasi suatu identitas tepercaya luar atau batas deployment
  - menghormati `x-openclaw-scopes` saat header ada
  - kembali ke set cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik owner saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Lihat [Keamanan](/id/gateway/security) dan [Akses jarak jauh](/id/gateway/remote).

## Kontrak model yang mengutamakan agen

OpenClaw memperlakukan field `model` OpenAI sebagai **target agen**, bukan id model provider mentah.

- `model: "openclaw"` merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/default"` juga merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` merutekan ke agen tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` menimpa model backend untuk agen yang dipilih.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai override kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` mengontrol perutean sesi sepenuhnya.
- `x-openclaw-message-channel: <channel>` mengatur konteks channel ingress sintetis untuk prompt dan kebijakan yang sadar channel.

Alias kompatibilitas masih diterima:

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

Jika permintaan menyertakan string `user` OpenAI, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi sesi agen.

## Mengapa permukaan ini penting

Ini adalah set kompatibilitas dengan leverage tertinggi untuk frontend dan tooling yang di-host sendiri:

- Sebagian besar setup Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang sudah ada biasanya dapat mulai dengan `/v1/chat/completions`.
- Klien yang lebih native-agen semakin memilih `/v1/responses`.

## Daftar model dan perutean agen

<AccordionGroup>
  <Accordion title="Apa yang dikembalikan `/v1/models`?">
    Daftar target agen OpenClaw.

    Id yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai `model` OpenAI.

  </Accordion>
  <Accordion title="Apakah `/v1/models` mencantumkan agen atau sub-agen?">
    Ini mencantumkan target agen tingkat atas, bukan model provider backend dan bukan sub-agen.

    Sub-agen tetap menjadi topologi eksekusi internal. Sub-agen tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Mengapa `openclaw/default` disertakan?">
    `openclaw/default` adalah alias stabil untuk agen default yang dikonfigurasi.

    Artinya klien dapat terus menggunakan satu id yang dapat diprediksi meskipun id agen default sebenarnya berubah antar lingkungan.

  </Accordion>
  <Accordion title="Bagaimana cara menimpa model backend?">
    Gunakan `x-openclaw-model`.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jika Anda menghilangkannya, agen yang dipilih berjalan dengan pilihan model normal yang dikonfigurasi.

  </Accordion>
  <Accordion title="Bagaimana embedding masuk ke kontrak ini?">
    `/v1/embeddings` menggunakan id `model` target-agen yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda membutuhkan model embedding tertentu, kirimkan dalam `x-openclaw-model`.
    Tanpa header tersebut, permintaan diteruskan ke setup embedding normal milik agen yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Atur `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Kontrak alat chat

`/v1/chat/completions` mendukung subset alat fungsi yang kompatibel dengan klien Chat OpenAI umum.

### Field permintaan yang didukung

- `tools`: array dari `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` giliran tindak lanjut
- `messages[*].tool_call_id` untuk mengikat hasil alat kembali ke panggilan alat sebelumnya

### Varian yang tidak didukung

Endpoint mengembalikan `400 invalid_request_error` untuk varian alat yang tidak didukung, termasuk:

- `tools` non-array
- entri alat non-fungsi
- `tool.function.name` yang hilang
- varian `tool_choice` seperti `allowed_tools` dan `custom`
- `tool_choice: "required"` (belum diberlakukan saat runtime; akan didukung setelah penegakan keras diimplementasikan)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (alasan yang sama seperti `required`)
- nilai `tool_choice.function.name` yang tidak cocok dengan `tools` yang disediakan

### Bentuk respons alat non-streaming

Ketika agen memutuskan untuk memanggil alat, respons menggunakan:

- `choices[0].finish_reason = "tool_calls"`
- entri `choices[0].message.tool_calls[]` dengan:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (string JSON)

Komentar asisten sebelum panggilan alat dikembalikan dalam `choices[0].message.content` (mungkin kosong).

### Bentuk respons alat streaming

Ketika `stream: true`, panggilan alat dipancarkan sebagai chunk SSE inkremental:

- delta peran asisten awal
- delta komentar asisten opsional
- satu atau beberapa chunk `delta.tool_calls` yang membawa identitas alat dan fragmen argumen
- chunk akhir dengan `finish_reason: "tool_calls"`
- `data: [DONE]`

Jika `stream_options.include_usage=true`, chunk penggunaan penutup dipancarkan sebelum `[DONE]`.

### Loop tindak lanjut alat

Setelah menerima `tool_calls`, klien harus mengeksekusi fungsi yang diminta dan mengirim permintaan tindak lanjut yang menyertakan:

- pesan panggilan alat asisten sebelumnya
- satu atau beberapa pesan `role: "tool"` dengan `tool_call_id` yang cocok

Ini memungkinkan proses agen gateway melanjutkan loop penalaran yang sama dan menghasilkan jawaban asisten akhir.

## Setup cepat Open WebUI

Untuk koneksi dasar Open WebUI:

- URL dasar: `http://127.0.0.1:18789/v1`
- URL dasar Docker di macOS: `http://host.docker.internal:18789/v1`
- Kunci API: token bearer Gateway Anda
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

Jika itu mengembalikan `openclaw/default`, sebagian besar setup Open WebUI dapat terhubung dengan URL dasar dan token yang sama.

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

Catatan:

- `/v1/models` mengembalikan target agen OpenClaw, bukan katalog provider mentah.
- `openclaw/default` selalu ada sehingga satu id stabil berfungsi lintas lingkungan.
- Override provider/model backend berada di `x-openclaw-model`, bukan field `model` OpenAI.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [OpenAI](/id/providers/openai)
