---
read_when:
    - Quieres usar DeepSeek con OpenClaw
    - Necesitas la variable de entorno de clave de API o la opción de autenticación de la CLI
summary: Configuración de DeepSeek (autenticación + selección de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-05T11:36:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0a66574c1977e835823d3d5f9fea073889267d6336a15533dd25645621e70dc
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) proporciona potentes modelos de IA con una API compatible con OpenAI.

| Propiedad | Valor                      |
| --------- | -------------------------- |
| Proveedor | `deepseek`                 |
| Autenticación | `DEEPSEEK_API_KEY`     |
| API       | compatible con OpenAI      |
| URL base  | `https://api.deepseek.com` |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Solicita tu clave de API y establece `deepseek/deepseek-v4-flash` como modelo predeterminado.

  </Step>
  <Step title="Verifica que los modelos estén disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspeccionar el catálogo estático del Plugin sin un Gateway en ejecución:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuración no interactiva">
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
Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `DEEPSEEK_API_KEY` esté
disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Ref. del modelo              | Nombre            | Entrada | Contexto  | Salida máxima | Notas                                      |
| ---------------------------- | ----------------- | ------- | --------- | -------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texto   | 1,000,000 | 384,000        | Modelo predeterminado; superficie V4 con capacidad de razonamiento |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texto   | 1,000,000 | 384,000        | Superficie V4 con capacidad de razonamiento |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texto   | 131,072   | 8,192          | Superficie DeepSeek V3.2 sin razonamiento  |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texto   | 131,072   | 65,536         | Superficie V3.2 con razonamiento habilitado |

<Tip>
Los modelos V4 admiten el control `thinking` de DeepSeek. OpenClaw también reproduce
`reasoning_content` de DeepSeek en turnos posteriores para que las sesiones de razonamiento con
llamadas a herramientas puedan continuar.
Usa `/think xhigh` o `/think max` con modelos DeepSeek V4 para solicitar el
`reasoning_effort` máximo de DeepSeek; ambos se asignan a `"max"`.
</Tip>

## Razonamiento y herramientas

Las sesiones de razonamiento de DeepSeek V4 requieren que los mensajes de asistente reproducidos desde un
turno con razonamiento habilitado incluyan `reasoning_content` en las solicitudes posteriores.
El Plugin DeepSeek de OpenClaw rellena ese campo automáticamente, por lo que el uso normal
de herramientas en varios turnos funciona en `deepseek/deepseek-v4-flash` y
`deepseek/deepseek-v4-pro`, incluso cuando el historial proviene de otro
proveedor compatible con OpenAI (sin `reasoning_content` nativo) o de un mensaje
de asistente simple. No se requiere `/new` después de cambiar de proveedor a mitad de sesión.

Cuando el razonamiento está deshabilitado (incluida la selección **Ninguna** de la UI), OpenClaw
envía `thinking: { type: "disabled" }` y elimina el `reasoning_content` reproducido
del historial saliente, manteniendo la sesión en la ruta de DeepSeek sin razonamiento.

Usa `deepseek/deepseek-v4-flash` como ruta rápida predeterminada. Usa
`deepseek/deepseek-v4-pro` para el modelo más potente cuando puedas aceptar mayor
costo o latencia.

## Pruebas en vivo

Para ejecutar solo las comprobaciones directas de modelos DeepSeek V4 desde el conjunto moderno de pruebas en vivo de modelos:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Verifica que ambos modelos V4 se completen y que los turnos posteriores de razonamiento/herramientas
conserven la carga de reproducción que DeepSeek requiere.

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
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs. de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
