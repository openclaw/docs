---
read_when:
    - Esecuzione o configurazione dell’onboarding CLI
    - Configurare una nuova macchina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: configurazione guidata per Gateway, area di lavoro, canali e Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-06-27T18:17:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

L’onboarding CLI è il percorso di configurazione da terminale **consigliato** per OpenClaw su
macOS, Linux o Windows. Gli utenti desktop Windows possono anche iniziare da
[Windows Hub](/it/platforms/windows).
Configura un Gateway locale o una connessione a un Gateway remoto, oltre a canali, Skills
e impostazioni predefinite dell’area di lavoro in un unico flusso guidato.

```bash
openclaw onboard
```

## Impostazioni locali

La procedura guidata CLI localizza il testo fisso dell’onboarding. Risolve le impostazioni locali da
`OPENCLAW_LOCALE`, poi `LC_ALL`, poi `LC_MESSAGES`, poi `LANG`, e ripiega
sull’inglese. Le lingue supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

I nomi e gli identificatori stabili restano letterali: `OpenClaw`, `Gateway`, `Tailscale`,
comandi, chiavi di configurazione, URL, ID provider, ID modello ed etichette di Plugin/canale
non vengono tradotti.

<Info>
Prima chat più rapida: apri l’interfaccia Control UI (non serve configurare alcun canale). Esegui
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
L’onboarding CLI include un passaggio di ricerca web in cui puoi scegliere un provider
come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Alcuni provider richiedono una
chiave API, mentre altri non richiedono chiavi. Puoi configurarlo anche in seguito con
`openclaw configure --section web`. Documentazione: [Strumenti web](/it/tools/web).
</Tip>

## QuickStart vs Advanced

L’onboarding inizia con **QuickStart** (impostazioni predefinite) oppure **Advanced** (controllo completo).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway locale (local loopback)
    - Area di lavoro predefinita (o area di lavoro esistente)
    - Porta Gateway **18789**
    - Autenticazione Gateway **Token** (generato automaticamente, anche su loopback)
    - Criterio strumenti predefinito per le nuove configurazioni locali: `tools.profile: "coding"` (il profilo esplicito esistente viene preservato)
    - Impostazione predefinita per l’isolamento dei DM: l’onboarding locale scrive `session.dmScope: "per-channel-peer"` quando non è impostato. Dettagli: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **Disattivata**
    - I DM Telegram + WhatsApp sono impostati per impostazione predefinita su **allowlist** (ti verrà chiesto il numero di telefono)

  </Tab>
  <Tab title="Advanced (full control)">
    - Mostra ogni passaggio (modalità, area di lavoro, gateway, canali, daemon, Skills).

  </Tab>
</Tabs>

## Cosa configura l’onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Modello/Auth** — scegli qualsiasi provider/flusso di autenticazione supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Custom Provider
   (compatibile con OpenAI, compatibile con Anthropic o rilevamento automatico Unknown). Scegli un modello predefinito.
   Nota di sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti Webhook/hook, preferisci il modello di ultima generazione più forte disponibile e mantieni rigoroso il criterio degli strumenti. I livelli più deboli/vecchi sono più facili da manipolare con prompt injection.
   Per le esecuzioni non interattive, `--secret-input-mode ref` archivia nei profili di autenticazione riferimenti basati su env invece dei valori delle chiavi API in testo semplice.
   In modalità non interattiva `ref`, la variabile env del provider deve essere impostata; passare flag con chiavi inline senza quella variabile env fallisce subito.
   Nelle esecuzioni interattive, scegliere la modalità riferimento segreto ti permette di puntare a una variabile d’ambiente oppure a un riferimento provider configurato (`file` o `exec`), con una rapida convalida preliminare prima del salvataggio.
   Per Anthropic, onboarding/configurazione interattivi offrono **Anthropic Claude CLI** come percorso locale preferito e **chiave API Anthropic** come percorso consigliato per la produzione. Anthropic setup-token resta disponibile anche come percorso di autenticazione tramite token supportato.
2. **Area di lavoro** — posizione dei file dell’agente (predefinita `~/.openclaw/workspace`). Inizializza i file di bootstrap.
3. **Gateway** — porta, indirizzo di bind, modalità di autenticazione, esposizione Tailscale.
   In modalità token interattiva, scegli l’archiviazione token predefinita in testo semplice oppure opta per SecretRef.
   Percorso token SecretRef non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** — canali chat integrati e Plugin ufficiali come iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** — installa un LaunchAgent (macOS), un’unità utente systemd (Linux/WSL2) o un’attività pianificata Windows nativa con fallback per utente nella cartella Startup.
   Se l’autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione del daemon lo convalida ma non persiste il token risolto nei metadati dell’ambiente del servizio supervisore.
   Se l’autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l’installazione del daemon viene bloccata con indicazioni operative.
   Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l’installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo integrità** — avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — installa Skills consigliate e dipendenze facoltative.

<Note>
Eseguire di nuovo l’onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reset** (o passi `--reset`).
CLI `--reset` include per impostazione predefinita configurazione, credenziali e sessioni; usa `--reset-scope full` per includere l’area di lavoro.
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
- Aggiungi `bindings` per instradare i messaggi in entrata (l’onboarding può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per analisi dettagliate passo per passo e output di configurazione, consulta
[Riferimento configurazione CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, consulta [Automazione CLI](/it/start/wizard-cli-automation).
Per il riferimento tecnico più approfondito, inclusi i dettagli RPC, consulta
[Riferimento onboarding](/it/reference/wizard).

## Documentazione correlata

- Riferimento comando CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica onboarding: [Panoramica onboarding](/it/start/onboarding-overview)
- Onboarding dell’app macOS: [Onboarding](/it/start/onboarding)
- Rituale di primo avvio dell’agente: [Bootstrap dell’agente](/it/start/bootstrapping)
