---
read_when:
    - Estás escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK de Plugin
    - Quieres entender las pruebas de contrato para plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para plugins de OpenClaw
title: Pruebas de Plugin
x-i18n:
    generated_at: "2026-06-27T12:31:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades de prueba, patrones y aplicación de lint para plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas resueltos:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas auxiliares de prueba son puntos de entrada de código fuente locales del repositorio para las propias pruebas de plugins incluidos de OpenClaw. No son exportaciones de paquete para plugins de terceros y pueden importar Vitest u otras dependencias de prueba exclusivas del repositorio.

**Importación del mock de la API de Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Importación del contrato del runtime de agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Importación del contrato de canal:** `openclaw/plugin-sdk/channel-contract-testing`

**Importación del helper de prueba de canal:** `openclaw/plugin-sdk/channel-test-helpers`

**Importación de prueba de destino de canal:** `openclaw/plugin-sdk/channel-target-testing`

**Importación del contrato de Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Importación de prueba del runtime de Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Importación del contrato de proveedor:** `openclaw/plugin-sdk/provider-test-contracts`

**Importación del mock HTTP de proveedor:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Importación de prueba de entorno/red:** `openclaw/plugin-sdk/test-env`

**Importación de fixture genérico:** `openclaw/plugin-sdk/test-fixtures`

**Importación del mock integrado de Node:** `openclaw/plugin-sdk/test-node-mocks`

Dentro del repositorio de OpenClaw, prefiere las subrutas específicas siguientes para nuevas pruebas de plugins incluidos. El barrel amplio `openclaw/plugin-sdk/testing` es solo compatibilidad heredada. Las barreras del repositorio rechazan nuevas importaciones reales desde `plugin-sdk/testing` y `plugin-sdk/test-utils`; esos nombres permanecen solo como superficies de compatibilidad obsoletas para pruebas de registro de compatibilidad.

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

| Exportación                                          | Propósito                                                                                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crear una simulación mínima de API de Plugin para pruebas unitarias de registro directo. Importar desde `plugin-sdk/plugin-test-api`     |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture de contrato compartido de perfil de autenticación para adaptadores nativos de entorno de ejecución de agente. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture de contrato compartido de supresión de entrega para adaptadores nativos de entorno de ejecución de agente. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture de contrato compartido de clasificación de respaldo para adaptadores nativos de entorno de ejecución de agente. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crear fixtures de esquema de herramienta dinámica para pruebas de contrato de entorno de ejecución nativo. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Comprobar la forma del contexto entrante del canal. Importar desde `plugin-sdk/channel-contract-testing`                                 |
| `installChannelOutboundPayloadContractSuite`         | Instalar casos de contrato de carga útil saliente del canal. Importar desde `plugin-sdk/channel-contract-testing`                        |
| `createStartAccountContext`                          | Crear contextos de ciclo de vida de cuentas de canal. Importar desde `plugin-sdk/channel-test-helpers`                                   |
| `installChannelActionsContractSuite`                 | Instalar casos genéricos de contrato de acciones de mensaje de canal. Importar desde `plugin-sdk/channel-test-helpers`                   |
| `installChannelSetupContractSuite`                   | Instalar casos genéricos de contrato de configuración de canal. Importar desde `plugin-sdk/channel-test-helpers`                         |
| `installChannelStatusContractSuite`                  | Instalar casos genéricos de contrato de estado de canal. Importar desde `plugin-sdk/channel-test-helpers`                                |
| `expectDirectoryIds`                                 | Comprobar los ids de directorio del canal desde una función de lista de directorios. Importar desde `plugin-sdk/channel-test-helpers`    |
| `assertBundledChannelEntries`                        | Comprobar que los puntos de entrada de canales incluidos expongan el contrato público esperado. Importar desde `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatear marcas de tiempo deterministas de envoltorio. Importar desde `plugin-sdk/channel-test-helpers`                                 |
| `expectPairingReplyText`                             | Comprobar el texto de respuesta de emparejamiento del canal y extraer su código. Importar desde `plugin-sdk/channel-test-helpers`        |
| `describePluginRegistrationContract`                 | Instalar comprobaciones de contrato de registro de Plugin. Importar desde `plugin-sdk/plugin-test-contracts`                             |
| `registerSingleProviderPlugin`                       | Registrar un Plugin de proveedor en pruebas rápidas del cargador. Importar desde `plugin-sdk/plugin-test-runtime`                        |
| `registerProviderPlugin`                             | Capturar todos los tipos de proveedor desde un Plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                   |
| `registerProviderPlugins`                            | Capturar registros de proveedores entre varios Plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                  |
| `requireRegisteredProvider`                          | Comprobar que una colección de proveedores contenga un id. Importar desde `plugin-sdk/plugin-test-runtime`                               |
| `createRuntimeEnv`                                   | Crear un entorno de ejecución simulado de CLI/Plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                    |
| `createPluginSetupWizardStatus`                      | Crear helpers de estado de configuración para Plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime`                          |
| `describeOpenAIProviderRuntimeContract`              | Instalar comprobaciones de contrato de entorno de ejecución de familia de proveedores. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectPassthroughReplayPolicy`                      | Comprobar que las políticas de reproducción del proveedor dejen pasar herramientas y metadatos propiedad del proveedor. Importar desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Ejecutar una prueba en vivo de proveedor STT en tiempo real con fixtures de audio compartidos. Importar desde `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normalizar la salida de transcripción en vivo antes de aserciones difusas. Importar desde `plugin-sdk/provider-test-contracts`           |
| `expectExplicitVideoGenerationCapabilities`          | Comprobar que los proveedores de video declaren capacidades explícitas de modo de generación. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Comprobar que los proveedores de música declaren capacidades explícitas de generación/edición. Importar desde `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instalar una respuesta correcta de tarea de video compatible con DashScope. Importar desde `plugin-sdk/provider-test-contracts`          |
| `getProviderHttpMocks`                               | Acceder a simulaciones opcionales de HTTP/autenticación de proveedor de Vitest. Importar desde `plugin-sdk/provider-http-test-mocks`     |
| `installProviderHttpMockCleanup`                     | Restablecer simulaciones de HTTP/autenticación de proveedor después de cada prueba. Importar desde `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para el manejo de errores de resolución de destino. Importar desde `plugin-sdk/channel-target-testing`       |
| `shouldAckReaction`                                  | Comprobar si un canal debe agregar una reacción de confirmación. Importar desde `plugin-sdk/channel-feedback`                            |
| `removeAckReactionAfterReply`                        | Quitar la reacción de confirmación después de entregar la respuesta. Importar desde `plugin-sdk/channel-feedback`                        |
| `createTestRegistry`                                 | Crear un fixture de registro de Plugin de canal. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`     |
| `createEmptyPluginRegistry`                          | Crear un fixture de registro de Plugins vacío. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`       |
| `setActivePluginRegistry`                            | Instalar un fixture de registro para pruebas de entorno de ejecución de Plugin. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Capturar solicitudes fetch de JSON en pruebas de helpers de medios. Importar desde `plugin-sdk/test-env`                                 |
| `withServer`                                         | Ejecutar pruebas contra un servidor HTTP local desechable. Importar desde `plugin-sdk/test-env`                                         |
| `createMockIncomingRequest`                          | Crear un objeto mínimo de solicitud HTTP entrante. Importar desde `plugin-sdk/test-env`                                                  |
| `withFetchPreconnect`                                | Ejecutar pruebas fetch con hooks de preconexión instalados. Importar desde `plugin-sdk/test-env`                                        |
| `withEnv` / `withEnvAsync`                           | Parchear temporalmente variables de entorno. Importar desde `plugin-sdk/test-env`                                                       |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crear fixtures de prueba de sistema de archivos aislados. Importar desde `plugin-sdk/test-env`                                          |
| `createMockServerResponse`                           | Crear una simulación mínima de respuesta de servidor HTTP. Importar desde `plugin-sdk/test-env`                                         |
| `createCliRuntimeCapture`                            | Capturar la salida del entorno de ejecución de CLI en pruebas. Importar desde `plugin-sdk/test-fixtures`                                |
| `importFreshModule`                                  | Importar un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importar desde `plugin-sdk/test-fixtures`        |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolver rutas de fixtures de código fuente o distribución de Plugin incluido. Importar desde `plugin-sdk/test-fixtures`                |
| `mockNodeBuiltinModule`                              | Instalar simulaciones estrechas de Vitest para módulos integrados de Node. Importar desde `plugin-sdk/test-node-mocks`                  |
| `createSandboxTestContext`                           | Crear contextos de prueba de sandbox. Importar desde `plugin-sdk/test-fixtures`                                                         |
| `writeSkill`                                         | Escribir fixtures de skill. Importar desde `plugin-sdk/test-fixtures`                                                                   |
| `makeAgentAssistantMessage`                          | Crear fixtures de mensajes de transcripción de agente. Importar desde `plugin-sdk/test-fixtures`                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspeccionar y restablecer fixtures de eventos del sistema. Importar desde `plugin-sdk/test-fixtures`                                   |
| `sanitizeTerminalText`                               | Sanitizar la salida de terminal para aserciones. Importar desde `plugin-sdk/test-fixtures`                                              |
| `countLines` / `hasBalancedFences`                   | Comprobar la forma de salida de fragmentación. Importar desde `plugin-sdk/test-fixtures`                                                |
| `runProviderCatalog`                                 | Ejecutar un hook de catálogo de proveedores con dependencias de prueba                                                                   |
| `resolveProviderWizardOptions`                       | Resolver opciones del asistente de configuración de proveedor en pruebas de contrato                                                    |
| `resolveProviderModelPickerEntries`                  | Resolver entradas del selector de modelos de proveedor en pruebas de contrato                                                            |
| `buildProviderPluginMethodChoice`                    | Crear ids de opciones del asistente de proveedor para aserciones                                                                         |
| `setProviderWizardProvidersResolverForTest`          | Inyectar proveedores del asistente de proveedor para pruebas aisladas                                                                    |
| `createProviderUsageFetch`                           | Crear fixtures de obtención de uso del proveedor                                                                                         |
| `useFrozenTime` / `useRealTime`                      | Congelar y restaurar temporizadores para pruebas sensibles al tiempo. Importar desde `plugin-sdk/test-env`                               |
| `createTestWizardPrompter`                           | Crear un prompter simulado para el asistente de configuración                                                                            |
| `createRuntimeTaskFlow`                              | Crear estado aislado de flujo de tareas de runtime                                                                                       |
| `typedCases`                                         | Preservar tipos literales para pruebas basadas en tablas. Importar desde `plugin-sdk/test-fixtures`                                      |

Las suites de contrato de Plugins incluidos también usan subrutas de pruebas del SDK para helpers de fixtures de registro, manifiesto, artefacto público y runtime que son solo para pruebas. Las suites exclusivas de core que dependen del inventario incluido de OpenClaw permanecen bajo `src/plugins/contracts`. Mantén las nuevas pruebas de extensiones en una subruta enfocada y documentada del SDK, como `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures`, en lugar de importar directamente el barrel amplio de compatibilidad `plugin-sdk/testing`, archivos `src/**` del repositorio o puentes `test/helpers/*` del repositorio.

### Tipos

Las subrutas de pruebas enfocadas también reexportan tipos útiles en archivos de prueba:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Pruebas de resolución de destino

Usa `installCommonResolveTargetErrorCases` para agregar casos de error estándar para la resolución de destinos de canal:

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

### Pruebas de contratos de registro

Las pruebas unitarias que pasan un mock `api` escrito a mano a `register(api)` no ejercitan las puertas de aceptación del cargador de OpenClaw. Agrega al menos una prueba de humo respaldada por el cargador para cada superficie de registro de la que dependa tu Plugin, especialmente hooks y capacidades exclusivas como memoria.

El cargador real falla el registro del Plugin cuando faltan metadatos requeridos o cuando un Plugin llama a una API de capacidad que no le pertenece. Por ejemplo, `api.registerHook(...)` requiere un nombre de hook, y `api.registerMemoryCapability(...)` requiere que el manifiesto del Plugin o la entrada exportada declare `kind: "memory"`.

### Pruebas de acceso a la configuración en runtime

Prefiere el mock compartido de runtime de Plugin de `openclaw/plugin-sdk/channel-test-helpers` al probar Plugins de canal incluidos. Sus mocks obsoletos `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)` lanzan errores de forma predeterminada para que las pruebas detecten nuevos usos de las APIs de compatibilidad. Sobrescribe esos mocks solo cuando la prueba cubra explícitamente comportamiento de compatibilidad heredada.

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

### Simulación del runtime del Plugin

Para el código que usa `createPluginRuntimeStore`, simula el runtime en las pruebas:

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

Prefiere stubs por instancia en lugar de mutación de prototipos:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contrato (Plugins en el repositorio)

Los Plugins incluidos tienen pruebas de contrato que verifican la propiedad del registro:

```bash
pnpm test -- src/plugins/contracts/
```

Estas pruebas verifican:

- Qué Plugins registran qué proveedores
- Qué Plugins registran qué proveedores de voz
- Corrección de la forma del registro
- Cumplimiento del contrato de runtime

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

## Aplicación de lint (Plugins en el repositorio)

`pnpm check` aplica tres reglas para Plugins en el repositorio:

1. **Sin importaciones monolíticas desde la raíz** -- se rechaza el barrel raíz `openclaw/plugin-sdk`
2. **Sin importaciones directas de `src/`** -- los Plugins no pueden importar `../../src/` directamente
3. **Sin autoimportaciones** -- los Plugins no pueden importar su propia subruta `plugin-sdk/<name>`

Los Plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos patrones.

## Configuración de pruebas

OpenClaw usa Vitest con umbrales de cobertura de V8. Para pruebas de Plugins:

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

- [Resumen del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de Plugin de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de Plugin de proveedor
- [Crear Plugins](/es/plugins/building-plugins) -- guía de introducción
