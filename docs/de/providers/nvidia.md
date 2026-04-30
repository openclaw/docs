---
read_when:
    - Sie möchten offene Modelle in OpenClaw kostenlos nutzen
    - Sie müssen NVIDIA_API_KEY einrichten
summary: Die OpenAI-kompatible API von NVIDIA in OpenClaw verwenden
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T07:11:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA stellt unter `https://integrate.api.nvidia.com/v1` eine OpenAI-kompatible API für
offene Modelle kostenlos bereit. Authentifizieren Sie sich mit einem API-Schlüssel von
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

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
  <Step title="NVIDIA-Modell festlegen">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Wenn Sie `--nvidia-api-key` statt der Umgebungsvariable übergeben, landet der Wert im Shell-
Verlauf und in der `ps`-Ausgabe. Verwenden Sie nach Möglichkeit die Umgebungsvariable
`NVIDIA_API_KEY`.
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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Integrierter Katalog

| Modellreferenz                            | Name                         | Kontext | Maximale Ausgabe |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verhalten beim automatischen Aktivieren">
    Der Provider wird automatisch aktiviert, wenn die Umgebungsvariable `NVIDIA_API_KEY` gesetzt ist.
    Über den Schlüssel hinaus ist keine explizite Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Katalog und Preise">
    Der gebündelte Katalog ist statisch. Kosten sind im Quellcode standardmäßig auf `0` gesetzt, da NVIDIA
    derzeit kostenlosen API-Zugriff für die aufgeführten Modelle anbietet.
  </Accordion>

  <Accordion title="OpenAI-kompatibler Endpoint">
    NVIDIA verwendet den standardmäßigen `/v1`-Completions-Endpoint. Jede OpenAI-kompatible
    Tooling sollte mit der NVIDIA-Basis-URL sofort funktionieren.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-Modelle können derzeit kostenlos genutzt werden. Prüfen Sie
[build.nvidia.com](https://build.nvidia.com/) auf die aktuelle Verfügbarkeit und
Details zu Rate Limits.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
