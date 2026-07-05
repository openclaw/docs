---
read_when:
    - Estás escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK de plugins
    - Quieres comprender las pruebas de contrato para plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para Plugins de OpenClaw
title: Pruebas de Plugin
x-i18n:
    generated_at: "2026-07-05T11:37:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9837eae92abfc6e7e7ebc5802ddc7bf2f452140f34adca266c5c069fb927ffb9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia para utilidades de prueba, patrones y aplicación de lint para los plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas desarrollados:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas son puntos de entrada de código fuente locales del repositorio para las pruebas de los plugins incluidos propios de OpenClaw. No son exportaciones de `package.json` publicadas para plugins de terceros, y pueden importar Vitest u otras dependencias de prueba exclusivas del repositorio.

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

Prefiere estas subrutas enfocadas para las nuevas pruebas de plugins incluidos. El barril amplio `openclaw/plugin-sdk/testing` y el alias `openclaw/plugin-sdk/test-utils` son solo compatibilidad heredada: `pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) rechaza nuevas importaciones de cualquiera de los dos desde archivos de prueba de extensiones, y ambos permanecen únicamente para pruebas de registro de compatibilidad.

### Exportaciones disponibles

| Export                                               | Propósito                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Construye un mock mínimo de la API de plugin para pruebas unitarias de registro directo. Importa desde `plugin-sdk/plugin-test-api`        |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture de contrato compartido de perfil de autenticación para adaptadores de runtime de agentes nativos. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture de contrato compartido de supresión de entrega para adaptadores de runtime de agentes nativos. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture de contrato compartido de clasificación de fallback para adaptadores de runtime de agentes nativos. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Construye fixtures de esquema de herramientas dinámicas para pruebas de contrato del runtime nativo. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Verifica la forma del contexto entrante del canal. Importa desde `plugin-sdk/channel-contract-testing`                                      |
| `installChannelOutboundPayloadContractSuite`         | Instala casos de contrato de payload saliente del canal. Importa desde `plugin-sdk/channel-contract-testing`                               |
| `createStartAccountContext`                          | Construye contextos de ciclo de vida de cuenta del canal. Importa desde `plugin-sdk/channel-test-helpers`                                  |
| `installChannelActionsContractSuite`                 | Instala casos genéricos de contrato de acciones de mensaje del canal. Importa desde `plugin-sdk/channel-test-helpers`                      |
| `installChannelSetupContractSuite`                   | Instala casos genéricos de contrato de configuración del canal. Importa desde `plugin-sdk/channel-test-helpers`                            |
| `installChannelStatusContractSuite`                  | Instala casos genéricos de contrato de estado del canal. Importa desde `plugin-sdk/channel-test-helpers`                                   |
| `expectDirectoryIds`                                 | Verifica los ids del directorio del canal desde una función de listado de directorio. Importa desde `plugin-sdk/channel-test-helpers`      |
| `assertBundledChannelEntries`                        | Verifica que los entrypoints de canales empaquetados expongan el contrato público esperado. Importa desde `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Da formato a timestamps deterministas de sobres. Importa desde `plugin-sdk/channel-test-helpers`                                           |
| `expectPairingReplyText`                             | Verifica el texto de respuesta de emparejamiento del canal y extrae su código. Importa desde `plugin-sdk/channel-test-helpers`             |
| `describePluginRegistrationContract`                 | Instala comprobaciones de contrato de registro de plugin. Importa desde `plugin-sdk/plugin-test-contracts`                                 |
| `registerSingleProviderPlugin`                       | Registra un plugin de proveedor en pruebas de humo del cargador. Importa desde `plugin-sdk/plugin-test-runtime`                            |
| `registerProviderPlugin`                             | Captura todos los tipos de proveedor de un plugin. Importa desde `plugin-sdk/plugin-test-runtime`                                          |
| `registerProviderPlugins`                            | Captura registros de proveedores en varios plugins. Importa desde `plugin-sdk/plugin-test-runtime`                                         |
| `requireRegisteredProvider`                          | Verifica que una colección de proveedores contenga un id. Importa desde `plugin-sdk/plugin-test-runtime`                                   |
| `createRuntimeEnv`                                   | Construye un entorno de runtime de CLI/plugin con mocks. Importa desde `plugin-sdk/plugin-test-runtime`                                    |
| `createPluginRuntimeMock`                            | Construye una superficie de runtime de plugin con mocks. Importa desde `plugin-sdk/plugin-test-runtime`                                    |
| `createPluginSetupWizardStatus`                      | Construye helpers de estado de configuración para plugins de canal. Importa desde `plugin-sdk/plugin-test-runtime`                         |
| `createTestWizardPrompter`                           | Construye un prompter de asistente de configuración con mocks. Importa desde `plugin-sdk/plugin-test-runtime`                              |
| `createRuntimeTaskFlow`                              | Crea estado aislado de task-flow del runtime. Importa desde `plugin-sdk/plugin-test-runtime`                                               |
| `runProviderCatalog`                                 | Ejecuta un hook de catálogo de proveedores con dependencias de prueba. Importa desde `plugin-sdk/plugin-test-runtime`                      |
| `resolveProviderWizardOptions`                       | Resuelve opciones del asistente de configuración de proveedor en pruebas de contrato. Importa desde `plugin-sdk/plugin-test-runtime`       |
| `resolveProviderModelPickerEntries`                  | Resuelve entradas del selector de modelos de proveedor en pruebas de contrato. Importa desde `plugin-sdk/plugin-test-runtime`              |
| `buildProviderPluginMethodChoice`                    | Construye ids de opciones del asistente de proveedor para aserciones. Importa desde `plugin-sdk/plugin-test-runtime`                       |
| `setProviderWizardProvidersResolverForTest`          | Inyecta proveedores del asistente de proveedor para pruebas aisladas. Importa desde `plugin-sdk/plugin-test-runtime`                       |
| `describeOpenAIProviderRuntimeContract`              | Instala comprobaciones de contrato de runtime de familia de proveedores. Importa desde `plugin-sdk/provider-test-contracts`                |
| `expectPassthroughReplayPolicy`                      | Verifica que las políticas de reproducción de proveedores transmitan herramientas y metadatos propiedad del proveedor. Importa desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Ejecuta una prueba en vivo de proveedor STT en tiempo real con fixtures de audio compartidos. Importa desde `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normaliza la salida de transcripción en vivo antes de aserciones difusas. Importa desde `plugin-sdk/provider-test-contracts`               |
| `expectExplicitVideoGenerationCapabilities`          | Verifica que los proveedores de video declaren capacidades explícitas de modo de generación. Importa desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Verifica que los proveedores de música declaren capacidades explícitas de generación/edición. Importa desde `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instala una respuesta exitosa de tarea de video compatible con DashScope. Importa desde `plugin-sdk/provider-test-contracts`               |
| `getProviderHttpMocks`                               | Accede a mocks opt-in de HTTP/autenticación de proveedores para Vitest. Importa desde `plugin-sdk/provider-http-test-mocks`                |
| `installProviderHttpMockCleanup`                     | Restablece mocks de HTTP/autenticación de proveedores después de cada prueba. Importa desde `plugin-sdk/provider-http-test-mocks`          |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para manejo de errores de resolución de destino. Importa desde `plugin-sdk/channel-target-testing`             |
| `shouldAckReaction`                                  | Comprueba si un canal debería agregar una reacción de confirmación. Importa desde `plugin-sdk/channel-feedback`                            |
| `removeAckReactionAfterReply`                        | Elimina la reacción de confirmación después de entregar la respuesta. Importa desde `plugin-sdk/channel-feedback`                          |
| `createTestRegistry`                                 | Construye un fixture de registro de plugins de canal. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`   |
| `createEmptyPluginRegistry`                          | Construye un fixture de registro de plugins vacío. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`      |
| `setActivePluginRegistry`                            | Instala un fixture de registro para pruebas de runtime de plugin. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Captura solicitudes fetch JSON en pruebas de helpers multimedia. Importa desde `plugin-sdk/test-env`                                       |
| `withServer`                                         | Ejecuta pruebas contra un servidor HTTP local desechable. Importa desde `plugin-sdk/test-env`                                              |
| `createMockIncomingRequest`                          | Construye un objeto mínimo de solicitud HTTP entrante. Importa desde `plugin-sdk/test-env`                                                 |
| `withFetchPreconnect`                                | Ejecuta pruebas de fetch con hooks de preconexión instalados. Importa desde `plugin-sdk/test-env`                                         |
| `withEnv` / `withEnvAsync`                           | Parchea temporalmente variables de entorno. Importa desde `plugin-sdk/test-env`                                                            |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixtures aislados de pruebas del sistema de archivos. Importa desde `plugin-sdk/test-env`                                            |
| `createMockServerResponse`                           | Crea un mock mínimo de respuesta de servidor HTTP. Importa desde `plugin-sdk/test-env`                                                     |
| `createProviderUsageFetch`                           | Construye fixtures de fetch de uso de proveedores. Importa desde `plugin-sdk/test-env`                                                     |
| `useFrozenTime` / `useRealTime`                      | Congela y restaura temporizadores para pruebas sensibles al tiempo. Importa desde `plugin-sdk/test-env`                                   |
| `createCliRuntimeCapture`                            | Captura la salida del runtime de CLI en pruebas. Importa desde `plugin-sdk/test-fixtures`                                                  |
| `importFreshModule`                                  | Importa un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importa desde `plugin-sdk/test-fixtures`             |
| `bundledPluginRoot` / `bundledPluginFile`            | Resuelve rutas de fixtures de código fuente o dist de plugins empaquetados. Importa desde `plugin-sdk/test-fixtures`                      |
| `mockNodeBuiltinModule`                              | Instala mocks estrechos de Vitest para módulos integrados de Node. Importa desde `plugin-sdk/test-node-mocks`                             |
| `createSandboxTestContext`                           | Construye contextos de prueba de sandbox. Importa desde `plugin-sdk/test-fixtures`                                                        |
| `writeSkill`                                         | Escribe fixtures de Skills. Importa desde `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Crea fixtures de mensajes de transcripción del agente. Importa desde `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecciona y restablece fixtures de eventos del sistema. Importa desde `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanitiza la salida de terminal para aserciones. Importa desde `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Verifica la forma de salida de fragmentación. Importa desde `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Conserva tipos literales para pruebas basadas en tablas. Importa desde `plugin-sdk/test-fixtures`                                                    |

Las suites de contrato de plugins incluidos también usan estas subrutas de prueba del SDK para
helpers de fixtures solo de prueba de registro, manifiesto, artefacto público y runtime.
Las suites solo de núcleo que dependen del inventario incluido de OpenClaw permanecen en
`src/plugins/contracts`.

### Tipos

Las subrutas de prueba enfocadas también reexportan tipos útiles en archivos de prueba:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolución del destino de pruebas

Usa `installCommonResolveTargetErrorCases` para agregar casos de error estándar para
la resolución de destinos de canal:

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

Las pruebas unitarias que pasan un mock `api` escrito a mano a `register(api)` no
ejercitan las puertas de aceptación del cargador de OpenClaw. Agrega al menos una
prueba de humo respaldada por el cargador para cada superficie de registro de la que dependa tu plugin, especialmente
hooks y capacidades exclusivas como memoria.

El cargador real falla el registro del plugin cuando faltan metadatos requeridos o
un plugin llama a una API de capacidad que no posee. Por ejemplo,
`api.registerHook(...)` requiere un nombre de hook, y
`api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la entrada
exportada declare `kind: "memory"`.

### Probar el acceso a la configuración del runtime

Prefiere el mock compartido del runtime de plugins de `openclaw/plugin-sdk/plugin-test-runtime`.
Sus mocks `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)`
lanzan errores de forma predeterminada para que las pruebas detecten el nuevo uso de API de compatibilidad
obsoletas. Sobrescribe esos mocks solo cuando la prueba cubra explícitamente comportamiento de compatibilidad
heredado.

### Pruebas unitarias de un plugin de canal

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

### Pruebas unitarias de un plugin de proveedor

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

### Mocking del runtime de plugins

Para el código que usa `createPluginRuntimeStore`, crea un mock del runtime en las pruebas:

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

Prefiere stubs por instancia en lugar de mutación de prototipos:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contrato (plugins dentro del repositorio)

Los plugins incluidos tienen pruebas de contrato que verifican la propiedad del registro:

```bash
pnpm test src/plugins/contracts/
```

Estas pruebas verifican:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- Corrección de la forma del registro
- Cumplimiento del contrato de runtime

### Ejecutar pruebas con alcance

Para un plugin específico:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Solo para pruebas de contrato:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicación de lint (plugins dentro del repositorio)

`scripts/run-additional-boundary-checks.mjs` ejecuta un conjunto de comprobaciones de límites de importación `lint:plugins:*`
en CI; cada una también se puede ejecutar de forma independiente en local:

| Comando                                                        | Aplica                                                                                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Los plugins incluidos no pueden importar el barrel raíz monolítico `openclaw/plugin-sdk`.                                   |
| `pnpm run lint:plugins:no-extension-src-imports`               | Los archivos de extensión de producción no pueden importar directamente el árbol `src/**` del repositorio (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Los archivos de prueba de extensión no pueden importar `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` ni otros helpers de prueba solo de núcleo. |

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos
patrones.

## Configuración de pruebas

OpenClaw usa Vitest 4 con umbrales de cobertura de V8. Para pruebas de plugins:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Si las ejecuciones locales causan presión de memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de plugin de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de plugin de proveedor
- [Crear plugins](/es/plugins/building-plugins) -- guía de introducción
