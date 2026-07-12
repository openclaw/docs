---
read_when:
    - Vuoi connettere OpenClaw a un'area di lavoro Raft
    - Stai configurando un agente esterno Raft
    - Stai eseguendo il debug della consegna del risveglio di Raft
sidebarTitle: Raft
summary: Supporto per Raft External Agent tramite il bridge di riattivazione della CLI Raft
title: Raft
x-i18n:
    generated_at: "2026-07-12T06:51:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft connette un agente OpenClaw a un agente esterno Raft tramite la CLI Raft
locale. Raft invia al Gateway notifiche di riattivazione autenticate; l'agente
usa quindi la CLI Raft per controllare e inviare messaggi. Solo chat dirette
(nessun gruppo).

## Installazione

Raft è un plugin esterno ufficiale. Installalo sull'host del Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Dettagli: [Plugin](/it/tools/plugin)

## Prerequisiti

- Uno spazio di lavoro Raft con un agente esterno.
- La CLI Raft installata sullo stesso host del Gateway OpenClaw e disponibile
  nel `PATH` del servizio.
- Un profilo della CLI Raft con accesso già effettuato e associato a tale
  agente esterno.

Il plugin non memorizza le credenziali Raft; la CLI Raft conserva
l'autenticazione nel proprio profilo.

## Configurazione

Imposta il profilo nella configurazione:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Per l'account predefinito, puoi invece impostare `RAFT_PROFILE` nell'ambiente
del Gateway:

```bash
RAFT_PROFILE=openclaw
```

Usa un account denominato quando un Gateway si connette a più di un agente esterno Raft:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

La configurazione interattiva registra lo stesso profilo:

```bash
openclaw channels add --channel raft
```

## Funzionamento

All'avvio del Gateway, il plugin:

1. Apre un endpoint HTTP di riattivazione accessibile solo tramite local loopback su una porta temporanea.
2. Avvia `raft --profile <profile> agent bridge` con tale endpoint e un token
   specifico per il processo.
3. Accetta dal bridge locale esclusivamente notifiche di riattivazione autenticate,
   prive di contenuto e dotate di un'identità anti-replay.
4. Richiede uno tra `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` o `id` in ogni payload di riattivazione.
5. Deduplica per 24 ore i tentativi ripetuti di consegna delle notifiche di
   riattivazione in base all'ID evento del bridge, anche tra riavvii del Gateway.
6. Restituisce una sessione di runtime stabile per il bridge corrente e un
   batch vuoto per lo scaricamento delle attività del protocollo CLI Raft.
7. Avvia un turno serializzato dell'agente OpenClaw per ogni riattivazione accettata.

Il bridge gestisce i nuovi tentativi di consegna e le riconnessioni di Raft. Il
turno di OpenClaw riceve solo una notifica di riattivazione, non una copia del
corpo del messaggio Raft. Usa la CLI per leggere i messaggi in sospeso e
inviare la risposta:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft non è un trasporto di messaggi push. OpenClaw non invia automaticamente il testo finale del modello tramite il bridge, quindi l'agente deve usare la CLI Raft dopo aver elaborato una riattivazione.
</Note>

## Verifica

Controlla che OpenClaw riesca a trovare la CLI e disponga di un profilo configurato:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Invia quindi un messaggio all'agente esterno Raft. Il log del Gateway dovrebbe
mostrare l'avvio del bridge Raft, seguito da una riattivazione in ingresso.
L'agente dovrebbe usare il profilo Raft configurato per controllare i messaggi
in sospeso.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="La CLI Raft non è disponibile">
    Installa la CLI Raft sull'host del Gateway e rendi `raft` disponibile nel
    `PATH` del servizio. Verificala con `raft --help`, quindi riavvia il Gateway.
  </Accordion>
  <Accordion title="Il bridge termina immediatamente">
    Verifica che nel profilo configurato sia stato effettuato l'accesso e che
    appartenga all'agente esterno Raft previsto. Esegui direttamente
    `raft --profile <profile> agent bridge` per visualizzare la diagnostica
    della CLI.
  </Accordion>
  <Accordion title="Arriva una riattivazione, ma non viene inviata alcuna risposta Raft">
    Questo comportamento è previsto quando l'agente non richiama la CLI Raft.
    Il bridge di riattivazione non trasporta i corpi dei messaggi né le risposte
    finali automatiche. Controlla i criteri di utilizzo degli strumenti
    dell'agente e assicurati che possa eseguire `raft --profile <profile>
    message check` e `message send`.
  </Accordion>
</AccordionGroup>

## Riferimenti

- [Raft](https://raft.build/)
- [Documentazione di Raft](https://docs.raft.build/welcome/)
- [Integrazione di Raft con Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
