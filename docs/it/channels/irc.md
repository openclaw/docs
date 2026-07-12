---
read_when:
    - Vuoi connettere OpenClaw a canali IRC o messaggi diretti
    - Stai configurando gli elenchi di autorizzazione IRC, i criteri di gruppo o il filtro delle menzioni
summary: Configurazione del plugin IRC, controlli degli accessi e risoluzione dei problemi
title: IRC
x-i18n:
    generated_at: "2026-07-12T06:48:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC quando vuoi utilizzare OpenClaw nei canali classici (`#room`) e nei messaggi diretti.
Installa il Plugin IRC ufficiale, quindi configuralo in `channels.irc`.

## Avvio rapido

1. Installa il Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Imposta almeno l'host, il nick e i canali a cui accedere in `~/.openclaw/openclaw.json`:

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

3. Avvia o riavvia il Gateway:

```bash
openclaw gateway run
```

Per il coordinamento dei bot, preferisci un server IRC privato. Se usi intenzionalmente una rete IRC pubblica, alcune opzioni comuni sono Libera.Chat, OFTC e Snoonet. Evita canali pubblici prevedibili per il traffico del canale secondario di bot o sciami.

## Impostazioni di connessione

| Chiave                        | Valore predefinito                  | Note                                                                    |
| ----------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `host`                        | nessuno (obbligatorio)              | Nome host del server IRC                                                |
| `port`                        | `6697` con TLS, `6667` senza TLS    | 1-65535                                                                 |
| `tls`                         | `true`                              | Imposta `false` solo per usare intenzionalmente testo non crittografato |
| `nick`                        | nessuno (obbligatorio)              | Nick del bot                                                            |
| `username`                    | nick, altrimenti `openclaw`         | Nome utente IRC                                                         |
| `realname`                    | `OpenClaw`                          | Campo nome reale/GECOS                                                  |
| `password` / `passwordFile`   | nessuno                             | Password del server; il file deve essere un file normale                |
| `channels`                    | nessuno                             | Canali a cui accedere (`["#openclaw"]`)                                 |
| `accounts` / `defaultAccount` | nessuno                             | Configurazione multi-account; le variabili d'ambiente popolano solo l'account predefinito |

## Impostazioni di sicurezza predefinite

- IRC usa socket TCP/TLS non elaborati al di fuori dell'instradamento tramite proxy di inoltro gestito dall'operatore OpenClaw. Nelle distribuzioni che richiedono che tutto il traffico in uscita passi attraverso tale proxy di inoltro, imposta `channels.irc.enabled=false`, a meno che il traffico IRC diretto in uscita non sia esplicitamente approvato.
- Il valore predefinito di `channels.irc.dmPolicy` è `"pairing"`: i mittenti di messaggi diretti sconosciuti ricevono un codice di associazione che puoi approvare con `openclaw pairing approve irc <code>`.
- Il valore predefinito di `channels.irc.groupPolicy` è `"allowlist"`.
- Con `groupPolicy="allowlist"`, imposta `channels.irc.groups` per definire i canali consentiti.
- Usa TLS (`channels.irc.tls=true`), a meno che tu non accetti intenzionalmente il trasporto in testo non crittografato.

## Controllo degli accessi

Esistono due "controlli" distinti per i canali IRC:

1. **Accesso al canale** (`groupPolicy` + `groups`): determina se il bot accetta messaggi da un canale.
2. **Accesso del mittente** (`groupAllowFrom` / `groups["#channel"].allowFrom` per canale): determina chi può attivare il bot all'interno del canale.

Chiavi di configurazione:

- Elenco consentiti dei messaggi diretti (accesso dei relativi mittenti): `channels.irc.allowFrom`
- Elenco consentiti dei mittenti dei gruppi (accesso dei mittenti del canale): `channels.irc.groupAllowFrom`
- Controlli per canale (regole relative a canale, mittente e menzioni): `channels.irc.groups["#channel"]` con `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` e `systemPrompt`
- `channels.irc.groupPolicy="open"` consente i canali non configurati (**per impostazione predefinita, richiede comunque una menzione**)

Le voci dell'elenco consentiti devono usare identità stabili dei mittenti (`nick!user@host`).
La corrispondenza del solo nick è modificabile ed è abilitata soltanto quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Errore comune: `allowFrom` si applica ai messaggi diretti, non ai canali

Se visualizzi registri simili a:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa che il mittente non era consentito per i messaggi di **gruppo/canale**. Per risolvere il problema:

- imposta `channels.irc.groupAllowFrom` (globale per tutti i canali), oppure
- imposta gli elenchi consentiti dei mittenti per canale: `channels.irc.groups["#channel"].allowFrom`

Esempio (consente a chiunque in `#openclaw` di interagire con il bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Attivazione delle risposte (menzioni)

Anche se un canale è consentito (tramite `groupPolicy` + `groups`) e il mittente è autorizzato, per impostazione predefinita OpenClaw **richiede una menzione** nei contesti di gruppo. Il bot viene considerato menzionato quando il messaggio contiene il nick del bot connesso o corrisponde ai modelli di menzione configurati.

Ciò significa che potresti visualizzare registri simili a `drop channel … (missing-mention)`, a meno che il messaggio non includa un modello di menzione corrispondente al bot.

Per fare in modo che il bot risponda in un canale IRC **senza richiedere una menzione**, disabilita il controllo delle menzioni per quel canale:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Oppure, per consentire **tutti** i canali IRC (senza un elenco consentiti per canale) e rispondere comunque senza menzioni:

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

Se consenti `allowFrom: ["*"]` in un canale pubblico, chiunque può inviare richieste al bot.
Per ridurre il rischio, limita gli strumenti per quel canale.

### Gli stessi strumenti per tutti nel canale

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
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

### Strumenti diversi per ciascun mittente (il proprietario dispone di maggiori autorizzazioni)

Usa `toolsBySender` per applicare criteri più restrittivi a `"*"` e criteri meno restrittivi al tuo nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
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

- Le chiavi di `toolsBySender` devono usare prefissi espliciti (`channel:`, `id:`, `e164:`, `username:`, `name:`). Per IRC, usa `id:` con il valore dell'identità del mittente: `id:alice` oppure `id:alice!~alice@203.0.113.7` per una corrispondenza più rigorosa.
- Le chiavi precedenti senza prefisso sono ancora accettate, vengono confrontate soltanto come `id:` e generano un avviso di deprecazione.
- Vengono applicati i criteri del primo mittente corrispondente; `"*"` è il valore jolly di riserva.

Per ulteriori informazioni sull'accesso ai gruppi rispetto al controllo delle menzioni e sulla loro interazione, consulta: [/channels/groups](/it/channels/groups).

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

Per impostazione predefinita, l'identificazione tramite NickServ viene eseguita ogni volta che è impostata una password (`enabled` deve essere impostato su `false` soltanto per disattivarla). Il valore predefinito di `service` è `NickServ`; `passwordFile` è un'alternativa a `password` specificato direttamente.

Registrazione facoltativa una tantum alla connessione (`register: true` richiede `registerEmail`):

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

Disabilita `register` dopo la registrazione del nick per evitare tentativi REGISTER ripetuti.

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

`IRC_HOST` non può essere impostato da un file `.env` dell'area di lavoro; consulta [File `.env` dell'area di lavoro](/it/gateway/security).

## Risoluzione dei problemi

- Se il bot si connette ma non risponde mai nei canali, verifica `channels.irc.groups` **e** controlla se il requisito di menzione sta scartando i messaggi (`missing-mention`). Se vuoi che risponda senza chiamate dirette, imposta `requireMention:false` per il canale.
- Se l'accesso non riesce, verifica la disponibilità del nick e la password del server.
- Se TLS non funziona su una rete personalizzata, verifica host, porta e configurazione del certificato.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e protezione avanzata
