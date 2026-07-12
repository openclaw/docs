---
read_when:
    - Quieres editar las aprobaciones de ejecución desde la CLI
    - Necesitas gestionar las listas de permitidos en los hosts del Gateway o de los Node.
summary: Referencia de la CLI para `openclaw approvals` y `openclaw exec-policy`
title: Aprobaciones
x-i18n:
    generated_at: "2026-07-11T22:55:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gestiona las aprobaciones de ejecución para el **host local**, el **host del Gateway** o un **host de Node**. Si no se especifica ninguna opción de destino, los comandos leen o escriben el archivo local de aprobaciones en el disco. Usa `--gateway` para seleccionar el Gateway o `--node <id|name|ip>` para seleccionar un Node específico.

Alias: `openclaw exec-approvals`

Relacionado: [Aprobaciones de ejecución](/es/tools/exec-approvals), [Nodos](/es/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` es el comando auxiliar **exclusivamente local** que sincroniza en un solo paso la configuración solicitada de `tools.exec.*` y el archivo de aprobaciones del host local:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Los preajustes (`yolo`, `cautious`, `deny-all`) aplican conjuntamente `host`, `security`, `ask` y `askFallback`. `set` solo aplica las opciones que proporcionas; cada valor aceptado se valida (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Ámbito:

- Actualiza conjuntamente el archivo de configuración local y el archivo de aprobaciones local; no envía la política al Gateway ni a un host de Node.
- Se rechaza `--host node`: las aprobaciones de ejecución de los Nodes se obtienen del Node durante la ejecución, por lo que `exec-policy` local no puede sincronizarlas. Usa `openclaw approvals set --node <id|name|ip>` en su lugar.
- `exec-policy show` marca los ámbitos con `host=node` como administrados por el Node durante la ejecución, en lugar de derivar una política efectiva del archivo de aprobaciones local.

Para las aprobaciones de hosts remotos, usa directamente `openclaw approvals set --gateway` u `openclaw approvals set --node <id|name|ip>`.

## Comandos habituales

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` muestra la política de ejecución efectiva para el destino: la política solicitada de `tools.exec`, la política del archivo de aprobaciones del host y el resultado efectivo combinado. Los Nodes con una política nativa del host, como la aplicación complementaria para Windows, muestran esa política directamente en lugar de aplicar la lógica de combinación de la política del archivo de aprobaciones de OpenClaw.

Para los Nodes respaldados por archivos, la vista combinada requiere una instantánea de la política resuelta por el host. Los Nodes antiguos muestran que la política efectiva no está disponible, en lugar de suponer que la política solicitada del Gateway también se aplica en el host.

<Note>
No se incluyen las anulaciones de `/exec` por sesión. Ejecuta `/exec` en la sesión correspondiente para consultar sus valores predeterminados actuales.
</Note>

Precedencia:

- El archivo de aprobaciones del host es la fuente de verdad aplicable.
- La política solicitada de `tools.exec` puede restringir o ampliar la intención, pero el resultado efectivo se deriva de las reglas del host.
- `--node` combina el archivo de aprobaciones del host de Node con la política `tools.exec` del Gateway (ambas se aplican durante la ejecución).
- Si la configuración del Gateway no está disponible, la CLI recurre a la instantánea de aprobaciones del Node e indica que no se pudo calcular la política final de ejecución.

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

Los Nodes de Windows con política nativa del host usan su propia estructura de política:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

La CLI primero lee el hash actual del Node y lo envía con la actualización, de modo que las modificaciones locales simultáneas se rechacen en lugar de sobrescribirse. `rules` es obligatorio porque esta operación sustituye la lista completa de reglas del Node; `defaultAction` es opcional. Un Node que indique que su política nativa está desactivada no puede configurarse de forma remota; primero activa o configura la política en ese host. Las políticas nativas del host no admiten los comandos auxiliares `allowlist add|remove`.

## Ejemplo de «no preguntar nunca» / YOLO

Establece los valores predeterminados de aprobación del host en `full` + `off` para un host que nunca deba detenerse por aprobaciones de ejecución:

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

Para los Nodes que exponen un archivo de aprobaciones de OpenClaw, usa el mismo contenido con `openclaw approvals set --node <id|name|ip> --stdin`. Los Nodes con política nativa del host requieren la estructura específica de su propietario que se muestra anteriormente.

Esto solo modifica el **archivo de aprobaciones del host**. Para mantener alineada la política solicitada de OpenClaw, establece también:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` se especifica explícitamente aquí porque `host=auto` sigue significando «entorno aislado cuando esté disponible; de lo contrario, Gateway»: YOLO se refiere a las aprobaciones, no al enrutamiento. Usa `gateway` (o `/exec host=gateway`) cuando quieras ejecutar comandos en el host incluso si hay un entorno aislado configurado.

Si se omite `askFallback`, el valor predeterminado es `deny`. Establece explícitamente `askFallback: "full"` al actualizar un host sin interfaz de usuario que deba conservar el comportamiento de no preguntar nunca.

Atajo local para obtener el mismo resultado, solo en la máquina local:

```bash
openclaw exec-policy preset yolo
```

## Comandos auxiliares de la lista de permitidos

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opciones habituales

`get`, `set` y `allowlist add|remove` admiten:

- `--node <id|name|ip>` (resuelve un identificador, nombre, dirección IP o prefijo de identificador; usa el mismo mecanismo de resolución que `openclaw nodes`)
- `--gateway`
- opciones de RPC de Node compartidas: `--url`, `--token`, `--timeout`, `--json`

Si no se especifica ninguna opción de destino, se utiliza el archivo local de aprobaciones almacenado en el disco.

`allowlist add|remove` también admite `--agent <id>` (su valor predeterminado es `"*"`, por lo que se aplica a todos los agentes).

## Notas

- El host de Node debe anunciar `system.execApprovals.get/set` (aplicación para macOS, host de Node sin interfaz gráfica o aplicación complementaria para Windows).
- Los archivos de aprobaciones se almacenan por host en el directorio de estado de OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` o `~/.openclaw/exec-approvals.json` cuando la variable no está definida.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
