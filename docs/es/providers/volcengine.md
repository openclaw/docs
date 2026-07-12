---
read_when:
    - Quieres usar modelos de Volcano Engine o Doubao con OpenClaw
    - Necesitas configurar la clave de API de Volcengine
    - Quieres usar la conversión de texto a voz de Volcengine Speech
summary: Configuración de Volcano Engine (modelos Doubao, endpoints de programación y TTS de Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-11T23:31:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

El proveedor Volcengine da acceso a los modelos Doubao y a modelos de terceros alojados en Volcano Engine, con endpoints separados para cargas de trabajo generales y de programación. El mismo Plugin incluido también registra Volcengine Speech como proveedor de TTS.

| Detalle               | Valor                                                      |
| --------------------- | ---------------------------------------------------------- |
| Proveedores           | `volcengine` (general + TTS), `volcengine-plan` (programación) |
| Autenticación de modelos | `VOLCANO_ENGINE_API_KEY`                                |
| Autenticación de TTS  | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`  |
| API                   | Modelos compatibles con OpenAI, TTS de BytePlus Seed Speech |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    Ejecuta la incorporación interactiva:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Esto registra tanto el proveedor general (`volcengine`) como el de programación (`volcengine-plan`) a partir de una única clave de API.

  </Step>
  <Step title="Configurar un modelo predeterminado">
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
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para una configuración no interactiva (CI, scripts), pasa la clave directamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Proveedores y endpoints

| Proveedor         | Endpoint                                  | Caso de uso       |
| ----------------- | ----------------------------------------- | ----------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos generales |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de programación |

<Note>
Ambos proveedores se configuran con una única clave de API. La configuración registra ambos automáticamente, y el selector de modelos del proveedor de programación también reutiliza la autenticación del proveedor general (`volcengine-plan` es un alias de autenticación de `volcengine`).
</Note>

## Catálogo integrado

<Tabs>
  <Tab title="General (volcengine)">
    | Referencia del modelo                         | Nombre                          | Entrada        | Contexto |
    | --------------------------------------------- | ------------------------------- | -------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | texto, imagen  | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | texto, imagen  | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | texto, imagen  | 256,000  |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                         | texto, imagen  | 200,000  |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | texto, imagen  | 256,000  |
  </Tab>
  <Tab title="Programación (volcengine-plan)">
    | Referencia del modelo                              | Nombre                     | Entrada | Contexto |
    | -------------------------------------------------- | -------------------------- | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                  | Plan de programación Ark   | texto   | 256,000  |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code           | texto   | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Vista previa de Doubao Seed Code | texto | 256,000 |
    | `volcengine-plan/glm-4.7`                          | Programación con GLM 4.7   | texto   | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                 | Razonamiento Kimi K2       | texto   | 256,000  |
    | `volcengine-plan/kimi-k2.5`                        | Programación con Kimi K2.5 | texto   | 256,000  |
  </Tab>
</Tabs>

Ambos catálogos son estáticos (sin una llamada de descubrimiento a `/models`) y admiten la contabilización del uso en streaming compatible con OpenAI. Los esquemas de herramientas de ambos proveedores eliminan automáticamente las palabras clave `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` y `maxContains`, ya que la API de llamadas a herramientas de Volcengine las rechaza.

## Texto a voz

El TTS de Volcengine utiliza la API HTTP de BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) y se configura por separado de la clave de API de los modelos Doubao compatibles con OpenAI. En la consola de BytePlus, abre Seed Speech > Settings > API Keys, copia la clave de API y, a continuación, configura:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Después, habilítalo en `openclaw.json`:

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

Campos disponibles en `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` y `baseUrl`. `!emotion=<value>` también funciona como directiva de voz en línea cuando se permiten las anulaciones de la configuración de voz.

Para destinos de notas de voz, OpenClaw solicita el formato nativo del proveedor `ogg_opus`. Para archivos de audio adjuntos normales, solicita `mp3`. Los alias de proveedor `bytedance` y `doubao` también se resuelven a este proveedor de voz.

El identificador de recurso predeterminado es `seed-tts-1.0`, la autorización que BytePlus concede de forma predeterminada a las claves de API de Seed Speech recién creadas. Si tu proyecto cuenta con autorización para TTS 2.0, configura `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` es para los endpoints de modelos ModelArk/Doubao y no es una clave de API de Seed Speech. TTS necesita una clave de API de Seed Speech de BytePlus Speech Console o un par AppID/token heredado de Speech Console.
</Warning>

La autenticación heredada mediante AppID/token sigue siendo compatible con aplicaciones antiguas de Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Otras variables de entorno opcionales de TTS: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` y `VOLCENGINE_TTS_BASE_URL` anulan, cuando están configuradas, los campos correspondientes de la configuración `messages.tts.providers.volcengine`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modelo predeterminado después de la incorporación">
    `openclaw onboard --auth-choice volcengine-api-key` configura `volcengine-plan/ark-code-latest` como modelo predeterminado y también registra el catálogo general `volcengine`.
  </Accordion>

  <Accordion title="Comportamiento alternativo del selector de modelos">
    Durante la selección de modelos en la incorporación o configuración, la opción de autenticación de Volcengine da preferencia a las filas `volcengine/*` y `volcengine-plan/*`. Si esos modelos aún no están cargados, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.
  </Accordion>

  <Accordion title="Variables de entorno para procesos demonio">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrate de que las variables de entorno de modelos y TTS, como `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` y `VOLCENGINE_TTS_TOKEN`, estén disponibles para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Cuando OpenClaw se ejecuta como servicio en segundo plano, las variables de entorno configuradas en el shell interactivo no se heredan automáticamente. Consulta la nota anterior sobre procesos demonio.
</Warning>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
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
