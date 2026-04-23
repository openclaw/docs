---
read_when:
    - Wiederholungsverhalten oder Standardwerte des Providers aktualisieren
    - Provider-Sendefehler oder Ratenbegrenzungen debuggen
summary: Wiederholungsrichtlinie für ausgehende Provider-Aufrufe
title: Wiederholungsrichtlinie
x-i18n:
    generated_at: "2026-04-23T06:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Wiederholungsrichtlinie

## Ziele

- Pro HTTP-Anfrage wiederholen, nicht pro mehrstufigem Ablauf.
- Die Reihenfolge beibehalten, indem nur der aktuelle Schritt wiederholt wird.
- Das Duplizieren nicht idempotenter Vorgänge vermeiden.

## Standardwerte

- Versuche: 3
- Maximale Verzögerungsgrenze: 30000 ms
- Jitter: 0.1 (10 Prozent)
- Provider-Standards:
  - Mindestverzögerung für Telegram: 400 ms
  - Mindestverzögerung für Discord: 500 ms

## Verhalten

### Modell-Provider

- OpenClaw lässt Provider-SDKs normale kurze Wiederholungen selbst behandeln.
- Bei Stainless-basierten SDKs wie Anthropic und OpenAI können wiederholbare Antworten
  (`408`, `409`, `429` und `5xx`) `retry-after-ms` oder
  `retry-after` enthalten. Wenn diese Wartezeit länger als 60 Sekunden ist, fügt OpenClaw
  `x-should-retry: false` ein, damit das SDK den Fehler sofort an die Oberfläche gibt und Modell-
  Failover auf ein anderes Auth-Profil oder ein Fallback-Modell umschalten kann.
- Überschreiben Sie die Grenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Setzen Sie sie auf `0`, `false`, `off`, `none` oder `disabled`, damit SDKs lange
  `Retry-After`-Wartezeiten intern beachten.

### Discord

- Wiederholt nur bei Fehlern durch Ratenbegrenzung (HTTP 429).
- Verwendet Discord-`retry_after`, wenn verfügbar, sonst exponentielles Backoff.

### Telegram

- Wiederholt bei vorübergehenden Fehlern (429, Timeout, connect/reset/closed, vorübergehend nicht verfügbar).
- Verwendet `retry_after`, wenn verfügbar, sonst exponentielles Backoff.
- Markdown-Parse-Fehler werden nicht wiederholt; sie fallen auf Klartext zurück.

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

- Wiederholungen gelten pro Anfrage (Nachricht senden, Medien-Upload, Reaktion, Umfrage, Sticker).
- Zusammengesetzte Abläufe wiederholen bereits abgeschlossene Schritte nicht.
