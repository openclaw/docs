---
read_when:
    - Anda ingin menggunakan Fireworks dengan OpenClaw
    - Anda memerlukan env var API key Fireworks atau id model default
summary: Penyiapan Fireworks (auth + pemilihan model)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T09:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) mengekspos model open-weight dan model berute melalui API yang kompatibel dengan OpenAI. OpenClaw menyertakan Plugin provider Fireworks bawaan.

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions yang kompatibel dengan OpenAI         |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Model default | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Memulai

<Steps>
  <Step title="Siapkan auth Fireworks melalui onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Ini menyimpan key Fireworks Anda di konfigurasi OpenClaw dan menyetel model starter Fire Pass sebagai default.

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Contoh non-interaktif

Untuk penyiapan skrip atau CI, berikan semua nilai di command line:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Model ref                                              | Name                        | Input      | Context | Max output | Catatan                                                                                                                                              |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | Model Kimi terbaru di Fireworks. Thinking dinonaktifkan untuk permintaan Fireworks K2.6; rute-kan langsung melalui Moonshot jika Anda memerlukan output thinking Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Model starter bundled default di Fireworks                                                                                                           |

<Tip>
Jika Fireworks menerbitkan model yang lebih baru seperti rilis Qwen atau Gemma baru, Anda dapat langsung beralih ke model tersebut dengan menggunakan id model Fireworks-nya tanpa menunggu pembaruan katalog bundled.
</Tip>

## Id model Fireworks kustom

OpenClaw juga menerima id model Fireworks dinamis. Gunakan id model atau router yang persis seperti yang ditampilkan oleh Fireworks dan beri prefiks `fireworks/`.

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

<AccordionGroup>
  <Accordion title="Cara kerja prefiks id model">
    Setiap ref model Fireworks di OpenClaw dimulai dengan `fireworks/` diikuti oleh id atau path router yang persis dari platform Fireworks. Contohnya:

    - Model router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model langsung: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw menghapus prefiks `fireworks/` saat membangun permintaan API dan mengirim path sisanya ke endpoint Fireworks.

  </Accordion>

  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan di luar shell interaktif Anda, pastikan `FIREWORKS_API_KEY` juga tersedia untuk proses tersebut.

    <Warning>
    Key yang hanya berada di `~/.profile` tidak akan membantu daemon launchd/systemd kecuali lingkungan itu juga diimpor ke sana. Setel key di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses Gateway dapat membacanya.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
