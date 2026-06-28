---
read_when:
    - Está escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK de plugins
    - Quieres comprender las pruebas de contrato para plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para Plugins de OpenClaw
title: Pruebas de Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades de prueba, patrones y aplicación de lint para los
plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas desarrollados:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas de ayudantes de prueba son puntos de entrada de código fuente locales del repositorio para las pruebas de plugins
incluidos propias de OpenClaw. No son exportaciones de paquete para plugins de terceros, y
pueden importar Vitest u otras dependencias de prueba exclusivas del repositorio.

**Importación de mock de API de Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Importación de contrato del runtime de agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Importación de contrato de canal:** `openclaw/plugin-sdk/channel-contract-testing`

**Importación de ayudante de prueba de canal:** `openclaw/plugin-sdk/channel-test-helpers`

**Importación de prueba de destino de canal:** `openclaw/plugin-sdk/channel-target-testing`

**Importación de contrato de Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Importación de prueba de runtime de Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Importación de contrato de proveedor:** `openclaw/plugin-sdk/provider-test-contracts`

**Importación de mock HTTP de proveedor:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Importación de prueba de entorno/red:** `openclaw/plugin-sdk/test-env`

**Importación de fixture genérico:** `openclaw/plugin-sdk/test-fixtures`

**Importación de mock integrado de Node:** `openclaw/plugin-sdk/test-node-mocks`

Dentro del repositorio de OpenClaw, prefiere las subrutas específicas siguientes para nuevas pruebas de plugins
incluidos. El barrel amplio
`openclaw/plugin-sdk/testing` es solo compatibilidad heredada.
Las barreras del repositorio rechazan nuevas importaciones reales desde `plugin-sdk/testing` y
`plugin-sdk/test-utils`; esos nombres permanecen solo como superficies de compatibilidad obsoletas
para pruebas de registro de compatibilidad.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Exportaciones disponibles

| Exportación                                          | Propósito                                                                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Construye una simulación mínima de API de plugin para pruebas unitarias de registro directo. Importar desde `plugin-sdk/plugin-test-api`      |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture de contrato compartido de perfil de autenticación para adaptadores de tiempo de ejecución de agentes nativos. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture de contrato compartido de supresión de entrega para adaptadores de tiempo de ejecución de agentes nativos. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture de contrato compartido de clasificación de fallback para adaptadores de tiempo de ejecución de agentes nativos. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Construye fixtures de esquemas de herramientas dinámicas para pruebas de contrato de tiempo de ejecución nativo. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Verifica la forma del contexto entrante del canal. Importar desde `plugin-sdk/channel-contract-testing`                                       |
| `installChannelOutboundPayloadContractSuite`         | Instala casos de contrato de carga útil saliente del canal. Importar desde `plugin-sdk/channel-contract-testing`                              |
| `createStartAccountContext`                          | Construye contextos de ciclo de vida de cuenta de canal. Importar desde `plugin-sdk/channel-test-helpers`                                     |
| `installChannelActionsContractSuite`                 | Instala casos genéricos de contrato de acciones de mensaje de canal. Importar desde `plugin-sdk/channel-test-helpers`                         |
| `installChannelSetupContractSuite`                   | Instala casos genéricos de contrato de configuración de canal. Importar desde `plugin-sdk/channel-test-helpers`                               |
| `installChannelStatusContractSuite`                  | Instala casos genéricos de contrato de estado de canal. Importar desde `plugin-sdk/channel-test-helpers`                                      |
| `expectDirectoryIds`                                 | Verifica los identificadores de directorio del canal desde una función de lista de directorios. Importar desde `plugin-sdk/channel-test-helpers` |
| `assertBundledChannelEntries`                        | Verifica que los puntos de entrada de canales incluidos expongan el contrato público esperado. Importar desde `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Da formato a marcas de tiempo deterministas de sobres. Importar desde `plugin-sdk/channel-test-helpers`                                      |
| `expectPairingReplyText`                             | Verifica el texto de respuesta de emparejamiento del canal y extrae su código. Importar desde `plugin-sdk/channel-test-helpers`               |
| `describePluginRegistrationContract`                 | Instala comprobaciones de contrato de registro de plugins. Importar desde `plugin-sdk/plugin-test-contracts`                                  |
| `registerSingleProviderPlugin`                       | Registra un plugin de proveedor en pruebas de humo del cargador. Importar desde `plugin-sdk/plugin-test-runtime`                              |
| `registerProviderPlugin`                             | Captura todos los tipos de proveedor de un plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                            |
| `registerProviderPlugins`                            | Captura registros de proveedores entre varios plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                       |
| `requireRegisteredProvider`                          | Verifica que una colección de proveedores contenga un identificador. Importar desde `plugin-sdk/plugin-test-runtime`                          |
| `createRuntimeEnv`                                   | Construye un entorno simulado de tiempo de ejecución de CLI/plugin. Importar desde `plugin-sdk/plugin-test-runtime`                           |
| `createPluginRuntimeMock`                            | Construye una superficie simulada de tiempo de ejecución de plugin. Importar desde `plugin-sdk/plugin-test-runtime`                           |
| `createPluginSetupWizardStatus`                      | Construye helpers de estado de configuración para plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime`                           |
| `describeOpenAIProviderRuntimeContract`              | Instala comprobaciones de contrato de tiempo de ejecución de familia de proveedores. Importar desde `plugin-sdk/provider-test-contracts`       |
| `expectPassthroughReplayPolicy`                      | Verifica que las políticas de reproducción del proveedor pasen herramientas y metadatos propiedad del proveedor sin modificarlos. Importar desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Ejecuta una prueba en vivo de proveedor STT en tiempo real con fixtures de audio compartidos. Importar desde `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normaliza la salida de transcripción en vivo antes de aserciones difusas. Importar desde `plugin-sdk/provider-test-contracts`                 |
| `expectExplicitVideoGenerationCapabilities`          | Verifica que los proveedores de video declaren capacidades explícitas de modo de generación. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Verifica que los proveedores de música declaren capacidades explícitas de generación/edición. Importar desde `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instala una respuesta correcta de tarea de video compatible con DashScope. Importar desde `plugin-sdk/provider-test-contracts`                |
| `getProviderHttpMocks`                               | Accede a simulaciones Vitest optativas de HTTP/autenticación de proveedores. Importar desde `plugin-sdk/provider-http-test-mocks`             |
| `installProviderHttpMockCleanup`                     | Restablece las simulaciones de HTTP/autenticación de proveedores después de cada prueba. Importar desde `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para el manejo de errores de resolución de destino. Importar desde `plugin-sdk/channel-target-testing`            |
| `shouldAckReaction`                                  | Comprueba si un canal debe añadir una reacción de confirmación. Importar desde `plugin-sdk/channel-feedback`                                  |
| `removeAckReactionAfterReply`                        | Elimina la reacción de confirmación después de la entrega de la respuesta. Importar desde `plugin-sdk/channel-feedback`                       |
| `createTestRegistry`                                 | Construye un fixture de registro de plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`     |
| `createEmptyPluginRegistry`                          | Construye un fixture de registro de plugins vacío. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`        |
| `setActivePluginRegistry`                            | Instala un fixture de registro para pruebas de tiempo de ejecución de plugins. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Captura solicitudes fetch JSON en pruebas de helpers de medios. Importar desde `plugin-sdk/test-env`                                         |
| `withServer`                                         | Ejecuta pruebas contra un servidor HTTP local desechable. Importar desde `plugin-sdk/test-env`                                               |
| `createMockIncomingRequest`                          | Construye un objeto mínimo de solicitud HTTP entrante. Importar desde `plugin-sdk/test-env`                                                  |
| `withFetchPreconnect`                                | Ejecuta pruebas fetch con hooks de preconexión instalados. Importar desde `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                           | Parchea temporalmente variables de entorno. Importar desde `plugin-sdk/test-env`                                                             |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixtures de prueba de sistema de archivos aislados. Importar desde `plugin-sdk/test-env`                                                |
| `createMockServerResponse`                           | Crea una simulación mínima de respuesta de servidor HTTP. Importar desde `plugin-sdk/test-env`                                               |
| `createCliRuntimeCapture`                            | Captura la salida de tiempo de ejecución de CLI en pruebas. Importar desde `plugin-sdk/test-fixtures`                                        |
| `importFreshModule`                                  | Importa un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importar desde `plugin-sdk/test-fixtures`              |
| `bundledPluginRoot` / `bundledPluginFile`            | Resuelve rutas de fixtures de origen o dist de plugins incluidos. Importar desde `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Instala simulaciones Vitest limitadas de módulos integrados de Node. Importar desde `plugin-sdk/test-node-mocks`                             |
| `createSandboxTestContext`                           | Construye contextos de prueba de sandbox. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `writeSkill`                                         | Escribe fixtures de Skills. Importar desde `plugin-sdk/test-fixtures`                                                                        |
| `makeAgentAssistantMessage`                          | Construye fixtures de mensajes de transcripción de agente. Importar desde `plugin-sdk/test-fixtures`                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecciona y restablece fixtures de eventos del sistema. Importar desde `plugin-sdk/test-fixtures`                                         |
| `sanitizeTerminalText`                               | Sanea la salida de terminal para aserciones. Importar desde `plugin-sdk/test-fixtures`                                                       |
| `countLines` / `hasBalancedFences`                   | Verifica la forma de salida de fragmentación. Importar desde `plugin-sdk/test-fixtures`                                                      |
| `runProviderCatalog`                                 | Ejecuta un hook de catálogo de proveedor con dependencias de prueba                                                                          |
| `resolveProviderWizardOptions`                       | Resuelve opciones del asistente de configuración de proveedores en pruebas de contrato                                                      |
| `resolveProviderModelPickerEntries`                  | Resuelve entradas del selector de modelos del proveedor en pruebas de contrato                                                              |
| `buildProviderPluginMethodChoice`                    | Construye identificadores de opciones del asistente de proveedores para aserciones                                                          |
| `setProviderWizardProvidersResolverForTest`          | Inyectar proveedores del asistente de proveedores para pruebas aisladas                                                                  |
| `createProviderUsageFetch`                           | Crear fixtures de recuperación de uso de proveedores                                                                                     |
| `useFrozenTime` / `useRealTime`                      | Congelar y restaurar temporizadores para pruebas sensibles al tiempo. Importar desde `plugin-sdk/test-env`                               |
| `createTestWizardPrompter`                           | Crear un prompter simulado del asistente de configuración                                                                                 |
| `createRuntimeTaskFlow`                              | Crear estado aislado de flujo de tareas de runtime                                                                                       |
| `typedCases`                                         | Preservar tipos literales para pruebas basadas en tablas. Importar desde `plugin-sdk/test-fixtures`                                      |

Las suites de contrato de Plugins incluidos también usan subrutas de prueba del SDK para helpers exclusivos de prueba de registro, manifiesto, artefactos públicos y fixtures de runtime. Las suites exclusivas de core que dependen del inventario incluido de OpenClaw permanecen bajo `src/plugins/contracts`.
Mantén las pruebas de extensiones nuevas en una subruta enfocada y documentada del SDK como
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` o `plugin-sdk/test-fixtures`, en lugar de importar directamente el barril amplio de compatibilidad `plugin-sdk/testing`, archivos `src/**` del repo o puentes `test/helpers/*` del repo.

### Tipos

Las subrutas enfocadas de pruebas también reexportan tipos útiles en archivos de prueba:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolución del destino de prueba

Usa `installCommonResolveTargetErrorCases` para agregar casos de error estándar para la resolución del destino del canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Patrones de prueba

### Probar contratos de registro

Las pruebas unitarias que pasan un mock `api` escrito a mano a `register(api)` no ejercitan las puertas de aceptación del loader de OpenClaw. Agrega al menos una prueba smoke respaldada por el loader para cada superficie de registro de la que dependa tu Plugin, especialmente hooks y capacidades exclusivas como memoria.

El loader real falla el registro del Plugin cuando faltan metadatos requeridos o un Plugin llama a una API de capacidad que no posee. Por ejemplo,
`api.registerHook(...)` requiere un nombre de hook, y
`api.registerMemoryCapability(...)` requiere que el manifiesto del Plugin o la entrada exportada declare `kind: "memory"`.

### Probar el acceso a la configuración del runtime

Prefiere el mock compartido del runtime de Plugin de `openclaw/plugin-sdk/plugin-test-runtime`.
Sus mocks obsoletos `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)` lanzan errores de forma predeterminada para que las pruebas detecten nuevos usos de APIs de compatibilidad. Sobrescribe esos mocks solo cuando la prueba cubra explícitamente comportamiento de compatibilidad heredada.

### Pruebas unitarias de un Plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Pruebas unitarias de un Plugin de proveedor

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mockear el runtime de Plugin

Para código que usa `createPluginRuntimeStore`, mockea el runtime en las pruebas:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Probar con stubs por instancia

Prefiere stubs por instancia en lugar de mutación del prototipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contrato (Plugins dentro del repo)

Los Plugins incluidos tienen pruebas de contrato que verifican la propiedad del registro:

```bash
pnpm test -- src/plugins/contracts/
```

Estas pruebas verifican:

- Qué Plugins registran qué proveedores
- Qué Plugins registran qué proveedores de voz
- Corrección de la forma del registro
- Cumplimiento del contrato del runtime

### Ejecutar pruebas con alcance

Para un Plugin específico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo para pruebas de contrato:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicación de lint (Plugins dentro del repo)

`pnpm check` aplica tres reglas para Plugins dentro del repo:

1. **Sin imports raíz monolíticos** -- se rechaza el barril raíz `openclaw/plugin-sdk`
2. **Sin imports directos de `src/`** -- los Plugins no pueden importar directamente `../../src/`
3. **Sin autoimports** -- los Plugins no pueden importar su propia subruta `plugin-sdk/<name>`

Los Plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos patrones.

## Configuración de pruebas

OpenClaw usa Vitest con umbrales de cobertura V8. Para pruebas de Plugins:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Si las ejecuciones locales causan presión de memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de Plugin de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de Plugin de proveedor
- [Crear Plugins](/es/plugins/building-plugins) -- guía de primeros pasos
