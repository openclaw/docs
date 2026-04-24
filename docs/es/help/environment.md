---
read_when:
    - Necesitas saber qué variables de entorno se cargan y en qué orden
    - Estás depurando claves API faltantes en el Gateway
    - Estás documentando autenticación de proveedores o entornos de despliegue
summary: Dónde carga OpenClaw las variables de entorno y el orden de precedencia
title: Variables de entorno
x-i18n:
    generated_at: "2026-04-24T05:31:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw obtiene variables de entorno de varias fuentes. La regla es **nunca sobrescribir valores existentes**.

## Precedencia (de mayor a menor)

1. **Entorno del proceso** (lo que el proceso del Gateway ya tiene desde la shell/daemon padre).
2. **`.env` en el directorio de trabajo actual** (valor predeterminado de dotenv; no sobrescribe).
3. **`.env` global** en `~/.openclaw/.env` (también `$OPENCLAW_STATE_DIR/.env`; no sobrescribe).
4. **Bloque `env` de configuración** en `~/.openclaw/openclaw.json` (se aplica solo si falta).
5. **Importación opcional del shell de login** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada solo a claves esperadas que falten.

En instalaciones nuevas de Ubuntu que usan el directorio de estado predeterminado, OpenClaw también trata `~/.config/openclaw/gateway.env` como alternativa de compatibilidad después del `.env` global. Si ambos archivos existen y discrepan, OpenClaw conserva `~/.openclaw/.env` e imprime una advertencia.

Si el archivo de configuración falta por completo, se omite el paso 4; la importación del shell sigue ejecutándose si está habilitada.

## Bloque `env` de configuración

Dos formas equivalentes de establecer variables de entorno inline (ambas sin sobrescritura):

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

## Importación del entorno de shell

`env.shellEnv` ejecuta tu shell de login e importa solo las claves esperadas que **falten**:

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

Equivalentes en variables de entorno:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variables de entorno inyectadas en tiempo de ejecución

OpenClaw también inyecta marcadores de contexto en los procesos hijo generados:

- `OPENCLAW_SHELL=exec`: se establece para comandos ejecutados mediante la herramienta `exec`.
- `OPENCLAW_SHELL=acp`: se establece para los procesos generados por el backend de tiempo de ejecución ACP (por ejemplo `acpx`).
- `OPENCLAW_SHELL=acp-client`: se establece para `openclaw acp client` cuando genera el proceso puente ACP.
- `OPENCLAW_SHELL=tui-local`: se establece para comandos shell `!` locales de la TUI.

Estos son marcadores de tiempo de ejecución (no configuración de usuario requerida). Se pueden usar en la lógica de shell/perfil
para aplicar reglas específicas del contexto.

## Variables de entorno de la IU

- `OPENCLAW_THEME=light`: fuerza la paleta clara de la TUI cuando tu terminal tiene fondo claro.
- `OPENCLAW_THEME=dark`: fuerza la paleta oscura de la TUI.
- `COLORFGBG`: si tu terminal la exporta, OpenClaw usa la pista del color de fondo para elegir automáticamente la paleta de la TUI.

## Sustitución de variables de entorno en la configuración

Puedes hacer referencia directamente a variables de entorno en valores de cadena de la configuración usando la sintaxis `${VAR_NAME}`:

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

## Referencias de secretos frente a cadenas `${ENV}`

OpenClaw admite dos patrones basados en variables de entorno:

- Sustitución de cadenas `${VAR}` en valores de configuración.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que admiten referencias a secretos.

Ambos se resuelven desde el entorno del proceso en el momento de la activación. Los detalles de SecretRef están documentados en [Gestión de secretos](/es/gateway/secrets).

## Variables de entorno relacionadas con rutas

| Variable               | Finalidad                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`        | Sobrescribe el directorio home usado para toda la resolución interna de rutas (`~/.openclaw/`, directorios de agentes, sesiones, credenciales). Útil al ejecutar OpenClaw como usuario de servicio dedicado. |
| `OPENCLAW_STATE_DIR`   | Sobrescribe el directorio de estado (predeterminado `~/.openclaw`).                                                                                                           |
| `OPENCLAW_CONFIG_PATH` | Sobrescribe la ruta del archivo de configuración (predeterminada `~/.openclaw/openclaw.json`).                                                                                |

## Registro

| Variable             | Finalidad                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Sobrescribe el nivel de registro tanto para archivo como para consola (por ejemplo `debug`, `trace`). Tiene prioridad sobre `logging.level` y `logging.consoleLevel` en la configuración. Los valores no válidos se ignoran con una advertencia. |

### `OPENCLAW_HOME`

Cuando está definida, `OPENCLAW_HOME` reemplaza el directorio home del sistema (`$HOME` / `os.homedir()`) para toda la resolución interna de rutas. Esto permite un aislamiento completo del sistema de archivos para cuentas de servicio sin interfaz.

**Precedencia:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Ejemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` también puede definirse como una ruta con tilde (por ejemplo `~/svc`), que se expande usando `$HOME` antes de su uso.

## Usuarios de nvm: fallos TLS de web_fetch

Si Node.js se instaló mediante **nvm** (no con el gestor de paquetes del sistema), el `fetch()` integrado usa
el almacén CA incluido con nvm, que puede carecer de CAs raíz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2, etc.). Esto hace que `web_fetch` falle con `"fetch failed"` en la mayoría de sitios HTTPS.

En Linux, OpenClaw detecta automáticamente nvm y aplica la corrección en el entorno real de inicio:

- `openclaw gateway install` escribe `NODE_EXTRA_CA_CERTS` en el entorno del servicio systemd
- el punto de entrada de la CLI `openclaw` se vuelve a ejecutar a sí mismo con `NODE_EXTRA_CA_CERTS` establecido antes del inicio de Node

**Corrección manual (para versiones antiguas o lanzamientos directos `node ...`):**

Exporta la variable antes de iniciar OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

No confíes en escribir solo en `~/.openclaw/.env` para esta variable; Node lee
`NODE_EXTRA_CA_CERTS` al inicio del proceso.

## Relacionado

- [Configuración del Gateway](/es/gateway/configuration)
- [Preguntas frecuentes: variables de entorno y carga de .env](/es/help/faq#env-vars-and-env-loading)
- [Resumen de modelos](/es/concepts/models)
