---
read_when:
    - Se desea editar las aprobaciones de ejecución desde la CLI
    - Es necesario gestionar las listas de permitidos en los hosts del Gateway o de los Node.
    - Necesita enumerar o resolver una aprobación pendiente sin una interfaz de chat
summary: Referencia de la CLI para `openclaw approvals` y `openclaw exec-policy`
title: Aprobaciones
x-i18n:
    generated_at: "2026-07-19T13:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 739d9521dc625571affe1590d5bb2511560029ac6f007b2a422f0606bdb90059
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gestiona las aprobaciones de ejecución para el **host local**, el **host del Gateway** o un **host de Node**. Si no se especifica ninguna opción de destino, los comandos leen o escriben el archivo local de aprobaciones en el disco. Usa `--gateway` para seleccionar el Gateway o `--node <id|name|ip>` para seleccionar un Node específico.

Alias: `openclaw exec-approvals`

Relacionado: [Aprobaciones de ejecución](/es/tools/exec-approvals), [Nodes](/es/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` es el comando práctico **exclusivamente local** que mantiene sincronizados, en un solo paso, la configuración solicitada de `tools.exec.*` y el archivo de aprobaciones del host local:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Los preajustes (`yolo`, `cautious`, `deny-all`) aplican conjuntamente `host`, `security`, `ask` y `askFallback`. `set` aplica únicamente las opciones que se proporcionan; se valida cada valor aceptado (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Ámbito:

- Actualiza conjuntamente el archivo de configuración local y el archivo de aprobaciones local; no envía la política al Gateway ni a un host de Node.
- Se rechaza `--host node`: las aprobaciones de ejecución de Node se obtienen del Node en tiempo de ejecución, por lo que `exec-policy` local no puede sincronizarlas. Usa `openclaw approvals set --node <id|name|ip>` en su lugar.
- `exec-policy show` marca los ámbitos de `host=node` como administrados por el Node en tiempo de ejecución, en lugar de derivar una política efectiva del archivo local de aprobaciones.

Para las aprobaciones de hosts remotos, usa directamente `openclaw approvals set --gateway` o `openclaw approvals set --node <id|name|ip>`.

## Comandos habituales

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` muestra la política efectiva de ejecución para el destino: la política solicitada de `tools.exec`, la política del archivo de aprobaciones del host y el resultado efectivo combinado. Los Nodes con una política nativa del host, como la aplicación complementaria de Windows, muestran esa política directamente en lugar de aplicar los cálculos de la política del archivo de aprobaciones de OpenClaw.

En los Nodes respaldados por archivos, la vista combinada requiere una instantánea de la política resuelta por el host. Los Nodes antiguos muestran la política efectiva como no disponible, en lugar de suponer que la política solicitada del Gateway también se aplica en el host.

<Note>
No se incluyen las anulaciones de `/exec` por sesión. Ejecuta `/exec` en la sesión correspondiente para consultar sus valores predeterminados actuales.
</Note>

Precedencia:

- El archivo de aprobaciones del host es la fuente de verdad aplicable.
- La política solicitada de `tools.exec` puede restringir o ampliar la intención, pero el resultado efectivo se deriva de las reglas del host.
- `--node` combina el archivo de aprobaciones del host de Node con la política de `tools.exec` del Gateway (ambas se aplican en tiempo de ejecución).
- Si la configuración del Gateway no está disponible, la CLI utiliza como alternativa la instantánea de aprobaciones del Node e indica que no se pudo calcular la política final en tiempo de ejecución.

## Aprobaciones pendientes

Enumera las aprobaciones pendientes de ejecución, plugins y agentes del sistema OpenClaw del Gateway:

```bash
openclaw approvals pending
openclaw approvals pending --json
```

La enumeración completa y el flujo correspondiente de `resolve` para todo el operador utilizan `operator.admin`, porque, de lo contrario, los registros de aprobación conservan el filtrado por solicitante o revisor. La resolución también solicita el ámbito específico `operator.approvals`. La concesión estándar de operador de la CLI incluye ambos ámbitos; un cliente restringido de terceros no debe solicitar permisos de administración solo para emular este comando.

La salida para personas muestra el tipo de aprobación, la atribución del agente o la sesión, la antigüedad de la solicitud, el tiempo restante hasta su vencimiento, un comando o resumen abreviado y un token de identificador `id64_<base64url>` independiente del shell. Después de la tabla compacta siempre aparece un bloque `Full request text` con todos los tokens completos y una solicitud con escapes sin pérdida, de modo que la abreviación por el ancho del terminal no pueda ocultar un sufijo ni el token necesario para la resolución. Copia el token completo en `resolve`. Los caracteres de terminal no seguros de los demás campos se muestran como escapes Unicode visibles. La salida JSON devuelve entradas normalizadas en `approvals` y conserva los valores sin procesar originales de `id`, `summary`, `createdAtMs` y `expiresAtMs` para los scripts; `resolve` sigue aceptando los identificadores sin procesar, salvo que utilicen el prefijo reservado del token de visualización `id64_`.

Si un valor proporcionado de `id64_` coincide tanto con un identificador literal sin procesar como con el token de visualización decodificado de otra aprobación, la CLI lo rechaza por ambiguo en lugar de arriesgarse a resolver la solicitud incorrecta.

Resuelve una aprobación mediante su identificador completo:

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "No se esperaba durante el mantenimiento"
```

La CLI lee el registro unificado de aprobación para seleccionar su tipo, comprueba la decisión solicitada con respecto a las decisiones permitidas por el registro y, después, llama al resolutor unificado. Una primera decisión correcta termina con `0`. Repetir la decisión registrada también termina con `0` e informa de `already resolved (same decision)`. Una decisión contradictoria, una aprobación inexistente o vencida, o una decisión no disponible para ese tipo de aprobación muestra un error claro y termina con un código distinto de cero.

`--reason` añade una nota local a la confirmación de la CLI. El registro de aprobación actual del Gateway no tiene un campo de texto libre para el motivo de la resolución, por lo que esta nota no se conserva ni se envía a otras superficies de aprobación.

## Sustituir las aprobaciones desde un archivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` acepta JSON5, no solo JSON estricto. Usa `--file` o `--stdin`, pero no ambos.

Los Nodes nativos del host en Windows utilizan su propia estructura de políticas:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

La CLI lee primero el hash actual del Node y lo envía con la actualización, por lo que las modificaciones locales simultáneas se rechazan en lugar de sobrescribirse. `rules` es obligatorio porque esta operación sustituye la lista completa de reglas del Node; `defaultAction` es opcional. Un Node que indique que su política nativa está deshabilitada no se puede configurar de forma remota; primero habilita o configura la política en ese host. Las políticas nativas del host no admiten los asistentes `allowlist add|remove`.

## Ejemplo de «No solicitar nunca» / YOLO

Establece los valores predeterminados de las aprobaciones del host en `full` + `off` para un host que nunca deba detenerse por las aprobaciones de ejecución:

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

Para los Nodes que exponen un archivo de aprobaciones de OpenClaw, usa el mismo cuerpo con `openclaw approvals set --node <id|name|ip> --stdin`. Los Nodes nativos del host requieren la estructura específica de su propietario que se muestra anteriormente.

Esto modifica únicamente el **archivo de aprobaciones del host**. Para mantener alineada la política solicitada de OpenClaw, establece también:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` es explícito aquí porque `host=auto` sigue significando «entorno aislado cuando esté disponible; de lo contrario, Gateway»: YOLO se refiere a las aprobaciones, no al enrutamiento. Usa `gateway` (o `/exec host=gateway`) cuando se deba ejecutar en el host incluso si hay un entorno aislado configurado.

Si se omite `askFallback`, el valor predeterminado es `deny`. Establece `askFallback: "full"` explícitamente al actualizar un host sin interfaz de usuario que deba conservar el comportamiento de no solicitar nunca.

Atajo local para la misma intención, solo en la máquina local:

```bash
openclaw exec-policy preset yolo
```

## Asistentes de la lista de permitidos

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opciones habituales

`get`, `set` y `allowlist add|remove` admiten:

- `--node <id|name|ip>` (resuelve el identificador, el nombre, la IP o el prefijo del identificador; utiliza el mismo resolutor que `openclaw nodes`)
- `--gateway`
- opciones compartidas de RPC del Node: `--url`, `--token`, `--timeout`, `--json`

Si no se especifica ninguna opción de destino, se utiliza el archivo local de aprobaciones en el disco.

`allowlist add|remove` también admite `--agent <id>` (el valor predeterminado es `"*"` y se aplica a todos los agentes).

`pending` y `resolve` siempre utilizan el Gateway porque las solicitudes pendientes forman parte del estado activo del Gateway. Admiten las opciones compartidas de conexión al Gateway `--url`, `--token` y `--timeout`; `pending` también admite `--json`.

## Notas

- El host de Node debe anunciar `system.execApprovals.get/set` (aplicación de macOS, host de Node sin interfaz gráfica o aplicación complementaria de Windows).
- Los archivos de aprobaciones se almacenan por host en el directorio de estado de OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` o `~/.openclaw/exec-approvals.json` cuando la variable no está establecida.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
