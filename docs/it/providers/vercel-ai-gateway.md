---
read_when:
    - Vuoi usare il Gateway AI Vercel con OpenClaw
    - Ti servono la variabile env della chiave API o la scelta auth della CLI
summary: Configurazione di Vercel AI Gateway (autenticazione + selezione del modello)
title: Gateway AI Vercel
x-i18n:
    generated_at: "2026-04-24T08:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

Il [Gateway AI Vercel](https://vercel.com/ai-gateway) fornisce un'API unificata per
accedere a centinaia di modelli tramite un singolo endpoint.

| Proprietà | Valore |
| ------------- | -------------------------------- |
| Provider | `vercel-ai-gateway` |
| Auth | `AI_GATEWAY_API_KEY` |
| API | Compatibile con Anthropic Messages |
| Catalogo modelli | Rilevato automaticamente tramite `/v1/models` |

<Tip>
OpenClaw rileva automaticamente il catalogo `/v1/models` del Gateway, quindi
`/models vercel-ai-gateway` include riferimenti ai modelli correnti come
`vercel-ai-gateway/openai/gpt-5.5` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui l'onboarding e scegli l'opzione auth AI Gateway:

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

Per configurazioni scriptate o CI, passa tutti i valori sulla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abbreviata dell'ID modello

OpenClaw accetta riferimenti abbreviati ai modelli Claude di Vercel e li normalizza a
runtime:

| Input abbreviato | Riferimento modello normalizzato |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puoi usare sia la forma abbreviata sia il riferimento al modello pienamente qualificato nella tua
configurazione. OpenClaw risolve automaticamente la forma canonica.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per processi daemon">
    Se il Gateway OpenClaw è in esecuzione come daemon (launchd/systemd), assicurati che
    `AI_GATEWAY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave impostata solo in `~/.profile` non sarà visibile a un daemon launchd/systemd
    a meno che quell'ambiente non venga importato esplicitamente. Imposta la chiave in
    `~/.openclaw/.env` o tramite `env.shellEnv` per garantire che il processo gateway possa
    leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Instradamento del provider">
    Il Gateway AI Vercel instrada le richieste al provider upstream in base al prefisso del
    riferimento del modello. Ad esempio, `vercel-ai-gateway/anthropic/claude-opus-4.6` viene instradato
    tramite Anthropic, mentre `vercel-ai-gateway/openai/gpt-5.5` viene instradato tramite
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` viene instradato tramite
    MoonshotAI. La tua singola `AI_GATEWAY_API_KEY` gestisce l'autenticazione per tutti
    i provider upstream.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
