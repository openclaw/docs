---
read_when:
    - Traslado de la propiedad del host, las herramientas, los comandos, la documentación o el protocolo de Canvas
    - Auditando si Canvas sigue siendo propiedad del núcleo
    - Preparación o revisión del PR del Plugin experimental Canvas
summary: Plan y lista de comprobación de auditoría para trasladar Canvas fuera del núcleo y convertirlo en un plugin experimental incluido.
title: Refactorización del plugin Canvas
x-i18n:
    generated_at: "2026-07-11T23:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refactorización del plugin Canvas

Canvas tiene poco uso y es experimental. Trátelo como un plugin incluido, no como una función del núcleo. El núcleo puede conservar la infraestructura genérica del Gateway, Node, HTTP, autenticación, configuración y clientes nativos, pero el comportamiento específico de Canvas debe residir en `extensions/canvas`.

## Objetivo

Trasladar la propiedad de Canvas a `extensions/canvas` y conservar el comportamiento actual de los Node emparejados:

- la herramienta `canvas` orientada al agente se registra mediante el plugin Canvas
- los comandos de Node de Canvas solo se permiten cuando el plugin Canvas los registra
- los archivos de host y código fuente de A2UI residen en el plugin Canvas
- la materialización de documentos de Canvas reside en el plugin Canvas
- la implementación de comandos de la CLI reside en el plugin Canvas o delega mediante un barrel de entorno de ejecución propiedad del plugin
- la documentación y el inventario de plugins describen Canvas como experimental y respaldado por un plugin

## Fuera del alcance

- No rediseñar la interfaz de usuario nativa de Canvas en esta refactorización.
- No eliminar la compatibilidad del protocolo o del cliente de Canvas en iOS, Android o macOS, salvo que una decisión de producto independiente indique que Canvas debe eliminarse.
- No crear un marco amplio de servicios para plugins únicamente para Canvas, salvo que al menos otro plugin incluido necesite el mismo punto de integración.

## Estado actual de la rama

Completado:

- Se añadió el paquete de plugin incluido en `extensions/canvas`.
- Se añadió `extensions/canvas/openclaw.plugin.json`.
- Se trasladó la herramienta `canvas` del agente de `src/agents/tools/canvas-tool.ts` a `extensions/canvas/src/tool.ts`.
- Se eliminó del núcleo el registro de `createCanvasTool` en `src/agents/openclaw-tools.ts`.
- Se trasladó la implementación del host de Canvas de `src/canvas-host` a `extensions/canvas/src/host`.
- Se mantuvo `extensions/canvas/runtime-api.ts` como barrel de compatibilidad propiedad del plugin para pruebas, empaquetado y auxiliares públicos externos de Canvas.
- Se trasladó la materialización de documentos de Canvas de `src/gateway/canvas-documents.ts` a `extensions/canvas/src/documents.ts`.
- Se trasladaron la implementación de la CLI de Canvas y los auxiliares JSONL de A2UI a `extensions/canvas/src/cli.ts`.
- Se trasladaron la URL del host de Canvas y los auxiliares de capacidades con ámbito a `extensions/canvas/src`.
- Se eliminaron los valores predeterminados de los comandos de Node de Canvas de las listas codificadas en el núcleo y se trasladaron a `nodeInvokePolicies` del plugin.
- Se añadió la configuración del host de Canvas propiedad del plugin en `plugins.entries.canvas.config.host`.
- Se trasladó el servicio HTTP de Canvas y A2UI detrás del registro de rutas HTTP del plugin Canvas.
- Se añadió el despacho genérico de actualizaciones de WebSocket de plugins para las rutas HTTP propiedad de plugins.
- Se sustituyeron la URL del host de Canvas específica del Gateway y la autenticación de capacidades de Node por una superficie genérica de plugin alojado y auxiliares de capacidades de Node.
- Se añadieron resolutores de medios alojados propiedad del plugin para que las URL de documentos de Canvas se resuelvan mediante el plugin Canvas, en lugar de que el núcleo importe los componentes internos de documentos de Canvas.
- Se añadió `api.registerNodeCliFeature(...)` para que Canvas pueda declarar `openclaw nodes canvas` como una función de Node propiedad del plugin sin especificar manualmente la ruta del comando principal.
- Se eliminaron las importaciones de producción de `extensions/canvas/runtime-api.js` desde `src/**`.
- Se trasladó el código fuente del paquete A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` a `extensions/canvas/src/host/a2ui-app`.
- Se trasladó la implementación de compilación y copia de A2UI a `extensions/canvas/scripts` y se sustituyó la integración de compilación raíz por hooks genéricos de recursos de plugins incluidos.
- Se eliminó el alias de configuración heredado de nivel superior `canvasHost` del entorno de ejecución.
- Se conservó la migración de Canvas en doctor para que `openclaw doctor --fix` reescriba las configuraciones antiguas de `canvasHost` como `plugins.entries.canvas.config.host`.
- Se eliminó la compatibilidad heredada del protocolo de Canvas para agentes antiguos tras el protocolo v4 del Gateway. Ahora, los clientes nativos y los Gateways utilizan únicamente `pluginSurfaceUrls.canvas` junto con `node.pluginSurface.refresh`; la ruta obsoleta `canvasHostUrl`, `canvasCapability` y `node.canvas.capability.refresh` no es compatible intencionadamente en esta refactorización experimental.
- Se actualizó el inventario de plugins generado para incluir Canvas.
- Se añadió documentación de referencia del plugin en `docs/plugins/reference/canvas.md`.

Superficies conocidas de Canvas que siguen siendo propiedad del núcleo:

- Los controladores de Canvas de las aplicaciones nativas en `apps/` siguen consumiendo intencionadamente la superficie del plugin Canvas
- controladores del protocolo y del cliente de Canvas de las aplicaciones nativas en `apps/`
- la salida de los artefactos publicados sigue utilizando `dist/canvas-host/a2ui` para mantener la compatibilidad con versiones anteriores durante la búsqueda en el entorno de ejecución, pero el paso de copia ahora es propiedad del plugin

## Estructura objetivo

`extensions/canvas` debe ser propietario de:

- el manifiesto del plugin y los metadatos del paquete
- el registro de herramientas del agente
- la política de comandos de invocación de Node
- el host de Canvas y el entorno de ejecución de A2UI
- el código fuente del paquete A2UI de Canvas y los scripts de compilación y copia de recursos
- la creación de documentos de Canvas y la resolución de recursos
- la implementación de la CLI de Canvas
- la página de documentación de Canvas y la entrada del inventario de plugins

El núcleo solo debe ser propietario de puntos de integración genéricos:

- descubrimiento y registro de plugins
- registro genérico de herramientas del agente
- registro genérico de políticas de invocación de Node
- despacho genérico de HTTP/autenticación del Gateway y actualizaciones de WebSocket
- resolución genérica de URL de superficies de plugins alojados
- registro genérico de resolutores de medios alojados
- transporte genérico de capacidades de Node
- infraestructura genérica de configuración
- descubrimiento genérico de hooks de recursos de plugins incluidos

Las aplicaciones nativas pueden conservar los controladores de comandos de Canvas como clientes del protocolo. No son propietarias del entorno de ejecución del plugin.

## Pasos de migración

1. Tratar `plugins.entries.canvas.config.host` como la superficie de configuración propiedad del plugin.
2. Actualizar la documentación para describir Canvas como un plugin incluido experimental.
3. Ejecutar pruebas específicas de Canvas, comprobaciones del inventario de plugins, comprobaciones de la API del SDK de plugins y las barreras de compilación y tipos afectadas por los límites del entorno de ejecución.

## Lista de comprobación de la auditoría

Antes de dar por terminada la refactorización:

- `rg "src/canvas-host|../canvas-host"` no devuelve ninguna importación activa del código fuente.
- `rg "canvas-tool|createCanvasTool" src` no encuentra ninguna implementación de la herramienta Canvas propiedad del núcleo.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` no encuentra valores predeterminados de listas de permitidos codificados fuera de las pruebas genéricas de políticas de plugins.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` no devuelve resultados.
- `rg "canvas-documents" src` no devuelve resultados.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` no devuelve resultados; el plugin Canvas registra `openclaw nodes canvas` mediante metadatos anidados de la CLI del plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` no devuelve ninguna propiedad del entorno de ejecución del Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` solo encuentra envoltorios de compatibilidad o rutas propiedad del plugin.
- `pnpm plugins:inventory:check` se completa correctamente.
- `pnpm plugin-sdk:api:check` se completa correctamente, o las líneas base generadas de la API se actualizan y revisan intencionadamente.
- Las pruebas específicas de Canvas se completan correctamente.
- Las pruebas de carriles modificados se completan correctamente para las rutas del host de Canvas y A2UI.
- El cuerpo del PR indica explícitamente que Canvas es experimental y está respaldado por un plugin.

## Comandos de verificación

Utilice comprobaciones locales específicas durante la iteración:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Ejecute `pnpm build` antes de enviar los cambios si se modifican el barrel del entorno de ejecución, las importaciones diferidas, el empaquetado o las superficies publicadas del plugin.
