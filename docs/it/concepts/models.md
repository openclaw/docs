---
read_when:
    - Aggiunta o modifica della CLI dei modelli (models list/set/scan/aliases/fallbacks)
    - Modifica del comportamento di fallback del modello o dell'esperienza utente di selezione
    - Aggiornamento delle sonde di scansione dei modelli (strumenti/immagini)
sidebarTitle: Models CLI
summary: 'CLI dei modelli: elenco, impostazione, alias, fallback, scansione, stato'
title: CLI dei modelli
x-i18n:
    generated_at: "2026-05-02T08:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover dei modelli" href="/it/concepts/model-failover">
    Rotazione dei profili di autenticazione, cooldown e interazione con i fallback.
  </Card>
  <Card title="Provider dei modelli" href="/it/concepts/model-providers">
    Panoramica rapida dei provider ed esempi.
  </Card>
  <Card title="Runtime degli agenti" href="/it/concepts/agent-runtimes">
    PI, Codex e altri runtime del loop degli agenti.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults">
    Chiavi di configurazione dei modelli.
  </Card>
</CardGroup>

I riferimenti ai modelli scelgono un provider e un modello. Di solito non scelgono il runtime dell'agente di basso livello. Per esempio, `openai/gpt-5.5` può essere eseguito tramite il normale percorso del provider OpenAI o tramite il runtime app-server Codex, a seconda di `agents.defaults.agentRuntime.id`. Nella modalità runtime Codex, il riferimento `openai/gpt-*` non implica l'addebito su chiave API; l'autenticazione può provenire da un account Codex o da un profilo di autenticazione `openai-codex`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes).

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
  <Accordion title="Superfici dei modelli correlate">
    - `agents.defaults.models` è l'allowlist/catalogo dei modelli che OpenClaw può usare (più gli alias).
    - `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
    - `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento ripiega su `agents.defaults.imageModel`, quindi sul modello risolto per la sessione/predefinito.
    - `agents.defaults.imageGenerationModel` viene usato dalla capacità condivisa di generazione immagini. Se omesso, `image_generate` può comunque inferire un valore predefinito del provider supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider registrati per la generazione immagini in ordine di ID provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/chiave API di quel provider.
    - `agents.defaults.musicGenerationModel` viene usato dalla capacità condivisa di generazione musicale. Se omesso, `music_generate` può comunque inferire un valore predefinito del provider supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider registrati per la generazione musicale in ordine di ID provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/chiave API di quel provider.
    - `agents.defaults.videoGenerationModel` viene usato dalla capacità condivisa di generazione video. Se omesso, `video_generate` può comunque inferire un valore predefinito del provider supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider registrati per la generazione video in ordine di ID provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/chiave API di quel provider.
    - I valori predefiniti per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più i binding (vedi [Routing multi-agente](/it/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origine della selezione e comportamento di fallback

Lo stesso `provider/model` può significare cose diverse a seconda della sua origine:

- I valori predefiniti configurati (`agents.defaults.model.primary` e i primari specifici dell'agente) sono il normale punto di partenza e usano `agents.defaults.model.fallbacks`.
- Le selezioni di fallback automatico sono uno stato di recupero temporaneo. Vengono salvate con `modelOverrideSource: "auto"` così i turni successivi possono continuare a usare la catena di fallback senza provare prima un primario noto come non funzionante.
- Le selezioni di sessione dell'utente sono esatte. `/model`, il selettore del modello, `session_status(model=...)` e `sessions.patch` salvano `modelOverrideSource: "user"`; se quel provider/modello selezionato non è raggiungibile, OpenClaw fallisce in modo visibile invece di passare a un altro modello configurato.
- Cron `--model` / payload `model` è un primario per singolo job. Usa comunque i fallback configurati, a meno che il job non fornisca `fallbacks` espliciti nel payload (usa `fallbacks: []` per un'esecuzione Cron rigida).
- I selettori del modello predefinito e dell'allowlist della CLI rispettano `models.mode: "replace"` elencando i `models.providers.*.models` espliciti invece di caricare l'intero catalogo integrato.
- Il selettore dei modelli della UI di controllo chiede al Gateway la sua vista dei modelli configurata: `agents.defaults.models` quando presente, altrimenti `models.providers.*.models` espliciti più i provider con autenticazione utilizzabile. L'intero catalogo integrato è riservato alle viste di esplorazione esplicite come `models.list` con `view: "all"` o `openclaw models list --all`.

## Policy rapida dei modelli

- Imposta come primario il modello di ultima generazione più potente a tua disposizione.
- Usa i fallback per attività sensibili a costi/latenza e chat a rischio più basso.
- Per agenti con strumenti abilitati o input non attendibili, evita livelli di modelli più vecchi/deboli.

## Onboarding (consigliato)

Se non vuoi modificare la configurazione a mano, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + autenticazione per provider comuni, inclusi **OpenAI Code (Codex) subscription** (OAuth) e **Anthropic** (chiave API o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri provider)
- `models.providers` (provider personalizzati scritti in `models.json`)

<Note>
I riferimenti ai modelli vengono normalizzati in minuscolo. Gli alias dei provider come `z.ai/*` vengono normalizzati in `zai/*`.

Gli esempi di configurazione dei provider (incluso OpenCode) si trovano in [OpenCode](/it/providers/opencode).
</Note>

### Modifiche sicure all'allowlist

Usa scritture additive quando aggiorni `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regole di protezione dalla sovrascrittura">
    `openclaw config set` protegge le mappe modello/provider da sovrascritture accidentali. Un'assegnazione di oggetto semplice a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` viene rifiutata quando rimuoverebbe voci esistenti. Usa `--merge` per modifiche additive; usa `--replace` solo quando il valore fornito deve diventare il valore target completo.

    Anche la configurazione interattiva dei provider e `openclaw configure --section model` uniscono le selezioni con ambito provider nell'allowlist esistente, quindi l'aggiunta di Codex, Ollama o di un altro provider non elimina voci di modelli non correlate. Configure conserva un `agents.defaults.model.primary` esistente quando l'autenticazione del provider viene riapplicata. I comandi espliciti per impostare il valore predefinito, come `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>`, continuano a sostituire `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Il modello non è consentito" (e perché le risposte si interrompono)

Se `agents.defaults.models` è impostato, diventa l'**allowlist** per `/model` e per le sovrascritture di sessione. Quando un utente seleziona un modello che non è in quell'allowlist, OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Questo accade **prima** che venga generata una risposta normale, quindi il messaggio può dare l'impressione che "non abbia risposto". La correzione consiste nel fare una di queste cose:

- Aggiungere il modello a `agents.defaults.models`, oppure
- Svuotare l'allowlist (rimuovere `agents.defaults.models`), oppure
- Scegliere un modello da `/model list`.

</Warning>

Per i modelli locali/GGUF, salva nell'allowlist il riferimento completo con prefisso del provider,
per esempio `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, oppure il
provider/modello esatto mostrato da `openclaw models list --provider <provider>`.
I nomi di file locali senza prefisso o i nomi visualizzati non sono sufficienti quando l'allowlist è
attiva.

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

## Cambio dei modelli in chat (`/model`)

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
    - `/model` (e `/model list`) è un selettore compatto e numerato (famiglia del modello + provider disponibili).
    - Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
    - Su Telegram, le selezioni del selettore `/models` hanno ambito di sessione; non modificano il valore predefinito persistente dell'agente in `openclaw.json`.
    - `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat.
    - `/model <#>` seleziona da quel selettore.

  </Accordion>
  <Accordion title="Persistenza e cambio live">
    - `/model` persiste immediatamente la nuova selezione di sessione.
    - Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
    - Se l'attività degli strumenti o l'output della risposta sono già iniziati, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al prossimo turno dell'utente.
    - Un riferimento `/model` selezionato dall'utente è rigido per quella sessione: se il provider/modello selezionato non è raggiungibile, la risposta fallisce in modo visibile invece di rispondere silenziosamente da `agents.defaults.model.fallbacks`. Questo è diverso dai valori predefiniti configurati e dai primari dei job Cron, che possono comunque usare catene di fallback.
    - `/model status` è la vista dettagliata (candidati di autenticazione e, quando configurato, endpoint provider `baseUrl` + modalità `api`).

  </Accordion>
  <Accordion title="Parsing dei riferimenti">
    - I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Usa `provider/model` quando digiti `/model <ref>`.
    - Se l'ID del modello stesso contiene `/` (stile OpenRouter), devi includere il prefisso del provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
    - Se ometti il provider, OpenClaw risolve l'input in questo ordine:
      1. corrispondenza alias
      2. corrispondenza unica del provider configurato per quell'ID modello esatto senza prefisso
      3. fallback deprecato al provider predefinito configurato — se quel provider non espone più il modello predefinito configurato, OpenClaw ripiega invece sul primo provider/modello configurato per evitare di mostrare un valore predefinito obsoleto di un provider rimosso.
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

`openclaw models` (senza sottocomando) è una scorciatoia per `models status`.

### `models list`

Mostra per impostazione predefinita i modelli configurati/disponibili con autenticazione. Flag utili:

<ParamField path="--all" type="boolean">
  Catalogo completo. Include le righe del catalogo statico incluse e di proprietà dei fornitori prima che l'autenticazione sia configurata, così le viste di sola discovery possono mostrare modelli non disponibili finché non aggiungi le credenziali del fornitore corrispondenti.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo fornitori locali.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra per ID fornitore, per esempio `moonshot`. Le etichette visualizzate dai selettori interattivi non sono accettate.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modello per riga.
</ParamField>
<ParamField path="--json" type="boolean">
  Output leggibile da macchina.
</ParamField>

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagine e una panoramica dell'autenticazione dei fornitori configurati. Evidenzia anche lo stato di scadenza OAuth per i profili trovati nell'archivio di autenticazione (avvisa entro 24 ore per impostazione predefinita). `--plain` stampa solo il modello primario risolto.

<AccordionGroup>
  <Accordion title="Comportamento di autenticazione e probe">
    - Lo stato OAuth viene sempre mostrato (e incluso nell'output `--json`). Se un fornitore configurato non ha credenziali, `models status` stampa una sezione **Autenticazione mancante**.
    - JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers` (autenticazione effettiva per fornitore, incluse le credenziali basate su env). `auth.oauth` riguarda solo lo stato dei profili nell'archivio di autenticazione; i fornitori solo env non compaiono lì.
    - Usa `--check` per l'automazione (exit `1` se mancante/scaduto, `2` se in scadenza).
    - Usa `--probe` per controlli di autenticazione live; le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
    - Se `auth.order.<provider>` esplicito omette un profilo archiviato, il probe segnala `excluded_by_auth_order` invece di provarlo. Se l'autenticazione esiste ma non è possibile risolvere alcun modello verificabile per quel fornitore, il probe segnala `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La scelta dell'autenticazione dipende dal fornitore/account. Per host Gateway sempre attivi, le chiavi API sono di solito le più prevedibili; sono supportati anche il riuso della Claude CLI e i profili OAuth/token Anthropic esistenti.
</Note>

Esempio (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scansione (modelli gratuiti OpenRouter)

`openclaw models scan` ispeziona il **catalogo dei modelli gratuiti** di OpenRouter e può facoltativamente eseguire probe sui modelli per il supporto di strumenti e immagini.

<ParamField path="--no-probe" type="boolean">
  Salta i probe live (solo metadati).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Dimensione minima dei parametri (miliardi).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Salta i modelli più vecchi.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro per prefisso del fornitore.
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
Il catalogo OpenRouter `/models` è pubblico, quindi le scansioni solo metadati possono elencare candidati gratuiti senza una chiave. I probe e l'inferenza richiedono comunque una chiave API OpenRouter (da profili di autenticazione o `OPENROUTER_API_KEY`). Se non è disponibile alcuna chiave, `openclaw models scan` ripiega sull'output solo metadati e lascia invariata la configurazione. Usa `--no-probe` per richiedere esplicitamente la modalità solo metadati.
</Note>

I risultati della scansione sono ordinati per:

1. Supporto immagini
2. Latenza degli strumenti
3. Dimensione del contesto
4. Numero di parametri

Input:

- Elenco OpenRouter `/models` (filtro `:free`)
- I probe live richiedono una chiave API OpenRouter da profili di autenticazione o `OPENROUTER_API_KEY` (vedi [Variabili di ambiente](/it/help/environment))
- Filtri facoltativi: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controlli richiesta/probe: `--timeout`, `--concurrency`

Quando i probe live vengono eseguiti in una TTY, puoi selezionare i fallback in modo interattivo. In modalità non interattiva, passa `--yes` per accettare i valori predefiniti. I risultati solo metadati sono informativi; `--set-default` e `--set-image` richiedono probe live così OpenClaw non configura un modello OpenRouter senza chiave e inutilizzabile.

## Registro dei modelli (`models.json`)

I fornitori personalizzati in `models.providers` vengono scritti in `models.json` nella directory dell'agente (impostazione predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file viene unito per impostazione predefinita, a meno che `models.mode` sia impostato su `replace`.

<AccordionGroup>
  <Accordion title="Precedenza della modalità di merge">
    Precedenza della modalità di merge per ID fornitore corrispondenti:

    - Un `baseUrl` non vuoto già presente nel `models.json` dell'agente prevale.
    - Un `apiKey` non vuoto nel `models.json` dell'agente prevale solo quando quel fornitore non è gestito da SecretRef nel contesto di configurazione/profilo di autenticazione corrente.
    - I valori `apiKey` dei fornitori gestiti da SecretRef vengono aggiornati dai marker di origine (`ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec) invece di mantenere i segreti risolti.
    - I valori degli header dei fornitori gestiti da SecretRef vengono aggiornati dai marker di origine (`secretref-env:ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec).
    - `apiKey`/`baseUrl` dell'agente vuoti o mancanti ripiegano su `models.providers` della configurazione.
    - Gli altri campi del fornitore vengono aggiornati dalla configurazione e dai dati normalizzati del catalogo.

  </Accordion>
</AccordionGroup>

<Note>
La persistenza dei marker è autoritativa rispetto all'origine: OpenClaw scrive i marker dallo snapshot della configurazione di origine attiva (prima della risoluzione), non dai valori dei segreti risolti a runtime. Questo si applica ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comandi come `openclaw agent`.
</Note>

## Correlati

- [Runtime degli agenti](/it/concepts/agent-runtimes) — PI, Codex e altri runtime di loop degli agenti
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione dei modelli
- [Generazione di immagini](/it/tools/image-generation) — configurazione del modello immagine
- [Failover dei modelli](/it/concepts/model-failover) — catene di fallback
- [Fornitori di modelli](/it/concepts/model-providers) — routing e autenticazione dei fornitori
- [Generazione di musica](/it/tools/music-generation) — configurazione del modello musicale
- [Generazione di video](/it/tools/video-generation) — configurazione del modello video
