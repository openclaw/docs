---
read_when:
    - Quieres usar Together AI con OpenClaw
    - Se necesita la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Together AI (autenticación + selección de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-07-19T02:04:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b08cae93c1ea7df46e1d2fbe78692f73bb3e56809122f70a56eec8b3dc5d8a4
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) proporciona acceso a modelos líderes de código abierto,
como Llama, DeepSeek, Kimi y otros, mediante una API unificada.
OpenClaw lo incluye como proveedor `together`.

| Propiedad | Valor                         |
| -------- | ----------------------------- |
| Proveedor | `together`                    |
| Autenticación     | `TOGETHER_API_KEY`            |
| API      | Compatible con OpenAI             |
| URL base | `https://api.together.xyz/v1` |

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Cree una clave de API en
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Ejecutar la configuración inicial">
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
La configuración inicial establece `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` como
modelo predeterminado.
</Note>

## Catálogo integrado

El coste se expresa en USD por millón de tokens.

| Ref. del modelo                                     | Nombre                       | Entrada       | Contexto | Salida máxima | Coste (entrada/salida) | Notas                  |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texto        | 131,072 | 8,192      | 0.88 / 0.88   | Modelo predeterminado  |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texto, imagen | 262,144 | 32,768     | 1.20 / 4.50   | Modelo de razonamiento |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texto        | 512,000 | 8,192      | 2.10 / 4.40   | Modelo de razonamiento |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texto        | 32,768  | 8,192      | 0.30 / 0.30   | Rápido, sin razonamiento |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texto        | 202,752 | 8,192      | 1.40 / 4.40   | Modelo de razonamiento |

## Generación de vídeo

El plugin `together` incluido también registra la generación de vídeo mediante la
herramienta compartida `video_generate`.

| Propiedad             | Valor                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Modelo de vídeo predeterminado  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| Otros modelos         | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/hailuo-02`, `kwaivgI/kling-2.1-master`                 |
| Modos                | texto a vídeo; imagen a vídeo solo con `Wan-AI/Wan2.2-I2V-A14B` (una única imagen de referencia) |
| Duración             | 1-10 segundos                                                                              |
| Parámetros compatibles | `size` (se analiza como `<width>x<height>`); `aspectRatio`/`resolution` no se leen            |

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
Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros de la herramienta compartida,
la selección de proveedores y el comportamiento de conmutación por error.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como un demonio (launchd/systemd), asegúrese de que
    `TOGETHER_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves establecidas únicamente en el shell interactivo no están visibles para los procesos
    del Gateway administrados por un demonio. Use la configuración `~/.openclaw/.env` o `env.shellEnv` para
    garantizar una disponibilidad persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Compruebe que la clave funciona: `openclaw models list --provider together`
    - Si los modelos no aparecen, confirme que la clave de API esté configurada en el
      entorno correcto para el proceso del Gateway.
    - Las referencias de modelos usan el formato `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta compartida de generación de vídeo y selección de proveedores.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedores.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel de Together AI, documentación de la API y precios.
  </Card>
</CardGroup>
