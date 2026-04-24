---
read_when:
    - Anda ingin menggunakan Grok untuk `web_search`
    - Anda memerlukan `XAI_API_KEY` untuk pencarian web
summary: Pencarian web Grok melalui respons berbasis web xAI
title: Pencarian Grok
x-i18n:
    generated_at: "2026-04-24T09:31:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw mendukung Grok sebagai provider `web_search`, menggunakan respons berbasis web xAI
untuk menghasilkan jawaban sintetis AI yang didukung oleh hasil pencarian langsung
dengan sitasi.

`XAI_API_KEY` yang sama juga dapat mendukung alat bawaan `x_search` untuk pencarian postingan X
(sebelumnya Twitter). Jika Anda menyimpan key di bawah
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw sekarang juga menggunakannya kembali sebagai
fallback untuk provider model xAI bawaan.

Untuk metrik X tingkat posting seperti repost, balasan, bookmark, atau view, sebaiknya gunakan
`x_search` dengan URL posting atau ID status yang tepat alih-alih kueri pencarian
yang luas.

## Onboarding dan configure

Jika Anda memilih **Grok** selama:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw dapat menampilkan langkah lanjutan terpisah untuk mengaktifkan `x_search` dengan
`XAI_API_KEY` yang sama. Langkah lanjutan itu:

- hanya muncul setelah Anda memilih Grok untuk `web_search`
- bukan pilihan provider web-search tingkat atas yang terpisah
- dapat secara opsional menetapkan model `x_search` dalam alur yang sama

Jika Anda melewatkannya, Anda dapat mengaktifkan atau mengubah `x_search` nanti di konfigurasi.

## Dapatkan API key

<Steps>
  <Step title="Buat key">
    Dapatkan API key dari [xAI](https://console.x.ai/).
  </Step>
  <Step title="Simpan key">
    Tetapkan `XAI_API_KEY` di lingkungan Gateway, atau konfigurasi melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // opsional jika XAI_API_KEY ditetapkan
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

**Alternatif variabel lingkungan:** tetapkan `XAI_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Cara kerjanya

Grok menggunakan respons berbasis web xAI untuk mensintesis jawaban dengan sitasi inline,
mirip dengan pendekatan grounding Google Search milik Gemini.

## Parameter yang didukung

Pencarian Grok mendukung `query`.

`count` diterima untuk kompatibilitas bersama `web_search`, tetapi Grok tetap
mengembalikan satu jawaban sintetis dengan sitasi alih-alih daftar N hasil.

Filter khusus provider saat ini belum didukung.

## Terkait

- [Gambaran umum Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [x_search di Web Search](/id/tools/web#x_search) -- pencarian X kelas utama melalui xAI
- [Gemini Search](/id/tools/gemini-search) -- jawaban sintetis AI melalui grounding Google
