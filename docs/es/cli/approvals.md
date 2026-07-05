---
read_when:
    - Quieres editar las aprobaciones de ejecución desde la CLI
    - Debe gestionar las listas de permitidos en hosts de Gateway o Node
summary: Referencia de la CLI para `openclaw approvals` y `openclaw exec-policy`
title: Aprobaciones
x-i18n:
    generated_at: "2026-07-05T11:08:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30e1f55104d5f762d7eec95f2bba5e0cc52acb3005255aa9fd5c121fb959a0e7
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gestiona las aprobaciones de ejecución para el **host local**, el **host de Gateway** o un **host de nodo**. Sin una marca de destino, los comandos leen/escriben el archivo local de aprobaciones en disco. Usa `--gateway` para apuntar al Gateway, o `--node <id|name|ip>` para apuntar a un nodo específico.

Alias: `openclaw exec-approvals`

Relacionado: [Aprobaciones de ejecución](/es/tools/exec-approvals), [Nodos](/es/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` es el comando práctico **solo local** que mantiene sincronizados en un solo paso la configuración `tools.exec.*` solicitada y el archivo local de aprobaciones del host:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Los preajustes (`yolo`, `cautious`, `deny-all`) aplican `host`, `security`, `ask` y `askFallback` juntos. `set` aplica solo las marcas que pases; cada valor aceptado se valida (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Ámbito:

- Actualiza juntos el archivo de configuración local y el archivo local de aprobaciones; no envía la política al Gateway ni a un host de nodo.
- `--host node` se rechaza: las aprobaciones de ejecución del nodo se obtienen del nodo en tiempo de ejecución, por lo que `exec-policy` local no puede sincronizarlas. Usa `openclaw approvals set --node <id|name|ip>` en su lugar.
- `exec-policy show` marca los ámbitos `host=node` como gestionados por el nodo en tiempo de ejecución, en lugar de derivar una política efectiva del archivo local de aprobaciones.

Para aprobaciones de host remoto, usa directamente `openclaw approvals set --gateway` o `openclaw approvals set --node <id|name|ip>`.

## Comandos comunes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` muestra la política de ejecución efectiva para el destino: la política `tools.exec` solicitada, la política del archivo de aprobaciones del host y el resultado efectivo combinado.

Precedencia:

- El archivo de aprobaciones del host es la fuente de verdad aplicable.
- La política `tools.exec` solicitada puede restringir o ampliar la intención, pero el resultado efectivo se deriva de las reglas del host.
- `--node` combina el archivo de aprobaciones del host de nodo con la política `tools.exec` del Gateway (ambas se aplican en tiempo de ejecución).
- Si la configuración del Gateway no está disponible, la CLI recurre a la instantánea de aprobaciones del nodo e indica que no se pudo calcular la política final en tiempo de ejecución.

## Reemplazar aprobaciones desde un archivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` acepta JSON5, no solo JSON estricto. Usa `--file` o `--stdin`, no ambos.

## Ejemplo de "Nunca preguntar" / YOLO

Establece los valores predeterminados de aprobaciones del host en `full` + `off` para un host que nunca debe detenerse por aprobaciones de ejecución:

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

Variante de nodo: el mismo cuerpo con `openclaw approvals set --node <id|name|ip> --stdin`.

Esto cambia solo el **archivo de aprobaciones del host**. Para mantener alineada la política solicitada de OpenClaw, establece también:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` es explícito aquí porque `host=auto` aún significa "sandbox cuando esté disponible; de lo contrario, Gateway": YOLO trata sobre aprobaciones, no sobre enrutamiento. Usa `gateway` (o `/exec host=gateway`) cuando quieras ejecución en el host incluso con un sandbox configurado.

Si se omite `askFallback`, el valor predeterminado es `deny`. Establece `askFallback: "full"` explícitamente al actualizar un host sin interfaz de usuario que debe mantener el comportamiento de nunca preguntar.

Atajo local para la misma intención, solo en la máquina local:

```bash
openclaw exec-policy preset yolo
```

## Ayudantes de allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opciones comunes

`get`, `set` y `allowlist add|remove` admiten:

- `--node <id|name|ip>` (resuelve id, nombre, IP o prefijo de id; el mismo resolvedor que `openclaw nodes`)
- `--gateway`
- opciones RPC de nodo compartidas: `--url`, `--token`, `--timeout`, `--json`

Sin marca de destino, se usa el archivo local de aprobaciones en disco.

`allowlist add|remove` también admite `--agent <id>` (el valor predeterminado es `"*"`, aplicándose a todos los agentes).

## Notas

- El host de nodo debe anunciar `system.execApprovals.get/set` (aplicación macOS o host de nodo sin interfaz).
- Los archivos de aprobaciones se almacenan por host en el directorio de estado de OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`, o `~/.openclaw/exec-approvals.json` cuando la variable no está establecida.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
