---
read_when:
    - Iniciar sesión en ClawHub
    - Uso de la CLI de ClawHub
    - Depuración de errores 401
summary: Inicio de sesión en ClawHub, tokens de API, inicio de sesión en la CLI, almacenamiento de tokens y revocación.
x-i18n:
    generated_at: "2026-05-12T15:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticación

ClawHub usa GitHub para el inicio de sesión web. La CLI usa tokens de API de ClawHub creados
mediante esa cuenta con sesión iniciada.

## Inicio de sesión web

Usa GitHub para iniciar sesión en [clawhub.ai](https://clawhub.ai).

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden completar el inicio de sesión normal de ClawHub.
Si el inicio de sesión te devuelve a un estado sin sesión iniciada, es posible que tu cuenta no esté en regla.

## Inicio de sesión en la CLI

El flujo predeterminado de inicio de sesión de la CLI abre tu navegador:

```bash
clawhub login
clawhub whoami
```

Qué sucede:

1. La CLI inicia un servidor de devolución de llamada temporal en `127.0.0.1`.
2. Tu navegador abre la página de inicio de sesión de ClawHub.
3. Después de iniciar sesión con GitHub, ClawHub crea un token de API.
4. El navegador redirige de vuelta a la devolución de llamada local.
5. La CLI almacena el token en tu archivo de configuración de ClawHub.

Si tu navegador no puede acceder a la devolución de llamada local debido a reglas de firewall, VPN o
proxy, usa el flujo de token sin interfaz gráfica.

## Inicio de sesión sin interfaz gráfica

Crea un token en la interfaz web de ClawHub y luego pásalo a la CLI:

```bash
clawhub login --token clh_...
```

Usa este flujo para servidores, trabajos de CI o entornos solo de terminal.

Para shells remotos donde puedes abrir un navegador en otro lugar, ejecuta:

```bash
clawhub login --device
```

La CLI imprime un código de un solo uso y espera mientras lo autorizas en
`https://clawhub.ai/cli/device`.

## Almacenamiento de tokens

Rutas de configuración predeterminadas:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Sobrescribe la ruta con:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## Revocación

Puedes revocar tokens de API en la interfaz web de ClawHub.

Los tokens revocados, no válidos o ausentes devuelven `401 Unauthorized`. Inicia sesión de nuevo
con `clawhub login` o proporciona un token nuevo con `clawhub login --token`.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden seguir usando tokens de API existentes.
