---
read_when:
    - Iniciar sesión en ClawHub
    - Uso de la CLI de ClawHub
    - Depuración de errores 401
summary: Inicio de sesión en ClawHub, tokens de API, inicio de sesión de CLI, almacenamiento de tokens y revocación.
x-i18n:
    generated_at: "2026-07-02T17:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticación

ClawHub usa GitHub para el inicio de sesión web. La CLI usa tokens de API de ClawHub creados
mediante esa cuenta con sesión iniciada.

## Inicio de sesión web

Usa GitHub para iniciar sesión en [clawhub.ai](https://clawhub.ai).

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden completar el inicio de sesión normal en ClawHub.
Si el inicio de sesión te devuelve a un estado sin sesión iniciada, es posible que tu cuenta no esté en buen
estado. Si tu cuenta fue bloqueada o deshabilitada, usa el
[formulario de apelación de ClawHub](https://appeals.openclaw.ai/) si crees que se trata de un
error.

## Inicio de sesión en la CLI

El flujo predeterminado de inicio de sesión en la CLI abre tu navegador:

```bash
clawhub login
clawhub whoami
```

Qué sucede:

1. La CLI inicia un servidor temporal de devolución de llamada en `127.0.0.1`.
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

Usa este flujo para servidores, tareas de CI o entornos solo de terminal.

Para shells remotos en los que puedes abrir un navegador en otro lugar, ejecuta:

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

Imprime el token almacenado para configurar CI con:

```bash
clawhub token
```

## Revocación

Puedes revocar tokens de API en la interfaz web de ClawHub.

Los tokens revocados, no válidos o ausentes devuelven `401 Unauthorized`. Inicia sesión de nuevo
con `clawhub login` o proporciona un token nuevo con `clawhub login --token`.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden seguir usando tokens de API existentes.
Si tu cuenta fue bloqueada o deshabilitada, usa el
[formulario de apelación de ClawHub](https://appeals.openclaw.ai/) si crees que se trata de un
error.
