---
read_when:
    - Vuoi usare Vercel AI Gateway con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API oppure la scelta di autenticazione della CLI
summary: Configurazione di Vercel AI Gateway (autenticazione + selezione del modello)
title: Gateway AI di Vercel
x-i18n:
    generated_at: "2026-07-12T07:26:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Il [Vercel AI Gateway](https://vercel.com/ai-gateway) fornisce un'API unificata per
accedere a centinaia di modelli tramite un singolo endpoint.

| Proprietà           | Valore                                 |
| ------------------- | -------------------------------------- |
| Provider            | `vercel-ai-gateway`                    |
| Pacchetto           | `@openclaw/vercel-ai-gateway-provider` |
| Autenticazione      | `AI_GATEWAY_API_KEY`                   |
| API                 | Compatibile con Anthropic Messages     |
| URL di base         | `https://ai-gateway.vercel.sh`         |
| Catalogo dei modelli | Rilevato automaticamente tramite `/v1/models` |

<Tip>
OpenClaw rileva automaticamente il catalogo `/v1/models` del Gateway, quindi sia il
comando di chat `/models vercel-ai-gateway` sia
`openclaw models list --provider vercel-ai-gateway` includono i riferimenti ai modelli
correnti, come `vercel-ai-gateway/openai/gpt-5.5` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Guida introduttiva

<Steps>
  <Step title="Installa il plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Imposta un modello predefinito">
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
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abbreviata dell'ID del modello

OpenClaw normalizza in fase di esecuzione i riferimenti abbreviati ai modelli Claude:

| Input abbreviato                    | Riferimento normalizzato al modello           |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puoi utilizzare entrambe le forme nella configurazione; OpenClaw risolve automaticamente
il riferimento canonico `anthropic/...`.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile di ambiente per i processi daemon">
    Se il Gateway di OpenClaw viene eseguito come daemon (launchd/systemd), assicurati
    che `AI_GATEWAY_API_KEY` sia disponibile per tale processo.

    <Warning>
    Una chiave esportata solo in una shell interattiva non sarà visibile a un
    daemon launchd/systemd, a meno che l'ambiente non venga importato esplicitamente. Imposta
    la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo
    del Gateway possa leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Instradamento del provider">
    Vercel AI Gateway instrada ogni richiesta al provider upstream indicato nel
    prefisso del riferimento al modello. Ad esempio, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    viene instradato tramite Anthropic, `vercel-ai-gateway/openai/gpt-5.5` tramite
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` tramite
    MoonshotAI. Una singola `AI_GATEWAY_API_KEY` autentica tutti i provider upstream.
  </Accordion>
  <Accordion title="Livelli di ragionamento">
    Le opzioni di `/think` seguono il prefisso del modello upstream quando OpenClaw lo
    riconosce. `vercel-ai-gateway/anthropic/...` utilizza il profilo di ragionamento di Claude,
    incluso il valore predefinito adattivo per i modelli Claude 4.6. I riferimenti attendibili
    `vercel-ai-gateway/openai/...` (`gpt-5.2` e versioni successive, oltre alle varianti Codex
    fino a `gpt-5.1-codex`) espongono `/think xhigh`. Gli altri riferimenti con spazio dei nomi
    mantengono i livelli di ragionamento standard, a meno che i metadati del catalogo
    non ne dichiarino altri.
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
