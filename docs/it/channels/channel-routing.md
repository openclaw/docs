---
read_when:
    - Modifica dell'instradamento dei canali o del comportamento della posta in arrivo
summary: Regole di instradamento per canale (WhatsApp, Telegram, Discord, Slack) e contesto condiviso
title: Instradamento dei canali
x-i18n:
    generated_at: "2026-07-16T13:59:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canali e instradamento

OpenClaw instrada le risposte **al canale da cui proviene il messaggio**. Il
modello non sceglie un canale; l'instradamento è deterministico e controllato dalla
configurazione dell'host.

## Termini chiave

- **Canale**: un plugin di canale incluso, come `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` o `whatsapp`, oltre ai canali dei plugin installati. `webchat` è il canale interno dell'interfaccia WebChat e non è un canale in uscita configurabile.
- **AccountId**: istanza dell'account per canale (quando supportata).
- Account predefinito facoltativo del canale: `channels.<channel>.defaultAccount` sceglie
  quale account utilizzare quando un percorso in uscita non specifica `accountId`.
  - Nelle configurazioni con più account, impostare un valore predefinito esplicito (`defaultAccount` o un account denominato `default`) quando sono configurati due o più account. In sua assenza, l'instradamento di ripiego potrebbe selezionare il primo ID account normalizzato.
- **AgentId**: uno spazio di lavoro isolato + un archivio delle sessioni ("cervello").
- **SessionKey**: la chiave del contenitore utilizzata per archiviare il contesto e controllare la concorrenza.

## Prefissi delle destinazioni in uscita

Le destinazioni in uscita esplicite possono includere un prefisso del provider, come `telegram:123` o `tg:123`. Il nucleo considera tale prefisso un'indicazione per la selezione del canale solo quando il canale selezionato è `last` o comunque non risolto, e solo quando il plugin caricato dichiara tale prefisso. Se il chiamante ha già selezionato un canale esplicito, il prefisso del provider deve corrispondere a quel canale; le combinazioni tra canali diversi, come la consegna WhatsApp a `telegram:123`, generano un errore prima della normalizzazione della destinazione specifica del plugin.

I prefissi relativi al tipo di destinazione e al servizio, come `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` e `sms:<number>`, rimangono nella grammatica del canale selezionato. Non selezionano autonomamente il provider.

## Formati delle chiavi di sessione (esempi)

Per impostazione predefinita, i messaggi diretti confluiscono nella sessione **principale** dell'agente:

- `agent:<agentId>:<mainKey>` (valore predefinito: `agent:main:main`)

`session.dmScope` controlla il raggruppamento dei messaggi diretti: `main` (valore predefinito) condivide un'unica sessione principale,
mentre `per-peer`, `per-channel-peer` e `per-account-channel-peer`
mantengono i messaggi diretti in sessioni separate. Un'associazione di instradamento può sovrascrivere l'ambito per i peer
corrispondenti tramite `bindings[].session.dmScope`.

Anche quando la cronologia delle conversazioni dei messaggi diretti è condivisa con la sessione principale, la sandbox e
i criteri degli strumenti utilizzano una chiave di runtime derivata per la chat diretta di ciascun account per i messaggi diretti esterni,
affinché i messaggi provenienti dai canali non siano trattati come esecuzioni locali della sessione principale.

I gruppi e i canali rimangono isolati per ciascun canale:

- Gruppi: `agent:<agentId>:<channel>:group:<id>`
- Canali/stanze: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- I thread di Slack/Discord aggiungono `:thread:<threadId>` alla chiave di base.
- Gli argomenti dei forum di Telegram incorporano `:topic:<topicId>` nella chiave del gruppo.

Esempi:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fissaggio dell'instradamento dei messaggi diretti principali

Quando `session.dmScope` è `main`, i messaggi diretti possono condividere un'unica sessione principale.
Per evitare che il valore `lastRoute` della sessione venga sovrascritto dai messaggi diretti di utenti diversi dal proprietario,
OpenClaw deduce un proprietario fissato da `allowFrom` quando sono vere tutte le condizioni seguenti:

- `allowFrom` contiene esattamente una voce senza caratteri jolly.
- La voce può essere normalizzata in un ID mittente concreto per quel canale.
- Il mittente del messaggio diretto in entrata non corrisponde al proprietario fissato.

In caso di mancata corrispondenza, OpenClaw registra comunque i metadati della sessione in entrata, ma
non aggiorna il valore `lastRoute` della sessione principale.

## Registrazione protetta dei messaggi in entrata

I plugin dei canali possono contrassegnare il record di una sessione in entrata come `createIfMissing: false`
quando un percorso protetto non deve creare una nuova sessione OpenClaw. In questa modalità,
OpenClaw può aggiornare i metadati e `lastRoute` per una sessione esistente, ma
non crea una voce di sessione destinata esclusivamente all'instradamento solo perché è stato osservato un messaggio.

## Regole di instradamento (come viene scelto un agente)

L'instradamento seleziona **un agente** per ciascun messaggio in entrata:

1. **Corrispondenza esatta del peer** (`bindings` con `peer.kind` + `peer.id`).
2. **Corrispondenza del peer padre** (ereditarietà dei thread).
3. **Corrispondenza con carattere jolly del peer** (`peer.id: "*"` per un tipo di peer).
4. **Corrispondenza tra gilda e ruoli** (Discord) tramite `guildId` + `roles`.
5. **Corrispondenza della gilda** (Discord) tramite `guildId`.
6. **Corrispondenza del team** (Slack) tramite `teamId`.
7. **Corrispondenza dell'account** (`accountId` sul canale).
8. **Corrispondenza del canale** (qualsiasi account su quel canale, `accountId: "*"`).
9. **Agente predefinito** (`agents.list[].default`; altrimenti la prima voce dell'elenco, con ripiego su `main`).

Quando un'associazione include più campi di corrispondenza (`peer`, `guildId`, `teamId`, `roles`), **tutti i campi forniti devono corrispondere** affinché l'associazione sia applicata.

L'agente corrispondente determina lo spazio di lavoro e l'archivio delle sessioni da utilizzare.

## Gruppi di trasmissione (esecuzione di più agenti)

I gruppi di trasmissione consentono di eseguire **più agenti** per lo stesso peer **quando OpenClaw risponderebbe normalmente** (ad esempio, nei gruppi WhatsApp, dopo il controllo di menzione/attivazione).

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

Consultare: [Gruppi di trasmissione](/it/channels/broadcast-groups).

## Panoramica della configurazione

- `agents.list`: definizioni degli agenti con nome (spazio di lavoro, modello e così via).
- `bindings`: associa i canali/account/peer in entrata agli agenti.

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

Le righe delle sessioni di runtime risiedono nel database SQLite di ciascun agente, nella directory
di stato (valore predefinito `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Le installazioni meno recenti potrebbero contenere file JSONL legacy delle trascrizioni e un archivio
di righe `sessions.json` in `~/.openclaw/agents/<agentId>/sessions/`. L'avvio del Gateway e
`openclaw doctor --fix` importano automaticamente in SQLite le righe e la cronologia legacy utilizzate di recente.
Utilizzare `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` e la sequenza di convalida
[Doctor](/it/cli/doctor#session-sqlite-migration) quando occorrono
prove esplicite della migrazione.
È comunque possibile selezionare un percorso dell'archivio legacy tramite i modelli `session.store` e `{agentId}`
per i flussi di lavoro di migrazione e manutenzione offline.

Il rilevamento delle sessioni di Gateway e ACP analizza anche gli archivi degli agenti su disco nella
radice predefinita `agents/` e nelle radici basate sul modello `session.store`. Gli archivi rilevati
devono rimanere all'interno della radice dell'agente risolta e utilizzare un normale file legacy
`sessions.json`. I collegamenti simbolici e i percorsi esterni alla radice vengono ignorati.

## Comportamento di WebChat

WebChat si collega all'**agente selezionato** e utilizza per impostazione predefinita la sessione principale
dell'agente. Per questo motivo, WebChat consente di visualizzare in un unico punto il contesto tra canali
di tale agente.

## Contesto della risposta

Le risposte in entrata includono:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender`, quando disponibili.
- Il contesto citato viene aggiunto a `Body` come blocco `[Replying to ...]`.

Questo comportamento è coerente tra i vari canali.

## Argomenti correlati

- [Gruppi](/it/channels/groups)
- [Gruppi di trasmissione](/it/channels/broadcast-groups)
- [Associazione](/it/channels/pairing)
