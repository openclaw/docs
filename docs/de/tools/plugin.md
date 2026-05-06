---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-06T07:07:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 118c856507965f496d87edc1fef8cb67d36c7ef62acc84d5ad130ffd3a3f5568
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Agent-Harnesses, Werkzeuge, Skills, Sprache, Echtzeittranskription, Echtzeit-
Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Websuche
und mehr. Einige Plugins sind **Kern-Plugins** (mit OpenClaw ausgeliefert), andere
sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und entdeckt. Npm bleibt für direkte Installationen und für eine
temporäre Gruppe von OpenClaw-eigenen Plugin-Paketen unterstützt, während diese
Migration abgeschlossen wird.

## Schnellstart

Beispiele zum Kopieren und Einfügen für Installation, Auflisten, Deinstallation,
Aktualisierung und Veröffentlichung finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins).

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>

  <Step title="Chat-native Verwaltung">
    In einem laufenden Gateway lösen nur für Owner verfügbare `/plugins enable` und `/plugins disable`
    den Konfigurations-Neulader des Gateway aus. Das Gateway lädt Plugin-Laufzeitoberflächen
    im Prozess neu, und neue Agent-Turns bauen ihre Werkzeugliste aus der
    aktualisierten Registry neu auf. `/plugins install` ändert Plugin-Quellcode, daher fordert das
    Gateway stattdessen einen Neustart an, anstatt vorzutäuschen, der aktuelle Prozess könne
    bereits importierte Module sicher neu laden.

  </Step>

  <Step title="Plugin verifizieren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Werkzeuge, Dienste, Gateway-
    Methoden, Hooks oder Plugin-eigene CLI-Befehle nachweisen müssen. Einfaches
    `inspect` ist eine kalte Manifest-/Registry-Prüfung und vermeidet absichtlich den Import der Plugin-Laufzeit.

  </Step>
</Steps>

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>`, explizites `npm:<pkg>`, explizites `git:<repo>` oder eine einfache Paket-
Spezifikation über npm.

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Neuinstallationspfad
für gebündelte Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.
Während des Gateway-Starts schlägt ungültige Plugin-Konfiguration geschlossen fehl wie jede andere ungültige
Konfiguration. Führen Sie `openclaw doctor --fix` aus, um die fehlerhafte Plugin-Konfiguration zu quarantänisieren, indem
der betreffende Plugin-Eintrag deaktiviert und dessen ungültiger Konfigurations-Payload entfernt wird; das normale
Konfigurations-Backup behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar ist, dieselbe
veraltete Plugin-ID aber in der Plugin-Konfiguration oder in Installationsdatensätzen verbleibt, protokolliert der Gateway-Start
Warnungen und überspringt diesen Kanal, anstatt jeden anderen Kanal zu blockieren.
Führen Sie `openclaw doctor --fix` aus, um die veralteten Kanal-/Plugin-Einträge zu entfernen; unbekannte
Kanalschlüssel ohne Hinweise auf veraltete Plugins schlagen weiterhin bei der Validierung fehl, damit Tippfehler
sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als inaktiv behandelt:
Der Gateway-Start überspringt Plugin-Erkennung/-Laden, und `openclaw doctor` behält
die deaktivierte Plugin-Konfiguration bei, anstatt sie automatisch zu entfernen. Aktivieren Sie Plugins erneut, bevor
Sie die doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden sollen.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter Installations-/Update- oder
doctor-Reparaturabläufe. Gateway-Start, Konfigurationsneuladen und Laufzeitinspektion führen
keine Paketmanager aus und reparieren keine Abhängigkeitsbäume. Lokale Plugins müssen ihre
Abhängigkeiten bereits installiert haben, während npm-, git- und ClawHub-Plugins
unter den von OpenClaw verwalteten Plugin-Roots installiert werden. npm-Abhängigkeiten können
innerhalb des von OpenClaw verwalteten npm-Roots gehoistet werden; Install/Update durchsucht diesen verwalteten Root vor
der Vertrauensentscheidung, und Uninstall entfernt npm-verwaltete Pakete über npm. Externe Plugins
und benutzerdefinierte Ladepfade müssen weiterhin über `openclaw plugins install` installiert werden.
Verwenden Sie `openclaw plugins list --json`, um den statischen `dependencyStatus` für jedes
sichtbare Plugin zu sehen, ohne Laufzeitcode zu importieren oder Abhängigkeiten zu reparieren.
Siehe [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution) für den
Installationszeit-Lebenszyklus.

### Blockierte Plugin-Pfad-Ownership

Wenn die Plugin-Diagnose
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
meldet und die Konfigurationsvalidierung mit `plugin present but blocked` folgt, hat OpenClaw
Plugin-Dateien gefunden, die einem anderen Unix-Benutzer gehören als dem Prozess, der sie lädt.
Behalten Sie die Plugin-Konfiguration bei; beheben Sie die Dateisystem-Ownership oder führen Sie
OpenClaw als denselben Benutzer aus, dem das State-Verzeichnis gehört.

Bei Docker-Installationen läuft das offizielle Image als `node` (uid `1000`), daher sollten die
hostseitig bind-gemounteten OpenClaw-Konfigurations- und Workspace-Verzeichnisse normalerweise
uid `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, reparieren Sie stattdessen den verwalteten Plugin-Root auf
root-Ownership:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Nachdem Sie die Ownership behoben haben, führen Sie erneut `openclaw doctor --fix` oder
`openclaw plugins registry --refresh` aus, damit die persistierte Plugin-Registry zu
den reparierten Dateien passt.

Bei npm-Installationen werden veränderliche Selektoren wie `latest` oder ein dist-tag
vor der Installation aufgelöst und anschließend auf die exakt verifizierte Version im von OpenClaw
verwalteten npm-Root gepinnt. Nachdem npm abgeschlossen ist, verifiziert OpenClaw, dass der installierte
`package-lock.json`-Eintrag weiterhin der aufgelösten Version und Integrität entspricht. Wenn
npm andere Paketmetadaten schreibt, schlägt die Installation fehl und das verwaltete Paket
wird zurückgerollt, anstatt ein anderes Plugin-Artefakt zu akzeptieren.

Quell-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an gebündelten
Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt gebündelte Plugins dann aus
`extensions/<id>`, sodass Änderungen und paketlokale Abhängigkeiten direkt verwendet werden.
Einfache npm-Root-Installationen sind für paketiertes OpenClaw vorgesehen, nicht für die Entwicklung mit
Quell-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                       | Beispiele                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativ** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt       | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie unter [Plugin Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json` deklarieren.
Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und auf eine lesbare
Laufzeitdatei auflösen oder auf eine TypeScript-Quelldatei mit einem abgeleiteten gebauten JavaScript-
Peer wie `src/index.ts` zu `dist/index.js`.
Paketierte Installationen müssen diese JavaScript-Laufzeitausgabe mitliefern. Der TypeScript-
Quellfallback ist für Quell-Checkouts und lokale Entwicklungspfade vorgesehen, nicht für
npm-Pakete, die in OpenClaws verwalteten Plugin-Root installiert werden.

Wenn eine Warnung für verwaltete Pakete sagt, dass sie `requires compiled runtime output for
TypeScript entry ...`, wurde das Paket ohne die JavaScript-Dateien veröffentlicht, die
OpenClaw zur Laufzeit benötigt. Das ist ein Problem der Plugin-Paketierung, kein lokales Konfigurations-
problem. Aktualisieren oder installieren Sie das Plugin erneut, nachdem der Publisher kompiliertes
JavaScript erneut veröffentlicht hat, oder deaktivieren/deinstallieren Sie dieses Plugin, bis ein behobenes Paket verfügbar ist.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Laufzeitdateien nicht unter denselben
Pfaden liegen wie die Quelleinträge. Wenn vorhanden, muss `runtimeExtensions` genau
einen Eintrag für jeden `extensions`-Eintrag enthalten. Nicht übereinstimmende Listen lassen Installation und
Plugin-Erkennung fehlschlagen, anstatt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie außerdem
`openclaw.setupEntry` veröffentlichen, verwenden Sie `openclaw.runtimeSetupEntry` für dessen gebauten
JavaScript-Peer; diese Datei ist erforderlich, wenn sie deklariert wird.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Offizielle Plugins

### OpenClaw-eigene npm-Pakete während der Migration

ClawHub ist der primäre Distributionspfad für die meisten Plugins. Aktuelle paketierte
OpenClaw-Releases bündeln bereits viele offizielle Plugins, daher benötigen diese in normalen Setups
keine separaten npm-Installationen. Bis jedes OpenClaw-eigene Plugin
zu ClawHub migriert ist, liefert OpenClaw weiterhin einige `@openclaw/*`-Plugin-Pakete auf
npm für ältere/benutzerdefinierte Installationen und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als deprecated meldet, stammt diese Paketversion
aus einer älteren externen Paketreihe. Verwenden Sie das gebündelte Plugin aus
dem aktuellen OpenClaw oder einem lokalen Checkout, bis ein neueres npm-Paket veröffentlicht wird.

| Plugin          | Paket                    | Dokumentation                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/de/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/de/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/de/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/de/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/de/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/de/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/de/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/de/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/de/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/de/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/de/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/de/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/de/plugins/zalouser)         |

### Kern (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` - gebündelte Memory-Suche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` - LanceDB-gestütztes Langzeitgedächtnis mit automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Siehe [Memory LanceDB](/de/plugins/memory-lancedb) für OpenAI-kompatible
    Embedding-Einrichtung, Ollama-Beispiele, Abrufgrenzen und Fehlerbehebung.

  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Andere">
    - `browser` - gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser` CLI, die `browser.request`-Gateway-Methode, die Browser-Laufzeitumgebung und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` - VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)

  </Accordion>
</AccordionGroup>

Suchen Sie nach Plugins von Drittanbietern? Siehe [Community-Plugins](/de/plugins/community).

## Konfiguration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Feld               | Beschreibung                                             |
| ------------------ | -------------------------------------------------------- |
| `enabled`          | Hauptschalter (Standard: `true`)                         |
| `allow`            | Plugin-Allowlist (optional)                              |
| `bundledDiscovery` | Erkennungsmodus für gebündelte Plugins (standardmäßig `allowlist`) |
| `deny`             | Plugin-Denylist (optional; deny hat Vorrang)             |
| `load.paths`       | Zusätzliche Plugin-Dateien/-Verzeichnisse                |
| `slots`            | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Pro-Plugin-Schalter + Konfiguration                      |

`plugins.allow` ist exklusiv. Wenn die Liste nicht leer ist, können nur aufgeführte Plugins geladen werden
oder Tools bereitstellen, selbst wenn `tools.allow` `"*"` oder einen bestimmten Plugin-eigenen
Tool-Namen enthält. Wenn eine Tool-Allowlist auf Plugin-Tools verweist, fügen Sie die besitzenden Plugin-IDs
zu `plugins.allow` hinzu oder entfernen Sie `plugins.allow`; `openclaw doctor` warnt vor dieser
Struktur.

`plugins.bundledDiscovery` ist bei neuen Konfigurationen standardmäßig `"allowlist"`, sodass ein
restriktives `plugins.allow`-Inventar auch ausgelassene gebündelte Provider-Plugins blockiert,
einschließlich der Laufzeit-Erkennung von Web-Such-Providern. Doctor versieht ältere
restriktive Allowlist-Konfigurationen während der Migration mit `"compat"`, damit Upgrades das
bisherige Verhalten gebündelter Provider beibehalten, bis der Operator sich für den strengeren Modus entscheidet.
Ein leeres `plugins.allow` wird weiterhin als nicht gesetzt/offen behandelt.

Konfigurationsänderungen über `/plugins enable` oder `/plugins disable` lösen ein
Plugin-Neuladen im laufenden Gateway-Prozess aus. Neue Agent-Turns erstellen ihre Tool-Liste aus
der aktualisierten Plugin-Registry neu. Quellcodeändernde Vorgänge wie Installieren,
Aktualisieren und Deinstallieren starten den Gateway-Prozess weiterhin neu, da bereits importierte
Plugin-Module nicht sicher im laufenden Prozess ersetzt werden können.

`openclaw plugins list` ist ein lokaler Snapshot der Plugin-Registry/Konfiguration. Ein dort
`enabled` Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufendes Remote-Gateway
neu geladen oder mit demselben Plugin-Code neu gestartet wurde. Senden Sie bei VPS-/Container-Setups
mit Wrapper-Prozessen Neustarts oder neu ladeauslösende Schreibvorgänge an den tatsächlichen
`openclaw gateway run`-Prozess, oder verwenden Sie `openclaw gateway restart` gegen das
laufende Gateway, wenn das Neuladen einen Fehler meldet.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag quarantänisieren, indem es ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Erkennung und Vorrang

OpenClaw sucht in dieser Reihenfolge nach Plugins (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` - explizite Datei- oder Verzeichnispfade. Pfade, die zurück
    auf OpenClaws eigene verpackte gebündelte Plugin-Verzeichnisse zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliase zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
über den passenden paketierten Quellpfad bind-gemountet wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Source-Overlay und erkennt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. Dadurch funktionieren Maintainer-Container-Schleifen,
ohne jedes gebündelte Plugin zurück auf TypeScript-Quellcode umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles zu erzwingen,
selbst wenn Source-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt Plugin-Erkennungs-/Ladearbeit
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem eingebauten standardmäßig aktivierten Set, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Channel-Konfiguration oder Harness-
  Laufzeitumgebung
- Veraltete Plugin-Konfiguration bleibt erhalten, während `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn Sie veraltete IDs entfernt haben möchten
- OpenAI-Familien-Codex-Routen behalten getrennte Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `agentRuntime.id: "codex"` oder ältere
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Laufzeit-Hooks

Wenn ein Plugin in `plugins list` angezeigt wird, aber `register(api)`-Seiteneffekte oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Plugin-Installations-/Konfigurations-/Codeänderungen neu. In Wrapper-
  Containern kann PID 1 nur ein Supervisor sein; starten Sie den untergeordneten
  `openclaw gateway run`-Prozess neu oder signalisieren Sie ihn.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Conversation-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistant-Ausgabe erzeugt hat.
- Für den Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Provider-Nutzlasten das
  Gateway mit `--raw-stream --raw-stream-path <path>`.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Turns beim Vorbereiten von Tools zu stocken scheinen, aktivieren Sie Trace-Logging und
prüfen Sie auf Timing-Zeilen der Plugin-Tool-Factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] factory timings ...
```

Die Zusammenfassung listet die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factorys auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisform und ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory
mindestens 1 s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factory mindestens 5 s dauert.

OpenClaw cached erfolgreiche Plugin-Tool-Factory-Ergebnisse für wiederholte Auflösungen
mit demselben effektiven Anfragekontext. Der Cache-Schlüssel enthält die effektive
Laufzeitkonfiguration, den Workspace, Agent-/Sitzungs-IDs, Sandbox-Richtlinie, Browser-Einstellungen,
Delivery-Kontext, Requester-Identität und Ownership-Zustand, sodass Factorys, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert.

Wenn ein Plugin das Timing dominiert, prüfen Sie seine Laufzeitregistrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, reinstallieren oder deaktivieren Sie dann dieses Plugin. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory zu tun.

### Doppelte Channel- oder Tool-Ownership

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Diese bedeuten, dass mehr als ein aktiviertes Plugin versucht, denselben Channel,
Setup-Flow oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Channel-Plugin,
das neben einem gebündelten Plugin installiert ist, das nun dieselbe Channel-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen von
  Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie das Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Channel-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit der
  niedriger priorisierten Plugin-ID deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat versehentlich ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anfrage bei und
  meldet den Konflikt. Wählen Sie einen Besitzer für den Channel oder benennen Sie Plugin-eigene
  Tools um, damit die Laufzeitoberfläche eindeutig ist.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (nur eine gleichzeitig aktiv):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Was er steuert       | Standard            |
| --------------- | -------------------- | ------------------- |
| `memory`        | Active-Memory-Plugin | `memory-core`       |
| `contextEngine` | Aktive Kontext-Engine | `legacy` (eingebaut) |

## CLI-Referenz

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack direkt. Verwenden Sie `openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-Plugins. Es wird nicht mit `--link` unterstützt, da dabei der Quellpfad wiederverwendet wird, statt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die installierte Plugin-ID dieser Allowlist hinzu, bevor es sie aktiviert. Wenn dieselbe Plugin-ID in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, sodass die explizite Installation nach einem Neustart sofort geladen werden kann.

OpenClaw verwaltet eine persistierte lokale Plugin-Registry als Cold-Read-Modell für Plugin-Bestand, Besitz von Beiträgen und Startplanung. Installations-, Update-, Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry, nachdem sie den Plugin-Status geändert haben. Dieselbe Datei `plugins/installs.json` enthält dauerhafte Installationsmetadaten in `installRecords` auf oberster Ebene und wiederaufbaubare Manifestmetadaten in `plugins`. Wenn die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry --refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinien und Manifest-/Paketmetadaten neu auf, ohne Plugin-Runtime-Module zu laden. `openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Wenn eine npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben wird, wird der Paketname zurück zum nachverfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für künftige Updates gespeichert. Wenn der Paketname ohne Version übergeben wird, wird eine exakt gepinnte Installation zurück auf die Standard-Release-Linie der Registry verschoben. Wenn das installierte npm-Plugin bereits der aufgelösten Version und der gespeicherten Artefaktidentität entspricht, überspringt OpenClaw das Update, ohne herunterzuladen, neu zu installieren oder die Konfiguration neu zu schreiben. Wenn `openclaw update` im Beta-Kanal ausgeführt wird, versuchen Standardlinien-npm- und ClawHub-Plugin-Datensätze zuerst `@beta` und fallen auf standard/latest zurück, wenn kein Plugin-Beta-Release existiert. Exakte Versionen und explizite Tags bleiben gepinnt.

`--pin` ist nur für npm. Es wird nicht mit `--marketplace` unterstützt, da Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Notfallüberschreibung für False Positives des integrierten Scanners für gefährlichen Code. Damit können Plugin-Installationen und Plugin-Updates trotz integrierter `critical`-Befunde fortgesetzt werden, aber Plugin-`before_install`-Richtlinienblöcke oder Blockierungen wegen Scan-Fehlern werden weiterhin nicht umgangen. Installationsscans ignorieren übliche Testdateien und -verzeichnisse wie `tests/`, `__tests__/`, `*.test.*` und `*.spec.*`, um das Blockieren paketierter Test-Mocks zu vermeiden; deklarierte Plugin-Runtime-Einstiegspunkte werden weiterhin gescannt, selbst wenn sie einen dieser Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden stattdessen die entsprechende `dangerouslyForceUnsafeInstall`-Anfrageüberschreibung, während `openclaw skills install` der separate ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Scan ausgeblendet oder blockiert wird, öffnen Sie das ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub zu bitten, es erneut zu prüfen. `--dangerously-force-unsafe-install` wirkt sich nur auf Installationen auf Ihrem eigenen Rechner aus; es fordert ClawHub nicht auf, das Plugin erneut zu scannen oder ein blockiertes Release öffentlich zu machen.

Kompatible Bundles nehmen am selben Ablauf für Plugin-Listen, -Inspektion, -Aktivierung und -Deaktivierung teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Command-Skills, Claude-`settings.json`-Defaults, Claude-`.lsp.json`- und im Manifest deklarierte `lspServers`-Defaults, Cursor-Command-Skills und kompatible Codex-Hook-Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repository-URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben und ausschließlich relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins`-CLI-Referenz](/de/cli/plugins).

## Plugin-API-Überblick

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere Plugins verwenden möglicherweise weiterhin `activate(api)` als Legacy-Alias, neue Plugins sollten jedoch `register` verwenden.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw lädt das Entry-Objekt und ruft während der Plugin-Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück, aber gebündelte Plugins und neue externe Plugins sollten `register` als öffentlichen Vertrag betrachten.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-Aktivierung. Registrieren Sie Tools, Hooks, Dienste, Befehle, Routen und andere aktive Seiteneffekte.                          |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registrieren Sie Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code kann geladen werden, aber aktive Seiteneffekte sollten übersprungen werden. |
| `setup-only`    | Laden von Channel-Setup-Metadaten über einen leichtgewichtigen Setup-Entry.                                                             |
| `setup-runtime` | Channel-Setup-Laden, das auch den Runtime-Entry benötigt.                                                                               |
| `cli-metadata`  | Nur Erfassung von CLI-Befehlsmetadaten.                                                                                                 |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige Clients öffnen, sollten diese Seiteneffekte mit `api.registrationMode === "full"` absichern. Discovery-Ladevorgänge werden getrennt von Aktivierungsladevorgängen gecacht und ersetzen die laufende Gateway-Registry nicht. Discovery ist nicht aktivierend, aber nicht importfrei: OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Channel-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie Module auf oberster Ebene leichtgewichtig und frei von Seiteneffekten, und verschieben Sie Netzwerkclients, Subprozesse, Listener, Credential-Lesevorgänge und Dienststarts hinter Full-Runtime-Pfade.

Gängige Registrierungsmethoden:

| Methode                                 | Was registriert wird              |
| --------------------------------------- | --------------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)             |
| `registerChannel`                       | Chat-Channel                      |
| `registerTool`                          | Agent-Tool                        |
| `registerHook` / `on(...)`              | Lifecycle-Hooks                   |
| `registerSpeechProvider`                | Text-to-Speech / STT              |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                     |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme             |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse                |
| `registerImageGenerationProvider`       | Bilderzeugung                     |
| `registerMusicGenerationProvider`       | Musikerzeugung                    |
| `registerVideoGenerationProvider`       | Videoerzeugung                    |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider        |
| `registerWebSearchProvider`             | Websuche                          |
| `registerHttpRoute`                     | HTTP-Endpunkt                     |
| `registerCommand` / `registerCli`       | CLI-Befehle                       |
| `registerContextEngine`                 | Kontext-Engine                    |
| `registerService`                       | Hintergrunddienst                 |

Guard-Verhalten für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein früheres Cancel nicht auf.

Der native Codex-App-Server leitet native Codex-Tool-Ereignisse zurück in diese Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren, Ergebnisse über `after_tool_call` beobachten und an Codex-`PermissionRequest`-Freigaben teilnehmen. Die Bridge schreibt native Codex-Tool-Argumente noch nicht um. Die genaue Grenze der Codex-Runtime-Unterstützung befindet sich im [Codex-harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract).

Das vollständige Verhalten typisierter Hooks finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) - erstellen Sie Ihr eigenes Plugin
- [Plugin-Bundles](/de/plugins/bundles) - Bundle-Kompatibilität mit Codex/Claude/Cursor
- [Plugin-Manifest](/de/plugins/manifest) - Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) - Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) - Fähigkeitsmodell und Lade-Pipeline
- [Community-Plugins](/de/plugins/community) - Einträge von Drittanbietern
