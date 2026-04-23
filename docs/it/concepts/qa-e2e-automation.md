---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiunta di scenari QA supportati dal repository
    - Creazione di un'automazione QA con maggiore realismo attorno alla dashboard del Gateway
summary: Forma dell'automazione QA privata per qa-lab, qa-channel, scenari con seed e report del protocollo
title: Automazione QA E2E
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automazione QA E2E

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
con una forma simile a quella dei canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia utente di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in entrata ed esportare un report in Markdown.
- `qa/`: asset seed supportati dal repository per il task iniziale e gli scenari QA
  di base.

L'attuale flusso dell'operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (interfaccia di controllo) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la corsia Gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un loop di automazione può assegnare all'agente una missione QA,
osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

Per un'iterazione più rapida dell'interfaccia di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle di QA Lab montato tramite bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica e il browser si ricarica automaticamente quando l'hash
degli asset di QA Lab cambia.

Per una corsia smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix
```

Questa corsia esegue il provisioning di un homeserver Tuwunel usa e getta in Docker, registra
utenti temporanei driver, SUT e osservatore, crea una stanza privata, quindi esegue
il Plugin Matrix reale all'interno di un processo figlio del gateway QA. La corsia di trasporto live mantiene
la configurazione del processo figlio limitata al trasporto in test, quindi Matrix viene eseguito senza
`qa-channel` nella configurazione del processo figlio. Scrive gli artifact del report strutturato e
un log combinato stdout/stderr nella directory di output Matrix QA selezionata. Per
acquisire anche l'output esterno di build/launcher di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale al repository.

Per una corsia smoke Telegram con trasporto reale, esegui:

```bash
pnpm openclaw qa telegram
```

Questa corsia usa come target un gruppo privato Telegram reale invece di eseguire il provisioning di
un server usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere un nome utente Telegram, e l'osservazione bot-to-bot
funziona al meglio quando entrambi i bot hanno la Bot-to-Bot Communication Mode
abilitata in `@BotFather`.
Il comando termina con un codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi ottenere gli artifact senza un codice di uscita di errore.
Il report e il riepilogo Telegram includono il RTT per risposta dal momento della richiesta di invio
del messaggio del driver fino alla risposta osservata del SUT, a partire dal canary.

Le corsie di trasporto live ora condividono un unico contratto più piccolo invece di inventare
ognuna una propria forma dell'elenco degli scenari:

`qa-channel` rimane la suite ampia di comportamento sintetico del prodotto e non fa parte della matrice
di copertura del trasporto live.

| Corsia   | Canary | Gating delle mention | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | -------------------- | ---------------- | ------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                    | x                | x                         | x                    | x                    | x                     | x                           |              |
| Telegram | x      |                      |                  |                           |                      |                      |                       |                             | x            |

Questo mantiene `qa-channel` come suite ampia di comportamento del prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono un'unica checklist esplicita di contratto di trasporto.

Per una corsia VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo di nuovo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni suite su host e Multipass eseguono per impostazione predefinita più scenari selezionati in parallelo
con worker gateway isolati. `qa-channel` usa per impostazione predefinita una concorrenza di
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per un'esecuzione seriale.
Il comando termina con un codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi ottenere gli artifact senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository così il guest
può scrivere indietro attraverso il workspace montato.

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Questi sono intenzionalmente in git così il piano QA è visibile sia agli umani sia
all'agente.

`qa-lab` dovrebbe rimanere un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati opzionali di categoria, capacità, corsia e rischio
- riferimenti a documentazione e codice
- requisiti opzionali dei plugin
- patch opzionale della configurazione Gateway
- il `qa-flow` eseguibile

La superficie di runtime riutilizzabile che supporta `qa-flow` può rimanere generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato trasporto
con helper lato browser che guidano l'interfaccia di controllo incorporata tramite la seam
Gateway `browser.request` senza aggiungere un runner speciale.

I file di scenario dovrebbero essere raggruppati per capacità del prodotto anziché per cartella
dell'albero sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa
`docsRefs` e `codeRefs` per la tracciabilità dell'implementazione.

L'elenco di base dovrebbe rimanere abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff a subagent
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Corsie mock del provider

`qa suite` ha due corsie mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Rimane la corsia mock deterministica
  predefinita per il QA supportato dal repository e i gate di parità.
- `aimock` avvia un server provider supportato da AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e chaos. È aggiuntivo e non sostituisce il dispatcher di scenari
  `mock-openai`.

L'implementazione della corsia provider si trova in `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale, la configurazione
del modello Gateway, le esigenze di staging del profilo di autenticazione e i flag di capacità
live/mock. Il codice condiviso della suite e del gateway dovrebbe instradare tramite il registro
dei provider invece di fare branching sui nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA Markdown.
`qa-channel` è il primo adattatore su quella seam, ma l'obiettivo di progettazione è più ampio:
futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner di suite invece di
aggiungere un runner QA specifico per trasporto.

A livello di architettura, la suddivisione è:

- `qa-lab` possiede l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artifact e il reporting.
- l'adattatore di trasporto possiede la configurazione Gateway, la readiness, l'osservazione in entrata e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie di runtime riutilizzabile che li esegue.

Le linee guida di adozione rivolte ai maintainer per i nuovi adattatori di canale si trovano in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` esporta un report del protocollo in Markdown dalla timeline osservata del bus.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per verifiche di carattere e stile, esegui lo stesso scenario su più
ref di modelli live e scrivi un report Markdown valutato:

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

Il comando esegue processi figlio del gateway QA locali, non Docker. Gli scenari di character eval
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto nell'workspace e piccoli task sui file. Al modello candidato
non dovrebbe essere detto che è in valutazione. Il comando conserva ogni trascrizione
completa, registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudice in modalità fast con
ragionamento `xhigh` di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i ref candidati vengono sostituiti con etichette
neutre come `candidate-01`; il report rimappa le classifiche ai ref reali dopo il
parsing.
Le esecuzioni dei candidati usano per impostazione predefinita il thinking `high`, con `xhigh` per i modelli OpenAI che
lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` continua a impostare un
fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I ref candidati OpenAI usano per impostazione predefinita la modalità fast così l'elaborazione prioritaria viene usata
dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice necessita di una sovrascrittura. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate dei modelli candidati e giudici
vengono registrate nel report per l'analisi comparativa, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Sia le esecuzioni dei modelli candidati sia quelle dei modelli giudici usano per impostazione predefinita una concorrenza di 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione locale sul gateway
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la character eval usa per impostazione predefinita
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
- [Dashboard](/it/web/dashboard)
