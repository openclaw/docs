---
read_when:
    - Anda ingin menggunakan Arcee AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Arcee AI (autentikasi + pemilihan model)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-19T05:07:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c2fc7b8d86dd0d2a300dfc48951657cbcfcd9250016f52c1804777b2966e11
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) menyediakan keluarga model mixture-of-experts Trinity melalui API yang kompatibel dengan OpenAI. Semua model Trinity berlisensi Apache 2.0. Arcee adalah plugin resmi OpenClaw yang tidak dibundel dengan inti, sehingga memerlukan langkah instalasi sebelum onboarding.

Akses model Arcee secara langsung melalui platform Arcee atau melalui [OpenRouter](/id/providers/openrouter).

| Properti | Nilai                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Penyedia | `arcee`                                                                               |
| Autentikasi     | `ARCEEAI_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter)                   |
| API      | Kompatibel dengan OpenAI                                                                     |
| URL Dasar | `https://api.arcee.ai/api/v1` (langsung) atau `https://openrouter.ai/api/v1` (OpenRouter) |

## Instal plugin

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

        Referensi model yang sama berfungsi untuk penyiapan langsung maupun OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Penyiapan noninteraktif

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

## Katalog langsung Arcee

| Referensi model                      | Nama                   | Masukan | Konteks | Keluaran maks. | Biaya (masuk/keluar per 1 juta) | Alat | Catatan                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | teks  | 256K    | 80K        | $0.25 / $0.90        | Tidak    | Model default; pemikiran mendalam          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | teks  | 128K    | 16K        | $0.25 / $1.00        | Ya   | Serbaguna; 400B parameter, 13B aktif  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | teks  | 128K    | 80K        | $0.045 / $0.15       | Ya   | Cepat dan hemat biaya; pemanggilan fungsi |

<Tip>
Preset onboarding menetapkan `arcee/trinity-large-thinking` sebagai model default.
</Tip>

## Katalog OpenRouter

Onboarding OpenRouter menyediakan `arcee/trinity-large-preview` dan `arcee/trinity-large-thinking`. OpenClaw mempertahankan referensi model berkualifikasi penyedia tersebut dalam konfigurasi dan mengirim ID runtime kanonis OpenRouter `arcee-ai/*`. Trinity Mini tidak lagi disediakan oleh OpenRouter; gunakan API Arcee langsung untuk model tersebut.

## Fitur yang didukung

| Fitur                                       | Didukung                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ya                                          |
| Penggunaan alat / pemanggilan fungsi                   | Ya (Trinity Mini, Trinity Large Preview)    |
| Keluaran terstruktur (mode JSON dan skema JSON) | Ya                                          |
| Pemikiran mendalam                             | Ya (Trinity Large Thinking; alat dinonaktifkan) |

<AccordionGroup>
  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `ARCEEAI_API_KEY`
    (atau `OPENROUTER_API_KEY`) tersedia untuk proses tersebut, misalnya di
    `~/.openclaw/.env` atau melalui `env.shellEnv`.
  </Accordion>

  <Accordion title="Perutean OpenRouter">
    OpenRouter menggunakan referensi model OpenClaw `arcee/trinity-large-thinking` yang sama.
    OpenClaw merutekannya dengan ID runtime OpenRouter kanonis
    `arcee-ai/trinity-large-thinking`. Lihat
    [dokumentasi penyedia OpenRouter](/id/providers/openrouter) untuk detail konfigurasi
    khusus OpenRouter.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/id/providers/openrouter" icon="shuffle">
    Akses model Arcee dan banyak model lainnya melalui satu kunci API.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
</CardGroup>
