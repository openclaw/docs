---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui Kilo Gateway di OpenClaw
summary: Gunakan API terpadu Kilo Gateway untuk mengakses banyak model di OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T09:23:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. API ini kompatibel dengan OpenAI, jadi sebagian besar SDK OpenAI bekerja dengan mengganti base URL.

| Property | Value                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | Kompatibel dengan OpenAI           |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## Memulai

<Steps>
  <Step title="Buat akun">
    Buka [app.kilo.ai](https://app.kilo.ai), masuk atau buat akun, lalu navigasikan ke API Keys dan buat kunci baru.
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Atau setel variabel environment secara langsung:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model default

Model default adalah `kilocode/kilo/auto`, model smart-routing milik provider
yang dikelola oleh Kilo Gateway.

<Note>
OpenClaw memperlakukan `kilocode/kilo/auto` sebagai ref default stabil, tetapi tidak
memublikasikan pemetaan tugas-ke-model-upstream yang didukung sumber untuk rute itu. Perutean
upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway, bukan
di-hard-code di OpenClaw.
</Note>

## Katalog bawaan

OpenClaw secara dinamis menemukan model yang tersedia dari Kilo Gateway saat startup. Gunakan
`/models kilocode` untuk melihat daftar lengkap model yang tersedia dengan akun Anda.

Model apa pun yang tersedia di gateway dapat digunakan dengan prefix `kilocode/`:

| Model ref                              | Notes                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Default — smart routing            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI via Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google via Kilo                    |
| ...and many more                       | Gunakan `/models kilocode` untuk mencantumkan semuanya |

<Tip>
Saat startup, OpenClaw mengkueri `GET https://api.kilo.ai/api/gateway/models` dan menggabungkan
model yang ditemukan sebelum katalog fallback statis. Fallback bawaan selalu
menyertakan `kilocode/kilo/auto` (`Kilo Auto`) dengan `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000`, dan `maxTokens: 128000`.
</Tip>

## Contoh config

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport dan kompatibilitas">
    Kilo Gateway didokumentasikan di source sebagai kompatibel dengan OpenRouter, sehingga tetap berada pada jalur bergaya proxy yang kompatibel dengan OpenAI alih-alih pembentukan permintaan OpenAI native.

    - Ref Kilo yang didukung Gemini tetap berada pada jalur proxy-Gemini, sehingga OpenClaw
      mempertahankan sanitasi thought-signature Gemini di sana tanpa mengaktifkan replay validation Gemini native atau bootstrap rewrite.
    - Kilo Gateway menggunakan token Bearer dengan kunci API Anda di balik layar.

  </Accordion>

  <Accordion title="Stream wrapper dan reasoning">
    Stream wrapper bersama Kilo menambahkan header aplikasi provider dan menormalkan
    payload reasoning proxy untuk ref model konkret yang didukung.

    <Warning>
    `kilocode/kilo/auto` dan petunjuk lain yang tidak mendukung proxy-reasoning melewati injeksi reasoning.
    Jika Anda membutuhkan dukungan reasoning, gunakan ref model konkret seperti
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika penemuan model gagal saat startup, OpenClaw fallback ke katalog statis bawaan yang berisi `kilocode/kilo/auto`.
    - Pastikan kunci API Anda valid dan akun Kilo Anda mengaktifkan model yang diinginkan.
    - Saat Gateway berjalan sebagai daemon, pastikan `KILOCODE_API_KEY` tersedia untuk proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dasbor Kilo Gateway, kunci API, dan manajemen akun.
  </Card>
</CardGroup>
