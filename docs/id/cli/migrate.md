---
read_when:
    - Anda ingin bermigrasi dari Hermes atau sistem agen lain ke OpenClaw
    - Anda sedang menambahkan penyedia migrasi milik plugin
summary: Referensi CLI untuk `openclaw migrate` (impor status dari sistem agen lain)
title: Migrasikan
x-i18n:
    generated_at: "2026-07-19T05:01:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdedb1bf6c9def52079c021e4e77fe008c9394ee352bec299bf154687f62e514
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Impor status dari sistem agen lain melalui penyedia migrasi milik plugin. Penyedia bawaan mencakup Claude, Codex CLI, dan [Hermes](/id/install/migrating-hermes); plugin dapat mendaftarkan penyedia tambahan.

<Tip>
Untuk panduan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude) dan [Bermigrasi dari Hermes](/id/install/migrating-hermes). [Pusat migrasi](/id/install/migrating) mencantumkan semua jalur.
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

Menjalankan `openclaw migrate <provider>` tanpa flag lain akan merencanakan, menampilkan pratinjau, dan (di TTY) meminta konfirmasi sebelum menerapkan. `openclaw migrate plan <provider>` dan `openclaw migrate apply <provider>` memisahkan pratinjau dan penerapan menjadi subperintah terpisah dengan flag yang sama.

<ParamField path="<provider>" type="string">
  Nama penyedia migrasi yang terdaftar, misalnya `hermes`. Jalankan `openclaw migrate list` untuk melihat penyedia yang terinstal.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Susun rencana dan keluar tanpa mengubah status.
</ParamField>
<ParamField path="--from <path>" type="string">
  Timpa direktori status sumber. Hermes mengikuti `$HERMES_HOME` dan profil aktif, lalu menggunakan nilai default platform (`~/.hermes` atau `%LOCALAPPDATA%\hermes`). Codex secara default menggunakan `~/.codex` (atau `$CODEX_HOME`), sedangkan Claude secara default menggunakan `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Impor kredensial yang didukung tanpa meminta konfirmasi. Penerapan interaktif meminta konfirmasi sebelum mengimpor kredensial autentikasi yang terdeteksi, dengan ya dipilih secara default; `--yes` noninteraktif memerlukan `--include-secrets` untuk mengimpornya.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Lewati impor kredensial autentikasi, termasuk permintaan konfirmasi interaktif.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Izinkan penerapan mengganti target yang ada ketika rencana melaporkan konflik.
</ParamField>
<ParamField path="--yes" type="boolean">
  Lewati permintaan konfirmasi. Wajib dalam mode noninteraktif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Pilih satu item penyalinan skill berdasarkan nama skill atau ID item. Ulangi flag untuk memigrasikan beberapa skill. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang dan migrasi noninteraktif mempertahankan semua skill yang direncanakan.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Pilih satu item penginstalan plugin Codex berdasarkan nama plugin atau ID item. Ulangi flag untuk memigrasikan beberapa plugin Codex. Jika dihilangkan, migrasi Codex interaktif menampilkan pemilih kotak centang plugin Codex native dan migrasi noninteraktif mempertahankan semua plugin yang direncanakan. Hanya berlaku untuk plugin Codex `openai-curated` yang diinstal dari sumber dan ditemukan oleh inventaris app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Khusus Codex. Memaksa penelusuran `app/list` app-server Codex sumber yang baru sebelum merencanakan aktivasi plugin native. Dinonaktifkan secara default agar perencanaan migrasi tetap cepat.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Jalur atau direktori arsip cadangan pramigrasi. Diteruskan ke `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Lewati pencadangan prapenerapan. Memerlukan `--force` ketika terdapat status OpenClaw lokal.
</ParamField>
<ParamField path="--force" type="boolean">
  Diperlukan bersama `--no-backup` ketika penerapan seharusnya menolak untuk melewati pencadangan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak rencana atau hasil penerapan sebagai JSON. Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status.
</ParamField>

## Model keamanan

`openclaw migrate` mengutamakan pratinjau.

<AccordionGroup>
  <Accordion title="Pratinjau sebelum penerapan">
    Penyedia mengembalikan rencana terperinci per item sebelum ada perubahan apa pun, termasuk konflik, item yang dilewati, dan item sensitif. Rencana JSON, keluaran penerapan, dan laporan migrasi menyamarkan kunci bertingkat yang tampak seperti rahasia, seperti kunci API, token, header otorisasi, cookie, dan kata sandi.

    `openclaw migrate apply <provider>` menampilkan pratinjau rencana dan meminta konfirmasi sebelum mengubah status, kecuali jika `--yes` ditetapkan. Dalam mode noninteraktif, penerapan memerlukan `--yes`.

  </Accordion>
  <Accordion title="Cadangan">
    Penerapan membuat dan memverifikasi cadangan OpenClaw sebelum menerapkan migrasi. Jika belum ada status OpenClaw lokal, langkah pencadangan dilewati dan migrasi dilanjutkan. Untuk melewati pencadangan ketika terdapat status, teruskan `--no-backup` dan `--force`.
  </Accordion>
  <Accordion title="Konflik">
    Penerapan menolak melanjutkan ketika rencana memiliki konflik. Tinjau rencana, lalu jalankan kembali dengan `--overwrite` jika penggantian target yang ada memang disengaja. Penyedia masih dapat menulis cadangan tingkat item untuk berkas yang ditimpa di direktori laporan migrasi.
  </Accordion>
  <Accordion title="Rahasia">
    Penerapan interaktif menanyakan apakah kredensial autentikasi yang terdeteksi akan diimpor, dengan ya dipilih secara default. Gunakan `--no-auth-credentials` untuk melewatinya, atau `--include-secrets` untuk impor kredensial tanpa pengawasan dengan `--yes`.
  </Accordion>
</AccordionGroup>

## Penyedia Claude

Penyedia Claude bawaan mendeteksi status Claude Code di `~/.claude` secara default. Gunakan `--from <path>` untuk mengimpor direktori utama atau akar proyek Claude Code tertentu.

<Tip>
Untuk panduan bagi pengguna, lihat [Bermigrasi dari Claude](/id/install/migrating-claude).
</Tip>

### Yang diimpor Claude

- Markdown memori otomatis Claude Code dari `~/.claude/projects/*/memory` dan
  `autoMemoryDirectory` yang dikonfigurasi pengguna, disalin ke
  `memory/imports/claude-code/` untuk pemanggilan kembali terindeks.
- `CLAUDE.md` dan `.claude/CLAUDE.md` proyek ke ruang kerja agen OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` ruang kerja.
- Definisi server MCP dari `.mcp.json` proyek, `~/.claude.json` Claude Code (termasuk entri per proyeknya), dan `claude_desktop_config.json` Claude Desktop.
- Direktori skill Claude yang menyertakan `SKILL.md` (`~/.claude/skills` pengguna dan `.claude/skills` proyek).
- Berkas Markdown perintah Claude (`~/.claude/commands` pengguna dan `.claude/commands` proyek) dikonversi menjadi skill OpenClaw yang hanya dapat dipanggil secara manual.

### Status arsip dan peninjauan manual

Hook, izin, default lingkungan Claude, `CLAUDE.local.md` proyek, `.claude/rules`, direktori `agents/` pengguna dan proyek, serta riwayat proyek (`projects`, `cache`, `plans` di bawah `~/.claude`) dipertahankan dalam laporan migrasi atau dilaporkan sebagai item peninjauan manual. OpenClaw tidak menjalankan hook, menyalin daftar izin yang luas, atau mengimpor status kredensial OAuth/Desktop secara otomatis.

## Penyedia Codex

Penyedia Codex bawaan mendeteksi status Codex CLI di `~/.codex` secara default, atau di `CODEX_HOME` ketika variabel lingkungan tersebut ditetapkan. Gunakan `--from <path>` untuk menginventarisasi direktori utama Codex tertentu.

Gunakan penyedia ini saat berpindah ke harness Codex OpenClaw dan ingin mempromosikan aset pribadi Codex CLI yang berguna secara sengaja. Peluncuran app-server Codex lokal menggunakan `CODEX_HOME` per agen, sehingga secara default tidak membaca `~/.codex` pribadi Anda. `HOME` proses normal tetap diwariskan, sehingga Codex dapat melihat entri Skills/marketplace plugin `$HOME/.agents/*` bersama dan subproses dapat menemukan konfigurasi serta token direktori utama pengguna.

Menjalankan `openclaw migrate codex` di terminal interaktif menampilkan pratinjau rencana lengkap, lalu membuka pemilih kotak centang sebelum konfirmasi penerapan akhir. Item penyalinan skill diminta terlebih dahulu. Gunakan `Toggle all on` atau `Toggle all off` untuk pemilihan massal. Tekan Space untuk mengalihkan pilihan baris, atau Enter untuk mengaktifkan baris yang disorot dan melanjutkan. Skill yang direncanakan diawali dalam keadaan dicentang, skill yang berkonflik diawali tanpa dicentang, dan `Skip for now` melewati penyalinan skill untuk proses ini sambil tetap melanjutkan ke pemilihan plugin. Ketika plugin Codex pilihan yang diinstal dari sumber dapat dimigrasikan dan `--plugin` tidak diberikan, migrasi kemudian meminta aktivasi plugin Codex native berdasarkan nama plugin. Item plugin diawali dalam keadaan dicentang, kecuali konfigurasi plugin Codex OpenClaw target sudah memiliki plugin tersebut. Plugin target yang ada diawali tanpa dicentang dan menampilkan petunjuk konflik seperti `conflict: plugin exists`; pilih `Toggle all off` agar tidak memigrasikan plugin Codex native dalam proses tersebut, atau `Skip for now` untuk berhenti sebelum menerapkan.

Untuk proses berskrip atau presisi, pilih satu atau beberapa skill atau plugin secara eksplisit:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Yang diimpor Codex

- `MEMORY.md` dan `memory_summary.md` Codex terkonsolidasi dari
  `$CODEX_HOME/memories`, disalin ke `memory/imports/codex/` untuk
  pemanggilan kembali terindeks. Memori peluncuran mentah tidak diimpor.
- Direktori skill Codex CLI di bawah `$CODEX_HOME/skills`, tidak termasuk cache `.system` milik Codex.
- AgentSkills pribadi di bawah `$HOME/.agents/skills`, disalin ke ruang kerja agen OpenClaw saat ini untuk kepemilikan per agen.
- Plugin Codex `openai-curated` yang diinstal dari sumber dan ditemukan melalui `plugin/list` app-server Codex. Perencanaan membaca `plugin/read` untuk setiap plugin terinstal yang diaktifkan.

Migrasi plugin yang didukung aplikasi memiliki gerbang tambahan:

- Plugin yang didukung aplikasi mengharuskan akun app-server Codex sumber berupa akun langganan ChatGPT. Respons akun non-ChatGPT atau yang tidak tersedia dilewati dengan `codex_subscription_required`.
- Secara default, migrasi tidak memanggil `app/list` sumber, sehingga plugin yang didukung aplikasi dan lolos gerbang akun direncanakan tanpa verifikasi aksesibilitas aplikasi sumber, dan kegagalan transport pencarian akun dilewati dengan `codex_account_unavailable`.
- Teruskan `--verify-plugin-apps` untuk memaksa snapshot `app/list` sumber yang baru dan mewajibkan setiap aplikasi yang dimiliki tersedia, diaktifkan, serta dapat diakses sebelum merencanakan aktivasi native. Dalam mode tersebut, kegagalan transport pencarian akun dilanjutkan ke verifikasi inventaris aplikasi sumber. Snapshot hanya disimpan dalam memori untuk proses saat ini; snapshot tidak pernah ditulis ke keluaran migrasi atau konfigurasi target.

Plugin yang dinonaktifkan, detail plugin yang tidak dapat dibaca, akun sumber yang dibatasi langganan, dan (ketika `--verify-plugin-apps` ditetapkan) aplikasi yang tidak tersedia, dinonaktifkan, atau tidak dapat diakses menjadi item manual yang dilewati dengan alasan bertipe, bukan entri konfigurasi target. Penerapan memanggil `plugin/install` app-server untuk setiap plugin memenuhi syarat yang dipilih, meskipun app-server target sudah melaporkan bahwa plugin tersebut terinstal dan diaktifkan. Plugin Codex yang dimigrasikan hanya dapat digunakan dalam sesi yang memilih harness Codex native; plugin tersebut tidak diekspos ke proses penyedia OpenClaw, pengikatan percakapan ACP, atau harness lainnya.

### Status Codex untuk peninjauan manual

Codex `config.toml`, `hooks/hooks.json` native, marketplace yang tidak dikurasi, bundel plugin dalam cache yang bukan plugin terkurasi yang diinstal dari sumber, serta plugin yang diinstal dari sumber tetapi gagal melewati gerbang langganan sumber tidak diaktifkan secara otomatis. Ketika `--verify-plugin-apps` ditetapkan, plugin yang gagal melewati gerbang inventaris aplikasi sumber juga dilewati. Semuanya disalin atau dilaporkan dalam laporan migrasi untuk ditinjau secara manual.

Untuk plugin terkurasi yang dimigrasikan dan diinstal dari sumber, terapkan penulisan:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- satu entri plugin eksplisit dengan `marketplaceName: "openai-curated"` dan `pluginName` untuk setiap plugin yang dipilih

Migrasi tidak pernah menulis `plugins["*"]` dan tidak pernah menyimpan jalur cache marketplace lokal.

Plugin yang dilewati tidak ditulis ke konfigurasi target. Kegagalan langganan di sisi sumber dilaporkan pada item manual dengan alasan bertipe: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled`, atau `plugin_read_unavailable`. Dengan `--verify-plugin-apps`, kegagalan inventaris aplikasi sumber juga dapat muncul sebagai `app_inaccessible`, `app_disabled`, `app_missing`, atau `app_inventory_unavailable`. Instalasi yang memerlukan autentikasi di sisi target dilaporkan pada item plugin yang terdampak dengan `status: "skipped"`, `reason: "auth_required"`, dan pengenal aplikasi yang telah disanitasi; entri konfigurasi eksplisitnya ditulis dalam keadaan dinonaktifkan hingga Anda mengotorisasi ulang dan mengaktifkannya. Kegagalan instalasi lainnya merupakan hasil `error` yang cakupannya terbatas pada item.

Jika inventaris plugin server aplikasi Codex tidak tersedia selama perencanaan, migrasi beralih ke item advisori bundel dalam cache alih-alih menggagalkan seluruh migrasi.

## Penyedia Hermes

Penyedia Hermes bawaan mengikuti `$HERMES_HOME` dan profil aktif, lalu menggunakan nilai default platform (`~/.hermes` atau `%LOCALAPPDATA%\hermes`). Gunakan `--from <path>` untuk mengganti penemuan.

### Yang diimpor Hermes

- Konfigurasi model default dari `config.yaml`.
- Penyedia model yang dikonfigurasi dan endpoint khusus yang kompatibel dengan OpenAI dari `model`, `providers`, dan `custom_providers`.
- Definisi server MCP dari `mcp_servers` atau `mcp.servers`. Pemetaan OpenClaw yang tepat mencakup perutean HTTP Streamable default, cakupan OAuth, verifikasi TLS boolean, jalur sertifikat/kunci klien terpisah, serta kebijakan alat native/resource/prompt Hermes. Kolom runtime atau kredensial khusus Hermes yang tidak didukung dilaporkan untuk ditinjau secara manual.
- `SOUL.md` dan `AGENTS.md` ke ruang kerja agen OpenClaw.
- `memories/MEMORY.md` dan `memories/USER.md` ditambahkan ke file memori ruang kerja.
  Sebagai gantinya, permukaan khusus memori (halaman memori orientasi dan halaman impor Memori UI Kontrol)
  menyalin file-file ini ke bawah `memory/imports/hermes/` untuk
  pengingatan terindeks tanpa menyentuh memori ruang kerja yang ada.
- Nilai default konfigurasi memori untuk memori file OpenClaw, beserta item arsip atau tinjauan manual untuk penyedia memori eksternal seperti Honcho.
- Skills yang menyertakan file `SKILL.md` di mana pun di bawah `skills/`; skills bertingkat diratakan ke direktori skill ruang kerja.
- Nilai konfigurasi per skill dari `skills.config`.
- Kredensial OAuth OpenAI Codex Hermes saat ini dan kredensial OAuth OpenAI OpenCode ketika migrasi kredensial interaktif diterima, atau ketika `--include-secrets` ditetapkan. Jangan biarkan Hermes dan OpenClaw menggunakan pemberian token penyegaran impor yang sama.
- Kunci API dan token yang didukung dari `.env` Hermes dan `auth.json` OpenCode ketika migrasi kredensial interaktif diterima, atau ketika `--include-secrets` ditetapkan.

### Kunci `.env` yang didukung

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Status khusus arsip

Status Hermes yang tidak dapat ditafsirkan dengan aman oleh OpenClaw disalin ke dalam laporan migrasi untuk ditinjau secara manual, tetapi tidak dimuat ke konfigurasi atau kredensial OpenClaw aktif. Ini mencakup `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, status pemasangan/platform, status perutean/proses Gateway, dan basis data SQLite Hermes yang terdeteksi.

### Setelah menerapkan

```bash
openclaw doctor
```

## Kontrak plugin

Sumber migrasi adalah plugin. Sebuah plugin mendeklarasikan ID penyedianya dalam `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Saat runtime, plugin memanggil `api.registerMigrationProvider(...)`. Penyedia mengimplementasikan `detect`, `plan`, dan `apply`. Inti mengelola orkestrasi CLI, kebijakan pencadangan, prompt, output JSON, dan pemeriksaan awal konflik. Inti meneruskan rencana yang telah ditinjau ke `apply(ctx, plan)`, dan penyedia hanya boleh membangun ulang rencana ketika argumen tersebut tidak ada demi kompatibilitas.

Plugin penyedia dapat menggunakan `openclaw/plugin-sdk/migration` untuk pembuatan item dan jumlah ringkasan, serta `openclaw/plugin-sdk/migration-runtime` untuk penyalinan file yang mempertimbangkan konflik, penyalinan laporan khusus arsip, pembungkus runtime konfigurasi dalam cache, dan laporan migrasi.

## Integrasi orientasi

Orientasi dapat menawarkan migrasi ketika penyedia mendeteksi sumber yang dikenal. Baik `openclaw onboard --flow import` maupun `openclaw setup --wizard --import-from hermes` menggunakan penyedia migrasi plugin yang sama dan tetap menampilkan pratinjau sebelum menerapkan.

<Note>
Impor orientasi memerlukan penyiapan OpenClaw yang baru. Atur ulang konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu jika Anda sudah memiliki status lokal. Impor pencadangan-plus-penimpaan atau penggabungan dibatasi oleh fitur untuk penyiapan yang sudah ada.
</Note>

## Terkait

- [Bermigrasi dari Hermes](/id/install/migrating-hermes): panduan langkah demi langkah bagi pengguna.
- [Bermigrasi dari Claude](/id/install/migrating-claude): panduan langkah demi langkah bagi pengguna.
- [Bermigrasi](/id/install/migrating): pindahkan OpenClaw ke mesin baru.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah menerapkan migrasi.
- [Plugin](/id/tools/plugin): instalasi dan pendaftaran plugin.
