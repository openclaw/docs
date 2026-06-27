---
read_when:
    - Mengintegrasikan alat yang mengharapkan OpenAI Chat Completions
summary: Ekspos endpoint HTTP /v1/chat/completions yang kompatibel dengan OpenAI dari Gateway
title: Penyelesaian chat OpenAI
x-i18n:
    generated_at: "2026-06-27T17:31:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Saat permukaan HTTP Gateway yang kompatibel dengan OpenAI diaktifkan, Gateway juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dieksekusi sebagai proses agent Gateway normal (codepath yang sama dengan `openclaw agent`), sehingga routing/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi auth Gateway.

Jalur auth HTTP yang umum:

- auth shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- auth HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar-identitas yang dikonfigurasi dan biarkan proxy itu menyuntikkan
  header identitas yang diperlukan
- auth terbuka private-ingress (`gateway.auth.mode="none"`):
  tidak memerlukan header auth

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber proxy tepercaya yang dikonfigurasi; proxy loopback host-sama memerlukan
  `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Pemanggil internal host-sama yang melewati proxy dapat menggunakan
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai fallback langsung lokal.
  Bukti header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP` apa pun
  membuat permintaan tetap berada di jalur trusted-proxy.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terjadi terlalu banyak kegagalan auth, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Auth bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Permintaan berjalan melalui jalur agent control-plane yang sama seperti tindakan operator tepercaya.
- Tidak ada batas tool non-pemilik/per pengguna yang terpisah pada endpoint ini; begitu pemanggil lolos auth Gateway di sini, OpenClaw memperlakukan pemanggil itu sebagai operator tepercaya untuk gateway ini.
- Untuk mode auth shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP tepercaya yang membawa identitas (misalnya auth trusted proxy atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` saat ada dan jika tidak, fallback ke set cakupan default operator normal.
- Jika kebijakan agent target mengizinkan tool sensitif, endpoint ini dapat menggunakannya.
- Pertahankan endpoint ini hanya di loopback/tailnet/private ingress; jangan paparkan langsung ke internet publik.

Matriks auth:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan shared gateway operator secret
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran owner-sender
- mode HTTP tepercaya yang membawa identitas (misalnya auth trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - mengautentikasi identitas tepercaya luar atau batas deployment tertentu
  - menghormati `x-openclaw-scopes` saat header ada
  - fallback ke set cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik pemilik saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`
  - memerlukan `operator.admin` untuk kontrol permintaan tingkat pemilik seperti `x-openclaw-model`

Lihat [Keamanan](/id/gateway/security) dan [Akses jarak jauh](/id/gateway/remote).

## Kapan menggunakan endpoint ini

Gunakan `/v1/chat/completions` saat Anda mengintegrasikan tooling atau backend sisi aplikasi tepercaya dengan gateway yang sudah ada dan dapat menyimpan kredensial operator gateway dengan aman.

- Lebih pilih ini daripada menambahkan channel bawaan baru saat integrasi Anda hanyalah permukaan operator/klien lain untuk gateway yang sama.
- Untuk klien mobile native yang terhubung langsung ke gateway jarak jauh, lebih pilih [WebChat](/id/web/webchat) atau [Protokol Gateway](/id/gateway/protocol) dan implementasikan alur bootstrap perangkat-terpasang/token-perangkat agar perangkat tidak memerlukan token/kata sandi HTTP bersama.
- Bangun Plugin channel sebagai gantinya saat Anda mengintegrasikan jaringan pesan eksternal dengan pengguna, room, pengiriman Webhook, atau transport keluar miliknya sendiri. Lihat [Membangun plugin](/id/plugins/building-plugins).

## Kontrak model agent-first

OpenClaw memperlakukan field OpenAI `model` sebagai **target agent**, bukan id model provider mentah.

- `model: "openclaw"` merutekan ke agent default yang dikonfigurasi.
- `model: "openclaw/default"` juga merutekan ke agent default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` merutekan ke agent tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` mengganti model backend untuk agent yang dipilih. Pemanggil bearer shared-secret dapat menggunakan header ini. Pemanggil yang membawa identitas, seperti trusted-proxy atau permintaan private no-auth ingress dengan `x-openclaw-scopes`, memerlukan `operator.admin`; pemanggil write-only mendapatkan `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai override kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` secara eksplisit mengontrol routing sesi. Nilai tidak boleh menggunakan namespace sesi internal yang dicadangkan seperti `subagent:`, `cron:`, atau `acp:`; permintaan tersebut ditolak dengan `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` menetapkan konteks channel ingress sintetis untuk prompt dan kebijakan yang sadar-channel.

Alias kompatibilitas yang masih diterima:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Mengaktifkan endpoint

Setel `gateway.http.endpoints.chatCompletions.enabled` ke `true`:

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

Setel `gateway.http.endpoints.chatCompletions.enabled` ke `false`:

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

Jika permintaan menyertakan string OpenAI `user`, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi sesi agent.

Untuk aplikasi kustom, default paling aman adalah menggunakan ulang nilai `user` yang sama per thread percakapan. Hindari pengidentifikasi tingkat akun kecuali Anda secara eksplisit ingin beberapa percakapan atau perangkat berbagi satu sesi OpenClaw. Gunakan `x-openclaw-session-key` hanya saat Anda memerlukan kontrol routing eksplisit di beberapa klien atau thread, dan pilih kunci milik aplikasi yang tidak diawali dengan namespace internal yang dicadangkan seperti `subagent:`, `cron:`, atau `acp:`.

## Mengapa permukaan ini penting

Ini adalah set kompatibilitas dengan leverage tertinggi untuk frontend self-hosted dan tooling:

- Sebagian besar setup Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang sudah ada biasanya dapat memulai dengan `/v1/chat/completions`.
- Klien yang lebih agent-native semakin memilih `/v1/responses`.

## Daftar model dan routing agent

<AccordionGroup>
  <Accordion title="Apa yang dikembalikan `/v1/models`?">
    Daftar target agent OpenClaw.

    Id yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai OpenAI `model`.

  </Accordion>
  <Accordion title="Apakah `/v1/models` mencantumkan agent atau sub-agent?">
    Ini mencantumkan target agent tingkat atas, bukan model provider backend dan bukan sub-agent.

    Sub-agent tetap menjadi topologi eksekusi internal. Mereka tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Mengapa `openclaw/default` disertakan?">
    `openclaw/default` adalah alias stabil untuk agent default yang dikonfigurasi.

    Itu berarti klien dapat terus menggunakan satu id yang dapat diprediksi meskipun id agent default sebenarnya berubah antar lingkungan.

  </Accordion>
  <Accordion title="Bagaimana cara mengganti model backend?">
    Gunakan `x-openclaw-model`. Ini adalah override tingkat pemilik: bekerja dengan jalur token/kata sandi bearer shared-secret Gateway, dan memerlukan `operator.admin` pada jalur HTTP yang membawa identitas seperti auth trusted proxy.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jika Anda menghilangkannya, agent yang dipilih berjalan dengan pilihan model normal yang dikonfigurasi.

  </Accordion>
  <Accordion title="Bagaimana embeddings cocok dengan kontrak ini?">
    `/v1/embeddings` menggunakan id `model` target agent yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda memerlukan model embedding tertentu, kirimkan di `x-openclaw-model` dari pemanggil shared-secret atau pemanggil yang membawa identitas dengan `operator.admin`.
    Tanpa header tersebut, permintaan diteruskan ke setup embedding normal agent yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setel `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Kontrak tool chat

`/v1/chat/completions` mendukung subset function-tool yang kompatibel dengan klien Chat OpenAI umum.

### Field permintaan yang didukung

- `tools`: array dari `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"`, atau `{ "type": "function", "function": { "name": "..." } }`
- giliran tindak lanjut `messages[*].role: "tool"`
- `messages[*].tool_call_id` untuk mengikat hasil tool kembali ke panggilan tool sebelumnya
- `max_completion_tokens`: angka; batas per panggilan untuk total token penyelesaian (termasuk token reasoning). Nama field OpenAI Chat Completions saat ini; lebih disukai saat `max_completion_tokens` dan `max_tokens` dikirim bersamaan.
- `max_tokens`: angka; alias legacy diterima untuk kompatibilitas mundur. Diabaikan saat `max_completion_tokens` juga ada.
- `temperature`: angka; suhu sampling best-effort diteruskan ke provider upstream melalui channel stream-param agent.
- `top_p`: angka; sampling nucleus best-effort diteruskan ke provider upstream melalui channel stream-param agent.
- `frequency_penalty`: angka; penalti frekuensi best-effort diteruskan ke provider upstream melalui channel stream-param agent. Rentang tervalidasi: -2.0 hingga 2.0. Mengembalikan `400 invalid_request_error` untuk nilai di luar rentang.
- `presence_penalty`: angka; penalti presence best-effort diteruskan ke provider upstream melalui channel stream-param agent. Rentang tervalidasi: -2.0 hingga 2.0. Mengembalikan `400 invalid_request_error` untuk nilai di luar rentang.
- `seed`: angka (integer); seed best-effort diteruskan ke provider upstream melalui channel stream-param agent. Mengembalikan `400 invalid_request_error` untuk nilai non-integer.
- `stop`: string atau array hingga 4 string; rangkaian stop best-effort diteruskan ke provider upstream melalui channel stream-param agent. Mengembalikan `400 invalid_request_error` untuk lebih dari 4 rangkaian atau entri non-string/kosong.

Ketika salah satu field batas token diatur, nilainya diteruskan ke penyedia upstream melalui kanal stream-param agent. Nama field wire aktual yang dikirim ke penyedia upstream dipilih oleh transport penyedia: `max_completion_tokens` untuk endpoint keluarga OpenAI, dan `max_tokens` untuk penyedia yang hanya menerima nama legacy (seperti Mistral dan Chutes). Field sampling (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) mengikuti kanal stream-param yang sama; backend Codex Responses berbasis ChatGPT menghapusnya di sisi server karena menggunakan sampling tetap. `stop` juga melewati kanal stream-param dan dipetakan ke field stop milik transport (`stop` untuk backend Chat Completions, `stop_sequences` untuk Anthropic); OpenAI Responses API tidak memiliki parameter stop, sehingga `stop` tidak diterapkan pada model berbasis Responses.

### Varian yang tidak didukung

Endpoint mengembalikan `400 invalid_request_error` untuk varian tool yang tidak didukung, termasuk:

- `tools` yang bukan array
- entri tool yang bukan function
- `tool.function.name` yang hilang
- varian `tool_choice` seperti `allowed_tools` dan `custom`
- nilai `tool_choice.function.name` yang tidak cocok dengan `tools` yang diberikan

Untuk `tool_choice: "required"` dan `tool_choice` yang dipasangkan ke function, endpoint mempersempit set function-tool klien yang diekspos, menginstruksikan runtime untuk memanggil tool klien sebelum merespons, dan mengembalikan error jika respons agent tidak menyertakan panggilan client-tool terstruktur yang cocok. Kontrak ini berlaku untuk daftar HTTP `tools` yang diberikan pemanggil, bukan setiap tool agent internal OpenClaw.

### Bentuk respons tool non-streaming

Ketika agent memutuskan untuk memanggil tool, respons menggunakan:

- entri `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` dengan:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (string JSON)

Komentar assistant sebelum panggilan tool dikembalikan di `choices[0].message.content` (mungkin kosong).

### Bentuk respons tool streaming

Ketika `stream: true`, panggilan tool dipancarkan sebagai chunk SSE inkremental:

- delta role assistant awal
- delta komentar assistant opsional
- satu atau lebih chunk `delta.tool_calls` yang membawa identitas tool dan fragmen argumen
- chunk akhir dengan `finish_reason: "tool_calls"`
- `data: [DONE]`

Jika `stream_options.include_usage=true`, chunk penggunaan penutup dipancarkan sebelum `[DONE]`.

### Loop tindak lanjut tool

Setelah menerima `tool_calls`, klien harus menjalankan function yang diminta dan mengirim permintaan tindak lanjut yang menyertakan:

- pesan tool-call assistant sebelumnya
- satu atau lebih pesan `role: "tool"` dengan `tool_call_id` yang cocok

Ini memungkinkan eksekusi agent gateway melanjutkan loop penalaran yang sama dan menghasilkan jawaban assistant final.

## Penyiapan cepat Open WebUI

Untuk koneksi Open WebUI dasar:

- URL dasar: `http://127.0.0.1:18789/v1`
- URL dasar Docker di macOS: `http://host.docker.internal:18789/v1`
- Kunci API: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan:

- `GET /v1/models` harus mencantumkan `openclaw/default`
- Open WebUI harus menggunakan `openclaw/default` sebagai id model chat
- Jika Anda menginginkan penyedia/model backend tertentu untuk agent tersebut, atur model default normal milik agent atau kirim `x-openclaw-model` dari pemanggil shared-secret atau pemanggil dengan identitas yang memiliki `operator.admin`

Smoke cepat:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jika itu mengembalikan `openclaw/default`, sebagian besar penyiapan Open WebUI dapat tersambung dengan URL dasar dan token yang sama.

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

Gunakan kembali nilai `user` yang sama pada panggilan berikutnya untuk percakapan itu agar melanjutkan sesi agent yang sama.

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

- `/v1/models` mengembalikan target agent OpenClaw, bukan katalog penyedia mentah.
- `openclaw/default` selalu ada sehingga satu id stabil berfungsi di berbagai lingkungan.
- Override penyedia/model backend berada di `x-openclaw-model`, bukan field OpenAI `model`. Pada jalur autentikasi HTTP dengan identitas, header ini memerlukan `operator.admin`.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [OpenAI](/id/providers/openai)
