---
read_when:
    - Quieres usar la suscripción Claude Max con herramientas compatibles con OpenAI
    - Quieres un servidor API local que envuelva la CLI de Claude Code
    - Quieres evaluar acceso a Anthropic basado en suscripción frente a basado en clave API
summary: Proxy de la comunidad para exponer credenciales de suscripción de Claude como un endpoint compatible con OpenAI
title: Proxy de API Claude Max
x-i18n:
    generated_at: "2026-04-24T05:43:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** es una herramienta de la comunidad que expone tu suscripción Claude Max/Pro como un endpoint de API compatible con OpenAI. Esto te permite usar tu suscripción con cualquier herramienta que admita el formato de API de OpenAI.

<Warning>
Esta ruta es solo de compatibilidad técnica. Anthropic ha bloqueado en el pasado
algunos usos de suscripción fuera de Claude Code. Debes decidir por tu cuenta si usarla
y verificar las condiciones actuales de Anthropic antes de depender de ello.
</Warning>

## ¿Por qué usar esto?

| Enfoque                | Costo                                                | Ideal para                                 |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------ |
| API de Anthropic       | Pago por token (~$15/M entrada, $75/M salida para Opus) | Apps de producción, alto volumen           |
| Suscripción Claude Max | $200/mes fijo                                        | Uso personal, desarrollo, uso ilimitado    |

Si tienes una suscripción Claude Max y quieres usarla con herramientas compatibles con OpenAI, este proxy puede reducir el costo en algunos flujos de trabajo. Las claves API siguen siendo la vía de política más clara para uso en producción.

## Cómo funciona

```
Tu app → claude-max-api-proxy → Claude Code CLI → Anthropic (mediante suscripción)
 (formato OpenAI)              (convierte formato)      (usa tu inicio de sesión)
```

El proxy:

1. Acepta solicitudes en formato OpenAI en `http://localhost:3456/v1/chat/completions`
2. Las convierte en comandos de Claude Code CLI
3. Devuelve respuestas en formato OpenAI (admite streaming)

## Primeros pasos

<Steps>
  <Step title="Instalar el proxy">
    Requiere Node.js 20+ y Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verifica que Claude CLI esté autenticado
    claude --version
    ```

  </Step>
  <Step title="Iniciar el servidor">
    ```bash
    claude-max-api
    # El servidor se ejecuta en http://localhost:3456
    ```
  </Step>
  <Step title="Probar el proxy">
    ```bash
    # Comprobación de estado
    curl http://localhost:3456/health

    # Enumerar modelos
    curl http://localhost:3456/v1/models

    # Finalización de chat
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configurar OpenClaw">
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

| ID del modelo      | Se asigna a      |
| ------------------ | ---------------- |
| `claude-opus-4`    | Claude Opus 4    |
| `claude-sonnet-4`  | Claude Sonnet 4  |
| `claude-haiku-4`   | Claude Haiku 4   |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Notas de estilo proxy compatibles con OpenAI">
    Esta ruta usa la misma ruta de estilo proxy compatible con OpenAI que otros
    backends personalizados `/v1`:

    - No se aplica el moldeado de solicitudes nativo exclusivo de OpenAI
    - No hay `service_tier`, ni `store` de Responses, ni sugerencias de caché de prompts, ni
      moldeado de carga útil de compatibilidad de razonamiento de OpenAI
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`)
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

## Enlaces

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Notas

- Esta es una **herramienta de la comunidad**, sin soporte oficial de Anthropic ni de OpenClaw
- Requiere una suscripción activa Claude Max/Pro con Claude Code CLI autenticado
- El proxy se ejecuta localmente y no envía datos a servidores de terceros
- Las respuestas en streaming están totalmente admitidas

<Note>
Para la integración nativa de Anthropic con Claude CLI o claves API, consulta [Proveedor Anthropic](/es/providers/anthropic). Para suscripciones OpenAI/Codex, consulta [Proveedor OpenAI](/es/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedor Anthropic" href="/es/providers/anthropic" icon="bolt">
    Integración nativa de OpenClaw con Claude CLI o claves API.
  </Card>
  <Card title="Proveedor OpenAI" href="/es/providers/openai" icon="robot">
    Para suscripciones OpenAI/Codex.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
