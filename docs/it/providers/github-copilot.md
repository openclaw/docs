---
read_when:
    - Vuoi usare GitHub Copilot come provider di modelli
    - Ti serve il flusso `openclaw models auth login-github-copilot`
    - Stai scegliendo tra il provider Copilot integrato, l'harness Copilot SDK e Copilot Proxy
summary: Accedi a GitHub Copilot da OpenClaw usando il flusso del dispositivo o l'importazione non interattiva del token
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:06:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot è l'assistente di codifica AI di GitHub. Fornisce accesso ai modelli Copilot
per il tuo account e piano GitHub. OpenClaw può usare Copilot come provider di modelli
o runtime agente in tre modi diversi.

## Tre modi per usare Copilot in OpenClaw

<Tabs>
  <Tab title="Provider integrato (github-copilot)">
    Usa il flusso nativo di accesso dispositivo per ottenere un token GitHub, quindi scambialo con
    token API Copilot quando OpenClaw viene eseguito. Questo è il percorso **predefinito** e più semplice
    perché non richiede VS Code.

    <Steps>
      <Step title="Esegui il comando di accesso">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Ti verrà chiesto di visitare un URL e inserire un codice monouso. Tieni il
        terminale aperto finché non completa l'operazione.
      </Step>
      <Step title="Imposta un modello predefinito">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Oppure nella configurazione:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin harness Copilot SDK (copilot)">
    Installa il plugin esterno `@openclaw/copilot` quando vuoi che la
    CLI e l'SDK Copilot di GitHub gestiscano il loop agente di basso livello per i modelli
    `github-copilot/*` selezionati.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Quindi abilita il runtime per un modello o un provider:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Scegli questa opzione quando vuoi sessioni native della CLI Copilot, stato dei thread
    gestito dall'SDK e Compaction gestita da Copilot per quei turni agente. Consulta
    [harness Copilot SDK](/it/plugins/copilot) per il contratto completo del runtime.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa l'estensione VS Code **Copilot Proxy** come bridge locale. OpenClaw comunica con
    l'endpoint `/v1` del proxy e usa l'elenco di modelli che configuri lì.

    <Note>
    Scegli questa opzione quando esegui già Copilot Proxy in VS Code o devi instradare
    tramite esso. Devi abilitare il plugin e mantenere in esecuzione l'estensione VS Code.
    </Note>

  </Tab>
</Tabs>

## Flag facoltativi

| Flag            | Descrizione                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Salta la richiesta di conferma                        |
| `--set-default` | Applica anche il modello predefinito consigliato dal provider |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Onboarding non interattivo

Se hai già un token di accesso GitHub OAuth per Copilot, importalo durante la
configurazione headless con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Puoi anche omettere `--auth-choice`; passando `--github-copilot-token` viene dedotta la
scelta di autenticazione del provider GitHub Copilot. Se il flag viene omesso, l'onboarding
ripiega su `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, quindi `GITHUB_TOKEN`. Usa
`--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` impostato per archiviare un
`tokenRef` basato su env invece del testo in chiaro in `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interattivo richiesto">
    Il flusso di accesso dispositivo richiede un TTY interattivo. Eseguilo direttamente in un
    terminale, non in uno script non interattivo o in una pipeline CI.
  </Accordion>

  <Accordion title="La disponibilità dei modelli dipende dal tuo piano">
    La disponibilità dei modelli Copilot dipende dal tuo piano GitHub. Se un modello viene
    rifiutato, prova un altro ID (per esempio `github-copilot/gpt-5.5`). Consulta
    i [modelli supportati per piano Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    di GitHub per l'elenco aggiornato dei modelli.
  </Accordion>

  <Accordion title="Aggiornamento live del catalogo dall'API Copilot">
    Quando il percorso di autenticazione tramite accesso dispositivo (o variabile env) ha risolto un token GitHub,
    OpenClaw aggiorna il catalogo dei modelli su richiesta da `${baseUrl}/models`
    (lo stesso endpoint usato da VS Code Copilot), così il runtime tiene traccia
    dei diritti per account e delle finestre di contesto accurate senza modifiche al manifest.
    I modelli Copilot appena pubblicati diventano visibili senza un aggiornamento di OpenClaw
    e le finestre di contesto riflettono i limiti reali per modello
    (per es. 400k per la serie gpt-5.x, 1M per le varianti interne
    `claude-opus-*-1m`).

    Il catalogo statico incluso rimane il fallback visibile quando la discovery
    è disabilitata, l'utente non ha un profilo di autenticazione GitHub, lo scambio del token
    fallisce o la chiamata HTTPS a `/models` genera un errore. Per disattivare e fare affidamento interamente
    sul catalogo del manifest statico (scenari offline / air-gapped):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Selezione del trasporto">
    Gli ID dei modelli Claude usano automaticamente il trasporto Anthropic Messages. I modelli GPT,
    o-series e Gemini mantengono il trasporto OpenAI Responses. OpenClaw
    seleziona il trasporto corretto in base al riferimento del modello.
  </Accordion>

  <Accordion title="Compatibilità delle richieste">
    OpenClaw invia header di richiesta in stile IDE Copilot sui trasporti Copilot,
    inclusi i turni successivi per Compaction integrata, risultati degli strumenti e immagini. Non
    abilita la continuazione Responses a livello di provider per Copilot, a meno che
    quel comportamento non sia stato verificato rispetto all'API di Copilot.
  </Accordion>

  <Accordion title="Ordine di risoluzione delle variabili di ambiente">
    OpenClaw risolve l'autenticazione Copilot dalle variabili di ambiente nel seguente
    ordine di priorità:

    | Priorità | Variabile              | Note                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorità massima, specifica per Copilot |
    | 2        | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | Token GitHub standard (minima)   |

    Quando sono impostate più variabili, OpenClaw usa quella con priorità più alta.
    Il flusso di accesso dispositivo (`openclaw models auth login-github-copilot`) archivia
    il suo token nello store dei profili di autenticazione e ha precedenza su tutte le variabili
    di ambiente.

  </Accordion>

  <Accordion title="Archiviazione dei token">
    L'accesso archivia un token GitHub nello store dei profili di autenticazione e lo scambia
    con un token API Copilot quando OpenClaw viene eseguito. Non devi gestire il
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Il comando di accesso dispositivo richiede un TTY interattivo. Usa l'onboarding non interattivo
quando hai bisogno di una configurazione headless.
</Warning>

## Embedding per la ricerca in memoria

GitHub Copilot può anche servire come provider di embedding per la
[ricerca in memoria](/it/concepts/memory-search). Se hai un abbonamento Copilot e
hai effettuato l'accesso, OpenClaw può usarlo per gli embedding senza una chiave API separata.

### Configurazione

Imposta esplicitamente `memorySearch.provider` per usare gli embedding GitHub Copilot. Se è
disponibile un token GitHub, OpenClaw scopre i modelli di embedding disponibili dall'API
Copilot e sceglie automaticamente il migliore.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Come funziona

1. OpenClaw risolve il tuo token GitHub (da variabili env o profilo di autenticazione).
2. Lo scambia con un token API Copilot di breve durata.
3. Interroga l'endpoint `/models` di Copilot per scoprire i modelli di embedding disponibili.
4. Sceglie il modello migliore (preferisce `text-embedding-3-small`).
5. Invia richieste di embedding all'endpoint `/embeddings` di Copilot.

La disponibilità dei modelli dipende dal tuo piano GitHub. Se non sono disponibili modelli di embedding,
OpenClaw salta Copilot e prova il provider successivo.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
