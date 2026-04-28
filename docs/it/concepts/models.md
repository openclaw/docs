---
read_when:
    - Aggiungere o modificare la CLI dei modelli (`models list/set/scan/aliases/fallbacks`)
    - Modificare il comportamento di fallback del modello o l'esperienza utente di selezione
    - Aggiornare le probe di scansione del modello (tool/immagini)
sidebarTitle: Models CLI
summary: 'CLI dei modelli: elenco, impostazione, alias, fallback, scansione, stato'
title: CLI dei modelli
x-i18n:
    generated_at: "2026-04-26T11:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Failover del modello" href="/it/concepts/model-failover">
    Rotazione del profilo auth, cooldown e interazione con i fallback.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers">
    Panoramica rapida dei provider ed esempi.
  </Card>
  <Card title="Runtime degli agenti" href="/it/concepts/agent-runtimes">
    PI, Codex e altri runtime del loop dell'agente.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-agents#agent-defaults">
    Chiavi di configurazione del modello.
  </Card>
</CardGroup>

I ref del modello scelgono un provider e un modello. Di solito non scelgono il runtime agente di basso livello. Ad esempio, `openai/gpt-5.5` può essere eseguito tramite il normale percorso del provider OpenAI oppure tramite il runtime app-server Codex, a seconda di `agents.defaults.agentRuntime.id`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes).

## Come funziona la selezione del modello

OpenClaw seleziona i modelli in questo ordine:

<Steps>
  <Step title="Modello primario">
    `agents.defaults.model.primary` (oppure `agents.defaults.model`).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (in ordine).
  </Step>
  <Step title="Failover auth del provider">
    Il failover auth avviene all'interno di un provider prima di passare al modello successivo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superfici correlate del modello">
    - `agents.defaults.models` è l'allowlist/catalogo dei modelli che OpenClaw può usare (più gli alias).
    - `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
    - `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento usa come fallback `agents.defaults.imageModel`, poi il modello di sessione/predefinito risolto.
    - `agents.defaults.imageGenerationModel` viene usato dalla capability condivisa di generazione immagini. Se omesso, `image_generate` può comunque dedurre un valore predefinito del provider supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di provider-id. Se imposti un provider/modello specifico, configura anche auth/API key di quel provider.
    - `agents.defaults.musicGenerationModel` viene usato dalla capability condivisa di generazione musicale. Se omesso, `music_generate` può comunque dedurre un valore predefinito del provider supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di provider-id. Se imposti un provider/modello specifico, configura anche auth/API key di quel provider.
    - `agents.defaults.videoGenerationModel` viene usato dalla capability condivisa di generazione video. Se omesso, `video_generate` può comunque dedurre un valore predefinito del provider supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di provider-id. Se imposti un provider/modello specifico, configura anche auth/API key di quel provider.
    - I valori predefiniti per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più i binding (vedi [Instradamento multi-agente](/it/concepts/multi-agent)).
  </Accordion>
</AccordionGroup>

## Policy rapida per i modelli

- Imposta come primario il modello di ultima generazione più potente a tua disposizione.
- Usa i fallback per attività sensibili a costo/latenza e per chat a minore criticità.
- Per agenti con tool abilitati o input non attendibili, evita livelli di modello più vecchi/deboli.

## Onboarding (consigliato)

Se non vuoi modificare la configurazione a mano, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + auth per i provider più comuni, inclusi **OpenAI Code (Codex) subscription** (OAuth) e **Anthropic** (API key o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri del provider)
- `models.providers` (provider personalizzati scritti in `models.json`)

<Note>
I ref del modello vengono normalizzati in minuscolo. Gli alias provider come `z.ai/*` vengono normalizzati in `zai/*`.

Gli esempi di configurazione del provider (incluso OpenCode) si trovano in [OpenCode](/it/providers/opencode).
</Note>

### Modifiche sicure all'allowlist

Usa scritture additive quando aggiorni `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regole di protezione da sovrascrittura">
    `openclaw config set` protegge le mappe modello/provider da sovrascritture accidentali. Un'assegnazione di oggetto semplice a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` viene rifiutata quando rimuoverebbe voci esistenti. Usa `--merge` per modifiche additive; usa `--replace` solo quando il valore fornito deve diventare il valore completo di destinazione.

    La configurazione interattiva del provider e `openclaw configure --section model` uniscono anche le selezioni con ambito provider nell'allowlist esistente, quindi l'aggiunta di Codex, Ollama o un altro provider non elimina voci di modello non correlate. Configure preserva un `agents.defaults.model.primary` esistente quando l'auth del provider viene riapplicata. Comandi espliciti di impostazione del predefinito come `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>` continuano comunque a sostituire `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Il modello non è consentito" (e perché le risposte si interrompono)

Se `agents.defaults.models` è impostato, diventa l'**allowlist** per `/model` e per gli override di sessione. Quando un utente seleziona un modello che non è in quell'allowlist, OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Questo avviene **prima** che venga generata una normale risposta, quindi il messaggio può dare l'impressione che "non abbia risposto". La soluzione è:

- Aggiungere il modello a `agents.defaults.models`, oppure
- Cancellare l'allowlist (rimuovere `agents.defaults.models`), oppure
- Scegliere un modello da `/model list`.
</Warning>

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

## Cambiare modello in chat (`/model`)

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
    - `/model` (e `/model list`) è un selettore compatto numerato (famiglia di modelli + provider disponibili).
    - Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
    - `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat.
    - `/model <#>` seleziona da quel selettore.
  </Accordion>
  <Accordion title="Persistenza e cambio live">
    - `/model` persiste immediatamente la nuova selezione di sessione.
    - Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
    - Se l'attività dei tool o l'output della risposta sono già iniziati, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
    - `/model status` è la vista dettagliata (candidati auth e, quando configurati, `baseUrl` dell'endpoint provider + modalità `api`).
  </Accordion>
  <Accordion title="Parsing dei ref">
    - I ref del modello vengono analizzati dividendo sul **primo** `/`. Usa `provider/model` quando digiti `/model <ref>`.
    - Se l'ID del modello stesso contiene `/` (stile OpenRouter), devi includere il prefisso del provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
    - Se ometti il provider, OpenClaw risolve l'input in questo ordine:
      1. corrispondenza alias
      2. corrispondenza univoca del provider configurato per quell'esatto model id senza prefisso
      3. fallback deprecato al provider predefinito configurato — se quel provider non espone più il modello predefinito configurato, OpenClaw usa invece come fallback il primo provider/modello configurato per evitare di mostrare un vecchio predefinito di provider rimosso.
  </Accordion>
</AccordionGroup>

Comportamento/configurazione completi del comando: [Comandi slash](/it/tools/slash-commands).

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

Mostra per impostazione predefinita i modelli configurati. Flag utili:

<ParamField path="--all" type="boolean">
  Catalogo completo. Include le righe statiche del catalogo di proprietà dei provider inclusi prima che l'auth sia configurata, così le viste di sola discovery possono mostrare modelli non disponibili finché non aggiungi credenziali provider corrispondenti.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo provider locali.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra per provider id, ad esempio `moonshot`. Le etichette mostrate nei selettori interattivi non sono accettate.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modello per riga.
</ParamField>
<ParamField path="--json" type="boolean">
  Output leggibile da macchina.
</ParamField>

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagine e una panoramica auth dei provider configurati. Mostra anche lo stato di scadenza OAuth per i profili trovati nell'archivio auth (avverte entro 24h per impostazione predefinita). `--plain` stampa solo il modello primario risolto.

<AccordionGroup>
  <Accordion title="Comportamento di auth e probe">
    - Lo stato OAuth viene sempre mostrato (ed è incluso nell'output `--json`). Se un provider configurato non ha credenziali, `models status` stampa una sezione **Missing auth**.
    - Il JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers` (auth effettiva per provider, incluse credenziali supportate da env). `auth.oauth` riguarda solo lo stato di salute dei profili dell'archivio auth; i provider solo-env non compaiono lì.
    - Usa `--check` per l'automazione (exit `1` quando mancante/scaduto, `2` quando in scadenza).
    - Usa `--probe` per controlli auth live; le righe probe possono provenire da profili auth, credenziali env o `models.json`.
    - Se `auth.order.<provider>` esplicito omette un profilo memorizzato, la probe riporta `excluded_by_auth_order` invece di provarlo. Se l'auth esiste ma non è possibile risolvere alcun modello probeable per quel provider, la probe riporta `status: no_model`.
  </Accordion>
</AccordionGroup>

<Note>
La scelta auth dipende da provider/account. Per host gateway always-on, le API key sono solitamente l'opzione più prevedibile; sono supportati anche il riuso di Claude CLI e profili OAuth/token Anthropic esistenti.
</Note>

Esempio (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scansione (modelli gratuiti OpenRouter)

`openclaw models scan` ispeziona il **catalogo dei modelli gratuiti** di OpenRouter e può facoltativamente eseguire probe dei modelli per il supporto a tool e immagini.

<ParamField path="--no-probe" type="boolean">
  Salta le probe live (solo metadati).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Dimensione minima dei parametri (miliardi).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Salta i modelli più vecchi.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro per prefisso provider.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Dimensione dell'elenco dei fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Imposta `agents.defaults.model.primary` sulla prima selezione.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Imposta `agents.defaults.imageModel.primary` sulla prima selezione immagine.
</ParamField>

<Note>
Il catalogo OpenRouter `/models` è pubblico, quindi le scansioni solo metadati possono elencare candidati gratuiti senza una chiave. Le probe e l'inferenza richiedono comunque una API key OpenRouter (da profili auth o `OPENROUTER_API_KEY`). Se non è disponibile alcuna chiave, `openclaw models scan` usa come fallback l'output solo metadati e lascia invariata la configurazione. Usa `--no-probe` per richiedere esplicitamente la modalità solo metadati.
</Note>

I risultati della scansione sono ordinati in base a:

1. Supporto immagini
2. Latenza dei tool
3. Dimensione del contesto
4. Numero di parametri

Input:

- Elenco OpenRouter `/models` (filtro `:free`)
- Le probe live richiedono una API key OpenRouter da profili auth o `OPENROUTER_API_KEY` (vedi [Variabili d'ambiente](/it/help/environment))
- Filtri facoltativi: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controlli di richiesta/probe: `--timeout`, `--concurrency`

Quando le probe live vengono eseguite in un TTY, puoi selezionare interattivamente i fallback. In modalità non interattiva, passa `--yes` per accettare i valori predefiniti. I risultati solo metadati sono informativi; `--set-default` e `--set-image` richiedono probe live così OpenClaw non configura un modello OpenRouter senza chiave e inutilizzabile.

## Registry dei modelli (`models.json`)

I provider personalizzati in `models.providers` vengono scritti in `models.json` sotto la directory dell'agente (predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file viene unito per impostazione predefinita, a meno che `models.mode` non sia impostato su `replace`.

<AccordionGroup>
  <Accordion title="Precedenza della modalità merge">
    Precedenza della modalità merge per ID provider corrispondenti:

    - Un `baseUrl` non vuoto già presente nel `models.json` dell'agente ha la precedenza.
    - Un `apiKey` non vuoto nel `models.json` dell'agente ha la precedenza solo quando quel provider non è gestito da SecretRef nel contesto attuale di configurazione/profilo auth.
    - I valori `apiKey` dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec) invece di persistere i segreti risolti.
    - I valori header dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`secretref-env:ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec).
    - `apiKey`/`baseUrl` dell'agente vuoti o mancanti usano come fallback `models.providers` della configurazione.
    - Gli altri campi del provider vengono aggiornati dalla configurazione e dai dati di catalogo normalizzati.

  </Accordion>
</AccordionGroup>

<Note>
La persistenza dei marcatori è autorevole rispetto alla sorgente: OpenClaw scrive i marcatori dallo snapshot della configurazione sorgente attiva (prima della risoluzione), non dai valori segreti runtime risolti. Questo si applica ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comandi come `openclaw agent`.
</Note>

## Correlati

- [Runtime degli agenti](/it/concepts/agent-runtimes) — PI, Codex e altri runtime del loop dell'agente
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione del modello
- [Generazione immagini](/it/tools/image-generation) — configurazione del modello immagine
- [Failover del modello](/it/concepts/model-failover) — catene di fallback
- [Provider di modelli](/it/concepts/model-providers) — instradamento del provider e auth
- [Generazione musicale](/it/tools/music-generation) — configurazione del modello musicale
- [Generazione video](/it/tools/video-generation) — configurazione del modello video
