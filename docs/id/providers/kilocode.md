---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui Kilo Gateway di OpenClaw
summary: Gunakan API terpadu Kilo Gateway untuk mengakses banyak model di OpenClaw
title: Gateway Kilo
x-i18n:
    generated_at: "2026-07-19T05:17:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0246a1a77f4265168b213e0167360e1cd89dc2ca864997f08cae5331037f9e89
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway merutekan permintaan ke banyak model di balik satu endpoint yang kompatibel dengan OpenAI dan satu kunci API.

| Properti | Nilai                              |
| -------- | ---------------------------------- |
| Penyedia | `kilocode`                         |
| Autentikasi | `KILOCODE_API_KEY`                 |
| API      | Kompatibel dengan OpenAI                  |
| URL dasar | `https://api.kilo.ai/api/gateway/` |

## Instal Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Penyiapan

<Steps>
  <Step title="Buat akun">
    Buka [app.kilo.ai](https://app.kilo.ai), masuk atau buat akun, lalu buat kunci API.
  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Atau atur variabel lingkungan secara langsung:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Pastikan model tersedia">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model default dan katalog

Model default adalah `kilocode/kilo-auto/balanced`, tingkat perutean cerdas seimbang milik Kilo Gateway.
OpenClaw tidak memublikasikan pemetaan tugas ke model upstream untuk model tersebut; perutean di balik
`kilo-auto/balanced` dikelola oleh Kilo Gateway.

Saat dimulai, OpenClaw mengueri `GET https://api.kilo.ai/api/gateway/models` dan menggabungkan model yang ditemukan
sebelum katalog fallback statis. Fallback statis hanya berisi
`kilocode/kilo-auto/balanced` (`Auto Balanced`, `input: ["text", "image"]`, `reasoning: true`,
`contextWindow: 1000000`, `maxTokens: 65536`).

Model apa pun pada gateway dapat diakses sebagai `kilocode/<upstream-id>` (misalnya
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Jalankan `/models kilocode` atau
`openclaw models list --provider kilocode` untuk melihat daftar lengkap yang ditemukan.

## Contoh konfigurasi

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo-auto/balanced" },
    },
  },
}
```

## Catatan perilaku

<AccordionGroup>
  <Accordion title="Transport dan kompatibilitas">
    Kilo Gateway kompatibel dengan OpenRouter, sehingga menggunakan jalur permintaan kompatibel OpenAI bergaya proksi
    alih-alih pembentukan permintaan OpenAI native (tanpa `store`, tanpa payload tingkat upaya penalaran OpenAI).

    - Referensi Kilo berbasis Gemini tetap berada di jalur proksi Gemini: OpenClaw membersihkan tanda tangan pemikiran
      Gemini di sana, tetapi tidak mengaktifkan validasi pemutaran ulang Gemini native atau penulisan ulang bootstrap.
    - Permintaan menggunakan token Bearer yang dibuat dari kunci API Anda.

  </Accordion>

  <Accordion title="Pembungkus streaming dan penalaran">
    Pembungkus streaming Kilo menambahkan header permintaan `X-KILOCODE-FEATURE` (default `openclaw`,
    timpa dengan variabel lingkungan `KILOCODE_FEATURE`) dan menormalkan payload tingkat upaya penalaran untuk
    model yang mendukungnya.

    <Warning>
    Referensi `kilocode/kilo-auto/balanced` dan `x-ai/*` melewati injeksi tingkat upaya penalaran. Gunakan referensi
    model konkret seperti `kilocode/anthropic/claude-sonnet-4` jika Anda memerlukan dukungan penalaran.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika penemuan model gagal saat dimulai, OpenClaw beralih ke katalog statis yang berisi `kilocode/kilo-auto/balanced`.
    - Pastikan kunci API Anda valid dan akun Kilo Anda telah mengaktifkan model yang diinginkan.
    - Saat Gateway berjalan sebagai daemon, pastikan `KILOCODE_API_KEY` tersedia bagi proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dasbor Kilo Gateway, kunci API, dan pengelolaan akun.
  </Card>
</CardGroup>
