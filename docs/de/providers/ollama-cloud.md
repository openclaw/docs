---
read_when:
    - Sie möchten gehostete Ollama-Modelle ohne lokalen Ollama-Server verwenden
    - Sie benötigen die Provider-ID, den Schlüssel oder den Endpunkt von ollama-cloud
summary: Ollama Cloud direkt mit OpenClaw verwenden
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-24T04:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud ist Ollamas gehostete Modell-API. Der Provider `ollama-cloud` ruft sie
direkt unter `https://ollama.com` über Ollamas native `/api/chat`-API auf, ohne
lokalen Ollama-Server und ohne lokale Ollama-App, die im Cloud-Modus angemeldet ist. Verwenden Sie
Modellreferenzen wie `ollama-cloud/kimi-k2.6`.

OpenClaw registriert `ollama-cloud` als eigene Provider-ID, damit reine
Cloud-Anmeldedaten, die Live-Katalogerkennung und die Modellauswahl nicht mit
einem lokalen `ollama`-Host vermischt werden. Informationen zu lokalem Ollama, kombiniertem Cloud-und-lokal-Routing,
Embeddings und Details zu benutzerdefinierten Hosts finden Sie unter [Ollama](/de/providers/ollama).

## Einrichtung

Erstellen Sie unter [ollama.com/settings/keys](https://ollama.com/settings/keys) einen Ollama-Cloud-API-Schlüssel und führen Sie anschließend Folgendes aus:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Oder legen Sie Folgendes fest:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

Beim nicht interaktiven Onboarding kann der Schlüssel direkt angegeben werden:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

Beim Onboarding wird das Standardmodell auf `ollama-cloud/kimi-k2.5:cloud` gesetzt.

## Standardwerte

- Provider: `ollama-cloud`
- Basis-URL: `https://ollama.com`
- Umgebungsvariable: `OLLAMA_API_KEY`
- API-Stil: native Ollama-API `/api/chat`
- Standardmodell beim Onboarding: `ollama-cloud/kimi-k2.5:cloud`

## Wann Ollama Cloud gewählt werden sollte

- Sie möchten gehostete Ollama-Modelle verwenden, ohne `ollama serve` lokal auszuführen.
- Sie möchten dieselbe Struktur der nativen Ollama-Chat-API verwenden, die OpenClaw für lokales
  Ollama nutzt, jedoch ausgerichtet auf `https://ollama.com`.
- Sie möchten einen einfachen Cloud-Zugriff auf Modelle, die bereits im gehosteten
  Katalog von Ollama enthalten sind.
- Sie benötigen keine lokalen Modell-Downloads, keine lokale GPU-Steuerung und keine Inferenz ausschließlich im LAN.

Verwenden Sie stattdessen [Ollama](/de/providers/ollama), wenn Sie reines lokales Routing oder
Cloud-und-lokal-Routing über einen angemeldeten Ollama-Host wünschen. Verwenden Sie stattdessen einen
OpenAI-kompatiblen Provider, wenn Sie `/v1/chat/completions`-Semantik
oder providerspezifische Funktionen im OpenAI-Stil benötigen.

## Modelle

Der Provider benötigt einen API-Schlüssel; ohne diesen bleibt er inaktiv. Mit einem Schlüssel
erkennt OpenClaw Ollama-Cloud-Modelle live aus dem gehosteten Katalog:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Zu den gehosteten IDs im Live-Katalog gehören `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` und `minimax-m2.7`. Wenn die Live-Erkennung
keine Ergebnisse liefert, greift OpenClaw auf die mitgelieferten Einträge `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` und `glm-5.2:cloud` zurück.

Modell-IDs sind IDs des Cloud-Katalogs und keine lokalen Download-Namen. Wenn ein Modellname auf
einem lokalen Ollama-Host funktioniert, aber im gehosteten Katalog fehlt, verwenden Sie stattdessen den Provider `ollama`
mit diesem lokalen Host.

## Live-Test

Richten Sie für Smoke-Tests mit einem Ollama-Cloud-API-Schlüssel den Ollama-Live-Test auf den gehosteten
Endpunkt aus und wählen Sie ein Modell aus Ihrem aktuellen Katalog:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Der Cloud-Smoke-Test führt Text-, native Streaming- und Websuchtests aus; setzen Sie
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`, um die Websuche zu überspringen. Embeddings werden
standardmäßig für `https://ollama.com` übersprungen, da Ollama-Cloud-API-Schlüssel
`/api/embed` möglicherweise nicht autorisieren; erzwingen Sie sie mit `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Fehlerbehebung

- `Ollama Cloud requires an API key`- / `Set OLLAMA_API_KEY`-Fehler: Geben Sie einen
  echten Cloud-API-Schlüssel an. Die lokale Markierung `ollama-local` ist nur für lokale oder
  private Ollama-Hosts vorgesehen.
- Fehler wegen unbekannter Modelle: Führen Sie `openclaw models list --provider ollama-cloud` aus und
  kopieren Sie die gehostete Modell-ID exakt.
- Probleme mit Tool-Aufrufen oder unformatiertem JSON auf benutzerdefinierten Ollama-Hosts: Prüfen Sie, ob Sie
  versehentlich eine OpenAI-kompatible `/v1`-URL verwenden. Ollama-Routen sollten
  die native Basis-URL ohne das Suffix `/v1` verwenden.

## Verwandte Themen

- [Ollama](/de/providers/ollama)
- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
