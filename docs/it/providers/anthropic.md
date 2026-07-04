---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic crea la famiglia di modelli **Claude**. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto all'API Anthropic con fatturazione basata sull'utilizzo (modelli `anthropic/*`)
- **Claude CLI** — riutilizza un login Claude Code esistente sullo stesso host

<Warning>
Il backend Claude CLI di OpenClaw esegue la Claude Code CLI installata in
modalità di stampa non interattiva. La documentazione attuale di Anthropic per Claude Code descrive
`claude -p` come uso Agent SDK/programmatico. L'aggiornamento di supporto di Anthropic del 15 giugno 2026
ha sospeso la modifica di fatturazione annunciata per Agent SDK. Per ora, Anthropic afferma che
l'uso di Claude Agent SDK, `claude -p` e di app di terze parti continua ad attingere dai
limiti di utilizzo dell'abbonamento. Il credito mensile Agent SDK precedentemente annunciato
non è disponibile mentre Anthropic rivede quel piano.

Claude Code interattivo continua ad attingere dai limiti del piano Claude con accesso effettuato. L'autenticazione con chiave API
rimane una fatturazione API diretta pay-as-you-go. Per host Gateway longevi,
automazione condivisa e spesa di produzione prevedibile, usa una chiave API Anthropic.

Controlla gli articoli di supporto attuali di Anthropic prima di fare affidamento sul comportamento di
fatturazione dell'abbonamento:

- [Riferimento Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Usare Claude Agent SDK con il tuo piano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usare Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usare Claude Code con il tuo piano Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestire i costi di Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Per iniziare

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
    I dettagli di configurazione e runtime per il backend Claude CLI si trovano in [Backend CLI](/it/gateway/cli-backends).
    </Note>

    <Warning>
    Il riutilizzo di Claude CLI richiede che il processo OpenClaw venga eseguito sullo stesso host del
    login Claude CLI. Le installazioni Docker possono mantenere persistente una home del container ed effettuare l'accesso a
    Claude Code lì; vedi
    [Backend Claude CLI in Docker](/it/install/docker#claude-cli-backend-in-docker).
    Altre installazioni in container, come [Podman](/it/install/podman), non montano
    `~/.claude` dell'host nella configurazione o nel runtime; usa lì una chiave API Anthropic, oppure scegli
    un provider con OAuth gestito da OpenClaw come
    [OpenAI Codex](/it/providers/openai).
    </Warning>

    ### Esempio di configurazione

    Preferisci il riferimento canonico del modello Anthropic più un override del runtime CLI:

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
    compatibilità, ma la nuova configurazione dovrebbe mantenere la selezione provider/modello come
    `anthropic/*` e mettere il backend di esecuzione nella policy runtime di provider/modello.

    ### Fatturazione e `claude -p`

    OpenClaw usa il percorso non interattivo `claude -p` di Claude Code per le esecuzioni Claude CLI.
    Anthropic attualmente tratta quel percorso come uso Agent SDK/programmatico:

    - L'aggiornamento di supporto di Anthropic del 15 giugno 2026 ha sospeso il piano di credito
      separato Agent SDK precedentemente annunciato.
    - Per ora, l'uso di Claude Agent SDK con piano in abbonamento, `claude -p` e app di terze parti
      continua ad attingere dai limiti di utilizzo dell'abbonamento con accesso effettuato.
    - Il credito mensile Agent SDK precedentemente annunciato non è disponibile mentre
      Anthropic rivede quel piano.
    - I login Console/chiave API usano fatturazione API pay-as-you-go e non ricevono
      il credito Agent SDK dell'abbonamento.

    Consulta l'[articolo sul piano Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    di Anthropic per l'avviso di sospensione e gli articoli sui piani Claude Code per il comportamento degli abbonamenti
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    e
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic può modificare la fatturazione e il comportamento dei rate limit di Claude Code senza una
    release di OpenClaw. Controlla `claude auth status`, `/status` e
    la documentazione collegata di Anthropic quando la prevedibilità della fatturazione è importante.

    <Tip>
    Per automazione di produzione condivisa, usa una chiave API Anthropic invece di
    Claude CLI. OpenClaw supporta anche opzioni in stile abbonamento da
    [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valori predefiniti di thinking (Claude Fable 5, 4.8 e 4.6)

`anthropic/claude-fable-5` usa sempre thinking adattivo e per impostazione predefinita usa lo sforzo `high`.
Poiché Anthropic non consente di disabilitare thinking per questo modello,
`/think off` e `/think minimal` usano lo sforzo `low`. OpenClaw omette anche i valori personalizzati di
temperatura per le richieste Fable 5.

Claude Opus 4.8 mantiene thinking disattivato per impostazione predefinita in OpenClaw. Quando abiliti esplicitamente thinking adattivo con `/think high|xhigh|max`, OpenClaw invia i valori di sforzo Opus 4.8 di Anthropic; i modelli Claude 4.6 hanno come impostazione predefinita `adaptive`.

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
- [Thinking adattivo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking esteso](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback per rifiuti di sicurezza (Claude Fable 5)

<Warning>
Usare Claude Fable 5 significa usare anche Claude Opus 4.8. Fable 5 viene distribuito con
classificatori di sicurezza che possono rifiutare una richiesta e il recupero approvato da Anthropic
consiste nel far servire quel turno a `claude-opus-4-8`. OpenClaw aderisce a questa opzione
automaticamente per le richieste dirette con chiave API, quindi alcuni turni Fable ricevono risposta
e vengono fatturati come Claude Opus 4.8. Se la tua policy o il tuo budget non possono accettare
turni serviti da Opus, non selezionare `anthropic/claude-fable-5`.
</Warning>

### Perché esiste

I classificatori Fable 5 restituiscono `stop_reason: "refusal"` su richieste in domini
soggetti a restrizioni, e producono anche falsi positivi su attività benign-adjacent (strumenti di
sicurezza, scienze della vita o persino chiedere al modello di riprodurre il suo
ragionamento grezzo). Senza un fallback, il turno termina con un errore anche se
un altro modello Claude lo servirebbe senza problemi — il messaggio di rifiuto di Anthropic
indica agli integratori API di configurare un modello di fallback.

### Come funziona

1. Per ogni richiesta diretta con chiave API a `anthropic/claude-fable-5`, OpenClaw
   invia l'opt-in al fallback lato server di Anthropic: l'header beta
   `server-side-fallback-2026-06-01` più
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 è l'unico
   target di fallback consentito da Anthropic per Fable 5.
2. Solo un rifiuto del classificatore di sicurezza attiva il fallback. Rate limit,
   sovraccarichi ed errori server si comportano esattamente come prima e passano attraverso
   il normale [failover del modello](/it/concepts/model-failover) di OpenClaw.
3. Il recupero avviene all'interno della stessa chiamata. Un rifiuto prima di qualsiasi output è
   invisibile a parte la latenza; l'intera risposta arriva da Opus 4.8. In caso di
   rifiuto a metà streaming, il testo parziale viene mantenuto come prefisso da cui continua il modello
   di fallback, mentre il ragionamento e le chiamate agli strumenti del modello che ha rifiutato
   vengono scartati secondo le regole di replay di Anthropic (non devono essere rimandati indietro né
   eseguiti).
4. Se anche Claude Opus 4.8 rifiuta, il turno espone il rifiuto come
   errore, esattamente come prima di questa funzionalità.

Il fallback avviene a livello dell'API Anthropic, quindi `claude-opus-4-8` non
deve trovarsi nell'elenco dei modelli configurati o nella catena di fallback — una chiave API
abilitata a Fable può sempre servire Opus.

### Osservabilità e fatturazione

- Un turno servito tramite fallback registra un diagnostico `provider_fallback` sul
  messaggio dell'assistente indicando `fromModel` e `toModel`, e il
  `responseModel` del messaggio riporta `claude-opus-4-8`.
- Anthropic fattura per tentativo: un rifiuto prima dell'output è gratuito e il recupero
  viene fatturato alle tariffe di Claude Opus 4.8 (attualmente la metà delle tariffe Fable 5). La stima dei costi
  per turno di OpenClaw prezza i turni serviti tramite fallback alle tariffe Opus per corrispondere.
- Un rifiuto a metà streaming fattura inoltre il parziale Fable già trasmesso
  lato Anthropic; quella porzione è riportata nell'utilizzo per tentativo dell'API
  ma non viene inclusa nella stima per turno di OpenClaw.

### Ambito

Si applica a `anthropic/claude-fable-5` con autenticazione tramite chiave API verso
`api.anthropic.com`. OAuth (riutilizzo dell'abbonamento Claude CLI), URL base proxy,
Bedrock, Vertex e richieste Foundry restano invariati e continuano a esporre
i rifiuti come errori lì.

Verificato live: un prompt benigno che chiede a Fable 5 di riprodurre la sua catena di
pensiero grezza viene rifiutato con `category: "reasoning_extraction"` quando inviato senza
fallback, e lo stesso prompt tramite OpenClaw restituisce una normale risposta servita da Opus
con il diagnostico `provider_fallback` allegato.

Consulta la [guida a rifiuti e fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
di Anthropic per il comportamento sottostante.

## Caching dei prompt

OpenClaw supporta la funzionalità di caching dei prompt di Anthropic per l'autenticazione con chiave API.

| Valore              | Durata cache | Descrizione                                      |
| ------------------- | ------------ | ------------------------------------------------ |
| `"short"` (predefinito) | 5 minuti     | Applicato automaticamente per l'autenticazione con chiave API |
| `"long"`            | 1 ora        | Cache estesa                                    |
| `"none"`            | Nessun caching | Disabilita il caching dei prompt               |

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
    Usa i parametri a livello di modello come baseline, quindi esegui l'override di agenti specifici tramite `agents.list[].params`:

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

    Ordine di unione della configurazione:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (con `id` corrispondente, sovrascrive per chiave)

    Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita la cache per traffico a raffiche o con basso riutilizzo.

  </Accordion>

  <Accordion title="Note su Claude in Bedrock">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` in fase di runtime.
    - Le impostazioni predefinite intelligenti per chiave API impostano anche `cacheRetention: "short"` per i riferimenti Claude-on-Bedrock quando non è impostato alcun valore esplicito.

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità veloce">
    L'interruttore condiviso `/fast` di OpenClaw supporta il traffico Anthropic diretto (chiave API e OAuth verso `api.anthropic.com`).

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
    - Iniettato solo per richieste dirette a `api.anthropic.com`. Le route proxy lasciano `service_tier` invariato.
    - I parametri espliciti `serviceTier` o `service_tier` sovrascrivono `/fast` quando sono entrambi impostati.
    - Negli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagini e PDF)">
    Il Plugin Anthropic incluso registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capacità multimediali dall'autenticazione Anthropic configurata: non è
    necessaria alcuna configurazione aggiuntiva.

    | Proprietà       | Valore                |
    | ---------------- | --------------------- |
    | Modello predefinito | `claude-opus-4-8`  |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw lo instrada automaticamente
    tramite il provider di comprensione multimediale Anthropic.

  </Accordion>

  <Accordion title="Finestra di contesto da 1M">
    La finestra di contesto da 1M di Anthropic è disponibile sui modelli Claude 4.x compatibili con GA,
    come Opus 4.8, Opus 4.7, Opus 4.6 e Sonnet 4.6. OpenClaw dimensiona questi modelli a
    1M automaticamente:

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
    con quel valore vengono ignorate durante la risoluzione degli header di richiesta e
    i modelli Claude meno recenti non supportati restano sulla loro normale finestra di contesto.

    `params.context1m: true` si applica anche al backend Claude CLI
    (`claude-cli/*`) per i modelli Opus e Sonnet compatibili con GA idonei, preservando
    la finestra di contesto di runtime per quelle sessioni CLI in modo che corrisponda al comportamento
    dell'API diretta.

    <Warning>
    Richiede l'accesso al contesto lungo sulla tua credenziale Anthropic. L'autenticazione con OAuth/token di abbonamento mantiene i suoi header beta Anthropic richiesti, ma OpenClaw rimuove l'header beta 1M ritirato se resta nella configurazione meno recente.
    </Warning>

  </Accordion>

  <Accordion title="Contesto 1M di Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e la sua variante `claude-cli` hanno una finestra di contesto da 1M
    per impostazione predefinita: non serve `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'autenticazione con token Anthropic scade e può essere revocata. Per le nuove configurazioni, usa invece una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'autenticazione Anthropic è **per agente**: i nuovi agenti non ereditano le chiavi dell'agente principale. Esegui di nuovo l'onboarding per quell'agente (o configura una chiave API sull'host del gateway), quindi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo. Esegui di nuovo l'onboarding oppure configura una chiave API per quel percorso di profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown per limite di frequenza Anthropic possono essere specifici del modello, quindi un modello Anthropic correlato potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic o attendi il termine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli di runtime.
  </Card>
  <Card title="Cache dei prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona la cache dei prompt tra i provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
