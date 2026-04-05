---
read_when:
    - Anda ingin menggunakan Fireworks dengan OpenClaw
    - Anda memerlukan variabel lingkungan Fireworks API key atau ID model default
summary: Penyiapan Fireworks (auth + pemilihan model)
x-i18n:
    generated_at: "2026-04-05T14:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) mengekspos model open-weight dan model yang dirutekan melalui API yang kompatibel dengan OpenAI. OpenClaw kini menyertakan plugin provider Fireworks bawaan.

- Provider: `fireworks`
- Auth: `FIREWORKS_API_KEY`
- API: chat/completions yang kompatibel dengan OpenAI
- Base URL: `https://api.fireworks.ai/inference/v1`
- Model default: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Mulai cepat

Siapkan auth Fireworks melalui onboarding:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Ini menyimpan key Fireworks Anda di config OpenClaw dan menetapkan model awal Fire Pass sebagai default.

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catatan lingkungan

Jika Gateway berjalan di luar shell interaktif Anda, pastikan `FIREWORKS_API_KEY`
juga tersedia untuk proses tersebut. Key yang hanya ada di `~/.profile` tidak akan
membantu daemon launchd/systemd kecuali lingkungan itu juga diimpor di sana.

## Katalog bawaan

| Referensi model                                       | Nama                         | Input      | Konteks | Output maks | Catatan                                      |
| ----------------------------------------------------- | ---------------------------- | ---------- | ------- | ----------- | -------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000     | Model awal bawaan default di Fireworks |

## ID model Fireworks kustom

OpenClaw juga menerima ID model Fireworks dinamis. Gunakan ID model atau router persis seperti yang ditampilkan oleh Fireworks dan awali dengan `fireworks/`.

Contoh:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Jika Fireworks menerbitkan model yang lebih baru seperti rilis Qwen atau Gemma terbaru, Anda dapat langsung beralih ke model tersebut dengan menggunakan ID model Fireworks-nya tanpa menunggu pembaruan katalog bawaan.
