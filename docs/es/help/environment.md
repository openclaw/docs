---
read_when:
    - Necesitas saber qué variables de entorno se cargan y en qué orden
    - Estás depurando claves de API faltantes en el Gateway
    - Estás documentando la autenticación de proveedores o los entornos de despliegue
summary: Dónde carga OpenClaw las variables de entorno y el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-04-30T05:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw carga variables de entorno desde varias fuentes. La regla es **nunca sobrescribir valores existentes**.

## Precedencia (mayor → menor)

1. **Entorno del proceso** (lo que el proceso Gateway ya tiene desde el shell o daemon padre).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe).
3. **`.env` global** en `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`; no sobrescribe).
4. **Bloque `env` de configuración** en `~/.openclaw/openclaw.json` (se aplica solo si falta).
5. **Importación opcional de login shell** (`env.shellEnv.enabled` u `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo para claves esperadas que faltan.

En instalaciones nuevas de Ubuntu que usan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como alternativa de compatibilidad después del `.env` global. Si ambos archivos existen y no coinciden, OpenClaw conserva `~/.openclaw/.env` e imprime una advertencia.

Si el archivo de configuración falta por completo, se omite el paso 4; la importación del shell se sigue ejecutando si está habilitada.

## Bloque `env` de configuración

Dos formas equivalentes de establecer variables de entorno en línea (ambas sin sobrescribir):

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

## Importación de variables de entorno del shell

`env.shellEnv` ejecuta tu login shell e importa solo las claves esperadas **faltantes**:

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
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variables de entorno inyectadas en tiempo de ejecución

OpenClaw también inyecta marcadores de contexto en procesos hijo iniciados:

- `OPENCLAW_SHELL=exec`: se establece para comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp`: se establece para inicios de procesos de backend en tiempo de ejecución de ACP (por ejemplo, `acpx`).
- `OPENCLAW_SHELL=acp-client`: se establece para `openclaw acp client` cuando inicia el proceso puente de ACP.
- `OPENCLAW_SHELL=tui-local`: se establece para comandos de shell locales de TUI `!`.

Estos son marcadores de tiempo de ejecución (no configuración de usuario obligatoria). Se pueden usar en la lógica del shell o del perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la UI

- `OPENCLAW_THEME=light`: fuerza la paleta clara de TUI cuando tu terminal tiene un fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de TUI.
- `COLORFGBG`: si tu terminal la exporta, OpenClaw usa la indicación de color de fondo para seleccionar automáticamente la paleta de TUI.

## Sustitución de variables de entorno en la configuración

Puedes hacer referencia a variables de entorno directamente en valores de cadena de configuración usando la sintaxis `${VAR_NAME}`:

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

## Referencias de secretos frente a cadenas `${ENV}`

OpenClaw admite dos patrones impulsados por variables de entorno:

- Sustitución de cadenas `${VAR}` en valores de configuración.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que admiten referencias a secretos.

Ambos se resuelven desde el entorno del proceso en el momento de la activación. Los detalles de SecretRef están documentados en [Gestión de secretos](/es/gateway/secrets).

## Variables de entorno relacionadas con rutas

| Variable               | Propósito                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Sobrescribe el directorio de inicio usado para toda la resolución de rutas interna (`~/.openclaw/`, directorios de agentes, sesiones, credenciales). Útil al ejecutar OpenClaw como usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`   | Sobrescribe el directorio de estado (valor predeterminado `~/.openclaw`).                                                                                                           |
| `OPENCLAW_CONFIG_PATH` | Sobrescribe la ruta del archivo de configuración (valor predeterminado `~/.openclaw/openclaw.json`).                                                                                 |

## Registro

| Variable             | Propósito                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Sobrescribe el nivel de registro tanto para archivo como para consola (p. ej., `debug`, `trace`). Tiene prioridad sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran con una advertencia. |

### `OPENCLAW_HOME`

Cuando se establece, `OPENCLAW_HOME` reemplaza el directorio de inicio del sistema (`$HOME` / `os.homedir()`) para toda la resolución de rutas interna. Esto permite aislamiento completo del sistema de archivos para cuentas de servicio sin interfaz.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Ejemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también puede establecerse en una ruta con tilde (p. ej., `~/svc`), que se expande usando `$HOME` antes de su uso.

## Usuarios de nvm: fallos de TLS en web_fetch

Si Node.js se instaló mediante **nvm** (no con el gestor de paquetes del sistema), el `fetch()` integrado usa
el almacén de CA incluido de nvm, al que pueden faltarle CA raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2, etc.). Esto hace que `web_fetch` falle con `"fetch failed"` en la mayoría de los sitios HTTPS.

En Linux, OpenClaw detecta automáticamente nvm y aplica la corrección en el entorno de inicio real:

- `openclaw gateway install` escribe `NODE_EXTRA_CA_CERTS` en el entorno del servicio systemd
- el punto de entrada de la CLI `openclaw` se vuelve a ejecutar a sí mismo con `NODE_EXTRA_CA_CERTS` establecido antes del inicio de Node

**Corrección manual (para versiones anteriores o lanzamientos directos con `node ...`):**

Exporta la variable antes de iniciar OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

No dependas de escribir esta variable solo en `~/.openclaw/.env`; Node lee
`NODE_EXTRA_CA_CERTS` al inicio del proceso.

## Variables de entorno heredadas

OpenClaw solo lee variables de entorno `OPENCLAW_*`. Los prefijos heredados
`CLAWDBOT_*` y `MOLTBOT_*` de versiones anteriores se ignoran silenciosamente.

Si alguna todavía está establecida en el proceso Gateway al inicio, OpenClaw emite una
única advertencia de obsolescencia de Node (`OPENCLAW_LEGACY_ENV_VARS`) que enumera los
prefijos detectados y el recuento total. Cambia el nombre de cada valor reemplazando el
prefijo heredado por `OPENCLAW_` (por ejemplo, `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); los nombres antiguos no tienen ningún efecto.

## Relacionado

- [Configuración de Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Resumen de modelos](/es/concepts/models)
