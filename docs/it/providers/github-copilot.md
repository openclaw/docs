---
read_when:
    - Vuoi usare GitHub Copilot come provider di modelli
    - Hai bisogno del flusso `openclaw models auth login-github-copilot`
summary: Accedi a GitHub Copilot da OpenClaw usando il flusso del dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T08:28:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot è l'assistente di coding AI di GitHub. Fornisce accesso ai
modelli Copilot per il tuo account e piano GitHub. OpenClaw può usare Copilot come
provider di modelli in due modi diversi.

## Due modi per usare Copilot in OpenClaw

<Tabs>
  <Tab title="Provider integrato (github-copilot)">
    Usa il flusso nativo di login del dispositivo per ottenere un token GitHub, poi scambialo con
    token API Copilot quando OpenClaw è in esecuzione. Questo è il percorso **predefinito** e più semplice
    perché non richiede VS Code.

    <Steps>
      <Step title="Esegui il comando di accesso">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Ti verrà chiesto di visitare un URL e inserire un codice monouso. Tieni
        il terminale aperto finché il processo non è completato.
      </Step>
      <Step title="Imposta un modello predefinito">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        Oppure nella configurazione:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
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
    Scegli questa opzione quando usi già Copilot Proxy in VS Code o hai bisogno di instradare
    attraverso di esso. Devi abilitare il plugin e mantenere in esecuzione l'estensione VS Code.
    </Note>

  </Tab>
</Tabs>

## Flag facoltativi

| Flag            | Descrizione                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Salta la richiesta di conferma                      |
| `--set-default` | Applica anche il modello predefinito consigliato dal provider |

```bash
# Salta la conferma
openclaw models auth login-github-copilot --yes

# Accedi e imposta il modello predefinito in un solo passaggio
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interattivo richiesto">
    Il flusso di login del dispositivo richiede un TTY interattivo. Eseguilo direttamente in un
    terminale, non in uno script non interattivo o in una pipeline CI.
  </Accordion>

  <Accordion title="La disponibilità dei modelli dipende dal tuo piano">
    La disponibilità dei modelli Copilot dipende dal tuo piano GitHub. Se un modello viene
    rifiutato, prova un altro ID (ad esempio `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selezione del trasporto">
    Gli ID dei modelli Claude usano automaticamente il trasporto Anthropic Messages. I modelli GPT,
    serie o e Gemini mantengono il trasporto OpenAI Responses. OpenClaw
    seleziona il trasporto corretto in base al model ref.
  </Accordion>

  <Accordion title="Ordine di risoluzione delle variabili d'ambiente">
    OpenClaw risolve l'autenticazione Copilot dalle variabili d'ambiente nel seguente
    ordine di priorità:

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorità massima, specifica per Copilot |
    | 2        | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | Token GitHub standard (priorità minima)   |

    Quando sono impostate più variabili, OpenClaw usa quella con la priorità più alta.
    Il flusso di login del dispositivo (`openclaw models auth login-github-copilot`) memorizza
    il proprio token nell'archivio dei profili auth e ha la precedenza su tutte le variabili
    d'ambiente.

  </Accordion>

  <Accordion title="Archiviazione del token">
    Il login memorizza un token GitHub nell'archivio dei profili auth e lo scambia
    con un token API Copilot quando OpenClaw è in esecuzione. Non devi gestire il
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Richiede un TTY interattivo. Esegui il comando di accesso direttamente in un terminale, non
all'interno di uno script headless o di un job CI.
</Warning>

## Embedding per la ricerca in memory

GitHub Copilot può anche fungere da provider di embedding per la
[ricerca in memory](/it/concepts/memory-search). Se hai un abbonamento Copilot e
hai effettuato l'accesso, OpenClaw può usarlo per gli embedding senza una chiave API separata.

### Rilevamento automatico

Quando `memorySearch.provider` è `"auto"` (il valore predefinito), GitHub Copilot viene provato
con priorità 15 -- dopo gli embedding locali ma prima di OpenAI e di altri
provider a pagamento. Se è disponibile un token GitHub, OpenClaw rileva i modelli di
embedding disponibili dall'API Copilot e sceglie automaticamente il migliore.

### Configurazione esplicita

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Facoltativo: sovrascrivi il modello rilevato automaticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Come funziona

1. OpenClaw risolve il tuo token GitHub (da variabili d'ambiente o profilo auth).
2. Lo scambia con un token API Copilot a breve durata.
3. Interroga l'endpoint Copilot `/models` per rilevare i modelli di embedding disponibili.
4. Sceglie il modello migliore (preferisce `text-embedding-3-small`).
5. Invia le richieste di embedding all'endpoint Copilot `/embeddings`.

La disponibilità dei modelli dipende dal tuo piano GitHub. Se non sono
disponibili modelli di embedding, OpenClaw salta Copilot e prova il provider successivo.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli sull'autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
