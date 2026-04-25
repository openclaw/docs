---
read_when:
    - Sie benötigen die exakte Feldsemantik oder Standardwerte der Konfiguration.
    - Sie validieren Konfigurationsblöcke für Kanal, Modell, Gateway oder Tool.
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standards und Links zu dedizierten Subsystem-Referenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-25T13:46:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Core-Konfigurationsreferenz für `~/.openclaw/openclaw.json`. Einen aufgabenorientierten Überblick finden Sie unter [Konfiguration](/de/gateway/configuration).

Behandelt die wichtigsten OpenClaw-Konfigurationsoberflächen und verlinkt weiter, wenn ein Subsystem eine eigene ausführlichere Referenz hat. Befehlskataloge von Kanälen und Plugins sowie tiefe Optionen für Memory/QMD befinden sich auf ihren eigenen Seiten statt auf dieser.

Code-Quelle der Wahrheit:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird, wobei gebündelte Plugin-/Kanal-Metadaten, wenn verfügbar, zusammengeführt werden
- `config.schema.lookup` gibt einen auf einen Pfad begrenzten Schema-Knoten für Drill-down-Tools zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schemaoberfläche

Dedizierte ausführliche Referenzen:

- [Memory-Konfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- Seiten des jeweiligen Kanals/Plugins für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + abschließende Kommas erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Konfigurationsschlüssel pro Kanal wurden auf eine dedizierte Seite verschoben — siehe
[Konfiguration — Kanäle](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Kanäle (Auth, Zugriffskontrolle, mehrere Konten, Mention-Gating).

## Agent-Standards, Multi-Agent, Sitzungen und Nachrichten

Auf eine dedizierte Seite verschoben — siehe
[Konfiguration — Agenten](/de/gateway/config-agents) für:

- `agents.defaults.*` (Workspace, Modell, thinking, Heartbeat, Memory, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindungen)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk das Standard-Pausenfenster der Plattform vor dem Senden des Transkripts (`700 ms auf macOS und Android, 900 ms auf iOS`)

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Umschalter, provider-gestützte Tool-Konfiguration und benutzerdefinierte
Provider-/Base-URL-Einrichtung wurden auf eine dedizierte Seite verschoben — siehe
[Konfiguration — Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
von eingebettetem Pi und anderen Laufzeitadaptern verwendet. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne sich bei Konfigurationsänderungen mit dem
Zielserver zu verbinden.

```json5
{
  mcp: {
    // Optional. Standard: 600000 ms (10 Minuten). Setzen Sie 0, um die Bereinigung bei Leerlauf zu deaktivieren.
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

- `mcp.servers`: benannte stdio- oder entfernte MCP-Serverdefinitionen für Laufzeiten, die
  konfigurierte MCP-Tools bereitstellen.
- `mcp.sessionIdleTtlMs`: Idle-TTL für sitzungsgebundene gebündelte MCP-Laufzeiten.
  Einmalige eingebettete Läufe fordern Bereinigung am Laufende an; diese TTL ist die Rückfallebene für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden per Hot-Apply angewendet, indem zwischengespeicherte MCP-Laufzeiten der Sitzung entsorgt werden.
  Die nächste Tool-Erkennung/-Verwendung erstellt sie aus der neuen Konfiguration neu, sodass entfernte
  Einträge aus `mcp.servers` sofort bereinigt werden, statt auf die Idle-TTL zu warten.

Siehe [MCP](/de/cli/mcp#openclaw-as-an-mcp-client-registry) und
[CLI-Backends](/de/gateway/cli-backends#bundle-mcp-overlays) für Laufzeitverhalten.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartext-String
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Wurzeln (niedrigste Priorität).
- `install.preferBrew`: wenn true, Homebrew-Installer bevorzugen, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgegriffen wird.
- `install.nodeManager`: Präferenz für Node-Installer bei `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert eine Skill, selbst wenn sie gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Umgebungsvariable deklarieren (Klartext-String oder SecretRef-Objekt).

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

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` sowie `plugins.load.paths`.
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Allowlist (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: Komfortfeld für API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: pluginbezogene Zuordnung von Umgebungsvariablen.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert Prompt-verändernde Felder aus dem veralteten `before_agent_start`, wobei die veralteten `modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte, von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wenn `true`, dürfen vertrauenswürdige nicht gebündelte Plugins rohe Konversationsinhalte aus typisierten Hooks wie `llm_input`, `llm_output` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin explizit vertrauen, dass es für Hintergrund-Subagent-Läufe Overrides für `provider` und `model` pro Lauf anfordern darf.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer Ziele im Format `provider/model` für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"`, nur wenn Sie absichtlich jedes Modell erlauben möchten.
- `plugins.entries.<id>.config`: Plugin-definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- Konto-/Laufzeiteinstellungen für Kanal-Plugins befinden sich unter `channels.<id>` und sollten durch die Manifest-Metadaten `channelConfigs` des besitzenden Plugins beschrieben werden, nicht durch ein zentrales OpenClaw-Optionsregister.
- `plugins.entries.firecrawl.config.webFetch`: Einstellungen für den Firecrawl-Web-Fetch-Provider.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Greift auf `plugins.entries.firecrawl.config.webSearch.apiKey`, das veraltete `tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt von Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout der Scrape-Anfrage in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den Provider X Search aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory-Dreaming. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: globaler Schalter für Dreaming (Standard `false`).
  - `frequency`: Cron-Taktung für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration befindet sich in der [Memory-Konfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standards aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: die aktive Memory-Plugin-ID auswählen oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: die aktive Plugin-ID der Context-Engine auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: vom CLI verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle gegenüber manuellen Bearbeitungen.

Siehe [Plugins](/de/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // allowPrivateNetwork: true, // veralteter Alias
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
- `tabCleanup` bereinigt verfolgte Tabs des primären Agenten nach Leerlaufzeit oder wenn eine
  Sitzung ihr Limit überschreitet. Setzen Sie `idleMinutes: 0` oder `maxTabsPerSession: 0`, um
  diese einzelnen Bereinigungsmodi zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist, sodass Browser-Navigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Navigation im Browser über private Netzwerke bewusst vertrauen.
- Im strikten Modus unterliegen entfernte CDP-Profil-Endpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits-/Discovery-Prüfungen denselben Sperren für private Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als veralteter Alias unterstützt.
- Im strikten Modus verwenden Sie `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Entfernte Profile sind nur zum Anhängen gedacht (`attach-only`) (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL gibt.
- Profile vom Typ `existing-session` verwenden Chrome MCP statt CDP und können sich auf
  dem ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- Profile vom Typ `existing-session` können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browser-Profil wie Brave oder Edge anzusprechen.
- Profile vom Typ `existing-session` behalten die aktuellen Routenlimits von Chrome MCP:
  Snapshot-/Ref-gesteuerte Aktionen statt CSS-Selektor-Targeting, Hooks für Datei-Uploads mit einer Datei, keine Dialog-Timeout-Overrides, kein `wait --load networkidle` und kein
  `responsebody`, kein PDF-Export, keine Download-Interception und keine Batch-Aktionen.
- Lokal verwaltete Profile vom Typ `openclaw` weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für entferntes CDP.
- Lokal verwaltete Profile können `executablePath` setzen, um das globale
  `browser.executablePath` für dieses Profil zu überschreiben. Verwenden Sie dies, um ein Profil in
  Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für die Chrome-CDP-HTTP-
  Discovery nach dem Prozessstart und `browser.localCdpReadyTimeoutMs` für die
  Bereitschaft des CDP-WebSocket nach dem Start. Erhöhen Sie diese Werte auf langsameren Hosts, bei denen Chrome
  erfolgreich startet, aber Bereitschaftsprüfungen mit dem Start konkurrieren.
- Reihenfolge der automatischen Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` akzeptiert `~` für Ihr Home-Verzeichnis des Betriebssystems.
- Control Service: nur loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergröße oder Debug-Flags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // Emoji, kurzer Text, Bild-URL oder data-URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für den UI-Chrome der nativen App (Färbung der Talk-Mode-Bubble usw.).
- `assistant`: Identitäts-Override für die Control UI. Greift auf die aktive Agentenidentität zurück.

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
      // password: "your-password", // oder OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // für mode=trusted-proxy; siehe /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // gefährlich: absolute externe http(s)-Embed-URLs zulassen
      // allowedOrigins: ["https://control.example.com"], // erforderlich für nicht-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Origin-Fallback-Modus per Host-Header
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
    // Optional. Standard false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Standard nicht gesetzt/deaktiviert.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Zusätzliche /tools/invoke-HTTP-Sperren
      deny: ["browser"],
      // Tools aus der Standard-HTTP-Sperrliste entfernen
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

<Accordion title="Details zu Gateway-Feldern">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Das Gateway verweigert den Start, sofern nicht `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Veraltete Bind-Aliase**: Verwenden Sie Bind-Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliase (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das Standard-Binding `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Mit Docker-Bridge-Netzwerk (`-p 18789:18789`) kommt der Datenverkehr auf `eth0` an, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host`, oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: Standardmäßig erforderlich. Bindings außerhalb von loopback erfordern Gateway-Auth. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und kein Modus gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Auth. Nur für vertrauenswürdige lokale loopback-Setups verwenden; dies wird in Onboarding-Prompts absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Auth an einen identitätsbewussten Reverse-Proxy delegieren und Identitätsheadern aus `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; Reverse-Proxys auf demselben Host über loopback erfüllen trusted-proxy-Auth nicht.
- `gateway.auth.allowTailscale`: Wenn `true`, können Identitätsheader von Tailscale Serve die Auth für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden **nicht** diese Tailscale-Header-Auth; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateway. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierung. Gilt pro Client-IP und pro Auth-Bereich (gemeinsames Secret und Device-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige ungültige Versuche desselben Clients können den Limiter daher bereits bei der zweiten Anfrage auslösen, statt dass beide als normale Nichtübereinstimmungen durchrutschen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie es auf `false`, wenn Sie localhost-Datenverkehr absichtlich ebenfalls ratenbegrenzen möchten (für Test-Setups oder strikte Proxy-Bereitstellungen).
- Browser-Origin-WS-Auth-Versuche werden immer gedrosselt, wobei die loopback-Ausnahme deaktiviert ist (Defense-in-Depth gegen browserbasierte Brute-Force-Angriffe auf localhost).
- Auf loopback sind diese browserbasierten Sperren pro normalisiertem `Origin`-
  Wert isoliert, sodass wiederholte Fehlschläge von einem localhost-Origin nicht automatisch
  ein anderes Origin aussperren.
- `tailscale.mode`: `serve` (nur tailnet, loopback-Binding) oder `funnel` (öffentlich, erfordert Auth).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-loopback-Origins erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der den Host-Header-Origin-Fallback für Bereitstellungen aktiviert, die absichtlich auf eine Host-Header-Origin-Richtlinie angewiesen sind.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitiger Break-Glass-Override
  über die Prozessumgebung, der unverschlüsseltes `ws://` zu vertrauenswürdigen privaten Netzwerk-
  IPs erlaubt; Standard bleibt weiterhin nur loopback für unverschlüsseltes Plaintext. Es gibt kein
  Äquivalent in `openclaw.json`, und Browser-Konfiguration für private Netzwerke wie
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` wirkt sich nicht auf Gateway-
  WebSocket-Clients aus.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder des Remote-Clients. Sie konfigurieren Gateway-Auth nicht selbst.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem diese relay-gestützte Registrierungen beim Gateway veröffentlicht haben. Diese URL muss der im iOS-Build einkompilierten Relay-URL entsprechen.
- `gateway.push.apns.relay.timeoutMs`: Timeout in Millisekunden für das Senden vom Gateway an das Relay. Standardwert `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, schließt diese Identität in die Relay-Registrierung ein und leitet dem Gateway eine registrierungsbezogene Sendeberechtigung weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für Entwicklung gedachter Escape Hatch für loopback-HTTP-Relay-URLs. Relay-URLs für Produktion sollten bei HTTPS bleiben.
- `gateway.channelHealthCheckMinutes`: Intervall des Kanal-Health-Monitors in Minuten. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Zahl von Neustarts pro Kanal/Konto durch den Health-Monitor innerhalb einer gleitenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: kanalbezogene Abmeldung von Neustarts durch den Health-Monitor bei weiterhin aktiviertem globalem Monitor.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kontoübergreifendes Override pro Konto für Kanäle mit mehreren Konten. Wenn gesetzt, hat es Vorrang vor dem Override auf Kanalebene.
- Lokale Aufrufpfade des Gateway können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (kein maskierender Remote-Fallback).
- `trustedProxies`: IPs von Reverse-Proxys, die TLS terminieren oder Header mit weitergeleiteter Client-IP einfügen. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Setups mit Proxy auf demselben Host/lokaler Erkennung gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse-Proxy), machen loopback-Anfragen jedoch **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: wenn `true`, akzeptiert das Gateway `X-Real-IP`, wenn `X-Forwarded-For` fehlt. Standard `false` für fehlgeschlossene Sicherheit.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR-/IP-Allowlist zum automatischen Genehmigen der erstmaligen Gerätekopplung eines Node ohne angeforderte Scopes. Nicht gesetzt bedeutet deaktiviert. Dies genehmigt nicht automatisch die Kopplung von Operator/Browser/Control UI/WebChat und genehmigt auch keine Upgrades von Rolle, Scope, Metadaten oder öffentlichem Schlüssel automatisch.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale Gestaltung von Allow/Deny für deklarierte Node-Befehle nach der Kopplung und Auswertung der Allowlist.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert sind (erweitert die Standard-Sperrliste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Sperrliste entfernen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung für URL-Eingaben bei Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Abrufe zu deaktivieren.
- Optionaler Härtungsheader für Antworten:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolierung mehrerer Instanzen

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und Zustandsverzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Komfort-Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Mehrere Gateways](/de/gateway/multiple-gateways).

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
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikat-/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokal/Entwicklung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zum privaten TLS-Schlüssel; mit eingeschränkten Berechtigungen schützen.
- `caPath`: optionaler Pfad zum CA-Bundle für Client-Verifizierung oder benutzerdefinierte Vertrauenskette.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: steuert, wie Konfigurationsbearbeitungen zur Laufzeit angewendet werden.
  - `"off"`: Live-Bearbeitungen ignorieren; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: Gateway-Prozess bei Konfigurationsänderung immer neu starten.
  - `"hot"`: Änderungen im Prozess anwenden, ohne neu zu starten.
  - `"hybrid"` (Standard): zuerst Hot Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms auf laufende Vorgänge, bevor ein Neustart erzwungen wird. Weglassen oder auf `0` setzen, um unbegrenzt zu warten und periodische Warnungen über weiterhin ausstehende Vorgänge zu protokollieren.

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

Auth: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Tokens in Query-Strings werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss sich von `gateway.auth.token` **unterscheiden**; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, grenzen Sie `hooks.allowedSessionKeyPrefixes` ein (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel erfordern diese Freigabe nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst
  - Per Template gerenderte `sessionKey`-Werte im Mapping werden als extern geliefert behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Details zu Mappings">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Payload-Feld für generische Pfade ab.
- Templates wie `{{messages[0].subject}}` lesen aus der Payload.
- `transform` kann auf ein JS-/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
- `agentId` routet an einen bestimmten Agenten; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: schränkt explizites Routing ein (`*` oder weggelassen = alle erlauben, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und templategesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet.
- `deliver: true` sendet die endgültige Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und beschränken Sie `hooks.allowedSessionKeyPrefixes` so, dass sie zum Gmail-Namensraum passen, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einem statischen `sessionKey` statt mit dem templatisierten Standard.

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

- Das Gateway startet `gog gmail watch serve` beim Booten automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie nicht zusätzlich ein separates `gog gmail watch serve` neben dem Gateway aus.

---

## Canvas-Host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // oder OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Stellt vom Agenten bearbeitbares HTML/CSS/JS und A2UI über HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: `gateway.bind: "loopback"` beibehalten (Standard).
- Bindings außerhalb von loopback: Canvas-Routen erfordern Gateway-Auth (Token/Passwort/trusted-proxy), wie andere HTTP-Oberflächen des Gateway.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, kündigt das Gateway Node-begrenzte Capability-URLs für den Zugriff auf Canvas/A2UI an.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. Ein IP-basierter Fallback wird nicht verwendet.
- Injiziert den Live-Reload-Client in bereitgestelltes HTML.
- Erstellt automatisch eine Starter-`index.html`, wenn leer.
- Stellt A2UI auch unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Gateway-Neustart.
- Deaktivieren Sie Live Reload bei großen Verzeichnissen oder `EMFILE`-Fehlern.

---

## Discovery

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

- `minimal` (Standard): `cliPath` + `sshPort` aus TXT-Records weglassen.
- `full`: `cliPath` + `sshPort` einschließen.
- Hostname ist standardmäßig `openclaw`. Mit `OPENCLAW_MDNS_HOSTNAME` überschreiben.

### Wide-Area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Discovery mit einem DNS-Server koppeln (CoreDNS empfohlen) + Tailscale Split DNS.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (inline Env-Variablen)

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
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine der beiden überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Vollständige Priorität finden Sie unter [Umgebung](/de/help/environment).

### Ersetzung von Env-Variablen

Referenzieren Sie Env-Variablen in jedem Konfigurations-String mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur Großbuchstabennamen erkannt: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Mit `$${VAR}` maskieren, um ein wörtliches `${VAR}` zu erhalten.
- Funktioniert mit `$include`.

---

## Secrets

SecretRefs sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie genau eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- Muster für `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Muster für `id` bei `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- Muster für `id` bei `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine slashgetrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Oberfläche für Anmeldedaten

- Kanonische Matrix: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Anmeldedatenpfade in `openclaw.json`.
- Refs in `auth-profiles.json` sind in Laufzeitauflösung und Audit-Abdeckung enthalten.

### Konfiguration von Secret-Providern

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optionaler expliziter Env-Provider
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

- Der Provider `file` unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im Modus `singleValue` `"value"` sein).
- Pfade von File- und Exec-Providern schlagen geschlossen fehl, wenn die Windows-ACL-Verifizierung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der Provider `exec` erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads auf stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zu erlauben, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, gilt die Prüfung auf vertrauenswürdige Verzeichnisse für den aufgelösten Zielpfad.
- Die Child-Umgebung von `exec` ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- SecretRefs werden zur Aktivierungszeit in einen Snapshot im Speicher aufgelöst; Anforderungspfade lesen danach nur noch aus diesem Snapshot.
- Beim Aktivieren wird Filtering der aktiven Oberfläche angewendet: Nicht aufgelöste Refs auf aktivierten Oberflächen lassen Start/Reload fehlschlagen, während inaktive Oberflächen mit Diagnostik übersprungen werden.

---

## Auth-Speicher

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
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Anmeldedatenmodi.
- Profile im OAuth-Modus (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine mit SecretRef hinterlegten Anmeldedaten für Auth-Profile.
- Statische Laufzeit-Anmeldedaten kommen aus im Speicher aufgelösten Snapshots; veraltete statische Einträge in `auth.json` werden bereinigt, wenn sie gefunden werden.
- Veraltete OAuth-Importe stammen aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Laufzeitverhalten von Secrets und Werkzeuge für `audit/configure/apply`: [Secrets Management](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil wegen echter
  Billing-/Insufficient-Credit-Fehler fehlschlägt (Standard: `5`). Expliziter Billing-Text kann
  weiterhin hier landen, selbst bei Antworten mit `401`/`403`, aber Provider-spezifische Text-
  Matcher bleiben auf den Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Meldungen zu Nutzungsfenstern oder
  Ausgabenlimits auf Organisations-/Workspace-Ebene bleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale providerbezogene Overrides für Billing-Backoff in Stunden.
- `billingMaxHours`: Obergrenze in Stunden für das exponentielle Wachstum des Billing-Backoff (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochzuverlässige `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Wachstum des `auth_permanent`-Backoff (Standard: `60`).
- `failureWindowHours`: gleitendes Zeitfenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Zahl gleicher Auth-Profil-Rotationen innerhalb desselben Providers bei Überlastungsfehlern, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Formen für „Provider beschäftigt“ wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor dem Wiederholen einer Rotation eines überlasteten Provider/Profils (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Zahl gleicher Auth-Profil-Rotationen innerhalb desselben Providers bei Rate-Limit-Fehlern, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Dieser Rate-Limit-Bucket enthält providergeprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Logging

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

- Standard-Logdatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setzen Sie `logging.file` für einen stabilen Pfad.
- `consoleLevel` wird bei `--verbose` auf `debug` angehoben.
- `maxFileBytes`: maximale Logdateigröße in Byte, bevor Schreibvorgänge unterdrückt werden (positive Ganzzahl; Standard: `524288000` = 500 MB). Verwenden Sie für Produktionsbereitstellungen externe Logrotation.

---

## Diagnostik

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

- `enabled`: globaler Schalter für Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings, das gezielte Logausgabe aktiviert (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwelle in ms für das Ausgeben von Warnungen zu festhängenden Sitzungen, während eine Sitzung im Verarbeitungszustand bleibt.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadatenheader, die mit OTel-Exportanfragen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktivieren den Export von Traces, Metriken oder Logs.
- `otel.sampleRate`: Trace-Sampling-Rate `0`–`1`.
- `otel.flushIntervalMs`: Intervall in ms für periodisches Leeren von Telemetrie.
- `otel.captureContent`: optionale Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig deaktiviert. Boolesches `true` erfasst Nicht-System-Nachrichten-/Tool-Inhalte; mit der Objektform können Sie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` und `systemPrompt` explizit aktivieren.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsumschalter für Hosts, die bereits ein globales OpenTelemetry-SDK registriert haben. OpenClaw überspringt dann das Starten/Beenden des Plugin-eigenen SDK, hält diagnostische Listener aber aktiv.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Läufe protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle standardmäßig: `true`).

---

## Update

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

- `channel`: Release-Kanal für npm-/Git-Installationen — `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway auf npm-Updates prüfen (Standard: `true`).
- `auto.enabled`: Hintergrund-Auto-Update für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: minimale Verzögerung in Stunden vor automatischem Anwenden im Stable-Kanal (Standard: `6`; Maximum: `168`).
- `auto.stableJitterHours`: zusätzliches Rollout-Streuungsfenster in Stunden für den Stable-Kanal (Standard: `12`; Maximum: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen im Beta-Kanal in Stunden ausgeführt werden (Standard: `1`; Maximum: `24`).

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

- `enabled`: globales ACP-Feature-Gate (Standard: `false`).
- `dispatch.enabled`: unabhängiges Gate für das Auslösen von ACP-Sitzungsturns (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: ID des Standard-ACP-Laufzeit-Backends (muss zu einem registrierten ACP-Laufzeit-Plugin passen).
- `defaultAgent`: Fallback-ID des ACP-Zielagenten, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agenten-IDs, die für ACP-Laufzeitsitzungen zulässig sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Zahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen gestreamter Blockprojektion.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Turn unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trenner vor sichtbarem Text nach versteckten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Zahl projizierter Ausgabzeichen des Assistenten pro ACP-Turn.
- `stream.maxSessionUpdateChars`: maximale Zeichenanzahl für projizierte ACP-Status-/Update-Zeilen.
- `stream.tagVisibility`: Zuordnung von Tagnamen zu booleschen Sichtbarkeits-Overrides für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Idle-TTL in Minuten für ACP-Sitzungs-Worker vor möglicher Bereinigung.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrappen einer ACP-Laufzeitumgebung ausgeführt wird.

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

- `cli.banner.taglineMode` steuert den Stil des Banner-Slogans:
  - `"random"` (Standard): rotierende lustige/saisonale Slogans.
  - `"default"`: fester neutraler Slogan (`All your chats, one OpenClaw.`).
  - `"off"`: kein Slogantext (Banner-Titel/Version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Slogans), setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

---

## Assistent

Metadaten, die von geführten CLI-Setup-Abläufen geschrieben werden (`onboard`, `configure`, `doctor`):

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

Siehe Identitätsfelder in `agents.list` unter [Agent-Standards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (veraltet, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. Schlüssel `bridge.*` sind nicht mehr Teil des Konfigurationsschemas (Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Veraltete Bridge-Konfiguration (historische Referenz)">

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
    webhook: "https://example.invalid/legacy", // veralteter Fallback für gespeicherte Jobs mit notify:true
    webhookToken: "replace-with-dedicated-token", // optionales Bearer-Token für ausgehende Webhook-Auth
    sessionRetention: "24h", // Dauer-String oder false
    runLog: {
      maxBytes: "2mb", // Standard 2_000_000 Byte
      keepLines: 2000, // Standard 2000
    },
  },
}
```

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Laufsitzungen aufbewahrt werden, bevor sie aus `sessions.json` bereinigt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Run-Log-Datei (`cron/runs/<jobId>.jsonl`) vor dem Bereinigen. Standard: `2_000_000` Byte.
- `runLog.keepLines`: neueste Zeilen, die beibehalten werden, wenn das Bereinigen des Run-Logs ausgelöst wird. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die POST-Zustellung von Cron-Webhooks (`delivery.mode = "webhook"`) verwendet wird; wenn weggelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete alte Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die noch `notify: true` haben.

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

- `maxAttempts`: maximale Zahl von Wiederholungen für einmalige Jobs bei vorübergehenden Fehlern (Standard: `3`; Bereich: `0`–`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1–10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungen auslösen — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um bei allen vorübergehenden Typen zu wiederholen.

Gilt nur für einmalige Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

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

- `enabled`: Fehlerwarnungen für Cron-Jobs aktivieren (Standard: `false`).
- `after`: aufeinanderfolgende Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, Minimum: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Warnungen für denselben Job (nichtnegative Ganzzahl).
- `mode`: Zustellmodus — `"announce"` sendet per Kanalnachricht; `"webhook"` sendet per POST an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID, um die Warnungszustellung zu begrenzen.

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
- `channel`: Kanal-Override für die Announce-Zustellung. `"last"` verwendet den zuletzt bekannten Zustellkanal erneut.
- `to`: explizites Announce-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionales Konto-Override für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder global noch pro Job ein Fehlerziel gesetzt ist, greifen Jobs, die bereits über `announce` zustellen, bei Fehlern auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre `delivery.mode` des Jobs nicht `"webhook"` ist.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.

---

## Vorlagenvariablen für Medienmodelle

Template-Platzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext         |
| `{{RawBody}}`      | Roher Nachrichtentext (ohne Verlauf-/Sender-Wrapper) |
| `{{BodyStripped}}` | Nachrichtentext mit entfernten Gruppenerwähnungen |
| `{{From}}`         | Senderkennung                                     |
| `{{To}}`           | Zielkennung                                       |
| `{{MessageSid}}`   | Kanal-Nachrichten-ID                              |
| `{{SessionId}}`    | UUID der aktuellen Sitzung                        |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde   |
| `{{MediaUrl}}`     | Pseudo-URL eingehender Medien                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                                |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                 |
| `{{Transcript}}`   | Audiotranskript                                   |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge        |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                         |
| `{{GroupSubject}}` | Gruppenbetreff (best effort)                      |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (best effort)      |
| `{{SenderName}}`   | Anzeigename des Senders (best effort)             |
| `{{SenderE164}}`   | Telefonnummer des Senders (best effort)           |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Konfigurations-Includes (`$include`)

Teilen Sie die Konfiguration in mehrere Dateien auf:

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
- Geschwisterschlüssel: werden nach den Includes zusammengeführt (überschreiben inkludierte Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur inkludierenden Datei aufgelöst, müssen aber innerhalb des Konfigurationsverzeichnisses auf oberster Ebene bleiben (`dirname` von `openclaw.json`). Absolute Formen/`../` sind nur erlaubt, wenn sie sich weiterhin innerhalb dieser Grenze auflösen.
- OpenClaw-eigene Schreibvorgänge, die nur einen einzelnen Abschnitt auf oberster Ebene ändern, der durch ein Include mit nur einer Datei gestützt wird, schreiben bis in diese inkludierte Datei durch. Zum Beispiel aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit überschreibenden Geschwisterschlüsseln sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen geschlossen fehl, statt die Konfiguration zu flatten.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Includes.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
