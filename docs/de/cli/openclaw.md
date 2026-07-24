---
read_when:
    - Sie haben die Inferenz eingerichtet und möchten, dass OpenClaw den Rest konfiguriert
    - Sie müssen OpenClaw mit dem lokalen Einrichtungsagenten überprüfen oder reparieren.
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für den inferenzgestützten OpenClaw-Einrichtungs- und Reparaturassistenten
title: OpenClaw-Einrichtungsagent
x-i18n:
    generated_at: "2026-07-24T04:19:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9578d1493ff514ea6dd07dae995bf83443e9e17f2c2134bc801faa45254615bf
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw wird mit einem integrierten Systemagenten ausgeliefert — er spricht als „OpenClaw“ — und dient der lokalen Einrichtung, Reparatur und Konfiguration (früher Crestodian genannt). Er startet erst, nachdem das tatsächlich verwendete Standardmodell einen echten Durchlauf abgeschlossen hat.
Bei Neuinstallationen wird zuerst die Inferenz eingerichtet; fehlerhafte Konfigurationen verbleiben im klassischen Doctor-Ablauf.

## Wann er startet

Wird `openclaw` ohne Unterbefehl ausgeführt, richtet sich der Ablauf nach dem Konfigurationsstatus:

- Konfiguration fehlt oder enthält keine manuell erstellten Einstellungen (leer oder nur Schlüssel vom Typ `$schema`/`meta`): Startet das geführte Onboarding mit Live-KI-Verifizierung.
- Konfiguration ist vorhanden, besteht aber die Validierung nicht: Startet das klassische Onboarding, das die Probleme meldet und Sie zu `openclaw doctor` weiterleitet.
- Konfiguration ist vorhanden und gültig: Öffnet die normale Agenten-TUI. Ein erreichbares
  konfiguriertes Gateway, dessen Standardagent über ein Modell verfügt, wechselt direkt zu dieser Oberfläche,
  ohne Onboarding oder OpenClaw. Verwenden Sie später `/openclaw` innerhalb der TUI oder führen Sie
  `openclaw setup` direkt aus, um OpenClaw aufzurufen.

`openclaw setup` führt zunächst einen Live-Test des konfigurierten Standardmodells durch. Bei einem erfolgreichen Durchlauf startet OpenClaw. Bei einem interaktiven Fehler wird die geführte Inferenzeinrichtung geöffnet und nach erfolgreicher Prüfung eines Kandidaten an OpenClaw übergeben. Einmalige, JSON-basierte und andere nicht interaktive Anfragen schlagen bei nicht verfügbarer Inferenz mit der Anweisung fehl, `openclaw onboard` auszuführen. `openclaw --help` und `openclaw --version` behalten ihre normalen Schnellpfade bei.

Das nicht interaktive, alleinstehende `openclaw` (ohne TTY) wird mit einer kurzen Meldung beendet, anstatt die Hilfe des Stammbefehls auszugeben: Bei einer neuen oder ungültigen Installation verweist sie auf das nicht interaktive Onboarding, bei gültiger Konfiguration auf `openclaw agent --local ...`.

`openclaw onboard --modern` bleibt ein Kompatibilitätsalias für OpenClaw, verwendet jedoch dieselbe Inferenzprüfung: Eine funktionierende Inferenz öffnet den Chat, interaktive Fehler starten die geführte Inferenzeinrichtung und nicht interaktive Fehler werden mit Onboarding-Hinweisen beendet. `openclaw onboard --classic` öffnet den vollständigen Schritt-für-Schritt-Assistenten.

## Was OpenClaw anzeigt

Das interaktive OpenClaw öffnet dieselbe TUI-Shell wie `openclaw tui`, jedoch mit einem OpenClaw-Chat-Backend. Die Begrüßung beim Start umfasst:

- die Gültigkeit der Konfiguration und den Standardagenten
- das verifizierte Modell, das OpenClaw verwendet
- die Erreichbarkeit des Gateways bei der ersten Startprüfung
- die nächste empfohlene Debugging-Maßnahme

Es gibt weder Secrets aus noch lädt es zum Starten lediglich Plugin-CLI-Befehle.

Verwenden Sie `status` für die detaillierte Bestandsaufnahme: Konfigurationspfad, Dokumentations-/Quellpfade, lokale CLI-Prüfungen, Vorhandensein von Schlüsseln/Tokens, Agenten-, Modell- und Gateway-Details.

OpenClaw verwendet dieselbe Referenzermittlung wie reguläre Agenten: In einem Git-Checkout verweist es auf die lokale `docs/` und den Quellbaum; in einer npm-Installation verwendet es die mitgelieferte Dokumentation und verlinkt auf [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), mit dem Hinweis, den Quellcode zu prüfen, wenn die Dokumentation nicht ausreicht.

## Beispiele

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Innerhalb der OpenClaw-TUI:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operationen und Genehmigung

OpenClaw verwendet typisierte Operationen, anstatt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Operationen werden sofort ausgeführt: Übersicht anzeigen, Agenten auflisten, installierte Plugins auflisten, ClawHub-Plugins durchsuchen, Modell-/Backend-Status anzeigen, Status-/Systemzustandsprüfungen ausführen, Gateway-Erreichbarkeit prüfen, Doctor ohne interaktive Korrekturen ausführen, Konfiguration validieren und den Pfad des Audit-Protokolls anzeigen.

Auch der Start der geführten Kanaleinrichtung (`connect telegram`) wird sofort ausgeführt. Der Assistent erfasst ausdrückliche Antworten und ist für die daraus resultierenden Schreibvorgänge zuständig.

Dauerhafte Operationen erfordern eine Genehmigung im Gespräch (oder `--yes` für einen direkten Befehl): Konfiguration schreiben, `config set`, `config set-ref`, Bootstrap für Einrichtung/Onboarding, Standardmodell ändern, Gateway starten/stoppen/neu starten, Agenten erstellen und Plugins installieren.

Doctor-Reparaturen sind innerhalb von OpenClaw nicht verfügbar, da sie den Provider, die Authentifizierung oder die Inferenzroute des Standardagenten umschreiben können, auf der die Sitzung basiert. Beenden Sie OpenClaw und führen Sie `openclaw doctor --fix` in einem Terminal aus. Das schreibgeschützte `doctor` bleibt innerhalb von OpenClaw verfügbar.

Neue Agenten übernehmen die live verifizierte Standardinferenzroute. Die Agenten-IDs `openclaw` und `crestodian` sind für den Systemagenten reserviert und können nicht als normale Agenten erstellt werden. Die außer Betrieb genommene ID bleibt gesperrt, damit eine alte Konfiguration sie nicht beanspruchen kann.

`config set` und `config set-ref` können jede Einstellung ändern, die ein Benutzer ändern kann,
mit einer kurzen, ausschließlich für Menschen bestimmten Sperrliste: `$include`, `auth.*`, `env.*`, `models.*`
und `secrets.*` werden weiterhin abgelehnt, da sie Zugangsdaten,
die Einbindung alternativer Konfigurationen oder die Provider-/Katalogdefinitionen enthalten, die für
das Inferenzrouting verwendet werden. Auch das Inferenzrouting selbst ist geschützt: Routen des Standardmodells
(Modell-/Parameter-/Laufzeitfelder von `agents.defaults`) und die Routingfelder
des Agenten, der die aktive Standardroute bereitstellt, werden ebenso abgelehnt wie Felder
für Agentenidentität und -topologie (`id`, `agentDir`, `default`). Routingfelder für
andere Agenten bleiben nach Genehmigung beschreibbar. Gateway- und Kanalauthentifizierung bleiben
normale Konfigurationsoberflächen. Verwenden Sie `set default model <provider/model>` für eine
bereits konfigurierte Route; die Route wird vor dem Speichern live getestet. Um
den Provider-/Authentifizierungszugriff zu konfigurieren oder zu reparieren, beenden Sie OpenClaw und führen Sie
`openclaw onboard` aus.

Schreibvorgänge mit `plugins.entries.<id>.*` (Aktivieren/Deaktivieren/Konfigurieren installierter Plugins)
sind zulässig, sofern das betreffende Plugin nicht die aktive Inferenzroute bereitstellt. Quellen für
Plugin-Installationen und die Laderichtlinie behalten ihre Vertrauensgrenze im typisierten
Plugin-Installationsablauf. Die Deinstallation des Plugins, das die Route bereitstellt, wird
aus demselben Grund abgelehnt; beenden Sie OpenClaw und führen Sie
`openclaw plugins uninstall <id>` in einem Terminal aus.

Die Genehmigung wird mit eigenen Worten erteilt: Eindeutige Antworten („yes“, „sure“, „go ahead“, „not now“) werden anhand einer geschlossenen, deterministischen Liste ausgewertet. Wenn die konfigurierte Route einen separaten Vervollständigungsaufruf unterstützt, können andere Antworten ausschließlich anhand Ihrer Nachricht und des ausstehenden Vorschlags klassifiziert werden — niemals durch das Konversationsmodell selbst, das sich nicht selbst genehmigen kann. Nicht klassifizierbare oder mehrdeutige Antworten lassen den Vorschlag ausstehend und die Konversation fragt erneut nach.

### Änderungsverlauf

Die Seite „OpenClaw fragen“ kann kürzlich angewendete Operationen des Systemagenten, Doctor-
Migrationen, Konfigurationsschreibvorgänge über Einstellungen und CLI sowie manuelle Änderungen an
`openclaw.json` anzeigen. Das Konfigurationsjournal erkennt externe Änderungen, während das Gateway
sie überwacht, während eines OpenClaw-eigenen Schreibvorgangs oder beim nächsten Start nach einer
Offline-Änderung.

Der Verlauf wird in der Tabelle `diagnostic_events` der gemeinsam genutzten
Datenbank `~/.openclaw/state/openclaw.sqlite` unter den Geltungsbereichen `system-agent-audit`
und `config-audit` gespeichert. Jeder Geltungsbereich behält seine neuesten 50,000 Datensätze.
Ermittlungs- und schreibgeschützte Operationen sind nicht enthalten. Secrets erscheinen niemals im
Änderungsverlauf; Datensätze des Konfigurationsjournals enthalten geänderte Pfade statt
Konfigurationswerte und der Wertevergleich verwendet geschützte Fingerabdrücke.

Die Kanaleinrichtung kann als gehostete Konversation ausgeführt werden, bis ein Secret benötigt wird. Die
lokale OpenClaw-TUI akzeptiert keine sensiblen Antworten des Assistenten, da
Chat-Eingaben im Terminal sichtbar sind. Sie bietet sofort `open channel wizard` an und übergibt
den ausgewählten Kanal an den maskierten Terminalassistenten; Sie können auch später
`openclaw channels add --channel <channel>` ausführen.

### Wechsel zur maskierten Kanaleinrichtung

Der lokale Chat kann die Steuerung an den maskierten Kanalassistenten übergeben:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` öffnet die maskierte Kanaleinrichtung, nachdem die Chat-
TUI geschlossen wurde. Verwenden Sie zuerst `channel info <channel>`, um die Kanalbezeichnung, den Einrichtungsstatus,
eine Zusammenfassung der Voraussetzungen und den Link zur Dokumentation anzuzeigen.

OpenClaw ändert niemals den Provider-/Authentifizierungszugriff innerhalb seiner eigenen Sitzung:
Die Sitzung hängt bereits von dieser Inferenzroute ab. Für die Einrichtung oder Reparatur des Modell-Providers
gibt `configure model provider` Hinweise zum Beenden und Onboarding zurück, ohne
einen Assistenten zu starten oder die Konfiguration zu schreiben. Beenden Sie OpenClaw und führen Sie `openclaw
onboard` aus; das Onboarding stellt die Zugangsdaten bereit und speichert nur eine Route, die
einen echten Live-Durchlauf abschließt. Starten Sie OpenClaw erneut, nachdem das Onboarding erfolgreich war.

## Einrichtungs-Bootstrap

`setup` konfiguriert den verbleibenden Arbeitsbereichs- und Gateway-Status, nachdem das geführte Onboarding die Inferenz bereits eingerichtet hat. Es schreibt ausschließlich über typisierte Konfigurationsoperationen und bittet zuvor um Genehmigung.

```text
setup
setup workspace ~/Projects/work
```

`setup` behält das verifizierte tatsächlich verwendete Modell bei. Es konfiguriert oder
ersetzt die Inferenz nicht.

Wenn die Inferenz fehlt oder ihre Live-Prüfung fehlschlägt, verlassen Sie OpenClaw und führen Sie `openclaw onboard` aus. Das geführte Onboarding prüft zuerst das konfigurierte Modell, dann authentifizierte Abonnement-CLIs, API-Schlüssel und die verbleibenden unterstützten CLIs; es fordert von jedem Kandidaten eine echte Antwort an und speichert nur eine erfolgreiche Route dauerhaft. OpenClaw startet unmittelbar nach Abschluss dieser Grenze und kann anschließend den Arbeitsbereich, das Gateway, Kanäle, Agenten, Plugins und andere optionale Funktionen konfigurieren.

Die macOS-App überspringt diese Abfolge vollständig, wenn sie ein konfiguriertes Gateway
erreicht, dessen Standardagent bereits über ein konfiguriertes Modell verfügt; sie öffnet die normale
Agentenoberfläche.
Bei einem neuen oder unvollständigen Gateway steuert die App die Inferenzabfolge über
die Gateway-Methoden `openclaw.setup.detect` und `openclaw.setup.activate`:
„detect“ listet jedes gefundene Kandidaten-Backend auf, „activate“ führt einen Live-Test
eines Kandidaten durch (eine echte „reply with OK“-Vervollständigung) und speichert erst nach bestandener Prüfung
das Modell, die Zugangsdaten und den für diese Route erforderlichen Provider-/Laufzeitstatus dauerhaft. Die Standardwerte für Arbeitsbereich und Gateway verbleiben bei OpenClaw. Ein fehlschlagender Kandidat
ändert niemals die Konfiguration; die App durchläuft die Abfolge automatisch und bietet schließlich
einen manuellen Schlüssel-/Token-Schritt an, der anhand der aktiven
Textinferenz-Provider-Plugins des Gateways ausgefüllt wird. Der ausgewählte Provider ist für sein Einstiegsmodell
und seine Konfiguration zuständig, und die Zugangsdaten werden vor dem Speichern auf dieselbe Weise verifiziert.

Codex-Überwachung und andere optionale Plugin-Funktionen bleiben außerhalb dieser
Inferenzaktivierungstransaktion. Konfigurieren Sie sie erst, nachdem die Inferenz
funktioniert und OpenClaw gestartet wurde; vorhandene Plugin-Richtlinien und ausdrückliche
Deaktivierungen der Überwachung bleiben während der Inferenzeinrichtung unverändert.

## KI-Konversation

Die freie Konversation des interaktiven OpenClaw wird über dieselbe Agentenschleife wie reguläre OpenClaw-Agenten ausgeführt und ist auf ein einziges OpenClaw-Autoritätswerkzeug der Ebene Ring 0 beschränkt, `openclaw`, das die typisierten Operationen kapselt. Leseaktionen werden frei ausgeführt, Mutationen erfordern Ihre Genehmigung im Gespräch für genau diese Operation (siehe „Operationen und Genehmigung“), und jeder angewendete Schreibvorgang wird auditiert und erneut validiert. Die Agentensitzung bleibt bestehen, sodass OpenClaw über ein echtes Mehrfachdurchlauf-Gedächtnis verfügt. Wenn die verifizierte Inferenzroute später nicht mehr funktioniert, kehren Sie zu `openclaw onboard` zurück und reparieren Sie sie, bevor Sie fortfahren.

Der Host analysiert natürlichsprachliche Anfragen nicht selbst, um daraus Operationen abzuleiten. Freie
Nachrichten — einschließlich wie Befehle aussehender Texte und Fragen wie „why did my
gateway stop?“ — werden an die KI gesendet, die die Anfrage über das Werkzeug
`openclaw` einer typisierten Operation zuordnen kann.

Wenn eine Mutation aussteht, werden nur eindeutige Genehmigungs- oder Ablehnungsformulierungen aus einer
geschlossenen Liste ohne Schlussfolgerungen aufgelöst. Mehrdeutige Zustimmung wird an einen
separat konfigurierten Completion-Aufruf weitergeleitet; andernfalls wird nach dem Fail-Closed-Prinzip abgebrochen. Strukturierte
Assistentenfelder und die exakte Host-Navigation sind UI-Steuerelemente und keine Verarbeitung natürlichsprachlicher
Operationen. Eine Ausnahme für den hygienischen Umgang mit Geheimnissen ist besonders wichtig: Ein
exaktes `config set` in einem sensiblen Pfad (Token, Schlüssel, Passwörter) erreicht niemals
ein Modell. Der Host erstellt einen redigierten Vorschlag, und der Wert wird im
für die KI sichtbaren Verlauf maskiert. Verwenden Sie für Geheimnisse vorzugsweise `config set-ref <path> env <ENV_VAR>`.

Der Rettungsmodus für Nachrichtenkanäle verwendet niemals den modellgestützten Planer. Die Remote-Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agentenpfad nicht als Konfigurationseditor verwendet werden kann.

### Vertrauensmodell des CLI-Harnesses

Eingebettete Laufzeitumgebungen und das Codex-App-Server-Harness erzwingen die Ring-Zero-
Beschränkung direkt: Der Lauf enthält eine OpenClaw-Tool-Zulassungsliste, die nur
das Tool `openclaw` umfasst. Für Codex deaktiviert OpenClaw außerdem Umgebungen, native
Ausführung, Multi-Agent, Ziele, Apps/Plugins, Skills/MCP, Websuche und
`request_user_input`-Oberflächen für diesen Lauf. Codex injiziert weiterhin sein inaktives natives Dienstprogramm `update_plan`;
es kann die temporäre Checkliste des Modells aktualisieren, aber weder Dateien
noch die OpenClaw-Konfiguration schreiben. CLI-Harnesse verwenden die Zulassungsliste von OpenClaw nicht,
daher lässt OpenClaw nur Backends zu, deren eigener Vertrag zur Tool-Auswahl
dieselbe Beschränkung nachweisen kann:

- Auswählbare Backends, einschließlich Claude Code, werden mit einer leeren nativen Tool-
  Auswahl und einem MCP-Tool, `openclaw`, gestartet. Die generierte MCP-Konfiguration von Claude wird
  mit `--strict-mcp-config` angewendet, sodass keine anderen MCP-Server geladen werden.
- Backends, die keine nativen Tools deklarieren, erhalten denselben dedizierten OpenClaw-
  MCP-Server.
- Backends mit ständig aktiven oder unbekannten nativen Tools brechen vor der Inferenz nach dem Fail-Closed-Prinzip ab; sie
  können keine OpenClaw-Sitzung hosten.

Nur OpenClaw-Sitzungen erhalten den openclaw-MCP-Server; normale Agentenläufe
sehen dieses Tool nie. Auswählbare CLI-Backends bzw. CLI-Backends ohne native Tools und API-Schlüssel-Modelle
erzwingen daher die wörtliche Ein-Tool-Schleife. Codex-App-Server-Modelle erzwingen
ein einzelnes OpenClaw-Autoritäts-Tool sowie das inaktive native Planungsdienstprogramm. In allen
drei Fällen bleiben Setup-Schreibvorgänge auf den auditierten Genehmigungs-
vertrag von OpenClaw beschränkt.

Gemini CLI bleibt für normale Agenten verfügbar, kann jedoch die
für das Inferenz-Gate erforderliche toolfreie Prüfung nicht erzwingen und daher OpenClaw nicht hosten.

## Zu einem Agenten wechseln

Verwenden Sie einen natürlichsprachlichen Selektor, um OpenClaw zu verlassen und die normale TUI zu öffnen:

```text
mit Agent sprechen
mit Arbeitsagent sprechen
zum Hauptagenten wechseln
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen die normale Agenten-TUI direkt; sie starten OpenClaw nicht. Nach dem Wechsel in die normale TUI kehrt `/openclaw` zu OpenClaw zurück, optional mit einer Folgeanforderung:

```text
/openclaw
/openclaw Gateway neu starten
```

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Nachrichtenkanal-Einstiegspunkt für OpenClaw: Verwenden Sie ihn, wenn Ihr normaler Agent ausgefallen ist, ein vertrauenswürdiger Kanal (beispielsweise WhatsApp) jedoch weiterhin Befehle empfängt.

Dies ist ein deterministischer Handler für Notfallbefehle und nicht der dialogorientierte
OpenClaw-Agent. Er führt weder ein neues Setup von Grund auf durch noch lockert er das Inferenz-
Gate für den OpenClaw-Chat.

Unterstützter Befehl: `/openclaw <request>`. Die Rettung akzeptiert ausschließlich die exakt eingegebene Befehlssyntax — natürliche Sprache wird mit einem Hinweis zurückgewiesen, niemals als Operation interpretiert, und es wird niemals ein Modell konsultiert.

```text
Sie, in einer vertrauenswürdigen Eigentümer-DM: /openclaw status
OpenClaw: OpenClaw-Rettungsmodus. Gateway erreichbar: nein. Konfiguration gültig: nein.
Sie: /openclaw restart gateway
OpenClaw: Plan: Gateway neu starten. Antworten Sie mit /openclaw yes, um den Plan anzuwenden.
Sie: /openclaw yes
OpenClaw: Angewendet. Audit-Eintrag geschrieben.
```

Die Erstellung eines Agenten kann auch lokal oder über die Rettung in die Warteschlange gestellt werden:

```text
Agent work mit Arbeitsbereich ~/Projects/work und Modell openai/gpt-5.6-sol erstellen
/openclaw create agent work workspace ~/Projects/work
```

Bei der Agentenerstellung darf nur das aktuell live verifizierte Standardmodell angegeben werden. Lassen Sie das
Modell weg, um diese Route zu übernehmen.

Die Remote-Rettung ist eine Administrationsoberfläche und muss wie eine Remote-Konfigurationsreparatur behandelt werden, nicht wie ein normaler Chat.

Sicherheitsvertrag für die Remote-Rettung:

- Deaktiviert, wenn Sandboxing für den Agenten/die Sitzung aktiv ist; OpenClaw verweigert die Remote-Rettung und verweist auf die lokale CLI-Reparatur.
- Der effektive Standardzustand ist `auto`: Remote-Rettung nur im vertrauenswürdigen YOLO-Betrieb zulassen, in dem die Laufzeitumgebung bereits über lokale Autorität ohne Sandbox verfügt (`tools.exec.security` wird zu `full` und `tools.exec.ask` wird zu `off` aufgelöst, mit Sandbox-Modus `off`).
- Erfordert eine explizite Eigentümeridentität; keine Platzhalter-Absenderregeln, offene Gruppenrichtlinie, nicht authentifizierte Webhooks oder anonymen Kanäle.
- Die Rettung ist auf Eigentümer-DMs beschränkt.
- Plugin-Suche und -Auflistung sind schreibgeschützt. Die Plugin-Installation ist immer ausschließlich lokal möglich (in der Rettung blockiert, selbst wenn sie anderweitig aktiviert ist), da sie ausführbaren Code herunterlädt. Die Plugin-Deinstallation wird sowohl im lokalen OpenClaw als auch in der Rettung verweigert; führen Sie `openclaw plugins uninstall <id>` in einem Terminal aus.
- Die Remote-Rettung kann weder die lokale TUI öffnen noch zu einer interaktiven Agentensitzung wechseln; verwenden Sie die lokale Option `openclaw` für die Übergabe an einen Agenten.
- Persistente Schreibvorgänge erfordern auch im Rettungsmodus weiterhin eine Genehmigung.
- Ausstehende Genehmigungen können nur einmal verwendet werden. Jeder neuere Rettungsbefehl für dasselbe Konto, denselben Kanal und denselben Absender widerruft den älteren Plan; auch eine fehlgeschlagene Ausführung verbraucht die Genehmigung. Senden Sie den Befehl daher erneut, um den Vorgang zu wiederholen.
- Jede angewendete Rettungsoperation wird auditiert. Die Nachrichtenkanal-Rettung zeichnet Metadaten zu Kanal, Konto, Absender und Quelladresse auf; konfigurationsändernde Operationen zeichnen außerdem die Konfigurations-Hashes vor und nach der Änderung auf.
- Geheimnisse werden niemals ausgegeben. Die SecretRef-Prüfung meldet die Verfügbarkeit, nicht die Werte.
- Wenn das Gateway aktiv ist, bevorzugt die Rettung typisierte Gateway-Operationen; wenn es ausgefallen ist, verwendet die Rettung nur die minimale lokale Reparaturoberfläche, die nicht von der normalen Agentenschleife abhängt.

Die Rettungsrichtlinie ist integriert: Sie ist nur verfügbar, wenn die effektive Laufzeitumgebung
YOLO verwendet, Sandboxing deaktiviert ist und die Anfrage eine Eigentümer-DM ist. Ausstehende Schreibgenehmigungen
laufen nach 15 Minuten ab. `openclaw doctor --fix` entfernt die eingestellten
Konfigurationsblöcke `systemAgent` und `crestodian`.

Die Remote-Rettung wird durch die Docker-Lane abgedeckt:

```bash
pnpm test:docker:system-agent-rescue
```

Ein optionaler Live-Smoke-Test für die Kanalbefehlsoberfläche prüft `/openclaw status` sowie einen persistenten Genehmigungs-Roundtrip durch den Rettungs-Handler:

```bash
pnpm test:live:system-agent-rescue-channel
```

Das durch das Inferenz-Gate geschützte paketierte einmalige Setup wird abgedeckt durch:

```bash
pnpm test:docker:system-agent-first-run
```

Diese Lane der paketierten CLI startet mit einem leeren Zustandsverzeichnis und weist nach, dass OpenClaw
ohne Inferenz nach dem Fail-Closed-Prinzip abbricht. Anschließend testet und aktiviert sie ein simuliertes Claude über
das paketierte Aktivierungsmodul. Erst danach erreicht eine unscharfe Anfrage den
Planer und wird in ein typisiertes Setup aufgelöst, gefolgt von einmaligen Befehlen, die einen
zusätzlichen Agenten erstellen, Discord durch die Aktivierung eines Plugins sowie eine Token-
SecretRef konfigurieren, die Konfiguration validieren und das Audit-Protokoll prüfen. Diese Lane liefert ergänzende
Nachweise für Gate und Operationen; sie testet weder das interaktive Onboarding noch die
Unterhaltung zwischen OpenClaw-Agent, Tool und Genehmigung. Das folgende QA-Lab-Szenario leitet
an dieselbe Docker-Lane weiter:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
