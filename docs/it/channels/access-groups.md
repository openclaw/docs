---
read_when:
    - Configurazione della stessa lista consentita su più canali di messaggistica
    - Regole di accesso dei mittenti per la condivisione di DM e gruppi
    - Revisione del controllo di accesso ai canali di messaggistica
summary: Liste di mittenti consentiti riutilizzabili per i canali di messaggistica
title: Gruppi di accesso
x-i18n:
    generated_at: "2026-05-10T19:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
    postprocess_version: locale-links-v1
---

I gruppi di accesso sono elenchi di mittenti con nome che definisci una volta e a cui fai riferimento dagli allowlist dei canali con `accessGroup:<name>`.

Usali quando le stesse persone devono essere autorizzate su più canali di messaggistica, oppure quando un unico insieme attendibile deve applicarsi sia all'autorizzazione dei mittenti nei DM sia nei gruppi.

I gruppi di accesso non concedono accesso da soli. Un gruppo ha effetto solo quando un campo allowlist vi fa riferimento.

## Gruppi statici di mittenti di messaggi

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
| `discord`  | Voci controllate solo per la corrispondenza dell'allowlist di Discord.      |
| `telegram` | Voci controllate solo per la corrispondenza dell'allowlist di Telegram.     |
| `whatsapp` | Voci controllate solo per la corrispondenza dell'allowlist di WhatsApp.     |

Le voci vengono confrontate con le normali regole `allowFrom` del canale di destinazione. OpenClaw non traduce gli id dei mittenti tra canali. Se Alice ha un id Telegram e un id Discord, elenca entrambi gli id sotto le chiavi appropriate.

## Fare riferimento ai gruppi dagli allowlist

Fai riferimento a un gruppo con `accessGroup:<name>` ovunque il percorso del canale di messaggistica supporti gli allowlist dei mittenti.

Esempio di allowlist per DM:

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

Esempio di allowlist dei mittenti di gruppo:

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

I gruppi di accesso sono disponibili nei percorsi condivisi di autorizzazione dei canali di messaggistica, inclusi:

- allowlist dei mittenti DM come `channels.<channel>.allowFrom`
- allowlist dei mittenti di gruppo come `channels.<channel>.groupAllowFrom`
- allowlist dei mittenti per stanza specifici del canale che usano le stesse regole di corrispondenza dei mittenti
- percorsi di autorizzazione dei comandi che riutilizzano gli allowlist dei mittenti dei canali di messaggistica

Il supporto del canale dipende dal fatto che quel canale sia collegato agli helper condivisi di OpenClaw per l'autorizzazione dei mittenti. Il supporto integrato attuale include Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo e Zalo Personal. I gruppi statici `message.senders` sono progettati per essere indipendenti dal canale, quindi i nuovi canali di messaggistica dovrebbero supportarli usando gli helper condivisi dell'SDK Plugin invece di un'espansione allowlist personalizzata.

## Diagnostica dei Plugin

Gli autori di Plugin possono ispezionare lo stato strutturato dei gruppi di accesso senza riespanderlo in un allowlist piatto:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Il risultato riporta i gruppi referenziati, corrispondenti, mancanti, non supportati e non riusciti. Usalo quando hai bisogno di diagnostica o test di conformità. Usa `expandAllowFromWithAccessGroups(...)` solo per i percorsi di compatibilità che si aspettano ancora un array `allowFrom` piatto.

## Pubblico dei canali Discord

Discord supporta anche un tipo di gruppo di accesso dinamico:

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

`discord.channelAudience` significa "consenti i mittenti DM Discord che possono attualmente visualizzare questo canale della guild." OpenClaw risolve il mittente tramite Discord al momento dell'autorizzazione e applica le regole di autorizzazione Discord `ViewChannel`.

Usalo quando un canale Discord è già la fonte di verità per un team, come `#maintainers` o `#on-call`.

Requisiti e comportamento in caso di errore:

- Il bot ha bisogno di accesso alla guild e al canale.
- Il bot ha bisogno del **Server Members Intent** del Discord Developer Portal.
- Il gruppo di accesso fallisce in modo chiuso quando Discord restituisce `Missing Access`, il mittente non può essere risolto come membro della guild, oppure il canale appartiene a un'altra guild.

Altri esempi specifici per Discord: [controllo degli accessi Discord](/it/channels/discord#access-control-and-routing)

## Note di sicurezza

- I gruppi di accesso sono alias di allowlist, non ruoli. Non creano proprietari, non approvano richieste di associazione e non concedono permessi per gli strumenti da soli.
- `dmPolicy: "open"` richiede comunque `"*"` nell'allowlist DM effettivo. Fare riferimento a un gruppo di accesso non equivale ad accesso pubblico.
- I nomi di gruppo mancanti falliscono in modo chiuso. Se `allowFrom` contiene `accessGroup:operators` e `accessGroups.operators` è assente, quella voce non autorizza nessuno.
- Mantieni stabili gli id dei canali. Preferisci id numerici/utente ai nomi visualizzati quando il canale supporta entrambi.

## Risoluzione dei problemi

Se un mittente dovrebbe corrispondere ma viene bloccato:

1. Conferma che il campo allowlist contenga il riferimento esatto `accessGroup:<name>`.
2. Conferma che `accessGroups.<name>.type` sia corretto.
3. Conferma che l'id del mittente sia elencato sotto la chiave del canale corrispondente, oppure sotto `"*"`.
4. Conferma che la voce usi la normale sintassi allowlist di quel canale.
5. Per il pubblico dei canali Discord, conferma che il bot possa vedere il canale della guild e che Server Members Intent sia abilitato.

Esegui `openclaw doctor` dopo aver modificato la configurazione del controllo degli accessi. Rileva molte combinazioni non valide di allowlist e criteri prima del runtime.
