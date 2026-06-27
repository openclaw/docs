---
read_when:
    - Sie möchten OpenClaw mit GMI Cloud-Modellen ausführen
    - Sie benötigen die GMI-Provider-ID, den Schlüssel oder den Endpunkt
summary: GMI Clouds OpenAI-kompatible API mit OpenClaw verwenden
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud ist eine gehostete Inferenzplattform für Frontier- und Open-Weight-Modelle
hinter einer OpenAI-kompatiblen API. In OpenClaw ist sie ein offizielles externes Provider-
Plugin. Das bedeutet, Sie installieren es einmal, wählen es mit der Provider-ID `gmi` aus,
speichern Zugangsdaten über die normale Modellauthentifizierung und verwenden Modell-Refs wie
`gmi/google/gemini-3.1-flash-lite`.

Verwenden Sie GMI, wenn Sie einen API-Schlüssel für mehrere gehostete Modellfamilien möchten, einschließlich
Google-, Anthropic-, OpenAI-, DeepSeek-, Moonshot- und Z.AI-Routen, die über den
Katalog von GMI bereitgestellt werden. Es ist nützlich als sekundärer Provider für Modell-Fallbacks, zum Vergleichen
gehosteter Routen verschiedener Anbieter oder wenn GMI ein Modell verfügbar hat, bevor Ihr
primärer Provider es anbietet.

Dieser Provider verwendet OpenAI-kompatible Chat-Semantik. OpenClaw verwaltet die Provider-
ID, das Auth-Profil, Aliase, den Modellkatalog-Seed und die Basis-URL; GMI verwaltet die Live-
Modellverfügbarkeit, Abrechnung, Ratenlimits und alle Provider-seitigen Routing-Richtlinien.

## Einrichtung

Installieren Sie das Plugin, starten Sie den Gateway neu und erstellen Sie dann einen API-Schlüssel in GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Führen Sie dann aus:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Oder setzen Sie:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Standardwerte

- Provider: `gmi`
- Aliase: `gmi-cloud`, `gmicloud`
- Basis-URL: `https://api.gmi-serving.com/v1`
- Umgebungsvariable: `GMI_API_KEY`
- Standardmodell: `gmi/google/gemini-3.1-flash-lite`

## Wann Sie GMI wählen sollten

- Sie möchten einen gehosteten OpenAI-kompatiblen Endpunkt statt eines lokalen Modellservers.
- Sie möchten mehrere kommerzielle und Open-Weight-Modellfamilien über ein einziges
  Provider-Konto ausprobieren.
- Sie möchten einen Fallback-Provider mit anderem Upstream-Routing als OpenRouter,
  DeepInfra, Together oder den direkten Anbieter-APIs.
- Sie benötigen GMI-spezifische Modell-IDs, Preise oder Kontosteuerungen.

Wählen Sie stattdessen den direkten Anbieter-Provider, wenn Sie anbieter-native Funktionen benötigen,
die GMI nicht über seine OpenAI-kompatible Route bereitstellt. Wählen Sie einen lokalen
Provider wie Ollama, LM Studio, vLLM oder SGLang, wenn Datenlokalität oder lokale
GPU-Steuerung wichtiger sind als gehostete Bequemlichkeit.

## Modelle

Der Plugin-Katalog initialisiert häufig verfügbare GMI-Cloud-Routen-IDs, darunter:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

Der Katalog ist ein Seed, kein Versprechen, dass jedes Konto jederzeit jedes Modell
aufrufen kann. Verwenden Sie den Modellauflistungsbefehl von OpenClaw, um zu sehen, was der konfigurierte
Provider in Ihrer Umgebung meldet:

```bash
openclaw models list --provider gmi
```

## Fehlerbehebung

- `401` oder `403`: Prüfen Sie, ob `GMI_API_KEY` für den Prozess gesetzt ist, der
  OpenClaw ausführt, oder führen Sie das Onboarding erneut aus, um den Schlüssel im Auth-Profil des Providers zu speichern.
- Fehler wegen unbekanntem Modell: Bestätigen Sie, dass das Modell in Ihrem GMI-Konto vorhanden ist, und verwenden Sie die
  vollständige `gmi/<route-id>`-Ref, die von `openclaw models list --provider gmi` angezeigt wird.
- Zeitweilige Provider-Fehler: Probieren Sie eine andere GMI-Route aus oder konfigurieren Sie GMI als
  Fallback statt als einzigen primären Modell-Provider.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
