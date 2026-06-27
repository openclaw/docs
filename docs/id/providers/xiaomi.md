---
read_when:
    - Anda menginginkan model Xiaomi MiMo di OpenClaw
    - Anda memerlukan autentikasi Xiaomi MiMo atau penyiapan Token Plan
summary: Gunakan model bayar sesuai penggunaan dan Paket Token Xiaomi MiMo dengan OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:08:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo adalah platform API untuk model **MiMo**. OpenClaw menyertakan Plugin Xiaomi bawaan dengan dua preset penyedia teks:

- `xiaomi` untuk kunci bayar sesuai pemakaian (`sk-...`)
- `xiaomi-token-plan` untuk kunci Token Plan (`tp-...`) dengan preset endpoint regional

Plugin yang sama juga mendaftarkan penyedia ucapan (TTS) `xiaomi`.

| Properti         | Nilai                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID penyedia      | `xiaomi` (bayar sesuai pemakaian), `xiaomi-token-plan` (Token Plan)                                                                                |
| Plugin           | dibundel, `enabledByDefault: true`                                                                                                                 |
| Variabel env auth | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Flag onboarding  | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flag CLI langsung | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Kontrak          | penyelesaian chat + `speechProviders`                                                                                                              |
| API              | kompatibel dengan OpenAI (`openai-completions`)                                                                                                    |
| URL dasar        | Bayar sesuai pemakaian: `https://api.xiaomimimo.com/v1`; preset Token Plan: `token-plan-{cn,sgp,ams}...`                                           |
| Model default    | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| Default TTS      | `mimo-v2.5-tts`, suara `mimo_default`; model voicedesign `mimo-v2.5-tts-voicedesign`                                                               |

## Memulai

<Steps>
  <Step title="Get the right key">
    Buat kunci bayar sesuai pemakaian di [konsol Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), atau buka halaman langganan Token Plan Anda dan salin URL dasar regional yang kompatibel dengan OpenAI beserta kunci `tp-...` yang cocok.
  </Step>

  <Step title="Run onboarding">
    Bayar sesuai pemakaian:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Atau berikan kunci secara langsung:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Katalog bayar sesuai pemakaian

| Ref model              | Input       | Konteks   | Output maks | Penalaran | Catatan       |
| ---------------------- | ----------- | --------- | ----------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | teks        | 262,144   | 8,192       | Tidak     | Model default |
| `xiaomi/mimo-v2-pro`   | teks        | 1,048,576 | 32,000      | Ya        | Konteks besar |
| `xiaomi/mimo-v2-omni`  | teks, gambar | 262,144  | 32,000      | Ya        | Multimodal    |

<Tip>
Ref model default adalah `xiaomi/mimo-v2-flash`. Penyedia disuntikkan secara otomatis saat `XIAOMI_API_KEY` disetel atau profil auth tersedia.
</Tip>

## Katalog Token Plan

Pilih pilihan auth Token Plan yang cocok dengan URL dasar regional yang ditampilkan di UI langganan Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Ref model                         | Input       | Konteks   | Output maks | Penalaran | Catatan       |
| --------------------------------- | ----------- | --------- | ----------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | teks        | 1,048,576 | 131,072     | Ya        | Model default |
| `xiaomi-token-plan/mimo-v2.5`     | teks, gambar | 1,048,576 | 131,072    | Ya        | Multimodal    |

<Tip>
Onboarding Token Plan memvalidasi bentuk kunci dan memberi peringatan saat kunci `tp-...` dimasukkan ke jalur bayar sesuai pemakaian, atau kunci `sk-...` dimasukkan ke jalur Token Plan.
</Tip>

## Teks-ke-ucapan

Plugin `xiaomi` bawaan juga mendaftarkan Xiaomi MiMo sebagai penyedia ucapan untuk
`messages.tts`. Plugin ini memanggil kontrak TTS penyelesaian chat Xiaomi dengan teks sebagai
pesan `assistant` dan panduan gaya opsional sebagai pesan `user`.

| Properti | Nilai                                    |
| -------- | ---------------------------------------- |
| ID TTS   | `xiaomi` (alias `mimo`)                  |
| Auth     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` dengan `audio` |
| Default  | `mimo-v2.5-tts`, suara `mimo_default`    |
| Output   | MP3 secara default; WAV saat dikonfigurasi |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Suara bawaan yang didukung mencakup `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo`, dan `Dean`. Model suara preset menggunakan `audio.voice`, jadi
OpenClaw mengirim `speakerVoice` untuk `mimo-v2.5-tts` dan `mimo-v2-tts`.

Model voicedesign Xiaomi, `mimo-v2.5-tts-voicedesign`, menghasilkan suara
dari prompt gaya bahasa alami, bukan dari ID suara preset. Konfigurasikan
`style` dengan deskripsi suara yang diinginkan; OpenClaw mengirimkannya sebagai pesan `user`,
mengirim teks yang diucapkan sebagai pesan `assistant`, dan menghilangkan
`audio.voice` untuk model ini.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Untuk target catatan suara seperti Feishu dan Telegram, OpenClaw mentranskode output Xiaomi
ke Opus 48kHz dengan `ffmpeg` sebelum pengiriman.

## Contoh config

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Harga dan flag kompatibilitas berasal dari manifes Plugin bawaan, sehingga contoh config menghilangkan `cost` dan `compat` agar tidak menyimpang dari perilaku runtime.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Harga berasal dari manifes bawaan (model Token Plan mencakup harga baca cache bertingkat), sehingga contoh config menghilangkan `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    Penyedia `xiaomi` disuntikkan secara otomatis saat `XIAOMI_API_KEY` disetel di lingkungan Anda atau profil auth tersedia. `xiaomi-token-plan` membutuhkan URL dasar regional, jadi jalur yang didukung adalah pilihan onboarding Token Plan bawaan atau blok config `models.providers.xiaomi-token-plan` eksplisit.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — ringan dan cepat, ideal untuk tugas teks tujuan umum. Tidak mendukung penalaran.
    - **mimo-v2-pro** — mendukung penalaran dengan jendela konteks 1 juta token untuk beban kerja dokumen panjang.
    - **mimo-v2-omni** — model multimodal dengan penalaran yang menerima input teks dan gambar.
    - **mimo-v2.5-pro** — default Token Plan dengan stack penalaran V2.5 Xiaomi saat ini.
    - **mimo-v2.5** — rute V2.5 multimodal Token Plan.

    <Note>
    Model bayar sesuai pemakaian menggunakan prefiks `xiaomi/`. Model Token Plan menggunakan prefiks `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Jika model tidak muncul, pastikan variabel env kunci yang relevan atau profil auth tersedia dan valid.
    - Untuk Token Plan, pastikan wilayah onboarding yang dipilih cocok dengan URL dasar halaman langganan dan kunci dimulai dengan `tp-`.
    - Saat Gateway berjalan sebagai daemon, pastikan kunci tersedia untuk proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Kunci yang hanya disetel di shell interaktif Anda tidak terlihat oleh proses gateway yang dikelola daemon. Gunakan config `~/.openclaw/.env` atau `env.shellEnv` untuk ketersediaan persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dasbor Xiaomi MiMo dan pengelolaan kunci API.
  </Card>
</CardGroup>
