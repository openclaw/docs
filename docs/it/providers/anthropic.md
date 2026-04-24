---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T08:55:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di auth:

- **Chiave API** — accesso diretto all'API Anthropic con fatturazione a consumo (modelli `anthropic/*`)
- **Claude CLI** — riutilizza un login Claude CLI esistente sullo stesso host

<Warning>
Lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi
OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p` come approvati a meno che
Anthropic non pubblichi una nuova policy.

Per host gateway a lunga durata, le chiavi API Anthropic restano comunque il percorso di produzione
più chiaro e prevedibile.

Documentazione pubblica attuale di Anthropic:

- [Riferimento CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Panoramica Agent SDK di Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Uso di Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Uso di Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Per iniziare

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso API standard e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea una chiave API nella [Console Anthropic](https://console.anthropic.com/).
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
    **Ideale per:** riutilizzare un login Claude CLI esistente senza una chiave API separata.

    <Steps>
      <Step title="Assicurati che Claude CLI sia installato e autenticato">
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

        OpenClaw rileva e riutilizza le credenziali Claude CLI esistenti.
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    I dettagli di configurazione e runtime del backend Claude CLI sono in [CLI Backends](/it/gateway/cli-backends).
    </Note>

    <Tip>
    Se vuoi il percorso di fatturazione più chiaro, usa invece una chiave API Anthropic. OpenClaw supporta anche opzioni in stile subscription da [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valori predefiniti del ragionamento (Claude 4.6)

I modelli Claude 4.6 usano per impostazione predefinita il ragionamento `adaptive` in OpenClaw quando non è impostato alcun livello di ragionamento esplicito.

Sovrascrivilo per messaggio con `/think:<level>` oppure nei parametri del modello:

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

## Prompt caching

OpenClaw supporta la funzionalità di prompt caching di Anthropic per l'auth con chiave API.

| Valore              | Durata cache | Descrizione                             |
| ------------------- | ------------ | --------------------------------------- |
| `"short"` (predefinito) | 5 minuti     | Applicato automaticamente per auth con chiave API |
| `"long"`            | 1 ora        | Cache estesa                            |
| `"none"`            | Nessuna cache | Disabilita il prompt caching            |

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
    Usa i parametri a livello modello come baseline, poi sovrascrivi agenti specifici tramite `agents.list[].params`:

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
    2. `agents.list[].params` (matching per `id`, sovrascrive per chiave)

    Questo consente a un agente di mantenere una cache a lunga durata mentre un altro agente sullo stesso modello disabilita la cache per traffico bursty/a basso riuso.

  </Accordion>

  <Accordion title="Note su Bedrock Claude">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non-Anthropic vengono forzati a `cacheRetention: "none"` a runtime.
    - I valori predefiniti intelligenti delle chiavi API inizializzano anche `cacheRetention: "short"` per i riferimenti Claude-on-Bedrock quando non è impostato alcun valore esplicito.
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità fast">
    Il toggle condiviso `/fast` di OpenClaw supporta il traffico Anthropic diretto (chiave API e OAuth verso `api.anthropic.com`).

    | Comando | Mappa a |
    |---------|---------|
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
    - Viene iniettato solo per richieste dirette a `api.anthropic.com`. I percorsi proxy lasciano invariato `service_tier`.
    - I parametri espliciti `serviceTier` o `service_tier` hanno la precedenza su `/fast` quando entrambi sono impostati.
    - Su account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.
    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagini e PDF)">
    Il plugin Anthropic bundled registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capacità media dall'auth Anthropic configurata — non
    è necessaria alcuna configurazione aggiuntiva.

    | Proprietà        | Valore               |
    | ---------------- | -------------------- |
    | Modello predefinito | `claude-opus-4-6` |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw lo
    instrada automaticamente tramite il provider Anthropic di comprensione dei media.

  </Accordion>

  <Accordion title="Finestra di contesto 1M (beta)">
    La finestra di contesto 1M di Anthropic è controllata da un beta gate. Abilitala per modello:

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

    OpenClaw la mappa a `anthropic-beta: context-1m-2025-08-07` nelle richieste.

    <Warning>
    Richiede accesso long-context sulla tua credenziale Anthropic. L'auth con token legacy (`sk-ant-oat-*`) viene rifiutata per richieste di contesto 1M — OpenClaw registra un avviso e usa come fallback la finestra di contesto standard.
    </Warning>

  </Accordion>

  <Accordion title="Contesto 1M di Claude Opus 4.7">
    `anthropic/claude-opus-4.7` e la sua variante `claude-cli` hanno una finestra di contesto
    1M per impostazione predefinita — non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'auth con token Anthropic scade e può essere revocata. Per nuove configurazioni, usa invece una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'auth Anthropic è **per agente** — i nuovi agenti non ereditano le chiavi dell'agente principale. Riesegui l'onboarding per quell'agente (oppure configura una chiave API sull'host del gateway), poi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo auth è attivo. Riesegui l'onboarding oppure configura una chiave API per quel percorso di profilo.
  </Accordion>

  <Accordion title="Nessun profilo auth disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown dei limiti di frequenza Anthropic possono essere legati al modello, quindi un modello Anthropic sibling può essere ancora utilizzabile. Aggiungi un altro profilo Anthropic oppure attendi la fine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Troubleshooting](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="CLI backends" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli di runtime.
  </Card>
  <Card title="Prompt caching" href="/it/reference/prompt-caching" icon="database">
    Come funziona il prompt caching tra i provider.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
