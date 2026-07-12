---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesitas configuración, estado y puertos aislados para cada Gateway
summary: Ejecutar varios Gateways de OpenClaw en un mismo host (aislamiento, puertos y perfiles)
title: Varios Gateways
x-i18n:
    generated_at: "2026-07-11T23:06:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La mayoría de las configuraciones necesitan un Gateway: un solo Gateway gestiona múltiples conexiones de mensajería y agentes. Ejecuta Gateways separados con perfiles y puertos aislados únicamente cuando necesites mayor aislamiento o redundancia (por ejemplo, un bot de rescate).

## Inicio rápido del bot de rescate

La configuración más sencilla para un bot de rescate:

- Mantén el bot principal en el perfil predeterminado.
- Ejecuta el bot de rescate con `--profile rescue` y su propio token de bot de Telegram.
- Asigna al bot de rescate un puerto base diferente, por ejemplo, `19789`.

Esto permite que el bot de rescate depure o aplique cambios de configuración si el bot principal deja de funcionar. Deja al menos 20 puertos entre los puertos base para que los puertos derivados del navegador/CDP nunca entren en conflicto.

```bash
# Bot de rescate (bot de Telegram separado, perfil separado, puerto 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si tu bot principal ya está en ejecución, normalmente esto es todo lo que necesitas. Si la incorporación ya instaló el servicio de rescate, omite el último `gateway install`.

Durante `openclaw --profile rescue onboard`:

- Usa un token de bot de Telegram independiente, dedicado a la cuenta de rescate (fácil de restringir solo al operador, independiente de la instalación del canal o la aplicación del bot principal y una ruta sencilla de recuperación mediante mensajes directos).
- Conserva el nombre de perfil `rescue`.
- Usa un puerto base al menos 20 números mayor que el del bot principal.
- Acepta el espacio de trabajo de rescate predeterminado, a menos que ya administres uno por tu cuenta.

### Qué cambia `--profile rescue onboard`

`--profile rescue onboard` ejecuta el flujo normal de incorporación, pero escribe todo en un perfil separado, por lo que el bot de rescate obtiene sus propios elementos:

- Archivo de perfil/configuración
- Directorio de estado
- Espacio de trabajo (valor predeterminado: `~/.openclaw/workspace-rescue`)
- Nombre del servicio administrado
- Puerto base (además de los puertos derivados)
- Token de bot de Telegram

Por lo demás, las indicaciones son idénticas a las de la incorporación normal.

## Configuración general con varios Gateways

El mismo patrón de aislamiento funciona para cualquier par o grupo de Gateways en un host: asigna a cada Gateway adicional su propio perfil con nombre y puerto base:

```bash
# principal (perfil predeterminado)
openclaw setup
openclaw gateway --port 18789

# gateway adicional
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

También puedes usar perfiles con nombre en ambos casos:

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

Usa el inicio rápido del bot de rescate para disponer de una vía alternativa para el operador; usa el patrón general de perfiles para varios Gateways de larga duración en distintos canales, inquilinos, espacios de trabajo o roles operativos.

## Lista de comprobación del aislamiento

Mantén estos valores únicos para cada instancia de Gateway:

| Configuración                | Finalidad                                            |
| ---------------------------- | --------------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Archivo de configuración por instancia              |
| `OPENCLAW_STATE_DIR`         | Sesiones, credenciales y cachés por instancia       |
| `agents.defaults.workspace`  | Raíz del espacio de trabajo por instancia           |
| `gateway.port` (o `--port`)  | Único por instancia                                 |
| Puertos derivados del navegador/CDP | Consulta la información siguiente            |

Compartir cualquiera de estos elementos provoca condiciones de carrera en la configuración y conflictos de puertos.

## Asignación de puertos (derivados)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- Puerto del servicio de control del navegador = base + 2 (solo local loopback).
- El host de Canvas se sirve en el propio servidor HTTP del Gateway (el mismo puerto que `gateway.port`).
- Los puertos CDP de los perfiles del navegador se asignan automáticamente desde `browser control port + 9` hasta `+ 108`.

Si sobrescribes cualquiera de estos valores en la configuración o mediante variables de entorno, debes mantenerlos únicos para cada instancia.

## Notas sobre el navegador/CDP (error frecuente)

- **No** fijes `browser.cdpUrl` al mismo valor en varias instancias.
- Cada instancia necesita su propio puerto de control del navegador y su propio intervalo de CDP (derivados de su puerto de Gateway).
- Para usar puertos CDP explícitos, configura `browser.profiles.<name>.cdpPort` en cada instancia.
- Para usar Chrome remoto, configura `browser.profiles.<name>.cdpUrl` (por perfil y por instancia).

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

- `gateway status --deep` detecta servicios obsoletos de launchd/systemd/schtasks procedentes de instalaciones anteriores.
- Los textos de advertencia de `gateway probe`, como `multiple reachable gateway identities detected`, solo son esperables cuando ejecutas intencionadamente más de un Gateway aislado o cuando OpenClaw no puede demostrar que los destinos de sondeo accesibles corresponden al mismo Gateway. Un túnel SSH, una URL de proxy o una URL remota configurada para el mismo Gateway representan un solo Gateway con varios transportes, incluso cuando los puertos de transporte son diferentes.

## Contenido relacionado

- [Manual operativo del Gateway](/es/gateway)
- [Bloqueo del Gateway](/es/gateway/gateway-lock)
- [Configuración](/es/gateway/configuration)
