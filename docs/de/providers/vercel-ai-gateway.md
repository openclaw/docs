---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Einrichtung des Vercel AI Gateway (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-30T07:12:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

The [Vercel AI Gateway](https://vercel.com/ai-gateway) stellt eine einheitliche API bereit, um über einen einzigen Endpoint auf Hunderte von Modellen zuzugreifen.

| Eigenschaft   | Wert                             |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Authentifizierung | `AI_GATEWAY_API_KEY`         |
| API           | mit Anthropic Messages kompatibel |
| Modellkatalog | automatisch über `/v1/models` erkannt |

<Tip>
OpenClaw erkennt den Gateway-Katalog `/v1/models` automatisch, sodass
`/models vercel-ai-gateway` aktuelle Modell-Refs wie
`vercel-ai-gateway/openai/gpt-5.5` und
`vercel-ai-gateway/moonshotai/kimi-k2.6` enthält.
</Tip>

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Führen Sie das Onboarding aus und wählen Sie die Authentifizierungsoption für AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Standardmodell festlegen">
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

Für Skript- oder CI-Setups übergeben Sie alle Werte über die Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Kurzschreibweise für Modell-IDs

OpenClaw akzeptiert Vercel-Claude-Modell-Refs in Kurzschreibweise und normalisiert sie zur Laufzeit:

| Eingabe in Kurzschreibweise         | Normalisierte Modell-Ref                      |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Sie können in Ihrer Konfiguration entweder die Kurzschreibweise oder die vollständig qualifizierte Modell-Ref verwenden. OpenClaw löst die kanonische Form automatisch auf.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn der OpenClaw Gateway als Daemon (launchd/systemd) läuft, stellen Sie sicher, dass
    `AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd/systemd-
    Daemon nicht sichtbar, sofern diese Umgebung nicht ausdrücklich importiert wird. Setzen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv`, um sicherzustellen, dass der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Provider-Routing">
    Vercel AI Gateway leitet Anfragen anhand des Modell-Ref-Präfixes an den Upstream-Provider weiter. Beispielsweise wird `vercel-ai-gateway/anthropic/claude-opus-4.6` über Anthropic geroutet, während `vercel-ai-gateway/openai/gpt-5.5` über OpenAI und `vercel-ai-gateway/moonshotai/kimi-k2.6` über MoonshotAI geroutet wird. Ihr einzelner `AI_GATEWAY_API_KEY` übernimmt die Authentifizierung für alle Upstream-Provider.
  </Accordion>
  <Accordion title="Thinking-Stufen">
    `/think`-Optionen folgen vertrauenswürdigen Upstream-Modellpräfixen, wenn OpenClaw den Upstream-Provider-Vertrag kennt. `vercel-ai-gateway/anthropic/...` verwendet das Claude-Thinking-Profil, einschließlich adaptiver Standardwerte für Claude-4.6-Modelle. `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` und Codex-artige Refs stellen
    `/think xhigh` genau wie die direkten OpenAI/OpenAI-Codex-Provider bereit. Andere namespacete Refs behalten die normalen Reasoning-Stufen bei, sofern ihre Katalogmetadaten nicht mehr deklarieren.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
