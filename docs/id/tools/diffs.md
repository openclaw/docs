---
read_when:
    - Anda ingin agen menampilkan perubahan kode atau Markdown sebagai diff
    - Anda menginginkan URL penampil yang siap untuk kanvas atau file diff yang dirender
    - Anda memerlukan artefak diff sementara yang terkendali dengan default yang aman
sidebarTitle: Diffs
summary: Penampil diff dan perender file hanya-baca untuk agen (alat Plugin opsional)
title: Perbedaan
x-i18n:
    generated_at: "2026-04-30T10:14:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` adalah alat Plugin opsional dengan panduan sistem bawaan singkat dan skill pendamping yang mengubah konten perubahan menjadi artefak diff baca-saja untuk agen.

Alat ini menerima salah satu dari:

- teks `before` dan `after`
- `patch` terpadu

Alat ini dapat mengembalikan:

- URL penampil Gateway untuk presentasi canvas
- jalur file hasil render (PNG atau PDF) untuk pengiriman pesan
- kedua output dalam satu panggilan

Saat diaktifkan, Plugin menambahkan panduan penggunaan ringkas ke ruang system-prompt dan juga mengekspos skill terperinci untuk kasus saat agen membutuhkan instruksi yang lebih lengkap.

## Mulai cepat

<Steps>
  <Step title="Aktifkan Plugin">
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
  <Step title="Pilih mode">
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

Jika Anda ingin tetap mengaktifkan alat `diffs` tetapi menonaktifkan panduan system-prompt bawaannya, tetapkan `plugins.entries.diffs.hooks.allowPromptInjection` ke `false`:

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

Ini memblokir hook `before_prompt_build` milik Plugin diffs sambil tetap membuat Plugin, alat, dan skill pendamping tersedia.

Jika Anda ingin menonaktifkan panduan dan alatnya sekaligus, nonaktifkan Plugin sebagai gantinya.

## Alur kerja agen umum

<Steps>
  <Step title="Panggil diffs">
    Agen memanggil alat `diffs` dengan input.
  </Step>
  <Step title="Baca detail">
    Agen membaca bidang `details` dari respons.
  </Step>
  <Step title="Presentasikan">
    Agen membuka `details.viewerUrl` dengan `canvas present`, mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`, atau melakukan keduanya.
  </Step>
</Steps>

## Contoh input

<Tabs>
  <Tab title="Sebelum dan sesudah">
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

Semua bidang bersifat opsional kecuali dinyatakan lain.

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
  Petunjuk pengganti bahasa untuk mode sebelum dan sesudah. Nilai yang tidak dikenal akan kembali ke teks biasa.
</ParamField>
<ParamField path="title" type="string">
  Pengganti judul penampil.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode output. Default ke default Plugin `defaults.mode`. Alias yang tidak digunakan lagi: `"image"` berperilaku seperti `"file"` dan masih diterima untuk kompatibilitas mundur.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema penampil. Default ke default Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Tata letak diff. Default ke default Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Perluas bagian yang tidak berubah saat konteks penuh tersedia. Opsi khusus per panggilan saja (bukan kunci default Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format file hasil render. Default ke default Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Prasetel kualitas untuk rendering PNG atau PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Pengganti skala perangkat (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Lebar render maksimum dalam piksel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefak dalam detik untuk output penampil dan file mandiri. Maksimum 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Pengganti origin URL penampil. Menggantikan `viewerBaseUrl` Plugin. Harus berupa `http` atau `https`, tanpa query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias input lama">
    Masih diterima untuk kompatibilitas mundur:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validasi dan batas">
    - `before` dan `after` masing-masing maksimum 512 KiB.
    - `patch` maksimum 2 MiB.
    - `path` maksimum 2048 byte.
    - `lang` maksimum 128 byte.
    - `title` maksimum 1024 byte.
    - Batas kompleksitas patch: maksimum 128 file dan total 120000 baris.
    - `patch` bersama `before` atau `after` ditolak.
    - Batas keamanan file hasil render (berlaku untuk PNG dan PDF):
      - `fileQuality: "standard"`: maksimum 8 MP (8.000.000 piksel hasil render).
      - `fileQuality: "hq"`: maksimum 14 MP (14.000.000 piksel hasil render).
      - `fileQuality: "print"`: maksimum 24 MP (24.000.000 piksel hasil render).
      - PDF juga memiliki maksimum 50 halaman.

  </Accordion>
</AccordionGroup>

## Kontrak detail output

Alat mengembalikan metadata terstruktur di bawah `details`.

<AccordionGroup>
  <Accordion title="Bidang penampil">
    Bidang bersama untuk mode yang membuat penampil:

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
  <Accordion title="Bidang file">
    Bidang file saat PNG atau PDF dirender:

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
  <Accordion title="Alias kompatibilitas">
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
| `"both"` | Field penampil ditambah field file. Jika rendering file gagal, penampil tetap kembali dengan alias `fileError` dan `imageError`. |

## Bagian tidak berubah yang diciutkan

- Penampil dapat menampilkan baris seperti `N unmodified lines`.
- Kontrol perluas pada baris tersebut bersifat kondisional dan tidak dijamin untuk setiap jenis input.
- Kontrol perluas muncul saat diff yang dirender memiliki data konteks yang dapat diperluas, yang umum untuk input sebelum dan sesudah.
- Untuk banyak input patch terpadu, isi konteks yang dihilangkan tidak tersedia di hunk patch yang diurai, sehingga baris dapat muncul tanpa kontrol perluas. Ini adalah perilaku yang diharapkan.
- `expandUnchanged` hanya berlaku saat konteks yang dapat diperluas ada.

## Default Plugin

Tetapkan default di seluruh plugin dalam `~/.openclaw/openclaw.json`:

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

Parameter alat eksplisit menimpa default ini.

### Konfigurasi URL penampil persisten

<ParamField path="viewerBaseUrl" type="string">
  Fallback milik Plugin untuk tautan penampil yang dikembalikan saat panggilan alat tidak meneruskan `baseUrl`. Harus berupa `http` atau `https`, tanpa query/hash.
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
  `false`: permintaan non-loopback ke rute penampil ditolak. `true`: penampil jarak jauh diizinkan jika path bertoken valid.
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

- Artefak disimpan di bawah subfolder temp: `$TMPDIR/openclaw-diffs`.
- Metadata artefak penampil berisi:
  - ID artefak acak (20 karakter hex)
  - token acak (48 karakter hex)
  - `createdAt` dan `expiresAt`
  - path `viewer.html` yang disimpan
- TTL artefak default adalah 30 menit jika tidak ditentukan.
- TTL penampil maksimum yang diterima adalah 6 jam.
- Pembersihan berjalan secara oportunistis setelah pembuatan artefak.
- Artefak kedaluwarsa dihapus.
- Pembersihan fallback menghapus folder basi yang lebih lama dari 24 jam saat metadata tidak ada.

## Perilaku URL penampil dan jaringan

Rute penampil:

- `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokumen penampil menyelesaikan aset tersebut relatif terhadap URL penampil, sehingga prefiks path `baseUrl` opsional juga dipertahankan untuk kedua permintaan aset.

Perilaku konstruksi URL:

- Jika `baseUrl` panggilan alat disediakan, itu digunakan setelah validasi ketat.
- Jika tidak, jika `viewerBaseUrl` Plugin dikonfigurasi, itu digunakan.
- Tanpa salah satu override, URL penampil default ke loopback `127.0.0.1`.
- Jika mode bind gateway adalah `custom` dan `gateway.customBindHost` ditetapkan, host tersebut digunakan.

Aturan `baseUrl`:

- Harus berupa `http://` atau `https://`.
- Query dan hash ditolak.
- Origin ditambah path dasar opsional diizinkan.

## Model keamanan

<AccordionGroup>
  <Accordion title="Viewer hardening">
    - Hanya loopback secara default.
    - Path penampil bertoken dengan validasi ID dan token yang ketat.
    - CSP respons penampil:
      - `default-src 'none'`
      - skrip dan aset hanya dari self
      - tanpa `connect-src` keluar
    - Pembatasan miss jarak jauh saat akses jarak jauh diaktifkan:
      - 40 kegagalan per 60 detik
      - lockout 60 detik (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Pengerasan perenderan file">
    - Perutean permintaan browser tangkapan layar menolak secara default.
    - Hanya aset penampil lokal dari `http://127.0.0.1/plugins/diffs/assets/*` yang diizinkan.
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
    - `Provide patch or both before and after text.` — sertakan `before` dan `after`, atau berikan `patch`.
    - `Provide either patch or before/after input, not both.` — jangan mencampur mode input.
    - `Invalid baseUrl: ...` — gunakan origin `http(s)` dengan path opsional, tanpa query/hash.
    - `{field} exceeds maximum size (...)` — kurangi ukuran payload.
    - Penolakan patch besar — kurangi jumlah file patch atau total baris.

  </Accordion>
  <Accordion title="Aksesibilitas penampil">
    - URL penampil me-resolve ke `127.0.0.1` secara default.
    - Untuk skenario akses jarak jauh, lakukan salah satu:
      - atur `viewerBaseUrl` Plugin, atau
      - teruskan `baseUrl` per pemanggilan tool, atau
      - gunakan `gateway.bind=custom` dan `gateway.customBindHost`
    - Jika `gateway.trustedProxies` mencakup loopback untuk proxy host yang sama (misalnya Tailscale Serve), permintaan penampil loopback mentah tanpa header IP klien yang diteruskan akan gagal tertutup sesuai desain.
    - Untuk topologi proxy tersebut:
      - utamakan `mode: "file"` atau `mode: "both"` saat Anda hanya memerlukan lampiran, atau
      - aktifkan `security.allowRemoteViewer` secara sengaja dan atur `viewerBaseUrl` Plugin atau teruskan `baseUrl` proxy/publik saat Anda memerlukan URL penampil yang dapat dibagikan
    - Aktifkan `security.allowRemoteViewer` hanya saat Anda memang menginginkan akses penampil eksternal.

  </Accordion>
  <Accordion title="Baris tanpa perubahan tidak memiliki tombol perluas">
    Ini dapat terjadi untuk input patch saat patch tidak membawa konteks yang dapat diperluas. Ini sesuai harapan dan tidak menunjukkan kegagalan penampil.
  </Accordion>
  <Accordion title="Artefak tidak ditemukan">
    - Artefak kedaluwarsa karena TTL.
    - Token atau path berubah.
    - Pembersihan menghapus data usang.

  </Accordion>
</AccordionGroup>

## Panduan operasional

- Utamakan `mode: "view"` untuk tinjauan interaktif lokal di canvas.
- Utamakan `mode: "file"` untuk kanal chat keluar yang memerlukan lampiran.
- Biarkan `allowRemoteViewer` nonaktif kecuali deployment Anda memerlukan URL penampil jarak jauh.
- Atur `ttlSeconds` singkat yang eksplisit untuk diff sensitif.
- Hindari mengirim rahasia dalam input diff jika tidak diperlukan.
- Jika kanal Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), utamakan output PDF (`fileFormat: "pdf"`).

<Note>
Mesin perenderan diff didukung oleh [Diffs](https://diffs.com).
</Note>

## Terkait

- [Browser](/id/tools/browser)
- [Plugins](/id/tools/plugin)
- [Ikhtisar tool](/id/tools)
