---
read_when:
    - Se desea ajustar de forma interactiva las credenciales, los dispositivos o los valores predeterminados del agente
summary: Referencia de la CLI para `openclaw configure` (mensajes interactivos de configuración)
title: Configurar
x-i18n:
    generated_at: "2026-07-19T01:53:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5980d06e75a5df9e5269d0ef78431f730d6f5fd050dca74784ef3426fb0433d8
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Indicaciones interactivas para realizar cambios específicos en una configuración existente: credenciales, dispositivos, valores predeterminados del agente, Gateway, canales, plugins, Skills y comprobaciones de estado.

Use `openclaw onboard` o `openclaw setup` para completar todo el proceso guiado de la primera ejecución, `openclaw setup --baseline` solo para la configuración y el espacio de trabajo básicos, y `openclaw channels add` cuando únicamente necesite configurar una cuenta de canal.

<Tip>
`openclaw config` sin subcomandos abre el mismo asistente. Use `openclaw config get|set|unset` para realizar cambios no interactivos.
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

Al seleccionar `gateway`, `daemon` o `health` (o ejecutar el asistente completo sin `--section`), se solicita dónde se ejecuta el Gateway y se actualiza `gateway.mode`. Los filtros de secciones que omiten las tres opciones pasan directamente a la configuración solicitada sin preguntar por el modo del Gateway. Al elegir el modo de Gateway remoto, se escribe la configuración remota y se sale de inmediato; no se ejecutan pasos exclusivos del entorno local, como la instalación de plugins.

<Note>
`openclaw configure` requiere un terminal interactivo (tanto stdin como stdout deben ser TTY). Si no hay ninguno, muestra los comandos no interactivos `openclaw config get|set|patch|validate` equivalentes y finaliza con un error en lugar de ejecutarse parcialmente.
</Note>

## Sección de modelos

<Note>
**Modelo** incluye una selección múltiple para la lista explícita `agents.defaults.modelPolicy.allow` (lo que aparece en `/model` y en el selector de modelos). Las opciones de configuración específicas de cada proveedor combinan los modelos seleccionados con la lista existente, en lugar de reemplazar proveedores no relacionados que ya estén en la configuración. Los alias y parámetros de cada modelo permanecen en `agents.defaults.models`; por sí solas, esas entradas no restringen las sustituciones de modelos.

Al volver a ejecutar la autenticación del proveedor desde la configuración, se conserva un `agents.defaults.model.primary` existente, incluso cuando el paso de autenticación del proveedor devuelve un parche de configuración con su propio modelo predeterminado recomendado. Añadir un proveedor o volver a autenticarlo permite usar sus modelos sin sustituir el modelo principal actual. Use `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` para cambiar intencionadamente el modelo predeterminado.
</Note>

Cuando la configuración se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y de política de modelos dan preferencia automáticamente a ese proveedor. En el caso de proveedores emparejados como Volcengine y BytePlus, la misma preferencia también coincide con sus variantes de planes de programación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro del proveedor preferido generara una lista vacía, la configuración recurre al catálogo sin filtrar en lugar de mostrar un selector vacío.

## Sección web

`openclaw configure --section web` selecciona un proveedor de búsqueda web y configura sus credenciales. Algunos proveedores muestran pasos adicionales específicos:

- **Grok** puede ofrecer la configuración opcional de `x_search` con el mismo perfil OAuth de xAI o la misma clave de API, y permitir seleccionar un modelo `x_search`.
- **Kimi** puede solicitar la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otras notas

- Después de escribir la configuración local, el configurador instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere. La configuración del Gateway remoto no instala paquetes de plugins locales.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de canales o salas permitidos durante la configuración. Se pueden introducir nombres o identificadores; el asistente convierte los nombres en identificadores cuando es posible.
- Si se ejecuta el paso de instalación del daemon, la autenticación mediante token requiere un token. Si `gateway.auth.token` está gestionado mediante SecretRef, el configurador valida SecretRef, pero no almacena los valores de token de texto sin formato resueltos en los metadatos del entorno del servicio supervisor; si SecretRef no se puede resolver, el configurador bloquea la instalación del daemon y proporciona instrucciones prácticas para solucionarlo.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, el configurador bloquea la instalación del daemon hasta que se establezca el modo explícitamente.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
- CLI de configuración: [Configuración](/es/cli/config)
