---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan var env kunci API atau pilihan autentikasi CLI
summary: Penyiapan DeepSeek (auth + pemilihan model)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T09:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) menyediakan model AI yang canggih dengan API yang kompatibel dengan OpenAI.

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

    Ini akan meminta kunci API Anda dan menetapkan `deepseek/deepseek-chat` sebagai model default.

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Penyiapan non-interaktif">
    Untuk instalasi yang discript atau tanpa antarmuka, teruskan semua flag secara langsung:

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

| Referensi model                    | Nama              | Input | Konteks | Output maks | Catatan                                             |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | Model default; permukaan DeepSeek V3.2 non-thinking |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | Permukaan V3.2 dengan kemampuan penalaran                    |

<Tip>
Kedua model bawaan saat ini mengiklankan kompatibilitas penggunaan streaming dalam source.
</Tip>

## Contoh konfigurasi

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
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
