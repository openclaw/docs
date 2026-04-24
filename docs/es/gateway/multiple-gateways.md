---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesitas configuración/estado/puertos aislados por Gateway
summary: Ejecutar varios Gateways de OpenClaw en un mismo host (aislamiento, puertos y perfiles)
title: Varios gateways
x-i18n:
    generated_at: "2026-04-24T05:29:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Varios Gateways (mismo host)

La mayoría de las configuraciones deberían usar un solo Gateway porque un único Gateway puede gestionar múltiples conexiones de mensajería y agentes. Si necesitas un aislamiento o redundancia mayores (por ejemplo, un bot de rescate), ejecuta Gateways separados con perfiles/puertos aislados.

## Configuración mejor recomendada

Para la mayoría de los usuarios, la configuración más sencilla de bot de rescate es:

- mantener el bot principal en el perfil predeterminado
- ejecutar el bot de rescate con `--profile rescue`
- usar un bot de Telegram completamente separado para la cuenta de rescate
- mantener el bot de rescate en un puerto base diferente, como `19789`

Esto mantiene el bot de rescate aislado del bot principal para que pueda depurar o aplicar
cambios de configuración si el bot principal está caído. Deja al menos 20 puertos entre los
puertos base para que los puertos derivados de navegador/canvas/CDP nunca entren en conflicto.

## Inicio rápido del bot de rescate

Usa esta como ruta predeterminada a menos que tengas un motivo sólido para hacer otra cosa:

```bash
# Bot de rescate (bot de Telegram separado, perfil separado, puerto 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si tu bot principal ya se está ejecutando, normalmente esto es todo lo que necesitas.

Durante `openclaw --profile rescue onboard`:

- usa el token del bot de Telegram separado
- conserva el perfil `rescue`
- usa un puerto base al menos 20 superior al del bot principal
- acepta el espacio de trabajo de rescate predeterminado a menos que ya gestiones uno propio

Si la incorporación ya instaló por ti el servicio de rescate, no hace falta el
`gateway install` final.

## Por qué funciona

El bot de rescate permanece independiente porque tiene su propio:

- perfil/configuración
- directorio de estado
- espacio de trabajo
- puerto base (más puertos derivados)
- token del bot de Telegram

Para la mayoría de las configuraciones, usa un bot de Telegram completamente separado para el perfil de rescate:

- fácil de mantener solo para operadores
- token e identidad de bot separados
- independiente de la instalación de canal/app del bot principal
- ruta sencilla de recuperación basada en mensajes directos cuando el bot principal está roto

## Qué cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa el flujo normal de incorporación, pero
escribe todo en un perfil separado.

En la práctica, eso significa que el bot de rescate obtiene su propio:

- archivo de configuración
- directorio de estado
- espacio de trabajo (predeterminado `~/.openclaw/workspace-rescue`)
- nombre de servicio gestionado

Por lo demás, las solicitudes son las mismas que en una incorporación normal.

## Configuración general de varios Gateways

La distribución de bot de rescate de arriba es el valor predeterminado más sencillo, pero el mismo patrón
de aislamiento funciona para cualquier par o grupo de Gateways en un mismo host.

Para una configuración más general, da a cada Gateway extra su propio perfil con nombre y su
propio puerto base:

```bash
# principal (perfil predeterminado)
openclaw setup
openclaw gateway --port 18789

# gateway adicional
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si quieres que ambos Gateways usen perfiles con nombre, eso también funciona:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Los servicios siguen el mismo patrón:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa el inicio rápido del bot de rescate cuando quieras una vía alternativa para operadores. Usa el
patrón general de perfiles cuando quieras varios Gateways persistentes para
distintos canales, tenants, espacios de trabajo o roles operativos.

## Lista de comprobación de aislamiento

Mantén estos valores únicos por instancia de Gateway:

- `OPENCLAW_CONFIG_PATH` — archivo de configuración por instancia
- `OPENCLAW_STATE_DIR` — sesiones, credenciales, cachés por instancia
- `agents.defaults.workspace` — raíz del espacio de trabajo por instancia
- `gateway.port` (o `--port`) — único por instancia
- puertos derivados de navegador/canvas/CDP

Si se comparten, tendrás carreras de configuración y conflictos de puertos.

## Asignación de puertos (derivada)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- puerto del servicio de control del navegador = base + 2 (solo loopback)
- canvas host se sirve en el servidor HTTP del Gateway (mismo puerto que `gateway.port`)
- los puertos CDP del perfil del navegador se asignan automáticamente desde `browser.controlPort + 9 .. + 108`

Si sobrescribes cualquiera de estos valores en la configuración o el entorno, debes mantenerlos únicos por instancia.

## Notas sobre navegador/CDP (error común)

- **No** fijes `browser.cdpUrl` con los mismos valores en varias instancias.
- Cada instancia necesita su propio puerto de control del navegador y su propio rango CDP (derivado de su puerto de gateway).
- Si necesitas puertos CDP explícitos, establece `browser.profiles.<name>.cdpPort` por instancia.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

## Ejemplo manual con variables de entorno

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Comprobaciones rápidas

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
- El texto de advertencia de `gateway probe`, como `multiple reachable gateways detected`, es esperable solo cuando ejecutas intencionadamente más de un gateway aislado.

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Bloqueo de Gateway](/es/gateway/gateway-lock)
- [Configuración](/es/gateway/configuration)
