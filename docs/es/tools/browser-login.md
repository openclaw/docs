---
read_when:
    - Necesitas iniciar sesión en sitios para automatización del navegador
    - Quieres publicar actualizaciones en X/Twitter
summary: Inicios de sesión manuales para automatización del navegador + publicación en X/Twitter
title: Inicio de sesión del navegador
x-i18n:
    generated_at: "2026-04-24T05:52:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# Inicio de sesión del navegador + publicación en X/Twitter

## Inicio de sesión manual (recomendado)

Cuando un sitio requiere inicio de sesión, **inicia sesión manualmente** en el perfil de navegador del **host** (el navegador openclaw).

No le des tus credenciales al modelo. Los inicios de sesión automatizados suelen activar defensas antibots y pueden bloquear la cuenta.

Vuelta a la documentación principal del navegador: [Browser](/es/tools/browser).

## ¿Qué perfil de Chrome se usa?

OpenClaw controla un **perfil dedicado de Chrome** (llamado `openclaw`, con interfaz en tono naranja). Está separado de tu perfil diario del navegador.

Para llamadas de la herramienta de navegador del agente:

- Opción predeterminada: el agente debe usar su navegador aislado `openclaw`.
- Usa `profile="user"` solo cuando importen sesiones ya iniciadas y el usuario esté delante del ordenador para hacer clic o aprobar cualquier prompt de conexión.
- Si tienes varios perfiles de navegador de usuario, especifica el perfil explícitamente en lugar de adivinar.

Dos formas sencillas de acceder a él:

1. **Pide al agente que abra el navegador** y luego inicia sesión tú mismo.
2. **Ábrelo mediante la CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Si tienes varios perfiles, pasa `--browser-profile <name>` (el predeterminado es `openclaw`).

## X/Twitter: flujo recomendado

- **Leer/buscar/hilos:** usa el navegador del **host** (inicio de sesión manual).
- **Publicar actualizaciones:** usa el navegador del **host** (inicio de sesión manual).

## Sandboxing + acceso al navegador del host

Las sesiones de navegador en sandbox tienen **más probabilidades** de activar detección de bots. Para X/Twitter (y otros sitios estrictos), prefiere el navegador del **host**.

Si el agente está en sandbox, la herramienta de navegador usa por defecto el sandbox. Para permitir control del host:

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

O deshabilita el sandboxing para el agente que publica actualizaciones.

## Relacionado

- [Browser](/es/tools/browser)
- [Solución de problemas de Browser en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas de Browser en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
