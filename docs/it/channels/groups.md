---
read_when:
    - Modificare il comportamento delle chat di gruppo o il filtro delle menzioni
sidebarTitle: Groups
summary: Comportamento delle chat di gruppo tra le varie superfici (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-04-26T11:23:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw tratta le chat di gruppo in modo coerente tra le varie superfici: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduzione per principianti (2 minuti)

OpenClaw "vive" sui tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato. Se **tu** sei in un gruppo, OpenClaw può vedere quel gruppo e rispondere lì.

Comportamento predefinito:

- I gruppi sono limitati (`groupPolicy: "allowlist"`).
- Le risposte richiedono una menzione, a meno che tu non disabiliti esplicitamente il filtro delle menzioni.

Traduzione: i mittenti presenti nella allowlist possono attivare OpenClaw menzionandolo.

<Note>
**In breve**

- L'**accesso ai DM** è controllato da `*.allowFrom`.
- L'**accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- L'**attivazione delle risposte** è controllata dal filtro delle menzioni (`requireMention`, `/activation`).

</Note>

Flusso rapido (cosa succede a un messaggio di gruppo):

```
groupPolicy? disabled -> scarta
groupPolicy? allowlist -> gruppo consentito? no -> scarta
requireMention? yes -> menzionato? no -> memorizza solo per il contesto
otherwise -> rispondi
```

## Visibilità del contesto e allowlist

Nella sicurezza dei gruppi sono coinvolti due controlli diversi:

- **Autorizzazione di attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist specifiche del canale).
- **Visibilità del contesto**: quale contesto supplementare viene iniettato nel modello (testo di risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw dà priorità al normale comportamento della chat e mantiene il contesto per lo più così come ricevuto. Questo significa che le allowlist decidono principalmente chi può attivare azioni, non un confine universale di redazione per ogni frammento citato o storico.

<AccordionGroup>
  <Accordion title="Il comportamento attuale è specifico del canale">
    - Alcuni canali applicano già un filtraggio basato sul mittente per il contesto supplementare in percorsi specifici (per esempio il seeding dei thread di Slack, le ricerche di risposte/thread di Matrix).
    - Altri canali continuano invece a trasmettere il contesto di citazioni/risposte/inoltri così come ricevuto.

  </Accordion>
  <Accordion title="Direzione di hardening (pianificata)">
    - `contextVisibility: "all"` (predefinito) mantiene il comportamento attuale così come ricevuto.
    - `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti nella allowlist.
    - `contextVisibility: "allowlist_quote"` è `allowlist` più un'eccezione esplicita per una singola citazione/risposta.

    Finché questo modello di hardening non verrà implementato in modo coerente tra i canali, aspettati differenze a seconda della superficie.

  </Accordion>
</AccordionGroup>

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se vuoi...

| Obiettivo                                    | Cosa impostare                                           |
| -------------------------------------------- | -------------------------------------------------------- |
| Consentire tutti i gruppi ma rispondere solo alle @mention | `groups: { "*": { requireMention: true } }`              |
| Disabilitare tutte le risposte nei gruppi    | `groupPolicy: "disabled"`                                |
| Solo gruppi specifici                        | `groups: { "<group-id>": { ... } }` (senza chiave `"*"`) |
| Solo tu puoi attivare nei gruppi             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti del forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni argomento ha la propria sessione.
- Le chat dirette usano la sessione principale (o una per mittente, se configurato).
- Gli Heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pattern: DM personali + gruppi pubblici (agente singolo)

Sì — funziona bene se il tuo traffico "personale" è nei **DM** e quello "pubblico" è nei **gruppi**.

Perché: in modalità agente singolo, i DM in genere finiscono nella chiave della sessione **principale** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non principali** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite nel backend sandbox configurato, mentre la tua sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno.

Questo ti offre un unico "cervello" dell'agente (area di lavoro + memoria condivise), ma due modalità di esecuzione:

- **DM**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati

<Note>
Se hai bisogno di aree di lavoro/persona davvero separate ("personale" e "pubblico" non devono mai mescolarsi), usa un secondo agente + binding. Vedi [Instradamento multi-agente](/it/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM sull'host, gruppi in sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // i gruppi/canali sono non-main -> in sandbox
            scope: "session", // isolamento più forte (un container per gruppo/canale)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Se allow non è vuoto, tutto il resto viene bloccato (deny ha comunque priorità).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="I gruppi vedono solo una cartella nella allowlist">
    Vuoi "i gruppi possono vedere solo la cartella X" invece di "nessun accesso all'host"? Mantieni `workspaceAccess: "none"` e monta solo i percorsi nella allowlist nel sandbox:

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
- Debug del motivo per cui uno strumento è bloccato: [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli sui bind mount: [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette dell'interfaccia usano `displayName` quando disponibile, nel formato `<channel>:<token>`.
- `#room` è riservato a stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantiene `#@+._-`).

## Criterio dei gruppi

Controlla come vengono gestiti i messaggi di gruppi/stanze per canale:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id utente Telegram numerico (la procedura guidata può risolvere @username)
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
| `"open"`      | I gruppi aggirano le allowlist; il filtro delle menzioni si applica comunque. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.             |
| `"allowlist"` | Consente solo gruppi/stanze che corrispondono alla allowlist configurata. |

<AccordionGroup>
  <Accordion title="Note per canale">
    - `groupPolicy` è separato dal filtro delle menzioni (che richiede @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
    - Le approvazioni di abbinamento DM (voci memorizzate in `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione dei mittenti nei gruppi resta esplicita tramite le allowlist dei gruppi.
    - Discord: la allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: la allowlist usa `channels.slack.channels`.
    - Matrix: la allowlist usa `channels.matrix.groups`. Preferisci id stanza o alias; la ricerca del nome della stanza unita è best-effort, e i nomi non risolti vengono ignorati a runtime. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per stanza.
    - I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La allowlist Telegram può corrispondere a id utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o username (`"@alice"` o `"alice"`); i prefissi non distinguono tra maiuscole e minuscole.
    - Il valore predefinito è `groupPolicy: "allowlist"`; se la tua allowlist di gruppi è vuota, i messaggi di gruppo vengono bloccati.
    - Sicurezza a runtime: quando un blocco provider manca completamente (`channels.<provider>` assente), il criterio dei gruppi torna a una modalità fail-closed (tipicamente `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

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
  <Step title="Filtro delle menzioni">
    Filtro delle menzioni (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtro delle menzioni (predefinito)

I messaggi di gruppo richiedono una menzione, salvo override per gruppo. I valori predefiniti si trovano per sottosistema in `*.groups."*"`.

Rispondere a un messaggio del bot conta come una menzione implicita quando il canale supporta i metadati di risposta. Anche citare un messaggio del bot può contare come menzione implicita sui canali che espongono metadati di citazione. I casi integrati attuali includono Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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
  <Accordion title="Note sul filtro delle menzioni">
    - `mentionPatterns` sono pattern regex sicuri case-insensitive; i pattern non validi e le forme non sicure con ripetizioni annidate vengono ignorati.
    - Le superfici che forniscono menzioni esplicite continuano a funzionare; i pattern sono un fallback.
    - Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
    - Il filtro delle menzioni viene applicato solo quando il rilevamento delle menzioni è possibile (menzioni native o `mentionPatterns` configurati).
    - I gruppi in cui sono consentite risposte silenziose trattano i turni del modello pulitamente vuoti o contenenti solo ragionamento come silenziosi, equivalenti a `NO_REPLY`. Le chat dirette continuano invece a trattare le risposte vuote come un turno agente non riuscito.
    - I valori predefiniti di Discord si trovano in `channels.discord.guilds."*"` (sovrascrivibili per guild/canale).
    - Il contesto della cronologia dei gruppi è incapsulato in modo uniforme tra i canali ed è **solo in sospeso** (messaggi saltati a causa del filtro delle menzioni); usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disabilitare.

  </Accordion>
</AccordionGroup>

## Restrizioni degli strumenti per gruppi/canali (opzionale)

Alcune configurazioni dei canali supportano la limitazione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo. Usa prefissi di chiave espliciti: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e il carattere jolly `"*"`. Le chiavi legacy senza prefisso sono ancora accettate e vengono abbinate solo come `id:`.

Ordine di risoluzione (vince il più specifico):

<Steps>
  <Step title="toolsBySender del gruppo">
    Corrispondenza di `toolsBySender` del gruppo/canale.
  </Step>
  <Step title="tools del gruppo">
    `tools` del gruppo/canale.
  </Step>
  <Step title="toolsBySender predefinito">
    Corrispondenza di `toolsBySender` predefinito (`"*"`).
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
Le restrizioni degli strumenti per gruppi/canali vengono applicate in aggiunta al criterio globale/per-agente degli strumenti (deny ha comunque priorità). Alcuni canali usano un annidamento diverso per stanze/canali (ad esempio Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist dei gruppi

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come una allowlist dei gruppi. Usa `"*"` per consentire tutti i gruppi continuando comunque a impostare il comportamento predefinito delle menzioni.

<Warning>
Confusione comune: l'approvazione dell'abbinamento DM non è la stessa cosa dell'autorizzazione del gruppo. Per i canali che supportano l'abbinamento DM, l'archivio di abbinamento sblocca solo i DM. I comandi nei gruppi richiedono comunque un'autorizzazione esplicita del mittente del gruppo tramite allowlist di configurazione come `groupAllowFrom` o il fallback di configurazione documentato per quel canale.
</Warning>

Intent comuni (copia/incolla):

<Tabs>
  <Tab title="Disabilitare tutte le risposte nei gruppi">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Consentire solo gruppi specifici (WhatsApp)">
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
  <Tab title="Consentire tutti i gruppi ma richiedere una menzione">
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
  <Tab title="Attivazioni solo per il proprietario (WhatsApp)">
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

I proprietari del gruppo possono attivare o disattivare l'Activation per singolo gruppo:

- `/activation mention`
- `/activation always`

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso se non impostato). Invia il comando come messaggio autonomo. Le altre superfici attualmente ignorano `/activation`.

## Campi di contesto

I payload in ingresso dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noti)
- `WasMentioned` (risultato del filtro delle menzioni)
- Gli argomenti del forum Telegram includono anche `MessageThreadId` e `IsForum`.

Note specifiche per canale:

- BlueBubbles può facoltativamente arricchire i partecipanti senza nome dei gruppi macOS dal database locale dei Contatti prima di popolare `GroupMembers`. Questa funzione è disattivata per impostazione predefinita e viene eseguita solo dopo il normale superamento del filtro dei gruppi.

Il prompt di sistema dell'agente include un'introduzione al gruppo nel primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come un essere umano, evitare tabelle Markdown, ridurre al minimo le righe vuote, seguire la normale spaziatura della chat ed evitare di digitare sequenze letterali `\n`. I nomi dei gruppi e le etichette dei partecipanti provenienti dal canale vengono resi come metadati non attendibili racchiusi in blocchi fenced, non come istruzioni di sistema inline.

## Specificità di iMessage

- Preferisci `chat_id:<id>` quando instradi o inserisci in allowlist.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte nei gruppi tornano sempre allo stesso `chat_id`.

## Prompt di sistema WhatsApp

Vedi [WhatsApp](/it/channels/whatsapp#system-prompts) per le regole canoniche dei prompt di sistema di WhatsApp, inclusi risoluzione dei prompt di gruppo e diretti, comportamento con caratteri jolly e semantica degli override per account.

## Specificità di WhatsApp

Vedi [Messaggi di gruppo](/it/channels/group-messages) per il comportamento esclusivo di WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).

## Correlati

- [Gruppi broadcast](/it/channels/broadcast-groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Messaggi di gruppo](/it/channels/group-messages)
- [Abbinamento](/it/channels/pairing)
