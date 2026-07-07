---
read_when:
    - Ejecutas openclaw sin ningún comando después de la configuración y quieres entender Crestodian
    - Necesitas una forma segura sin configuración de inspeccionar o reparar OpenClaw
    - Estás diseñando o habilitando el modo de rescate del canal de mensajes
summary: Referencia de CLI y modelo de seguridad para Crestodian, el asistente de configuración y reparación seguro sin configuración
title: Crestodian
x-i18n:
    generated_at: "2026-07-06T21:48:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3431623efcecd920bb9977192b65539083a3fd7aed115747b23408f037cd973d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian es el asistente local de OpenClaw para configuración, reparación y ajustes. Permanece accesible cuando la ruta normal del agente está rota: puede ejecutarse cuando falta `openclaw.json` o no es válido, el Gateway está inactivo, el registro de comandos de plugins no está disponible o todavía no hay ningún agente configurado.

## Cuándo se inicia

Ejecutar `openclaw` sin subcomando enruta según el estado de la configuración:

- Falta la configuración, o existe sin ajustes definidos por el usuario (vacía, o solo con las claves `$schema`/`meta`): inicia la incorporación clásica.
- La configuración existe pero no supera la validación: inicia Crestodian.
- La configuración existe y es válida: abre la TUI normal del agente (contra un Gateway configurado y accesible, o localmente si no hay ninguno accesible). Usa `/crestodian` dentro de la TUI, o ejecuta `openclaw crestodian` directamente, para llegar a Crestodian.

Ejecutar `openclaw crestodian` siempre inicia Crestodian explícitamente, independientemente del estado de la configuración. `openclaw --help` y `openclaw --version` conservan sus rutas rápidas normales.

`openclaw` sin argumentos en modo no interactivo (sin TTY) sale con un mensaje breve en lugar de imprimir la ayuda raíz: apunta a la incorporación no interactiva en una instalación nueva, a `openclaw crestodian --message "status"` cuando la configuración no es válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` inicia Crestodian como la vista previa de incorporación moderna. `openclaw onboard` sin más conserva la incorporación clásica.

## Qué muestra Crestodian

Crestodian interactivo abre el mismo shell de TUI que `openclaw tui`, con un backend de chat de Crestodian. El saludo inicial cubre:

- la validez de la configuración y el agente predeterminado
- el modelo o la ruta del planificador determinista que Crestodian está usando
- la accesibilidad del Gateway desde la primera sonda de arranque
- la siguiente acción de depuración recomendada

No vuelca secretos ni carga comandos CLI de plugins solo para iniciar.

Usa `status` para el inventario detallado: ruta de configuración, rutas de documentación/código fuente, sondas de CLI locales, presencia de claves/tokens, agentes, modelo y detalles del Gateway.

Crestodian usa el mismo descubrimiento de referencias que los agentes normales: en un checkout de Git apunta a `docs/` local y al árbol de código fuente; en una instalación npm usa documentación incluida y enlaza a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con orientación para revisar el código fuente cuando la documentación no sea suficiente.

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

Crestodian usa operaciones tipadas en lugar de editar la configuración ad hoc.

Solo lectura, se ejecutan inmediatamente: mostrar resumen, listar agentes, listar plugins instalados, buscar plugins de ClawHub, mostrar estado de modelo/backend, ejecutar comprobaciones de estado/salud, comprobar accesibilidad del Gateway, ejecutar doctor sin reparaciones interactivas, validar configuración, mostrar la ruta del registro de auditoría. Iniciar la configuración guiada de canales (`connect telegram`) también se ejecuta inmediatamente: el asistente recopila respuestas explícitas y confirma solo al final.

Persistentes, requieren aprobación conversacional (o `--yes` para un comando directo): escribir configuración, `config set`, `config set-ref`, bootstrap de setup/incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes, instalar o desinstalar plugins, ejecutar reparaciones de doctor que reescriben configuración o estado.

La aprobación se da con tus propias palabras: las respuestas inequívocas ("yes", "sure", "go ahead", "not now") se resuelven desde una lista determinista cerrada, y cualquier otra cosa la evalúa una llamada separada a un modelo ejecutado por el host que solo ve tu mensaje y la propuesta pendiente, nunca el propio modelo de conversación, que no puede autoaprobarse. Las respuestas ambiguas mantienen la propuesta pendiente y la conversación vuelve a preguntar. Cuando no hay ningún modelo usable, solo aplica la lista determinista cerrada.

Las escrituras aplicadas se registran en `~/.openclaw/audit/crestodian.jsonl`. El descubrimiento no se audita; solo se auditan las operaciones y escrituras aplicadas.

La configuración de canales puede ejecutarse como una conversación alojada cuando el host admite entrada enmascarada. La TUI local de Crestodian no acepta respuestas sensibles del asistente; en su lugar te dirige a `openclaw channels add --channel <channel>`, cuyos prompts interactivos enmascaran las credenciales.

## Bootstrap de setup

`setup` es el bootstrap de incorporación con chat primero. Escribe solo mediante operaciones de configuración tipadas y pide aprobación primero.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Cuando no hay ningún modelo configurado, setup elige el primer backend usable en este orden y te indica cuál eligió:

1. Modelo explícito existente, si ya está configurado.
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> `openai/gpt-5.5` mediante el arnés app-server de Codex
6. Gemini CLI -> `google-gemini-cli/gemini-3.1-pro-preview`

Si no hay ninguno disponible, setup aún escribe el espacio de trabajo predeterminado y deja el modelo sin establecer. Instala o inicia sesión en Codex/Claude Code/Gemini CLI, o expón `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, y luego vuelve a ejecutar setup.

La app de macOS recorre la misma escala mediante los métodos de gateway `crestodian.setup.detect` y `crestodian.setup.activate`: detect enumera todos los backends reutilizables que encuentra, activate prueba en vivo un candidato (una finalización real de "reply with OK") y solo persiste el modelo, el espacio de trabajo y los valores predeterminados del gateway después de que la prueba pasa. Un candidato fallido nunca cambia la configuración; la app avanza automáticamente por la escala y finalmente ofrece un paso manual de clave/token poblado desde los plugins proveedores activos de inferencia de texto del Gateway. El proveedor seleccionado posee su modelo inicial y su configuración, y la credencial se verifica de la misma forma antes de guardarse.

## Conversación de IA

Crestodian interactivo es solo IA: cada mensaje, incluidos los que parecen comandos escritos, se ejecuta por el mismo bucle de agente integrado que los agentes normales de OpenClaw, restringido a una única herramienta de ring-zero `crestodian` que encapsula las operaciones tipadas. Las acciones de lectura se ejecutan libremente, las mutaciones requieren tu aprobación conversacional para esa operación exacta (consulta Operaciones y aprobación), y cada escritura aplicada se audita y vuelve a validarse. La sesión del agente persiste, así que el custodio tiene memoria real de varios turnos. Primero usa el modelo de OpenClaw configurado; sin un modelo usable, recurre a un runtime local ya presente en la máquina, en el orden de la escala de setup:

- Claude Code CLI: `claude-cli/claude-opus-4-8` (bucle de agente; la herramienta ring-zero se sirve por MCP, consulta el modelo de confianza más abajo)
- Arnés app-server de Codex: `openai/gpt-5.5` (bucle de agente con una lista de permitidos de una sola herramienta impuesta)
- Gemini CLI: `google-gemini-cli/gemini-3.1-pro-preview` (bucle de agente; herramienta ring-zero por MCP)

Cuando el bucle de agente no está disponible, Crestodian se degrada a un planificador acotado de un solo turno, y solo sin ningún modelo usable a comandos tipados deterministas. El planificador no puede mutar la configuración directamente; debe traducir la solicitud a uno de los comandos tipados de Crestodian, y aplican las reglas normales de aprobación/auditoría. Crestodian imprime el modelo que usó y el comando interpretado antes de ejecutar nada. Los turnos del planificador de respaldo son temporales, sin herramientas donde el runtime lo admite, y usan un espacio de trabajo/sesión temporal.

La gramática de comandos tipados está anclada: un mensaje coincide exactamente con un comando o es conversación. Las preguntas y la formulación natural ("why did my gateway stop?") nunca disparan operaciones: las responde la IA.

Una excepción de higiene de secretos: un `config set` exacto en una ruta sensible (tokens, claves, contraseñas) nunca llega a un modelo. Se ejecuta en la ruta determinista con una propuesta redactada, y el valor se enmascara en el historial visible para la IA. Prefiere `config set-ref <path> env <ENV_VAR>` para secretos.

El modo de rescate de canales de mensajes nunca usa el planificador asistido por modelo. El rescate remoto sigue siendo determinista para que una ruta normal de agente rota o comprometida no pueda usarse como editor de configuración.

### Modelo de confianza del arnés CLI

Los runtimes integrados y el arnés app-server de Codex imponen directamente la restricción ring-zero: la ejecución lleva una lista de herramientas permitidas con solo la herramienta `crestodian`. Los arneses CLI (Claude Code, Gemini CLI) no pueden imponer una lista de herramientas permitidas de OpenClaw: la CLI posee sus herramientas nativas y su propia política de permisos, por lo que OpenClaw falla cerrado si se le pide restringir una. Para modelos de arnés CLI, Crestodian en su lugar:

- inyecta un servidor MCP dedicado que sirve solo la herramienta `crestodian` y reemplaza la superficie normal de herramientas MCP de OpenClaw para la ejecución (para Claude Code, la configuración generada se aplica con `--strict-mcp-config`, por lo que no se cargan otros servidores MCP),
- mantiene cada mutación de configuración dentro del contrato de aprobación y auditoría de la herramienta: las lecturas se ejecutan libremente, las escrituras requieren tu sí conversacional, y cada escritura aplicada se audita y vuelve a validarse,
- deja las herramientas nativas (lecturas de archivos, shell) al arnés. Siguen la misma postura de permisos que las ejecuciones normales de agentes de OpenClaw en esta máquina: con la configuración exec predeterminada de OpenClaw, Claude Code se ejecuta con permisos omitidos, y una configuración `tools.exec` restringida recurre a la política de permisos propia de la CLI.

Solo las sesiones de Crestodian reciben el servidor MCP de crestodian; las ejecuciones normales de agentes nunca ven esta herramienta. Trata una sesión de Crestodian en un modelo de arnés CLI como una ejecución normal de agente local en el mismo host: la herramienta ring-zero añade una ruta auditada y con aprobación para reparar configuración, pero no impide que las herramientas nativas del arnés toquen archivos directamente. El respaldo app-server de Codex y los modelos con clave de API imponen el bucle estricto de una sola herramienta; prefiérelos cuando quieras la restricción fuerte.

## Cambiar a un agente

Usa un selector en lenguaje natural para salir de Crestodian y abrir la TUI normal:

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

## Modo de rescate de mensajes

El modo de rescate de mensajes es el punto de entrada de canales de mensajes para Crestodian: úsalo cuando tu agente normal esté muerto pero un canal de confianza (por ejemplo WhatsApp) aún recibe comandos.

Comando admitido: `/crestodian <request>`. Rescue acepta solo la gramática exacta de comandos tipados: el lenguaje natural se rechaza con una pista, nunca se adivina como una operación, y nunca se consulta ningún modelo.

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

La creación de agentes también puede ponerse en cola localmente o mediante rescue:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

El rescate remoto es una superficie de administración y debe tratarse como reparación remota de configuración, no como chat normal.

Contrato de seguridad para el rescate remoto:

- Deshabilitado cuando el aislamiento está activo para el agente/sesión; Crestodian rechaza el rescate remoto y apunta a la reparación con la CLI local.
- El estado efectivo predeterminado es `auto`: permitir el rescate remoto solo en operación YOLO de confianza, donde el runtime ya tiene autoridad local sin aislamiento (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` se resuelve como `off`, con el modo de aislamiento `off`).
- Requiere una identidad de propietario explícita; no se permiten reglas de remitente comodín, políticas de grupo abierto, webhooks no autenticados ni canales anónimos.
- De forma predeterminada, solo DMs del propietario; el rescate en grupos/canales requiere consentimiento explícito.
- La búsqueda y la lista de Plugin son de solo lectura. La instalación de Plugin siempre es solo local (bloqueada en rescate, incluso cuando está habilitada de otro modo) porque descarga código ejecutable. La desinstalación de Plugin puede aprobarse como una operación de rescate persistente.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión de agente interactiva; usa `openclaw` local para la transferencia al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en modo de rescate.
- Cada operación de rescate aplicada queda auditada. El rescate por canal de mensajes registra metadatos de canal, cuenta, remitente y dirección de origen; las operaciones que modifican la configuración también registran los hashes de configuración antes y después.
- Los secretos nunca se repiten. La inspección de SecretRef informa disponibilidad, no valores.
- Si el Gateway está activo, el rescate prefiere operaciones tipadas del Gateway; si está inactivo, el rescate usa solo la superficie mínima de reparación local que no depende del bucle normal del agente.

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

- `enabled`: `"auto"` (predeterminado) permite el rescate solo cuando el runtime efectivo es YOLO y el aislamiento está desactivado; `false` nunca permite el rescate por canal de mensajes; `true` permite explícitamente el rescate cuando se cumplen las comprobaciones de propietario/canal (sigue sujeto a la denegación por aislamiento).
- `ownerDmOnly`: restringe el rescate a mensajes directos del propietario. Valor predeterminado: `true`.
- `pendingTtlMinutes`: cuánto tiempo permanece abierta una escritura de rescate pendiente para la aprobación con `/crestodian yes` antes de expirar. Valor predeterminado: `15`.

El rescate remoto está cubierto por la lane de Docker:

```bash
pnpm test:docker:crestodian-rescue
```

La reserva del planificador local sin configuración está cubierta por:

```bash
pnpm test:docker:crestodian-planner
```

Una prueba smoke opt-in de superficie de comandos de canal live comprueba `/crestodian status` más un ciclo completo de aprobación persistente a través del manejador de rescate:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuración sin archivo de configuración mediante comandos explícitos de Crestodian está cubierta por:

```bash
pnpm test:docker:crestodian-first-run
```

Esa lane comienza con un directorio de estado vacío, verifica el punto de entrada moderno de incorporación de Crestodian, establece el modelo predeterminado, crea un agente adicional, configura Discord mediante la habilitación de un Plugin más un SecretRef de token, valida la configuración y comprueba el registro de auditoría. QA Lab tiene un escenario respaldado por el repositorio para el mismo flujo de Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Aislamiento](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
