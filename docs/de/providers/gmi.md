---
read_when:
    - Sie möchten OpenClaw mit Modellen von GMI Cloud ausführen
    - Sie benötigen die Provider-ID, den Schlüssel oder den Endpunkt von GMI.
summary: Verwenden Sie die OpenAI-kompatible API von GMI Cloud mit OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T02:03:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud ist eine gehostete Inferenzplattform für Frontier- und Open-Weight-Modelle
hinter einer OpenAI-kompatiblen API. In OpenClaw ist sie ein offizielles externes
Provider-Plugin: Installieren Sie es einmal, speichern Sie Zugangsdaten über die
reguläre Modellauthentifizierung und verwenden Sie Modellreferenzen wie
`gmi/google/gemini-3.1-flash-lite`.

Verwenden Sie GMI, wenn Sie einen API-Schlüssel für mehrere gehostete Modellfamilien
nutzen möchten, einschließlich der von GMIs Katalog bereitgestellten Routen für
Anthropic, DeepSeek, Google, Moonshot, OpenAI und Z.AI. GMI eignet sich als sekundärer
Provider für Modell-Fallbacks, zum Vergleichen gehosteter Routen verschiedener Anbieter
oder wenn ein Modell bei GMI früher verfügbar ist als bei Ihrem primären Provider.
OpenClaw verwaltet die Provider-ID, das Authentifizierungsprofil, die Aliasse, den
initialen Modellkatalog und die Basis-URL; GMI verwaltet die aktuelle Modellverfügbarkeit,
Abrechnung, Ratenbegrenzungen und alle Provider-seitigen Routing-Richtlinien.

| Eigenschaft   | Wert                                     |
| ------------- | ---------------------------------------- |
| Provider-ID   | `gmi` (Aliasse: `gmi-cloud`, `gmicloud`) |
| Paket         | `@openclaw/gmi-provider`                 |
| Auth.-Umgebungsvariable | `GMI_API_KEY`                    |
| API           | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL     | `https://api.gmi-serving.com/v1`         |
| Standardmodell | `gmi/google/gemini-3.1-flash-lite`      |

## Einrichtung

Installieren Sie das Plugin, starten Sie das Gateway neu und erstellen Sie anschließend
einen API-Schlüssel in GMI Cloud (`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Führen Sie dann Folgendes aus:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Bei nicht interaktiven Einrichtungen können Sie `--gmi-api-key <key>` übergeben oder
Folgendes festlegen:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Wann Sie GMI wählen sollten

- Sie möchten einen gehosteten OpenAI-kompatiblen Endpunkt statt eines lokalen Modellservers.
- Sie möchten mehrere kommerzielle und Open-Weight-Modellfamilien über ein einziges
  Provider-Konto ausprobieren.
- Sie möchten einen Fallback-Provider mit einem anderen Upstream-Routing als DeepInfra,
  OpenRouter, Together oder die direkten Anbieter-APIs.
- Sie benötigen GMI-spezifische Modell-IDs, Preise oder Kontoeinstellungen.

Wählen Sie stattdessen den direkten Anbieter-Provider, wenn Sie anbieterspezifische
Funktionen benötigen, die GMI nicht über seine OpenAI-kompatible Route bereitstellt.
Wählen Sie einen lokalen Provider wie LM Studio, Ollama, SGLang oder vLLM, wenn
Datenlokalität oder die Kontrolle über lokale GPUs wichtiger ist als der Komfort
eines gehosteten Dienstes.

## Modelle

Der Plugin-Katalog enthält initial häufig verfügbare Routen-IDs von GMI Cloud:

| Modellreferenz                     | Eingabe      | Kontext   | Maximale Ausgabe |
| ---------------------------------- | ------------ | --------- | ---------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | Text + Bild  | 200,000   | 64,000           |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | Text         | 163,840   | 65,536           |
| `gmi/google/gemini-3.1-flash-lite` | Text + Bild  | 1,048,576 | 65,536           |
| `gmi/moonshotai/Kimi-K2.5`         | Text + Bild  | 262,144   | 65,536           |
| `gmi/openai/gpt-5.4`               | Text + Bild  | 400,000   | 128,000          |
| `gmi/zai-org/GLM-5.1-FP8`          | Text         | 202,752   | 65,536           |

Der Katalog dient als Ausgangsbasis und ist keine Zusicherung, dass jedes Konto
jederzeit jedes Modell aufrufen kann. Listen Sie auf, was der konfigurierte Provider
in Ihrer Umgebung meldet:

```bash
openclaw models list --provider gmi
```

## Fehlerbehebung

- `401` oder `403`: Prüfen Sie, ob `GMI_API_KEY` für den Prozess festgelegt ist, der
  OpenClaw ausführt, oder führen Sie das Onboarding erneut aus, um den Schlüssel im
  Authentifizierungsprofil des Providers zu speichern.
- Fehler wegen unbekannter Modelle: Vergewissern Sie sich, dass das Modell in Ihrem
  GMI-Konto vorhanden ist, und verwenden Sie die vollständige Referenz
  `gmi/<route-id>`, die von `openclaw models list --provider gmi` angezeigt wird.
- Sporadische Provider-Fehler: Probieren Sie eine andere GMI-Route aus oder konfigurieren
  Sie GMI als Fallback, statt es als einzigen primären Modell-Provider zu verwenden.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
