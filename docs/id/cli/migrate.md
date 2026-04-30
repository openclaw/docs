---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi milik Plugin
summary: Referensi CLI untuk `openclaw migrate` (impor status dari sistem agen lain)
title: Migrasi
x-i18n:
    generated_at: "2026-04-30T09:40:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor status dari sistem agen lain melalui penyedia migrasi milik plugin. Penyedia bawaan mencakup [Claude](/id/install/migrating-claude) dan [Hermes](/id/install/migrating-hermes); plugin pihak ketiga dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude) dan [Bermigrasi dari Hermes](/id/install/migrating-hermes). [Hub migrasi](/id/install/migrating) mencantumkan semua jalur.
</Tip>

## Perintah

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nama penyedia migrasi terdaftar, misalnya `hermes`. Jalankan `openclaw migrate list` untuk melihat penyedia yang terpasang.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Buat rencana lalu keluar tanpa mengubah status.
</ParamField>
<ParamField path="--from <path>" type="string">
  Timpa direktori status sumber. Hermes menggunakan `~/.hermes` secara default.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Impor kredensial yang didukung. Nonaktif secara default.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Izinkan penerapan untuk mengganti target yang ada saat rencana melaporkan konflik.
</ParamField>
<ParamField path="--yes" type="boolean">
  Lewati prompt konfirmasi. Wajib dalam mode non-interaktif.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati pencadangan sebelum penerapan. Memerlukan `--force` saat status OpenClaw lokal ada.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib bersama `--no-backup` saat penerapan seharusnya menolak melewati pencadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil penerapan sebagai JSON. Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status.
</ParamField>

## Model keamanan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum menerapkan">
    Penyedia mengembalikan rencana terperinci sebelum apa pun berubah, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, output penerapan, dan laporan migrasi menyunting kunci bertingkat yang tampak seperti rahasia, seperti kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` mempratinjau rencana dan meminta konfirmasi sebelum mengubah status kecuali `--yes` ditetapkan. Dalam mode non-interaktif, penerapan memerlukan `--yes`.

  </Accordion>
  <Accordion title="Pencadangan">
    Penerapan membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada status OpenClaw lokal, langkah pencadangan dilewati dan migrasi dapat berlanjut. Untuk melewati pencadangan saat status ada, berikan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Penerapan menolak melanjutkan saat rencana memiliki konflik. Tinjau rencana, lalu jalankan ulang dengan `--overwrite` jika penggantian target yang ada memang disengaja. Penyedia mungkin tetap menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Rahasia tidak pernah diimpor secara default. Gunakan `--include-secrets` untuk mengimpor kredensial yang didukung.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi status Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor home Claude Code atau root proyek tertentu.

<Tip>
Untuk panduan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Yang diimpor Claude

- `CLAUDE.md` proyek dan `.claude/CLAUDE.md` ke dalam workspace agen OpenClaw.
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` workspace.
- Definisi server MCP dari `.mcp.json` proyek, Claude Code `~/.claude.json`, dan Claude Desktop `claude_desktop_config.json`.
- Direktori skill Claude yang menyertakan `SKILL.md`.
- File Markdown perintah Claude dikonversi menjadi skills OpenClaw dengan pemanggilan manual saja.

### Status arsip dan peninjauan manual

Hook Claude, izin, default lingkungan, memori lokal, aturan berbasis jalur, subagen, cache, rencana, dan riwayat proyek dipertahankan dalam laporan migrasi atau dilaporkan sebagai item peninjauan manual. OpenClaw tidak mengeksekusi hook, menyalin allowlist luas, atau mengimpor status kredensial OAuth/Desktop secara otomatis.

## Penyedia Hermes

Penyedia Hermes bawaan mendeteksi status di `~/.hermes` secara default. Gunakan `--from <path>` saat Hermes berada di tempat lain.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke dalam workspace agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori workspace.
- Default konfigurasi memori untuk memori file OpenClaw, plus item arsip atau peninjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai konfigurasi per skill dari `skills.config`.
- Kunci API yang didukung dari `.env`, hanya dengan `--include-secrets`.

### Kunci `.env` yang didukung

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Status hanya arsip

Status Hermes yang tidak dapat ditafsirkan dengan aman oleh OpenClaw disalin ke laporan migrasi untuk peninjauan manual, tetapi tidak dimuat ke dalam konfigurasi atau kredensial OpenClaw langsung. Ini mempertahankan status yang buram atau tidak aman tanpa berpura-pura OpenClaw dapat mengeksekusi atau memercayainya secara otomatis:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Setelah menerapkan

```bash
openclaw doctor
```

## Kontrak plugin

Sumber migrasi adalah plugin. Plugin mendeklarasikan id penyedianya di `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Saat runtime, plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Core memiliki orkestrasi CLI, kebijakan pencadangan, prompt, output JSON, dan preflight konflik. Core meneruskan rencana yang telah ditinjau ke `apply(ctx, plan)`, dan penyedia boleh membangun ulang rencana hanya saat argumen itu tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk konstruksi item dan jumlah ringkasan, plus `openclaw/plugin-sdk/migration-runtime` untuk penyalinan file yang sadar konflik, penyalinan laporan hanya arsip, wrapper config-runtime yang di-cache, dan laporan migrasi.

## Integrasi onboarding

Onboarding dapat menawarkan migrasi saat penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Reset konfigurasi, kredensial, sesi, dan workspace terlebih dahulu jika Anda sudah memiliki status lokal. Impor cadangan-plus-timpa atau impor gabungan dibatasi fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan bagi pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan bagi pengguna.
- [Bermigrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugin](/id/tools/plugin): pemasangan dan pendaftaran plugin.
