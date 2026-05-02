---
read_when:
    - Ejecutas openclaw sin ningún comando y quieres entender Crestodian
    - Necesitas una forma segura sin configuración para inspeccionar o reparar OpenClaw
    - Estás diseñando o habilitando el modo de rescate de canales de mensajes
summary: Referencia de CLI y modelo de seguridad de Crestodian, el asistente de configuración y reparación seguro sin configuración
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T05:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian es el asistente local de OpenClaw para configuración inicial, reparación y configuración. Está
diseñado para mantenerse accesible cuando la ruta normal del agente está rota.

Ejecutar `openclaw` sin ningún comando inicia Crestodian en una terminal interactiva.
Ejecutar `openclaw crestodian` inicia el mismo asistente explícitamente.

## Qué muestra Crestodian

Al iniciar, Crestodian interactivo abre el mismo shell TUI usado por
`openclaw tui`, con un backend de chat de Crestodian. El registro de chat comienza con un breve
saludo:

- cuándo iniciar Crestodian
- el modelo o la ruta del planificador determinista que Crestodian está usando realmente
- validez de la configuración y el agente predeterminado
- accesibilidad del Gateway desde la primera comprobación de inicio
- la siguiente acción de depuración que Crestodian puede realizar

No vuelca secretos ni carga comandos CLI de Plugin solo para iniciar. La TUI
sigue proporcionando el encabezado normal, el registro de chat, la línea de estado, el pie, el autocompletado
y los controles del editor.

Usa `status` para el inventario detallado con ruta de configuración, rutas de documentación/fuente,
comprobaciones de CLI local, presencia de claves de API, agentes, modelo y detalles del Gateway.

Crestodian usa la misma detección de referencias de OpenClaw que los agentes normales. En un checkout de Git,
se apunta a sí mismo a `docs/` local y al árbol de código fuente local. En una instalación de paquete npm, usa
la documentación incluida en el paquete y enlaza a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con orientación explícita
para revisar el código fuente siempre que la documentación no sea suficiente.

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

## Inicio seguro

La ruta de inicio de Crestodian es deliberadamente pequeña. Puede ejecutarse cuando:

- falta `openclaw.json`
- `openclaw.json` no es válido
- el Gateway está inactivo
- el registro de comandos de Plugin no está disponible
- todavía no se ha configurado ningún agente

`openclaw --help` y `openclaw --version` siguen usando las rutas rápidas normales.
`openclaw` no interactivo sale con un mensaje breve en lugar de imprimir la ayuda raíz,
porque el producto sin comando es Crestodian.

## Operaciones y aprobación

Crestodian usa operaciones tipadas en lugar de editar la configuración de forma ad hoc.

Las operaciones de solo lectura pueden ejecutarse de inmediato:

- mostrar resumen
- listar agentes
- listar plugins instalados
- buscar plugins de ClawHub
- mostrar el estado del modelo/backend
- ejecutar comprobaciones de estado o salud
- comprobar la accesibilidad del Gateway
- ejecutar doctor sin correcciones interactivas
- validar configuración
- mostrar la ruta del registro de auditoría

Las operaciones persistentes requieren aprobación conversacional en modo interactivo, a menos que
pases `--yes` para un comando directo:

- escribir configuración
- ejecutar `config set`
- establecer valores SecretRef compatibles mediante `config set-ref`
- ejecutar bootstrap de configuración inicial/onboarding
- cambiar el modelo predeterminado
- iniciar, detener o reiniciar el Gateway
- crear agentes
- instalar plugins desde ClawHub o npm
- desinstalar plugins
- ejecutar reparaciones de doctor que reescriben configuración o estado

Las escrituras aplicadas se registran en:

```text
~/.openclaw/audit/crestodian.jsonl
```

La detección no se audita. Solo se registran las operaciones y escrituras aplicadas.

`openclaw onboard --modern` inicia Crestodian como la vista previa de onboarding moderna.
`openclaw onboard` sin más sigue ejecutando el onboarding clásico.

## Bootstrap de configuración inicial

`setup` es el bootstrap de onboarding centrado en chat. Escribe solo mediante operaciones
de configuración tipadas y primero pide aprobación.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Cuando no hay ningún modelo configurado, setup selecciona el primer backend utilizable en este
orden y te dice qué eligió:

- modelo explícito existente, si ya está configurado
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- CLI de Claude Code -> `claude-cli/claude-opus-4-7`
- CLI de Codex -> `codex-cli/gpt-5.5`

Si no hay ninguno disponible, setup igualmente escribe el workspace predeterminado y deja el
modelo sin establecer. Instala o inicia sesión en Codex/Claude Code, o expón
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, y luego ejecuta setup de nuevo.

## Planificador asistido por modelo

Crestodian siempre inicia en modo determinista. Para comandos imprecisos que el
analizador determinista no entiende, Crestodian local puede hacer un turno de
planificador acotado mediante las rutas de runtime normales de OpenClaw. Primero usa el
modelo de OpenClaw configurado. Si todavía no hay ningún modelo configurado utilizable, puede recurrir
a runtimes locales ya presentes en la máquina:

- CLI de Claude Code: `claude-cli/claude-opus-4-7`
- Arnés app-server de Codex: `openai/gpt-5.5` con `agentRuntime.id: "codex"`
- CLI de Codex: `codex-cli/gpt-5.5`

El planificador asistido por modelo no puede mutar la configuración directamente. Debe traducir la
solicitud a uno de los comandos tipados de Crestodian; después se aplican las reglas normales de
aprobación y auditoría. Crestodian imprime el modelo que usó y el comando interpretado
antes de ejecutar nada. Los turnos del planificador de reserva sin configuración son
temporales, con herramientas desactivadas cuando el runtime lo admite, y usan un
workspace/sesión temporal.

El modo de rescate por canal de mensajes no usa el planificador asistido por modelo. El rescate
remoto permanece determinista para que una ruta normal del agente rota o comprometida no pueda
usarse como editor de configuración.

## Cambiar a un agente

Usa un selector en lenguaje natural para salir de Crestodian y abrir la TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` siguen abriendo directamente la TUI
normal del agente. No inician Crestodian.

Después de cambiar a la TUI normal, usa `/crestodian` para volver a Crestodian.
Puedes incluir una solicitud de seguimiento:

```text
/crestodian
/crestodian restart gateway
```

Los cambios de agente dentro de la TUI dejan una indicación de que `/crestodian` está disponible.

## Modo de rescate por mensajes

El modo de rescate por mensajes es el punto de entrada por canal de mensajes para Crestodian. Es para
el caso en que tu agente normal está muerto, pero un canal de confianza como WhatsApp
sigue recibiendo comandos.

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

El modo de rescate remoto es una superficie de administración. Debe tratarse como reparación de
configuración remota, no como chat normal.

Contrato de seguridad para el rescate remoto:

- Deshabilitado cuando el sandboxing está activo. Si un agente/sesión está en sandbox,
  Crestodian debe rechazar el rescate remoto y explicar que se requiere reparación mediante CLI local.
- El estado efectivo predeterminado es `auto`: permitir rescate remoto solo en operación YOLO
  de confianza, donde el runtime ya tiene autoridad local sin sandbox.
- Requiere una identidad explícita del propietario. El rescate no debe aceptar reglas de remitente
  comodín, políticas de grupo abierto, webhooks no autenticados ni canales anónimos.
- Solo DM de propietario de forma predeterminada. El rescate en grupo/canal requiere opt-in explícito.
- La búsqueda y el listado de Plugin son de solo lectura. La instalación de Plugin es local-only de forma predeterminada
  porque descarga código ejecutable. La desinstalación de Plugin puede permitirse como una
  operación de reparación aprobada cuando la política de rescate permite escrituras persistentes.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión interactiva de agente.
  Usa `openclaw` local para el traspaso a agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en modo de rescate.
- Audita cada operación de rescate aplicada. El rescate por canal de mensajes registra metadatos de canal,
  cuenta, remitente y dirección de origen. Las operaciones que mutan configuración también
  registran hashes de configuración antes y después.
- Nunca muestres secretos. La inspección de SecretRef debe informar disponibilidad, no
  valores.
- Si el Gateway está vivo, prefiere operaciones tipadas del Gateway. Si el Gateway está
  muerto, usa solo la superficie mínima de reparación local que no dependa del
  bucle normal del agente.

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

- `"auto"`: predeterminado. Permitir solo cuando el runtime efectivo es YOLO y
  el sandboxing está desactivado.
- `false`: nunca permitir rescate por canal de mensajes.
- `true`: permitir explícitamente el rescate cuando las comprobaciones de propietario/canal pasan. Esto
  todavía no debe eludir la denegación por sandboxing.

La postura YOLO `"auto"` predeterminada es:

- el modo de sandbox se resuelve a `off`
- `tools.exec.security` se resuelve a `full`
- `tools.exec.ask` se resuelve a `off`

El rescate remoto está cubierto por la lane de Docker:

```bash
pnpm test:docker:crestodian-rescue
```

La reserva de planificador local sin configuración está cubierta por:

```bash
pnpm test:docker:crestodian-planner
```

Un smoke opt-in de superficie de comandos de canal en vivo comprueba `/crestodian status` más un
roundtrip de aprobación persistente mediante el manejador de rescate:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuración inicial fresca sin configuración mediante Crestodian está cubierta por:

```bash
pnpm test:docker:crestodian-first-run
```

Esa lane comienza con un directorio de estado vacío, enruta `openclaw` sin argumentos a Crestodian,
establece el modelo predeterminado, crea un agente adicional, configura Discord mediante
la habilitación de un Plugin más un SecretRef de token, valida la configuración y comprueba el registro de auditoría.
QA Lab también tiene un escenario respaldado por el repo para el mismo flujo Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Sandbox](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
