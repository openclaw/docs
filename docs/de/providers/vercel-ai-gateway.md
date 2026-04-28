---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden.
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Authentifizierungsoption.
summary: Einrichtung von Vercel AI Gateway (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

Das [Vercel AI Gateway](https://vercel.com/ai-gateway) bietet eine einheitliche API, um
über einen einzigen Endpunkt auf Hunderte von Modellen zuzugreifen.

| Eigenschaft   | Wert                             |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | kompatibel zu Anthropic Messages |
| Modellkatalog | automatisch erkannt über `/v1/models` |

<Tip>
OpenClaw erkennt den Katalog `/v1/models` des Gateways automatisch, daher enthält
`/models vercel-ai-gateway` aktuelle Modellreferenzen wie
`vercel-ai-gateway/openai/gpt-5.5` und
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Erste Schritte

<Steps>
  <Step title="Den API-Key setzen">
    Führen Sie das Onboarding aus und wählen Sie die Auth-Option für AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell zu Ihrer OpenClaw-Konfiguration hinzu:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Für skriptbasierte oder CI-Setups übergeben Sie alle Werte in der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Kurzform für Modell-IDs

OpenClaw akzeptiert Kurzformen von Vercel-Claude-Modellreferenzen und normalisiert sie zur
Laufzeit:

| Eingabe in Kurzform                | Normalisierte Modellreferenz                |
| ---------------------------------- | ------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Sie können in Ihrer Konfiguration entweder die Kurzform oder die vollständig qualifizierte Modellreferenz verwenden. OpenClaw löst die kanonische Form automatisch auf.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn das OpenClaw Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher,
    dass `AI_GATEWAY_API_KEY` diesem Prozess zur Verfügung steht.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd/systemd-
    Daemon nicht sichtbar, es sei denn, diese Umgebung wird explizit importiert. Setzen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Provider-Routing">
    Vercel AI Gateway leitet Anfragen basierend auf dem Präfix der Modellreferenz an den Upstream-Provider weiter. Zum Beispiel wird `vercel-ai-gateway/anthropic/claude-opus-4.6`
    über Anthropic geroutet, während `vercel-ai-gateway/openai/gpt-5.5` über
    OpenAI und `vercel-ai-gateway/moonshotai/kimi-k2.6` über
    MoonshotAI geroutet wird. Ihr einzelner `AI_GATEWAY_API_KEY` übernimmt die Authentifizierung für alle
    Upstream-Provider.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
