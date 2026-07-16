---
read_when:
    - Modifica del comportamento di fallback del modello o dell’esperienza utente di selezione
    - Debug di "model is not allowed" o di un fallback obsoleto al provider predefinito
    - Lavoro sul comportamento di unione e dei segreti di models.json
sidebarTitle: Models CLI
summary: Come OpenClaw risolve i riferimenti a provider/modelli, le chiavi di configurazione e il comando di chat `/model`
title: CLI dei modelli
x-i18n:
    generated_at: "2026-07-16T14:08:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover del modello" href="/it/concepts/model-failover">
    Rotazione dei profili di autenticazione, periodi di attesa e relativa interazione con i fallback.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers">
    Panoramica rapida dei provider ed esempi.
  </Card>
  <Card title="Riferimento CLI per i modelli" href="/it/cli/models">
    Riferimento completo al comando `openclaw models` e ai relativi flag.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-agents#agent-defaults">
    Chiavi di configurazione dei modelli, valori predefiniti ed esempi.
  </Card>
</CardGroup>

Un riferimento a un modello (`provider/model`) seleziona un provider e un modello, non il runtime
dell'agente di basso livello. Se il criterio del runtime non è impostato o è `auto`, il criterio
di instradamento di proprietà del provider OpenAI può selezionare Codex solo per un esatto percorso
Responses ufficiale della piattaforma HTTPS o ChatGPT Responses, senza override della richiesta definito
dall'autore; il prefisso `openai/*` da solo non seleziona mai Codex. Gli adattatori Completions,
gli endpoint personalizzati e il comportamento della richiesta definito dall'autore restano su OpenClaw.
Gli endpoint HTTP ufficiali in testo non cifrato vengono rifiutati. Consultare [Runtime implicito dell'agente OpenAI](/it/providers/openai#implicit-agent-runtime).

I riferimenti Copilot con abbonamento (`github-copilot/*`) possono essere abilitati per il Plugin esterno
del runtime dell'agente GitHub Copilot, ma questo percorso è sempre esplicito (non viene mai
selezionato da `auto`). Gli override del runtime devono essere applicati al criterio del provider/modello, non
all'intero agente o all'intera sessione. La selezione del runtime non determina la fatturazione:
le credenziali della chiave API OpenAI e quelle dell'abbonamento ChatGPT/Codex restano distinte. Consultare
[Runtime degli agenti](/it/concepts/agent-runtimes) e
[Runtime dell'agente GitHub Copilot](/it/plugins/copilot).

## Ordine di selezione

<Steps>
  <Step title="Modello principale">
    `agents.defaults.model.primary` (o `agents.defaults.model` come stringa semplice).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks`, provati in ordine.
  </Step>
  <Step title="Failover dell'autenticazione">
    La rotazione dei profili di autenticazione avviene all'interno di un provider prima che OpenClaw passi al modello di fallback successivo.
  </Step>
</Steps>

Superfici correlate della configurazione dei modelli:

- `agents.defaults.models` è l'elenco di elementi consentiti/catalogo dei modelli utilizzabili da OpenClaw, insieme agli alias. Utilizzare le voci `provider/*` per consentire tutti i modelli rilevati di un provider senza elencarli singolarmente.
- `agents.defaults.utilityModel` è un modello opzionale a costo inferiore per brevi attività interne, come i titoli generati delle sessioni del pannello di controllo, i titoli di thread/argomenti dei canali supportati e la narrazione dell'avanzamento. Il valore `agents.list[].utilityModel` per agente lo sostituisce. Se non è impostato, OpenClaw utilizza il modello piccolo predefinito dichiarato dal provider principale, se esiste (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); altrimenti utilizza il modello principale dell'agente. Impostarlo su una stringa vuota per disabilitare l'instradamento delle utilità. Le attività di utilità sono chiamate al modello separate e possono inviare contenuti limitati dell'attività al provider del modello selezionato.
- `agents.defaults.imageModel` viene utilizzato solo quando il modello principale non può accettare immagini.
- `agents.defaults.pdfModel` viene utilizzato dallo strumento `pdf`. Se non è impostato, lo strumento usa come fallback `imageModel`, quindi il modello risolto della sessione/predefinito.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` e `videoGenerationModel` supportano gli strumenti condivisi di generazione multimediale. Se non sono impostati, ogni strumento deduce un valore predefinito del provider supportato dall'autenticazione: prima il provider predefinito corrente, quindi i restanti provider registrati per quella funzionalità, ordinati per ID provider. Impostare `agents.defaults.mediaGenerationAutoProviderFallback: false` per disabilitare questa deduzione tra provider mantenendo i fallback espliciti.
- Il valore `agents.list[].model` per agente (insieme alle associazioni) sostituisce `agents.defaults.model` — consultare [Instradamento multi-agente](/it/concepts/multi-agent).

Riferimento completo delle chiavi, valori predefiniti ed esempi JSON5: [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults).

## Origine della selezione e rigidità del fallback

Lo stesso `provider/model` si comporta in modo diverso a seconda della sua origine:

| Origine                                                                  | Comportamento                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valore predefinito configurato (`agents.defaults.model.primary`, principale per agente) | Punto di partenza normale; utilizza `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Fallback automatico                                                           | Stato di ripristino temporaneo, archiviato come `modelOverrideSource: "auto"`. OpenClaw verifica nuovamente e periodicamente il modello principale originale, annulla la selezione automatica al ripristino e annuncia le transizioni di fallback/ripristino una volta per ogni modifica dello stato.                              |
| Selezione della sessione utente                                                  | Esatta e rigida. `/model`, il selettore del modello, `session_status(model=...)` e `sessions.patch` archiviano `modelOverrideSource: "user"`. Se quel provider/modello diventa irraggiungibile, l'esecuzione non riesce in modo visibile anziché passare a un altro modello configurato. |
| Cron `--model` / payload `model`                                        | Modello principale per processo. Utilizza comunque i fallback configurati, a meno che il processo non fornisca il proprio payload `fallbacks` (`fallbacks: []` impone un'esecuzione rigida).                                                                                                                    |

Altre regole di selezione:

- La modifica di `agents.defaults.model.primary` non riscrive i vincoli delle sessioni esistenti. Se lo stato segnala `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, eseguire `/model default` per rimuovere il vincolo.
- I selettori CLI del modello predefinito e dell'elenco di elementi consentiti rispettano `models.mode: "replace"`, elencando solo `models.providers.*.models` anziché l'intero catalogo integrato.
- Il selettore del modello nell'interfaccia di controllo richiede al Gateway la vista dei modelli configurata: `agents.defaults.models` quando è impostato (incluse le voci con carattere jolly `provider/*`); altrimenti `models.providers.*.models` più i provider con un'autenticazione utilizzabile. L'intero catalogo integrato è riservato alle viste di esplorazione esplicite (`models.list` con `view: "all"` oppure `openclaw models list --all`).
- Le interfacce dell'inventario dei provider utilizzano `models.list` con `view: "provider-config"` per mostrare le righe `models.providers.*.models` definite dall'origine senza applicare gli elenchi di elementi consentiti dei selettori.

Meccanismi completi: [Failover del modello](/it/concepts/model-failover).

## Criterio rapido per i modelli

- Impostare come modello principale il modello di ultima generazione più potente disponibile.
- Utilizzare i fallback per le attività sensibili a costi/latenza e per le chat meno critiche.
- Per gli agenti abilitati all'uso di strumenti o gli input non attendibili, evitare le fasce di modelli meno recenti o meno potenti.

## Configurazione iniziale

```bash
openclaw onboard
```

Configura il modello e l'autenticazione per i provider comuni senza modificare manualmente la configurazione, inclusi OAuth dell'abbonamento OpenAI Codex e Anthropic (chiave API o riutilizzo della CLI Claude).

Se non è configurato alcun modello principale, una nuova configurazione con chiave API OpenAI seleziona
`openai/gpt-5.6`; l'ID semplice dell'API diretta viene risolto nella fascia Sol. Una nuova
configurazione OAuth ChatGPT/Codex seleziona l'esatto riferimento di catalogo `openai/gpt-5.6-sol`.
La riautenticazione conserva un modello principale esplicito esistente, incluso
`openai/gpt-5.5`. Se GPT-5.6 non è disponibile per l'account, selezionare
esplicitamente `openai/gpt-5.5`; OpenClaw non effettua automaticamente il downgrade.

## "Model is not allowed" (e perché le risposte si interrompono)

Se `agents.defaults.models` è impostato, diventa l'elenco di elementi consentiti per `/model` e per gli override della sessione. La selezione di un modello esterno a tale elenco restituisce quanto segue prima che venga generata qualsiasi risposta normale:

```text
Il modello "provider/model" non è consentito. Utilizzare /models per elencare i provider oppure /models <provider> per elencare i modelli.
Aggiungerlo con: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Per risolvere il problema, aggiungere il modello a `agents.defaults.models`, rimuovere completamente l'elenco di elementi consentiti (eliminando la chiave) oppure scegliere un modello da `/model list`. Se il comando rifiutato includeva un override del runtime come `/model openai/gpt-5.5 --runtime codex`, correggere prima l'elenco di elementi consentiti, quindi riprovare lo stesso comando `/model ... --runtime ...`.

Per i modelli locali/GGUF, l'elenco di elementi consentiti richiede il riferimento completo con prefisso del provider, ad esempio `ollama/gemma4:26b` o `lmstudio/Gemma4-26b-a4-it-gguf` — controllare `openclaw models list --provider <provider>` per la stringa esatta. I soli nomi dei file o nomi visualizzati non sono sufficienti quando l'elenco di elementi consentiti è attivo.

Per limitare i provider senza elencare ogni modello, utilizzare le voci con carattere jolly `provider/*`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

`/model`, `/models` e i selettori dei modelli mostrano quindi solo il catalogo rilevato per tali provider e possono comparire nuovi modelli senza modificare l'elenco di elementi consentiti. Combinare voci esatte `provider/model` con voci `provider/*` per includere un modello specifico di un altro provider.

Esempio di elenco di elementi consentiti con alias:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Modifiche sicure dell'elenco di elementi consentiti dalla CLI">
Utilizzare `--merge` per le modifiche additive:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` rifiuta le assegnazioni di oggetti semplici a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` quando eliminerebbero voci esistenti; utilizzare `--replace` solo quando il nuovo valore deve diventare il valore di destinazione completo. La configurazione interattiva dei provider e `openclaw configure --section model` uniscono già le selezioni specifiche del provider nell'elenco di elementi consentiti, quindi l'aggiunta di un provider non elimina le voci non correlate; la configurazione conserva un `agents.defaults.model.primary` esistente. I comandi espliciti come `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>` continuano a sostituire il modello principale.
</Accordion>

## `/model` nella chat

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` e `/model list` mostrano un selettore numerato compatto (famiglia di modelli + provider disponibili); `/model <#>` consente di effettuare la selezione. Su Discord si aprono menu a discesa per provider/modello con un passaggio Submit; su Telegram, le selezioni del selettore sono limitate alla sessione e non riscrivono mai il valore predefinito persistente dell'agente in `openclaw.json`. `/models add` è deprecato e restituisce un messaggio invece di registrare modelli dalla chat.
- `/model` rende persistente immediatamente la nuova selezione della sessione. Se l'agente è inattivo, l'esecuzione successiva la utilizza subito; se un'esecuzione è già attiva, il cambio viene accodato per il successivo punto di nuovo tentativo pulito (o per uno successivo, se l'attività degli strumenti o l'output della risposta sono già iniziati).
- `/model default` cancella la selezione della sessione affinché erediti nuovamente il modello principale configurato.
- Un riferimento `/model` selezionato dall'utente è vincolante per quella sessione: se diventa irraggiungibile, la risposta non riesce in modo visibile invece di ricorrere silenziosamente a `agents.defaults.model.fallbacks`. I valori predefiniti configurati e i modelli principali dei processi cron continuano a utilizzare le catene di fallback.
- `/model status` è la vista dettagliata: candidati di autenticazione per ciascun provider e, quando configurati, l'endpoint del provider `baseUrl` e la modalità `api`.
- I riferimenti ai modelli vengono analizzati dividendoli in corrispondenza del primo `/`; digitare `provider/model`. Se l'ID del modello contiene a sua volta `/` (in stile OpenRouter), includere il prefisso del provider, ad esempio `/model openrouter/moonshotai/kimi-k2`. Se si omette il provider, OpenClaw prova: (1) una corrispondenza con un alias, (2) una corrispondenza univoca con un provider configurato per quell'esatto ID modello senza prefisso, (3) il provider predefinito configurato (fallback deprecato) — e, se tale provider non espone più il modello predefinito configurato, usa invece il primo provider/modello configurato, per evitare di mostrare un valore predefinito obsoleto relativo a un provider rimosso.
- I riferimenti ai modelli vengono normalizzati in minuscolo; gli ID dei provider sono altrimenti esatti, quindi utilizzare l'ID dichiarato dal plugin.

Comportamento completo dei comandi e configurazione: [Comandi slash](/it/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` senza sottocomando è una scorciatoia per `models status`, che mostra anche la scadenza OAuth per i profili dell'archivio di autenticazione (per impostazione predefinita avvisa entro 24h). Flag completi, strutture JSON e sottocomandi dei profili di autenticazione: [Riferimento della CLI per i modelli](/it/cli/models).

<AccordionGroup>
  <Accordion title="Scansione (modelli gratuiti di OpenRouter)">
    `openclaw models scan` esamina il catalogo pubblico dei modelli gratuiti di OpenRouter e può verificare in tempo reale il supporto di strumenti e immagini dei candidati. Il catalogo stesso è pubblico, quindi le scansioni dei soli metadati (`--no-probe`) non richiedono alcuna chiave; le verifiche in tempo reale e `--set-default`/`--set-image` richiedono una chiave API OpenRouter (profilo di autenticazione o `OPENROUTER_API_KEY`) e, in sua assenza, passano in modo sicuro a un output contenente soltanto i metadati.

    I risultati vengono classificati in base a: supporto delle immagini, quindi latenza degli strumenti, dimensione del contesto e infine numero di parametri. In un TTY, i risultati verificati richiedono una selezione interattiva del fallback; la modalità non interattiva richiede `--yes` per accettare i valori predefiniti.

  </Accordion>
</AccordionGroup>

## Registro dei modelli (`models.json`)

I provider personalizzati configurati in `models.providers` vengono scritti in `models.json` nella directory dell'agente (predefinita: `~/.openclaw/agents/<agentId>/agent/models.json`). I cataloghi dei plugin dei provider vengono archiviati separatamente come segmenti di catalogo generati e di proprietà dei plugin e caricati automaticamente. Per impostazione predefinita, questo file viene unito alla configurazione; impostare `models.mode: "replace"` per utilizzare soltanto i provider configurati.

<AccordionGroup>
  <Accordion title="Precedenza della modalità di unione">
    Per gli ID provider corrispondenti:

    - Ha la precedenza un `baseUrl` non vuoto già presente nel `models.json` dell'agente.
    - Un `apiKey` non vuoto in `models.json` ha la precedenza soltanto quando tale provider non è gestito tramite SecretRef nel contesto corrente della configurazione o del profilo di autenticazione.
    - I valori `apiKey` gestiti tramite SecretRef vengono aggiornati in base ai marcatori dell'origine invece di rendere persistenti i segreti risolti: il nome della variabile di ambiente per i riferimenti all'ambiente, `secretref-managed` per i riferimenti a file/esecuzione.
    - I valori delle intestazioni gestiti tramite SecretRef vengono aggiornati nello stesso modo, utilizzando `secretref-env:ENV_VAR_NAME` per i riferimenti all'ambiente.
    - I valori `apiKey`/`baseUrl` vuoti o mancanti in `models.json` ricorrono al valore `models.providers` della configurazione.
    - Gli altri campi del provider vengono aggiornati dalla configurazione e dai dati normalizzati del catalogo.

  </Accordion>
</AccordionGroup>

La persistenza dei marcatori considera l'origine come fonte autorevole: ogni volta che rigenera `models.json`, OpenClaw scrive i marcatori dall'istantanea attiva della configurazione di origine (prima della risoluzione), non dai valori dei segreti risolti in fase di esecuzione, anche nei percorsi attivati da comandi come `openclaw agent`.

## Risorse correlate

- [Runtime degli agenti](/it/concepts/agent-runtimes) — OpenClaw, Codex e altri runtime del ciclo degli agenti
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione dei modelli
- [Generazione di immagini](/it/tools/image-generation) — configurazione del modello per le immagini
- [Failover dei modelli](/it/concepts/model-failover) — catene di fallback
- [Provider di modelli](/it/concepts/model-providers) — instradamento dei provider e autenticazione
- [Riferimento della CLI per i modelli](/it/cli/models) — riferimento completo per comandi e flag
- [Generazione di musica](/it/tools/music-generation) — configurazione del modello per la musica
- [Generazione di video](/it/tools/video-generation) — configurazione del modello per i video
