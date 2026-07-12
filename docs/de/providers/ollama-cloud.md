---
read_when:
    - Sie möchten gehostete Ollama-Modelle ohne einen lokalen Ollama-Server verwenden
    - Sie benötigen die Provider-ID, den Schlüssel oder den Endpunkt von ollama-cloud
summary: Ollama Cloud direkt mit OpenClaw verwenden
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T15:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
einem lokalen `ollama`-Host vermischt werden. Informationen zu lokalem Ollama, hybridem Cloud-plus-lokal-Routing,
Embeddings und benutzerdefinierten Hostdetails finden Sie unter [Ollama](/de/providers/ollama).

## Einrichtung

Erstellen Sie unter [ollama.com/settings/keys](https://ollama.com/settings/keys) einen Ollama-Cloud-API-Schlüssel und führen Sie dann Folgendes aus:

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

Das Onboarding legt `ollama-cloud/kimi-k2.5:cloud` als Standardmodell fest.

## Standardwerte

- Provider: `ollama-cloud`
- Basis-URL: `https://ollama.com`
- Umgebungsvariable: `OLLAMA_API_KEY`
- API-Stil: native Ollama-API `/api/chat`
- Standardmodell beim Onboarding: `ollama-cloud/kimi-k2.5:cloud`

## Wann Sie Ollama Cloud wählen sollten

- Sie möchten gehostete Ollama-Modelle verwenden, ohne `ollama serve` lokal auszuführen.
- Sie möchten dieselbe native Form der Ollama-Chat-API verwenden, die OpenClaw für lokales
  Ollama nutzt, aber auf `https://ollama.com` ausgerichtet.
- Sie möchten einen einfachen Cloud-Zugriff auf Modelle, die bereits in Ollamas gehostetem
  Katalog enthalten sind.
- Sie benötigen keine lokalen Modell-Downloads, keine lokale GPU-Steuerung und keine ausschließlich auf das LAN beschränkte Inferenz.

Verwenden Sie stattdessen [Ollama](/de/providers/ollama), wenn Sie ausschließlich lokales oder
Cloud-plus-lokal-Routing über einen angemeldeten Ollama-Host wünschen. Verwenden Sie stattdessen einen
OpenAI-kompatiblen Provider, wenn Sie die Semantik von `/v1/chat/completions`
oder Provider-spezifische Funktionen im OpenAI-Stil benötigen.

## Modelle

Der Provider benötigt einen API-Schlüssel; ohne Schlüssel bleibt er inaktiv. Mit einem Schlüssel
ermittelt OpenClaw Ollama-Cloud-Modelle live aus dem gehosteten Katalog:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Zu den gehosteten IDs im Live-Katalog gehören `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` und `minimax-m2.7`. Wenn die Live-Erkennung
keine Ergebnisse liefert, greift OpenClaw auf die mitgelieferten Einträge `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` und `glm-5.2:cloud` zurück.

Modell-IDs sind IDs des Cloud-Katalogs und keine lokalen Download-Namen. Wenn ein Modellname auf
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

Der Cloud-Smoke-Test führt Text-, native Stream- und Websuchtests aus; setzen Sie
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`, um die Websuche zu überspringen. Embeddings werden für
`https://ollama.com` standardmäßig übersprungen, da Ollama-Cloud-API-Schlüssel möglicherweise keine
Berechtigung für `/api/embed` erteilen; erzwingen Sie sie mit `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Fehlerbehebung

- Fehler wie `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: Geben Sie einen
  echten Cloud-API-Schlüssel an. Die lokale Markierung `ollama-local` ist ausschließlich für lokale oder
  private Ollama-Hosts vorgesehen.
- Fehler wegen unbekannter Modelle: Führen Sie `openclaw models list --provider ollama-cloud` aus und
  kopieren Sie die ID des gehosteten Modells exakt.
- Probleme mit Tool-Aufrufen oder unaufbereitetem JSON auf benutzerdefinierten Ollama-Hosts: Prüfen Sie, ob Sie
  versehentlich eine OpenAI-kompatible `/v1`-URL verwenden. Ollama-Routen sollten
  die native Basis-URL ohne das Suffix `/v1` verwenden.

## Verwandte Themen

- [Ollama](/de/providers/ollama)
- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
