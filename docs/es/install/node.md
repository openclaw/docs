---
read_when:
    - Necesitas instalar Node.js antes de instalar OpenClaw
    - Instalaste OpenClaw pero `openclaw` no se encuentra como comando
    - '`npm install -g` falla con problemas de permisos o PATH'
summary: Instalar y configurar Node.js para OpenClaw — requisitos de versión, opciones de instalación y solución de problemas de PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T05:35:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw requiere **Node 22.14 o superior**. **Node 24 es el entorno de ejecución predeterminado y recomendado** para instalaciones, CI y flujos de publicación. Node 22 sigue siendo compatible a través de la línea LTS activa. El [script de instalación](/es/install#alternative-install-methods) detectará e instalará Node automáticamente; esta página es para cuando quieres configurar Node por tu cuenta y asegurarte de que todo esté conectado correctamente (versiones, PATH, instalaciones globales).

## Comprobar tu versión

```bash
node -v
```

Si esto imprime `v24.x.x` o superior, estás usando el valor predeterminado recomendado. Si imprime `v22.14.x` o superior, estás en la ruta compatible de Node 22 LTS, pero aun así recomendamos actualizar a Node 24 cuando te resulte conveniente. Si Node no está instalado o la versión es demasiado antigua, elige un método de instalación de abajo.

## Instalar Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recomendado):

    ```bash
    brew install node
    ```

    O descarga el instalador de macOS desde [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    O usa un administrador de versiones (ver más abajo).

  </Tab>
  <Tab title="Windows">
    **winget** (recomendado):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    O descarga el instalador de Windows desde [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Usar un administrador de versiones (nvm, fnm, mise, asdf)">
  Los administradores de versiones te permiten cambiar fácilmente entre versiones de Node. Opciones populares:

- [**fnm**](https://github.com/Schniz/fnm) — rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) — muy usado en macOS/Linux
- [**mise**](https://mise.jdx.dev/) — políglota (Node, Python, Ruby, etc.)

Ejemplo con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Asegúrate de que tu administrador de versiones esté inicializado en tu archivo de inicio del shell (`~/.zshrc` o `~/.bashrc`). Si no lo está, puede que `openclaw` no aparezca en nuevas sesiones de terminal porque PATH no incluirá el directorio bin de Node.
  </Warning>
</Accordion>

## Solución de problemas

### `openclaw: command not found`

Esto casi siempre significa que el directorio bin global de npm no está en tu PATH.

<Steps>
  <Step title="Buscar tu prefijo global de npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Comprobar si está en tu PATH">
    ```bash
    echo "$PATH"
    ```

    Busca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) en la salida.

  </Step>
  <Step title="Añadirlo a tu archivo de inicio del shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Añade a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Luego abre una terminal nueva (o ejecuta `rehash` en zsh / `hash -r` en bash).
      </Tab>
      <Tab title="Windows">
        Añade la salida de `npm prefix -g` a tu PATH del sistema mediante Configuración → Sistema → Variables de entorno.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errores de permisos en `npm install -g` (Linux)

Si ves errores `EACCES`, cambia el prefijo global de npm a un directorio donde tu usuario pueda escribir:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Añade la línea `export PATH=...` a tu `~/.bashrc` o `~/.zshrc` para que sea permanente.

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Actualización](/es/install/updating) — mantener OpenClaw al día
- [Primeros pasos](/es/start/getting-started) — primeros pasos después de instalar
