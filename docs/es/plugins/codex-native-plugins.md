---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen plugins nativos de Codex
    - Estás migrando plugins de Codex seleccionados por OpenAI instalados desde el código fuente
    - Estás solucionando problemas con codexPlugins, el inventario de apps, acciones destructivas o diagnósticos de apps de Plugin
summary: Configurar plugins nativos de Codex migrados para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-05-12T00:59:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades propias de aplicación y Plugin de Codex
app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw.

OpenClaw no traduce los plugins de Codex a herramientas dinámicas sintéticas
`codex_plugin_*` de OpenClaw. Las llamadas a Plugin permanecen en la transcripción nativa de Codex, y
Codex app-server se encarga de la ejecución MCP respaldada por aplicaciones.

Usa esta página después de que el [arnés de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente de OpenClaw seleccionado debe ser el arnés nativo de Codex.
- `plugins.entries.codex.enabled` debe ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser true.
- V1 solo admite plugins `openai-curated` que la migración observó como
  instalados desde el código fuente en el inicio de Codex de origen.
- El Codex app-server de destino debe poder ver el marketplace,
  el Plugin y el inventario de aplicaciones esperados.

`codexPlugins` no tiene efecto en ejecuciones de PI, ejecuciones normales del proveedor de OpenAI, enlaces de conversación ACP
u otros arneses, porque esas rutas no crean
hilos de Codex app-server con configuración nativa de `apps`.

## Inicio rápido

Previsualiza la migración desde el inicio de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Aplica la migración cuando el plan parezca correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas explícitas de `codexPlugins` para plugins aptos y llama a
`plugin/install` de Codex app-server para los plugins seleccionados. Una configuración migrada
típica se ve así:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el Gateway para que
las futuras sesiones del arnés de Codex se inicien con el conjunto de aplicaciones actualizado.

## Cómo funciona la configuración nativa de plugins

La integración tiene tres estados separados:

- Instalado: Codex tiene el paquete local del Plugin en el runtime de app-server de destino.
- Habilitado: la configuración de OpenClaw está dispuesta a poner el Plugin a disposición de los turnos del arnés de Codex.
- Accesible: Codex app-server confirma que las entradas de aplicación del Plugin están disponibles
  para la cuenta activa y se pueden asignar a la identidad de Plugin migrada.

La migración es el paso duradero de instalación y aptitud. El inventario de aplicaciones en runtime es la
comprobación de accesibilidad. La configuración de sesión del arnés de Codex luego calcula una
configuración restrictiva de aplicaciones de hilo para las aplicaciones de Plugin habilitadas y accesibles.

La configuración de aplicaciones de hilo se calcula cuando OpenClaw establece una sesión del arnés de Codex
o reemplaza un enlace obsoleto de hilo de Codex. No se vuelve a calcular en cada turno.

## Límite de compatibilidad de V1

V1 es intencionadamente limitada:

- Solo los plugins `openai-curated` que ya estaban instalados en el inventario de
  Codex app-server de origen son aptos para la migración.
- La migración escribe identidades explícitas de Plugin con `marketplaceName` y
  `pluginName`; no escribe rutas de caché locales `marketplacePath`.
- `codexPlugins.enabled` es el interruptor global de habilitación.
- No existe ningún comodín `plugins["*"]` ni ninguna clave de configuración que conceda
  autoridad de instalación arbitraria.
- Los marketplaces no admitidos, paquetes de Plugin en caché, hooks y archivos de configuración de Codex
  se conservan en el informe de migración para revisión manual.

## Inventario de aplicaciones y propiedad

OpenClaw lee el inventario de aplicaciones de Codex mediante `app/list` de app-server, lo almacena en caché durante
una hora y actualiza de forma asíncrona las entradas obsoletas o faltantes.

Una aplicación de Plugin se expone solo cuando OpenClaw puede vincularla de nuevo al Plugin migrado
mediante una propiedad estable:

- id exacto de aplicación desde el detalle del Plugin
- nombre conocido del servidor MCP
- metadatos estables únicos

La propiedad basada solo en el nombre visible o ambigua se excluye hasta que la próxima actualización de inventario
demuestre la propiedad.

## Configuración de aplicaciones de hilo

OpenClaw inyecta un parche restrictivo de `config.apps` para el hilo de Codex:
`_default` está deshabilitada y solo se habilitan las aplicaciones propiedad de plugins migrados habilitados.

OpenClaw establece `destructive_enabled` a nivel de aplicación a partir de la política global efectiva o
por Plugin de `allow_destructive_actions` y deja que Codex aplique
los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de aplicación. La configuración de la aplicación `_default`
se deshabilita con `open_world_enabled: false`. Las aplicaciones de Plugin habilitadas
se emiten con `open_world_enabled: true`; OpenClaw no expone una perilla separada
de política de mundo abierto por Plugin y no mantiene listas de denegación
de nombres de herramientas destructivas por Plugin.

El modo de aprobación de herramientas es automático de forma predeterminada para las aplicaciones de Plugin, de modo que las herramientas de lectura no destructivas puedan ejecutarse sin una interfaz de aprobación en el mismo hilo. Las herramientas destructivas siguen
controladas por la política `destructive_enabled` de cada aplicación.

## Política de acciones destructivas

Las solicitudes destructivas de Plugin están permitidas de forma predeterminada para los plugins de Codex
migrados, mientras que los esquemas inseguros y la propiedad ambigua siguen fallando de forma cerrada:

- `allow_destructive_actions` global tiene `true` como valor predeterminado.
- `allow_destructive_actions` por Plugin anula la política global para ese
  Plugin.
- Cuando la política es `false`, OpenClaw devuelve una declinación determinista.
- Cuando la política es `true`, OpenClaw acepta automáticamente solo esquemas seguros que puede asignar a
  una respuesta de aprobación, como un campo booleano de aprobación.
- La falta de identidad de Plugin, la propiedad ambigua, un id de turno faltante, un id de turno
  incorrecto o un esquema de solicitud inseguro provocan una declinación en lugar de mostrar un prompt.

## Solución de problemas

**`auth_required`:** la migración instaló el Plugin, pero una de sus aplicaciones todavía
necesita autenticación. La entrada explícita del Plugin se escribe deshabilitada hasta que
vuelvas a autorizarla y la habilites.

**`marketplace_missing` o `plugin_missing`:** el Codex app-server de destino
no puede ver el marketplace o Plugin `openai-curated` esperado. Vuelve a ejecutar la migración
contra el runtime de destino o inspecciona el estado del Plugin de Codex app-server.

**`app_inventory_missing` o `app_inventory_stale`:** la preparación de la aplicación provino de una
caché vacía u obsoleta. OpenClaw programa una actualización asíncrona y excluye las aplicaciones de Plugin
hasta que se conozcan la propiedad y la preparación.

**`app_ownership_ambiguous`:** el inventario de aplicaciones solo coincidió por nombre visible, por lo que
la aplicación no se expone al hilo de Codex.

**La configuración cambió, pero el agente no puede ver el Plugin:** usa `/new`, `/reset` o
reinicia el Gateway. Los enlaces de hilo de Codex existentes conservan la configuración de aplicaciones con la que
se iniciaron hasta que OpenClaw establezca una nueva sesión del arnés o reemplace un
enlace obsoleto.

**La acción destructiva se declina:** comprueba los valores globales y por Plugin de
`allow_destructive_actions`. Incluso cuando la política es true, los esquemas de solicitud inseguros
y la identidad de Plugin ambigua siguen fallando de forma cerrada.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
