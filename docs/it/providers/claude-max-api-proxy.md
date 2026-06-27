---
read_when:
    - Vuoi usare l'abbonamento Claude Max con strumenti compatibili con OpenAI
    - Vuoi un server API locale che incapsuli la CLI di Claude Code
    - Vuoi valutare l’accesso ad Anthropic basato su abbonamento rispetto a quello basato su chiave API
summary: Proxy della community per esporre le credenziali dell'abbonamento Claude come endpoint compatibile con OpenAI
title: Proxy API di Claude Max
x-i18n:
    generated_at: "2026-06-27T18:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** è uno strumento della community che espone il tuo abbonamento Claude Max/Pro come endpoint API compatibile con OpenAI. Questo ti consente di usare il tuo abbonamento con qualsiasi strumento che supporti il formato API OpenAI.

<Warning>
Questo percorso è solo compatibilità tecnica. In passato Anthropic ha bloccato alcuni utilizzi degli abbonamenti al di fuori di Claude Code. Devi decidere autonomamente se usarlo e verificare le regole di fatturazione attuali di Anthropic prima di farci affidamento.

La documentazione di supporto attuale di Anthropic afferma che `claude -p` è uso Agent SDK/programmatico. A partire dal 15 giugno 2026, l'uso di `claude -p` nei piani di abbonamento attinge prima a un credito mensile Agent SDK separato, poi ai crediti di utilizzo alle tariffe API standard se i crediti di utilizzo sono abilitati.
</Warning>

## Perché usarlo?

| Approccio                  | Percorso di costo                                      | Ideale per                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| API Anthropic             | Pagamento per token tramite Claude Console o cloud   | App di produzione, automazione condivisa, volumi |
| Proxy di abbonamento Claude | Regole di piano e credito di Claude Code / `claude -p` | Esperimenti personali con strumenti compatibili |

Se hai un abbonamento Claude Max o Pro e vuoi usarlo con strumenti compatibili con OpenAI, questo proxy può adattarsi ad alcuni flussi di lavoro personali. Non è un percorso illimitato a tariffa fissa. Le chiavi API restano il percorso più chiaro per policy e fatturazione nell'uso in produzione.

## Come funziona

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Il proxy:

1. Accetta richieste in formato OpenAI su `http://localhost:3456/v1/chat/completions`
2. Le converte in comandi Claude Code CLI
3. Restituisce le risposte in formato OpenAI (streaming supportato)

## Per iniziare

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

| ID modello          | Mappa a         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Questo percorso usa la stessa route proxy compatibile con OpenAI degli altri backend `/v1` personalizzati:

    - Non si applica la modellazione delle richieste nativa solo OpenAI
    - Nessun `service_tier`, nessun `store` Responses, nessun suggerimento di prompt-cache e nessuna modellazione del payload di compatibilità con il reasoning OpenAI
    - Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`) non vengono inseriti nell'URL del proxy

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
- Richiede un abbonamento Claude Max/Pro attivo con Claude Code CLI autenticato
- Eredita il comportamento di fatturazione, crediti di utilizzo e limiti di frequenza di Claude Code `claude -p`
- Il proxy viene eseguito localmente e non invia dati ad alcun server di terze parti
- Le risposte in streaming sono pienamente supportate

<Note>
Per l'integrazione Anthropic nativa con Claude CLI o chiavi API, consulta [provider Anthropic](/it/providers/anthropic). Per gli abbonamenti OpenAI/Codex, consulta [provider OpenAI](/it/providers/openai).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/it/providers/anthropic" icon="bolt">
    Integrazione OpenClaw nativa con Claude CLI o chiavi API.
  </Card>
  <Card title="OpenAI provider" href="/it/providers/openai" icon="robot">
    Per gli abbonamenti OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
