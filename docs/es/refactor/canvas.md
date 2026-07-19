---
read_when:
    - Traslado de la propiedad del host, las herramientas, los comandos, la documentación o el protocolo de Canvas
    - Auditando si Canvas sigue siendo propiedad del núcleo
    - Preparación o revisión del PR del plugin experimental Canvas
summary: Plan y lista de verificación de auditoría para trasladar Canvas fuera del núcleo y convertirlo en un plugin experimental incluido.
title: Refactorización del plugin Canvas
x-i18n:
    generated_at: "2026-07-19T02:25:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# Refactorización del plugin Canvas

Canvas tiene poco uso y es experimental. Debe tratarse como un plugin incluido, no como una funcionalidad del núcleo. El núcleo puede conservar la infraestructura genérica de Gateway, Node, HTTP, autenticación, configuración y clientes nativos, pero el comportamiento específico de Canvas debe residir en `extensions/canvas`.

## Objetivo

Trasladar la propiedad de Canvas a `extensions/canvas` y conservar el comportamiento actual del Node emparejado:

- la herramienta `canvas` orientada al agente se registra mediante el plugin Canvas
- los comandos del Node de Canvas solo se permiten cuando el plugin Canvas los registra
- los archivos de origen y del host de A2UI residen en el plugin Canvas
- la materialización de documentos de Canvas reside en el plugin Canvas
- la implementación del comando de la CLI reside en el plugin Canvas o delega mediante un barrel de runtime propiedad del plugin
- la documentación y el inventario de plugins describen Canvas como experimental y respaldado por un plugin

## Fuera del alcance

- No rediseñar la interfaz de usuario de Canvas de la aplicación nativa en esta refactorización.
- No eliminar la compatibilidad del protocolo ni del cliente de Canvas de iOS, Android o macOS, salvo que una decisión de producto independiente determine que Canvas debe eliminarse.
- No crear un framework amplio de servicios para plugins únicamente para Canvas, salvo que al menos otro plugin incluido necesite la misma interfaz.

## Estado actual de la rama

Completado:

- Se añadió el paquete del plugin incluido en `extensions/canvas`.
- Se añadió `extensions/canvas/openclaw.plugin.json`.
- Se trasladó la herramienta `canvas` del agente de `src/agents/tools/canvas-tool.ts` a `extensions/canvas/src/tool.ts`.
- Se eliminó del núcleo el registro de `createCanvasTool` en `src/agents/openclaw-tools.ts`.
- Se trasladó la implementación del host de Canvas de `src/canvas-host` a `extensions/canvas/src/host`.
- Se conservó `extensions/canvas/runtime-api.ts` como barrel de compatibilidad propiedad del plugin para pruebas, empaquetado y auxiliares públicos externos de Canvas.
- Se trasladó la materialización de documentos de Canvas de `src/gateway/canvas-documents.ts` a `extensions/canvas/src/documents.ts`.
- Se trasladaron la implementación de la CLI de Canvas y los auxiliares JSONL de A2UI a `extensions/canvas/src/cli.ts`.
- Se trasladaron la URL del host de Canvas y los auxiliares de capacidades con ámbito a `extensions/canvas/src`.
- Se eliminaron los valores predeterminados de los comandos del Node de Canvas de las listas codificadas en el núcleo y se trasladaron a `nodeInvokePolicies` del plugin.
- Se añadió la configuración del host de Canvas propiedad del plugin en `plugins.entries.canvas.config.host`.
- Se trasladó el servicio HTTP de Canvas y A2UI detrás del registro de rutas HTTP del plugin Canvas.
- Se añadió el despacho genérico de actualizaciones de WebSocket para rutas HTTP propiedad de plugins.
- Se sustituyeron la URL del host del Gateway y la autenticación de capacidades del Node específicas de Canvas por auxiliares genéricos de superficies alojadas de plugins y capacidades del Node.
- Se añadieron resolutores de medios alojados propiedad del plugin para que las URL de documentos de Canvas se resuelvan mediante el plugin Canvas, en lugar de que el núcleo importe componentes internos de documentos de Canvas.
- Se añadió `api.registerNodeCliFeature(...)` para que Canvas pueda declarar `openclaw nodes canvas` como una funcionalidad del Node propiedad del plugin sin especificar manualmente la ruta del comando principal.
- Se eliminaron las importaciones de producción de `src/**` desde `extensions/canvas/runtime-api.js`.
- Se trasladó el origen del paquete de A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` a `extensions/canvas/src/host/a2ui-app`.
- Se trasladó la implementación de compilación y copia de A2UI a `extensions/canvas/scripts` y se sustituyó la integración de compilación raíz por hooks genéricos de recursos de plugins incluidos.
- Se eliminó el alias heredado de configuración de nivel superior `canvasHost` del runtime.
- Se conservó la migración del doctor de Canvas para que `openclaw doctor --fix` reescriba las configuraciones antiguas de `canvasHost` como `plugins.entries.canvas.config.host`.
- Se eliminó la compatibilidad del protocolo Canvas con agentes antiguos tras el protocolo v4 del Gateway. Los clientes nativos y los gateways ahora usan únicamente `pluginSurfaceUrls.canvas` junto con `node.pluginSurface.refresh`; la ruta obsoleta `canvasHostUrl`, `canvasCapability` y `node.canvas.capability.refresh` no es compatible de forma intencionada en esta refactorización experimental.
- Se actualizó el inventario generado de plugins para incluir Canvas.
- Se añadió la documentación de referencia del plugin en `docs/plugins/reference/canvas.md`.

Superficies conocidas restantes de Canvas propiedad del núcleo:

- los controladores de Canvas de la aplicación nativa en `apps/` todavía consumen intencionadamente la superficie del plugin Canvas
- los controladores del protocolo y del cliente de Canvas de la aplicación nativa en `apps/`
- la salida de artefactos publicados todavía utiliza `dist/canvas-host/a2ui` para una búsqueda de runtime compatible con versiones anteriores, pero el paso de copia ahora pertenece al plugin

## Estructura objetivo

`extensions/canvas` debe ser propietario de:

- el manifiesto del plugin y los metadatos del paquete
- el registro de herramientas del agente
- la política de comandos de invocación del Node
- el host de Canvas y el runtime de A2UI
- el origen del paquete A2UI de Canvas y los scripts de compilación y copia de recursos
- la creación de documentos y la resolución de recursos de Canvas
- la implementación de la CLI de Canvas
- la página de documentación de Canvas y la entrada del inventario de plugins

El núcleo solo debe ser propietario de las interfaces genéricas:

- el descubrimiento y registro de plugins
- el registro genérico de herramientas del agente
- el registro genérico de políticas de invocación del Node
- el despacho genérico de HTTP/autenticación del Gateway y actualizaciones de WebSocket
- la resolución genérica de URL de superficies alojadas de plugins
- el registro genérico de resolutores de medios alojados
- el transporte genérico de capacidades del Node
- la infraestructura genérica de configuración
- el descubrimiento genérico de hooks de recursos de plugins incluidos

Las aplicaciones nativas pueden conservar los controladores de comandos de Canvas como clientes del protocolo. No son propietarias del runtime del plugin.

## Pasos de migración

1. Tratar `plugins.entries.canvas.config.host` como la superficie de configuración propiedad del plugin.
2. Actualizar la documentación para describir Canvas como un plugin incluido experimental.
3. Ejecutar pruebas específicas de Canvas, comprobaciones del inventario de plugins, comprobaciones de la API del SDK de plugins y las puertas de compilación y tipos afectadas por los límites del runtime.

## Lista de comprobación de auditoría

Antes de considerar completa la refactorización:

- `rg "src/canvas-host|../canvas-host"` no devuelve ninguna importación activa de código fuente.
- `rg "canvas-tool|createCanvasTool" src` no encuentra ninguna implementación de herramientas de Canvas propiedad del núcleo.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` no encuentra valores predeterminados de listas de permitidos codificados fuera de las pruebas genéricas de políticas de plugins.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` está vacío.
- `rg "canvas-documents" src` está vacío.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` está vacío; el plugin Canvas registra `openclaw nodes canvas` mediante metadatos anidados de la CLI del plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` no devuelve ninguna propiedad del runtime del Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` solo encuentra wrappers de compatibilidad o rutas propiedad del plugin.
- `pnpm plugins:inventory:check` se completa correctamente.
- `pnpm plugin-sdk:api:check` se completa correctamente, o los registros generados del contrato de la API se actualizan y revisan intencionadamente.
- Las pruebas específicas de Canvas se completan correctamente.
- Las pruebas de carriles modificados se completan correctamente para las rutas del host de Canvas/A2UI.
- El cuerpo del PR indica explícitamente que Canvas es experimental y está respaldado por un plugin.

## Comandos de verificación

Utilizar comprobaciones locales específicas durante la iteración:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Ejecutar `pnpm build` antes de hacer push si cambian el barrel del runtime, la importación diferida, el empaquetado o las superficies publicadas del plugin.
