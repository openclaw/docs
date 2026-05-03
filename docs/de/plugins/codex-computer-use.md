---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP
    - Sie entscheiden zwischen Codex Computer Use und einer direkten cua-driver-MCP-Konfiguration
    - Sie konfigurieren computerUse für das mitgelieferte Codex-Plugin
    - Sie beheben Probleme mit /codex computer-use status oder install
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-05-03T06:39:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin für lokale Desktop-Steuerung. OpenClaw
liefert die Desktop-App nicht mit, führt Desktop-Aktionen nicht selbst aus und umgeht
keine Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet nur den Codex-App-Server vor:
Es aktiviert die Codex-Plugin-Unterstützung, findet oder installiert das konfigurierte Codex
Computer Use-Plugin, prüft, dass der MCP-Server `computer-use` verfügbar ist, und
lässt Codex dann während Codex-Modus-Durchläufen die nativen MCP-Toolaufrufe übernehmen.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness nutzt. Zur
Laufzeit-Einrichtung selbst siehe [Codex-Harness](/de/plugins/codex-harness).

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket hosten, damit die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für Peekaboos eigene
Automatisierungstools wiederverwenden kann. Diese Bridge installiert oder proxyt Codex Computer Use nicht, und
Codex Computer Use ruft nicht über den PeekabooBridge-Socket auf.

Verwenden Sie die [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app ein
berechtigungsbewusster Host für Peekaboo-CLI-Automatisierung sein soll. Verwenden Sie diese Seite, wenn ein
OpenClaw-Agent im Codex-Modus vor Beginn des Durchlaufs das native MCP-Plugin `computer-use` von Codex
verfügbar haben soll.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder proxyt
den Codex-MCP-Server `computer-use` nicht und ist kein Backend für Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Node und stellt mobile
Fähigkeiten über Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent eine iPhone-Node über
das Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den lokalen
macOS-Desktop über das native Computer Use-Plugin von Codex steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn Sie möchten,
dass von OpenClaw verwaltete Laufzeiten den Treiber von TryCua direkt aufrufen, verwenden Sie den Upstream-
Server `cua-driver mcp` über die MCP-Registry von OpenClaw statt des
Codex-spezifischen Marktplatz-Ablaufs.

Nach der Installation von `cua-driver` können Sie ihn entweder nach dem OpenClaw-Befehl fragen:

```bash
cua-driver mcp-config --client openclaw
```

oder den stdio-Server selbst registrieren:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad erhält die Upstream-MCP-Tooloberfläche unverändert, einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Codex Computer Use-Einrichtung auf
dieser Seite, wenn der Codex-App-Server die Plugin-Installation, MCP-Neuladevorgänge
und native Toolaufrufe innerhalb von Codex-Modus-Durchläufen übernehmen soll.

Der CUA-Treiber ist macOS-spezifisch und benötigt weiterhin die lokalen macOS-Berechtigungen,
nach denen seine App fragt, etwa Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und umgeht nicht das Sicherheitsmodell
des Upstream-Treibers.

## Schnelleinrichtung

Setzen Sie `plugins.entries.codex.config.computerUse`, wenn Codex-Modus-Durchläufe
Computer Use vor dem Start eines Threads verfügbar haben müssen:

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
      },
    },
  },
}
```

Mit dieser Konfiguration prüft OpenClaw den Codex-App-Server vor jedem Codex-Modus-Durchlauf.
Wenn Computer Use fehlt, der Codex-App-Server aber bereits einen
installierbaren Marktplatz entdeckt hat, fordert OpenClaw den Codex-App-Server auf, das
Plugin zu installieren oder erneut zu aktivieren und MCP-Server neu zu laden. Unter macOS versucht OpenClaw,
wenn kein passender Marktplatz registriert ist und das Standard-Codex-App-Bundle vorhanden ist, außerdem,
den gebündelten Codex-Marktplatz aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zu registrieren, bevor der Vorgang
fehlschlägt. Wenn die Einrichtung den MCP-Server weiterhin nicht verfügbar machen kann, schlägt der Durchlauf
fehl, bevor der Thread startet.

Bestehende Sitzungen behalten ihre Laufzeit- und Codex-Thread-Bindung. Nach Änderungen an
`agentRuntime` oder der Computer Use-Konfiguration verwenden Sie `/new` oder `/reset` im betroffenen
Chat, bevor Sie testen.

## Befehle

Verwenden Sie die Befehle `/codex computer-use` von jeder Chat-Oberfläche, auf der die Befehlsoberfläche des `codex`-
Plugins verfügbar ist. Dies sind OpenClaw-Chat-/Laufzeitbefehle,
keine CLI-Unterbefehle `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist schreibgeschützt. Er fügt keine Marktplatzquellen hinzu, installiert keine Plugins und
aktiviert keine Codex-Plugin-Unterstützung.

`install` aktiviert die Plugin-Unterstützung des Codex-App-Servers, fügt optional eine konfigurierte
Marktplatzquelle hinzu, installiert oder reaktiviert das konfigurierte Plugin über den Codex-
App-Server, lädt MCP-Server neu und prüft, dass der MCP-Server Tools bereitstellt.

## Marktplatzoptionen

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marktplatzfelder legen fest, wo Codex `computer-use` finden soll.

| Feld                 | Verwenden, wenn                                                 | Installationsunterstützung                              |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Kein Marktplatzfeld  | Sie möchten, dass der Codex-App-Server bereits bekannte Marktplätze verwendet. | Ja, wenn der App-Server einen lokalen Marktplatz zurückgibt. |
| `marketplaceSource`  | Sie haben eine Codex-Marktplatzquelle, die der App-Server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.       |
| `marketplacePath`    | Sie kennen den lokalen Marktplatz-Dateipfad auf dem Host bereits. | Ja, für explizite Installation und Auto-Installation beim Durchlaufstart. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marktplatz nach Name auswählen. | Nur ja, wenn der ausgewählte Marktplatz einen lokalen Pfad hat. |

Frische Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen Marktplätze
anzulegen. Während der Installation fragt OpenClaw `plugin/list` bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang ab. Der Standardwert ist 60 Sekunden.

Wenn mehrere bekannte Marktplätze Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated`, dann `local`. Unbekannte mehrdeutige Treffer
schlagen geschlossen fehl und fordern Sie auf, `marketplaceName` oder `marketplacePath` festzulegen.

## Gebündelter macOS-Marktplatz

Aktuelle Codex-Desktop-Builds bündeln Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` true ist und kein Marktplatz registriert ist, der
`computer-use` enthält, versucht OpenClaw, den standardmäßigen gebündelten
Marktplatzstamm automatisch hinzuzufügen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können ihn auch explizit aus einer Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, setzen Sie `computerUse.marketplacePath` auf einen
lokalen Marktplatz-Dateipfad oder führen Sie `/codex computer-use install --source
<marketplace-source>` einmal aus.

## Begrenzung des Remote-Katalogs

Der Codex-App-Server kann reine Remote-Katalogeinträge auflisten und lesen, unterstützt derzeit aber kein
Remote-`plugin/install`. Das bedeutet, dass `marketplaceName` einen
reinen Remote-Marktplatz für Statusprüfungen auswählen kann, Installationen und Reaktivierungen
aber weiterhin einen lokalen Marktplatz über `marketplaceSource` oder `marketplacePath` benötigen.

Wenn der Status meldet, dass das Plugin in einem Remote-Codex-Marktplatz verfügbar ist, Remote-
Installation aber nicht unterstützt wird, führen Sie die Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standard       | Bedeutung                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | abgeleitet     | Computer Use erfordern. Standardmäßig true, wenn ein anderes Computer Use-Feld gesetzt ist. |
| `autoInstall`                   | false          | Beim Durchlaufstart aus bereits entdeckten Marktplätzen installieren oder erneut aktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Wie lange die Installation auf die Marktplatzentdeckung des Codex-App-Servers wartet. |
| `marketplaceSource`             | nicht gesetzt  | Quellzeichenfolge, die an `marketplace/add` des Codex-App-Servers übergeben wird. |
| `marketplacePath`               | nicht gesetzt  | Lokaler Codex-Marktplatz-Dateipfad, der das Plugin enthält.                    |
| `marketplaceName`               | nicht gesetzt  | Auszuwählender registrierter Codex-Marktplatzname.                             |
| `pluginName`                    | `computer-use` | Codex-Marktplatz-Plugin-Name.                                                  |
| `mcpServerName`                 | `computer-use` | Name des MCP-Servers, der vom installierten Plugin bereitgestellt wird.         |

Die Auto-Installation beim Durchlaufstart lehnt konfigurierte `marketplaceSource`-
Werte bewusst ab. Das Hinzufügen einer neuen Quelle ist ein expliziter Einrichtungsschritt; verwenden Sie daher
einmal `/codex computer-use install --source <marketplace-source>` und lassen Sie danach
`autoInstall` künftige Reaktivierungen aus entdeckten lokalen Marktplätzen übernehmen.
Die Auto-Installation beim Durchlaufstart kann einen konfigurierten `marketplacePath` verwenden, weil dies
bereits ein lokaler Pfad auf dem Host ist.

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den nutzerseitigen
Status für den Chat:

| Grund                        | Bedeutung                                              | Nächster Schritt                              |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde zu false aufgelöst.        | Setzen Sie `enabled` oder ein anderes Computer Use-Feld. |
| `marketplace_missing`        | Kein passender Marktplatz war verfügbar.               | Konfigurieren Sie Quelle, Pfad oder Marktplatznamen. |
| `plugin_not_installed`       | Der Marktplatz existiert, aber das Plugin ist nicht installiert. | Führen Sie die Installation aus oder aktivieren Sie `autoInstall`. |
| `plugin_disabled`            | Das Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Führen Sie die Installation aus, um es erneut zu aktivieren. |
| `remote_install_unsupported` | Der ausgewählte Marktplatz ist nur remote verfügbar.   | Verwenden Sie `marketplaceSource` oder `marketplacePath`. |
| `mcp_missing`                | Das Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Prüfen Sie Codex Computer Use und OS-Berechtigungen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                   | Starten Sie den Codex-Modus-Durchlauf.        |
| `check_failed`               | Eine Anfrage an den Codex-App-Server ist während der Statusprüfung fehlgeschlagen. | Prüfen Sie App-Server-Konnektivität und Logs. |
| `auto_install_blocked`       | Die Einrichtung beim Durchlaufstart müsste eine neue Quelle hinzufügen. | Führen Sie zuerst die explizite Installation aus. |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Server-Status, den Marktplatz, Tools,
falls verfügbar, und die konkrete Meldung für den fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der Codex-eigene MCP-Server benötigt möglicherweise lokale OS-
Berechtigungen, bevor er Apps untersuchen oder steuern kann. Wenn OpenClaw meldet, dass Computer Use
installiert ist, der MCP-Server aber nicht verfügbar ist, prüfen Sie zuerst die Codex-seitige Computer
Use-Einrichtung:

- Codex app-server läuft auf demselben Host, auf dem die Desktop-Steuerung
  erfolgen soll.
- Das Computer Use Plugin ist in der Codex-Konfiguration aktiviert.
- Der MCP-Server `computer-use` erscheint im MCP-Status von Codex app-server.
- macOS hat die erforderlichen Berechtigungen für die Desktop-Steuerungs-App
  erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw verweigert bewusst den weiteren Ablauf, wenn `computerUse.enabled` auf true gesetzt ist. Ein Durchlauf im Codex-Modus sollte nicht stillschweigend ohne die nativen Desktop-Tools fortfahren, die von der Konfiguration verlangt werden.

## Fehlerbehebung

**Der Status meldet, dass es nicht installiert ist.** Führen Sie `/codex computer-use install` aus. Wenn der Marketplace nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Der Status meldet, dass es installiert, aber deaktiviert ist.** Führen Sie `/codex computer-use install` erneut aus. Die Installation von Codex app-server schreibt die Plugin-Konfiguration wieder als aktiviert zurück.

**Der Status meldet, dass Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marketplace-Quelle oder einen lokalen Pfad. Reine Remote-Katalogeinträge können geprüft, aber nicht über die aktuelle app-server-API installiert werden.

**Der Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit MCP-Server neu geladen werden. Wenn er weiterhin nicht verfügbar ist, beheben Sie die Codex Computer Use App, den MCP-Status von Codex app-server oder die macOS-Berechtigungen.

**Der Status oder eine Probe läuft bei `computer-use.list_apps` in ein Timeout.** Das Plugin und der MCP-Server sind vorhanden, aber die lokale Computer Use Bridge hat nicht geantwortet. Beenden oder starten Sie Codex Computer Use neu, starten Sie Codex Desktop bei Bedarf erneut und versuchen Sie es dann in einer neuen OpenClaw-Sitzung noch einmal.

**Ein Computer Use Tool meldet `Native hook relay unavailable`.** Der native Codex-Tool-Hook konnte über die lokale Bridge oder den Gateway-Fallback kein aktives OpenClaw-Relay erreichen. Starten Sie mit `/new` oder `/reset` eine neue OpenClaw-Sitzung. Wenn dies weiterhin auftritt, starten Sie den Gateway neu, damit alte app-server-Threads und Hook-Registrierungen verworfen werden, und versuchen Sie es dann erneut.

**Die automatische Installation beim Durchlaufstart verweigert eine Quelle.** Dies ist beabsichtigt. Fügen Sie die Quelle zuerst explizit mit `/codex computer-use install --source <marketplace-source>` hinzu; anschließend kann die automatische Installation bei künftigen Durchlaufstarts den erkannten lokalen Marketplace verwenden.
