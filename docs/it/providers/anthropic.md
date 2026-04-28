---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite API key o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di auth:

- **API key** — accesso diretto all'API Anthropic con fatturazione a consumo (modelli `anthropic/*`)
- **Claude CLI** — riuso di un login Claude CLI esistente sullo stesso host

<Warning>
Lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi
OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come autorizzati salvo
che Anthropic pubblichi una nuova policy.

Per host gateway di lunga durata, le API key Anthropic restano il percorso di produzione più chiaro e
prevedibile.

La documentazione pubblica attuale di Anthropic:

- [Riferimento Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Panoramica Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Usare Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usare Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Per iniziare

<Tabs>
  <Tab title="API key">
    **Ideale per:** accesso API standard e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua API key">
        Crea una API key nella [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        # scegli: Anthropic API key
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideale per:** riusare un login Claude CLI esistente senza una API key separata.

    <Steps>
      <Step title="Assicurati che Claude CLI sia installato e che l'accesso sia stato effettuato">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        # scegli: Claude CLI
        ```

        OpenClaw rileva e riusa le credenziali Claude CLI esistenti.
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    I dettagli di configurazione ed esecuzione del backend Claude CLI si trovano in [Backend CLI](/it/gateway/cli-backends).
    </Note>

    ### Esempio di configurazione

    Preferisci il ref di modello Anthropic canonico più un override runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    I ref di modello legacy `claude-cli/claude-opus-4-7` continuano a funzionare per
    compatibilità, ma la nuova configurazione dovrebbe mantenere la selezione provider/modello come
    `anthropic/*` e inserire il backend di esecuzione in `agentRuntime.id`.

    <Tip>
    Se vuoi il percorso di fatturazione più chiaro, usa invece una API key Anthropic. OpenClaw supporta anche opzioni in stile subscription da [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valori predefiniti di thinking (Claude 4.6)

I modelli Claude 4.6 usano per impostazione predefinita `adaptive` thinking in OpenClaw quando non è impostato alcun livello di thinking esplicito.

Sovrascrivi per messaggio con `/think:<level>` oppure nei parametri del modello:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Documentazione Anthropic correlata:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caching dei prompt

OpenClaw supporta la funzionalità di caching dei prompt di Anthropic per auth tramite API key.

| Valore              | Durata della cache | Descrizione                               |
| ------------------- | ------------------ | ----------------------------------------- |
| `"short"` (predefinito) | 5 minuti        | Applicato automaticamente per auth con API key |
| `"long"`            | 1 ora              | Cache estesa                              |
| `"none"`            | Nessuna cache      | Disabilita il caching dei prompt          |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Override della cache per agente">
    Usa i parametri a livello di modello come baseline, poi sovrascrivi agenti specifici tramite `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordine di merge della configurazione:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (id corrispondente, override per chiave)

    Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita la cache per traffico impulsivo / con basso riuso.

  </Accordion>

  <Accordion title="Note su Claude in Bedrock">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.
    - I valori predefiniti smart per API key inizializzano anche `cacheRetention: "short"` per i ref Claude-on-Bedrock quando non è impostato alcun valore esplicito.

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità fast">
    L'interruttore condiviso `/fast` di OpenClaw supporta traffico Anthropic diretto (API key e OAuth verso `api.anthropic.com`).

    | Comando | Corrisponde a |
    |---------|---------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Iniettato solo per richieste dirette a `api.anthropic.com`. I percorsi proxy lasciano `service_tier` invariato.
    - I parametri espliciti `serviceTier` o `service_tier` hanno la precedenza su `/fast` quando entrambi sono impostati.
    - Su account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagini e PDF)">
    Il plugin Anthropic bundled registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capability media a partire dall'auth Anthropic configurata — non
    è necessaria alcuna configurazione aggiuntiva.

    | Proprietà       | Valore               |
    | --------------- | -------------------- |
    | Modello predefinito | `claude-opus-4-6` |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw automaticamente
    lo instrada attraverso il provider Anthropic di comprensione dei media.

  </Accordion>

  <Accordion title="Finestra di contesto 1M (beta)">
    La finestra di contesto 1M di Anthropic è protetta da beta gate. Abilitala per modello:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw la mappa in `anthropic-beta: context-1m-2025-08-07` nelle richieste.

    `params.context1m: true` si applica anche al backend Claude CLI
    (`claude-cli/*`) per i modelli Opus e Sonnet idonei, espandendo la finestra di contesto runtime
    per quelle sessioni CLI in modo da corrispondere al comportamento dell'API diretta.

    <Warning>
    Richiede accesso long-context sulla tua credenziale Anthropic. L'auth token legacy (`sk-ant-oat-*`) viene rifiutata per richieste di contesto 1M — OpenClaw registra un avviso e usa come fallback la finestra di contesto standard.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 contesto 1M">
    `anthropic/claude-opus-4.7` e la sua variante `claude-cli` hanno una finestra di contesto
    1M per impostazione predefinita — non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'auth token Anthropic scade e può essere revocata. Per nuove configurazioni, usa invece una API key Anthropic.
  </Accordion>

  <Accordion title='Nessuna API key trovata per il provider "anthropic"'>
    L'auth Anthropic è **per agente** — i nuovi agenti non ereditano le chiavi dell'agente principale. Riesegui l'onboarding per quell'agente (oppure configura una API key sull'host gateway), poi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale auth profile è attivo. Riesegui l'onboarding, oppure configura una API key per quel percorso profilo.
  </Accordion>

  <Accordion title="Nessun auth profile disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown di rate limit Anthropic possono avere ambito modello, quindi un modello Anthropic sibling potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic o attendi il termine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altri aiuti: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, ref di modello e comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli runtime.
  </Card>
  <Card title="Caching dei prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona il caching dei prompt tra i provider.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riuso delle credenziali.
  </Card>
</CardGroup>
