---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Sprawdzasz poprawność bloków konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja referencyjna konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i linków do dedykowanych dokumentacji referencyjnych podsystemów
title: Dokumentacja referencyjna konfiguracji
x-i18n:
    generated_at: "2026-05-03T21:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52fa15e85a41ed5ed39102fb641bd33f0aec2e8f244c9d7b3d12b3a1b6dc62a9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Dokumentacja referencyjna podstawowej konfiguracji dla `~/.openclaw/openclaw.json`. Omówienie zorientowane na zadania znajdziesz w sekcji [Konfiguracja](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację referencyjną. Katalogi poleceń należące do kanałów i pluginów oraz szczegółowe ustawienia pamięci/QMD znajdują się na osobnych stronach, a nie na tej.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje bieżący JSON Schema używany do walidacji i Control UI, z dołączonymi metadanymi wbudowanych elementów/pluginów/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi drążenia szczegółów
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują skrót bazowy dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: przed edycjami użyj akcji narzędzia `gateway` `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pól. Użyj [Konfiguracja](/pl/gateway/configuration) do wskazówek zorientowanych na zadania, a tej strony do szerszej mapy pól, wartości domyślnych i linków do dokumentacji referencyjnych podsystemów.

Dedykowane szczegółowe dokumentacje referencyjne:

- [Dokumentacja referencyjna konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Polecenia ukośnika](/pl/tools/slash-commands) dla bieżącego wbudowanego i dołączonego katalogu poleceń
- strony właścicieli kanałów/pluginów dla powierzchni poleceń specyficznych dla kanału

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę — zobacz
[Konfiguracja — kanały](/pl/gateway/config-channels) dla `channels.*`,
w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych
wbudowanych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Wartości domyślne agentów, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę — zobacz
[Konfiguracja — agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (obszar roboczy, model, myślenie, heartbeat, pamięć, media, skills, sandbox)
- `multiAgent.*` (routing i powiązania wielu agentów)
- `session.*` (cykl życia sesji, compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk w iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nie jest ustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)

## Narzędzia i niestandardowi dostawcy

Zasady narzędzi, przełączniki eksperymentalne, konfiguracja narzędzi opartych na dostawcach oraz konfiguracja niestandardowych dostawców / bazowego URL zostały przeniesione na dedykowaną stronę — zobacz
[Konfiguracja — narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja niestandardowych dostawców znajdują się w
[Konfiguracja — narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls).
Katalog główny `models` odpowiada także za globalne zachowanie katalogu modeli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: zachowanie katalogu dostawcy (`merge` lub `replace`).
- `models.providers`: mapa niestandardowych dostawców indeksowana identyfikatorem dostawcy.
- `models.pricing.enabled`: steruje uruchamianiem w tle danych cenowych, które
  zaczyna się po osiągnięciu ścieżki gotowości Gateway przez sidecary i kanały. Gdy `false`,
  Gateway pomija pobieranie katalogów cen OpenRouter i LiteLLM; skonfigurowane
  wartości `models.providers.*.models[].cost` nadal działają dla lokalnych szacunków kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się pod `mcp.servers` i są
używane przez wbudowane Pi oraz inne adaptery uruchomieniowe. Polecenia `openclaw mcp list`,
`show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z
serwerem docelowym podczas edycji konfiguracji.

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

- `mcp.servers`: nazwane definicje serwerów MCP stdio lub zdalnych dla środowisk uruchomieniowych, które
  udostępniają skonfigurowane narzędzia MCP.
  Wpisy zdalne używają `transport: "streamable-http"` lub `transport: "sse"`;
  `type: "http"` jest natywnym dla CLI aliasem, który `openclaw mcp set` i
  `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.sessionIdleTtlMs`: czas TTL bezczynności dla sesyjnych, wbudowanych środowisk uruchomieniowych MCP.
  Jednorazowe uruchomienia wbudowane proszą o sprzątanie po zakończeniu uruchomienia; ten TTL jest zabezpieczeniem dla
  długotrwałych sesji i przyszłych wywołujących.
- Zmiany pod `mcp.*` są stosowane na gorąco przez zwolnienie buforowanych sesyjnych środowisk uruchomieniowych MCP.
  Następne wykrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte
  wpisy `mcp.servers` są zbierane natychmiast zamiast czekać na TTL bezczynności.

Zobacz [MCP](/pl/cli/mcp#openclaw-as-an-mcp-client-registry) oraz
[Backendy CLI](/pl/gateway/cli-backends#bundle-mcp-overlays), aby poznać zachowanie uruchomieniowe.

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

- `allowBundled`: opcjonalna lista dozwolonych tylko dla wbudowanych skills (zarządzane/robocze skills bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne skills (najniższy priorytet).
- `install.preferBrew`: gdy ma wartość true, preferuj instalatory Homebrew, gdy `brew` jest
  dostępny, przed przejściem do innych typów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza skill, nawet jeśli jest wbudowany/zainstalowany.
- `entries.<skillKey>.apiKey`: ułatwienie dla skills deklarujących główną zmienną środowiskową (ciąg jawny lub obiekt SecretRef).

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
- Wykrywanie akceptuje natywne pluginy OpenClaw oraz kompatybilne pakiety Codex i Claude, w tym pakiety Claude o domyślnym układzie bez manifestu.
- **Zmiany konfiguracji wymagają restartu gateway.**
- `allow`: opcjonalna lista dozwolonych (ładowane są tylko wymienione pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy obsługiwane przez plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych ograniczona do pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginów i obsługiwanych katalogów hooków dostarczanych przez pakiety.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane niewbudowane pluginy mogą odczytywać surową treść konwersacji z typowanych hooków, takich jak `llm_input`, `llm_output`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu pluginowi, aby mógł żądać nadpisań `provider` i `model` dla pojedynczych uruchomień subagentów w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Używaj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez natywny schemat pluginu OpenClaw, gdy jest dostępny).
- Ustawienia konta/środowiska uruchomieniowego pluginu kanału znajdują się pod `channels.<id>` i powinny być opisywane przez metadane `channelConfigs` manifestu pluginu właściciela, a nie przez centralny rejestr opcji OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy web-fetch Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Awaryjnie używa `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` lub zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne endpointy).
  - `onlyMainContent`: wyodrębnij ze stron tylko główną treść (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie web Grok).
  - `enabled`: włącz dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik dreaming (domyślnie `false`).
  - `frequency`: rytm cron dla każdego pełnego przebiegu dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu subagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; połącz z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych nie przechodzą po cichu na wartość awaryjną.
  - zasady faz i progi są szczegółami implementacji (nie są kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Dokumentacja referencyjna konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone pluginy pakietów Claude mogą też dostarczać wbudowane wartości domyślne Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybierz identyfikator aktywnego pluginu pamięci albo `"none"`, aby wyłączyć pluginy pamięci.
- `plugins.slots.contextEngine`: wybierz identyfikator aktywnego pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Plugins](/pl/tools/plugin).

---

## Zobowiązania

`commitments` steruje wnioskowaną pamięcią działań następczych: OpenClaw może wykrywać check-iny z tur konwersacji i dostarczać je przez uruchomienia heartbeat.

- `commitments.enabled`: włącz ukryte wyodrębnianie LLM, przechowywanie i dostarczanie przez heartbeat dla wnioskowanych zobowiązań działań następczych. Domyślnie: `false`.
- `commitments.maxPerDay`: maksymalna liczba wnioskowanych zobowiązań działań następczych dostarczanych na sesję agenta w kroczącym dniu. Domyślnie: `3`.

Zobacz [Wnioskowane zobowiązania](/pl/concepts/commitments).

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
- `tabCleanup` odzyskuje śledzone karty głównego agenta po czasie bezczynności lub gdy
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` albo `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy świadomie ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` nadal jest obsługiwane jako starszy alias.
- W trybie restrykcyjnym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do dołączania (uruchamianie/zatrzymywanie/resetowanie wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`; użyj WS(S),
  gdy dostawca daje bezpośredni adres URL DevTools WebSocket.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` dotyczą osiągalności zdalnego i
  `attachOnly` CDP oraz żądań otwierania kart. Zarządzane profile loopback
  zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw w tym
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw traktuje port loopback jako
  lokalny zarządzany profil przeglądarki i może zgłaszać błędy własności lokalnego portu.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą dołączać na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` zachowują bieżące limity trasy Chrome MCP:
  akcje oparte na snapshot/ref zamiast wskazywania selektorami CSS, haki przesyłania
  jednego pliku, brak nadpisywania limitów czasu okien dialogowych, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań i akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a drugi w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do wykrywania HTTP Chrome CDP
  po starcie procesu oraz `browser.localCdpReadyTimeoutMs` do gotowości websocket CDP
  po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się poprawnie, ale kontrole gotowości ścigają się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` jako katalog domowy systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` dla profilu `existing-session` na poziomie profilu również rozwija tyldę.
- Usługa sterowania: tylko loopback (port wyprowadzany z `gateway.port`, domyślnie `18791`).
- `extraArgs` dodaje dodatkowe flagi uruchamiania do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

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

- `seamColor`: kolor akcentu dla chrome UI natywnej aplikacji (odcień dymku Talk Mode itp.).
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
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
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

- `mode`: `local` (uruchom Gateway) lub `remote` (połącz ze zdalnym Gateway). Gateway odmawia uruchomienia, jeśli nie ustawiono `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Kolejność pierwszeństwa: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Dockera**: domyślne powiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowanej Dockera (`-p 18789:18789`) ruch trafia na `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Auth**: domyślnie wymagane. Powiązania inne niż loopback wymagają uwierzytelniania Gateway. W praktyce oznacza to współdzielony token/hasło albo świadomy tożsamości odwrotny serwer proxy z `gateway.auth.mode: "trusted-proxy"`. Kreator onboardingu domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` lub `password`. Uruchomienie oraz przepływy instalacji/naprawy usługi kończą się niepowodzeniem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez auth. Używaj tylko dla zaufanych konfiguracji local loopback; celowo nie jest oferowany przez monity onboardingu.
- `gateway.auth.mode: "trusted-proxy"`: deleguj auth przeglądarki/użytkownika do świadomego tożsamości odwrotnego serwera proxy i ufaj nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Auth z zaufanym proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **innego niż loopback**; odwrotne proxy na tym samym hoście przez loopback wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą użyć `gateway.auth.password` jako lokalnej bezpośredniej ścieżki awaryjnej; `gateway.auth.token` pozostaje wzajemnie wykluczające się z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełnić auth Control UI/WebSocket (zweryfikowane przez `tailscale whois`). Endpointy HTTP API **nie** używają tego auth nagłówka Tailscale; zamiast tego stosują normalny tryb auth HTTP Gateway. Ten przepływ bez tokena zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanych prób auth. Działa na adres IP klienta i zakres auth (shared-secret i device-token są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Równoczesne błędne próby z tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast obu przejść równolegle jako zwykłe niezgodności.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz ograniczać częstotliwość także ruchu localhost (dla konfiguracji testowych lub rygorystycznych wdrożeń proxy).
- Próby auth WS z origin przeglądarki są zawsze ograniczane częstotliwościowo z wyłączonym wyjątkiem loopback (obrona warstwowa przed brute force localhost z przeglądarki).
- Na loopback te blokady origin przeglądarki są izolowane według znormalizowanej wartości `Origin`, więc powtarzające się niepowodzenia z jednego origin localhost nie blokują automatycznie innego origin.
- `tailscale.mode`: `serve` (tylko tailnet, powiązanie loopback) lub `funnel` (publiczne, wymaga auth).
- `controlUi.allowedOrigins`: jawna lista dozwolonych origin przeglądarki dla połączeń Gateway WebSocket. Wymagane, gdy oczekuje się klientów przeglądarkowych z origin innych niż loopback.
- `controlUi.chatMessageMaxWidth`: opcjonalna maksymalna szerokość dla grupowanych wiadomości czatu Control UI. Akceptuje ograniczone wartości szerokości CSS, takie jak `960px`, `82%`, `min(1280px, 82%)` i `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza fallback origin z nagłówka Host dla wdrożeń, które celowo polegają na polityce origin opartej na nagłówku Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct`, `remote.url` musi być `ws://` lub `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: awaryjne nadpisanie po stronie klienta przez środowisko procesu, które pozwala na plaintext `ws://` do zaufanych adresów IP sieci prywatnej; domyślnie plaintext pozostaje ograniczony do loopback. Nie ma odpowiednika w `openclaw.json`, a konfiguracja prywatnej sieci przeglądarki, taka jak `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, nie wpływa na klientów Gateway WebSocket.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same nie konfigurują auth Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy adres URL HTTPS zewnętrznego przekaźnika APNs używanego przez oficjalne/TestFlight kompilacje iOS po opublikowaniu w Gateway rejestracji opartych na przekaźniku. Ten URL musi odpowiadać URL przekaźnika wkompilowanemu w kompilację iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłania Gateway-do-przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na przekaźniku są delegowane do konkretnej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, uwzględnia tę tożsamość w rejestracji przekaźnika i przekazuje do Gateway uprawnienie wysyłania ograniczone do rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne tylko deweloperskie dla URL-i przekaźnika HTTP przez loopback. Produkcyjne URL-e przekaźnika powinny pozostać na HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu uzgadniania Gateway WebSocket przed auth w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma pierwszeństwo, gdy jest ustawione. Zwiększ to na obciążonych lub słabszych hostach, gdzie lokalni klienci mogą łączyć się, gdy rozgrzewka uruchamiania wciąż się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanału w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktualnego gniazda w minutach. Utrzymuj wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji na kanał/konto w kroczącą godzinę. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja per kanał z restartów monitora kondycji przy zachowaniu włączonego monitora globalnego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy jest ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się zamknięciem z odmową (bez maskowania przez zdalny fallback).
- `trustedProxies`: adresy IP odwrotnych proxy, które terminują TLS lub wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji proxy/lokalnej detekcji na tym samym hoście (na przykład Tailscale Serve lub lokalne odwrotne proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna lista dozwolonych CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia node bez żądanych zakresów. Jest wyłączona, gdy nie jest ustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/Control UI/WebChat ani nie zatwierdza automatycznie ulepszeń roli, zakresu, metadanych lub klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń node po parowaniu i ocenie listy dozwolonych platformy. Użyj `allowCommands`, aby jawnie włączyć niebezpieczne polecenia node, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie nawet wtedy, gdy domyślne ustawienie platformy lub jawne allow w przeciwnym razie by je uwzględniło. Po zmianie przez node zadeklarowanej listy poleceń odrzuć i ponownie zatwierdź to parowanie urządzenia, aby Gateway zapisał zaktualizowaną migawkę poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę deny).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy deny HTTP.

</Accordion>

### Endpointy kompatybilne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz za pomocą `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Wzmocnienie wejścia URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolonych są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false` i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL.
- Opcjonalny nagłówek wzmacniający odpowiedź:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla origin HTTPS, które kontrolujesz; zobacz [Auth z zaufanym proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchom wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flagi wygody: `--dev` (używa `~/.openclaw-dev` + port `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

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
- `autoGenerate`: automatycznie generuje lokalną parę samopodpisanego certyfikatu/klucza, gdy jawne pliki nie są skonfigurowane; tylko do użytku lokalnego/deweloperskiego.
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

- `mode`: kontroluje, jak edycje konfiguracji są stosowane w czasie działania.
  - `"off"`: ignoruj edycje na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuj proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuj zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw spróbuj hot reload; w razie potrzeby użyj restartu jako fallback.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i rejestrować okresowe ostrzeżenia o nadal oczekujących operacjach.

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
Tokeny Webhooka w ciągu zapytania są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustej wartości `hooks.token`.
- `hooks.token` musi być **różny** od `gateway.auth.token`; ponowne użycie tokena Gateway jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej ścieżki podrzędnej, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowanego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają tej zgody.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z ładunku żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywany przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone zewnętrznie i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` dopasowuje ścieżkę podrzędną po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole ładunku dla ogólnych ścieżek.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z ładunku.
- `transform` może wskazywać moduł JS/TS zwracający akcję Webhooka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie poza katalog są odrzucane).
  - Przechowuj `hooks.transformsDir` w `~/.openclaw/hooks/transforms`; katalogi umiejętności w przestrzeni roboczej są odrzucane. Jeśli `openclaw doctor` zgłasza tę ścieżkę jako nieprawidłową, przenieś moduł transformacji do katalogu transformacji Webhooków albo usuń `hooks.transformsDir`.
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do wartości domyślnej.
- `allowedAgentIds`: ogranicza jawne kierowanie (`*` lub pominięte = zezwól na wszystkie, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta Webhooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: zezwala wywołującym `/hooks/agent` i kluczom sesji mapowania sterowanym szablonami na ustawianie `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowanego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego uruchomienia Webhooka (musi być dozwolony, jeśli katalog modeli jest ustawiony).

</Accordion>

### Integracja z Gmailem

- Wbudowany preset Gmaila używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmaila, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast domyślnej wartości szablonowanej.

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

- Udostępnia edytowalne przez agenta HTML/CSS/JS oraz A2UI przez HTTP pod portem Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Powiązania inne niż loopback: trasy canvas wymagają uwierzytelniania Gateway (token/hasło/zaufany proxy), tak samo jak inne powierzchnie HTTP Gateway.
- WebViews Node zwykle nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL capability ograniczone do węzła dla dostępu canvas/A2UI.
- Adresy URL capability są powiązane z aktywną sesją WS węzła i szybko wygasają. Fallback oparty na adresie IP nie jest używany.
- Wstrzykuje klienta przeładowywania na żywo do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Udostępnia również A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają ponownego uruchomienia Gateway.
- Wyłącz przeładowywanie na żywo dla dużych katalogów lub błędów `EMFILE`.

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

- `minimal` (domyślnie, gdy włączony jest dołączony Plugin `bonjour`): pomija `cliPath` + `sshPort` z rekordów TXT.
- `full`: uwzględnia `cliPath` + `sshPort`; rozgłaszanie multicastowe w LAN nadal wymaga włączonego dołączonego Pluginu `bonjour`.
- `off`: wyłącza rozgłaszanie multicastowe w LAN bez zmiany włączenia Pluginu.
- Dołączony Plugin `bonjour` uruchamia się automatycznie na hostach macOS, a na Linuksie, Windowsie i skonteneryzowanych wdrożeniach Gateway wymaga jawnego włączenia.
- Nazwa hosta domyślnie używa systemowej nazwy hosta, gdy jest poprawną etykietą DNS, w przeciwnym razie używa `openclaw`. Nadpisz ją za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Szeroki obszar (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD pod `~/.openclaw/dns/`. Do wykrywania między sieciami połącz to z serwerem DNS (zalecany CoreDNS) + dzielonym DNS Tailscale.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (wbudowane zmienne env)

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

- Wbudowane zmienne env są stosowane tylko wtedy, gdy w środowisku procesu brakuje danego klucza.
- Pliki `.env`: `.env` w CWD + `~/.openclaw/.env` (żaden z nich nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Pełną kolejność pierwszeństwa opisuje sekcja [Środowisko](/pl/help/environment).

### Podstawianie zmiennych env

Odwołuj się do zmiennych env w dowolnym ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy zapisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd podczas wczytywania konfiguracji.
- Użyj `$${VAR}`, aby uzyskać literał `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: wartości tekstowe nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- Wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Wzorzec `id` dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` dla `source: "file"`: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- Wzorzec `id` dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Identyfikatory `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielonych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwany zakres poświadczeń

- Kanoniczna macierz: [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` obsługuje docelowe ścieżki poświadczeń `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględniane w rozwiązywaniu w czasie wykonywania i w zakresie audytu.

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

- Dostawca `file` obsługuje `mode: "json"` i `mode: "singleValue"` (`id` musi mieć wartość `"value"` w trybie singleValue).
- Ścieżki dostawców file i exec kończą się odmową, gdy weryfikacja ACL systemu Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące symlinkami są odrzucane. Ustaw `allowSymlinkCommand: true`, aby dopuścić ścieżki symlinków przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu dotyczy rozwiązanej ścieżki docelowej.
- Środowisko procesu potomnego `exec` jest domyślnie minimalne; wymagane zmienne przekaż jawnie za pomocą `passEnv`.
- Odwołania do sekretów są rozwiązywane podczas aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują wyłącznie tę migawkę.
- Filtrowanie aktywnego zakresu działa podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują niepowodzenie uruchomienia/przeładowania, a nieaktywne powierzchnie są pomijane z diagnostyką.

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

- Profile per agenta są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) w statycznych trybach poświadczeń.
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem czasu wykonywania; `openclaw doctor --fix` przepisuje je na kanoniczne profile klucza API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu auth opartych na SecretRef.
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

- `billingBackoffHours`: bazowy czas wycofania w godzinach, gdy profil zawiedzie z powodu rzeczywistych błędów rozliczeń/niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń nadal może trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia albo limitu wydatków organizacji/przestrzeni roboczej pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin wycofania rozliczeniowego dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu wycofania rozliczeniowego (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy czas wycofania w minutach dla błędów `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu wycofania `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: kroczące okno w godzinach używane dla liczników wycofania (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania u tego samego dostawcy dla błędów przeciążenia przed przełączeniem na awaryjny model (domyślnie: `1`). Kształty zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania u tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na awaryjny model (domyślnie: `1`). Ten zasobnik limitu szybkości obejmuje tekst w kształcie dostawcy, taki jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

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
- `consoleLevel` zwiększa się do `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku.
- `redactSensitive` / `redactPatterns`: najlepsze możliwe maskowanie danych dla wyjścia konsoli, plików dziennika, rekordów dziennika OTLP i utrwalonego tekstu transkryptu sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkryptów; powierzchnie bezpieczeństwa UI/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

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
- `flags`: tablica ciągów flag włączających ukierunkowane wyjście dziennika (obsługuje symbole wieloznaczne, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku bez postępu w ms do klasyfikowania długotrwałych sesji przetwarzania jako `session.long_running`, `session.stalled` lub `session.stuck`. Odpowiedź, narzędzie, status, blok i postęp ACP resetują licznik; powtarzane diagnostyki `session.stuck` wycofują się, gdy stan się nie zmienia.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: adres URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne punkty końcowe OTLP specyficzne dla sygnałów. Gdy są ustawione, nadpisują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącz eksport śladów, metryk lub dzienników.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`–`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów zakresu OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje treść wiadomości/narzędzi niesystemowych; forma obiektowa pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` i `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszych eksperymentalnych atrybutów dostawcy zakresów GenAI. Domyślnie zakresy zachowują starszy atrybut `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do Plugin, zachowując aktywne nasłuchiwacze diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe punktów końcowych specyficznych dla sygnałów, używane, gdy pasujący klucz konfiguracji nie jest ustawiony.
- `cacheTrace.enabled`: zapisuj migawki śledzenia pamięci podręcznej dla osadzonych uruchomień (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śledzenia pamięci podręcznej (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w wyjściu śledzenia pamięci podręcznej (wszystkie domyślnie: `true`).

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
- `checkOnStart`: sprawdź aktualizacje npm po uruchomieniu Gateway (domyślnie: `true`).
- `auto.enabled`: włącz automatyczną aktualizację w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem w kanale stabilnym (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrożenia w kanale stabilnym w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często kontrole kanału beta uruchamiają się w godzinach (domyślnie: `1`; maks.: `24`).

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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć wysyłanie ACP i elementy tworzenia sesji).
- `dispatch.enabled`: niezależna bramka dla wysyłania tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP przy blokowaniu wykonania.
- `backend`: domyślny identyfikator backendu środowiska uruchomieniowego ACP (musi pasować do zarejestrowanego Plugin środowiska uruchomieniowego ACP).
  Najpierw zainstaluj Plugin backendu, a jeśli ustawiono `plugins.allow`, uwzględnij identyfikator Plugin backendu (na przykład `acpx`), inaczej backend ACP się nie załaduje.
- `defaultAgent`: awaryjny identyfikator agenta docelowego ACP, gdy tworzone sesje nie określają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych do sesji środowiska uruchomieniowego ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania bezczynności w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłum powtarzane wiersze statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do końcowych zdarzeń tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowana na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych wierszy statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów na logiczne nadpisania widoczności dla strumieniowanych zdarzeń.
- `runtime.ttlMinutes`: czas TTL bezczynności w minutach dla workerów sesji ACP przed kwalifikacją do czyszczenia.
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
  - `"off"`: brak tekstu sloganu (tytuł/wersja banera nadal są wyświetlane).
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

Zobacz pola tożsamości `agents.list` w sekcji [Domyślne ustawienia agentów](/pl/gateway/config-agents#agent-defaults).

---

## Most (starszy, usunięty)

Bieżące kompilacje nie zawierają już mostu TCP. Nodes łączą się przez WebSocket Gateway. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się niepowodzeniem, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: jak długo przechowywać ukończone izolowane sesje uruchomień Cron przed przycięciem z `sessions.json`. Kontroluje też czyszczenie zarchiwizowanych usuniętych transkryptów Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pojedynczego pliku dziennika uruchomienia (`cron/runs/<jobId>.jsonl`) przed przycięciem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze zachowywane po uruchomieniu przycinania dziennika uruchomienia. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST Webhook Cron (`delivery.mode = "webhook"`); jeśli pominięty, nagłówek uwierzytelniania nie jest wysyłany.
- `webhook`: przestarzały starszy awaryjny adres URL Webhook (http/https) używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

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
- `backoffMs`: tablica opóźnień wycofywania w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1–10 wpisów).
- `retryOn`: typy błędów uruchamiające ponowienia — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

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

- `enabled`: włącz alerty o niepowodzeniach dla zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed uruchomieniem alertu (dodatnia liczba całkowita, min.: `1`).
- `cooldownMs`: minimalna liczba milisekund między ponownymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: wliczaj kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone osobno i nie wpływają na wycofywanie po błędach wykonania.
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhook.
- `accountId`: opcjonalny identyfikator konta lub kanału do ograniczenia zakresu dostarczania alertów.

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

- Domyślny cel powiadomień o niepowodzeniach Cron dla wszystkich zadań.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająco dużo danych celu.
- `channel`: nadpisanie kanału dla dostarczania typu announce. `"last"` używa ponownie ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce lub URL Webhook. Wymagane w trybie Webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- Ustawienie `delivery.failureDestination` na poziomie zadania zastępuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani zadaniowego celu niepowodzeń, zadania, które już dostarczają przez `announce`, w razie niepowodzenia wracają do tego podstawowego celu announce.
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
| `{{MediaUrl}}`     | Pseudo-URL przychodzących multimediów             |
| `{{MediaPath}}`    | Lokalna ścieżka multimediów                       |
| `{{MediaType}}`    | Typ multimediów (obraz/audio/dokument/…)          |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt multimediów dla wpisów CLI      |
| `{{MaxChars}}`     | Rozwiązana maks. liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (w miarę możliwości)                  |
| `{{GroupMembers}}` | Podgląd członków grupy (w miarę możliwości)       |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (w miarę możliwości)    |
| `{{SenderE164}}`   | Numer telefonu nadawcy (w miarę możliwości)       |
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
- Klucze równorzędne: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać w katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy.
- Zapisy zarządzane przez OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu opartą na dołączeniu pojedynczego pliku, są zapisywane do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami kluczy równorzędnych są tylko do odczytu dla zapisów zarządzanych przez OpenClaw; takie zapisy kończą się zamkniętym niepowodzeniem zamiast spłaszczać konfigurację.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania i cyklicznych dołączeń.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
