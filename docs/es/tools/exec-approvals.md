---
read_when:
    - Configuración de aprobaciones o listas de permitidos para `exec`
    - Implementación de la experiencia de usuario de aprobación de exec en la aplicación para macOS
    - Revisión de prompts de escape del entorno aislado y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: opciones de política, listas de permitidos y flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-07-22T10:50:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a224a737bcbf63ec543391c9cd0b2978ac3e348040f8edc398d02aafcf6d115a
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de ejecución son la **medida de protección de la aplicación complementaria / el host Node** que permite a un agente
aislado ejecutar comandos en un host real (`gateway` o `node`). Los comandos
solo se ejecutan cuando coinciden la política, la lista de permitidos y la aprobación opcional del usuario.
Las aprobaciones se aplican **además de** la política de herramientas y el control de acceso elevado (el modo elevado
`full` las omite).

Para obtener una descripción general centrada en los modos de `deny`, `allowlist`, `ask`, `auto`, `full`,
la asignación de Codex Guardian y los permisos del entorno ACPX, consulte
[Modos de permisos](/es/tools/permission-modes).

<Note>
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores
predeterminados de las aprobaciones: las aprobaciones solo pueden reforzar la seguridad o las solicitudes derivadas de la configuración, nunca
relajarlas. Si se omite un campo de aprobación, se utiliza el valor de `tools.exec`.
La ejecución en el host también utiliza el estado local de las aprobaciones de esa máquina: un
`ask: "always"` local del host en el archivo de aprobaciones del host de ejecución continúa
solicitando confirmación aunque los valores predeterminados de la sesión o la configuración soliciten `ask: "on-miss"`.
</Note>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **Host del Gateway** -> proceso `openclaw` en la máquina del Gateway.
- **Host Node** -> ejecutor del nodo (aplicación complementaria para macOS o host Node sin interfaz gráfica).

### Modelo de confianza

- Los llamadores autenticados por el Gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados amplían esa capacidad del operador de confianza al host Node.
- Las aprobaciones reducen el riesgo de ejecución accidental, pero **no** constituyen un límite de autenticación por usuario ni una política de solo lectura del sistema de archivos.
- Una vez aprobado, un comando puede modificar archivos conforme a los permisos seleccionados del sistema de archivos del host o del entorno aislado.
- Las ejecuciones aprobadas en el host Node vinculan el contexto de ejecución canónico: el directorio de trabajo, los argumentos exactos, la vinculación del entorno cuando esté presente y la ruta fijada del ejecutable cuando corresponda.
- Para los scripts de shell y las invocaciones directas de archivos mediante intérpretes o entornos de ejecución, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo cambia después de la aprobación pero antes de la ejecución, esta se deniega en lugar de ejecutar contenido modificado.
- La vinculación de archivos se realiza con el máximo esfuerzo posible, pero no representa un modelo completo de todas las rutas de carga de los intérpretes o entornos de ejecución. Si no se puede identificar exactamente un archivo local concreto, OpenClaw se niega a generar una ejecución respaldada por aprobación en lugar de simular una cobertura completa.

### Separación en macOS

- El **servicio del host Node** reenvía `system.run` a la **aplicación para macOS** mediante IPC local.
- La **aplicación para macOS** aplica las aprobaciones y ejecuta el comando en el contexto de la interfaz de usuario.

## Inspección de la política efectiva

| Comando                                                          | Qué muestra                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | La política solicitada, las fuentes de políticas del host y el resultado efectivo.      |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                     |
| `openclaw exec-policy set` / `preset`                            | Sincroniza en un solo paso la política local solicitada con el archivo local de aprobaciones del host. |

<Note>
Las anulaciones de `/exec` por sesión no se incluyen. Ejecute `/exec` en la sesión correspondiente para inspeccionar sus valores predeterminados actuales. Consulte [anulaciones de sesión](/es/tools/exec#session-overrides-exec).
</Note>

Referencia completa de la CLI (opciones, salida JSON y adición o eliminación de elementos de la lista de permitidos): [CLI de aprobaciones](/es/cli/approvals).

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa que ese
ámbito está gestionado por el nodo durante la ejecución, en lugar de considerar el archivo local de aprobaciones
como fuente de verdad.

Si la interfaz de usuario de la aplicación complementaria **no está disponible**, cualquier solicitud que
normalmente requiera confirmación se resuelve mediante la **alternativa de solicitud** (valor predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación mediante chat pueden incorporar mecanismos específicos del canal en el
mensaje de aprobación pendiente. Matrix incorpora accesos directos mediante reacciones (`✅` permitir una vez,
`♾️` permitir siempre, `❌` denegar), a la vez que mantiene `/approve ...` en el
mensaje como alternativa.
</Tip>

## Configuración y almacenamiento

Las aprobaciones se almacenan en un archivo JSON local del host de ejecución. Cuando se
establece `OPENCLAW_STATE_DIR`, el archivo utiliza ese directorio de estado;
de lo contrario, utiliza el directorio de estado predeterminado de OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# de lo contrario
~/.openclaw/exec-approvals.json
```

El socket de aprobación predeterminado utiliza la misma raíz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, o
`~/.openclaw/exec-approvals.sock` cuando la variable no está establecida.

Los directorios de estado son ámbitos de confianza independientes. Cuando `OPENCLAW_STATE_DIR`
apunta a otra ubicación, OpenClaw nunca importa ni archiva
`~/.openclaw/exec-approvals.json`; configure las aprobaciones por separado para el
directorio de estado personalizado. Doctor también importa el archivo heredado
`plugin-binding-approvals.json` únicamente cuando pertenece al directorio de estado
activo.

Ejemplo de esquema:

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
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Controles de política

### `tools.exec.mode`

`tools.exec.mode` es la superficie de política normalizada preferida para la ejecución en el host:

| Valor       | Comportamiento                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Bloquea la ejecución en el host.                                                                                                                                           |
| `allowlist` | Ejecuta únicamente los comandos incluidos en la lista de permitidos sin solicitar confirmación.                                                                            |
| `ask`       | Utiliza la política de lista de permitidos y solicita confirmación cuando no hay coincidencias.                                                                             |
| `auto`      | Utiliza la política de lista de permitidos, ejecuta directamente las coincidencias deterministas y envía los casos sin coincidencia al revisor automático nativo de OpenClaw antes de recurrir a una ruta de aprobación humana. |
| `full`      | Ejecuta comandos en el host sin solicitudes de aprobación.                                                                                                                 |

Doctor migra el par persistente retirado `tools.exec.security` / `tools.exec.ask`
a `tools.exec.mode`.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloquea todas las solicitudes de ejecución en el host.
  - `allowlist` - permite únicamente los comandos incluidos en la lista de permitidos.
  - `full` - permite todo (equivale al modo elevado).

El valor predeterminado es `full` para los hosts del Gateway o Node; un host `sandbox` utiliza
`deny` como valor predeterminado.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de solicitud configurada para la ejecución en el host. Controla el comportamiento base de las
  solicitudes de aprobación de `tools.exec.ask` y los valores predeterminados de las aprobaciones del host.
  El valor predeterminado es `off`. El parámetro por llamada `ask` de la herramienta (consulte
  [Herramienta de ejecución](/es/tools/exec#parameters)) solo puede reforzar esa base, y
  las llamadas al modelo originadas en canales lo ignoran cuando la solicitud efectiva del host es `off`.

- `off` - nunca solicita confirmación.
- `on-miss` - solicita confirmación únicamente cuando no hay coincidencia en la lista de permitidos.
- `always` - solicita confirmación para cada comando. La confianza duradera de `allow-always` **no** suprime las solicitudes cuando el modo de solicitud efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud, pero no se puede acceder a ninguna interfaz de usuario (o la
  solicitud agota el tiempo de espera). Si se omite, el valor predeterminado es `deny`.

- `deny` - bloquea.
- `allowlist` - permite únicamente si hay una coincidencia en la lista de permitidos.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, trata las formas de evaluación de código en línea como sujetas exclusivamente a aprobación, aunque el
  binario del intérprete esté incluido en la lista de permitidos. Proporciona defensa en profundidad para
  cargadores de intérpretes que no se pueden asociar claramente a un único operando de archivo estable.
</ParamField>

Ejemplos detectados por el modo estricto: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (también las formas en línea
`awk`, `sed`, `make`, `find -exec` y `xargs`).

En el modo estricto, estos comandos requieren la aprobación de un revisor o una aprobación explícita. Con
`tools.exec.mode: "auto"`, el revisor puede conceder una ejecución de bajo riesgo cuando
el comando tenga un plan aplicable; de lo contrario, OpenClaw solicita la aprobación de una persona.
Las aprobaciones de comandos `Codex app-server` que llegan a la alternativa del revisor solicitan la aprobación de una
persona porque sus solicitudes de aprobación no exponen un ejecutable resuelto que se pueda aplicar.
`allow-always` no conserva nuevas entradas de la lista de permitidos para comandos de evaluación en línea.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Solo afecta a la presentación: cuando está habilitado, OpenClaw puede adjuntar segmentos de comandos derivados del
  analizador para que las solicitudes de aprobación web puedan resaltar los tokens de los comandos. Esto
  **no** cambia `security`, `ask`, la coincidencia con la lista de permitidos, el comportamiento estricto de evaluación en línea,
  el reenvío de aprobaciones ni la ejecución de comandos.
</ParamField>

Se establece globalmente en `tools.exec.commandHighlighting` o por agente en
`agents.entries.*.tools.exec.commandHighlighting`.

## Modo YOLO (sin aprobación)

Para ejecutar comandos en el host sin solicitudes de aprobación, abra **ambas** capas de políticas:
la política de ejecución solicitada en la configuración de OpenClaw (`tools.exec.*`) **y**
la política local de aprobaciones del host en el archivo de aprobaciones del host de ejecución.

Si se omite `askFallback`, el valor predeterminado es `deny`. Establezca explícitamente `askFallback` del host en `full`
cuando una solicitud de aprobación sin interfaz de usuario deba recurrir a permitir.

| Capa               | Configuración YOLO         |
| ------------------ | -------------------------- |
| `tools.exec.mode`  | `full` en `gateway`/`node` |
| `askFallback` del host | `full`                     |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta exec: en el sandbox cuando está disponible; de lo contrario, en el gateway.
- YOLO elige **cómo** se aprueba la ejecución en el host: `security=full` más `ask=off`.
- YOLO **no** añade una puerta de aprobación heurística independiente para la ofuscación de comandos ni una capa de rechazo de comprobación previa de scripts además de la política de ejecución en el host configurada.
- `auto` no convierte el enrutamiento al gateway en una anulación libre desde una sesión en sandbox. Se permite una solicitud `host=node` por llamada desde `auto`; `host=gateway` solo se permite desde `auto` cuando no hay ningún entorno de ejecución de sandbox activo. Para establecer un valor predeterminado estable que no sea automático, configure `tools.exec.host` o use `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. La CLI de Claude añade
`--permission-mode bypassPermissions` cuando la política de ejecución efectiva
de OpenClaw es YOLO. Para las sesiones en vivo de Claude administradas por OpenClaw, la
política de ejecución efectiva de OpenClaw prevalece sobre el modo de permisos nativo de Claude:
YOLO normaliza los inicios en vivo a `--permission-mode bypassPermissions`, y
una política de ejecución efectiva restrictiva normaliza los inicios en vivo a
`--permission-mode default`, incluso si los argumentos sin procesar del backend de Claude especifican otro
modo.

Si se desea una configuración más conservadora, restrinja de nuevo la política de ejecución de OpenClaw a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente «no preguntar nunca» para el host del Gateway

<Steps>
  <Step title="Establecer la política de configuración solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.mode full
    openclaw gateway restart
    ```
  </Step>
  <Step title="Hacer coincidir el archivo de aprobaciones del host">
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
  </Step>
</Steps>

### Atajo local

```bash
openclaw exec-policy preset yolo
```

Actualiza tanto el `tools.exec.host/security/ask` local como los valores predeterminados del archivo
de aprobaciones local (incluido `askFallback: "full"`). Es intencionadamente
solo local. Para cambiar de forma remota las aprobaciones del host del Gateway o del host del Node, use
`openclaw approvals set --gateway` o `openclaw approvals set --node
<id|name|ip>`.

Otros ajustes preestablecidos integrados: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) y `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Se aplican del mismo modo:
`openclaw exec-policy preset cautious`.

Para establecer campos individuales en lugar de un ajuste preestablecido completo, use
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` con cualquier subconjunto de esas opciones.

### Host del Node

Aplique en su lugar el mismo archivo de aprobaciones en el Node:

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

<Note>
**Limitaciones de la operación solo local:**

- `openclaw exec-policy` no sincroniza las aprobaciones del Node.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de ejecución del Node se obtienen del Node durante la ejecución, por lo que las actualizaciones dirigidas al Node deben usar `openclaw approvals --node ...`.

</Note>

### Atajo solo para la sesión

- `/exec security=full ask=off` cambia únicamente la sesión actual.
- `/elevated full` es un atajo de emergencia que omite las aprobaciones de ejecución solo
  cuando tanto la política solicitada como el archivo de aprobaciones del host se resuelven como
  `security: "full"` y `ask: "off"`. Un archivo del host más estricto, como `ask:
"always"`, sigue solicitando aprobación.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política
más estricta del host continúa prevaleciendo.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambie el agente
que se está editando en la aplicación para macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de rutas de binarios resueltas o globs de nombres de comandos simples.
Los nombres simples solo coinciden con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Use un glob de ruta para confiar en una ubicación de binario específica.

Las entradas `agents.default` heredadas se migran a `agents.main` al cargarse.
Las cadenas de shell como `echo ok && pwd` siguen requiriendo que cada segmento de nivel superior
cumpla las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restricción de argumentos con argPattern

Añada `argPattern` cuando una entrada de la lista de permitidos deba coincidir con un binario y una
forma específica de argumentos. OpenClaw utiliza la semántica de expresiones regulares
ECMAScript (JavaScript) en todos los hosts y evalúa la expresión con respecto
a los argumentos analizados del comando, sin incluir el token del ejecutable (`argv[0]`).
En las entradas creadas manualmente, los argumentos se unen con un solo espacio, por lo que
debe delimitar el patrón cuando necesite una coincidencia exacta.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Esa entrada permite `python3 safe.py`; `python3 other.py` no coincide con la lista
de permitidos. Si también existe una entrada que solo contiene la ruta para el mismo binario, los
argumentos que no coincidan aún pueden recurrir a esa entrada que solo contiene la ruta. Omita la entrada
que solo contiene la ruta cuando el objetivo sea restringir el binario a los argumentos declarados.

Las entradas guardadas por los flujos de aprobación utilizan un formato de separador interno para la coincidencia
exacta de argv. Es preferible usar la interfaz de usuario o el flujo de aprobación para regenerar esas entradas
en lugar de editar manualmente el valor codificado. Si OpenClaw no puede analizar argv
para un segmento del comando, las entradas con `argPattern` no coinciden.

Cada entrada de la lista de permitidos admite:

| Campo              | Significado                                              |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | Glob de ruta de binario resuelta o glob de nombre de comando simple  |
| `argPattern`       | Expresión regular ECMAScript de argv opcional; si se omite, solo se usa la ruta |
| `id`               | ID opaco estable; se genera como UUID cuando no está presente    |
| `source`           | Origen de la entrada, como `allow-always`                 |
| `commandText`      | Entrada heredada de texto sin formato; se descarta durante la carga        |
| `lastUsedAt`       | Marca de tiempo del último uso                                  |
| `lastUsedCommand`  | Último comando que coincidió                            |
| `lastResolvedPath` | Última ruta de binario resuelta                            |

## Permitir automáticamente las CLI de Skills

Cuando **Permitir automáticamente las CLI de Skills** (`autoAllowSkills`) está habilitado, los ejecutables
a los que hacen referencia Skills conocidas se tratan como incluidos en la lista de permitidos en los Nodes (Node de macOS
o host de Node sin interfaz gráfica). Esto usa `skills.bins` mediante el RPC del Gateway para
obtener la lista de binarios de Skills. Deshabilite esta opción si desea listas de permitidos manuales
estrictas.

<Warning>
- Esta es una **lista de permitidos implícita por comodidad**, independiente de las entradas manuales de la lista de permitidos por ruta.
- Está destinada a entornos de operadores de confianza donde el Gateway y el Node se encuentran dentro del mismo límite de confianza.
- Si se requiere una confianza explícita estricta, mantenga `autoAllowSkills: false` y use únicamente entradas manuales de la lista de permitidos por ruta.

</Warning>

## Binarios seguros y reenvío de aprobaciones

Para obtener información sobre los binarios seguros (la ruta rápida solo para stdin), los detalles de vinculación
del intérprete y cómo reenviar las solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como
clientes de aprobación nativos), consulte
[Aprobaciones de ejecución: opciones avanzadas](/es/tools/exec-approvals-advanced).

## Edición en la interfaz de control

Use la tarjeta **Control UI -> Nodes -> Exec approvals** para editar los valores predeterminados,
las anulaciones por agente y las listas de permitidos. Elija un ámbito (Defaults o un agente),
ajuste la política, añada o elimine patrones de la lista de permitidos y, a continuación, pulse **Save**. La interfaz de usuario
muestra los metadatos del último uso de cada patrón para facilitar el mantenimiento de la lista.

El selector de destino permite elegir **Gateway** (aprobaciones locales) o un **Node**.
Los Nodes deben anunciar `system.execApprovals.get/set` (aplicación para macOS o
host de Node sin interfaz gráfica). Si un Node aún no anuncia las aprobaciones de ejecución, edite directamente
su archivo de aprobaciones local.

Algunos hosts de Node, incluido el complemento para Windows, tienen un formato de política
de aprobación diferente. La interfaz de control muestra estas políticas nativas del host en modo de solo lectura. Use la
aplicación complementaria o `openclaw approvals set --node <id|name|ip>` con la forma de política
nativa para editarlas; consulte la [CLI de aprobaciones](/es/cli/approvals).

CLI: `openclaw approvals` permite editar el Gateway o el Node; consulte la
[CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el Gateway difunde
`exec.approval.requested` a los clientes del operador. La interfaz de control y la aplicación para macOS
la resuelven mediante `exec.approval.resolve` y, a continuación, el Gateway reenvía la
solicitud aprobada al host del Node.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`.
El Gateway usa ese plan como contexto autoritativo de comando/cwd/sesión
al reenviar solicitudes `system.run` aprobadas:

- La ruta de ejecución del Node prepara por adelantado un único plan canónico.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada `system.run` final reenviada reutiliza el plan almacenado en lugar de confiar en modificaciones posteriores de quien realiza la llamada.
- Si quien realiza la llamada cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de crear la solicitud de aprobación, el Gateway rechaza la ejecución reenviada por discrepancia con la aprobación.

## Eventos del sistema y denegaciones

El ciclo de vida de la ejecución publica un mensaje del sistema `Exec finished` en la
sesión del agente después de que el Node informa de que ha finalizado. OpenClaw también puede emitir un
aviso de ejecución en curso una vez concedida una aprobación, después de que
transcurra `tools.exec.approvalRunningNoticeMs` (valor predeterminado: `10000`; `0` lo deshabilita).
Las aprobaciones de ejecución denegadas son terminales para el comando del host: el comando
no se ejecuta.

- Para las aprobaciones asíncronas del agente principal con una sesión de origen, OpenClaw
  publica la denegación en esa sesión como un seguimiento interno para que el
  agente pueda dejar de esperar el comando asíncrono y evitar una reparación
  por resultado ausente.
- Si no hay ninguna sesión o esta no puede reanudarse, OpenClaw aún puede
  informar de forma concisa de la denegación al operador o a la ruta de chat directo.
- Las denegaciones de sesiones de subagentes y Cron no se publican en esa
  sesión.

Las aprobaciones de ejecución del host del Gateway emiten el mismo evento de finalización del ciclo de vida.
Las ejecuciones sujetas a aprobación reutilizan el ID de aprobación para correlacionar la solicitud
pendiente con su mensaje de finalización o denegación (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implicaciones

- **`full`** es potente; prefiera las listas de permitidos cuando sea posible.
- **`ask`** permite mantener el control y, al mismo tiempo, realizar aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a las solicitudes de ejecución en el host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una opción práctica a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear por completo la ejecución en el host, establezca la seguridad de las aprobaciones en `deny` o deniegue la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprobaciones de ejecución: opciones avanzadas" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación de intérpretes y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta de ejecución" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Vía de emergencia que también omite las aprobaciones.
  </Card>
  <Card title="Aislamiento" href="/es/gateway/sandboxing" icon="box">
    Modos de aislamiento y acceso al espacio de trabajo.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y refuerzo.
  </Card>
  <Card title="Aislamiento frente a política de herramientas frente a modo elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo recurrir a cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de autorización automática respaldado por Skills.
  </Card>
</CardGroup>
