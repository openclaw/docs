---
read_when:
    - Quieres usar Volcano Engine o modelos Doubao con OpenClaw
    - Necesitas la configuración de la clave de API de Volcengine
    - Quieres usar la conversión de texto a voz de Volcengine Speech
summary: Configuración de Volcano Engine (modelos Doubao, endpoints de codificación y TTS de Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:37:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

El proveedor de Volcengine da acceso a modelos Doubao y a modelos de terceros
alojados en Volcano Engine, con endpoints separados para cargas de trabajo
generales y de programación. El mismo Plugin integrado también puede registrar Volcengine Speech como proveedor de TTS.

| Detalle     | Valor                                                      |
| ---------- | ---------------------------------------------------------- |
| Proveedores  | `volcengine` (general + TTS) + `volcengine-plan` (programación)  |
| Autenticación del modelo | `VOLCANO_ENGINE_API_KEY`                                   |
| Autenticación de TTS   | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | Modelos compatibles con OpenAI, TTS de BytePlus Seed Speech         |

## Primeros pasos

<Steps>
  <Step title="Configura la clave de API">
    Ejecuta la incorporación interactiva:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Esto registra los proveedores general (`volcengine`) y de programación (`volcengine-plan`) a partir de una sola clave de API.

  </Step>
  <Step title="Configura un modelo predeterminado">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para una configuración no interactiva (CI, scripting), pasa la clave directamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Proveedores y endpoints

| Proveedor          | Endpoint                                  | Caso de uso       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos generales |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de programación  |

<Note>
Ambos proveedores se configuran a partir de una sola clave de API. La configuración registra ambos automáticamente.
</Note>

## Catálogo integrado

<Tabs>
  <Tab title="General (volcengine)">
    | Referencia del modelo                                    | Nombre                            | Entrada       | Contexto |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | texto, imagen | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | texto, imagen | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | texto, imagen | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | texto, imagen | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | texto, imagen | 128,000 |
  </Tab>
  <Tab title="Programación (volcengine-plan)">
    | Referencia del modelo                                         | Nombre                     | Entrada | Contexto |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | texto  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | texto  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | texto  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | texto  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | texto  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | texto  | 256,000 |
  </Tab>
</Tabs>

## Conversión de texto a voz

Volcengine TTS usa la API HTTP de BytePlus Seed Speech y se configura
por separado de la clave de API del modelo Doubao compatible con OpenAI. En la consola de BytePlus,
abre Seed Speech > Settings > API Keys y copia la clave de API; luego configura:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Luego actívalo en `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Para destinos de notas de voz, OpenClaw solicita a Volcengine el formato nativo del proveedor
`ogg_opus`. Para adjuntos de audio normales, solicita `mp3`. Los alias del proveedor
`bytedance` y `doubao` también se resuelven al mismo proveedor de voz.

El id de recurso predeterminado es `seed-tts-1.0` porque eso es lo que BytePlus concede
a las claves de API de Seed Speech recién creadas en el proyecto predeterminado. Si tu proyecto
tiene habilitación de TTS 2.0, configura `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` es para los endpoints de modelos ModelArk/Doubao y no es una
clave de API de Seed Speech. TTS necesita una clave de API de Seed Speech de la consola de BytePlus Speech,
o un par heredado de AppID/token de la consola Speech.
</Warning>

La autenticación heredada con AppID/token sigue siendo compatible para aplicaciones antiguas de la consola Speech:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modelo predeterminado después de la incorporación">
    `openclaw onboard --auth-choice volcengine-api-key` actualmente configura
    `volcengine-plan/ark-code-latest` como modelo predeterminado mientras también registra
    el catálogo general `volcengine`.
  </Accordion>

  <Accordion title="Comportamiento de respaldo del selector de modelos">
    Durante la incorporación o la selección de modelos en la configuración, la opción de autenticación de Volcengine prioriza
    tanto las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos todavía no
    se han cargado, OpenClaw vuelve al catálogo sin filtrar en lugar de mostrar un
    selector vacío limitado al proveedor.
  </Accordion>

  <Accordion title="Variables de entorno para procesos daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que las variables de entorno
    del modelo y TTS, como `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` y
    `VOLCENGINE_TTS_TOKEN`, estén disponibles para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Cuando OpenClaw se ejecuta como servicio en segundo plano, las variables de entorno configuradas en tu
shell interactiva no se heredan automáticamente. Consulta la nota sobre daemon anterior.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
