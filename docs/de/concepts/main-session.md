---
read_when:
    - Sie möchten verstehen, wo Ihr Agent „lebt“
    - Sie erwarten denselben Kontext, unabhängig davon, ob Sie über Telegram, WhatsApp oder das Web schreiben
    - Sie möchten, dass Ihr Agent weiß, was in Gruppen und Neben-Threads passiert.
summary: 'Eine fortlaufende Unterhaltung über alle Ihre Kanäle hinweg: der Standard für persönliche Agenten'
title: Die Hauptsitzung
x-i18n:
    generated_at: "2026-07-24T04:22:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb77382ebdce269a05a03ab6fa39b44b1e9f1856166f1d9cb79111dccb547f69
    source_path: concepts/main-session.md
    workflow: 16
---

OpenClaw ist in erster Linie ein persönlicher Agent. Standardmäßig landet jede Direktnachricht, die Sie ihm senden – über Telegram, WhatsApp, iMessage, Slack-DMs, die Web-App oder von einem beliebigen anderen Ort – in **einer fortlaufenden Unterhaltung**: der Hauptsitzung. Fragen Sie etwas auf Ihrem Smartphone und haken Sie von Ihrem Laptop aus nach; der Agent verfügt an beiden Orten über denselben Kontext. Es gibt ein einziges Gehirn, und hier denkt es.

Im Hintergrund ist die Hauptsitzung eine gewöhnliche Sitzung mit dem Schlüssel
`agent:<agentId>:main` (zum Beispiel `agent:main:main`). Das Besondere an ihr
ist, dass der standardmäßige DM-Geltungsbereich alle Direktnachrichten darin
zusammenführt und das übrige System sie als Wurzel des Agenten behandelt:
Heartbeats aktivieren sie, Hintergrundarbeiten melden ihre Ergebnisse an sie
zurück und Aktivitäten an anderen Stellen fließen zu ihr hinauf.

## Startseite

In der Web-App ist die Hauptsitzung die Seite **Home** – der erste Eintrag in
der Seitenleiste. Die Identitätszeile oben stellt Ihren Agenten dar (klicken
Sie darauf, um das Agentenmenü zu öffnen); auf Home sprechen Sie mit ihm.
Sitzungen, die von der Hauptunterhaltung abzweigen, erscheinen unter
**Threads**, Gruppenchats unter **Groups** und Coding-/CLI-Sitzungen unter
**Coding**.

## Was in die Hauptsitzung einfließt

Die Hauptsitzung ist nicht nur ein Chatprotokoll; sie ist der Ort, an dem die
Welt Ihres Agenten zusammenläuft:

- **Gruppenaktivität.** Gruppen- und Raumsitzungen bleiben isoliert (siehe unten), aber
  beim standardmäßigen DM-Geltungsbereich überwacht die Hauptsitzung sie
  automatisch. Aktivitäten werden als kompakte Hinweise in eine Warteschlange
  gestellt – pro Unterhaltung zusammengefasst, niemals eine Aktivierung pro
  Nachricht – und der Agent sieht sie bei seiner nächsten Ausführung: bei
  Ihrer nächsten Nachricht oder bei einem geplanten Heartbeat. Der Agent kann
  auch die von ihm überwachten Sitzungen lesen, sodass „Was habe ich in der
  Familiengruppe verpasst?“ funktioniert.
- **Hintergrundarbeit.** Unteragenten und erzeugte Sitzungen melden ihre Ergebnisse
  an die Sitzung zurück, die sie gestartet hat. Arbeiten, die der Agent von
  Home aus angestoßen hat, werden daher an Home zurückgemeldet.
- **Heartbeats.** Geplante Heartbeats zielen auf die Hauptsitzung ab. Dadurch
  werden Hinweise in der Warteschlange auch dann wahrgenommen, wenn Sie nichts
  geschrieben haben.

## Gedächtnis über Zurücksetzungen und Unterhaltungen hinweg

Die fortlaufende Unterhaltung ist durch das Kontextfenster des Modells
begrenzt. Kontinuität entsteht daher durch die sie umgebenden Ebenen:

- `MEMORY.md`, das kuratierte Langzeitgedächtnis des Agenten, wird in jede
  neue Sitzung geladen. Tagesnotizen (`memory/YYYY-MM-DD.md`) können bei Bedarf
  durchsucht werden, und aktuelle Notizen werden nach einem `/new` oder
  `/reset` erneut in den Kontext geladen. Vor der Compaction schreibt der
  Agent dauerhaft relevante Fakten in die Tagesnotizen, damit sie bei langen
  Unterhaltungen nicht unbemerkt verloren gehen.
- **Gedächtnisabruf über Unterhaltungen hinweg** ermöglicht dem Agenten, Inhalte
  aus seinen anderen privaten Sitzungen abzurufen. In persönlichen
  Konfigurationen – wenn das globale `session.dmScope` zu `main` aufgelöst
  wird und keine DM-Überschreibungen pro Bindung vorliegen – ist dies
  standardmäßig aktiviert. Jede konfigurierte DM-Isolierung deaktiviert diese
  Funktion, sofern Sie sie nicht ausdrücklich aktivieren. Siehe
  [Gedächtniskonfiguration](/de/reference/memory-config).

## Eine fortlaufende Sitzung mit dauerhaftem Verlauf

Die Hauptsitzung wird über Zurücksetzungen und Compaction hinweg fortgeführt,
statt das Modell den gesamten Verlauf auf einmal verarbeiten zu lassen:

- Standardmäßig erfolgt keine automatische Zurücksetzung. Compaction begrenzt
  den aktiven Kontext und bewahrt zugleich die fortlaufende Sitzung. Tägliche
  und inaktivitätsbedingte Zurücksetzungen müssen ausdrücklich aktiviert
  werden (siehe [Sitzungsverwaltung](/de/concepts/session)). Bei `/new`
  und `/reset` wird das Ende der abgeschlossenen Unterhaltung in
  Tagesnotizen gespeichert, und die nächste Sitzung lädt aktuelle Notizen
  erneut in den Kontext. Eine Zurücksetzung weist eine neue ID für die aktive
  Sitzung zu, lässt das vorherige SQLite-Transkript jedoch weiterhin unter
  demselben Hauptsitzungsschlüssel durchsuchbar.
- Wenn sich die Unterhaltung der Grenze des Kontextfensters nähert, fasst
  Compaction sie zusammen und setzt sie an Ort und Stelle fort – der
  Transkriptverlauf verbleibt im Sitzungsspeicher.
- Sitzungslisten zeigen die aktuelle aktive Unterhaltung und nicht jede
  historische Sitzungs-ID, die dahintersteht.
- Wenn die physische Datenbank, das WAL und die Sitzungsartefakte des
  agentenspezifischen Speichers das Speicherplatzbudget überschreiten
  (standardmäßig 10 GB), extrahiert OpenClaw den ältesten nicht referenzierten
  Verlauf in ein verifiziertes komprimiertes Archiv, bevor die entsprechenden
  Datenbankzeilen entfernt werden. Aktive, weitergeleitete und gerade
  verarbeitete Sitzungen werden niemals aufgrund des Budgets entfernt.

## Wenn Sie stattdessen Isolierung wünschen

Die gemeinsam genutzte Hauptsitzung ist die richtige Standardeinstellung für
einen Agenten, mit dem nur Sie kommunizieren. Wenn mehrere Personen Ihrem
Agenten Nachrichten senden können, isolieren Sie die DMs:

```json5
{
  session: {
    dmScope: "per-channel-peer",
  },
}
```

Bei einem isolierenden Geltungsbereich erhält jeder Absender eine eigene
Sitzung, die Gruppenüberwachung durch die Hauptsitzung ist deaktiviert und der
sitzungsübergreifende Gedächtnisabruf ist standardmäßig ausgeschaltet.
`openclaw security audit` empfiehlt eine Isolierung, wenn mehrere DM-Absender erkannt
werden. Die vollständige Geltungsbereichsmatrix, die Identitätsverknüpfung und
Überschreibungen pro Route werden unter
[Sitzungsverwaltung](/de/concepts/session) und
[Channel-Routing](/de/channels/channel-routing) behandelt.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session) – Routing, Geltungsbereiche, Zurücksetzungen
- [Channel-Routing](/de/channels/channel-routing) – Auswahl von Agenten und Sitzungen
- [Gedächtnis](/de/concepts/memory) – dauerhafte Gedächtnisebenen
- [Multi-Agent](/de/concepts/multi-agent) – Ausführung mehrerer isolierter Agenten
