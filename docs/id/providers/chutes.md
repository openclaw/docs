---
read_when:
    - Anda ingin menggunakan Chutes dengan OpenClaw
    - Anda memerlukan jalur penyiapan OAuth atau kunci API
    - Anda menginginkan model default, alias, atau perilaku penemuan
summary: Penyiapan Chutes (OAuth atau kunci API, penemuan model, alias)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:02:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) mengekspos katalog model sumber terbuka melalui API yang
kompatibel dengan OpenAI. OpenClaw mendukung OAuth browser dan autentikasi
kunci API langsung untuk provider `chutes`.

| Properti | Nilai                        |
| -------- | ---------------------------- |
| Provider | `chutes`                     |
| API      | Kompatibel dengan OpenAI     |
| URL Dasar | `https://llm.chutes.ai/v1`   |
| Autentikasi | OAuth atau kunci API (lihat di bawah) |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Memulai

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Jalankan alur onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw menjalankan alur browser secara lokal, atau menampilkan alur URL +
        tempel pengalihan pada host jarak jauh/headless. Token OAuth disegarkan
        otomatis melalui profil autentikasi OpenClaw.
      </Step>
      <Step title="Verifikasi model default">
        Setelah onboarding, model default diatur ke
        `chutes/zai-org/GLM-4.7-TEE` dan katalog statis Chutes
        didaftarkan.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Kunci API">
    <Steps>
      <Step title="Dapatkan kunci API">
        Buat kunci di
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Jalankan alur onboarding kunci API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verifikasi model default">
        Setelah onboarding, model default diatur ke
        `chutes/zai-org/GLM-4.7-TEE` dan katalog statis Chutes
        didaftarkan.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Kedua jalur autentikasi mendaftarkan katalog statis Chutes dan mengatur model
default ke `chutes/zai-org/GLM-4.7-TEE`. Variabel lingkungan runtime:
`CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`.
</Note>

## Perilaku penemuan

Saat autentikasi Chutes tersedia, OpenClaw mengueri katalog Chutes dengan
kredensial tersebut dan menggunakan model yang ditemukan. Jika penemuan gagal,
OpenClaw beralih ke katalog statis agar onboarding dan startup tetap berjalan.

## Alias default

OpenClaw mendaftarkan tiga alias praktis untuk katalog statis Chutes:

| Alias           | Model target                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Katalog pemula bawaan

Katalog fallback statis mencakup ref Chutes saat ini:

| Ref model                                             |
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

    | Variabel | Tujuan |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID klien OAuth kustom |
    | `CHUTES_CLIENT_SECRET` | Rahasia klien OAuth kustom |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI pengalihan kustom |
    | `CHUTES_OAUTH_SCOPES` | Cakupan OAuth kustom |

    Lihat [dokumentasi OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    untuk persyaratan aplikasi pengalihan dan bantuan.

  </Accordion>

  <Accordion title="Catatan">
    - Penemuan kunci API dan OAuth sama-sama menggunakan ID provider `chutes`.
    - Model Chutes didaftarkan sebagai `chutes/<model-id>`.
    - Jika penemuan gagal saat startup, katalog statis digunakan secara otomatis.

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
    Dasbor Chutes dan dokumentasi API.
  </Card>
  <Card title="Kunci API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Buat dan kelola kunci API Chutes.
  </Card>
</CardGroup>
