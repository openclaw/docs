---
read_when:
    - Quieres usar Together AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Together AI (autenticación + selección de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-04-12T23:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) proporciona acceso a destacados modelos
de código abierto, incluidos Llama, DeepSeek, Kimi y más, a través de una API unificada.

| Propiedad | Valor                         |
| --------- | ----------------------------- |
| Proveedor | `together`                    |
| Autenticación | `TOGETHER_API_KEY`        |
| API       | Compatible con OpenAI         |
| URL base  | `https://api.together.xyz/v1` |

## Primeros pasos

<Steps>
  <Step title="Obtén una clave de API">
    Crea una clave de API en
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Ejecuta el onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Establece un modelo predeterminado">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Ejemplo no interactivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
El ajuste preestablecido del onboarding establece `together/moonshotai/Kimi-K2.5` como modelo
predeterminado.
</Note>

## Catálogo integrado

OpenClaw incluye este catálogo integrado de Together:

| Referencia de modelo                                         | Nombre                                 | Entrada     | Contexto   | Notas                            |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | texto, imagen | 262,144  | Modelo predeterminado; reasoning habilitado |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | texto       | 202,752    | Modelo de texto de propósito general |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | texto       | 131,072    | Modelo de instrucciones rápido   |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | texto, imagen | 10,000,000 | Multimodal                    |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | texto, imagen | 20,000,000 | Multimodal                    |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | texto       | 131,072    | Modelo de texto general          |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | texto       | 131,072    | Modelo de reasoning              |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | texto       | 262,144    | Modelo de texto Kimi secundario  |

## Generación de video

El plugin integrado `together` también registra generación de video mediante la
herramienta compartida `video_generate`.

| Propiedad            | Valor                                 |
| -------------------- | ------------------------------------- |
| Modelo de video predeterminado | `together/Wan-AI/Wan2.2-T2V-A14B` |
| Modos                | texto a video, referencia de una sola imagen |
| Parámetros compatibles | `aspectRatio`, `resolution`         |

Para usar Together como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Consulta [Video Generation](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta,
la selección de proveedor y el comportamiento de failover.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `TOGETHER_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves establecidas solo en tu shell interactivo no son visibles para
    los procesos del gateway gestionados como daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para
    una disponibilidad persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Verifica que tu clave funciona: `openclaw models list --provider together`
    - Si los modelos no aparecen, confirma que la clave de API está configurada en el entorno
      correcto para tu proceso Gateway.
    - Las referencias de modelos usan la forma `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de generación de video y selección de proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidos los ajustes de proveedor.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel de Together AI, documentación de la API y precios.
  </Card>
</CardGroup>
