---
read_when:
    - Quieres usar modelos Xiaomi MiMo en OpenClaw
    - Necesita configurar la autenticación de Xiaomi MiMo o el Token Plan
summary: Usa los modelos de pago por uso y del Plan de tokens de Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-19T02:04:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 072e3772f5b6d49837a0909e982cb5a03bd532c4804b4eb2e94dc501e6aab58c
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo es la plataforma de API para los modelos **MiMo**. El Plugin `xiaomi`
incluido (`enabledByDefault: true`, no requiere instalación) registra dos
proveedores de texto y un proveedor de voz (TTS):

- `xiaomi` - claves de pago por uso (`sk-...`)
- `xiaomi-token-plan` - claves de Token Plan (`tp-...`) con ajustes preestablecidos de endpoints regionales

| Propiedad                | Valor                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Id. de proveedores       | `xiaomi` (pago por uso), `xiaomi-token-plan` (Token Plan)                                                                                         |
| Variables de entorno de autenticación | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Indicadores de incorporación | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Indicadores directos de la CLI | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                      | Finalizaciones de chat compatibles con OpenAI (`openai-completions`)                                                                                          |
| Contrato de voz          | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL base                 | Pago por uso: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| Modelos predeterminados  | `xiaomi/mimo-v2.5`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                              |
| TTS predeterminado       | `mimo-v2.5-tts`, voz `mimo_default`; modelo de diseño de voz `mimo-v2.5-tts-voicedesign`                                                               |

## Primeros pasos

<Steps>
  <Step title="Obtener la clave correcta">
    Cree una clave de pago por uso en la [consola de Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), o abra la página de su suscripción a Token Plan y copie la URL base regional compatible con OpenAI junto con la clave `tp-...` correspondiente.
  </Step>

  <Step title="Ejecutar la incorporación">
    Pago por uso:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    También puede pasar las claves directamente:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
La incorporación valida el formato de la clave y advierte cuando se introduce una clave `tp-...` en la ruta de pago por uso o una clave `sk-...` en la ruta de Token Plan.
</Tip>

## Catálogo de pago por uso

| Referencia del modelo    | Entrada       | Contexto  | Salida máxima | Razonamiento | Notas                |
| ------------------------ | ------------- | --------- | ------------- | ------------ | -------------------- |
| `xiaomi/mimo-v2.5`       | texto, imagen | 1,048,576 | 131,072       | Sí           | Modelo predeterminado |
| `xiaomi/mimo-v2.5-pro` | texto         | 1,048,576 | 131,072       | Sí           | Modelo insignia      |

## Catálogo de Token Plan

Elija la opción de autenticación de Token Plan que coincida con la URL base regional mostrada en la interfaz de suscripción de Xiaomi:

| Opción de autenticación | URL base                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Referencia del modelo              | Entrada       | Contexto  | Salida máxima | Razonamiento | Notas                 |
| ---------------------------------- | ------------- | --------- | ------------- | ------------ | --------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | texto         | 1,048,576 | 131,072       | Sí           | Modelo predeterminado |
| `xiaomi-token-plan/mimo-v2.5`     | texto, imagen | 1,048,576 | 131,072       | Sí           | Multimodal            |

`xiaomi-token-plan` necesita una URL base regional para resolverse. La ruta admitida
es una opción de incorporación de Token Plan incluida o un bloque de configuración
`models.providers.xiaomi-token-plan` explícito con `baseUrl` establecido; el
proveedor no se ofrece sin una de estas opciones.

## Modelos de razonamiento

`mimo-v2.5` y `mimo-v2.5-pro` admiten
la [directiva `/think`](/es/tools/thinking) de OpenClaw con los niveles `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` y `max` (valor predeterminado: `high`).

## Texto a voz

El Plugin `xiaomi` incluido también registra Xiaomi MiMo como proveedor de voz
para `messages.tts`. Invoca el contrato TTS de finalizaciones de chat de Xiaomi con el
texto como mensaje `assistant` y las instrucciones de estilo opcionales como mensaje `user`.

| Propiedad | Valor                                    |
| --------- | ---------------------------------------- |
| Id. de TTS | `xiaomi` (alias `mimo`)                  |
| Autenticación | `XIAOMI_API_KEY`                         |
| API       | `POST /v1/chat/completions` con `audio` |
| Predeterminado | `mimo-v2.5-tts`, voz `mimo_default`    |
| Salida    | MP3 de forma predeterminada; WAV cuando se configura      |

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
          style: "Tono luminoso, natural y conversacional.",
        },
      },
    },
  },
}
```

Voces integradas: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. El modelo de voz preestablecida `mimo-v2.5-tts` utiliza `audio.voice`, por lo que
OpenClaw envía `speakerVoice` para ese modelo.

El modelo de diseño de voz `mimo-v2.5-tts-voicedesign` genera la voz a partir de una
instrucción de estilo en lenguaje natural en lugar de un id. de voz preestablecida. Establezca `style` en
la descripción de voz deseada; OpenClaw la envía como mensaje `user`, envía
el texto hablado como mensaje `assistant` y omite `audio.voice` para este
modelo.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Voz femenina cálida y natural, con pronunciación clara.",
        },
      },
    },
  },
}
```

Para los canales que solicitan un destino de síntesis de notas de voz (Discord, Feishu,
Matrix, Telegram y WhatsApp), OpenClaw transcodifica la salida de Xiaomi a Opus mono de 48kHz
con `ffmpeg` antes de la entrega.

## Ejemplo de configuración

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Los precios y los indicadores de compatibilidad provienen del manifiesto del Plugin incluido, por lo que el ejemplo de configuración omite `cost` y `compat` para evitar divergencias respecto al comportamiento en tiempo de ejecución.

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

Los precios provienen del manifiesto incluido (los modelos de Token Plan incluyen precios escalonados para las lecturas de caché), por lo que el ejemplo de configuración omite `cost`.

<AccordionGroup>
  <Accordion title="Comportamiento de inyección automática">
    El proveedor `xiaomi` se habilita automáticamente cuando `XIAOMI_API_KEY` está establecido en el entorno o existe un perfil de autenticación. `xiaomi-token-plan` necesita una URL base regional, por lo que la ruta admitida es la opción de incorporación de Token Plan incluida o un bloque de configuración `models.providers.xiaomi-token-plan` explícito.
  </Accordion>

  <Accordion title="Detalles de los modelos">
    - **mimo-v2.5** - opción predeterminada de pago por uso y ruta multimodal V2.5 de Token Plan.
    - **mimo-v2.5-pro** - modelo de razonamiento insignia y opción predeterminada de Token Plan.

    <Note>
    Los modelos de pago por uso utilizan el prefijo `xiaomi/`. Los modelos de Token Plan utilizan el prefijo `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si los modelos no aparecen, confirme que la variable de entorno de la clave pertinente o el perfil de autenticación estén presentes y sean válidos.
    - Para Token Plan, confirme que la región de incorporación seleccionada coincida con la URL base de la página de suscripción y que la clave comience por `tp-`.
    - Cuando el Gateway se ejecute como demonio, asegúrese de que la clave esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves establecidas únicamente en el shell interactivo no son visibles para los procesos del Gateway administrados como demonios. Utilice la configuración `~/.openclaw/.env` o `env.shellEnv` para que estén disponibles de forma persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Niveles de razonamiento" href="/es/tools/thinking" icon="brain">
    Sintaxis de la directiva `/think` y asignación de niveles.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Consola de Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel de Xiaomi MiMo y administración de claves de API.
  </Card>
</CardGroup>
