---
read_when:
    - Sie möchten, dass OpenClaw wiederverwendbare Abläufe aus abgeschlossenen Unterhaltungen lernt
    - Sie entscheiden, ob autonome Skill-Vorschläge aktiviert werden sollen
    - Sie müssen Sicherheit, Kosten, Voraussetzungen oder Fehlerbehebung beim selbstständigen Lernen verstehen
sidebarTitle: Self-learning
summary: OpenClaw wiederverwendbare Skills aus Korrekturen und umfangreichen abgeschlossenen Arbeiten vorschlagen lassen
title: Selbstlernend
x-i18n:
    generated_at: "2026-07-16T13:30:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Selbstlernen ermöglicht OpenClaw, nützliche Erkenntnisse aus Unterhaltungen in ausstehende
[Skill-Workshop](/de/tools/skill-workshop)-Vorschläge umzuwandeln. Es trainiert keine Modellgewichtungen,
bearbeitet keine aktiven Skills und ändert das Agentenverhalten nicht unbemerkt. Jedes erlernte
Verfahren bleibt ausstehend, bis es von einer zuständigen Person geprüft und angewendet wird.

Selbstlernen ist **standardmäßig deaktiviert**. Aktivieren Sie es nur, wenn ein zusätzlicher
Modelllauf im Hintergrund und eine Überprüfung des Transkripts für Ihren Workspace angemessen sind.

## Selbstlernen aktivieren

Öffnen Sie in der Control UI **Plugins → Workshop** und aktivieren Sie **Selbstlernen**. Die
Änderung wird sofort wirksam. Wenn ein anderer Konfigurationsschreiber die
Datei aktualisiert hat, aktualisiert die Control UI den Konfigurations-Snapshot und versucht die Umschaltung erneut, ohne
die Seite oder den Gateway neu zu laden.

Verwenden Sie die CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Oder bearbeiten Sie `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Deaktivieren Sie es wieder mit:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Vom Benutzer angeforderte Skill-Erstellung, `/learn` und manuelle Skill-Workshop-Vorgänge
funktionieren weiterhin, während das Selbstlernen deaktiviert ist.

## Frühere Sitzungen manuell überprüfen

Die manuelle Verlaufsüberprüfung ist die konservative Alternative zur autonomen Erfassung.
Öffnen Sie **Plugins → Workshop** in der Control UI und wählen Sie **Skill-Ideen finden**.
Dadurch wird `skills.workshop.autonomous.enabled` nicht geändert.

Jeder Scan:

- beginnt mit den neuesten noch nicht überprüften Sitzungen und arbeitet sich rückwärts vor;
- überprüft bis zu 20 umfangreiche Sitzungen mit mindestens sechs Modelldurchläufen;
- überspringt Cron-, Heartbeat-, Hook-, Subagenten-, ACP-, Plugin-eigene und interne Überprüfungssitzungen;
- schwärzt erkannte Secrets und begrenzt das Transkriptpaket, bevor es
  an das konfigurierte Modell des ausgewählten Agenten gesendet wird;
- wendet denselben hohen Maßstab wie die autonome Erfahrungsüberprüfung an; und
- kann höchstens drei ausstehende Vorschläge erstellen oder überarbeiten, niemals aktive Skills.

Der Workshop meldet die kumulative Anzahl der Sitzungen, die Datumsabdeckung und die gefundenen Ideen.
Wählen Sie **Frühere Arbeit scannen** für das nächste ältere Zeitfenster. Wenn der Cursor den
Anfang des geeigneten Verlaufs erreicht, ändert sich die Aktion zu **Neue Arbeit scannen**.
OpenClaw speichert nur Cursor- und Abdeckungsmetadaten in der gemeinsam genutzten Zustandsdatenbank;
es erstellt kein zweites Transkriptarchiv.

Sitzungen werden nur gescannt, wenn OpenClaw ihre Eigentümerschaft nachweisen und
Inhalte externer Hooks ausschließen kann. Nach einem Upgrade kann das aktuelle Transkript aus der Zeit vor dem Upgrade
lokal klassifiziert werden, rotierte Transkripte aus der Zeit vor dem Upgrade ohne Provenienz pro Lauf
werden jedoch übersprungen. Neue Transkripte behalten diese Provenienz auch nach der Rotation.

Manuelle Scans verursachen weiterhin Kosten beim Modell-Provider und senden geeignete Unterhaltungsinhalte
an den konfigurierten Provider. Verwenden Sie sie nur, wenn diese Überprüfung den Datenschutz- und
Datenverarbeitungsanforderungen des Workspace entspricht.

## Was OpenClaw lernen kann

Selbstlernen umfasst zwei konservative Pfade:

1. **Direkte Anweisungen und Korrekturen.** OpenClaw erkennt dauerhafte Formulierungen
   wie „von nun an“, „beim nächsten Mal“ und Korrekturen eines fehlgeschlagenen Ansatzes.
   Wenn das Selbstlernen aktiviert ist, kann es diese Signale in ausstehende Vorschläge
   umwandeln, ohne auf eine weitere Eingabeaufforderung zu warten. Dieser deterministische Pfad kann zusammengehörige
   Anweisungen in bis zu drei Vorschlägen gruppieren, einen beschreibbaren Workspace-Skill als Ziel verwenden
   oder einen eigenen zugehörigen ausstehenden Vorschlag überarbeiten. Er wird auch nach fehlgeschlagenen Durchläufen
   ausgeführt, da er die Anweisungen des Benutzers erfasst, anstatt die Fertigstellung zu beurteilen.
2. **Erfahrungsüberprüfung.** Nach einem erfolgreichen, umfangreichen Vordergrunddurchlauf
   kann OpenClaw die abgeschlossene Arbeit auf eine wiederverwendbare Wiederherstellungstechnik oder
   ein stabiles Verfahren überprüfen, das mindestens zwei zukünftige Modell- oder Tool-Rundläufe
   vermeiden würde.

Gute Kandidaten sind unter anderem:

- eine zuverlässige Wiederherstellung nach wiederholten Tool- oder Modellfehlern;
- eine nicht offensichtliche Reihenfolgebedingung, die einen wiederkehrenden Fehler verhindert hat;
- ein stabiler mehrstufiger Workflow, der wiederholte Erkundung erforderte; oder
- eine wiederverwendbare Vorabprüfung, die mehrere zukünftige Aufrufe vermeiden würde.

Die überprüfende Instanz sollte bei routinemäßiger erfolgreicher Arbeit, einmaligen Anfragen,
persönlichen Fakten, einfachen Präferenzen, vorübergehenden Umgebungsfehlern, allgemeinen
Ratschlägen, unbelegten negativen Behauptungen und Secrets keinen Vorschlag abgeben.

## Wann die Erfahrungsüberprüfung ausgeführt wird

Die Erfahrungsüberprüfung wird bewusst verzögert und begrenzt:

- Der Vordergrunddurchlauf muss erfolgreich abgeschlossen werden.
- Der aktuelle Durchlauf muss mindestens zehn Modelliterationen enthalten.
- Cron-, Heartbeat-, Speicher-, Überlauf-, Hook-, Subagenten- und Überprüfungssitzungen sind
  ausgeschlossen.
- Für den Vordergrundlauf müssen ein Provider und ein Modell aufgelöst worden sein, und er muss tatsächlich
  Zugriff auf `skill_workshop` gehabt haben.
- OpenClaw wartet nach Abschluss 30 Sekunden. Ein späterer Abschluss im Vordergrund in
  derselben Sitzung startet diese Ruhezeit erneut.
- Wenn noch ein Agenten- oder Antwortlauf aktiv ist, wartet die Überprüfung weitere 30 Sekunden.
- Es wird jeweils nur eine Erfahrungsüberprüfung ausgeführt.
- Die verzögerte Überprüfung ist prozesslokale Gateway-Arbeit. Der Gateway muss während
  des Leerlauffensters weiterlaufen; einmalige lokale und CLI-gestützte Laufzeitumgebungen bewahren
  nicht genügend Trajektorien- und Tool-Verfügbarkeitskontext auf, um sie einzuplanen.

Die Vordergrundantwort wird durch das Lernen niemals verzögert. Ein fehlgeschlagener oder ungeeigneter
Durchlauf startet keine Erfahrungsüberprüfung, obwohl direkte Benutzerkorrekturen
weiterhin als Vorschlag angeboten werden können, wenn die Autonomie deaktiviert ist.

## Was die überprüfende Instanz erhält

Die überprüfende Hintergrundinstanz erhält nur den aktuellen Durchlauf, beginnend mit seiner
neuesten Benutzernachricht. Die gerenderte Trajektorie ist auf 60,000 Zeichen begrenzt;
bei Bedarf behält OpenClaw die erste Nachricht und die neuesten Nachweise bei und
kennzeichnet den ausgelassenen Mittelteil.

Die überprüfende Instanz verwendet den aufgelösten Provider und das aufgelöste Modell erneut. Sie verwendet das Authentifizierungsprofil des Vordergrundlaufs
erneut, wenn diese Identität verfügbar ist, und deaktiviert Modell-Fallbacks. Die
Überprüfung startet daher einen zusätzlichen Modelllauf beim konfigurierten Provider.
Dieser Lauf kann mehr als eine Provider-Anfrage stellen, wenn er einen
Vorschlag prüft oder entwirft. Preisgestaltung und Datenverarbeitungsbedingungen des Providers gelten genauso wie für den
Vordergrunddurchlauf.

Vor dem Start lädt OpenClaw die aktuelle Laufzeitkonfiguration neu und überprüft erneut die
effektive Sandbox- und Tool-Richtlinie für die ursprüngliche Unterhaltung. Wenn der Lauf in einer
Sandbox ausgeführt wird, die Richtlinie `skill_workshop` nicht mehr zulässt oder erforderliche Laufzeitfakten
fehlen, schlägt die Überprüfung sicher geschlossen fehl und erstellt nichts.

<Warning>
  Durch das Aktivieren des Selbstlernens dürfen geeignete Unterhaltungsinhalte, einschließlich Tool-
  Eingaben und Ergebnissen des aktuellen Durchlaufs, für eine zusätzliche Überprüfung an den ausgewählten Modell-
  Provider gesendet werden. Aktivieren Sie es nicht in einem Workspace, in dem
  diese Überprüfung gegen Datenverarbeitungsanforderungen verstoßen würde.
</Warning>

## Sicherheit von Vorschlägen

Die überprüfende Instanz wird in einer isolierten Sitzung mit einer bewusst eingeschränkten Tool-
Oberfläche ausgeführt:

- Sie kann nur Workshop-Vorschläge auflisten oder prüfen und einen
  ausstehenden Vorschlag erstellen oder überarbeiten.
- Sie kann keinen aktiven Skill aktualisieren, keinen Vorschlag anwenden, ablehnen oder unter Quarantäne stellen,
  keine Nachricht senden und keine allgemeinen Agenten-Tools verwenden.
- Ein Mutationsbudget wird über Modellwiederholungen hinweg geteilt, sodass eine Überprüfung höchstens
  einen Vorschlag erstellen oder überarbeiten kann.
- Die überprüfte Trajektorie wird als nicht vertrauenswürdiger Nachweis behandelt, nicht als Anweisungen
  für den Hintergrundagenten.
- Der Skill Workshop scannt Vorschlagsinhalte und weist erkannte wörtliche
  Anmeldedaten zurück, bevor der Vorschlagsstatus geschrieben wird.

Die normalen Workshop-Grenzwerte gelten weiterhin, einschließlich `maxPending`, `maxSkillBytes`,
Einschränkungen für Unterstützungsdateien, Scannerprüfungen und Schreibvorgängen ausschließlich im Workspace. Die
Einstellung `approvalPolicy: "auto"` gewährt der überprüfenden Hintergrundinstanz keinen Zugriff
auf Lebenszyklusaktionen.

## Erlernte Vorschläge überprüfen

Selbstlernen erzeugt dieselben ausstehenden Vorschläge wie die manuelle Workshop-Nutzung.
Prüfen Sie sie vor der Anwendung:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Überarbeiten, verwerfen oder quarantänisieren Sie Vorschläge, die nützlich, aber noch nicht bereit sind:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Zu spezifisch"
openclaw skills workshop quarantine <proposal-id> --reason "Sicherheitsüberprüfung erforderlich"
```

Die Anwendung ist der einzige Vorgang, der einen aktiven `SKILL.md` schreibt. Siehe
[Skill Workshop](/de/tools/skill-workshop) für das vollständige Lebenszyklus- und Speicher-
modell.

## Konfiguration

| Einstellung                                | Standard | Auswirkung des Selbstlernens                                                                                                      |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Aktiviert die direkte Erfassung von Korrekturen und die verzögerte Erfahrungsüberprüfung.                                         |
| `skills.workshop.approvalPolicy`           | `"auto"` | Steuert Genehmigungsaufforderungen für normale, vom Agenten initiierte Lebenszyklusaktionen; die Berechtigungen der überprüfenden Hintergrundinstanz werden dadurch nicht erweitert. |
| `skills.workshop.maxPending`               | `50`     | Begrenzt ausstehende und unter Quarantäne gestellte Vorschläge pro Workspace.                                                      |
| `skills.workshop.maxSkillBytes`            | `40000`  | Begrenzt die Größe des Vorschlagstextes in Byte.                                                                                   |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Wirkt sich nur auf das Anwendungsverhalten aus; das Selbstlernen selbst schreibt den Vorschlagsstatus, keine aktiven Skill-Ziele. |

Das vollständige Schema, die Wertebereiche und zugehörige Skill-Einstellungen finden Sie unter
[Skills-Konfiguration](/de/tools/skills-config#workshop-skills-workshop).

## Fehlerbehebung

### Nach einem langen Durchlauf erscheint kein Vorschlag

Prüfen Sie alle folgenden Punkte:

1. `skills.workshop.autonomous.enabled` ist in der aktiven Gateway-Konfiguration auf `true` gesetzt.
2. Der Durchlauf war erfolgreich und umfasste nach der neuesten Benutzernachricht mindestens zehn
   Modelliterationen.
3. Die Unterhaltung war ein normaler Vordergrundlauf, kein geplanter Speicher-,
   Hook- oder Subagentenlauf.
4. Der ursprüngliche Lauf hatte Zugriff auf `skill_workshop` und wurde nicht in einer Sandbox ausgeführt.
5. Das System blieb lange genug im Leerlauf, damit die verzögerte Überprüfung ausgeführt werden konnte.
6. Der lang laufende Gateway-Prozess blieb während des Leerlauffensters aktiv; ein
   einmaliger lokaler Befehl wartet nicht auf eine verzögerte Überprüfung.

Eine geeignete Überprüfung erzeugt möglicherweise dennoch keinen Vorschlag. Der Verzicht ist das erwartete
Ergebnis, wenn die Nachweise den Maßstab für ein wiederverwendbares Verfahren nicht erfüllen.

### Doctor meldet, dass das Workshop-Tool ausgeblendet ist

Wenn das Selbstlernen aktiviert ist, prüft `openclaw doctor`, ob die effektive
Tool-Richtlinie des Standardagenten `skill_workshop` zulässt. Nehmen Sie die gemeldete Änderung an
`tools.allow` oder `tools.alsoAllow` vor oder deaktivieren Sie das Selbstlernen.

### Es erscheinen zu viele Vorschläge mit geringem Nutzen

Deaktivieren Sie das Selbstlernen und verwenden Sie weiterhin `/learn` oder ausdrückliche Workshop-Anfragen:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Ausstehende Vorschläge bleiben nach der Deaktivierung der Funktion überprüfbar. Durch das Deaktivieren
des Selbstlernens werden sie weder angewendet noch abgelehnt oder gelöscht.

## Verwandte Themen

- [Skill Workshop](/de/tools/skill-workshop) für Prüfung, Genehmigung und
  Speicherung von Vorschlägen
- [Skills erstellen](/de/tools/creating-skills) für manuell erstellte Skills und
  die Struktur von `SKILL.md`
- [Skills-Konfiguration](/de/tools/skills-config) für alle Einstellungen von `skills.*`
- [Skills-CLI](/de/cli/skills) für Workshop- und Kuratorbefehle
