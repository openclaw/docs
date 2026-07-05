---
read_when:
    - Debes instalar Node.js antes de instalar OpenClaw
    - Instalaste OpenClaw, pero `openclaw` da comando no encontrado
    - La ejecución de npm install -g falla por problemas de permisos o de PATH
summary: 'Instala y configura Node.js para OpenClaw: requisitos de versión, opciones de instalación y solución de problemas de PATH'
title: Node.js
x-i18n:
    generated_at: "2026-07-05T11:24:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw requiere **Node 22.19+, Node 23.11+ o Node 24+**. **Node 24 es el runtime predeterminado y recomendado** para instalaciones, CI y flujos de trabajo de lanzamiento; Node 22 sigue siendo compatible mediante la línea LTS activa. El [script de instalación](/es/install#alternative-install-methods) detecta e instala Node automáticamente: usa esta página cuando quieras configurar Node por tu cuenta (versiones, PATH, instalaciones globales).

## Comprueba tu versión

```bash
node -v
```

`v24.x.x` o superior es el valor predeterminado recomendado. `v22.19.x` o superior es la ruta compatible para Node 22 LTS (actualiza a Node 24 cuando te convenga). Las compilaciones de Node 23 anteriores a `v23.11.0` no son compatibles. Si falta Node o está fuera del rango compatible, elige un método de instalación a continuación.

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

    O usa un gestor de versiones (ver abajo).

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

- [**fnm**](https://github.com/Schniz/fnm) - rápido y multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - ampliamente usado en macOS/Linux
- [**mise**](https://mise.jdx.dev/) - políglota (Node, Python, Ruby, etc.)

Ejemplo con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Inicializa tu gestor de versiones en el archivo de inicio de tu shell (`~/.zshrc` o `~/.bashrc`). Si omites esto, puede que `openclaw` no se encuentre en nuevas sesiones de terminal porque PATH no incluirá el directorio bin de Node.
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
  <Step title="Añádelo al archivo de inicio de tu shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Añádelo a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Luego abre una nueva terminal (o ejecuta `rehash` en zsh / `hash -r` en bash).
      </Tab>
      <Tab title="Windows">
        Añade la salida de `npm prefix -g` al PATH de tu sistema mediante Configuración → Sistema → Variables de entorno.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errores de permisos en `npm install -g` (Linux)

Si ves errores `EACCES`, cambia el prefijo global de npm a un directorio escribible por el usuario:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Añade la línea `export PATH=...` a tu `~/.bashrc` o `~/.zshrc` para que sea permanente.

## Relacionado

- [Descripción general de la instalación](/es/install) - todos los métodos de instalación
- [Actualización](/es/install/updating) - mantener OpenClaw actualizado
- [Primeros pasos](/es/start/getting-started) - primeros pasos después de instalar
