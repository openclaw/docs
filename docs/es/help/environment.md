---
read_when:
    - Necesitas saber qué variables de entorno se cargan y en qué orden
    - Estás depurando claves de API faltantes en el Gateway
    - Estás documentando la autenticación de proveedores o los entornos de despliegue
summary: Dónde carga OpenClaw las variables de entorno y el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-07-05T11:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5b5b3b94d314018fe31c21b5de4e9c1e09df3787287a0609afb1ae32ae3f010
    source_path: help/environment.md
    workflow: 16
---

OpenClaw obtiene variables de entorno de múltiples fuentes. La regla es **nunca sobrescribir valores existentes**.
Los archivos `.env` del espacio de trabajo son una fuente de menor confianza: OpenClaw ignora las credenciales de proveedores y los controles de runtime protegidos de `.env` del espacio de trabajo antes de aplicar la precedencia.

## Precedencia (de mayor a menor)

1. **Entorno del proceso** (lo que el proceso Gateway ya tiene del shell/daemon padre).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe; se ignoran las credenciales de proveedores y los controles de runtime protegidos).
3. **`.env` global** en `~/.openclaw/.env` (también `$OPENCLAW_STATE_DIR/.env`; recomendado para claves de API de proveedores; no sobrescribe).
4. **Bloque `env` de la configuración** en `~/.openclaw/openclaw.json` (se aplica solo si falta).
5. **Importación opcional del shell de inicio de sesión** (`env.shellEnv.enabled` u `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo para las claves esperadas que falten.

En instalaciones nuevas de Ubuntu que usan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como fallback de compatibilidad después del `.env` global. Si ambos archivos existen y discrepan, OpenClaw conserva `~/.openclaw/.env` e imprime una advertencia.

Si falta por completo el archivo de configuración, se omite el paso 4; la importación del shell sigue ejecutándose si está habilitada.

## Credenciales de proveedores y `.env` del espacio de trabajo

No guardes claves de API de proveedores solo en un `.env` del espacio de trabajo. OpenClaw bloquea un conjunto amplio de claves de credenciales de proveedores y redirección de endpoints desde archivos `.env` del espacio de trabajo, incluidas todas las variables de entorno de autenticación de proveedores conocidas (por ejemplo `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), además de cualquier clave que termine en `_API_HOST`, `_BASE_URL` o `_HOMESERVER`, y todos los espacios de nombres `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` y `OPENAI_API_KEY_*`.

Usa en su lugar una de estas fuentes de confianza para las credenciales de proveedores:

- El entorno del proceso Gateway, como un shell, una unidad launchd/systemd, un secreto de contenedor o un secreto de CI.
- El archivo dotenv global del runtime en `~/.openclaw/.env` o `$OPENCLAW_STATE_DIR/.env`.
- El bloque `env` de configuración en `~/.openclaw/openclaw.json`.
- La importación opcional del shell de inicio de sesión cuando `env.shellEnv.enabled` u `OPENCLAW_LOAD_SHELL_ENV=1` está habilitado.

Si antes almacenabas claves de proveedores solo en un `.env` del espacio de trabajo, muévelas a una de las fuentes de confianza anteriores. El `.env` del espacio de trabajo aún puede proporcionar variables ordinarias del proyecto que no sean credenciales, redirecciones de endpoints, sobrescrituras de host ni controles de runtime `OPENCLAW_*`.

Consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security#workspace-env-files) para ver la justificación de seguridad.

## Bloque `env` de configuración

Dos formas equivalentes de definir variables de entorno en línea (ambas sin sobrescribir):

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
se pasa a los proveedores como esa cadena exacta.

Para claves de proveedores respaldadas por archivos, usa un SecretRef en el campo de credencial que
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

Consulta [Gestión de secretos](/es/gateway/secrets) y la
[superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para ver
los campos admitidos.

## Importación de entorno del shell

`env.shellEnv` ejecuta tu shell de inicio de sesión e importa solo las claves esperadas **faltantes**:

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

Equivalentes de variables de entorno:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (predeterminado `15000`)

## Instantáneas de shell exec

En hosts Gateway que no son Windows, los comandos `exec` de bash y zsh usan una instantánea de inicio de forma predeterminada.
Define `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso Gateway para deshabilitar esta ruta.
Los valores `false`, `no` y `off` también la deshabilitan. Los valores `exec.env` por llamada no pueden activar ni desactivar
instantáneas ni redirigir la caché de instantáneas.

## Variables de entorno inyectadas por el runtime

OpenClaw también inyecta marcadores de contexto en los procesos secundarios que inicia:

- `OPENCLAW_SHELL=exec`: se define para comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp-client`: se define para `openclaw acp client` cuando inicia el proceso puente ACP.
- `OPENCLAW_SHELL=tui-local`: se define para comandos de shell `!` locales de la TUI.
- `OPENCLAW_CLI=1`: se define para procesos secundarios iniciados por el punto de entrada de la CLI.

Estos son marcadores de runtime (no configuración de usuario requerida). Pueden usarse en lógica de shell/perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la IU

- `OPENCLAW_THEME=light`: fuerza la paleta clara de la TUI cuando tu terminal tiene un fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de la TUI.
- `COLORFGBG`: si tu terminal la exporta, OpenClaw usa la pista de color de fondo para seleccionar automáticamente la paleta de la TUI.

## Sustitución de variables de entorno en la configuración

Puedes referenciar variables de entorno directamente en valores de cadena de configuración usando la sintaxis `${VAR_NAME}`:

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

Consulta [Configuración: sustitución de variables de entorno](/es/gateway/configuration-reference#env-var-substitution) para obtener todos los detalles.

## Referencias secretas frente a cadenas `${ENV}`

OpenClaw admite dos patrones basados en entorno:

- Sustitución de cadenas `${VAR}` en valores de configuración.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que admiten referencias a secretos.

Ambos se resuelven desde el entorno del proceso en el momento de la activación. Los detalles de SecretRef están documentados en [Gestión de secretos](/es/gateway/secrets).
El bloque `env` de configuración en sí no resuelve SecretRefs ni valores abreviados
`file:...`.

## Variables de entorno relacionadas con rutas

| Variable                 | Propósito                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sobrescribe el directorio de inicio usado para los valores predeterminados de rutas internas de OpenClaw (`~/.openclaw/`, directorios de agentes, sesiones, credenciales, onboarding del instalador y el checkout de desarrollo predeterminado). Útil cuando OpenClaw se ejecuta como usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`     | Sobrescribe el directorio de estado (predeterminado `~/.openclaw`).                                                                                                                                                               |
| `OPENCLAW_CONFIG_PATH`   | Sobrescribe la ruta del archivo de configuración (predeterminada `~/.openclaw/openclaw.json`).                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de rutas de directorios donde las directivas `$include` pueden resolver archivos fuera del directorio de configuración (predeterminado: ninguno; `$include` queda confinado al directorio de configuración). Con expansión de tilde. |

## Registro

| Variable                         | Propósito                                                                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sobrescribe el nivel de registro tanto para archivo como para consola (p. ej., `debug`, `trace`). Tiene precedencia sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran con una advertencia. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos dirigidos de temporización de solicitudes/respuestas del modelo en nivel `info` sin habilitar registros globales de depuración.                                                     |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos de payload del modelo: `summary`, `tools` o `full-redacted`. `full-redacted` está limitado y redactado, pero puede incluir texto de prompts/mensajes.                                    |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de streaming: `events` para temporización de inicio/finalización, `peek` para incluir los primeros cinco eventos SSE redactados.                                                         |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos de superficie de modelo de modo código, incluido ocultamiento de herramientas de proveedor y aplicación de solo exec/wait.                                                               |

### `OPENCLAW_HOME`

Cuando se define, `OPENCLAW_HOME` reemplaza el directorio de inicio del sistema (`$HOME` / `os.homedir()`) para los valores predeterminados de rutas internas de OpenClaw. Esto incluye el directorio de estado predeterminado, la ruta de configuración, los directorios de agentes, las credenciales, el espacio de trabajo de onboarding del instalador y el checkout de desarrollo predeterminado usado por `openclaw update --channel dev`.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback de inicio de Termux `PREFIX` en Android > `os.homedir()`

**Ejemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también puede definirse como una ruta con tilde (p. ej., `~/svc`), que se expande usando la misma cadena de fallback de inicio del SO antes de usarse.

Las variables de ruta explícitas como `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` y `OPENCLAW_GIT_DIR` siguen teniendo precedencia. Las tareas de cuenta del SO, como la detección de archivos de inicio del shell, la configuración del gestor de paquetes y la expansión de `~` del host, pueden seguir usando el inicio real del sistema.

## Usuarios de nvm: fallos TLS de web_fetch

Si Node.js se instaló mediante **nvm** (no el gestor de paquetes del sistema), el `fetch()` integrado usa
el almacén de CA incluido en nvm, al que pueden faltarle CA raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2, etc.). Esto hace que `web_fetch` falle con `"fetch failed"` en la mayoría de sitios HTTPS.

En Linux, OpenClaw detecta automáticamente nvm y aplica la corrección en el entorno de inicio real:

- `openclaw gateway install` escribe `NODE_EXTRA_CA_CERTS` en el entorno del servicio systemd
- el punto de entrada de la CLI `openclaw` se vuelve a ejecutar a sí mismo con `NODE_EXTRA_CA_CERTS` definido antes del inicio de Node

**Corrección manual (para versiones anteriores o lanzamientos directos con `node ...`):**

Exporta la variable antes de iniciar OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

No dependas de escribir solo en `~/.openclaw/.env` para esta variable; Node lee
`NODE_EXTRA_CA_CERTS` al inicio del proceso.

## Variables de entorno heredadas

OpenClaw solo lee variables de entorno `OPENCLAW_*`. Los prefijos heredados
`CLAWDBOT_*` y `MOLTBOT_*` de versiones anteriores se ignoran silenciosamente.

Si alguna sigue definida en el proceso Gateway al inicio, OpenClaw emite una
única advertencia de deprecación de Node (`OPENCLAW_LEGACY_ENV_VARS`) que enumera los
prefijos detectados y el recuento total. Cambia el nombre de cada valor reemplazando el
prefijo heredado por `OPENCLAW_` (por ejemplo, de `CLAWDBOT_GATEWAY_TOKEN` a
`OPENCLAW_GATEWAY_TOKEN`); los nombres antiguos no tienen efecto.

## Relacionado

- [Configuración del Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Descripción general de modelos](/es/concepts/models)
