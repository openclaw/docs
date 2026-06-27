---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver-MCP.
    - Sie entscheiden zwischen Codex Computer Use und einer direkten cua-driver-MCP-Einrichtung
    - Sie konfigurieren computerUse für das gebündelte Codex-Plugin
    - Sie beheben Probleme mit dem Status oder der Installation von /codex computer-use
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Computernutzung mit Codex
x-i18n:
    generated_at: "2026-06-27T17:45:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin für lokale Desktop-Steuerung. OpenClaw
liefert die Desktop-App nicht mit, führt Desktop-Aktionen nicht selbst aus und umgeht
keine Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet nur den Codex-App-Server vor:
Es aktiviert Codex-Plugin-Unterstützung, findet oder installiert das konfigurierte Codex
Computer Use-Plugin, prüft, ob der `computer-use`-MCP-Server verfügbar ist, und
überlässt Codex dann die nativen MCP-Tool-Aufrufe während Codex-Modus-Durchläufen.

Verwenden Sie diese Seite, wenn OpenClaw bereits den nativen Codex-Harness nutzt. Für die
Runtime-Einrichtung selbst siehe [Codex-Harness](/de/plugins/codex-harness).

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket hosten, damit die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für Peekaboos eigene
Automatisierungstools wiederverwenden kann. Diese Bridge installiert oder proxyt Codex Computer Use nicht, und
Codex Computer Use ruft nicht über den PeekabooBridge-Socket auf.

Verwenden Sie [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app ein
berechtigungsbewusster Host für Peekaboo-CLI-Automatisierung sein soll. Verwenden Sie diese Seite, wenn ein
OpenClaw-Agent im Codex-Modus das native `computer-use`-MCP-Plugin von Codex
verfügbar haben soll, bevor der Durchlauf beginnt.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder proxyt
den Codex-`computer-use`-MCP-Server nicht und ist kein Backend für Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Knoten und stellt mobile
Funktionen über Knotenbefehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent einen iPhone-Knoten über
das Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den lokalen
macOS-Desktop über Codex' natives Computer Use-Plugin steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn Sie möchten,
dass von OpenClaw verwaltete Runtimes TryCuas Treiber direkt aufrufen, verwenden Sie den Upstream-
`cua-driver mcp`-Server über OpenClaws MCP-Registry statt des
Codex-spezifischen Marktplatz-Flows.

Nach der Installation von `cua-driver` können Sie entweder den OpenClaw-Befehl abfragen:

```bash
cua-driver mcp-config --client openclaw
```

oder den stdio-Server selbst registrieren:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad hält die Upstream-MCP-Tool-Oberfläche intakt, einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Codex Computer Use-Einrichtung auf
dieser Seite, wenn der Codex-App-Server Plugin-Installation, MCP-Neuladevorgänge
und native Tool-Aufrufe innerhalb von Codex-Modus-Durchläufen besitzen soll.

Der CUA-Treiber ist macOS-spezifisch und benötigt weiterhin die lokalen macOS-Berechtigungen,
nach denen seine App fragt, etwa Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, erteilt diese Berechtigungen nicht und umgeht
nicht das Sicherheitsmodell des Upstream-Treibers.

## Schnelle Einrichtung

Setzen Sie `plugins.entries.codex.config.computerUse`, wenn Codex-Modus-Durchläufe
Computer Use verfügbar haben müssen, bevor ein Thread startet. `autoInstall: true` aktiviert
Computer Use und lässt OpenClaw es vor dem Durchlauf installieren oder wieder aktivieren:

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

Mit dieser Konfiguration prüft OpenClaw den Codex-App-Server vor jedem Codex-Modus-Durchlauf.
Wenn Computer Use fehlt, der Codex-App-Server aber bereits einen
installierbaren Marktplatz entdeckt hat, bittet OpenClaw den Codex-App-Server, das
Plugin zu installieren oder wieder zu aktivieren und MCP-Server neu zu laden. Unter macOS versucht OpenClaw,
wenn kein passender Marktplatz registriert ist und das Standard-Codex-App-Bundle existiert,
auch, den gebündelten Codex-Marktplatz aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zu registrieren, bevor es
fehlschlägt. Wenn die Einrichtung den MCP-Server weiterhin nicht verfügbar machen kann, schlägt der Durchlauf
fehl, bevor der Thread startet.

Nach Änderungen an der Computer Use-Konfiguration verwenden Sie `/new` oder `/reset` im betroffenen Chat,
bevor Sie testen, falls ein vorhandener Codex-Thread bereits gestartet wurde.

Beim verwalteten stdio-Start unter macOS bevorzugt OpenClaw das signierte Desktop-Codex-App-
Bundle unter `/Applications/Codex.app/Contents/Resources/codex`, wenn es existiert.
Dadurch bleibt Computer Use unter dem App-Bundle, das die lokalen Desktop-Steuerungs-
Berechtigungen besitzt. Wenn die Desktop-App nicht installiert ist, fällt OpenClaw auf die
verwaltete Codex-Binärdatei zurück, die neben dem Plugin installiert ist. Wenn eine installierte Desktop-App
mit einer nicht unterstützten App-Server-Version initialisiert wird, schließt OpenClaw diesen Child-Prozess
und versucht stattdessen den nächsten verwalteten Binärkandidaten, statt eine veraltete
Desktop-App den plugin-lokalen Fallback verdecken zu lassen. Explizite `appServer.command`-
Konfiguration oder `OPENCLAW_CODEX_APP_SERVER_BIN` überschreibt diese verwaltete
Auswahl weiterhin.

## Befehle

Verwenden Sie die `/codex computer-use`-Befehle von jeder Chat-Oberfläche aus, auf der die `codex`-
Plugin-Befehlsoberfläche verfügbar ist. Dies sind OpenClaw-Chat-/Runtime-Befehle,
keine `openclaw codex ...`-CLI-Unterbefehle:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` ist schreibgeschützt. Es fügt keine Marktplatzquellen hinzu, installiert keine Plugins und
aktiviert keine Codex-Plugin-Unterstützung. Wenn keine Konfiguration Computer Use aktiviert,
kann `status` auch nach einem einmaligen Installationsbefehl disabled melden.

`install` aktiviert Codex-App-Server-Plugin-Unterstützung, fügt optional eine konfigurierte
Marktplatzquelle hinzu, installiert oder aktiviert das konfigurierte Plugin über den Codex-
App-Server wieder, lädt MCP-Server neu und prüft, ob der MCP-Server Tools bereitstellt.

## Marktplatzauswahl

OpenClaw verwendet dieselbe App-Server-API, die Codex selbst bereitstellt. Die
Marktplatzfelder wählen aus, wo Codex `computer-use` finden soll.

| Feld                 | Verwendung, wenn                                                 | Installationsunterstützung                                |
| -------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| Kein Marktplatzfeld  | Codex-App-Server soll bereits bekannte Marktplätze verwenden.    | Ja, wenn der App-Server einen lokalen Marktplatz zurückgibt. |
| `marketplaceSource`  | Sie haben eine Codex-Marktplatzquelle, die der App-Server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.         |
| `marketplacePath`    | Sie kennen den lokalen Marktplatzdateipfad auf dem Host bereits. | Ja, für explizite Installation und Auto-Installation beim Durchlaufstart. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marktplatz nach Namen auswählen. | Ja, nur wenn der ausgewählte Marktplatz einen lokalen Pfad hat. |

Frische Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen Marktplätze
anzulegen. Während der Installation fragt OpenClaw `plugin/list` bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang ab. Der Standardwert ist 60 Sekunden.

Wenn mehrere bekannte Marktplätze Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated`, dann `local`. Unbekannte mehrdeutige Treffer
schlagen geschlossen fehl und fordern Sie auf, `marketplaceName` oder `marketplacePath` zu setzen.

## Gebündelter macOS-Marktplatz

Aktuelle Codex-Desktop-Builds bündeln Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` true ist und kein Marktplatz registriert ist, der
`computer-use` enthält, versucht OpenClaw, den standardmäßigen gebündelten
Marktplatz-Root automatisch hinzuzufügen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können ihn auch explizit über eine Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, führen Sie einmal `/codex computer-use install
--source <marketplace-root>` aus oder setzen Sie `computerUse.marketplacePath` auf einen
lokalen Marktplatzdateipfad. Verwenden Sie `--marketplace-path` nur, wenn Sie den
Marktplatz-JSON-Dateipfad haben, nicht den gebündelten Marktplatz-Root.

## Grenze für Remote-Kataloge

Der Codex-App-Server kann reine Remote-Katalogeinträge auflisten und lesen, unterstützt aber
derzeit kein Remote-`plugin/install`. Das bedeutet, `marketplaceName` kann
einen reinen Remote-Marktplatz für Statusprüfungen auswählen, aber Installationen und Reaktivierungen
benötigen weiterhin einen lokalen Marktplatz über `marketplaceSource` oder `marketplacePath`.

Wenn der Status sagt, dass das Plugin in einem Remote-Codex-Marktplatz verfügbar ist, Remote-
Installation aber nicht unterstützt wird, führen Sie die Installation mit einer lokalen Quelle oder einem lokalen Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standardwert   | Bedeutung                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `enabled`                       | abgeleitet     | Computer Use verlangen. Standardmäßig true, wenn ein anderes Computer Use-Feld gesetzt ist. |
| `autoInstall`                   | false          | Beim Durchlaufstart aus bereits entdeckten Marktplätzen installieren oder wieder aktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Wie lange die Installation auf die Marktplatz-Entdeckung des Codex-App-Servers wartet. |
| `marketplaceSource`             | nicht gesetzt  | Quellstring, der an Codex-App-Server `marketplace/add` übergeben wird.          |
| `marketplacePath`               | nicht gesetzt  | Lokaler Codex-Marktplatzdateipfad, der das Plugin enthält.                      |
| `marketplaceName`               | nicht gesetzt  | Registrierter Codex-Marktplatzname zur Auswahl.                                 |
| `pluginName`                    | `computer-use` | Codex-Marktplatz-Plugin-Name.                                                   |
| `mcpServerName`                 | `computer-use` | MCP-Servername, den das installierte Plugin bereitstellt.                       |

Die Auto-Installation beim Durchlaufstart lehnt konfigurierte `marketplaceSource`-
Werte absichtlich ab. Das Hinzufügen einer neuen Quelle ist ein expliziter Einrichtungsvorgang, verwenden Sie daher
einmal `/codex computer-use install --source <marketplace-source>` und lassen Sie anschließend
`autoInstall` künftige Reaktivierungen aus entdeckten lokalen Marktplätzen übernehmen.
Die Auto-Installation beim Durchlaufstart kann ein konfiguriertes `marketplacePath` verwenden, weil dies
bereits ein lokaler Pfad auf dem Host ist.

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den benutzerseitigen
Status für den Chat:

| Grund                        | Bedeutung                                             | Nächster Schritt                              |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde zu false aufgelöst.       | Setzen Sie `enabled` oder ein anderes Computer Use-Feld. |
| `marketplace_missing`        | Kein passender Marketplace war verfügbar.             | Konfigurieren Sie Quelle, Pfad oder Marketplace-Namen. |
| `plugin_not_installed`       | Marketplace existiert, aber das Plugin ist nicht installiert. | Führen Sie install aus oder aktivieren Sie `autoInstall`. |
| `plugin_disabled`            | Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Führen Sie install aus, um es wieder zu aktivieren. |
| `remote_install_unsupported` | Der ausgewählte Marketplace ist nur remote verfügbar. | Verwenden Sie `marketplaceSource` oder `marketplacePath`. |
| `mcp_missing`                | Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Prüfen Sie Codex Computer Use und die OS-Berechtigungen. |
| `ready`                      | Plugin und MCP-Tools sind verfügbar.                  | Starten Sie den Codex-Modus-Turn.             |
| `check_failed`               | Eine Codex-app-server-Anfrage ist während der Statusprüfung fehlgeschlagen. | Prüfen Sie app-server-Konnektivität und Logs. |
| `auto_install_blocked`       | Die Einrichtung beim Turn-Start müsste eine neue Quelle hinzufügen. | Führen Sie zuerst eine explizite Installation aus. |

Die Chat-Ausgabe enthält den Plugin-Zustand, den MCP-Server-Zustand, den Marketplace, verfügbare Tools sowie die spezifische Meldung für den fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der Codex-eigene MCP-Server benötigt möglicherweise lokale OS-Berechtigungen, bevor er Apps prüfen oder steuern kann. Wenn OpenClaw meldet, dass Computer Use installiert ist, der MCP-Server aber nicht verfügbar ist, prüfen Sie zuerst die Codex-seitige Computer Use-Einrichtung:

- Codex app-server läuft auf demselben Host, auf dem die Desktop-Steuerung erfolgen soll.
- Das Computer Use-Plugin ist in der Codex-Konfiguration aktiviert.
- Der `computer-use` MCP-Server erscheint im MCP-Status von Codex app-server.
- macOS hat die erforderlichen Berechtigungen für die Desktop-Steuerungs-App erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw schlägt absichtlich geschlossen fehl, wenn `computerUse.enabled` true ist. Ein Codex-Modus-Turn sollte nicht stillschweigend ohne die nativen Desktop-Tools fortfahren, die die Konfiguration voraussetzt.

## Fehlerbehebung

**Status meldet nicht installiert.** Führen Sie `/codex computer-use install` aus. Wenn der Marketplace nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Status meldet installiert, aber deaktiviert.** Führen Sie `/codex computer-use install` erneut aus. Die Installation über Codex app-server schreibt die Plugin-Konfiguration wieder als aktiviert zurück.

**Status meldet, dass Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marketplace-Quelle oder einen lokalen Pfad. Nur-Remote-Katalogeinträge können geprüft, aber über die aktuelle app-server-API nicht installiert werden.

**Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit MCP-Server neu geladen werden. Wenn er weiterhin nicht verfügbar ist, beheben Sie die Codex Computer Use-App, den MCP-Status von Codex app-server oder die macOS-Berechtigungen.

**Status oder eine Probe läuft bei `computer-use.list_apps` in ein Timeout.** Plugin und MCP-Server sind vorhanden, aber die lokale Computer Use-Bridge hat nicht geantwortet. Beenden oder starten Sie Codex Computer Use neu, starten Sie bei Bedarf Codex Desktop erneut und versuchen Sie es dann in einer frischen OpenClaw-Sitzung erneut. Wenn der Host Computer Use zuvor über einen älteren verwalteten Codex app-server ausgeführt hat, aktualisieren Sie das installierte Plugin aus dem mit dem Desktop gebündelten Marketplace:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Ein Computer Use-Tool meldet `Native hook relay unavailable`.** Der Codex-native Tool-Hook konnte über die lokale Bridge oder den Gateway-Fallback kein aktives OpenClaw-Relay erreichen. Starten Sie mit `/new` oder `/reset` eine frische OpenClaw-Sitzung. Wenn es einmal funktioniert und dann bei einem späteren Tool-Aufruf wieder fehlschlägt, bereinigt `/new` nur den aktuellen Versuch; starten Sie Codex app-server oder OpenClaw Gateway neu, damit alte Threads und Hook-Registrierungen verworfen werden, und versuchen Sie es dann in einer frischen Sitzung erneut.

**Die automatische Installation beim Turn-Start lehnt eine Quelle ab.** Das ist beabsichtigt. Fügen Sie die Quelle zuerst mit einem expliziten `/codex computer-use install --source <marketplace-source>` hinzu; danach kann die automatische Installation bei künftigen Turn-Starts den erkannten lokalen Marketplace verwenden.

## Verwandt

- [Codex-Harness](/de/plugins/codex-harness)
- [Peekaboo-Bridge](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
