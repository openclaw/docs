---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model GMI Cloud
    - Anda memerlukan ID penyedia, kunci, atau titik akhir GMI
summary: Gunakan API GMI Cloud yang kompatibel dengan OpenAI bersama OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T14:32:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud adalah platform inferensi terkelola untuk model frontier dan berbobot terbuka
di balik API yang kompatibel dengan OpenAI. Di OpenClaw, platform ini merupakan Plugin
penyedia eksternal resmi: instal sekali, simpan kredensial melalui autentikasi model
biasa, lalu gunakan referensi model seperti `gmi/google/gemini-3.1-flash-lite`.

Gunakan GMI jika Anda menginginkan satu kunci API untuk beberapa keluarga model
terkelola, termasuk rute Anthropic, DeepSeek, Google, Moonshot, OpenAI, dan Z.AI
yang tersedia dalam katalog GMI. GMI dapat digunakan sebagai penyedia sekunder
untuk fallback model, untuk membandingkan rute terkelola antarvendor, atau ketika
suatu model tersedia di GMI lebih dahulu daripada di penyedia utama Anda. OpenClaw
mengelola id penyedia, profil autentikasi, alias, seed katalog model, dan URL dasar;
GMI mengelola ketersediaan model secara langsung, penagihan, batas laju, dan setiap
kebijakan perutean di sisi penyedia.

| Properti        | Nilai                                    |
| --------------- | ---------------------------------------- |
| Id penyedia     | `gmi` (alias: `gmi-cloud`, `gmicloud`)  |
| Paket           | `@openclaw/gmi-provider`                 |
| Variabel env autentikasi | `GMI_API_KEY`                    |
| API             | Kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar       | `https://api.gmi-serving.com/v1`         |
| Model bawaan    | `gmi/google/gemini-3.1-flash-lite`       |

## Penyiapan

Instal Plugin, mulai ulang Gateway, lalu buat kunci API di GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Kemudian jalankan:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Penyiapan noninteraktif dapat meneruskan `--gmi-api-key <key>`, atau menetapkan:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Kapan memilih GMI

- Anda menginginkan titik akhir terkelola yang kompatibel dengan OpenAI, bukan server model lokal.
- Anda ingin mencoba beberapa keluarga model komersial dan berbobot terbuka melalui satu
  akun penyedia.
- Anda menginginkan penyedia fallback dengan perutean hulu yang berbeda dari DeepInfra,
  OpenRouter, Together, atau API vendor langsung.
- Anda memerlukan id model, harga, atau kontrol akun khusus GMI.

Pilih penyedia vendor langsung jika Anda memerlukan fitur asli vendor
yang tidak disediakan GMI melalui rute kompatibel OpenAI miliknya. Pilih penyedia
lokal seperti LM Studio, Ollama, SGLang, atau vLLM jika lokalitas data atau kendali
GPU lokal lebih penting daripada kemudahan layanan terkelola.

## Model

Katalog Plugin menyediakan seed id rute GMI Cloud yang umumnya tersedia:

| Referensi model                    | Masukan        | Konteks   | Keluaran maksimum |
| ---------------------------------- | -------------- | --------- | ----------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | teks + gambar  | 200,000   | 64,000            |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | teks           | 163,840   | 65,536            |
| `gmi/google/gemini-3.1-flash-lite` | teks + gambar  | 1,048,576 | 65,536            |
| `gmi/moonshotai/Kimi-K2.5`         | teks + gambar  | 262,144   | 65,536            |
| `gmi/openai/gpt-5.4`               | teks + gambar  | 400,000   | 128,000           |
| `gmi/zai-org/GLM-5.1-FP8`          | teks           | 202,752   | 65,536            |

Katalog tersebut merupakan seed, bukan jaminan bahwa setiap akun dapat memanggil
setiap model setiap saat. Tampilkan apa yang dilaporkan penyedia yang telah
dikonfigurasi di lingkungan Anda:

```bash
openclaw models list --provider gmi
```

## Pemecahan masalah

- `401` atau `403`: periksa apakah `GMI_API_KEY` telah ditetapkan untuk proses yang
  menjalankan OpenClaw, atau jalankan kembali proses orientasi untuk menyimpan kunci
  dalam profil autentikasi penyedia.
- Galat model tidak dikenal: pastikan model tersebut tersedia di akun GMI Anda dan
  gunakan referensi lengkap `gmi/<route-id>` yang ditampilkan oleh
  `openclaw models list --provider gmi`.
- Galat penyedia yang berselang: coba rute GMI lain atau konfigurasikan GMI sebagai
  fallback, bukan sebagai satu-satunya penyedia model utama.

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
