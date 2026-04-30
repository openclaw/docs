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
    generated_at: "2026-04-30T07:04:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin zur lokalen Desktop-Steuerung. OpenClaw
vendort die Desktop-App nicht, führt selbst keine Desktop-Aktionen aus und umgeht
keine Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet nur den
Codex-App-Server vor: Es aktiviert die Codex-Plugin-Unterstützung, findet oder
installiert das konfigurierte Codex Computer Use-Plugin, prüft, ob der
`computer-use`-MCP-Server verfügbar ist, und überlässt Codex anschließend die
nativen MCP-Tool-Aufrufe während Turns im Codex-Modus.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness nutzt. Zur
Runtime-Einrichtung selbst siehe [Codex-Harness](/de/plugins/codex-harness).

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist getrennt von Codex Computer Use. Die
macOS-App kann einen PeekabooBridge-Socket hosten, sodass die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für die
eigenen Automatisierungstools von Peekaboo wiederverwenden kann. Diese Bridge
installiert oder proxyt Codex Computer Use nicht, und Codex Computer Use ruft nicht
über den PeekabooBridge-Socket auf.

Verwenden Sie die [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app ein
berechtigungsbewusster Host für Peekaboo-CLI-Automatisierung sein soll. Verwenden
Sie diese Seite, wenn für einen OpenClaw-Agenten im Codex-Modus das native
`computer-use`-MCP-Plugin von Codex verfügbar sein soll, bevor der Turn beginnt.

## iOS-App

Die iOS-App ist getrennt von Codex Computer Use. Sie installiert oder proxyt den
Codex-`computer-use`-MCP-Server nicht und ist kein Backend zur Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Node und stellt mobile
Fähigkeiten über Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent einen iPhone-Node über das
Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den
lokalen macOS-Desktop über das native Computer Use-Plugin von Codex steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung
bereitzustellen. Wenn OpenClaw-verwaltete Runtimes den TryCua-Treiber direkt
aufrufen sollen, verwenden Sie den Upstream-`cua-driver mcp`-Server über die
MCP-Registry von OpenClaw statt des Codex-spezifischen Marketplace-Flows.

Bitten Sie nach der Installation von `cua-driver` entweder um den OpenClaw-Befehl:

```bash
cua-driver mcp-config --client openclaw
```

oder registrieren Sie den stdio-Server selbst:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad bewahrt die Upstream-MCP-Tool-Oberfläche unverändert, einschließlich
der Treiberschemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der
CUA-Treiber als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie
die Einrichtung von Codex Computer Use auf dieser Seite, wenn der
Codex-App-Server Plugin-Installation, MCP-Neuladevorgänge und native
Tool-Aufrufe innerhalb von Turns im Codex-Modus übernehmen soll.

Der CUA-Treiber ist macOS-spezifisch und benötigt weiterhin die lokalen
macOS-Berechtigungen, zu denen seine App auffordert, etwa Bedienungshilfen und
Bildschirmaufnahme. OpenClaw installiert `cua-driver` nicht, gewährt diese
Berechtigungen nicht und umgeht das Sicherheitsmodell des Upstream-Treibers nicht.

## Schnelleinrichtung

Setzen Sie `plugins.entries.codex.config.computerUse`, wenn für Turns im
Codex-Modus Computer Use verfügbar sein muss, bevor ein Thread startet:

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
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Mit dieser Konfiguration prüft OpenClaw den Codex-App-Server vor jedem Turn im
Codex-Modus. Wenn Computer Use fehlt, der Codex-App-Server aber bereits einen
installierbaren Marketplace entdeckt hat, bittet OpenClaw den Codex-App-Server,
das Plugin zu installieren oder erneut zu aktivieren und MCP-Server neu zu laden.
Unter macOS versucht OpenClaw außerdem, den gebündelten Codex-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zu
registrieren, wenn kein passender Marketplace registriert ist und das
standardmäßige Codex-App-Bundle vorhanden ist, bevor es fehlschlägt. Wenn die
Einrichtung den MCP-Server weiterhin nicht verfügbar machen kann, schlägt der
Turn fehl, bevor der Thread startet.

Bestehende Sitzungen behalten ihre Runtime- und Codex-Thread-Bindung. Verwenden
Sie nach dem Ändern von `agentRuntime` oder der Computer Use-Konfiguration `/new`
oder `/reset` im betroffenen Chat, bevor Sie testen.

## Befehle

Verwenden Sie die `/codex computer-use`-Befehle auf jeder Chat-Oberfläche, auf
der die Befehlsoberfläche des `codex`-Plugins verfügbar ist. Dies sind
OpenClaw-Chat-/Runtime-Befehle, keine `openclaw codex ...`-CLI-Unterbefehle:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist schreibgeschützt. Er fügt keine Marketplace-Quellen hinzu,
installiert keine Plugins und aktiviert keine Codex-Plugin-Unterstützung.

`install` aktiviert die Plugin-Unterstützung des Codex-App-Servers, fügt optional
eine konfigurierte Marketplace-Quelle hinzu, installiert oder reaktiviert das
konfigurierte Plugin über den Codex-App-Server, lädt MCP-Server neu und prüft, ob
der MCP-Server Tools bereitstellt.

## Marketplace-Auswahl

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder legen fest, wo Codex `computer-use` finden soll.

| Feld                 | Verwenden, wenn                                                | Installationsunterstützung                              |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Kein Marketplace-Feld | Der Codex-App-Server soll Marketplaces verwenden, die er bereits kennt. | Ja, wenn der App-Server einen lokalen Marketplace zurückgibt. |
| `marketplaceSource`  | Sie haben eine Codex-Marketplace-Quelle, die der App-Server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.       |
| `marketplacePath`    | Sie kennen den lokalen Marketplace-Dateipfad auf dem Host bereits. | Ja, für explizite Installation und Auto-Installation beim Turn-Start. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marketplace nach Namen auswählen. | Ja, nur wenn der ausgewählte Marketplace einen lokalen Pfad hat. |

Neue Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen
Marketplaces zu initialisieren. Während der Installation fragt OpenClaw
`plugin/list` bis zu `marketplaceDiscoveryTimeoutMs` Millisekunden lang ab. Der
Standardwert ist 60 Sekunden.

Wenn mehrere bekannte Marketplaces Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated`, dann `local`. Unbekannte mehrdeutige
Treffer schlagen geschlossen fehl und fordern Sie auf, `marketplaceName` oder
`marketplacePath` zu setzen.

## Gebündelter macOS-Marketplace

Aktuelle Codex-Desktop-Builds bündeln Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` true ist und kein Marketplace mit `computer-use`
registriert ist, versucht OpenClaw, den standardmäßigen gebündelten
Marketplace-Root automatisch hinzuzufügen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können ihn auch explizit aus einer Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, setzen Sie
`computerUse.marketplacePath` auf einen lokalen Marketplace-Dateipfad oder führen
Sie einmal `/codex computer-use install --source <marketplace-source>` aus.

## Remote-Katalogbeschränkung

Der Codex-App-Server kann rein remote verfügbare Katalogeinträge auflisten und
lesen, unterstützt derzeit aber kein remote `plugin/install`. Das bedeutet, dass
`marketplaceName` einen rein remote verfügbaren Marketplace für Statusprüfungen
auswählen kann, Installationen und Reaktivierungen aber weiterhin einen lokalen
Marketplace über `marketplaceSource` oder `marketplacePath` benötigen.

Wenn der Status meldet, dass das Plugin in einem remote Codex-Marketplace
verfügbar ist, Remote-Installation aber nicht unterstützt wird, führen Sie die
Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert   | Bedeutung                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | abgeleitet     | Computer Use erfordern. Standardmäßig true, wenn ein anderes Computer Use-Feld gesetzt ist. |
| `autoInstall`                   | false          | Beim Turn-Start aus bereits entdeckten Marketplaces installieren oder erneut aktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Wie lange die Installation auf die Marketplace-Erkennung des Codex-App-Servers wartet. |
| `marketplaceSource`             | nicht gesetzt  | Quellzeichenfolge, die an `marketplace/add` des Codex-App-Servers übergeben wird. |
| `marketplacePath`               | nicht gesetzt  | Lokaler Codex-Marketplace-Dateipfad, der das Plugin enthält.                   |
| `marketplaceName`               | nicht gesetzt  | Registrierter Codex-Marketplace-Name zur Auswahl.                              |
| `pluginName`                    | `computer-use` | Codex-Marketplace-Plugin-Name.                                                 |
| `mcpServerName`                 | `computer-use` | MCP-Servername, der vom installierten Plugin bereitgestellt wird.              |

Die Auto-Installation beim Turn-Start lehnt konfigurierte `marketplaceSource`-Werte
absichtlich ab. Das Hinzufügen einer neuen Quelle ist ein expliziter
Einrichtungsvorgang. Verwenden Sie daher einmal `/codex computer-use install --source
<marketplace-source>` und lassen Sie `autoInstall` danach zukünftige
Reaktivierungen aus entdeckten lokalen Marketplaces übernehmen. Die
Auto-Installation beim Turn-Start kann einen konfigurierten `marketplacePath`
verwenden, weil dies bereits ein lokaler Pfad auf dem Host ist.

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den
benutzerseitigen Status für den Chat:

| Grund                        | Bedeutung                                             | Nächster Schritt                              |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde zu false aufgelöst.       | Setzen Sie `enabled` oder ein anderes Computer Use-Feld. |
| `marketplace_missing`        | Es war kein passender Marketplace verfügbar.          | Konfigurieren Sie Quelle, Pfad oder Marketplace-Namen. |
| `plugin_not_installed`       | Marketplace ist vorhanden, aber das Plugin ist nicht installiert. | Führen Sie die Installation aus oder aktivieren Sie `autoInstall`. |
| `plugin_disabled`            | Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Führen Sie die Installation aus, um es erneut zu aktivieren. |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist rein remote verfügbar. | Verwenden Sie `marketplaceSource` oder `marketplacePath`. |
| `mcp_missing`                | Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Prüfen Sie Codex Computer Use und OS-Berechtigungen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                  | Starten Sie den Turn im Codex-Modus.          |
| `check_failed`               | Eine Codex-App-Server-Anfrage ist während der Statusprüfung fehlgeschlagen. | Prüfen Sie App-Server-Konnektivität und Protokolle. |
| `auto_install_blocked`       | Die Einrichtung beim Turn-Start müsste eine neue Quelle hinzufügen. | Führen Sie zuerst eine explizite Installation aus. |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Serverstatus, den Marketplace,
Tools, sofern verfügbar, und die spezifische Meldung für den fehlgeschlagenen
Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der Codex-eigene MCP-Server benötigt
möglicherweise lokale OS-Berechtigungen, bevor er Apps prüfen oder steuern kann.
Wenn OpenClaw meldet, dass Computer Use installiert ist, der MCP-Server aber
nicht verfügbar ist, prüfen Sie zuerst die Codex-seitige Computer Use-Einrichtung:

- Codex app-server läuft auf demselben Host, auf dem die Desktop-Steuerung
  erfolgen soll.
- Das Computer Use Plugin ist in der Codex-Konfiguration aktiviert.
- Der MCP-Server `computer-use` erscheint im MCP-Status von Codex app-server.
- macOS hat die erforderlichen Berechtigungen für die App zur Desktop-Steuerung
  erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw schlägt bewusst geschlossen fehl, wenn `computerUse.enabled` auf true gesetzt ist. Ein
Turn im Codex-Modus sollte nicht stillschweigend ohne die nativen Desktop-Tools
fortfahren, die von der Konfiguration verlangt wurden.

## Fehlerbehebung

**Der Status meldet, dass es nicht installiert ist.** Führen Sie `/codex computer-use install` aus. Wenn der
Marketplace nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Der Status meldet, dass es installiert, aber deaktiviert ist.** Führen Sie `/codex computer-use install` erneut aus.
Die Installation von Codex app-server schreibt die Plugin-Konfiguration wieder als aktiviert zurück.

**Der Status meldet, dass die Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marketplace-Quelle oder
einen lokalen Pfad. Reine Remote-Katalogeinträge können geprüft, aber über die
aktuelle app-server-API nicht installiert werden.

**Der Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit MCP-
Server neu geladen werden. Wenn er weiterhin nicht verfügbar ist, beheben Sie die Codex Computer Use App,
den MCP-Status von Codex app-server oder die macOS-Berechtigungen.

**Der Status oder ein Probe läuft bei `computer-use.list_apps` in ein Timeout.** Das Plugin und der MCP-
Server sind vorhanden, aber die lokale Computer Use Bridge hat nicht geantwortet. Beenden oder
starten Sie Codex Computer Use neu, starten Sie bei Bedarf Codex Desktop neu, und versuchen Sie es dann in einer
neuen OpenClaw-Sitzung erneut.

**Ein Computer Use Tool meldet `Native hook relay unavailable`.** Der native Codex-
Tool-Hook konnte über die lokale Bridge oder den
Gateway-Fallback kein aktives OpenClaw-Relay erreichen. Starten Sie mit `/new` oder `/reset` eine neue OpenClaw-Sitzung. Wenn dies
weiterhin passiert, starten Sie den Gateway neu, damit alte app-server-Threads und Hook-
Registrierungen verworfen werden, und versuchen Sie es dann erneut.

**Die automatische Installation zu Turn-Beginn lehnt eine Quelle ab.** Dies ist beabsichtigt. Fügen Sie die
Quelle zuerst explizit mit `/codex computer-use install --source <marketplace-source>` hinzu; anschließend kann die zukünftige automatische Installation zu Turn-Beginn den erkannten lokalen
Marketplace verwenden.
