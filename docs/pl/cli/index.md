---
read_when:
    - Dodawanie lub modyfikowanie poleceń albo opcji CLI
    - Dokumentowanie nowych powierzchni poleceń
summary: Referencja CLI OpenClaw dla poleceń, podpoleceń i opcji `openclaw`
title: Referencja CLI
x-i18n:
    generated_at: "2026-04-05T13:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# Referencja CLI

Ta strona opisuje bieżące zachowanie CLI. Jeśli polecenia się zmienią, zaktualizuj ten dokument.

## Strony poleceń

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
- [`plugins`](/cli/plugins) (polecenia pluginów)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (starszy alias dla poleceń usługi gateway)
- [`clawbot`](/cli/clawbot) (starsza przestrzeń nazw aliasu)
- [`voicecall`](/cli/voicecall) (plugin; jeśli zainstalowany)

## Flagi globalne

- `--dev`: izoluje stan w `~/.openclaw-dev` i przesuwa domyślne porty.
- `--profile <name>`: izoluje stan w `~/.openclaw-<name>`.
- `--container <name>`: kieruje wykonanie do nazwanego kontenera.
- `--no-color`: wyłącza kolory ANSI.
- `--update`: skrót dla `openclaw update` (tylko instalacje ze źródeł).
- `-V`, `--version`, `-v`: wypisuje wersję i kończy działanie.

## Styl wyjścia

- Kolory ANSI i wskaźniki postępu są renderowane tylko w sesjach TTY.
- Hiperłącza OSC-8 są renderowane jako klikalne linki w obsługiwanych terminalach; w przeciwnym razie następuje powrót do zwykłych URL-i.
- `--json` (oraz `--plain`, jeśli jest obsługiwane) wyłącza stylizację, aby uzyskać czyste wyjście.
- `--no-color` wyłącza stylizację ANSI; respektowane jest również `NO_COLOR=1`.
- Długotrwałe polecenia pokazują wskaźnik postępu (OSC 9;4, gdy jest obsługiwane).

## Paleta kolorów

OpenClaw używa palety lobster dla wyjścia CLI.

- `accent` (#FF5A2D): nagłówki, etykiety, główne wyróżnienia.
- `accentBright` (#FF7A3D): nazwy poleceń, wyróżnienia.
- `accentDim` (#D14A22): tekst drugorzędnych wyróżnień.
- `info` (#FF8A5B): wartości informacyjne.
- `success` (#2FBF71): stany powodzenia.
- `warn` (#FFB020): ostrzeżenia, mechanizmy zapasowe, elementy wymagające uwagi.
- `error` (#E23D2D): błędy, niepowodzenia.
- `muted` (#8B7F77): deemfaza, metadane.

Źródło prawdy dla palety: `src/terminal/palette.ts` („paleta lobster”).

## Drzewo poleceń

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

Uwaga: plugins mogą dodawać dodatkowe polecenia najwyższego poziomu (na przykład `openclaw voicecall`).

## Bezpieczeństwo

- `openclaw security audit` — audytuje konfigurację i stan lokalny pod kątem typowych pułapek bezpieczeństwa.
- `openclaw security audit --deep` — sonda Gateway na żywo w trybie best-effort.
- `openclaw security audit --fix` — zaostrza bezpieczne ustawienia domyślne oraz uprawnienia stanu/konfiguracji.

## Sekrety

### `secrets`

Zarządza SecretRef i powiązaną higieną środowiska uruchomieniowego/konfiguracji.

Podpolecenia:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Opcje `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Opcje `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Opcje `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Opcje `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Uwagi:

- `reload` jest RPC Gateway i zachowuje ostatni poprawny snapshot środowiska uruchomieniowego, gdy rozwiązywanie nie powiedzie się.
- `audit --check` zwraca kod różny od zera, jeśli wykryto problemy; nierozwiązane referencje używają kodu błędu różnego od zera o wyższym priorytecie.
- Kontrole exec w trybie dry-run są domyślnie pomijane; użyj `--allow-exec`, aby włączyć je jawnie.

## Plugins

Zarządzanie rozszerzeniami i ich konfiguracją:

- `openclaw plugins list` — wykrywa plugins (użyj `--json` dla wyjścia maszynowego).
- `openclaw plugins inspect <id>` — pokazuje szczegóły pluginu (`info` to alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — instaluje plugin (albo dodaje ścieżkę pluginu do `plugins.load.paths`; użyj `--force`, aby nadpisać istniejący cel instalacji).
- `openclaw plugins marketplace list <marketplace>` — wyświetla wpisy marketplace przed instalacją.
- `openclaw plugins enable <id>` / `disable <id>` — przełącza `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — zgłasza błędy ładowania pluginów.

Większość zmian pluginów wymaga ponownego uruchomienia gateway. Zobacz [/plugin](/tools/plugin).

## Pamięć

Wyszukiwanie wektorowe w `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — pokazuje statystyki indeksu; użyj `--deep` dla kontroli gotowości wektorów i embeddingów albo `--fix`, aby naprawić nieaktualne artefakty recall/promotion.
- `openclaw memory index` — ponownie indeksuje pliki pamięci.
- `openclaw memory search "<query>"` (lub `--query "<query>"`) — semantyczne wyszukiwanie w pamięci.
- `openclaw memory promote` — klasyfikuje krótkoterminowe recalls i opcjonalnie dopisuje najlepsze wpisy do `MEMORY.md`.

## Sandbox

Zarządzanie środowiskami sandbox do izolowanego wykonywania agentów. Zobacz [/cli/sandbox](/cli/sandbox).

Podpolecenia:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Uwagi:

- `sandbox recreate` usuwa istniejące środowiska uruchomieniowe, aby przy następnym użyciu zostały ponownie zasiane na podstawie bieżącej konfiguracji.
- Dla backendów `ssh` i OpenShell `remote`, recreate usuwa kanoniczny zdalny workspace dla wybranego zakresu.

## Polecenia slash na czacie

Wiadomości na czacie obsługują polecenia `/...` (tekstowe i natywne). Zobacz [/tools/slash-commands](/tools/slash-commands).

Najważniejsze:

- `/status` do szybkiej diagnostyki.
- `/config` do trwałych zmian konfiguracji.
- `/debug` do nadpisywania konfiguracji tylko w środowisku uruchomieniowym (pamięć, nie dysk; wymaga `commands.debug: true`).

## Konfiguracja + onboarding

### `completion`

Generuje skrypty autouzupełniania powłoki i opcjonalnie instaluje je w profilu powłoki.

Opcje:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Uwagi:

- Bez `--install` lub `--write-state`, `completion` wypisuje skrypt na stdout.
- `--install` zapisuje blok `OpenClaw Completion` w profilu powłoki i wskazuje go na skrypt z pamięci podręcznej w katalogu stanu OpenClaw.

### `setup`

Inicjalizuje konfigurację i workspace.

Opcje:

- `--workspace <dir>`: ścieżka workspace agenta (domyślnie `~/.openclaw/workspace`).
- `--wizard`: uruchamia onboarding.
- `--non-interactive`: uruchamia onboarding bez promptów.
- `--mode <local|remote>`: tryb onboardingu.
- `--remote-url <url>`: URL zdalnego Gateway.
- `--remote-token <token>`: token zdalnego Gateway.

Onboarding uruchamia się automatycznie, gdy obecna jest dowolna flaga onboardingu (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Interaktywny onboarding dla gateway, workspace i Skills.

Opcje:

- `--workspace <dir>`
- `--reset` (resetuje konfigurację, poświadczenia i sesje przed onboardingiem)
- `--reset-scope <config|config+creds+sessions|full>` (domyślnie `config+creds+sessions`; użyj `full`, aby usunąć także workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual to alias advanced)
- `--auth-choice <choice>` gdzie `<choice>` to jedno z:
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
- Uwaga dotycząca Qwen: `qwen-*` to kanoniczna rodzina `auth-choice`. Identyfikatory `modelstudio-*`
  nadal są akceptowane wyłącznie jako starsze aliasy zgodności.
- `--secret-input-mode <plaintext|ref>` (domyślnie `plaintext`; użyj `ref`, aby przechowywać domyślne referencje env dostawcy zamiast jawnych kluczy)
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
- `--custom-base-url <url>` (nieinteraktywne; używane z `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (nieinteraktywne; używane z `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (nieinteraktywne; opcjonalne; używane z `--auth-choice custom-api-key`; przy pominięciu używa `CUSTOM_API_KEY`)
- `--custom-provider-id <id>` (nieinteraktywne; opcjonalny niestandardowy identyfikator dostawcy)
- `--custom-compatibility <openai|anthropic>` (nieinteraktywne; opcjonalne; domyślnie `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (nieinteraktywne; zapisuje `gateway.auth.token` jako env SecretRef; wymaga ustawienia tej zmiennej env; nie można łączyć z `--gateway-token`)
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
- `--node-manager <npm|pnpm|bun>` (menedżer Node dla konfiguracji/onboardingu Skills; zalecany pnpm, obsługiwany także bun)
- `--json`

### `configure`

Interaktywny kreator konfiguracji (models, channels, Skills, gateway).

Opcje:

- `--section <section>` (powtarzalne; ogranicza kreator do określonych sekcji)

### `config`

Nieinteraktywne pomocniki konfiguracji (get/set/unset/file/schema/validate). Uruchomienie `openclaw config` bez
podpolecenia otwiera kreator.

Podpolecenia:

- `config get <path>`: wypisuje wartość konfiguracji (ścieżka dot/bracket).
- `config set`: obsługuje cztery tryby przypisania:
  - tryb wartości: `config set <path> <value>` (parsowanie JSON5 albo string)
  - tryb konstruktora SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - tryb konstruktora dostawcy: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - tryb wsadowy: `config set --batch-json '<json>'` lub `config set --batch-file <path>`
- `config set --dry-run`: waliduje przypisania bez zapisywania `openclaw.json` (kontrole exec SecretRef są domyślnie pomijane).
- `config set --allow-exec --dry-run`: jawnie włącza kontrole exec SecretRef w dry-run (może wykonywać polecenia dostawców).
- `config set --dry-run --json`: emituje wyjście dry-run czytelne maszynowo (kontrole + sygnał kompletności, operacje, sprawdzone/pominięte referencje, błędy).
- `config set --strict-json`: wymaga parsowania JSON5 dla wejścia path/value. `--json` pozostaje starszym aliasem ścisłego parsowania poza trybem wyjścia dry-run.
- `config unset <path>`: usuwa wartość.
- `config file`: wypisuje ścieżkę aktywnego pliku konfiguracyjnego.
- `config schema`: wypisuje wygenerowany schemat JSON dla `openclaw.json`, w tym propagowane metadane dokumentacji pól `title` / `description` w zagnieżdżonych obiektach, gałęziach wildcard, elementach tablic i gałęziach kompozycji, a także metadane schematów pluginów/channels na żywo w trybie best-effort.
- `config validate`: waliduje bieżącą konfigurację względem schematu bez uruchamiania gateway.
- `config validate --json`: emituje wyjście JSON czytelne maszynowo.

### `doctor`

Kontrole stanu + szybkie naprawy (konfiguracja + gateway + starsze usługi).

Opcje:

- `--no-workspace-suggestions`: wyłącza wskazówki dotyczące pamięci workspace.
- `--yes`: akceptuje wartości domyślne bez promptów (tryb headless).
- `--non-interactive`: pomija prompty; stosuje tylko bezpieczne migracje.
- `--deep`: skanuje usługi systemowe pod kątem dodatkowych instalacji gateway.
- `--repair` (alias: `--fix`): próbuje automatycznie naprawić wykryte problemy.
- `--force`: wymusza naprawy nawet wtedy, gdy nie są ściśle wymagane.
- `--generate-gateway-token`: generuje nowy token uwierzytelniania gateway.

### `dashboard`

Otwiera Control UI z bieżącym tokenem.

Opcje:

- `--no-open`: wypisuje URL, ale nie uruchamia przeglądarki

Uwagi:

- Dla tokenów gateway zarządzanych przez SecretRef, `dashboard` wypisuje lub otwiera URL bez tokena zamiast ujawniać sekret w wyjściu terminala lub argumentach uruchomienia przeglądarki.

### `update`

Aktualizuje zainstalowane CLI.

Opcje główne:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Podpolecenia:

- `update status`
- `update wizard`

Opcje `update status`:

- `--json`
- `--timeout <seconds>`

Opcje `update wizard`:

- `--timeout <seconds>`

Uwagi:

- `openclaw --update` jest przepisywane na `openclaw update`.

### `backup`

Tworzy i weryfikuje lokalne archiwa kopii zapasowych stanu OpenClaw.

Podpolecenia:

- `backup create`
- `backup verify <archive>`

Opcje `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Opcje `backup verify <archive>`:

- `--json`

## Pomocniki kanałów

### `channels`

Zarządza kontami kanałów czatu (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Podpolecenia:

- `channels list`: pokazuje skonfigurowane channels i profile uwierzytelniania.
- `channels status`: sprawdza osiągalność gateway i stan channels (`--probe` uruchamia kontrole probe/audit na żywo dla każdego konta, gdy gateway jest osiągalny; jeśli nie jest, następuje powrót do podsumowań kanałów opartych wyłącznie na konfiguracji. Użyj `openclaw health` lub `openclaw status --deep`, aby uzyskać szersze sondy stanu gateway).
- Wskazówka: `channels status` wypisuje ostrzeżenia z sugerowanymi poprawkami, gdy potrafi wykryć typowe błędne konfiguracje (a następnie kieruje do `openclaw doctor`).
- `channels logs`: pokazuje ostatnie logi kanałów z pliku logu gateway.
- `channels add`: konfiguracja w stylu kreatora, gdy nie podano flag; flagi przełączają do trybu nieinteraktywnego.
  - Przy dodawaniu konta niebędącego domyślnym do kanału, który nadal używa jednokontowej konfiguracji najwyższego poziomu, OpenClaw promuje wartości o zakresie konta do mapy kont kanału przed zapisaniem nowego konta. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący cel named/default.
  - Nieinteraktywne `channels add` nie tworzy ani nie aktualizuje automatycznie powiązań; powiązania tylko kanałowe nadal będą pasować do konta domyślnego.
- `channels remove`: domyślnie wyłącza; przekaż `--delete`, aby usunąć wpisy konfiguracji bez promptów.
- `channels login`: interaktywne logowanie do kanału (tylko WhatsApp Web).
- `channels logout`: wylogowuje z sesji kanału (jeśli jest obsługiwane).

Typowe opcje:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: identyfikator konta kanału (domyślnie `default`)
- `--name <label>`: etykieta wyświetlana dla konta

Opcje `channels login`:

- `--channel <channel>` (domyślnie `whatsapp`; obsługuje `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Opcje `channels logout`:

- `--channel <channel>` (domyślnie `whatsapp`)
- `--account <id>`

Opcje `channels list`:

- `--no-usage`: pomija snapshoty użycia/limitu dostawców modeli (tylko OAuth/API-backed).
- `--json`: wyjście JSON (obejmuje usage, chyba że ustawiono `--no-usage`).

Opcje `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Opcje `channels capabilities`:

- `--channel <name>`
- `--account <id>` (tylko z `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Opcje `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Opcje `channels logs`:

- `--channel <name|all>` (domyślnie `all`)
- `--lines <n>` (domyślnie `200`)
- `--json`

Uwagi:

- `channels login` obsługuje `--verbose`.
- `channels capabilities --account` ma zastosowanie tylko wtedy, gdy ustawiono `--channel`.
- `channels status --probe` może pokazywać stan transportu oraz wyniki probe/audit, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`, zależnie od obsługi kanału.

Więcej szczegółów: [/concepts/oauth](/concepts/oauth)

Przykłady:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Wyszukuje identyfikatory własne, peer i grup dla kanałów udostępniających powierzchnię katalogu. Zobacz [`openclaw directory`](/cli/directory).

Typowe opcje:

- `--channel <name>`
- `--account <id>`
- `--json`

Podpolecenia:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Wyświetla i inspekcjonuje dostępne Skills oraz informacje o gotowości.

Podpolecenia:

- `skills search [query...]`: przeszukuje Skills w ClawHub.
- `skills search --limit <n> --json`: ogranicza wyniki wyszukiwania lub emituje wyjście czytelne maszynowo.
- `skills install <slug>`: instaluje Skill z ClawHub do aktywnego workspace.
- `skills install <slug> --version <version>`: instaluje określoną wersję z ClawHub.
- `skills install <slug> --force`: nadpisuje istniejący folder workspace Skill.
- `skills update <slug|--all>`: aktualizuje śledzone Skills z ClawHub.
- `skills list`: wyświetla Skills (domyślnie, gdy nie podano podpolecenia).
- `skills list --json`: emituje na stdout inwentarz Skills czytelny maszynowo.
- `skills list --verbose`: uwzględnia brakujące wymagania w tabeli.
- `skills info <name>`: pokazuje szczegóły jednego Skill.
- `skills info <name> --json`: emituje na stdout szczegóły czytelne maszynowo.
- `skills check`: podsumowanie gotowych i brakujących wymagań.
- `skills check --json`: emituje na stdout wyjście gotowości czytelne maszynowo.

Opcje:

- `--eligible`: pokazuje tylko gotowe Skills.
- `--json`: wyjście JSON (bez stylizacji).
- `-v`, `--verbose`: uwzględnia szczegóły brakujących wymagań.

Wskazówka: użyj `openclaw skills search`, `openclaw skills install` i `openclaw skills update` dla Skills opartych na ClawHub.

### `pairing`

Zatwierdza żądania parowania DM w kanałach.

Podpolecenia:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Uwagi:

- Jeśli dokładnie jeden kanał zdolny do parowania jest skonfigurowany, dozwolone jest także `pairing approve <code>`.
- Zarówno `list`, jak i `approve` obsługują `--account <id>` dla kanałów wielokontowych.

### `devices`

Zarządza wpisami parowania urządzeń gateway i tokenami urządzeń dla poszczególnych ról.

Podpolecenia:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Uwagi:

- `devices list` i `devices approve` mogą wracać do lokalnych plików parowania w local loopback, gdy bezpośredni zakres parowania jest niedostępny.
- `devices approve` automatycznie wybiera najnowsze oczekujące żądanie, gdy nie przekazano `requestId` albo ustawiono `--latest`.
- Ponowne połączenia z zapisanym tokenem używają zapisanych zatwierdzonych zakresów tokena; jawne
  `devices rotate --scope ...` aktualizuje ten zapisany zestaw zakresów dla przyszłych
  ponownych połączeń z tokenem z pamięci podręcznej.
- `devices rotate` i `devices revoke` zwracają ładunki JSON.

### `qr`

Generuje kod QR parowania mobilnego i kod konfiguracji na podstawie bieżącej konfiguracji Gateway. Zobacz [`openclaw qr`](/cli/qr).

Opcje:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Uwagi:

- `--token` i `--password` wzajemnie się wykluczają.
- Kod konfiguracji zawiera krótkotrwały token bootstrap, a nie współdzielony token/hasło gateway.
- Wbudowane przekazanie bootstrap utrzymuje główny token węzła przy `scopes: []`.
- Każdy przekazany token bootstrap operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`.
- Kontrole zakresu bootstrap są prefiksowane rolą, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role niebędące operatorem nadal wymagają zakresów pod własnym prefiksem roli.
- `--remote` może używać `gateway.remote.url` lub aktywnego URL Tailscale Serve/Funnel.
- Po zeskanowaniu zatwierdź żądanie przez `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Starsza przestrzeń nazw aliasu. Obecnie obsługuje `openclaw clawbot qr`, które mapuje się na [`openclaw qr`](/cli/qr).

### `hooks`

Zarządza wewnętrznymi hookami agentów.

Podpolecenia:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (przestarzały alias dla `openclaw plugins install`)
- `hooks update [id]` (przestarzały alias dla `openclaw plugins update`)

Typowe opcje:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Uwagi:

- Hooki zarządzane przez pluginów nie mogą być włączane ani wyłączane przez `openclaw hooks`; zamiast tego włącz lub wyłącz plugin będący ich właścicielem.
- `hooks install` i `hooks update` nadal działają jako aliasy zgodności, ale wypisują ostrzeżenia o przestarzałości i przekazują dalej do poleceń pluginów.

### `webhooks`

Pomocniki webhooków. Obecna wbudowana powierzchnia to konfiguracja i runner Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Konfiguracja i runner hooka Gmail Pub/Sub. Zobacz [Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration).

Podpolecenia:

- `webhooks gmail setup` (wymaga `--account <email>`; obsługuje `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (nadpisania środowiska uruchomieniowego dla tych samych flag)

Uwagi:

- `setup` konfiguruje watch Gmail oraz ścieżkę push skierowaną do OpenClaw.
- `run` uruchamia lokalny watcher/pętlę odnawiania Gmail z opcjonalnymi nadpisaniami środowiska uruchomieniowego.

### `dns`

Pomocniki DNS dla szerokiego obszaru wykrywania (CoreDNS + Tailscale). Obecna wbudowana powierzchnia:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Pomocnik DNS dla szerokiego obszaru wykrywania (CoreDNS + Tailscale). Zobacz [/gateway/discovery](/gateway/discovery).

Opcje:

- `--domain <domain>`
- `--apply`: instaluje/aktualizuje konfigurację CoreDNS (wymaga sudo; tylko macOS).

Uwagi:

- Bez `--apply` jest to pomocnik planowania, który wypisuje zalecaną konfigurację DNS dla OpenClaw i Tailscale.
- `--apply` obecnie obsługuje tylko macOS z Homebrew CoreDNS.

## Wiadomości + agent

### `message`

Ujednolicone wiadomości wychodzące i akcje kanałowe.

Zobacz: [/cli/message](/cli/message)

Podpolecenia:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Przykłady:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Uruchamia jedną turę agenta przez Gateway (lub wbudowane `--local`).

Przekaż co najmniej jeden selektor sesji: `--to`, `--session-id` lub `--agent`.

Wymagane:

- `-m, --message <text>`

Opcje:

- `-t, --to <dest>` (dla klucza sesji i opcjonalnego dostarczenia)
- `--session-id <id>`
- `--agent <id>` (identyfikator agenta; zastępuje powiązania routingu)
- `--thinking <off|minimal|low|medium|high|xhigh>` (obsługa zależy od dostawcy; brak bramkowania na poziomie modelu w CLI)
- `--verbose <on|off>`
- `--channel <channel>` (kanał dostarczenia; pomiń, aby użyć głównego kanału sesji)
- `--reply-to <target>` (nadpisanie celu dostarczenia, oddzielne od routingu sesji)
- `--reply-channel <channel>` (nadpisanie kanału dostarczenia)
- `--reply-account <id>` (nadpisanie identyfikatora konta dostarczenia)
- `--local` (uruchomienie wbudowane; rejestr pluginów nadal ładuje się wstępnie jako pierwszy)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Uwagi:

- Tryb Gateway wraca do wbudowanego agenta, gdy żądanie do Gateway nie powiedzie się.
- `--local` nadal wstępnie ładuje rejestr pluginów, więc dostawcy, narzędzia i kanały dostarczane przez pluginy pozostają dostępne podczas uruchomień wbudowanych.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczenie odpowiedzi, a nie na routing.

### `agents`

Zarządza izolowanymi agentami (workspaces + uwierzytelnianie + routing).

Uruchomienie `openclaw agents` bez podpolecenia jest równoważne z `openclaw agents list`.

#### `agents list`

Wyświetla skonfigurowanych agentów.

Opcje:

- `--json`
- `--bindings`

#### `agents add [name]`

Dodaje nowego izolowanego agenta. Uruchamia prowadzony kreator, chyba że przekazano flagi (lub `--non-interactive`); w trybie nieinteraktywnym wymagane jest `--workspace`.

Opcje:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (powtarzalne)
- `--non-interactive`
- `--json`

Specyfikacje powiązań używają `channel[:accountId]`. Gdy `accountId` zostanie pominięte, OpenClaw może rozwiązać zakres konta przez domyślne ustawienia kanału lub hooki pluginów; w przeciwnym razie jest to powiązanie kanału bez jawnego zakresu konta.
Przekazanie dowolnych jawnych flag add przełącza polecenie na ścieżkę nieinteraktywną. `main` jest zarezerwowane i nie może być używane jako nowy identyfikator agenta.

#### `agents bindings`

Wyświetla powiązania routingu.

Opcje:

- `--agent <id>`
- `--json`

#### `agents bind`

Dodaje powiązania routingu dla agenta.

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (powtarzalne)
- `--json`

#### `agents unbind`

Usuwa powiązania routingu dla agenta.

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (powtarzalne)
- `--all`
- `--json`

Użyj albo `--all`, albo `--bind`, ale nie obu.

#### `agents delete <id>`

Usuwa agenta i czyści jego workspace oraz stan.

Opcje:

- `--force`
- `--json`

Uwagi:

- `main` nie może zostać usunięte.
- Bez `--force` wymagana jest interaktywna zgoda.

#### `agents set-identity`

Aktualizuje tożsamość agenta (nazwa/motyw/emoji/avatar).

Opcje:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Uwagi:

- `--agent` lub `--workspace` mogą zostać użyte do wybrania docelowego agenta.
- Gdy nie podano jawnych pól tożsamości, polecenie odczytuje `IDENTITY.md`.

### `acp`

Uruchamia most ACP łączący IDE z Gateway.

Opcje główne:

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

Interaktywny klient ACP do debugowania mostu.

Opcje:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Zobacz [`acp`](/cli/acp), aby poznać pełne zachowanie, uwagi dotyczące bezpieczeństwa i przykłady.

### `mcp`

Zarządza zapisanymi definicjami serwerów MCP i udostępnia kanały OpenClaw przez MCP stdio.

#### `mcp serve`

Udostępnia rozmowy routowane przez kanały OpenClaw przez MCP stdio.

Opcje:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Wyświetla zapisane definicje serwerów MCP.

Opcje:

- `--json`

#### `mcp show [name]`

Pokazuje jedną zapisaną definicję serwera MCP lub cały zapisany obiekt serwera MCP.

Opcje:

- `--json`

#### `mcp set <name> <value>`

Zapisuje jedną definicję serwera MCP z obiektu JSON.

#### `mcp unset <name>`

Usuwa jedną zapisaną definicję serwera MCP.

### `approvals`

Zarządza zgodami exec. Alias: `exec-approvals`.

#### `approvals get`

Pobiera snapshot zgód exec i efektywną politykę.

Opcje:

- `--node <node>`
- `--gateway`
- `--json`
- opcje RPC węzła z `openclaw nodes`

#### `approvals set`

Zastępuje zgody exec danymi JSON z pliku lub stdin.

Opcje:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- opcje RPC węzła z `openclaw nodes`

#### `approvals allowlist add|remove`

Edytuje listę dozwolonych exec dla poszczególnych agentów.

Opcje:

- `--node <node>`
- `--gateway`
- `--agent <id>` (domyślnie `*`)
- `--json`
- opcje RPC węzła z `openclaw nodes`

### `status`

Pokazuje stan połączonej sesji i ostatnich odbiorców.

Opcje:

- `--json`
- `--all` (pełna diagnostyka; tylko do odczytu, gotowe do wklejenia)
- `--deep` (prosi gateway o sondę stanu na żywo, w tym sondy kanałów, gdy są obsługiwane)
- `--usage` (pokazuje użycie/limit dostawców modeli)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias dla `--verbose`)

Uwagi:

- Przegląd obejmuje stan usługi Gateway i hosta węzła, gdy jest dostępny.
- `--usage` wypisuje znormalizowane okna użycia dostawców jako `X% left`.

### Śledzenie użycia

OpenClaw może pokazywać użycie/limit dostawców, gdy dostępne są poświadczenia OAuth/API.

Powierzchnie:

- `/status` (dodaje krótki wiersz użycia dostawcy, gdy jest dostępny)
- `openclaw status --usage` (wypisuje pełny podział według dostawców)
- pasek menu macOS (sekcja Usage w Context)

Uwagi:

- Dane pochodzą bezpośrednio z endpointów użycia dostawców (bez estymacji).
- Wyjście czytelne dla człowieka jest normalizowane do `X% left` dla wszystkich dostawców.
- Dostawcy z bieżącymi oknami użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga dotycząca MiniMax: surowe `usage_percent` / `usagePercent` oznacza pozostały limit, więc OpenClaw odwraca tę wartość przed wyświetleniem; pola oparte na liczbie nadal mają pierwszeństwo, jeśli są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyprowadzają etykietę okna z timestampów i zawierają nazwę modelu w etykiecie planu.
- Uwierzytelnianie usage pochodzi z hooków specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/API key z profili uwierzytelniania, env lub konfiguracji. Jeśli nic nie zostanie rozwiązane, usage jest ukrywane.
- Szczegóły: zobacz [Śledzenie użycia](/concepts/usage-tracking).

### `health`

Pobiera stan zdrowia z uruchomionego Gateway.

Opcje:

- `--json`
- `--timeout <ms>`
- `--verbose` (wymusza sondę na żywo i wypisuje szczegóły połączenia gateway)
- `--debug` (alias dla `--verbose`)

Uwagi:

- Domyślne `health` może zwrócić świeży snapshot gateway z pamięci podręcznej.
- `health --verbose` wymusza sondę na żywo i rozszerza czytelne dla człowieka wyjście na wszystkie skonfigurowane konta i agentów.

### `sessions`

Wyświetla zapisane sesje rozmów.

Opcje:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filtruje sesje według agenta)
- `--all-agents` (pokazuje sesje wszystkich agentów)

Podpolecenia:

- `sessions cleanup` — usuwa wygasłe lub osierocone sesje

Uwagi:

- `sessions cleanup` obsługuje także `--fix-missing`, aby usuwać wpisy, których pliki transkryptu już nie istnieją.

## Reset / Uninstall

### `reset`

Resetuje lokalną konfigurację/stan (CLI pozostaje zainstalowane).

Opcje:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Uwagi:

- `--non-interactive` wymaga `--scope` i `--yes`.

### `uninstall`

Odinstalowuje usługę gateway i dane lokalne (CLI pozostaje).

Opcje:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Uwagi:

- `--non-interactive` wymaga `--yes` i jawnych zakresów (lub `--all`).
- `--all` usuwa jednocześnie usługę, stan, workspace i aplikację.

### `tasks`

Wyświetla i zarządza uruchomieniami [zadań w tle](/pl/automation/tasks) we wszystkich agentach.

- `tasks list` — pokazuje aktywne i ostatnie uruchomienia zadań
- `tasks show <id>` — pokazuje szczegóły określonego uruchomienia zadania
- `tasks notify <id>` — zmienia politykę powiadomień dla uruchomienia zadania
- `tasks cancel <id>` — anuluje działające zadanie
- `tasks audit` — pokazuje problemy operacyjne (nieaktualne, utracone, błędy dostarczania)
- `tasks maintenance [--apply] [--json]` — podgląd lub zastosowanie czyszczenia/uzgadniania tasks i TaskFlow (sesje potomne ACP/subagent, aktywne zadania cron, uruchomienia CLI na żywo)
- `tasks flow list` — wyświetla aktywne i ostatnie przepływy Task Flow
- `tasks flow show <lookup>` — inspekcja flow według id lub klucza lookup
- `tasks flow cancel <lookup>` — anuluje działający flow i jego aktywne zadania

### `flows`

Starszy skrót dokumentacji. Polecenia flow znajdują się pod `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Uruchamia WebSocket Gateway.

Opcje:

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
- `--reset` (resetuje konfigurację deweloperską, poświadczenia, sesje i workspace)
- `--force` (zabija istniejący listener na porcie)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (przestarzały alias)
- `--ws-log <auto|full|compact>`
- `--compact` (alias dla `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Zarządza usługą Gateway (launchd/systemd/schtasks).

Podpolecenia:

- `gateway status` (domyślnie sonduje RPC Gateway)
- `gateway install` (instalacja usługi)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Uwagi:

- `gateway status` domyślnie sonduje RPC Gateway, używając rozwiązanego portu/konfiguracji usługi (nadpisz przez `--url/--token/--password`).
- `gateway status` obsługuje `--no-probe`, `--deep`, `--require-rpc` i `--json` do skryptów.
- `gateway status` pokazuje także starsze lub dodatkowe usługi gateway, gdy potrafi je wykryć (`--deep` dodaje skany na poziomie systemu). Usługi OpenClaw nazwane profilem są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.
- `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest nieobecna lub nieprawidłowa.
- `gateway status` wypisuje rozwiązaną ścieżkę logu pliku, snapshot ścieżek/poprawności konfiguracji CLI względem usługi oraz rozwiązany docelowy URL sondy.
- Jeśli SecretRef uwierzytelniania gateway nie są rozwiązane w bieżącej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning` tylko wtedy, gdy łączność/uwierzytelnianie sondy nie powiedzie się (ostrzeżenia są tłumione, gdy sonda się powiedzie).
- W instalacjach Linux systemd, kontrole rozbieżności tokenów w statusie obejmują źródła jednostki `Environment=` i `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` obsługują `--json` do skryptów (domyślne wyjście pozostaje przyjazne dla człowieka).
- `gateway install` domyślnie używa środowiska Node; bun **nie jest zalecany** (błędy WhatsApp/Telegram).
- Opcje `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Starszy alias poleceń zarządzania usługą Gateway. Zobacz [/cli/daemon](/cli/daemon).

Podpolecenia:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Typowe opcje:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Śledzi logi plikowe Gateway przez RPC.

Opcje:

- `--limit <n>`: maksymalna liczba linii logu do zwrócenia
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytu z pliku logu
- `--follow`: śledzi plik logu (styl `tail -f`)
- `--interval <ms>`: interwał odpytywania w ms podczas śledzenia
- `--local-time`: wyświetla timestampy w czasie lokalnym
- `--json`: emituje JSON rozdzielany liniami
- `--plain`: wyłącza formatowanie strukturalne
- `--no-color`: wyłącza kolory ANSI
- `--url <url>`: jawny URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu RPC Gateway
- `--expect-final`: w razie potrzeby czeka na odpowiedź końcową

Przykłady:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Uwagi:

- Jeśli przekażesz `--url`, CLI nie zastosuje automatycznie poświadczeń z konfiguracji ani środowiska.
- Niepowodzenia parowania local loopback wracają do skonfigurowanego lokalnego pliku logu; jawne cele `--url` tego nie robią.

### `gateway <subcommand>`

Pomocniki CLI Gateway (użyj `--url`, `--token`, `--password`, `--timeout`, `--expect-final` dla podpoleceń RPC).
Gdy przekażesz `--url`, CLI nie zastosuje automatycznie poświadczeń z konfiguracji ani środowiska.
Uwzględnij jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

Podpolecenia:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Uwagi:

- `gateway status --deep` dodaje skan usług na poziomie systemu. Użyj `gateway probe`,
  `health --verbose` lub najwyższego poziomu `status --deep`, aby uzyskać głębsze szczegóły sond środowiska uruchomieniowego.

Typowe RPC:

- `config.schema.lookup` (inspekcja jednego poddrzewa konfiguracji z płytkim węzłem schematu, dopasowanymi metadanymi podpowiedzi i podsumowaniami bezpośrednich elementów potomnych)
- `config.get` (odczyt bieżącego snapshotu konfiguracji + hash)
- `config.set` (walidacja + zapis pełnej konfiguracji; użyj `baseHash` dla optymistycznej współbieżności)
- `config.apply` (walidacja + zapis konfiguracji + restart + wybudzenie)
- `config.patch` (scalenie częściowej aktualizacji + restart + wybudzenie)
- `update.run` (uruchomienie aktualizacji + restart + wybudzenie)

Wskazówka: przy bezpośrednim wywoływaniu `config.set`/`config.apply`/`config.patch` przekaż `baseHash` z
`config.get`, jeśli konfiguracja już istnieje.
Wskazówka: dla częściowych edycji najpierw sprawdź przez `config.schema.lookup` i preferuj `config.patch`.
Wskazówka: te RPC zapisujące konfigurację wstępnie sprawdzają aktywne rozwiązywanie SecretRef dla referencji w przesłanym ładunku konfiguracji i odrzucają zapis, gdy efektywnie aktywna przesłana referencja jest nierozwiązana.
Wskazówka: narzędzie środowiska uruchomieniowego `gateway` tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` lub `tools.exec.security`; starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

## Models

Zobacz [/concepts/models](/concepts/models), aby poznać zachowanie fallback i strategię skanowania.

Uwaga dotycząca rozliczeń: Uważamy, że fallback do Claude Code CLI jest prawdopodobnie dozwolony dla lokalnej,
zarządzanej przez użytkownika automatyzacji na podstawie publicznej dokumentacji CLI Anthropic. Mimo to
polityka Anthropic dotycząca zewnętrznych harnessów wprowadza wystarczającą niejednoznaczność wokół
użycia opartego na subskrypcji w produktach zewnętrznych, dlatego nie zalecamy tego w
środowiskach produkcyjnych. Anthropic poinformował również użytkowników OpenClaw dnia **4 kwietnia 2026 o
12:00 PM PT / 8:00 PM BST**, że ścieżka logowania Claude w **OpenClaw** jest liczona jako
użycie zewnętrznego harnessu i wymaga **Extra Usage** rozliczanego oddzielnie od
subskrypcji. W środowiskach produkcyjnych preferuj klucz API Anthropic lub innego obsługiwanego
dostawcę w stylu subskrypcyjnym, takiego jak OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan lub Z.AI / GLM Coding Plan.

Migracja Anthropic Claude CLI:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Skrót onboardingu: `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token jest również ponownie dostępny jako starsza/ręczna ścieżka uwierzytelniania.
Używaj go tylko ze świadomością, że Anthropic poinformował użytkowników OpenClaw, iż
ścieżka logowania Claude w OpenClaw wymaga **Extra Usage**.

Uwaga o starszym aliasie: `claude-cli` to przestarzały alias `auth-choice` dla onboardingu.
Użyj `anthropic-cli` dla onboardingu lub użyj bezpośrednio `models auth login`.

### `models` (root)

`openclaw models` jest aliasem dla `models status`.

Opcje główne:

- `--status-json` (alias dla `models status --json`)
- `--status-plain` (alias dla `models status --plain`)

### `models list`

Opcje:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Opcje:

- `--json`
- `--plain`
- `--check` (wyjście 1=expired/missing, 2=expiring)
- `--probe` (sonda na żywo skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>`
- `--probe-profile <id>` (powtarzalne lub rozdzielane przecinkami)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Zawsze obejmuje przegląd uwierzytelniania i stan wygaśnięcia OAuth dla profili w magazynie uwierzytelniania.
`--probe` uruchamia żądania na żywo (może zużywać tokeny i wywoływać limity szybkości).
Wiersze sondy mogą pochodzić z profili uwierzytelniania, poświadczeń env lub `models.json`.
Oczekuj statusów sondy takich jak `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` i `no_model`.
Gdy jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
`excluded_by_auth_order` zamiast po cichu próbować użyć tego profilu.

### `models set <model>`

Ustawia `agents.defaults.model.primary`.

### `models set-image <model>`

Ustawia `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Opcje:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Opcje:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Opcje:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Opcje:

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

Opcje:

- `add`: interaktywny pomocnik uwierzytelniania (przepływ uwierzytelniania dostawcy lub wklejenie tokena)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: przepływ logowania OAuth GitHub Copilot (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Uwagi:

- `setup-token` i `paste-token` to ogólne polecenia tokenów dla dostawców udostępniających metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem danego dostawcy.
- `paste-token` prosi o wartość tokena i domyślnie używa identyfikatora profilu uwierzytelniania `<provider>:manual`, gdy `--profile-id` zostanie pominięte.
- Anthropic `setup-token` / `paste-token` są ponownie dostępne jako starsza/ręczna ścieżka OpenClaw. Anthropic poinformował użytkowników OpenClaw, że ta ścieżka wymaga **Extra Usage** na koncie Claude.

### `models auth order get|set|clear`

Opcje:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

Umieszcza zdarzenie systemowe w kolejce i opcjonalnie wyzwala heartbeat (Gateway RPC).

Wymagane:

- `--text <text>`

Opcje:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Kontrole heartbeat (Gateway RPC).

Opcje:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Wyświetla wpisy obecności systemu (Gateway RPC).

Opcje:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Zarządza zaplanowanymi zadaniami (Gateway RPC). Zobacz [/automation/cron-jobs](/pl/automation/cron-jobs).

Podpolecenia:

- `cron status [--json]`
- `cron list [--all] [--json]` (domyślnie wyjście tabelaryczne; użyj `--json` dla surowego)
- `cron add` (alias: `create`; wymaga `--name` i dokładnie jednego z `--at` | `--every` | `--cron`, oraz dokładnie jednego ładunku z `--system-event` | `--message`)
- `cron edit <id>` (łata pola)
- `cron rm <id>` (aliasy: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Wszystkie polecenia `cron` akceptują `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` używa tego wybranego dozwolonego modelu dla zadania. Jeśli
model nie jest dozwolony, cron ostrzega i wraca do wyboru modelu
domyślnego dla zadania/agenta. Skonfigurowane łańcuchy fallback nadal mają zastosowanie, ale
zwykłe nadpisanie modelu bez jawnej listy fallback dla zadania nie dopisuje już
głównego modelu agenta jako ukrytego dodatkowego celu ponownej próby.

## Host węzła

### `node`

`node` uruchamia **bezgłowy host węzła** albo zarządza nim jako usługą w tle. Zobacz
[`openclaw node`](/cli/node).

Podpolecenia:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Uwagi dotyczące uwierzytelniania:

- `node` rozwiązuje uwierzytelnianie gateway z env/konfiguracji (bez flag `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, następnie `gateway.auth.*`. W trybie lokalnym host węzła celowo ignoruje `gateway.remote.*`; w `gateway.mode=remote` `gateway.remote.*` uczestniczy zgodnie z regułami pierwszeństwa zdalnego.
- Rozwiązywanie uwierzytelniania hosta węzła uwzględnia tylko zmienne env `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` komunikuje się z Gateway i kieruje operacje do sparowanych węzłów. Zobacz [/nodes](/nodes).

Typowe opcje:

- `--url`, `--token`, `--timeout`, `--json`

Podpolecenia:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (tylko Mac)

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

Lokalizacja:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI sterowania przeglądarką (dedykowane Chrome/Brave/Edge/Chromium). Zobacz [`openclaw browser`](/cli/browser) oraz [narzędzie Browser](/tools/browser).

Typowe opcje:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Zarządzanie:

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

Inspekcja:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Akcje:

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

## Voice call

### `voicecall`

Narzędzia połączeń głosowych dostarczane przez plugin. Pojawia się tylko wtedy, gdy plugin voice-call jest zainstalowany i włączony. Zobacz [`openclaw voicecall`](/cli/voicecall).

Typowe polecenia:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Wyszukiwanie w dokumentacji

### `docs`

Przeszukuje indeks dokumentacji OpenClaw na żywo.

### `docs [query...]`

Przeszukuje indeks dokumentacji na żywo.

## TUI

### `tui`

Otwiera terminalowy interfejs użytkownika połączony z Gateway.

Opcje:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
