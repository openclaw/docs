---
read_when:
    - Sie möchten offene Modelle in OpenClaw kostenlos verwenden
    - Sie müssen NVIDIA_API_KEY einrichten
    - Sie möchten Nemotron 3 Ultra über NVIDIA verwenden
summary: Verwenden Sie NVIDIAs OpenAI-kompatible API in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T15:43:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA stellt offene Modelle kostenlos über eine OpenAI-kompatible API unter
`https://integrate.api.nvidia.com/v1` bereit. Die Authentifizierung erfolgt mit einem API-Schlüssel von
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
verwendet für den NVIDIA-Provider standardmäßig Nemotron 3 Ultra, NVIDIAs Reasoning-Modell mit insgesamt 550B / 55B
aktiven Parametern für agentische Aufgaben mit langem Kontext.

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Schlüssel exportieren und Onboarding ausführen">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Ein NVIDIA-Modell festlegen">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Übergeben Sie den Schlüssel für eine nicht interaktive Einrichtung direkt:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
Mit `--nvidia-api-key` gelangt der Schlüssel in den Shell-Verlauf und die Ausgabe von `ps`. Verwenden Sie nach Möglichkeit
die Umgebungsvariable `NVIDIA_API_KEY`.
</Warning>

## Konfigurationsbeispiel

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Hervorgehobener Katalog

Wenn ein NVIDIA-API-Schlüssel konfiguriert ist, rufen die Einrichtungs- und Modellauswahlpfade
NVIDIAs öffentlichen Katalog hervorgehobener Modelle von
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` ab und
speichern das Ergebnis 24 Stunden lang im Cache (die ersten 32 Einträge, als Zeilen mit Freitexteingabe
importiert). Neue hervorgehobene Modelle von build.nvidia.com erscheinen daher in den Einrichtungs- und
Modellauswahloberflächen, ohne dass auf eine OpenClaw-Veröffentlichung gewartet werden muss. Wenn der
Live-Feed verfügbar ist, ist das erste zurückgegebene Modell während der NVIDIA-Einrichtung
vorausgewählt.

Der Abruf verwendet eine feste HTTPS-Host-Richtlinie für `assets.ngc.nvidia.com`. Wenn kein
NVIDIA-API-Schlüssel konfiguriert oder der Feed nicht verfügbar beziehungsweise fehlerhaft ist,
greift OpenClaw auf den unten aufgeführten integrierten Katalog und Standardwert zurück.

## Nemotron 3 Ultra

Nemotron 3 Ultra ist das standardmäßige NVIDIA-Modell in OpenClaw. NVIDIAs Build-Seite für
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
führt es als verfügbaren kostenlosen Endpunkt mit einer Kontextangabe von 1M Token auf.

Die integrierte Ultra-Zeile sendet standardmäßig
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`,
damit die normale Chat-Ausgabe in der sichtbaren Antwort verbleibt, anstatt
Reasoning-Text offenzulegen.

Verwenden Sie Ultra als leistungsfähigste NVIDIA-Standardoption. Lassen Sie Super ausgewählt, wenn
Sie die kleinere Nemotron-3-Option wünschen, oder wählen Sie eines der Drittanbietermodelle
aus NVIDIAs Katalog, wenn dessen Kontext, Latenz oder Verhalten besser geeignet ist.

## Integrierter Fallback-Katalog

Die auswählbaren integrierten Zeilen sind eine Momentaufnahme von NVIDIAs Katalog hervorgehobener Modelle. Veraltete
Kompatibilitätszeilen bleiben über ihre exakte Referenz auflösbar, werden jedoch nicht in der
Modellauswahl angezeigt.

| Modellreferenz                             | Name                  | Kontext   | Max. Ausgabe |
| ------------------------------------------ | --------------------- | --------- | ------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192        |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192        |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192        |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192        |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192        |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384       |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384       |

Der vollständige Kompatibilitätskatalog enthält für bestehende Konfigurationen außerdem weiterhin diese
veröffentlichten Referenzen: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` und
`nvidia/minimaxai/minimax-m2.7`. Sie bleiben über ihre exakte Referenz verfügbar, erscheinen jedoch
nie im Onboarding oder in der Modellauswahl.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Automatische Aktivierung">
    Der Provider wird automatisch aktiviert, wenn die Umgebungsvariable `NVIDIA_API_KEY`
    gesetzt ist oder während des Onboardings ein Schlüssel gespeichert wurde. Über den Schlüssel hinaus ist keine
    explizite Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Katalog und Preise">
    OpenClaw bevorzugt NVIDIAs öffentlichen Katalog hervorgehobener Modelle, wenn die NVIDIA-Authentifizierung
    konfiguriert ist, und speichert ihn 24 Stunden lang im Cache. Der integrierte auswählbare Fallback ist eine
    statische Momentaufnahme von NVIDIAs Katalog hervorgehobener Modelle; veraltete Kompatibilitätszeilen,
    die nur über exakte Referenzen verfügbar sind, werden in der Modellauswahl ausgeblendet. Die Kosten sind im
    Quellcode standardmäßig auf `0` gesetzt, da NVIDIA derzeit kostenlosen API-Zugriff für die aufgeführten Modelle anbietet.
  </Accordion>

  <Accordion title="OpenAI-kompatibler Endpunkt">
    OpenClaw kommuniziert mit NVIDIA über den Adapter `openai-completions` und die
    standardmäßige Chat-Completions-Route `/v1`. Alle OpenAI-kompatiblen Werkzeuge sollten
    mit der NVIDIA-Basis-URL ohne weitere Konfiguration funktionieren.
  </Accordion>

  <Accordion title="Reasoning-Parameter für Nemotron 3 Ultra">
    NVIDIAs Ultra-Beispielanfrage verwendet `chat_template_kwargs.enable_thinking`
    und `reasoning_budget` für die Reasoning-Ausgabe. Die integrierte Ultra-Zeile von OpenClaw
    deaktiviert Template-Thinking standardmäßig für die normale Chat-Nutzung. Wenn Sie die
    NVIDIA-Reasoning-Ausgabe aktivieren oder andere NVIDIA-spezifische Anfragefelder
    erzwingen müssen, legen Sie modellspezifische Parameter fest und beschränken Sie Provider-spezifische Überschreibungen auf
    das NVIDIA-Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` wird mit bereits in der Anfrage vorhandenen
    `chat_template_kwargs` zusammengeführt, anstatt das gesamte Objekt zu ersetzen.
    `params.extra_body` ist die abschließende OpenAI-kompatible Überschreibung des Anfragekörpers
    und überschreibt kollidierende Nutzlastschlüssel. Verwenden Sie es daher nur für Felder, die NVIDIA
    für den ausgewählten Endpunkt dokumentiert.

  </Accordion>

  <Accordion title="Langsame Antworten benutzerdefinierter Provider">
    Einige von NVIDIA gehostete benutzerdefinierte Modelle benötigen möglicherweise länger als der standardmäßige Modell-Inaktivitäts-Watchdog von ~120s,
    bevor sie das erste Antwortfragment ausgeben. Erhöhen Sie für benutzerdefinierte
    NVIDIA-Provider-Einträge den Provider-Timeout statt des Timeouts der gesamten
    Agent-Laufzeit; `timeoutSeconds` gilt für Provider-HTTP-Anfragen und
    erhöht die Obergrenze des Inaktivitäts-/Stream-Watchdogs für diesen Provider:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-Modelle können derzeit kostenlos verwendet werden. Aktuelle Informationen zur Verfügbarkeit und
zu Ratenbegrenzungen finden Sie unter [build.nvidia.com](https://build.nvidia.com/).
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
