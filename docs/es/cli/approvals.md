---
read_when:
    - Quieres editar aprobaciones de ejecución desde la CLI
    - Necesitas gestionar listas de permitidos en hosts Gateway o Node
summary: Referencia de la CLI para `openclaw approvals` y `openclaw exec-policy`
title: Aprobaciones
x-i18n:
    generated_at: "2026-04-24T05:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gestiona las aprobaciones de ejecución para el **host local**, el **host Gateway** o un **host Node**.
De forma predeterminada, los comandos apuntan al archivo local de aprobaciones en disco. Usa `--gateway` para apuntar al Gateway, o `--node` para apuntar a un Node específico.

Alias: `openclaw exec-approvals`

Relacionado:

- Aprobaciones de ejecución: [Exec approvals](/es/tools/exec-approvals)
- Nodes: [Nodes](/es/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` es el comando local de conveniencia para mantener alineados en un solo paso la configuración solicitada de
`tools.exec.*` y el archivo local de aprobaciones del host.

Úsalo cuando quieras:

- inspeccionar la política local solicitada, el archivo de aprobaciones del host y la combinación efectiva
- aplicar un preset local como YOLO o denegar todo
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
- con `--json`: imprime salida estructurada legible por máquina

Alcance actual:

- `exec-policy` es **solo local**
- actualiza juntos el archivo de configuración local y el archivo local de aprobaciones
- **no** envía la política al host Gateway ni a un host Node
- `--host node` se rechaza en este comando porque las aprobaciones de ejecución del Node se obtienen del Node en tiempo de ejecución y deben gestionarse mediante comandos de aprobaciones dirigidos a Nodes
- `openclaw exec-policy show` marca los alcances `host=node` como gestionados por el Node en tiempo de ejecución en lugar de derivar una política efectiva del archivo local de aprobaciones

Si necesitas editar directamente aprobaciones de hosts remotos, sigue usando `openclaw approvals set --gateway`
o `openclaw approvals set --node <id|name|ip>`.

## Comandos comunes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` ahora muestra la política efectiva de ejecución para destinos locales, Gateway y Node:

- política solicitada de `tools.exec`
- política del archivo de aprobaciones del host
- resultado efectivo después de aplicar las reglas de precedencia

La precedencia es intencional:

- el archivo de aprobaciones del host es la fuente de verdad aplicable
- la política solicitada de `tools.exec` puede restringir o ampliar la intención, pero el resultado efectivo sigue derivándose de las reglas del host
- `--node` combina el archivo de aprobaciones del host Node con la política `tools.exec` del Gateway, porque ambas siguen aplicándose en tiempo de ejecución
- si la configuración del Gateway no está disponible, la CLI recurre a la instantánea de aprobaciones del Node y señala que no se pudo calcular la política final de tiempo de ejecución

## Reemplazar aprobaciones desde un archivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` acepta JSON5, no solo JSON estricto. Usa `--file` o `--stdin`, no ambos.

## Ejemplo de «no preguntar nunca» / YOLO

Para un host que nunca debe detenerse por aprobaciones de ejecución, establece los valores predeterminados del archivo de aprobaciones del host en `full` + `off`:

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

Esto cambia solo el **archivo de aprobaciones del host**. Para mantener alineada la política solicitada de OpenClaw, establece también:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Por qué `tools.exec.host=gateway` en este ejemplo:

- `host=auto` sigue significando «sandbox cuando esté disponible; en caso contrario, Gateway».
- YOLO trata sobre aprobaciones, no sobre enrutamiento.
- Si quieres ejecución en host incluso cuando hay un sandbox configurado, haz explícita la elección del host con `gateway` o `/exec host=gateway`.

Esto coincide con el comportamiento actual de YOLO predeterminado para host. Restringe más si quieres aprobaciones.

Atajo local:

```bash
openclaw exec-policy preset yolo
```

Ese atajo local actualiza tanto la configuración local solicitada de `tools.exec.*` como los valores predeterminados locales de aprobaciones.
Es equivalente en intención a la configuración manual de dos pasos anterior, pero solo para la máquina local.

## Ayudantes de lista de permitidos

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

Notas sobre el destino:

- sin flags de destino significa el archivo local de aprobaciones en disco
- `--gateway` apunta al archivo de aprobaciones del host Gateway
- `--node` apunta a un host Node después de resolver id, nombre, IP o prefijo de id

`allowlist add|remove` también admite:

- `--agent <id>` (predeterminado: `*`)

## Notas

- `--node` usa el mismo resolvedor que `openclaw nodes` (id, nombre, ip o prefijo de id).
- `--agent` tiene como valor predeterminado `"*"`, lo que se aplica a todos los agentes.
- El host Node debe anunciar `system.execApprovals.get/set` (app de macOS o host Node sin interfaz).
- Los archivos de aprobaciones se almacenan por host en `~/.openclaw/exec-approvals.json`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Exec approvals](/es/tools/exec-approvals)
