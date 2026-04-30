---
read_when:
    - Quieres ejecutar OpenClaw con modelos de código abierto mediante LM Studio
    - Desea instalar y configurar LM Studio
summary: Ejecutar OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T05:57:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio es una aplicación amigable y potente para ejecutar modelos de pesos abiertos en tu propio hardware. Te permite ejecutar modelos llama.cpp (GGUF) o MLX (Apple Silicon). Está disponible como paquete GUI o daemon sin interfaz gráfica (`llmster`). Para la documentación del producto y de configuración, consulta [lmstudio.ai](https://lmstudio.ai/).

## Inicio rápido

1. Instala LM Studio (escritorio) o `llmster` (sin interfaz gráfica) y luego inicia el servidor local:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Inicia el servidor

Asegúrate de iniciar la aplicación de escritorio o ejecutar el daemon con el siguiente comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Si usas la aplicación, asegúrate de tener JIT habilitado para una experiencia fluida. Obtén más información en la [guía de JIT y TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Si la autenticación de LM Studio está habilitada, configura `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Si la autenticación de LM Studio está deshabilitada, puedes dejar la clave de API en blanco durante la configuración interactiva de OpenClaw.

Para obtener detalles sobre la configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Ejecuta la incorporación y elige `LM Studio`:

```bash
openclaw onboard
```

5. En la incorporación, usa el mensaje `Default model` para elegir tu modelo de LM Studio.

También puedes configurarlo o cambiarlo más tarde:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Las claves de modelo de LM Studio siguen un formato `author/model-name` (por ejemplo, `qwen/qwen3.5-9b`). Las referencias de modelo de OpenClaw
anteponen el nombre del proveedor: `lmstudio/qwen/qwen3.5-9b`. Puedes encontrar la clave exacta de
un modelo ejecutando `curl http://localhost:1234/api/v1/models` y mirando el campo `key`.

## Incorporación no interactiva

Usa la incorporación no interactiva cuando quieras automatizar la configuración con scripts (CI, aprovisionamiento, arranque remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

O especifica la URL base, el modelo y la clave de API opcional:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` toma la clave del modelo tal como la devuelve LM Studio (por ejemplo, `qwen/qwen3.5-9b`), sin
el prefijo de proveedor `lmstudio/`.

Para servidores de LM Studio autenticados, pasa `--lmstudio-api-key` o configura `LM_API_TOKEN`.
Para servidores de LM Studio sin autenticación, omite la clave; OpenClaw almacena un marcador local no secreto.

`--custom-api-key` sigue siendo compatible por compatibilidad, pero se prefiere `--lmstudio-api-key` para LM Studio.

Esto escribe `models.providers.lmstudio` y establece el modelo predeterminado en
`lmstudio/<custom-model-id>`. Cuando proporcionas una clave de API, la configuración también escribe el perfil de autenticación
`lmstudio:default`.

La configuración interactiva puede pedir una longitud de contexto de carga preferida opcional y la aplica a los modelos de LM Studio descubiertos que guarda en la configuración.
La configuración del Plugin de LM Studio confía en el endpoint configurado de LM Studio para solicitudes de modelo, incluidos hosts de loopback, LAN y tailnet. Puedes desactivarlo configurando `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Configuración

### Compatibilidad de uso en streaming

LM Studio es compatible con el uso en streaming. Cuando no emite un objeto
`usage` con forma de OpenAI, OpenClaw recupera los recuentos de tokens a partir de los metadatos de estilo llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

El mismo comportamiento de uso en streaming se aplica a estos backends locales compatibles con OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibilidad de razonamiento

Cuando el descubrimiento `/api/v1/models` de LM Studio informa opciones de razonamiento
específicas del modelo, OpenClaw conserva esos valores nativos en los metadatos de compatibilidad del modelo. Para
modelos de pensamiento binario que anuncian `allowed_options: ["off", "on"]`,
OpenClaw asigna el pensamiento deshabilitado a `off` y los niveles `/think` habilitados a `on`
en lugar de enviar valores exclusivos de OpenAI como `low` o `medium`.

### Configuración explícita

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Solución de problemas

### LM Studio no detectado

Asegúrate de que LM Studio esté ejecutándose. Si la autenticación está habilitada, configura también `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Verifica que la API sea accesible:

```bash
curl http://localhost:1234/api/v1/models
```

### Errores de autenticación (HTTP 401)

Si la configuración informa HTTP 401, verifica tu clave de API:

- Comprueba que `LM_API_TOKEN` coincida con la clave configurada en LM Studio.
- Para obtener detalles sobre la configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si tu servidor no requiere autenticación, deja la clave en blanco durante la configuración.

### Carga de modelos just-in-time

LM Studio admite la carga de modelos just-in-time (JIT), donde los modelos se cargan en la primera solicitud. Asegúrate de tenerla habilitada para evitar errores de 'Model not loaded'.

### Host de LM Studio en LAN o tailnet

Usa la dirección accesible del host de LM Studio, conserva `/v1` y asegúrate de que LM Studio esté vinculado más allá de loopback en esa máquina:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

A diferencia de los proveedores genéricos compatibles con OpenAI, `lmstudio` confía automáticamente en su endpoint local/privado configurado para solicitudes de modelo protegidas. Los ID de proveedor de loopback personalizados como `localhost` o `127.0.0.1` también se consideran de confianza automáticamente; para ID de proveedor personalizados de LAN, tailnet o DNS privado, configura `models.providers.<id>.request.allowPrivateNetwork: true` explícitamente.

## Relacionado

- [Selección de modelos](/es/concepts/model-providers)
- [Ollama](/es/providers/ollama)
- [Modelos locales](/es/gateway/local-models)
