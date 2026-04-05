---
read_when:
    - Anda ingin menggunakan model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T14:04:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Provider MiniMax OpenClaw secara default menggunakan **MiniMax M2.7**.

MiniMax juga menyediakan:

- sintesis ucapan bawaan melalui T2A v2
- pemahaman gambar bawaan melalui `MiniMax-VL-01`
- `web_search` bawaan melalui API pencarian MiniMax Coding Plan

Pemisahan provider:

- `minimax`: provider teks berbasis API key, ditambah image generation, image understanding, speech, dan web search bawaan
- `minimax-portal`: provider teks OAuth, ditambah image generation dan image understanding bawaan

## Susunan model

- `MiniMax-M2.7`: model reasoning hosted default.
- `MiniMax-M2.7-highspeed`: tier reasoning M2.7 yang lebih cepat.
- `image-01`: model image generation (generate dan pengeditan image-to-image).

## Image generation

Plugin MiniMax mendaftarkan model `image-01` untuk tool `image_generate`. Model ini mendukung:

- **Pembuatan teks-ke-gambar** dengan kontrol rasio aspek.
- **Pengeditan gambar image-to-image** (referensi subjek) dengan kontrol rasio aspek.
- Hingga **9 gambar output** per permintaan.
- Hingga **1 gambar referensi** per permintaan edit.
- Rasio aspek yang didukung: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Untuk menggunakan MiniMax untuk image generation, setel sebagai provider image generation:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin ini menggunakan `MINIMAX_API_KEY` atau auth OAuth yang sama dengan model teks. Tidak diperlukan konfigurasi tambahan jika MiniMax sudah disiapkan.

Baik `minimax` maupun `minimax-portal` mendaftarkan `image_generate` dengan model
`image-01` yang sama. Penyiapan API key menggunakan `MINIMAX_API_KEY`; penyiapan OAuth dapat menggunakan
jalur auth `minimax-portal` bawaan sebagai gantinya.

Saat onboarding atau penyiapan API key menulis entri `models.providers.minimax`
eksplisit, OpenClaw mewujudkan `MiniMax-M2.7` dan
`MiniMax-M2.7-highspeed` dengan `input: ["text", "image"]`.

Katalog teks MiniMax bawaan internal sendiri tetap berupa metadata khusus teks sampai
konfigurasi provider eksplisit tersebut ada. Pemahaman gambar diekspos secara terpisah
melalui provider media `MiniMax-VL-01` milik plugin.

## Image understanding

Plugin MiniMax mendaftarkan image understanding secara terpisah dari katalog
teks:

- `minimax`: model gambar default `MiniMax-VL-01`
- `minimax-portal`: model gambar default `MiniMax-VL-01`

Itulah sebabnya perutean media otomatis dapat menggunakan image understanding MiniMax meskipun
katalog provider teks bawaan masih menampilkan referensi chat M2.7 khusus teks.

## Web search

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Coding Plan.

- ID provider: `minimax`
- Hasil terstruktur: judul, URL, cuplikan, kueri terkait
- Variabel lingkungan yang diutamakan: `MINIMAX_CODE_PLAN_KEY`
- Alias env yang diterima: `MINIMAX_CODING_API_KEY`
- Fallback kompatibilitas: `MINIMAX_API_KEY` saat sudah menunjuk ke token coding-plan
- Penggunaan ulang region: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, lalu base URL provider MiniMax
- Pencarian tetap menggunakan ID provider `minimax`; penyiapan OAuth CN/global tetap dapat mengarahkan region secara tidak langsung melalui `models.providers.minimax-portal.baseUrl`

Config berada di bawah `plugins.entries.minimax.config.webSearch.*`.
Lihat [MiniMax Search](/tools/minimax-search).

## Pilih penyiapan

### OAuth MiniMax (Coding Plan) - direkomendasikan

**Paling cocok untuk:** penyiapan cepat dengan MiniMax Coding Plan melalui OAuth, tanpa memerlukan API key.

Lakukan autentikasi dengan pilihan OAuth regional yang eksplisit:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# atau
openclaw onboard --auth-choice minimax-cn-oauth
```

Pemetaan pilihan:

- `minimax-global-oauth`: pengguna internasional (`api.minimax.io`)
- `minimax-cn-oauth`: pengguna di China (`api.minimaxi.com`)

Lihat README package plugin MiniMax di repo OpenClaw untuk detailnya.

### MiniMax M2.7 (API key)

**Paling cocok untuk:** MiniMax hosted dengan API yang kompatibel dengan Anthropic.

Konfigurasikan melalui CLI:

- Onboarding interaktif:

```bash
openclaw onboard --auth-choice minimax-global-api
# atau
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: pengguna internasional (`api.minimax.io`)
- `minimax-cn-api`: pengguna di China (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw sekarang menonaktifkan
thinking MiniMax secara default kecuali Anda secara eksplisit menyetel `thinking` sendiri. Endpoint
streaming MiniMax mengeluarkan `reasoning_content` dalam potongan delta bergaya OpenAI
alih-alih blok thinking native Anthropic, yang dapat membocorkan reasoning internal
ke output yang terlihat jika dibiarkan aktif secara implisit.

### MiniMax M2.7 sebagai fallback (contoh)

**Paling cocok untuk:** mempertahankan model generasi terbaru terkuat Anda sebagai primary, dengan fallback ke MiniMax M2.7.
Contoh di bawah menggunakan Opus sebagai primary konkret; ganti dengan model primary generasi terbaru pilihan Anda.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Konfigurasikan melalui `openclaw configure`

Gunakan wizard config interaktif untuk menyetel MiniMax tanpa mengedit JSON:

1. Jalankan `openclaw configure`.
2. Pilih **Model/auth**.
3. Pilih opsi auth **MiniMax**.
4. Pilih model default Anda saat diminta.

Pilihan auth MiniMax saat ini di wizard/CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Opsi konfigurasi

- `models.providers.minimax.baseUrl`: utamakan `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` bersifat opsional untuk payload yang kompatibel dengan OpenAI.
- `models.providers.minimax.api`: utamakan `anthropic-messages`; `openai-completions` bersifat opsional untuk payload yang kompatibel dengan OpenAI.
- `models.providers.minimax.apiKey`: API key MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: definisikan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: beri alias pada model yang Anda inginkan dalam allowlist.
- `models.mode`: pertahankan `merge` jika Anda ingin menambahkan MiniMax di samping provider bawaan.

## Catatan

- Referensi model mengikuti jalur auth:
  - Penyiapan API key: `minimax/<model>`
  - Penyiapan OAuth: `minimax-portal/<model>`
- Model chat default: `MiniMax-M2.7`
- Model chat alternatif: `MiniMax-M2.7-highspeed`
- Pada `api: "anthropic-messages"`, OpenClaw menyuntikkan
  `thinking: { type: "disabled" }` kecuali thinking sudah disetel secara eksplisit di
  params/config.
- `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi
  `MiniMax-M2.7-highspeed` pada jalur stream yang kompatibel dengan Anthropic.
- Onboarding dan penyiapan API key langsung menulis definisi model eksplisit dengan
  `input: ["text", "image"]` untuk kedua varian M2.7
- Katalog provider bawaan saat ini mengekspos referensi chat sebagai metadata
  khusus teks sampai konfigurasi provider MiniMax eksplisit ada
- API penggunaan Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (memerlukan coding plan key).
- OpenClaw menormalkan penggunaan coding-plan MiniMax ke tampilan `% tersisa` yang sama
  seperti yang digunakan provider lain. Field mentah `usage_percent` / `usagePercent` MiniMax
  adalah kuota tersisa, bukan kuota terpakai, sehingga OpenClaw membalikkannya.
  Field berbasis jumlah diutamakan saat tersedia. Saat API mengembalikan `model_remains`,
  OpenClaw mengutamakan entri model chat, menurunkan label jendela dari
  `start_time` / `end_time` bila diperlukan, dan menyertakan nama model yang dipilih
  dalam label paket agar jendela coding-plan lebih mudah dibedakan.
- Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai
  permukaan kuota MiniMax yang sama, dan mengutamakan OAuth MiniMax yang tersimpan sebelum
  fallback ke env var coding plan key.
- Perbarui nilai harga di `models.json` jika Anda membutuhkan pelacakan biaya yang akurat.
- Tautan referral untuk MiniMax Coding Plan (diskon 10%): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Lihat [/concepts/model-providers](/id/concepts/model-providers) untuk aturan provider.
- Gunakan `openclaw models list` untuk mengonfirmasi ID provider saat ini, lalu ganti dengan
  `openclaw models set minimax/MiniMax-M2.7` atau
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Pemecahan masalah

### "Unknown model: minimax/MiniMax-M2.7"

Ini biasanya berarti **provider MiniMax belum dikonfigurasi** (tidak ada
entri provider yang cocok dan tidak ada profil auth/env key MiniMax yang ditemukan). Perbaikan untuk
deteksi ini ada di **2026.1.12**. Perbaiki dengan:

- Upgrade ke **2026.1.12** (atau jalankan dari source `main`), lalu restart gateway.
- Jalankan `openclaw configure` dan pilih opsi auth **MiniMax**, atau
- Tambahkan blok `models.providers.minimax` atau
  `models.providers.minimax-portal` yang cocok secara manual, atau
- Setel `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau profil auth MiniMax
  agar provider yang cocok dapat diinjeksi.

Pastikan ID model **peka huruf besar-kecil**:

- Jalur API key: `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed`
- Jalur OAuth: `minimax-portal/MiniMax-M2.7` atau
  `minimax-portal/MiniMax-M2.7-highspeed`

Lalu periksa kembali dengan:

```bash
openclaw models list
```
