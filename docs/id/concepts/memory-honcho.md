---
read_when:
    - Anda menginginkan memori persisten yang bekerja di seluruh sesi dan channel
    - Anda menginginkan recall bertenaga AI dan pemodelan pengguna
summary: Memori lintas sesi native-AI melalui Plugin Honcho
title: Memori Honcho
x-i18n:
    generated_at: "2026-04-24T09:04:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
---

[Honcho](https://honcho.dev) menambahkan memori native-AI ke OpenClaw. Plugin ini mempertahankan
percakapan ke layanan khusus dan membangun model pengguna serta agen dari waktu ke waktu,
memberi agen Anda konteks lintas sesi yang melampaui file Markdown workspace.

## Apa yang disediakannya

- **Memori lintas sesi** -- percakapan dipertahankan setelah setiap giliran, sehingga
  konteks terbawa melintasi reset sesi, Compaction, dan perpindahan channel.
- **Pemodelan pengguna** -- Honcho mempertahankan profil untuk setiap pengguna (preferensi,
  fakta, gaya komunikasi) dan untuk agen (kepribadian, perilaku yang dipelajari).
- **Pencarian semantik** -- pencarian atas observasi dari percakapan masa lalu, bukan
  hanya sesi saat ini.
- **Kesadaran multi-agen** -- agen induk secara otomatis melacak
  sub-agen yang di-spawn, dengan induk ditambahkan sebagai observer di sesi anak.

## Tool yang tersedia

Honcho mendaftarkan tool yang dapat digunakan agen selama percakapan:

**Pengambilan data (cepat, tanpa panggilan LLM):**

| Tool                        | Fungsinya                                             |
| --------------------------- | ----------------------------------------------------- |
| `honcho_context`            | Representasi lengkap pengguna di seluruh sesi         |
| `honcho_search_conclusions` | Pencarian semantik atas conclusion yang disimpan      |
| `honcho_search_messages`    | Temukan pesan di seluruh sesi (filter menurut pengirim, tanggal) |
| `honcho_session`            | Riwayat dan ringkasan sesi saat ini                   |

**Tanya jawab (didukung LLM):**

| Tool         | Fungsinya                                                                |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Ajukan pertanyaan tentang pengguna. `depth='quick'` untuk fakta, `'thorough'` untuk sintesis |

## Memulai

Instal Plugin dan jalankan setup:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Perintah setup meminta kredensial API Anda, menulis konfigurasi, dan
secara opsional memigrasikan file memori workspace yang ada.

<Info>
Honcho dapat berjalan sepenuhnya secara lokal (self-hosted) atau melalui API terkelola di
`api.honcho.dev`. Tidak diperlukan dependensi eksternal untuk opsi self-hosted.
</Info>

## Konfigurasi

Pengaturan berada di bawah `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // hilangkan untuk self-hosted
          workspaceId: "openclaw", // isolasi memori
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

Jika Anda memiliki file memori workspace yang sudah ada (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` akan mendeteksinya dan
menawarkan untuk memigrasikannya.

<Info>
Migrasi tidak merusak -- file diunggah ke Honcho. File asli
tidak pernah dihapus atau dipindahkan.
</Info>

## Cara kerjanya

Setelah setiap giliran AI, percakapan dipertahankan ke Honcho. Pesan pengguna dan
agen sama-sama diamati, sehingga Honcho dapat membangun dan menyempurnakan modelnya seiring
waktu.

Selama percakapan, tool Honcho mengkueri layanan pada fase `before_prompt_build`,
menyuntikkan konteks yang relevan sebelum model melihat prompt. Ini memastikan
batas giliran yang akurat dan recall yang relevan.

## Honcho vs memori bawaan

|                   | Bawaan / QMD                  | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Penyimpanan**   | File Markdown workspace       | Layanan khusus (lokal atau hosted)  |
| **Lintas sesi**   | Melalui file memori           | Otomatis, bawaan                    |
| **Pemodelan pengguna** | Manual (tulis ke MEMORY.md) | Profil otomatis                   |
| **Pencarian**     | Vektor + kata kunci (hibrida) | Semantik atas observasi             |
| **Multi-agen**    | Tidak dilacak                 | Kesadaran induk/anak                |
| **Dependensi**    | Tidak ada (bawaan) atau biner QMD | Instalasi Plugin                |

Honcho dan sistem memori bawaan dapat bekerja bersama. Saat QMD dikonfigurasi,
tool tambahan menjadi tersedia untuk mencari file Markdown lokal bersama
memori lintas sesi Honcho.

## Perintah CLI

```bash
openclaw honcho setup                        # Konfigurasikan API key dan migrasikan file
openclaw honcho status                       # Periksa status koneksi
openclaw honcho ask <question>               # Kueri Honcho tentang pengguna
openclaw honcho search <query> [-k N] [-d D] # Pencarian semantik atas memori
```

## Bacaan lebih lanjut

- [Kode sumber Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Dokumentasi Honcho](https://docs.honcho.dev)
- [Panduan integrasi Honcho OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/id/concepts/memory) -- ikhtisar memori OpenClaw
- [Context Engines](/id/concepts/context-engine) -- cara kerja context engine Plugin

## Terkait

- [Ikhtisar Memory](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Mesin memori QMD](/id/concepts/memory-qmd)
