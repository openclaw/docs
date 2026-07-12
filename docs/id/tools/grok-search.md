---
read_when:
    - Anda ingin menggunakan Grok untuk `web_search`
    - Anda ingin menggunakan OAuth xAI atau XAI_API_KEY untuk pencarian web
summary: Pencarian web Grok melalui respons xAI yang didasarkan pada informasi web
title: Pencarian Grok
x-i18n:
    generated_at: "2026-07-12T14:46:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw mendukung Grok sebagai penyedia `web_search`, menggunakan respons xAI yang didasarkan pada web untuk menghasilkan jawaban hasil sintesis AI yang didukung oleh hasil pencarian langsung beserta sitasi.

Pencarian web Grok mengutamakan proses masuk OAuth xAI yang sudah ada jika tersedia. Jika tidak ada profil OAuth, kunci API xAI yang sama juga mendukung alat bawaan `x_search` untuk pencarian kiriman X (sebelumnya Twitter) dan alat `code_execution`. Menyimpan kunci di `plugins.entries.xai.config.webSearch.apiKey` juga memungkinkan OpenClaw menggunakannya kembali sebagai opsi cadangan untuk penyedia model xAI bawaan.

Untuk metrik X tingkat kiriman (repost, balasan, markah, tayangan), gunakan [`x_search`](/id/tools/web#x_search) dengan URL kiriman atau ID status yang tepat, bukan kueri pencarian umum.

## Orientasi awal dan konfigurasi

Memilih **Grok** saat menjalankan `openclaw onboard` atau `openclaw configure --section
web` memungkinkan OpenClaw menggunakan kembali profil OAuth xAI yang sudah ada tanpa meminta kunci pencarian web terpisah. Tanpa OAuth, OpenClaw beralih ke penyiapan kunci API xAI.

OpenClaw kemudian menawarkan langkah lanjutan untuk mengaktifkan `x_search` dengan kredensial xAI yang sama. Langkah lanjutan tersebut:

- hanya muncul setelah Anda memilih Grok untuk `web_search`
- bukan pilihan penyedia pencarian web tingkat atas yang terpisah
- dapat secara opsional menetapkan model `x_search` dalam alur yang sama

Lewati langkah tersebut untuk mengaktifkan atau mengubah `x_search` nanti dalam konfigurasi.

## Masuk atau dapatkan kunci API

<Steps>
  <Step title="Gunakan OAuth xAI">
    Jika Anda sudah masuk dengan xAI selama orientasi awal atau autentikasi model, pilih Grok sebagai penyedia `web_search`. Kunci API terpisah tidak diperlukan:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Gunakan kunci API sebagai opsi cadangan">
    Dapatkan kunci API dari [xAI](https://console.x.ai/) ketika OAuth tidak tersedia atau Anda memang ingin menggunakan konfigurasi pencarian web berbasis kunci.
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
            apiKey: "xai-...", // opsional jika OAuth xAI atau XAI_API_KEY tersedia
            baseUrl: "https://api.x.ai/v1", // penggantian URL dasar/proksi Responses API opsional
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

**Alternatif kredensial:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` di lingkungan Gateway, atau
`plugins.entries.xai.config.webSearch.apiKey`. Untuk instalasi Gateway, tempatkan variabel lingkungan di `~/.openclaw/.env`.

## Cara kerjanya

Grok menggunakan respons xAI yang didasarkan pada web untuk menyintesis jawaban dengan sitasi sebaris, serupa dengan pendekatan grounding Google Search milik Gemini.

## Parameter yang didukung

Pencarian Grok mendukung `query`. `count` diterima untuk kompatibilitas bersama `web_search`, tetapi Grok selalu mengembalikan satu jawaban hasil sintesis dengan sitasi, bukan daftar berisi N hasil. Filter khusus penyedia tidak didukung.

Grok secara baku menggunakan batas waktu 60 detik karena pencarian Responses xAI yang didasarkan pada web dapat berlangsung lebih lama daripada batas waktu baku bersama `web_search`. Ganti nilainya dengan `tools.web.search.timeoutSeconds`.

## Penggantian URL dasar

Tetapkan `plugins.entries.xai.config.webSearch.baseUrl` untuk merutekan pencarian web Grok melalui proksi operator atau endpoint Responses yang kompatibel dengan xAI. OpenClaw mengirim permintaan POST ke `<baseUrl>/responses` setelah memangkas garis miring penutup. `x_search` menggunakan `webSearch.baseUrl` yang sama sebagai opsi cadangan, kecuali jika `plugins.entries.xai.config.xSearch.baseUrl` ditetapkan.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [x_search dalam Pencarian Web](/id/tools/web#x_search) -- pencarian X kelas utama melalui xAI
- [Pencarian Gemini](/id/tools/gemini-search) -- jawaban hasil sintesis AI melalui grounding Google
