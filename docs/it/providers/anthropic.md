---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
    - Vuoi riutilizzare l'autenticazione in abbonamento di Claude CLI sull'host del gateway
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T14:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic sviluppa la famiglia di modelli **Claude** e fornisce l'accesso tramite API.
In OpenClaw, la nuova configurazione di Anthropic dovrebbe usare una chiave API o il backend locale Claude CLI.
I profili token Anthropic legacy esistenti vengono comunque rispettati a runtime
se sono già configurati.

<Warning>
La documentazione pubblica di Anthropic Claude Code documenta esplicitamente l'uso non interattivo della CLI
come `claude -p`. In base a tale documentazione, riteniamo che il fallback locale,
gestito dall'utente, di Claude Code CLI sia probabilmente consentito.

Separatamente, Anthropic ha notificato agli utenti di OpenClaw il **4 aprile 2026 alle 12:00
PT / 20:00 BST** che **OpenClaw è considerato un harness di terze parti**. La loro
policy dichiarata è che il traffico Claude-login guidato da **OpenClaw** non usa più il
pool incluso dell'abbonamento Claude e richiede invece **Extra Usage**
(pay-as-you-go, fatturato separatamente dall'abbonamento).

Questa distinzione di policy riguarda il **riuso di Claude CLI guidato da OpenClaw**,
non l'esecuzione di `claude` direttamente nel proprio terminale. Detto questo, la
policy di Anthropic sugli harness di terze parti lascia ancora abbastanza ambiguità
sull'uso supportato da abbonamento in prodotti esterni, per cui non consigliamo questo
percorso per la produzione.

Documentazione pubblica attuale di Anthropic:

- [Riferimento Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Panoramica Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Uso di Claude Code con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Uso di Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Se vuoi il percorso di fatturazione più chiaro, usa invece una chiave API Anthropic.
OpenClaw supporta anche altre opzioni in stile abbonamento, tra cui [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax) e [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Opzione A: chiave API Anthropic

**Ideale per:** accesso API standard e fatturazione basata sull'utilizzo.
Crea la tua chiave API nella Anthropic Console.

### Configurazione CLI

```bash
openclaw onboard
# scegli: Anthropic API key

# oppure non interattivo
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Snippet di configurazione Claude CLI

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Valori predefiniti di thinking (Claude 4.6)

- I modelli Anthropic Claude 4.6 usano per impostazione predefinita il thinking `adaptive` in OpenClaw quando non è impostato alcun livello di thinking esplicito.
- Puoi sovrascriverlo per messaggio (`/think:<level>`) o nei parametri del modello:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentazione Anthropic correlata:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modalità fast (Anthropic API)

L'interruttore condiviso `/fast` di OpenClaw supporta anche il traffico pubblico diretto Anthropic, incluse le richieste autenticate con chiave API e OAuth inviate a `api.anthropic.com`.

- `/fast on` corrisponde a `service_tier: "auto"`
- `/fast off` corrisponde a `service_tier: "standard_only"`
- Configurazione predefinita:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Limiti importanti:

- OpenClaw inietta i service tier Anthropic solo per richieste dirette a `api.anthropic.com`. Se instradi `anthropic/*` tramite un proxy o gateway, `/fast` lascia invariato `service_tier`.
- I parametri espliciti del modello Anthropic `serviceTier` o `service_tier` hanno precedenza sul valore predefinito di `/fast` quando sono entrambi impostati.
- Anthropic riporta il tier effettivo nella risposta sotto `usage.service_tier`. Negli account senza capacità Priority Tier, `service_tier: "auto"` può comunque risolversi in `standard`.

## Prompt caching (Anthropic API)

OpenClaw supporta la funzionalità di prompt caching di Anthropic. È **solo API**; l'autenticazione legacy con token Anthropic non rispetta le impostazioni della cache.

### Configurazione

Usa il parametro `cacheRetention` nella configurazione del tuo modello:

| Valore   | Durata della cache | Descrizione                    |
| -------- | ------------------ | ------------------------------ |
| `none`   | Nessuna cache      | Disabilita il prompt caching   |
| `short`  | 5 minuti           | Predefinito per auth API Key   |
| `long`   | 1 ora              | Cache estesa                   |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Valori predefiniti

Quando usi l'autenticazione Anthropic API Key, OpenClaw applica automaticamente `cacheRetention: "short"` (cache di 5 minuti) per tutti i modelli Anthropic. Puoi sovrascriverlo impostando esplicitamente `cacheRetention` nella tua configurazione.

### Override di `cacheRetention` per agente

Usa i parametri a livello di modello come base, poi sovrascrivi agenti specifici tramite `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // base per la maggior parte degli agenti
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override solo per questo agente
    ],
  },
}
```

Ordine di merge della configurazione per i parametri legati alla cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id` corrispondente, override per chiave)

Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita la cache per evitare costi di scrittura su traffico intermittente o con basso riuso.

### Note su Bedrock Claude

- I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
- I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.
- I valori predefiniti intelligenti della chiave API Anthropic impostano anche `cacheRetention: "short"` per i riferimenti di modello Claude-on-Bedrock quando non è impostato alcun valore esplicito.

## Finestra di contesto 1M (beta Anthropic)

La finestra di contesto 1M di Anthropic è vincolata alla beta. In OpenClaw, abilitala per modello
con `params.context1m: true` per i modelli Opus/Sonnet supportati.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw lo mappa a `anthropic-beta: context-1m-2025-08-07` sulle richieste Anthropic.

Questo si attiva solo quando `params.context1m` è esplicitamente impostato su `true` per
quel modello.

Requisito: Anthropic deve consentire l'uso del contesto lungo per quella credenziale
(di solito fatturazione con chiave API, oppure il percorso Claude-login / autenticazione token legacy di OpenClaw
con Extra Usage abilitato). Altrimenti Anthropic restituisce:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Nota: Anthropic attualmente rifiuta richieste beta `context-1m-*` quando si usa
l'autenticazione token Anthropic legacy (`sk-ant-oat-*`). Se configuri
`context1m: true` con quella modalità di autenticazione legacy, OpenClaw registra un avviso e
ripiega sulla finestra di contesto standard saltando l'header beta context1m
pur mantenendo le beta OAuth richieste.

## Opzione B: Claude CLI come provider di messaggi

**Ideale per:** un host gateway a utente singolo che ha già Claude CLI installato
e autenticato, come fallback locale anziché come percorso di produzione consigliato.

Nota di fatturazione: riteniamo che il fallback Claude Code CLI sia probabilmente consentito per l'automazione locale gestita dall'utente in base alla documentazione CLI pubblica di Anthropic. Detto questo,
la policy di Anthropic sugli harness di terze parti crea abbastanza ambiguità
sull'uso supportato da abbonamento in prodotti esterni da farci sconsigliare questo percorso in
produzione. Anthropic ha anche comunicato agli utenti di OpenClaw che l'uso di Claude
CLI **guidato da OpenClaw** viene trattato come traffico di harness di terze parti e, dal **4 aprile 2026
alle 12:00 PT / 20:00 BST**, richiede **Extra Usage** invece dei
limiti inclusi dell'abbonamento Claude.

Questo percorso usa il binario locale `claude` per l'inferenza del modello invece di chiamare
direttamente l'API Anthropic. OpenClaw lo tratta come un **provider backend CLI**
con riferimenti modello come:

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

Come funziona:

1. OpenClaw avvia `claude -p --output-format stream-json --include-partial-messages ...`
   sull'**host gateway** e invia il prompt su stdin.
2. Il primo turno invia `--session-id <uuid>`.
3. I turni successivi riutilizzano la sessione Claude memorizzata tramite `--resume <sessionId>`.
4. I tuoi messaggi di chat passano comunque attraverso la normale pipeline di messaggi OpenClaw, ma
   la risposta effettiva del modello viene prodotta da Claude CLI.

### Requisiti

- Claude CLI installato sull'host gateway e disponibile nel PATH, oppure configurato
  con un percorso assoluto del comando.
- Claude CLI già autenticato su quel medesimo host:

```bash
claude auth status
```

- OpenClaw carica automaticamente il plugin Anthropic incluso all'avvio del gateway quando la tua
  configurazione fa riferimento esplicito a `claude-cli/...` o alla configurazione backend `claude-cli`.

### Snippet di configurazione

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

Se il binario `claude` non è nel PATH dell'host gateway:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### Cosa ottieni

- Autenticazione dell'abbonamento Claude riutilizzata dalla CLI locale (letta a runtime, non mantenuta)
- Normale instradamento dei messaggi/sessioni OpenClaw
- Continuità di sessione Claude CLI tra i turni (invalidata in caso di cambiamenti di autenticazione)
- Strumenti Gateway esposti a Claude CLI tramite bridge MCP loopback
- Streaming JSONL con avanzamento live dei messaggi parziali

### Migrare dall'autenticazione Anthropic a Claude CLI

Se attualmente usi `anthropic/...` con un profilo token legacy o una chiave API e vuoi
passare lo stesso host gateway a Claude CLI, OpenClaw supporta questo come normale
percorso di migrazione dell'autenticazione del provider.

Prerequisiti:

- Claude CLI installato sul **medesimo host gateway** che esegue OpenClaw
- Claude CLI già autenticato lì: `claude auth login`

Poi esegui:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Oppure nell'onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` e `openclaw configure` interattivi ora preferiscono prima **Anthropic
Claude CLI** e poi **Anthropic API key**.

Cosa fa:

- verifica che Claude CLI sia già autenticato sull'host gateway
- cambia il modello predefinito in `claude-cli/...`
- riscrive i fallback del modello predefinito Anthropic come `anthropic/claude-opus-4-6`
  in `claude-cli/claude-opus-4-6`
- aggiunge voci `claude-cli/...` corrispondenti a `agents.defaults.models`

Verifica rapida:

```bash
openclaw models status
```

Dovresti vedere il modello primario risolto sotto `claude-cli/...`.

Cosa **non** fa:

- eliminare i tuoi profili di autenticazione Anthropic esistenti
- rimuovere ogni vecchio riferimento di configurazione `anthropic/...` al di fuori del percorso principale del
  modello predefinito/allowlist

Questo rende semplice il rollback: se necessario, riporta il modello predefinito a `anthropic/...`.

### Limiti importanti

- Questo **non** è il provider API Anthropic. È il runtime CLI locale.
- OpenClaw non inietta direttamente le chiamate agli strumenti. Claude CLI riceve gli strumenti gateway
  tramite un bridge MCP loopback (`bundleMcp: true`, il valore predefinito).
- Claude CLI trasmette le risposte via JSONL (`stream-json` con
  `--include-partial-messages`). I prompt vengono inviati su stdin, non su argv.
- L'autenticazione viene letta a runtime dalle credenziali Claude CLI live e non viene mantenuta
  nei profili OpenClaw. I prompt del portachiavi vengono soppressi nei contesti non interattivi.
- Il riuso della sessione viene tracciato tramite i metadati `cliSessionBinding`. Quando lo stato
  di login di Claude CLI cambia (nuovo login, rotazione del token), le sessioni memorizzate vengono
  invalidate e viene avviata una nuova sessione.
- È più adatto a un host gateway personale, non a configurazioni di fatturazione condivise multiutente.

Maggiori dettagli: [/gateway/cli-backends](/gateway/cli-backends)

## Note

- La documentazione pubblica di Anthropic Claude Code continua a documentare l'uso diretto della CLI come
  `claude -p`. Riteniamo che il fallback locale gestito dall'utente sia probabilmente consentito, ma
  la comunicazione separata di Anthropic agli utenti OpenClaw afferma che il percorso
  Claude-login di **OpenClaw** è uso di harness di terze parti e richiede **Extra Usage**
  (pay-as-you-go fatturato separatamente dall'abbonamento). Per la produzione,
  consigliamo invece le chiavi API Anthropic.
- Anthropic setup-token è di nuovo disponibile in OpenClaw come percorso legacy/manuale. La comunicazione di fatturazione specifica per OpenClaw di Anthropic si applica ancora, quindi usalo aspettandoti che Anthropic richieda **Extra Usage** per questo percorso.
- I dettagli di autenticazione e le regole di riuso sono in [/concepts/oauth](/concepts/oauth).

## Risoluzione dei problemi

**Errori 401 / token improvvisamente non valido**

- L'autenticazione token Anthropic legacy può scadere o essere revocata.
- Per nuove configurazioni, migra a una chiave API Anthropic o al percorso Claude CLI locale sull'host gateway.

**Nessuna chiave API trovata per il provider "anthropic"**

- L'autenticazione è **per agente**. I nuovi agenti non ereditano le chiavi dell'agente principale.
- Riesegui l'onboarding per quell'agente, oppure configura una chiave API sull'host gateway,
  quindi verifica con `openclaw models status`.

**Nessuna credenziale trovata per il profilo `anthropic:default`**

- Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo.
- Riesegui l'onboarding, oppure configura una chiave API o Claude CLI per quel percorso di profilo.

**Nessun profilo di autenticazione disponibile (tutti in cooldown/non disponibili)**

- Controlla `openclaw models status --json` per `auth.unusableProfiles`.
- I cooldown del rate limit Anthropic possono essere specifici del modello, quindi un modello Anthropic fratello
  può essere ancora utilizzabile anche quando quello corrente è in cooldown.
- Aggiungi un altro profilo Anthropic o attendi la fine del cooldown.

Altro: [/gateway/troubleshooting](/gateway/troubleshooting) e [/help/faq](/help/faq).
