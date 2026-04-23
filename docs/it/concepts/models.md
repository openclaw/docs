---
read_when:
    - Aggiunta o modifica della CLI dei modelli (models list/set/scan/aliases/fallbacks)
    - Modifica del comportamento di fallback del modello o dell'esperienza di selezione
    - Aggiornamento delle probe di scansione del modello (strumenti/immagini)
summary: 'CLI dei modelli: elenco, impostazione, alias, fallback, scansione, stato'
title: CLI dei modelli
x-i18n:
    generated_at: "2026-04-23T08:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI dei modelli

Vedi [/concepts/model-failover](/it/concepts/model-failover) per la rotazione
dei profili auth, i cooldown e come questo interagisce con i fallback.
Panoramica rapida dei provider + esempi: [/concepts/model-providers](/it/concepts/model-providers).

## Come funziona la selezione del modello

OpenClaw seleziona i modelli in questo ordine:

1. Modello **primario** (`agents.defaults.model.primary` oppure `agents.defaults.model`).
2. **Fallback** in `agents.defaults.model.fallbacks` (in ordine).
3. Il **failover auth del provider** avviene all'interno di un provider prima di passare al
   modello successivo.

Correlati:

- `agents.defaults.models` è l'allowlist/catalogo dei modelli che OpenClaw può usare (più gli alias).
- `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
- `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento
  usa il fallback a `agents.defaults.imageModel`, poi al modello risolto di sessione/predefinito.
- `agents.defaults.imageGenerationModel` viene usato dalla capability condivisa di generazione immagini. Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider registrati di generazione immagini in ordine di provider-id. Se imposti un provider/modello specifico, configura anche auth/API key di quel provider.
- `agents.defaults.musicGenerationModel` viene usato dalla capability condivisa di generazione musicale. Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider registrati di generazione musicale in ordine di provider-id. Se imposti un provider/modello specifico, configura anche auth/API key di quel provider.
- `agents.defaults.videoGenerationModel` viene usato dalla capability condivisa di generazione video. Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i restanti provider registrati di generazione video in ordine di provider-id. Se imposti un provider/modello specifico, configura anche auth/API key di quel provider.
- I valori predefiniti per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più i binding (vedi [/concepts/multi-agent](/it/concepts/multi-agent)).

## Policy rapida sui modelli

- Imposta come primario il modello di ultima generazione più potente a tua disposizione.
- Usa i fallback per attività sensibili a costo/latenza e chat a minore criticità.
- Per agenti con strumenti abilitati o input non attendibili, evita tier di modelli più vecchi/deboli.

## Onboarding (consigliato)

Se non vuoi modificare la configurazione a mano, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + auth per i provider comuni, inclusi **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (API key o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri provider)
- `models.providers` (provider personalizzati scritti in `models.json`)

I riferimenti dei modelli vengono normalizzati in minuscolo. Gli alias provider come `z.ai/*` vengono normalizzati
in `zai/*`.

Esempi di configurazione del provider (incluso OpenCode) si trovano in
[/providers/opencode](/it/providers/opencode).

### Modifiche sicure all'allowlist

Usa scritture additive quando aggiorni `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protegge le mappe modello/provider da sovrascritture accidentali. Una
semplice assegnazione di oggetto a `agents.defaults.models`, `models.providers` o
`models.providers.<id>.models` viene rifiutata quando rimuoverebbe voci esistenti. Usa `--merge` per modifiche additive; usa `--replace` solo quando il
valore fornito deve diventare il valore target completo.

La configurazione interattiva del provider e `openclaw configure --section model` uniscono anch'essi
le selezioni con scope provider nell'allowlist esistente, quindi aggiungere Codex,
Ollama o un altro provider non elimina voci di modello non correlate.

## "Il modello non è consentito" (e perché le risposte si fermano)

Se `agents.defaults.models` è impostato, diventa l'**allowlist** per `/model` e per
gli override di sessione. Quando un utente seleziona un modello che non è in quell'allowlist,
OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Questo accade **prima** che venga generata una risposta normale, quindi il messaggio può dare l'impressione
di “non aver risposto”. La soluzione è una delle seguenti:

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

## Cambiare modello in chat (`/model`)

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
- `/models add` è disponibile per impostazione predefinita e può essere disabilitato con `commands.modelsWrite=false`.
- Quando abilitato, `/models add <provider> <modelId>` è il percorso più rapido; il semplice `/models add` avvia un flusso guidato provider-first dove supportato.
- Dopo `/models add`, il nuovo modello diventa disponibile in `/models` e `/model` senza riavviare il gateway.
- `/model <#>` seleziona da quel selettore.
- `/model` persiste immediatamente la nuova selezione di sessione.
- Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
- Se è già attiva un'esecuzione, OpenClaw contrassegna un cambio live come in attesa e riavvia nel nuovo modello solo a un punto pulito di retry.
- Se l'attività degli strumenti o l'output della risposta sono già iniziati, il cambio in attesa può restare in coda fino a una successiva opportunità di retry o al turno utente successivo.
- `/model status` è la vista dettagliata (candidati auth e, quando configurati, `baseUrl` + modalità `api` dell'endpoint provider).
- I riferimenti dei modelli vengono analizzati dividendo sul **primo** `/`. Usa `provider/model` quando digiti `/model <ref>`.
- Se l'ID modello stesso contiene `/` (stile OpenRouter), devi includere il prefisso provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input in questo ordine:
  1. corrispondenza alias
  2. corrispondenza univoca del provider configurato per quell'esatto model id senza prefisso
  3. fallback deprecato al provider predefinito configurato
     Se quel provider non espone più il modello predefinito configurato, OpenClaw
     usa invece come fallback il primo provider/modello configurato per evitare
     di esporre un predefinito stale di provider rimosso.

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
- `--provider <id>`: filtra per provider id, per esempio `moonshot`; le
  etichette mostrate nei selettori interattivi non sono accettate
- `--plain`: un modello per riga
- `--json`: output leggibile da macchina

`--all` include le righe statiche del catalogo di provider inclusi prima che auth sia
configurato, così le viste di sola discovery possono mostrare modelli non disponibili finché
non aggiungi credenziali provider corrispondenti.

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagine e una panoramica auth
dei provider configurati. Mostra anche lo stato di scadenza OAuth per i profili trovati
nell'archivio auth (avverte entro 24h per impostazione predefinita). `--plain` stampa solo il
modello primario risolto.
Lo stato OAuth viene sempre mostrato (ed è incluso nell'output `--json`). Se un provider configurato
non ha credenziali, `models status` stampa una sezione **Auth mancante**.
Il JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers`
(auth effettiva per provider, incluse le credenziali supportate da env). `auth.oauth`
è solo lo stato dei profili dell'archivio auth; i provider solo-env non compaiono lì.
Usa `--check` per l'automazione (exit `1` quando mancante/scaduto, `2` quando in scadenza).
Usa `--probe` per controlli auth live; le righe probe possono provenire da profili auth, credenziali env
o `models.json`.
Se `auth.order.<provider>` esplicito omette un profilo memorizzato, la probe riporta
`excluded_by_auth_order` invece di provarlo. Se auth esiste ma non può essere risolto alcun
modello sondata per quel provider, la probe riporta `status: no_model`.

La scelta auth dipende da provider/account. Per host gateway sempre attivi, le API
key sono di solito le più prevedibili; sono supportati anche il riuso di Claude CLI e i profili OAuth/token Anthropic esistenti.

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
- `--max-candidates <n>`: dimensione della lista di fallback
- `--set-default`: imposta `agents.defaults.model.primary` sulla prima selezione
- `--set-image`: imposta `agents.defaults.imageModel.primary` sulla prima selezione immagine

Le probe richiedono una API key OpenRouter (da profili auth o
`OPENROUTER_API_KEY`). Senza una chiave, usa `--no-probe` per elencare solo i candidati.

I risultati della scansione sono classificati per:

1. Supporto immagini
2. Latenza strumenti
3. Dimensione del contesto
4. Numero di parametri

Input

- Elenco OpenRouter `/models` (filtro `:free`)
- Richiede API key OpenRouter da profili auth o `OPENROUTER_API_KEY` (vedi [/environment](/it/help/environment))
- Filtri facoltativi: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controlli probe: `--timeout`, `--concurrency`

Quando viene eseguito in una TTY, puoi selezionare i fallback in modo interattivo. In modalità non interattiva,
passa `--yes` per accettare i valori predefiniti.

## Registry dei modelli (`models.json`)

I provider personalizzati in `models.providers` vengono scritti in `models.json` sotto la
directory dell'agente (predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file
viene unito per impostazione predefinita a meno che `models.mode` non sia impostato su `replace`.

Precedenza della modalità merge per provider ID corrispondenti:

- `baseUrl` non vuoto già presente nel `models.json` dell'agente ha la precedenza.
- `apiKey` non vuoto nel `models.json` dell'agente ha la precedenza solo quando quel provider non è gestito da SecretRef nel contesto corrente di configurazione/auth-profile.
- I valori `apiKey` del provider gestiti da SecretRef vengono aggiornati dai marker di origine (`ENV_VAR_NAME` per env ref, `secretref-managed` per i ref file/exec) invece di persistere i segreti risolti.
- I valori header del provider gestiti da SecretRef vengono aggiornati dai marker di origine (`secretref-env:ENV_VAR_NAME` per env ref, `secretref-managed` per i ref file/exec).
- `apiKey`/`baseUrl` dell'agente vuoti o mancanti usano il fallback a `models.providers` della configurazione.
- Gli altri campi del provider vengono aggiornati dalla configurazione e dai dati di catalogo normalizzati.

La persistenza dei marker è autorevole rispetto alla sorgente: OpenClaw scrive i marker dallo snapshot di configurazione della sorgente attiva (pre-risoluzione), non dai valori segreti runtime risolti.
Questo si applica ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comandi come `openclaw agent`.

## Correlati

- [Provider di modelli](/it/concepts/model-providers) — instradamento provider e auth
- [Failover del modello](/it/concepts/model-failover) — catene di fallback
- [Generazione di immagini](/it/tools/image-generation) — configurazione del modello immagine
- [Generazione musicale](/it/tools/music-generation) — configurazione del modello musicale
- [Generazione video](/it/tools/video-generation) — configurazione del modello video
- [Riferimento della configurazione](/it/gateway/configuration-reference#agent-defaults) — chiavi di configurazione del modello
