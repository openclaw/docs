---
read_when:
    - Sie möchten Hugging Face Inference mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für das HF-Token oder die CLI-Authentifizierungsoption.
summary: Einrichtung von Hugging Face Inference (Authentifizierung + Modellauswahl)
title: Hugging Face (Inferenz)
x-i18n:
    generated_at: "2026-07-12T02:04:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) stellt einen OpenAI-kompatiblen Router für Chat Completions bereit, der mit einem einzigen Token den Zugriff auf zahlreiche gehostete Modelle (DeepSeek, Llama und weitere) ermöglicht. OpenClaw kommuniziert **ausschließlich mit dem Chat-Completions-Endpunkt**; für Text-zu-Bild, Embeddings oder Sprache verwenden Sie direkt die [HF-Inferenz-Clients](https://huggingface.co/docs/api-inference/quicktour).

| Eigenschaft       | Wert                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Provider-ID       | `huggingface`                                                                                                                      |
| Plugin            | gebündelt (standardmäßig aktiviert, keine Installation erforderlich)                                                              |
| Authentifizierungs-Umgebungsvariable | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` (feingranulares Token)                                                    |
| API               | OpenAI-kompatibel (`https://router.huggingface.co/v1`)                                                                             |
| Abrechnung        | Ein einziges HF-Token; die [Preisgestaltung](https://huggingface.co/docs/inference-providers/pricing) richtet sich nach den Tarifen der Provider und umfasst ein kostenloses Kontingent |

## Erste Schritte

<Steps>
  <Step title="Feingranulares Token erstellen">
    Öffnen Sie [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) und erstellen Sie ein neues feingranulares Token.

    <Warning>
    Für das Token muss die Berechtigung **Make calls to Inference Providers** aktiviert sein, andernfalls werden API-Anfragen abgelehnt.
    </Warning>

  </Step>
  <Step title="Ersteinrichtung ausführen">
    Wählen Sie im Provider-Dropdown **Hugging Face** aus und geben Sie bei der Aufforderung Ihren API-Schlüssel ein:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Standardmodell auswählen">
    Wählen Sie im Dropdown **Default Hugging Face model** ein Modell aus. Bei einem gültigen Token wird die Liste aus der Inference API geladen; andernfalls zeigt OpenClaw den unten aufgeführten integrierten Katalog an. Ihre Auswahl wird als `agents.defaults.model.primary` gespeichert:

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

| Modell                       | Referenz (mit Präfix `huggingface/`)       |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
Wenn Ihr Token gültig ist, erkennt OpenClaw während der Ersteinrichtung und beim Start des Gateway außerdem alle weiteren Modelle über **GET** `https://router.huggingface.co/v1/models`, sodass Ihr Katalog weit mehr als die vier oben aufgeführten Modelle enthalten kann. Sie können an jede Modell-ID `:fastest` oder `:cheapest` anhängen; der Router von HF leitet die Anfrage an den passenden Inferenz-Provider weiter. Legen Sie Ihre standardmäßige Provider-Reihenfolge in den [Inference Provider settings](https://hf.co/settings/inference-providers) fest.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Modellerkennung und Dropdown bei der Ersteinrichtung">
    OpenClaw erkennt Modelle mit:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    Die Antwort verwendet das OpenAI-Format: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Wenn ein Schlüssel konfiguriert ist (über die Ersteinrichtung, `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`), wird das Dropdown **Default Hugging Face model** während der interaktiven Einrichtung über diesen Endpunkt befüllt. Beim Start des Gateway wird derselbe Aufruf erneut ausgeführt, um den Katalog zu aktualisieren. Erkannte Modelle werden mit dem oben aufgeführten integrierten Katalog zusammengeführt, der bei übereinstimmender ID für Metadaten wie Kontextfenster und Kosten verwendet wird. Wenn die Anfrage fehlschlägt, keine Daten zurückgibt oder kein Schlüssel festgelegt ist, greift OpenClaw ausschließlich auf den integrierten Katalog zurück.

    So deaktivieren Sie die Erkennung, ohne den Provider zu entfernen:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Modellnamen, Aliasse und Richtliniensuffixe">
    - **Name aus der API:** Erkannte Modelle verwenden den API-Wert `name`, `title` oder `display_name`, sofern vorhanden; andernfalls leitet OpenClaw einen Namen aus der Modell-ID ab (beispielsweise wird `deepseek-ai/DeepSeek-R1` zu „DeepSeek R1“).
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

    - **Richtliniensuffixe:** `:fastest` und `:cheapest` sind Konventionen des HF-Routers und werden von OpenClaw nicht umgeschrieben: Das Suffix wird unverändert als Bestandteil der Modell-ID gesendet, und der Router von HF wählt den passenden Inferenz-Provider aus. Fügen Sie jede Variante als eigenen Eintrag unter `models.providers.huggingface.models` oder in `model.primary` hinzu, wenn Sie für jedes Suffix einen eigenen Alias verwenden möchten.
    - **Zusammenführen der Konfiguration:** Vorhandene Einträge in `models.providers.huggingface.models` (beispielsweise in `models.json`) bleiben beim Zusammenführen der Konfiguration erhalten. Dadurch bleiben alle dort festgelegten benutzerdefinierten Werte für `name`, `alias` oder Modelloptionen über Neustarts hinweg bestehen.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` für diesen Prozess verfügbar ist, beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`.

    <Note>
    OpenClaw akzeptiert sowohl `HUGGINGFACE_HUB_TOKEN` als auch `HF_TOKEN`. Wenn beide festgelegt sind, hat `HUGGINGFACE_HUB_TOKEN` Vorrang.
    </Note>

  </Accordion>

  <Accordion title="Konfiguration: DeepSeek R1 mit Ausweichmodell">
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

  <Accordion title="Konfiguration: DeepSeek mit günstigster und schnellster Variante">
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

  <Accordion title="Konfiguration: DeepSeek + Llama + GPT-OSS mit Aliassen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
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
    Übersicht über alle Provider, Modellreferenzen und das Ausweichverhalten.
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
