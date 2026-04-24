---
read_when:
    - Vuoi usare l'abbonamento Claude Max con strumenti compatibili con OpenAI
    - Vuoi un server API locale che incapsuli la CLI Claude Code
    - Vuoi valutare accesso Anthropic basato su abbonamento rispetto a chiave API
summary: Proxy della community per esporre le credenziali dell'abbonamento Claude come endpoint compatibile con OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-04-24T08:56:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** è uno strumento della community che espone il tuo abbonamento Claude Max/Pro come endpoint API compatibile con OpenAI. Questo ti consente di usare il tuo abbonamento con qualsiasi strumento che supporti il formato API OpenAI.

<Warning>
Questo percorso è solo compatibilità tecnica. Anthropic in passato ha bloccato alcuni usi dell'abbonamento
al di fuori di Claude Code. Devi decidere autonomamente se usarlo e verificare i termini attuali di Anthropic prima di farvi affidamento.
</Warning>

## Perché usarlo?

| Approccio               | Costo                                               | Ideale per                                 |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| API Anthropic           | Pagamento per token (~$15/M input, $75/M output per Opus) | App di produzione, alto volume             |
| Abbonamento Claude Max  | $200/mese fissi                                     | Uso personale, sviluppo, uso illimitato    |

Se hai un abbonamento Claude Max e vuoi usarlo con strumenti compatibili con OpenAI, questo proxy può ridurre i costi per alcuni flussi di lavoro. Le chiavi API restano il percorso di policy più chiaro per l'uso in produzione.

## Come funziona

```
La tua app → claude-max-api-proxy → Claude Code CLI → Anthropic (tramite abbonamento)
 (formato OpenAI)                 (converte il formato)      (usa il tuo login)
```

Il proxy:

1. Accetta richieste in formato OpenAI su `http://localhost:3456/v1/chat/completions`
2. Le converte in comandi Claude Code CLI
3. Restituisce risposte in formato OpenAI (streaming supportato)

## Per iniziare

<Steps>
  <Step title="Installa il proxy">
    Richiede Node.js 20+ e Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verifica che Claude CLI sia autenticata
    claude --version
    ```

  </Step>
  <Step title="Avvia il server">
    ```bash
    claude-max-api
    # Il server viene eseguito su http://localhost:3456
    ```
  </Step>
  <Step title="Testa il proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # Elenca i modelli
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
  <Step title="Configura OpenClaw">
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

| ID modello         | Mappa a          |
| ------------------ | ---------------- |
| `claude-opus-4`    | Claude Opus 4    |
| `claude-sonnet-4`  | Claude Sonnet 4  |
| `claude-haiku-4`   | Claude Haiku 4   |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Note sul percorso compatibile con OpenAI in stile proxy">
    Questo percorso usa la stessa route compatibile con OpenAI in stile proxy degli altri backend personalizzati
    `/v1`:

    - Il request shaping nativo solo-OpenAI non si applica
    - Nessun `service_tier`, nessun `store` di Responses, nessun suggerimento di cache del prompt e nessun
      payload shaping di compatibilità del reasoning OpenAI
    - Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`)
      non vengono inseriti sull'URL del proxy

  </Accordion>

  <Accordion title="Avvio automatico su macOS con LaunchAgent">
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

## Link

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issue:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Note

- Questo è uno **strumento della community**, non ufficialmente supportato da Anthropic o OpenClaw
- Richiede un abbonamento Claude Max/Pro attivo con Claude Code CLI autenticata
- Il proxy viene eseguito localmente e non invia dati a server di terze parti
- Le risposte in streaming sono pienamente supportate

<Note>
Per l'integrazione nativa Anthropic con Claude CLI o chiavi API, vedi [Provider Anthropic](/it/providers/anthropic). Per gli abbonamenti OpenAI/Codex, vedi [Provider OpenAI](/it/providers/openai).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider Anthropic" href="/it/providers/anthropic" icon="bolt">
    Integrazione nativa OpenClaw con Claude CLI o chiavi API.
  </Card>
  <Card title="Provider OpenAI" href="/it/providers/openai" icon="robot">
    Per gli abbonamenti OpenAI/Codex.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, model ref e comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
