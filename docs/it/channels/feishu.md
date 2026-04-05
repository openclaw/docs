---
read_when:
    - Vuoi connettere un bot Feishu/Lark
    - Stai configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-05T13:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Bot Feishu

Feishu (Lark) è una piattaforma di chat di team usata dalle aziende per la messaggistica e la collaborazione. Questo plugin connette OpenClaw a un bot Feishu/Lark usando la sottoscrizione degli eventi WebSocket della piattaforma, così i messaggi possono essere ricevuti senza esporre un URL webhook pubblico.

---

## Plugin incluso

Feishu è incluso nelle attuali release di OpenClaw, quindi non è necessaria
un'installazione separata del plugin.

Se stai usando una build più vecchia o un'installazione personalizzata che non include
Feishu incluso, installalo manualmente:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Avvio rapido

Ci sono due modi per aggiungere il canale Feishu:

### Metodo 1: onboarding (consigliato)

Se hai appena installato OpenClaw, esegui l'onboarding:

```bash
openclaw onboard
```

La procedura guidata ti accompagna in:

1. Creazione di un'app Feishu e raccolta delle credenziali
2. Configurazione delle credenziali dell'app in OpenClaw
3. Avvio del gateway

✅ **Dopo la configurazione**, controlla lo stato del gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Metodo 2: configurazione tramite CLI

Se hai già completato l'installazione iniziale, aggiungi il canale tramite CLI:

```bash
openclaw channels add
```

Scegli **Feishu**, poi inserisci l'App ID e l'App Secret.

✅ **Dopo la configurazione**, gestisci il gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Passaggio 1: creare un'app Feishu

### 1. Apri Feishu Open Platform

Visita [Feishu Open Platform](https://open.feishu.cn/app) ed effettua l'accesso.

I tenant Lark (globali) devono usare [https://open.larksuite.com/app](https://open.larksuite.com/app) e impostare `domain: "lark"` nella configurazione Feishu.

### 2. Crea un'app

1. Fai clic su **Create enterprise app**
2. Compila il nome e la descrizione dell'app
3. Scegli un'icona per l'app

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Copia le credenziali

Da **Credentials & Basic Info**, copia:

- **App ID** (formato: `cli_xxx`)
- **App Secret**

❗ **Importante:** mantieni privato l'App Secret.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Configura i permessi

In **Permissions**, fai clic su **Batch import** e incolla:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Abilita la funzionalità bot

In **App Capability** > **Bot**:

1. Abilita la funzionalità bot
2. Imposta il nome del bot

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Configura la sottoscrizione degli eventi

⚠️ **Importante:** prima di configurare la sottoscrizione degli eventi, assicurati che:

1. Tu abbia già eseguito `openclaw channels add` per Feishu
2. Il gateway sia in esecuzione (`openclaw gateway status`)

In **Event Subscription**:

1. Scegli **Use long connection to receive events** (WebSocket)
2. Aggiungi l'evento: `im.message.receive_v1`
3. (Facoltativo) Per i flussi di lavoro dei commenti Drive, aggiungi anche: `drive.notice.comment_add_v1`

⚠️ Se il gateway non è in esecuzione, la configurazione della long connection potrebbe non essere salvata correttamente.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Pubblica l'app

1. Crea una versione in **Version Management & Release**
2. Invia per la revisione e pubblica
3. Attendi l'approvazione dell'amministratore (le app enterprise di solito vengono approvate automaticamente)

---

## Passaggio 2: configurare OpenClaw

### Configurazione con la procedura guidata (consigliata)

```bash
openclaw channels add
```

Scegli **Feishu** e incolla il tuo App ID e App Secret.

### Configurazione tramite file di configurazione

Modifica `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

Se usi `connectionMode: "webhook"`, imposta sia `verificationToken` sia `encryptKey`. Il server webhook Feishu si collega a `127.0.0.1` per impostazione predefinita; imposta `webhookHost` solo se ti serve intenzionalmente un indirizzo di bind diverso.

#### Verification Token e Encrypt Key (modalità webhook)

Quando usi la modalità webhook, imposta sia `channels.feishu.verificationToken` sia `channels.feishu.encryptKey` nella tua configurazione. Per ottenere i valori:

1. In Feishu Open Platform, apri la tua app
2. Vai a **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Apri la scheda **Encryption** (加密策略)
4. Copia **Verification Token** e **Encrypt Key**

Lo screenshot seguente mostra dove trovare il **Verification Token**. La **Encrypt Key** è elencata nella stessa sezione **Encryption**.

![Verification Token location](/images/feishu-verification-token.png)

### Configurazione tramite variabili d'ambiente

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Dominio Lark (globale)

Se il tuo tenant è su Lark (internazionale), imposta il dominio su `lark` (o una stringa di dominio completa). Puoi impostarlo in `channels.feishu.domain` o per account (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Flag di ottimizzazione della quota

Puoi ridurre l'uso dell'API Feishu con due flag facoltativi:

- `typingIndicator` (predefinito `true`): quando è `false`, salta le chiamate di reazione di digitazione.
- `resolveSenderNames` (predefinito `true`): quando è `false`, salta le chiamate di ricerca del profilo del mittente.

Impostali a livello superiore o per account:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Passaggio 3: avviare e testare

### 1. Avvia il gateway

```bash
openclaw gateway
```

### 2. Invia un messaggio di test

In Feishu, trova il tuo bot e invia un messaggio.

### 3. Approva l'associazione

Per impostazione predefinita, il bot risponde con un codice di pairing. Approvalo:

```bash
openclaw pairing approve feishu <CODE>
```

Dopo l'approvazione, puoi chattare normalmente.

---

## Panoramica

- **Canale bot Feishu**: bot Feishu gestito dal gateway
- **Instradamento deterministico**: le risposte tornano sempre a Feishu
- **Isolamento delle sessioni**: i DM condividono una sessione principale; i gruppi sono isolati
- **Connessione WebSocket**: connessione lunga tramite SDK Feishu, nessun URL pubblico necessario

---

## Controllo degli accessi

### Messaggi diretti

- **Predefinito**: `dmPolicy: "pairing"` (gli utenti sconosciuti ricevono un codice di pairing)
- **Approva l'associazione**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Modalità allowlist**: imposta `channels.feishu.allowFrom` con gli Open ID consentiti

### Chat di gruppo

**1. Criterio di gruppo** (`channels.feishu.groupPolicy`):

- `"open"` = consenti a tutti nei gruppi
- `"allowlist"` = consenti solo `groupAllowFrom`
- `"disabled"` = disabilita i messaggi di gruppo

Predefinito: `allowlist`

**2. Requisito di menzione** (`channels.feishu.requireMention`, sovrascrivibile tramite `channels.feishu.groups.<chat_id>.requireMention`):

- `true` esplicito = richiede @mention
- `false` esplicito = risponde senza menzioni
- quando non impostato e `groupPolicy: "open"` = predefinito `false`
- quando non impostato e `groupPolicy` non è `"open"` = predefinito `true`

---

## Esempi di configurazione dei gruppi

### Consenti tutti i gruppi, senza @mention obbligatoria (predefinito per i gruppi aperti)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Consenti tutti i gruppi, ma richiedi comunque @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Consenti solo gruppi specifici

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Gli ID dei gruppi Feishu (chat_id) hanno un aspetto simile a: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Limitare quali mittenti possono inviare messaggi in un gruppo (allowlist mittenti)

Oltre a consentire il gruppo stesso, **tutti i messaggi** in quel gruppo sono regolati dall'open_id del mittente: solo gli utenti elencati in `groups.<chat_id>.allowFrom` vedono elaborati i propri messaggi; i messaggi degli altri membri vengono ignorati (si tratta di un controllo completo a livello di mittente, non solo per i comandi di controllo come /reset o /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Gli ID utente Feishu (open_id) hanno un aspetto simile a: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Ottenere gli ID di gruppo/utente

### ID gruppo (chat_id)

Gli ID di gruppo hanno un aspetto simile a `oc_xxx`.

**Metodo 1 (consigliato)**

1. Avvia il gateway e menziona il bot con @ nel gruppo
2. Esegui `openclaw logs --follow` e cerca `chat_id`

**Metodo 2**

Usa il debugger API Feishu per elencare le chat di gruppo.

### ID utente (open_id)

Gli ID utente hanno un aspetto simile a `ou_xxx`.

**Metodo 1 (consigliato)**

1. Avvia il gateway e invia un DM al bot
2. Esegui `openclaw logs --follow` e cerca `open_id`

**Metodo 2**

Controlla le richieste di pairing per gli Open ID degli utenti:

```bash
openclaw pairing list feishu
```

---

## Comandi comuni

| Command   | Descrizione            |
| --------- | ---------------------- |
| `/status` | Mostra lo stato del bot |
| `/reset`  | Reimposta la sessione  |
| `/model`  | Mostra/cambia modello  |

> Nota: Feishu non supporta ancora menu di comandi nativi, quindi i comandi devono essere inviati come testo.

## Comandi di gestione del gateway

| Command                    | Descrizione                     |
| -------------------------- | ------------------------------- |
| `openclaw gateway status`  | Mostra lo stato del gateway     |
| `openclaw gateway install` | Installa/avvia il servizio gateway |
| `openclaw gateway stop`    | Arresta il servizio gateway     |
| `openclaw gateway restart` | Riavvia il servizio gateway     |
| `openclaw logs --follow`   | Segue i log del gateway         |

---

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurati che il bot sia stato aggiunto al gruppo
2. Assicurati di menzionare il bot con @ (comportamento predefinito)
3. Verifica che `groupPolicy` non sia impostato su `"disabled"`
4. Controlla i log: `openclaw logs --follow`

### Il bot non riceve messaggi

1. Assicurati che l'app sia pubblicata e approvata
2. Assicurati che la sottoscrizione degli eventi includa `im.message.receive_v1`
3. Assicurati che la **long connection** sia abilitata
4. Assicurati che i permessi dell'app siano completi
5. Assicurati che il gateway sia in esecuzione: `openclaw gateway status`
6. Controlla i log: `openclaw logs --follow`

### Perdita dell'App Secret

1. Reimposta l'App Secret in Feishu Open Platform
2. Aggiorna l'App Secret nella tua configurazione
3. Riavvia il gateway

### Errori di invio dei messaggi

1. Assicurati che l'app abbia il permesso `im:message:send_as_bot`
2. Assicurati che l'app sia pubblicata
3. Controlla i log per errori dettagliati

---

## Configurazione avanzata

### Account multipli

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controlla quale account Feishu viene usato quando le API in uscita non specificano esplicitamente un `accountId`.

### Limiti dei messaggi

- `textChunkLimit`: dimensione dei blocchi di testo in uscita (predefinito: 2000 caratteri)
- `mediaMaxMb`: limite di upload/download dei media (predefinito: 30MB)

### Streaming

Feishu supporta le risposte in streaming tramite schede interattive. Quando è abilitato, il bot aggiorna una scheda mentre genera il testo.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

Imposta `streaming: false` per attendere la risposta completa prima dell'invio.

### Sessioni ACP

Feishu supporta ACP per:

- DM
- conversazioni di gruppo con argomento

L'ACP di Feishu è gestito tramite comandi di testo. Non esistono menu nativi di slash command, quindi usa direttamente messaggi `/acp ...` nella conversazione.

#### Associazioni ACP persistenti

Usa associazioni ACP tipizzate di livello superiore per fissare un DM Feishu o una conversazione con argomento a una sessione ACP persistente.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Avvio ACP associato al thread dalla chat

In un DM Feishu o in una conversazione con argomento, puoi avviare e associare una sessione ACP direttamente lì:

```text
/acp spawn codex --thread here
```

Note:

- `--thread here` funziona per DM e argomenti Feishu.
- I messaggi successivi nel DM/argomento associato vengono instradati direttamente a quella sessione ACP.
- La v1 non si rivolge alle chat di gruppo generiche senza argomento.

### Instradamento multi-agent

Usa `bindings` per instradare i DM o i gruppi Feishu verso agenti diversi.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campi di instradamento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` o `"group"`
- `match.peer.id`: Open ID dell'utente (`ou_xxx`) o ID del gruppo (`oc_xxx`)

Consulta [Ottenere gli ID di gruppo/utente](#get-groupuser-ids) per suggerimenti sul recupero.

---

## Riferimento della configurazione

Configurazione completa: [Configurazione del gateway](/gateway/configuration)

Opzioni principali:

| Setting                                           | Descrizione                             | Default          |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Abilita/disabilita il canale            | `true`           |
| `channels.feishu.domain`                          | Dominio API (`feishu` o `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Modalità di trasporto degli eventi      | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID account predefinito per l'instradamento in uscita | `default`        |
| `channels.feishu.verificationToken`               | Richiesto per la modalità webhook       | -                |
| `channels.feishu.encryptKey`                      | Richiesto per la modalità webhook       | -                |
| `channels.feishu.webhookPath`                     | Percorso della route webhook            | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host di bind del webhook                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta di bind del webhook               | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Override del dominio API per account    | `feishu`         |
| `channels.feishu.dmPolicy`                        | Criterio DM                             | `pairing`        |
| `channels.feishu.allowFrom`                       | Allowlist DM (lista open_id)            | -                |
| `channels.feishu.groupPolicy`                     | Criterio di gruppo                      | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist di gruppo                     | -                |
| `channels.feishu.requireMention`                  | Richiedi @mention per impostazione predefinita | conditional      |
| `channels.feishu.groups.<chat_id>.requireMention` | Override per gruppo di @mention obbligatoria | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Abilita gruppo                          | `true`           |
| `channels.feishu.textChunkLimit`                  | Dimensione dei blocchi di messaggio     | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite dimensione media                 | `30`             |
| `channels.feishu.streaming`                       | Abilita output streaming con schede     | `true`           |
| `channels.feishu.blockStreaming`                  | Abilita streaming a livello di blocco   | `true`           |

---

## Riferimento dmPolicy

| Value         | Comportamento                                                   |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **Predefinito.** Gli utenti sconosciuti ricevono un codice di pairing; devono essere approvati |
| `"allowlist"` | Solo gli utenti in `allowFrom` possono chattare                 |
| `"open"`      | Consenti tutti gli utenti (richiede `"*"` in allowFrom)         |
| `"disabled"`  | Disabilita i DM                                                 |

---

## Tipi di messaggi supportati

### Ricezione

- ✅ Testo
- ✅ Testo avanzato (post)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Sticker

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Schede interattive
- ⚠️ Testo avanzato (formattazione stile post e schede, non funzionalità di authoring Feishu arbitrarie)

### Thread e risposte

- ✅ Risposte inline
- ✅ Risposte ai thread degli argomenti dove Feishu espone `reply_in_thread`
- ✅ Le risposte con media restano consapevoli del thread quando rispondono a un messaggio di thread/argomento

## Commenti Drive

Feishu può attivare l'agente quando qualcuno aggiunge un commento a un documento Feishu Drive (Docs, Sheets,
ecc.). L'agente riceve il testo del commento, il contesto del documento e il thread del commento, così può
rispondere nel thread o apportare modifiche al documento.

Requisiti:

- Sottoscrivi `drive.notice.comment_add_v1` nelle impostazioni di sottoscrizione eventi della tua app Feishu
  (insieme all'esistente `im.message.receive_v1`)
- Lo strumento Drive è abilitato per impostazione predefinita; disabilitalo con `channels.feishu.tools.drive: false`

Lo strumento `feishu_drive` espone queste azioni sui commenti:

| Action                 | Descrizione                         |
| ---------------------- | ----------------------------------- |
| `list_comments`        | Elenca i commenti su un documento   |
| `list_comment_replies` | Elenca le risposte in un thread di commenti |
| `add_comment`          | Aggiunge un nuovo commento di primo livello |
| `reply_comment`        | Risponde a un thread di commenti esistente |

Quando l'agente gestisce un evento di commento Drive, riceve:

- il testo del commento e il mittente
- i metadati del documento (titolo, tipo, URL)
- il contesto del thread del commento per le risposte nel thread

Dopo aver apportato modifiche al documento, l'agente viene guidato a usare `feishu_drive.reply_comment` per notificare il
commentatore e poi emettere l'esatto token silenzioso `NO_REPLY` / `no_reply` per
evitare invii duplicati.

## Superficie delle azioni runtime

Feishu attualmente espone queste azioni runtime:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` e `reactions` quando le reazioni sono abilitate nella configurazione
- azioni sui commenti `feishu_drive`: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Correlati

- [Panoramica dei canali](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
