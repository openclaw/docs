---
read_when:
    - Doğru `openclaw` alt komutunu bulma
    - Genel bayrakları veya çıktı biçimlendirme kurallarını arama
summary: 'OpenClaw CLI dizini: komut listesi, genel bayraklar ve komutlara özel sayfalara bağlantılar'
title: CLI başvurusu
x-i18n:
    generated_at: "2026-07-12T12:10:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw`, ana CLI giriş noktasıdır. Her çekirdek komutun kendine ait bir
başvuru sayfası vardır veya diğer adı olduğu komutla birlikte belgelenir; bu dizin,
CLI genelinde geçerli olan komutları, genel bayrakları ve çıktı biçimlendirme kurallarını listeler.

Amaca göre kurulum komutları:

- `openclaw setup` ve `openclaw onboard` önce çıkarımı doğrular, ardından Gateway, çalışma alanı, kanallar, Skills ve sistem durumu kurulumu için Crestodian'ı başlatır.
- `openclaw setup --baseline`, yönlendirmeli ilk katılım akışını izlemeden temel yapılandırmayı ve çalışma alanını oluşturur.
- `openclaw configure`, mevcut bir kurulumun hedeflenen bölümlerini değiştirir: model kimlik doğrulaması, Gateway, kanallar, Plugin'ler veya Skills.
- `openclaw channels add`, temel yapılandırma oluşturulduktan sonra kanal hesaplarını yapılandırır; yönlendirmeli kurulum için bayraksız, betikler içinse kanala özgü bayraklarla çalıştırın.

## Komut sayfaları

| Alan                         | Komutlar                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kurulum ve ilk katılım       | [`crestodian`](/tr/cli/crestodian) · [`setup`](/tr/cli/setup) · [`onboard`](/tr/cli/onboard) · [`configure`](/tr/cli/configure) · [`config`](/tr/cli/config) · [`completion`](/tr/cli/completion) · [`doctor`](/tr/cli/doctor) · [`dashboard`](/tr/cli/dashboard) |
| Sıfırlama, yedekleme ve geçiş | [`backup`](/tr/cli/backup) · [`migrate`](/tr/cli/migrate) · [`reset`](/tr/cli/reset) · [`uninstall`](/tr/cli/uninstall) · [`update`](/tr/cli/update)                                                                                                     |
| Mesajlaşma ve aracılar       | [`message`](/tr/cli/message) · [`agent`](/tr/cli/agent) · [`agents`](/tr/cli/agents) · [`attach`](/tr/cli/attach) · [`acp`](/tr/cli/acp) · [`mcp`](/tr/cli/mcp)                                                                                             |
| Sistem durumu ve oturumlar   | [`status`](/tr/cli/status) · [`health`](/tr/cli/health) · [`sessions`](/tr/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway ve günlükler         | [`gateway`](/tr/cli/gateway) · [`logs`](/tr/cli/logs) · [`system`](/tr/cli/system)                                                                                                                                                                 |
| Modeller ve çıkarım          | [`models`](/tr/cli/models) · [`promos`](/tr/cli/promos) · [`infer`](/tr/cli/infer) · `capability` ([`infer`](/tr/cli/infer) için diğer ad) · [`memory`](/tr/cli/memory) · [`commitments`](/tr/cli/commitments) · [`wiki`](/tr/cli/wiki)                            |
| Ağ ve Node'lar               | [`directory`](/tr/cli/directory) · [`nodes`](/tr/cli/nodes) · [`devices`](/tr/cli/devices) · [`node`](/tr/cli/node)                                                                                                                                   |
| Çalışma zamanı ve korumalı alan | [`approvals`](/tr/cli/approvals) · `exec-policy` (bkz. [`approvals`](/tr/cli/approvals)) · [`sandbox`](/tr/cli/sandbox) · [`tui`](/tr/cli/tui) · `chat`/`terminal` ([`tui --local`](/tr/cli/tui) için diğer adlar) · [`browser`](/tr/cli/browser)                 |
| Otomasyon                    | [`cron`](/tr/cli/cron) · [`tasks`](/tr/cli/tasks) · [`hooks`](/tr/cli/hooks) · [`webhooks`](/tr/cli/webhooks) · [`transcripts`](/tr/cli/transcripts)                                                                                                     |
| Keşif ve belgeler            | [`dns`](/tr/cli/dns) · [`docs`](/tr/cli/docs)                                                                                                                                                                                                   |
| Eşleştirme ve kanallar       | [`pairing`](/tr/cli/pairing) · [`qr`](/tr/cli/qr) · [`channels`](/tr/cli/channels)                                                                                                                                                                 |
| Güvenlik ve Plugin'ler       | [`security`](/tr/cli/security) · [`secrets`](/tr/cli/secrets) · [`skills`](/tr/cli/skills) · [`plugins`](/tr/cli/plugins) · [`proxy`](/tr/cli/proxy)                                                                                                     |
| Eski diğer adlar             | [`daemon`](/tr/cli/daemon) (Gateway hizmeti) · [`clawbot`](/tr/cli/clawbot) (ad alanı)                                                                                                                                                         |
| Plugin'ler (isteğe bağlı)    | [`path`](/tr/cli/path) · [`policy`](/tr/cli/policy) · [`voicecall`](/tr/cli/voicecall) · [`workboard`](/tr/cli/workboard) (kuruluysa)                                                                                                              |

## Genel bayraklar

| Bayrak                  | Amaç                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Durumu `~/.openclaw-dev` altında yalıtır, varsayılan Gateway bağlantı noktasını 19001 yapar ve türetilmiş bağlantı noktalarını kaydırır |
| `--profile <name>`      | Durumu `~/.openclaw-<name>` altında yalıtır (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                |
| `--container <name>`    | CLI'yi `<name>` adlı çalışan bir Podman/Docker konteynerinin içinde çalıştırır (varsayılan: `OPENCLAW_CONTAINER` ortam değişkeni) |
| `--log-level <level>`   | Dosya ve konsol çıktısı için genel günlük düzeyini geçersiz kılar                                       |
| `--no-color`            | ANSI renklerini devre dışı bırakır (`NO_COLOR=1` ayarına da uyulur)                                     |
| `--update`              | [`openclaw update`](/tr/cli/update) için kısaltmadır; hem kaynak kod çalışma kopyalarında hem de paket kurulumlarında çalışır |
| `-V`, `--version`, `-v` | Sürümü yazdırır ve çıkar                                                                               |

## Çıktı kipleri

- ANSI renkleri ve ilerleme göstergeleri yalnızca TTY oturumlarında görüntülenir.
- OSC-8 köprüleri, desteklenen ortamlarda tıklanabilir bağlantılar olarak görüntülenir; aksi durumda
  CLI düz URL'lere geri döner.
- `--json` (ve desteklenen yerlerde `--plain`), temiz çıktı için biçimlendirmeyi devre dışı bırakır.
- Uzun süre çalışan komutlar bir ilerleme göstergesi görüntüler (destekleniyorsa OSC 9;4).

## Renk paleti

OpenClaw, CLI çıktısı için ıstakoz temalı bir palet kullanır:

| Belirteç       | Hex       | Kullanıldığı yerler                         |
| -------------- | --------- | ------------------------------------------- |
| `accent`       | `#FF5A2D` | Başlıklar, etiketler, birincil vurgular     |
| `accentBright` | `#FF7A3D` | Komut adları, vurgu                         |
| `accentDim`    | `#D14A22` | İkincil vurgu metni                         |
| `info`         | `#FF8A5B` | Bilgilendirici değerler                     |
| `success`      | `#2FBF71` | Başarı durumları                            |
| `warn`         | `#FFB020` | Uyarılar, seçenek bayrakları, geri dönüşler |
| `error`        | `#E23D2D` | Hatalar, başarısızlıklar                    |
| `muted`        | `#8B7F77` | Vurguyu azaltma, meta veriler               |

Paletin doğruluk kaynağı: `packages/terminal-core/src/palette.ts`.

## Komut ağacı

<Accordion title="Tam komut ağacı">

Bu harita, çekirdek komutları ve bunların birincil alt komutlarını kapsar. Plugin tarafından eklenen
alt komutlar (örneğin `skills`, `plugins` ve `wiki` altındakiler) bağımsız olarak
gelişir; yetkili ve güncel liste için `<command> --help` komutunu çalıştırın.

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

Pluginler, [`openclaw workboard`](/tr/cli/workboard) veya `openclaw voicecall` gibi ek üst düzey komutlar ekleyebilir.

</Accordion>

## Sohbet eğik çizgi komutları

Sohbet iletileri `/...` komutlarını destekler. Bkz. [eğik çizgi komutları](/tr/tools/slash-commands).

Öne çıkanlar:

- `/status` - hızlı tanılama.
- `/trace` - oturum kapsamındaki Plugin izleme/hata ayıklama satırları.
- `/config` - kalıcı yapılandırma değişiklikleri.
- `/debug` - yalnızca çalışma zamanına yönelik yapılandırma geçersiz kılmaları (diskte değil, bellekte tutulur; `commands.debug: true` gerektirir).

## Kullanım takibi

OAuth/API kimlik bilgileri kullanılabilir olduğunda `openclaw status --usage` ve Denetim Arayüzü, sağlayıcı kullanımını/kotasını gösterir. Veriler doğrudan sağlayıcı kullanım uç noktalarından gelir ve `X% left` biçimine normalleştirilir. Güncel kullanım pencerelerine sahip sağlayıcılar: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex, Xiaomi ve z.ai.

Ayrıntılar için [Kullanım takibi](/tr/concepts/usage-tracking) bölümüne bakın.

## İlgili

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Yapılandırma](/tr/gateway/configuration)
- [Ortam](/tr/help/environment)
