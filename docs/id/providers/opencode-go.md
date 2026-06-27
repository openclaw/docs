---
read_when:
    - Anda menginginkan katalog OpenCode Go
    - Anda memerlukan ref model runtime untuk model yang di-host di Go
summary: Gunakan katalog OpenCode Go dengan penyiapan OpenCode bersama
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:06:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go adalah katalog Go dalam [OpenCode](/id/providers/opencode).
Katalog ini menggunakan `OPENCODE_API_KEY` yang sama dengan katalog Zen, tetapi mempertahankan
id penyedia runtime `opencode-go` agar perutean per-model upstream tetap benar.

| Properti         | Nilai                           |
| ---------------- | ------------------------------- |
| Penyedia runtime | `opencode-go`                   |
| Autentikasi      | `OPENCODE_API_KEY`              |
| Penyiapan induk  | [OpenCode](/id/providers/opencode) |

## Katalog bawaan

OpenClaw mengambil sebagian besar baris katalog Go dari registri model OpenClaw bawaan dan
melengkapi baris upstream terkini sementara registri menyusul. Jalankan
`openclaw models list --provider opencode-go` untuk daftar model saat ini.

Penyedia ini mencakup:

| Ref model                       | Nama                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (batas 3x)  |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 menggunakan jendela konteks 1 juta token dan mendukung hingga 131 ribu token output.

## Memulai

<Tabs>
  <Tab title="Interaktif">
    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="Non-interaktif">
    <Steps>
      <Step title="Berikan kunci secara langsung">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku perutean">
    OpenClaw menangani perutean per-model secara otomatis saat ref model menggunakan
    `opencode-go/...`. Tidak diperlukan konfigurasi penyedia tambahan.
  </Accordion>

  <Accordion title="Konvensi ref runtime">
    Ref runtime tetap eksplisit: `opencode/...` untuk Zen, `opencode-go/...` untuk Go.
    Ini menjaga perutean per-model upstream tetap benar di kedua katalog.
  </Accordion>

  <Accordion title="Kredensial bersama">
    `OPENCODE_API_KEY` yang sama digunakan oleh katalog Zen dan Go. Memasukkan
    kunci selama penyiapan menyimpan kredensial untuk kedua penyedia runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Lihat [OpenCode](/id/providers/opencode) untuk ringkasan onboarding bersama dan referensi katalog
Zen + Go lengkap.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenCode (induk)" href="/id/providers/opencode" icon="server">
    Onboarding bersama, ringkasan katalog, dan catatan lanjutan.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
</CardGroup>
