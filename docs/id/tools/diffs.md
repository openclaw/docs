---
read_when:
    - Anda ingin agen menampilkan pengeditan kode atau markdown sebagai diff
    - Anda menginginkan URL penampil yang siap canvas atau file diff yang sudah dirender
    - Anda memerlukan artefak diff sementara yang terkontrol dengan default yang aman
summary: Penampil diff baca-saja dan perender file untuk agen (tool plugin opsional)
title: Diffs
x-i18n:
    generated_at: "2026-04-05T14:08:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` adalah tool plugin opsional dengan panduan sistem bawaan singkat dan skill pendamping yang mengubah konten perubahan menjadi artefak diff baca-saja untuk agen.

Tool ini menerima salah satu dari:

- teks `before` dan `after`
- `patch` terpadu

Tool ini dapat mengembalikan:

- URL penampil gateway untuk presentasi canvas
- jalur file hasil render (PNG atau PDF) untuk pengiriman pesan
- kedua output dalam satu pemanggilan

Saat diaktifkan, plugin ini menambahkan panduan penggunaan singkat ke ruang system prompt dan juga mengekspos skill terperinci untuk kasus ketika agen memerlukan instruksi yang lebih lengkap.

## Mulai cepat

1. Aktifkan plugin.
2. Panggil `diffs` dengan `mode: "view"` untuk alur yang mengutamakan canvas.
3. Panggil `diffs` dengan `mode: "file"` untuk alur pengiriman file via chat.
4. Panggil `diffs` dengan `mode: "both"` saat Anda memerlukan kedua artefak.

## Aktifkan plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## Nonaktifkan panduan sistem bawaan

Jika Anda ingin tetap mengaktifkan tool `diffs` tetapi menonaktifkan panduan system prompt bawaannya, setel `plugins.entries.diffs.hooks.allowPromptInjection` ke `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Ini memblokir hook `before_prompt_build` milik plugin diffs sambil tetap menjaga plugin, tool, dan skill pendamping tetap tersedia.

Jika Anda ingin menonaktifkan panduan dan tool sekaligus, nonaktifkan plugin saja.

## Alur kerja agen yang umum

1. Agen memanggil `diffs`.
2. Agen membaca bidang `details`.
3. Agen kemudian:
   - membuka `details.viewerUrl` dengan `canvas present`
   - mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`
   - melakukan keduanya

## Contoh input

Before dan after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referensi input tool

Semua bidang bersifat opsional kecuali jika disebutkan:

- `before` (`string`): teks asli. Wajib bersama `after` saat `patch` dihilangkan.
- `after` (`string`): teks yang diperbarui. Wajib bersama `before` saat `patch` dihilangkan.
- `patch` (`string`): teks diff terpadu. Saling eksklusif dengan `before` dan `after`.
- `path` (`string`): nama file tampilan untuk mode before dan after.
- `lang` (`string`): petunjuk penimpaan bahasa untuk mode before dan after. Nilai yang tidak dikenal kembali ke teks biasa.
- `title` (`string`): penimpaan judul penampil.
- `mode` (`"view" | "file" | "both"`): mode output. Default ke plugin default `defaults.mode`.
  Alias lama: `"image"` berperilaku seperti `"file"` dan masih diterima untuk kompatibilitas mundur.
- `theme` (`"light" | "dark"`): tema penampil. Default ke plugin default `defaults.theme`.
- `layout` (`"unified" | "split"`): tata letak diff. Default ke plugin default `defaults.layout`.
- `expandUnchanged` (`boolean`): perluas bagian yang tidak berubah ketika konteks penuh tersedia. Opsi ini hanya per pemanggilan (bukan kunci default plugin).
- `fileFormat` (`"png" | "pdf"`): format file hasil render. Default ke plugin default `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset kualitas untuk render PNG atau PDF.
- `fileScale` (`number`): penimpaan skala perangkat (`1`-`4`).
- `fileMaxWidth` (`number`): lebar render maksimum dalam piksel CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL artefak dalam detik untuk penampil dan output file mandiri. Default 1800, maksimum 21600.
- `baseUrl` (`string`): penimpaan origin URL penampil. Menimpa plugin `viewerBaseUrl`. Harus `http` atau `https`, tanpa query/hash.

Alias input lama masih diterima untuk kompatibilitas mundur:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validasi dan batas:

- `before` dan `after` masing-masing maksimum 512 KiB.
- `patch` maksimum 2 MiB.
- `path` maksimum 2048 byte.
- `lang` maksimum 128 byte.
- `title` maksimum 1024 byte.
- Batas kompleksitas patch: maksimum 128 file dan 120000 total baris.
- `patch` dan `before` atau `after` secara bersamaan akan ditolak.
- Batas keamanan file hasil render (berlaku untuk PNG dan PDF):
  - `fileQuality: "standard"`: maksimum 8 MP (8.000.000 piksel hasil render).
  - `fileQuality: "hq"`: maksimum 14 MP (14.000.000 piksel hasil render).
  - `fileQuality: "print"`: maksimum 24 MP (24.000.000 piksel hasil render).
  - PDF juga memiliki maksimum 50 halaman.

## Kontrak detail output

Tool ini mengembalikan metadata terstruktur di bawah `details`.

Bidang bersama untuk mode yang membuat penampil:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` jika tersedia)

Bidang file saat PNG atau PDF dirender:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (nilai yang sama dengan `filePath`, untuk kompatibilitas tool message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Alias kompatibilitas juga dikembalikan untuk pemanggil yang sudah ada:

- `format` (nilai yang sama dengan `fileFormat`)
- `imagePath` (nilai yang sama dengan `filePath`)
- `imageBytes` (nilai yang sama dengan `fileBytes`)
- `imageQuality` (nilai yang sama dengan `fileQuality`)
- `imageScale` (nilai yang sama dengan `fileScale`)
- `imageMaxWidth` (nilai yang sama dengan `fileMaxWidth`)

Ringkasan perilaku mode:

- `mode: "view"`: hanya bidang penampil.
- `mode: "file"`: hanya bidang file, tanpa artefak penampil.
- `mode: "both"`: bidang penampil plus bidang file. Jika render file gagal, penampil tetap dikembalikan dengan `fileError` dan alias kompatibilitas `imageError`.

## Bagian yang tidak berubah dan diciutkan

- Penampil dapat menampilkan baris seperti `N unmodified lines`.
- Kontrol perluas pada baris tersebut bersifat kondisional dan tidak dijamin untuk setiap jenis input.
- Kontrol perluas muncul saat diff yang dirender memiliki data konteks yang dapat diperluas, yang umum untuk input before dan after.
- Untuk banyak input patch terpadu, isi konteks yang dihilangkan tidak tersedia dalam hunk patch yang diparsing, sehingga baris tersebut dapat muncul tanpa kontrol perluas. Ini adalah perilaku yang diharapkan.
- `expandUnchanged` hanya berlaku saat konteks yang dapat diperluas memang ada.

## Default plugin

Setel default tingkat plugin di `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Default yang didukung:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Parameter tool yang eksplisit akan menimpa default ini.

Konfigurasi URL penampil persisten:

- `viewerBaseUrl` (`string`, opsional)
  - Fallback milik plugin untuk tautan penampil yang dikembalikan ketika pemanggilan tool tidak meneruskan `baseUrl`.
  - Harus `http` atau `https`, tanpa query/hash.

Contoh:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Konfigurasi keamanan

- `security.allowRemoteViewer` (`boolean`, default `false`)
  - `false`: permintaan non-loopback ke rute penampil ditolak.
  - `true`: penampil jarak jauh diizinkan jika jalur bertoken valid.

Contoh:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Siklus hidup dan penyimpanan artefak

- Artefak disimpan di bawah subfolder temp: `$TMPDIR/openclaw-diffs`.
- Metadata artefak penampil berisi:
  - ID artefak acak (20 karakter heksadesimal)
  - token acak (48 karakter heksadesimal)
  - `createdAt` dan `expiresAt`
  - jalur `viewer.html` yang disimpan
- TTL artefak default adalah 30 menit jika tidak ditentukan.
- TTL penampil maksimum yang diterima adalah 6 jam.
- Pembersihan berjalan secara oportunistik setelah pembuatan artefak.
- Artefak yang kedaluwarsa dihapus.
- Pembersihan fallback menghapus folder basi yang lebih lama dari 24 jam saat metadata tidak ada.

## URL penampil dan perilaku jaringan

Rute penampil:

- `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokumen penampil me-resolve aset tersebut relatif terhadap URL penampil, sehingga prefiks path `baseUrl` opsional juga dipertahankan untuk kedua permintaan aset.

Perilaku pembentukan URL:

- Jika `baseUrl` pada pemanggilan tool diberikan, nilainya digunakan setelah validasi ketat.
- Jika tidak, dan plugin `viewerBaseUrl` dikonfigurasi, maka itu yang digunakan.
- Tanpa salah satu penimpaan tersebut, URL penampil default ke loopback `127.0.0.1`.
- Jika mode bind gateway adalah `custom` dan `gateway.customBindHost` disetel, host tersebut digunakan.

Aturan `baseUrl`:

- Harus `http://` atau `https://`.
- Query dan hash ditolak.
- Origin ditambah path dasar opsional diperbolehkan.

## Model keamanan

Penguatan penampil:

- Hanya loopback secara default.
- Jalur penampil bertoken dengan validasi ID dan token yang ketat.
- CSP respons penampil:
  - `default-src 'none'`
  - skrip dan aset hanya dari self
  - tidak ada `connect-src` keluar
- Pembatasan miss jarak jauh saat akses jarak jauh diaktifkan:
  - 40 kegagalan per 60 detik
  - lockout 60 detik (`429 Too Many Requests`)

Penguatan render file:

- Perutean permintaan browser screenshot secara default menolak semua.
- Hanya aset penampil lokal dari `http://127.0.0.1/plugins/diffs/assets/*` yang diizinkan.
- Permintaan jaringan eksternal diblokir.

## Persyaratan browser untuk mode file

`mode: "file"` dan `mode: "both"` memerlukan browser yang kompatibel dengan Chromium.

Urutan resolusi:

1. `browser.executablePath` di konfigurasi OpenClaw.
2. Variabel lingkungan:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback penemuan perintah/path platform.

Teks kegagalan umum:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Perbaiki dengan menginstal Chrome, Chromium, Edge, atau Brave, atau menyetel salah satu opsi jalur executable di atas.

## Pemecahan masalah

Error validasi input:

- `Provide patch or both before and after text.`
  - Sertakan `before` dan `after`, atau berikan `patch`.
- `Provide either patch or before/after input, not both.`
  - Jangan mencampur mode input.
- `Invalid baseUrl: ...`
  - Gunakan origin `http(s)` dengan path opsional, tanpa query/hash.
- `{field} exceeds maximum size (...)`
  - Kurangi ukuran payload.
- Penolakan patch besar
  - Kurangi jumlah file patch atau total baris.

Masalah aksesibilitas penampil:

- URL penampil secara default mengarah ke `127.0.0.1`.
- Untuk skenario akses jarak jauh, lakukan salah satu dari:
  - setel plugin `viewerBaseUrl`, atau
  - teruskan `baseUrl` per pemanggilan tool, atau
  - gunakan `gateway.bind=custom` dan `gateway.customBindHost`
- Jika `gateway.trustedProxies` mencakup loopback untuk proxy host yang sama (misalnya Tailscale Serve), permintaan penampil loopback mentah tanpa header forwarded client-IP gagal tertutup secara desain.
- Untuk topologi proxy tersebut:
  - utamakan `mode: "file"` atau `mode: "both"` saat Anda hanya memerlukan lampiran, atau
  - aktifkan `security.allowRemoteViewer` secara sengaja dan setel plugin `viewerBaseUrl` atau teruskan `baseUrl` proxy/publik saat Anda memerlukan URL penampil yang dapat dibagikan
- Aktifkan `security.allowRemoteViewer` hanya jika Anda memang menginginkan akses penampil eksternal.

Baris baris-tidak-berubah tidak memiliki tombol perluas:

- Ini dapat terjadi untuk input patch saat patch tidak membawa konteks yang dapat diperluas.
- Ini adalah perilaku yang diharapkan dan tidak menunjukkan kegagalan penampil.

Artefak tidak ditemukan:

- Artefak kedaluwarsa karena TTL.
- Token atau jalur berubah.
- Pembersihan menghapus data basi.

## Panduan operasional

- Utamakan `mode: "view"` untuk peninjauan interaktif lokal di canvas.
- Utamakan `mode: "file"` untuk channel chat keluar yang memerlukan lampiran.
- Biarkan `allowRemoteViewer` tetap nonaktif kecuali deployment Anda memerlukan URL penampil jarak jauh.
- Setel `ttlSeconds` pendek yang eksplisit untuk diff sensitif.
- Hindari mengirim rahasia dalam input diff jika tidak diperlukan.
- Jika channel Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), utamakan output PDF (`fileFormat: "pdf"`).

Mesin render diff:

- Didukung oleh [Diffs](https://diffs.com).

## Dokumen terkait

- [Gambaran umum tools](/tools)
- [Plugin](/tools/plugin)
- [Browser](/tools/browser)
