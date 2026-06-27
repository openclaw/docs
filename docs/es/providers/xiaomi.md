---
read_when:
    - Quieres modelos Xiaomi MiMo en OpenClaw
    - Necesitas configurar la autenticación de Xiaomi MiMo o Token Plan
summary: Usa los modelos de pago por uso y Token Plan de Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T12:46:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo es la plataforma de API para los modelos **MiMo**. OpenClaw incluye un plugin de Xiaomi integrado con dos preajustes de proveedor de texto:

- `xiaomi` para claves de pago por uso (`sk-...`)
- `xiaomi-token-plan` para claves de Token Plan (`tp-...`) con preajustes de endpoint regionales

El mismo plugin también registra el proveedor de voz (TTS) `xiaomi`.

| Propiedad                  | Valor                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identificadores de proveedor | `xiaomi` (pago por uso), `xiaomi-token-plan` (Token Plan)                                                                                         |
| Plugin                     | integrado, `enabledByDefault: true`                                                                                                                |
| Variables de entorno de auth | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                    |
| Marcas de onboarding       | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Marcas directas de CLI     | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Contratos                  | completions de chat + `speechProviders`                                                                                                            |
| API                        | compatible con OpenAI (`openai-completions`)                                                                                                       |
| URL base                   | Pago por uso: `https://api.xiaomimimo.com/v1`; preajustes de Token Plan: `token-plan-{cn,sgp,ams}...`                                              |
| Modelos predeterminados    | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS predeterminado         | `mimo-v2.5-tts`, voz `mimo_default`; modelo de diseño de voz `mimo-v2.5-tts-voicedesign`                                                           |

## Primeros pasos

<Steps>
  <Step title="Get the right key">
    Crea una clave de pago por uso en la [consola de Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), o abre la página de suscripción de Token Plan y copia la URL base regional compatible con OpenAI junto con la clave `tp-...` correspondiente.
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

## Catálogo de pago por uso

| Referencia de modelo   | Entrada      | Contexto  | Salida máxima | Razonamiento | Notas                  |
| ---------------------- | ------------ | --------- | ------------- | ------------ | ---------------------- |
| `xiaomi/mimo-v2-flash` | texto        | 262,144   | 8,192         | No           | Modelo predeterminado  |
| `xiaomi/mimo-v2-pro`   | texto        | 1,048,576 | 32,000        | Sí           | Contexto grande        |
| `xiaomi/mimo-v2-omni`  | texto, imagen | 262,144  | 32,000        | Sí           | Multimodal             |

<Tip>
La referencia de modelo predeterminada es `xiaomi/mimo-v2-flash`. El proveedor se inyecta automáticamente cuando `XIAOMI_API_KEY` está definida o existe un perfil de autenticación.
</Tip>

## Catálogo de Token Plan

Elige la opción de autenticación de Token Plan que coincida con la URL base regional mostrada en la interfaz de suscripción de Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Referencia de modelo              | Entrada      | Contexto  | Salida máxima | Razonamiento | Notas                 |
| --------------------------------- | ------------ | --------- | ------------- | ------------ | --------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | texto        | 1,048,576 | 131,072       | Sí           | Modelo predeterminado |
| `xiaomi-token-plan/mimo-v2.5`     | texto, imagen | 1,048,576 | 131,072      | Sí           | Multimodal            |

<Tip>
El onboarding de Token Plan valida la forma de la clave y advierte cuando se introduce una clave `tp-...` en la ruta de pago por uso, o una clave `sk-...` en la ruta de Token Plan.
</Tip>

## Texto a voz

El plugin `xiaomi` integrado también registra Xiaomi MiMo como proveedor de voz para
`messages.tts`. Llama al contrato TTS de completions de chat de Xiaomi con el texto como
mensaje de `assistant` y una guía de estilo opcional como mensaje de `user`.

| Propiedad | Valor                                    |
| --------- | ---------------------------------------- |
| ID de TTS | `xiaomi` (alias `mimo`)                  |
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

Las voces integradas compatibles incluyen `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` y `Dean`. Los modelos con voces predefinidas usan `audio.voice`, por lo que
OpenClaw envía `speakerVoice` para `mimo-v2.5-tts` y `mimo-v2-tts`.

El modelo de diseño de voz de Xiaomi, `mimo-v2.5-tts-voicedesign`, genera la voz
a partir de una indicación de estilo en lenguaje natural en lugar de un ID de voz predefinido. Configura
`style` con la descripción de voz deseada; OpenClaw la envía como mensaje de `user`,
envía el texto hablado como mensaje de `assistant` y omite
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

Para destinos de notas de voz como Feishu y Telegram, OpenClaw transcodifica la
salida de Xiaomi a Opus de 48 kHz con `ffmpeg` antes de la entrega.

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

Los precios y las marcas de compatibilidad vienen del manifiesto del plugin integrado, por lo que el ejemplo de configuración omite `cost` y `compat` para evitar divergir del comportamiento en tiempo de ejecución.

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

Los precios vienen del manifiesto integrado (los modelos de Token Plan incluyen precios escalonados de lectura de caché), por lo que el ejemplo de configuración omite `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    El proveedor `xiaomi` se inyecta automáticamente cuando `XIAOMI_API_KEY` está definida en tu entorno o existe un perfil de autenticación. `xiaomi-token-plan` necesita una URL base regional, por lo que la ruta compatible es la opción de onboarding integrada de Token Plan o un bloque de configuración explícito `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — ligero y rápido, ideal para tareas de texto de propósito general. Sin soporte de razonamiento.
    - **mimo-v2-pro** — admite razonamiento con una ventana de contexto de 1 millón de tokens para cargas de trabajo con documentos largos.
    - **mimo-v2-omni** — modelo multimodal con razonamiento habilitado que acepta entradas de texto e imagen.
    - **mimo-v2.5-pro** — predeterminado de Token Plan con la pila de razonamiento V2.5 actual de Xiaomi.
    - **mimo-v2.5** — ruta multimodal V2.5 de Token Plan.

    <Note>
    Los modelos de pago por uso usan el prefijo `xiaomi/`. Los modelos de Token Plan usan el prefijo `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Si los modelos no aparecen, confirma que la variable de entorno de clave relevante o el perfil de autenticación están presentes y son válidos.
    - Para Token Plan, confirma que la región de onboarding elegida coincide con la URL base de la página de suscripción y que la clave empieza por `tp-`.
    - Cuando el Gateway se ejecuta como daemon, asegúrate de que la clave esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Warning>
    Las claves definidas solo en tu shell interactivo no son visibles para los procesos de Gateway administrados por daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel de Xiaomi MiMo y gestión de claves de API.
  </Card>
</CardGroup>
