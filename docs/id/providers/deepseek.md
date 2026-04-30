---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan variabel lingkungan untuk kunci API atau pilihan autentikasi CLI
summary: Penyiapan DeepSeek (autentikasi + pemilihan model)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T10:06:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) menyediakan model AI yang kuat dengan API yang kompatibel dengan OpenAI.

| Properti  | Nilai                      |
| --------- | -------------------------- |
| Penyedia  | `deepseek`                 |
| Autentikasi | `DEEPSEEK_API_KEY`       |
| API       | Kompatibel dengan OpenAI   |
| URL dasar | `https://api.deepseek.com` |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Ini akan meminta kunci API Anda dan mengatur `deepseek/deepseek-v4-flash` sebagai model default.

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
  <Accordion title="Penyiapan noninteraktif">
    Untuk instalasi berskrip atau tanpa antarmuka, teruskan semua flag secara langsung:

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

| Ref model                    | Nama              | Input | Konteks   | Output maks | Catatan                                      |
| ---------------------------- | ----------------- | ----- | --------- | ----------- | -------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | teks  | 1,000,000 | 384,000     | Model default; permukaan V4 yang mendukung berpikir |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | teks  | 1,000,000 | 384,000     | Permukaan V4 yang mendukung berpikir         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | teks  | 131,072   | 8,192       | Permukaan DeepSeek V3.2 tanpa berpikir       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | teks  | 131,072   | 65,536      | Permukaan V3.2 dengan penalaran diaktifkan   |

<Tip>
Model V4 mendukung kontrol `thinking` DeepSeek. OpenClaw juga memutar ulang
`reasoning_content` DeepSeek pada giliran lanjutan sehingga sesi berpikir dengan pemanggilan tool
dapat berlanjut.
</Tip>

## Berpikir dan tool

Sesi berpikir DeepSeek V4 memiliki kontrak pemutaran ulang yang lebih ketat daripada sebagian besar
penyedia yang kompatibel dengan OpenAI: setelah giliran dengan berpikir diaktifkan menggunakan tool, DeepSeek
mengharapkan pesan assistant yang diputar ulang dari giliran tersebut menyertakan
`reasoning_content` pada permintaan lanjutan. OpenClaw menangani ini di dalam
Plugin DeepSeek, sehingga penggunaan tool multi-giliran normal berfungsi dengan
`deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`.

Jika Anda mengalihkan sesi yang ada dari penyedia lain yang kompatibel dengan OpenAI ke
model DeepSeek V4, giliran pemanggilan tool assistant yang lebih lama mungkin tidak memiliki
`reasoning_content` DeepSeek asli. OpenClaw mengisi bidang yang hilang itu pada pesan
assistant yang diputar ulang untuk permintaan berpikir DeepSeek V4 sehingga penyedia dapat menerima
riwayat tanpa memerlukan `/new`.

Ketika berpikir dinonaktifkan di OpenClaw (termasuk pilihan UI **None**),
OpenClaw mengirim `thinking: { type: "disabled" }` DeepSeek dan menghapus
`reasoning_content` yang diputar ulang dari riwayat keluar. Ini menjaga sesi dengan berpikir dinonaktifkan
tetap berada pada jalur DeepSeek tanpa berpikir.

Gunakan `deepseek/deepseek-v4-flash` untuk jalur cepat default. Gunakan
`deepseek/deepseek-v4-pro` saat Anda menginginkan model V4 yang lebih kuat dan dapat menerima
biaya atau latensi yang lebih tinggi.

## Pengujian langsung

Suite model langsung langsung mencakup DeepSeek V4 dalam kumpulan model modern. Untuk
menjalankan hanya pemeriksaan model langsung DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Pemeriksaan langsung tersebut memverifikasi bahwa kedua model V4 dapat menyelesaikan tugas dan bahwa giliran lanjutan berpikir/tool
mempertahankan payload pemutaran ulang yang diperlukan DeepSeek.

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
    Referensi konfigurasi lengkap untuk agent, model, dan penyedia.
  </Card>
</CardGroup>
