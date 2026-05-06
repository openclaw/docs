---
read_when:
    - Esecuzione o configurazione dell'onboarding della CLI
    - Configurazione di una nuova macchina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding della CLI: configurazione guidata per Gateway, area di lavoro, canali e Skills'
title: Configurazione iniziale (CLI)
x-i18n:
    generated_at: "2026-05-06T09:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

L’onboarding da CLI è il modo **consigliato** per configurare OpenClaw su macOS,
Linux o Windows (tramite WSL2; fortemente consigliato).
Configura un Gateway locale o una connessione a un Gateway remoto, più canali, Skills,
e impostazioni predefinite dell’area di lavoro in un unico flusso guidato.

```bash
openclaw onboard
```

<Info>
Prima chat più rapida: apri l’interfaccia di controllo (non serve configurare un canale). Esegui
`openclaw dashboard` e chatta nel browser. Documentazione: [Dashboard](/it/web/dashboard).
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
L’onboarding da CLI include un passaggio di ricerca web in cui puoi scegliere un provider
come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Alcuni provider richiedono una
chiave API, mentre altri non richiedono chiavi. Puoi configurarlo anche in seguito con
`openclaw configure --section web`. Documentazione: [Strumenti web](/it/tools/web).
</Tip>

## QuickStart e Avanzata

L’onboarding inizia con **QuickStart** (impostazioni predefinite) o **Avanzata** (controllo completo).

<Tabs>
  <Tab title="QuickStart (impostazioni predefinite)">
    - Gateway locale (loopback)
    - Area di lavoro predefinita (o area di lavoro esistente)
    - Porta Gateway **18789**
    - Autenticazione Gateway **Token** (generato automaticamente, anche su loopback)
    - Criterio strumenti predefinito per le nuove configurazioni locali: `tools.profile: "coding"` (il profilo esplicito esistente viene mantenuto)
    - Impostazione predefinita di isolamento DM: l’onboarding locale scrive `session.dmScope: "per-channel-peer"` quando non è impostato. Dettagli: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **disattivata**
    - I DM Telegram + WhatsApp usano per impostazione predefinita **allowlist** (ti verrà chiesto il tuo numero di telefono)

  </Tab>
  <Tab title="Avanzata (controllo completo)">
    - Espone ogni passaggio (modalità, area di lavoro, Gateway, canali, daemon, Skills).

  </Tab>
</Tabs>

## Cosa configura l’onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Modello/Autenticazione** — scegli qualsiasi provider/flusso di autenticazione supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Provider personalizzato
   (compatibile con OpenAI, compatibile con Anthropic o rilevamento automatico sconosciuto). Scegli un modello predefinito.
   Nota di sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti Webhook/hook, preferisci il modello di ultima generazione più robusto disponibile e mantieni restrittivo il criterio degli strumenti. I livelli più deboli/vecchi sono più facili da colpire con prompt injection.
   Per le esecuzioni non interattive, `--secret-input-mode ref` memorizza nei profili di autenticazione riferimenti basati su env invece dei valori delle chiavi API in chiaro.
   Nella modalità non interattiva `ref`, la variabile env del provider deve essere impostata; passare flag di chiave inline senza quella variabile env fallisce subito.
   Nelle esecuzioni interattive, scegliere la modalità riferimento segreto ti consente di puntare a una variabile d’ambiente o a un ref provider configurato (`file` o `exec`), con una rapida validazione preliminare prima del salvataggio.
   Per Anthropic, onboarding/configure interattivi offrono **Anthropic Claude CLI** come percorso locale preferito e **chiave API Anthropic** come percorso di produzione consigliato. Anche Anthropic setup-token resta disponibile come percorso di autenticazione tramite token supportato.
2. **Area di lavoro** — Posizione per i file dell’agente (predefinita `~/.openclaw/workspace`). Inizializza i file di bootstrap.
3. **Gateway** — Porta, indirizzo di binding, modalità di autenticazione, esposizione Tailscale.
   In modalità token interattiva, scegli l’archiviazione predefinita del token in chiaro o opta per SecretRef.
   Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** — canali chat integrati e in bundle come BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** — Installa un LaunchAgent (macOS), un’unità utente systemd (Linux/WSL2) o un’attività pianificata Windows nativa con fallback per utente nella cartella Esecuzione automatica.
   Se l’autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione del daemon lo valida ma non mantiene il token risolto nei metadati d’ambiente del servizio supervisore.
   Se l’autenticazione token richiede un token e il SecretRef token configurato non è risolto, l’installazione del daemon viene bloccata con indicazioni operative.
   Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l’installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo di integrità** — Avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — Installa Skills consigliate e dipendenze opzionali.

<Note>
Eseguire di nuovo l’onboarding **non** elimina nulla, a meno che tu scelga esplicitamente **Reimposta** (o passi `--reset`).
CLI `--reset` ha come impostazione predefinita configurazione, credenziali e sessioni; usa `--reset-scope full` per includere l’area di lavoro.
Se la configurazione non è valida o contiene chiavi legacy, l’onboarding ti chiede di eseguire prima `openclaw doctor`.
</Note>

La **modalità remota** configura solo il client locale per connettersi a un Gateway altrove.
**Non** installa né modifica nulla sull’host remoto.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con la propria area di lavoro,
sessioni e profili di autenticazione. L’esecuzione senza `--workspace` avvia l’onboarding.

Cosa imposta:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- Le aree di lavoro predefinite seguono `~/.openclaw/workspace-<agentId>`.
- Aggiungi `bindings` per instradare i messaggi in ingresso (l’onboarding può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per descrizioni dettagliate passo passo e output di configurazione, consulta
[Riferimento configurazione CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, consulta [Automazione CLI](/it/start/wizard-cli-automation).
Per il riferimento tecnico più approfondito, inclusi i dettagli RPC, consulta
[Riferimento onboarding](/it/reference/wizard).

## Documentazione correlata

- Riferimento comando CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica onboarding: [Panoramica onboarding](/it/start/onboarding-overview)
- Onboarding app macOS: [Onboarding](/it/start/onboarding)
- Rituale di primo avvio dell’agente: [Bootstrap dell’agente](/it/start/bootstrapping)
