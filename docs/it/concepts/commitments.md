---
read_when:
    - Vuoi che OpenClaw ricordi i follow-up naturali
    - Vuoi capire in che modo i check-in dedotti differiscono dai promemoria
    - Vuoi esaminare o ignorare gli impegni di follow-up
sidebarTitle: Commitments
summary: Memoria di follow-up dedotta per i check-in che non sono promemoria esatti
title: Impegni dedotti
x-i18n:
    generated_at: "2026-07-12T06:58:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Gli impegni sono memorie di follow-up di breve durata. Quando sono abilitati, OpenClaw può
rilevare che una conversazione ha creato un'opportunità per una verifica futura e ricordarsi
di riprenderla in seguito.

Esempi:

- Menzioni un colloquio per domani. OpenClaw potrebbe chiederti in seguito com'è andato.
- Dici di essere esausto. OpenClaw potrebbe chiederti più tardi se hai dormito.
- L'agente dice che farà un follow-up dopo un cambiamento. OpenClaw potrebbe tenere traccia
  di questo punto in sospeso.

Gli impegni non sono fatti persistenti come `MEMORY.md` e non sono promemoria
esatti. Si collocano tra la memoria e l'automazione: OpenClaw ricorda un
obbligo legato alla conversazione, poi Heartbeat lo recapita quando è il momento.

## Abilitare gli impegni

Gli impegni sono disabilitati per impostazione predefinita (`commitments.enabled: false`). Abilitali nella configurazione:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Configurazione `openclaw.json` equivalente:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limita il numero di follow-up dedotti che possono essere recapitati
per sessione dell'agente nell'arco di una giornata mobile. Il valore predefinito è `3`.

## Come funziona

Dopo una risposta dell'agente, OpenClaw può eseguire in background un passaggio di estrazione nascosto in un
contesto separato, con gli strumenti disabilitati. Questo passaggio cerca esclusivamente gli impegni di follow-up dedotti. Non
scrive nella conversazione visibile e non chiede all'agente principale
di ragionare sull'estrazione.

Quando trova un candidato con un elevato livello di attendibilità, OpenClaw memorizza un impegno con:

- l'ID dell'agente
- la chiave della sessione
- il canale originale e la destinazione di recapito
- una finestra temporale prevista
- un breve suggerimento per la verifica
- metadati non prescrittivi che consentono a Heartbeat di decidere se inviarlo

Il recapito avviene tramite Heartbeat. Quando un impegno giunge a scadenza, Heartbeat
lo aggiunge al turno di Heartbeat per lo stesso agente e lo stesso ambito del canale.
Il prompt avverte esplicitamente che i metadati dell'impegno non sono attendibili e indica
al modello di non seguire le istruzioni contenute al loro interno né di usare strumenti a causa di tali istruzioni. Il
modello può inviare un unico messaggio naturale di verifica oppure rispondere `HEARTBEAT_OK` per ignorarlo.
Se Heartbeat è configurato con `target: "none"`, gli impegni giunti a scadenza rimangono
interni e non inviano messaggi di verifica esterni. I prompt di recapito degli impegni non
riproducono il testo della conversazione originale, ma solo il messaggio di verifica suggerito e i
metadati; inoltre, i turni di Heartbeat relativi agli impegni giunti a scadenza vengono eseguiti senza gli strumenti di OpenClaw.

OpenClaw non recapita mai un impegno dedotto immediatamente dopo averlo scritto.
La scadenza viene impostata ad almeno un intervallo di Heartbeat successivo alla creazione dell'impegno,
in modo che il follow-up non venga riproposto nello stesso momento in cui è stato
dedotto.

## Ambito

Gli impegni sono limitati all'esatto contesto dell'agente e del canale in cui sono stati
creati. Un follow-up dedotto durante una conversazione con un agente in Discord non viene
recapitato da un altro agente, da un altro canale o da una sessione non correlata.

Questo ambito è parte integrante della funzionalità. I messaggi naturali di verifica devono sembrare la prosecuzione della stessa
conversazione, non un sistema globale di promemoria.

## Impegni e promemoria

| Esigenza                                         | Usa                                      |
| ------------------------------------------------ | ---------------------------------------- |
| "Ricordamelo alle 15:00"                         | [Attività pianificate](/it/automation/cron-jobs) |
| "Avvisami tra 20 minuti"                         | [Attività pianificate](/it/automation/cron-jobs) |
| "Esegui questo report ogni giorno feriale"       | [Attività pianificate](/it/automation/cron-jobs) |
| "Domani ho un colloquio"                         | Impegni                                  |
| "Sono rimasto sveglio tutta la notte"            | Impegni                                  |
| "Ricontattami se non rispondo a questa discussione aperta" | Impegni                         |

Le richieste esplicite dell'utente appartengono già al percorso dello scheduler. Gli impegni servono esclusivamente
per i follow-up dedotti: quei momenti in cui l'utente non ha chiesto un promemoria,
ma la conversazione ha chiaramente creato un'utile opportunità di verifica futura.

## Gestire gli impegni

Usa la CLI per esaminare e cancellare gli impegni memorizzati:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulta [`openclaw commitments`](/it/cli/commitments) per il riferimento completo dei comandi.

## Privacy e costi

L'estrazione degli impegni utilizza un passaggio LLM, quindi la sua abilitazione aggiunge
l'uso del modello in background dopo i turni idonei. Il passaggio è nascosto nella
conversazione visibile all'utente, ma può leggere lo scambio recente necessario per stabilire se
esiste un follow-up.

Gli impegni memorizzati fanno parte dello stato locale di OpenClaw. Sono memoria operativa, non
memoria a lungo termine. Disabilita la funzionalità con:

```bash
openclaw config set commitments.enabled false
```

## Risoluzione dei problemi

Se i follow-up previsti non vengono visualizzati:

- Verifica che `commitments.enabled` sia `true`.
- Controlla con `openclaw commitments --all` la presenza di record in sospeso, ignorati, posticipati o scaduti.
- Assicurati che Heartbeat sia in esecuzione per l'agente.
- Controlla se `commitments.maxPerDay` è già stato raggiunto per quella
  sessione dell'agente.
- Ricorda che i promemoria espliciti vengono ignorati dall'estrazione degli impegni e dovrebbero
  essere visualizzati invece nelle [attività pianificate](/it/automation/cron-jobs).

## Contenuti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Active Memory](/it/concepts/active-memory)
- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [`openclaw commitments`](/it/cli/commitments)
- [Riferimento della configurazione](/it/gateway/configuration-reference#commitments)
