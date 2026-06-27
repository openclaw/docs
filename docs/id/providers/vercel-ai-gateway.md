---
read_when:
    - Anda ingin menggunakan Vercel AI Gateway dengan OpenClaw
    - Anda memerlukan variabel env kunci API atau pilihan autentikasi CLI
summary: Penyiapan Vercel AI Gateway (auth + pemilihan model)
title: Gateway AI Vercel
x-i18n:
    generated_at: "2026-06-27T18:07:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) menyediakan API terpadu untuk
mengakses ratusan model melalui satu endpoint.

| Properti      | Nilai                                  |
| ------------- | -------------------------------------- |
| Penyedia      | `vercel-ai-gateway`                    |
| Paket         | `@openclaw/vercel-ai-gateway-provider` |
| Auth          | `AI_GATEWAY_API_KEY`                   |
| API           | Kompatibel dengan Anthropic Messages   |
| Katalog model | Ditemukan otomatis melalui `/v1/models` |

<Tip>
OpenClaw menemukan katalog Gateway `/v1/models` secara otomatis, sehingga
`/models vercel-ai-gateway` menyertakan ref model saat ini seperti
`vercel-ai-gateway/openai/gpt-5.5` dan
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Memulai

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Atur kunci API">
    Jalankan onboarding dan pilih opsi auth AI Gateway:

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

Untuk penyiapan berskrip atau CI, teruskan semua nilai melalui baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Singkatan ID model

OpenClaw menerima ref model singkatan Vercel Claude dan menormalisasinya saat
runtime:

| Input singkatan                    | Ref model yang dinormalisasi                  |
| ---------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`       | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Anda dapat menggunakan singkatan atau ref model lengkap dalam konfigurasi Anda.
OpenClaw menyelesaikan bentuk kanonis secara otomatis.
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika OpenClaw Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `AI_GATEWAY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang diekspor hanya di shell interaktif tidak akan terlihat oleh
    daemon launchd/systemd kecuali lingkungan tersebut diimpor secara eksplisit.
    Atur kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan
    proses gateway dapat membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Perutean penyedia">
    Vercel AI Gateway merutekan permintaan ke penyedia hulu berdasarkan prefiks
    ref model. Misalnya, `vercel-ai-gateway/anthropic/claude-opus-4.6` dirutekan
    melalui Anthropic, sementara `vercel-ai-gateway/openai/gpt-5.5` dirutekan
    melalui OpenAI dan `vercel-ai-gateway/moonshotai/kimi-k2.6` dirutekan melalui
    MoonshotAI. Satu `AI_GATEWAY_API_KEY` Anda menangani autentikasi untuk semua
    penyedia hulu.
  </Accordion>
  <Accordion title="Tingkat berpikir">
    Opsi `/think` mengikuti prefiks model hulu tepercaya ketika OpenClaw mengetahui
    kontrak penyedia hulu. `vercel-ai-gateway/anthropic/...` menggunakan profil
    berpikir Claude, termasuk default adaptif untuk model Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5`, dan ref bergaya Codex mengekspos
    `/think xhigh` sama seperti penyedia langsung OpenAI/OpenAI Codex. Ref
    ber-namespace lain mempertahankan tingkat penalaran normal kecuali metadata
    katalognya mendeklarasikan lebih banyak.
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
