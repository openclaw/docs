---
read_when:
    - Anda ingin agen menampilkan edit kode atau markdown sebagai diff
    - Anda menginginkan URL penampil yang siap untuk canvas atau file diff yang sudah dirender
    - Anda memerlukan artefak diff sementara yang terkontrol dengan default yang aman
summary: Penampil diff read-only dan perender file untuk agen (tool Plugin opsional)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T09:30:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` adalah tool Plugin opsional dengan panduan sistem bawaan yang singkat dan skill pendamping yang mengubah konten perubahan menjadi artefak diff read-only untuk agen.

Tool ini menerima salah satu dari:

- teks `before` dan `after`
- `patch` terpadu

Tool ini dapat mengembalikan:

- URL penampil gateway untuk presentasi canvas
- path file yang telah dirender (PNG atau PDF) untuk pengiriman pesan
- kedua output dalam satu panggilan

Ketika diaktifkan, Plugin menambahkan panduan penggunaan ringkas ke ruang system-prompt dan juga menampilkan skill terperinci untuk kasus ketika agen memerlukan instruksi yang lebih lengkap.

## Mulai cepat

1. Aktifkan Plugin.
2. Panggil `diffs` dengan `mode: "view"` untuk alur yang mengutamakan canvas.
3. Panggil `diffs` dengan `mode: "file"` untuk alur pengiriman file melalui obrolan.
4. Panggil `diffs` dengan `mode: "both"` ketika Anda memerlukan kedua artefak.

## Aktifkan Plugin

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

Jika Anda ingin tetap mengaktifkan tool `diffs` tetapi menonaktifkan panduan system-prompt bawaannya, setel `plugins.entries.diffs.hooks.allowPromptInjection` ke `false`:

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

Ini memblokir hook `before_prompt_build` milik Plugin diffs sambil tetap menjaga Plugin, tool, dan skill pendamping tetap tersedia.

Jika Anda ingin menonaktifkan panduan dan tool sekaligus, nonaktifkan Plugin saja.

## Alur kerja agen yang umum

1. Agen memanggil `diffs`.
2. Agen membaca field `details`.
3. Agen kemudian:
   - membuka `details.viewerUrl` dengan `canvas present`
   - mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`
   - atau melakukan keduanya

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

Semua field opsional kecuali dinyatakan lain:

- `before` (`string`): teks asli. Wajib bersama `after` ketika `patch` tidak diberikan.
- `after` (`string`): teks yang diperbarui. Wajib bersama `before` ketika `patch` tidak diberikan.
- `patch` (`string`): teks diff terpadu. Saling eksklusif dengan `before` dan `after`.
- `path` (`string`): nama file tampilan untuk mode before dan after.
- `lang` (`string`): petunjuk override bahasa untuk mode before dan after. Nilai yang tidak dikenal fallback ke plain text.
- `title` (`string`): override judul penampil.
- `mode` (`"view" | "file" | "both"`): mode output. Default ke Plugin bawaan `defaults.mode`.
  Alias deprecated: `"image"` berperilaku seperti `"file"` dan masih diterima demi kompatibilitas mundur.
- `theme` (`"light" | "dark"`): tema penampil. Default ke Plugin bawaan `defaults.theme`.
- `layout` (`"unified" | "split"`): tata letak diff. Default ke Plugin bawaan `defaults.layout`.
- `expandUnchanged` (`boolean`): perluas bagian yang tidak berubah ketika konteks penuh tersedia. Opsi per panggilan saja (bukan key default Plugin).
- `fileFormat` (`"png" | "pdf"`): format file yang dirender. Default ke Plugin bawaan `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset kualitas untuk perenderan PNG atau PDF.
- `fileScale` (`number`): override skala perangkat (`1`-`4`).
- `fileMaxWidth` (`number`): lebar render maks dalam piksel CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL artefak dalam detik untuk penampil dan output file mandiri. Default 1800, maks 21600.
- `baseUrl` (`string`): override origin URL penampil. Menimpa Plugin `viewerBaseUrl`. Harus `http` atau `https`, tanpa query/hash.

Alias input legacy masih diterima demi kompatibilitas mundur:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validasi dan batas:

- `before` dan `after` masing-masing maks 512 KiB.
- `patch` maks 2 MiB.
- `path` maks 2048 byte.
- `lang` maks 128 byte.
- `title` maks 1024 byte.
- Batas kompleksitas patch: maks 128 file dan 120000 total baris.
- `patch` dan `before` atau `after` secara bersamaan akan ditolak.
- Batas keamanan file yang dirender (berlaku untuk PNG dan PDF):
  - `fileQuality: "standard"`: maks 8 MP (8.000.000 piksel render).
  - `fileQuality: "hq"`: maks 14 MP (14.000.000 piksel render).
  - `fileQuality: "print"`: maks 24 MP (24.000.000 piksel render).
  - PDF juga memiliki maks 50 halaman.

## Kontrak output details

Tool mengembalikan metadata terstruktur di bawah `details`.

Field bersama untuk mode yang membuat penampil:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` jika tersedia)

Field file ketika PNG atau PDF dirender:

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

- `mode: "view"`: hanya field penampil.
- `mode: "file"`: hanya field file, tanpa artefak penampil.
- `mode: "both"`: field penampil plus field file. Jika rendering file gagal, penampil tetap dikembalikan dengan `fileError` dan alias kompatibilitas `imageError`.

## Bagian yang tidak berubah dan diciutkan

- Penampil dapat menampilkan baris seperti `N unmodified lines`.
- Kontrol expand pada baris tersebut bersifat kondisional dan tidak dijamin untuk setiap jenis input.
- Kontrol expand muncul ketika diff yang dirender memiliki data konteks yang dapat diperluas, yang umum untuk input before dan after.
- Untuk banyak input unified patch, isi konteks yang dihilangkan tidak tersedia dalam hunk patch yang diparsing, sehingga baris dapat muncul tanpa kontrol expand. Ini adalah perilaku yang diharapkan.
- `expandUnchanged` hanya berlaku ketika konteks yang dapat diperluas memang ada.

## Default Plugin

Setel default tingkat Plugin di `~/.openclaw/openclaw.json`:

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

Parameter tool yang eksplisit menimpa default ini.

Konfigurasi URL penampil persisten:

- `viewerBaseUrl` (`string`, opsional)
  - Fallback milik Plugin untuk tautan penampil yang dikembalikan ketika panggilan tool tidak meneruskan `baseUrl`.
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
  - `false`: permintaan non-loopback ke route penampil ditolak.
  - `true`: penampil remote diizinkan jika path bertoken valid.

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
  - ID artefak acak (20 karakter hex)
  - token acak (48 karakter hex)
  - `createdAt` dan `expiresAt`
  - path `viewer.html` yang disimpan
- TTL artefak default adalah 30 menit ketika tidak ditentukan.
- TTL penampil maksimum yang diterima adalah 6 jam.
- Pembersihan berjalan secara oportunistik setelah pembuatan artefak.
- Artefak yang kedaluwarsa dihapus.
- Pembersihan fallback menghapus folder usang yang lebih tua dari 24 jam ketika metadata tidak ada.

## URL penampil dan perilaku jaringan

Route penampil:

- `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokumen penampil menyelesaikan aset tersebut relatif terhadap URL penampil, sehingga prefix path `baseUrl` opsional tetap dipertahankan untuk permintaan aset juga.

Perilaku konstruksi URL:

- Jika `baseUrl` pada panggilan tool diberikan, nilainya digunakan setelah validasi ketat.
- Jika tidak, bila Plugin `viewerBaseUrl` dikonfigurasi, nilainya digunakan.
- Tanpa override apa pun, URL penampil default ke loopback `127.0.0.1`.
- Jika mode bind gateway adalah `custom` dan `gateway.customBindHost` diatur, host tersebut digunakan.

Aturan `baseUrl`:

- Harus `http://` atau `https://`.
- Query dan hash ditolak.
- Origin plus path dasar opsional diizinkan.

## Model keamanan

Penguatan penampil:

- Hanya-loopback secara default.
- Path penampil bertoken dengan validasi ID dan token yang ketat.
- CSP respons penampil:
  - `default-src 'none'`
  - script dan aset hanya dari self
  - tanpa `connect-src` keluar
- Throttling miss remote saat akses remote diaktifkan:
  - 40 kegagalan per 60 detik
  - lockout 60 detik (`429 Too Many Requests`)

Penguatan rendering file:

- Routing permintaan browser screenshot bersifat deny-by-default.
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
3. Fallback penemuan perintah/path per platform.

Teks kegagalan umum:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Perbaiki dengan menginstal Chrome, Chromium, Edge, atau Brave, atau mengatur salah satu opsi path executable di atas.

## Pemecahan masalah

Error validasi input:

- `Provide patch or both before and after text.`
  - Sertakan `before` dan `after`, atau berikan `patch`.
- `Provide either patch or before/after input, not both.`
  - Jangan campur mode input.
- `Invalid baseUrl: ...`
  - Gunakan origin `http(s)` dengan path opsional, tanpa query/hash.
- `{field} exceeds maximum size (...)`
  - Kurangi ukuran payload.
- Penolakan patch besar
  - Kurangi jumlah file patch atau total baris.

Masalah aksesibilitas penampil:

- URL penampil default diselesaikan ke `127.0.0.1`.
- Untuk skenario akses remote, lakukan salah satu:
  - setel Plugin `viewerBaseUrl`, atau
  - teruskan `baseUrl` per panggilan tool, atau
  - gunakan `gateway.bind=custom` dan `gateway.customBindHost`
- Jika `gateway.trustedProxies` menyertakan loopback untuk proxy host-yang-sama (misalnya Tailscale Serve), permintaan penampil loopback mentah tanpa header client-IP yang diteruskan akan gagal tertutup sesuai desain.
- Untuk topologi proxy tersebut:
  - utamakan `mode: "file"` atau `mode: "both"` ketika Anda hanya memerlukan lampiran, atau
  - aktifkan dengan sengaja `security.allowRemoteViewer` dan setel Plugin `viewerBaseUrl` atau teruskan `baseUrl` proxy/publik ketika Anda memerlukan URL penampil yang dapat dibagikan
- Aktifkan `security.allowRemoteViewer` hanya ketika Anda memang menginginkan akses penampil eksternal.

Baris unmodified-lines tidak memiliki tombol expand:

- Ini dapat terjadi untuk input patch ketika patch tidak membawa konteks yang dapat diperluas.
- Ini adalah perilaku yang diharapkan dan tidak menunjukkan kegagalan penampil.

Artefak tidak ditemukan:

- Artefak kedaluwarsa karena TTL.
- Token atau path berubah.
- Pembersihan menghapus data usang.

## Panduan operasional

- Utamakan `mode: "view"` untuk tinjauan interaktif lokal di canvas.
- Utamakan `mode: "file"` untuk kanal obrolan keluar yang memerlukan lampiran.
- Biarkan `allowRemoteViewer` nonaktif kecuali deployment Anda memerlukan URL penampil remote.
- Setel `ttlSeconds` pendek yang eksplisit untuk diff yang sensitif.
- Hindari mengirim secret dalam input diff jika tidak diperlukan.
- Jika kanal Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), utamakan output PDF (`fileFormat: "pdf"`).

Mesin rendering diff:

- Didukung oleh [Diffs](https://diffs.com).

## Dokumentasi terkait

- [Ikhtisar tools](/id/tools)
- [Plugins](/id/tools/plugin)
- [Browser](/id/tools/browser)
