---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiungere scenari QA supportati dal repository
    - Creare automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: Forma dell’automazione QA privata per qa-lab, qa-channel, scenari con seed e report di protocollo
title: Automazione QA E2E
x-i18n:
    generated_at: "2026-04-24T08:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Lo stack QA privato serve a esercitare OpenClaw in un modo più realistico,
con forma da canale, rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: asset seed supportati dal repository per l’attività iniziale e gli scenari
  QA di base.

L’attuale flusso dell’operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l’agente.
- Destra: QA Lab, che mostra la trascrizione stile Slack e il piano di scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la lane gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un loop di automazione può assegnare all’agente
una missione QA, osservare il comportamento reale del canale e registrare cosa ha
funzionato, cosa è fallito o cosa è rimasto bloccato.

Per un’iterazione più rapida dell’interfaccia QA Lab senza ricompilare ogni volta
l’immagine Docker, avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un’immagine precompilata e monta in bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle quando cambia, e il browser si ricarica automaticamente quando
cambia l’hash degli asset di QA Lab.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix
```

Quella lane crea un homeserver Tuwunel temporaneo in Docker, registra utenti
temporanei driver, SUT e observer, crea una stanza privata, quindi esegue il vero
Plugin Matrix all’interno di un processo figlio del gateway QA. La lane di trasporto live mantiene
la configurazione figlia limitata al trasporto sotto test, quindi Matrix viene eseguito senza
`qa-channel` nella configurazione figlia. Scrive gli artefatti di report strutturato e un
log combinato stdout/stderr nella directory di output QA Matrix selezionata. Per
acquisire anche l’output di build/launcher esterno di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale al repository.

Per una lane smoke Telegram con trasporto reale, esegui:

```bash
pnpm openclaw qa telegram
```

Quella lane usa un vero gruppo Telegram privato invece di creare un server temporaneo. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere uno username Telegram e l’osservazione
bot-to-bot funziona al meglio quando entrambi i bot hanno la modalità
Bot-to-Bot Communication Mode abilitata in `@BotFather`.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Il report Telegram e il riepilogo includono l’RTT per risposta dal momento della richiesta di
invio del messaggio del driver alla risposta SUT osservata, a partire dal canary.

Per una lane smoke Discord con trasporto reale, esegui:

```bash
pnpm openclaw qa discord
```

Quella lane usa un vero canale privato di una guild Discord con due bot: un
bot driver controllato dall’harness e un bot SUT avviato dal gateway OpenClaw figlio tramite il
Plugin Discord incluso. Richiede
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` quando si usano credenziali env.
La lane verifica la gestione delle menzioni nel canale e controlla che il bot SUT abbia
registrato con Discord il comando nativo `/help`.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.

Le lane di trasporto live ora condividono un contratto più piccolo invece di inventare
ognuna la propria forma di elenco degli scenari.

`qa-channel` resta la suite ampia di comportamento del prodotto sintetico e non fa parte
della matrice di copertura del trasporto live.

| Lane     | Canary | Gating menzione | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazione | Comando help | Registrazione comando nativo |
| -------- | ------ | --------------- | ---------------- | ------------------------- | -------------------- | ---------------- | ----------------- | --------------------- | ------------ | ---------------------------- |
| Matrix   | x      | x               | x                | x                         | x                    | x                | x                 | x                     |              |                              |
| Telegram | x      | x               |                  |                          |                      |                  |                   |                       | x            |                              |
| Discord  | x      | x               |                  |                          |                      |                  |                   |                       |              | x                            |

Questo mantiene `qa-channel` come suite ampia di comportamento del prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita di contratto di trasporto.

Per una lane VM Linux temporanea senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass pulito, installa le dipendenze, compila OpenClaw
all’interno del guest, esegue `qa suite`, quindi copia il normale report QA e il riepilogo
di nuovo in `.artifacts/qa-e2e/...` sull’host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
Le esecuzioni host e Multipass della suite eseguono per impostazione predefinita più scenari selezionati in parallelo
con worker gateway isolati. `qa-channel` usa come predefinito concorrenza 4,
limitata dal conteggio degli scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l’esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository così il guest
può scrivere indietro attraverso il workspace montato.

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git così il piano QA è visibile sia agli esseri umani sia all’
agente.

`qa-lab` dovrebbe restare un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati opzionali di categoria, capacità, lane e rischio
- riferimenti a documentazione e codice
- requisiti Plugin opzionali
- patch opzionale della configurazione gateway
- il `qa-flow` eseguibile

La superficie di runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato trasporto
con helper lato browser che pilotano la Control UI incorporata tramite la seam
Gateway `browser.request` senza aggiungere un runner speciale per casi particolari.

I file di scenario dovrebbero essere raggruppati per capacità di prodotto anziché per cartella
dell’albero sorgente. Mantieni stabili gli ID di scenario quando i file vengono spostati; usa `docsRefs` e `codeRefs`
per la tracciabilità dell’implementazione.

L’elenco di base dovrebbe restare abbastanza ampio da coprire:

- chat DM e canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff di subagente
- lettura del repository e lettura della documentazione
- una piccola attività di build come Lobster Invaders

## Lane mock del provider

`qa suite` ha due lane mock provider locali:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Resta la lane mock
  deterministica predefinita per QA supportata dal repository e gate di parità.
- `aimock` avvia un server provider supportato da AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e chaos. È additivo e non sostituisce il dispatcher
  di scenari `mock-openai`.

L’implementazione della lane provider si trova in `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l’avvio del server locale, la configurazione del modello gateway,
le necessità di staging del profilo di autenticazione e i flag di capacità live/mock. Il codice condiviso
di suite e gateway dovrebbe passare attraverso il registro provider invece di fare branching sui
nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede una seam di trasporto generica per scenari QA Markdown.
`qa-channel` è il primo adattatore su quella seam, ma l’obiettivo di progettazione è più ampio:
i futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner di suite
invece di aggiungere un runner QA specifico per trasporto.

A livello architetturale, la suddivisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- l’adattatore di trasporto possiede configurazione gateway, readiness, osservazione in ingresso e in uscita, azioni di trasporto e stato di trasporto normalizzato.
- i file di scenario Markdown in `qa/scenarios/` definiscono l’esecuzione di test; `qa-lab` fornisce la superficie di runtime riutilizzabile che li esegue.

Le indicazioni di adozione rivolte ai maintainer per nuovi adattatori di canale si trovano in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservato.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modello live
e scrivi un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Il comando esegue processi figli locali del gateway QA, non Docker. Gli scenari di valutazione del carattere
dovrebbero impostare la persona tramite `SOUL.md`, poi eseguire normali turni utente
come chat, aiuto sul workspace e piccole attività su file. Al modello candidato
non dovrebbe essere detto che sta venendo valutato. Il comando conserva ogni trascrizione
completa, registra statistiche di esecuzione di base, poi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette
neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita thinking `high`, con `medium` per GPT-5.4 e `xhigh`
per i riferimenti eval OpenAI più vecchi che lo supportano. Sostituisci un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` continua a impostare un fallback
globale, e la vecchia forma `--model-thinking <provider/model=level>` viene mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast così viene usata
l’elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando
un singolo candidato o giudice ha bisogno di un override. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate dei candidati e dei giudici vengono
registrate nel report per l’analisi benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e dei modelli giudici usano entrambe per impostazione predefinita concorrenza 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono un’esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la valutazione del carattere usa come predefiniti
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano come predefiniti
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/it/web/dashboard)
