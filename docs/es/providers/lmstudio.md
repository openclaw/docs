---
read_when:
    - Quieres ejecutar OpenClaw con modelos de código abierto mediante LM Studio
    - Quieres instalar y configurar LM Studio
summary: Ejecutar OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-11T23:29:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio ejecuta modelos llama.cpp (GGUF) o MLX localmente, como aplicación con interfaz gráfica o mediante el daemon sin interfaz `llmster`.
Para consultar la instalación y la documentación del producto, visita [lmstudio.ai](https://lmstudio.ai/).

## Inicio rápido

<Steps>
  <Step title="Instalar e iniciar el servidor">
    Instala LM Studio (escritorio) o `llmster` (sin interfaz) y, a continuación, inicia el servidor:

    ```bash
    lms server start --port 1234
    ```

    También puedes ejecutar el daemon sin interfaz:

    ```bash
    lms daemon up
    ```

    Si utilizas la aplicación de escritorio, habilita JIT para que la carga de modelos sea fluida; consulta la
    [guía de JIT y TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Establecer una clave de API si la autenticación está habilitada">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Si la autenticación de LM Studio está deshabilitada, deja la clave de API en blanco durante la configuración. Consulta
    [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Ejecutar la configuración inicial">
    ```bash
    openclaw onboard
    ```

    Elige `LM Studio` y, después, selecciona un modelo cuando aparezca la solicitud `Default model`.

  </Step>
</Steps>

Para cambiar posteriormente el modelo predeterminado:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Las claves de modelo de LM Studio utilizan el formato `author/model-name` (por ejemplo, `qwen/qwen3.5-9b`); las referencias de modelos de OpenClaw
anteponen el proveedor: `lmstudio/qwen/qwen3.5-9b`. Para encontrar la clave exacta de un modelo, ejecuta el
siguiente comando y consulta el campo `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Configuración inicial no interactiva

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

También puedes especificar explícitamente la URL base, el modelo y la clave de API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` recibe la clave del modelo tal como la devuelve LM Studio (por ejemplo, `qwen/qwen3.5-9b`), sin
el prefijo de proveedor `lmstudio/`. Proporciona `--lmstudio-api-key` (o establece `LM_API_TOKEN`) para servidores con autenticación;
omítelo para servidores sin autenticación y OpenClaw almacenará en su lugar un marcador local que no es secreto.
`--custom-api-key` sigue aceptándose por compatibilidad, pero se recomienda `--lmstudio-api-key`.

Esto escribe `models.providers.lmstudio` y establece el modelo predeterminado en `lmstudio/<custom-model-id>`.
Al proporcionar una clave de API, también se escribe el perfil de autenticación `lmstudio:default`.

La configuración interactiva también puede solicitar una longitud de contexto de carga preferida y aplicarla a
los modelos detectados que guarda en la configuración.

## Configuración

### Compatibilidad del uso durante la transmisión

LM Studio no siempre emite un objeto `usage` con el formato de OpenAI en las respuestas transmitidas. OpenClaw
recupera en su lugar los recuentos de tokens a partir de los metadatos `timings.prompt_n` / `timings.predicted_n` propios de llama.cpp.
Cualquier endpoint compatible con OpenAI que se resuelva como endpoint local (host de local loopback) obtiene este mismo
mecanismo alternativo, que también abarca otros motores locales como vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
y text-generation-webui.

### Compatibilidad del razonamiento

Cuando la detección mediante `/api/v1/models` de LM Studio informa de opciones de razonamiento específicas del modelo, OpenClaw
expone los valores de `reasoning_effort` correspondientes (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) en
los metadatos de compatibilidad del modelo. Algunas versiones de LM Studio anuncian una opción binaria en la interfaz (`allowed_options: ["off",
"on"]`), pero rechazan esos valores literales en `/v1/chat/completions`; OpenClaw normaliza esa
estructura binaria a la escala de seis niveles antes de enviar las solicitudes, incluso para configuraciones guardadas anteriormente que
todavía contienen mapas de razonamiento `off`/`on`.

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

### Deshabilitar la precarga

LM Studio admite la carga de modelos justo a tiempo (JIT), que carga los modelos con la primera solicitud. De forma predeterminada, OpenClaw
precarga los modelos mediante el endpoint de carga nativo de LM Studio, lo que resulta útil cuando JIT está
deshabilitado. Para que JIT, el TTL de inactividad y el comportamiento de expulsión automática de LM Studio gestionen el ciclo de vida del modelo,
deshabilita el paso de precarga de OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Host de LAN o tailnet

Utiliza la dirección accesible del host de LM Studio, conserva `/v1` y asegúrate de que LM Studio esté vinculado a una dirección distinta de
local loopback en esa máquina:

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

`lmstudio` confía automáticamente en su endpoint configurado para las solicitudes de modelos, incluidos los hosts de local loopback,
LAN y tailnet (excepto los orígenes de metadatos o de enlace local). Cualquier entrada de proveedor personalizada o local compatible con OpenAI
obtiene la misma confianza de origen exacto. Las solicitudes a otro host o puerto privado siguen
requiriendo `models.providers.<id>.request.allowPrivateNetwork: true`; establécelo en `false` para excluirte de
la confianza predeterminada.

## Solución de problemas

### No se detecta LM Studio

Asegúrate de que LM Studio esté en ejecución:

```bash
lms server start --port 1234
```

Si la autenticación está habilitada, establece también `LM_API_TOKEN`. Comprueba que la API sea accesible:

```bash
curl http://localhost:1234/api/v1/models
```

### Errores de autenticación (HTTP 401)

- Comprueba que `LM_API_TOKEN` coincida con la clave configurada en LM Studio.
- Consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si el servidor no requiere autenticación, deja la clave en blanco durante la configuración.

## Contenido relacionado

- [Selección de modelos](/es/concepts/model-providers)
- [Ollama](/es/providers/ollama)
- [Modelos locales](/es/gateway/local-models)
