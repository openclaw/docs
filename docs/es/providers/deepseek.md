---
read_when:
    - Quieres usar DeepSeek con OpenClaw
    - Necesitas la variable de entorno de la clave API o la opción de autenticación de la CLI
summary: Configuración de DeepSeek (autenticación + selección de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T05:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) ofrece potentes modelos de IA con una API compatible con OpenAI.

| Property | Value                      |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | Compatible con OpenAI      |
| Base URL | `https://api.deepseek.com` |

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave API">
    Crea una clave API en [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Esto pedirá tu clave API y establecerá `deepseek/deepseek-chat` como modelo predeterminado.

  </Step>
  <Step title="Verifica que los modelos estén disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuración no interactiva">
    Para instalaciones automatizadas o sin interfaz, pasa todas las banderas directamente:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `DEEPSEEK_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
</Warning>

## Catálogo incluido

| Model ref                    | Name              | Input | Context | Max output | Notes                                             |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | Modelo predeterminado; superficie sin thinking de DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | Superficie V3.2 con razonamiento habilitado       |

<Tip>
Ambos modelos incluidos anuncian actualmente compatibilidad de uso en streaming en el código fuente.
</Tip>

## Ejemplo de configuración

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
