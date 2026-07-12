---
read_when:
    - Vuoi utilizzare GitHub Copilot come provider di modelli
    - Hai bisogno del flusso `openclaw models auth login-github-copilot`
    - Stai scegliendo tra il provider Copilot integrato, l'harness dell'SDK Copilot e Copilot Proxy
summary: Accedi a GitHub Copilot da OpenClaw utilizzando il flusso del dispositivo o l'importazione non interattiva del token
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T07:24:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot è l'assistente di programmazione basato sull'IA di GitHub. Fornisce accesso ai modelli Copilot
per il tuo account e piano GitHub. OpenClaw può usare Copilot come fornitore di modelli
o runtime dell'agente in tre modi diversi.

## Tre modi per usare Copilot in OpenClaw

<Tabs>
  <Tab title="Fornitore integrato (github-copilot)">
    Usa il flusso nativo di accesso tramite dispositivo per ottenere un token GitHub, quindi scambialo con
    token API Copilot durante l'esecuzione di OpenClaw. Questo è il percorso **predefinito** e più semplice
    perché non richiede VS Code.

    <Steps>
      <Step title="Esegui il comando di accesso">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Ti verrà chiesto di visitare un URL e inserire un codice monouso. Mantieni il
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

  <Tab title="Plugin harness dell'SDK Copilot (copilot)">
    Installa il plugin esterno `@openclaw/copilot` quando vuoi che la
    CLI e l'SDK Copilot di GitHub gestiscano il ciclo dell'agente di basso livello per i modelli
    `github-copilot/*` selezionati.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Quindi abilita esplicitamente il runtime per un modello o un fornitore:

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
    gestito dall'SDK e Compaction gestita da Copilot per quei turni dell'agente. Senza
    l'abilitazione esplicita di `agentRuntime`, i modelli `github-copilot/*` continuano a usare il
    fornitore integrato. Consulta [Harness dell'SDK Copilot](/it/plugins/copilot) per il contratto
    completo del runtime.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa l'estensione VS Code **Copilot Proxy** come ponte locale. OpenClaw comunica con
    l'endpoint `/v1` del proxy (predefinito `http://localhost:3000/v1`) e usa l'elenco
    di modelli configurato.

    Il plugin `copilot-proxy` è incluso in OpenClaw ed è abilitato per impostazione predefinita.
    Configura l'URL di base e gli ID dei modelli con:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Scegli questa opzione se esegui già Copilot Proxy in VS Code o devi instradare
    le richieste attraverso di esso. L'estensione VS Code deve rimanere in esecuzione.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (residenza dei dati)

Se la tua organizzazione usa un tenant GitHub Enterprise con residenza dei dati (un host
`*.ghe.com` come `your-org.ghe.com`), Copilot risiede su endpoint locali del tenant
anziché sul `github.com` pubblico. OpenClaw espone questa opzione come scelta
di autenticazione di prima classe, così non devi modificare manualmente gli URL.

<Steps>
  <Step title="Scegli l'opzione di autenticazione Enterprise">
    Durante l'onboarding o in `openclaw models auth`, scegli
    **GitHub Copilot (Enterprise / data residency)**. Ti verrà richiesto il
    dominio Enterprise (ad esempio `your-org.ghe.com`), quindi l'accesso tramite
    dispositivo verrà eseguito su quel tenant.

    Inserisci solo la radice del tenant (`your-org.ghe.com`). Gli host di servizio derivati, come
    `api.your-org.ghe.com` o `copilot-api.your-org.ghe.com`, non sono accettati;
    OpenClaw deriva automaticamente questi endpoint dalla radice del tenant.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Il dominio viene salvato nella configurazione">
    L'host scelto viene archiviato nei parametri del fornitore, così i successivi aggiornamenti
    del token e completamenti vengono indirizzati automaticamente al tenant:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Il flusso tramite dispositivo, lo scambio del token e i completamenti vengono risolti rispettivamente in
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` e
`https://copilot-api.your-org.ghe.com`. I token con residenza dei dati contengono
un identificatore del tenant e nessuna indicazione del proxy, quindi l'URL di base dei completamenti ripiega sull'host
Copilot del tenant anziché sull'endpoint pubblico.

<Note>
Il cambio di dominio esegue sempre nuovamente l'accesso tramite dispositivo. Se hai già un token
Copilot archiviato e scegli un dominio diverso (`github.com` pubblico ↔ un tenant
`*.ghe.com`, oppure da un tenant a un altro), OpenClaw non riutilizza il token esistente:
impone un nuovo accesso affinché l'ambito del token corrisponda al dominio scritto nella
configurazione. Se esegui nuovamente l'accesso per lo *stesso* dominio, viene comunque proposto di riutilizzare il token
corrente. Il ritorno al `github.com` pubblico cancella il valore `githubDomain`
salvato, ripristinando la configurazione predefinita.
</Note>

<Note>
La variabile di ambiente `COPILOT_GITHUB_DOMAIN` sostituisce il dominio risolto
per ogni percorso Copilot che lo utilizza: l'accesso Enterprise tramite dispositivo
(`--method device-enterprise`), la scorciatoia autonoma
`openclaw models auth login-github-copilot`, l'aggiornamento del token, gli embedding
e i completamenti. Impostala sul tuo host `*.ghe.com` per configurazioni completamente
headless o CI. Lasciala non impostata (e senza il parametro nella configurazione) per usare il
`github.com` pubblico. Gli accessi salvano il dominio per cui hanno generato il token
(e lo cancellano quando l'accesso avviene sul `github.com` pubblico), quindi l'instradamento
rimane corretto anche dopo la rimozione della variabile di ambiente.
</Note>

## Flag facoltativi

| Comando                                                                | Flag            | Descrizione                                                        |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Sovrascrive un profilo di autenticazione esistente senza conferma  |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Applica anche il modello predefinito consigliato dal fornitore     |

```bash
# Ignora la conferma per eseguire nuovamente l'accesso
openclaw models auth login-github-copilot --yes

# Accedi e imposta il modello predefinito in un solo passaggio
openclaw models auth login --provider github-copilot --method device --set-default
```

## Onboarding non interattivo

Il flusso di accesso tramite dispositivo richiede una TTY interattiva. Per una configurazione headless, importa
un token di accesso OAuth GitHub esistente con `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Puoi anche omettere `--auth-choice`: il passaggio di `--github-copilot-token` deduce
l'opzione di autenticazione del fornitore GitHub Copilot. Se il flag viene omesso, l'onboarding
ripiega su `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e infine `GITHUB_TOKEN`. Usa
`--secret-input-mode ref` con `COPILOT_GITHUB_TOKEN` impostato per archiviare un
`tokenRef` basato su una variabile di ambiente anziché testo non cifrato in `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interattiva obbligatoria">
    Il flusso di accesso tramite dispositivo richiede una TTY interattiva. Eseguilo direttamente in un
    terminale, non in uno script non interattivo o in una pipeline CI.
  </Accordion>

  <Accordion title="La disponibilità dei modelli dipende dal tuo piano">
    La disponibilità dei modelli Copilot dipende dal tuo piano GitHub. Se un modello viene
    rifiutato, prova un altro ID (ad esempio `github-copilot/gpt-5.5`). Consulta i
    [modelli supportati per ciascun piano Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    di GitHub per l'elenco aggiornato dei modelli.
  </Accordion>

  <Accordion title="Aggiornamento in tempo reale del catalogo dall'API Copilot">
    Quando il percorso di autenticazione tramite accesso da dispositivo (o variabile di ambiente) ha risolto un token GitHub,
    OpenClaw aggiorna su richiesta il catalogo dei modelli da `${baseUrl}/models`
    (lo stesso endpoint usato da VS Code Copilot), così il runtime tiene conto
    dei diritti per account e delle finestre di contesto corrette senza modifiche
    continue al manifest. I nuovi modelli Copilot pubblicati diventano visibili senza
    aggiornare OpenClaw e le finestre di contesto riflettono i limiti reali di ciascun modello
    (ad esempio 400.000 per la serie gpt-5.x e 1 milione per le varianti interne
    `claude-opus-*-1m`).

    Il catalogo statico incluso rimane il fallback visibile quando il rilevamento
    è disabilitato, l'utente non ha un profilo di autenticazione GitHub, lo scambio del token
    non riesce o la chiamata HTTPS a `/models` restituisce un errore. Per disattivare questa funzionalità e affidarsi interamente
    al catalogo statico del manifest (scenari offline o isolati dalla rete):

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
    Gli ID dei modelli Claude usano automaticamente il trasporto Anthropic Messages.
    I modelli Gemini usano il trasporto OpenAI Chat Completions; i modelli GPT e della serie o
    continuano a usare il trasporto OpenAI Responses. OpenClaw seleziona il trasporto corretto
    in base al riferimento del modello.
  </Accordion>

  <Accordion title="Compatibilità delle richieste">
    OpenClaw invia intestazioni di richiesta in stile IDE Copilot sui trasporti Copilot
    (versioni dell'editor/plugin VS Code e ID di integrazione `vscode-chat`),
    contrassegna come avviati dall'agente i turni successivi ai risultati degli strumenti e imposta l'intestazione
    Copilot per la visione quando un turno contiene immagini in ingresso.
  </Accordion>

  <Accordion title="Ordine di risoluzione delle variabili di ambiente">
    OpenClaw risolve l'autenticazione Copilot dalle variabili di ambiente nel seguente
    ordine di priorità:

    | Priorità | Variabile               | Note                                      |
    | -------- | ----------------------- | ----------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorità massima, specifica per Copilot   |
    | 2        | `GH_TOKEN`             | Token della CLI GitHub (fallback)         |
    | 3        | `GITHUB_TOKEN`         | Token GitHub standard (priorità minima)   |

    Quando sono impostate più variabili, OpenClaw usa quella con la priorità più alta.
    Il flusso di accesso tramite dispositivo (`openclaw models auth login-github-copilot`) archivia
    il proprio token nell'archivio dei profili di autenticazione e ha la precedenza su tutte le variabili
    di ambiente.

  </Accordion>

  <Accordion title="Archiviazione dei token">
    L'accesso archivia un token GitHub nell'archivio dei profili di autenticazione (ID profilo
    `github-copilot:github`) e lo scambia con un token API Copilot di breve durata
    durante l'esecuzione di OpenClaw. Non è necessario gestire manualmente il token.
  </Accordion>
</AccordionGroup>

## Embedding per la ricerca in memoria

GitHub Copilot può anche fungere da fornitore di embedding per la
[ricerca in memoria](/it/concepts/memory-search). Se disponi di un abbonamento Copilot e
hai eseguito l'accesso, OpenClaw può usarlo per gli embedding senza una chiave API separata.

### Configurazione

Imposta esplicitamente `memorySearch.provider` per usare gli embedding di GitHub Copilot. Se è
disponibile un token GitHub, OpenClaw rileva i modelli di embedding disponibili tramite
l'API Copilot e seleziona automaticamente il migliore.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Facoltativo: sostituisci il modello rilevato automaticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Funzionamento

1. OpenClaw risolve il tuo token GitHub (dalle variabili di ambiente o dal profilo di autenticazione).
2. Lo scambia con un token API Copilot di breve durata.
3. Interroga l'endpoint `/models` di Copilot per rilevare i modelli di embedding disponibili.
4. Seleziona il modello migliore (ordine di preferenza: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Invia le richieste di embedding all'endpoint `/embeddings` di Copilot.

La disponibilità dei modelli dipende dal tuo piano GitHub. Se non sono disponibili modelli di
embedding, OpenClaw ignora Copilot e prova il fornitore successivo.

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli sull'autenticazione e regole per il riutilizzo delle credenziali.
  </Card>
</CardGroup>
