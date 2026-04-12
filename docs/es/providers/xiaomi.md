---
read_when:
    - Quieres modelos Xiaomi MiMo en OpenClaw
    - Necesitas la configuración de `XIAOMI_API_KEY`
summary: Usa modelos Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T23:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo es la plataforma de API para los modelos **MiMo**. OpenClaw usa el
endpoint compatible con OpenAI de Xiaomi con autenticación por clave de API.

| Propiedad | Valor                           |
| --------- | ------------------------------- |
| Proveedor | `xiaomi`                        |
| Autenticación | `XIAOMI_API_KEY`            |
| API       | Compatible con OpenAI           |
| URL base  | `https://api.xiaomimimo.com/v1` |

## Primeros pasos

<Steps>
  <Step title="Obtén una clave de API">
    Crea una clave de API en la [consola de Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Ejecuta el onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    O pasa la clave directamente:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Modelos disponibles

| Referencia de modelo    | Entrada     | Contexto  | Salida máxima | Reasoning | Notas         |
| ----------------------- | ----------- | --------- | ------------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash`  | texto       | 262,144   | 8,192         | No        | Modelo predeterminado |
| `xiaomi/mimo-v2-pro`    | texto       | 1,048,576 | 32,000        | Sí        | Contexto grande |
| `xiaomi/mimo-v2-omni`   | texto, imagen | 262,144 | 32,000        | Sí        | Multimodal    |

<Tip>
La referencia de modelo predeterminada es `xiaomi/mimo-v2-flash`. El proveedor se inyecta automáticamente cuando `XIAOMI_API_KEY` está configurada o existe un perfil de autenticación.
</Tip>

## Ejemplo de configuración

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Comportamiento de inyección automática">
    El proveedor `xiaomi` se inyecta automáticamente cuando `XIAOMI_API_KEY` está configurada en tu entorno o existe un perfil de autenticación. No necesitas configurar manualmente el proveedor a menos que quieras sobrescribir los metadatos del modelo o la URL base.
  </Accordion>

  <Accordion title="Detalles de modelos">
    - **mimo-v2-flash** — ligero y rápido, ideal para tareas de texto de propósito general. Sin compatibilidad con reasoning.
    - **mimo-v2-pro** — admite reasoning con una ventana de contexto de 1M tokens para cargas de trabajo con documentos largos.
    - **mimo-v2-omni** — modelo multimodal con reasoning habilitado que acepta tanto texto como imágenes.

    <Note>
    Todos los modelos usan el prefijo `xiaomi/` (por ejemplo `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si los modelos no aparecen, confirma que `XIAOMI_API_KEY` esté configurada y sea válida.
    - Cuando el Gateway se ejecuta como daemon, asegúrate de que la clave esté disponible para ese proceso (por ejemplo en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves configuradas solo en tu shell interactivo no son visibles para los procesos del gateway gestionados como daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para una disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Consola de Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel de Xiaomi MiMo y gestión de claves de API.
  </Card>
</CardGroup>
