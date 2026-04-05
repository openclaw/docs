---
read_when:
    - Esecuzione o configurazione dell'onboarding CLI
    - Configurazione di una nuova macchina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: configurazione guidata per gateway, workspace, canali e skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-05T14:05:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81e33fb4f8be30e7c2c6e0024bf9bdcf48583ca58eaf5fff5afd37a1cd628523
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

L'onboarding CLI è il modo **consigliato** per configurare OpenClaw su macOS,
Linux o Windows (tramite WSL2; fortemente consigliato).
Configura un Gateway locale o una connessione a un Gateway remoto, oltre a canali, skills
e impostazioni predefinite del workspace in un unico flusso guidato.

```bash
openclaw onboard
```

<Info>
La prima chat più rapida: apri la Control UI (non è necessaria alcuna configurazione del canale). Esegui
`openclaw dashboard` e chatta nel browser. Documentazione: [Dashboard](/web/dashboard).
</Info>

Per riconfigurare in seguito:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Per gli script, usa `--non-interactive`.
</Note>

<Tip>
L'onboarding CLI include un passaggio di ricerca web in cui puoi scegliere un provider
come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Alcuni provider richiedono una
chiave API, mentre altri non ne richiedono. Puoi anche configurarlo in seguito con
`openclaw configure --section web`. Documentazione: [Strumenti web](/tools/web).
</Tip>

## QuickStart vs Advanced

L'onboarding inizia con **QuickStart** (predefiniti) oppure **Advanced** (controllo completo).

<Tabs>
  <Tab title="QuickStart (predefiniti)">
    - Gateway locale (loopback)
    - Workspace predefinito (o workspace esistente)
    - Porta Gateway **18789**
    - Autenticazione Gateway **Token** (generato automaticamente, anche su loopback)
    - Criterio strumenti predefinito per nuove configurazioni locali: `tools.profile: "coding"` (un profilo esplicito esistente viene mantenuto)
    - Impostazione predefinita per l'isolamento dei DM: l'onboarding locale scrive `session.dmScope: "per-channel-peer"` se non impostato. Dettagli: [Riferimento configurazione CLI](/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **Off**
    - I DM Telegram e WhatsApp usano per impostazione predefinita una **allowlist** (ti verrà richiesto il tuo numero di telefono)
  </Tab>
  <Tab title="Advanced (controllo completo)">
    - Espone ogni passaggio (modalità, workspace, gateway, canali, daemon, skills).
  </Tab>
</Tabs>

## Cosa configura l'onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Model/Auth** — scegli qualsiasi flusso provider/autenticazione supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Custom Provider
   (compatibile con OpenAI, compatibile con Anthropic o Unknown con rilevamento automatico). Scegli un modello predefinito.
   Nota sulla sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti webhook/hooks, preferisci il modello più forte disponibile dell'ultima generazione e mantieni rigoroso il criterio degli strumenti. I livelli più deboli/più vecchi sono più facili da colpire con prompt injection.
   Per le esecuzioni non interattive, `--secret-input-mode ref` memorizza riferimenti basati su env nei profili di autenticazione invece di valori di chiavi API in chiaro.
   In modalità `ref` non interattiva, la variabile env del provider deve essere impostata; il passaggio di flag di chiave inline senza quella variabile env fallisce immediatamente.
   Nelle esecuzioni interattive, scegliendo la modalità di riferimento segreto puoi indicare sia una variabile d'ambiente sia un provider ref configurato (`file` o `exec`), con una rapida convalida preliminare prima del salvataggio.
   Per Anthropic, l'onboarding/configurazione interattiva offre **Anthropic Claude CLI** come fallback locale e **Anthropic API key** come percorso di produzione consigliato. Anthropic setup-token è di nuovo disponibile anche come percorso OpenClaw legacy/manuale, con l'aspettativa di fatturazione **Extra Usage** specifica di OpenClaw da parte di Anthropic.
2. **Workspace** — Posizione per i file dell'agente (predefinita `~/.openclaw/workspace`). Inizializza i file bootstrap.
3. **Gateway** — Porta, indirizzo di bind, modalità di autenticazione, esposizione Tailscale.
   In modalità token interattiva, scegli l'archiviazione predefinita del token in chiaro oppure opta per SecretRef.
   Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — canali di chat integrati e plugin inclusi come BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** — Installa un LaunchAgent (macOS), un'unità utente systemd (Linux/WSL2) oppure un'attività pianificata nativa di Windows con fallback per utente nella cartella Startup.
   Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo convalida ma non rende persistente il token risolto nei metadati dell'ambiente del servizio supervisor.
   Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni utili.
   Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Health check** — Avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — Installa le skills consigliate e le dipendenze opzionali.

<Note>
Eseguire nuovamente l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reset** (o passi `--reset`).
L'opzione CLI `--reset` usa per impostazione predefinita configurazione, credenziali e sessioni; usa `--reset-scope full` per includere il workspace.
Se la configurazione non è valida o contiene chiavi legacy, l'onboarding ti chiederà prima di eseguire `openclaw doctor`.
</Note>

La **modalità remota** configura solo il client locale per connettersi a un Gateway altrove.
**Non** installa né modifica nulla sull'host remoto.

## Aggiungi un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con il proprio workspace,
le proprie sessioni e i propri profili di autenticazione. L'esecuzione senza `--workspace` avvia l'onboarding.

Cosa imposta:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- I workspace predefiniti seguono `~/.openclaw/workspace-<agentId>`.
- Aggiungi `bindings` per instradare i messaggi in ingresso (l'onboarding può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per analisi dettagliate passo dopo passo e output di configurazione, vedi
[Riferimento configurazione CLI](/start/wizard-cli-reference).
Per esempi non interattivi, vedi [Automazione CLI](/start/wizard-cli-automation).
Per il riferimento tecnico più approfondito, inclusi i dettagli RPC, vedi
[Riferimento onboarding](/reference/wizard).

## Documenti correlati

- Riferimento comandi CLI: [`openclaw onboard`](/cli/onboard)
- Panoramica dell'onboarding: [Panoramica onboarding](/start/onboarding-overview)
- Onboarding dell'app macOS: [Onboarding](/start/onboarding)
- Rituale della prima esecuzione dell'agente: [Bootstrap dell'agente](/it/start/bootstrapping)
