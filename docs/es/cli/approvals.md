---
read_when:
    - Quieres editar las aprobaciones de ejecución desde la CLI
    - Necesitas gestionar listas de permitidos en hosts de gateway o node
summary: Referencia de CLI para `openclaw approvals` y `openclaw exec-policy`
title: Aprobaciones
x-i18n:
    generated_at: "2026-06-27T10:56:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gestiona las aprobaciones de exec para el **host local**, el **host de Gateway** o un **host de nodo**.
De forma predeterminada, los comandos apuntan al archivo local de aprobaciones en disco. Usa `--gateway` para apuntar al Gateway, o `--node` para apuntar a un nodo específico.

Alias: `openclaw exec-approvals`

Relacionado:

- Aprobaciones de exec: [Aprobaciones de exec](/es/tools/exec-approvals)
- Nodos: [Nodos](/es/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` es el comando local de conveniencia para mantener la configuración
`tools.exec.*` solicitada y el archivo de aprobaciones del host local alineados en un solo paso.

Úsalo cuando quieras:

- inspeccionar la política local solicitada, el archivo de aprobaciones del host y la fusión efectiva
- aplicar un preajuste local como YOLO o denegar todo
- sincronizar `tools.exec.*` local y el archivo de aprobaciones del host local

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
- `--json`: imprime salida estructurada legible por máquina

Alcance actual:

- `exec-policy` es **solo local**
- actualiza juntos el archivo de configuración local y el archivo de aprobaciones local
- **no** envía la política al host de Gateway ni a un host de nodo
- `--host node` se rechaza en este comando porque las aprobaciones de exec de nodo se obtienen del nodo en tiempo de ejecución y, en su lugar, deben administrarse mediante comandos de aprobaciones dirigidos a nodos
- `openclaw exec-policy show` marca los alcances `host=node` como administrados por el nodo en tiempo de ejecución en lugar de derivar una política efectiva del archivo de aprobaciones local

Si necesitas editar directamente las aprobaciones de un host remoto, sigue usando `openclaw approvals set --gateway`
o `openclaw approvals set --node <id|name|ip>`.

## Comandos comunes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` ahora muestra la política de exec efectiva para destinos locales, de Gateway y de nodo:

- política `tools.exec` solicitada
- política del archivo de aprobaciones del host
- resultado efectivo después de aplicar las reglas de precedencia

La precedencia es intencional:

- el archivo de aprobaciones del host es la fuente de verdad exigible
- la política `tools.exec` solicitada puede restringir o ampliar la intención, pero el resultado efectivo se sigue derivando de las reglas del host
- `--node` combina el archivo de aprobaciones del host de nodo con la política `tools.exec` de Gateway, porque ambas siguen aplicándose en tiempo de ejecución
- si la configuración de Gateway no está disponible, la CLI recurre a la instantánea de aprobaciones del nodo e indica que no se pudo calcular la política final de tiempo de ejecución

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

## Ejemplo de "No preguntar nunca" / YOLO

Para un host que nunca debe detenerse por aprobaciones de exec, establece los valores predeterminados de aprobaciones del host en `full` + `off`:

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

Variante de nodo:

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

- `host=auto` todavía significa "sandbox cuando esté disponible; de lo contrario, Gateway".
- YOLO trata de aprobaciones, no de enrutamiento.
- Si quieres exec en host incluso cuando hay un sandbox configurado, haz explícita la elección de host con `gateway` o `/exec host=gateway`.

`askFallback` omitido usa `deny` de forma predeterminada. Establece `askFallback: "full"`
explícitamente al actualizar un host sin interfaz de usuario que debe mantener el comportamiento de no preguntar nunca.

Atajo local:

```bash
openclaw exec-policy preset yolo
```

Ese atajo local actualiza juntos tanto la configuración local `tools.exec.*` solicitada como los
valores predeterminados de aprobaciones locales. Es equivalente en intención a la configuración manual
de dos pasos anterior, pero solo para la máquina local.

## Ayudantes de lista de permitidos

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opciones comunes

`get`, `set` y `allowlist add|remove` admiten todos:

- `--node <id|name|ip>`
- `--gateway`
- opciones RPC compartidas de nodo: `--url`, `--token`, `--timeout`, `--json`

Notas de destino:

- sin marcas de destino significa el archivo local de aprobaciones en disco
- `--gateway` apunta al archivo de aprobaciones del host de Gateway
- `--node` apunta a un host de nodo después de resolver id, nombre, IP o prefijo de id

`allowlist add|remove` también admite:

- `--agent <id>` (el valor predeterminado es `*`)

## Notas

- `--node` usa el mismo resolvedor que `openclaw nodes` (id, nombre, ip o prefijo de id).
- `--agent` usa `"*"` de forma predeterminada, lo que se aplica a todos los agentes.
- El host de nodo debe anunciar `system.execApprovals.get/set` (app de macOS o host de nodo sin interfaz).
- Los archivos de aprobaciones se almacenan por host en el directorio de estado de OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está establecida).

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Aprobaciones de exec](/es/tools/exec-approvals)
