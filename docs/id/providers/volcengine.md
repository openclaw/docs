---
read_when:
    - Anda ingin menggunakan model Volcano Engine atau Doubao dengan OpenClaw
    - Anda perlu menyiapkan kunci API Volcengine
    - Anda ingin menggunakan text-to-speech Volcengine Speech
summary: Penyiapan Volcano Engine (model Doubao, endpoint pengodean, dan TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-19T05:34:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ac0e86b5b94b0c0f08e76878d16e9c5562e0d3f9923697713bef20ebba5bab2
    source_path: providers/volcengine.md
    workflow: 16
---

Penyedia Volcengine memberikan akses ke model Doubao dan model pihak ketiga yang dihosting di Volcano Engine, dengan endpoint terpisah untuk beban kerja umum dan pengodean. Plugin bawaan yang sama juga mendaftarkan Volcengine Speech sebagai penyedia TTS.

| Detail           | Nilai                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Penyedia         | `volcengine` (umum + TTS), `volcengine-plan` (pengodean)   |
| Autentikasi model | `VOLCANO_ENGINE_API_KEY`                                                 |
| Autentikasi TTS  | `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY`                         |
| API              | Model kompatibel OpenAI, TTS BytePlus Seed Speech                  |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    Jalankan orientasi interaktif:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Ini mendaftarkan penyedia umum (`volcengine`) dan pengodean (`volcengine-plan`) dari satu kunci API.

  </Step>
  <Step title="Tetapkan model default">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Pastikan model tersedia">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Untuk penyiapan noninteraktif (CI, pembuatan skrip), berikan kunci secara langsung:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Penyedia dan endpoint

| Penyedia          | Endpoint                                  | Kasus penggunaan |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Model umum       |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Model pengodean  |

<Note>
Kedua penyedia dikonfigurasi dari satu kunci API. Penyiapan mendaftarkan keduanya secara otomatis, dan pemilih model penyedia pengodean juga menggunakan kembali autentikasi penyedia umum (`volcengine-plan` adalah alias autentikasi dari `volcengine`).
</Note>

## Katalog bawaan

<Tabs>
  <Tab title="Umum (volcengine)">
    | Referensi model                              | Nama                            | Input       | Konteks |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | teks, gambar | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | teks, gambar | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | teks, gambar | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | teks, gambar | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | teks, gambar | 256,000 |
  </Tab>
  <Tab title="Pengodean (volcengine-plan)">
    | Referensi model                                   | Nama                     | Input | Konteks |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | teks  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | teks  | 256,000 |
  </Tab>
</Tabs>

Kedua katalog bersifat statis (tanpa panggilan penemuan `/models`) dan mendukung penghitungan penggunaan streaming yang kompatibel dengan OpenAI. Skema alat untuk kedua penyedia secara otomatis menghapus kata kunci `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains`, dan `maxContains`, karena API pemanggilan alat Volcengine menolaknya.

## Teks ke ucapan

TTS Volcengine menggunakan API HTTP BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) dan dikonfigurasi secara terpisah dari kunci API model Doubao yang kompatibel dengan OpenAI. Di konsol BytePlus, buka Seed Speech > Settings > API Keys, salin kunci API, lalu tetapkan:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Kemudian aktifkan di `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Bidang yang tersedia di bawah `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey`, dan `baseUrl`. `!emotion=<value>` juga berfungsi sebagai direktif suara sebaris ketika penggantian pengaturan suara diizinkan.

Untuk target catatan suara, OpenClaw meminta `ogg_opus` native penyedia. Untuk lampiran audio biasa, OpenClaw meminta `mp3`. Alias penyedia `bytedance` dan `doubao` juga mengarah ke penyedia ucapan ini.

ID sumber daya default adalah `seed-tts-1.0`, yaitu hak akses yang diberikan BytePlus secara default kepada kunci API Seed Speech yang baru dibuat. Jika proyek Anda memiliki hak akses TTS 2.0, tetapkan `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` ditujukan untuk endpoint model ModelArk/Doubao dan bukan kunci API Seed Speech. TTS memerlukan kunci API Seed Speech dari BytePlus Speech Console, atau pasangan AppID/token Speech Console lama.
</Warning>

Autentikasi AppID/token lama tetap didukung untuk aplikasi Speech Console yang lebih lama:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Variabel lingkungan TTS opsional lainnya: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY`, dan `VOLCENGINE_TTS_BASE_URL` menggantikan bidang konfigurasi `messages.tts.providers.volcengine` yang sesuai ketika ditetapkan.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Model default setelah orientasi">
    `openclaw onboard --auth-choice volcengine-api-key` menetapkan `volcengine-plan/ark-code-latest` sebagai model default sekaligus mendaftarkan katalog umum `volcengine`.
  </Accordion>

  <Accordion title="Perilaku fallback pemilih model">
    Selama pemilihan model dalam orientasi/konfigurasi, pilihan autentikasi Volcengine memprioritaskan baris `volcengine/*` dan `volcengine-plan/*`. Jika model tersebut belum dimuat, OpenClaw melakukan fallback ke katalog tanpa filter alih-alih menampilkan pemilih yang tercakup pada penyedia tetapi kosong.
  </Accordion>

  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan variabel lingkungan model dan TTS seperti `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`, dan `VOLCENGINE_TTS_TOKEN` tersedia bagi proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Saat menjalankan OpenClaw sebagai layanan latar belakang, variabel lingkungan yang ditetapkan di shell interaktif Anda tidak diwariskan secara otomatis. Lihat catatan daemon di atas.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah-langkah debugging.
  </Card>
  <Card title="FAQ" href="/id/help/faq" icon="circle-question">
    Pertanyaan umum tentang penyiapan OpenClaw.
  </Card>
</CardGroup>
