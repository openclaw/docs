---
read_when:
    - Anda ingin menggunakan Fireworks dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Fireworks atau ID model default
    - Anda sedang men-debug perilaku thinking-off Kimi di Fireworks
summary: Penyiapan Fireworks (autentikasi + pemilihan model)
title: Kembang Api
x-i18n:
    generated_at: "2026-05-06T09:25:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) mengekspos model berbobot terbuka dan model yang dirutekan melalui API yang kompatibel dengan OpenAI. OpenClaw menyertakan Plugin penyedia Fireworks bawaan yang dikirim dengan dua model Kimi yang sudah dikatalogkan dan menerima model Fireworks atau id router apa pun saat runtime.

| Properti        | Nilai                                                  |
| --------------- | ------------------------------------------------------ |
| Id penyedia     | `fireworks` (alias: `fireworks-ai`)                    |
| Plugin          | bawaan, `enabledByDefault: true`                       |
| Variabel env auth | `FIREWORKS_API_KEY`                                  |
| Flag onboarding | `--auth-choice fireworks-api-key`                      |
| Flag CLI langsung | `--fireworks-api-key <key>`                         |
| API             | kompatibel dengan OpenAI (`openai-completions`)        |
| URL dasar       | `https://api.fireworks.ai/inference/v1`                |
| Model default   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias default   | `Kimi K2.5 Turbo`                                      |

## Memulai

<Steps>
  <Step title="Atur kunci API Fireworks">
    <CodeGroup>

```bash Onboarding
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

    Onboarding menyimpan kunci terhadap penyedia `fireworks` di profil autentikasi Anda dan menetapkan router **Fire Pass** Kimi K2.5 Turbo sebagai model default.

  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider fireworks
    ```

    Daftar tersebut harus menyertakan `Kimi K2.6` dan `Kimi K2.5 Turbo (Fire Pass)`. Jika `FIREWORKS_API_KEY` belum terselesaikan, `openclaw models status --json` melaporkan kredensial yang hilang di bawah `auth.unusableProfiles`.

  </Step>
</Steps>

## Penyiapan noninteraktif

Untuk instalasi berskrip atau CI, teruskan semuanya di baris perintah:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Referensi model                                        | Nama                        | Input        | Konteks | Output maks | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ----------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | teks + gambar | 262,144 | 262,144    | Dipaksa nonaktif     |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | teks + gambar | 256,000 | 256,000    | Dipaksa nonaktif (default) |

<Note>
  OpenClaw mematok semua model Fireworks Kimi ke `thinking: off` karena Fireworks menolak parameter thinking Kimi di produksi. Merutekan model yang sama melalui [Moonshot](/id/providers/moonshot) secara langsung mempertahankan output penalaran Kimi. Lihat [mode thinking](/id/tools/thinking) untuk beralih antarpenyedia.
</Note>

## Id model Fireworks kustom

OpenClaw menerima model Fireworks atau id router apa pun saat runtime. Gunakan id persis yang ditampilkan oleh Fireworks dan beri awalan `fireworks/`. Resolusi dinamis menggandakan templat Fire Pass (input teks + gambar, API yang kompatibel dengan OpenAI, biaya default nol) dan menonaktifkan thinking secara otomatis ketika id cocok dengan pola Kimi.

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
    Setiap referensi model Fireworks di OpenClaw dimulai dengan `fireworks/` diikuti id persis atau jalur router dari platform Fireworks. Contoh:

    - Model router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model langsung: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw menghapus awalan `fireworks/` saat membuat permintaan API dan mengirim jalur yang tersisa ke endpoint Fireworks sebagai bidang `model` yang kompatibel dengan OpenAI.

  </Accordion>

  <Accordion title="Mengapa thinking dipaksa nonaktif untuk Kimi">
    Fireworks K2.6 mengembalikan 400 jika permintaan membawa parameter `reasoning_*` meskipun Kimi mendukung thinking melalui API milik Moonshot. Kebijakan bawaan (`extensions/fireworks/thinking-policy.ts`) hanya mengiklankan level thinking `off` untuk id model Kimi, sehingga peralihan `/think` manual dan permukaan kebijakan penyedia tetap selaras dengan kontrak runtime.

    Untuk menggunakan penalaran Kimi end-to-end, konfigurasikan [penyedia Moonshot](/id/providers/moonshot) dan rutekan model yang sama melaluinya.

  </Accordion>

  <Accordion title="Ketersediaan lingkungan untuk daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), kunci Fireworks harus terlihat oleh proses tersebut, bukan hanya oleh shell interaktif Anda.

    <Warning>
      Kunci yang hanya berada di `~/.profile` tidak akan membantu daemon launchd atau systemd kecuali lingkungan tersebut juga diimpor ke sana. Atur kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` agar dapat dibaca dari proses gateway.
    </Warning>

    Di macOS, `openclaw gateway install` sudah menghubungkan `~/.openclaw/.env` ke file lingkungan LaunchAgent. Jalankan ulang instalasi (atau `openclaw doctor --fix`) setelah merotasi kunci.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Mode thinking" href="/id/tools/thinking" icon="brain">
    Level `/think`, kebijakan penyedia, dan perutean model yang mampu bernalar.
  </Card>
  <Card title="Moonshot" href="/id/providers/moonshot" icon="moon">
    Jalankan Kimi dengan output thinking native melalui API milik Moonshot.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
