---
read_when:
    - Modifica del comportamento delle chat di gruppo o del filtro delle menzioni
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo nelle diverse superfici (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-05-02T08:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw tratta le chat di gruppo in modo coerente su tutte le superfici: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduzione per principianti (2 minuti)

OpenClaw "vive" sui tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato. Se **tu** sei in un gruppo, OpenClaw può vedere quel gruppo e rispondere lì.

Comportamento predefinito:

- I gruppi sono limitati (`groupPolicy: "allowlist"`).
- Le risposte richiedono una menzione, a meno che tu non disabiliti esplicitamente il gating tramite menzione.
- Le normali risposte finali in gruppi/canali sono private per impostazione predefinita. L'output visibile nella stanza usa lo strumento `message`.

Traduzione: i mittenti inseriti in allowlist possono attivare OpenClaw menzionandolo.

<Note>
**TL;DR**

- **L'accesso ai DM** è controllato da `*.allowFrom`.
- **L'accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **L'attivazione delle risposte** è controllata dal gating tramite menzione (`requireMention`, `/activation`).

</Note>

Flusso rapido (cosa succede a un messaggio di gruppo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Risposte visibili

Per le stanze di gruppo/canale, OpenClaw usa per impostazione predefinita `messages.groupChat.visibleReplies: "message_tool"`.
Questo significa che l'agente elabora comunque il turno e può aggiornare memoria/stato della sessione, ma la sua normale risposta finale non viene pubblicata automaticamente nella stanza. Per parlare in modo visibile, l'agente usa `message(action=send)`.

Se lo strumento message non è disponibile con i criteri degli strumenti attivi, OpenClaw ripiega
sulle risposte visibili automatiche invece di sopprimere silenziosamente la risposta.
`openclaw doctor` avvisa di questa incoerenza.

Per le chat dirette e qualsiasi altro turno sorgente, usa `messages.visibleReplies: "message_tool"` per applicare globalmente lo stesso comportamento di risposta visibile solo tramite strumento. Anche gli harness possono sceglierlo come predefinito non impostato; l'harness Codex lo fa per le chat dirette in modalità Codex. `messages.groupChat.visibleReplies` resta l'override più specifico per le stanze di gruppo/canale.

Questo sostituisce il vecchio schema che forzava il modello a rispondere `NO_REPLY` per la maggior parte dei turni in modalità ascolto. In modalità solo strumento, non fare nulla di visibile significa semplicemente non chiamare lo strumento message.

Gli indicatori di digitazione vengono comunque inviati mentre l'agente lavora in modalità solo strumento. La modalità di digitazione di gruppo predefinita viene aggiornata da "message" a "instant" per questi turni, perché potrebbe non esserci mai testo normale del messaggio dell'assistente prima che l'agente decida se chiamare lo strumento message. La configurazione esplicita della modalità di digitazione ha comunque la precedenza.

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
quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato nel deployment.

Per richiedere che l'output visibile passi dallo strumento message per ogni chat sorgente:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

I comandi slash nativi (Discord, Telegram e altre superfici con supporto nativo dei comandi) bypassano `visibleReplies: "message_tool"` e rispondono sempre in modo visibile, così l'interfaccia dei comandi nativa del canale riceve la risposta attesa. Questo vale solo per i turni di comando nativi convalidati; i comandi `/...` digitati come testo e i turni di chat ordinari seguono comunque l'impostazione predefinita di gruppo configurata.

## Visibilità del contesto e allowlist

Nella sicurezza dei gruppi sono coinvolti due controlli diversi:

- **Autorizzazione di attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist specifiche del canale).
- **Visibilità del contesto**: quale contesto supplementare viene iniettato nel modello (testo della risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw dà priorità al comportamento normale della chat e mantiene il contesto perlopiù come ricevuto. Questo significa che le allowlist decidono principalmente chi può attivare azioni, non costituiscono un confine universale di redazione per ogni frammento citato o storico.

<AccordionGroup>
  <Accordion title="Il comportamento attuale è specifico del canale">
    - Alcuni canali applicano già un filtro basato sul mittente per il contesto supplementare in percorsi specifici (per esempio il seeding dei thread Slack, le ricerche di risposta/thread Matrix).
    - Altri canali passano ancora il contesto di citazione/risposta/inoltro così come ricevuto.

  </Accordion>
  <Accordion title="Direzione di hardening (pianificata)">
    - `contextVisibility: "all"` (predefinito) mantiene il comportamento attuale così come ricevuto.
    - `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti inseriti in allowlist.
    - `contextVisibility: "allowlist_quote"` è `allowlist` più un'eccezione esplicita per citazione/risposta.

    Finché questo modello di hardening non sarà implementato in modo coerente tra i canali, aspettati differenze tra le superfici.

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

Per allowlist di mittenti riutilizzabili, vedi [Gruppi di accesso](/it/channels/access-groups).

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti dei forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni argomento ha la propria sessione.
- Le chat dirette usano la sessione principale (o per mittente, se configurato).
- Gli Heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Schema: DM personali + gruppi pubblici (agente singolo)

Sì: funziona bene se il tuo traffico "personale" è costituito da **DM** e il tuo traffico "pubblico" da **gruppi**.

Perché: in modalità agente singolo, i DM di solito arrivano nella chiave di sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite nel backend sandbox configurato mentre la tua sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno.

Questo ti dà un unico "cervello" dell'agente (workspace + memoria condivisi), ma due posture di esecuzione:

- **DM**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati

<Note>
Se hai bisogno di workspace/personas davvero separati ("personale" e "pubblico" non devono mai mescolarsi), usa un secondo agente + associazioni. Vedi [Instradamento multi-agente](/it/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM sull'host, gruppi in sandbox">
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
  <Tab title="I gruppi vedono solo una cartella in allowlist">
    Vuoi che "i gruppi possano vedere solo la cartella X" invece di "nessun accesso all'host"? Mantieni `workspaceAccess: "none"` e monta nella sandbox solo i percorsi inseriti in allowlist:

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
- Debug del motivo per cui uno strumento è bloccato: [Sandbox vs criteri degli strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli sui bind mount: [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette UI usano `displayName` quando disponibile, formattato come `<channel>:<token>`.
- `#room` è riservato a stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantieni `#@+._-`).

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

| Criterio      | Comportamento                                               |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | I gruppi bypassano le allowlist; il gating tramite menzione si applica comunque. |
| `"disabled"`  | Blocca interamente tutti i messaggi di gruppo.               |
| `"allowlist"` | Consente solo gruppi/stanze che corrispondono all'allowlist configurata. |

<AccordionGroup>
  <Accordion title="Note per canale">
    - `groupPolicy` è separato dal gating tramite menzione (che richiede @menzioni).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
    - Signal: `groupAllowFrom` può corrispondere all'id del gruppo Signal in ingresso oppure al telefono/UUID del mittente.
    - Le approvazioni di abbinamento DM (voci dello store `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione del mittente nei gruppi resta esplicita nelle allowlist di gruppo.
    - Discord: l'allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: l'allowlist usa `channels.slack.channels`.
    - Matrix: l'allowlist usa `channels.matrix.groups`. Preferisci ID stanza o alias; la ricerca del nome della stanza unita è best-effort e i nomi non risolti vengono ignorati a runtime. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per stanza.
    - I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - L'allowlist Telegram può corrispondere a ID utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nomi utente (`"@alice"` o `"alice"`); i prefissi non distinguono maiuscole/minuscole.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se la tua allowlist di gruppo è vuota, i messaggi di gruppo vengono bloccati.
    - Sicurezza a runtime: quando un blocco provider manca completamente (`channels.<provider>` assente), il criterio di gruppo ripiega su una modalità fail-closed (di solito `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modello mentale rapido (ordine di valutazione per i messaggi di gruppo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (aperta/disabilitata/lista consentiti).
  </Step>
  <Step title="Liste consentiti dei gruppi">
    Liste consentiti dei gruppi (`*.groups`, `*.groupAllowFrom`, lista consentiti specifica del canale).
  </Step>
  <Step title="Criteri di menzione">
    Criteri di menzione (`requireMention`, `/activation`).
  </Step>
</Steps>

## Criteri di menzione (predefiniti)

I messaggi di gruppo richiedono una menzione, salvo override per gruppo. I valori predefiniti sono definiti per sottosistema in `*.groups."*"`.

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
  <Accordion title="Note sui criteri di menzione">
    - `mentionPatterns` sono pattern regex sicuri senza distinzione tra maiuscole e minuscole; i pattern non validi e le forme non sicure con ripetizioni annidate vengono ignorati.
    - Le superfici che forniscono menzioni esplicite vengono comunque accettate; i pattern sono un fallback.
    - Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
    - I criteri di menzione vengono applicati solo quando il rilevamento delle menzioni è possibile (menzioni native o `mentionPatterns` configurati).
    - Inserire un gruppo o un mittente nella lista consentiti non disabilita i criteri di menzione; imposta `requireMention` di quel gruppo su `false` quando tutti i messaggi devono attivare una risposta.
    - Il contesto del prompt della chat di gruppo porta l'istruzione di risposta silenziosa risolta a ogni turno; i file del workspace non devono duplicare la meccanica di `NO_REPLY`.
    - I gruppi in cui sono consentite risposte silenziose trattano i turni del modello puliti, vuoti o solo di ragionamento come silenziosi, equivalenti a `NO_REPLY`. Le chat dirette fanno lo stesso solo quando le risposte silenziose dirette sono consentite esplicitamente; altrimenti le risposte vuote restano turni agente non riusciti.
    - I valori predefiniti di Discord sono in `channels.discord.guilds."*"` (sovrascrivibili per guild/canale).
    - Il contesto della cronologia di gruppo è incapsulato in modo uniforme su tutti i canali ed è **solo per i messaggi in sospeso** (messaggi saltati a causa dei criteri di menzione); usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disabilitare.

  </Accordion>
</AccordionGroup>

## Restrizioni degli strumenti per gruppo/canale (opzionali)

Alcune configurazioni di canale supportano la restrizione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo. Usa prefissi chiave espliciti: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e il carattere jolly `"*"`. Le chiavi legacy senza prefisso sono ancora accettate e vengono abbinate solo come `id:`.

Ordine di risoluzione (vince il più specifico):

<Steps>
  <Step title="toolsBySender di gruppo">
    Corrispondenza `toolsBySender` di gruppo/canale.
  </Step>
  <Step title="tools di gruppo">
    `tools` di gruppo/canale.
  </Step>
  <Step title="toolsBySender predefinito">
    Corrispondenza `toolsBySender` predefinita (`"*"`).
  </Step>
  <Step title="tools predefiniti">
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
Le restrizioni degli strumenti per gruppo/canale vengono applicate in aggiunta alla policy globale/degli agenti per gli strumenti (il diniego prevale comunque). Alcuni canali usano un annidamento diverso per stanze/canali (ad esempio Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Liste consentiti dei gruppi

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come lista consentiti dei gruppi. Usa `"*"` per consentire tutti i gruppi continuando a impostare il comportamento predefinito delle menzioni.

<Warning>
Confusione comune: l'approvazione dell'associazione DM non equivale all'autorizzazione del gruppo. Per i canali che supportano l'associazione DM, lo store di associazione sblocca solo i DM. I comandi di gruppo richiedono comunque l'autorizzazione esplicita del mittente del gruppo dalle liste consentiti di configurazione, come `groupAllowFrom`, o il fallback di configurazione documentato per quel canale.
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

I proprietari dei gruppi possono alternare l'attivazione per gruppo:

- `/activation mention`
- `/activation always`

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso quando non è impostato). Invia il comando come messaggio autonomo. Le altre superfici attualmente ignorano `/activation`.

## Campi di contesto

I payload in ingresso di gruppo impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato dei criteri di menzione)
- Gli argomenti dei forum Telegram includono anche `MessageThreadId` e `IsForum`.

Note specifiche del canale:

- BlueBubbles può facoltativamente arricchire i partecipanti senza nome dei gruppi macOS dal database locale dei Contatti prima di popolare `GroupMembers`. Questa opzione è disattivata per impostazione predefinita e viene eseguita solo dopo il superamento dei normali criteri di gruppo.

Il prompt di sistema dell'agente include un'introduzione al gruppo al primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come una persona, evitare tabelle Markdown, ridurre al minimo le righe vuote e seguire la normale spaziatura della chat, ed evitare di digitare sequenze letterali `\n`. I nomi dei gruppi e le etichette dei partecipanti provenienti dal canale vengono renderizzati come metadati non attendibili in blocchi fenced, non come istruzioni di sistema inline.

## Specifiche iMessage

- Preferisci `chat_id:<id>` durante il routing o l'inserimento nella lista consentiti.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte di gruppo tornano sempre allo stesso `chat_id`.

## Prompt di sistema WhatsApp

Consulta [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema WhatsApp, inclusa la risoluzione dei prompt di gruppo e diretti, il comportamento dei caratteri jolly e la semantica degli override degli account.

## Specifiche WhatsApp

Consulta [Messaggi di gruppo](/it/channels/group-messages) per il comportamento solo WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).

## Correlati

- [Gruppi broadcast](/it/channels/broadcast-groups)
- [Routing dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Associazione](/it/channels/pairing)
