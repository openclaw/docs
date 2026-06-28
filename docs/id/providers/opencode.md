---
read_when:
    - Anda menginginkan akses model yang dihosting OpenCode
    - Anda ingin memilih antara katalog Zen dan Go
summary: Gunakan katalog OpenCode Zen dan Go dengan OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:55:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenCode mengekspos dua katalog hosting di OpenClaw:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Kedua katalog menggunakan OpenCode API key yang sama. OpenClaw tetap memisahkan ID penyedia runtime agar perutean per-model upstream tetap benar, tetapi onboarding dan dokumentasi memperlakukannya sebagai satu penyiapan OpenCode.

## Memulai

<Tabs>
  <Tab title="Katalog Zen">
    **Terbaik untuk:** proxy multi-model OpenCode yang telah dikurasi (Claude, GPT, Gemini).

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Atau berikan key secara langsung:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model Zen sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Katalog Go">
    **Terbaik untuk:** jajaran Kimi, GLM, dan MiniMax yang dihosting OpenCode.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Atau berikan key secara langsung:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model Go sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Contoh config

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Katalog bawaan

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Penyedia runtime | `opencode`                                                              |
| Contoh model     | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Penyedia runtime | `opencode-go`                                                            |
| Contoh model     | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Alias API key">
    `OPENCODE_ZEN_API_KEY` juga didukung sebagai alias untuk `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Kredensial bersama">
    Memasukkan satu key OpenCode saat penyiapan akan menyimpan kredensial untuk kedua penyedia runtime. Anda tidak perlu melakukan onboarding untuk setiap katalog secara terpisah.
  </Accordion>

  <Accordion title="Penagihan dan dashboard">
    Anda masuk ke OpenCode, menambahkan detail penagihan, dan menyalin API key Anda. Penagihan dan ketersediaan katalog dikelola dari dashboard OpenCode.
  </Accordion>

  <Accordion title="Perilaku replay Gemini">
    Ref OpenCode berbasis Gemini tetap berada di jalur proxy-Gemini, sehingga OpenClaw mempertahankan sanitasi thought-signature Gemini di sana tanpa mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Perilaku replay non-Gemini">
    Ref OpenCode non-Gemini mempertahankan kebijakan replay minimal yang kompatibel dengan OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Memasukkan satu key OpenCode saat penyiapan akan menyimpan kredensial untuk penyedia runtime Zen dan Go, jadi Anda hanya perlu onboarding sekali.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi config lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
