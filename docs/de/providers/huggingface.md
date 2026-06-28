---
read_when:
    - Sie möchten Hugging Face Inference mit OpenClaw verwenden
    - Sie benötigen die HF-Token-Umgebungsvariable oder die CLI-Auth-Auswahl
summary: Einrichtung von Hugging Face Inference (Authentifizierung + Modellauswahl)
title: Hugging Face (Inferenz)
x-i18n:
    generated_at: "2026-04-24T06:54:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
    postprocess_version: locale-links-v1
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) bieten OpenAI-kompatible Chat Completions über eine einzige Router-API. Sie erhalten mit einem Token Zugriff auf viele Modelle (DeepSeek, Llama und mehr). OpenClaw verwendet den **OpenAI-kompatiblen Endpunkt** (nur Chat Completions); für Text-zu-Bild, Embeddings oder Sprache verwenden Sie die [HF-Inferenz-Clients](https://huggingface.co/docs/api-inference/quicktour) direkt.

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` (feingranulares Token mit **Make calls to Inference Providers**)
- API: OpenAI-kompatibel (`https://router.huggingface.co/v1`)
- Abrechnung: Ein einzelnes HF-Token; [Preise](https://huggingface.co/docs/inference-providers/pricing) folgen den Provider-Tarifen mit einer kostenlosen Stufe.

## Erste Schritte

<Steps>
  <Step title="Feingranulares Token erstellen">
    Gehen Sie zu [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) und erstellen Sie ein neues feingranulares Token.

    <Warning>
    Das Token muss die Berechtigung **Make calls to Inference Providers** aktiviert haben, sonst werden API-Anfragen abgewiesen.
    </Warning>

  </Step>
  <Step title="Onboarding ausführen">
    Wählen Sie **Hugging Face** im Provider-Dropdown aus und geben Sie dann Ihren API-Schlüssel ein, wenn Sie dazu aufgefordert werden:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Ein Standardmodell auswählen">
    Wählen Sie im Dropdown **Default Hugging Face model** das gewünschte Modell aus. Die Liste wird aus der Inference API geladen, wenn Sie ein gültiges Token haben; andernfalls wird eine integrierte Liste angezeigt. Ihre Auswahl wird als Standardmodell gespeichert.

    Sie können das Standardmodell später auch in der Konfiguration setzen oder ändern:

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
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Nicht-interaktives Setup

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Dadurch wird `huggingface/deepseek-ai/DeepSeek-R1` als Standardmodell gesetzt.

## Modell-IDs

Modellreferenzen verwenden die Form `huggingface/<org>/<model>` (Hub-Stil-IDs). Die folgende Liste stammt von **GET** `https://router.huggingface.co/v1/models`; Ihr Katalog kann mehr enthalten.

| Modell                | Ref (mit Präfix `huggingface/`)     |
| --------------------- | ----------------------------------- |
| DeepSeek R1           | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2         | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B              | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct   | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B             | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B          | `openai/gpt-oss-120b`               |
| GLM 4.7               | `zai-org/GLM-4.7`                   |
| Kimi K2.5             | `moonshotai/Kimi-K2.5`              |

<Tip>
Sie können an jede Modell-ID `:fastest` oder `:cheapest` anhängen. Legen Sie Ihre Standardreihenfolge in den [Inference Provider settings](https://hf.co/settings/inference-providers) fest; siehe [Inference Providers](https://huggingface.co/docs/inference-providers) und **GET** `https://router.huggingface.co/v1/models` für die vollständige Liste.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Modellerkennung und Onboarding-Dropdown">
    OpenClaw erkennt Modelle, indem der **Inference-Endpunkt direkt** aufgerufen wird:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Optional: senden Sie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` oder `$HF_TOKEN` für die vollständige Liste; einige Endpunkte geben ohne Auth nur eine Teilmenge zurück.) Die Antwort entspricht dem OpenAI-Stil: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Wenn Sie einen Hugging-Face-API-Schlüssel konfigurieren (über Onboarding, `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`), verwendet OpenClaw dieses GET, um verfügbare Chat-Completion-Modelle zu erkennen. Während des **interaktiven Setups** sehen Sie nach Eingabe Ihres Tokens ein Dropdown **Default Hugging Face model**, das aus dieser Liste befüllt wird (oder aus dem integrierten Katalog, wenn die Anfrage fehlschlägt). Zur Laufzeit (z. B. beim Gateway-Start) ruft OpenClaw, wenn ein Schlüssel vorhanden ist, erneut **GET** `https://router.huggingface.co/v1/models` auf, um den Katalog zu aktualisieren. Die Liste wird mit einem integrierten Katalog zusammengeführt (für Metadaten wie Kontextfenster und Kosten). Wenn die Anfrage fehlschlägt oder kein Schlüssel gesetzt ist, wird nur der integrierte Katalog verwendet.

  </Accordion>

  <Accordion title="Modellnamen, Aliasse und Richtlinien-Suffixe">
    - **Name aus der API:** Der Anzeigename des Modells wird **aus GET /v1/models abgeleitet**, wenn die API `name`, `title` oder `display_name` zurückgibt; andernfalls wird er aus der Modell-ID abgeleitet (z. B. wird `deepseek-ai/DeepSeek-R1` zu „DeepSeek R1“).
    - **Anzeigenamen überschreiben:** Sie können pro Modell ein benutzerdefiniertes Label in der Konfiguration setzen, sodass es in CLI und UI so erscheint, wie Sie es möchten:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (schnell)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (günstig)" },
          },
        },
      },
    }
    ```

    - **Richtlinien-Suffixe:** Die gebündelten Hugging-Face-Dokumente und -Helfer in OpenClaw behandeln derzeit diese beiden Suffixe als integrierte Richtlinienvarianten:
      - **`:fastest`** — höchster Durchsatz.
      - **`:cheapest`** — niedrigste Kosten pro Ausgabetoken.

      Sie können diese als separate Einträge in `models.providers.huggingface.models` hinzufügen oder `model.primary` mit dem Suffix setzen. Sie können Ihre Standardreihenfolge für Provider auch in den [Inference Provider settings](https://hf.co/settings/inference-providers) festlegen (ohne Suffix = diese Reihenfolge verwenden).

    - **Zusammenführung der Konfiguration:** Bestehende Einträge in `models.providers.huggingface.models` (z. B. in `models.json`) bleiben beim Zusammenführen der Konfiguration erhalten. Daher bleiben benutzerdefinierte Werte für `name`, `alias` oder Modelloptionen, die Sie dort setzen, erhalten.

  </Accordion>

  <Accordion title="Umgebung und Daemon-Setup">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Note>
    OpenClaw akzeptiert sowohl `HUGGINGFACE_HUB_TOKEN` als auch `HF_TOKEN` als Aliasse für Umgebungsvariablen. Beide funktionieren; wenn beide gesetzt sind, hat `HUGGINGFACE_HUB_TOKEN` Vorrang.
    </Note>

  </Accordion>

  <Accordion title="Konfiguration: DeepSeek R1 mit Qwen-Fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: Qwen mit cheapest- und fastest-Varianten">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (am günstigsten)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (am schnellsten)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: DeepSeek + Llama + GPT-OSS mit Aliasen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: Mehrere Qwen- und DeepSeek-Modelle mit Richtlinien-Suffixen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (günstig)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (schnell)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
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
    Überblick über alle Provider, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie Modelle ausgewählt und konfiguriert werden.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Offizielle Dokumentation zu Hugging Face Inference Providers.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
