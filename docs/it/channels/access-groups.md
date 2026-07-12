---
read_when:
    - Configurazione dello stesso elenco di autorizzazioni su più canali di messaggistica
    - Condivisione delle regole di accesso per i mittenti di messaggi diretti e gruppi
    - Revisione del controllo degli accessi ai canali di messaggistica
summary: Elenchi di mittenti consentiti riutilizzabili per i canali di messaggistica
title: Gruppi di accesso
x-i18n:
    generated_at: "2026-07-12T06:48:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

I gruppi di accesso sono elenchi denominati di mittenti che definisci una sola volta in `accessGroups` e richiami dalle liste consentite dei canali con `accessGroup:<name>`.

Usali quando le stesse persone devono essere autorizzate su più canali di messaggistica oppure quando un unico insieme attendibile deve essere applicato sia ai messaggi diretti sia all'autorizzazione dei mittenti nei gruppi.

Un gruppo, da solo, non concede nulla. Ha effetto solo quando un campo di una lista consentita vi fa riferimento.

## Gruppi statici di mittenti dei messaggi

I gruppi statici di mittenti usano `type: "message.senders"`. `members` è indicizzato per ID del canale di messaggistica, più `"*"` per le voci condivise da tutti i canali:

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

| Chiave                     | Significato                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `"*"`                      | Voci condivise verificate per ogni canale di messaggistica che fa riferimento al gruppo. |
| `discord`, `telegram`, ... | Voci verificate solo durante la corrispondenza con la lista consentita di quel canale. |

Le voci vengono confrontate usando le normali regole `allowFrom` del canale di destinazione. OpenClaw non converte gli ID dei mittenti tra i canali: se Alice ha un ID Telegram e un ID Discord, elenca entrambi gli ID sotto le chiavi dei canali corrispondenti.

## Riferimento ai gruppi dalle liste consentite

Fai riferimento a un gruppo con `accessGroup:<name>` ovunque il percorso del canale di messaggistica supporti liste consentite di mittenti.

Esempio di lista consentita per i messaggi diretti:

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

Esempio di lista consentita dei mittenti nei gruppi:

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
      groups: {
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

## Percorsi supportati dei canali di messaggistica

I gruppi di accesso funzionano nei percorsi condivisi di autorizzazione dei canali di messaggistica:

- liste consentite dei mittenti dei messaggi diretti, come `channels.<channel>.allowFrom`
- liste consentite dei mittenti nei gruppi, come `channels.<channel>.groupAllowFrom`
- liste consentite di mittenti specifiche per singola stanza del canale che usano le stesse regole di corrispondenza dei mittenti (ad esempio `groups.<space>.users` di Google Chat)
- percorsi di autorizzazione dei comandi che riutilizzano le liste consentite dei mittenti dei canali di messaggistica

Il supporto di un canale dipende dal suo collegamento agli helper condivisi di OpenClaw per l'autorizzazione dei mittenti. Il supporto incluso attualmente comprende ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo e Zalo Personal. I gruppi statici `message.senders` sono indipendenti dal canale, quindi i nuovi canali di messaggistica possono usarli tramite gli helper di ingresso condivisi dell'SDK dei Plugin, anziché implementare un'espansione personalizzata delle liste consentite.

## Destinatari dei canali Discord

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

`discord.channelAudience` significa «consenti i mittenti di messaggi diretti Discord che possono attualmente visualizzare questo canale del server». OpenClaw verifica il mittente tramite Discord al momento dell'autorizzazione e applica le regole dell'autorizzazione Discord `ViewChannel`. `membership` è facoltativo e il valore predefinito è `canViewChannel`.

Usalo quando un canale Discord è già la fonte attendibile per un team, come `#maintainers` o `#on-call`.

Requisiti e comportamento in caso di errore:

- Il bot deve avere accesso al server e al canale.
- Il bot deve disporre di **Server Members Intent** nel Discord Developer Portal.
- Il gruppo di accesso nega l'accesso in caso di errore quando Discord restituisce `Missing Access`, quando il mittente non può essere identificato come membro del server o quando il canale appartiene a un altro server.

Altri esempi specifici per Discord: [Controllo degli accessi di Discord](/it/channels/discord#access-control-and-routing)

## Diagnostica dei Plugin

Gli autori di Plugin possono esaminare lo stato strutturato dei gruppi di accesso senza espanderlo nuovamente in una lista consentita piatta:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Il risultato indica i gruppi referenziati, corrispondenti, mancanti, non supportati e non riusciti. Usalo per la diagnostica o per i test di conformità. Usa `expandAllowFromWithAccessGroups(...)` solo per i percorsi di compatibilità che richiedono ancora un array `allowFrom` piatto.

## Note sulla sicurezza

- I gruppi di accesso sono alias di liste consentite, non ruoli. Da soli non creano proprietari, non approvano richieste di associazione e non concedono autorizzazioni agli strumenti.
- `dmPolicy: "open"` richiede comunque `"*"` nella lista consentita effettiva dei messaggi diretti. Fare riferimento a un gruppo di accesso non equivale a concedere l'accesso pubblico.
- I nomi di gruppo mancanti negano l'accesso in caso di errore. Se `allowFrom` contiene `accessGroup:operators` e `accessGroups.operators` è assente, quella voce non autorizza nessuno.
- Mantieni stabili gli ID dei canali. Quando il canale supporta sia gli ID numerici/utente sia i nomi visualizzati, preferisci gli ID.

## Risoluzione dei problemi

Se un mittente dovrebbe corrispondere ma viene bloccato:

1. Verifica che il campo della lista consentita contenga il riferimento esatto `accessGroup:<name>`.
2. Verifica che `accessGroups.<name>.type` sia corretto.
3. Verifica che l'ID del mittente sia elencato sotto la chiave del canale corrispondente oppure sotto `"*"`.
4. Verifica che la voce usi la normale sintassi della lista consentita di quel canale.
5. Per i destinatari dei canali Discord, verifica che il bot possa vedere il canale del server e che **Server Members Intent** sia abilitato.

Esegui `openclaw doctor` dopo aver modificato la configurazione del controllo degli accessi. Rileva molte combinazioni non valide di liste consentite e criteri prima dell'esecuzione.
