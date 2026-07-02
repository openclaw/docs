---
read_when:
    - Doğru `openclaw` alt komutunu bulma
    - Genel bayraklar veya çıktı biçimlendirme kuralları aranıyor
summary: 'OpenClaw CLI dizini: komut listesi, genel bayraklar ve komut başına sayfalara bağlantılar'
title: CLI referansı
x-i18n:
    generated_at: "2026-07-02T01:11:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627ccd257834e9bc8cacf2f2ac4600530ff4aa1132d2c34fcb0922b29a1facce
    source_path: cli/index.md
    workflow: 16
---

`openclaw`, ana CLI giriş noktasıdır. Her çekirdek komutun ya ayrılmış bir
başvuru sayfası vardır ya da takma ad olarak kullandığı komutla birlikte belgelenir; bu
dizin komutları, genel bayrakları ve CLI genelinde geçerli olan çıktı biçimlendirme kurallarını
listeler.

Kurulum komutlarını amaca göre kullanın:

- `openclaw setup` ve `openclaw onboard`, gateway, model kimlik doğrulaması, çalışma alanı, kanallar, skills ve sağlık için tam kılavuzlu ilk çalıştırma yolunu çalıştırır.
- `openclaw setup --baseline`, kılavuzlu onboarding akışında ilerlemeden temel yapılandırmayı ve çalışma alanını oluşturur.
- `openclaw configure`, mevcut bir kurulumun model kimlik doğrulaması, gateway, kanallar, plugins veya skills gibi hedeflenen bölümlerini değiştirir.
- `openclaw channels add`, temel oluşturulduktan sonra kanal hesaplarını yapılandırır; kılavuzlu kanal kurulumu için bayraksız, betikler için kanala özgü bayraklarla çalıştırın.

## Komut sayfaları

| Alan                 | Komutlar                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kurulum ve onboarding | [`crestodian`](/tr/cli/crestodian) · [`setup`](/tr/cli/setup) · [`onboard`](/tr/cli/onboard) · [`configure`](/tr/cli/configure) · [`config`](/tr/cli/config) · [`completion`](/tr/cli/completion) · [`doctor`](/tr/cli/doctor) · [`dashboard`](/tr/cli/dashboard) |
| Sıfırlama ve kaldırma  | [`backup`](/tr/cli/backup) · [`reset`](/tr/cli/reset) · [`uninstall`](/tr/cli/uninstall) · [`update`](/tr/cli/update)                                                                                                                                 |
| Mesajlaşma ve ajanlar | [`message`](/tr/cli/message) · [`agent`](/tr/cli/agent) · [`agents`](/tr/cli/agents) · [`attach`](/cli/attach) · [`acp`](/tr/cli/acp) · [`mcp`](/tr/cli/mcp)                                                                                             |
| Sağlık ve oturumlar  | [`status`](/tr/cli/status) · [`health`](/tr/cli/health) · [`sessions`](/tr/cli/sessions)                                                                                                                                                           |
| Gateway ve günlükler     | [`gateway`](/tr/cli/gateway) · [`logs`](/tr/cli/logs) · [`system`](/tr/cli/system)                                                                                                                                                                 |
| Modeller ve çıkarım | [`models`](/tr/cli/models) · [`infer`](/tr/cli/infer) · `capability` ([`infer`](/tr/cli/infer) için takma ad) · [`memory`](/tr/cli/memory) · [`commitments`](/tr/cli/commitments) · [`wiki`](/tr/cli/wiki)                                                      |
| Ağ ve düğümler    | [`directory`](/tr/cli/directory) · [`nodes`](/tr/cli/nodes) · [`devices`](/tr/cli/devices) · [`node`](/tr/cli/node)                                                                                                                                   |
| Runtime ve sandbox  | [`approvals`](/tr/cli/approvals) · `exec-policy` ([`approvals`](/tr/cli/approvals) bölümüne bakın) · [`sandbox`](/tr/cli/sandbox) · [`tui`](/tr/cli/tui) · `chat`/`terminal` ([`tui --local`](/tr/cli/tui) için takma adlar) · [`browser`](/tr/cli/browser)                 |
| Otomasyon           | [`cron`](/tr/cli/cron) · [`tasks`](/tr/cli/tasks) · [`hooks`](/tr/cli/hooks) · [`webhooks`](/tr/cli/webhooks) · [`transcripts`](/tr/cli/transcripts)                                                                                                     |
| Keşif ve belgeler   | [`dns`](/tr/cli/dns) · [`docs`](/tr/cli/docs)                                                                                                                                                                                                   |
| Eşleştirme ve kanallar | [`pairing`](/tr/cli/pairing) · [`qr`](/tr/cli/qr) · [`channels`](/tr/cli/channels)                                                                                                                                                                 |
| Güvenlik ve plugins | [`security`](/tr/cli/security) · [`secrets`](/tr/cli/secrets) · [`skills`](/tr/cli/skills) · [`plugins`](/tr/cli/plugins) · [`proxy`](/tr/cli/proxy)                                                                                                     |
| Eski takma adlar       | [`daemon`](/tr/cli/daemon) (gateway hizmeti) · [`clawbot`](/tr/cli/clawbot) (ad alanı)                                                                                                                                                         |
| Plugins (isteğe bağlı)   | [`path`](/tr/cli/path) · [`policy`](/tr/cli/policy) · [`voicecall`](/tr/cli/voicecall) · [`workboard`](/tr/cli/workboard) (kuruluysa)                                                                                                              |

## Genel bayraklar

| Bayrak                    | Amaç                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Durumu `~/.openclaw-dev` altında yalıtın ve varsayılan bağlantı noktalarını kaydırın         |
| `--profile <name>`      | Durumu `~/.openclaw-<name>` altında yalıtın                              |
| `--container <name>`    | Yürütme için adlandırılmış bir kapsayıcıyı hedefleyin                                |
| `--no-color`            | ANSI renklerini devre dışı bırakın (`NO_COLOR=1` de dikkate alınır)                  |
| `--update`              | [`openclaw update`](/tr/cli/update) için kısayol (yalnızca kaynak kurulumları) |
| `-V`, `--version`, `-v` | Sürümü yazdırın ve çıkın                                                |

## Çıktı modları

- ANSI renkleri ve ilerleme göstergeleri yalnızca TTY oturumlarında işlenir.
- OSC-8 köprüleri, desteklenen yerlerde tıklanabilir bağlantılar olarak işlenir; aksi takdirde
  CLI düz URL'lere geri döner.
- `--json` (ve desteklendiği yerlerde `--plain`) temiz çıktı için biçimlendirmeyi devre dışı bırakır.
- Uzun süren komutlar bir ilerleme göstergesi gösterir (desteklendiğinde OSC 9;4).

Paletin doğruluk kaynağı: `src/terminal/palette.ts`.

## Komut ağacı

<Accordion title="Tam komut ağacı">

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

Plugins, [`openclaw workboard`](/tr/cli/workboard) veya `openclaw voicecall` gibi
ek üst düzey komutlar ekleyebilir.

</Accordion>

## Sohbet eğik çizgi komutları

Sohbet mesajları `/...` komutlarını destekler. [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

Öne çıkanlar:

- `/status` — hızlı tanılama.
- `/trace` — oturum kapsamlı plugin izleme/hata ayıklama satırları.
- `/config` — kalıcı yapılandırma değişiklikleri.
- `/debug` — yalnızca runtime yapılandırma geçersiz kılmaları (bellek, disk değil; `commands.debug: true` gerektirir).

## Kullanım takibi

`openclaw status --usage` ve Control UI, OAuth/API kimlik bilgileri mevcut olduğunda sağlayıcı kullanımını/kotasını gösterir. Veriler doğrudan sağlayıcı kullanım
uç noktalarından gelir ve `X% left` olarak normalleştirilir. Geçerli kullanım
pencerelerine sahip sağlayıcılar: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi ve z.ai.

Ayrıntılar için [Kullanım takibi](/tr/concepts/usage-tracking) bölümüne bakın.

## İlgili

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Yapılandırma](/tr/gateway/configuration)
- [Ortam](/tr/help/environment)
