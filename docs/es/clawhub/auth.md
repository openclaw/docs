---
read_when:
    - Inicio de sesión en ClawHub
    - Uso de la CLI de ClawHub
    - Depuración de errores 401
summary: Inicio de sesión en ClawHub, tokens de API, inicio de sesión en la CLI, almacenamiento de tokens y revocación.
x-i18n:
    generated_at: "2026-07-16T11:28:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticación

ClawHub usa GitHub para iniciar sesión en la web. La CLI usa tokens de API de ClawHub creados
mediante esa cuenta con sesión iniciada.

## Inicio de sesión en la web

Use GitHub para iniciar sesión en [clawhub.ai](https://clawhub.ai).

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden completar el inicio de sesión normal en ClawHub.
Si, tras iniciar sesión, vuelve a aparecer con la sesión cerrada, es posible que su cuenta no esté en regla.
Si su cuenta fue bloqueada o deshabilitada, use el
[formulario de apelación de ClawHub](https://appeals.openclaw.ai/) si cree que se trata de un
error.

## Inicio de sesión en la CLI

El flujo predeterminado de inicio de sesión en la CLI abre el navegador:

```bash
clawhub login
clawhub whoami
```

Qué sucede:

1. La CLI inicia un servidor temporal de devolución de llamada en `127.0.0.1`.
2. El navegador abre la página de inicio de sesión de ClawHub.
3. Después de iniciar sesión en GitHub, ClawHub crea un token de API.
4. El navegador redirige a la devolución de llamada local.
5. La CLI almacena el token en el archivo de configuración de ClawHub.

Si el navegador no puede acceder a la devolución de llamada local debido a reglas del cortafuegos, la VPN o
el proxy, use el flujo de tokens sin interfaz gráfica.

## Inicio de sesión sin interfaz gráfica

Cree un token en la interfaz web de ClawHub y, a continuación, páselo a la CLI:

```bash
clawhub login --token clh_...
```

Use este flujo para servidores, trabajos de CI o entornos que solo disponen de terminal.

Para shells remotos en los que pueda abrir un navegador en otro lugar, ejecute:

```bash
clawhub login --device
```

La CLI muestra un código de un solo uso y espera mientras se autoriza en
`https://clawhub.ai/cli/device`.

## Almacenamiento de tokens

Rutas de configuración predeterminadas:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Para sustituir la ruta, use:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Para configurar la CI, muestre el token almacenado con:

```bash
clawhub token
```

## Revocación

Puede revocar los tokens de API en la interfaz web de ClawHub.

Los tokens revocados, no válidos o ausentes devuelven `401 Unauthorized`. Vuelva a iniciar sesión
con `clawhub login` o proporcione un token nuevo con `clawhub login --token`.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden seguir usando los tokens de API existentes.
Si su cuenta fue bloqueada o deshabilitada, use el
[formulario de apelación de ClawHub](https://appeals.openclaw.ai/) si cree que se trata de un
error.
