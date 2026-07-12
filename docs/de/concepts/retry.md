---
read_when:
    - Wiederholungsverhalten oder Standardwerte des Providers aktualisieren
    - Fehlerbehebung bei Provider-Sendefehlern oder Ratenbegrenzungen
summary: Wiederholungsrichtlinie für ausgehende Provider-Aufrufe
title: Wiederholungsrichtlinie
x-i18n:
    generated_at: "2026-07-12T01:37:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Ziele

- Wiederholungsversuche pro HTTP-Anfrage, nicht pro mehrstufigem Ablauf.
- Reihenfolge beibehalten, indem nur der aktuelle Schritt erneut versucht wird.
- Duplizierung nicht idempotenter Vorgänge vermeiden.

## Standardwerte

| Einstellung                | Standardwert |
| -------------------------- | ------------ |
| Versuche                   | 3            |
| Maximale Verzögerung       | 30000 ms     |
| Zufällige Abweichung       | 0.1 (10 %)   |
| Telegram-Mindestverzögerung | 400 ms       |
| Discord-Mindestverzögerung  | 500 ms       |

## Verhalten

### Modell-Provider

- OpenClaw überlässt die üblichen kurzen Wiederholungsversuche den Provider-SDKs.
- Bei Stainless-basierten SDKs wie Anthropic und OpenAI können wiederholbare Antworten (`408`, `409`, `429` und `5xx`) `retry-after-ms` oder `retry-after` enthalten. Wenn diese Wartezeit länger als 60 Sekunden ist, fügt OpenClaw `x-should-retry: false` ein, damit das SDK den Fehler sofort weitergibt und der Modell-Failover zu einem anderen Authentifizierungsprofil oder Fallback-Modell wechseln kann.
- Überschreiben Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Setzen Sie den Wert auf `0`, `false`, `off`, `none` oder `disabled`, damit SDKs lange `Retry-After`-Wartezeiten intern berücksichtigen.

### Discord

- Wiederholungsversuche erfolgen bei Ratenbegrenzungsfehlern (HTTP 429), Anfragezeitüberschreitungen, HTTP-5xx-Antworten und vorübergehenden Transportfehlern wie DNS-Auflösungsfehlern, Verbindungsabbrüchen, geschlossenen Sockets und Abruffehlern.
- Verwendet Discords `retry_after`, sofern verfügbar, andernfalls exponentiellen Backoff.

### Telegram

- Wiederholungsversuche erfolgen bei vorübergehenden Fehlern (429, Zeitüberschreitung, Verbindungsaufbau/-abbruch/-schließung, vorübergehend nicht verfügbar).
- Verwendet `retry_after`, sofern verfügbar, andernfalls exponentiellen Backoff.
- HTML-/Markdown-Parsingfehler werden nicht erneut versucht; beim ersten Versuch wird auf Klartext zurückgegriffen.

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

- Wiederholungsversuche gelten pro Anfrage (Nachricht senden, Medien hochladen, Reaktion, Umfrage, Sticker).
- Zusammengesetzte Abläufe wiederholen keine bereits abgeschlossenen Schritte.

## Verwandte Themen

- [Modell-Failover](/de/concepts/model-failover)
- [Befehlswarteschlange](/de/concepts/queue)
