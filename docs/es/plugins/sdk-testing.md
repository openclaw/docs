---
read_when:
    - Estás escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK de Plugin
    - Quieres comprender las pruebas de contrato para Plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para plugins de OpenClaw
title: Pruebas de Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia para utilidades de prueba, patrones y aplicación de lint para plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas desarrollados:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

**Importación del mock de la API del Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Importación del contrato de runtime del agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Importación del contrato de canal:** `openclaw/plugin-sdk/channel-contract-testing`

**Importación del helper de prueba de canal:** `openclaw/plugin-sdk/channel-test-helpers`

**Importación de prueba de destino de canal:** `openclaw/plugin-sdk/channel-target-testing`

**Importación del contrato del Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Importación de prueba de runtime del Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Importación del contrato de proveedor:** `openclaw/plugin-sdk/provider-test-contracts`

**Importación del mock HTTP de proveedor:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Importación de pruebas de entorno/red:** `openclaw/plugin-sdk/test-env`

**Importación de fixture genérico:** `openclaw/plugin-sdk/test-fixtures`

**Importación del mock integrado de Node:** `openclaw/plugin-sdk/test-node-mocks`

Prefiere las subrutas específicas siguientes para las nuevas pruebas de plugins. El barrel amplio
`openclaw/plugin-sdk/testing` es solo para compatibilidad heredada.
Las protecciones del repositorio rechazan nuevas importaciones reales desde `plugin-sdk/testing` y
`plugin-sdk/test-utils`; esos nombres permanecen solo como superficies de compatibilidad obsoletas
para plugins externos y pruebas de registro de compatibilidad.

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

| Exportación                                           | Propósito                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Construir una simulación mínima de la API de Plugin para pruebas unitarias de registro directo. Importar desde `plugin-sdk/plugin-test-api` |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture de contrato de perfil de autenticación compartido para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture de contrato de supresión de entrega compartido para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture de contrato de clasificación de reserva compartido para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Construir fixtures de esquema de herramientas dinámicas para pruebas de contrato del entorno de ejecución nativo. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Afirmar la forma del contexto de entrada del canal. Importar desde `plugin-sdk/channel-contract-testing` |
| `installChannelOutboundPayloadContractSuite`         | Instalar casos de contrato de carga útil saliente del canal. Importar desde `plugin-sdk/channel-contract-testing` |
| `createStartAccountContext`                          | Construir contextos del ciclo de vida de cuentas de canal. Importar desde `plugin-sdk/channel-test-helpers` |
| `installChannelActionsContractSuite`                 | Instalar casos genéricos de contrato de acciones de mensaje de canal. Importar desde `plugin-sdk/channel-test-helpers` |
| `installChannelSetupContractSuite`                   | Instalar casos genéricos de contrato de configuración de canal. Importar desde `plugin-sdk/channel-test-helpers` |
| `installChannelStatusContractSuite`                  | Instalar casos genéricos de contrato de estado de canal. Importar desde `plugin-sdk/channel-test-helpers` |
| `expectDirectoryIds`                                 | Afirmar los id. de directorio del canal desde una función de lista de directorios. Importar desde `plugin-sdk/channel-test-helpers` |
| `assertBundledChannelEntries`                        | Afirmar que los puntos de entrada de canal incluidos exponen el contrato público esperado. Importar desde `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatear marcas de tiempo de sobre deterministas. Importar desde `plugin-sdk/channel-test-helpers` |
| `expectPairingReplyText`                             | Afirmar el texto de respuesta de emparejamiento del canal y extraer su código. Importar desde `plugin-sdk/channel-test-helpers` |
| `describePluginRegistrationContract`                 | Instalar comprobaciones del contrato de registro de Plugin. Importar desde `plugin-sdk/plugin-test-contracts` |
| `registerSingleProviderPlugin`                       | Registrar un Plugin de proveedor en pruebas rápidas del cargador. Importar desde `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugin`                             | Capturar todos los tipos de proveedor de un Plugin. Importar desde `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugins`                            | Capturar registros de proveedor en varios plugins. Importar desde `plugin-sdk/plugin-test-runtime` |
| `requireRegisteredProvider`                          | Afirmar que una colección de proveedores contiene un id. Importar desde `plugin-sdk/plugin-test-runtime` |
| `createRuntimeEnv`                                   | Construir un entorno simulado de ejecución de CLI/Plugin. Importar desde `plugin-sdk/plugin-test-runtime` |
| `createPluginSetupWizardStatus`                      | Construir ayudantes de estado de configuración para plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime` |
| `describeOpenAIProviderRuntimeContract`              | Instalar comprobaciones de contrato del entorno de ejecución de familia de proveedores. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectPassthroughReplayPolicy`                      | Afirmar que las políticas de reproducción de proveedor dejan pasar herramientas y metadatos propiedad del proveedor. Importar desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Ejecutar una prueba en vivo de proveedor STT en tiempo real con fixtures de audio compartidos. Importar desde `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normalizar la salida de transcripción en vivo antes de afirmaciones aproximadas. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitVideoGenerationCapabilities`          | Afirmar que los proveedores de video declaran capacidades explícitas de modo de generación. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Afirmar que los proveedores de música declaran capacidades explícitas de generación/edición. Importar desde `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instalar una respuesta de tarea de video correcta compatible con DashScope. Importar desde `plugin-sdk/provider-test-contracts` |
| `getProviderHttpMocks`                               | Acceder a simulaciones Vitest HTTP/autenticación de proveedor con adhesión explícita. Importar desde `plugin-sdk/provider-http-test-mocks` |
| `installProviderHttpMockCleanup`                     | Restablecer simulaciones HTTP/autenticación de proveedor después de cada prueba. Importar desde `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para el manejo de errores de resolución de destino. Importar desde `plugin-sdk/channel-target-testing` |
| `shouldAckReaction`                                  | Comprobar si un canal debe añadir una reacción de confirmación. Importar desde `plugin-sdk/channel-feedback` |
| `removeAckReactionAfterReply`                        | Eliminar la reacción de confirmación después de la entrega de la respuesta. Importar desde `plugin-sdk/channel-feedback` |
| `createTestRegistry`                                 | Construir un fixture de registro de plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createEmptyPluginRegistry`                          | Construir un fixture de registro de plugins vacío. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `setActivePluginRegistry`                            | Instalar un fixture de registro para pruebas del entorno de ejecución de Plugin. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Capturar solicitudes fetch JSON en pruebas de ayudantes multimedia. Importar desde `plugin-sdk/test-env` |
| `withServer`                                         | Ejecutar pruebas contra un servidor HTTP local desechable. Importar desde `plugin-sdk/test-env` |
| `createMockIncomingRequest`                          | Construir un objeto mínimo de solicitud HTTP entrante. Importar desde `plugin-sdk/test-env` |
| `withFetchPreconnect`                                | Ejecutar pruebas de fetch con hooks de preconexión instalados. Importar desde `plugin-sdk/test-env` |
| `withEnv` / `withEnvAsync`                           | Parchear variables de entorno temporalmente. Importar desde `plugin-sdk/test-env` |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crear fixtures de prueba aislados del sistema de archivos. Importar desde `plugin-sdk/test-env` |
| `createMockServerResponse`                           | Crear una simulación mínima de respuesta de servidor HTTP. Importar desde `plugin-sdk/test-env` |
| `createCliRuntimeCapture`                            | Capturar salida del entorno de ejecución de CLI en pruebas. Importar desde `plugin-sdk/test-fixtures` |
| `importFreshModule`                                  | Importar un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importar desde `plugin-sdk/test-fixtures` |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolver rutas de fixture de código fuente o distribución de Plugin incluido. Importar desde `plugin-sdk/test-fixtures` |
| `mockNodeBuiltinModule`                              | Instalar simulaciones Vitest acotadas de módulos integrados de Node. Importar desde `plugin-sdk/test-node-mocks` |
| `createSandboxTestContext`                           | Construir contextos de prueba de sandbox. Importar desde `plugin-sdk/test-fixtures` |
| `writeSkill`                                         | Escribir fixtures de Skills. Importar desde `plugin-sdk/test-fixtures` |
| `makeAgentAssistantMessage`                          | Construir fixtures de mensajes de transcripción de agente. Importar desde `plugin-sdk/test-fixtures` |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspeccionar y restablecer fixtures de eventos del sistema. Importar desde `plugin-sdk/test-fixtures` |
| `sanitizeTerminalText`                               | Sanear la salida de terminal para afirmaciones. Importar desde `plugin-sdk/test-fixtures` |
| `countLines` / `hasBalancedFences`                   | Afirmar la forma de la salida de fragmentación. Importar desde `plugin-sdk/test-fixtures` |
| `runProviderCatalog`                                 | Ejecutar un hook de catálogo de proveedor con dependencias de prueba |
| `resolveProviderWizardOptions`                       | Resolver opciones del asistente de configuración de proveedor en pruebas de contrato |
| `resolveProviderModelPickerEntries`                  | Resolver entradas del selector de modelos de proveedor en pruebas de contrato |
| `buildProviderPluginMethodChoice`                    | Construir id. de opciones del asistente de proveedor para afirmaciones |
| `setProviderWizardProvidersResolverForTest`          | Inyectar proveedores del asistente de proveedor para pruebas aisladas |
| `createProviderUsageFetch`                           | Crear datos de prueba de obtención de uso del proveedor                                                                                  |
| `useFrozenTime` / `useRealTime`                      | Congelar y restaurar temporizadores para pruebas sensibles al tiempo. Importar desde `plugin-sdk/test-env`                               |
| `createTestWizardPrompter`                           | Crear un solicitador simulado del asistente de configuración                                                                             |
| `createRuntimeTaskFlow`                              | Crear estado aislado de TaskFlow en tiempo de ejecución                                                                                  |
| `typedCases`                                         | Preservar tipos literales para pruebas basadas en tablas. Importar desde `plugin-sdk/test-fixtures`                                      |

Las suites de contrato de plugins incluidos también usan subrutas de pruebas del SDK para helpers de fixtures de solo prueba de registro, manifiesto, artefactos públicos y runtime. Las suites exclusivas del core que dependen del inventario incluido de OpenClaw permanecen en `src/plugins/contracts`. Mantén las nuevas pruebas de extensión en una subruta enfocada y documentada del SDK, como `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures`, en lugar de importar directamente el barrel amplio de compatibilidad `plugin-sdk/testing`, archivos `src/**` del repositorio o puentes `test/helpers/*` del repositorio.

### Tipos

Las subrutas enfocadas de pruebas también reexportan tipos útiles en archivos de prueba:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolución de objetivos en pruebas

Usa `installCommonResolveTargetErrorCases` para agregar casos de error estándar para la resolución de objetivos de canal:

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

## Patrones de pruebas

### Pruebas de contratos de registro

Las pruebas unitarias que pasan un mock `api` escrito a mano a `register(api)` no ejercitan las puertas de aceptación del cargador de OpenClaw. Agrega al menos una prueba de humo respaldada por el cargador para cada superficie de registro de la que dependa tu plugin, especialmente hooks y capacidades exclusivas como la memoria.

El cargador real hace fallar el registro del plugin cuando faltan metadatos requeridos o cuando un plugin llama a una API de capacidad que no posee. Por ejemplo, `api.registerHook(...)` requiere un nombre de hook, y `api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la entrada exportada declaren `kind: "memory"`.

### Pruebas de acceso a la configuración de runtime

Prefiere el mock compartido de runtime de plugin de `openclaw/plugin-sdk/channel-test-helpers` al probar plugins de canal incluidos. Sus mocks obsoletos `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)` lanzan errores por defecto para que las pruebas detecten el nuevo uso de API de compatibilidad. Sobrescribe esos mocks solo cuando la prueba cubra explícitamente comportamiento de compatibilidad heredado.

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

### Mocking del runtime de plugin

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

### Pruebas con stubs por instancia

Prefiere stubs por instancia antes que la mutación de prototipo:

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
pnpm test -- src/plugins/contracts/
```

Estas pruebas validan:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- La corrección de la forma del registro
- El cumplimiento del contrato de runtime

### Ejecución de pruebas con alcance limitado

Para un plugin específico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo para pruebas de contrato:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicación de lint (plugins dentro del repositorio)

`pnpm check` aplica tres reglas para plugins dentro del repositorio:

1. **Sin imports monolíticos desde la raíz** -- se rechaza el barrel raíz `openclaw/plugin-sdk`
2. **Sin imports directos de `src/`** -- los plugins no pueden importar directamente `../../src/`
3. **Sin autoimports** -- los plugins no pueden importar su propia subruta `plugin-sdk/<name>`

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos patrones.

## Configuración de pruebas

OpenClaw usa Vitest con umbrales de cobertura de V8. Para pruebas de plugins:

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
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de plugin de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de plugin de proveedor
- [Creación de plugins](/es/plugins/building-plugins) -- guía de primeros pasos
