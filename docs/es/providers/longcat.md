---
read_when:
    - Quieres usar LongCat-2.0 con OpenClaw
    - Necesitas la clave de API de LongCat o los límites del modelo
summary: Configuración de la API de LongCat para LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-06T21:53:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) proporciona una API alojada para LongCat-2.0, un
modelo de razonamiento creado para cargas de trabajo de programación y agentes. OpenClaw proporciona el
Plugin oficial `longcat` para el endpoint compatible con OpenAI de LongCat.

| Propiedad  | Valor                              |
| ---------- | ---------------------------------- |
| Proveedor  | `longcat`                          |
| Auth       | `LONGCAT_API_KEY`                  |
| API        | Chat Completions compatible con OpenAI |
| URL base   | `https://api.longcat.chat/openai`  |
| Modelo     | `longcat/LongCat-2.0`              |
| Contexto   | 1,048,576 tokens                   |
| Salida máxima | 131,072 tokens                  |
| Entrada    | Texto                              |

## Instalar Plugin

Instala el paquete oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Crear una clave de API">
    Inicia sesión en la [plataforma API de LongCat](https://longcat.chat/platform/) y
    crea una clave en la página [claves de API](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Verificar el modelo">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

La incorporación agrega el catálogo alojado y selecciona `longcat/LongCat-2.0` cuando no
hay un modelo principal configurado.

### Configuración no interactiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Comportamiento de razonamiento

LongCat expone control binario del pensamiento. OpenClaw asigna los niveles de pensamiento habilitados
a `thinking: { type: "enabled" }` y `/think off` a
`thinking: { type: "disabled" }`. Actualmente LongCat no documenta
`reasoning_effort`, por lo que OpenClaw no lo envía.

LongCat devuelve el razonamiento en `reasoning_content`. OpenClaw conserva ese campo
al reproducir turnos de llamadas a herramientas del asistente para que las sesiones de agente de varios turnos conserven
la forma de mensaje esperada por el proveedor.

## Precios

El catálogo integrado usa los precios de lista de pago por uso de LongCat en USD por millón de
tokens: 0.75 USD por entrada no almacenada en caché, 0.015 USD por entrada almacenada en caché y 2.95 USD por salida. LongCat puede
ofrecer descuentos temporales; la [página de precios](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
y tus registros de facturación son la fuente autorizada.

## LongCat-2.0 autoalojado

El proveedor `longcat` apunta a la API alojada de LongCat. Para los pesos abiertos en
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), sirve el
modelo mediante un runtime compatible con OpenAI y usa en su lugar el proveedor
[vLLM](/es/providers/vllm) o [SGLang](/es/providers/sglang) existente de OpenClaw.

Mantén el identificador exacto del modelo del runtime en el catálogo del proveedor autoalojado;
no enrutes un despliegue local a través de `longcat/LongCat-2.0`.

## Solución de problemas

<AccordionGroup>
  <Accordion title="La clave funciona en un shell, pero no en Gateway">
    Los procesos de Gateway administrados por daemon no heredan todas las variables de shell
    interactivo. Pon `LONGCAT_API_KEY` en `~/.openclaw/.env`, configúrala mediante
    la incorporación o usa una referencia de secreto aprobada.
  </Accordion>

  <Accordion title="Las solicitudes fallan con 402 o 429">
    `402` significa que la cuenta no tiene cuota de tokens suficiente. `429` significa que la clave de API
    alcanzó un límite de tasa. Consulta el [uso de LongCat](https://longcat.chat/platform/usage)
    y reintenta las solicitudes limitadas por tasa después de la ventana de espera del proveedor.
  </Accordion>

  <Accordion title="El modelo no aparece">
    Ejecuta `openclaw plugins list` y confirma que el Plugin `longcat` está
    habilitado; luego ejecuta `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Configuración de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Documentación de la API de LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Endpoints de API alojada, autenticación, límites y ejemplos.
  </Card>
  <Card title="Ficha del modelo LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Arquitectura, guía de despliegue y detalles del modelo.
  </Card>
  <Card title="Secretos" href="/es/gateway/secrets" icon="key">
    Almacena las credenciales del proveedor sin incrustar texto plano en la configuración.
  </Card>
</CardGroup>
