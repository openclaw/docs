---
read_when:
    - Necesitas saber qué variables de entorno se cargan y en qué orden.
    - Estás depurando claves de API que faltan en el Gateway
    - Estás documentando la autenticación del proveedor o los entornos de implementación.
summary: Dónde carga OpenClaw las variables de entorno y el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-07-11T23:09:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw obtiene variables de entorno de múltiples fuentes. La regla es **nunca sobrescribir los valores existentes**.
Los archivos `.env` del espacio de trabajo son una fuente de menor confianza: OpenClaw ignora las credenciales de proveedores y los controles protegidos del entorno de ejecución procedentes del `.env` del espacio de trabajo antes de aplicar la precedencia.

## Precedencia (de mayor a menor)

1. **Entorno del proceso** (lo que el proceso del Gateway ya recibe del shell o daemon principal).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe; se ignoran las credenciales de proveedores y los controles protegidos del entorno de ejecución).
3. **`.env` global** en `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`; recomendado para las claves de API de proveedores; no sobrescribe).
4. **Bloque `env` de configuración** en `~/.openclaw/openclaw.json` (se aplica solo si falta el valor).
5. **Importación opcional del shell de inicio de sesión** (`env.shellEnv.enabled` u `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo a las claves esperadas que falten.

En instalaciones nuevas de Ubuntu que usan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como alternativa de compatibilidad después del `.env` global. Si ambos archivos existen y contienen valores diferentes, OpenClaw conserva `~/.openclaw/.env` y muestra una advertencia.

Si el archivo de configuración no existe, se omite el paso 4; la importación del shell se sigue ejecutando si está habilitada.

## Credenciales de proveedores y `.env` del espacio de trabajo

No almacene las claves de API de proveedores únicamente en un `.env` del espacio de trabajo. OpenClaw bloquea en los archivos `.env` del espacio de trabajo un amplio conjunto de claves de credenciales de proveedores y de redirección de endpoints, incluidas todas las variables de entorno de autenticación de proveedores conocidas (por ejemplo, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), además de cualquier clave que termine en `_API_HOST`, `_BASE_URL` o `_HOMESERVER`, y todos los espacios de nombres `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` y `OPENAI_API_KEY_*`.

En su lugar, use una de estas fuentes de confianza para las credenciales de proveedores:

- El entorno del proceso del Gateway, como un shell, una unidad de launchd/systemd, un secreto de contenedor o un secreto de CI.
- El archivo dotenv global del entorno de ejecución en `~/.openclaw/.env` o `$OPENCLAW_STATE_DIR/.env`.
- El bloque `env` de configuración en `~/.openclaw/openclaw.json`.
- La importación opcional del shell de inicio de sesión cuando `env.shellEnv.enabled` u `OPENCLAW_LOAD_SHELL_ENV=1` estén habilitados.

Si anteriormente almacenaba las claves de proveedores únicamente en un `.env` del espacio de trabajo, muévalas a una de las fuentes de confianza anteriores. El `.env` del espacio de trabajo puede seguir proporcionando variables normales del proyecto que no sean credenciales, redirecciones de endpoints, sobrescrituras de hosts ni controles del entorno de ejecución `OPENCLAW_*`.

Consulte [Archivos `.env` del espacio de trabajo](/es/gateway/security#workspace-env-files) para conocer los motivos de seguridad.

## Bloque `env` de configuración

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

El bloque `env` de configuración solo acepta valores de cadena literales. No expande
valores `file:...`; por ejemplo, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
se pasa a los proveedores exactamente como esa cadena.

Para las claves de proveedores respaldadas por archivos, use una SecretRef en el campo de credenciales que
la admita:

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
[superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para conocer
los campos compatibles.

## Importación del entorno del shell

`env.shellEnv` ejecuta su shell de inicio de sesión e importa únicamente las claves esperadas **que falten**:

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

En hosts del Gateway que no sean Windows, los comandos `exec` de bash y zsh usan de forma predeterminada una instantánea de inicio.
Establezca `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso del Gateway para deshabilitar esta ruta.
Los valores `false`, `no` y `off` también la deshabilitan. Los valores `exec.env` de cada llamada no pueden activar ni desactivar
las instantáneas ni redirigir su caché.

## Variables de entorno inyectadas durante la ejecución

OpenClaw también inyecta marcadores de contexto en los procesos secundarios que inicia:

- `OPENCLAW_SHELL=exec`: se establece para los comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp-client`: se establece para `openclaw acp client` cuando inicia el proceso puente de ACP.
- `OPENCLAW_SHELL=tui-local`: se establece para los comandos de shell `!` de la TUI local.
- `OPENCLAW_CLI=1`: se establece para los procesos secundarios iniciados por el punto de entrada de la CLI.

Estos son marcadores del entorno de ejecución (no son una configuración obligatoria del usuario). Pueden usarse en la lógica del shell o del perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la interfaz de usuario

- `OPENCLAW_THEME=light`: fuerza la paleta clara de la TUI cuando el terminal tiene un fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de la TUI.
- `COLORFGBG`: si el terminal la exporta, OpenClaw usa la indicación del color de fondo para seleccionar automáticamente la paleta de la TUI.

## Sustitución de variables de entorno en la configuración

Puede hacer referencia directamente a variables de entorno en los valores de cadena de la configuración mediante la sintaxis `${VAR_NAME}`:

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
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para los campos que admiten referencias de secretos.

Ambos se resuelven a partir del entorno del proceso en el momento de la activación. Los detalles de SecretRef se documentan en [Gestión de secretos](/es/gateway/secrets).
El propio bloque `env` de configuración no resuelve objetos SecretRef ni valores abreviados
`file:...`.

## Variables de entorno relacionadas con rutas

| Variable                 | Finalidad                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sobrescribe el directorio personal usado para los valores predeterminados de las rutas internas de OpenClaw (`~/.openclaw/`, directorios de agentes, sesiones, credenciales, incorporación del instalador y el checkout de desarrollo predeterminado). Resulta útil al ejecutar OpenClaw como un usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`     | Sobrescribe el directorio de estado (valor predeterminado: `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Sobrescribe la ruta del archivo de configuración (valor predeterminado: `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de rutas de directorios en los que las directivas `$include` pueden resolver archivos fuera del directorio de configuración (valor predeterminado: ninguno; `$include` queda restringido al directorio de configuración). Expande la virgulilla.                                                         |

## Registro

| Variable                         | Finalidad                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sobrescribe el nivel de registro tanto para el archivo como para la consola (p. ej., `debug`, `trace`). Tiene prioridad sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran y generan una advertencia. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos específicos de tiempos de solicitudes y respuestas del modelo en el nivel `info` sin habilitar los registros globales de depuración.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos de la carga útil del modelo: `summary`, `tools` o `full-redacted`. `full-redacted` está limitado y censurado, pero puede incluir texto de prompts o mensajes.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de transmisión: `events` para los tiempos de inicio y finalización, y `peek` para incluir los primeros cinco eventos SSE censurados.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos de la superficie del modelo en modo de código, incluida la ocultación de herramientas del proveedor y la aplicación compacta de controles y directivas.                                                                                  |

### `OPENCLAW_HOME`

Cuando se establece, `OPENCLAW_HOME` sustituye el directorio personal del sistema (`$HOME` / `os.homedir()`) para los valores predeterminados de las rutas internas de OpenClaw. Esto incluye el directorio de estado predeterminado, la ruta de configuración, los directorios de agentes, las credenciales, el espacio de trabajo de incorporación del instalador y el checkout de desarrollo predeterminado usado por `openclaw update --channel dev`.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > directorio personal alternativo de `PREFIX` de Termux en Android > `os.homedir()`

**Ejemplo** (LaunchDaemon de macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también puede establecerse en una ruta con virgulilla (p. ej., `~/svc`), que se expande antes de usarse mediante la misma cadena de alternativas del directorio personal del sistema operativo.

Las variables de ruta explícitas, como `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` y `OPENCLAW_GIT_DIR`, siguen teniendo prioridad. Las tareas de la cuenta del sistema operativo, como la detección de archivos de inicio del shell, la configuración del gestor de paquetes y la expansión de `~` en el host, pueden seguir usando el directorio personal real del sistema.

## Usuarios de nvm: errores de TLS de web_fetch

Si Node.js se instaló mediante **nvm** (y no mediante el gestor de paquetes del sistema), la función `fetch()` integrada usa
el almacén de autoridades de certificación incluido con nvm, que puede carecer de autoridades de certificación raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
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

No confíe únicamente en escribir esta variable en `~/.openclaw/.env`; Node lee
`NODE_EXTRA_CA_CERTS` al iniciar el proceso.

## Variables de entorno heredadas

OpenClaw solo lee variables de entorno `OPENCLAW_*`. Los prefijos heredados
`CLAWDBOT_*` y `MOLTBOT_*` de versiones anteriores se ignoran
silenciosamente.

Si alguno sigue establecido en el proceso del Gateway durante el inicio, OpenClaw emite una
única advertencia de obsolescencia de Node (`OPENCLAW_LEGACY_ENV_VARS`) que enumera los
prefijos detectados y el número total. Cambie el nombre de cada valor sustituyendo el
prefijo heredado por `OPENCLAW_` (por ejemplo, `CLAWDBOT_GATEWAY_TOKEN` por
`OPENCLAW_GATEWAY_TOKEN`); los nombres antiguos no tienen ningún efecto.

## Contenido relacionado

- [Configuración del Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Descripción general de los modelos](/es/concepts/models)
