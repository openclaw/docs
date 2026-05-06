---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP
    - Sie entscheiden zwischen Codex Computer Use und einer direkten cua-driver-MCP-Einrichtung
    - Sie konfigurieren computerUse für das mitgelieferte Codex-Plugin
    - Sie führen eine Problembehandlung für /codex computer-use status oder install durch
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-05-06T06:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin zur lokalen Desktop-Steuerung. OpenClaw
liefert die Desktop-App nicht mit, führt Desktop-Aktionen nicht selbst aus und
umgeht keine Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet nur den Codex app-server vor:
Es aktiviert Codex-Plugin-Unterstützung, findet oder installiert das konfigurierte Codex
Computer Use Plugin, prüft, ob der `computer-use`-MCP-Server verfügbar ist, und
überlässt Codex dann die nativen MCP-Toolaufrufe während Turns im Codex-Modus.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness verwendet. Zur
Einrichtung der Runtime selbst siehe [Codex-Harness](/de/plugins/codex-harness).

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket hosten, damit die `peekaboo`-CLI die
lokalen Berechtigungen der App für Bedienungshilfen und Bildschirmaufnahme für
Peekaboos eigene Automatisierungstools wiederverwenden kann. Diese Bridge installiert
oder proxyt Codex Computer Use nicht, und Codex Computer Use ruft nicht über den
PeekabooBridge-Socket auf.

Verwenden Sie [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app ein
berechtigungsbewusster Host für Peekaboo-CLI-Automatisierung sein soll. Verwenden
Sie diese Seite, wenn einem OpenClaw-Agent im Codex-Modus das native
`computer-use`-MCP-Plugin von Codex vor Beginn des Turns zur Verfügung stehen soll.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder proxyt den
Codex-`computer-use`-MCP-Server nicht und ist kein Backend zur Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Node und stellt mobile
Funktionen über Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent eine iPhone-Node über den
Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus
den lokalen macOS-Desktop über das native Computer Use Plugin von Codex steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn Sie möchten,
dass von OpenClaw verwaltete Runtimes TryCuas Treiber direkt aufrufen, verwenden Sie den Upstream-
`cua-driver mcp`-Server über die MCP-Registry von OpenClaw statt des
Codex-spezifischen Marketplace-Ablaufs.

Nach der Installation von `cua-driver` fragen Sie entweder den OpenClaw-Befehl ab:

```bash
cua-driver mcp-config --client openclaw
```

oder registrieren Sie den stdio-Server selbst:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad erhält die Upstream-MCP-Tooloberfläche unverändert, einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Codex Computer Use Einrichtung auf
dieser Seite, wenn Codex app-server die Plugin-Installation, MCP-Neuladungen
und native Toolaufrufe innerhalb von Turns im Codex-Modus übernehmen soll.

Der CUA-Treiber ist macOS-spezifisch und benötigt weiterhin die lokalen macOS-Berechtigungen,
zu denen seine App auffordert, etwa Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und umgeht das Sicherheitsmodell
des Upstream-Treibers nicht.

## Schnelleinrichtung

Setzen Sie `plugins.entries.codex.config.computerUse`, wenn Turns im Codex-Modus
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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Mit dieser Konfiguration prüft OpenClaw Codex app-server vor jedem Turn im Codex-Modus.
Wenn Computer Use fehlt, Codex app-server aber bereits einen installierbaren
Marketplace gefunden hat, fordert OpenClaw Codex app-server auf, das Plugin zu installieren
oder wieder zu aktivieren und MCP-Server neu zu laden. Unter macOS versucht OpenClaw,
wenn kein passender Marketplace registriert ist und das Standard-Codex-App-Bundle
existiert, außerdem den gebündelten Codex-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zu registrieren,
bevor es fehlschlägt. Wenn die Einrichtung den MCP-Server weiterhin nicht verfügbar
machen kann, schlägt der Turn fehl, bevor der Thread startet.

Bestehende Sitzungen behalten ihre Runtime und Codex-Thread-Bindung. Verwenden Sie nach Änderungen an
`agentRuntime` oder der Computer Use Konfiguration `/new` oder `/reset` im betroffenen
Chat, bevor Sie testen.

## Befehle

Verwenden Sie die `/codex computer-use`-Befehle von jeder Chat-Oberfläche, auf der die
Befehlsoberfläche des `codex`-Plugins verfügbar ist. Dies sind OpenClaw-Chat-/Runtime-Befehle,
keine `openclaw codex ...`-CLI-Unterbefehle:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist schreibgeschützt. Es fügt keine Marketplace-Quellen hinzu, installiert keine Plugins und
aktiviert keine Codex-Plugin-Unterstützung.

`install` aktiviert Codex app-server Plugin-Unterstützung, fügt optional eine konfigurierte
Marketplace-Quelle hinzu, installiert oder reaktiviert das konfigurierte Plugin über Codex
app-server, lädt MCP-Server neu und verifiziert, dass der MCP-Server Tools bereitstellt.

## Marketplace-Optionen

OpenClaw verwendet dieselbe app-server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder wählen aus, wo Codex `computer-use` finden soll.

| Feld                 | Verwenden, wenn                                                | Installationsunterstützung                                |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| Kein Marketplace-Feld | Sie möchten, dass Codex app-server bereits bekannte Marketplaces verwendet. | Ja, wenn app-server einen lokalen Marketplace zurückgibt. |
| `marketplaceSource`  | Sie haben eine Codex-Marketplace-Quelle, die app-server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.         |
| `marketplacePath`    | Sie kennen den lokalen Marketplace-Dateipfad auf dem Host bereits. | Ja, für explizite Installation und Auto-Installation beim Turn-Start. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marketplace nach Namen auswählen. | Ja, nur wenn der ausgewählte Marketplace einen lokalen Pfad hat. |

Frische Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen Marketplaces
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

Wenn `computerUse.autoInstall` true ist und kein Marketplace registriert ist, der
`computer-use` enthält, versucht OpenClaw, die standardmäßige gebündelte
Marketplace-Wurzel automatisch hinzuzufügen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können sie auch explizit über eine Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, setzen Sie `computerUse.marketplacePath` auf einen
lokalen Marketplace-Dateipfad oder führen Sie einmal `/codex computer-use install --source
<marketplace-source>` aus.

## Grenze des Remote-Katalogs

Codex app-server kann Remote-only-Katalogeinträge auflisten und lesen, unterstützt aber derzeit
kein Remote-`plugin/install`. Das bedeutet, dass `marketplaceName` einen
Remote-only-Marketplace für Statusprüfungen auswählen kann, Installationen und Reaktivierungen
aber weiterhin einen lokalen Marketplace über `marketplaceSource` oder `marketplacePath` benötigen.

Wenn der Status meldet, dass das Plugin in einem Remote-Codex-Marketplace verfügbar ist, Remote-
Installation aber nicht unterstützt wird, führen Sie install mit einer lokalen Quelle oder einem Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert    | Bedeutung                                                                      |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | abgeleitet      | Computer Use verlangen. Standardmäßig true, wenn ein anderes Computer Use Feld gesetzt ist. |
| `autoInstall`                   | false           | Aus bereits gefundenen Marketplaces beim Turn-Start installieren oder reaktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000           | Wie lange die Installation auf die Marketplace-Erkennung von Codex app-server wartet. |
| `marketplaceSource`             | nicht gesetzt   | Quellzeichenfolge, die an Codex app-server `marketplace/add` übergeben wird.   |
| `marketplacePath`               | nicht gesetzt   | Lokaler Codex-Marketplace-Dateipfad, der das Plugin enthält.                   |
| `marketplaceName`               | nicht gesetzt   | Name des zu wählenden registrierten Codex-Marketplace.                         |
| `pluginName`                    | `computer-use`  | Codex-Marketplace-Plugin-Name.                                                 |
| `mcpServerName`                 | `computer-use`  | MCP-Servername, den das installierte Plugin bereitstellt.                      |

Die Auto-Installation beim Turn-Start lehnt konfigurierte `marketplaceSource`-
Werte absichtlich ab. Das Hinzufügen einer neuen Quelle ist ein expliziter Einrichtungsvorgang,
verwenden Sie daher einmal `/codex computer-use install --source <marketplace-source>` und lassen Sie
anschließend `autoInstall` zukünftige Reaktivierungen aus gefundenen lokalen Marketplaces übernehmen.
Die Auto-Installation beim Turn-Start kann einen konfigurierten `marketplacePath` verwenden, weil dies
bereits ein lokaler Pfad auf dem Host ist.

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den benutzerseitigen
Status für den Chat:

| Grund                        | Bedeutung                                             | Nächster Schritt                              |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde zu false aufgelöst.       | Setzen Sie `enabled` oder ein anderes Computer Use Feld. |
| `marketplace_missing`        | Es war kein passender Marketplace verfügbar.          | Konfigurieren Sie Quelle, Pfad oder Marketplace-Namen. |
| `plugin_not_installed`       | Marketplace existiert, aber das Plugin ist nicht installiert. | Führen Sie install aus oder aktivieren Sie `autoInstall`. |
| `plugin_disabled`            | Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Führen Sie install aus, um es wieder zu aktivieren. |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist Remote-only.          | Verwenden Sie `marketplaceSource` oder `marketplacePath`. |
| `mcp_missing`                | Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Prüfen Sie Codex Computer Use und OS-Berechtigungen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                  | Starten Sie den Turn im Codex-Modus.          |
| `check_failed`               | Eine Codex app-server-Anfrage ist während der Statusprüfung fehlgeschlagen. | Prüfen Sie app-server-Konnektivität und Logs. |
| `auto_install_blocked`       | Die Einrichtung beim Turn-Start müsste eine neue Quelle hinzufügen. | Führen Sie zuerst die explizite Installation aus. |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Serverstatus, den Marketplace, Tools
falls verfügbar und die spezifische Meldung für den fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der von Codex gesteuerte MCP-Server benötigt möglicherweise lokale OS-
Berechtigungen, bevor er Apps prüfen oder steuern kann. Wenn OpenClaw meldet, dass Computer Use
installiert ist, der MCP-Server aber nicht verfügbar ist, prüfen Sie zuerst die Codex-seitige Computer
Use Einrichtung:

- Codex app-server läuft auf demselben Host, auf dem die Desktop-Steuerung
  erfolgen soll.
- Das Computer Use Plugin ist in der Codex-Konfiguration aktiviert.
- Der `computer-use`-MCP-Server wird im MCP-Status von Codex app-server angezeigt.
- macOS hat die erforderlichen Berechtigungen für die Desktop-Control-App erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw verweigert den Ablauf bewusst, wenn `computerUse.enabled` true ist. Ein
Durchlauf im Codex-Modus sollte nicht stillschweigend ohne die nativen
Desktop-Tools fortfahren, die von der Konfiguration verlangt werden.

## Fehlerbehebung

**Status meldet nicht installiert.** Führen Sie `/codex computer-use install` aus. Wenn der
Marktplatz nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Status meldet installiert, aber deaktiviert.** Führen Sie `/codex computer-use install` erneut aus.
Die Installation von Codex app-server schreibt die Plugin-Konfiguration wieder als aktiviert.

**Status meldet, dass Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marktplatz-Quelle oder
einen lokalen Pfad. Reine Remote-Katalogeinträge können geprüft, aber über die
aktuelle app-server-API nicht installiert werden.

**Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit MCP-
Server neu geladen werden. Wenn er weiterhin nicht verfügbar ist, beheben Sie die Codex Computer Use-App,
den MCP-Status von Codex app-server oder die macOS-Berechtigungen.

**Status oder eine Prüfung läuft bei `computer-use.list_apps` in ein Timeout.** Das Plugin und der MCP-
Server sind vorhanden, aber die lokale Computer Use-Bridge hat nicht geantwortet. Beenden oder
starten Sie Codex Computer Use neu, starten Sie Codex Desktop bei Bedarf erneut und versuchen Sie es dann in einer
frischen OpenClaw-Sitzung erneut.

**Ein Computer Use-Tool meldet `Native hook relay unavailable`.** Der native Codex-
Tool-Hook konnte über die lokale Bridge oder den
Gateway-Fallback keinen aktiven OpenClaw-Relay erreichen. Starten Sie mit `/new` oder `/reset` eine frische OpenClaw-Sitzung. Wenn dies
weiterhin auftritt, starten Sie den Gateway neu, damit alte app-server-Threads und Hook-
Registrierungen verworfen werden, und versuchen Sie es dann erneut.

**Die automatische Installation beim Turn-Start verweigert eine Quelle.** Dies ist beabsichtigt. Fügen Sie die
Quelle zuerst explizit mit `/codex computer-use install --source <marketplace-source>` hinzu; danach kann die künftige automatische Installation beim Turn-Start den erkannten lokalen
Marktplatz verwenden.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Peekaboo-Bridge](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
