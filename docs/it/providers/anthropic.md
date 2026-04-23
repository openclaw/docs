---
read_when:
    - Vuoi usare modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T08:34:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto all’API Anthropic con fatturazione basata sull’utilizzo (modelli `anthropic/*`)
- **Claude CLI** — riutilizza un login Claude CLI esistente sullo stesso host

<Warning>
Il personale Anthropic ci ha detto che l’uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi
OpenClaw tratta il riuso di Claude CLI e l’uso di `claude -p` come approvati a meno che
Anthropic non pubblichi una nuova policy.

Per host Gateway di lunga durata, le chiavi API Anthropic restano comunque il percorso di produzione
più chiaro e prevedibile.

Documentazione pubblica attuale di Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Per iniziare

<Tabs>
  <Tab title="API key">
    **Ideale per:** accesso API standard e fatturazione basata sull’utilizzo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea una chiave API nella [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Esegui l’onboarding">
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
      <Step title="Assicurati che Claude CLI sia installato e con accesso eseguito">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Esegui l’onboarding">
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
    I dettagli di setup e runtime per il backend Claude CLI sono in [CLI Backends](/it/gateway/cli-backends).
    </Note>

    <Tip>
    Se vuoi il percorso di fatturazione più chiaro, usa invece una chiave API Anthropic. OpenClaw supporta anche opzioni in stile abbonamento da [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Impostazioni predefinite del thinking (Claude 4.6)

I modelli Claude 4.6 usano per impostazione predefinita il thinking `adaptive` in OpenClaw quando non è impostato alcun livello di thinking esplicito.

Esegui l’override per messaggio con `/think:<level>` oppure nei parametri del modello:

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

## Caching del prompt

OpenClaw supporta la funzionalità di prompt caching di Anthropic per l’autenticazione con chiave API.

| Valore              | Durata cache | Descrizione                                  |
| ------------------- | ------------ | -------------------------------------------- |
| `"short"` (predefinito) | 5 minuti  | Applicato automaticamente per l’autenticazione con chiave API |
| `"long"`            | 1 ora        | Cache estesa                                 |
| `"none"`            | Nessuna cache | Disabilita il prompt caching                |

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
  <Accordion title="Override cache per agente">
    Usa i parametri a livello di modello come baseline, poi fai override di agenti specifici tramite `agents.list[].params`:

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
    2. `agents.list[].params` (`id` corrispondente, override per chiave)

    Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita la cache per traffico bursty/a basso riutilizzo.

  </Accordion>

  <Accordion title="Note su Claude su Bedrock">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.
    - Le impostazioni predefinite intelligenti per le chiavi API inizializzano anche `cacheRetention: "short"` per i ref Claude-on-Bedrock quando non è impostato alcun valore esplicito.
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità veloce">
    Il toggle condiviso `/fast` di OpenClaw supporta il traffico Anthropic diretto (chiave API e OAuth verso `api.anthropic.com`).

    | Comando | Mappa su |
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
    - Iniettato solo per richieste dirette a `api.anthropic.com`. Le route proxy lasciano `service_tier` invariato.
    - I parametri espliciti `serviceTier` o `service_tier` hanno la precedenza su `/fast` quando sono impostati entrambi.
    - Sugli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.
    </Note>

  </Accordion>

  <Accordion title="Media Understanding (immagini e PDF)">
    Il plugin Anthropic bundled registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capability media dall’autenticazione Anthropic configurata — non
    è necessaria alcuna configurazione aggiuntiva.

    | Proprietà        | Valore              |
    | ---------------- | ------------------- |
    | Modello predefinito | `claude-opus-4-6` |
    | Input supportati | Immagini, documenti PDF |

    Quando un’immagine o un PDF viene allegato a una conversazione, OpenClaw lo
    instrada automaticamente attraverso il provider Anthropic di Media Understanding.

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

    OpenClaw la mappa a `anthropic-beta: context-1m-2025-08-07` nelle richieste.

    <Warning>
    Richiede accesso long-context sulla tua credenziale Anthropic. L’autenticazione con token legacy (`sk-ant-oat-*`) viene rifiutata per le richieste di contesto 1M — OpenClaw registra un avviso e torna alla finestra di contesto standard.
    </Warning>

  </Accordion>

  <Accordion title="Contesto 1M per Claude Opus 4.7">
    `anthropic/claude-opus-4.7` e la sua variante `claude-cli` hanno una finestra di contesto 1M
    per impostazione predefinita — non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L’autenticazione con token Anthropic può scadere o essere revocata. Per le nuove configurazioni, migra a una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L’autenticazione è **per agente**. I nuovi agenti non ereditano le chiavi dell’agente principale. Riesegui l’onboarding per quell’agente, oppure configura una chiave API sull’host Gateway, quindi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo. Riesegui l’onboarding oppure configura una chiave API per il percorso di quel profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown di rate limit Anthropic possono essere limitati al modello, quindi un modello Anthropic correlato potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic oppure attendi la fine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Troubleshooting](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli runtime.
  </Card>
  <Card title="Caching del prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona il prompt caching tra i provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
