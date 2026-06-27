---
read_when:
    - Vuoi connettere OpenClaw a canali IRC o DM
    - Stai configurando liste consentite IRC, criteri di gruppo o gating delle menzioni
summary: Configurazione, controlli di accesso e risoluzione dei problemi del Plugin IRC
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:11:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC quando vuoi OpenClaw nei canali classici (`#room`) e nei messaggi diretti.
Installa il Plugin IRC ufficiale, quindi configuralo in `channels.irc`.

## Avvio rapido

1. Installa il Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Abilita la configurazione IRC in `~/.openclaw/openclaw.json`.
3. Imposta almeno:

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

Preferisci un server IRC privato per il coordinamento dei bot. Se usi intenzionalmente una rete IRC pubblica, le scelte comuni includono Libera.Chat, OFTC e Snoonet. Evita canali pubblici prevedibili per il traffico di backchannel di bot o swarm.

4. Avvia/riavvia il Gateway:

```bash
openclaw gateway run
```

## Impostazioni di sicurezza predefinite

- IRC usa socket TCP/TLS grezzi al di fuori dell’instradamento tramite proxy forward gestito dagli operatori OpenClaw. Nelle distribuzioni che richiedono tutto il traffico in uscita tramite quel proxy forward, imposta `channels.irc.enabled=false` a meno che l’uscita IRC diretta non sia approvata esplicitamente.
- `channels.irc.dmPolicy` ha come valore predefinito `"pairing"`.
- `channels.irc.groupPolicy` ha come valore predefinito `"allowlist"`.
- Con `groupPolicy="allowlist"`, imposta `channels.irc.groups` per definire i canali consentiti.
- Usa TLS (`channels.irc.tls=true`) a meno che tu non accetti intenzionalmente il trasporto in chiaro.

## Controllo degli accessi

Ci sono due "gate" separati per i canali IRC:

1. **Accesso al canale** (`groupPolicy` + `groups`): se il bot accetta o meno messaggi da un canale.
2. **Accesso del mittente** (`groupAllowFrom` / `groups["#channel"].allowFrom` per canale): chi è autorizzato ad attivare il bot all’interno di quel canale.

Chiavi di configurazione:

- Lista consentiti DM (accesso mittente DM): `channels.irc.allowFrom`
- Lista consentiti mittenti di gruppo (accesso mittente canale): `channels.irc.groupAllowFrom`
- Controlli per canale (regole per canale + mittente + menzione): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` consente canali non configurati (**comunque soggetti al gate per menzione per impostazione predefinita**)

Le voci della lista consentiti dovrebbero usare identità mittente stabili (`nick!user@host`).
La corrispondenza solo per nick è modificabile ed è abilitata solo quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Errore comune: `allowFrom` è per i DM, non per i canali

Se vedi log come:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa che il mittente non era autorizzato per i messaggi di **gruppo/canale**. Risolvilo in uno di questi modi:

- impostando `channels.irc.groupAllowFrom` (globale per tutti i canali), oppure
- impostando liste consentiti dei mittenti per canale: `channels.irc.groups["#channel"].allowFrom`

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

Anche se un canale è consentito (tramite `groupPolicy` + `groups`) e il mittente è autorizzato, OpenClaw applica per impostazione predefinita il **gate per menzione** nei contesti di gruppo.

Ciò significa che potresti vedere log come `drop channel … (missing-mention)` a meno che il messaggio non includa uno schema di menzione che corrisponde al bot.

Per fare in modo che il bot risponda in un canale IRC **senza richiedere una menzione**, disabilita il gate per menzione per quel canale:

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

Oppure, per consentire **tutti** i canali IRC (senza lista consentiti per canale) e rispondere comunque senza menzioni:

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

## Nota di sicurezza (consigliata per i canali pubblici)

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

### Strumenti diversi per mittente (il proprietario ottiene più privilegi)

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

- Le chiavi `toolsBySender` dovrebbero usare `id:` per i valori dell’identità mittente IRC:
  `id:eigen` o `id:eigen!~eigen@174.127.248.171` per una corrispondenza più forte.
- Le chiavi legacy senza prefisso sono ancora accettate e corrispondono solo come `id:`.
- Vince la prima policy mittente corrispondente; `"*"` è il fallback jolly.

Per maggiori informazioni sull’accesso di gruppo rispetto al gate per menzione (e su come interagiscono), consulta: [/channels/groups](/it/channels/groups).

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

`IRC_HOST` non può essere impostato da un file `.env` del workspace; consulta [file `.env` del workspace](/it/gateway/security).

## Risoluzione dei problemi

- Se il bot si connette ma non risponde mai nei canali, verifica `channels.irc.groups` **e** se il gate per menzione sta scartando i messaggi (`missing-mention`). Se vuoi che risponda senza ping, imposta `requireMention:false` per il canale.
- Se l’accesso non riesce, verifica la disponibilità del nick e la password del server.
- Se TLS non riesce su una rete personalizzata, verifica host/porta e la configurazione del certificato.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gate per menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
