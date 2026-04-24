---
read_when:
    - Aggiunta o modifica della CLI Models (`models list/set/scan/aliases/fallbacks`)
    - Modifica del comportamento di fallback del modello o dell'esperienza utente di selezione
    - Aggiornamento delle probe di scansione del modello (strumenti/immagini)
summary: 'CLI Models: elencare, impostare, alias, fallback, scansione, stato'
title: CLI Models
x-i18n:
    generated_at: "2026-04-24T08:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Vedi [/concepts/model-failover](/it/concepts/model-failover) per la
rotazione dei profili di autenticazione, i cooldown e come questi interagiscono con i fallback.
Panoramica rapida dei provider + esempi: [/concepts/model-providers](/it/concepts/model-providers).

## Come funziona la selezione del modello

OpenClaw seleziona i modelli in questo ordine:

1. Modello **primario** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Fallback** in `agents.defaults.model.fallbacks` (in ordine).
3. Il **failover di autenticazione del provider** avviene all'interno di un provider prima di passare al
   modello successivo.

Correlati:

- `agents.defaults.models` è la allowlist/il catalogo dei modelli che OpenClaw può usare (più gli alias).
- `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
- `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento
  usa come fallback `agents.defaults.imageModel`, poi il modello risolto della sessione/predefinito.
- `agents.defaults.imageGenerationModel` viene usato dalla superficie di capacità condivisa per la generazione di immagini. Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di provider-id. Se imposti un provider/modello specifico, configura anche l'auth/la chiave API di quel provider.
- `agents.defaults.musicGenerationModel` viene usato dalla superficie di capacità condivisa per la generazione musicale. Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di provider-id. Se imposti un provider/modello specifico, configura anche l'auth/la chiave API di quel provider.
- `agents.defaults.videoGenerationModel` viene usato dalla superficie di capacità condivisa per la generazione video. Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di provider-id. Se imposti un provider/modello specifico, configura anche l'auth/la chiave API di quel provider.
- I valori predefiniti per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più i binding (vedi [/concepts/multi-agent](/it/concepts/multi-agent)).

## Policy rapida per i modelli

- Imposta il tuo primario sul modello di ultima generazione più potente disponibile per te.
- Usa i fallback per attività sensibili a costo/latenza e chat meno critiche.
- Per agenti con strumenti abilitati o input non attendibili, evita livelli di modello più vecchi/deboli.

## Onboarding (consigliato)

Se non vuoi modificare la configurazione a mano, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + auth per provider comuni, inclusi **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chiave API o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri provider)
- `models.providers` (provider personalizzati scritti in `models.json`)

I riferimenti ai modelli vengono normalizzati in minuscolo. Alias dei provider come `z.ai/*` vengono normalizzati
in `zai/*`.

Esempi di configurazione del provider (incluso OpenCode) si trovano in
[/providers/opencode](/it/providers/opencode).

### Modifiche sicure alla allowlist

Usa scritture additive quando aggiorni `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protegge le mappe modello/provider da sovrascritture accidentali. Una
semplice assegnazione di oggetto a `agents.defaults.models`, `models.providers` o
`models.providers.<id>.models` viene rifiutata quando rimuoverebbe voci esistenti. Usa `--merge` per modifiche additive; usa `--replace` solo quando il
valore fornito deve diventare l'intero valore di destinazione.

La configurazione interattiva del provider e `openclaw configure --section model` uniscono anch'esse
le selezioni con ambito provider nella allowlist esistente, così l'aggiunta di Codex,
Ollama o di un altro provider non elimina voci di modello non correlate.

## "Model is not allowed" (e perché le risposte si fermano)

Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e per
gli override di sessione. Quando un utente seleziona un modello che non è in quella allowlist,
OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Questo avviene **prima** che venga generata una normale risposta, quindi il messaggio può dare l'impressione
che “non abbia risposto”. La soluzione è:

- aggiungere il modello a `agents.defaults.models`, oppure
- svuotare la allowlist (rimuovere `agents.defaults.models`), oppure
- scegliere un modello da `/model list`.

Esempio di configurazione della allowlist:

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

Puoi cambiare i modelli per la sessione corrente senza riavviare:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Note:

- `/model` (e `/model list`) è un selettore compatto numerato (famiglia del modello + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
- `/models add` è disponibile per impostazione predefinita e può essere disabilitato con `commands.modelsWrite=false`.
- Quando abilitato, `/models add <provider> <modelId>` è il percorso più rapido; `/models add` senza argomenti avvia, dove supportato, un flusso guidato che parte dal provider.
- Dopo `/models add`, il nuovo modello diventa disponibile in `/models` e `/model` senza riavviare il Gateway.
- `/model <#>` seleziona da quel selettore.
- `/model` rende persistente immediatamente la nuova selezione della sessione.
- Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
- Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
- Se l'attività degli strumenti o l'output della risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
- `/model status` è la vista dettagliata (candidati auth e, se configurati, `baseUrl` dell'endpoint del provider + modalità `api`).
- I riferimenti ai modelli vengono analizzati dividendoli sul **primo** `/`. Usa `provider/model` quando digiti `/model <ref>`.
- Se l'ID del modello contiene a sua volta `/` (stile OpenRouter), devi includere il prefisso del provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input in questo ordine:
  1. corrispondenza alias
  2. corrispondenza univoca del provider configurato per quell'esatto model id senza prefisso
  3. fallback deprecato al provider predefinito configurato
     Se quel provider non espone più il modello predefinito configurato, OpenClaw
     usa invece come fallback il primo provider/modello configurato per evitare
     di mostrare un predefinito obsoleto di un provider rimosso.

Comportamento/configurazione completi del comando: [Comandi slash](/it/tools/slash-commands).

Esempi:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

- `--all`: catalogo completo
- `--local`: solo provider locali
- `--provider <id>`: filtra per provider id, per esempio `moonshot`; le etichette visualizzate nei selettori interattivi non sono accettate
- `--plain`: un modello per riga
- `--json`: output leggibile dalle macchine

`--all` include le righe statiche del catalogo dei provider inclusi prima che l'auth sia
configurata, così le viste di sola scoperta possono mostrare modelli non disponibili finché
non aggiungi credenziali provider corrispondenti.

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagine e una panoramica auth
dei provider configurati. Mostra anche lo stato di scadenza OAuth per i profili trovati
nell'archivio auth (avverte entro 24 ore per impostazione predefinita). `--plain` stampa solo il
modello primario risolto.
Lo stato OAuth viene sempre mostrato (e incluso nell'output `--json`). Se un provider configurato
non ha credenziali, `models status` stampa una sezione **Missing auth**.
Il JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers`
(auth effettiva per provider, incluse credenziali supportate da env). `auth.oauth`
riguarda solo lo stato dei profili nell'archivio auth; i provider solo-env non compaiono lì.
Usa `--check` per l'automazione (codice di uscita `1` quando mancano/scadute, `2` quando in scadenza).
Usa `--probe` per controlli auth live; le righe probe possono provenire da profili auth, credenziali env
o `models.json`.
Se `auth.order.<provider>` esplicito omette un profilo archiviato, probe segnala
`excluded_by_auth_order` invece di provarlo. Se l'auth esiste ma non può essere risolto alcun modello sondabile per quel provider, probe segnala `status: no_model`.

La scelta auth dipende da provider/account. Per host Gateway always-on, le chiavi
API sono di solito le più prevedibili; sono supportati anche il riuso di Claude CLI e i profili OAuth/token Anthropic esistenti.

Esempio (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scansione (modelli gratuiti OpenRouter)

`openclaw models scan` ispeziona il **catalogo dei modelli gratuiti** di OpenRouter e può
facoltativamente sondare i modelli per il supporto a strumenti e immagini.

Flag principali:

- `--no-probe`: salta le probe live (solo metadati)
- `--min-params <b>`: dimensione minima dei parametri (miliardi)
- `--max-age-days <days>`: salta i modelli più vecchi
- `--provider <name>`: filtro prefisso provider
- `--max-candidates <n>`: dimensione dell'elenco di fallback
- `--set-default`: imposta `agents.defaults.model.primary` sulla prima selezione
- `--set-image`: imposta `agents.defaults.imageModel.primary` sulla prima selezione immagine

Le probe richiedono una chiave API OpenRouter (da profili auth o
`OPENROUTER_API_KEY`). Senza una chiave, usa `--no-probe` per elencare solo i candidati.

I risultati della scansione sono classificati per:

1. Supporto immagini
2. Latenza degli strumenti
3. Dimensione del contesto
4. Numero di parametri

Input

- elenco OpenRouter `/models` (filtro `:free`)
- richiede la chiave API OpenRouter da profili auth o `OPENROUTER_API_KEY` (vedi [/environment](/it/help/environment))
- filtri facoltativi: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- controlli delle probe: `--timeout`, `--concurrency`

Quando eseguito in una TTY, puoi selezionare i fallback in modo interattivo. In modalità non interattiva,
passa `--yes` per accettare i valori predefiniti.

## Registro dei modelli (`models.json`)

I provider personalizzati in `models.providers` vengono scritti in `models.json` sotto la
directory dell'agente (predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file
viene unito per impostazione predefinita a meno che `models.mode` non sia impostato su `replace`.

Precedenza della modalità merge per provider ID corrispondenti:

- Un `baseUrl` non vuoto già presente nel `models.json` dell'agente ha la precedenza.
- Un `apiKey` non vuoto nel `models.json` dell'agente ha la precedenza solo quando quel provider non è gestito tramite SecretRef nel contesto corrente di config/profilo auth.
- I valori `apiKey` del provider gestiti tramite SecretRef vengono aggiornati dai marcatori di origine (`ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec) invece di rendere persistenti i segreti risolti.
- I valori degli header del provider gestiti tramite SecretRef vengono aggiornati dai marcatori di origine (`secretref-env:ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec).
- `apiKey`/`baseUrl` dell'agente vuoti o mancanti usano come fallback la configurazione `models.providers`.
- Gli altri campi del provider vengono aggiornati dalla configurazione e dai dati di catalogo normalizzati.

La persistenza dei marcatori è autorevole rispetto alla fonte: OpenClaw scrive i marcatori dallo snapshot della configurazione della fonte attiva (prima della risoluzione), non dai valori segreti risolti a runtime.
Questo si applica ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comandi come `openclaw agent`.

## Correlati

- [Provider di modelli](/it/concepts/model-providers) — instradamento del provider e auth
- [Failover del modello](/it/concepts/model-failover) — catene di fallback
- [Generazione di immagini](/it/tools/image-generation) — configurazione del modello immagine
- [Generazione musicale](/it/tools/music-generation) — configurazione del modello musicale
- [Generazione video](/it/tools/video-generation) — configurazione del modello video
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione del modello
