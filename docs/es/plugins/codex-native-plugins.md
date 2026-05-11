---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex utilicen plugins nativos de Codex
    - Estás migrando plugins de Codex seleccionados por OpenAI e instalados desde el código fuente
    - Estás solucionando problemas relacionados con codexPlugins, el inventario de aplicaciones, las acciones destructivas o los diagnósticos de aplicaciones de Plugin
summary: Configurar los plugins nativos de Codex migrados para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-05-11T20:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades propias de apps y plugins del app-server de Codex dentro del mismo hilo de Codex que gestiona el turno de OpenClaw.

OpenClaw no traduce los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw. Las llamadas de plugins permanecen en la transcripción nativa de Codex, y el app-server de Codex es propietario de la ejecución MCP respaldada por apps.

Usa esta página después de que el [harness de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente de OpenClaw seleccionado debe ser el harness nativo de Codex.
- `plugins.entries.codex.enabled` debe ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser true.
- V1 solo admite plugins `openai-curated` que la migración observó como instalados desde origen en el directorio home de Codex de origen.
- El app-server de Codex de destino debe poder ver el marketplace, el plugin y el inventario de apps esperados.

`codexPlugins` no tiene efecto en ejecuciones de PI, ejecuciones normales del proveedor OpenAI, vinculaciones de conversaciones ACP u otros harnesses porque esas rutas no crean hilos del app-server de Codex con configuración nativa `apps`.

## Inicio rápido

Previsualiza la migración desde el home de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Aplica la migración cuando el plan parezca correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas `codexPlugins` explícitas para plugins elegibles y llama a `plugin/install` del app-server de Codex para los plugins seleccionados. Una configuración migrada típica se ve así:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el gateway para que las futuras sesiones del harness de Codex comiencen con el conjunto de apps actualizado.

## Cómo funciona la configuración nativa de plugins

La integración tiene tres estados separados:

- Instalado: Codex tiene el paquete local del plugin en el runtime del app-server de destino.
- Habilitado: la configuración de OpenClaw está dispuesta a poner el plugin a disposición de los turnos del harness de Codex.
- Accesible: el app-server de Codex confirma que las entradas de app del plugin están disponibles para la cuenta activa y pueden mapearse a la identidad del plugin migrado.

La migración es el paso durable de instalación/elegibilidad. El inventario de apps en runtime es la comprobación de accesibilidad. Luego, la configuración de sesión del harness de Codex calcula una configuración restrictiva de apps del hilo para las apps de plugins habilitadas y accesibles.

La configuración de apps del hilo se calcula cuando OpenClaw establece una sesión del harness de Codex o reemplaza una vinculación obsoleta del hilo de Codex. No se recalcula en cada turno.

## Límite de compatibilidad de V1

V1 es intencionalmente estrecha:

- Solo los plugins `openai-curated` que ya estaban instalados en el inventario del app-server de Codex de origen son elegibles para la migración.
- La migración escribe identidades explícitas de plugins con `marketplaceName` y `pluginName`; no escribe rutas de caché locales `marketplacePath`.
- `codexPlugins.enabled` es el interruptor global de habilitación.
- No hay comodín `plugins["*"]` ni clave de configuración que conceda autoridad arbitraria de instalación.
- Los marketplaces no admitidos, paquetes de plugins en caché, hooks y archivos de configuración de Codex se preservan en el informe de migración para revisión manual.

## Inventario de apps y propiedad

OpenClaw lee el inventario de apps de Codex mediante `app/list` del app-server, lo almacena en caché durante una hora y actualiza de forma asíncrona las entradas obsoletas o ausentes.

Una app de plugin solo se expone cuando OpenClaw puede mapearla de vuelta al plugin migrado mediante propiedad estable:

- id exacto de app del detalle del plugin
- nombre conocido de servidor MCP
- metadatos estables únicos

La propiedad basada solo en nombre para mostrar o ambigua se excluye hasta que la siguiente actualización de inventario demuestre la propiedad.

## Configuración de apps del hilo

OpenClaw inyecta un parche restrictivo `config.apps` para el hilo de Codex: `_default` se deshabilita y solo se habilitan las apps propiedad de plugins migrados habilitados.

OpenClaw establece `destructive_enabled` a nivel de app a partir de la política global o por plugin efectiva `allow_destructive_actions` y deja que Codex aplique los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de app. La configuración de app `_default` se deshabilita con `open_world_enabled: false`. Las apps de plugins habilitadas se emiten con `open_world_enabled: true`; OpenClaw no expone un control de política open-world separado para plugins y no mantiene listas de denegación por nombre de herramienta destructiva por plugin.

El modo de aprobación de herramientas es automático de forma predeterminada para apps de plugins, de modo que las herramientas de lectura no destructivas puedan ejecutarse sin una interfaz de aprobación en el mismo hilo. Las herramientas destructivas siguen controladas por la política `destructive_enabled` de cada app.

## Política de acciones destructivas

Las elicitaciones destructivas de plugins fallan cerradas de forma predeterminada:

- `allow_destructive_actions` global tiene como valor predeterminado `false`.
- `allow_destructive_actions` por plugin sobrescribe la política global para ese plugin.
- Cuando la política es `false`, OpenClaw devuelve un rechazo determinista.
- Cuando la política es `true`, OpenClaw acepta automáticamente solo esquemas seguros que puede mapear a una respuesta de aprobación, como un campo booleano de aprobación.
- La identidad de plugin ausente, la propiedad ambigua, un id de turno ausente, un id de turno incorrecto o un esquema de elicitación inseguro se rechazan en lugar de solicitar confirmación.

## Solución de problemas

**`auth_required`:** la migración instaló el plugin, pero una de sus apps aún necesita autenticación. La entrada explícita del plugin se escribe deshabilitada hasta que vuelvas a autorizarlo y lo habilites.

**`marketplace_missing` o `plugin_missing`:** el app-server de Codex de destino no puede ver el marketplace o plugin `openai-curated` esperado. Vuelve a ejecutar la migración contra el runtime de destino o inspecciona el estado de plugins del app-server de Codex.

**`app_inventory_missing` o `app_inventory_stale`:** la preparación de la app provino de una caché vacía u obsoleta. OpenClaw programa una actualización asíncrona y excluye las apps de plugins hasta que se conozcan la propiedad y la preparación.

**`app_ownership_ambiguous`:** el inventario de apps solo coincidió por nombre para mostrar, por lo que la app no se expone al hilo de Codex.

**La configuración cambió, pero el agente no puede ver el plugin:** usa `/new`, `/reset` o reinicia el gateway. Las vinculaciones existentes de hilos de Codex conservan la configuración de apps con la que comenzaron hasta que OpenClaw establece una nueva sesión de harness o reemplaza una vinculación obsoleta.

**La acción destructiva se rechaza:** comprueba los valores globales y por plugin de `allow_destructive_actions`. Incluso cuando la política es true, los esquemas de elicitación inseguros y la identidad de plugin ambigua siguen fallando cerrados.

## Relacionado

- [harness de Codex](/es/plugins/codex-harness)
- [Referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
