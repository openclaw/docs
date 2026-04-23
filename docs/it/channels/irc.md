---
read_when:
    - Vuoi collegare OpenClaw a canali IRC o messaggi diretti
    - Stai configurando allowlist IRC, criteri di gruppo o il controllo delle menzioni
summary: Configurazione del plugin IRC, controlli di accesso e risoluzione dei problemi
title: IRC
x-i18n:
    generated_at: "2026-04-23T08:23:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Usa IRC quando vuoi OpenClaw in canali classici (`#room`) e messaggi diretti.
IRC è incluso come plugin bundled, ma viene configurato nella configurazione principale sotto `channels.irc`.

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

Preferisci un server IRC privato per il coordinamento del bot. Se usi intenzionalmente una rete IRC pubblica, alcune scelte comuni includono Libera.Chat, OFTC e Snoonet. Evita canali pubblici prevedibili per il traffico di backchannel del bot o dello swarm.

3. Avvia/riavvia il Gateway:

```bash
openclaw gateway run
```

## Impostazioni di sicurezza predefinite

- `channels.irc.dmPolicy` è impostato su `"pairing"` per impostazione predefinita.
- `channels.irc.groupPolicy` è impostato su `"allowlist"` per impostazione predefinita.
- Con `groupPolicy="allowlist"`, imposta `channels.irc.groups` per definire i canali consentiti.
- Usa TLS (`channels.irc.tls=true`) a meno che tu non voglia intenzionalmente accettare un trasporto in chiaro.

## Controllo di accesso

Esistono due “barriere” separate per i canali IRC:

1. **Accesso al canale** (`groupPolicy` + `groups`): se il bot accetta o meno messaggi da un canale.
2. **Accesso del mittente** (`groupAllowFrom` / `groups["#channel"].allowFrom` per canale): chi è autorizzato ad attivare il bot all’interno di quel canale.

Chiavi di configurazione:

- allowlist DM (accesso del mittente nei DM): `channels.irc.allowFrom`
- allowlist mittenti di gruppo (accesso del mittente nel canale): `channels.irc.groupAllowFrom`
- Controlli per canale (canale + mittente + regole di menzione): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` consente canali non configurati (**comunque soggetti per impostazione predefinita al controllo tramite menzioni**)

Le voci dell’allowlist dovrebbero usare identità mittente stabili (`nick!user@host`).
La corrispondenza sul solo nick è modificabile ed è abilitata solo quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Problema comune: `allowFrom` è per i DM, non per i canali

Se vedi log come:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa che il mittente non era autorizzato per i messaggi di **gruppo/canale**. Correggilo in uno di questi modi:

- impostando `channels.irc.groupAllowFrom` (globale per tutti i canali), oppure
- impostando allowlist mittenti per canale: `channels.irc.groups["#channel"].allowFrom`

Esempio (consenti a chiunque in `#tuirc-dev` di parlare con il bot):

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

Anche se un canale è consentito (tramite `groupPolicy` + `groups`) e il mittente è autorizzato, OpenClaw usa per impostazione predefinita il **controllo tramite menzioni** nei contesti di gruppo.

Questo significa che potresti vedere log come `drop channel … (missing-mention)` a meno che il messaggio non includa un pattern di menzione che corrisponde al bot.

Per fare in modo che il bot risponda in un canale IRC **senza richiedere una menzione**, disabilita il controllo tramite menzioni per quel canale:

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

## Nota di sicurezza (consigliata per canali pubblici)

Se consenti `allowFrom: ["*"]` in un canale pubblico, chiunque può inviare prompt al bot.
Per ridurre il rischio, limita gli strumenti per quel canale.

### Stessi strumenti per tutti nel canale

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

### Strumenti diversi per mittente (il proprietario ha più potere)

Usa `toolsBySender` per applicare una policy più restrittiva a `"*"` e una più permissiva al tuo nick:

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

- Le chiavi di `toolsBySender` dovrebbero usare `id:` per i valori di identità mittente IRC:
  `id:eigen` oppure `id:eigen!~eigen@174.127.248.171` per una corrispondenza più forte.
- Le chiavi legacy senza prefisso sono ancora accettate e confrontate solo come `id:`.
- La prima policy del mittente che corrisponde vince; `"*"` è il fallback jolly.

Per maggiori informazioni su accesso di gruppo e controllo tramite menzioni, e su come interagiscono, vedi: [/channels/groups](/it/channels/groups).

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

Registrazione facoltativa una tantum alla connessione:

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

Disabilita `register` dopo che il nick è stato registrato per evitare tentativi REGISTER ripetuti.

## Variabili d’ambiente

L’account predefinito supporta:

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

`IRC_HOST` non può essere impostato da un `.env` del workspace; vedi [file `.env` del workspace](/it/gateway/security).

## Risoluzione dei problemi

- Se il bot si connette ma non risponde mai nei canali, verifica `channels.irc.groups` **e** se il controllo tramite menzioni sta scartando i messaggi (`missing-mention`). Se vuoi che risponda senza ping, imposta `requireMention:false` per il canale.
- Se il login fallisce, verifica la disponibilità del nick e la password del server.
- Se TLS fallisce su una rete personalizzata, verifica host/porta e la configurazione del certificato.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
