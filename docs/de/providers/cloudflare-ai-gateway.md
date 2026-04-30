---
read_when:
    - Sie möchten Cloudflare AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Konto-ID, Gateway-ID oder API-Schlüssel-Umgebungsvariable
summary: Einrichtung des Cloudflare AI Gateway (Authentifizierung + Modellauswahl)
title: Cloudflare-KI-Gateway
x-i18n:
    generated_at: "2026-04-30T07:10:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway wird vor Provider-APIs geschaltet und ermöglicht Ihnen, Analysen, Caching und Steuerungen hinzuzufügen. Für Anthropic verwendet OpenClaw die Anthropic Messages API über Ihren Gateway-Endpunkt.

| Eigenschaft     | Wert                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Provider        | `cloudflare-ai-gateway`                                                                          |
| Basis-URL       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                       |
| Standardmodell  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                        |
| API-Schlüssel   | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Ihr Provider-API-Schlüssel für Anfragen über das Gateway)       |

<Note>
Für Anthropic-Modelle, die über Cloudflare AI Gateway geroutet werden, verwenden Sie Ihren **Anthropic-API-Schlüssel** als Provider-Schlüssel.
</Note>

Wenn Thinking für Anthropic-Messages-Modelle aktiviert ist, entfernt OpenClaw nachgestellte
assistant-Prefill-Turns, bevor die Payload über Cloudflare AI Gateway gesendet wird.
Anthropic lehnt Antwort-Prefilling mit erweitertem Thinking ab, während gewöhnliches
Nicht-Thinking-Prefill weiterhin verfügbar bleibt.

## Erste Schritte

<Steps>
  <Step title="Provider-API-Schlüssel und Gateway-Details festlegen">
    Führen Sie das Onboarding aus und wählen Sie die Authentifizierungsoption für Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Dabei werden Sie nach Ihrer Konto-ID, Gateway-ID und Ihrem API-Schlüssel gefragt.

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell zu Ihrer OpenClaw-Konfiguration hinzu:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Für skriptgesteuerte oder CI-Setups übergeben Sie alle Werte auf der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Authentifizierte Gateways">
    Wenn Sie die Gateway-Authentifizierung in Cloudflare aktiviert haben, fügen Sie den Header `cf-aig-authorization` hinzu. Dies gilt **zusätzlich zu** Ihrem Provider-API-Schlüssel.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    Der Header `cf-aig-authorization` authentifiziert beim Cloudflare Gateway selbst, während der Provider-API-Schlüssel (zum Beispiel Ihr Anthropic-Schlüssel) beim Upstream-Provider authentifiziert.
    </Tip>

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `CLOUDFLARE_AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem launchd/systemd-Daemon nicht, sofern diese Umgebung dort nicht ebenfalls importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, um sicherzustellen, dass der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Problembehandlung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Problembehandlung und FAQ.
  </Card>
</CardGroup>
