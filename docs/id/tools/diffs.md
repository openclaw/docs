---
read_when:
    - Anda ingin agen menampilkan perubahan kode atau Markdown sebagai diff
    - Anda menginginkan URL penampil yang siap digunakan di canvas atau berkas diff yang telah dirender
    - Anda memerlukan artefak diff sementara yang terkendali dengan default aman
sidebarTitle: Diffs
summary: Penampil diff hanya-baca dan perender file untuk agen (alat plugin opsional)
title: Perbedaan
x-i18n:
    generated_at: "2026-07-19T05:37:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baeb5dd1277120e57178f092e3ae1616edd3389a54721c929d8711301535d302
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` adalah alat plugin bundel opsional yang mengubah teks sebelum/sesudah atau patch terpadu menjadi artefak diff hanya-baca. Alat ini juga menambahkan panduan singkat untuk agen di awal prompt sistem dan menyertakan skill pendamping untuk petunjuk yang lebih lengkap.

Input: teks `before` + `after`, atau `patch` terpadu (saling eksklusif).

Output: URL penampil Gateway untuk penyajian kanvas, jalur file PNG/PDF yang dirender untuk pengiriman pesan, atau keduanya.

## Mulai cepat

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Aktifkan plugin">
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
        Pengiriman file melalui chat: agen memanggil `diffs` dengan `mode: "file"` dan mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`.
      </Tab>
      <Tab title="both">
        Gabungan (default): agen memanggil `diffs` dengan `mode: "both"` untuk memperoleh kedua artefak dalam satu panggilan.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Nonaktifkan panduan sistem bawaan

Untuk mempertahankan alat tetapi menghapus panduan yang ditambahkan di awal prompt sistem, atur `plugins.entries.diffs.hooks.allowPromptInjection` ke `false`:

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

Ini memblokir hook `before_prompt_build` milik plugin sambil tetap menyediakan alat dan skill. Untuk menonaktifkan panduan sekaligus alat, nonaktifkan pluginnya.

## Referensi input alat

Semua bidang bersifat opsional kecuali dinyatakan lain.

<ParamField path="before" type="string">
  Teks asli. Wajib bersama `after` ketika `patch` tidak diberikan.
</ParamField>
<ParamField path="after" type="string">
  Teks yang diperbarui. Wajib bersama `before` ketika `patch` tidak diberikan.
</ParamField>
<ParamField path="patch" type="string">
  Teks diff terpadu. Saling eksklusif dengan `before` dan `after`.
</ParamField>
<ParamField path="path" type="string">
  Nama file tampilan untuk mode sebelum/sesudah.
</ParamField>
<ParamField path="lang" type="string">
  Petunjuk penggantian bahasa untuk mode sebelum/sesudah. Nilai yang tidak dikenal dan bahasa di luar kumpulan default penampil akan kembali ke teks biasa kecuali
  plugin Diff Viewer Language Pack telah diinstal.
</ParamField>
<ParamField path="title" type="string">
  Penggantian judul penampil.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode output. Secara default menggunakan `defaults.mode` default plugin (`both`). Alias yang tidak digunakan lagi: `"image"` berperilaku sama persis dengan `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema penampil. Secara default menggunakan `defaults.theme` default plugin.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Tata letak diff. Secara default menggunakan `defaults.layout` default plugin.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Perluas bagian yang tidak berubah ketika konteks lengkap tersedia. Hanya opsi per panggilan (bukan kunci default plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format file yang dirender. Secara default menggunakan `defaults.fileFormat` default plugin.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Prasetel kualitas untuk rendering PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Penggantian skala perangkat (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Lebar rendering maksimum dalam piksel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefak dalam detik untuk output penampil dan file mandiri. Maksimum `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Penggantian asal URL penampil. Menggantikan `viewerBaseUrl` plugin. Harus berupa `http` atau `https`, tanpa kueri/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Validasi dan batas">
    - `before`/`after`: masing-masing maksimum 512 KiB.
    - `patch`: maksimum 2 MiB.
    - `path`: maksimum 2048 byte.
    - `lang`: maksimum 128 byte.
    - `title`: maksimum 1024 byte.
    - Batas kompleksitas patch: maksimum 128 file dan total 120000 baris.
    - `patch` bersama `before`/`after` ditolak.
    - Batas keamanan file yang dirender (PNG dan PDF):
      - `fileQuality: "standard"`: maksimum 8 MP (8,000,000 piksel yang dirender).
      - `fileQuality: "hq"`: maksimum 14 MP.
      - `fileQuality: "print"`: maksimum 24 MP.
      - PDF juga dibatasi hingga 50 halaman.

  </Accordion>
</AccordionGroup>

## Penyorotan sintaks

Bahasa bawaan:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, dan `toml`.

Alias umum (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, dan sebagainya) dinormalisasi ke bahasa tersebut.

Instal plugin Diff Viewer Language Pack untuk bahasa lainnya (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff, dan lainnya):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Tanpa paket tersebut, bahasa yang tidak didukung tetap dirender sebagai teks biasa yang mudah dibaca. Lihat [plugin Diffs Language Pack](/id/plugins/reference/diffs-language-pack) dan [bahasa Shiki](https://shiki.style/languages) untuk katalog upstream.

## Kontrak detail output

Semua hasil yang berhasil menyertakan `changed`: input sebelum/sesudah yang identik mengembalikan `false` tanpa membuat artefak; hasil yang dirender mengembalikan `true`.

<AccordionGroup>
  <Accordion title="Bidang penampil (mode view dan both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` jika tersedia)

  </Accordion>
  <Accordion title="Bidang file (mode file dan both)">
    - `changed`
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
</AccordionGroup>

| Mode     | Mengembalikan                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Hanya bidang penampil.                                                                          |
| `"file"` | Hanya bidang file, tanpa artefak penampil.                                                       |
| `"both"` | Bidang penampil beserta bidang file. Jika rendering file gagal, penampil tetap dikembalikan dengan `fileError`. |

### Bagian tidak berubah yang diciutkan

Penampil menampilkan baris seperti `N unmodified lines`. Kontrol perluasan hanya muncul ketika diff yang dirender memiliki data konteks yang dapat diperluas (umumnya untuk input sebelum/sesudah). Banyak patch terpadu tidak menyertakan isi konteks dalam hunk-nya, sehingga baris dapat muncul tanpa kontrol perluasan -- hal ini sesuai harapan, bukan bug. `expandUnchanged` hanya berlaku ketika tersedia konteks yang dapat diperluas.

### Navigasi multi-file

Patch yang menyentuh lebih dari satu file dimulai dengan kartu ringkasan file yang berubah: jumlah total `+N` / `-N`, jumlah per file, lencana ditambahkan/dihapus/diubah namanya, dan tautan jangkar yang melompat ke setiap file. File PNG/PDF yang dirender mempertahankan jumlah pada header per file, tetapi menghapus tombol pengalih tampilan interaktif karena kontrol tersebut tidak berfungsi dalam file statis.

## Default plugin

Tetapkan default untuk seluruh plugin di `~/.openclaw/openclaw.json`:

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

Kunci `defaults` yang didukung: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Parameter panggilan alat yang eksplisit menggantikan nilai-nilai ini.

### Konfigurasi URL penampil persisten

<ParamField path="viewerBaseUrl" type="string">
  Fallback milik plugin untuk tautan penampil yang dikembalikan ketika panggilan alat tidak meneruskan `baseUrl`. Harus berupa `http` atau `https`, tanpa kueri/hash.
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

- HTML penampil dan metadata berada di database `state/openclaw.sqlite` bersama dalam namespace blob plugin Diffs. HTML dikompresi dengan gzip; SQLite hanya menyimpan hash SHA-256 dari token URL acak, bukan token itu sendiri.
- File PNG/PDF yang dirender tetap menjadi materialisasi sementara di bawah `$TMPDIR/openclaw-diffs` karena pengiriman melalui kanal memerlukan jalur file. SQLite menyimpan metadata kedaluwarsanya; tidak ada file pendamping JSON yang ditulis.
- TTL artefak default: 30 menit. TTL maksimum yang diterima: 6 jam.
- Pembersihan dijalankan secara oportunistis setelah setiap panggilan pembuatan artefak. Baris SQLite yang kedaluwarsa dihapus terlebih dahulu, diikuti oleh direktori PNG/PDF terkait.
- Penyapuan cadangan menghapus folder sementara tanpa baris yang berusia lebih dari 24 jam. Cache lama `meta.json`, `file-meta.json`, dan `viewer.html` tidak diimpor atau dibaca.

## URL penampil dan perilaku jaringan

Rute penampil: `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (hanya ketika diff menggunakan bahasa paket bahasa)

Dokumen penampil me-resolve aset ini secara relatif terhadap URL penampil, sehingga prefiks jalur opsional `baseUrl` juga diterapkan pada permintaan aset.

Urutan resolusi URL: `baseUrl` panggilan alat (setelah validasi ketat) -> `viewerBaseUrl` plugin -> default loopback `127.0.0.1`. Jika mode bind gateway adalah `custom` dan `gateway.customBindHost` ditetapkan, host tersebut digunakan sebagai pengganti loopback.

Aturan `baseUrl`: harus berupa `http://` atau `https://`; kueri dan hash ditolak; origin dengan jalur dasar opsional diizinkan.

## Model keamanan

<AccordionGroup>
  <Accordion title="Penguatan penampil">
    - Secara default hanya untuk loopback.
    - Jalur penampil bertoken dengan validasi pola ID dan token yang ketat.
    - CSP respons penampil: `default-src 'none'`; skrip/aset hanya dari sumber sendiri; tidak ada `connect-src` keluar.
    - Pembatasan kegagalan akses jarak jauh saat akses jarak jauh diaktifkan: 40 kegagalan per 60 detik memicu penguncian selama 60 detik (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Penguatan perenderan file">
    - Perutean permintaan browser tangkapan layar secara default menolak semua.
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
    Jalur instalasi umum dan pencarian `PATH` untuk Chrome, Chromium, Edge, dan Brave.
  </Step>
</Steps>

Teks kegagalan umum: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Perbaiki dengan menginstal Chrome, Chromium, Edge, atau Brave, atau menetapkan salah satu opsi jalur executable di atas.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kesalahan validasi input">
    - `Provide patch or both before and after text.` -- sertakan `before` dan `after`, atau berikan `patch`.
    - `Provide either patch or before/after input, not both.` -- jangan mencampur mode input.
    - `Invalid baseUrl: ...` -- gunakan origin `http(s)` dengan jalur opsional, tanpa kueri/hash.
    - `{field} exceeds maximum size (...)` -- kurangi ukuran payload.
    - Penolakan patch besar -- kurangi jumlah file patch atau jumlah total baris.

  </Accordion>
  <Accordion title="Aksesibilitas penampil">
    - Secara default, URL penampil me-resolve ke `127.0.0.1`.
    - Untuk akses jarak jauh, tetapkan `viewerBaseUrl` plugin, teruskan `baseUrl` pada setiap panggilan, atau gunakan `gateway.bind=custom` dengan `gateway.customBindHost`.
    - Jika `gateway.trustedProxies` mencakup loopback untuk proxy pada host yang sama (misalnya Tailscale Serve), permintaan mentah penampil loopback tanpa header IP klien yang diteruskan akan ditolak secara default sesuai rancangan.
    - Untuk topologi proxy tersebut, pilih `mode: "file"`/`"both"` untuk lampiran, atau aktifkan `security.allowRemoteViewer` secara sengaja beserta `viewerBaseUrl` plugin/`baseUrl` proxy untuk tautan penampil yang dapat dibagikan.
    - Aktifkan `security.allowRemoteViewer` hanya jika akses penampil eksternal memang dimaksudkan.

  </Accordion>
  <Accordion title="Baris yang tidak dimodifikasi tidak memiliki tombol perluas">
    Ini memang diharapkan untuk input patch yang tidak memiliki konteks yang dapat diperluas; bukan kegagalan penampil.
  </Accordion>
  <Accordion title="Artefak tidak ditemukan">
    - Artefak kedaluwarsa karena TTL.
    - Token atau jalur berubah.
    - Pembersihan menghapus data usang.

  </Accordion>
</AccordionGroup>

## Panduan operasional

- Pilih `mode: "view"` untuk review interaktif lokal di kanvas.
- Pilih `mode: "file"` untuk kanal obrolan keluar yang memerlukan lampiran.
- Biarkan `allowRemoteViewer` dinonaktifkan kecuali deployment Anda memerlukan URL penampil jarak jauh.
- Tetapkan `ttlSeconds` singkat secara eksplisit untuk diff sensitif.
- Hindari mengirim rahasia dalam input diff jika tidak diperlukan.
- Jika kanal Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), pilih output PDF (`fileFormat: "pdf"`).

<Note>
Mesin perenderan diff didukung oleh [Diffs](https://diffs.com).
</Note>

## Terkait

- [Browser](/id/tools/browser)
- [Plugin](/id/tools/plugin)
- [Ikhtisar alat](/id/tools)
