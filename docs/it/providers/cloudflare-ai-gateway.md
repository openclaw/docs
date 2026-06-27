---
read_when:
    - Vuoi usare Cloudflare AI Gateway con OpenClaw
    - Ti serve l'ID account, l'ID gateway o la variabile env della chiave API
summary: Configurazione di Cloudflare AI Gateway (autenticazione + selezione del modello)
title: Gateway AI di Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:05:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway si colloca davanti alle API dei provider e consente di aggiungere analisi, caching e controlli. Per Anthropic, OpenClaw usa l'API Anthropic Messages tramite il tuo endpoint Gateway.

| Proprietà            | Valore                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Provider             | `cloudflare-ai-gateway`                                                                  |
| URL di base          | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modello predefinito  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Chiave API           | `CLOUDFLARE_AI_GATEWAY_API_KEY` (la tua chiave API del provider per le richieste tramite il Gateway) |

<Note>
Per i modelli Anthropic instradati tramite Cloudflare AI Gateway, usa la tua **chiave API Anthropic** come chiave del provider.
</Note>

Quando il ragionamento è abilitato per i modelli Anthropic Messages, OpenClaw rimuove i turni finali di precompilazione
dell'assistente prima di inviare il payload tramite Cloudflare AI Gateway.
Anthropic rifiuta la precompilazione della risposta con il ragionamento esteso, mentre la normale
precompilazione senza ragionamento rimane disponibile.

## Installa Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API del provider e i dettagli del Gateway">
    Esegui l'onboarding e scegli l'opzione di autenticazione Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Verranno richiesti l'ID account, l'ID gateway e la chiave API.

  </Step>
  <Step title="Imposta un modello predefinito">
    Aggiungi il modello alla configurazione di OpenClaw:

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
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Esempio non interattivo

Per configurazioni con script o CI, passa tutti i valori sulla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Gateway autenticati">
    Se hai abilitato l'autenticazione Gateway in Cloudflare, aggiungi l'header `cf-aig-authorization`. Questo è **in aggiunta a** la tua chiave API del provider.

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
    L'header `cf-aig-authorization` autentica con il Cloudflare Gateway stesso, mentre la chiave API del provider (ad esempio, la tua chiave Anthropic) autentica con il provider upstream.
    </Tip>

  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che `CLOUDFLARE_AI_GATEWAY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave esportata solo in una shell interattiva non aiuterà un demone launchd/systemd, a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo gateway possa leggerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti di modello e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
