---
read_when:
    - Vuoi collegare OpenClaw a canali IRC o DM
    - Stai configurando allowlist IRC, criteri di gruppo o gating per menzioni
summary: Configurazione del plugin IRC, controlli di accesso e risoluzione dei problemi
title: IRC
x-i18n:
    generated_at: "2026-04-05T13:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Usa IRC quando vuoi OpenClaw nei canali classici (`#room`) e nei messaggi diretti.
IRC viene distribuito come plugin di estensione, ma si configura nella configurazione principale sotto `channels.irc`.

## Avvio rapido

1. Abilita la configurazione IRC in `~/.openclaw/openclaw.json`.
2. Imposta almeno:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Preferisci un server IRC privato per il coordinamento del bot. Se usi intenzionalmente una rete IRC pubblica, tra le scelte comuni ci sono Libera.Chat, OFTC e Snoonet. Evita canali pubblici prevedibili per il traffico di backchannel di bot o swarm.

3. Avvia/riavvia il gateway:

```bash
openclaw gateway run
```

## Impostazioni predefinite di sicurezza

- `channels.irc.dmPolicy` è predefinito su `"pairing"`.
- `channels.irc.groupPolicy` è predefinito su `"allowlist"`.
- Con `groupPolicy="allowlist"`, imposta `channels.irc.groups` per definire i canali consentiti.
- Usa TLS (`channels.irc.tls=true`) a meno che tu non accetti intenzionalmente il trasporto in chiaro.

## Controllo degli accessi

Per i canali IRC esistono due “gate” separati:

1. **Accesso al canale** (`groupPolicy` + `groups`): se il bot accetta o meno messaggi da un canale.
2. **Accesso del mittente** (`groupAllowFrom` / `groups["#channel"].allowFrom` per canale): chi è autorizzato ad attivare il bot all'interno di quel canale.

Chiavi di configurazione:

- Allowlist DM (accesso del mittente nei DM): `channels.irc.allowFrom`
- Allowlist del mittente di gruppo (accesso del mittente nel canale): `channels.irc.groupAllowFrom`
- Controlli per canale (canale + mittente + regole per menzioni): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` consente canali non configurati (**ancora soggetti al gating per menzioni per impostazione predefinita**)

Le voci dell'allowlist dovrebbero usare identità mittente stabili (`nick!user@host`).
La corrispondenza sul solo nick è modificabile ed è abilitata solo quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Problema comune: `allowFrom` è per i DM, non per i canali

Se vedi log come:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…significa che il mittente non era autorizzato per i messaggi di **gruppo/canale**. Correggi in uno di questi modi:

- impostando `channels.irc.groupAllowFrom` (globale per tutti i canali), oppure
- impostando allowlist dei mittenti per canale: `channels.irc.groups["#channel"].allowFrom`

Esempio (consentire a chiunque in `#tuirc-dev` di parlare con il bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Attivazione delle risposte (menzioni)

Anche se un canale è consentito (tramite `groupPolicy` + `groups`) e il mittente è autorizzato, OpenClaw usa per impostazione predefinita il **gating per menzioni** nei contesti di gruppo.

Ciò significa che potresti vedere log come `drop channel … (missing-mention)` a meno che il messaggio non includa un pattern di menzione che corrisponde al bot.

Per fare in modo che il bot risponda in un canale IRC **senza richiedere una menzione**, disabilita il gating per menzioni per quel canale:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Oppure, per consentire **tutti** i canali IRC (senza allowlist per canale) e continuare a rispondere senza menzioni:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Nota sulla sicurezza (consigliata per i canali pubblici)

Se consenti `allowFrom: ["*"]` in un canale pubblico, chiunque può interagire con il bot.
Per ridurre il rischio, limita i tool per quel canale.

### Stessi tool per tutti nel canale

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Tool diversi per mittente (il proprietario ha più potere)

Usa `toolsBySender` per applicare un criterio più restrittivo a `"*"` e uno meno restrittivo al tuo nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Note:

- Le chiavi `toolsBySender` dovrebbero usare `id:` per i valori di identità del mittente IRC:
  `id:eigen` oppure `id:eigen!~eigen@174.127.248.171` per una corrispondenza più forte.
- Le chiavi legacy senza prefisso sono ancora accettate e corrispondono solo come `id:`.
- Il primo criterio del mittente che corrisponde ha la precedenza; `"*"` è il fallback jolly.

Per maggiori informazioni su accesso ai gruppi e gating per menzioni (e su come interagiscono), vedi: [/channels/groups](/channels/groups).

## NickServ

Per identificarti con NickServ dopo la connessione:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Registrazione opzionale una tantum alla connessione:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Disabilita `register` dopo che il nick è stato registrato per evitare tentativi ripetuti di REGISTER.

## Variabili d'ambiente

L'account predefinito supporta:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separati da virgole)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Risoluzione dei problemi

- Se il bot si connette ma non risponde mai nei canali, verifica `channels.irc.groups` **e** se il gating per menzioni sta scartando i messaggi (`missing-mention`). Se vuoi che risponda senza chiamate, imposta `requireMention:false` per il canale.
- Se l'accesso fallisce, verifica la disponibilità del nick e la password del server.
- Se TLS fallisce su una rete personalizzata, verifica host/porta e la configurazione del certificato.

## Correlati

- [Panoramica dei canali](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/channels/groups) — comportamento della chat di gruppo e gating per menzioni
- [Instradamento dei canali](/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
