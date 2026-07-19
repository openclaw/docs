---
read_when:
    - Anda ingin menggunakan Fireworks dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Fireworks atau id model default
    - Anda sedang men-debug perilaku penonaktifan pemikiran Kimi di Fireworks
summary: Penyiapan Fireworks (autentikasi + pemilihan model)
title: Fireworks
x-i18n:
    generated_at: "2026-07-19T05:17:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7720b23b69aa716d2e2903f5644bb74f81ca1c5e753f71d72d4d7a25c0747884
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) menyediakan model berbobot terbuka dan model terarah melalui API yang kompatibel dengan OpenAI. Instal plugin penyedia Fireworks resmi untuk menggunakan dua model Kimi yang telah dikatalogkan dan model atau id router Fireworks apa pun saat runtime.

| Properti        | Nilai                                                   |
| --------------- | ------------------------------------------------------- |
| Id penyedia     | `fireworks` (alias: `fireworks-ai`)                    |
| Paket           | `@openclaw/fireworks-provider`                         |
| Variabel env autentikasi | `FIREWORKS_API_KEY`                                    |
| Flag onboarding | `--auth-choice fireworks-api-key`                      |
| Flag CLI langsung | `--fireworks-api-key <key>`                            |
| API             | Kompatibel dengan OpenAI (`openai-completions`)               |
| URL dasar       | `https://api.fireworks.ai/inference/v1`                |
| Model default   | `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` |
| Alias default   | `Kimi K2.6 Turbo`                                      |

## Memulai

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Tetapkan kunci API Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Hanya env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Onboarding menyimpan kunci untuk penyedia `fireworks` dalam profil autentikasi Anda dan menetapkan router Kimi K2.6 Turbo **Fire Pass** sebagai model default.

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider fireworks
    ```

    Daftar tersebut seharusnya menyertakan `Kimi K2.6` dan `Kimi K2.6 Turbo (Fire Pass)`. Jika `FIREWORKS_API_KEY` tidak dapat diresolusi, `openclaw models status --json` melaporkan kredensial yang tidak tersedia pada `auth.unusableProfiles`.

  </Step>
</Steps>

## Penyiapan noninteraktif

Untuk instalasi dengan skrip atau Pipeline CI, teruskan semuanya melalui baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Referensi model                                        | Nama                        | Input        | Konteks | Output maks. | Pemikiran            |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ------------ | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | teks + gambar | 262,144 | 262,144      | Dipaksa nonaktif     |
| `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` | Kimi K2.6 Turbo (Fire Pass) | teks + gambar | 256,000 | 256,000      | Dipaksa nonaktif (default) |

<Note>
  OpenClaw menetapkan semua model Kimi Fireworks ke `thinking: off` karena Kimi di Fireworks dapat membocorkan alur pemikiran ke dalam balasan yang terlihat kecuali permintaan secara eksplisit menonaktifkan pemikiran. Mengarahkan model yang sama secara langsung melalui [Moonshot](/id/providers/moonshot) mempertahankan output penalaran Kimi. Lihat [mode pemikiran](/id/tools/thinking) untuk beralih antarpenyedia.
</Note>

## Id model Fireworks khusus

OpenClaw menerima model atau id router Fireworks apa pun saat runtime. Gunakan id persis seperti yang ditampilkan oleh Fireworks dan tambahkan awalan `fireworks/`. Resolusi dinamis mengkloning templat Fire Pass (input teks + gambar, API yang kompatibel dengan OpenAI, biaya default nol) dan menonaktifkan pemikiran secara otomatis ketika id cocok dengan pola Kimi. Id dinamis GLM ditandai sebagai hanya teks kecuali Anda mengonfigurasi entri model khusus dengan input gambar.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cara kerja pemberian awalan id model">
    Setiap referensi model Fireworks di OpenClaw diawali dengan `fireworks/` yang diikuti oleh id atau jalur router persis dari platform Fireworks. Contoh:

    - Model router: `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo`
    - Model langsung: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw menghapus awalan `fireworks/` saat menyusun permintaan API dan mengirimkan jalur yang tersisa ke endpoint Fireworks sebagai bidang `model` yang kompatibel dengan OpenAI.

  </Accordion>

  <Accordion title="Alasan pemikiran dipaksa nonaktif untuk Kimi">
    Fireworks menyajikan Kimi tanpa saluran penalaran terpisah, sehingga alur pemikiran dapat muncul dalam aliran `content` yang terlihat. Pada setiap permintaan Kimi Fireworks, OpenClaw mengirimkan `thinking: { type: "disabled" }` dan menghapus `reasoning`, `reasoning_effort`, serta `reasoningEffort` dari payload (`extensions/fireworks/stream.ts`). Kebijakan penyedia (`extensions/fireworks/thinking-policy.ts`) hanya mengiklankan tingkat pemikiran `off` untuk id model Kimi, sehingga peralihan manual `/think` dan permukaan kebijakan penyedia tetap selaras dengan kontrak runtime.

    Untuk menggunakan penalaran Kimi secara menyeluruh, konfigurasikan [penyedia Moonshot](/id/providers/moonshot) dan arahkan model yang sama melaluinya.

  </Accordion>

  <Accordion title="Ketersediaan lingkungan untuk daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), kunci Fireworks harus dapat dilihat oleh proses tersebut — bukan hanya oleh shell interaktif Anda.

    <Warning>
      Kunci yang hanya diekspor dalam shell interaktif tidak akan membantu daemon launchd atau systemd kecuali lingkungan tersebut juga diimpor ke sana. Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` agar dapat dibaca dari proses gateway.
    </Warning>

    OpenClaw memuat `~/.openclaw/.env` saat memuat konfigurasi, sehingga kunci yang disimpan di sana menjangkau layanan gateway terkelola pada setiap platform. Mulai ulang gateway (atau jalankan kembali `openclaw doctor --fix`) setelah merotasi kunci.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Mode pemikiran" href="/id/tools/thinking" icon="brain">
    Tingkat `/think`, kebijakan penyedia, dan pengarahan model yang mampu melakukan penalaran.
  </Card>
  <Card title="Moonshot" href="/id/providers/moonshot" icon="moon">
    Jalankan Kimi dengan output pemikiran native melalui API milik Moonshot.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
