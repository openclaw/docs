---
read_when:
    - Necesita saber qué variables de entorno se cargan y en qué orden
    - Está depurando claves de API faltantes en el Gateway
    - Está documentando la autenticación del proveedor o los entornos de implementación
summary: Dónde carga OpenClaw las variables de entorno y cuál es el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-07-22T10:36:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db9990dea5df7731e54c8d442f4704bd4d6e0caf6f2c2fdea32d2583cd41128c
    source_path: help/environment.md
    workflow: 16
---

OpenClaw obtiene variables de entorno de varias fuentes. La regla es **no sobrescribir nunca los valores existentes**.
Los archivos `.env` del espacio de trabajo son una fuente de menor confianza: OpenClaw ignora las credenciales de proveedores y los controles protegidos del entorno de ejecución procedentes de `.env` del espacio de trabajo antes de aplicar la precedencia.

## Precedencia (de mayor a menor)

1. **Entorno del proceso** (lo que el proceso del Gateway ya tiene del shell o demonio principal).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe; se ignoran las credenciales de proveedores y los controles protegidos del entorno de ejecución).
3. **`.env` global** en `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`; recomendado para claves de API de proveedores; no sobrescribe).
4. **Bloque de configuración `env`** en `~/.openclaw/openclaw.json` (se aplica solo si falta).
5. **Importación opcional del shell de inicio de sesión** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo a las claves esperadas que falten.

En instalaciones nuevas de Ubuntu que utilizan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como alternativa de compatibilidad después del `.env` global. Si ambos archivos existen y no coinciden, OpenClaw conserva `~/.openclaw/.env` y muestra una advertencia.

Si el archivo de configuración no existe, se omite por completo el paso 4; la importación del shell sigue ejecutándose si está habilitada.

## Variables admitidas para operadores

Las variables siguientes constituyen el contrato de entorno admitido para los operadores. Las variables `OPENCLAW_*` no documentadas son detalles internos de implementación y pueden desaparecer sin previo aviso.

### Rutas e instancias

| Variable                 | Finalidad                                                          |
| ------------------------ | ------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | Sobrescribir el directorio de inicio utilizado para las rutas predeterminadas de OpenClaw. |
| `OPENCLAW_STATE_DIR`     | Sobrescribir el directorio de estado mutable.                      |
| `OPENCLAW_CONFIG_PATH`   | Sobrescribir la ruta del archivo de configuración activo.          |
| `OPENCLAW_WORKSPACE_DIR` | Sobrescribir el espacio de trabajo predeterminado del agente.      |
| `OPENCLAW_PROFILE`       | Seleccionar un perfil con nombre y sus valores predeterminados aislados. |
| `OPENCLAW_GIT_DIR`       | Sobrescribir el checkout de origen utilizado por las actualizaciones del canal de desarrollo. |
| `OPENCLAW_INCLUDE_ROOTS` | Permitir que `$include` se resuelva desde raíces adicionales. |

### Gateway y autenticación

| Variable                    | Finalidad                                                       |
| --------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_GATEWAY_URL`      | Sobrescribir la URL del Gateway remoto utilizada por los clientes. |
| `OPENCLAW_GATEWAY_PORT`     | Sobrescribir el puerto del Gateway local.                       |
| `OPENCLAW_GATEWAY_TOKEN`    | Proporcionar autenticación mediante token para servidores y clientes del Gateway. |
| `OPENCLAW_GATEWAY_PASSWORD` | Proporcionar autenticación mediante contraseña para servidores y clientes del Gateway. |

### Credenciales de proveedores

El núcleo y los plugins de proveedores incluidos reconocen las siguientes variables de credenciales y selección de proveedor. Es preferible utilizar la configuración o los campos SecretRef de cada proveedor cuando se necesiten credenciales con un ámbito específico, en lugar de un único valor para todo el proceso.

`AI_GATEWAY_API_KEY`, `ANTHROPIC_ADMIN_API_KEY`, `ANTHROPIC_ADMIN_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_OAUTH_TOKEN`, `ARCEEAI_API_KEY`, `AZURE_OPENAI_API_KEY`, `AZURE_SPEECH_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `BASETEN_API_KEY`, `BRAVE_API_KEY`, `BYTEPLUS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`, `CLAWROUTER_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `CODEX_API_KEY`, `COHERE_API_KEY`, `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPGRAM_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `ELEVENLABS_API_KEY`, `EXA_API_KEY`, `FAL_API_KEY`, `FAL_KEY`, `FEATHERLESS_API_KEY`, `FIRECRAWL_API_KEY`, `FIREWORKS_API_KEY`, `GCLOUD_PROJECT`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GMI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_API_KEY`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_CLOUD_PROJECT`, `GRADIUM_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `INWORLD_API_KEY`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `LITELLM_API_KEY`, `LM_API_TOKEN`, `LONGCAT_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MODEL_API_KEY`, `MOONSHOT_API_KEY`, `NOVITA_API_KEY`, `NVIDIA_API_KEY`, `OLLAMA_API_KEY`, `OPENAI_ADMIN_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `PARALLEL_API_KEY`, `PERPLEXITY_API_KEY`, `PIXVERSE_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `QWEN_TOKEN_PLAN_API_KEY`, `RUNWAYML_API_SECRET`, `RUNWAY_API_KEY`, `SENSEAUDIO_API_KEY`, `SGLANG_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`, `STEPFUN_API_KEY`, `SYNTHETIC_API_KEY`, `TAVILY_API_KEY`, `TOGETHER_API_KEY`, `TOKENHUB_API_KEY`, `TOKENPLAN_API_KEY`, `VENICE_API_KEY`, `VLLM_API_KEY`, `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOYAGE_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`, `XI_API_KEY`, `ZAI_API_KEY` y `Z_AI_API_KEY`.

Los plugins de terceros instalados pueden declarar variables de credenciales adicionales en sus manifiestos; esas variables son contratos del plugin que las declara, no variables del núcleo de OpenClaw.

### Registro y diagnóstico

| Variable                             | Finalidad                                                     |
| ------------------------------------ | ------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`                 | Sobrescribir los niveles de registro de archivos y consola.   |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT`     | Habilitar el diagnóstico de tiempos del transporte del modelo. |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`       | Seleccionar el diagnóstico censurado de cargas útiles del modelo. |
| `OPENCLAW_DEBUG_SSE`                 | Seleccionar el diagnóstico de tiempos de SSE o de inspección de eventos. |
| `OPENCLAW_DEBUG_CODE_MODE`           | Habilitar el diagnóstico de superficies del modo de código.   |
| `OPENCLAW_DIAGNOSTICS`               | Habilitar indicadores de diagnóstico con nombre o deshabilitarlos todos con `0`. |
| `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` | Seleccionar la ruta JSONL para el diagnóstico de la cronología. |
| `OPENCLAW_DIAGNOSTICS_EVENT_LOOP`    | Añadir muestras del bucle de eventos al diagnóstico de la cronología. |

### Controles de funciones y del entorno de ejecución

| Variable                             | Finalidad                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `OPENCLAW_LOAD_SHELL_ENV`            | Importar desde el shell de inicio de sesión las variables esperadas que falten. |
| `OPENCLAW_SHELL_ENV_TIMEOUT_MS`      | Establecer el tiempo de espera de la importación del shell de inicio de sesión. |
| `OPENCLAW_EXEC_SHELL_SNAPSHOT`       | Deshabilitar las instantáneas del shell de ejecución con `0`.   |
| `OPENCLAW_OFFLINE`                   | Impedir la descarga de binarios auxiliares fijados del agente.                 |
| `OPENCLAW_BROWSER_HEADLESS`          | Forzar que los navegadores administrados se inicien con interfaz (`0`) o sin interfaz (`1`). |
| `OPENCLAW_DISABLE_BONJOUR`           | Forzar la publicidad de Bonjour a activada (`0`) o desactivada (`1`). |
| `OPENCLAW_NO_AUTO_UPDATE`            | Deshabilitar la aplicación automática de actualizaciones.                      |
| `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS` | Permitir conexiones `ws://` de DNS privado de confianza como anulación de emergencia. |
| `OPENCLAW_ALLOW_MULTI_GATEWAY`       | Permitir varios procesos del Gateway conservando los bloqueos de propiedad por estado. |
| `OPENCLAW_SKIP_CHANNELS`             | Iniciar el Gateway sin transportes de canal para solucionar problemas.         |
| `OPENCLAW_THEME`                     | Forzar la paleta de la TUI a `light` o `dark`.          |

## Credenciales de proveedores y `.env` del espacio de trabajo

No se deben conservar las claves de API de proveedores únicamente en un `.env` del espacio de trabajo. OpenClaw bloquea en los archivos `.env` del espacio de trabajo un amplio conjunto de claves de credenciales de proveedores y redirección de endpoints, incluidas todas las variables de entorno de autenticación de proveedores conocidas (por ejemplo, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), además de cualquier clave que termine en `_API_HOST`, `_BASE_URL`, `_ENDPOINT` o `_HOMESERVER`, y los espacios de nombres completos `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` y `OPENAI_API_KEY_*`.

En su lugar, utilice una de estas fuentes de confianza para las credenciales de proveedores:

- El entorno del proceso del Gateway, como un shell, una unidad de launchd/systemd, un secreto de contenedor o un secreto de CI.
- El archivo dotenv global del entorno de ejecución en `~/.openclaw/.env` o `$OPENCLAW_STATE_DIR/.env`.
- El bloque de configuración `env` en `~/.openclaw/openclaw.json`.
- La importación opcional del shell de inicio de sesión cuando `env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1` está habilitado.

Si anteriormente se almacenaban claves de proveedores o valores de enrutamiento de endpoints únicamente en un `.env` del espacio de trabajo, deben trasladarse a una de las fuentes de confianza anteriores. El `.env` del espacio de trabajo puede seguir proporcionando variables de proyecto comunes que no sean credenciales, redirecciones de endpoints, anulaciones de host ni controles del entorno de ejecución `OPENCLAW_*`.

Consulte [Archivos `.env` del espacio de trabajo](/es/gateway/security#workspace-env-files) para conocer la justificación de seguridad.

## Bloque de configuración `env`

Hay dos formas equivalentes de establecer variables de entorno en línea (ninguna sobrescribe valores):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

El bloque de configuración `env` solo acepta valores de cadena literales. No expande los valores
`file:...`; por ejemplo, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
se pasa a los proveedores como esa cadena exacta.

Para las claves de proveedores almacenadas en archivos, utilice un SecretRef en el campo de credenciales que
lo admita:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Consulte [Gestión de secretos](/es/gateway/secrets) y la
[superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para conocer los
campos admitidos.

## Importación del entorno del shell

`env.shellEnv` ejecuta el shell de inicio de sesión e importa únicamente las claves esperadas que **falten**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Equivalentes como variables de entorno:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (valor predeterminado: `15000`)

## Instantáneas del shell de ejecución

En hosts del Gateway que no sean Windows, los comandos `exec` de bash y zsh utilizan de forma predeterminada una instantánea de inicio.
Establezca `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso del Gateway para deshabilitar esta ruta.
Los valores `false`, `no` y `off` también la deshabilitan. Los valores `exec.env` por llamada no pueden activar ni desactivar
las instantáneas ni redirigir su caché.

## Variables de entorno inyectadas durante la ejecución

OpenClaw también inyecta marcadores de contexto en los procesos secundarios iniciados:

- `OPENCLAW_SHELL=exec`: se establece para los comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp-client`: se establece para `openclaw acp client` cuando inicia el proceso puente de ACP.
- `OPENCLAW_SHELL=tui-local`: se establece para los comandos de shell de `!` de la TUI local.
- `OPENCLAW_CLI=1`: se establece para los procesos secundarios iniciados por el punto de entrada de la CLI.

Estos son marcadores de tiempo de ejecución (no son configuración de usuario obligatoria). Pueden utilizarse en la lógica del shell o del perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la UI

- `OPENCLAW_THEME=light`: fuerza la paleta clara de la TUI cuando el terminal tiene un fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de la TUI.
- `COLORFGBG`: si el terminal la exporta, OpenClaw utiliza la indicación del color de fondo para elegir automáticamente la paleta de la TUI.

## Sustitución de variables de entorno en la configuración

Se pueden referenciar variables de entorno directamente en valores de cadena de la configuración mediante la sintaxis `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Consulte [Configuración: Sustitución de variables de entorno](/es/gateway/configuration-reference#env-var-substitution) para obtener todos los detalles.

## Referencias de secretos frente a cadenas `${ENV}`

OpenClaw admite dos patrones basados en variables de entorno:

- Sustitución de cadenas `${VAR}` en valores de configuración.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que admiten referencias de secretos.

Ambos se resuelven a partir del entorno del proceso en el momento de la activación. Los detalles de SecretRef se documentan en [Gestión de secretos](/es/gateway/secrets).
El propio bloque `env` de la configuración no resuelve SecretRefs ni valores abreviados
`file:...`.

## Variables de entorno relacionadas con rutas

| Variable                 | Finalidad                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sobrescribe el directorio principal utilizado para los valores predeterminados de rutas internas de OpenClaw (`~/.openclaw/`, directorios de agentes, sesiones, credenciales, incorporación del instalador y checkout de desarrollo predeterminado). Resulta útil al ejecutar OpenClaw como usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`     | Sobrescribe el directorio de estado (valor predeterminado: `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Sobrescribe la ruta del archivo de configuración (valor predeterminado: `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de rutas de directorios donde las directivas `$include` pueden resolver archivos fuera del directorio de configuración (valor predeterminado: ninguno; `$include` está limitado al directorio de configuración). Admite la expansión de la virgulilla.                                                         |

## Descargas de herramientas auxiliares del agente

Establezca `OPENCLAW_OFFLINE=1` para impedir que OpenClaw descargue sus binarios auxiliares fijados
`fd` y `ripgrep`. Los auxiliares existentes en el directorio de herramientas
de OpenClaw y los binarios funcionales del sistema siguen siendo aptos; un auxiliar que falte permanece
no disponible en lugar de desencadenar una solicitud de red.

## Registro

| Variable                         | Finalidad                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sobrescribe el nivel de registro tanto para el archivo como para la consola (p. ej., `debug`, `trace`). Tiene prioridad sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran y se muestra una advertencia. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos específicos de temporización de solicitudes y respuestas del modelo con el nivel `info` sin habilitar los registros globales de depuración.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos de la carga útil del modelo: `summary`, `tools` o `full-redacted`. `full-redacted` está limitado y redactado, pero puede incluir texto de mensajes o del prompt.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de streaming: `events` para la temporización del inicio y la finalización, y `peek` para incluir los primeros cinco eventos SSE redactados.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos de la superficie del modelo en modo código, incluidos la ocultación de herramientas del proveedor y el cumplimiento directo y compacto de los controles.                                                                                  |

### `OPENCLAW_HOME`

Cuando se establece, `OPENCLAW_HOME` sustituye el directorio principal del sistema (`$HOME` / `os.homedir()`) para los valores predeterminados de rutas internas de OpenClaw. Esto incluye el directorio de estado predeterminado, la ruta de configuración, los directorios de agentes, las credenciales, el espacio de trabajo de incorporación del instalador y el checkout de desarrollo predeterminado utilizado por `openclaw update --channel dev`.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > directorio principal alternativo `PREFIX` de Termux en Android > `os.homedir()`

**Ejemplo** (LaunchDaemon de macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también puede establecerse en una ruta con virgulilla (p. ej., `~/svc`), que se expande mediante la misma cadena alternativa del directorio principal del sistema operativo antes de utilizarse.

Las variables de ruta explícitas, como `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` y `OPENCLAW_GIT_DIR`, siguen teniendo prioridad. Las tareas de la cuenta del sistema operativo, como la detección del archivo de inicio del shell, la configuración del gestor de paquetes y la expansión de `~` del host, pueden seguir utilizando el directorio principal real del sistema.

## Usuarios de nvm: errores de TLS de web_fetch

Si Node.js se instaló mediante **nvm** (no mediante el gestor de paquetes del sistema), el componente integrado `fetch()` utiliza
el almacén de CA incluido con nvm, que puede carecer de CA raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2, etc.). Esto provoca que `web_fetch` falle con `"fetch failed"` en la mayoría de los sitios HTTPS.

En Linux, OpenClaw detecta automáticamente nvm y aplica la corrección en el entorno de inicio real:

- `openclaw gateway install` escribe `NODE_EXTRA_CA_CERTS` en el entorno del servicio systemd
- el punto de entrada de la CLI `openclaw` vuelve a ejecutarse con `NODE_EXTRA_CA_CERTS` establecido antes de iniciar Node

**Corrección manual (para versiones anteriores o ejecuciones directas de `node ...`):**

Exporte la variable antes de iniciar OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

No dependa únicamente de escribir esta variable en `~/.openclaw/.env`; Node lee
`NODE_EXTRA_CA_CERTS` al iniciar el proceso.

## Variables de entorno heredadas

OpenClaw solo lee variables de entorno `OPENCLAW_*`. Los prefijos heredados
`CLAWDBOT_*` y `MOLTBOT_*` de versiones anteriores se ignoran
silenciosamente.

Si alguna sigue establecida en el proceso de Gateway al iniciarse, OpenClaw emite una
única advertencia de obsolescencia de Node (`OPENCLAW_LEGACY_ENV_VARS`) que enumera los
prefijos detectados y el número total. Cambie el nombre de cada valor sustituyendo el
prefijo heredado por `OPENCLAW_` (por ejemplo, `CLAWDBOT_GATEWAY_TOKEN` por
`OPENCLAW_GATEWAY_TOKEN`); los nombres antiguos no tienen ningún efecto.

## Contenido relacionado

- [Configuración del Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Descripción general de los modelos](/es/concepts/models)
