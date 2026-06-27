---
read_when:
    - Quieres usar una suscripción a Claude Max con herramientas compatibles con OpenAI
    - Quieres un servidor de API local que envuelva Claude Code CLI
    - Quieres evaluar el acceso a Anthropic basado en suscripción frente al basado en clave de API
summary: Proxy comunitario para exponer las credenciales de suscripción de Claude como un endpoint compatible con OpenAI
title: Proxy de API de Claude Max
x-i18n:
    generated_at: "2026-06-27T12:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** es una herramienta comunitaria que expone tu suscripción Claude Max/Pro como un endpoint de API compatible con OpenAI. Esto te permite usar tu suscripción con cualquier herramienta que admita el formato de la API de OpenAI.

<Warning>
Esta ruta es solo de compatibilidad técnica. Anthropic ha bloqueado anteriormente algunos usos de suscripción
fuera de Claude Code. Debes decidir por tu cuenta si usarla
y verificar las reglas de facturación actuales de Anthropic antes de depender de ella.

La documentación de soporte actual de Anthropic dice que `claude -p` es uso del Agent SDK/programático.
A partir del 15 de junio de 2026, el uso de `claude -p` con plan de suscripción consume primero un crédito
mensual separado del Agent SDK y luego créditos de uso a tarifas estándar de API si
los créditos de uso están habilitados.
</Warning>

## ¿Por qué usar esto?

| Enfoque                  | Ruta de coste                                      | Ideal para                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| API de Anthropic             | Pago por token mediante Claude Console o la nube   | Aplicaciones de producción, automatización compartida, volumen |
| Proxy de suscripción Claude | Reglas de plan y crédito de Claude Code / `claude -p` | Experimentos personales con herramientas compatibles |

Si tienes una suscripción Claude Max o Pro y quieres usarla con
herramientas compatibles con OpenAI, este proxy puede encajar en algunos flujos de trabajo personales. No es una
ruta ilimitada de tarifa plana. Las claves de API siguen siendo la ruta de política y facturación más clara para
uso en producción.

## Cómo funciona

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

El proxy:

1. Acepta solicitudes en formato OpenAI en `http://localhost:3456/v1/chat/completions`
2. Las convierte en comandos de Claude Code CLI
3. Devuelve respuestas en formato OpenAI (se admite streaming)

## Primeros pasos

<Steps>
  <Step title="Instala el proxy">
    Requiere Node.js 22+ y Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Inicia el servidor">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Prueba el proxy">
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
  <Step title="Configura OpenClaw">
    Apunta OpenClaw al proxy como endpoint personalizado compatible con OpenAI:

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

## Catálogo integrado

| ID de modelo          | Se asigna a         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Notas de estilo proxy compatibles con OpenAI">
    Esta ruta usa la misma ruta compatible con OpenAI de estilo proxy que otros backends personalizados
    `/v1`:

    - No se aplica el modelado de solicitudes exclusivo de OpenAI nativo
    - Sin `service_tier`, sin Responses `store`, sin sugerencias de caché de prompts y sin
      modelado de payload compatible con razonamiento de OpenAI
    - Los encabezados de atribución ocultos de OpenClaw (`originator`, `version`, `User-Agent`)
      no se inyectan en la URL del proxy

  </Accordion>

  <Accordion title="Inicio automático en macOS con LaunchAgent">
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

## Notas

- Esta es una **herramienta comunitaria**, no cuenta con soporte oficial de Anthropic ni de OpenClaw
- Requiere una suscripción Claude Max/Pro activa con Claude Code CLI autenticado
- Hereda el comportamiento de facturación, créditos de uso y límites de tasa de Claude Code `claude -p`
- El proxy se ejecuta localmente y no envía datos a servidores de terceros
- Las respuestas en streaming son totalmente compatibles

<Note>
Para la integración nativa de Anthropic con Claude CLI o claves de API, consulta [Proveedor de Anthropic](/es/providers/anthropic). Para suscripciones de OpenAI/Codex, consulta [Proveedor de OpenAI](/es/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedor de Anthropic" href="/es/providers/anthropic" icon="bolt">
    Integración nativa de OpenClaw con Claude CLI o claves de API.
  </Card>
  <Card title="Proveedor de OpenAI" href="/es/providers/openai" icon="robot">
    Para suscripciones de OpenAI/Codex.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
