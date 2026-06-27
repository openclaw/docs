---
read_when:
    - Quieres usar DeepSeek con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de DeepSeek (autenticación + selección del modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T12:35:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) proporciona potentes modelos de IA con una API compatible con OpenAI.

| Propiedad | Valor                      |
| -------- | -------------------------- |
| Proveedor | `deepseek`                 |
| Autenticación | `DEEPSEEK_API_KEY`         |
| API      | compatible con OpenAI          |
| URL base | `https://api.deepseek.com` |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Get your API key">
    Crea una clave de API en [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Esto solicitará tu clave de API y establecerá `deepseek/deepseek-v4-flash` como modelo predeterminado.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspeccionar el catálogo estático del Plugin sin requerir un Gateway en ejecución,
    usa:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Para instalaciones con scripts o sin interfaz, pasa todas las marcas directamente:

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
Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `DEEPSEEK_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Ref. de modelo               | Nombre            | Entrada | Contexto  | Salida máx. | Notas                                               |
| ---------------------------- | ----------------- | ------- | --------- | ----------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texto   | 1,000,000 | 384,000     | Modelo predeterminado; superficie compatible con razonamiento V4 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texto   | 1,000,000 | 384,000     | Superficie compatible con razonamiento V4           |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texto   | 131,072   | 8,192       | Superficie sin razonamiento de DeepSeek V3.2        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texto   | 131,072   | 65,536      | Superficie V3.2 con razonamiento habilitado         |

<Tip>
Los modelos V4 admiten el control `thinking` de DeepSeek. OpenClaw también reproduce
`reasoning_content` de DeepSeek en los turnos de seguimiento para que las sesiones de razonamiento con llamadas a herramientas puedan continuar.
Usa `/think xhigh` o `/think max` con modelos DeepSeek V4 para solicitar el
`reasoning_effort` máximo de DeepSeek.
</Tip>

## Razonamiento y herramientas

Las sesiones de razonamiento de DeepSeek V4 tienen un contrato de reproducción más estricto que la mayoría de los proveedores compatibles con OpenAI: después de que un turno con razonamiento habilitado usa herramientas, DeepSeek espera que los mensajes de asistente reproducidos de ese turno incluyan `reasoning_content` en las solicitudes de seguimiento. OpenClaw gestiona esto dentro del Plugin de DeepSeek, por lo que el uso normal de herramientas en varios turnos funciona con `deepseek/deepseek-v4-flash` y `deepseek/deepseek-v4-pro`.

Si cambias una sesión existente de otro proveedor compatible con OpenAI a un modelo DeepSeek V4, es posible que los turnos anteriores de llamadas a herramientas del asistente no tengan `reasoning_content` nativo de DeepSeek. OpenClaw rellena ese campo faltante en los mensajes de asistente reproducidos para solicitudes de razonamiento de DeepSeek V4, de modo que el proveedor pueda aceptar el historial sin requerir `/new`.

Cuando el razonamiento está deshabilitado en OpenClaw (incluida la selección **Ninguno** de la UI), OpenClaw envía a DeepSeek `thinking: { type: "disabled" }` y elimina `reasoning_content` reproducido del historial saliente. Esto mantiene las sesiones con razonamiento deshabilitado en la ruta sin razonamiento de DeepSeek.

Usa `deepseek/deepseek-v4-flash` para la ruta rápida predeterminada. Usa `deepseek/deepseek-v4-pro` cuando quieras el modelo V4 más potente y puedas aceptar mayor costo o latencia.

## Pruebas en vivo

El conjunto directo de modelos en vivo incluye DeepSeek V4 en el conjunto moderno de modelos. Para ejecutar solo las comprobaciones de modelo directo de DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Esa comprobación en vivo verifica que ambos modelos V4 puedan completarse y que los turnos de seguimiento de razonamiento/herramientas conserven la carga de reproducción que DeepSeek requiere.

## Ejemplo de configuración

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
