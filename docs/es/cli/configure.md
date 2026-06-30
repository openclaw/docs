---
read_when:
    - Quieres ajustar credenciales, dispositivos o valores predeterminados del agente de forma interactiva
summary: Referencia de la CLI para `openclaw configure` (indicaciones de configuración interactiva)
title: Configurar
x-i18n:
    generated_at: "2026-06-30T22:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Aviso interactivo para cambios específicos en una configuración existente: credenciales, dispositivos, valores predeterminados del agente, Gateway, canales, plugins, Skills y comprobaciones de estado.

Usa `openclaw onboard` u `openclaw setup` para el recorrido guiado completo de primera ejecución, `openclaw setup --baseline` solo para la configuración o el espacio de trabajo base, y `openclaw channels add` cuando solo necesites configurar una cuenta de canal.

<Note>
La sección **Modelo** incluye una selección múltiple para la lista de permitidos `agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos). Las opciones de configuración con alcance de proveedor fusionan sus modelos seleccionados en la lista de permitidos existente en lugar de reemplazar proveedores no relacionados que ya están en la configuración.

Volver a ejecutar la autenticación del proveedor desde configure conserva un `agents.defaults.model.primary` existente, incluso cuando el paso de autenticación del proveedor devuelve un parche de configuración con su propio modelo predeterminado recomendado. Eso significa que agregar o volver a autenticar xAI, OpenRouter u otro proveedor debería hacer que el nuevo modelo esté disponible sin reemplazar tu modelo principal actual. Usa `openclaw models auth login --provider <id> --set-default` u `openclaw models set <model>` cuando quieras cambiar intencionalmente el modelo predeterminado.
</Note>

Cuando configure se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y lista de permitidos prefieren automáticamente ese proveedor. Para proveedores emparejados como Volcengine y BytePlus, la misma preferencia también coincide con sus variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro de proveedor preferido produjera una lista vacía, configure recurre al catálogo sin filtrar en lugar de mostrar un selector en blanco.

<Tip>
`openclaw config` sin subcomando abre el mismo asistente. Usa `openclaw config get|set|unset` para ediciones no interactivas.
</Tip>

Para la búsqueda web, `openclaw configure --section web` te permite elegir un proveedor
y configurar sus credenciales. Algunos proveedores también muestran avisos de seguimiento
específicos del proveedor:

- **Grok** puede ofrecer una configuración opcional de `x_search` con el mismo perfil OAuth de xAI
  o clave de API, y permitirte elegir un modelo de `x_search`.
- **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a
  `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

Relacionado:

- Referencia de configuración de Gateway: [Configuración](/es/gateway/configuration)
- CLI de configuración: [Configuración](/es/cli/config)

## Opciones

- `--section <section>`: filtro de sección repetible

Secciones disponibles:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Notas:

- El asistente completo y las secciones relacionadas con Gateway preguntan dónde se ejecuta Gateway y actualizan `gateway.mode`. Los filtros de sección que no incluyen `gateway`, `daemon` ni `health` van directamente a la configuración solicitada.
- Después de escribir la configuración local, configure instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere. La configuración remota de Gateway no instala paquetes de plugins locales.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de permitidos de canales o salas durante la configuración. Puedes introducir nombres o ID; el asistente resuelve nombres a ID cuando es posible.
- Si ejecutas el paso de instalación del daemon, la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, configure valida el SecretRef pero no conserva los valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
- Si la autenticación con token requiere un token y el SecretRef de token configurado no se resuelve, configure bloquea la instalación del daemon con orientación práctica para corregirlo.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, configure bloquea la instalación del daemon hasta que el modo se defina explícitamente.

## Ejemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
