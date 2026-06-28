---
read_when:
    - Esecuzione o configurazione dell'onboarding della CLI
    - Configurazione di una nuova macchina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: configurazione guidata per Gateway, area di lavoro, canali e Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

L’onboarding CLI è il percorso di configurazione da terminale **consigliato** per OpenClaw su
macOS, Linux o Windows. Gli utenti desktop Windows possono anche iniziare con
[Windows Hub](/it/platforms/windows).
Configura un Gateway locale o una connessione a un Gateway remoto, oltre a canali, Skills
e impostazioni predefinite dell’area di lavoro in un unico flusso guidato.

```bash
openclaw onboard
```

L’avvio rapido richiede di solito solo pochi minuti, ma l’onboarding completo può richiedere più tempo
quando accesso al provider, associazione dei canali, installazione del demone, download di rete,
Skills o plugin opzionali richiedono configurazione aggiuntiva. La procedura guidata mostra questa tempistica
in anticipo, e i passaggi opzionali possono essere saltati e ripresi in seguito con
`openclaw configure`.

## Impostazioni locali

La procedura guidata CLI localizza i testi fissi dell’onboarding. Risolve le impostazioni locali da
`OPENCLAW_LOCALE`, poi `LC_ALL`, poi `LC_MESSAGES`, poi `LANG`, e usa
l’inglese come fallback. Le impostazioni locali supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nomi e identificatori stabili restano letterali: `OpenClaw`, `Gateway`, `Tailscale`,
comandi, chiavi di configurazione, URL, ID provider, ID modello ed etichette di plugin/canale
non vengono tradotti.

<Info>
Prima chat più rapida: apri la Control UI (non serve configurare canali). Esegui
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

## Avvio rapido vs avanzato

L’onboarding inizia con **Avvio rapido** (impostazioni predefinite) vs **Avanzato** (controllo completo).

<Tabs>
  <Tab title="Avvio rapido (predefiniti)">
    - Gateway locale (loopback)
    - Impostazione predefinita dell’area di lavoro (o area di lavoro esistente)
    - Porta del Gateway **18789**
    - Autenticazione del Gateway **Token** (generato automaticamente, anche su loopback)
    - Criterio strumenti predefinito per le nuove configurazioni locali: `tools.profile: "coding"` (il profilo esplicito esistente viene preservato)
    - Impostazione predefinita per l’isolamento dei DM: l’onboarding locale scrive `session.dmScope: "per-channel-peer"` quando non è impostato. Dettagli: [Riferimento alla configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **Disattivata**
    - I DM Telegram + WhatsApp usano per impostazione predefinita la **lista consentita** (ti verrà chiesto il tuo numero di telefono)

  </Tab>
  <Tab title="Avanzato (controllo completo)">
    - Espone ogni passaggio (modalità, area di lavoro, Gateway, canali, demone, Skills).

  </Tab>
</Tabs>

## Cosa configura l’onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Modello/Autenticazione** — scegli qualsiasi provider/flusso di autenticazione supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Provider personalizzato
   (compatibile con OpenAI, compatibile con Anthropic o rilevamento automatico sconosciuto). Scegli un modello predefinito.
   Nota di sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti da webhook/hook, preferisci il modello di ultima generazione più potente disponibile e mantieni rigoroso il criterio degli strumenti. I livelli più deboli/vecchi sono più facili da sottoporre a prompt injection.
   Per esecuzioni non interattive, `--secret-input-mode ref` memorizza riferimenti basati su env nei profili di autenticazione invece dei valori in chiaro delle chiavi API.
   In modalità `ref` non interattiva, la variabile env del provider deve essere impostata; passare flag con chiave inline senza quella variabile env fallisce subito.
   Nelle esecuzioni interattive, scegliere la modalità riferimento segreto ti consente di puntare a una variabile d’ambiente o a un riferimento provider configurato (`file` o `exec`), con una rapida validazione preliminare prima del salvataggio.
   Per Anthropic, onboarding/configurazione interattivi offrono **Anthropic Claude CLI** come percorso locale preferito e **chiave API Anthropic** come percorso consigliato per la produzione. Anche setup-token di Anthropic resta disponibile come percorso supportato di autenticazione tramite token.
2. **Area di lavoro** — posizione per i file dell’agente (predefinita `~/.openclaw/workspace`). Inizializza i file di bootstrap.
3. **Gateway** — porta, indirizzo di bind, modalità di autenticazione, esposizione Tailscale.
   In modalità token interattiva, scegli l’archiviazione token in chiaro predefinita o opta per SecretRef.
   Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** — canali chat integrati e di plugin ufficiali come iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Demone** — installa un LaunchAgent (macOS), un’unità utente systemd (Linux/WSL2) o un’attività pianificata Windows nativa con fallback alla cartella Avvio per utente.
   Se l’autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione del demone lo valida ma non persiste il token risolto nei metadati dell’ambiente del servizio supervisore.
   Se l’autenticazione tramite token richiede un token e il SecretRef token configurato non è risolto, l’installazione del demone viene bloccata con indicazioni operative.
   Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l’installazione del demone viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo di integrità** — avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — installa Skills consigliate e dipendenze opzionali.

<Note>
Rieseguire l’onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reimposta** (o passi `--reset`).
CLI `--reset` include per impostazione predefinita configurazione, credenziali e sessioni; usa `--reset-scope full` per includere l’area di lavoro.
Se la configurazione non è valida o contiene chiavi legacy, l’onboarding ti chiede prima di eseguire `openclaw doctor`.
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

Per descrizioni dettagliate passo per passo e output di configurazione, consulta
[Riferimento alla configurazione CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, consulta [Automazione CLI](/it/start/wizard-cli-automation).
Per il riferimento tecnico più approfondito, inclusi i dettagli RPC, consulta
[Riferimento all’onboarding](/it/reference/wizard).

## Documentazione correlata

- Riferimento comandi CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica dell’onboarding: [Panoramica dell’onboarding](/it/start/onboarding-overview)
- Onboarding dell’app macOS: [Onboarding](/it/start/onboarding)
- Rituale di primo avvio dell’agente: [Bootstrap dell’agente](/it/start/bootstrapping)
