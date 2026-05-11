---
read_when:
    - Debe saber qué variables de entorno se cargan y en qué orden
    - Está depurando claves de API faltantes en el Gateway
    - Estás documentando la autenticación del proveedor o los entornos de implementación
summary: Dónde carga OpenClaw las variables de entorno y el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-05-11T20:38:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw obtiene variables de entorno de varias fuentes. La regla es **no sobrescribir nunca los valores existentes**.

## Precedencia (de mayor → menor)

1. **Entorno del proceso** (lo que el proceso del Gateway ya tiene desde el shell/daemon padre).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe).
3. **`.env` global** en `~/.openclaw/.env` (también `$OPENCLAW_STATE_DIR/.env`; no sobrescribe).
4. **Bloque `env` de configuración** en `~/.openclaw/openclaw.json` (se aplica solo si falta).
5. **Importación opcional del shell de inicio de sesión** (`env.shellEnv.enabled` u `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo para claves esperadas que falten.

En instalaciones nuevas de Ubuntu que usan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como una reserva de compatibilidad después del `.env` global. Si ambos archivos existen y no coinciden, OpenClaw conserva `~/.openclaw/.env` e imprime una advertencia.

Si falta por completo el archivo de configuración, se omite el paso 4; la importación del shell sigue ejecutándose si está habilitada.

## Bloque `env` de configuración

Dos formas equivalentes de definir variables de entorno en línea (ambas no sobrescriben):

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

## Importación del entorno del shell

`env.shellEnv` ejecuta tu shell de inicio de sesión e importa solo las claves esperadas que **faltan**:

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

Equivalentes con variables de entorno:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variables de entorno inyectadas en tiempo de ejecución

OpenClaw también inyecta marcadores de contexto en procesos secundarios generados:

- `OPENCLAW_SHELL=exec`: se define para comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp`: se define para procesos generados por el backend de tiempo de ejecución ACP (por ejemplo, `acpx`).
- `OPENCLAW_SHELL=acp-client`: se define para `openclaw acp client` cuando genera el proceso puente ACP.
- `OPENCLAW_SHELL=tui-local`: se define para comandos de shell locales `!` de la TUI.

Estos son marcadores de tiempo de ejecución (no configuración de usuario obligatoria). Pueden usarse en lógica de shell/perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la UI

- `OPENCLAW_THEME=light`: fuerza la paleta clara de la TUI cuando tu terminal tiene un fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de la TUI.
- `COLORFGBG`: si tu terminal la exporta, OpenClaw usa la pista del color de fondo para elegir automáticamente la paleta de la TUI.

## Sustitución de variables de entorno en la configuración

Puedes hacer referencia a variables de entorno directamente en valores de cadena de la configuración mediante la sintaxis `${VAR_NAME}`:

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

Consulta [Configuración: sustitución de variables de entorno](/es/gateway/configuration-reference#env-var-substitution) para ver todos los detalles.

## Referencias secretas frente a cadenas `${ENV}`

OpenClaw admite dos patrones impulsados por variables de entorno:

- Sustitución de cadenas `${VAR}` en valores de configuración.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que admiten referencias a secretos.

Ambos se resuelven desde el entorno del proceso en el momento de la activación. Los detalles de SecretRef están documentados en [Gestión de secretos](/es/gateway/secrets).

## Variables de entorno relacionadas con rutas

| Variable                 | Propósito                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sobrescribe el directorio de inicio usado para toda la resolución interna de rutas (`~/.openclaw/`, directorios de agentes, sesiones, credenciales). Útil al ejecutar OpenClaw como usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`     | Sobrescribe el directorio de estado (predeterminado `~/.openclaw`).                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Sobrescribe la ruta del archivo de configuración (predeterminado `~/.openclaw/openclaw.json`).                                                                                        |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de rutas de directorios donde las directivas `$include` pueden resolver archivos fuera del directorio de configuración (predeterminado: ninguno — `$include` queda confinado al directorio de configuración). Se expande la tilde. |

## Registro

| Variable                         | Propósito                                                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sobrescribe el nivel de registro tanto para archivo como para consola (p. ej., `debug`, `trace`). Tiene precedencia sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran con una advertencia. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos dirigidos de temporización de solicitud/respuesta del modelo en el nivel `info` sin habilitar registros de depuración globales.                                               |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos de carga útil del modelo: `summary`, `tools` o `full-redacted`. `full-redacted` está limitado y redactado, pero puede incluir texto de prompts/mensajes.                         |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de streaming: `events` para la temporización de inicio/finalización, `peek` para incluir los primeros cinco eventos SSE redactados.                                                |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos de superficie de modelo en modo código, incluida la ocultación de herramientas del proveedor y la aplicación de solo exec/wait.                                                     |

### `OPENCLAW_HOME`

Cuando se define, `OPENCLAW_HOME` reemplaza el directorio de inicio del sistema (`$HOME` / `os.homedir()`) para toda la resolución interna de rutas. Esto habilita aislamiento completo del sistema de archivos para cuentas de servicio sin interfaz.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Ejemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también puede definirse como una ruta con tilde (p. ej., `~/svc`), que se expande usando `$HOME` antes de su uso.

## Usuarios de nvm: fallos de TLS en web_fetch

Si Node.js se instaló mediante **nvm** (no con el gestor de paquetes del sistema), el `fetch()` integrado usa
el almacén de CA incluido con nvm, al que pueden faltarle CA raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2, etc.). Esto hace que `web_fetch` falle con `"fetch failed"` en la mayoría de los sitios HTTPS.

En Linux, OpenClaw detecta automáticamente nvm y aplica la corrección en el entorno real de inicio:

- `openclaw gateway install` escribe `NODE_EXTRA_CA_CERTS` en el entorno del servicio systemd
- el punto de entrada de la CLI `openclaw` se vuelve a ejecutar a sí mismo con `NODE_EXTRA_CA_CERTS` definido antes del inicio de Node

**Corrección manual (para versiones anteriores o lanzamientos directos con `node ...`):**

Exporta la variable antes de iniciar OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

No confíes en escribir solo en `~/.openclaw/.env` para esta variable; Node lee
`NODE_EXTRA_CA_CERTS` al inicio del proceso.

## Variables de entorno heredadas

OpenClaw solo lee variables de entorno `OPENCLAW_*`. Los prefijos heredados
`CLAWDBOT_*` y `MOLTBOT_*` de versiones anteriores se ignoran silenciosamente.

Si alguna todavía está definida en el proceso del Gateway al inicio, OpenClaw emite una
única advertencia de obsolescencia de Node (`OPENCLAW_LEGACY_ENV_VARS`) que enumera los
prefijos detectados y el recuento total. Cambia el nombre de cada valor reemplazando el
prefijo heredado por `OPENCLAW_` (por ejemplo, `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); los nombres antiguos no tienen efecto.

## Relacionado

- [Configuración del Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Resumen de modelos](/es/concepts/models)
