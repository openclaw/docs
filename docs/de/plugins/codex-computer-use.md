---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden sich zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP
    - Sie konfigurieren computerUse für das gebündelte Codex-Plugin
    - Sie beheben Probleme mit dem Computer-Use-Status oder der Installation von /codex
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-07-12T01:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin zur lokalen Desktop-Steuerung. OpenClaw
liefert die Desktop-App nicht mit, führt Desktop-Aktionen nicht selbst aus und umgeht
keine Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet lediglich den Codex-App-Server vor:
Es aktiviert die Codex-Plugin-Unterstützung, sucht oder installiert das konfigurierte Computer-Use-
Plugin, prüft, ob der MCP-Server `computer-use` verfügbar ist, und überlässt
Codex anschließend während Durchläufen im Codex-Modus die nativen MCP-Tool-Aufrufe.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness verwendet. Informationen zur
Einrichtung der Laufzeit selbst finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

Dies unterscheidet sich vom integrierten [Node-gestützten Computer-Tool](/de/nodes/computer-use) von OpenClaw. Verwenden Sie das integrierte Tool, wenn derselbe Agent-Vertrag einen gekoppelten Mac steuern soll, unabhängig davon, ob der Agent auf dem Gateway oder einem anderen Node ausgeführt wird. Verwenden Sie Codex Computer Use, wenn der Codex-App-Server die lokale MCP-Installation, Berechtigungen und nativen Tool-Aufrufe verwalten soll.

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket bereitstellen, sodass die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für Peekaboos eigene
Automatisierungs-Tools wiederverwenden kann. Diese Bridge installiert oder vermittelt Codex Computer Use nicht, und
Codex Computer Use führt keine Aufrufe über den PeekabooBridge-Socket aus.

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

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn Sie
möchten, dass von OpenClaw verwaltete Laufzeiten den Treiber von TryCua direkt aufrufen, verwenden Sie den vorgelagerten
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

Dieser Pfad erhält die vorgelagerte MCP-Tool-Oberfläche einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Einrichtung für Codex Computer Use auf
dieser Seite, wenn der Codex-App-Server die Plugin-Installation, das erneute Laden von MCP-Servern
und native Tool-Aufrufe innerhalb von Durchläufen im Codex-Modus verwalten soll.

Der Treiber von CUA ist macOS-spezifisch und benötigt weiterhin die lokalen macOS-Berechtigungen,
zu denen seine App auffordert, etwa für Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und umgeht das Sicherheitsmodell
des vorgelagerten Treibers nicht.

## Schnelleinrichtung

Legen Sie `plugins.entries.codex.config.computerUse` fest, wenn für Durchläufe im Codex-Modus
Computer Use verfügbar sein muss, bevor ein Thread beginnt. `autoInstall: true` aktiviert
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
Wenn Computer Use fehlt, der Codex-App-Server jedoch bereits
einen installierbaren Marketplace erkannt hat, fordert OpenClaw den Codex-App-Server auf, das
Plugin zu installieren oder erneut zu aktivieren und die MCP-Server neu zu laden. Wenn unter macOS kein passender
Marketplace registriert ist und ein standardmäßiges Desktop-App-Bundle vorhanden ist, versucht OpenClaw
außerdem, den gebündelten Codex-Marketplace aus
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` zu registrieren, wobei
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
als Fallback für ältere eigenständige Installationen beibehalten wird. Wenn die Einrichtung den
MCP-Server weiterhin nicht verfügbar machen kann, schlägt der Durchlauf fehl, bevor der Thread beginnt.

Verwenden Sie nach einer Änderung der Computer-Use-Konfiguration `/new` oder `/reset` im betroffenen
Chat, bevor Sie testen, falls bereits ein bestehender Codex-Thread gestartet wurde.

Unter macOS bevorzugt der verwaltete Start für Computer Use die Binärdatei der Desktop-App unter
`/Applications/ChatGPT.app/Contents/Resources/codex` und verwendet anschließend
`/Applications/Codex.app/Contents/Resources/codex` als Fallback für ältere
eigenständige Installationen. Dies gilt auch für einmalige Computer-Use-Status- und
Installationsbefehle, die einen eigenen Client starten. Dadurch bleibt die Desktop-Steuerung unter
dem App-Bundle, dem die lokalen macOS-Berechtigungen gehören. Wenn die Desktop-App nicht
installiert ist, verwendet OpenClaw als Fallback die verwaltete Codex-Binärdatei, die neben dem
Plugin installiert ist. Gewöhnliche verwaltete Codex-Durchläufe mit dem standardmäßigen isolierten Agent-Home bevorzugen
zuerst dieses angeheftete Paket, damit eine ältere Desktop-App die aktuelle Modellunterstützung
nicht überlagern kann. Benutzerbezogene Homes bevorzugen weiterhin die Desktop-App, da sie den nativen
Computer-Use-Zustand laden können. Ein isoliertes Agent-Home, dessen wirksame Codex-Konfiguration
Computer Use aktiviert, bevorzugt ebenfalls weiterhin die Desktop-App. Eine explizite
Konfiguration von `appServer.command` oder `OPENCLAW_CODEX_APP_SERVER_BIN` setzt
diese verwaltete Auswahl weiterhin außer Kraft.

OpenClaw serialisiert native Codex-Konfigurationslesevorgänge und die Computer-Use-Installation
innerhalb eines laufenden Gateways. Ein separater Codex-Prozess oder ein anderes Gateway ist
nicht Teil dieser Absicherung. Starten Sie nach einer Änderung der nativen Codex-Plugin-Konfiguration außerhalb des
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
über den Codex-App-Server, lädt die MCP-Server neu und überprüft, ob der MCP-
Server Tools bereitstellt. Da die Installation vertrauenswürdige Host-Ressourcen ändert,
kann nur ein Eigentümer oder ein `operator.admin`-Gateway-Client `install` ausführen. Andere
autorisierte Absender können weiterhin den schreibgeschützten Befehl `status`
verwenden, auch mit Überschreibungen.

Ältere Versionen akzeptierten einmalige Identitätsüberschreibungen mit `--plugin`, `--server` und `--mcp-server`.
Konfigurieren Sie stattdessen `computerUse.pluginName` und
`computerUse.mcpServerName` dauerhaft. Wenn ein älteres Identitäts-Flag
verwendet wird, benennt der Befehl die genaue dauerhaft zu speichernde Einstellung und wiederholt die
angeforderte Aktion sowie alle unterstützten Marketplace-Flags in seinen Migrationshinweisen.

## Marketplace-Auswahlmöglichkeiten

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder bestimmen, wo Codex `computer-use` finden soll.

| Feld                  | Verwenden, wenn                                                                 | Installationsunterstützung                                                |
| --------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Kein Marketplace-Feld | Der Codex-App-Server soll bereits bekannte Marketplaces verwenden.              | Ja, wenn der App-Server einen lokalen Marketplace zurückgibt.             |
| `marketplaceSource`   | Sie haben eine Codex-Marketplace-Quelle, die der App-Server hinzufügen kann.     | Ja, für ein explizites `/codex computer-use install`.                     |
| `marketplacePath`     | Sie kennen bereits den lokalen Pfad zur Marketplace-Datei auf dem Host.          | Ja, für die explizite Installation und automatische Installation beim Durchlaufstart. |
| `marketplaceName`     | Sie möchten einen bereits registrierten Marketplace anhand seines Namens auswählen. | Nur, wenn der ausgewählte Marketplace einen lokalen Pfad besitzt.      |

Neue Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen
Marketplaces einzurichten. Während der Installation fragt OpenClaw bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang `plugin/list` ab (standardmäßig 60 Sekunden).

Wenn mehrere bekannte Marketplaces Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated` und anschließend `local`. Unbekannte mehrdeutige
Übereinstimmungen werden sicher abgelehnt und fordern Sie auf, `marketplaceName` oder
`marketplacePath` festzulegen.

## Gebündelter macOS-Marketplace

Aktuelle ChatGPT-Desktop-Builds bündeln Computer Use hier; ältere eigenständige
Codex-Desktop-Builds verwenden dieselbe Struktur unter `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` auf `true` gesetzt ist und kein Marketplace mit
`computer-use` registriert ist, versucht OpenClaw, das erste vorhandene standardmäßige
gebündelte Marketplace-Stammverzeichnis hinzuzufügen:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können es auch explizit über eine Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Pfad zur Codex-App verwenden, führen Sie einmalig `/codex computer-use install
--source <marketplace-root>` aus oder legen Sie `computerUse.marketplacePath` auf einen
lokalen Pfad zu einer Marketplace-Datei fest. Verwenden Sie `--marketplace-path` nur, wenn Sie den
Pfad zur Marketplace-JSON-Datei haben, nicht das gebündelte Marketplace-Stammverzeichnis.

### Gemeinsamer Plugin-Cache

Der Standardwert `pluginCacheMode: "independent"` lässt jedes Codex-Home und dessen
Plugin-Cache unverwaltet. Legen Sie `pluginCacheMode: "shared"` fest, um das gebündelte
Computer-Use-Plugin vor dem Start des App-Servers in den auffindbaren Plugin-Cache des aktiven Codex-Homes
zu kopieren. Der gemeinsame Modus bewahrt ältere zwischengespeicherte Versionen auf, da
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

Wenn der Status meldet, dass das Plugin in einem entfernten Codex-Marketplace verfügbar ist, die
entfernte Installation jedoch nicht unterstützt wird, führen Sie die Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert   | Bedeutung                                                                                                      |
| ------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `enabled`                       | abgeleitet     | Computer Use voraussetzen. Standardmäßig aktiviert, wenn ein anderes Computer-Use-Feld festgelegt ist.         |
| `autoInstall`                   | false          | Zu Beginn eines Durchlaufs aus bereits erkannten Marketplaces installieren oder erneut aktivieren.             |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Wie lange die Installation auf die Marketplace-Erkennung durch den Codex app-server wartet.                    |
| `liveTestTimeoutMs`             | 60000          | Zeitüberschreitung für den temporären Bereitschafts-Thread und seine Bereinigungsanfragen.                      |
| `toolCallTimeoutMs`             | 60000          | Zeitüberschreitung für den Bereitschafts-Tool-Aufruf `list_apps` von Computer Use.                              |
| `healthCheckEnabled`            | false          | Regelmäßige Bereitschaftsprüfungen ausführen, solange der zugehörige app-server-Client aktiv ist.               |
| `healthCheckIntervalMinutes`    | 60             | Prüfintervall; zulässige Werte sind 30, 60, 120 oder 240 Minuten.                                              |
| `pluginCacheMode`               | `independent`  | Mit `shared` den Codex-Home-Cache aus dem gebündelten Desktop-Plugin aktualisieren.                             |
| `strictReadiness`               | false          | Den Start bei einer fehlgeschlagenen Live-Prüfung abbrechen, statt mit einer Warnung fortzufahren.             |
| `autoRepair`                    | false          | Veraltete, bereichsgebundene Computer-Use-MCP-Kindprozesse beenden und eine fehlgeschlagene Prüfung wiederholen. |
| `marketplaceSource`             | nicht gesetzt  | Quellzeichenfolge, die an `marketplace/add` des Codex app-server übergeben wird.                               |
| `marketplacePath`               | nicht gesetzt  | Lokaler Pfad zur Codex-Marketplace-Datei, die das Plugin enthält.                                              |
| `marketplaceName`               | nicht gesetzt  | Name des registrierten Codex-Marketplace, der ausgewählt werden soll.                                         |
| `pluginName`                    | `computer-use` | Name des Codex-Marketplace-Plugins.                                                                            |
| `mcpServerName`                 | `computer-use` | Name des MCP-Servers, den das installierte Plugin bereitstellt.                                                |

Die automatische Installation zu Beginn eines Durchlaufs lehnt konfigurierte
`marketplaceSource`-Werte absichtlich ab. Das Hinzufügen einer neuen Quelle ist
ein expliziter Einrichtungsvorgang. Verwenden Sie daher einmal
`/codex computer-use install --source <marketplace-source>` und lassen Sie
anschließend `autoInstall` zukünftige erneute Aktivierungen aus erkannten
lokalen Marketplaces übernehmen. Die automatische Installation zu Beginn eines
Durchlaufs kann einen konfigurierten `marketplacePath` verwenden, da dieser
bereits ein lokaler Pfad auf dem Host ist.

Jedes Feld akzeptiert außerdem eine Überschreibung durch eine Umgebungsvariable,
die geprüft wird, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt
ist:

| Feld                            | Umgebungsvariable                                              |
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

| Grund                        | Bedeutung                                                                      | Nächster Schritt                                      |
| ---------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde als false aufgelöst.                               | `enabled` oder ein anderes Computer-Use-Feld setzen.  |
| `marketplace_missing`        | Kein passender Marketplace war verfügbar.                                      | Quelle, Pfad oder Marketplace-Namen konfigurieren.    |
| `plugin_not_installed`       | Der Marketplace ist vorhanden, aber das Plugin ist nicht installiert.          | Installation ausführen oder `autoInstall` aktivieren. |
| `plugin_disabled`            | Das Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert.        | Installation ausführen, um es erneut zu aktivieren.   |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist ausschließlich remote verfügbar.               | `marketplaceSource` oder `marketplacePath` verwenden. |
| `mcp_missing`                | Das Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar.              | Codex Computer Use und Betriebssystemberechtigungen prüfen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                                            | Den Durchlauf im Codex-Modus starten.                 |
| `check_failed`               | Während der Statusprüfung ist eine Anfrage an den Codex app-server fehlgeschlagen. | app-server-Verbindung und Protokolle prüfen.        |
| `auto_install_blocked`       | Die Einrichtung zu Beginn eines Durchlaufs müsste eine neue Quelle hinzufügen.  | Zuerst eine explizite Installation ausführen.         |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Server-Status, den
Marketplace, die verfügbaren Tools sowie die spezifische Meldung für den
fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der von Codex verwaltete MCP-Server benötigt
möglicherweise lokale Betriebssystemberechtigungen, bevor er Anwendungen prüfen
oder steuern kann. Wenn OpenClaw meldet, dass Computer Use installiert, der
MCP-Server jedoch nicht verfügbar ist, überprüfen Sie zuerst die
Computer-Use-Einrichtung auf der Codex-Seite:

- Der Codex app-server wird auf demselben Host ausgeführt, auf dem die
  Desktop-Steuerung erfolgen soll.
- Das Computer-Use-Plugin ist in der Codex-Konfiguration aktiviert.
- Der MCP-Server `computer-use` wird im MCP-Status des Codex app-server
  angezeigt.
- macOS hat der Anwendung zur Desktop-Steuerung die erforderlichen
  Berechtigungen erteilt.
- Die aktuelle Host-Sitzung kann auf den zu steuernden Desktop zugreifen.

OpenClaw bricht absichtlich sicher ab, wenn `computerUse.enabled` auf true
gesetzt ist. Ein Durchlauf im Codex-Modus darf nicht ohne Meldung und ohne die
von der Konfiguration vorausgesetzten nativen Desktop-Tools fortfahren.

## Fehlerbehebung

**Der Status meldet, dass das Plugin nicht installiert ist.** Führen Sie
`/codex computer-use install` aus. Wenn der Marketplace nicht erkannt wird,
übergeben Sie `--source` oder `--marketplace-path`.

**Der Status meldet, dass das Plugin installiert, aber deaktiviert ist.**
Führen Sie `/codex computer-use install` erneut aus. Die Installation über den
Codex app-server setzt die Plugin-Konfiguration wieder auf aktiviert.

**Der Status meldet, dass die Remote-Installation nicht unterstützt wird.**
Verwenden Sie eine lokale Marketplace-Quelle oder einen lokalen Pfad.
Katalogeinträge, die ausschließlich remote verfügbar sind, können geprüft,
aber über die aktuelle app-server-API nicht installiert werden.

**Der Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die
Installation einmal erneut aus, damit die MCP-Server neu geladen werden. Wenn
er weiterhin nicht verfügbar ist, korrigieren Sie die Codex-Computer-Use-App,
den MCP-Status des Codex app-server oder die macOS-Berechtigungen.

**Beim Status oder bei einer Prüfung tritt bei `computer-use.list_apps` eine
Zeitüberschreitung auf.** Das Plugin und der MCP-Server sind vorhanden, aber die
lokale Computer-Use-Brücke hat nicht geantwortet. Beenden oder starten Sie Codex
Computer Use neu, starten Sie Codex Desktop bei Bedarf erneut und versuchen Sie
es anschließend in einer neuen OpenClaw-Sitzung. Wenn auf dem Host Computer Use
zuvor über einen älteren verwalteten Codex app-server ausgeführt wurde,
aktualisieren Sie das installierte Plugin aus dem mit der Desktop-Anwendung
gebündelten Marketplace. Verwenden Sie für eigenständige Codex-Desktop-
Installationen den Pfad der `Codex.app`:

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Ein Computer-Use-Tool meldet `Native hook relay unavailable`.** Der native
Codex-Tool-Hook konnte über die lokale Brücke oder den Gateway-Fallback kein
aktives OpenClaw-Relay erreichen. Starten Sie mit `/new` oder `/reset` eine neue
OpenClaw-Sitzung. Wenn es einmal funktioniert und bei einem späteren Tool-Aufruf
erneut fehlschlägt, bereinigt `/new` lediglich den aktuellen Versuch. Starten
Sie den Codex app-server oder den OpenClaw Gateway neu, damit alte Threads und
Hook-Registrierungen verworfen werden, und versuchen Sie es anschließend in
einer neuen Sitzung erneut.

**Die automatische Installation zu Beginn eines Durchlaufs lehnt eine Quelle
ab.** Dies ist beabsichtigt. Fügen Sie die Quelle zuerst explizit mit
`/codex computer-use install --source <marketplace-source>` hinzu. Anschließend
kann die automatische Installation zu Beginn zukünftiger Durchläufe den
erkannten lokalen Marketplace verwenden.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Peekaboo-Brücke](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
