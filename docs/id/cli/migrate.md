---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi yang dimiliki Plugin
summary: Referensi CLI untuk `openclaw migrate` (impor status dari sistem agen lain)
title: Migrasi
x-i18n:
    generated_at: "2026-05-12T23:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor state dari sistem agen lain melalui penyedia migrasi milik Plugin. Penyedia bawaan mencakup state Codex CLI, [Claude](/id/install/migrating-claude), dan [Hermes](/id/install/migrating-hermes); Plugin pihak ketiga dapat mendaftarkan penyedia tambahan.

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
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  Timpa direktori state sumber. Default Hermes adalah `~/.hermes`.
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
  Pilih satu item salinan skill berdasarkan nama skill atau id item. Ulangi flag untuk memigrasikan beberapa skills. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang dan migrasi non-interaktif mempertahankan semua skills yang direncanakan.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Pilih satu item pemasangan Plugin Codex berdasarkan nama Plugin atau id item. Ulangi flag untuk memigrasikan beberapa Plugin Codex. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang Plugin Codex native dan migrasi non-interaktif mempertahankan semua Plugin yang direncanakan. Ini hanya berlaku untuk Plugin Codex `openai-curated` yang dipasang dari sumber dan ditemukan oleh inventaris app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Hanya Codex. Paksa traversal `app/list` app-server Codex sumber yang baru sebelum merencanakan aktivasi Plugin native. Nonaktif secara default agar perencanaan migrasi tetap cepat.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati cadangan pra-apply. Memerlukan `--force` ketika state OpenClaw lokal ada.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib bersama `--no-backup` ketika apply seharusnya menolak melewati cadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil apply sebagai JSON. Dengan `--json` dan tanpa `--yes`, apply mencetak rencana dan tidak memutasi state.
</ParamField>

## Model keamanan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum apply">
    Penyedia mengembalikan rencana terperinci sebelum apa pun berubah, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, output apply, dan laporan migrasi menyamarkan key bertumpuk yang terlihat seperti rahasia, seperti API key, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` menampilkan pratinjau rencana dan meminta konfirmasi sebelum mengubah state kecuali `--yes` disetel. Dalam mode non-interaktif, apply memerlukan `--yes`.

  </Accordion>
  <Accordion title="Cadangan">
    Apply membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada state OpenClaw lokal, langkah pencadangan dilewati dan migrasi dapat dilanjutkan. Untuk melewati cadangan ketika state ada, teruskan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Apply menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan ulang dengan `--overwrite` jika mengganti target yang ada memang disengaja. Penyedia masih dapat menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
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

- `CLAUDE.md` proyek dan `.claude/CLAUDE.md` ke ruang kerja agen OpenClaw.
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` ruang kerja.
- Definisi server MCP dari `.mcp.json` proyek, Claude Code `~/.claude.json`, dan Claude Desktop `claude_desktop_config.json`.
- Direktori skill Claude yang menyertakan `SKILL.md`.
- File Markdown perintah Claude dikonversi menjadi skills OpenClaw dengan invokasi manual saja.

### State arsip dan tinjauan manual

Hook Claude, izin, default lingkungan, memori lokal, aturan berbasis path, subagen, cache, rencana, dan riwayat proyek dipertahankan dalam laporan migrasi atau dilaporkan sebagai item tinjauan manual. OpenClaw tidak menjalankan hook, menyalin allowlist luas, atau mengimpor state kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi state Codex CLI di `~/.codex` secara default, atau
di `CODEX_HOME` ketika variabel lingkungan tersebut disetel. Gunakan `--from <path>` untuk
menginventarisasi home Codex tertentu.

Gunakan penyedia ini ketika berpindah ke harness Codex OpenClaw dan Anda ingin
mempromosikan aset Codex CLI pribadi yang berguna secara sengaja. Peluncuran
app-server Codex lokal menggunakan direktori `CODEX_HOME` dan `HOME` per agen,
jadi secara default tidak membaca state Codex CLI pribadi Anda.

Menjalankan `openclaw migrate codex` di terminal interaktif menampilkan pratinjau
rencana lengkap, lalu membuka pemilih kotak centang sebelum konfirmasi apply final.
Item salinan skill diminta terlebih dahulu. Gunakan `Toggle all on` atau `Toggle all off` untuk
pemilihan massal. Tekan Space untuk mengaktifkan atau menonaktifkan baris, atau tekan Enter untuk mengaktifkan
baris yang disorot dan melanjutkan. Skills yang direncanakan dimulai dalam keadaan dicentang, skills konflik dimulai tanpa centang, dan
`Skip for now` melewati salinan skill untuk eksekusi ini sambil tetap melanjutkan ke pemilihan
Plugin. Ketika Plugin Codex kurasi yang dipasang dari sumber dapat dimigrasikan dan
`--plugin` tidak diberikan, migrasi kemudian meminta aktivasi Plugin Codex native
berdasarkan nama Plugin. Item Plugin
dimulai dalam keadaan dicentang kecuali konfigurasi Plugin Codex OpenClaw target sudah memiliki
Plugin tersebut. Plugin target yang ada dimulai tanpa centang dan menampilkan petunjuk konflik seperti
`conflict: plugin exists`; pilih `Toggle all off` untuk tidak memigrasikan Plugin Codex native
dalam eksekusi itu, atau `Skip for now` untuk berhenti sebelum menerapkan. Untuk eksekusi skrip atau
tepat, teruskan `--skill <name>` sekali per skill, misalnya:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gunakan `--plugin <name>` untuk membatasi migrasi Plugin Codex native secara non-interaktif
ke satu atau beberapa Plugin kurasi yang dipasang dari sumber:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Yang diimpor Codex

- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, mengecualikan cache
  `.system` Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke ruang kerja
  agen OpenClaw saat ini ketika Anda menginginkan kepemilikan per agen.
- Plugin Codex `openai-curated` yang dipasang dari sumber dan ditemukan melalui
  `plugin/list` app-server Codex. Perencanaan membaca `plugin/read` untuk setiap
  Plugin terpasang yang diaktifkan. Plugin berbasis aplikasi memerlukan respons akun
  app-server Codex sumber berupa akun langganan ChatGPT; respons akun non-ChatGPT atau
  tidak ada dilewati dengan `codex_subscription_required`. Secara default,
  migrasi tidak memanggil `app/list` sumber, sehingga Plugin berbasis aplikasi yang lolos
  gate akun direncanakan tanpa verifikasi aksesibilitas aplikasi sumber, dan
  kegagalan transport lookup akun dilewati dengan `codex_account_unavailable`. Teruskan
  `--verify-plugin-apps` ketika Anda ingin migrasi memaksa snapshot `app/list`
  sumber yang baru dan mewajibkan setiap aplikasi yang dimiliki hadir, aktif, dan
  dapat diakses sebelum merencanakan aktivasi native. Dalam mode itu, kegagalan
  transport lookup akun berlanjut ke verifikasi inventaris aplikasi sumber. Snapshot
  inventaris aplikasi sumber disimpan dalam memori untuk proses saat ini; snapshot tersebut
  tidak ditulis ke output migrasi atau konfigurasi target. Plugin yang dinonaktifkan,
  detail Plugin yang tidak dapat dibaca, akun sumber yang dibatasi langganan, dan, ketika
  verifikasi diminta, aplikasi yang hilang, aplikasi yang dinonaktifkan, aplikasi yang tidak dapat diakses, atau
  kegagalan inventaris aplikasi sumber menjadi item manual yang dilewati dengan alasan bertipe
  alih-alih entri konfigurasi target.
  Apply memanggil `plugin/install` app-server untuk setiap Plugin memenuhi syarat yang dipilih,
  bahkan jika app-server target sudah melaporkan Plugin tersebut sebagai terpasang dan
  aktif. Plugin Codex yang dimigrasikan hanya dapat digunakan dalam sesi yang memilih
  harness Codex native; Plugin tersebut tidak diekspos ke Pi, eksekusi penyedia OpenAI normal,
  binding percakapan ACP, atau harness lain.

### State Codex tinjauan manual

`config.toml` Codex, `hooks/hooks.json` native, marketplace non-kurasi, bundle
Plugin cache yang bukan Plugin kurasi terpasang dari sumber, dan Plugin terpasang dari sumber
yang gagal gate langganan sumber tidak diaktifkan secara otomatis.
Ketika `--verify-plugin-apps` disetel, Plugin yang gagal gate inventaris aplikasi sumber
juga dilewati. Plugin tersebut disalin atau dilaporkan dalam laporan migrasi untuk
tinjauan manual.

Untuk Plugin kurasi terpasang dari sumber yang dimigrasikan, apply menulis:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- satu entri Plugin eksplisit dengan `marketplaceName: "openai-curated"` dan
  `pluginName` untuk setiap Plugin yang dipilih

Migrasi tidak pernah menulis `plugins["*"]` dan tidak pernah menyimpan path cache
marketplace lokal. Kegagalan langganan sisi sumber dilaporkan pada item manual dengan alasan
bertipe seperti `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled`, atau `plugin_read_unavailable`. Dengan `--verify-plugin-apps`,
kegagalan inventaris aplikasi sumber juga dapat muncul sebagai `app_inaccessible`,
`app_disabled`, `app_missing`, atau `app_inventory_unavailable`. Plugin yang dilewati
tidak ditulis ke konfigurasi target.
Pemasangan sisi target yang memerlukan auth dilaporkan pada item Plugin terdampak dengan
`status: "skipped"`, `reason: "auth_required"`, dan pengidentifikasi aplikasi yang disanitasi.
Entri konfigurasi eksplisitnya ditulis dalam keadaan nonaktif sampai Anda melakukan otorisasi ulang dan
mengaktifkannya. Kegagalan pemasangan lain adalah hasil `error` berbasis item.

Jika inventaris Plugin app-server Codex tidak tersedia selama perencanaan, migrasi
beralih ke item advisori bundle cache alih-alih menggagalkan seluruh
migrasi.

## Penyedia Hermes

Penyedia Hermes bawaan mendeteksi state di `~/.hermes` secara default. Gunakan `--from <path>` ketika Hermes berada di tempat lain.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke dalam ruang kerja agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori ruang kerja.
- Default konfigurasi memori untuk memori file OpenClaw, ditambah item arsip atau peninjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai konfigurasi per-Skills dari `skills.config`.
- Kunci API yang didukung dari `.env`, hanya dengan `--include-secrets`.

### Kunci `.env` yang didukung

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Status khusus arsip

Status Hermes yang tidak dapat ditafsirkan OpenClaw dengan aman disalin ke laporan migrasi untuk peninjauan manual, tetapi tidak dimuat ke konfigurasi atau kredensial OpenClaw yang aktif. Ini mempertahankan status yang buram atau tidak aman tanpa berpura-pura bahwa OpenClaw dapat menjalankan atau memercayainya secara otomatis:

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

Sumber migrasi adalah plugin. Sebuah plugin mendeklarasikan id penyedianya di `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Saat runtime, plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Core menangani orkestrasi CLI, kebijakan pencadangan, prompt, output JSON, dan prapemeriksaan konflik. Core meneruskan rencana yang sudah ditinjau ke `apply(ctx, plan)`, dan penyedia dapat membangun ulang rencana hanya ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk konstruksi item dan hitungan ringkasan, ditambah `openclaw/plugin-sdk/migration-runtime` untuk penyalinan file yang sadar konflik, penyalinan laporan khusus arsip, wrapper runtime konfigurasi yang di-cache, dan laporan migrasi.

## Integrasi onboarding

Onboarding dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Reset konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu jika Anda sudah memiliki status lokal. Impor dengan cadangan-plus-timpa atau penggabungan dibatasi fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan untuk pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan untuk pengguna.
- [Bermigrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugin](/id/tools/plugin): pemasangan dan pendaftaran plugin.
