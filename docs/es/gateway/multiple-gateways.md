---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Se necesitan configuración, estado y puertos aislados por Gateway
summary: Ejecutar varios Gateways de OpenClaw en un solo servidor (aislamiento, puertos y perfiles)
title: Múltiples Gateways
x-i18n:
    generated_at: "2026-04-30T05:42:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La mayoría de las configuraciones deberían usar un solo Gateway porque un único Gateway puede gestionar múltiples conexiones de mensajería y agentes. Si necesitas un aislamiento más fuerte o redundancia (p. ej., un bot de rescate), ejecuta Gateways separados con perfiles/puertos aislados.

## Mejor configuración recomendada

Para la mayoría de los usuarios, la configuración más sencilla de bot de rescate es:

- mantener el bot principal en el perfil predeterminado
- ejecutar el bot de rescate en `--profile rescue`
- usar un bot de Telegram completamente separado para la cuenta de rescate
- mantener el bot de rescate en un puerto base diferente, como `19789`

Esto mantiene el bot de rescate aislado del bot principal para que pueda depurar o aplicar
cambios de configuración si el bot principal está caído. Deja al menos 20 puertos entre
los puertos base para que los puertos derivados de navegador/canvas/CDP nunca colisionen.

## Inicio rápido del bot de rescate

Usa esto como ruta predeterminada salvo que tengas una razón de peso para hacer otra cosa:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si tu bot principal ya está en ejecución, normalmente eso es todo lo que necesitas.

Durante `openclaw --profile rescue onboard`:

- usa el token del bot de Telegram separado
- conserva el perfil `rescue`
- usa un puerto base al menos 20 más alto que el del bot principal
- acepta el espacio de trabajo de rescate predeterminado salvo que ya gestiones uno tú mismo

Si la incorporación ya instaló el servicio de rescate por ti, el `gateway install` final no es necesario.

## Por qué funciona esto

El bot de rescate se mantiene independiente porque tiene su propio:

- perfil/configuración
- directorio de estado
- espacio de trabajo
- puerto base (más los puertos derivados)
- token del bot de Telegram

Para la mayoría de las configuraciones, usa un bot de Telegram completamente separado para el perfil de rescate:

- fácil de mantener solo para operadores
- token e identidad de bot separados
- independiente de la instalación del canal/app del bot principal
- ruta sencilla de recuperación basada en DM cuando el bot principal está roto

## Qué cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa el flujo normal de incorporación, pero
escribe todo en un perfil separado.

En la práctica, eso significa que el bot de rescate obtiene su propio:

- archivo de configuración
- directorio de estado
- espacio de trabajo (por defecto `~/.openclaw/workspace-rescue`)
- nombre de servicio gestionado

Por lo demás, los avisos son los mismos que en la incorporación normal.

## Configuración general de múltiples Gateway

El diseño de bot de rescate anterior es el valor predeterminado más fácil, pero el mismo patrón
de aislamiento funciona para cualquier par o grupo de Gateways en un host.

Para una configuración más general, asigna a cada Gateway adicional su propio perfil con nombre y su
propio puerto base:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
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

Usa el inicio rápido del bot de rescate cuando quieras una vía de operador de respaldo. Usa el
patrón general de perfiles cuando quieras múltiples Gateways de larga duración para
distintos canales, inquilinos, espacios de trabajo o roles operativos.

## Lista de verificación de aislamiento

Mantén estos valores únicos por instancia de Gateway:

- `OPENCLAW_CONFIG_PATH` — archivo de configuración por instancia
- `OPENCLAW_STATE_DIR` — sesiones, credenciales y cachés por instancia
- `agents.defaults.workspace` — raíz del espacio de trabajo por instancia
- `gateway.port` (o `--port`) — único por instancia
- puertos derivados de navegador/canvas/CDP

Si estos se comparten, tendrás carreras de configuración y conflictos de puertos.

## Mapeo de puertos (derivado)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- puerto del servicio de control del navegador = base + 2 (solo loopback)
- el host de canvas se sirve en el servidor HTTP del Gateway (el mismo puerto que `gateway.port`)
- los puertos CDP del perfil de navegador se asignan automáticamente desde `browser.controlPort + 9 .. + 108`

Si sobrescribes cualquiera de estos en la configuración o el entorno, debes mantenerlos únicos por instancia.

## Notas de navegador/CDP (error común)

- **No** fijes `browser.cdpUrl` en los mismos valores en múltiples instancias.
- Cada instancia necesita su propio puerto de control del navegador y rango CDP (derivados de su puerto de gateway).
- Si necesitas puertos CDP explícitos, define `browser.profiles.<name>.cdpPort` por instancia.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

## Ejemplo manual de entorno

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
- el texto de advertencia de `gateway probe`, como `multiple reachable gateways detected`, solo es esperado cuando ejecutas intencionadamente más de un Gateway aislado.

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Bloqueo de Gateway](/es/gateway/gateway-lock)
- [Configuración](/es/gateway/configuration)
