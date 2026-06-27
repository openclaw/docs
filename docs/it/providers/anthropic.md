---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:04:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto all'API Anthropic con fatturazione basata sull'uso (modelli `anthropic/*`)
- **Claude CLI** — riutilizza un login Claude Code esistente sullo stesso host

<Warning>
Il backend Claude CLI di OpenClaw esegue la CLI Claude Code installata in
modalità print non interattiva. La documentazione attuale di Claude Code di Anthropic descrive
`claude -p` come uso Agent SDK/programmatico. A partire dal 15 giugno 2026, Anthropic
afferma che l'uso di `claude -p` con piano in abbonamento non attinge più dai normali limiti del piano Claude;
attinge prima da un credito Agent SDK mensile separato, poi dai
crediti di utilizzo alle tariffe API standard quando questi crediti sono abilitati.

Claude Code interattivo continua ad attingere dai limiti del piano Claude dell'account connesso. L'autenticazione con chiave API
rimane fatturazione API diretta a consumo. Per host gateway di lunga durata,
automazione condivisa e spesa di produzione prevedibile, usa una chiave API Anthropic.

Documentazione pubblica attuale di Anthropic:

- [Riferimento CLI di Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Usare Claude Agent SDK con il tuo piano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usare Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usare Claude Code con il tuo piano Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestire i costi di Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Per iniziare

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso API standard e fatturazione basata sull'uso.

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideale per:** riutilizzare un login Claude CLI esistente senza una chiave API separata.

    <Steps>
      <Step title="Assicurati che Claude CLI sia installata e che l'accesso sia stato effettuato">
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
    I dettagli di configurazione ed esecuzione per il backend Claude CLI sono in [Backend CLI](/it/gateway/cli-backends).
    </Note>

    <Warning>
    Il riutilizzo di Claude CLI richiede che il processo OpenClaw venga eseguito sullo stesso host del
    login Claude CLI. Le installazioni Docker possono mantenere una home del container ed effettuare l'accesso a
    Claude Code lì; vedi
    [Backend Claude CLI in Docker](/it/install/docker#claude-cli-backend-in-docker).
    Altre installazioni in container come [Podman](/it/install/podman) non montano
    `~/.claude` dell'host nella configurazione o nel runtime; usa lì una chiave API Anthropic, oppure scegli
    un provider con OAuth gestito da OpenClaw come
    [OpenAI Codex](/it/providers/openai).
    </Warning>

    ### Esempio di configurazione

    Preferisci il riferimento canonico al modello Anthropic più un override di runtime CLI:

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

    I riferimenti modello legacy `claude-cli/claude-opus-4-7` funzionano ancora per
    compatibilità, ma le nuove configurazioni dovrebbero mantenere la selezione provider/modello come
    `anthropic/*` e inserire il backend di esecuzione nella policy di runtime provider/modello.

    ### Fatturazione e `claude -p`

    OpenClaw usa il percorso non interattivo `claude -p` di Claude Code per le esecuzioni Claude CLI.
    Attualmente Anthropic tratta quel percorso come uso Agent SDK/programmatico:

    - Fino al 15 giugno 2026, la gestione dei piani in abbonamento segue le regole Claude Code
      attive di Anthropic per l'account connesso.
    - A partire dal 15 giugno 2026, l'uso di `claude -p` con piano in abbonamento attinge prima dal
      credito Agent SDK mensile dell'utente, poi dai crediti di utilizzo alle tariffe
      API standard se i crediti di utilizzo sono abilitati.
    - I login Console/chiave API usano la fatturazione API a consumo e non ricevono
      il credito Agent SDK dell'abbonamento.

    Anthropic può modificare la fatturazione e il comportamento dei limiti di frequenza di Claude Code senza una
    release di OpenClaw. Controlla `claude auth status`, `/status` e
    la documentazione Anthropic collegata quando la prevedibilità della fatturazione è importante.

    <Tip>
    Per l'automazione di produzione condivisa, usa una chiave API Anthropic invece di
    Claude CLI. OpenClaw supporta anche opzioni in stile abbonamento da
    [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Impostazioni predefinite di thinking (Claude Fable 5, 4.8 e 4.6)

`anthropic/claude-fable-5` usa sempre adaptive thinking e ha come valore predefinito lo sforzo `high`.
Poiché Anthropic non consente di disabilitare thinking per questo modello,
`/think off` e `/think minimal` usano lo sforzo `low`. OpenClaw omette anche i valori di
temperatura personalizzati per le richieste Fable 5.

Claude Opus 4.8 mantiene thinking disattivato per impostazione predefinita in OpenClaw. Quando abiliti esplicitamente adaptive thinking con `/think high|xhigh|max`, OpenClaw invia i valori di sforzo Opus 4.8 di Anthropic; i modelli Claude 4.6 usano come valore predefinito `adaptive`.

Esegui l'override per messaggio con `/think:<level>` o nei parametri del modello:

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caching dei prompt

OpenClaw supporta la funzionalità di caching dei prompt di Anthropic per l'autenticazione con chiave API.

| Valore              | Durata cache   | Descrizione                                           |
| ------------------- | -------------- | ----------------------------------------------------- |
| `"short"` (predefinito) | 5 minuti       | Applicato automaticamente per l'autenticazione con chiave API |
| `"long"`            | 1 ora          | Cache estesa                                          |
| `"none"`            | Nessun caching | Disabilita il caching dei prompt                      |

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

    Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita il caching per traffico a raffiche/con basso riutilizzo.

  </Accordion>

  <Accordion title="Note su Claude in Bedrock">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` in fase di runtime.
    - Le impostazioni predefinite intelligenti con chiave API inizializzano anche `cacheRetention: "short"` per i riferimenti Claude su Bedrock quando non è impostato alcun valore esplicito.

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
    - I parametri espliciti `serviceTier` o `service_tier` eseguono l'override di `/fast` quando sono impostati entrambi.
    - Sugli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagine e PDF)">
    Il Plugin Anthropic incluso registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capacità multimediali dall'autenticazione Anthropic configurata: non è necessaria
    alcuna configurazione aggiuntiva.

    | Proprietà       | Valore                |
    | --------------- | --------------------- |
    | Modello predefinito | `claude-opus-4-8`     |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw lo instrada automaticamente
    tramite il provider di comprensione multimediale Anthropic.

  </Accordion>

  <Accordion title="Finestra di contesto da 1M">
    La finestra di contesto da 1M di Anthropic è disponibile sui modelli Claude 4.x compatibili con GA
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

    Le configurazioni più vecchie possono mantenere `params.context1m: true`, ma OpenClaw non invia più
    l'header beta ritirato `context-1m-2025-08-07`. Le voci di configurazione `anthropicBeta` più vecchie
    con quel valore vengono ignorate durante la risoluzione degli header della richiesta e
    i modelli Claude più vecchi non supportati restano sulla loro normale finestra di contesto.

    `params.context1m: true` si applica anche al backend Claude CLI
    (`claude-cli/*`) per i modelli Opus e Sonnet idonei compatibili con GA, preservando
    la finestra di contesto del runtime per quelle sessioni CLI in modo che corrisponda al comportamento
    dell'API diretta.

    <Warning>
    Richiede accesso al contesto lungo sulla tua credenziale Anthropic. L'autenticazione con token OAuth/abbonamento mantiene i suoi header beta Anthropic richiesti, ma OpenClaw rimuove l'header beta 1M ritirato se resta in una configurazione più vecchia.
    </Warning>

  </Accordion>

  <Accordion title="Contesto da 1M di Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e la sua variante `claude-cli` hanno una finestra di contesto
    da 1M per impostazione predefinita — non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'autenticazione con token Anthropic scade e può essere revocata. Per le nuove configurazioni, usa invece una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'autenticazione Anthropic è **per agente**: i nuovi agenti non ereditano le chiavi dell'agente principale. Esegui di nuovo l'onboarding per quell'agente (oppure configura una chiave API sull'host del Gateway), quindi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo. Esegui di nuovo l'onboarding oppure configura una chiave API per quel percorso di profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown dei limiti di frequenza di Anthropic possono essere specifici del modello, quindi un modello Anthropic affine potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic o attendi il termine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Ulteriore aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di commutazione in caso di errore.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli di esecuzione.
  </Card>
  <Card title="Caching dei prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona il caching dei prompt tra i provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
