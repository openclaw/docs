---
read_when:
    - Estás escribiendo pruebas para un plugin
    - Necesitas utilidades de prueba del SDK de plugins
    - Quieres comprender las pruebas de contrato de los plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para plugins de OpenClaw
title: Pruebas de plugins
x-i18n:
    generated_at: "2026-07-12T14:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades, patrones y aplicación de lint para las pruebas de
plugins de OpenClaw.

<Tip>
  **¿Busca ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas completos:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas son puntos de entrada de código fuente locales del repositorio para las pruebas de
plugins incluidos en OpenClaw. No son exportaciones publicadas de `package.json` para
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

Se deben preferir estas subrutas específicas para las nuevas pruebas de plugins incluidos. El barrel general
`openclaw/plugin-sdk/testing` y el alias `openclaw/plugin-sdk/test-utils`
son únicamente para compatibilidad heredada: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rechaza las nuevas importaciones de
cualquiera de ellos desde archivos de prueba de extensiones, y ambos se mantienen exclusivamente para
pruebas de registro de compatibilidad.

### Exportaciones disponibles

| Exportación                                          | Propósito                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                | Crear un simulacro mínimo de la API de plugins para pruebas unitarias de registro directo. Importar desde `plugin-sdk/plugin-test-api`                  |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture de contrato compartido de perfiles de autenticación para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture de contrato compartido de supresión de entrega para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture de contrato compartido de clasificación de respaldo para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crear fixtures de esquemas de herramientas dinámicas para pruebas de contratos del entorno de ejecución nativo. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Comprobar la forma del contexto de entrada del canal. Importar desde `plugin-sdk/channel-contract-testing`                              |
| `installChannelOutboundPayloadContractSuite`         | Instalar casos de contrato de carga útil de salida del canal. Importar desde `plugin-sdk/channel-contract-testing`                       |
| `createStartAccountContext`                          | Crear contextos del ciclo de vida de cuentas de canal. Importar desde `plugin-sdk/channel-test-helpers`                                 |
| `installChannelActionsContractSuite`                 | Instalar casos de contrato genéricos de acciones sobre mensajes del canal. Importar desde `plugin-sdk/channel-test-helpers`              |
| `installChannelSetupContractSuite`                   | Instalar casos de contrato genéricos de configuración del canal. Importar desde `plugin-sdk/channel-test-helpers`                        |
| `installChannelStatusContractSuite`                  | Instalar casos de contrato genéricos de estado del canal. Importar desde `plugin-sdk/channel-test-helpers`                               |
| `expectDirectoryIds`                                 | Comprobar los identificadores del directorio del canal obtenidos mediante una función de listado de directorios. Importar desde `plugin-sdk/channel-test-helpers` |
| `assertBundledChannelEntries`                        | Comprobar que los puntos de entrada de los canales incluidos expongan el contrato público esperado. Importar desde `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatear marcas de tiempo deterministas de sobres. Importar desde `plugin-sdk/channel-test-helpers`                                     |
| `expectPairingReplyText`                             | Comprobar el texto de respuesta de emparejamiento del canal y extraer su código. Importar desde `plugin-sdk/channel-test-helpers`        |
| `describePluginRegistrationContract`                 | Instalar comprobaciones del contrato de registro de plugins. Importar desde `plugin-sdk/plugin-test-contracts`                           |
| `registerSingleProviderPlugin`                       | Registrar un Plugin de proveedor en las pruebas de humo del cargador. Importar desde `plugin-sdk/plugin-test-runtime`                    |
| `registerProviderPlugin`                             | Capturar todos los tipos de proveedor de un Plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                      |
| `registerProviderPlugins`                            | Capturar registros de proveedores de varios plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                    |
| `requireRegisteredProvider`                          | Comprobar que una colección de proveedores contenga un identificador. Importar desde `plugin-sdk/plugin-test-runtime`                    |
| `createRuntimeEnv`                                   | Crear un entorno simulado de ejecución de CLI/plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                   |
| `createPluginRuntimeMock`                            | Crear una superficie simulada del entorno de ejecución de plugins. Importar desde `plugin-sdk/plugin-test-runtime`                       |
| `createPluginSetupWizardStatus`                      | Crear utilidades de estado de configuración para plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime`                       |
| `createTestWizardPrompter`                           | Crear un solicitante simulado para el asistente de configuración. Importar desde `plugin-sdk/plugin-test-runtime`                        |
| `createRuntimeTaskFlow`                              | Crear un estado aislado del flujo de tareas del entorno de ejecución. Importar desde `plugin-sdk/plugin-test-runtime`                    |
| `runProviderCatalog`                                 | Ejecutar un enlace del catálogo de proveedores con dependencias de prueba. Importar desde `plugin-sdk/plugin-test-runtime`               |
| `resolveProviderWizardOptions`                       | Resolver las opciones del asistente de configuración de proveedores en pruebas de contratos. Importar desde `plugin-sdk/plugin-test-runtime` |
| `resolveProviderModelPickerEntries`                  | Resolver las entradas del selector de modelos del proveedor en pruebas de contratos. Importar desde `plugin-sdk/plugin-test-runtime`    |
| `buildProviderPluginMethodChoice`                    | Crear identificadores de opciones del asistente de proveedores para las comprobaciones. Importar desde `plugin-sdk/plugin-test-runtime` |
| `setProviderWizardProvidersResolverForTest`          | Inyectar proveedores del asistente de proveedores para pruebas aisladas. Importar desde `plugin-sdk/plugin-test-runtime`                 |
| `describeOpenAIProviderRuntimeContract`              | Instalar comprobaciones del contrato del entorno de ejecución de la familia de proveedores. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectPassthroughReplayPolicy`                      | Comprobar que las políticas de reproducción del proveedor transmitan sin cambios las herramientas y los metadatos propiedad del proveedor. Importar desde `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Ejecutar una prueba en vivo de un proveedor de STT en tiempo real con fixtures de audio compartidos. Importar desde `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normalizar la salida de la transcripción en vivo antes de las comprobaciones aproximadas. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitVideoGenerationCapabilities`          | Comprobar que los proveedores de vídeo declaren capacidades explícitas del modo de generación. Importar desde `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Comprobar que los proveedores de música declaren capacidades explícitas de generación y edición. Importar desde `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instalar una respuesta correcta de una tarea de vídeo compatible con DashScope. Importar desde `plugin-sdk/provider-test-contracts`     |
| `getProviderHttpMocks`                               | Acceder a simulacros opcionales de HTTP/autenticación de proveedores para Vitest. Importar desde `plugin-sdk/provider-http-test-mocks`   |
| `installProviderHttpMockCleanup`                     | Restablecer los simulacros de HTTP/autenticación de proveedores después de cada prueba. Importar desde `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para el tratamiento de errores de resolución de destinos. Importar desde `plugin-sdk/channel-target-testing` |
| `shouldAckReaction`                                  | Comprobar si un canal debe añadir una reacción de confirmación. Importar desde `plugin-sdk/channel-feedback`                             |
| `removeAckReactionAfterReply`                        | Eliminar la reacción de confirmación después de entregar la respuesta. Importar desde `plugin-sdk/channel-feedback`                      |
| `createTestRegistry`                                 | Crear un fixture de registro de plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`    |
| `createEmptyPluginRegistry`                          | Crear un fixture de registro de plugins vacío. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`       |
| `setActivePluginRegistry`                            | Instalar un fixture de registro para pruebas del entorno de ejecución de plugins. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Capturar solicitudes de obtención JSON en pruebas de utilidades multimedia. Importar desde `plugin-sdk/test-env`                        |
| `withServer`                                         | Ejecutar pruebas en un servidor HTTP local desechable. Importar desde `plugin-sdk/test-env`                                              |
| `createMockIncomingRequest`                          | Crear un objeto mínimo de solicitud HTTP entrante. Importar desde `plugin-sdk/test-env`                                                  |
| `withFetchPreconnect`                                | Ejecutar pruebas de obtención con enlaces de preconexión instalados. Importar desde `plugin-sdk/test-env`                               |
| `withEnv` / `withEnvAsync`                           | Modificar temporalmente las variables de entorno. Importar desde `plugin-sdk/test-env`                                                   |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crear fixtures aislados del sistema de archivos para pruebas. Importar desde `plugin-sdk/test-env`                                      |
| `createMockServerResponse`                           | Crear un simulacro mínimo de respuesta de servidor HTTP. Importar desde `plugin-sdk/test-env`                                            |
| `createProviderUsageFetch`                           | Crear fixtures de obtención del uso del proveedor. Importar desde `plugin-sdk/test-env`                                                  |
| `useFrozenTime` / `useRealTime`                      | Congelar y restaurar temporizadores para pruebas sensibles al tiempo. Importar desde `plugin-sdk/test-env`                              |
| `createCliRuntimeCapture`                            | Capturar la salida del entorno de ejecución de la CLI en las pruebas. Importar desde `plugin-sdk/test-fixtures`                          |
| `importFreshModule`                                  | Importar un módulo ESM con un token de consulta nuevo para eludir la caché de módulos. Importar desde `plugin-sdk/test-fixtures`         |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolver rutas de fixtures del código fuente o la distribución de plugins incluidos. Importar desde `plugin-sdk/test-fixtures`          |
| `mockNodeBuiltinModule`                              | Instalar simulacros específicos de Vitest para módulos integrados de Node. Importar desde `plugin-sdk/test-node-mocks`                   |
| `createSandboxTestContext`                           | Crear contextos de prueba del entorno aislado. Importar desde `plugin-sdk/test-fixtures`                                                  |
| `writeSkill`                                         | Escribe fixtures de skills. Importar desde `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Crea fixtures de mensajes de transcripción del agente. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecciona y restablece fixtures de eventos del sistema. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanea la salida del terminal para las aserciones. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Verifica la estructura de la salida de fragmentación. Importar desde `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Conserva los tipos literales para las pruebas basadas en tablas. Importar desde `plugin-sdk/test-fixtures`                                                    |

Los conjuntos de contratos de plugins incluidos también usan estas subrutas de pruebas del SDK para
los auxiliares de registro, manifiesto, artefactos públicos y datos de prueba de runtime usados exclusivamente en pruebas.
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

## Resolución de destinos en pruebas

Use `installCommonResolveTargetErrorCases` para añadir casos de error estándar para la
resolución de destinos del canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("resolución de destinos de my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Lógica de resolución de destinos del canal
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

El cargador real impide el registro del plugin cuando faltan metadatos obligatorios o
un plugin llama a una API de capacidad que no posee. Por ejemplo,
`api.registerHook(...)` requiere un nombre de hook y
`api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la entrada
exportada declare `kind: "memory"`.

### Pruebas del acceso a la configuración del runtime

Se recomienda usar el simulacro compartido del runtime del plugin de `openclaw/plugin-sdk/plugin-test-runtime`.
Sus simulacros `runtime.config.loadConfig()` y `runtime.config.writeConfigFile(...)`
generan excepciones de forma predeterminada para que las pruebas detecten nuevos usos de las API obsoletas
de compatibilidad. Sobrescriba esos simulacros únicamente cuando la prueba cubra explícitamente un
comportamiento de compatibilidad heredado.

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
    // No se expone el valor del token
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

### Simulación del runtime del plugin

Para el código que usa `createPluginRuntimeStore`, simule el runtime en las pruebas:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "runtime de prueba no establecido",
});

// En la configuración de las pruebas
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

Se recomienda usar stubs por instancia en lugar de mutar el prototipo:

```typescript
// Recomendado: stub por instancia
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evitar: mutación del prototipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contratos (plugins del repositorio)

Los plugins incluidos tienen pruebas de contratos que verifican la propiedad de los registros:

```bash
pnpm test src/plugins/contracts/
```

Estas pruebas verifican:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- La corrección de la estructura del registro
- El cumplimiento del contrato del runtime

### Ejecución de pruebas específicas

Para un plugin específico:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Solo para pruebas de contratos:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicación del lint (plugins del repositorio)

`scripts/run-additional-boundary-checks.mjs` ejecuta en CI un conjunto de comprobaciones de límites
de importación `lint:plugins:*`; cada una también puede ejecutarse por separado de forma local:

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
# Ejecutar todas las pruebas
pnpm test

# Ejecutar pruebas de un plugin específico
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
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de los plugins de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de los plugins de proveedor
- [Creación de plugins](/es/plugins/building-plugins) -- guía de introducción
