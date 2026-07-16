---
read_when:
    - Anda ingin agen menampilkan pengeditan kode atau Markdown sebagai diff
    - Anda menginginkan URL penampil yang siap untuk canvas atau berkas diff yang telah dirender
    - Anda memerlukan artefak diff sementara yang terkontrol dengan default yang aman
sidebarTitle: Diffs
summary: Penampil diff hanya-baca dan perender file untuk agen (alat plugin opsional)
title: Perbedaan
x-i18n:
    generated_at: "2026-07-16T18:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` adalah alat plugin terbundel opsional yang mengubah teks sebelum/sesudah atau patch terpadu menjadi artefak diff hanya-baca. Alat ini juga menambahkan panduan singkat agen di awal prompt sistem dan menyertakan skill pendamping untuk petunjuk yang lebih lengkap.

Input: teks `before` + `after`, atau `patch` terpadu (saling eksklusif).

Output: URL penampil gateway untuk penyajian kanvas, jalur file PNG/PDF yang dirender untuk pengiriman pesan, atau keduanya.

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
        Pengiriman file obrolan: agen memanggil `diffs` dengan `mode: "file"` dan mengirim `details.filePath` dengan `message` menggunakan `path` atau `filePath`.
      </Tab>
      <Tab title="both">
        Gabungan (default): agen memanggil `diffs` dengan `mode: "both"` untuk mendapatkan kedua artefak dalam satu panggilan.
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

Ini memblokir hook `before_prompt_build` milik plugin sembari tetap menyediakan alat dan skill. Untuk menonaktifkan panduan dan alat sekaligus, nonaktifkan pluginnya.

## Referensi input alat

Semua bidang bersifat opsional kecuali jika disebutkan lain.

<ParamField path="before" type="string">
  Teks asli. Wajib bersama `after` saat `patch` tidak diberikan.
</ParamField>
<ParamField path="after" type="string">
  Teks yang diperbarui. Wajib bersama `before` saat `patch` tidak diberikan.
</ParamField>
<ParamField path="patch" type="string">
  Teks diff terpadu. Saling eksklusif dengan `before` dan `after`.
</ParamField>
<ParamField path="path" type="string">
  Nama file tampilan untuk mode sebelum/sesudah.
</ParamField>
<ParamField path="lang" type="string">
  Petunjuk penggantian bahasa untuk mode sebelum/sesudah. Nilai yang tidak dikenal dan bahasa di luar kumpulan default penampil akan kembali menggunakan teks biasa kecuali
  plugin Diff Viewer Language Pack diinstal.
</ParamField>
<ParamField path="title" type="string">
  Penggantian judul penampil.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode output. Default-nya adalah default plugin `defaults.mode` (`both`). Alias usang: `"image"` berperilaku sama persis dengan `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema penampil. Default-nya adalah default plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Tata letak diff. Default-nya adalah default plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Perluas bagian yang tidak berubah saat konteks lengkap tersedia. Hanya opsi per panggilan (bukan kunci default plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format file yang dirender. Default-nya adalah default plugin `defaults.fileFormat`.
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

Instal plugin Diff Viewer Language Pack untuk lebih banyak bahasa (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff, dan lainnya):

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

| Mode     | Mengembalikan                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Hanya bidang penampil.                                                                             |
| `"file"` | Hanya bidang file, tanpa artefak penampil.                                                           |
| `"both"` | Bidang penampil ditambah bidang file. Jika rendering file gagal, penampil tetap dikembalikan dengan `fileError`. |

### Bagian tidak berubah yang diciutkan

Penampil menampilkan baris seperti `N unmodified lines`. Kontrol perluasan hanya muncul saat diff yang dirender memiliki data konteks yang dapat diperluas (umumnya untuk input sebelum/sesudah). Banyak patch terpadu menghilangkan isi konteks dalam hunk-nya, sehingga baris tersebut dapat muncul tanpa kontrol perluasan -- ini wajar, bukan bug. `expandUnchanged` hanya berlaku saat konteks yang dapat diperluas tersedia.

### Navigasi multi-file

Patch yang menyentuh lebih dari satu file diawali dengan kartu ringkasan file yang berubah: jumlah total `+N` / `-N`, jumlah per file, lencana ditambahkan/dihapus/diganti nama, serta tautan jangkar yang melompat ke setiap file. File PNG/PDF yang dirender mempertahankan jumlah pada header per file, tetapi menghapus tombol pengalih tampilan interaktif karena kontrol tersebut tidak berfungsi dalam file statis.

## Default plugin

Atur default seluruh plugin dalam `~/.openclaw/openclaw.json`:

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

Kunci `defaults` yang didukung: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Parameter panggilan alat eksplisit menggantikan nilai-nilai ini.

### Konfigurasi URL penampil persisten

<ParamField path="viewerBaseUrl" type="string">
  Fallback milik plugin untuk tautan penampil yang dikembalikan saat panggilan alat tidak memberikan `baseUrl`. Harus berupa `http` atau `https`, tanpa kueri/hash.
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

- Artefak berada di bawah `$TMPDIR/openclaw-diffs`.
- Metadata penampil menyimpan ID artefak acak sepanjang 20 karakter heksadesimal, token acak sepanjang 48 karakter heksadesimal, `createdAt`/`expiresAt`, dan jalur `viewer.html` yang disimpan.
- TTL artefak default: 30 menit. TTL maksimum yang diterima: 6 jam.
- Pembersihan dijalankan secara oportunistik setelah setiap panggilan pembuatan artefak; artefak yang kedaluwarsa dihapus.
- Penyapuan fallback menghapus folder usang yang berusia lebih dari 24 jam saat metadata tidak tersedia.

## URL penampil dan perilaku jaringan

Rute penampil: `/plugins/diffs/view/{artifactId}/{token}`

Aset penampil:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (hanya jika diff menggunakan bahasa paket bahasa)

Dokumen penampil menyelesaikan aset-aset ini secara relatif terhadap URL penampil, sehingga prefiks jalur opsional `baseUrl` juga diterapkan pada permintaan aset.

Urutan penyelesaian URL: `baseUrl` panggilan alat (setelah validasi ketat) -> `viewerBaseUrl` Plugin -> `127.0.0.1` loopback bawaan. Jika mode pengikatan Gateway adalah `custom` dan `gateway.customBindHost` ditetapkan, host tersebut digunakan sebagai pengganti loopback.

Aturan `baseUrl`: harus berupa `http://` atau `https://`; kueri dan hash ditolak; origin beserta jalur dasar opsional diizinkan.

## Model keamanan

<AccordionGroup>
  <Accordion title="Penguatan penampil">
    - Secara bawaan hanya loopback.
    - Jalur penampil bertoken dengan validasi pola ID dan token yang ketat.
    - CSP respons penampil: `default-src 'none'`; skrip/aset hanya dari sumber yang sama; tanpa `connect-src` keluar.
    - Pembatasan kegagalan jarak jauh saat akses jarak jauh diaktifkan: 40 kegagalan per 60 detik memicu penguncian selama 60 detik (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Penguatan perenderan file">
    - Perutean permintaan browser tangkapan layar secara bawaan menolak akses.
    - Hanya aset penampil lokal dari `http://127.0.0.1/plugins/diffs/assets/*` yang diizinkan.
    - Permintaan jaringan eksternal diblokir.

  </Accordion>
</AccordionGroup>

## Persyaratan browser untuk mode file

`mode: "file"` dan `mode: "both"` memerlukan browser yang kompatibel dengan Chromium.

Urutan penyelesaian:

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

Teks kegagalan umum: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Perbaiki dengan menginstal Chrome, Chromium, Edge, atau Brave, atau dengan menetapkan salah satu opsi jalur berkas yang dapat dieksekusi di atas.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kesalahan validasi input">
    - `Provide patch or both before and after text.` -- sertakan `before` dan `after`, atau berikan `patch`.
    - `Provide either patch or before/after input, not both.` -- jangan mencampur mode input.
    - `Invalid baseUrl: ...` -- gunakan origin `http(s)` dengan jalur opsional, tanpa kueri/hash.
    - `{field} exceeds maximum size (...)` -- kurangi ukuran muatan.
    - Penolakan patch besar -- kurangi jumlah file patch atau total baris.

  </Accordion>
  <Accordion title="Aksesibilitas penampil">
    - URL penampil secara bawaan diselesaikan menjadi `127.0.0.1`.
    - Untuk akses jarak jauh, tetapkan `viewerBaseUrl` Plugin, teruskan `baseUrl` untuk setiap panggilan, atau gunakan `gateway.bind=custom` dengan `gateway.customBindHost`.
    - Jika `gateway.trustedProxies` menyertakan loopback untuk proksi pada host yang sama (misalnya Tailscale Serve), permintaan penampil loopback mentah tanpa header IP klien yang diteruskan akan ditolak sesuai rancangan.
    - Untuk topologi proksi tersebut, utamakan `mode: "file"`/`"both"` sebagai lampiran, atau aktifkan `security.allowRemoteViewer` secara sengaja beserta `viewerBaseUrl` Plugin/`baseUrl` proksi untuk tautan penampil yang dapat dibagikan.
    - Aktifkan `security.allowRemoteViewer` hanya jika akses penampil eksternal memang dimaksudkan.

  </Accordion>
  <Accordion title="Baris yang tidak diubah tidak memiliki tombol perluas">
    Hal ini wajar untuk input patch yang tidak memiliki konteks yang dapat diperluas; bukan kegagalan penampil.
  </Accordion>
  <Accordion title="Artefak tidak ditemukan">
    - Artefak kedaluwarsa karena TTL.
    - Token atau jalur berubah.
    - Pembersihan menghapus data usang.

  </Accordion>
</AccordionGroup>

## Panduan operasional

- Utamakan `mode: "view"` untuk peninjauan interaktif lokal di kanvas.
- Utamakan `mode: "file"` untuk kanal obrolan keluar yang memerlukan lampiran.
- Biarkan `allowRemoteViewer` dinonaktifkan kecuali deployment Anda memerlukan URL penampil jarak jauh.
- Tetapkan `ttlSeconds` singkat yang eksplisit untuk diff sensitif.
- Hindari mengirim rahasia dalam input diff jika tidak diperlukan.
- Jika kanal Anda mengompresi gambar secara agresif (misalnya Telegram atau WhatsApp), utamakan keluaran PDF (`fileFormat: "pdf"`).

<Note>
Mesin perenderan diff didukung oleh [Diffs](https://diffs.com).
</Note>

## Terkait

- [Browser](/id/tools/browser)
- [Plugin](/id/tools/plugin)
- [Ikhtisar alat](/id/tools)
