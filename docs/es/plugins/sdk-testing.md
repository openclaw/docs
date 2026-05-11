---
read_when:
    - Estás escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK de Plugin
    - Quieres entender las pruebas de contrato para los Plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para plugins de OpenClaw
title: Pruebas de Plugin
x-i18n:
    generated_at: "2026-05-11T20:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades, patrones y aplicación de lint para las pruebas de
plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas resueltos:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas de ayudantes de prueba son puntos de entrada de código fuente locales del repositorio para las pruebas de los propios plugins
incluidos de OpenClaw. No son exportaciones del paquete para plugins de terceros.

**Importación simulada de API de Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Importación de contrato de tiempo de ejecución de agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Importación de contrato de canal:** `openclaw/plugin-sdk/channel-contract-testing`

**Importación de ayudante de prueba de canal:** `openclaw/plugin-sdk/channel-test-helpers`

**Importación de prueba de destino de canal:** `openclaw/plugin-sdk/channel-target-testing`

**Importación de contrato de Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Importación de prueba de tiempo de ejecución de Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Importación de contrato de proveedor:** `openclaw/plugin-sdk/provider-test-contracts`

**Importación simulada de HTTP de proveedor:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Importación de prueba de entorno/red:** `openclaw/plugin-sdk/test-env`

**Importación de fixture genérico:** `openclaw/plugin-sdk/test-fixtures`

**Importación simulada de elemento integrado de Node:** `openclaw/plugin-sdk/test-node-mocks`

Prefiere las subrutas enfocadas que aparecen a continuación para las nuevas pruebas de plugins. El barrel amplio
`openclaw/plugin-sdk/testing` es solo compatibilidad heredada.
Las barreras del repositorio rechazan nuevas importaciones reales desde `plugin-sdk/testing` y
`plugin-sdk/test-utils`; esos nombres permanecen solo como superficies de compatibilidad obsoletas
para pruebas de registros de compatibilidad.

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

| Exportación                                          | Propósito                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Construye un mock mínimo de API de plugin para pruebas unitarias de registro directo. Importar desde `plugin-sdk/plugin-test-api`        |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture compartido de contrato de perfil de autenticación para adaptadores runtime de agentes nativos. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture compartido de contrato de supresión de entrega para adaptadores runtime de agentes nativos. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture compartido de contrato de clasificación de fallback para adaptadores runtime de agentes nativos. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Construye fixtures de esquemas de herramientas dinámicas para pruebas de contrato de runtime nativo. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Verifica la forma del contexto entrante del canal. Importar desde `plugin-sdk/channel-contract-testing`                                   |
| `installChannelOutboundPayloadContractSuite`         | Instala casos de contrato de payload saliente de canal. Importar desde `plugin-sdk/channel-contract-testing`                              |
| `createStartAccountContext`                          | Construye contextos de ciclo de vida de cuentas de canal. Importar desde `plugin-sdk/channel-test-helpers`                               |
| `installChannelActionsContractSuite`                 | Instala casos genéricos de contrato de acciones de mensaje de canal. Importar desde `plugin-sdk/channel-test-helpers`                    |
| `installChannelSetupContractSuite`                   | Instala casos genéricos de contrato de configuración de canal. Importar desde `plugin-sdk/channel-test-helpers`                          |
| `installChannelStatusContractSuite`                  | Instala casos genéricos de contrato de estado de canal. Importar desde `plugin-sdk/channel-test-helpers`                                 |
| `expectDirectoryIds`                                 | Verifica los ids del directorio de canal desde una función de listado de directorio. Importar desde `plugin-sdk/channel-test-helpers`     |
| `assertBundledChannelEntries`                        | Verifica que los puntos de entrada de canales incluidos expongan el contrato público esperado. Importar desde `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatea marcas de tiempo deterministas de sobres. Importar desde `plugin-sdk/channel-test-helpers`                                      |
| `expectPairingReplyText`                             | Verifica el texto de respuesta de emparejamiento del canal y extrae su código. Importar desde `plugin-sdk/channel-test-helpers`          |
| `describePluginRegistrationContract`                 | Instala comprobaciones del contrato de registro de plugins. Importar desde `plugin-sdk/plugin-test-contracts`                            |
| `registerSingleProviderPlugin`                       | Registra un plugin de proveedor en pruebas de humo del cargador. Importar desde `plugin-sdk/plugin-test-runtime`                         |
| `registerProviderPlugin`                             | Captura todos los tipos de proveedor de un plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                       |
| `registerProviderPlugins`                            | Captura registros de proveedores entre varios plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                   |
| `requireRegisteredProvider`                          | Verifica que una colección de proveedores contenga un id. Importar desde `plugin-sdk/plugin-test-runtime`                                |
| `createRuntimeEnv`                                   | Construye un entorno runtime simulado de CLI/plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                     |
| `createPluginSetupWizardStatus`                      | Construye helpers de estado de configuración para plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime`                     |
| `describeOpenAIProviderRuntimeContract`              | Instala comprobaciones de contrato de runtime de familia de proveedores. Importar desde `plugin-sdk/provider-test-contracts`             |
| `expectPassthroughReplayPolicy`                      | Verifica que las políticas de repetición del proveedor pasen herramientas y metadatos propiedad del proveedor. Importar desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Ejecuta una prueba en vivo de proveedor STT en tiempo real con fixtures de audio compartidos. Importar desde `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normaliza la salida de transcripción en vivo antes de aserciones aproximadas. Importar desde `plugin-sdk/provider-test-contracts`        |
| `expectExplicitVideoGenerationCapabilities`          | Verifica que los proveedores de video declaren capacidades explícitas de modo de generación. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Verifica que los proveedores de música declaren capacidades explícitas de generación/edición. Importar desde `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instala una respuesta exitosa de tarea de video compatible con DashScope. Importar desde `plugin-sdk/provider-test-contracts`            |
| `getProviderHttpMocks`                               | Accede a mocks Vitest opcionales de HTTP/autenticación de proveedor. Importar desde `plugin-sdk/provider-http-test-mocks`                |
| `installProviderHttpMockCleanup`                     | Restablece mocks de HTTP/autenticación de proveedor después de cada prueba. Importar desde `plugin-sdk/provider-http-test-mocks`         |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para el manejo de errores de resolución de destino. Importar desde `plugin-sdk/channel-target-testing`       |
| `shouldAckReaction`                                  | Comprueba si un canal debe agregar una reacción de confirmación. Importar desde `plugin-sdk/channel-feedback`                            |
| `removeAckReactionAfterReply`                        | Elimina la reacción de confirmación después de entregar la respuesta. Importar desde `plugin-sdk/channel-feedback`                       |
| `createTestRegistry`                                 | Construye un fixture de registro de plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createEmptyPluginRegistry`                          | Construye un fixture de registro de plugins vacío. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`   |
| `setActivePluginRegistry`                            | Instala un fixture de registro para pruebas de runtime de plugins. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Captura solicitudes fetch JSON en pruebas de helpers de medios. Importar desde `plugin-sdk/test-env`                                     |
| `withServer`                                         | Ejecuta pruebas contra un servidor HTTP local desechable. Importar desde `plugin-sdk/test-env`                                           |
| `createMockIncomingRequest`                          | Construye un objeto mínimo de solicitud HTTP entrante. Importar desde `plugin-sdk/test-env`                                              |
| `withFetchPreconnect`                                | Ejecuta pruebas de fetch con hooks de preconexión instalados. Importar desde `plugin-sdk/test-env`                                      |
| `withEnv` / `withEnvAsync`                           | Parchea temporalmente variables de entorno. Importar desde `plugin-sdk/test-env`                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixtures de prueba de sistema de archivos aislados. Importar desde `plugin-sdk/test-env`                                           |
| `createMockServerResponse`                           | Crea un mock mínimo de respuesta de servidor HTTP. Importar desde `plugin-sdk/test-env`                                                  |
| `createCliRuntimeCapture`                            | Captura la salida del runtime de CLI en pruebas. Importar desde `plugin-sdk/test-fixtures`                                               |
| `importFreshModule`                                  | Importa un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importar desde `plugin-sdk/test-fixtures`         |
| `bundledPluginRoot` / `bundledPluginFile`            | Resuelve rutas de fixtures de código fuente o dist de plugins incluidos. Importar desde `plugin-sdk/test-fixtures`                      |
| `mockNodeBuiltinModule`                              | Instala mocks Vitest acotados de módulos integrados de Node. Importar desde `plugin-sdk/test-node-mocks`                                |
| `createSandboxTestContext`                           | Construye contextos de prueba de sandbox. Importar desde `plugin-sdk/test-fixtures`                                                      |
| `writeSkill`                                         | Escribe fixtures de skill. Importar desde `plugin-sdk/test-fixtures`                                                                     |
| `makeAgentAssistantMessage`                          | Construye fixtures de mensajes de transcripción de agente. Importar desde `plugin-sdk/test-fixtures`                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecciona y restablece fixtures de eventos del sistema. Importar desde `plugin-sdk/test-fixtures`                                     |
| `sanitizeTerminalText`                               | Sanitiza la salida de terminal para aserciones. Importar desde `plugin-sdk/test-fixtures`                                                |
| `countLines` / `hasBalancedFences`                   | Verifica la forma de la salida de fragmentación. Importar desde `plugin-sdk/test-fixtures`                                               |
| `runProviderCatalog`                                 | Ejecuta un hook de catálogo de proveedor con dependencias de prueba                                                                      |
| `resolveProviderWizardOptions`                       | Resuelve opciones del asistente de configuración de proveedor en pruebas de contrato                                                     |
| `resolveProviderModelPickerEntries`                  | Resuelve entradas del selector de modelos de proveedor en pruebas de contrato                                                            |
| `buildProviderPluginMethodChoice`                    | Construye ids de opciones del asistente de proveedor para aserciones                                                                     |
| `setProviderWizardProvidersResolverForTest`          | Inyecta proveedores del asistente de proveedor para pruebas aisladas                                                                     |
| `createProviderUsageFetch`                           | Crear fixtures para obtener el uso del proveedor                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Congelar y restaurar temporizadores para pruebas sensibles al tiempo. Importar desde `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Crear un prompter simulado del asistente de configuración                                                                                                     |
| `createRuntimeTaskFlow`                              | Crear un estado aislado del flujo de tareas en tiempo de ejecución                                                                                                  |
| `typedCases`                                         | Preservar tipos literales para pruebas basadas en tablas. Importar desde `plugin-sdk/test-fixtures`                                                    |

Las suites de contratos de plugins incluidos también usan subrutas de prueba del SDK para
helpers de registro, manifiesto, artefactos públicos y fixtures de tiempo de ejecución solo para pruebas. Las
suites exclusivas del núcleo que dependen del inventario incluido de OpenClaw permanecen en `src/plugins/contracts`.
Mantén las nuevas pruebas de extensiones en una subruta enfocada y documentada del SDK, como
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` o `plugin-sdk/test-fixtures`, en lugar de importar directamente el
barrel amplio de compatibilidad `plugin-sdk/testing`, archivos `src/**` del repositorio o puentes
`test/helpers/*` del repositorio.

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

## Prueba de resolución de destino

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

Las pruebas unitarias que pasan un mock de `api` escrito a mano a `register(api)` no ejercitan
las puertas de aceptación del cargador de OpenClaw. Agrega al menos una prueba de humo respaldada por el cargador
para cada superficie de registro de la que dependa tu plugin, especialmente hooks y
capacidades exclusivas como memoria.

El cargador real falla el registro del plugin cuando faltan metadatos requeridos o un
plugin llama a una API de capacidad que no posee. Por ejemplo,
`api.registerHook(...)` requiere un nombre de hook, y
`api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la entrada
exportada declaren `kind: "memory"`.

### Probar el acceso a la configuración de tiempo de ejecución

Prefiere el mock compartido de tiempo de ejecución de plugin de `openclaw/plugin-sdk/channel-test-helpers`
al probar plugins de canal incluidos. Sus mocks obsoletos `runtime.config.loadConfig()` y
`runtime.config.writeConfigFile(...)` lanzan errores por defecto para que las pruebas detecten nuevo
uso de API de compatibilidad. Sobrescribe esos mocks solo cuando la prueba cubra
explícitamente comportamiento de compatibilidad heredado.

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

### Simular el tiempo de ejecución del plugin

Para el código que usa `createPluginRuntimeStore`, simula el tiempo de ejecución en las pruebas:

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
pnpm test -- src/plugins/contracts/
```

Estas pruebas afirman:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- Corrección de la forma del registro
- Cumplimiento del contrato de tiempo de ejecución

### Ejecutar pruebas con alcance

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

Tres reglas son aplicadas por `pnpm check` para plugins dentro del repositorio:

1. **Sin importaciones monolíticas desde la raíz** -- se rechaza el barrel raíz `openclaw/plugin-sdk`
2. **Sin importaciones directas de `src/`** -- los plugins no pueden importar directamente `../../src/`
3. **Sin autoimportaciones** -- los plugins no pueden importar su propia subruta `plugin-sdk/<name>`

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos
patrones.

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
- [Crear plugins](/es/plugins/building-plugins) -- guía de primeros pasos
