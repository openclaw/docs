---
read_when:
    - Anda ingin menginstal bundle yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundle ke fitur native
    - Anda sedang men-debug deteksi bundle atau kapabilitas yang hilang
summary: Instal dan gunakan bundle Codex, Claude, dan Cursor sebagai plugin OpenClaw
title: Bundle Plugin
x-i18n:
    generated_at: "2026-04-05T14:01:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundle Plugin

OpenClaw dapat menginstal plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundle** — paket konten dan metadata yang
OpenClaw petakan ke fitur native seperti skills, hooks, dan tool MCP.

<Info>
  Bundle **tidak** sama dengan plugin OpenClaw native. Plugin native berjalan
  di dalam proses dan dapat mendaftarkan kapabilitas apa pun. Bundle adalah paket konten dengan
  pemetaan fitur yang selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundle ada

Banyak plugin berguna dipublikasikan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan penulis menulis ulang semuanya sebagai plugin OpenClaw native, OpenClaw
mendeteksi format ini dan memetakan konten yang didukung ke kumpulan fitur native.
Ini berarti Anda dapat menginstal paket perintah Claude atau bundle skill Codex
dan langsung menggunakannya.

## Instal sebuah bundle

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

## Yang dipetakan OpenClaw dari bundle

Tidak semua fitur bundle berjalan di OpenClaw saat ini. Berikut adalah yang
sudah berfungsi dan yang terdeteksi tetapi belum terhubung.

### Saat ini didukung

| Fitur         | Cara pemetaannya                                                                          | Berlaku untuk  |
| ------------- | ----------------------------------------------------------------------------------------- | -------------- |
| Konten skill  | Root skill bundle dimuat sebagai skill OpenClaw normal                                    | Semua format   |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                       | Claude, Cursor |
| Paket hook    | Tata letak `HOOK.md` + `handler.ts` bergaya OpenClaw                                      | Codex          |
| Tool MCP      | Config MCP bundle digabungkan ke pengaturan Pi tertanam; server stdio dan HTTP yang didukung dimuat | Semua format   |
| Server LSP    | `.lsp.json` Claude dan `lspServers` yang dideklarasikan di manifest digabungkan ke default LSP Pi tertanam | Claude         |
| Pengaturan    | `settings.json` Claude diimpor sebagai default Pi tertanam                                | Claude         |

#### Konten skill

- root skill bundle dimuat sebagai root skill OpenClaw normal
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Ini berarti file perintah markdown Claude berfungsi melalui loader skill OpenClaw
normal. Markdown perintah Cursor berfungsi melalui jalur yang sama.

#### Paket hook

- root hook bundle **hanya** berfungsi ketika menggunakan tata letak paket hook OpenClaw
  normal. Saat ini ini terutama berlaku untuk kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundle yang diaktifkan dapat menyumbangkan config server MCP
- OpenClaw menggabungkan config MCP bundle ke pengaturan Pi tertanam yang efektif sebagai
  `mcpServers`
- OpenClaw mengekspos tool MCP bundle yang didukung selama giliran agen Pi tertanam dengan
  meluncurkan server stdio atau terhubung ke server HTTP
- pengaturan Pi lokal proyek tetap berlaku setelah default bundle, sehingga pengaturan
  workspace dapat mengoverride entri MCP bundle bila diperlukan
- katalog tool MCP bundle diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan `listTools()` upstream tidak mengacaukan blok tool prompt-cache

##### Transport

Server MCP dapat menggunakan transport stdio atau HTTP:

**Stdio** meluncurkan child process:

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

- `transport` dapat disetel ke `"streamable-http"` atau `"sse"`; bila dihilangkan, OpenClaw menggunakan `sse`
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus akan ditolak
- kredensial URL (userinfo dan parameter kueri) direduksi dari deskripsi
  tool dan log
- `connectionTimeoutMs` mengoverride timeout koneksi default 30 detik untuk
  transport stdio maupun HTTP

##### Penamaan tool

OpenClaw mendaftarkan tool MCP bundle dengan nama aman-provider dalam bentuk
`serverName__toolName`. Misalnya, server dengan key `"vigil-harbor"` yang mengekspos
tool `memory_search` akan didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- prefix server dibatasi hingga 30 karakter
- nama tool penuh dibatasi hingga 64 karakter
- nama server kosong akan fallback ke `mcp`
- nama yang telah disanitasi dan bertabrakan akan dibedakan dengan suffix numerik
- urutan tool final yang diekspos bersifat deterministik berdasarkan nama aman agar giliran Pi
  berulang tetap stabil untuk cache

#### Pengaturan Pi tertanam

- `settings.json` Claude diimpor sebagai pengaturan Pi tertanam default ketika
  bundle diaktifkan
- OpenClaw menyanitasi key override shell sebelum menerapkannya

Key yang disanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tertanam

- bundle Claude yang diaktifkan dapat menyumbangkan config server LSP
- OpenClaw memuat `.lsp.json` ditambah jalur `lspServers` yang dideklarasikan manifest
- config LSP bundle digabungkan ke default LSP Pi tertanam yang efektif
- saat ini hanya server LSP berbasis stdio yang didukung yang dapat dijalankan; transport yang tidak didukung
  tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dijalankan

Semua ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- `agents` Claude, otomatisasi `hooks.json`, `outputStyles`
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- metadata inline/app Codex di luar pelaporan kapabilitas

## Format bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex paling cocok dengan OpenClaw ketika menggunakan root skill dan
    direktori paket hook bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Dua mode deteksi:

    - **Berbasis manifest:** `.claude-plugin/plugin.json`
    - **Tanpa manifest:** tata letak default Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan Pi tertanam (key override shell disanitasi)
    - `.mcp.json` mengekspos tool stdio yang didukung ke Pi tertanam
    - `.lsp.json` ditambah jalur `lspServers` yang dideklarasikan manifest dimuat ke default LSP Pi tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dijalankan
    - jalur komponen kustom dalam manifest bersifat aditif (menambah default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` yang valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin native**
2. Penanda bundle (`.codex-plugin/`, `.claude-plugin/`, atau tata letak default Claude/Cursor) — diperlakukan sebagai **bundle**

Jika suatu direktori berisi keduanya, OpenClaw menggunakan jalur native. Ini mencegah
package format ganda diinstal sebagian sebagai bundle.

## Keamanan

Bundle memiliki batas kepercayaan yang lebih sempit dibandingkan plugin native:

- OpenClaw **tidak** memuat modul runtime bundle arbitrer di dalam proses
- Jalur skill dan paket hook harus tetap berada di dalam root plugin (dicek batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subprocess

Ini membuat bundle lebih aman secara default, tetapi Anda tetap harus memperlakukan bundle
pihak ketiga sebagai konten tepercaya untuk fitur yang memang mereka ekspos.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundle terdeteksi tetapi kapabilitas tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika sebuah kapabilitas tercantum tetapi ditandai
    belum terhubung, itu adalah batasan produk — bukan instalasi yang rusak.
  </Accordion>

  <Accordion title="File perintah Claude tidak muncul">
    Pastikan bundle diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak berlaku">
    Hanya pengaturan Pi tertanam dari `settings.json` yang didukung. OpenClaw
    tidak memperlakukan pengaturan bundle sebagai patch config mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dijalankan">
    `hooks/hooks.json` hanya dideteksi. Jika Anda membutuhkan hook yang dapat dijalankan, gunakan
    tata letak paket hook OpenClaw atau kirim sebagai plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Instal dan Konfigurasikan Plugin](/tools/plugin)
- [Membangun Plugin](/plugins/building-plugins) — membuat plugin native
- [Manifest Plugin](/plugins/manifest) — skema manifest native
