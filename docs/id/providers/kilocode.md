---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui Kilo Gateway di OpenClaw
summary: Gunakan API terpadu Kilo Gateway untuk mengakses banyak model di OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:05:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu endpoint dan kunci API. API ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

| Properti | Nilai                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | Kompatibel dengan OpenAI           |
| URL Dasar | `https://api.kilo.ai/api/gateway/` |

## Instal plugin

Instal plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Buat akun">
    Buka [app.kilo.ai](https://app.kilo.ai), masuk atau buat akun, lalu buka API Keys dan buat kunci baru.
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Atau atur variabel lingkungan secara langsung:

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

Model default adalah `kilocode/kilo/auto`, model perutean cerdas milik provider yang dikelola oleh Kilo Gateway.

<Note>
OpenClaw memperlakukan `kilocode/kilo/auto` sebagai ref default yang stabil, tetapi tidak menerbitkan pemetaan tugas-ke-model-upstream berbasis sumber untuk rute tersebut. Perutean upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway, bukan di-hard-code di OpenClaw.
</Note>

## Katalog bawaan

OpenClaw secara dinamis menemukan model yang tersedia dari Kilo Gateway saat startup. Gunakan `/models kilocode` untuk melihat daftar lengkap model yang tersedia dengan akun Anda.

Model apa pun yang tersedia di gateway dapat digunakan dengan prefiks `kilocode/`:

| Ref model                                | Catatan                            |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Default — perutean cerdas          |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic melalui Kilo             |
| `kilocode/openai/gpt-5.5`                | OpenAI melalui Kilo                |
| `kilocode/google/gemini-3.1-pro-preview` | Google melalui Kilo                |
| ...dan masih banyak lagi                 | Gunakan `/models kilocode` untuk mencantumkan semuanya |

<Tip>
Saat startup, OpenClaw mengueri `GET https://api.kilo.ai/api/gateway/models` dan menggabungkan model yang ditemukan sebelum katalog fallback statis. Fallback statis selalu menyertakan `kilocode/kilo/auto` (`Kilo Auto`) dengan `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, dan `maxTokens: 128000`.
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
  <Accordion title="Transport dan kompatibilitas">
    Kilo Gateway didokumentasikan dalam sumber sebagai kompatibel dengan OpenRouter, sehingga tetap berada di jalur kompatibel OpenAI bergaya proxy, bukan pembentukan permintaan OpenAI native.

    - Ref Kilo berbasis Gemini tetap berada di jalur proxy-Gemini, sehingga OpenClaw mempertahankan sanitasi tanda tangan pemikiran Gemini di sana tanpa mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap.
    - Kilo Gateway menggunakan token Bearer dengan kunci API Anda di balik layar.

  </Accordion>

  <Accordion title="Pembungkus stream dan penalaran">
    Pembungkus stream bersama milik Kilo menambahkan header aplikasi provider dan menormalisasi payload penalaran proxy untuk ref model konkret yang didukung.

    <Warning>
    `kilocode/kilo/auto` dan petunjuk lain yang tidak didukung penalaran proxy melewati injeksi penalaran. Jika Anda memerlukan dukungan penalaran, gunakan ref model konkret seperti `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika penemuan model gagal saat startup, OpenClaw kembali ke katalog statis yang berisi `kilocode/kilo/auto`.
    - Pastikan kunci API Anda valid dan akun Kilo Anda telah mengaktifkan model yang diinginkan.
    - Saat Gateway berjalan sebagai daemon, pastikan `KILOCODE_API_KEY` tersedia untuk proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi lengkap konfigurasi OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dasbor Kilo Gateway, kunci API, dan pengelolaan akun.
  </Card>
</CardGroup>
