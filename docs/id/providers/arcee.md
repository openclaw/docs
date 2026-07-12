---
read_when:
    - Anda ingin menggunakan Arcee AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Arcee AI (autentikasi + pemilihan model)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T14:35:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) menyediakan keluarga model mixture-of-experts Trinity melalui API yang kompatibel dengan OpenAI. Semua model Trinity berlisensi Apache 2.0. Arcee adalah plugin resmi OpenClaw yang tidak disertakan bersama inti, sehingga memerlukan langkah instalasi sebelum orientasi awal.

Akses model Arcee secara langsung melalui platform Arcee atau melalui [OpenRouter](/id/providers/openrouter).

| Properti | Nilai                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Penyedia | `arcee`                                                                               |
| Autentikasi | `ARCEEAI_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter)         |
| API      | Kompatibel dengan OpenAI                                                              |
| URL dasar | `https://api.arcee.ai/api/v1` (langsung) atau `https://openrouter.ai/api/v1` (OpenRouter) |

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
      <Step title="Jalankan orientasi awal">
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
      <Step title="Jalankan orientasi awal">
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

        Referensi model yang sama dapat digunakan untuk penyiapan langsung maupun melalui OpenRouter.
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

## Katalog bawaan

| Referensi model                | Nama                   | Masukan | Konteks | Keluaran maks. | Biaya (masuk/keluar per 1 jt.) | Alat | Catatan                                   |
| ------------------------------ | ---------------------- | ------- | ------- | -------------- | ------------------------------ | ---- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | teks    | 256K    | 80K            | $0.25 / $0.90                  | Tidak | Model default; penalaran diperluas        |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | teks    | 128K    | 16K            | $0.25 / $1.00                  | Ya   | Serbaguna; 400 miliar parameter, 13 miliar aktif |
| `arcee/trinity-mini`           | Trinity Mini 26B       | teks    | 128K    | 80K            | $0.045 / $0.15                 | Ya   | Cepat dan hemat biaya; pemanggilan fungsi |

<Tip>
Preset orientasi awal menetapkan `arcee/trinity-large-thinking` sebagai model default.
</Tip>

## Fitur yang didukung

| Fitur                                         | Dukungan                                     |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ya                                           |
| Penggunaan alat / pemanggilan fungsi          | Ya (Trinity Mini, Trinity Large Preview)     |
| Keluaran terstruktur (mode JSON dan skema JSON) | Ya                                         |
| Penalaran diperluas                           | Ya (Trinity Large Thinking; alat dinonaktifkan) |

<AccordionGroup>
  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `ARCEEAI_API_KEY`
    (atau `OPENROUTER_API_KEY`) tersedia untuk proses tersebut, misalnya di
    `~/.openclaw/.env` atau melalui `env.shellEnv`.
  </Accordion>

  <Accordion title="Perutean OpenRouter">
    Saat menggunakan model Arcee melalui OpenRouter, referensi model `arcee/*` yang sama tetap berlaku.
    OpenClaw melakukan perutean secara transparan berdasarkan pilihan autentikasi Anda. Lihat
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
