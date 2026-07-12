---
read_when:
    - Debes iniciar sesión en sitios web para la automatización del navegador
    - Quieres publicar actualizaciones en X/Twitter
summary: Inicios de sesión manuales para la automatización del navegador y la publicación en X/Twitter
title: Inicio de sesión en el navegador
x-i18n:
    generated_at: "2026-07-11T23:33:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Inicio de sesión manual (recomendado)

Cuando un sitio requiera iniciar sesión, hágalo manualmente en el perfil `openclaw`
del navegador del host. No proporcione sus credenciales al modelo: los inicios de sesión automatizados suelen
activar las defensas contra bots y pueden bloquear la cuenta.

Use el navegador del host (inicio de sesión manual) tanto para leer (búsquedas/hilos) como para
publicar en X/Twitter y otros sitios sensibles a los bots. Las sesiones de navegador aisladas
tienen más probabilidades de activar la detección de bots.

Volver a la documentación principal del navegador: [Navegador](/es/tools/browser).

## ¿Qué perfil de Chrome se utiliza?

OpenClaw controla un perfil de Chrome dedicado llamado `openclaw` (interfaz
con tonalidad naranja), separado de su perfil de navegador habitual.

Para las llamadas del agente a la herramienta del navegador:

- Opción predeterminada: el agente utiliza su navegador `openclaw` aislado.
- Use `profile="user"` únicamente cuando sean necesarias las sesiones existentes con la sesión iniciada y usted
  esté frente al equipo para hacer clic o aprobar cualquier solicitud de conexión.
- Si tiene varios perfiles de usuario del navegador, especifique el perfil explícitamente
  en lugar de elegir uno al azar.

Hay dos formas de acceder al perfil `openclaw`:

1. Pida al agente que abra el navegador y, a continuación, inicie sesión usted mismo.
2. Ábralo mediante la CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Para un perfil que no sea el predeterminado, coloque `--browser-profile <name>` antes del
subcomando (el valor predeterminado es `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Aislamiento: permitir el acceso al navegador del host

Si el agente está aislado, sus llamadas a la herramienta `browser` utilizan de forma predeterminada el navegador
del entorno aislado, no el del host. Para permitir que el agente utilice en su lugar el navegador del host:

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

Las invocaciones de la CLI siempre utilizan el navegador del host, nunca el del entorno aislado, por lo que puede
abrir usted mismo el navegador del host independientemente de esta configuración:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Una vez establecido `sandbox.browser.allowHostControl: true`, las llamadas del agente a la herramienta `browser`
también pueden utilizar el host. Como alternativa, desactive el aislamiento para el
agente que publica las actualizaciones.

## Temas relacionados

- [Navegador](/es/tools/browser)
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas del navegador en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
