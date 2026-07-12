---
read_when:
    - Configuración de aprobaciones de ejecución o listas de permitidos
    - Implementación de la experiencia de usuario de aprobación de ejecución en la aplicación para macOS
    - Revisión de las instrucciones de evasión del entorno aislado y sus implicaciones
sidebarTitle: Exec approvals
summary: 'Aprobaciones de ejecución en el host: opciones de política, listas de permitidos y el flujo de trabajo YOLO/estricto'
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-07-12T14:51:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Las aprobaciones de ejecución son la **medida de protección de la aplicación complementaria / host Node** para permitir que un agente en un entorno aislado ejecute comandos en un host real (`gateway` o `node`). Los comandos se ejecutan solo cuando la política, la lista de permitidos y la aprobación opcional del usuario coinciden.

Las aprobaciones se aplican **además de** la política de herramientas y el control de acceso elevado (`full` elevado las omite).

Para obtener una descripción general centrada en los modos `deny`, `allowlist`, `ask`, `auto` y `full`, la asignación de Codex Guardian y los permisos del arnés ACPX, consulta
[Modos de permisos](/es/tools/permission-modes).

<Note>
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores predeterminados de las aprobaciones: las aprobaciones solo pueden restringir la seguridad o las solicitudes derivadas de la configuración, nunca relajarlas. Si se omite un campo de aprobaciones, se utiliza el valor de `tools.exec`. La ejecución en el host también utiliza el estado local de las aprobaciones de esa máquina: un valor local del host `ask: "always"` en el archivo de aprobaciones del host de ejecución sigue solicitando confirmación aunque los valores predeterminados de la sesión o la configuración indiquen `ask: "on-miss"`.
</Note>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **Host del Gateway** -> proceso `openclaw` en la máquina del Gateway.
- **Host Node** -> ejecutor del nodo (aplicación complementaria para macOS u host Node sin interfaz gráfica).

### Modelo de confianza

- Los clientes autenticados por el Gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados extienden esa capacidad del operador de confianza al host Node.
- Las aprobaciones reducen el riesgo de ejecución accidental, pero **no** constituyen un límite de autenticación por usuario ni una política de solo lectura del sistema de archivos.
- Una vez aprobado, un comando puede modificar archivos de acuerdo con los permisos del sistema de archivos del host o entorno aislado seleccionado.
- Las ejecuciones aprobadas en el host Node vinculan el contexto de ejecución canónico: el directorio de trabajo, los argumentos exactos, la vinculación del entorno cuando exista y la ruta fijada del ejecutable cuando corresponda.
- Para los scripts de shell y las invocaciones directas de archivos mediante un intérprete o entorno de ejecución, OpenClaw también intenta vincular un operando de archivo local concreto. Si ese archivo cambia después de la aprobación, pero antes de la ejecución, se rechaza la ejecución en lugar de ejecutar el contenido modificado.
- La vinculación de archivos se realiza con el mejor esfuerzo y no constituye un modelo completo de todas las rutas de carga de cada intérprete o entorno de ejecución. Si no se puede identificar exactamente un archivo local concreto, OpenClaw se niega a generar una ejecución respaldada por una aprobación en lugar de simular una cobertura total.

### Separación en macOS

- El **servicio del host Node** reenvía `system.run` a la **aplicación para macOS** mediante IPC local.
- La **aplicación para macOS** aplica las aprobaciones y ejecuta el comando en el contexto de la interfaz de usuario.

## Inspección de la política efectiva

| Comando                                                          | Qué muestra                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | La política solicitada, las fuentes de políticas del host y el resultado efectivo.               |
| `openclaw exec-policy show`                                      | La vista combinada de la máquina local.                                                          |
| `openclaw exec-policy set` / `preset`                            | Sincroniza en un solo paso la política local solicitada con el archivo local de aprobaciones del host. |

<Note>
Las anulaciones de `/exec` por sesión no están incluidas. Ejecuta `/exec` en la sesión correspondiente para inspeccionar sus valores predeterminados actuales. Consulta [anulaciones de sesión](/es/tools/exec#session-overrides-exec).
</Note>

Referencia completa de la CLI (opciones, salida JSON, adición/eliminación de la lista de permitidos): [CLI de aprobaciones](/es/cli/approvals).

Cuando un ámbito local solicita `host=node`, `exec-policy show` informa que ese
ámbito está gestionado por Node durante la ejecución, en lugar de tratar el
archivo de aprobaciones local como la fuente de verdad.

Si la interfaz de usuario de la aplicación complementaria **no está disponible**,
cualquier solicitud que normalmente mostraría una petición se resuelve mediante
la **alternativa de consulta** (valor predeterminado: `deny`).

<Tip>
Los clientes nativos de aprobación por chat pueden añadir opciones específicas
del canal al mensaje de aprobación pendiente. Matrix añade atajos de reacción
(`✅` permitir una vez, `♾️` permitir siempre, `❌` denegar), pero mantiene
`/approve ...` en el mensaje como alternativa.
</Tip>

## Configuración y almacenamiento

Las aprobaciones se guardan en un archivo JSON local en el host de ejecución.
Cuando se establece `OPENCLAW_STATE_DIR`, el archivo usa ese directorio de estado;
de lo contrario, utiliza el directorio de estado predeterminado de OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# de lo contrario
~/.openclaw/exec-approvals.json
```

El socket de aprobación predeterminado usa la misma raíz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, o
`~/.openclaw/exec-approvals.sock` cuando la variable no está establecida.

Las versiones anteriores a 2026.6.6 siempre guardaban el archivo en
`~/.openclaw`. Si `OPENCLAW_STATE_DIR` apunta a otra ubicación y todavía existe
un archivo de aprobaciones en el directorio predeterminado, ejecute directamente
`openclaw doctor --fix` una vez para importarlo al directorio de estado (el
original se archiva con el sufijo `.migrated`). El doctor interactivo también
puede mostrar una vista previa de la importación y confirmarla. Las ejecuciones
automatizadas de actualización y reparación de supervisión del Gateway nunca
importan entre directorios de estado: un directorio de estado temporal o de
preproducción no debe capturar las aprobaciones de la instalación predeterminada.
El mismo límite se aplica a las importaciones heredadas de
`plugin-binding-approvals.json` al estado SQLite compartido.

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

## Controles de política

### `tools.exec.mode`

`tools.exec.mode` es la superficie de política normalizada preferida para la
ejecución en el host:

| Valor       | Comportamiento                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Bloquea la ejecución en el host.                                                                                                                                                                                |
| `allowlist` | Ejecuta únicamente los comandos incluidos en la lista de permitidos sin solicitar confirmación.                                                                                                                |
| `ask`       | Usa la política de lista de permitidos y solicita confirmación cuando no hay coincidencias.                                                                                                                     |
| `auto`      | Usa la política de lista de permitidos, ejecuta directamente las coincidencias deterministas y envía las solicitudes de aprobación sin coincidencia al revisor automático nativo de OpenClaw antes de recurrir a una ruta de aprobación humana. |
| `full`      | Ejecuta en el host sin solicitudes de aprobación.                                                                                                                                                               |

Las opciones heredadas `tools.exec.security` / `tools.exec.ask` siguen siendo compatibles y todavía
se aplican cuando `mode` no está definido en ese ámbito.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloquea todas las solicitudes de ejecución en el host.
  - `allowlist` - permite únicamente los comandos incluidos en la lista de permitidos.
  - `full` - permite todo (equivale a privilegios elevados).

El valor predeterminado es `full` para los hosts gateway/node; en cambio, un host `sandbox` tiene
`deny` como valor predeterminado.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de solicitud configurada para la ejecución en el host. Controla el comportamiento
  de referencia de las solicitudes de aprobación de `tools.exec.ask` y los valores predeterminados de aprobación del host.
  El valor predeterminado es `off`. El parámetro de herramienta `ask` de cada llamada (véase
  [Herramienta Exec](/es/tools/exec#parameters)) solo puede endurecer ese comportamiento de referencia, y
  las llamadas al modelo originadas en canales lo ignoran cuando la solicitud efectiva del host es `off`.

- `off` - nunca solicita confirmación.
- `on-miss` - solicita confirmación solo cuando la lista de permitidos no coincide.
- `always` - solicita confirmación para cada comando. La confianza persistente `allow-always` **no** suprime las solicitudes cuando el modo de solicitud efectivo es `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolución cuando se requiere una solicitud, pero no hay ninguna interfaz accesible (o la
  solicitud agota el tiempo de espera). Si se omite, el valor predeterminado es `deny`.

- `deny` - bloquea.
- `allowlist` - permite únicamente si la lista de permitidos coincide.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Cuando es `true`, trata las formas de evaluación de código en línea como sujetas exclusivamente a aprobación, incluso si el
  propio binario del intérprete está incluido en la lista de permitidos. Proporciona defensa en profundidad para
  cargadores de intérpretes que no se corresponden claramente con un único operando de archivo estable.
</ParamField>

Ejemplos que detecta el modo estricto: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (también las formas en línea de `awk`,
`sed`, `make`, `find -exec` y `xargs`).

En modo estricto, estos comandos necesitan la aprobación de un revisor o una aprobación explícita. Con
`tools.exec.mode: "auto"`, el revisor puede autorizar una ejecución de bajo riesgo cuando
el comando tiene un plan aplicable; de lo contrario, OpenClaw solicita aprobación humana.
Las aprobaciones de comandos de `Codex app-server` que llegan al revisor alternativo solicitan
aprobación humana porque sus solicitudes de aprobación no exponen un ejecutable resuelto
que pueda aplicarse.
`allow-always` no conserva nuevas entradas en la lista de permitidos para comandos de evaluación en línea.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Solo para presentación: cuando está habilitado, OpenClaw puede adjuntar
  segmentos de comandos derivados del analizador para que las solicitudes de aprobación web puedan resaltar los tokens de los comandos. Esto
  **no** cambia `security`, `ask`, la coincidencia con la lista de permitidos, el comportamiento estricto de evaluación en línea,
  el reenvío de aprobaciones ni la ejecución de comandos.
</ParamField>

Se configura globalmente en `tools.exec.commandHighlighting` o por agente en
`agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sin aprobación)

Para ejecutar en el host sin solicitudes de aprobación, se deben abrir **ambas** capas de política:
la política de ejecución solicitada en la configuración de OpenClaw (`tools.exec.*`) **y**
la política local de aprobaciones del host en el archivo de aprobaciones del host de ejecución.

Si se omite `askFallback`, el valor predeterminado es `deny`. Establezca explícitamente `askFallback` del host en `full`
cuando una solicitud de aprobación sin interfaz deba permitir la ejecución como alternativa.

| Capa                  | Configuración YOLO         |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` en `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` del host | `full`                    |

<Warning>
**Distinciones importantes:**

- `tools.exec.host=auto` elige **dónde** se ejecuta: en el entorno aislado cuando está disponible; de lo contrario, en el gateway.
- YOLO determina **cómo** se aprueba la ejecución en el host: `security=full` junto con `ask=off`.
- YOLO **no** añade una puerta de aprobación heurística independiente para comandos ofuscados ni una capa de rechazo de comprobación previa de scripts sobre la política de ejecución en el host configurada.
- `auto` no convierte el enrutamiento al gateway en una anulación libre desde una sesión aislada. Una solicitud `host=node` por llamada está permitida desde `auto`; `host=gateway` solo está permitido desde `auto` cuando no hay ningún entorno de ejecución aislado activo. Para usar un valor predeterminado estable que no sea automático, configure `tools.exec.host` o use `/exec host=...` explícitamente.

</Warning>

Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo
pueden seguir esta política. La CLI de Claude añade
`--permission-mode bypassPermissions` cuando la política efectiva de ejecución
de OpenClaw es YOLO. Para las sesiones en vivo de Claude gestionadas por OpenClaw, la
política efectiva de ejecución de OpenClaw prevalece sobre el modo de permisos nativo de Claude:
YOLO normaliza los inicios de sesiones en vivo a `--permission-mode bypassPermissions`, y
una política efectiva de ejecución restrictiva normaliza los inicios de sesiones en vivo a
`--permission-mode default`, incluso si los argumentos sin procesar del backend de Claude especifican otro
modo.

Si se desea una configuración más conservadora, se debe restringir de nuevo la política de ejecución de OpenClaw a
`allowlist` / `on-miss` o `deny`.

### Configuración persistente de «no solicitar nunca» en el host del Gateway

<Steps>
  <Step title="Establecer la política de configuración solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
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

Actualiza tanto los valores locales de `tools.exec.host/security/ask` como los valores predeterminados
del archivo local de aprobaciones (incluido `askFallback: "full"`). Es
intencionadamente solo local. Para cambiar de forma remota las aprobaciones del host del Gateway o del host del Node, se debe usar
`openclaw approvals set --gateway` o `openclaw approvals set --node
<id|name|ip>`.

Otros preajustes integrados: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) y `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Se aplican de la misma manera:
`openclaw exec-policy preset cautious`.

Para establecer campos individuales en lugar de un preajuste completo, se debe usar
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` con cualquier subconjunto de esas opciones.

### Host del Node

Se debe aplicar en su lugar el mismo archivo de aprobaciones en el Node:

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
**Limitaciones exclusivas del entorno local:**

- `openclaw exec-policy` no sincroniza las aprobaciones del Node.
- `openclaw exec-policy set --host node` se rechaza.
- Las aprobaciones de ejecución del Node se obtienen del Node durante la ejecución, por lo que las actualizaciones dirigidas al Node deben usar `openclaw approvals --node ...`.

</Note>

### Atajo exclusivo de la sesión

- `/exec security=full ask=off` cambia únicamente la sesión actual.
- `/elevated full` es un atajo de emergencia que omite las aprobaciones de ejecución únicamente
  cuando tanto la política solicitada como el archivo de aprobaciones del host se resuelven como
  `security: "full"` y `ask: "off"`. Un archivo de host más estricto, como `ask:
"always"`, sigue solicitando aprobación.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política
más estricta del host continúa prevaleciendo.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, se debe cambiar el agente
que se está editando en la aplicación de macOS. Los patrones son coincidencias glob.

Los patrones pueden ser globs de rutas de binarios resueltas o globs de nombres de comandos sin ruta.
Los nombres sin ruta solo coinciden con comandos invocados mediante `PATH`, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero **no** con `./rg` ni
`/tmp/rg`. Se debe usar un glob de ruta para confiar en una ubicación específica del binario.

Las entradas heredadas de `agents.default` se migran a `agents.main` durante la carga.
Las cadenas del shell, como `echo ok && pwd`, siguen necesitando que cada segmento de nivel superior
cumpla las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restricción de argumentos con argPattern

Se debe añadir `argPattern` cuando una entrada de la lista de permitidos deba coincidir con un binario y una
forma específica de argumentos. OpenClaw utiliza la semántica de expresiones regulares
de ECMAScript (JavaScript) en todos los hosts y evalúa la expresión con respecto a
los argumentos analizados del comando, sin incluir el token ejecutable (`argv[0]`).
En las entradas creadas manualmente, los argumentos se unen con un único espacio, por lo que
se debe delimitar el patrón cuando se necesite una coincidencia exacta.

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

Esa entrada permite `python3 safe.py`; `python3 other.py` no coincide con la lista de permitidos.
Si también existe una entrada basada únicamente en la ruta para el mismo binario, los argumentos que no coincidan
pueden seguir recurriendo a esa entrada basada únicamente en la ruta. Se debe omitir la entrada basada únicamente en la ruta
cuando el objetivo sea restringir el binario a los argumentos declarados.

Las entradas guardadas por los flujos de aprobación utilizan un formato de separador interno para la coincidencia exacta
de argv. Es preferible usar la interfaz de usuario o el flujo de aprobación para regenerar esas entradas
en lugar de editar manualmente el valor codificado. Si OpenClaw no puede analizar argv
para un segmento de comando, las entradas con `argPattern` no coinciden.

Cada entrada de la lista de permitidos admite:

| Campo              | Significado                                                   |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob de ruta de binario resuelta o glob de nombre de comando  |
| `argPattern`       | Expresión regular ECMAScript opcional para argv; si se omite, solo se usa la ruta |
| `id`               | ID opaco estable; se genera como UUID si no está presente     |
| `source`           | Origen de la entrada, como `allow-always`                     |
| `commandText`      | Entrada heredada de texto sin formato; se descarta durante la carga |
| `lastUsedAt`       | Marca de tiempo del último uso                                |
| `lastUsedCommand`  | Último comando que coincidió                                  |
| `lastResolvedPath` | Última ruta de binario resuelta                               |

## Permitir automáticamente las CLI de Skills

Cuando **Permitir automáticamente las CLI de Skills** (`autoAllowSkills`) está habilitado, los ejecutables
a los que hacen referencia las Skills conocidas se consideran incluidos en la lista de permitidos en los nodos (Node de macOS
o host del Node sin interfaz gráfica). Esto utiliza `skills.bins` mediante la RPC del Gateway para
obtener la lista de binarios de las Skills. Se debe deshabilitar si se desean listas de permitidos manuales
estrictas.

<Warning>
- Esta es una **lista de permitidos implícita por comodidad**, independiente de las entradas manuales de rutas en la lista de permitidos.
- Está destinada a entornos de operadores de confianza en los que el Gateway y el Node se encuentran dentro del mismo límite de confianza.
- Si se requiere confianza explícita estricta, se debe mantener `autoAllowSkills: false` y usar únicamente entradas manuales de rutas en la lista de permitidos.

</Warning>

## Binarios seguros y reenvío de aprobaciones

Para obtener información sobre los binarios seguros (la ruta rápida exclusiva de stdin), los detalles de vinculación
del intérprete y cómo reenviar las solicitudes de aprobación a Slack/Discord/Telegram (o ejecutarlas como
clientes de aprobación nativos), se debe consultar
[Aprobaciones de ejecución: opciones avanzadas](/es/tools/exec-approvals-advanced).

## Edición en la interfaz de control

Se debe usar la tarjeta **Control UI -> Nodes -> Exec approvals** para editar los valores predeterminados,
las anulaciones por agente y las listas de permitidos. Se debe elegir un ámbito (Defaults o un agente),
ajustar la política, añadir o eliminar patrones de la lista de permitidos y, a continuación, pulsar **Save**. La interfaz de usuario
muestra metadatos de último uso por patrón para ayudar a mantener ordenada la lista.

El selector de destino permite elegir **Gateway** (aprobaciones locales) o un **Node**.
Los nodos deben anunciar `system.execApprovals.get/set` (aplicación de macOS o
host del Node sin interfaz gráfica). Si un Node todavía no anuncia aprobaciones de ejecución, se debe editar directamente su
archivo local de aprobaciones.

Algunos hosts de Node, incluido el complemento de Windows, disponen de un formato diferente de política
de aprobación. La interfaz de control muestra estas políticas nativas del host en modo de solo lectura. Se debe usar la
aplicación complementaria o `openclaw approvals set --node <id|name|ip>` con la forma nativa
de la política para editarlas; véase [CLI de aprobaciones](/es/cli/approvals).

CLI: `openclaw approvals` permite editar el Gateway o un Node; véase
[CLI de aprobaciones](/es/cli/approvals).

## Flujo de aprobación

Cuando se requiere una solicitud, el Gateway difunde
`exec.approval.requested` a los clientes del operador. La interfaz de control y la
aplicación de macOS la resuelven mediante `exec.approval.resolve` y, a continuación, el Gateway reenvía la
solicitud aprobada al host del Node.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`.
El Gateway utiliza ese plan como contexto autorizado de comando/cwd/sesión
al reenviar las solicitudes `system.run` aprobadas:

- La ruta de ejecución del Node prepara por adelantado un único plan canónico.
- El registro de aprobación almacena ese plan y sus metadatos de vinculación.
- Una vez aprobado, la llamada `system.run` final reenviada reutiliza el plan almacenado en lugar de confiar en modificaciones posteriores del invocador.
- Si el invocador cambia `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` después de crear la solicitud de aprobación, el Gateway rechaza la ejecución reenviada por discrepancia con la aprobación.

## Eventos del sistema y denegaciones

El ciclo de vida de la ejecución publica un mensaje del sistema `Exec finished` en la sesión del agente
después de que el Node informa de su finalización. OpenClaw también puede emitir un aviso
de ejecución en curso una vez concedida la aprobación, después de que transcurra
`tools.exec.approvalRunningNoticeMs` (valor predeterminado `10000`; `0` lo deshabilita).
Las aprobaciones de ejecución denegadas son definitivas para el comando del host: el comando
no se ejecuta.

- Para las aprobaciones asíncronas del agente principal con una sesión de origen, OpenClaw
  publica la denegación en esa sesión como un seguimiento interno para que el
  agente pueda dejar de esperar el comando asíncrono y evitar una reparación por falta de resultado.
- Si no hay ninguna sesión o no se puede reanudar, OpenClaw aún puede
  informar de forma concisa de la denegación al operador o a la ruta de chat directo.
- Las denegaciones de las sesiones de subagentes y Cron no se publican en esas
  sesiones.

Las aprobaciones de ejecución del host del Gateway emiten el mismo evento de ciclo de vida de finalización.
Las ejecuciones condicionadas a aprobación reutilizan el ID de aprobación para correlacionar la solicitud
pendiente con su mensaje de finalización o denegación (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implicaciones

- **`full`** es potente; se deben preferir las listas de permitidos cuando sea posible.
- **`ask`** mantiene al operador informado sin dejar de permitir aprobaciones rápidas.
- Las listas de permitidos por agente impiden que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de ejecución en el host procedentes de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones de forma intencionada. Para bloquear por completo la ejecución en el host, se debe establecer la seguridad de las aprobaciones en `deny` o denegar la herramienta `exec` mediante la política de herramientas.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Aprobaciones de ejecución: opciones avanzadas" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación del intérprete y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta de ejecución" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos del shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite las aprobaciones.
  </Card>
  <Card title="Aislamiento" href="/es/gateway/sandboxing" icon="box">
    Modos de aislamiento y acceso al espacio de trabajo.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y refuerzo.
  </Card>
  <Card title="Aislamiento frente a política de herramientas frente a modo elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo usar cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de permiso automático respaldado por Skills.
  </Card>
</CardGroup>
