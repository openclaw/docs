---
read_when:
    - Vuoi usare l'abbonamento Claude Max con strumenti compatibili OpenAI
    - Vuoi un server API locale che incapsuli Claude Code CLI
    - Vuoi valutare l'accesso Anthropic basato su abbonamento rispetto a quello basato su API key
summary: Proxy della community per esporre le credenziali di abbonamento Claude come endpoint compatibile OpenAI
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T14:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** è uno strumento della community che espone il tuo abbonamento Claude Max/Pro come endpoint API compatibile OpenAI. Questo ti consente di usare il tuo abbonamento con qualsiasi strumento che supporti il formato API OpenAI.

<Warning>
Questo percorso è solo una compatibilità tecnica. In passato Anthropic ha bloccato alcuni usi dell'abbonamento al di fuori di Claude Code. Devi decidere tu stesso se usarlo e verificare i termini attuali di Anthropic prima di farci affidamento.
</Warning>

## Perché usarlo?

| Approccio                | Costo                                               | Ideale per                                  |
| ------------------------ | --------------------------------------------------- | ------------------------------------------- |
| API Anthropic            | Pagamento per token (~$15/M input, $75/M output per Opus) | App di produzione, alto volume       |
| Abbonamento Claude Max   | $200/mese flat                                      | Uso personale, sviluppo, utilizzo illimitato |

Se hai un abbonamento Claude Max e vuoi usarlo con strumenti compatibili OpenAI, questo proxy potrebbe ridurre i costi per alcuni flussi di lavoro. Le API key restano il percorso di policy più chiaro per l'uso in produzione.

## Come funziona

```
La tua app → claude-max-api-proxy → Claude Code CLI → Anthropic (tramite abbonamento)
  (formato OpenAI)             (converte il formato)        (usa il tuo login)
```

Il proxy:

1. Accetta richieste in formato OpenAI su `http://localhost:3456/v1/chat/completions`
2. Le converte in comandi Claude Code CLI
3. Restituisce risposte in formato OpenAI (streaming supportato)

## Installazione

```bash
# Richiede Node.js 20+ e Claude Code CLI
npm install -g claude-max-api-proxy

# Verifica che Claude CLI sia autenticata
claude --version
```

## Utilizzo

### Avvia il server

```bash
claude-max-api
# Il server viene eseguito su http://localhost:3456
```

### Testalo

```bash
# Controllo dello stato
curl http://localhost:3456/health

# Elenca i modelli
curl http://localhost:3456/v1/models

# Completamento chat
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Con OpenClaw

Puoi puntare OpenClaw al proxy come endpoint personalizzato compatibile OpenAI:

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

Questo percorso usa la stessa route in stile proxy compatibile OpenAI degli altri backend personalizzati
`/v1`:

- non viene applicato il request shaping nativo solo OpenAI
- niente `service_tier`, niente `store` di Responses, niente hint della prompt cache e nessun payload shaping di compatibilità OpenAI per il reasoning
- gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`) non vengono iniettati sull'URL del proxy

## Modelli disponibili

| ID modello         | Corrisponde a     |
| ------------------ | ----------------- |
| `claude-opus-4`    | Claude Opus 4     |
| `claude-sonnet-4`  | Claude Sonnet 4   |
| `claude-haiku-4`   | Claude Haiku 4    |

## Avvio automatico su macOS

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

## Link

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Problemi:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Note

- Questo è uno **strumento della community**, non ufficialmente supportato da Anthropic o OpenClaw
- Richiede un abbonamento Claude Max/Pro attivo con Claude Code CLI autenticata
- Il proxy viene eseguito localmente e non invia dati a server di terze parti
- Le risposte in streaming sono pienamente supportate

## Vedi anche

- [Provider Anthropic](/providers/anthropic) - Integrazione OpenClaw nativa con Claude CLI o API key
- [Provider OpenAI](/providers/openai) - Per abbonamenti OpenAI/Codex
