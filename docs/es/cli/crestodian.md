---
read_when:
    - Ejecutas openclaw sin ningún comando después de la configuración y quieres entender Crestodian
    - Necesitas una forma segura sin configuración para inspeccionar o reparar OpenClaw
    - Estás diseñando o habilitando el modo de rescate de canal de mensajes
summary: Referencia de CLI y modelo de seguridad de Crestodian, el asistente de configuración y reparación seguro sin configuración
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T11:09:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abe91886e3faeebc20203639cd811a515509e252e29b11fb7d710e9924cb556f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian es el asistente local de configuración, reparación y ajuste de OpenClaw. Permanece accesible cuando la ruta normal del agente está rota: puede ejecutarse cuando falta `openclaw.json` o no es válido, el Gateway está caído, el registro de comandos de plugins no está disponible o aún no hay ningún agente configurado.

## Cuándo se inicia

Ejecutar `openclaw` sin subcomando enruta según el estado de la configuración:

- Falta la configuración, o existe sin ajustes definidos por el usuario (vacía, o solo con claves `$schema`/`meta`): inicia la incorporación clásica.
- La configuración existe pero no supera la validación: inicia Crestodian.
- La configuración existe y es válida: abre el TUI normal del agente (contra un Gateway configurado y accesible, o localmente si no hay ninguno accesible). Usa `/crestodian` dentro del TUI, o ejecuta `openclaw crestodian` directamente, para llegar a Crestodian.

Ejecutar `openclaw crestodian` siempre inicia Crestodian explícitamente, independientemente del estado de la configuración. `openclaw --help` y `openclaw --version` conservan sus rutas rápidas normales.

`openclaw` sin TTY y sin interacción sale con un mensaje breve en lugar de imprimir la ayuda raíz: apunta a la incorporación no interactiva en una instalación nueva, a `openclaw crestodian --message "status"` cuando la configuración no es válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` inicia Crestodian como vista previa de la incorporación moderna. `openclaw onboard` sin más conserva la incorporación clásica.

## Qué muestra Crestodian

Crestodian interactivo abre la misma consola TUI que `openclaw tui`, con un backend de chat de Crestodian. El saludo de inicio cubre:

- la validez de la configuración y el agente predeterminado
- el modelo o la ruta de planificador determinista que está usando Crestodian
- la accesibilidad del Gateway desde la primera comprobación de inicio
- la siguiente acción de depuración recomendada

No vuelca secretos ni carga comandos CLI de plugins solo para iniciar.

Usa `status` para el inventario detallado: ruta de configuración, rutas de documentación/fuente, comprobaciones de CLI local, presencia de claves de API, agentes, modelo y detalles del Gateway.

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

Dentro del TUI de Crestodian:

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

Solo lectura, ejecución inmediata: mostrar resumen, listar agentes, listar plugins instalados, buscar plugins de ClawHub, mostrar el estado del modelo/backend, ejecutar comprobaciones de estado/salud, comprobar la accesibilidad del Gateway, ejecutar doctor sin correcciones interactivas, validar la configuración, mostrar la ruta del registro de auditoría.

Persistentes, requieren aprobación conversacional (o `--yes` para un comando directo): escribir configuración, `config set`, `config set-ref`, arranque de configuración/incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes, instalar o desinstalar plugins, ejecutar reparaciones de doctor que reescriban configuración o estado.

Las escrituras aplicadas se registran en `~/.openclaw/audit/crestodian.jsonl`. El descubrimiento no se audita; solo se auditan las operaciones aplicadas y las escrituras.

La configuración de canales puede ejecutarse como una conversación alojada cuando el host admite entrada enmascarada. El TUI local de Crestodian no acepta respuestas sensibles del asistente; en su lugar te dirige a `openclaw channels add --channel <channel>`, cuyos prompts interactivos enmascaran las credenciales.

## Arranque de configuración

`setup` es el arranque de incorporación centrado en chat. Escribe solo mediante operaciones de configuración tipadas y pide aprobación primero.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Cuando no hay ningún modelo configurado, setup elige el primer backend utilizable en este orden y te indica cuál eligió:

1. Modelo explícito existente, si ya está configurado.
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> `openai/gpt-5.5` mediante el arnés app-server de Codex

Si no hay ninguno disponible, setup aun así escribe el espacio de trabajo predeterminado y deja el modelo sin establecer. Instala o inicia sesión en Codex/Claude Code, o expón `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, y luego vuelve a ejecutar setup.

## Planificador asistido por modelo

Crestodian interactivo prioriza la IA. Los comandos tipados exactos se ejecutan al instante y de forma determinista. Cualquier otro mensaje se ejecuta mediante el mismo bucle de agente integrado que los agentes normales de OpenClaw, restringido a una única herramienta `crestodian` de anillo cero que envuelve las operaciones tipadas: las acciones de lectura se ejecutan libremente, las mutaciones requieren tu sí conversacional para esa operación exacta, y cada escritura aplicada se audita y se vuelve a validar. La sesión del agente persiste, por lo que el custodio tiene memoria real de varios turnos. Primero usa el modelo configurado de OpenClaw; sin un modelo utilizable, recurre a un runtime local ya presente en la máquina:

- Claude Code CLI: `claude-cli/claude-opus-4-8` (bucle de agente; la herramienta de anillo cero se sirve mediante MCP, consulta el modelo de confianza más abajo)
- Arnés app-server de Codex: `openai/gpt-5.5` (bucle de agente con una lista de permitidos estricta de una sola herramienta)

Cuando el bucle de agente no está disponible, Crestodian se degrada a un planificador acotado de un solo turno y, sin ningún modelo, a comandos tipados deterministas. El planificador no puede mutar la configuración directamente; debe traducir la solicitud a uno de los comandos tipados de Crestodian, y se aplican las reglas normales de aprobación/auditoría. Crestodian imprime el modelo que usó y el comando interpretado antes de ejecutar nada. Los turnos del planificador de respaldo son temporales, sin herramientas cuando el runtime lo admite, y usan un espacio de trabajo/sesión temporal.

El modo de rescate por canal de mensajes nunca usa el planificador asistido por modelo. El rescate remoto permanece determinista para que una ruta normal de agente rota o comprometida no pueda usarse como editor de configuración.

### Modelo de confianza del arnés CLI

Los runtimes integrados y el arnés app-server de Codex aplican directamente la restricción de anillo cero: la ejecución lleva una lista de herramientas permitidas con solo la herramienta `crestodian`. Los arneses CLI (Claude Code, Gemini CLI) no pueden aplicar una lista de permitidos de herramientas de OpenClaw: la CLI posee sus herramientas nativas y su propia política de permisos, por lo que OpenClaw falla de forma cerrada si se le pide restringir una. Para los modelos de arnés CLI, Crestodian en su lugar:

- inyecta un servidor MCP dedicado que sirve solo la herramienta `crestodian` y reemplaza la superficie normal de herramientas MCP de OpenClaw para la ejecución (para Claude Code, la configuración generada se aplica con `--strict-mcp-config`, por lo que no se cargan otros servidores MCP),
- mantiene cada mutación de configuración dentro del contrato de aprobación y auditoría de la herramienta: las lecturas se ejecutan libremente, las escrituras requieren tu sí conversacional, y cada escritura aplicada se audita y se vuelve a validar,
- deja las herramientas nativas (lecturas de archivos, shell) al arnés. Siguen la misma postura de permisos que las ejecuciones normales de agentes de OpenClaw en esta máquina: con la configuración exec predeterminada de OpenClaw, Claude Code se ejecuta con permisos omitidos, y una configuración `tools.exec` restringida recurre a la propia política de permisos de la CLI.

Solo las sesiones de Crestodian reciben el servidor MCP de crestodian; las ejecuciones normales de agentes nunca ven esta herramienta. Trata una sesión de Crestodian en un modelo de arnés CLI como una ejecución normal de agente local en el mismo host: la herramienta de anillo cero añade una ruta auditada y con aprobación para reparación de configuración, pero no impide que las herramientas nativas del arnés toquen archivos directamente. El respaldo app-server de Codex y los modelos con clave de API aplican el bucle estricto de una sola herramienta; prefiérelos cuando quieras la restricción fuerte.

## Cambiar a un agente

Usa un selector en lenguaje natural para salir de Crestodian y abrir el TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` abren directamente el TUI normal del agente; no inician Crestodian. Después de cambiar al TUI normal, `/crestodian` vuelve a Crestodian, opcionalmente con una solicitud de seguimiento:

```text
/crestodian
/crestodian restart gateway
```

## Modo de rescate por mensajes

El modo de rescate por mensajes es el punto de entrada de canal de mensajes para Crestodian: úsalo cuando tu agente normal esté muerto pero un canal de confianza (por ejemplo WhatsApp) aún reciba comandos.

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

El rescate remoto es una superficie de administración y debe tratarse como reparación de configuración remota, no como chat normal.

Contrato de seguridad para el rescate remoto:

- Deshabilitado cuando el aislamiento está activo para el agente/sesión; Crestodian rechaza el rescate remoto y apunta a la reparación mediante CLI local.
- El estado efectivo predeterminado es `auto`: permite el rescate remoto solo en operación YOLO de confianza, donde el runtime ya tiene autoridad local sin aislamiento (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` se resuelve como `off`, con el modo sandbox `off`).
- Requiere una identidad de propietario explícita; sin reglas de remitente comodín, política de grupo abierto, webhooks no autenticados ni canales anónimos.
- De forma predeterminada, solo DM del propietario; el rescate en grupo/canal necesita una activación explícita.
- La búsqueda y lista de plugins son de solo lectura. La instalación de plugins siempre es solo local (bloqueada en rescate, incluso cuando está habilitada de otro modo) porque descarga código ejecutable. La desinstalación de plugins puede aprobarse como operación de rescate persistente.
- El rescate remoto no puede abrir el TUI local ni cambiar a una sesión interactiva de agente; usa `openclaw` local para la transferencia a agente.
- Las escrituras persistentes aún requieren aprobación, incluso en modo de rescate.
- Cada operación de rescate aplicada se audita. El rescate por canal de mensajes registra metadatos de canal, cuenta, remitente y dirección de origen; las operaciones que mutan la configuración también registran hashes de configuración antes y después.
- Los secretos nunca se repiten. La inspección de SecretRef informa disponibilidad, no valores.
- Si el Gateway está activo, el rescate prefiere operaciones tipadas del Gateway; si está muerto, el rescate usa solo la superficie mínima de reparación local que no depende del bucle normal de agente.

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

- `enabled`: `"auto"` (predeterminado) permite el rescate solo cuando el runtime efectivo es YOLO y el aislamiento está desactivado; `false` nunca permite el rescate por canal de mensajes; `true` permite explícitamente el rescate cuando las comprobaciones de propietario/canal pasan (aún sujeto a la denegación por aislamiento).
- `ownerDmOnly`: restringe el rescate a mensajes directos del propietario. Predeterminado `true`.
- `pendingTtlMinutes`: cuánto tiempo permanece abierta una escritura de rescate pendiente para la aprobación `/crestodian yes` antes de expirar. Predeterminado `15`.

El rescate remoto está cubierto por el carril Docker:

```bash
pnpm test:docker:crestodian-rescue
```

El respaldo de planificador local sin configuración está cubierto por:

```bash
pnpm test:docker:crestodian-planner
```

Una comprobación de humo opcional de la superficie de comandos del canal en vivo comprueba `/crestodian status` junto con un recorrido persistente de aprobación a través del controlador de rescate:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuración sin archivo de configuración mediante comandos explícitos de Crestodian está cubierta por:

```bash
pnpm test:docker:crestodian-first-run
```

Ese carril comienza con un directorio de estado vacío, verifica el punto de entrada moderno de incorporación de Crestodian, establece el modelo predeterminado, crea un agente adicional, configura Discord mediante la habilitación de un plugin más un token SecretRef, valida la configuración y comprueba el registro de auditoría. QA Lab tiene un escenario respaldado por el repositorio para el mismo flujo Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Sandbox](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
