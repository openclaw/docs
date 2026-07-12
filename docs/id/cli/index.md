---
read_when:
    - Menemukan subperintah `openclaw` yang tepat
    - Mencari flag global atau aturan gaya keluaran
summary: 'Indeks CLI OpenClaw: daftar perintah, flag global, dan tautan ke halaman tiap perintah'
title: Referensi CLI
x-i18n:
    generated_at: "2026-07-12T14:05:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` adalah titik masuk utama CLI. Setiap perintah inti memiliki halaman
referensi khusus atau didokumentasikan bersama perintah yang menjadi aliasnya; indeks ini mencantumkan
perintah, flag global, dan aturan penataan gaya keluaran yang berlaku di seluruh CLI.

Perintah penyiapan berdasarkan tujuan:

- `openclaw setup` dan `openclaw onboard` memverifikasi inferensi terlebih dahulu, lalu memulai Crestodian untuk penyiapan Gateway, ruang kerja, saluran, Skills, dan kesehatan.
- `openclaw setup --baseline` membuat konfigurasi dasar dan ruang kerja tanpa menjalani alur orientasi terpandu.
- `openclaw configure` mengubah bagian tertentu dari penyiapan yang sudah ada: autentikasi model, Gateway, saluran, Plugin, atau Skills.
- `openclaw channels add` mengonfigurasi akun saluran setelah konfigurasi dasar tersedia; jalankan tanpa flag untuk penyiapan terpandu, atau dengan flag khusus saluran untuk skrip.

## Halaman perintah

| Area                         | Perintah                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Penyiapan dan orientasi      | [`crestodian`](/id/cli/crestodian) · [`setup`](/id/cli/setup) · [`onboard`](/id/cli/onboard) · [`configure`](/id/cli/configure) · [`config`](/id/cli/config) · [`completion`](/id/cli/completion) · [`doctor`](/id/cli/doctor) · [`dashboard`](/id/cli/dashboard) |
| Pengaturan ulang, pencadangan, dan migrasi | [`backup`](/id/cli/backup) · [`migrate`](/id/cli/migrate) · [`reset`](/id/cli/reset) · [`uninstall`](/id/cli/uninstall) · [`update`](/id/cli/update)                                                                                                     |
| Perpesanan dan agen          | [`message`](/id/cli/message) · [`agent`](/id/cli/agent) · [`agents`](/id/cli/agents) · [`attach`](/id/cli/attach) · [`acp`](/id/cli/acp) · [`mcp`](/id/cli/mcp)                                                                                             |
| Kesehatan dan sesi           | [`status`](/id/cli/status) · [`health`](/id/cli/health) · [`sessions`](/id/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway dan log              | [`gateway`](/id/cli/gateway) · [`logs`](/id/cli/logs) · [`system`](/id/cli/system)                                                                                                                                                                 |
| Model dan inferensi          | [`models`](/id/cli/models) · [`promos`](/id/cli/promos) · [`infer`](/id/cli/infer) · `capability` (alias untuk [`infer`](/id/cli/infer)) · [`memory`](/id/cli/memory) · [`commitments`](/id/cli/commitments) · [`wiki`](/id/cli/wiki)                            |
| Jaringan dan Node            | [`directory`](/id/cli/directory) · [`nodes`](/id/cli/nodes) · [`devices`](/id/cli/devices) · [`node`](/id/cli/node)                                                                                                                                   |
| Runtime dan sandbox          | [`approvals`](/id/cli/approvals) · `exec-policy` (lihat [`approvals`](/id/cli/approvals)) · [`sandbox`](/id/cli/sandbox) · [`tui`](/id/cli/tui) · `chat`/`terminal` (alias untuk [`tui --local`](/id/cli/tui)) · [`browser`](/id/cli/browser)                 |
| Otomatisasi                  | [`cron`](/id/cli/cron) · [`tasks`](/id/cli/tasks) · [`hooks`](/id/cli/hooks) · [`webhooks`](/id/cli/webhooks) · [`transcripts`](/id/cli/transcripts)                                                                                                     |
| Penemuan dan dokumentasi     | [`dns`](/id/cli/dns) · [`docs`](/id/cli/docs)                                                                                                                                                                                                   |
| Penyandingan dan saluran     | [`pairing`](/id/cli/pairing) · [`qr`](/id/cli/qr) · [`channels`](/id/cli/channels)                                                                                                                                                                 |
| Keamanan dan Plugin          | [`security`](/id/cli/security) · [`secrets`](/id/cli/secrets) · [`skills`](/id/cli/skills) · [`plugins`](/id/cli/plugins) · [`proxy`](/id/cli/proxy)                                                                                                     |
| Alias lama                   | [`daemon`](/id/cli/daemon) (layanan Gateway) · [`clawbot`](/id/cli/clawbot) (ruang nama)                                                                                                                                                         |
| Plugin (opsional)            | [`path`](/id/cli/path) · [`policy`](/id/cli/policy) · [`voicecall`](/id/cli/voicecall) · [`workboard`](/id/cli/workboard) (jika terpasang)                                                                                                              |

## Flag global

| Flag                    | Tujuan                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Mengisolasi status di bawah `~/.openclaw-dev`, menetapkan port Gateway bawaan ke 19001, dan menggeser port turunannya              |
| `--profile <name>`      | Mengisolasi status di bawah `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Menjalankan CLI di dalam kontainer Podman/Docker yang sedang berjalan dengan nama `<name>` (bawaan: env `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Mengganti tingkat log global untuk keluaran berkas + konsol                                                 |
| `--no-color`            | Menonaktifkan warna ANSI (`NO_COLOR=1` juga dipatuhi)                                                    |
| `--update`              | Bentuk singkat untuk [`openclaw update`](/id/cli/update); berfungsi untuk checkout sumber maupun instalasi paket    |
| `-V`, `--version`, `-v` | Menampilkan versi dan keluar                                                                                  |

## Mode keluaran

- Warna ANSI dan indikator kemajuan hanya dirender dalam sesi TTY.
- Hyperlink OSC-8 dirender sebagai tautan yang dapat diklik jika didukung; jika tidak,
  CLI kembali menggunakan URL teks biasa.
- `--json` (dan `--plain` jika didukung) menonaktifkan penataan gaya untuk keluaran yang bersih.
- Perintah yang berjalan lama menampilkan indikator kemajuan (OSC 9;4 jika didukung).

## Palet warna

OpenClaw menggunakan palet lobster untuk keluaran CLI:

| Token          | Heksadesimal | Digunakan untuk                       |
| -------------- | ------------ | ------------------------------------- |
| `accent`       | `#FF5A2D`    | Judul, label, sorotan utama           |
| `accentBright` | `#FF7A3D`    | Nama perintah, penekanan              |
| `accentDim`    | `#D14A22`    | Teks sorotan sekunder                 |
| `info`         | `#FF8A5B`    | Nilai informasional                   |
| `success`      | `#2FBF71`    | Status berhasil                       |
| `warn`         | `#FFB020`    | Peringatan, flag opsi, fallback       |
| `error`        | `#E23D2D`    | Kesalahan, kegagalan                  |
| `muted`        | `#8B7F77`    | Pengurangan penekanan, metadata       |

Sumber acuan palet: `packages/terminal-core/src/palette.ts`.

## Pohon perintah

<Accordion title="Pohon perintah lengkap">

Peta ini mencakup perintah inti dan subperintah utamanya. Subperintah yang ditambahkan
Plugin (misalnya di bawah `skills`, `plugins`, dan `wiki`) berkembang
secara independen; jalankan `<command> --help` untuk daftar terkini yang otoritatif.

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
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
  migrate
    list
    plan <provider>
    apply <provider>
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
    repair
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
    verify
    workshop list|inspect|propose-create|propose-update|revise|apply|reject|quarantine
    list
    info
    check
  plugins
    list
    search
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    build
    validate
    init
    registry
    marketplace list|entries|refresh
  workboard
    list
    create
    show
    dispatch
  memory
    status
    index
    search
  transcripts
    list
    show
    path
  path
    resolve
    find
    set
    validate
    emit
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    compile
    lint
    ingest
    okf import
    search
    get
    apply synthesis|metadata
    bridge import
    unsafe-local import
    chatgpt import|rollback
    obsidian status|search|open|command|daily
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
  attach
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
  audit
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
    stability
    diagnostics export
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
    auth list|add|login|setup-token|paste-token|paste-api-key|login-github-copilot
    auth order get|set|clear
  promos
    list
    claim <slug>
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|personas|providers|status|enable|disable|set-provider|set-persona
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    get
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
  exec-policy
    show
    preset
    set
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
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
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
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

Plugin dapat menambahkan perintah tingkat atas tambahan, seperti
[`openclaw workboard`](/id/cli/workboard) atau `openclaw voicecall`.

</Accordion>

## Perintah garis miring chat

Pesan chat mendukung perintah `/...`. Lihat [perintah garis miring](/id/tools/slash-commands).

Sorotan:

- `/status` - diagnostik cepat.
- `/trace` - baris pelacakan/debug Plugin dengan cakupan sesi.
- `/config` - perubahan konfigurasi yang dipersistenkan.
- `/debug` - penggantian konfigurasi khusus waktu proses (memori, bukan disk; memerlukan `commands.debug: true`).

## Pelacakan penggunaan

`openclaw status --usage` dan UI Kontrol menampilkan penggunaan/kuota penyedia saat
kredensial OAuth/API tersedia. Data berasal langsung dari titik akhir penggunaan
penyedia dan dinormalisasi menjadi `X% tersisa`. Penyedia dengan jendela penggunaan
saat ini: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi, dan z.ai.

Lihat [Pelacakan penggunaan](/id/concepts/usage-tracking) untuk detail.

## Terkait

- [Perintah garis miring](/id/tools/slash-commands)
- [Konfigurasi](/id/gateway/configuration)
- [Lingkungan](/id/help/environment)
