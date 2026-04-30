---
read_when:
    - Menemukan subperintah `openclaw` yang tepat
    - Mencari flag global atau aturan gaya keluaran
summary: 'Indeks CLI OpenClaw: daftar perintah, flag global, dan tautan ke halaman tiap perintah'
title: Referensi CLI
x-i18n:
    generated_at: "2026-04-30T09:39:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` adalah titik masuk CLI utama. Setiap perintah inti memiliki halaman referensi khusus atau didokumentasikan bersama perintah yang menjadi aliasnya; indeks ini mencantumkan perintah, flag global, dan aturan gaya output yang berlaku di seluruh CLI.

## Halaman perintah

| Area                 | Perintah                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Penyiapan dan onboarding | [`crestodian`](/id/cli/crestodian) · [`setup`](/id/cli/setup) · [`onboard`](/id/cli/onboard) · [`configure`](/id/cli/configure) · [`config`](/id/cli/config) · [`completion`](/id/cli/completion) · [`doctor`](/id/cli/doctor) · [`dashboard`](/id/cli/dashboard) |
| Reset dan uninstall  | [`backup`](/id/cli/backup) · [`reset`](/id/cli/reset) · [`uninstall`](/id/cli/uninstall) · [`update`](/id/cli/update)                                                                                                                                 |
| Pesan dan agen | [`message`](/id/cli/message) · [`agent`](/id/cli/agent) · [`agents`](/id/cli/agents) · [`acp`](/id/cli/acp) · [`mcp`](/id/cli/mcp)                                                                                                                       |
| Kesehatan dan sesi  | [`status`](/id/cli/status) · [`health`](/id/cli/health) · [`sessions`](/id/cli/sessions)                                                                                                                                                           |
| Gateway dan log     | [`gateway`](/id/cli/gateway) · [`logs`](/id/cli/logs) · [`system`](/id/cli/system)                                                                                                                                                                 |
| Model dan inferensi | [`models`](/id/cli/models) · [`infer`](/id/cli/infer) · `capability` (alias untuk [`infer`](/id/cli/infer)) · [`memory`](/id/cli/memory) · [`commitments`](/id/cli/commitments) · [`wiki`](/id/cli/wiki)                                                      |
| Jaringan dan node    | [`directory`](/id/cli/directory) · [`nodes`](/id/cli/nodes) · [`devices`](/id/cli/devices) · [`node`](/id/cli/node)                                                                                                                                   |
| Runtime dan sandbox  | [`approvals`](/id/cli/approvals) · `exec-policy` (lihat [`approvals`](/id/cli/approvals)) · [`sandbox`](/id/cli/sandbox) · [`tui`](/id/cli/tui) · `chat`/`terminal` (alias untuk [`tui --local`](/id/cli/tui)) · [`browser`](/id/cli/browser)                 |
| Otomasi           | [`cron`](/id/cli/cron) · [`tasks`](/id/cli/tasks) · [`hooks`](/id/cli/hooks) · [`webhooks`](/id/cli/webhooks)                                                                                                                                         |
| Penemuan dan docs   | [`dns`](/id/cli/dns) · [`docs`](/id/cli/docs)                                                                                                                                                                                                   |
| Pairing dan kanal | [`pairing`](/id/cli/pairing) · [`qr`](/id/cli/qr) · [`channels`](/id/cli/channels)                                                                                                                                                                 |
| Keamanan dan plugin | [`security`](/id/cli/security) · [`secrets`](/id/cli/secrets) · [`skills`](/id/cli/skills) · [`plugins`](/id/cli/plugins) · [`proxy`](/id/cli/proxy)                                                                                                     |
| Alias lama       | [`daemon`](/id/cli/daemon) (layanan Gateway) · [`clawbot`](/id/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugin (opsional)   | [`voicecall`](/id/cli/voicecall) (jika terinstal)                                                                                                                                                                                              |

## Flag global

| Flag                    | Tujuan                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Mengisolasi status di bawah `~/.openclaw-dev` dan menggeser port default         |
| `--profile <name>`      | Mengisolasi status di bawah `~/.openclaw-<name>`                              |
| `--container <name>`    | Menargetkan kontainer bernama untuk eksekusi                                |
| `--no-color`            | Menonaktifkan warna ANSI (`NO_COLOR=1` juga dihormati)                  |
| `--update`              | Singkatan untuk [`openclaw update`](/id/cli/update) (hanya instalasi dari sumber) |
| `-V`, `--version`, `-v` | Mencetak versi dan keluar                                                |

## Mode output

- Warna ANSI dan indikator progres hanya dirender dalam sesi TTY.
- Hyperlink OSC-8 dirender sebagai tautan yang dapat diklik jika didukung; jika tidak,
  CLI kembali menggunakan URL biasa.
- `--json` (dan `--plain` jika didukung) menonaktifkan gaya untuk output bersih.
- Perintah yang berjalan lama menampilkan indikator progres (OSC 9;4 jika didukung).

Sumber kebenaran palet: `src/terminal/palette.ts`.

## Pohon perintah

<Accordion title="Pohon perintah lengkap">

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
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
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
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
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

Plugin dapat menambahkan perintah tingkat atas tambahan (misalnya `openclaw voicecall`).

</Accordion>

## Perintah slash obrolan

Pesan obrolan mendukung perintah `/...`. Lihat [perintah slash](/id/tools/slash-commands).

Sorotan:

- `/status` — diagnostik cepat.
- `/trace` — baris trace/debug plugin dalam cakupan sesi.
- `/config` — perubahan konfigurasi yang dipersistenkan.
- `/debug` — penggantian konfigurasi khusus runtime (memori, bukan disk; memerlukan `commands.debug: true`).

## Pelacakan penggunaan

`openclaw status --usage` dan Control UI menampilkan penggunaan/kuota penyedia ketika
kredensial OAuth/API tersedia. Data berasal langsung dari endpoint penggunaan penyedia
dan dinormalisasi menjadi `X% left`. Penyedia dengan jendela penggunaan saat ini:
Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi, dan z.ai.

Lihat [Pelacakan penggunaan](/id/concepts/usage-tracking) untuk detail.

## Terkait

- [Perintah slash](/id/tools/slash-commands)
- [Konfigurasi](/id/gateway/configuration)
- [Lingkungan](/id/help/environment)
