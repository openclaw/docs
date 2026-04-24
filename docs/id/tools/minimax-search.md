---
read_when:
    - Anda ingin menggunakan MiniMax untuk web_search
    - Anda memerlukan MiniMax Coding Plan key
    - Anda menginginkan panduan host pencarian MiniMax CN/global
summary: MiniMax Search melalui API pencarian Coding Plan
title: MiniMax search
x-i18n:
    generated_at: "2026-04-24T09:32:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw mendukung MiniMax sebagai provider `web_search` melalui API pencarian MiniMax
Coding Plan. Provider ini mengembalikan hasil pencarian terstruktur dengan judul, URL,
snippet, dan kueri terkait.

## Dapatkan Coding Plan key

<Steps>
  <Step title="Buat key">
    Buat atau salin MiniMax Coding Plan key dari
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Simpan key">
    Setel `MINIMAX_CODE_PLAN_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw juga menerima `MINIMAX_CODING_API_KEY` sebagai alias env. `MINIMAX_API_KEY`
masih dibaca sebagai fallback kompatibilitas ketika nilainya memang sudah menunjuk ke token coding-plan.

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opsional jika MINIMAX_CODE_PLAN_KEY diatur
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

**Alternatif environment:** setel `MINIMAX_CODE_PLAN_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Pemilihan region

MiniMax Search menggunakan endpoint berikut:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jika `plugins.entries.minimax.config.webSearch.region` tidak diatur, OpenClaw menyelesaikan
region dalam urutan ini:

1. `tools.web.search.minimax.region` / `webSearch.region` milik plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Artinya onboarding CN atau `MINIMAX_API_HOST=https://api.minimaxi.com/...`
secara otomatis juga menjaga MiniMax Search tetap berada di host CN.

Bahkan ketika Anda mengautentikasi MiniMax melalui jalur OAuth `minimax-portal`,
web search tetap didaftarkan sebagai provider id `minimax`; base URL provider OAuth
hanya digunakan sebagai petunjuk region untuk pemilihan host CN/global.

## Parameter yang didukung

MiniMax Search mendukung:

- `query`
- `count` (OpenClaw memangkas daftar hasil yang dikembalikan sesuai count yang diminta)

Filter spesifik provider saat ini belum didukung.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan auto-detection
- [MiniMax](/id/providers/minimax) -- penyiapan model, gambar, speech, dan auth
