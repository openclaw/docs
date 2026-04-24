---
read_when:
    - Estás escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK de Plugin
    - Quieres entender las pruebas de contratos para Plugins incluidos
sidebarTitle: Testing
summary: Utilidades y patrones de pruebas para Plugins de OpenClaw
title: Pruebas de Plugins
x-i18n:
    generated_at: "2026-04-24T05:42:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Referencia de utilidades de prueba, patrones y cumplimiento de lint para Plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos completos de pruebas:
  [Pruebas de Plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

**Importación:** `openclaw/plugin-sdk/testing`

La subruta de pruebas exporta un conjunto reducido de helpers para autores de Plugins:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Exportaciones disponibles

| Exportación | Propósito |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Casos de prueba compartidos para el manejo de errores de resolución de destino |
| `shouldAckReaction` | Comprueba si un canal debe agregar una reacción de confirmación |
| `removeAckReactionAfterReply` | Elimina la reacción de confirmación después de entregar la respuesta |

### Tipos

La subruta de pruebas también reexporta tipos útiles en archivos de prueba:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## Probar la resolución de destino

Usa `installCommonResolveTargetErrorCases` para agregar casos de error estándar para
la resolución de destinos de canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

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

### Simular el tiempo de ejecución del Plugin

Para código que usa `createPluginRuntimeStore`, simula el tiempo de ejecución en las pruebas:

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
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Pruebas con stubs por instancia

Prefiere stubs por instancia en lugar de mutación del prototipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contratos (Plugins dentro del repositorio)

Los Plugins incluidos tienen pruebas de contratos que verifican la propiedad del registro:

```bash
pnpm test -- src/plugins/contracts/
```

Estas pruebas afirman:

- Qué Plugins registran qué proveedores
- Qué Plugins registran qué proveedores de voz
- Corrección de la forma del registro
- Cumplimiento del contrato de tiempo de ejecución

### Ejecutar pruebas acotadas

Para un Plugin específico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo para pruebas de contratos:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Cumplimiento de lint (Plugins dentro del repositorio)

`pnpm check` aplica tres reglas para Plugins dentro del repositorio:

1. **Sin importaciones raíz monolíticas** -- se rechaza el barrel raíz `openclaw/plugin-sdk`
2. **Sin importaciones directas de `src/`** -- los Plugins no pueden importar directamente `../../src/`
3. **Sin autoimportaciones** -- los Plugins no pueden importar su propia subruta `plugin-sdk/<name>`

Los Plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos
patrones.

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

Si las ejecuciones locales provocan presión de memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [SDK Channel Plugins](/es/plugins/sdk-channel-plugins) -- interfaz de Plugin de canal
- [SDK Provider Plugins](/es/plugins/sdk-provider-plugins) -- hooks de Plugin de proveedor
- [Crear Plugins](/es/plugins/building-plugins) -- guía de introducción
