---
read_when:
    - Aggiunta o modifica di modelli CLI (models list/set/scan/aliases/fallbacks)
    - Modifica del comportamento di fallback del modello o della UX di selezione
    - Aggiornamento delle sonde di scansione dei modelli (strumenti/immagini)
sidebarTitle: Models CLI
summary: 'CLI dei modelli: elenco, impostazione, alias, fallback, scansione, stato'
title: CLI dei modelli
x-i18n:
    generated_at: "2026-05-10T19:31:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover del modello" href="/it/concepts/model-failover">
    Rotazione dei profili di autenticazione, tempi di cooldown e interazione con i fallback.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers">
    Panoramica rapida dei provider ed esempi.
  </Card>
  <Card title="Runtime degli agenti" href="/it/concepts/agent-runtimes">
    PI, Codex e altri runtime del ciclo degli agenti.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults">
    Chiavi di configurazione del modello.
  </Card>
</CardGroup>

I riferimenti dei modelli scelgono un provider e un modello. Di solito non scelgono il runtime dell'agente di basso livello. I riferimenti degli agenti OpenAI sono l'eccezione principale: `openai/gpt-5.5` viene eseguito tramite il runtime app-server di Codex per impostazione predefinita sul provider OpenAI ufficiale. Le sostituzioni esplicite del runtime appartengono alla policy di provider/modello, non all'intero agente o alla sessione. In modalità runtime Codex, il riferimento `openai/gpt-*` non implica la fatturazione tramite chiave API; l'autenticazione può provenire da un account Codex o da un profilo di autenticazione `openai-codex`. Consulta [Runtime degli agenti](/it/concepts/agent-runtimes).

## Come funziona la selezione del modello

OpenClaw seleziona i modelli in questo ordine:

<Steps>
  <Step title="Modello primario">
    `agents.defaults.model.primary` (o `agents.defaults.model`).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (in ordine).
  </Step>
  <Step title="Failover dell'autenticazione del provider">
    Il failover dell'autenticazione avviene all'interno di un provider prima di passare al modello successivo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superfici modello correlate">
    - `agents.defaults.models` è l'allowlist/catalogo dei modelli che OpenClaw può usare (più gli alias). Usa le voci `provider/*` per limitare i provider visibili mantenendo dinamica la scoperta dei provider.
    - `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
    - `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento ricorre a `agents.defaults.imageModel`, quindi al modello risolto della sessione/predefinito.
    - `agents.defaults.imageGenerationModel` viene usato dalla funzionalità condivisa di generazione di immagini. Se omesso, `image_generate` può comunque inferire un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider registrati per la generazione di immagini in ordine di ID provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/chiave API di quel provider.
    - `agents.defaults.musicGenerationModel` viene usato dalla funzionalità condivisa di generazione musicale. Se omesso, `music_generate` può comunque inferire un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider registrati per la generazione musicale in ordine di ID provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/chiave API di quel provider.
    - `agents.defaults.videoGenerationModel` viene usato dalla funzionalità condivisa di generazione video. Se omesso, `video_generate` può comunque inferire un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider registrati per la generazione video in ordine di ID provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/chiave API di quel provider.
    - Le impostazioni predefinite per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più i binding (vedi [Routing multi-agente](/it/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origine della selezione e comportamento di fallback

Lo stesso `provider/model` può significare cose diverse a seconda della sua provenienza:

- Le impostazioni predefinite configurate (`agents.defaults.model.primary` e i primari specifici per agente) sono il normale punto di partenza e usano `agents.defaults.model.fallbacks`.
- Le selezioni di fallback automatico sono uno stato di recupero temporaneo. Sono archiviate con `modelOverrideSource: "auto"` in modo che i turni successivi possano continuare a usare la catena di fallback senza sondare prima un primario noto come non funzionante.
- Le selezioni di sessione dell'utente sono esatte. `/model`, il selettore del modello, `session_status(model=...)` e `sessions.patch` archiviano `modelOverrideSource: "user"`; se quel provider/modello selezionato non è raggiungibile, OpenClaw fallisce in modo visibile invece di passare a un altro modello configurato.
- Cron `--model` / payload `model` è un primario per job. Usa comunque i fallback configurati a meno che il job non fornisca esplicitamente `fallbacks` nel payload (usa `fallbacks: []` per un'esecuzione cron rigorosa).
- Il modello predefinito della CLI e i selettori di allowlist rispettano `models.mode: "replace"` elencando `models.providers.*.models` espliciti invece di caricare l'intero catalogo integrato.
- Il selettore del modello dell'interfaccia di controllo chiede al Gateway la vista dei modelli configurata: `agents.defaults.models` quando presente, incluse le voci `provider/*` a livello di provider, altrimenti `models.providers.*.models` espliciti più i provider con autenticazione utilizzabile. Il catalogo integrato completo è riservato alle viste di esplorazione esplicite come `models.list` con `view: "all"` o `openclaw models list --all`.

## Policy rapida dei modelli

- Imposta come primario il modello di ultima generazione più potente a tua disposizione.
- Usa i fallback per attività sensibili a costi/latenza e chat a rischio più basso.
- Per agenti con strumenti abilitati o input non attendibili, evita livelli di modelli più vecchi/deboli.

## Onboarding (consigliato)

Se non vuoi modificare manualmente la configurazione, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + autenticazione per i provider comuni, inclusi **abbonamento OpenAI Code (Codex)** (OAuth) e **Anthropic** (chiave API o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri provider + voci provider dinamiche `provider/*`)
- `models.providers` (provider personalizzati scritti in `models.json`)

<Note>
I riferimenti dei modelli vengono normalizzati in minuscolo. Gli alias dei provider come `z.ai/*` vengono normalizzati in `zai/*`.

Gli esempi di configurazione dei provider (incluso OpenCode) si trovano in [OpenCode](/it/providers/opencode).
</Note>

### Modifiche sicure all'allowlist

Usa scritture additive quando aggiorni manualmente `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regole di protezione dalla sovrascrittura">
    `openclaw config set` protegge le mappe modello/provider da sovrascritture accidentali. Un'assegnazione di oggetto semplice a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` viene rifiutata quando rimuoverebbe voci esistenti. Usa `--merge` per modifiche additive; usa `--replace` solo quando il valore fornito deve diventare il valore di destinazione completo.

    Anche la configurazione interattiva del provider e `openclaw configure --section model` uniscono le selezioni con ambito provider nell'allowlist esistente, quindi l'aggiunta di Codex, Ollama o un altro provider non elimina voci di modelli non correlate. Configure conserva un `agents.defaults.model.primary` esistente quando l'autenticazione del provider viene riapplicata. I comandi espliciti di impostazione predefinita come `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>` sostituiscono comunque `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Il modello non è consentito" (e perché le risposte si fermano)

Se `agents.defaults.models` è impostato, diventa l'**allowlist** per `/model` e per le sostituzioni di sessione. Quando un utente seleziona un modello che non è in quella allowlist, OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Questo accade **prima** che venga generata una risposta normale, quindi il messaggio può dare l'impressione che "non abbia risposto". La correzione consiste nel:

- Aggiungere il modello a `agents.defaults.models`, oppure
- Cancellare l'allowlist (rimuovere `agents.defaults.models`), oppure
- Scegliere un modello da `/model list`.

</Warning>

Quando il comando rifiutato includeva una sostituzione del runtime come `/model openai/gpt-5.5 --runtime codex`, correggi prima l'allowlist, poi riprova lo stesso comando `/model ... --runtime ...`. Per l'esecuzione nativa di Codex, il modello selezionato resta `openai/gpt-5.5`; il runtime `codex` seleziona l'harness e usa separatamente l'autenticazione Codex.

Per i modelli locali/GGUF, archivia nell'allowlist il riferimento completo con prefisso provider,
ad esempio `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` o il
provider/modello esatto mostrato da `openclaw models list --provider <provider>`.
I nomi di file locali semplici o i nomi visualizzati non bastano quando l'allowlist è
attiva.

Se vuoi limitare i provider senza elencare manualmente ogni modello, aggiungi
voci `provider/*` a `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Con quella policy, `/model`, `/models` e i selettori di modelli mostrano il catalogo
scoperto solo per quei provider. I nuovi modelli dei provider selezionati possono
apparire senza modificare l'allowlist. Le voci esatte `provider/model` possono essere combinate
con voci `provider/*` quando hai bisogno di un modello specifico da un altro provider.

Esempio di configurazione dell'allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Cambio di modello in chat (`/model`)

Puoi cambiare modello per la sessione corrente senza riavviare:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Comportamento del selettore">
    - `/model` (e `/model list`) è un selettore compatto e numerato (famiglia di modelli + provider disponibili).
    - Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
    - Su Telegram, le selezioni del selettore `/models` hanno ambito di sessione; non modificano il valore predefinito persistente dell'agente in `openclaw.json`.
    - `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat.
    - `/model <#>` seleziona da quel selettore.

  </Accordion>
  <Accordion title="Persistenza e cambio live">
    - `/model` persiste immediatamente la nuova selezione di sessione.
    - Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
    - Se l'attività degli strumenti o l'output della risposta è già iniziato, il cambio in sospeso può rimanere in coda fino a una successiva opportunità di retry o al prossimo turno dell'utente.
    - Un riferimento `/model` selezionato dall'utente è rigoroso per quella sessione: se il provider/modello selezionato non è raggiungibile, la risposta fallisce in modo visibile invece di rispondere silenziosamente da `agents.defaults.model.fallbacks`. Questo è diverso dalle impostazioni predefinite configurate e dai primari dei job cron, che possono comunque usare catene di fallback.
    - `/model status` è la vista dettagliata (candidati di autenticazione e, quando configurati, `baseUrl` dell'endpoint del provider + modalità `api`).

  </Accordion>
  <Accordion title="Analisi dei riferimenti">
    - I riferimenti dei modelli vengono analizzati dividendo alla **prima** `/`. Usa `provider/model` quando digiti `/model <ref>`.
    - Se l'ID del modello stesso contiene `/` (stile OpenRouter), devi includere il prefisso del provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
    - Se ometti il provider, OpenClaw risolve l'input in questo ordine:
      1. corrispondenza con alias
      2. corrispondenza univoca del provider configurato per quell'esatto ID modello senza prefisso
      3. fallback deprecato al provider predefinito configurato — se quel provider non espone piu il modello predefinito configurato, OpenClaw usa invece come fallback il primo provider/modello configurato per evitare di mostrare un valore predefinito obsoleto di un provider rimosso.
  </Accordion>
</AccordionGroup>

Comportamento/configurazione completa dei comandi: [Comandi slash](/it/tools/slash-commands).

## Comandi CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (senza sottocomando) e una scorciatoia per `models status`.

### `models list`

Mostra per impostazione predefinita i modelli configurati/con autenticazione disponibile. Flag utili:

<ParamField path="--all" type="boolean">
  Catalogo completo. Include le righe del catalogo statico dei provider in bundle di proprieta del provider prima che l'autenticazione sia configurata, quindi le viste di sola scoperta possono mostrare modelli non disponibili finche non aggiungi credenziali del provider corrispondenti.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo provider locali.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra per ID provider, per esempio `moonshot`. Le etichette visualizzate dai selettori interattivi non sono accettate.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modello per riga.
</ParamField>
<ParamField path="--json" type="boolean">
  Output leggibile dalla macchina.
</ParamField>

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagine e una panoramica dell'autenticazione dei provider configurati. Mostra anche lo stato di scadenza OAuth per i profili trovati nell'archivio di autenticazione (avvisa entro 24 ore per impostazione predefinita). `--plain` stampa solo il modello primario risolto.

<AccordionGroup>
  <Accordion title="Comportamento di autenticazione e probe">
    - Lo stato OAuth viene sempre mostrato (e incluso nell'output `--json`). Se un provider configurato non ha credenziali, `models status` stampa una sezione **Autenticazione mancante**.
    - JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers` (autenticazione effettiva per provider, incluse le credenziali basate su env). `auth.oauth` riguarda solo lo stato dei profili dell'archivio di autenticazione; i provider solo env non compaiono li.
    - Usa `--check` per l'automazione (uscita `1` se mancante/scaduto, `2` se in scadenza).
    - Usa `--probe` per controlli di autenticazione live; le righe probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
    - Se `auth.order.<provider>` esplicito omette un profilo archiviato, probe riporta `excluded_by_auth_order` invece di provarlo. Se l'autenticazione esiste ma non e possibile risolvere alcun modello verificabile per quel provider, probe riporta `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La scelta dell'autenticazione dipende dal provider/account. Per host Gateway sempre attivi, le chiavi API sono di solito le piu prevedibili; sono supportati anche il riuso di Claude CLI e i profili OAuth/token Anthropic esistenti.
</Note>

Esempio (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scansione (modelli gratuiti OpenRouter)

`openclaw models scan` ispeziona il **catalogo dei modelli gratuiti** di OpenRouter e puo facoltativamente verificare i modelli per supporto a strumenti e immagini.

<ParamField path="--no-probe" type="boolean">
  Salta i probe live (solo metadati).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Dimensione minima dei parametri (miliardi).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Salta i modelli piu vecchi.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro prefisso provider.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Dimensione dell'elenco di fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Imposta `agents.defaults.model.primary` sulla prima selezione.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Imposta `agents.defaults.imageModel.primary` sulla prima selezione immagine.
</ParamField>

<Note>
Il catalogo OpenRouter `/models` e pubblico, quindi le scansioni solo metadati possono elencare candidati gratuiti senza una chiave. Probe e inferenza richiedono comunque una chiave API OpenRouter (da profili di autenticazione o `OPENROUTER_API_KEY`). Se non e disponibile alcuna chiave, `openclaw models scan` usa come fallback l'output solo metadati e lascia invariata la configurazione. Usa `--no-probe` per richiedere esplicitamente la modalita solo metadati.
</Note>

I risultati della scansione sono classificati per:

1. Supporto immagini
2. Latenza degli strumenti
3. Dimensione del contesto
4. Numero di parametri

Input:

- Elenco OpenRouter `/models` (filtro `:free`)
- I probe live richiedono una chiave API OpenRouter da profili di autenticazione o `OPENROUTER_API_KEY` (vedi [Variabili d'ambiente](/it/help/environment))
- Filtri opzionali: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controlli richiesta/probe: `--timeout`, `--concurrency`

Quando i probe live vengono eseguiti in una TTY, puoi selezionare i fallback in modo interattivo. In modalita non interattiva, passa `--yes` per accettare i valori predefiniti. I risultati solo metadati sono informativi; `--set-default` e `--set-image` richiedono probe live, cosi OpenClaw non configura un modello OpenRouter inutilizzabile senza chiave.

## Registro dei modelli (`models.json`)

I provider personalizzati in `models.providers` vengono scritti in `models.json` nella directory dell'agent (predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file viene unito per impostazione predefinita, a meno che `models.mode` non sia impostato su `replace`.

<AccordionGroup>
  <Accordion title="Precedenza della modalita merge">
    Precedenza della modalita merge per ID provider corrispondenti:

    - `baseUrl` non vuoto gia presente in `models.json` dell'agent ha la precedenza.
    - `apiKey` non vuoto in `models.json` dell'agent ha la precedenza solo quando quel provider non e gestito da SecretRef nel contesto corrente di configurazione/profilo di autenticazione.
    - I valori `apiKey` dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec) invece di persistere segreti risolti.
    - I valori header dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`secretref-env:ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec).
    - `apiKey`/`baseUrl` vuoti o mancanti dell'agent usano come fallback `models.providers` della configurazione.
    - Gli altri campi provider vengono aggiornati dalla configurazione e dai dati normalizzati del catalogo.

  </Accordion>
</AccordionGroup>

<Note>
La persistenza dei marcatori e autorevole rispetto alla sorgente: OpenClaw scrive marcatori dallo snapshot della configurazione sorgente attiva (prima della risoluzione), non dai valori segreti runtime risolti. Questo vale ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comandi come `openclaw agent`.
</Note>

## Correlati

- [Runtime degli agent](/it/concepts/agent-runtimes) — PI, Codex e altri runtime di loop degli agent
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione dei modelli
- [Generazione di immagini](/it/tools/image-generation) — configurazione dei modelli immagine
- [Failover dei modelli](/it/concepts/model-failover) — catene di fallback
- [Provider di modelli](/it/concepts/model-providers) — routing e autenticazione dei provider
- [Generazione musicale](/it/tools/music-generation) — configurazione dei modelli musicali
- [Generazione video](/it/tools/video-generation) — configurazione dei modelli video
