---
read_when:
    - Quieres usar DeepSeek con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de DeepSeek (autenticación + selección del modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-11T23:26:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) proporciona potentes modelos de IA con una API compatible con OpenAI.

| Propiedad | Valor                      |
| --------- | -------------------------- |
| Proveedor | `deepseek`                 |
| Autenticación | `DEEPSEEK_API_KEY`     |
| API       | Compatible con OpenAI      |
| URL base  | `https://api.deepseek.com` |

## Instalar el plugin

Instala el plugin oficial y, a continuación, reinicia el Gateway:

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

    Para inspeccionar el catálogo estático del plugin sin un Gateway en ejecución:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuración no interactiva">
    Para instalaciones automatizadas o sin interfaz gráfica, pasa todas las opciones directamente:

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
Si el Gateway se ejecuta como un daemon (launchd/systemd), asegúrate de que `DEEPSEEK_API_KEY` esté
disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Referencia del modelo        | Nombre            | Entrada | Contexto  | Salida máxima | Notas                                                     |
| ---------------------------- | ----------------- | ------- | --------- | ------------- | --------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texto   | 1,000,000 | 384,000       | Modelo predeterminado; interfaz V4 con capacidad de razonamiento |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texto   | 1,000,000 | 384,000       | Interfaz V4 con capacidad de razonamiento                  |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texto   | 1,000,000 | 384,000       | Nombre de compatibilidad obsoleto de V4 Flash sin razonamiento |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texto   | 1,000,000 | 384,000       | Nombre de compatibilidad obsoleto de V4 Flash con razonamiento |

<Warning>
DeepSeek retirará `deepseek-chat` y `deepseek-reasoner` el 24 de julio de 2026
a las 15:59 UTC. Actualmente se enrutan a DeepSeek V4 Flash en modo sin razonamiento y
con razonamiento, respectivamente. Cambia las referencias de modelo configuradas a
`deepseek/deepseek-v4-flash` o `deepseek/deepseek-v4-pro` antes de la fecha límite.
</Warning>

Las estimaciones de costes locales de OpenClaw siguen las tarifas publicadas por DeepSeek para aciertos
de caché, fallos de caché y salida. DeepSeek puede modificar esas tarifas; su página
[Modelos y precios](https://api-docs.deepseek.com/quick_start/pricing/) es la
fuente autorizada para la facturación.

<Tip>
Los modelos V4 admiten el control `thinking` de DeepSeek. OpenClaw también reproduce
el `reasoning_content` de DeepSeek en turnos posteriores para que las sesiones de razonamiento con llamadas
a herramientas puedan continuar.
Usa `/think xhigh` o `/think max` con los modelos DeepSeek V4 para solicitar el
`reasoning_effort` máximo de DeepSeek; ambos se asignan a `"max"`.
</Tip>

## Razonamiento y herramientas

Las sesiones de razonamiento de DeepSeek V4 requieren que los mensajes reproducidos del asistente procedentes de un
turno con razonamiento habilitado incluyan `reasoning_content` en las solicitudes posteriores.
El plugin de DeepSeek para OpenClaw completa ese campo automáticamente, por lo que el uso normal
de herramientas en varios turnos funciona con `deepseek/deepseek-v4-flash` y
`deepseek/deepseek-v4-pro`, incluso cuando el historial procede de otro
proveedor compatible con OpenAI (sin `reasoning_content` nativo) o de un mensaje
normal del asistente. No es necesario usar `/new` después de cambiar de proveedor durante una sesión.

Cuando el razonamiento está deshabilitado (incluida la selección **None** de la interfaz), OpenClaw
envía `thinking: { type: "disabled" }` y elimina el `reasoning_content` reproducido
del historial saliente, lo que mantiene la sesión en la ruta de DeepSeek sin razonamiento.

Usa `deepseek/deepseek-v4-flash` como ruta rápida predeterminada. Usa
`deepseek/deepseek-v4-pro` como modelo más potente cuando puedas aceptar un mayor
coste o latencia.

## Pruebas en vivo

Para ejecutar únicamente las comprobaciones directas de los modelos DeepSeek V4 de la suite moderna de pruebas en vivo de modelos:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Verifica que ambos modelos V4 completen la ejecución y que los turnos posteriores de razonamiento y uso de herramientas
conserven la carga de reproducción que requiere DeepSeek.

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

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
