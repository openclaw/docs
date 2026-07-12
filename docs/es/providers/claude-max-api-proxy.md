---
read_when:
    - Quieres usar la suscripción Claude Max con herramientas compatibles con OpenAI
    - Quieres un servidor de API local que actúe como envoltorio de la CLI de Claude Code
    - Quieres evaluar el acceso a Anthropic mediante suscripción frente al acceso mediante clave de API
summary: Proxy comunitario para exponer las credenciales de suscripción de Claude como un endpoint compatible con OpenAI
title: Proxy de la API de Claude Max
x-i18n:
    generated_at: "2026-07-11T23:28:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** es un paquete npm de la comunidad (no un plugin de OpenClaw) que
expone una suscripción Claude Max/Pro como un endpoint de API compatible con OpenAI, para que
puedas dirigir cualquier herramienta compatible con OpenAI a tu suscripción en lugar de usar una
clave de API de Anthropic.

<Warning>
Solo ofrece compatibilidad técnica; no es una vía autorizada oficialmente. Anthropic ha
bloqueado anteriormente algunos usos de suscripciones fuera de Claude Code; comprueba
las reglas de facturación actuales de Anthropic antes de depender de esta opción.

La documentación de Claude Code de Anthropic describe `claude -p` como uso
programático o mediante el Agent SDK. Según la actualización de soporte de Anthropic del
15 de junio de 2026, Claude Agent SDK, `claude -p` y el uso de aplicaciones de terceros
consumen los límites de uso de la suscripción con la que se ha iniciado sesión (el plan de
créditos independiente para Agent SDK anunciado anteriormente está en pausa). Consulta el
[artículo sobre el plan de Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
de Anthropic, los artículos sobre los planes
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
y [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
así como el [proveedor de Anthropic](/es/providers/anthropic), para consultar las notas de
facturación propias de OpenClaw sobre la CLI de Claude.
</Warning>

## Por qué usarlo

| Enfoque                      | Modalidad de coste                                      | Ideal para                                           |
| ---------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Clave de API de Anthropic    | Pago por token mediante Claude Console                  | Aplicaciones de producción, automatización compartida, volumen |
| Proxy de suscripción Claude  | Reglas del plan y los créditos de Claude Code / `claude -p` | Experimentos personales con herramientas compatibles |

Este proxy permite usar una suscripción Claude Max o Pro con herramientas compatibles
con OpenAI. No es una vía ilimitada de tarifa plana: hereda los límites de uso de Claude
Code. Las claves de API siguen siendo la opción de facturación más clara para el uso en
producción.

## Cómo funciona

```text
Tu aplicación -> claude-max-api-proxy -> CLI de Claude Code / claude -p -> Anthropic
 (formato OpenAI)                    (convierte el formato)          (usa tu inicio de sesión)
```

El proxy inicia la CLI de Claude Code como un subproceso por cada solicitud, convierte
las solicitudes de chat con formato OpenAI en instrucciones para la CLI y transmite
(o devuelve) la respuesta en formato OpenAI.

## Primeros pasos

<Steps>
  <Step title="Instalar el proxy">
    Requiere Node.js 20+ y una CLI de Claude Code autenticada.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
    ```

  </Step>
  <Step title="Iniciar el servidor">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Probar el proxy">
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
  <Step title="Configurar OpenClaw">
    Configura OpenClaw para que use el proxy como un endpoint personalizado compatible con OpenAI:

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
Los identificadores de modelo siguientes pertenecen al catálogo del proxy, no son
referencias de modelos de Anthropic de OpenClaw. Cada identificador se asigna a un alias
de modelo de la CLI de Claude Code (`opus`, `sonnet`, `haiku`), por lo que el modelo
subyacente cambia cada vez que Anthropic actualiza ese alias en la CLI. Consulta el
README actual del proxy antes de depender de una asignación específica.
</Note>

| ID del modelo      | Alias de la CLI | Asignación actual |
| ------------------ | --------------- | ----------------- |
| `claude-opus-4`    | `opus`          | Claude Opus 4.5   |
| `claude-sonnet-4`  | `sonnet`        | Claude Sonnet 4   |
| `claude-haiku-4`   | `haiku`         | Claude Haiku 4    |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Notas sobre el proxy compatible con OpenAI">
    Esto utiliza la ruta personalizada genérica `/v1` de OpenClaw compatible con OpenAI,
    la misma ruta que cualquier otro backend autoalojado compatible con OpenAI:

    - No se aplica la adaptación de solicitudes exclusiva de OpenAI nativo.
    - `/fast` y `service_tier` solo se aplican al tráfico directo hacia `api.anthropic.com`;
      las rutas del proxy dejan `service_tier` intacto (consulta el
      [modo rápido del proveedor de Anthropic](/es/providers/anthropic#advanced-configuration)).
    - No se incluye `store` de Responses, indicaciones de caché de instrucciones ni adaptación
      de cargas útiles para compatibilidad con el razonamiento de OpenAI.
    - Los encabezados de atribución de OpenAI/Codex de OpenClaw (`originator`, `version`,
      `User-Agent`) solo se envían en el tráfico OAuth nativo hacia `api.openai.com`, no
      a destinos personalizados de `OPENAI_BASE_URL` como este proxy.

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
- Solo se vincula a `127.0.0.1`; no envía datos a ningún servidor de terceros aparte de la propia llamada de la CLI a Anthropic.
- Se admiten respuestas en streaming.
- Los errores de autenticación no se comprueban al iniciar y solo aparecen cuando se ejecuta realmente una solicitud de chat; si la CLI no está autenticada, la primera solicitud fallará en lugar de que el servidor se niegue a iniciarse.

<Note>
Para la integración nativa con Anthropic mediante la CLI de Claude o claves de API, consulta el [proveedor de Anthropic](/es/providers/anthropic). Para las suscripciones de OpenAI/Codex, consulta el [proveedor de OpenAI](/es/providers/openai).
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedor de Anthropic" href="/es/providers/anthropic" icon="bolt">
    Integración nativa de OpenClaw con la CLI de Claude o claves de API.
  </Card>
  <Card title="Proveedor de OpenAI" href="/es/providers/openai" icon="robot">
    Para suscripciones de OpenAI/Codex.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
