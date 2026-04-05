---
read_when:
    - CLI komutları veya seçenekleri eklerken ya da değiştirirken
    - Yeni komut yüzeylerini belgelerken
summary: '`openclaw` komutları, alt komutları ve seçenekleri için OpenClaw CLI başvurusu'
title: CLI Başvurusu
x-i18n:
    generated_at: "2026-04-05T13:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# CLI başvurusu

Bu sayfa mevcut CLI davranışını açıklar. Komutlar değişirse bu belgeyi güncelleyin.

## Komut sayfaları

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
- [`plugins`](/cli/plugins) (eklenti komutları)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (gateway hizmet komutları için eski takma ad)
- [`clawbot`](/cli/clawbot) (eski takma ad ad alanı)
- [`voicecall`](/cli/voicecall) (eklenti; kuruluysa)

## Global bayraklar

- `--dev`: durumu `~/.openclaw-dev` altında yalıtır ve varsayılan bağlantı noktalarını kaydırır.
- `--profile <name>`: durumu `~/.openclaw-<name>` altında yalıtır.
- `--container <name>`: yürütme için adlı bir kapsayıcıyı hedefler.
- `--no-color`: ANSI renklerini devre dışı bırakır.
- `--update`: `openclaw update` için kısa yol (yalnızca kaynak kurulumları).
- `-V`, `--version`, `-v`: sürümü yazdırır ve çıkar.

## Çıktı biçimlendirmesi

- ANSI renkleri ve ilerleme göstergeleri yalnızca TTY oturumlarında görüntülenir.
- OSC-8 köprüleri desteklenen terminallerde tıklanabilir bağlantılar olarak görüntülenir; aksi halde düz URL'lere geri düşeriz.
- `--json` (ve desteklenen yerlerde `--plain`) temiz çıktı için biçimlendirmeyi devre dışı bırakır.
- `--no-color` ANSI biçimlendirmesini devre dışı bırakır; `NO_COLOR=1` de dikkate alınır.
- Uzun süren komutlar bir ilerleme göstergesi gösterir (destekleniyorsa OSC 9;4).

## Renk paleti

OpenClaw, CLI çıktısı için bir lobster paleti kullanır.

- `accent` (#FF5A2D): başlıklar, etiketler, birincil vurgular.
- `accentBright` (#FF7A3D): komut adları, vurgu.
- `accentDim` (#D14A22): ikincil vurgu metni.
- `info` (#FF8A5B): bilgilendirici değerler.
- `success` (#2FBF71): başarı durumları.
- `warn` (#FFB020): uyarılar, geri dönüşler, dikkat gerektiren durumlar.
- `error` (#E23D2D): hatalar, başarısızlıklar.
- `muted` (#8B7F77): geri planda bırakma, meta veriler.

Paletin doğruluk kaynağı: `src/terminal/palette.ts` (“lobster paleti”).

## Komut ağacı

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

Not: eklentiler ek üst düzey komutlar ekleyebilir (örneğin `openclaw voicecall`).

## Güvenlik

- `openclaw security audit` — yaygın güvenlik tuzakları için config + yerel durumu denetler.
- `openclaw security audit --deep` — en iyi çabayla canlı Gateway yoklaması.
- `openclaw security audit --fix` — güvenli varsayılanları ve durum/config izinlerini sıkılaştırır.

## Gizli bilgiler

### `secrets`

SecretRef'leri ve ilgili çalışma zamanı/config hijyenini yönetin.

Alt komutlar:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

`secrets reload` seçenekleri:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

`secrets audit` seçenekleri:

- `--check`
- `--allow-exec`
- `--json`

`secrets configure` seçenekleri:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

`secrets apply --from <path>` seçenekleri:

- `--dry-run`
- `--allow-exec`
- `--json`

Notlar:

- `reload` bir Gateway RPC'sidir ve çözümleme başarısız olduğunda bilinen son iyi çalışma zamanı anlık görüntüsünü korur.
- `audit --check` bulgu varsa sıfır dışı döner; çözümlenmemiş referanslar daha yüksek öncelikli bir sıfır dışı çıkış kodu kullanır.
- Dry-run `exec` denetimleri varsayılan olarak atlanır; dahil etmek için `--allow-exec` kullanın.

## Eklentiler

Uzantıları ve bunların config'lerini yönetin:

- `openclaw plugins list` — eklentileri keşfeder (makine çıktısı için `--json` kullanın).
- `openclaw plugins inspect <id>` — bir eklentinin ayrıntılarını gösterir (`info` bir takma addır).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — bir eklenti kurar (veya `plugins.load.paths` içine bir eklenti yolu ekler; mevcut bir kurulum hedefinin üzerine yazmak için `--force` kullanın).
- `openclaw plugins marketplace list <marketplace>` — kurulumdan önce pazar yeri girdilerini listeler.
- `openclaw plugins enable <id>` / `disable <id>` — `plugins.entries.<id>.enabled` değerini açar/kapatır.
- `openclaw plugins doctor` — eklenti yükleme hatalarını bildirir.

Çoğu eklenti değişikliği bir gateway yeniden başlatması gerektirir. Bkz. [/plugin](/tools/plugin).

## Bellek

`MEMORY.md` + `memory/*.md` üzerinde vektör arama:

- `openclaw memory status` — dizin istatistiklerini gösterir; vektör + gömme hazırlık denetimleri için `--deep`, eski recall/promotion yapıtlarını onarmak için `--fix` kullanın.
- `openclaw memory index` — bellek dosyalarını yeniden dizinler.
- `openclaw memory search "<query>"` (veya `--query "<query>"`) — bellek üzerinde anlamsal arama.
- `openclaw memory promote` — kısa vadeli geri çağırmaları sıralar ve isteğe bağlı olarak en üstteki girdileri `MEMORY.md` içine ekler.

## Sandbox

Yalıtılmış agent yürütmesi için sandbox çalışma zamanlarını yönetin. Bkz. [/cli/sandbox](/cli/sandbox).

Alt komutlar:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Notlar:

- `sandbox recreate` mevcut çalışma zamanlarını kaldırır; böylece sonraki kullanım bunları mevcut config ile yeniden başlatır.
- `ssh` ve OpenShell `remote` arka uçları için recreate, seçilen kapsamın kanonik uzak çalışma alanını siler.

## Sohbet slash komutları

Sohbet mesajları `/...` komutlarını destekler (metin ve yerel). Bkz. [/tools/slash-commands](/tools/slash-commands).

Öne çıkanlar:

- Hızlı tanı için `/status`.
- Kalıcı config değişiklikleri için `/config`.
- Yalnızca çalışma zamanı config geçersiz kılmaları için `/debug` (bellek, disk değil; `commands.debug: true` gerektirir).

## Kurulum + onboarding

### `completion`

Kabuk tamamlama betiklerini oluşturun ve isteğe bağlı olarak bunları kabuk profilinize kurun.

Seçenekler:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Notlar:

- `--install` veya `--write-state` olmadan `completion` betiği stdout'a yazdırır.
- `--install`, kabuk profilinize bir `OpenClaw Completion` bloğu yazar ve bunu OpenClaw durum dizini altındaki önbelleğe alınmış betiğe yönlendirir.

### `setup`

Config + çalışma alanını başlatın.

Seçenekler:

- `--workspace <dir>`: agent çalışma alanı yolu (varsayılan `~/.openclaw/workspace`).
- `--wizard`: onboarding'i çalıştırır.
- `--non-interactive`: onboarding'i istemler olmadan çalıştırır.
- `--mode <local|remote>`: onboard modu.
- `--remote-url <url>`: uzak Gateway URL'si.
- `--remote-token <token>`: uzak Gateway belirteci.

Herhangi bir onboarding bayrağı bulunduğunda onboarding otomatik çalışır (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Gateway, çalışma alanı ve Skills için etkileşimli onboarding.

Seçenekler:

- `--workspace <dir>`
- `--reset` (onboarding'den önce config + kimlik bilgileri + oturumları sıfırla)
- `--reset-scope <config|config+creds+sessions|full>` (varsayılan `config+creds+sessions`; çalışma alanını da kaldırmak için `full` kullanın)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual`, `advanced` için bir takma addır)
- `--auth-choice <choice>` burada `<choice>` şunlardan biridir:
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
- Qwen notu: `qwen-*` kanonik `auth-choice` ailesidir. `modelstudio-*`
  kimlikleri yalnızca geriye dönük uyumluluk takma adları olarak kabul edilmeye devam eder.
- `--secret-input-mode <plaintext|ref>` (varsayılan `plaintext`; sağlayıcı varsayılan env referanslarını düz metin anahtarlar yerine saklamak için `ref` kullanın)
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
- `--custom-base-url <url>` (etkileşimsiz; `--auth-choice custom-api-key` ile kullanılır)
- `--custom-model-id <id>` (etkileşimsiz; `--auth-choice custom-api-key` ile kullanılır)
- `--custom-api-key <key>` (etkileşimsiz; isteğe bağlı; `--auth-choice custom-api-key` ile kullanılır; belirtilmezse `CUSTOM_API_KEY` kullanılır)
- `--custom-provider-id <id>` (etkileşimsiz; isteğe bağlı özel sağlayıcı kimliği)
- `--custom-compatibility <openai|anthropic>` (etkileşimsiz; isteğe bağlı; varsayılan `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (etkileşimsiz; `gateway.auth.token` değerini bir env SecretRef olarak saklar; bu env değişkeninin ayarlanmış olmasını gerektirir; `--gateway-token` ile birlikte kullanılamaz)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (takma ad: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (Skills için setup/onboarding düğüm yöneticisi; pnpm önerilir, bun da desteklenir)
- `--json`

### `configure`

Etkileşimli config sihirbazı (modeller, kanallar, Skills, gateway).

Seçenekler:

- `--section <section>` (tekrarlanabilir; sihirbazı belirli bölümlerle sınırlar)

### `config`

Etkileşimsiz config yardımcıları (get/set/unset/file/schema/validate). `openclaw config` herhangi bir
alt komut olmadan çalıştırıldığında sihirbazı başlatır.

Alt komutlar:

- `config get <path>`: bir config değerini yazdırır (nokta/köşeli parantez yolu).
- `config set`: dört atama modunu destekler:
  - değer modu: `config set <path> <value>` (JSON5-veya-dize ayrıştırma)
  - SecretRef oluşturucu modu: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - sağlayıcı oluşturucu modu: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - toplu mod: `config set --batch-json '<json>'` veya `config set --batch-file <path>`
- `config set --dry-run`: `openclaw.json` yazmadan atamaları doğrular (`exec` SecretRef denetimleri varsayılan olarak atlanır).
- `config set --allow-exec --dry-run`: `exec` SecretRef dry-run denetimlerini dahil eder (sağlayıcı komutlarını çalıştırabilir).
- `config set --dry-run --json`: makine tarafından okunabilir dry-run çıktısı verir (denetimler + tamlık sinyali, işlemler, denetlenen/atlanmış referanslar, hatalar).
- `config set --strict-json`: yol/değer girdisi için JSON5 ayrıştırmasını zorunlu kılar. `--json`, dry-run çıktı modu dışında katı ayrıştırma için eski bir takma ad olarak kalır.
- `config unset <path>`: bir değeri kaldırır.
- `config file`: etkin config dosyası yolunu yazdırır.
- `config schema`: `openclaw.json` için oluşturulan JSON şemasını yazdırır; iç içe nesne, joker karakter, dizi öğesi ve bileşim dalları boyunca aktarılan `title` / `description` belge meta verilerini ve en iyi çabayla canlı eklenti/kanal şema meta verilerini içerir.
- `config validate`: gateway'i başlatmadan mevcut config'i şemaya göre doğrular.
- `config validate --json`: makine tarafından okunabilir JSON çıktısı verir.

### `doctor`

Sağlık denetimleri + hızlı düzeltmeler (config + gateway + eski hizmetler).

Seçenekler:

- `--no-workspace-suggestions`: çalışma alanı bellek ipuçlarını devre dışı bırakır.
- `--yes`: varsayılanları sormadan kabul eder (headless).
- `--non-interactive`: istemleri atlar; yalnızca güvenli geçişleri uygular.
- `--deep`: ek gateway kurulumları için sistem hizmetlerini tarar.
- `--repair` (takma ad: `--fix`): algılanan sorunlar için otomatik onarımlar dener.
- `--force`: kesinlikle gerekli olmasa bile onarımları zorlar.
- `--generate-gateway-token`: yeni bir gateway auth belirteci oluşturur.

### `dashboard`

Mevcut belirtecinizle Control UI'yi açar.

Seçenekler:

- `--no-open`: URL'yi yazdırır ancak tarayıcı başlatmaz

Notlar:

- SecretRef ile yönetilen gateway belirteçleri için `dashboard`, gizli bilgiyi terminal çıktısında veya tarayıcı başlatma argümanlarında açığa çıkarmak yerine belirteç içermeyen bir URL yazdırır veya açar.

### `update`

Kurulu CLI'yi güncelleyin.

Kök seçenekleri:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Alt komutlar:

- `update status`
- `update wizard`

`update status` seçenekleri:

- `--json`
- `--timeout <seconds>`

`update wizard` seçenekleri:

- `--timeout <seconds>`

Notlar:

- `openclaw --update`, `openclaw update` olarak yeniden yazılır.

### `backup`

OpenClaw durumu için yerel yedek arşivleri oluşturun ve doğrulayın.

Alt komutlar:

- `backup create`
- `backup verify <archive>`

`backup create` seçenekleri:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

`backup verify <archive>` seçenekleri:

- `--json`

## Kanal yardımcıları

### `channels`

Sohbet kanalı hesaplarını yönetin (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (eklenti)/Signal/iMessage/Microsoft Teams).

Alt komutlar:

- `channels list`: yapılandırılmış kanalları ve auth profillerini gösterir.
- `channels status`: gateway erişilebilirliğini ve kanal sağlığını denetler (`--probe`, gateway erişilebilirse hesap başına canlı yoklama/denetim kontrollerini çalıştırır; değilse yalnızca config tabanlı kanal özetlerine geri döner. Daha geniş gateway sağlık yoklamaları için `openclaw health` veya `openclaw status --deep` kullanın).
- İpucu: `channels status`, yaygın yanlış yapılandırmaları algılayabildiğinde önerilen düzeltmelerle birlikte uyarılar yazdırır (ardından sizi `openclaw doctor` komutuna yönlendirir).
- `channels logs`: gateway günlük dosyasından son kanal günlüklerini gösterir.
- `channels add`: hiçbir bayrak verilmezse sihirbaz tarzı kurulum; bayraklar etkileşimsiz moda geçirir.
  - Hâlâ tek hesaplı üst düzey config kullanan bir kanala varsayılan olmayan bir hesap eklenirken, OpenClaw yeni hesabı yazmadan önce hesap kapsamlı değerleri kanal hesap eşlemesine yükseltir. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlı/varsayılan hedefi koruyabilir.
  - Etkileşimsiz `channels add`, bağları otomatik oluşturmaz/yükseltmez; yalnızca kanal bağları varsayılan hesapla eşleşmeye devam eder.
- `channels remove`: varsayılan olarak devre dışı bırakır; istem olmadan config girdilerini kaldırmak için `--delete` geçin.
- `channels login`: etkileşimli kanal girişi (yalnızca WhatsApp Web).
- `channels logout`: bir kanal oturumundan çıkış yapar (destekleniyorsa).

Ortak seçenekler:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: kanal hesap kimliği (varsayılan `default`)
- `--name <label>`: hesabın görünen adı

`channels login` seçenekleri:

- `--channel <channel>` (varsayılan `whatsapp`; `whatsapp`/`web` destekler)
- `--account <id>`
- `--verbose`

`channels logout` seçenekleri:

- `--channel <channel>` (varsayılan `whatsapp`)
- `--account <id>`

`channels list` seçenekleri:

- `--no-usage`: model sağlayıcı kullanım/kota anlık görüntülerini atlar (yalnızca OAuth/API tabanlı).
- `--json`: JSON çıktısı verir (`--no-usage` ayarlı değilse kullanım bilgilerini içerir).

`channels status` seçenekleri:

- `--probe`
- `--timeout <ms>`
- `--json`

`channels capabilities` seçenekleri:

- `--channel <name>`
- `--account <id>` (yalnızca `--channel` ile)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

`channels resolve` seçenekleri:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

`channels logs` seçenekleri:

- `--channel <name|all>` (varsayılan `all`)
- `--lines <n>` (varsayılan `200`)
- `--json`

Notlar:

- `channels login`, `--verbose` desteğine sahiptir.
- `channels capabilities --account` yalnızca `--channel` ayarlıysa geçerlidir.
- `channels status --probe`, kanal desteğine bağlı olarak taşıma durumu ile birlikte `works`, `probe failed`, `audit ok` veya `audit failed` gibi yoklama/denetim sonuçlarını gösterebilir.

Daha fazla ayrıntı: [/concepts/oauth](/concepts/oauth)

Örnekler:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Dizin yüzeyi sunan kanallar için kendinizin, eşlerin ve grupların kimliklerini bulun. Bkz. [`openclaw directory`](/cli/directory).

Ortak seçenekler:

- `--channel <name>`
- `--account <id>`
- `--json`

Alt komutlar:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Kullanılabilir Skills ve hazırlık bilgilerini listeleyin ve inceleyin.

Alt komutlar:

- `skills search [query...]`: ClawHub Skills içinde arama yapar.
- `skills search --limit <n> --json`: arama sonuçlarını sınırlar veya makine tarafından okunabilir çıktı verir.
- `skills install <slug>`: ClawHub'dan etkin çalışma alanına bir skill kurar.
- `skills install <slug> --version <version>`: belirli bir ClawHub sürümünü kurar.
- `skills install <slug> --force`: mevcut bir çalışma alanı skill klasörünün üzerine yazar.
- `skills update <slug|--all>`: izlenen ClawHub Skills'i günceller.
- `skills list`: Skills'i listeler (alt komut verilmezse varsayılan).
- `skills list --json`: stdout'a makine tarafından okunabilir skill envanteri verir.
- `skills list --verbose`: tabloda eksik gereksinimleri içerir.
- `skills info <name>`: tek bir skill için ayrıntıları gösterir.
- `skills info <name> --json`: stdout'a makine tarafından okunabilir ayrıntıları verir.
- `skills check`: hazır ve eksik gereksinimlerin özeti.
- `skills check --json`: stdout'a makine tarafından okunabilir hazırlık çıktısı verir.

Seçenekler:

- `--eligible`: yalnızca hazır Skills'i gösterir.
- `--json`: JSON çıktısı verir (biçimlendirme yok).
- `-v`, `--verbose`: eksik gereksinim ayrıntılarını içerir.

İpucu: ClawHub destekli Skills için `openclaw skills search`, `openclaw skills install` ve `openclaw skills update` kullanın.

### `pairing`

Kanallar arasında DM eşleştirme isteklerini onaylayın.

Alt komutlar:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Notlar:

- Tam olarak bir eşleştirme destekli kanal yapılandırılmışsa `pairing approve <code>` kullanımına da izin verilir.
- `list` ve `approve`, çok hesaplı kanallar için `--account <id>` desteğine sahiptir.

### `devices`

Gateway cihaz eşleştirme kayıtlarını ve rol başına cihaz belirteçlerini yönetin.

Alt komutlar:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Notlar:

- `devices list` ve `devices approve`, doğrudan eşleştirme kapsamı kullanılamadığında local loopback üzerinde yerel eşleştirme dosyalarına geri dönebilir.
- `devices approve`, `requestId` geçirilmediğinde veya `--latest` ayarlandığında en yeni bekleyen isteği otomatik seçer.
- Saklanan belirteçle yeniden bağlantılar, belirtecin önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık
  `devices rotate --scope ...`, gelecekteki
  önbellekli belirteç yeniden bağlantıları için saklanan kapsam kümesini günceller.
- `devices rotate` ve `devices revoke` JSON yükleri döndürür.

### `qr`

Mevcut Gateway config'inden bir mobil eşleştirme QR'si ve kurulum kodu üretin. Bkz. [`openclaw qr`](/cli/qr).

Seçenekler:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Notlar:

- `--token` ve `--password` birlikte kullanılamaz.
- Kurulum kodu, paylaşılan gateway belirteci/parolası değil, kısa ömürlü bir bootstrap belirteci taşır.
- Yerleşik bootstrap aktarımı, birincil düğüm belirtecini `scopes: []` olarak tutar.
- Aktarılan herhangi bir operatör bootstrap belirteci, `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır.
- Bootstrap kapsam denetimleri rol öneklidir; bu nedenle operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan roller yine kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.
- `--remote`, `gateway.remote.url` veya etkin Tailscale Serve/Funnel URL'sini kullanabilir.
- Taradıktan sonra isteği `openclaw devices list` / `openclaw devices approve <requestId>` ile onaylayın.

### `clawbot`

Eski takma ad ad alanı. Şu anda [`openclaw qr`](/cli/qr) komutuna eşlenen `openclaw clawbot qr` desteklenir.

### `hooks`

Dahili agent hook'larını yönetin.

Alt komutlar:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (`openclaw plugins install` için kullanımdan kalkmış takma ad)
- `hooks update [id]` (`openclaw plugins update` için kullanımdan kalkmış takma ad)

Ortak seçenekler:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Notlar:

- Eklenti tarafından yönetilen hook'lar `openclaw hooks` üzerinden etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahip eklentiyi etkinleştirin veya devre dışı bırakın.
- `hooks install` ve `hooks update` uyumluluk takma adları olarak hâlâ çalışır, ancak kullanımdan kaldırma uyarıları yazdırır ve eklenti komutlarına yönlendirir.

### `webhooks`

Webhook yardımcıları. Mevcut yerleşik yüzey Gmail Pub/Sub kurulumu + çalıştırıcısıdır:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Gmail Pub/Sub hook kurulumu + çalıştırıcısı. Bkz. [Gmail Pub/Sub](/tr/automation/cron-jobs#gmail-pubsub-integration).

Alt komutlar:

- `webhooks gmail setup` (`--account <email>` gerektirir; `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json` destekler)
- `webhooks gmail run` (aynı bayraklar için çalışma zamanı geçersiz kılmaları)

Notlar:

- `setup`, Gmail watch'ı ve OpenClaw'a bakan push yolunu yapılandırır.
- `run`, isteğe bağlı çalışma zamanı geçersiz kılmalarıyla yerel Gmail watcher/yenileme döngüsünü başlatır.

### `dns`

Geniş alan keşfi DNS yardımcıları (CoreDNS + Tailscale). Mevcut yerleşik yüzey:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Geniş alan keşfi DNS yardımcısı (CoreDNS + Tailscale). Bkz. [/gateway/discovery](/gateway/discovery).

Seçenekler:

- `--domain <domain>`
- `--apply`: CoreDNS config'ini kurar/günceller (sudo gerektirir; yalnızca macOS).

Notlar:

- `--apply` olmadan bu, önerilen OpenClaw + Tailscale DNS config'ini yazdıran bir planlama yardımcısıdır.
- `--apply` şu anda yalnızca Homebrew CoreDNS kullanan macOS'u destekler.

## Mesajlaşma + agent

### `message`

Birleşik giden mesajlaşma + kanal eylemleri.

Bkz.: [/cli/message](/cli/message)

Alt komutlar:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Örnekler:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Gateway üzerinden (veya gömülü `--local`) tek bir agent turu çalıştırın.

En az bir oturum seçici geçin: `--to`, `--session-id` veya `--agent`.

Gerekli:

- `-m, --message <text>`

Seçenekler:

- `-t, --to <dest>` (oturum anahtarı ve isteğe bağlı teslimat için)
- `--session-id <id>`
- `--agent <id>` (agent kimliği; yönlendirme bağlarını geçersiz kılar)
- `--thinking <off|minimal|low|medium|high|xhigh>` (sağlayıcı desteği değişir; CLI düzeyinde model kapılı değildir)
- `--verbose <on|off>`
- `--channel <channel>` (teslimat kanalı; ana oturum kanalını kullanmak için boş bırakın)
- `--reply-to <target>` (oturum yönlendirmesinden ayrı teslimat hedefi geçersiz kılma)
- `--reply-channel <channel>` (teslimat kanalı geçersiz kılma)
- `--reply-account <id>` (teslimat hesap kimliği geçersiz kılma)
- `--local` (gömülü çalıştırma; eklenti kayıt defteri yine önce önceden yüklenir)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Notlar:

- Gateway modu, Gateway isteği başarısız olduğunda gömülü agent'a geri düşer.
- `--local` yine de eklenti kayıt defterini önceden yükler; böylece eklenti tarafından sağlanan sağlayıcılar, araçlar ve kanallar gömülü çalıştırmalar sırasında da kullanılabilir.
- `--channel`, `--reply-channel` ve `--reply-account`, yönlendirmeyi değil yanıt teslimatını etkiler.

### `agents`

Yalıtılmış agent'ları yönetin (çalışma alanları + auth + yönlendirme).

Alt komut olmadan `openclaw agents` çalıştırmak, `openclaw agents list` ile eşdeğerdir.

#### `agents list`

Yapılandırılmış agent'ları listeler.

Seçenekler:

- `--json`
- `--bindings`

#### `agents add [name]`

Yeni bir yalıtılmış agent ekler. Bayraklar (veya `--non-interactive`) geçirilmedikçe rehberli sihirbazı çalıştırır; etkileşimsiz modda `--workspace` gereklidir.

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Bağlantı belirtimleri `channel[:accountId]` biçimini kullanır. `accountId` atlandığında OpenClaw hesap kapsamını kanal varsayılanları/eklenti hook'ları üzerinden çözebilir; aksi halde bu, açık hesap kapsamı olmayan bir kanal bağıdır.
Herhangi bir açık add bayrağı geçirilmesi komutu etkileşimsiz yola geçirir. `main` ayrılmıştır ve yeni agent kimliği olarak kullanılamaz.

#### `agents bindings`

Yönlendirme bağlarını listeler.

Seçenekler:

- `--agent <id>`
- `--json`

#### `agents bind`

Bir agent için yönlendirme bağları ekler.

Seçenekler:

- `--agent <id>` (varsayılan olarak mevcut varsayılan agent)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--json`

#### `agents unbind`

Bir agent için yönlendirme bağlarını kaldırır.

Seçenekler:

- `--agent <id>` (varsayılan olarak mevcut varsayılan agent)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--all`
- `--json`

`--all` veya `--bind` kullanın, ikisini birden değil.

#### `agents delete <id>`

Bir agent'ı siler ve onun çalışma alanını + durumunu temizler.

Seçenekler:

- `--force`
- `--json`

Notlar:

- `main` silinemez.
- `--force` olmadan etkileşimli onay gerekir.

#### `agents set-identity`

Bir agent kimliğini günceller (ad/tema/emoji/avatar).

Seçenekler:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Notlar:

- Hedef agent'ı seçmek için `--agent` veya `--workspace` kullanılabilir.
- Açık kimlik alanları verilmediğinde komut `IDENTITY.md` dosyasını okur.

### `acp`

IDE'leri Gateway'e bağlayan ACP köprüsünü çalıştırın.

Kök seçenekleri:

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

Köprü hata ayıklaması için etkileşimli ACP istemcisi.

Seçenekler:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Tam davranış, güvenlik notları ve örnekler için [`acp`](/cli/acp) bölümüne bakın.

### `mcp`

Kaydedilmiş MCP sunucu tanımlarını yönetin ve OpenClaw kanallarını MCP stdio üzerinden açığa çıkarın.

#### `mcp serve`

Yönlendirilmiş OpenClaw kanal konuşmalarını MCP stdio üzerinden açığa çıkarır.

Seçenekler:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Kaydedilmiş MCP sunucu tanımlarını listeler.

Seçenekler:

- `--json`

#### `mcp show [name]`

Kaydedilmiş tek bir MCP sunucu tanımını veya kaydedilmiş MCP sunucu nesnesinin tamamını gösterir.

Seçenekler:

- `--json`

#### `mcp set <name> <value>`

Bir JSON nesnesinden tek bir MCP sunucu tanımı kaydeder.

#### `mcp unset <name>`

Kaydedilmiş tek bir MCP sunucu tanımını kaldırır.

### `approvals`

`exec` onaylarını yönetin. Takma ad: `exec-approvals`.

#### `approvals get`

`exec` onayları anlık görüntüsünü ve etkin ilkeyi getirir.

Seçenekler:

- `--node <node>`
- `--gateway`
- `--json`
- `openclaw nodes` içinden düğüm RPC seçenekleri

#### `approvals set`

`exec` onaylarını bir dosyadan veya stdin'den gelen JSON ile değiştirir.

Seçenekler:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- `openclaw nodes` içinden düğüm RPC seçenekleri

#### `approvals allowlist add|remove`

Agent başına `exec` izin listesini düzenler.

Seçenekler:

- `--node <node>`
- `--gateway`
- `--agent <id>` (varsayılan `*`)
- `--json`
- `openclaw nodes` içinden düğüm RPC seçenekleri

### `status`

Bağlı oturum sağlığını ve son alıcıları gösterir.

Seçenekler:

- `--json`
- `--all` (tam tanı; salt okunur, yapıştırılabilir)
- `--deep` (gateway'den, destekleniyorsa kanal yoklamaları da içeren canlı sağlık yoklaması ister)
- `--usage` (model sağlayıcı kullanım/kotasını gösterir)
- `--timeout <ms>`
- `--verbose`
- `--debug` (`--verbose` için takma ad)

Notlar:

- Genel görünüm, mevcut olduğunda Gateway + düğüm ana makine hizmeti durumunu içerir.
- `--usage`, normalize edilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.

### Kullanım takibi

OpenClaw, OAuth/API kimlik bilgileri mevcut olduğunda sağlayıcı kullanımını/kotasını gösterebilir.

Yüzeyler:

- `/status` (mevcut olduğunda kısa bir sağlayıcı kullanım satırı ekler)
- `openclaw status --usage` (tam sağlayıcı dökümünü yazdırır)
- macOS menü çubuğu (Bağlam altındaki Kullanım bölümü)

Notlar:

- Veriler doğrudan sağlayıcı kullanım uç noktalarından gelir (tahmin yoktur).
- İnsan tarafından okunabilir çıktı, sağlayıcılar arasında `X% left` olarak normalize edilir.
- Güncel kullanım pencerelerine sahip sağlayıcılar: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: ham `usage_percent` / `usagePercent`, kalan kota anlamına gelir; bu yüzden OpenClaw bunu gösterimden önce ters çevirir; mevcutsa sayım tabanlı alanlar yine önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerekirse pencere etiketini zaman damgalarından türetir ve model adını plan etiketine ekler.
- Kullanım auth bilgisi, mevcut olduğunda sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw, auth profilleri, env veya config içinden eşleşen OAuth/API-key kimlik bilgilerine geri düşer. Hiçbiri çözümlenmezse kullanım gizlenir.
- Ayrıntılar: bkz. [Usage tracking](/concepts/usage-tracking).

### `health`

Çalışan Gateway'den sağlık bilgisini getirir.

Seçenekler:

- `--json`
- `--timeout <ms>`
- `--verbose` (canlı yoklamayı zorlar ve gateway bağlantı ayrıntılarını yazdırır)
- `--debug` (`--verbose` için takma ad)

Notlar:

- Varsayılan `health`, yeni bir önbelleğe alınmış gateway anlık görüntüsü döndürebilir.
- `health --verbose`, canlı yoklamayı zorlar ve insan tarafından okunabilir çıktıyı tüm yapılandırılmış hesaplar ve agent'lar genelinde genişletir.

### `sessions`

Saklanan konuşma oturumlarını listeler.

Seçenekler:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (oturumları agent'a göre filtreler)
- `--all-agents` (tüm agent'lardaki oturumları gösterir)

Alt komutlar:

- `sessions cleanup` — süresi dolmuş veya yetim kalmış oturumları kaldırır

Notlar:

- `sessions cleanup`, transkript dosyaları kayıp olan girdileri temizlemek için `--fix-missing` desteğine de sahiptir.

## Sıfırlama / Kaldırma

### `reset`

Yerel config/durumu sıfırlar (CLI kurulu kalır).

Seçenekler:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Notlar:

- `--non-interactive`, `--scope` ve `--yes` gerektirir.

### `uninstall`

Gateway hizmetini + yerel verileri kaldırır (CLI kalır).

Seçenekler:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Notlar:

- `--non-interactive`, `--yes` ve açık kapsamlar (veya `--all`) gerektirir.
- `--all`, hizmeti, durumu, çalışma alanını ve uygulamayı birlikte kaldırır.

### `tasks`

Agent'lar genelinde [arka plan görevi](/tr/automation/tasks) çalıştırmalarını listeleyin ve yönetin.

- `tasks list` — etkin ve son görev çalıştırmalarını gösterir
- `tasks show <id>` — belirli bir görev çalıştırmasının ayrıntılarını gösterir
- `tasks notify <id>` — bir görev çalıştırmasının bildirim ilkesini değiştirir
- `tasks cancel <id>` — çalışan bir görevi iptal eder
- `tasks audit` — operasyonel sorunları ortaya çıkarır (eski, kayıp, teslimat hataları)
- `tasks maintenance [--apply] [--json]` — görev ve TaskFlow temizleme/uzlaştırmayı önizler veya uygular (ACP/alt agent alt oturumları, etkin cron işleri, canlı CLI çalıştırmaları)
- `tasks flow list` — etkin ve son Task Flow akışlarını listeler
- `tasks flow show <lookup>` — bir akışı kimliğe veya arama anahtarına göre inceler
- `tasks flow cancel <lookup>` — çalışan bir akışı ve onun etkin görevlerini iptal eder

### `flows`

Eski belge kısayolu. Akış komutları `openclaw tasks flow` altında bulunur:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

WebSocket Gateway'i çalıştırın.

Seçenekler:

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
- `--reset` (geliştirme config + kimlik bilgileri + oturumlar + çalışma alanını sıfırlar)
- `--force` (bağlantı noktasındaki mevcut dinleyiciyi öldürür)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (kullanımdan kalkmış takma ad)
- `--ws-log <auto|full|compact>`
- `--compact` (`--ws-log compact` için takma ad)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gateway hizmetini yönetin (launchd/systemd/schtasks).

Alt komutlar:

- `gateway status` (varsayılan olarak Gateway RPC'yi yoklar)
- `gateway install` (hizmet kurulumu)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Notlar:

- `gateway status`, varsayılan olarak hizmetin çözümlenmiş bağlantı noktası/config'i kullanarak Gateway RPC'yi yoklar (`--url/--token/--password` ile geçersiz kılın).
- `gateway status`, betikleme için `--no-probe`, `--deep`, `--require-rpc` ve `--json` destekler.
- `gateway status`, algılayabildiğinde eski veya ek gateway hizmetlerini de gösterir (`--deep`, sistem düzeyinde taramalar ekler). Profil adlı OpenClaw hizmetleri birinci sınıf kabul edilir ve “extra” olarak işaretlenmez.
- `gateway status`, yerel CLI config'i eksik veya geçersiz olsa bile tanı için kullanılabilir kalır.
- `gateway status`, çözümlenmiş dosya günlük yolunu, CLI-karşı-hizmet config yolları/geçerlilik anlık görüntüsünü ve çözümlenmiş yoklama hedef URL'sini yazdırır.
- Geçerli komut yolunda gateway auth SecretRef'leri çözümlenmemişse `gateway status --json`, yalnızca yoklama bağlantısı/auth başarısız olduğunda `rpc.authWarning` bildirir (yoklama başarılıysa uyarılar bastırılır).
- Linux systemd kurulumlarında durum belirteci sapma denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- `gateway install|uninstall|start|stop|restart`, betikleme için `--json` destekler (varsayılan çıktı insan dostu kalır).
- `gateway install`, varsayılan olarak Node çalışma zamanı kullanır; bun **önerilmez** (WhatsApp/Telegram hataları).
- `gateway install` seçenekleri: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Gateway hizmet yönetimi komutları için eski takma ad. Bkz. [/cli/daemon](/cli/daemon).

Alt komutlar:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Ortak seçenekler:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

RPC üzerinden Gateway dosya günlüklerini izler.

Seçenekler:

- `--limit <n>`: döndürülecek en fazla günlük satırı sayısı
- `--max-bytes <n>`: günlük dosyasından okunacak en fazla bayt
- `--follow`: günlük dosyasını takip eder (`tail -f` tarzı)
- `--interval <ms>`: takip ederken ms cinsinden yoklama aralığı
- `--local-time`: zaman damgalarını yerel saatte görüntüler
- `--json`: satır sınırlı JSON verir
- `--plain`: yapılandırılmış biçimlendirmeyi devre dışı bırakır
- `--no-color`: ANSI renklerini devre dışı bırakır
- `--url <url>`: açık Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--timeout <ms>`: Gateway RPC zaman aşımı
- `--expect-final`: gerektiğinde son bir yanıt bekler

Örnekler:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Notlar:

- `--url` geçirirseniz CLI config veya ortam kimlik bilgilerini otomatik uygulamaz.
- Yerel loopback eşleştirme hataları, yapılandırılmış yerel günlük dosyasına geri döner; açık `--url` hedefleri için bu yapılmaz.

### `gateway <subcommand>`

Gateway CLI yardımcıları (RPC alt komutları için `--url`, `--token`, `--password`, `--timeout`, `--expect-final` kullanın).
`--url` geçirdiğinizde CLI config veya ortam kimlik bilgilerini otomatik uygulamaz.
`--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgileri eksikse bu bir hatadır.

Alt komutlar:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Notlar:

- `gateway status --deep`, sistem düzeyinde hizmet taraması ekler. Daha derin çalışma zamanı yoklama ayrıntıları için `gateway probe`,
  `health --verbose` veya üst düzey `status --deep` kullanın.

Yaygın RPC'ler:

- `config.schema.lookup` (bir config alt ağacını sığ bir şema düğümü, eşleşen ipucu meta verileri ve doğrudan alt öğe özetleriyle inceler)
- `config.get` (mevcut config anlık görüntüsünü + hash'i okur)
- `config.set` (doğrular + tam config'i yazar; iyimser eşzamanlılık için `baseHash` kullanın)
- `config.apply` (doğrular + config'i yazar + yeniden başlatır + uyandırır)
- `config.patch` (kısmi güncellemeyi birleştirir + yeniden başlatır + uyandırır)
- `update.run` (güncelleme + yeniden başlatma + uyandırma çalıştırır)

İpucu: `config.set`/`config.apply`/`config.patch` doğrudan çağrılırken,
mevcut bir config varsa `config.get` içinden gelen `baseHash` değerini geçin.
İpucu: kısmi düzenlemeler için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin.
İpucu: bu config yazma RPC'leri, gönderilen config yükündeki referanslar için etkin SecretRef çözümünü önceden denetler ve etkin olan gönderilmiş bir referans çözümlenmemişse yazmayı reddeder.
İpucu: yalnızca sahibine açık `gateway` çalışma zamanı aracı yine `tools.exec.ask` veya `tools.exec.security` yollarını yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı `exec` yollarına normalize olur.

## Modeller

Geri dönüş davranışı ve tarama stratejisi için bkz. [/concepts/models](/concepts/models).

Faturalandırma notu: Anthropic'in herkese açık CLI belgelerine dayanarak, Claude Code CLI geri dönüşünün yerel,
kullanıcı tarafından yönetilen otomasyon için muhtemelen izinli olduğuna inanıyoruz. Bununla birlikte,
Anthropic'in üçüncü taraf harness ilkesi, harici ürünlerde abonelik destekli kullanım
konusunda yeterli belirsizlik oluşturduğu için bunu üretim için önermiyoruz.
Anthropic ayrıca **4 Nisan 2026 saat 12:00 PT / 20:00 BST** tarihinde OpenClaw kullanıcılarına,
**OpenClaw** Claude-login yolunun
üçüncü taraf harness kullanımı sayıldığını ve
abonelikten ayrı olarak faturalandırılan **Extra Usage** gerektirdiğini bildirdi.
Üretim için Anthropic API anahtarı veya OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan ya da Z.AI / GLM Coding Plan gibi başka bir desteklenen
abonelik tarzı sağlayıcı tercih edin.

Anthropic Claude CLI geçişi:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Onboarding kısayolu: `openclaw onboard --auth-choice anthropic-cli`

Anthropic `setup-token` artık eski/el ile auth yolu olarak yeniden kullanılabilir.
Bunu yalnızca Anthropic'in OpenClaw kullanıcılarına
OpenClaw Claude-login yolunun **Extra Usage** gerektirdiğini söylediği beklentisiyle
kullanın.

Eski takma ad notu: `claude-cli`, kullanımdan kaldırılmış onboarding `auth-choice` takma adıdır.
Onboarding için `anthropic-cli` kullanın veya doğrudan `models auth login` kullanın.

### `models` (kök)

`openclaw models`, `models status` için bir takma addır.

Kök seçenekleri:

- `--status-json` (`models status --json` için takma ad)
- `--status-plain` (`models status --plain` için takma ad)

### `models list`

Seçenekler:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=sona ermiş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış auth profillerinin canlı yoklaması)
- `--probe-provider <name>`
- `--probe-profile <id>` (tekrarlı veya virgülle ayrılmış)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Her zaman auth deposundaki profiller için auth genel görünümünü ve OAuth sona erme durumunu içerir.
`--probe`, canlı istekler çalıştırır (token tüketebilir ve oran sınırlarını tetikleyebilir).
Yoklama satırları auth profilleri, ortam kimlik bilgileri veya `models.json` içinden gelebilir.
`ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` ve `no_model` gibi yoklama durumları bekleyin.
Açık bir `auth.order.<provider>`, saklanan bir profili atladığında yoklama,
o profili sessizce denemek yerine `excluded_by_auth_order` bildirir.

### `models set <model>`

`agents.defaults.model.primary` değerini ayarlar.

### `models set-image <model>`

`agents.defaults.imageModel.primary` değerini ayarlar.

### `models aliases list|add|remove`

Seçenekler:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Seçenekler:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Seçenekler:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Seçenekler:

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

Seçenekler:

- `add`: etkileşimli auth yardımcısı (sağlayıcı auth akışı veya token yapıştırma)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: GitHub Copilot OAuth oturum açma akışı (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Notlar:

- `setup-token` ve `paste-token`, token auth yöntemleri sunan sağlayıcılar için genel token komutlarıdır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token-auth yöntemini çalıştırır.
- `paste-token`, token değerini ister ve `--profile-id` belirtilmediğinde varsayılan olarak auth profil kimliği `<provider>:manual` kullanır.
- Anthropic `setup-token` / `paste-token`, eski/el ile OpenClaw yolu olarak yeniden kullanılabilir. Anthropic, OpenClaw kullanıcılarına bu yolun Claude hesabında **Extra Usage** gerektirdiğini bildirdi.

### `models auth order get|set|clear`

Seçenekler:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## Sistem

### `system event`

Bir sistem olayı kuyruğa alır ve isteğe bağlı olarak bir heartbeat tetikler (Gateway RPC).

Gerekli:

- `--text <text>`

Seçenekler:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Heartbeat denetimleri (Gateway RPC).

Seçenekler:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Sistem varlık girdilerini listeler (Gateway RPC).

Seçenekler:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Zamanlanmış işleri yönetin (Gateway RPC). Bkz. [/automation/cron-jobs](/tr/automation/cron-jobs).

Alt komutlar:

- `cron status [--json]`
- `cron list [--all] [--json]` (varsayılan olarak tablo çıktısı; ham çıktı için `--json` kullanın)
- `cron add` (takma ad: `create`; `--name` ve tam olarak bir `--at` | `--every` | `--cron` ile tam olarak bir `--system-event` | `--message` yükü gerektirir)
- `cron edit <id>` (alanları yama olarak uygular)
- `cron rm <id>` (takma adlar: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Tüm `cron` komutları `--url`, `--token`, `--timeout`, `--expect-final` kabul eder.

`cron add|edit --model ...`, iş için o seçili izinli modeli kullanır. Eğer
modele izin verilmiyorsa cron uyarır ve bunun yerine işin agent/varsayılan
model seçimine geri düşer. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak
açık iş başına geri dönüş listesi olmayan düz bir model geçersiz kılması artık
agent birincil modelini gizli bir ek yeniden deneme hedefi olarak eklemez.

## Düğüm ana makinesi

### `node`

`node`, bir **headless node host** çalıştırır veya onu arka plan hizmeti olarak yönetir. Bkz.
[`openclaw node`](/cli/node).

Alt komutlar:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Auth notları:

- `node`, gateway auth bilgisini env/config içinden çözer (`--token`/`--password` bayrakları yok): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, ardından `gateway.auth.*`. Yerel modda düğüm ana makinesi bilerek `gateway.remote.*` değerlerini yok sayar; `gateway.mode=remote` durumunda `gateway.remote.*`, uzak öncelik kurallarına göre katılır.
- Düğüm ana makinesi auth çözümü yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

## Düğümler

`nodes`, Gateway ile konuşur ve eşlenmiş düğümleri hedefler. Bkz. [/nodes](/nodes).

Ortak seçenekler:

- `--url`, `--token`, `--timeout`, `--json`

Alt komutlar:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (yalnızca mac)

Kamera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + ekran:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Konum:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Tarayıcı

Tarayıcı denetimi CLI'si (özel Chrome/Brave/Edge/Chromium). Bkz. [`openclaw browser`](/cli/browser) ve [Browser tool](/tools/browser).

Ortak seçenekler:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Yönetim:

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

İnceleme:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Eylemler:

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

## Sesli arama

### `voicecall`

Eklenti tarafından sağlanan sesli arama yardımcıları. Yalnızca sesli arama eklentisi kurulu ve etkin olduğunda görünür. Bkz. [`openclaw voicecall`](/cli/voicecall).

Yaygın komutlar:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Belgelerde arama

### `docs`

Canlı OpenClaw belgeleri dizininde arama yapın.

### `docs [query...]`

Canlı belge dizininde arama yapın.

## TUI

### `tui`

Gateway'e bağlı terminal UI'yi açın.

Seçenekler:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
