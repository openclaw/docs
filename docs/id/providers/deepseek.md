---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan DeepSeek (autentikasi + pemilihan model)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T14:34:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) menyediakan model AI canggih dengan API yang kompatibel dengan OpenAI.

| Properti  | Nilai                      |
| --------- | -------------------------- |
| Penyedia  | `deepseek`                 |
| Autentikasi | `DEEPSEEK_API_KEY`       |
| API       | Kompatibel dengan OpenAI   |
| URL dasar | `https://api.deepseek.com` |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Meminta kunci API Anda dan menetapkan `deepseek/deepseek-v4-flash` sebagai model default.

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider deepseek
    ```

    Untuk memeriksa katalog statis Plugin tanpa Gateway yang sedang berjalan:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Penyiapan noninteraktif">
    Untuk instalasi dengan skrip atau tanpa antarmuka, teruskan semua flag secara langsung:

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
tersedia bagi proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).
</Warning>

## Katalog bawaan

| Referensi model              | Nama              | Masukan | Konteks   | Keluaran maks. | Catatan                                                     |
| ---------------------------- | ----------------- | ------- | --------- | --------------- | ----------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | teks    | 1,000,000 | 384,000         | Model default; antarmuka V4 yang mendukung penalaran         |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | teks    | 1,000,000 | 384,000         | Antarmuka V4 yang mendukung penalaran                        |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | teks    | 1,000,000 | 384,000         | Nama kompatibilitas V4 Flash tanpa penalaran yang tidak digunakan lagi |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | teks    | 1,000,000 | 384,000         | Nama kompatibilitas V4 Flash dengan penalaran yang tidak digunakan lagi |

<Warning>
DeepSeek akan menghentikan `deepseek-chat` dan `deepseek-reasoner` pada 24 Juli 2026
pukul 15.59 UTC. Saat ini, keduanya masing-masing diarahkan ke DeepSeek V4 Flash dalam
mode tanpa penalaran dan dengan penalaran. Pindahkan referensi model yang dikonfigurasi ke
`deepseek/deepseek-v4-flash` atau `deepseek/deepseek-v4-pro` sebelum batas waktu tersebut.
</Warning>

Perkiraan biaya lokal OpenClaw mengikuti tarif cache hit, cache miss, dan keluaran
yang dipublikasikan DeepSeek. DeepSeek dapat mengubah tarif tersebut; halaman
[Model & Harga](https://api-docs.deepseek.com/quick_start/pricing/) miliknya
merupakan acuan resmi untuk penagihan.

<Tip>
Model V4 mendukung kontrol `thinking` milik DeepSeek. OpenClaw juga memutar ulang
`reasoning_content` DeepSeek pada giliran lanjutan agar sesi penalaran dengan
pemanggilan alat dapat berlanjut.
Gunakan `/think xhigh` atau `/think max` dengan model DeepSeek V4 untuk meminta
`reasoning_effort` maksimum DeepSeek; keduanya dipetakan ke `"max"`.
</Tip>

## Penalaran dan alat

Sesi penalaran DeepSeek V4 mengharuskan pesan asisten yang diputar ulang dari
giliran dengan penalaran aktif untuk menyertakan `reasoning_content` dalam permintaan lanjutan.
Plugin DeepSeek OpenClaw mengisi kolom tersebut secara otomatis, sehingga penggunaan alat
multi-giliran secara normal berfungsi pada `deepseek/deepseek-v4-flash` dan
`deepseek/deepseek-v4-pro`, bahkan ketika riwayat berasal dari penyedia lain yang
kompatibel dengan OpenAI (tanpa `reasoning_content` bawaan) atau dari pesan
asisten biasa. Tidak perlu `/new` setelah beralih penyedia di tengah sesi.

Ketika penalaran dinonaktifkan (termasuk pilihan UI **None**), OpenClaw
mengirim `thinking: { type: "disabled" }` dan menghapus `reasoning_content`
yang diputar ulang dari riwayat keluar, sehingga sesi tetap berada pada jalur
DeepSeek tanpa penalaran.

Gunakan `deepseek/deepseek-v4-flash` untuk jalur cepat default. Gunakan
`deepseek/deepseek-v4-pro` untuk model yang lebih kuat jika Anda dapat menerima biaya
atau latensi yang lebih tinggi.

## Pengujian langsung

Untuk hanya menjalankan pemeriksaan model langsung DeepSeek V4 dari rangkaian pengujian langsung model modern:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Memverifikasi bahwa kedua model V4 menyelesaikan proses dan bahwa giliran lanjutan
penalaran/alat mempertahankan payload pemutaran ulang yang diperlukan DeepSeek.

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
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
