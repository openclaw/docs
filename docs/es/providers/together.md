---
read_when:
    - Quieres usar Together AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Together AI (autenticación + selección de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-07-05T11:38:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) proporciona acceso a modelos líderes de código abierto,
incluidos Llama, DeepSeek, Kimi y más, mediante una API unificada.
OpenClaw lo incluye como el proveedor `together`.

| Propiedad | Valor                         |
| --------- | ----------------------------- |
| Proveedor | `together`                    |
| Autenticación | `TOGETHER_API_KEY`        |
| API       | compatible con OpenAI         |
| URL base  | `https://api.together.xyz/v1` |

## Primeros pasos

<Steps>
  <Step title="Get an API key">
    Crea una clave de API en
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
El onboarding establece `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` como el
modelo predeterminado.
</Note>

## Catálogo integrado

El costo está en USD por millón de tokens.

| Ref. de modelo                                      | Nombre                       | Entrada     | Contexto | Salida máx. | Costo (entrada/salida) | Notas                  |
| -------------------------------------------------- | ---------------------------- | ----------- | -------- | ----------- | ---------------------- | ---------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texto       | 131,072  | 8,192       | 0.88 / 0.88            | Modelo predeterminado  |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texto, imagen | 262,144 | 32,768    | 1.20 / 4.50            | Modelo de razonamiento |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texto       | 512,000  | 8,192       | 2.10 / 4.40            | Modelo de razonamiento |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texto       | 32,768   | 8,192       | 0.30 / 0.30            | Rápido, sin razonamiento |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texto       | 202,752  | 8,192       | 1.40 / 4.40            | Modelo de razonamiento |

## Generación de video

El Plugin `together` incluido también registra la generación de video mediante la
herramienta compartida `video_generate`.

| Propiedad             | Valor                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Modelo de video predeterminado | `Wan-AI/Wan2.2-T2V-A14B`                                                         |
| Otros modelos         | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                    |
| Modos                 | texto a video; imagen a video solo con `Wan-AI/Wan2.2-I2V-A14B` (una sola imagen de referencia) |
| Duración              | 1-10 segundos                                                                             |
| Parámetros admitidos  | `size` (analizado como `<width>x<height>`); `aspectRatio`/`resolution` no se leen         |

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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros de la herramienta compartida,
la selección de proveedor y el comportamiento de conmutación por error.
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `TOGETHER_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves configuradas solo en tu shell interactivo no son visibles para los
    procesos de Gateway administrados por daemon. Usa la configuración
    `~/.openclaw/.env` o `env.shellEnv` para una disponibilidad persistente.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Verifica que tu clave funcione: `openclaw models list --provider together`
    - Si los modelos no aparecen, confirma que la clave de API esté configurada en el
      entorno correcto para tu proceso de Gateway.
    - Las refs. de modelo usan la forma `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, refs. de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta compartida de generación de video y selección de proveedor.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluida la configuración de proveedores.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel de Together AI, documentación de la API y precios.
  </Card>
</CardGroup>
