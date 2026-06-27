---
doc-schema-version: 1
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Getting Started
summary: Instala, configura y administra plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-06-27T13:08:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Los Plugins amplían OpenClaw con canales, proveedores de modelos, arneses de agente, herramientas,
Skills, voz sintetizada, transcripción en tiempo real, voz, comprensión de medios, generación,
obtención web, búsqueda web y otras capacidades de runtime.

Usa esta página cuando quieras instalar un Plugin, reiniciar el Gateway, verificar
que el runtime lo cargó y resolver fallos comunes de configuración. Para ejemplos
solo de comandos, consulta [Gestionar Plugins](/es/plugins/manage-plugins). Para el inventario
generado completo de Plugins incluidos, externos oficiales y solo de código fuente, consulta
[Inventario de Plugins](/es/plugins/plugin-inventory).

## Requisitos

Antes de instalar un Plugin, asegúrate de tener:

- un checkout o una instalación de OpenClaw con la CLI `openclaw` disponible
- acceso de red a la fuente seleccionada, como ClawHub, npm o un host git
- cualquier credencial específica del Plugin, claves de configuración o herramientas del sistema operativo nombradas
  por la documentación de configuración de ese Plugin
- permiso para que el Gateway que sirve tus canales se recargue o reinicie

## Inicio rápido

<Steps>
  <Step title="Encontrar el Plugin">
    Busca paquetes de Plugins públicos en [ClawHub](/es/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub es la superficie principal de descubrimiento para Plugins de la comunidad. Durante el
    cambio de lanzamiento, las especificaciones ordinarias de paquetes sin prefijo siguen instalándose desde npm a menos que
    coincidan con un id de Plugin oficial. Las especificaciones de paquetes `@openclaw/*` sin procesar que coincidan con
    Plugins incluidos usan la copia incluida de la compilación actual de OpenClaw. Usa un
    prefijo explícito cuando necesites una fuente concreta.

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

    Trata las instalaciones de Plugins como ejecutar código. Prefiere versiones fijadas cuando
    necesites instalaciones de producción reproducibles.

  </Step>

  <Step title="Configurar y habilitarlo">
    Configura los ajustes específicos del Plugin bajo `plugins.entries.<id>.config`.
    Habilita el Plugin cuando aún no esté habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si tu configuración usa una lista `plugins.allow` restrictiva, el id del Plugin instalado
    debe estar presente allí antes de que el Plugin pueda cargarse.
    `openclaw plugins install` añade el id instalado a una lista
    `plugins.allow` existente y elimina el mismo id de `plugins.deny` para que la
    instalación explícita pueda cargarse tras el reinicio.

  </Step>

  <Step title="Permitir que el Gateway se recargue">
    Instalar, actualizar o desinstalar código de Plugin requiere reiniciar el Gateway.
    Cuando ya hay un Gateway gestionado en ejecución con la recarga de configuración
    habilitada, OpenClaw detecta el registro de instalación de Plugin modificado y reinicia el
    Gateway automáticamente. Si el Gateway no está gestionado o la recarga está deshabilitada,
    reinícialo tú mismo:

    ```bash
    openclaw gateway restart
    ```

    Las operaciones de habilitar y deshabilitar actualizan la configuración y refrescan el registro frío.
    Una inspección de runtime sigue siendo la ruta de verificación más clara para superficies de runtime
    activas.

  </Step>

  <Step title="Verificar el registro en runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Usa `--runtime` cuando necesites demostrar herramientas, hooks, servicios,
    métodos del Gateway o comandos de CLI propios del Plugin registrados. `inspect` sin más es una
    comprobación fría de manifiesto y registro.

  </Step>
</Steps>

## Configuración

### Elegir una fuente de instalación

| Fuente      | Úsala cuando                                                                       | Ejemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Quieras descubrimiento nativo de OpenClaw, análisis, metadatos de versión e indicaciones de instalación | `openclaw plugins install clawhub:<package>`                   |
| npm         | Necesites flujos directos del registro npm o de dist-tags                             | `openclaw plugins install npm:<package>`                       |
| git         | Necesites una rama, etiqueta o commit de un repositorio                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ruta local  | Estés desarrollando o probando un Plugin en la misma máquina                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Estés instalando un Plugin de marketplace compatible con Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Las especificaciones de paquetes sin prefijo tienen un comportamiento especial de compatibilidad. Si el nombre sin prefijo coincide
con un id de Plugin incluido, OpenClaw usa esa fuente incluida. Si coincide con un
id de Plugin externo oficial, OpenClaw usa el catálogo oficial de paquetes. Otras
especificaciones ordinarias de paquetes sin prefijo se instalan mediante npm durante el cambio de lanzamiento. Las especificaciones de paquetes
`@openclaw/*` sin procesar que coincidan con Plugins incluidos también se resuelven a la
copia incluida antes de recurrir a npm. Usa `npm:@openclaw/<plugin>@<version>` cuando
quieras deliberadamente el paquete npm externo en lugar de la copia incluida
propiedad de la imagen. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` cuando necesites
selección determinista de fuente. Consulta [`openclaw plugins`](/es/cli/plugins#install)
para el contrato completo del comando.

Para instalaciones npm, las especificaciones de paquete sin fijar y `@latest` eligen el paquete estable
más reciente que anuncia compatibilidad con esta compilación de OpenClaw. Si la
versión latest actual de npm declara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` más nuevo, OpenClaw analiza versiones estables anteriores del paquete
e instala la más reciente que encaje. Las versiones exactas y las etiquetas de canal explícitas
como `@beta` permanecen fijadas al paquete seleccionado y fallan cuando son incompatibles.

### Política de instalación del operador

Configura `security.installPolicy` para ejecutar un comando de política local de confianza antes de que
continúe la instalación o actualización de Plugins. La política recibe metadatos más la ruta de
origen preparada y puede permitir o bloquear la instalación. Cubre las rutas de
instalación/actualización de Plugins respaldadas por CLI y Gateway. Los hooks `before_install` de Plugin se ejecutan más tarde solo en
procesos de OpenClaw donde se cargan los hooks de Plugin, así que usa `security.installPolicy`
para decisiones de instalación propiedad del operador. La bandera obsoleta
`--dangerously-force-unsafe-install` se acepta por compatibilidad, pero no
omite la política de instalación ni la lista de denegación integrada de dependencias de Plugins de OpenClaw.

Consulta [Configuración de Skills](/es/tools/skills-config#operator-install-policy-securityinstallpolicy)
para el esquema exec compartido de `security.installPolicy` usado tanto por Skills como por
Plugins.

### Configurar la política de Plugins

La forma común de configuración de Plugins es:

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

- `plugins.enabled: false` deshabilita todos los Plugins y omite el trabajo de descubrimiento/carga
  de Plugins. Las referencias obsoletas a Plugins quedan inertes mientras esto está activo; vuelve a habilitar
  Plugins antes de ejecutar la limpieza de doctor cuando quieras eliminar ids obsoletos.
- `plugins.deny` prevalece sobre allow y sobre la habilitación por Plugin.
- `plugins.allow` es una lista de permitidos exclusiva. Las herramientas propiedad de Plugins fuera de la
  lista de permitidos permanecen no disponibles, incluso cuando `tools.allow` incluye `"*"`.
- `plugins.entries.<id>.enabled: false` deshabilita un Plugin y conserva su
  configuración.
- `plugins.load.paths` añade archivos o directorios locales explícitos de Plugin. Las rutas locales de
  `plugins install` gestionadas deben ser directorios o archivos comprimidos de Plugin; usa
  `plugins.load.paths` para archivos de Plugin independientes.
- Los Plugins originados en workspace están deshabilitados de forma predeterminada; habilítalos explícitamente o
  añádelos a la lista de permitidos antes de usar código del workspace local.
- Los Plugins incluidos siguen sus metadatos integrados de activado/desactivado predeterminado a menos que
  la configuración los anule explícitamente.
- `plugins.slots.<slot>` elige un Plugin para categorías exclusivas como
  motores de memoria y contexto. La selección de slot fuerza la habilitación del Plugin seleccionado
  para ese slot al contar como activación explícita; puede cargarse incluso cuando de otro modo
  sería opt-in. `plugins.deny` y
  `plugins.entries.<id>.enabled: false` todavía lo bloquean.
- Los Plugins incluidos opt-in pueden autoactivarse cuando la configuración nombra una de sus superficies
  propias, como una referencia de proveedor/modelo, configuración de canal, backend de CLI o runtime de
  arnés de agente.
- El enrutamiento Codex de la familia OpenAI mantiene separados los límites de proveedor y Plugin de runtime:
  las referencias de modelos Codex heredadas son configuración heredada reparada por doctor, mientras que el Plugin incluido
  `codex` posee el runtime de servidor de aplicación Codex para referencias de agente canónicas `openai/*`,
  `agentRuntime.id: "codex"` explícito y referencias heredadas `codex/*`.

Cuando `plugins.allow` no está definido y Plugins no incluidos se descubren automáticamente desde
el workspace o raíces globales de Plugins, los logs de inicio muestran
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
La advertencia incluye ids de Plugins descubiertos y, para listas cortas, un fragmento mínimo de
`plugins.allow`. Ejecuta
[`openclaw plugins list --enabled --verbose`](/es/cli/plugins#list) o
[`openclaw plugins inspect <id>`](/es/cli/plugins#inspect) con el id de Plugin listado
antes de copiar Plugins de confianza a `openclaw.json`. La misma guía de fijación de confianza
se aplica cuando los diagnósticos dicen que un Plugin se cargó
`without install/load-path provenance`: inspecciona ese id de Plugin y luego fija el
id de confianza en `plugins.allow` o reinstálalo desde una fuente de confianza para que OpenClaw
registre la procedencia de la instalación.

Ejecuta `openclaw doctor` o `openclaw doctor --fix` cuando la validación de configuración informe
ids de Plugins obsoletos, desajustes de lista de permitidos/herramientas o rutas heredadas de Plugins incluidos.

## Entender los formatos de Plugins

OpenClaw reconoce dos formatos de Plugin:

| Formato                 | Cómo se carga                                                                 | Úsalo cuando                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo de OpenClaw | `openclaw.plugin.json` más un módulo de runtime cargado en el proceso               | Estés instalando o creando capacidades de runtime específicas de OpenClaw  |
| Paquete compatible      | Diseño de Plugin de Codex, Claude o Cursor mapeado al inventario de Plugins de OpenClaw | Estés reutilizando Skills, comandos, hooks o metadatos de paquete compatibles |

Ambos formatos aparecen en `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` y `openclaw plugins disable`. Consulta
[Paquetes de Plugins](/es/plugins/bundles) para el límite de compatibilidad de paquetes y
[Crear Plugins](/es/plugins/building-plugins) para la autoría de Plugins nativos.

## Hooks de Plugin

Los Plugins pueden registrar hooks en runtime, pero hay dos API diferentes con
trabajos distintos.

- Usa hooks tipados mediante `api.on(...)` para hooks del ciclo de vida de runtime. Esta es la
  superficie preferida para middleware, política, reescritura de mensajes, conformación de prompts
  y control de herramientas.
- Usa `api.registerHook(...)` solo cuando quieras participar en el sistema interno de
  hooks descrito en [Hooks](/es/automation/hooks). Esto es principalmente para efectos secundarios generales de
  comandos/ciclo de vida y compatibilidad con la automatización existente de estilo HOOK.

Regla rápida:

- Si el manejador necesita prioridad, semántica de combinación o comportamiento de bloquear/cancelar, usa
  hooks tipados de Plugin.
- Si el manejador solo reacciona a `command:new`, `command:reset`, `message:sent`
  o eventos generales similares, `api.registerHook(...)` está bien.

Los hooks internos gestionados por Plugins aparecen en `openclaw hooks list` con
`plugin:<id>`. No puedes habilitarlos ni deshabilitarlos mediante `openclaw hooks`;
habilita o deshabilita el Plugin en su lugar.

## Verificar el Gateway activo

`openclaw plugins list` y `openclaw plugins inspect` sin opciones leen la configuración
en frío, el manifiesto y el estado del registro. No demuestran que un Gateway
que ya está en ejecución haya importado el mismo código del plugin.

Cuando un plugin aparece como instalado, pero el tráfico de chat en vivo no lo usa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Los Gateway gestionados se reinician automáticamente después de cambios de
instalación, actualización y desinstalación de plugins que alteran el código
fuente del plugin. En instalaciones en VPS o contenedores, asegúrate de que
cualquier reinicio manual apunte al proceso hijo real de `openclaw gateway run`
que atiende tus canales, no solo a un contenedor o supervisor.

## Solución de problemas

| Síntoma                                                        | Comprobación                                                                                                                                      | Corrección                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| El Plugin aparece en `plugins list`, pero los hooks de runtime no se ejecutan | Usa `openclaw plugins inspect <id> --runtime --json` y confirma el Gateway activo con `gateway status --deep --require-rpc`             | Reinicia el Gateway en vivo después de cambios de instalación, actualización, configuración o código fuente |
| Aparecen diagnósticos de propiedad duplicada de canal o herramienta | Ejecuta `openclaw plugins list --enabled --verbose`, inspecciona cada plugin sospechoso con `--runtime --json` y compara la propiedad de canales/herramientas | Desactiva un propietario, elimina instalaciones obsoletas o usa `preferOver` en el manifiesto para un reemplazo intencional |
| La configuración dice que falta un plugin                      | Consulta [Inventario de Plugin](/es/plugins/plugin-inventory) para saber si está incluido, es oficial externo o solo de código fuente        | Instala el paquete externo, habilita el plugin incluido o elimina la configuración obsoleta |
| La configuración no es válida durante la instalación           | Lee el mensaje de validación y ejecuta `openclaw doctor --fix` cuando apunte a estado obsoleto de plugins                                  | Doctor puede poner en cuarentena la configuración no válida de un plugin desactivando la entrada y eliminando la carga útil no válida |
| La ruta del plugin está bloqueada por propiedad o permisos sospechosos | Inspecciona el diagnóstico antes del error de configuración                                                                                 | Corrige la propiedad/permisos del sistema de archivos y luego ejecuta `openclaw plugins registry --refresh` |
| `OPENCLAW_NIX_MODE=1` bloquea comandos de ciclo de vida        | Confirma que la instalación está gestionada por Nix                                                                                         | Cambia la selección de plugins en el código fuente de Nix en lugar de usar comandos mutadores de plugins |
| La importación de dependencias falla en runtime                | Comprueba si el plugin se instaló mediante npm/git/ClawHub o se cargó desde una ruta local                                                 | Ejecuta `openclaw plugins update <id>`, reinstala el código fuente o instala tú mismo las dependencias del plugin local |

Cuando la configuración obsoleta de plugins todavía nombra un plugin de canal
que ya no se puede descubrir, el inicio de Gateway omite ese canal respaldado
por plugin en lugar de bloquear todos los demás canales. Ejecuta
`openclaw doctor --fix` para eliminar entradas obsoletas de plugins y canales.
Las claves de canal desconocidas sin evidencia de plugin obsoleto siguen
fallando la validación para que los errores tipográficos permanezcan visibles.

Para el reemplazo intencional de canales, el plugin preferido debe declarar
`channelConfigs.<channel-id>.preferOver` con el id del plugin heredado o de
menor prioridad. Si ambos plugins están habilitados explícitamente, OpenClaw
conserva esa solicitud e informa diagnósticos de canal o herramienta duplicados
en lugar de elegir silenciosamente un propietario.

Si un paquete instalado informa que `requires compiled runtime output for
TypeScript entry ...`, el paquete se publicó sin los archivos JavaScript que
OpenClaw necesita en runtime. Actualiza o reinstala después de que el editor
publique JavaScript compilado, o desactiva/desinstala el plugin hasta entonces.

### Propiedad de ruta de plugin bloqueada

Si los diagnósticos de plugins dicen
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
y la validación de configuración continúa con `plugin present but blocked`,
OpenClaw encontró archivos de plugin propiedad de un usuario Unix distinto al
proceso que los está cargando. Mantén la configuración del plugin en su lugar;
corrige la propiedad del sistema de archivos o ejecuta OpenClaw como el mismo
usuario que posee el directorio de estado.

Para instalaciones con Docker, la imagen oficial se ejecuta como `node` (uid
`1000`), por lo que los directorios de configuración y espacio de trabajo de
OpenClaw montados desde el host normalmente deben ser propiedad del uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si ejecutas OpenClaw intencionalmente como root, repara la raíz de plugins
gestionados para que sea propiedad de root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Después de corregir la propiedad, vuelve a ejecutar `openclaw doctor --fix` o
`openclaw plugins registry --refresh` para que el registro persistido de plugins
coincida con los archivos reparados.

### Configuración lenta de herramientas de plugins

Si los turnos del agente parecen quedarse detenidos mientras preparan
herramientas, habilita el registro de trazas y comprueba las líneas de tiempos
de fábricas de herramientas de plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Busca:

```text
[trace:plugin-tools] factory timings ...
```

El resumen enumera el tiempo total de fábrica y las fábricas de herramientas de
plugins más lentas, incluido el id del plugin, los nombres declarados de
herramientas, la forma del resultado y si la herramienta es opcional. Las líneas
lentas se elevan a advertencias cuando una sola fábrica tarda al menos 1s o la
preparación total de fábricas de herramientas de plugins tarda al menos 5s.

OpenClaw almacena en caché los resultados exitosos de fábricas de herramientas
de plugins para resoluciones repetidas con el mismo contexto efectivo de
solicitud. La clave de caché incluye la configuración efectiva de runtime, el
espacio de trabajo, los id de agente/sesión, la política de sandbox, la
configuración del navegador, el contexto de entrega, la identidad del
solicitante y el estado de propiedad, por lo que las fábricas que dependen de
esos campos de confianza se vuelven a ejecutar cuando cambia el contexto. Si los
tiempos siguen siendo altos, es posible que el plugin esté haciendo trabajo
costoso antes de devolver sus definiciones de herramientas.

Si un plugin domina los tiempos, inspecciona sus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Luego actualiza, reinstala o desactiva ese plugin. Los autores de plugins deben
mover la carga costosa de dependencias detrás de la ruta de ejecución de la
herramienta en lugar de hacerla dentro de la fábrica de herramientas.

Para raíces de dependencias, validación de metadatos de paquetes, registros de
registro, comportamiento de recarga al iniciar y limpieza heredada, consulta
[Resolución de dependencias de plugins](/es/plugins/dependency-resolution).

## Relacionado

- [Gestionar plugins](/es/plugins/manage-plugins) - ejemplos de comandos para listar, instalar, actualizar, desinstalar y publicar
- [`openclaw plugins`](/es/cli/plugins) - referencia completa de la CLI
- [Inventario de Plugin](/es/plugins/plugin-inventory) - lista generada de plugins incluidos y externos
- [Referencia de Plugin](/es/plugins/reference) - páginas de referencia generadas por plugin
- [Plugins de la comunidad](/es/plugins/community) - descubrimiento en ClawHub y política de PR de documentación
- [Resolución de dependencias de plugins](/es/plugins/dependency-resolution) - raíces de instalación, registros de registro y límites de runtime
- [Crear plugins](/es/plugins/building-plugins) - guía de autoría de plugins nativos
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview) - registro en runtime, hooks y campos de API
- [Manifiesto de Plugin](/es/plugins/manifest) - metadatos de manifiesto y paquete
