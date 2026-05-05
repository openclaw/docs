---
read_when:
    - Anda ingin menginstal paket yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundel ke fitur bawaan
    - Anda sedang men-debug deteksi bundel atau kapabilitas yang hilang
summary: Instal dan gunakan bundle Codex, Claude, dan Cursor sebagai Plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-05-05T01:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw dapat menginstal Plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundle** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti skill, hook, dan tool MCP.

<Info>
  Bundle **tidak** sama dengan Plugin native OpenClaw. Plugin native berjalan
  dalam proses dan dapat mendaftarkan kemampuan apa pun. Bundle adalah paket konten dengan
  pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundle ada

Banyak Plugin berguna diterbitkan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan pembuatnya menulis ulang sebagai Plugin native OpenClaw, OpenClaw
mendeteksi format ini dan memetakan konten yang didukung ke kumpulan fitur
native. Ini berarti Anda dapat menginstal paket perintah Claude atau bundle skill Codex
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

    Bundle ditampilkan sebagai `Format: bundle` dengan subtipe `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Mulai ulang dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (skill, hook, tool MCP, default LSP) tersedia di sesi berikutnya.

  </Step>
</Steps>

## Yang dipetakan OpenClaw dari bundle

Tidak semua fitur bundle berjalan di OpenClaw saat ini. Berikut yang berfungsi dan yang
terdeteksi tetapi belum dihubungkan.

### Didukung sekarang

| Fitur         | Cara pemetaannya                                                                            | Berlaku untuk  |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Konten skill  | Root skill bundle dimuat sebagai skill OpenClaw normal                                      | Semua format   |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                         | Claude, Cursor |
| Paket hook    | Tata letak `HOOK.md` + `handler.ts` bergaya OpenClaw                                        | Codex          |
| Tool MCP      | Konfigurasi MCP bundle digabungkan ke pengaturan Pi tertanam; server stdio dan HTTP yang didukung dimuat | Semua format   |
| Server LSP    | `.lsp.json` Claude dan `lspServers` yang dideklarasikan manifes digabungkan ke default LSP Pi tertanam | Claude         |
| Pengaturan    | `settings.json` Claude diimpor sebagai default Pi tertanam                                  | Claude         |

#### Konten skill

- root skill bundle dimuat sebagai root skill OpenClaw normal
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Ini berarti file perintah markdown Claude bekerja melalui pemuat skill OpenClaw
normal. Markdown perintah Cursor bekerja melalui jalur yang sama.

#### Paket hook

- root hook bundle berfungsi **hanya** saat menggunakan tata letak hook-pack
  OpenClaw normal. Saat ini ini terutama kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundle yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundle ke pengaturan Pi tertanam efektif sebagai
  `mcpServers`
- OpenClaw mengekspos tool MCP bundle yang didukung selama giliran agen Pi tertanam dengan
  meluncurkan server stdio atau tersambung ke server HTTP
- profil tool `coding` dan `messaging` menyertakan tool MCP bundle secara
  default; gunakan `tools.deny: ["bundle-mcp"]` untuk tidak ikut serta bagi agen atau Gateway
- pengaturan Pi lokal proyek tetap berlaku setelah default bundle, sehingga pengaturan
  workspace dapat menimpa entri MCP bundle saat diperlukan
- katalog tool MCP bundle diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan `listTools()` upstream tidak mengacaukan blok tool cache prompt

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

**HTTP** tersambung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` saat diminta:

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

- `transport` dapat diatur ke `"streamable-http"` atau `"sse"`; saat dihilangkan, OpenClaw menggunakan `sse`
- `type: "http"` adalah bentuk downstream native CLI; gunakan `transport: "streamable-http"` dalam konfigurasi OpenClaw. `openclaw mcp set` dan `openclaw doctor --fix` menormalkan alias umum.
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus ditolak
- kredensial URL (userinfo dan parameter kueri) disamarkan dari deskripsi tool
  dan log
- `connectionTimeoutMs` menimpa timeout koneksi default 30 detik untuk
  transport stdio dan HTTP

##### Penamaan tool

OpenClaw mendaftarkan tool MCP bundle dengan nama yang aman untuk penyedia dalam bentuk
`serverName__toolName`. Misalnya, server dengan kunci `"vigil-harbor"` yang mengekspos tool
`memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- prefiks server dibatasi hingga 30 karakter
- nama tool lengkap dibatasi hingga 64 karakter
- nama server kosong menggunakan fallback `mcp`
- nama tersanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan tool akhir yang diekspos deterministik berdasarkan nama aman untuk menjaga giliran Pi
  berulang tetap stabil terhadap cache
- pemfilteran profil memperlakukan semua tool dari satu server MCP bundle sebagai milik Plugin
  oleh `bundle-mcp`, sehingga allowlist dan daftar deny profil dapat menyertakan
  nama tool terekspos individual atau kunci Plugin `bundle-mcp`

#### Pengaturan Pi tertanam

- `settings.json` Claude diimpor sebagai pengaturan Pi tertanam default saat
  bundle diaktifkan
- OpenClaw membersihkan kunci override shell sebelum menerapkannya

Kunci yang dibersihkan:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tertanam

- bundle Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` plus jalur `lspServers` yang dideklarasikan manifes
- konfigurasi LSP bundle digabungkan ke default LSP Pi tertanam yang efektif
- hanya server LSP berbasis stdio yang didukung yang dapat dijalankan saat ini; transport yang tidak didukung
  tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dieksekusi

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- `agents`, otomasi `hooks.json`, `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- metadata inline/app Codex di luar pelaporan kemampuan

## Format bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex paling cocok dengan OpenClaw saat menggunakan root skill dan direktori
    hook-pack bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Dua mode deteksi:

    - **Berbasis manifes:** `.claude-plugin/plugin.json`
    - **Tanpa manifes:** tata letak Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan Pi tertanam (kunci override shell dibersihkan)
    - `.mcp.json` mengekspos tool stdio yang didukung ke Pi tertanam
    - `.lsp.json` plus jalur `lspServers` yang dideklarasikan manifes dimuat ke default LSP Pi tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dieksekusi
    - Jalur komponen kustom dalam manifes bersifat aditif (memperluas default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format Plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` yang valid dengan `openclaw.extensions` — diperlakukan sebagai **Plugin native**
2. Penanda bundle (`.codex-plugin/`, `.claude-plugin/`, atau tata letak Claude/Cursor default) — diperlakukan sebagai **bundle**

Jika sebuah direktori berisi keduanya, OpenClaw menggunakan jalur native. Ini mencegah
paket format ganda diinstal sebagian sebagai bundle.

## Dependensi runtime dan pembersihan

- Bundle kompatibel pihak ketiga tidak mendapatkan perbaikan `npm install` saat startup. Bundle tersebut
  harus diinstal melalui `openclaw plugins install` dan menyertakan semua yang
  dibutuhkan di direktori Plugin terinstal.
- Plugin bundle milik OpenClaw dikirim ringan di core atau
  dapat diunduh melalui penginstal Plugin. Startup Gateway tidak pernah menjalankan
  manajer paket untuknya.
- `openclaw doctor --fix` menghapus direktori dependensi staged lama dan dapat
  memulihkan Plugin yang dapat diunduh yang hilang dari indeks Plugin lokal saat
  konfigurasi merujuknya.

## Keamanan

Bundle memiliki batas kepercayaan yang lebih sempit daripada Plugin native:

- OpenClaw **tidak** memuat modul runtime bundle arbitrer dalam proses
- Skills dan jalur hook-pack harus tetap berada di dalam root Plugin (diperiksa batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subprocess

Ini membuat bundle lebih aman secara default, tetapi Anda tetap harus memperlakukan bundle
pihak ketiga sebagai konten tepercaya untuk fitur yang dieksposnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundle terdeteksi tetapi kemampuan tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika sebuah kemampuan tercantum tetapi ditandai sebagai
    belum dihubungkan, itu adalah batasan produk — bukan instalasi yang rusak.
  </Accordion>

  <Accordion title="File perintah Claude tidak muncul">
    Pastikan bundle diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak diterapkan">
    Hanya pengaturan Pi tertanam dari `settings.json` yang didukung. OpenClaw tidak
    memperlakukan pengaturan bundle sebagai patch konfigurasi mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dieksekusi">
    `hooks/hooks.json` hanya dideteksi. Jika Anda membutuhkan hook yang dapat dijalankan, gunakan
    tata letak hook-pack OpenClaw atau kirim Plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Instal dan Konfigurasi Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin native
- [Manifes Plugin](/id/plugins/manifest) — skema manifes native
