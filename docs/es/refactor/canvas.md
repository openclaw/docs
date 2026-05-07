---
read_when:
    - Traslado de la propiedad del host, las herramientas, los comandos, la documentación o el protocolo de Canvas
    - Auditoría de si Canvas sigue siendo propiedad del núcleo
    - Preparación o revisión del PR del Plugin Canvas experimental
summary: Plan y lista de comprobación de auditoría para sacar Canvas del núcleo y pasarlo a un Plugin experimental incluido.
title: Refactorización del Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refactorización del Plugin Canvas

Canvas tiene poco uso y es experimental. Trátalo como un Plugin incluido, no como una función central. El núcleo puede conservar la infraestructura genérica de Gateway, Node, HTTP, autenticación, configuración y cliente nativo, pero el comportamiento específico de Canvas debe residir bajo `extensions/canvas`.

## Objetivo

Mover la propiedad de Canvas a `extensions/canvas` preservando el comportamiento actual de Node emparejado:

- la herramienta `canvas` orientada al agente la registra el Plugin Canvas
- los comandos de Node de Canvas solo se permiten cuando el Plugin Canvas los registra
- los archivos de host/fuente de A2UI residen bajo el Plugin Canvas
- la materialización de documentos de Canvas reside bajo el Plugin Canvas
- la implementación del comando CLI reside bajo el Plugin Canvas, o delega a través de un barrel de runtime propiedad del Plugin
- la documentación y el inventario de Plugins describen Canvas como experimental y respaldado por un Plugin

## No objetivos

- No rediseñar la interfaz de usuario de Canvas de la aplicación nativa en esta refactorización.
- No eliminar la compatibilidad de protocolo/cliente de Canvas de iOS, Android o macOS salvo que una decisión de producto separada indique que Canvas debe eliminarse.
- No crear un framework amplio de servicios de Plugin solo para Canvas a menos que al menos otro Plugin incluido necesite la misma costura.

## Estado actual de la rama

Hecho:

- Se agregó el paquete de Plugin incluido en `extensions/canvas`.
- Se agregó `extensions/canvas/openclaw.plugin.json`.
- Se movió la herramienta `canvas` del agente de `src/agents/tools/canvas-tool.ts` a `extensions/canvas/src/tool.ts`.
- Se eliminó el registro central de `createCanvasTool` de `src/agents/openclaw-tools.ts`.
- Se movió la implementación del host de Canvas de `src/canvas-host` a `extensions/canvas/src/host`.
- Se mantuvo `extensions/canvas/runtime-api.ts` como el barrel de compatibilidad propiedad del Plugin para pruebas, empaquetado y helpers públicos externos de Canvas.
- Se movió la materialización de documentos de Canvas de `src/gateway/canvas-documents.ts` a `extensions/canvas/src/documents.ts`.
- Se movieron la implementación de CLI de Canvas y los helpers JSONL de A2UI a `extensions/canvas/src/cli.ts`.
- Se movieron la URL del host de Canvas y los helpers de capacidad con ámbito a `extensions/canvas/src`.
- Se movieron los valores predeterminados de comandos de Node de Canvas fuera de listas del núcleo codificadas de forma rígida y a `nodeInvokePolicies` del Plugin.
- Se agregó configuración del host de Canvas propiedad del Plugin en `plugins.entries.canvas.config.host`.
- Se movió el servicio HTTP de Canvas y A2UI detrás del registro de rutas HTTP del Plugin Canvas.
- Se agregó despacho genérico de actualización WebSocket de Plugin para rutas HTTP propiedad del Plugin.
- Se reemplazaron la URL de host del Gateway específica de Canvas y la autenticación de capacidades de Node por una superficie genérica de Plugin alojado y helpers de capacidad de Node.
- Se agregaron resolvedores de medios alojados propiedad del Plugin para que las URL de documentos de Canvas se resuelvan a través del Plugin Canvas en lugar de que el núcleo importe elementos internos de documentos de Canvas.
- Se agregó `api.registerNodeCliFeature(...)` para que Canvas pueda declarar `openclaw nodes canvas` como una función de Node propiedad del Plugin sin escribir manualmente la ruta del comando padre.
- Se eliminaron las importaciones de producción `src/**` de `extensions/canvas/runtime-api.js`.
- Se movió la fuente del bundle de A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` a `extensions/canvas/src/host/a2ui-app`.
- Se movió la implementación de compilación/copia de A2UI bajo `extensions/canvas/scripts` y se reemplazó el cableado de compilación raíz por hooks genéricos de assets de Plugins incluidos.
- Se eliminó el alias heredado de runtime de configuración de nivel superior `canvasHost`.
- Se mantuvo la migración de doctor de Canvas para que `openclaw doctor --fix` reescriba configuraciones antiguas de `canvasHost` en `plugins.entries.canvas.config.host`.
- Se eliminó la compatibilidad del protocolo de Canvas de agentes antiguos detrás del protocolo de Gateway v4. Los clientes nativos y Gateways ahora usan solo `pluginSurfaceUrls.canvas` más `node.pluginSurface.refresh`; la ruta obsoleta `canvasHostUrl`, `canvasCapability` y `node.canvas.capability.refresh` no está admitida intencionadamente en esta refactorización experimental.
- Se actualizó el inventario de Plugins generado para incluir Canvas.
- Se agregaron documentos de referencia del Plugin en `docs/plugins/reference/canvas.md`.

Superficies conocidas restantes de Canvas propiedad del núcleo:

- Los handlers de Canvas de la aplicación nativa bajo `apps/` aún consumen intencionadamente la superficie del Plugin Canvas
- handlers de protocolo/cliente de Canvas de la aplicación nativa bajo `apps/`
- la salida de artefactos publicados todavía usa `dist/canvas-host/a2ui` para la búsqueda de runtime compatible con versiones anteriores, pero el paso de copia ahora es propiedad del Plugin

## Forma objetivo

`extensions/canvas` debe poseer:

- manifiesto del Plugin y metadatos del paquete
- registro de herramientas del agente
- política de comandos de invocación de Node
- host de Canvas y runtime de A2UI
- fuente del bundle de Canvas A2UI y scripts de compilación/copia de assets
- creación de documentos de Canvas y resolución de assets
- implementación de CLI de Canvas
- página de documentación de Canvas y entrada del inventario de Plugins

El núcleo solo debe poseer costuras genéricas:

- descubrimiento y registro de Plugins
- registro genérico de herramientas de agente
- registro genérico de políticas de invocación de Node
- HTTP/autenticación genéricos de Gateway y despacho de actualización WebSocket
- resolución genérica de URL de superficie de Plugin alojado
- registro genérico de resolvedores de medios alojados
- transporte genérico de capacidades de Node
- infraestructura genérica de configuración
- descubrimiento genérico de hooks de assets de Plugins incluidos

Las aplicaciones nativas pueden conservar handlers de comandos de Canvas como clientes del protocolo. No son propietarias del runtime del Plugin.

## Pasos de migración

1. Tratar `plugins.entries.canvas.config.host` como la superficie de configuración propiedad del Plugin.
2. Actualizar la documentación para que Canvas se describa como un Plugin incluido experimental.
3. Ejecutar pruebas enfocadas de Canvas, comprobaciones de inventario de Plugins, comprobaciones de API del SDK de Plugins y puertas de compilación/tipos afectadas por límites de runtime.

## Lista de verificación de auditoría

Antes de dar por completa la refactorización:

- `rg "src/canvas-host|../canvas-host"` no devuelve importaciones de fuente activas.
- `rg "canvas-tool|createCanvasTool" src` no encuentra ninguna implementación de herramienta de Canvas propiedad del núcleo.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` no encuentra valores predeterminados de allowlist codificados de forma rígida fuera de pruebas genéricas de políticas de Plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` está vacío.
- `rg "canvas-documents" src` está vacío.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` está vacío; el Plugin Canvas registra `openclaw nodes canvas` mediante metadatos anidados de CLI de Plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` no devuelve propiedad de runtime del Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` solo encuentra wrappers de compatibilidad o rutas propiedad del Plugin.
- `pnpm plugins:inventory:check` pasa.
- `pnpm plugin-sdk:api:check` pasa, o las líneas base de API generadas se actualizan y revisan intencionadamente.
- Las pruebas dirigidas de Canvas pasan.
- Las pruebas de changed-lanes pasan para rutas de host/A2UI de Canvas.
- El cuerpo del PR dice explícitamente que Canvas es experimental y está respaldado por un Plugin.

## Comandos de verificación

Usa comprobaciones locales dirigidas durante la iteración:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Ejecuta `pnpm build` antes de hacer push si cambian el barrel de runtime, la importación diferida, el empaquetado o las superficies publicadas del Plugin.
