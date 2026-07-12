---
read_when:
    - Anda ingin menginstal bundel yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami cara OpenClaw memetakan konten paket ke fitur native
    - Anda sedang men-debug deteksi bundel atau kapabilitas yang hilang
summary: Instal dan gunakan bundel Codex, Claude, dan Cursor sebagai plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-07-12T14:24:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw dapat memasang plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundel**—paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti Skills, hook, dan alat MCP.

<Info>
  Bundel **tidak** sama dengan plugin native OpenClaw. Plugin native berjalan
  dalam proses dan dapat mendaftarkan kemampuan apa pun. Bundel adalah paket konten dengan
  pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Alasan adanya bundel

Banyak plugin berguna diterbitkan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan pembuat menulis ulang plugin tersebut sebagai plugin native OpenClaw, OpenClaw
mendeteksi format ini dan memetakan konten yang didukung ke kumpulan fitur
native. Anda dapat memasang paket perintah Claude atau bundel Skills Codex dan langsung
menggunakannya.

## Memasang bundel

<Steps>
  <Step title="Pasang dari direktori, arsip, atau marketplace">
    ```bash
    # Direktori lokal
    openclaw plugins install ./my-bundle

    # Arsip
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` adalah jalur/repositori marketplace lokal atau sumber git/GitHub.

  </Step>

  <Step title="Verifikasi deteksi">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundel menampilkan `Format: bundle` beserta nilai `Bundle format:` berupa `codex`,
    `claude`, atau `cursor`.

  </Step>

  <Step title="Mulai ulang dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (Skills, hook, alat MCP, nilai bawaan LSP) tersedia pada sesi berikutnya.

  </Step>
</Steps>

## Yang dipetakan OpenClaw dari bundel

Saat ini tidak semua fitur bundel berjalan di OpenClaw. Berikut fitur yang berfungsi dan yang
terdeteksi tetapi belum terhubung.

### Didukung saat ini

| Fitur         | Cara pemetaannya                                                                                         | Berlaku untuk    |
| ------------- | -------------------------------------------------------------------------------------------------------- | ---------------- |
| Konten Skills | Akar Skills bundel dimuat sebagai Skills OpenClaw biasa                                                 | Semua format     |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai akar Skills                                    | Claude, Cursor   |
| Paket hook    | Tata letak bergaya OpenClaw berupa `HOOK.md` + `handler.ts`                                             | Codex            |
| Alat MCP      | Konfigurasi MCP bundel digabungkan ke pengaturan OpenClaw tertanam; server stdio dan HTTP yang didukung dimuat | Semua format |
| Server LSP    | `.lsp.json` Claude dan `lspServers` yang dideklarasikan dalam manifes digabungkan ke nilai bawaan LSP OpenClaw tertanam | Claude |
| Pengaturan    | `settings.json` Claude diimpor sebagai nilai bawaan OpenClaw tertanam                                   | Claude           |

#### Konten Skills

- Akar Skills bundel dimuat sebagai akar Skills OpenClaw biasa.
- Akar `commands/` Claude diperlakukan sebagai akar Skills tambahan.
- Akar `.cursor/commands/` Cursor diperlakukan sebagai akar Skills tambahan.

Berkas perintah Markdown Claude dan Markdown perintah Cursor sama-sama berfungsi melalui
pemuat Skills OpenClaw biasa.

#### Paket hook

Akar hook bundel berfungsi **hanya** jika menggunakan tata letak paket hook
OpenClaw biasa: `HOOK.md` beserta `handler.ts` atau `handler.js`. Saat ini, ini terutama
berlaku untuk kasus yang kompatibel dengan Codex.

#### MCP untuk OpenClaw tertanam

- Bundel yang diaktifkan dapat menyediakan konfigurasi server MCP.
- OpenClaw menggabungkan konfigurasi MCP bundel ke pengaturan efektif OpenClaw
  tertanam sebagai `mcpServers`.
- OpenClaw menyediakan alat MCP bundel yang didukung selama giliran agen OpenClaw
  tertanam dengan menjalankan server stdio atau menghubungkan ke server HTTP.
- Profil alat `coding` dan `messaging` secara bawaan menyertakan alat MCP bundel;
  gunakan `tools.deny: ["bundle-mcp"]` untuk menonaktifkannya bagi agen atau Gateway.
- Pengaturan agen tertanam lokal proyek tetap diterapkan setelah nilai bawaan bundel, sehingga
  pengaturan ruang kerja dapat mengganti entri MCP bundel bila diperlukan.
- Katalog alat MCP bundel diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan `listTools()` dari hulu tidak mengacaukan blok alat cache prompt.

##### Transportasi

Server MCP dapat menggunakan transportasi stdio atau HTTP.

**Stdio** menjalankan proses anak:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** terhubung ke server MCP yang sedang berjalan, dengan nilai bawaan `sse` kecuali
`streamable-http` diminta:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` menerima `"streamable-http"` atau `"sse"`; jika dihilangkan, nilai bawaannya adalah `sse`.
- `type: "http"` adalah bentuk hilir native CLI; gunakan `transport: "streamable-http"` dalam konfigurasi OpenClaw. `openclaw mcp set` dan `openclaw doctor --fix` menormalisasi alias umum tersebut.
- Hanya skema URL `http:` dan `https:` yang diizinkan.
- Nilai `headers` mendukung interpolasi `${ENV_VAR}`.
- Entri server yang memiliki `command` sekaligus `url` akan ditolak.
- Kredensial URL (info pengguna dan parameter kueri) disamarkan dari deskripsi
  alat dan log.
- `connectionTimeoutMs` mengganti batas waktu koneksi bawaan 30 detik untuk
  transportasi stdio maupun HTTP. Batas waktu permintaan secara bawaan adalah 60 detik dan
  dapat diganti dengan `requestTimeoutMs`.

##### Penamaan alat

OpenClaw mendaftarkan alat MCP bundel dengan nama yang aman bagi penyedia dalam bentuk
`serverName__toolName`. Sebagai contoh, server dengan kunci `"vigil-harbor"` yang menyediakan
alat `memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- Karakter di luar `A-Za-z0-9_-` diganti dengan `-`.
- Fragmen yang akan diawali karakter selain huruf diberi prefiks huruf, sehingga kunci
  server numerik seperti `12306` menjadi prefiks alat yang aman bagi penyedia.
- Prefiks server dibatasi hingga 30 karakter.
- Nama alat lengkap dibatasi hingga 64 karakter.
- Nama server kosong menggunakan `mcp` sebagai nilai pengganti.
- Nama hasil sanitasi yang bertabrakan dibedakan dengan sufiks numerik.
- Urutan akhir alat yang disediakan bersifat deterministik berdasarkan nama aman, sehingga giliran
  agen tertanam yang berulang tetap stabil terhadap cache.
- Pemfilteran profil memperlakukan setiap alat dari satu server MCP bundel sebagai
  milik plugin `bundle-mcp`, sehingga daftar izin/tolak profil dapat merujuk
  nama alat individual yang disediakan atau kunci plugin `bundle-mcp`.

#### Pengaturan OpenClaw tertanam

`settings.json` Claude diimpor sebagai pengaturan bawaan OpenClaw tertanam saat
bundel diaktifkan. OpenClaw membersihkan kunci penggantian shell sebelum menerapkannya:

- `shellPath`
- `shellCommandPrefix`

#### LSP OpenClaw tertanam

- Bundel Claude yang diaktifkan dapat menyediakan konfigurasi server LSP.
- OpenClaw memuat `.lsp.json` beserta jalur `lspServers` yang dideklarasikan dalam manifes.
- Konfigurasi LSP bundel digabungkan ke nilai bawaan LSP OpenClaw
  tertanam yang efektif.
- Saat ini, hanya server LSP berbasis stdio yang didukung yang dapat dijalankan; transportasi
  yang tidak didukung tetap muncul dalam `openclaw plugins inspect <id>`.

### Terdeteksi tetapi tidak dijalankan

Berikut ini dikenali dan ditampilkan dalam diagnostik, tetapi tidak dijalankan oleh OpenClaw:

- `agents`, otomatisasi `hooks/hooks.json`, dan `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, dan `.cursor/rules` Cursor
- Metadata `.app.json` Codex selain pelaporan kemampuan

## Format bundel

<AccordionGroup>
  <Accordion title="Bundel Codex">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundel Codex paling sesuai dengan OpenClaw jika menggunakan akar Skills dan direktori
    paket hook bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundel Claude">
    Dua mode deteksi:

    - **Berbasis manifes:** `.claude-plugin/plugin.json`
    - **Tanpa manifes:** tata letak bawaan Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten Skills
    - `settings.json` diimpor ke pengaturan OpenClaw tertanam (kunci penggantian shell dibersihkan)
    - `.mcp.json` menyediakan alat stdio yang didukung kepada OpenClaw tertanam
    - `.lsp.json` beserta jalur `lspServers` yang dideklarasikan dalam manifes dimuat ke nilai bawaan LSP OpenClaw tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dijalankan
    - Jalur komponen khusus dalam manifes bersifat aditif; jalur tersebut memperluas nilai bawaan, bukan menggantikannya

  </Accordion>

  <Accordion title="Bundel Cursor">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten Skills
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw terlebih dahulu memeriksa format plugin native:

1. `openclaw.plugin.json` atau `package.json` yang valid dengan `openclaw.extensions`—diperlakukan sebagai **plugin native**
2. Penanda bundel (`.codex-plugin/`, `.claude-plugin/`, atau tata letak bawaan Claude/Cursor)—diperlakukan sebagai **bundel**

Jika sebuah direktori memuat keduanya, OpenClaw menggunakan jalur native. Hal ini mencegah
paket berformat ganda terpasang sebagian sebagai bundel.

## Dependensi runtime dan pembersihan

- Bundel kompatibel pihak ketiga tidak mendapatkan perbaikan `npm install` saat memulai. Bundel tersebut
  harus dipasang melalui `openclaw plugins install` dan menyertakan semua yang
  diperlukan dalam direktori plugin yang terpasang.
- Plugin terbundel milik OpenClaw disertakan dalam bentuk ringan di inti atau
  dapat diunduh melalui pemasang plugin. Saat dimulai, Gateway tidak pernah menjalankan
  pengelola paket untuk plugin tersebut.
- `openclaw doctor --fix` menghapus catatan pemasangan plugin terbundel lokal yang usang
  dan dapat memulihkan plugin yang dapat diunduh tetapi tidak ada dalam indeks plugin
  lokal saat konfigurasi masih merujuknya.

## Keamanan

Bundel memiliki batas kepercayaan yang lebih sempit daripada plugin native:

- OpenClaw **tidak** memuat modul runtime bundel arbitrer di dalam proses.
- Jalur Skills dan paket hook harus tetap berada di dalam akar plugin (dengan pemeriksaan batas).
- Berkas pengaturan dibaca dengan pemeriksaan batas yang sama.
- Server MCP stdio yang didukung dapat dijalankan sebagai subproses.

Hal ini membuat bundel lebih aman secara bawaan, tetapi Anda tetap harus memperlakukan bundel
pihak ketiga sebagai konten tepercaya untuk fitur yang disediakannya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundel terdeteksi tetapi kemampuan tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika suatu kemampuan tercantum tetapi ditandai
    belum terhubung, itu adalah batasan produk, bukan pemasangan yang rusak.
  </Accordion>

  <Accordion title="Berkas perintah Claude tidak muncul">
    Pastikan bundel diaktifkan dan berkas Markdown berada di dalam akar
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak diterapkan">
    Hanya pengaturan OpenClaw tertanam dari `settings.json` yang didukung. OpenClaw
    tidak memperlakukan pengaturan bundel sebagai tambalan konfigurasi mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dijalankan">
    `hooks/hooks.json` hanya dideteksi. Jika memerlukan hook yang dapat dijalankan, gunakan
    tata letak paket hook OpenClaw atau distribusikan plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Memasang dan Mengonfigurasi Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins)—membuat plugin native
- [Manifes Plugin](/id/plugins/manifest)—skema manifes native
