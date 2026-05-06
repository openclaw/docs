---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui Kilo Gateway di OpenClaw
summary: Gunakan API terpadu Kilo Gateway untuk mengakses banyak model di OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:58:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. Ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

| Properti | Nilai                              |
| -------- | ---------------------------------- |
| Penyedia | `kilocode`                         |
| Autentikasi | `KILOCODE_API_KEY`                 |
| API      | Kompatibel dengan OpenAI           |
| URL Dasar | `https://api.kilo.ai/api/gateway/` |

## Memulai

<Steps>
  <Step title="Buat akun">
    Buka [app.kilo.ai](https://app.kilo.ai), masuk atau buat akun, lalu buka Kunci API dan buat kunci baru.
  </Step>
  <Step title="Jalankan onboarding">
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

## Model default

Model default adalah `kilocode/kilo/auto`, model perutean cerdas
milik penyedia yang dikelola oleh Kilo Gateway.

<Note>
OpenClaw memperlakukan `kilocode/kilo/auto` sebagai ref default yang stabil, tetapi tidak
menerbitkan pemetaan tugas-ke-model-upstream yang didukung sumber untuk rute tersebut. Perutean
upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway, bukan
dikodekan secara tetap di OpenClaw.
</Note>

## Katalog bawaan

OpenClaw secara dinamis menemukan model yang tersedia dari Kilo Gateway saat startup. Gunakan
`/models kilocode` untuk melihat daftar lengkap model yang tersedia dengan akun Anda.

Model apa pun yang tersedia di gateway dapat digunakan dengan prefiks `kilocode/`:

| Ref model                              | Catatan                            |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Default — perutean cerdas          |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic melalui Kilo             |
| `kilocode/openai/gpt-5.5`              | OpenAI melalui Kilo                |
| `kilocode/google/gemini-3-pro-preview` | Google melalui Kilo                |
| ...dan banyak lagi                     | Gunakan `/models kilocode` untuk mencantumkan semuanya |

<Tip>
Saat startup, OpenClaw mengueri `GET https://api.kilo.ai/api/gateway/models` dan menggabungkan
model yang ditemukan sebelum katalog fallback statis. Fallback bawaan selalu
menyertakan `kilocode/kilo/auto` (`Kilo Auto`) dengan `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000`, dan `maxTokens: 128000`.
</Tip>

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

<AccordionGroup>
  <Accordion title="Transpor dan kompatibilitas">
    Kilo Gateway didokumentasikan di sumber sebagai kompatibel dengan OpenRouter, sehingga tetap berada di
    jalur kompatibel OpenAI bergaya proxy, bukan pembentukan permintaan OpenAI native.

    - Ref Kilo berbasis Gemini tetap berada di jalur proxy-Gemini, sehingga OpenClaw mempertahankan
      sanitasi tanda tangan pemikiran Gemini di sana tanpa mengaktifkan validasi replay Gemini native
      atau penulisan ulang bootstrap.
    - Kilo Gateway menggunakan token Bearer dengan kunci API Anda di balik layar.

  </Accordion>

  <Accordion title="Wrapper stream dan reasoning">
    Wrapper stream bersama Kilo menambahkan header aplikasi penyedia dan menormalkan
    payload reasoning proxy untuk ref model konkret yang didukung.

    <Warning>
    `kilocode/kilo/auto` dan petunjuk lain yang tidak mendukung proxy-reasoning melewati injeksi reasoning.
    Jika Anda memerlukan dukungan reasoning, gunakan ref model konkret seperti
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika penemuan model gagal saat startup, OpenClaw kembali ke katalog statis bawaan yang berisi `kilocode/kilo/auto`.
    - Pastikan kunci API Anda valid dan akun Kilo Anda telah mengaktifkan model yang diinginkan.
    - Saat Gateway berjalan sebagai daemon, pastikan `KILOCODE_API_KEY` tersedia untuk proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dasbor Kilo Gateway, kunci API, dan pengelolaan akun.
  </Card>
</CardGroup>
