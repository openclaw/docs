---
read_when:
    - Sie möchten datenschutzorientierte Inferenz in OpenClaw.
    - Sie möchten eine Anleitung zum Einrichten von Venice AI.
summary: Verwenden Sie datenschutzorientierte Modelle von Venice AI in OpenClaw
title: Venice AI
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:38:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI bietet **datenschutzorientierte KI-Inferenz** mit Unterstützung für unzensierte Modelle und Zugriff auf große proprietäre Modelle über den anonymisierten Proxy. Alle Inferenz ist standardmäßig privat — kein Training mit Ihren Daten, keine Protokollierung.

## Warum Venice in OpenClaw

- **Private Inferenz** für Open-Source-Modelle (keine Protokollierung).
- **Unzensierte Modelle**, wenn Sie sie benötigen.
- **Anonymisierter Zugriff** auf proprietäre Modelle (Opus/GPT/Gemini), wenn Qualität entscheidend ist.
- OpenAI-kompatible `/v1`-Endpunkte.

## Datenschutzmodi

Venice bietet zwei Datenschutzstufen — diese zu verstehen ist entscheidend für die Wahl Ihres Modells:

| Modus          | Beschreibung                                                                                                                        | Modelle                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Privat**     | Vollständig privat. Prompts/Antworten werden **niemals gespeichert oder protokolliert**. Ephemer.                                  | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored usw. |
| **Anonymisiert** | Über Venice weitergeleitet, wobei Metadaten entfernt werden. Der zugrunde liegende Provider (OpenAI, Anthropic, Google, xAI) sieht anonymisierte Anfragen. | Claude, GPT, Gemini, Grok                                    |

<Warning>
Anonymisierte Modelle sind **nicht** vollständig privat. Venice entfernt Metadaten vor der Weiterleitung, aber der zugrunde liegende Provider (OpenAI, Anthropic, Google, xAI) verarbeitet die Anfrage weiterhin. Wählen Sie **private** Modelle, wenn vollständiger Datenschutz erforderlich ist.
</Warning>

## Funktionen

- **Datenschutzorientiert**: Wählen Sie zwischen den Modi „privat“ (vollständig privat) und „anonymisiert“ (weitergeleitet)
- **Unzensierte Modelle**: Zugriff auf Modelle ohne Inhaltsbeschränkungen
- **Zugriff auf große Modelle**: Verwenden Sie Claude, GPT, Gemini und Grok über den anonymisierten Proxy von Venice
- **OpenAI-kompatible API**: Standardmäßige `/v1`-Endpunkte für einfache Integration
- **Streaming**: Bei allen Modellen unterstützt
- **Function Calling**: Bei ausgewählten Modellen unterstützt (Modellfähigkeiten prüfen)
- **Vision**: Bei Modellen mit Vision-Fähigkeit unterstützt
- **Keine harten Ratenlimits**: Bei extremer Nutzung kann Fair-Use-Drosselung gelten

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    1. Registrieren Sie sich unter [venice.ai](https://venice.ai)
    2. Gehen Sie zu **Settings > API Keys > Create new key**
    3. Kopieren Sie Ihren API-Schlüssel (Format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw konfigurieren">
    Wählen Sie Ihre bevorzugte Einrichtungsmethode:

    <Tabs>
      <Tab title="Interaktiv (empfohlen)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Dadurch geschieht Folgendes:
        1. Es wird nach Ihrem API-Schlüssel gefragt (oder `VENICE_API_KEY` wird verwendet, falls vorhanden)
        2. Alle verfügbaren Venice-Modelle werden angezeigt
        3. Sie können Ihr Standardmodell auswählen
        4. Der Provider wird automatisch konfiguriert
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
  <Step title="Einrichtung prüfen">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Modellauswahl

Nach der Einrichtung zeigt OpenClaw alle verfügbaren Venice-Modelle an. Wählen Sie je nach Bedarf:

- **Standardmodell**: `venice/kimi-k2-5` für starke private Reasoning-Fähigkeiten plus Vision.
- **Option mit hoher Leistungsfähigkeit**: `venice/claude-opus-4-6` für den stärksten anonymisierten Venice-Pfad.
- **Datenschutz**: Wählen Sie „private“ Modelle für vollständig private Inferenz.
- **Fähigkeiten**: Wählen Sie „anonymisierte“ Modelle, um über den Venice-Proxy auf Claude, GPT und Gemini zuzugreifen.

Ändern Sie Ihr Standardmodell jederzeit:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Alle verfügbaren Modelle auflisten:

```bash
openclaw models list | grep venice
```

Sie können auch `openclaw configure` ausführen, **Model/auth** auswählen und **Venice AI** wählen.

<Tip>
Verwenden Sie die folgende Tabelle, um das richtige Modell für Ihren Anwendungsfall auszuwählen.

| Anwendungsfall            | Empfohlenes Modell              | Warum                                        |
| ------------------------- | ------------------------------- | -------------------------------------------- |
| **Allgemeiner Chat (Standard)** | `kimi-k2-5`               | Starke private Reasoning-Fähigkeiten plus Vision |
| **Beste Gesamtqualität**  | `claude-opus-4-6`               | Stärkste anonymisierte Venice-Option         |
| **Datenschutz + Coding**  | `qwen3-coder-480b-a35b-instruct` | Privates Coding-Modell mit großem Kontext    |
| **Private Vision**        | `kimi-k2-5`                     | Vision-Unterstützung, ohne den privaten Modus zu verlassen |
| **Schnell + günstig**     | `qwen3-4b`                      | Leichtgewichtiges Reasoning-Modell           |
| **Komplexe private Aufgaben** | `deepseek-v3.2`             | Starkes Reasoning, aber keine Venice-Tool-Unterstützung |
| **Unzensiert**            | `venice-uncensored`             | Keine Inhaltsbeschränkungen                  |

</Tip>

## DeepSeek V4-Replay-Verhalten

Wenn Venice DeepSeek-V4-Modelle wie `venice/deepseek-v4-pro` oder
`venice/deepseek-v4-flash` bereitstellt, füllt OpenClaw den erforderlichen
Replay-Platzhalter `reasoning_content` von DeepSeek V4 bei Assistant-Tool-Call-Turns auf, wenn der
Proxy ihn weglässt. Venice lehnt DeepSeeks native Steuerung `thinking` auf der obersten Ebene ab,
deshalb hält OpenClaw diese providerspezifische Replay-Korrektur getrennt von den nativen
Thinking-Steuerungen des DeepSeek-Providers.

## Integrierter Katalog (insgesamt 41)

<AccordionGroup>
  <Accordion title="Private Modelle (26) — vollständig privat, keine Protokollierung">
    | Modell-ID                              | Name                                | Kontext | Funktionen                 |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Standard, Reasoning, Vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Allgemein                  |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Allgemein                  |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | Allgemein, Tools deaktiviert |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Allgemein                  |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coding                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coding                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Reasoning, Vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Allgemein                  |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Schnell, Reasoning         |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Reasoning, Tools deaktiviert |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Unzensiert, Tools deaktiviert |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Allgemein                  |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Allgemein                  |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Allgemein                  |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Reasoning                  |
  </Accordion>

  <Accordion title="Anonymisierte Modelle (15) — über Venice-Proxy">
    | Modell-ID                       | Name                           | Kontext | Funktionen                |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (über Venice)  | 1M      | Reasoning, Vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (über Venice)  | 198k    | Reasoning, Vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (über Venice) | 1M     | Reasoning, Vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (über Venice) | 198k   | Reasoning, Vision         |
    | `openai-gpt-54`                 | GPT-5.4 (über Venice)          | 1M      | Reasoning, Vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (über Venice)    | 400k    | Reasoning, Vision, Coding |
    | `openai-gpt-52`                 | GPT-5.2 (über Venice)          | 256k    | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (über Venice)    | 256k    | Reasoning, Vision, Coding |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (über Venice)           | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (über Venice)      | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (über Venice)   | 1M      | Reasoning, Vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (über Venice)     | 198k    | Reasoning, Vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (über Venice)   | 256k    | Reasoning, Vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (über Venice)    | 1M      | Reasoning, Vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (über Venice) | 256k    | Reasoning, Coding         |
  </Accordion>
</AccordionGroup>

## Modellerkennung

OpenClaw erkennt Modelle automatisch über die Venice-API, wenn `VENICE_API_KEY` gesetzt ist. Wenn die API nicht erreichbar ist, wird auf einen statischen Katalog zurückgegriffen.

Der Endpunkt `/models` ist öffentlich zugänglich (keine Authentifizierung zum Auflisten erforderlich), aber Inferenz erfordert einen gültigen API-Schlüssel.

## Streaming und Tool-Unterstützung

| Funktion             | Unterstützung                                        |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Alle Modelle                                         |
| **Function Calling** | Die meisten Modelle (in der API `supportsFunctionCalling` prüfen) |
| **Vision/Bilder**    | Modelle, die mit der Funktion „Vision“ gekennzeichnet sind |
| **JSON-Modus**       | Über `response_format` unterstützt                   |

## Preise

Venice verwendet ein kreditbasiertes System. Aktuelle Preise finden Sie unter [venice.ai/pricing](https://venice.ai/pricing):

- **Private Modelle**: Im Allgemeinen kostengünstiger
- **Anonymisierte Modelle**: Ähnlich wie direkte API-Preise + kleine Venice-Gebühr

### Venice (anonymisiert) vs. direkte API

| Aspekt       | Venice (anonymisiert)          | Direkte API         |
| ------------ | ------------------------------ | ------------------- |
| **Datenschutz** | Metadaten entfernt, anonymisiert | Mit Ihrem Konto verknüpft |
| **Latenz**   | +10–50 ms (Proxy)              | Direkt              |
| **Funktionen** | Die meisten Funktionen unterstützt | Vollständige Funktionen |
| **Abrechnung** | Venice-Credits                | Provider-Abrechnung |

## Anwendungsbeispiele

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="API-Schlüssel wird nicht erkannt">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Stellen Sie sicher, dass der Schlüssel mit `vapi_` beginnt.

  </Accordion>

  <Accordion title="Modell nicht verfügbar">
    Der Venice-Modellkatalog wird dynamisch aktualisiert. Führen Sie `openclaw models list` aus, um die aktuell verfügbaren Modelle anzuzeigen. Einige Modelle können vorübergehend offline sein.
  </Accordion>

  <Accordion title="Verbindungsprobleme">
    Die Venice-API befindet sich unter `https://api.venice.ai/api/v1`. Stellen Sie sicher, dass Ihr Netzwerk HTTPS-Verbindungen zulässt.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Beispiel für Konfigurationsdatei">
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

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI-Startseite und Kontoanmeldung.
  </Card>
  <Card title="API-Dokumentation" href="https://docs.venice.ai" icon="book">
    Venice-API-Referenz und Entwicklerdokumentation.
  </Card>
  <Card title="Preise" href="https://venice.ai/pricing" icon="credit-card">
    Aktuelle Venice-Credit-Preise und Tarife.
  </Card>
</CardGroup>
