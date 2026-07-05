---
read_when:
    - Quieres reutilizar los transportes de modelo de OpenClaw en otra aplicación
    - Estás cambiando packages/ai o los puertos del host de transporte de IA
    - Estás revisando lo que la versión de OpenClaw publica en npm además del paquete raíz
summary: 'El paquete npm @openclaw/ai: transportes de modelos reutilizables, entornos de ejecución aislados y puertos de política del host'
title: paquete @openclaw/ai
x-i18n:
    generated_at: "2026-07-05T11:40:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` es la forma de biblioteca publicable de la capa de ejecución de modelos de OpenClaw: contratos neutrales respecto del proveedor para mensajes/herramientas/flujos, validación, diagnósticos, flujos de eventos, un registro de runtime aislado y adaptadores de carga diferida para las ocho familias de API integradas (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex, Mistral Conversations).

Se publica junto con el paquete raíz `openclaw` en cada lanzamiento, fijado a la misma versión, con su propio `npm-shrinkwrap.json` para que su árbol de dependencias transitivas quede bloqueado en el momento de la instalación. Instalar `openclaw` instala automáticamente el `@openclaw/ai` correspondiente; los consumidores de la biblioteca pueden depender de él directamente sin ningún código de aplicación de OpenClaw.

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

Hay una versión ejecutable en el repositorio en `examples/ai-chat`.

## Contrato de diseño

- **Con alcance de instancia de forma predeterminada.** Importar el paquete no registra nada globalmente. `createApiRegistry()` / `createLlmRuntime()` devuelven instancias aisladas; `registerBuiltInApiProviders(registry)` opta por habilitar los transportes integrados en un registro. Los módulos SDK de proveedor se cargan de forma diferida en el primer uso.
- **La política del host se inyecta, no se empaqueta.** La protección de fetch de solicitudes (por ejemplo, la política SSRF), la redacción de secretos del texto de reproducción de resultados de herramientas, los valores predeterminados de herramientas estrictas de OpenAI y el registro de diagnósticos son puertos `AiTransportHost` configurados con `configureAiTransportHost`. Los valores predeterminados de la biblioteca son inertes; OpenClaw instala sus implementaciones reales en su fachada de flujo.
- **Una identidad de flujo de eventos.** `@openclaw/ai/event-stream` es el constructor `EventStream` canónico compartido por el núcleo de OpenClaw, agent-core y consumidores externos.
- **Las subrutas `internal/*` no son API.** Existen para la propia aplicación OpenClaw y no tienen garantía semver.
- Los ids de proveedor, las credenciales, los catálogos de modelos, los reintentos y la conmutación por error siguen siendo responsabilidades de la aplicación. OpenClaw superpone esas capas alrededor de este paquete; un consumidor de la biblioteca proporciona directamente un objeto `Model` y opciones.

## Exportaciones de subruta

| Subruta          | Contenido                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Contratos, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Tipos de modelo/mensaje/herramienta/flujo                                      |
| `./validation`   | Validación de argumentos de herramientas                                       |
| `./diagnostics`  | Contratos de diagnósticos                                                      |
| `./event-stream` | Implementación compartida de `EventStream`                                     |
| `./internal/*`   | Interno de OpenClaw, sin garantía semver                                       |
