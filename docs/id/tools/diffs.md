---
read_when:
    - Anda ingin agen menampilkan perubahan kode atau Markdown sebagai diff
    - Anda menginginkan URL penampil yang siap untuk kanvas atau file diff yang dirender
    - Anda memerlukan artefak diff sementara yang terkontrol dengan default yang aman
sidebarTitle: Diffs
summary: Penampil diff hanya-baca dan perender file untuk agen (alat Plugin opsional)
title: Perbedaan
x-i18n:
    generated_at: "2026-05-10T19:55:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` adalah alat Plugin opsional dengan panduan sistem bawaan yang ringkas dan skill pendamping yang mengubah konten perubahan menjadi artefak diff baca-saja untuk agen.

Ini menerima salah satu dari:

- teks `before` dan `after`
- `patch` terpadu

Ini dapat mengembalikan:

- URL penampil gateway untuk presentasi canvas
- jalur file yang dirender (PNG atau PDF) untuk pengiriman pesan
- kedua keluaran dalam satu panggilan

Saat diaktifkan, Plugin menambahkan panduan penggunaan ringkas ke ruang prompt sistem dan juga mengekspos skill terperinci untuk kasus ketika agen membutuhkan instruksi yang lebih lengkap.

## Mulai cepat

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  </Step>
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Alur yang mengutamakan canvas: agen memanggil `diffs` dengan `mode: "view"` dan membuka `details.viewerUrl` dengan `canvas present`.
      </Tab>
      <Tab title="file">
        Pengiriman file chat: agen memanggil `diffs` dengan `mode: "file"` dan mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`.
      </Tab>
      <Tab title="both">
        Gabungan: agen memanggil `diffs` dengan `mode: "both"` untuk mendapatkan kedua artefak dalam satu panggilan.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Nonaktifkan panduan sistem bawaan

Jika Anda ingin tetap mengaktifkan alat `diffs` tetapi menonaktifkan panduan prompt sistem bawaannya, atur `plugins.entries.diffs.hooks.allowPromptInjection` ke `false`:

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

Ini memblokir hook `before_prompt_build` milik Plugin diffs sambil tetap menyediakan Plugin, alat, dan skill pendamping.

Jika Anda ingin menonaktifkan panduan sekaligus alatnya, nonaktifkan Plugin sebagai gantinya.

## Alur kerja agen umum

<Steps>
  <Step title="Call diffs">
    Agen memanggil alat `diffs` dengan input.
  </Step>
  <Step title="Read details">
    Agen membaca field `details` dari respons.
  </Step>
  <Step title="Present">
    Agen membuka `details.viewerUrl` dengan `canvas present`, mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`, atau melakukan keduanya.
  </Step>
</Steps>

## Contoh input

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Referensi input alat

Semua field bersifat opsional kecuali disebutkan.

<ParamField path="before" type="string">
  Teks asli. Wajib bersama `after` saat `patch` dihilangkan.
</ParamField>
<ParamField path="after" type="string">
  Teks yang diperbarui. Wajib bersama `before` saat `patch` dihilangkan.
</ParamField>
<ParamField path="patch" type="string">
  Teks diff terpadu. Saling eksklusif dengan `before` dan `after`.
</ParamField>
<ParamField path="path" type="string">
  Nama file tampilan untuk mode sebelum dan sesudah.
</ParamField>
<ParamField path="lang" type="string">
  Petunjuk penimpaan bahasa untuk mode sebelum dan sesudah. Nilai yang tidak dikenal kembali ke teks polos.
</ParamField>
<ParamField path="title" type="string">
  Penimpaan judul penampil.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode keluaran. Default ke default Plugin `defaults.mode`. Alias usang: `"image"` berperilaku seperti `"file"` dan masih diterima untuk kompatibilitas mundur.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema penampil. Default ke default Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Tata letak diff. Default ke default Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Luaskan bagian yang tidak berubah saat konteks lengkap tersedia. Opsi per panggilan saja (bukan kunci default Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format file yang dirender. Default ke default Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset kualitas untuk rendering PNG atau PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Penimpaan skala perangkat (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Lebar render maksimum dalam piksel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefak dalam detik untuk keluaran penampil dan file mandiri. Maks 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Penimpaan origin URL penampil. Menimpa `viewerBaseUrl` Plugin. Harus `http` atau `https`, tanpa query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Masih diterima untuk kompatibilitas mundur:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` dan `after` masing-masing maks 512 KiB.
    - `patch` maks 2 MiB.
    - `path` maks 2048 byte.
    - `lang` maks 128 byte.
    - `title` maks 1024 byte.
    - Batas kompleksitas patch: maks 128 file dan total 120000 baris.
    - `patch` bersama `before` atau `after` ditolak.
    - Batas keamanan file yang dirender (berlaku untuk PNG dan PDF):
      - `fileQuality: "standard"`: maks 8 MP (8,000,000 piksel yang dirender).
      - `fileQuality: "hq"`: maks 14 MP (14,000,000 piksel yang dirender).
      - `fileQuality: "print"`: maks 24 MP (24,000,000 piksel yang dirender).
      - PDF juga memiliki maksimum 50 halaman.

  </Accordion>
</AccordionGroup>

## Kontrak detail keluaran

Alat mengembalikan metadata terstruktur di bawah `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Field bersama untuk mode yang membuat penampil:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` saat tersedia)

  </Accordion>
  <Accordion title="File fields">
    Field file saat PNG atau PDF dirender:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (nilai yang sama dengan `filePath`, untuk kompatibilitas alat pesan)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Juga dikembalikan untuk pemanggil yang sudah ada:

    - `format` (nilai yang sama dengan `fileFormat`)
    - `imagePath` (nilai yang sama dengan `filePath`)
    - `imageBytes` (nilai yang sama dengan `fileBytes`)
    - `imageQuality` (nilai yang sama dengan `fileQuality`)
    - `imageScale` (nilai yang sama dengan `fileScale`)
    - `imageMaxWidth` (nilai yang sama dengan `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Ringkasan perilaku mode:

| Mode     | Yang dikembalikan                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Hanya field penampil.                                                                                                  |
| `"file"` | Hanya field file, tanpa artefak penampil.                                                                              |
| `"both"` | Field penampil plus field file. Jika rendering file gagal, penampil tetap dikembalikan dengan alias `fileError` dan `imageError`. |

## Bagian tidak berubah yang diciutkan

- Penampil dapat menampilkan baris seperti `N unmodified lines`.
- Kontrol perluas pada baris tersebut bersifat kondisional dan tidak dijamin untuk setiap jenis input.
- Kontrol perluas muncul saat diff yang dirender memiliki data konteks yang dapat diperluas, yang umum untuk input sebelum dan sesudah.
- Untuk banyak input patch terpadu, isi konteks yang dihilangkan tidak tersedia dalam hunk patch yang diurai, sehingga baris dapat muncul tanpa kontrol perluas. Ini adalah perilaku yang diharapkan.
- `expandUnchanged` hanya berlaku saat konteks yang dapat diperluas ada.

## Default Plugin

Atur default seluruh Plugin di `~/.openclaw/openclaw.json`:

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

Parameter alat eksplisit menimpa default ini.

### Konfigurasi URL penampil persisten

<ParamField path="viewerBaseUrl" type="string">
  Fallback milik Plugin untuk tautan penampil yang dikembalikan saat panggilan alat tidak meneruskan `baseUrl`. Harus `http` atau `https`, tanpa query/hash.
</ParamField>

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

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: permintaan non-loopback ke rute penampil ditolak. `true`: penampil jarak jauh diizinkan jika jalur bertoken valid.
</ParamField>

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

- Artefak disimpan di bawah subfolder sementara: `$TMPDIR/openclaw-diffs`.
- Metadata artefak penampil berisi:
  - ID artefak acak (20 karakter hex)
  - token acak (48 karakter hex)
  - `createdAt` dan `expiresAt`
  - jalur `viewer.html` yang disimpan
- TTL artefak default adalah 30 menit saat tidak ditentukan.
- TTL penampil maksimum yang diterima adalah 6 jam.
- Pembersihan berjalan secara oportunistik setelah pembuatan artefak.
- Artefak kedaluwarsa dihapus.
- Pembersihan fallback menghapus folder usang yang lebih lama dari 24 jam saat metadata hilang.

## URL penampil dan perilaku jaringan

Rute penampil:

- `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokumen penampil menyelesaikan aset tersebut relatif terhadap URL penampil, sehingga prefiks jalur `baseUrl` opsional juga dipertahankan untuk kedua permintaan aset.

Perilaku konstruksi URL:

- Jika `baseUrl` panggilan alat diberikan, itu digunakan setelah validasi ketat.
- Jika tidak, jika `viewerBaseUrl` Plugin dikonfigurasi, itu digunakan.
- Tanpa salah satu penimpaan, URL penampil default ke loopback `127.0.0.1`.
- Jika mode bind Gateway adalah `custom` dan `gateway.customBindHost` diatur, host tersebut digunakan.

Aturan `baseUrl`:

- Harus `http://` atau `https://`.
- Query dan hash ditolak.
- Origin plus jalur dasar opsional diizinkan.

## Model keamanan

<AccordionGroup>
  <Accordion title="Pengerasan viewer">
    - Hanya loopback secara default.
    - Jalur viewer bertoken dengan validasi ID dan token yang ketat.
    - CSP respons viewer:
      - `default-src 'none'`
      - skrip dan aset hanya dari self
      - tidak ada `connect-src` keluar
    - Pembatasan miss jarak jauh saat akses jarak jauh diaktifkan:
      - 40 kegagalan per 60 detik
      - penguncian 60 detik (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Pengerasan rendering file">
    - Perutean permintaan browser screenshot bersifat tolak-secara-default.
    - Hanya aset viewer lokal dari `http://127.0.0.1/plugins/diffs/assets/*` yang diizinkan.
    - Permintaan jaringan eksternal diblokir.

  </Accordion>
</AccordionGroup>

## Persyaratan browser untuk mode file

`mode: "file"` dan `mode: "both"` memerlukan browser yang kompatibel dengan Chromium.

Urutan resolusi:

<Steps>
  <Step title="Konfigurasi">
    `browser.executablePath` dalam konfigurasi OpenClaw.
  </Step>
  <Step title="Variabel lingkungan">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Fallback platform">
    Fallback penemuan perintah/jalur platform.
  </Step>
</Steps>

Teks kegagalan umum:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Perbaiki dengan menginstal Chrome, Chromium, Edge, atau Brave, atau dengan mengatur salah satu opsi jalur executable di atas.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kesalahan validasi input">
    - `Provide patch or both before and after text.` — sertakan `before` dan `after`, atau sediakan `patch`.
    - `Provide either patch or before/after input, not both.` — jangan mencampur mode input.
    - `Invalid baseUrl: ...` — gunakan origin `http(s)` dengan jalur opsional, tanpa query/hash.
    - `{field} exceeds maximum size (...)` — kurangi ukuran payload.
    - Penolakan patch besar — kurangi jumlah file patch atau total baris.

  </Accordion>
  <Accordion title="Aksesibilitas viewer">
    - URL viewer secara default mengarah ke `127.0.0.1`.
    - Untuk skenario akses jarak jauh, salah satu:
      - atur `viewerBaseUrl` Plugin, atau
      - teruskan `baseUrl` per panggilan tool, atau
      - gunakan `gateway.bind=custom` dan `gateway.customBindHost`
    - Jika `gateway.trustedProxies` menyertakan loopback untuk proxy host yang sama (misalnya Tailscale Serve), permintaan viewer loopback mentah tanpa header IP klien yang diteruskan akan gagal tertutup sesuai desain.
    - Untuk topologi proxy tersebut:
      - pilih `mode: "file"` atau `mode: "both"` saat Anda hanya memerlukan lampiran, atau
      - aktifkan `security.allowRemoteViewer` secara sengaja dan atur `viewerBaseUrl` Plugin atau teruskan `baseUrl` proxy/publik saat Anda memerlukan URL viewer yang dapat dibagikan
    - Aktifkan `security.allowRemoteViewer` hanya saat Anda memang menginginkan akses viewer eksternal.

  </Accordion>
  <Accordion title="Baris unmodified-lines tidak memiliki tombol perluas">
    Ini dapat terjadi untuk input patch ketika patch tidak membawa konteks yang dapat diperluas. Ini sesuai ekspektasi dan tidak menunjukkan kegagalan viewer.
  </Accordion>
  <Accordion title="Artefak tidak ditemukan">
    - Artefak kedaluwarsa karena TTL.
    - Token atau jalur berubah.
    - Pembersihan menghapus data usang.

  </Accordion>
</AccordionGroup>

## Panduan operasional

- Pilih `mode: "view"` untuk peninjauan interaktif lokal di canvas.
- Pilih `mode: "file"` untuk kanal chat keluar yang memerlukan lampiran.
- Biarkan `allowRemoteViewer` dinonaktifkan kecuali deployment Anda memerlukan URL viewer jarak jauh.
- Tetapkan `ttlSeconds` singkat secara eksplisit untuk diff sensitif.
- Hindari mengirim rahasia dalam input diff saat tidak diperlukan.
- Jika kanal Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), pilih output PDF (`fileFormat: "pdf"`).

<Note>
Mesin rendering diff didukung oleh [Diffs](https://diffs.com).
</Note>

## Terkait

- [Browser](/id/tools/browser)
- [Plugins](/id/tools/plugin)
- [Ikhtisar tools](/id/tools)
