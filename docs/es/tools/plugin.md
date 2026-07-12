---
doc-schema-version: 1
read_when:
    - Instalación o configuración de plugins
    - Cómo comprender las reglas de detección y carga de plugins
    - Trabajo con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Getting Started
summary: Instala, configura y gestiona los plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-11T23:36:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Los Plugins amplían OpenClaw con canales, proveedores de modelos, entornos de agentes, herramientas,
Skills, voz, transcripción en tiempo real, comunicación por voz, comprensión de contenido multimedia, generación,
obtención de contenido web, búsqueda web y otras capacidades de ejecución.

Use esta página para instalar un Plugin, reiniciar el Gateway, verificar que el entorno de ejecución
lo haya cargado y resolver errores de configuración habituales. Para ver ejemplos únicamente de comandos, consulte
[Administrar Plugins](/es/plugins/manage-plugins). Para consultar el inventario generado de
Plugins incluidos, externos oficiales y disponibles solo como código fuente, consulte
[Inventario de Plugins](/es/plugins/plugin-inventory).

## Requisitos

- un repositorio de trabajo o una instalación de OpenClaw con la CLI `openclaw` disponible
- acceso de red a la fuente seleccionada (ClawHub, npm o un servidor git)
- las credenciales, claves de configuración o herramientas del sistema operativo específicas que indiquen
  las instrucciones de configuración del Plugin
- permiso para que el Gateway que presta servicio a sus canales se recargue o reinicie

## Inicio rápido

<Steps>
  <Step title="Buscar el Plugin">
    Busque paquetes públicos de Plugins en [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub es la principal plataforma de descubrimiento de Plugins de la comunidad. Durante la
    transición del lanzamiento, las especificaciones de paquetes simples se siguen instalando desde npm, salvo que
    coincidan con un identificador de Plugin oficial. Las especificaciones `@openclaw/*` sin prefijo que coincidan con un
    Plugin incluido se resuelven a esa copia incluida. Use un prefijo de fuente explícito
    cuando necesite una fuente específica.

  </Step>

  <Step title="Instalar el Plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Trate las instalaciones de Plugins como la ejecución de código. Prefiera versiones fijadas para
    obtener instalaciones reproducibles en producción.

  </Step>

  <Step title="Configurar y habilitar el Plugin">
    Configure los ajustes específicos del Plugin en `plugins.entries.<id>.config`.
    Habilite el Plugin si aún no lo está:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si se define `plugins.allow`, el identificador del Plugin instalado debe estar en esa lista
    para que el Plugin pueda cargarse. `openclaw plugins install` añade el identificador instalado
    a una lista `plugins.allow` existente y elimina el mismo identificador de
    `plugins.deny`, de modo que la instalación explícita pueda cargarse después del reinicio.

  </Step>

  <Step title="Permitir que el Gateway se recargue">
    Instalar, actualizar o desinstalar el código de un Plugin requiere reiniciar el Gateway.
    Un Gateway administrado con la recarga de configuración habilitada detecta el cambio
    en el registro de instalación del Plugin y se reinicia automáticamente. De lo contrario, reinícielo
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    Habilitar o deshabilitar actualiza la configuración y el registro en frío. Una inspección del entorno de ejecución
    sigue siendo la prueba más clara de las superficies activas en tiempo de ejecución.

  </Step>

  <Step title="Verificar el registro en tiempo de ejecución">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` para comprobar las herramientas, los hooks, los servicios, los métodos del Gateway
    o los comandos de la CLI propiedad del Plugin que estén registrados. Una ejecución de `inspect` sin opciones solo
    comprueba el manifiesto y el registro en frío.

  </Step>
</Steps>

## Configuración

### Elegir una fuente de instalación

| Fuente      | Cuándo usarla                                                                       | Ejemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Desea descubrimiento nativo de OpenClaw, análisis, metadatos de versiones y sugerencias de instalación | `openclaw plugins install clawhub:<package>`                   |
| npm         | Necesita flujos de trabajo directos con el registro npm o etiquetas de distribución                             | `openclaw plugins install npm:<package>`                       |
| git         | Necesita una rama, etiqueta o confirmación de cambios de un repositorio                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Está desarrollando o probando un Plugin en el mismo equipo                     | `openclaw plugins install --link ./my-plugin`                  |
| mercado | Está instalando un Plugin de mercado compatible con Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Las especificaciones de paquetes simples tienen un comportamiento especial de compatibilidad: un nombre simple que
coincida con el identificador de un Plugin incluido utiliza esa fuente incluida; un nombre simple que coincida
con el identificador de un Plugin externo oficial utiliza el catálogo oficial de paquetes; cualquier otra
especificación simple se instala mediante npm durante la transición del lanzamiento. Las especificaciones `@openclaw/*`
sin prefijo que coincidan con Plugins incluidos también se resuelven a la copia incluida antes de recurrir
a npm. Use `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente el
paquete npm externo en lugar de la copia incluida. Use `clawhub:`, `npm:`,
`git:` o `npm-pack:` para seleccionar la fuente de forma determinista. Consulte
[`openclaw plugins`](/es/cli/plugins#install) para conocer el contrato completo del comando.

En las instalaciones desde npm, las especificaciones sin versión fijada y `@latest` eligen el paquete estable
más reciente que indique compatibilidad con esta compilación de OpenClaw. Si la
versión más reciente actual de npm declara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` más reciente de lo que admite esta compilación, OpenClaw examina
versiones estables anteriores e instala la más reciente que sea compatible. Las versiones exactas
y las etiquetas de canal explícitas, como `@beta`, permanecen fijadas al paquete seleccionado
y generan un error si son incompatibles.

### Política de instalación del operador

Configure `security.installPolicy` para ejecutar un comando de política local de confianza
antes de continuar con la instalación o actualización de un Plugin. La política recibe metadatos junto con
la ruta de la fuente preparada y puede permitir o bloquear la instalación. Abarca tanto las rutas de
instalación y actualización de la CLI como las respaldadas por el Gateway. Los hooks `before_install` del Plugin se ejecutan
más adelante y solo en procesos de OpenClaw en los que estén cargados los hooks del Plugin, por lo que debe usar
`security.installPolicy` para las decisiones de instalación controladas por el operador. La
opción obsoleta `--dangerously-force-unsafe-install` se acepta por
compatibilidad, pero no tiene efecto: no omite la política de instalación ni la
lista de dependencias de Plugins denegadas integrada en OpenClaw.

Consulte [Configuración de Skills](/es/tools/skills-config#operator-install-policy-securityinstallpolicy)
para conocer el esquema de ejecución compartido de `security.installPolicy` que utilizan tanto Skills como
Plugins.

### Configurar la política de Plugins

La estructura común de configuración de Plugins es:

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

- `plugins.enabled: false` deshabilita todos los Plugins y omite las tareas de descubrimiento y carga.
  Las referencias obsoletas a Plugins permanecen inactivas mientras esta opción esté activa; vuelva a habilitar
  los Plugins antes de ejecutar la limpieza de doctor si desea eliminar los identificadores obsoletos.
- `plugins.deny` prevalece sobre la lista de permitidos y la habilitación individual de cada Plugin.
- `plugins.allow` es una lista de permitidos exclusiva. Las herramientas propiedad de Plugins que no estén en la
  lista de permitidos permanecen inaccesibles, incluso cuando `tools.allow` incluya `"*"`.
- `plugins.entries.<id>.enabled: false` deshabilita un Plugin y conserva su
  configuración.
- `plugins.load.paths` añade archivos o directorios locales explícitos de Plugins.
  Las rutas locales administradas mediante `plugins install` deben ser directorios o
  archivos comprimidos de Plugins; use `plugins.load.paths` para archivos independientes de Plugins.
- Los Plugins procedentes del espacio de trabajo están deshabilitados de forma predeterminada; habilítelos explícitamente o
  añádalos a la lista de permitidos antes de usar código local del espacio de trabajo.
- Los Plugins incluidos siguen sus metadatos integrados de activación o desactivación predeterminada,
  salvo que la configuración los anule explícitamente.
- `plugins.slots.<slot>` (`memory` o `contextEngine`) selecciona un Plugin para una
  categoría exclusiva. La selección de un espacio cuenta como activación explícita y
  fuerza la habilitación del Plugin seleccionado para ese espacio, incluso si normalmente
  requiriera activación voluntaria. `plugins.deny` y `plugins.entries.<id>.enabled: false` aún
  lo bloquean.
- Los Plugins incluidos de activación voluntaria pueden activarse automáticamente cuando la configuración nombra una de sus
  superficies propias, como una referencia de proveedor/modelo, una configuración de canal, un backend de la CLI
  o un entorno de ejecución de agentes.
- El enrutamiento de Codex de la familia OpenAI mantiene separados los límites entre el proveedor y el Plugin
  de ejecución: las referencias heredadas de modelos Codex son configuraciones heredadas que doctor repara,
  mientras que el Plugin `codex` incluido controla el entorno de ejecución del servidor de aplicaciones Codex para
  las referencias canónicas de agentes `openai/*`, el valor explícito `agentRuntime.id: "codex"` y
  las referencias heredadas `codex/*`.

Cuando `plugins.allow` no está definido y se descubren automáticamente Plugins no incluidos desde
el espacio de trabajo o las raíces globales de Plugins, el registro de inicio muestra
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
con los identificadores de los Plugins descubiertos y, para listas cortas, un fragmento mínimo de
`plugins.allow`. Ejecute [`openclaw plugins list --enabled --verbose`](/es/cli/plugins#list)
o [`openclaw plugins inspect <id>`](/es/cli/plugins#inspect) con el identificador del
Plugin indicado antes de copiar Plugins de confianza en `openclaw.json`. La misma
fijación de confianza se aplica cuando el diagnóstico indica que un Plugin se cargó
`without install/load-path provenance`: inspeccione el identificador de ese Plugin y fíjelo en
`plugins.allow` o vuelva a instalarlo desde una fuente de confianza para que OpenClaw registre la
procedencia de la instalación.

Ejecute `openclaw doctor` o `openclaw doctor --fix` cuando la validación de la configuración
informe de identificadores obsoletos de Plugins, discrepancias entre la lista de permitidos y las herramientas, o rutas heredadas de
Plugins incluidos.

## Comprender los formatos de Plugins

OpenClaw reconoce dos formatos de Plugins:

| Formato                 | Cómo se carga                                                                 | Cuándo usarlo                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo de OpenClaw | `openclaw.plugin.json` junto con un módulo de ejecución cargado en el proceso               | Está instalando o creando capacidades de ejecución específicas de OpenClaw  |
| Paquete compatible      | Estructura de Plugin de Codex, Claude o Cursor asignada al inventario de Plugins de OpenClaw | Está reutilizando Skills, comandos, hooks o metadatos de paquetes compatibles |

Ambos formatos aparecen en `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` y `openclaw plugins disable`. Consulte
[Paquetes de Plugins](/es/plugins/bundles) para conocer el límite de compatibilidad de los paquetes y
[Creación de Plugins](/es/plugins/building-plugins) para crear Plugins nativos.

## Hooks de Plugins

Los Plugins pueden registrar hooks en tiempo de ejecución mediante dos API diferentes:

- Hooks tipados de `api.on(...)` para eventos del ciclo de vida del entorno de ejecución. Esta es la
  superficie preferida para middleware, políticas, reescritura de mensajes, conformación de
  prompts y control de herramientas.
- `api.registerHook(...)` para el sistema interno de hooks descrito en
  [Hooks](/es/automation/hooks). Se utiliza principalmente para efectos secundarios generales de comandos o del ciclo de vida
  y para mantener la compatibilidad con la automatización existente de estilo HOOK.

Regla rápida: si el controlador necesita prioridad, semántica de combinación o
comportamiento de bloqueo o cancelación, use hooks tipados. Si solo reacciona a `command:new`,
`command:reset`, `message:sent` o eventos generales similares, `api.registerHook`
es adecuado.

Los hooks internos administrados por Plugins aparecen en `openclaw hooks list` con
`plugin:<id>`. No puede habilitarlos ni deshabilitarlos mediante `openclaw hooks`;
habilite o deshabilite el Plugin en su lugar.

## Verificar el Gateway activo

`openclaw plugins list` y `openclaw plugins inspect` sin opciones leen el estado en frío de la
configuración, el manifiesto y el registro. No demuestran que un Gateway que ya esté en ejecución
haya importado el mismo código del Plugin.

Cuando un Plugin aparece como instalado, pero el tráfico de chat activo no lo utiliza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Los Gateways administrados se reinician automáticamente después de cambios de instalación, actualización y desinstalación que alteren el código fuente del plugin. En instalaciones en VPS o contenedores, asegúrese de que cualquier reinicio manual se dirija al proceso hijo real de `openclaw gateway run` que presta servicio a sus canales, no solo a un contenedor o supervisor.

## Solución de problemas

| Síntoma                                                        | Comprobación                                                                                                                                      | Solución                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| El plugin aparece en `plugins list`, pero los hooks de ejecución no se ejecutan  | Use `openclaw plugins inspect <id> --runtime --json` y confirme el Gateway activo con `gateway status --deep --require-rpc`             | Reinicie el Gateway activo después de cambios de instalación, actualización, configuración o código fuente                               |
| Aparecen diagnósticos de propiedad duplicada de canales o herramientas         | Ejecute `openclaw plugins list --enabled --verbose`, inspeccione cada plugin sospechoso con `--runtime --json` y compare la propiedad de canales y herramientas | Deshabilite uno de los propietarios, elimine instalaciones obsoletas o use `preferOver` en el manifiesto para un reemplazo intencional      |
| La configuración indica que falta un plugin                                | Consulte el [inventario de plugins](/es/plugins/plugin-inventory) para determinar si está incluido, es externo oficial o solo está disponible como código fuente                           | Instale el paquete externo, habilite el plugin incluido o elimine la configuración obsoleta                         |
| La configuración no es válida durante la instalación                               | Lea el mensaje de validación y ejecute `openclaw doctor --fix` si señala un estado obsoleto del plugin                                             | Doctor puede poner en cuarentena la configuración no válida del plugin deshabilitando la entrada y eliminando los datos no válidos     |
| La ruta del plugin está bloqueada por una propiedad o unos permisos sospechosos | Inspeccione el diagnóstico anterior al error de configuración                                                                                             | Corrija la propiedad o los permisos del sistema de archivos y, después, ejecute `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloquea los comandos del ciclo de vida                | Confirme que Nix administra la instalación                                                                                                      | Cambie la selección del plugin en el código fuente de Nix en lugar de usar comandos que modifican plugins                      |
| La importación de dependencias falla durante la ejecución                             | Compruebe si el plugin se instaló mediante npm/git/ClawHub o se cargó desde una ruta local                                                 | Ejecute `openclaw plugins update <id>`, reinstale el código fuente o instale por su cuenta las dependencias locales del plugin |

Cuando la configuración obsoleta de un plugin aún menciona un plugin de canal que ya no se puede detectar, la validación de la configuración convierte la clave de ese canal en una advertencia en lugar de un error crítico, por lo que el inicio del Gateway aún puede prestar servicio a todos los demás canales. Ejecute `openclaw doctor --fix` para eliminar las entradas obsoletas del plugin y del canal. Las claves de canal desconocidas sin indicios de un plugin obsoleto siguen provocando un error de validación para que los errores tipográficos permanezcan visibles.

Para reemplazar intencionalmente un canal, el plugin preferido debe declarar `channelConfigs.<channel-id>.preferOver` con el id del plugin heredado o de menor prioridad. Si ambos plugins están habilitados explícitamente, OpenClaw conserva esa solicitud e informa de diagnósticos de propiedad duplicada de canales o herramientas en lugar de elegir silenciosamente un propietario.

Si un paquete instalado informa de que `requires compiled runtime output for
TypeScript entry ...`, el paquete se publicó sin los archivos JavaScript que OpenClaw necesita durante la ejecución. Actualícelo o reinstálelo cuando el editor publique el JavaScript compilado, o deshabilite o desinstale el plugin hasta entonces.

### Propiedad de ruta del plugin bloqueada

Si los diagnósticos indican `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` y la validación continúa con `plugin present but blocked`, OpenClaw encontró archivos del plugin pertenecientes a un usuario de Unix distinto del proceso que los carga. Mantenga la configuración del plugin; corrija la propiedad del sistema de archivos o ejecute OpenClaw como el mismo usuario propietario del directorio de estado.

En instalaciones con Docker, la imagen oficial se ejecuta como `node` (uid `1000`), por lo que los directorios de configuración y del espacio de trabajo de OpenClaw montados desde el host normalmente deben pertenecer al uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si ejecuta OpenClaw intencionalmente como root, cambie en su lugar la propiedad de la raíz administrada de plugins a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Después de corregir la propiedad, vuelva a ejecutar `openclaw doctor --fix` o `openclaw plugins registry --refresh` para que el registro persistente de plugins coincida con los archivos corregidos.

### Configuración lenta de herramientas de plugins

Si los turnos del agente parecen detenerse mientras se preparan las herramientas, habilite el registro de seguimiento y busque líneas de tiempos de las fábricas de herramientas de plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Busque:

```text
[trace:plugin-tools] factory timings ...
```

El resumen enumera el tiempo total de las fábricas y las fábricas de herramientas de plugins más lentas, incluidos el id del plugin, los nombres de herramientas declarados, la estructura del resultado y si la herramienta es opcional. Las líneas lentas se convierten en advertencias cuando una sola fábrica tarda al menos 1 segundo o la preparación total de las fábricas de herramientas de plugins tarda al menos 5 segundos.

OpenClaw almacena en caché los resultados correctos de las fábricas de herramientas de plugins para resoluciones repetidas con el mismo contexto efectivo de solicitud. La clave de caché incluye la configuración efectiva del entorno de ejecución, el espacio de trabajo y el id del agente, la política del entorno aislado, la configuración del navegador, el contexto de entrega, la identidad del solicitante y el estado de propiedad, por lo que las fábricas que dependen de esos campos de confianza vuelven a ejecutarse cuando cambia el contexto. Si los tiempos siguen siendo elevados, es posible que el plugin realice tareas costosas antes de devolver las definiciones de sus herramientas.

Si un plugin domina los tiempos, inspeccione sus registros del entorno de ejecución:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Después, actualice, reinstale o deshabilite ese plugin. Los autores de plugins deben aplazar la carga costosa de dependencias hasta la ruta de ejecución de la herramienta, en lugar de realizarla dentro de la fábrica de herramientas.

Para obtener información sobre las raíces de dependencias, la validación de metadatos de paquetes, los registros del registro, el comportamiento de recarga durante el inicio y la limpieza de elementos heredados, consulte [Resolución de dependencias de plugins](/es/plugins/dependency-resolution).

## Contenido relacionado

- [Administrar plugins](/es/plugins/manage-plugins) - ejemplos de comandos para enumerar, instalar, actualizar, desinstalar y publicar
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Inventario de plugins](/es/plugins/plugin-inventory) - lista generada de plugins incluidos y externos
- [Referencia de plugins](/es/plugins/reference) - páginas de referencia generadas para cada plugin
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento en ClawHub y política de PR de documentación
- [Resolución de dependencias de plugins](/es/plugins/dependency-resolution) - raíces de instalación, registros del registro y límites del entorno de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - guía para crear plugins nativos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - registro del entorno de ejecución, hooks y campos de la API
- [Manifiesto del plugin](/es/plugins/manifest) - manifiesto y metadatos del paquete
