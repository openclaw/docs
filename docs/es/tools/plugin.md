---
doc-schema-version: 1
read_when:
    - Instalación o configuración de plugins
    - Comprender las reglas de detección y carga de plugins
    - Trabajo con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Getting Started
summary: Instalar, configurar y gestionar los plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-16T12:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Los Plugins amplían OpenClaw con canales, proveedores de modelos, entornos de agentes, herramientas,
Skills, habla, transcripción en tiempo real, voz, comprensión de contenido multimedia, generación,
obtención web, búsqueda web y otras capacidades de ejecución.

Use esta página para instalar un Plugin, reiniciar el Gateway, verificar que el entorno de ejecución
lo haya cargado y resolver errores habituales de configuración. Para ver ejemplos solo de comandos, consulte
[Gestionar Plugins](/es/plugins/manage-plugins). Para consultar el inventario generado de
Plugins incluidos, externos oficiales y disponibles solo como código fuente, consulte
[Inventario de Plugins](/es/plugins/plugin-inventory).

## Requisitos

- una copia de trabajo o instalación de OpenClaw con la CLI `openclaw` disponible
- acceso de red a la fuente seleccionada (ClawHub, npm o un host de git)
- cualquier credencial, clave de configuración o herramienta del sistema operativo específica del Plugin indicada en
  la documentación de configuración de ese Plugin
- permiso para que el Gateway que proporciona servicio a los canales se recargue o reinicie

## Inicio rápido

<Steps>
  <Step title="Buscar el Plugin">
    Busque paquetes públicos de Plugins en [ClawHub](/es/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub es la principal superficie de descubrimiento de Plugins de la comunidad. Durante la
    transición del lanzamiento, las especificaciones de paquetes simples ordinarias siguen instalándose desde npm, salvo que
    coincidan con un id de Plugin oficial. Las especificaciones `@openclaw/*` sin prefijo que coincidan con un
    Plugin incluido se resuelven a esa copia incluida. Use un prefijo de fuente explícito
    cuando necesite específicamente una fuente.

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
    obtener instalaciones de producción reproducibles. Los paquetes de ClawHub y el
    catálogo incluido/oficial de OpenClaw son fuentes de confianza. Las nuevas fuentes arbitrarias de npm, git,
    rutas o archivos locales, `npm-pack:` o mercados requieren
    `--force` en instalaciones no interactivas después de
    revisar la fuente y determinar que es de confianza.

  </Step>

  <Step title="Configurar y habilitar el Plugin">
    Configure las opciones específicas del Plugin en `plugins.entries.<id>.config`.
    Habilite el Plugin si todavía no lo está:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si se establece `plugins.allow`, el id del Plugin instalado debe estar en esa lista
    para que el Plugin pueda cargarse. `openclaw plugins install` añade el
    id instalado a una lista `plugins.allow` existente y elimina el mismo id de
    `plugins.deny` para que la instalación explícita pueda cargarse tras el reinicio.

  </Step>

  <Step title="Permitir que el Gateway se recargue">
    Instalar, actualizar o desinstalar el código de un Plugin requiere reiniciar el Gateway.
    Un Gateway administrado con la recarga de configuración habilitada detecta el cambio en
    el registro de instalación del Plugin y se reinicia automáticamente. De lo contrario, reinícielo
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    Las operaciones de habilitar y deshabilitar actualizan la configuración y el registro en frío. Una inspección del entorno de ejecución
    sigue siendo la prueba más clara de las superficies activas del entorno de ejecución.

  </Step>

  <Step title="Verificar el registro en el entorno de ejecución">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` para demostrar el registro de herramientas, hooks, servicios, métodos del Gateway
    o comandos de la CLI pertenecientes al Plugin. `inspect` sin opciones es solo una comprobación en frío
    del manifiesto y el registro.

  </Step>
</Steps>

## Configuración

### Elegir una fuente de instalación

| Fuente      | Cuándo usarla                                                                  | Ejemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Se busca descubrimiento nativo de OpenClaw, análisis, metadatos de versiones y sugerencias de instalación | `openclaw plugins install clawhub:<package>`                   |
| npm         | Se necesitan flujos de trabajo directos con el registro de npm o etiquetas de distribución | `openclaw plugins install npm:<package>`                       |
| git         | Se necesita una rama, etiqueta o confirmación de un repositorio                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Se está desarrollando o probando un Plugin en la misma máquina                 | `openclaw plugins install --link ./my-plugin`                  |
| mercado     | Se está instalando un Plugin de mercado compatible con Claude                  | `openclaw plugins install <plugin> --marketplace <source>`     |

Las especificaciones de paquetes simples tienen un comportamiento especial de compatibilidad: un nombre simple que
coincida con el id de un Plugin incluido usa esa fuente incluida; un nombre simple que coincida
con el id de un Plugin externo oficial usa el catálogo oficial de paquetes; cualquier otra
especificación simple se instala mediante npm durante la transición del lanzamiento. Las especificaciones `@openclaw/*`
sin prefijo que coincidan con Plugins incluidos también se resuelven a la copia incluida antes de recurrir
a npm. Use `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente el
paquete externo de npm en lugar de la copia incluida. Use `clawhub:`, `npm:`,
`git:` o `npm-pack:` para seleccionar la fuente de forma determinista. Consulte
[`openclaw plugins`](/es/cli/plugins#install) para conocer el contrato completo del comando.

En las instalaciones desde npm, las especificaciones sin versión fijada y `@latest` seleccionan el paquete estable
más reciente que indique compatibilidad con esta compilación de OpenClaw. Si la
versión más reciente actual de npm declara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` más reciente que el admitido por esta compilación, OpenClaw examina
versiones estables anteriores e instala la más reciente que sea compatible. Las versiones exactas
y las etiquetas de canal explícitas, como `@beta`, permanecen fijadas al paquete seleccionado
y fallan si son incompatibles.

### Política de instalación del operador

Configure `security.installPolicy` para ejecutar un comando de política local de confianza
antes de que proceda la instalación o actualización de un Plugin. La política recibe metadatos y
la ruta de origen preparada, y puede permitir o bloquear la instalación. Abarca tanto las rutas de
instalación y actualización mediante la CLI como las respaldadas por el Gateway. Los hooks `before_install` del Plugin se ejecutan
más tarde y solo en procesos de OpenClaw donde se cargan los hooks de Plugins, por lo que debe usarse
`security.installPolicy` para las decisiones de instalación pertenecientes al operador. La
marca obsoleta `--dangerously-force-unsafe-install` se acepta por
compatibilidad, pero no realiza ninguna acción: no omite la política de instalación ni la
lista de dependencias de Plugins denegadas integrada en OpenClaw.

Consulte [Configuración de Skills](/es/tools/skills-config#operator-install-policy-securityinstallpolicy)
para conocer el esquema de ejecución compartido `security.installPolicy` que usan tanto las Skills como los
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

- `plugins.enabled: false` deshabilita todos los Plugins y omite el trabajo de descubrimiento y carga.
  Las referencias obsoletas a Plugins permanecen inactivas mientras esta opción esté activa; vuelva a habilitar los
  Plugins antes de ejecutar la limpieza de doctor si desea eliminar los ids obsoletos.
- `plugins.deny` prevalece sobre la lista de permitidos y la habilitación individual de cada Plugin.
- `plugins.allow` es una lista de permitidos exclusiva. Las herramientas pertenecientes a Plugins que no figuren en la
  lista de permitidos permanecen no disponibles incluso cuando `tools.allow` incluye `"*"`.
- `plugins.entries.<id>.enabled: false` deshabilita un Plugin sin eliminar su
  configuración.
- `plugins.load.paths` añade archivos o directorios locales explícitos de Plugins.
  Las rutas locales administradas mediante `plugins install` deben ser directorios o
  archivos de Plugins; use `plugins.load.paths` para archivos independientes de Plugins.
- Los Plugins procedentes del espacio de trabajo están deshabilitados de forma predeterminada; habilítelos explícitamente o
  añádalos a la lista de permitidos antes de usar código del espacio de trabajo local.
- Los Plugins incluidos siguen sus metadatos integrados de activación o desactivación predeterminada,
  salvo que la configuración los anule explícitamente.
- `plugins.slots.<slot>` (`memory` o `contextEngine`) selecciona un Plugin para una
  categoría exclusiva. La selección de un espacio cuenta como activación explícita y
  habilita de forma forzada el Plugin seleccionado para ese espacio, incluso si de otro modo
  fuera opcional. `plugins.deny` y `plugins.entries.<id>.enabled: false` siguen
  bloqueándolo.
- Los Plugins incluidos opcionales pueden activarse automáticamente cuando la configuración nombra una de sus
  superficies propias, como una referencia de proveedor/modelo, una configuración de canal, un backend de la CLI
  o un entorno de ejecución de agente.
- El enrutamiento de Codex de la familia OpenAI mantiene separados los límites del proveedor y del Plugin de ejecución:
  las referencias de modelos Codex heredadas son configuraciones heredadas que doctor repara,
  mientras que el Plugin incluido `codex` controla el entorno de ejecución del servidor de aplicaciones de Codex para
  las referencias canónicas de agentes `openai/*`, `agentRuntime.id: "codex"` explícitas y
  las referencias heredadas `codex/*`.

Cuando `plugins.allow` no está establecido y se descubren automáticamente Plugins no incluidos desde
el espacio de trabajo o las raíces globales de Plugins, el inicio registra
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
con los ids de Plugins descubiertos y, en listas cortas, un fragmento mínimo de `plugins.allow`.
Ejecute [`openclaw plugins list --enabled --verbose`](/es/cli/plugins#list)
o [`openclaw plugins inspect <id>`](/es/cli/plugins#inspect) con el id del
Plugin indicado antes de copiar Plugins de confianza en `openclaw.json`. La misma
fijación de confianza se aplica cuando los diagnósticos indican que un Plugin se cargó
`without install/load-path provenance`: inspeccione el id de ese Plugin y fíjelo después en
`plugins.allow`, o reinstálelo desde una fuente de confianza para que OpenClaw registre la
procedencia de la instalación.

Ejecute `openclaw doctor` o `openclaw doctor --fix` cuando la validación de la configuración
informe de ids de Plugins obsoletos, discrepancias entre la lista de permitidos y las herramientas, o rutas heredadas de Plugins
incluidos.

## Comprender los formatos de Plugins

OpenClaw reconoce dos formatos de Plugins:

| Formato                | Cómo se carga                                                                | Cuándo usarlo                                                           |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo de OpenClaw | `openclaw.plugin.json` más un módulo de ejecución cargado en el proceso       | Se están instalando o creando capacidades de ejecución específicas de OpenClaw |
| Paquete compatible     | Diseño de Plugin de Codex, Claude o Cursor asignado al inventario de Plugins de OpenClaw | Se están reutilizando Skills, comandos, hooks o metadatos de paquetes compatibles |

Ambos formatos aparecen en `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` y `openclaw plugins disable`. Consulte
[Paquetes de Plugins](/es/plugins/bundles) para conocer el límite de compatibilidad de los paquetes y
[Creación de Plugins](/es/plugins/building-plugins) para crear Plugins nativos.

## Hooks de Plugins

Los Plugins pueden registrar hooks en tiempo de ejecución mediante dos API distintas:

- hooks tipados `api.on(...)` para eventos del ciclo de vida del entorno de ejecución. Esta es la
  superficie preferida para middleware, políticas, reescritura de mensajes, conformación de prompts
  y control de herramientas.
- `api.registerHook(...)` para el sistema interno de hooks descrito en
  [Hooks](/es/automation/hooks). Se usa principalmente para efectos secundarios generales de comandos o del ciclo de vida
  y para mantener la compatibilidad con la automatización existente de estilo HOOK.

Regla rápida: si el controlador necesita prioridad, semántica de combinación o
comportamiento de bloqueo o cancelación, use hooks tipados. Si solo reacciona a `command:new`,
`command:reset`, `message:sent` o eventos generales similares, `api.registerHook`
es adecuado.

Los hooks internos administrados por Plugins aparecen en `openclaw hooks list` con
`plugin:<id>`. No pueden habilitarse ni deshabilitarse mediante `openclaw hooks`;
habilite o deshabilite el Plugin en su lugar.

## Verificar el Gateway activo

`openclaw plugins list` y el `openclaw plugins inspect` sin formato leen la configuración en frío,
el manifiesto y el estado del registro. No demuestran que un
Gateway que ya está en ejecución haya importado el mismo código del plugin.

Cuando un plugin aparece como instalado, pero el tráfico de chat en vivo no lo utiliza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Los Gateways administrados se reinician automáticamente después de cambios de
instalación, actualización y desinstalación de plugins que alteren su código fuente. En
instalaciones en VPS o contenedores, asegúrese de que cualquier reinicio manual se dirija
al proceso secundario `openclaw gateway run` real que atiende sus canales, no solo a un
proceso envolvente o supervisor.

## Solución de problemas

| Síntoma                                                        | Comprobación                                                                                                                                      | Solución                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| El plugin aparece en `plugins list`, pero los hooks de tiempo de ejecución no se ejecutan  | Use `openclaw plugins inspect <id> --runtime --json` y confirme el Gateway activo con `gateway status --deep --require-rpc`             | Reinicie el Gateway en vivo después de cambios de instalación, actualización, configuración o código fuente                               |
| Aparecen diagnósticos de propiedad duplicada de canales o herramientas         | Ejecute `openclaw plugins list --enabled --verbose`, inspeccione cada plugin sospechoso con `--runtime --json` y compare la propiedad de canales/herramientas | Deshabilite un propietario, elimine instalaciones obsoletas o use `preferOver` en el manifiesto para una sustitución intencional      |
| La configuración indica que falta un plugin                                | Consulte el [inventario de plugins](/es/plugins/plugin-inventory) para saber si está incluido, es oficial externo o solo está disponible como código fuente                           | Instale el paquete externo, habilite el plugin incluido o elimine la configuración obsoleta                         |
| La configuración no es válida durante la instalación                               | Lea el mensaje de validación y ejecute `openclaw doctor --fix` si señala un estado obsoleto del plugin                                             | Doctor puede poner en cuarentena la configuración no válida del plugin deshabilitando la entrada y eliminando la carga útil no válida     |
| La ruta del plugin está bloqueada debido a propiedades o permisos sospechosos | Examine el diagnóstico anterior al error de configuración                                                                                             | Corrija la propiedad o los permisos del sistema de archivos y, a continuación, ejecute `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloquea los comandos del ciclo de vida                | Confirme que la instalación esté administrada por Nix                                                                                                      | Cambie la selección de plugins en el código fuente de Nix en lugar de usar comandos que modifican plugins                      |
| La importación de dependencias falla durante la ejecución                             | Compruebe si el plugin se instaló mediante npm/git/ClawHub o se cargó desde una ruta local                                                 | Ejecute `openclaw plugins update <id>`, reinstale el código fuente o instale manualmente las dependencias locales del plugin |

Cuando la configuración obsoleta de un plugin aún menciona un plugin de canal que ya no
se puede detectar, la validación de la configuración reduce la clave de ese canal a una
advertencia en lugar de un error grave, de modo que el inicio del Gateway todavía pueda
atender a todos los demás canales. Ejecute `openclaw doctor --fix` para eliminar las entradas
obsoletas de plugins y canales. Las claves de canal desconocidas sin indicios de plugins
obsoletos siguen provocando un error de validación para que los errores tipográficos
permanezcan visibles.

Para sustituir un canal intencionalmente, el plugin preferido debe declarar
`channelConfigs.<channel-id>.preferOver` con el id del plugin heredado o de menor
prioridad. Si ambos plugins están habilitados explícitamente, OpenClaw conserva esa
solicitud e informa de diagnósticos de canales/herramientas duplicados en lugar de elegir
silenciosamente un propietario.

Si un paquete instalado informa que `requires compiled runtime output for
TypeScript entry ...`, el paquete se publicó sin los archivos JavaScript
que OpenClaw necesita durante la ejecución. Actualícelo o reinstálelo después de que el
publicador distribuya el JavaScript compilado, o deshabilite/desinstale el plugin hasta
entonces.

### Propiedad bloqueada de la ruta del plugin

Si los diagnósticos indican
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
y la validación continúa con `plugin present but blocked`, OpenClaw encontró
archivos del plugin que pertenecen a un usuario de Unix distinto del proceso que los
carga. Mantenga la configuración del plugin; corrija la propiedad del sistema de archivos
o ejecute OpenClaw como el mismo usuario propietario del directorio de estado.

Para instalaciones de Docker, la imagen oficial se ejecuta como `node` (uid `1000`), por lo
que los directorios de configuración y espacio de trabajo de OpenClaw montados desde el
host normalmente deben pertenecer al uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si ejecuta OpenClaw intencionalmente como root, repare la raíz de plugins administrados
para que pertenezca a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Después de corregir la propiedad, vuelva a ejecutar `openclaw doctor --fix` o
`openclaw plugins registry --refresh` para que el registro persistente de plugins
coincida con los archivos reparados.

### Configuración lenta de herramientas de plugins

Si los turnos del agente parecen detenerse mientras se preparan las herramientas,
habilite el registro de seguimiento y busque líneas de tiempos de las factorías de
herramientas de plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Busque:

```text
[trace:plugin-tools] tiempos de las factorías ...
```

El resumen enumera el tiempo total de las factorías y las factorías de herramientas de
plugins más lentas, incluidos el id del plugin, los nombres de herramientas declarados, la
forma del resultado y si la herramienta es opcional. Las líneas lentas se elevan a
advertencias cuando una sola factoría tarda al menos 1s o la preparación total de las
factorías de herramientas de plugins tarda al menos 5s.

OpenClaw almacena en caché los resultados satisfactorios de las factorías de herramientas
de plugins para resoluciones repetidas con el mismo contexto efectivo de solicitud. La
clave de caché incluye la configuración efectiva del tiempo de ejecución, el espacio de
trabajo y el id del agente, la política del entorno aislado, la configuración del
navegador, el contexto de entrega, la identidad del solicitante y el estado de propiedad,
por lo que las factorías que dependen de esos campos de confianza vuelven a ejecutarse
cuando cambia el contexto. Si los tiempos siguen siendo elevados, es posible que el plugin
realice tareas costosas antes de devolver sus definiciones de herramientas.

Si un plugin domina los tiempos, examine sus registros de tiempo de ejecución:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

A continuación, actualice, reinstale o deshabilite ese plugin. Los autores de plugins deben
trasladar la carga costosa de dependencias a la ruta de ejecución de la herramienta en
lugar de realizarla dentro de la factoría de herramientas.

Para obtener información sobre las raíces de dependencias, la validación de metadatos de
paquetes, los registros del registro, el comportamiento de recarga al iniciar y la
limpieza heredada, consulte
[Resolución de dependencias de plugins](/es/plugins/dependency-resolution).

## Contenido relacionado

- [Administrar plugins](/es/plugins/manage-plugins) - ejemplos de comandos para enumerar, instalar, actualizar, desinstalar y publicar
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Inventario de plugins](/es/plugins/plugin-inventory) - lista generada de plugins incluidos y externos
- [Referencia de plugins](/es/plugins/reference) - páginas de referencia generadas para cada plugin
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento en ClawHub y política de PR de documentación
- [Resolución de dependencias de plugins](/es/plugins/dependency-resolution) - raíces de instalación, registros del registro y límites del tiempo de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - guía de creación de plugins nativos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - registro del tiempo de ejecución, hooks y campos de la API
- [Manifiesto de plugins](/es/plugins/manifest) - manifiesto y metadatos del paquete
