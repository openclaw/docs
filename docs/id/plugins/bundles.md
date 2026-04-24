---
read_when:
    - Anda ingin menginstal bundel yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundel ke fitur native
    - Anda sedang men-debug deteksi bundel atau kapabilitas yang hilang
summary: Instal dan gunakan bundel Codex, Claude, dan Cursor sebagai Plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-04-24T09:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw dapat menginstal plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundles** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti skills, hooks, dan tool MCP.

<Info>
  Bundle **tidak** sama dengan Plugin OpenClaw native. Plugin native berjalan
  in-process dan dapat mendaftarkan kapabilitas apa pun. Bundle adalah paket konten dengan
  pemetaan fitur yang selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundle ada

Banyak plugin berguna dipublikasikan dalam format Codex, Claude, atau Cursor. Alih-alih
mewajibkan penulis menulis ulang semuanya sebagai Plugin OpenClaw native, OpenClaw
mendeteksi format-format ini dan memetakan konten yang didukung ke set fitur native.
Ini berarti Anda dapat menginstal paket perintah Claude atau bundle skill Codex
dan langsung menggunakannya.

## Instal bundle

<Steps>
  <Step title="Instal dari direktori, arsip, atau marketplace">
    ```bash
    # Direktori lokal
    openclaw plugins install ./my-bundle

    # Arsip
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verifikasi deteksi">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundle ditampilkan sebagai `Format: bundle` dengan subtype `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Restart dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (skills, hooks, tool MCP, default LSP) tersedia pada sesi berikutnya.

  </Step>
</Steps>

## Apa yang dipetakan OpenClaw dari bundle

Tidak semua fitur bundle dijalankan di OpenClaw saat ini. Berikut ini yang berfungsi dan yang
terdeteksi tetapi belum terhubung.

### Didukung sekarang

| Fitur         | Cara pemetaannya                                                                             | Berlaku untuk   |
| ------------- | -------------------------------------------------------------------------------------------- | --------------- |
| Konten skill  | Root skill bundle dimuat sebagai skill OpenClaw normal                                       | Semua format    |
| Commands      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                          | Claude, Cursor  |
| Hook packs    | Tata letak `HOOK.md` + `handler.ts` bergaya OpenClaw                                         | Codex           |
| Tool MCP      | Konfigurasi MCP bundle digabung ke pengaturan Pi tertanam; server stdio dan HTTP yang didukung dimuat | Semua format |
| Server LSP    | Claude `.lsp.json` dan `lspServers` yang dideklarasikan manifest digabung ke default LSP Pi tertanam | Claude |
| Pengaturan    | Claude `settings.json` diimpor sebagai default Pi tertanam                                   | Claude          |

#### Konten skill

- root skill bundle dimuat sebagai root skill OpenClaw normal
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Ini berarti file perintah markdown Claude berfungsi melalui loader skill OpenClaw normal.
Markdown perintah Cursor berfungsi melalui jalur yang sama.

#### Hook packs

- root hook bundle hanya berfungsi **hanya** ketika menggunakan tata letak hook-pack OpenClaw normal.
  Saat ini ini terutama kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundle yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundle ke pengaturan Pi tertanam efektif sebagai
  `mcpServers`
- OpenClaw menampilkan tool MCP bundle yang didukung selama giliran agen Pi tertanam dengan
  menjalankan server stdio atau terhubung ke server HTTP
- profil tool `coding` dan `messaging` secara default menyertakan tool MCP bundle;
  gunakan `tools.deny: ["bundle-mcp"]` untuk opt out bagi agen atau gateway
- pengaturan Pi lokal proyek tetap berlaku setelah default bundle, sehingga pengaturan
  workspace dapat menimpa entri MCP bundle bila diperlukan
- katalog tool MCP bundle diurutkan secara deterministik sebelum registrasi, sehingga
  perubahan urutan `listTools()` upstream tidak membuat block tool prompt-cache bergejolak

##### Transport

Server MCP dapat menggunakan transport stdio atau HTTP:

**Stdio** menjalankan child process:

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

**HTTP** terhubung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` jika diminta:

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

- `transport` dapat disetel ke `"streamable-http"` atau `"sse"`; jika dihilangkan, OpenClaw menggunakan `sse`
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server yang memiliki `command` dan `url` sekaligus akan ditolak
- kredensial URL (userinfo dan query param) disamarkan dari deskripsi
  tool dan log
- `connectionTimeoutMs` menimpa timeout koneksi default 30 detik untuk
  transport stdio maupun HTTP

##### Penamaan tool

OpenClaw mendaftarkan tool MCP bundle dengan nama aman-provider dalam bentuk
`serverName__toolName`. Misalnya, server dengan key `"vigil-harbor"` yang menampilkan
tool `memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- prefix server dibatasi hingga 30 karakter
- nama tool penuh dibatasi hingga 64 karakter
- nama server kosong fallback ke `mcp`
- nama hasil sanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan tool akhir yang ditampilkan bersifat deterministik berdasarkan nama aman agar giliran Pi berulang tetap stabil terhadap cache
- pemfilteran profil memperlakukan semua tool dari satu server MCP bundle sebagai milik plugin
  `bundle-mcp`, sehingga allowlist dan deny list profil dapat menyertakan
  nama tool individual yang ditampilkan maupun key plugin `bundle-mcp`

#### Pengaturan Pi tertanam

- Claude `settings.json` diimpor sebagai pengaturan Pi tertanam default ketika
  bundle diaktifkan
- OpenClaw menyanitasi key override shell sebelum menerapkannya

Key yang disanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tertanam

- bundle Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` ditambah path `lspServers` yang dideklarasikan manifest
- konfigurasi LSP bundle digabung ke default LSP Pi tertanam yang efektif
- saat ini hanya server LSP berbasis stdio yang didukung yang dapat dijalankan; transport yang tidak didukung
  tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dijalankan

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- Claude `agents`, otomatisasi `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadata inline/app Codex di luar pelaporan kapabilitas

## Format bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex paling cocok dengan OpenClaw ketika menggunakan root skill dan
    direktori hook-pack bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Dua mode deteksi:

    - **Berbasis manifest:** `.claude-plugin/plugin.json`
    - **Tanpa manifest:** tata letak Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan Pi tertanam (key override shell disanitasi)
    - `.mcp.json` menampilkan tool stdio yang didukung ke Pi tertanam
    - `.lsp.json` ditambah path `lspServers` yang dideklarasikan manifest dimuat ke default LSP Pi tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dijalankan
    - path komponen kustom dalam manifest bersifat aditif (memperluas default, bukan menggantinya)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya untuk deteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin native**
2. Marker bundle (`.codex-plugin/`, `.claude-plugin/`, atau tata letak default Claude/Cursor) — diperlakukan sebagai **bundle**

Jika sebuah direktori mengandung keduanya, OpenClaw menggunakan jalur native. Ini mencegah
paket dual-format diinstal sebagian sebagai bundle.

## Dependensi runtime dan pembersihan

- Dependensi runtime plugin bawaan dikirim di dalam paket OpenClaw di bawah
  `dist/*`. OpenClaw **tidak** menjalankan `npm install` saat startup untuk plugin
  bawaan; pipeline rilis bertanggung jawab mengirim payload dependensi bawaan yang lengkap (lihat aturan verifikasi postpublish di
  [Releasing](/id/reference/RELEASING)).

## Keamanan

Bundle memiliki batas kepercayaan yang lebih sempit dibanding Plugin native:

- OpenClaw **tidak** memuat modul runtime bundle arbitrer secara in-process
- Path skill dan hook-pack harus tetap berada di dalam root plugin (diperiksa batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat dijalankan sebagai subproses

Ini membuat bundle lebih aman secara default, tetapi Anda tetap harus memperlakukan bundle pihak ketiga sebagai konten tepercaya untuk fitur yang memang mereka tampilkan.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundle terdeteksi tetapi kapabilitas tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika sebuah kapabilitas tercantum tetapi ditandai sebagai
    not wired, itu adalah batas produk — bukan instalasi yang rusak.
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
    `hooks/hooks.json` hanya untuk deteksi. Jika Anda memerlukan hook yang dapat dijalankan, gunakan
    tata letak hook-pack OpenClaw atau kirim Plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Install and Configure Plugins](/id/tools/plugin)
- [Building Plugins](/id/plugins/building-plugins) — membuat Plugin native
- [Plugin Manifest](/id/plugins/manifest) — skema manifest native
