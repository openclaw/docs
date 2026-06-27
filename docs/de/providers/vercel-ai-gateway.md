---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die CLI-Authentifizierungsauswahl
summary: Vercel AI Gateway-Einrichtung (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-06-27T18:07:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Der [Vercel AI Gateway](https://vercel.com/ai-gateway) stellt eine einheitliche API bereit, um über einen einzelnen Endpunkt auf Hunderte von Modellen zuzugreifen.

| Eigenschaft   | Wert                                   |
| ------------- | -------------------------------------- |
| Provider      | `vercel-ai-gateway`                    |
| Paket         | `@openclaw/vercel-ai-gateway-provider` |
| Auth          | `AI_GATEWAY_API_KEY`                   |
| API           | Anthropic Messages-kompatibel          |
| Modellkatalog | Automatisch über `/v1/models` erkannt  |

<Tip>
OpenClaw erkennt den Gateway-Katalog `/v1/models` automatisch, sodass
`/models vercel-ai-gateway` aktuelle Modell-Refs wie
`vercel-ai-gateway/openai/gpt-5.5` und
`vercel-ai-gateway/moonshotai/kimi-k2.6` enthält.
</Tip>

## Erste Schritte

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API-Schlüssel festlegen">
    Führen Sie das Onboarding aus und wählen Sie die Auth-Option für AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell Ihrer OpenClaw-Konfiguration hinzu:

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

OpenClaw akzeptiert Vercel-Claude-Kurzform-Modell-Refs und normalisiert sie zur Laufzeit:

| Kurzform-Eingabe                    | Normalisierte Modell-Ref                       |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Sie können in Ihrer Konfiguration entweder die Kurzform oder die vollständig qualifizierte Modell-Ref verwenden. OpenClaw löst die kanonische Form automatisch auf.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn der OpenClaw Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass
    `AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, ist für einen
    launchd/systemd-Daemon nur sichtbar, wenn diese Umgebung ausdrücklich importiert wird. Legen Sie
    den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-Prozess
    ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Provider-Routing">
    Vercel AI Gateway leitet Anfragen basierend auf dem Präfix der Modell-Ref an den Upstream-Provider weiter. Beispielsweise wird `vercel-ai-gateway/anthropic/claude-opus-4.6` über Anthropic geroutet, während `vercel-ai-gateway/openai/gpt-5.5` über OpenAI und `vercel-ai-gateway/moonshotai/kimi-k2.6` über MoonshotAI geroutet werden. Ihr einzelner `AI_GATEWAY_API_KEY` übernimmt die Authentifizierung für alle Upstream-Provider.
  </Accordion>
  <Accordion title="Thinking-Stufen">
    `/think`-Optionen folgen vertrauenswürdigen Upstream-Modellpräfixen, wenn OpenClaw den Vertrag des Upstream-Providers kennt. `vercel-ai-gateway/anthropic/...` verwendet das Claude-Thinking-Profil, einschließlich adaptiver Standardwerte für Claude-4.6-Modelle.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` und Codex-artige Refs stellen
    `/think xhigh` genau wie die direkten OpenAI/OpenAI Codex-Provider bereit. Andere
    namespacede Refs behalten die normalen Reasoning-Stufen bei, sofern ihre Katalogmetadaten nicht mehr deklarieren.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Problembehandlung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Problembehandlung und FAQ.
  </Card>
</CardGroup>
