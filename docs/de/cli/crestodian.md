---
read_when:
    - Sie haben die Inferenz eingerichtet und möchten, dass Crestodian den Rest konfiguriert.
    - Sie müssen OpenClaw mit dem lokalen Einrichtungsagenten überprüfen oder reparieren
    - Sie konzipieren oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für den inferenzgestützten Crestodian-Assistenten zur Einrichtung und Reparatur
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T15:11:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Conversational Crestodian ist OpenClaws lokaler Agent für Einrichtung, Reparatur und Konfiguration. Er startet erst, nachdem das tatsächlich verwendete Standardmodell einen echten Turn abgeschlossen hat. Bei Neuinstallationen wird zuerst die Inferenz eingerichtet; fehlerhafte Konfigurationen verbleiben im klassischen Doctor-Ablauf.

## Wann er startet

Beim Ausführen von `openclaw` ohne Unterbefehl richtet sich das weitere Vorgehen nach dem Konfigurationsstatus:

- Die Konfiguration fehlt oder enthält keine vom Benutzer vorgenommenen Einstellungen (leer oder nur mit den Schlüsseln `$schema`/`meta`): Startet das geführte Onboarding mit Live-KI-Verifizierung.
- Die Konfiguration ist vorhanden, besteht aber die Validierung nicht: Startet das klassische Onboarding, das die Probleme meldet und Sie zu `openclaw doctor` weiterleitet.
- Die Konfiguration ist vorhanden und gültig: Öffnet die normale Agenten-TUI. Ein erreichbarer konfigurierter Gateway, dessen Standardagent über ein Modell verfügt, führt ohne Onboarding oder Crestodian direkt zu dieser Oberfläche. Verwenden Sie später `/crestodian` innerhalb der TUI oder führen Sie direkt `openclaw crestodian` aus, um Crestodian aufzurufen.

Beim Ausführen von `openclaw crestodian` wird zuerst das konfigurierte Standardmodell live getestet. Ein erfolgreicher Turn startet Crestodian. Bei einem interaktiven Fehlschlag wird die geführte Inferenzeinrichtung geöffnet und nach erfolgreicher Prüfung eines Kandidaten an Crestodian übergeben. Einmalige, JSON-basierte und andere nicht interaktive Anfragen schlagen bei nicht verfügbarer Inferenz mit der Anweisung fehl, `openclaw onboard` auszuführen. `openclaw --help` und `openclaw --version` behalten ihre normalen schnellen Ausführungspfade bei.

Das nicht interaktive Ausführen von `openclaw` ohne Unterbefehl (ohne TTY) wird mit einer kurzen Meldung beendet, anstatt die allgemeine Hilfe auszugeben: Bei einer neuen oder ungültigen Installation verweist sie auf das nicht interaktive Onboarding, bei einer gültigen Konfiguration auf `openclaw agent --local ...`.

`openclaw onboard --modern` bleibt ein Kompatibilitätsalias für Crestodian, verwendet jedoch dieselbe Inferenzprüfung: Bei funktionierender Inferenz wird der Chat geöffnet, bei interaktiven Fehlern die geführte Inferenzeinrichtung gestartet und bei nicht interaktiven Fehlern das Programm mit einem Hinweis zum Onboarding beendet. `openclaw onboard --classic` öffnet den vollständigen schrittweisen Assistenten.

## Was Crestodian anzeigt

Der interaktive Crestodian öffnet dieselbe TUI-Oberfläche wie `openclaw tui`, jedoch mit einem Crestodian-Chat-Backend. Die Begrüßung beim Start umfasst:

- die Gültigkeit der Konfiguration und den Standardagenten
- das verifizierte Modell, das Crestodian verwendet
- die Erreichbarkeit des Gateways aus der ersten Startprüfung
- die nächste empfohlene Debugging-Aktion

Beim Start werden weder Geheimnisse ausgegeben noch nur dafür CLI-Befehle von Plugins geladen.

Verwenden Sie `status` für die detaillierte Bestandsübersicht: Konfigurationspfad, Dokumentations-/Quellpfade, lokale CLI-Prüfungen, Vorhandensein von Schlüsseln und Token, Agenten, Modell und Gateway-Details.

Crestodian verwendet dieselbe Referenzerkennung wie reguläre Agenten: In einem Git-Checkout verweist er auf das lokale Verzeichnis `docs/` und den Quellbaum; bei einer npm-Installation verwendet er die mitgelieferte Dokumentation und verlinkt auf [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), mit dem Hinweis, den Quellcode zu prüfen, wenn die Dokumentation nicht ausreicht.

## Beispiele

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Innerhalb der Crestodian-TUI:

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

Crestodian verwendet typisierte Vorgänge, statt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Vorgänge werden sofort ausgeführt: Übersicht anzeigen, Agenten auflisten, installierte Plugins auflisten, ClawHub-Plugins suchen, Modell-/Backend-Status anzeigen, Status-/Integritätsprüfungen ausführen, Gateway-Erreichbarkeit prüfen, Doctor ohne interaktive Korrekturen ausführen, Konfiguration validieren und den Pfad des Audit-Protokolls anzeigen.

Auch das Starten der geführten Kanaleinrichtung (`connect telegram`) wird sofort ausgeführt. Der zugehörige Assistent erfasst ausdrückliche Antworten und verwaltet die daraus resultierenden Schreibvorgänge.

Persistente Vorgänge erfordern eine Genehmigung im Dialog (oder `--yes` bei einem direkten Befehl): Konfiguration schreiben, `config set`, `config set-ref`, Bootstrap für Einrichtung/Onboarding, Standardmodell ändern, Gateway starten/stoppen/neu starten, Agenten erstellen und Plugins installieren.

Doctor-Reparaturen sind innerhalb von Crestodian nicht verfügbar, da sie den Provider, die Authentifizierung oder die Inferenzroute des Standardagenten umschreiben können, auf denen die Sitzung basiert. Beenden Sie Crestodian und führen Sie in einem Terminal `openclaw doctor --fix` aus. Der schreibgeschützte Befehl `doctor` bleibt innerhalb von Crestodian verfügbar.

Neue Agenten übernehmen die live-verifizierte Standard-Inferenzroute. Die Agenten-ID `crestodian` ist für den privilegierten virtuellen Verwalter reserviert und kann nicht als normaler Agent erstellt werden.

`config set` und `config set-ref` können den Zustand der Inferenzroute nicht ändern,
einschließlich der Zugangsdaten des Inferenz-Providers, des übergeordneten Bereichs `auth.*`, der Modellkataloge,
CLI-Backends, standardmäßiger bzw. agentenspezifischer Modellrouten, Agentenparameter/-tools oder des übergeordneten
Bereichs `tools.*`. Direkte Schreibvorgänge unter `env.*`, `secrets.*`, `plugins.*` und `$include`
werden ebenfalls abgelehnt, da sie die Auflösung von Zugangsdaten oder die Aktivierung von Providern
ersetzen können. Gateway- und Kanal-Authentifizierung bleiben normale Konfigurationsbereiche. Verwenden Sie typisierte Plugin-/Kanal-Workflows und
`set default model <provider/model>` für eine bereits
konfigurierte Route; die Route wird vor dem Speichern live getestet. Um den Provider-/Authentifizierungszugriff zu konfigurieren oder
zu reparieren, beenden Sie Crestodian und führen Sie `openclaw onboard` aus.

Die Deinstallation von Plugins wird innerhalb von Crestodian abgelehnt, da das Entfernen eines Provider-
Plugins die Inferenzroute deaktivieren könnte, die die Sitzung ausführt. Beenden Sie Crestodian
und führen Sie `openclaw plugins uninstall <id>` in einem Terminal aus.

Die Genehmigung erteilen Sie mit Ihren eigenen Worten: Eindeutige Antworten („ja“, „sicher“, „fahren Sie fort“, „jetzt nicht“) werden anhand einer geschlossenen deterministischen Liste ausgewertet. Wenn die konfigurierte Route einen separaten Completion-Aufruf unterstützt, können andere Antworten ausschließlich anhand Ihrer Nachricht und des ausstehenden Vorschlags klassifiziert werden — niemals durch das Konversationsmodell selbst, das sich nicht selbst genehmigen kann. Nicht klassifizierte oder mehrdeutige Antworten lassen den Vorschlag ausstehend, und die Konversation fragt erneut nach.

Ausgeführte Schreibvorgänge werden in `~/.openclaw/audit/crestodian.jsonl` aufgezeichnet. Die Ermittlung wird nicht auditiert; nur ausgeführte Operationen und Schreibvorgänge werden aufgezeichnet.

Die Kanaleinrichtung kann als gehostete Konversation ausgeführt werden, bis ein Geheimnis erforderlich ist. Die
lokale Crestodian-TUI akzeptiert keine vertraulichen Antworten des Assistenten, da Terminal-
Chateingaben sichtbar sind. Sie bietet sofort `open channel wizard` an und übernimmt
den ausgewählten Kanal in den maskierten Terminal-Assistenten; Sie können später auch
`openclaw channels add --channel <channel>` ausführen.

### Zur maskierten Kanaleinrichtung wechseln

Der lokale Chat kann die Steuerung an den maskierten Kanalassistenten übergeben:

```text
Kanalassistent für Slack öffnen
Kanalinformationen Slack
```

`open channel wizard for <channel>` öffnet die maskierte Kanaleinrichtung, nachdem die Chat-
TUI geschlossen wurde. Verwenden Sie zuerst `channel info <channel>`, um die Kanalbezeichnung, den Einrichtungs-
status, eine Zusammenfassung der Voraussetzungen und den Link zur Dokumentation anzuzeigen.

Crestodian ändert den Provider-/Authentifizierungszugriff niemals innerhalb seiner eigenen Sitzung: Die
Sitzung hängt bereits von dieser Inferenzroute ab. Für die Einrichtung oder Reparatur eines Modell-Providers
gibt `configure model provider` Hinweise zum Beenden und Onboarding zurück, ohne
einen Assistenten zu starten oder die Konfiguration zu schreiben. Beenden Sie Crestodian und führen Sie `openclaw
onboard` aus; das Onboarding bereitet die Zugangsdaten vor und speichert nur eine Route, die
einen echten Live-Durchlauf abschließt. Starten Sie Crestodian erneut, nachdem das Onboarding erfolgreich abgeschlossen wurde.

## Einrichtungs-Bootstrap

`setup` konfiguriert den verbleibenden Workspace- und Gateway-Zustand, nachdem das geführte Onboarding die Inferenz bereits eingerichtet hat. Es schreibt ausschließlich über typisierte Konfigurationsoperationen und fordert zuerst eine Genehmigung an.

```text
Einrichtung
Workspace einrichten ~/Projects/work
```

`setup` behält das verifizierte effektive Modell bei. Es konfiguriert oder
ersetzt die Inferenz nicht.

Wenn die Inferenz fehlt oder ihre Live-Prüfung fehlschlägt, beenden Sie Crestodian und führen Sie `openclaw onboard` aus. Das geführte Onboarding erkennt konfigurierte Modelle, API-Schlüssel und authentifizierte lokale CLIs, fordert von jedem Kandidaten eine echte Antwort an und speichert nur eine erfolgreiche Route dauerhaft. Crestodian startet unmittelbar nach dieser Grenze und kann anschließend den Workspace, das Gateway, Kanäle, Agenten, Plugins und weitere optionale Funktionen konfigurieren.

Die macOS-App überspringt diese Abfolge vollständig, wenn sie ein konfiguriertes Gateway
erreicht, dessen Standard-Agent bereits über ein konfiguriertes Modell verfügt; sie öffnet die normale Agenten-
Benutzeroberfläche.
Bei einem neuen oder unvollständigen Gateway führt die App die Inferenzabfolge über
die Gateway-Methoden `crestodian.setup.detect` und `crestodian.setup.activate` aus:
„detect“ listet jedes gefundene Backend auf, „activate“ testet einen
Kandidaten live (eine echte Completion mit „reply with OK“) und speichert erst nach erfolgreichem Test das Modell,
die Zugangsdaten und den Provider-/Laufzeitzustand dauerhaft, die für diese Route erforderlich sind. Die Workspace- und Gateway-Standardeinstellungen bleiben Crestodian vorbehalten. Ein fehlschlagender Kandidat
ändert die Konfiguration niemals; die App durchläuft die Abfolge automatisch weiter und bietet abschließend
einen manuellen Schlüssel-/Token-Schritt an, der mit den aktiven
Textinferenz-Provider-Plugins des Gateways befüllt wird. Der ausgewählte Provider legt sein Startmodell
und seine Konfiguration fest, und die Zugangsdaten werden vor dem Speichern auf dieselbe Weise verifiziert.

Die Codex-Überwachung und andere optionale Plugin-Funktionen bleiben außerhalb dieser
Transaktion zur Inferenzaktivierung. Konfigurieren Sie sie erst, nachdem die Inferenz
funktioniert und Crestodian gestartet wurde; bestehende Plugin-Richtlinien und ausdrückliche
Deaktivierungen der Überwachung bleiben während der Inferenzeinrichtung unverändert.

## KI-Konversation

Die freie Konversation des interaktiven Crestodian läuft über dieselbe Agentenschleife wie reguläre OpenClaw-Agenten und ist auf ein einziges OpenClaw-Autoritätstool der Ringstufe null beschränkt, `crestodian`, das die typisierten Operationen kapselt. Leseaktionen werden ohne Einschränkung ausgeführt, Mutationen erfordern Ihre konversationelle Genehmigung für genau diese Operation (siehe „Operationen und Genehmigung“), und jeder ausgeführte Schreibvorgang wird auditiert und erneut validiert. Die Agentensitzung bleibt bestehen, sodass Crestodian über ein echtes Mehrfachrunden-Gedächtnis verfügt. Wenn die verifizierte Inferenzroute später nicht mehr funktioniert, kehren Sie zu `openclaw onboard` zurück und reparieren Sie sie, bevor Sie fortfahren.

Der Host wandelt natürlichsprachliche Anfragen nicht in Operationen um. Freie
Nachrichten — einschließlich befehlsähnlichen Texts und Fragen wie „Warum wurde mein
Gateway angehalten?“ — werden an die KI gesendet, die die Anfrage über das Tool `crestodian`
einer typisierten Operation zuordnen kann.

Wenn eine Mutation aussteht, werden nur eindeutige Genehmigungs- oder Ablehnungsformulierungen aus einer
geschlossenen Liste ohne Inferenz ausgewertet. Mehrdeutige Zustimmung wird an einen
separaten konfigurierten Completion-Aufruf übergeben und andernfalls sicher abgelehnt. Strukturierte
Assistentenfelder und die genaue Host-Navigation sind Bedienelemente der Benutzeroberfläche und keine natürlichsprachliche
Operationsanalyse. Eine Ausnahme zur Geheimnishygiene ist besonders wichtig: Ein
exakter `config set`-Befehl für einen vertraulichen Pfad (Tokens, Schlüssel, Passwörter) erreicht
niemals ein Modell. Der Host erstellt einen geschwärzten Vorschlag, und der Wert wird im
für die KI sichtbaren Verlauf maskiert. Verwenden Sie für Geheimnisse vorzugsweise `config set-ref <path> env <ENV_VAR>`.

Der Rettungsmodus für Nachrichtenkanäle verwendet niemals den modellgestützten Planer. Die Remote-Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agentenpfad nicht als Konfigurationseditor verwendet werden kann.

### Vertrauensmodell des CLI-Harness

Eingebettete Laufzeiten und der Codex-App-Server-Harness erzwingen die Ringstufe-null-
Beschränkung direkt: Der Durchlauf enthält eine OpenClaw-Tool-Zulassungsliste, die ausschließlich
das Tool `crestodian` enthält. Für Codex deaktiviert OpenClaw außerdem Umgebungen, native
Ausführung, Multi-Agent, Ziele, App-/Plugin-, Skill-/MCP-, Websuche- und
`request_user_input`-Oberflächen für diesen Durchlauf. Codex bindet weiterhin sein inaktives natives Dienstprogramm `update_plan`
ein; es kann die temporäre Checkliste des Modells aktualisieren, aber keine Dateien
oder OpenClaw-Konfigurationen schreiben. CLI-Harnesses verwenden die Zulassungsliste von OpenClaw nicht,
daher lässt Crestodian nur Backends zu, deren eigener Vertrag zur Tool-Auswahl
dieselbe Beschränkung nachweisen kann:

- Auswählbare Backends, einschließlich Claude Code, starten mit einer leeren Auswahl nativer Tools
  und einem MCP-Tool, `crestodian`. Claudes generierte MCP-Konfiguration wird
  mit `--strict-mcp-config` angewendet, sodass keine anderen MCP-Server geladen werden.
- Backends, die keine nativen Tools deklarieren, erhalten denselben dedizierten Crestodian-
  MCP-Server.
- Ständig aktive oder unbekannte Backends mit nativen Tools brechen vor der Inferenz sicher ab; sie
  können keine Crestodian-Sitzung hosten.

Nur Crestodian-Sitzungen erhalten den Crestodian-MCP-Server; normale Agent-Ausführungen
sehen dieses Tool nie. Auswählbare CLI-Backends ohne native Tools und Modelle mit API-Schlüssel
erzwingen daher die buchstäbliche Ein-Tool-Schleife. Codex-App-Server-Modelle erzwingen
ein einziges OpenClaw-Autoritätstool sowie das inaktive native Planungswerkzeug. In allen
drei Fällen bleiben Schreibvorgänge während der Einrichtung auf Crestodians geprüften
Genehmigungsvertrag beschränkt.

Gemini CLI bleibt für normale Agenten verfügbar, kann jedoch die von der
Inferenzschranke erforderliche toolfreie Prüfung nicht erzwingen und daher Crestodian nicht hosten.

## Zu einem Agenten wechseln

Verwenden Sie eine natürlichsprachliche Auswahlformulierung, um Crestodian zu verlassen und die normale TUI zu öffnen:

```text
mit Agent sprechen
mit Arbeitsagent sprechen
zum Hauptagenten wechseln
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen die normale Agenten-TUI direkt; sie starten Crestodian nicht. Nach dem Wechsel zur normalen TUI kehren Sie mit `/crestodian` zu Crestodian zurück, optional mit einer Folgeanforderung:

```text
/crestodian
/crestodian gateway neu starten
```

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Nachrichtenkanal-Einstiegspunkt für Crestodian: Verwenden Sie ihn, wenn Ihr normaler Agent ausgefallen ist, aber ein vertrauenswürdiger Kanal (zum Beispiel WhatsApp) weiterhin Befehle empfängt.

Dies ist ein deterministischer Handler für Notfallbefehle, nicht der dialogorientierte
Crestodian-Agent. Er initialisiert keine neue Einrichtung und lockert nicht das Inferenz-
Gate für den Crestodian-Chat.

Unterstützter Befehl: `/crestodian <request>`. Der Rettungsmodus akzeptiert ausschließlich die exakt eingegebene Befehlssyntax — natürliche Sprache wird mit einem Hinweis abgelehnt, niemals als Operation interpretiert, und es wird niemals ein Modell konsultiert.

```text
Sie in einer vertrauenswürdigen Eigentümer-DM: /crestodian status
OpenClaw: Crestodian-Rettungsmodus. Gateway erreichbar: nein. Konfiguration gültig: nein.
Sie: /crestodian restart gateway
OpenClaw: Plan: Gateway neu starten. Antworten Sie mit /crestodian yes, um die Aktion auszuführen.
Sie: /crestodian yes
OpenClaw: Ausgeführt. Audit-Eintrag geschrieben.
```

Die Agent-Erstellung kann auch lokal oder über den Rettungsmodus in die Warteschlange gestellt werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

Bei der Agent-Erstellung darf nur das aktuelle, live verifizierte Standardmodell angegeben werden. Lassen Sie das
Modell weg, um diese Route zu übernehmen.

Remote-Rettung ist eine Administrationsoberfläche und muss wie eine Remote-Reparatur der Konfiguration behandelt werden, nicht wie ein normaler Chat.

Sicherheitsvertrag für die Remote-Rettung:

- Deaktiviert, wenn Sandboxing für den Agenten/die Sitzung aktiv ist; Crestodian verweigert die Remote-Rettung und verweist auf die Reparatur über die lokale CLI.
- Der effektive Standardzustand ist `auto`: Remote-Rettung ist nur im vertrauenswürdigen YOLO-Betrieb zulässig, in dem die Laufzeit bereits über lokale Berechtigungen ohne Sandbox verfügt (`tools.exec.security` wird zu `full` und `tools.exec.ask` zu `off` aufgelöst, bei Sandbox-Modus `off`).
- Erfordert eine explizite Eigentümeridentität; keine Platzhalterregeln für Absender, offene Gruppenrichtlinien, nicht authentifizierten Webhooks oder anonymen Kanäle.
- Standardmäßig nur Direktnachrichten des Eigentümers; Rettung in Gruppen/Kanälen erfordert eine explizite Aktivierung.
- Plugin-Suche und -Auflistung sind schreibgeschützt. Die Plugin-Installation ist immer ausschließlich lokal möglich (bei der Rettung gesperrt, selbst wenn sie ansonsten aktiviert ist), da sie ausführbaren Code herunterlädt. Die Plugin-Deinstallation wird sowohl im lokalen Crestodian als auch bei der Rettung verweigert; führen Sie `openclaw plugins uninstall <id>` in einem Terminal aus.
- Die Remote-Rettung kann weder die lokale TUI öffnen noch zu einer interaktiven Agentensitzung wechseln; verwenden Sie für die Übergabe an den Agenten das lokale `openclaw`.
- Persistente Schreibvorgänge erfordern auch im Rettungsmodus weiterhin eine Genehmigung.
- Jeder angewendete Rettungsvorgang wird protokolliert. Die Rettung über Nachrichtenkanäle zeichnet Kanal-, Konto-, Absender- und Quelladressenmetadaten auf; Vorgänge, die die Konfiguration ändern, zeichnen außerdem die Konfigurations-Hashes davor und danach auf.
- Secrets werden niemals ausgegeben. Die Prüfung von SecretRef meldet die Verfügbarkeit, nicht die Werte.
- Wenn der Gateway aktiv ist, bevorzugt die Rettung typisierte Gateway-Vorgänge; wenn er ausgefallen ist, verwendet die Rettung nur die minimale lokale Reparaturoberfläche, die nicht von der normalen Agentenschleife abhängt.

Konfigurationsstruktur:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (Standard) erlaubt die Rettung nur, wenn die effektive Laufzeit YOLO ist und Sandboxing deaktiviert ist; `false` erlaubt niemals eine Rettung über Nachrichtenkanäle; `true` erlaubt die Rettung explizit, wenn die Eigentümer-/Kanalprüfungen erfolgreich sind (die Ablehnung bei aktivem Sandboxing gilt weiterhin).
- `ownerDmOnly`: beschränkt die Rettung auf Direktnachrichten des Eigentümers. Standardwert: `true`.
- `pendingTtlMinutes`: gibt an, wie lange ein ausstehender Rettungs-Schreibvorgang für die Genehmigung mit `/crestodian yes` offen bleibt, bevor er abläuft. Standardwert: `15`.

Die Remote-Rettung wird durch den Docker-Testlauf abgedeckt:

```bash
pnpm test:docker:crestodian-rescue
```

Ein optionaler Live-Smoke-Test für die Befehlsoberfläche des Kanals prüft `/crestodian status` sowie einen vollständigen persistenten Genehmigungsablauf über den Rettungs-Handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Die durch Inferenz abgesicherte paketierte einmalige Einrichtung wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Dieser Testlauf der paketierten CLI beginnt mit einem leeren Zustandsverzeichnis und weist nach, dass Crestodian
ohne Inferenz standardmäßig verweigert. Anschließend testet und aktiviert er ein simuliertes Claude über
das paketierte Aktivierungsmodul. Erst danach erreicht eine unscharfe Anfrage den
Planer und wird in eine typisierte Einrichtung aufgelöst, gefolgt von einmaligen Befehlen, die einen
zusätzlichen Agenten erstellen, Discord durch Aktivieren eines Plugins sowie ein Token-
SecretRef konfigurieren, die Konfiguration validieren und das Auditprotokoll prüfen. Dieser Testlauf liefert unterstützende
Nachweise für Absicherung/Vorgänge; er führt weder das interaktive Onboarding noch die
Crestodian-Unterhaltung zu Agent, Werkzeug und Genehmigung aus. Das folgende QA-Lab-Szenario leitet
zum selben Docker-Testlauf weiter:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
