---
read_when:
    - Quieres una clave gestionada para varios proveedores de modelos
    - Necesitas descubrimiento de modelos de ClawRouter o informes de cuota en OpenClaw
summary: Dirige los modelos con alcance de credenciales a través de ClawRouter y muestra las cuotas administradas
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:36:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter da a OpenClaw una clave con alcance de política para varios
proveedores de modelos ascendentes. El plugin incluido descubre solo los modelos
permitidos para esa clave, enruta cada modelo mediante su protocolo declarado e
informa el presupuesto y el uso agregado de la clave en las superficies de uso
de OpenClaw.

No instalas ni autenticas cada plugin de proveedor ascendente en el host de
OpenClaw. Las credenciales ascendentes y el reenvío específico del proveedor
permanecen en ClawRouter. OpenClaw solo necesita el plugin incluido
`@openclaw/clawrouter` y una credencial de ClawRouter emitida.

| Propiedad        | Valor                                    |
| ---------------- | ---------------------------------------- |
| Proveedor        | `clawrouter`                             |
| Paquete          | `@openclaw/clawrouter`                   |
| Autenticación    | `CLAWROUTER_API_KEY`                     |
| URL predeterminada | `https://clawrouter.openclaw.ai`       |
| Catálogo de modelos | Con alcance de credencial mediante `/v1/catalog` |
| Cuotas           | Presupuesto mensual y uso mediante `/v1/usage` |

## Primeros pasos

<Steps>
  <Step title="Obtén una credencial con alcance">
    Pide a tu administrador de ClawRouter una credencial cuya política incluya
    los proveedores, modelos y presupuesto mensual que debes usar. Las
    credenciales se muestran una sola vez cuando se emiten.
  </Step>
  <Step title="Configura OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    El plugin está incluido con OpenClaw. Si tu configuración establece
    `plugins.allow`, agrega `clawrouter` a esa lista antes de habilitarlo. Para
    una implementación personalizada, establece `models.providers.clawrouter.baseUrl`
    en el origen de ClawRouter; el valor predeterminado es
    `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Lista los modelos concedidos">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Usa las referencias de modelo devueltas exactamente como se muestran.
    Conservan el espacio de nombres ascendente, como `clawrouter/openai/...`,
    `clawrouter/anthropic/...` o `clawrouter/google/...`. Si
    `agents.defaults.models` es una lista de permitidos en tu configuración,
    agrega cada referencia de ClawRouter seleccionada.

  </Step>
  <Step title="Selecciona un modelo">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    También puedes seleccionar un modelo devuelto para una ejecución con
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Descubrimiento de modelos

`GET /v1/catalog` es la fuente de verdad. OpenClaw no distribuye una segunda
lista fija de modelos de ClawRouter. Un modelo configurado en ClawRouter aparece cuando:

- la política de la credencial concede su proveedor;
- la conexión del proveedor está habilitada y lista;
- el modelo del catálogo anuncia una capacidad de LLM compatible; y
- el catálogo expone un contrato de transporte compatible con el plugin.

Por lo tanto, agregar otro modelo a un proveedor de ClawRouter compatible no
requiere una versión de OpenClaw ni otro plugin de proveedor. La siguiente
actualización del catálogo lo descubre. Un modelo que necesita un nuevo
protocolo de comunicación requiere compatibilidad en el plugin de ClawRouter
antes de que OpenClaw lo anuncie.

## Protocolo y plugins de proveedor

No necesitas instalar el plugin de autenticación de cada empresa ascendente.
ClawRouter posee las credenciales ascendentes; su catálogo indica a OpenClaw qué
transporte usar. El plugin admite:

| Ruta del catálogo              | Transporte de OpenClaw  |
| ------------------------------ | ----------------------- |
| Chat compatible con OpenAI     | `openai-completions`    |
| Responses compatible con OpenAI | `openai-responses`     |
| Messages nativo de Anthropic   | `anthropic-messages`    |
| Streaming nativo de Google Gemini | `google-generative-ai` |

El plugin también aplica las políticas de repetición y esquema de herramientas
correspondientes para esas familias. Las filas del catálogo que usan otro
formato de solicitud/stream no se anuncian intencionalmente como modelos de
texto de OpenClaw. Normaliza esos proveedores a uno de los contratos compatibles
en ClawRouter en lugar de enviar una carga útil incompatible.

## Cuotas y uso

La respuesta `/v1/usage` de ClawRouter alimenta las superficies normales de uso
de proveedores de OpenClaw. `/status` y el estado relacionado del panel muestran
la ventana de presupuesto mensual cuando la clave tiene un límite, además de los
totales de solicitudes, tokens y gasto. Las claves sin medición siguen mostrando
uso agregado sin una ventana de porcentaje.

La consulta de cuotas usa la misma clave con alcance que el descubrimiento de
modelos. Un error en la consulta de cuotas no bloquea la ejecución del modelo.

Consulta la instantánea en vivo con:

```bash
openclaw status --usage
openclaw models status
```

La misma instantánea del proveedor está disponible para `/status` en el chat y
la UI de uso de OpenClaw. El presupuesto se aplica a toda la política, por lo
que las solicitudes realizadas por otro cliente que use la misma política de
ClawRouter pueden cambiar el porcentaje restante.

## Solución de problemas

| Síntoma                                  | Comprobación                                                                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No hay modelos de ClawRouter             | Confirma que el plugin esté habilitado y permitido por `plugins.allow`, luego comprueba que la credencial esté activa y conceda al menos un proveedor listo. |
| Falta un modelo configurado de ClawRouter | Inspecciona su capacidad de `/v1/catalog` y el formato de ruta. Los contratos de transporte no compatibles se filtran intencionalmente.         |
| `Unknown model: clawrouter/...`          | Agrega la referencia exacta del catálogo a `agents.defaults.models` cuando ese mapa de configuración se use como lista de permitidos.           |
| `401` o `403` del catálogo o uso         | Vuelve a emitir o cambia el alcance de la credencial de ClawRouter; OpenClaw no recurre a claves de proveedores ascendentes.                   |
| La llamada al modelo falla tras el descubrimiento | Comprueba la conexión del proveedor y el estado ascendente en ClawRouter, luego reintenta cuando se recupere su estado de disponibilidad. |
| El uso tiene totales pero no porcentaje  | La política no tiene medición; agrega un presupuesto mensual en ClawRouter para exponer una ventana de porcentaje.                              |

## Comportamiento de seguridad

- El descubrimiento del catálogo tiene el alcance de la clave de proxy configurada y se almacena en caché por clave.
- La clave de proxy se adjunta solo en el despacho de la solicitud; no se almacena en los metadatos del modelo.
- Los ids de modelos nativos de Anthropic y Gemini se reescriben a sus ids ascendentes solo en el despacho.
- Las filas de catálogo no compatibles o no concedidas fallan de forma cerrada y no se pueden seleccionar.

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Configuración de proveedores y selección de modelos.
  </Card>
  <Card title="Seguimiento de uso" href="/es/concepts/usage-tracking" icon="chart-line">
    Superficies de uso y estado de OpenClaw.
  </Card>
</CardGroup>
