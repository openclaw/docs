---
read_when:
    - Anda ingin menggunakan MiniMax untuk `web_search`
    - Anda memerlukan kunci MiniMax Token Plan atau token OAuth
    - Anda memerlukan panduan host pencarian MiniMax CN/global
summary: Pencarian MiniMax melalui API pencarian Token Plan
title: Pencarian MiniMax
x-i18n:
    generated_at: "2026-07-12T14:42:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw mendukung MiniMax sebagai penyedia `web_search` melalui API pencarian
Token Plan MiniMax. API ini mengembalikan hasil pencarian terstruktur dengan judul, URL,
cuplikan, dan kueri terkait.

## Mendapatkan kredensial Token Plan

<Steps>
  <Step title="Buat kunci">
    Buat atau salin kunci Token Plan MiniMax dari
    [Platform MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Penyiapan OAuth dapat menggunakan kembali `MINIMAX_OAUTH_TOKEN`.
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
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` harus mengacu pada kredensial
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
            apiKey: "sk-cp-...", // opsional jika variabel lingkungan Token Plan MiniMax telah ditetapkan
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
Untuk instalasi Gateway, masukkan variabel tersebut ke `~/.openclaw/.env`.

## Pemilihan wilayah

Pencarian MiniMax menggunakan endpoint berikut:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- Tiongkok: `https://api.minimaxi.com/v1/coding_plan/search`

Jika `plugins.entries.minimax.config.webSearch.region` belum ditetapkan, OpenClaw menentukan
wilayah dengan urutan berikut:

1. `tools.web.search.minimax.region` / `webSearch.region` milik plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Artinya, orientasi awal untuk Tiongkok atau `MINIMAX_API_HOST=https://api.minimaxi.com/...`
juga secara otomatis mempertahankan Pencarian MiniMax pada host Tiongkok.

Meskipun Anda mengautentikasi MiniMax melalui jalur OAuth `minimax-portal`,
pencarian web tetap terdaftar dengan ID penyedia `minimax`; URL dasar penyedia OAuth
digunakan sebagai petunjuk wilayah untuk memilih host Tiongkok/global, dan `MINIMAX_OAUTH_TOKEN`
dapat memenuhi kredensial bearer Pencarian MiniMax.

## Parameter yang didukung

| Parameter | Jenis   | Batasan           | Deskripsi                                                                     |
| --------- | ------- | ----------------- | ----------------------------------------------------------------------------- |
| `query`   | string  | wajib             | String kueri pencarian.                                                       |
| `count`   | integer | 1-10, bawaan 5    | Jumlah hasil yang akan dikembalikan. OpenClaw memangkas daftar hasil ke ukuran ini. |

Filter khusus penyedia saat ini belum didukung.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [MiniMax](/id/providers/minimax) -- penyiapan model, gambar, ucapan, dan autentikasi
