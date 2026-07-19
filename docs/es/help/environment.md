---
read_when:
    - Necesita saber qué variables de entorno se cargan y en qué orden
    - Se están depurando claves de API que faltan en el Gateway
    - Está documentando la autenticación del proveedor o los entornos de despliegue
summary: Dónde carga OpenClaw las variables de entorno y el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-07-19T01:55:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9f9fdd67ee148931af2e15a12917871a0b85f80f763f0df3a978b7fd39b93eff
    source_path: help/environment.md
    workflow: 16
---

OpenClaw obtiene variables de entorno de varias fuentes. La regla es **nunca sobrescribir los valores existentes**.
Los archivos `.env` del espacio de trabajo son una fuente de menor confianza: OpenClaw ignora las credenciales de proveedores y los controles de ejecución protegidos de los archivos `.env` del espacio de trabajo antes de aplicar la precedencia.

## Precedencia (de mayor a menor)

1. **Entorno del proceso** (lo que el proceso del Gateway ya tiene del shell o daemon principal).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe; se ignoran las credenciales de proveedores y los controles de ejecución protegidos).
3. **`.env` global** en `~/.openclaw/.env` (también denominado `$OPENCLAW_STATE_DIR/.env`; recomendado para claves de API de proveedores; no sobrescribe).
4. **Bloque de configuración `env`** en `~/.openclaw/openclaw.json` (se aplica solo si falta).
5. **Importación opcional del shell de inicio de sesión** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo a las claves esperadas que falten.

En instalaciones nuevas de Ubuntu que utilizan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como alternativa de compatibilidad después del archivo `.env` global. Si ambos archivos existen y difieren, OpenClaw conserva `~/.openclaw/.env` y muestra una advertencia.

Si falta por completo el archivo de configuración, se omite el paso 4; la importación del shell sigue ejecutándose si está habilitada.

## Credenciales de proveedores y `.env` del espacio de trabajo

No almacene las claves de API de proveedores únicamente en un archivo `.env` del espacio de trabajo. OpenClaw bloquea un amplio conjunto de claves de credenciales de proveedores y de redirección de endpoints procedentes de archivos `.env` del espacio de trabajo, incluidas todas las variables de entorno de autenticación de proveedores conocidas (por ejemplo, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), además de cualquier clave que termine en `_API_HOST`, `_BASE_URL`, `_ENDPOINT` o `_HOMESERVER`, y todos los espacios de nombres `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` y `OPENAI_API_KEY_*`.

En su lugar, utilice una de estas fuentes de confianza para las credenciales de proveedores:

- El entorno del proceso del Gateway, como un shell, una unidad de launchd/systemd, un secreto de contenedor o un secreto de CI.
- El archivo dotenv global de ejecución en `~/.openclaw/.env` o `$OPENCLAW_STATE_DIR/.env`.
- El bloque de configuración `env` en `~/.openclaw/openclaw.json`.
- La importación opcional del shell de inicio de sesión cuando `env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1` está habilitado.

Si anteriormente almacenaba claves de proveedores o valores de enrutamiento de endpoints únicamente en un archivo `.env` del espacio de trabajo, trasládelos a una de las fuentes de confianza anteriores. El archivo `.env` del espacio de trabajo puede seguir proporcionando variables ordinarias del proyecto que no sean credenciales, redirecciones de endpoints, sobrescrituras de hosts ni controles de ejecución `OPENCLAW_*`.

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

El bloque de configuración `env` solo acepta valores de cadena literales. No expande
los valores `file:...`; por ejemplo, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
se pasa a los proveedores exactamente como esa cadena.

Para claves de proveedores almacenadas en archivos, utilice un SecretRef en el campo de credencial que
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
campos compatibles.

## Importación del entorno del shell

`env.shellEnv` ejecuta el shell de inicio de sesión e importa únicamente las claves esperadas **que falten**:

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

Variables de entorno equivalentes:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (valor predeterminado: `15000`)

## Instantáneas del shell de ejecución

En hosts del Gateway que no sean Windows, los comandos `exec` de bash y zsh utilizan de forma predeterminada una instantánea de inicio.
Establezca `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso del Gateway para deshabilitar esta ruta.
Los valores `false`, `no` y `off` también la deshabilitan. Los valores `exec.env` por llamada no pueden activar o desactivar
las instantáneas ni redirigir su caché.

## Variables de entorno inyectadas durante la ejecución

OpenClaw también inyecta marcadores de contexto en los procesos secundarios que inicia:

- `OPENCLAW_SHELL=exec`: se establece para los comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp-client`: se establece para `openclaw acp client` cuando inicia el proceso puente de ACP.
- `OPENCLAW_SHELL=tui-local`: se establece para los comandos de shell `!` de la TUI local.
- `OPENCLAW_CLI=1`: se establece para los procesos secundarios iniciados por el punto de entrada de la CLI.

Estos son marcadores de ejecución (no son una configuración de usuario obligatoria). Se pueden utilizar en la lógica del shell o del perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la interfaz de usuario

- `OPENCLAW_THEME=light`: fuerza la paleta clara de la TUI cuando el terminal tiene un fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de la TUI.
- `COLORFGBG`: si el terminal la exporta, OpenClaw utiliza la indicación del color de fondo para seleccionar automáticamente la paleta de la TUI.

## Sustitución de variables de entorno en la configuración

Se pueden referenciar variables de entorno directamente en los valores de cadena de la configuración mediante la sintaxis `${VAR_NAME}`:

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

Consulte [Configuración: sustitución de variables de entorno](/es/gateway/configuration-reference#env-var-substitution) para obtener todos los detalles.

## Referencias de secretos frente a cadenas `${ENV}`

OpenClaw admite dos patrones basados en el entorno:

- Sustitución de cadenas `${VAR}` en los valores de configuración.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que admiten referencias a secretos.

Ambos se resuelven desde el entorno del proceso en el momento de la activación. Los detalles de SecretRef se documentan en [Gestión de secretos](/es/gateway/secrets).
El propio bloque de configuración `env` no resuelve SecretRefs ni valores abreviados
`file:...`.

## Variables de entorno relacionadas con rutas

| Variable                 | Propósito                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sobrescribe el directorio de inicio utilizado para los valores predeterminados de rutas internas de OpenClaw (`~/.openclaw/`, directorios de agentes, sesiones, credenciales, incorporación del instalador y checkout de desarrollo predeterminado). Resulta útil al ejecutar OpenClaw con un usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`     | Sobrescribe el directorio de estado (valor predeterminado: `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Sobrescribe la ruta del archivo de configuración (valor predeterminado: `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de rutas de directorios en los que las directivas `$include` pueden resolver archivos fuera del directorio de configuración (valor predeterminado: ninguno; `$include` se limita al directorio de configuración). Expande la virgulilla.                                                         |

## Descargas de herramientas auxiliares del agente

Establezca `OPENCLAW_OFFLINE=1` para impedir que OpenClaw descargue sus binarios auxiliares fijados `fd`
y `ripgrep`. Los auxiliares existentes en el directorio de herramientas de OpenClaw
y los binarios funcionales del sistema siguen siendo válidos; un auxiliar ausente permanece
no disponible en lugar de activar una solicitud de red.

## Registro

| Variable                         | Propósito                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sobrescribe el nivel de registro tanto para el archivo como para la consola (por ejemplo, `debug`, `trace`). Tiene precedencia sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran y se muestra una advertencia. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos específicos de temporización de solicitudes y respuestas del modelo en el nivel `info` sin habilitar los registros de depuración globales.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos de cargas útiles del modelo: `summary`, `tools` o `full-redacted`. `full-redacted` está limitado y censurado, pero puede incluir texto de prompts o mensajes.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de transmisión: `events` para la temporización de inicio/finalización, `peek` para incluir los primeros cinco eventos SSE censurados.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos de la superficie del modelo en modo de código, incluida la ocultación de herramientas del proveedor y la aplicación directa/compacta de controles.                                                                                  |

### `OPENCLAW_HOME`

Cuando se establece, `OPENCLAW_HOME` reemplaza el directorio de inicio del sistema (`$HOME` / `os.homedir()`) para los valores predeterminados de rutas internas de OpenClaw. Esto incluye el directorio de estado predeterminado, la ruta de configuración, los directorios de agentes, las credenciales, el espacio de trabajo de incorporación del instalador y el checkout de desarrollo predeterminado utilizado por `openclaw update --channel dev`.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > directorio de inicio alternativo `PREFIX` de Termux en Android > `os.homedir()`

**Ejemplo** (LaunchDaemon de macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también se puede establecer en una ruta con virgulilla (por ejemplo, `~/svc`), que se expande mediante la misma cadena de alternativas del directorio de inicio del sistema operativo antes de utilizarse.

Las variables de ruta explícitas, como `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` y `OPENCLAW_GIT_DIR`, siguen teniendo precedencia. Las tareas relacionadas con la cuenta del sistema, como la detección del archivo de inicio del shell, la configuración del gestor de paquetes y la expansión de `~` del host, pueden seguir utilizando el directorio de inicio real del sistema.

## Usuarios de nvm: errores TLS de web_fetch

Si Node.js se instaló mediante **nvm** (y no mediante el gestor de paquetes del sistema), el componente integrado `fetch()` utiliza
el almacén de CA incluido con nvm, al que pueden faltarle CA raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2, etc.). Esto provoca que `web_fetch` falle con `"fetch failed"` en la mayoría de los sitios HTTPS.

En Linux, OpenClaw detecta automáticamente nvm y aplica la corrección en el entorno de inicio real:

- `openclaw gateway install` escribe `NODE_EXTRA_CA_CERTS` en el entorno del servicio systemd
- el punto de entrada de la CLI `openclaw` vuelve a ejecutarse con `NODE_EXTRA_CA_CERTS` establecido antes de iniciar Node

**Solución manual (para versiones anteriores o inicios directos de `node ...`):**

Exporte la variable antes de iniciar OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

No confíe en escribir esta variable únicamente en `~/.openclaw/.env`; Node lee
`NODE_EXTRA_CA_CERTS` al iniciar el proceso.

## Variables de entorno heredadas

OpenClaw solo lee las variables de entorno `OPENCLAW_*`. Los prefijos heredados
`CLAWDBOT_*` y `MOLTBOT_*` de versiones anteriores se ignoran
silenciosamente.

Si alguna sigue definida en el proceso del Gateway al iniciarse, OpenClaw emite una
única advertencia de obsolescencia de Node (`OPENCLAW_LEGACY_ENV_VARS`) que enumera los
prefijos detectados y el recuento total. Cambie el nombre de cada valor sustituyendo el
prefijo heredado por `OPENCLAW_` (por ejemplo, `CLAWDBOT_GATEWAY_TOKEN` por
`OPENCLAW_GATEWAY_TOKEN`); los nombres antiguos no tienen ningún efecto.

## Temas relacionados

- [Configuración del Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Descripción general de los modelos](/es/concepts/models)
