---
read_when:
    - Quieres ejecutar OpenClaw con modelos de código abierto mediante LM Studio
    - Desea instalar y configurar LM Studio
summary: Ejecuta OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-05T11:36:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio ejecuta modelos llama.cpp (GGUF) o MLX localmente, como aplicación GUI o mediante el demonio
`llmster` sin interfaz gráfica. Para la instalación y la documentación del producto, consulta [lmstudio.ai](https://lmstudio.ai/).

## Inicio rápido

<Steps>
  <Step title="Install and start the server">
    Instala LM Studio (escritorio) o `llmster` (sin interfaz gráfica) y luego inicia el servidor:

    ```bash
    lms server start --port 1234
    ```

    O ejecuta el demonio sin interfaz gráfica:

    ```bash
    lms daemon up
    ```

    Si usas la aplicación de escritorio, habilita JIT para una carga fluida de modelos; consulta la
    [guía de JIT y TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Set an API key if auth is enabled">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Si la autenticación de LM Studio está deshabilitada, deja la clave de API en blanco durante la configuración. Consulta
    [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard
    ```

    Elige `LM Studio` y luego selecciona un modelo en el prompt `Default model`.

  </Step>
</Steps>

Cambia el modelo predeterminado más adelante:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Las claves de modelo de LM Studio usan el formato `author/model-name` (por ejemplo, `qwen/qwen3.5-9b`); las referencias de modelo de OpenClaw
anteponen el proveedor: `lmstudio/qwen/qwen3.5-9b`. Encuentra la clave exacta de un modelo ejecutando el
comando siguiente y revisando el campo `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Incorporación no interactiva

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

O especifica explícitamente la URL base, el modelo y la clave de API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` toma la clave de modelo devuelta por LM Studio (por ejemplo, `qwen/qwen3.5-9b`), sin
el prefijo de proveedor `lmstudio/`. Pasa `--lmstudio-api-key` (o define `LM_API_TOKEN`) para servidores
autenticados; omítelo para servidores sin autenticación y OpenClaw almacenará en su lugar un marcador local que no es secreto.
`--custom-api-key` todavía se acepta por compatibilidad, pero se prefiere `--lmstudio-api-key`.

Esto escribe `models.providers.lmstudio` y establece el modelo predeterminado en `lmstudio/<custom-model-id>`.
Proporcionar una clave de API también escribe el perfil de autenticación `lmstudio:default`.

La configuración interactiva también puede solicitar una longitud de contexto de carga preferida y aplicarla en todos
los modelos descubiertos que guarda en la configuración.

## Configuración

### Compatibilidad de uso en streaming

LM Studio no siempre emite un objeto `usage` con forma de OpenAI en las respuestas transmitidas. OpenClaw
recupera los recuentos de tokens desde metadatos estilo llama.cpp `timings.prompt_n` / `timings.predicted_n`
en su lugar. Cualquier endpoint compatible con OpenAI resuelto como endpoint local (host de loopback) obtiene este mismo
fallback, lo que cubre otros backends locales como vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
y text-generation-webui.

### Compatibilidad de pensamiento

Cuando el descubrimiento `/api/v1/models` de LM Studio informa opciones de razonamiento específicas del modelo, OpenClaw
expone valores `reasoning_effort` coincidentes (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) en
los metadatos de compatibilidad del modelo. Algunas versiones de LM Studio anuncian una opción binaria de UI (`allowed_options: ["off",
"on"]`) mientras rechazan esos valores literales en `/v1/chat/completions`; OpenClaw normaliza esa
forma binaria a la escala de seis niveles antes de enviar solicitudes, incluso para configuraciones guardadas antiguas que
todavía tienen mapas de razonamiento `off`/`on`.

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

LM Studio admite la carga de modelos justo a tiempo (JIT), que carga los modelos en la primera solicitud. OpenClaw
precarga los modelos mediante el endpoint de carga nativo de LM Studio de forma predeterminada, lo que ayuda cuando JIT está
deshabilitado. Para dejar que el JIT, el TTL de inactividad y el comportamiento de autoexpulsión de LM Studio gestionen el ciclo de vida del modelo,
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

Usa la dirección alcanzable del host de LM Studio, conserva `/v1` y asegúrate de que LM Studio esté vinculado más allá de
loopback en esa máquina:

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

`lmstudio` confía automáticamente en su endpoint configurado para solicitudes de modelo, incluidos hosts de loopback,
LAN y tailnet (excepto orígenes de metadatos/link-local). Cualquier entrada de proveedor personalizada/local compatible con OpenAI
obtiene la misma confianza de origen exacto. Las solicitudes a un host o puerto privado diferente todavía
requieren `models.providers.<id>.request.allowPrivateNetwork: true`; establécelo en `false` para excluirte de
la confianza predeterminada.

## Solución de problemas

### LM Studio no detectado

Asegúrate de que LM Studio esté en ejecución:

```bash
lms server start --port 1234
```

Si la autenticación está habilitada, define también `LM_API_TOKEN`. Verifica que la API sea alcanzable:

```bash
curl http://localhost:1234/api/v1/models
```

### Errores de autenticación (HTTP 401)

- Comprueba que `LM_API_TOKEN` coincida con la clave configurada en LM Studio.
- Consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si el servidor no requiere autenticación, deja la clave en blanco durante la configuración.

## Relacionado

- [Selección de modelo](/es/concepts/model-providers)
- [Ollama](/es/providers/ollama)
- [Modelos locales](/es/gateway/local-models)
