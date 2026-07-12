---
read_when:
    - Anda ingin menggunakan Chutes dengan OpenClaw
    - Anda memerlukan jalur penyiapan OAuth atau kunci API
    - Anda menginginkan model bawaan, alias, atau perilaku penemuan
summary: Penyiapan Chutes (OAuth atau kunci API, penemuan model, alias)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T14:32:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) menyediakan katalog model sumber terbuka melalui API yang kompatibel dengan OpenAI. OpenClaw mendukung OAuth berbasis peramban dan autentikasi kunci API.

| Properti              | Nilai                                                    |
| --------------------- | -------------------------------------------------------- |
| Penyedia              | `chutes`                                                 |
| Plugin                | paket eksternal resmi (`@openclaw/chutes-provider`)      |
| API                   | kompatibel dengan OpenAI                                 |
| URL dasar             | `https://llm.chutes.ai/v1`                               |
| Autentikasi           | OAuth atau kunci API (lihat di bawah)                    |
| Variabel lingkungan runtime | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`             |

`CHUTES_OAUTH_TOKEN` secara langsung menyediakan token akses OAuth yang telah diperoleh
(misalnya di CI), sehingga melewati alur peramban interaktif di bawah ini.

## Instal Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Memulai

Kedua jalur menetapkan model default ke `chutes/zai-org/GLM-4.7-TEE` dan mendaftarkan
katalog Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Jalankan alur orientasi OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw menjalankan alur peramban secara lokal, atau menampilkan alur URL +
        penempelan pengalihan pada host jarak jauh/tanpa antarmuka grafis. Token OAuth
        disegarkan secara otomatis melalui profil autentikasi OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Kunci API">
    <Steps>
      <Step title="Dapatkan kunci API">
        Buat kunci di
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Jalankan alur orientasi kunci API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Perilaku penemuan

Ketika autentikasi Chutes tersedia, OpenClaw meminta `GET /v1/models` menggunakan
kredensial tersebut dan menggunakan model yang ditemukan, yang disimpan dalam cache
selama 5 menit per kredensial. Jika kunci kedaluwarsa/tidak diotorisasi (HTTP 401),
OpenClaw mencoba kembali satu kali tanpa kredensial. Jika penemuan tetap tidak
menghasilkan baris, gagal, atau mengembalikan status non-2xx lainnya, OpenClaw beralih
ke katalog statis yang dibundel (penemuan melalui kunci API dan OAuth menggunakan
jalur yang sama). Jika penemuan gagal saat dimulai, katalog statis digunakan secara
otomatis.

## Alias default

OpenClaw mendaftarkan tiga alias praktis untuk katalog Chutes:

| Alias           | Model target                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Katalog awal bawaan

Katalog cadangan yang dibundel memiliki 47 model. Berikut sampel representatif dari referensi saat ini:

| Referensi model                                       |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Jalankan `openclaw models list --all --provider chutes` untuk melihat daftar lengkap.

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
  <Accordion title="Penggantian OAuth">
    Sesuaikan alur OAuth dengan variabel lingkungan opsional:

    | Variabel | Tujuan |
    | -------- | ------ |
    | `CHUTES_CLIENT_ID` | ID klien OAuth (diminta jika tidak ditetapkan) |
    | `CHUTES_CLIENT_SECRET` | Rahasia klien OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI pengalihan (default `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Cakupan yang dipisahkan spasi (default `openid profile chutes:invoke`) |

    Lihat [dokumentasi OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    untuk persyaratan aplikasi pengalihan dan bantuan.

  </Accordion>

  <Accordion title="Catatan">
    - Model Chutes didaftarkan sebagai `chutes/<model-id>`.
    - Chutes tidak melaporkan penggunaan token selama streaming (`supportsUsageInStreaming: false`); total penggunaan tetap ditampilkan setelah streaming selesai.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Aturan penyedia, referensi model, dan perilaku pengalihan saat gagal.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap, termasuk pengaturan penyedia.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dasbor Chutes dan dokumentasi API.
  </Card>
  <Card title="Kunci API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Buat dan kelola kunci API Chutes.
  </Card>
</CardGroup>
