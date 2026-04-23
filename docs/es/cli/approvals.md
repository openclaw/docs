---
read_when:
    - Quiere editar las aprobaciones de ejecución desde la CLI
    - Necesita gestionar listas de permitidos en hosts de Gateway o Node
summary: Referencia de CLI para `openclaw approvals` y `openclaw exec-policy`
title: aprobaciones
x-i18n:
    generated_at: "2026-04-23T14:00:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gestione las aprobaciones de ejecución para el **host local**, el **host del Gateway** o un **host de Node**.
De forma predeterminada, los comandos apuntan al archivo local de aprobaciones en disco. Use `--gateway` para apuntar al Gateway, o `--node` para apuntar a un Node específico.

Alias: `openclaw exec-approvals`

Relacionado:

- Aprobaciones de ejecución: [Exec approvals](/es/tools/exec-approvals)
- Nodes: [Nodes](/es/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` es el comando local de conveniencia para mantener alineados en un solo paso la configuración solicitada de `tools.exec.*` y el archivo local de aprobaciones del host.

Úselo cuando quiera:

- inspeccionar la política local solicitada, el archivo de aprobaciones del host y la combinación efectiva
- aplicar un preajuste local como YOLO o deny-all
- sincronizar `tools.exec.*` local y `~/.openclaw/exec-approvals.json` local

Ejemplos:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Modos de salida:

- sin `--json`: imprime la vista de tabla legible para humanos
- con `--json`: imprime salida estructurada legible por máquinas

Alcance actual:

- `exec-policy` es **solo local**
- actualiza juntos el archivo de configuración local y el archivo local de aprobaciones
- **no** envía la política al host del Gateway ni a un host de Node
- `--host node` se rechaza en este comando porque las aprobaciones de ejecución de Node se obtienen del Node en tiempo de ejecución y, en su lugar, deben gestionarse mediante comandos de aprobaciones dirigidos a Node
- `openclaw exec-policy show` marca los alcances `host=node` como gestionados por Node en tiempo de ejecución en lugar de derivar una política efectiva del archivo local de aprobaciones

Si necesita editar directamente las aprobaciones de un host remoto, siga usando `openclaw approvals set --gateway`
o `openclaw approvals set --node <id|name|ip>`.

## Comandos comunes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` ahora muestra la política efectiva de ejecución para destinos locales, de Gateway y de Node:

- política solicitada de `tools.exec`
- política del archivo de aprobaciones del host
- resultado efectivo después de aplicar las reglas de precedencia

La precedencia es intencional:

- el archivo de aprobaciones del host es la fuente de verdad aplicable
- la política solicitada de `tools.exec` puede restringir o ampliar la intención, pero el resultado efectivo sigue derivándose de las reglas del host
- `--node` combina el archivo de aprobaciones del host de Node con la política `tools.exec` del Gateway, porque ambas siguen aplicándose en tiempo de ejecución
- si la configuración del Gateway no está disponible, la CLI vuelve a la instantánea de aprobaciones del Node y señala que no pudo calcularse la política final de tiempo de ejecución

## Sustituir aprobaciones desde un archivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` acepta JSON5, no solo JSON estricto. Use `--file` o `--stdin`, no ambos.

## Ejemplo de “nunca preguntar” / YOLO

Para un host que nunca debe detenerse en aprobaciones de ejecución, establezca los valores predeterminados de aprobaciones del host en `full` + `off`:

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

Variante para Node:

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

Esto cambia **solo** el archivo de aprobaciones del host. Para mantener alineada la política solicitada de OpenClaw, establezca también:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Por qué `tools.exec.host=gateway` en este ejemplo:

- `host=auto` sigue significando “sandbox cuando esté disponible; en caso contrario, Gateway”.
- YOLO trata sobre aprobaciones, no sobre enrutamiento.
- Si quiere ejecución en el host incluso cuando hay un sandbox configurado, haga explícita la elección del host con `gateway` o `/exec host=gateway`.

Esto coincide con el comportamiento actual de YOLO predeterminado del host. Endurézcalo si quiere aprobaciones.

Atajo local:

```bash
openclaw exec-policy preset yolo
```

Ese atajo local actualiza juntos tanto la configuración local solicitada de `tools.exec.*` como los valores predeterminados de aprobaciones locales. Equivale en intención a la configuración manual de dos pasos anterior, pero solo para la máquina local.

## Ayudantes de allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opciones comunes

`get`, `set` y `allowlist add|remove` admiten:

- `--node <id|name|ip>`
- `--gateway`
- opciones compartidas de RPC de Node: `--url`, `--token`, `--timeout`, `--json`

Notas sobre destinos:

- sin indicadores de destino significa el archivo local de aprobaciones en disco
- `--gateway` apunta al archivo de aprobaciones del host del Gateway
- `--node` apunta a un host de Node después de resolver id, nombre, IP o prefijo de id

`allowlist add|remove` también admite:

- `--agent <id>` (predeterminado: `*`)

## Notas

- `--node` usa el mismo resolvedor que `openclaw nodes` (id, nombre, ip o prefijo de id).
- `--agent` tiene como valor predeterminado `"*"`, que se aplica a todos los agentes.
- El host de Node debe anunciar `system.execApprovals.get/set` (app de macOS o host de Node sin interfaz).
- Los archivos de aprobaciones se almacenan por host en `~/.openclaw/exec-approvals.json`.
