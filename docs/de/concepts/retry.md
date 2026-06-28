---
read_when:
    - Provider-Wiederholungsverhalten oder -Standardwerte aktualisieren
    - Debuggen von Provider-Sendefehlern oder Rate Limits
summary: Wiederholungsrichtlinie für ausgehende Provider-Aufrufe
title: Wiederholungsrichtlinie
x-i18n:
    generated_at: "2026-05-02T06:32:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Ziele

- Wiederholen pro HTTP-Anfrage, nicht pro mehrstufigem Ablauf.
- Reihenfolge beibehalten, indem nur der aktuelle Schritt wiederholt wird.
- Nicht idempotente Operationen nicht duplizieren.

## Standardwerte

- Versuche: 3
- Maximale Verzögerungsobergrenze: 30000 ms
- Jitter: 0.1 (10 Prozent)
- Provider-Standardwerte:
  - Minimale Verzögerung für Telegram: 400 ms
  - Minimale Verzögerung für Discord: 500 ms

## Verhalten

### Modell-Provider

- OpenClaw lässt Provider-SDKs normale kurze Wiederholungen verarbeiten.
- Bei Stainless-basierten SDKs wie Anthropic und OpenAI können wiederholbare Antworten
  (`408`, `409`, `429` und `5xx`) `retry-after-ms` oder
  `retry-after` enthalten. Wenn diese Wartezeit länger als 60 Sekunden ist, fügt OpenClaw
  `x-should-retry: false` ein, damit das SDK den Fehler sofort weitergibt und das Modell-Failover
  zu einem anderen Auth-Profil oder Fallback-Modell wechseln kann.
- Überschreiben Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Setzen Sie sie auf `0`, `false`, `off`, `none` oder `disabled`, damit SDKs lange
  `Retry-After`-Wartezeiten intern einhalten.

### Discord

- Wiederholungen bei Rate-Limit-Fehlern (HTTP 429), Anfrage-Timeouts, HTTP-5xx-Antworten
  und vorübergehenden Transportfehlern wie DNS-Auflösungsfehlern, Verbindungsabbrüchen,
  Socket-Schließungen und Fetch-Fehlern.
- Verwendet Discord-`retry_after`, wenn verfügbar, andernfalls exponentielles Backoff.

### Telegram

- Wiederholungen bei vorübergehenden Fehlern (429, Timeout, Verbindung/Reset/geschlossen, vorübergehend nicht verfügbar).
- Verwendet `retry_after`, wenn verfügbar, andernfalls exponentielles Backoff.
- Markdown-Parsing-Fehler werden nicht wiederholt; sie fallen auf reinen Text zurück.

## Konfiguration

Legen Sie die Wiederholungsrichtlinie pro Provider in `~/.openclaw/openclaw.json` fest:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Hinweise

- Wiederholungen gelten pro Anfrage (Nachricht senden, Medien hochladen, Reaktion, Umfrage, Sticker).
- Zusammengesetzte Abläufe wiederholen abgeschlossene Schritte nicht.

## Verwandte Themen

- [Modell-Failover](/de/concepts/model-failover)
- [Befehlswarteschlange](/de/concepts/queue)
