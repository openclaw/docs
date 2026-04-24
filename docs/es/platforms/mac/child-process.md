---
read_when:
    - Integrar la app de macOS con el ciclo de vida del Gateway
summary: Ciclo de vida del Gateway en macOS (launchd)
title: Ciclo de vida del Gateway
x-i18n:
    generated_at: "2026-04-24T05:38:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Ciclo de vida del Gateway en macOS

La app de macOS **gestiona el Gateway mediante launchd** de forma predeterminada y no inicia
el Gateway como proceso hijo. Primero intenta conectarse a un
Gateway ya en ejecución en el puerto configurado; si no puede alcanzar ninguno, habilita el servicio launchd
mediante la CLI externa `openclaw` (sin runtime integrado). Esto te da
un inicio automático fiable al iniciar sesión y reinicio en caso de fallos.

El modo de proceso hijo (Gateway iniciado directamente por la app) **no se usa** hoy.
Si necesitas un acoplamiento más estrecho con la UI, ejecuta el Gateway manualmente en una terminal.

## Comportamiento predeterminado (launchd)

- La app instala un LaunchAgent por usuario con la etiqueta `ai.openclaw.gateway`
  (o `ai.openclaw.<profile>` cuando se usa `--profile`/`OPENCLAW_PROFILE`; se admite el heredado `com.openclaw.*`).
- Cuando el modo local está habilitado, la app se asegura de que el LaunchAgent esté cargado e
  inicia el Gateway si es necesario.
- Los registros se escriben en la ruta de registro del Gateway de launchd (visible en Ajustes de depuración).

Comandos comunes:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sustituye la etiqueta por `ai.openclaw.<profile>` cuando ejecutes un perfil con nombre.

## Builds de desarrollo sin firmar

`scripts/restart-mac.sh --no-sign` es para builds locales rápidas cuando no tienes
claves de firma. Para evitar que launchd apunte a un binario relay sin firmar, hace esto:

- Escribe `~/.openclaw/disable-launchagent`.

Las ejecuciones firmadas de `scripts/restart-mac.sh` eliminan esta sobrescritura si el marcador
está presente. Para restablecerlo manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo solo conexión

Para forzar que la app de macOS **nunca instale ni gestione launchd**, iníciala con
`--attach-only` (o `--no-launchd`). Esto establece `~/.openclaw/disable-launchagent`,
de modo que la app solo se conecte a un Gateway que ya esté en ejecución. Puedes alternar el mismo
comportamiento en Ajustes de depuración.

## Modo remoto

El modo remoto nunca inicia un Gateway local. La app usa un túnel SSH al
host remoto y se conecta a través de ese túnel.

## Por qué preferimos launchd

- Inicio automático al iniciar sesión.
- Semántica integrada de reinicio/KeepAlive.
- Registros y supervisión predecibles.

Si alguna vez vuelve a ser necesario un verdadero modo de proceso hijo, debería documentarse como un
modo separado, explícito y solo para desarrollo.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Guía operativa del Gateway](/es/gateway)
