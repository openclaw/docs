---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui Kilo Gateway di OpenClaw
summary: Gunakan API terpadu Kilo Gateway untuk mengakses banyak model di OpenClaw
title: Gateway Kilo
x-i18n:
    generated_at: "2026-07-12T14:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway merutekan permintaan ke banyak model di balik satu endpoint yang kompatibel dengan OpenAI dan satu kunci API.

| Properti  | Nilai                              |
| --------- | ---------------------------------- |
| Penyedia  | `kilocode`                         |
| Autentikasi | `KILOCODE_API_KEY`               |
| API       | Kompatibel dengan OpenAI           |
| URL Dasar | `https://api.kilo.ai/api/gateway/` |

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

    Atau tetapkan variabel lingkungan secara langsung:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model bawaan dan katalog

Model bawaannya adalah `kilocode/kilo/auto`, yaitu model perutean cerdas yang dikelola oleh penyedia. OpenClaw tidak
menerbitkan pemetaan tugas ke model hulu untuk model ini; perutean di balik `kilo/auto` dikelola oleh Kilo Gateway.

Saat dimulai, OpenClaw mengkueri `GET https://api.kilo.ai/api/gateway/models` dan menggabungkan model yang ditemukan
di depan katalog cadangan statis. Cadangan statis hanya berisi `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Model apa pun di Gateway dapat diakses sebagai `kilocode/<upstream-id>` (misalnya
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Jalankan `/models kilocode` atau
`openclaw models list --provider kilocode` untuk melihat daftar lengkap yang ditemukan.

## Contoh konfigurasi

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

## Catatan perilaku

<AccordionGroup>
  <Accordion title="Transportasi dan kompatibilitas">
    Kilo Gateway kompatibel dengan OpenRouter, sehingga menggunakan jalur permintaan kompatibel OpenAI bergaya proksi
    alih-alih pembentukan permintaan OpenAI native (tanpa `store`, tanpa payload upaya penalaran OpenAI).

    - Referensi Kilo yang didukung Gemini tetap menggunakan jalur proksi-Gemini: OpenClaw membersihkan tanda tangan
      pemikiran Gemini di sana, tetapi tidak mengaktifkan validasi pemutaran ulang Gemini native atau penulisan ulang bootstrap.
    - Permintaan menggunakan token Bearer yang dibuat dari kunci API Anda.

  </Accordion>

  <Accordion title="Pembungkus stream dan penalaran">
    Pembungkus stream Kilo menambahkan header permintaan `X-KILOCODE-FEATURE` (bawaan `openclaw`,
    dapat ditimpa dengan variabel lingkungan `KILOCODE_FEATURE`) dan menormalisasi payload upaya penalaran untuk
    model yang mendukungnya.

    <Warning>
    Referensi `kilocode/kilo/auto` dan `x-ai/*` melewati injeksi upaya penalaran. Gunakan referensi model konkret
    seperti `kilocode/anthropic/claude-sonnet-4` jika Anda memerlukan dukungan penalaran.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika penemuan model gagal saat dimulai, OpenClaw beralih ke katalog cadangan statis yang berisi `kilocode/kilo/auto`.
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
    Referensi lengkap konfigurasi OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dasbor Kilo Gateway, kunci API, dan pengelolaan akun.
  </Card>
</CardGroup>
