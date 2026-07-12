---
read_when:
    - Quieres entender `openclaw.ai/install.sh`
    - Quieres automatizar las instalaciones (CI/sin interfaz gráfica)
    - Quieres instalar desde una copia de trabajo de GitHub
summary: Cómo funcionan los scripts de instalación (install.sh, install-cli.sh, install.ps1), las opciones y la automatización
title: Aspectos internos del instalador
x-i18n:
    generated_at: "2026-07-11T23:12:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw incluye tres scripts de instalación, servidos desde `openclaw.ai`.

| Script                             | Plataforma           | Qué hace                                                                                                      |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node si es necesario, instala OpenClaw mediante npm (opción predeterminada) o git y puede ejecutar la configuración inicial. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node y OpenClaw en un prefijo local (`~/.openclaw`) mediante npm o git. No requiere acceso root.      |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node si es necesario, instala OpenClaw mediante npm (opción predeterminada) o git y puede ejecutar la configuración inicial. |

Los tres admiten Node **22.19+, 23.11+ o 24+**; Node 24 es el objetivo predeterminado para instalaciones nuevas.

## Comandos rápidos

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Si la instalación se completa correctamente, pero no se encuentra `openclaw` en una terminal nueva, consulta la [solución de problemas de Node.js](/es/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para la mayoría de las instalaciones interactivas en macOS/Linux/WSL.
</Tip>

### Flujo (install.sh)

<Steps>
  <Step title="Detectar el sistema operativo">
    Admite macOS y Linux (incluido WSL).
  </Step>
  <Step title="Garantizar Node.js 24 de forma predeterminada">
    Comprueba la versión de Node e instala Node 24 si es necesario (Homebrew en macOS y scripts de configuración de NodeSource en Linux con apt/dnf/yum). En macOS, Homebrew solo se instala cuando el instalador lo necesita para Node o Git. Node 22.19+ y 23.11+ siguen siendo compatibles.
    En Alpine/Linux con musl, el instalador utiliza paquetes de apk en lugar de NodeSource; los repositorios de Alpine configurados deben proporcionar una versión compatible de Node (Alpine 3.21 o posterior en el momento de redactar este documento).
  </Step>
  <Step title="Garantizar Git">
    Instala Git si falta mediante el gestor de paquetes detectado, incluidos Homebrew en macOS y apk en Alpine.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global con npm
    - Método `git`: clona/actualiza el repositorio, instala las dependencias con pnpm, compila y después instala el lanzador en `~/.local/bin/openclaw`

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Localiza el binario `openclaw` recién instalado para los comandos posteriores
    - En una instalación sin configurar, inicia la configuración inicial antes de las comprobaciones de doctor o del Gateway. Con `--no-onboard` o sin TTY, muestra el comando para finalizar la configuración más adelante.
    - En una instalación configurada, actualiza y reinicia, en la medida de lo posible, un servicio de Gateway cargado y ejecuta doctor. Las actualizaciones ponen al día los plugins cuando es posible o muestran el comando manual en una ejecución sin interfaz con las solicitudes habilitadas.
    - Cuando se ejecuta `--verify`, comprueba la versión instalada y verifica el estado del Gateway únicamente si ya existe una configuración.

  </Step>
</Steps>

### Detección de una copia de trabajo del código fuente

Si se ejecuta dentro de una copia de trabajo de OpenClaw (`package.json` + `pnpm-workspace.yaml`), el script ofrece:

- usar la copia de trabajo (`git`), o
- usar la instalación global (`npm`)

Si no hay ninguna TTY disponible y no se ha establecido un método de instalación, utiliza `npm` de forma predeterminada y muestra una advertencia.

El script finaliza con el código `2` cuando se selecciona un método no válido o se proporcionan valores no válidos para `--install-method`.

### Ejemplos (install.sh)

<Tabs>
  <Tab title="Predeterminado">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Omitir la configuración inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalación con Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Copia de trabajo de la rama principal de GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Simulación">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verificar después de la instalación">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de opciones">

| Opción                                  | Descripción                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Elige el método de instalación (predeterminado: `npm`)                                              |
| `--npm`                                 | Atajo para el método npm                                                                            |
| `--git \| --github`                     | Atajo para el método git                                                                            |
| `--version <version\|dist-tag\|spec>`   | Versión de npm, etiqueta de distribución o especificación del paquete (predeterminado: `latest`)    |
| `--beta`                                | Usa la etiqueta de distribución beta si está disponible; de lo contrario, recurre a `latest`       |
| `--git-dir \| --dir <path>`             | Directorio de la copia de trabajo (predeterminado: `~/openclaw`)                                    |
| `--no-git-update`                       | Omite `git pull` en una copia de trabajo existente                                                  |
| `--no-prompt`                           | Desactiva las solicitudes                                                                            |
| `--no-onboard`                          | Omite la configuración inicial                                                                       |
| `--onboard`                             | Habilita la configuración inicial                                                                    |
| `--verify`                              | Ejecuta una verificación rápida posterior a la instalación (`--version` y estado del Gateway si está cargado) |
| `--dry-run`                             | Muestra las acciones sin aplicar cambios                                                             |
| `--verbose`                             | Habilita la salida de depuración (`set -x` y registros de npm con nivel notice)                      |
| `--help \| -h`                          | Muestra el uso                                                                                        |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                          | Descripción                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalación                                                                               |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versión de npm, etiqueta de distribución o especificación del paquete                              |
| `OPENCLAW_BETA=0\|1`                              | Usa la versión beta si está disponible                                                              |
| `OPENCLAW_HOME=<path>`                            | Directorio base para el estado de OpenClaw y las rutas predeterminadas de git/configuración inicial |
| `OPENCLAW_GIT_DIR=<path>`                         | Directorio de la copia de trabajo                                                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Activa o desactiva las actualizaciones de git                                                       |
| `OPENCLAW_NO_PROMPT=1`                            | Desactiva las solicitudes                                                                            |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Ejecuta la verificación rápida posterior a la instalación                                           |
| `OPENCLAW_NO_ONBOARD=1`                           | Omite la configuración inicial                                                                       |
| `OPENCLAW_DRY_RUN=1`                              | Modo de simulación                                                                                    |
| `OPENCLAW_VERBOSE=1`                              | Modo de depuración                                                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Nivel de registro de npm (predeterminado: `error`; oculta el ruido de obsolescencia de npm)          |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Diseñado para entornos en los que se desea mantener todo bajo un prefijo local
(`~/.openclaw` de forma predeterminada) y sin depender de una instalación de Node en el sistema. Admite instalaciones mediante npm
de forma predeterminada, además de instalaciones desde una copia de trabajo de git con el mismo flujo de prefijo.
</Info>

### Flujo (install-cli.sh)

<Steps>
  <Step title="Instalar el entorno de ejecución local de Node">
    Descarga un archivo tar de una versión LTS compatible y fijada de Node (la versión está integrada en el script y se actualiza de forma independiente; el valor predeterminado es `22.22.2`) en `<prefix>/tools/node-v<version>` y verifica su SHA-256.
    En Alpine/Linux con musl, donde Node no publica archivos tar compatibles para el entorno de ejecución fijado, instala `nodejs` y `npm` con `apk` y enlaza ese entorno de ejecución con la ruta del lanzador del prefijo. Los repositorios de Alpine deben proporcionar una versión compatible de Node (22.19+, 23.11+ o 24+); utiliza Alpine 3.21 o posterior si los repositorios más antiguos solo proporcionan Node 20 o 21.
  </Step>
  <Step title="Garantizar Git">
    Si falta Git, intenta instalarlo mediante apt/dnf/yum/apk en Linux o Homebrew en macOS.
  </Step>
  <Step title="Instalar OpenClaw bajo el prefijo">
    - Método `npm` (predeterminado): instala bajo el prefijo mediante npm y después escribe el lanzador en `<prefix>/bin/openclaw`
    - Método `git`: clona/actualiza una copia de trabajo (`~/openclaw` de forma predeterminada) y también escribe el lanzador en `<prefix>/bin/openclaw`

  </Step>
  <Step title="Actualizar el servicio de Gateway cargado">
    Si ya hay un servicio de Gateway cargado desde ese mismo prefijo, el script ejecuta
    `openclaw gateway install --force`, después `openclaw gateway restart` y
    comprueba el estado del Gateway en la medida de lo posible.
  </Step>
</Steps>

### Ejemplos (install-cli.sh)

<Tabs>
  <Tab title="Predeterminado">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefijo y versión personalizados">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalación con Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Salida JSON para automatización">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Ejecutar la configuración inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de opciones">

| Opción                                  | Descripción                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--prefix <path>`                       | Prefijo de instalación (valor predeterminado: `~/.openclaw`)                                     |
| `--install-method \| --method npm\|git` | Elige el método de instalación (valor predeterminado: `npm`)                                     |
| `--npm`                                 | Atajo para el método npm                                                                         |
| `--git \| --github`                     | Atajo para el método git                                                                         |
| `--git-dir \| --dir <path>`             | Directorio de checkout de Git (valor predeterminado: `~/openclaw`)                               |
| `--version <ver>`                       | Versión o etiqueta de distribución de OpenClaw (valor predeterminado: `latest`)                  |
| `--node-version <ver>`                  | Versión de Node (valor predeterminado: `22.22.2`)                                                |
| `--json`                                | Emite eventos NDJSON                                                                             |
| `--onboard`                             | Ejecuta `openclaw onboard` después de la instalación                                             |
| `--no-onboard`                          | Omite la incorporación (valor predeterminado)                                                    |
| `--set-npm-prefix`                      | En Linux, fuerza el prefijo de npm a `~/.npm-global` si no se puede escribir en el prefijo actual |
| `--help \| -h`                          | Muestra el modo de uso                                                                           |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                    | Descripción                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefijo de instalación                                                      |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalación                                                       |
| `OPENCLAW_VERSION=<ver>`                    | Versión o etiqueta de distribución de OpenClaw                              |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versión de Node                                                             |
| `OPENCLAW_HOME=<path>`                      | Directorio base para el estado de OpenClaw y las rutas predeterminadas de git e incorporación |
| `OPENCLAW_GIT_DIR=<path>`                   | Directorio de checkout de Git para instalaciones mediante git               |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activa o desactiva las actualizaciones de git para checkouts existentes     |
| `OPENCLAW_NO_ONBOARD=1`                     | Omite la incorporación                                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nivel de registro de npm (valor predeterminado: `error`)                     |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` y otras especificaciones de origen de GitHub no son destinos válidos de `--version` para instalaciones mediante npm. Usa `--install-method git --version main` en su lugar.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Flujo (install.ps1)

<Steps>
  <Step title="Comprobar el entorno de PowerShell y Windows">
    Requiere PowerShell 5 o posterior.
  </Step>
  <Step title="Garantizar Node.js 24 de forma predeterminada">
    Si no está disponible, intenta instalarlo mediante winget, después Chocolatey y, por último, Scoop. Si no hay ningún gestor de paquetes disponible, el script descarga el archivo zip oficial de Node.js 24 para Windows en `%LOCALAPPDATA%\OpenClaw\deps\portable-node` y lo añade al PATH del proceso actual y del usuario. Node 22.19 o posterior y 23.11 o posterior siguen siendo compatibles.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global mediante npm con el valor `-Tag` seleccionado, iniciada desde un directorio temporal del instalador con permisos de escritura para que también funcionen los shells abiertos en carpetas protegidas como `C:\`
    - Método `git`: clona o actualiza el repositorio, instala y compila con pnpm e instala el contenedor de ejecución en `%USERPROFILE%\.local\bin\openclaw.cmd`. Si falta Git, el script configura MinGit localmente para el usuario en `%LOCALAPPDATA%\OpenClaw\deps\portable-git` y lo añade al PATH del proceso actual y del usuario.

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Añade el directorio de binarios necesario al PATH del usuario cuando es posible
    - Actualiza, en la medida de lo posible, un servicio de Gateway cargado (`openclaw gateway install --force` y después lo reinicia)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones mediante git (en la medida de lo posible)

  </Step>
  <Step title="Gestionar errores">
    Las instalaciones mediante `iwr ... | iex` y bloques de script notifican un error terminante sin cerrar la sesión actual de PowerShell. Las instalaciones directas mediante `powershell -File` / `pwsh -File` siguen finalizando con un código distinto de cero para permitir la automatización.
  </Step>
</Steps>

### Ejemplos (install.ps1)

<Tabs>
  <Tab title="Predeterminado">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalación mediante Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout de la rama principal de GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Directorio de git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Simulación">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de opciones">

| Opción                      | Descripción                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalación (valor predeterminado: `npm`)                                 |
| `-Tag <tag\|version\|spec>` | Etiqueta de distribución, versión o especificación de paquete de npm (valor predeterminado: `latest`) |
| `-GitDir <path>`            | Directorio de checkout (valor predeterminado: `%USERPROFILE%\openclaw`)             |
| `-NoOnboard`                | Omite la incorporación                                                             |
| `-NoGitUpdate`              | Omite `git pull`                                                                    |
| `-DryRun`                   | Solo muestra las acciones                                                           |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                           | Descripción              |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalación    |
| `OPENCLAW_GIT_DIR=<path>`          | Directorio de checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | Omite la incorporación   |
| `OPENCLAW_GIT_UPDATE=0`            | Desactiva `git pull`      |
| `OPENCLAW_DRY_RUN=1`               | Modo de simulación       |

  </Accordion>
</AccordionGroup>

<Note>
Si se usa `-InstallMethod git` y falta Git, el script intenta configurar MinGit localmente para el usuario antes de mostrar el enlace de Git for Windows.
</Note>

---

## CI y automatización

Usa opciones o variables de entorno no interactivas para obtener ejecuciones predecibles.

<Tabs>
  <Tab title="install.sh (npm no interactivo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git no interactivo)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (omitir incorporación)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solución de problemas

<AccordionGroup>
  <Accordion title="¿Por qué se requiere Git?">
    Git es necesario para el método de instalación `git`. En las instalaciones mediante `npm`, Git también se comprueba o instala para evitar errores `spawn git ENOENT` cuando las dependencias usan URL de git.
  </Accordion>

  <Accordion title="¿Por qué npm encuentra un error EACCES en Linux?">
    Algunas configuraciones de Linux dirigen el prefijo global de npm a rutas propiedad de root. `install.sh` puede cambiar el prefijo a `~/.npm-global` y añadir exportaciones de PATH a los archivos rc del shell cuando estos existen.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Vuelve a ejecutar el instalador para que pueda configurar MinGit localmente para el usuario, o instala Git for Windows y vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Ejecuta `npm config get prefix`, añade ese directorio al PATH del usuario (en Windows no se necesita el sufijo `\bin`) y vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title="Windows: cómo obtener una salida detallada del instalador">
    `install.ps1` no ofrece una opción `-Verbose`.
    Usa el seguimiento de PowerShell para obtener diagnósticos en el nivel del script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="No se encuentra openclaw después de la instalación">
    Suele tratarse de un problema con PATH. Consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Actualización](/es/install/updating)
- [Desinstalación](/es/install/uninstall)
