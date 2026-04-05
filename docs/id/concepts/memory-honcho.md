---
read_when:
    - Anda menginginkan memori persisten yang berfungsi lintas sesi dan channel
    - Anda menginginkan recall bertenaga AI dan pemodelan pengguna
summary: Memori lintas sesi native-AI melalui plugin Honcho
title: Memori Honcho
x-i18n:
    generated_at: "2026-04-05T13:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Memori Honcho

[Honcho](https://honcho.dev) menambahkan memori native-AI ke OpenClaw. Plugin ini menyimpan
percakapan ke layanan khusus dan membangun model pengguna dan agen seiring waktu,
memberikan agen Anda konteks lintas sesi yang melampaui file Markdown workspace.

## Yang disediakan

- **Memori lintas sesi** -- percakapan disimpan setelah setiap giliran, sehingga
  konteks terbawa lintas reset sesi, pemadatan, dan perpindahan channel.
- **Pemodelan pengguna** -- Honcho memelihara profil untuk setiap pengguna (preferensi,
  fakta, gaya komunikasi) dan untuk agen (kepribadian, perilaku yang dipelajari).
- **Pencarian semantik** -- pencarian atas observasi dari percakapan sebelumnya, bukan
  hanya sesi saat ini.
- **Kesadaran multi-agen** -- agen induk secara otomatis melacak
  subagen yang dibuat, dengan induk ditambahkan sebagai pengamat dalam sesi anak.

## Tool yang tersedia

Honcho mendaftarkan tool yang dapat digunakan agen selama percakapan:

**Pengambilan data (cepat, tanpa panggilan LLM):**

| Tool                        | Apa yang dilakukan                                |
| --------------------------- | ------------------------------------------------- |
| `honcho_context`            | Representasi lengkap pengguna lintas sesi         |
| `honcho_search_conclusions` | Pencarian semantik atas kesimpulan yang disimpan  |
| `honcho_search_messages`    | Menemukan pesan lintas sesi (filter menurut pengirim, tanggal) |
| `honcho_session`            | Riwayat dan ringkasan sesi saat ini               |

**Tanya jawab (didukung LLM):**

| Tool         | Apa yang dilakukan                                                        |
| ------------ | ------------------------------------------------------------------------- |
| `honcho_ask` | Ajukan pertanyaan tentang pengguna. `depth='quick'` untuk fakta, `'thorough'` untuk sintesis |

## Memulai

Instal plugin dan jalankan penyiapan:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Perintah setup meminta kredensial API Anda, menulis config, dan
secara opsional memigrasikan file memori workspace yang ada.

<Info>
Honcho dapat berjalan sepenuhnya secara lokal (self-hosted) atau melalui API terkelola di
`api.honcho.dev`. Tidak diperlukan dependensi eksternal untuk opsi
self-hosted.
</Info>

## Konfigurasi

Pengaturan berada di bawah `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Untuk instance self-hosted, arahkan `baseUrl` ke server lokal Anda (misalnya
`http://localhost:8000`) dan hilangkan API key.

## Memigrasikan memori yang ada

Jika Anda memiliki file memori workspace yang ada (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` akan mendeteksi dan
menawarkan untuk memigrasikannya.

<Info>
Migrasi tidak merusak -- file diunggah ke Honcho. File asli
tidak pernah dihapus atau dipindahkan.
</Info>

## Cara kerjanya

Setelah setiap giliran AI, percakapan disimpan ke Honcho. Baik pesan pengguna maupun
pesan agen diamati, memungkinkan Honcho membangun dan menyempurnakan modelnya seiring
waktu.

Selama percakapan, tool Honcho mengueri layanan pada fase `before_prompt_build`,
menyisipkan konteks yang relevan sebelum model melihat prompt. Ini memastikan
batas giliran yang akurat dan recall yang relevan.

## Honcho vs memori bawaan

|                   | Bawaan / QMD                 | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Penyimpanan**   | File Markdown workspace      | Layanan khusus (lokal atau hosted)  |
| **Lintas sesi**   | Melalui file memori          | Otomatis, bawaan                    |
| **Pemodelan pengguna** | Manual (tulis ke MEMORY.md)  | Profil otomatis                     |
| **Pencarian**     | Vector + kata kunci (hibrida) | Semantik atas observasi             |
| **Multi-agen**    | Tidak dilacak                | Kesadaran induk/anak                |
| **Dependensi**    | Tidak ada (bawaan) atau biner QMD | Instalasi plugin                |

Honcho dan sistem memori bawaan dapat bekerja bersama. Saat QMD dikonfigurasi,
tool tambahan menjadi tersedia untuk mencari file Markdown lokal di samping
memori lintas sesi Honcho.

## Perintah CLI

```bash
openclaw honcho setup                        # Konfigurasikan API key dan migrasikan file
openclaw honcho status                       # Periksa status koneksi
openclaw honcho ask <question>               # Kueri Honcho tentang pengguna
openclaw honcho search <query> [-k N] [-d D] # Pencarian semantik atas memori
```

## Bacaan lanjutan

- [Kode sumber plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Dokumentasi Honcho](https://docs.honcho.dev)
- [Panduan integrasi Honcho OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memori](/concepts/memory) -- ikhtisar memori OpenClaw
- [Mesin Konteks](/concepts/context-engine) -- cara kerja mesin konteks plugin
