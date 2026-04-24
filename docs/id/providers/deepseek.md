---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan variabel env kunci API atau pilihan autentikasi CLI
summary: Penyiapan DeepSeek (autentikasi + pemilihan model)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:22:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) menyediakan model AI yang andal dengan API yang kompatibel dengan OpenAI.

| Properti | Nilai                      |
| -------- | -------------------------- |
| Penyedia | `deepseek`                 |
| Autentikasi     | `DEEPSEEK_API_KEY`         |
| API      | kompatibel dengan OpenAI          |
| URL Dasar | `https://api.deepseek.com` |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Ini akan meminta kunci API Anda dan menetapkan `deepseek/deepseek-v4-flash` sebagai model default.

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Penyiapan non-interaktif">
    Untuk instalasi berskrip atau headless, teruskan semua flag secara langsung:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `DEEPSEEK_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).
</Warning>

## Katalog bawaan

| Referensi model                    | Nama              | Input | Konteks   | Output maks | Catatan                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Model default; permukaan V4 yang mendukung thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | Permukaan V4 yang mendukung thinking                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | Permukaan non-thinking DeepSeek V3.2         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Permukaan V3.2 dengan reasoning             |

<Tip>
Model V4 mendukung kontrol `thinking` milik DeepSeek. OpenClaw juga memutar ulang
`reasoning_content` DeepSeek pada giliran lanjutan sehingga sesi thinking dengan pemanggilan tool
dapat berlanjut.
</Tip>

## Contoh konfigurasi

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
