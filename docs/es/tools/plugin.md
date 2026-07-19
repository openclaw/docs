---
doc-schema-version: 1
read_when:
    - Instalación o configuración de plugins
    - Descripción del descubrimiento y las reglas de carga de plugins
    - Trabajo con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Getting Started
summary: Instalar, configurar y gestionar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-19T02:07:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f210dccab059527192eeb0aa2e780dcea243959273938ffaacc867ec96f5085e
    source_path: tools/plugin.md
    workflow: 16
---

Los Plugins amplían OpenClaw con canales, proveedores de modelos, entornos de agentes, herramientas,
Skills, voz, transcripción en tiempo real, comunicación por voz, comprensión de contenido multimedia, generación,
obtención web, búsqueda web y otras capacidades de ejecución.

Use esta página para instalar un Plugin, reiniciar el Gateway, verificar que el entorno de ejecución
lo haya cargado y solucionar errores comunes de configuración. Para ver ejemplos que solo incluyen comandos, consulte
[Gestionar Plugins](/es/plugins/manage-plugins). Para consultar el inventario generado de
Plugins incluidos, externos oficiales y disponibles únicamente en el código fuente, consulte
[Inventario de Plugins](/es/plugins/plugin-inventory).

## Requisitos

- una copia de trabajo o instalación de OpenClaw con la CLI `openclaw` disponible
- acceso de red a la fuente seleccionada (ClawHub, npm o un servidor de git)
- cualquier credencial, clave de configuración o herramienta del sistema operativo específica del Plugin indicada en
  la documentación de configuración de dicho Plugin
- permiso para recargar o reiniciar el Gateway que presta servicio a los canales

## Inicio rápido

<Steps>
  <Step title="Buscar el Plugin">
    Busque paquetes públicos de Plugins en [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub es la principal interfaz de descubrimiento de Plugins de la comunidad. Durante la
    transición del lanzamiento, las especificaciones de paquetes simples ordinarias siguen instalándose desde npm, salvo que
    coincidan con el id de un Plugin oficial. Las especificaciones `@openclaw/*` sin prefijo que coincidan con un
    Plugin incluido se resuelven mediante esa copia incluida. Use un prefijo de fuente explícito
    cuando necesite una fuente específica.

  </Step>

  <Step title="Instalar el Plugin">
    ```bash
    # Desde ClawHub.
    openclaw plugins install clawhub:<package>

    # Desde npm.
    openclaw plugins install npm:<package>

    # Desde git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Desde una copia de trabajo de desarrollo local.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Trate las instalaciones de Plugins como la ejecución de código. Prefiera versiones fijadas para
    que las instalaciones de producción sean reproducibles. Los paquetes de ClawHub y el
    catálogo incluido/oficial de OpenClaw son fuentes de confianza. Las nuevas fuentes arbitrarias de npm, git,
    rutas o archivos locales, `npm-pack:` o mercados requieren
    `--force` en las instalaciones no interactivas después de
    revisar la fuente y considerarla de confianza.

  </Step>

  <Step title="Configurar y habilitar el Plugin">
    Defina los ajustes específicos del Plugin en `plugins.entries.<id>.config`.
    Habilite el Plugin si aún no está habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si se establece `plugins.allow`, el id del Plugin instalado debe figurar en esa lista
    para que el Plugin pueda cargarse. `openclaw plugins install` añade el
    id instalado a una lista `plugins.allow` existente y elimina ese mismo id de
    `plugins.deny` para que la instalación explícita pueda cargarse tras el reinicio.

  </Step>

  <Step title="Permitir que el Gateway se recargue">
    Para instalar, actualizar o desinstalar el código de un Plugin es necesario reiniciar el Gateway.
    Un Gateway gestionado con la recarga de configuración habilitada detecta el cambio
    en el registro de instalación del Plugin y se reinicia automáticamente. De lo contrario, reinícielo
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    Al habilitar o deshabilitar se actualizan la configuración y el registro en frío. Una inspección del entorno de ejecución
    sigue siendo la prueba más clara de las superficies activas del entorno de ejecución.

  </Step>

  <Step title="Verificar el registro en el entorno de ejecución">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` para demostrar el registro de herramientas, hooks, servicios, métodos del Gateway
    o comandos de la CLI pertenecientes al Plugin. `inspect` sin opciones es únicamente una comprobación
    en frío del manifiesto y del registro.

  </Step>
</Steps>

## Configuración

### Elegir una fuente de instalación

| Fuente      | Cuándo usarla                                                                       | Ejemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Se busca detección nativa de OpenClaw, análisis, metadatos de versión e indicaciones de instalación | `openclaw plugins install clawhub:<package>`                   |
| npm         | Se necesitan flujos de trabajo directos con el registro npm o etiquetas de distribución                             | `openclaw plugins install npm:<package>`                       |
| git         | Se necesita una rama, etiqueta o confirmación de cambios de un repositorio                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Se está desarrollando o probando un plugin en el mismo equipo                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Se está instalando un plugin de marketplace compatible con Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Las especificaciones de paquete simples tienen un comportamiento especial de compatibilidad: un nombre simple que
coincide con el id de un plugin incluido utiliza esa fuente incluida; un nombre simple que coincide
con el id de un plugin externo oficial utiliza el catálogo oficial de paquetes; cualquier otra
especificación simple se instala mediante npm durante la transición del lanzamiento. Las especificaciones `@openclaw/*`
sin procesar que coinciden con plugins incluidos también se resuelven a la copia incluida antes de recurrir
a npm. Utilice `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente el
paquete npm externo en lugar de la copia incluida. Utilice `clawhub:`, `npm:`,
`git:` o `npm-pack:` para seleccionar la fuente de forma determinista. Consulte
[`openclaw plugins`](/es/cli/plugins#install) para conocer el contrato completo del comando.

Para las instalaciones mediante npm, las especificaciones sin versión fijada y `@latest` eligen el paquete
estable más reciente que anuncia compatibilidad con esta compilación de OpenClaw. Si la
versión más reciente actual de npm declara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` más reciente de lo que admite esta compilación, OpenClaw examina
versiones estables anteriores e instala la más reciente que sea compatible. Las versiones exactas
y las etiquetas explícitas de canal, como `@beta`, permanecen fijadas al paquete seleccionado
y fallan si son incompatibles.

### Política de instalación del operador

Configure `security.installPolicy` para ejecutar un comando de política local de confianza
antes de proceder con la instalación o actualización de un plugin. La política recibe metadatos junto con
la ruta de origen preparada y puede permitir o bloquear la instalación. Abarca tanto las rutas de
instalación y actualización de la CLI como las respaldadas por el Gateway. Los hooks `before_install` del plugin se ejecutan
más tarde y solo en procesos de OpenClaw donde estén cargados los hooks de plugins, por lo que se debe utilizar
`security.installPolicy` para las decisiones de instalación propiedad del operador. La
opción obsoleta `--dangerously-force-unsafe-install` se acepta por
compatibilidad, pero no realiza ninguna acción: no elude la política de instalación ni la lista de
dependencias de plugins denegadas integrada en OpenClaw.

Consulte [Configuración de Skills](/es/tools/skills-config#operator-install-policy-securityinstallpolicy)
para conocer el esquema compartido de ejecución `security.installPolicy` que utilizan tanto las Skills como los
plugins.

### Configurar la política de plugins

La estructura común de configuración de plugins es:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Reglas principales de la política:

- `plugins.enabled: false` deshabilita todos los plugins y omite el trabajo de detección y carga.
  Las referencias obsoletas a plugins permanecen inertes mientras esta opción está activa; vuelva a habilitar
  los plugins antes de ejecutar la limpieza de doctor si desea eliminar los ids obsoletos.
- `plugins.deny` prevalece sobre la lista de permitidos y la habilitación individual de plugins.
- `plugins.allow` es una lista de permitidos exclusiva. Las herramientas propiedad de plugins que estén fuera de la
  lista de permitidos permanecen no disponibles incluso cuando `tools.allow` incluye `"*"`.
- `plugins.entries.<id>.enabled: false` deshabilita un plugin sin eliminar su
  configuración.
- `plugins.load.paths` añade archivos o directorios locales de plugins explícitos.
  Las rutas locales administradas de `plugins install` deben ser directorios o
  archivos comprimidos de plugins; utilice `plugins.load.paths` para archivos de plugin independientes.
- Los plugins originados en el espacio de trabajo están deshabilitados de forma predeterminada; habilítelos explícitamente o
  añádalos a la lista de permitidos antes de utilizar código del espacio de trabajo local.
- Los plugins incluidos siguen sus metadatos integrados de activación o desactivación predeterminada,
  salvo que la configuración los anule explícitamente.
- `plugins.slots.<slot>` (`memory` o `contextEngine`) selecciona un plugin para una
  categoría exclusiva. La selección de una ranura cuenta como activación explícita y
  fuerza la habilitación del plugin seleccionado para esa ranura, aunque de otro modo
  requiriera activación explícita. `plugins.deny` y `plugins.entries.<id>.enabled: false` aún
  lo bloquean.
- Los plugins incluidos que requieren activación explícita pueden activarse automáticamente cuando la configuración especifica una de sus
  superficies propias, como una referencia de proveedor/modelo, una configuración de canal, un backend de la CLI
  o un entorno de ejecución del arnés del agente.
- El enrutamiento de Codex de la familia OpenAI mantiene separados los límites de los plugins de proveedor y de entorno de ejecución:
  las referencias heredadas de modelos de Codex son configuraciones heredadas que doctor repara,
  mientras que el plugin incluido `codex` es propietario del entorno de ejecución del servidor de aplicaciones de Codex para
  las referencias canónicas de agentes `openai/*`, el valor explícito `agentRuntime.id: "codex"` y
  las referencias heredadas `codex/*`.

Cuando `plugins.allow` no está definido y se detectan automáticamente plugins no incluidos desde
el espacio de trabajo o las raíces globales de plugins, el inicio registra
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
con los ids de los plugins detectados y, para listas cortas, un fragmento mínimo de `plugins.allow`.
Ejecute [`openclaw plugins list --enabled --verbose`](/es/cli/plugins#list)
o [`openclaw plugins inspect <id>`](/es/cli/plugins#inspect) con el id del
plugin indicado antes de copiar plugins de confianza en `openclaw.json`. La misma
fijación de confianza se aplica cuando los diagnósticos indican que un plugin se cargó
`without install/load-path provenance`: inspeccione el id de ese plugin y, después, fíjelo en
`plugins.allow` o vuelva a instalarlo desde una fuente de confianza para que OpenClaw registre la
procedencia de la instalación.

Ejecute `openclaw doctor` o `openclaw doctor --fix` cuando la validación de la configuración
informe de ids de plugins obsoletos, discrepancias entre listas de permitidos y herramientas, o rutas
heredadas de plugins incluidos.

## Comprender los formatos de plugins

OpenClaw reconoce dos formatos de plugins:

| Formato                 | Cómo se carga                                                                 | Cuándo usarlo                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo de OpenClaw | `openclaw.plugin.json` junto con un módulo de entorno de ejecución cargado en el proceso               | Se están instalando o creando capacidades de entorno de ejecución específicas de OpenClaw  |
| Paquete compatible      | Diseño de plugin de Codex, Claude o Cursor asignado al inventario de plugins de OpenClaw | Se están reutilizando Skills, comandos, hooks o metadatos de paquetes compatibles |

Ambos formatos aparecen en `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` y `openclaw plugins disable`. Consulte
[Paquetes de plugins](/es/plugins/bundles) para conocer el límite de compatibilidad de los paquetes y
[Creación de plugins](/es/plugins/building-plugins) para crear plugins nativos.

## Hooks de plugins

Los plugins pueden registrar hooks en tiempo de ejecución mediante dos API diferentes:

- `api.on(...)` hooks con tipos para eventos del ciclo de vida del entorno de ejecución. Esta es la
  superficie preferida para middleware, políticas, reescritura de mensajes, conformación de
  prompts y control de herramientas.
- `api.registerHook(...)` para el sistema interno de hooks descrito en
  [Hooks](/es/automation/hooks). Se utiliza principalmente para efectos secundarios generales de comandos o del ciclo de vida
  y para la compatibilidad con la automatización existente de estilo HOOK.

Regla rápida: si el controlador necesita prioridad, semántica de combinación o
comportamiento de bloqueo o cancelación, utilice hooks con tipos. Si solo reacciona a `command:new`,
`command:reset`, `message:sent` o eventos generales similares, `api.registerHook`
es adecuado.

Los hooks internos administrados por plugins aparecen en `openclaw hooks list` con
`plugin:<id>`. No se pueden habilitar ni deshabilitar mediante `openclaw hooks`;
habilite o deshabilite el plugin en su lugar.

## Verificar el Gateway activo

`openclaw plugins list` y `openclaw plugins inspect` sin formato leen la configuración en frío,
el manifiesto y el estado del registro. No demuestran que un
Gateway que ya está en ejecución haya importado el mismo código del plugin.

Cuando un plugin aparece como instalado, pero el tráfico del chat en vivo no lo utiliza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Los Gateways administrados se reinician automáticamente después de cambios de instalación, actualización y
desinstalación de plugins que alteran su código fuente. En instalaciones en VPS o contenedores, hay que
asegurarse de que cualquier reinicio manual se dirija al proceso hijo `openclaw gateway run` real que
presta servicio a los canales, no solo a un contenedor o supervisor.

## Solución de problemas

| Síntoma                                                        | Comprobación                                                                                                                                      | Solución                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| El plugin aparece en `plugins list`, pero los hooks de ejecución no se ejecutan  | Usar `openclaw plugins inspect <id> --runtime --json` y confirmar el Gateway activo con `gateway status --deep --require-rpc`             | Reiniciar el Gateway en vivo después de cambios de instalación, actualización, configuración o código fuente                               |
| Aparecen diagnósticos de propiedad duplicada de canales o herramientas         | Ejecutar `openclaw plugins list --enabled --verbose`, inspeccionar cada plugin sospechoso con `--runtime --json` y comparar la propiedad de canales y herramientas | Deshabilitar un propietario, eliminar instalaciones obsoletas o usar `preferOver` en el manifiesto para un reemplazo intencional      |
| La configuración indica que falta un plugin                                | Consultar el [inventario de plugins](/es/plugins/plugin-inventory) para saber si está incluido, es oficial externo o solo está disponible como código fuente                           | Instalar el paquete externo, habilitar el plugin incluido o eliminar la configuración obsoleta                         |
| La configuración no es válida durante la instalación                               | Leer el mensaje de validación y ejecutar `openclaw doctor --fix` si señala un estado de plugin obsoleto                                             | Doctor puede poner en cuarentena la configuración no válida del plugin deshabilitando la entrada y eliminando la carga útil no válida     |
| La ruta del plugin está bloqueada por permisos o propiedad sospechosos | Inspeccionar el diagnóstico anterior al error de configuración                                                                                             | Corregir la propiedad o los permisos del sistema de archivos y, después, ejecutar `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloquea los comandos del ciclo de vida                | Confirmar que Nix administra la instalación                                                                                                      | Cambiar la selección del plugin en el código fuente de Nix en lugar de usar comandos de modificación de plugins                      |
| La importación de dependencias falla durante la ejecución                             | Comprobar si el plugin se instaló mediante npm/git/ClawHub o se cargó desde una ruta local                                                 | Ejecutar `openclaw plugins update <id>`, reinstalar el código fuente o instalar manualmente las dependencias locales del plugin |

Cuando un plugin administrado habilitado no supera la verificación de la carga útil durante el
inicio del Gateway, OpenClaw pone en cuarentena esa raíz exacta del plugin instalado durante el arranque y
continúa prestando servicio a los demás plugins. `openclaw status --all`, `openclaw health`
y `openclaw doctor` lo notifican como `configured-unavailable`. Corregir o reinstalar
el plugin y, después, reiniciar el Gateway. Una sustitución explícita y correcta de `plugins.load.paths`
con el mismo identificador de plugin no se pone en cuarentena debido a una instalación obsoleta defectuosa.

Cuando la configuración obsoleta de un plugin aún nombra un plugin de canal que ya no puede detectarse,
la validación de la configuración convierte esa clave de canal en una advertencia en lugar de un
error crítico, por lo que el inicio del Gateway todavía puede prestar servicio a todos los demás canales. Ejecutar
`openclaw doctor --fix` para eliminar las entradas obsoletas del plugin y del canal. Las claves de
canal desconocidas sin indicios de plugins obsoletos siguen provocando un error de validación para que los errores
tipográficos permanezcan visibles.

Para un reemplazo intencional de un canal, el plugin preferido debe declarar
`channelConfigs.<channel-id>.preferOver` con el identificador del plugin heredado o de menor prioridad.
Si ambos plugins están habilitados explícitamente, OpenClaw conserva esa solicitud
e informa diagnósticos de canales o herramientas duplicados en lugar de elegir
un propietario de forma silenciosa.

Si un paquete instalado informa de que `requires compiled runtime output for
TypeScript entry ...`, el paquete se publicó sin los archivos JavaScript
que OpenClaw necesita durante la ejecución. Actualizar o reinstalar después de que el editor publique
el JavaScript compilado, o deshabilitar o desinstalar el plugin hasta entonces.

### Propiedad bloqueada de la ruta del plugin

Si los diagnósticos indican
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
y la validación continúa con `plugin present but blocked`, OpenClaw ha encontrado
archivos del plugin que pertenecen a un usuario de Unix distinto del proceso que los carga.
Mantener la configuración del plugin en su lugar; corregir la propiedad del sistema de archivos o ejecutar OpenClaw
como el mismo usuario propietario del directorio de estado.

En instalaciones de Docker, la imagen oficial se ejecuta como `node` (uid `1000`), por lo que los
directorios de configuración y del espacio de trabajo de OpenClaw montados desde el host normalmente deben
pertenecer al uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si OpenClaw se ejecuta intencionalmente como root, hay que reparar la raíz del plugin administrado para que
pertenezca a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Después de corregir la propiedad, volver a ejecutar `openclaw doctor --fix` o
`openclaw plugins registry --refresh` para que el registro persistente de plugins
coincida con los archivos reparados.

### Configuración lenta de las herramientas del plugin

Si los turnos del agente parecen bloquearse mientras se preparan las herramientas, habilitar el registro de trazas
y buscar líneas de temporización de la fábrica de herramientas del plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Buscar:

```text
[trace:plugin-tools] temporizaciones de fábrica ...
```

El resumen muestra el tiempo total de las fábricas y las fábricas de herramientas de plugins más lentas,
incluidos el identificador del plugin, los nombres de herramientas declarados, la forma del resultado y si la herramienta
es opcional. Las líneas lentas se convierten en advertencias cuando una sola fábrica tarda
al menos 1s o la preparación total de las fábricas de herramientas de plugins tarda al menos 5s.

OpenClaw almacena en caché los resultados correctos de las fábricas de herramientas de plugins para resoluciones
repetidas con el mismo contexto efectivo de solicitud. La clave de caché incluye
la configuración efectiva del entorno de ejecución, el espacio de trabajo y el identificador del agente, la política del entorno aislado, la
configuración del navegador, el contexto de entrega, la identidad del solicitante y el estado de propiedad, por lo que
las fábricas que dependen de esos campos de confianza vuelven a ejecutarse cuando cambia el contexto.
Si las temporizaciones siguen siendo altas, es posible que el plugin esté realizando un trabajo costoso antes de
devolver sus definiciones de herramientas.

Si un plugin domina la temporización, inspeccionar sus registros durante la ejecución:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Después, actualizar, reinstalar o deshabilitar ese plugin. Los autores de plugins deben trasladar
la carga costosa de dependencias a la ruta de ejecución de la herramienta, en lugar de realizarla
dentro de la fábrica de herramientas.

Para obtener información sobre las raíces de dependencias, la validación de metadatos de paquetes, los registros del registro, el comportamiento de
recarga durante el inicio y la limpieza de elementos heredados, consultar
[Resolución de dependencias de plugins](/es/plugins/dependency-resolution).

## Contenido relacionado

- [Administrar plugins](/es/plugins/manage-plugins) - ejemplos de comandos para enumerar, instalar, actualizar, desinstalar y publicar
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Inventario de plugins](/es/plugins/plugin-inventory) - lista generada de plugins incluidos y externos
- [Referencia de plugins](/es/plugins/reference) - páginas de referencia generadas para cada plugin
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento en ClawHub y política de PR de documentación
- [Resolución de dependencias de plugins](/es/plugins/dependency-resolution) - raíces de instalación, registros del registro y límites del entorno de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - guía de creación de plugins nativos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - registro durante la ejecución, hooks y campos de la API
- [Manifiesto de plugins](/es/plugins/manifest) - manifiesto y metadatos del paquete
