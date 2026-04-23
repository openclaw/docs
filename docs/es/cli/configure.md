---
read_when:
    - Quieres ajustar credenciales, dispositivos o valores predeterminados del agente de forma interactiva
summary: Referencia de CLI para `openclaw configure` (prompts de configuración interactiva)
title: configurar
x-i18n:
    generated_at: "2026-04-23T14:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interactivo para configurar credenciales, dispositivos y valores predeterminados del agente.

Nota: La sección **Model** ahora incluye una selección múltiple para la lista de permitidos
`agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos).
Las opciones de configuración con ámbito de proveedor fusionan sus modelos seleccionados en la
lista de permitidos existente en lugar de reemplazar proveedores no relacionados ya presentes en la configuración.

Cuando configure se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y
lista de permitidos priorizan ese proveedor automáticamente. Para proveedores emparejados como
Volcengine/BytePlus, la misma preferencia también coincide con sus variantes de
plan de programación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro de proveedor preferido
produjera una lista vacía, configure recurre al catálogo sin filtrar en lugar de mostrar un selector vacío.

Consejo: `openclaw config` sin un subcomando abre el mismo asistente. Usa
`openclaw config get|set|unset` para ediciones no interactivas.

Para búsqueda web, `openclaw configure --section web` te permite elegir un proveedor
y configurar sus credenciales. Algunos proveedores también muestran prompts
de seguimiento específicos del proveedor:

- **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y
  permitirte elegir un modelo de `x_search`.
- **Kimi** puede solicitar la región de API de Moonshot (`api.moonshot.ai` frente a
  `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

Relacionado:

- Referencia de configuración del Gateway: [Configuration](/es/gateway/configuration)
- CLI de configuración: [Config](/es/cli/config)

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

- Elegir dónde se ejecuta el Gateway siempre actualiza `gateway.mode`. Puedes seleccionar "Continue" sin otras secciones si eso es todo lo que necesitas.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de permitidos de canales/salas durante la configuración. Puedes introducir nombres o IDs; el asistente resuelve nombres a IDs cuando es posible.
- Si ejecutas el paso de instalación del daemon, la autenticación por token requiere un token, y `gateway.auth.token` se administra mediante SecretRef, configure valida el SecretRef pero no conserva valores de token en texto plano resueltos en los metadatos del entorno del servicio supervisor.
- Si la autenticación por token requiere un token y el SecretRef de token configurado no está resuelto, configure bloquea la instalación del daemon con orientación práctica para solucionarlo.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, configure bloquea la instalación del daemon hasta que el modo se establezca explícitamente.

## Ejemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
