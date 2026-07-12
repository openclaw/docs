---
read_when:
    - Configuración de aprobaciones de ejecución o listas de permitidos
    - Implementación de la experiencia de usuario de aprobación de ejecución en la aplicación para macOS
    - Revisión de prompts de escape del entorno aislado y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: opciones de política, listas de permitidos y flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-07-11T23:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de ejecución son la **medida de protección de la aplicación complementaria / host de nodo** que permite que un agente aislado ejecute comandos en un host real (`gateway` o `node`). Los comandos se ejecutan únicamente cuando coinciden la política, la lista de permitidos y la aprobación opcional del usuario. Las aprobaciones se aplican **además de** la política de herramientas y el control de elevación (`full` con privilegios elevados las omite).

Para obtener una descripción general centrada en los modos `deny`, `allowlist`, `ask`, `auto` y `full`, la asignación de Codex Guardian y los permisos del entorno de pruebas ACPX, consulta [Modos de permisos](/es/tools/permission-modes).

<Note>
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores predeterminados de las aprobaciones: las aprobaciones solo pueden endurecer la seguridad o la solicitud de confirmación derivadas de la configuración, nunca relajarlas. Si se omite un campo de aprobaciones, se utiliza el valor de `tools.exec`. La ejecución en el host también utiliza el estado local de las aprobaciones de esa máquina: un `ask: "always"` local del host en el archivo de aprobaciones del host de ejecución seguirá solicitando confirmación aunque los valores predeterminados de la sesión o la configuración indiquen `ask: "on-miss"`.
</Note>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **Host del Gateway** -> proceso `openclaw` en la máquina del Gateway.
- **Host de nodo** -> ejecutor del nodo (aplicación complementaria de macOS o host de nodo sin interfaz gráfica).

### Modelo de confianza

- Los llamadores autenticados por el Gateway son operadores de confianza de ese Gateway.
- Los nodos emparejados extienden esa capacidad del operador de confianza al host de nodo.
- Las aprobaciones reducen el riesgo de ejecución accidental, pero **no** constituyen un límite de autenticación por usuario ni una política de solo lectura del sistema de archivos.
- Una vez aprobado, un comando puede modificar archivos de acuerdo con los permisos del sistema de archivos del host o entorno aislado seleccionado.
- Las ejecuciones aprobadas en el host de nodo vinculan el contexto de ejecución canónico: directorio de trabajo, `argv` exacto, vinculación del entorno cuando exista y ruta fijada del ejecutable cuando corresponda.
- Para scripts de shell e invocaciones directas de archivos mediante intérpretes o entornos de ejecución, OpenClaw también intenta vincular un único operando de archivo local concreto. Si ese archivo cambia después de la aprobación pero antes de la ejecución, esta se rechaza en lugar de ejecutar contenido modificado.
- La vinculación de archivos se realiza con el mejor esfuerzo posible; no es un modelo completo de todas las rutas de carga de los intérpretes o entornos de ejecución. Si no se puede identificar exactamente un archivo local concreto, OpenClaw se niega a emitir una ejecución respaldada por aprobación en lugar de simular una cobertura completa.

### Separación en macOS

- El **servicio del host de nodo** reenvía `system.run` a la **aplicación de macOS** mediante IPC local.
- La **aplicación de macOS** aplica las aprobaciones y ejecuta el comando en el contexto de la interfaz de usuario.

## Inspección de la política efectiva

| Comando                                                          | Qué muestra                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fuentes de políticas del host y resultado efectivo.                         |
| `openclaw exec-policy show`                                      | Vista combinada de la máquina local.                                                             |
| `openclaw exec-policy set` / `preset`                            | Sincroniza en un solo paso la política local solicitada con el archivo local de aprobaciones del host. |

<Note>
No se incluyen las sustituciones de `/exec` específicas de la sesión. Ejecuta `/exec` en la sesión correspondiente para inspeccionar sus valores predeterminados actuales. Consulta [sustituciones de sesión](/es/tools/exec#session-overrides-exec).
</Note>

Referencia completa de la CLI (marcas, salida JSON, adición/eliminación de la lista de permitidos): [CLI de aprobaciones](/es/cli/approvals).

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa que ese ámbito está administrado por el nodo durante la ejecución, en lugar de considerar el archivo local de aprobaciones como fuente de verdad.

Si la interfaz de usuario de la aplicación complementaria **no está disponible**, cualquier solicitud que normalmente mostraría una confirmación se resuelve mediante el **comportamiento alternativo de solicitud** (valor predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden incluir opciones específicas del canal en el mensaje de aprobación pendiente. Matrix incluye accesos directos mediante reacciones (`✅` permitir una vez, `♾️` permitir siempre, `❌` denegar), pero conserva `/approve ...` en el mensaje como alternativa.
</Tip>

## Configuración y almacenamiento

Las aprobaciones se guardan en un archivo JSON local del host de ejecución. Cuando se establece `OPENCLAW_STATE_DIR`, el archivo utiliza ese directorio de estado; de lo contrario, utiliza el directorio de estado predeterminado de OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# de lo contrario
~/.openclaw/exec-approvals.json
```

El socket de aprobación predeterminado utiliza la misma raíz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, o
`~/.openclaw/exec-approvals.sock` cuando la variable no está establecida.

Las versiones anteriores a 2026.6.6 siempre almacenaban el archivo en `~/.openclaw`. Si `OPENCLAW_STATE_DIR` apunta a otra ubicación y todavía existe un archivo de aprobaciones en el directorio predeterminado, ejecuta directamente `openclaw doctor --fix` una vez para importarlo al directorio de estado (el original se archiva con el sufijo `.migrated`). El diagnóstico interactivo también puede mostrar una vista previa y confirmar la importación. Las ejecuciones automatizadas de reparación de actualizaciones y supervisión del Gateway nunca realizan importaciones entre directorios de estado: un directorio de estado temporal o de preparación no debe capturar las aprobaciones de la instalación predeterminada. El mismo límite se aplica a las importaciones del archivo heredado `plugin-binding-approvals.json` al estado compartido de SQLite.

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

## Opciones de política

### `tools.exec.mode`

`tools.exec.mode` es la interfaz de política normalizada preferida para la ejecución en el host:

| Valor       | Comportamiento                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Bloquea la ejecución en el host.                                                                                                                                                                               |
| `allowlist` | Ejecuta únicamente comandos incluidos en la lista de permitidos sin solicitar confirmación.                                                                                                                    |
| `ask`       | Utiliza la política de lista de permitidos y solicita confirmación cuando no hay coincidencias.                                                                                                                |
| `auto`      | Utiliza la política de lista de permitidos, ejecuta directamente las coincidencias deterministas y envía los casos sin aprobación al revisor automático nativo de OpenClaw antes de recurrir a una aprobación humana. |
| `full`      | Ejecuta en el host sin solicitudes de aprobación.                                                                                                                                                              |

Los valores heredados `tools.exec.security` / `tools.exec.ask` siguen siendo compatibles y se aplican cuando `mode` no está establecido en ese ámbito.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloquea todas las solicitudes de ejecución en el host.
  - `allowlist` - permite únicamente los comandos incluidos en la lista de permitidos.
  - `full` - permite todo (equivale a privilegios elevados).

El valor predeterminado es `full` para los hosts de Gateway/nodo; en cambio, el valor predeterminado de un host `sandbox` es `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de solicitud configurada para la ejecución en el host. Controla el comportamiento básico de las solicitudes de aprobación de `tools.exec.ask` y de los valores predeterminados de las aprobaciones del host. El valor predeterminado es `off`. El parámetro de herramienta `ask` de cada llamada (consulta [Herramienta de ejecución](/es/tools/exec#parameters)) solo puede endurecer esa base, y las llamadas del modelo originadas en canales lo ignoran cuando el valor efectivo de solicitud del host es `off`.

- `off` - nunca solicita confirmación.
- `on-miss` - solicita confirmación únicamente cuando la lista de permitidos no coincide.
- `always` - solicita confirmación para cada comando. La confianza persistente de `allow-always` **no** suprime las solicitudes cuando el modo efectivo de solicitud es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud, pero no se puede acceder a ninguna interfaz de usuario (o la solicitud agota el tiempo de espera). El valor predeterminado es `deny` cuando se omite.

- `deny` - bloquea.
- `allowlist` - permite únicamente si coincide con la lista de permitidos.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, trata las formas de evaluación de código en línea como sujetas exclusivamente a aprobación, aunque el binario del intérprete esté incluido en la lista de permitidos. Es una medida de defensa en profundidad para cargadores de intérpretes que no se pueden asociar claramente con un único operando de archivo estable.
</ParamField>

Ejemplos detectados por el modo estricto: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (también las formas en línea de `awk`,
`sed`, `make`, `find -exec` y `xargs`).

En modo estricto, estos comandos necesitan la aprobación del revisor o una aprobación explícita. Con `tools.exec.mode: "auto"`, el revisor puede conceder una ejecución única de bajo riesgo cuando el comando tenga un plan aplicable; de lo contrario, OpenClaw solicita la aprobación de una persona.
Las aprobaciones de comandos de `Codex app-server` que llegan al comportamiento alternativo del revisor solicitan la aprobación de una persona porque sus solicitudes de aprobación no exponen un ejecutable resuelto aplicable.
`allow-always` no conserva nuevas entradas de la lista de permitidos para comandos de evaluación en línea.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Solo afecta a la presentación: cuando está habilitado, OpenClaw puede adjuntar segmentos de comandos derivados del analizador para que las solicitudes web de aprobación puedan resaltar los tokens del comando. **No** modifica `security`, `ask`, la coincidencia con la lista de permitidos, el comportamiento estricto de evaluación en línea, el reenvío de aprobaciones ni la ejecución de comandos.
</ParamField>

Configúralo globalmente en `tools.exec.commandHighlighting` o por agente en
`agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sin aprobación)

Para ejecutar en el host sin solicitudes de aprobación, abre **ambas** capas de políticas:
la política de ejecución solicitada en la configuración de OpenClaw (`tools.exec.*`) **y**
la política local de aprobaciones del host en el archivo de aprobaciones del host de ejecución.

El valor predeterminado de `askFallback` cuando se omite es `deny`. Establece explícitamente `askFallback` del host en `full` cuando una solicitud de aprobación sin interfaz de usuario deba permitir la ejecución como alternativa.

| Capa                  | Configuración de YOLO       |
| --------------------- | --------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node`  |
| `tools.exec.ask`      | `off`                       |
| `askFallback` del host | `full`                     |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta: en el entorno aislado cuando está disponible; de lo contrario, en el Gateway.
- YOLO elige **cómo** se aprueba la ejecución en el host: `security=full` junto con `ask=off`.
- YOLO **no** añade una barrera heurística independiente de aprobación por ofuscación de comandos ni una capa de rechazo de comprobación previa de scripts sobre la política configurada de ejecución en el host.
- `auto` no convierte el enrutamiento al Gateway en una sustitución libre desde una sesión aislada. Una solicitud `host=node` por llamada está permitida desde `auto`; `host=gateway` solo está permitido desde `auto` cuando no hay ningún entorno de ejecución aislado activo. Para establecer un valor predeterminado estable distinto de `auto`, configura `tools.exec.host` o utiliza explícitamente `/exec host=...`.

</Warning>

Los proveedores respaldados por la CLI que exponen su propio modo de permisos no interactivo pueden seguir esta política. La CLI de Claude añade `--permission-mode bypassPermissions` cuando la política efectiva de ejecución de OpenClaw es YOLO. Para las sesiones activas de Claude administradas por OpenClaw, la política efectiva de ejecución de OpenClaw prevalece sobre el modo de permisos nativo de Claude: YOLO normaliza los inicios de sesiones activas a `--permission-mode bypassPermissions`, mientras que una política efectiva de ejecución restrictiva los normaliza a `--permission-mode default`, incluso si los argumentos sin procesar del backend de Claude especifican otro modo.

Si desea una configuración más conservadora, vuelva a restringir la política de ejecución de OpenClaw a `allowlist` / `on-miss` o `deny`.

### Configuración persistente para «no preguntar nunca» en el host del Gateway

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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

Actualiza tanto `tools.exec.host/security/ask` local como los valores predeterminados del archivo local de aprobaciones (incluido `askFallback: "full"`). De forma intencionada, solo se aplica localmente. Para cambiar de forma remota las aprobaciones del host del Gateway o del host Node, use `openclaw approvals set --gateway` o `openclaw approvals set --node
<id|name|ip>`.

Otros ajustes predefinidos incorporados son `cautious` (`host=gateway`, `security=allowlist`, `ask=on-miss`, `askFallback=deny`) y `deny-all` (`host=gateway`, `security=deny`, `ask=off`, `askFallback=deny`). Aplíquelos del mismo modo: `openclaw exec-policy preset cautious`.

Para establecer campos individuales en lugar de un ajuste predefinido completo, use `openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` con cualquier subconjunto de esas opciones.

### Host Node

En su lugar, aplique el mismo archivo de aprobaciones en el Node:

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
**Limitaciones de aplicación exclusivamente local:**

- `openclaw exec-policy` no sincroniza las aprobaciones de los Nodes.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de ejecución del Node se obtienen del Node durante la ejecución, por lo que las actualizaciones dirigidas a un Node deben usar `openclaw approvals --node ...`.

</Note>

### Atajo exclusivo de la sesión

- `/exec security=full ask=off` cambia únicamente la sesión actual.
- `/elevated full` es un atajo de emergencia que omite las aprobaciones de ejecución solo cuando tanto la política solicitada como el archivo de aprobaciones del host se resuelven como `security: "full"` y `ask: "off"`. Un archivo del host más estricto, como `ask:
"always"`, sigue solicitando confirmación.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, continúa prevaleciendo la política más estricta del host.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambie el agente que está editando en la aplicación de macOS. Los patrones se comparan mediante globs.

Los patrones pueden ser globs de rutas resueltas de archivos binarios o globs de nombres de comandos sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni `/tmp/rg`. Use un glob de ruta para confiar en una ubicación específica del archivo binario.

Las entradas heredadas de `agents.default` se migran a `agents.main` al cargarse. Las cadenas de shell como `echo ok && pwd` siguen requiriendo que cada segmento de nivel superior cumpla las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restricción de argumentos con argPattern

Añada `argPattern` cuando una entrada de la lista de permitidos deba coincidir con un archivo binario y una forma específica de argumentos. OpenClaw utiliza la semántica de expresiones regulares de ECMAScript (JavaScript) en todos los hosts y evalúa la expresión en los argumentos analizados del comando, sin incluir el token del ejecutable (`argv[0]`). En las entradas escritas manualmente, los argumentos se unen con un solo espacio; por lo tanto, delimite el patrón con anclas cuando necesite una coincidencia exacta.

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

Esa entrada permite `python3 safe.py`; `python3 other.py` no coincide con la lista de permitidos. Si también existe una entrada basada únicamente en la ruta para el mismo archivo binario, los argumentos que no coincidan aún pueden recurrir a esa entrada. Omita la entrada basada únicamente en la ruta cuando el objetivo sea restringir el archivo binario a los argumentos declarados.

Las entradas guardadas mediante flujos de aprobación utilizan un formato interno con separadores para la coincidencia exacta de argv. Es preferible usar la interfaz de usuario o el flujo de aprobación para volver a generar esas entradas, en lugar de editar manualmente el valor codificado. Si OpenClaw no puede analizar argv para un segmento del comando, las entradas con `argPattern` no coinciden.

Cada entrada de la lista de permitidos admite:

| Campo              | Significado                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `pattern`          | Glob de ruta resuelta del archivo binario o del nombre del comando |
| `argPattern`       | Expresión regular ECMAScript opcional para argv; si se omite, solo se usa la ruta |
| `id`               | ID opaco estable; se genera como UUID si no está presente           |
| `source`           | Origen de la entrada, como `allow-always`                           |
| `commandText`      | Entrada heredada en texto sin formato; se descarta durante la carga |
| `lastUsedAt`       | Marca de tiempo del último uso                                     |
| `lastUsedCommand`  | Último comando que coincidió                                        |
| `lastResolvedPath` | Última ruta resuelta del archivo binario                           |

## Permitir automáticamente las CLI de Skills

Cuando **Permitir automáticamente las CLI de Skills** (`autoAllowSkills`) está habilitado, los ejecutables a los que hacen referencia las Skills conocidas se consideran incluidos en la lista de permitidos de los Nodes (Node de macOS o host Node sin interfaz gráfica). Esto utiliza `skills.bins` mediante la RPC del Gateway para obtener la lista de archivos binarios de las Skills. Deshabilite esta opción si desea listas de permitidos estrictamente manuales.

<Warning>
- Esta es una **lista de permitidos implícita por comodidad**, independiente de las entradas manuales de rutas de la lista de permitidos.
- Está destinada a entornos de operadores de confianza en los que el Gateway y el Node se encuentran dentro del mismo límite de confianza.
- Si necesita una confianza explícita estricta, mantenga `autoAllowSkills: false` y use únicamente entradas manuales de rutas en la lista de permitidos.

</Warning>

## Archivos binarios seguros y reenvío de aprobaciones

Para obtener información sobre los archivos binarios seguros (la vía rápida que solo usa stdin), los detalles de vinculación del intérprete y cómo reenviar solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como clientes de aprobación nativos), consulte [Aprobaciones de ejecución: opciones avanzadas](/es/tools/exec-approvals-advanced).

## Edición en la interfaz de control

Use la tarjeta **Interfaz de control -> Nodes -> Aprobaciones de ejecución** para editar los valores predeterminados, las anulaciones por agente y las listas de permitidos. Elija un ámbito (Valores predeterminados o un agente), ajuste la política, añada o elimine patrones de la lista de permitidos y, a continuación, seleccione **Guardar**. La interfaz de usuario muestra metadatos del último uso de cada patrón para ayudarle a mantener la lista ordenada.

El selector de destino permite elegir **Gateway** (aprobaciones locales) o un **Node**. Los Nodes deben anunciar `system.execApprovals.get/set` (aplicación de macOS u host Node sin interfaz gráfica). Si un Node todavía no anuncia las aprobaciones de ejecución, edite directamente su archivo local de aprobaciones.

Algunos hosts Node, incluido el complemento de Windows, utilizan un formato de política de aprobación diferente. La interfaz de control muestra estas políticas nativas del host en modo de solo lectura. Use la aplicación complementaria o `openclaw approvals set --node <id|name|ip>` con la estructura nativa de la política para editarlas; consulte [CLI de aprobaciones](/es/cli/approvals).

CLI: `openclaw approvals` permite editar el Gateway o un Node; consulte [CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el Gateway transmite `exec.approval.requested` a los clientes de los operadores. La interfaz de control y la aplicación de macOS la resuelven mediante `exec.approval.resolve`; después, el Gateway reenvía la solicitud aprobada al host Node.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`. El Gateway utiliza ese plan como contexto autoritativo del comando, el directorio de trabajo y la sesión al reenviar solicitudes `system.run` aprobadas:

- La ruta de ejecución del Node prepara de antemano un único plan canónico.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobada, la llamada `system.run` final reenviada reutiliza el plan almacenado, en lugar de confiar en modificaciones posteriores realizadas por el llamador.
- Si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de crear la solicitud de aprobación, el Gateway rechaza la ejecución reenviada por una discrepancia con la aprobación.

## Eventos del sistema y denegaciones

El ciclo de vida de la ejecución publica un mensaje del sistema `Exec finished` en la sesión del agente después de que el Node informa de la finalización. OpenClaw también puede emitir un aviso de ejecución en curso una vez concedida la aprobación, después de que transcurra `tools.exec.approvalRunningNoticeMs` (valor predeterminado: `10000`; `0` lo deshabilita). Las aprobaciones de ejecución denegadas son definitivas para el comando del host: el comando no se ejecuta.

- En las aprobaciones asíncronas del agente principal que tengan una sesión de origen, OpenClaw publica la denegación en esa sesión como un seguimiento interno para que el agente pueda dejar de esperar el comando asíncrono y evitar una reparación por falta de resultado.
- Si no hay ninguna sesión o no se puede reanudar, OpenClaw aún puede informar de la denegación de forma concisa al operador o a la ruta de chat directo.
- Las denegaciones de sesiones de subagentes y Cron no se publican en esas sesiones.

Las aprobaciones de ejecución del host del Gateway emiten el mismo evento de finalización del ciclo de vida. Las ejecuciones sujetas a aprobación reutilizan el ID de aprobación para correlacionar la solicitud pendiente con su mensaje de finalización o denegación (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implicaciones

- **`full`** concede mucha capacidad; use listas de permitidos siempre que sea posible.
- **`ask`** le mantiene informado y permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se propaguen a otros.
- Las aprobaciones solo se aplican a solicitudes de ejecución en el host procedentes de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones de forma intencionada. Para bloquear por completo la ejecución en el host, establezca la seguridad de las aprobaciones en `deny` o deniegue la herramienta `exec` mediante la política de herramientas.

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/es/tools/exec-approvals-advanced" icon="gear">
    Archivos binarios seguros, vinculación del intérprete y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Elevated mode" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite las aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de entorno aislado y acceso al espacio de trabajo.
  </Card>
  <Card title="Security" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y protección.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de autorización automática respaldado por Skills.
  </Card>
</CardGroup>
