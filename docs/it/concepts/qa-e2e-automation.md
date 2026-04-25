---
read_when:
    - Estensione di qa-lab o qa-channel
    - Aggiunta di scenari QA supportati dal repository
    - Creazione di un'automazione QA più realistica attorno alla dashboard del Gateway
summary: Struttura dell'automazione QA privata per qa-lab, qa-channel, scenari predefiniti e report di protocollo
title: Automazione QA end-to-end
x-i18n:
    generated_at: "2026-04-25T18:19:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
modellato sui canali, rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in entrata ed esportare un report Markdown.
- `qa/`: asset seed supportati dal repository per il task iniziale e gli scenari QA
  di base.

L'attuale flusso operativo QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (UI di controllo) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la lane del Gateway supportata da Docker ed espone la
pagina di QA Lab in cui un operatore o un loop di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

Per iterare più velocemente sulla UI di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia
l'hash degli asset di QA Lab.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix
```

Questa lane effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra
utenti temporanei driver, SUT e observer, crea una stanza privata, quindi esegue
il vero Plugin Matrix all'interno di un processo figlio del Gateway QA. La lane di trasporto live mantiene
la configurazione figlia limitata al trasporto in test, quindi Matrix viene eseguito senza
`qa-channel` nella configurazione figlia. Scrive gli artifact del report strutturato e
un log combinato stdout/stderr nella directory di output Matrix QA selezionata. Per
acquisire anche l'output di compilazione/avvio esterno di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale al repository.
L'avanzamento di Matrix viene stampato per impostazione predefinita. `OPENCLAW_QA_MATRIX_TIMEOUT_MS`
limita l'intera esecuzione e `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita la pulizia, così
un teardown Docker bloccato riporta l'esatto comando di ripristino invece di restare sospeso.

Per una lane smoke Telegram con trasporto reale, esegui:

```bash
pnpm openclaw qa telegram
```

Questa lane prende di mira un vero gruppo privato Telegram invece di effettuare il provisioning di un
server usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere uno username Telegram e l'osservazione
bot-to-bot funziona al meglio quando entrambi i bot hanno Bot-to-Bot Communication Mode
abilitato in `@BotFather`.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.
Il report e il riepilogo Telegram includono l'RTT per risposta dal messaggio del driver
inviato alla risposta osservata del SUT, a partire dal canary.

Prima di usare credenziali live condivise, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il comando doctor controlla l'env del broker Convex, valida le impostazioni degli endpoint
e verifica la raggiungibilità admin/list quando è presente il segreto del maintainer. Riporta solo lo stato
impostato/mancante dei segreti.

Per una lane smoke Discord con trasporto reale, esegui:

```bash
pnpm openclaw qa discord
```

Questa lane prende di mira un vero canale guild Discord privato con due bot: un
bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite
il Plugin Discord incluso. Richiede
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` quando si usano credenziali env.
La lane verifica la gestione delle menzioni del canale e controlla che il bot SUT abbia
registrato il comando nativo `/help` con Discord.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.

Le lane di trasporto live ora condividono un contratto più piccolo invece di inventare ciascuna
la propria forma per l'elenco degli scenari:

`qa-channel` rimane l'ampia suite sintetica del comportamento del prodotto e non fa parte
della matrice di copertura del trasporto live.

| Lane     | Canary | Gating per menzione | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | ------------------- | ---------------- | ------------------------- | -------------------- | ------------------- | --------------------- | --------------------------- | ------------ | ---------------------------- |
| Matrix   | x      | x                   | x                | x                         | x                    | x                   | x                     | x                           |              |                              |
| Telegram | x      | x                   |                  |                           |                      |                     |                       |                             | x            |                              |
| Discord  | x      | x                   |                  |                           |                      |                     |                       |                             |              | x                            |

Questo mantiene `qa-channel` come ampia suite del comportamento del prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono un'unica checklist esplicita del contratto di trasporto.

Per una lane VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione dello scenario di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono per impostazione predefinita in parallelo
più scenari selezionati con worker Gateway isolati. `qa-channel` usa come valore predefinito una concorrenza di
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository così il guest
può scrivere indietro tramite il workspace montato.

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Questi sono intenzionalmente in git così il piano QA è visibile sia agli esseri umani sia
all'agente.

`qa-lab` dovrebbe restare un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati facoltativi di categoria, capability, lane e rischio
- riferimenti a documentazione e codice
- requisiti facoltativi dei Plugin
- patch facoltativa di configurazione del Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato trasporto
con helper lato browser che pilotano la UI di controllo incorporata tramite la
seam `browser.request` del Gateway senza aggiungere un runner con casi speciali.

I file di scenario dovrebbero essere raggruppati per capability del prodotto anziché per cartella
dell'albero sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco di base dovrebbe restare abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- recupero della memoria
- cambio modello
- handoff a subagent
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Lane mock del provider

`qa suite` ha due lane mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Rimane la
  lane mock deterministica predefinita per QA supportato dal repository e parity gate.
- `aimock` avvia un server provider supportato da AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e chaos. È additivo e non sostituisce il dispatcher degli scenari di `mock-openai`.

L'implementazione della lane del provider si trova in `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale,
la configurazione del modello Gateway, le esigenze di staging dell'auth-profile
e i flag di capability live/mock. Il codice condiviso della suite e del Gateway dovrebbe instradare
tramite il registro dei provider invece di diramarsi sui nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA Markdown.
`qa-channel` è il primo adapter su quella seam, ma l'obiettivo progettuale è più ampio:
i futuri canali reali o sintetici dovrebbero collegarsi allo stesso suite runner
invece di aggiungere un runner QA specifico per il trasporto.

A livello di architettura, la suddivisione è:

- `qa-lab` possiede l'esecuzione generica dello scenario, la concorrenza dei worker, la scrittura degli artifact e il reporting.
- l'adapter di trasporto possiede la configurazione del Gateway, la readiness, l'osservazione in entrata e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione di test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

La guida all'adozione, rivolta ai maintainer, per i nuovi adapter di canale si trova in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per i controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modello live
e scrivi un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figli locali del Gateway QA, non Docker. Gli scenari di character eval
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, assistenza sul workspace e piccoli task su file. Al modello candidato
non deve essere detto che è in fase di valutazione. Il comando conserva ogni trascrizione
completa, registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudice in modalità fast con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette neutre
come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo il parsing.

Le esecuzioni dei candidati usano come valore predefinito il thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per i vecchi riferimenti OpenAI di eval che lo supportano. Sostituisci un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta comunque un fallback
globale, e la forma precedente `--model-thinking <provider/model=level>` viene mantenuta
per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast così viene usata l'elaborazione prioritaria
dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice ha bisogno di un override. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate dei candidati e dei giudici vengono
registrate nel report per l'analisi comparativa, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e dei modelli giudice usano entrambe per impostazione predefinita una concorrenza di 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, character eval usa come valori predefiniti
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano come valori predefiniti
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/it/web/dashboard)
