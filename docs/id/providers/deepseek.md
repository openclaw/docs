---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan DeepSeek (autentikasi + pemilihan model)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) menyediakan model AI yang kuat dengan API yang kompatibel dengan OpenAI.

| Properti | Nilai                      |
| -------- | -------------------------- |
| Penyedia | `deepseek`                 |
| Autentikasi | `DEEPSEEK_API_KEY`         |
| API      | Kompatibel dengan OpenAI          |
| URL Dasar | `https://api.deepseek.com` |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Ini akan meminta kunci API Anda dan menetapkan `deepseek/deepseek-v4-flash` sebagai model default.

  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider deepseek
    ```

    Untuk memeriksa katalog statis bawaan tanpa memerlukan Gateway yang sedang berjalan,
    gunakan:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Penyiapan non-interaktif">
    Untuk instalasi terskrip atau headless, teruskan semua flag secara langsung:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `DEEPSEEK_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).
</Warning>

## Katalog bawaan

| Ref model                    | Nama              | Masukan | Konteks   | Output maks | Catatan                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | teks  | 1,000,000 | 384,000    | Model default; permukaan V4 yang mendukung thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | teks  | 1,000,000 | 384,000    | Permukaan V4 yang mendukung thinking                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | teks  | 131,072   | 8,192      | Permukaan DeepSeek V3.2 non-thinking         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | teks  | 131,072   | 65,536     | Permukaan V3.2 dengan penalaran diaktifkan             |

<Tip>
Model V4 mendukung kontrol `thinking` DeepSeek. OpenClaw juga memutar ulang
`reasoning_content` DeepSeek pada giliran lanjutan sehingga sesi thinking dengan
panggilan alat dapat berlanjut.
Gunakan `/think xhigh` atau `/think max` dengan model DeepSeek V4 untuk meminta
`reasoning_effort` maksimum DeepSeek.
</Tip>

## Thinking dan alat

Sesi thinking DeepSeek V4 memiliki kontrak pemutaran ulang yang lebih ketat daripada sebagian besar
penyedia yang kompatibel dengan OpenAI: setelah giliran dengan thinking diaktifkan menggunakan alat, DeepSeek
mengharapkan pesan asisten yang diputar ulang dari giliran tersebut menyertakan
`reasoning_content` pada permintaan lanjutan. OpenClaw menangani ini di dalam
Plugin DeepSeek, sehingga penggunaan alat multi-giliran normal berfungsi dengan
`deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`.

Jika Anda mengalihkan sesi yang ada dari penyedia lain yang kompatibel dengan OpenAI ke
model DeepSeek V4, giliran panggilan alat asisten lama mungkin tidak memiliki
`reasoning_content` DeepSeek asli. OpenClaw mengisi field yang hilang tersebut pada pesan
asisten yang diputar ulang untuk permintaan thinking DeepSeek V4 sehingga penyedia dapat menerima
riwayat tanpa memerlukan `/new`.

Ketika thinking dinonaktifkan di OpenClaw (termasuk pilihan UI **None**),
OpenClaw mengirimkan `thinking: { type: "disabled" }` DeepSeek dan menghapus
`reasoning_content` yang diputar ulang dari riwayat keluar. Ini menjaga sesi
dengan thinking dinonaktifkan tetap berada di jalur DeepSeek non-thinking.

Gunakan `deepseek/deepseek-v4-flash` untuk jalur cepat default. Gunakan
`deepseek/deepseek-v4-pro` ketika Anda menginginkan model V4 yang lebih kuat dan dapat menerima
biaya atau latensi yang lebih tinggi.

## Pengujian live

Rangkaian model live langsung mencakup DeepSeek V4 dalam set model modern. Untuk
menjalankan hanya pemeriksaan model langsung DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Pemeriksaan live tersebut memverifikasi bahwa kedua model V4 dapat menyelesaikan permintaan dan bahwa giliran lanjutan
thinking/alat mempertahankan payload pemutaran ulang yang diperlukan DeepSeek.

## Contoh konfigurasi

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
