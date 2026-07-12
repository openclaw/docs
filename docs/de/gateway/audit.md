---
read_when:
    - Sie benötigen eine dauerhafte Aufzeichnung der Gateway-Aktivitäten, ohne Inhalte zu speichern.
    - Sie entscheiden, ob Sie die Überwachung des Nachrichtenlebenszyklus aktivieren möchten
    - Sie müssen erläutern, was Auditaufzeichnungen belegen und was nicht.
summary: Reine Metadaten-Prüfhistorie für Agentenläufe, Tool-Aktionen und optionale Nachrichtenlebenszyklen
title: Prüfverlauf
x-i18n:
    generated_at: "2026-07-12T15:21:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Auditverlauf

Der Gateway führt in der gemeinsam genutzten OpenClaw-Zustandsdatenbank ein größenbegrenztes Audit-Ledger, das ausschließlich Metadaten enthält. Es beantwortet betriebliche Fragen wie „Welcher Agent wurde wann ausgeführt und wie wurde die Ausführung beendet?“, „Welche Tool-Aktionen führte eine Ausführung aus?“ und bei aktivierter Nachrichtenüberwachung „Hat eine akzeptierte eingehende Nachricht die Weiterleitung erreicht?“ sowie „Hat eine ausgehende Nachricht einen endgültigen Zustellungsstatus erreicht?“.

Das Ledger speichert Identität, Reihenfolge, Herkunft, Aktion, Status und normalisierte Ergebniscodes. Es speichert niemals Prompts, Nachrichteninhalte, Tool-Argumente, Tool-Ergebnisse, Anhänge, Dateinamen, URLs, Befehlsausgaben oder unbereinigten Fehlertext.

## Datensatzfamilien

Ausführungs- und Tool-Ereignisse werden immer aufgezeichnet, wenn die Überwachung aktiviert ist (Standardeinstellung). Ereignisse im Nachrichtenlebenszyklus sind optional und standardmäßig deaktiviert.

| Familie           | Aktionen                                                 | Standardmäßig |
| ----------------- | -------------------------------------------------------- | ------------- |
| Agent-Ausführungen | `agent.run.started`, `agent.run.finished`                | ein           |
| Tool-Aktionen      | `tool.action.started`, `tool.action.finished`            | ein           |
| Nachrichten        | `message.inbound.processed`, `message.outbound.finished` | aus           |

Jeder Datensatz enthält eine stabile Ereignis-ID, eine monoton steigende Ledger-Sequenz, einen Lebenszyklus-Zeitstempel, Akteur, Aktion, Status, `schemaVersion: 1` und `redaction: "metadata_only"`. Die vollständige Feldreferenz und die Abfragefilter finden Sie unter [Auditdatensätze](/de/cli/audit).

## Ereignisse im Nachrichtenlebenszyklus

Legen Sie mit [`audit.messages`](/de/gateway/configuration-reference#audit) fest, was aufgezeichnet wird, und starten Sie anschließend den Gateway neu:

- `off` (Standard): keine Nachrichtendatensätze.
- `direct`: nur Nachrichten in Direktunterhaltungen.
- `all`: Direkt-, Gruppen- und Kanalnachrichten.

Zwei maßgebliche Grenzen erzeugen Nachrichtendatensätze:

- **Eingehende** Zeilen werden geschrieben, wenn eine akzeptierte Nachricht die zentrale Weiterleitung erreicht, einschließlich doppelter Nachrichten und endgültiger Verarbeitungsergebnisse.
- **Ausgehende** Zeilen werden geschrieben, wenn die gemeinsam genutzte dauerhafte Zustellung ein endgültiges Ergebnis erreicht: gesendet, unterdrückt, fehlgeschlagen oder bei nach einem Absturz nicht eindeutigem Versand ausdrücklich `unknown`. Ergebnisse der Warteschlangenwiederherstellung und der Dead-Letter-Verarbeitung sind eingeschlossen. Jede ursprüngliche logische Antwortnutzlast erhält eine endgültige Zeile; Aufteilung in Blöcke und Adapter-Fan-out werden in `resultCount` zusammengefasst.

### Klassifizierung der Unterhaltungsart

Der Modus `direct` stellt eine Datenschutzgrenze dar. Daher wird eine Nachricht nur dann als Direktunterhaltung klassifiziert, wenn Zielinformationen dies belegen: Der sendende Pfad hat die Art der Zielunterhaltung angegeben oder die Zustellungs-Sitzungsroute benennt genau den Kanal und den Peer, an den zugestellt wird. Schwächere Signale, etwa der Richtlinienstatus oder die ursprüngliche Unterhaltung, können eine Nachricht als `group` klassifizieren (wodurch sie von der Erfassung im Modus `direct` ausgeschlossen wird), dürfen sie jedoch niemals als `direct` einstufen. Nachrichten, deren direkter Charakter nicht nachgewiesen werden kann, werden als `unknown` klassifiziert und im Modus `direct` nicht aufgezeichnet. Kanäle, die keine Chattypen angeben, können daher im Modus `direct` weniger Zeilen aufzeichnen als im Modus `all`.

## Datenschutzmodell

Nachrichtenzeilen speichern niemals unbereinigte Plattformkennungen. Konto-, Unterhaltungs-, Nachrichten- und Zielkennungen werden, sofern eine Korrelation möglich ist, ausschließlich als installationslokale, schlüsselbasierte Pseudonyme exportiert (`hmac-sha256:v1:<keyId>:<digest>`):

- Der HMAC-Schlüssel wird bei der ersten Verwendung erzeugt, nach Kennungsart domänengetrennt und in derselben Zustandsdatenbank wie das Ledger gespeichert.
- Pseudonyme sind innerhalb einer Installation stabil, sodass Zeilen derselben Unterhaltung korreliert werden können, ohne die Plattformkennung offenzulegen.
- Dies ist **Korrelation, keine Anonymisierung**: Wer Lesezugriff auf die Zustandsdatenbank hat, verfügt auch über den Schlüssel und kann mögliche unbereinigte Kennungen mit den Pseudonymen abgleichen. RPC- und CLI-Exporte enthalten den Schlüssel niemals.
- Wenn das Schlüsselmaterial fehlt oder beschädigt ist, während Nachrichtenzeilen aufbewahrt werden, verweigert der Gateway die weitere Verarbeitung und verwirft neue Nachrichtendatensätze, statt stillschweigend zu einem neuen Schlüssel zu wechseln, was die Korrelation aufspalten würde.

Ausführungs- und Tool-Datensätze behalten `sessionKey` und `sessionId` zur Korrelation bei; kanonische Sitzungsschlüssel können selbst Plattformkonto- oder Peer-IDs enthalten. Nachrichtendatensätze lassen beide bewusst weg.

Auditexporte bleiben auch ohne Inhalte sensible betriebliche Metadaten: Zeitpunkte, Kanäle, Ergebnisse und stabile Pseudonyme können Aktivitäten korrelieren. Schützen Sie Exporte mit denselben Zugriffskontrollen und Aufbewahrungsverfahren wie andere Betreiberaufzeichnungen.

## Abdeckung und Beweisgrenzen

Das Ledger arbeitet nach bestem Bemühen und ist bewusst begrenzt. Betrachten Sie es als Nachweis dessen, was aufgezeichnet wurde, nicht als Beweis dessen, was geschehen ist:

- **Das Fehlen einer Zeile beweist nichts.** Vor der Annahme verworfene eingehende Nachrichten, Sendevorgänge aus CLI-Prozessen ohne laufenden Gateway-Aufzeichnungsdienst sowie Plugin-lokale oder direkte Sendepfade, die die gemeinsam genutzte dauerhafte Zustellung umgehen, hinterlassen keinen Datensatz.
- Schreibvorgänge werden über einen begrenzten Hintergrund-Worker ausgeführt; ein Worker-Ausfall oder eine Überlastung der Warteschlange führt dazu, dass Datensätze verworfen werden und eine betriebliche Warnung protokolliert wird.
- Nach einem Absturz nicht eindeutig bestimmbare ausgehende Sendevorgänge werden als `unknown` aufgezeichnet, statt Ergebnisse zu erfinden.

Dieses Ledger unterstützt die Fehlersuche und die betriebliche Überprüfung. Es ist kein verlustfreies Compliance-Archiv. Wenn Sie ein solches benötigen, verwenden Sie ein externes System, das durch [OpenTelemetry](/de/gateway/opentelemetry) oder Werkzeuge auf Kanalebene gespeist wird.

## Speicherung, Aufbewahrung und Migration

Datensätze befinden sich in der gemeinsam genutzten Zustandsdatenbank (`state/openclaw.sqlite`) und werden außerhalb des zeitkritischen Zustellungspfads geschrieben. Abfragen geben niemals Datensätze zurück, die älter als 30 Tage sind, und das Ledger ist auf 100,000 Zeilen begrenzt; abgelaufene Zeilen werden beim Start, während der stündlichen Wartung und bei späteren Schreibvorgängen entfernt. Die Aufbewahrungswartung läuft auch dann weiter, wenn die Erfassung deaktiviert ist.

Beim Upgrade von einem Gateway mit dem früheren Ledger, das nur Ausführungen und Tools erfasste, wird das Schema beim Start (oder über `openclaw doctor --fix`) automatisch migriert; vorhandene Zeilen und ihre Ledger-Sequenzen bleiben erhalten.

## Abfragen

- CLI: [`openclaw audit`](/de/cli/audit) mit Filtern für Agent, Sitzung, Ausführung, Art, Status, Richtung, Kanal, Zeitgrenzen und cursorbasierte Seitennavigation.
- Gateway-RPC: `audit.activity.list` (erfordert `operator.read`) gibt die versionierte Vereinigung von V1-Aktivitätsereignissen zurück; der ausgelieferte RPC `audit.list` bleibt für ältere Ausführungs-/Tool-Clients unverändert. Siehe [Gateway-Protokoll](/de/gateway/protocol#audit-ledger-rpc).

## Verwandte Themen

- [CLI für Auditdatensätze](/de/cli/audit)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#audit)
- [Gateway-Protokoll](/de/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/de/gateway/opentelemetry)
