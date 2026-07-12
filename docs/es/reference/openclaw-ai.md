---
read_when:
    - Quieres reutilizar los transportes de modelos de OpenClaw en otra aplicación
    - Estás modificando packages/ai o los puertos del host de transporte de IA
    - Estás revisando qué publica la versión de OpenClaw en npm además del paquete raíz
summary: 'El paquete npm @openclaw/ai: transportes de modelos reutilizables, entornos de ejecución aislados y puertos de políticas del host'
title: Paquete @openclaw/ai
x-i18n:
    generated_at: "2026-07-11T23:29:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` es la versión en forma de biblioteca publicable de la capa de ejecución de modelos de OpenClaw: contratos de mensajes, herramientas y flujos independientes del proveedor, validación, diagnósticos, flujos de eventos, un registro de ejecución aislado y adaptadores de carga diferida para las ocho familias de API integradas (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex y Mistral Conversations).

Se publica junto con el paquete raíz `openclaw` en cada versión, fijado a la misma versión y con su propio `npm-shrinkwrap.json`, para que su árbol de dependencias transitivas quede bloqueado durante la instalación. Al instalar `openclaw`, se instala automáticamente la versión correspondiente de `@openclaw/ai`; los consumidores de la biblioteca pueden depender directamente de ella sin ningún código de la aplicación OpenClaw.

## Inicio rápido

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Hay una versión ejecutable en el repositorio, en `examples/ai-chat`.

## Contrato de diseño

- **Con alcance de instancia de forma predeterminada.** Importar el paquete no registra nada globalmente. `createApiRegistry()` / `createLlmRuntime()` devuelven instancias aisladas; `registerBuiltInApiProviders(registry)` habilita los transportes integrados en un registro. Los módulos del SDK de proveedores se cargan de forma diferida cuando se usan por primera vez.
- **La política del host se inyecta, no se incluye.** La protección de las solicitudes realizadas con `fetch` (por ejemplo, la política contra SSRF), la ocultación de secretos en el texto reproducido de los resultados de herramientas, los valores predeterminados de herramientas estrictas de OpenAI y el registro de diagnósticos son puertos `AiTransportHost` configurados con `configureAiTransportHost`. Los valores predeterminados de la biblioteca son inertes; OpenClaw instala sus implementaciones reales en su fachada de flujos.
- **Una sola identidad de flujo de eventos.** `@openclaw/ai/event-stream` es el constructor canónico de `EventStream` compartido por el núcleo de OpenClaw, agent-core y los consumidores externos.
- **Las subrutas `internal/*` no forman parte de la API.** Existen para la propia aplicación OpenClaw y no ofrecen ninguna garantía de versionado semántico.
- Los identificadores de proveedores, las credenciales, los catálogos de modelos, los reintentos y la conmutación por error siguen siendo responsabilidad de la aplicación. OpenClaw incorpora esas capas alrededor de este paquete; el consumidor de una biblioteca proporciona directamente un objeto `Model` y las opciones.

## Exportaciones de subrutas

| Subruta          | Contenido                                                                       |
| ---------------- | ------------------------------------------------------------------------------- |
| `.`              | Contratos, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Tipos de modelos, mensajes, herramientas y flujos                             |
| `./validation`   | Validación de argumentos de herramientas                                      |
| `./diagnostics`  | Contratos de diagnóstico                                                      |
| `./event-stream` | Implementación compartida de `EventStream`                                    |
| `./internal/*`   | Uso interno de OpenClaw, sin garantía de versionado semántico                  |
