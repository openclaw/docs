---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-07T08:16:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic sviluppa la famiglia di modelli **Claude** e fornisce accesso tramite API e
Claude CLI. In OpenClaw sono supportati sia le chiavi API Anthropic sia il riuso di Claude CLI.
I profili legacy dei token Anthropic esistenti continuano a essere rispettati a runtime se sono già configurati.

<Warning>
Lo staff di Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi
OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa
integrazione, a meno che Anthropic non pubblichi una nuova policy.

Per host Gateway di lunga durata, le chiavi API Anthropic restano comunque il percorso di produzione più chiaro e
prevedibile. Se usi già Claude CLI sull'host,
OpenClaw può riutilizzare direttamente quel login.

Documentazione pubblica attuale di Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Se vuoi il percorso di fatturazione più chiaro, usa invece una chiave API Anthropic.
OpenClaw supporta anche altre opzioni in stile subscription, tra cui [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding Plan](/it/providers/qwen),
[MiniMax Coding Plan](/it/providers/minimax) e [Z.AI / GLM Coding
Plan](/it/providers/glm).
</Warning>

## Opzione A: chiave API Anthropic

**Ideale per:** accesso API standard e fatturazione basata sull'utilizzo.
Crea la tua chiave API nella Anthropic Console.

### Configurazione CLI

```bash
openclaw onboard
# scegli: chiave API Anthropic

# oppure in modalità non interattiva
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Snippet di configurazione Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Valori predefiniti di thinking (Claude 4.6)

- I modelli Anthropic Claude 4.6 usano per impostazione predefinita thinking `adaptive` in OpenClaw quando non è impostato un livello di thinking esplicito.
- Puoi fare override per messaggio (`/think:<level>`) o nei parametri del modello:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentazione Anthropic correlata:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modalità fast (API Anthropic)

Il toggle condiviso `/fast` di OpenClaw supporta anche il traffico pubblico diretto verso Anthropic, comprese le richieste autenticate con chiave API e OAuth inviate a `api.anthropic.com`.

- `/fast on` corrisponde a `service_tier: "auto"`
- `/fast off` corrisponde a `service_tier: "standard_only"`
- Valore predefinito di configurazione:

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
- I parametri espliciti del modello Anthropic `serviceTier` o `service_tier` hanno precedenza sul valore predefinito di `/fast` quando entrambi sono impostati.
- Anthropic riporta il tier effettivo nella risposta sotto `usage.service_tier`. Negli account senza capacità Priority Tier, `service_tier: "auto"` può comunque risolversi in `standard`.

## Prompt caching (API Anthropic)

OpenClaw supporta la funzionalità di prompt caching di Anthropic. Questa è **solo API**; l'autenticazione legacy con token Anthropic non rispetta le impostazioni della cache.

### Configurazione

Usa il parametro `cacheRetention` nella configurazione del modello:

| Valore  | Durata della cache | Descrizione                     |
| ------- | ------------------ | ------------------------------- |
| `none`  | Nessuna cache      | Disabilita il prompt caching    |
| `short` | 5 minuti           | Predefinito per auth con chiave API |
| `long`  | 1 ora              | Cache estesa                    |

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

Quando usi l'autenticazione con chiave API Anthropic, OpenClaw applica automaticamente `cacheRetention: "short"` (cache di 5 minuti) per tutti i modelli Anthropic. Puoi fare override impostando esplicitamente `cacheRetention` nella tua configurazione.

### Override `cacheRetention` per agente

Usa i parametri a livello di modello come baseline, quindi fai override per agenti specifici tramite `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline per la maggior parte degli agenti
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

Ordine di merge della configurazione per i parametri correlati alla cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (corrispondenza su `id`, override per chiave)

Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita la cache per evitare costi di scrittura su traffico bursty o con basso riutilizzo.

### Note su Bedrock Claude

- I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
- I modelli Bedrock non-Anthropic sono forzati a `cacheRetention: "none"` a runtime.
- I valori predefiniti intelligenti per le chiavi API Anthropic impostano anche `cacheRetention: "short"` per i riferimenti modello Claude-on-Bedrock quando non è impostato alcun valore esplicito.

## Finestra di contesto da 1M (beta Anthropic)

La finestra di contesto da 1M di Anthropic è accessibile in beta. In OpenClaw, abilitala per modello
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

OpenClaw la mappa a `anthropic-beta: context-1m-2025-08-07` nelle richieste
Anthropic.

Si attiva solo quando `params.context1m` è esplicitamente impostato su `true` per
quel modello.

Requisito: Anthropic deve consentire l'uso del long-context per quella credenziale.

Nota: Anthropic attualmente rifiuta le richieste beta `context-1m-*` quando si usa
l'autenticazione legacy con token Anthropic (`sk-ant-oat-*`). Se configuri
`context1m: true` con quella modalità di autenticazione legacy, OpenClaw registra un avviso e
torna alla finestra di contesto standard saltando l'header beta context1m
pur mantenendo le beta OAuth richieste.

## Backend Claude CLI

Il backend bundled `claude-cli` di Anthropic è supportato in OpenClaw.

- Lo staff di Anthropic ci ha detto che questo utilizzo è di nuovo consentito.
- OpenClaw quindi considera il riuso di Claude CLI e l'uso di `claude -p` come
  approvati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- Le chiavi API Anthropic restano il percorso di produzione più chiaro per host Gateway sempre attivi
  e per un controllo esplicito della fatturazione lato server.
- I dettagli di setup e runtime sono in [/gateway/cli-backends](/it/gateway/cli-backends).

## Note

- La documentazione pubblica di Claude Code di Anthropic continua a documentare l'uso diretto della CLI come
  `claude -p`, e lo staff di Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è
  di nuovo consentito. Trattiamo questa indicazione come definitiva a meno che Anthropic
  non pubblichi un nuovo cambiamento di policy.
- setup-token Anthropic resta disponibile in OpenClaw come percorso supportato di autenticazione tramite token, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
- I dettagli di autenticazione e le regole di riuso sono in [/concepts/oauth](/it/concepts/oauth).

## Risoluzione dei problemi

**Errori 401 / token improvvisamente non valido**

- L'autenticazione con token Anthropic può scadere o essere revocata.
- Per una nuova configurazione, passa a una chiave API Anthropic.

**Nessuna chiave API trovata per il provider "anthropic"**

- L'autenticazione è **per agente**. I nuovi agenti non ereditano le chiavi dell'agente principale.
- Esegui di nuovo onboarding per quell'agente, oppure configura una chiave API sull'host Gateway,
  poi verifica con `openclaw models status`.

**Nessuna credenziale trovata per il profilo `anthropic:default`**

- Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo.
- Esegui di nuovo onboarding, oppure configura una chiave API per quel percorso profilo.

**Nessun profilo di autenticazione disponibile (tutti in cooldown/non disponibili)**

- Controlla `openclaw models status --json` per `auth.unusableProfiles`.
- I cooldown dovuti al rate limit Anthropic possono essere limitati al modello, quindi un modello Anthropic correlato
  potrebbe essere ancora utilizzabile anche quando quello corrente è in cooldown.
- Aggiungi un altro profilo Anthropic oppure attendi la fine del cooldown.

Altro: [/gateway/troubleshooting](/it/gateway/troubleshooting) e [/help/faq](/it/help/faq).
