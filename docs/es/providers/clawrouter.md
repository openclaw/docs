---
read_when:
    - Se desea una única clave gestionada para varios proveedores de modelos
    - Necesita el descubrimiento de modelos o los informes de cuota de ClawRouter en OpenClaw
summary: Enruta los modelos asociados a credenciales a través de ClawRouter y muestra las cuotas administradas
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T11:54:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter proporciona a OpenClaw una clave con alcance de política para varios proveedores
de modelos ascendentes. El plugin `clawrouter` incluido descubre únicamente los modelos permitidos
para esa clave, enruta cada modelo mediante su protocolo declarado e informa
del presupuesto de la clave y del uso agregado en las superficies de uso de OpenClaw.

Las credenciales ascendentes y el reenvío específico de cada proveedor permanecen en ClawRouter, por lo que
nunca es necesario instalar ni autenticar el plugin de cada proveedor ascendente en el
host de OpenClaw. El plugin se incluye con OpenClaw (`enabledByDefault: true`);
solo se necesita una credencial de ClawRouter emitida.

| Propiedad     | Valor                                    |
| ------------- | ---------------------------------------- |
| Proveedor     | `clawrouter`                             |
| Plugin        | incluido (incluido en OpenClaw)           |
| Autenticación | `CLAWROUTER_API_KEY`                     |
| URL predeterminada | `https://clawrouter.openclaw.ai`         |
| Catálogo de modelos | Limitado por credencial mediante `/v1/catalog`      |
| Cuotas        | Presupuesto mensual y uso mediante `/v1/usage` |

## Primeros pasos

<Steps>
  <Step title="Obtener una credencial con alcance limitado">
    Solicite al administrador de ClawRouter una credencial cuya política incluya
    los proveedores, modelos y el presupuesto mensual que se deban utilizar. Las credenciales se
    muestran una sola vez al emitirse.
  </Step>
  <Step title="Configurar OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` está incluido y habilitado de forma predeterminada. Si la configuración establece
    `plugins.allow`, añada `clawrouter` a esa lista antes de habilitarlo. Para un
    despliegue personalizado, establezca `models.providers.clawrouter.baseUrl` en el
    origen de ClawRouter; el valor predeterminado es `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Enumerar los modelos concedidos">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Utilice las referencias de modelos devueltas exactamente como se muestran. Conservan el espacio de nombres
    ascendente, como `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` o
    `clawrouter/google/gemini-3.5-flash`. Si `agents.defaults.models` es una
    lista de permitidos en la configuración, añada a ella cada referencia de ClawRouter seleccionada.

  </Step>
  <Step title="Seleccionar un modelo">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    También se puede seleccionar un modelo devuelto para una sola ejecución con
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Despliegue administrado no interactivo

Mantenga la clave del proxy en la inyección de secretos de la carga de trabajo y almacene únicamente una
SecretRef en `openclaw.json`. Los campos administrados canónicos son:

| Finalidad     | Campo de configuración o entorno                                         |
| ------------- | ------------------------------------------------------------------------ |
| Origen del enrutador | `models.providers.clawrouter.baseUrl`                                    |
| Credencial    | `models.providers.clawrouter.apiKey` -> SecretRef de entorno                    |
| Valor del secreto | `CLAWROUTER_API_KEY` en el entorno del proceso del Gateway                  |
| Modelo predeterminado | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Etiqueta de carga de trabajo | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opcional) |

Por ejemplo, un controlador de despliegue puede gestionar este parche JSON5:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Si el despliegue establece `plugins.allow`, conserve sus entradas existentes y añada
`clawrouter`. Valide y aplique sin un asistente interactivo:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

La ejecución de prueba resuelve la SecretRef, pero nunca imprime su valor. Para rotar la
credencial, actualice el Secret externo que proporciona `CLAWROUTER_API_KEY` y
reinicie la carga de trabajo del Gateway para que se cargue el nuevo entorno del proceso. El
archivo de configuración y la referencia del modelo no cambian.

Para un Gateway Docker independiente compilado desde el código fuente, ClawRouter ya está incluido en
el entorno de ejecución raíz. Seleccione únicamente el plugin de canal que requiera empaquetado independiente,
como `OPENCLAW_EXTENSIONS=clickclack`, `slack` o `msteams`; consulte
[imágenes compiladas desde el código fuente con plugins seleccionados](/es/install/docker#source-built-images-with-selected-plugins).
Los despliegues de archivo/dispositivo deben empaquetar el mismo código fuente integrado mediante su
propio proceso de artefactos, en lugar de consumir la imagen OCI.

## Preparación y prueba en vivo

Estas comprobaciones demuestran límites diferentes; no sustituya una por otra:

```bash
# Solo comprueba el estado del proceso de ClawRouter; no se utiliza ninguna credencial ni modelo ascendente.
curl -fsS https://clawrouter.internal.example/v1/health

# Solo comprueba la preparación del inicio del Gateway de OpenClaw; no se realiza ninguna llamada a un modelo.
curl -fsS http://127.0.0.1:18789/readyz

# Detección del catálogo limitado por credencial.
openclaw models list --all --provider clawrouter --json

# Prueba mínima de inferencia real mediante el proveedor ClawRouter configurado.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Prueba canario de la carga de trabajo mediante una referencia exacta de modelo concedida.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Responde exactamente: CLAWROUTER_CANARY_OK" \
  --json
```

Utilice un modelo devuelto por el catálogo con alcance limitado en lugar de copiar a ciegas el
modelo de ejemplo. Una respuesta correcta de `/readyz` significa que el Gateway puede atender
solicitudes; no afirma que ClawRouter, su credencial o un proveedor
ascendente estén preparados. La prueba del modelo y la prueba canario del agente son las pruebas de inferencia.

Para el diagnóstico en vivo, ejecute la prueba canario e inspeccione los registros estándar del Gateway.
Los diagnósticos existentes del transporte de modelos, que solo incluyen metadatos, emiten líneas con esta forma:

```text
[model-fetch] inicio proveedor=clawrouter api=openai-responses modelo=openai/gpt-5.5 método=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] respuesta proveedor=clawrouter api=openai-responses modelo=openai/gpt-5.5 estado=200
```

El plugin envía encabezados acotados `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` y
`X-ClawRouter-Session-Id` cuando esos identificadores están disponibles. También
asigna el `callId` de diagnóstico de la llamada al modelo (`<run-id>:model:<n>`) a
`X-Request-ID`, de modo que un evento de llamada a un modelo de OpenClaw pueda asociarse con el
registro de auditoría de ClawRouter que solo contiene metadatos. Los valores dentro del límite de 128 caracteres del identificador de solicitud son
idénticos. Los valores más largos conservan el sufijo `:model:<n>` y un hash
determinista para que las distintas llamadas permanezcan acotadas y puedan asociarse. Los metadatos estáticos del despliegue,
como `X-ClawRouter-Project-Id`, se pueden establecer en el mapa `headers` del proveedor.
Los encabezados de atribución de agente y sesión conservan su límite independiente de 256 caracteres.
Los identificadores de solicitud automáticos que contienen caracteres fuera del conjunto de identificadores ASCII de ClawRouter
utilizan la misma forma determinista y acotada.
Los encabezados configurados explícitamente, incluida cualquier variante de mayúsculas y minúsculas de `X-Request-ID`, tienen
prioridad sobre los valores automáticos. El diagnóstico del transporte registra los metadatos de enrutamiento y respuesta;
no registra credenciales, identificadores de solicitud, instrucciones ni respuestas generadas.
El propio evento de auditoría de ClawRouter proporciona el proveedor ascendente seleccionado y
el estado de conservación del contenido.

## Detección de modelos

`GET /v1/catalog` devuelve `{ providers: [...] }`, donde cada entrada de proveedor
enumera sus propios `models[]` (con identificador ascendente, capacidades y precios) y sus
rutas de solicitud compatibles. OpenClaw no incluye una segunda lista fija de
modelos de ClawRouter. Un modelo del catálogo se anuncia como modelo de OpenClaw cuando:

- la política de la credencial concede su proveedor;
- el modelo del catálogo anuncia una capacidad de LLM compatible (`llm.responses`,
  `llm.chat`, `llm.messages` o `llm.stream` con una ruta de transmisión
  coincidente); y
- el proveedor expone una ruta coincidente para uno de los transportes siguientes.

Añadir un modelo a un proveedor de ClawRouter compatible no requiere una versión nueva de OpenClaw:
la siguiente actualización del catálogo (almacenada en caché durante 60 segundos por alcance de credencial) lo
detecta. Un modelo que necesite un nuevo protocolo de comunicación requiere primero compatibilidad en el plugin.

## Plugins de protocolo y proveedor

ClawRouter gestiona las credenciales ascendentes; su catálogo indica a OpenClaw qué
transporte utilizar, por lo que nunca es necesario instalar el plugin de autenticación de cada empresa ascendente.

| Capacidad/ruta del catálogo                              | Transporte de OpenClaw |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (proveedor compatible con OpenAI)             | `openai-responses`     |
| `llm.chat` (proveedor compatible con OpenAI)                  | `openai-completions`   |
| `llm.messages` + ruta `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + ruta de transmisión `google.generate_content` | `google-generative-ai` |

El plugin también aplica las políticas coincidentes de reproducción y esquema de herramientas para esas
familias (compatibilidad de esquemas de herramientas de OpenAI/DeepSeek/Gemini/Perplexity; políticas de
reproducción nativas de Anthropic y Google Gemini). Los modelos de Perplexity reciben una reescritura estricta
del esquema: se eliminan `patternProperties` y `additionalProperties`, y
cada esquema de objeto declara `properties`, porque Perplexity rechaza los esquemas de herramientas
que no los incluyen. Un proveedor del catálogo que exponga únicamente un
formato de solicitud no compatible no se anuncia intencionadamente como modelo de
texto de OpenClaw. Normalice esos proveedores a uno de los contratos compatibles en
ClawRouter en lugar de enviar una carga incompatible.

## Cuotas y uso

La respuesta `/v1/usage` de ClawRouter alimenta las superficies habituales de uso de proveedores de
OpenClaw: totales de solicitudes, tokens y gasto, además de un periodo de presupuesto mensual cuando
la clave tiene un límite. Las claves sin medición siguen mostrando el uso agregado sin un
periodo porcentual.

La consulta de cuotas utiliza la misma clave con alcance limitado que la detección de modelos. Un error en la consulta de
cuotas no bloquea la ejecución del modelo.

Consulte la instantánea en vivo con:

```bash
openclaw status --usage
openclaw models status
```

La misma instantánea del proveedor está disponible para `/status` en el chat y en la
interfaz de uso de OpenClaw. El presupuesto se aplica a toda la política, por lo que las solicitudes realizadas por otro cliente que utilice
la misma política de ClawRouter pueden cambiar el porcentaje restante.

## Solución de problemas

| Síntoma                                  | Comprobación                                                                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No hay modelos de ClawRouter             | Confirme que el plugin esté habilitado y permitido por `plugins.allow`; después, compruebe que la credencial esté activa y conceda al menos un proveedor preparado. |
| Falta un modelo de ClawRouter configurado | Inspeccione su capacidad `/v1/catalog` y la compatibilidad de sus rutas. Los contratos de transporte no compatibles se filtran intencionadamente. |
| `Unknown model: clawrouter/...`          | Añada la referencia exacta del catálogo a `agents.defaults.models` cuando ese mapa de configuración se utilice como lista de permitidos. |
| `401` o `403` del catálogo o uso | Vuelva a emitir la credencial de ClawRouter o modifique su alcance; OpenClaw no recurre a claves de proveedores ascendentes. |
| La llamada al modelo falla tras la detección | Compruebe la conexión del proveedor y el estado del servicio ascendente en ClawRouter; después, vuelva a intentarlo cuando se recupere su estado de preparación. |
| El uso muestra totales, pero no un porcentaje | La política no tiene medición; añada un presupuesto mensual en ClawRouter para mostrar un periodo porcentual. |

## Comportamiento de seguridad

- El descubrimiento del catálogo se limita a la clave de proxy configurada y se almacena en caché por ámbito de credenciales (directorio del agente, directorio del espacio de trabajo, id del perfil de autenticación y URL base).
- La clave de proxy se adjunta únicamente al enviar la solicitud; no se almacena en los metadatos del modelo.
- Los valores de atribución automática y correlación de solicitudes se recortan y se rechazan si contienen caracteres de control antes del envío. Los valores de atribución están limitados a 256 caracteres; los ids de solicitud, a 128.
- Los diagnósticos de transporte del modelo solo contienen metadatos y nunca incluyen la clave de proxy ni el contenido del modelo.
- Los ids de modelos nativos de Anthropic y Gemini se reescriben con sus ids de origen únicamente al enviarse.
- Las filas del catálogo no compatibles o no autorizadas se rechazan de forma segura y no pueden seleccionarse.

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Configuración de proveedores y selección de modelos.
  </Card>
  <Card title="Seguimiento del uso" href="/es/concepts/usage-tracking" icon="chart-line">
    Superficies de uso y estado de OpenClaw.
  </Card>
</CardGroup>
