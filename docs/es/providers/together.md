---
read_when:
    - Quieres usar Together AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Together AI (autenticación + selección del modelo)
title: Together AI
x-i18n:
    generated_at: "2026-07-11T23:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) proporciona acceso a destacados modelos de código abierto,
como Llama, DeepSeek, Kimi y otros, mediante una API unificada.
OpenClaw lo incluye como el proveedor `together`.

| Propiedad | Valor                         |
| --------- | ----------------------------- |
| Proveedor | `together`                    |
| Autenticación | `TOGETHER_API_KEY`        |
| API       | Compatible con OpenAI         |
| URL base  | `https://api.together.xyz/v1` |

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Cree una clave de API en
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
La incorporación establece `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` como
modelo predeterminado.
</Note>

## Catálogo integrado

El costo se expresa en USD por millón de tokens.

| Referencia del modelo                              | Nombre                       | Entrada        | Contexto | Salida máxima | Costo (entrada/salida) | Notas                    |
| -------------------------------------------------- | ---------------------------- | -------------- | -------- | ------------- | ---------------------- | ------------------------ |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texto          | 131,072  | 8,192         | 0.88 / 0.88            | Modelo predeterminado    |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texto, imagen  | 262,144  | 32,768        | 1.20 / 4.50            | Modelo de razonamiento   |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texto          | 512,000  | 8,192         | 2.10 / 4.40            | Modelo de razonamiento   |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texto          | 32,768   | 8,192         | 0.30 / 0.30            | Rápido, sin razonamiento |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texto          | 202,752  | 8,192         | 1.40 / 4.40            | Modelo de razonamiento   |

## Generación de video

El plugin `together` incluido también registra la generación de video mediante la
herramienta compartida `video_generate`.

| Propiedad               | Valor                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Modelo de video predeterminado | `Wan-AI/Wan2.2-T2V-A14B`                                                                        |
| Otros modelos           | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                 |
| Modos                   | texto a video; imagen a video solo con `Wan-AI/Wan2.2-I2V-A14B` (una única imagen de referencia)       |
| Duración                | 1-10 segundos                                                                                          |
| Parámetros compatibles  | `size` (se interpreta como `<width>x<height>`); `aspectRatio`/`resolution` no se leen                   |

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
Consulte [Generación de video](/es/tools/video-generation) para conocer los parámetros de la herramienta compartida,
la selección del proveedor y el comportamiento de conmutación por error.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como un demonio (launchd/systemd), asegúrese de que
    `TOGETHER_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves establecidas únicamente en el shell interactivo no son visibles para los
    procesos del Gateway administrados como demonios. Use la configuración `~/.openclaw/.env` o
    `env.shellEnv` para garantizar una disponibilidad persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Verifique que la clave funcione: `openclaw models list --provider together`
    - Si los modelos no aparecen, confirme que la clave de API esté configurada en el
      entorno correcto para el proceso del Gateway.
    - Las referencias de modelos usan el formato `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta compartida de generación de video y selección del proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de los proveedores.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel de Together AI, documentación de la API y precios.
  </Card>
</CardGroup>
