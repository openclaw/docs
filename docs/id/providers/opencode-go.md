---
read_when:
    - Anda menginginkan katalog OpenCode Go
    - Anda memerlukan referensi model runtime untuk model yang dihosting di Go
summary: Gunakan katalog OpenCode Go dengan penyiapan OpenCode bersama
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T14:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go adalah katalog Go di dalam [OpenCode](/id/providers/opencode). Katalog ini menggunakan
kredensial `OPENCODE_API_KEY` yang sama dengan katalog Zen, tetapi tetap memiliki
id penyedia runtime sendiri (`opencode-go`) agar perutean per model di hulu tetap
benar.

| Properti          | Nilai                                              |
| ----------------- | -------------------------------------------------- |
| Penyedia runtime  | `opencode-go`                                      |
| Autentikasi       | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Penyiapan induk   | [OpenCode](/id/providers/opencode)                    |

## Memulai

<Tabs>
  <Tab title="Interaktif">
    <Steps>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="Noninteraktif">
    <Steps>
      <Step title="Berikan kunci secara langsung">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Katalog bawaan

Jalankan `openclaw models list --provider opencode-go` untuk melihat daftar model saat ini.
Baris yang disertakan:

| Referensi model                  | Nama              | Konteks   | Output maks. | Input gambar |
| -------------------------------- | ----------------- | --------- | ------------ | ------------ |
| `opencode-go/deepseek-v4-pro`    | DeepSeek V4 Pro   | 1M        | 384K         | Tidak        |
| `opencode-go/deepseek-v4-flash`  | DeepSeek V4 Flash | 1M        | 384K         | Tidak        |
| `opencode-go/glm-5`              | GLM-5             | 202,752   | 32,768       | Tidak        |
| `opencode-go/glm-5.1`            | GLM-5.1           | 202,752   | 32,768       | Tidak        |
| `opencode-go/glm-5.2`            | GLM-5.2           | 1M        | 131,072      | Tidak        |
| `opencode-go/hy3-preview`        | HY3 Preview       | 262,144   | 32,768       | Tidak        |
| `opencode-go/kimi-k2.5`          | Kimi K2.5         | 262,144   | 65,536       | Ya           |
| `opencode-go/kimi-k2.6`          | Kimi K2.6         | 262,144   | 65,536       | Ya           |
| `opencode-go/kimi-k2.7-code`     | Kimi K2.7 Code    | 262,144   | 262,144      | Ya           |
| `opencode-go/mimo-v2.5`          | MiMo V2.5         | 1M        | 128,000      | Ya           |
| `opencode-go/mimo-v2.5-pro`      | MiMo V2.5 Pro     | 1,048,576 | 128,000      | Tidak        |
| `opencode-go/minimax-m2.5`       | MiniMax M2.5      | 204,800   | 65,536       | Tidak        |
| `opencode-go/minimax-m2.7`       | MiniMax M2.7      | 204,800   | 131,072      | Tidak        |
| `opencode-go/minimax-m3`         | MiniMax M3        | 204,800   | 131,072      | Tidak        |
| `opencode-go/qwen3.5-plus`       | Qwen3.5 Plus      | 262,144   | 65,536       | Ya           |
| `opencode-go/qwen3.6-plus`       | Qwen3.6 Plus      | 262,144   | 65,536       | Ya           |
| `opencode-go/qwen3.7-max`        | Qwen3.7 Max       | 1M        | 65,536       | Tidak        |
| `opencode-go/qwen3.7-plus`       | Qwen3.7 Plus      | 1M        | 65,536       | Ya           |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku perutean">
    OpenClaw merutekan setiap referensi model `opencode-go/...` secara otomatis. Tidak diperlukan
    konfigurasi penyedia tambahan.
  </Accordion>

  <Accordion title="Konvensi referensi runtime">
    Referensi runtime tetap eksplisit: `opencode/...` untuk Zen, `opencode-go/...` untuk
    Go. Hal ini menjaga perutean per model di hulu tetap benar pada kedua katalog.
  </Accordion>

  <Accordion title="Kredensial bersama">
    Satu `OPENCODE_API_KEY` mencakup katalog Zen dan Go. Memasukkan
    kunci selama penyiapan akan menyimpan kredensial untuk kedua penyedia runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Lihat [OpenCode](/id/providers/opencode) untuk ikhtisar orientasi awal bersama dan referensi
lengkap katalog Zen + Go.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenCode (induk)" href="/id/providers/opencode" icon="server">
    Orientasi awal bersama, ikhtisar katalog, dan catatan lanjutan.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
</CardGroup>
