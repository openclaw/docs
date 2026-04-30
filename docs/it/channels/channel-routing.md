---
read_when:
    - Modificare l'instradamento dei canali o il comportamento della posta in arrivo
summary: Regole di instradamento per canale (WhatsApp, Telegram, Discord, Slack) e contesto condiviso
title: Instradamento dei canali
x-i18n:
    generated_at: "2026-04-30T08:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canali e instradamento

OpenClaw instrada le risposte **di nuovo al canale da cui proviene un messaggio**. Il
modello non sceglie un canale; l'instradamento è deterministico e controllato dalla
configurazione dell'host.

## Termini chiave

- **Canale**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, più i canali Plugin. `webchat` è il canale interno dell'interfaccia WebChat e non è un canale in uscita configurabile.
- **AccountId**: istanza dell'account per canale (quando supportata).
- Account predefinito opzionale del canale: `channels.<channel>.defaultAccount` sceglie
  quale account viene usato quando un percorso in uscita non specifica `accountId`.
  - Nelle configurazioni multi-account, imposta un valore predefinito esplicito (`defaultAccount` o `accounts.default`) quando sono configurati due o più account. Senza di esso, l'instradamento di fallback può scegliere il primo ID account normalizzato.
- **AgentId**: uno spazio di lavoro isolato + archivio sessioni ("cervello").
- **SessionKey**: la chiave del bucket usata per archiviare il contesto e controllare la concorrenza.

## Forme delle chiavi di sessione (esempi)

I messaggi diretti confluiscono per impostazione predefinita nella sessione **main** dell'agente:

- `agent:<agentId>:<mainKey>` (predefinito: `agent:main:main`)

Anche quando la cronologia delle conversazioni tramite messaggi diretti è condivisa con main, le policy di sandbox e degli strumenti usano una chiave runtime derivata per chat diretta per account per i DM esterni, così i messaggi originati dal canale non vengono trattati come esecuzioni della sessione main locale.

Gruppi e canali rimangono isolati per canale:

- Gruppi: `agent:<agentId>:<channel>:group:<id>`
- Canali/stanze: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- I thread Slack/Discord aggiungono `:thread:<threadId>` alla chiave di base.
- Gli argomenti dei forum Telegram incorporano `:topic:<topicId>` nella chiave del gruppo.

Esempi:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Blocco della rotta DM main

Quando `session.dmScope` è `main`, i messaggi diretti possono condividere una sola sessione main.
Per impedire che il `lastRoute` della sessione venga sovrascritto da DM non proprietari,
OpenClaw deduce un proprietario bloccato da `allowFrom` quando tutte queste condizioni sono vere:

- `allowFrom` ha esattamente una voce non wildcard.
- La voce può essere normalizzata in un ID mittente concreto per quel canale.
- Il mittente del DM in ingresso non corrisponde a quel proprietario bloccato.

In quel caso di mancata corrispondenza, OpenClaw registra comunque i metadati della sessione in ingresso, ma
salta l'aggiornamento di `lastRoute` della sessione main.

## Registrazione in ingresso protetta

I Plugin di canale possono contrassegnare un record di sessione in ingresso come `createIfMissing: false`
quando un percorso protetto non deve creare una nuova sessione OpenClaw. In questa modalità,
OpenClaw può aggiornare i metadati e `lastRoute` per una sessione esistente, ma
non crea una voce di sessione solo per la rotta soltanto perché è stato osservato un messaggio.

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

Quando un'associazione include più campi di corrispondenza (`peer`, `guildId`, `teamId`, `roles`), **tutti i campi forniti devono corrispondere** affinché quell'associazione venga applicata.

L'agente corrispondente determina quale spazio di lavoro e archivio sessioni vengono usati.

## Gruppi broadcast (eseguire più agenti)

I gruppi broadcast ti permettono di eseguire **più agenti** per lo stesso peer **quando OpenClaw risponderebbe normalmente** (per esempio: nei gruppi WhatsApp, dopo il gating di menzione/attivazione).

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

- `agents.list`: definizioni degli agenti denominati (spazio di lavoro, modello, ecc.).
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

Gli archivi sessioni si trovano nella directory di stato (predefinita `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Le trascrizioni JSONL si trovano accanto all'archivio

Puoi sovrascrivere il percorso dell'archivio tramite `session.store` e il templating `{agentId}`.

Il rilevamento delle sessioni di Gateway e ACP analizza anche gli archivi agente su disco sotto la
radice predefinita `agents/` e sotto le radici `session.store` generate da template. Gli archivi rilevati
devono rimanere all'interno di quella radice agente risolta e usare un normale
file `sessions.json`. I symlink e i percorsi fuori dalla radice vengono ignorati.

## Comportamento di WebChat

WebChat si collega all'**agente selezionato** e usa per impostazione predefinita la sessione main
dell'agente. Per questo motivo, WebChat ti permette di vedere il contesto cross-channel di quell'
agente in un unico punto.

## Contesto della risposta

Le risposte in ingresso includono:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponibili.
- Il contesto citato viene aggiunto a `Body` come blocco `[Replying to ...]`.

Questo è coerente tra i canali.

## Correlati

- [Gruppi](/it/channels/groups)
- [Gruppi broadcast](/it/channels/broadcast-groups)
- [Abbinamento](/it/channels/pairing)
