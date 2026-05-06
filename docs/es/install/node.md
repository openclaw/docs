---
read_when:
    - Debe instalar Node.js antes de instalar OpenClaw
    - Instalaste OpenClaw, pero no se encuentra el comando `openclaw`
    - npm install -g falla por problemas de permisos o de PATH
summary: Instalar y configurar Node.js para OpenClaw - requisitos de versión, opciones de instalación y resolución de problemas de PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-06T05:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

OpenClaw requiere **Node 22.14 o posterior**. **Node 24 es el runtime predeterminado y recomendado** para instalaciones, CI y flujos de trabajo de lanzamiento. Node 22 sigue siendo compatible mediante la línea LTS activa. El [script de instalación](/es/install#alternative-install-methods) detectará e instalará Node automáticamente; esta página es para cuando quieres configurar Node por tu cuenta y asegurarte de que todo esté conectado correctamente (versiones, PATH, instalaciones globales).

## Comprueba tu versión

```bash
node -v
```

Si esto muestra `v24.x.x` o superior, estás usando el valor predeterminado recomendado. Si muestra `v22.14.x` o superior, estás en la ruta compatible de Node 22 LTS, pero aun así recomendamos actualizar a Node 24 cuando sea conveniente. Si Node no está instalado o la versión es demasiado antigua, elige un método de instalación abajo.

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

<Accordion title="Usar un gestor de versiones (nvm, fnm, mise, asdf)">
  Los gestores de versiones te permiten cambiar entre versiones de Node fácilmente. Opciones populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - ampliamente usado en macOS/Linux
- [**mise**](https://mise.jdx.dev/) - políglota (Node, Python, Ruby, etc.)

Ejemplo con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Asegúrate de que tu gestor de versiones esté inicializado en el archivo de inicio de tu shell (`~/.zshrc` o `~/.bashrc`). Si no lo está, es posible que `openclaw` no se encuentre en sesiones nuevas de terminal porque PATH no incluirá el directorio bin de Node.
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
  <Step title="Comprueba si está en tu PATH">
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

        Luego abre una terminal nueva (o ejecuta `rehash` en zsh / `hash -r` en bash).
      </Tab>
      <Tab title="Windows">
        Agrega la salida de `npm prefix -g` a tu PATH del sistema mediante Configuración → Sistema → Variables de entorno.
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
- [Actualizar](/es/install/updating) - mantener OpenClaw actualizado
- [Primeros pasos](/es/start/getting-started) - primeros pasos después de la instalación
