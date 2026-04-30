---
read_when:
    - Modifica del comportamento nelle chat di gruppo o del controllo tramite menzioni
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo sulle diverse superfici (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-04-30T16:27:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw tratta le chat di gruppo in modo coerente su tutte le superfici: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduzione per principianti (2 minuti)

OpenClaw "vive" sui tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato. Se **tu** sei in un gruppo, OpenClaw può vedere quel gruppo e rispondere lì.

Comportamento predefinito:

- I gruppi sono limitati (`groupPolicy: "allowlist"`).
- Le risposte richiedono una menzione, a meno che tu non disabiliti esplicitamente il controllo tramite menzione.
- Le normali risposte finali nei gruppi/canali sono private per impostazione predefinita. L'output visibile nella stanza usa lo strumento `message`.

Traduzione: i mittenti in allowlist possono attivare OpenClaw menzionandolo.

<Note>
**In breve**

- **L'accesso ai DM** è controllato da `*.allowFrom`.
- **L'accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **L'attivazione delle risposte** è controllata dal controllo tramite menzione (`requireMention`, `/activation`).

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
Questo significa che l'agente elabora comunque il turno e può aggiornare lo stato di memoria/sessione, ma la sua normale risposta finale non viene pubblicata automaticamente nella stanza. Per parlare in modo visibile, l'agente usa `message(action=send)`.

Per le chat dirette e qualsiasi altro turno sorgente, usa `messages.visibleReplies: "message_tool"` per applicare globalmente lo stesso comportamento di risposta visibile solo tramite strumento. `messages.groupChat.visibleReplies` rimane l'override più specifico per le stanze di gruppo/canale.

Questo sostituisce il vecchio schema che forzava il modello a rispondere `NO_REPLY` per la maggior parte dei turni in modalità ascolto. In modalità solo strumenti, non fare nulla di visibile significa semplicemente non chiamare lo strumento message.

Gli indicatori di digitazione vengono comunque inviati mentre l'agente lavora in modalità solo strumenti. La modalità di digitazione predefinita per i gruppi viene aggiornata da "message" a "instant" per questi turni, perché potrebbe non esserci mai normale testo del messaggio dell'assistente prima che l'agente decida se chiamare lo strumento message. La configurazione esplicita della modalità di digitazione ha comunque la precedenza.

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

Il Gateway ricarica a caldo la configurazione `messages` dopo il salvataggio del file. Riavvia solo
quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato nel deployment.

Per richiedere che l'output visibile passi attraverso lo strumento message per ogni chat sorgente:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

I comandi slash nativi (Discord, Telegram e altre superfici con supporto ai comandi nativi) aggirano `visibleReplies: "message_tool"` e rispondono sempre in modo visibile, così l'interfaccia dei comandi nativa del canale riceve la risposta prevista. Questo si applica solo ai turni di comando nativi validati; i comandi `/...` digitati come testo e i normali turni di chat seguono comunque l'impostazione predefinita di gruppo configurata.

## Visibilità del contesto e allowlist

Nella sicurezza dei gruppi sono coinvolti due controlli diversi:

- **Autorizzazione dell'attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist specifiche del canale).
- **Visibilità del contesto**: quale contesto supplementare viene iniettato nel modello (testo di risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw dà priorità al normale comportamento di chat e mantiene il contesto per lo più così come ricevuto. Questo significa che le allowlist decidono principalmente chi può attivare azioni, non un limite universale di redazione per ogni frammento citato o storico.

<AccordionGroup>
  <Accordion title="Il comportamento attuale è specifico del canale">
    - Alcuni canali applicano già filtri basati sul mittente per il contesto supplementare in percorsi specifici (per esempio il seeding dei thread Slack, le ricerche di risposte/thread Matrix).
    - Altri canali passano ancora il contesto di citazione/risposta/inoltro così come ricevuto.

  </Accordion>
  <Accordion title="Direzione di rafforzamento (pianificata)">
    - `contextVisibility: "all"` (predefinito) mantiene il comportamento attuale così come ricevuto.
    - `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti in allowlist.
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

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti dei forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni argomento ha la propria sessione.
- Le chat dirette usano la sessione principale (o per mittente, se configurato).
- Gli Heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Schema: DM personali + gruppi pubblici (agente singolo)

Sì: funziona bene se il tuo traffico "personale" è costituito da **DM** e il tuo traffico "pubblico" da **gruppi**.

Perché: in modalità agente singolo, i DM in genere finiscono nella chiave di sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite nel backend sandbox configurato, mentre la tua sessione DM principale rimane sull'host. Docker è il backend predefinito se non ne scegli uno.

Questo ti offre un unico "cervello" dell'agente (workspace + memoria condivisi), ma due posture di esecuzione:

- **DM**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati

<Note>
Se ti servono workspace/personalità davvero separati ("personale" e "pubblico" non devono mai mescolarsi), usa un secondo agente + binding. Vedi [Routing multi-agente](/it/concepts/multi-agent).
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
    Vuoi che "i gruppi possano vedere solo la cartella X" invece di "nessun accesso all'host"? Mantieni `workspaceAccess: "none"` e monta solo percorsi in allowlist nella sandbox:

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
- Dettagli dei bind mount: [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette visualizzate

- Le etichette dell'interfaccia utente usano `displayName` quando disponibile, formattato come `<channel>:<token>`.
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

| Criterio      | Comportamento                                                |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | I gruppi aggirano le allowlist; il controllo tramite menzione si applica comunque. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.             |
| `"allowlist"` | Consente solo gruppi/stanze che corrispondono all'allowlist configurata. |

<AccordionGroup>
  <Accordion title="Note per canale">
    - `groupPolicy` è separato dal controllo tramite menzione (che richiede @menzioni).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
    - Signal: `groupAllowFrom` può corrispondere all'id del gruppo Signal in ingresso oppure al telefono/UUID del mittente.
    - Le approvazioni di abbinamento DM (voci dello store `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione dei mittenti nei gruppi rimane esplicita nelle allowlist dei gruppi.
    - Discord: l'allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: l'allowlist usa `channels.slack.channels`.
    - Matrix: l'allowlist usa `channels.matrix.groups`. Preferisci ID stanza o alias; la ricerca del nome delle stanze unite è best-effort e i nomi non risolti vengono ignorati a runtime. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per stanza.
    - I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - L'allowlist Telegram può corrispondere a ID utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nomi utente (`"@alice"` o `"alice"`); i prefissi non distinguono maiuscole/minuscole.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se la tua allowlist di gruppo è vuota, i messaggi di gruppo sono bloccati.
    - Sicurezza a runtime: quando manca completamente un blocco provider (`channels.<provider>` assente), il criterio di gruppo ripiega su una modalità fail-closed (in genere `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modello mentale rapido (ordine di valutazione per i messaggi di gruppo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlist dei gruppi">
    Allowlist dei gruppi (`*.groups`, `*.groupAllowFrom`, allowlist specifica del canale).
  </Step>
  <Step title="Controllo tramite menzione">
    Controllo tramite menzione (`requireMention`, `/activation`).
  </Step>
</Steps>

## Controllo tramite menzione (predefinito)

I messaggi di gruppo richiedono una menzione, a meno che non venga eseguito l'override per gruppo. I valori predefiniti vivono per sottosistema sotto `*.groups."*"`.

Rispondere a un messaggio del bot conta come menzione implicita quando il canale supporta i metadati di risposta. Citare un messaggio del bot può contare anche come menzione implicita nei canali che espongono metadati di citazione. I casi integrati attuali includono Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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
  <Accordion title="Note sul controllo tramite menzione">
    - `mentionPatterns` sono pattern regex sicuri, senza distinzione tra maiuscole e minuscole; i pattern non validi e le forme non sicure con ripetizioni annidate vengono ignorati.
    - Le superfici che forniscono menzioni esplicite continuano a passare; i pattern sono un fallback.
    - Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
    - Il controllo tramite menzione viene applicato solo quando il rilevamento della menzione è possibile (menzioni native o `mentionPatterns` configurati).
    - Inserire un gruppo o un mittente in allowlist non disabilita il controllo tramite menzione; imposta `requireMention` di quel gruppo su `false` quando tutti i messaggi devono attivare una risposta.
    - Il contesto del prompt della chat di gruppo porta a ogni turno l'istruzione risolta per la risposta silenziosa; i file dell'area di lavoro non devono duplicare i meccanismi `NO_REPLY`.
    - I gruppi in cui sono consentite risposte silenziose trattano i turni del modello puliti, vuoti o solo di ragionamento, come silenziosi, equivalenti a `NO_REPLY`. Le chat dirette fanno lo stesso solo quando le risposte dirette silenziose sono consentite esplicitamente; altrimenti le risposte vuote rimangono turni agente non riusciti.
    - I valori predefiniti di Discord si trovano in `channels.discord.guilds."*"` (sovrascrivibili per guild/canale).
    - Il contesto della cronologia di gruppo viene incapsulato in modo uniforme tra i canali ed è **solo per i messaggi in sospeso** (messaggi saltati a causa del controllo tramite menzione); usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disabilitare.

  </Accordion>
</AccordionGroup>

## Restrizioni degli strumenti per gruppo/canale (opzionale)

Alcune configurazioni di canale supportano la restrizione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo. Usa prefissi di chiave espliciti: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e il carattere jolly `"*"`. Le chiavi legacy senza prefisso sono ancora accettate e abbinate solo come `id:`.

Ordine di risoluzione (vince il più specifico):

<Steps>
  <Step title="toolsBySender del gruppo">
    Corrispondenza `toolsBySender` del gruppo/canale.
  </Step>
  <Step title="tools del gruppo">
    `tools` del gruppo/canale.
  </Step>
  <Step title="toolsBySender predefinito">
    Corrispondenza `toolsBySender` predefinita (`"*"`).
  </Step>
  <Step title="tools predefiniti">
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
Le restrizioni degli strumenti per gruppo/canale vengono applicate in aggiunta alla policy globale/di agente sugli strumenti (il deny vince comunque). Alcuni canali usano annidamenti diversi per stanze/canali (ad esempio, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist dei gruppi

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come allowlist di gruppi. Usa `"*"` per consentire tutti i gruppi impostando comunque il comportamento predefinito per le menzioni.

<Warning>
Confusione comune: l'approvazione dell'abbinamento DM non è la stessa cosa dell'autorizzazione di gruppo. Per i canali che supportano l'abbinamento DM, lo store degli abbinamenti sblocca solo i DM. I comandi di gruppo richiedono comunque l'autorizzazione esplicita del mittente del gruppo tramite allowlist di configurazione come `groupAllowFrom` o il fallback di configurazione documentato per quel canale.
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

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso quando non impostato). Invia il comando come messaggio autonomo. Le altre superfici attualmente ignorano `/activation`.

## Campi di contesto

I payload in ingresso dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo tramite menzione)
- Gli argomenti dei forum Telegram includono anche `MessageThreadId` e `IsForum`.

Note specifiche del canale:

- BlueBubbles può facoltativamente arricchire i partecipanti anonimi dei gruppi macOS dal database locale dei Contatti prima di popolare `GroupMembers`. Questa opzione è disattivata per impostazione predefinita e viene eseguita solo dopo il superamento del normale controllo di gruppo.

Il prompt di sistema dell'agente include un'introduzione al gruppo al primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come una persona, evitare tabelle Markdown, ridurre al minimo le righe vuote e seguire la normale spaziatura della chat, ed evitare di digitare sequenze letterali `\n`. I nomi dei gruppi e le etichette dei partecipanti provenienti dal canale vengono renderizzati come metadati non attendibili delimitati da fence, non come istruzioni di sistema inline.

## Specifiche di iMessage

- Preferisci `chat_id:<id>` durante il routing o l'inserimento in allowlist.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte di gruppo tornano sempre allo stesso `chat_id`.

## Prompt di sistema di WhatsApp

Consulta [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema di WhatsApp, inclusa la risoluzione dei prompt di gruppo e diretti, il comportamento dei caratteri jolly e la semantica degli override degli account.

## Specifiche di WhatsApp

Consulta [Messaggi di gruppo](/it/channels/group-messages) per il comportamento esclusivo di WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).

## Correlati

- [Gruppi di broadcast](/it/channels/broadcast-groups)
- [Routing dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Abbinamento](/it/channels/pairing)
