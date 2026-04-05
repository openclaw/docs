---
read_when:
    - Configurazione del supporto iMessage
    - Debug dell'invio/ricezione di iMessage
summary: Supporto iMessage legacy tramite imsg (JSON-RPC su stdio). Per le nuove configurazioni, usare BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T13:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (legacy: imsg)

<Warning>
Per i nuovi deployment iMessage, usa <a href="/channels/bluebubbles">BlueBubbles</a>.

L'integrazione `imsg` è legacy e potrebbe essere rimossa in una futura release.
</Warning>

Stato: integrazione CLI esterna legacy. Il gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun daemon/porta separato).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/channels/bluebubbles">
    Percorso iMessage preferito per le nuove configurazioni.
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    I DM di iMessage usano per impostazione predefinita la modalità pairing.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/gateway/configuration-reference#imessage">
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
      dbPath: "/Users/<you>/Library/Messages/chat.db",
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
    OpenClaw richiede solo un `cliPath` compatibile con stdio, quindi puoi impostare `cliPath` su uno script wrapper che esegue SSH verso un Mac remoto ed esegue `imsg`.

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
      remoteHost: "user@gateway-host", // usato per i recuperi degli allegati via SCP
      includeAttachments: true,
      // Facoltativo: sovrascrive le radici consentite per gli allegati.
      // I valori predefiniti includono /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` non è impostato, OpenClaw tenta di rilevarlo automaticamente analizzando lo script wrapper SSH.
    `remoteHost` deve essere `host` oppure `user@host` (senza spazi né opzioni SSH).
    OpenClaw usa la verifica rigorosa della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve aver effettuato l'accesso sul Mac che esegue `imsg`.
- È richiesto l'accesso completo al disco per il contesto di processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesto il permesso Automazione per inviare messaggi tramite Messages.app.

<Tip>
I permessi vengono concessi per contesto di processo. Se il gateway viene eseguito headless (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare le richieste:

```bash
imsg chats --limit 1
# oppure
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

    Le voci allowlist possono essere handle o destinazioni chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti del gruppo: `channels.imessage.groupAllowFrom`.

    Fallback runtime: se `groupAllowFrom` non è impostato, i controlli dei mittenti dei gruppi iMessage ripiegano su `allowFrom` quando disponibile.
    Nota runtime: se `channels.imessage` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Controllo delle menzioni per i gruppi:

    - iMessage non ha metadati di menzione nativi
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il controllo delle menzioni non può essere applicato

    I comandi di controllo provenienti da mittenti autorizzati possono bypassare il controllo delle menzioni nei gruppi.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - I DM usano l'instradamento diretto; i gruppi usano l'instradamento di gruppo.
    - Con il valore predefinito `session.dmScope=main`, i DM di iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono instradate di nuovo verso iMessage usando i metadati del canale/destinazione di origine.

    Comportamento dei thread simili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente in `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (controlli di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding delle conversazioni ACP

Le chat iMessage legacy possono anche essere associate a sessioni ACP.

Flusso operativo rapido:

- Esegui `/acp spawn codex --bind here` nel DM o nella chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage verranno instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Le associazioni persistenti configurate sono supportate tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` può usare:

- handle DM normalizzato come `+15555550123` oppure `user@example.com`
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

Consulta [ACP Agents](/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Pattern di deployment

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Usa un Apple ID e un utente macOS dedicati, così il traffico del bot rimane isolato dal tuo profilo personale di Messages.

    Flusso tipico:

    1. Crea/accedi con un utente macOS dedicato.
    2. Accedi a Messages con l'Apple ID del bot per quell'utente.
    3. Installa `imsg` per quell'utente.
    4. Crea un wrapper SSH così OpenClaw può eseguire `imsg` nel contesto di quell'utente.
    5. Imposta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` sul profilo di quell'utente.

    La prima esecuzione può richiedere approvazioni GUI (Automazione + Accesso completo al disco) nella sessione utente del bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologia comune:

    - il gateway viene eseguito su Linux/VM
    - iMessage + `imsg` vengono eseguiti su un Mac nella tua tailnet
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

    Usa chiavi SSH così sia SSH sia SCP siano non interattivi.
    Assicurati prima che la chiave host sia affidabile (ad esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) così `known_hosts` venga popolato.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage supporta la configurazione per account sotto `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle radici degli allegati.

  </Accordion>
</AccordionGroup>

## Supporti multimediali, suddivisione e destinazioni di consegna

<AccordionGroup>
  <Accordion title="Attachments and media">
    - l'acquisizione degli allegati in ingresso è facoltativa: `channels.imessage.includeAttachments`
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - pattern radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa la verifica rigorosa della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei media in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)
  </Accordion>

  <Accordion title="Outbound chunking">
    - limite di suddivisione del testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità di suddivisione: `channels.imessage.chunkMode`
      - `length` (predefinita)
      - `newline` (suddivisione prima per paragrafi)
  </Accordion>

  <Accordion title="Addressing formats">
    Destinazioni esplicite consigliate:

    - `chat_id:123` (consigliato per un instradamento stabile)
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

Disabilitazione:

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
    Convalida il binario e il supporto RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se il probe segnala che RPC non è supportato, aggiorna `imsg`.

  </Accordion>

  <Accordion title="DMs are ignored">
    Verifica:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Verifica:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento allowlist di `channels.imessage.groups`
    - configurazione dei pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Verifica:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione con chiave SSH/SCP dall'host gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Esegui di nuovo in un terminale GUI interattivo nello stesso contesto utente/sessione e approva le richieste:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Conferma che Accesso completo al disco + Automazione siano concessi al contesto di processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori al riferimento di configurazione

- [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## Correlati

- [Channels Overview](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso pairing
- [Groups](/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Channel Routing](/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/gateway/security) — modello di accesso e hardening
