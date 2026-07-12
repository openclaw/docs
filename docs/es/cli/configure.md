---
read_when:
    - Quieres ajustar de forma interactiva las credenciales, los dispositivos o los valores predeterminados del agente
summary: Referencia de la CLI para `openclaw configure` (mensajes interactivos de configuración)
title: Configurar
x-i18n:
    generated_at: "2026-07-11T22:58:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Indicaciones interactivas para realizar cambios específicos en una configuración existente: credenciales, dispositivos, valores predeterminados del agente, Gateway, canales, plugins, Skills y comprobaciones de estado.

Use `openclaw onboard` o `openclaw setup` para completar todo el proceso guiado de la primera ejecución, `openclaw setup --baseline` solo para la configuración y el espacio de trabajo básicos, y `openclaw channels add` cuando únicamente necesite configurar una cuenta de canal.

<Tip>
`openclaw config` sin subcomando abre el mismo asistente. Use `openclaw config get|set|unset` para realizar modificaciones no interactivas.
</Tip>

## Opciones

`--section <section>`: filtro de secciones repetible. Secciones disponibles:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Al seleccionar `gateway`, `daemon` o `health` (o ejecutar el asistente completo sin `--section`), se solicita indicar dónde se ejecuta el Gateway y se actualiza `gateway.mode`. Los filtros de secciones que omiten las tres pasan directamente a la configuración solicitada sin preguntar por el modo del Gateway. Al elegir el modo de Gateway remoto, se escribe la configuración remota y se sale inmediatamente; no se ejecutan pasos exclusivamente locales, como la instalación de plugins.

<Note>
`openclaw configure` requiere un terminal interactivo (tanto stdin como stdout deben ser TTY). Sin uno, muestra los comandos no interactivos equivalentes `openclaw config get|set|patch|validate` y termina con un error en lugar de ejecutarse parcialmente.
</Note>

## Sección de modelos

<Note>
**Modelo** incluye una selección múltiple para la lista de permitidos `agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos). Las opciones de configuración específicas de un proveedor incorporan sus modelos seleccionados a la lista de permitidos existente, en lugar de reemplazar los proveedores no relacionados que ya estén en la configuración.

Volver a ejecutar la autenticación de un proveedor desde el asistente de configuración conserva el valor existente de `agents.defaults.model.primary`, incluso cuando el paso de autenticación del proveedor devuelve un parche de configuración con su propio modelo predeterminado recomendado. Añadir un proveedor o volver a autenticarlo hace que sus modelos estén disponibles sin sustituir el modelo principal actual. Use `openclaw models auth login --provider <id> --set-default` u `openclaw models set <model>` para cambiar intencionadamente el modelo predeterminado.
</Note>

Cuando el asistente de configuración se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y lista de permitidos dan preferencia automáticamente a ese proveedor. Para proveedores emparejados como Volcengine y BytePlus, la misma preferencia también coincide con sus variantes de planes de programación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro del proveedor preferido produjera una lista vacía, el asistente de configuración recurre al catálogo sin filtrar en lugar de mostrar un selector vacío.

## Sección web

`openclaw configure --section web` permite elegir un proveedor de búsqueda web y configurar sus credenciales. Algunos proveedores muestran opciones adicionales específicas:

- **Grok** puede ofrecer la configuración opcional de `x_search` con el mismo perfil OAuth de xAI o la misma clave de API, y permitirle elegir un modelo de `x_search`.
- **Kimi** puede solicitar la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otras notas

- Después de escribir la configuración local, el asistente instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere. La configuración de un Gateway remoto no instala paquetes de plugins locales.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de canales o salas permitidos durante la configuración. Puede introducir nombres o identificadores; el asistente convierte los nombres en identificadores cuando es posible.
- Si ejecuta el paso de instalación del daemon, la autenticación mediante token requiere un token. Si `gateway.auth.token` está administrado mediante SecretRef, el asistente valida la SecretRef, pero no guarda los valores resueltos del token en texto sin formato en los metadatos del entorno del servicio supervisor; si la SecretRef no puede resolverse, el asistente bloquea la instalación del daemon y proporciona instrucciones prácticas para corregir el problema.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, el asistente bloquea la instalación del daemon hasta que establezca explícitamente el modo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
- CLI de configuración: [Configuración](/es/cli/config)
