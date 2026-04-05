---
read_when:
    - Anda ingin menggunakan Grok untuk `web_search`
    - Anda memerlukan `XAI_API_KEY` untuk pencarian web
summary: Pencarian web Grok melalui respons berbasis web xAI
title: Pencarian Grok
x-i18n:
    generated_at: "2026-04-05T14:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Pencarian Grok

OpenClaw mendukung Grok sebagai provider `web_search`, menggunakan respons
berbasis web xAI untuk menghasilkan jawaban sintetis AI yang didukung hasil
pencarian langsung dengan sitasi.

`XAI_API_KEY` yang sama juga dapat mendukung tool bawaan `x_search` untuk
pencarian posting X (sebelumnya Twitter). Jika Anda menyimpan key tersebut di
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw sekarang juga menggunakannya kembali sebagai
fallback untuk model provider xAI bawaan.

Untuk metrik X tingkat posting seperti repost, balasan, bookmark, atau tayangan, sebaiknya
gunakan `x_search` dengan URL posting atau ID status yang tepat alih-alih kueri pencarian
yang luas.

## Onboarding dan konfigurasi

Jika Anda memilih **Grok** saat:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw dapat menampilkan langkah lanjutan terpisah untuk mengaktifkan `x_search` dengan
`XAI_API_KEY` yang sama. Langkah lanjutan itu:

- hanya muncul setelah Anda memilih Grok untuk `web_search`
- bukan pilihan provider pencarian web tingkat atas yang terpisah
- secara opsional dapat menetapkan model `x_search` dalam alur yang sama

Jika Anda melewatinya, Anda dapat mengaktifkan atau mengubah `x_search` nanti di config.

## Dapatkan API key

<Steps>
  <Step title="Buat key">
    Dapatkan API key dari [xAI](https://console.x.ai/).
  </Step>
  <Step title="Simpan key">
    Setel `XAI_API_KEY` di lingkungan Gateway, atau konfigurasi melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // opsional jika XAI_API_KEY telah disetel
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternatif lingkungan:** setel `XAI_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Cara kerjanya

Grok menggunakan respons berbasis web xAI untuk mensintesis jawaban dengan
sitasi inline, mirip dengan pendekatan grounding Google Search milik Gemini.

## Parameter yang didukung

Pencarian Grok mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi Grok tetap
mengembalikan satu jawaban sintetis dengan sitasi alih-alih daftar N hasil.

Filter khusus provider saat ini belum didukung.

## Terkait

- [Ikhtisar Pencarian Web](/tools/web) -- semua provider dan deteksi otomatis
- [`x_search` di Pencarian Web](/tools/web#x_search) -- pencarian X kelas satu melalui xAI
- [Pencarian Gemini](/tools/gemini-search) -- jawaban sintetis AI melalui grounding Google
