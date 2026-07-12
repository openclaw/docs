---
read_when:
    - Modificare il comportamento delle chat di gruppo o il filtro delle menzioni
    - Limitazione di mentionPatterns a specifiche conversazioni di gruppo
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo sulle diverse piattaforme (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-07-12T06:49:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw applica le stesse regole per i gruppi a tutti i canali che li supportano, inclusi Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp e Zalo.

Per le stanze sempre attive che devono fornire un contesto discreto, a meno che l'agente non invii esplicitamente un messaggio visibile, consulta [Eventi ambientali delle stanze](/it/channels/ambient-room-events).

## Introduzione per principianti (2 minuti)

OpenClaw "vive" nei tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato: se **tu** partecipi a un gruppo, OpenClaw può vedere quel gruppo e rispondere al suo interno.

Comportamento predefinito:

- I gruppi sono soggetti a restrizioni (`groupPolicy: "allowlist"`); i mittenti dei gruppi vengono bloccati finché non sono inclusi nell'elenco consentito.
- Le risposte richiedono una menzione, a meno che non disabiliti il controllo delle menzioni per un gruppo.
- Il testo della risposta finale viene pubblicato automaticamente nella stanza (`visibleReplies: "automatic"`).

In altre parole: i mittenti inclusi nell'elenco consentito possono attivare OpenClaw menzionandolo.

<Note>
**In breve**

- **L'accesso ai messaggi diretti** è controllato da `*.allowFrom`.
- **L'accesso ai gruppi** è controllato da `*.groupPolicy` e dagli elenchi consentiti (`*.groups`, `*.groupAllowFrom`).
- **L'attivazione delle risposte** è controllata dal filtro delle menzioni (`requireMention`, `/activation`).

</Note>

Flusso rapido (cosa accade a un messaggio di gruppo):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Risposte visibili

Per le normali richieste di gruppo/canale, OpenClaw usa per impostazione predefinita `messages.groupChat.visibleReplies: "automatic"`: il testo finale dell'assistente viene pubblicato nella stanza come risposta visibile.

Usa `messages.groupChat.visibleReplies: "message_tool"` quando, in una stanza condivisa, l'agente deve poter decidere quando intervenire chiamando `message(action=send)`. Questa modalità funziona meglio con modelli affidabili nell'uso degli strumenti (ad esempio GPT-5.6 Sol). Se il modello non usa lo strumento e restituisce un testo finale sostanziale, OpenClaw mantiene privato tale testo anziché pubblicarlo nella stanza.

Usa `"automatic"` per modelli o ambienti di esecuzione che non rispettano in modo affidabile la consegna esclusivamente tramite strumenti: i normali testi finali vengono pubblicati direttamente nella stanza e l'agente può comunque chiamare `message(action=send)` per file, immagini o altri allegati che non possono essere inviati insieme al testo finale.

Se lo strumento per i messaggi non è disponibile secondo i criteri degli strumenti attivi, OpenClaw ripiega sulle risposte visibili automatiche anziché sopprimere silenziosamente la risposta. `openclaw doctor` segnala questa configurazione incoerente.

Per le chat dirette e qualsiasi altro evento di origine, `messages.visibleReplies: "message_tool"` applica globalmente lo stesso comportamento basato esclusivamente sullo strumento; `messages.groupChat.visibleReplies` rimane l'impostazione più specifica per le stanze di gruppo/canale. Per impostazione predefinita, i turni diretti della WebChat interna consegnano automaticamente la risposta finale, affinché Pi e Codex ricevano lo stesso contratto per le risposte visibili.

La modalità basata esclusivamente sullo strumento sostituisce il precedente modello che obbligava il modello a rispondere `NO_REPLY` nella maggior parte dei turni in modalità di sola osservazione. In questa modalità, il prompt non definisce un contratto `NO_REPLY`; non rendere visibile alcunché significa semplicemente non chiamare lo strumento per i messaggi.

Le associazioni delle conversazioni gestite dai Plugin costituiscono un'eccezione. Quando un Plugin associa un thread e prende in carico il turno in entrata, la risposta restituita dal Plugin è la risposta visibile dell'associazione e non richiede `message(action=send)`. Tale risposta è l'output dell'ambiente di esecuzione del Plugin, non il testo finale privato del modello.

Gli indicatori di digitazione vengono comunque inviati per le richieste dirette nei gruppi. Gli eventi ambientali delle stanze sempre attive, quando abilitati, restano rigorosi e silenziosi, a meno che l'agente non chiami lo strumento per i messaggi.

Per impostazione predefinita, le sessioni non mostrano i riepiloghi dettagliati degli strumenti e dell'avanzamento. Usa `/verbose on` (o `/verbose full`) per mostrarli nella sessione corrente durante il debug e `/verbose off` per tornare al comportamento che mostra solo la risposta finale. Lo stato dettagliato è specifico della sessione e funziona allo stesso modo nelle chat dirette, nei gruppi, nei canali e negli argomenti dei forum.

Per inviare le conversazioni di gruppo sempre attive e prive di menzioni come contesto discreto della stanza, anziché come richieste dell'utente, usa [Eventi ambientali delle stanze](/it/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Il valore predefinito è `unmentionedInbound: "user_request"`. I messaggi con menzioni, i comandi, le richieste di interruzione e i messaggi diretti restano richieste dell'utente.

Per richiedere che l'output visibile delle richieste di gruppo/canale passi attraverso lo strumento per i messaggi:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Per richiederlo per ogni chat di origine:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Il Gateway rileva le modifiche alla configurazione `messages` senza richiedere un riavvio dopo il salvataggio del file. Riavvia solo quando il ricaricamento della configurazione è disabilitato (`gateway.reload.mode: "off"`).

I turni dei comandi ignorano `visibleReplies: "message_tool"` e rispondono sempre in modo visibile: sia i comandi slash nativi (Discord, Telegram e altre interfacce che supportano comandi nativi), sia i comandi di testo `/...` autorizzati pubblicano la risposta nella chat di origine. Nei gruppi, i turni di testo `/...` non autorizzati rimangono vincolati allo strumento per i messaggi; i normali turni di chat seguono l'impostazione predefinita configurata.

## Visibilità del contesto ed elenchi consentiti

La sicurezza dei gruppi prevede due controlli distinti:

- **Autorizzazione all'attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, elenchi consentiti specifici del canale).
- **Visibilità del contesto**: quale contesto supplementare viene inserito nel modello (testo di risposte/citazioni, cronologia dei thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw mantiene il contesto così come viene ricevuto: gli elenchi consentiti determinano chi può attivare azioni, non quali frammenti citati o cronologici il modello può vedere. Per filtrare anche il contesto supplementare, imposta `contextVisibility`:

| Modalità            | Comportamento                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `"all"` (predefinita) | Mantiene il contesto supplementare così come viene ricevuto.                                             |
| `"allowlist"`       | Inserisce solo il contesto di cronologia/thread/citazioni/inoltri proveniente da mittenti consentiti.      |
| `"allowlist_quote"` | Come `allowlist`, ma mantiene anche il messaggio esplicitamente citato o a cui si risponde, da ogni mittente. |

Impostalo per canale (`channels.<channel>.contextVisibility`), per account (`channels.<channel>.accounts.<accountId>.contextVisibility`) o globalmente (`channels.defaults.contextVisibility`). I canali che recuperano contesto supplementare (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) applicano i criteri durante la creazione del contesto in entrata; le combinazioni di criteri sconosciute vengono bloccate per sicurezza e il contesto viene omesso.

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se vuoi...

| Obiettivo                                                       | Impostazione                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| Consentire tutti i gruppi, ma rispondere solo alle @menzioni     | `groups: { "*": { requireMention: true } }`                 |
| Disabilitare tutte le risposte nei gruppi                        | `groupPolicy: "disabled"`                                   |
| Consentire solo gruppi specifici                                 | `groups: { "<group-id>": { ... } }` (senza la chiave `"*"`) |
| Consentire solo a te di attivare l'agente nei gruppi             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |
| Riutilizzare un unico insieme di mittenti fidati tra più canali  | `groupAllowFrom: ["accessGroup:operators"]`                 |

Per gli elenchi riutilizzabili di mittenti consentiti, consulta [Gruppi di accesso](/it/channels/access-groups).

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (le stanze/i canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti dei forum Telegram aggiungono `:topic:<threadId>` all'ID del gruppo, in modo che ogni argomento disponga della propria sessione.
- Le chat dirette usano la sessione principale (o sessioni per mittente, se `session.dmScope` è configurato).
- Gli Heartbeat vengono eseguiti nella sessione Heartbeat configurata (impostazione predefinita: la sessione principale dell'agente); le sessioni di gruppo non eseguono Heartbeat propri.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modello: messaggi diretti personali + gruppi pubblici (agente singolo)

Sì: funziona bene se il traffico "personale" è costituito da **messaggi diretti** e quello "pubblico" da **gruppi**.

Motivo: in modalità con agente singolo, i messaggi diretti vengono generalmente indirizzati alla chiave della sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se abiliti l'esecuzione in sandbox con `mode: "non-main"`, tali sessioni di gruppo vengono eseguite nel backend sandbox configurato, mentre la sessione principale dei messaggi diretti resta sull'host. Docker è il backend predefinito se non ne scegli uno.

In questo modo ottieni un unico "cervello" dell'agente (area di lavoro + memoria condivise), ma due modalità di esecuzione:

- **Messaggi diretti**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati

<Note>
Se hai bisogno di aree di lavoro o identità realmente separate ("personale" e "pubblico" non devono mai mescolarsi), usa un secondo agente e le associazioni. Consulta [Instradamento multi-agente](/it/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Messaggi diretti sull'host, gruppi nella sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="I gruppi vedono solo una cartella inclusa nell'elenco consentito">
    Vuoi che "i gruppi possano vedere solo la cartella X" anziché "nessun accesso all'host"? Mantieni `workspaceAccess: "none"` e monta nella sandbox solo i percorsi inclusi nell'elenco consentito:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

Contenuti correlati:

- Chiavi di configurazione e valori predefiniti: [Configurazione del Gateway](/it/gateway/config-agents#agentsdefaultssandbox)
- Debug del motivo per cui uno strumento è bloccato: [Sandbox, criteri degli strumenti e privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli sui montaggi associati: [Esecuzione in sandbox](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette visualizzate

- Le etichette dell'interfaccia utente usano `displayName` quando disponibile, nel formato `<channel>:<token>`.
- `#room` è riservato a stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantenendo `#@+._-`). Gli ID opachi molto lunghi vengono abbreviati in un token stabile, evitando di esporre nell'interfaccia utente gli ID completi degli instradamenti.

## Criteri per i gruppi

Controlla come vengono gestiti i messaggi di gruppo/stanza per ogni canale:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Criterio      | Comportamento                                                                 |
| ------------- | ----------------------------------------------------------------------------- |
| `"open"`      | I gruppi ignorano gli elenchi di autorizzazione; il filtro per menzione resta attivo. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.                              |
| `"allowlist"` | Consente solo i gruppi/le stanze che corrispondono all'elenco di autorizzazione configurato. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` è separato dal filtro per menzione, che richiede le @menzioni.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (ripiego: `allowFrom` esplicito).
    - Signal: `groupAllowFrom` può corrispondere all'ID del gruppo Signal in ingresso oppure al telefono/UUID del mittente.
    - Le approvazioni dell'associazione dei DM (voci archiviate in `*-allowFrom`) si applicano solo all'accesso ai DM; l'autorizzazione dei mittenti nei gruppi rimane esplicitamente vincolata agli elenchi di autorizzazione dei gruppi.
    - Discord: l'elenco di autorizzazione usa `channels.discord.guilds.<id>.channels`.
    - Slack: l'elenco di autorizzazione usa `channels.slack.channels`.
    - Matrix: l'elenco di autorizzazione usa `channels.matrix.groups`. Usa gli ID delle stanze (`!room:server`) o gli alias (`#alias:server`); le chiavi con il nome della stanza corrispondono solo con `channels.matrix.dangerouslyAllowNameMatching: true` e le voci non risolte vengono ignorate durante l'esecuzione. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportati anche gli elenchi di autorizzazione `users` per singola stanza.
    - I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: gli elenchi di autorizzazione dei mittenti accettano solo ID utente numerici (`"123456789"`; i prefissi `telegram:`/`tg:` vengono rimossi senza distinzione tra maiuscole e minuscole). Le voci `@username` non trovano corrispondenza durante l'esecuzione e registrano un avviso; la configurazione risolve `@username` in ID. Gli ID chat negativi devono essere inseriti in `channels.telegram.groups`, non negli elenchi di autorizzazione dei mittenti.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se l'elenco di autorizzazione dei gruppi è vuoto, i messaggi di gruppo vengono bloccati.
    - Sicurezza durante l'esecuzione: quando manca completamente un blocco del provider (`channels.<provider>` assente), il criterio dei gruppi adotta in modo sicuro `allowlist` anziché ereditare `channels.defaults.groupPolicy` e il Gateway registra il ripiego una sola volta per account.

  </Accordion>
</AccordionGroup>

Modello mentale rapido (ordine di valutazione dei messaggi di gruppo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (aperto/disabilitato/elenco di autorizzazione).
  </Step>
  <Step title="Group allowlists">
    Elenchi di autorizzazione dei gruppi (`*.groups`, `*.groupAllowFrom`, elenco di autorizzazione specifico del canale).
  </Step>
  <Step title="Mention gating">
    Filtro per menzione (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtro per menzione (predefinito)

I messaggi di gruppo richiedono una menzione, a meno che non venga impostato diversamente per il singolo gruppo. I valori predefiniti risiedono in ogni sottosistema sotto `*.groups."*"`.

Rispondere a un messaggio del bot conta come menzione implicita quando il canale espone i metadati della risposta; anche citare un messaggio del bot può contare sui canali che espongono i metadati della citazione. Casi integrati attuali: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp e Zalo personale.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Limitare l'ambito dei modelli di menzione configurati

I `mentionPatterns` configurati sono attivatori regex di ripiego. Usali quando la piattaforma non espone una menzione nativa del bot oppure quando testo semplice come `openclaw:` deve contare come menzione. Le menzioni native della piattaforma sono separate: quando Discord, Slack, Telegram, Matrix o un altro canale può confermare che il messaggio ha menzionato esplicitamente il bot, tale menzione nativa continua ad attivarlo anche dove i modelli regex configurati sono negati.

Per impostazione predefinita, i modelli di menzione configurati si applicano ovunque il canale passi i dati relativi al provider e alla conversazione al rilevamento delle menzioni. Per evitare che modelli generici attivino l'agente in ogni gruppo, limitane l'ambito per canale con `channels.<channel>.mentionPatterns`.

Usa `mode: "deny"` quando i modelli regex di menzione devono essere disattivati per impostazione predefinita per un canale, quindi abilitali in stanze specifiche con `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Usa il valore predefinito `mode: "allow"` (oppure ometti `mode`) quando i modelli regex di menzione devono applicarsi in modo esteso, quindi disattivali nelle stanze rumorose con `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Risoluzione del criterio:

| Campo           | Effetto                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | I modelli regex di menzione sono abilitati, a meno che l'ID della conversazione non sia in `denyIn`. Questo è il valore predefinito.            |
| `mode: "deny"`  | I modelli regex di menzione sono disabilitati, a meno che l'ID della conversazione non sia in `allowIn`.                                        |
| `allowIn`       | ID delle conversazioni in cui i modelli regex di menzione sono abilitati in modalità di negazione.                                             |
| `denyIn`        | ID delle conversazioni in cui i modelli regex di menzione sono disabilitati. `denyIn` prevale su `allowIn` se entrambi contengono lo stesso ID. |

Criteri regex con ambito limitato attualmente supportati:

| Canale   | ID usati in `allowIn` / `denyIn`                                  |
| -------- | ----------------------------------------------------------------- |
| Discord  | ID dei canali Discord.                                             |
| Matrix   | ID delle stanze Matrix.                                            |
| Slack    | ID dei canali Slack.                                               |
| Telegram | ID delle chat di gruppo oppure `chatId:topic:threadId` per gli argomenti dei forum. |
| WhatsApp | ID delle conversazioni WhatsApp, come `123@g.us`.                  |

Le configurazioni dei canali a livello di account possono impostare lo stesso criterio in `channels.<channel>.accounts.<accountId>.mentionPatterns` quando il canale supporta più account. Per tale account, il criterio dell'account ha la precedenza su quello del canale di primo livello.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - I `mentionPatterns` sono modelli regex sicuri senza distinzione tra maiuscole e minuscole; i modelli non validi e le forme non sicure con ripetizioni annidate vengono ignorati, con un avviso.
    - Precedenza dei modelli: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo) sovrascrive `messages.groupChat.mentionPatterns`; quando nessuno dei due è impostato, i modelli vengono derivati dal nome/emoji dell'identità dell'agente.
    - Il filtro per menzione viene applicato solo quando è possibile rilevare le menzioni, tramite menzioni native o `mentionPatterns` configurati.
    - L'inserimento di un gruppo o di un mittente nell'elenco di autorizzazione non disabilita il filtro per menzione; imposta `requireMention` del gruppo su `false` quando tutti i messaggi devono attivare l'agente.
    - Il contesto automatico del prompt della chat di gruppo include a ogni turno l'istruzione risolta per la risposta silenziosa; i file dell'area di lavoro non devono duplicare i meccanismi di `NO_REPLY`.
    - I gruppi in cui sono consentite risposte silenziose automatiche trattano come silenziosi i turni del modello completamente vuoti o contenenti solo ragionamento, equivalenti a `NO_REPLY`. Le chat dirette non ricevono mai indicazioni `NO_REPLY` e le risposte di gruppo che usano solo lo strumento per i messaggi restano silenziose evitando di chiamare `message(action=send)`.
    - Per impostazione predefinita, le conversazioni di gruppo ambientali sempre attive usano la semantica delle richieste utente. Imposta `messages.groupChat.unmentionedInbound: "room_event"` per inviarle invece come contesto silenzioso. Consulta [Eventi ambientali delle stanze](/it/channels/ambient-room-events) per esempi di configurazione.
    - Gli eventi delle stanze non vengono archiviati come richieste utente fittizie e il testo privato dell'assistente proveniente da eventi delle stanze senza strumento per i messaggi non viene riprodotto nella cronologia della chat.
    - I valori predefiniti di Discord risiedono in `channels.discord.guilds."*"` e possono essere sovrascritti per ogni server/canale.
    - Il contesto della cronologia dei gruppi viene incapsulato uniformemente tra i canali. I gruppi con filtro per menzione mantengono i messaggi ignorati in sospeso; i gruppi sempre attivi possono anche conservare i messaggi recenti elaborati nella stanza quando il canale lo supporta. Usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (oppure `channels.<channel>.accounts.*.historyLimit`) per le sostituzioni. Imposta `0` per disabilitare la funzionalità.

  </Accordion>
</AccordionGroup>

## Limitazioni degli strumenti per gruppo/canale (facoltative)

Alcune configurazioni dei canali consentono di limitare gli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consente/nega strumenti per l'intero gruppo (`allow`, `alsoAllow`, `deny`; la negazione prevale).
- `toolsBySender`: sostituzioni per singolo mittente all'interno del gruppo. Usa prefissi espliciti per le chiavi: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e il carattere jolly `"*"`. Gli ID dei canali usano gli ID canonici dei canali OpenClaw; gli alias come `teams` vengono normalizzati in `msteams`. Le chiavi precedenti senza prefisso sono ancora accettate, vengono confrontate solo come `id:` e registrano un avviso di deprecazione.

Ordine di risoluzione (prevale il più specifico):

<Steps>
  <Step title="Group toolsBySender">
    Corrispondenza con `toolsBySender` del gruppo/canale.
  </Step>
  <Step title="Group tools">
    `tools` del gruppo/canale.
  </Step>
  <Step title="Default toolsBySender">
    Corrispondenza con `toolsBySender` predefinito (`"*"`).
  </Step>
  <Step title="Default tools">
    `tools` predefinito (`"*"`).
  </Step>
</Steps>

Esempio (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Le limitazioni degli strumenti per gruppo/canale vengono applicate in aggiunta al criterio globale o dell'agente relativo agli strumenti; la negazione continua a prevalere. Alcuni canali usano una struttura diversa per stanze/canali, ad esempio Discord `guilds.*.channels.*`, Slack `channels.*` e Microsoft Teams `teams.*.channels.*`.
</Note>

## Elenchi di autorizzazione dei gruppi

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi fungono da elenco di autorizzazione dei gruppi. Usa `"*"` per consentire tutti i gruppi continuando a impostare il comportamento predefinito delle menzioni.

<Warning>
Confusione comune: l'approvazione dell'associazione dei messaggi diretti non equivale all'autorizzazione del gruppo. Per i canali che supportano l'associazione dei messaggi diretti, l'archivio delle associazioni abilita soltanto i messaggi diretti. I comandi di gruppo richiedono comunque l'autorizzazione esplicita del mittente del gruppo tramite elenchi di autorizzazione della configurazione, come `groupAllowFrom`, oppure tramite il fallback di configurazione documentato per quel canale.
</Warning>

Intenti comuni (copia/incolla):

<Tabs>
  <Tab title="Disabilita tutte le risposte nei gruppi">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Consenti solo gruppi specifici (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Consenti tutti i gruppi, ma richiedi una menzione">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Attivazioni riservate al proprietario (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Attivazione (solo proprietario)

I proprietari dei gruppi possono modificare l'attivazione per ciascun gruppo con un messaggio autonomo:

- `/activation mention`
- `/activation always`

`/activation` è un comando principale riservato al proprietario e si applica soltanto alle chat di gruppo. Per proprietario si intende un mittente che corrisponde a `allowFrom` / `commands.ownerAllowFrom` del canale (quando non è configurato alcun elenco di autorizzazione, l'ID dell'account stesso viene considerato proprietario). La modalità memorizzata sostituisce il valore `requireMention` del gruppo nei canali che la utilizzano (Google Chat, QQBot, Telegram, WhatsApp) e l'introduzione del prompt di sistema del gruppo riflette ovunque la modalità attiva.

## Campi di contesto

I payload in entrata dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo della menzione)
- Gli argomenti dei forum Telegram includono anche `MessageThreadId` e `IsForum`.

Il prompt di sistema dell'agente include un'introduzione relativa al gruppo durante il primo turno di una nuova sessione di gruppo (e dopo le modifiche apportate con `/activation`). Ricorda al modello di rispondere come una persona, ridurre al minimo le righe vuote, seguire la normale spaziatura delle chat ed evitare di digitare sequenze letterali `\n`. Nei gruppi diversi da Telegram sono inoltre sconsigliate le tabelle Markdown; le indicazioni per il testo formattato di Telegram provengono dal prompt del canale Telegram. I nomi dei gruppi e le etichette dei partecipanti provenienti dal canale vengono visualizzati come metadati non attendibili delimitati da blocchi, non come istruzioni di sistema incorporate.

## Specificità di iMessage

- Per l'instradamento o l'inserimento negli elenchi di autorizzazione, preferisci `chat_id:<id>`.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte di gruppo vengono sempre inviate allo stesso `chat_id`.

## Prompt di sistema di WhatsApp

Consulta [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema di WhatsApp, incluse la risoluzione dei prompt di gruppo e diretti, il comportamento dei caratteri jolly e la semantica delle sostituzioni a livello di account.

## Specificità di WhatsApp

Consulta [Messaggi di gruppo](/it/channels/group-messages) per il comportamento specifico di WhatsApp (inserimento della cronologia e dettagli sulla gestione delle menzioni).

## Argomenti correlati

- [Gruppi di trasmissione](/it/channels/broadcast-groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Associazione](/it/channels/pairing)
