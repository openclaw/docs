---
read_when:
    - Modificare il routing dei canali o il comportamento della casella in arrivo
summary: Regole di instradamento per canale (WhatsApp, Telegram, Discord, Slack) e contesto condiviso
title: Instradamento dei canali
x-i18n:
    generated_at: "2026-05-02T08:15:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canali e instradamento

OpenClaw instrada le risposte **al canale da cui proviene un messaggio**. Il
modello non sceglie un canale; l'instradamento è deterministico e controllato
dalla configurazione dell'host.

## Termini chiave

- **Canale**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, più i canali dei Plugin. `webchat` è il canale interno dell'interfaccia WebChat e non è un canale di uscita configurabile.
- **AccountId**: istanza di account per canale (quando supportata).
- Account predefinito opzionale del canale: `channels.<channel>.defaultAccount` sceglie
  quale account viene usato quando un percorso in uscita non specifica `accountId`.
  - Nelle configurazioni multi-account, imposta un valore predefinito esplicito (`defaultAccount` o `accounts.default`) quando sono configurati due o più account. Senza di esso, l'instradamento di fallback può scegliere il primo ID account normalizzato.
- **AgentId**: uno spazio di lavoro isolato + archivio sessioni (“cervello”).
- **SessionKey**: la chiave del contenitore usata per archiviare il contesto e controllare la concorrenza.

## Prefissi delle destinazioni in uscita

Le destinazioni in uscita esplicite possono includere un prefisso del provider, come `telegram:123` o `tg:123`. Il core tratta quel prefisso come suggerimento di selezione del canale solo quando il canale selezionato è `last` o comunque non risolto, e solo quando il Plugin caricato dichiara quel prefisso. Se il chiamante ha già selezionato un canale esplicito, il prefisso del provider deve corrispondere a quel canale; combinazioni tra canali, come la consegna WhatsApp a `telegram:123`, falliscono prima della normalizzazione della destinazione specifica del Plugin.

I prefissi di tipo destinazione e servizio come `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` e `sms:<number>` restano all'interno della grammatica del canale selezionato. Non selezionano il provider da soli.

## Forme delle chiavi di sessione (esempi)

I messaggi diretti confluiscono per impostazione predefinita nella sessione **main** dell'agente:

- `agent:<agentId>:<mainKey>` (predefinito: `agent:main:main`)

Anche quando la cronologia della conversazione dei messaggi diretti è condivisa con main, il sandbox e
la policy degli strumenti usano una chiave runtime derivata per chat diretta per account per i DM esterni,
così i messaggi originati dai canali non vengono trattati come esecuzioni locali della sessione main.

Gruppi e canali restano isolati per canale:

- Gruppi: `agent:<agentId>:<channel>:group:<id>`
- Canali/stanze: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- I thread Slack/Discord aggiungono `:thread:<threadId>` alla chiave di base.
- Gli argomenti del forum Telegram incorporano `:topic:<topicId>` nella chiave del gruppo.

Esempi:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Pinning della rotta DM main

Quando `session.dmScope` è `main`, i messaggi diretti possono condividere una sessione main.
Per impedire che il `lastRoute` della sessione venga sovrascritto da DM non proprietari,
OpenClaw deduce un proprietario fissato da `allowFrom` quando tutte queste condizioni sono vere:

- `allowFrom` ha esattamente una voce non jolly.
- La voce può essere normalizzata in un ID mittente concreto per quel canale.
- Il mittente del DM in ingresso non corrisponde a quel proprietario fissato.

In quel caso di mancata corrispondenza, OpenClaw registra comunque i metadati della sessione in ingresso, ma
salta l'aggiornamento di `lastRoute` della sessione main.

## Registrazione in ingresso protetta

I Plugin di canale possono contrassegnare un record di sessione in ingresso come `createIfMissing: false`
quando un percorso protetto non deve creare una nuova sessione OpenClaw. In quella modalità,
OpenClaw può aggiornare i metadati e `lastRoute` per una sessione esistente, ma
non crea una voce di sessione solo per la rotta solo perché è stato osservato un messaggio.

## Regole di instradamento (come viene scelto un agente)

L'instradamento sceglie **un agente** per ogni messaggio in ingresso:

1. **Corrispondenza esatta del peer** (`bindings` con `peer.kind` + `peer.id`).
2. **Corrispondenza del peer padre** (ereditarietà del thread).
3. **Corrispondenza guild + ruoli** (Discord) tramite `guildId` + `roles`.
4. **Corrispondenza guild** (Discord) tramite `guildId`.
5. **Corrispondenza team** (Slack) tramite `teamId`.
6. **Corrispondenza account** (`accountId` sul canale).
7. **Corrispondenza canale** (qualsiasi account su quel canale, `accountId: "*"`).
8. **Agente predefinito** (`agents.list[].default`, altrimenti la prima voce dell'elenco, fallback a `main`).

Quando un binding include più campi di corrispondenza (`peer`, `guildId`, `teamId`, `roles`), **tutti i campi forniti devono corrispondere** perché quel binding venga applicato.

L'agente corrispondente determina quali spazio di lavoro e archivio sessioni vengono usati.

## Gruppi broadcast (eseguire più agenti)

I gruppi broadcast ti consentono di eseguire **più agenti** per lo stesso peer **quando OpenClaw risponderebbe normalmente** (ad esempio: nei gruppi WhatsApp, dopo il gating per menzione/attivazione).

Configurazione:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Vedi: [Gruppi broadcast](/it/channels/broadcast-groups).

## Panoramica della configurazione

- `agents.list`: definizioni degli agenti con nome (spazio di lavoro, modello, ecc.).
- `bindings`: associa i canali/account/peer in ingresso agli agenti.

Esempio:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Archiviazione delle sessioni

Gli archivi sessione si trovano nella directory di stato (predefinita `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Le trascrizioni JSONL si trovano accanto all'archivio

Puoi sovrascrivere il percorso dell'archivio tramite `session.store` e il templating `{agentId}`.

Anche il rilevamento delle sessioni Gateway e ACP scandisce gli archivi agente su disco sotto la
radice predefinita `agents/` e sotto le radici `session.store` con template. Gli archivi
rilevati devono restare all'interno di quella radice agente risolta e usare un normale file
`sessions.json`. I symlink e i percorsi fuori radice vengono ignorati.

## Comportamento di WebChat

WebChat si collega all'**agente selezionato** e usa per impostazione predefinita la sessione main
dell'agente. Per questo, WebChat ti consente di vedere il contesto tra canali per quell'agente
in un unico posto.

## Contesto di risposta

Le risposte in ingresso includono:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponibili.
- Il contesto citato viene aggiunto a `Body` come blocco `[Replying to ...]`.

Questo è coerente tra i canali.

## Correlati

- [Gruppi](/it/channels/groups)
- [Gruppi broadcast](/it/channels/broadcast-groups)
- [Abbinamento](/it/channels/pairing)
