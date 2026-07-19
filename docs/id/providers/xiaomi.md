---
read_when:
    - Anda ingin model Xiaomi MiMo di OpenClaw
    - Anda memerlukan autentikasi Xiaomi MiMo atau penyiapan Token Plan
summary: Gunakan model bayar sesuai pemakaian dan Token Plan Xiaomi MiMo dengan OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-19T05:09:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 072e3772f5b6d49837a0909e982cb5a03bd532c4804b4eb2e94dc501e6aab58c
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo adalah platform API untuk model **MiMo**. Plugin bawaan `xiaomi`
(`enabledByDefault: true`, tanpa langkah instalasi) mendaftarkan dua penyedia teks
serta satu penyedia ucapan (TTS):

- `xiaomi` - kunci bayar sesuai pemakaian (`sk-...`)
- `xiaomi-token-plan` - kunci Paket Token (`tp-...`) dengan prasetel endpoint regional

| Properti         | Nilai                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID penyedia      | `xiaomi` (bayar sesuai pemakaian), `xiaomi-token-plan` (Paket Token)                                                                                         |
| Variabel env autentikasi | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Flag orientasi awal | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flag CLI langsung | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | penyelesaian percakapan yang kompatibel dengan OpenAI (`openai-completions`)                                                                                          |
| Kontrak ucapan   | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL dasar        | Bayar sesuai pemakaian: `https://api.xiaomimimo.com/v1`; Paket Token: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| Model default    | `xiaomi/mimo-v2.5`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                              |
| Default TTS      | `mimo-v2.5-tts`, suara `mimo_default`; model desain suara `mimo-v2.5-tts-voicedesign`                                                               |

## Memulai

<Steps>
  <Step title="Dapatkan kunci yang tepat">
    Buat kunci bayar sesuai pemakaian di [konsol Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), atau buka halaman langganan Paket Token Anda dan salin URL dasar regional yang kompatibel dengan OpenAI beserta kunci `tp-...` yang sesuai.
  </Step>

  <Step title="Jalankan orientasi awal">
    Bayar sesuai pemakaian:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Paket Token:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Atau berikan kunci secara langsung:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Pastikan model tersedia">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Orientasi awal memvalidasi format kunci dan memberikan peringatan saat kunci `tp-...` dimasukkan ke jalur bayar sesuai pemakaian, atau kunci `sk-...` dimasukkan ke jalur Paket Token.
</Tip>

## Katalog bayar sesuai pemakaian

| Referensi model        | Input       | Konteks   | Output maksimum | Penalaran | Catatan       |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2.5`     | teks, gambar | 1,048,576 | 131,072    | Ya        | Model default |
| `xiaomi/mimo-v2.5-pro` | teks        | 1,048,576 | 131,072    | Ya        | Unggulan      |

## Katalog Paket Token

Pilih opsi autentikasi Paket Token yang sesuai dengan URL dasar regional yang ditampilkan di UI langganan Xiaomi:

| Opsi autentikasi        | URL dasar                                  |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Referensi model                   | Input       | Konteks   | Output maksimum | Penalaran | Catatan       |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | teks        | 1,048,576 | 131,072    | Ya        | Model default |
| `xiaomi-token-plan/mimo-v2.5`     | teks, gambar | 1,048,576 | 131,072    | Ya        | Multimodal    |

`xiaomi-token-plan` memerlukan URL dasar regional agar dapat diresolusikan. Jalur yang didukung
adalah opsi orientasi awal Paket Token bawaan atau blok konfigurasi
`models.providers.xiaomi-token-plan` eksplisit dengan `baseUrl` yang ditetapkan;
penyedia tidak ditawarkan tanpa salah satunya.

## Model penalaran

`mimo-v2.5` dan `mimo-v2.5-pro` mendukung
[direktif `/think`](/id/tools/thinking) OpenClaw dengan tingkat `off`,
`minimal`, `low`, `medium`, `high`, `xhigh`, dan `max` (default `high`).

## Teks ke ucapan

Plugin bawaan `xiaomi` juga mendaftarkan Xiaomi MiMo sebagai penyedia ucapan
untuk `messages.tts`. Plugin ini memanggil kontrak TTS penyelesaian percakapan Xiaomi dengan
teks sebagai pesan `assistant` dan panduan gaya opsional sebagai pesan `user`.

| Properti | Nilai                                    |
| -------- | ---------------------------------------- |
| ID TTS   | `xiaomi` (alias `mimo`)                  |
| Autentikasi | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` dengan `audio` |
| Default  | `mimo-v2.5-tts`, suara `mimo_default`    |
| Output   | MP3 secara default; WAV saat dikonfigurasi      |

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

Suara bawaan: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Model suara prasetel `mimo-v2.5-tts` menggunakan `audio.voice`, sehingga
OpenClaw mengirim `speakerVoice` untuk model tersebut.

Model desain suara `mimo-v2.5-tts-voicedesign` menghasilkan suara dari
prompt gaya bahasa alami, bukan dari ID suara prasetel. Tetapkan `style` ke
deskripsi suara yang diinginkan; OpenClaw mengirimkannya sebagai pesan `user`, mengirim
teks yang akan diucapkan sebagai pesan `assistant`, dan menghilangkan `audio.voice` untuk
model ini.

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

Untuk saluran yang meminta target sintesis catatan suara (Discord, Feishu,
Matrix, Telegram, dan WhatsApp), OpenClaw mentranskode output Xiaomi menjadi Opus mono
48kHz dengan `ffmpeg` sebelum dikirim.

## Contoh konfigurasi

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Harga dan flag kompatibilitas berasal dari manifes plugin bawaan, sehingga contoh konfigurasi menghilangkan `cost` dan `compat` agar tidak menyimpang dari perilaku runtime.

Paket Token:

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

Harga berasal dari manifes bawaan (model Paket Token menyertakan harga pembacaan cache bertingkat), sehingga contoh konfigurasi menghilangkan `cost`.

<AccordionGroup>
  <Accordion title="Perilaku injeksi otomatis">
    Penyedia `xiaomi` diaktifkan secara otomatis saat `XIAOMI_API_KEY` ditetapkan di lingkungan Anda atau tersedia profil autentikasi. `xiaomi-token-plan` memerlukan URL dasar regional, sehingga jalur yang didukung adalah opsi orientasi awal Paket Token bawaan atau blok konfigurasi `models.providers.xiaomi-token-plan` eksplisit.
  </Accordion>

  <Accordion title="Detail model">
    - **mimo-v2.5** - default bayar sesuai pemakaian dan rute multimodal V2.5 Paket Token.
    - **mimo-v2.5-pro** - model penalaran unggulan dan default Paket Token.

    <Note>
    Model bayar sesuai pemakaian menggunakan prefiks `xiaomi/`. Model Paket Token menggunakan prefiks `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika model tidak muncul, pastikan variabel env kunci atau profil autentikasi yang relevan tersedia dan valid.
    - Untuk Paket Token, pastikan wilayah orientasi awal yang dipilih sesuai dengan URL dasar halaman langganan dan kunci diawali dengan `tp-`.
    - Saat Gateway berjalan sebagai daemon, pastikan kunci tersedia untuk proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Kunci yang hanya ditetapkan di shell interaktif Anda tidak terlihat oleh proses Gateway yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env` atau `env.shellEnv` agar tersedia secara persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Tingkat pemikiran" href="/id/tools/thinking" icon="brain">
    Sintaks direktif `/think` dan pemetaan tingkat.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap OpenClaw.
  </Card>
  <Card title="Konsol Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dasbor Xiaomi MiMo dan pengelolaan kunci API.
  </Card>
</CardGroup>
