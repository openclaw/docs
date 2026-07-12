---
read_when:
    - Anda ingin menggunakan model Ollama yang di-host tanpa server Ollama lokal
    - Anda memerlukan id, kunci, atau endpoint penyedia ollama-cloud
summary: Gunakan Ollama Cloud secara langsung dengan OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T14:37:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud adalah API model terkelola milik Ollama. Penyedia `ollama-cloud` memanggilnya
secara langsung di `https://ollama.com` melalui API native `/api/chat` Ollama, tanpa
server Ollama lokal dan tanpa aplikasi Ollama lokal yang masuk dalam mode cloud. Gunakan
referensi model seperti `ollama-cloud/kimi-k2.6`.

OpenClaw mendaftarkan `ollama-cloud` sebagai id penyedia tersendiri agar
kredensial khusus cloud, penemuan katalog langsung, dan pemilihan model tidak tercampur dengan
host `ollama` lokal. Untuk Ollama lokal, perutean hibrida cloud-plus-lokal,
embedding, dan detail host khusus, lihat [Ollama](/id/providers/ollama).

## Penyiapan

Buat kunci API Ollama Cloud di [ollama.com/settings/keys](https://ollama.com/settings/keys), lalu jalankan:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Atau tetapkan:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

Orientasi noninteraktif menerima kunci secara langsung:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

Orientasi menetapkan model default ke `ollama-cloud/kimi-k2.5:cloud`.

## Default

- Penyedia: `ollama-cloud`
- URL dasar: `https://ollama.com`
- Variabel lingkungan: `OLLAMA_API_KEY`
- Gaya API: `/api/chat` native Ollama
- Model default orientasi: `ollama-cloud/kimi-k2.5:cloud`

## Kapan memilih Ollama Cloud

- Anda menginginkan model Ollama terkelola tanpa menjalankan `ollama serve` secara lokal.
- Anda menginginkan struktur API percakapan native Ollama yang sama dengan yang digunakan OpenClaw untuk
  Ollama lokal, tetapi diarahkan ke `https://ollama.com`.
- Anda menginginkan jalur cloud sederhana untuk model yang sudah tersedia dalam katalog
  terkelola Ollama.
- Anda tidak memerlukan pengunduhan model lokal, kontrol GPU lokal, atau inferensi khusus LAN.

Sebagai gantinya, gunakan [Ollama](/id/providers/ollama) jika Anda menginginkan perutean khusus lokal atau
cloud-plus-lokal melalui host Ollama yang telah masuk. Gunakan
penyedia yang kompatibel dengan OpenAI jika Anda memerlukan semantik
`/v1/chat/completions` atau fitur bergaya OpenAI yang khusus untuk penyedia.

## Model

Penyedia memerlukan kunci API; tanpa kunci, penyedia tetap tidak aktif. Dengan kunci,
OpenClaw menemukan model Ollama Cloud secara langsung dari katalog terkelola:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Id terkelola dalam katalog langsung mencakup `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6`, dan `minimax-m2.7`. Jika penemuan langsung tidak
menghasilkan apa pun, OpenClaw kembali menggunakan entri bawaan `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud`, dan `glm-5.2:cloud`.

Id model adalah id katalog cloud, bukan nama pengunduhan lokal. Jika suatu nama model berfungsi pada
host Ollama lokal tetapi tidak tersedia dalam katalog terkelola, gunakan penyedia `ollama`
dengan host lokal tersebut.

## Pengujian langsung

Untuk pengujian singkat kunci API Ollama Cloud, arahkan pengujian langsung Ollama ke titik akhir
terkelola dan pilih model dari katalog Anda saat ini:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Pengujian singkat cloud menjalankan teks, streaming native, dan pencarian web; tetapkan
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` untuk melewati pencarian web. Pengujian ini melewati embedding secara
default untuk `https://ollama.com` karena kunci API Ollama Cloud mungkin tidak
mengizinkan `/api/embed`; paksa pengujian tersebut dengan `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Pemecahan masalah

- Galat `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: berikan
  kunci API cloud yang sebenarnya. Penanda lokal `ollama-local` hanya untuk host Ollama
  lokal atau privat.
- Galat model tidak dikenal: jalankan `openclaw models list --provider ollama-cloud` dan
  salin id model terkelola secara persis.
- Masalah pemanggilan alat atau JSON mentah pada host Ollama khusus: periksa apakah Anda
  tanpa sengaja menggunakan URL `/v1` yang kompatibel dengan OpenAI. Rute Ollama harus menggunakan
  URL dasar native tanpa akhiran `/v1`.

## Terkait

- [Ollama](/id/providers/ollama)
- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
