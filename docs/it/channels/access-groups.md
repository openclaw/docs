---
read_when:
    - Configurare lo stesso elenco di elementi consentiti su più canali di messaggistica
    - Condivisione delle regole di accesso dei mittenti per messaggi diretti e gruppi
    - Revisione del controllo di accesso ai canali di messaggistica
summary: Liste di mittenti consentiti riutilizzabili per i canali di messaggistica
title: Gruppi di accesso
x-i18n:
    generated_at: "2026-05-02T08:15:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

I gruppi di accesso sono elenchi di mittenti denominati che definisci una sola volta e a cui fai riferimento dagli elenchi consentiti dei canali con `accessGroup:<name>`.

Usali quando le stesse persone devono essere autorizzate su diversi canali di messaggistica, oppure quando un insieme attendibile deve valere sia per l'autorizzazione dei mittenti nei DM sia nei gruppi.

I gruppi di accesso non concedono accesso da soli. Un gruppo ha effetto solo quando un campo di elenco consentiti vi fa riferimento.

## Gruppi statici di mittenti dei messaggi

I gruppi statici di mittenti usano `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Gli elenchi dei membri sono indicizzati per id del canale di messaggistica:

| Chiave     | Significato                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `"*"`      | Voci condivise controllate per ogni canale di messaggistica che fa riferimento al gruppo. |
| `discord`  | Voci controllate solo per la corrispondenza dell'elenco consentiti di Discord. |
| `telegram` | Voci controllate solo per la corrispondenza dell'elenco consentiti di Telegram. |
| `whatsapp` | Voci controllate solo per la corrispondenza dell'elenco consentiti di WhatsApp. |

Le voci vengono confrontate con le normali regole `allowFrom` del canale di destinazione. OpenClaw non traduce gli id dei mittenti tra canali. Se Alice ha un id Telegram e un id Discord, elenca entrambi gli id sotto le chiavi appropriate.

## Fare riferimento ai gruppi dagli elenchi consentiti

Fai riferimento a un gruppo con `accessGroup:<name>` ovunque il percorso del canale di messaggistica supporti elenchi di mittenti consentiti.

Esempio di elenco consentiti per DM:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Esempio di elenco consentiti per mittenti di gruppo:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Puoi combinare gruppi e voci dirette:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Percorsi dei canali di messaggistica supportati

I gruppi di accesso sono disponibili nei percorsi condivisi di autorizzazione dei canali di messaggistica, tra cui:

- liste consentite dei mittenti DM come `channels.<channel>.allowFrom`
- liste consentite dei mittenti di gruppo come `channels.<channel>.groupAllowFrom`
- liste consentite dei mittenti per stanza, specifiche del canale, che usano le stesse regole di corrispondenza dei mittenti
- percorsi di autorizzazione dei comandi che riutilizzano le liste consentite dei mittenti dei canali di messaggistica

Il supporto dei canali dipende dal fatto che quel canale sia collegato agli helper condivisi di OpenClaw per l'autorizzazione dei mittenti. Il supporto attualmente incluso comprende Discord, Google Chat, Nostr, WhatsApp, Zalo e Zalo Personal. I gruppi statici `message.senders` sono progettati per essere indipendenti dal canale, quindi i nuovi canali di messaggistica dovrebbero supportarli usando gli helper condivisi del Plugin SDK invece dell'espansione personalizzata delle liste consentite.

## Pubblici dei canali Discord

Discord supporta anche un tipo dinamico di gruppo di accesso:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` significa "consenti i mittenti DM Discord che attualmente possono visualizzare questo canale del server." OpenClaw risolve il mittente tramite Discord al momento dell'autorizzazione e applica le regole di autorizzazione `ViewChannel` di Discord.

Usalo quando un canale Discord è già la fonte autorevole per un team, come `#maintainers` o `#on-call`.

Requisiti e comportamento in caso di errore:

- Il bot deve avere accesso al server e al canale.
- Il bot deve avere **Server Members Intent** abilitato nel Discord Developer Portal.
- Il gruppo di accesso non autorizza l'accesso quando Discord restituisce `Missing Access`, il mittente non può essere risolto come membro del server oppure il canale appartiene a un altro server.

Altri esempi specifici per Discord: [Controllo degli accessi Discord](/it/channels/discord#access-control-and-routing)

## Note sulla sicurezza

- I gruppi di accesso sono alias di liste consentite, non ruoli. Da soli non creano proprietari, non approvano richieste di abbinamento e non concedono permessi sugli strumenti.
- `dmPolicy: "open"` richiede comunque `"*"` nella lista consentita DM effettiva. Fare riferimento a un gruppo di accesso non equivale ad accesso pubblico.
- I nomi di gruppo mancanti non autorizzano l'accesso. Se `allowFrom` contiene `accessGroup:operators` e `accessGroups.operators` è assente, quella voce non autorizza nessuno.
- Mantieni stabili gli ID dei canali. Preferisci ID numerici/utente ai nomi visualizzati quando il canale supporta entrambi.

## Risoluzione dei problemi

Se un mittente dovrebbe corrispondere ma viene bloccato:

1. Conferma che il campo della lista consentita contenga il riferimento esatto `accessGroup:<name>`.
2. Conferma che `accessGroups.<name>.type` sia corretto.
3. Conferma che l'ID del mittente sia elencato sotto la chiave del canale corrispondente, oppure sotto `"*"`.
4. Conferma che la voce usi la normale sintassi della lista consentita di quel canale.
5. Per i pubblici dei canali Discord, conferma che il bot possa vedere il canale del server e che Server Members Intent sia abilitato.

Esegui `openclaw doctor` dopo aver modificato la configurazione del controllo degli accessi. Rileva molte combinazioni non valide di liste consentite e policy prima del runtime.
