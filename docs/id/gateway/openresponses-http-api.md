---
read_when:
    - Mengintegrasikan klien yang menggunakan OpenResponses API
    - Anda menginginkan input berbasis item, panggilan alat klien, atau peristiwa SSE
summary: Ekspos titik akhir HTTP /v1/responses yang kompatibel dengan OpenResponses dari Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-30T09:50:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway OpenClaw dapat menyajikan endpoint `POST /v1/responses` yang kompatibel dengan OpenResponses.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/responses`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Di balik layar, permintaan dieksekusi sebagai proses jalan agen Gateway normal (codepath yang sama seperti
`openclaw agent`), sehingga routing/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi, keamanan, dan routing

Perilaku operasional cocok dengan [OpenAI Chat Completions](/id/gateway/openai-http-api):

- gunakan jalur autentikasi HTTP Gateway yang sesuai:
  - autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`): `Authorization: Bearer <token-or-password>`
  - autentikasi trusted-proxy (`gateway.auth.mode="trusted-proxy"`): header proxy sadar-identitas dari sumber proxy tepercaya yang dikonfigurasi; proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit
  - autentikasi terbuka private-ingress (`gateway.auth.mode="none"`): tanpa header autentikasi
- perlakukan endpoint sebagai akses operator penuh untuk instans gateway
- untuk mode autentikasi shared-secret (`token` dan `password`), abaikan nilai `x-openclaw-scopes` yang lebih sempit yang dinyatakan bearer dan pulihkan default operator penuh yang normal
- untuk mode HTTP yang membawa identitas tepercaya (misalnya autentikasi trusted proxy atau `gateway.auth.mode="none"`), hormati `x-openclaw-scopes` saat ada dan jika tidak, kembali ke kumpulan cakupan default operator normal
- pilih agen dengan `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, atau `x-openclaw-agent-id`
- gunakan `x-openclaw-model` saat Anda ingin menimpa model backend agen yang dipilih
- gunakan `x-openclaw-session-key` untuk routing sesi eksplisit
- gunakan `x-openclaw-message-channel` saat Anda menginginkan konteks kanal masuk sintetis non-default

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan kumpulan cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran owner-sender
- mode HTTP yang membawa identitas tepercaya (misalnya autentikasi trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - menghormati `x-openclaw-scopes` saat header ada
  - kembali ke kumpulan cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik owner saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Aktifkan atau nonaktifkan endpoint ini dengan `gateway.http.endpoints.responses.enabled`.

Permukaan kompatibilitas yang sama juga mencakup:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Untuk penjelasan kanonis tentang bagaimana model target agen, `openclaw/default`, pass-through embeddings, dan penimpaan model backend saling terkait, lihat [OpenAI Chat Completions](/id/gateway/openai-http-api#agent-first-model-contract) dan [Daftar model dan routing agen](/id/gateway/openai-http-api#model-list-and-agent-routing).

## Perilaku sesi

Secara default endpoint ini **stateless per permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string OpenResponses `user`, Gateway menurunkan kunci sesi stabil
darinya, sehingga panggilan berulang dapat berbagi sesi agen.

## Bentuk permintaan (didukung)

Permintaan mengikuti API OpenResponses dengan input berbasis item. Dukungan saat ini:

- `input`: string atau array objek item.
- `instructions`: digabungkan ke prompt sistem.
- `tools`: definisi alat klien (alat fungsi).
- `tool_choice`: memfilter atau mewajibkan alat klien.
- `stream`: mengaktifkan streaming SSE.
- `max_output_tokens`: batas output upaya terbaik (bergantung provider).
- `user`: routing sesi stabil.

Diterima tetapi **saat ini diabaikan**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Didukung:

- `previous_response_id`: OpenClaw menggunakan kembali sesi respons sebelumnya saat permintaan tetap berada dalam cakupan agen/pengguna/sesi-diminta yang sama.

## Item (input)

### `message`

Peran: `system`, `developer`, `user`, `assistant`.

- `system` dan `developer` ditambahkan ke prompt sistem.
- Item `user` atau `function_call_output` terbaru menjadi “pesan saat ini.”
- Pesan pengguna/asisten sebelumnya disertakan sebagai riwayat untuk konteks.

### `function_call_output` (alat berbasis giliran)

Kirim hasil alat kembali ke model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` dan `item_reference`

Diterima untuk kompatibilitas skema tetapi diabaikan saat membangun prompt.

## Alat (alat fungsi sisi-klien)

Sediakan alat dengan `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jika agen memutuskan untuk memanggil alat, respons mengembalikan item output `function_call`.
Kemudian kirim permintaan lanjutan dengan `function_call_output` untuk melanjutkan giliran.

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

- Konten file didekode dan ditambahkan ke **prompt sistem**, bukan pesan pengguna,
  sehingga tetap efemeral (tidak dipertahankan dalam riwayat sesi).
- Teks file yang didekode dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan,
  sehingga byte file diperlakukan sebagai data, bukan instruksi tepercaya.
- Blok yang disisipkan menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur input file ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` untuk
  menjaga anggaran prompt; penanda batas dan metadata tetap dipertahankan.
- PDF diurai untuk teks terlebih dahulu. Jika hanya sedikit teks yang ditemukan, halaman pertama
  dirasterisasi menjadi gambar dan diteruskan ke model, dan blok file yang disisipkan menggunakan
  placeholder `[PDF content rendered to images]`.

Penguraian PDF disediakan oleh Plugin `document-extract` bawaan, yang menggunakan build legacy
`pdfjs-dist` yang ramah Node (tanpa worker). Build PDF.js modern
mengharapkan worker browser/global DOM, sehingga tidak digunakan di Gateway.

Default pengambilan URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total bagian `input_file` + `input_image` berbasis URL per permintaan)
- Permintaan dijaga (resolusi DNS, pemblokiran IP privat, batas redirect, timeout).
- Allowlist hostname opsional didukung per jenis input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host persis: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (tidak cocok dengan apex)
  - Allowlist kosong atau dihilangkan berarti tidak ada pembatasan allowlist hostname.
- Untuk menonaktifkan pengambilan berbasis URL sepenuhnya, tetapkan `files.allowUrl: false` dan/atau `images.allowUrl: false`.

## Batas file + gambar (konfigurasi)

Default dapat disesuaikan di bawah `gateway.http.endpoints.responses`:

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

Default saat dihilangkan:

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
- Sumber `input_image` HEIC/HEIF diterima dan dinormalisasi ke JPEG sebelum pengiriman ke provider.

Catatan keamanan:

- Allowlist URL diberlakukan sebelum pengambilan dan pada hop redirect.
- Memasukkan hostname ke allowlist tidak melewati pemblokiran IP privat/internal.
- Untuk gateway yang terpapar internet, terapkan kontrol egress jaringan selain penjaga tingkat aplikasi.
  Lihat [Keamanan](/id/gateway/security).

## Streaming (SSE)

Tetapkan `stream: true` untuk menerima Server-Sent Events (SSE):

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

`usage` diisi saat provider yang mendasarinya melaporkan jumlah token.
OpenClaw menormalkan alias umum bergaya OpenAI sebelum penghitung tersebut mencapai
permukaan status/sesi downstream, termasuk `input_tokens` / `output_tokens`
dan `prompt_tokens` / `completion_tokens`.

## Error

Error menggunakan objek JSON seperti:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Kasus umum:

- `401` autentikasi hilang/tidak valid
- `400` isi permintaan tidak valid
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
