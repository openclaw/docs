---
read_when:
    - Anda ingin menggunakan MiniMax untuk web_search
    - Anda memerlukan kunci MiniMax Token Plan atau token OAuth
    - Anda menginginkan panduan host pencarian MiniMax CN/global
summary: Pencarian MiniMax melalui API pencarian Token Plan
title: Pencarian MiniMax
x-i18n:
    generated_at: "2026-05-11T20:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw mendukung MiniMax sebagai penyedia `web_search` melalui API pencarian MiniMax
Token Plan. API ini mengembalikan hasil pencarian terstruktur dengan judul, URL,
cuplikan, dan kueri terkait.

## Mendapatkan kredensial Token Plan

<Steps>
  <Step title="Buat kunci">
    Buat atau salin kunci MiniMax Token Plan dari
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
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
`MINIMAX_API_KEY` sebagai alias env. `MINIMAX_API_KEY` harus mengarah ke
kredensial Token Plan yang mendukung pencarian; kunci API model MiniMax biasa mungkin tidak
diterima oleh endpoint pencarian Token Plan.

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
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
Untuk instalasi Gateway, letakkan di `~/.openclaw/.env`.

## Pemilihan region

MiniMax Search menggunakan endpoint berikut:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jika `plugins.entries.minimax.config.webSearch.region` tidak ditetapkan, OpenClaw menyelesaikan
region dalam urutan berikut:

1. `tools.web.search.minimax.region` / `webSearch.region` milik Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Artinya, onboarding CN atau `MINIMAX_API_HOST=https://api.minimaxi.com/...`
secara otomatis juga menjaga MiniMax Search tetap pada host CN.

Bahkan ketika Anda mengautentikasi MiniMax melalui jalur OAuth `minimax-portal`,
pencarian web tetap terdaftar sebagai id penyedia `minimax`; URL dasar penyedia OAuth
digunakan sebagai petunjuk region untuk pemilihan host CN/global, dan `MINIMAX_OAUTH_TOKEN`
dapat memenuhi kredensial bearer MiniMax Search.

## Parameter yang didukung

| Parameter | Tipe    | Batasan | Deskripsi                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | wajib    | String kueri pencarian.                                                        |
| `count`   | integer | 1-10        | Jumlah hasil yang akan dikembalikan. OpenClaw memangkas daftar yang dikembalikan ke ukuran ini. |

Filter khusus penyedia saat ini belum didukung.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [MiniMax](/id/providers/minimax) -- penyiapan model, gambar, suara, dan autentikasi
