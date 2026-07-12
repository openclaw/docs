---
read_when:
    - Vuoi utilizzare l'abbonamento Claude Max con strumenti compatibili con OpenAI
    - Vuoi un server API locale che faccia da wrapper per Claude Code CLI
    - Vuoi valutare l’accesso ad Anthropic basato su abbonamento rispetto a quello basato su chiave API
summary: Proxy della community per esporre le credenziali dell'abbonamento Claude come endpoint compatibile con OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-07-12T07:26:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** è un pacchetto npm della community (non un plugin di OpenClaw) che
espone un abbonamento Claude Max/Pro come endpoint API compatibile con OpenAI, così
puoi indirizzare qualsiasi strumento compatibile con OpenAI al tuo abbonamento anziché a una
chiave API Anthropic.

<Warning>
Solo compatibilità tecnica, non un percorso ufficialmente approvato. In passato Anthropic ha
bloccato alcuni utilizzi degli abbonamenti al di fuori di Claude Code; verifica
le attuali regole di fatturazione di Anthropic prima di fare affidamento su questa soluzione.

La documentazione di Claude Code di Anthropic descrive `claude -p` come utilizzo
programmatico/dell'Agent SDK. In base all'aggiornamento del supporto di Anthropic del 15 giugno 2026,
Claude Agent SDK, `claude -p` e l'utilizzo di applicazioni di terze parti attingono dai
limiti di utilizzo dell'abbonamento con cui è stato effettuato l'accesso (il piano separato di crediti per
l'Agent SDK annunciato in precedenza è sospeso). Consulta l'[articolo sul piano
Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
di Anthropic, gli articoli sui piani [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
e [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
e il [provider Anthropic](/it/providers/anthropic) per le note di OpenClaw sulla
fatturazione della CLI di Claude.
</Warning>

## Perché utilizzarlo

| Approccio                 | Modalità di addebito                               | Ideale per                                               |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Chiave API Anthropic      | Pagamento per token tramite Claude Console        | Applicazioni di produzione, automazione condivisa, volumi |
| Proxy abbonamento Claude  | Piano e regole sui crediti di Claude Code / `claude -p` | Esperimenti personali con strumenti compatibili      |

Questo proxy consente a un abbonamento Claude Max o Pro di funzionare con strumenti
compatibili con OpenAI. Non è una soluzione illimitata a tariffa fissa: eredita i limiti
di utilizzo di Claude Code. Le chiavi API rimangono il percorso di fatturazione più chiaro per l'uso in produzione.

## Come funziona

```text
La tua applicazione -> claude-max-api-proxy -> CLI di Claude Code / claude -p -> Anthropic
     (formato OpenAI)                       (converte il formato)              (usa il tuo accesso)
```

Il proxy avvia la CLI di Claude Code come sottoprocesso per ogni richiesta, converte
le richieste di chat in formato OpenAI in prompt per la CLI e trasmette in streaming (o restituisce)
la risposta in formato OpenAI.

## Per iniziare

<Steps>
  <Step title="Installa il proxy">
    Richiede Node.js 20+ e una CLI di Claude Code autenticata.

    ```bash
    npm install -g claude-max-api-proxy

    # Verifica che la CLI di Claude sia autenticata
    claude --version
    claude auth login   # se non è già autenticata
    ```

  </Step>
  <Step title="Avvia il server">
    ```bash
    claude-max-api
    # Il server è in esecuzione su http://localhost:3456
    ```
  </Step>
  <Step title="Verifica il proxy">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configura OpenClaw">
    Indirizza OpenClaw al proxy come endpoint personalizzato compatibile con OpenAI:

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

<Note>
Gli ID dei modelli riportati di seguito appartengono al catalogo del proxy, non sono
riferimenti ai modelli Anthropic di OpenClaw. Ogni ID corrisponde a un alias di modello della
CLI di Claude Code (`opus`, `sonnet`, `haiku`), pertanto il modello sottostante cambia
ogni volta che Anthropic aggiorna tale alias nella CLI. Consulta il README corrente del proxy
prima di fare affidamento su una corrispondenza specifica.
</Note>

| ID modello         | Alias CLI | Corrispondenza attuale |
| ------------------ | --------- | ---------------------- |
| `claude-opus-4`    | `opus`    | Claude Opus 4.5        |
| `claude-sonnet-4`  | `sonnet`  | Claude Sonnet 4        |
| `claude-haiku-4`   | `haiku`   | Claude Haiku 4         |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Note sulla compatibilità con OpenAI tramite proxy">
    Questa soluzione utilizza il percorso `/v1` personalizzato generico di OpenClaw compatibile
    con OpenAI, lo stesso percorso di qualsiasi altro backend compatibile con OpenAI ospitato autonomamente:

    - Non si applica la strutturazione delle richieste riservata esclusivamente a OpenAI nativo.
    - `/fast` e `service_tier` si applicano solo al traffico diretto verso `api.anthropic.com`;
      i percorsi tramite proxy lasciano invariato `service_tier` (consulta la
      [modalità rapida del provider Anthropic](/it/providers/anthropic#advanced-configuration)).
    - Nessuna strutturazione dei payload per `store` di Responses, indicazioni sulla cache dei prompt
      o compatibilità del ragionamento OpenAI.
    - Le intestazioni di attribuzione OpenAI/Codex di OpenClaw (`originator`, `version`,
      `User-Agent`) vengono inviate solo nel traffico OAuth nativo verso `api.openai.com`, non
      verso destinazioni `OPENAI_BASE_URL` personalizzate come questo proxy.

  </Accordion>

  <Accordion title="Avvio automatico su macOS con LaunchAgent">
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

- Eredita il comportamento di fatturazione, dei crediti di utilizzo e dei limiti di frequenza di `claude -p` di Claude Code.
- Si associa esclusivamente a `127.0.0.1`; non invia dati ad alcun server di terze parti oltre alla chiamata della CLI ad Anthropic.
- Sono supportate le risposte in streaming.
- Gli errori di autenticazione non vengono verificati all'avvio e si manifestano solo quando viene effettivamente eseguita una richiesta di chat; se la CLI non è autenticata, la prima richiesta non riuscirà anziché impedire l'avvio del server.

<Note>
Per l'integrazione nativa con Anthropic mediante la CLI di Claude o le chiavi API, consulta il [provider Anthropic](/it/providers/anthropic). Per gli abbonamenti OpenAI/Codex, consulta il [provider OpenAI](/it/providers/openai).
</Note>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider Anthropic" href="/it/providers/anthropic" icon="bolt">
    Integrazione nativa di OpenClaw con la CLI di Claude o le chiavi API.
  </Card>
  <Card title="Provider OpenAI" href="/it/providers/openai" icon="robot">
    Per gli abbonamenti OpenAI/Codex.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
