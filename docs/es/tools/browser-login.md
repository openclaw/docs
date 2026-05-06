---
read_when:
    - Debes iniciar sesión en sitios para la automatización del navegador
    - Quieres publicar actualizaciones en X/Twitter
summary: Inicios de sesión manuales para la automatización del navegador + publicación en X/Twitter
title: Inicio de sesión en el navegador
x-i18n:
    generated_at: "2026-05-06T05:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Inicio de sesión manual (recomendado)

Cuando un sitio requiera iniciar sesión, **inicia sesión manualmente** en el perfil del navegador del **host** (el navegador openclaw).

**No** le des tus credenciales al modelo. Los inicios de sesión automatizados suelen activar defensas antibots y pueden bloquear la cuenta.

Volver a la documentación principal del navegador: [Navegador](/es/tools/browser).

## ¿Qué perfil de Chrome se usa?

OpenClaw controla un **perfil de Chrome dedicado** (llamado `openclaw`, con interfaz de tono naranja). Este está separado de tu perfil de navegador diario.

Para llamadas de herramientas del navegador del agente:

- Opción predeterminada: el agente debe usar su navegador `openclaw` aislado.
- Usa `profile="user"` solo cuando las sesiones iniciadas existentes importen y el usuario esté en el equipo para hacer clic/aprobar cualquier aviso de adjuntar.
- Si tienes varios perfiles de navegador de usuario, especifica el perfil explícitamente en lugar de adivinar.

Dos formas sencillas de acceder a él:

1. **Pídele al agente que abra el navegador** y luego inicia sesión tú mismo.
2. **Ábrelo mediante la CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Si tienes varios perfiles, pasa `--browser-profile <name>` (el valor predeterminado es `openclaw`).

## X/Twitter: flujo recomendado

- **Leer/buscar/hilos:** usa el navegador del **host** (inicio de sesión manual).
- **Publicar actualizaciones:** usa el navegador del **host** (inicio de sesión manual).

## Sandboxing + acceso al navegador del host

Las sesiones de navegador en sandbox tienen **más probabilidades** de activar la detección de bots. Para X/Twitter (y otros sitios estrictos), prefiere el navegador del **host**.

Si el agente está en sandbox, la herramienta de navegador usa el sandbox de forma predeterminada. Para permitir el control del host:

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

Luego apunta al navegador del host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

O desactiva el sandboxing para el agente que publica actualizaciones.

## Relacionado

- [Navegador](/es/tools/browser)
- [Solución de problemas de Browser Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas de Browser WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
