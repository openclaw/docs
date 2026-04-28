---
read_when:
    - |-
      Eseguire o configurare l’onboarding CLIИхадоу to=final code```
      Eseguire o configurare l’onboarding CLI
      ```
    - |-
      Configurare una nuova macchinaкәын to=final code```
      Configurare una nuova macchina
      ```
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: configurazione guidata per gateway, workspace, canali e Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T09:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

L’onboarding CLI è il modo **consigliato** per configurare OpenClaw su macOS,
Linux o Windows (tramite WSL2; fortemente consigliato).
Configura un Gateway locale o una connessione a un Gateway remoto, più canali, Skills
e valori predefiniti del workspace in un unico flusso guidato.

```bash
openclaw onboard
```

<Info>
Primo chat più rapido: apri la Control UI (non serve configurare canali). Esegui
`openclaw dashboard` e chatta nel browser. Documentazione: [Dashboard](/it/web/dashboard).
</Info>

Per riconfigurare più tardi:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Per gli script, usa `--non-interactive`.
</Note>

<Tip>
L’onboarding CLI include un passaggio di ricerca web in cui puoi scegliere un provider
come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Alcuni provider richiedono una
chiave API, mentre altri non la richiedono. Puoi configurarlo anche più tardi con
`openclaw configure --section web`. Documentazione: [Strumenti web](/it/tools/web).
</Tip>

## QuickStart vs Advanced

L’onboarding inizia con **QuickStart** (predefiniti) oppure **Advanced** (controllo completo).

<Tabs>
  <Tab title="QuickStart (predefiniti)">
    - Gateway locale (loopback)
    - Workspace predefinito (o workspace esistente)
    - Porta Gateway **18789**
    - Autenticazione Gateway **Token** (generato automaticamente, anche su loopback)
    - Policy strumenti predefinita per nuove configurazioni locali: `tools.profile: "coding"` (i profili espliciti esistenti vengono preservati)
    - Predefinito di isolamento DM: l’onboarding locale scrive `session.dmScope: "per-channel-peer"` quando non è impostato. Dettagli: [Riferimento della configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **Disattivata**
    - I DM Telegram + WhatsApp usano come predefinito **allowlist** (ti verrà chiesto il tuo numero di telefono)

  </Tab>
  <Tab title="Advanced (controllo completo)">
    - Espone ogni passaggio (modalità, workspace, gateway, canali, daemon, Skills).

  </Tab>
</Tabs>

## Cosa configura l’onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Modello/Auth** — scegli qualsiasi provider/flusso di autenticazione supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Custom Provider
   (OpenAI-compatible, Anthropic-compatible o Unknown con auto-rilevamento). Scegli un modello predefinito.
   Nota di sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti webhook/hooks, preferisci il modello di ultima generazione più forte disponibile e mantieni rigorosa la policy degli strumenti. I livelli più deboli/vecchi sono più facili da colpire con prompt injection.
   Per esecuzioni non interattive, `--secret-input-mode ref` memorizza riferimenti supportati da env nei profili di autenticazione invece di valori plaintext di chiavi API.
   In modalità `ref` non interattiva, la variabile env del provider deve essere impostata; passare flag di chiave inline senza quella variabile env fallisce immediatamente.
   Nelle esecuzioni interattive, scegliere la modalità di riferimento segreto ti permette di puntare a una variabile d’ambiente oppure a un riferimento provider configurato (`file` o `exec`), con una rapida validazione di preflight prima del salvataggio.
   Per Anthropic, onboarding/configurazione interattivi offrono **Anthropic Claude CLI** come percorso locale preferito e **chiave API Anthropic** come percorso consigliato per la produzione. Anthropic setup-token resta comunque disponibile come percorso supportato di autenticazione tramite token.
2. **Workspace** — posizione per i file dell’agente (predefinita `~/.openclaw/workspace`). Inizializza i file bootstrap.
3. **Gateway** — porta, indirizzo bind, modalità di autenticazione, esposizione Tailscale.
   In modalità token interattiva, scegli l’archiviazione predefinita del token plaintext oppure opta per SecretRef.
   Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** — canali chat integrati e inclusi come BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** — installa un LaunchAgent (macOS), unità utente systemd (Linux/WSL2) oppure Scheduled Task nativo Windows con fallback per utente nella cartella Startup.
   Se l’autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione del daemon lo valida ma non persiste il token risolto nei metadati dell’ambiente del servizio supervisor.
   Se l’autenticazione token richiede un token e il SecretRef configurato del token non è risolto, l’installazione del daemon viene bloccata con indicazioni operative.
   Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l’installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo di salute** — avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — installa Skills consigliate e dipendenze opzionali.

<Note>
Rieseguire l’onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reset** (oppure passi `--reset`).
CLI `--reset` usa come predefinito configurazione, credenziali e sessioni; usa `--reset-scope full` per includere il workspace.
Se la configurazione non è valida o contiene chiavi legacy, l’onboarding ti chiede prima di eseguire `openclaw doctor`.
</Note>

La **modalità remota** configura solo il client locale per collegarsi a un Gateway altrove.
**Non** installa né modifica nulla sull’host remoto.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con il proprio workspace,
sessioni e profili di autenticazione. Eseguire senza `--workspace` avvia l’onboarding.

Cosa imposta:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- I workspace predefiniti seguono `~/.openclaw/workspace-<agentId>`.
- Aggiungi `bindings` per instradare i messaggi in ingresso (l’onboarding può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per suddivisioni dettagliate passo per passo e output di configurazione, vedi
[Riferimento della configurazione CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, vedi [Automazione CLI](/it/start/wizard-cli-automation).
Per il riferimento tecnico approfondito, inclusi i dettagli RPC, vedi
[Riferimento Onboarding](/it/reference/wizard).

## Documentazione correlata

- Riferimento comandi CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica onboarding: [Panoramica dell’onboarding](/it/start/onboarding-overview)
- Onboarding app macOS: [Onboarding](/it/start/onboarding)
- Rituale di primo avvio dell’agente: [Bootstrapping dell’agente](/it/start/bootstrapping)
