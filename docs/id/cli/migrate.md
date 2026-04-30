---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi milik Plugin
summary: Referensi CLI untuk `openclaw migrate` (impor keadaan dari sistem agen lain)
title: Migrasi
x-i18n:
    generated_at: "2026-04-30T20:05:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor status dari sistem agen lain melalui penyedia migrasi milik Plugin. Penyedia bawaan mencakup status Codex CLI, [Claude](/id/install/migrating-claude), dan [Hermes](/id/install/migrating-hermes); Plugin pihak ketiga dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan yang ditujukan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude) dan [Bermigrasi dari Hermes](/id/install/migrating-hermes). [Hub migrasi](/id/install/migrating) mencantumkan semua jalur.
</Tip>

## Perintah

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
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
  Buat rencana dan keluar tanpa mengubah status.
</ParamField>
<ParamField path="--from <path>" type="string">
  Timpa direktori status sumber. Default Hermes adalah `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Impor kredensial yang didukung. Nonaktif secara default.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Izinkan penerapan mengganti target yang sudah ada ketika rencana melaporkan konflik.
</ParamField>
<ParamField path="--yes" type="boolean">
  Lewati prompt konfirmasi. Wajib dalam mode noninteraktif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Pilih satu item salinan skill berdasarkan nama skill atau id item. Ulangi flag untuk memigrasikan beberapa skill. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang dan migrasi noninteraktif mempertahankan semua skill yang direncanakan.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati cadangan sebelum penerapan. Memerlukan `--force` ketika status OpenClaw lokal ada.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib bersama `--no-backup` ketika penerapan seharusnya menolak melewati cadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil penerapan sebagai JSON. Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak memutasi status.
</ParamField>

## Model keamanan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum penerapan">
    Penyedia mengembalikan rencana terperinci sebelum apa pun berubah, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, output penerapan, dan laporan migrasi menyunting kunci bertingkat yang tampak seperti rahasia, seperti kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` menampilkan pratinjau rencana dan meminta konfirmasi sebelum mengubah status kecuali `--yes` disetel. Dalam mode noninteraktif, penerapan memerlukan `--yes`.

  </Accordion>
  <Accordion title="Cadangan">
    Penerapan membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada status OpenClaw lokal, langkah cadangan dilewati dan migrasi dapat berlanjut. Untuk melewati cadangan ketika status ada, berikan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Penerapan menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan ulang dengan `--overwrite` jika mengganti target yang sudah ada memang disengaja. Penyedia masih dapat menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Rahasia tidak pernah diimpor secara default. Gunakan `--include-secrets` untuk mengimpor kredensial yang didukung.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi status Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor home Claude Code atau root proyek tertentu.

<Tip>
Untuk panduan yang ditujukan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Yang diimpor Claude

- `CLAUDE.md` proyek dan `.claude/CLAUDE.md` ke dalam ruang kerja agen OpenClaw.
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` ruang kerja.
- Definisi server MCP dari `.mcp.json` proyek, `~/.claude.json` Claude Code, dan `claude_desktop_config.json` Claude Desktop.
- Direktori skill Claude yang menyertakan `SKILL.md`.
- File Markdown perintah Claude yang dikonversi menjadi skill OpenClaw dengan pemanggilan manual saja.

### Status arsip dan tinjauan manual

Hook, izin, default lingkungan, memori lokal, aturan berbasis cakupan path, subagen, cache, rencana, dan riwayat proyek Claude dipertahankan dalam laporan migrasi atau dilaporkan sebagai item tinjauan manual. OpenClaw tidak menjalankan hook, menyalin allowlist luas, atau mengimpor status kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi status Codex CLI di `~/.codex` secara default, atau
di `CODEX_HOME` ketika variabel lingkungan itu disetel. Gunakan `--from <path>` untuk
menginventarisasi home Codex tertentu.

Gunakan penyedia ini ketika berpindah ke harness Codex OpenClaw dan Anda ingin
mempromosikan aset pribadi Codex CLI yang berguna secara sengaja. Peluncuran
server aplikasi Codex lokal menggunakan direktori `CODEX_HOME` dan `HOME` per agen,
sehingga peluncuran tersebut tidak membaca status pribadi Codex CLI Anda secara default.

Menjalankan `openclaw migrate codex` di terminal interaktif menampilkan pratinjau rencana
lengkap, lalu membuka pemilih kotak centang untuk item salinan skill sebelum konfirmasi
penerapan akhir. Semua skill dipilih di awal; hapus centang pada skill apa pun yang tidak ingin
disalin ke agen ini. Untuk proses skrip atau eksekusi persis, berikan `--skill <name>` satu kali
per skill, misalnya:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Yang diimpor Codex

- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, tidak termasuk cache
  `.system` Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke ruang kerja agen
  OpenClaw saat ini ketika Anda menginginkan kepemilikan per agen.

### Status Codex tinjauan manual

Plugin native Codex, `config.toml`, dan `hooks/hooks.json` native tidak
diaktifkan secara otomatis. Plugin dapat mengekspos server MCP, aplikasi, hook, atau perilaku
eksekusi lainnya, sehingga penyedia melaporkannya untuk ditinjau alih-alih memuatnya
ke dalam OpenClaw. File config dan hook disalin ke laporan migrasi
untuk tinjauan manual.

## Penyedia Hermes

Penyedia Hermes bawaan mendeteksi status di `~/.hermes` secara default. Gunakan `--from <path>` ketika Hermes berada di tempat lain.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke dalam ruang kerja agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori ruang kerja.
- Default konfigurasi memori untuk memori file OpenClaw, ditambah item arsip atau tinjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai config per skill dari `skills.config`.
- Kunci API yang didukung dari `.env`, hanya dengan `--include-secrets`.

### Kunci `.env` yang didukung

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Status arsip saja

Status Hermes yang tidak dapat ditafsirkan OpenClaw dengan aman disalin ke laporan migrasi untuk tinjauan manual, tetapi tidak dimuat ke config atau kredensial OpenClaw langsung. Ini mempertahankan status buram atau tidak aman tanpa berpura-pura bahwa OpenClaw dapat mengeksekusi atau mempercayainya secara otomatis:

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

## Kontrak Plugin

Sumber migrasi adalah Plugin. Sebuah Plugin mendeklarasikan id penyedianya di `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Saat runtime, Plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Core memiliki orkestrasi CLI, kebijakan cadangan, prompt, output JSON, dan preflight konflik. Core meneruskan rencana yang telah ditinjau ke `apply(ctx, plan)`, dan penyedia dapat membangun ulang rencana hanya ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk konstruksi item dan jumlah ringkasan, ditambah `openclaw/plugin-sdk/migration-runtime` untuk salinan file yang sadar konflik, salinan laporan khusus arsip, wrapper config-runtime yang di-cache, dan laporan migrasi.

## Integrasi onboarding

Onboarding dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi Plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Reset config, kredensial, sesi, dan ruang kerja terlebih dahulu jika Anda sudah memiliki status lokal. Cadangan-plus-timpa atau impor gabungan dibatasi fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan yang ditujukan bagi pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan yang ditujukan bagi pengguna.
- [Bermigrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugin](/id/tools/plugin): pemasangan dan pendaftaran Plugin.
