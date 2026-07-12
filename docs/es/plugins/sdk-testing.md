---
read_when:
    - Estás escribiendo pruebas para un plugin
    - Necesitas utilidades de prueba del SDK de plugins
    - Quieres comprender las pruebas de contrato de los plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para los plugins de OpenClaw
title: Pruebas de Plugins
x-i18n:
    generated_at: "2026-07-11T23:23:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades, patrones y aplicación de reglas de lint para las pruebas de
plugins de OpenClaw.

<Tip>
  **¿Busca ejemplos de pruebas?** Las guías prácticas incluyen ejemplos completos de pruebas:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas son puntos de entrada de código fuente locales del repositorio para las pruebas
de los plugins integrados de OpenClaw. No son exportaciones publicadas de `package.json` para
plugins de terceros y pueden importar Vitest u otras dependencias de prueba exclusivas del repositorio.

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

Para las nuevas pruebas de plugins integrados, use preferentemente estas subrutas específicas. El módulo de
reexportación general `openclaw/plugin-sdk/testing` y el alias `openclaw/plugin-sdk/test-utils`
son únicamente para compatibilidad heredada: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rechaza las nuevas importaciones de
cualquiera de ellos en los archivos de prueba de extensiones, y ambos se conservan exclusivamente para
pruebas que registran la compatibilidad.

### Exportaciones disponibles

| Exportación                                           | Propósito                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                 | Crea un simulacro mínimo de la API de Plugin para pruebas unitarias de registro directo. Importa desde `plugin-sdk/plugin-test-api`                                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                       | Fixture compartido del contrato de perfiles de autenticación para adaptadores nativos del entorno de ejecución del agente. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                  | Fixture compartido del contrato de supresión de entrega para adaptadores nativos del entorno de ejecución del agente. Importa desde `plugin-sdk/agent-runtime-test-contracts`   |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                   | Fixture compartido del contrato de clasificación de alternativas para adaptadores nativos del entorno de ejecución del agente. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                             | Crea fixtures de esquemas de herramientas dinámicas para pruebas de contratos del entorno de ejecución nativo. Importa desde `plugin-sdk/agent-runtime-test-contracts`         |
| `expectChannelInboundContextContract`                 | Verifica la estructura del contexto entrante del canal. Importa desde `plugin-sdk/channel-contract-testing`                                                                    |
| `installChannelOutboundPayloadContractSuite`          | Instala casos de contrato de carga útil saliente del canal. Importa desde `plugin-sdk/channel-contract-testing`                                                                 |
| `createStartAccountContext`                           | Crea contextos del ciclo de vida de cuentas de canal. Importa desde `plugin-sdk/channel-test-helpers`                                                                           |
| `installChannelActionsContractSuite`                  | Instala casos genéricos de contrato de acciones de mensajes del canal. Importa desde `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelSetupContractSuite`                    | Instala casos genéricos de contrato de configuración del canal. Importa desde `plugin-sdk/channel-test-helpers`                                                                 |
| `installChannelStatusContractSuite`                   | Instala casos genéricos de contrato de estado del canal. Importa desde `plugin-sdk/channel-test-helpers`                                                                        |
| `expectDirectoryIds`                                  | Verifica los identificadores del directorio del canal obtenidos mediante una función de listado de directorios. Importa desde `plugin-sdk/channel-test-helpers`                |
| `assertBundledChannelEntries`                         | Verifica que los puntos de entrada de los canales incluidos expongan el contrato público esperado. Importa desde `plugin-sdk/channel-test-helpers`                             |
| `formatEnvelopeTimestamp`                             | Formatea marcas de tiempo deterministas de sobres. Importa desde `plugin-sdk/channel-test-helpers`                                                                              |
| `expectPairingReplyText`                              | Verifica el texto de respuesta de vinculación del canal y extrae su código. Importa desde `plugin-sdk/channel-test-helpers`                                                     |
| `describePluginRegistrationContract`                  | Instala comprobaciones del contrato de registro del Plugin. Importa desde `plugin-sdk/plugin-test-contracts`                                                                    |
| `registerSingleProviderPlugin`                        | Registra un Plugin de proveedor en las pruebas rápidas del cargador. Importa desde `plugin-sdk/plugin-test-runtime`                                                             |
| `registerProviderPlugin`                              | Captura todos los tipos de proveedor de un Plugin. Importa desde `plugin-sdk/plugin-test-runtime`                                                                               |
| `registerProviderPlugins`                             | Captura registros de proveedores de varios plugins. Importa desde `plugin-sdk/plugin-test-runtime`                                                                              |
| `requireRegisteredProvider`                           | Verifica que una colección de proveedores contenga un identificador. Importa desde `plugin-sdk/plugin-test-runtime`                                                            |
| `createRuntimeEnv`                                    | Crea un entorno simulado de ejecución de la CLI o del Plugin. Importa desde `plugin-sdk/plugin-test-runtime`                                                                    |
| `createPluginRuntimeMock`                             | Crea una superficie simulada del entorno de ejecución del Plugin. Importa desde `plugin-sdk/plugin-test-runtime`                                                               |
| `createPluginSetupWizardStatus`                       | Crea utilidades de estado de configuración para plugins de canal. Importa desde `plugin-sdk/plugin-test-runtime`                                                               |
| `createTestWizardPrompter`                            | Crea un solicitador simulado para el asistente de configuración. Importa desde `plugin-sdk/plugin-test-runtime`                                                                |
| `createRuntimeTaskFlow`                               | Crea un estado aislado del flujo de tareas del entorno de ejecución. Importa desde `plugin-sdk/plugin-test-runtime`                                                             |
| `runProviderCatalog`                                  | Ejecuta un enlace del catálogo de proveedores con dependencias de prueba. Importa desde `plugin-sdk/plugin-test-runtime`                                                       |
| `resolveProviderWizardOptions`                        | Resuelve las opciones del asistente de configuración del proveedor en pruebas de contratos. Importa desde `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                   | Resuelve las entradas del selector de modelos del proveedor en pruebas de contratos. Importa desde `plugin-sdk/plugin-test-runtime`                                           |
| `buildProviderPluginMethodChoice`                     | Crea identificadores de opciones del asistente del proveedor para verificaciones. Importa desde `plugin-sdk/plugin-test-runtime`                                               |
| `setProviderWizardProvidersResolverForTest`           | Inyecta proveedores del asistente del proveedor para pruebas aisladas. Importa desde `plugin-sdk/plugin-test-runtime`                                                          |
| `describeOpenAIProviderRuntimeContract`               | Instala comprobaciones del contrato del entorno de ejecución de la familia de proveedores. Importa desde `plugin-sdk/provider-test-contracts`                                  |
| `expectPassthroughReplayPolicy`                       | Verifica que las políticas de reproducción del proveedor transmitan sin cambios las herramientas y los metadatos propios del proveedor. Importa desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                              | Ejecuta una prueba en vivo de un proveedor STT en tiempo real con fixtures de audio compartidos. Importa desde `plugin-sdk/provider-test-contracts`                            |
| `normalizeTranscriptForMatch`                         | Normaliza la salida de la transcripción en vivo antes de las verificaciones aproximadas. Importa desde `plugin-sdk/provider-test-contracts`                                    |
| `expectExplicitVideoGenerationCapabilities`           | Verifica que los proveedores de vídeo declaren capacidades explícitas del modo de generación. Importa desde `plugin-sdk/provider-test-contracts`                              |
| `expectExplicitMusicGenerationCapabilities`           | Verifica que los proveedores de música declaren capacidades explícitas de generación y edición. Importa desde `plugin-sdk/provider-test-contracts`                            |
| `mockSuccessfulDashscopeVideoTask`                    | Instala una respuesta correcta de una tarea de vídeo compatible con DashScope. Importa desde `plugin-sdk/provider-test-contracts`                                             |
| `getProviderHttpMocks`                                | Accede a simulacros opcionales de HTTP y autenticación del proveedor para Vitest. Importa desde `plugin-sdk/provider-http-test-mocks`                                          |
| `installProviderHttpMockCleanup`                      | Restablece los simulacros de HTTP y autenticación del proveedor después de cada prueba. Importa desde `plugin-sdk/provider-http-test-mocks`                                    |
| `installCommonResolveTargetErrorCases`                | Casos de prueba compartidos para gestionar errores de resolución de destinos. Importa desde `plugin-sdk/channel-target-testing`                                               |
| `shouldAckReaction`                                   | Comprueba si un canal debe añadir una reacción de acuse de recibo. Importa desde `plugin-sdk/channel-feedback`                                                                 |
| `removeAckReactionAfterReply`                         | Elimina la reacción de acuse de recibo después de entregar la respuesta. Importa desde `plugin-sdk/channel-feedback`                                                           |
| `createTestRegistry`                                  | Crea un fixture de registro de plugins de canal. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                                           |
| `createEmptyPluginRegistry`                           | Crea un fixture de registro de plugins vacío. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                                              |
| `setActivePluginRegistry`                             | Instala un fixture de registro para pruebas del entorno de ejecución de plugins. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`            |
| `createRequestCaptureJsonFetch`                       | Captura solicitudes de obtención de JSON en pruebas de utilidades multimedia. Importa desde `plugin-sdk/test-env`                                                             |
| `withServer`                                          | Ejecuta pruebas contra un servidor HTTP local desechable. Importa desde `plugin-sdk/test-env`                                                                                  |
| `createMockIncomingRequest`                           | Crea un objeto mínimo de solicitud HTTP entrante. Importa desde `plugin-sdk/test-env`                                                                                          |
| `withFetchPreconnect`                                 | Ejecuta pruebas de obtención con enlaces de preconexión instalados. Importa desde `plugin-sdk/test-env`                                                                        |
| `withEnv` / `withEnvAsync`                            | Modifica temporalmente variables de entorno. Importa desde `plugin-sdk/test-env`                                                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir`  | Crea fixtures aislados del sistema de archivos para pruebas. Importa desde `plugin-sdk/test-env`                                                                               |
| `createMockServerResponse`                            | Crea un simulacro mínimo de respuesta de servidor HTTP. Importa desde `plugin-sdk/test-env`                                                                                    |
| `createProviderUsageFetch`                            | Crea fixtures de obtención del uso del proveedor. Importa desde `plugin-sdk/test-env`                                                                                         |
| `useFrozenTime` / `useRealTime`                       | Congela y restaura los temporizadores para pruebas sensibles al tiempo. Importa desde `plugin-sdk/test-env`                                                                    |
| `createCliRuntimeCapture`                             | Captura la salida del entorno de ejecución de la CLI en pruebas. Importa desde `plugin-sdk/test-fixtures`                                                                      |
| `importFreshModule`                                   | Importa un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importa desde `plugin-sdk/test-fixtures`                                                 |
| `bundledPluginRoot` / `bundledPluginFile`             | Resuelve rutas de fixtures de código fuente o distribución de plugins incluidos. Importa desde `plugin-sdk/test-fixtures`                                                     |
| `mockNodeBuiltinModule`                               | Instala simulacros específicos de Vitest para módulos integrados de Node. Importa desde `plugin-sdk/test-node-mocks`                                                           |
| `createSandboxTestContext`                            | Crea contextos de prueba de espacio aislado. Importa desde `plugin-sdk/test-fixtures`                                                                                          |
| `writeSkill`                                         | Escribir datos de prueba de Skills. Importar desde `plugin-sdk/test-fixtures`                                                             |
| `makeAgentAssistantMessage`                          | Crear datos de prueba de mensajes de transcripción del agente. Importar desde `plugin-sdk/test-fixtures`                                 |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspeccionar y restablecer datos de prueba de eventos del sistema. Importar desde `plugin-sdk/test-fixtures`                              |
| `sanitizeTerminalText`                               | Sanear la salida del terminal para las aserciones. Importar desde `plugin-sdk/test-fixtures`                                              |
| `countLines` / `hasBalancedFences`                   | Verificar la estructura de la salida de fragmentación. Importar desde `plugin-sdk/test-fixtures`                                         |
| `typedCases`                                         | Conservar los tipos literales para las pruebas basadas en tablas. Importar desde `plugin-sdk/test-fixtures`                               |

Los conjuntos de contratos de plugins incluidos también usan estas subrutas de pruebas del SDK para
los auxiliares de registro, manifiesto, artefactos públicos y fixtures de tiempo de ejecución exclusivos de las pruebas.
En cambio, los conjuntos exclusivos del núcleo que dependen del inventario incluido de OpenClaw permanecen en
`src/plugins/contracts`.

### Tipos

Las subrutas de pruebas específicas también reexportan tipos útiles en los archivos de prueba:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolución de destinos en las pruebas

Usa `installCommonResolveTargetErrorCases` para añadir casos de error estándar para la
resolución de destinos del canal:

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

Las pruebas unitarias que pasan un simulacro de `api` escrito manualmente a `register(api)` no
ejercitan las puertas de aceptación del cargador de OpenClaw. Añade al menos una
prueba de humo respaldada por el cargador para cada superficie de registro de la que dependa tu plugin, especialmente
los hooks y las capacidades exclusivas, como la memoria.

El cargador real hace que falle el registro del plugin cuando faltan metadatos obligatorios o
un plugin llama a una API de capacidad que no le pertenece. Por ejemplo,
`api.registerHook(...)` requiere el nombre de un hook, y
`api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la entrada
exportada declare `kind: "memory"`.

### Pruebas del acceso a la configuración en tiempo de ejecución

Prefiere el simulacro compartido del tiempo de ejecución del plugin de `openclaw/plugin-sdk/plugin-test-runtime`.
Sus simulacros `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)`
lanzan errores de forma predeterminada para que las pruebas detecten nuevos usos de API de compatibilidad
obsoletas. Sobrescribe esos simulacros únicamente cuando la prueba cubra explícitamente
comportamientos de compatibilidad heredados.

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

### Simulación del tiempo de ejecución del plugin

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

### Pruebas con stubs por instancia

Prefiere los stubs por instancia en lugar de modificar el prototipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contratos (plugins del repositorio)

Los plugins incluidos tienen pruebas de contratos que verifican la propiedad del registro:

```bash
pnpm test src/plugins/contracts/
```

Estas pruebas verifican:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- La corrección de la estructura del registro
- El cumplimiento del contrato de tiempo de ejecución

### Ejecución de pruebas específicas

Para un plugin específico:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Solo para las pruebas de contratos:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicación del lint (plugins del repositorio)

`scripts/run-additional-boundary-checks.mjs` ejecuta en CI un conjunto de comprobaciones
de límites de importación `lint:plugins:*`; cada una también puede ejecutarse localmente de forma independiente:

| Comando                                                        | Impone                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Los plugins incluidos no pueden importar el barrel raíz monolítico `openclaw/plugin-sdk`.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Los archivos de extensiones de producción no pueden importar directamente el árbol `src/**` del repositorio (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Los archivos de prueba de extensiones no pueden importar `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` ni otros auxiliares de prueba exclusivos del núcleo. |

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos
patrones.

## Configuración de pruebas

OpenClaw usa Vitest 4 con informes informativos de cobertura de V8. Para las pruebas de plugins:

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

Si las ejecuciones locales provocan presión de memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Contenido relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de plugins de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de plugins de proveedor
- [Creación de plugins](/es/plugins/building-plugins) -- guía de introducción
