---
read_when:
    - Modifica del comportamento delle chat di gruppo o del filtro basato sulle menzioni
    - Limitazione di mentionPatterns a specifiche conversazioni di gruppo
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo sulle diverse piattaforme (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-07-16T13:59:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw applica le stesse regole per i gruppi a tutti i canali che supportano i gruppi, inclusi Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp e Zalo.

Per le stanze sempre attive che devono fornire un contesto discreto, a meno che l'agente non invii esplicitamente un messaggio visibile, vedere [Eventi ambientali delle stanze](/it/channels/ambient-room-events).

## Introduzione per principianti (2 minuti)

OpenClaw "vive" negli account di messaggistica dell'utente. Non esiste un utente bot WhatsApp separato: se **l'utente** fa parte di un gruppo, OpenClaw può vedere quel gruppo e rispondere al suo interno.

Comportamento predefinito:

- I gruppi sono soggetti a restrizioni (`groupPolicy: "allowlist"`); i mittenti dei gruppi vengono bloccati finché non vengono inseriti nell'elenco consentiti.
- Le risposte richiedono una menzione, a meno che il filtro delle menzioni non venga disabilitato per un gruppo.
- Il testo della risposta finale viene pubblicato automaticamente nella stanza (`visibleReplies: "automatic"`).

In altre parole: i mittenti nell'elenco consentiti possono attivare OpenClaw menzionandolo.

<Note>
**In breve**

- L'**accesso ai messaggi diretti** è controllato da `*.allowFrom`.
- L'**accesso ai gruppi** è controllato da `*.groupPolicy` + elenchi consentiti (`*.groups`, `*.groupAllowFrom`).
- L'**attivazione delle risposte** è controllata dal filtro delle menzioni (`requireMention`, `/activation`).

</Note>

Flusso rapido (cosa accade a un messaggio di gruppo):

```text
groupPolicy? disabled -> ignora
groupPolicy? allowlist -> gruppo consentito? no -> ignora
requireMention? yes -> menzionato? no -> memorizza solo come contesto
menzione/risposta/comando/messaggio diretto -> richiesta dell'utente
conversazione di gruppo sempre attiva -> richiesta dell'utente oppure evento della stanza, se configurato
```

## Risposte visibili

Per le normali richieste di gruppo/canale, il valore predefinito di OpenClaw è `messages.groupChat.visibleReplies: "automatic"`: il testo finale dell'assistente viene pubblicato nella stanza come risposta visibile.

Usare `messages.groupChat.visibleReplies: "message_tool"` quando una stanza condivisa deve consentire all'agente di decidere quando intervenire chiamando `message(action=send)`. Questa modalità funziona meglio con modelli che usano gli strumenti in modo affidabile (ad esempio GPT-5.6 Sol). Se il modello non usa lo strumento e restituisce un testo finale sostanziale, OpenClaw mantiene privato tale testo anziché pubblicarlo nella stanza.

Usare `"automatic"` per modelli o runtime che non rispettano in modo affidabile la consegna esclusivamente tramite strumenti: i normali testi finali vengono pubblicati direttamente nella stanza e l'agente può comunque chiamare `message(action=send)` per file, immagini o altri allegati che non possono essere inclusi nel testo finale.

Se lo strumento per i messaggi non è disponibile in base ai criteri degli strumenti attivi, OpenClaw ripiega sulle risposte visibili automatiche anziché sopprimere silenziosamente la risposta. `openclaw doctor` segnala questa mancata corrispondenza.

Per le chat dirette e qualsiasi altro evento di origine, `messages.visibleReplies: "message_tool"` applica globalmente lo stesso comportamento esclusivamente tramite strumenti; `messages.groupChat.visibleReplies` rimane l'override più specifico per le stanze di gruppo/canale. I turni diretti interni di WebChat usano per impostazione predefinita la consegna automatica della risposta finale, affinché Pi e Codex ricevano lo stesso contratto per le risposte visibili.

La modalità esclusivamente tramite strumenti sostituisce il vecchio schema che imponeva al modello di rispondere `NO_REPLY` per la maggior parte dei turni in modalità di osservazione passiva. In questa modalità, il prompt non definisce un contratto `NO_REPLY`; non rendere visibile alcunché significa semplicemente non chiamare lo strumento per i messaggi.

I binding delle conversazioni gestiti dai Plugin costituiscono un'eccezione. Dopo che un Plugin associa un thread e prende in carico il turno in ingresso, la risposta restituita dal Plugin è la risposta visibile del binding e non richiede `message(action=send)`. Tale risposta è un output del runtime del Plugin, non il testo finale privato del modello.

Gli indicatori di digitazione vengono comunque inviati per le richieste dirette nei gruppi. Gli eventi ambientali delle stanze sempre attive, quando abilitati, rimangono rigorosamente silenziosi a meno che l'agente non chiami lo strumento per i messaggi.

Per impostazione predefinita, le sessioni sopprimono i riepiloghi dettagliati degli strumenti e dell'avanzamento. Usare `/verbose on` (o `/verbose full`) per mostrarli nella sessione corrente durante il debug e `/verbose off` per tornare al comportamento con sole risposte finali. Lo stato dettagliato è specifico per ogni sessione e funziona allo stesso modo nelle chat dirette, nei gruppi, nei canali e negli argomenti dei forum.

Per inviare le conversazioni di gruppo sempre attive prive di menzioni come contesto discreto della stanza anziché come richieste dell'utente, usare [Eventi ambientali delle stanze](/it/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Il valore predefinito è `unmentionedInbound: "user_request"`. I messaggi con menzioni, i comandi, le richieste di interruzione e i messaggi diretti rimangono richieste dell'utente.

Per richiedere che l'output visibile delle richieste di gruppo/canale venga inviato tramite lo strumento per i messaggi:

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

Il Gateway rileva le modifiche alla configurazione `messages` senza riavvio dopo il salvataggio del file. Riavviare solo quando il ricaricamento della configurazione è disabilitato (`gateway.reload.mode: "off"`).

I turni di comando ignorano `visibleReplies: "message_tool"` e rispondono sempre in modo visibile: sia i comandi slash nativi (Discord, Telegram e altre interfacce con supporto nativo dei comandi) sia i comandi testuali `/...` autorizzati pubblicano la propria risposta nella chat di origine. I turni testuali `/...` non autorizzati nei gruppi rimangono limitati allo strumento per i messaggi; i normali turni di chat seguono l'impostazione predefinita configurata.

## Visibilità del contesto ed elenchi consentiti

La sicurezza dei gruppi prevede due controlli distinti:

- **Autorizzazione all'attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, elenchi consentiti specifici per canale).
- **Visibilità del contesto**: quale contesto supplementare viene inserito nel modello (testo di risposte/citazioni, cronologia dei thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw conserva il contesto così come viene ricevuto: gli elenchi consentiti determinano chi può attivare le azioni, non quali frammenti citati o storici siano visibili al modello. Per filtrare anche il contesto supplementare, impostare `contextVisibility`:

| Modalità                | Comportamento                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (predefinita)   | Mantiene il contesto supplementare così come viene ricevuto.                                           |
| `"allowlist"`       | Inserisce il contesto di cronologia/thread/citazioni/inoltri solo per i mittenti nell'elenco consentiti.     |
| `"allowlist_quote"` | `allowlist`, mantenendo inoltre il messaggio esplicitamente citato o a cui si risponde, indipendentemente dal mittente. |

Impostarlo per canale (`channels.<channel>.contextVisibility`), per account (`channels.<channel>.accounts.<accountId>.contextVisibility`) o globalmente (`channels.defaults.contextVisibility`). I canali che recuperano il contesto supplementare (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) applicano i criteri durante la creazione del contesto in ingresso; le combinazioni di criteri sconosciute adottano un comportamento restrittivo e omettono il contesto.

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se si desidera...

| Obiettivo                                         | Impostazione                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Consentire tutti i gruppi, ma rispondere solo alle @menzioni | `groups: { "*": { requireMention: true } }`                |
| Disabilitare tutte le risposte nei gruppi                    | `groupPolicy: "disabled"`                                  |
| Consentire solo gruppi specifici                         | `groups: { "<group-id>": { ... } }` (senza chiave `"*"`)         |
| Consentire solo all'utente di attivare l'agente nei gruppi               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Riutilizzare un unico insieme di mittenti attendibili tra i canali | `groupAllowFrom: ["accessGroup:operators"]`                |

Per gli elenchi consentiti riutilizzabili dei mittenti, vedere [Gruppi di accesso](/it/channels/access-groups).

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (le stanze/i canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti dei forum di Telegram aggiungono `:topic:<threadId>` all'id del gruppo, affinché ogni argomento disponga di una propria sessione.
- Le chat dirette usano la sessione principale (oppure sessioni per mittente, se è configurato `session.dmScope`).
- Gli Heartbeat vengono eseguiti nella sessione Heartbeat configurata (impostazione predefinita: la sessione principale dell'agente); le sessioni di gruppo non eseguono Heartbeat propri.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Schema: messaggi diretti personali + gruppi pubblici (agente singolo)

Sì: questa configurazione funziona bene se il traffico "personale" è costituito da **messaggi diretti** e quello "pubblico" da **gruppi**.

Motivo: in modalità con agente singolo, i messaggi diretti vengono generalmente inseriti nella chiave della sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se si abilita l'esecuzione in sandbox con `mode: "non-main"`, tali sessioni di gruppo vengono eseguite nel backend sandbox configurato, mentre la sessione principale dei messaggi diretti rimane sull'host. Docker è il backend predefinito se non ne viene scelto uno.

Si ottiene così un unico "cervello" dell'agente (spazio di lavoro + memoria condivisi), ma due modalità di esecuzione:

- **Messaggi diretti**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti con restrizioni

<Note>
Se sono necessari spazi di lavoro o profili realmente separati ("personale" e "pubblico" non devono mai mescolarsi), usare un secondo agente + binding. Vedere [Instradamento multi-agente](/it/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Messaggi diretti sull'host, gruppi in sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // i gruppi/canali non sono principali -> vengono eseguiti in sandbox
            scope: "session", // isolamento massimo (un container per gruppo/canale)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Se allow non è vuoto, tutto il resto viene bloccato (deny continua ad avere la precedenza).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="I gruppi vedono solo una cartella nell'elenco consentiti">
    Si desidera che "i gruppi possano vedere solo la cartella X" anziché "nessun accesso all'host"? Mantenere `workspaceAccess: "none"` e montare nella sandbox solo i percorsi nell'elenco consentiti:

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
- Debug dei motivi per cui uno strumento è bloccato: [Sandbox, criteri degli strumenti ed esecuzione con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli sui montaggi bind: [Esecuzione in sandbox](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette dell'interfaccia utente usano `displayName` quando disponibile, nel formato `<channel>:<token>`.
- `#room` è riservato alle stanze/ai canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantenere `#@+._-`). Gli id opachi molto lunghi vengono abbreviati in un token stabile anziché mostrare nell'interfaccia utente gli id completi delle route.

## Criteri per i gruppi

Controllare la gestione dei messaggi di gruppo/stanza per ciascun canale:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // ID utente numerico di Telegram (la configurazione risolve @username)
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

| Criterio       | Comportamento                                                |
| -------------- | ------------------------------------------------------------ |
| `"open"`      | I gruppi ignorano le liste di autorizzazione; il filtro per menzione continua ad applicarsi. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.             |
| `"allowlist"` | Consente solo i gruppi/le stanze che corrispondono alla lista di autorizzazione configurata. |

<AccordionGroup>
  <Accordion title="Note specifiche per canale">
    - `groupPolicy` è distinto dal filtro per menzione (che richiede @menzioni).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usare `groupAllowFrom` (ripiego: `allowFrom` esplicito).
    - Signal: `groupAllowFrom` può corrispondere all'ID del gruppo Signal in ingresso oppure al telefono/UUID del mittente.
    - Le approvazioni di associazione dei messaggi diretti (voci nell'archivio `*-allowFrom`) si applicano solo all'accesso ai messaggi diretti; l'autorizzazione dei mittenti nei gruppi resta esplicitamente regolata dalle liste di autorizzazione dei gruppi.
    - Discord: la lista di autorizzazione usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista di autorizzazione usa `channels.slack.channels`.
    - Matrix: la lista di autorizzazione usa `channels.matrix.groups`. Usare gli ID delle stanze (`!room:server`) o gli alias (`#alias:server`); le chiavi basate sul nome della stanza corrispondono solo con `channels.matrix.dangerouslyAllowNameMatching: true` e le voci non risolte vengono ignorate durante l'esecuzione. Usare `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche le liste di autorizzazione `users` per singola stanza.
    - I messaggi diretti di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: le liste di autorizzazione dei mittenti accettano solo ID utente numerici (`"123456789"`; i prefissi `telegram:`/`tg:` vengono rimossi senza distinzione tra maiuscole e minuscole). Le voci `@username` non corrispondono durante l'esecuzione e generano un avviso nel registro; la configurazione risolve `@username` in ID. Gli ID chat negativi devono trovarsi in `channels.telegram.groups`, non nelle liste di autorizzazione dei mittenti.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se la lista di autorizzazione dei gruppi è vuota, i messaggi di gruppo vengono bloccati.
    - Sicurezza durante l'esecuzione: quando manca completamente un blocco del provider (`channels.<provider>` assente), il criterio dei gruppi passa in modalità chiusa a `allowlist`, invece di ereditare `channels.defaults.groupPolicy`, e il Gateway registra il ripiego una volta per account.

  </Accordion>
</AccordionGroup>

Modello mentale rapido (ordine di valutazione dei messaggi di gruppo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Liste di autorizzazione dei gruppi">
    Liste di autorizzazione dei gruppi (`*.groups`, `*.groupAllowFrom`, lista di autorizzazione specifica del canale).
  </Step>
  <Step title="Filtro per menzione">
    Filtro per menzione (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtro per menzione (predefinito)

I messaggi di gruppo richiedono una menzione, salvo diversa configurazione per il singolo gruppo. I valori predefiniti si trovano per ogni sottosistema in `*.groups."*"`.

Rispondere a un messaggio del bot vale come menzione implicita quando il canale espone i metadati della risposta; anche citare un messaggio del bot può valere come menzione nei canali che espongono i metadati della citazione. Casi integrati attuali: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp e Zalo personale.

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

## Definire l'ambito dei modelli di menzione configurati

I `mentionPatterns` configurati sono espressioni regolari usate come attivatori di ripiego. Vanno usati quando la
piattaforma non espone una menzione nativa del bot o quando si desidera che testo normale
come `openclaw:` valga come menzione. Le menzioni native della piattaforma sono distinte:
quando Discord, Slack, Telegram, Matrix, Signal o un altro canale può dimostrare che il messaggio
ha menzionato esplicitamente il bot, tale menzione nativa attiva comunque l'agente anche se
i modelli di espressioni regolari configurati sono negati.

Per impostazione predefinita, i modelli di menzione configurati si applicano ovunque il canale trasmetta i dati relativi al provider e alla conversazione al rilevamento delle menzioni. Per evitare che modelli generici attivino l'agente in ogni gruppo, definirne l'ambito per canale con `channels.<channel>.mentionPatterns`.

Usare `mode: "deny"` quando i modelli di menzione basati su espressioni regolari devono essere disattivati per impostazione predefinita in un canale, quindi abilitarli in stanze specifiche con `allowIn`:

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

Usare il valore predefinito `mode: "allow"` (oppure omettere `mode`) quando i modelli di menzione basati su espressioni regolari devono applicarsi in modo esteso, quindi disattivarli nelle stanze molto attive con `denyIn`:

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

| Campo           | Effetto                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | I modelli di menzione basati su espressioni regolari sono abilitati, salvo quando l'ID della conversazione è presente in `denyIn`. Questo è il valore predefinito. |
| `mode: "deny"`  | I modelli di menzione basati su espressioni regolari sono disabilitati, salvo quando l'ID della conversazione è presente in `allowIn`. |
| `allowIn`       | ID delle conversazioni in cui i modelli di menzione basati su espressioni regolari sono abilitati in modalità di negazione. |
| `denyIn`        | ID delle conversazioni in cui i modelli di menzione basati su espressioni regolari sono disabilitati. `denyIn` prevale su `allowIn` se entrambi includono lo stesso ID. |

Criteri con ambito per espressioni regolari attualmente supportati:

| Canale   | ID usati in `allowIn` / `denyIn`         |
| -------- | ------------------------------------------------------------ |
| Discord  | ID dei canali Discord.                                       |
| Matrix   | ID delle stanze Matrix.                                      |
| Slack    | ID dei canali Slack.                                         |
| Telegram | ID delle chat di gruppo oppure `chatId:topic:threadId` per gli argomenti dei forum. |
| WhatsApp | ID delle conversazioni WhatsApp, come `123@g.us`.     |

Le configurazioni dei canali a livello di account possono impostare lo stesso criterio in `channels.<channel>.accounts.<accountId>.mentionPatterns` quando il canale supporta più account. Per tale account, il criterio dell'account ha la precedenza sul criterio del canale di primo livello.

<AccordionGroup>
  <Accordion title="Note sul filtro per menzione">
    - `mentionPatterns` sono modelli di espressioni regolari sicuri e senza distinzione tra maiuscole e minuscole; i modelli non validi e le forme non sicure con ripetizioni annidate vengono ignorati (con un avviso).
    - Precedenza dei modelli: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo) prevale su `messages.groupChat.mentionPatterns`; quando nessuno dei due è impostato, i modelli vengono derivati dal nome/dall'emoji dell'identità dell'agente.
    - Il filtro per menzione viene applicato solo quando è possibile rilevare le menzioni (sono configurate menzioni native o `mentionPatterns`).
    - L'inclusione di un gruppo o di un mittente nella lista di autorizzazione non disabilita il filtro per menzione; impostare `requireMention` del gruppo su `false` quando tutti i messaggi devono attivare l'agente.
    - Il contesto automatico del prompt per le chat di gruppo include a ogni turno l'istruzione risolta per la risposta silenziosa; i file dell'area di lavoro non devono duplicare i meccanismi di `NO_REPLY`.
    - I gruppi in cui sono consentite risposte silenziose automatiche trattano come silenziosi i turni del modello completamente vuoti o contenenti solo ragionamento, in modo equivalente a `NO_REPLY`. Le chat dirette non ricevono mai le indicazioni di `NO_REPLY` e le risposte di gruppo che usano soltanto lo strumento per i messaggi restano silenziose evitando di chiamare `message(action=send)`.
    - Per impostazione predefinita, la conversazione di gruppo ambientale sempre attiva usa la semantica delle richieste utente. Impostare `messages.groupChat.unmentionedInbound: "room_event"` per inviarla invece come contesto silenzioso. Consultare [Eventi ambientali delle stanze](/it/channels/ambient-room-events) per esempi di configurazione.
    - Gli eventi delle stanze non vengono archiviati come false richieste utente e il testo privato dell'assistente proveniente da eventi delle stanze privi di strumenti per i messaggi non viene riprodotto come cronologia della chat.
    - I valori predefiniti di Discord si trovano in `channels.discord.guilds."*"` (sostituibili per singolo server/canale).
    - Il contesto della cronologia dei gruppi viene racchiuso in modo uniforme tra i canali. I gruppi con filtro per menzione conservano i messaggi in sospeso ignorati; i gruppi sempre attivi possono anche conservare i messaggi recenti elaborati nella stanza, se il canale lo supporta. Usare `messages.groupChat.historyLimit` come valore predefinito globale e `channels.<channel>.historyLimit` (oppure `channels.<channel>.accounts.*.historyLimit`) per le sostituzioni. Impostare `0` per disabilitare.

  </Accordion>
</AccordionGroup>

## Restrizioni degli strumenti per gruppo/canale (facoltative)

Alcune configurazioni dei canali consentono di limitare gli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consente/nega gli strumenti per l'intero gruppo (`allow`, `alsoAllow`, `deny`; la negazione prevale).
- `toolsBySender`: sostituzioni per singolo mittente all'interno del gruppo. Usare prefissi di chiave espliciti: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e il carattere jolly `"*"`. Gli ID dei canali usano gli ID canonici dei canali OpenClaw; gli alias come `teams` vengono normalizzati in `msteams`. Le chiavi legacy senza prefisso sono ancora accettate, corrispondono solo come `id:` e generano un avviso di deprecazione nel registro.

Ordine di risoluzione (prevale il più specifico):

<Steps>
  <Step title="toolsBySender del gruppo">
    Corrispondenza di `toolsBySender` per gruppo/canale.
  </Step>
  <Step title="Strumenti del gruppo">
    `tools` per gruppo/canale.
  </Step>
  <Step title="toolsBySender predefinito">
    Corrispondenza di `toolsBySender` predefinita (`"*"`).
  </Step>
  <Step title="Strumenti predefiniti">
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
Le restrizioni degli strumenti per gruppi/canali vengono applicate in aggiunta alla policy globale/dell'agente relativa agli strumenti (il divieto ha comunque la precedenza). Alcuni canali usano una struttura di annidamento diversa per stanze/canali (ad es., Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Elenchi di autorizzazione dei gruppi

Quando è configurato `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, le chiavi fungono da elenco di autorizzazione dei gruppi. Usare `"*"` per consentire tutti i gruppi continuando a impostare il comportamento predefinito per le menzioni.

<Warning>
Errore comune: l'approvazione dell'associazione dei messaggi diretti non equivale all'autorizzazione dei gruppi. Per i canali che supportano l'associazione dei messaggi diretti, l'archivio delle associazioni sblocca esclusivamente i messaggi diretti. I comandi di gruppo richiedono comunque l'autorizzazione esplicita dei mittenti del gruppo tramite elenchi di autorizzazione nella configurazione, come `groupAllowFrom`, oppure tramite il fallback di configurazione documentato per il canale.
</Warning>

Configurazioni comuni (copiare e incollare):

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
  <Tab title="Consenti tutti i gruppi ma richiedi una menzione">
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

I proprietari dei gruppi possono attivare o disattivare l'attivazione per ciascun gruppo con un messaggio autonomo:

- `/activation mention`
- `/activation always`

`/activation` è un comando principale riservato al proprietario e si applica solo alle chat di gruppo. Per proprietario si intende un mittente che corrisponde a `commands.ownerAllowFrom`; gli elenchi `allowFrom` del canale controllano solo l'accesso ordinario al canale e ai comandi. La modalità memorizzata sostituisce il valore `requireMention` del gruppo nei canali che la consultano (Google Chat, QQBot, Telegram, WhatsApp) e l'introduzione del prompt di sistema del gruppo riflette ovunque la modalità attiva.

## Campi del contesto

I payload in ingresso dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo delle menzioni)
- Gli argomenti dei forum Telegram includono anche `MessageThreadId` e `IsForum`.

Il prompt di sistema dell'agente include un'introduzione al gruppo nel primo turno di una nuova sessione di gruppo (e dopo la modifica di `/activation`). Ricorda al modello di rispondere come una persona, ridurre al minimo le righe vuote, rispettare la normale spaziatura delle chat ed evitare di digitare sequenze letterali `\n`. I canali la cui modalità tabella dichiarata non conserva le tabelle native o non elaborate sconsigliano anche l'uso delle tabelle Markdown. I nomi dei gruppi e le etichette dei partecipanti provenienti dai canali vengono visualizzati come metadati non attendibili delimitati, non come istruzioni di sistema incorporate.

## Dettagli specifici di iMessage

- Preferire `chat_id:<id>` per l'instradamento o l'inserimento negli elenchi di autorizzazione.
- Elencare le chat: `imsg chats --limit 20`.
- Le risposte di gruppo vengono sempre inviate allo stesso `chat_id`.

## Prompt di sistema di WhatsApp

Consultare [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema di WhatsApp, incluse la risoluzione dei prompt di gruppo e diretti, il comportamento dei caratteri jolly e la semantica delle sostituzioni a livello di account.

## Dettagli specifici di WhatsApp

Consultare [Messaggi di gruppo](/it/channels/group-messages) per il comportamento specifico di WhatsApp (inserimento della cronologia e dettagli sulla gestione delle menzioni).

## Argomenti correlati

- [Gruppi di trasmissione](/it/channels/broadcast-groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Associazione](/it/channels/pairing)
