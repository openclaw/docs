---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda menambahkan penyedia migrasi milik plugin
summary: Referensi CLI untuk `openclaw migrate` (impor status dari sistem agen lain)
title: Migrasi
x-i18n:
    generated_at: "2026-06-27T17:19:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor status dari sistem agen lain melalui penyedia migrasi milik Plugin. Penyedia bawaan mencakup status Codex CLI, [Claude](/id/install/migrating-claude), dan [Hermes](/id/install/migrating-hermes); Plugin pihak ketiga dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan pengguna, lihat [Migrasi dari Claude](/id/install/migrating-claude) dan [Migrasi dari Hermes](/id/install/migrating-hermes). [Pusat migrasi](/id/install/migrating) mencantumkan semua jalur.
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
  Buat rencana dan keluar tanpa mengubah status.
</ParamField>
<ParamField path="--from <path>" type="string">
  Timpa direktori status sumber. Hermes secara default menggunakan `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Impor kredensial yang didukung tanpa meminta konfirmasi. Apply interaktif bertanya sebelum mengimpor kredensial autentikasi yang terdeteksi, dengan ya dipilih secara default; `--yes` non-interaktif memerlukan `--include-secrets` untuk mengimpornya.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Lewati impor kredensial autentikasi, termasuk prompt interaktif.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Izinkan apply mengganti target yang sudah ada ketika rencana melaporkan konflik.
</ParamField>
<ParamField path="--yes" type="boolean">
  Lewati prompt konfirmasi. Wajib dalam mode non-interaktif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Pilih satu item salinan skill berdasarkan nama skill atau id item. Ulangi flag untuk memigrasikan beberapa skill. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang dan migrasi non-interaktif mempertahankan semua skill yang direncanakan.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Pilih satu item pemasangan Plugin Codex berdasarkan nama Plugin atau id item. Ulangi flag untuk memigrasikan beberapa Plugin Codex. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang Plugin Codex native dan migrasi non-interaktif mempertahankan semua Plugin yang direncanakan. Ini hanya berlaku untuk Plugin Codex `openai-curated` yang dipasang dari sumber dan ditemukan oleh inventaris server aplikasi Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Hanya Codex. Paksa traversal `app/list` server aplikasi Codex sumber yang baru sebelum merencanakan aktivasi Plugin native. Nonaktif secara default agar perencanaan migrasi tetap cepat.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati cadangan pra-apply. Memerlukan `--force` ketika status OpenClaw lokal ada.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib bersama `--no-backup` ketika apply seharusnya menolak melewati cadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil apply sebagai JSON. Dengan `--json` dan tanpa `--yes`, apply mencetak rencana dan tidak mengubah status.
</ParamField>

## Model keselamatan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum apply">
    Penyedia mengembalikan rencana terperinci sebelum apa pun berubah, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, output apply, dan laporan migrasi menyunting kunci bertingkat yang tampak seperti rahasia, seperti kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` menampilkan pratinjau rencana dan meminta konfirmasi sebelum mengubah status kecuali `--yes` ditetapkan. Dalam mode non-interaktif, apply memerlukan `--yes`.

  </Accordion>
  <Accordion title="Cadangan">
    Apply membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada status OpenClaw lokal, langkah cadangan dilewati dan migrasi dapat berlanjut. Untuk melewati cadangan ketika status ada, berikan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Apply menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan ulang dengan `--overwrite` jika penggantian target yang ada memang disengaja. Penyedia masih dapat menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Apply interaktif bertanya apakah akan mengimpor kredensial autentikasi yang terdeteksi, dengan ya dipilih secara default. Gunakan `--no-auth-credentials` untuk melewatinya, atau gunakan `--include-secrets` untuk impor kredensial tanpa pengawasan dengan `--yes`.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi status Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor home Claude Code atau root proyek tertentu.

<Tip>
Untuk panduan pengguna, lihat [Migrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Apa yang diimpor Claude

- `CLAUDE.md` proyek dan `.claude/CLAUDE.md` ke dalam workspace agen OpenClaw.
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` workspace.
- Definisi server MCP dari `.mcp.json` proyek, Claude Code `~/.claude.json`, dan Claude Desktop `claude_desktop_config.json`.
- Direktori skill Claude yang menyertakan `SKILL.md`.
- File Markdown perintah Claude yang dikonversi menjadi skill OpenClaw dengan pemanggilan manual saja.

### Status arsip dan tinjauan manual

Hook, izin, default lingkungan, memori lokal, aturan berbasis path, subagen, cache, rencana, dan riwayat proyek Claude dipertahankan dalam laporan migrasi atau dilaporkan sebagai item tinjauan manual. OpenClaw tidak menjalankan hook, menyalin allowlist luas, atau mengimpor status kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi status Codex CLI di `~/.codex` secara default, atau
di `CODEX_HOME` ketika variabel lingkungan tersebut ditetapkan. Gunakan `--from <path>` untuk
menginventarisasi home Codex tertentu.

Gunakan penyedia ini saat berpindah ke harness Codex OpenClaw dan Anda ingin
mempromosikan aset pribadi Codex CLI yang berguna secara sengaja. Peluncuran server aplikasi Codex lokal
menggunakan `CODEX_HOME` per agen, sehingga tidak membaca
`~/.codex` pribadi Anda secara default. Proses normal `HOME` tetap diwariskan, sehingga Codex
dapat melihat Skills/plugin marketplace bersama di `$HOME/.agents/*` dan
subproses dapat menemukan konfigurasi serta token home pengguna.

Menjalankan `openclaw migrate codex` di terminal interaktif menampilkan pratinjau
rencana lengkap, lalu membuka pemilih kotak centang sebelum konfirmasi apply akhir. Item
salinan skill diminta terlebih dahulu. Gunakan `Toggle all on` atau `Toggle all off` untuk pemilihan
massal. Tekan Space untuk mengubah baris, atau tekan Enter untuk mengaktifkan baris yang disorot
dan melanjutkan. Skill yang direncanakan mulai dalam keadaan dicentang, skill konflik mulai tidak dicentang, dan
`Skip for now` melewati salinan skill untuk proses ini sambil tetap melanjutkan ke pemilihan
Plugin. Ketika Plugin Codex curated yang dipasang dari sumber dapat dimigrasikan dan
`--plugin` tidak diberikan, migrasi kemudian meminta aktivasi Plugin Codex native
berdasarkan nama Plugin. Item Plugin
mulai dicentang kecuali konfigurasi Plugin Codex OpenClaw target sudah memiliki
Plugin tersebut. Plugin target yang sudah ada mulai tidak dicentang dan menampilkan petunjuk konflik seperti
`conflict: plugin exists`; pilih `Toggle all off` untuk tidak memigrasikan Plugin Codex native
dalam proses tersebut, atau `Skip for now` untuk berhenti sebelum menerapkan. Untuk proses skrip atau
presisi, berikan `--skill <name>` sekali per skill, misalnya:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gunakan `--plugin <name>` untuk membatasi migrasi Plugin Codex native secara non-interaktif
ke satu atau beberapa Plugin curated yang dipasang dari sumber:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Apa yang diimpor Codex

- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, kecuali cache
  `.system` milik Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke workspace
  agen OpenClaw saat Anda menginginkan kepemilikan per agen.
- Plugin Codex `openai-curated` yang dipasang dari sumber dan ditemukan melalui
  `plugin/list` server aplikasi Codex. Perencanaan membaca `plugin/read` untuk setiap Plugin
  terpasang yang diaktifkan. Plugin berbasis aplikasi memerlukan respons akun server aplikasi
  Codex sumber berupa akun langganan ChatGPT; respons akun non-ChatGPT atau tidak ada
  dilewati dengan `codex_subscription_required`. Secara default,
  migrasi tidak memanggil `app/list` sumber, sehingga Plugin berbasis aplikasi yang lolos
  gerbang akun direncanakan tanpa verifikasi aksesibilitas aplikasi sumber, dan
  kegagalan transport pencarian akun dilewati dengan `codex_account_unavailable`. Berikan
  `--verify-plugin-apps` ketika Anda ingin migrasi memaksa snapshot
  `app/list` sumber yang baru dan mewajibkan setiap aplikasi yang dimiliki hadir, diaktifkan, dan
  dapat diakses sebelum merencanakan aktivasi native. Dalam mode tersebut, kegagalan transport
  pencarian akun diteruskan ke verifikasi inventaris aplikasi sumber. Snapshot
  inventaris aplikasi sumber disimpan dalam memori untuk proses saat ini; snapshot tersebut
  tidak ditulis ke output migrasi atau konfigurasi target. Plugin yang dinonaktifkan,
  detail Plugin yang tidak dapat dibaca, akun sumber yang dibatasi langganan, dan, ketika
  verifikasi diminta, aplikasi yang hilang, aplikasi yang dinonaktifkan, aplikasi yang tidak dapat diakses, atau
  kegagalan inventaris aplikasi sumber menjadi item manual yang dilewati dengan alasan bertipe
  alih-alih entri konfigurasi target.
  Apply memanggil `plugin/install` server aplikasi untuk setiap Plugin layak yang dipilih,
  bahkan jika server aplikasi target sudah melaporkan Plugin tersebut sebagai terpasang dan
  diaktifkan. Plugin Codex yang dimigrasikan hanya dapat digunakan dalam sesi yang memilih
  harness Codex native; Plugin tersebut tidak diekspos ke run penyedia OpenClaw,
  binding percakapan ACP, atau harness lain.

### Status Codex tinjauan manual

Codex `config.toml`, `hooks/hooks.json` native, marketplace non-curated, bundle
Plugin cache yang bukan Plugin curated yang dipasang dari sumber, dan Plugin yang dipasang dari sumber
yang gagal melewati gerbang langganan sumber tidak diaktifkan secara otomatis.
Ketika `--verify-plugin-apps` ditetapkan, Plugin yang gagal melewati gerbang inventaris
aplikasi sumber juga dilewati. Semua itu disalin atau dilaporkan dalam laporan migrasi untuk
tinjauan manual.

Untuk Plugin curated yang dipasang dari sumber dan dimigrasikan, apply menulis:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- satu entri Plugin eksplisit dengan `marketplaceName: "openai-curated"` dan
  `pluginName` untuk setiap Plugin yang dipilih

Migrasi tidak pernah menulis `plugins["*"]` dan tidak pernah menyimpan jalur cache marketplace lokal. Kegagalan langganan di sisi sumber dilaporkan pada item manual dengan alasan bertipe seperti `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled`, atau `plugin_read_unavailable`. Dengan `--verify-plugin-apps`, kegagalan inventaris aplikasi sumber juga dapat muncul sebagai `app_inaccessible`, `app_disabled`, `app_missing`, atau `app_inventory_unavailable`. Plugin yang dilewati tidak ditulis ke konfigurasi target.
Instalasi di sisi target yang memerlukan autentikasi dilaporkan pada item plugin yang terdampak dengan `status: "skipped"`, `reason: "auth_required"`, dan pengenal aplikasi yang telah disanitasi. Entri konfigurasi eksplisitnya ditulis dalam keadaan nonaktif sampai Anda mengotorisasi ulang dan mengaktifkannya. Kegagalan instalasi lainnya adalah hasil `error` yang tercakup per item.

Jika inventaris Plugin server aplikasi Codex tidak tersedia selama perencanaan, migrasi akan kembali ke item penasihat bundel yang di-cache alih-alih menggagalkan seluruh migrasi.

## Penyedia Hermes

Penyedia Hermes bawaan mendeteksi status di `~/.hermes` secara default. Gunakan `--from <path>` ketika Hermes berada di lokasi lain.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke ruang kerja agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori ruang kerja.
- Default konfigurasi memori untuk memori file OpenClaw, ditambah item arsip atau peninjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai konfigurasi per Skills dari `skills.config`.
- Kredensial OAuth OpenAI OpenCode dari OpenCode `auth.json` ketika migrasi kredensial interaktif diterima, atau ketika `--include-secrets` diatur. Entri OAuth Hermes `auth.json` adalah status lama yang dilaporkan untuk autentikasi ulang OpenAI manual atau perbaikan doctor.
- Kunci API dan token yang didukung dari Hermes `.env` dan OpenCode `auth.json` ketika migrasi kredensial interaktif diterima, atau ketika `--include-secrets` diatur.

### Kunci `.env` yang didukung

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Status khusus arsip

Status Hermes yang tidak dapat ditafsirkan dengan aman oleh OpenClaw disalin ke laporan migrasi untuk peninjauan manual, tetapi tidak dimuat ke konfigurasi atau kredensial OpenClaw aktif. Ini mempertahankan status yang buram atau tidak aman tanpa berpura-pura bahwa OpenClaw dapat mengeksekusi atau mempercayainya secara otomatis:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
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

Saat runtime, Plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Core memiliki orkestrasi CLI, kebijakan pencadangan, prompt, output JSON, dan preflight konflik. Core meneruskan rencana yang telah ditinjau ke `apply(ctx, plan)`, dan penyedia dapat membangun ulang rencana hanya ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk konstruksi item dan jumlah ringkasan, ditambah `openclaw/plugin-sdk/migration-runtime` untuk penyalinan file yang sadar konflik, salinan laporan khusus arsip, wrapper config-runtime yang di-cache, dan laporan migrasi.

## Integrasi onboarding

Onboarding dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi Plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Reset konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu jika Anda sudah memiliki status lokal. Impor dengan pencadangan-plus-timpa atau gabung dibatasi fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan untuk pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan untuk pengguna.
- [Bermigrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugins](/id/tools/plugin): instalasi dan pendaftaran plugin.
