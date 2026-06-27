---
read_when:
    - Necesitas instalar Node.js antes de instalar OpenClaw
    - Instalaste OpenClaw, pero `openclaw` da el error de comando no encontrado
    - npm install -g falla por problemas de permisos o de PATH
summary: 'Instala y configura Node.js para OpenClaw: requisitos de versión, opciones de instalación y solución de problemas de PATH'
title: Node.js
x-i18n:
    generated_at: "2026-06-27T11:49:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw requiere **Node 22.19 o una versión más reciente**. **Node 24 es el runtime predeterminado y recomendado** para instalaciones, CI y flujos de lanzamiento. Node 22 sigue siendo compatible mediante la línea LTS activa. El [script de instalación](/es/install#alternative-install-methods) detectará e instalará Node automáticamente - esta página es para cuando quieres configurar Node por tu cuenta y asegurarte de que todo esté conectado correctamente (versiones, PATH, instalaciones globales).

## Comprueba tu versión

```bash
node -v
```

Si esto imprime `v24.x.x` o superior, estás usando el valor predeterminado recomendado. Si imprime `v22.19.x` o superior, estás usando la ruta compatible de Node 22 LTS, pero aun así recomendamos actualizar a Node 24 cuando sea conveniente. Si Node no está instalado o la versión es demasiado antigua, elige un método de instalación a continuación.

## Instala Node

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

    O usa un gestor de versiones (consulta abajo).

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Los gestores de versiones te permiten cambiar fácilmente entre versiones de Node. Opciones populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - muy usado en macOS/Linux
- [**mise**](https://mise.jdx.dev/) - políglota (Node, Python, Ruby, etc.)

Ejemplo con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Asegúrate de que tu gestor de versiones esté inicializado en el archivo de inicio de tu shell (`~/.zshrc` o `~/.bashrc`). Si no lo está, es posible que `openclaw` no se encuentre en nuevas sesiones de terminal porque PATH no incluirá el directorio bin de Node.
  </Warning>
</Accordion>

## Solución de problemas

### `openclaw: command not found`

Esto casi siempre significa que el directorio bin global de npm no está en tu PATH.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Busca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) en la salida.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Añade a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Luego abre una terminal nueva (o ejecuta `rehash` en zsh / `hash -r` en bash).
      </Tab>
      <Tab title="Windows">
        Añade la salida de `npm prefix -g` al PATH del sistema mediante Configuración → Sistema → Variables de entorno.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errores de permisos en `npm install -g` (Linux)

Si ves errores `EACCES`, cambia el prefijo global de npm a un directorio en el que el usuario pueda escribir:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Añade la línea `export PATH=...` a tu `~/.bashrc` o `~/.zshrc` para hacerla permanente.

## Relacionado

- [Descripción general de instalación](/es/install) - todos los métodos de instalación
- [Actualización](/es/install/updating) - mantener OpenClaw actualizado
- [Primeros pasos](/es/start/getting-started) - primeros pasos después de la instalación
