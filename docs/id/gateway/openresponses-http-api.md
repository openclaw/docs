---
read_when:
    - Mengintegrasikan klien yang berbicara dengan API OpenResponses
    - Anda menginginkan input berbasis item, pemanggilan alat sisi klien, atau event SSE
summary: Mengekspos endpoint HTTP `/v1/responses` yang kompatibel dengan OpenResponses dari Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-05T13:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

Gateway OpenClaw dapat menyajikan endpoint `POST /v1/responses` yang kompatibel dengan OpenResponses.

Endpoint ini **nonaktif secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/responses`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Di balik layar, request dijalankan sebagai proses agen Gateway biasa (jalur kode yang sama dengan
`openclaw agent`), sehingga perutean/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi, keamanan, dan perutean

Perilaku operasional cocok dengan [OpenAI Chat Completions](/gateway/openai-http-api):

- gunakan jalur autentikasi HTTP Gateway yang sesuai:
  - autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`): `Authorization: Bearer <token-or-password>`
  - autentikasi trusted-proxy (`gateway.auth.mode="trusted-proxy"`): header proxy yang sadar identitas dari sumber trusted proxy non-loopback yang dikonfigurasi
  - autentikasi terbuka private-ingress (`gateway.auth.mode="none"`): tanpa header autentikasi
- perlakukan endpoint ini sebagai akses operator penuh untuk instans gateway
- untuk mode autentikasi shared-secret (`token` dan `password`), abaikan nilai `x-openclaw-scopes` yang dideklarasikan bearer dan lebih sempit, lalu pulihkan default operator penuh yang normal
- untuk mode HTTP terpercaya yang membawa identitas (misalnya autentikasi trusted proxy atau `gateway.auth.mode="none"`), hormati `x-openclaw-scopes` bila ada dan jika tidak fallback ke set cakupan default operator normal
- pilih agen dengan `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, atau `x-openclaw-agent-id`
- gunakan `x-openclaw-model` saat Anda ingin menimpa model backend agen yang dipilih
- gunakan `x-openclaw-session-key` untuk perutean sesi eksplisit
- gunakan `x-openclaw-message-channel` saat Anda menginginkan konteks channel ingress sintetis non-default

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan shared secret operator gateway
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran pengirim pemilik
- mode HTTP terpercaya yang membawa identitas (misalnya autentikasi trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - menghormati `x-openclaw-scopes` saat header ada
  - fallback ke set cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik pemilik saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Aktifkan atau nonaktifkan endpoint ini dengan `gateway.http.endpoints.responses.enabled`.

Permukaan kompatibilitas yang sama juga mencakup:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Untuk penjelasan kanonis tentang bagaimana model target agen, `openclaw/default`, pass-through embeddings, dan override model backend saling terkait, lihat [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) dan [Daftar model dan perutean agen](/gateway/openai-http-api#model-list-and-agent-routing).

## Perilaku sesi

Secara default endpoint ini **tanpa status per request** (kunci sesi baru dibuat pada setiap panggilan).

Jika request menyertakan string `user` OpenResponses, Gateway menurunkan kunci sesi stabil
darinya, sehingga panggilan berulang dapat berbagi sesi agen.

## Bentuk request (didukung)

Request mengikuti API OpenResponses dengan input berbasis item. Dukungan saat ini:

- `input`: string atau array objek item.
- `instructions`: digabungkan ke prompt sistem.
- `tools`: definisi alat sisi klien (alat function).
- `tool_choice`: memfilter atau mewajibkan alat sisi klien.
- `stream`: mengaktifkan streaming SSE.
- `max_output_tokens`: batas output best-effort (bergantung provider).
- `user`: perutean sesi stabil.

Diterima tetapi **saat ini diabaikan**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Didukung:

- `previous_response_id`: OpenClaw menggunakan ulang sesi respons sebelumnya saat request tetap berada dalam cakupan agen/pengguna/sesi yang diminta yang sama.

## Item (`input`)

### `message`

Role: `system`, `developer`, `user`, `assistant`.

- `system` dan `developer` ditambahkan ke prompt sistem.
- Item `user` atau `function_call_output` terbaru menjadi “pesan saat ini”.
- Pesan user/asisten sebelumnya disertakan sebagai riwayat untuk konteks.

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

## Alat (alat function sisi klien)

Sediakan alat dengan `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jika agen memutuskan untuk memanggil alat, respons mengembalikan item output `function_call`.
Kemudian Anda mengirim request lanjutan dengan `function_call_output` untuk melanjutkan giliran.

## Gambar (`input_image`)

Mendukung sumber base64 atau URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipe MIME yang diizinkan (saat ini): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
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

Tipe MIME yang diizinkan (saat ini): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Ukuran maksimum (saat ini): 5MB.

Perilaku saat ini:

- Konten file didekode dan ditambahkan ke **prompt sistem**, bukan pesan pengguna,
  sehingga tetap bersifat sementara (tidak disimpan dalam riwayat sesi).
- Teks file yang didekode dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan,
  sehingga byte file diperlakukan sebagai data, bukan instruksi tepercaya.
- Blok yang disisipkan menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur input file ini sengaja menghilangkan banner `SECURITY NOTICE:` yang panjang untuk
  mempertahankan anggaran prompt; penanda batas dan metadata tetap dipertahankan.
- PDF diurai untuk teks terlebih dahulu. Jika sedikit teks ditemukan, halaman awal akan
  dirasterisasi menjadi gambar dan diteruskan ke model, dan blok file yang disisipkan menggunakan
  placeholder `[PDF content rendered to images]`.

Penguraian PDF menggunakan build legacy `pdfjs-dist` yang ramah Node (tanpa worker). Build
PDF.js modern mengharapkan worker browser/global DOM, sehingga tidak digunakan di Gateway.

Default pengambilan URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (jumlah total bagian `input_file` + `input_image` berbasis URL per request)
- Request dilindungi (resolusi DNS, pemblokiran IP privat, batas redirect, timeout).
- Allowlist hostname opsional didukung per tipe input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host persis: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (tidak cocok dengan apex)
  - Allowlist kosong atau tidak diberikan berarti tidak ada pembatasan allowlist hostname.
- Untuk menonaktifkan sepenuhnya pengambilan berbasis URL, setel `files.allowUrl: false` dan/atau `images.allowUrl: false`.

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
- Sumber `input_image` HEIC/HEIF diterima dan dinormalisasi ke JPEG sebelum dikirim ke provider.

Catatan keamanan:

- Allowlist URL ditegakkan sebelum pengambilan dan pada lompatan redirect.
- Mengizinkan sebuah hostname tidak melewati pemblokiran IP privat/internal.
- Untuk gateway yang terekspos ke internet, terapkan kontrol egress jaringan selain perlindungan tingkat aplikasi.
  Lihat [Security](/gateway/security).

## Streaming (SSE)

Setel `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `event: <type>` dan `data: <json>`
- Stream diakhiri dengan `data: [DONE]`

Tipe event yang saat ini dikirim:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (saat terjadi kesalahan)

## Penggunaan

`usage` diisi saat provider yang mendasari melaporkan jumlah token.
OpenClaw menormalkan alias umum bergaya OpenAI sebelum penghitung tersebut mencapai
permukaan status/sesi hilir, termasuk `input_tokens` / `output_tokens`
dan `prompt_tokens` / `completion_tokens`.

## Error

Error menggunakan objek JSON seperti:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Kasus umum:

- `401` autentikasi hilang/tidak valid
- `400` body request tidak valid
- `405` method salah

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
