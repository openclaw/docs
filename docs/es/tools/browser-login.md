---
read_when:
    - Necesitas iniciar sesión en sitios para la automatización del navegador
    - Quieres publicar actualizaciones en X/Twitter
summary: Inicios de sesión manuales para automatización del navegador + publicación en X/Twitter
title: Inicio de sesión en el navegador
x-i18n:
    generated_at: "2026-07-05T11:45:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Inicio de sesión manual (recomendado)

Cuando un sitio requiera iniciar sesión, inicia sesión manualmente en el perfil
`openclaw` del navegador del host. No le des tus credenciales al modelo: los
inicios de sesión automatizados suelen activar defensas antibots y pueden
bloquear la cuenta.

Usa el navegador del host (inicio de sesión manual) tanto para leer (búsqueda/hilos) como para
publicar en X/Twitter y otros sitios sensibles a bots. Las sesiones de navegador en
sandbox tienen más probabilidades de activar la detección de bots.

Volver a la documentación principal del navegador: [Navegador](/es/tools/browser).

## ¿Qué perfil de Chrome se usa?

OpenClaw controla un perfil dedicado de Chrome llamado `openclaw` (interfaz con
tinte naranja), separado de tu perfil de navegador diario.

Para llamadas de herramienta de navegador del agente:

- Opción predeterminada: el agente usa su navegador `openclaw` aislado.
- Usa `profile="user"` solo cuando importen las sesiones existentes con sesión iniciada y tú
  estés en el equipo para hacer clic/aprobar cualquier solicitud de conexión.
- Si tienes varios perfiles de navegador de usuario, especifica el perfil explícitamente
  en lugar de adivinar.

Dos formas de acceder al perfil `openclaw`:

1. Pídele al agente que abra el navegador y luego inicia sesión tú mismo.
2. Ábrelo mediante la CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Para un perfil no predeterminado, coloca `--browser-profile <name>` antes del
subcomando (el valor predeterminado es `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandboxing: permitir el acceso al navegador del host

Si el agente está en sandbox, sus llamadas de herramienta `browser` usan de forma predeterminada el navegador de
sandbox, no el del host. Para permitir que el agente apunte al navegador del host en su lugar:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Las invocaciones de CLI siempre apuntan al navegador del host, nunca al sandbox, así que puedes
abrir el navegador del host tú mismo independientemente de este ajuste:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Una vez establecido `sandbox.browser.allowHostControl: true`, las llamadas de herramienta
`browser` del agente también pueden apuntar al host. Como alternativa, desactiva el sandboxing para el
agente que publica actualizaciones.

## Relacionado

- [Navegador](/es/tools/browser)
- [Solución de problemas de Browser en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas de Browser en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
