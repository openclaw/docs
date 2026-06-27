---
read_when:
    - Vuoi usare Vercel AI Gateway con OpenClaw
    - Hai bisogno della variabile di ambiente della chiave API o della scelta di autenticazione della CLI
summary: Configurazione di Vercel AI Gateway (autenticazione + selezione del modello)
title: Gateway AI di Vercel
x-i18n:
    generated_at: "2026-06-27T18:10:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Il [Vercel AI Gateway](https://vercel.com/ai-gateway) fornisce un'API unificata per
accedere a centinaia di modelli tramite un singolo endpoint.

| Proprietà      | Valore                                  |
| ------------- | -------------------------------------- |
| Fornitore      | `vercel-ai-gateway`                    |
| Pacchetto       | `@openclaw/vercel-ai-gateway-provider` |
| Autenticazione          | `AI_GATEWAY_API_KEY`                   |
| API           | compatibile con Anthropic Messages          |
| Catalogo modelli | Rilevato automaticamente tramite `/v1/models`       |

<Tip>
OpenClaw rileva automaticamente il catalogo Gateway `/v1/models`, quindi
`/models vercel-ai-gateway` include riferimenti modello correnti come
`vercel-ai-gateway/openai/gpt-5.5` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Introduzione

<Steps>
  <Step title="Installa il Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Imposta la chiave API">
    Esegui l'onboarding e scegli l'opzione di autenticazione AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Imposta un modello predefinito">
    Aggiungi il modello alla tua configurazione OpenClaw:

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

Per configurazioni con script o CI, passa tutti i valori nella riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Abbreviazione ID modello

OpenClaw accetta riferimenti modello abbreviati Vercel Claude e li normalizza a
runtime:

| Input abbreviato                     | Riferimento modello normalizzato                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puoi usare l'abbreviazione o il riferimento modello completo nella tua
configurazione. OpenClaw risolve automaticamente la forma canonica.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per processi daemon">
    Se OpenClaw Gateway viene eseguito come daemon (launchd/systemd), assicurati
    che `AI_GATEWAY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave esportata solo in una shell interattiva non sarà visibile a un
    daemon launchd/systemd a meno che quell'ambiente non venga importato esplicitamente. Imposta
    la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo
    Gateway possa leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Routing del provider">
    Vercel AI Gateway instrada le richieste al provider upstream in base al prefisso
    del riferimento modello. Per esempio, `vercel-ai-gateway/anthropic/claude-opus-4.6` viene instradato
    tramite Anthropic, mentre `vercel-ai-gateway/openai/gpt-5.5` viene instradato tramite
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` viene instradato tramite
    MoonshotAI. La tua singola `AI_GATEWAY_API_KEY` gestisce l'autenticazione per tutti
    i provider upstream.
  </Accordion>
  <Accordion title="Livelli di pensiero">
    Le opzioni `/think` seguono i prefissi dei modelli upstream attendibili quando OpenClaw conosce
    il contratto del provider upstream. `vercel-ai-gateway/anthropic/...` usa il
    profilo di pensiero Claude, inclusi i valori predefiniti adattivi per i modelli Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` e i riferimenti in stile Codex espongono
    `/think xhigh` proprio come i provider diretti OpenAI/OpenAI Codex. Gli altri
    riferimenti con namespace mantengono i normali livelli di ragionamento, a meno che i metadati
    del loro catalogo non dichiarino di più.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
