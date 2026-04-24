---
read_when:
    - Sie benötigen exakte feldbezogene Konfigurationssemantik oder Standardwerte
    - Sie validieren Konfigurationsblöcke für Channel, Modelle, Gateway oder Tools
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystem-Referenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-24T08:57:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Kern-Konfigurationsreferenz für `~/.openclaw/openclaw.json`. Für einen aufgabenorientierten Überblick siehe [Configuration](/de/gateway/configuration).

Diese Seite behandelt die wichtigsten OpenClaw-Konfigurationsoberflächen und verlinkt weiter, wenn ein Subsystem eine eigene, ausführlichere Referenz hat. Sie versucht **nicht**, jeden Channel-/Plugin-eigenen Befehlskatalog oder jede tiefgehende Speicher-/QMD-Option auf einer Seite inline abzubilden.

Code-Referenz:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und die Control UI verwendet wird, wobei gebündelte Plugin-/Channel-Metadaten zusammengeführt werden, wenn verfügbar
- `config.schema.lookup` gibt einen einzelnen pfadbezogenen Schemaknoten für Drill-down-Tools zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schemaoberfläche

Dedizierte ausführliche Referenzen:

- [Memory-Konfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zugehörige Channel-/Plugin-Seiten für Channel-spezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Channels

Die Konfigurationsschlüssel pro Channel wurden auf eine dedizierte Seite verschoben — siehe
[Configuration — channels](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Channels (Authentifizierung, Zugriffskontrolle, Multi-Account, Mention-Gating).

## Agent-Standardeinstellungen, Multi-Agent, Sitzungen und Nachrichten

Auf eine dedizierte Seite verschoben — siehe
[Configuration — agents](/de/gateway/config-agents) für:

- `agents.defaults.*` (Arbeitsbereich, Modell, Thinking, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindungen)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, behält Talk das plattformspezifische Standard-Pausenfenster vor dem Senden des Transkripts bei (`700 ms unter macOS und Android, 900 ms unter iOS`)

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Umschalter, Provider-gestützte Tool-Konfiguration und benutzerdefinierte
Provider- / Base-URL-Einrichtung wurden auf eine dedizierte Seite verschoben — siehe
[Configuration — tools and custom providers](/de/gateway/config-tools).

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

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Arbeitsbereichs-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Wurzelverzeichnisse (niedrigste Priorität).
- `install.preferBrew`: wenn `true`, werden Homebrew-Installer bevorzugt, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Typen zurückgegriffen wird.
- `install.nodeManager`: Node-Installer-Präferenz für `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, auch wenn er gebündelt/installiert ist.
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
- `plugins.entries.<id>.env`: Plugin-bezogene Umgebungsvariablenzuordnung.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Kern `before_prompt_build` und ignoriert Prompt-modifizierende Felder aus dem älteren `before_agent_start`, wobei das ältere `modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte Hook-Verzeichnisse aus Bundles.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin explizit vertrauen, pro Ausführung `provider`- und `model`-Overrides für Hintergrund-Subagent-Ausführungen anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"`, nur wenn Sie absichtlich jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: vom Plugin definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Einstellungen für den Web-Fetch-Provider.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, das ältere `tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout der Scrape-Anfrage in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI-X-Search-Einstellungen (Grok-Websuche).
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: für die Suche zu verwendendes Grok-Modell (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory Dreaming. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: globaler Dreaming-Schalter (Standard `false`).
  - `frequency`: Cron-Taktung für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinien und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Speicherkonfiguration befindet sich in der [Memory-Konfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standardeinstellungen aus `settings.json` beisteuern; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: die aktive Speicher-Plugin-ID auswählen oder `"none"` zum Deaktivieren von Speicher-Plugins.
- `plugins.slots.contextEngine`: die aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: CLI-verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle gegenüber manuellen Änderungen.

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
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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

- `evaluateEnabled: false` deaktiviert `act:evaluate` und `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist, sodass die Browser-Navigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur dann, wenn Sie der Browser-Navigation in privaten Netzwerken absichtlich vertrauen.
- Im strikten Modus unterliegen entfernte CDP-Profilendpunkte (`profiles.*.cdpUrl`) denselben Sperren privater Netzwerke bei Erreichbarkeits-/Discovery-Prüfungen.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als älterer Alias unterstützt.
- Im strikten Modus verwenden Sie `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Entfernte Profile sind nur zum Anhängen vorgesehen (Start/Stopp/Zurücksetzen deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL bereitstellt.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können sich
  an den ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile behalten die aktuellen Begrenzungen der Chrome-MCP-Route bei:
  Snapshot-/Ref-basierte Aktionen statt CSS-Selektor-Targeting, Hooks für Einzeldatei-Uploads, keine Dialog-Timeout-Overrides, kein `wait --load networkidle` und kein
  `responsebody`, PDF-Export, Download-Abfangung oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für entferntes CDP.
- Reihenfolge der automatischen Erkennung: Standardbrowser, falls Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
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
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für das UI-Chrome der nativen App (Talk-Mode-Blasentönung usw.).
- `assistant`: Identitäts-Override für die Control UI. Fällt auf die aktive Agent-Identität zurück.

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

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Das Gateway verweigert den Start, außer bei `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Ältere Bind-Aliasse**: Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das Standard-Binding `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) trifft der Datenverkehr auf `eth0` ein, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host`, oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Schnittstellen zu lauschen.
- **Authentifizierung**: Standardmäßig erforderlich. Nicht-Loopback-Bindings erfordern Gateway-Authentifizierung. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und kein Modus gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige lokale `local loopback`-Setups verwenden; dies wird in Onboarding-Prompts absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Authentifizierung an einen identitätsbewussten Reverse-Proxy delegieren und Identitäts-Header von `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-Loopback**-Proxy-Quelle; Reverse-Proxys auf demselben Host mit Loopback erfüllen `trusted-proxy`-Authentifizierung nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Tailscale-Serve-Identitäts-Header die Authentifizierung für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden **nicht** diese Tailscale-Header-Authentifizierung; sie folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standard ist `true`, wenn `tailscale.mode = "serve"` gesetzt ist.
- `gateway.auth.rateLimit`: optionaler Begrenzer für fehlgeschlagene Authentifizierungen. Gilt pro Client-IP und pro Authentifizierungsbereich (gemeinsames Geheimnis und Geräte-Token werden getrennt verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können daher beim zweiten Request den Begrenzer auslösen, statt dass beide als einfache Nichtübereinstimmungen durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie es auf `false`, wenn Sie absichtlich möchten, dass auch localhost-Datenverkehr begrenzt wird (für Test-Setups oder strikte Proxy-Bereitstellungen).
- Browserseitige WS-Authentifizierungsversuche werden immer mit deaktivierter Loopback-Ausnahme gedrosselt (Defense-in-Depth gegen browserbasierte Brute-Force-Angriffe auf localhost).
- Bei Loopback werden diese Sperren für browserseitige Ursprünge pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlversuche von einem localhost-Ursprung nicht automatisch einen anderen Ursprung sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bind) oder `funnel` (öffentlich, erfordert Authentifizierung).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Originen erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Bereitstellungen aktiviert, die absichtlich auf einer Host-Header-Origin-Richtlinie basieren.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitige Break-Glass-Override über die Prozessumgebung, die unverschlüsseltes `ws://` zu vertrauenswürdigen privaten Netzwerk-IP-Adressen erlaubt; standardmäßig bleibt unverschlüsselter Verkehr auf Loopback beschränkt. Es gibt kein Äquivalent in `openclaw.json`, und Browser-Konfigurationen für private Netzwerke wie `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` wirken sich nicht auf Gateway-WebSocket-Clients aus.
- `gateway.remote.token` / `.password` sind Anmeldefelder des Remote-Clients. Sie konfigurieren die Gateway-Authentifizierung nicht selbst.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem sie relay-gestützte Registrierungen an das Gateway veröffentlicht haben. Diese URL muss mit der in den iOS-Build kompilierten Relay-URL übereinstimmen.
- `gateway.push.apns.relay.timeoutMs`: Timeout in Millisekunden für das Senden vom Gateway an das Relay. Standard ist `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die zugehörige iOS-App ruft `gateway.identity.get` ab, schließt diese Identität in die Relay-Registrierung ein und leitet eine registrierungsbezogene Sende-Berechtigung an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Umgebungsvariablen-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für die Entwicklung gedachter Escape Hatch für Loopback-HTTP-Relay-URLs. Relay-URLs in Produktion sollten bei HTTPS bleiben.
- `gateway.channelHealthCheckMinutes`: Intervall des Channel-Health-Monitors in Minuten. Setzen Sie `0`, um Health-Monitor-Neustarts global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Anzahl von Health-Monitor-Neustarts pro Channel/Konto innerhalb einer gleitenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: kanalbezogenes Opt-out für Health-Monitor-Neustarts, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kontobezogenes Override für Multi-Account-Channels. Wenn gesetzt, hat es Vorrang vor dem Override auf Channel-Ebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung fail-closed fehl (kein verdeckender Remote-Fallback).
- `trustedProxies`: Reverse-Proxy-IPs, die TLS terminieren oder weitergeleitete Client-Header einfügen. Führen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin gültig für Setups mit Proxy auf demselben Host/lokaler Erkennung (zum Beispiel Tailscale Serve oder ein lokaler Reverse-Proxy), aber sie machen Loopback-Requests **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: wenn `true`, akzeptiert das Gateway `X-Real-IP`, wenn `X-Forwarded-For` fehlt. Standard `false` für fail-closed-Verhalten.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Denylist).
- `gateway.tools.allow`: entfernt Tool-Namen aus der Standard-Denylist für HTTP.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung von URL-Eingaben für Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Abruf zu deaktivieren.
- Optionaler Header für Response-Härtung:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Originen setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation mehrerer Instanzen

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und Zustandsverzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Praktische Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

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
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikat-/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale Entwicklungsnutzung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zum privaten TLS-Schlüssel; restriktive Berechtigungen beibehalten.
- `caPath`: optionaler CA-Bundle-Pfad für Client-Verifizierung oder benutzerdefinierte Vertrauenskette.

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
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderungen immer neu starten.
  - `"hot"`: Änderungen ohne Neustart direkt im Prozess anwenden.
  - `"hybrid"` (Standard): zuerst Hot-Reload versuchen; falls erforderlich auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nicht-negative Ganzzahl).
- `deferralTimeoutMs`: maximale Wartezeit in ms auf laufende Operationen, bevor ein Neustart erzwungen wird (Standard: `300000` = 5 Minuten).

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
Hook-Token in der Query-String werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht-leeres `hooks.token`.
- `hooks.token` muss sich **von** `gateway.auth.token` unterscheiden; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, beschränken Sie `hooks.allowedSessionKeyPrefixes` (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel erfordern dieses Opt-in nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus dem Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → aufgelöst über `hooks.mappings`
  - Template-gerenderte `sessionKey`-Werte in Mappings werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping-Details">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Payload-Feld für generische Pfade ab.
- Templates wie `{{messages[0].subject}}` lesen aus dem Payload.
- `transform` kann auf ein JS-/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
- `agentId` leitet an einen bestimmten Agent weiter; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: beschränkt explizites Routing (`*` oder weggelassen = alle erlauben, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Ausführungen ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt es Aufrufern von `/hooks/agent` und templategesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet.
- `deliver: true` sendet die endgültige Antwort an einen Channel; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diese Hook-Ausführung (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

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

- Das Gateway startet `gog gmail watch serve` beim Booten automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie nicht zusätzlich zu dem Gateway ein separates `gog gmail watch serve` aus.

---

## Canvas-Host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Stellt vom Agent bearbeitbares HTML/CSS/JS und A2UI per HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Nicht-Loopback-Bindings: Canvas-Routen erfordern Gateway-Authentifizierung (token/password/trusted-proxy), genau wie andere HTTP-Oberflächen des Gateways.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, veröffentlicht das Gateway Node-bezogene Capability-URLs für den Zugriff auf Canvas/A2UI.
- Capability-URLs sind an die aktive WS-Sitzung des Node gebunden und laufen schnell ab. IP-basierter Fallback wird nicht verwendet.
- Injiziert einen Live-Reload-Client in ausgeliefertes HTML.
- Erstellt automatisch eine Starter-`index.html`, wenn das Verzeichnis leer ist.
- Stellt A2UI außerdem unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Gateway-Neustart.
- Deaktivieren Sie Live-Reload bei großen Verzeichnissen oder `EMFILE`-Fehlern.

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
- Hostname ist standardmäßig `openclaw`. Überschreiben mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Discovery mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split DNS kombinieren.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (inline Umgebungsvariablen)

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

- Inline-Umgebungsvariablen werden nur angewendet, wenn der Prozessumgebung der Schlüssel fehlt.
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine von beiden überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Vollständige Prioritätsregeln finden Sie unter [Environment](/de/help/environment).

### Substitution von Umgebungsvariablen

Verweisen Sie in beliebigen Konfigurations-Strings mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur Großbuchstabennamen abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen werfen beim Laden der Konfiguration einen Fehler.
- Mit `$${VAR}` für ein wörtliches `${VAR}` escapen.
- Funktioniert mit `$include`.

---

## Secrets

SecretRefs sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` `id`-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"` `id`-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine slash-getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Anmeldedatenoberfläche

- Kanonische Matrix: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Credential-Pfade in `openclaw.json`.
- `auth-profiles.json`-Refs sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.

### Konfiguration von Secret-Providern

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

- Der `file`-Provider unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im `singleValue`-Modus `"value"` sein).
- Pfade von File- und Exec-Providern schlagen fail-closed fehl, wenn die Windows-ACL-Verifizierung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads auf stdin/stdout.
- Standardmäßig werden symbolische Linkpfade für Befehle abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zu erlauben und dabei den aufgelösten Zielpfad zu validieren.
- Wenn `trustedDirs` konfiguriert ist, gilt die Trusted-Dir-Prüfung für den aufgelösten Zielpfad.
- Die Kindumgebung von `exec` ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- SecretRefs werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst, danach lesen Request-Pfade nur noch aus dem Snapshot.
- Die Filterung aktiver Oberflächen gilt während der Aktivierung: Nicht aufgelöste Refs auf aktivierten Oberflächen lassen Start/Reload fehlschlagen, während inaktive Oberflächen mit Diagnosen übersprungen werden.

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
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Credential-Modi.
- OAuth-Modus-Profile (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Anmeldedaten für Auth-Profile.
- Statische Laufzeit-Anmeldedaten stammen aus aufgelösten In-Memory-Snapshots; ältere statische `auth.json`-Einträge werden bei Erkennung bereinigt.
- Ältere OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Laufzeitverhalten von Secrets sowie `audit/configure/apply`-Tools: [Secrets Management](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil aufgrund echter Abrechnungs-/unzureichender-Guthaben-Fehler fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann auch bei `401`-/`403`-Antworten weiterhin hier landen, aber Provider-spezifische Text-Matcher bleiben auf den Provider beschränkt, zu dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wiederholbare HTTP-`402`-Nutzungsfenster- oder Ausgabenlimit-Meldungen für Organisation/Workspace bleiben stattdessen im `rate_limit`-Pfad.
- `billingBackoffHoursByProvider`: optionale providerbezogene Overrides für Billing-Backoff in Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Billing-Backoff (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für `auth_permanent`-Fehler mit hoher Sicherheit (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Backoff-Wachstum von `auth_permanent` (Standard: `60`).
- `failureWindowHours`: gleitendes Zeitfenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Anzahl von Rotationen des Auth-Profils beim selben Provider für Überlastungsfehler, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Provider-Busy-Formen wie `ModelNotReadyException` fallen hier hinein.
- `overloadedBackoffMs`: feste Verzögerung vor dem erneuten Versuch einer Rotation für einen überlasteten Provider/ein überlastetes Profil (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Anzahl von Rotationen des Auth-Profils beim selben Provider für Rate-Limit-Fehler, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst providergeprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

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

- Standard-Logdatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setzen Sie `logging.file` für einen stabilen Pfad.
- `consoleLevel` wird mit `--verbose` auf `debug` erhöht.
- `maxFileBytes`: maximale Größe der Logdatei in Byte, bevor Schreibvorgänge unterdrückt werden (positive Ganzzahl; Standard: `524288000` = 500 MB). Verwenden Sie externe Logrotation für Produktionsbereitstellungen.

---

## Diagnose

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

- `enabled`: globaler Umschalter für die Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings zur Aktivierung gezielter Logausgaben (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwelle in ms für die Ausgabe von Warnungen zu hängenden Sitzungen, während eine Sitzung im Verarbeitungszustand bleibt.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Exportanfragen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktiviert den Export von Traces, Metriken oder Logs.
- `otel.sampleRate`: Trace-Sampling-Rate `0`–`1`.
- `otel.flushIntervalMs`: Intervall in ms für das periodische Flushen der Telemetrie.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Ausführungen protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in die Cache-Trace-Ausgabe aufgenommen wird (alle standardmäßig: `true`).

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

- `channel`: Release-Channel für npm-/git-Installationen — `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateways nach npm-Updates suchen (Standard: `true`).
- `auto.enabled`: Hintergrund-Auto-Update für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: Mindestverzögerung in Stunden vor der automatischen Anwendung im Stable-Channel (Standard: `6`; Maximalwert: `168`).
- `auto.stableJitterHours`: zusätzliches Verteilungsfenster in Stunden für den Rollout im Stable-Channel (Standard: `12`; Maximalwert: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen im Beta-Channel in Stunden ausgeführt werden (Standard: `1`; Maximalwert: `24`).

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
- `dispatch.enabled`: unabhängiges Gate für das Dispatching von ACP-Sitzungs-Turns (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, aber die Ausführung zu blockieren.
- `backend`: Standard-ID des ACP-Laufzeit-Backends (muss mit einem registrierten ACP-Runtime-Plugin übereinstimmen).
- `defaultAgent`: Fallback-ID des Ziel-Agenten für ACP, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Runtime-Sitzungen erlaubt sind; leer bedeutet keine zusätzliche Beschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen einer gestreamten Blockprojektion.
- `stream.repeatSuppression`: unterdrückt wiederholte Status-/Tool-Zeilen pro Turn (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach versteckten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl projizierter Ausgabenzeichen des Assistenten pro ACP-Turn.
- `stream.maxSessionUpdateChars`: maximale Zeichenzahl für projizierte ACP-Status-/Update-Zeilen.
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

- `cli.banner.taglineMode` steuert den Stil des Banner-Slogans:
  - `"random"` (Standard): rotierende lustige/saisonale Slogans.
  - `"default"`: fester neutraler Slogan (`All your chats, one OpenClaw.`).
  - `"off"`: kein Slogantext (Banner-Titel/Version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Slogans), setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadaten, die von CLI-gestützten Setup-Abläufen geschrieben werden (`onboard`, `configure`, `doctor`):

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

Siehe die Identitätsfelder von `agents.list` unter [Agent defaults](/de/gateway/config-agents#agent-defaults).

---

## Bridge (älter, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Ältere Bridge-Konfiguration (historische Referenz)">

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

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Ausführungssitzungen vor dem Entfernen aus `sessions.json` aufbewahrt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Ausführungs-Logdatei (`cron/runs/<jobId>.jsonl`) vor dem Kürzen. Standard: `2_000_000` Byte.
- `runLog.keepLines`: neueste Zeilen, die beibehalten werden, wenn das Kürzen des Ausführungslogs ausgelöst wird. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die POST-Zustellung an Cron-Webhooks (`delivery.mode = "webhook"`) verwendet wird; wenn es weggelassen wird, wird kein Auth-Header gesendet.
- `webhook`: veraltete ältere Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die weiterhin `notify: true` haben.

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

- `maxAttempts`: maximale Anzahl von Wiederholungsversuchen für einmalige Jobs bei temporären Fehlern (Standard: `3`; Bereich: `0`–`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1–10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungsversuche auslösen — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle temporären Typen zu wiederholen.

Gilt nur für einmalige Cron-Jobs. Wiederkehrende Jobs verwenden eine getrennte Fehlerbehandlung.

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
- `after`: aufeinanderfolgende Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, Min.: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Warnungen für denselben Job (nicht-negative Ganzzahl).
- `mode`: Zustellmodus — `"announce"` sendet über eine Channel-Nachricht; `"webhook"` sendet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Channel-ID zur Eingrenzung der Warnungszustellung.

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

- Standardziel für Cron-Fehlerbenachrichtigungen für alle Jobs.
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Channel-Override für die Announce-Zustellung. `"last"` verwendet den zuletzt bekannten Zustell-Channel erneut.
- `to`: explizites Announce-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionales Konto-Override für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder ein globales noch ein jobspezifisches Fehlerziel gesetzt ist, fallen Jobs, die bereits über `announce` zustellen, im Fehlerfall auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [background tasks](/de/automation/tasks) verfolgt.

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
| `{{MessageSid}}`   | Channel-Nachrichten-ID                            |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                            |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde   |
| `{{MediaUrl}}`     | Pseudo-URL eingehender Medien                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                                |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                 |
| `{{Transcript}}`   | Audio-Transkript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge        |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                         |
| `{{GroupSubject}}` | Gruppenbetreff (nach bestem Wissen)               |
| `{{GroupMembers}}` | Vorschau auf Gruppenmitglieder (nach bestem Wissen) |
| `{{SenderName}}`   | Anzeigename des Senders (nach bestem Wissen)      |
| `{{SenderE164}}`   | Telefonnummer des Senders (nach bestem Wissen)    |
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

- Einzelne Datei: ersetzt das enthaltende Objekt.
- Array von Dateien: wird der Reihe nach tief zusammengeführt (spätere überschreiben frühere).
- Benachbarte Schlüssel: werden nach den Includes zusammengeführt (überschreiben eingeschlossene Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen aber innerhalb des Konfigurationsverzeichnisses der obersten Ebene bleiben (`dirname` von `openclaw.json`). Absolute Formen und `../` sind nur erlaubt, wenn sie sich weiterhin innerhalb dieser Grenze auflösen.
- OpenClaw-eigene Schreibvorgänge, die nur einen Top-Level-Abschnitt ändern, der durch ein Single-File-Include gestützt wird, schreiben in diese eingebundene Datei zurück. Zum Beispiel aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit benachbarten Overrides sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen fail-closed fehl, statt die Konfiguration zu flatten.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Includes.

---

_Verwandt: [Configuration](/de/gateway/configuration) · [Configuration Examples](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Configuration](/de/gateway/configuration)
- [Configuration examples](/de/gateway/configuration-examples)
