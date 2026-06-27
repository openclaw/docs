---
read_when:
    - Anda ingin menggunakan Grok untuk web_search
    - Anda ingin menggunakan xAI OAuth atau XAI_API_KEY untuk pencarian web
summary: Pencarian web Grok melalui respons xAI berbasis web
title: Pencarian Grok
x-i18n:
    generated_at: "2026-06-27T18:19:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw mendukung Grok sebagai penyedia `web_search`, menggunakan respons berbasis web xAI untuk menghasilkan jawaban tersintesis AI yang didukung oleh hasil pencarian langsung dengan sitasi.

Pencarian web Grok mengutamakan proses masuk OAuth xAI yang sudah ada jika tersedia. Jika tidak ada profil OAuth, kunci API xAI yang sama juga dapat menjalankan alat bawaan `x_search` untuk pencarian postingan X (sebelumnya Twitter) dan alat `code_execution`. Jika Anda menyimpan kunci di `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw menggunakannya kembali sebagai cadangan untuk penyedia model xAI bawaan juga.

Untuk metrik tingkat postingan X seperti repost, balasan, bookmark, atau tampilan, utamakan `x_search` dengan URL postingan atau ID status yang tepat, bukan kueri pencarian luas.

## Orientasi awal dan konfigurasi

Jika Anda memilih **Grok** selama:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw dapat menggunakan profil OAuth xAI yang sudah ada tanpa meminta kunci pencarian web terpisah. Jika OAuth tidak tersedia, OpenClaw beralih ke penyiapan kunci API xAI. OpenClaw juga dapat menampilkan langkah lanjutan terpisah untuk mengaktifkan `x_search` dengan kredensial xAI yang sama. Langkah lanjutan tersebut:

- hanya muncul setelah Anda memilih Grok untuk `web_search`
- bukan pilihan penyedia pencarian web tingkat atas yang terpisah
- dapat secara opsional mengatur model `x_search` selama alur yang sama

Jika Anda melewatinya, Anda dapat mengaktifkan atau mengubah `x_search` nanti di konfigurasi.

## Masuk atau dapatkan kunci API

<Steps>
  <Step title="Gunakan OAuth xAI">
    Jika Anda sudah masuk dengan xAI selama orientasi awal atau autentikasi model, pilih
    Grok sebagai penyedia `web_search`. Tidak diperlukan kunci API terpisah:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Gunakan kunci API cadangan">
    Dapatkan kunci API dari [xAI](https://console.x.ai/) ketika OAuth tidak tersedia
    atau Anda memang menginginkan konfigurasi pencarian web yang didukung kunci.
  </Step>
  <Step title="Simpan kunci">
    Tetapkan `XAI_API_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**Alternatif kredensial:** masuk dengan `openclaw models auth login
--provider xai --method oauth`, tetapkan `XAI_API_KEY` di lingkungan Gateway,
atau simpan `plugins.entries.xai.config.webSearch.apiKey`. Untuk instalasi gateway,
letakkan variabel lingkungan di `~/.openclaw/.env`.

## Cara kerjanya

Grok menggunakan respons berbasis web xAI untuk mensintesis jawaban dengan sitasi sebaris, mirip dengan pendekatan landasan Google Search milik Gemini.

## Parameter yang didukung

Pencarian Grok mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi Grok tetap
mengembalikan satu jawaban tersintesis dengan sitasi, bukan daftar N hasil.

Filter khusus penyedia saat ini tidak didukung.

Grok menggunakan batas waktu default khusus penyedia selama 60 detik karena pencarian berbasis web xAI Responses dapat berjalan lebih lama daripada default `web_search` bersama. Tetapkan `tools.web.search.timeoutSeconds` untuk menggantinya.

## Penggantian URL dasar

Tetapkan `plugins.entries.xai.config.webSearch.baseUrl` ketika pencarian web Grok harus dirutekan melalui proksi operator atau endpoint Responses yang kompatibel dengan xAI. OpenClaw mengirim posting ke `<baseUrl>/responses` setelah memangkas garis miring di akhir. `x_search` menggunakan cadangan `webSearch.baseUrl` yang sama kecuali
`plugins.entries.xai.config.xSearch.baseUrl` ditetapkan.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [`x_search` di Web Search](/id/tools/web#x_search) -- pencarian X kelas utama melalui xAI
- [Gemini Search](/id/tools/gemini-search) -- jawaban tersintesis AI melalui landasan Google
