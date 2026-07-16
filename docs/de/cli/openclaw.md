---
read_when:
    - Sie haben die Inferenz eingerichtet und möchten, dass OpenClaw den Rest konfiguriert
    - Sie müssen OpenClaw mit dem lokalen Einrichtungsagenten überprüfen oder reparieren
    - Sie konzipieren oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für den inferenzgestützten OpenClaw-Assistenten zur Einrichtung und Reparatur
title: OpenClaw-Einrichtungsagent
x-i18n:
    generated_at: "2026-07-16T12:39:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw wird mit einem integrierten Systemagenten ausgeliefert — er spricht als „OpenClaw“ — für
lokale Einrichtung, Reparatur und Konfiguration (früher Crestodian genannt). Er startet erst, nachdem das tatsächlich verwendete Standardmodell einen echten Durchlauf abgeschlossen hat.
Bei Neuinstallationen wird zuerst die Inferenz eingerichtet; fehlerhafte Konfigurationen verbleiben im
klassischen Doctor-Ablauf.

## Wann er startet

Die Ausführung von `openclaw` ohne Unterbefehl wird abhängig vom Konfigurationszustand weitergeleitet:

- Konfiguration fehlt oder ist vorhanden, enthält aber keine vorgenommenen Einstellungen (leer oder nur Schlüssel `$schema`/`meta`): startet das geführte Onboarding mit Live-KI-Verifizierung.
- Konfiguration ist vorhanden, besteht aber die Validierung nicht: startet das klassische Onboarding, das die Probleme meldet und Sie zu `openclaw doctor` weiterleitet.
- Konfiguration ist vorhanden und gültig: öffnet die normale Agenten-TUI. Ein erreichbares
  konfiguriertes Gateway, dessen Standardagent über ein Modell verfügt, wechselt direkt zu dieser Benutzeroberfläche,
  ohne Onboarding oder OpenClaw. Verwenden Sie `/openclaw` innerhalb der TUI oder führen Sie
  `openclaw setup` direkt aus, um OpenClaw später aufzurufen.

Die Ausführung von `openclaw setup` testet zunächst das konfigurierte Standardmodell live. Ein erfolgreicher Durchlauf startet OpenClaw. Bei einem interaktiven Fehlschlag wird die geführte Inferenzeinrichtung geöffnet und nach erfolgreicher Prüfung eines Kandidaten an OpenClaw übergeben. Einmalige, JSON- und andere nicht interaktive Anfragen schlagen mit der Anweisung fehl, `openclaw onboard` auszuführen, wenn keine Inferenz verfügbar ist. `openclaw --help` und `openclaw --version` behalten ihre normalen schnellen Pfade bei.

Das nicht interaktive bloße `openclaw` (ohne TTY) wird mit einer kurzen Meldung beendet, statt die Hilfe für die Stammebene auszugeben: Bei einer neuen oder ungültigen Installation verweist sie auf das nicht interaktive Onboarding, bei gültiger Konfiguration auf `openclaw agent --local ...`.

`openclaw onboard --modern` bleibt ein Kompatibilitätsalias für OpenClaw, verwendet jedoch dieselbe Inferenzsperre: Eine funktionierende Inferenz öffnet den Chat, interaktive Fehlschläge starten die geführte Inferenzeinrichtung und nicht interaktive Fehlschläge werden mit Onboarding-Hinweisen beendet. `openclaw onboard --classic` öffnet den vollständigen schrittweisen Assistenten.

## Was OpenClaw anzeigt

Das interaktive OpenClaw öffnet dieselbe TUI-Shell wie `openclaw tui`, mit einem OpenClaw-Chat-Backend. Die Startbegrüßung behandelt:

- Gültigkeit der Konfiguration und den Standardagenten
- das verifizierte Modell, das OpenClaw verwendet
- Erreichbarkeit des Gateways aus der ersten Startprüfung
- die nächste empfohlene Debugging-Maßnahme

Es gibt keine Secrets aus und lädt nicht allein für den Start die CLI-Befehle von Plugins.

Verwenden Sie `status` für die detaillierte Bestandsaufnahme: Konfigurationspfad, Dokumentations-/Quellpfade, lokale CLI-Prüfungen, Vorhandensein von Schlüsseln/Tokens, Agenten-, Modell- und Gateway-Details.

OpenClaw verwendet dieselbe Referenzerkennung wie reguläre Agenten: In einem Git-Checkout verweist es auf die lokale Datei `docs/` und den Quellbaum; in einer npm-Installation verwendet es die mitgelieferte Dokumentation und verlinkt auf [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), mit dem Hinweis, den Quellcode zu prüfen, wenn die Dokumentation nicht ausreicht.

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

## Vorgänge und Genehmigung

OpenClaw verwendet typisierte Vorgänge, anstatt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Vorgänge werden sofort ausgeführt: Übersicht anzeigen, Agenten auflisten, installierte Plugins auflisten, ClawHub-Plugins suchen, Modell-/Backend-Status anzeigen, Status-/Zustandsprüfungen ausführen, Gateway-Erreichbarkeit prüfen, Doctor ohne interaktive Korrekturen ausführen, Konfiguration validieren, Pfad des Audit-Protokolls anzeigen.

Auch der Start der geführten Kanaleinrichtung (`connect telegram`) wird sofort ausgeführt. Der Assistent erfasst eindeutige Antworten und ist für die daraus resultierenden Schreibvorgänge zuständig.

Dauerhafte Vorgänge erfordern eine Genehmigung im Gespräch (oder `--yes` für einen direkten Befehl): Konfiguration schreiben, `config set`, `config set-ref`, Einrichtungs-/Onboarding-Bootstrap, Standardmodell ändern, Gateway starten/stoppen/neu starten, Agenten erstellen und Plugins installieren.

Doctor-Reparaturen sind innerhalb von OpenClaw nicht verfügbar, da sie den Provider, die Authentifizierung oder die Inferenzroute des Standardagenten umschreiben können, auf der die Sitzung basiert. Beenden Sie OpenClaw und führen Sie `openclaw doctor --fix` in einem Terminal aus. Das schreibgeschützte `doctor` bleibt innerhalb von OpenClaw verfügbar.

Neue Agenten übernehmen die live verifizierte Standard-Inferenzroute. Die Agenten-IDs `openclaw` und `crestodian` sind für den Systemagenten reserviert und können nicht als normale Agenten erstellt werden. Die stillgelegte ID bleibt gesperrt, damit sie nicht von einer alten Konfiguration beansprucht werden kann.

`config set` und `config set-ref` können den Zustand der Inferenzroute nicht ändern,
einschließlich Anmeldedaten des Inferenz-Providers, `auth.*` auf oberster Ebene, Modellkatalogen,
CLI-Backends, standardmäßigen/agentenspezifischen Modellrouten, Agentenparametern/-Tools oder
`tools.*` auf Stammebene. Unverarbeitete Schreibvorgänge unter `env.*`, `secrets.*`, `plugins.*` und `$include`
werden ebenfalls abgelehnt, da sie die Auflösung von Anmeldedaten oder die Aktivierung von Providern
ersetzen können. Die Authentifizierung für Gateway und Kanäle bleibt eine normale Konfigurationsoberfläche. Verwenden Sie typisierte Plugin-/Kanal-Workflows und
`set default model <provider/model>` für eine bereits
konfigurierte Route; die Route wird vor dem Speichern live getestet. Um den
Provider-/Authentifizierungszugriff zu konfigurieren oder zu reparieren, beenden Sie OpenClaw und führen Sie `openclaw onboard` aus.

Die Deinstallation von Plugins wird innerhalb von OpenClaw abgelehnt, da das Entfernen eines
Provider-Plugins die Inferenzroute deaktivieren könnte, auf der die Sitzung basiert. Beenden Sie OpenClaw
und führen Sie `openclaw plugins uninstall <id>` in einem Terminal aus.

Die Genehmigung erfolgt mit Ihren eigenen Worten: Eindeutige Antworten („ja“, „sicher“, „fortfahren“, „jetzt nicht“) werden anhand einer geschlossenen deterministischen Liste aufgelöst. Wenn die konfigurierte Route einen separaten Abschlussaufruf unterstützt, können andere Antworten ausschließlich anhand Ihrer Nachricht und des ausstehenden Vorschlags klassifiziert werden — niemals durch das Gesprächsmodell selbst, das sich nicht selbst genehmigen kann. Nicht klassifizierbare oder mehrdeutige Antworten lassen den Vorschlag ausstehend, und im Gespräch wird erneut nachgefragt.

Angewendete Schreibvorgänge werden in `~/.openclaw/audit/system-agent.jsonl` aufgezeichnet. Die Erkennung wird nicht auditiert; nur angewendete Vorgänge und Schreibvorgänge werden erfasst.

Die Kanaleinrichtung kann als gehostetes Gespräch ausgeführt werden, bis ein Secret benötigt wird. Die
lokale OpenClaw-TUI akzeptiert keine sensiblen Antworten im Assistenten, da Terminal-
Chateingaben sichtbar sind. Sie bietet sofort `open channel wizard` an und übernimmt
den ausgewählten Kanal in den maskierten Terminal-Assistenten; Sie können auch später
`openclaw channels add --channel <channel>` ausführen.

### Wechsel zur maskierten Kanaleinrichtung

Der lokale Chat kann die Steuerung an den maskierten Kanalassistenten übergeben:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` öffnet die maskierte Kanaleinrichtung, nachdem die Chat-
TUI geschlossen wurde. Verwenden Sie zuerst `channel info <channel>` für die Kanalbezeichnung, den Einrichtungs-
status, eine Zusammenfassung der Voraussetzungen und den Link zur Dokumentation.

OpenClaw ändert den Provider-/Authentifizierungszugriff niemals innerhalb seiner eigenen Sitzung: Die
Sitzung ist bereits von dieser Inferenzroute abhängig. Für die Einrichtung oder
Reparatur eines Modell-Providers gibt `configure model provider` Hinweise zum Beenden/Onboarding zurück, ohne
einen Assistenten zu starten oder die Konfiguration zu schreiben. Beenden Sie OpenClaw und führen Sie `openclaw
onboard` aus; das Onboarding stellt die Anmeldedaten bereit und speichert nur eine Route, die
einen echten Live-Durchlauf abschließt. Starten Sie OpenClaw nach erfolgreichem Onboarding erneut.

## Einrichtungs-Bootstrap

`setup` konfiguriert den verbleibenden Arbeitsbereichs- und Gateway-Zustand, nachdem das geführte Onboarding die Inferenz bereits eingerichtet hat. Schreibvorgänge erfolgen ausschließlich über typisierte Konfigurationsvorgänge und erst nach Genehmigung.

```text
setup
setup workspace ~/Projects/work
```

`setup` behält das verifizierte tatsächlich verwendete Modell bei. Es konfiguriert oder
ersetzt die Inferenz nicht.

Wenn die Inferenz fehlt oder ihre Live-Prüfung fehlschlägt, verlassen Sie OpenClaw und führen Sie `openclaw onboard` aus. Das geführte Onboarding erkennt konfigurierte Modelle, API-Schlüssel und authentifizierte lokale CLIs, fordert von jedem Kandidaten eine echte Antwort an und speichert nur eine erfolgreiche Route dauerhaft. OpenClaw startet unmittelbar nach dieser Grenze und kann anschließend den Arbeitsbereich, das Gateway, Kanäle, Agenten, Plugins und andere optionale Funktionen konfigurieren.

Die macOS-App überspringt diese Abfolge vollständig, wenn sie ein konfiguriertes Gateway
erreicht, dessen Standardagent bereits über ein konfiguriertes Modell verfügt; sie öffnet die normale Agenten-
Benutzeroberfläche.
Bei einem neuen oder unvollständigen Gateway steuert die App die Inferenzabfolge über
die Gateway-Methoden `openclaw.setup.detect` und `openclaw.setup.activate`:
„detect“ listet jedes gefundene Kandidaten-Backend auf, „activate“ testet einen
Kandidaten live (ein echter Abschluss mit „reply with OK“) und speichert nur den Modell-,
Anmeldedaten- und Provider-/Laufzeitzustand dauerhaft, der für diese Route erforderlich ist, nachdem der Test erfolgreich war. Die Standardwerte für Arbeitsbereich und Gateway verbleiben bei OpenClaw. Ein fehlgeschlagener Kandidat
ändert niemals die Konfiguration; die App durchläuft die Abfolge automatisch abwärts und
bietet schließlich einen manuellen Schlüssel-/Token-Schritt an, der aus den aktiven
Textinferenz-Provider-Plugins des Gateways befüllt wird. Der ausgewählte Provider ist für sein Startmodell
und seine Konfiguration zuständig, und die Anmeldedaten werden vor dem Speichern auf dieselbe Weise verifiziert.

Die Codex-Überwachung und andere optionale Plugin-Funktionen bleiben außerhalb dieser
Inferenzaktivierungstransaktion. Konfigurieren Sie sie erst, nachdem die Inferenz
funktioniert und OpenClaw gestartet wurde; bestehende Plugin-Richtlinien und ausdrückliche
Deaktivierungen der Überwachung bleiben während der Inferenzeinrichtung unverändert.

## KI-Gespräch

Das Freiformgespräch des interaktiven OpenClaw läuft über dieselbe Agentenschleife wie reguläre OpenClaw-Agenten und ist auf ein einziges OpenClaw-Autoritätstool der Ringstufe null beschränkt, `openclaw`, das die typisierten Vorgänge kapselt. Leseaktionen werden frei ausgeführt, Änderungen erfordern Ihre Genehmigung im Gespräch für genau diesen Vorgang (siehe Vorgänge und Genehmigung), und jeder angewendete Schreibvorgang wird auditiert und erneut validiert. Die Agentensitzung bleibt bestehen, sodass OpenClaw über ein echtes Mehrfachdurchlaufgedächtnis verfügt. Wenn die verifizierte Inferenzroute später nicht mehr funktioniert, kehren Sie zu `openclaw onboard` zurück und reparieren Sie sie, bevor Sie fortfahren.

Der Host analysiert natürlichsprachliche Anfragen nicht zu Vorgängen. Freiform-
nachrichten — einschließlich befehlsähnlichem Text und Fragen wie „Warum wurde mein
Gateway gestoppt?“ — werden an die KI gesendet, die die Anfrage über das Tool
`openclaw` einem typisierten Vorgang zuordnen kann.

Wenn eine Änderung aussteht, werden nur eindeutige Genehmigungs- oder Ablehnungsformulierungen aus einer
geschlossenen Liste ohne Inferenz aufgelöst. Mehrdeutige Zustimmung wird an einen
separaten konfigurierten Abschlussaufruf gesendet und schlägt andernfalls sicher geschlossen fehl. Strukturierte
Assistentenfelder und exakte Hostnavigation sind UI-Steuerelemente und keine natürlichsprachliche
Vorgangsanalyse. Eine Ausnahme für die Secret-Hygiene ist besonders wichtig: Ein
exaktes `config set` auf einem sensiblen Pfad (Tokens, Schlüssel, Passwörter) erreicht niemals
ein Modell. Der Host erstellt einen redigierten Vorschlag, und der Wert wird im
für die KI sichtbaren Verlauf maskiert. Verwenden Sie für Secrets bevorzugt `config set-ref <path> env <ENV_VAR>`.

Der Rettungsmodus für Nachrichtenkanäle verwendet niemals den modellgestützten Planer. Die Remote-Wiederherstellung bleibt deterministisch, damit ein fehlerhafter oder kompromittierter normaler Agentenpfad nicht als Konfigurationseditor verwendet werden kann.

### Vertrauensmodell des CLI-Testsystems

Eingebettete Laufzeitumgebungen und das Codex-App-Server-Harness erzwingen die Ring-Zero-
Beschränkung direkt: Der Lauf enthält eine OpenClaw-Tool-Zulassungsliste, die nur
das Tool `openclaw` umfasst. Für Codex deaktiviert OpenClaw außerdem Umgebungen, native
Ausführung, Multi-Agent-, Ziel-, App-/Plugin-, Skill-/MCP-, Websuch- und
`request_user_input`-Oberflächen für diesen Lauf. Codex bindet weiterhin sein inaktives natives `update_plan`-
Hilfsprogramm ein; es kann die temporäre Checkliste des Modells aktualisieren, aber keine Dateien
oder OpenClaw-Konfiguration schreiben. CLI-Harnesses verwenden die Zulassungsliste von OpenClaw nicht,
daher lässt OpenClaw nur Backends zu, deren eigener Vertrag zur Tool-Auswahl
dieselbe Beschränkung nachweisen kann:

- Auswählbare Backends, einschließlich Claude Code, starten mit einer leeren Auswahl nativer Tools
  und einem MCP-Tool, `openclaw`. Die generierte MCP-Konfiguration von Claude wird
  mit `--strict-mcp-config` angewendet, sodass keine anderen MCP-Server geladen werden.
- Backends, die keine nativen Tools deklarieren, erhalten denselben dedizierten OpenClaw-
  MCP-Server.
- Backends mit stets aktiven oder unbekannten nativen Tools verweigern den Betrieb vor der Inferenz;
  sie können keine OpenClaw-Sitzung hosten.

Nur OpenClaw-Sitzungen erhalten den openclaw-MCP-Server; normale Agentenläufe
sehen dieses Tool nie. Auswählbare CLI-Backends beziehungsweise solche ohne native Tools und Modelle mit API-Schlüssel
erzwingen daher die buchstäbliche Schleife mit nur einem Tool. Codex-App-Server-Modelle erzwingen
ein einzelnes OpenClaw-Autorisierungstool sowie das inaktive native Planungshilfsprogramm. In allen
drei Fällen bleiben Schreibvorgänge bei der Einrichtung auf den auditierten Genehmigungsvertrag
von OpenClaw beschränkt.

Gemini CLI bleibt für normale Agenten verfügbar, kann jedoch die
für das Inferenz-Gate erforderliche Prüfung ohne Tools nicht erzwingen und daher OpenClaw nicht hosten.

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

## Nachrichtenrettungsmodus

Der Nachrichtenrettungsmodus ist der Einstiegspunkt für OpenClaw über Nachrichtenkanäle: Verwenden Sie ihn, wenn Ihr normaler Agent ausgefallen ist, aber ein vertrauenswürdiger Kanal (zum Beispiel WhatsApp) weiterhin Befehle empfängt.

Dies ist ein deterministischer Handler für Notfallbefehle, nicht der dialogfähige
OpenClaw-Agent. Er richtet keine neue Konfiguration von Grund auf ein und lockert das Inferenz-
Gate für den OpenClaw-Chat nicht.

Unterstützter Befehl: `/openclaw <request>`. Die Rettungsfunktion akzeptiert ausschließlich die exakt eingegebene Befehlssyntax — natürliche Sprache wird mit einem Hinweis abgelehnt, niemals als Operation interpretiert, und es wird nie ein Modell konsultiert.

```text
Sie, in einer vertrauenswürdigen Eigentümer-DM: /openclaw status
OpenClaw: OpenClaw-Rettungsmodus. Gateway erreichbar: nein. Konfiguration gültig: nein.
Sie: /openclaw restart gateway
OpenClaw: Plan: Gateway neu starten. Antworten Sie mit /openclaw yes, um ihn anzuwenden.
Sie: /openclaw yes
OpenClaw: Angewendet. Audit-Eintrag geschrieben.
```

Die Erstellung eines Agenten kann auch lokal oder über die Rettungsfunktion in die Warteschlange gestellt werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Bei der Agentenerstellung darf nur das aktuell live verifizierte Standardmodell angegeben werden. Lassen Sie das
Modell weg, um diese Route zu übernehmen.

Die Remote-Rettung ist eine Administrationsoberfläche und muss wie eine Remote-Reparatur der Konfiguration behandelt werden, nicht wie ein normaler Chat.

Sicherheitsvertrag für die Remote-Rettung:

- Deaktiviert, wenn Sandboxing für den Agenten/die Sitzung aktiv ist; OpenClaw verweigert die Remote-Rettung und verweist auf die lokale CLI-Reparatur.
- Der effektive Standardzustand ist `auto`: Remote-Rettung nur im vertrauenswürdigen YOLO-Betrieb zulassen, in dem die Laufzeitumgebung bereits über uneingeschränkte lokale Berechtigungen ohne Sandbox verfügt (`tools.exec.security` wird zu `full` und `tools.exec.ask` wird zu `off` aufgelöst, mit dem Sandbox-Modus `off`).
- Erfordert eine explizite Eigentümeridentität; keine Platzhalterregeln für Absender, offene Gruppenrichtlinien, nicht authentifizierte Webhooks oder anonymen Kanäle.
- Standardmäßig nur Eigentümer-DMs; für die Rettung über Gruppen/Kanäle ist eine explizite Aktivierung erforderlich.
- Plugin-Suche und -Auflistung sind schreibgeschützt. Die Plugin-Installation ist immer ausschließlich lokal möglich (in der Rettungsfunktion gesperrt, auch wenn sie ansonsten aktiviert ist), da dabei ausführbarer Code heruntergeladen wird. Die Plugin-Deinstallation wird sowohl im lokalen OpenClaw als auch in der Rettungsfunktion verweigert; führen Sie `openclaw plugins uninstall <id>` in einem Terminal aus.
- Die Remote-Rettung kann weder die lokale TUI öffnen noch zu einer interaktiven Agentensitzung wechseln; verwenden Sie für die Übergabe an einen Agenten lokal `openclaw`.
- Persistente Schreibvorgänge erfordern auch im Rettungsmodus weiterhin eine Genehmigung.
- Ausstehende Genehmigungen sind einmalig verwendbar. Jeder neuere Rettungsbefehl für dasselbe Konto, denselben Kanal und denselben Absender widerruft den älteren Plan; auch eine fehlgeschlagene Ausführung verbraucht die Genehmigung. Senden Sie den Befehl daher erneut, um es noch einmal zu versuchen.
- Jede angewendete Rettungsoperation wird auditiert. Die Rettung über Nachrichtenkanäle zeichnet Metadaten zu Kanal, Konto, Absender und Quelladresse auf; konfigurationsändernde Operationen zeichnen außerdem die Konfigurations-Hashes vor und nach der Änderung auf.
- Geheimnisse werden niemals ausgegeben. Die SecretRef-Prüfung meldet die Verfügbarkeit, nicht die Werte.
- Wenn das Gateway aktiv ist, bevorzugt die Rettungsfunktion typisierte Gateway-Operationen; ist es ausgefallen, verwendet sie nur die minimale lokale Reparaturoberfläche, die nicht von der normalen Agentenschleife abhängt.

Konfigurationsstruktur:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (Standard) erlaubt die Rettungsfunktion nur, wenn die effektive Laufzeitumgebung YOLO verwendet und Sandboxing deaktiviert ist; `false` erlaubt niemals die Rettung über Nachrichtenkanäle; `true` erlaubt die Rettung ausdrücklich, wenn die Eigentümer-/Kanalprüfungen bestanden werden (weiterhin vorbehaltlich der Ablehnung wegen Sandboxing).
- `ownerDmOnly`: Beschränkt die Rettung auf direkte Nachrichten des Eigentümers. Standard: `true`.
- `pendingTtlMinutes`: Gibt an, wie lange ein ausstehender Rettungsschreibvorgang für die Genehmigung mit `/openclaw yes` offen bleibt, bevor er abläuft. Standard: `15`.

`openclaw doctor --fix` migriert den veralteten Konfigurationsblock `crestodian` zu
`systemAgent`. Die Laufzeitumgebung liest nur den kanonischen Block.

Die Remote-Rettung wird durch die Docker-Teststrecke abgedeckt:

```bash
pnpm test:docker:system-agent-rescue
```

Ein optionaler Live-Smoke-Test der Kanalbefehlsoberfläche prüft `/openclaw status` sowie einen vollständigen persistenten Genehmigungsablauf über den Rettungshandler:

```bash
pnpm test:live:system-agent-rescue-channel
```

Die Inferenz-Gate-geschützte paketierte einmalige Einrichtung wird abgedeckt durch:

```bash
pnpm test:docker:system-agent-first-run
```

Diese Teststrecke für die paketierte CLI startet mit einem leeren Zustandsverzeichnis und weist nach, dass OpenClaw
ohne Inferenz den Betrieb verweigert. Anschließend testet und aktiviert sie einen simulierten Claude über
das paketierte Aktivierungsmodul. Erst danach erreicht eine unscharfe Anfrage den
Planer und wird in eine typisierte Einrichtung aufgelöst, gefolgt von einmaligen Befehlen, die einen
zusätzlichen Agenten erstellen, Discord über die Aktivierung eines Plugins sowie eine Token-
SecretRef konfigurieren, die Konfiguration validieren und das Audit-Protokoll prüfen. Diese Teststrecke liefert unterstützende
Nachweise für Gate und Operationen; sie führt weder das interaktive Onboarding noch die
Konversation zwischen OpenClaw-Agent, Tool und Genehmigung aus. Das folgende QA-Lab-Szenario leitet
auf dieselbe Docker-Teststrecke um:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
