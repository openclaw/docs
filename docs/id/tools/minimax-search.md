---
read_when:
    - Anda ingin menggunakan MiniMax untuk web_search
    - Anda memerlukan kunci Token Plan MiniMax atau token OAuth
    - Anda menginginkan panduan host pencarian CN/global MiniMax
summary: Pencarian MiniMax melalui API pencarian Token Plan
title: Pencarian MiniMax
x-i18n:
    generated_at: "2026-05-02T09:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw mendukung MiniMax sebagai penyedia `web_search` melalui API pencarian MiniMax
Token Plan. API ini mengembalikan hasil pencarian terstruktur dengan judul, URL,
cuplikan, dan kueri terkait.

## Dapatkan kredensial Token Plan

<Steps>
  <Step title="Create a key">
    Buat atau salin kunci MiniMax Token Plan dari
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Setup OAuth dapat menggunakan kembali `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Store the key">
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

## Konfig

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
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Pemilihan wilayah

MiniMax Search menggunakan endpoint berikut:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jika `plugins.entries.minimax.config.webSearch.region` belum ditetapkan, OpenClaw menentukan
wilayah dalam urutan berikut:

1. `tools.web.search.minimax.region` / `webSearch.region` milik plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Itu berarti onboarding CN atau `MINIMAX_API_HOST=https://api.minimaxi.com/...`
secara otomatis juga mempertahankan MiniMax Search pada host CN.

Meskipun Anda mengautentikasi MiniMax melalui jalur OAuth `minimax-portal`,
pencarian web tetap terdaftar sebagai id penyedia `minimax`; URL dasar penyedia OAuth
digunakan sebagai petunjuk wilayah untuk pemilihan host CN/global, dan `MINIMAX_OAUTH_TOKEN`
dapat memenuhi kredensial bearer MiniMax Search.

## Parameter yang didukung

MiniMax Search mendukung:

- `query`
- `count` (OpenClaw memangkas daftar hasil yang dikembalikan sesuai jumlah yang diminta)

Filter khusus penyedia saat ini belum didukung.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [MiniMax](/id/providers/minimax) -- setup model, gambar, ucapan, dan autentikasi
