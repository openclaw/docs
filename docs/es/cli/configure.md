---
read_when:
    - Quieres ajustar credenciales, dispositivos o valores predeterminados del agente de forma interactiva
summary: Referencia de la CLI para `openclaw configure` (indicaciones de configuración interactiva)
title: Configurar
x-i18n:
    generated_at: "2026-05-02T05:21:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interactivo para configurar credenciales, dispositivos y valores predeterminados del agente.

<Note>
La sección **Modelo** incluye una selección múltiple para la lista de permitidos `agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos). Las opciones de configuración con ámbito de proveedor fusionan sus modelos seleccionados con la lista de permitidos existente, en lugar de reemplazar proveedores no relacionados que ya estén en la configuración.

Volver a ejecutar la autenticación del proveedor desde configure conserva un `agents.defaults.model.primary` existente, incluso cuando el paso de autenticación del proveedor devuelve un parche de configuración con su propio modelo predeterminado recomendado. Esto significa que añadir o volver a autenticar xAI, OpenRouter u otro proveedor debería hacer que el nuevo modelo esté disponible sin reemplazar tu modelo principal actual. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` cuando quieras cambiar intencionadamente el modelo predeterminado.
</Note>

Cuando configure se inicia desde una opción de autenticación de proveedor, los selectores de modelo predeterminado y lista de permitidos prefieren automáticamente ese proveedor. Para proveedores emparejados como Volcengine y BytePlus, la misma preferencia también coincide con sus variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro de proveedor preferido produjera una lista vacía, configure vuelve al catálogo sin filtrar en lugar de mostrar un selector en blanco.

<Tip>
`openclaw config` sin un subcomando abre el mismo asistente. Usa `openclaw config get|set|unset` para ediciones no interactivas.
</Tip>

Para la búsqueda web, `openclaw configure --section web` te permite elegir un proveedor
y configurar sus credenciales. Algunos proveedores también muestran prompts de seguimiento
específicos del proveedor:

- **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y
  permitirte elegir un modelo `x_search`.
- **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a
  `api.moonshot.cn`) y el modelo de búsqueda web predeterminado de Kimi.

Relacionado:

- Referencia de configuración de Gateway: [Configuración](/es/gateway/configuration)
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

- Elegir dónde se ejecuta el Gateway siempre actualiza `gateway.mode`. Puedes seleccionar "Continuar" sin otras secciones si eso es todo lo que necesitas.
- Después de escribir la configuración local, configure instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere. La configuración de Gateway remoto no instala paquetes de plugins locales.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de permitidos de canales/salas durante la configuración. Puedes introducir nombres o ID; el asistente resuelve los nombres a ID cuando es posible.
- Si ejecutas el paso de instalación del daemon, la autenticación por token requiere un token, y `gateway.auth.token` está gestionado por SecretRef, configure valida el SecretRef pero no persiste los valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
- Si la autenticación por token requiere un token y el SecretRef del token configurado no se puede resolver, configure bloquea la instalación del daemon con una guía de corrección accionable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, configure bloquea la instalación del daemon hasta que el modo se establezca explícitamente.

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
