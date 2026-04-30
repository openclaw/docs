---
read_when:
    - Vuoi che OpenClaw ricordi le richieste successive naturali
    - Vuoi capire in che modo i check-in inferiti differiscono dai promemoria
    - Vuoi esaminare o archiviare gli impegni successivi
sidebarTitle: Commitments
summary: Memoria di seguito dedotta per verifiche che non sono promemoria esatti
title: Impegni dedotti
x-i18n:
    generated_at: "2026-04-30T08:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Gli impegni sono memorie di follow-up di breve durata. Quando sono abilitati, OpenClaw può
notare che una conversazione ha creato un'opportunità di ricontatto futura e ricordarsi
di riprenderla più tardi.

Esempi:

- Menzioni un colloquio domani. OpenClaw potrebbe ricontrollare dopo.
- Dici di essere esausto. OpenClaw potrebbe chiederti più tardi se hai dormito.
- L'agente dice che darà seguito dopo che qualcosa cambia. OpenClaw potrebbe tracciare
  quel ciclo aperto.

Gli impegni non sono fatti durevoli come `MEMORY.md` e non sono promemoria
esatti. Si collocano tra memoria e automazione: OpenClaw ricorda un
obbligo legato alla conversazione, poi Heartbeat lo consegna quando è il momento.

## Abilitare gli impegni

Gli impegni sono disattivati per impostazione predefinita. Abilitali nella configurazione:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

`openclaw.json` equivalente:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limita quanti follow-up inferiti possono essere consegnati
per sessione agente in un giorno mobile. Il valore predefinito è `3`.

## Come funziona

Dopo una risposta dell'agente, OpenClaw può eseguire un passaggio nascosto di estrazione in background in un
contesto separato. Quel passaggio cerca solo impegni di follow-up inferiti. Non
scrive nella conversazione visibile e non chiede all'agente principale
di ragionare sull'estrazione.

Quando trova un candidato ad alta affidabilità, OpenClaw memorizza un impegno con:

- l'id dell'agente
- la chiave di sessione
- il canale originale e la destinazione di consegna
- una finestra di scadenza
- un breve ricontrollo suggerito
- contesto sorgente sufficiente perché Heartbeat decida se inviarlo

La consegna avviene tramite Heartbeat. Quando un impegno arriva a scadenza, Heartbeat
aggiunge l'impegno al turno Heartbeat per lo stesso agente e ambito di canale.
Il modello può inviare un ricontrollo naturale o rispondere `HEARTBEAT_OK` per ignorarlo.

OpenClaw non consegna mai un impegno inferito subito dopo averlo scritto.
L'ora di scadenza viene limitata ad almeno un intervallo Heartbeat dopo la creazione
dell'impegno, quindi il follow-up non può riecheggiare nello stesso momento in cui è stato
inferito.

## Ambito

Gli impegni sono limitati al contesto esatto dell'agente e del canale in cui sono stati
creati. Un follow-up inferito mentre si parla con un agente in Discord non viene
consegnato da un altro agente, un altro canale o una sessione non correlata.

Questo ambito fa parte della funzionalità. I ricontrolli naturali dovrebbero sembrare la continuazione
della stessa conversazione, non un sistema globale di promemoria.

## Impegni e promemoria

| Esigenza                                       | Usa                                      |
| --------------------------------------------- | ---------------------------------------- |
| "Ricordami alle 15:00"                        | [Attività pianificate](/it/automation/cron-jobs) |
| "Avvisami tra 20 minuti"                      | [Attività pianificate](/it/automation/cron-jobs) |
| "Esegui questo report ogni giorno feriale"    | [Attività pianificate](/it/automation/cron-jobs) |
| "Ho un colloquio domani"                      | Impegni                                  |
| "Sono rimasto sveglio tutta la notte"         | Impegni                                  |
| "Dai seguito se non rispondo a questo thread aperto" | Impegni                          |

Le richieste esatte dell'utente appartengono già al percorso dello scheduler. Gli impegni sono solo
per follow-up inferiti: i momenti in cui l'utente non ha chiesto un promemoria,
ma la conversazione ha chiaramente creato un ricontrollo futuro utile.

## Gestire gli impegni

Usa la CLI per ispezionare e cancellare gli impegni memorizzati:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulta [`openclaw commitments`](/it/cli/commitments) per il riferimento del comando.

## Privacy e costo

L'estrazione degli impegni usa un passaggio LLM, quindi abilitarla aggiunge utilizzo del modello
in background dopo i turni idonei. Il passaggio è nascosto dalla conversazione
visibile all'utente, ma può leggere lo scambio recente necessario per decidere se
esiste un follow-up.

Gli impegni memorizzati sono stato locale di OpenClaw. Sono memoria operativa, non
memoria a lungo termine. Disabilita la funzionalità con:

```bash
openclaw config set commitments.enabled false
```

## Risoluzione dei problemi

Se i follow-up previsti non compaiono:

- Conferma che `commitments.enabled` sia `true`.
- Controlla `openclaw commitments --all` per record in sospeso, ignorati, posticipati o scaduti.
- Assicurati che Heartbeat sia in esecuzione per l'agente.
- Verifica se `commitments.maxPerDay` è già stato raggiunto per quella
  sessione agente.
- Ricorda che i promemoria esatti vengono saltati dall'estrazione degli impegni e dovrebbero
  comparire invece sotto [attività pianificate](/it/automation/cron-jobs).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Active Memory](/it/concepts/active-memory)
- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [`openclaw commitments`](/it/cli/commitments)
- [Riferimento di configurazione](/it/gateway/configuration-reference#commitments)
