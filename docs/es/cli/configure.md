---
read_when:
    - Quieres ajustar credenciales, dispositivos o valores predeterminados del agente de forma interactiva
summary: Referencia de la CLI para `openclaw configure` (indicaciones interactivas de configuración)
title: Configurar
x-i18n:
    generated_at: "2026-04-30T05:33:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Asistente interactivo para configurar credenciales, dispositivos y valores predeterminados de agentes.

<Note>
La sección **Modelo** incluye una selección múltiple para la lista permitida `agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos). Las opciones de configuración con ámbito de proveedor fusionan sus modelos seleccionados en la lista permitida existente en lugar de reemplazar proveedores no relacionados que ya están en la configuración. Volver a ejecutar la autenticación del proveedor desde la configuración conserva un `agents.defaults.model.primary` existente. Usa `openclaw models auth login --provider <id> --set-default` u `openclaw models set <model>` cuando quieras cambiar intencionalmente el modelo predeterminado.
</Note>

Cuando la configuración se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y lista permitida prefieren automáticamente ese proveedor. Para proveedores emparejados como Volcengine y BytePlus, la misma preferencia también coincide con sus variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro de proveedor preferido produciría una lista vacía, la configuración recurre al catálogo sin filtrar en lugar de mostrar un selector en blanco.

<Tip>
`openclaw config` sin un subcomando abre el mismo asistente. Usa `openclaw config get|set|unset` para ediciones no interactivas.
</Tip>

Para la búsqueda web, `openclaw configure --section web` te permite elegir un proveedor
y configurar sus credenciales. Algunos proveedores también muestran indicaciones de seguimiento
específicas del proveedor:

- **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y
  permitirte elegir un modelo `x_search`.
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

- Elegir dónde se ejecuta el Gateway siempre actualiza `gateway.mode`. Puedes seleccionar "Continuar" sin otras secciones si eso es todo lo que necesitas.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas permitidas de canales/salas durante la configuración. Puedes ingresar nombres o IDs; el asistente resuelve nombres a IDs cuando es posible.
- Si ejecutas el paso de instalación del daemon, la autenticación con token requiere un token y `gateway.auth.token` está administrado por SecretRef, la configuración valida el SecretRef pero no conserva valores de token en texto plano resueltos en los metadatos del entorno del servicio supervisor.
- Si la autenticación con token requiere un token y el SecretRef de token configurado no se puede resolver, la configuración bloquea la instalación del daemon con orientación de corrección aplicable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, la configuración bloquea la instalación del daemon hasta que el modo se establezca explícitamente.

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
