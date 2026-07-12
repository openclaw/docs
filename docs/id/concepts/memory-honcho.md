---
read_when:
    - Anda menginginkan memori persisten yang berfungsi di berbagai sesi dan saluran
    - Anda menginginkan kemampuan mengingat dan pemodelan pengguna yang didukung AI
summary: Memori lintas sesi yang native AI melalui plugin Honcho
title: Memori Honcho
x-i18n:
    generated_at: "2026-07-12T14:05:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) menambahkan memori berbasis AI ke OpenClaw melalui
plugin eksternal. Honcho menyimpan percakapan secara persisten ke layanan khusus dan membangun
model pengguna serta agen seiring waktu, sehingga agen Anda memperoleh konteks lintas sesi yang
melampaui berkas Markdown ruang kerja.

## Fitur yang disediakan

- **Memori lintas sesi** - percakapan tetap tersimpan setelah setiap giliran, sehingga
  konteks terbawa melintasi pengaturan ulang sesi, Compaction, dan perpindahan saluran.
- **Pemodelan pengguna** - Honcho memelihara profil untuk setiap pengguna (preferensi,
  fakta, gaya komunikasi) dan untuk agen (kepribadian, perilaku yang
  dipelajari).
- **Pencarian semantik** - mencari pengamatan dari percakapan sebelumnya, bukan
  hanya sesi saat ini.
- **Kesadaran multiagen** - agen induk secara otomatis melacak
  subagen yang dibuat, dengan agen induk ditambahkan sebagai pengamat dalam sesi anak.

## Alat yang tersedia

Honcho mendaftarkan alat yang dapat digunakan agen selama percakapan:

**Pengambilan data (cepat, tanpa panggilan LLM):**

| Alat                        | Fungsinya                                                    |
| --------------------------- | ------------------------------------------------------------ |
| `honcho_context`            | Representasi lengkap pengguna di seluruh sesi                |
| `honcho_search_conclusions` | Pencarian semantik atas kesimpulan yang tersimpan            |
| `honcho_search_messages`    | Menemukan pesan di seluruh sesi (filter menurut pengirim, tanggal) |
| `honcho_session`            | Riwayat dan ringkasan sesi saat ini                          |

**Tanya jawab (didukung LLM):**

| Alat         | Fungsinya                                                               |
| ------------ | ----------------------------------------------------------------------- |
| `honcho_ask` | Bertanya tentang pengguna. `depth='quick'` untuk fakta, `'thorough'` untuk sintesis |

## Memulai

Instal plugin dan jalankan penyiapan:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Perintah penyiapan meminta kredensial API Anda, menulis konfigurasi, dan
secara opsional memigrasikan berkas memori ruang kerja yang sudah ada.

<Info>
Honcho dapat dijalankan sepenuhnya secara lokal (dihosting sendiri) atau melalui API terkelola di
`api.honcho.dev`. Tidak diperlukan dependensi eksternal untuk opsi yang dihosting
sendiri.
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

Untuk instans yang dihosting sendiri, arahkan `baseUrl` ke server lokal Anda (misalnya
`http://localhost:8000`) dan hilangkan kunci API.

## Memigrasikan memori yang sudah ada

Jika Anda memiliki berkas memori ruang kerja yang sudah ada (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` akan mendeteksinya dan
menawarkan untuk memigrasikannya.

<Info>
Migrasi tidak bersifat destruktif - berkas diunggah ke Honcho. Berkas asli
tidak pernah dihapus atau dipindahkan.
</Info>

## Cara kerjanya

Setelah setiap giliran AI, percakapan disimpan secara persisten ke Honcho. Pesan pengguna dan
agen sama-sama diamati, sehingga Honcho dapat membangun dan menyempurnakan modelnya seiring
waktu.

Selama percakapan, alat Honcho mengueri layanan melalui hook plugin
`before_prompt_build` milik OpenClaw, dengan menyuntikkan konteks yang relevan sebelum model
melihat prompt.

## Honcho dibandingkan dengan memori bawaan

|                   | Bawaan / QMD                  | Honcho                                |
| ----------------- | ----------------------------- | ------------------------------------- |
| **Penyimpanan**   | Berkas Markdown ruang kerja   | Layanan khusus (lokal atau dihosting) |
| **Lintas sesi**   | Melalui berkas memori         | Otomatis, bawaan                      |
| **Pemodelan pengguna** | Manual (tulis ke MEMORY.md) | Profil otomatis                    |
| **Pencarian**     | Vektor + kata kunci (hibrida) | Semantik atas pengamatan              |
| **Multiagen**     | Tidak dilacak                 | Kesadaran induk/anak                  |
| **Dependensi**    | Tidak ada (bawaan) atau biner QMD | Instalasi plugin                  |

Honcho dan sistem memori bawaan dapat bekerja bersama. Saat QMD
dikonfigurasi, alat tambahan tersedia untuk mencari berkas Markdown lokal
bersama memori lintas sesi Honcho.

## Perintah CLI

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Bacaan lebih lanjut

- [Kode sumber plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Dokumentasi Honcho](https://docs.honcho.dev)
- [Panduan integrasi Honcho dengan OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Mesin memori QMD](/id/concepts/memory-qmd)
- [Mesin Konteks](/id/concepts/context-engine)
