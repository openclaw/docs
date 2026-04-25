---
read_when:
    - Sie möchten eine schnelle Diagnose der Kanalintegrität und der aktuellen Sitzungsempfänger.
    - Sie möchten einen kopierbaren „all“-Status für das Debugging.
summary: CLI-Referenz für `openclaw status` (Diagnosen, Probes, Nutzungs-Snapshots)
title: Status
x-i18n:
    generated_at: "2026-04-25T13:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnosen für Channels + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Probes aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Sitzungsstatusausgabe trennt `Execution:` von `Runtime:`. `Execution` ist der Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` angibt, ob die Sitzung `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Siehe [Agent-Runtimes](/de/concepts/agent-runtimes) für die Unterscheidung zwischen Provider, Modell und Runtime.
- Die rohen Felder `usage_percent` / `usagePercent` von MiniMax geben die verbleibende Quote an, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben Vorrang, wenn vorhanden. Antworten von `model_remains` bevorzugen den Chat-Modell-Eintrag, leiten bei Bedarf das Fensterlabel aus Zeitstempeln ab und schließen den Modellnamen im Plan-Label ein.
- Wenn der aktuelle Sitzungs-Snapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem letzten Nutzungsprotokoll des Transkripts nachtragen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor den Fallback-Werten aus dem Transkript.
- Der Transkript-Fallback kann auch das aktive Runtime-Modell-Label wiederherstellen, wenn es im Live-Sitzungseintrag fehlt. Wenn sich dieses Transkript-Modell vom ausgewählten Modell unterscheidet, löst Status das Kontextfenster anhand des wiederhergestellten Runtime-Modells statt des ausgewählten auf.
- Für die Prompt-Größenabrechnung bevorzugt der Transkript-Fallback die größere promptorientierte Summe, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit Sitzungen mit benutzerdefinierten Providern nicht auf eine Anzeige von `0` Token zurückfallen.
- Die Ausgabe umfasst Sitzungsspeicher pro Agent, wenn mehrere Agents konfiguriert sind.
- Die Übersicht umfasst den Installations-/Laufzeitstatus des Gateway- + Node-Host-Dienstes, sofern verfügbar.
- Die Übersicht umfasst den Update-Kanal + Git-SHA (für Source-Checkouts).
- Update-Informationen werden in der Übersicht angezeigt; wenn ein Update verfügbar ist, gibt Status einen Hinweis aus, `openclaw update` auszuführen (siehe [Aktualisieren](/de/install/updating)).
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Ziel-Konfigurationspfade nach Möglichkeit auf.
- Wenn ein unterstützter SecretRef für einen Channel konfiguriert, im aktuellen Befehlspfad aber nicht verfügbar ist, bleibt Status schreibgeschützt und meldet eine eingeschränkte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „konfiguriertes Token in diesem Befehlspfad nicht verfügbar“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die auf den Befehl beschränkte SecretRef-Auflösung erfolgreich ist, bevorzugt Status den aufgelösten Snapshot und entfernt vorübergehende Channel-Markierungen wie „Secret nicht verfügbar“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Übersichtszeile für Secrets und einen Diagnoseabschnitt, der Secret-Diagnosen zusammenfasst (zur besseren Lesbarkeit gekürzt), ohne die Berichtserstellung anzuhalten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
