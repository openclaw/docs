---
read_when:
    - Quieres usar la suscripción Claude Max con herramientas compatibles con OpenAI
    - Quieres un servidor API local que envuelva la CLI de Claude Code
    - Quieres evaluar el acceso a Anthropic basado en suscripción frente al basado en clave de API
summary: Proxy comunitario para exponer credenciales de suscripción de Claude como un endpoint compatible con OpenAI
title: Proxy de API de Claude Max
x-i18n:
    generated_at: "2026-04-12T23:30:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** es una herramienta comunitaria que expone tu suscripción a Claude Max/Pro como un endpoint de API compatible con OpenAI. Esto te permite usar tu suscripción con cualquier herramienta que admita el formato de API de OpenAI.

<Warning>
Esta ruta es solo de compatibilidad técnica. Anthropic ha bloqueado en el pasado algunos usos de suscripciones fuera de Claude Code. Debes decidir por tu cuenta si quieres usarla y verificar los términos actuales de Anthropic antes de depender de ella.
</Warning>

## ¿Por qué usar esto?

| Enfoque                 | Costo                                               | Ideal para                                 |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| API de Anthropic        | Pago por token (~$15/M de entrada, $75/M de salida para Opus) | Apps de producción, alto volumen           |
| Suscripción Claude Max  | $200/mes fijos                                      | Uso personal, desarrollo, uso ilimitado    |

Si tienes una suscripción Claude Max y quieres usarla con herramientas compatibles con OpenAI, este proxy puede reducir el costo en algunos flujos de trabajo. Las claves de API siguen siendo la vía de política más clara para uso en producción.

## Cómo funciona

```
Tu app → claude-max-api-proxy → Claude Code CLI → Anthropic (mediante suscripción)
   (formato OpenAI)            (convierte el formato)    (usa tu inicio de sesión)
```

El proxy:

1. Acepta solicitudes en formato OpenAI en `http://localhost:3456/v1/chat/completions`
2. Las convierte en comandos de Claude Code CLI
3. Devuelve respuestas en formato OpenAI (con streaming compatible)

## Primeros pasos

<Steps>
  <Step title="Install the proxy">
    Requiere Node.js 20+ y Claude Code CLI.

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
    Apunta OpenClaw al proxy como un endpoint personalizado compatible con OpenAI:

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

## Modelos disponibles

| ID del modelo     | Corresponde a   |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Avanzado

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Esta ruta usa la misma vía de proxy compatible con OpenAI que otros backends personalizados de `/v1`:

    - No se aplica la conformación nativa de solicitudes solo para OpenAI
    - No hay `service_tier`, no hay `store` de Responses, no hay pistas de caché de prompt ni conformación de payload compatible con reasoning de OpenAI
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en la URL del proxy

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    Crea un LaunchAgent para ejecutar el proxy automáticamente:

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

## Enlaces

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Notas

- Esta es una **herramienta comunitaria**, sin soporte oficial de Anthropic ni de OpenClaw
- Requiere una suscripción activa a Claude Max/Pro con Claude Code CLI autenticado
- El proxy se ejecuta localmente y no envía datos a servidores de terceros
- Las respuestas con streaming son totalmente compatibles

<Note>
Para la integración nativa de Anthropic con Claude CLI o claves de API, consulta [Anthropic provider](/es/providers/anthropic). Para suscripciones de OpenAI/Codex, consulta [OpenAI provider](/es/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/es/providers/anthropic" icon="bolt">
    Integración nativa de OpenClaw con Claude CLI o claves de API.
  </Card>
  <Card title="OpenAI provider" href="/es/providers/openai" icon="robot">
    Para suscripciones de OpenAI/Codex.
  </Card>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Configuration" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
