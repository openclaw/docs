---
read_when:
    - Sie möchten Cloudflare AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Konto-ID, Gateway-ID oder die Env-Var für den API-Schlüssel
summary: Cloudflare AI Gateway einrichten (Authentifizierung + Modellauswahl)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-06-27T18:02:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway sitzt vor Provider-APIs und ermöglicht Ihnen, Analysen, Caching und Steuerungen hinzuzufügen. Für Anthropic verwendet OpenClaw die Anthropic Messages API über Ihren Gateway-Endpunkt.

| Eigenschaft    | Wert                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| Provider       | `cloudflare-ai-gateway`                                                                  |
| Basis-URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Standardmodell | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API-Schlüssel  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Ihr Provider-API-Schlüssel für Anfragen über das Gateway) |

<Note>
Verwenden Sie für Anthropic-Modelle, die über Cloudflare AI Gateway geroutet werden, Ihren **Anthropic-API-Schlüssel** als Provider-Schlüssel.
</Note>

Wenn Thinking für Anthropic-Messages-Modelle aktiviert ist, entfernt OpenClaw nachgestellte
Assistant-Prefill-Turns, bevor die Nutzdaten über Cloudflare AI Gateway gesendet werden.
Anthropic lehnt Response-Prefilling mit erweitertem Thinking ab, während gewöhnliches
Prefill ohne Thinking weiterhin verfügbar bleibt.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend Gateway neu:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="Provider-API-Schlüssel und Gateway-Details festlegen">
    Führen Sie das Onboarding aus und wählen Sie die Authentifizierungsoption für Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Dadurch werden Sie nach Ihrer Konto-ID, Gateway-ID und Ihrem API-Schlüssel gefragt.

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell Ihrer OpenClaw-Konfiguration hinzu:

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

Übergeben Sie für Skript- oder CI-Setups alle Werte über die Befehlszeile:

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
    Wenn Sie Gateway-Authentifizierung in Cloudflare aktiviert haben, fügen Sie den Header `cf-aig-authorization` hinzu. Dies gilt **zusätzlich zu** Ihrem Provider-API-Schlüssel.

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
    Wenn das Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `CLOUDFLARE_AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, hilft einem launchd/systemd-Daemon nicht, sofern diese Umgebung nicht ebenfalls dort importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, um sicherzustellen, dass der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
