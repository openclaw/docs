---
read_when:
    - Anda ingin menggunakan Arcee AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Arcee AI (autentikasi + pemilihan model)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T18:01:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) menyediakan akses ke keluarga model mixture-of-experts Trinity melalui API yang kompatibel dengan OpenAI. Semua model Trinity dilisensikan di bawah Apache 2.0.

Model Arcee AI dapat diakses langsung melalui platform Arcee atau melalui [OpenRouter](/id/providers/openrouter).

| Properti | Nilai                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Penyedia | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter)           |
| API      | Kompatibel dengan OpenAI                                                              |
| URL Dasar | `https://api.arcee.ai/api/v1` (langsung) atau `https://openrouter.ai/api/v1` (OpenRouter) |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Memulai

<Tabs>
  <Tab title="Langsung (platform Arcee)">
    <Steps>
      <Step title="Dapatkan kunci API">
        Buat kunci API di [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Melalui OpenRouter">
    <Steps>
      <Step title="Dapatkan kunci API">
        Buat kunci API di [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Ref model yang sama berfungsi untuk penyiapan langsung maupun OpenRouter (misalnya `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Penyiapan non-interaktif

<Tabs>
  <Tab title="Langsung (platform Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Melalui OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Katalog bawaan

OpenClaw saat ini menyertakan katalog statis Arcee ini:

| Ref model                      | Nama                   | Input | Konteks | Biaya (masuk/keluar per 1 juta) | Catatan                                  |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------------------- | ---------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90                    | Model default; penalaran diaktifkan      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00                    | Serbaguna; 400B parameter, 13B aktif     |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15                   | Cepat dan hemat biaya; pemanggilan fungsi |

<Tip>
Preset onboarding menetapkan `arcee/trinity-large-thinking` sebagai model default.
</Tip>

## Fitur yang didukung

| Fitur                                         | Didukung                                     |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ya                                           |
| Penggunaan alat / pemanggilan fungsi          | Ya (Trinity Mini, Trinity Large Preview)     |
| Output terstruktur (mode JSON dan skema JSON) | Ya                                           |
| Pemikiran diperluas                           | Ya (Trinity Large Thinking; alat dinonaktifkan) |

<AccordionGroup>
  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `ARCEEAI_API_KEY`
    (atau `OPENROUTER_API_KEY`) tersedia untuk proses tersebut (misalnya, di
    `~/.openclaw/.env` atau melalui `env.shellEnv`).
  </Accordion>

  <Accordion title="Perutean OpenRouter">
    Saat menggunakan model Arcee melalui OpenRouter, ref model `arcee/*` yang sama berlaku.
    OpenClaw menangani perutean secara transparan berdasarkan pilihan auth Anda. Lihat
    [dokumentasi penyedia OpenRouter](/id/providers/openrouter) untuk detail konfigurasi
    khusus OpenRouter.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/id/providers/openrouter" icon="shuffle">
    Akses model Arcee dan banyak lainnya melalui satu kunci API.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
</CardGroup>
