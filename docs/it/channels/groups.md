---
read_when:
    - Modifica del comportamento delle chat di gruppo o del controllo delle menzioni
summary: Comportamento delle chat di gruppo tra le varie superfici (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-04-07T08:12:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5045badbba30587c8f1bf27f6b940c7c471a95c57093c9adb142374413ac81e
    source_path: channels/groups.md
    workflow: 15
---

# Gruppi

OpenClaw gestisce le chat di gruppo in modo coerente tra le varie superfici: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduzione per principianti (2 minuti)

OpenClaw “vive” sui tuoi account di messaggistica. Non esiste un utente bot WhatsApp separato.
Se **tu** sei in un gruppo, OpenClaw può vedere quel gruppo e rispondere lì.

Comportamento predefinito:

- I gruppi sono limitati (`groupPolicy: "allowlist"`).
- Le risposte richiedono una menzione, a meno che tu non disattivi esplicitamente il controllo delle menzioni.

Traduzione: i mittenti presenti nell'allowlist possono attivare OpenClaw menzionandolo.

> In breve
>
> - L'**accesso ai DM** è controllato da `*.allowFrom`.
> - L'**accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - L'**attivazione delle risposte** è controllata dal controllo delle menzioni (`requireMention`, `/activation`).

Flusso rapido (cosa succede a un messaggio di gruppo):

```
groupPolicy? disabled -> scarta
groupPolicy? allowlist -> gruppo consentito? no -> scarta
requireMention? yes -> menzionato? no -> memorizza solo per il contesto
altrimenti -> rispondi
```

## Visibilità del contesto e allowlist

Nella sicurezza dei gruppi sono coinvolti due controlli distinti:

- **Autorizzazione all'attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist specifiche del canale).
- **Visibilità del contesto**: quale contesto supplementare viene iniettato nel modello (testo della risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw dà priorità al normale comportamento della chat e mantiene il contesto per lo più così come ricevuto. Questo significa che le allowlist decidono principalmente chi può attivare le azioni, non rappresentano un confine universale di redazione per ogni frammento citato o storico.

Il comportamento attuale dipende dal canale:

- Alcuni canali applicano già un filtro basato sul mittente per il contesto supplementare in percorsi specifici (per esempio inizializzazione dei thread in Slack, ricerche di risposte/thread in Matrix).
- Altri canali continuano a passare il contesto di citazione/risposta/inoltro così come ricevuto.

Direzione di hardening (pianificata):

- `contextVisibility: "all"` (predefinito) mantiene il comportamento attuale così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti presenti nell'allowlist.
- `contextVisibility: "allowlist_quote"` equivale a `allowlist` più un'eccezione esplicita per una citazione/risposta.

Finché questo modello di hardening non verrà implementato in modo coerente tra i vari canali, aspettati differenze in base alla superficie.

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se vuoi...

| Obiettivo                                    | Cosa impostare                                           |
| -------------------------------------------- | -------------------------------------------------------- |
| Consentire tutti i gruppi ma rispondere solo alle @menzioni | `groups: { "*": { requireMention: true } }`              |
| Disattivare tutte le risposte nei gruppi     | `groupPolicy: "disabled"`                                |
| Solo gruppi specifici                        | `groups: { "<group-id>": { ... } }` (senza chiave `"*"`) |
| Solo tu puoi attivare nei gruppi             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- Gli argomenti del forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni argomento ha la propria sessione.
- Le chat dirette usano la sessione principale (o per mittente, se configurato).
- Gli heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modello: DM personali + gruppi pubblici (agente singolo)

Sì — funziona bene se il tuo traffico “personale” è nei **DM** e il tuo traffico “pubblico” è nei **gruppi**.

Perché: in modalità agente singolo, i DM in genere finiscono nella chiave di sessione **main** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non-main** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite in Docker mentre la tua sessione DM principale resta sull'host.

Questo ti offre un solo “cervello” agente (workspace + memoria condivisi), ma due modalità di esecuzione:

- **DM**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati (Docker)

> Se hai bisogno di workspace/persona davvero separati (“personale” e “pubblico” non devono mai mescolarsi), usa un secondo agente + binding. Vedi [Instradamento multi-agente](/it/concepts/multi-agent).

Esempio (DM sull'host, gruppi in sandbox + solo strumenti di messaggistica):

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

Vuoi che “i gruppi possano vedere solo la cartella X” invece di “nessun accesso host”? Mantieni `workspaceAccess: "none"` e monta nel sandbox solo i percorsi presenti nell'allowlist:

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

Correlati:

- Chiavi di configurazione e valori predefiniti: [Configurazione del gateway](/it/gateway/configuration-reference#agentsdefaultssandbox)
- Debug del motivo per cui uno strumento è bloccato: [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli dei bind mount: [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette dell'interfaccia usano `displayName` quando disponibile, nel formato `<channel>:<token>`.
- `#room` è riservato a stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantenendo `#@+._-`).

## Criterio dei gruppi

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
| ------------- | ----------------------------------------------------------- |
| `"open"`      | I gruppi ignorano le allowlist; il controllo delle menzioni si applica comunque. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.            |
| `"allowlist"` | Consente solo gruppi/stanze che corrispondono all'allowlist configurata. |

Note:

- `groupPolicy` è separato dal controllo delle menzioni (che richiede @menzioni).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
- Le approvazioni di pairing dei DM (voci memorizzate in `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione dei mittenti nei gruppi rimane esplicita nelle allowlist dei gruppi.
- Discord: l'allowlist usa `channels.discord.guilds.<id>.channels`.
- Slack: l'allowlist usa `channels.slack.channels`.
- Matrix: l'allowlist usa `channels.matrix.groups`. Preferisci ID stanza o alias; la ricerca del nome delle stanze unite è best-effort e i nomi non risolti vengono ignorati in fase di esecuzione. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per stanza.
- I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- L'allowlist Telegram può corrispondere a ID utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o username (`"@alice"` o `"alice"`); i prefissi non distinguono maiuscole/minuscole.
- Il valore predefinito è `groupPolicy: "allowlist"`; se la tua allowlist dei gruppi è vuota, i messaggi di gruppo vengono bloccati.
- Sicurezza a runtime: quando un blocco provider manca completamente (`channels.<provider>` assente), il criterio dei gruppi torna a una modalità fail-closed (tipicamente `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

Modello mentale rapido (ordine di valutazione per i messaggi di gruppo):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist dei gruppi (`*.groups`, `*.groupAllowFrom`, allowlist specifica del canale)
3. controllo delle menzioni (`requireMention`, `/activation`)

## Controllo delle menzioni (predefinito)

I messaggi di gruppo richiedono una menzione, a meno che non venga sostituita per gruppo. I valori predefiniti si trovano per sottosistema in `*.groups."*"`.

Rispondere a un messaggio del bot conta come una menzione implicita quando il canale
supporta i metadati di risposta. Anche citare un messaggio del bot può contare come una menzione implicita
sui canali che espongono metadati di citazione. I casi built-in attuali includono
Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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

Note:

- `mentionPatterns` sono pattern regex sicuri e case-insensitive; i pattern non validi e le forme non sicure con ripetizioni annidate vengono ignorati.
- Le superfici che forniscono menzioni esplicite continuano a funzionare; i pattern sono un fallback.
- Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
- Il controllo delle menzioni viene applicato solo quando il rilevamento della menzione è possibile (menzioni native o `mentionPatterns` configurati).
- I valori predefiniti di Discord si trovano in `channels.discord.guilds."*"` (sovrascrivibili per guild/canale).
- Il contesto della cronologia di gruppo viene incapsulato in modo uniforme tra i canali ed è **solo pending** (messaggi saltati a causa del controllo delle menzioni); usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disattivarlo.

## Restrizioni degli strumenti per gruppo/canale (facoltative)

Alcune configurazioni di canale supportano la limitazione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo.
  Usa prefissi di chiave espliciti:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e wildcard `"*"`.
  Le chiavi legacy senza prefisso sono ancora accettate e vengono abbinate solo come `id:`.

Ordine di risoluzione (vince il più specifico):

1. corrispondenza `toolsBySender` del gruppo/canale
2. `tools` del gruppo/canale
3. corrispondenza `toolsBySender` predefinita (`"*"`)
4. `tools` predefinito (`"*"`)

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

Note:

- Le restrizioni degli strumenti per gruppo/canale vengono applicate in aggiunta al criterio globale/di agente degli strumenti (deny continua ad avere la precedenza).
- Alcuni canali usano nidificazioni diverse per stanze/canali (ad es. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist dei gruppi

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come allowlist dei gruppi. Usa `"*"` per consentire tutti i gruppi continuando comunque a impostare il comportamento predefinito delle menzioni.

Confusione comune: l'approvazione del pairing DM non è la stessa cosa dell'autorizzazione del gruppo.
Per i canali che supportano il pairing DM, l'archivio di pairing sblocca solo i DM. I comandi di gruppo richiedono comunque un'autorizzazione esplicita del mittente del gruppo dalle allowlist di configurazione come `groupAllowFrom` o dal fallback di configurazione documentato per quel canale.

Intenti comuni (copia/incolla):

1. Disattivare tutte le risposte nei gruppi

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Consentire solo gruppi specifici (WhatsApp)

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

3. Consentire tutti i gruppi ma richiedere una menzione (esplicito)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Solo il proprietario può attivare nei gruppi (WhatsApp)

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

## Attivazione (solo proprietario)

I proprietari del gruppo possono attivare o disattivare l'attivazione per gruppo:

- `/activation mention`
- `/activation always`

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso se non impostato). Invia il comando come messaggio standalone. Le altre superfici attualmente ignorano `/activation`.

## Campi di contesto

I payload in ingresso dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo delle menzioni)
- Gli argomenti del forum Telegram includono anche `MessageThreadId` e `IsForum`.

Note specifiche del canale:

- BlueBubbles può opzionalmente arricchire i partecipanti senza nome dei gruppi macOS dal database locale dei Contatti prima di popolare `GroupMembers`. Questa funzione è disattivata per impostazione predefinita e viene eseguita solo dopo il normale superamento del controllo dei gruppi.

Il prompt di sistema dell'agente include un'introduzione al gruppo al primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come un essere umano, evitare tabelle Markdown, ridurre al minimo le righe vuote, seguire la normale spaziatura della chat ed evitare di digitare sequenze letterali `\n`.

## Specifiche di iMessage

- Preferisci `chat_id:<id>` durante l'instradamento o l'allowlist.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte di gruppo tornano sempre allo stesso `chat_id`.

## Specifiche di WhatsApp

Vedi [Messaggi di gruppo](/it/channels/group-messages) per il comportamento specifico di WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).
