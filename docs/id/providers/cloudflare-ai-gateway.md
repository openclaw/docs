---
read_when:
    - Anda ingin menggunakan Cloudflare AI Gateway dengan OpenClaw
    - Anda memerlukan ID akun, ID Gateway, atau variabel lingkungan kunci API
summary: Penyiapan Cloudflare AI Gateway (autentikasi + pemilihan model)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-30T10:06:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway berada di depan API penyedia dan memungkinkan Anda menambahkan analitik, caching, dan kontrol. Untuk Anthropic, OpenClaw menggunakan Anthropic Messages API melalui endpoint Gateway Anda.

| Properti      | Nilai                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Penyedia      | `cloudflare-ai-gateway`                                                                  |
| URL Dasar     | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Model default | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Kunci API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (kunci API penyedia Anda untuk permintaan melalui Gateway) |

<Note>
Untuk model Anthropic yang dirutekan melalui Cloudflare AI Gateway, gunakan **kunci API Anthropic** Anda sebagai kunci penyedia.
</Note>

Saat thinking diaktifkan untuk model Anthropic Messages, OpenClaw menghapus giliran prefill asisten di akhir sebelum mengirim payload melalui Cloudflare AI Gateway.
Anthropic menolak prefilling respons dengan extended thinking, sementara prefill non-thinking biasa tetap tersedia.

## Memulai

<Steps>
  <Step title="Set the provider API key and Gateway details">
    Jalankan onboarding dan pilih opsi auth Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Ini meminta ID akun, ID gateway, dan kunci API Anda.

  </Step>
  <Step title="Set a default model">
    Tambahkan model ke config OpenClaw Anda:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Contoh non-interaktif

Untuk penyiapan skrip atau CI, teruskan semua nilai di baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Authenticated gateways">
    Jika Anda mengaktifkan autentikasi Gateway di Cloudflare, tambahkan header `cf-aig-authorization`. Ini **sebagai tambahan dari** kunci API penyedia Anda.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    Header `cf-aig-authorization` mengautentikasi dengan Cloudflare Gateway itu sendiri, sementara kunci API penyedia (misalnya, kunci Anthropic Anda) mengautentikasi dengan penyedia upstream.
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `CLOUDFLARE_AI_GATEWAY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang hanya berada di `~/.profile` tidak akan membantu daemon launchd/systemd kecuali environment tersebut juga diimpor ke sana. Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway dapat membacanya.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
