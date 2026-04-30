---
read_when:
    - Vuoi usare GitHub Copilot come fornitore di modelli
    - È necessario il flusso `openclaw models auth login-github-copilot`
summary: Accedi a GitHub Copilot da OpenClaw usando il flusso del dispositivo o l'importazione del token non interattiva
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T09:08:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot è l'assistente di codifica AI di GitHub. Fornisce accesso ai modelli
Copilot per il tuo account e piano GitHub. OpenClaw può usare Copilot come
provider di modelli in due modi diversi.

## Due modi per usare Copilot in OpenClaw

<Tabs>
  <Tab title="Provider integrato (github-copilot)">
    Usa il flusso nativo di accesso tramite dispositivo per ottenere un token GitHub, quindi scambialo con
    token API Copilot quando OpenClaw viene eseguito. Questo è il percorso **predefinito** e più semplice
    perché non richiede VS Code.

    <Steps>
      <Step title="Esegui il comando di accesso">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Ti verrà chiesto di visitare un URL e inserire un codice monouso. Tieni il
        terminale aperto fino al completamento.
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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa l'estensione VS Code **Copilot Proxy** come bridge locale. OpenClaw comunica con
    l'endpoint `/v1` del proxy e usa l'elenco dei modelli che configuri lì.

    <Note>
    Scegli questa opzione quando esegui già Copilot Proxy in VS Code o devi instradare
    il traffico tramite esso. Devi abilitare il plugin e mantenere in esecuzione l'estensione VS Code.
    </Note>

  </Tab>
</Tabs>

## Flag opzionali

| Flag            | Descrizione                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Salta la richiesta di conferma                      |
| `--set-default` | Applica anche il modello predefinito consigliato dal provider |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Onboarding non interattivo

Se hai già un token di accesso OAuth GitHub per Copilot, importalo durante la
configurazione headless con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Puoi anche omettere `--auth-choice`; passando `--github-copilot-token` viene dedotta la
scelta di autenticazione del provider GitHub Copilot. Se il flag viene omesso, l'onboarding torna
a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, quindi `GITHUB_TOKEN`. Usa
`--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` impostato per archiviare un
`tokenRef` basato su variabile d'ambiente invece di testo in chiaro in `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interattivo richiesto">
    Il flusso di accesso tramite dispositivo richiede un TTY interattivo. Eseguilo direttamente in un
    terminale, non in uno script non interattivo o in una pipeline CI.
  </Accordion>

  <Accordion title="La disponibilità dei modelli dipende dal tuo piano">
    La disponibilità dei modelli Copilot dipende dal tuo piano GitHub. Se un modello viene
    rifiutato, prova un altro ID (per esempio `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selezione del trasporto">
    Gli ID dei modelli Claude usano automaticamente il trasporto Anthropic Messages. I modelli GPT,
    o-series e Gemini mantengono il trasporto OpenAI Responses. OpenClaw
    seleziona il trasporto corretto in base al riferimento del modello.
  </Accordion>

  <Accordion title="Compatibilità delle richieste">
    OpenClaw invia intestazioni di richiesta in stile IDE Copilot sui trasporti Copilot,
    inclusi turni successivi con Compaction integrata, risultati degli strumenti e immagini. Non
    abilita la continuazione Responses a livello di provider per Copilot a meno che
    tale comportamento non sia stato verificato rispetto all'API di Copilot.
  </Accordion>

  <Accordion title="Ordine di risoluzione delle variabili d'ambiente">
    OpenClaw risolve l'autenticazione Copilot dalle variabili d'ambiente nel seguente
    ordine di priorità:

    | Priorità | Variabile             | Note                             |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorità massima, specifica per Copilot |
    | 2        | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | Token GitHub standard (minima)   |

    Quando sono impostate più variabili, OpenClaw usa quella con priorità più alta.
    Il flusso di accesso tramite dispositivo (`openclaw models auth login-github-copilot`) archivia
    il suo token nell'archivio dei profili di autenticazione e ha precedenza su tutte le variabili
    d'ambiente.

  </Accordion>

  <Accordion title="Archiviazione dei token">
    L'accesso archivia un token GitHub nell'archivio dei profili di autenticazione e lo scambia
    con un token API Copilot quando OpenClaw viene eseguito. Non è necessario gestire il
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Il comando di accesso tramite dispositivo richiede un TTY interattivo. Usa l'onboarding
non interattivo quando ti serve una configurazione headless.
</Warning>

## Embedding per la ricerca in memoria

GitHub Copilot può anche fungere da provider di embedding per la
[ricerca in memoria](/it/concepts/memory-search). Se hai un abbonamento Copilot e
hai effettuato l'accesso, OpenClaw può usarlo per gli embedding senza una chiave API separata.

### Rilevamento automatico

Quando `memorySearch.provider` è `"auto"` (il valore predefinito), GitHub Copilot viene provato
con priorità 15 -- dopo gli embedding locali ma prima di OpenAI e altri
provider a pagamento. Se è disponibile un token GitHub, OpenClaw scopre i
modelli di embedding disponibili dall'API Copilot e sceglie automaticamente quello migliore.

### Configurazione esplicita

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

1. OpenClaw risolve il tuo token GitHub (da variabili d'ambiente o profilo di autenticazione).
2. Lo scambia con un token API Copilot a breve durata.
3. Interroga l'endpoint Copilot `/models` per scoprire i modelli di embedding disponibili.
4. Sceglie il modello migliore (preferisce `text-embedding-3-small`).
5. Invia richieste di embedding all'endpoint Copilot `/embeddings`.

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
