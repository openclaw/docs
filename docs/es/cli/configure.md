---
read_when:
    - Quieres ajustar las credenciales, los dispositivos o los valores predeterminados del agente de forma interactiva
summary: Referencia de la CLI para `openclaw configure` (solicitudes de configuración interactivas)
title: Configurar
x-i18n:
    generated_at: "2026-07-05T11:09:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Indicaciones interactivas para cambios específicos en una configuración existente: credenciales, dispositivos, valores predeterminados de agentes, Gateway, canales, plugins, Skills y comprobaciones de estado.

Usa `openclaw onboard` u `openclaw setup` para el recorrido guiado completo de primera ejecución, `openclaw setup --baseline` solo para la configuración/espacio de trabajo base, y `openclaw channels add` cuando solo necesites configurar una cuenta de canal.

<Tip>
`openclaw config` sin subcomando abre el mismo asistente. Usa `openclaw config get|set|unset` para ediciones no interactivas.
</Tip>

## Opciones

`--section <section>`: filtro de sección repetible. Secciones disponibles:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Seleccionar `gateway`, `daemon` o `health` (o ejecutar el asistente completo sin `--section`) pregunta dónde se ejecuta el Gateway y actualiza `gateway.mode`. Los filtros de sección que omiten las tres van directamente a la configuración solicitada sin preguntar por el modo de Gateway. Elegir el modo de Gateway remoto escribe la configuración remota y sale de inmediato; no ejecuta pasos solo locales como instalaciones de plugins.

<Note>
`openclaw configure` requiere una terminal interactiva (tanto stdin como stdout deben ser TTY). Sin una, imprime los comandos no interactivos equivalentes de `openclaw config get|set|patch|validate` y sale con un error en lugar de ejecutarse parcialmente.
</Note>

## Sección de modelo

<Note>
**Modelo** incluye una selección múltiple para la lista de permitidos `agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos). Las opciones de configuración con alcance de proveedor fusionan sus modelos seleccionados en la lista de permitidos existente en lugar de reemplazar proveedores no relacionados que ya estén en la configuración.

Volver a ejecutar la autenticación de proveedor desde configure conserva un `agents.defaults.model.primary` existente, incluso cuando el paso de autenticación del proveedor devuelve un parche de configuración con su propio modelo predeterminado recomendado. Añadir o volver a autenticar un proveedor hace que sus modelos estén disponibles sin tomar el control de tu modelo principal actual. Usa `openclaw models auth login --provider <id> --set-default` u `openclaw models set <model>` para cambiar intencionadamente el modelo predeterminado.
</Note>

Cuando configure se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y lista de permitidos prefieren automáticamente ese proveedor. Para proveedores emparejados como Volcengine y BytePlus, la misma preferencia también coincide con sus variantes de plan de programación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro de proveedor preferido produjera una lista vacía, configure vuelve al catálogo sin filtrar en lugar de mostrar un selector en blanco.

## Sección web

`openclaw configure --section web` elige un proveedor de búsqueda web y configura sus credenciales. Algunos proveedores muestran pasos de seguimiento específicos del proveedor:

- **Grok** puede ofrecer una configuración opcional de `x_search` con el mismo perfil OAuth de xAI o clave de API, y permitirte elegir un modelo de `x_search`.
- **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otras notas

- Después de escribir la configuración local, configure instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere. La configuración de Gateway remoto no instala paquetes de plugins locales.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de permitidos de canales/salas durante la configuración. Puedes introducir nombres o IDs; el asistente resuelve nombres a IDs cuando es posible.
- Si ejecutas el paso de instalación del daemon, la autenticación con token requiere un token. Si `gateway.auth.token` está gestionado por SecretRef, configure valida el SecretRef pero no persiste los valores de token en texto claro resueltos en los metadatos de entorno del servicio supervisor; si el SecretRef no está resuelto, configure bloquea la instalación del daemon con orientación de remediación accionable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, configure bloquea la instalación del daemon hasta que establezcas el modo explícitamente.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
- CLI de configuración: [Config](/es/cli/config)
