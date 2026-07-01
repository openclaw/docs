---
read_when:
    - Sie möchten offene Modelle in OpenClaw kostenlos verwenden
    - Sie müssen NVIDIA_API_KEY einrichten
    - Sie möchten Nemotron 3 Ultra über NVIDIA verwenden
summary: Verwenden Sie NVIDIAs OpenAI-kompatible API in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:17:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
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
Wenn Sie `--nvidia-api-key` anstelle der Umgebungsvariable übergeben, landet der Wert im Shell-Verlauf
und in der `ps`-Ausgabe. Bevorzugen Sie nach Möglichkeit die Umgebungsvariable `NVIDIA_API_KEY`.
</Warning>

Für eine nicht interaktive Einrichtung können Sie den Schlüssel auch direkt übergeben:

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
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` zu verwenden, und
speichern das bewertete Ergebnis für 24 Stunden im Cache. Neue hervorgehobene Modelle von build.nvidia.com
erscheinen dadurch in Einrichtungs- und Modellauswahloberflächen, ohne auf ein
OpenClaw-Release warten zu müssen. Wenn der Live-Feed verfügbar ist, ist das erste zurückgegebene Modell
die Standardoption, die während der NVIDIA-Einrichtung angezeigt wird.

Der Abruf verwendet eine feste HTTPS-Host-Richtlinie für `assets.ngc.nvidia.com`. Wenn kein
NVIDIA-API-Schlüssel konfiguriert ist oder wenn dieser öffentliche Katalog nicht verfügbar oder
fehlerhaft ist, fällt OpenClaw auf den gebündelten Katalog und den unten aufgeführten gebündelten Standard zurück.

## Nemotron 3 Ultra

Nemotron 3 Ultra ist das Standardmodell von NVIDIA in OpenClaw. NVIDIAs Build-Seite für
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
führt es als verfügbaren kostenlosen Endpunkt mit einer 1M-Token-Kontextspezifikation auf.
Der gebündelte Katalog verzeichnet eine maximale Ausgabe von 16.384 Tokens, um NVIDIAs aktueller
OpenAI-kompatibler Beispielanforderung für den gehosteten Endpunkt zu entsprechen.

Verwenden Sie Ultra als NVIDIA-Standard mit den höchsten Fähigkeiten. Behalten Sie Super ausgewählt, wenn
Sie die kleinere Nemotron-3-Option wünschen, oder wählen Sie eines der Drittanbietermodelle,
die in NVIDIAs Katalog gehostet werden, wenn deren Kontext, Latenz oder Verhalten besser passt.
Die gebündelte Ultra-Zeile sendet standardmäßig `chat_template_kwargs.enable_thinking: false` und
`force_nonempty_content: true`, damit normale Chat-Ausgaben in der sichtbaren Antwort bleiben,
anstatt Reasoning-Text offenzulegen.

## Gebündelter Fallback-Katalog

| Modell-Ref                                 | Name                         | Kontext   | Maximale Ausgabe | Hinweise                                |
| ------------------------------------------ | ---------------------------- | --------- | ---------------- | --------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384           | Standard                                |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192            | Hervorgehobener Fallback                |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192            | Hervorgehobener Fallback                |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192            | Hervorgehobener Fallback                |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192            | Hervorgehobener Fallback                |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192            | Veraltet, Upgrade-Kompatibilität        |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192            | Veraltet, Upgrade-Kompatibilität        |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verhalten zur automatischen Aktivierung">
    Der Provider wird automatisch aktiviert, wenn die Umgebungsvariable `NVIDIA_API_KEY` gesetzt ist.
    Über den Schlüssel hinaus ist keine explizite Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Katalog und Preise">
    OpenClaw bevorzugt NVIDIAs öffentlichen Katalog hervorgehobener Modelle, wenn NVIDIA-Authentifizierung
    konfiguriert ist, und speichert ihn für 24 Stunden im Cache. Der gebündelte Fallback-Katalog ist statisch
    und behält veraltete ausgelieferte Refs für Upgrade-Kompatibilität bei. Kosten sind im Quellcode standardmäßig
    auf `0` gesetzt, da NVIDIA derzeit kostenlosen API-Zugriff für die
    aufgeführten Modelle anbietet.
  </Accordion>

  <Accordion title="OpenAI-kompatibler Endpunkt">
    NVIDIA verwendet den standardmäßigen `/v1`-Completions-Endpunkt. Alle OpenAI-kompatiblen
    Tools sollten mit der NVIDIA-Basis-URL sofort funktionieren.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra Reasoning-Parameter">
    NVIDIAs Ultra-Beispielanforderung verwendet `chat_template_kwargs.enable_thinking`
    und `reasoning_budget` für Reasoning-Ausgaben. OpenClaws gebündelte Ultra-Zeile
    deaktiviert Template-Thinking standardmäßig für normale Chat-Nutzung. Wenn Sie
    NVIDIA-Reasoning-Ausgaben aktivieren oder andere NVIDIA-spezifische Anforderungsfelder
    erzwingen müssen, setzen Sie modellspezifische Parameter und beschränken Sie Provider-spezifische Overrides auf
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

    `params.extra_body` ist der finale OpenAI-kompatible Request-Body-Override, verwenden Sie ihn daher
    nur für Felder, die NVIDIA für den ausgewählten Endpunkt dokumentiert.

  </Accordion>

  <Accordion title="Langsame Antworten benutzerdefinierter Provider">
    Einige von NVIDIA gehostete benutzerdefinierte Modelle können länger brauchen als der standardmäßige Leerlauf-Watchdog
    des Modells, bevor sie den ersten Antwort-Chunk ausgeben. Erhöhen Sie für benutzerdefinierte NVIDIA-Provider-Einträge
    das Provider-Timeout, anstatt das Timeout der gesamten Agent-Laufzeit
    zu erhöhen:

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
NVIDIA-Modelle können derzeit kostenlos genutzt werden. Prüfen Sie
[build.nvidia.com](https://build.nvidia.com/) auf aktuelle Verfügbarkeit und
Details zu Rate Limits.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
