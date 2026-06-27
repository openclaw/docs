---
read_when:
    - Anda ingin agen menampilkan edit kode atau Markdown sebagai diff
    - Anda menginginkan URL penampil siap-kanvas atau berkas diff yang dirender
    - Anda memerlukan artefak diff sementara yang terkendali dengan default yang aman
sidebarTitle: Diffs
summary: Penampil diff dan perender file baca-saja untuk agen (alat Plugin opsional)
title: Perbedaan
x-i18n:
    generated_at: "2026-06-27T18:17:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` adalah alat Plugin opsional dengan panduan sistem bawaan singkat dan Skills pendamping yang mengubah konten perubahan menjadi artefak diff baca-saja untuk agen.

Alat ini menerima salah satu dari:

- teks `before` dan `after`
- `patch` terpadu

Alat ini dapat mengembalikan:

- URL penampil Gateway untuk presentasi kanvas
- path file yang dirender (PNG atau PDF) untuk pengiriman pesan
- kedua output dalam satu panggilan

Saat diaktifkan, Plugin menambahkan panduan penggunaan ringkas ke ruang system-prompt dan juga mengekspos Skills mendetail untuk kasus ketika agen memerlukan instruksi yang lebih lengkap.

## Mulai cepat

<Steps>
  <Step title="Instal Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        Alur yang mengutamakan kanvas: agen memanggil `diffs` dengan `mode: "view"` dan membuka `details.viewerUrl` dengan `canvas present`.
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

Jika Anda ingin tetap mengaktifkan alat `diffs` tetapi menonaktifkan panduan system-prompt bawaannya, atur `plugins.entries.diffs.hooks.allowPromptInjection` ke `false`:

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

Ini memblokir hook `before_prompt_build` milik Plugin diffs sambil tetap menyediakan Plugin, alat, dan Skills pendamping.

Jika Anda ingin menonaktifkan panduan sekaligus alatnya, nonaktifkan Plugin sebagai gantinya.

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
  Teks asli. Wajib bersama `after` saat `patch` tidak disertakan.
</ParamField>
<ParamField path="after" type="string">
  Teks yang diperbarui. Wajib bersama `before` saat `patch` tidak disertakan.
</ParamField>
<ParamField path="patch" type="string">
  Teks diff terpadu. Saling eksklusif dengan `before` dan `after`.
</ParamField>
<ParamField path="path" type="string">
  Nama file tampilan untuk mode sebelum dan sesudah.
</ParamField>
<ParamField path="lang" type="string">
  Petunjuk penggantian bahasa untuk mode sebelum dan sesudah. Nilai yang tidak dikenal dan bahasa di luar set penampil default kembali ke teks biasa kecuali Plugin Diff Viewer Language Pack diinstal.
</ParamField>

<ParamField path="title" type="string">
  Penggantian judul penampil.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode output. Default-nya adalah default Plugin `defaults.mode`. Alias yang tidak digunakan lagi: `"image"` berperilaku seperti `"file"` dan masih diterima untuk kompatibilitas mundur.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema penampil. Default-nya adalah default Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Tata letak diff. Default-nya adalah default Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Perluas bagian yang tidak berubah saat konteks penuh tersedia. Opsi per panggilan saja (bukan kunci default Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format file yang dirender. Default-nya adalah default Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset kualitas untuk rendering PNG atau PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Penggantian skala perangkat (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Lebar render maksimum dalam piksel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefak dalam detik untuk output penampil dan file mandiri. Maks 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Penggantian origin URL penampil. Mengganti Plugin `viewerBaseUrl`. Harus berupa `http` atau `https`, tanpa query/hash.
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
    - `before` dan `after` masing-masing maksimal 512 KiB.
    - `patch` maksimal 2 MiB.
    - `path` maksimal 2048 byte.
    - `lang` maksimal 128 byte.
    - `title` maksimal 1024 byte.
    - Batas kompleksitas patch: maksimal 128 file dan total 120000 baris.
    - `patch` bersama `before` atau `after` ditolak.
    - Batas keamanan file yang dirender (berlaku untuk PNG dan PDF):
      - `fileQuality: "standard"`: maksimal 8 MP (8.000.000 piksel yang dirender).
      - `fileQuality: "hq"`: maksimal 14 MP (14.000.000 piksel yang dirender).
      - `fileQuality: "print"`: maksimal 24 MP (24.000.000 piksel yang dirender).
      - PDF juga memiliki maksimum 50 halaman.

  </Accordion>
</AccordionGroup>

## Penyorotan sintaks

OpenClaw menyertakan penyorotan sintaks untuk bahasa sumber, konfigurasi, dan dokumentasi umum:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, dan `toml`.

Alias umum seperti `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, dan `ps1` dinormalisasi ke bahasa default tersebut.

Instal Plugin Diff Viewer Language Pack untuk menyorot bahasa lain:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Dengan paket bahasa tersedia, OpenClaw dapat menyorot jauh lebih banyak bahasa. Jika paket tidak diinstal, file di luar daftar default tetap dirender sebagai teks polos yang mudah dibaca. Contohnya meliputi Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, dan file diff.

Lihat [Plugin Diffs Language Pack](/id/plugins/reference/diffs-language-pack) untuk detail dan [bahasa Shiki](https://shiki.style/languages) untuk katalog bahasa upstream dan alias Shiki.

## Kontrak detail output

Alat ini mengembalikan metadata terstruktur di bawah `details`.

<AccordionGroup>
  <Accordion title="Kolom viewer">
    Kolom bersama untuk mode yang membuat viewer:

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
  <Accordion title="Kolom file">
    Kolom file saat PNG atau PDF dirender:

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
| `"view"` | Hanya kolom viewer.                                                                                                    |
| `"file"` | Hanya kolom file, tanpa artefak viewer.                                                                                |
| `"both"` | Kolom viewer ditambah kolom file. Jika rendering file gagal, viewer tetap dikembalikan dengan alias `fileError` dan `imageError`. |

## Bagian tidak berubah yang diciutkan

- Viewer dapat menampilkan baris seperti `N unmodified lines`.
- Kontrol perluas pada baris tersebut bersifat kondisional dan tidak dijamin untuk setiap jenis input.
- Kontrol perluas muncul saat diff yang dirender memiliki data konteks yang dapat diperluas, yang lazim untuk input sebelum dan sesudah.
- Untuk banyak input patch terpadu, isi konteks yang dihilangkan tidak tersedia dalam hunk patch yang diurai, sehingga baris dapat muncul tanpa kontrol perluas. Ini adalah perilaku yang diharapkan.
- `expandUnchanged` hanya berlaku saat konteks yang dapat diperluas tersedia.

## Default Plugin

Tetapkan default di seluruh Plugin dalam `~/.openclaw/openclaw.json`:

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

### Konfigurasi URL viewer persisten

<ParamField path="viewerBaseUrl" type="string">
  Fallback milik Plugin untuk tautan viewer yang dikembalikan saat panggilan alat tidak meneruskan `baseUrl`. Harus berupa `http` atau `https`, tanpa query/hash.
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
  `false`: permintaan non-loopback ke rute viewer ditolak. `true`: viewer jarak jauh diizinkan jika path bertoken valid.
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
  - path `viewer.html` yang tersimpan
- TTL artefak default adalah 30 menit jika tidak ditentukan.
- TTL penampil maksimum yang diterima adalah 6 jam.
- Pembersihan berjalan secara oportunistis setelah artefak dibuat.
- Artefak yang kedaluwarsa dihapus.
- Pembersihan fallback menghapus folder usang yang lebih lama dari 24 jam jika metadata tidak ada.

## URL penampil dan perilaku jaringan

Rute penampil:

- `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` saat diff menggunakan bahasa dari Diff Viewer Language Pack

Dokumen penampil menyelesaikan aset tersebut relatif terhadap URL penampil, sehingga prefiks path `baseUrl` opsional juga dipertahankan untuk kedua permintaan aset.

Perilaku konstruksi URL:

- Jika `baseUrl` panggilan alat disediakan, nilai itu digunakan setelah validasi ketat.
- Jika tidak, jika `viewerBaseUrl` Plugin dikonfigurasi, nilai itu digunakan.
- Tanpa salah satu override tersebut, URL penampil default ke loopback `127.0.0.1`.
- Jika mode bind Gateway adalah `custom` dan `gateway.customBindHost` diatur, host tersebut digunakan.

Aturan `baseUrl`:

- Harus berupa `http://` atau `https://`.
- Query dan hash ditolak.
- Origin plus path dasar opsional diizinkan.

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
      - penguncian 60 detik (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="File rendering hardening">
    - Routing permintaan browser tangkapan layar bersifat tolak-secara-default.
    - Hanya aset penampil lokal dari `http://127.0.0.1/plugins/diffs/assets/*` yang diizinkan.
    - Permintaan jaringan eksternal diblokir.

  </Accordion>
</AccordionGroup>

## Persyaratan browser untuk mode file

`mode: "file"` dan `mode: "both"` memerlukan browser yang kompatibel dengan Chromium.

Urutan resolusi:

<Steps>
  <Step title="Config">
    `browser.executablePath` dalam konfigurasi OpenClaw.
  </Step>
  <Step title="Environment variables">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform fallback">
    Fallback penemuan perintah/path platform.
  </Step>
</Steps>

Teks kegagalan umum:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Perbaiki dengan menginstal Chrome, Chromium, Edge, atau Brave, atau mengatur salah satu opsi path executable di atas.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Input validation errors">
    - `Provide patch or both before and after text.` — sertakan `before` dan `after`, atau berikan `patch`.
    - `Provide either patch or before/after input, not both.` — jangan mencampur mode input.
    - `Invalid baseUrl: ...` — gunakan origin `http(s)` dengan path opsional, tanpa query/hash.
    - `{field} exceeds maximum size (...)` — kurangi ukuran payload.
    - Penolakan patch besar — kurangi jumlah file patch atau total baris.

  </Accordion>
  <Accordion title="Viewer accessibility">
    - URL penampil diselesaikan ke `127.0.0.1` secara default.
    - Untuk skenario akses jarak jauh, salah satu:
      - atur `viewerBaseUrl` Plugin, atau
      - teruskan `baseUrl` per panggilan alat, atau
      - gunakan `gateway.bind=custom` dan `gateway.customBindHost`
    - Jika `gateway.trustedProxies` menyertakan loopback untuk proxy host yang sama (misalnya Tailscale Serve), permintaan penampil loopback mentah tanpa header IP klien yang diteruskan gagal tertutup sesuai desain.
    - Untuk topologi proxy tersebut:
      - pilih `mode: "file"` atau `mode: "both"` saat Anda hanya membutuhkan lampiran, atau
      - aktifkan `security.allowRemoteViewer` secara sengaja dan atur `viewerBaseUrl` Plugin atau teruskan `baseUrl` proxy/publik saat Anda membutuhkan URL penampil yang dapat dibagikan
    - Aktifkan `security.allowRemoteViewer` hanya saat Anda memang menginginkan akses penampil eksternal.

  </Accordion>
  <Accordion title="Unmodified-lines row has no expand button">
    Ini dapat terjadi untuk input patch saat patch tidak membawa konteks yang dapat diperluas. Ini diharapkan dan tidak menunjukkan kegagalan penampil.
  </Accordion>
  <Accordion title="Artifact not found">
    - Artefak kedaluwarsa karena TTL.
    - Token atau path berubah.
    - Pembersihan menghapus data usang.

  </Accordion>
</AccordionGroup>

## Panduan operasional

- Pilih `mode: "view"` untuk peninjauan interaktif lokal di canvas.
- Pilih `mode: "file"` untuk kanal obrolan keluar yang membutuhkan lampiran.
- Biarkan `allowRemoteViewer` dinonaktifkan kecuali deployment Anda memerlukan URL penampil jarak jauh.
- Tetapkan `ttlSeconds` singkat yang eksplisit untuk diff sensitif.
- Hindari mengirim rahasia dalam input diff jika tidak diperlukan.
- Jika kanal Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), pilih output PDF (`fileFormat: "pdf"`).

<Note>
Mesin rendering diff didukung oleh [Diffs](https://diffs.com).
</Note>

## Terkait

- [Browser](/id/tools/browser)
- [Plugins](/id/tools/plugin)
- [Ikhtisar alat](/id/tools)
