---
read_when:
    - Quieres que OpenClaw inicie un servidor de modelos local solo cuando se seleccione su proveedor de modelos o de incrustaciones
    - Ejecuta ds4, inferrs, vLLM, llama.cpp, MLX u otro servidor local compatible con OpenAI
    - Necesitas controlar el arranque en frío, la disponibilidad y el apagado por inactividad de los proveedores locales.
summary: Iniciar servidores de modelos locales bajo demanda antes de las solicitudes de modelos e incrustaciones de OpenClaw
title: Servicios de modelos locales
x-i18n:
    generated_at: "2026-07-12T14:34:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` inicia bajo demanda un servidor local de modelos administrado por el proveedor. Cuando una solicitud de modelo o embeddings selecciona ese proveedor, OpenClaw comprueba el endpoint de estado, inicia el proceso si no está activo, espera a que esté listo y, a continuación, envía la solicitud. Úselo para evitar mantener en ejecución durante todo el día servidores locales que consumen muchos recursos.

## Cómo funciona

1. Una solicitud de modelo o embeddings se resuelve en un proveedor configurado.
2. Si ese proveedor tiene `localService`, OpenClaw comprueba `healthUrl`.
3. Si la comprobación se realiza correctamente, OpenClaw utiliza el servidor que ya está en ejecución.
4. Si la comprobación falla, OpenClaw inicia `command` con `args`.
5. OpenClaw consulta periódicamente el endpoint de estado hasta que vence `readyTimeoutMs`.
6. La solicitud pasa por el transporte normal de modelos o embeddings.
7. Si OpenClaw inició el proceso y se estableció `idleStopMs`, detiene el proceso cuando ha transcurrido ese tiempo desde que quedó inactiva la última solicitud en curso.

OpenClaw no instala launchd, systemd, Docker ni ningún daemon para esto. El servidor es un proceso secundario ordinario del proceso de OpenClaw que lo necesitó primero.

El inicio se serializa por proveedor configurado y conjunto de comando, argumentos y variables de entorno, de modo que las solicitudes simultáneas de chat y embeddings para el mismo servicio no inicien servidores duplicados. Cada solicitud conserva su propia concesión hasta que finaliza el procesamiento de la respuesta, por lo que el apagado por inactividad espera a que terminen todas las solicitudes de modelos y embeddings en curso. Los alias de proveedor configurados permanecen separados: dos alias pueden apuntar a hosts de GPU diferentes sin fusionarse en el mismo identificador de adaptador de Ollama, LM Studio o compatible con OpenAI.

Si otro proceso de OpenClaw ya tiene un servidor operativo en la misma `healthUrl`, este proceso lo reutiliza sin asumir su gestión (cada proceso solo administra el proceso secundario que inició personalmente). Los registros de inicio y salida incluyen fragmentos finales acotados y censurados de la salida del proceso secundario, además de información de tiempos y salida; los valores de entorno configurados nunca se muestran.

## Estructura de configuración

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

Establezca `timeoutSeconds` en la entrada del proveedor (no en `localService`) para que los inicios en frío lentos y las generaciones prolongadas no alcancen el tiempo de espera predeterminado de las solicitudes de modelo. Establezca una `healthUrl` explícita siempre que el servidor exponga el estado de disponibilidad en una ubicación distinta de `/models` en la URL base.

## Campos

| Campo            | Obligatorio | Descripción                                                                                                                          |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | sí          | Ruta absoluta del ejecutable. No se realiza ninguna búsqueda en el PATH del shell.                                                   |
| `args`           | no          | Argumentos del proceso. Sin expansión del shell, canalizaciones, patrones glob ni interpretación de comillas.                        |
| `cwd`            | no          | Directorio de trabajo del proceso.                                                                                                   |
| `env`            | no          | Variables de entorno que se combinan con el entorno del proceso de OpenClaw y tienen precedencia sobre él.                           |
| `healthUrl`      | no          | URL de disponibilidad. De forma predeterminada, se añade `/models` a `baseUrl` (`http://127.0.0.1:8000/v1` se convierte en `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | no          | Plazo máximo para que el proceso esté disponible tras iniciarse. Valor predeterminado: `120000`.                                     |
| `idleStopMs`     | no          | Demora del apagado por inactividad de un proceso iniciado por OpenClaw. `0` o su omisión lo mantiene activo hasta que OpenClaw finaliza. |

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

Sustituya `command` por el resultado de `which inferrs` en la máquina que ejecuta OpenClaw. Configuración completa de inferrs: [Inferrs](/es/providers/inferrs).

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

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Modelos locales" href="/es/gateway/local-models" icon="server">
    Configuración de modelos locales, opciones de proveedores y recomendaciones de seguridad.
  </Card>
  <Card title="Inferrs" href="/es/providers/inferrs" icon="cpu">
    Ejecute OpenClaw mediante el servidor local de inferrs compatible con OpenAI.
  </Card>
</CardGroup>
