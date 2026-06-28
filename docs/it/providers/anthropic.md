---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto all'API Anthropic con fatturazione basata sull'uso (modelli `anthropic/*`)
- **Claude CLI** — riutilizza un accesso Claude Code esistente sullo stesso host

<Warning>
Il backend Claude CLI di OpenClaw esegue la Claude Code CLI installata in
modalità di stampa non interattiva. La documentazione attuale di Claude Code di Anthropic descrive
`claude -p` come utilizzo Agent SDK/programmatico. L'aggiornamento di supporto
di Anthropic del 15 giugno 2026 ha sospeso la modifica annunciata alla fatturazione dell'Agent SDK.
Per ora, Anthropic afferma che l'uso di Claude Agent SDK, `claude -p` e delle app di terze parti
continua a consumare i limiti di utilizzo dell'abbonamento.
Il credito mensile Agent SDK annunciato in precedenza non è disponibile mentre Anthropic rivede quel piano.

Claude Code interattivo continua a consumare i limiti del piano Claude connesso. L'autenticazione con
chiave API rimane una fatturazione API diretta a consumo. Per host gateway a lunga durata,
automazione condivisa e spesa di produzione prevedibile, usa una chiave API Anthropic.

Controlla gli articoli di supporto attuali di Anthropic prima di fare affidamento sul comportamento
di fatturazione dell'abbonamento:

- [Riferimento Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Usare Claude Agent SDK con il tuo piano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usare Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usare Claude Code con il tuo piano Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestire i costi di Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Per iniziare

<Tabs>
  <Tab title="API key">
    **Ideale per:** accesso API standard e fatturazione basata sull'uso.

    <Steps>
      <Step title="Get your API key">
        Crea una chiave API nella [Console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideale per:** riutilizzare un accesso Claude CLI esistente senza una chiave API separata.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw rileva e riutilizza le credenziali Claude CLI esistenti.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    I dettagli di configurazione e runtime per il backend Claude CLI sono in [Backend CLI](/it/gateway/cli-backends).
    </Note>

    <Warning>
    Il riutilizzo di Claude CLI richiede che il processo OpenClaw venga eseguito sullo stesso host
    dell'accesso Claude CLI. Le installazioni Docker possono rendere persistente la home di un container ed effettuare l'accesso a
    Claude Code lì; consulta
    [Backend Claude CLI in Docker](/it/install/docker#claude-cli-backend-in-docker).
    Altre installazioni in container, come [Podman](/it/install/podman), non montano
    `~/.claude` dell'host nella configurazione o nel runtime; usa lì una chiave API Anthropic, oppure scegli
    un provider con OAuth gestito da OpenClaw, come
    [OpenAI Codex](/it/providers/openai).
    </Warning>

    ### Esempio di configurazione

    Preferisci il riferimento canonico al modello Anthropic più un override del runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    I riferimenti modello legacy `claude-cli/claude-opus-4-7` continuano a funzionare per
    compatibilità, ma la nuova configurazione dovrebbe mantenere la selezione provider/modello come
    `anthropic/*` e inserire il backend di esecuzione nella policy runtime provider/modello.

    ### Fatturazione e `claude -p`

    OpenClaw usa il percorso non interattivo `claude -p` di Claude Code per le esecuzioni Claude CLI.
    Attualmente Anthropic tratta quel percorso come utilizzo Agent SDK/programmatico:

    - L'aggiornamento di supporto di Anthropic del 15 giugno 2026 ha sospeso il piano separato
      di credito Agent SDK annunciato in precedenza.
    - Per ora, l'utilizzo di Claude Agent SDK con piano in abbonamento, `claude -p` e app di terze parti
      continua a consumare i limiti di utilizzo dell'abbonamento connesso.
    - Il credito mensile Agent SDK annunciato in precedenza non è disponibile mentre
      Anthropic rivede quel piano.
    - Gli accessi Console/chiave API usano la fatturazione API a consumo e non ricevono
      il credito Agent SDK dell'abbonamento.

    Consulta l'[articolo sul piano Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    di Anthropic per l'avviso di sospensione, e gli articoli sui piani Claude Code per il comportamento
    degli abbonamenti
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    e
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic può modificare la fatturazione e il comportamento dei limiti di frequenza di Claude Code senza una
    release di OpenClaw. Controlla `claude auth status`, `/status` e
    la documentazione collegata di Anthropic quando la prevedibilità della fatturazione è importante.

    <Tip>
    Per l'automazione di produzione condivisa, usa una chiave API Anthropic invece di
    Claude CLI. OpenClaw supporta anche opzioni in stile abbonamento da
    [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Impostazioni predefinite di ragionamento (Claude Fable 5, 4.8 e 4.6)

`anthropic/claude-fable-5` usa sempre il ragionamento adattivo e l'impegno predefinito `high`.
Poiché Anthropic non consente di disabilitare il ragionamento per questo modello,
`/think off` e `/think minimal` usano l'impegno `low`. OpenClaw omette inoltre i valori
di temperatura personalizzati per le richieste Fable 5.

Claude Opus 4.8 mantiene il thinking disattivato per impostazione predefinita in OpenClaw. Quando abiliti esplicitamente il thinking adattivo con `/think high|xhigh|max`, OpenClaw invia i valori di effort di Opus 4.8 di Anthropic; i modelli Claude 4.6 usano `adaptive` come impostazione predefinita.

Esegui l'override per singolo messaggio con `/think:<level>` o nei parametri del modello:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Documentazione Anthropic correlata:
- [Thinking adattivo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking esteso](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caching dei prompt

OpenClaw supporta la funzionalità di caching dei prompt di Anthropic per l'autenticazione con chiave API.

| Valore              | Durata della cache | Descrizione                                           |
| ------------------- | ------------------ | ----------------------------------------------------- |
| `"short"` (predefinito) | 5 minuti       | Applicato automaticamente per l'autenticazione con chiave API |
| `"long"`            | 1 ora              | Cache estesa                                         |
| `"none"`            | Nessun caching     | Disabilita il caching dei prompt                     |

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
    - I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.
    - Le impostazioni predefinite intelligenti per chiave API impostano anche `cacheRetention: "short"` per i riferimenti Claude-on-Bedrock quando non è impostato alcun valore esplicito.

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
    - I parametri espliciti `serviceTier` o `service_tier` eseguono l'override di `/fast` quando sono entrambi impostati.
    - Sugli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagini e PDF)">
    Il Plugin Anthropic in bundle registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capacità multimediali dall'autenticazione Anthropic configurata: non
    è necessaria alcuna configurazione aggiuntiva.

    | Proprietà       | Valore                |
    | --------------- | --------------------- |
    | Modello predefinito | `claude-opus-4-8` |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF è allegato a una conversazione, OpenClaw lo instrada automaticamente
    tramite il provider di comprensione dei media Anthropic.

  </Accordion>

  <Accordion title="Finestra di contesto 1M">
    La finestra di contesto 1M di Anthropic è disponibile sui modelli Claude 4.x compatibili con GA,
    come Opus 4.8, Opus 4.7, Opus 4.6 e Sonnet 4.6. OpenClaw dimensiona automaticamente quei modelli a
    1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Le configurazioni meno recenti possono mantenere `params.context1m: true`, ma OpenClaw non invia più
    l'header beta ritirato `context-1m-2025-08-07`. Le voci di configurazione `anthropicBeta` meno recenti
    con quel valore vengono ignorate durante la risoluzione degli header della richiesta e
    i modelli Claude meno recenti non supportati restano sulla loro normale finestra di contesto.

    `params.context1m: true` si applica anche al backend CLI di Claude
    (`claude-cli/*`) per i modelli Opus e Sonnet idonei compatibili con GA, preservando
    la finestra di contesto runtime per quelle sessioni CLI in modo che corrisponda al comportamento
    dell'API diretta.

    <Warning>
    Richiede l'accesso a contesto lungo sulla tua credenziale Anthropic. L'autenticazione con token OAuth/abbonamento mantiene i propri header beta Anthropic richiesti, ma OpenClaw rimuove l'header beta 1M ritirato se resta in una configurazione meno recente.
    </Warning>

  </Accordion>

  <Accordion title="Contesto 1M di Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e la sua variante `claude-cli` hanno una finestra
    di contesto 1M per impostazione predefinita: non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'autenticazione tramite token Anthropic scade e può essere revocata. Per le nuove configurazioni, usa invece una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'autenticazione Anthropic è **per agente**: i nuovi agenti non ereditano le chiavi dell'agente principale. Esegui di nuovo l'onboarding per quell'agente (oppure configura una chiave API sull'host del gateway), quindi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo. Esegui di nuovo l'onboarding oppure configura una chiave API per il percorso di quel profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown per i limiti di frequenza Anthropic possono essere specifici per modello, quindi un modello Anthropic dello stesso gruppo potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic o attendi il cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli di runtime.
  </Card>
  <Card title="Caching dei prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona il caching dei prompt tra provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
