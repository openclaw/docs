---
read_when:
    - Anda ingin menggunakan Cloudflare AI Gateway dengan OpenClaw
    - Anda memerlukan ID akun, ID Gateway, atau variabel lingkungan kunci API
summary: Penyiapan Cloudflare AI Gateway (autentikasi + pemilihan model)
title: Gateway AI Cloudflare
x-i18n:
    generated_at: "2026-07-12T14:32:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) berada di depan API penyedia dan menambahkan analitik, penyimpanan cache, serta kontrol. Untuk Anthropic, OpenClaw menggunakan Anthropic Messages API melalui titik akhir Gateway Anda.

| Properti      | Nilai                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Penyedia      | `cloudflare-ai-gateway`                                                                  |
| Plugin        | paket eksternal resmi (`@openclaw/cloudflare-ai-gateway-provider`)                       |
| URL dasar     | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Model bawaan  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Kunci API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (kunci API penyedia Anda untuk permintaan melalui Gateway) |

<Note>
Untuk model Anthropic yang dirutekan melalui Cloudflare AI Gateway, gunakan **kunci API Anthropic** Anda sebagai kunci penyedia.
</Note>

Saat proses berpikir diaktifkan untuk model Anthropic Messages, OpenClaw menghapus giliran prapengisian asisten di bagian akhir sebelum mengirimkan muatan melalui Cloudflare AI Gateway. Anthropic menolak prapengisian respons dengan proses berpikir yang diperluas, sedangkan prapengisian biasa tanpa proses berpikir tetap tersedia.

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Tetapkan kunci API penyedia dan detail Gateway">
    Jalankan orientasi awal dan pilih opsi autentikasi Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Perintah ini akan meminta ID akun, ID gateway, dan kunci API Anda.

  </Step>
  <Step title="Tetapkan model bawaan">
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

## Contoh noninteraktif

Untuk penyiapan berbasis skrip atau CI, teruskan semua nilai melalui baris perintah:

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
    Jika Anda mengaktifkan autentikasi Gateway di Cloudflare, tambahkan header `cf-aig-authorization`. Header ini diperlukan **selain** kunci API penyedia Anda.

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
    Header `cf-aig-authorization` melakukan autentikasi dengan Cloudflare Gateway itu sendiri, sedangkan kunci API penyedia (misalnya, kunci Anthropic Anda) melakukan autentikasi dengan penyedia hulu.
    </Tip>

  </Accordion>

  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `CLOUDFLARE_AI_GATEWAY_API_KEY` tersedia bagi proses tersebut.

    <Warning>
    Kunci yang hanya diekspor dalam shell interaktif tidak akan tersedia bagi daemon launchd/systemd, kecuali lingkungan tersebut juga diimpor ke sana. Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway dapat membacanya.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan saat terjadi kegagalan.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan pertanyaan umum.
  </Card>
</CardGroup>
