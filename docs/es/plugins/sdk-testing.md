---
read_when:
    - Está escribiendo pruebas para un plugin
    - Necesita utilidades de prueba del SDK de plugins
    - Quieres comprender las pruebas de contrato de los plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de pruebas para plugins de OpenClaw
title: Pruebas de plugins
x-i18n:
    generated_at: "2026-07-20T00:52:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c6c050826dae3cd2c794d50b2dd95e20e6533d838161cce037742ee5fdf7e0e
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referencia de utilidades, patrones y aplicación de reglas de lint para los
plugins de OpenClaw.

<Tip>
  **¿Busca ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas desarrollados:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

Estas subrutas son puntos de entrada de código fuente locales del repositorio para las pruebas de
los plugins incluidos en OpenClaw. No son exportaciones `package.json` publicadas para
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
import { isLiveTestEnabled } from "openclaw/plugin-sdk/test-live";
import { createRequestCaptureJsonFetch } from "openclaw/plugin-sdk/test-media-understanding";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

Utilice estas subrutas específicas para las pruebas de los plugins incluidos. El anterior
barrel `openclaw/plugin-sdk/testing` era local del repositorio, estaba excluido de los
paquetes distribuidos y se ha eliminado. El anterior alias `openclaw/plugin-sdk/test-utils`
se eliminó con él. `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) mantiene las pruebas de extensiones en
las subrutas de prueba específicas anteriores.

### Exportaciones disponibles

| Exportación                                               | Propósito                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crear un simulacro mínimo de la API de plugins para pruebas unitarias de registro directo. Importar desde `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture compartido del contrato de perfiles de autenticación para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture compartido del contrato de supresión de entregas para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture compartido del contrato de clasificación de respaldo para adaptadores nativos del entorno de ejecución de agentes. Importar desde `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crear fixtures de esquemas de herramientas dinámicas para pruebas de contratos del entorno de ejecución nativo. Importar desde `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Verificar la estructura del contexto de entrada del canal. Importar desde `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Instalar casos de contratos de cargas útiles de salida del canal. Importar desde `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Crear contextos del ciclo de vida de cuentas de canal. Importar desde `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Instalar casos genéricos de contratos de acciones de mensajes del canal. Importar desde `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Instalar casos genéricos de contratos de configuración del canal. Importar desde `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Instalar casos genéricos de contratos de estado del canal. Importar desde `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Verificar los identificadores del directorio del canal mediante una función de listado de directorios. Importar desde `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Verificar que los puntos de entrada de los canales incluidos expongan el contrato público esperado. Importar desde `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formatear marcas de tiempo deterministas de envolturas. Importar desde `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Verificar el texto de respuesta de vinculación del canal y extraer su código. Importar desde `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Instalar comprobaciones de contratos de registro de plugins. Importar desde `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registrar un plugin de proveedor en pruebas de humo del cargador. Importar desde `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Capturar todos los tipos de proveedor de un plugin. Importar desde `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Capturar registros de proveedores de varios plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Verificar que una colección de proveedores contenga un identificador. Importar desde `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Crear un entorno simulado de ejecución de la CLI y plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Crear una superficie simulada del entorno de ejecución de plugins. Importar desde `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Crear auxiliares de estado de configuración para plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Crear un solicitante simulado del asistente de configuración. Importar desde `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Crear un estado aislado de TaskFlow del entorno de ejecución. Importar desde `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Ejecutar un hook del catálogo de proveedores con dependencias de prueba. Importar desde `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Resolver las opciones del asistente de configuración del proveedor en las pruebas de contratos. Importar desde `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Resolver las entradas del selector de modelos del proveedor en las pruebas de contratos. Importar desde `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Crear identificadores de opciones del asistente del proveedor para verificaciones. Importar desde `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Inyectar proveedores del asistente del proveedor para pruebas aisladas. Importar desde `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Instalar comprobaciones de contratos del entorno de ejecución de familias de proveedores. Importar desde `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Verificar que las políticas de reproducción del proveedor se transmitan a las herramientas y los metadatos propiedad del proveedor. Importar desde `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Ejecutar una prueba en vivo de un proveedor de STT en tiempo real con fixtures de audio compartidos. Importar desde `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalizar la salida de la transcripción en vivo antes de las verificaciones aproximadas. Importar desde `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Verificar que los proveedores de vídeo declaren capacidades explícitas de modos de generación. Importar desde `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Verificar que los proveedores de música declaren capacidades explícitas de generación y edición. Importar desde `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Instalar una respuesta correcta de tarea de vídeo compatible con DashScope. Importar desde `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Acceder a simulacros de HTTP/autenticación de Vitest opcionales para proveedores. Importar desde `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Restablecer los simulacros de HTTP/autenticación del proveedor después de cada prueba. Importar desde `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Casos de prueba compartidos para gestionar errores de resolución de destinos. Importar desde `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Comprobar si un canal debe añadir una reacción de acuse de recibo. Importar desde `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Eliminar la reacción de acuse de recibo después de entregar la respuesta. Importar desde `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Crear un fixture de registro de plugins de canal. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Crear un fixture de registro de plugins vacío. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Instalar un fixture de registro para pruebas del entorno de ejecución de plugins. Importar desde `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Capturar solicitudes fetch de JSON en pruebas de auxiliares multimedia. Importar desde `plugin-sdk/test-media-understanding`                                     |
| `isLiveTestEnabled`                                  | Controlar las pruebas en vivo opcionales de proveedores. Importar desde `plugin-sdk/test-live`                                                                      |
| `collectProviderApiKeys`                             | Detectar credenciales para pruebas en vivo de proveedores. Importar desde `plugin-sdk/test-live-auth`                                                    |
| `parseProviderModelMap`                              | Analizar anulaciones de modelos para pruebas en vivo de música y vídeo. Importar desde `plugin-sdk/test-media-generation`                                              |
| `withServer`                                         | Ejecutar pruebas en un servidor HTTP local desechable. Importar desde `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Crear un objeto mínimo de solicitud HTTP entrante. Importar desde `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Ejecutar pruebas de fetch con hooks de preconexión instalados. Importar desde `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Modificar temporalmente variables de entorno. Importar desde `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crear fixtures aislados de pruebas del sistema de archivos. Importar desde `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Crear un simulacro mínimo de respuesta de servidor HTTP. Importar desde `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Crear fixtures de fetch del uso del proveedor. Importar desde `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Congelar y restaurar temporizadores para pruebas sensibles al tiempo. Importar desde `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Capturar la salida del entorno de ejecución de la CLI en las pruebas. Importar desde `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importar un módulo ESM con un token de consulta nuevo para omitir la caché de módulos. Importar desde `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolver rutas de fixtures de código fuente o distribución de plugins incluidos. Importar desde `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Instalar simulacros específicos de Vitest para elementos integrados de Node. Importar desde `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Crear contextos de prueba de entornos aislados. Importar desde `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Escribir fixtures de Skills. Importar desde `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Crear fixtures de mensajes de transcripción de agentes. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspeccionar y restablecer fixtures de eventos del sistema. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanear la salida del terminal para verificaciones. Importar desde `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Verifica la estructura de la salida de fragmentación. Importa desde `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Conserva los tipos literales para las pruebas basadas en tablas. Importa desde `plugin-sdk/test-fixtures`                                                    |

Las suites de contratos de plugins incluidos también usan estas subrutas de pruebas del SDK para
los asistentes de registro, manifiesto, artefactos públicos y accesorios de entorno de ejecución exclusivos de pruebas.
Las suites exclusivas del núcleo que dependen del inventario incluido de OpenClaw permanecen en
`src/plugins/contracts` en su lugar.

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

Use `installCommonResolveTargetErrorCases` para añadir casos de error estándar para
la resolución de destinos de canales:

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

  // Añadir casos de prueba específicos del canal
  it("debería resolver destinos @username", () => {
    // ...
  });
});
```

## Patrones de pruebas

### Pruebas de contratos de registro

Las pruebas unitarias que pasan un simulacro de `api` escrito manualmente a `register(api)` no
ejercitan las barreras de aceptación del cargador de OpenClaw. Añada al menos una
prueba de humo respaldada por el cargador para cada superficie de registro de la que dependa el plugin, especialmente
los hooks y las capacidades exclusivas, como la memoria.

El cargador real hace que falle el registro del plugin cuando faltan metadatos obligatorios o
un plugin llama a una API de capacidad que no le pertenece. Por ejemplo,
`api.registerHook(...)` requiere un nombre de hook, y
`api.registerMemoryCapability(...)` requiere que el manifiesto del plugin o la entrada
exportada declare `kind: "memory"`.

### Pruebas del acceso a la configuración del entorno de ejecución

Se recomienda usar el simulacro compartido del entorno de ejecución de plugins de
`openclaw/plugin-sdk/plugin-test-runtime`. Sus asistentes de configuración del entorno de ejecución modelan las
API actuales de instantáneas y mutaciones.

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
    // No se expone ningún valor del token
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
  errorMessage: "entorno de ejecución de prueba no configurado",
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

Se recomiendan los stubs por instancia en lugar de la mutación del prototipo:

```typescript
// Recomendado: stub por instancia
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evitar: mutación del prototipo
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
- Corrección de la forma del registro
- Cumplimiento del contrato del entorno de ejecución

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

`scripts/run-additional-boundary-checks.mjs` ejecuta un conjunto de comprobaciones de límites de importación de `lint:plugins:*`
en la Pipeline de CI; cada una también se puede ejecutar de forma independiente en el entorno local:

| Comando                                                        | Garantiza                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Los plugins incluidos no pueden importar el barrel raíz monolítico `openclaw/plugin-sdk`.              |
| `pnpm run lint:plugins:no-extension-src-imports`               | Los archivos de extensiones de producción no pueden importar directamente el árbol `src/**` del repositorio (`../../src/...`).  |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Los archivos de prueba de extensiones no pueden importar alias de pruebas del SDK eliminados ni otros asistentes de pruebas exclusivos del núcleo. |

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos
patrones.

## Configuración de pruebas

OpenClaw usa Vitest 4 con informes informativos de cobertura de V8. Para las pruebas de plugins:

```bash
# Ejecutar todas las pruebas
pnpm test

# Ejecutar pruebas específicas del plugin
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
