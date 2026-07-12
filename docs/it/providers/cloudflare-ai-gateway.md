---
read_when:
    - Vuoi utilizzare Cloudflare AI Gateway con OpenClaw
    - È necessario l'ID dell'account, l'ID del Gateway o la variabile d'ambiente della chiave API
summary: Configurazione di Cloudflare AI Gateway (autenticazione + selezione del modello)
title: Gateway AI di Cloudflare
x-i18n:
    generated_at: "2026-07-12T07:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) si posiziona davanti alle API dei provider e aggiunge analisi, memorizzazione nella cache e controlli. Per Anthropic, OpenClaw utilizza l'API Anthropic Messages tramite l'endpoint del Gateway.

| Proprietà          | Valore                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Provider           | `cloudflare-ai-gateway`                                                                                  |
| Plugin             | pacchetto esterno ufficiale (`@openclaw/cloudflare-ai-gateway-provider`)                                 |
| URL di base        | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                               |
| Modello predefinito | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                               |
| Chiave API         | `CLOUDFLARE_AI_GATEWAY_API_KEY` (la chiave API del provider per le richieste effettuate tramite Gateway) |

<Note>
Per i modelli Anthropic instradati tramite Cloudflare AI Gateway, utilizza la tua **chiave API Anthropic** come chiave del provider.
</Note>

Quando il ragionamento è abilitato per i modelli Anthropic Messages, OpenClaw rimuove i turni finali
di precompilazione dell'assistente prima di inviare il payload tramite Cloudflare AI Gateway.
Anthropic rifiuta la precompilazione della risposta con il ragionamento esteso, mentre la normale
precompilazione senza ragionamento rimane disponibile.

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Guida introduttiva

<Steps>
  <Step title="Impostare la chiave API del provider e i dettagli del Gateway">
    Avvia la configurazione iniziale e scegli l'opzione di autenticazione Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Verranno richiesti l'ID dell'account, l'ID del gateway e la chiave API.

  </Step>
  <Step title="Impostare un modello predefinito">
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
  <Step title="Verificare che il modello sia disponibile">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Esempio non interattivo

Per configurazioni tramite script o CI, passa tutti i valori dalla riga di comando:

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
    Se hai abilitato l'autenticazione del Gateway in Cloudflare, aggiungi l'header `cf-aig-authorization`. Questo è necessario **in aggiunta alla** chiave API del provider.

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
    L'header `cf-aig-authorization` esegue l'autenticazione con il Cloudflare Gateway stesso, mentre la chiave API del provider (ad esempio, la chiave Anthropic) esegue l'autenticazione con il provider a monte.
    </Tip>

  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `CLOUDFLARE_AI_GATEWAY_API_KEY` sia disponibile per tale processo.

    <Warning>
    Una chiave esportata solo in una shell interattiva non sarà disponibile per un daemon launchd/systemd, a meno che anche tale ambiente non venga importato. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo del gateway possa leggerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e domande frequenti.
  </Card>
</CardGroup>
