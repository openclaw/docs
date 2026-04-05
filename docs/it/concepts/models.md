---
read_when:
    - Aggiunta o modifica della CLI dei modelli (models list/set/scan/aliases/fallbacks)
    - Modifica del comportamento di fallback dei modelli o dell'esperienza di selezione
    - Aggiornamento delle probe di scansione dei modelli (tools/images)
summary: 'CLI dei modelli: elenco, impostazione, alias, fallback, scansione, stato'
title: CLI dei modelli
x-i18n:
    generated_at: "2026-04-05T13:50:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# CLI dei modelli

Vedi [/concepts/model-failover](/concepts/model-failover) per la rotazione dei
profili di autenticazione, i cooldown e come questi interagiscono con i fallback.
Panoramica rapida dei provider + esempi: [/concepts/model-providers](/concepts/model-providers).

## Come funziona la selezione del modello

OpenClaw seleziona i modelli in questo ordine:

1. Modello **primario** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Fallback** in `agents.defaults.model.fallbacks` (in ordine).
3. Il **failover dell'autenticazione del provider** avviene all'interno di un provider prima di passare al
   modello successivo.

Correlati:

- `agents.defaults.models` è l'allowlist/catalogo dei modelli che OpenClaw può usare (più gli alias).
- `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
- `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento
  ripiega su `agents.defaults.imageModel`, poi sul modello risolto della sessione/predefinito.
- `agents.defaults.imageGenerationModel` viene usato dalla capacità condivisa di generazione immagini. Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di id provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/la chiave API di quel provider.
- `agents.defaults.videoGenerationModel` viene usato dalla capacità condivisa di generazione video. A differenza della generazione immagini, oggi questo non deduce un provider predefinito. Imposta un `provider/model` esplicito come `qwen/wan2.6-t2v` e configura anche l'autenticazione/la chiave API di quel provider.
- I valori predefiniti per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più i binding (vedi [/concepts/multi-agent](/concepts/multi-agent)).

## Policy rapida sui modelli

- Imposta come primario il modello latest-generation più potente a tua disposizione.
- Usa i fallback per attività sensibili a costo/latenza e per chat meno critiche.
- Per agenti con tools abilitati o input non attendibili, evita livelli di modello più vecchi/più deboli.

## Onboarding (consigliato)

Se non vuoi modificare manualmente la configurazione, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + autenticazione per i provider comuni, inclusi **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chiave API o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri provider)
- `models.providers` (provider personalizzati scritti in `models.json`)

I riferimenti ai modelli vengono normalizzati in minuscolo. Gli alias provider come `z.ai/*` vengono normalizzati
in `zai/*`.

Gli esempi di configurazione dei provider (incluso OpenCode) si trovano in
[/providers/opencode](/providers/opencode).

## "Model is not allowed" (e perché le risposte si interrompono)

Se `agents.defaults.models` è impostato, diventa l'**allowlist** per `/model` e per
le sostituzioni della sessione. Quando un utente seleziona un modello che non è in quella allowlist,
OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Questo accade **prima** che venga generata una risposta normale, quindi il messaggio può dare la sensazione
che “non abbia risposto”. La soluzione è una delle seguenti:

- Aggiungere il modello a `agents.defaults.models`, oppure
- Cancellare l'allowlist (rimuovere `agents.defaults.models`), oppure
- Scegliere un modello da `/model list`.

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

## Passare da un modello all'altro nella chat (`/model`)

Puoi cambiare modello per la sessione corrente senza riavviare:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Note:

- `/model` (e `/model list`) è un selettore compatto numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
- `/model <#>` seleziona dal selettore.
- `/model` rende persistente immediatamente la nuova selezione di sessione.
- Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
- Se è già attiva un'esecuzione, OpenClaw contrassegna un cambio live come in attesa e riavvia nel nuovo modello solo in un punto di retry pulito.
- Se l'attività dei tools o l'output della risposta sono già iniziati, il cambio in attesa può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
- `/model status` è la vista dettagliata (candidati di autenticazione e, quando configurati, `baseUrl` dell'endpoint provider + modalità `api`).
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Usa `provider/model` quando digiti `/model <ref>`.
- Se l'ID del modello stesso contiene `/` (stile OpenRouter), devi includere il prefisso del provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input in questo ordine:
  1. corrispondenza alias
  2. corrispondenza univoca di provider configurato per quell'esatto id modello senza prefisso
  3. fallback deprecato al provider predefinito configurato
     Se quel provider non espone più il modello predefinito configurato, OpenClaw
     ripiega invece sul primo provider/modello configurato per evitare
     di mostrare un valore predefinito obsoleto da un provider rimosso.

Comportamento/configurazione completa del comando: [Slash commands](/tools/slash-commands).

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
- `--provider <name>`: filtra per provider
- `--plain`: un modello per riga
- `--json`: output leggibile dalle macchine

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagine e una panoramica dell'autenticazione
dei provider configurati. Mostra anche lo stato di scadenza OAuth per i profili trovati
nell'archivio di autenticazione (avvisa entro 24h per impostazione predefinita). `--plain` stampa solo il
modello primario risolto.
Lo stato OAuth viene sempre mostrato (ed è incluso nell'output `--json`). Se un provider configurato
non ha credenziali, `models status` stampa una sezione **Missing auth**.
Il JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers`
(autenticazione effettiva per provider).
Usa `--check` per l'automazione (exit `1` quando mancante/scaduta, `2` quando in scadenza).
Usa `--probe` per controlli live dell'autenticazione; le righe probe possono provenire da profili di autenticazione, credenziali env
o `models.json`.
Se `auth.order.<provider>` esplicito omette un profilo memorizzato, la probe segnala
`excluded_by_auth_order` invece di provarlo. Se l'autenticazione esiste ma non è possibile risolvere alcun
modello probeable per quel provider, la probe segnala `status: no_model`.

La scelta dell'autenticazione dipende da provider/account. Per host gateway sempre attivi, le chiavi API
sono di solito la soluzione più prevedibile; sono supportati anche il riutilizzo di Claude CLI e i profili OAuth/token Anthropic esistenti.

Esempio (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scansione (modelli OpenRouter gratuiti)

`openclaw models scan` ispeziona il **catalogo dei modelli gratuiti** di OpenRouter e può
facoltativamente eseguire probe sui modelli per il supporto di tools e immagini.

Flag principali:

- `--no-probe`: salta le probe live (solo metadati)
- `--min-params <b>`: dimensione minima dei parametri (miliardi)
- `--max-age-days <days>`: salta i modelli più vecchi
- `--provider <name>`: filtro sul prefisso del provider
- `--max-candidates <n>`: dimensione dell'elenco di fallback
- `--set-default`: imposta `agents.defaults.model.primary` sulla prima selezione
- `--set-image`: imposta `agents.defaults.imageModel.primary` sulla prima selezione immagine

Le probe richiedono una chiave API OpenRouter (da profili di autenticazione o
`OPENROUTER_API_KEY`). Senza una chiave, usa `--no-probe` per elencare solo i candidati.

I risultati della scansione vengono classificati in base a:

1. Supporto immagini
2. Latenza dei tools
3. Dimensione del contesto
4. Numero di parametri

Input

- Elenco OpenRouter `/models` (filtro `:free`)
- Richiede una chiave API OpenRouter da profili di autenticazione o `OPENROUTER_API_KEY` (vedi [/environment](/help/environment))
- Filtri opzionali: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controlli delle probe: `--timeout`, `--concurrency`

Quando viene eseguito in un TTY, puoi selezionare i fallback in modo interattivo. In modalità non interattiva,
passa `--yes` per accettare i valori predefiniti.

## Registro modelli (`models.json`)

I provider personalizzati in `models.providers` vengono scritti in `models.json` nella
directory dell'agente (predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file
viene unito per impostazione predefinita a meno che `models.mode` non sia impostato su `replace`.

Precedenza della modalità merge per ID provider corrispondenti:

- Un `baseUrl` non vuoto già presente nel `models.json` dell'agente ha la precedenza.
- Una `apiKey` non vuota nel `models.json` dell'agente ha la precedenza solo quando quel provider non è gestito come SecretRef nel contesto corrente di configurazione/profilo di autenticazione.
- I valori `apiKey` dei provider gestiti come SecretRef vengono aggiornati dai marker di origine (`ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec) invece di rendere persistenti i secret risolti.
- I valori header dei provider gestiti come SecretRef vengono aggiornati dai marker di origine (`secretref-env:ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec).
- `apiKey`/`baseUrl` dell'agente vuoti o mancanti ripiegano su config `models.providers`.
- Gli altri campi provider vengono aggiornati dalla configurazione e dai dati di catalogo normalizzati.

La persistenza dei marker è autorevole rispetto alla sorgente: OpenClaw scrive i marker dallo snapshot di configurazione della sorgente attiva (pre-risoluzione), non dai valori secret runtime risolti.
Questo si applica ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comandi come `openclaw agent`.

## Correlati

- [Provider di modelli](/concepts/model-providers) — instradamento provider e autenticazione
- [Failover dei modelli](/concepts/model-failover) — catene di fallback
- [Generazione di immagini](/tools/image-generation) — configurazione del modello immagine
- [Riferimento della configurazione](/gateway/configuration-reference#agent-defaults) — chiavi di configurazione del modello
