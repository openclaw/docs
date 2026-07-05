---
read_when:
    - Quiere que OpenClaw inicie un servidor de modelos local solo cuando se seleccione su modelo
    - Ejecutas ds4, inferrs, vLLM, llama.cpp, MLX u otro servidor local compatible con OpenAI
    - Necesitas controlar el arranque en frío, la preparación y el apagado por inactividad para proveedores locales
summary: Iniciar servidores de modelos locales bajo demanda antes de las solicitudes de modelos de OpenClaw
title: Servicios de modelos locales
x-i18n:
    generated_at: "2026-07-05T11:19:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9098fe9245a98987e7c58edb8395ae67e7d2ee5ec2215cc7d3ae880a62073372
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` inicia bajo demanda un servidor de modelos local propiedad del proveedor. Cuando una solicitud selecciona un modelo de ese proveedor, OpenClaw comprueba el endpoint de salud, inicia el proceso si está inactivo, espera a que esté listo y luego envía la solicitud. Úsalo para evitar mantener servidores locales costosos en ejecución todo el día.

## Cómo funciona

1. Una solicitud de modelo se resuelve en un proveedor configurado.
2. Si ese proveedor tiene `localService`, OpenClaw comprueba `healthUrl`.
3. Si la comprobación se completa correctamente, OpenClaw usa el servidor que ya está en ejecución.
4. Si la comprobación falla, OpenClaw lanza `command` con `args`.
5. OpenClaw consulta periódicamente el endpoint de salud hasta que vence `readyTimeoutMs`.
6. La solicitud de modelo pasa por el transporte normal del proveedor.
7. Si OpenClaw inició el proceso y `idleStopMs` está configurado, detiene el proceso después de que la última solicitud en curso haya estado inactiva durante ese tiempo.

OpenClaw no instala launchd, systemd, Docker ni ningún daemon para esto. El servidor es un proceso hijo simple del proceso de OpenClaw que lo necesitó primero.

El arranque se serializa por conjunto de comando/argumento/env del proveedor, por lo que las solicitudes concurrentes al mismo servicio no generan servidores duplicados. Si otro proceso de OpenClaw ya tiene un servidor en buen estado en el mismo `healthUrl`, este proceso lo reutiliza sin adoptarlo (cada proceso solo gestiona el hijo que inició personalmente). Las respuestas de streaming activas mantienen una concesión, por lo que el apagado por inactividad espera hasta que finalice el manejo de la respuesta.

## Forma de configuración

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Configura `timeoutSeconds` en la entrada del proveedor (no en `localService`) para que los arranques en frío lentos y las generaciones largas no alcancen el tiempo de espera predeterminado de la solicitud de modelo. Configura un `healthUrl` explícito siempre que tu servidor exponga la preparación en otro lugar que no sea `/models` en la URL base.

## Campos

| Campo            | Obligatorio | Descripción                                                                                                                                    |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | sí          | Ruta absoluta del ejecutable. Sin búsqueda en PATH de shell.                                                                                   |
| `args`           | no          | Argumentos del proceso. Sin expansión de shell, pipes, globbing ni comillas.                                                                   |
| `cwd`            | no          | Directorio de trabajo del proceso.                                                                                                             |
| `env`            | no          | Variables de entorno fusionadas sobre el entorno del proceso de OpenClaw.                                                                      |
| `healthUrl`      | no          | URL de preparación. De forma predeterminada, se añade `/models` a `baseUrl` (`http://127.0.0.1:8000/v1` se convierte en `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | no          | Límite de preparación del arranque. Predeterminado: `120000`.                                                                                  |
| `idleStopMs`     | no          | Retardo de apagado por inactividad para un proceso iniciado por OpenClaw. `0` u omitido lo mantiene activo hasta que OpenClaw sale.            |

## Ejemplo de Inferrs

Inferrs es un backend `/v1` personalizado compatible con OpenAI, por lo que la misma API `localService` funciona con una entrada de proveedor `inferrs`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Sustituye `command` por el resultado de `which inferrs` en la máquina que ejecuta OpenClaw. Configuración completa de inferrs: [Inferrs](/es/providers/inferrs).

## Ejemplo de ds4

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

Configuración completa, dimensionamiento del contexto y comandos de verificación: [ds4](/es/providers/ds4).

## Relacionado

<CardGroup cols={2}>
  <Card title="Modelos locales" href="/es/gateway/local-models" icon="server">
    Configuración de modelos locales, opciones de proveedor y orientación de seguridad.
  </Card>
  <Card title="Inferrs" href="/es/providers/inferrs" icon="cpu">
    Ejecuta OpenClaw a través del servidor local inferrs compatible con OpenAI.
  </Card>
</CardGroup>
