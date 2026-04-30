---
read_when:
    - Vuoi spostare le risposte di una sessione attiva da Telegram a Discord, Slack, Mattermost o a un altro canale collegato
    - Stai configurando session.identityLinks per i messaggi diretti tra canali
    - Un comando /dock indica che il mittente non è collegato o che non esiste alcuna sessione attiva
summary: Sposta l'instradamento delle risposte di una sessione OpenClaw tra canali di chat collegati
title: Ancoraggio dei canali
x-i18n:
    generated_at: "2026-04-30T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Il docking del canale è l'inoltro delle chiamate per una sessione OpenClaw.

Mantiene lo stesso contesto della conversazione, ma cambia dove vengono recapitate
le risposte future per quella sessione.

## Esempio

Alice può inviare messaggi a OpenClaw su Telegram e Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Se Alice invia questo da Telegram:

```text
/dock_discord
```

OpenClaw mantiene il contesto della sessione corrente e cambia il percorso di risposta:

| Prima del docking             | Dopo `/dock_discord`       |
| ----------------------------- | -------------------------- |
| Le risposte vanno a Telegram `123` | Le risposte vanno a Discord `456` |

La sessione non viene ricreata. La cronologia della trascrizione resta associata alla
stessa sessione.

## Perché usarlo

Usa il docking quando un'attività inizia in un'app di chat ma le risposte successive devono arrivare
da qualche altra parte.

Flusso comune:

1. Avvia un'attività dell'agente da Telegram.
2. Passa a Discord, dove stai coordinando il lavoro.
3. Invia `/dock_discord` dalla sessione Telegram.
4. Mantieni la stessa sessione OpenClaw, ma ricevi le risposte future in Discord.

## Configurazione richiesta

Il docking richiede `session.identityLinks`. Il mittente sorgente e il peer di destinazione
devono essere nello stesso gruppo di identità:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

I valori sono ID peer con prefisso del canale:

| Valore         | Significato                  |
| -------------- | ---------------------------- |
| `telegram:123` | ID mittente Telegram `123`   |
| `discord:456`  | ID peer diretto Discord `456` |
| `slack:U123`   | ID utente Slack `U123`       |

La chiave canonica (`alice` sopra) è solo il nome del gruppo di identità condiviso. I comandi di dock
usano i valori con prefisso del canale per dimostrare che il mittente sorgente e
il peer di destinazione sono la stessa persona.

## Comandi

I comandi di dock sono generati dai Plugin di canale caricati che supportano i comandi
nativi. Comandi attualmente inclusi:

| Canale di destinazione | Comando            | Alias              |
| ---------------------- | ------------------ | ------------------ |
| Discord                | `/dock-discord`    | `/dock_discord`    |
| Mattermost             | `/dock-mattermost` | `/dock_mattermost` |
| Slack                  | `/dock-slack`      | `/dock_slack`      |
| Telegram               | `/dock-telegram`   | `/dock_telegram`   |

Gli alias con trattino basso sono utili sulle superfici di comando native come Telegram.

## Cosa cambia

Il docking aggiorna i campi di recapito della sessione attiva:

| Campo della sessione | Esempio dopo `/dock_discord`              |
| -------------------- | ----------------------------------------- |
| `lastChannel`        | `discord`                                 |
| `lastTo`             | `456`                                     |
| `lastAccountId`      | l'account del canale di destinazione, o `default` |

Questi campi vengono persistiti nello store della sessione e usati dal recapito
delle risposte successive per quella sessione.

## Cosa non cambia

Il docking non:

- crea account di canale
- connette un nuovo bot Discord, Telegram, Slack o Mattermost
- concede accesso a un utente
- aggira allowlist dei canali o criteri dei DM
- sposta la cronologia della trascrizione in un'altra sessione
- fa sì che utenti non correlati condividano una sessione

Cambia solo il percorso di recapito per la sessione corrente.

## Risoluzione dei problemi

**Il comando dice che il mittente non è collegato.**

Aggiungi sia il mittente corrente sia il peer di destinazione allo stesso gruppo
`session.identityLinks`. Ad esempio, se il mittente Telegram `123` deve fare il dock
verso il peer Discord `456`, includi sia `telegram:123` sia `discord:456`.

**Il comando dice che non esiste alcuna sessione attiva.**

Esegui il dock da una sessione di chat diretta esistente. Il comando ha bisogno di una voce di sessione
attiva per poter persistere il nuovo percorso.

**Le risposte continuano ad andare al vecchio canale.**

Controlla che il comando abbia risposto con un messaggio di successo e conferma che l'ID
del peer di destinazione corrisponda all'ID usato da quel canale. Il docking cambia solo il percorso
della sessione attiva; un'altra sessione potrebbe comunque instradare altrove.

**Devo tornare indietro.**

Invia il comando corrispondente per il canale originale, come `/dock_telegram` o
`/dock-telegram`, da un mittente collegato.
