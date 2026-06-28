---
read_when:
    - Vuoi usare l’abbonamento Claude Max con strumenti compatibili con OpenAI
    - Vuoi un server API locale che faccia da wrapper per Claude Code CLI
    - Vuoi valutare l’accesso ad Anthropic basato su abbonamento rispetto a quello basato su chiave API
summary: Proxy della community per esporre le credenziali dell’abbonamento Claude come endpoint compatibile con OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:44:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** è uno strumento della community che espone il tuo abbonamento Claude Max/Pro come endpoint API compatibile con OpenAI. Questo ti consente di usare il tuo abbonamento con qualsiasi strumento che supporti il formato dell'API OpenAI.

<Warning>
Questo percorso offre solo compatibilità tecnica. In passato Anthropic ha bloccato alcuni utilizzi degli abbonamenti
al di fuori di Claude Code. Devi decidere autonomamente se usarlo
e verificare le regole di fatturazione attuali di Anthropic prima di farci affidamento.

La documentazione di supporto attuale di Anthropic indica che `claude -p` è uso Agent SDK/programmatico.
L'aggiornamento di supporto Anthropic del 15 giugno 2026 ha sospeso il piano di crediti
Agent SDK separato annunciato. Per ora, Claude Agent SDK, `claude -p` e l'uso di app di terze parti
continuano a consumare i limiti di utilizzo dell'abbonamento con cui hai effettuato l'accesso.

Prima di fare affidamento su questo percorso, consulta l'[articolo sul piano Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
di Anthropic, oltre agli articoli di supporto di Claude Code per gli account
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
o
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Perché usarlo?

| Approccio                 | Percorso dei costi                                  | Ideale per                                      |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| API Anthropic             | Pagamento per token tramite Claude Console o cloud  | App di produzione, automazione condivisa, volume |
| Proxy abbonamento Claude  | Regole del piano e dei crediti Claude Code / `claude -p` | Esperimenti personali con strumenti compatibili |

Se hai un abbonamento Claude Max o Pro e vuoi usarlo con
strumenti compatibili con OpenAI, questo proxy può adattarsi ad alcuni flussi di lavoro personali. Non è un percorso
illimitato a tariffa fissa. Le chiavi API restano il percorso più chiaro per policy e fatturazione
nell'uso in produzione.

## Come funziona

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Il proxy:

1. Accetta richieste in formato OpenAI su `http://localhost:3456/v1/chat/completions`
2. Le converte in comandi Claude Code CLI
3. Restituisce le risposte in formato OpenAI (streaming supportato)

## Primi passi

<Steps>
  <Step title="Install the proxy">
    Richiede Node.js 22+ e Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    Punta OpenClaw al proxy come endpoint personalizzato compatibile con OpenAI:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Catalogo integrato

| ID modello        | Mappa a         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Questo percorso usa lo stesso instradamento proxy compatibile con OpenAI degli altri backend
    `/v1` personalizzati:

    - La modellazione delle richieste nativa solo OpenAI non si applica
    - Nessun `service_tier`, nessuno `store` Responses, nessun suggerimento di prompt-cache e nessuna
      modellazione del payload di compatibilità reasoning OpenAI
    - Le intestazioni di attribuzione OpenClaw nascoste (`originator`, `version`, `User-Agent`)
      non vengono iniettate sull'URL del proxy

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    Crea un LaunchAgent per eseguire automaticamente il proxy:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Note

- Questo è uno **strumento della community**, non supportato ufficialmente da Anthropic o OpenClaw
- Richiede un abbonamento Claude Max/Pro attivo con Claude Code CLI autenticata
- Eredita il comportamento di fatturazione, crediti di utilizzo e limiti di frequenza di Claude Code `claude -p`
- Il proxy viene eseguito localmente e non invia dati a server di terze parti
- Le risposte in streaming sono completamente supportate

<Note>
Per l'integrazione nativa Anthropic con Claude CLI o chiavi API, vedi [provider Anthropic](/it/providers/anthropic). Per gli abbonamenti OpenAI/Codex, vedi [provider OpenAI](/it/providers/openai).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/it/providers/anthropic" icon="bolt">
    Integrazione nativa OpenClaw con Claude CLI o chiavi API.
  </Card>
  <Card title="OpenAI provider" href="/it/providers/openai" icon="robot">
    Per abbonamenti OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
