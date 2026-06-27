---
read_when:
    - Je wilt gehoste Ollama-modellen gebruiken zonder een lokale Ollama-server
    - Je hebt de ollama-cloud-provider-id, -sleutel of -endpoint nodig
summary: Gebruik Ollama Cloud rechtstreeks met OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud is Ollama's gehoste model-API. Hiermee kan OpenClaw Ollama-gehoste
modellen rechtstreeks aanroepen, zonder een lokale Ollama-server te installeren of een lokale
Ollama-app aan te melden in cloudmodus. Gebruik provider-id `ollama-cloud` en modelverwijzingen zoals
`ollama-cloud/kimi-k2.6`.

Deze pagina is bedoeld voor directe cloud-only routing. De provider gebruikt Ollama's native
`/api/chat`-stijl, niet de OpenAI-compatibele `/v1`-route. OpenClaw registreert deze
als een afzonderlijke provider-id, zodat cloud-only referenties, live catalogusdetectie en
modelselectie niet worden vermengd met een lokale `ollama`-host.

Gebruik deze pagina wanneer je cloud-only routing wilt. Voor lokale Ollama, hybride
cloud-plus-lokale routing, embeddings en aangepaste hostdetails, zie
[Ollama](/nl/providers/ollama).

## Instellen

Maak een Ollama Cloud API-sleutel aan op [ollama.com/settings/keys](https://ollama.com/settings/keys) en voer daarna uit:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Of stel in:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Standaardwaarden

- Provider: `ollama-cloud`
- Basis-URL: `https://ollama.com`
- Omgevingsvariabele: `OLLAMA_API_KEY`
- API-stijl: Ollama native `/api/chat`
- Voorbeeldmodel: `ollama-cloud/kimi-k2.6`

## Wanneer je Ollama Cloud kiest

- Je wilt gehoste Ollama-modellen zonder `ollama serve` lokaal uit te voeren.
- Je wilt dezelfde native Ollama chat-API-vorm die OpenClaw gebruikt voor lokale
  Ollama, maar gericht op `https://ollama.com`.
- Je wilt een eenvoudig cloudpad voor modellen die al in Ollama's gehoste
  catalogus staan.
- Je hebt geen lokale model-pulls, lokale GPU-besturing of LAN-only inferentie nodig.

Gebruik in plaats daarvan [Ollama](/nl/providers/ollama) wanneer je local-only of
cloud-plus-lokale routing via een aangemelde Ollama-host wilt. Gebruik een
OpenAI-compatibele provider wanneer je `/v1/chat/completions`-semantiek
of providerspecifieke OpenAI-achtige functies nodig hebt.

## Modellen

OpenClaw detecteert Ollama Cloud-modellen vanuit de live gehoste catalogus. Vaak
beschikbare gehoste id's zijn onder andere:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Gebruik een model-id uit je huidige gehoste catalogus:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Model-id's zijn cloudcatalogus-id's, geen lokale pull-namen. Als een modelnaam werkt in
een lokale Ollama-host maar ontbreekt in de gehoste catalogus, gebruik dan in plaats daarvan de `ollama`-
provider met die lokale host.

## Live test

Voor smoke tests met Ollama Cloud API-sleutel wijs je de Ollama live test naar het gehoste
endpoint en kies je een model uit je huidige catalogus:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

De cloud-smoke test voert tekst, native stream en webzoekopdrachten uit. Embeddings worden
standaard overgeslagen voor `https://ollama.com`, omdat Ollama Cloud API-sleutels mogelijk geen
toegang geven tot `/api/embed`.

## Probleemoplossing

- `Set OLLAMA_API_KEY`-fouten: geef een echte cloud-API-sleutel op. De lokale
  `ollama-local`-markering is alleen bedoeld voor lokale of private Ollama-hosts.
- Fouten met onbekend model: voer `openclaw models list --provider ollama-cloud` uit en
  kopieer de gehoste model-id exact.
- Problemen met tool calls of ruwe JSON op aangepaste Ollama-hosts: controleer of je
  per ongeluk een OpenAI-compatibele `/v1`-URL gebruikt. Ollama-routes moeten de
  native basis-URL gebruiken zonder `/v1`-achtervoegsel.

## Gerelateerd

- [Ollama](/nl/providers/ollama)
- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
