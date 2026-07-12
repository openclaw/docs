---
read_when:
    - Quieres modelos Xiaomi MiMo en OpenClaw
    - Necesitas configurar la autenticación de Xiaomi MiMo o el plan de tokens
summary: Usa los modelos de pago por uso y del Plan de Tokens de Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-11T23:31:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo es la plataforma de API para los modelos **MiMo**. El plugin `xiaomi`
incluido (`enabledByDefault: true`, sin paso de instalación) registra dos
proveedores de texto y un proveedor de voz (TTS):

- `xiaomi` - claves de pago por uso (`sk-...`)
- `xiaomi-token-plan` - claves de Token Plan (`tp-...`) con valores predefinidos de endpoints regionales

| Propiedad                      | Valor                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identificadores de proveedor   | `xiaomi` (pago por uso), `xiaomi-token-plan` (Token Plan)                                                                                          |
| Variables de entorno de autenticación | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                |
| Opciones de incorporación      | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Opciones directas de la CLI    | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                            | Finalizaciones de chat compatibles con OpenAI (`openai-completions`)                                                                               |
| Contrato de voz                | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL base                       | Pago por uso: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                             |
| Modelos predeterminados        | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS predeterminado             | `mimo-v2.5-tts`, voz `mimo_default`; modelo de diseño de voz `mimo-v2.5-tts-voicedesign`                                                            |

## Primeros pasos

<Steps>
  <Step title="Get the right key">
    Crea una clave de pago por uso en la [consola de Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), o abre la página de tu suscripción a Token Plan y copia la URL base regional compatible con OpenAI junto con la clave `tp-...` correspondiente.
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

    También puedes proporcionar las claves directamente:

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
La incorporación valida el formato de la clave y muestra una advertencia cuando se introduce una clave `tp-...` en la ruta de pago por uso, o una clave `sk-...` en la ruta de Token Plan.
</Tip>

## Catálogo de pago por uso

| Referencia del modelo   | Entrada     | Contexto   | Salida máxima | Razonamiento | Notas                  |
| ----------------------- | ----------- | ---------- | ------------- | ------------ | ---------------------- |
| `xiaomi/mimo-v2-flash`  | texto       | 262,144    | 8,192         | No           | Modelo predeterminado  |
| `xiaomi/mimo-v2-pro`    | texto       | 1,048,576  | 32,000        | Sí           | Contexto amplio        |
| `xiaomi/mimo-v2-omni`   | texto, imagen | 262,144  | 32,000        | Sí           | Multimodal             |

## Catálogo de Token Plan

Elige la opción de autenticación de Token Plan que coincida con la URL base regional mostrada en la interfaz de suscripción de Xiaomi:

| Opción de autenticación  | URL base                                   |
| ------------------------ | ------------------------------------------ |
| `xiaomi-token-plan-cn`   | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`  | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`  | `https://token-plan-ams.xiaomimimo.com/v1` |

| Referencia del modelo              | Entrada       | Contexto   | Salida máxima | Razonamiento | Notas                 |
| ---------------------------------- | ------------- | ---------- | ------------- | ------------ | --------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro`  | texto         | 1,048,576  | 131,072       | Sí           | Modelo predeterminado |
| `xiaomi-token-plan/mimo-v2.5`      | texto, imagen | 1,048,576  | 131,072       | Sí           | Multimodal            |

`xiaomi-token-plan` necesita una URL base regional para resolverse. La ruta
compatible es una opción de incorporación de Token Plan incluida o un bloque
de configuración explícito `models.providers.xiaomi-token-plan` con `baseUrl`
definido; el proveedor no se ofrece sin una de estas opciones.

## Modelos de razonamiento

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` y `mimo-v2.5-pro` admiten
la [directiva `/think` de OpenClaw](/es/tools/thinking) con los niveles `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` y `max` (el valor predeterminado es `high`).
`mimo-v2-flash` no admite razonamiento.

## Texto a voz

El plugin `xiaomi` incluido también registra Xiaomi MiMo como proveedor de voz
para `messages.tts`. Llama al contrato de TTS de finalizaciones de chat de Xiaomi
con el texto como mensaje `assistant` y las indicaciones de estilo opcionales
como mensaje `user`.

| Propiedad | Valor                                    |
| --------- | ---------------------------------------- |
| Identificador de TTS | `xiaomi` (alias `mimo`)          |
| Autenticación | `XIAOMI_API_KEY`                     |
| API       | `POST /v1/chat/completions` con `audio`  |
| Valor predeterminado | `mimo-v2.5-tts`, voz `mimo_default` |
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
`Milo`, `Dean`. Los modelos de voz predefinida (`mimo-v2.5-tts`, `mimo-v2-tts`)
usan `audio.voice`, por lo que OpenClaw envía `speakerVoice` para esos modelos.

El modelo de diseño de voz `mimo-v2.5-tts-voicedesign` genera la voz a partir
de una indicación de estilo en lenguaje natural, en lugar de un identificador
de voz predefinido. Define `style` con la descripción de voz deseada; OpenClaw
la envía como mensaje `user`, envía el texto que se pronunciará como mensaje
`assistant` y omite `audio.voice` para este modelo.

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
a Opus mono de 48 kHz con `ffmpeg` antes de entregarla.

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

Los precios y los indicadores de compatibilidad proceden del manifiesto del plugin incluido, por lo que el ejemplo de configuración omite `cost` y `compat` para evitar discrepancias con el comportamiento en tiempo de ejecución.

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

Los precios proceden del manifiesto incluido (los modelos de Token Plan incluyen precios escalonados para las lecturas de caché), por lo que el ejemplo de configuración omite `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    El proveedor `xiaomi` se habilita automáticamente cuando `XIAOMI_API_KEY` está definida en tu entorno o existe un perfil de autenticación. `xiaomi-token-plan` necesita una URL base regional, por lo que la ruta compatible es la opción de incorporación de Token Plan incluida o un bloque de configuración explícito `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - ligero y rápido, ideal para tareas de texto de uso general. No admite razonamiento.
    - **mimo-v2-pro** - admite razonamiento con una ventana de contexto de 1 millón de tokens para cargas de trabajo con documentos largos.
    - **mimo-v2-omni** - modelo multimodal con razonamiento que acepta entradas de texto e imagen.
    - **mimo-v2.5-pro** - modelo predeterminado de Token Plan con la pila de razonamiento V2.5 actual de Xiaomi.
    - **mimo-v2.5** - ruta multimodal V2.5 de Token Plan.

    <Note>
    Los modelos de pago por uso utilizan el prefijo `xiaomi/`. Los modelos de Token Plan utilizan el prefijo `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Si los modelos no aparecen, confirma que la variable de entorno de clave correspondiente o el perfil de autenticación estén presentes y sean válidos.
    - Para Token Plan, confirma que la región de incorporación elegida coincida con la URL base de la página de suscripción y que la clave comience por `tp-`.
    - Cuando el Gateway se ejecute como daemon, asegúrate de que la clave esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves definidas únicamente en tu shell interactivo no son visibles para los procesos del Gateway administrados como daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para que estén disponibles de forma persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Thinking levels" href="/es/tools/thinking" icon="brain">
    Sintaxis de la directiva `/think` y correspondencia de niveles.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel de Xiaomi MiMo y administración de claves de API.
  </Card>
</CardGroup>
