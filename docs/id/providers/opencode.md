---
read_when:
    - Anda ingin akses model yang dihosting OpenCode
    - Anda ingin memilih antara katalog Zen dan Go
summary: Gunakan katalog OpenCode Zen dan Go dengan OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T14:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode menyediakan dua katalog yang dihosting di OpenClaw:

| Katalog | Awalan            | Penyedia runtime |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Kedua katalog menggunakan satu kunci API OpenCode yang sama (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). OpenClaw tetap memisahkan id penyedia runtime agar
perutean per model di upstream tetap benar, tetapi proses onboarding dan dokumentasi memperlakukannya sebagai
satu penyiapan OpenCode.

## Memulai

<Tabs>
  <Tab title="Katalog Zen">
    **Paling cocok untuk:** proksi multimodel OpenCode pilihan (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model Zen sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Katalog Go">
    **Paling cocok untuk:** jajaran Kimi, GLM, MiniMax, Qwen, dan DeepSeek yang dihosting OpenCode.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model Go sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Pastikan model tersedia">
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

Jalankan `openclaw models list --provider opencode` untuk melihat daftar lengkap saat ini, yang
juga mencakup baris tingkat gratis seperti `opencode/big-pickle` dan
`opencode/deepseek-v4-flash-free`.

### Go

| Properti         | Nilai                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Penyedia runtime | `opencode-go`                                                            |
| Contoh model     | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Lihat [OpenCode Go](/id/providers/opencode-go) untuk tabel lengkap model Go.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Alias kunci API">
    `OPENCODE_ZEN_API_KEY` juga diterima sebagai alias untuk `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Kredensial bersama">
    Memasukkan satu kunci OpenCode selama penyiapan akan menyimpan kredensial untuk kedua
    penyedia runtime. Anda tidak perlu melakukan onboarding untuk setiap katalog secara terpisah.
  </Accordion>

  <Accordion title="Mendapatkan kunci API">
    Buat akun OpenCode dan hasilkan kunci API di
    [opencode.ai/auth](https://opencode.ai/auth). Penagihan dan ketersediaan katalog
    dikelola dari dasbor OpenCode.
  </Accordion>

  <Accordion title="Perilaku pemutaran ulang Gemini">
    Referensi OpenCode berbasis Gemini tetap berada di jalur proksi Gemini, sehingga OpenClaw tetap
    melakukan sanitasi tanda tangan pemikiran Gemini di sana tanpa mengaktifkan validasi
    pemutaran ulang Gemini native atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Perilaku pemutaran ulang non-Gemini">
    Referensi OpenCode non-Gemini tetap menggunakan kebijakan pemutaran ulang minimal yang kompatibel dengan OpenAI.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/id/providers/opencode-go" icon="server">
    Referensi lengkap katalog Go.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
