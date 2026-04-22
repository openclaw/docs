---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die CLI-Auth-Auswahl
summary: Einrichtung von Vercel AI Gateway (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

Das [Vercel AI Gateway](https://vercel.com/ai-gateway) bietet eine einheitliche API, um über einen einzelnen Endpunkt auf Hunderte von Modellen zuzugreifen.

| Eigenschaft   | Wert                             |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | kompatibel mit Anthropic Messages |
| Modellkatalog | automatisch erkannt über `/v1/models` |

<Tip>
OpenClaw erkennt den Gateway-Katalog `/v1/models` automatisch, sodass
`/models vercel-ai-gateway` aktuelle Modellreferenzen wie
`vercel-ai-gateway/openai/gpt-5.4` und
`vercel-ai-gateway/moonshotai/kimi-k2.6` enthält.
</Tip>

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
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

Für skriptgesteuerte oder CI-Setups übergeben Sie alle Werte in der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Kurzform für Modell-IDs

OpenClaw akzeptiert Kurzformen von Vercel-Claude-Modellreferenzen und normalisiert sie zur Laufzeit:

| Kurzform-Eingabe                    | Normalisierte Modellreferenz                |
| ----------------------------------- | ------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Sie können in Ihrer Konfiguration entweder die Kurzform oder die vollständig qualifizierte Modellreferenz verwenden. OpenClaw löst die kanonische Form automatisch auf.
</Tip>

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn das OpenClaw Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass
    `AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd/systemd-
    Daemon nicht sichtbar, sofern diese Umgebung nicht explizit importiert wird. Setzen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn
    lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Provider-Routing">
    Vercel AI Gateway leitet Requests anhand des Präfixes der Modellreferenz an den vorgelagerten Provider weiter. Zum Beispiel wird `vercel-ai-gateway/anthropic/claude-opus-4.6` über
    Anthropic geleitet, während `vercel-ai-gateway/openai/gpt-5.4` über
    OpenAI und `vercel-ai-gateway/moonshotai/kimi-k2.6` über
    MoonshotAI geleitet wird. Ihr einzelner `AI_GATEWAY_API_KEY` übernimmt die Authentifizierung für alle
    vorgelagerten Provider.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
