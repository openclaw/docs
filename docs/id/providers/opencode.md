---
read_when:
    - Anda menginginkan akses model yang dihosting OpenCode
    - Anda ingin memilih antara katalog Zen dan Go
summary: Gunakan katalog OpenCode Zen dan Go dengan OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:44:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode mengekspos dua katalog yang di-hosting di OpenClaw:

| Katalog | Prefiks           | Penyedia runtime |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Kedua katalog menggunakan kunci API OpenCode yang sama. OpenClaw menjaga id penyedia runtime
tetap terpisah agar perutean per-model upstream tetap benar, tetapi onboarding dan dokumentasi memperlakukannya
sebagai satu penyiapan OpenCode.

## Memulai

<Tabs>
  <Tab title="Katalog Zen">
    **Paling cocok untuk:** proxy multi-model OpenCode yang dikurasi (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Atau berikan kuncinya secara langsung:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model Zen sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Katalog Go">
    **Paling cocok untuk:** jajaran Kimi, GLM, dan MiniMax yang di-hosting OpenCode.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Atau berikan kuncinya secara langsung:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model Go sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
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

| Properti         | Nilai                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Penyedia runtime | `opencode`                                                                                    |
| Contoh model     | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Properti         | Nilai                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Penyedia runtime | `opencode-go`                                                            |
| Contoh model     | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Alias kunci API">
    `OPENCODE_ZEN_API_KEY` juga didukung sebagai alias untuk `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Kredensial bersama">
    Memasukkan satu kunci OpenCode selama penyiapan menyimpan kredensial untuk kedua penyedia runtime.
    Anda tidak perlu melakukan onboarding untuk setiap katalog secara terpisah.
  </Accordion>

  <Accordion title="Penagihan dan dasbor">
    Anda masuk ke OpenCode, menambahkan detail penagihan, dan menyalin kunci API Anda. Penagihan
    dan ketersediaan katalog dikelola dari dasbor OpenCode.
  </Accordion>

  <Accordion title="Perilaku replay Gemini">
    Ref OpenCode berbasis Gemini tetap berada di jalur proxy-Gemini, sehingga OpenClaw mempertahankan
    sanitasi signature pemikiran Gemini di sana tanpa mengaktifkan validasi replay Gemini native
    atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Perilaku replay non-Gemini">
    Ref OpenCode non-Gemini mempertahankan kebijakan replay minimal yang kompatibel dengan OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Memasukkan satu kunci OpenCode selama penyiapan menyimpan kredensial untuk penyedia runtime Zen dan
Go, sehingga Anda hanya perlu melakukan onboarding sekali.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
