---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesita configuración/estado/puertos aislados por cada Gateway
summary: Ejecutar varios Gateways de OpenClaw en un solo host (aislamiento, puertos y perfiles)
title: Múltiples Gateways
x-i18n:
    generated_at: "2026-06-27T11:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La mayoría de las configuraciones deberían usar un solo Gateway porque un único Gateway puede gestionar varias conexiones de mensajería y agentes. Si necesitas un aislamiento o redundancia más fuertes (por ejemplo, un bot de rescate), ejecuta Gateways separados con perfiles/puertos aislados.

## Mejor configuración recomendada

Para la mayoría de los usuarios, la configuración más sencilla de un bot de rescate es:

- mantener el bot principal en el perfil predeterminado
- ejecutar el bot de rescate en `--profile rescue`
- usar un bot de Telegram completamente separado para la cuenta de rescate
- mantener el bot de rescate en un puerto base diferente, como `19789`

Esto mantiene el bot de rescate aislado del bot principal para que pueda depurar o aplicar
cambios de configuración si el bot principal está caído. Deja al menos 20 puertos entre
los puertos base para que los puertos derivados de navegador/canvas/CDP nunca colisionen.

## Inicio rápido del bot de rescate

Usa esto como ruta predeterminada salvo que tengas una razón sólida para hacer otra cosa:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si tu bot principal ya se está ejecutando, normalmente eso es todo lo que necesitas.

Durante `openclaw --profile rescue onboard`:

- usa el token del bot de Telegram separado
- conserva el perfil `rescue`
- usa un puerto base al menos 20 superior al del bot principal
- acepta el espacio de trabajo de rescate predeterminado salvo que ya gestiones uno tú mismo

Si el onboarding ya instaló el servicio de rescate por ti, el
`gateway install` final no es necesario.

## Por qué funciona

El bot de rescate permanece independiente porque tiene su propio:

- perfil/configuración
- directorio de estado
- espacio de trabajo
- puerto base (más puertos derivados)
- token del bot de Telegram

Para la mayoría de las configuraciones, usa un bot de Telegram completamente separado para el perfil de rescate:

- fácil de mantener solo para operadores
- token e identidad del bot separados
- independiente de la instalación del canal/app del bot principal
- ruta sencilla de recuperación basada en DM cuando el bot principal está roto

## Qué cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa el flujo normal de onboarding, pero
escribe todo en un perfil separado.

En la práctica, eso significa que el bot de rescate obtiene sus propios:

- archivo de configuración
- directorio de estado
- espacio de trabajo (de forma predeterminada `~/.openclaw/workspace-rescue`)
- nombre de servicio administrado

Los prompts son, por lo demás, los mismos que en el onboarding normal.

## Configuración general de múltiples gateways

El diseño del bot de rescate anterior es el valor predeterminado más fácil, pero el mismo patrón de aislamiento
funciona para cualquier par o grupo de Gateways en un host.

Para una configuración más general, da a cada Gateway adicional su propio perfil con nombre y su
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

Usa el inicio rápido del bot de rescate cuando quieras una vía de operador de reserva. Usa el
patrón general de perfiles cuando quieras múltiples Gateways de larga duración para
diferentes canales, tenants, espacios de trabajo o roles operativos.

## Lista de comprobación de aislamiento

Mantén estos elementos únicos por cada instancia de Gateway:

- `OPENCLAW_CONFIG_PATH` — archivo de configuración por instancia
- `OPENCLAW_STATE_DIR` — sesiones, credenciales y cachés por instancia
- `agents.defaults.workspace` — raíz del espacio de trabajo por instancia
- `gateway.port` (o `--port`) — único por instancia
- puertos derivados de navegador/canvas/CDP

Si se comparten, tendrás carreras de configuración y conflictos de puertos.

## Mapeo de puertos (derivados)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- puerto del servicio de control del navegador = base + 2 (solo local loopback)
- el host canvas se sirve en el servidor HTTP del Gateway (el mismo puerto que `gateway.port`)
- los puertos CDP del perfil del navegador se asignan automáticamente desde `browser.controlPort + 9 .. + 108`

Si sobrescribes cualquiera de estos en la configuración o el entorno, debes mantenerlos únicos por instancia.

## Notas sobre navegador/CDP (error común)

- **No** fijes `browser.cdpUrl` a los mismos valores en varias instancias.
- Cada instancia necesita su propio puerto de control del navegador y rango CDP (derivados de su puerto de gateway).
- Si necesitas puertos CDP explícitos, define `browser.profiles.<name>.cdpPort` por instancia.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

## Ejemplo manual con env

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

- `gateway status --deep` ayuda a detectar servicios launchd/systemd/schtasks obsoletos de instalaciones antiguas.
- El texto de advertencia de `gateway probe`, como `multiple reachable gateway identities detected`, solo se espera cuando ejecutas intencionalmente más de un gateway aislado, o cuando OpenClaw no puede demostrar que los destinos de sondeo alcanzables son el mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo gateway es un gateway con múltiples transportes, incluso cuando los puertos de transporte difieren.

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Bloqueo de Gateway](/es/gateway/gateway-lock)
- [Configuración](/es/gateway/configuration)
