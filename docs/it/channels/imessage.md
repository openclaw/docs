---
read_when:
    - Configurare il supporto per iMessage
    - Debug dell'invio/ricezione di iMessage
summary: Supporto iMessage precedente tramite imsg (JSON-RPC su stdio). Le nuove configurazioni dovrebbero usare BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T08:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
Per le nuove distribuzioni iMessage, usa <a href="/it/channels/bluebubbles">BlueBubbles</a>.

L’integrazione `imsg` è legacy e potrebbe essere rimossa in una versione futura.
</Warning>

Stato: integrazione CLI esterna legacy. Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun daemon/porta separati).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/it/channels/bluebubbles">
    Percorso iMessage preferito per le nuove configurazioni.
  </Card>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    I DM iMessage usano per impostazione predefinita la modalità di pairing.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/it/gateway/config-channels#imessage">
    Riferimento completo dei campi iMessage.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di pairing scadono dopo 1 ora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw richiede solo un `cliPath` compatibile con stdio, quindi puoi puntare `cliPath` a uno script wrapper che usa SSH verso un Mac remoto ed esegue `imsg`.

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
    OpenClaw usa un controllo rigoroso della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono validati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve essere connesso sul Mac che esegue `imsg`.
- È richiesto Full Disk Access per il contesto di processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesto il permesso Automation per inviare messaggi tramite Messages.app.

<Tip>
I permessi vengono concessi per contesto di processo. Se gateway viene eseguito headless (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare i prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci dell’allowlist possono essere handle o destinazioni chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti del gruppo: `channels.imessage.groupAllowFrom`.

    Fallback runtime: se `groupAllowFrom` non è impostato, i controlli sui mittenti dei gruppi iMessage ripiegano su `allowFrom` quando disponibile.
    Nota runtime: se `channels.imessage` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Gating delle menzioni per i gruppi:

    - iMessage non dispone di metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il gating delle menzioni non può essere applicato

    I comandi di controllo da mittenti autorizzati possono bypassare il gating delle menzioni nei gruppi.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - I DM usano l’instradamento diretto; i gruppi usano l’instradamento di gruppo.
    - Con `session.dmScope=main` predefinito, i DM iMessage confluiscono nella sessione principale dell’agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono instradate di nuovo a iMessage usando i metadati del canale/della destinazione di origine.

    Comportamento dei thread simili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente sotto `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (gating di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding delle conversazioni ACP

Le chat iMessage legacy possono anche essere associate a sessioni ACP.

Flusso rapido per l’operatore:

- Esegui `/acp spawn codex --bind here` all’interno del DM o della chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage vengono instradati alla sessione ACP avviata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

I binding persistenti configurati sono supportati tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` può usare:

- handle DM normalizzato, ad esempio `+15555550123` o `user@example.com`
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

Consulta [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Usa un Apple ID e un utente macOS dedicati in modo che il traffico del bot sia isolato dal tuo profilo Messages personale.

    Flusso tipico:

    1. Crea/accedi con un utente macOS dedicato.
    2. Accedi a Messages con l’Apple ID del bot in quell’utente.
    3. Installa `imsg` in quell’utente.
    4. Crea un wrapper SSH in modo che OpenClaw possa eseguire `imsg` nel contesto di quell’utente.
    5. Punta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` a quel profilo utente.

    Il primo avvio potrebbe richiedere approvazioni GUI (Automation + Full Disk Access) nella sessione di quell’utente bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologia comune:

    - gateway in esecuzione su Linux/VM
    - iMessage + `imsg` in esecuzione su un Mac nella tua tailnet
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
    Assicurati prima che la chiave host sia attendibile (ad esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) così `known_hosts` viene popolato.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage supporta la configurazione per account sotto `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle radici degli allegati.

  </Accordion>
</AccordionGroup>

## Media, suddivisione in blocchi e destinazioni di consegna

<AccordionGroup>
  <Accordion title="Attachments and media">
    - l’acquisizione degli allegati in ingresso è facoltativa: `channels.imessage.includeAttachments`
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - pattern radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa un controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei media in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - limite dei blocchi di testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità di suddivisione: `channels.imessage.chunkMode`
      - `length` (predefinito)
      - `newline` (suddivisione dando priorità ai paragrafi)

  </Accordion>

  <Accordion title="Addressing formats">
    Destinazioni esplicite preferite:

    - `chat_id:123` (consigliato per instradamento stabile)
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

iMessage consente per impostazione predefinita le scritture di configurazione avviate dal canale (per `/config set|unset` quando `commands.config: true`).

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
  <Accordion title="imsg not found or RPC unsupported">
    Valida il binario e il supporto RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se il probe segnala RPC non supportato, aggiorna `imsg`.

  </Accordion>

  <Accordion title="DMs are ignored">
    Controlla:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni di pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Controlla:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento dell’allowlist `channels.imessage.groups`
    - configurazione dei pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Controlla:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione con chiave SSH/SCP dall’host Gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull’host Gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Riesegui in un terminale GUI interattivo nello stesso contesto utente/sessione e approva i prompt:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Conferma che Full Disk Access + Automation siano concessi per il contesto di processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Riferimenti alla configurazione

- [Riferimento di configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione Gateway](/it/gateway/configuration)
- [Pairing](/it/channels/pairing)
- [BlueBubbles](/it/channels/bluebubbles)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
