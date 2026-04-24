---
read_when:
    - Configurazione del supporto iMessage
    - Debug di invio/ricezione di iMessage
summary: Supporto legacy di iMessage tramite imsg (JSON-RPC su stdio). Le nuove configurazioni dovrebbero usare BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T08:29:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (legacy: imsg)

<Warning>
Per le nuove distribuzioni di iMessage, usa <a href="/it/channels/bluebubbles">BlueBubbles</a>.

L'integrazione `imsg` è legacy e potrebbe essere rimossa in una versione futura.
</Warning>

Stato: integrazione CLI esterna legacy. Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun daemon/porta separato).

<CardGroup cols={3}>
  <Card title="BlueBubbles (consigliato)" icon="message-circle" href="/it/channels/bluebubbles">
    Percorso iMessage preferito per le nuove configurazioni.
  </Card>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Le DM di iMessage usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Riferimento della configurazione" icon="settings" href="/it/gateway/config-channels#imessage">
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

      <Step title="Avvia gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approva la prima associazione DM (dmPolicy predefinita)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di associazione scadono dopo 1 ora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto tramite SSH">
    OpenClaw richiede solo un `cliPath` compatibile con stdio, quindi puoi puntare `cliPath` a uno script wrapper che esegue SSH verso un Mac remoto ed esegue `imsg`.

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
      remoteHost: "user@gateway-host", // usato per i recuperi allegati tramite SCP
      includeAttachments: true,
      // Facoltativo: sovrascrive le radici di allegati consentite.
      // I valori predefiniti includono /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` non è impostato, OpenClaw tenta di rilevarlo automaticamente analizzando lo script wrapper SSH.
    `remoteHost` deve essere `host` oppure `user@host` (senza spazi o opzioni SSH).
    OpenClaw usa il controllo rigoroso della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve avere una sessione attiva sul Mac che esegue `imsg`.
- È richiesto Accesso completo al disco per il contesto di processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesto il permesso Automazione per inviare messaggi tramite Messages.app.

<Tip>
I permessi vengono concessi per contesto di processo. Se gateway viene eseguito senza interfaccia (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare le richieste:

```bash
imsg chats --limit 1
# oppure
imsg send <handle> "test"
```

</Tip>

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Criterio DM">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci dell'allowlist possono essere handle o target chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Criterio di gruppo + menzioni">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti del gruppo: `channels.imessage.groupAllowFrom`.

    Fallback di runtime: se `groupAllowFrom` non è impostato, i controlli dei mittenti dei gruppi iMessage ricadono su `allowFrom` quando disponibile.
    Nota di runtime: se `channels.imessage` manca completamente, il runtime ricade su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Blocco per menzioni nei gruppi:

    - iMessage non ha metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il blocco per menzione non può essere applicato

    I comandi di controllo provenienti da mittenti autorizzati possono bypassare il blocco per menzione nei gruppi.

  </Tab>

  <Tab title="Sessioni e risposte deterministiche">
    - Le DM usano l'instradamento diretto; i gruppi usano l'instradamento di gruppo.
    - Con il valore predefinito `session.dmScope=main`, le DM di iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono instradate di nuovo verso iMessage usando i metadati del canale/target di origine.

    Comportamento dei thread simili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente in `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (blocco di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding di conversazione ACP

Le chat iMessage legacy possono anche essere associate a sessioni ACP.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` all'interno della DM o della chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage verranno instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Le associazioni persistenti configurate sono supportate tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "imessage"`.

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

## Modelli di distribuzione

<AccordionGroup>
  <Accordion title="Utente bot macOS dedicato (identità iMessage separata)">
    Usa un Apple ID e un utente macOS dedicati in modo che il traffico del bot sia isolato dal tuo profilo Messages personale.

    Flusso tipico:

    1. Crea/accedi a un utente macOS dedicato.
    2. Accedi a Messages con l'Apple ID del bot in quell'utente.
    3. Installa `imsg` in quell'utente.
    4. Crea un wrapper SSH in modo che OpenClaw possa eseguire `imsg` nel contesto di quell'utente.
    5. Punta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` al profilo di quell'utente.

    La prima esecuzione potrebbe richiedere approvazioni GUI (Automazione + Accesso completo al disco) nella sessione utente del bot.

  </Accordion>

  <Accordion title="Mac remoto tramite Tailscale (esempio)">
    Topologia comune:

    - gateway è in esecuzione su Linux/VM
    - iMessage + `imsg` è in esecuzione su un Mac nella tua tailnet
    - il wrapper `cliPath` usa SSH per eseguire `imsg`
    - `remoteHost` abilita i recuperi degli allegati tramite SCP

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
    Assicurati prima che la chiave host sia attendibile (ad esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) in modo che `known_hosts` venga popolato.

  </Accordion>

  <Accordion title="Modello multi-account">
    iMessage supporta la configurazione per account in `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle radici degli allegati.

  </Accordion>
</AccordionGroup>

## Supporti multimediali, segmentazione e target di consegna

<AccordionGroup>
  <Accordion title="Allegati e contenuti multimediali">
    - l'acquisizione degli allegati in ingresso è facoltativa: `channels.imessage.includeAttachments`
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - pattern di radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa il controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei contenuti multimediali in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)
  </Accordion>

  <Accordion title="Segmentazione in uscita">
    - limite di segmentazione del testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità di segmentazione: `channels.imessage.chunkMode`
      - `length` (predefinito)
      - `newline` (suddivisione prima per paragrafi)
  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Target espliciti preferiti:

    - `chat_id:123` (consigliato per un instradamento stabile)
    - `chat_guid:...`
    - `chat_identifier:...`

    Sono supportati anche i target handle:

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
  <Accordion title="imsg non trovato o RPC non supportato">
    Convalida il binario e il supporto RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se la verifica segnala che RPC non è supportato, aggiorna `imsg`.

  </Accordion>

  <Accordion title="Le DM vengono ignorate">
    Controlla:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni di associazione (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="I messaggi di gruppo vengono ignorati">
    Controlla:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento dell'allowlist `channels.imessage.groups`
    - configurazione dei pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Gli allegati remoti non funzionano">
    Controlla:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione a chiave SSH/SCP dall'host gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="Le richieste di permesso macOS sono state ignorate">
    Esegui di nuovo in un terminale GUI interattivo nello stesso contesto utente/sessione e approva le richieste:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Conferma che Accesso completo al disco + Automazione siano concessi per il contesto di processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori al riferimento della configurazione

- [Riferimento della configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione del Gateway](/it/gateway/configuration)
- [Associazione](/it/channels/pairing)
- [BlueBubbles](/it/channels/bluebubbles)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e blocco per menzione
- [Instradamento del canale](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
