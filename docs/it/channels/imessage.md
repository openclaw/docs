---
read_when:
    - Configurazione del supporto per iMessage
    - Debug del flusso di invio/ricezione di iMessage
summary: Supporto legacy di iMessage tramite imsg (JSON-RPC su stdio). Le nuove configurazioni dovrebbero usare BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-25T13:41:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
Per le nuove distribuzioni di iMessage, usa <a href="/it/channels/bluebubbles">BlueBubbles</a>.

L'integrazione `imsg` è legacy e potrebbe essere rimossa in una release futura.
</Warning>

Stato: integrazione CLI esterna legacy. Il Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun daemon/porta separato).

<CardGroup cols={3}>
  <Card title="BlueBubbles (consigliato)" icon="message-circle" href="/it/channels/bluebubbles">
    Percorso iMessage preferito per le nuove configurazioni.
  </Card>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di iMessage usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Riferimento della configurazione" icon="settings" href="/it/gateway/config-channels#imessage">
    Riferimento completo dei campi di iMessage.
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

      <Step title="Approva il primo abbinamento DM (dmPolicy predefinito)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di abbinamento scadono dopo 1 ora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto tramite SSH">
    OpenClaw richiede solo un `cliPath` compatibile con stdio, quindi puoi far puntare `cliPath` a uno script wrapper che usa SSH verso un Mac remoto ed esegue `imsg`.

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
      remoteHost: "user@gateway-host", // usato per i recuperi allegati via SCP
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
    `remoteHost` deve essere `host` o `user@host` (senza spazi o opzioni SSH).
    OpenClaw usa il controllo rigoroso della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve avere una sessione attiva sul Mac che esegue `imsg`.
- È richiesto Accesso completo al disco per il contesto di processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesta l'autorizzazione Automazione per inviare messaggi tramite Messages.app.

<Tip>
I permessi vengono concessi per contesto di processo. Se il gateway viene eseguito in modalità headless (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare i prompt:

```bash
imsg chats --limit 1
# oppure
imsg send <handle> "test"
```

</Tip>

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Policy DM">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci dell'allowlist possono essere handle o destinazioni chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Policy di gruppo + menzioni">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti del gruppo: `channels.imessage.groupAllowFrom`.

    Fallback a runtime: se `groupAllowFrom` non è impostato, i controlli dei mittenti dei gruppi iMessage ricorrono a `allowFrom` quando disponibile.
    Nota di runtime: se `channels.imessage` manca completamente, il runtime usa il fallback `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Controllo delle menzioni per i gruppi:

    - iMessage non ha metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il controllo delle menzioni non può essere applicato

    I comandi di controllo provenienti da mittenti autorizzati possono bypassare il controllo delle menzioni nei gruppi.

  </Tab>

  <Tab title="Sessioni e risposte deterministiche">
    - I DM usano l'instradamento diretto; i gruppi usano l'instradamento di gruppo.
    - Con il valore predefinito `session.dmScope=main`, i DM iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte tornano a iMessage usando i metadati di canale/destinazione di origine.

    Comportamento dei thread simili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente in `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (controllo di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding delle conversazioni ACP

Le chat iMessage legacy possono anche essere collegate a sessioni ACP.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` nel DM o nella chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage verranno instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP collegata.
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

Vedi [ACP Agents](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Modelli di distribuzione

<AccordionGroup>
  <Accordion title="Utente bot macOS dedicato (identità iMessage separata)">
    Usa un Apple ID e un utente macOS dedicati in modo che il traffico del bot sia isolato dal tuo profilo personale di Messages.

    Flusso tipico:

    1. Crea/accedi con un utente macOS dedicato.
    2. Accedi a Messages con l'Apple ID del bot in quell'utente.
    3. Installa `imsg` in quell'utente.
    4. Crea un wrapper SSH in modo che OpenClaw possa eseguire `imsg` nel contesto di quell'utente.
    5. Fai puntare `channels.imessage.accounts.<id>.cliPath` e `.dbPath` al profilo di quell'utente.

    La prima esecuzione può richiedere approvazioni tramite GUI (Automazione + Accesso completo al disco) nella sessione utente del bot.

  </Accordion>

  <Accordion title="Mac remoto tramite Tailscale (esempio)">
    Topologia comune:

    - il gateway viene eseguito su Linux/VM
    - iMessage + `imsg` viene eseguito su un Mac nella tua tailnet
    - il wrapper `cliPath` usa SSH per eseguire `imsg`
    - `remoteHost` abilita i recuperi allegati via SCP

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

## Media, suddivisione in blocchi e destinazioni di consegna

<AccordionGroup>
  <Accordion title="Allegati e media">
    - l'acquisizione degli allegati in ingresso è facoltativa: `channels.imessage.includeAttachments`
    - i percorsi remoti degli allegati possono essere recuperati via SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - pattern della radice predefinita: `/Users/*/Library/Messages/Attachments`
    - SCP usa il controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei media in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)

  </Accordion>

  <Accordion title="Suddivisione del testo in uscita">
    - limite dei blocchi di testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità di suddivisione: `channels.imessage.chunkMode`
      - `length` (predefinito)
      - `newline` (suddivisione prima per paragrafi)

  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Destinazioni esplicite preferite:

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

    Se il probe segnala che RPC non è supportato, aggiorna `imsg`.

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
    - comportamento dell'allowlist di `channels.imessage.groups`
    - configurazione dei pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Gli allegati remoti non funzionano">
    Controlla:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione tramite chiave SSH/SCP dall'host gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="I prompt dei permessi macOS sono stati persi">
    Esegui di nuovo in un terminale GUI interattivo nello stesso contesto utente/sessione e approva i prompt:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Conferma che Accesso completo al disco + Automazione siano concessi per il contesto di processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori al riferimento della configurazione

- [Riferimento della configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione del gateway](/it/gateway/configuration)
- [Abbinamento](/it/channels/pairing)
- [BlueBubbles](/it/channels/bluebubbles)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
