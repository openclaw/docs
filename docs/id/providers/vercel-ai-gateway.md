---
read_when:
    - Anda ingin menggunakan Vercel AI Gateway dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Vercel AI Gateway (autentikasi + pemilihan model)
title: Gateway AI Vercel
x-i18n:
    generated_at: "2026-04-30T10:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) menyediakan API terpadu untuk
mengakses ratusan model melalui satu endpoint.

| Properti      | Nilai                            |
| ------------- | -------------------------------- |
| Penyedia      | `vercel-ai-gateway`              |
| Autentikasi   | `AI_GATEWAY_API_KEY`             |
| API           | Kompatibel dengan Anthropic Messages |
| Katalog model | Ditemukan otomatis melalui `/v1/models` |

<Tip>
OpenClaw menemukan katalog Gateway `/v1/models` secara otomatis, jadi
`/models vercel-ai-gateway` menyertakan ref model saat ini seperti
`vercel-ai-gateway/openai/gpt-5.5` dan
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Memulai

<Steps>
  <Step title="Atur kunci API">
    Jalankan onboarding dan pilih opsi autentikasi AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Atur model default">
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

Untuk penyiapan berbasis skrip atau CI, berikan semua nilai pada baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Singkatan ID model

OpenClaw menerima ref model singkatan Vercel Claude dan menormalkannya saat
runtime:

| Input singkatan                     | Ref model yang dinormalkan                  |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Anda dapat menggunakan singkatan atau ref model yang sepenuhnya memenuhi syarat dalam
konfigurasi Anda. OpenClaw menyelesaikan bentuk kanonis secara otomatis.
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika OpenClaw Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `AI_GATEWAY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang hanya diatur di `~/.profile` tidak akan terlihat oleh daemon
    launchd/systemd kecuali lingkungan tersebut diimpor secara eksplisit. Atur kunci di
    `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway dapat
    membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Perutean penyedia">
    Vercel AI Gateway merutekan permintaan ke penyedia upstream berdasarkan prefiks ref
    model. Misalnya, `vercel-ai-gateway/anthropic/claude-opus-4.6` dirutekan
    melalui Anthropic, sedangkan `vercel-ai-gateway/openai/gpt-5.5` dirutekan melalui
    OpenAI dan `vercel-ai-gateway/moonshotai/kimi-k2.6` dirutekan melalui
    MoonshotAI. Satu `AI_GATEWAY_API_KEY` Anda menangani autentikasi untuk semua
    penyedia upstream.
  </Accordion>
  <Accordion title="Tingkat berpikir">
    Opsi `/think` mengikuti prefiks model upstream tepercaya ketika OpenClaw mengetahui
    kontrak penyedia upstream. `vercel-ai-gateway/anthropic/...` menggunakan profil
    berpikir Claude, termasuk default adaptif untuk model Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5`, dan ref bergaya Codex mengekspos
    `/think xhigh` sama seperti penyedia OpenAI/OpenAI Codex langsung. Ref bernamespaced
    lainnya mempertahankan tingkat penalaran normal kecuali metadata katalog mereka
    menyatakan lebih banyak.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
