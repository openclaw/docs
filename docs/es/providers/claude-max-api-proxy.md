---
read_when:
    - Quieres usar la suscripción Claude Max con herramientas compatibles con OpenAI
    - Quieres un servidor API local que envuelva Claude Code CLI
    - Quieres evaluar el acceso a Anthropic basado en suscripción frente al basado en clave de API
summary: Proxy comunitario para exponer credenciales de suscripción de Claude como un endpoint compatible con OpenAI
title: Proxy de API de Claude Max
x-i18n:
    generated_at: "2026-07-05T11:39:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** es un paquete npm comunitario (no un plugin de OpenClaw) que
expone una suscripción Claude Max/Pro como un endpoint de API compatible con OpenAI, para que
puedas apuntar cualquier herramienta compatible con OpenAI a tu suscripción en lugar de una
clave de API de Anthropic.

<Warning>
Solo compatibilidad técnica, no una ruta autorizada oficialmente. Anthropic ha
bloqueado en el pasado algunos usos de suscripciones fuera de Claude Code; verifica
las reglas de facturación actuales de Anthropic antes de depender de esto.

La documentación de Claude Code de Anthropic describe `claude -p` como uso de Agent SDK/programático.
A partir de la actualización de soporte de Anthropic del 15 de junio de 2026, Claude Agent SDK,
`claude -p` y el uso en aplicaciones de terceros consumen los límites de uso de la suscripción
con sesión iniciada (el plan separado de créditos para Agent SDK anunciado previamente está
pausado). Consulta el [artículo sobre el plan de Agent SDK de Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
los artículos de planes [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
y [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
y el [proveedor de Anthropic](/es/providers/anthropic) para las notas propias de OpenClaw
sobre facturación de Claude CLI.
</Warning>

## Por qué usar esto

| Enfoque                  | Ruta de coste                                      | Ideal para                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Clave de API de Anthropic         | Pago por token mediante Claude Console            | Aplicaciones de producción, automatización compartida, volumen |
| Proxy de suscripción de Claude | Reglas de plan y crédito de Claude Code / `claude -p` | Experimentos personales con herramientas compatibles |

Este proxy permite que una suscripción Claude Max o Pro funcione con herramientas compatibles
con OpenAI. No es una ruta ilimitada de tarifa plana: hereda los límites de uso de Claude Code.
Las claves de API siguen siendo la ruta de facturación más clara para uso en producción.

## Cómo funciona

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

El proxy inicia Claude Code CLI como subproceso por solicitud, convierte
solicitudes de chat en formato OpenAI en prompts de CLI y transmite (o devuelve) la
respuesta en formato OpenAI.

## Primeros pasos

<Steps>
  <Step title="Instala el proxy">
    Requiere Node.js 20+ y una Claude Code CLI autenticada.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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

<Note>
Los IDs de modelo siguientes son el catálogo propio del proxy, no las referencias
de modelos Anthropic de OpenClaw. Cada ID se asigna a un alias de modelo de Claude Code CLI
(`opus`, `sonnet`, `haiku`), por lo que el modelo subyacente cambia cada vez que Anthropic
actualiza ese alias en la CLI. Consulta el README actual del proxy antes de depender de una
asignación específica.
</Note>

| ID de modelo          | Alias de CLI | Asignación actual |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Notas de estilo proxy compatibles con OpenAI">
    Esto usa la ruta genérica personalizada `/v1` compatible con OpenAI de OpenClaw, la misma
    ruta que cualquier otro backend compatible con OpenAI autoalojado:

    - No se aplica el modelado de solicitudes nativo solo para OpenAI.
    - `/fast` y `service_tier` solo se aplican al tráfico directo de `api.anthropic.com`;
      las rutas de proxy dejan `service_tier` sin cambios (consulta
      [modo rápido del proveedor de Anthropic](/es/providers/anthropic#advanced-configuration)).
    - Sin `store` de Responses, sugerencias de caché de prompts ni modelado de payload compatible
      con razonamiento de OpenAI.
    - Los encabezados de atribución OpenAI/Codex de OpenClaw (`originator`, `version`,
      `User-Agent`) solo se envían en tráfico OAuth nativo de `api.openai.com`, no
      en destinos personalizados de `OPENAI_BASE_URL` como este proxy.

  </Accordion>

  <Accordion title="Inicio automático en macOS con LaunchAgent">
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

- Hereda el comportamiento de facturación, créditos de uso y límites de frecuencia de `claude -p` de Claude Code.
- Se vincula solo a `127.0.0.1`; no envía datos a ningún servidor de terceros más allá de la propia llamada de la CLI a Anthropic.
- Se admiten respuestas en streaming.
- Los fallos de autenticación no se comprueban al iniciar y solo aparecen cuando una solicitud de chat se ejecuta realmente; si la CLI no está autenticada, espera que falle la primera solicitud, no que el servidor se niegue a iniciar.

<Note>
Para la integración nativa de Anthropic con Claude CLI o claves de API, consulta [proveedor de Anthropic](/es/providers/anthropic). Para suscripciones OpenAI/Codex, consulta [proveedor de OpenAI](/es/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedor de Anthropic" href="/es/providers/anthropic" icon="bolt">
    Integración nativa de OpenClaw con Claude CLI o claves de API.
  </Card>
  <Card title="Proveedor de OpenAI" href="/es/providers/openai" icon="robot">
    Para suscripciones OpenAI/Codex.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
