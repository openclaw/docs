---
read_when:
    - Modificare il comportamento delle chat di gruppo o il controllo tramite menzioni
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo sulle diverse superfici (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-05-11T20:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw tratta le chat di gruppo in modo coerente su tutte le superfici: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduzione per principianti (2 minuti)

OpenClaw "vive" sui tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato. Se **tu** sei in un gruppo, OpenClaw può vedere quel gruppo e rispondere lì.

Comportamento predefinito:

- I gruppi sono limitati (`groupPolicy: "allowlist"`).
- Le risposte richiedono una menzione, a meno che tu non disabiliti esplicitamente il filtro tramite menzione.
- Le normali risposte finali in gruppi/canali sono private per impostazione predefinita. L'output visibile nella stanza usa lo strumento `message`.

Traduzione: i mittenti nella allowlist possono attivare OpenClaw menzionandolo.

<Note>
**TL;DR**

- **Accesso ai messaggi diretti** è controllato da `*.allowFrom`.
- **Accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Attivazione delle risposte** è controllata dal filtro tramite menzione (`requireMention`, `/activation`).

</Note>

Flusso rapido (cosa accade a un messaggio di gruppo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Risposte visibili

Per le stanze di gruppo/canale, OpenClaw usa per impostazione predefinita `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` scrive questo valore predefinito nelle configurazioni dei canali configurati che lo omettono.
Ciò significa che l'agente continua a elaborare il turno e può aggiornare lo stato di memoria/sessione, ma la sua normale risposta finale non viene pubblicata automaticamente nella stanza. Per parlare in modo visibile, l'agente usa `message(action=send)`.

Questo valore predefinito dipende da un modello/runtime che chiama gli strumenti in modo affidabile. Se i log mostrano
testo dell'assistente ma `didSendViaMessagingTool: false`, il modello ha risposto
privatamente invece di chiamare lo strumento di messaggistica. Non è un errore di invio
Discord/Slack/Telegram. Usa un modello affidabile nelle chiamate agli strumenti per
le sessioni di gruppo/canale, oppure imposta
`messages.groupChat.visibleReplies: "automatic"` per ripristinare le risposte finali
visibili legacy.

Se lo strumento di messaggistica non è disponibile con la policy degli strumenti attiva, OpenClaw ripiega
sulle risposte visibili automatiche invece di sopprimere silenziosamente la risposta.
`openclaw doctor` avvisa di questa incoerenza.

Per le chat dirette e qualsiasi altro turno di origine, usa `messages.visibleReplies: "message_tool"` per applicare globalmente lo stesso comportamento di risposta visibile solo tramite strumento. Anche gli harness possono scegliere questo come valore predefinito non impostato; l'harness Codex lo fa per le chat dirette in modalità Codex. `messages.groupChat.visibleReplies` rimane l'override più specifico per le stanze di gruppo/canale.

Questo sostituisce il vecchio schema che forzava il modello a rispondere `NO_REPLY` per la maggior parte dei turni in modalità di ascolto passivo. In modalità solo strumenti, non fare nulla di visibile significa semplicemente non chiamare lo strumento di messaggistica.

Gli indicatori di digitazione vengono comunque inviati mentre l'agente lavora in modalità solo strumenti. La modalità di digitazione predefinita per i gruppi passa da "message" a "instant" per questi turni, perché potrebbe non esserci mai un normale testo di messaggio dell'assistente prima che l'agente decida se chiamare lo strumento di messaggistica. La configurazione esplicita della modalità di digitazione ha comunque la precedenza.

Per ripristinare le risposte finali automatiche legacy per le stanze di gruppo/canale:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Il gateway ricarica a caldo la configurazione `messages` dopo il salvataggio del file. Riavvia solo
quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato nella distribuzione.

Per richiedere che l'output visibile passi attraverso lo strumento di messaggistica per ogni chat di origine:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

I comandi slash nativi (Discord, Telegram e altre superfici con supporto nativo ai comandi) bypassano `visibleReplies: "message_tool"` e rispondono sempre in modo visibile, così l'interfaccia dei comandi nativa del canale riceve la risposta prevista. Questo si applica solo ai turni di comando nativi validati; i comandi `/...` digitati come testo e i turni di chat ordinari seguono comunque il valore predefinito configurato per il gruppo.

## Visibilità del contesto e allowlist

Nella sicurezza dei gruppi sono coinvolti due controlli diversi:

- **Autorizzazione all'attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist specifiche del canale).
- **Visibilità del contesto**: quale contesto supplementare viene iniettato nel modello (testo di risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw dà priorità al normale comportamento di chat e mantiene il contesto per lo più come ricevuto. Ciò significa che le allowlist decidono principalmente chi può attivare azioni, non un confine di redazione universale per ogni frammento citato o storico.

<AccordionGroup>
  <Accordion title="Il comportamento attuale è specifico del canale">
    - Alcuni canali applicano già il filtro basato sul mittente per il contesto supplementare in percorsi specifici (per esempio il seeding dei thread Slack, le ricerche di risposte/thread Matrix).
    - Altri canali passano ancora il contesto di citazione/risposta/inoltro così come ricevuto.

  </Accordion>
  <Accordion title="Direzione di rafforzamento (pianificata)">
    - `contextVisibility: "all"` (predefinito) mantiene il comportamento attuale così come ricevuto.
    - `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti nella allowlist.
    - `contextVisibility: "allowlist_quote"` è `allowlist` più un'eccezione esplicita per citazione/risposta.

    Finché questo modello di rafforzamento non sarà implementato in modo coerente tra i canali, aspettati differenze in base alla superficie.

  </Accordion>
</AccordionGroup>

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se vuoi...

| Obiettivo                                    | Cosa impostare                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Consentire tutti i gruppi ma rispondere solo alle @menzioni | `groups: { "*": { requireMention: true } }`                |
| Disabilitare tutte le risposte di gruppo     | `groupPolicy: "disabled"`                                  |
| Solo gruppi specifici                        | `groups: { "<group-id>": { ... } }` (nessuna chiave `"*"` ) |
| Solo tu puoi attivare nei gruppi             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Riutilizzare un set di mittenti attendibili tra canali | `groupAllowFrom: ["accessGroup:operators"]`                |

Per allowlist di mittenti riutilizzabili, consulta [Gruppi di accesso](/it/channels/access-groups).

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti dei forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni argomento ha la propria sessione.
- Le chat dirette usano la sessione principale (o per mittente, se configurato).
- Gli Heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Schema: messaggi diretti personali + gruppi pubblici (agente singolo)

Sì: funziona bene se il tuo traffico "personale" è costituito da **messaggi diretti** e il tuo traffico "pubblico" da **gruppi**.

Perché: in modalità agente singolo, i messaggi diretti in genere arrivano nella chiave di sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite nel backend sandbox configurato, mentre la tua sessione principale di messaggi diretti resta sull'host. Docker è il backend predefinito se non ne scegli uno.

Questo ti dà un unico "cervello" dell'agente (workspace + memoria condivise), ma due posture di esecuzione:

- **Messaggi diretti**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati

<Note>
Se hai bisogno di workspace/persona realmente separati ("personale" e "pubblico" non devono mai mescolarsi), usa un secondo agente + binding. Consulta [Routing multi-agente](/it/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Messaggi diretti sull'host, gruppi in sandbox">
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
  <Tab title="I gruppi vedono solo una cartella nella allowlist">
    Vuoi "i gruppi possono vedere solo la cartella X" invece di "nessun accesso all'host"? Mantieni `workspaceAccess: "none"` e monta nella sandbox solo i percorsi nella allowlist:

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

- Chiavi di configurazione e valori predefiniti: [Configurazione Gateway](/it/gateway/config-agents#agentsdefaultssandbox)
- Debug del motivo per cui uno strumento è bloccato: [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli sui bind mount: [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette dell'interfaccia utente usano `displayName` quando disponibile, formattato come `<channel>:<token>`.
- `#room` è riservato a stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantiene `#@+._-`).

## Policy dei gruppi

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

| Policy        | Comportamento                                               |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | I gruppi bypassano le allowlist; il filtro tramite menzione si applica comunque. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.             |
| `"allowlist"` | Consente solo i gruppi/stanze che corrispondono alla allowlist configurata. |

<AccordionGroup>
  <Accordion title="Note per canale">
    - `groupPolicy` è separato dal controllo basato sulle menzioni (che richiede @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
    - Signal: `groupAllowFrom` può corrispondere all'id del gruppo Signal in ingresso oppure al telefono/UUID del mittente.
    - Le approvazioni di abbinamento DM (voci dello store `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione del mittente nei gruppi resta esplicita tramite allowlist di gruppo.
    - Discord: l'allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: l'allowlist usa `channels.slack.channels`.
    - Matrix: l'allowlist usa `channels.matrix.groups`. Preferisci ID o alias delle stanze; la risoluzione dei nomi delle stanze unite è best-effort e i nomi non risolti vengono ignorati a runtime. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per stanza.
    - I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - L'allowlist di Telegram può corrispondere a ID utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nomi utente (`"@alice"` o `"alice"`); i prefissi non distinguono tra maiuscole e minuscole.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se l'allowlist del gruppo è vuota, i messaggi di gruppo vengono bloccati.
    - Sicurezza a runtime: quando manca completamente un blocco del provider (`channels.<provider>` assente), la policy di gruppo ripiega su una modalità fail-closed (in genere `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

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
  <Step title="Controllo basato sulle menzioni">
    Controllo basato sulle menzioni (`requireMention`, `/activation`).
  </Step>
</Steps>

## Controllo basato sulle menzioni (predefinito)

I messaggi di gruppo richiedono una menzione, salvo override per gruppo. I valori predefiniti si trovano per sottosistema in `*.groups."*"`.

Rispondere a un messaggio del bot conta come menzione implicita quando il canale supporta i metadati di risposta. Anche citare un messaggio del bot può contare come menzione implicita sui canali che espongono metadati di citazione. I casi integrati attuali includono Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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

<AccordionGroup>
  <Accordion title="Note sul controllo basato sulle menzioni">
    - `mentionPatterns` sono pattern regex sicuri che non distinguono tra maiuscole e minuscole; i pattern non validi e le forme non sicure con ripetizioni annidate vengono ignorati.
    - Le superfici che forniscono menzioni esplicite continuano a passare; i pattern sono un fallback.
    - Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
    - Il controllo basato sulle menzioni viene applicato solo quando il rilevamento delle menzioni è possibile (menzioni native o `mentionPatterns` configurati).
    - Inserire un gruppo o un mittente in allowlist non disattiva il controllo basato sulle menzioni; imposta `requireMention` del gruppo a `false` quando tutti i messaggi devono attivare una risposta.
    - Il contesto del prompt della chat di gruppo trasporta a ogni turno l'istruzione di risposta silenziosa risolta; i file del workspace non dovrebbero duplicare i meccanismi `NO_REPLY`.
    - I gruppi in cui sono consentite risposte silenziose trattano i turni del modello vuoti puliti o solo di ragionamento come silenziosi, equivalenti a `NO_REPLY`. Le chat dirette fanno lo stesso solo quando le risposte silenziose dirette sono esplicitamente consentite; altrimenti le risposte vuote restano turni agente falliti.
    - I valori predefiniti di Discord si trovano in `channels.discord.guilds."*"` (sovrascrivibili per guild/canale).
    - Il contesto della cronologia di gruppo è incapsulato uniformemente tra i canali. I gruppi con controllo basato sulle menzioni mantengono i messaggi saltati in sospeso; i gruppi sempre attivi possono anche conservare i messaggi recenti elaborati della stanza quando il canale lo supporta. Usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disattivare.

  </Accordion>
</AccordionGroup>

## Restrizioni degli strumenti per gruppo/canale (opzionale)

Alcune configurazioni di canale supportano la limitazione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo. Usa prefissi di chiave espliciti: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e wildcard `"*"`. Gli ID canale usano gli ID canale canonici di OpenClaw; alias come `teams` vengono normalizzati in `msteams`. Le chiavi legacy senza prefisso sono ancora accettate e abbinate solo come `id:`.

Ordine di risoluzione (vince il più specifico):

<Steps>
  <Step title="toolsBySender di gruppo">
    Corrispondenza `toolsBySender` di gruppo/canale.
  </Step>
  <Step title="Strumenti di gruppo">
    `tools` di gruppo/canale.
  </Step>
  <Step title="toolsBySender predefiniti">
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
Le restrizioni degli strumenti per gruppo/canale vengono applicate in aggiunta alla policy globale/per agente sugli strumenti (deny vince comunque). Alcuni canali usano annidamenti diversi per stanze/canali (ad es. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist di gruppo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come allowlist di gruppo. Usa `"*"` per consentire tutti i gruppi continuando a impostare il comportamento predefinito delle menzioni.

<Warning>
Confusione comune: l'approvazione dell'abbinamento DM non equivale all'autorizzazione di gruppo. Per i canali che supportano l'abbinamento DM, lo store di abbinamento sblocca solo i DM. I comandi di gruppo richiedono comunque un'autorizzazione esplicita del mittente del gruppo dalle allowlist di configurazione come `groupAllowFrom` o dal fallback di configurazione documentato per quel canale.
</Warning>

Intenti comuni (copia/incolla):

<Tabs>
  <Tab title="Disattiva tutte le risposte di gruppo">
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
  <Tab title="Trigger solo proprietario (WhatsApp)">
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

## Activation (solo proprietario)

I proprietari dei gruppi possono attivare/disattivare l'attivazione per gruppo:

- `/activation mention`
- `/activation always`

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso quando non impostato). Invia il comando come messaggio autonomo. Le altre superfici attualmente ignorano `/activation`.

## Campi di contesto

I payload in ingresso di gruppo impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo basato sulle menzioni)
- Gli argomenti dei forum Telegram includono anche `MessageThreadId` e `IsForum`.

Il prompt di sistema dell'agente include un'introduzione al gruppo nel primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come un umano, evitare tabelle Markdown, ridurre al minimo le righe vuote e seguire la normale spaziatura della chat, ed evitare di digitare sequenze letterali `\n`. I nomi di gruppo e le etichette dei partecipanti provenienti dal canale sono resi come metadati non attendibili in blocchi recintati, non come istruzioni di sistema inline.

## Specifiche di iMessage

- Preferisci `chat_id:<id>` quando instradi o inserisci in allowlist.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte di gruppo tornano sempre allo stesso `chat_id`.

## Prompt di sistema WhatsApp

Vedi [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema WhatsApp, incluse la risoluzione dei prompt di gruppo e diretti, il comportamento wildcard e la semantica degli override degli account.

## Specifiche di WhatsApp

Vedi [Messaggi di gruppo](/it/channels/group-messages) per il comportamento solo WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).

## Correlati

- [Gruppi broadcast](/it/channels/broadcast-groups)
- [Routing dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Abbinamento](/it/channels/pairing)
