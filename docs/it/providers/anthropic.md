---
read_when:
    - Vuoi utilizzare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T09:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto all'API Anthropic con fatturazione basata sull'utilizzo (modelli `anthropic/*`)
- **Claude CLI** — riutilizza un login Claude CLI esistente sullo stesso host

<Warning>
Lo staff di Anthropic ci ha comunicato che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi
OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p` autorizzati a meno che
Anthropic non pubblichi una nuova policy.

Per gli host Gateway di lunga durata, le chiavi API Anthropic restano comunque il percorso di produzione più chiaro e
prevedibile.

Documentazione pubblica attuale di Anthropic:

- [Riferimento Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Panoramica di Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Usare Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usare Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Guida introduttiva

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso API standard e fatturazione basata sull'utilizzo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea una chiave API nella [Console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
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
      <Step title="Assicurati che Claude CLI sia installata e che il login sia stato effettuato">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
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
    I dettagli di configurazione e runtime per il backend Claude CLI sono in [Backend CLI](/it/gateway/cli-backends).
    </Note>

    ### Esempio di configurazione

    Preferisci il riferimento canonico al modello Anthropic più un override del runtime CLI:

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

    I riferimenti ai modelli legacy `claude-cli/claude-opus-4-7` continuano a funzionare per
    compatibilità, ma la nuova configurazione dovrebbe mantenere la selezione provider/modello come
    `anthropic/*` e inserire il backend di esecuzione in `agentRuntime.id`.

    <Tip>
    Se vuoi il percorso di fatturazione più chiaro, usa invece una chiave API Anthropic. OpenClaw supporta anche opzioni in stile abbonamento da [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Impostazioni predefinite di pensiero (Claude 4.6)

I modelli Claude 4.6 usano per impostazione predefinita il pensiero `adaptive` in OpenClaw quando non è impostato alcun livello di pensiero esplicito.

Esegui l'override per messaggio con `/think:<level>` oppure nei parametri del modello:

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
- [Pensiero adattivo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pensiero esteso](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caching dei prompt

OpenClaw supporta la funzionalità di caching dei prompt di Anthropic per l'autenticazione con chiave API.

| Valore              | Durata cache   | Descrizione                                      |
| ------------------- | -------------- | ------------------------------------------------ |
| `"short"` (predefinito) | 5 minuti       | Applicato automaticamente per l'autenticazione con chiave API |
| `"long"`            | 1 ora          | Cache estesa                                    |
| `"none"`            | Nessun caching | Disabilita il caching dei prompt                |

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
    Usa i parametri a livello di modello come base, poi esegui l'override di agenti specifici tramite `agents.list[].params`:

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

    Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita il caching per traffico a raffiche o con basso riutilizzo.

  </Accordion>

  <Accordion title="Note su Bedrock Claude">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non Anthropic sono forzati a `cacheRetention: "none"` a runtime.
    - Le impostazioni predefinite intelligenti per chiave API inizializzano anche `cacheRetention: "short"` per i riferimenti Claude-on-Bedrock quando non è impostato alcun valore esplicito.

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità veloce">
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
    - Iniettato solo per richieste dirette a `api.anthropic.com`. Le route proxy lasciano `service_tier` invariato.
    - I parametri espliciti `serviceTier` o `service_tier` hanno precedenza su `/fast` quando entrambi sono impostati.
    - Sugli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagini e PDF)">
    Il Plugin Anthropic incluso registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capacità multimediali dall'autenticazione Anthropic configurata: non è necessaria
    alcuna configurazione aggiuntiva.

    | Proprietà       | Valore               |
    | -------------- | -------------------- |
    | Modello predefinito | `claude-opus-4-6`    |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw lo
    instrada automaticamente attraverso il provider di comprensione multimediale Anthropic.

  </Accordion>

  <Accordion title="Finestra di contesto 1M (beta)">
    La finestra di contesto 1M di Anthropic è protetta da beta. Abilitala per modello:

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

    OpenClaw mappa questo a `anthropic-beta: context-1m-2025-08-07` nelle richieste.

    `params.context1m: true` si applica anche al backend Claude CLI
    (`claude-cli/*`) per i modelli Opus e Sonnet idonei, espandendo la finestra
    di contesto runtime per quelle sessioni CLI in modo che corrisponda al comportamento dell'API diretta.

    <Warning>
    Richiede l'accesso long-context sulla tua credenziale Anthropic. L'autenticazione token legacy (`sk-ant-oat-*`) viene rifiutata per le richieste di contesto 1M: OpenClaw registra un avviso e ripiega sulla finestra di contesto standard.
    </Warning>

  </Accordion>

  <Accordion title="Contesto 1M di Claude Opus 4.7">
    `anthropic/claude-opus-4.7` e la sua variante `claude-cli` hanno una finestra
    di contesto 1M per impostazione predefinita: non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'autenticazione token Anthropic scade e può essere revocata. Per nuove configurazioni, usa invece una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'autenticazione Anthropic è **per agente**: i nuovi agenti non ereditano le chiavi dell'agente principale. Riesegui l'onboarding per quell'agente (oppure configura una chiave API sull'host Gateway), quindi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo. Riesegui l'onboarding oppure configura una chiave API per quel percorso di profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown dei rate limit Anthropic possono essere specifici del modello, quindi un modello Anthropic correlato potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic o attendi il termine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altra assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Dettagli di configurazione e runtime del backend Claude CLI.
  </Card>
  <Card title="Caching dei prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona il caching dei prompt tra provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
