---
read_when:
    - Sichere Binärdateien oder benutzerdefinierte Profile für sichere Binärdateien konfigurieren
    - Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle weiterleiten
    - Implementierung eines nativen Genehmigungsclients für einen Kanal
summary: 'Erweiterte Ausführungsgenehmigungen: sichere Binärdateien, Interpreter-Bindung, Genehmigungsweiterleitung, native Zustellung'
title: Ausführungsgenehmigungen — erweitert
x-i18n:
    generated_at: "2026-07-24T04:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac90d41f867a8ae4f14b6c9c13f3732d102a65707f456623932b858145a9bf46
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Erweiterte Themen zu Ausführungsgenehmigungen: der `safeBins`-Schnellpfad, die Bindung von Interpreter/Laufzeitumgebung
und die Weiterleitung von Genehmigungen an Chat-Kanäle (einschließlich nativer Zustellung).
Die grundlegende Richtlinie und den Genehmigungsablauf finden Sie unter [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Sichere Binärdateien (nur stdin)

`tools.exec.safeBins` bezeichnet Binärdateien, die **ausschließlich stdin** verwenden (zum Beispiel `cut`) und
im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden. Sichere Binärdateien lehnen
positionsgebundene Dateiargumente und pfadähnliche Token ab, sodass sie ausschließlich den
eingehenden Datenstrom verarbeiten können. Behandeln Sie dies als eng begrenzten Schnellpfad für Datenstromfilter, nicht als
allgemeine Vertrauensliste.

<Warning>
Fügen Sie Interpreter- oder Laufzeit-Binärdateien (zum Beispiel `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) **nicht** zu `safeBins` hinzu. Wenn ein Befehl konstruktionsbedingt Code auswerten,
Unterbefehle ausführen oder Dateien lesen kann, verwenden Sie vorzugsweise explizite Allowlist-Einträge
und lassen Sie Genehmigungsaufforderungen aktiviert. Benutzerdefinierte sichere Binärdateien müssen ein explizites
Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standardmäßige sichere Binärdateien:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste enthalten. Wenn Sie sie aktivieren, behalten Sie explizite
Allowlist-Einträge für deren Arbeitsabläufe bei, die nicht ausschließlich stdin verwenden. Geben Sie für `grep` im Modus für sichere Binärdateien
das Muster mit `-e`/`--regexp` an; die positionsgebundene Musterform wird abgelehnt,
damit Dateioperanden nicht als mehrdeutige Positionsargumente eingeschleust werden können.

### Argv-Validierung und abgelehnte Flags

Die Validierung erfolgt deterministisch allein anhand der argv-Struktur (ohne
Existenzprüfungen im Host-Dateisystem). Dadurch wird verhindert, dass Unterschiede zwischen Zulassen und Ablehnen
als Orakel für die Dateiexistenz dienen. Dateibezogene Optionen werden für standardmäßige sichere Binärdateien abgelehnt; lange
Optionen werden nach dem Fail-Closed-Prinzip validiert (unbekannte Flags und mehrdeutige Abkürzungen werden
abgelehnt). Erkannte schreibgeschützte boolesche Flags der standardmäßigen Binärdateien (zum Beispiel
`wc -l`, `tr -d`, `uniq -c`) werden akzeptiert, während nicht erkannte kurze Flags weiterhin
nach dem Fail-Closed-Prinzip behandelt werden und eine manuelle Genehmigung erfordern.

Nach Profil der sicheren Binärdatei abgelehnte Flags:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Binärdateien erzwingen außerdem, dass argv-Token bei der Ausführung von Segmenten, die ausschließlich stdin verwenden,
als **Literaltext** behandelt werden (kein Globbing und keine `$VARS`-Expansion), sodass
Muster wie `*` oder `$HOME/...` nicht zum Einschleusen von Dateilesevorgängen verwendet werden können. `awk`,
`sed` und `jq` werden als sichere Binärdateien immer abgelehnt, da sich ihre Semantik nicht
als ausschließlich stdin-basiert validieren lässt: `jq` kann Umgebungsdaten lesen und jq-Code aus
Modulen oder Startdateien laden. Verwenden Sie für diese Werkzeuge anstelle von `safeBins`
einen expliziten Allowlist-Eintrag oder eine Genehmigungsaufforderung.

### Vertrauenswürdige Binärverzeichnisse

Sichere Binärdateien müssen aus vertrauenswürdigen Binärverzeichnissen aufgelöst werden (Systemstandards plus
optional `tools.exec.safeBinTrustedDirs`). `PATH`-Einträge gelten niemals automatisch als vertrauenswürdig.
Die standardmäßig vertrauenswürdigen Verzeichnisse sind bewusst minimal: `/bin`, `/usr/bin`. Wenn
sich die ausführbare Datei Ihrer sicheren Binärdatei in Paketmanager- oder Benutzerpfaden befindet (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese
explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist zulässig, wenn jedes Segment der obersten Ebene
die Allowlist erfüllt (einschließlich sicherer Binärdateien oder automatischer Zulassung durch Skills). Umleitungen
werden im Allowlist-Modus weiterhin nicht unterstützt. Befehlssubstitution (`$()` / Backticks) wird
während der Allowlist-Analyse abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden Sie einfache
Anführungszeichen, wenn Sie literalen `$()`-Text benötigen.

Bei Genehmigungen durch die macOS-Begleit-App wird Shell-Rohtext, der Shell-Steuerungs- oder
Expansionssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`),
als Allowlist-Fehltreffer behandelt, sofern nicht die Shell-Binärdatei selbst in der Allowlist enthalten ist.

Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Umgebungsüberschreibungen
auf eine kleine explizite Allowlist beschränkt (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Bei `allow-always`-Entscheidungen im Allowlist-Modus speichern transparente Dispatch-Wrapper
(zum Beispiel `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`)
den Pfad der inneren ausführbaren Datei anstelle des Wrapper-Pfads. Shell-Multiplexer
(`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash` usw.) auf
dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer nicht sicher entpackt werden kann, wird
kein Allowlist-Eintrag automatisch gespeichert.

Wenn Sie Interpreter wie `python3` oder `node` in die Allowlist aufnehmen, verwenden Sie vorzugsweise
`tools.exec.strictInlineEval=true`, damit die Inline-Auswertung weiterhin eine explizite
Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin unbedenkliche
Interpreter-/Skriptaufrufe speichern, Träger für Inline-Auswertungen werden jedoch nicht
automatisch gespeichert.

### Sichere Binärdateien im Vergleich zur Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Ziel             | Eng begrenzte stdin-Filter automatisch zulassen        | Bestimmten ausführbaren Dateien explizit vertrauen                                  |
| Übereinstimmungstyp | Name der ausführbaren Datei + argv-Richtlinie für sichere Binärdateien | Glob für den aufgelösten Pfad der ausführbaren Datei oder einfacher Glob für den Befehlsnamen bei über PATH aufgerufenen Befehlen |
| Argumentumfang   | Durch das Profil der sicheren Binärdatei und Regeln für Literal-Token eingeschränkt | Standardmäßig Pfadabgleich; optional kann `argPattern` das analysierte argv einschränken |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs                                     |
| Optimaler Einsatz | Risikoarme Texttransformationen in Pipelines          | Jedes Werkzeug mit umfassenderem Verhalten oder Nebenwirkungen                      |

Konfigurationsort:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder agentenspezifisch `agents.entries.*.tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder agentenspezifisch `agents.entries.*.tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder agentenspezifisch `agents.entries.*.tools.exec.safeBinProfiles`). Agentenspezifische Profilschlüssel überschreiben globale Schlüssel.
- Allowlist-Einträge befinden sich in der hostlokalen Genehmigungsdatei unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Laufzeit-Binärdateien ohne explizite Profile in `safeBins` vorkommen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` vorbereiten (anschließend prüfen und einschränken). Interpreter-/Laufzeit-Binärdateien werden nicht automatisch vorbereitet.

Beispiel für ein benutzerdefiniertes Profil:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Interpreter-/Laufzeitbefehle

Genehmigungsgestützte Interpreter-/Laufzeitausführungen sind bewusst konservativ:

- Der genaue argv-/cwd-/env-Kontext wird immer gebunden.
- Direkte Shell-Skript- und direkte Laufzeitdateiformen werden nach bestem Bemühen an einen konkreten lokalen
  Dateischnappschuss gebunden.
- Gängige Paketmanager-Wrapperformen, die weiterhin zu genau einer direkten lokalen Datei aufgelöst werden (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Laufzeitbefehl nicht genau eine konkrete lokale Datei identifizieren kann
  (zum Beispiel bei Paketskripten, Auswertungsformen, laufzeitspezifischen Loader-Ketten oder mehrdeutigen Formen mit mehreren Dateien),
  wird die genehmigungsgestützte Ausführung abgelehnt, anstatt eine nicht vorhandene semantische Abdeckung
  zu behaupten.
- Verwenden Sie für diese Arbeitsabläufe vorzugsweise Sandboxing, eine separate Host-Grenze oder einen explizit vertrauenswürdigen
  vollständigen Allowlist-Arbeitsablauf, bei dem der Betreiber die umfassendere Laufzeitsemantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Ausführungswerkzeug sofort eine Genehmigungs-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse genehmigter Ausführungen zuzuordnen (`Exec finished` und `Exec running`, wenn konfiguriert).
Wenn vor Ablauf des Zeitlimits keine Entscheidung eintrifft, wird die Anfrage als Genehmigungszeitüberschreitung behandelt und
als endgültige Ablehnung des Host-Befehls gemeldet. Bei asynchronen Genehmigungen des Hauptagenten mit einer Ursprungssitzung
setzt OpenClaw diese Sitzung außerdem mit einer internen Folgemeldung fort, sodass der Agent erkennt, dass
der Befehl nicht ausgeführt wurde, anstatt später ein fehlendes Ergebnis zu reparieren. Ausstehende Ausführungsgenehmigungen laufen
standardmäßig nach 30 Minuten ab.

### Verhalten der Folgezustellung

Nachdem eine genehmigte asynchrone Ausführung beendet ist, sendet OpenClaw eine nachfolgende `agent`-Interaktion an dieselbe Sitzung.
Abgelehnte asynchrone Genehmigungen verwenden für den Ablehnungsstatus denselben Folgepfad der Hauptsitzung, aber sie
registrieren keine Laufzeitübergaben mit erhöhten Berechtigungen und führen den Befehl nicht aus. Ablehnungen ohne fortsetzbare
Hauptsitzung werden entweder unterdrückt oder über einen sicheren direkten Pfad gemeldet, sofern ein solcher vorhanden ist.

- Wenn ein gültiges externes Zustellungsziel vorhanden ist (zustellbarer Kanal plus Ziel `to`), verwendet die Folgezustellung diesen Kanal.
- In reinen Webchat- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Folgezustellung auf die Sitzung beschränkt (`deliver: false`).
- Wenn ein Aufrufer ausdrücklich eine strikte externe Zustellung ohne auflösbaren externen Kanal anfordert, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf eine reine Sitzungszustellung herabgestuft, statt fehlzuschlagen.

## Minimale Bereiche für Drittanbieter-Clients

Die Auflösung von Gateway-Genehmigungen wird durch den dedizierten Bereich `operator.approvals` geschützt. Dies gilt sowohl für die eigentümerspezifische Methode `exec.approval.resolve` als auch für die typunabhängige Methode `approval.resolve`; `operator.write` schließt diesen Bereich nicht ein. Dashboards und Integrationen sollten nur die Bereiche anfordern, die für die von ihnen verwendeten Methoden erforderlich sind. Behandeln Sie den Zugriff zur Auflösung von Genehmigungen als eine Berechtigung auf dem Niveau einer Remote-Ausführung und gewähren Sie `operator.approvals` bewusst, selbst wenn der Client nur eine kleine Genehmigungsoberfläche darstellt.

## Weiterleitung von Genehmigungen an Chat-Kanäle

Sie können Ausführungsfreigabeanfragen an jeden Chat-Kanal (einschließlich Plugin-Kanälen) weiterleiten und sie
mit `/approve` freigeben. Hierfür wird die normale Pipeline für ausgehende Zustellungen verwendet.

Konfiguration:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // Teilzeichenfolge oder regulärer Ausdruck
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Antwort im Chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Der Befehl `/approve` verarbeitet sowohl Ausführungsfreigaben als auch Plugin-Freigaben. Wenn die ID keiner ausstehenden Ausführungsfreigabe entspricht, prüft er stattdessen automatisch die Plugin-Freigaben. Dieser Fallback ist auf Fehler des Typs „Freigabe nicht gefunden“ beschränkt; bei einer tatsächlichen Ablehnung oder einem Fehler einer Ausführungsfreigabe erfolgt nicht unbemerkt ein erneuter Versuch als Plugin-Freigabe.

### Weiterleitung von Plugin-Freigaben

Die Weiterleitung von Plugin-Freigaben verwendet dieselbe Zustellungspipeline wie Ausführungsfreigaben, verfügt jedoch über eine eigene,
unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren der einen wirkt sich nicht auf die andere aus.
Informationen zum Verhalten bei der Plugin-Entwicklung, zu Anfragefeldern und zur Entscheidungssemantik finden Sie unter
[Plugin-Berechtigungsanfragen](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Die Konfigurationsstruktur ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, zeigen für Ausführungs- und
Plugin-Freigaben dieselben Freigabeschaltflächen an. Kanäle ohne gemeinsame interaktive Benutzeroberfläche greifen auf einfachen Text mit
Anweisungen zu `/approve` zurück. Plugin-Freigabeanfragen können die verfügbaren Entscheidungen einschränken: Freigabeoberflächen verwenden
die in der Anfrage deklarierte Entscheidungsmenge, und der Gateway weist Versuche zurück, eine nicht
angebotene Entscheidung zu übermitteln.

### Freigaben im selben Chat auf jedem Kanal

Wenn eine Ausführungs- oder Plugin-Freigabeanfrage von einer zustellbaren Chat-Oberfläche stammt, kann derselbe Chat
sie standardmäßig mit `/approve` freigeben. Dies gilt zusätzlich zu den bestehenden Abläufen der Web- und Terminal-Benutzeroberfläche für Slack, Matrix, Microsoft Teams und
ähnliche zustellbare Chats und verwendet das
normale Kanalauthentifizierungsmodell für diese Unterhaltung. Wenn der ursprüngliche Chat bereits Befehle senden
und Antworten empfangen kann, benötigen Freigabeanfragen keinen separaten nativen Zustellungsadapter mehr, nur um
ausstehend zu bleiben.

Discord, Telegram und QQ bot unterstützen ebenfalls `/approve` im selben Chat, diese Kanäle verwenden jedoch weiterhin ihre
aufgelöste Freigabeberechtigtenliste zur Autorisierung, selbst wenn die native Freigabezustellung deaktiviert ist.

### Native Freigabezustellung

Einige Kanäle können außerdem als native Freigabeclients fungieren: Discord, Slack, Telegram, Matrix und QQ bot.
Native Clients ergänzen den gemeinsamen `/approve`-Ablauf im selben Chat um Direktnachrichten an Freigabeberechtigte, die Verteilung an den ursprünglichen Chat und eine
kanalspezifische interaktive Freigabeoberfläche.

Wenn native Freigabekarten oder -schaltflächen verfügbar sind, ist diese native Benutzeroberfläche der primäre Weg für den Agenten.
Der Agent sollte nicht zusätzlich einen doppelten einfachen Chat-Befehl `/approve` ausgeben, es sei denn, das Werkzeugergebnis besagt,
dass Chat-Freigaben nicht verfügbar sind oder die manuelle Freigabe der einzige verbleibende Weg ist.

Wenn ein nativer Freigabeclient konfiguriert ist, aber keine native Laufzeit für den ursprünglichen
Kanal aktiv ist, lässt OpenClaw die lokale deterministische Eingabeaufforderung `/approve` sichtbar. Wenn die native Laufzeit
aktiv ist und eine Zustellung versucht, aber kein Ziel die Karte erhält, sendet OpenClaw im selben Chat einen Fallback-Hinweis
mit dem exakten Befehl `/approve <id> <decision>`, damit die Anfrage weiterhin bearbeitet werden kann.

Allgemeines Modell:

- Die Host-Ausführungsrichtlinie entscheidet weiterhin, ob eine Ausführungsfreigabe erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Freigabeanfragen an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob Discord, Slack, Telegram, QQ bot und ähnliche
  kanalspezifische native Clients aktiviert sind
- Slack-Plugin-Freigaben können den nativen Freigabeclient von Slack verwenden, wenn die Anfrage von Slack stammt
  und Slack-Plugin-Freigabeberechtigte aufgelöst werden; `approvals.plugin` kann Plugin-Freigaben auch an Slack-Sitzungen
  oder -Ziele weiterleiten, selbst wenn Slack-Ausführungsfreigaben deaktiviert sind
- Native Freigabekarten von Google Chat verarbeiten Ausführungs- und Plugin-Freigaben, die aus Google-Chat-
  Bereichen oder -Threads stammen, wenn stabile `users/<id>`-Freigabeberechtigte aus `dm.allowFrom` oder
  `defaultTo` aufgelöst werden; sie verwenden keine Reaktionsereignisse für Entscheidungen
- Die Freigabezustellung über Reaktionen in WhatsApp und Signal wird durch `approvals.exec` und
  `approvals.plugin` gesteuert; sie verfügen über keine `channels.<channel>.execApprovals`-Blöcke

Native Freigabeclients aktivieren automatisch die Zustellung vorrangig per Direktnachricht, wenn alle folgenden Bedingungen erfüllt sind:

- Der Kanal unterstützt native Freigabezustellung
- Freigabeberechtigte können aus expliziten `execApprovals.approvers` oder einer Eigentümeridentität
  wie `commands.ownerAllowFrom` aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Freigabeclient explizit zu deaktivieren. Setzen Sie `enabled: true`, um
seine Aktivierung zu erzwingen, wenn Freigabeberechtigte aufgelöst werden. Die Zustellung an den öffentlichen ursprünglichen Chat bleibt über
`channels.<channel>.execApprovals.target` explizit. Wenn natives `target` die Zustellung an den ursprünglichen Chat aktiviert,
enthalten Freigabeanfragen den Befehlstext.

FAQ: [Warum gibt es zwei Konfigurationen für Ausführungsfreigaben bei Chat-Freigaben?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: Konfigurieren Sie stabile Freigabeberechtigte mit `channels.googlechat.dm.allowFrom` oder
  `channels.googlechat.defaultTo`; kein `execApprovals`-Block ist erforderlich
- WhatsApp: Verwenden Sie `approvals.exec` und `approvals.plugin`, um Freigabeanfragen an WhatsApp weiterzuleiten
- Signal: Verwenden Sie `approvals.exec` und `approvals.plugin`, um Freigabeanfragen an Signal weiterzuleiten

Spezifisches Routing nativer Clients:

- Telegram verwendet standardmäßig Direktnachrichten an Freigabeberechtigte (`target: "dm"`). Wechseln Sie zu `channel` oder `both`, um
  Freigabeanfragen zusätzlich im ursprünglichen Telegram-Chat bzw. -Thema anzuzeigen. Bei Telegram-Forumsthemen behält OpenClaw
  das Thema für die Freigabeanfrage und die anschließende Rückmeldung nach der Freigabe bei.
- Freigabeberechtigte für Discord und Telegram können explizit angegeben (`execApprovals.approvers`) oder aus
  `commands.ownerAllowFrom` abgeleitet werden; nur aufgelöste Freigabeberechtigte können freigeben oder ablehnen.
- Freigabeberechtigte für Slack können explizit angegeben (`execApprovals.approvers`) oder aus
  `commands.ownerAllowFrom` abgeleitet werden. Direktnachrichten für Slack-Plugin-Freigaben verwenden Slack-Plugin-Freigabeberechtigte aus `allowFrom`
  und das Standardrouting des Kontos, nicht die Slack-Ausführungsfreigabeberechtigten. Native Slack-Schaltflächen bewahren die Art der Freigabe-ID,
  sodass `plugin:`-IDs Plugin-Freigaben ohne eine zweite Slack-lokale Fallback-Ebene bearbeiten können.
- Native Google-Chat-Karten bewahren den manuellen `/approve`-Fallback im Nachrichtentext, aber die Rückrufe
  der Kartenschaltflächen enthalten nur undurchsichtige Aktionstoken; die Freigabe-ID und die Entscheidung werden aus dem
  serverseitigen ausstehenden Zustand wiederhergestellt.
- WhatsApp-Emoji-Freigaben verarbeiten sowohl Ausführungs- als auch Plugin-Anfragen, wenn die passende
  Weiterleitungsfamilie auf oberster Ebene an WhatsApp weiterleitet. Anfragen nativen Ursprungs werden direkt gebunden; bei der gemeinsamen Zustellung im Zielmodus
  werden dieselben typisierten Freigabemetadaten an die akzeptierte WhatsApp-Nachrichtenbestätigung gebunden.
- Signal-Reaktionsfreigaben verarbeiten sowohl Ausführungs- als auch Plugin-Anfragen nur, wenn die passende
  Weiterleitungsfamilie auf oberster Ebene aktiviert ist und an Signal weiterleitet. Direkte Signal-Ausführungsfreigaben im selben Chat können
  den lokalen `/approve`-Fallback ohne explizite Freigabeberechtigte unterdrücken; die Auflösung von Signal-Reaktionen
  erfordert weiterhin explizite Signal-Freigabeberechtigte aus `channels.signal.allowFrom` oder `defaultTo`.
- Natives Matrix-Routing für Direktnachrichten/Kanäle und Reaktionskürzel verarbeiten sowohl Ausführungs- als auch Plugin-Freigaben;
  die Plugin-Autorisierung stammt weiterhin aus `channels.matrix.dm.allowFrom`. Native Matrix-Anfragen
  enthalten beim ersten Anfrageereignis benutzerdefinierten `com.openclaw.approval`-Ereignisinhalt, sodass OpenClaw-kompatible
  Matrix-Clients den strukturierten Freigabestatus lesen können, während Standardclients den Klartext-
  Fallback `/approve` beibehalten.
- Native Freigabeschaltflächen von Discord und Telegram enthalten in transportprivaten Rückrufdaten explizit die Eigentümerart „Ausführung“ oder „Plugin“
  und bearbeiten ausschließlich diesen Eigentümer. Ältere `/approve`-Steuerelemente ohne
  eine Art bleiben ein begrenzter Kompatibilitätspfad: Sie versuchen nur Eigentümerarten, für die der Akteur freigabeberechtigt ist,
  fahren nur nach dem Ergebnis „Freigabe nicht gefunden“ fort und leiten die Eigentümerschaft niemals aus der Freigabe-ID ab.
- Die anfragende Person muss nicht freigabeberechtigt sein.
- Wenn keine Bedienoberfläche oder kein konfigurierter Freigabeclient die Anfrage annehmen kann, greift die Eingabeaufforderung auf
  `askFallback` zurück.

Sensible, ausschließlich dem Eigentümer vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` verwenden privates
Eigentümerrouting für Freigabeanfragen und abschließende Ergebnisse. OpenClaw versucht zunächst eine private Route auf derselben
Oberfläche, auf der der Eigentümer den Befehl ausgeführt hat. Wenn diese Oberfläche keine private Eigentümerroute besitzt, wird
auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurückgegriffen, sodass ein Discord-Gruppenbefehl
die Freigabe und das Ergebnis weiterhin an die Telegram-Direktnachrichten des Eigentümers senden kann, wenn Telegram als
primäre private Schnittstelle konfiguriert ist. Der Gruppenchat erhält lediglich eine kurze Bestätigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Offizielle mobile Bedien-Apps

Die offiziellen iOS- und Android-Apps können außerdem ausstehende, dem Gateway zugeordnete
Ausführungsfreigaben prüfen, wenn eine `operator.admin`-Verbindung verwendet wird oder wenn ihr gekoppeltes
`operator.approvals`-Gerät explizit als Ziel der Anfrage angegeben wurde. Sie lesen
denselben bereinigten dauerhaften Datensatz, den auch die
Control UI verwendet, übermitteln eine artbewusste Entscheidung und zeigen das kanonische
Ergebnis der ersten Antwort des Gateways an. Die Apple Watch spiegelt diese Freigabeanfragen über
das gekoppelte iPhone und bietet Aktionen zum einmaligen Zulassen und Ablehnen. Der direkte Watch-Gateway-Modus
prüft keine Freigaben.

Eine verlorene Auflösungsbestätigung macht die übermittelte Auswahl nicht maßgeblich:
Die App deaktiviert die Steuerelemente und liest den Datensatz erneut. Wenn eine andere Oberfläche
zuvorgekommen ist, zeigt die App die aufgezeichnete Entscheidung an. Ausstehende Anfragen bleiben an den
Gateway gebunden, der sie ausgegeben hat, sodass der Wechsel des aktiven Gateways eine
alte Freigabe-ID nicht umleiten kann.

### macOS-IPC-Ablauf

```
Gateway -> Node-Dienst (WS)
                 |  IPC (UDS + Token + HMAC + TTL)
                 v
             Mac-App (UI + Freigaben + system.run)
```

Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Peer-Prüfung auf dieselbe UID.
- Challenge-Response (Nonce + HMAC-Token + Anfrage-Hash) + kurze TTL.

## FAQ

### Wann würden `accountId` und `threadId` für ein Freigabeziel verwendet?

Verwenden Sie `accountId`, wenn für den Kanal mehrere Identitäten konfiguriert sind und die Freigabeanfrage
über ein bestimmtes Konto gesendet werden muss. Verwenden Sie `threadId`, wenn das Ziel Themen oder
Threads unterstützt und die Anfrage innerhalb dieses Threads statt im Chat auf oberster Ebene verbleiben soll.

Ein konkretes Telegram-Beispiel ist eine Betriebs-Supergruppe mit Forumsthemen und zwei Telegram-Bot-
Konten. Der Wert `to` bezeichnet die Supergruppe, `accountId` wählt das Bot-Konto aus und `threadId`
wählt das Forumsthema aus:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Mit dieser Einrichtung werden weitergeleitete Ausführungsfreigaben vom Telegram-Konto `ops-bot` im Thema
`77` des Chats `-1001234567890` veröffentlicht. Ein Ziel ohne `accountId` verwendet das Standardkonto des Kanals, und
ein Ziel ohne `threadId` veröffentlicht im übergeordneten Ziel.

### Wenn Freigaben an eine Sitzung gesendet werden, kann sie dann jeder Teilnehmer dieser Sitzung erteilen?

Nein. Die Sitzungszustellung steuert nur, wo die Aufforderung angezeigt wird. Sie berechtigt nicht automatisch jeden
Teilnehmer dieses Chats, die Freigabe zu erteilen.

Für generische `/approve` im selben Chat muss der Absender bereits zur Ausführung von Befehlen in dieser
Kanalsitzung berechtigt sein. Wenn der Kanal explizite Freigabeberechtigte bereitstellt, können diese
die Aktion `/approve` autorisieren, auch wenn sie in dieser Sitzung ansonsten nicht zur Ausführung von Befehlen berechtigt sind.

Einige Kanäle sind strenger. Discord, Telegram, Matrix, native Slack-Freigabe-Direktnachrichten und ähnliche
native Freigabeclients verwenden ihre aufgelösten Listen der Freigabeberechtigten für die Freigabeautorisierung. Beispielsweise
kann eine Telegram-Freigabeaufforderung in einem Forumsthema für alle Teilnehmer des Themas sichtbar sein, aber nur numerische
Telegram-Benutzer-IDs, die aus `channels.telegram.execApprovals.approvers` oder
`commands.ownerAllowFrom` aufgelöst wurden, können sie genehmigen oder ablehnen.

## Verwandte Themen

- [Ausführungsfreigaben](/de/tools/exec-approvals) — zentrale Richtlinie und Freigabeablauf
- [Ausführungswerkzeug](/de/tools/exec)
- [Erweiterter Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — Skill-gestütztes Verhalten für automatische Zulassung
