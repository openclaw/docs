---
read_when:
    - Vuoi connettere OpenClaw a canali IRC o messaggi diretti
    - Stai configurando le liste di autorizzazione IRC, i criteri di gruppo o il controllo delle menzioni
summary: Configurazione del Plugin IRC, controlli di accesso e risoluzione dei problemi
title: IRC
x-i18n:
    generated_at: "2026-05-06T08:40:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7de49784dec1b6a21a5a65b298552c66ce82543e3f0a7075abedb442b4ebff7e
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC quando vuoi OpenClaw nei canali classici (`#room`) e nei messaggi diretti.
IRC viene distribuito come Plugin incluso, ma è configurato nella configurazione principale sotto `channels.irc`.

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

Preferisci un server IRC privato per il coordinamento del bot. Se usi intenzionalmente una rete IRC pubblica, le scelte comuni includono Libera.Chat, OFTC e Snoonet. Evita canali pubblici prevedibili per il traffico di backchannel di bot o swarm.

3. Avvia/riavvia il gateway:

```bash
openclaw gateway run
```

## Impostazioni di sicurezza predefinite

- IRC usa socket TCP/TLS grezzi al di fuori dell'instradamento tramite proxy forward gestito dall'operatore OpenClaw. Nelle distribuzioni che richiedono tutto il traffico in uscita attraverso quel proxy forward, imposta `channels.irc.enabled=false` a meno che l'uscita IRC diretta non sia approvata esplicitamente.
- `channels.irc.dmPolicy` ha come valore predefinito `"pairing"`.
- `channels.irc.groupPolicy` ha come valore predefinito `"allowlist"`.
- Con `groupPolicy="allowlist"`, imposta `channels.irc.groups` per definire i canali consentiti.
- Usa TLS (`channels.irc.tls=true`) a meno che tu non accetti intenzionalmente il trasporto in chiaro.

## Controllo degli accessi

Ci sono due "gate" separati per i canali IRC:

1. **Accesso al canale** (`groupPolicy` + `groups`): se il bot accetta messaggi da un canale.
2. **Accesso del mittente** (`groupAllowFrom` / `groups["#channel"].allowFrom` per canale): chi è autorizzato ad attivare il bot dentro quel canale.

Chiavi di configurazione:

- Allowlist DM (accesso del mittente DM): `channels.irc.allowFrom`
- Allowlist dei mittenti di gruppo (accesso del mittente nel canale): `channels.irc.groupAllowFrom`
- Controlli per canale (regole di canale + mittente + menzione): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` consente canali non configurati (**ancora soggetti al gate di menzione per impostazione predefinita**)

Le voci dell'allowlist devono usare identità mittente stabili (`nick!user@host`).
La corrispondenza solo per nick è mutabile ed è abilitata solo quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Errore comune: `allowFrom` è per i DM, non per i canali

Se vedi log come:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa che il mittente non era autorizzato per i messaggi **di gruppo/canale**. Risolvi in uno di questi modi:

- impostando `channels.irc.groupAllowFrom` (globale per tutti i canali), oppure
- impostando allowlist dei mittenti per canale: `channels.irc.groups["#channel"].allowFrom`

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

Anche se un canale è consentito (tramite `groupPolicy` + `groups`) e il mittente è autorizzato, OpenClaw applica per impostazione predefinita il **gate di menzione** nei contesti di gruppo.

Questo significa che potresti vedere log come `drop channel … (missing-mention)` a meno che il messaggio includa un pattern di menzione che corrisponde al bot.

Per fare in modo che il bot risponda in un canale IRC **senza richiedere una menzione**, disabilita il gate di menzione per quel canale:

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

Oppure, per consentire **tutti** i canali IRC (senza allowlist per canale) e rispondere comunque senza menzioni:

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

### Strumenti diversi per mittente (il proprietario ottiene più potere)

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

- Le chiavi `toolsBySender` devono usare `id:` per i valori di identità del mittente IRC:
  `id:eigen` o `id:eigen!~eigen@174.127.248.171` per una corrispondenza più forte.
- Le chiavi legacy senza prefisso sono ancora accettate e abbinate solo come `id:`.
- Vince la prima policy del mittente corrispondente; `"*"` è il fallback wildcard.

Per maggiori informazioni sull'accesso di gruppo rispetto al gate di menzione (e su come interagiscono), consulta: [/channels/groups](/it/channels/groups).

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

`IRC_HOST` non può essere impostato da un `.env` di workspace; consulta [file `.env` di workspace](/it/gateway/security).

## Risoluzione dei problemi

- Se il bot si connette ma non risponde mai nei canali, verifica `channels.irc.groups` **e** se il gate di menzione sta scartando i messaggi (`missing-mention`). Se vuoi che risponda senza ping, imposta `requireMention:false` per il canale.
- Se l'accesso fallisce, verifica la disponibilità del nick e la password del server.
- Se TLS fallisce su una rete personalizzata, verifica host/porta e la configurazione del certificato.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e gate di menzione
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
