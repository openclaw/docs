---
read_when:
    - Quieres usar una suscripción Claude Max con herramientas compatibles con OpenAI
    - Desea un servidor de API local que encapsule la CLI de Claude Code
    - Quieres evaluar el acceso a Anthropic basado en suscripción frente al basado en claves de API
summary: Proxy comunitario para exponer las credenciales de suscripción de Claude como un endpoint compatible con OpenAI
title: Proxy de API de Claude Max
x-i18n:
    generated_at: "2026-06-28T20:45:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** es una herramienta comunitaria que expone tu suscripción Claude Max/Pro como un endpoint de API compatible con OpenAI. Esto te permite usar tu suscripción con cualquier herramienta que admita el formato de la API de OpenAI.

<Warning>
Esta vía es solo para compatibilidad técnica. Anthropic ha bloqueado en el pasado algunos usos de suscripción fuera de Claude Code. Debes decidir por tu cuenta si usarla y verificar las reglas de facturación actuales de Anthropic antes de depender de ella.

La documentación de soporte actual de Anthropic dice que `claude -p` es uso programático/Agent SDK. La actualización de soporte de Anthropic del 15 de junio de 2026 pausó el plan anunciado de créditos separados para Agent SDK. Por ahora, Claude Agent SDK, `claude -p` y el uso de aplicaciones de terceros siguen consumiendo los límites de uso de la suscripción con sesión iniciada.

Antes de depender de esta vía, revisa el [artículo del plan Agent SDK de Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), además de los artículos de soporte de Claude Code para cuentas
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
o
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## ¿Por qué usar esto?

| Enfoque                  | Ruta de coste                                      | Ideal para                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| API de Anthropic             | Pago por token mediante Claude Console o la nube   | Aplicaciones de producción, automatización compartida, volumen |
| Proxy de suscripción Claude | Reglas de plan y créditos de Claude Code / `claude -p` | Experimentos personales con herramientas compatibles |

Si tienes una suscripción Claude Max o Pro y quieres usarla con herramientas compatibles con OpenAI, este proxy puede encajar en algunos flujos de trabajo personales. No es una vía ilimitada de tarifa plana. Las claves de API siguen siendo la vía más clara de políticas y facturación para uso en producción.

## Cómo funciona

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

El proxy:

1. Acepta solicitudes con formato OpenAI en `http://localhost:3456/v1/chat/completions`
2. Las convierte en comandos de Claude Code CLI
3. Devuelve respuestas en formato OpenAI (con streaming admitido)

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

## Catálogo integrado

| ID de modelo          | Se asigna a         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Notas de estilo proxy compatibles con OpenAI">
    Esta vía usa la misma ruta compatible con OpenAI de estilo proxy que otros backends `/v1` personalizados:

    - No se aplica el modelado de solicitudes nativo solo de OpenAI
    - Sin `service_tier`, sin `store` de Responses, sin pistas de caché de prompts y sin modelado de payload compatible con razonamiento de OpenAI
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en la URL del proxy

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
- Hereda el comportamiento de facturación, créditos de uso y límites de velocidad de Claude Code `claude -p`
- El proxy se ejecuta localmente y no envía datos a servidores de terceros
- Las respuestas en streaming están totalmente admitidas

<Note>
Para la integración nativa de Anthropic con Claude CLI o claves de API, consulta [proveedor Anthropic](/es/providers/anthropic). Para suscripciones OpenAI/Codex, consulta [proveedor OpenAI](/es/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedor Anthropic" href="/es/providers/anthropic" icon="bolt">
    Integración nativa de OpenClaw con Claude CLI o claves de API.
  </Card>
  <Card title="Proveedor OpenAI" href="/es/providers/openai" icon="robot">
    Para suscripciones OpenAI/Codex.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
