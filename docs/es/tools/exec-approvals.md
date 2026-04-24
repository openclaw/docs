---
read_when:
    - Configurar aprobaciones o allowlists de exec
    - Implementar la UX de aprobación de exec en la app de macOS
    - Revisar los prompts de escape del sandbox y sus implicaciones
summary: Aprobaciones de exec, allowlists y prompts de escape del sandbox
title: Aprobaciones de exec
x-i18n:
    generated_at: "2026-04-24T05:53:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Las aprobaciones de exec son la **protección del host del companion app / Node** para permitir que un
agente en sandbox ejecute comandos en un host real (`gateway` o `Node`). Es un
interbloqueo de seguridad: los comandos solo se permiten cuando la política + allowlist + (opcionalmente) la aprobación del usuario
coinciden. Las aprobaciones de exec se aplican **encima de** la política de herramientas y del gating elevado
(a menos que elevated esté en `full`, lo que omite las aprobaciones).

<Note>
La política efectiva es la **más estricta** entre los valores predeterminados de `tools.exec.*` y de approvals;
si se omite un campo de approvals, se usa el valor de `tools.exec`. El exec del host
también usa el estado local de approvals en esa máquina: un `ask: "always"` local del host
en `~/.openclaw/exec-approvals.json` seguirá mostrando prompts incluso si los valores predeterminados de sesión o config
solicitan `ask: "on-miss"`.
</Note>

## Inspeccionar la política efectiva

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — muestran la política solicitada, las fuentes de política del host y el resultado efectivo.
- `openclaw exec-policy show` — vista fusionada de la máquina local.
- `openclaw exec-policy set|preset` — sincroniza la política local solicitada con el archivo local de approvals del host en un solo paso.

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa ese ámbito
como gestionado por node en tiempo de ejecución en lugar de fingir que el archivo local de approvals es
la fuente de verdad.

Si la IU del companion app **no está disponible**, cualquier solicitud que normalmente mostraría
un prompt se resuelve mediante el **ask fallback** (predeterminado: deny).

<Tip>
Los clientes nativos de aprobación por chat pueden sembrar affordances específicas del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix siembra atajos de reacción (`✅`
permitir una vez, `❌` denegar, `♾️` permitir siempre) sin dejar de incluir
comandos `/approve ...` en el mensaje como fallback.
</Tip>

## Dónde se aplica

Las aprobaciones de exec se aplican localmente en el host de ejecución:

- **host de gateway** → proceso `openclaw` en la máquina del gateway
- **host de node** → ejecutor de Node (companion app de macOS o host de Node sin interfaz)

Nota sobre el modelo de confianza:

- Los llamadores autenticados por Gateway son operadores de confianza para ese Gateway.
- Los Nodes emparejados extienden esa capacidad de operador de confianza al host del Node.
- Las aprobaciones de exec reducen el riesgo de ejecución accidental, pero no son un límite de autenticación por usuario.
- Las ejecuciones aprobadas en host de Node vinculan el contexto de ejecución canónico: `cwd` canónico, `argv` exacto, vinculación de `env`
  cuando está presente y ruta fijada del ejecutable cuando aplica.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular
  un único operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución,
  la ejecución se deniega en lugar de ejecutar contenido desviado.
- Esta vinculación de archivos es intencionalmente de mejor esfuerzo, no un modelo semántico completo de todas las
  rutas de carga de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto
  para vincular, se niega a crear una ejecución respaldada por aprobación en lugar de fingir cobertura total.

División en macOS:

- el **servicio de host de Node** reenvía `system.run` a la **app de macOS** a través de IPC local.
- la **app de macOS** aplica approvals + ejecuta el comando en contexto de IU.

## Configuración y almacenamiento

Las approvals viven en un archivo JSON local en el host de ejecución:

`~/.openclaw/exec-approvals.json`

Esquema de ejemplo:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modo "YOLO" sin aprobación

Si quieres que el exec del host se ejecute sin prompts de aprobación, debes abrir **ambas** capas de política:

- política de exec solicitada en la config de OpenClaw (`tools.exec.*`)
- política local de approvals del host en `~/.openclaw/exec-approvals.json`

Este es ahora el comportamiento predeterminado del host salvo que lo endurezcas explícitamente:

- `tools.exec.security`: `full` en `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinción importante:

- `tools.exec.host=auto` elige dónde se ejecuta exec: sandbox cuando está disponible, si no gateway.
- YOLO elige cómo se aprueba el exec del host: `security=full` más `ask=off`.
- Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo pueden seguir esta política.
  Claude CLI agrega `--permission-mode bypassPermissions` cuando la política solicitada de exec de OpenClaw está en
  modo YOLO. Sobrescribe ese comportamiento del backend con args explícitos de Claude bajo
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, por ejemplo
  `--permission-mode default`, `acceptEdits` o `bypassPermissions`.
- En modo YOLO, OpenClaw no agrega una puerta de aprobación heurística separada para ofuscación de comandos ni una capa de rechazo previo de scripts encima de la política configurada de exec del host.
- `auto` no convierte el enrutamiento a gateway en una sobrescritura gratuita desde una sesión en sandbox. Se permite una solicitud por llamada de `host=node` desde `auto`, y `host=gateway` solo se permite desde `auto` cuando no hay un runtime de sandbox activo. Si quieres un valor predeterminado estable no `auto`, establece `tools.exec.host` o usa `/exec host=...` explícitamente.

Si quieres una configuración más conservadora, vuelve a endurecer cualquiera de las capas a `allowlist` / `on-miss`
o `deny`.

Configuración persistente de host de gateway "nunca preguntar":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Luego ajusta el archivo de approvals del host para que coincida:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Atajo local para la misma política de host de gateway en la máquina actual:

```bash
openclaw exec-policy preset yolo
```

Ese atajo local actualiza ambos:

- `tools.exec.host/security/ask` local
- valores predeterminados locales de `~/.openclaw/exec-approvals.json`

Es intencionalmente solo local. Si necesitas cambiar approvals de host de gateway o de host de node
de forma remota, sigue usando `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

Para un host de node, aplica en su lugar el mismo archivo de approvals en ese node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Limitación importante solo local:

- `openclaw exec-policy` no sincroniza approvals de node
- `openclaw exec-policy set --host node` se rechaza
- las approvals de exec de node se obtienen del node en tiempo de ejecución, por lo que las actualizaciones dirigidas a node deben usar `openclaw approvals --node ...`

Atajo solo de sesión:

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo break-glass que también omite las approvals de exec para esa sesión.

Si el archivo de approvals del host sigue siendo más estricto que la config, la política más estricta del host sigue ganando.

## Controles de política

### Seguridad (`exec.security`)

- **deny**: bloquea todas las solicitudes de exec del host.
- **allowlist**: permite solo comandos presentes en la allowlist.
- **full**: permite todo (equivale a elevated).

### Ask (`exec.ask`)

- **off**: nunca mostrar prompts.
- **on-miss**: mostrar prompt solo cuando la allowlist no coincide.
- **always**: mostrar prompt en cada comando.
- la confianza duradera `allow-always` no suprime los prompts cuando el modo ask efectivo es `always`

### Ask fallback (`askFallback`)

Si se requiere un prompt pero no hay ninguna IU accesible, el fallback decide:

- **deny**: bloquear.
- **allowlist**: permitir solo si la allowlist coincide.
- **full**: permitir.

### Endurecimiento de eval inline de intérprete (`tools.exec.strictInlineEval`)

Cuando `tools.exec.strictInlineEval=true`, OpenClaw trata las formas inline de evaluación de código como solo-aprobación aunque el binario del intérprete en sí esté en la allowlist.

Ejemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Esto es defensa en profundidad para cargadores de intérprete que no se asignan limpiamente a un operando de archivo estable. En modo estricto:

- estos comandos siguen necesitando aprobación explícita;
- `allow-always` no conserva automáticamente nuevas entradas de allowlist para ellos.

## Allowlist (por agente)

Las allowlists son **por agente**. Si existen varios agentes, cambia qué agente estás
editando en la app de macOS. Los patrones son **coincidencias glob sin distinción entre mayúsculas y minúsculas**.
Los patrones deben resolverse a **rutas de binarios** (las entradas solo con basename se ignoran).
Las entradas heredadas `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior satisfaga las reglas de la allowlist.

Ejemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de allowlist rastrea:

- **id** UUID estable usado para identidad de IU (opcional)
- marca de tiempo de **último uso**
- **último comando usado**
- **última ruta resuelta**

## Auto-allow skill CLIs

Cuando **Auto-allow skill CLIs** está habilitado, los ejecutables referenciados por Skills conocidas
se tratan como incluidos en la allowlist en nodes (Node de macOS o host de Node sin interfaz). Esto usa
`skills.bins` sobre el RPC del Gateway para obtener la lista de binarios de la Skill. Desactívalo si quieres allowlists manuales estrictas.

Notas importantes de confianza:

- Esto es una **allowlist implícita de conveniencia**, separada de las entradas manuales de allowlist por ruta.
- Está pensado para entornos de operadores de confianza donde Gateway y Node están en el mismo límite de confianza.
- Si necesitas confianza estricta explícita, mantén `autoAllowSkills: false` y usa solo entradas manuales de allowlist por ruta.

## Safe bins y reenvío de aprobaciones

Para safe bins (la ruta rápida solo stdin), detalles de vinculación de intérprete y cómo
reenviar prompts de aprobación a Slack/Discord/Telegram (o ejecutarlos como clientes nativos
de aprobación), consulta [Exec approvals — advanced](/es/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Edición en Control UI

Usa la tarjeta **Control UI → Nodes → Exec approvals** para editar valores predeterminados, sobrescrituras
por agente y allowlists. Elige un ámbito (Defaults o un agente), ajusta la política,
agrega/elimina patrones de allowlist y luego **Save**. La IU muestra metadatos de **last used**
por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (approvals locales) o un **Node**. Los Nodes
deben anunciar `system.execApprovals.get/set` (app de macOS o host de Node sin interfaz).
Si un node todavía no anuncia exec approvals, edita directamente su
`~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite edición de gateway o node (consulta [Approvals CLI](/es/cli/approvals)).

## Flujo de aprobación

Cuando se requiere un prompt, el gateway difunde `exec.approval.requested` a los clientes operadores.
La Control UI y la app de macOS lo resuelven mediante `exec.approval.resolve`, luego el gateway reenvía la
solicitud aprobada al host de node.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`. El gateway usa
ese plan como el contexto autoritativo de comando/`cwd`/sesión al reenviar solicitudes aprobadas de `system.run`.

Eso importa para la latencia de aprobación asíncrona:

- la ruta de exec de node prepara un plan canónico por adelantado
- el registro de aprobación almacena ese plan y sus metadatos de vinculación
- una vez aprobado, la llamada final reenviada de `system.run` reutiliza el plan almacenado
  en lugar de confiar en ediciones posteriores del llamador
- si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` después de crear la solicitud de aprobación, el gateway rechaza la
  ejecución reenviada como discrepancia de aprobación

## Eventos del sistema

El ciclo de vida de exec se expone como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución)
- `Exec finished`
- `Exec denied`

Estos se publican en la sesión del agente después de que el Node informa el evento.
Las aprobaciones de exec en host de Gateway emiten los mismos eventos del ciclo de vida cuando el comando termina (y opcionalmente cuando sigue ejecutándose más allá del umbral).
Los exec con aprobación reutilizan el id de aprobación como `runId` en estos mensajes para facilitar la correlación.

## Comportamiento de aprobación denegada

Cuando se deniega una aprobación asíncrona de exec, OpenClaw impide que el agente reutilice
la salida de cualquier ejecución anterior del mismo comando en la sesión. El motivo de la denegación
se transmite con orientación explícita de que no hay salida del comando disponible, lo que evita
que el agente afirme que hay salida nueva o repita el comando denegado con
resultados obsoletos de una ejecución previa exitosa.

## Implicaciones

- **full** es potente; prefiere allowlists cuando sea posible.
- **ask** te mantiene dentro del flujo mientras sigue permitiendo aprobaciones rápidas.
- Las allowlists por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec del host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite aprobaciones por diseño. Para bloquear de forma estricta el exec del host, establece la seguridad de approvals en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/es/tools/exec-approvals-advanced" icon="gear">
    Safe bins, vinculación de intérprete y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Elevated mode" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta break-glass que también omite aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al espacio de trabajo.
  </Card>
  <Card title="Security" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y endurecimiento.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de auto-allow respaldado por Skills.
  </Card>
</CardGroup>
