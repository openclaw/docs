---
read_when:
    - Sie benötigen exakte Konfigurationssemantik oder Standardwerte auf Feldebene
    - Sie validieren Konfigurationsblöcke für Kanäle, Modelle, Gateway oder Tools
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystemreferenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-05-07T13:16:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referenz zur Kernkonfiguration für `~/.openclaw/openclaw.json`. Einen aufgabenorientierten Überblick finden Sie unter [Konfiguration](/de/gateway/configuration).

Deckt die wichtigsten OpenClaw-Konfigurationsflächen ab und verlinkt auf weiterführende Referenzen, wenn ein Subsystem eine eigene detailliertere Referenz hat. Channel- und Plugin-eigene Befehlskataloge sowie tiefe Speicher-/QMD-Regler befinden sich auf eigenen Seiten statt auf dieser.

Code-Wahrheit:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird, wobei gebündelte/Plugin-/Channel-Metadaten zusammengeführt werden, wenn verfügbar
- `config.schema.lookup` gibt einen pfadbezogenen Schemaknoten für Drilldown-Werkzeuge zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schemafläche

Agent-Suchpfad: Verwenden Sie die `gateway`-Tool-Aktion `config.schema.lookup` für
exakte Dokumentation und Einschränkungen auf Feldebene vor Änderungen. Verwenden Sie
[Konfiguration](/de/gateway/configuration) für aufgabenorientierte Anleitungen und diese Seite
für die umfassendere Feldübersicht, Standardwerte und Links zu Subsystemreferenzen.

Eigene Detailreferenzen:

- [Referenz zur Speicherkonfiguration](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Channel-/Plugin-Seiten für channelspezifische Befehlsflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas erlaubt). Alle Felder sind optional - OpenClaw verwendet sichere Standardwerte, wenn sie ausgelassen werden.

---

## Channels

Channel-spezifische Konfigurationsschlüssel wurden auf eine eigene Seite verschoben - siehe
[Konfiguration - Channels](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Channels (Authentifizierung, Zugriffskontrolle, Mehrfachkonten, Mention-Gating).

## Agent-Standardwerte, Multi-Agent, Sitzungen und Nachrichten

Auf eine eigene Seite verschoben - siehe
[Konfiguration - Agents](/de/gateway/config-agents) für:

- `agents.defaults.*` (Arbeitsbereich, Modell, Denken, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindungen)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.speechLocale`: optionale BCP-47-Locale-ID für die Talk-Spracherkennung unter iOS/macOS
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, behält Talk das standardmäßige Pausenfenster der Plattform bei, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools und benutzerdefinierte Provider

Tool-Richtlinie, experimentelle Umschalter, Provider-gestützte Tool-Konfiguration und Einrichtung
benutzerdefinierter Provider / Basis-URLs wurden auf eine eigene Seite verschoben - siehe
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Modelle

Provider-Definitionen, Modell-Allowlists und die Einrichtung benutzerdefinierter Provider befinden sich in
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls).
Der `models`-Root ist außerdem für globales Modellkatalog-Verhalten zuständig.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: Provider-Katalogverhalten (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID geschlüsselt.
- `models.pricing.enabled`: steuert den Hintergrund-Preis-Bootstrap, der
  startet, nachdem Sidecars und Channels den Gateway-Bereitschaftspfad erreicht haben. Wenn `false`,
  überspringt der Gateway OpenRouter- und LiteLLM-Preis-Katalogabrufe; konfigurierte
  `models.providers.*.models[].cost`-Werte funktionieren weiterhin für lokale Kostenschätzungen.

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
von eingebettetem Pi und anderen Runtime-Adaptern verwendet. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne sich während Konfigurationsänderungen
mit dem Zielserver zu verbinden.

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

- `mcp.servers`: benannte stdio- oder Remote-MCP-Serverdefinitionen für Runtimes, die
  konfigurierte MCP-Tools bereitstellen.
  Remote-Einträge verwenden `transport: "streamable-http"` oder `transport: "sse"`;
  `type: "http"` ist ein CLI-nativer Alias, den `openclaw mcp set` und
  `openclaw doctor --fix` in das kanonische Feld `transport` normalisieren.
- `mcp.sessionIdleTtlMs`: Leerlauf-TTL für sitzungsbezogene gebündelte MCP-Runtimes.
  Einmalige eingebettete Ausführungen fordern eine Bereinigung am Laufende an; diese TTL ist die Absicherung für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden per Hot-Apply angewendet, indem zwischengespeicherte Sitzungs-MCP-Runtimes entsorgt werden.
  Die nächste Tool-Erkennung/-Verwendung erstellt sie aus der neuen Konfiguration neu, sodass entfernte
  `mcp.servers`-Einträge sofort aufgeräumt werden, statt auf die Leerlauf-TTL zu warten.

Siehe [MCP](/de/cli/mcp#openclaw-as-an-mcp-client-registry) und
[CLI-Backends](/de/gateway/cli-backends#bundle-mcp-overlays) für Runtime-Verhalten.

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

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Arbeitsbereich-Skills nicht betroffen).
- `load.extraDirs`: zusätzliche gemeinsam genutzte Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn true, werden Homebrew-Installer bevorzugt, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgegriffen wird.
- `install.nodeManager`: Node-Installer-Präferenz für `metadata.openclaw.install`-Spezifikationen
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Umgebungsvariable deklarieren (Klartextzeichenfolge oder SecretRef-Objekt).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` sowie `plugins.load.paths`.
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Allowlist (nur gelistete Plugins werden geladen). `deny` hat Vorrang.
- `bundledDiscovery`: standardmäßig `"allowlist"` für neue Konfigurationen, sodass eine nicht leere
  `plugins.allow` auch gebündelte Provider-Plugins steuert, einschließlich Websuche-
  Runtime-Provider. Doctor schreibt `"compat"` für migrierte Legacy-Allowlist-
  Konfigurationen, um vorhandenes gebündeltes Provider-Verhalten beizubehalten, bis Sie sich dafür entscheiden.
- `plugins.entries.<id>.apiKey`: API-Schlüssel-Komfortfeld auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-bezogene Umgebungsvariablen-Map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert Core `before_prompt_build` und ignoriert prompt-verändernde Felder aus Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wenn `true`, dürfen vertrauenswürdige nicht gebündelte Plugins Rohinhalte von Konversationen aus typisierten Hooks wie `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin ausdrücklich vertrauen, pro Ausführung `provider`- und `model`-Overrides für Hintergrund-Subagent-Ausführungen anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: Plugin-definiertes Konfigurationsobjekt (validiert durch natives OpenClaw-Plugin-Schema, wenn verfügbar).
- Konten-/Runtime-Einstellungen für Channel-Plugins befinden sich unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten des Manifests des zuständigen Plugins beschrieben werden, nicht durch eine zentrale OpenClaw-Optionsregistry.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Webabruf-Provider-Einstellungen.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`; selbst gehostete Overrides müssen auf private/interne Endpunkte zielen).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Zeitlimit für Scrape-Anforderungen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok-Websuche)-Einstellungen.
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Speicher-Dreaming-Einstellungen. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: zentraler Dreaming-Schalter (Standard `false`).
  - `frequency`: Cron-Takt für jeden vollständigen Dreaming-Durchlauf (`"0 3 * * *"` standardmäßig).
  - `model`: optionaler Dream-Diary-Subagent-Modell-Override. Erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`; mit `allowedModels` kombinieren, um Ziele einzuschränken. Fehler wegen nicht verfügbarer Modelle werden einmal mit dem Sitzungsstandardmodell erneut versucht; Vertrauens- oder Allowlist-Fehler fallen nicht stillschweigend zurück.
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine nutzerseitigen Konfigurationsschlüssel).
- Die vollständige Speicherkonfiguration befindet sich in [Referenz zur Speicherkonfiguration](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können außerdem eingebettete Pi-Standardwerte aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurationspatches.
- `plugins.slots.memory`: die aktive Speicher-Plugin-ID auswählen oder `"none"`, um Speicher-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: die aktive Kontext-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

Siehe [Plugins](/de/tools/plugin).

---

## Verpflichtungen

`commitments` steuert abgeleiteten Follow-up-Speicher: OpenClaw kann Check-ins aus Konversationsdurchläufen erkennen und über Heartbeat-Läufe zustellen.

- `commitments.enabled`: versteckte LLM-Extraktion, Speicherung und Heartbeat-Zustellung für abgeleitete Follow-up-Verpflichtungen aktivieren. Standard: `false`.
- `commitments.maxPerDay`: maximale Anzahl abgeleiteter Follow-up-Verpflichtungen, die pro Agent-Sitzung an einem rollierenden Tag zugestellt werden. Standard: `3`.

Siehe [Abgeleitete Verpflichtungen](/de/concepts/commitments).

---

## Browser

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

- `evaluateEnabled: false` deaktiviert `act:evaluate` und `wait --fn`.
- `tabCleanup` gibt nach Leerlaufzeit oder wenn eine Sitzung ihre Obergrenze
  überschreitet, nachverfolgte Tabs des primären Agenten frei. Setzen Sie `idleMinutes: 0` oder `maxTabsPerSession: 0`, um
  diese einzelnen Bereinigungsmodi zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist; dadurch bleibt Browsernavigation standardmäßig strikt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Browsernavigation im privaten Netzwerk ausdrücklich vertrauen.
- Im strikten Modus unterliegen Remote-CDP-Profil-Endpunkte (`profiles.*.cdpUrl`) denselben Sperren für private Netzwerke bei Erreichbarkeits- und Erkennungsprüfungen.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen gedacht (Start/Stopp/Zurücksetzen deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL bereitstellt.
- `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` gelten für Remote- und
  `attachOnly`-CDP-Erreichbarkeit sowie Anfragen zum Öffnen von Tabs. Verwaltete loopback-
  Profile behalten lokale CDP-Standardwerte bei.
- Wenn ein extern verwalteter CDP-Dienst über loopback erreichbar ist, setzen Sie für dieses
  Profil `attachOnly: true`; andernfalls behandelt OpenClaw den loopback-Port als
  lokal verwaltetes Browserprofil und meldet möglicherweise Fehler zur lokalen Port-Zuständigkeit.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können sich auf
  dem ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusteuern.
- `existing-session`-Profile behalten die aktuellen Routenlimits von Chrome MCP bei:
  snapshot-/ref-gesteuerte Aktionen statt CSS-Selektor-Targeting, Hooks für das Hochladen
  einer Datei, keine Überschreibungen für Dialog-Timeouts, kein `wait --load networkidle` und kein
  `responsebody`, PDF-Export, Download-Interception oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur für Remote-CDP explizit.
- Lokal verwaltete Profile können `executablePath` setzen, um den globalen
  `browser.executablePath` für dieses Profil zu überschreiben. Verwenden Sie dies, um ein Profil in
  Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für die Chrome-CDP-HTTP-
  Erkennung nach Prozessstart und `browser.localCdpReadyTimeoutMs` für die
  CDP-WebSocket-Bereitschaft nach dem Start. Erhöhen Sie diese Werte auf langsameren Hosts, auf denen Chrome
  erfolgreich startet, Bereitschaftsprüfungen aber mit dem Start konkurrieren. Beide Werte müssen
  positive Ganzzahlen bis `120000` ms sein; ungültige Konfigurationswerte werden abgelehnt.
- Reihenfolge der automatischen Erkennung: Standardbrowser, falls Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` und `browser.profiles.<name>.executablePath` akzeptieren beide
  `~` und `~/...` für das Home-Verzeichnis Ihres Betriebssystems vor dem Chromium-Start.
  Profilbezogenes `userDataDir` in `existing-session`-Profilen wird ebenfalls per Tilde erweitert.
- Steuerungsdienst: nur loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergrößen oder Debug-Flags).

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

- `seamColor`: Akzentfarbe für die Chrome nativer App-UIs (Talk-Mode-Sprechblasenfärbung usw.).
- `assistant`: Überschreibung der Control-UI-Identität. Fällt auf die Identität des aktiven Agenten zurück.

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

<Accordion title="Gateway-Felddetails">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Gateway verweigert den Start, sofern nicht `local` gesetzt ist.
- `port`: einzelner multiplexter Port für WS + HTTP. Vorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: Verwenden Sie Bind-Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das Standard-Binding `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Netzwerk (`-p 18789:18789`) kommt Traffic auf `eth0` an, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host`, oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: standardmäßig erforderlich. Nicht-Loopback-Bindings erfordern Gateway-Auth. Praktisch bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- und Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Auth. Nur für vertrauenswürdige local loopback-Setups verwenden; dies wird von Onboarding-Eingabeaufforderungen absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: delegiert Browser-/Benutzer-Auth an einen identitätsbewussten Reverse Proxy und vertraut Identitäts-Headern von `gateway.trustedProxies` (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet standardmäßig eine **Nicht-Loopback**-Proxy-Quelle; Reverse Proxies auf demselben Host über Loopback erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`. Interne Aufrufer auf demselben Host können `gateway.auth.password` als lokalen direkten Fallback verwenden; `gateway.auth.token` bleibt mit dem Trusted-Proxy-Modus gegenseitig ausgeschlossen.
- `gateway.auth.allowTailscale`: Wenn `true`, können Tailscale-Serve-Identitäts-Header die Control-UI-/WebSocket-Auth erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth **nicht**; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"` ist.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Auth. Gilt pro Client-IP und Auth-Bereich (Shared-Secret und Geräte-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können den Limiter daher schon bei der zweiten Anfrage auslösen, anstatt dass beide als einfache Nichtübereinstimmungen durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie localhost-Traffic absichtlich ebenfalls rate-limitieren möchten (für Test-Setups oder strikte Proxy-Deployments).
- Browser-Origin-WS-Auth-Versuche werden immer gedrosselt, wobei die Loopback-Ausnahme deaktiviert ist (Defense-in-Depth gegen browserbasierte localhost-Brute-Force-Angriffe).
- Auf Loopback sind diese Browser-Origin-Sperren pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlschläge von einem localhost-Origin nicht automatisch einen anderen Origin sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Binding) oder `funnel` (öffentlich, erfordert Auth).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Positivliste für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Origins erwartet werden.
- `controlUi.chatMessageMaxWidth`: optionale maximale Breite für gruppierte Control-UI-Chatnachrichten. Akzeptiert eingeschränkte CSS-Breitenwerte wie `960px`, `82%`, `min(1280px, 82%)` und `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die absichtlich auf Host-Header-Origin-Policy setzen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: Break-Glass-Override der clientseitigen Prozessumgebung, der Klartext-`ws://` zu vertrauenswürdigen Private-Network-IPs erlaubt; standardmäßig bleibt Klartext nur für Loopback erlaubt. Es gibt kein `openclaw.json`-Äquivalent, und Browser-Private-Network-Konfiguration wie `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` wirkt sich nicht auf Gateway-WebSocket-Clients aus.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für Remote-Clients. Sie konfigurieren Gateway-Auth nicht selbst.
- `gateway.push.apns.relay.baseUrl`: HTTPS-Basis-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem diese relaygestützte Registrierungen am Gateway veröffentlicht haben. Diese URL muss mit der in den iOS-Build einkompilierten Relay-URL übereinstimmen.
- `gateway.push.apns.relay.timeoutMs`: Sendetimeout vom Gateway zum Relay in Millisekunden. Standardmäßig `10000`.
- Relaygestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, nimmt diese Identität in die Relay-Registrierung auf und leitet eine registrierungsspezifische Sendeberechtigung an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Umgebungs-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für Entwicklung vorgesehene Ausweichmöglichkeit für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten bei HTTPS bleiben.
- `gateway.handshakeTimeoutMs`: Pre-Auth-Gateway-WebSocket-Handshake-Timeout in Millisekunden. Standard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat Vorrang, wenn gesetzt. Erhöhen Sie dies auf ausgelasteten oder leistungsschwachen Hosts, bei denen lokale Clients eine Verbindung herstellen können, während das Startup-Warmup noch ausläuft.
- `gateway.channelHealthCheckMinutes`: Intervall des Channel-Health-Monitors in Minuten. Setzen Sie `0`, um Health-Monitor-Neustarts global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Health-Monitor-Neustarts pro Channel/Konto in einer rollierenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Opt-out pro Channel für Health-Monitor-Neustarts, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung pro Konto für Multi-Konto-Channels. Wenn gesetzt, hat sie Vorrang vor der Überschreibung auf Channel-Ebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (kein Verschleiern durch Remote-Fallback).
- `trustedProxies`: Reverse-Proxy-IPs, die TLS terminieren oder Forwarded-Client-Header injizieren. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind für Proxy-/Local-Detection-Setups auf demselben Host weiterhin gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse Proxy), machen Loopback-Anfragen aber **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: Wenn `true`, akzeptiert das Gateway `X-Real-IP`, falls `X-Forwarded-For` fehlt. Standardmäßig `false` für Fail-Closed-Verhalten.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR/IP-Positivliste für die automatische Genehmigung erstmaliger Node-Gerätekopplung ohne angeforderte Scopes. Ist deaktiviert, wenn nicht gesetzt. Dies genehmigt Operator-/Browser-/Control-UI-/WebChat-Kopplung nicht automatisch, und es genehmigt Rollen-, Scope-, Metadaten- oder Public-Key-Upgrades nicht automatisch.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale Allow-/Deny-Formung für deklarierte Node-Befehle nach Kopplung und Auswertung der Plattform-Positivliste. Verwenden Sie `allowCommands`, um gefährliche Node-Befehle wie `camera.snap`, `camera.clip` und `screen.record` zuzulassen; `denyCommands` entfernt einen Befehl, selbst wenn ein Plattformstandard oder eine explizite Zulassung ihn andernfalls einschließen würde. Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie diese Gerätekopplung ab und genehmigen Sie sie erneut, damit das Gateway den aktualisierten Befehls-Snapshot speichert.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Deny-Liste entfernen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung von Responses-URL-Eingaben:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Positivlisten werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false` und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Abrufe zu deaktivieren.
- Optionaler Response-Härtungs-Header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-Instanz-Isolation

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und State-Verzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Komfort-Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Multiple Gateways](/de/gateway/multiple-gateways).

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

- `enabled`: aktiviert TLS-Terminierung am Gateway-Listener (HTTPS/WSS) (Standard: `false`).
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikat/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/Dev-Nutzung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zur Datei des privaten TLS-Schlüssels; Berechtigungen restriktiv halten.
- `caPath`: optionaler CA-Bundle-Pfad für Client-Verifizierung oder benutzerdefinierte Vertrauensketten.

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

- `mode`: steuert, wie Konfigurationsänderungen zur Laufzeit angewendet werden.
  - `"off"`: Live-Änderungen ignorieren; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderung immer neu starten.
  - `"hot"`: Änderungen im Prozess anwenden, ohne neu zu starten.
  - `"hybrid"` (Standard): zuerst Hot Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms für laufende Operationen, bevor ein Neustart oder Channel-Hot-Reload erzwungen wird. Weglassen, um die standardmäßig begrenzte Wartezeit (`300000`) zu verwenden; auf `0` setzen, um unbegrenzt zu warten und periodische Noch-ausstehend-Warnungen zu protokollieren.

---

## Hooks

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

Authentifizierung: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Token in Abfragezeichenfolgen werden abgelehnt.

Validierungs- und Sicherheitshinweise:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss sich von `gateway.auth.token` **unterscheiden**; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true` ist, schränken Sie `hooks.allowedSessionKeyPrefixes` ein, zum Beispiel `["hook:"]`.
- Wenn eine Zuordnung oder Voreinstellung einen vorlagenbasierten `sessionKey` verwendet, legen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true` fest. Statische Zuordnungsschlüssel erfordern diese Opt-in-Aktivierung nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Anfrage-Nutzlast wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` ist (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst
  - Per Vorlage gerenderte Zuordnungswerte für `sessionKey` werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Nutzlastfeld für generische Pfade ab.
- Vorlagen wie `{{messages[0].subject}}` lesen aus der Nutzlast.
- `transform` kann auf ein JS/TS-Modul verweisen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Pfad-Traversal werden abgelehnt).
  - Behalten Sie `hooks.transformsDir` unter `~/.openclaw/hooks/transforms`; Workspace-Skill-Verzeichnisse werden abgelehnt. Wenn `openclaw doctor` diesen Pfad als ungültig meldet, verschieben Sie das Transform-Modul in das Hook-Transform-Verzeichnis oder entfernen Sie `hooks.transformsDir`.
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs fallen auf die Standardeinstellung zurück.
- `allowedAgentIds`: beschränkt explizites Routing (`*` oder ausgelassen = alle zulassen, `[]` = alle ablehnen).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agentenläufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und vorlagengesteuerten Zuordnungssitzungsschlüsseln, `sessionKey` festzulegen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Zulassungsliste für explizite `sessionKey`-Werte (Anfrage + Zuordnung), z. B. `["hook:"]`. Sie wird erforderlich, wenn eine Zuordnung oder Voreinstellung einen vorlagenbasierten `sessionKey` verwendet.
- `deliver: true` sendet die abschließende Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss zulässig sein, wenn der Modellkatalog festgelegt ist).

</Accordion>

### Gmail-Integration

- Die integrierte Gmail-Voreinstellung verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und beschränken Sie `hooks.allowedSessionKeyPrefixes` passend zum Gmail-Namespace, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie die Voreinstellung mit einem statischen `sessionKey` anstelle der vorlagenbasierten Standardeinstellung.

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

- Gateway startet `gog gmail watch serve` beim Start automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie kein separates `gog gmail watch serve` parallel zum Gateway aus.

---

## Canvas-Plugin-Host

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Stellt von Agenten bearbeitbares HTML/CSS/JS und A2UI über HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Nicht-Loopback-Bindings: Canvas-Routen erfordern Gateway-Authentifizierung (Token/Passwort/vertrauenswürdiger Proxy), genau wie andere Gateway-HTTP-Oberflächen.
- Node-WebViews senden normalerweise keine Authentifizierungs-Header; nachdem ein Node gekoppelt und verbunden ist, kündigt das Gateway Node-spezifische Capability-URLs für Canvas/A2UI-Zugriff an.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. IP-basierter Fallback wird nicht verwendet.
- Injiziert den Live-Reload-Client in bereitgestelltes HTML.
- Erstellt automatisch eine Starter-`index.html`, wenn leer.
- Stellt A2UI auch unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Gateway-Neustart.
- Deaktivieren Sie Live-Reload für große Verzeichnisse oder `EMFILE`-Fehler.

---

## Erkennung

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

- `minimal` (Standard, wenn das gebündelte `bonjour`-Plugin aktiviert ist): lässt `cliPath` + `sshPort` aus TXT-Einträgen weg.
- `full`: schließt `cliPath` + `sshPort` ein; LAN-Multicast-Ankündigung erfordert weiterhin, dass das gebündelte `bonjour`-Plugin aktiviert ist.
- `off`: unterdrückt LAN-Multicast-Ankündigung, ohne die Plugin-Aktivierung zu ändern.
- Das gebündelte `bonjour`-Plugin startet automatisch auf macOS-Hosts und ist auf Linux, Windows und containerisierten Gateway-Bereitstellungen optional aktivierbar.
- Der Hostname ist standardmäßig der Systemhostname, wenn er ein gültiges DNS-Label ist; andernfalls fällt er auf `openclaw` zurück. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.

### Weitbereich (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Erkennung kombinieren Sie dies mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split DNS.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (Inline-Env-Variablen)

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

- Inline-Env-Variablen werden nur angewendet, wenn in der Prozessumgebung der Schlüssel fehlt.
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine von beiden überschreibt bestehende Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Die vollständige Vorrangreihenfolge finden Sie unter [Umgebung](/de/help/environment).

### Env-Variablen-Ersetzung

Referenzieren Sie Env-Variablen in einer beliebigen Konfigurationszeichenfolge mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Nur Großbuchstabennamen werden abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Escapen Sie mit `$${VAR}` für ein literales `${VAR}`.
- Funktioniert mit `$include`.

---

## Secrets

Secret-Referenzen sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`-`id`-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`-`id`: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"`-`id`-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine `.`- oder `..`-Slash-getrennten Pfadsegmente enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Credential-Oberfläche

- Kanonische Matrix: [SecretRef-Credential-Oberfläche](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte `openclaw.json`-Credential-Pfade.
- `auth-profiles.json`-Referenzen sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.

### Secret-Provider-Konfiguration

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

Hinweise:

- Der `file`-Provider unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im singleValue-Modus `"value"` sein).
- Datei- und exec-Provider-Pfade schlagen sicher fehl, wenn die Windows-ACL-Verifizierung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads auf stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zuzulassen, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, gilt die Trusted-Dir-Prüfung für den aufgelösten Zielpfad.
- Die `exec`-Child-Umgebung ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- Secret-Referenzen werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst; anschließend lesen Anfragepfade nur den Snapshot.
- Active-Surface-Filterung wird während der Aktivierung angewendet: Nicht aufgelöste Referenzen auf aktivierten Oberflächen lassen Start/Neuladen fehlschlagen, während inaktive Oberflächen mit Diagnosen übersprungen werden.

---

## Auth-Speicherung

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

- Profile pro Agent werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Referenzen auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Credential-Modi.
- Legacy-flache `auth-profiles.json`-Maps wie `{ "provider": { "apiKey": "..." } }` sind kein Laufzeitformat; `openclaw doctor --fix` schreibt sie mit einem `.legacy-flat.*.bak`-Backup in kanonische `provider:default`-API-Key-Profile um.
- OAuth-Modus-Profile (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Auth-Profil-Credentials.
- Statische Laufzeit-Credentials stammen aus aufgelösten In-Memory-Snapshots; Legacy-statische `auth.json`-Einträge werden bereinigt, wenn sie entdeckt werden.
- Legacy-OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Secrets-Laufzeitverhalten und `audit/configure/apply`-Werkzeuge: [Secrets-Verwaltung](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil wegen echten
  Abrechnungs-/Guthabenfehlern fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann
  auch bei `401`/`403`-Antworten weiterhin hier landen, aber Provider-spezifische
  Text-Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Meldungen zum Nutzungsfenster oder
  zu Ausgabenlimits von Organisation/Workspace bleiben stattdessen im `rate_limit`-Pfad.
- `billingBackoffHoursByProvider`: optionale Überschreibungen pro Provider für Abrechnungs-Backoff-Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Abrechnungs-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochverlässliche `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für `auth_permanent`-Backoff-Wachstum (Standard: `60`).
- `failureWindowHours`: rollierendes Fenster in Stunden für Backoff-Zähler (Standard: `24`).
- `overloadedProfileRotations`: maximale Auth-Profil-Rotationen desselben Providers bei Überlastungsfehlern, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Provider-ausgelastet-Formen wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung, bevor eine überlastete Provider-/Profilrotation erneut versucht wird (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Auth-Profil-Rotationen desselben Providers bei Rate-Limit-Fehlern, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Dieser Rate-Limit-Bucket enthält Provider-geprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Protokollierung

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

- Standard-Protokolldatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setzen Sie `logging.file` für einen stabilen Pfad.
- `consoleLevel` wird bei `--verbose` auf `debug` angehoben.
- `maxFileBytes`: maximale Größe der aktiven Protokolldatei in Byte vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei.
- `redactSensitive` / `redactPatterns`: Best-Effort-Maskierung für Konsolenausgabe, Datei-Logs, OTLP-Log-Datensätze und dauerhaft gespeicherten Sitzungstranskripttext. `redactSensitive: "off"` deaktiviert nur diese allgemeine Log-/Transkript-Richtlinie; Sicherheitsoberflächen für UI/Tools/Diagnosen schwärzen Geheimnisse weiterhin vor der Ausgabe.

---

## Diagnosen

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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

- `enabled`: Hauptschalter für Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings, die gezielte Logausgabe aktivieren (unterstützt Platzhalter wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersgrenzwert ohne Fortschritt in ms, um lang laufende Verarbeitungssitzungen als `session.long_running`, `session.stalled` oder `session.stuck` zu klassifizieren. Antworten, Tools, Status, Blöcke und ACP-Fortschritt setzen den Timer zurück; wiederholte `session.stuck`-Diagnosen nutzen Backoff, solange sie unverändert bleiben.
- `stuckSessionAbortMs`: Altersgrenzwert ohne Fortschritt in ms, ab dem geeignete blockierte aktive Arbeit zur Wiederherstellung per Abort-Drain beendet werden kann. Wenn nicht gesetzt, verwendet OpenClaw das sicherere erweiterte Fenster für eingebettete Läufe von mindestens 10 Minuten und 5-mal `stuckSessionWarnMs`.
- `otel.enabled`: aktiviert die OpenTelemetry-Export-Pipeline (Standard: `false`). Die vollständige Konfiguration, den Signalkatalog und das Datenschutzmodell finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionale signalspezifische OTLP-Endpunkte. Wenn gesetzt, überschreiben sie `otel.endpoint` nur für dieses Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Exportanforderungen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Trace-, Metrik- oder Logexport aktivieren.
- `otel.sampleRate`: Trace-Sampling-Rate `0`-`1`.
- `otel.flushIntervalMs`: periodisches Telemetrie-Flush-Intervall in ms.
- `otel.captureContent`: Opt-in-Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig deaktiviert. Boolesch `true` erfasst Nicht-System-Nachrichten-/Tool-Inhalte; die Objektform ermöglicht Ihnen, `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` und `systemPrompt` explizit zu aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungsumschalter für die neuesten experimentellen GenAI-Span-Provider-Attribute. Standardmäßig behalten Spans das Legacy-Attribut `gen_ai.system` zur Kompatibilität bei; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsumschalter für Hosts, die bereits ein globales OpenTelemetry SDK registriert haben. OpenClaw überspringt dann den Plugin-eigenen SDK-Start/-Stopp, während Diagnose-Listener aktiv bleiben.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signalspezifische Endpunkt-Umgebungsvariablen, die verwendet werden, wenn der passende Konfigurationsschlüssel nicht gesetzt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Läufe protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuert, was in der Cache-Trace-Ausgabe enthalten ist (alle Standard: `true`).

---

## Aktualisierung

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

- `channel`: Release-Kanal für npm-/git-Installationen - `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway auf npm-Updates prüfen (Standard: `true`).
- `auto.enabled`: automatische Hintergrundaktualisierung für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: Mindestverzögerung in Stunden vor dem automatischen Anwenden im Stable-Kanal (Standard: `6`; Max.: `168`).
- `auto.stableJitterHours`: zusätzliches Rollout-Streuungsfenster in Stunden für den Stable-Kanal (Standard: `12`; Max.: `168`).
- `auto.betaCheckIntervalHours`: Häufigkeit der Prüfungen im Beta-Kanal in Stunden (Standard: `1`; Max.: `24`).

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

- `enabled`: globales ACP-Feature-Gate (Standard: `true`; auf `false` setzen, um ACP-Dispatch und Spawn-Bedienelemente auszublenden).
- `dispatch.enabled`: unabhängiges Gate für ACP-Sitzungs-Turn-Dispatch (Standard: `true`). Auf `false` setzen, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: Standard-ID des ACP-Runtime-Backends (muss einem registrierten ACP-Runtime-Plugin entsprechen).
  Installieren Sie zuerst das Backend-Plugin, und falls `plugins.allow` gesetzt ist, nehmen Sie die Backend-Plugin-ID auf (zum Beispiel `acpx`), andernfalls wird das ACP-Backend nicht geladen.
- `defaultAgent`: Fallback-ACP-Ziel-Agent-ID, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Runtime-Sitzungen zugelassen sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Leerlauf-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen der gestreamten Blockprojektion.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Turn unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trenner vor sichtbarem Text nach ausgeblendeten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl von Assistentenausgabezeichen, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Zeichenanzahl für projizierte ACP-Status-/Aktualisierungszeilen.
- `stream.tagVisibility`: Zuordnung von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Leerlauf-TTL in Minuten für ACP-Sitzungs-Worker vor möglicher Bereinigung.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrapping einer ACP-Runtime-Umgebung ausgeführt wird.

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

- `cli.banner.taglineMode` steuert den Banner-Tagline-Stil:
  - `"random"` (Standard): wechselnde witzige/saisonale Taglines.
  - `"default"`: feste neutrale Tagline (`All your chats, one OpenClaw.`).
  - `"off"`: kein Tagline-Text (Bannertitel/-version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Taglines), setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

---

## Assistent

Metadaten, die von geführten CLI-Einrichtungsabläufen geschrieben werden (`onboard`, `configure`, `doctor`):

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

## Identität

Siehe die Identitätsfelder von `agents.list` unter [Agent-Standards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (Legacy, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (Validierung schlägt fehl, bis sie entfernt wurden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Legacy-Bridge-Konfiguration (historische Referenz)">

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

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Ausführungssitzungen aufbewahrt werden, bevor sie aus `sessions.json` entfernt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; auf `false` setzen, um zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Ausführungsprotokolldatei (`cron/runs/<jobId>.jsonl`) vor der Bereinigung. Standard: `2_000_000` Bytes.
- `runLog.keepLines`: neueste Zeilen, die beibehalten werden, wenn die Bereinigung des Ausführungsprotokolls ausgelöst wird. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die POST-Zustellung von Cron-Webhooks (`delivery.mode = "webhook"`) verwendet wird; wenn es fehlt, wird kein Authentifizierungs-Header gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die noch `notify: true` haben.

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

- `maxAttempts`: maximale Anzahl erneuter Versuche für einmalige Jobs bei vorübergehenden Fehlern (Standard: `3`; Bereich: `0`-`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden erneuten Versuch (Standard: `[30000, 60000, 300000]`; 1-10 Einträge).
- `retryOn`: Fehlertypen, die erneute Versuche auslösen - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle vorübergehenden Typen erneut zu versuchen.

Gilt nur für einmalige Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

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

- `enabled`: Fehlerwarnungen für Cron-Jobs aktivieren (Standard: `false`).
- `after`: aufeinanderfolgende Fehler, bevor eine Warnung ausgelöst wird (positive ganze Zahl, min.: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Warnungen für denselben Job (nichtnegative ganze Zahl).
- `includeSkipped`: aufeinanderfolgend übersprungene Ausführungen auf den Warnschwellenwert anrechnen (Standard: `false`). Übersprungene Ausführungen werden separat nachverfolgt und wirken sich nicht auf den Backoff bei Ausführungsfehlern aus.
- `mode`: Zustellmodus - `"announce"` sendet über eine Kanalnachricht; `"webhook"` postet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID, um die Zustellung von Warnungen einzugrenzen.

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

- Standardziel für Cron-Fehlerbenachrichtigungen über alle Jobs hinweg.
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanalüberschreibung für die `announce`-Zustellung. `"last"` verwendet den zuletzt bekannten Zustellungskanal erneut.
- `to`: explizites `announce`-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder ein globales noch ein jobspezifisches Fehlerziel festgelegt ist, fallen Jobs, die bereits über `announce` zustellen, bei Fehlern auf dieses primäre `announce`-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, das primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) nachverfolgt.

---

## Medienmodell-Vorlagenvariablen

Vorlagenplatzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                     |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext        |
| `{{RawBody}}`      | Rohtext (ohne Verlaufs-/Absender-Wrapper)        |
| `{{BodyStripped}}` | Text ohne Gruppenerwähnungen                     |
| `{{From}}`         | Absenderkennung                                  |
| `{{To}}`           | Zielkennung                                      |
| `{{MessageSid}}`   | Kanalnachrichten-ID                              |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                           |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde  |
| `{{MediaUrl}}`     | Eingehende Medien-Pseudo-URL                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                               |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                |
| `{{Transcript}}`   | Audiotranskript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge       |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                        |
| `{{GroupSubject}}` | Gruppenbetreff (bestmöglich)                     |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (bestmöglich)     |
| `{{SenderName}}`   | Anzeigename des Absenders (bestmöglich)          |
| `{{SenderE164}}`   | Telefonnummer des Absenders (bestmöglich)        |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Konfigurationseinbindungen (`$include`)

Konfiguration auf mehrere Dateien aufteilen:

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

**Zusammenführungsverhalten:**

- Einzelne Datei: ersetzt das enthaltende Objekt.
- Array von Dateien: wird der Reihe nach tief zusammengeführt (spätere überschreiben frühere).
- Geschwisterschlüssel: werden nach Einbindungen zusammengeführt (überschreiben eingebundene Werte).
- Verschachtelte Einbindungen: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen aber innerhalb des Konfigurationsverzeichnisses der obersten Ebene bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur zulässig, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden.
- OpenClaw-eigene Schreibvorgänge, die nur einen Top-Level-Abschnitt ändern, der durch eine Einbindung einer einzelnen Datei hinterlegt ist, schreiben in diese eingebundene Datei durch. Beispiel: `plugins install` aktualisiert `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Einbindungen, Einbindungs-Arrays und Einbindungen mit Geschwisterüberschreibungen sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen geschlossen fehl, statt die Konfiguration zu verflachen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Einbindungen.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
