---
read_when:
    - Anda ingin memasang bundel yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami cara OpenClaw memetakan konten bundel ke fitur native
    - Anda sedang memecahkan masalah deteksi bundel atau kapabilitas yang hilang
summary: Instal dan gunakan bundel Codex, Claude, dan Cursor sebagai Plugin OpenClaw
title: Bundel Plugin
x-i18n:
    generated_at: "2026-04-30T10:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw dapat menginstal plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundel** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti Skills, hook, dan alat MCP.

<Info>
  Bundel **tidak** sama dengan plugin OpenClaw native. Plugin native berjalan
  dalam proses dan dapat mendaftarkan kapabilitas apa pun. Bundel adalah paket konten dengan
  pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundel ada

Banyak plugin berguna dipublikasikan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan pembuat menulis ulang semuanya sebagai plugin OpenClaw native, OpenClaw
mendeteksi format ini dan memetakan konten yang didukung ke set fitur native.
Ini berarti Anda dapat menginstal paket perintah Claude atau bundel Skill Codex
dan langsung menggunakannya.

## Instal bundel

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

    Bundel ditampilkan sebagai `Format: bundle` dengan subtipe `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Mulai ulang dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (Skills, hook, alat MCP, default LSP) tersedia pada sesi berikutnya.

  </Step>
</Steps>

## Yang dipetakan OpenClaw dari bundel

Tidak semua fitur bundel berjalan di OpenClaw saat ini. Berikut yang berfungsi dan yang
terdeteksi tetapi belum dihubungkan.

### Didukung sekarang

| Fitur         | Cara pemetaannya                                                                          | Berlaku untuk  |
| ------------- | ------------------------------------------------------------------------------------------ | -------------- |
| Konten Skill  | Akar Skill bundel dimuat sebagai Skills OpenClaw normal                                    | Semua format   |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai akar Skill                        | Claude, Cursor |
| Paket hook    | Tata letak `HOOK.md` + `handler.ts` bergaya OpenClaw                                      | Codex          |
| Alat MCP      | Konfigurasi MCP bundel digabungkan ke pengaturan Pi tertanam; server stdio dan HTTP yang didukung dimuat | Semua format   |
| Server LSP    | `.lsp.json` Claude dan `lspServers` yang dideklarasikan manifes digabungkan ke default LSP Pi tertanam | Claude         |
| Pengaturan    | `settings.json` Claude diimpor sebagai default Pi tertanam                                 | Claude         |

#### Konten Skill

- akar Skill bundel dimuat sebagai akar Skill OpenClaw normal
- akar `commands` Claude diperlakukan sebagai akar Skill tambahan
- akar `.cursor/commands` Cursor diperlakukan sebagai akar Skill tambahan

Ini berarti file perintah markdown Claude berfungsi melalui pemuat Skill
OpenClaw normal. Markdown perintah Cursor berfungsi melalui jalur yang sama.

#### Paket hook

- akar hook bundel berfungsi **hanya** saat menggunakan tata letak paket hook
  OpenClaw normal. Saat ini ini terutama kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundel yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundel ke pengaturan Pi tertanam yang efektif sebagai
  `mcpServers`
- OpenClaw mengekspos alat MCP bundel yang didukung selama giliran agen Pi tertanam dengan
  meluncurkan server stdio atau terhubung ke server HTTP
- profil alat `coding` dan `messaging` menyertakan alat MCP bundel secara
  default; gunakan `tools.deny: ["bundle-mcp"]` untuk mengecualikannya bagi agen atau Gateway
- pengaturan Pi lokal proyek tetap diterapkan setelah default bundel, sehingga pengaturan
  ruang kerja dapat menimpa entri MCP bundel bila diperlukan
- katalog alat MCP bundel diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan `listTools()` upstream tidak mengacak blok alat cache prompt

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

**HTTP** terhubung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` saat diminta:

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
- `type: "http"` adalah bentuk hilir native CLI; gunakan `transport: "streamable-http"` dalam konfigurasi OpenClaw. `openclaw mcp set` dan `openclaw doctor --fix` menormalkan alias umum.
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus ditolak
- kredensial URL (userinfo dan parameter kueri) disunting dari deskripsi
  alat dan log
- `connectionTimeoutMs` menimpa batas waktu koneksi default 30 detik untuk
  transport stdio dan HTTP

##### Penamaan alat

OpenClaw mendaftarkan alat MCP bundel dengan nama yang aman untuk penyedia dalam bentuk
`serverName__toolName`. Misalnya, server berkunci `"vigil-harbor"` yang mengekspos
alat `memory_search` didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- prefiks server dibatasi hingga 30 karakter
- nama alat lengkap dibatasi hingga 64 karakter
- nama server kosong menggunakan fallback `mcp`
- nama tersanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan akhir alat yang diekspos bersifat deterministik berdasarkan nama aman agar giliran Pi
  berulang tetap stabil untuk cache
- pemfilteran profil memperlakukan semua alat dari satu server MCP bundel sebagai dimiliki plugin
  oleh `bundle-mcp`, sehingga daftar izinkan dan daftar tolak profil dapat menyertakan
  nama alat terekspos individual atau kunci plugin `bundle-mcp`

#### Pengaturan Pi tertanam

- `settings.json` Claude diimpor sebagai pengaturan Pi tertanam default saat
  bundel diaktifkan
- OpenClaw membersihkan kunci override shell sebelum menerapkannya

Kunci tersanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tertanam

- bundel Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` ditambah jalur `lspServers` apa pun yang dideklarasikan manifes
- konfigurasi LSP bundel digabungkan ke default LSP Pi tertanam yang efektif
- hanya server LSP berbasis stdio yang didukung yang dapat dijalankan saat ini; transport yang tidak didukung
  tetap muncul di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dijalankan

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- `agents`, otomatisasi `hooks.json`, `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- metadata inline/aplikasi Codex di luar pelaporan kapabilitas

## Format bundel

<AccordionGroup>
  <Accordion title="Bundel Codex">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundel Codex paling cocok dengan OpenClaw saat menggunakan akar Skill dan direktori
    paket hook bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundel Claude">
    Dua mode deteksi:

    - **Berbasis manifes:** `.claude-plugin/plugin.json`
    - **Tanpa manifes:** tata letak Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten Skill
    - `settings.json` diimpor ke pengaturan Pi tertanam (kunci override shell disanitasi)
    - `.mcp.json` mengekspos alat stdio yang didukung ke Pi tertanam
    - `.lsp.json` ditambah jalur `lspServers` yang dideklarasikan manifes dimuat ke default LSP Pi tertanam
    - `hooks/hooks.json` terdeteksi tetapi tidak dijalankan
    - Jalur komponen kustom dalam manifes bersifat aditif (memperluas default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Bundel Cursor">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten Skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya deteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin native**
2. Penanda bundel (`.codex-plugin/`, `.claude-plugin/`, atau tata letak default Claude/Cursor) — diperlakukan sebagai **bundel**

Jika sebuah direktori berisi keduanya, OpenClaw menggunakan jalur native. Ini mencegah
paket format ganda diinstal sebagian sebagai bundel.

## Dependensi runtime dan pembersihan

- Bundel kompatibel pihak ketiga tidak mendapatkan perbaikan `npm install` saat startup. Bundel tersebut
  harus diinstal melalui `openclaw plugins install` dan membawa semua yang
  diperlukan di direktori plugin terinstal.
- Plugin bundel terkemas milik OpenClaw memiliki pengecualian sempit: saat salah satunya
  diaktifkan, startup Gateway dapat memperbaiki dependensi runtime yang dideklarasikan tetapi hilang
  sebelum impor. Operator dapat memeriksa atau memperbaiki tahap itu dengan
  `openclaw plugins deps`.
- Pipeline rilis tetap bertanggung jawab untuk mengirim payload dependensi bundel
  yang lengkap bila memungkinkan (lihat aturan verifikasi pascapublikasi di
  [Rilis](/id/reference/RELEASING)).

## Keamanan

Bundel memiliki batas kepercayaan yang lebih sempit daripada plugin native:

- OpenClaw **tidak** memuat modul runtime bundel arbitrer dalam proses
- Jalur Skills dan paket hook harus tetap berada di dalam root plugin (diperiksa batasnya)
- File pengaturan dibaca dengan pemeriksaan batas yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subproses

Ini membuat bundel lebih aman secara default, tetapi Anda tetap harus memperlakukan bundel
pihak ketiga sebagai konten tepercaya untuk fitur yang dieksposnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundel terdeteksi tetapi kapabilitas tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika sebuah kapabilitas tercantum tetapi ditandai sebagai
    belum terhubung, itu adalah batasan produk — bukan instalasi yang rusak.
  </Accordion>

  <Accordion title="File perintah Claude tidak muncul">
    Pastikan bundel diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak diterapkan">
    Hanya pengaturan Pi tertanam dari `settings.json` yang didukung. OpenClaw tidak
    memperlakukan pengaturan bundel sebagai patch konfigurasi mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dijalankan">
    `hooks/hooks.json` hanya deteksi. Jika Anda memerlukan hook yang dapat dijalankan, gunakan tata letak
    paket hook OpenClaw atau kirimkan plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Instal dan Konfigurasi Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin native
- [Manifes Plugin](/id/plugins/manifest) — skema manifes native
