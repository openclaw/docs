---
read_when:
    - Anda ingin menggunakan model Ollama yang di-hosting tanpa server Ollama lokal
    - Anda memerlukan id, kunci, atau endpoint penyedia ollama-cloud
summary: Gunakan Ollama Cloud secara langsung dengan OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:05:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud adalah API model terhosting milik Ollama. Ini memungkinkan OpenClaw memanggil
model yang dihosting Ollama secara langsung, tanpa memasang server Ollama lokal atau memasukkan
aplikasi Ollama lokal ke mode cloud. Gunakan id penyedia `ollama-cloud` dan referensi model seperti
`ollama-cloud/kimi-k2.6`.

Halaman ini ditujukan untuk perutean langsung khusus cloud. Penyedia menggunakan gaya native
`/api/chat` Ollama, bukan rute `/v1` yang kompatibel dengan OpenAI. OpenClaw mendaftarkannya
sebagai id penyedia terpisah agar kredensial khusus cloud, penemuan katalog live, dan
pemilihan model tidak tercampur dengan host `ollama` lokal.

Gunakan halaman ini saat Anda menginginkan perutean khusus cloud. Untuk Ollama lokal, perutean
hybrid cloud-plus-local, embeddings, dan detail host khusus, lihat
[Ollama](/id/providers/ollama).

## Penyiapan

Buat kunci API Ollama Cloud di [ollama.com/settings/keys](https://ollama.com/settings/keys), lalu jalankan:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Atau atur:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Default

- Penyedia: `ollama-cloud`
- URL dasar: `https://ollama.com`
- Variabel env: `OLLAMA_API_KEY`
- Gaya API: native Ollama `/api/chat`
- Contoh model: `ollama-cloud/kimi-k2.6`

## Kapan memilih Ollama Cloud

- Anda menginginkan model Ollama terhosting tanpa menjalankan `ollama serve` secara lokal.
- Anda menginginkan bentuk API chat native Ollama yang sama seperti yang digunakan OpenClaw untuk Ollama
  lokal, tetapi diarahkan ke `https://ollama.com`.
- Anda menginginkan jalur cloud sederhana untuk model yang sudah ada di katalog terhosting Ollama.
- Anda tidak memerlukan penarikan model lokal, kontrol GPU lokal, atau inferensi khusus LAN.

Gunakan [Ollama](/id/providers/ollama) sebagai gantinya saat Anda menginginkan perutean khusus lokal atau
cloud-plus-local melalui host Ollama yang sudah masuk. Gunakan penyedia yang kompatibel dengan
OpenAI sebagai gantinya saat Anda memerlukan semantik `/v1/chat/completions`
atau fitur bergaya OpenAI khusus penyedia.

## Model

OpenClaw menemukan model Ollama Cloud dari katalog terhosting live. Id terhosting yang umum
tersedia mencakup:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Gunakan id model dari katalog terhosting Anda saat ini:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Id model adalah id katalog cloud, bukan nama pull lokal. Jika nama model berfungsi di
host Ollama lokal tetapi tidak ada di katalog terhosting, gunakan penyedia `ollama`
dengan host lokal tersebut sebagai gantinya.

## Pengujian live

Untuk smoke test kunci API Ollama Cloud, arahkan pengujian live Ollama ke endpoint terhosting
dan pilih model dari katalog Anda saat ini:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Smoke cloud menjalankan teks, stream native, dan pencarian web. Ini melewati embeddings secara
default untuk `https://ollama.com` karena kunci API Ollama Cloud mungkin tidak mengotorisasi
`/api/embed`.

## Pemecahan Masalah

- Error `Set OLLAMA_API_KEY`: berikan kunci API cloud yang valid. Penanda lokal
  `ollama-local` hanya untuk host Ollama lokal atau privat.
- Error model tidak dikenal: jalankan `openclaw models list --provider ollama-cloud` dan
  salin id model terhosting dengan tepat.
- Masalah tool-call atau JSON mentah pada host Ollama khusus: periksa apakah Anda
  tidak sengaja menggunakan URL `/v1` yang kompatibel dengan OpenAI. Rute Ollama harus menggunakan
  URL dasar native tanpa sufiks `/v1`.

## Terkait

- [Ollama](/id/providers/ollama)
- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
