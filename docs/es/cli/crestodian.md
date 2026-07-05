---
read_when:
    - Ejecutas openclaw sin ningún comando después de la configuración y quieres entender Crestodian
    - Necesitas una forma segura sin configuración para inspeccionar o reparar OpenClaw
    - Estás diseñando o habilitando el modo de rescate del canal de mensajes
summary: Referencia de CLI y modelo de seguridad para Crestodian, el asistente de configuración y reparación seguro sin configuración
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T17:40:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da05f022b0fbff985b89a96e29ef5e987e97e017a5e40d50dfe0daf7eb03bf4f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian es el asistente local de configuración, reparación y ajustes de OpenClaw. Sigue estando disponible cuando la ruta normal del agente está rota: puede ejecutarse cuando falta `openclaw.json` o no es válido, el Gateway está caído, el registro de comandos del plugin no está disponible o aún no hay ningún agente configurado.

## Cuándo se inicia

Ejecutar `openclaw` sin subcomando enruta según el estado de la configuración:

- Falta la configuración, o existe sin ajustes creados por el usuario (vacía, o solo con claves `$schema`/`meta`): inicia la incorporación clásica.
- La configuración existe pero falla la validación: inicia Crestodian.
- La configuración existe y es válida: abre la TUI normal del agente (contra un Gateway configurado y accesible, o localmente si no hay ninguno accesible). Usa `/crestodian` dentro de la TUI, o ejecuta `openclaw crestodian` directamente, para acceder a Crestodian.

Ejecutar `openclaw crestodian` siempre inicia Crestodian explícitamente, sin importar el estado de la configuración. `openclaw --help` y `openclaw --version` conservan sus rutas rápidas normales.

`openclaw` sin subcomando en modo no interactivo (sin TTY) sale con un mensaje breve en lugar de imprimir la ayuda raíz: apunta a la incorporación no interactiva en una instalación nueva, a `openclaw crestodian --message "status"` cuando la configuración no es válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` inicia Crestodian como vista previa de la incorporación moderna. `openclaw onboard` sin más conserva la incorporación clásica.

## Qué muestra Crestodian

Crestodian interactivo abre el mismo shell de TUI que `openclaw tui`, con un backend de chat de Crestodian. El saludo inicial cubre:

- la validez de la configuración y el agente predeterminado
- el modelo o la ruta del planificador determinista que está usando Crestodian
- la accesibilidad del Gateway desde la primera prueba de inicio
- la siguiente acción de depuración recomendada

No vuelca secretos ni carga comandos de CLI de plugins solo para iniciar.

Usa `status` para ver el inventario detallado: ruta de configuración, rutas de documentación/fuente, pruebas locales de CLI, presencia de claves de API, agentes, modelo y detalles del Gateway.

Crestodian usa el mismo descubrimiento de referencias que los agentes normales: en un checkout de Git apunta a `docs/` local y al árbol de código fuente; en una instalación npm usa la documentación incluida y enlaza a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con orientación para revisar el código fuente cuando la documentación no sea suficiente.

## Ejemplos

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Dentro de la TUI de Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operaciones y aprobación

Crestodian usa operaciones tipadas en lugar de editar la configuración de forma ad hoc.

Solo lectura, se ejecutan de inmediato: mostrar resumen, listar agentes, listar plugins instalados, buscar plugins de ClawHub, mostrar estado del modelo/backend, ejecutar comprobaciones de estado/salud, comprobar la accesibilidad del Gateway, ejecutar doctor sin correcciones interactivas, validar configuración, mostrar la ruta del registro de auditoría.

Persistentes, requieren aprobación conversacional (o `--yes` para un comando directo): escribir configuración, `config set`, `config set-ref`, arranque de configuración/incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes, instalar o desinstalar plugins, ejecutar reparaciones de doctor que reescriben configuración o estado.

Las escrituras aplicadas se registran en `~/.openclaw/audit/crestodian.jsonl`. El descubrimiento no se audita; solo las operaciones y escrituras aplicadas.

La configuración de canales puede ejecutarse como una conversación alojada cuando el host admite entrada enmascarada. La TUI local de Crestodian no acepta respuestas sensibles del asistente de configuración; en su lugar, te dirige a `openclaw channels add --channel <channel>`, cuyos prompts interactivos enmascaran las credenciales.

## Arranque de configuración

`setup` es el arranque de incorporación con chat como vía principal. Escribe solo mediante operaciones de configuración tipadas y primero pide aprobación.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Cuando no hay ningún modelo configurado, setup elige el primer backend utilizable en este orden y te indica cuál eligió:

1. Modelo explícito existente, si ya está configurado.
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. CLI de Claude Code -> `claude-cli/claude-opus-4-8`
5. Codex -> `openai/gpt-5.5` mediante el arnés del servidor de aplicaciones de Codex
6. CLI de Gemini -> `google-gemini-cli/gemini-3.1-pro-preview`

Si ninguno está disponible, la configuración igualmente escribe el espacio de trabajo predeterminado y deja el modelo sin establecer. Instala o inicia sesión en Codex/Claude Code/CLI de Gemini, o expón `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, y luego vuelve a ejecutar la configuración.

La aplicación de macOS usa la misma escala mediante los métodos de Gateway `crestodian.setup.detect` y `crestodian.setup.activate`: detect enumera cada backend reutilizable que encuentra, activate prueba en vivo un candidato (una finalización real de "responder con OK") y solo persiste el modelo, el espacio de trabajo y los valores predeterminados de Gateway después de que la prueba se aprueba. Un candidato fallido nunca cambia la configuración; la aplicación baja automáticamente por la escala y finalmente ofrece un paso manual de clave de API (Anthropic, OpenAI o Google) que se verifica de la misma forma antes de guardarse.

## Planificador asistido por modelo

Crestodian interactivo da prioridad a la IA. Los comandos escritos exactos se ejecutan al instante y de forma determinista. Cualquier otro mensaje pasa por el mismo bucle de agente integrado que los agentes normales de OpenClaw, restringido a una herramienta `crestodian` de anillo cero que envuelve las operaciones escritas: las acciones de lectura se ejecutan libremente, las mutaciones requieren tu sí conversacional para esa operación exacta, y cada escritura aplicada se audita y se vuelve a validar. La sesión del agente persiste, por lo que el custodio tiene memoria real de varios turnos. Primero usa el modelo de OpenClaw configurado; sin un modelo utilizable, recurre a un runtime local ya presente en la máquina:

- CLI de Claude Code: `claude-cli/claude-opus-4-8` (bucle de agente; la herramienta de anillo cero se sirve mediante MCP, consulta el modelo de confianza más abajo)
- Arnés del servidor de aplicaciones de Codex: `openai/gpt-5.5` (bucle de agente con una lista de permitidos forzada de una sola herramienta)

Cuando el bucle de agente no está disponible, Crestodian se degrada a un planificador acotado de un solo turno y, sin ningún modelo, a comandos escritos deterministas. El planificador no puede mutar la configuración directamente; debe traducir la solicitud a uno de los comandos escritos de Crestodian, y se aplican las reglas normales de aprobación/auditoría. Crestodian imprime el modelo que usó y el comando interpretado antes de ejecutar cualquier cosa. Los turnos del planificador de reserva son temporales, tienen las herramientas deshabilitadas donde el runtime lo admite y usan un espacio de trabajo/sesión temporal.

El modo de rescate por canal de mensajes nunca usa el planificador asistido por modelo. El rescate remoto se mantiene determinista para que una ruta de agente normal rota o comprometida no pueda usarse como editor de configuración.

### Modelo de confianza del arnés de CLI

Los runtimes integrados y el arnés del servidor de aplicaciones de Codex aplican directamente la restricción de anillo cero: la ejecución lleva una lista de herramientas permitidas que contiene solo la herramienta `crestodian`. Los arneses de CLI (Claude Code, CLI de Gemini) no pueden aplicar una lista de herramientas permitidas de OpenClaw: la CLI controla sus herramientas nativas y su propia política de permisos, por lo que OpenClaw falla en modo cerrado si se le pide restringir una. Para los modelos con arnés de CLI, Crestodian en cambio:

- inyecta un servidor MCP dedicado que sirve solo la herramienta `crestodian` y reemplaza la superficie normal de herramientas MCP de OpenClaw para la ejecución (para Claude Code, la configuración generada se aplica con `--strict-mcp-config`, por lo que no se carga ningún otro servidor MCP),
- mantiene cada mutación de configuración dentro del contrato de aprobación y auditoría de la herramienta: las lecturas se ejecutan libremente, las escrituras requieren tu sí conversacional y cada escritura aplicada se audita y se vuelve a validar,
- deja las herramientas nativas (lecturas de archivos, shell) al arnés. Siguen la misma postura de permisos que las ejecuciones normales de agentes de OpenClaw en esta máquina: con la configuración predeterminada de exec de OpenClaw, Claude Code se ejecuta con los permisos omitidos, y una configuración `tools.exec` restringida recurre a la propia política de permisos de la CLI.

Solo las sesiones de Crestodian reciben el servidor MCP de crestodian; las ejecuciones normales de agentes nunca ven esta herramienta. Trata una sesión de Crestodian en un modelo con arnés de CLI como una ejecución normal de agente local en el mismo host: la herramienta de anillo cero añade una ruta auditada y con aprobación para reparar la configuración, pero no impide que las herramientas nativas del arnés toquen archivos directamente. La reserva del servidor de aplicaciones de Codex y los modelos con clave de API aplican el bucle estricto de una sola herramienta; preférelos cuando quieras la restricción estricta.

## Cambiar a un agente

Usa un selector de lenguaje natural para salir de Crestodian y abrir la TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` abren directamente la TUI normal del agente; no inician Crestodian. Después de cambiar a la TUI normal, `/crestodian` vuelve a Crestodian, opcionalmente con una solicitud de seguimiento:

```text
/crestodian
/crestodian restart gateway
```

## Modo de rescate por mensajes

El modo de rescate por mensajes es el punto de entrada de canal de mensajes para Crestodian: úsalo cuando tu agente normal esté inactivo, pero un canal de confianza (por ejemplo WhatsApp) todavía reciba comandos.

Comando admitido: `/crestodian <request>`.

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

La creación de agentes también puede ponerse en cola localmente o mediante rescate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

El rescate remoto es una superficie administrativa y debe tratarse como reparación remota de configuración, no como chat normal.

Contrato de seguridad para el rescate remoto:

- Deshabilitado cuando el sandboxing está activo para el agente/sesión; Crestodian rechaza el rescate remoto y apunta a la reparación por CLI local.
- El estado efectivo predeterminado es `auto`: permitir el rescate remoto solo en operación YOLO de confianza, donde el runtime ya tiene autoridad local sin sandbox (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` se resuelve como `off`, con modo sandbox `off`).
- Requiere una identidad de propietario explícita; sin reglas de remitente comodín, política de grupo abierto, webhooks no autenticados ni canales anónimos.
- Solo DM de propietario de forma predeterminada; el rescate en grupos/canales requiere adhesión explícita.
- La búsqueda y el listado de Plugin son de solo lectura. La instalación de Plugin siempre es solo local (bloqueada en rescate, incluso cuando está habilitada de otra forma) porque descarga código ejecutable. La desinstalación de Plugin puede aprobarse como una operación de rescate persistente.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión de agente interactiva; usa `openclaw` local para transferir al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en modo de rescate.
- Cada operación de rescate aplicada se audita. El rescate por canal de mensajes registra metadatos de canal, cuenta, remitente y dirección de origen; las operaciones que mutan la configuración también registran hashes de configuración antes y después.
- Los secretos nunca se repiten. La inspección de SecretRef informa la disponibilidad, no los valores.
- Si el Gateway está activo, el rescate prefiere operaciones escritas de Gateway; si está inactivo, el rescate usa solo la superficie mínima de reparación local que no depende del bucle normal del agente.

Forma de configuración:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (predeterminado) permite el rescate solo cuando el runtime efectivo es YOLO y el aislamiento está desactivado; `false` nunca permite el rescate por canal de mensajes; `true` permite explícitamente el rescate cuando las comprobaciones de propietario/canal se superan (todavía sujeto a la denegación por aislamiento).
- `ownerDmOnly`: restringe el rescate a mensajes directos del propietario. Predeterminado `true`.
- `pendingTtlMinutes`: cuánto tiempo una escritura de rescate pendiente permanece abierta para la aprobación de `/crestodian yes` antes de caducar. Predeterminado `15`.

El rescate remoto está cubierto por el carril Docker:

```bash
pnpm test:docker:crestodian-rescue
```

La alternativa local del planificador sin configuración está cubierta por:

```bash
pnpm test:docker:crestodian-planner
```

Una prueba de humo opcional de superficie de comandos de canal en vivo comprueba `/crestodian status` además de un ciclo completo de aprobación persistente a través del manejador de rescate:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuración sin archivo de configuración mediante comandos explícitos de Crestodian está cubierta por:

```bash
pnpm test:docker:crestodian-first-run
```

Ese carril comienza con un directorio de estado vacío, verifica el punto de entrada moderno de incorporación de Crestodian, establece el modelo predeterminado, crea un agente adicional, configura Discord mediante la activación de un plugin más token SecretRef, valida la configuración y comprueba el registro de auditoría. QA Lab tiene un escenario respaldado por el repositorio para el mismo flujo Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Sandbox](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
