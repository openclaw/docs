---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model GMI Cloud
    - Anda memerlukan id, kunci, atau endpoint penyedia GMI
summary: Gunakan API GMI Cloud yang kompatibel dengan OpenAI bersama OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:04:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud adalah platform inferensi terkelola untuk model frontier dan open-weight
di balik API yang kompatibel dengan OpenAI. Di OpenClaw, ini adalah Plugin
penyedia eksternal resmi, yang berarti Anda menginstalnya sekali, memilihnya
dengan id penyedia `gmi`, menyimpan kredensial melalui autentikasi model normal,
dan menggunakan referensi model seperti `gmi/google/gemini-3.1-flash-lite`.

Gunakan GMI saat Anda menginginkan satu kunci API untuk beberapa keluarga model
terkelola, termasuk rute Google, Anthropic, OpenAI, DeepSeek, Moonshot, dan Z.AI
yang diekspos oleh katalog GMI. Ini berguna sebagai penyedia sekunder untuk
fallback model, untuk membandingkan rute terkelola lintas vendor, atau saat GMI
memiliki model yang tersedia sebelum penyedia utama Anda memilikinya.

Penyedia ini menggunakan semantik chat yang kompatibel dengan OpenAI. OpenClaw
memiliki id penyedia, profil autentikasi, alias, seed katalog model, dan URL
dasar; GMI memiliki ketersediaan model live, penagihan, batas laju, dan kebijakan
perutean sisi penyedia apa pun.

## Penyiapan

Instal Plugin, mulai ulang Gateway, lalu buat kunci API di GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Lalu jalankan:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Atau tetapkan:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Default

- Penyedia: `gmi`
- Alias: `gmi-cloud`, `gmicloud`
- URL dasar: `https://api.gmi-serving.com/v1`
- Variabel env: `GMI_API_KEY`
- Model default: `gmi/google/gemini-3.1-flash-lite`

## Kapan memilih GMI

- Anda menginginkan endpoint terkelola yang kompatibel dengan OpenAI, bukan server model lokal.
- Anda ingin mencoba beberapa keluarga model komersial dan open-weight melalui satu
  akun penyedia.
- Anda menginginkan penyedia fallback dengan perutean upstream yang berbeda dari OpenRouter,
  DeepInfra, Together, atau API vendor langsung.
- Anda membutuhkan id model, harga, atau kontrol akun khusus GMI.

Pilih penyedia vendor langsung sebagai gantinya saat Anda membutuhkan fitur native
vendor yang tidak diekspos GMI melalui rute kompatibel OpenAI-nya. Pilih penyedia
lokal seperti Ollama, LM Studio, vLLM, atau SGLang saat lokalitas data atau kontrol
GPU lokal lebih penting daripada kemudahan terkelola.

## Model

Katalog Plugin men-seed id rute GMI Cloud yang umum tersedia, termasuk:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

Katalog adalah seed, bukan janji bahwa setiap akun dapat memanggil setiap model
setiap saat. Gunakan perintah daftar model OpenClaw untuk melihat apa yang
dilaporkan penyedia terkonfigurasi di lingkungan Anda:

```bash
openclaw models list --provider gmi
```

## Pemecahan Masalah

- `401` atau `403`: periksa bahwa `GMI_API_KEY` ditetapkan untuk proses yang menjalankan
  OpenClaw, atau jalankan ulang onboarding untuk menyimpan kunci di profil autentikasi penyedia.
- Kesalahan model tidak dikenal: pastikan model ada di akun GMI Anda dan gunakan
  referensi `gmi/<route-id>` lengkap yang ditampilkan oleh `openclaw models list --provider gmi`.
- Kesalahan penyedia intermiten: coba rute GMI yang berbeda atau konfigurasikan GMI sebagai
  fallback, bukan sebagai satu-satunya penyedia model utama.

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
