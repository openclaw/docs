---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesitas configuración, estado y puertos aislados por Gateway
summary: Ejecuta varios Gateways de OpenClaw en un host (aislamiento, puertos y perfiles)
title: Múltiples gateways
x-i18n:
    generated_at: "2026-07-05T11:19:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La mayoría de las configuraciones necesitan un Gateway: un solo Gateway maneja varias conexiones de mensajería y agentes. Ejecuta Gateways separados con perfiles/puertos aislados solo cuando necesites un aislamiento más fuerte o redundancia (por ejemplo, un bot de rescate).

## Inicio rápido del bot de rescate

La configuración más simple para un bot de rescate:

- Mantén el bot principal en el perfil predeterminado.
- Ejecuta el bot de rescate en `--profile rescue`, con su propio token de bot de Telegram.
- Coloca el bot de rescate en un puerto base diferente, por ejemplo, `19789`.

Esto permite que el bot de rescate depure o aplique cambios de configuración si el bot principal está caído. Deja al menos 20 puertos entre puertos base para que los puertos derivados de navegador/CDP nunca colisionen.

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si tu bot principal ya se está ejecutando, eso suele ser todo lo que necesitas. Si la incorporación ya instaló el servicio de rescate, omite el último `gateway install`.

Durante `openclaw --profile rescue onboard`:

- Usa un token de bot de Telegram separado, dedicado a la cuenta de rescate (fácil de mantener solo para operadores, independiente de la instalación de canal/app del bot principal y una ruta de recuperación simple basada en DM).
- Mantén el nombre de perfil `rescue`.
- Usa un puerto base al menos 20 más alto que el del bot principal.
- Acepta el espacio de trabajo de rescate predeterminado a menos que ya administres uno tú mismo.

### Qué cambia `--profile rescue onboard`

`--profile rescue onboard` ejecuta el flujo normal de incorporación, pero escribe todo en un perfil separado, por lo que el bot de rescate obtiene sus propios:

- Archivo de perfil/configuración
- Directorio de estado
- Espacio de trabajo (predeterminado: `~/.openclaw/workspace-rescue`)
- Nombre de servicio administrado
- Puerto base (más puertos derivados)
- Token de bot de Telegram

Por lo demás, los mensajes son idénticos a los de la incorporación normal.

## Configuración general de múltiples Gateways

El mismo patrón de aislamiento funciona para cualquier par o grupo de Gateways en un host: da a cada Gateway adicional su propio perfil con nombre y puerto base:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Los perfiles con nombre en ambos lados también funcionan:

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

Usa el inicio rápido del bot de rescate para una vía de operador de respaldo; usa el patrón general de perfiles para varios Gateways de larga duración en diferentes canales, inquilinos, espacios de trabajo o roles operativos.

## Lista de comprobación de aislamiento

Mantén estos valores únicos por instancia de Gateway:

| Ajuste                       | Propósito                                      |
| ---------------------------- | ---------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Archivo de configuración por instancia         |
| `OPENCLAW_STATE_DIR`         | Sesiones, credenciales y cachés por instancia  |
| `agents.defaults.workspace`  | Raíz de espacio de trabajo por instancia       |
| `gateway.port` (o `--port`)  | Único por instancia                            |
| Puertos derivados de navegador/CDP | Ver abajo                               |

Compartir cualquiera de estos causa carreras de configuración y conflictos de puertos.

## Mapeo de puertos (derivados)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- Puerto del servicio de control del navegador = base + 2 (solo local loopback).
- El host de Canvas se sirve en el propio servidor HTTP del Gateway (el mismo puerto que `gateway.port`).
- Los puertos CDP de perfiles de navegador se asignan automáticamente desde `browser control port + 9` hasta `+ 108`.

Sobrescribe cualquiera de estos en la configuración o el entorno y debes mantenerlos únicos por instancia.

## Notas de navegador/CDP (error común)

- **No** fijes `browser.cdpUrl` al mismo valor en varias instancias.
- Cada instancia necesita su propio puerto de control del navegador y rango CDP (derivados de su puerto de Gateway).
- Para puertos CDP explícitos, establece `browser.profiles.<name>.cdpPort` por instancia.
- Para Chrome remoto, usa `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

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

- `gateway status --deep` detecta servicios launchd/systemd/schtasks obsoletos de instalaciones anteriores.
- El texto de advertencia de `gateway probe`, como `multiple reachable gateway identities detected`, se espera solo cuando ejecutas intencionalmente más de un gateway aislado, o cuando OpenClaw no puede demostrar que los destinos de sondeo alcanzables son el mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo gateway es un solo gateway con varios transportes, incluso cuando los puertos de transporte difieren.

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Bloqueo de Gateway](/es/gateway/gateway-lock)
- [Configuración](/es/gateway/configuration)
