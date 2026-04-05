---
read_when:
    - Anda ingin menggunakan MiniMax untuk `web_search`
    - Anda memerlukan kunci MiniMax Coding Plan
    - Anda menginginkan panduan host pencarian MiniMax CN/global
summary: MiniMax Search melalui API pencarian Coding Plan
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-05T14:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# MiniMax Search

OpenClaw mendukung MiniMax sebagai penyedia `web_search` melalui API pencarian MiniMax
Coding Plan. Ini mengembalikan hasil pencarian terstruktur dengan judul, URL,
cuplikan, dan kueri terkait.

## Dapatkan kunci Coding Plan

<Steps>
  <Step title="Buat kunci">
    Buat atau salin kunci MiniMax Coding Plan dari
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Simpan kunci">
    Setel `MINIMAX_CODE_PLAN_KEY` di lingkungan Gateway, atau konfigurasi melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw juga menerima `MINIMAX_CODING_API_KEY` sebagai alias env. `MINIMAX_API_KEY`
masih dibaca sebagai fallback kompatibilitas saat sudah menunjuk ke token coding-plan.

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opsional jika MINIMAX_CODE_PLAN_KEY disetel
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

**Alternatif lingkungan:** setel `MINIMAX_CODE_PLAN_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Pemilihan region

MiniMax Search menggunakan endpoint berikut:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jika `plugins.entries.minimax.config.webSearch.region` tidak disetel, OpenClaw meresolusikan
region dalam urutan berikut:

1. `tools.web.search.minimax.region` / `webSearch.region` milik plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Itu berarti onboarding CN atau `MINIMAX_API_HOST=https://api.minimaxi.com/...`
secara otomatis juga menjaga MiniMax Search tetap menggunakan host CN.

Bahkan ketika Anda mengautentikasi MiniMax melalui jalur OAuth `minimax-portal`,
pencarian web tetap terdaftar sebagai provider id `minimax`; URL dasar penyedia OAuth
hanya digunakan sebagai petunjuk region untuk pemilihan host CN/global.

## Parameter yang didukung

MiniMax Search mendukung:

- `query`
- `count` (OpenClaw memangkas daftar hasil yang dikembalikan sesuai jumlah yang diminta)

Filter khusus penyedia saat ini belum didukung.

## Terkait

- [Gambaran umum Web Search](/tools/web) -- semua penyedia dan deteksi otomatis
- [MiniMax](/id/providers/minimax) -- penyiapan model, gambar, ucapan, dan auth
