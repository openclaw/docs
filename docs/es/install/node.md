---
read_when:
    - Necesitas instalar Node.js antes de instalar OpenClaw
    - Instalaste OpenClaw, pero no se encuentra el comando `openclaw`
    - npm install -g falla por problemas de permisos o de PATH
summary: 'Instala y configura Node.js para OpenClaw: requisitos de versión, opciones de instalación y solución de problemas de PATH'
title: Node.js
x-i18n:
    generated_at: "2026-07-11T23:11:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw requiere **Node 22.19+, Node 23.11+ o Node 24+**. **Node 24 es el entorno de ejecución predeterminado y recomendado** para instalaciones, CI y flujos de trabajo de publicación; Node 22 sigue siendo compatible mediante la rama LTS activa. El [script de instalación](/es/install#alternative-install-methods) detecta e instala Node automáticamente; usa esta página cuando quieras configurar Node por tu cuenta (versiones, PATH, instalaciones globales).

## Comprobar la versión

```bash
node -v
```

`v24.x.x` o posterior es la opción predeterminada recomendada. `v22.19.x` o posterior es la versión compatible de la rama LTS de Node 22 (actualiza a Node 24 cuando te resulte conveniente). Las compilaciones de Node 23 anteriores a `v23.11.0` no son compatibles. Si Node no está instalado o su versión está fuera del intervalo compatible, elige uno de los métodos de instalación siguientes.

## Instalar Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recomendado):

    ```bash
    brew install node
    ```

    También puedes descargar el instalador para macOS desde [nodejs.org](https://nodejs.org/).

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

    También puedes usar un gestor de versiones (consulta la sección siguiente).

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

    También puedes descargar el instalador para Windows desde [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Uso de un gestor de versiones (nvm, fnm, mise, asdf)">
  Los gestores de versiones permiten cambiar fácilmente entre versiones de Node. Estas son algunas opciones populares:

- [**fnm**](https://github.com/Schniz/fnm): rápido y multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm): muy utilizado en macOS/Linux
- [**mise**](https://mise.jdx.dev/): compatible con varios lenguajes (Node, Python, Ruby, etc.)

Ejemplo con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Inicializa el gestor de versiones en el archivo de inicio del shell (`~/.zshrc` o `~/.bashrc`). Si omites este paso, es posible que no se encuentre `openclaw` en las nuevas sesiones de terminal porque PATH no incluirá el directorio de binarios de Node.
  </Warning>
</Accordion>

## Solución de problemas

### `openclaw: command not found`

Esto casi siempre significa que el directorio global de binarios de npm no está incluido en PATH.

<Steps>
  <Step title="Buscar el prefijo global de npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Comprobar si está incluido en PATH">
    ```bash
    echo "$PATH"
    ```

    Busca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) en la salida.

  </Step>
  <Step title="Añadirlo al archivo de inicio del shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Añade lo siguiente a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Después, abre una terminal nueva (o ejecuta `rehash` en zsh / `hash -r` en bash).
      </Tab>
      <Tab title="Windows">
        Añade la salida de `npm prefix -g` al PATH del sistema mediante Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errores de permisos al ejecutar `npm install -g` (Linux)

Si aparecen errores `EACCES`, cambia el prefijo global de npm a un directorio en el que el usuario tenga permisos de escritura:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Añade la línea `export PATH=...` a `~/.bashrc` o `~/.zshrc` para que el cambio sea permanente.

## Contenido relacionado

- [Descripción general de la instalación](/es/install): todos los métodos de instalación
- [Actualización](/es/install/updating): cómo mantener OpenClaw actualizado
- [Primeros pasos](/es/start/getting-started): pasos iniciales después de la instalación
