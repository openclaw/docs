---
read_when:
    - Doğru `openclaw` alt komutunu bulma
    - Genel bayrakları veya çıktı biçimlendirme kurallarını arama
summary: 'OpenClaw CLI dizini: komut listesi, genel bayraklar ve komut başına sayfalara bağlantılar'
title: CLI başvurusu
x-i18n:
    generated_at: "2026-04-24T09:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9fec51767cf6c2a0abeb684f00877371dae3ac05ed864eff03a581976e90c1ce
    source_path: cli/index.md
    workflow: 15
---

`openclaw`, ana CLI giriş noktasıdır. Her çekirdek komutun ya özel bir
başvuru sayfası vardır ya da takma adı olduğu komutla birlikte belgelenir; bu
dizin komutları, genel bayrakları ve CLI genelinde geçerli çıktı biçimlendirme kurallarını listeler.

## Komut sayfaları

| Alan                 | Komutlar                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kurulum ve onboarding | [`setup`](/tr/cli/setup) · [`onboard`](/tr/cli/onboard) · [`configure`](/tr/cli/configure) · [`config`](/tr/cli/config) · [`completion`](/tr/cli/completion) · [`doctor`](/tr/cli/doctor) · [`dashboard`](/tr/cli/dashboard)                |
| Sıfırlama ve kaldırma | [`backup`](/tr/cli/backup) · [`reset`](/tr/cli/reset) · [`uninstall`](/tr/cli/uninstall) · [`update`](/tr/cli/update)                                                                                                               |
| Mesajlaşma ve agent'ler | [`message`](/tr/cli/message) · [`agent`](/tr/cli/agent) · [`agents`](/tr/cli/agents) · [`acp`](/tr/cli/acp) · [`mcp`](/tr/cli/mcp)                                                                                                   |
| Sağlık ve oturumlar  | [`status`](/tr/cli/status) · [`health`](/tr/cli/health) · [`sessions`](/tr/cli/sessions)                                                                                                                                          |
| Gateway ve günlükler | [`gateway`](/tr/cli/gateway) · [`logs`](/tr/cli/logs) · [`system`](/tr/cli/system)                                                                                                                                                |
| Modeller ve çıkarım  | [`models`](/tr/cli/models) · [`infer`](/tr/cli/infer) · `capability` ([`infer`](/tr/cli/infer) için takma ad) · [`memory`](/tr/cli/memory) · [`wiki`](/tr/cli/wiki)                                                                 |
| Ağ ve Node'lar       | [`directory`](/tr/cli/directory) · [`nodes`](/tr/cli/nodes) · [`devices`](/tr/cli/devices) · [`node`](/tr/cli/node)                                                                                                                 |
| Çalışma zamanı ve sandbox | [`approvals`](/tr/cli/approvals) · `exec-policy` (bkz. [`approvals`](/tr/cli/approvals)) · [`sandbox`](/tr/cli/sandbox) · [`tui`](/tr/cli/tui) · `chat`/`terminal` ([`tui --local`](/tr/cli/tui) için takma adlar) · [`browser`](/tr/cli/browser) |
| Otomasyon            | [`cron`](/tr/cli/cron) · [`tasks`](/tr/cli/tasks) · [`hooks`](/tr/cli/hooks) · [`webhooks`](/tr/cli/webhooks)                                                                                                                        |
| Keşif ve belgeler    | [`dns`](/tr/cli/dns) · [`docs`](/tr/cli/docs)                                                                                                                                                                                   |
| Eşleştirme ve kanallar | [`pairing`](/tr/cli/pairing) · [`qr`](/tr/cli/qr) · [`channels`](/tr/cli/channels)                                                                                                                                               |
| Güvenlik ve plugin'ler | [`security`](/tr/cli/security) · [`secrets`](/tr/cli/secrets) · [`skills`](/tr/cli/skills) · [`plugins`](/tr/cli/plugins) · [`proxy`](/tr/cli/proxy)                                                                                |
| Eski takma adlar     | [`daemon`](/tr/cli/daemon) (Gateway servisi) · [`clawbot`](/tr/cli/clawbot) (ad alanı)                                                                                                                                         |
| Plugin'ler (isteğe bağlı) | [`voicecall`](/tr/cli/voicecall) (kuruluysa)                                                                                                                                                                          |

## Genel bayraklar

| Bayrak                  | Amaç                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Durumu `~/.openclaw-dev` altında yalıtır ve varsayılan portları kaydırır |
| `--profile <name>`      | Durumu `~/.openclaw-<name>` altında yalıtır                           |
| `--container <name>`    | Yürütme için adlı bir container'ı hedefler                            |
| `--no-color`            | ANSI renklerini devre dışı bırakır (`NO_COLOR=1` de dikkate alınır)   |
| `--update`              | [`openclaw update`](/tr/cli/update) için kısa yol (yalnızca source kurulumları) |
| `-V`, `--version`, `-v` | Sürümü yazdırır ve çıkar                                              |

## Çıktı modları

- ANSI renkleri ve ilerleme göstergeleri yalnızca TTY oturumlarında işlenir.
- OSC-8 köprüleri, desteklenen yerlerde tıklanabilir bağlantılar olarak işlenir; aksi halde
  CLI düz URL'lere geri düşer.
- `--json` (ve desteklenen yerlerde `--plain`), temiz çıktı için biçimlendirmeyi devre dışı bırakır.
- Uzun süren komutlar bir ilerleme göstergesi gösterir (destekleniyorsa OSC 9;4).

Renk paleti için doğruluk kaynağı: `src/terminal/palette.ts`.

## Komut ağacı

<Accordion title="Tam komut ağacı">

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

Plugin'ler ek üst düzey komutlar ekleyebilir (örneğin `openclaw voicecall`).

</Accordion>

## Sohbet slash komutları

Sohbet mesajları `/...` komutlarını destekler. Bkz. [slash commands](/tr/tools/slash-commands).

Öne çıkanlar:

- `/status` — hızlı tanılama.
- `/trace` — oturum kapsamlı plugin trace/debug satırları.
- `/config` — kalıcı yapılandırma değişiklikleri.
- `/debug` — yalnızca çalışma zamanına ait yapılandırma geçersiz kılmaları (disk değil bellek; `commands.debug: true` gerektirir).

## Kullanım izleme

`openclaw status --usage` ve Control UI, OAuth/API kimlik bilgileri mevcut olduğunda
sağlayıcı kullanımını/kotasını gösterir. Veriler doğrudan sağlayıcı kullanım
uç noktalarından gelir ve `X% left` olarak normalize edilir. Geçerli kullanım
pencerelerine sahip sağlayıcılar: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi ve z.ai.

Ayrıntılar için bkz. [Usage tracking](/tr/concepts/usage-tracking).

## İlgili

- [Slash commands](/tr/tools/slash-commands)
- [Configuration](/tr/gateway/configuration)
- [Environment](/tr/help/environment)
