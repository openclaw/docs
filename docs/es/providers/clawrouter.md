---
read_when:
    - Se desea una única clave administrada para varios proveedores de modelos
    - Necesita el descubrimiento de modelos o los informes de cuota de ClawRouter en OpenClaw
summary: Enruta los modelos con alcance de credenciales mediante ClawRouter y muestra las cuotas administradas
title: ClawRouter
x-i18n:
    generated_at: "2026-07-19T02:03:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 929a93e8d1d003e21f792d0fdab9542553ffab374f59d4d0505819b0f719591f
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter proporciona a OpenClaw una clave con ámbito de política para varios proveedores
de modelos ascendentes. El plugin `clawrouter` incluido descubre únicamente los modelos permitidos
para esa clave, dirige cada modelo mediante su protocolo declarado e informa
del presupuesto de la clave y del uso agregado en las superficies de uso de OpenClaw.

Las credenciales ascendentes y el reenvío específico de cada proveedor permanecen en ClawRouter, por lo que
nunca es necesario instalar ni autenticar cada plugin de proveedor ascendente en el
host de OpenClaw. El plugin se incluye con OpenClaw (`enabledByDefault: true`);
solo se necesita una credencial emitida por ClawRouter.

| Propiedad     | Valor                                    |
| ------------- | ---------------------------------------- |
| Proveedor     | `clawrouter`                             |
| Plugin        | incluido (incluido en OpenClaw)           |
| Autenticación | `CLAWROUTER_API_KEY`                     |
| URL predeterminada | `https://clawrouter.openclaw.ai`         |
| Catálogo de modelos | Con ámbito de credencial mediante `/v1/catalog`      |
| Cuotas        | Presupuesto mensual y uso mediante `/v1/usage` |

## Primeros pasos

<Steps>
  <Step title="Obtener una credencial con ámbito">
    Solicite al administrador de ClawRouter una credencial cuya política incluya
    los proveedores, los modelos y el presupuesto mensual que se deban utilizar. Las credenciales se
    muestran una sola vez cuando se emiten.
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

    Utilice las referencias de modelo devueltas exactamente como se muestran. Conservan el espacio de nombres
    ascendente, como `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` o
    `clawrouter/google/gemini-3.5-flash`. Si `agents.defaults.modelPolicy.allow`
    está configurado, añada cada referencia seleccionada de ClawRouter.

  </Step>
  <Step title="Seleccionar un modelo">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    También se puede seleccionar un modelo devuelto para una ejecución mediante
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Despliegue administrado no interactivo

Mantenga la clave del proxy en la inyección de secretos de la carga de trabajo y almacene únicamente una
SecretRef en `openclaw.json`. Los campos administrados canónicos son:

| Finalidad     | Campo de configuración o entorno                                             |
| ------------- | ------------------------------------------------------------------------ |
| Origen del enrutador | `models.providers.clawrouter.baseUrl`                                    |
| Credencial    | `models.providers.clawrouter.apiKey` -> SecretRef de entorno                    |
| Valor del secreto | `CLAWROUTER_API_KEY` en el entorno del proceso del Gateway                  |
| Modelo predeterminado | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Etiqueta de carga de trabajo | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opcional) |

Por ejemplo, un controlador de despliegue puede ser propietario de este parche JSON5:

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
el entorno de ejecución raíz. Seleccione únicamente el plugin de canal que necesite empaquetado independiente,
como `OPENCLAW_EXTENSIONS=clickclack`, `slack` o `msteams`; consulte
[imágenes compiladas desde el código fuente con plugins seleccionados](/es/install/docker#source-built-images-with-selected-plugins).
Los despliegues de archivo/dispositivo deben empaquetar el mismo código fuente incorporado mediante su
propio Pipeline de artefactos, en lugar de consumir la imagen OCI.

## Preparación y prueba en vivo

Estas comprobaciones demuestran límites diferentes; no sustituya unas por otras:

```bash
# Solo comprueba el estado del proceso de ClawRouter; no se utiliza ninguna credencial ni modelo ascendente.
curl -fsS https://clawrouter.internal.example/v1/health

# Solo comprueba la preparación del inicio del Gateway de OpenClaw; no se realiza ninguna llamada a modelos.
curl -fsS http://127.0.0.1:18789/readyz

# Descubrimiento del catálogo con ámbito de credencial.
openclaw models list --all --provider clawrouter --json

# Prueba mínima de inferencia real mediante el proveedor ClawRouter configurado.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Prueba canaria de la carga de trabajo mediante una referencia exacta de modelo concedido.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Responde exactamente: CLAWROUTER_CANARY_OK" \
  --json
```

Utilice un modelo devuelto por el catálogo con ámbito en lugar de copiar a ciegas el modelo
del ejemplo. Una respuesta correcta de `/readyz` significa que el Gateway puede atender
solicitudes; no afirma que ClawRouter, su credencial o un proveedor
ascendente estén preparados. La prueba del modelo y la prueba canaria del agente son las pruebas de inferencia.

Para el diagnóstico en vivo, ejecute la prueba canaria e inspeccione los registros estándar del Gateway.
Los diagnósticos de transporte de modelos existentes, que solo contienen metadatos, emiten líneas con este formato:

```text
[model-fetch] inicio provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] respuesta provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

El plugin envía los encabezados delimitados `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` y
`X-ClawRouter-Session-Id` cuando esos identificadores están disponibles. También
asigna el `callId` de diagnóstico de la llamada al modelo (`<run-id>:model:<n>`) a
`X-Request-ID`, para que un evento de llamada a modelos de OpenClaw pueda vincularse con el
registro de auditoría de ClawRouter que solo contiene metadatos. Los valores dentro del presupuesto de 128 caracteres del identificador de solicitud son
idénticos. Los valores más largos conservan el sufijo `:model:<n>` y un hash
determinista para que las llamadas distintas sigan estando delimitadas y puedan vincularse. Los metadatos estáticos del despliegue,
como `X-ClawRouter-Project-Id`, se pueden establecer en el mapa `headers` del proveedor.
Los encabezados de atribución del agente y de la sesión conservan su límite independiente de 256 caracteres.
Los identificadores de solicitud automáticos que contienen caracteres fuera del conjunto de identificadores ASCII de ClawRouter
utilizan la misma forma determinista delimitada.
Los encabezados configurados explícitamente, incluida cualquier variante de mayúsculas y minúsculas de `X-Request-ID`, prevalecen
sobre los valores automáticos. El diagnóstico de transporte registra metadatos de enrutamiento y respuesta;
no registra credenciales, identificadores de solicitud, instrucciones ni respuestas generadas.
El propio evento de auditoría de ClawRouter proporciona el proveedor ascendente seleccionado y el
estado de conservación del contenido.

## Descubrimiento de modelos

`GET /v1/catalog` devuelve `{ providers: [...] }`, donde cada entrada de proveedor
enumera su propio `models[]` (con identificador ascendente, capacidades y precios) y sus
rutas de solicitud compatibles. OpenClaw no incluye una segunda lista fija de
modelos de ClawRouter. Un modelo del catálogo se anuncia como modelo de OpenClaw cuando:

- la política de la credencial concede acceso a su proveedor;
- el modelo del catálogo anuncia una capacidad LLM compatible (`llm.responses`,
  `llm.chat`, `llm.messages` o `llm.stream` con una ruta de transmisión
  coincidente); y
- el proveedor expone una ruta coincidente para uno de los transportes siguientes.

Añadir un modelo a un proveedor ClawRouter compatible no requiere una versión nueva de OpenClaw:
la siguiente actualización del catálogo (almacenada en caché durante 60 segundos por ámbito de credencial) lo descubre.
Un modelo que necesite un nuevo protocolo de conexión requiere primero compatibilidad en el plugin.

## Plugins de protocolo y proveedor

ClawRouter gestiona las credenciales ascendentes; su catálogo indica a OpenClaw qué
transporte utilizar, por lo que nunca es necesario instalar el plugin de autenticación de cada empresa ascendente.

| Capacidad/ruta del catálogo                              | Transporte de OpenClaw  |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (proveedor compatible con OpenAI)             | `openai-responses`     |
| `llm.chat` (proveedor compatible con OpenAI)                  | `openai-completions`   |
| `llm.messages` + ruta `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + ruta de transmisión `google.generate_content` | `google-generative-ai` |

El plugin también aplica las políticas coincidentes de reproducción y esquema de herramientas para esas
familias (compatibilidad de esquemas de herramientas de OpenAI/DeepSeek/Gemini/Perplexity; políticas nativas
de reproducción de Anthropic y Google Gemini). Los modelos de Perplexity reciben una reescritura estricta
del esquema: se eliminan `patternProperties` y `additionalProperties`, y
cada esquema de objeto declara `properties`, porque Perplexity rechaza los esquemas de herramientas
que no los incluyen. Un proveedor del catálogo que expone únicamente un
formato de solicitud no compatible no se anuncia intencionadamente como modelo de texto de OpenClaw.
Normalice esos proveedores a uno de los contratos compatibles en
ClawRouter, en lugar de enviar una carga incompatible.

## Cuotas y uso

La respuesta `/v1/usage` de ClawRouter alimenta las superficies normales de uso de proveedores
de OpenClaw: totales de solicitudes, tokens y gastos, además de un período de presupuesto mensual cuando
la clave tiene un límite. Las claves sin medición siguen mostrando el uso agregado sin un
período porcentual.

La consulta de cuotas utiliza la misma clave con ámbito que el descubrimiento de modelos. Un fallo en la consulta
de cuotas no bloquea la ejecución de modelos.

Compruebe la instantánea en vivo mediante:

```bash
openclaw status --usage
openclaw models status
```

La misma instantánea del proveedor está disponible para `/status` en el chat y en la
interfaz de uso de OpenClaw. El presupuesto abarca toda la política, por lo que las solicitudes realizadas por otro cliente que utilice
la misma política de ClawRouter pueden cambiar el porcentaje restante.

## Solución de problemas

| Síntoma                                  | Comprobación                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No hay modelos de ClawRouter             | Confirme que el plugin esté habilitado y permitido por `plugins.allow`; a continuación, compruebe que la credencial esté activa y conceda al menos un proveedor preparado. |
| Falta un modelo configurado de ClawRouter | Inspeccione su capacidad `/v1/catalog` y la compatibilidad de rutas. Los contratos de transporte no compatibles se filtran intencionadamente.                            |
| La política rechaza la sustitución del modelo | Añada la referencia exacta del catálogo o `clawrouter/*` a `agents.defaults.modelPolicy.allow`.                                                            |
| `401` o `403` del catálogo o del uso     | Vuelva a emitir la credencial de ClawRouter o cambie su ámbito; OpenClaw no recurre a claves de proveedores ascendentes.                                          |
| La llamada al modelo falla después del descubrimiento | Compruebe la conexión del proveedor y el estado ascendente en ClawRouter; a continuación, vuelva a intentarlo cuando se recupere su estado de preparación.                                |
| El uso muestra totales, pero no un porcentaje | La política no tiene medición; añada un presupuesto mensual en ClawRouter para mostrar un período porcentual.                                                     |

## Comportamiento de seguridad

- La detección del catálogo se limita a la clave de proxy configurada y se almacena en caché por ámbito de credenciales (directorio del agente, directorio del espacio de trabajo, id del perfil de autenticación y URL base).
- La clave de proxy se adjunta únicamente al enviar la solicitud; no se almacena en los metadatos del modelo.
- Los valores de atribución automática y correlación de solicitudes se recortan y se rechazan si contienen caracteres de control antes del envío. Los valores de atribución están limitados a 256 caracteres; los ids de solicitud, a 128.
- Los diagnósticos de transporte del modelo solo contienen metadatos y nunca incluyen la clave de proxy ni el contenido del modelo.
- Los ids de modelos nativos de Anthropic y Gemini se reescriben con sus ids de origen únicamente durante el envío.
- Las filas del catálogo no compatibles o no autorizadas adoptan un comportamiento cerrado ante fallos y no se pueden seleccionar.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Configuración de proveedores y selección de modelos.
  </Card>
  <Card title="Seguimiento del uso" href="/es/concepts/usage-tracking" icon="chart-line">
    Superficies de uso y estado de OpenClaw.
  </Card>
</CardGroup>
