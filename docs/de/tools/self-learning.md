---
read_when:
    - Sie möchten, dass OpenClaw wiederverwendbare Abläufe aus abgeschlossenen Unterhaltungen lernt
    - Sie entscheiden, ob autonome Skill-Vorschläge aktiviert werden sollen
    - Sie müssen Sicherheit, Kosten, Voraussetzungen oder Fehlerbehebung beim selbstständigen Lernen verstehen
sidebarTitle: Self-learning
summary: Lassen Sie OpenClaw aus Korrekturen und umfangreichen abgeschlossenen Arbeiten wiederverwendbare Skills vorschlagen
title: Selbstlernend
x-i18n:
    generated_at: "2026-07-24T05:21:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Selbstlernen ermöglicht es OpenClaw, nützliche Erkenntnisse aus Unterhaltungen in ausstehende
[Skill-Workshop](/de/tools/skill-workshop)-Vorschläge umzuwandeln. Dabei werden weder Modellgewichte
trainiert noch aktive Skills bearbeitet oder das Agentenverhalten unbemerkt geändert. Jedes erlernte
Verfahren bleibt ausstehend, bis es von einer Bedienperson geprüft und angewendet wird.

Selbstlernen ist **standardmäßig deaktiviert**. Aktivieren Sie es nur, wenn ein zusätzlicher
Modelllauf im Hintergrund und eine Überprüfung des Transkripts für Ihren Arbeitsbereich angemessen sind.

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

## Frühere Sitzungen manuell prüfen

Die manuelle Überprüfung des Verlaufs ist die konservative Alternative zur autonomen Erfassung.
Öffnen Sie **Plugins → Workshop** in der Control UI und wählen Sie **Skill-Ideen finden**.
Dadurch wird `skills.workshop.autonomous.enabled` nicht geändert.

Jeder Scan:

- beginnt mit den neuesten ungeprüften Sitzungen und arbeitet sich rückwärts vor;
- prüft bis zu 20 umfangreiche Sitzungen mit mindestens sechs Modelldurchläufen;
- überspringt Cron-, Heartbeat-, Hook-, Subagent-, ACP-, Plugin-eigene und interne Prüfungs-
  sitzungen;
- schwärzt erkannte Geheimnisse und begrenzt das Transkriptpaket, bevor es
  an das konfigurierte Modell des ausgewählten Agenten gesendet wird;
- wendet dieselben strengen Maßstäbe wie die autonome Erfahrungsprüfung an; und
- kann höchstens drei ausstehende Vorschläge erstellen oder überarbeiten, niemals aktive Skills.

Der Workshop meldet die kumulative Sitzungsanzahl, den abgedeckten Zeitraum und die gefundenen Ideen.
Wählen Sie **Frühere Arbeit scannen** für das nächste ältere Zeitfenster. Wenn der Cursor den
Anfang des geeigneten Verlaufs erreicht, ändert sich die Aktion zu **Neue Arbeit scannen**.
OpenClaw speichert nur Cursor- und Abdeckungsmetadaten in der gemeinsamen Zustandsdatenbank;
es erstellt kein zweites Transkriptarchiv.

Sitzungen werden nur gescannt, wenn OpenClaw ihre Eigentümerschaft nachweisen und
Inhalte externer Hooks ausschließen kann. Nach einem Upgrade kann das aktuelle Transkript von vor dem Upgrade
lokal klassifiziert werden, aber rotierte Transkripte von vor dem Upgrade ohne Herkunftsnachweis
pro Lauf werden übersprungen. Neue Transkripte behalten diesen Herkunftsnachweis auch nach der Rotation.

Manuelle Scans verursachen weiterhin Kosten beim Modell-Provider und senden geeignete Unterhaltungs-
inhalte an den konfigurierten Provider. Verwenden Sie sie nur, wenn diese Prüfung den
Datenschutz- und Datenverarbeitungsanforderungen des Arbeitsbereichs entspricht.

## Was OpenClaw lernen kann

Das Selbstlernen umfasst zwei konservative Wege:

1. **Direkte Anweisungen und Korrekturen.** OpenClaw erkennt dauerhafte Formulierungen
   wie „von nun an“, „beim nächsten Mal“ sowie Korrekturen eines fehlgeschlagenen Ansatzes.
   Wenn das Selbstlernen aktiviert ist, kann es diese Signale in ausstehende Vorschläge
   umwandeln, ohne auf eine weitere Eingabeaufforderung zu warten. Dieser deterministische Weg kann zusammengehörige
   Anweisungen in bis zu drei Vorschlägen gruppieren, einen beschreibbaren Arbeitsbereichs-Skill adressieren
   oder einen eigenen zugehörigen ausstehenden Vorschlag überarbeiten. Er wird auch nach fehlgeschlagenen Durchläufen
   ausgeführt, da er die Anweisungen des Benutzers erfasst, statt den Abschluss zu bewerten.
2. **Erfahrungsprüfung.** Nach einem erfolgreichen, umfangreichen Vordergrunddurchlauf
   kann OpenClaw die abgeschlossene Arbeit auf eine wiederverwendbare Wiederherstellungstechnik oder
   ein stabiles Verfahren prüfen, das künftig mindestens zwei Modell- oder Werkzeug-
   hin- und Rückläufe vermeiden würde.

Geeignete Kandidaten sind unter anderem:

- eine zuverlässige Wiederherstellung nach wiederholten Werkzeug- oder Modellfehlern;
- eine nicht offensichtliche Reihenfolgebedingung, die einen wiederkehrenden Fehler verhindert hat;
- ein stabiler mehrstufiger Arbeitsablauf, der wiederholte Erkundung erforderte; oder
- eine wiederverwendbare Vorabprüfung, die mehrere zukünftige Aufrufe vermeiden würde.

Die Prüfung sollte bei routinemäßig erfolgreicher Arbeit, einmaligen Anfragen,
persönlichen Fakten, einfachen Präferenzen, vorübergehenden Umgebungsfehlern, allgemeinen
Ratschlägen, unbelegten negativen Behauptungen und Geheimnissen von einem Vorschlag absehen.

## Wann die Erfahrungsprüfung ausgeführt wird

Die Erfahrungsprüfung wird bewusst verzögert und begrenzt:

- Der Vordergrunddurchlauf muss erfolgreich abgeschlossen werden.
- Der aktuelle Durchlauf muss mindestens zehn Modelliterationen enthalten.
- Cron-, Heartbeat-, Speicher-, Überlauf-, Hook-, Subagent- und Prüfungssitzungen sind
  ausgeschlossen.
- Für den Vordergrundlauf müssen ein Provider und ein Modell aufgelöst worden sein und er muss tatsächlich
  Zugriff auf `skill_workshop` gehabt haben.
- OpenClaw wartet nach Abschluss 30 Sekunden. Ein späterer Vordergrundabschluss in
  derselben Sitzung startet diese Ruhephase erneut.
- Wenn noch ein Agenten- oder Antwortlauf aktiv ist, wartet die Prüfung weitere 30 Sekunden.
- Es wird jeweils nur eine Erfahrungsprüfung ausgeführt.
- Die verzögerte Prüfung ist prozesslokale Gateway-Arbeit. Der Gateway muss während
  des Leerlauffensters weiterlaufen; einmalige lokale und CLI-gestützte Laufzeitumgebungen bewahren
  nicht genügend Kontext zu Verlauf und Werkzeugverfügbarkeit auf, um sie einzuplanen.

Die Antwort im Vordergrund wird niemals durch das Lernen verzögert. Ein fehlgeschlagener oder ungeeigneter
Durchlauf startet keine Erfahrungsprüfung, direkte Benutzerkorrekturen können jedoch
weiterhin als Vorschlag angeboten werden, wenn die Autonomie deaktiviert ist.

## Was die Prüfung erhält

Die Hintergrundprüfung erhält nur den aktuellen Durchlauf, beginnend mit dessen
neuester Benutzernachricht. Der gerenderte Verlauf ist auf 60,000 Zeichen begrenzt;
falls erforderlich, behält OpenClaw die erste Nachricht und die neuesten Erkenntnisse bei und
kennzeichnet den ausgelassenen Mittelteil.

Die Prüfung verwendet den aufgelösten Provider und das aufgelöste Modell erneut. Sie verwendet das Authentifizierungsprofil
des Vordergrundlaufs erneut, wenn diese Identität verfügbar ist, und deaktiviert Modell-Fallbacks. Die
Prüfung startet daher einen zusätzlichen Modelllauf beim konfigurierten Provider.
Dieser Lauf kann mehr als eine Provider-Anfrage stellen, wenn er einen
Vorschlag untersucht oder entwirft. Die Preis- und Datenverarbeitungsbedingungen des Providers gelten genauso wie für den
Vordergrunddurchlauf.

Vor dem Start lädt OpenClaw die aktuelle Laufzeitkonfiguration neu und prüft erneut die
wirksame Sandbox- und Werkzeugrichtlinie für die ursprüngliche Unterhaltung. Wenn der Lauf in einer
Sandbox ausgeführt wird, die Richtlinie `skill_workshop` nicht mehr zulässt oder erforderliche Laufzeitfakten
fehlen, schlägt die Prüfung sicher geschlossen fehl und erstellt nichts.

<Warning>
  Das Aktivieren des Selbstlernens erlaubt, geeignete Unterhaltungsinhalte einschließlich Werkzeug-
  eingaben und -ergebnissen des aktuellen Durchlaufs für eine zusätzliche Prüfung an den ausgewählten Modell-
  Provider zu senden. Aktivieren Sie es nicht in einem Arbeitsbereich, in dem
  diese Prüfung gegen Anforderungen an die Datenverarbeitung verstoßen würde.
</Warning>

## Sicherheit von Vorschlägen

Die Prüfung wird in einer isolierten Sitzung mit einer bewusst eingeschränkten Werkzeug-
oberfläche ausgeführt:

- Sie kann nur Workshop-Vorschläge auflisten oder untersuchen und einen
  ausstehenden Vorschlag erstellen oder überarbeiten.
- Sie kann keinen aktiven Skill aktualisieren, einen Vorschlag anwenden, ablehnen oder unter Quarantäne stellen,
  keine Nachricht senden und keine allgemeinen Agentenwerkzeuge verwenden.
- Ein Mutationsbudget wird von allen Modellwiederholungen gemeinsam genutzt, sodass eine Prüfung höchstens
  einen Vorschlag erstellen oder überarbeiten kann.
- Der geprüfte Verlauf wird als nicht vertrauenswürdiger Nachweis behandelt, nicht als Anweisungen
  für den Hintergrundagenten.
- Der Skill Workshop scannt Vorschlagsinhalte und lehnt erkannte Klartext-
  Zugangsdaten ab, bevor der Vorschlagsstatus geschrieben wird.

Die normalen Workshop-Grenzwerte gelten weiterhin, einschließlich `maxPending`, `maxSkillBytes`,
Einschränkungen für Unterstützungsdateien, Scannerprüfungen und Schreibvorgängen ausschließlich im Arbeitsbereich. Die
Einstellung `approvalPolicy: "auto"` gewährt der Hintergrundprüfung keinen Zugriff
auf Lebenszyklusaktionen.

## Erlernte Vorschläge prüfen

Das Selbstlernen erzeugt dieselben ausstehenden Vorschläge wie die manuelle Verwendung des Workshops.
Prüfen Sie sie vor der Anwendung:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Überarbeiten, verwerfen oder isolieren Sie Vorschläge, die nützlich, aber noch nicht bereit sind:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Zu spezifisch"
openclaw skills workshop quarantine <proposal-id> --reason "Sicherheitsprüfung erforderlich"
```

Das Anwenden ist der einzige Vorgang, der einen aktiven `SKILL.md` schreibt. Siehe
[Skill Workshop](/de/tools/skill-workshop) für das vollständige Lebenszyklus- und Speicher-
modell.

## Konfiguration

| Einstellung                                | Standard | Auswirkung auf das Selbstlernen                                                                                                  |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Aktiviert die Erfassung direkter Korrekturen und die verzögerte Erfahrungsprüfung.                                                 |
| `skills.workshop.approvalPolicy`           | `"auto"` | Steuert Genehmigungsaufforderungen für normale, vom Agenten initiierte Lebenszyklusaktionen; erweitert nicht die Berechtigungen der Hintergrundprüfung. |
| `skills.workshop.maxPending`               | `50`     | Begrenzt ausstehende und unter Quarantäne gestellte Vorschläge pro Arbeitsbereich.                                                 |
| `skills.workshop.maxSkillBytes`            | `40000`  | Begrenzt die Größe des Vorschlagstexts in Byte.                                                                                    |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Wirkt sich nur auf das Anwendungsverhalten aus; das Selbstlernen selbst schreibt den Vorschlagsstatus, keine aktiven Skill-Ziele.  |

Das vollständige Schema, Wertebereiche und zugehörige Skill-Einstellungen finden Sie unter
[Skills-Konfiguration](/de/tools/skills-config#workshop-skills-workshop).

## Fehlerbehebung

### Nach einem langen Durchlauf erscheint kein Vorschlag

Prüfen Sie alle folgenden Punkte:

1. `skills.workshop.autonomous.enabled` ist in der aktiven Gateway-Konfiguration auf `true` gesetzt.
2. Der Durchlauf war erfolgreich und umfasste nach der neuesten
   Benutzernachricht mindestens zehn Modelliterationen.
3. Die Unterhaltung war ein normaler Vordergrundlauf, kein geplanter, Speicher-,
   Hook- oder Subagent-Lauf.
4. Der ursprüngliche Lauf hatte Zugriff auf `skill_workshop` und wurde nicht in einer Sandbox ausgeführt.
5. Das System blieb lange genug inaktiv, damit die verzögerte Prüfung stattfinden konnte.
6. Der lang laufende Gateway-Prozess blieb während des Leerlauffensters aktiv; ein
   einmaliger lokaler Befehl wartet nicht auf die verzögerte Prüfung.

Auch eine geeignete Prüfung erzeugt möglicherweise keinen Vorschlag. Ein Verzicht ist das erwartete
Ergebnis, wenn die Erkenntnisse die Anforderungen an ein wiederverwendbares Verfahren nicht erfüllen.

### Doctor meldet, dass das Workshop-Werkzeug ausgeblendet ist

Wenn das Selbstlernen aktiviert ist, prüft `openclaw doctor`, ob die wirksame
Werkzeugrichtlinie des Standardagenten `skill_workshop` zulässt. Nehmen Sie die gemeldete Änderung an
`tools.allow` oder `tools.alsoAllow` vor oder deaktivieren Sie das Selbstlernen.

### Es erscheinen zu viele Vorschläge mit geringem Nutzen

Deaktivieren Sie das Selbstlernen und verwenden Sie weiterhin `/learn` oder ausdrückliche Workshop-Anfragen:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Ausstehende Vorschläge können auch nach der Deaktivierung der Funktion weiterhin geprüft werden. Das Deaktivieren
des Selbstlernens wendet sie nicht an, lehnt sie nicht ab und löscht sie nicht.

## Verwandte Themen

- [Skill Workshop](/de/tools/skill-workshop) zur Prüfung, Genehmigung und
  Speicherung von Vorschlägen
- [Skills erstellen](/de/tools/creating-skills) für manuell erstellte Skills und die
  Struktur von `SKILL.md`
- [Skills-Konfiguration](/de/tools/skills-config) für alle Einstellungen von `skills.*`
- [Skills-CLI](/de/cli/skills) für Workshop- und Kuratorbefehle
