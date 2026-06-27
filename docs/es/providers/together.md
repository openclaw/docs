---
read_when:
    - Quieres usar Together AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Together AI (autenticación + selección de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T12:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) proporciona acceso a modelos líderes de código abierto,
incluidos Llama, DeepSeek, Kimi y más, mediante una API unificada.

| Propiedad | Valor                         |
| -------- | ----------------------------- |
| Proveedor | `together`                    |
| Autenticación | `TOGETHER_API_KEY`            |
| API      | Compatible con OpenAI             |
| URL base | `https://api.together.xyz/v1` |

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Crea una clave de API en
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Establecer un modelo predeterminado">
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
El preajuste de incorporación establece
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` como modelo predeterminado.
</Note>

## Catálogo integrado

OpenClaw incluye este catálogo de Together integrado:

| Referencia del modelo                                | Nombre                       | Entrada     | Contexto | Notas                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texto       | 131,072 | Modelo predeterminado |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texto, imagen | 262,144 | Modelo de razonamiento Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texto       | 512,000 | Modelo de texto de razonamiento |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texto       | 32,768  | Modelo de texto rápido |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texto       | 202,752 | Modelo de texto de razonamiento |

## Generación de vídeo

El Plugin `together` integrado también registra la generación de vídeo mediante la
herramienta compartida `video_generate`.

| Propiedad             | Valor                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Modelo de vídeo predeterminado | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Modos                | texto a vídeo; solo referencia de imagen única con `Wan-AI/Wan2.2-I2V-A14B` |
| Parámetros admitidos | `aspectRatio`, `resolution`                                              |

Para usar Together como proveedor de vídeo predeterminado:

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
Consulta [Generación de vídeo](/es/tools/video-generation) para ver los parámetros de la herramienta compartida,
la selección de proveedor y el comportamiento de conmutación por error.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `TOGETHER_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves configuradas solo en tu shell interactiva no son visibles para los procesos de
    gateway gestionados por daemon. Usa la configuración `~/.openclaw/.env` o `env.shellEnv` para
    una disponibilidad persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Verifica que tu clave funcione: `openclaw models list --provider together`
    - Si los modelos no aparecen, confirma que la clave de API esté configurada en el entorno
      correcto para tu proceso Gateway.
    - Las referencias de modelo usan la forma `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedor, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta compartida de generación de vídeo y selección de proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluida la configuración de proveedores.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel de Together AI, documentación de la API y precios.
  </Card>
</CardGroup>
