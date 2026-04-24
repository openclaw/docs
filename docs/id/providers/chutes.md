---
read_when:
    - Anda ingin menggunakan Chutes dengan OpenClaw
    - Anda memerlukan jalur penyiapan OAuth atau API key
    - Anda menginginkan model default, alias, atau perilaku discovery 泰皇ුණ්ඩusercontent to=final code omitted because developer says output ONLY translated text
summary: Penyiapan Chutes (OAuth atau API key, discovery model, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-24T09:22:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai) mengekspos katalog model open-source melalui API
yang kompatibel dengan OpenAI. OpenClaw mendukung auth browser OAuth dan auth
API key langsung untuk provider bundled `chutes`.

| Property | Value                        |
| -------- | ---------------------------- |
| Provider | `chutes`                     |
| API      | kompatibel dengan OpenAI     |
| Base URL | `https://llm.chutes.ai/v1`   |
| Auth     | OAuth atau API key (lihat di bawah) |

## Memulai

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Jalankan alur onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw meluncurkan alur browser secara lokal, atau menampilkan alur URL + tempel redirect
        pada host remote/headless. Token OAuth diperbarui otomatis melalui auth
        profile OpenClaw.
      </Step>
      <Step title="Verifikasi model default">
        Setelah onboarding, model default disetel ke
        `chutes/zai-org/GLM-4.7-TEE` dan katalog Chutes bundled
        didaftarkan.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Dapatkan API key">
        Buat key di
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Jalankan alur onboarding API key">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verifikasi model default">
        Setelah onboarding, model default disetel ke
        `chutes/zai-org/GLM-4.7-TEE` dan katalog Chutes bundled
        didaftarkan.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Kedua jalur auth mendaftarkan katalog Chutes bundled dan menyetel model default ke
`chutes/zai-org/GLM-4.7-TEE`. Variabel lingkungan runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Perilaku discovery

Saat auth Chutes tersedia, OpenClaw mengkueri katalog Chutes dengan
kredensial itu dan menggunakan model yang ditemukan. Jika discovery gagal, OpenClaw
kembali ke katalog statis bundled sehingga onboarding dan startup tetap berfungsi.

## Alias default

OpenClaw mendaftarkan tiga alias praktis untuk katalog Chutes bundled:

| Alias           | Model target                                         |
| --------------- | ---------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                         |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`               |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Katalog awal bawaan

Katalog fallback bundled mencakup ref Chutes saat ini:

| Model ref                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Contoh konfigurasi

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Override OAuth">
    Anda dapat menyesuaikan alur OAuth dengan variabel lingkungan opsional:

    | Variable | Purpose |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Client ID OAuth kustom |
    | `CHUTES_CLIENT_SECRET` | Client secret OAuth kustom |
    | `CHUTES_OAUTH_REDIRECT_URI` | Redirect URI kustom |
    | `CHUTES_OAUTH_SCOPES` | Scope OAuth kustom |

    Lihat [dokumen OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    untuk persyaratan aplikasi redirect dan bantuan.

  </Accordion>

  <Accordion title="Catatan">
    - Discovery API-key dan OAuth sama-sama menggunakan id provider `chutes`.
    - Model Chutes didaftarkan sebagai `chutes/<model-id>`.
    - Jika discovery gagal saat startup, katalog statis bundled digunakan secara otomatis.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Aturan provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan provider.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dasbor Chutes dan dokumen API.
  </Card>
  <Card title="API key Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Buat dan kelola API key Chutes.
  </Card>
</CardGroup>
