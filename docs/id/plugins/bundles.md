---
read_when:
    - Anda ingin menginstal bundel yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundel ke fitur native
    - Anda sedang men-debug deteksi bundel atau kapabilitas yang hilang
summary: Instal dan gunakan bundel Codex, Claude, dan Cursor sebagai plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw dapat memasang plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundel** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti skills, hooks, dan alat MCP.

<Info>
  Bundel **tidak** sama dengan plugin native OpenClaw. Plugin native berjalan
  dalam proses dan dapat mendaftarkan kemampuan apa pun. Bundel adalah paket konten dengan
  pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundel ada

Banyak plugin berguna dipublikasikan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan penulis menulis ulang plugin tersebut sebagai plugin native OpenClaw, OpenClaw
mendeteksi format ini dan memetakan konten yang didukung ke dalam set fitur
native. Artinya, Anda dapat memasang paket perintah Claude atau bundel skill Codex
dan langsung menggunakannya.

## Memasang bundel

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundel ditampilkan sebagai `Format: bundle` dengan subtipe `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (skills, hooks, alat MCP, default LSP) tersedia pada sesi berikutnya.

  </Step>
</Steps>

## Apa yang dipetakan OpenClaw dari bundel

Tidak semua fitur bundel berjalan di OpenClaw saat ini. Berikut yang berfungsi dan yang
terdeteksi tetapi belum dihubungkan.

### Didukung saat ini

| Fitur         | Cara pemetaannya                                                                                  | Berlaku untuk  |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Konten skill  | Root skill bundel dimuat sebagai skill OpenClaw normal                                            | Semua format   |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                               | Claude, Cursor |
| Paket hook    | Tata letak gaya OpenClaw `HOOK.md` + `handler.ts`                                                 | Codex          |
| Alat MCP      | Konfigurasi MCP bundel digabungkan ke pengaturan OpenClaw tertanam; server stdio dan HTTP yang didukung dimuat | Semua format   |
| Server LSP    | Claude `.lsp.json` dan `lspServers` yang dideklarasikan manifes digabungkan ke default LSP OpenClaw tertanam | Claude         |
| Pengaturan    | Claude `settings.json` diimpor sebagai default OpenClaw tertanam                                  | Claude         |

#### Konten skill

- root skill bundel dimuat sebagai root skill OpenClaw normal
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Artinya, file perintah markdown Claude bekerja melalui pemuat skill OpenClaw
normal. Markdown perintah Cursor bekerja melalui jalur yang sama.

#### Paket hook

- root hook bundel bekerja **hanya** ketika menggunakan tata letak paket hook
  OpenClaw normal. Saat ini, ini terutama adalah kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk OpenClaw tertanam

- bundel yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundel ke pengaturan OpenClaw tertanam efektif sebagai
  `mcpServers`
- OpenClaw mengekspos alat MCP bundel yang didukung selama giliran agen OpenClaw tertanam dengan
  meluncurkan server stdio atau terhubung ke server HTTP
- profil alat `coding` dan `messaging` menyertakan alat MCP bundel secara
  default; gunakan `tools.deny: ["bundle-mcp"]` untuk tidak mengikutsertakan agen atau gateway
- pengaturan agen tertanam lokal proyek tetap berlaku setelah default bundel, sehingga pengaturan
  workspace dapat menimpa entri MCP bundel bila diperlukan
- katalog alat MCP bundel diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan `listTools()` upstream tidak mengacak blok alat prompt-cache

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

**HTTP** terhubung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` ketika diminta:

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

- `transport` dapat diatur ke `"streamable-http"` atau `"sse"`; jika dihilangkan, OpenClaw menggunakan `sse`
- `type: "http"` adalah bentuk downstream native CLI; gunakan `transport: "streamable-http"` dalam konfigurasi OpenClaw. `openclaw mcp set` dan `openclaw doctor --fix` menormalisasi alias umum.
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus ditolak
- kredensial URL (userinfo dan parameter kueri) disunting dari deskripsi alat
  dan log
- `connectionTimeoutMs` menimpa batas waktu koneksi default 30 detik untuk
  transport stdio dan HTTP

##### Penamaan alat

OpenClaw mendaftarkan alat MCP bundel dengan nama yang aman untuk penyedia dalam bentuk
`serverName__toolName`. Misalnya, server dengan kunci `"vigil-harbor"` yang mengekspos
alat `memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- fragmen yang akan dimulai dengan nonhuruf diberi prefiks huruf, sehingga kunci
  server numerik seperti `12306` menjadi prefiks alat yang aman untuk penyedia
- prefiks server dibatasi hingga 30 karakter
- nama alat lengkap dibatasi hingga 64 karakter
- nama server kosong menggunakan fallback `mcp`
- nama hasil sanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan alat akhir yang diekspos deterministik berdasarkan nama aman agar giliran
  embedded-agent berulang tetap stabil terhadap cache
- pemfilteran profil memperlakukan semua alat dari satu server MCP bundel sebagai milik plugin
  oleh `bundle-mcp`, sehingga allowlist dan deny list profil dapat menyertakan
  nama alat terekspos individual atau kunci plugin `bundle-mcp`

#### Pengaturan OpenClaw tertanam

- Claude `settings.json` diimpor sebagai pengaturan OpenClaw tertanam default ketika
  bundel diaktifkan
- OpenClaw membersihkan kunci override shell sebelum menerapkannya

Kunci yang disanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP OpenClaw tertanam

- bundel Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` ditambah path `lspServers` apa pun yang dideklarasikan manifes
- konfigurasi LSP bundel digabungkan ke default LSP OpenClaw tertanam efektif
- hanya server LSP berbasis stdio yang didukung yang dapat dijalankan saat ini; transport
  yang tidak didukung tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dieksekusi

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- Claude `agents`, otomatisasi `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadata inline/aplikasi Codex di luar pelaporan kemampuan

## Format bundel

<AccordionGroup>
  <Accordion title="Codex bundles">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundel Codex paling cocok dengan OpenClaw ketika menggunakan root skill dan direktori
    paket hook gaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Dua mode deteksi:

    - **Berbasis manifes:** `.claude-plugin/plugin.json`
    - **Tanpa manifes:** tata letak Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan OpenClaw tertanam (kunci override shell disanitasi)
    - `.mcp.json` mengekspos alat stdio yang didukung ke OpenClaw tertanam
    - `.lsp.json` ditambah path `lspServers` yang dideklarasikan manifes dimuat ke default LSP OpenClaw tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dieksekusi
    - Path komponen khusus dalam manifes bersifat aditif (memperluas default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Cursor bundles">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Presedensi deteksi

OpenClaw memeriksa format plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin native**
2. Penanda bundel (`.codex-plugin/`, `.claude-plugin/`, atau tata letak Claude/Cursor default) — diperlakukan sebagai **bundel**

Jika direktori berisi keduanya, OpenClaw menggunakan jalur native. Ini mencegah
paket format ganda dipasang sebagian sebagai bundel.

## Dependensi runtime dan pembersihan

- Bundel kompatibel pihak ketiga tidak mendapatkan perbaikan `npm install` saat startup. Bundel tersebut
  harus dipasang melalui `openclaw plugins install` dan membawa semua yang
  diperlukan dalam direktori plugin terpasang.
- Plugin bundel milik OpenClaw dikirim ringan dalam core atau
  dapat diunduh melalui pemasang plugin. Startup Gateway tidak pernah menjalankan
  package manager untuknya.
- `openclaw doctor --fix` menghapus direktori dependensi staged lama dan dapat
  memulihkan plugin yang dapat diunduh yang hilang dari indeks plugin lokal ketika
  konfigurasi mereferensikannya.

## Keamanan

Bundel memiliki batas kepercayaan yang lebih sempit daripada plugin native:

- OpenClaw **tidak** memuat modul runtime bundel arbitrer dalam proses
- Path Skills dan paket hook harus tetap berada di dalam root plugin (diperiksa batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subprocess

Ini membuat bundel lebih aman secara default, tetapi Anda tetap harus memperlakukan bundel
pihak ketiga sebagai konten tepercaya untuk fitur yang diekspos.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Jalankan `openclaw plugins inspect <id>`. Jika suatu kemampuan tercantum tetapi ditandai
    belum dihubungkan, itu adalah batas produk — bukan instalasi yang rusak.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Pastikan bundel diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Hanya pengaturan OpenClaw tertanam dari `settings.json` yang didukung. OpenClaw tidak
    memperlakukan pengaturan bundel sebagai patch konfigurasi mentah.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` hanya dideteksi. Jika Anda memerlukan hook yang dapat dijalankan, gunakan
    tata letak paket hook OpenClaw atau kirim plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Pasang dan Konfigurasikan Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin native
- [Manifes Plugin](/id/plugins/manifest) — skema manifes native
