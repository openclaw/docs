---
read_when:
    - Está escribiendo pruebas para un plugin
    - Necesita utilidades de prueba del SDK de plugins
    - Quieres comprender las pruebas de contrato de los plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para plugins de OpenClaw
title: Pruebas de plugins
x-i18n:
    generated_at: "2026-07-16T11:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades, patrones y aplicación de lint para las pruebas de los
plugins de OpenClaw.

<Tip>
  **¿Busca ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas completos:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas son puntos de entrada de código fuente locales del repositorio para las pruebas de los
plugins incluidos con OpenClaw. No son exportaciones `package.json` publicadas para
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

Use estas subrutas específicas para las pruebas de los plugins incluidos. El antiguo
barrel `openclaw/plugin-sdk/testing` era local del repositorio, estaba excluido de los
paquetes distribuidos y se ha eliminado. El alias heredado `openclaw/plugin-sdk/test-utils`
sigue siendo local del repositorio; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rechaza nuevas importaciones de ese alias
en pruebas de extensiones.

### Exportaciones disponibles

| Exportación                                               | Propósito                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crea un simulacro mínimo de la API de Plugin para pruebas unitarias de registro directo. Importa desde `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture compartida del contrato de perfiles de autenticación para adaptadores nativos del entorno de ejecución del agente. Importa desde `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture compartida del contrato de supresión de entrega para adaptadores nativos del entorno de ejecución del agente. Importa desde `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture compartida del contrato de clasificación de reserva para adaptadores nativos del entorno de ejecución del agente. Importa desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crea fixtures de esquemas de herramientas dinámicas para pruebas de contratos del entorno de ejecución nativo. Importa desde `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Verifica la estructura del contexto entrante del canal. Importa desde `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Instala casos del contrato de cargas útiles salientes del canal. Importa desde `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Crea contextos del ciclo de vida de las cuentas del canal. Importa desde `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Instala casos genéricos del contrato de acciones de mensajes del canal. Importa desde `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Instala casos genéricos del contrato de configuración del canal. Importa desde `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Instala casos genéricos del contrato de estado del canal. Importa desde `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Verifica los identificadores del directorio del canal mediante una función de listado del directorio. Importa desde `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Verifica que los puntos de entrada de los canales incluidos expongan el contrato público esperado. Importa desde `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Da formato a marcas de tiempo deterministas de sobres. Importa desde `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Verifica el texto de respuesta de emparejamiento del canal y extrae su código. Importa desde `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Instala comprobaciones del contrato de registro de plugins. Importa desde `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registra un plugin de proveedor en las pruebas básicas del cargador. Importa desde `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Captura todos los tipos de proveedores de un plugin. Importa desde `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Captura registros de proveedores de varios plugins. Importa desde `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Verifica que una colección de proveedores contenga un identificador. Importa desde `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Crea un entorno simulado de ejecución de CLI/plugins. Importa desde `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Crea una superficie simulada del entorno de ejecución de plugins. Importa desde `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Crea utilidades de estado de configuración para plugins de canal. Importa desde `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Crea un generador simulado de solicitudes para el asistente de configuración. Importa desde `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Crea un estado aislado de TaskFlow del entorno de ejecución. Importa desde `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Ejecuta un hook del catálogo de proveedores con dependencias de prueba. Importa desde `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Resuelve las opciones del asistente de configuración del proveedor en las pruebas de contratos. Importa desde `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Resuelve las entradas del selector de modelos del proveedor en las pruebas de contratos. Importa desde `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Crea identificadores de opciones del asistente del proveedor para las verificaciones. Importa desde `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Inyecta proveedores del asistente del proveedor para pruebas aisladas. Importa desde `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Instala comprobaciones del contrato del entorno de ejecución para familias de proveedores. Importa desde `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Verifica que las políticas de reproducción del proveedor transmitan las herramientas y los metadatos propiedad del proveedor. Importa desde `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Ejecuta una prueba en vivo de un proveedor de STT en tiempo real con fixtures de audio compartidas. Importa desde `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normaliza la salida de la transcripción en vivo antes de las verificaciones aproximadas. Importa desde `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Verifica que los proveedores de vídeo declaren capacidades explícitas del modo de generación. Importa desde `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Verifica que los proveedores de música declaren capacidades explícitas de generación y edición. Importa desde `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Instala una respuesta correcta de tarea de vídeo compatible con DashScope. Importa desde `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Accede a simulacros opcionales de HTTP/autenticación del proveedor en Vitest. Importa desde `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Restablece los simulacros de HTTP/autenticación del proveedor después de cada prueba. Importa desde `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para la gestión de errores de resolución de destinos. Importa desde `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Comprueba si un canal debe añadir una reacción de confirmación. Importa desde `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Elimina la reacción de confirmación después de entregar la respuesta. Importa desde `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Crea una fixture del registro de plugins de canal. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Crea una fixture de registro de plugins vacío. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Instala una fixture de registro para pruebas del entorno de ejecución de plugins. Importa desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Captura solicitudes fetch de JSON en pruebas de utilidades multimedia. Importa desde `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Ejecuta pruebas con un servidor HTTP local desechable. Importa desde `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Crea un objeto mínimo de solicitud HTTP entrante. Importa desde `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Ejecuta pruebas de fetch con hooks de preconexión instalados. Importa desde `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Modifica temporalmente variables de entorno. Importa desde `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixtures aisladas de pruebas del sistema de archivos. Importa desde `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Crea un simulacro mínimo de respuesta de servidor HTTP. Importa desde `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Crea fixtures de fetch del uso del proveedor. Importa desde `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Congela y restaura temporizadores para pruebas sensibles al tiempo. Importa desde `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Captura la salida del entorno de ejecución de la CLI en las pruebas. Importa desde `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importa un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importa desde `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Resuelve las rutas de fixtures de código fuente o distribución de plugins incluidos. Importa desde `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Instala simulacros específicos de módulos integrados de Node en Vitest. Importa desde `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Crea contextos de prueba del entorno aislado. Importa desde `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Escribe fixtures de Skills. Importa desde `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Crea fixtures de mensajes de transcripción del agente. Importa desde `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecciona y restablece fixtures de eventos del sistema. Importa desde `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanea la salida del terminal para las verificaciones. Importa desde `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Verifica la estructura de la salida fragmentada. Importa desde `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Conserva tipos literales para pruebas basadas en tablas. Importa desde `plugin-sdk/test-fixtures`                                                    |

Los conjuntos de pruebas de contratos de plugins incluidos también utilizan estas subrutas de pruebas del SDK para
las utilidades de fixtures de registro, manifiesto, artefactos públicos y entorno de ejecución exclusivas de las pruebas.
Los conjuntos exclusivos del núcleo que dependen del inventario de OpenClaw incluido permanecen en
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

## Pruebas de resolución de destinos

Use `installCommonResolveTargetErrorCases` para añadir casos de error estándar para la
resolución de destinos del canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("resolución de destinos de my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Lógica de resolución de destinos de su canal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Añada casos de prueba específicos del canal
  it("debería resolver destinos @username", () => {
    // ...
  });
});
```

## Patrones de prueba

### Pruebas de contratos de registro

Las pruebas unitarias que pasan un simulacro de `api` escrito manualmente a `register(api)` no
ejercitan las puertas de aceptación del cargador de OpenClaw. Añada al menos una
prueba de humo respaldada por el cargador para cada superficie de registro de la que dependa su plugin, especialmente
los hooks y las capacidades exclusivas, como la memoria.

El cargador real rechaza el registro del plugin cuando faltan los metadatos requeridos o
un plugin llama a una API de capacidad que no le pertenece. Por ejemplo,
`api.registerHook(...)` requiere un nombre de hook, y
`api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la
entrada exportada declare `kind: "memory"`.

### Pruebas de acceso a la configuración en tiempo de ejecución

Prefiera el simulacro compartido del entorno de ejecución del plugin de `openclaw/plugin-sdk/plugin-test-runtime`.
Sus simulacros `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)`
generan errores de forma predeterminada para que las pruebas detecten nuevos usos de las API
de compatibilidad obsoletas. Sobrescriba esos simulacros solo cuando la prueba cubra explícitamente
el comportamiento de compatibilidad heredada.

### Pruebas unitarias de un plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("debería resolver la cuenta desde la configuración", () => {
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

  it("debería inspeccionar la cuenta sin materializar secretos", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No se expone ningún valor de token
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Pruebas unitarias de un plugin de proveedor

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("debería resolver modelos dinámicos", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contexto
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("debería devolver el catálogo cuando la clave de API esté disponible", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contexto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simulación del entorno de ejecución del plugin

Para el código que usa `createPluginRuntimeStore`, simule el entorno de ejecución en las pruebas:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "entorno de ejecución de prueba no establecido",
});

// En la configuración de la prueba
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... otros simulacros
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... otros espacios de nombres
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Después de las pruebas
store.clearRuntime();
```

### Pruebas con stubs por instancia

Prefiera los stubs por instancia en lugar de modificar el prototipo:

```typescript
// Preferido: stub por instancia
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evite: modificación del prototipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contrato (plugins del repositorio)

Los plugins incluidos tienen pruebas de contrato que verifican la propiedad del registro:

```bash
pnpm test src/plugins/contracts/
```

Estas pruebas verifican:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- Corrección de la estructura de registro
- Cumplimiento del contrato del entorno de ejecución

### Ejecución de pruebas específicas

Para un plugin específico:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Solo para las pruebas de contrato:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicación del lint (plugins del repositorio)

`scripts/run-additional-boundary-checks.mjs` ejecuta un conjunto de comprobaciones de límites de importación de `lint:plugins:*`
en CI; cada una también puede ejecutarse de forma independiente en el entorno local:

| Comando                                                        | Garantiza                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Los plugins incluidos no pueden importar el barrel raíz monolítico `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Los archivos de extensión de producción no pueden importar directamente el árbol `src/**` del repositorio (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Los archivos de prueba de extensiones no pueden importar `plugin-sdk/test-utils` ni otros auxiliares de prueba exclusivos del núcleo. |

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos
patrones.

## Configuración de pruebas

OpenClaw usa Vitest 4 con informes informativos de cobertura de V8. Para las pruebas de plugins:

```bash
# Ejecutar todas las pruebas
pnpm test

# Ejecutar las pruebas de un plugin específico
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Ejecutar con un filtro de nombre de prueba específico
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Ejecutar con cobertura
pnpm test:coverage
```

Si las ejecuciones locales provocan presión de memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Temas relacionados

- [Descripción general del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de plugins de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de plugins de proveedor
- [Creación de plugins](/es/plugins/building-plugins) -- guía de introducción
