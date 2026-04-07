---
read_when:
    - Esecuzione o configurazione dell'onboarding CLI
    - Configurazione di una nuova macchina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: configurazione guidata per gateway, workspace, canali e skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-07T08:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

L'onboarding CLI è il modo **consigliato** per configurare OpenClaw su macOS,
Linux o Windows (tramite WSL2; fortemente consigliato).
Configura un Gateway locale o una connessione a Gateway remoto, oltre a canali, Skills
e impostazioni predefinite del workspace in un unico flusso guidato.

```bash
openclaw onboard
```

<Info>
Il modo più veloce per iniziare a chattare: apri la Control UI (non è necessaria alcuna configurazione del canale). Esegui
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
chiave API, mentre altri non ne richiedono. Puoi configurarlo anche in seguito con
`openclaw configure --section web`. Documentazione: [Strumenti web](/it/tools/web).
</Tip>

## QuickStart vs Advanced

L'onboarding inizia con **QuickStart** (valori predefiniti) oppure **Advanced** (controllo completo).

<Tabs>
  <Tab title="QuickStart (valori predefiniti)">
    - Gateway locale (loopback)
    - Workspace predefinito (o workspace esistente)
    - Porta Gateway **18789**
    - Autenticazione Gateway **Token** (generato automaticamente, anche su loopback)
    - Policy strumenti predefinita per nuove configurazioni locali: `tools.profile: "coding"` (l'eventuale profilo esplicito esistente viene preservato)
    - Isolamento DM predefinito: l'onboarding locale scrive `session.dmScope: "per-channel-peer"` se non impostato. Dettagli: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **Disattivata**
    - I DM di Telegram + WhatsApp sono impostati di default su **allowlist** (ti verrà chiesto il tuo numero di telefono)
  </Tab>
  <Tab title="Advanced (controllo completo)">
    - Espone ogni passaggio (modalità, workspace, gateway, canali, daemon, Skills).
  </Tab>
</Tabs>

## Cosa configura l'onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Modello/Auth** — scegli qualsiasi flusso provider/auth supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Provider personalizzato
   (compatibile con OpenAI, compatibile con Anthropic o Unknown con rilevamento automatico). Scegli un modello predefinito.
   Nota di sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti webhook/hooks, preferisci il modello più robusto e di ultima generazione disponibile e mantieni rigorosa la policy degli strumenti. I livelli più deboli/vecchi sono più facili da colpire con prompt injection.
   Per esecuzioni non interattive, `--secret-input-mode ref` memorizza ref supportati da env nei profili auth invece di valori di chiavi API in testo semplice.
   In modalità `ref` non interattiva, la variabile d'ambiente del provider deve essere impostata; passare flag di chiave inline senza quella variabile env fallisce immediatamente.
   Nelle esecuzioni interattive, scegliere la modalità secret reference ti consente di puntare a una variabile d'ambiente oppure a un provider ref configurato (`file` o `exec`), con una rapida validazione preliminare prima del salvataggio.
   Per Anthropic, l'onboarding/configurazione interattivi offrono **Anthropic Claude CLI** come percorso locale preferito e **chiave API Anthropic** come percorso di produzione consigliato. Anthropic setup-token resta disponibile come percorso di autenticazione con token supportato.
2. **Workspace** — posizione dei file dell'agente (predefinita `~/.openclaw/workspace`). Inizializza i file bootstrap.
3. **Gateway** — porta, indirizzo di bind, modalità auth, esposizione Tailscale.
   In modalità token interattiva, scegli l'archiviazione predefinita del token in testo semplice oppure attiva SecretRef.
   Percorso SecretRef del token in modalità non interattiva: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** — canali chat integrati e inclusi come BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** — installa un LaunchAgent (macOS), un'unità utente systemd (Linux/WSL2) o un'attività pianificata nativa di Windows con fallback per utente nella cartella Startup.
   Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo convalida ma non persiste il token risolto nei metadati dell'ambiente del servizio supervisor.
   Se l'autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni operative.
   Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo integrità** — avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — installa le Skills consigliate e le dipendenze facoltative.

<Note>
Rieseguire l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reset** (o passi `--reset`).
CLI `--reset` usa come predefinito configurazione, credenziali e sessioni; usa `--reset-scope full` per includere il workspace.
Se la configurazione non è valida o contiene chiavi legacy, l'onboarding ti chiede prima di eseguire `openclaw doctor`.
</Note>

La **modalità remota** configura solo il client locale per connettersi a un Gateway altrove.
**Non** installa né modifica nulla sull'host remoto.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con il proprio workspace,
le proprie sessioni e i propri profili auth. Eseguire senza `--workspace` avvia l'onboarding.

Cosa imposta:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- I workspace predefiniti seguono `~/.openclaw/workspace-<agentId>`.
- Aggiungi `bindings` per instradare i messaggi in ingresso (l'onboarding può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per scomposizioni dettagliate passo passo e output di configurazione, vedi
[Riferimento configurazione CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, vedi [Automazione CLI](/it/start/wizard-cli-automation).
Per il riferimento tecnico più approfondito, inclusi i dettagli RPC, vedi
[Riferimento onboarding](/it/reference/wizard).

## Documentazione correlata

- Riferimento comandi CLI: [`openclaw onboard`](/cli/onboard)
- Panoramica onboarding: [Panoramica onboarding](/it/start/onboarding-overview)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Rituale di prima esecuzione dell'agente: [Bootstrap dell'agente](/it/start/bootstrapping)
