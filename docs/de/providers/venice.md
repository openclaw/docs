---
read_when:
    - Sie möchten datenschutzorientierte Inferenz in OpenClaw
    - Sie benötigen eine Anleitung zur Einrichtung von Venice AI
summary: Nutzen Sie die datenschutzorientierten Modelle von Venice AI in OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T02:06:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) bietet datenschutzorientierte Inferenz: Offene Modelle werden
ohne Protokollierung ausgeführt, ergänzt durch anonymisierten Proxy-Zugriff auf Claude, GPT, Gemini und Grok.
Alle Endpunkte sind OpenAI-kompatibel (`/v1`).

## Datenschutzmodi

| Modus             | Verhalten                                                                 | Modelle                                                       |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privat**        | Prompts/Antworten werden niemals gespeichert oder protokolliert. Flüchtig. | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored usw.  |
| **Anonymisiert**  | Weiterleitung über Venice, wobei zuvor Metadaten entfernt werden.          | Claude, GPT, Gemini, Grok                                     |

<Warning>
Anonymisierte Modelle sind nicht vollständig privat. Venice entfernt vor der Weiterleitung die Metadaten, aber der zugrunde liegende Provider (OpenAI, Anthropic, Google, xAI) verarbeitet die Anfrage weiterhin. Verwenden Sie private Modelle, wenn vollständiger Datenschutz erforderlich ist.
</Warning>

## Erste Schritte

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="API-Schlüssel abrufen">
    1. Registrieren Sie sich unter [venice.ai](https://venice.ai)
    2. Gehen Sie zu **Settings > API Keys > Create new key**
    3. Kopieren Sie Ihren API-Schlüssel (Format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw konfigurieren">
    <Tabs>
      <Tab title="Interaktiv (empfohlen)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Fragt den API-Schlüssel ab (oder verwendet einen vorhandenen `VENICE_API_KEY` erneut), listet verfügbare Venice-Modelle auf und legt Ihr Standardmodell fest.
      </Tab>
      <Tab title="Umgebungsvariable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Nicht interaktiv">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Einrichtung überprüfen">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Modellauswahl

- **Standard**: `venice/kimi-k2-5` (privat, logisches Schlussfolgern, Bildverarbeitung).
- **Leistungsstärkste anonymisierte Option**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Sie können auch `openclaw configure` ausführen und **Modell-/Authentifizierungs-Provider > Venice AI** auswählen.

<Tip>
| Anwendungsfall                       | Modell                             | Begründung                                                   |
| ------------------------------------ | ---------------------------------- | ------------------------------------------------------------ |
| Allgemeiner Chat (Standard)          | `kimi-k2-5`                        | Leistungsstarkes privates Schlussfolgern plus Bildverarbeitung |
| Beste Gesamtqualität                 | `claude-opus-4-6`                  | Leistungsstärkste anonymisierte Venice-Option                |
| Datenschutz und Programmierung       | `qwen3-coder-480b-a35b-instruct`   | Privates Programmiermodell mit großem Kontext                |
| Schnell und kostengünstig            | `qwen3-4b`                         | Leichtgewichtiges Modell für logisches Schlussfolgern        |
| Komplexe private Aufgaben            | `deepseek-v3.2`                    | Leistungsstarkes Schlussfolgern; Werkzeugaufrufe deaktiviert |
| Unzensiert                           | `venice-uncensored`                | Keine Inhaltsbeschränkungen                                  |
</Tip>

## Integrierter Katalog (38 Modelle)

<AccordionGroup>
  <Accordion title="Private Modelle (26) — vollständig privat, keine Protokollierung">
    | Modell-ID                              | Name                                  | Kontext | Hinweise                                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | Standard, Schlussfolgern, Bildverarbeitung    |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | Schlussfolgern                                |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | Allgemein                                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | Allgemein                                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | Allgemein, Werkzeuge deaktiviert              |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | Schlussfolgern                                |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | Allgemein                                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | Programmierung                                |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | Programmierung                                |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | Schlussfolgern, Bildverarbeitung              |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | Allgemein                                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Bildverarbeitung)      | 256k    | Bildverarbeitung                              |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | Schnell, Schlussfolgern                       |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | Schlussfolgern, Werkzeuge deaktiviert         |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | Unzensiert, Werkzeuge deaktiviert             |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | Bildverarbeitung                              |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | Bildverarbeitung                              |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | Allgemein                                     |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | Allgemein                                     |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | Schlussfolgern                                |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | Allgemein                                     |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | Schlussfolgern                                |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | Schlussfolgern                                |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | Schlussfolgern                                |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | Schlussfolgern                                |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | Schlussfolgern                                |
  </Accordion>

  <Accordion title="Anonymisierte Modelle (12) — über den Venice-Proxy">
    | Modell-ID                        | Name                             | Kontext | Hinweise                                  |
    | -------------------------------- | -------------------------------- | ------- | ----------------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (über Venice)    | 1M      | Schlussfolgern, Bildverarbeitung          |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (über Venice)  | 1M      | Schlussfolgern, Bildverarbeitung          |
    | `openai-gpt-54`                 | GPT-5.4 (über Venice)            | 1M      | Schlussfolgern, Bildverarbeitung          |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (über Venice)      | 400k    | Schlussfolgern, Bildverarbeitung, Programmierung |
    | `openai-gpt-52`                 | GPT-5.2 (über Venice)            | 256k    | Schlussfolgern                            |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (über Venice)      | 256k    | Schlussfolgern, Bildverarbeitung, Programmierung |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (über Venice)             | 128k    | Bildverarbeitung                          |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (über Venice)        | 128k    | Bildverarbeitung                          |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (über Venice)     | 1M      | Schlussfolgern, Bildverarbeitung          |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (über Venice)       | 198k    | Schlussfolgern, Bildverarbeitung          |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (über Venice)     | 256k    | Schlussfolgern, Bildverarbeitung          |
    | `grok-41-fast`                  | Grok 4.1 Fast (über Venice)      | 1M      | Schlussfolgern, Bildverarbeitung          |
  </Accordion>
</AccordionGroup>

Grok-basierte Venice-Modelle (`grok-41-fast` und ähnliche) erhalten denselben
Kompatibilitätspatch für Werkzeugschemas wie der native xAI-Provider, da sie dasselbe vorgelagerte
Format für Werkzeugaufrufe verwenden.

## Modellerkennung

Der oben aufgeführte integrierte Katalog ist eine manifestgestützte Ausgangsliste. Zur Laufzeit aktualisiert OpenClaw
ihn über die Venice-API `/models` und greift auf die Ausgangsliste zurück, wenn
die API nicht erreichbar ist. Der Endpunkt `/models` ist öffentlich (für die
Auflistung ist keine Authentifizierung erforderlich), die Inferenz erfordert jedoch einen gültigen API-Schlüssel.

## Wiedergabeverhalten von DeepSeek V4

Wenn Venice DeepSeek-V4-Modelle wie `deepseek-v4-pro` oder
`deepseek-v4-flash` bereitstellt, ergänzt OpenClaw in Assistentennachrichten das erforderliche
Wiedergabefeld `reasoning_content`, wenn Venice es auslässt, und entfernt `thinking`/
`reasoning`/`reasoning_effort` aus der Anfragenutzlast (Venice lehnt
die native `thinking`-Steuerung von DeepSeek bei diesen Modellen ab). Diese Wiedergabekorrektur ist
von den eigenen Denksteuerungen des nativen DeepSeek-Providers getrennt.

## Streaming- und Werkzeugunterstützung

| Funktion         | Unterstützung                                             |
| ---------------- | --------------------------------------------------------- |
| Streaming        | Alle Modelle                                               |
| Funktionsaufrufe | Die meisten Modelle; je Modell deaktiviert, siehe oben    |
| Bildverarbeitung | Oben mit „Bildverarbeitung“ gekennzeichnete Modelle       |
| JSON-Modus       | Über `response_format`                                    |

## Preise

Venice verwendet ein guthabenbasiertes System. Anonymisierte Modelle kosten ungefähr so viel wie
die direkte API-Nutzung zuzüglich einer kleinen Venice-Gebühr. Die aktuellen Preise finden Sie unter
[venice.ai/pricing](https://venice.ai/pricing).

## Anwendungsbeispiele

```bash
# Default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="API-Schlüssel wird nicht erkannt">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Vergewissern Sie sich, dass der Schlüssel mit `vapi_` beginnt.

  </Accordion>

  <Accordion title="Modell nicht verfügbar">
    Führen Sie `openclaw models list --all --provider venice` aus, um die derzeit
    verfügbaren Modelle anzuzeigen. Der Katalog ändert sich, wenn Venice Modelle hinzufügt oder ausmustert.
  </Accordion>

  <Accordion title="Verbindungsprobleme">
    Die Venice-API befindet sich unter `https://api.venice.ai/api/v1`. Vergewissern Sie sich, dass Ihr Netzwerk HTTPS-Verbindungen zu diesem Host zulässt.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [Häufig gestellte Fragen](/de/help/faq).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Beispiel für eine Konfigurationsdatei">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice-AI-Startseite und Kontoregistrierung.
  </Card>
  <Card title="API-Dokumentation" href="https://docs.venice.ai" icon="book">
    Venice-API-Referenz und Entwicklerdokumentation.
  </Card>
  <Card title="Preise" href="https://venice.ai/pricing" icon="credit-card">
    Aktuelle Venice-Guthabentarife und -Pläne.
  </Card>
</CardGroup>
