---
read_when:
    - Integración de la aplicación de Mac con el ciclo de vida del Gateway
summary: Ciclo de vida del Gateway en macOS (launchd)
title: Ciclo de vida del Gateway en macOS
x-i18n:
    generated_at: "2026-05-06T05:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

La app de macOS **gestiona el Gateway mediante launchd** de forma predeterminada y no inicia
el Gateway como proceso hijo. Primero intenta adjuntarse a un Gateway que ya se está ejecutando
en el puerto configurado; si no hay ninguno accesible, habilita el servicio launchd
mediante la CLI externa `openclaw` (sin runtime integrado). Esto proporciona
inicio automático fiable al iniciar sesión y reinicio tras fallos.

El modo de proceso hijo (Gateway iniciado directamente por la app) **no está en uso** hoy.
Si necesitas un acoplamiento más estrecho con la UI, ejecuta el Gateway manualmente en una terminal.

## Comportamiento predeterminado (launchd)

- La app instala un LaunchAgent por usuario con la etiqueta `ai.openclaw.gateway`
  (o `ai.openclaw.<profile>` cuando se usa `--profile`/`OPENCLAW_PROFILE`; se admite el formato heredado `com.openclaw.*`).
- Cuando el modo local está habilitado, la app se asegura de que el LaunchAgent esté cargado e
  inicia el Gateway si es necesario.
- Los registros se escriben en la ruta de registro del gateway de launchd (visible en Configuración de depuración).

Comandos comunes:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Reemplaza la etiqueta por `ai.openclaw.<profile>` cuando ejecutes un perfil con nombre.

## Compilaciones de desarrollo sin firmar

`scripts/restart-mac.sh --no-sign` es para compilaciones locales rápidas cuando no tienes
claves de firma. Para impedir que launchd apunte a un binario relay sin firmar:

- Escribe `~/.openclaw/disable-launchagent`.

Las ejecuciones firmadas de `scripts/restart-mac.sh` eliminan esta anulación si el marcador está
presente. Para restablecer manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo solo adjuntar

Para forzar a la app de macOS a **no instalar ni gestionar launchd nunca**, iníciala con
`--attach-only` (o `--no-launchd`). Esto establece `~/.openclaw/disable-launchagent`,
por lo que la app solo se adjunta a un Gateway que ya esté en ejecución. Puedes alternar el mismo
comportamiento en Configuración de depuración.

## Modo remoto

El modo remoto nunca inicia un Gateway local. La app usa un túnel SSH hacia el
host remoto y se conecta a través de ese túnel.

## Por qué preferimos launchd

- Inicio automático al iniciar sesión.
- Semánticas integradas de reinicio/KeepAlive.
- Registros y supervisión predecibles.

Si alguna vez se vuelve a necesitar un verdadero modo de proceso hijo, debe documentarse como un
modo independiente y explícito solo para desarrollo.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Runbook del Gateway](/es/gateway)
