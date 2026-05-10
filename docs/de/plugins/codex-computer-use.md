---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP
    - Sie entscheiden zwischen Codex Computer Use und einer direkten cua-driver-MCP-Einrichtung
    - Sie konfigurieren computerUse für das mitgelieferte Codex-Plugin
    - Sie beheben Probleme mit dem Status oder der Installation von /codex computer-use
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-05-10T19:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin für lokale Desktop-Steuerung. OpenClaw
vendort die Desktop-App nicht, führt Desktop-Aktionen nicht selbst aus und umgeht
keine Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet nur den Codex-App-Server vor:
Es aktiviert die Codex-Plugin-Unterstützung, findet oder installiert das konfigurierte Codex
Computer Use-Plugin, prüft, dass der MCP-Server `computer-use` verfügbar ist, und
überlässt Codex dann während Durchläufen im Codex-Modus die nativen MCP-Tool-Aufrufe.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness verwendet. Für die
Runtime-Einrichtung selbst siehe [Codex-Harness](/de/plugins/codex-harness).

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket hosten, damit die `peekaboo`-CLI die
lokalen Bedienungshilfen- und Bildschirmaufnahme-Freigaben der App für Peekaboos eigene
Automatisierungswerkzeuge wiederverwenden kann. Diese Bridge installiert oder proxyt Codex Computer Use nicht, und
Codex Computer Use ruft nicht über den PeekabooBridge-Socket auf.

Verwenden Sie [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app ein
berechtigungsbewusster Host für Peekaboo-CLI-Automatisierung sein soll. Verwenden Sie diese Seite, wenn ein
OpenClaw-Agent im Codex-Modus das native MCP-Plugin `computer-use` von Codex
verfügbar haben soll, bevor der Durchlauf beginnt.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder proxyt
den MCP-Server `computer-use` von Codex nicht und ist kein Desktop-Steuerungs-Backend.
Stattdessen verbindet sich die iOS-App als OpenClaw-Knoten und stellt mobile
Fähigkeiten über Knotenbefehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent einen iPhone-Knoten über
das Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den lokalen
macOS-Desktop über das native Computer Use-Plugin von Codex steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn Sie möchten,
dass von OpenClaw verwaltete Runtimes TryCuas Treiber direkt aufrufen, verwenden Sie den Upstream-
Server `cua-driver mcp` über OpenClaws MCP-Registry statt des
Codex-spezifischen Marketplace-Ablaufs.

Nach der Installation von `cua-driver` können Sie ihn entweder nach dem OpenClaw-Befehl fragen:

```bash
cua-driver mcp-config --client openclaw
```

oder den stdio-Server selbst registrieren:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad erhält die Upstream-MCP-Tool-Oberfläche intakt, einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Codex Computer Use-Einrichtung auf
dieser Seite, wenn der Codex-App-Server Plugin-Installation, MCP-Neuladevorgänge
und native Tool-Aufrufe innerhalb von Durchläufen im Codex-Modus übernehmen soll.

Der CUA-Treiber ist macOS-spezifisch und benötigt weiterhin die lokalen macOS-Berechtigungen,
nach denen seine App fragt, etwa Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und umgeht nicht das Sicherheitsmodell
des Upstream-Treibers.

## Schnelleinrichtung

Setzen Sie `plugins.entries.codex.config.computerUse`, wenn Durchläufe im Codex-Modus
Computer Use verfügbar haben müssen, bevor ein Thread startet:

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
      model: "openai/gpt-5.5",
    },
  },
}
```

Mit dieser Konfiguration prüft OpenClaw den Codex-App-Server vor jedem Durchlauf im Codex-Modus.
Wenn Computer Use fehlt, der Codex-App-Server aber bereits einen
installierbaren Marketplace gefunden hat, fordert OpenClaw den Codex-App-Server auf, das
Plugin zu installieren oder erneut zu aktivieren und MCP-Server neu zu laden. Wenn unter macOS kein passender Marketplace
registriert ist und das Standard-Codex-App-Bundle vorhanden ist, versucht OpenClaw außerdem,
den gebündelten Codex-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zu registrieren, bevor es
fehlschlägt. Wenn die Einrichtung den MCP-Server dennoch nicht verfügbar machen kann, schlägt der Durchlauf
fehl, bevor der Thread startet.

Nachdem Sie die Computer Use-Konfiguration geändert haben, verwenden Sie `/new` oder `/reset` im betroffenen Chat,
bevor Sie testen, falls bereits ein bestehender Codex-Thread gestartet wurde.

## Befehle

Verwenden Sie die Befehle `/codex computer-use` von jeder Chat-Oberfläche aus, auf der die
Befehlsoberfläche des `codex`-Plugins verfügbar ist. Dies sind OpenClaw-Chat-/Runtime-Befehle,
keine CLI-Unterbefehle `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist schreibgeschützt. Er fügt keine Marketplace-Quellen hinzu, installiert keine Plugins und
aktiviert keine Codex-Plugin-Unterstützung.

`install` aktiviert die Plugin-Unterstützung des Codex-App-Servers, fügt optional eine konfigurierte
Marketplace-Quelle hinzu, installiert oder reaktiviert das konfigurierte Plugin über den Codex-
App-Server, lädt MCP-Server neu und verifiziert, dass der MCP-Server Tools bereitstellt.

## Marketplace-Auswahl

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder wählen aus, wo Codex `computer-use` finden soll.

| Feld                 | Verwenden, wenn                                                  | Installationsunterstützung                                |
| -------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| Kein Marketplace-Feld | Der Codex-App-Server soll Marketplaces verwenden, die er bereits kennt. | Ja, wenn der App-Server einen lokalen Marketplace zurückgibt. |
| `marketplaceSource`  | Sie haben eine Codex-Marketplace-Quelle, die der App-Server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.         |
| `marketplacePath`    | Sie kennen bereits den lokalen Marketplace-Dateipfad auf dem Host. | Ja, für explizite Installation und automatische Installation beim Durchlaufstart. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marketplace nach Namen auswählen. | Ja, nur wenn der ausgewählte Marketplace einen lokalen Pfad hat. |

Neue Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen Marketplaces
anzulegen. Während der Installation pollt OpenClaw `plugin/list` bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang. Der Standardwert beträgt 60 Sekunden.

Wenn mehrere bekannte Marketplaces Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated`, dann `local`. Unbekannte mehrdeutige Treffer
schlagen geschlossen fehl und fordern Sie auf, `marketplaceName` oder `marketplacePath` zu setzen.

## Gebündelter macOS-Marketplace

Aktuelle Codex-Desktop-Builds bündeln Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` true ist und kein Marketplace mit
`computer-use` registriert ist, versucht OpenClaw, den Standard-Root des gebündelten
Marketplace automatisch hinzuzufügen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können ihn auch explizit aus einer Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, setzen Sie `computerUse.marketplacePath` auf einen
lokalen Marketplace-Dateipfad oder führen Sie einmal `/codex computer-use install --source
<marketplace-source>` aus.

## Beschränkung für Remote-Kataloge

Der Codex-App-Server kann rein remote verfügbare Katalogeinträge auflisten und lesen, unterstützt aber derzeit
kein remote `plugin/install`. Das bedeutet, dass `marketplaceName`
für Statusprüfungen einen reinen Remote-Marketplace auswählen kann, Installationen und Reaktivierungen
aber weiterhin einen lokalen Marketplace über `marketplaceSource` oder `marketplacePath` benötigen.

Wenn der Status meldet, dass das Plugin in einem Remote-Codex-Marketplace verfügbar ist, Remote-
Installation aber nicht unterstützt wird, führen Sie die Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert  | Bedeutung                                                                      |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | abgeleitet    | Computer Use erforderlich machen. Standardmäßig true, wenn ein anderes Computer Use-Feld gesetzt ist. |
| `autoInstall`                   | false         | Beim Durchlaufstart aus bereits gefundenen Marketplaces installieren oder erneut aktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000         | Wie lange die Installation auf die Marketplace-Erkennung des Codex-App-Servers wartet. |
| `marketplaceSource`             | nicht gesetzt | Quellen-String, der an `marketplace/add` des Codex-App-Servers übergeben wird. |
| `marketplacePath`               | nicht gesetzt | Lokaler Codex-Marketplace-Dateipfad, der das Plugin enthält.                   |
| `marketplaceName`               | nicht gesetzt | Name des registrierten Codex-Marketplace, der ausgewählt werden soll.          |
| `pluginName`                    | `computer-use` | Codex-Marketplace-Plugin-Name.                                                |
| `mcpServerName`                 | `computer-use` | MCP-Server-Name, der vom installierten Plugin bereitgestellt wird.             |

Die automatische Installation beim Durchlaufstart lehnt konfigurierte `marketplaceSource`-
Werte absichtlich ab. Das Hinzufügen einer neuen Quelle ist ein expliziter Einrichtungsschritt. Verwenden Sie daher
einmal `/codex computer-use install --source <marketplace-source>` und lassen Sie anschließend
`autoInstall` künftige Reaktivierungen aus gefundenen lokalen Marketplaces übernehmen.
Die automatische Installation beim Durchlaufstart kann einen konfigurierten `marketplacePath` verwenden, weil dies
bereits ein lokaler Pfad auf dem Host ist.

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den benutzer sichtbaren
Status für den Chat:

| Grund                        | Bedeutung                                             | Nächster Schritt                              |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde zu false aufgelöst.       | Setzen Sie `enabled` oder ein anderes Computer Use-Feld. |
| `marketplace_missing`        | Es war kein passender Marketplace verfügbar.          | Konfigurieren Sie Quelle, Pfad oder Marketplace-Name. |
| `plugin_not_installed`       | Marketplace existiert, aber das Plugin ist nicht installiert. | Führen Sie die Installation aus oder aktivieren Sie `autoInstall`. |
| `plugin_disabled`            | Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Führen Sie die Installation aus, um es erneut zu aktivieren. |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist nur remote verfügbar. | Verwenden Sie `marketplaceSource` oder `marketplacePath`. |
| `mcp_missing`                | Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Prüfen Sie Codex Computer Use und OS-Berechtigungen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                  | Starten Sie den Durchlauf im Codex-Modus.     |
| `check_failed`               | Eine Anfrage an den Codex-App-Server ist während der Statusprüfung fehlgeschlagen. | Prüfen Sie App-Server-Konnektivität und Logs. |
| `auto_install_blocked`       | Die Einrichtung beim Durchlaufstart müsste eine neue Quelle hinzufügen. | Führen Sie zuerst eine explizite Installation aus. |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Server-Status, den Marketplace, Tools
sofern verfügbar und die spezifische Meldung für den fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der von Codex verwaltete MCP-Server benötigt möglicherweise lokale OS-
Berechtigungen, bevor er Apps prüfen oder steuern kann. Wenn OpenClaw meldet, dass Computer Use
installiert ist, der MCP-Server aber nicht verfügbar ist, überprüfen Sie zuerst die Codex-seitige Computer
Use-Einrichtung:

- Codex app-server wird auf demselben Host ausgeführt, auf dem die Desktop-Steuerung
  erfolgen soll.
- Das Computer Use-Plugin ist in der Codex-Konfiguration aktiviert.
- Der `computer-use`-MCP-Server erscheint im MCP-Status von Codex app-server.
- macOS hat die erforderlichen Berechtigungen für die Desktop-Steuerungs-App erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw schlägt absichtlich geschlossen fehl, wenn `computerUse.enabled` true ist. Ein
Codex-Modus-Turn sollte nicht stillschweigend ohne die nativen Desktop-Tools
fortfahren, die von der Konfiguration verlangt wurden.

## Fehlerbehebung

**Der Status meldet nicht installiert.** Führen Sie `/codex computer-use install` aus. Wenn der
Marketplace nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Der Status meldet installiert, aber deaktiviert.** Führen Sie `/codex computer-use install` erneut aus.
Die Installation von Codex app-server schreibt die Plugin-Konfiguration wieder als aktiviert zurück.

**Der Status meldet, dass die Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marketplace-Quelle oder
einen lokalen Pfad. Reine Remote-Katalogeinträge können geprüft, aber nicht über die
aktuelle app-server-API installiert werden.

**Der Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit MCP-
Server neu geladen werden. Wenn er weiterhin nicht verfügbar ist, beheben Sie die Codex Computer Use-App,
den MCP-Status von Codex app-server oder die macOS-Berechtigungen.

**Der Status oder eine Prüfung läuft bei `computer-use.list_apps` in ein Timeout.** Das Plugin und der MCP-
Server sind vorhanden, aber die lokale Computer Use-Bridge hat nicht geantwortet. Beenden oder
starten Sie Codex Computer Use neu, starten Sie Codex Desktop bei Bedarf neu, und versuchen Sie es dann in einer
neuen OpenClaw-Sitzung erneut.

**Ein Computer Use-Tool meldet `Native hook relay unavailable`.** Der native Codex-
Tool-Hook konnte über die lokale Bridge oder den
Gateway-Fallback kein aktives OpenClaw-Relay erreichen. Starten Sie mit `/new` oder `/reset` eine neue OpenClaw-Sitzung. Wenn dies
weiterhin geschieht, starten Sie den Gateway neu, damit alte app-server-Threads und Hook-
Registrierungen verworfen werden, und versuchen Sie es dann erneut.

**Die automatische Installation beim Turn-Start lehnt eine Quelle ab.** Dies ist beabsichtigt. Fügen Sie die
Quelle zuerst ausdrücklich mit `/codex computer-use install --source <marketplace-source>` hinzu; danach kann die künftige automatische Installation beim Turn-Start den erkannten lokalen
Marketplace verwenden.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Peekaboo-Bridge](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
