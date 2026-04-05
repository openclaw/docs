---
read_when:
    - Menambahkan atau mengubah perintah atau opsi CLI
    - Mendokumentasikan permukaan perintah baru
summary: Referensi CLI OpenClaw untuk perintah, subperintah, dan opsi `openclaw`
title: Referensi CLI
x-i18n:
    generated_at: "2026-04-05T13:53:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# Referensi CLI

Halaman ini menjelaskan perilaku CLI saat ini. Jika perintah berubah, perbarui dokumen ini.

## Halaman perintah

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`mcp`](/cli/mcp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`tasks`](/cli/index#tasks)
- [`flows`](/cli/flows)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (perintah plugin)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (alias lama untuk perintah layanan gateway)
- [`clawbot`](/cli/clawbot) (namespace alias lama)
- [`voicecall`](/cli/voicecall) (plugin; jika terpasang)

## Flag global

- `--dev`: isolasi state di bawah `~/.openclaw-dev` dan geser port default.
- `--profile <name>`: isolasi state di bawah `~/.openclaw-<name>`.
- `--container <name>`: targetkan container bernama untuk eksekusi.
- `--no-color`: nonaktifkan warna ANSI.
- `--update`: singkatan untuk `openclaw update` (hanya instalasi sumber).
- `-V`, `--version`, `-v`: cetak versi lalu keluar.

## Gaya output

- Warna ANSI dan indikator progres hanya dirender dalam sesi TTY.
- Hyperlink OSC-8 dirender sebagai tautan yang dapat diklik di terminal yang didukung; jika tidak, kami kembali ke URL biasa.
- `--json` (dan `--plain` jika didukung) menonaktifkan gaya untuk output yang bersih.
- `--no-color` menonaktifkan gaya ANSI; `NO_COLOR=1` juga dihormati.
- Perintah yang berjalan lama menampilkan indikator progres (OSC 9;4 jika didukung).

## Palet warna

OpenClaw menggunakan palet lobster untuk output CLI.

- `accent` (#FF5A2D): heading, label, sorotan utama.
- `accentBright` (#FF7A3D): nama perintah, penekanan.
- `accentDim` (#D14A22): teks sorotan sekunder.
- `info` (#FF8A5B): nilai informasional.
- `success` (#2FBF71): status berhasil.
- `warn` (#FFB020): peringatan, fallback, perhatian.
- `error` (#E23D2D): error, kegagalan.
- `muted` (#8B7F77): penekanan rendah, metadata.

Sumber kebenaran palet: `src/terminal/palette.ts` (“palet lobster”).

## Pohon perintah

```
openclaw [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  memory
    status
    index
    search
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
```

Catatan: plugin dapat menambahkan perintah tingkat atas tambahan (misalnya `openclaw voicecall`).

## Keamanan

- `openclaw security audit` — audit konfigurasi + state lokal untuk jebakan keamanan umum.
- `openclaw security audit --deep` — probe Gateway langsung dengan upaya terbaik.
- `openclaw security audit --fix` — perketat default aman serta izin state/konfigurasi.

## Rahasia

### `secrets`

Kelola SecretRef dan kebersihan runtime/konfigurasi terkait.

Subperintah:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Opsi `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Opsi `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Opsi `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Opsi `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Catatan:

- `reload` adalah RPC Gateway dan mempertahankan snapshot runtime terakhir yang diketahui baik saat resolusi gagal.
- `audit --check` mengembalikan nilai non-zero bila ada temuan; ref yang belum terselesaikan menggunakan exit code non-zero prioritas lebih tinggi.
- Pemeriksaan exec dry-run dilewati secara default; gunakan `--allow-exec` untuk ikut serta.

## Plugin

Kelola ekstensi dan konfigurasinya:

- `openclaw plugins list` — temukan plugin (gunakan `--json` untuk output yang dapat diproses mesin).
- `openclaw plugins inspect <id>` — tampilkan detail untuk sebuah plugin (`info` adalah alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — pasang plugin (atau tambahkan path plugin ke `plugins.load.paths`; gunakan `--force` untuk menimpa target instalasi yang ada).
- `openclaw plugins marketplace list <marketplace>` — tampilkan entri marketplace sebelum instalasi.
- `openclaw plugins enable <id>` / `disable <id>` — alihkan `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — laporkan error pemuatan plugin.

Sebagian besar perubahan plugin memerlukan restart gateway. Lihat [/plugin](/tools/plugin).

## Memori

Pencarian vektor atas `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — tampilkan statistik indeks; gunakan `--deep` untuk pemeriksaan kesiapan vektor + embedding atau `--fix` untuk memperbaiki artefak recall/promotion yang usang.
- `openclaw memory index` — indeks ulang file memori.
- `openclaw memory search "<query>"` (atau `--query "<query>"`) — pencarian semantik atas memori.
- `openclaw memory promote` — beri peringkat recall jangka pendek dan secara opsional tambahkan entri teratas ke `MEMORY.md`.

## Sandbox

Kelola runtime sandbox untuk eksekusi agen terisolasi. Lihat [/cli/sandbox](/cli/sandbox).

Subperintah:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Catatan:

- `sandbox recreate` menghapus runtime yang ada sehingga penggunaan berikutnya akan menginisialisasinya lagi dengan konfigurasi saat ini.
- Untuk backend `ssh` dan OpenShell `remote`, recreate menghapus workspace remote kanonis untuk cakupan yang dipilih.

## Perintah slash chat

Pesan chat mendukung perintah `/...` (teks dan native). Lihat [/tools/slash-commands](/tools/slash-commands).

Sorotan:

- `/status` untuk diagnostik cepat.
- `/config` untuk perubahan konfigurasi yang disimpan.
- `/debug` untuk override konfigurasi hanya runtime (memori, bukan disk; memerlukan `commands.debug: true`).

## Setup + onboarding

### `completion`

Hasilkan skrip shell-completion dan secara opsional pasang ke profil shell Anda.

Opsi:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Catatan:

- Tanpa `--install` atau `--write-state`, `completion` mencetak skrip ke stdout.
- `--install` menulis blok `OpenClaw Completion` ke profil shell Anda dan mengarahkannya ke skrip cache di bawah direktori state OpenClaw.

### `setup`

Inisialisasi konfigurasi + workspace.

Opsi:

- `--workspace <dir>`: path workspace agen (default `~/.openclaw/workspace`).
- `--wizard`: jalankan onboarding.
- `--non-interactive`: jalankan onboarding tanpa prompt.
- `--mode <local|remote>`: mode onboard.
- `--remote-url <url>`: URL Gateway remote.
- `--remote-token <token>`: token Gateway remote.

Onboarding dijalankan otomatis saat ada flag onboarding (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding interaktif untuk gateway, workspace, dan Skills.

Opsi:

- `--workspace <dir>`
- `--reset` (reset konfigurasi + kredensial + sesi sebelum onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (default `config+creds+sessions`; gunakan `full` untuk juga menghapus workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual adalah alias untuk advanced)
- `--auth-choice <choice>` dengan `<choice>` salah satu dari:
  `chutes`, `deepseek-api-key`, `openai-codex`, `openai-api-key`,
  `openrouter-api-key`, `kilocode-api-key`, `litellm-api-key`, `ai-gateway-api-key`,
  `cloudflare-ai-gateway-api-key`, `moonshot-api-key`, `moonshot-api-key-cn`,
  `kimi-code-api-key`, `synthetic-api-key`, `venice-api-key`, `together-api-key`,
  `huggingface-api-key`, `apiKey`, `gemini-api-key`, `google-gemini-cli`, `zai-api-key`,
  `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`, `xiaomi-api-key`,
  `minimax-global-oauth`, `minimax-global-api`, `minimax-cn-oauth`, `minimax-cn-api`,
  `opencode-zen`, `opencode-go`, `github-copilot`, `copilot-proxy`, `xai-api-key`,
  `mistral-api-key`, `volcengine-api-key`, `byteplus-api-key`, `qianfan-api-key`,
  `qwen-standard-api-key-cn`, `qwen-standard-api-key`, `qwen-api-key-cn`, `qwen-api-key`,
  `modelstudio-standard-api-key-cn`, `modelstudio-standard-api-key`,
  `modelstudio-api-key-cn`, `modelstudio-api-key`, `custom-api-key`, `skip`
- Catatan Qwen: keluarga `qwen-*` adalah `auth-choice` kanonis. ID `modelstudio-*`
  tetap diterima hanya sebagai alias kompatibilitas lama.
- `--secret-input-mode <plaintext|ref>` (default `plaintext`; gunakan `ref` untuk menyimpan ref env default penyedia alih-alih kunci plaintext)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (non-interaktif; digunakan dengan `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (non-interaktif; digunakan dengan `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (non-interaktif; opsional; digunakan dengan `--auth-choice custom-api-key`; fallback ke `CUSTOM_API_KEY` jika dihilangkan)
- `--custom-provider-id <id>` (non-interaktif; id penyedia kustom opsional)
- `--custom-compatibility <openai|anthropic>` (non-interaktif; opsional; default `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (non-interaktif; simpan `gateway.auth.token` sebagai env SecretRef; mensyaratkan env var tersebut disetel; tidak dapat digabungkan dengan `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (node manager setup/onboarding untuk Skills; pnpm direkomendasikan, bun juga didukung)
- `--json`

### `configure`

Wizard konfigurasi interaktif (model, channel, Skills, gateway).

Opsi:

- `--section <section>` (dapat diulang; batasi wizard ke bagian tertentu)

### `config`

Helper konfigurasi non-interaktif (get/set/unset/file/schema/validate). Menjalankan `openclaw config` tanpa
subperintah akan meluncurkan wizard.

Subperintah:

- `config get <path>`: cetak nilai konfigurasi (path titik/kurung siku).
- `config set`: mendukung empat mode penetapan:
  - mode nilai: `config set <path> <value>` (parsing JSON5-atau-string)
  - mode pembuat SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - mode pembuat provider: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - mode batch: `config set --batch-json '<json>'` atau `config set --batch-file <path>`
- `config set --dry-run`: validasi penetapan tanpa menulis `openclaw.json` (pemeriksaan exec SecretRef dilewati secara default).
- `config set --allow-exec --dry-run`: ikut serta dalam pemeriksaan dry-run exec SecretRef (dapat mengeksekusi perintah provider).
- `config set --dry-run --json`: keluarkan output dry-run yang dapat diproses mesin (pemeriksaan + sinyal kelengkapan, operasi, ref yang diperiksa/dilewati, error).
- `config set --strict-json`: wajibkan parsing JSON5 untuk input path/nilai. `--json` tetap menjadi alias lama untuk parsing ketat di luar mode output dry-run.
- `config unset <path>`: hapus nilai.
- `config file`: cetak path file konfigurasi aktif.
- `config schema`: cetak skema JSON yang dihasilkan untuk `openclaw.json`, termasuk metadata docs `title` / `description` field yang dipropagasikan di cabang objek bertingkat, wildcard, item array, dan komposisi, plus metadata skema plugin/channel langsung dengan upaya terbaik.
- `config validate`: validasi konfigurasi saat ini terhadap skema tanpa memulai gateway.
- `config validate --json`: keluarkan output JSON yang dapat diproses mesin.

### `doctor`

Pemeriksaan kesehatan + perbaikan cepat (konfigurasi + gateway + layanan lama).

Opsi:

- `--no-workspace-suggestions`: nonaktifkan petunjuk memori workspace.
- `--yes`: terima default tanpa prompt (headless).
- `--non-interactive`: lewati prompt; hanya terapkan migrasi aman.
- `--deep`: pindai layanan sistem untuk instalasi gateway tambahan.
- `--repair` (alias: `--fix`): coba perbaikan otomatis untuk masalah yang terdeteksi.
- `--force`: paksa perbaikan meski tidak benar-benar diperlukan.
- `--generate-gateway-token`: hasilkan token auth gateway baru.

### `dashboard`

Buka Control UI dengan token Anda saat ini.

Opsi:

- `--no-open`: cetak URL tetapi jangan meluncurkan browser

Catatan:

- Untuk token gateway yang dikelola SecretRef, `dashboard` mencetak atau membuka URL tanpa token alih-alih mengekspos secret di output terminal atau argumen peluncuran browser.

### `update`

Perbarui CLI yang terpasang.

Opsi root:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Subperintah:

- `update status`
- `update wizard`

Opsi `update status`:

- `--json`
- `--timeout <seconds>`

Opsi `update wizard`:

- `--timeout <seconds>`

Catatan:

- `openclaw --update` ditulis ulang menjadi `openclaw update`.

### `backup`

Buat dan verifikasi arsip cadangan lokal untuk state OpenClaw.

Subperintah:

- `backup create`
- `backup verify <archive>`

Opsi `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Opsi `backup verify <archive>`:

- `--json`

## Helper channel

### `channels`

Kelola akun channel chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Subperintah:

- `channels list`: tampilkan channel yang dikonfigurasi dan profil auth.
- `channels status`: periksa keterjangkauan gateway dan kesehatan channel (`--probe` menjalankan pemeriksaan probe/audit langsung per akun saat gateway dapat dijangkau; jika tidak, akan fallback ke ringkasan channel berbasis konfigurasi saja. Gunakan `openclaw health` atau `openclaw status --deep` untuk probe kesehatan gateway yang lebih luas).
- Tip: `channels status` mencetak peringatan dengan saran perbaikan saat dapat mendeteksi salah konfigurasi umum (lalu mengarahkan Anda ke `openclaw doctor`).
- `channels logs`: tampilkan log channel terbaru dari file log gateway.
- `channels add`: setup bergaya wizard saat tidak ada flag yang diberikan; flag mengalihkan ke mode non-interaktif.
  - Saat menambahkan akun non-default ke channel yang masih menggunakan konfigurasi tingkat atas akun tunggal, OpenClaw mempromosikan nilai yang dicakup akun ke peta akun channel sebelum menulis akun baru. Sebagian besar channel menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok.
  - `channels add` non-interaktif tidak otomatis membuat/memutakhirkan binding; binding khusus channel tetap cocok dengan akun default.
- `channels remove`: nonaktifkan secara default; berikan `--delete` untuk menghapus entri konfigurasi tanpa prompt.
- `channels login`: login channel interaktif (hanya WhatsApp Web).
- `channels logout`: logout dari sesi channel (jika didukung).

Opsi umum:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: id akun channel (default `default`)
- `--name <label>`: nama tampilan untuk akun

Opsi `channels login`:

- `--channel <channel>` (default `whatsapp`; mendukung `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Opsi `channels logout`:

- `--channel <channel>` (default `whatsapp`)
- `--account <id>`

Opsi `channels list`:

- `--no-usage`: lewati snapshot penggunaan/kuota penyedia model (hanya yang berbasis OAuth/API).
- `--json`: keluarkan JSON (termasuk penggunaan kecuali `--no-usage` disetel).

Opsi `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Opsi `channels capabilities`:

- `--channel <name>`
- `--account <id>` (hanya dengan `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Opsi `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Opsi `channels logs`:

- `--channel <name|all>` (default `all`)
- `--lines <n>` (default `200`)
- `--json`

Catatan:

- `channels login` mendukung `--verbose`.
- `channels capabilities --account` hanya berlaku saat `--channel` disetel.
- `channels status --probe` dapat menampilkan status transport bersama hasil probe/audit seperti `works`, `probe failed`, `audit ok`, atau `audit failed`, bergantung pada dukungan channel.

Lebih detail: [/concepts/oauth](/concepts/oauth)

Contoh:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Cari ID diri sendiri, rekan, dan grup untuk channel yang mengekspos permukaan direktori. Lihat [`openclaw directory`](/cli/directory).

Opsi umum:

- `--channel <name>`
- `--account <id>`
- `--json`

Subperintah:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Daftar dan periksa Skills yang tersedia beserta info kesiapan.

Subperintah:

- `skills search [query...]`: cari Skills ClawHub.
- `skills search --limit <n> --json`: batasi hasil pencarian atau keluarkan output yang dapat diproses mesin.
- `skills install <slug>`: pasang sebuah skill dari ClawHub ke workspace aktif.
- `skills install <slug> --version <version>`: pasang versi ClawHub tertentu.
- `skills install <slug> --force`: timpa folder skill workspace yang sudah ada.
- `skills update <slug|--all>`: perbarui Skills ClawHub yang dilacak.
- `skills list`: tampilkan daftar Skills (default saat tidak ada subperintah).
- `skills list --json`: keluarkan inventaris skill yang dapat diproses mesin ke stdout.
- `skills list --verbose`: sertakan requirement yang hilang dalam tabel.
- `skills info <name>`: tampilkan detail untuk satu skill.
- `skills info <name> --json`: keluarkan detail yang dapat diproses mesin ke stdout.
- `skills check`: ringkasan requirement yang siap vs yang hilang.
- `skills check --json`: keluarkan output kesiapan yang dapat diproses mesin ke stdout.

Opsi:

- `--eligible`: tampilkan hanya Skills yang siap.
- `--json`: keluarkan JSON (tanpa gaya).
- `-v`, `--verbose`: sertakan detail requirement yang hilang.

Tip: gunakan `openclaw skills search`, `openclaw skills install`, dan `openclaw skills update` untuk Skills berbasis ClawHub.

### `pairing`

Setujui permintaan pairing DM di berbagai channel.

Subperintah:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Catatan:

- Jika tepat satu channel yang mendukung pairing dikonfigurasi, `pairing approve <code>` juga diperbolehkan.
- `list` dan `approve` keduanya mendukung `--account <id>` untuk channel multi-akun.

### `devices`

Kelola entri pairing perangkat gateway dan token perangkat per peran.

Subperintah:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Catatan:

- `devices list` dan `devices approve` dapat fallback ke file pairing lokal pada local loopback saat cakupan pairing langsung tidak tersedia.
- `devices approve` otomatis memilih permintaan tertunda terbaru saat `requestId` tidak diberikan atau `--latest` disetel.
- Koneksi ulang token tersimpan menggunakan kembali cakupan yang disetujui di cache token; `devices rotate --scope ...` yang eksplisit memperbarui set cakupan tersimpan itu untuk koneksi ulang token cache di masa mendatang.
- `devices rotate` dan `devices revoke` mengembalikan payload JSON.

### `qr`

Hasilkan QR pairing seluler dan kode setup dari konfigurasi Gateway saat ini. Lihat [`openclaw qr`](/cli/qr).

Opsi:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Catatan:

- `--token` dan `--password` saling eksklusif.
- Kode setup membawa token bootstrap berumur pendek, bukan token/password gateway bersama.
- Handoff bootstrap bawaan menjaga token node utama pada `scopes: []`.
- Token bootstrap operator apa pun yang di-handoff tetap dibatasi ke `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`.
- Pemeriksaan cakupan bootstrap diberi prefiks peran, sehingga allowlist operator itu hanya memenuhi permintaan operator; peran non-operator tetap memerlukan cakupan di bawah prefiks perannya sendiri.
- `--remote` dapat menggunakan `gateway.remote.url` atau URL Tailscale Serve/Funnel aktif.
- Setelah memindai, setujui permintaan dengan `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Namespace alias lama. Saat ini mendukung `openclaw clawbot qr`, yang dipetakan ke [`openclaw qr`](/cli/qr).

### `hooks`

Kelola hook agen internal.

Subperintah:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (alias usang untuk `openclaw plugins install`)
- `hooks update [id]` (alias usang untuk `openclaw plugins update`)

Opsi umum:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Catatan:

- Hook yang dikelola plugin tidak dapat diaktifkan atau dinonaktifkan melalui `openclaw hooks`; aktifkan atau nonaktifkan plugin pemiliknya.
- `hooks install` dan `hooks update` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak peringatan deprecation dan meneruskan ke perintah plugin.

### `webhooks`

Helper webhook. Permukaan bawaan saat ini adalah setup + runner Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Setup + runner hook Gmail Pub/Sub. Lihat [Gmail Pub/Sub](/id/automation/cron-jobs#gmail-pubsub-integration).

Subperintah:

- `webhooks gmail setup` (memerlukan `--account <email>`; mendukung `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (override runtime untuk flag yang sama)

Catatan:

- `setup` mengonfigurasi watch Gmail plus path push yang mengarah ke OpenClaw.
- `run` memulai watcher/loop perpanjangan Gmail lokal dengan override runtime opsional.

### `dns`

Helper DNS penemuan area luas (CoreDNS + Tailscale). Permukaan bawaan saat ini:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Helper DNS penemuan area luas (CoreDNS + Tailscale). Lihat [/gateway/discovery](/gateway/discovery).

Opsi:

- `--domain <domain>`
- `--apply`: pasang/perbarui konfigurasi CoreDNS (memerlukan sudo; hanya macOS).

Catatan:

- Tanpa `--apply`, ini adalah helper perencanaan yang mencetak konfigurasi DNS OpenClaw + Tailscale yang direkomendasikan.
- `--apply` saat ini mendukung macOS dengan CoreDNS Homebrew saja.

## Pesan + agen

### `message`

Pesan keluar terpadu + tindakan channel.

Lihat: [/cli/message](/cli/message)

Subperintah:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Contoh:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Jalankan satu giliran agen melalui Gateway (atau embedded `--local`).

Berikan setidaknya satu pemilih sesi: `--to`, `--session-id`, atau `--agent`.

Wajib:

- `-m, --message <text>`

Opsi:

- `-t, --to <dest>` (untuk kunci sesi dan pengiriman opsional)
- `--session-id <id>`
- `--agent <id>` (id agen; menimpa binding perutean)
- `--thinking <off|minimal|low|medium|high|xhigh>` (dukungan penyedia bervariasi; tidak dibatasi model di level CLI)
- `--verbose <on|off>`
- `--channel <channel>` (channel pengiriman; hilangkan untuk menggunakan channel sesi utama)
- `--reply-to <target>` (override target pengiriman, terpisah dari perutean sesi)
- `--reply-channel <channel>` (override channel pengiriman)
- `--reply-account <id>` (override id akun pengiriman)
- `--local` (eksekusi embedded; registry plugin tetap dimuat terlebih dahulu)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Catatan:

- Mode Gateway fallback ke agen embedded saat permintaan Gateway gagal.
- `--local` tetap memuat terlebih dahulu registry plugin, sehingga provider, tool, dan channel yang disediakan plugin tetap tersedia selama eksekusi embedded.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan perutean.

### `agents`

Kelola agen terisolasi (workspace + auth + perutean).

Menjalankan `openclaw agents` tanpa subperintah setara dengan `openclaw agents list`.

#### `agents list`

Tampilkan agen yang dikonfigurasi.

Opsi:

- `--json`
- `--bindings`

#### `agents add [name]`

Tambahkan agen terisolasi baru. Menjalankan wizard terpandu kecuali flag (atau `--non-interactive`) diberikan; `--workspace` wajib dalam mode non-interaktif.

Opsi:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (dapat diulang)
- `--non-interactive`
- `--json`

Spesifikasi binding menggunakan `channel[:accountId]`. Saat `accountId` dihilangkan, OpenClaw dapat menyelesaikan cakupan akun melalui default channel/hook plugin; jika tidak, itu adalah binding channel tanpa cakupan akun eksplisit.
Memberikan flag add eksplisit apa pun akan mengalihkan perintah ke jalur non-interaktif. `main` dicadangkan dan tidak dapat digunakan sebagai id agen baru.

#### `agents bindings`

Tampilkan binding perutean.

Opsi:

- `--agent <id>`
- `--json`

#### `agents bind`

Tambahkan binding perutean untuk sebuah agen.

Opsi:

- `--agent <id>` (default ke agen default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--json`

#### `agents unbind`

Hapus binding perutean untuk sebuah agen.

Opsi:

- `--agent <id>` (default ke agen default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--all`
- `--json`

Gunakan `--all` atau `--bind`, bukan keduanya.

#### `agents delete <id>`

Hapus agen dan pangkas workspace + state-nya.

Opsi:

- `--force`
- `--json`

Catatan:

- `main` tidak dapat dihapus.
- Tanpa `--force`, konfirmasi interaktif diperlukan.

#### `agents set-identity`

Perbarui identitas agen (nama/tema/emoji/avatar).

Opsi:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Catatan:

- `--agent` atau `--workspace` dapat digunakan untuk memilih agen target.
- Saat tidak ada field identitas eksplisit yang diberikan, perintah membaca `IDENTITY.md`.

### `acp`

Jalankan bridge ACP yang menghubungkan IDE ke Gateway.

Opsi root:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--session <key>`
- `--session-label <label>`
- `--require-existing`
- `--reset-session`
- `--no-prefix-cwd`
- `--provenance <off|meta|meta+receipt>`
- `--verbose`

#### `acp client`

Klien ACP interaktif untuk debug bridge.

Opsi:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Lihat [`acp`](/cli/acp) untuk perilaku lengkap, catatan keamanan, dan contoh.

### `mcp`

Kelola definisi server MCP yang disimpan dan ekspos channel OpenClaw melalui MCP stdio.

#### `mcp serve`

Ekspos percakapan channel OpenClaw yang dirutekan melalui MCP stdio.

Opsi:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Tampilkan definisi server MCP yang disimpan.

Opsi:

- `--json`

#### `mcp show [name]`

Tampilkan satu definisi server MCP yang disimpan atau objek server MCP tersimpan lengkap.

Opsi:

- `--json`

#### `mcp set <name> <value>`

Simpan satu definisi server MCP dari objek JSON.

#### `mcp unset <name>`

Hapus satu definisi server MCP yang disimpan.

### `approvals`

Kelola persetujuan exec. Alias: `exec-approvals`.

#### `approvals get`

Ambil snapshot persetujuan exec dan kebijakan efektif.

Opsi:

- `--node <node>`
- `--gateway`
- `--json`
- opsi RPC node dari `openclaw nodes`

#### `approvals set`

Ganti persetujuan exec dengan JSON dari file atau stdin.

Opsi:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- opsi RPC node dari `openclaw nodes`

#### `approvals allowlist add|remove`

Edit allowlist exec per agen.

Opsi:

- `--node <node>`
- `--gateway`
- `--agent <id>` (default ke `*`)
- `--json`
- opsi RPC node dari `openclaw nodes`

### `status`

Tampilkan kesehatan sesi tertaut dan penerima terbaru.

Opsi:

- `--json`
- `--all` (diagnosis lengkap; read-only, bisa ditempel)
- `--deep` (minta gateway melakukan probe kesehatan langsung, termasuk probe channel jika didukung)
- `--usage` (tampilkan penggunaan/kuota penyedia model)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias untuk `--verbose`)

Catatan:

- Ringkasan mencakup status layanan host Gateway + node jika tersedia.
- `--usage` mencetak jendela penggunaan penyedia yang dinormalisasi sebagai `X% left`.

### Pelacakan penggunaan

OpenClaw dapat menampilkan penggunaan/kuota penyedia saat kredensial OAuth/API tersedia.

Permukaan:

- `/status` (menambahkan baris penggunaan penyedia singkat saat tersedia)
- `openclaw status --usage` (mencetak rincian penyedia lengkap)
- bilah menu macOS (bagian Usage di bawah Context)

Catatan:

- Data berasal langsung dari endpoint penggunaan penyedia (tanpa estimasi).
- Output yang dapat dibaca manusia dinormalisasi menjadi `X% left` di seluruh penyedia.
- Penyedia dengan jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: `usage_percent` / `usagePercent` mentah berarti kuota tersisa, sehingga OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan tetap diutamakan saat ada. Respons `model_remains` mengutamakan entri model chat, menurunkan label jendela dari timestamp saat diperlukan, dan menyertakan nama model di label paket.
- Auth penggunaan berasal dari hook khusus penyedia bila tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/API-key yang cocok dari profil auth, env, atau konfigurasi. Jika tidak ada yang terselesaikan, penggunaan disembunyikan.
- Detail: lihat [Pelacakan penggunaan](/concepts/usage-tracking).

### `health`

Ambil kesehatan dari Gateway yang sedang berjalan.

Opsi:

- `--json`
- `--timeout <ms>`
- `--verbose` (paksa probe langsung dan cetak detail koneksi gateway)
- `--debug` (alias untuk `--verbose`)

Catatan:

- `health` default dapat mengembalikan snapshot gateway cache yang masih baru.
- `health --verbose` memaksa probe langsung dan memperluas output yang dapat dibaca manusia ke semua akun dan agen yang dikonfigurasi.

### `sessions`

Tampilkan daftar sesi percakapan yang tersimpan.

Opsi:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filter sesi menurut agen)
- `--all-agents` (tampilkan sesi di semua agen)

Subperintah:

- `sessions cleanup` — hapus sesi yang kedaluwarsa atau yatim

Catatan:

- `sessions cleanup` juga mendukung `--fix-missing` untuk memangkas entri yang file transkripnya hilang.

## Reset / Uninstall

### `reset`

Reset konfigurasi/state lokal (tetap mempertahankan CLI terpasang).

Opsi:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Catatan:

- `--non-interactive` memerlukan `--scope` dan `--yes`.

### `uninstall`

Copot layanan gateway + data lokal (CLI tetap ada).

Opsi:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Catatan:

- `--non-interactive` memerlukan `--yes` dan cakupan eksplisit (atau `--all`).
- `--all` menghapus layanan, state, workspace, dan app sekaligus.

### `tasks`

Tampilkan dan kelola eksekusi [background task](/id/automation/tasks) di berbagai agen.

- `tasks list` — tampilkan eksekusi task yang aktif dan terbaru
- `tasks show <id>` — tampilkan detail untuk eksekusi task tertentu
- `tasks notify <id>` — ubah kebijakan notifikasi untuk eksekusi task
- `tasks cancel <id>` — batalkan task yang sedang berjalan
- `tasks audit` — tampilkan masalah operasional (usang, hilang, kegagalan pengiriman)
- `tasks maintenance [--apply] [--json]` — pratinjau atau terapkan pembersihan/rekonsiliasi tasks dan TaskFlow (sesi anak ACP/subagen, pekerjaan cron aktif, eksekusi CLI langsung)
- `tasks flow list` — tampilkan flow Task Flow yang aktif dan terbaru
- `tasks flow show <lookup>` — periksa flow berdasarkan id atau kunci lookup
- `tasks flow cancel <lookup>` — batalkan flow yang sedang berjalan dan task aktifnya

### `flows`

Shortcut dokumen lama. Perintah flow berada di bawah `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Jalankan WebSocket Gateway.

Opsi:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (reset konfigurasi dev + kredensial + sesi + workspace)
- `--force` (matikan listener yang ada di port)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (alias usang)
- `--ws-log <auto|full|compact>`
- `--compact` (alias untuk `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Kelola layanan Gateway (launchd/systemd/schtasks).

Subperintah:

- `gateway status` (mem-probe RPC Gateway secara default)
- `gateway install` (instalasi layanan)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Catatan:

- `gateway status` mem-probe RPC Gateway secara default menggunakan port/konfigurasi layanan yang telah diselesaikan (override dengan `--url/--token/--password`).
- `gateway status` mendukung `--no-probe`, `--deep`, `--require-rpc`, dan `--json` untuk scripting.
- `gateway status` juga menampilkan layanan gateway lama atau tambahan saat dapat mendeteksinya (`--deep` menambahkan pemindaian tingkat sistem). Layanan OpenClaw bernama profil diperlakukan sebagai kelas satu dan tidak ditandai sebagai "tambahan".
- `gateway status` tetap tersedia untuk diagnostik bahkan saat konfigurasi CLI lokal hilang atau tidak valid.
- `gateway status` mencetak path log file yang diselesaikan, snapshot path/validitas konfigurasi CLI-vs-layanan, dan URL target probe yang diselesaikan.
- Jika SecretRef auth gateway tidak terselesaikan dalam jalur perintah saat ini, `gateway status --json` melaporkan `rpc.authWarning` hanya saat konektivitas/auth probe gagal (peringatan ditekan saat probe berhasil).
- Pada instalasi systemd Linux, pemeriksaan token drift status mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` mendukung `--json` untuk scripting (output default tetap ramah manusia).
- `gateway install` default ke runtime Node; bun **tidak direkomendasikan** (bug WhatsApp/Telegram).
- Opsi `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Alias lama untuk perintah manajemen layanan Gateway. Lihat [/cli/daemon](/cli/daemon).

Subperintah:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Opsi umum:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Tail log file Gateway melalui RPC.

Opsi:

- `--limit <n>`: jumlah maksimum baris log yang dikembalikan
- `--max-bytes <n>`: byte maksimum yang dibaca dari file log
- `--follow`: ikuti file log (gaya tail -f)
- `--interval <ms>`: interval polling dalam ms saat mengikuti
- `--local-time`: tampilkan timestamp dalam waktu lokal
- `--json`: keluarkan JSON per baris
- `--plain`: nonaktifkan pemformatan terstruktur
- `--no-color`: nonaktifkan warna ANSI
- `--url <url>`: URL WebSocket Gateway eksplisit
- `--token <token>`: token Gateway
- `--timeout <ms>`: timeout RPC Gateway
- `--expect-final`: tunggu respons final saat diperlukan

Contoh:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Catatan:

- Jika Anda memberikan `--url`, CLI tidak otomatis menerapkan konfigurasi atau kredensial lingkungan.
- Kegagalan pairing local loopback fallback ke file log lokal yang dikonfigurasi; target `--url` eksplisit tidak demikian.

### `gateway <subcommand>`

Helper CLI gateway (gunakan `--url`, `--token`, `--password`, `--timeout`, `--expect-final` untuk subperintah RPC).
Saat Anda memberikan `--url`, CLI tidak otomatis menerapkan konfigurasi atau kredensial lingkungan.
Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.

Subperintah:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Catatan:

- `gateway status --deep` menambahkan pemindaian layanan tingkat sistem. Gunakan `gateway probe`,
  `health --verbose`, atau `status --deep` tingkat atas untuk detail probe runtime yang lebih dalam.

RPC umum:

- `config.schema.lookup` (periksa satu subtree konfigurasi dengan node skema dangkal, metadata petunjuk yang cocok, dan ringkasan anak langsung)
- `config.get` (baca snapshot konfigurasi saat ini + hash)
- `config.set` (validasi + tulis konfigurasi penuh; gunakan `baseHash` untuk konkurensi optimistik)
- `config.apply` (validasi + tulis konfigurasi + restart + bangunkan)
- `config.patch` (gabungkan pembaruan parsial + restart + bangunkan)
- `update.run` (jalankan pembaruan + restart + bangunkan)

Tip: saat memanggil `config.set`/`config.apply`/`config.patch` secara langsung, berikan `baseHash` dari
`config.get` jika konfigurasi sudah ada.
Tip: untuk edit parsial, periksa terlebih dahulu dengan `config.schema.lookup` dan utamakan `config.patch`.
Tip: RPC penulisan konfigurasi ini melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirim dan menolak penulisan saat ref terkirim yang secara efektif aktif tidak terselesaikan.
Tip: tool runtime `gateway` khusus pemilik tetap menolak menulis ulang `tools.exec.ask` atau `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

## Model

Lihat [/concepts/models](/concepts/models) untuk perilaku fallback dan strategi pemindaian.

Catatan penagihan: Kami meyakini fallback Claude Code CLI kemungkinan diizinkan untuk otomatisasi lokal yang dikelola pengguna berdasarkan dokumentasi CLI publik Anthropic. Meski begitu, kebijakan third-party harness Anthropic menciptakan ambiguitas yang cukup seputar penggunaan berbasis langganan dalam produk eksternal sehingga kami tidak merekomendasikannya untuk produksi. Anthropic juga memberi tahu pengguna OpenClaw pada **4 April 2026 pukul 12:00 PM PT / 8:00 PM BST** bahwa jalur login Claude **OpenClaw** dihitung sebagai penggunaan third-party harness dan memerlukan **Extra Usage** yang ditagihkan terpisah dari langganan. Untuk produksi, gunakan kunci API Anthropic atau penyedia gaya langganan lain yang didukung seperti OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, atau Z.AI / GLM Coding Plan.

Migrasi Anthropic Claude CLI:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Shortcut onboarding: `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token juga tersedia lagi sebagai jalur auth lama/manual.
Gunakan hanya dengan pemahaman bahwa Anthropic memberi tahu pengguna OpenClaw bahwa jalur login Claude OpenClaw memerlukan **Extra Usage**.

Catatan alias lama: `claude-cli` adalah alias `auth-choice` onboarding yang sudah usang.
Gunakan `anthropic-cli` untuk onboarding, atau gunakan `models auth login` secara langsung.

### `models` (root)

`openclaw models` adalah alias untuk `models status`.

Opsi root:

- `--status-json` (alias untuk `models status --json`)
- `--status-plain` (alias untuk `models status --plain`)

### `models list`

Opsi:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=expired/missing, 2=expiring)
- `--probe` (probe langsung profil auth yang dikonfigurasi)
- `--probe-provider <name>`
- `--probe-profile <id>` (ulangi atau pisahkan dengan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Selalu mencakup ringkasan auth dan status kedaluwarsa OAuth untuk profil di penyimpanan auth.
`--probe` menjalankan permintaan langsung (dapat mengonsumsi token dan memicu batas laju).
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
Perkirakan status probe seperti `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown`, dan `no_model`.
Saat `auth.order.<provider>` yang eksplisit menghilangkan profil tersimpan, laporan probe
menampilkan `excluded_by_auth_order` alih-alih diam-diam mencoba profil itu.

### `models set <model>`

Setel `agents.defaults.model.primary`.

### `models set-image <model>`

Setel `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Opsi:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Opsi:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Opsi:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Opsi:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|login|login-github-copilot|setup-token|paste-token`

Opsi:

- `add`: helper auth interaktif (alur auth penyedia atau tempel token)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: alur login OAuth GitHub Copilot (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Catatan:

- `setup-token` dan `paste-token` adalah perintah token generik untuk penyedia yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode auth token milik penyedia.
- `paste-token` meminta nilai token dan default ke id profil auth `<provider>:manual` saat `--profile-id` dihilangkan.
- Anthropic `setup-token` / `paste-token` tersedia lagi sebagai jalur OpenClaw lama/manual. Anthropic memberi tahu pengguna OpenClaw bahwa jalur ini memerlukan **Extra Usage** pada akun Claude.

### `models auth order get|set|clear`

Opsi:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## Sistem

### `system event`

Antrikan event sistem dan secara opsional picu heartbeat (RPC Gateway).

Wajib:

- `--text <text>`

Opsi:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Kontrol heartbeat (RPC Gateway).

Opsi:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Tampilkan entri presence sistem (RPC Gateway).

Opsi:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Kelola pekerjaan terjadwal (RPC Gateway). Lihat [/automation/cron-jobs](/id/automation/cron-jobs).

Subperintah:

- `cron status [--json]`
- `cron list [--all] [--json]` (output tabel secara default; gunakan `--json` untuk mentah)
- `cron add` (alias: `create`; memerlukan `--name` dan tepat satu dari `--at` | `--every` | `--cron`, dan tepat satu payload dari `--system-event` | `--message`)
- `cron edit <id>` (patch field)
- `cron rm <id>` (alias: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Semua perintah `cron` menerima `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` menggunakan model terpilih yang diizinkan itu untuk pekerjaan. Jika
model tidak diizinkan, cron memperingatkan dan fallback ke pemilihan model default/agen pekerjaan sebagai gantinya. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback per pekerjaan eksplisit tidak lagi menambahkan primary agen sebagai target percobaan ulang ekstra tersembunyi.

## Host node

### `node`

`node` menjalankan **host node tanpa kepala** atau mengelolanya sebagai layanan latar belakang. Lihat
[`openclaw node`](/cli/node).

Subperintah:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Catatan auth:

- `node` menyelesaikan auth gateway dari env/konfigurasi (tanpa flag `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, lalu `gateway.auth.*`. Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.*`; dalam `gateway.mode=remote`, `gateway.remote.*` ikut sesuai aturan prioritas remote.
- Resolusi auth host-node hanya menghormati env var `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` berbicara ke Gateway dan menargetkan node yang telah dipasangkan. Lihat [/nodes](/nodes).

Opsi umum:

- `--url`, `--token`, `--timeout`, `--json`

Subperintah:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (hanya mac)

Kamera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + layar:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Lokasi:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI kontrol browser (Chrome/Brave/Edge/Chromium khusus). Lihat [`openclaw browser`](/cli/browser) dan [Browser tool](/tools/browser).

Opsi umum:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Kelola:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>] [--driver existing-session] [--user-data-dir <path>]`
- `browser delete-profile --name <name>`

Periksa:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Tindakan:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Panggilan suara

### `voicecall`

Utilitas panggilan suara yang disediakan plugin. Hanya muncul saat plugin voice-call terpasang dan diaktifkan. Lihat [`openclaw voicecall`](/cli/voicecall).

Perintah umum:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Pencarian dokumen

### `docs`

Cari indeks dokumen OpenClaw langsung.

### `docs [query...]`

Cari indeks dokumen langsung.

## TUI

### `tui`

Buka UI terminal yang terhubung ke Gateway.

Opsi:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
