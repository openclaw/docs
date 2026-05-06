---
read_when:
    - Mengintegrasikan klien yang menggunakan OpenResponses API
    - Anda menginginkan input berbasis item, pemanggilan alat klien, atau peristiwa SSE
summary: Ekspos endpoint HTTP /v1/responses yang kompatibel dengan OpenResponses dari Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-05-06T09:12:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway dapat menyediakan endpoint `POST /v1/responses` yang kompatibel dengan OpenResponses.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/responses`
- Port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Di balik layar, permintaan dijalankan sebagai run agent Gateway normal (jalur kode yang sama dengan
`openclaw agent`), sehingga routing/izin/konfigurasi sesuai dengan Gateway Anda.

## Autentikasi, keamanan, dan routing

Perilaku operasional sesuai dengan [OpenAI Chat Completions](/id/gateway/openai-http-api):

- gunakan jalur autentikasi HTTP Gateway yang sesuai:
  - autentikasi rahasia bersama (`gateway.auth.mode="token"` atau `"password"`): `Authorization: Bearer <token-or-password>`
  - autentikasi proxy tepercaya (`gateway.auth.mode="trusted-proxy"`): header proxy sadar-identitas dari sumber proxy tepercaya yang dikonfigurasi; proxy local loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit
  - autentikasi terbuka private-ingress (`gateway.auth.mode="none"`): tanpa header autentikasi
- perlakukan endpoint sebagai akses operator penuh untuk instance gateway
- untuk mode autentikasi rahasia bersama (`token` dan `password`), abaikan nilai `x-openclaw-scopes` lebih sempit yang dideklarasikan bearer dan pulihkan default operator penuh yang normal
- untuk mode HTTP pembawa identitas tepercaya (misalnya autentikasi proxy tepercaya atau `gateway.auth.mode="none"`), hormati `x-openclaw-scopes` jika ada dan jika tidak, kembali ke set scope default operator normal
- pilih agent dengan `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, atau `x-openclaw-agent-id`
- gunakan `x-openclaw-model` ketika Anda ingin menimpa model backend agent yang dipilih
- gunakan `x-openclaw-session-key` untuk routing sesi eksplisit
- gunakan `x-openclaw-message-channel` ketika Anda menginginkan konteks channel ingress sintetis non-default

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set scope operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran owner-sender
- mode HTTP pembawa identitas tepercaya (misalnya autentikasi proxy tepercaya, atau `gateway.auth.mode="none"` pada ingress privat)
  - menghormati `x-openclaw-scopes` ketika header ada
  - kembali ke set scope default operator normal ketika header tidak ada
  - hanya kehilangan semantik owner ketika pemanggil secara eksplisit mempersempit scope dan menghilangkan `operator.admin`

Aktifkan atau nonaktifkan endpoint ini dengan `gateway.http.endpoints.responses.enabled`.

Permukaan kompatibilitas yang sama juga mencakup:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Untuk penjelasan kanonis tentang bagaimana model target-agent, `openclaw/default`, pass-through embeddings, dan penimpaan model backend bekerja bersama, lihat [OpenAI Chat Completions](/id/gateway/openai-http-api#agent-first-model-contract) dan [Daftar model dan routing agent](/id/gateway/openai-http-api#model-list-and-agent-routing).

## Perilaku sesi

Secara default endpoint ini **stateless per permintaan** (kunci sesi baru dibuat untuk setiap panggilan).

Jika permintaan menyertakan string `user` OpenResponses, Gateway menurunkan kunci sesi stabil
darinya, sehingga panggilan berulang dapat berbagi sesi agent.

## Bentuk permintaan (didukung)

Permintaan mengikuti API OpenResponses dengan input berbasis item. Dukungan saat ini:

- `input`: string atau array objek item.
- `instructions`: digabungkan ke dalam prompt sistem.
- `tools`: definisi tool klien (tool fungsi).
- `tool_choice`: memfilter atau mewajibkan tool klien.
- `stream`: mengaktifkan streaming SSE.
- `max_output_tokens`: batas output best-effort (bergantung provider).
- `user`: routing sesi stabil.

Diterima tetapi **saat ini diabaikan**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Didukung:

- `previous_response_id`: OpenClaw menggunakan ulang sesi respons sebelumnya ketika permintaan tetap berada dalam scope agent/user/sesi-diminta yang sama.

## Item (input)

### `message`

Peran: `system`, `developer`, `user`, `assistant`.

- `system` dan `developer` ditambahkan ke prompt sistem.
- Item `user` atau `function_call_output` terbaru menjadi "pesan saat ini."
- Pesan user/assistant sebelumnya disertakan sebagai riwayat untuk konteks.

### `function_call_output` (tool berbasis giliran)

Kirim hasil tool kembali ke model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` dan `item_reference`

Diterima untuk kompatibilitas skema tetapi diabaikan saat membangun prompt.

## Tool (tool fungsi sisi klien)

Sediakan tool dengan `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jika agent memutuskan untuk memanggil tool, respons mengembalikan item output `function_call`.
Kemudian Anda mengirim permintaan lanjutan dengan `function_call_output` untuk melanjutkan giliran.

## Gambar (`input_image`)

Mendukung sumber base64 atau URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Jenis MIME yang diizinkan (saat ini): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Ukuran maksimum (saat ini): 10MB.

## File (`input_file`)

Mendukung sumber base64 atau URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Jenis MIME yang diizinkan (saat ini): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Ukuran maksimum (saat ini): 5MB.

Perilaku saat ini:

- Konten file didekode dan ditambahkan ke **prompt sistem**, bukan pesan user,
  sehingga tetap sementara (tidak dipertahankan dalam riwayat sesi).
- Teks file yang didekode dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan,
  sehingga byte file diperlakukan sebagai data, bukan instruksi tepercaya.
- Blok yang diinjeksi menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur input-file ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` untuk
  menjaga anggaran prompt; penanda batas dan metadata tetap ada.
- PDF diuraikan untuk teks terlebih dahulu. Jika hanya sedikit teks ditemukan, halaman pertama
  dirasterisasi menjadi gambar dan diteruskan ke model, dan blok file yang diinjeksi menggunakan
  placeholder `[PDF content rendered to images]`.

Parsing PDF disediakan oleh Plugin `document-extract` yang dibundel, yang menggunakan build legacy
`pdfjs-dist` yang ramah Node (tanpa worker). Build PDF.js modern
mengharapkan worker browser/global DOM, sehingga tidak digunakan di Gateway.

Default fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total bagian `input_file` + `input_image` berbasis URL per permintaan)
- Permintaan dijaga (resolusi DNS, pemblokiran IP privat, batas redirect, timeout).
- Allowlist hostname opsional didukung per jenis input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host persis: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (tidak cocok dengan apex)
  - Allowlist kosong atau dihilangkan berarti tidak ada pembatasan allowlist hostname.
- Untuk menonaktifkan fetch berbasis URL sepenuhnya, setel `files.allowUrl: false` dan/atau `images.allowUrl: false`.

## Batas file + gambar (konfigurasi)

Default dapat disetel di bawah `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

Default ketika dihilangkan:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Sumber HEIC/HEIF `input_image` diterima dan dinormalisasi menjadi JPEG sebelum dikirim ke provider.

Catatan keamanan:

- Allowlist URL diberlakukan sebelum fetch dan pada hop redirect.
- Memasukkan hostname ke allowlist tidak melewati pemblokiran IP privat/internal.
- Untuk gateway yang terekspos internet, terapkan kontrol egress jaringan selain penjaga tingkat aplikasi.
  Lihat [Keamanan](/id/gateway/security).

## Streaming (SSE)

Setel `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `event: <type>` dan `data: <json>`
- Stream berakhir dengan `data: [DONE]`

Jenis event yang saat ini dipancarkan:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (saat error)

## Penggunaan

`usage` diisi ketika provider dasar melaporkan jumlah token.
OpenClaw menormalisasi alias umum bergaya OpenAI sebelum counter tersebut mencapai
permukaan status/sesi downstream, termasuk `input_tokens` / `output_tokens`
dan `prompt_tokens` / `completion_tokens`.

## Error

Error menggunakan objek JSON seperti:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Kasus umum:

- `401` autentikasi hilang/tidak valid
- `400` body permintaan tidak valid
- `405` metode salah

## Contoh

Non-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Terkait

- [OpenAI chat completions](/id/gateway/openai-http-api)
- [OpenAI](/id/providers/openai)
