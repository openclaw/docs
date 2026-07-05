---
read_when:
    - Integración de la aplicación para Mac con el ciclo de vida del Gateway
summary: Ciclo de vida del Gateway en macOS (launchd)
title: Ciclo de vida de Gateway en macOS
x-i18n:
    generated_at: "2026-07-05T11:29:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

La app de macOS administra el Gateway mediante **launchd** de forma predeterminada y no
genera el Gateway como un proceso hijo. Primero intenta conectarse a un
Gateway que ya se esté ejecutando en el puerto configurado; si no hay ninguno accesible,
habilita el servicio de launchd mediante la CLI externa `openclaw` (sin runtime
integrado). Esto proporciona un inicio automático fiable al iniciar sesión y reinicio tras fallos.

El modo de proceso hijo (Gateway generado directamente por la app) **no está en uso**
actualmente. Si necesitas un acoplamiento más estrecho con la interfaz, ejecuta el Gateway manualmente en una
terminal.

## Comportamiento predeterminado (launchd)

- La app instala un LaunchAgent por usuario etiquetado como `ai.openclaw.gateway` (o
  `ai.openclaw.<profile>` cuando se usa `--profile`/`OPENCLAW_PROFILE`).
- Cuando el modo local está habilitado, la app garantiza que el LaunchAgent esté cargado e
  inicia el Gateway si es necesario.
- Los registros se escriben en la ruta de registros del gateway de launchd (visible en Configuración de depuración).

Comandos comunes:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Reemplaza la etiqueta por `ai.openclaw.<profile>` cuando ejecutes un perfil con nombre.

## Compilaciones de desarrollo sin firmar

`scripts/restart-mac.sh --no-sign` es para compilaciones locales rápidas sin claves
de firma. Para evitar que launchd apunte a un binario de retransmisión sin firmar, escribe
`~/.openclaw/disable-launchagent`.

Las ejecuciones firmadas de `scripts/restart-mac.sh` eliminan esta anulación si el marcador está
presente. Para restablecerlo manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo de solo conexión

Para forzar que la app de macOS nunca instale ni administre launchd, ejecútala con
`--attach-only` (o `--no-launchd`). Esto establece
`~/.openclaw/disable-launchagent`, de modo que la app solo se conecta a un Gateway que ya se esté
ejecutando. Activa o desactiva el mismo comportamiento en Configuración de depuración.

## Modo remoto

El modo remoto nunca inicia un Gateway local. La app usa un túnel SSH hacia el
host remoto y se conecta a través de ese túnel.

## Por qué preferimos launchd

- Inicio automático al iniciar sesión.
- Semántica integrada de reinicio/KeepAlive.
- Registros y supervisión predecibles.

Si alguna vez vuelve a ser necesario un verdadero modo de proceso hijo, debe documentarse como
un modo separado, explícito y solo para desarrollo.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [runbook del Gateway](/es/gateway)
