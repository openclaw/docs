---
read_when:
    - Anda ingin menggunakan Vercel AI Gateway dengan OpenClaw
    - Anda memerlukan variabel env kunci API atau pilihan autentikasi CLI
summary: Penyiapan Vercel AI Gateway (autentikasi + pemilihan model)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T09:25:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) menyediakan API terpadu untuk
mengakses ratusan model melalui satu endpoint.

| Properti      | Nilai                            |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Autentikasi          | `AI_GATEWAY_API_KEY`             |
| API           | Kompatibel dengan Anthropic Messages    |
| Katalog model | Ditemukan otomatis melalui `/v1/models` |

<Tip>
OpenClaw menemukan katalog Gateway `/v1/models` secara otomatis, sehingga
`/models vercel-ai-gateway` mencakup referensi model saat ini seperti
`vercel-ai-gateway/openai/gpt-5.5` dan
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    Jalankan onboarding dan pilih opsi autentikasi AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Tetapkan model default">
    Tambahkan model ke konfigurasi OpenClaw Anda:

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
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Contoh non-interaktif

Untuk penyiapan dengan skrip atau CI, teruskan semua nilai di baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Singkatan ID model

OpenClaw menerima referensi model singkat Claude Vercel dan menormalkannya saat
runtime:

| Input singkat                     | Referensi model yang dinormalisasi                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Anda dapat menggunakan singkatan atau referensi model yang sepenuhnya memenuhi syarat di konfigurasi
Anda. OpenClaw menyelesaikan bentuk kanonisnya secara otomatis.
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika Gateway OpenClaw berjalan sebagai daemon (launchd/systemd), pastikan
    `AI_GATEWAY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang hanya ditetapkan di `~/.profile` tidak akan terlihat oleh daemon launchd/systemd
    kecuali lingkungan tersebut diimpor secara eksplisit. Tetapkan kunci di
    `~/.openclaw/.env` atau melalui `env.shellEnv` agar proses gateway dapat
    membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Perutean provider">
    Vercel AI Gateway merutekan permintaan ke provider upstream berdasarkan awalan referensi model
    ref. Misalnya, `vercel-ai-gateway/anthropic/claude-opus-4.6` dirutekan
    melalui Anthropic, sedangkan `vercel-ai-gateway/openai/gpt-5.5` dirutekan melalui
    OpenAI dan `vercel-ai-gateway/moonshotai/kimi-k2.6` dirutekan melalui
    MoonshotAI. Satu `AI_GATEWAY_API_KEY` Anda menangani autentikasi untuk semua
    provider upstream.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
