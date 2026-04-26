---
read_when:
    - Ejecutas openclaw sin ningún comando y quieres entender Crestodian
    - Necesitas una forma segura sin configuración manual de inspeccionar o reparar OpenClaw
    - Estás diseñando o habilitando el modo de rescate del canal de mensajes
summary: Referencia de CLI y modelo de seguridad de Crestodian, el asistente de configuración y reparación seguro sin configuración manual
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian es el asistente local de OpenClaw para configuración, reparación y ajustes. Está diseñado para seguir siendo accesible cuando la ruta normal del agente está rota.

Ejecutar `openclaw` sin ningún comando inicia Crestodian en un terminal interactivo. Ejecutar `openclaw crestodian` inicia explícitamente el mismo asistente.

## Qué muestra Crestodian

Al iniciarse, Crestodian interactivo abre la misma shell TUI que usa `openclaw tui`, con un backend de chat de Crestodian. El registro de chat comienza con un breve saludo:

- cuándo iniciar Crestodian
- el modelo o la ruta de planificador determinista que Crestodian está usando realmente
- la validez de la configuración y el agente predeterminado
- la accesibilidad del Gateway desde la primera comprobación de inicio
- la siguiente acción de depuración que Crestodian puede realizar

No vuelca secretos ni carga comandos de CLI de Plugin solo para arrancar. La TUI sigue proporcionando el encabezado normal, registro de chat, línea de estado, pie de página, autocompletado y controles del editor.

Usa `status` para ver el inventario detallado con ruta de configuración, rutas de docs/source, sondeos locales de CLI, presencia de claves API, agentes, modelo y detalles del Gateway.

Crestodian usa el mismo descubrimiento de referencias de OpenClaw que los agentes normales. En un checkout de Git, se apunta a sí mismo a `docs/` local y al árbol de código fuente local. En una instalación del paquete npm, usa la documentación incluida en el paquete y enlaza a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con una guía explícita para revisar el código fuente siempre que la documentación no sea suficiente.

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Inicio seguro

La ruta de inicio de Crestodian es deliberadamente pequeña. Puede ejecutarse cuando:

- falta `openclaw.json`
- `openclaw.json` no es válido
- el Gateway está caído
- el registro de comandos de Plugin no está disponible
- aún no se ha configurado ningún agente

`openclaw --help` y `openclaw --version` siguen usando las rutas rápidas normales.
`openclaw` no interactivo sale con un mensaje breve en lugar de imprimir la
ayuda raíz, porque el producto sin comando es Crestodian.

## Operaciones y aprobación

Crestodian usa operaciones tipadas en lugar de editar la configuración de forma ad hoc.

Las operaciones de solo lectura pueden ejecutarse inmediatamente:

- mostrar resumen
- listar agentes
- mostrar estado del modelo/backend
- ejecutar comprobaciones de estado o salud
- comprobar la accesibilidad del Gateway
- ejecutar doctor sin correcciones interactivas
- validar configuración
- mostrar la ruta del registro de auditoría

Las operaciones persistentes requieren aprobación conversacional en modo interactivo a menos que pases `--yes` para un comando directo:

- escribir configuración
- ejecutar `config set`
- establecer valores SecretRef compatibles mediante `config set-ref`
- ejecutar el bootstrap de configuración/onboarding
- cambiar el modelo predeterminado
- iniciar, detener o reiniciar el Gateway
- crear agentes
- ejecutar reparaciones de doctor que reescriben configuración o estado

Las escrituras aplicadas se registran en:

```text
~/.openclaw/audit/crestodian.jsonl
```

El descubrimiento no se audita. Solo se registran las operaciones y escrituras aplicadas.

`openclaw onboard --modern` inicia Crestodian como vista previa del onboarding moderno.
`openclaw onboard` simple sigue ejecutando el onboarding clásico.

## Bootstrap de configuración

`setup` es el bootstrap de onboarding centrado en chat. Escribe solo mediante operaciones de configuración tipadas y solicita aprobación primero.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Cuando no hay ningún modelo configurado, setup selecciona el primer backend utilizable en este orden y te dice cuál eligió:

- modelo explícito existente, si ya está configurado
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Si ninguno está disponible, setup sigue escribiendo el espacio de trabajo predeterminado y deja el modelo sin configurar. Instala o inicia sesión en Codex/Claude Code, o expón `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, y luego vuelve a ejecutar setup.

## Planificador asistido por modelo

Crestodian siempre se inicia en modo determinista. Para comandos difusos que el analizador determinista no entiende, Crestodian local puede hacer un turno de planificador acotado a través de las rutas normales del entorno de ejecución de OpenClaw. Primero usa el modelo de OpenClaw configurado. Si aún no puede usarse ningún modelo configurado, puede recurrir a entornos de ejecución locales ya presentes en la máquina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- arnés app-server de Codex: `openai/gpt-5.5` con `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

El planificador asistido por modelo no puede mutar la configuración directamente. Debe traducir la solicitud a uno de los comandos tipados de Crestodian; luego se aplican las reglas normales de aprobación y auditoría. Crestodian imprime el modelo que usó y el comando interpretado antes de ejecutar nada. Los turnos de planificador de respaldo sin configuración son temporales, con herramientas deshabilitadas cuando el entorno de ejecución lo admite, y usan un espacio de trabajo/sesión temporal.

El modo de rescate del canal de mensajes no usa el planificador asistido por modelo. El rescate remoto sigue siendo determinista para que una ruta normal de agente rota o comprometida no pueda usarse como editor de configuración.

## Cambiar a un agente

Usa un selector en lenguaje natural para salir de Crestodian y abrir la TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` siguen abriendo directamente la TUI normal del agente. No inician Crestodian.

Después de cambiar a la TUI normal, usa `/crestodian` para volver a Crestodian.
Puedes incluir una solicitud de seguimiento:

```text
/crestodian
/crestodian restart gateway
```

Los cambios de agente dentro de la TUI dejan una señal de que `/crestodian` está disponible.

## Modo de rescate por mensajes

El modo de rescate por mensajes es el punto de entrada de Crestodian para canales de mensajes. Es para el caso en que tu agente normal está inactivo, pero un canal de confianza como WhatsApp sigue recibiendo comandos.

Comando de texto compatible:

- `/crestodian <request>`

Flujo del operador:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

La creación de agentes también puede ponerse en cola desde el prompt local o el modo de rescate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

El modo de rescate remoto es una superficie de administración. Debe tratarse como reparación remota de configuración, no como chat normal.

Contrato de seguridad para el rescate remoto:

- Deshabilitado cuando el sandboxing está activo. Si un agente/sesión está en sandbox, Crestodian debe rechazar el rescate remoto y explicar que se requiere reparación local por CLI.
- El estado efectivo predeterminado es `auto`: permitir rescate remoto solo en operación YOLO de confianza, donde el entorno de ejecución ya tiene autoridad local sin sandbox.
- Requerir una identidad explícita del propietario. El rescate no debe aceptar reglas de remitente comodín, política de grupo abierta, Webhook sin autenticar ni canales anónimos.
- Solo mensajes directos del propietario de forma predeterminada. El rescate en grupos/canales requiere activación explícita.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión interactiva del agente. Usa `openclaw` local para transferir al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en modo de rescate.
- Auditar cada operación de rescate aplicada. El rescate por canal de mensajes registra metadatos de canal, cuenta, remitente y dirección de origen. Las operaciones que mutan la configuración también registran hashes de configuración antes y después.
- Nunca mostrar secretos. La inspección de SecretRef debe informar disponibilidad, no valores.
- Si el Gateway está activo, preferir operaciones tipadas del Gateway. Si el Gateway está inactivo, usar solo la superficie mínima de reparación local que no dependa del bucle normal del agente.

Forma de configuración:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` debe aceptar:

- `"auto"`: predeterminado. Permitir solo cuando el entorno de ejecución efectivo sea YOLO y
  el sandboxing esté desactivado.
- `false`: no permitir nunca el rescate por canal de mensajes.
- `true`: permitir explícitamente el rescate cuando pasen las comprobaciones de propietario/canal. Esto
  sigue sin poder omitir la denegación por sandboxing.

La postura YOLO predeterminada de `"auto"` es:

- el modo sandbox se resuelve a `off`
- `tools.exec.security` se resuelve a `full`
- `tools.exec.ask` se resuelve a `off`

El rescate remoto está cubierto por la ruta Docker:

```bash
pnpm test:docker:crestodian-rescue
```

El respaldo del planificador local sin configuración está cubierto por:

```bash
pnpm test:docker:crestodian-planner
```

Una comprobación de humo opcional y activable de la superficie de comandos de canal verifica `/crestodian status` más un ida y vuelta de aprobación persistente a través del manejador de rescate:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuración inicial sin configuración manual a través de Crestodian está cubierta por:

```bash
pnpm test:docker:crestodian-first-run
```

Esa ruta comienza con un directorio de estado vacío, enruta `openclaw` simple a Crestodian,
establece el modelo predeterminado, crea un agente adicional, configura Discord mediante
habilitación de Plugin más SecretRef del token, valida la configuración y comprueba el registro
de auditoría. QA Lab también tiene un escenario respaldado por repositorio para el mismo flujo Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Sandbox](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
