---
read_when:
    - Sie möchten gehostete Ollama-Modelle ohne lokalen Ollama-Server verwenden
    - Sie benötigen die Provider-ID, den Schlüssel oder den Endpunkt von ollama-cloud
summary: Ollama Cloud direkt mit OpenClaw verwenden
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:05:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud ist Ollamas gehostete Modell-API. Damit kann OpenClaw Ollama-gehostete
Modelle direkt aufrufen, ohne einen lokalen Ollama-Server zu installieren oder eine lokale
Ollama-App im Cloud-Modus anzumelden. Verwenden Sie die Provider-ID `ollama-cloud` und Modellreferenzen wie
`ollama-cloud/kimi-k2.6`.

Diese Seite behandelt direktes, ausschließlich cloudbasiertes Routing. Der Provider verwendet Ollamas nativen
`/api/chat`-Stil, nicht die OpenAI-kompatible `/v1`-Route. OpenClaw registriert ihn
als separate Provider-ID, damit reine Cloud-Anmeldedaten, Live-Katalogerkennung und
Modellauswahl nicht mit einem lokalen `ollama`-Host vermischt werden.

Verwenden Sie diese Seite, wenn Sie ausschließlich cloudbasiertes Routing möchten. Für lokales Ollama, hybrides
Cloud-plus-lokal-Routing, Embeddings und Details zu benutzerdefinierten Hosts siehe
[Ollama](/de/providers/ollama).

## Einrichtung

Erstellen Sie einen Ollama Cloud-API-Schlüssel unter [ollama.com/settings/keys](https://ollama.com/settings/keys), und führen Sie dann aus:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Oder setzen Sie:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Standardwerte

- Provider: `ollama-cloud`
- Basis-URL: `https://ollama.com`
- Umgebungsvariable: `OLLAMA_API_KEY`
- API-Stil: nativ Ollama `/api/chat`
- Beispielmodell: `ollama-cloud/kimi-k2.6`

## Wann Sie Ollama Cloud wählen sollten

- Sie möchten gehostete Ollama-Modelle nutzen, ohne `ollama serve` lokal auszuführen.
- Sie möchten dieselbe native Ollama-Chat-API-Struktur, die OpenClaw für lokales
  Ollama verwendet, aber auf `https://ollama.com` ausgerichtet.
- Sie möchten einen einfachen Cloud-Pfad für Modelle, die bereits im gehosteten
  Katalog von Ollama enthalten sind.
- Sie benötigen keine lokalen Modell-Downloads, keine lokale GPU-Steuerung und keine reine LAN-Inferenz.

Verwenden Sie stattdessen [Ollama](/de/providers/ollama), wenn Sie ausschließlich lokales oder
Cloud-plus-lokales Routing über einen angemeldeten Ollama-Host möchten. Verwenden Sie stattdessen einen
OpenAI-kompatiblen Provider, wenn Sie `/v1/chat/completions`-
Semantik oder Provider-spezifische Funktionen im OpenAI-Stil benötigen.

## Modelle

OpenClaw erkennt Ollama Cloud-Modelle aus dem live gehosteten Katalog. Häufig
verfügbare gehostete IDs sind unter anderem:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Verwenden Sie eine Modell-ID aus Ihrem aktuellen gehosteten Katalog:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Modell-IDs sind Cloud-Katalog-IDs, keine lokalen Pull-Namen. Wenn ein Modellname in
einem lokalen Ollama-Host funktioniert, aber im gehosteten Katalog fehlt, verwenden Sie stattdessen den `ollama`-
Provider mit diesem lokalen Host.

## Live-Test

Für Smoke-Tests mit Ollama Cloud-API-Schlüssel richten Sie den Ollama-Live-Test auf den gehosteten
Endpunkt aus und wählen ein Modell aus Ihrem aktuellen Katalog aus:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Der Cloud-Smoke-Test führt Text, natives Streaming und Websuche aus. Embeddings werden
standardmäßig für `https://ollama.com` übersprungen, da Ollama Cloud-API-Schlüssel
`/api/embed` möglicherweise nicht autorisieren.

## Fehlerbehebung

- `Set OLLAMA_API_KEY`-Fehler: Geben Sie einen echten Cloud-API-Schlüssel an. Die lokale
  `ollama-local`-Markierung ist nur für lokale oder private Ollama-Hosts vorgesehen.
- Fehler bei unbekanntem Modell: Führen Sie `openclaw models list --provider ollama-cloud` aus und
  kopieren Sie die gehostete Modell-ID exakt.
- Probleme mit Tool-Aufrufen oder rohem JSON auf benutzerdefinierten Ollama-Hosts: Prüfen Sie, ob Sie
  versehentlich eine OpenAI-kompatible `/v1`-URL verwenden. Ollama-Routen sollten die
  native Basis-URL ohne `/v1`-Suffix verwenden.

## Verwandt

- [Ollama](/de/providers/ollama)
- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
