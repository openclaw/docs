---
read_when:
    - Sie möchten Hugging Face Inference mit OpenClaw verwenden
    - Sie benötigen entweder die Umgebungsvariable für das HF-Token oder die CLI-Authentifizierungsoption.
summary: Hugging-Face-Inference-Einrichtung (Authentifizierung + Modellauswahl)
title: Hugging Face (Inferenz)
x-i18n:
    generated_at: "2026-07-24T04:03:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 92c400b78c5ad2cc724ad4029560dccc5bc2006fdeae400fc6b58998e727e17c
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) stellt einen OpenAI-kompatiblen Router für Chat Completions bereit, der mit einem einzigen Token den Zugriff auf viele gehostete Modelle (DeepSeek, Llama und weitere) ermöglicht. OpenClaw kommuniziert **ausschließlich mit dem Chat-Completions-Endpunkt**; für Text-zu-Bild, Embeddings oder Sprache verwenden Sie direkt die [HF-Inference-Clients](https://huggingface.co/docs/api-inference/quicktour).

| Eigenschaft       | Wert                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Provider-ID       | `huggingface`                                                                                                                 |
| Plugin            | gebündelt (standardmäßig aktiviert, keine Installation erforderlich)                                                              |
| Authentifizierungs-Umgebungsvariable | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` (detailliert berechtigtes Token)                                   |
| API               | OpenAI-kompatibel (`https://router.huggingface.co/v1`)                                                                                             |
| Abrechnung        | Ein einzelnes HF-Token; die [Preisgestaltung](https://huggingface.co/docs/inference-providers/pricing) richtet sich nach den Tarifen der Provider und umfasst ein kostenloses Kontingent |

## Erste Schritte

<Steps>
  <Step title="Ein detailliert berechtigtes Token erstellen">
    Rufen Sie [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) auf und erstellen Sie ein neues detailliert berechtigtes Token.

    <Warning>
    Für das Token muss die Berechtigung **Make calls to Inference Providers** aktiviert sein, andernfalls werden API-Anfragen abgelehnt.
    </Warning>

  </Step>
  <Step title="Onboarding ausführen">
    Wählen Sie im Provider-Dropdown **Hugging Face** aus und geben Sie bei der Aufforderung Ihren API-Schlüssel ein:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Ein Standardmodell auswählen">
    Wählen Sie im Dropdown **Default Hugging Face model** ein Modell aus. Die Liste wird aus der Inference API geladen, wenn Ihr Token gültig ist; andernfalls zeigt OpenClaw den unten aufgeführten integrierten Katalog an. Ihre Auswahl wird als `agents.defaults.model.primary` gespeichert:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Legt `huggingface/deepseek-ai/DeepSeek-R1` als Standardmodell fest.

## Modell-IDs

Modellreferenzen verwenden das Format `huggingface/<org>/<model>` (IDs im Hub-Stil). Der integrierte Katalog von OpenClaw:

| Modell        | Referenz (mit Präfix `huggingface/`) |
| ------------- | ----------------------------------------- |
| DeepSeek R1   | `deepseek-ai/DeepSeek-R1`                        |
| DeepSeek V3.1 | `deepseek-ai/DeepSeek-V3.1`                        |
| GPT-OSS 120B  | `openai/gpt-oss-120b`                        |

<Tip>
Wenn Ihr Token gültig ist, erkennt OpenClaw beim Onboarding und beim Start des Gateways außerdem alle weiteren Modelle über **GET** `https://router.huggingface.co/v1/models`, sodass Ihr Katalog wesentlich mehr als die drei oben aufgeführten Modelle enthalten kann. Sie können `:fastest` oder `:cheapest` an jede Modell-ID anhängen; der Router von HF leitet die Anfrage an den entsprechenden Inference Provider weiter. Legen Sie Ihre standardmäßige Provider-Reihenfolge in den [Inference Provider settings](https://hf.co/settings/inference-providers) fest.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Modellerkennung und Onboarding-Dropdown">
    OpenClaw erkennt Modelle mit:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # oder $HF_TOKEN
    ```

    Die Antwort entspricht dem OpenAI-Stil: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Mit einem konfigurierten Schlüssel (Onboarding, `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`) wird das Dropdown **Default Hugging Face model** während der interaktiven Einrichtung über diesen Endpunkt befüllt. Beim Start des Gateways wird derselbe Aufruf wiederholt, um den Katalog zu aktualisieren. Erkannte Modelle werden mit dem oben aufgeführten integrierten Katalog zusammengeführt (dieser dient bei übereinstimmender ID für Metadaten wie Kontextfenster und Kosten). Wenn die Anfrage fehlschlägt, keine Daten zurückgibt oder kein Schlüssel festgelegt ist, verwendet OpenClaw ausschließlich den integrierten Katalog.

    So deaktivieren Sie die Erkennung, ohne den Provider zu entfernen:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Modellnamen, Aliasse und Richtliniensuffixe">
    - **Name aus der API:** Erkannte Modelle verwenden `name`, `title` oder `display_name` aus der API, sofern vorhanden; andernfalls leitet OpenClaw einen Namen aus der Modell-ID ab (z. B. wird `deepseek-ai/DeepSeek-R1` zu „DeepSeek R1“).
    - **Anzeigenamen überschreiben:** Legen Sie in der Konfiguration für jedes Modell eine benutzerdefinierte Bezeichnung fest:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Richtliniensuffixe:** `:fastest` und `:cheapest` sind Konventionen des HF-Routers und werden nicht von OpenClaw umgeschrieben: Das Suffix wird unverändert als Teil der Modell-ID gesendet, und der Router von HF wählt den entsprechenden Inference Provider aus. Fügen Sie jede Variante als eigenen Eintrag unter `models.providers.huggingface.models` (oder in `model.primary`) hinzu, wenn Sie für jedes Suffix einen eigenen Alias wünschen.
    - **Zusammenführung der Konfiguration:** Bestehende Einträge in `models.providers.huggingface.models` (z. B. in `models.json`) bleiben bei der Zusammenführung der Konfiguration erhalten, sodass alle dort festgelegten benutzerdefinierten `name`, `alias` oder Modelloptionen über Neustarts hinweg bestehen bleiben.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` für diesen Prozess verfügbar ist (beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Note>
    OpenClaw akzeptiert sowohl `HUGGINGFACE_HUB_TOKEN` als auch `HF_TOKEN`. Wenn beide festgelegt sind, hat `HUGGINGFACE_HUB_TOKEN` Vorrang.
    </Note>

  </Accordion>

  <Accordion title="Konfiguration: DeepSeek R1 mit Fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: DeepSeek mit günstigsten und schnellsten Varianten">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: DeepSeek + GPT-OSS mit Aliasen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
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
    Überblick über alle Provider, Modellreferenzen und das Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    So wählen und konfigurieren Sie Modelle.
  </Card>
  <Card title="Dokumentation zu Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Offizielle Dokumentation zu Hugging Face Inference Providers.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
