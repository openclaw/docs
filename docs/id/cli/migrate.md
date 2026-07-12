---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi milik plugin
summary: Referensi CLI untuk `openclaw migrate` (mengimpor status dari sistem agen lain)
title: Migrasikan
x-i18n:
    generated_at: "2026-07-12T14:06:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor status dari sistem agen lain melalui penyedia migrasi milik plugin. Penyedia bawaan mencakup Claude, Codex CLI, dan [Hermes](/id/install/migrating-hermes); plugin dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan langkah demi langkah bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude) dan [Bermigrasi dari Hermes](/id/install/migrating-hermes). [Pusat migrasi](/id/install/migrating) mencantumkan semua jalur.
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

Menjalankan `openclaw migrate <provider>` tanpa flag lain akan menyusun rencana, menampilkan pratinjau, dan (di TTY) meminta konfirmasi sebelum menerapkannya. `openclaw migrate plan <provider>` dan `openclaw migrate apply <provider>` memisahkan pratinjau dan penerapan menjadi subperintah terpisah dengan flag yang sama.

<ParamField path="<provider>" type="string">
  Nama penyedia migrasi yang terdaftar, misalnya `hermes`. Jalankan `openclaw migrate list` untuk melihat penyedia yang terinstal.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Susun rencana dan keluar tanpa mengubah status.
</ParamField>
<ParamField path="--from <path>" type="string">
  Ganti direktori status sumber. Hermes menggunakan `~/.hermes` secara default, Codex menggunakan `~/.codex` (atau `$CODEX_HOME`), dan Claude menggunakan `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Impor kredensial yang didukung tanpa meminta konfirmasi. Penerapan interaktif meminta konfirmasi sebelum mengimpor kredensial autentikasi yang terdeteksi, dengan ya dipilih secara default; `--yes` noninteraktif memerlukan `--include-secrets` untuk mengimpornya.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Lewati impor kredensial autentikasi, termasuk permintaan konfirmasi interaktif.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Izinkan penerapan mengganti target yang sudah ada ketika rencana melaporkan konflik.
</ParamField>
<ParamField path="--yes" type="boolean">
  Lewati permintaan konfirmasi. Wajib dalam mode noninteraktif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Pilih satu item penyalinan skill berdasarkan nama skill atau ID item. Ulangi flag untuk memigrasikan beberapa skill. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang dan migrasi noninteraktif mempertahankan semua skill yang direncanakan.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Pilih satu item instalasi plugin Codex berdasarkan nama plugin atau ID item. Ulangi flag untuk memigrasikan beberapa plugin Codex. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang plugin Codex native dan migrasi noninteraktif mempertahankan semua plugin yang direncanakan. Hanya berlaku untuk plugin Codex `openai-curated` yang diinstal dari sumber dan ditemukan oleh inventaris app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Khusus Codex. Memaksa penelusuran baru `app/list` pada app-server Codex sumber sebelum merencanakan aktivasi plugin native. Dinonaktifkan secara default agar perencanaan migrasi tetap cepat.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Jalur atau direktori arsip cadangan pramigrasi. Diteruskan ke `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati pencadangan sebelum penerapan. Memerlukan `--force` jika terdapat status OpenClaw lokal.
</ParamField>
<ParamField path="--force" type="boolean">
  Wajib digunakan bersama `--no-backup` ketika penerapan seharusnya menolak melewati pencadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil penerapan sebagai JSON. Dengan `--json` tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status.
</ParamField>

## Model keamanan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum penerapan">
    Penyedia mengembalikan rencana terperinci sebelum ada perubahan apa pun, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, keluaran penerapan, dan laporan migrasi menyunting kunci bersarang yang tampak seperti rahasia, misalnya kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` menampilkan pratinjau rencana dan meminta konfirmasi sebelum mengubah status, kecuali jika `--yes` ditetapkan. Dalam mode noninteraktif, penerapan memerlukan `--yes`.

  </Accordion>
  <Accordion title="Cadangan">
    Penerapan membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada status OpenClaw lokal, langkah pencadangan dilewati dan migrasi dilanjutkan. Untuk melewati pencadangan ketika status tersedia, gunakan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Penerapan menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan kembali dengan `--overwrite` jika penggantian target yang ada memang disengaja. Penyedia masih dapat menulis cadangan tingkat item untuk berkas yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Penerapan interaktif menanyakan apakah kredensial autentikasi yang terdeteksi akan diimpor, dengan ya dipilih secara default. Gunakan `--no-auth-credentials` untuk melewatinya, atau `--include-secrets` untuk impor kredensial tanpa pengawasan bersama `--yes`.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi status Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor direktori utama atau akar proyek Claude Code tertentu.

<Tip>
Untuk panduan langkah demi langkah bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Yang diimpor Claude

- `CLAUDE.md` dan `.claude/CLAUDE.md` proyek ke ruang kerja agen OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` ruang kerja.
- Definisi server MCP dari `.mcp.json` proyek, `~/.claude.json` Claude Code (termasuk entri per proyeknya), dan `claude_desktop_config.json` Claude Desktop.
- Direktori skill Claude yang menyertakan `SKILL.md` (`~/.claude/skills` pengguna dan `.claude/skills` proyek).
- Berkas Markdown perintah Claude (`~/.claude/commands` pengguna dan `.claude/commands` proyek) dikonversi menjadi skill OpenClaw yang hanya dapat dipanggil secara manual.

### Status arsip dan tinjauan manual

Hook, izin, nilai default lingkungan, `CLAUDE.local.md` proyek, `.claude/rules`, direktori `agents/` pengguna dan proyek, serta riwayat proyek (`projects`, `cache`, `plans` di bawah `~/.claude`) Claude dipertahankan dalam laporan migrasi atau dilaporkan sebagai item tinjauan manual. OpenClaw tidak menjalankan hook, menyalin daftar izin yang luas, atau mengimpor status kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi status Codex CLI di `~/.codex` secara default, atau di `CODEX_HOME` jika variabel lingkungan tersebut ditetapkan. Gunakan `--from <path>` untuk menginventarisasi direktori utama Codex tertentu.

Gunakan penyedia ini ketika beralih ke harness Codex OpenClaw dan Anda ingin memindahkan aset pribadi Codex CLI yang berguna secara sengaja. Peluncuran app-server Codex lokal menggunakan `CODEX_HOME` per agen sehingga tidak membaca `~/.codex` pribadi Anda secara default. Proses normal tetap mewarisi `HOME`, sehingga Codex dapat melihat entri skill/pasar plugin bersama di `$HOME/.agents/*` dan subproses dapat menemukan konfigurasi serta token di direktori utama pengguna.

Menjalankan `openclaw migrate codex` di terminal interaktif akan menampilkan pratinjau rencana lengkap, lalu membuka pemilih kotak centang sebelum konfirmasi penerapan akhir. Item penyalinan skill ditanyakan terlebih dahulu. Gunakan `Toggle all on` atau `Toggle all off` untuk pemilihan massal. Tekan Spasi untuk mengalihkan baris, atau Enter untuk mengaktifkan baris yang disorot dan melanjutkan. Skill yang direncanakan dimulai dalam keadaan dicentang, skill yang berkonflik dimulai tanpa dicentang, dan `Skip for now` melewati penyalinan skill untuk proses ini sambil tetap melanjutkan ke pemilihan plugin. Jika plugin Codex terkurasi yang diinstal dari sumber dapat dimigrasikan dan `--plugin` tidak diberikan, migrasi kemudian meminta aktivasi plugin Codex native berdasarkan nama plugin. Item plugin dimulai dalam keadaan dicentang kecuali konfigurasi plugin Codex OpenClaw target sudah memiliki plugin tersebut. Plugin target yang sudah ada dimulai tanpa dicentang dan menampilkan petunjuk konflik seperti `conflict: plugin exists`; pilih `Toggle all off` agar tidak memigrasikan plugin Codex native dalam proses tersebut, atau `Skip for now` untuk berhenti sebelum menerapkan.

Untuk proses berbasis skrip atau proses yang presisi, pilih satu atau beberapa skill atau plugin secara eksplisit:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Yang diimpor Codex

- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, kecuali cache `.system` Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke ruang kerja agen OpenClaw saat ini untuk kepemilikan per agen.
- Plugin Codex `openai-curated` yang diinstal dari sumber dan ditemukan melalui `plugin/list` app-server Codex. Perencanaan membaca `plugin/read` untuk setiap plugin terinstal yang diaktifkan.

Migrasi plugin yang didukung aplikasi memiliki pemeriksaan tambahan:

- Plugin yang didukung aplikasi mengharuskan akun app-server Codex sumber berupa akun langganan ChatGPT. Respons akun non-ChatGPT atau akun yang tidak tersedia dilewati dengan `codex_subscription_required`.
- Secara default, migrasi tidak memanggil `app/list` sumber, sehingga plugin yang didukung aplikasi dan lolos pemeriksaan akun direncanakan tanpa verifikasi aksesibilitas aplikasi sumber, sedangkan kegagalan transport pencarian akun dilewati dengan `codex_account_unavailable`.
- Gunakan `--verify-plugin-apps` untuk memaksa snapshot `app/list` sumber yang baru dan mengharuskan setiap aplikasi yang dimiliki tersedia, diaktifkan, serta dapat diakses sebelum merencanakan aktivasi native. Dalam mode tersebut, kegagalan transport pencarian akun dilanjutkan ke verifikasi inventaris aplikasi sumber. Snapshot hanya disimpan dalam memori untuk proses saat ini; snapshot tidak pernah ditulis ke keluaran migrasi atau konfigurasi target.

Plugin yang dinonaktifkan, detail plugin yang tidak dapat dibaca, akun sumber yang dibatasi langganan, dan (ketika `--verify-plugin-apps` ditetapkan) aplikasi yang tidak tersedia, dinonaktifkan, atau tidak dapat diakses menjadi item manual yang dilewati dengan alasan bertipe, bukan entri konfigurasi target. Penerapan memanggil `plugin/install` app-server untuk setiap plugin memenuhi syarat yang dipilih, meskipun app-server target sudah melaporkan plugin tersebut terinstal dan diaktifkan. Plugin Codex yang dimigrasikan hanya dapat digunakan dalam sesi yang memilih harness Codex native; plugin tersebut tidak diekspos ke proses penyedia OpenClaw, pengikatan percakapan ACP, atau harness lain.

### Status Codex untuk tinjauan manual

`config.toml` Codex, `hooks/hooks.json` native, pasar nonterkurasi, bundel plugin yang disimpan dalam cache tetapi bukan plugin terkurasi yang diinstal dari sumber, dan plugin yang diinstal dari sumber tetapi gagal dalam pemeriksaan langganan sumber tidak diaktifkan secara otomatis. Ketika `--verify-plugin-apps` ditetapkan, plugin yang gagal dalam pemeriksaan inventaris aplikasi sumber juga dilewati. Semua ini disalin atau dilaporkan dalam laporan migrasi untuk ditinjau secara manual.

Untuk plugin terkurasi yang dimigrasikan dan diinstal dari sumber, penerapan menulis:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- satu entri plugin eksplisit dengan `marketplaceName: "openai-curated"` dan `pluginName` untuk setiap plugin yang dipilih

Migrasi tidak pernah menulis `plugins["*"]` dan tidak pernah menyimpan jalur cache pasar lokal.

Plugin yang dilewati tidak ditulis ke konfigurasi target. Kegagalan langganan di sisi sumber dilaporkan pada item manual dengan alasan bertipe: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled`, atau `plugin_read_unavailable`. Dengan `--verify-plugin-apps`, kegagalan inventaris aplikasi sumber juga dapat muncul sebagai `app_inaccessible`, `app_disabled`, `app_missing`, atau `app_inventory_unavailable`. Instalasi di sisi target yang memerlukan autentikasi dilaporkan pada item Plugin yang terdampak dengan `status: "skipped"`, `reason: "auth_required"`, dan pengenal aplikasi yang telah disanitasi; entri konfigurasi eksplisitnya ditulis dalam keadaan dinonaktifkan hingga Anda mengotorisasi ulang dan mengaktifkannya. Kegagalan instalasi lainnya merupakan hasil `error` yang cakupannya terbatas pada item.

Jika inventaris Plugin server aplikasi Codex tidak tersedia selama perencanaan, migrasi beralih menggunakan item rekomendasi bundel yang di-cache alih-alih menggagalkan seluruh migrasi.

## Penyedia Hermes

Penyedia Hermes yang disertakan mendeteksi status di `~/.hermes` secara default. Gunakan `--from <path>` jika Hermes berada di lokasi lain.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
- `SOUL.md` dan `AGENTS.md` ke ruang kerja agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori ruang kerja.
- Nilai default konfigurasi memori untuk memori file OpenClaw, beserta item arsip atau tinjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di bawah `skills/<name>/`.
- Nilai konfigurasi per Skills dari `skills.config`.
- Kredensial OAuth OpenAI milik OpenCode dari `auth.json` OpenCode ketika migrasi kredensial interaktif diterima, atau ketika `--include-secrets` ditetapkan. Entri OAuth dalam `auth.json` Hermes merupakan status lama yang dilaporkan untuk autentikasi ulang OpenAI secara manual atau perbaikan oleh doctor.
- Kunci API dan token yang didukung dari `.env` Hermes dan `auth.json` OpenCode ketika migrasi kredensial interaktif diterima, atau ketika `--include-secrets` ditetapkan.

### Kunci `.env` yang didukung

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Status khusus arsip

Status Hermes yang tidak dapat ditafsirkan secara aman oleh OpenClaw disalin ke laporan migrasi untuk ditinjau secara manual, tetapi tidak dimuat ke konfigurasi atau kredensial OpenClaw aktif. Ini mempertahankan status yang tidak transparan atau tidak aman tanpa berpura-pura bahwa OpenClaw dapat menjalankan atau memercayainya secara otomatis: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Setelah menerapkan

```bash
openclaw doctor
```

## Kontrak Plugin

Sumber migrasi adalah Plugin. Sebuah Plugin mendeklarasikan ID penyedianya di `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Saat runtime, Plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Inti menangani orkestrasi CLI, kebijakan pencadangan, perintah interaktif, keluaran JSON, dan pemeriksaan awal konflik. Inti meneruskan rencana yang telah ditinjau ke `apply(ctx, plan)`, dan penyedia hanya boleh membangun ulang rencana ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk pembuatan item dan jumlah ringkasan, serta `openclaw/plugin-sdk/migration-runtime` untuk penyalinan file yang menyadari konflik, penyalinan laporan khusus arsip, pembungkus runtime konfigurasi yang di-cache, dan laporan migrasi.

## Integrasi orientasi awal

Orientasi awal dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi Plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkannya.

<Note>
Impor orientasi awal memerlukan penyiapan OpenClaw baru. Atur ulang konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu jika Anda sudah memiliki status lokal. Impor dengan pencadangan sekaligus penimpaan atau penggabungan dibatasi oleh fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan langkah demi langkah bagi pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan langkah demi langkah bagi pengguna.
- [Migrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugin](/id/tools/plugin): instalasi dan pendaftaran Plugin.
