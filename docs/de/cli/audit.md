---
read_when:
    - Sie müssen beantworten, wer einen Agenten oder ein Tool ausgeführt hat, wann die Ausführung stattfand und wie sie endete.
    - Sie benötigen inhaltsfreie Metadaten zum Lebenszyklus eingehender oder ausgehender Nachrichten
    - Sie benötigen einen begrenzten, redaktionssicheren Aktivitätsexport
summary: CLI-Referenz für reine Metadaten-Audit-Datensätze zum Lebenszyklus von Ausführungen, Tools und Nachrichten
title: Auditdatensätze
x-i18n:
    generated_at: "2026-07-24T04:17:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Fragen Sie das reine Metadaten-Audit-Ledger des Gateways nach Agent-Ausführungen, Tool-Aktionen und
optional aktivierten Datensätzen zum Nachrichtenlebenszyklus ab.

Das Ledger ist für Ausführungs- und Tool-Ereignisse standardmäßig aktiviert. Legen Sie
[`audit.enabled: false`](/de/gateway/configuration-reference#audit) fest und starten Sie das
Gateway neu, um die Erfassung aller neuen Ereignisdatensätze zu beenden. Nachrichtendatensätze sind separat
standardmäßig deaktiviert; legen Sie `audit.messages` auf `direct` oder `all` fest und starten Sie das Gateway neu, um
sie aufzuzeichnen. Vorhandene Datensätze bleiben bis zu ihrem Ablauf (30 Tage) abfragbar.

Das Ledger ist von Gesprächstranskripten getrennt: Es erfasst Identität,
Reihenfolge, Herkunft, Aktion, Status und normalisierte Ergebniscodes, speichert jedoch niemals
Inhalte, und Nachrichtenkennungen erscheinen nur als installationslokale
verschlüsselte Pseudonyme. Der [Audit-Verlauf](/de/gateway/audit) beschreibt das vollständige Datenmodell,
die Datenschutzsemantik, Speicher- und Aufbewahrungsgrenzen sowie Abdeckungsbeschränkungen; diese Seite
behandelt die Befehlsoberfläche.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filter

- `--agent <id>`: exakte Agent-ID
- `--session <key>`: exakter Sitzungsschlüssel
- `--run <id>`: exakte Ausführungs-ID
- `--kind <kind>`: `agent_run`, `tool_action` oder `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` oder `unknown`
- `--direction <direction>`: Nachrichtenrichtung, `inbound` oder `outbound`
- `--channel <channel>`: exakter Nachrichtenkanal
- `--after <timestamp>` / `--before <timestamp>`: inklusiver ISO-Zeitstempel oder
  Unix-Millisekunden
- `--limit <count>`: Seitengröße von 1 bis 500; Standardwert `100`
- `--cursor <sequence>`: eine vorherige Abfrage in absteigender Reihenfolge fortsetzen
- `--json`: die begrenzte Seite als JSON ausgeben

Die CLI fragt den versionierten Aktivitäts-RPC ab, sodass ein Befehl das vollständige
konfigurierte Ledger anzeigt. Die Textausgabe zeigt Zeit, Art, Richtung, Kanal, Status,
Agent, Ausführung und Aktion. Fehlende Nachrichtenherkunft wird als `-` dargestellt; OpenClaw
erfindet keine Agent- oder Ausführungs-IDs. Tool-Aktionen zeigen außerdem den Tool-Namen. Die JSON-
Ausgabe enthält `nextCursor`, wenn eine weitere Seite vorhanden ist. Übergeben Sie diesen Wert an
`--cursor`, um fortzufahren, ohne Datensätze neu zu ordnen, die während der Seitennavigation eintreffen.

Diese Exporte bleiben sensible betriebliche Metadaten, obwohl Nachrichteninhalte
und unverarbeitete Nachrichtenidentitätsfelder fehlen. Agent-, Sitzungs- und Ausführungs-IDs, Zeitangaben,
Kanäle, Ergebnisse und stabile HMAC-Referenzen können Aktivitäten miteinander verknüpfen. Schützen Sie
sie mit denselben Zugriffskontrollen und Aufbewahrungsverfahren wie andere
Betriebsdatensätze.

## Aufgezeichnete Ereignisse

Das Gateway überführt vertrauenswürdige Lebenszyklus-Datenströme in sechs Aktionen:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Jeder zurückgegebene Datensatz besitzt eine stabile Ereignis-ID, eine monoton steigende Ledger-
Sequenz, einen Lebenszyklus-Zeitstempel, einen Akteur, eine Aktion, einen Status, eine
`schemaVersion: 1`-Markierung, eine Quellsequenz und `redaction: "metadata_only"`.
Herkunftsangaben zu Agent, Sitzung und Ausführung sowie ereignisspezifische Felder sind nur vorhanden, wenn
die vertrauenswürdige Quelle sie bereitstellt. Nachrichtendatensätze lassen
`sessionKey` und `sessionId` absichtlich aus, sodass `--session`-Filter nur Ausführungs- und Tool-Datensätze erfassen.

Abschließende Ausführungs- und Tool-Datensätze unterscheiden Erfolg, Fehler, Abbruch,
Zeitüberschreitung und Richtlinienblockierungen anhand geschlossener Status- und Fehlercodes. `unknown` ist ein
explizites nicht erfolgreiches Ergebnis, wenn eine vorgelagerte Laufzeitumgebung kein
maßgebliches abschließendes Ergebnis bereitstellt. Tool-Aufruf-IDs werden nur als stabile
Fingerabdrücke exportiert. Tool-Namen müssen dem Vertrag für kompakte, dem Modell angezeigte Namen
entsprechen; andere Werte werden zu `unknown`.

Nachrichtendatensätze ergänzen Richtung, Kanal, Gesprächsart, Ergebnis und
optional Zustellungsart, Fehlerphase, Dauer, Ergebnisanzahl, normalisierten
Ursachencode und verschlüsselte Konto-, Gesprächs-, Nachrichten- und Zielpseudonyme. Die
aktuelle Eingangsgrenze umfasst akzeptierte Nachrichten, die die zentrale Weiterleitung erreichen,
einschließlich zentraler Duplikat- und abschließender Verarbeitungsergebnisse. Die Ausgangsgrenze
schreibt eine abschließende Zeile pro ursprünglicher logischer Antwortnutzlast, die die
gemeinsame dauerhafte Zustellung erreicht; Aufteilung und Adapter-Auffächerung werden in
`resultCount` zusammengefasst. Wiederholbare oder mehrdeutige Sendungen in der Warteschlange werden erst aufgezeichnet, nachdem eine
Bestätigung, Unzustellbarkeitsablage oder Abstimmung das Ergebnis abschließend macht.
Plugin-lokale und direkte Sendepfade, die diese gemeinsamen Grenzen umgehen, werden noch
nicht abgedeckt; das Fehlen einer Zeile beweist nicht, dass keine Nachricht existierte.

Das Audit-Ledger ersetzt weder Transkripte, Aufgabenverlauf, Cron-Ausführungsverlauf
noch Protokolle. Es stellt einen kleinen ausführungsübergreifenden Index für betriebliche Abfragen bereit, ohne
Gesprächsinhalte in einen weiteren Speicher zu kopieren.

Bei Eingangszeilen misst `durationMs` die zentrale Weiterleitung, und `resultCount` zählt
abgeschlossene Tool-, Blockierungs- und Antwortnutzlasten in der Warteschlange. Bei Ausgangszeilen
umfasst `durationMs` die Zustellungsverantwortung bis zu ihrem Abschluss (und damit
die Wartezeit in der Warteschlange), während `resultCount` identifizierte physische Sendungen an die Plattform
zählt. `deliveryKind` beschreibt, sofern vorhanden, die effektive Nutzlast nach Hooks und
Rendering; unterdrückte und durch Abstürze mehrdeutige Zeilen lassen dieses Feld aus.

## Gateway-RPC

`audit.activity.list` erfordert `operator.read` und akzeptiert dieselben Filter. Er
gibt die benannte V1-Union der Aktivitätsereignisse zurück, einschließlich Ausführungs-, Tool-, Eingangs- und
Ausgangsnachrichtendatensätzen.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Das Ergebnis ist `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Die Ergebnisse sind nach dem neuesten Eintrag zuerst sortiert und auf 500 Datensätze pro Anfrage begrenzt.

Der ausgelieferte `audit.list`-RPC bleibt für ältere Ausführungs-/Tool-Clients unverändert. Wenn
`audit.activity.list` auf einem älteren Gateway nicht verfügbar ist, versucht die CLI
`audit.list` nur dann erneut, wenn jeder angeforderte Filter von dieser älteren Methode unterstützt wird. `--kind message`,
`--direction` und `--channel` schlagen auf einem älteren Gateway mit einer Aufforderung zum Upgrade fehl,
anstatt stillschweigend verworfen zu werden.

## Verwandte Themen

- [Audit-Verlauf](/de/gateway/audit)
- [Gateway-Protokoll](/de/gateway/protocol#audit-ledger-rpc)
- [Sitzungen](/de/cli/sessions)
- [Aufgaben](/de/cli/tasks)
- [Cron-Aufgaben](/de/automation/cron-jobs)
