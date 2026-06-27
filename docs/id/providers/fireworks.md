---
read_when:
    - Anda ingin menggunakan Fireworks dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Fireworks atau ID model default
    - Anda sedang men-debug perilaku Kimi thinking-off di Fireworks
summary: Penyiapan Fireworks (autentikasi + pemilihan model)
title: Fireworks
x-i18n:
    generated_at: "2026-06-27T18:04:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) mengekspos model berbobot terbuka dan model berute melalui API yang kompatibel dengan OpenAI. Instal plugin penyedia Fireworks resmi untuk menggunakan dua model Kimi yang sudah dikatalogkan dan model atau id router Fireworks apa pun saat runtime.

| Properti        | Nilai                                                  |
| --------------- | ------------------------------------------------------ |
| Id penyedia     | `fireworks` (alias: `fireworks-ai`)                    |
| Paket           | `@openclaw/fireworks-provider`                         |
| Var env auth    | `FIREWORKS_API_KEY`                                    |
| Flag orientasi  | `--auth-choice fireworks-api-key`                      |
| Flag CLI langsung | `--fireworks-api-key <key>`                          |
| API             | Kompatibel dengan OpenAI (`openai-completions`)        |
| URL dasar       | `https://api.fireworks.ai/inference/v1`                |
| Model default   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias default   | `Kimi K2.5 Turbo`                                      |

## Memulai

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash Orientasi
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env saja
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Orientasi menyimpan kunci pada penyedia `fireworks` di profil auth Anda dan menetapkan router Kimi K2.5 Turbo **Fire Pass** sebagai model default.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    Daftar tersebut seharusnya menyertakan `Kimi K2.6` dan `Kimi K2.5 Turbo (Fire Pass)`. Jika `FIREWORKS_API_KEY` tidak terselesaikan, `openclaw models status --json` melaporkan kredensial yang hilang di bawah `auth.unusableProfiles`.

  </Step>
</Steps>

## Penyiapan non-interaktif

Untuk instalasi berskrip atau CI, berikan semuanya di baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Ref model                                              | Nama                        | Input        | Konteks | Output maks | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ----------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | teks + gambar | 262,144 | 262,144    | Dipaksa nonaktif     |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | teks + gambar | 256,000 | 256,000    | Dipaksa nonaktif (default) |

<Note>
  OpenClaw mengunci semua model Fireworks Kimi ke `thinking: off` karena Fireworks menolak parameter thinking Kimi di produksi. Merutekan model yang sama melalui [Moonshot](/id/providers/moonshot) secara langsung mempertahankan output penalaran Kimi. Lihat [mode thinking](/id/tools/thinking) untuk beralih antarpenyedia.
</Note>

## Id model Fireworks kustom

OpenClaw menerima model atau id router Fireworks apa pun saat runtime. Gunakan id persis seperti yang ditampilkan oleh Fireworks dan awali dengan `fireworks/`. Resolusi dinamis mengkloning templat Fire Pass (input teks + gambar, API yang kompatibel dengan OpenAI, biaya default nol) dan menonaktifkan thinking secara otomatis ketika id cocok dengan pola Kimi. Id dinamis GLM ditandai hanya teks kecuali Anda mengonfigurasi entri model kustom dengan input gambar.

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
  <Accordion title="How model id prefixing works">
    Setiap ref model Fireworks di OpenClaw dimulai dengan `fireworks/` diikuti id atau path router persis dari platform Fireworks. Contoh:

    - Model router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model langsung: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw menghapus prefiks `fireworks/` saat menyusun permintaan API dan mengirim path yang tersisa ke endpoint Fireworks sebagai kolom `model` yang kompatibel dengan OpenAI.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 mengembalikan 400 jika permintaan membawa parameter `reasoning_*`, meskipun Kimi mendukung thinking melalui API milik Moonshot. Kebijakan penyedia (`extensions/fireworks/thinking-policy.ts`) hanya mengiklankan level thinking `off` untuk id model Kimi, sehingga pengalihan manual `/think` dan permukaan kebijakan penyedia tetap selaras dengan kontrak runtime.

    Untuk menggunakan penalaran Kimi dari ujung ke ujung, konfigurasikan [penyedia Moonshot](/id/providers/moonshot) dan rutekan model yang sama melaluinya.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), kunci Fireworks harus terlihat oleh proses tersebut, bukan hanya oleh shell interaktif Anda.

    <Warning>
      Kunci yang diekspor hanya di shell interaktif tidak akan membantu daemon launchd atau systemd kecuali environment tersebut juga diimpor ke sana. Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` agar dapat dibaca dari proses gateway.
    </Warning>

    Di macOS, `openclaw gateway install` sudah menghubungkan `~/.openclaw/.env` ke file environment LaunchAgent. Jalankan ulang instalasi (atau `openclaw doctor --fix`) setelah merotasi kunci.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model providers" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Thinking modes" href="/id/tools/thinking" icon="brain">
    Level `/think`, kebijakan penyedia, dan perutean model yang mampu bernalar.
  </Card>
  <Card title="Moonshot" href="/id/providers/moonshot" icon="moon">
    Jalankan Kimi dengan output thinking native melalui API milik Moonshot.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
