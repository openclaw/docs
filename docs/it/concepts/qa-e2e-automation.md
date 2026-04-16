---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiunta di scenari QA supportati dal repository
    - Creazione di un'automazione QA più realistica attorno alla dashboard del Gateway
summary: Forma dell'automazione QA privata per qa-lab, qa-channel, scenari con seed e report di protocollo
title: Automazione QA E2E
x-i18n:
    generated_at: "2026-04-16T21:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7deefda1c90a0d2e21e2155ffd8b585fb999e7416bdbaf0ff57eb33ccc063afc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automazione QA E2E

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
modellato sul canale, rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici per DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia utente di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: asset seed supportati dal repository per l'attività iniziale e gli scenari QA
  di base.

L'attuale flusso operativo QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la corsia gateway supportata da Docker ed espone la
pagina QA Lab in cui un operatore o un ciclo di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o cosa
è rimasto bloccato.

Per iterare più velocemente sull'interfaccia di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia l'hash
dell'asset di QA Lab.

Per una corsia smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix
```

Questa corsia effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra
utenti temporanei driver, SUT e observer, crea una stanza privata, quindi esegue il vero Plugin
Matrix all'interno di un processo figlio QA del gateway. La corsia di trasporto live mantiene la
configurazione figlia limitata al trasporto in test, quindi Matrix viene eseguito senza
`qa-channel` nella configurazione figlia. Scrive gli artefatti del report strutturato e
un log combinato stdout/stderr nella directory di output Matrix QA selezionata. Per
acquisire anche l'output esterno di build/launcher di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale del repository.

Per una corsia smoke Telegram con trasporto reale, esegui:

```bash
pnpm openclaw qa telegram
```

Questa corsia usa come target un vero gruppo privato Telegram invece di effettuare il provisioning di
un server usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere un nome utente Telegram e l'osservazione bot-to-bot
funziona al meglio quando entrambi i bot hanno la Bot-to-Bot Communication Mode
abilitata in `@BotFather`.

Le corsie di trasporto live ora condividono un contratto più piccolo invece di inventare
ognuna una propria forma dell'elenco degli scenari.

`qa-channel` resta l'ampia suite sintetica di comportamento del prodotto e non fa parte
della matrice di copertura del trasporto live.

| Corsia   | Canary | Gate dei mention | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | ---------------- | ---------------- | ------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                | x                | x                         | x                    | x                    | x                     | x                           |              |
| Telegram | x      |                  |                  |                           |                      |                      |                       |                             | x            |

Questo mantiene `qa-channel` come ampia suite di comportamento del prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita del contratto di trasporto.

Per una corsia VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker gateway isolati per impostazione predefinita, fino a 64 worker o al numero di
scenari selezionati. Usa `--concurrency <count>` per regolare il numero di worker, oppure
`--concurrency 1` per l'esecuzione seriale.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository in modo che il guest
possa scrivere indietro attraverso il workspace montato.

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Questi sono intenzionalmente in git così che il piano QA sia visibile sia agli esseri umani sia
all'agente.

`qa-lab` dovrebbe rimanere un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- riferimenti a documentazione e codice
- requisiti opzionali del Plugin
- patch opzionale della configurazione del gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può rimanere generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato
trasporto con helper lato browser che pilotano la Control UI incorporata tramite la
superficie `browser.request` del Gateway senza aggiungere un runner con casi speciali.

L'elenco di base dovrebbe rimanere abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff a subagente
- lettura del repository e della documentazione
- una piccola attività di build come Lobster Invaders

## Adattatori di trasporto

`qa-lab` possiede una superficie di trasporto generica per gli scenari QA in Markdown.
`qa-channel` è il primo adattatore su questa superficie, ma l'obiettivo del design è più ampio:
futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner della suite
invece di aggiungere un runner QA specifico per il trasporto.

A livello architetturale, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- l'adattatore di trasporto possiede configurazione del gateway, disponibilità, osservazione in ingresso e in uscita, azioni di trasporto e stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

Le linee guida di adozione rivolte ai maintainer per i nuovi adattatori di canale si trovano in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservato.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per i controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modelli live
e scrivi un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figli locali del gateway QA, non Docker. Gli scenari di character eval
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto nel workspace e piccole attività sui file. Al modello candidato
non dovrebbe essere detto che è in fase di valutazione. Il comando preserva ogni trascrizione
completa, registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh` di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i riferimenti candidati vengono sostituiti con etichette
neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni candidate usano per impostazione predefinita il thinking `high`, con `xhigh` per i modelli OpenAI che
lo supportano. Sostituisci un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta comunque un
fallback globale e la vecchia forma `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast così che venga usata
l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice necessita di una sostituzione. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate di candidati e giudici vengono
registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente di
non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza di 16.
Riduci `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione del gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, character eval usa per impostazione predefinita
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/web/dashboard)
