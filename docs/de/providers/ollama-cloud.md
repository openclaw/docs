---
read_when:
    - Sie möchten gehostete Ollama-Modelle ohne einen lokalen Ollama-Server verwenden
    - Sie benötigen die Provider-ID, den Schlüssel oder den Endpunkt von ollama-cloud
summary: Ollama Cloud direkt mit OpenClaw verwenden
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T02:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud ist die gehostete Modell-API von Ollama. Der Provider `ollama-cloud` ruft sie
direkt unter `https://ollama.com` über Ollamas native `/api/chat`-API auf, ohne
lokalen Ollama-Server und ohne lokale Ollama-App, die im Cloud-Modus angemeldet ist. Verwenden Sie
Modellreferenzen wie `ollama-cloud/kimi-k2.6`.

OpenClaw registriert `ollama-cloud` als eigene Provider-ID, damit reine
Cloud-Zugangsdaten, die Live-Katalogerkennung und die Modellauswahl nicht mit
einem lokalen `ollama`-Host vermischt werden. Informationen zu lokalem Ollama, kombiniertem Cloud-und-lokalem Routing,
Embeddings und benutzerdefinierten Hostdetails finden Sie unter [Ollama](/de/providers/ollama).

## Einrichtung

Erstellen Sie unter [ollama.com/settings/keys](https://ollama.com/settings/keys) einen Ollama-Cloud-API-Schlüssel und führen Sie anschließend Folgendes aus:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Alternativ setzen Sie:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

Bei der nicht interaktiven Ersteinrichtung kann der Schlüssel direkt übergeben werden:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

Die Ersteinrichtung legt `ollama-cloud/kimi-k2.5:cloud` als Standardmodell fest.

## Standardwerte

- Provider: `ollama-cloud`
- Basis-URL: `https://ollama.com`
- Umgebungsvariable: `OLLAMA_API_KEY`
- API-Stil: native Ollama-API `/api/chat`
- Standardmodell der Ersteinrichtung: `ollama-cloud/kimi-k2.5:cloud`

## Wann Sie Ollama Cloud wählen sollten

- Sie möchten gehostete Ollama-Modelle verwenden, ohne `ollama serve` lokal auszuführen.
- Sie möchten dieselbe native Struktur der Ollama-Chat-API verwenden, die OpenClaw für lokales
  Ollama nutzt, jedoch auf `https://ollama.com` ausgerichtet.
- Sie möchten einen einfachen Cloud-Zugriff auf Modelle, die bereits im gehosteten
  Katalog von Ollama enthalten sind.
- Sie benötigen weder lokale Modell-Downloads noch lokale GPU-Steuerung oder eine ausschließlich über das LAN verfügbare Inferenz.

Verwenden Sie stattdessen [Ollama](/de/providers/ollama), wenn Sie ausschließlich lokales
oder kombiniertes Cloud-und-lokales Routing über einen angemeldeten Ollama-Host wünschen. Verwenden Sie stattdessen einen
OpenAI-kompatiblen Provider, wenn Sie die Semantik von `/v1/chat/completions`
oder providerspezifische Funktionen im OpenAI-Stil benötigen.

## Modelle

Der Provider benötigt einen API-Schlüssel; ohne einen solchen bleibt er inaktiv. Mit einem Schlüssel
erkennt OpenClaw Ollama-Cloud-Modelle live aus dem gehosteten Katalog:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Zu den gehosteten IDs im Live-Katalog gehören `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` und `minimax-m2.7`. Wenn die Live-Erkennung
keine Ergebnisse liefert, greift OpenClaw auf die mitgelieferten Einträge `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` und `glm-5.2:cloud` zurück.

Modell-IDs sind IDs des Cloud-Katalogs und keine Namen für lokale Downloads. Wenn ein Modellname auf
einem lokalen Ollama-Host funktioniert, aber nicht im gehosteten Katalog enthalten ist, verwenden Sie stattdessen den Provider `ollama`
mit diesem lokalen Host.

## Live-Test

Richten Sie für Smoke-Tests mit Ollama-Cloud-API-Schlüsseln den Ollama-Live-Test auf den gehosteten
Endpunkt aus und wählen Sie ein Modell aus Ihrem aktuellen Katalog:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Der Cloud-Smoke-Test prüft Text, natives Streaming und die Websuche; setzen Sie
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`, um die Websuche zu überspringen. Embeddings werden für
`https://ollama.com` standardmäßig übersprungen, da Ollama-Cloud-API-Schlüssel möglicherweise
keine Berechtigung für `/api/embed` erteilen; erzwingen Sie sie mit `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Fehlerbehebung

- Fehler wie `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: Geben Sie einen
  echten Cloud-API-Schlüssel an. Die lokale Markierung `ollama-local` ist nur für lokale oder
  private Ollama-Hosts vorgesehen.
- Fehler wegen unbekannter Modelle: Führen Sie `openclaw models list --provider ollama-cloud` aus und
  kopieren Sie die ID des gehosteten Modells exakt.
- Probleme mit Tool-Aufrufen oder unverarbeitetem JSON auf benutzerdefinierten Ollama-Hosts: Prüfen Sie, ob Sie
  versehentlich eine OpenAI-kompatible `/v1`-URL verwenden. Ollama-Routen sollten
  die native Basis-URL ohne das Suffix `/v1` verwenden.

## Verwandte Themen

- [Ollama](/de/providers/ollama)
- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
