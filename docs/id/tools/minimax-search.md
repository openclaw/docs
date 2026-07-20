---
read_when:
    - Anda ingin menggunakan MiniMax untuk web_search
    - Anda memerlukan kunci MiniMax Token Plan atau token OAuth
    - Anda menginginkan panduan host pencarian MiniMax CN/global
summary: Pencarian MiniMax melalui API pencarian Token Plan
title: Pencarian MiniMax
x-i18n:
    generated_at: "2026-07-20T03:58:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb851614bbe43f011e07fe3e80d5390f1ba515f3e00ba749c91999617ad2d1e2
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw mendukung MiniMax sebagai penyedia `web_search` melalui API pencarian MiniMax
Token Plan. API ini mengembalikan hasil pencarian terstruktur dengan judul, URL,
cuplikan, dan kueri terkait.

## Mendapatkan kredensial Token Plan

<Steps>
  <Step title="Buat kunci">
    Buat atau salin kunci MiniMax Token Plan dari
    [Platform MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Penyiapan OAuth dapat menggunakan kembali `MINIMAX_OAUTH_TOKEN` sebagai gantinya.
  </Step>
  <Step title="Simpan kunci">
    Tetapkan `MINIMAX_CODE_PLAN_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw juga menerima `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`, dan
`MINIMAX_API_KEY` sebagai alias variabel lingkungan, yang diperiksa sesuai urutan tersebut setelah
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` harus merujuk ke kredensial
Token Plan yang mendukung pencarian; kunci API model MiniMax biasa mungkin tidak diterima oleh
endpoint pencarian Token Plan.

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opsional jika variabel lingkungan MiniMax Token Plan telah ditetapkan
            region: "global", // atau "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternatif lingkungan:** tetapkan `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN`, atau `MINIMAX_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Pemilihan wilayah

MiniMax Search menggunakan endpoint berikut:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jika `plugins.entries.minimax.config.webSearch.region` tidak ditetapkan, OpenClaw menentukan
wilayah dengan urutan berikut:

1. `webSearch.region` milik Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Artinya, orientasi CN atau `MINIMAX_API_HOST=https://api.minimaxi.com/...`
secara otomatis juga mempertahankan MiniMax Search di host CN.

Meskipun Anda mengautentikasi MiniMax melalui jalur OAuth `minimax-portal`,
pencarian web tetap terdaftar dengan ID penyedia `minimax`; URL dasar penyedia OAuth
digunakan sebagai petunjuk wilayah untuk memilih host CN/global, dan `MINIMAX_OAUTH_TOKEN`
dapat memenuhi kredensial bearer MiniMax Search.

## Parameter yang didukung

| Parameter | Tipe    | Batasan         | Deskripsi                                                                   |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | string  | wajib           | String kueri pencarian.                                                     |
| `count`   | integer | 1-10, default 5 | Jumlah hasil yang akan dikembalikan. OpenClaw memangkas daftar yang dikembalikan hingga ukuran ini. |

Filter khusus penyedia saat ini tidak didukung.

## Terkait

- [Ringkasan Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [MiniMax](/id/providers/minimax) -- penyiapan model, gambar, ucapan, dan autentikasi
