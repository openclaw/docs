---
read_when:
    - Sie möchten Cloudflare AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Konto-ID, die Gateway-ID oder die Umgebungsvariable für den API-Schlüssel.
summary: Einrichtung des Cloudflare AI Gateway (Authentifizierung + Modellauswahl)
title: Cloudflare AI-Gateway
x-i18n:
    generated_at: "2026-07-12T15:42:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) wird den Provider-APIs vorgeschaltet und ergänzt Analysen, Caching und Steuerungsmöglichkeiten. Für Anthropic verwendet OpenClaw die Anthropic Messages API über Ihren Gateway-Endpunkt.

| Eigenschaft   | Wert                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Plugin        | offizielles externes Paket (`@openclaw/cloudflare-ai-gateway-provider`)                  |
| Basis-URL     | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Standardmodell | `cloudflare-ai-gateway/claude-sonnet-4-6`                                               |
| API-Schlüssel | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Ihr Provider-API-Schlüssel für Anfragen über das Gateway) |

<Note>
Verwenden Sie für Anthropic-Modelle, die über Cloudflare AI Gateway weitergeleitet werden, Ihren **Anthropic-API-Schlüssel** als Provider-Schlüssel.
</Note>

Wenn Thinking für Anthropic-Messages-Modelle aktiviert ist, entfernt OpenClaw abschließende
Assistant-Prefill-Turns, bevor die Nutzlast über Cloudflare AI Gateway gesendet wird.
Anthropic lehnt das Vorbefüllen von Antworten bei erweitertem Thinking ab, während gewöhnliches
Prefill ohne Thinking weiterhin verfügbar ist.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend das Gateway neu:

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

    Sie werden dabei zur Eingabe Ihrer Konto-ID, Gateway-ID und Ihres API-Schlüssels aufgefordert.

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
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Übergeben Sie für skriptgesteuerte oder CI-Einrichtungen alle Werte über die Befehlszeile:

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
    Wenn Sie die Gateway-Authentifizierung in Cloudflare aktiviert haben, fügen Sie den Header `cf-aig-authorization` hinzu. Dieser ist **zusätzlich zu** Ihrem Provider-API-Schlüssel erforderlich.

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
    Der Header `cf-aig-authorization` authentifiziert gegenüber dem Cloudflare Gateway selbst, während der Provider-API-Schlüssel (zum Beispiel Ihr Anthropic-Schlüssel) gegenüber dem vorgeschalteten Provider authentifiziert.
    </Tip>

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `CLOUDFLARE_AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, steht einem launchd-/systemd-Daemon nicht zur Verfügung, sofern diese Umgebung dort nicht ebenfalls importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
