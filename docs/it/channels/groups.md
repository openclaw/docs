---
read_when:
    - Modifica del comportamento delle chat di gruppo o del controllo tramite menzioni
    - Limitare mentionPatterns a conversazioni di gruppo specifiche
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo su tutte le superfici (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-06-27T17:10:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw tratta le chat di gruppo in modo coerente su tutte le superfici: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Per le stanze sempre attive che devono fornire contesto silenzioso a meno che l'agente non invii esplicitamente un messaggio visibile, consulta [Eventi ambientali della stanza](/it/channels/ambient-room-events).

## Introduzione per principianti (2 minuti)

OpenClaw "vive" sui tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato. Se **tu** sei in un gruppo, OpenClaw può vedere quel gruppo e rispondere lì.

Comportamento predefinito:

- I gruppi sono limitati (`groupPolicy: "allowlist"`).
- Le risposte richiedono una menzione, a meno che tu non disabiliti esplicitamente il gating delle menzioni.
- Le risposte visibili nei gruppi/canali usano lo strumento `message` per impostazione predefinita.

Traduzione: i mittenti in allowlist possono attivare OpenClaw menzionandolo.

<Note>
**TL;DR**

- **L'accesso ai DM** è controllato da `*.allowFrom`.
- **L'accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **L'attivazione delle risposte** è controllata dal gating delle menzioni (`requireMention`, `/activation`).

</Note>

Flusso rapido (cosa succede a un messaggio di gruppo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Risposte visibili

Per le normali richieste di gruppo/canale, OpenClaw usa per impostazione predefinita `messages.groupChat.visibleReplies: "automatic"`. Il testo finale dell'assistente viene pubblicato tramite il percorso legacy delle risposte visibili, a meno che tu non configuri la stanza per usare solo l'output tramite strumento message.

Usa `messages.groupChat.visibleReplies: "message_tool"` quando una stanza condivisa deve lasciare che sia l'agente a decidere quando parlare chiamando `message(action=send)`. Funziona meglio per le stanze di gruppo supportate da modelli di ultima generazione e affidabili con gli strumenti, come GPT 5.5. Se il modello non usa quello strumento e restituisce testo finale sostanziale, OpenClaw mantiene privato quel testo finale invece di pubblicarlo nella stanza.

Usa `"automatic"` per modelli più deboli o runtime che non comprendono in modo affidabile la consegna solo tramite strumento. In modalità automatica, il testo finale dell'assistente è il percorso della risposta visibile alla fonte, quindi un modello che non riesce a chiamare in modo coerente `message(action=send)` può comunque rispondere normalmente.

In modalità automatica, le normali risposte finali testuali vengono pubblicate direttamente nella stanza. Se la risposta visibile richiede file, immagini o altri allegati, l'agente può comunque usare `message(action=send)` per quell'allegato invece di provare a forzarlo nella risposta testuale finale.

Se lo strumento message non è disponibile con la policy degli strumenti attiva, OpenClaw ripiega sulle risposte visibili automatiche invece di sopprimere silenziosamente la risposta.
`openclaw doctor` avvisa di questa mancata corrispondenza.

Per le chat dirette e qualsiasi altro evento sorgente, usa `messages.visibleReplies: "message_tool"` per applicare globalmente lo stesso comportamento di risposta visibile solo tramite strumento. I turni diretti interni di WebChat usano per impostazione predefinita la consegna automatica della risposta finale, così Pi e Codex ricevono lo stesso contratto di risposta visibile. Imposta `messages.visibleReplies: "message_tool"` per richiedere intenzionalmente `message(action=send)` per l'output visibile. `messages.groupChat.visibleReplies` resta l'override più specifico per le stanze di gruppo/canale.

Questo sostituisce il vecchio schema che costringeva il modello a rispondere `NO_REPLY` per la maggior parte dei turni in modalità lurk. In modalità solo tramite strumento, il prompt non definisce un contratto `NO_REPLY`. Non fare nulla di visibile significa semplicemente non chiamare lo strumento message.

I binding di conversazione di proprietà dei Plugin sono l'eccezione. Una volta che un Plugin associa un thread e rivendica il turno in ingresso, la risposta restituita dal Plugin è la risposta visibile del binding; non richiede `message(action=send)`. Quella risposta è output del runtime del Plugin, non testo finale privato del modello.

Gli indicatori di digitazione vengono comunque inviati per le richieste dirette di gruppo. Gli eventi ambientali delle stanze sempre attive, quando abilitati, rimangono rigorosi e silenziosi a meno che l'agente non chiami lo strumento message.

Le sessioni sopprimono per impostazione predefinita i riepiloghi dettagliati di strumenti/avanzamento. Usa `/verbose on`
per mostrare questi riepiloghi per la sessione corrente durante il debug, e
`/verbose off` per tornare al comportamento con sole risposte finali. Lo stesso stato verbose
si applica a chat dirette, gruppi, canali e argomenti dei forum.

Per inviare le conversazioni di gruppo sempre attive non menzionate come contesto silenzioso della stanza invece che come richieste utente, usa [Eventi ambientali della stanza](/it/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

L'impostazione predefinita è `unmentionedInbound: "user_request"`.

I messaggi menzionati, i comandi, le richieste di interruzione e i DM rimangono richieste utente.

Per richiedere che l'output visibile passi attraverso lo strumento message per le richieste di gruppo/canale:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Il gateway ricarica a caldo la configurazione `messages` dopo il salvataggio del file. Riavvia solo
quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato nel deployment.

Per richiedere che l'output visibile passi attraverso lo strumento message per ogni chat sorgente:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

I comandi slash nativi (Discord, Telegram e altre superfici con supporto per comandi nativi) ignorano `visibleReplies: "message_tool"` e rispondono sempre in modo visibile, così l'interfaccia comandi nativa del canale riceve la risposta prevista. Questo si applica solo ai turni di comando nativi validati; i comandi `/...` digitati come testo e i normali turni di chat continuano a seguire l'impostazione predefinita del gruppo configurata.

## Visibilità del contesto ed elenchi consentiti

Nella sicurezza dei gruppi sono coinvolti due controlli diversi:

- **Autorizzazione di attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, elenchi consentiti specifici del canale).
- **Visibilità del contesto**: quale contesto supplementare viene iniettato nel modello (testo della risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw dà priorità al normale comportamento della chat e mantiene il contesto per lo più così come ricevuto. Questo significa che gli elenchi consentiti decidono principalmente chi può attivare azioni, non un confine universale di redazione per ogni frammento citato o storico.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Alcuni canali applicano già un filtro basato sul mittente per il contesto supplementare in percorsi specifici (per esempio l'inizializzazione dei thread Slack, le ricerche di risposte/thread Matrix).
    - Altri canali trasmettono ancora il contesto di citazioni/risposte/inoltri così come ricevuto.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (predefinito) mantiene il comportamento corrente così come ricevuto.
    - `contextVisibility: "allowlist"` filtra il contesto supplementare limitandolo ai mittenti nell'elenco consentito.
    - `contextVisibility: "allowlist_quote"` è `allowlist` più un'eccezione esplicita per citazione/risposta.

    Finché questo modello di rafforzamento non sarà implementato in modo coerente su tutti i canali, aspettati differenze tra le superfici.

  </Accordion>
</AccordionGroup>

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se vuoi...

| Obiettivo                                    | Cosa impostare                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Consentire tutti i gruppi ma rispondere solo alle @menzioni | `groups: { "*": { requireMention: true } }`                |
| Disabilitare tutte le risposte nei gruppi    | `groupPolicy: "disabled"`                                  |
| Solo gruppi specifici                        | `groups: { "<group-id>": { ... } }` (nessuna chiave `"*"` ) |
| Solo tu puoi attivare nei gruppi             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Riutilizzare un insieme di mittenti attendibili tra canali | `groupAllowFrom: ["accessGroup:operators"]`                |

Per elenchi consentiti di mittenti riutilizzabili, consulta [Gruppi di accesso](/it/channels/access-groups).

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti dei forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni argomento ha la propria sessione.
- Le chat dirette usano la sessione principale (o una sessione per mittente, se configurata).
- Gli Heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Schema: DM personali + gruppi pubblici (agente singolo)

Sì: funziona bene se il traffico "personale" è costituito da **DM** e il traffico "pubblico" da **gruppi**.

Motivo: in modalità agente singolo, i DM in genere finiscono nella chiave di sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite nel backend sandbox configurato mentre la sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno.

Questo ti dà un unico "cervello" dell'agente (workspace + memoria condivisi), ma due posture di esecuzione:

- **DM**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati

<Note>
Se ti servono workspace/persona realmente separati ("personale" e "pubblico" non devono mai mescolarsi), usa un secondo agente + binding. Consulta [Instradamento multi-agente](/it/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    Vuoi che "i gruppi possano vedere solo la cartella X" invece di "nessun accesso all'host"? Mantieni `workspaceAccess: "none"` e monta nella sandbox solo i percorsi nell'elenco consentito:

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

Correlati:

- Chiavi di configurazione e valori predefiniti: [Configurazione del Gateway](/it/gateway/config-agents#agentsdefaultssandbox)
- Debug del motivo per cui uno strumento è bloccato: [Sandbox vs criteri degli strumenti vs elevazione](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli dei mount bind: [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette dell'interfaccia usano `displayName` quando disponibile, formattato come `<channel>:<token>`.
- `#room` è riservato a stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantiene `#@+._-`).

## Criterio di gruppo

Controlla come vengono gestiti i messaggi di gruppo/stanza per canale:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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
| `"open"`      | I gruppi ignorano le allowlist; il gating delle menzioni resta applicato.      |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.                              |
| `"allowlist"` | Consente solo gruppi/stanze che corrispondono alla allowlist configurata.      |

<AccordionGroup>
  <Accordion title="Note per canale">
    - `groupPolicy` è separato dal gating delle menzioni (che richiede @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
    - Signal: `groupAllowFrom` può corrispondere all'id del gruppo Signal in ingresso oppure al telefono/UUID del mittente.
    - Le approvazioni di abbinamento DM (voci di archiviazione `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione dei mittenti nei gruppi resta esplicita nelle allowlist dei gruppi.
    - Discord: la allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: la allowlist usa `channels.slack.channels`.
    - Matrix: la allowlist usa `channels.matrix.groups`. Preferisci ID stanza o alias; la ricerca del nome delle stanze unite è best-effort e i nomi non risolti vengono ignorati a runtime. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per stanza.
    - I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La allowlist di Telegram può corrispondere a ID utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nomi utente (`"@alice"` o `"alice"`); i prefissi non distinguono maiuscole e minuscole.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se la allowlist del gruppo è vuota, i messaggi di gruppo vengono bloccati.
    - Sicurezza a runtime: quando manca completamente un blocco provider (`channels.<provider>` assente), il criterio di gruppo usa come fallback una modalità fail-closed (in genere `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modello mentale rapido (ordine di valutazione per i messaggi di gruppo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlist di gruppo">
    Allowlist di gruppo (`*.groups`, `*.groupAllowFrom`, allowlist specifica del canale).
  </Step>
  <Step title="Gating delle menzioni">
    Gating delle menzioni (`requireMention`, `/activation`).
  </Step>
</Steps>

## Gating delle menzioni (predefinito)

I messaggi di gruppo richiedono una menzione, salvo override per gruppo. I valori predefiniti risiedono per sottosistema sotto `*.groups."*"`.

Rispondere a un messaggio del bot conta come menzione implicita quando il canale supporta i metadati di risposta. Anche citare un messaggio del bot può contare come menzione implicita nei canali che espongono metadati di citazione. I casi integrati attuali includono Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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

## Definire l'ambito dei pattern di menzione configurati

I `mentionPatterns` configurati sono trigger regex di fallback. Usali quando la
piattaforma non espone una menzione nativa del bot oppure quando vuoi che testo
semplice come `openclaw:` conti come menzione. Le menzioni native della piattaforma
sono separate: quando Discord, Slack, Telegram, Matrix o un altro canale può provare
che il messaggio ha menzionato esplicitamente il bot, quella menzione nativa attiva
comunque il bot anche se i pattern regex configurati sono negati.

Per impostazione predefinita, i pattern di menzione configurati si applicano ovunque
quel canale passi i fatti di provider e conversazione al rilevamento delle menzioni.
Per evitare che pattern ampi risveglino l'agente in ogni gruppo, definiscine l'ambito
per canale con `channels.<channel>.mentionPatterns`.

Usa `mode: "deny"` quando i pattern regex di menzione devono essere disattivati per
impostazione predefinita per un canale, poi abilita stanze specifiche con `allowIn`:

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

Usa il `mode: "allow"` predefinito (oppure ometti `mode`) quando i pattern regex di
menzione devono applicarsi ampiamente, poi disattivali nelle stanze rumorose con `denyIn`:

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

| Campo           | Effetto                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `mode: "allow"` | I pattern regex di menzione sono abilitati salvo che l'ID conversazione sia in `denyIn`. Questo è il valore predefinito.              |
| `mode: "deny"`  | I pattern regex di menzione sono disabilitati salvo che l'ID conversazione sia in `allowIn`.                                         |
| `allowIn`       | ID conversazione in cui i pattern regex di menzione sono abilitati in modalità deny.                                                  |
| `denyIn`        | ID conversazione in cui i pattern regex di menzione sono disabilitati. `denyIn` prevale su `allowIn` se entrambi includono lo stesso ID. |

Criterio regex con ambito supportato oggi:

| Canale   | ID usati in `allowIn` / `denyIn`                                  |
| -------- | ----------------------------------------------------------------- |
| Discord  | ID canale Discord.                                                |
| Matrix   | ID stanza Matrix.                                                 |
| Slack    | ID canale Slack.                                                  |
| Telegram | ID chat di gruppo, oppure `chatId:topic:threadId` per argomenti forum. |
| WhatsApp | ID conversazione WhatsApp come `123@g.us`.                        |

Le configurazioni di canale a livello di account possono impostare lo stesso criterio sotto
`channels.<channel>.accounts.<accountId>.mentionPatterns` quando quel canale
supporta più account. Il criterio dell'account ha precedenza sul criterio di canale
di primo livello per quell'account.

<AccordionGroup>
  <Accordion title="Note sul gating delle menzioni">
    - `mentionPatterns` sono pattern regex sicuri senza distinzione tra maiuscole e minuscole; pattern non validi e forme non sicure con ripetizioni annidate vengono ignorati.
    - Le superfici che forniscono menzioni esplicite passano comunque; i pattern regex configurati sono un fallback.
    - `channels.<channel>.mentionPatterns.mode: "deny"` disabilita per impostazione predefinita i pattern di menzione configurati per quel canale; riabilita conversazioni selezionate con `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` disabilita i pattern di menzione configurati per ID conversazione specifici, mentre le @mention native della piattaforma passano comunque.
    - Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
    - Il gating delle menzioni viene applicato solo quando il rilevamento delle menzioni è possibile (menzioni native o `mentionPatterns` configurati).
    - Inserire un gruppo o un mittente in allowlist non disabilita il gating delle menzioni; imposta `requireMention` di quel gruppo su `false` quando tutti i messaggi devono attivare.
    - Il contesto automatico del prompt della chat di gruppo trasporta a ogni turno l'istruzione di risposta silenziosa risolta; i file del workspace non devono duplicare i meccanismi `NO_REPLY`.
    - I gruppi in cui sono consentite risposte silenziose automatiche trattano turni modello vuoti puliti o solo di ragionamento come silenziosi, equivalenti a `NO_REPLY`. Le chat dirette non ricevono mai indicazioni `NO_REPLY` e le risposte di gruppo solo tramite strumento messaggi restano silenziose non chiamando `message(action=send)`.
    - Le conversazioni di gruppo ambientali sempre attive usano per impostazione predefinita la semantica di richiesta utente. Imposta `messages.groupChat.unmentionedInbound: "room_event"` per inviarle invece come contesto silenzioso. Vedi [Eventi stanza ambientali](/it/channels/ambient-room-events) per esempi di configurazione.
    - Gli eventi stanza non vengono archiviati come richieste utente fittizie e il testo privato dell'assistente proveniente da eventi stanza senza strumento messaggi non viene riprodotto come cronologia chat.
    - I valori predefiniti di Discord risiedono in `channels.discord.guilds."*"` (sovrascrivibili per guild/canale).
    - Il contesto della cronologia di gruppo viene incapsulato uniformemente tra i canali. I gruppi con gating delle menzioni mantengono i messaggi saltati in sospeso; i gruppi sempre attivi possono conservare anche messaggi stanza elaborati di recente quando il canale lo supporta. Usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disabilitare.

  </Accordion>
</AccordionGroup>

## Restrizioni degli strumenti per gruppo/canale (facoltativo)

Alcune configurazioni di canale supportano la limitazione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consente/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo. Usa prefissi di chiave espliciti: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e carattere jolly `"*"`. Gli ID canale usano gli ID canale canonici di OpenClaw; alias come `teams` vengono normalizzati in `msteams`. Le chiavi legacy senza prefisso sono ancora accettate e corrispondono solo come `id:`.

Ordine di risoluzione (vince il più specifico):

<Steps>
  <Step title="toolsBySender del gruppo">
    Corrispondenza `toolsBySender` del gruppo/canale.
  </Step>
  <Step title="Strumenti del gruppo">
    `tools` del gruppo/canale.
  </Step>
  <Step title="toolsBySender predefinito">
    Corrispondenza `toolsBySender` predefinita (`"*"`).
  </Step>
  <Step title="Strumenti predefiniti">
    `tools` predefiniti (`"*"`).
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
Le restrizioni degli strumenti per gruppo/canale vengono applicate in aggiunta al criterio globale/di agente sugli strumenti (deny prevale comunque). Alcuni canali usano annidamenti diversi per stanze/canali (ad esempio Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist di gruppo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come allowlist di gruppo. Usa `"*"` per consentire tutti i gruppi continuando a impostare il comportamento predefinito delle menzioni.

<Warning>
Confusione comune: l'approvazione dell'abbinamento DM non è la stessa cosa dell'autorizzazione di gruppo. Per i canali che supportano l'abbinamento DM, l'archivio di abbinamento sblocca solo i DM. I comandi di gruppo richiedono comunque un'autorizzazione esplicita del mittente del gruppo dalle liste consentite di configurazione, come `groupAllowFrom`, o dal fallback di configurazione documentato per quel canale.
</Warning>

Intenti comuni (copia/incolla):

<Tabs>
  <Tab title="Disabilita tutte le risposte di gruppo">
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
  <Tab title="Consenti tutti i gruppi ma richiedi la menzione">
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
  <Tab title="Attivazioni solo proprietario (WhatsApp)">
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

I proprietari dei gruppi possono attivare o disattivare l'attivazione per gruppo:

- `/activation mention`
- `/activation always`

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso quando non è impostato). Invia il comando come messaggio autonomo. Le altre superfici attualmente ignorano `/activation`.

## Campi di contesto

I payload in ingresso dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo di menzione)
- Anche gli argomenti del forum Telegram includono `MessageThreadId` e `IsForum`.

Il prompt di sistema dell'agente include un'introduzione al gruppo al primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come una persona, ridurre al minimo le righe vuote e seguire la normale spaziatura della chat, evitando di digitare sequenze letterali `\n`. I gruppi non Telegram sconsigliano anche le tabelle Markdown; le indicazioni sul testo ricco di Telegram provengono dal prompt del canale Telegram. I nomi dei gruppi e le etichette dei partecipanti provenienti dal canale vengono renderizzati come metadati non attendibili racchiusi in blocchi delimitati, non come istruzioni di sistema in linea.

## Specifiche di iMessage

- Preferisci `chat_id:<id>` per il routing o l'inserimento nella lista consentita.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte di gruppo tornano sempre allo stesso `chat_id`.

## Prompt di sistema WhatsApp

Vedi [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema WhatsApp, incluse la risoluzione dei prompt di gruppo e diretti, il comportamento dei caratteri jolly e la semantica di override dell'account.

## Specifiche di WhatsApp

Vedi [Messaggi di gruppo](/it/channels/group-messages) per il comportamento solo WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).

## Correlati

- [Gruppi broadcast](/it/channels/broadcast-groups)
- [Routing dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Abbinamento](/it/channels/pairing)
