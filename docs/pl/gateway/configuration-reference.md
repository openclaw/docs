---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Walidujesz bloki konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Odwołanie do konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i linków do dedykowanych odwołań podsystemów
title: Referencja konfiguracji
x-i18n:
    generated_at: "2026-04-30T09:52:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Dokumentacja głównej konfiguracji dla `~/.openclaw/openclaw.json`. Omówienie zorientowane na zadania znajdziesz w sekcji [Konfiguracja](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację. Katalogi poleceń należące do kanałów i Plugin oraz zaawansowane ustawienia pamięci/QMD znajdują się na własnych stronach, a nie tutaj.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktualny schemat JSON używany do walidacji i Control UI, z metadanymi wbudowanymi/Plugin/kanałów scalonymi, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi drążenia szczegółów
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują hash bazowy dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: przed edycjami użyj akcji narzędzia `gateway` `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pól. Użyj [Konfiguracji](/pl/gateway/configuration) dla wskazówek zorientowanych na zadania, a tej strony dla szerszej mapy pól, wartości domyślnych i linków do dokumentacji podsystemów.

Dedykowane szczegółowe dokumentacje:

- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji Dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Polecenia ukośnikowe](/pl/tools/slash-commands) dla bieżącego wbudowanego i dołączonego katalogu poleceń
- strony właścicieli kanałów/Plugin dla powierzchni poleceń specyficznych dla kanałów

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę — zobacz [Konfiguracja — kanały](/pl/gateway/config-channels) dla `channels.*`, w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage oraz innych dołączonych kanałów (uwierzytelnianie, kontrola dostępu, obsługa wielu kont, bramkowanie wzmianek).

## Domyślne ustawienia agenta, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę — zobacz [Konfiguracja — agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (przestrzeń robocza, model, myślenie, heartbeat, pamięć, multimedia, skills, piaskownica)
- `multiAgent.*` (routowanie i powiązania wielu agentów)
- `session.*` (cykl życia sesji, Compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nieustawione, Talk zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)

## Narzędzia i niestandardowi dostawcy

Polityka narzędzi, eksperymentalne przełączniki, konfiguracja narzędzi wspieranych przez dostawcę oraz konfiguracja niestandardowego dostawcy / bazowego URL zostały przeniesione na dedykowaną stronę — zobacz [Konfiguracja — narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja niestandardowego dostawcy znajdują się w sekcji [Konfiguracja — narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls). Katalog główny `models` odpowiada też za globalne zachowanie katalogu modeli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: zachowanie katalogu dostawców (`merge` lub `replace`).
- `models.providers`: mapa niestandardowych dostawców indeksowana identyfikatorem dostawcy.
- `models.pricing.enabled`: kontroluje uruchamianie cen w tle. Gdy ma wartość `false`, uruchamianie Gateway pomija pobieranie katalogów cen OpenRouter i LiteLLM; skonfigurowane wartości `models.providers.*.models[].cost` nadal działają dla lokalnych oszacowań kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się pod `mcp.servers` i są używane przez osadzony Pi oraz inne adaptery środowiska wykonawczego. Polecenia `openclaw mcp list`, `show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z serwerem docelowym podczas edycji konfiguracji.

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

- `mcp.servers`: nazwane definicje serwerów stdio lub zdalnych MCP dla środowisk wykonawczych, które udostępniają skonfigurowane narzędzia MCP. Wpisy zdalne używają `transport: "streamable-http"` lub `transport: "sse"`; `type: "http"` to natywny dla CLI alias, który `openclaw mcp set` i `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.sessionIdleTtlMs`: TTL bezczynności dla dołączonych środowisk wykonawczych MCP ograniczonych do sesji. Jednorazowe osadzone uruchomienia żądają czyszczenia po zakończeniu uruchomienia; ten TTL jest zabezpieczeniem dla długotrwałych sesji i przyszłych wywołań.
- Zmiany pod `mcp.*` są stosowane na gorąco przez usunięcie buforowanych sesyjnych środowisk wykonawczych MCP. Następne wykrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte wpisy `mcp.servers` są zbierane natychmiast zamiast czekać na TTL bezczynności.

Zobacz [MCP](/pl/cli/mcp#openclaw-as-an-mcp-client-registry) i [Backendy CLI](/pl/gateway/cli-backends#bundle-mcp-overlays), aby poznać zachowanie środowiska wykonawczego.

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

- `allowBundled`: opcjonalna lista dozwolonych wyłącznie dla dołączonych skills (zarządzane/workspace skills pozostają bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne skills (najniższy priorytet).
- `install.preferBrew`: gdy ma wartość true, preferuj instalatory Homebrew, gdy `brew` jest dostępny, zanim nastąpi powrót do innych typów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza skill nawet wtedy, gdy jest dołączony/zainstalowany.
- `entries.<skillKey>.apiKey`: udogodnienie dla skills deklarujących podstawową zmienną środowiskową (ciąg jawnego tekstu lub obiekt SecretRef).

---

## Plugins

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
- Wykrywanie akceptuje natywne plugins OpenClaw oraz zgodne pakiety Codex i Claude, w tym bezmanifestowe pakiety Claude o domyślnym układzie.
- **Zmiany konfiguracji wymagają ponownego uruchomienia gateway.**
- `allow`: opcjonalna lista dozwolonych (ładują się tylko wymienione plugins). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: pole udogodnienia dla klucza API na poziomie Plugin (gdy obsługiwane przez Plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych ograniczona do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy ma wartość `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków Plugin oraz obsługiwanych katalogów hooków dostarczanych przez pakiety.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy ma wartość `true`, zaufane niewbudowane plugins mogą odczytywać surową treść konwersacji z typowanych hooków, takich jak `llm_input`, `llm_output`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu Plugin, aby żądał nadpisań `provider` i `model` dla pojedynczych uruchomień subagentów w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Używaj `"*"` tylko wtedy, gdy celowo chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez Plugin (walidowany przez natywny schemat Plugin OpenClaw, gdy jest dostępny).
- Ustawienia konta/środowiska wykonawczego Plugin kanału znajdują się pod `channels.<id>` i powinny być opisywane przez metadane `channelConfigs` manifestu właścicielskiego Plugin, a nie przez centralny rejestr opcji OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy pobierania stron Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Wraca do `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` lub zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`).
  - `onlyMainContent`: wyodrębnia tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrapowania w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie w sieci Grok).
  - `enabled`: włącza dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik Dreaming (domyślnie `false`).
  - `frequency`: rytm cron dla każdego pełnego przebiegu Dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu subagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; połącz z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych nie wracają cicho do wartości zastępczych.
  - polityka faz i progi są szczegółami implementacji (nie są kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Dokumentacji konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone plugins pakietu Claude mogą też wnosić osadzone domyślne ustawienia Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybierz aktywny identyfikator Plugin pamięci albo `"none"`, aby wyłączyć plugins pamięci.
- `plugins.slots.contextEngine`: wybierz aktywny identyfikator Plugin silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Plugins](/pl/tools/plugin).

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
- `tabCleanup` odzyskuje śledzone karty agenta głównego po czasie bezczynności lub gdy
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` albo `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje ścisła.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie ścisłym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas sprawdzania osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie ścisłym użyj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do dołączania (uruchamianie/zatrzymywanie/resetowanie wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`; użyj WS(S),
  gdy dostawca podaje bezpośredni adres URL DevTools WebSocket.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` dotyczą zdalnej oraz
  `attachOnly` osiągalności CDP, a także żądań otwierania kart. Zarządzane profile
  loopback zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw w tym
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw potraktuje port loopback jako
  lokalny zarządzany profil przeglądarki i może zgłaszać błędy własności lokalnego portu.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą dołączać na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, takiej jak Brave lub Edge.
- Profile `existing-session` zachowują bieżące limity tras Chrome MCP:
  akcje oparte na migawkach/referencjach zamiast wskazywania selektorami CSS, haki
  przesyłania jednego pliku, brak nadpisań limitów czasu okien dialogowych, brak
  `wait --load networkidle` oraz brak `responsebody`, eksportu PDF, przechwytywania pobrań
  i akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a drugi w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do wykrywania HTTP
  Chrome CDP po starcie procesu oraz `browser.localCdpReadyTimeoutMs` do
  gotowości websocket CDP po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się poprawnie, ale sprawdzanie gotowości ściga się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` dla katalogu domowego systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` przypisane do profilu w profilach `existing-session` również jest rozwijane z tyldą.
- Usługa sterowania: tylko loopback (port wyprowadzony z `gateway.port`, domyślnie `18791`).
- `extraArgs` dołącza dodatkowe flagi uruchamiania do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## Interfejs użytkownika

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

- `seamColor`: kolor akcentu dla chromu interfejsu natywnej aplikacji (odcień dymka Trybu rozmowy itd.).
- `assistant`: nadpisanie tożsamości Control UI. W razie braku używa tożsamości aktywnego agenta.

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

<Accordion title="Szczegóły pól Gateway">

- `mode`: `local` (uruchamia Gateway) lub `remote` (łączy się ze zdalnym Gateway). Gateway odmawia uruchomienia, chyba że ustawiono `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Kolejność pierwszeństwa: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy wiązania**: używaj wartości trybu wiązania w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Dockera**: domyślne wiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowej Dockera (`-p 18789:18789`) ruch dociera przez `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Uwierzytelnianie**: domyślnie wymagane. Wiązania inne niż local loopback wymagają uwierzytelniania Gateway. W praktyce oznacza to współdzielony token/hasło albo świadome tożsamości odwrotne proxy z `gateway.auth.mode: "trusted-proxy"`. Kreator wdrażania domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Przepływy uruchamiania oraz instalacji/naprawy usługi kończą się niepowodzeniem, gdy skonfigurowano oba pola, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko dla zaufanych konfiguracji local loopback; celowo nie jest oferowany przez podpowiedzi wdrażania.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie przeglądarki/użytkownika do świadomego tożsamości odwrotnego proxy i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **spoza local loopback**; odwrotne proxy local loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą używać `gateway.auth.password` jako lokalnego bezpośredniego fallbacku; `gateway.auth.token` pozostaje wzajemnie wykluczające się z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełnić uwierzytelnianie Control UI/WebSocket (zweryfikowane przez `tailscale whois`). Punkty końcowe HTTP API **nie** używają tego uwierzytelniania nagłówkiem Tailscale; zamiast tego stosują normalny tryb uwierzytelniania HTTP Gateway. Ten przepływ bez tokena zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanego uwierzytelniania. Stosowany na adres IP klienta i zakres uwierzytelniania (shared-secret i device-token są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Współbieżne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast obu przechodzić równolegle jako zwykłe niezgodności.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz ograniczać także ruch localhost (dla konfiguracji testowych lub rygorystycznych wdrożeń proxy).
- Próby uwierzytelniania WS z pochodzenia przeglądarki są zawsze ograniczane, z wyłączonym wyjątkiem dla local loopback (ochrona warstwowa przed atakami brute force na localhost z poziomu przeglądarki).
- W local loopback te blokady z pochodzenia przeglądarki są izolowane według znormalizowanej wartości `Origin`, więc powtarzające się niepowodzenia z jednego pochodzenia localhost nie blokują automatycznie innego pochodzenia.
- `tailscale.mode`: `serve` (tylko tailnet, wiązanie local loopback) lub `funnel` (publiczne, wymaga uwierzytelniania).
- `controlUi.allowedOrigins`: jawna lista dozwolonych pochodzeń przeglądarki dla połączeń WebSocket z Gateway. Wymagana, gdy oczekuje się klientów przeglądarkowych z pochodzeń innych niż local loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb włączający fallback pochodzenia z nagłówka Host dla wdrożeń, które celowo polegają na polityce pochodzenia z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` wartość `remote.url` musi być `ws://` albo `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: awaryjne obejście w środowisku procesu po stronie klienta, które pozwala na jawnotekstowe `ws://` do zaufanych adresów IP sieci prywatnej; domyślnie jawnotekstowe połączenia pozostają ograniczone do local loopback. Nie ma odpowiednika w `openclaw.json`, a konfiguracja sieci prywatnej przeglądarki, taka jak `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, nie wpływa na klientów WebSocket Gateway.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same w sobie nie konfigurują uwierzytelniania Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy URL HTTPS dla zewnętrznego przekaźnika APNs używanego przez oficjalne/TestFlight kompilacje iOS po opublikowaniu w Gateway rejestracji opartych na przekaźniku. Ten URL musi pasować do URL przekaźnika wkompilowanego w kompilację iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłania Gateway-do-przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na przekaźniku są delegowane do konkretnej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji przekaźnika i przekazuje do Gateway uprawnienie wysyłania ograniczone do rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania środowiskowe powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: furtka tylko deweloperska dla URL-i przekaźnika HTTP w local loopback. Produkcyjne URL-e przekaźnika powinny pozostać na HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu uzgadniania WebSocket Gateway przed uwierzytelnieniem w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma pierwszeństwo, gdy jest ustawione. Zwiększ tę wartość na obciążonych lub słabszych hostach, gdzie lokalni klienci mogą łączyć się, gdy rozgrzewanie po uruchomieniu wciąż się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanału w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktywnego gniazda w minutach. Utrzymuj go jako większy lub równy `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji na kanał/konto w przesuwanym oknie godzinnym. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja z restartów monitora kondycji dla pojedynczego kanału przy zachowaniu włączonego monitora globalnego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla pojedynczego konta w kanałach wielokontowych. Gdy jest ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpieczną odmową (bez maskowania przez zdalny fallback).
- `trustedProxies`: adresy IP odwrotnych proxy, które terminują TLS lub wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy local loopback nadal są prawidłowe dla konfiguracji proxy/wykrywania lokalnego na tym samym hoście (na przykład Tailscale Serve lub lokalne odwrotne proxy), ale **nie** sprawiają, że żądania local loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false`, aby zachować zachowanie fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna lista dozwolonych CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia Node bez żądanych zakresów. Jest wyłączona, gdy nie jest ustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/Control UI/WebChat ani nie zatwierdza automatycznie aktualizacji roli, zakresu, metadanych czy klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń Node po parowaniu i ocenie listy dozwolonej platformy. Użyj `allowCommands`, aby włączyć niebezpieczne polecenia Node, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie, nawet jeśli domyślne ustawienie platformy lub jawne zezwolenie w przeciwnym razie by je obejmowało. Po zmianie przez Node zadeklarowanej listy poleceń odrzuć i ponownie zatwierdź parowanie tego urządzenia, aby Gateway zapisał zaktualizowaną migawkę poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę odmów).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy odmów HTTP.

</Accordion>

### Punkty końcowe zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Wzmocnienie wejściowych URL-i Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolonych są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false` i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL-i.
- Opcjonalny nagłówek wzmacniający odpowiedź:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla kontrolowanych przez siebie pochodzeń HTTPS; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Wygodne flagi: `--dev` (używa `~/.openclaw-dev` + portu `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

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
- `autoGenerate`: automatycznie generuje lokalną, samopodpisaną parę certyfikat/klucz, gdy nie skonfigurowano jawnych plików; tylko do użytku lokalnego/deweloperskiego.
- `certPath`: ścieżka w systemie plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka w systemie plików do pliku klucza prywatnego TLS; utrzymuj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka pakietu CA do weryfikacji klienta lub niestandardowych łańcuchów zaufania.

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
  - `"off"`: ignoruje zmiany na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuje proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuje zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw próbuje hot reload; w razie potrzeby przechodzi na restart.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i okresowo logować ostrzeżenia o nadal oczekujących operacjach.

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
Tokeny hooków w ciągu zapytania są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` musi być **inny** niż `gateway.auth.token`; ponowne użycie tokenu Gateway jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają tej zgody.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z treści żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone z zewnątrz i także wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole treści dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z treści.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostawać w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie poza katalog są odrzucane).
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do wartości domyślnej.
- `allowedAgentIds`: ogranicza jawne kierowanie (`*` lub pominięcie = zezwól na wszystkie, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta hooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: zezwala wywołującym `/hooks/agent` oraz kluczom sesji mapowania sterowanego szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie to `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli katalog modeli jest ustawiony).

</Accordion>

### Integracja z Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
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

## Host canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serwuje edytowalne przez agenta HTML/CSS/JS oraz A2UI przez HTTP pod portem Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Powiązania inne niż loopback: trasy canvas wymagają uwierzytelnienia Gateway (token/hasło/zaufany proxy), tak samo jak inne powierzchnie HTTP Gateway.
- WebView Node zwykle nie wysyłają nagłówków uwierzytelnienia; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL możliwości ograniczone do węzła dla dostępu do canvas/A2UI.
- Adresy URL możliwości są powiązane z aktywną sesją WS węzła i szybko wygasają. Zapasowy mechanizm oparty na adresie IP nie jest używany.
- Wstrzykuje klienta live reload do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Serwuje także A2UI pod `/__openclaw__/a2ui/`.
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
- Nazwa hosta domyślnie używa systemowej nazwy hosta, gdy jest prawidłową etykietą DNS, w przeciwnym razie wraca do `openclaw`. Nadpisz za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Szeroki obszar (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje jednostrefową strefę DNS-SD w `~/.openclaw/dns/`. W przypadku wykrywania między sieciami połącz z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (zmienne środowiskowe inline)

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

- Wbudowane zmienne środowiskowe są stosowane tylko wtedy, gdy w środowisku procesu brakuje danego klucza.
- Pliki `.env`: CWD `.env` + `~/.openclaw/.env` (żaden z nich nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Pełną kolejność pierwszeństwa opisuje [Środowisko](/pl/help/environment).

### Podstawianie zmiennych środowiskowych

Odwołuj się do zmiennych środowiskowych w dowolnym ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy zapisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd podczas ładowania konfiguracji.
- Użyj ucieczki `$${VAR}`, aby uzyskać literał `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: wartości w postaci zwykłego tekstu nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- wzorzec id dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id dla `source: "file"`: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- wzorzec id dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id dla `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielanych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Macierz kanoniczna: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` kieruje na obsługiwane ścieżki poświadczeń `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględnione w rozwiązywaniu w czasie wykonywania i pokryciu audytu.

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
- Ścieżki dostawców file i exec kończą się odmową, gdy weryfikacja ACL systemu Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie da się zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące symlinkami są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki symlinków przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu dotyczy rozwiązanej ścieżki docelowej.
- Środowisko procesu potomnego `exec` jest domyślnie minimalne; wymagane zmienne przekaż jawnie za pomocą `passEnv`.
- Odwołania do sekretów są rozwiązywane podczas aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują tylko tę migawkę.
- Filtrowanie aktywnej powierzchni działa podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują niepowodzenie uruchomienia/przeładowania, a nieaktywne powierzchnie są pomijane z diagnostyką.

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
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem czasu wykonywania; `openclaw doctor --fix` przepisuje je do kanonicznych profili klucza API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu uwierzytelniania opartych na SecretRef.
- Statyczne poświadczenia czasu wykonywania pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie sekretów w czasie wykonywania oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

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

- `billingBackoffHours`: bazowy backoff w godzinach, gdy profil kończy się niepowodzeniem z powodu rzeczywistych
  błędów rozliczeń/niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne dla dostawcy
  pozostają ograniczone do dostawcy, który je posiada (na przykład OpenRouter
  `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia lub
  limitu wydatków organizacji/obszaru roboczego pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin backoffu rozliczeń dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu backoffu rozliczeń (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy backoff w minutach dla niepowodzeń `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu backoffu `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: kroczące okno w godzinach używane dla liczników backoffu (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów przeciążenia przed przełączeniem na model fallback (domyślnie: `1`). Kształty zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na model fallback (domyślnie: `1`). Ten koszyk limitu szybkości obejmuje tekst w kształcie dostawcy, taki jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

---

## Logowanie

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
- `consoleLevel` przechodzi na `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw zachowuje maksymalnie pięć numerowanych archiwów obok aktywnego pliku.
- `redactSensitive` / `redactPatterns`: maskowanie best-effort dla danych wyjściowych konsoli, dzienników plikowych, rekordów dziennika OTLP i utrwalonego tekstu transkrypcji sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji; powierzchnie bezpieczeństwa UI/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

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

- `enabled`: główny przełącznik danych wyjściowych instrumentacji (domyślnie: `true`).
- `flags`: tablica ciągów flag włączających ukierunkowane dane wyjściowe dziennika (obsługuje symbole wieloznaczne, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku w ms dla emitowania ostrzeżeń o zablokowanej sesji, gdy sesja pozostaje w stanie przetwarzania.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [eksporcie OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne punkty końcowe OTLP specyficzne dla sygnału. Po ustawieniu zastępują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącz eksport śladów, metryk lub dzienników.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`–`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów spanów OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje niesystemową treść wiadomości/narzędzi; forma obiektowa pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` i `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszych eksperymentalnych atrybutów dostawcy spanów GenAI. Domyślnie spany zachowują starszy atrybut `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do plugin, zachowując aktywne nasłuchiwacze diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe punktów końcowych specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji nie jest ustawiony.
- `cacheTrace.enabled`: zapisuj migawki śladu pamięci podręcznej dla osadzonych uruchomień (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śladu pamięci podręcznej (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w danych wyjściowych śladu pamięci podręcznej (wszystkie domyślnie: `true`).

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
- `checkOnStart`: sprawdzaj aktualizacje npm przy uruchamianiu Gateway (domyślnie: `true`).
- `auto.enabled`: włącz automatyczną aktualizację w tle dla instalacji pakietowych (domyślnie: `false`).
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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć dispatch ACP i możliwości uruchamiania).
- `dispatch.enabled`: niezależna bramka dla dispatch tury sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP, blokując jednocześnie wykonanie.
- `backend`: domyślny identyfikator backendu środowiska uruchomieniowego ACP (musi pasować do zarejestrowanego plugin środowiska uruchomieniowego ACP).
  Jeśli ustawiono `plugins.allow`, uwzględnij identyfikator plugin backendu (na przykład `acpx`), w przeciwnym razie dołączony domyślny plugin się nie załaduje.
- `defaultAgent`: zapasowy identyfikator agenta docelowego ACP, gdy uruchomienia nie określają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych do sesji środowiska uruchomieniowego ACP; pusta oznacza brak dodatkowych ograniczeń.
- `maxConcurrentSessions`: maksymalna liczba równocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania bezczynności w ms dla tekstu strumieniowanego.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji bloku strumieniowanego.
- `stream.repeatSuppression`: tłum powtarzające się wiersze statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do zdarzeń końcowych tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków danych wyjściowych asystenta projektowanych na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych wierszy statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów na logiczne nadpisania widoczności dla zdarzeń strumieniowanych.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla workerów sesji ACP przed możliwością czyszczenia.
- `runtime.installCommand`: opcjonalne polecenie instalacji uruchamiane podczas inicjowania środowiska uruchomieniowego ACP.

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

Zobacz pola tożsamości `agents.list` w [domyślnych ustawieniach agenta](/pl/gateway/config-agents#agent-defaults).

---

## Bridge (starsze, usunięte)

Bieżące kompilacje nie zawierają już bridge TCP. Node łączą się przez WebSocket Gateway. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się niepowodzeniem do czasu ich usunięcia; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja bridge (odniesienie historyczne)">

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

- `sessionRetention`: jak długo zachowywać ukończone izolowane sesje uruchomień Cron przed usunięciem z `sessions.json`. Kontroluje także czyszczenie zarchiwizowanych usuniętych transkrypcji Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pliku dziennika na uruchomienie (`cron/runs/<jobId>.jsonl`) przed przycinaniem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze zachowywane po wyzwoleniu przycinania dziennika uruchomień. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST Cron Webhook (`delivery.mode = "webhook"`); jeśli pominięty, nagłówek autoryzacji nie jest wysyłany.
- `webhook`: przestarzały zapasowy URL Webhook (http/https) używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

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
- `backoffMs`: tablica opóźnień backoff w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1–10 wpisów).
- `retryOn`: typy błędów wyzwalające ponowienia — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Dotyczy tylko jednorazowych zadań Cron. Zadania cykliczne używają osobnej obsługi niepowodzeń.

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

- `enabled`: włącz alerty niepowodzeń dla zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed wyzwoleniem alertu (dodatnia liczba całkowita, min.: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzającymi się alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: wliczaj kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone osobno i nie wpływają na backoff błędów wykonania.
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhook.
- `accountId`: opcjonalny identyfikator konta lub kanału do zawężenia dostarczania alertów.

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
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająca ilość danych celu.
- `channel`: nadpisanie kanału dla dostarczania `announce`. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel `announce` lub URL Webhook. Wymagane w trybie Webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` dla pojedynczego zadania nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani zadaniowego celu niepowodzenia, zadania, które już dostarczają przez `announce`, w razie niepowodzenia wracają do tego głównego celu `announce`.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że główne `delivery.mode` zadania to `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonu modelu mediów

Symbole zastępcze szablonu rozwijane w `tools.media.models[].args`:

| Zmienna            | Opis                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Pełna treść przychodzącej wiadomości              |
| `{{RawBody}}`      | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupowymi           |
| `{{From}}`         | Identyfikator nadawcy                             |
| `{{To}}`           | Identyfikator miejsca docelowego                  |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`    | UUID bieżącej sesji                               |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                |
| `{{MediaUrl}}`     | Pseudo-URL przychodzących mediów                  |
| `{{MediaPath}}`    | Lokalna ścieżka mediów                            |
| `{{MediaType}}`    | Typ mediów (obraz/audio/dokument/…)               |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt mediów dla wpisów CLI           |
| `{{MaxChars}}`     | Rozwiązana maksymalna liczba znaków wyjściowych dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (najlepsza dostępna próba)            |
| `{{GroupMembers}}` | Podgląd członków grupy (najlepsza dostępna próba) |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (najlepsza dostępna próba) |
| `{{SenderE164}}`   | Numer telefonu nadawcy (najlepsza dostępna próba) |
| `{{Provider}}`     | Wskazówka dostawcy (whatsapp, telegram, discord itd.) |

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
- Klucze siostrzane: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać wewnątrz katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy.
- Zapisy należące do OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu opartą na dołączeniu pojedynczego pliku, są zapisywane do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami siostrzanymi są tylko do odczytu dla zapisów należących do OpenClaw; takie zapisy kończą się zamknięciem zamiast spłaszczać konfigurację.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania i cyklicznych dołączeń.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
