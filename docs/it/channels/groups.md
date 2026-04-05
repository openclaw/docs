---
read_when:
    - Modifica del comportamento delle chat di gruppo o del controllo tramite menzione
summary: Comportamento delle chat di gruppo tra le varie superfici (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppi
x-i18n:
    generated_at: "2026-04-05T13:43:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
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
- Le risposte richiedono una menzione, a meno che tu non disabiliti esplicitamente il controllo tramite menzione.

In altre parole: i mittenti consentiti dalla allowlist possono attivare OpenClaw menzionandolo.

> In breve
>
> - L'**accesso ai DM** è controllato da `*.allowFrom`.
> - L'**accesso ai gruppi** è controllato da `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - L'**attivazione delle risposte** è controllata dal controllo tramite menzione (`requireMention`, `/activation`).

Flusso rapido (cosa succede a un messaggio di gruppo):

```
groupPolicy? disabled -> scarta
groupPolicy? allowlist -> gruppo consentito? no -> scarta
requireMention? yes -> menzionato? no -> salva solo per il contesto
otherwise -> rispondi
```

## Visibilità del contesto e allowlist

Nella sicurezza dei gruppi sono coinvolti due controlli diversi:

- **Autorizzazione all'attivazione**: chi può attivare l'agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist specifiche del canale).
- **Visibilità del contesto**: quale contesto supplementare viene inserito nel modello (testo della risposta, citazioni, cronologia del thread, metadati inoltrati).

Per impostazione predefinita, OpenClaw privilegia il normale comportamento della chat e mantiene il contesto per lo più così come viene ricevuto. Questo significa che le allowlist decidono principalmente chi può attivare le azioni, non rappresentano un confine universale di redazione per ogni frammento citato o storico.

Il comportamento attuale dipende dal canale:

- Alcuni canali applicano già il filtraggio basato sul mittente per il contesto supplementare in percorsi specifici (ad esempio inizializzazione dei thread Slack, ricerche reply/thread di Matrix).
- Altri canali continuano a inoltrare il contesto di citazione/risposta/inoltro così come viene ricevuto.

Direzione di hardening (pianificata):

- `contextVisibility: "all"` (predefinito) mantiene l'attuale comportamento così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare sui mittenti presenti nella allowlist.
- `contextVisibility: "allowlist_quote"` equivale a `allowlist` più una singola eccezione esplicita per citazione/risposta.

Fino a quando questo modello di hardening non sarà implementato in modo coerente tra i canali, aspettati differenze a seconda della superficie.

![Flusso dei messaggi di gruppo](/images/groups-flow.svg)

Se vuoi...

| Obiettivo                                    | Cosa impostare                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Consentire tutti i gruppi ma rispondere solo alle @menzioni | `groups: { "*": { requireMention: true } }`                |
| Disabilitare tutte le risposte nei gruppi    | `groupPolicy: "disabled"`                                  |
| Solo gruppi specifici                        | `groups: { "<group-id>": { ... } }` (senza chiave `"*"`)   |
| Solo tu puoi attivare nei gruppi             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chiavi di sessione

- Le sessioni di gruppo usano chiavi di sessione `agent:<agentId>:<channel>:group:<id>` (stanze/canali usano `agent:<agentId>:<channel>:channel:<id>`).
- I topic del forum Telegram aggiungono `:topic:<threadId>` all'id del gruppo, così ogni topic ha la propria sessione.
- Le chat dirette usano la sessione main (o una per mittente, se configurato).
- Gli heartbeat vengono saltati per le sessioni di gruppo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pattern: DM personali + gruppi pubblici (agente singolo)

Sì — funziona bene se il tuo traffico “personale” è nei **DM** e quello “pubblico” è nei **gruppi**.

Perché: in modalità agente singolo, i DM di solito arrivano nella chiave di sessione **main** (`agent:main:main`), mentre i gruppi usano sempre chiavi di sessione **non-main** (`agent:main:<channel>:group:<id>`). Se abiliti il sandboxing con `mode: "non-main"`, quelle sessioni di gruppo vengono eseguite in Docker mentre la tua sessione DM principale rimane sull'host.

Questo ti offre un unico “cervello” agente (workspace + memoria condivisi), ma con due posture di esecuzione:

- **DM**: strumenti completi (host)
- **Gruppi**: sandbox + strumenti limitati (Docker)

> Se hai bisogno di workspace/persona davvero separati (“personale” e “pubblico” non devono mai mescolarsi), usa un secondo agente + binding. Vedi [Instradamento multi-agente](/concepts/multi-agent).

Esempio (DM sull'host, gruppi in sandbox + solo strumenti di messaggistica):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // gruppi/canali sono non-main -> in sandbox
        scope: "session", // isolamento massimo (un container per gruppo/canale)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Se allow non è vuoto, tutto il resto viene bloccato (deny ha comunque la precedenza).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Vuoi che “i gruppi possano vedere solo la cartella X” invece di “nessun accesso all'host”? Mantieni `workspaceAccess: "none"` e monta nel sandbox solo i percorsi presenti nella allowlist:

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

- Chiavi di configurazione e valori predefiniti: [Configurazione del Gateway](/gateway/configuration-reference#agentsdefaultssandbox)
- Debug del motivo per cui uno strumento è bloccato: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Dettagli sui bind mount: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Etichette di visualizzazione

- Le etichette UI usano `displayName` quando disponibile, nel formato `<channel>:<token>`.
- `#room` è riservato alle stanze/canali; le chat di gruppo usano `g-<slug>` (minuscolo, spazi -> `-`, mantieni `#@+._-`).

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
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Criterio      | Comportamento                                               |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | I gruppi bypassano le allowlist; il controllo tramite menzione continua ad applicarsi. |
| `"disabled"`  | Blocca completamente tutti i messaggi di gruppo.            |
| `"allowlist"` | Consente solo gruppi/stanze che corrispondono alla allowlist configurata. |

Note:

- `groupPolicy` è separato dal controllo tramite menzione (che richiede @menzioni).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (fallback: `allowFrom` esplicito).
- Le approvazioni di abbinamento DM (voci memorizzate in `*-allowFrom`) si applicano solo all'accesso DM; l'autorizzazione del mittente nei gruppi resta esplicita nelle allowlist di gruppo.
- Discord: la allowlist usa `channels.discord.guilds.<id>.channels`.
- Slack: la allowlist usa `channels.slack.channels`.
- Matrix: la allowlist usa `channels.matrix.groups`. Preferisci gli id stanza o gli alias; la risoluzione del nome delle stanze a cui si partecipa è best-effort e i nomi non risolti vengono ignorati a runtime. Usa `channels.matrix.groupAllowFrom` per limitare i mittenti; sono supportate anche allowlist `users` per singola stanza.
- I DM di gruppo sono controllati separatamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- La allowlist Telegram può corrispondere a id utente (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nomi utente (`"@alice"` o `"alice"`); i prefissi non distinguono tra maiuscole e minuscole.
- Il valore predefinito è `groupPolicy: "allowlist"`; se la tua allowlist dei gruppi è vuota, i messaggi di gruppo vengono bloccati.
- Sicurezza runtime: quando un blocco provider manca completamente (`channels.<provider>` assente), il criterio dei gruppi torna a una modalità fail-closed (di solito `allowlist`) invece di ereditare `channels.defaults.groupPolicy`.

Modello mentale rapido (ordine di valutazione per i messaggi di gruppo):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist di gruppo (`*.groups`, `*.groupAllowFrom`, allowlist specifica del canale)
3. controllo tramite menzione (`requireMention`, `/activation`)

## Controllo tramite menzione (predefinito)

I messaggi di gruppo richiedono una menzione, salvo override per singolo gruppo. I valori predefiniti si trovano per sottosistema in `*.groups."*"`.

Rispondere a un messaggio del bot conta come menzione implicita (quando il canale supporta i metadati di risposta). Questo vale per Telegram, WhatsApp, Slack, Discord e Microsoft Teams.

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

- `mentionPatterns` sono pattern regex sicuri e case-insensitive; i pattern non validi e le forme annidate non sicure di ripetizione vengono ignorati.
- Le superfici che forniscono menzioni esplicite continuano a passare; i pattern sono un fallback.
- Override per agente: `agents.list[].groupChat.mentionPatterns` (utile quando più agenti condividono un gruppo).
- Il controllo tramite menzione viene applicato solo quando è possibile rilevare la menzione (menzioni native o `mentionPatterns` configurati).
- I valori predefiniti di Discord si trovano in `channels.discord.guilds."*"` (sovrascrivibili per singola guild/canale).
- Il contesto della cronologia di gruppo è racchiuso in modo uniforme tra i canali ed è **solo pending** (messaggi saltati a causa del controllo tramite menzione); usa `messages.groupChat.historyLimit` per il valore predefinito globale e `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) per gli override. Imposta `0` per disabilitare.

## Restrizioni degli strumenti per gruppo/canale (opzionale)

Alcune configurazioni dei canali supportano la limitazione degli strumenti disponibili **all'interno di uno specifico gruppo/stanza/canale**.

- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: override per mittente all'interno del gruppo.
  Usa prefissi di chiave espliciti:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e wildcard `"*"`.
  Le chiavi legacy senza prefisso sono ancora accettate e vengono abbinate solo come `id:`.

Ordine di risoluzione (vince il più specifico):

1. corrispondenza `toolsBySender` del gruppo/canale
2. `tools` del gruppo/canale
3. corrispondenza `toolsBySender` predefinita (`"*"` )
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

- Le restrizioni degli strumenti per gruppo/canale vengono applicate in aggiunta al criterio globale/dell'agente sugli strumenti (deny ha comunque la precedenza).
- Alcuni canali usano una nidificazione diversa per stanze/canali (ad esempio Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist di gruppo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` è configurato, le chiavi agiscono come allowlist di gruppo. Usa `"*"` per consentire tutti i gruppi mantenendo comunque il comportamento predefinito della menzione.

Confusione comune: l'approvazione dell'abbinamento DM non è la stessa cosa dell'autorizzazione del gruppo.
Per i canali che supportano l'abbinamento DM, l'archivio di pairing sblocca solo i DM. I comandi nei gruppi richiedono comunque l'autorizzazione esplicita del mittente del gruppo dalle allowlist di configurazione come `groupAllowFrom` o dal fallback di configurazione documentato per quel canale.

Intenti comuni (copia/incolla):

1. Disabilitare tutte le risposte nei gruppi

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

3. Consentire tutti i gruppi ma richiedere la menzione (esplicito)

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

I proprietari del gruppo possono attivare o disattivare l'attivazione per singolo gruppo:

- `/activation mention`
- `/activation always`

Il proprietario è determinato da `channels.whatsapp.allowFrom` (o dall'E.164 del bot stesso se non impostato). Invia il comando come messaggio autonomo. Le altre superfici al momento ignorano `/activation`.

## Campi di contesto

I payload in ingresso dei gruppi impostano:

- `ChatType=group`
- `GroupSubject` (se noto)
- `GroupMembers` (se noto)
- `WasMentioned` (risultato del controllo tramite menzione)
- I topic del forum Telegram includono anche `MessageThreadId` e `IsForum`.

Note specifiche del canale:

- BlueBubbles può opzionalmente arricchire i partecipanti senza nome dei gruppi macOS dal database locale dei Contatti prima di popolare `GroupMembers`. Questa funzione è disattivata per impostazione predefinita e viene eseguita solo dopo che il normale controllo del gruppo è stato superato.

Il prompt di sistema dell'agente include un'introduzione al gruppo al primo turno di una nuova sessione di gruppo. Ricorda al modello di rispondere come un essere umano, evitare le tabelle Markdown ed evitare di digitare sequenze letterali `\n`.

## Specifiche di iMessage

- Preferisci `chat_id:<id>` durante l'instradamento o l'uso nella allowlist.
- Elenca le chat: `imsg chats --limit 20`.
- Le risposte nei gruppi tornano sempre allo stesso `chat_id`.

## Specifiche di WhatsApp

Vedi [Messaggi di gruppo](/channels/group-messages) per il comportamento specifico di WhatsApp (iniezione della cronologia, dettagli sulla gestione delle menzioni).
