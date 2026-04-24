---
read_when:
    - Anda menginginkan akses model yang dihosting oleh OpenCode
    - Anda ingin memilih antara katalog Zen dan Go
summary: Gunakan katalog OpenCode Zen dan Go dengan OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T09:23:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode mengekspos dua katalog yang dihosting di OpenClaw:

| Katalog | Prefiks           | Provider runtime |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Kedua katalog menggunakan API key OpenCode yang sama. OpenClaw tetap memisahkan id provider runtime
agar perutean per model di upstream tetap benar, tetapi onboarding dan dokumentasi memperlakukannya
sebagai satu penyiapan OpenCode.

## Memulai

<Tabs>
  <Tab title="Katalog Zen">
    **Paling cocok untuk:** proxy multi-model OpenCode yang dikurasi (Claude, GPT, Gemini).

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
    **Paling cocok untuk:** jajaran Kimi, GLM, dan MiniMax yang dihosting OpenCode.

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
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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

## Contoh konfigurasi

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Katalog bawaan

### Zen

| Properti         | Nilai                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Provider runtime | `opencode`                                                              |
| Contoh model     | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Properti         | Nilai                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Provider runtime | `opencode-go`                                                             |
| Contoh model     | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Alias API key">
    `OPENCODE_ZEN_API_KEY` juga didukung sebagai alias untuk `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Kredensial bersama">
    Memasukkan satu key OpenCode selama penyiapan akan menyimpan kredensial untuk kedua provider runtime.
    Anda tidak perlu menjalankan onboarding untuk setiap katalog secara terpisah.
  </Accordion>

  <Accordion title="Penagihan dan dasbor">
    Anda masuk ke OpenCode, menambahkan detail penagihan, dan menyalin API key Anda. Penagihan
    dan ketersediaan katalog dikelola dari dasbor OpenCode.
  </Accordion>

  <Accordion title="Perilaku replay Gemini">
    Referensi OpenCode berbasis Gemini tetap berada di jalur proxy-Gemini, sehingga OpenClaw tetap
    menjalankan sanitasi tanda tangan pemikiran Gemini di sana tanpa mengaktifkan validasi replay Gemini native
    atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Perilaku replay non-Gemini">
    Referensi OpenCode non-Gemini mempertahankan kebijakan replay kompatibel OpenAI yang minimal.
  </Accordion>
</AccordionGroup>

<Tip>
Memasukkan satu key OpenCode selama penyiapan akan menyimpan kredensial untuk provider runtime Zen dan
Go, sehingga Anda hanya perlu menjalankan onboarding sekali.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
