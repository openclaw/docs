---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi yang dimiliki Plugin
summary: Referensi CLI untuk `openclaw migrate` (impor status dari sistem agen lain)
title: Migrasi
x-i18n:
    generated_at: "2026-05-10T19:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor status dari sistem agen lain melalui penyedia migrasi yang dimiliki plugin. Penyedia bawaan mencakup status Codex CLI, [Claude](/id/install/migrating-claude), dan [Hermes](/id/install/migrating-hermes); plugin pihak ketiga dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan yang ditujukan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude) dan [Bermigrasi dari Hermes](/id/install/migrating-hermes). [Hub migrasi](/id/install/migrating) mencantumkan semua jalur.
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
  Bangun rencana dan keluar tanpa mengubah status.
</ParamField>
<ParamField path="--from <path>" type="string">
  Timpa direktori status sumber. Hermes secara default menggunakan `~/.hermes`.
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
<ParamField path="--plugin <name>" type="string">
  Pilih satu item pemasangan plugin Codex berdasarkan nama plugin atau id item. Ulangi flag untuk memigrasikan beberapa plugin Codex. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang plugin Codex native dan migrasi noninteraktif mempertahankan semua plugin yang direncanakan. Ini hanya berlaku untuk plugin Codex `openai-curated` yang dipasang dari sumber dan ditemukan oleh inventaris app-server Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati pencadangan sebelum penerapan. Memerlukan `--force` ketika status OpenClaw lokal ada.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib bersama `--no-backup` ketika penerapan sebaliknya akan menolak melewati pencadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil penerapan sebagai JSON. Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status.
</ParamField>

## Model keamanan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum penerapan">
    Penyedia mengembalikan rencana terperinci sebelum apa pun berubah, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, output penerapan, dan laporan migrasi menyamarkan kunci bersarang yang tampak seperti rahasia, seperti kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` mempratinjau rencana dan meminta konfirmasi sebelum mengubah status kecuali `--yes` ditetapkan. Dalam mode noninteraktif, penerapan memerlukan `--yes`.

  </Accordion>
  <Accordion title="Cadangan">
    Penerapan membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada status OpenClaw lokal, langkah pencadangan dilewati dan migrasi dapat dilanjutkan. Untuk melewati cadangan ketika status ada, berikan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Penerapan menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan ulang dengan `--overwrite` jika penggantian target yang sudah ada memang disengaja. Penyedia masih dapat menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Rahasia tidak pernah diimpor secara default. Gunakan `--include-secrets` untuk mengimpor kredensial yang didukung.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi status Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor home atau root proyek Claude Code tertentu.

<Tip>
Untuk panduan yang ditujukan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Apa yang diimpor Claude

- `CLAUDE.md` proyek dan `.claude/CLAUDE.md` ke dalam ruang kerja agen OpenClaw.
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` ruang kerja.
- Definisi server MCP dari `.mcp.json` proyek, Claude Code `~/.claude.json`, dan Claude Desktop `claude_desktop_config.json`.
- Direktori skill Claude yang menyertakan `SKILL.md`.
- File Markdown perintah Claude dikonversi menjadi skill OpenClaw dengan pemanggilan manual saja.

### Status arsip dan tinjauan manual

Hook, izin, default lingkungan, memori lokal, aturan berbasis cakupan path, subagen, cache, rencana, dan riwayat proyek Claude dipertahankan dalam laporan migrasi atau dilaporkan sebagai item tinjauan manual. OpenClaw tidak mengeksekusi hook, menyalin allowlist luas, atau mengimpor status kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi status Codex CLI di `~/.codex` secara default, atau
di `CODEX_HOME` ketika variabel lingkungan tersebut ditetapkan. Gunakan `--from <path>` untuk
menginventarisasi home Codex tertentu.

Gunakan penyedia ini saat berpindah ke harness Codex OpenClaw dan Anda ingin
mempromosikan aset Codex CLI pribadi yang berguna secara sengaja. Peluncuran
app-server Codex lokal menggunakan direktori `CODEX_HOME` dan `HOME` per agen,
sehingga secara default tidak membaca status Codex CLI pribadi Anda.

Menjalankan `openclaw migrate codex` di terminal interaktif mempratinjau seluruh
rencana, lalu membuka pemilih kotak centang sebelum konfirmasi penerapan final. Item
salinan skill diminta terlebih dahulu. Gunakan `Toggle all on` atau `Toggle all off` untuk pemilihan
massal; skill yang direncanakan dimulai dalam keadaan tercentang, skill konflik dimulai tidak tercentang, dan
`Skip for now` melewati salinan skill untuk eksekusi ini sambil tetap melanjutkan ke pemilihan
plugin. Ketika plugin Codex curated yang dipasang dari sumber dapat dimigrasikan dan
`--plugin` tidak diberikan, migrasi kemudian meminta aktivasi plugin Codex native
berdasarkan nama plugin. Item plugin
dimulai dalam keadaan tercentang kecuali konfigurasi plugin Codex OpenClaw target sudah memiliki
plugin tersebut. Plugin target yang sudah ada dimulai tidak tercentang dan menampilkan petunjuk konflik seperti
`conflict: plugin exists`; pilih `Toggle all off` untuk tidak memigrasikan plugin Codex native
dalam eksekusi itu, atau `Skip for now` untuk berhenti sebelum menerapkan. Untuk eksekusi skrip atau
presisi, berikan `--skill <name>` sekali per skill, misalnya:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gunakan `--plugin <name>` untuk membatasi migrasi plugin Codex native secara noninteraktif
ke satu atau beberapa plugin curated yang dipasang dari sumber:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Apa yang diimpor Codex

- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, tidak termasuk cache
  `.system` milik Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke ruang kerja
  agen OpenClaw saat ini ketika Anda menginginkan kepemilikan per agen.
- Plugin Codex `openai-curated` yang dipasang dari sumber dan ditemukan melalui
  app-server `plugin/list` Codex. Penerapan memanggil app-server `plugin/install` untuk setiap
  plugin yang dipilih, bahkan jika app-server target sudah melaporkan plugin tersebut sebagai
  terpasang dan aktif. Plugin Codex yang dimigrasikan hanya dapat digunakan dalam sesi yang
  memilih harness Codex native; plugin tersebut tidak diekspos ke Pi, eksekusi provider OpenAI
  normal, binding percakapan ACP, atau harness lain.

### Status Codex tinjauan manual

`config.toml` Codex, `hooks/hooks.json` native, marketplace non-curated, dan
bundel plugin yang di-cache yang bukan plugin curated yang dipasang dari sumber tidak
diaktifkan secara otomatis. Semuanya disalin atau dilaporkan dalam laporan migrasi untuk
tinjauan manual.

Untuk plugin curated yang dipasang dari sumber dan dimigrasikan, penerapan menulis:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- satu entri plugin eksplisit dengan `marketplaceName: "openai-curated"` dan
  `pluginName` untuk setiap plugin yang dipilih

Migrasi tidak pernah menulis `plugins["*"]` dan tidak pernah menyimpan path cache marketplace
lokal. Pemasangan yang memerlukan auth dilaporkan pada item plugin yang terdampak dengan
`status: "skipped"`, `reason: "auth_required"`, dan identifier aplikasi yang sudah disanitasi.
Entri konfigurasi eksplisitnya ditulis dalam keadaan nonaktif sampai Anda melakukan otorisasi ulang dan
mengaktifkannya. Kegagalan pemasangan lain menjadi hasil `error` berbasis item.

Jika inventaris plugin app-server Codex tidak tersedia selama perencanaan, migrasi
beralih ke item advisori bundel cache alih-alih menggagalkan seluruh
migrasi.

## Penyedia Hermes

Penyedia Hermes bawaan mendeteksi status di `~/.hermes` secara default. Gunakan `--from <path>` ketika Hermes berada di tempat lain.

### Apa yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Provider model yang dikonfigurasi dan endpoint yang kompatibel dengan OpenAI khusus dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke dalam ruang kerja agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori ruang kerja.
- Default konfigurasi memori untuk memori file OpenClaw, ditambah item arsip atau tinjauan manual untuk provider memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai konfigurasi per skill dari `skills.config`.
- Kunci API yang didukung dari `.env`, hanya dengan `--include-secrets`.

### Kunci `.env` yang didukung

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Status arsip saja

Status Hermes yang tidak dapat ditafsirkan OpenClaw dengan aman disalin ke dalam laporan migrasi untuk tinjauan manual, tetapi tidak dimuat ke dalam konfigurasi atau kredensial OpenClaw live. Ini mempertahankan status buram atau tidak aman tanpa berpura-pura bahwa OpenClaw dapat mengeksekusi atau memercayainya secara otomatis:

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

Pada runtime, plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Core memiliki orkestrasi CLI, kebijakan pencadangan, prompt, output JSON, dan preflight konflik. Core meneruskan rencana yang sudah ditinjau ke `apply(ctx, plan)`, dan penyedia hanya dapat membangun ulang rencana ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk konstruksi item dan hitungan ringkasan, ditambah `openclaw/plugin-sdk/migration-runtime` untuk salinan file sadar konflik, salinan laporan arsip saja, wrapper config-runtime cache, dan laporan migrasi.

## Integrasi onboarding

Onboarding dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Reset konfigurasi, kredensial, sesi, dan workspace terlebih dahulu jika Anda sudah memiliki state lokal. Impor dengan pencadangan-lalu-timpa atau penggabungan dibatasi oleh feature gate untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan langkah demi langkah untuk pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan langkah demi langkah untuk pengguna.
- [Bermigrasi](/id/install/migrating): memindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugins](/id/tools/plugin): instalasi dan pendaftaran plugin.
