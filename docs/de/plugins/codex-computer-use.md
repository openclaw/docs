---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden sich zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP.
    - Sie konfigurieren computerUse für das gebündelte Codex-Plugin
    - Sie beheben Probleme mit dem Status oder der Installation der Computernutzung von `/codex`
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-07-24T05:04:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 02836a6bc80bc1bd956db6cb9a7ed9be32d2192c8c95d372a4697dd24deeb2f3
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin zur lokalen Desktop-Steuerung. OpenClaw
liefert die Desktop-App nicht mit, führt Desktop-Aktionen nicht selbst aus und umgeht
keine Codex-Berechtigungen. Das mitgelieferte `codex`-Plugin bereitet lediglich den Codex-App-Server vor:
Es aktiviert die Unterstützung für Codex-Plugins, sucht oder installiert das konfigurierte Computer-Use-
Plugin, prüft, ob der `computer-use`-MCP-Server verfügbar ist, und überlässt
Codex anschließend während Ausführungen im Codex-Modus die nativen MCP-Tool-Aufrufe.

Verwenden Sie diese Seite, wenn OpenClaw bereits den nativen Codex-Harness verwendet. Informationen zur
Einrichtung der Runtime selbst finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

Dies unterscheidet sich vom integrierten [Node-gestützten Computer-Tool](/de/nodes/computer-use) von OpenClaw. Verwenden Sie das integrierte Tool, wenn derselbe Agent-Vertrag einen gekoppelten Mac steuern soll, unabhängig davon, ob der Agent auf dem Gateway oder einem anderen Node ausgeführt wird. Verwenden Sie Codex Computer Use, wenn der Codex-App-Server die lokale MCP-Installation, Berechtigungen und nativen Tool-Aufrufe verwalten soll.

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket bereitstellen, damit die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für Peekaboos eigene
Automatisierungs-Tools wiederverwenden kann. Diese Bridge installiert oder vermittelt Codex Computer Use nicht, und
Codex Computer Use ruft nichts über den PeekabooBridge-Socket auf.

Verwenden Sie die [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app als
berechtigungsbewusster Host für die Automatisierung mit der Peekaboo-CLI dienen soll. Verwenden Sie diese Seite, wenn für einen
OpenClaw-Agenten im Codex-Modus das native `computer-use`-MCP-Plugin von Codex
vor Beginn der Ausführung verfügbar sein soll.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder vermittelt
den Codex-`computer-use`-MCP-Server nicht und ist kein Backend zur Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Node und stellt mobile
Funktionen über Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent einen iPhone-Node
über das Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den
lokalen macOS-Desktop über das native Computer-Use-Plugin von Codex steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn
von OpenClaw verwaltete Runtimes den Treiber von TryCua direkt aufrufen sollen, verwenden Sie den vorgelagerten
`cua-driver mcp`-Server über die MCP-Registry von OpenClaw anstelle des
Codex-spezifischen Marketplace-Ablaufs.

Bitten Sie ihn nach der Installation von `cua-driver` entweder um den OpenClaw-Befehl:

```bash
cua-driver mcp-config --client openclaw
```

oder registrieren Sie den stdio-Server direkt:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad bewahrt die vorgelagerte MCP-Tool-Oberfläche einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Einrichtung von Codex Computer Use auf
dieser Seite, wenn der Codex-App-Server die Plugin-Installation, das erneute Laden von MCP-Servern
und native Tool-Aufrufe innerhalb von Ausführungen im Codex-Modus verwalten soll.

Der Treiber von CUA wird als Vorabversion für macOS, Windows (x64 und ARM64) und
Linux (x64 und ARM64, Vorschau-Stufe) ausgeliefert. Er benötigt weiterhin die lokalen Betriebssystem-
berechtigungen, zu deren Erteilung seine App auffordert, beispielsweise Bedienungshilfen und Bildschirmaufnahme unter
macOS. OpenClaw installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und
umgeht das Sicherheitsmodell des vorgelagerten Treibers nicht.

## Schnelleinrichtung

Legen Sie `plugins.entries.codex.config.computerUse` fest, wenn Computer Use für Ausführungen im Codex-Modus
vor dem Start eines Threads verfügbar sein muss. `autoInstall: true` aktiviert
Computer Use und erlaubt OpenClaw, es vor der Ausführung zu installieren oder erneut zu aktivieren:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Mit dieser Konfiguration prüft OpenClaw vor jeder Ausführung im Codex-Modus den Codex-App-
Server. Wenn Computer Use fehlt, der Codex-App-Server jedoch bereits
einen installierbaren Marketplace gefunden hat, weist OpenClaw den Codex-App-Server an, das
Plugin zu installieren oder erneut zu aktivieren und die MCP-Server neu zu laden. Wenn unter macOS kein passender
Marketplace registriert ist und ein standardmäßiges Desktop-App-Bundle vorhanden ist, versucht OpenClaw
außerdem, den mitgelieferten Codex-Marketplace aus
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` zu registrieren, wobei
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als
Fallback für ältere eigenständige Installationen erhalten bleibt. Wenn die Einrichtung den
MCP-Server dennoch nicht verfügbar machen kann, schlägt die Ausführung vor dem Start des Threads fehl.

Verwenden Sie nach einer Änderung der Computer-Use-Konfiguration im betroffenen
Chat `/new` oder `/reset`, bevor Sie testen, falls bereits ein Codex-Thread gestartet wurde.

Unter macOS bevorzugt der verwaltete Start für Computer Use das Desktop-App-Binary unter
`/Applications/ChatGPT.app/Contents/Resources/codex` und greift anschließend
für ältere eigenständige Installationen auf `/Applications/Codex.app/Contents/Resources/codex` zurück.
Dies gilt auch für einmalige Computer-Use-Status- und Installationsbefehle,
die einen eigenen Client starten. Dadurch bleibt die Desktop-Steuerung unter dem
App-Bundle, dem die lokalen macOS-Berechtigungen gehören. Wenn die Desktop-App nicht
installiert ist, greift OpenClaw auf das verwaltete Codex-Binary zurück, das neben dem
Plugin installiert ist. Gewöhnliche verwaltete Codex-Ausführungen mit dem standardmäßigen isolierten Agent-Home bevorzugen
zuerst dieses angeheftete Paket, damit eine ältere Desktop-App die aktuelle Modell-
unterstützung nicht überlagern kann. Benutzerbezogene Homes bevorzugen weiterhin den Desktop, da sie nativen
Computer-Use-Zustand laden können. Ein isoliertes Agent-Home, dessen effektive Codex-Konfiguration
Computer Use aktiviert, bevorzugt ebenfalls weiterhin den Desktop. Eine explizite
Konfiguration von `appServer.command` oder `OPENCLAW_CODEX_APP_SERVER_BIN` überschreibt
diese verwaltete Auswahl weiterhin.

OpenClaw serialisiert native Lesevorgänge der Codex-Konfiguration und die Installation von Computer Use
innerhalb eines laufenden Gateways. Ein separater Codex-Prozess oder ein anderes Gateway ist nicht
Teil dieser Sperre. Starten Sie nach einer Änderung der nativen Codex-Plugin-Konfiguration außerhalb des
Gateways das Gateway neu und beginnen Sie einen neuen Chat, bevor Sie sich auf die neue
Auswahl verlassen.

## Befehle

Verwenden Sie die `/codex computer-use`-Befehle von jeder Chat-Oberfläche aus, auf der die
Plugin-Befehlsoberfläche von `codex` verfügbar ist. Dies sind OpenClaw-Chat-/Runtime-
Befehle, keine Unterbefehle der `openclaw codex ...`-CLI:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist die Standardaktion und schreibgeschützt: Sie fügt keine Marketplace-
Quellen hinzu, installiert keine Plugins und aktiviert die Unterstützung für Codex-Plugins nicht. Wenn Computer Use durch keine Konfiguration
aktiviert wird, kann `status` selbst nach einem einmaligen Installationsbefehl
„deaktiviert“ melden.

`install` aktiviert die Plugin-Unterstützung des Codex-App-Servers, fügt optional eine
konfigurierte Marketplace-Quelle hinzu, installiert oder reaktiviert das konfigurierte Plugin
über den Codex-App-Server, lädt die MCP-Server neu und überprüft, ob der MCP-
Server Tools bereitstellt. Da die Installation vertrauenswürdige Host-Ressourcen ändert,
kann nur ein Eigentümer oder ein `operator.admin`-Gateway-Client `install` ausführen. Andere
autorisierte Absender können weiterhin den schreibgeschützten `status`-Befehl verwenden,
auch mit Überschreibungen.

Ältere Versionen akzeptierten einmalige Identitätsüberschreibungen über `--plugin`, `--server` und `--mcp-server`.
Konfigurieren Sie stattdessen `computerUse.pluginName` und
`computerUse.mcpServerName` dauerhaft. Wenn ein älteres Identitäts-Flag
verwendet wird, nennt der Befehl die genaue dauerhaft festzulegende Einstellung und wiederholt in seinen
Migrationshinweisen die angeforderte Aktion sowie alle unterstützten Marketplace-Flags.

## Marketplace-Auswahl

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder legen fest, wo Codex `computer-use` finden soll.

| Feld                 | Verwenden, wenn                                                  | Installationsunterstützung                                         |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Kein Marketplace-Feld | Der Codex-App-Server soll bereits bekannte Marketplaces verwenden. | Ja, wenn der App-Server einen lokalen Marketplace zurückgibt.      |
| `marketplaceSource`  | Sie haben eine Codex-Marketplace-Quelle, die der App-Server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.                  |
| `marketplacePath`    | Sie kennen bereits den lokalen Pfad zur Marketplace-Datei auf dem Host. | Ja, für explizite Installation und automatische Installation beim Start der Ausführung. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marketplace nach Namen auswählen. | Ja, aber nur, wenn der ausgewählte Marketplace einen lokalen Pfad hat. |

Neue Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen
Marketplaces zu initialisieren. Während der Installation fragt OpenClaw `plugin/list` bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang ab (standardmäßig 60 Sekunden).

Wenn mehrere bekannte Marketplaces Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated` und anschließend `local`. Unbekannte mehrdeutige
Treffer führen zu einem sicheren Abbruch und fordern Sie auf, `marketplaceName` oder
`marketplacePath` festzulegen.

## Mitgelieferter macOS-Marketplace

Aktuelle ChatGPT-Desktop-Builds enthalten Computer Use hier; ältere eigenständige
Codex-Desktop-Builds verwenden dasselbe Layout unter `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` auf „true“ gesetzt ist und kein Marketplace registriert ist, der
`computer-use` enthält, versucht OpenClaw, das erste vorhandene standardmäßig
mitgelieferte Marketplace-Stammverzeichnis hinzuzufügen:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können es auch explizit über eine Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, führen Sie `/codex computer-use install
--source <marketplace-root>` einmal aus oder setzen Sie `computerUse.marketplacePath` auf einen
lokalen Pfad zu einer Marketplace-Datei. Verwenden Sie `--marketplace-path` nur, wenn Sie den
Pfad zur Marketplace-JSON-Datei haben, nicht das mitgelieferte Marketplace-Stammverzeichnis.

### Gemeinsamer Plugin-Cache

Die Standardeinstellung `pluginCacheMode: "independent"` lässt jedes Codex-Home und dessen
Plugin-Cache unverwaltet. Setzen Sie `pluginCacheMode: "shared"`, um das mitgelieferte
Computer-Use-Plugin vor dem Start des App-Servers in den auffindbaren Plugin-Cache
des aktiven Codex-Homes zu kopieren. Der gemeinsame Modus behält ältere zwischengespeicherte Versionen bei, da
laufende Codex-Clients weiterhin auf ihre versionierten Plugin-Verzeichnisse verweisen können; auch bei einem
fehlgeschlagenen Ersetzungskopiervorgang bleibt der aktive Cache erhalten. Eine explizite Konfiguration von
`marketplaceName` oder `marketplacePath` deaktiviert diesen
Abgleich, damit OpenClaw diese Auswahl nicht überschreibt.

## Einschränkung des Remote-Katalogs

Der Codex-App-Server kann ausschließlich remote verfügbare Katalogeinträge auflisten und lesen, unterstützt
derzeit jedoch kein entferntes `plugin/install`. Das bedeutet, dass `marketplaceName`
einen ausschließlich remote verfügbaren Marketplace für Statusprüfungen auswählen kann, Installationen und
Reaktivierungen jedoch weiterhin einen lokalen Marketplace über `marketplaceSource` oder
`marketplacePath` benötigen.

Wenn der Status meldet, dass das Plugin in einem entfernten Codex-Marketplace verfügbar ist,
die Remote-Installation jedoch nicht unterstützt wird, führen Sie die Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert   | Bedeutung                                                                                   |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `enabled`                       | abgeleitet     | Computer Use voraussetzen. Standardmäßig aktiviert, wenn ein anderes Computer-Use-Feld festgelegt ist. |
| `autoInstall`                   | false          | Zu Beginn eines Turns aus bereits erkannten Marketplaces installieren oder erneut aktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Dauer, die die Installation auf die Marketplace-Erkennung durch den Codex-App-Server wartet. |
| `liveTestTimeoutMs`             | 60000          | Zeitlimit für den temporären Bereitschafts-Thread und seine Bereinigungsanfragen.            |
| `toolCallTimeoutMs`             | 60000          | Zeitlimit für den Aufruf des Computer-Use-Bereitschaftstools `list_apps`.             |
| `healthCheckEnabled`            | false          | Regelmäßige Bereitschaftsprüfungen ausführen, solange der zuständige App-Server-Client aktiv ist. |
| `healthCheckIntervalMinutes`    | 60             | Prüfintervall; zulässige Werte sind 30, 60, 120 oder 240 Minuten.                            |
| `pluginCacheMode`               | `independent`  | `shared` verwenden, um den Codex-Home-Cache über das gebündelte Desktop-Plugin zu aktualisieren. |
| `strictReadiness`               | false          | Den Start bei einer fehlgeschlagenen Live-Prüfung abbrechen, statt mit einer Warnung fortzufahren. |
| `autoRepair`                    | false          | Veraltete bereichsgebundene Computer-Use-MCP-Kindprozesse beenden und eine fehlgeschlagene Prüfung einmal wiederholen. |
| `marketplaceSource`             | nicht festgelegt | An Codex-App-Server `marketplace/add` übergebene Quellzeichenfolge.                         |
| `marketplacePath`               | nicht festgelegt | Lokaler Pfad zur Codex-Marketplace-Datei, die das Plugin enthält.                            |
| `marketplaceName`               | nicht festgelegt | Name des registrierten Codex-Marketplace, der ausgewählt werden soll.                       |
| `pluginName`                    | `computer-use` | Name des Codex-Marketplace-Plugins.                                                         |
| `mcpServerName`                 | `computer-use` | Name des MCP-Servers, den das installierte Plugin bereitstellt.                             |

Die automatische Installation zu Beginn eines Turns lehnt konfigurierte
`marketplaceSource`-Werte absichtlich ab. Das Hinzufügen einer neuen Quelle ist
ein expliziter Einrichtungsvorgang. Verwenden Sie daher einmal
`/codex computer-use install --source <marketplace-source>` und lassen Sie anschließend
`autoInstall` zukünftige erneute Aktivierungen aus erkannten lokalen Marketplaces
übernehmen. Die automatische Installation zu Beginn eines Turns kann einen
konfigurierten `marketplacePath` verwenden, da dies bereits ein lokaler Pfad
auf dem Host ist.

Jedes Feld akzeptiert außerdem eine Überschreibung durch eine Umgebungsvariable,
die geprüft wird, wenn der entsprechende Konfigurationsschlüssel nicht festgelegt ist:

| Feld                            | Umgebungsvariable                                               |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den
benutzerseitigen Status für den Chat:

| Grund                        | Bedeutung                                              | Nächster Schritt                                |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde als false aufgelöst.       | `enabled` oder ein anderes Computer-Use-Feld festlegen. |
| `marketplace_missing`        | Kein passender Marketplace war verfügbar.              | Quelle, Pfad oder Marketplace-Namen konfigurieren. |
| `plugin_not_installed`       | Der Marketplace ist vorhanden, aber das Plugin ist nicht installiert. | Installation ausführen oder `autoInstall` aktivieren. |
| `plugin_disabled`            | Das Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Installation ausführen, um es erneut zu aktivieren. |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist ausschließlich remote verfügbar. | `marketplaceSource` oder `marketplacePath` verwenden. |
| `mcp_missing`                | Das Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Codex Computer Use und die Betriebssystemberechtigungen prüfen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                  | Den Turn im Codex-Modus starten.                |
| `check_failed`               | Eine Anfrage an den Codex-App-Server ist während der Statusprüfung fehlgeschlagen. | App-Server-Verbindung und Protokolle prüfen. |
| `auto_install_blocked`       | Die Einrichtung zu Beginn des Turns müsste eine neue Quelle hinzufügen. | Zuerst eine explizite Installation ausführen. |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Server-Status, den Marketplace,
die verfügbaren Tools und die spezifische Meldung für den fehlgeschlagenen
Einrichtungsschritt.

## macOS-Berechtigungen

Dieser von Codex verwaltete Computer-Use-Pfad wird unter macOS ausgeführt, wo
der MCP-Server möglicherweise lokale Betriebssystemberechtigungen benötigt,
bevor er Apps untersuchen oder steuern kann. (Informationen zur
plattformübergreifenden Desktop-Steuerung auf Windows- und Linux-Node-Hosts
finden Sie unter [cua-computer-Fulfiller](/de/nodes/computer-use#windows-and-linux-experimental-via-cua-driver).)
Wenn OpenClaw meldet, dass Computer Use installiert, der MCP-Server jedoch
nicht verfügbar ist, prüfen Sie zunächst die Computer-Use-Einrichtung auf der
Codex-Seite:

- Der Codex-App-Server wird auf demselben Host ausgeführt, auf dem die Desktop-Steuerung
  stattfinden soll.
- Das Computer-Use-Plugin ist in der Codex-Konfiguration aktiviert.
- Der MCP-Server `computer-use` wird im MCP-Status des Codex-App-Servers angezeigt.
- macOS hat der App zur Desktop-Steuerung die erforderlichen Berechtigungen erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw bricht absichtlich sicher ab, wenn `computerUse.enabled` true ist. Ein
Turn im Codex-Modus darf nicht unbemerkt ohne die nativen Desktop-Tools
fortgesetzt werden, die von der Konfiguration vorausgesetzt werden.

## Fehlerbehebung

**Der Status meldet, dass das Plugin nicht installiert ist.** Führen Sie
`/codex computer-use install` aus. Wenn der Marketplace nicht erkannt wird, übergeben Sie
`--source` oder `--marketplace-path`.

**Der Status meldet, dass das Plugin installiert, aber deaktiviert ist.** Führen
Sie `/codex computer-use install` erneut aus. Die Installation über den Codex-App-Server
schreibt die Plugin-Konfiguration im aktivierten Zustand zurück.

**Der Status meldet, dass die Remote-Installation nicht unterstützt wird.**
Verwenden Sie eine lokale Marketplace-Quelle oder einen lokalen Pfad.
Katalogeinträge, die ausschließlich remote verfügbar sind, können untersucht,
aber nicht über die aktuelle App-Server-API installiert werden.

**Der Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die
Installation einmal erneut aus, damit die MCP-Server neu geladen werden. Wenn
der Server weiterhin nicht verfügbar ist, beheben Sie Probleme mit der Codex
Computer Use-App, dem MCP-Status des Codex-App-Servers oder den
macOS-Berechtigungen.

**Der Status oder eine Prüfung überschreitet bei `computer-use.list_apps` das
Zeitlimit.** Das Plugin und der MCP-Server sind vorhanden, aber die lokale
Computer-Use-Bridge hat nicht geantwortet. Beenden oder starten Sie Codex
Computer Use neu, starten Sie bei Bedarf Codex Desktop neu und versuchen Sie
es anschließend in einer neuen OpenClaw-Sitzung erneut. Wenn Computer Use auf
dem Host zuvor über einen älteren verwalteten Codex-App-Server ausgeführt
wurde, aktualisieren Sie das installierte Plugin über den gebündelten
Desktop-Marketplace. Verwenden Sie für eigenständige Codex-Desktop-Installationen
den Pfad `Codex.app`:

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Ein Computer-Use-Tool meldet `Native hook relay unavailable`.** Der native
Codex-Tool-Hook konnte über die lokale Bridge oder den Gateway-Fallback kein
aktives OpenClaw-Relay erreichen. Starten Sie eine neue OpenClaw-Sitzung mit
`/new` oder `/reset`. Wenn dies einmal funktioniert und
bei einem späteren Tool-Aufruf erneut fehlschlägt, bereinigt
`/new` nur den aktuellen Versuch. Starten Sie den Codex-App-Server
oder den OpenClaw Gateway neu, damit alte Threads und Hook-Registrierungen
verworfen werden, und versuchen Sie es anschließend in einer neuen Sitzung
erneut.

**Die automatische Installation zu Beginn eines Turns lehnt eine Quelle ab.**
Dies ist beabsichtigt. Fügen Sie die Quelle zuerst explizit mit
`/codex computer-use install --source
<marketplace-source>` hinzu. Zukünftige automatische Installationen zu Beginn eines
Turns können dann den erkannten lokalen Marketplace verwenden.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Peekaboo-Bridge](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
