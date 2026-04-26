---
read_when:
    - Sie benötigen die exakte feldbezogene Konfigurationssemantik oder Standardwerte
    - Sie validieren Konfigurationsblöcke für Kanal, Modell, Gateway oder Tooling
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystem-Referenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-26T11:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Zentrale Konfigurationsreferenz für `~/.openclaw/openclaw.json`. Für eine aufgabenorientierte Übersicht siehe [Konfiguration](/de/gateway/configuration).

Deckt die wichtigsten OpenClaw-Konfigurationsoberflächen ab und verlinkt weiter, wenn ein Subsystem eine eigene, tiefere Referenz hat. Kanal- und Plugin-eigene Befehlskataloge sowie tiefgehende Memory-/QMD-Parameter befinden sich auf ihren eigenen Seiten statt auf dieser.

Code-Referenz:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird, mit zusammengeführten Metadaten aus Bundles/Plugins/Kanälen, sofern verfügbar
- `config.schema.lookup` gibt einen pfadbezogenen einzelnen Schema-Knoten für Drill-down-Tooling zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schema-Oberfläche

Pfad zur Agentensuche: Verwenden Sie die Tool-Aktion `config.schema.lookup` des `gateway`-Tools für
exakte feldbezogene Dokumentation und Constraints vor Änderungen. Verwenden Sie
[Konfiguration](/de/gateway/configuration) für aufgabenorientierte Hinweise und diese Seite
für die breitere Feldübersicht, Standardwerte und Links zu Subsystem-Referenzen.

Dedizierte Tiefenreferenzen:

- [Memory-Konfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommata erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Kanalbezogene Konfigurationsschlüssel wurden auf eine dedizierte Seite verschoben — siehe
[Konfiguration — Kanäle](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderen
gebündelten Kanälen (Authentifizierung, Zugriffskontrolle, Multi-Account, Mention-Gating).

## Agentenstandards, Multi-Agent, Sitzungen und Nachrichten

Auf eine dedizierte Seite verschoben — siehe
[Konfiguration — Agenten](/de/gateway/config-agents) für:

- `agents.defaults.*` (Workspace, Modell, Thinking, Heartbeat, Memory, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindings)
- `session.*` (Sitzungslebenszyklus, Compaction, Pruning)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.speechLocale`: optionale BCP-47-Locale-ID für Talk-Spracherkennung auf iOS/macOS
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk das plattformspezifische Standard-Pausenfenster vor dem Senden des Transkripts (`700 ms auf macOS und Android, 900 ms auf iOS`)

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Umschalter, providergestützte Tool-Konfiguration und benutzerdefinierte
Provider-/Base-URL-Einrichtung wurden auf eine dedizierte Seite verschoben — siehe
[Konfiguration — Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen liegen unter `mcp.servers` und werden
von eingebettetem Pi und anderen Laufzeitadaptern verwendet. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne während Konfigurationsänderungen eine Verbindung
zum Zielserver herzustellen.

```json5
{
  mcp: {
    // Optional. Standard: 600000 ms (10 Minuten). Setzen Sie 0, um Leerlauf-Eviction zu deaktivieren.
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
- `mcp.sessionIdleTtlMs`: Leerlauf-TTL für sitzungsbezogene gebündelte MCP-Laufzeiten.
  Einmalige eingebettete Läufe fordern eine Bereinigung am Ende des Laufs an; diese TTL ist die Rückfallebene für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden per Hot-Apply wirksam, indem zwischengespeicherte sitzungsbezogene MCP-Laufzeiten entsorgt werden.
  Die nächste Tool-Erkennung/-Verwendung erstellt sie aus der neuen Konfiguration neu, sodass entfernte
  `mcp.servers`-Einträge sofort bereinigt werden, statt auf die Leerlauf-TTL zu warten.

Siehe [MCP](/de/cli/mcp#openclaw-as-an-mcp-client-registry) und
[CLI-Backends](/de/gateway/cli-backends#bundle-mcp-overlays) für das Laufzeitverhalten.

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
- `load.extraDirs`: zusätzliche gemeinsam genutzte Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn `true`, bevorzugt Homebrew-Installer, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgegriffen wird.
- `install.nodeManager`: Präferenz für Node-Installer bei `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, auch wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Env-Variable deklarieren (Klartext-String oder SecretRef-Objekt).

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

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` plus `plugins.load.paths`.
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Allowlist (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: Komfortfeld für API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: pluginbezogene Env-Variablenzuordnung.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Kern `before_prompt_build` und ignoriert promptverändernde Felder aus veraltetem `before_agent_start`, während veraltete `modelOverride` und `providerOverride` beibehalten werden. Gilt für native Plugin-Hooks und unterstützte, von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wenn `true`, dürfen vertrauenswürdige nicht gebündelte Plugins rohe Konversationsinhalte aus typisierten Hooks wie `llm_input`, `llm_output`, `before_agent_finalize` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertraut diesem Plugin explizit, pro Lauf `provider`- und `model`-Overrides für Hintergrund-Subagent-Läufe anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"`, nur wenn Sie absichtlich jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: plugindefiniertes Konfigurationsobjekt (validiert durch natives OpenClaw-Plugin-Schema, sofern verfügbar).
- Kanal-Plugin-Konto-/Laufzeiteinstellungen liegen unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten des Manifests des zuständigen Plugins beschrieben werden, nicht durch eine zentrale OpenClaw-Optionsregistrierung.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Web-Fetch-Provider-Einstellungen.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, veraltetes `tools.web.fetch.firecrawl.apiKey` oder die Env-Variable `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout für Scrape-Anfragen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: zu verwendendes Grok-Modell für die Suche (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory-Dreaming. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: globaler Dreaming-Schalter (Standard `false`).
  - `frequency`: Cron-Taktung für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinien und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration befindet sich in der [Memory-Konfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standards aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agenteneinstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: aktive Memory-Plugin-ID auswählen oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

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
- `tabCleanup` gibt verfolgte Tabs des primären Agenten nach Leerlaufzeit frei oder wenn eine
  Sitzung ihr Limit überschreitet. Setzen Sie `idleMinutes: 0` oder `maxTabsPerSession: 0`, um diese einzelnen Bereinigungsmodi zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist, sodass Browser-Navigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Browser-Navigation im privaten Netzwerk bewusst vertrauen.
- Im strikten Modus unterliegen entfernte CDP-Profil-Endpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits-/Discovery-Prüfungen derselben Blockierung für private Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` bleibt als veralteter Alias unterstützt.
- Im strikten Modus verwenden Sie `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Entfernte Profile sind nur zum Anhängen da (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL gibt.
- `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` gelten für entfernte und
  `attachOnly`-CDP-Erreichbarkeit sowie Anfragen zum Öffnen von Tabs. Verwaltete Loopback-
  Profile behalten lokale CDP-Standardwerte.
- Wenn ein extern verwalteter CDP-Dienst über Loopback erreichbar ist, setzen Sie für dieses
  Profil `attachOnly: true`; andernfalls behandelt OpenClaw den Loopback-Port als lokal
  verwaltetes Browserprofil und kann lokale Portbesitzfehler melden.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können sich am
  ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile behalten die aktuellen Routenlimits von Chrome MCP:
  snapshot-/ref-basierte Aktionen statt CSS-Selector-Targeting, Hooks für Ein-Datei-Uploads,
  keine Dialog-Timeout-Overrides, kein `wait --load networkidle` und kein
  `responsebody`, kein PDF-Export, keine Download-Interception und keine Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für entferntes CDP.
- Lokal verwaltete Profile können `executablePath` setzen, um das globale
  `browser.executablePath` für dieses Profil zu überschreiben. Verwenden Sie dies, um ein Profil in
  Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für Chrome-CDP-HTTP-
  Discovery nach dem Prozessstart und `browser.localCdpReadyTimeoutMs` für die
  CDP-WebSocket-Bereitschaft nach dem Start. Erhöhen Sie sie auf langsameren Hosts, auf denen Chrome
  zwar erfolgreich startet, Bereitschaftsprüfungen aber mit dem Start konkurrieren. Beide Werte müssen
  positive Ganzzahlen bis `120000` ms sein; ungültige Konfigurationswerte werden abgelehnt.
- Reihenfolge der automatischen Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` und `browser.profiles.<name>.executablePath` akzeptieren beide
  `~` und `~/...` für Ihr OS-Home-Verzeichnis vor dem Chromium-Start.
  `userDataDir` pro Profil in `existing-session`-Profilen wird ebenfalls per Tilde erweitert.
- Control-Service: nur Loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
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
      avatar: "CB", // Emoji, kurzer Text, Bild-URL oder Data-URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für das UI-Chrome der nativen App (Talk-Mode-Blasenfärbung usw.).
- `assistant`: Identitätsüberschreibung für die Control UI. Fällt auf die aktive Agentenidentität zurück.

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
      // allowExternalEmbedUrls: false, // gefährlich: absolute externe http(s)-Embed-URLs erlauben
      // allowedOrigins: ["https://control.example.com"], // erforderlich für nicht-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Host-Header-Origin-Fallback-Modus
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
      // Zusätzliche /tools/invoke-HTTP-Denies
      deny: ["browser"],
      // Tools aus der Standard-HTTP-Deny-Liste entfernen
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
- **Veraltete Bind-Aliase**: Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliase (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das Standard-Bind `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) kommt der Verkehr auf `eth0` an, daher ist das Gateway nicht erreichbar. Verwenden Sie `--network host` oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Schnittstellen zu lauschen.
- **Authentifizierung**: standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Authentifizierung. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige lokale local loopback-Setups verwenden; dies wird absichtlich nicht in Onboarding-Eingabeaufforderungen angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Authentifizierung an einen identitätsbewussten Reverse Proxy delegieren und Identitäts-Header von `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; Reverse Proxys auf demselben Host über Loopback erfüllen `trusted-proxy`-Authentifizierung nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Tailscale-Serve-Identitäts-Header die Authentifizierung für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Authentifizierung **nicht**; sie folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateway. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Begrenzer für fehlgeschlagene Authentifizierungen. Gilt pro Client-IP und pro Authentifizierungsbereich (Shared Secret und Device-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können daher beim zweiten Request den Begrenzer auslösen, statt dass beide als einfache Fehlanpassungen gleichzeitig durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn localhost-Verkehr absichtlich ebenfalls rate-limited werden soll (für Test-Setups oder strikte Proxy-Deployments).
- Browser-originierte WS-Authentifizierungsversuche werden immer gedrosselt, wobei die Loopback-Ausnahme deaktiviert ist (Defense in Depth gegen browserbasierte Localhost-Brute-Force-Angriffe).
- Auf Loopback sind diese browser-originbasierten Sperren pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlschläge von einer localhost-Origin nicht automatisch eine andere Origin sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bind) oder `funnel` (öffentlich, erfordert Authentifizierung).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Origins erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die absichtlich auf Host-Header-Origin-Richtlinien vertrauen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitiger Prozess-Umgebungs-Break-Glass-Override, der Klartext-`ws://` zu vertrauenswürdigen privaten Netzwerk-IPs erlaubt; Standard bleibt für Klartext auf Loopback beschränkt. Es gibt kein Äquivalent in `openclaw.json`, und browserbezogene Konfiguration für private Netzwerke wie `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` wirkt sich nicht auf Gateway-WebSocket-Clients aus.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für Remote-Clients. Sie konfigurieren nicht selbstständig die Gateway-Authentifizierung.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem sie relaygestützte Registrierungen an das Gateway veröffentlicht haben. Diese URL muss mit der im iOS-Build einkompilierten Relay-URL übereinstimmen.
- `gateway.push.apns.relay.timeoutMs`: Timeout in Millisekunden für das Senden vom Gateway zum Relay. Standard ist `10000`.
- Relaygestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, schließt diese Identität in die Relay-Registrierung ein und leitet ein registrierungsbezogenes Senderecht an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für Entwicklung gedachter Escape Hatch für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten bei HTTPS bleiben.
- `gateway.channelHealthCheckMinutes`: Intervall des Kanal-Health-Monitors in Minuten. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Anzahl von Neustarts pro Kanal/Konto innerhalb einer rollierenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: kanalbezogenes Opt-out für Neustarts durch den Health-Monitor, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kontobezogene Überschreibung für Multi-Account-Kanäle. Wenn gesetzt, hat sie Vorrang vor der kanalbezogenen Überschreibung.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar sind, schlägt die Auflösung fail-closed fehl (kein Maskieren durch Remote-Fallback).
- `trustedProxies`: IPs von Reverse Proxys, die TLS terminieren oder weitergeleitete Client-Header injizieren. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin gültig für Setups mit Proxy auf demselben Host/lokaler Erkennung (zum Beispiel Tailscale Serve oder ein lokaler Reverse Proxy), aber sie machen Loopback-Requests **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: wenn `true`, akzeptiert das Gateway `X-Real-IP`, wenn `X-Forwarded-For` fehlt. Standard `false` für fail-closed-Verhalten.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR-/IP-Allowlist zum automatischen Genehmigen erstmaliger Device-Pairings von Nodes ohne angeforderte Scopes. Deaktiviert, wenn nicht gesetzt. Dies genehmigt nicht automatisch Pairing für Operator-/Browser-/Control-UI-/WebChat-Clients und genehmigt nicht automatisch Upgrades von Rolle, Scope, Metadaten oder öffentlichem Schlüssel.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale Formung von Allow/Deny für deklarierte Node-Befehle nach Pairing und Auswertung der Allowlist.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Deny-Liste entfernen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung von URL-Eingaben für Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Abrufe zu deaktivieren.
- Optionaler Header zur Härtung von Antworten:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-Instance-Isolation

Mehrere Gateways auf einem Host mit eindeutigen Ports und Statusverzeichnissen ausführen:

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
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikats-/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/dev-Verwendung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zur TLS-Private-Key-Datei; nur mit eingeschränkten Berechtigungen speichern.
- `caPath`: optionaler Pfad zu einem CA-Bundle für Client-Verifizierung oder benutzerdefinierte Vertrauenskette.

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

- `mode`: steuert, wie Konfigurationsänderungen zur Laufzeit angewendet werden.
  - `"off"`: Live-Änderungen ignorieren; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderungen immer neu starten.
  - `"hot"`: Änderungen im laufenden Prozess ohne Neustart anwenden.
  - `"hybrid"` (Standard): zuerst Hot Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nicht negative Ganzzahl).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms auf laufende Operationen, bevor ein Neustart erzwungen wird. Weglassen oder `0` setzen, um unbegrenzt zu warten und regelmäßig Warnungen zu weiterhin ausstehenden Operationen zu protokollieren.

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
Hook-Tokens in Query-Strings werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss sich von `gateway.auth.token` **unterscheiden**; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, beschränken Sie `hooks.allowedSessionKeyPrefixes` (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel erfordern dieses Opt-in nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst
  - Per Template gerenderte `sessionKey`-Werte in Mappings werden als extern geliefert behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Details zu Mappings">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Payload-Feld für generische Pfade ab.
- Templates wie `{{messages[0].subject}}` lesen aus der Payload.
- `transform` kann auf ein JS-/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: beschränkt explizites Routing (`*` oder weggelassen = alle erlauben, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und templategesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet.
- `deliver: true` sendet die finale Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und beschränken Sie `hooks.allowedSessionKeyPrefixes` so, dass sie zum Gmail-Namespace passen, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einem statischen `sessionKey` anstelle des templatisierten Standards.

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

- Das Gateway startet `gog gmail watch serve` beim Boot automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie nicht parallel zum Gateway ein separates `gog gmail watch serve` aus.

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

- Stellt agentenbearbeitbares HTML/CSS/JS und A2UI über HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: `gateway.bind: "loopback"` beibehalten (Standard).
- Bei Nicht-Loopback-Binds: Canvas-Routen erfordern Gateway-Authentifizierung (Token/Passwort/trusted-proxy), genauso wie andere Gateway-HTTP-Oberflächen.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, kündigt das Gateway nodebezogene Capability-URLs für den Zugriff auf Canvas/A2UI an.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. IP-basiertes Fallback wird nicht verwendet.
- Injiziert einen Live-Reload-Client in ausgeliefertes HTML.
- Erstellt automatisch eine Start-`index.html`, wenn leer.
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
- Der Hostname ist standardmäßig `openclaw`. Überschreiben mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-Area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für Discovery über Netzwerke hinweg mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split DNS kombinieren.

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

- Inline-Env-Variablen werden nur angewendet, wenn die Prozessumgebung den Schlüssel nicht enthält.
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine von beiden überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Siehe [Umgebung](/de/help/environment) für die vollständige Priorität.

### Ersetzung von Env-Variablen

Referenzieren Sie Env-Variablen in jedem Konfigurations-String mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Nur Großbuchstabennamen werden abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen werfen beim Laden der Konfiguration einen Fehler.
- Mit `$${VAR}` escapen Sie ein literales `${VAR}`.
- Funktioniert mit `$include`.

---

## Geheimnisse

SecretRefs sind additiv: Klartextwerte funktionieren weiterhin.

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
- `source: "exec"`-IDs dürfen keine durch `/` getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Oberfläche für Anmeldedaten

- Kanonische Matrix: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Pfade für Anmeldedaten in `openclaw.json`.
- `auth-profiles.json`-Refs sind in Laufzeitauflösung und Audit-Abdeckung enthalten.

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

- Der `file`-Provider unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im SingleValue-Modus `"value"` sein).
- Pfade für File- und Exec-Provider schlagen fail-closed fehl, wenn eine Windows-ACL-Verifizierung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads über stdin/stdout.
- Standardmäßig werden symbolische Linkpfade für Befehle abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zuzulassen und dabei den aufgelösten Zielpfad zu validieren.
- Wenn `trustedDirs` konfiguriert ist, gilt die Prüfung vertrauenswürdiger Verzeichnisse für den aufgelösten Zielpfad.
- Die Child-Umgebung von `exec` ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- SecretRefs werden beim Aktivierungszeitpunkt in einen In-Memory-Snapshot aufgelöst; Request-Pfade lesen danach nur noch den Snapshot.
- Während der Aktivierung wird Active-Surface-Filtering angewendet: nicht aufgelöste Refs auf aktivierten Oberflächen lassen Startup/Reload fehlschlagen, während inaktive Oberflächen mit Diagnostik übersprungen werden.

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

- Profile pro Agent werden in `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Anmeldedatenmodi.
- OAuth-Modus-Profile (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Anmeldedaten für Authentifizierungsprofile.
- Statische Laufzeit-Anmeldedaten kommen aus aufgelösten In-Memory-Snapshots; veraltete statische `auth.json`-Einträge werden bereinigt, wenn sie gefunden werden.
- Veraltete OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Secrets-Laufzeitverhalten und Tooling für `audit/configure/apply`: [Secrets Management](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil wegen echter Billing-/Insufficient-Credit-Fehler fehlschlägt (Standard: `5`). Expliziter Billing-Text kann hier weiterhin auch bei `401`-/`403`-Antworten landen, aber providerspezifische Text-Matcher bleiben auf den Provider beschränkt, zu dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Retrybare HTTP-`402`-Meldungen zu Nutzungsfenstern oder Ausgabenlimits von Organisationen/Workspaces bleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale providerbezogene Überschreibungen für Billing-Backoff-Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Billing-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochsichere `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Wachstum von `auth_permanent`-Backoff (Standard: `60`).
- `failureWindowHours`: rollierendes Fenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Anzahl von Authentifizierungsprofil-Rotationen desselben Providers bei Überlastungsfehlern, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Provider-busy-Formen wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor dem Retry einer überlasteten Provider-/Profilrotation (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Anzahl von Authentifizierungsprofil-Rotationen desselben Providers bei Rate-Limit-Fehlern, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst providergeprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

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
- `consoleLevel` wird mit `--verbose` auf `debug` erhöht.
- `maxFileBytes`: maximale Größe der aktiven Logdatei in Byte vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei.

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

- `enabled`: globaler Schalter für Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings, das gezielte Logausgabe aktiviert (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwellenwert in ms für Warnungen zu festhängenden Sitzungen, solange eine Sitzung im Verarbeitungsstatus bleibt.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`). Für die vollständige Konfiguration, den Signalkatalog und das Datenschutzmodell siehe [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionale OTLP-Endpunkte je Signal. Wenn gesetzt, überschreiben sie `otel.endpoint` nur für dieses Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Export-Requests gesendet werden.
- `otel.serviceName`: Service-Name für Resource-Attribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Trace-, Metrik- oder Log-Export aktivieren.
- `otel.sampleRate`: Trace-Sampling-Rate `0`–`1`.
- `otel.flushIntervalMs`: Intervall in ms für periodisches Flushen von Telemetrie.
- `otel.captureContent`: Opt-in für die Erfassung roher Inhalte in OTEL-Span-Attributen. Standardmäßig deaktiviert. Boolesches `true` erfasst Inhalte von Nicht-System-Nachrichten/Tools; mit der Objektform können Sie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` und `systemPrompt` explizit aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungsumschalter für die neuesten experimentellen GenAI-Span-Provider-Attribute. Standardmäßig behalten Spans aus Kompatibilitätsgründen das veraltete Attribut `gen_ai.system`; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsumschalter für Hosts, die bereits ein globales OpenTelemetry-SDK registriert haben. OpenClaw überspringt dann SDK-Start/-Shutdown durch Plugins, hält aber Diagnose-Listener aktiv.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signalbezogene Endpunkt-Env-Variablen, die verwendet werden, wenn der passende Konfigurationsschlüssel nicht gesetzt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Läufe protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in die Cache-Trace-Ausgabe aufgenommen wird (alle standardmäßig `true`).

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
- `checkOnStart`: beim Gateway-Start auf npm-Updates prüfen (Standard: `true`).
- `auto.enabled`: Hintergrund-Auto-Update für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: minimale Verzögerung in Stunden vor automatischer Anwendung im Stable-Kanal (Standard: `6`; max.: `168`).
- `auto.stableJitterHours`: zusätzliches Ausrollfenster in Stunden für den Stable-Kanal (Standard: `12`; max.: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen im Beta-Kanal in Stunden ausgeführt werden (Standard: `1`; max.: `24`).

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

- `enabled`: globales ACP-Feature-Gate (Standard: `true`; auf `false` setzen, um ACP-Dispatch und Spawn-Affordances auszublenden).
- `dispatch.enabled`: unabhängiges Gate für die Zug-Weiterleitung von ACP-Sitzungen (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, aber die Ausführung zu blockieren.
- `backend`: Standard-ID des ACP-Laufzeit-Backends (muss mit einem registrierten ACP-Laufzeit-Plugin übereinstimmen).
  Wenn `plugins.allow` gesetzt ist, schließen Sie die Backend-Plugin-ID ein (zum Beispiel `acpx`), sonst wird das gebündelte Standard-Plugin nicht geladen.
- `defaultAgent`: Fallback-ID des ACP-Zielagenten, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agenten-IDs, die für ACP-Laufzeitsitzungen zulässig sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen der Projektion gestreamter Blöcke.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Zug unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Zugereignissen.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach versteckten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl projizierter Zeichen der Assistentenausgabe pro ACP-Zug.
- `stream.maxSessionUpdateChars`: maximale Anzahl von Zeichen für projizierte ACP-Status-/Update-Zeilen.
- `stream.tagVisibility`: Zuordnung von Tag-Namen zu booleschen Sichtbarkeits-Overrides für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Idle-TTL in Minuten für ACP-Sitzungs-Worker, bevor sie für Bereinigung infrage kommen.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrap einer ACP-Laufzeitumgebung ausgeführt wird.

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

- `cli.banner.taglineMode` steuert den Stil der Banner-Tagline:
  - `"random"` (Standard): rotierende lustige/saisonale Taglines.
  - `"default"`: feste neutrale Tagline (`All your chats, one OpenClaw.`).
  - `"off"`: kein Tagline-Text (Bannertitel/Version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Taglines), setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

Siehe Identitätsfelder in `agents.list` unter [Agentenstandards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (veraltet, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

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
    webhookToken: "replace-with-dedicated-token", // optionales Bearer-Token für ausgehende Webhook-Authentifizierung
    sessionRetention: "24h", // Dauer-String oder false
    runLog: {
      maxBytes: "2mb", // Standard 2_000_000 Byte
      keepLines: 2000, // Standard 2000
    },
  },
}
```

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Laufsitzungen vor dem Pruning aus `sessions.json` aufbewahrt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Run-Log-Datei (`cron/runs/<jobId>.jsonl`) vor dem Pruning. Standard: `2_000_000` Byte.
- `runLog.keepLines`: neueste Zeilen, die beim Pruning von Run-Logs behalten werden. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die Zustellung per Cron-Webhook-POST (`delivery.mode = "webhook"`) verwendet wird; wenn es weggelassen wird, wird kein Auth-Header gesendet.
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

- `maxAttempts`: maximale Anzahl von Retries für Einmal-Jobs bei transienten Fehlern (Standard: `3`; Bereich: `0`–`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Retry-Versuch (Standard: `[30000, 60000, 300000]`; 1–10 Einträge).
- `retryOn`: Fehlertypen, die Retries auslösen — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle transienten Typen zu retrien.

Gilt nur für Einmal-Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

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
- `after`: aufeinanderfolgende Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, min.: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Warnungen für denselben Job (nicht negative Ganzzahl).
- `mode`: Zustellmodus — `"announce"` sendet über eine Kanalnachricht; `"webhook"` sendet per POST an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID zur Eingrenzung der Warnungszustellung.

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

- Standardziel für Fehlerbenachrichtigungen von Cron über alle Jobs hinweg.
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanal-Override für `announce`-Zustellung. `"last"` verwendet den zuletzt bekannten Zustellkanal erneut.
- `to`: explizites `announce`-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionales Konto-Override für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder global noch pro Job ein Fehlerziel gesetzt ist, fallen Jobs, die bereits per `announce` zustellen, bei Fehlern auf dieses primäre `announce`-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrund-Tasks](/de/automation/tasks) verfolgt.

---

## Template-Variablen für Medienmodelle

Template-Platzhalter, die in `tools.media.models[].args` expandiert werden:

| Variable           | Beschreibung                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext         |
| `{{RawBody}}`      | Rohtext (ohne Verlaufs-/Absender-Wrapper)         |
| `{{BodyStripped}}` | Text mit entfernten Gruppenerwähnungen            |
| `{{From}}`         | Absenderkennung                                   |
| `{{To}}`           | Zielkennung                                       |
| `{{MessageSid}}`   | Kanal-Nachrichten-ID                              |
| `{{SessionId}}`    | UUID der aktuellen Sitzung                        |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde   |
| `{{MediaUrl}}`     | Pseudo-URL eingehender Medien                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                                |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                 |
| `{{Transcript}}`   | Audio-Transkript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge        |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                         |
| `{{GroupSubject}}` | Gruppenbetreff (best effort)                      |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (best effort)      |
| `{{SenderName}}`   | Anzeigename des Absenders (best effort)           |
| `{{SenderE164}}`   | Telefonnummer des Absenders (best effort)         |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Konfigurations-Includes (`$include`)

Konfiguration in mehrere Dateien aufteilen:

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

**Merge-Verhalten:**

- Einzelne Datei: ersetzt das umgebende Objekt.
- Array von Dateien: wird in Reihenfolge per Deep Merge zusammengeführt (spätere überschreiben frühere).
- Benachbarte Schlüssel: werden nach Includes zusammengeführt (überschreiben inkludierte Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur inkludierenden Datei aufgelöst, müssen aber innerhalb des obersten Konfigurationsverzeichnisses bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur erlaubt, wenn sie sich dennoch innerhalb dieser Grenze auflösen.
- OpenClaw-eigene Schreibvorgänge, die nur einen einzelnen Top-Level-Abschnitt ändern, der durch ein Include mit einzelner Datei gestützt wird, schreiben in diese inkludierte Datei durch. Zum Beispiel aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit benachbarten Overrides sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; solche Schreibvorgänge schlagen fail-closed fehl, statt die Konfiguration zu verflachen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zyklische Includes.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
