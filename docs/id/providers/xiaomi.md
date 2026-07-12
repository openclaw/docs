---
read_when:
    - Anda ingin model Xiaomi MiMo di OpenClaw
    - Anda memerlukan autentikasi Xiaomi MiMo atau penyiapan Token Plan
summary: Gunakan model bayar sesuai pemakaian dan Paket Token Xiaomi MiMo dengan OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T14:38:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo adalah platform API untuk model **MiMo**. Plugin `xiaomi`
bawaan (`enabledByDefault: true`, tanpa langkah instalasi) mendaftarkan dua
penyedia teks serta satu penyedia suara (TTS):

- `xiaomi` - kunci bayar sesuai pemakaian (`sk-...`)
- `xiaomi-token-plan` - kunci Token Plan (`tp-...`) dengan prasetel endpoint regional

| Properti               | Nilai                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID penyedia            | `xiaomi` (bayar sesuai pemakaian), `xiaomi-token-plan` (Token Plan)                                                                                |
| Variabel lingkungan autentikasi | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                            |
| Flag orientasi awal    | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flag CLI langsung      | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                    | Penyelesaian percakapan yang kompatibel dengan OpenAI (`openai-completions`)                                                                       |
| Kontrak suara          | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL dasar              | Bayar sesuai pemakaian: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                  |
| Model bawaan           | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS bawaan             | `mimo-v2.5-tts`, suara `mimo_default`; model desain suara `mimo-v2.5-tts-voicedesign`                                                              |

## Memulai

<Steps>
  <Step title="Get the right key">
    Buat kunci bayar sesuai pemakaian di [konsol Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), atau buka halaman langganan Token Plan Anda dan salin URL dasar regional yang kompatibel dengan OpenAI beserta kunci `tp-...` yang sesuai.
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

    Atau teruskan kunci secara langsung:

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

<Tip>
Orientasi awal memvalidasi format kunci dan memperingatkan ketika kunci `tp-...` dimasukkan ke jalur bayar sesuai pemakaian, atau kunci `sk-...` dimasukkan ke jalur Token Plan.
</Tip>

## Katalog bayar sesuai pemakaian

| Referensi model        | Masukan     | Konteks   | Keluaran maks. | Penalaran | Catatan       |
| ---------------------- | ----------- | --------- | -------------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | teks        | 262,144   | 8,192          | Tidak     | Model bawaan  |
| `xiaomi/mimo-v2-pro`   | teks        | 1,048,576 | 32,000         | Ya        | Konteks besar |
| `xiaomi/mimo-v2-omni`  | teks, gambar | 262,144  | 32,000         | Ya        | Multimodal    |

## Katalog Token Plan

Pilih opsi autentikasi Token Plan yang sesuai dengan URL dasar regional yang ditampilkan di UI langganan Xiaomi:

| Opsi autentikasi        | URL dasar                                  |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Referensi model                   | Masukan      | Konteks   | Keluaran maks. | Penalaran | Catatan      |
| --------------------------------- | ------------ | --------- | -------------- | --------- | ------------ |
| `xiaomi-token-plan/mimo-v2.5-pro` | teks         | 1,048,576 | 131,072        | Ya        | Model bawaan |
| `xiaomi-token-plan/mimo-v2.5`     | teks, gambar | 1,048,576 | 131,072        | Ya        | Multimodal   |

`xiaomi-token-plan` memerlukan URL dasar regional agar dapat diresolusikan. Jalur
yang didukung adalah opsi orientasi awal Token Plan bawaan atau blok konfigurasi
`models.providers.xiaomi-token-plan` eksplisit dengan `baseUrl` yang ditetapkan;
penyedia tidak ditawarkan tanpa salah satunya.

## Model penalaran

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5`, dan `mimo-v2.5-pro` mendukung
[direktif `/think`](/id/tools/thinking) OpenClaw dengan tingkat `off`,
`minimal`, `low`, `medium`, `high`, `xhigh`, dan `max` (bawaan `high`).
`mimo-v2-flash` tidak mendukung penalaran.

## Teks ke suara

Plugin `xiaomi` bawaan juga mendaftarkan Xiaomi MiMo sebagai penyedia suara
untuk `messages.tts`. Plugin ini memanggil kontrak TTS penyelesaian percakapan
Xiaomi dengan teks sebagai pesan `assistant` dan panduan gaya opsional sebagai
pesan `user`.

| Properti | Nilai                                    |
| -------- | ---------------------------------------- |
| ID TTS   | `xiaomi` (alias `mimo`)                  |
| Autentikasi | `XIAOMI_API_KEY`                      |
| API      | `POST /v1/chat/completions` dengan `audio` |
| Bawaan   | `mimo-v2.5-tts`, suara `mimo_default`    |
| Keluaran | MP3 secara bawaan; WAV jika dikonfigurasi |

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
`Milo`, `Dean`. Model suara prasetel (`mimo-v2.5-tts`, `mimo-v2-tts`) menggunakan
`audio.voice`, sehingga OpenClaw mengirimkan `speakerVoice` untuk model tersebut.

Model desain suara `mimo-v2.5-tts-voicedesign` menghasilkan suara dari perintah
gaya dalam bahasa alami, bukan dari ID suara prasetel. Tetapkan `style` ke
deskripsi suara yang diinginkan; OpenClaw mengirimkannya sebagai pesan `user`,
mengirimkan teks yang akan diucapkan sebagai pesan `assistant`, dan menghilangkan
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

Untuk saluran yang meminta target sintesis catatan suara (Discord, Feishu,
Matrix, Telegram, dan WhatsApp), OpenClaw mentranskode keluaran Xiaomi menjadi
Opus mono 48 kHz dengan `ffmpeg` sebelum dikirimkan.

## Contoh konfigurasi

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

Harga dan flag kompatibilitas berasal dari manifes plugin bawaan, sehingga contoh konfigurasi menghilangkan `cost` dan `compat` agar tidak menyimpang dari perilaku runtime.

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

Harga berasal dari manifes bawaan (model Token Plan mencakup harga pembacaan cache bertingkat), sehingga contoh konfigurasi menghilangkan `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    Penyedia `xiaomi` diaktifkan secara otomatis ketika `XIAOMI_API_KEY` ditetapkan di lingkungan Anda atau terdapat profil autentikasi. `xiaomi-token-plan` memerlukan URL dasar regional, sehingga jalur yang didukung adalah opsi orientasi awal Token Plan bawaan atau blok konfigurasi `models.providers.xiaomi-token-plan` eksplisit.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - ringan dan cepat, ideal untuk tugas teks serbaguna. Tidak mendukung penalaran.
    - **mimo-v2-pro** - mendukung penalaran dengan jendela konteks 1 juta token untuk beban kerja dokumen panjang.
    - **mimo-v2-omni** - model multimodal berkemampuan penalaran yang menerima masukan teks dan gambar.
    - **mimo-v2.5-pro** - model bawaan Token Plan dengan tumpukan penalaran V2.5 Xiaomi saat ini.
    - **mimo-v2.5** - rute V2.5 multimodal Token Plan.

    <Note>
    Model bayar sesuai pemakaian menggunakan prefiks `xiaomi/`. Model Token Plan menggunakan prefiks `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Jika model tidak muncul, pastikan variabel lingkungan kunci atau profil autentikasi yang relevan tersedia dan valid.
    - Untuk Token Plan, pastikan wilayah orientasi awal yang dipilih sesuai dengan URL dasar halaman langganan dan kunci diawali dengan `tp-`.
    - Ketika Gateway berjalan sebagai daemon, pastikan kunci tersedia bagi proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Kunci yang hanya ditetapkan di shell interaktif Anda tidak terlihat oleh proses Gateway yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env` atau `env.shellEnv` agar tersedia secara persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Thinking levels" href="/id/tools/thinking" icon="brain">
    Sintaks direktif `/think` dan pemetaan tingkat.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dasbor Xiaomi MiMo dan pengelolaan kunci API.
  </Card>
</CardGroup>
