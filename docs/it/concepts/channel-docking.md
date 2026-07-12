---
read_when:
    - Vuoi che le risposte di una sessione attiva vengano trasferite da Telegram a Discord, Slack, Mattermost o a un altro canale collegato
    - Stai configurando session.identityLinks per i messaggi diretti tra canali diversi
    - Un comando /dock indica che il mittente non è collegato o che non esiste alcuna sessione attiva
summary: Sposta il percorso di risposta di una sessione OpenClaw tra canali di chat collegati
title: Docking del canale
x-i18n:
    generated_at: "2026-07-12T06:59:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Il docking dei canali è l'inoltro delle chiamate per una sessione OpenClaw. Mantiene lo stesso
contesto della conversazione, ma cambia la destinazione delle risposte future per quella sessione.
Il docking funziona solo da una chat diretta; non può essere eseguito da una chat
di gruppo.

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

Se Alice invia questo comando da una chat diretta di Telegram:

```text
/dock_discord
```

OpenClaw mantiene il contesto della sessione corrente e cambia il percorso delle risposte:

| Prima del docking                    | Dopo `/dock_discord`                  |
| ------------------------------------ | ------------------------------------- |
| Le risposte vanno a Telegram `123`   | Le risposte vanno a Discord `456`     |

La sessione non viene ricreata. La cronologia della trascrizione rimane associata alla
stessa sessione.

## Perché usarlo

Usa il docking quando un'attività inizia in un'app di chat, ma le risposte successive devono arrivare
altrove.

Flusso comune:

1. Avvia un'attività dell'agente da Telegram.
2. Passa a Discord, dove stai coordinando il lavoro.
3. Invia `/dock_discord` dalla chat diretta di Telegram.
4. Mantieni la stessa sessione OpenClaw, ma ricevi le risposte future su Discord.

## Configurazione obbligatoria

Il docking richiede `session.identityLinks`. Il mittente di origine e l'interlocutore di destinazione
devono appartenere allo stesso gruppo di identità:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

I valori sono ID degli interlocutori con il prefisso del canale:

| Valore         | Significato                            |
| -------------- | -------------------------------------- |
| `telegram:123` | ID mittente Telegram `123`             |
| `discord:456`  | ID interlocutore diretto Discord `456` |
| `slack:U123`   | ID utente Slack `U123`                 |

La chiave canonica (`alice` nell'esempio) è solo il nome del gruppo di identità condiviso. I comandi
di docking usano i valori con il prefisso del canale per verificare che il mittente di origine e
l'interlocutore di destinazione siano la stessa persona.

## Comandi

OpenClaw genera un comando `/dock-<channel>` per ogni Plugin di canale caricato
che supporta i comandi nativi, quindi l'elenco aumenta man mano che vengono aggiunti Plugin. I Plugin
inclusi che attualmente lo supportano sono:

| Canale di destinazione | Comando            | Alias              |
| ---------------------- | ------------------ | ------------------ |
| Discord                | `/dock-discord`    | `/dock_discord`    |
| Mattermost             | `/dock-mattermost` | `/dock_mattermost` |
| Slack                  | `/dock-slack`      | `/dock_slack`      |
| Telegram               | `/dock-telegram`   | `/dock_telegram`   |

La forma con il trattino basso è anche il nome del comando nativo sulle piattaforme come Telegram
che espongono direttamente i comandi slash.

## Cosa cambia

Il docking aggiorna i campi di consegna della sessione attiva:

| Campo della sessione | Esempio dopo `/dock_discord`                 |
| -------------------- | -------------------------------------------- |
| `lastChannel`        | `discord`                                    |
| `lastTo`             | `456`                                        |
| `lastAccountId`      | l'account del canale di destinazione o `default` |

Questi campi vengono salvati nell'archivio delle sessioni e usati per la consegna
delle risposte successive di quella sessione.

## Cosa non cambia

Il docking non:

- crea account dei canali
- connette un nuovo bot Discord, Telegram, Slack o Mattermost
- concede l'accesso a un utente
- aggira gli elenchi di elementi consentiti dei canali o le politiche sui messaggi diretti
- sposta la cronologia della trascrizione in un'altra sessione
- fa condividere una sessione a utenti non correlati

Cambia solo il percorso di consegna della sessione corrente.

## Risoluzione dei problemi

**Il comando indica che il mittente non è collegato.**

Aggiungi sia il mittente corrente sia l'interlocutore di destinazione allo stesso gruppo
`session.identityLinks`. Ad esempio, se il mittente Telegram `123` deve effettuare il docking
verso l'interlocutore Discord `456`, includi sia `telegram:123` sia `discord:456`.

**Il comando indica che il docking è disponibile solo dalle chat dirette.**

Invia il comando di docking da una chat diretta con OpenClaw, non da una chat di gruppo.

**Il comando indica che non esiste alcuna sessione attiva.**

Esegui il docking da una sessione di chat diretta esistente. Il comando richiede una voce di sessione
attiva per poter salvare il nuovo percorso.

**Le risposte continuano ad arrivare al vecchio canale.**

Verifica che il comando abbia risposto con un messaggio di conferma e assicurati che l'ID
dell'interlocutore di destinazione corrisponda all'ID usato da quel canale. Il docking cambia solo il
percorso della sessione attiva; un'altra sessione potrebbe continuare a instradare le risposte altrove.

**Devo tornare al canale precedente.**

Invia il comando corrispondente al canale originale, ad esempio `/dock_telegram` o
`/dock-telegram`, da un mittente collegato.
