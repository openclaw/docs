---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesita configuración/estado/puertos aislados por Gateway
summary: Ejecutar múltiples Gateways de OpenClaw en un solo host (aislamiento, puertos y perfiles)
title: Múltiples Gateways
x-i18n:
    generated_at: "2026-04-21T17:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Múltiples Gateways (mismo host)

La mayoría de las configuraciones deberían usar un solo Gateway porque un único Gateway puede gestionar múltiples conexiones de mensajería y agentes. Si necesita un aislamiento o redundancia más sólidos (por ejemplo, un bot de rescate), ejecute Gateways separados con perfiles y puertos aislados.

## Lista de verificación de aislamiento (obligatoria)

- `OPENCLAW_CONFIG_PATH` — archivo de configuración por instancia
- `OPENCLAW_STATE_DIR` — sesiones, credenciales y cachés por instancia
- `agents.defaults.workspace` — raíz de espacio de trabajo por instancia
- `gateway.port` (o `--port`) — único por instancia
- Los puertos derivados (browser/canvas) no deben superponerse

Si estos se comparten, tendrá condiciones de carrera en la configuración y conflictos de puertos.

## Recomendado: use el perfil predeterminado para principal y un perfil con nombre para rescate

Los perfiles aplican automáticamente alcance a `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` y agregan sufijos a los nombres de servicio. Para la mayoría de las configuraciones de bot de rescate, mantenga el bot principal en el perfil predeterminado y asigne solo al bot de rescate un perfil con nombre como `rescue`.

```bash
# principal (perfil predeterminado)
openclaw setup
openclaw gateway --port 18789

# rescate
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Servicios:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Si quiere que ambos Gateways usen perfiles con nombre, eso también funciona, pero no es obligatorio.

## Guía del bot de rescate

Configuración recomendada:

- mantenga el bot principal en el perfil predeterminado
- ejecute el bot de rescate con `--profile rescue`
- use un bot de Telegram completamente independiente para la cuenta de rescate
- mantenga el bot de rescate en un puerto base diferente, como `19001`

Esto mantiene el bot de rescate aislado del bot principal para que pueda depurar o aplicar cambios de configuración si el bot principal deja de funcionar. Deje al menos 20 puertos entre los puertos base para que los puertos derivados de browser/canvas/CDP nunca colisionen.

### Canal/cuenta de rescate recomendados

Para la mayoría de las configuraciones, use un bot de Telegram completamente independiente para el perfil de rescate.

Por qué Telegram:

- fácil de mantener solo para operadores
- token e identidad del bot separados
- independiente de la instalación del canal/aplicación del bot principal
- ruta de recuperación simple basada en DM cuando el bot principal no funciona

La parte importante es la independencia total: cuenta de bot separada, credenciales separadas, perfil de OpenClaw separado, espacio de trabajo separado y puerto separado.

### Flujo de instalación recomendado

Use esto como configuración predeterminada a menos que tenga una razón de peso para hacer otra cosa:

```bash
# Bot principal (perfil predeterminado, puerto 18789)
openclaw onboard
openclaw gateway install

# Bot de rescate (bot de Telegram separado, perfil separado, puerto 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Durante `openclaw --profile rescue onboard`:

- use el token del bot de Telegram separado
- mantenga el perfil `rescue`
- use un puerto base al menos 20 superior al del bot principal
- acepte el espacio de trabajo de rescate predeterminado, a menos que ya gestione uno usted mismo

Si el onboarding ya instaló el servicio de rescate por usted, el `gateway install` final no es necesario.

### Qué cambia el onboarding

`openclaw --profile rescue onboard` usa el flujo de onboarding normal, pero escribe todo en un perfil separado.

En la práctica, eso significa que el bot de rescate obtiene su propio:

- archivo de configuración
- directorio de estado
- espacio de trabajo (de forma predeterminada `~/.openclaw/workspace-rescue`)
- nombre de servicio administrado

Por lo demás, las indicaciones son las mismas que en el onboarding normal.

## Asignación de puertos (derivados)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- puerto del servicio de control del browser = base + 2 (solo loopback)
- el host de canvas se sirve en el servidor HTTP del Gateway (mismo puerto que `gateway.port`)
- los puertos CDP del perfil de browser se asignan automáticamente desde `browser.controlPort + 9 .. + 108`

Si sustituye cualquiera de estos en la configuración o el entorno, debe mantenerlos únicos por instancia.

## Notas sobre browser/CDP (error común)

- **No** fije `browser.cdpUrl` a los mismos valores en múltiples instancias.
- Cada instancia necesita su propio puerto de control de browser y rango de CDP (derivado de su puerto de gateway).
- Si necesita puertos CDP explícitos, configure `browser.profiles.<name>.cdpPort` por instancia.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

## Ejemplo manual con variables de entorno

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Verificaciones rápidas

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretación:

- `gateway status --deep` ayuda a detectar servicios launchd/systemd/schtasks obsoletos de instalaciones anteriores.
- El texto de advertencia de `gateway probe`, como `multiple reachable gateways detected`, es esperable solo cuando ejecuta intencionalmente más de un gateway aislado.
