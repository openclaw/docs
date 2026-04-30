---
read_when:
    - Vuoi usare Cloudflare AI Gateway con OpenClaw
    - Serve l'ID dell'account, l'ID del Gateway o la variabile d'ambiente della chiave API
summary: Configurazione di Cloudflare AI Gateway (autenticazione + selezione del modello)
title: Gateway IA di Cloudflare
x-i18n:
    generated_at: "2026-04-30T09:08:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway si pone davanti alle API dei provider e consente di aggiungere analytics, caching e controlli. Per Anthropic, OpenClaw usa l'API Anthropic Messages tramite il tuo endpoint Gateway.

| Proprietà             | Valore                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Fornitore             | `cloudflare-ai-gateway`                                                                  |
| URL di base           | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modello predefinito   | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Chiave API            | `CLOUDFLARE_AI_GATEWAY_API_KEY` (la chiave API del tuo provider per le richieste tramite il Gateway) |

<Note>
Per i modelli Anthropic instradati tramite Cloudflare AI Gateway, usa la tua **chiave API Anthropic** come chiave del provider.
</Note>

Quando il thinking è abilitato per i modelli Anthropic Messages, OpenClaw rimuove i turni finali di prefill
dell'assistente prima di inviare il payload tramite Cloudflare AI Gateway.
Anthropic rifiuta il prefill delle risposte con extended thinking, mentre il normale
prefill senza thinking rimane disponibile.

## Introduzione

<Steps>
  <Step title="Imposta la chiave API del provider e i dettagli del Gateway">
    Esegui l'onboarding e scegli l'opzione di autenticazione Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Questo richiede il tuo ID account, ID gateway e chiave API.

  </Step>
  <Step title="Imposta un modello predefinito">
    Aggiungi il modello alla tua configurazione OpenClaw:

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

Per configurazioni scriptate o CI, passa tutti i valori dalla riga di comando:

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
    Se hai abilitato l'autenticazione del Gateway in Cloudflare, aggiungi l'header `cf-aig-authorization`. Questo è **in aggiunta a** la chiave API del tuo provider.

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
    L'header `cf-aig-authorization` autentica con il Cloudflare Gateway stesso, mentre la chiave API del provider (per esempio la tua chiave Anthropic) autentica con il provider upstream.
    </Tip>

  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `CLOUDFLARE_AI_GATEWAY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave presente solo in `~/.profile` non aiuterà un daemon launchd/systemd a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per garantire che il processo Gateway possa leggerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
