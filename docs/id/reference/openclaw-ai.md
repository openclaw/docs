---
read_when:
    - Anda ingin menggunakan kembali transport model OpenClaw di aplikasi lain
    - Anda sedang mengubah packages/ai atau port host transport AI
    - Anda sedang meninjau apa saja yang dipublikasikan rilis OpenClaw ke npm selain paket root
summary: 'Paket npm @openclaw/ai: transport model yang dapat digunakan kembali, runtime terisolasi, dan port kebijakan host'
title: Paket @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T14:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` adalah bentuk pustaka yang dapat dipublikasikan dari lapisan eksekusi
model OpenClaw: kontrak pesan/alat/aliran yang netral terhadap penyedia, validasi, diagnostik,
aliran peristiwa, registri runtime terisolasi, dan adaptor yang dimuat secara bertahap untuk delapan
keluarga API bawaan (Anthropic Messages, OpenAI Completions, OpenAI
Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative
AI, Google Vertex, Mistral Conversations).

Pustaka ini dipublikasikan bersama paket akar `openclaw` pada setiap rilis, disematkan ke
versi yang sama, dengan `npm-shrinkwrap.json` sendiri sehingga pohon
dependensi transitifnya dikunci saat instalasi. Menginstal `openclaw` akan menginstal
`@openclaw/ai` yang sesuai secara otomatis; pengguna pustaka dapat menjadikannya dependensi
secara langsung tanpa kode aplikasi OpenClaw apa pun.

## Mulai cepat

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Versi yang dapat dijalankan tersedia di repositori pada `examples/ai-chat`.

## Kontrak desain

- **Secara bawaan tercakup per instans.** Mengimpor paket tidak mendaftarkan apa pun
  secara global. `createApiRegistry()` / `createLlmRuntime()` mengembalikan instans
  terisolasi; `registerBuiltInApiProviders(registry)` mengikutsertakan satu registri ke dalam
  transport bawaan. Modul SDK penyedia dimuat secara bertahap saat pertama kali digunakan.
- **Kebijakan host disuntikkan, bukan dibundel.** Perlindungan pengambilan permintaan (misalnya
  kebijakan SSRF), penyamaran rahasia pada teks pemutaran ulang hasil alat, nilai bawaan alat ketat
  OpenAI, dan pencatatan diagnostik merupakan port `AiTransportHost`
  yang dikonfigurasi dengan `configureAiTransportHost`. Nilai bawaan pustaka tidak aktif;
  OpenClaw memasang implementasi nyatanya di fasad alirannya.
- **Satu identitas aliran peristiwa.** `@openclaw/ai/event-stream` adalah konstruktor
  `EventStream` kanonis yang digunakan bersama oleh inti OpenClaw, inti agen, dan pengguna
  eksternal.
- **Subjalur `internal/*` bukan API.** Subjalur tersebut tersedia untuk aplikasi OpenClaw
  itu sendiri dan tidak memiliki jaminan semver.
- ID penyedia, kredensial, katalog model, percobaan ulang, dan pengalihan saat kegagalan tetap menjadi
  urusan aplikasi. OpenClaw melapiskan hal-hal tersebut di sekitar paket ini; pengguna pustaka
  menyediakan objek `Model` dan opsi secara langsung.

## Ekspor subjalur

| Subjalur         | Isi                                                                            |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Kontrak, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost`    |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Jenis model/pesan/alat/aliran                                                  |
| `./validation`   | Validasi argumen alat                                                          |
| `./diagnostics`  | Kontrak diagnostik                                                             |
| `./event-stream` | Implementasi `EventStream` bersama                                             |
| `./internal/*`   | Internal OpenClaw, tanpa jaminan semver                                        |
