---
doc-schema-version: 1
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Getting Started
summary: Instalar, configurar y gestionar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-05T11:51:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Los plugins amplían OpenClaw con canales, proveedores de modelos, arneses de agentes, herramientas,
Skills, voz, transcripción en tiempo real, voz sintética, comprensión de medios, generación,
obtención web, búsqueda web y otras capacidades de runtime.

Usa esta página para instalar un plugin, reiniciar el Gateway, verificar que el runtime
lo cargó y resolver fallos comunes de configuración. Para ejemplos solo con comandos, consulta
[Gestionar plugins](/es/plugins/manage-plugins). Para el inventario generado de
plugins incluidos, oficiales externos y solo de código fuente, consulta
[Inventario de plugins](/es/plugins/plugin-inventory).

## Requisitos

- un checkout o una instalación de OpenClaw con la CLI `openclaw` disponible
- acceso de red a la fuente seleccionada (ClawHub, npm o un host git)
- cualquier credencial, clave de configuración o herramienta del SO específica del plugin indicada por la
  documentación de configuración de ese plugin
- permiso para que el Gateway que sirve tus canales se recargue o reinicie

## Inicio rápido

<Steps>
  <Step title="Encontrar el plugin">
    Busca paquetes de plugins públicos en [ClawHub](/es/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub es la superficie principal de descubrimiento para plugins de la comunidad. Durante el
    cambio de lanzamiento, las especificaciones ordinarias de paquetes sin prefijo aún se instalan desde npm salvo que
    coincidan con un id de plugin oficial. Las especificaciones `@openclaw/*` sin procesar que coincidan con un
    plugin incluido se resuelven a esa copia incluida. Usa un prefijo de fuente explícito
    cuando necesites específicamente una fuente.

  </Step>

  <Step title="Instalar el plugin">
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

    Trata las instalaciones de plugins como ejecutar código. Prefiere versiones fijadas para
    instalaciones de producción reproducibles.

  </Step>

  <Step title="Configurar y habilitarlo">
    Configura los ajustes específicos del plugin en `plugins.entries.<id>.config`.
    Habilita el plugin si aún no está habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si `plugins.allow` está definido, el id del plugin instalado debe estar en esa lista
    antes de que el plugin pueda cargarse. `openclaw plugins install` añade el
    id instalado a una lista `plugins.allow` existente y elimina el mismo id de
    `plugins.deny` para que la instalación explícita pueda cargarse tras reiniciar.

  </Step>

  <Step title="Permitir que el Gateway se recargue">
    Instalar, actualizar o desinstalar código de plugin requiere reiniciar el Gateway.
    Un Gateway gestionado con recarga de configuración habilitada detecta el registro de instalación
    de plugin cambiado y se reinicia automáticamente. De lo contrario, reinícialo
    tú:

    ```bash
    openclaw gateway restart
    ```

    La configuración de actualización habilita/deshabilita y el registro en frío. Una inspección del runtime
    sigue siendo la prueba más clara de superficies de runtime activas.

  </Step>

  <Step title="Verificar el registro en runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Usa `--runtime` para probar herramientas registradas, hooks, servicios, métodos de
    Gateway o comandos de CLI propiedad del plugin. `inspect` sin opciones es solo una comprobación en frío
    del manifiesto y el registro.

  </Step>
</Steps>

## Configuración

### Elegir una fuente de instalación

| Fuente      | Úsala cuando                                                                       | Ejemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Quieres descubrimiento nativo de OpenClaw, escaneos, metadatos de versión e indicaciones de instalación | `openclaw plugins install clawhub:<package>`                   |
| npm         | Necesitas flujos directos del registro npm o dist-tag                             | `openclaw plugins install npm:<package>`                       |
| git         | Necesitas una rama, etiqueta o commit de un repositorio                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Estás desarrollando o probando un plugin en la misma máquina                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Estás instalando un plugin de marketplace compatible con Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Las especificaciones de paquetes sin prefijo tienen un comportamiento de compatibilidad especial: un nombre sin prefijo que
coincide con un id de plugin incluido usa esa fuente incluida; un nombre sin prefijo que coincide
con un id de plugin oficial externo usa el catálogo oficial de paquetes; cualquier otra
especificación sin prefijo se instala mediante npm durante el cambio de lanzamiento. Las especificaciones `@openclaw/*`
sin procesar que coincidan con plugins incluidos también se resuelven a la copia incluida antes del
fallback de npm. Usa `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente el
paquete npm externo en lugar de la copia incluida. Usa `clawhub:`, `npm:`,
`git:` o `npm-pack:` para una selección determinista de la fuente. Consulta
[`openclaw plugins`](/es/cli/plugins#install) para el contrato completo del comando.

Para instalaciones npm, las especificaciones sin fijar y `@latest` eligen el paquete estable
más reciente que anuncia compatibilidad con esta compilación de OpenClaw. Si la
versión latest actual de npm declara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` más reciente que lo admitido por esta compilación, OpenClaw escanea
versiones estables anteriores e instala la más reciente que encaje. Las versiones exactas
y las etiquetas de canal explícitas como `@beta` permanecen fijadas al paquete seleccionado
y fallan cuando son incompatibles.

### Política de instalación del operador

Configura `security.installPolicy` para ejecutar un comando de política local de confianza
antes de que continúe una instalación o actualización de plugin. La política recibe metadatos más
la ruta de origen preparada y puede permitir o bloquear la instalación. Cubre tanto rutas de instalación/actualización
por CLI como respaldadas por Gateway. Los hooks `before_install` del plugin se ejecutan
después, y solo en procesos de OpenClaw donde los hooks de plugin están cargados, así que usa
`security.installPolicy` para decisiones de instalación propiedad del operador. La bandera
obsoleta `--dangerously-force-unsafe-install` se acepta por compatibilidad, pero no hace nada:
no omite la política de instalación ni la lista de denegación integrada de dependencias de plugins de OpenClaw.

Consulta [Configuración de Skills](/es/tools/skills-config#operator-install-policy-securityinstallpolicy)
para el esquema exec compartido de `security.installPolicy` usado tanto por Skills como por
plugins.

### Configurar la política de plugins

La forma común de configuración de plugins es:

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

Reglas clave de política:

- `plugins.enabled: false` deshabilita todos los plugins y omite el trabajo de descubrimiento/carga.
  Las referencias de plugins obsoletas permanecen inertes mientras esto está activo; vuelve a habilitar
  los plugins antes de ejecutar la limpieza de doctor si quieres eliminar ids obsoletos.
- `plugins.deny` prevalece sobre allow y la habilitación por plugin.
- `plugins.allow` es una allowlist exclusiva. Las herramientas propiedad del plugin fuera de la
  allowlist permanecen no disponibles incluso cuando `tools.allow` incluye `"*"`.
- `plugins.entries.<id>.enabled: false` deshabilita un plugin y conserva su
  configuración.
- `plugins.load.paths` añade archivos o directorios de plugins locales explícitos.
  Las rutas locales gestionadas por `plugins install` deben ser directorios o
  archivos comprimidos de plugin; usa `plugins.load.paths` para archivos de plugin independientes.
- Los plugins originados en workspace están deshabilitados por defecto; habilítalos o
  añádelos explícitamente a la allowlist antes de usar código de workspace local.
- Los plugins incluidos siguen sus metadatos integrados de activado/desactivado por defecto
  salvo que la configuración los sobrescriba explícitamente.
- `plugins.slots.<slot>` (`memory` o `contextEngine`) elige un plugin para una
  categoría exclusiva. La selección de slot cuenta como activación explícita y
  fuerza la habilitación del plugin seleccionado para ese slot, incluso si de otro modo
  sería opt-in. `plugins.deny` y `plugins.entries.<id>.enabled: false` aún
  lo bloquean.
- Los plugins incluidos opt-in pueden autoactivarse cuando la configuración nombra una de sus
  superficies propias, como una referencia de proveedor/modelo, configuración de canal, backend de CLI
  o runtime de arnés de agente.
- El enrutamiento Codex de la familia OpenAI mantiene separados los límites de proveedor y plugin de runtime:
  las referencias de modelos Codex heredadas son configuración heredada que doctor repara,
  mientras que el plugin `codex` incluido posee el runtime del servidor de aplicación Codex para
  referencias canónicas de agentes `openai/*`, `agentRuntime.id: "codex"` explícito y
  referencias heredadas `codex/*`.

Cuando `plugins.allow` no está definido y se descubren automáticamente plugins no incluidos desde
el workspace o raíces globales de plugins, los registros de inicio muestran
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
con los ids de plugins descubiertos y, para listas cortas, un fragmento mínimo de `plugins.allow`.
Ejecuta [`openclaw plugins list --enabled --verbose`](/es/cli/plugins#list)
o [`openclaw plugins inspect <id>`](/es/cli/plugins#inspect) sobre el id de plugin
listado antes de copiar plugins de confianza en `openclaw.json`. La misma
fijación de confianza aplica cuando los diagnósticos dicen que un plugin se cargó
`without install/load-path provenance`: inspecciona ese id de plugin y luego fíjalo en
`plugins.allow` o reinstálalo desde una fuente de confianza para que OpenClaw registre la
procedencia de instalación.

Ejecuta `openclaw doctor` o `openclaw doctor --fix` cuando la validación de configuración
informe ids de plugins obsoletos, incompatibilidades de allowlist/herramientas o rutas heredadas de plugins
incluidos.

## Comprender los formatos de plugins

OpenClaw reconoce dos formatos de plugin:

| Formato                 | Cómo se carga                                                                 | Úsalo cuando                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo de OpenClaw | `openclaw.plugin.json` más un módulo de runtime cargado en el proceso               | Estás instalando o creando capacidades de runtime específicas de OpenClaw  |
| Paquete compatible      | Diseño de plugin de Codex, Claude o Cursor mapeado al inventario de plugins de OpenClaw | Estás reutilizando Skills, comandos, hooks o metadatos de paquete compatibles |

Ambos formatos aparecen en `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` y `openclaw plugins disable`. Consulta
[Paquetes de plugins](/es/plugins/bundles) para el límite de compatibilidad de paquetes y
[Crear plugins](/es/plugins/building-plugins) para la autoría de plugins nativos.

## Hooks de plugins

Los plugins pueden registrar hooks en runtime mediante dos APIs diferentes:

- hooks tipados `api.on(...)` para eventos de ciclo de vida del runtime. Esta es la
  superficie preferida para middleware, política, reescritura de mensajes, conformación de prompts
  y control de herramientas.
- `api.registerHook(...)` para el sistema interno de hooks descrito en
  [Hooks](/es/automation/hooks). Esto es principalmente para efectos secundarios generales de comandos/ciclo de vida
  y compatibilidad con automatización existente de estilo HOOK.

Regla rápida: si el handler necesita prioridad, semántica de combinación o
comportamiento de bloqueo/cancelación, usa hooks tipados. Si solo reacciona a `command:new`,
`command:reset`, `message:sent` o eventos generales similares, `api.registerHook`
está bien.

Los hooks internos gestionados por plugins aparecen en `openclaw hooks list` con
`plugin:<id>`. No puedes habilitarlos ni deshabilitarlos mediante `openclaw hooks`;
habilita o deshabilita el plugin en su lugar.

## Verificar el Gateway activo

`openclaw plugins list` y `openclaw plugins inspect` sin opciones leen la configuración,
el manifiesto y el estado del registro en frío. No prueban que un Gateway ya en ejecución
haya importado el mismo código de plugin.

Cuando un plugin aparece instalado pero el tráfico de chat en vivo no lo usa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Los Gateways administrados se reinician automáticamente después de cambios de instalación, actualización y
desinstalación de Plugins que alteran la fuente del Plugin. En instalaciones VPS o de contenedor, asegúrate
de que cualquier reinicio manual apunte al proceso hijo real `openclaw gateway run` que
sirve tus canales, no solo a un contenedor o supervisor.

## Solución de problemas

| Síntoma                                                        | Comprobación                                                                                                                                      | Corrección                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| El Plugin aparece en `plugins list` pero los hooks de runtime no se ejecutan  | Usa `openclaw plugins inspect <id> --runtime --json` y confirma el Gateway activo con `gateway status --deep --require-rpc`             | Reinicia el Gateway en vivo después de cambios de instalación, actualización, configuración o fuente                               |
| Aparecen diagnósticos de propiedad duplicada de canal o herramienta         | Ejecuta `openclaw plugins list --enabled --verbose`, inspecciona cada Plugin sospechoso con `--runtime --json` y compara la propiedad de canales/herramientas | Deshabilita un propietario, elimina instalaciones obsoletas o usa el manifiesto `preferOver` para un reemplazo intencional      |
| La configuración indica que falta un Plugin                                | Consulta [Inventario de Plugins](/es/plugins/plugin-inventory) para saber si está incluido, es externo oficial o solo de fuente                           | Instala el paquete externo, habilita el Plugin incluido o elimina la configuración obsoleta                         |
| La configuración no es válida durante la instalación                               | Lee el mensaje de validación y ejecuta `openclaw doctor --fix` si apunta a estado obsoleto de Plugins                                             | Doctor puede poner en cuarentena la configuración no válida del Plugin deshabilitando la entrada y eliminando la carga útil no válida     |
| La ruta del Plugin está bloqueada por propiedad o permisos sospechosos | Inspecciona el diagnóstico antes del error de configuración                                                                                             | Corrige la propiedad/permisos del sistema de archivos y luego ejecuta `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloquea comandos de ciclo de vida                | Confirma que la instalación está gestionada por Nix                                                                                                      | Cambia la selección de Plugins en la fuente de Nix en lugar de usar comandos mutadores de Plugins                      |
| La importación de dependencias falla en runtime                             | Comprueba si el Plugin se instaló mediante npm/git/ClawHub o se cargó desde una ruta local                                                 | Ejecuta `openclaw plugins update <id>`, reinstala la fuente o instala tú mismo las dependencias locales del Plugin |

Cuando la configuración obsoleta de Plugins todavía nombra un Plugin de canal que ya no es detectable,
la validación de configuración degrada esa clave de canal a una advertencia en lugar de un fallo
duro, para que el inicio del Gateway pueda seguir sirviendo todos los demás canales. Ejecuta
`openclaw doctor --fix` para eliminar entradas obsoletas de Plugins y canales. Las claves de canal
desconocidas sin evidencia de Plugin obsoleto siguen fallando la validación para que los errores tipográficos
permanezcan visibles.

Para el reemplazo intencional de canales, el Plugin preferido debe declarar
`channelConfigs.<channel-id>.preferOver` con el id del Plugin heredado o de menor prioridad. Si ambos Plugins
están habilitados explícitamente, OpenClaw conserva esa solicitud
e informa diagnósticos de canales/herramientas duplicados en lugar de elegir silenciosamente
un propietario.

Si un paquete instalado informa que `requires compiled runtime output for
TypeScript entry ...`, el paquete se publicó sin los archivos JavaScript que
OpenClaw necesita en runtime. Actualiza o reinstala después de que el publicador envíe
JavaScript compilado, o deshabilita/desinstala el Plugin hasta entonces.

### Propiedad de ruta de Plugin bloqueada

Si los diagnósticos dicen
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
y la validación continúa con `plugin present but blocked`, OpenClaw encontró
archivos de Plugin propiedad de un usuario Unix distinto al proceso que los carga.
Mantén la configuración del Plugin en su lugar; corrige la propiedad del sistema de archivos o ejecuta OpenClaw
como el mismo usuario que posee el directorio de estado.

Para instalaciones Docker, la imagen oficial se ejecuta como `node` (uid `1000`), por lo que los
directorios de configuración y espacio de trabajo de OpenClaw montados desde el host normalmente deben ser
propiedad de uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si ejecutas OpenClaw intencionalmente como root, repara la raíz de Plugins gestionados para que
sea propiedad de root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Después de corregir la propiedad, vuelve a ejecutar `openclaw doctor --fix` o
`openclaw plugins registry --refresh` para que el registro persistido de Plugins
coincida con los archivos reparados.

### Configuración lenta de herramientas de Plugin

Si los turnos del agente parecen detenerse al preparar herramientas, habilita el registro de trazas
y comprueba las líneas de tiempos de fábrica de herramientas de Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Busca:

```text
[trace:plugin-tools] factory timings ...
```

El resumen enumera el tiempo total de fábrica y las fábricas de herramientas de Plugin más lentas,
incluido el id del Plugin, los nombres de herramientas declarados, la forma del resultado y si la herramienta
es opcional. Las líneas lentas se promueven a advertencias cuando una sola fábrica tarda
al menos 1s o la preparación total de fábricas de herramientas de Plugin tarda al menos 5s.

OpenClaw almacena en caché los resultados correctos de fábricas de herramientas de Plugin para resoluciones
repetidas con el mismo contexto de solicitud efectivo. La clave de caché incluye
la configuración efectiva de runtime, el espacio de trabajo y el id del agente, la política de sandbox, la configuración
del navegador, el contexto de entrega, la identidad del solicitante y el estado de propiedad, por lo que
las fábricas que dependen de esos campos de confianza se vuelven a ejecutar cuando el contexto
cambia. Si los tiempos siguen siendo altos, es posible que el Plugin esté haciendo trabajo costoso antes
de devolver sus definiciones de herramientas.

Si un Plugin domina el tiempo, inspecciona sus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Luego actualiza, reinstala o deshabilita ese Plugin. Los autores de Plugins deben mover
la carga costosa de dependencias detrás de la ruta de ejecución de la herramienta en lugar de hacerla
dentro de la fábrica de herramientas.

Para raíces de dependencias, validación de metadatos de paquetes, registros de registry, comportamiento de
recarga de inicio y limpieza heredada, consulta
[Resolución de dependencias de Plugin](/es/plugins/dependency-resolution).

## Relacionado

- [Gestionar Plugins](/es/plugins/manage-plugins) - ejemplos de comandos para listar, instalar, actualizar, desinstalar y publicar
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de CLI
- [Inventario de Plugins](/es/plugins/plugin-inventory) - lista generada de Plugins incluidos y externos
- [Referencia de Plugins](/es/plugins/reference) - páginas de referencia generadas por Plugin
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento de ClawHub y política de PR de documentación
- [Resolución de dependencias de Plugin](/es/plugins/dependency-resolution) - raíces de instalación, registros de registry y límites de runtime
- [Crear Plugins](/es/plugins/building-plugins) - guía de autoría de Plugins nativos
- [Descripción general del SDK de Plugins](/es/plugins/sdk-overview) - registro de runtime, hooks y campos de API
- [Manifiesto de Plugin](/es/plugins/manifest) - manifiesto y metadatos de paquete
