---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP
    - Sie konfigurieren computerUse für das mitgelieferte Codex-Plugin
    - Sie beheben Probleme mit dem Status oder der Installation der Computernutzung von /codex
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-07-12T15:40:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin zur Steuerung des lokalen Desktops. OpenClaw
liefert die Desktop-App nicht mit, führt Desktop-Aktionen nicht selbst aus und umgeht keine
Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet lediglich den Codex-App-Server vor:
Es aktiviert die Codex-Plugin-Unterstützung, sucht oder installiert das konfigurierte Computer-Use-
Plugin, prüft, ob der MCP-Server `computer-use` verfügbar ist, und überlässt
Codex dann während Durchläufen im Codex-Modus die nativen MCP-Tool-Aufrufe.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness verwendet. Informationen zur
Einrichtung der Laufzeit selbst finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

Dies unterscheidet sich vom integrierten [Node-gestützten Computer-Tool](/nodes/computer-use) von OpenClaw. Verwenden Sie das integrierte Tool, wenn derselbe Agent-Vertrag einen gekoppelten Mac steuern soll, unabhängig davon, ob der Agent auf dem Gateway oder einem anderen Node ausgeführt wird. Verwenden Sie Codex Computer Use, wenn der Codex-App-Server die lokale MCP-Installation, Berechtigungen und nativen Tool-Aufrufe verwalten soll.

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket bereitstellen, damit die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für Peekaboos eigene
Automatisierungstools wiederverwenden kann. Diese Bridge installiert oder vermittelt Codex Computer Use nicht, und
Codex Computer Use verwendet den PeekabooBridge-Socket nicht.

Verwenden Sie die [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app als
berechtigungsbewusster Host für die Automatisierung mit der Peekaboo-CLI dienen soll. Verwenden Sie diese Seite, wenn für einen
OpenClaw-Agenten im Codex-Modus das native MCP-Plugin `computer-use` von Codex
vor Beginn des Durchlaufs verfügbar sein soll.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder vermittelt
den Codex-MCP-Server `computer-use` nicht und ist kein Backend zur Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Node und stellt mobile
Funktionen über Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent einen iPhone-Node
über das Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den
lokalen macOS-Desktop über das native Computer-Use-Plugin von Codex steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn
von OpenClaw verwaltete Laufzeiten den Treiber von TryCua direkt aufrufen sollen, verwenden Sie den vorgelagerten
Server `cua-driver mcp` über die MCP-Registry von OpenClaw anstelle des
Codex-spezifischen Marketplace-Ablaufs.

Bitten Sie `cua-driver` nach der Installation entweder um den OpenClaw-Befehl:

```bash
cua-driver mcp-config --client openclaw
```

oder registrieren Sie den stdio-Server direkt:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Weg behält die vorgelagerte MCP-Tool-Oberfläche einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten bei. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Einrichtung von Codex Computer Use auf
dieser Seite, wenn der Codex-App-Server die Plugin-Installation, das erneute Laden von MCP-Servern
und native Tool-Aufrufe innerhalb von Durchläufen im Codex-Modus verwalten soll.

Der Treiber von CUA ist macOS-spezifisch und erfordert weiterhin die lokalen macOS-Berechtigungen,
zu denen seine App auffordert, beispielsweise für Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und umgeht das
Sicherheitsmodell des vorgelagerten Treibers nicht.

## Schnelleinrichtung

Legen Sie `plugins.entries.codex.config.computerUse` fest, wenn bei Durchläufen im Codex-Modus
Computer Use vor Beginn eines Threads verfügbar sein muss. `autoInstall: true` aktiviert
Computer Use und ermöglicht OpenClaw, es vor dem Durchlauf zu installieren oder erneut zu aktivieren:

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

Mit dieser Konfiguration prüft OpenClaw den Codex-App-Server vor jedem Durchlauf im Codex-Modus.
Wenn Computer Use fehlt, der Codex-App-Server aber bereits
einen installierbaren Marketplace gefunden hat, fordert OpenClaw den Codex-App-Server auf, das Plugin zu installieren oder
erneut zu aktivieren und die MCP-Server neu zu laden. Wenn unter macOS kein passender
Marketplace registriert ist und ein Standard-Desktop-App-Bundle vorhanden ist, versucht OpenClaw
außerdem, den gebündelten Codex-Marketplace aus
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` zu registrieren, wobei
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
als Fallback für ältere eigenständige Installationen beibehalten wird. Wenn die Einrichtung den
MCP-Server weiterhin nicht verfügbar machen kann, schlägt der Durchlauf fehl, bevor der Thread beginnt.

Verwenden Sie nach Änderungen an der Computer-Use-Konfiguration `/new` oder `/reset` im betroffenen
Chat, bevor Sie testen, falls bereits ein vorhandener Codex-Thread gestartet wurde.

Unter macOS bevorzugt der verwaltete Start für Computer Use das Desktop-App-Binary unter
`/Applications/ChatGPT.app/Contents/Resources/codex` und greift dann
für ältere eigenständige Installationen auf `/Applications/Codex.app/Contents/Resources/codex` zurück.
Dies gilt auch für einmalige Status- und
Installationsbefehle von Computer Use, die einen eigenen Client starten. Dadurch bleibt die Desktop-Steuerung unter
dem App-Bundle, das die lokalen macOS-Berechtigungen besitzt. Wenn die Desktop-App nicht
installiert ist, greift OpenClaw auf das verwaltete Codex-Binary zurück, das neben dem
Plugin installiert ist. Gewöhnliche verwaltete Codex-Durchläufe mit dem standardmäßigen isolierten Agent-Home bevorzugen
zuerst dieses fixierte Paket, damit eine ältere Desktop-App die aktuelle Modellunterstützung nicht
überschreiben kann. Benutzerbezogene Homes bevorzugen weiterhin den Desktop, da sie den nativen
Computer-Use-Zustand laden können. Ein isoliertes Agent-Home, dessen effektive Codex-Konfiguration
Computer Use aktiviert, bevorzugt ebenfalls weiterhin den Desktop. Eine explizite
`appServer.command`-Konfiguration oder `OPENCLAW_CODEX_APP_SERVER_BIN` überschreibt
diese verwaltete Auswahl weiterhin.

OpenClaw serialisiert native Codex-Konfigurationslesevorgänge und die Computer-Use-Installation
innerhalb eines laufenden Gateways. Ein separater Codex-Prozess oder ein anderes Gateway ist
nicht Teil dieser Sperre. Starten Sie nach Änderungen an der nativen Codex-Plugin-Konfiguration außerhalb des
Gateways das Gateway neu und beginnen Sie einen neuen Chat, bevor Sie sich auf die neue
Auswahl verlassen.

## Befehle

Verwenden Sie die Befehle `/codex computer-use` auf jeder Chat-Oberfläche, auf der die
Befehlsoberfläche des `codex`-Plugins verfügbar ist. Dies sind OpenClaw-Chat-/Laufzeitbefehle
und keine CLI-Unterbefehle von `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist die Standardaktion und schreibgeschützt: Sie fügt keine Marketplace-
Quellen hinzu, installiert keine Plugins und aktiviert die Codex-Plugin-Unterstützung nicht. Wenn keine Konfiguration
Computer Use aktiviert, kann `status` auch nach einem einmaligen Installationsbefehl
„deaktiviert“ melden.

`install` aktiviert die Plugin-Unterstützung des Codex-App-Servers, fügt optional eine
konfigurierte Marketplace-Quelle hinzu, installiert oder reaktiviert das konfigurierte Plugin
über den Codex-App-Server, lädt MCP-Server neu und überprüft, ob der MCP-
Server Tools bereitstellt. Da die Installation vertrauenswürdige Host-Ressourcen ändert,
kann nur ein Eigentümer oder ein `operator.admin`-Gateway-Client `install` ausführen. Andere
autorisierte Absender können weiterhin den schreibgeschützten Befehl `status`
verwenden, einschließlich mit Überschreibungen.

Ältere Versionen akzeptierten einmalige Identitätsüberschreibungen mit `--plugin`, `--server` und `--mcp-server`.
Konfigurieren Sie stattdessen `computerUse.pluginName` und
`computerUse.mcpServerName` dauerhaft. Wenn ein veraltetes Identitäts-Flag
verwendet wird, nennt der Befehl die genaue Einstellung, die dauerhaft gespeichert werden soll, und wiederholt in seinen
Migrationshinweisen die angeforderte Aktion sowie alle unterstützten Marketplace-Flags.

## Marketplace-Auswahl

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder bestimmen, wo Codex `computer-use` finden soll.

| Feld                  | Verwenden, wenn                                                        | Installationsunterstützung                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Kein Marketplace-Feld | Der Codex-App-Server soll bereits bekannte Marketplaces verwenden. | Ja, wenn der App-Server einen lokalen Marketplace zurückgibt.        |
| `marketplaceSource`  | Sie haben eine Codex-Marketplace-Quelle, die der App-Server hinzufügen kann.         | Ja, für ein explizites `/codex computer-use install`.         |
| `marketplacePath`    | Sie kennen bereits den lokalen Pfad zur Marketplace-Datei auf dem Host.   | Ja, für explizite Installation und automatische Installation beim Start eines Durchlaufs.   |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marketplace nach Namen auswählen.  | Nur, wenn der ausgewählte Marketplace einen lokalen Pfad hat. |

Neue Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen
Marketplaces einzurichten. Während der Installation fragt OpenClaw `plugin/list` bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang ab (Standardwert: 60 Sekunden).

Wenn mehrere bekannte Marketplaces Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated` und anschließend `local`. Unbekannte mehrdeutige
Übereinstimmungen führen zu einem sicheren Abbruch und fordern Sie auf, `marketplaceName` oder
`marketplacePath` festzulegen.

## Gebündelter macOS-Marketplace

Aktuelle ChatGPT-Desktop-Builds bündeln Computer Use hier; ältere eigenständige
Codex-Desktop-Builds verwenden dasselbe Layout unter `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` wahr ist und kein Marketplace mit
`computer-use` registriert ist, versucht OpenClaw, das erste vorhandene standardmäßig
gebündelte Marketplace-Stammverzeichnis hinzuzufügen:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können es auch explizit aus einer Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, führen Sie einmal `/codex computer-use install
--source <marketplace-root>` aus oder setzen Sie `computerUse.marketplacePath` auf einen
lokalen Pfad zur Marketplace-Datei. Verwenden Sie `--marketplace-path` nur, wenn Sie den
Pfad zur Marketplace-JSON-Datei haben, nicht das gebündelte Marketplace-Stammverzeichnis.

### Gemeinsamer Plugin-Cache

Der Standardwert `pluginCacheMode: "independent"` lässt jedes Codex-Home und seinen
Plugin-Cache unverwaltet. Setzen Sie `pluginCacheMode: "shared"`, um das gebündelte
Computer-Use-Plugin vor dem Start des App-Servers in den auffindbaren Plugin-Cache
des aktiven Codex-Homes zu kopieren. Der gemeinsame Modus behält ältere zwischengespeicherte Versionen bei, da
laufende Codex-Clients weiterhin auf ihre versionierten Plugin-Verzeichnisse verweisen können; auch ein
fehlgeschlagener Ersetzungskopiervorgang behält den aktiven Cache bei. Eine explizite
Konfiguration von `marketplaceName` oder `marketplacePath` deaktiviert diesen
Abgleich, damit OpenClaw diese Auswahl nicht überschreibt.

## Einschränkung des Remote-Katalogs

Der Codex-App-Server kann ausschließlich remote verfügbare Katalogeinträge auflisten und lesen, unterstützt
derzeit jedoch kein entferntes `plugin/install`. Das bedeutet, dass `marketplaceName`
für Statusprüfungen einen ausschließlich remote verfügbaren Marketplace auswählen kann, Installationen und
Reaktivierungen jedoch weiterhin einen lokalen Marketplace über `marketplaceSource` oder
`marketplacePath` benötigen.

Wenn der Status angibt, dass das Plugin in einem entfernten Codex-Marketplace verfügbar ist,
die Remote-Installation jedoch nicht unterstützt wird, führen Sie die Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert   | Bedeutung                                                                                                     |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `enabled`                       | abgeleitet     | Computer Use voraussetzen. Ist standardmäßig aktiviert, wenn ein anderes Computer-Use-Feld festgelegt ist.    |
| `autoInstall`                   | false          | Zu Beginn eines Durchlaufs aus bereits erkannten Marketplaces installieren oder erneut aktivieren.            |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Wartezeit bei der Installation für die Marketplace-Erkennung des Codex-App-Servers.                           |
| `liveTestTimeoutMs`             | 60000          | Zeitlimit für den temporären Bereitschafts-Thread und dessen Bereinigungsanfragen.                             |
| `toolCallTimeoutMs`             | 60000          | Zeitlimit für den Bereitschafts-Tool-Aufruf `list_apps` von Computer Use.                                     |
| `healthCheckEnabled`            | false          | Regelmäßige Bereitschaftsprüfungen ausführen, solange der zuständige App-Server-Client aktiv ist.              |
| `healthCheckIntervalMinutes`    | 60             | Prüfintervall; zulässige Werte sind 30, 60, 120 oder 240 Minuten.                                             |
| `pluginCacheMode`               | `independent`  | Mit `shared` den Codex-Home-Cache über das mitgelieferte Desktop-Plugin aktualisieren.                         |
| `strictReadiness`               | false          | Den Start bei einer fehlgeschlagenen Live-Prüfung abbrechen, statt mit einer Warnung fortzufahren.            |
| `autoRepair`                    | false          | Veraltete, bereichsgebundene Computer-Use-MCP-Kindprozesse beenden und eine fehlgeschlagene Prüfung einmal wiederholen. |
| `marketplaceSource`             | nicht gesetzt  | An `marketplace/add` des Codex-App-Servers übergebene Quellzeichenfolge.                                       |
| `marketplacePath`               | nicht gesetzt  | Lokaler Codex-Marketplace-Dateipfad, der das Plugin enthält.                                                  |
| `marketplaceName`               | nicht gesetzt  | Auszuwählender registrierter Codex-Marketplace-Name.                                                          |
| `pluginName`                    | `computer-use` | Name des Plugins im Codex-Marketplace.                                                                        |
| `mcpServerName`                 | `computer-use` | Name des MCP-Servers, den das installierte Plugin bereitstellt.                                               |

Die automatische Installation zu Beginn eines Durchlaufs lehnt konfigurierte
`marketplaceSource`-Werte bewusst ab. Das Hinzufügen einer neuen Quelle ist ein
expliziter Einrichtungsvorgang. Verwenden Sie daher einmal
`/codex computer-use install --source <marketplace-source>` und lassen Sie
anschließend `autoInstall` künftige erneute Aktivierungen aus erkannten lokalen
Marketplaces übernehmen. Die automatische Installation zu Beginn eines
Durchlaufs kann einen konfigurierten `marketplacePath` verwenden, da dieser
bereits ein lokaler Pfad auf dem Host ist.

Jedes Feld akzeptiert außerdem eine Überschreibung durch eine Umgebungsvariable,
die geprüft wird, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist:

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

| Grund                        | Bedeutung                                                               | Nächster Schritt                                      |
| ---------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde als false ausgewertet.                      | `enabled` oder ein anderes Computer-Use-Feld festlegen. |
| `marketplace_missing`        | Kein passender Marketplace war verfügbar.                               | Quelle, Pfad oder Marketplace-Namen konfigurieren.    |
| `plugin_not_installed`       | Der Marketplace ist vorhanden, aber das Plugin ist nicht installiert.   | Installation ausführen oder `autoInstall` aktivieren. |
| `plugin_disabled`            | Das Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Installation ausführen, um es erneut zu aktivieren.   |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist ausschließlich remote verfügbar.        | `marketplaceSource` oder `marketplacePath` verwenden. |
| `mcp_missing`                | Das Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar.       | Codex Computer Use und Betriebssystemberechtigungen prüfen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                                     | Den Durchlauf im Codex-Modus starten.                 |
| `check_failed`               | Eine Anfrage an den Codex-App-Server ist während der Statusprüfung fehlgeschlagen. | App-Server-Verbindung und Protokolle prüfen.           |
| `auto_install_blocked`       | Die Einrichtung zu Beginn des Durchlaufs müsste eine neue Quelle hinzufügen. | Zuerst eine explizite Installation ausführen.         |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Server-Status, den
Marketplace, die verfügbaren Tools sowie die spezifische Meldung für den
fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der von Codex verwaltete MCP-Server benötigt
möglicherweise lokale Betriebssystemberechtigungen, bevor er Apps untersuchen
oder steuern kann. Wenn OpenClaw meldet, dass Computer Use installiert, der
MCP-Server jedoch nicht verfügbar ist, prüfen Sie zunächst die
Computer-Use-Einrichtung auf Codex-Seite:

- Der Codex-App-Server wird auf demselben Host ausgeführt, auf dem die
  Desktop-Steuerung erfolgen soll.
- Das Computer-Use-Plugin ist in der Codex-Konfiguration aktiviert.
- Der MCP-Server `computer-use` wird im MCP-Status des Codex-App-Servers angezeigt.
- macOS hat der Desktop-Steuerungs-App die erforderlichen Berechtigungen erteilt.
- Die aktuelle Host-Sitzung kann auf den zu steuernden Desktop zugreifen.

OpenClaw schlägt absichtlich nach dem Fail-Closed-Prinzip fehl, wenn `computerUse.enabled` auf „true“ gesetzt ist. Ein
Durchlauf im Codex-Modus darf nicht unbemerkt ohne die nativen Desktop-Werkzeuge
fortfahren, die von der Konfiguration vorausgesetzt werden.

## Fehlerbehebung

**Der Status meldet, dass die Installation nicht erfolgt ist.** Führen Sie `/codex computer-use install` aus. Wenn der
Marketplace nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Der Status meldet, dass die Installation erfolgt ist, aber die Funktion deaktiviert ist.** Führen Sie `/codex computer-use install`
erneut aus. Bei der Installation durch den Codex-App-Server wird die Plugin-Konfiguration wieder auf aktiviert gesetzt.

**Der Status meldet, dass eine Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marketplace-
Quelle oder einen lokalen Pfad. Reine Remote-Katalogeinträge können geprüft, aber nicht
über die aktuelle App-Server-API installiert werden.

**Der Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit die MCP-
Server neu geladen werden. Bleibt er nicht verfügbar, beheben Sie Probleme mit der Codex Computer Use-App,
dem MCP-Status des Codex-App-Servers oder den macOS-Berechtigungen.

**Beim Status oder bei einer Prüfung tritt für `computer-use.list_apps` eine Zeitüberschreitung auf.** Das Plugin und
der MCP-Server sind vorhanden, aber die lokale Computer Use-Bridge hat nicht geantwortet.
Beenden oder starten Sie Codex Computer Use neu, starten Sie Codex Desktop bei Bedarf erneut und
versuchen Sie es dann in einer neuen OpenClaw-Sitzung erneut. Wenn auf dem Host Computer Use zuvor
über einen älteren verwalteten Codex-App-Server ausgeführt wurde, aktualisieren Sie das installierte Plugin aus
dem im Desktop enthaltenen Marketplace (verwenden Sie für eigenständige
Codex-Desktop-Installationen den Pfad `Codex.app`):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Ein Computer Use-Werkzeug meldet `Native hook relay unavailable`.** Der
Codex-native Werkzeug-Hook konnte über die lokale Bridge oder den Gateway-Fallback kein aktives OpenClaw-Relay erreichen.
Starten Sie mit `/new` oder `/reset` eine neue OpenClaw-Sitzung.
Wenn es einmal funktioniert und bei einem späteren Werkzeugaufruf erneut fehlschlägt,
bereinigt `/new` nur den aktuellen Versuch. Starten Sie den Codex-App-Server oder den
OpenClaw Gateway neu, damit alte Threads und Hook-Registrierungen verworfen werden, und
versuchen Sie es anschließend in einer neuen Sitzung erneut.

**Die automatische Installation beim Start eines Durchlaufs lehnt eine Quelle ab.** Dies ist beabsichtigt. Fügen Sie die
Quelle zunächst explizit mit `/codex computer-use install --source
<marketplace-source>` hinzu. Danach kann die automatische Installation beim Start zukünftiger Durchläufe den
erkannten lokalen Marketplace verwenden.

## Verwandte Themen

- [Codex-Testumgebung](/de/plugins/codex-harness)
- [Peekaboo-Bridge](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
