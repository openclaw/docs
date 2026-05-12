---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi milik Plugin
summary: Referensi CLI untuk `openclaw migrate` (impor status dari sistem agen lain)
title: Migrasi
x-i18n:
    generated_at: "2026-05-12T00:58:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor state dari sistem agen lain melalui penyedia migrasi milik plugin. Penyedia bawaan mencakup state Codex CLI, [Claude](/id/install/migrating-claude), dan [Hermes](/id/install/migrating-hermes); plugin pihak ketiga dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude) dan [Bermigrasi dari Hermes](/id/install/migrating-hermes). [Hub migrasi](/id/install/migrating) mencantumkan semua jalur.
</Tip>

## Perintah

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
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
  Buat rencana dan keluar tanpa mengubah state.
</ParamField>
<ParamField path="--from <path>" type="string">
  Timpa direktori state sumber. Hermes secara default menggunakan `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Impor kredensial yang didukung. Nonaktif secara default.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Izinkan apply mengganti target yang ada ketika rencana melaporkan konflik.
</ParamField>
<ParamField path="--yes" type="boolean">
  Lewati prompt konfirmasi. Wajib dalam mode non-interaktif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Pilih satu item salinan skill berdasarkan nama skill atau id item. Ulangi flag untuk memigrasikan beberapa skill. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang dan migrasi non-interaktif mempertahankan semua skill yang direncanakan.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Pilih satu item pemasangan plugin Codex berdasarkan nama plugin atau id item. Ulangi flag untuk memigrasikan beberapa plugin Codex. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang plugin Codex native dan migrasi non-interaktif mempertahankan semua plugin yang direncanakan. Ini hanya berlaku untuk plugin Codex `openai-curated` yang terpasang dari sumber dan ditemukan oleh inventaris app-server Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati pencadangan sebelum apply. Memerlukan `--force` ketika state OpenClaw lokal ada.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib bersama `--no-backup` ketika apply seharusnya menolak melewati pencadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil apply sebagai JSON. Dengan `--json` dan tanpa `--yes`, apply mencetak rencana dan tidak memutasi state.
</ParamField>

## Model keamanan

`openclaw migrate` mendahulukan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum apply">
    Penyedia mengembalikan rencana terperinci sebelum apa pun berubah, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, output apply, dan laporan migrasi menyunting kunci bertingkat yang tampak seperti rahasia, seperti kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` menampilkan pratinjau rencana dan meminta konfirmasi sebelum mengubah state kecuali `--yes` ditetapkan. Dalam mode non-interaktif, apply memerlukan `--yes`.

  </Accordion>
  <Accordion title="Pencadangan">
    Apply membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada state OpenClaw lokal, langkah pencadangan dilewati dan migrasi dapat berlanjut. Untuk melewati pencadangan ketika state ada, berikan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Apply menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan ulang dengan `--overwrite` jika penggantian target yang ada memang disengaja. Penyedia mungkin tetap menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Rahasia tidak pernah diimpor secara default. Gunakan `--include-secrets` untuk mengimpor kredensial yang didukung.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi state Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor home Claude Code atau root proyek tertentu.

<Tip>
Untuk panduan pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Yang diimpor Claude

- `CLAUDE.md` proyek dan `.claude/CLAUDE.md` ke dalam workspace agen OpenClaw.
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` workspace.
- Definisi server MCP dari `.mcp.json` proyek, `~/.claude.json` Claude Code, dan `claude_desktop_config.json` Claude Desktop.
- Direktori skill Claude yang menyertakan `SKILL.md`.
- File Markdown perintah Claude yang dikonversi menjadi skill OpenClaw hanya dengan pemanggilan manual.

### State arsip dan tinjauan manual

Hook, izin, default lingkungan, memori lokal, aturan berdasarkan cakupan path, subagen, cache, rencana, dan riwayat proyek Claude dipertahankan dalam laporan migrasi atau dilaporkan sebagai item tinjauan manual. OpenClaw tidak menjalankan hook, menyalin allowlist luas, atau mengimpor state kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi state Codex CLI di `~/.codex` secara default, atau
di `CODEX_HOME` ketika variabel lingkungan tersebut ditetapkan. Gunakan `--from <path>` untuk
menginventarisasi home Codex tertentu.

Gunakan penyedia ini saat berpindah ke harness Codex OpenClaw dan Anda ingin
mempromosikan aset Codex CLI pribadi yang berguna secara sengaja. Peluncuran app-server
Codex lokal menggunakan direktori `CODEX_HOME` dan `HOME` per agen, sehingga secara default
tidak membaca state Codex CLI pribadi Anda.

Menjalankan `openclaw migrate codex` di terminal interaktif menampilkan pratinjau rencana
lengkap, lalu membuka pemilih kotak centang sebelum konfirmasi apply akhir. Item salinan skill
diminta terlebih dahulu. Gunakan `Toggle all on` atau `Toggle all off` untuk pemilihan massal;
skill yang direncanakan mulai dalam keadaan dicentang, skill konflik mulai tidak dicentang, dan
`Skip for now` melewati salinan skill untuk proses ini sambil tetap melanjutkan ke pemilihan
plugin. Ketika plugin Codex curated yang terpasang dari sumber dapat dimigrasikan dan
`--plugin` tidak diberikan, migrasi kemudian meminta aktivasi plugin Codex native
berdasarkan nama plugin. Item plugin
mulai dicentang kecuali konfigurasi plugin Codex OpenClaw target sudah memiliki
plugin tersebut. Plugin target yang ada mulai tidak dicentang dan menampilkan petunjuk konflik seperti
`conflict: plugin exists`; pilih `Toggle all off` untuk tidak memigrasikan plugin Codex
native dalam proses itu, atau `Skip for now` untuk berhenti sebelum menerapkan. Untuk proses skrip atau
tepat, berikan `--skill <name>` sekali per skill, misalnya:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gunakan `--plugin <name>` untuk membatasi migrasi plugin Codex native secara non-interaktif
ke satu atau beberapa plugin curated yang terpasang dari sumber:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Yang diimpor Codex

- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, tidak termasuk cache
  `.system` milik Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke workspace agen
  OpenClaw saat ini ketika Anda menginginkan kepemilikan per agen.
- Plugin Codex `openai-curated` yang terpasang dari sumber dan ditemukan melalui
  `plugin/list` app-server Codex. Apply memanggil `plugin/install` app-server untuk setiap
  plugin yang dipilih, bahkan jika app-server target sudah melaporkan plugin tersebut
  terpasang dan aktif. Plugin Codex yang dimigrasikan hanya dapat digunakan dalam sesi yang
  memilih harness Codex native; plugin tersebut tidak diekspos ke Pi, proses penyedia OpenAI
  normal, binding percakapan ACP, atau harness lain.

### State Codex tinjauan manual

`config.toml` Codex, `hooks/hooks.json` native, marketplace non-curated, dan
bundle plugin ter-cache yang bukan plugin curated yang terpasang dari sumber tidak
diaktifkan secara otomatis. Semuanya disalin atau dilaporkan dalam laporan migrasi untuk
tinjauan manual.

Untuk plugin curated yang terpasang dari sumber dan dimigrasikan, apply menulis:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- satu entri plugin eksplisit dengan `marketplaceName: "openai-curated"` dan
  `pluginName` untuk setiap plugin yang dipilih

Migrasi tidak pernah menulis `plugins["*"]` dan tidak pernah menyimpan path cache marketplace
lokal. Pemasangan yang memerlukan autentikasi dilaporkan pada item plugin terdampak dengan
`status: "skipped"`, `reason: "auth_required"`, dan pengidentifikasi aplikasi yang disanitasi.
Entri konfigurasi eksplisitnya ditulis dalam keadaan nonaktif sampai Anda mengotorisasi ulang dan
mengaktifkannya. Kegagalan pemasangan lainnya menjadi hasil `error` yang dibatasi pada item.

Jika inventaris plugin app-server Codex tidak tersedia selama perencanaan, migrasi
beralih ke item advisori bundle ter-cache alih-alih menggagalkan seluruh
migrasi.

## Penyedia Hermes

Penyedia Hermes bawaan mendeteksi state di `~/.hermes` secara default. Gunakan `--from <path>` ketika Hermes berada di tempat lain.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke dalam workspace agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori workspace.
- Default konfigurasi memori untuk memori file OpenClaw, plus item arsip atau tinjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai konfigurasi per skill dari `skills.config`.
- Kunci API yang didukung dari `.env`, hanya dengan `--include-secrets`.

### Kunci `.env` yang didukung

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### State hanya arsip

State Hermes yang tidak dapat ditafsirkan dengan aman oleh OpenClaw disalin ke laporan migrasi untuk tinjauan manual, tetapi tidak dimuat ke konfigurasi atau kredensial OpenClaw aktif. Ini mempertahankan state yang buram atau tidak aman tanpa berpura-pura bahwa OpenClaw dapat menjalankan atau memercayainya secara otomatis:

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

Sumber migrasi adalah plugin. Plugin mendeklarasikan id penyedianya di `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Saat runtime, plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Core memiliki orkestrasi CLI, kebijakan pencadangan, prompt, output JSON, dan preflight konflik. Core meneruskan rencana yang telah ditinjau ke `apply(ctx, plan)`, dan penyedia dapat membangun ulang rencana hanya ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk konstruksi item dan hitungan ringkasan, plus `openclaw/plugin-sdk/migration-runtime` untuk salinan file yang sadar konflik, salinan laporan hanya arsip, wrapper config-runtime ter-cache, dan laporan migrasi.

## Integrasi onboarding

Onboarding dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Reset konfigurasi, kredensial, sesi, dan workspace terlebih dahulu jika Anda sudah memiliki state lokal. Impor backup-plus-overwrite atau merge dibatasi oleh gerbang fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Migrasi dari Hermes](/id/install/migrating-hermes): panduan langkah demi langkah untuk pengguna.
- [Migrasi dari Claude](/id/install/migrating-claude): panduan langkah demi langkah untuk pengguna.
- [Bermigrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugin](/id/tools/plugin): instalasi dan pendaftaran plugin.
