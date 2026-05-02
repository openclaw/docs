---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Sprawdzasz poprawność bloków konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja konfiguracji Gateway dotycząca podstawowych kluczy OpenClaw, wartości domyślnych oraz linków do dedykowanych dokumentacji podsystemów
title: Dokumentacja referencyjna konfiguracji
x-i18n:
    generated_at: "2026-05-02T09:49:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa8aeec6143ae70905e75f1034005c97c3a72fcaa34f14f61294dece561f4ce6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Podstawowa dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Omówienie zorientowane na zadania znajdziesz w [Konfiguracji](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację. Katalogi poleceń należące do kanałów i pluginów oraz głębokie ustawienia pamięci/QMD znajdują się na własnych stronach, a nie na tej.

Prawda w kodzie:

- `openclaw config schema` wypisuje bieżący schemat JSON Schema używany do walidacji i Control UI, z dołączonymi metadanymi pakietów/pluginów/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi szczegółowej analizy
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują bazowy hash dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: użyj akcji narzędzia `gateway` `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pola przed edycją. Użyj [Konfiguracji](/pl/gateway/configuration) jako przewodnika zorientowanego na zadania, a tej strony jako szerszej mapy pól, wartości domyślnych i linków do dokumentacji podsystemów.

Dedykowane głębokie dokumentacje:

- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji Dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Polecenia ukośnikowe](/pl/tools/slash-commands) dla bieżącego katalogu wbudowanych i pakietowych poleceń
- strony właścicielskich kanałów/pluginów dla powierzchni poleceń specyficznych dla kanałów

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę — zobacz [Konfiguracja — kanały](/pl/gateway/config-channels) dla `channels.*`, w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych pakietowych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Wartości domyślne agenta, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę — zobacz [Konfiguracja — agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (przestrzeń robocza, model, myślenie, Heartbeat, pamięć, media, Skills, sandbox)
- `multiAgent.*` (routowanie i powiązania wielu agentów)
- `session.*` (cykl życia sesji, Compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.speechLocale`: opcjonalny identyfikator locale BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nieustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)

## Narzędzia i dostawcy niestandardowi

Zasady narzędzi, przełączniki eksperymentalne, konfigurację narzędzi wspieranych przez dostawców oraz konfigurację dostawców niestandardowych / bazowych adresów URL przeniesiono na dedykowaną stronę — zobacz [Konfiguracja — narzędzia i dostawcy niestandardowi](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja dostawców niestandardowych znajdują się w [Konfiguracji — narzędzia i dostawcy niestandardowi](/pl/gateway/config-tools#custom-providers-and-base-urls). Katalog główny `models` odpowiada też za globalne zachowanie katalogu modeli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: zachowanie katalogu dostawcy (`merge` lub `replace`).
- `models.providers`: mapa dostawców niestandardowych indeksowana identyfikatorem dostawcy.
- `models.pricing.enabled`: kontroluje uruchamianie cen w tle. Gdy `false`, start Gateway pomija pobieranie katalogów cen OpenRouter i LiteLLM; skonfigurowane wartości `models.providers.*.models[].cost` nadal działają dla lokalnych szacunków kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się pod `mcp.servers` i są używane przez wbudowane Pi oraz inne adaptery uruchomieniowe. Polecenia `openclaw mcp list`, `show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z serwerem docelowym podczas edycji konfiguracji.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: nazwane definicje serwerów MCP stdio lub zdalnych dla środowisk uruchomieniowych, które eksponują skonfigurowane narzędzia MCP.
  Zdalne wpisy używają `transport: "streamable-http"` lub `transport: "sse"`; `type: "http"` jest natywnym dla CLI aliasem, który `openclaw mcp set` i `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.sessionIdleTtlMs`: TTL bezczynności dla powiązanych z sesją pakietowych środowisk uruchomieniowych MCP. Jednorazowe uruchomienia wbudowane żądają sprzątania po zakończeniu uruchomienia; ten TTL jest zabezpieczeniem dla długotrwałych sesji i przyszłych wywołujących.
- Zmiany pod `mcp.*` stosują się na gorąco przez zwolnienie buforowanych sesyjnych środowisk uruchomieniowych MCP. Następne wykrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte wpisy `mcp.servers` są zbierane natychmiast zamiast czekać na TTL bezczynności.

Zobacz [MCP](/pl/cli/mcp#openclaw-as-an-mcp-client-registry) i [Backendy CLI](/pl/gateway/cli-backends#bundle-mcp-overlays), aby poznać zachowanie uruchomieniowe.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna lista dozwolonych tylko dla pakietowych Skills (zarządzane/workspace Skills bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne Skills (najniższy priorytet).
- `install.preferBrew`: gdy true, preferuje instalatory Homebrew, gdy `brew` jest dostępne, zanim przejdzie do innych typów instalatorów.
- `install.nodeManager`: preferencja instalatora Node dla specyfikacji `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza Skill nawet wtedy, gdy jest pakietowy/zainstalowany.
- `entries.<skillKey>.apiKey`: wygodne ustawienie dla Skills deklarujących podstawową zmienną środowiskową (jawny ciąg tekstowy lub obiekt SecretRef).

---

## Pluginy

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Ładowane z `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` oraz `plugins.load.paths`.
- Wykrywanie akceptuje natywne pluginy OpenClaw oraz zgodne pakiety Codex i pakiety Claude, w tym bezmanifestowe pakiety Claude w domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu gateway.**
- `allow`: opcjonalna lista dozwolonych (ładują się tylko wymienione pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy wspierane przez plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych ograniczona do pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, core blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginów i wspieranych katalogów hooków dostarczanych przez pakiety.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane niepakietowe pluginy mogą czytać surową treść konwersacji z typowanych hooków, takich jak `llm_input`, `llm_output`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu pluginowi, aby mógł żądać nadpisań `provider` i `model` na potrzeby pojedynczych uruchomień subagentów w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Używaj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez natywny schemat pluginu OpenClaw, gdy jest dostępny).
- Ustawienia konta/środowiska uruchomieniowego pluginu kanału znajdują się pod `channels.<id>` i powinny być opisane przez metadane `channelConfigs` w manifeście właścicielskiego pluginu, a nie przez centralny rejestr opcji OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy pobierania z sieci Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Wraca do `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` lub zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy adres URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne punkty końcowe).
  - `onlyMainContent`: wyodrębniaj ze stron tylko główną treść (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrapowania w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie w sieci Grok).
  - `enabled`: włącza dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik Dreaming (domyślnie `false`).
  - `frequency`: częstotliwość Cron dla każdego pełnego przebiegu Dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu subagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; połącz z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; awarie zaufania lub listy dozwolonych nie przechodzą po cichu na wartość zapasową.
  - zasady faz i progi są szczegółami implementacji (nie kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Dokumentacji konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone pluginy pakietów Claude mogą też wnosić wbudowane wartości domyślne Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybierz identyfikator aktywnego pluginu pamięci albo `"none"`, aby wyłączyć pluginy pamięci.
- `plugins.slots.contextEngine`: wybierz identyfikator aktywnego pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Pluginy](/pl/tools/plugin).

---

## Przeglądarka

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` wyłącza `act:evaluate` i `wait --fn`.
- `tabCleanup` odzyskuje śledzone karty głównego agenta po czasie bezczynności albo gdy
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` lub `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profilu CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako alias zgodności wstecznej.
- W trybie restrykcyjnym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są wyłącznie do podłączania (uruchamianie/zatrzymywanie/resetowanie wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`; użyj WS(S),
  gdy dostawca daje bezpośredni adres URL WebSocket DevTools.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` mają zastosowanie do osiągalności zdalnego CDP i
  `attachOnly` oraz do żądań otwierania kart. Zarządzane profile loopback
  zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw dla tego
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw traktuje port loopback jako
  lokalnie zarządzany profil przeglądarki i może zgłaszać błędy własności lokalnego portu.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą podłączać się na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` zachowują obecne limity trasy Chrome MCP:
  akcje oparte na snapshot/ref zamiast wskazywania selektorami CSS, haki przesyłania jednego pliku,
  brak nadpisywania limitów czasu dialogów, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań i akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a drugi w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do wykrywania HTTP Chrome CDP
  po uruchomieniu procesu oraz `browser.localCdpReadyTimeoutMs` do gotowości websocket CDP
  po uruchomieniu. Zwiększ je na wolniejszych hostach, na których Chrome
  uruchamia się pomyślnie, ale kontrole gotowości ścigają się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` dla katalogu domowego systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` per profil w profilach `existing-session` także rozwija tyldę.
- Usługa sterowania: tylko loopback (port wyprowadzany z `gateway.port`, domyślnie `18791`).
- `extraArgs` dołącza dodatkowe flagi uruchomieniowe do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna albo flagi debugowania).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: kolor akcentu dla obramowania UI aplikacji natywnej (odcień dymku trybu rozmowy itp.).
- `assistant`: nadpisanie tożsamości Control UI. Domyślnie używa tożsamości aktywnego agenta.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (uruchom Gateway) lub `remote` (połącz ze zdalnym Gateway). Gateway odmawia uruchomienia, jeśli wartość nie wynosi `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Pierwszeństwo: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Dockera**: domyślny bind `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci Docker bridge (`-p 18789:18789`) ruch przychodzi przez `eth0`, więc Gateway jest niedostępny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Uwierzytelnianie**: domyślnie wymagane. Bindy inne niż loopback wymagają uwierzytelniania Gateway. W praktyce oznacza to współdzielony token/hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator wdrażania domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Przepływy uruchamiania oraz instalacji/naprawy usługi kończą się niepowodzeniem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko w zaufanych konfiguracjach local loopback; celowo nie jest on oferowany przez monity wdrażania.
- `gateway.auth.mode: "trusted-proxy"`: deleguj uwierzytelnianie przeglądarki/użytkownika do reverse proxy świadomego tożsamości i ufaj nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **innego niż loopback**; reverse proxy samego hosta przez loopback wymaga jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą używać `gateway.auth.password` jako lokalnego bezpośredniego fallbacku; `gateway.auth.token` pozostaje wzajemnie wykluczające się z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełniać wymagania uwierzytelniania Control UI/WebSocket (weryfikowane przez `tailscale whois`). Punkty końcowe API HTTP **nie** używają tego uwierzytelniania nagłówkiem Tailscale; zamiast tego stosują normalny tryb uwierzytelniania HTTP Gateway. Ten przepływ bez tokenu zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanego uwierzytelniania. Stosowany na adres IP klienta i na zakres uwierzytelniania (shared-secret i device-token są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - W asynchronicznej ścieżce Control UI Tailscale Serve nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Równoczesne błędne próby tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast przejść równolegle jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie wynosi `true`; ustaw `false`, gdy celowo chcesz ograniczać także ruch z localhost (dla konfiguracji testowych albo rygorystycznych wdrożeń proxy).
- Próby uwierzytelniania WS pochodzące z przeglądarki są zawsze ograniczane, z wyłączonym zwolnieniem loopback (dodatkowa ochrona przed opartym na przeglądarce brute force na localhost).
- Na loopback te blokady pochodzące z przeglądarki są izolowane według znormalizowanej wartości `Origin`, więc powtarzające się niepowodzenia z jednego originu localhost nie blokują automatycznie innego originu.
- `tailscale.mode`: `serve` (tylko tailnet, bind loopback) lub `funnel` (publiczne, wymaga uwierzytelniania).
- `controlUi.allowedOrigins`: jawna lista dozwolonych originów przeglądarki dla połączeń WebSocket Gateway. Wymagane, gdy oczekiwani są klienci przeglądarkowi z originów innych niż loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza fallback originu z nagłówka Host dla wdrożeń celowo polegających na polityce originu z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` wartość `remote.url` musi być `ws://` albo `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: awaryjne nadpisanie po stronie klienta w środowisku procesu, które pozwala na plaintext `ws://` do zaufanych adresów IP sieci prywatnej; domyślnie plaintext pozostaje dozwolony tylko dla loopback. Nie ma odpowiednika w `openclaw.json`, a konfiguracja sieci prywatnej przeglądarki, taka jak `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, nie wpływa na klientów WebSocket Gateway.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same z siebie nie konfigurują uwierzytelniania Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy URL HTTPS dla zewnętrznego przekaźnika APNs używanego przez oficjalne/TestFlight buildy iOS po opublikowaniu rejestracji opartych na przekaźniku do Gateway. Ten URL musi odpowiadać URL-owi przekaźnika skompilowanemu w buildzie iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłki Gateway-do-przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na przekaźniku są delegowane do konkretnej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji przekaźnika i przekazuje do Gateway uprawnienie wysyłki ograniczone zakresem rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne tylko dla developmentu, dla URL-i przekaźnika HTTP przez loopback. Produkcyjne URL-e przekaźnika powinny pozostać na HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu handshake WebSocket Gateway przed uwierzytelnieniem, w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma pierwszeństwo, gdy jest ustawione. Zwiększ tę wartość na obciążonych lub słabszych hostach, gdzie lokalni klienci mogą połączyć się, gdy rozgrzewanie po uruchomieniu nadal się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora stanu kanału w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora stanu. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktualnego socketu w minutach. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora stanu na kanał/konto w kroczącej godzinie. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłączenie restartów monitora stanu dla pojedynczego kanału przy zachowaniu włączonego globalnego monitora.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla pojedynczego konta w kanałach wielokontowych. Gdy jest ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpiecznym niepowodzeniem (bez maskowania przez zdalny fallback).
- `trustedProxies`: adresy IP reverse proxy, które terminują TLS albo wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji proxy/wykrywania lokalnego na tym samym hoście (na przykład Tailscale Serve lub lokalne reverse proxy), ale **nie** czynią żądań loopback kwalifikującymi się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false`, aby zachować zachowanie fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna lista dozwolonych CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia węzła bez żądanych zakresów. Jest wyłączona, gdy nieustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/Control UI/WebChat ani nie zatwierdza automatycznie podniesień roli, zakresu, metadanych czy klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń węzła po parowaniu i ocenie listy dozwolonych platformy. Użyj `allowCommands`, aby włączyć niebezpieczne polecenia węzła, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie, nawet jeśli domyślna wartość platformy albo jawne allow w przeciwnym razie by je obejmowało. Po zmianie zadeklarowanej listy poleceń przez węzeł odrzuć i ponownie zatwierdź parowanie tego urządzenia, aby Gateway zapisał zaktualizowany snapshot poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę deny).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy deny HTTP.

</Accordion>

### Punkty końcowe zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Wzmocnienie URL-input Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolonych są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false` i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL-i.
- Opcjonalny nagłówek wzmacniający odpowiedź:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla originów HTTPS, które kontrolujesz; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flagi pomocnicze: `--dev` (używa `~/.openclaw-dev` + port `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

Zobacz [Wiele Gateway](/pl/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: włącza terminację TLS na listenerze Gateway (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną samopodpisaną parę certyfikat/klucz, gdy jawne pliki nie są skonfigurowane; tylko do użytku lokalnego/dev.
- `certPath`: ścieżka w systemie plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka w systemie plików do pliku klucza prywatnego TLS; utrzymuj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka do pakietu CA do weryfikacji klienta albo niestandardowych łańcuchów zaufania.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: kontroluje sposób stosowania zmian konfiguracji w czasie działania.
  - `"off"`: ignoruj zmiany na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuj proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuj zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw spróbuj hot reload; w razie potrzeby wróć do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas oczekiwania w ms na operacje w toku przed wymuszeniem restartu. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i okresowo logować ostrzeżenia o nadal oczekujących operacjach.

---

## Hooki

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Uwierzytelnianie: `Authorization: Bearer <token>` lub `x-openclaw-token: <token>`.
Tokeny hooków w query string są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` musi być **różny** od `gateway.auth.token`; ponowne użycie tokenu Gateway jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają tej zgody.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z ładunku żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone zewnętrznie i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole ładunku dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z ładunku.
- `transform` może wskazywać moduł JS/TS zwracający akcję haka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie poza katalog są odrzucane).
  - Trzymaj `hooks.transformsDir` pod `~/.openclaw/hooks/transforms`; katalogi Skills w przestrzeni roboczej są odrzucane. Jeśli `openclaw doctor` zgłasza tę ścieżkę jako nieprawidłową, przenieś moduł transformacji do katalogu transformacji haków albo usuń `hooks.transformsDir`.
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do domyślnego.
- `allowedAgentIds`: ogranicza jawne kierowanie (`*` lub pominięte = zezwól wszystkim, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta haka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: zezwala wywołującym `/hooks/agent` i kluczom sesji mapowania sterowanym szablonami ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie przyjmuje `last`.
- `model` nadpisuje LLM dla tego uruchomienia haka (musi być dozwolony, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie na wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast domyślnej wartości szablonowej.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway automatycznie uruchamia `gog gmail watch serve` przy starcie, gdy jest skonfigurowany. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby wyłączyć.
- Nie uruchamiaj osobnego `gog gmail watch serve` obok Gateway.

---

## Host kanwy

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Udostępnia edytowalne przez agentów HTML/CSS/JS oraz A2UI przez HTTP pod portem Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Wiązania inne niż loopback: trasy kanwy wymagają uwierzytelniania Gateway (token/hasło/zaufany proxy), tak jak inne powierzchnie HTTP Gateway.
- WebViews w Node zazwyczaj nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL zdolności ograniczone do węzła dla dostępu do kanwy/A2UI.
- Adresy URL zdolności są powiązane z aktywną sesją WS węzła i szybko wygasają. Awaryjne rozwiązanie oparte na IP nie jest używane.
- Wstrzykuje klienta live-reload do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Udostępnia również A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają restartu gateway.
- Wyłącz live reload dla dużych katalogów lub błędów `EMFILE`.

---

## Wykrywanie

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (domyślnie): pomija `cliPath` + `sshPort` w rekordach TXT.
- `full`: zawiera `cliPath` + `sshPort`.
- Nazwa hosta domyślnie przyjmuje systemową nazwę hosta, gdy jest poprawną etykietą DNS, w przeciwnym razie wraca do `openclaw`. Nadpisz za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Szeroki obszar (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD pod `~/.openclaw/dns/`. Do wykrywania między sieciami połącz z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (wbudowane zmienne środowiskowe)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Wbudowane zmienne środowiskowe są stosowane tylko wtedy, gdy w środowisku procesu brakuje klucza.
- Pliki `.env`: `.env` w CWD + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Zobacz [Środowisko](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa.

### Podstawianie zmiennych środowiskowych

Odwołuj się do zmiennych środowiskowych w dowolnym ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne zgłaszają błąd podczas ładowania konfiguracji.
- Ucieknij za pomocą `$${VAR}` dla dosłownego `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: wartości w postaci jawnego tekstu nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- Wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Wzorzec id dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id dla `source: "file"`: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- Wzorzec id dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Identyfikatory `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielonych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Macierz kanoniczna: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` celuje w obsługiwane ścieżki poświadczeń `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględnione w rozwiązywaniu w czasie działania i w pokryciu audytu.

### Konfiguracja dostawców sekretów

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Uwagi:

- Dostawca `file` obsługuje `mode: "json"` i `mode: "singleValue"` (`id` musi być `"value"` w trybie singleValue).
- Ścieżki dostawców file i exec kończą się zamknięciem, gdy weryfikacja ACL Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące dowiązaniami symbolicznymi są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki dowiązań symbolicznych przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu stosuje się do rozwiązanej ścieżki docelowej.
- Środowisko procesu potomnego `exec` jest domyślnie minimalne; przekaż wymagane zmienne jawnie za pomocą `passEnv`.
- Odwołania do sekretów są rozwiązywane w czasie aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują tylko migawkę.
- Filtrowanie aktywnej powierzchni stosuje się podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują niepowodzenie startu/przeładowania, podczas gdy nieaktywne powierzchnie są pomijane z diagnostyką.

---

## Przechowywanie uwierzytelniania

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profile poszczególnych agentów są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem czasu działania; `openclaw doctor --fix` przepisuje je do kanonicznych profili klucza API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu uwierzytelniania opartych na SecretRef.
- Statyczne poświadczenia czasu działania pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie sekretów w czasie działania oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bazowe wycofanie w godzinach, gdy profil zawiedzie z powodu rzeczywistych błędów rozliczeń/niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń nadal może trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do dostawcy, który jest ich właścicielem (na przykład OpenRouter `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia lub limitu wydatków organizacji/przestrzeni roboczej pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin wycofania rozliczeń dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu wycofania rozliczeń (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowe wycofanie w minutach dla wysokiej pewności niepowodzeń `auth_permanent` (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu wycofania `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: kroczące okno w godzinach używane dla liczników wycofania (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów przeciążenia przed przełączeniem na model zapasowy (domyślnie: `1`). Kształty zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem przeciążonego dostawcy/rotacji profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na model zapasowy (domyślnie: `1`). Ten koszyk limitu szybkości obejmuje tekst w kształcie dostawcy, taki jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

---

## Rejestrowanie

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Domyślny plik dziennika: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Ustaw `logging.file`, aby użyć stabilnej ścieżki.
- `consoleLevel` podnosi się do `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje do pięciu ponumerowanych archiwów obok aktywnego pliku.
- `redactSensitive` / `redactPatterns`: maskowanie na zasadzie najlepszych starań dla wyjścia konsoli, dzienników plikowych, rekordów dziennika OTLP i utrwalonego tekstu transkrypcji sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną zasadę dzienników/transkrypcji; powierzchnie bezpieczeństwa interfejsu użytkownika/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

---

## Diagnostyka

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: główny przełącznik wyjścia instrumentacji (domyślnie: `true`).
- `flags`: tablica ciągów flag włączających docelowe wyjście dziennika (obsługuje symbole wieloznaczne, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku bez postępu w ms do klasyfikowania długotrwałych sesji przetwarzania jako `session.long_running`, `session.stalled` lub `session.stuck`. Odpowiedź, narzędzie, status, blok i postęp ACP resetują licznik czasu; powtarzane diagnostyki `session.stuck` wycofują się, gdy nie ma zmian.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [eksport OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne punkty końcowe OTLP specyficzne dla sygnału. Gdy są ustawione, nadpisują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włączają eksport śladów, metryk lub dzienników.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`–`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów zakresów OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje treść wiadomości/narzędzi niesystemowych; forma obiektu pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` i `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszych eksperymentalnych atrybutów dostawcy zakresów GenAI. Domyślnie zakresy zachowują starszy atrybut `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do Plugin, utrzymując aktywne nasłuchiwacze diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe punktów końcowych specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji nie jest ustawiony.
- `cacheTrace.enabled`: rejestruje migawki śladu pamięci podręcznej dla osadzonych uruchomień (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śladu pamięci podręcznej (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w wyjściu śladu pamięci podręcznej (wszystkie domyślnie: `true`).

---

## Aktualizacja

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: kanał wydania dla instalacji npm/git — `"stable"`, `"beta"` lub `"dev"`.
- `checkOnStart`: sprawdza aktualizacje npm podczas uruchamiania Gateway (domyślnie: `true`).
- `auto.enabled`: włącza automatyczną aktualizację w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem w kanale stabilnym (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrożenia w kanale stabilnym w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często uruchamiane są sprawdzenia kanału beta, w godzinach (domyślnie: `1`; maks.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globalna brama funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć wysyłanie ACP i elementy uruchamiania).
- `dispatch.enabled`: niezależna brama wysyłania tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP, blokując wykonanie.
- `backend`: domyślny identyfikator zaplecza środowiska uruchomieniowego ACP (musi pasować do zarejestrowanego Plugin środowiska uruchomieniowego ACP).
  Najpierw zainstaluj Plugin zaplecza, a jeśli ustawiono `plugins.allow`, uwzględnij identyfikator Plugin zaplecza (na przykład `acpx`), inaczej zaplecze ACP się nie załaduje.
- `defaultAgent`: zapasowy identyfikator agenta docelowego ACP, gdy uruchomienia nie określają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych do sesji środowiska uruchomieniowego ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba równocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania bezczynności w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podzieleniem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłumi powtarzane wiersze statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do końcowych zdarzeń tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowana na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych wierszy statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów na logiczne nadpisania widoczności dla strumieniowanych zdarzeń.
- `runtime.ttlMinutes`: bezczynny TTL w minutach dla procesów roboczych sesji ACP przed kwalifikacją do czyszczenia.
- `runtime.installCommand`: opcjonalne polecenie instalacji do uruchomienia podczas inicjowania środowiska uruchomieniowego ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` kontroluje styl sloganu banera:
  - `"random"` (domyślnie): rotujące zabawne/sezonowe slogany.
  - `"default"`: stały neutralny slogan (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu sloganu (tytuł/wersja banera nadal są pokazywane).
- Aby ukryć cały baner (nie tylko slogany), ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

---

## Kreator

Metadane zapisywane przez prowadzone przepływy konfiguracji CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Tożsamość

Zobacz pola tożsamości `agents.list` w sekcji [Domyślne ustawienia agenta](/pl/gateway/config-agents#agent-defaults).

---

## Most (starszy, usunięty)

Bieżące kompilacje nie zawierają już mostu TCP. Node łączą się przez WebSocket Gateway. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się niepowodzeniem do czasu ich usunięcia; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja mostu (odniesienie historyczne)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: jak długo przechowywać ukończone izolowane sesje uruchomień Cron przed przycięciem z `sessions.json`. Kontroluje też czyszczenie zarchiwizowanych transkrypcji usuniętych zadań Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pojedynczego pliku dziennika uruchomienia (`cron/runs/<jobId>.jsonl`) przed przycięciem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze zachowywane po wyzwoleniu przycinania dziennika uruchomienia. Domyślnie: `2000`.
- `webhookToken`: token okaziciela używany do dostarczania POST Webhook Cron (`delivery.mode = "webhook"`); jeśli pominięty, nagłówek uwierzytelniania nie jest wysyłany.
- `webhook`: przestarzały starszy zapasowy URL Webhook (http/https), używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maksymalna liczba ponowień dla zadań jednorazowych przy błędach przejściowych (domyślnie: `3`; zakres: `0`–`10`).
- `backoffMs`: tablica opóźnień wycofania w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1–10 wpisów).
- `retryOn`: typy błędów wyzwalające ponowienia — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Dotyczy tylko jednorazowych zadań Cron. Zadania cykliczne używają oddzielnej obsługi niepowodzeń.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: włącz alerty o niepowodzeniach zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed wyzwoleniem alertu (dodatnia liczba całkowita, min: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: wliczaj kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone oddzielnie i nie wpływają na wycofanie po błędach wykonania.
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhook.
- `accountId`: opcjonalny identyfikator konta lub kanału ograniczający dostarczanie alertów.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Domyślny cel powiadomień o niepowodzeniach Cron we wszystkich zadaniach.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająco danych celu.
- `channel`: nadpisanie kanału dla dostarczania announce. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce lub URL Webhook. Wymagane w trybie Webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` skonfigurowane dla zadania nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani przypisanego do zadania celu niepowodzeń, zadania, które już dostarczają przez `announce`, przy niepowodzeniu wracają do tego podstawowego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że podstawowy `delivery.mode` zadania to `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonu modelu multimediów

Symbole zastępcze szablonu rozwijane w `tools.media.models[].args`:

| Zmienna            | Opis                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Pełna treść wiadomości przychodzącej              |
| `{{RawBody}}`      | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupowymi           |
| `{{From}}`         | Identyfikator nadawcy                             |
| `{{To}}`           | Identyfikator miejsca docelowego                  |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`    | UUID bieżącej sesji                               |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                |
| `{{MediaUrl}}`     | Pseudo-URL multimediów przychodzących             |
| `{{MediaPath}}`    | Lokalna ścieżka multimediów                       |
| `{{MediaType}}`    | Typ multimediów (obraz/audio/dokument/…)          |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt multimediów dla wpisów CLI      |
| `{{MaxChars}}`     | Rozwiązana maksymalna liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (w miarę możliwości)                  |
| `{{GroupMembers}}` | Podgląd członków grupy (w miarę możliwości)       |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (w miarę możliwości)    |
| `{{SenderE164}}`   | Numer telefonu nadawcy (w miarę możliwości)       |
| `{{Provider}}`     | Wskazówka dostawcy (WhatsApp, Telegram, Discord itd.) |

---

## Dołączanie konfiguracji (`$include`)

Podziel konfigurację na wiele plików:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Zachowanie scalania:**

- Pojedynczy plik: zastępuje obiekt zawierający.
- Tablica plików: głęboko scalana w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze równorzędne: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać wewnątrz katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy.
- Zapisy należące do OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu opartą na dołączeniu pojedynczego pliku, zapisują bezpośrednio do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami kluczy równorzędnych są tylko do odczytu dla zapisów należących do OpenClaw; te zapisy kończą się niepowodzeniem w sposób zamknięty zamiast spłaszczać konfigurację.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania i cyklicznych dołączeń.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
