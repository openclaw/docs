---
read_when:
    - Vuoi connettere OpenClaw a uno spazio di lavoro Raft
    - Stai configurando un agente esterno Raft
    - Stai eseguendo il debug della consegna del risveglio Raft
sidebarTitle: Raft
summary: Supporto per Raft External Agent tramite il bridge di risveglio della CLI Raft
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:13:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Il supporto Raft collega un agente OpenClaw a un agente esterno Raft tramite la CLI
Raft locale. Raft invia segnali di risveglio autenticati al Gateway. L'agente quindi usa
la CLI Raft per controllare e inviare messaggi.

## Installazione

Raft è un Plugin esterno ufficiale. Installalo sull'host del Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Dettagli: [Plugin](/it/tools/plugin)

## Prerequisiti

- Un workspace Raft con un agente esterno.
- La CLI Raft installata sullo stesso host del Gateway OpenClaw.
- Un profilo della CLI Raft che ha già effettuato l'accesso ed è associato a quell'agente esterno.

Il Plugin non memorizza le credenziali Raft. La CLI Raft conserva tale autenticazione
nel proprio profilo.

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

Per l'account predefinito, puoi invece impostare `RAFT_PROFILE` nell'ambiente del
Gateway:

```bash
RAFT_PROFILE=openclaw
```

Usa un account con nome quando un Gateway si collega a più di un agente esterno Raft:

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

Il flusso di configurazione interattiva registra lo stesso profilo:

```bash
openclaw channels setup raft
```

## Come funziona

Quando il Gateway si avvia, il Plugin:

1. Apre un endpoint HTTP di risveglio solo loopback su una porta effimera.
2. Avvia `raft --profile <profile> agent bridge` con quell'endpoint e un
   token per processo.
3. Accetta solo segnali di risveglio autenticati, senza contenuto e con un'identità di replay dal bridge locale.
4. Richiede uno tra `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` o `id`.
5. Deduplica le consegne di risveglio recenti ritentate in base all'id evento del bridge, anche tra riavvii del Gateway.
6. Restituisce una sessione runtime stabile per il bridge corrente e un batch di svuotamento attività vuoto per il protocollo della CLI Raft.
7. Avvia un turno serializzato dell'agente OpenClaw per ogni risveglio accettato.

Il bridge gestisce i nuovi tentativi di consegna e le riconnessioni di Raft. Il turno OpenClaw riceve
solo una notifica di risveglio, non una copia del corpo del messaggio Raft. Usa la CLI per leggere
i messaggi in sospeso e per inviare la propria risposta:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft non è un normale trasporto per messaggi push. OpenClaw non invia automaticamente
il testo finale del modello tramite il bridge, quindi l'agente deve usare la
CLI Raft dopo aver elaborato un risveglio.
</Note>

## Verifica

Controlla che OpenClaw riesca a trovare la CLI e abbia un profilo configurato:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Poi invia un messaggio all'agente esterno Raft. Il log del Gateway dovrebbe mostrare
l'avvio del bridge Raft, seguito da un risveglio in ingresso. L'agente dovrebbe usare il
profilo Raft configurato per controllare i messaggi in sospeso.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="La CLI Raft è mancante">
    Installa la CLI Raft sull'host del Gateway e rendi `raft` disponibile nel
    `PATH` del servizio. Verificala con `raft --help`, quindi riavvia il Gateway.
  </Accordion>
  <Accordion title="Il bridge termina immediatamente">
    Verifica che il profilo configurato abbia effettuato l'accesso e appartenga
    all'agente esterno Raft previsto. Esegui direttamente `raft --profile <profile> agent bridge`
    per vedere la diagnostica della CLI.
  </Accordion>
  <Accordion title="Arriva un risveglio ma non viene inviata alcuna risposta Raft">
    Questo è previsto quando l'agente non invoca la CLI Raft. Il bridge di risveglio
    non trasporta corpi dei messaggi né risposte finali automatiche. Controlla la
    policy degli strumenti dell'agente e assicurati che possa eseguire `raft --profile <profile> message
    check` e `message send`.
  </Accordion>
</AccordionGroup>

## Riferimenti

- [Raft](https://raft.build/)
- [Documentazione Raft](https://docs.raft.build/welcome/)
- [Integrazione Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
