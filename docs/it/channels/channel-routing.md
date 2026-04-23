---
read_when:
    - Modifica dell'instradamento dei canali o del comportamento della posta in arrivo
summary: Regole di instradamento per canale (WhatsApp, Telegram, Discord, Slack) e contesto condiviso
title: Instradamento dei canali
x-i18n:
    generated_at: "2026-04-23T08:23:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1101d9d3411d9e9f48efd14c0dab09d76e83a6bd93c713d38efc01a14c8391
    source_path: channels/channel-routing.md
    workflow: 15
---

# Canali e instradamento

OpenClaw instrada le risposte **di nuovo verso il canale da cui è arrivato un messaggio**. Il
modello non sceglie un canale; l'instradamento è deterministico ed è controllato dalla
configurazione dell'host.

## Termini chiave

- **Canale**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, più i canali plugin. `webchat` è il canale interno dell'interfaccia WebChat e non è un canale di uscita configurabile.
- **AccountId**: istanza account per canale (quando supportata).
- Account predefinito opzionale del canale: `channels.<channel>.defaultAccount` sceglie
  quale account viene usato quando un percorso in uscita non specifica `accountId`.
  - Nelle configurazioni con più account, imposta un valore predefinito esplicito (`defaultAccount` o `accounts.default`) quando sono configurati due o più account. Senza di esso, l'instradamento di fallback potrebbe scegliere il primo ID account normalizzato.
- **AgentId**: un workspace + archivio sessioni isolato ("cervello").
- **SessionKey**: la chiave bucket usata per memorizzare il contesto e controllare la concorrenza.

## Forme della chiave di sessione (esempi)

I messaggi diretti confluiscono per impostazione predefinita nella sessione **principale** dell'agente:

- `agent:<agentId>:<mainKey>` (predefinito: `agent:main:main`)

Anche quando la cronologia della conversazione dei messaggi diretti è condivisa con quella principale, la sandbox e
la policy degli strumenti usano una chiave runtime derivata per chat diretta per account per i DM esterni
così che i messaggi originati dal canale non vengano trattati come esecuzioni locali della sessione principale.

I gruppi e i canali restano isolati per canale:

- Gruppi: `agent:<agentId>:<channel>:group:<id>`
- Canali/stanze: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- I thread Slack/Discord aggiungono `:thread:<threadId>` alla chiave di base.
- Gli argomenti del forum Telegram incorporano `:topic:<topicId>` nella chiave del gruppo.

Esempi:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Blocco del percorso DM principale

Quando `session.dmScope` è `main`, i messaggi diretti possono condividere un'unica sessione principale.
Per evitare che `lastRoute` della sessione venga sovrascritta da DM di non proprietari,
OpenClaw deduce un proprietario bloccato da `allowFrom` quando tutte queste condizioni sono vere:

- `allowFrom` ha esattamente una voce non wildcard.
- La voce può essere normalizzata in un ID mittente concreto per quel canale.
- Il mittente del DM in ingresso non corrisponde a quel proprietario bloccato.

In caso di mancata corrispondenza, OpenClaw registra comunque i metadati della sessione in ingresso, ma
salta l'aggiornamento di `lastRoute` della sessione principale.

## Regole di instradamento (come viene scelto un agente)

L'instradamento seleziona **un agente** per ogni messaggio in ingresso:

1. **Corrispondenza esatta del peer** (`bindings` con `peer.kind` + `peer.id`).
2. **Corrispondenza del peer padre** (ereditarietà del thread).
3. **Corrispondenza guild + ruoli** (Discord) tramite `guildId` + `roles`.
4. **Corrispondenza guild** (Discord) tramite `guildId`.
5. **Corrispondenza team** (Slack) tramite `teamId`.
6. **Corrispondenza account** (`accountId` sul canale).
7. **Corrispondenza canale** (qualsiasi account su quel canale, `accountId: "*"`).
8. **Agente predefinito** (`agents.list[].default`, altrimenti la prima voce della lista, fallback a `main`).

Quando un binding include più campi di corrispondenza (`peer`, `guildId`, `teamId`, `roles`), **tutti i campi forniti devono corrispondere** affinché quel binding si applichi.

L'agente corrispondente determina quale workspace e archivio sessioni vengono usati.

## Gruppi broadcast (eseguire più agenti)

I gruppi broadcast permettono di eseguire **più agenti** per lo stesso peer **quando OpenClaw normalmente risponderebbe** (per esempio: nei gruppi WhatsApp, dopo il gating di menzione/attivazione).

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

- `agents.list`: definizioni di agenti con nome (workspace, modello, ecc.).
- `bindings`: mappa canali/account/peer in ingresso agli agenti.

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

Gli archivi delle sessioni si trovano nella directory di stato (predefinita `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Le trascrizioni JSONL si trovano accanto all'archivio

Puoi sovrascrivere il percorso dell'archivio tramite `session.store` e il templating `{agentId}`.

Gateway e il rilevamento delle sessioni ACP analizzano anche gli archivi agenti su disco sotto la
radice `agents/` predefinita e sotto le radici `session.store` con template. Gli archivi
rilevati devono restare all'interno di quella radice agente risolta e usare un file
`sessions.json` regolare. Symlink e percorsi esterni alla radice vengono ignorati.

## Comportamento di WebChat

WebChat si collega all'**agente selezionato** e per impostazione predefinita usa la
sessione principale dell'agente. Per questo motivo, WebChat ti permette di vedere in un unico punto il contesto tra canali diversi per quell'agente.

## Contesto della risposta

Le risposte in ingresso includono:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponibili.
- Il contesto citato viene aggiunto a `Body` come blocco `[Replying to ...]`.

Questo è coerente tra i vari canali.
