---
read_when:
    - Anda ingin memasang bundel yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundel ke fitur asli
    - Anda sedang menelusuri masalah deteksi bundel atau kemampuan yang hilang
summary: Instal dan gunakan bundel Codex, Claude, dan Cursor sebagai Plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw dapat memasang plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundel** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur asli seperti skill, hook, dan alat MCP.

<Info>
  Bundel **tidak** sama dengan plugin asli OpenClaw. Plugin asli berjalan
  dalam proses dan dapat mendaftarkan kemampuan apa pun. Bundel adalah paket
  konten dengan pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundel ada

Banyak plugin berguna diterbitkan dalam format Codex, Claude, atau Cursor. Alih-alih
mewajibkan penulis menulis ulangnya sebagai plugin asli OpenClaw, OpenClaw
mendeteksi format ini dan memetakan konten yang didukung ke dalam kumpulan fitur
asli. Ini berarti Anda dapat memasang paket perintah Claude atau bundel skill Codex
dan langsung menggunakannya.

## Memasang bundel

<Steps>
  <Step title="Pasang dari direktori, arsip, atau marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verifikasi deteksi">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundel tampil sebagai `Format: bundle` dengan subtipe `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Mulai ulang dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (skill, hook, alat MCP, default LSP) tersedia pada sesi berikutnya.

  </Step>
</Steps>

## Yang dipetakan OpenClaw dari bundel

Tidak semua fitur bundel berjalan di OpenClaw saat ini. Berikut ini yang berfungsi dan yang
terdeteksi tetapi belum dirangkai.

### Didukung sekarang

| Fitur         | Cara pemetaannya                                                                            | Berlaku untuk  |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Konten skill  | Root skill bundel dimuat sebagai skill OpenClaw biasa                                       | Semua format   |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                         | Claude, Cursor |
| Paket hook    | Tata letak `HOOK.md` + `handler.ts` bergaya OpenClaw                                        | Codex          |
| Alat MCP      | Konfigurasi MCP bundel digabungkan ke pengaturan Pi tersemat; server stdio dan HTTP yang didukung dimuat | Semua format   |
| Server LSP    | `.lsp.json` Claude dan `lspServers` yang dideklarasikan manifest digabungkan ke default LSP Pi tersemat | Claude         |
| Pengaturan    | `settings.json` Claude diimpor sebagai default Pi tersemat                                  | Claude         |

#### Konten skill

- root skill bundel dimuat sebagai root skill OpenClaw biasa
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Ini berarti file perintah markdown Claude bekerja melalui pemuat skill OpenClaw
biasa. Markdown perintah Cursor bekerja melalui jalur yang sama.

#### Paket hook

- root hook bundel bekerja **hanya** saat menggunakan tata letak paket hook
  OpenClaw biasa. Saat ini ini terutama kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundel yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundel ke pengaturan Pi tersemat efektif sebagai
  `mcpServers`
- OpenClaw mengekspos alat MCP bundel yang didukung selama giliran agen Pi tersemat dengan
  meluncurkan server stdio atau menghubungkan ke server HTTP
- profil alat `coding` dan `messaging` menyertakan alat MCP bundel secara
  default; gunakan `tools.deny: ["bundle-mcp"]` untuk menolak ikut bagi agen atau gateway
- pengaturan Pi lokal proyek tetap berlaku setelah default bundel, sehingga pengaturan
  workspace dapat menimpa entri MCP bundel bila diperlukan
- katalog alat MCP bundel diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan `listTools()` upstream tidak mengacaukan blok alat cache prompt

##### Transport

Server MCP dapat menggunakan transport stdio atau HTTP:

**Stdio** meluncurkan proses anak:

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

**HTTP** terhubung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` bila diminta:

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

- `transport` dapat diatur ke `"streamable-http"` atau `"sse"`; bila dihilangkan, OpenClaw menggunakan `sse`
- `type: "http"` adalah bentuk downstream asli CLI; gunakan `transport: "streamable-http"` dalam konfigurasi OpenClaw. `openclaw mcp set` dan `openclaw doctor --fix` menormalkan alias umum tersebut.
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus ditolak
- kredensial URL (userinfo dan parameter kueri) disamarkan dari deskripsi alat
  dan log
- `connectionTimeoutMs` menimpa batas waktu koneksi default 30 detik untuk
  transport stdio maupun HTTP

##### Penamaan alat

OpenClaw mendaftarkan alat MCP bundel dengan nama yang aman untuk provider dalam bentuk
`serverName__toolName`. Misalnya, server dengan kunci `"vigil-harbor"` yang mengekspos alat
`memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- fragmen yang akan dimulai dengan non-huruf mendapatkan awalan huruf, sehingga kunci
  server numerik seperti `12306` menjadi prefiks alat yang aman untuk provider
- prefiks server dibatasi hingga 30 karakter
- nama alat penuh dibatasi hingga 64 karakter
- nama server kosong menggunakan fallback `mcp`
- nama hasil sanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan alat akhir yang diekspos bersifat deterministik berdasarkan nama aman untuk menjaga giliran
  Pi berulang tetap stabil untuk cache
- pemfilteran profil memperlakukan semua alat dari satu server MCP bundel sebagai milik plugin
  oleh `bundle-mcp`, sehingga allowlist dan daftar penolakan profil dapat menyertakan
  nama alat terekspos individual atau kunci plugin `bundle-mcp`

#### Pengaturan Pi tersemat

- `settings.json` Claude diimpor sebagai pengaturan Pi tersemat default saat
  bundel diaktifkan
- OpenClaw menyanitasi kunci override shell sebelum menerapkannya

Kunci yang disanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tersemat

- bundel Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` ditambah path `lspServers` apa pun yang dideklarasikan manifest
- konfigurasi LSP bundel digabungkan ke default LSP Pi tersemat efektif
- hanya server LSP yang didukung dan berbasis stdio yang dapat dijalankan saat ini; transport
  yang tidak didukung tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dieksekusi

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- `agents`, otomatisasi `hooks.json`, `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- metadata inline/aplikasi Codex di luar pelaporan kemampuan

## Format bundel

<AccordionGroup>
  <Accordion title="Bundel Codex">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundel Codex paling cocok dengan OpenClaw saat menggunakan root skill dan direktori
    paket hook bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundel Claude">
    Dua mode deteksi:

    - **Berbasis manifest:** `.claude-plugin/plugin.json`
    - **Tanpa manifest:** tata letak Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan Pi tersemat (kunci override shell disanitasi)
    - `.mcp.json` mengekspos alat stdio yang didukung ke Pi tersemat
    - `.lsp.json` ditambah path `lspServers` yang dideklarasikan manifest dimuat ke default LSP Pi tersemat
    - `hooks/hooks.json` terdeteksi tetapi tidak dieksekusi
    - Path komponen khusus dalam manifest bersifat aditif (memperluas default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Bundel Cursor">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format plugin asli terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin asli**
2. Penanda bundel (`.codex-plugin/`, `.claude-plugin/`, atau tata letak Claude/Cursor default) — diperlakukan sebagai **bundel**

Jika direktori memuat keduanya, OpenClaw menggunakan jalur asli. Ini mencegah
paket format ganda dipasang sebagian sebagai bundel.

## Dependensi runtime dan pembersihan

- Bundel kompatibel pihak ketiga tidak mendapatkan perbaikan `npm install` saat startup. Bundel
  harus dipasang melalui `openclaw plugins install` dan membawa semua yang
  dibutuhkannya di direktori plugin yang terpasang.
- Plugin bundel milik OpenClaw dikirim ringan di core atau
  dapat diunduh melalui pemasang plugin. Startup Gateway tidak pernah menjalankan
  package manager untuknya.
- `openclaw doctor --fix` menghapus direktori dependensi staged lama dan dapat
  memulihkan plugin yang dapat diunduh yang hilang dari indeks plugin lokal saat
  konfigurasi merujuknya.

## Keamanan

Bundel memiliki batas kepercayaan yang lebih sempit daripada plugin asli:

- OpenClaw **tidak** memuat modul runtime bundel arbitrer dalam proses
- Path skill dan paket hook harus tetap berada di dalam root plugin (diperiksa batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subprocess

Ini membuat bundel lebih aman secara default, tetapi Anda tetap harus memperlakukan bundel
pihak ketiga sebagai konten tepercaya untuk fitur yang memang mereka ekspos.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundel terdeteksi tetapi kemampuan tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika kemampuan terdaftar tetapi ditandai sebagai
    belum dirangkai, itu adalah batas produk — bukan pemasangan yang rusak.
  </Accordion>

  <Accordion title="File perintah Claude tidak muncul">
    Pastikan bundel diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak diterapkan">
    Hanya pengaturan Pi tersemat dari `settings.json` yang didukung. OpenClaw tidak
    memperlakukan pengaturan bundel sebagai patch konfigurasi mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dieksekusi">
    `hooks/hooks.json` hanya dideteksi. Jika Anda membutuhkan hook yang dapat dijalankan, gunakan
    tata letak paket hook OpenClaw atau kirim plugin asli.
  </Accordion>
</AccordionGroup>

## Terkait

- [Memasang dan Mengonfigurasi Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins) — membuat plugin asli
- [Manifest Plugin](/id/plugins/manifest) — skema manifest asli
