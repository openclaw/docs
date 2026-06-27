---
read_when:
    - Anda ingin menggunakan Cloudflare AI Gateway dengan OpenClaw
    - Anda memerlukan ID akun, ID Gateway, atau variabel env kunci API
summary: Penyiapan Cloudflare AI Gateway (autentikasi + pemilihan model)
title: Gateway AI Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:03:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway berada di depan API penyedia dan memungkinkan Anda menambahkan analitik, caching, dan kontrol. Untuk Anthropic, OpenClaw menggunakan Anthropic Messages API melalui titik akhir Gateway Anda.

| Properti      | Nilai                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Penyedia      | `cloudflare-ai-gateway`                                                                  |
| URL Dasar     | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Model bawaan  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Kunci API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (kunci API penyedia Anda untuk permintaan melalui Gateway) |

<Note>
Untuk model Anthropic yang dirutekan melalui Cloudflare AI Gateway, gunakan **kunci API Anthropic** Anda sebagai kunci penyedia.
</Note>

Saat thinking diaktifkan untuk model Anthropic Messages, OpenClaw menghapus giliran
pengisian awal asisten di akhir sebelum mengirim payload melalui Cloudflare AI Gateway.
Anthropic menolak pengisian awal respons dengan extended thinking, sementara pengisian awal
non-thinking biasa tetap tersedia.

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Atur kunci API penyedia dan detail Gateway">
    Jalankan onboarding dan pilih opsi autentikasi Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Ini akan meminta ID akun, ID Gateway, dan kunci API Anda.

  </Step>
  <Step title="Atur model bawaan">
    Tambahkan model ke konfigurasi OpenClaw Anda:

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
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Contoh non-interaktif

Untuk penyiapan berbasis skrip atau CI, berikan semua nilai pada baris perintah:

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
  <Accordion title="Gateway terautentikasi">
    Jika Anda mengaktifkan autentikasi Gateway di Cloudflare, tambahkan header `cf-aig-authorization`. Ini **sebagai tambahan untuk** kunci API penyedia Anda.

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
    Header `cf-aig-authorization` mengautentikasi ke Cloudflare Gateway itu sendiri, sedangkan kunci API penyedia (misalnya, kunci Anthropic Anda) mengautentikasi ke penyedia upstream.
    </Tip>

  </Accordion>

  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `CLOUDFLARE_AI_GATEWAY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang diekspor hanya di shell interaktif tidak akan membantu daemon launchd/systemd kecuali lingkungan tersebut juga diimpor ke sana. Atur kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses Gateway dapat membacanya.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
