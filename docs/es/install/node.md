---
read_when:
    - Debes instalar Node.js antes de instalar OpenClaw
    - Has instalado OpenClaw, pero `openclaw` no se encuentra como comando
    - npm install -g falla por problemas de permisos o de PATH
summary: 'Instalar y configurar Node.js para OpenClaw: requisitos de versión, opciones de instalación y solución de problemas de PATH'
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw requiere **Node 22.16 o posterior**. **Node 24 es el runtime predeterminado y recomendado** para instalaciones, CI y flujos de trabajo de lanzamiento. Node 22 sigue siendo compatible a través de la línea LTS activa. El [script de instalación](/es/install#alternative-install-methods) detectará e instalará Node automáticamente; esta página es para cuando quieres configurar Node por tu cuenta y asegurarte de que todo esté conectado correctamente (versiones, PATH, instalaciones globales).

## Verifica tu versión

```bash
node -v
```

Si esto imprime `v24.x.x` o superior, estás usando el valor predeterminado recomendado. Si imprime `v22.16.x` o superior, estás en la ruta compatible de Node 22 LTS, pero aun así recomendamos actualizar a Node 24 cuando sea conveniente. Si Node no está instalado o la versión es demasiado antigua, elige un método de instalación a continuación.

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

<Accordion title="Uso de un gestor de versiones (nvm, fnm, mise, asdf)">
  Los gestores de versiones te permiten cambiar fácilmente entre versiones de Node. Opciones populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - ampliamente usado en macOS/Linux
- [**mise**](https://mise.jdx.dev/) - políglota (Node, Python, Ruby, etc.)

Ejemplo con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Asegúrate de que tu gestor de versiones esté inicializado en el archivo de inicio de tu shell (`~/.zshrc` o `~/.bashrc`). Si no lo está, puede que `openclaw` no se encuentre en nuevas sesiones de terminal porque PATH no incluirá el directorio bin de Node.
  </Warning>
</Accordion>

## Solución de problemas

### `openclaw: command not found`

Esto casi siempre significa que el directorio bin global de npm no está en tu PATH.

<Steps>
  <Step title="Encuentra tu prefijo global de npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Verifica si está en tu PATH">
    ```bash
    echo "$PATH"
    ```

    Busca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) en la salida.

  </Step>
  <Step title="Agrégalo al archivo de inicio de tu shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Agrega a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Luego abre una nueva terminal (o ejecuta `rehash` en zsh / `hash -r` en bash).
      </Tab>
      <Tab title="Windows">
        Agrega la salida de `npm prefix -g` al PATH del sistema mediante Configuración → Sistema → Variables de entorno.
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

Agrega la línea `export PATH=...` a tu `~/.bashrc` o `~/.zshrc` para hacerla permanente.

## Relacionado

- [Resumen de instalación](/es/install) - todos los métodos de instalación
- [Actualización](/es/install/updating) - mantener OpenClaw al día
- [Primeros pasos](/es/start/getting-started) - primeros pasos después de la instalación
