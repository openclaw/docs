---
read_when:
    - Anda ingin menggunakan Chutes dengan OpenClaw
    - Anda memerlukan alur penyiapan OAuth atau kunci API
    - Anda menginginkan model default, alias, atau perilaku penemuan
summary: Penyiapan Chutes (OAuth atau kunci API, penemuan model, alias)
title: Chutes
x-i18n:
    generated_at: "2026-07-19T05:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 57ea5112105f19028c1a348b4d7fec4cf7ef12de00b1b2de9c152057bf5033a9
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) menyediakan katalog model sumber terbuka melalui API yang kompatibel dengan
OpenAI. OpenClaw mendukung OAuth browser dan autentikasi kunci API.

| Properti         | Nilai                                                   |
| ---------------- | ------------------------------------------------------- |
| Penyedia         | `chutes`                                                |
| Plugin           | paket eksternal resmi (`@openclaw/chutes-provider`) |
| API              | kompatibel dengan OpenAI                                       |
| URL dasar         | `https://llm.chutes.ai/v1`                              |
| Autentikasi             | OAuth atau kunci API (lihat di bawah)                            |
| Variabel lingkungan runtime | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` memasok token akses OAuth yang telah diperoleh secara langsung
(misalnya dalam CI), sehingga melewati alur browser interaktif di bawah ini.

## Instal Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Memulai

Kedua jalur menetapkan model default ke `chutes/zai-org/GLM-5-TEE` dan mendaftarkan
katalog Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Jalankan alur orientasi OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw meluncurkan alur browser secara lokal, atau menampilkan alur URL +
        tempel pengalihan pada host jarak jauh/headless. Token OAuth diperbarui secara
        otomatis melalui profil autentikasi OpenClaw.
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

Ketika autentikasi Chutes tersedia, OpenClaw meminta `GET /v1/models` dengan
kredensial tersebut dan menggunakan model yang ditemukan, yang disimpan dalam cache
selama 5 menit per kredensial. Pada kunci yang kedaluwarsa/tidak diotorisasi (HTTP 401),
OpenClaw mencoba kembali satu kali tanpa kredensial. Jika penemuan masih tidak
mengembalikan baris, gagal, atau mengembalikan status non-2xx lainnya, OpenClaw kembali
menggunakan katalog statis bawaan (penemuan dengan kunci API dan OAuth menggunakan
jalur yang sama ini). Jika penemuan gagal saat startup, katalog statis digunakan secara
otomatis.

## Alias default

OpenClaw mendaftarkan dua alias praktis untuk katalog Chutes:

| Alias           | Model target                           |
| --------------- | -------------------------------------- |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/moonshotai/Kimi-K2.5-TEE`      |

## Katalog awal bawaan

Katalog fallback bawaan berisi lima model yang saat ini disediakan berikut:

| Referensi model                              |
| -------------------------------------- |
| `chutes/zai-org/GLM-5-TEE`             |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE`      |
| `chutes/MiniMaxAI/MiniMax-M2.5-TEE`    |
| `chutes/Qwen/Qwen3.5-397B-A17B-TEE`    |

Jalankan `openclaw models list --all --provider chutes` untuk daftar lengkap.

## Contoh konfigurasi

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-5-TEE" },
      models: {
        "chutes/zai-org/GLM-5-TEE": { alias: "Chutes GLM 5" },
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
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID klien OAuth (diminta jika tidak ditetapkan) |
    | `CHUTES_CLIENT_SECRET` | Rahasia klien OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI pengalihan (default `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Cakupan yang dipisahkan spasi (default `openid profile chutes:invoke`) |

    Lihat [dokumentasi OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    untuk persyaratan aplikasi pengalihan dan bantuan.

  </Accordion>

  <Accordion title="Catatan">
    - Model Chutes didaftarkan sebagai `chutes/<model-id>`.
    - Chutes tidak melaporkan penggunaan token saat streaming (`supportsUsageInStreaming: false`); total penggunaan tetap ditampilkan setelah streaming selesai.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Aturan penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dasbor Chutes dan dokumentasi API.
  </Card>
  <Card title="Kunci API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Buat dan kelola kunci API Chutes.
  </Card>
</CardGroup>
