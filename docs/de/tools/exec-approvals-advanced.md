---
read_when:
    - Sichere Binärdateien oder benutzerdefinierte Profile für sichere Binärdateien konfigurieren
    - Weiterleitung von Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle
    - Implementieren eines nativen Genehmigungsclients für einen Kanal
summary: 'Erweiterte Ausführungsgenehmigungen: sichere Binärdateien, Interpreter-Bindung, Weiterleitung von Genehmigungen, native Zustellung'
title: Exec-Genehmigungen — erweitert
x-i18n:
    generated_at: "2026-07-12T15:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Fortgeschrittene Themen zu Ausführungsgenehmigungen: der `safeBins`-Schnellpfad, die Bindung von Interpretern/Laufzeitumgebungen und die Weiterleitung von Genehmigungen an Chat-Kanäle (einschließlich nativer Zustellung).
Die grundlegende Richtlinie und den Genehmigungsablauf finden Sie unter [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Sichere Binärdateien (nur stdin)

`tools.exec.safeBins` benennt **ausschließlich über stdin arbeitende** Binärdateien (beispielsweise `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden. Sichere Binärdateien lehnen positionale Dateiargumente und pfadähnliche Token ab, sodass sie nur den eingehenden Datenstrom verarbeiten können. Betrachten Sie dies als einen eng begrenzten Schnellpfad für Datenstromfilter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Laufzeitbinärdateien (beispielsweise `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl konzeptionell Code auswerten, Unterbefehle ausführen oder Dateien lesen kann, verwenden Sie vorzugsweise explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert. Benutzerdefinierte sichere Binärdateien müssen unter `tools.exec.safeBinProfiles.<bin>` ein explizites Profil definieren.
</Warning>

Standardmäßige sichere Binärdateien:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste enthalten. Wenn Sie sie aktivieren, behalten Sie explizite Allowlist-Einträge für deren Arbeitsabläufe ohne stdin bei. Geben Sie für `grep` im Safe-Bin-Modus das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt, damit Dateioperanden nicht als mehrdeutige positionale Argumente eingeschleust werden können.

### Argv-Validierung und abgelehnte Flags

Die Validierung erfolgt deterministisch ausschließlich anhand der argv-Struktur (ohne Existenzprüfungen im Host-Dateisystem), wodurch ein Datei-Existenz-Orakel aufgrund unterschiedlicher Zulassungs-/Ablehnungsergebnisse verhindert wird. Dateiorientierte Optionen werden für standardmäßige sichere Binärdateien abgelehnt; lange Optionen werden nach dem Fail-Closed-Prinzip validiert (unbekannte Flags und mehrdeutige Abkürzungen werden abgelehnt). Erkannte schreibgeschützte boolesche Flags der standardmäßigen Binärdateien (beispielsweise `wc -l`, `tr -d`, `uniq -c`) werden akzeptiert, während unbekannte kurze Flags nach dem Fail-Closed-Prinzip behandelt werden und eine manuelle Genehmigung erfordern.

Nach Safe-Bin-Profil abgelehnte Flags:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Binärdateien erzwingen außerdem, dass argv-Token zur Ausführungszeit für ausschließlich über stdin arbeitende Segmente als **Literaltext** behandelt werden (kein Globbing und keine `$VARS`-Expansion), sodass Muster wie `*` oder `$HOME/...` nicht zum Einschleusen von Dateizugriffen verwendet werden können. `awk`, `sed` und `jq` werden als sichere Binärdateien immer abgelehnt, da ihre Semantik nicht auf eine ausschließliche stdin-Verarbeitung validiert werden kann: `jq` kann Umgebungsdaten lesen und jq-Code aus Modulen oder Startdateien laden. Verwenden Sie für diese Werkzeuge statt `safeBins` einen expliziten Allowlist-Eintrag oder eine Genehmigungsaufforderung.

### Vertrauenswürdige Verzeichnisse für Binärdateien

Sichere Binärdateien müssen aus vertrauenswürdigen Verzeichnissen für Binärdateien aufgelöst werden (Systemstandards plus optional `tools.exec.safeBinTrustedDirs`). `PATH`-Einträgen wird niemals automatisch vertraut. Die standardmäßig vertrauenswürdigen Verzeichnisse sind bewusst minimal gehalten: `/bin`, `/usr/bin`. Wenn sich Ihre Safe-Bin-Ausführungsdatei in Paketmanager-/Benutzerpfaden befindet (beispielsweise `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist zulässig, wenn jedes Segment der obersten Ebene die Allowlist erfüllt (einschließlich sicherer Binärdateien oder automatischer Skill-Zulassung). Umleitungen werden im Allowlist-Modus weiterhin nicht unterstützt. Befehlssubstitution (`$()` / Backticks) wird bei der Allowlist-Analyse abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie literalen `$()`-Text benötigen.

Bei Genehmigungen über die macOS-Begleit-App wird unverarbeiteter Shell-Text, der Shell-Steuerungs- oder Expansionssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als fehlender Allowlist-Treffer behandelt, sofern die Shell-Binärdatei selbst nicht auf der Allowlist steht.

Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden anfragespezifische Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Bei `allow-always`-Entscheidungen im Allowlist-Modus speichern transparente Dispatch-Wrapper (beispielsweise `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) den Pfad der inneren Ausführungsdatei statt des Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash` usw.) auf dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer nicht sicher entpackt werden kann, wird nicht automatisch ein Allowlist-Eintrag gespeichert.

Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, verwenden Sie vorzugsweise `tools.exec.strictInlineEval=true`, damit die Inline-Auswertung weiterhin eine explizite Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin unbedenkliche Interpreter-/Skriptaufrufe speichern, Inline-Auswertungsträger werden jedoch nicht automatisch gespeichert.

### Sichere Binärdateien im Vergleich zur Allowlist

| Thema              | `tools.exec.safeBins`                                             | Allowlist (`exec-approvals.json`)                                                                   |
| ------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Ziel               | Eng begrenzte stdin-Filter automatisch zulassen                   | Bestimmten Ausführungsdateien explizit vertrauen                                                    |
| Übereinstimmungstyp | Name der Ausführungsdatei + Safe-Bin-argv-Richtlinie              | Glob für den aufgelösten Pfad der Ausführungsdatei oder reinen Befehlsnamen bei über PATH aufgerufenen Befehlen |
| Argumentumfang     | Durch Safe-Bin-Profil und Regeln für literale Token eingeschränkt | Standardmäßig Pfadabgleich; optional kann `argPattern` die analysierten argv einschränken            |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                                        | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs                                          |
| Beste Verwendung   | Texttransformationen mit geringem Risiko in Pipelines             | Jedes Werkzeug mit umfassenderem Verhalten oder Nebenwirkungen                                      |

Konfigurationsort:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge befinden sich in der lokalen Genehmigungsdatei des Hosts unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Laufzeitbinärdateien ohne explizite Profile in `safeBins` erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` vorbereiten (anschließend prüfen und einschränken). Interpreter-/Laufzeitbinärdateien werden nicht automatisch vorbereitet.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
## Interpreter-/Laufzeitbefehle

Durch Genehmigungen abgesicherte Interpreter-/Laufzeitausführungen sind bewusst konservativ:

- Der exakte argv-/cwd-/env-Kontext wird immer gebunden.
- Direkte Shell-Skript- und direkte Laufzeitdateiformen werden nach bestem Bemühen an einen konkreten lokalen Dateischnappschuss gebunden.
- Gängige Paketmanager-Wrapperformen, die weiterhin zu genau einer direkten lokalen Datei aufgelöst werden (beispielsweise `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw nicht genau eine konkrete lokale Datei für einen Interpreter-/Laufzeitbefehl identifizieren kann (beispielsweise Paketskripte, Auswertungsformen, laufzeitspezifische Loader-Ketten oder mehrdeutige Formen mit mehreren Dateien), wird die genehmigungsgestützte Ausführung abgelehnt, statt eine nicht vorhandene semantische Abdeckung zu behaupten.
- Bevorzugen Sie für solche Arbeitsabläufe Sandboxing, eine separate Host-Grenze oder eine explizit vertrauenswürdige Allowlist beziehungsweise einen vollständigen Arbeitsablauf, bei dem der Betreiber die umfassendere Laufzeitsemantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Werkzeug sofort eine Genehmigungs-ID zurück. Verwenden Sie diese ID, um später auftretende Systemereignisse der genehmigten Ausführung (`Exec finished` und, sofern konfiguriert, `Exec running`) zuzuordnen.
Wenn vor Ablauf des Zeitlimits keine Entscheidung eintrifft, wird die Anfrage als Genehmigungszeitüberschreitung behandelt und als endgültige Ablehnung des Host-Befehls gemeldet. Bei asynchronen Genehmigungen des Haupt-Agenten mit einer Ursprungssitzung setzt OpenClaw diese Sitzung außerdem mit einer internen Folgemeldung fort, damit der Agent erkennt, dass der Befehl nicht ausgeführt wurde, anstatt später ein fehlendes Ergebnis zu reparieren. Ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

### Verhalten der Folgezustellung

Nachdem eine genehmigte asynchrone Exec-Ausführung abgeschlossen ist, sendet OpenClaw eine nachfolgende `agent`-Runde an dieselbe Sitzung.
Abgelehnte asynchrone Genehmigungen verwenden für den Ablehnungsstatus denselben Folgemeldungspfad der Hauptsitzung, registrieren jedoch keine Übergaben an eine privilegierte Laufzeitumgebung und führen den Befehl nicht aus. Ablehnungen ohne fortsetzbare Hauptsitzung werden entweder unterdrückt oder über einen sicheren direkten Pfad gemeldet, sofern ein solcher vorhanden ist.

- Wenn ein gültiges externes Zustellungsziel vorhanden ist (zustellbarer Kanal plus Ziel `to`), verwendet die Folgezustellung diesen Kanal.
- Bei reinen Webchat- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Folgezustellung auf die Sitzung beschränkt (`deliver: false`).
- Wenn ein Aufrufer ausdrücklich eine strikte externe Zustellung verlangt, aber kein externer Kanal aufgelöst werden kann, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf eine reine Sitzungszustellung herabgestuft, anstatt fehlzuschlagen.

## Weiterleitung von Genehmigungen an Chat-Kanäle

Sie können Exec-Genehmigungsaufforderungen an jeden Chat-Kanal (einschließlich Plugin-Kanälen) weiterleiten und mit `/approve` genehmigen. Dabei wird die normale Pipeline für ausgehende Zustellungen verwendet.

Konfiguration:
__OC_I18N_900001__
Antwort im Chat:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID keiner ausstehenden Exec-Genehmigung entspricht, werden stattdessen automatisch die Plugin-Genehmigungen geprüft. Dieser Fallback ist auf Fehler der Art „Genehmigung nicht gefunden“ beschränkt; bei einer tatsächlichen Ablehnung oder einem Fehler einer Exec-Genehmigung erfolgt nicht stillschweigend ein erneuter Versuch als Plugin-Genehmigung.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen verwendet dieselbe Zustellungspipeline wie Exec-Genehmigungen, verfügt jedoch unter `approvals.plugin` über eine eigene unabhängige Konfiguration. Das Aktivieren oder Deaktivieren der einen Funktion wirkt sich nicht auf die andere aus.
Informationen zum Verhalten bei der Plugin-Erstellung, zu Anfragefeldern und zur Entscheidungssemantik finden Sie unter [Plugin-Berechtigungsanfragen](/plugins/plugin-permission-requests).
__OC_I18N_900003__
Die Konfigurationsstruktur ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, zeigen sowohl für Exec- als auch für
Plugin-Genehmigungen dieselben Genehmigungsschaltflächen an. Kanäle ohne gemeinsame interaktive
Benutzeroberfläche greifen auf Klartext mit `/approve`-Anweisungen zurück. Bei
Plugin-Genehmigungsanfragen können die verfügbaren Entscheidungen eingeschränkt sein:
Genehmigungsoberflächen verwenden die in der Anfrage deklarierte Entscheidungsmenge, und das
Gateway lehnt Versuche ab, eine nicht angebotene Entscheidung zu übermitteln.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine Exec- oder Plugin-Genehmigungsanfrage von einer Chat-Oberfläche stammt, über die
Nachrichten zugestellt werden können, kann sie standardmäßig in demselben Chat mit `/approve`
genehmigt werden. Dies gilt zusätzlich zu den bestehenden Abläufen der Web-Benutzeroberfläche und
Terminal-Benutzeroberfläche für Slack, Matrix, Microsoft Teams und ähnliche Chats, über die
Nachrichten zugestellt werden können. Dabei wird das normale Kanalauthentifizierungsmodell für
diese Unterhaltung verwendet. Wenn der ursprüngliche Chat bereits Befehle senden und Antworten
empfangen kann, benötigen ausstehende Genehmigungsanfragen nicht mehr allein zu diesem Zweck einen
separaten nativen Zustellungsadapter.

Discord, Telegram und QQ bot unterstützen ebenfalls `/approve` im selben Chat. Diese Kanäle
verwenden jedoch auch bei deaktivierter nativer Genehmigungszustellung weiterhin ihre aufgelöste
Liste der Genehmigungsberechtigten zur Autorisierung.

### Native Genehmigungszustellung

Einige Kanäle können auch als native Genehmigungsclients fungieren: Discord, Slack, Telegram,
Matrix und QQ bot. Native Clients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat um
Direktnachrichten an Genehmigungsberechtigte, eine Verteilung an den ursprünglichen Chat und eine
kanalspezifische interaktive Bedienoberfläche für Genehmigungen.

Wenn native Genehmigungskarten oder -schaltflächen verfügbar sind, ist diese native
Benutzeroberfläche der primäre Pfad für den Agenten. Der Agent sollte nicht zusätzlich einen
doppelten `/approve`-Befehl im normalen Chat ausgeben, sofern das Werkzeugergebnis nicht angibt,
dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige verbleibende
Pfad ist.

Wenn ein nativer Genehmigungsclient konfiguriert ist, aber für den ursprünglichen Kanal keine native
Runtime aktiv ist, hält OpenClaw die lokale deterministische `/approve`-Aufforderung sichtbar. Wenn
die native Runtime aktiv ist und eine Zustellung versucht, aber kein Ziel die Karte empfängt,
sendet OpenClaw im selben Chat einen Fallback-Hinweis mit dem exakten Befehl
`/approve <id> <decision>`, damit die Anfrage weiterhin bearbeitet werden kann.

Allgemeines Modell:

- Die Exec-Richtlinie des Hosts entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungsaufforderungen an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob kanalspezifische native Clients für Discord, Slack,
  Telegram, QQ bot und ähnliche Kanäle aktiviert sind
- Slack-Plugin-Genehmigungen können den nativen Genehmigungsclient von Slack verwenden, wenn die
  Anfrage aus Slack stammt und Slack-Plugin-Genehmigungsberechtigte aufgelöst werden können;
  `approvals.plugin` kann Plugin-Genehmigungen außerdem an Slack-Sitzungen oder -Ziele weiterleiten,
  selbst wenn Slack-Exec-Genehmigungen deaktiviert sind
- Native Genehmigungskarten von Google Chat verarbeiten Exec- und Plugin-Genehmigungen, die aus
  Google-Chat-Spaces oder -Threads stammen, wenn stabile `users/<id>`-Genehmigungsberechtigte aus
  `dm.allowFrom` oder `defaultTo` aufgelöst werden können; sie verwenden keine Reaktionsereignisse
  für Entscheidungen
- Die Zustellung von WhatsApp- und Signal-Reaktionsgenehmigungen wird durch `approvals.exec` und
  `approvals.plugin` gesteuert; sie verfügen über keine
  `channels.<channel>.execApprovals`-Blöcke

Native Genehmigungsclients aktivieren die Zustellung vorrangig per Direktnachricht automatisch,
wenn alle folgenden Bedingungen erfüllt sind:

- Der Kanal unterstützt die native Genehmigungszustellung
- Genehmigungsberechtigte können aus expliziten `execApprovals.approvers` oder einer
  Eigentümeridentität wie `commands.ownerAllowFrom` aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht festgelegt oder auf `"auto"` gesetzt

Setzen Sie `enabled: false`, um einen nativen Genehmigungsclient ausdrücklich zu deaktivieren.
Setzen Sie `enabled: true`, um seine Aktivierung zu erzwingen, wenn Genehmigungsberechtigte
aufgelöst werden können. Die öffentliche Zustellung an den ursprünglichen Chat bleibt über
`channels.<channel>.execApprovals.target` explizit konfiguriert. Wenn das native `target` die
Zustellung an den ursprünglichen Chat aktiviert, enthalten Genehmigungsaufforderungen den
Befehlstext.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: Konfigurieren Sie stabile Genehmigungsberechtigte mit
  `channels.googlechat.dm.allowFrom` oder `channels.googlechat.defaultTo`; ein
  `execApprovals`-Block ist nicht erforderlich
- WhatsApp: Verwenden Sie `approvals.exec` und `approvals.plugin`, um Genehmigungsaufforderungen an
  WhatsApp weiterzuleiten
- Signal: Verwenden Sie `approvals.exec` und `approvals.plugin`, um Genehmigungsaufforderungen an
  Signal weiterzuleiten

Für native Clients spezifische Weiterleitung:

- Telegram verwendet standardmäßig Direktnachrichten an Genehmigungsberechtigte (`target: "dm"`).
  Wechseln Sie zu `channel` oder `both`, um Genehmigungsaufforderungen auch im ursprünglichen
  Telegram-Chat oder -Thema anzuzeigen. Bei Telegram-Forenthemen behält OpenClaw das Thema sowohl
  für die Genehmigungsaufforderung als auch für die anschließende Nachricht nach der Genehmigung bei.
- Genehmigungsberechtigte für Discord und Telegram können explizit angegeben
  (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden; nur aufgelöste
  Genehmigungsberechtigte können genehmigen oder ablehnen.
- Slack-Genehmigungsberechtigte können explizit angegeben (`execApprovals.approvers`) oder aus
  `commands.ownerAllowFrom` abgeleitet werden. Direktnachrichten für
  Slack-Plugin-Genehmigungen verwenden Slack-Plugin-Genehmigungsberechtigte aus `allowFrom` und die
  Standardweiterleitung des Kontos, nicht die Genehmigungsberechtigten für Slack-Exec. Native
  Slack-Schaltflächen bewahren die Art der Genehmigungs-ID, sodass `plugin:`-IDs
  Plugin-Genehmigungen ohne eine zweite lokale Slack-Fallback-Ebene bearbeiten können.
- Native Google-Chat-Karten bewahren den manuellen `/approve`-Fallback im Nachrichtentext, aber
  Rückrufe von Kartenschaltflächen übertragen nur undurchsichtige Aktionstoken; die Genehmigungs-ID
  und die Entscheidung werden aus dem serverseitigen ausstehenden Zustand wiederhergestellt.
- WhatsApp-Emoji-Genehmigungen verarbeiten sowohl Exec- als auch Plugin-Aufforderungen, wenn die
  entsprechende Weiterleitungsfamilie auf oberster Ebene an WhatsApp weiterleitet. Aufforderungen
  nativen Ursprungs werden direkt gebunden; bei der Zustellung im gemeinsamen Zielmodus werden
  dieselben typisierten Genehmigungsmetadaten an die akzeptierte WhatsApp-Empfangsbestätigung
  gebunden.
- Signal-Reaktionsgenehmigungen verarbeiten Exec- und Plugin-Aufforderungen nur, wenn die
  entsprechende Weiterleitungsfamilie auf oberster Ebene aktiviert ist und an Signal weiterleitet.
  Direkte Signal-Exec-Genehmigungen im selben Chat können den lokalen `/approve`-Fallback ohne
  explizite Genehmigungsberechtigte unterdrücken; die Auflösung von Signal-Reaktionen erfordert
  weiterhin explizite Signal-Genehmigungsberechtigte aus `channels.signal.allowFrom` oder
  `defaultTo`.
- Die native Matrix-Weiterleitung per Direktnachricht oder Kanal sowie Reaktionskürzel verarbeiten
  sowohl Exec- als auch Plugin-Genehmigungen; die Plugin-Autorisierung stammt weiterhin aus
  `channels.matrix.dm.allowFrom`. Native Matrix-Aufforderungen enthalten beim ersten
  Aufforderungsereignis benutzerdefinierte `com.openclaw.approval`-Ereignisinhalte, sodass
  OpenClaw-kompatible Matrix-Clients strukturierte Genehmigungszustände lesen können, während
  Standardclients den Klartext-Fallback `/approve` beibehalten.
- Native Genehmigungsschaltflächen von Discord und Telegram übertragen in
  transportprivaten Rückrufdaten eine explizite Eigentümerart für Exec oder Plugin und lösen nur
  diesen Eigentümer auf. Ältere `/approve`-Steuerelemente ohne Art bleiben ein begrenzter
  Kompatibilitätspfad: Sie versuchen nur Eigentümerarten, die der Akteur genehmigen darf, fahren
  nur nach dem Ergebnis „Genehmigung nicht gefunden“ fort und leiten die Eigentümerschaft niemals
  aus der Genehmigungs-ID ab.
- Die anfragende Person muss nicht genehmigungsberechtigt sein.
- Wenn keine Bedienoberfläche oder kein konfigurierter Genehmigungsclient die Anfrage annehmen kann,
  greift die Aufforderung auf `askFallback` zurück.

Sensible, ausschließlich Eigentümern vorbehaltene Gruppenbefehle wie `/diagnostics` und
`/export-trajectory` verwenden eine private Eigentümerweiterleitung für Genehmigungsaufforderungen
und endgültige Ergebnisse. OpenClaw versucht zunächst eine private Route auf derselben Oberfläche,
auf der der Eigentümer den Befehl ausgeführt hat. Wenn diese Oberfläche über keine private
Eigentümerroute verfügt, greift OpenClaw auf die erste verfügbare Eigentümerroute aus
`commands.ownerAllowFrom` zurück. Dadurch kann ein Discord-Gruppenbefehl die Genehmigung und das
Ergebnis weiterhin an die Telegram-Direktnachrichten des Eigentümers senden, wenn Telegram als
primäre private Oberfläche konfiguriert ist. Der Gruppenchat erhält nur eine kurze Bestätigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Offizielle mobile Bedien-Apps

Die offiziellen iOS- und Android-Apps können außerdem ausstehende Exec-Genehmigungen im Besitz des
Gateways prüfen, wenn eine `operator.admin`-Verbindung verwendet wird oder wenn das gekoppelte
`operator.approvals`-Gerät ausdrücklich als Ziel der Anfrage angegeben wurde. Sie lesen denselben
bereinigten, dauerhaften Datensatz, den die Control UI verwendet, übermitteln eine Entscheidung
unter Berücksichtigung der Art und zeigen das kanonische Ergebnis der ersten Antwort des Gateways
an. Die Apple Watch spiegelt diese Genehmigungsaufforderungen über das gekoppelte iPhone und bietet
Aktionen zum einmaligen Zulassen und Ablehnen. Im direkten Watch-Gateway-Modus werden Genehmigungen
nicht geprüft.

Eine verloren gegangene Bestätigung der Bearbeitung macht die übermittelte Auswahl nicht
maßgeblich: Die App deaktiviert die Steuerelemente und liest den Datensatz erneut. Wenn eine andere
Oberfläche zuerst war, zeigt die App die dort erfasste Entscheidung an. Ausstehende Aufforderungen
bleiben an das Gateway gebunden, das sie ausgegeben hat. Daher kann der Wechsel des aktiven Gateways
eine alte Genehmigungs-ID nicht umleiten.

### macOS-IPC-Ablauf
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token in `exec-approvals.json` gespeichert.
- Überprüfung auf dieselbe UID.
- Challenge-Response (Nonce + HMAC-Token + Anfrage-Hash) + kurze TTL.

## FAQ

### Wann werden `accountId` und `threadId` für ein Genehmigungsziel verwendet?

Verwenden Sie `accountId`, wenn für den Kanal mehrere Identitäten konfiguriert sind und die
Genehmigungsaufforderung über ein bestimmtes Konto gesendet werden muss. Verwenden Sie `threadId`,
wenn das Ziel Themen oder Threads unterstützt und die Aufforderung innerhalb dieses Threads statt
im Chat auf oberster Ebene verbleiben soll.

Ein konkreter Telegram-Fall ist eine Betriebs-Supergruppe mit Forenthemen und zwei
Telegram-Bot-Konten. Der Wert `to` bezeichnet die Supergruppe, `accountId` wählt das Bot-Konto aus
und `threadId` wählt das Forenthema aus:
__OC_I18N_900005__
Mit dieser Einrichtung werden weitergeleitete Exec-Genehmigungen durch das Telegram-Konto
`ops-bot` im Thema `77` des Chats `-1001234567890` veröffentlicht. Ein Ziel ohne `accountId`
verwendet das Standardkonto des Kanals, und ein Ziel ohne `threadId` veröffentlicht am Ziel auf
oberster Ebene.

### Kann jede Person in einer Sitzung dort eingehende Genehmigungen erteilen?

Nein. Die Sitzungszustellung steuert nur, wo die Aufforderung erscheint. Sie autorisiert nicht von
sich aus alle Teilnehmenden dieses Chats zur Genehmigung.

Für das allgemeine `/approve` im selben Chat muss die absendende Person bereits für Befehle in
dieser Kanalsitzung autorisiert sein. Wenn der Kanal explizite Genehmigungsberechtigte bereitstellt,
können diese die `/approve`-Aktion autorisieren, auch wenn sie ansonsten in dieser Sitzung nicht
zur Ausführung von Befehlen autorisiert sind.

Einige Kanäle sind strenger. Discord, Telegram, Matrix, native Direktnachrichten für
Slack-Genehmigungen und ähnliche native Genehmigungsclients verwenden ihre aufgelösten Listen der
Genehmigungsberechtigten zur Genehmigungsautorisierung. Beispielsweise kann eine
Genehmigungsaufforderung in einem Telegram-Forenthema für alle Personen im Thema sichtbar sein,
aber nur numerische Telegram-Benutzer-IDs, die aus
`channels.telegram.execApprovals.approvers` oder `commands.ownerAllowFrom` aufgelöst wurden, können
sie genehmigen oder ablehnen.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals) — zentrale Richtlinie und Genehmigungsablauf
- [Exec-Werkzeug](/de/tools/exec)
- [Erweiterter Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — durch Skills unterstütztes automatisches Zulassungsverhalten
