---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiungere scenari QA supportati dal repository
    - Creare un'automazione QA con maggiore realismo attorno alla dashboard del Gateway
summary: Struttura dell'automazione QA privata per qa-lab, qa-channel, scenari inizializzati e report di protocollo
title: Automazione QA end-to-end
x-i18n:
    generated_at: "2026-04-10T08:13:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 357d6698304ff7a8c4aa8a7be97f684d50f72b524740050aa761ac0ee68266de
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automazione QA end-to-end

Lo stack QA privato è pensato per testare OpenClaw in modo più realistico,
con una forma simile a quella di un canale, rispetto a quanto possa fare un
singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia utente di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: risorse seed supportate dal repository per il task iniziale e gli
  scenari QA di base.

L'attuale flusso operativo QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la lane del gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un loop di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato,
cosa è fallito o cosa è rimasto bloccato.

Per iterare più velocemente sull'interfaccia utente di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica, e il browser si ricarica automaticamente quando cambia l'hash
delle risorse di QA Lab.

Per una lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia una nuova guest Multipass, installa le dipendenze, compila OpenClaw all'interno della guest,
esegue `qa suite`, quindi copia il normale report QA e il riepilogo in `.artifacts/qa-e2e/...`
sull'host.
Riutilizza lo stesso comportamento di selezione dello scenario di `qa suite` sull'host.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per la
guest: chiavi provider basate su env, il percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository in modo che la guest
possa scrivere di nuovo attraverso il workspace montato.

## Seed supportati dal repository

Le risorse seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Questi file sono intenzionalmente presenti in git in modo che il piano QA sia visibile sia agli esseri umani sia
all'agente. L'elenco di base dovrebbe rimanere abbastanza ampio da coprire:

- chat in DM e nei canali
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio modello
- handoff a subagente
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

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

Il comando esegue processi figli locali del gateway QA, non Docker. Gli scenari di valutazione del carattere
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, assistenza sul workspace e piccoli task sui file. Al modello candidato non
dovrebbe essere detto che è in fase di valutazione. Il comando preserva ogni trascrizione completa,
registra statistiche di base sull'esecuzione, quindi chiede ai modelli giudice in modalità fast con
ragionamento `xhigh` di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette
neutrali come `candidate-01`; il report riconduce le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita il livello di ragionamento `high`, con `xhigh` per i modelli OpenAI che
lo supportano. Sostituisci un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` continua a impostare un
fallback globale, e la forma meno recente `--model-thinking <provider/model=level>` viene mantenuta
per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast in modo che venga usata l'elaborazione prioritaria dove
il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice richiede una sostituzione. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate dei candidati e dei giudici vengono
registrate nel report per l'analisi comparativa, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza di 16.
Riduci `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [Canale QA](/it/channels/qa-channel)
- [Dashboard](/web/dashboard)
