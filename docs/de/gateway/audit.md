---
read_when:
    - Sie benötigen eine dauerhafte Aufzeichnung der Gateway-Aktivitäten, ohne Inhalte zu speichern
    - Sie entscheiden, ob die Prüfung des Nachrichtenlebenszyklus aktiviert werden soll
    - Sie müssen erklären, was Auditdatensätze belegen und was nicht.
summary: Reine Metadaten-Prüfhistorie für Agentenläufe, Tool-Aktionen und optionale Nachrichtenlebenszyklen
title: Auditverlauf
x-i18n:
    generated_at: "2026-07-24T04:33:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Auditverlauf

Der Gateway führt ein begrenztes Audit-Ledger, das ausschließlich Metadaten enthält, in der gemeinsam genutzten OpenClaw-Zustandsdatenbank. Es beantwortet betriebliche Fragen wie „Welcher Agent wurde wann ausgeführt und wie endete die Ausführung?“, „Welche Tool-Aktionen führte eine Ausführung aus?“ sowie, wenn die Nachrichtenüberwachung aktiviert ist, „Erreichte eine akzeptierte eingehende Nachricht die Weiterleitung?“ und „Erreichte eine ausgehende Nachricht einen endgültigen Zustellstatus?“.

Das Ledger speichert Identität, Reihenfolge, Herkunft, Aktion, Status und normalisierte Ergebniscodes. Es speichert niemals Prompts, Nachrichteninhalte, Tool-Argumente, Tool-Ergebnisse, Anhänge, Dateinamen, URLs, Befehlsausgaben oder unformatierten Fehlertext.

## Datensatzfamilien

Ausführungs- und Tool-Ereignisse werden aufgezeichnet, sobald die Auditierung aktiviert ist (Standardeinstellung). Nachrichtenlebenszyklus-Ereignisse müssen explizit aktiviert werden und sind standardmäßig deaktiviert.

| Familie          | Aktionen                                                 | Standard |
| ---------------- | -------------------------------------------------------- | -------- |
| Agent-Ausführungen | `agent.run.started`, `agent.run.finished`                | ein      |
| Tool-Aktionen    | `tool.action.started`, `tool.action.finished`                  | ein      |
| Nachrichten      | `message.inbound.processed`, `message.outbound.finished`                  | aus      |

Jeder Datensatz enthält eine stabile Ereignis-ID, eine monotone Ledger-Sequenz, einen Lebenszyklus-Zeitstempel, Akteur, Aktion, Status, `schemaVersion: 1` und `redaction: "metadata_only"`. Die vollständige Feldreferenz und die Abfragefilter finden Sie unter [Auditdatensätze](/de/cli/audit).

## Nachrichtenlebenszyklus-Ereignisse

Legen Sie mit [`audit.messages`](/de/gateway/configuration-reference#audit) fest, was aufgezeichnet wird, und starten Sie anschließend den Gateway neu:

- `off` (Standard): keine Nachrichtendatensätze.
- `direct`: nur Nachrichten in direkten Unterhaltungen.
- `all`: Direkt-, Gruppen- und Kanalnachrichten.

Zwei maßgebliche Grenzen erzeugen Nachrichtendatensätze:

- **Eingehende** Zeilen werden geschrieben, wenn eine akzeptierte Nachricht die zentrale Weiterleitung erreicht, einschließlich Duplikaten und endgültigen Verarbeitungsergebnissen.
- **Ausgehende** Zeilen werden geschrieben, wenn die gemeinsam genutzte dauerhafte Zustellung ein endgültiges Ergebnis erreicht: gesendet, unterdrückt, fehlgeschlagen oder ein explizites `unknown` bei absturzbedingt mehrdeutigen Sendevorgängen. Ergebnisse der Warteschlangenwiederherstellung und der Dead-Letter-Verarbeitung sind eingeschlossen. Jede ursprüngliche logische Antwortnutzlast erhält eine endgültige Zeile; Aufteilung und Adapter-Fan-out werden in `resultCount` zusammengefasst.

### Klassifizierung der Unterhaltungsart

Der Modus `direct` stellt eine Datenschutzgrenze dar. Daher wird eine Nachricht nur dann als direkte Unterhaltung klassifiziert, wenn dies durch Zielfakten belegt ist: Der Sendepfad hat die Art der Zielunterhaltung angegeben oder die Zustellsitzungsroute nennt exakt den Kanal und den Peer, an den zugestellt wird. Schwächere Signale, etwa der Richtlinienstatus oder die ursprüngliche Unterhaltung, können eine Nachricht als `group` klassifizieren (und sie damit von der `direct`-Erfassung ausschließen), dürfen jedoch niemals `direct` beanspruchen. Nachrichten, deren Direktcharakter nicht belegt werden kann, werden als `unknown` klassifiziert und im Modus `direct` nicht aufgezeichnet. Kanäle, die keine Chattypen angeben, zeichnen daher im Modus `direct` möglicherweise weniger Zeilen auf als im Modus `all`.

## Datenschutzmodell

Nachrichtenzeilen speichern niemals unverarbeitete Plattformkennungen. Konto-, Unterhaltungs-, Nachrichten- und Zielkennungen werden, sofern eine Korrelation möglich ist, ausschließlich als installationslokale schlüsselbasierte Pseudonyme (`hmac-sha256:v1:<keyId>:<digest>`) exportiert:

- Der HMAC-Schlüssel wird bei der ersten Verwendung erzeugt, ist nach Kennungsart domänengetrennt und befindet sich in derselben Zustandsdatenbank wie das Ledger.
- Pseudonyme sind innerhalb einer Installation stabil, sodass Zeilen zur selben Unterhaltung korreliert werden können, ohne die Plattformkennung offenzulegen.
- Dies ist **Korrelation, keine Anonymisierung**: Personen mit Lesezugriff auf die Zustandsdatenbank verfügen ebenfalls über den Schlüssel und können mögliche unverarbeitete Kennungen gegen die Pseudonyme prüfen. RPC- und CLI-Exporte enthalten den Schlüssel niemals.
- Wenn das Schlüsselmaterial fehlt oder beschädigt ist, während Nachrichtenzeilen aufbewahrt werden, arbeitet der Gateway nach dem Fail-Closed-Prinzip und verwirft neue Nachrichtendatensätze, statt unbemerkt zu einem neuen Schlüssel zu wechseln, wodurch die Korrelation aufgeteilt würde.

Ausführungs- und Tool-Datensätze behalten `sessionKey` und `sessionId` zur Korrelation bei; kanonische Sitzungsschlüssel können selbst Plattformkonto- oder Peer-IDs enthalten. Nachrichtendatensätze lassen beide absichtlich aus.

Auditexporte bleiben auch ohne Inhalte sensible betriebliche Metadaten: Zeitangaben, Kanäle, Ergebnisse und stabile Pseudonyme können Aktivitäten korrelieren. Schützen Sie Exporte mit denselben Zugriffskontrollen und Aufbewahrungsverfahren wie andere Betriebsdatensätze.

## Abdeckung und Beweisgrenzen

Das Ledger arbeitet nach bestem Bemühen und ist absichtlich begrenzt. Betrachten Sie es als Nachweis dessen, was aufgezeichnet wurde, nicht als Beweis dessen, was tatsächlich geschah:

- **Das Fehlen einer Zeile beweist nichts.** Vor der Annahme verworfene eingehende Nachrichten, Sendevorgänge aus CLI-Prozessen ohne laufenden Gateway-Rekorder sowie pluginlokale oder direkte Sendepfade, die die gemeinsam genutzte dauerhafte Zustellung umgehen, hinterlassen keinen Datensatz.
- Schreibvorgänge werden von einem begrenzten Hintergrund-Worker verarbeitet; ein Worker-Ausfall oder eine Überlastung der Warteschlange führt zum Verwerfen von Datensätzen und zur Protokollierung einer betrieblichen Warnung.
- Absturzbedingt mehrdeutige ausgehende Sendevorgänge werden als `unknown` aufgezeichnet, statt Ergebnisse zu erfinden.

Dieses Ledger unterstützt die Fehlerbehebung und betriebliche Überprüfung. Es ist kein verlustfreies Compliance-Archiv. Wenn Sie ein solches benötigen, verwenden Sie ein externes System, das über [OpenTelemetry](/de/gateway/opentelemetry) oder Tools auf Kanalebene gespeist wird.

## Speicherung, Aufbewahrung und Migration

Datensätze befinden sich in der gemeinsam genutzten Zustandsdatenbank (`state/openclaw.sqlite`) und werden außerhalb des zeitkritischen Zustellpfads geschrieben. Abfragen geben niemals Datensätze zurück, die älter als 30 Tage sind, und das Ledger ist auf 100,000 Zeilen begrenzt. Abgelaufene Zeilen werden beim Start, während der stündlichen Wartung und bei späteren Schreibvorgängen bereinigt. Die Aufbewahrungswartung läuft auch dann weiter, wenn die Erfassung deaktiviert ist.

Beim Upgrade von einem Gateway mit dem früheren, ausschließlich Ausführungs- und Tool-Daten enthaltenden Ledger wird das Schema beim Start (oder über `openclaw doctor --fix`) automatisch migriert. Vorhandene Zeilen und ihre Ledger-Sequenzen bleiben erhalten.

## Abfragen

- CLI: [`openclaw audit`](/de/cli/audit) mit Filtern für Agent, Sitzung, Ausführung, Art, Status, Richtung, Kanal, Zeitgrenzen und Cursor-Paginierung.
- Gateway-RPC: `audit.activity.list` (erfordert `operator.read`) gibt die versionierte Vereinigung von V1-Aktivitätsereignissen zurück; der ausgelieferte RPC `audit.list` bleibt für ältere Ausführungs-/Tool-Clients unverändert. Siehe [Gateway-Protokoll](/de/gateway/protocol#audit-ledger-rpc).

## Verwandte Themen

- [CLI für Auditdatensätze](/de/cli/audit)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#audit)
- [Gateway-Protokoll](/de/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/de/gateway/opentelemetry)
