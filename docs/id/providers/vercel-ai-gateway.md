---
read_when:
    - Anda ingin menggunakan Vercel AI Gateway dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Vercel AI Gateway (autentikasi + pemilihan model)
title: Gateway AI Vercel
x-i18n:
    generated_at: "2026-07-12T14:37:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) menyediakan API terpadu untuk
mengakses ratusan model melalui satu endpoint.

| Properti      | Nilai                                  |
| ------------- | -------------------------------------- |
| Penyedia      | `vercel-ai-gateway`                    |
| Paket         | `@openclaw/vercel-ai-gateway-provider` |
| Autentikasi   | `AI_GATEWAY_API_KEY`                   |
| API           | Kompatibel dengan Anthropic Messages   |
| URL dasar     | `https://ai-gateway.vercel.sh`         |
| Katalog model | Ditemukan otomatis melalui `/v1/models` |

<Tip>
OpenClaw secara otomatis menemukan katalog `/v1/models` Gateway, sehingga
perintah obrolan `/models vercel-ai-gateway` dan
`openclaw models list --provider vercel-ai-gateway` menyertakan referensi model
terkini seperti `vercel-ai-gateway/openai/gpt-5.5` dan
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Memulai

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Tetapkan model default">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="Pastikan model tersedia">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Contoh noninteraktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Bentuk singkat ID model

OpenClaw menormalisasi referensi model bentuk singkat Claude saat runtime:

| Masukan bentuk singkat              | Referensi model yang dinormalisasi             |
| ----------------------------------- | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6`  |

<Tip>
Gunakan salah satu bentuk dalam konfigurasi Anda; OpenClaw secara otomatis
menyelesaikannya menjadi referensi kanonis `anthropic/...`.
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika Gateway OpenClaw berjalan sebagai daemon (launchd/systemd), pastikan
    `AI_GATEWAY_API_KEY` tersedia bagi proses tersebut.

    <Warning>
    Kunci yang hanya diekspor dalam shell interaktif tidak akan terlihat oleh
    daemon launchd/systemd kecuali lingkungan tersebut diimpor secara eksplisit.
    Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk
    memastikan proses Gateway dapat membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Perutean penyedia">
    Vercel AI Gateway merutekan setiap permintaan ke penyedia hulu yang disebutkan
    dalam prefiks referensi model. Misalnya, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    dirutekan melalui Anthropic, `vercel-ai-gateway/openai/gpt-5.5` dirutekan melalui
    OpenAI, dan `vercel-ai-gateway/moonshotai/kimi-k2.6` dirutekan melalui
    MoonshotAI. Satu `AI_GATEWAY_API_KEY` mengautentikasi semua penyedia hulu.
  </Accordion>
  <Accordion title="Tingkat pemikiran">
    Opsi `/think` mengikuti prefiks model hulu saat OpenClaw mengenalinya.
    `vercel-ai-gateway/anthropic/...` menggunakan profil pemikiran Claude,
    termasuk default adaptif untuk model Claude 4.6. Referensi
    `vercel-ai-gateway/openai/...` tepercaya (`gpt-5.2` dan yang lebih baru,
    ditambah varian Codex hingga `gpt-5.1-codex`) menyediakan `/think xhigh`.
    Referensi bernamespace lainnya mempertahankan tingkat penalaran standar,
    kecuali metadata katalognya menyatakan tingkat tambahan.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan pertanyaan umum.
  </Card>
</CardGroup>
