---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Walidujesz bloki konfiguracji kanału, modelu, gateway lub narzędzia
summary: Dokumentacja konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i linków do dedykowanych dokumentacji podsystemów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-04-24T09:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Podstawowa dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Aby uzyskać przegląd zorientowany na zadania, zobacz [Konfiguracja](/pl/gateway/configuration).

Ta strona obejmuje główne powierzchnie konfiguracji OpenClaw i prowadzi do osobnych stron, gdy dany podsystem ma własną głębszą dokumentację. **Nie** próbuje wstawiać na jednej stronie każdego katalogu poleceń należącego do kanału/Pluginu ani każdego głębokiego ustawienia pamięci/QMD.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktywny JSON Schema używany do walidacji i interfejsu Control UI, z dołączonymi metadanymi Pluginów/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują hash baseline dokumentacji konfiguracji względem bieżącej powierzchni schematu

Dedykowane głębokie dokumentacje:

- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji Dreaming w `plugins.entries.memory-core.config.dreaming`
- [Polecenia Slash](/pl/tools/slash-commands) dla bieżącego katalogu poleceń wbudowanych + dołączonych
- strony właścicieli kanałów/Pluginów dla powierzchni poleceń specyficznych dla kanałów

Format konfiguracji to **JSON5** (dozwolone komentarze + końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy są pominięte.

---

## Kanały

Klucze konfiguracji per kanał zostały przeniesione na osobną stronę — zobacz
[Konfiguracja — kanały](/pl/gateway/config-channels) dla `channels.*`,
w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych
dołączonych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Domyślne ustawienia agentów, multi-agent, sesje i wiadomości

Przeniesione na osobną stronę — zobacz
[Konfiguracja — agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (obszar roboczy, model, thinking, Heartbeat, pamięć, multimedia, Skills, sandbox)
- `multiAgent.*` (routing i powiązania multi-agent)
- `session.*` (cykl życia sesji, Compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie Markdown)
- `talk.*` (tryb Talk)
  - `talk.silenceTimeoutMs`: gdy nieustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkryptu (`700 ms na macOS i Android, 900 ms na iOS`)

## Narzędzia i niestandardowi providerzy

Zasady narzędzi, przełączniki eksperymentalne, konfiguracja narzędzi oparta na providerach oraz konfiguracja niestandardowych
providerów / base-URL zostały przeniesione na osobną stronę — zobacz
[Konfiguracja — narzędzia i niestandardowi providerzy](/pl/gateway/config-tools).

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub ciąg plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna lista dozwolonych tylko dla dołączonych Skills (zarządzane/obszaru roboczego Skills pozostają bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne Skills (najniższy priorytet).
- `install.preferBrew`: gdy `true`, preferuj instalatory Homebrew, gdy `brew` jest
  dostępne, zanim nastąpi fallback do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza Skill, nawet jeśli jest dołączona/zainstalowana.
- `entries.<skillKey>.apiKey`: pole wygodne dla Skills deklarujących podstawową zmienną środowiskową (ciąg plaintext lub obiekt SecretRef).

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
- Wykrywanie akceptuje natywne Pluginy OpenClaw oraz kompatybilne bundle Codex i Claude, w tym bundle Claude bez manifestu w domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu gateway.**
- `allow`: opcjonalna lista dozwolonych (ładują się tylko wymienione Pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie Pluginu (gdy obsługiwane przez Plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych ograniczona do Pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola mutujące prompt ze starszego `before_agent_start`, zachowując starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków Pluginów oraz obsługiwanych katalogów hooków dostarczanych przez bundle.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu Pluginowi, że może żądać nadpisań `provider` i `model` dla pojedynczego uruchomienia tła subagenta.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Używaj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez Plugin (walidowany przez schemat natywnego Pluginu OpenClaw, gdy jest dostępny).
- `plugins.entries.firecrawl.config.webFetch`: ustawienia providera web-fetch Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Wraca do `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` lub zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`).
  - `onlyMainContent`: wyodrębnij tylko główną treść stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek cache w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie WWW Grok).
  - `enabled`: włącza providera X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik Dreaming (domyślnie `false`).
  - `frequency`: kadencja Cron dla każdego pełnego przebiegu Dreaming (domyślnie `"0 3 * * *"`).
  - zasady faz i progi są szczegółami implementacyjnymi (nie są kluczami konfiguracji skierowanymi do użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Dokumentacji konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone Pluginy bundle Claude mogą również dostarczać osadzone domyślne ustawienia Pi z `settings.json`; OpenClaw stosuje je jako zsanityzowane ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybiera identyfikator aktywnego Pluginu pamięci albo `"none"`, aby wyłączyć Pluginy pamięci.
- `plugins.slots.contextEngine`: wybiera identyfikator aktywnego Pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.
- `plugins.installs`: metadane instalacji zarządzane przez CLI, używane przez `openclaw plugins update`.
  - Obejmuje `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Traktuj `plugins.installs.*` jako stan zarządzany; preferuj polecenia CLI zamiast ręcznych edycji.

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
      // dangerouslyAllowPrivateNetwork: true, // włączaj tylko dla zaufanego dostępu do sieci prywatnej
      // allowPrivateNetwork: true, // starszy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nieustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki do sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie restrykcyjnym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do podłączania (start/stop/reset są wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrył `/json/version`; użyj WS(S),
  gdy provider daje bezpośredni URL WebSocket DevTools.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą się podłączać na
  wybranym hoście lub przez podłączony Node przeglądarki.
- Profile `existing-session` mogą ustawiać `userDataDir`, aby kierować na konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` zachowują bieżące ograniczenia trasy Chrome MCP:
  akcje oparte na snapshot/ref zamiast kierowania selektorami CSS, hooki uploadu jednego pliku,
  brak nadpisań limitu czasu dla okien dialogowych, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań i akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; jawnie
  ustawiaj `cdpUrl` tylko dla zdalnego CDP.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Usługa sterowania: tylko loopback (port wyprowadzany z `gateway.port`, domyślnie `18791`).
- `extraArgs` dopisuje dodatkowe flagi uruchamiania do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, krótki tekst, URL obrazu lub data URI
    },
  },
}
```

- `seamColor`: kolor akcentu dla chromu natywnego UI aplikacji (odcień bąbelka trybu Talk itd.).
- `assistant`: nadpisanie tożsamości interfejsu Control. Wraca do tożsamości aktywnego agenta.

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
      // password: "your-password", // lub OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // dla mode=trusted-proxy; zobacz /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // niebezpieczne: zezwalaj na absolutne zewnętrzne URL-e osadzeń http(s)
      // allowedOrigins: ["https://control.example.com"], // wymagane dla interfejsu Control spoza loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // niebezpieczny tryb fallbacku origin na podstawie nagłówka Host
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
    // Opcjonalne. Domyślnie false.
    allowRealIpFallback: false,
    tools: {
      // Dodatkowe blokady HTTP /tools/invoke
      deny: ["browser"],
      // Usuń narzędzia z domyślnej listy blokad HTTP
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

- `mode`: `local` (uruchom gateway) lub `remote` (połącz się ze zdalnym gateway). Gateway odmawia uruchomienia, jeśli nie jest ustawione `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Pierwszeństwo: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga o Dockerze**: domyślny bind `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowej Docker (`-p 18789:18789`) ruch przychodzi na `eth0`, więc gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Auth**: domyślnie wymagane. Powiązania inne niż loopback wymagają auth gateway. W praktyce oznacza to współdzielony token/hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator onboard domyślnie generuje token.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRef-y), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Uruchamianie oraz przepływy instalacji/naprawy usługi kończą się błędem, gdy skonfigurowane są oba, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez auth. Używaj tylko dla zaufanych lokalnych konfiguracji loopback; ta opcja celowo nie jest oferowana w promptach onboard.
- `gateway.auth.mode: "trusted-proxy"`: deleguje auth do reverse proxy świadomego tożsamości i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)). Ten tryb oczekuje źródła proxy **spoza loopback**; reverse proxy na tym samym hoście działające na loopback nie spełniają wymagań auth trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełniać auth interfejsu Control UI/WebSocket (weryfikowane przez `tailscale whois`). Punkty końcowe HTTP API **nie** używają tego auth nagłówków Tailscale; zamiast tego podążają za zwykłym trybem auth HTTP gateway. Ten przepływ bez tokenu zakłada, że host gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanych prób auth. Stosowany per IP klienta i per zakres auth (współdzielony sekret i token urządzenia są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - W asynchronicznej ścieżce interfejsu Control UI Tailscale Serve nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem błędu. Równoczesne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu zamiast przepuścić oba jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz również ograniczać ruchem localhost (dla konfiguracji testowych lub restrykcyjnych wdrożeń proxy).
- Próby auth WS pochodzące z origin przeglądarki są zawsze dławione z wyłączonym zwolnieniem dla loopback (defense-in-depth przed brute force localhost z poziomu przeglądarki).
- Na loopback blokady pochodzące z origin przeglądarki są izolowane per znormalizowana
  wartość `Origin`, więc powtarzające się błędy z jednego origin localhost nie blokują automatycznie
  innego origin.
- `tailscale.mode`: `serve` (tylko tailnet, bind na loopback) lub `funnel` (publiczny, wymaga auth).
- `controlUi.allowedOrigins`: jawna lista dozwolonych origin przeglądarki dla połączeń Gateway WebSocket. Wymagana, gdy oczekiwani są klienci przeglądarkowi spoza origin loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza fallback origin na podstawie nagłówka Host dla wdrożeń celowo opierających się na polityce origin z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct`, `remote.url` musi mieć schemat `ws://` lub `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: przełomowe nadpisanie po stronie klienta w zmiennych środowiskowych procesu,
  które zezwala na jawnotekstowe `ws://` do zaufanych adresów IP sieci prywatnej;
  domyślnie jawny tekst pozostaje dozwolony tylko dla loopback. Nie ma odpowiednika w `openclaw.json`,
  a konfiguracja prywatnej sieci przeglądarki, taka jak
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, nie wpływa na klientów
  Gateway WebSocket.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same w sobie nie konfigurują auth gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy HTTPS URL zewnętrznego relay APNs używanego przez oficjalne/TestFlight kompilacje iOS po opublikowaniu przez nie rejestracji opartych na relay do gateway. Ten URL musi odpowiadać URL relay wkompilowanemu w kompilację iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłki z gateway do relay w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na relay są delegowane do konkretnej tożsamości gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji relay i przekazuje do gateway uprawnienie wysyłki ograniczone do tej rejestracji. Inny gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania środowiskowe dla powyższej konfiguracji relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyłącznie deweloperska furtka dla URL-i relay HTTP na loopback. Produkcyjne URL-e relay powinny pozostać na HTTPS.
- `gateway.channelHealthCheckMinutes`: interwał monitora stanu kanałów w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora stanu. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieświeżego gniazda w minutach. Zachowaj wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora stanu na kanał/konto w ruchomej godzinie. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja per kanał z restartów monitora stanu przy zachowaniu globalnego monitora.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy jest ustawione, ma pierwszeństwo nad nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań gateway mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozstrzygnięte, rozstrzyganie kończy się odmową w trybie fail-closed (bez maskującego fallbacku do zdalnego).
- `trustedProxies`: adresy IP reverse proxy, które kończą TLS lub wstrzykują nagłówki klienta przekazywanego dalej. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są poprawne dla konfiguracji wykrywania lokalnego/proxy na tym samym hoście (na przykład Tailscale Serve albo lokalne reverse proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę blokad).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy blokad HTTP.

</Accordion>

### Punkty końcowe zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Utwardzanie wejścia URL dla Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste allowlisty są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false`
    i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL.
- Opcjonalny nagłówek utwardzania odpowiedzi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla kontrolowanych przez siebie origin HTTPS; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele gateway na jednym hoście z unikalnymi portami i katalogami stanu:

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

- `enabled`: włącza terminację TLS na listenerze gateway (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną parę self-signed cert/key, gdy jawne pliki nie są skonfigurowane; tylko do użytku lokalnego/deweloperskiego.
- `certPath`: ścieżka systemu plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka systemu plików do pliku klucza prywatnego TLS; zachowaj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka do pakietu CA dla weryfikacji klienta lub niestandardowych łańcuchów zaufania.

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

- `mode`: kontroluje sposób stosowania edycji konfiguracji w runtime.
  - `"off"`: ignoruj edycje na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuj proces gateway przy zmianie konfiguracji.
  - `"hot"`: stosuj zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw spróbuj hot reload; jeśli to konieczne, wróć do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu (domyślnie: `300000` = 5 minut).

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
        messageTemplate: "Od: {{messages[0].from}}\nTemat: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` lub `x-openclaw-token: <token>`.
Tokeny hooków w query string są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` musi być **różne** od `gateway.auth.token`; ponowne użycie tokenu Gateway jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowań nie wymagają tego jawnego włączenia.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z ładunku żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozstrzygane przez `hooks.mappings`
  - Wartości `sessionKey` renderowane z szablonów w mapowaniach są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Szczegóły mapowań">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole ładunku dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z ładunku.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostawać w obrębie `hooks.transformsDir` (ścieżki absolutne i traversal są odrzucane).
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do wartości domyślnej.
- `allowedAgentIds`: ogranicza jawny routing (`*` lub pominięte = zezwól na wszystkie, `[]` = zablokuj wszystkie).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień hook agenta bez jawnego `sessionKey`.
- `allowRequestSessionKey`: pozwala wywołującym `/hooks/agent` i kluczom sesji z mapowań opartych na szablonach ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy jakiekolwiek mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz ten routing per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowały do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast szablonowej wartości domyślnej.

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

- Gateway automatycznie uruchamia `gog gmail watch serve` przy starcie, gdy jest skonfigurowany. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby to wyłączyć.
- Nie uruchamiaj osobnego `gog gmail watch serve` równolegle z Gateway.

---

## Host canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // lub OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Udostępnia przez HTTP pod portem Gateway edytowalne przez agenta HTML/CSS/JS i A2UI:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: pozostaw `gateway.bind: "loopback"` (domyślnie).
- Powiązania inne niż loopback: trasy canvas wymagają auth Gateway (token/hasło/trusted-proxy), tak samo jak inne powierzchnie HTTP Gateway.
- WebView Node zwykle nie wysyłają nagłówków auth; po sparowaniu i podłączeniu Node Gateway ogłasza adresy URL capability ograniczone do Node dla dostępu do canvas/A2UI.
- Adresy URL capability są powiązane z aktywną sesją WS Node i szybko wygasają. Fallback oparty na IP nie jest używany.
- Wstrzykuje klienta live-reload do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Udostępnia też A2UI pod `/__openclaw__/a2ui/`.
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

- `minimal` (domyślnie): pomija `cliPath` + `sshPort` z rekordów TXT.
- `full`: uwzględnia `cliPath` + `sshPort`.
- Domyślna nazwa hosta to `openclaw`. Nadpisz przez `OPENCLAW_MDNS_HOSTNAME`.

### Szerokoobszarowe (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD w `~/.openclaw/dns/`. W przypadku wykrywania między sieciami połącz to z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

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
- Pliki `.env`: `.env` bieżącego katalogu roboczego + `~/.openclaw/.env` (żaden z nich nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Zobacz [Środowisko](/pl/help/environment), aby poznać pełne pierwszeństwo.

### Podstawianie zmiennych środowiskowych

Odwołuj się do zmiennych środowiskowych w dowolnym ciągu konfiguracji przez `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd przy ładowaniu konfiguracji.
- Ucieknij jako `$${VAR}`, aby uzyskać dosłowne `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania SecretRef są addytywne: wartości plaintext nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- wzorzec `id` dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` dla `source: "file"`: absolutny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- wzorzec `id` dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` dla `source: "exec"` nie może zawierać segmentów ścieżki rozdzielanych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Kanoniczna macierz: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` kieruje się na obsługiwane ścieżki poświadczeń `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględniane w rozstrzyganiu runtime i pokryciu audytu.

### Konfiguracja providerów sekretów

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // opcjonalny jawny provider env
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

- Provider `file` obsługuje `mode: "json"` oraz `mode: "singleValue"` (`id` musi mieć wartość `"value"` w trybie singleValue).
- Ścieżki providerów file i exec kończą się odmową w trybie fail-closed, gdy weryfikacja ACL Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Provider `exec` wymaga absolutnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące dowiązaniami symbolicznymi są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki dowiązań symbolicznych przy jednoczesnej walidacji rozstrzygniętej ścieżki celu.
- Jeśli skonfigurowano `trustedDirs`, kontrola zaufanych katalogów ma zastosowanie do rozstrzygniętej ścieżki celu.
- Środowisko potomne `exec` jest domyślnie minimalne; wymagane zmienne przekaż jawnie przez `passEnv`.
- Odwołania SecretRef są rozstrzygane podczas aktywacji do snapshotu w pamięci, a ścieżki żądań odczytują już tylko ten snapshot.
- Filtrowanie aktywnej powierzchni ma zastosowanie podczas aktywacji: nierozstrzygnięte odwołania na włączonych powierzchniach powodują błąd startu/przeładowania, podczas gdy nieaktywne powierzchnie są pomijane z diagnostyką.

---

## Magazyn auth

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

- Profile per agent są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu auth opartych na SecretRef.
- Statyczne poświadczenia runtime pochodzą z rozstrzygniętych snapshotów w pamięci; starsze statyczne wpisy `auth.json` są scrubowane po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie runtime sekretów oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

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

- `billingBackoffHours`: bazowy backoff w godzinach, gdy profil zawiedzie z powodu rzeczywistych
  błędów rozliczeniowych/braku środków (domyślnie: `5`). Jawny tekst billingowy może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu
  specyficzne dla providera pozostają ograniczone do providera, do którego należą (na przykład OpenRouter
  `Key limit exceeded`). Odpowiedzi `402` nadające się do ponowienia, dotyczące okna użycia lub
  limitów wydatków organizacji/obszaru roboczego, pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin backoffu billingowego per provider.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu backoffu billingowego (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy backoff w minutach dla błędów `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu backoffu `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: ruchome okno w godzinach używane przez liczniki backoffu (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji auth-profilu u tego samego providera dla błędów przeciążenia przed przełączeniem na fallback modelu (domyślnie: `1`). Kształty zajętości providera, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego providera/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji auth-profilu u tego samego providera dla błędów limitu szybkości przed przełączeniem na fallback modelu (domyślnie: `1`). Ten koszyk rate-limit obejmuje teksty w kształcie providera, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

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

- Domyślny plik logu: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Ustaw `logging.file`, aby uzyskać stałą ścieżkę.
- `consoleLevel` podbija się do `debug`, gdy używane jest `--verbose`.
- `maxFileBytes`: maksymalny rozmiar pliku logu w bajtach, po którym zapisy są wstrzymywane (dodatnia liczba całkowita; domyślnie: `524288000` = 500 MB). W środowiskach produkcyjnych używaj zewnętrznej rotacji logów.

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
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
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
- `flags`: tablica ciągów flag włączających ukierunkowane dane wyjściowe logów (obsługuje wildcardy takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku w ms dla emitowania ostrzeżeń o zablokowanej sesji, gdy sesja pozostaje w stanie przetwarzania.
- `otel.enabled`: włącza pipeline eksportu OpenTelemetry (domyślnie: `false`).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włączają eksport śladów, metryk lub logów.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`–`1`.
- `otel.flushIntervalMs`: okresowy interwał flush telemetrii w ms.
- `cacheTrace.enabled`: zapisuje snapshoty śladów cache dla uruchomień osadzonych (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla cache trace JSONL (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w danych wyjściowych cache trace (wszystkie domyślnie: `true`).

---

## Aktualizowanie

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

- `channel`: kanał wydań dla instalacji npm/git — `"stable"`, `"beta"` lub `"dev"`.
- `checkOnStart`: sprawdza aktualizacje npm przy starcie gateway (domyślnie: `true`).
- `auto.enabled`: włącza aktualizacje automatyczne w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem dla kanału stable (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozproszenia wdrożenia kanału stable w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często uruchamiane są kontrole kanału beta w godzinach (domyślnie: `1`; maks.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `false`).
- `dispatch.enabled`: niezależna bramka dla dispatchu tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby pozostawić dostępne polecenia ACP przy jednoczesnym blokowaniu wykonania.
- `backend`: identyfikator domyślnego backendu runtime ACP (musi odpowiadać zarejestrowanemu Pluginowi runtime ACP).
- `defaultAgent`: zapasowy identyfikator docelowego agenta ACP, gdy spawny nie podają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych do sesji runtime ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżnienia bezczynności w ms dla streamowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem streamowanej projekcji bloku.
- `stream.repeatSuppression`: tłumi powtarzające się linie statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` streamuje przyrostowo; `"final_only"` buforuje aż do zdarzeń terminalnych tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków danych wyjściowych asystenta rzutowanych na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla rzutowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord mapujący nazwy tagów na nadpisania widoczności bool dla streamowanych zdarzeń.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla workerów sesji ACP przed kwalifikacją do czyszczenia.
- `runtime.installCommand`: opcjonalne polecenie instalacyjne uruchamiane podczas bootstrapowania środowiska runtime ACP.

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

- `cli.banner.taglineMode` kontroluje styl tagline bannera:
  - `"random"` (domyślnie): rotujące zabawne/sezonowe tagline.
  - `"default"`: stały neutralny tagline (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu tagline (tytuł/wersja bannera nadal są pokazywane).
- Aby ukryć cały banner (nie tylko tagline), ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

Zobacz pola tożsamości `agents.list` w [Domyślnych ustawieniach agentów](/pl/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, usunięte)

Bieżące kompilacje nie zawierają już TCP bridge. Node łączą się przez Gateway WebSocket. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się błędem, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja bridge (dokumentacja historyczna)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // przestarzały fallback dla zapisanych zadań notify:true
    webhookToken: "replace-with-dedicated-token", // opcjonalny token bearer dla auth wychodzących Webhooków
    sessionRetention: "24h", // ciąg duration lub false
    runLog: {
      maxBytes: "2mb", // domyślnie 2_000_000 bajtów
      keepLines: 2000, // domyślnie 2000
    },
  },
}
```

- `sessionRetention`: jak długo przechowywać ukończone izolowane sesje uruchomień cron przed usunięciem z `sessions.json`. Kontroluje również czyszczenie zarchiwizowanych usuniętych transkryptów cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pliku logu pojedynczego uruchomienia (`cron/runs/<jobId>.jsonl`) przed przycięciem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: liczba najnowszych linii zachowywanych po uruchomieniu przycinania logu uruchomienia. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST Webhooków cron (`delivery.mode = "webhook"`); jeśli pominięty, nie jest wysyłany nagłówek auth.
- `webhook`: przestarzały starszy fallback URL Webhooka (http/https), używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

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

Dotyczy tylko jednorazowych zadań cron. Zadania cykliczne używają oddzielnej obsługi błędów.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: włącza alerty błędów dla zadań cron (domyślnie: `false`).
- `after`: liczba kolejnych błędów, po której zostaje wysłany alert (dodatnia liczba całkowita, min.: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzającymi się alertami dla tego samego zadania (nieujemna liczba całkowita).
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanałową; `"webhook"` wysyła POST do skonfigurowanego Webhooka.
- `accountId`: opcjonalny identyfikator konta lub kanału ograniczający dostarczanie alertu.

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

- Domyślny cel dla powiadomień o błędach cron we wszystkich zadaniach.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająca ilość danych celu.
- `channel`: nadpisanie kanału dla dostarczania announce. `"last"` używa ponownie ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce lub URL Webhooka. Wymagane w trybie webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- Per-zadaniowe `delivery.failureDestination` nadpisuje tę globalną wartość domyślną.
- Gdy nie jest ustawiony ani globalny, ani per-zadaniowy cel błędu, zadania, które już dostarczają przez `announce`, wracają przy błędzie do tego podstawowego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że podstawowe `delivery.mode` zadania ma wartość `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonów modelu mediów

Placeholdery szablonów rozwijane w `tools.media.models[].args`:

| Zmienna           | Opis                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Pełna treść przychodzącej wiadomości              |
| `{{RawBody}}`     | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}`| Treść z usuniętymi wzmiankami grupowymi           |
| `{{From}}`        | Identyfikator nadawcy                             |
| `{{To}}`          | Identyfikator celu                                |
| `{{MessageSid}}`  | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`   | UUID bieżącej sesji                               |
| `{{IsNewSession}}`| `"true"` po utworzeniu nowej sesji                |
| `{{MediaUrl}}`    | Pseudo-URL przychodzących multimediów             |
| `{{MediaPath}}`   | Lokalna ścieżka multimediów                       |
| `{{MediaType}}`   | Typ multimediów (image/audio/document/…)          |
| `{{Transcript}}`  | Transkrypt audio                                  |
| `{{Prompt}}`      | Rozstrzygnięty prompt multimediów dla wpisów CLI  |
| `{{MaxChars}}`    | Rozstrzygnięta maksymalna liczba znaków wyjściowych dla wpisów CLI |
| `{{ChatType}}`    | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}`| Temat grupy (best effort)                         |
| `{{GroupMembers}}`| Podgląd członków grupy (best effort)              |
| `{{SenderName}}`  | Wyświetlana nazwa nadawcy (best effort)           |
| `{{SenderE164}}`  | Numer telefonu nadawcy (best effort)              |
| `{{Provider}}`    | Wskazówka providera (whatsapp, telegram, discord itd.) |

---

## Include konfiguracji (`$include`)

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

- Pojedynczy plik: zastępuje zawierający obiekt.
- Tablica plików: głębokie scalanie w podanej kolejności (późniejsze nadpisują wcześniejsze).
- Klucze sąsiednie: scalane po include (nadpisują dołączone wartości).
- Zagnieżdżone include: maksymalnie do 10 poziomów głębokości.
- Ścieżki: rozstrzygane względem pliku dołączającego, ale muszą pozostawać wewnątrz katalogu głównego konfiguracji (`dirname` pliku `openclaw.json`). Formy absolutne/`../` są dozwolone tylko wtedy, gdy nadal rozstrzygają się w obrębie tej granicy.
- Zapisy zarządzane przez OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu wspieraną przez include pojedynczego pliku, są zapisywane bezpośrednio do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Include w katalogu głównym, tablice include i include z nadpisaniami sąsiednimi są tylko do odczytu dla zapisów zarządzanych przez OpenClaw; takie zapisy kończą się odmową w trybie fail-closed zamiast spłaszczać konfigurację.
- Błędy: czytelne komunikaty dla brakujących plików, błędów parsowania i cyklicznych include.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
