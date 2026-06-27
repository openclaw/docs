---
read_when:
    - Sie möchten offene Modelle in OpenClaw kostenlos nutzen
    - Sie müssen NVIDIA_API_KEY einrichten
    - Sie möchten Nemotron 3 Ultra über NVIDIA verwenden
summary: NVIDIAs OpenAI-kompatible API in OpenClaw verwenden
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:05:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA stellt unter `https://integrate.api.nvidia.com/v1` eine OpenAI-kompatible API für
offene Modelle kostenlos bereit. Authentifizieren Sie sich mit einem API-Schlüssel von
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
setzt den NVIDIA-Provider standardmäßig auf Nemotron 3 Ultra, NVIDIAs Reasoning-Modell mit insgesamt 550B / 55B
aktiven Parametern für agentische Arbeit mit langem Kontext.

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

<Warning>
Wenn Sie `--nvidia-api-key` statt der Umgebungsvariablen übergeben, landet der Wert in der Shell-
Historie und in der Ausgabe von `ps`. Verwenden Sie nach Möglichkeit die Umgebungsvariable `NVIDIA_API_KEY`.
</Warning>

Für die nicht interaktive Einrichtung können Sie den Schlüssel auch direkt übergeben:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

Wenn ein NVIDIA-API-Schlüssel konfiguriert ist, versuchen die OpenClaw-Einrichtungs- und Modellauswahlpfade,
NVIDIAs öffentlichen Katalog hervorgehobener Modelle von
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` abzurufen, und
speichern das gerankte Ergebnis 24 Stunden lang im Cache. Neue hervorgehobene Modelle von build.nvidia.com
erscheinen daher in Einrichtungs- und Modellauswahloberflächen, ohne auf ein
OpenClaw-Release warten zu müssen. Wenn der Live-Feed verfügbar ist, ist das erste zurückgegebene Modell
die Standardoption, die während der NVIDIA-Einrichtung angezeigt wird.

Der Abruf verwendet eine feste HTTPS-Host-Richtlinie für `assets.ngc.nvidia.com`. Wenn kein
NVIDIA-API-Schlüssel konfiguriert ist oder wenn dieser öffentliche Katalog nicht verfügbar oder
fehlerhaft ist, fällt OpenClaw auf den gebündelten Katalog und den unten aufgeführten gebündelten Standard zurück.

## Nemotron 3 Ultra

Nemotron 3 Ultra ist das standardmäßige NVIDIA-Modell in OpenClaw. NVIDIAs Build-Seite für
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
führt es als verfügbaren kostenlosen Endpoint mit einer Kontext-Spezifikation von 1M Token auf.
Der gebündelte Katalog verzeichnet eine maximale Ausgabe von 16.384 Token, passend zu NVIDIAs aktuellem
OpenAI-kompatiblen Beispielrequest für den gehosteten Endpoint.

Verwenden Sie Ultra als leistungsfähigsten NVIDIA-Standard. Lassen Sie Super ausgewählt, wenn
Sie die kleinere Nemotron-3-Option wünschen, oder wählen Sie eines der Drittanbietermodelle,
die in NVIDIAs Katalog gehostet werden, wenn deren Kontext, Latenz oder Verhalten besser passt.
Die gebündelte Ultra-Zeile sendet standardmäßig `chat_template_kwargs.enable_thinking: false` und
`force_nonempty_content: true`, damit normale Chat-Ausgaben in der
sichtbaren Antwort bleiben, statt Reasoning-Text offenzulegen.

## Gebündelter Fallback-Katalog

| Modell-Ref                                 | Name                         | Kontext   | Max. Ausgabe | Hinweise                              |
| ------------------------------------------ | ---------------------------- | --------- | ------------ | ------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384       | Standard                              |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192        | Hervorgehobener Fallback              |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192        | Hervorgehobener Fallback              |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192        | Hervorgehobener Fallback              |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192        | Hervorgehobener Fallback              |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192        | Veraltet, Upgrade-Kompatibilität      |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192        | Veraltet, Upgrade-Kompatibilität      |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verhalten für automatische Aktivierung">
    Der Provider wird automatisch aktiviert, wenn die Umgebungsvariable `NVIDIA_API_KEY` gesetzt ist.
    Außer dem Schlüssel ist keine explizite Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Katalog und Preise">
    OpenClaw bevorzugt NVIDIAs öffentlichen Katalog hervorgehobener Modelle, wenn NVIDIA-Authentifizierung
    konfiguriert ist, und speichert ihn 24 Stunden lang im Cache. Der gebündelte Fallback-Katalog ist statisch
    und behält veraltete ausgelieferte Refs für Upgrade-Kompatibilität bei. Kosten sind in der Quelle standardmäßig
    auf `0` gesetzt, da NVIDIA derzeit kostenlosen API-Zugriff für die
    aufgeführten Modelle anbietet.
  </Accordion>

  <Accordion title="OpenAI-kompatibler Endpoint">
    NVIDIA verwendet den standardmäßigen `/v1`-Completions-Endpoint. Jede OpenAI-kompatible
    Tooling-Lösung sollte mit der NVIDIA-Basis-URL ohne weitere Anpassungen funktionieren.
  </Accordion>

  <Accordion title="Reasoning-Parameter für Nemotron 3 Ultra">
    NVIDIAs Ultra-Beispielrequest verwendet `chat_template_kwargs.enable_thinking`
    und `reasoning_budget` für Reasoning-Ausgaben. Die gebündelte Ultra-Zeile von OpenClaw
    deaktiviert Template-Thinking standardmäßig für die normale Chat-Nutzung. Wenn Sie
    NVIDIA-Reasoning-Ausgaben aktivieren oder andere NVIDIA-spezifische Request-Felder
    erzwingen müssen, setzen Sie modellbezogene Parameter und beschränken Sie providerspezifische Überschreibungen auf
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

    `params.extra_body` ist die finale OpenAI-kompatible Überschreibung des Request-Bodys. Verwenden Sie sie daher
    nur für Felder, die NVIDIA für den ausgewählten Endpoint dokumentiert.

  </Accordion>

  <Accordion title="Langsame Antworten eines benutzerdefinierten Providers">
    Einige bei NVIDIA gehostete benutzerdefinierte Modelle können länger als der standardmäßige Leerlauf-
    Watchdog des Modells benötigen, bevor sie den ersten Antwort-Chunk ausgeben. Erhöhen Sie für
    benutzerdefinierte NVIDIA-Provider-Einträge das Provider-Timeout, statt das Timeout der gesamten Agent-
    Laufzeit zu erhöhen:

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
NVIDIA-Modelle können derzeit kostenlos verwendet werden. Prüfen Sie
[build.nvidia.com](https://build.nvidia.com/) für die neuesten Angaben zu Verfügbarkeit und
Rate-Limit-Details.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
