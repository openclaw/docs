---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus Codex Computer Use verwenden
    - Sie entscheiden zwischen Codex Computer Use, PeekabooBridge und direktem cua-driver MCP
    - Sie entscheiden zwischen Codex Computer Use und einer direkten cua-driver-MCP-Einrichtung
    - Sie konfigurieren computerUse für das gebündelte Codex-Plugin
    - Sie beheben Probleme mit dem Status oder der Installation von /codex computer-use
summary: Codex Computer Use für OpenClaw-Agenten im Codex-Modus einrichten
title: Codex-Computernutzung
x-i18n:
    generated_at: "2026-06-30T13:54:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use ist ein Codex-natives MCP-Plugin für die lokale Desktop-Steuerung. OpenClaw
vendort die Desktop-App nicht, führt Desktop-Aktionen nicht selbst aus und umgeht keine
Codex-Berechtigungen. Das gebündelte `codex`-Plugin bereitet nur den Codex app-server vor:
Es aktiviert die Codex-Plugin-Unterstützung, findet oder installiert das konfigurierte Codex
Computer Use-Plugin, prüft, ob der MCP-Server `computer-use` verfügbar ist, und
überlässt Codex dann während Turns im Codex-Modus die nativen MCP-Toolaufrufe.

Verwenden Sie diese Seite, wenn OpenClaw bereits das native Codex-Harness verwendet. Zur
Runtime-Einrichtung selbst siehe [Codex-Harness](/de/plugins/codex-harness).

## OpenClaw.app und Peekaboo

Die Peekaboo-Integration von OpenClaw.app ist von Codex Computer Use getrennt. Die
macOS-App kann einen PeekabooBridge-Socket hosten, damit die `peekaboo`-CLI die
lokalen Freigaben der App für Bedienungshilfen und Bildschirmaufnahme für Peekaboos eigene
Automatisierungstools wiederverwenden kann. Diese Bridge installiert oder proxyt Codex Computer Use nicht, und
Codex Computer Use ruft nicht über den PeekabooBridge-Socket auf.

Verwenden Sie [Peekaboo-Bridge](/de/platforms/mac/peekaboo), wenn OpenClaw.app ein
berechtigungsbewusster Host für Peekaboo-CLI-Automatisierung sein soll. Verwenden Sie diese Seite, wenn einem
OpenClaw-Agenten im Codex-Modus das native MCP-Plugin `computer-use` von Codex
verfügbar sein soll, bevor der Turn startet.

## iOS-App

Die iOS-App ist von Codex Computer Use getrennt. Sie installiert oder proxyt den
Codex-MCP-Server `computer-use` nicht und ist kein Backend für Desktop-Steuerung.
Stattdessen verbindet sich die iOS-App als OpenClaw-Node und stellt mobile
Funktionen über Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`,
`location.*` und `talk.*` bereit.

Verwenden Sie [iOS](/de/platforms/ios), wenn ein Agent einen iPhone-Node über das
Gateway steuern soll. Verwenden Sie diese Seite, wenn ein Agent im Codex-Modus den lokalen
macOS-Desktop über Codex' natives Computer Use-Plugin steuern soll.

## Direktes cua-driver-MCP

Codex Computer Use ist nicht die einzige Möglichkeit, Desktop-Steuerung bereitzustellen. Wenn Sie möchten,
dass von OpenClaw verwaltete Runtimes den Treiber von TryCua direkt aufrufen, verwenden Sie den Upstream-
Server `cua-driver mcp` über die MCP-Registry von OpenClaw statt des
Codex-spezifischen Marketplace-Ablaufs.

Nach der Installation von `cua-driver` können Sie entweder den OpenClaw-Befehl anfordern:

```bash
cua-driver mcp-config --client openclaw
```

oder den stdio-Server selbst registrieren:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dieser Pfad erhält die Upstream-MCP-Tooloberfläche intakt, einschließlich der Treiber-
Schemas und strukturierten MCP-Antworten. Verwenden Sie ihn, wenn der CUA-Treiber
als normaler OpenClaw-MCP-Server verfügbar sein soll. Verwenden Sie die Codex Computer Use-Einrichtung auf
dieser Seite, wenn Codex app-server Plugin-Installation, MCP-Neuladungen
und native Toolaufrufe innerhalb von Turns im Codex-Modus besitzen soll.

Der CUA-Treiber ist macOS-spezifisch und benötigt weiterhin die lokalen macOS-Berechtigungen,
nach denen seine App fragt, etwa Bedienungshilfen und Bildschirmaufnahme. OpenClaw
installiert `cua-driver` nicht, gewährt diese Berechtigungen nicht und umgeht das Sicherheitsmodell
des Upstream-Treibers nicht.

## Schnelle Einrichtung

Setzen Sie `plugins.entries.codex.config.computerUse`, wenn Turns im Codex-Modus
Computer Use verfügbar haben müssen, bevor ein Thread startet. `autoInstall: true` aktiviert
Computer Use und erlaubt OpenClaw, es vor dem Turn zu installieren oder erneut zu aktivieren:

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

Mit dieser Konfiguration prüft OpenClaw Codex app-server vor jedem Turn im Codex-Modus.
Wenn Computer Use fehlt, Codex app-server aber bereits einen installierbaren
Marketplace entdeckt hat, fordert OpenClaw Codex app-server auf, das Plugin zu installieren oder erneut zu aktivieren
und MCP-Server neu zu laden. Wenn unter macOS kein passender Marketplace
registriert ist und das Standard-Codex-App-Bundle existiert, versucht OpenClaw außerdem,
den gebündelten Codex-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zu registrieren, bevor es
fehlschlägt. Wenn die Einrichtung den MCP-Server weiterhin nicht verfügbar machen kann, schlägt der Turn
fehl, bevor der Thread startet.

Nach Änderungen an der Computer Use-Konfiguration verwenden Sie `/new` oder `/reset` im betroffenen Chat,
bevor Sie testen, falls bereits ein bestehender Codex-Thread gestartet wurde.

Beim verwalteten stdio-Start unter macOS bevorzugt OpenClaw das signierte Desktop-Codex-App-
Bundle unter `/Applications/Codex.app/Contents/Resources/codex`, wenn es existiert.
Dadurch bleibt Computer Use unter dem App-Bundle, dem die lokalen Berechtigungen für
Desktop-Steuerung gehören. Wenn die Desktop-App nicht installiert ist, fällt OpenClaw auf die
verwaltete Codex-Binärdatei zurück, die neben dem Plugin installiert ist. Wenn eine installierte Desktop-App
mit einer nicht unterstützten app-server-Version initialisiert, schließt OpenClaw diesen Child-Prozess
und versucht stattdessen den nächsten Kandidaten für eine verwaltete Binärdatei, damit eine veraltete
Desktop-App den Plugin-lokalen Fallback nicht überdeckt. Eine explizite `appServer.command`-
Konfiguration oder `OPENCLAW_CODEX_APP_SERVER_BIN` überschreibt diese verwaltete
Auswahl weiterhin.

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
aktiviert keine Codex-Plugin-Unterstützung. Wenn keine Konfiguration Computer Use aktiviert, kann `status`
auch nach einem einmaligen Installationsbefehl deaktiviert melden.

`install` aktiviert die Plugin-Unterstützung von Codex app-server, fügt optional eine konfigurierte
Marketplace-Quelle hinzu, installiert oder reaktiviert das konfigurierte Plugin über Codex
app-server, lädt MCP-Server neu und verifiziert, dass der MCP-Server Tools bereitstellt.
Da die Installation vertrauenswürdige Host-Ressourcen ändert, kann nur ein Owner oder ein
`operator.admin`-Gateway-Client `install` ausführen. Andere autorisierte Absender können
den schreibgeschützten Befehl `status` weiterhin verwenden, auch mit Overrides.

## Marketplace-Optionen

OpenClaw verwendet dieselbe app-server-API, die Codex selbst bereitstellt. Die
Marketplace-Felder wählen aus, wo Codex `computer-use` finden soll.

| Feld                 | Verwenden, wenn                                                  | Installationsunterstützung                               |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Kein Marketplace-Feld | Codex app-server soll bereits bekannte Marketplaces verwenden.   | Ja, wenn app-server einen lokalen Marketplace zurückgibt. |
| `marketplaceSource`  | Sie haben eine Codex-Marketplace-Quelle, die app-server hinzufügen kann. | Ja, für explizites `/codex computer-use install`.        |
| `marketplacePath`    | Sie kennen bereits den lokalen Marketplace-Dateipfad auf dem Host. | Ja, für explizite Installation und Auto-Installation beim Turn-Start. |
| `marketplaceName`    | Sie möchten einen bereits registrierten Marketplace nach Name auswählen. | Ja, nur wenn der ausgewählte Marketplace einen lokalen Pfad hat. |

Neue Codex-Homes benötigen möglicherweise einen kurzen Moment, um ihre offiziellen Marketplaces
zu initialisieren. Während der Installation pollt OpenClaw `plugin/list` bis zu
`marketplaceDiscoveryTimeoutMs` Millisekunden lang. Der Standardwert ist 60 Sekunden.

Wenn mehrere bekannte Marketplaces Computer Use enthalten, bevorzugt OpenClaw
`openai-bundled`, dann `openai-curated`, dann `local`. Unbekannte mehrdeutige Treffer
schlagen geschlossen fehl und fordern Sie auf, `marketplaceName` oder `marketplacePath` zu setzen.

## Gebündelter macOS-Marketplace

Aktuelle Codex-Desktop-Builds bündeln Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wenn `computerUse.autoInstall` true ist und kein Marketplace mit
`computer-use` registriert ist, versucht OpenClaw automatisch, die standardmäßige gebündelte
Marketplace-Root hinzuzufügen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Sie können sie auch explizit aus einer Shell mit Codex registrieren:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Wenn Sie einen nicht standardmäßigen Codex-App-Pfad verwenden, führen Sie `/codex computer-use install
--source <marketplace-root>` einmal aus oder setzen Sie `computerUse.marketplacePath` auf einen
lokalen Marketplace-Dateipfad. Verwenden Sie `--marketplace-path` nur, wenn Sie den
Marketplace-JSON-Dateipfad haben, nicht die gebündelte Marketplace-Root.

## Limit für Remote-Kataloge

Codex app-server kann reine Remote-Katalogeinträge auflisten und lesen, unterstützt aber derzeit
kein Remote-`plugin/install`. Das bedeutet, dass `marketplaceName` für Statusprüfungen
einen reinen Remote-Marketplace auswählen kann, Installationen und Reaktivierungen aber weiterhin
einen lokalen Marketplace über `marketplaceSource` oder `marketplacePath` benötigen.

Wenn der Status meldet, dass das Plugin in einem Remote-Codex-Marketplace verfügbar ist, Remote-
Installation aber nicht unterstützt wird, führen Sie install mit einer lokalen Quelle oder einem Pfad aus:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Konfigurationsreferenz

| Feld                            | Standard       | Bedeutung                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | abgeleitet     | Computer Use verlangen. Standardmäßig true, wenn ein anderes Computer Use-Feld gesetzt ist. |
| `autoInstall`                   | false          | Beim Turn-Start aus bereits entdeckten Marketplaces installieren oder erneut aktivieren. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Wie lange install auf die Marketplace-Erkennung von Codex app-server wartet.    |
| `marketplaceSource`             | nicht gesetzt  | Quellzeichenfolge, die an `marketplace/add` von Codex app-server übergeben wird. |
| `marketplacePath`               | nicht gesetzt  | Lokaler Codex-Marketplace-Dateipfad, der das Plugin enthält.                   |
| `marketplaceName`               | nicht gesetzt  | Name des registrierten Codex-Marketplace, der ausgewählt werden soll.           |
| `pluginName`                    | `computer-use` | Codex-Marketplace-Pluginname.                                                  |
| `mcpServerName`                 | `computer-use` | MCP-Servername, der vom installierten Plugin bereitgestellt wird.               |

Die Auto-Installation beim Turn-Start lehnt konfigurierte `marketplaceSource`-
Werte absichtlich ab. Das Hinzufügen einer neuen Quelle ist ein expliziter Einrichtungsschritt. Verwenden Sie daher
einmal `/codex computer-use install --source <marketplace-source>` und lassen Sie danach
`autoInstall` künftige Reaktivierungen aus entdeckten lokalen Marketplaces übernehmen.
Die Auto-Installation beim Turn-Start kann einen konfigurierten `marketplacePath` verwenden, weil dies
bereits ein lokaler Pfad auf dem Host ist.

## Was OpenClaw prüft

OpenClaw meldet intern einen stabilen Einrichtungsgrund und formatiert den nutzerseitigen
Status für den Chat:

| Grund                        | Bedeutung                                             | Nächster Schritt                              |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` wurde zu false aufgelöst.       | Setzen Sie `enabled` oder ein anderes Computer Use-Feld. |
| `marketplace_missing`        | Kein passender Marketplace war verfügbar.             | Konfigurieren Sie Quelle, Pfad oder Marketplace-Namen. |
| `plugin_not_installed`       | Marketplace existiert, aber das Plugin ist nicht installiert. | Führen Sie die Installation aus oder aktivieren Sie `autoInstall`. |
| `plugin_disabled`            | Plugin ist installiert, aber in der Codex-Konfiguration deaktiviert. | Führen Sie die Installation aus, um es wieder zu aktivieren. |
| `remote_install_unsupported` | Ausgewählter Marketplace ist nur remote verfügbar.    | Verwenden Sie `marketplaceSource` oder `marketplacePath`. |
| `mcp_missing`                | Plugin ist aktiviert, aber der MCP-Server ist nicht verfügbar. | Prüfen Sie Codex Computer Use und OS-Berechtigungen. |
| `ready`                      | Plugin- und MCP-Tools sind verfügbar.                 | Starten Sie den Codex-Modus-Durchlauf.        |
| `check_failed`               | Eine Codex-App-Server-Anfrage ist während der Statusprüfung fehlgeschlagen. | Prüfen Sie App-Server-Konnektivität und Logs. |
| `auto_install_blocked`       | Die Einrichtung beim Durchlaufstart müsste eine neue Quelle hinzufügen. | Führen Sie zuerst eine explizite Installation aus. |

Die Chat-Ausgabe enthält den Plugin-Status, den MCP-Server-Status, den Marketplace, Tools
falls verfügbar, sowie die spezifische Meldung für den fehlgeschlagenen Einrichtungsschritt.

## macOS-Berechtigungen

Computer Use ist macOS-spezifisch. Der Codex-eigene MCP-Server benötigt möglicherweise lokale OS-
Berechtigungen, bevor er Apps prüfen oder steuern kann. Wenn OpenClaw meldet, dass Computer Use
installiert ist, der MCP-Server aber nicht verfügbar ist, prüfen Sie zuerst die Codex-seitige
Computer Use-Einrichtung:

- Der Codex-App-Server läuft auf demselben Host, auf dem die Desktop-Steuerung
  erfolgen soll.
- Das Computer Use-Plugin ist in der Codex-Konfiguration aktiviert.
- Der `computer-use`-MCP-Server erscheint im MCP-Status des Codex-App-Servers.
- macOS hat die erforderlichen Berechtigungen für die Desktop-Steuerungs-App erteilt.
- Die aktuelle Host-Sitzung kann auf den gesteuerten Desktop zugreifen.

OpenClaw schlägt absichtlich geschlossen fehl, wenn `computerUse.enabled` true ist. Ein
Codex-Modus-Durchlauf sollte nicht stillschweigend ohne die nativen Desktop-Tools fortfahren,
die die Konfiguration verlangt.

## Fehlerbehebung

**Status meldet nicht installiert.** Führen Sie `/codex computer-use install` aus. Wenn der
Marketplace nicht erkannt wird, übergeben Sie `--source` oder `--marketplace-path`.

**Status meldet installiert, aber deaktiviert.** Führen Sie `/codex computer-use install` erneut aus.
Die Installation über den Codex-App-Server schreibt die Plugin-Konfiguration wieder als aktiviert zurück.

**Status meldet, dass Remote-Installation nicht unterstützt wird.** Verwenden Sie eine lokale Marketplace-Quelle oder
einen Pfad. Nur-Remote-Katalogeinträge können geprüft, aber nicht über die
aktuelle App-Server-API installiert werden.

**Status meldet, dass der MCP-Server nicht verfügbar ist.** Führen Sie die Installation einmal erneut aus, damit MCP-
Server neu geladen werden. Wenn er weiterhin nicht verfügbar ist, beheben Sie die Codex Computer Use-App,
den MCP-Status des Codex-App-Servers oder die macOS-Berechtigungen.

**Status oder ein Probe läuft bei `computer-use.list_apps` in ein Timeout.** Das Plugin und der MCP-
Server sind vorhanden, aber die lokale Computer Use-Bridge hat nicht geantwortet. Beenden oder
starten Sie Codex Computer Use neu, starten Sie bei Bedarf Codex Desktop neu, und versuchen Sie es dann in einer
frischen OpenClaw-Sitzung erneut. Wenn der Host zuvor Computer Use über einen älteren
verwalteten Codex-App-Server ausgeführt hat, aktualisieren Sie das installierte Plugin aus dem Desktop-gebündelten
Marketplace:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Ein Computer Use-Tool meldet `Native hook relay unavailable`.** Der Codex-native
Tool-Hook konnte kein aktives OpenClaw-Relay über die lokale Bridge oder
den Gateway-Fallback erreichen. Starten Sie eine frische OpenClaw-Sitzung mit `/new` oder `/reset`. Wenn es
einmal funktioniert und dann bei einem späteren Tool-Aufruf erneut fehlschlägt, bereinigt `/new` nur den
aktuellen Versuch; starten Sie den Codex-App-Server oder den OpenClaw Gateway neu, damit alte Threads
und Hook-Registrierungen verworfen werden, und versuchen Sie es dann in einer frischen Sitzung erneut.

**Die automatische Installation beim Durchlaufstart verweigert eine Quelle.** Das ist beabsichtigt. Fügen Sie die
Quelle zuerst explizit mit `/codex computer-use install --source <marketplace-source>` hinzu;
anschließend kann die automatische Installation bei künftigen Durchlaufstarts den erkannten lokalen
Marketplace verwenden.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Peekaboo-Bridge](/de/platforms/mac/peekaboo)
- [iOS-App](/de/platforms/ios)
