---
read_when:
    - Anda ingin menggunakan Kimi untuk `web_search`
    - Anda memerlukan KIMI_API_KEY atau MOONSHOT_API_KEY
summary: Pencarian web Kimi melalui pencarian web Moonshot
title: Pencarian Kimi
x-i18n:
    generated_at: "2026-07-12T14:46:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi adalah penyedia `web_search` yang didukung oleh pencarian web native Moonshot. Moonshot
menyintesis satu jawaban dengan kutipan sebaris, mirip dengan penyedia respons
berbasis grounding milik Gemini dan Grok, alih-alih mengembalikan daftar hasil berperingkat.

## Penyiapan

<Steps>
  <Step title="Buat kunci">
    Dapatkan kunci API dari [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Simpan kunci">
    Tetapkan `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di lingkungan Gateway (untuk
    instalasi Gateway, tambahkan ke `~/.openclaw/.env`), atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Memilih **Kimi** selama `openclaw onboard` atau `openclaw configure --section web`
juga akan meminta:

- wilayah API Moonshot: `https://api.moonshot.ai/v1` atau `https://api.moonshot.cn/v1`
- model pencarian web (nilai defaultnya `kimi-k2.6`)

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opsional jika KIMI_API_KEY atau MOONSHOT_API_KEY ditetapkan
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` dideteksi secara otomatis dari kunci API yang tersedia jika dihilangkan;
tetapkan secara eksplisit ke `kimi` jika beberapa kredensial pencarian dikonfigurasi.

Bentuk tercakup yang setara di bawah `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
juga dapat digunakan; kedua bentuk digabungkan ke dalam konfigurasi terselesaikan yang sama.

Nilai default: `baseUrl` menggunakan `https://api.moonshot.ai/v1` secara default jika dihilangkan, sedangkan `model`
menggunakan `kimi-k2.6` secara default.

Jika lalu lintas percakapan menggunakan host Tiongkok (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `web_search` Kimi akan otomatis menggunakan kembali host tersebut
ketika `baseUrl` miliknya tidak ditetapkan, sehingga kunci `.cn` tidak secara tidak sengaja mengakses
endpoint internasional (yang mengembalikan HTTP 401 untuk kunci tersebut). Tetapkan
`baseUrl` Kimi secara eksplisit untuk mengganti pewarisan ini.

## Persyaratan grounding

OpenClaw hanya mengembalikan hasil `web_search` Kimi setelah respons Moonshot
menyertakan bukti grounding pencarian web native, seperti pemutaran ulang pemanggilan alat
`$web_search`, `search_results`, atau URL kutipan. Jika Kimi menjawab langsung tanpa
grounding (misalnya, "Saya tidak dapat menjelajahi internet"), OpenClaw akan mengembalikan
galat `kimi_web_search_ungrounded`, alih-alih memperlakukan teks tersebut sebagai hasil
pencarian. Coba ulang kueri, beralihlah ke penyedia terstruktur seperti Brave, atau gunakan
`web_fetch` / alat peramban jika Anda sudah memiliki URL tujuan.

## Parameter alat

| Parameter                                                       | Didukung                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Ya                                                                                                                             |
| `count`                                                         | Diterima untuk kompatibilitas lintas penyedia, tetapi diabaikan: Kimi selalu mengembalikan satu jawaban tersintesis, bukan daftar N hasil |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Tidak                                                                                                                          |

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) - semua penyedia dan deteksi otomatis
- [Moonshot AI](/id/providers/moonshot) - dokumentasi model Moonshot + penyedia Kimi Coding
- [Pencarian Gemini](/id/tools/gemini-search) - jawaban tersintesis AI melalui grounding Google
- [Pencarian Grok](/id/tools/grok-search) - jawaban tersintesis AI melalui grounding xAI
