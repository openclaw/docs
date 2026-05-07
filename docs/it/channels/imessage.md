---
read_when:
    - Configurazione del supporto per iMessage
    - Risoluzione dei problemi di invio/ricezione di iMessage
summary: Supporto nativo a iMessage tramite imsg (JSON-RPC su stdio). Preferito per le nuove configurazioni iMessage di OpenClaw quando i requisiti dell'host sono compatibili.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Per le nuove distribuzioni OpenClaw iMessage, inizia da qui quando puoi eseguire `imsg` su un host macOS Messages con accesso effettuato. BlueBubbles resta disponibile come fallback legacy per le configurazioni esistenti che dipendono dal suo server HTTP, dai webhook o da azioni più ricche tramite API private.
</Note>

Stato: integrazione CLI esterna nativa. Il Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun daemon/porta separato).

<CardGroup cols={3}>
  <Card title="BlueBubbles (fallback legacy)" icon="message-circle" href="/it/channels/bluebubbles">
    Continua a usarlo per il routing esistente basato su BlueBubbles; evitalo per nuove configurazioni quando imsg è adatto.
  </Card>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM iMessage usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Riferimento di configurazione" icon="settings" href="/it/gateway/config-channels#imessage">
    Riferimento completo dei campi iMessage.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Mac locale (percorso rapido)">
    <Steps>
      <Step title="Installa e verifica imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Avvia il gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approva il primo abbinamento DM (dmPolicy predefinita)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di abbinamento scadono dopo 1 ora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto tramite SSH">
    OpenClaw richiede solo un `cliPath` compatibile con stdio, quindi puoi puntare `cliPath` a uno script wrapper che si collega via SSH a un Mac remoto ed esegue `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configurazione consigliata quando gli allegati sono abilitati:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` non è impostato, OpenClaw tenta di rilevarlo automaticamente analizzando lo script wrapper SSH.
    `remoteHost` deve essere `host` o `user@host` (senza spazi o opzioni SSH).
    OpenClaw usa il controllo rigoroso della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve avere l'accesso effettuato sul Mac che esegue `imsg`.
- È richiesto Accesso completo al disco per il contesto del processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesto il permesso di automazione per inviare messaggi tramite Messages.app.

<Tip>
I permessi vengono concessi per contesto di processo. Se il gateway viene eseguito senza interfaccia (LaunchAgent/SSH), esegui una volta un comando interattivo nello stesso contesto per attivare le richieste:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Controllo degli accessi e routing

<Tabs>
  <Tab title="Criterio DM">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci allowlist possono essere handle o destinazioni chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Criterio di gruppo + menzioni">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti di gruppo: `channels.imessage.groupAllowFrom`.

    Fallback runtime: se `groupAllowFrom` non è impostato, i controlli dei mittenti dei gruppi iMessage ricadono su `allowFrom` quando disponibile.
    Nota runtime: se `channels.imessage` manca completamente, il runtime ricade su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Controllo delle menzioni per i gruppi:

    - iMessage non ha metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il controllo delle menzioni non può essere applicato

    I comandi di controllo da mittenti autorizzati possono bypassare il controllo delle menzioni nei gruppi.

  </Tab>

  <Tab title="Sessioni e risposte deterministiche">
    - I DM usano il routing diretto; i gruppi usano il routing di gruppo.
    - Con `session.dmScope=main` predefinito, i DM iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte tornano a iMessage usando i metadati di canale/destinazione di origine.

    Comportamento dei thread simili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente in `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (controllo di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding delle conversazioni ACP

Le chat iMessage legacy possono anche essere associate a sessioni ACP.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` nel DM o nella chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage vengono indirizzati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

I binding persistenti configurati sono supportati tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` può usare:

- handle DM normalizzato come `+15555550123` o `user@example.com`
- `chat_id:<id>` (consigliato per binding di gruppo stabili)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Vedi [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Schemi di distribuzione

<AccordionGroup>
  <Accordion title="Utente macOS dedicato per il bot (identità iMessage separata)">
    Usa un Apple ID e un utente macOS dedicati in modo che il traffico del bot sia isolato dal tuo profilo Messages personale.

    Flusso tipico:

    1. Crea/accedi a un utente macOS dedicato.
    2. Accedi a Messages con l'Apple ID del bot in quell'utente.
    3. Installa `imsg` in quell'utente.
    4. Crea un wrapper SSH in modo che OpenClaw possa eseguire `imsg` nel contesto di quell'utente.
    5. Punta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` a quel profilo utente.

    La prima esecuzione può richiedere approvazioni GUI (Automazione + Accesso completo al disco) nella sessione utente del bot.

  </Accordion>

  <Accordion title="Mac remoto tramite Tailscale (esempio)">
    Topologia comune:

    - il gateway viene eseguito su Linux/VM
    - iMessage + `imsg` viene eseguito su un Mac nella tua tailnet
    - il wrapper `cliPath` usa SSH per eseguire `imsg`
    - `remoteHost` abilita il recupero degli allegati tramite SCP

    Esempio:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Usa chiavi SSH in modo che sia SSH sia SCP siano non interattivi.
    Assicurati prima che la chiave host sia considerata attendibile (per esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) così `known_hosts` viene popolato.

  </Accordion>

  <Accordion title="Schema multi-account">
    iMessage supporta la configurazione per account in `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle radici degli allegati.

  </Accordion>
</AccordionGroup>

## Media, suddivisione in blocchi e destinazioni di consegna

<AccordionGroup>
  <Accordion title="Allegati e media">
    - l'ingestione degli allegati in ingresso è facoltativa: `channels.imessage.includeAttachments`
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - pattern radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa il controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei media in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)

  </Accordion>

  <Accordion title="Suddivisione in blocchi in uscita">
    - limite blocco di testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità blocco: `channels.imessage.chunkMode`
      - `length` (predefinito)
      - `newline` (suddivisione prima per paragrafi)

  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Destinazioni esplicite preferite:

    - `chat_id:123` (consigliato per routing stabile)
    - `chat_guid:...`
    - `chat_identifier:...`

    Sono supportate anche le destinazioni handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Scritture di configurazione

iMessage consente per impostazione predefinita scritture di configurazione avviate dal canale (per `/config set|unset` quando `commands.config: true`).

Disabilita:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="imsg non trovato o RPC non supportato">
    Convalida il binario e il supporto RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se il probe segnala RPC non supportato, aggiorna `imsg`.

  </Accordion>

  <Accordion title="I DM vengono ignorati">
    Controlla:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni di abbinamento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="I messaggi di gruppo vengono ignorati">
    Controlla:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento allowlist di `channels.imessage.groups`
    - configurazione del pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Gli allegati remoti non riescono">
    Controlla:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione con chiave SSH/SCP dall'host del gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host del gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="Le richieste di permesso macOS sono state perse">
    Riesegui in un terminale GUI interattivo nello stesso contesto utente/sessione e approva le richieste:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Conferma che Accesso completo al disco + Automazione siano concessi per il contesto del processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori al riferimento di configurazione

- [Riferimento di configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione Gateway](/it/gateway/configuration)
- [Abbinamento](/it/channels/pairing)
- [BlueBubbles](/it/channels/bluebubbles)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione tramite DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
