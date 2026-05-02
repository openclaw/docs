---
read_when:
    - Anda ingin menginstal bundel yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundel ke fitur bawaan
    - Anda sedang menelusuri masalah deteksi bundel atau kemampuan yang hilang
summary: Instal dan gunakan bundel Codex, Claude, dan Cursor sebagai Plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-05-02T09:26:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw dapat menginstal plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundles** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti skills, hooks, dan alat MCP.

<Info>
  Bundles **tidak** sama dengan plugin native OpenClaw. Plugin native berjalan
  dalam proses dan dapat mendaftarkan capability apa pun. Bundles adalah paket konten dengan
  pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundles ada

Banyak plugin berguna diterbitkan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan pembuat menulis ulang plugin tersebut sebagai plugin native OpenClaw, OpenClaw
mendeteksi format ini dan memetakan konten yang didukungnya ke rangkaian fitur
native. Artinya, Anda dapat menginstal paket perintah Claude atau bundle skill Codex
dan langsung menggunakannya.

## Instal bundle

<Steps>
  <Step title="Instal dari direktori, arsip, atau marketplace">
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

    Bundles ditampilkan sebagai `Format: bundle` dengan subtype `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Mulai ulang dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (skills, hooks, alat MCP, default LSP) tersedia di sesi berikutnya.

  </Step>
</Steps>

## Apa yang dipetakan OpenClaw dari bundles

Tidak setiap fitur bundle berjalan di OpenClaw saat ini. Berikut yang berfungsi dan yang
terdeteksi tetapi belum dihubungkan.

### Didukung saat ini

| Fitur         | Cara pemetaannya                                                                             | Berlaku untuk  |
| ------------- | -------------------------------------------------------------------------------------------- | -------------- |
| Konten skill  | Root skill bundle dimuat sebagai skill OpenClaw normal                                       | Semua format   |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                          | Claude, Cursor |
| Paket hook    | Layout `HOOK.md` + `handler.ts` bergaya OpenClaw                                             | Codex          |
| Alat MCP      | Konfigurasi MCP bundle digabungkan ke pengaturan Pi tertanam; server stdio dan HTTP yang didukung dimuat | Semua format   |
| Server LSP    | `.lsp.json` Claude dan `lspServers` yang dideklarasikan manifest digabungkan ke default LSP Pi tertanam | Claude         |
| Pengaturan    | `settings.json` Claude diimpor sebagai default Pi tertanam                                   | Claude         |

#### Konten skill

- root skill bundle dimuat sebagai root skill OpenClaw normal
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Artinya file perintah markdown Claude bekerja melalui loader skill OpenClaw
normal. Markdown perintah Cursor bekerja melalui jalur yang sama.

#### Paket hook

- root hook bundle berfungsi **hanya** ketika menggunakan layout hook-pack OpenClaw
  normal. Saat ini ini terutama kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundle yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundle ke pengaturan Pi tertanam efektif sebagai
  `mcpServers`
- OpenClaw mengekspos alat MCP bundle yang didukung selama giliran agen Pi tertanam dengan
  meluncurkan server stdio atau menyambung ke server HTTP
- profil alat `coding` dan `messaging` menyertakan alat MCP bundle secara
  default; gunakan `tools.deny: ["bundle-mcp"]` untuk menolak ikut serta bagi agen atau gateway
- pengaturan Pi lokal proyek tetap berlaku setelah default bundle, sehingga pengaturan
  workspace dapat mengganti entri MCP bundle saat diperlukan
- katalog alat MCP bundle diurutkan secara deterministik sebelum pendaftaran, sehingga
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

**HTTP** tersambung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` jika diminta:

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
- `type: "http"` adalah bentuk hilir native CLI; gunakan `transport: "streamable-http"` dalam konfigurasi OpenClaw. `openclaw mcp set` dan `openclaw doctor --fix` menormalkan alias umum.
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus ditolak
- kredensial URL (userinfo dan parameter kueri) disamarkan dari deskripsi alat
  dan log
- `connectionTimeoutMs` mengganti timeout koneksi default 30 detik untuk
  transport stdio dan HTTP

##### Penamaan alat

OpenClaw mendaftarkan alat MCP bundle dengan nama yang aman untuk provider dalam bentuk
`serverName__toolName`. Misalnya, server dengan key `"vigil-harbor"` yang mengekspos
alat `memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- prefiks server dibatasi hingga 30 karakter
- nama alat lengkap dibatasi hingga 64 karakter
- nama server kosong fallback ke `mcp`
- nama tersanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan alat akhir yang diekspos deterministik berdasarkan nama aman agar giliran Pi
  berulang tetap stabil cache
- pemfilteran profil memperlakukan semua alat dari satu server MCP bundle sebagai milik plugin
  oleh `bundle-mcp`, sehingga allowlist dan daftar deny profil dapat menyertakan
  nama alat terekspos individual atau key plugin `bundle-mcp`

#### Pengaturan Pi tertanam

- `settings.json` Claude diimpor sebagai pengaturan Pi tertanam default saat
  bundle diaktifkan
- OpenClaw membersihkan key override shell sebelum menerapkannya

Key yang disanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tertanam

- bundle Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` ditambah path `lspServers` yang dideklarasikan manifest
- konfigurasi LSP bundle digabungkan ke default LSP Pi tertanam yang efektif
- hanya server LSP berbasis stdio yang didukung yang dapat dijalankan saat ini; transport
  yang tidak didukung tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dieksekusi

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- `agents`, automasi `hooks.json`, `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- metadata inline/app Codex di luar pelaporan capability

## Format bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex paling cocok dengan OpenClaw ketika menggunakan root skill dan direktori
    hook-pack bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Dua mode deteksi:

    - **Berbasis manifest:** `.claude-plugin/plugin.json`
    - **Tanpa manifest:** layout Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan Pi tertanam (key override shell disanitasi)
    - `.mcp.json` mengekspos alat stdio yang didukung ke Pi tertanam
    - `.lsp.json` ditambah path `lspServers` yang dideklarasikan manifest dimuat ke default LSP Pi tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dieksekusi
    - Path komponen kustom dalam manifest bersifat aditif (memperluas default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin native**
2. Marker bundle (`.codex-plugin/`, `.claude-plugin/`, atau layout default Claude/Cursor) — diperlakukan sebagai **bundle**

Jika direktori memuat keduanya, OpenClaw menggunakan jalur native. Ini mencegah
paket berformat ganda diinstal sebagian sebagai bundles.

## Dependensi runtime dan pembersihan

- Bundle kompatibel pihak ketiga tidak mendapatkan perbaikan `npm install` saat startup. Bundle tersebut
  harus diinstal melalui `openclaw plugins install` dan menyertakan semua yang
  dibutuhkan di direktori plugin terinstal.
- Plugin bundled milik OpenClaw dikirim ringan dalam core atau
  dapat diunduh melalui penginstal plugin. Startup Gateway tidak pernah menjalankan
  package manager untuk plugin tersebut.
- `openclaw doctor --fix` menghapus direktori dependensi staged lama dan dapat
  menginstal plugin unduhan terkonfigurasi yang hilang dari indeks plugin
  lokal.

## Keamanan

Bundles memiliki batas kepercayaan yang lebih sempit daripada plugin native:

- OpenClaw **tidak** memuat modul runtime bundle arbitrer dalam proses
- Path Skills dan hook-pack harus tetap berada di dalam root plugin (diperiksa batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subprocess

Ini membuat bundles lebih aman secara default, tetapi Anda tetap harus memperlakukan bundle
pihak ketiga sebagai konten tepercaya untuk fitur yang memang dieksposnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundle terdeteksi tetapi capability tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika capability terdaftar tetapi ditandai sebagai
    belum dihubungkan, itu adalah batas produk — bukan instalasi rusak.
  </Accordion>

  <Accordion title="File perintah Claude tidak muncul">
    Pastikan bundle diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak berlaku">
    Hanya pengaturan Pi tertanam dari `settings.json` yang didukung. OpenClaw tidak
    memperlakukan pengaturan bundle sebagai patch konfigurasi mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dieksekusi">
    `hooks/hooks.json` hanya dideteksi. Jika membutuhkan hook yang dapat berjalan, gunakan
    layout hook-pack OpenClaw atau kirim plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Instal dan Konfigurasikan Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin native
- [Manifest Plugin](/id/plugins/manifest) — skema manifest native
