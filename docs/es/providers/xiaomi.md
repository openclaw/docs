---
read_when:
    - Quieres modelos Xiaomi MiMo en OpenClaw
    - Necesitas la autenticación de Xiaomi MiMo o la configuración de Token Plan
summary: Usa los modelos de pago por uso y Token Plan de Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-05T11:42:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo es la plataforma de API para los modelos **MiMo**. El plugin `xiaomi`
incluido (`enabledByDefault: true`, sin paso de instalación) registra dos
proveedores de texto más un proveedor de voz (TTS):

- `xiaomi` - claves de pago por uso (`sk-...`)
- `xiaomi-token-plan` - claves de Token Plan (`tp-...`) con preajustes de endpoint regionales

| Propiedad             | Valor                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ids de proveedor      | `xiaomi` (pago por uso), `xiaomi-token-plan` (Token Plan)                                                                                          |
| Vars de entorno auth  | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Flags de onboarding   | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flags directos de CLI | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                   | Completions de chat compatibles con OpenAI (`openai-completions`)                                                                                  |
| Contrato de voz       | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URLs base             | Pago por uso: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| Modelos predeterminados | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                        |
| TTS predeterminado    | `mimo-v2.5-tts`, voz `mimo_default`; modelo voicedesign `mimo-v2.5-tts-voicedesign`                                                               |

## Primeros pasos

<Steps>
  <Step title="Get the right key">
    Crea una clave de pago por uso en la [consola de Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), o abre tu página de suscripción de Token Plan y copia la URL base regional compatible con OpenAI junto con la clave `tp-...` correspondiente.
  </Step>

  <Step title="Run onboarding">
    Pago por uso:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    O pasa las claves directamente:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
El onboarding valida la forma de la clave y advierte cuando se introduce una clave `tp-...` en la ruta de pago por uso, o una clave `sk-...` en la ruta de Token Plan.
</Tip>

## Catálogo de pago por uso

| Ref. de modelo         | Entrada      | Contexto  | Salida máx. | Razonamiento | Notas                  |
| ---------------------- | ------------ | --------- | ----------- | ------------ | ---------------------- |
| `xiaomi/mimo-v2-flash` | texto        | 262,144   | 8,192       | No           | Modelo predeterminado  |
| `xiaomi/mimo-v2-pro`   | texto        | 1,048,576 | 32,000      | Sí           | Contexto grande        |
| `xiaomi/mimo-v2-omni`  | texto, imagen | 262,144  | 32,000      | Sí           | Multimodal             |

## Catálogo de Token Plan

Elige la opción de autenticación de Token Plan que coincida con la URL base regional mostrada en la UI de suscripción de Xiaomi:

| Opción de auth          | URL base                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Ref. de modelo                    | Entrada      | Contexto  | Salida máx. | Razonamiento | Notas                 |
| --------------------------------- | ------------ | --------- | ----------- | ------------ | --------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | texto        | 1,048,576 | 131,072     | Sí           | Modelo predeterminado |
| `xiaomi-token-plan/mimo-v2.5`     | texto, imagen | 1,048,576 | 131,072     | Sí           | Multimodal            |

`xiaomi-token-plan` necesita una URL base regional para resolverse. La ruta
compatible es una opción de onboarding de Token Plan incluida o un bloque de
configuración explícito `models.providers.xiaomi-token-plan` con `baseUrl`
definido; el proveedor no se ofrece sin uno de ellos.

## Modelos de razonamiento

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` y `mimo-v2.5-pro` admiten la
[`directiva /think`](/es/tools/thinking) de OpenClaw con los niveles `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` y `max` (predeterminado `high`).
`mimo-v2-flash` no admite razonamiento.

## Texto a voz

El plugin `xiaomi` incluido también registra Xiaomi MiMo como proveedor de voz
para `messages.tts`. Llama al contrato TTS de completions de chat de Xiaomi con
el texto como mensaje `assistant` y una guía de estilo opcional como mensaje
`user`.

| Propiedad | Valor                                    |
| --------- | ---------------------------------------- |
| Id de TTS | `xiaomi` (alias `mimo`)                  |
| Auth      | `XIAOMI_API_KEY`                         |
| API       | `POST /v1/chat/completions` con `audio`  |
| Predeterminado | `mimo-v2.5-tts`, voz `mimo_default` |
| Salida    | MP3 de forma predeterminada; WAV cuando se configura |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Voces integradas: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Los modelos con voz preestablecida (`mimo-v2.5-tts`,
`mimo-v2-tts`) usan `audio.voice`, por lo que OpenClaw envía `speakerVoice`
para esos modelos.

El modelo voicedesign `mimo-v2.5-tts-voicedesign` genera la voz a partir de un
prompt de estilo en lenguaje natural en lugar de un id de voz preestablecida.
Define `style` con la descripción de voz deseada; OpenClaw la envía como el
mensaje `user`, envía el texto hablado como el mensaje `assistant` y omite
`audio.voice` para este modelo.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Para los canales que solicitan un destino de síntesis de nota de voz (Discord,
Feishu, Matrix, Telegram y WhatsApp), OpenClaw transcodifica la salida de Xiaomi
a Opus mono de 48 kHz con `ffmpeg` antes de la entrega.

## Ejemplo de configuración

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Los precios y flags de compatibilidad provienen del manifiesto del plugin incluido, por lo que el ejemplo de configuración omite `cost` y `compat` para evitar divergencias con el comportamiento en runtime.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Los precios provienen del manifiesto incluido (los modelos de Token Plan incluyen precios escalonados de lectura de caché), por lo que el ejemplo de configuración omite `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    El proveedor `xiaomi` se habilita automáticamente cuando `XIAOMI_API_KEY` está definido en tu entorno o existe un perfil de auth. `xiaomi-token-plan` necesita una URL base regional, por lo que la ruta compatible es la opción de onboarding de Token Plan incluida o un bloque de configuración explícito `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - ligero y rápido, ideal para tareas de texto de propósito general. No admite razonamiento.
    - **mimo-v2-pro** - admite razonamiento con una ventana de contexto de 1M de tokens para cargas de trabajo con documentos largos.
    - **mimo-v2-omni** - modelo multimodal con razonamiento habilitado que acepta entradas de texto e imagen.
    - **mimo-v2.5-pro** - valor predeterminado de Token Plan con la pila de razonamiento V2.5 actual de Xiaomi.
    - **mimo-v2.5** - ruta multimodal V2.5 de Token Plan.

    <Note>
    Los modelos de pago por uso usan el prefijo `xiaomi/`. Los modelos de Token Plan usan el prefijo `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Si los modelos no aparecen, confirma que la var de entorno de clave correspondiente o el perfil de auth está presente y es válido.
    - Para Token Plan, confirma que la región de onboarding elegida coincide con la URL base de la página de suscripción y que la clave empieza por `tp-`.
    - Cuando el Gateway se ejecuta como daemon, asegúrate de que la clave esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves definidas solo en tu shell interactivo no son visibles para los procesos de gateway gestionados por daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para una disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Thinking levels" href="/es/tools/thinking" icon="brain">
    Sintaxis de la directiva `/think` y asignación de niveles.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel de Xiaomi MiMo y gestión de claves de API.
  </Card>
</CardGroup>
