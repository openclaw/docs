---
read_when:
    - Quieres entender `openclaw.ai/install.sh`
    - Quieres automatizar instalaciones (CI / sin interfaz gráfica)
    - Desea instalar desde una copia de trabajo de GitHub
summary: Cómo funcionan los scripts de instalación (install.sh, install-cli.sh, install.ps1), las marcas y la automatización
title: Detalles internos del instalador
x-i18n:
    generated_at: "2026-07-05T11:26:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09ae87aa8be98fdbeb0e215702ee3d10b19cc304b6a81bd939afd5858d5bb470
    source_path: install/installer.md
    workflow: 16
---

OpenClaw incluye tres scripts de instalación, servidos desde `openclaw.ai`.

| Script                             | Plataforma           | Qué hace                                                                                       |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node si es necesario, instala OpenClaw mediante npm (predeterminado) o git, puede ejecutar la incorporación. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw en un prefijo local (`~/.openclaw`) mediante npm o git. No requiere root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node si es necesario, instala OpenClaw mediante npm (predeterminado) o git, puede ejecutar la incorporación. |

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
Si la instalación se completa correctamente pero `openclaw` no se encuentra en una terminal nueva, consulta [solución de problemas de Node.js](/es/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para la mayoría de las instalaciones interactivas en macOS/Linux/WSL.
</Tip>

### Flujo (install.sh)

<Steps>
  <Step title="Detectar SO">
    Admite macOS y Linux (incluido WSL).
  </Step>
  <Step title="Asegurar Node.js 24 de forma predeterminada">
    Comprueba la versión de Node e instala Node 24 si es necesario (Homebrew en macOS, scripts de configuración de NodeSource en Linux apt/dnf/yum). En macOS, Homebrew se instala solo cuando el instalador lo necesita para Node o Git. Node 22.19+ y 23.11+ siguen siendo compatibles.
    En Alpine/musl Linux, el instalador usa paquetes apk en lugar de NodeSource; los repositorios Alpine configurados deben proporcionar una versión compatible de Node (Alpine 3.21 o posterior en el momento de escribir esto).
  </Step>
  <Step title="Asegurar Git">
    Instala Git si falta usando el gestor de paquetes detectado, incluido Homebrew en macOS y apk en Alpine.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global de npm
    - Método `git`: clona/actualiza el repositorio, instala dependencias con pnpm, compila y luego instala el wrapper en `~/.local/bin/openclaw`

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Actualiza un servicio gateway cargado como mejor esfuerzo (`openclaw gateway install --force`, luego reinicia)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (mejor esfuerzo)
    - Intenta la incorporación cuando corresponde (TTY disponible, incorporación no deshabilitada y comprobaciones de arranque/configuración superadas)
    - Ejecuta una verificación rápida posterior a la instalación cuando `--verify` está configurado

  </Step>
</Steps>

### Detección de copia de trabajo fuente

Si se ejecuta dentro de una copia de trabajo de OpenClaw (`package.json` + `pnpm-workspace.yaml`), el script ofrece:

- usar la copia de trabajo (`git`), o
- usar instalación global (`npm`)

Si no hay TTY disponible y no se define ningún método de instalación, usa `npm` de forma predeterminada y muestra una advertencia.

El script sale con el código `2` para una selección de método no válida o valores `--install-method` no válidos.

### Ejemplos (install.sh)

<Tabs>
  <Tab title="Predeterminado">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Omitir incorporación">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalación con Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Copia de trabajo main de GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Ejecución de prueba">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verificar después de instalar">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de flags">

| Flag                                    | Descripción                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Elige el método de instalación (predeterminado: `npm`)                  |
| `--npm`                                 | Atajo para el método npm                                                |
| `--git \| --github`                     | Atajo para el método git                                                |
| `--version <version\|dist-tag\|spec>`   | Versión npm, dist-tag o especificación de paquete (predeterminado: `latest`) |
| `--beta`                                | Usa el dist-tag beta si está disponible; si no, vuelve a `latest`       |
| `--git-dir \| --dir <path>`             | Directorio de copia de trabajo (predeterminado: `~/openclaw`)           |
| `--no-git-update`                       | Omite `git pull` para una copia de trabajo existente                    |
| `--no-prompt`                           | Deshabilita los prompts                                                |
| `--no-onboard`                          | Omite la incorporación                                                 |
| `--onboard`                             | Habilita la incorporación                                              |
| `--verify`                              | Ejecuta una verificación rápida posterior a la instalación (`--version`, salud del gateway si está cargado) |
| `--dry-run`                             | Imprime acciones sin aplicar cambios                                   |
| `--verbose`                             | Habilita salida de depuración (`set -x`, registros de npm en nivel notice) |
| `--help \| -h`                          | Muestra el uso                                                          |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                          | Descripción                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalación                                              |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versión npm, dist-tag o especificación de paquete                  |
| `OPENCLAW_BETA=0\|1`                              | Usa beta si está disponible                                        |
| `OPENCLAW_HOME=<path>`                            | Directorio base para el estado de OpenClaw y rutas predeterminadas de git/incorporación |
| `OPENCLAW_GIT_DIR=<path>`                         | Directorio de copia de trabajo                                     |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Activa o desactiva las actualizaciones de git                      |
| `OPENCLAW_NO_PROMPT=1`                            | Deshabilita los prompts                                            |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Ejecuta la verificación rápida posterior a la instalación          |
| `OPENCLAW_NO_ONBOARD=1`                           | Omite la incorporación                                             |
| `OPENCLAW_DRY_RUN=1`                              | Modo de ejecución de prueba                                        |
| `OPENCLAW_VERBOSE=1`                              | Modo de depuración                                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Nivel de registro de npm (predeterminado: `error`, oculta ruido de obsolescencia de npm) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Diseñado para entornos donde quieres todo bajo un prefijo local
(predeterminado `~/.openclaw`) y sin dependencia de Node del sistema. Admite instalaciones con npm
de forma predeterminada, además de instalaciones desde una copia de trabajo git bajo el mismo flujo de prefijo.
</Info>

### Flujo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime local de Node">
    Descarga un tarball de Node LTS compatible y fijado (la versión está incrustada en el script y se actualiza de forma independiente, predeterminado `22.22.0`) en `<prefix>/tools/node-v<version>` y verifica SHA-256.
    En Alpine/musl Linux, donde Node no publica tarballs compatibles para el runtime fijado, instala `nodejs` y `npm` con `apk` y enlaza ese runtime en la ruta del wrapper del prefijo. Los repositorios Alpine deben proporcionar una versión compatible de Node (22.19+, 23.11+ o 24+); usa Alpine 3.21 o posterior si los repositorios más antiguos solo proporcionan Node 20 o 21.
  </Step>
  <Step title="Asegurar Git">
    Si falta Git, intenta instalarlo mediante apt/dnf/yum/apk en Linux o Homebrew en macOS.
  </Step>
  <Step title="Instalar OpenClaw bajo el prefijo">
    - Método `npm` (predeterminado): instala bajo el prefijo con npm y luego escribe el wrapper en `<prefix>/bin/openclaw`
    - Método `git`: clona/actualiza una copia de trabajo (predeterminado `~/openclaw`) y aun así escribe el wrapper en `<prefix>/bin/openclaw`

  </Step>
  <Step title="Actualizar servicio gateway cargado">
    Si ya hay un servicio gateway cargado desde ese mismo prefijo, el script ejecuta
    `openclaw gateway install --force`, luego `openclaw gateway restart`, y
    comprueba la salud del gateway como mejor esfuerzo.
  </Step>
</Steps>

### Ejemplos (install-cli.sh)

<Tabs>
  <Tab title="Predeterminado">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefijo personalizado + versión">
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
  <Tab title="Ejecutar incorporación">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de flags">

| Opción                                  | Descripción                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefijo de instalación (predeterminado: `~/.openclaw`)                          |
| `--install-method \| --method npm\|git` | Elige el método de instalación (predeterminado: `npm`)                          |
| `--npm`                                 | Atajo para el método npm                                                        |
| `--git \| --github`                     | Atajo para el método git                                                        |
| `--git-dir \| --dir <path>`             | Directorio de checkout de Git (predeterminado: `~/openclaw`)                    |
| `--version <ver>`                       | Versión de OpenClaw o dist-tag (predeterminado: `latest`)                       |
| `--node-version <ver>`                  | Versión de Node (predeterminado: `22.22.0`)                                     |
| `--json`                                | Emite eventos NDJSON                                                            |
| `--onboard`                             | Ejecuta `openclaw onboard` después de la instalación                            |
| `--no-onboard`                          | Omite la incorporación (predeterminado)                                         |
| `--set-npm-prefix`                      | En Linux, fuerza el prefijo de npm a `~/.npm-global` si el prefijo actual no se puede escribir |
| `--help \| -h`                          | Muestra el uso                                                                  |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                    | Descripción                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefijo de instalación                                             |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalación                                              |
| `OPENCLAW_VERSION=<ver>`                    | Versión de OpenClaw o dist-tag                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versión de Node                                                    |
| `OPENCLAW_HOME=<path>`                      | Directorio base para el estado de OpenClaw y las rutas predeterminadas de git/incorporación |
| `OPENCLAW_GIT_DIR=<path>`                   | Directorio de checkout de Git para instalaciones con git           |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activa o desactiva las actualizaciones de git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Omite la incorporación                                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nivel de registro de npm (predeterminado: `error`)                 |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` y otras especificaciones de código fuente de GitHub no son destinos `--version` válidos para instalaciones con npm. Usa `--install-method git --version main` en su lugar.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Flujo (install.ps1)

<Steps>
  <Step title="Garantizar el entorno de PowerShell + Windows">
    Requiere PowerShell 5+.
  </Step>
  <Step title="Garantizar Node.js 24 de forma predeterminada">
    Si falta, intenta instalarlo mediante winget, luego Chocolatey y luego Scoop. Si no hay ningún gestor de paquetes disponible, el script descarga el zip oficial de Node.js 24 para Windows en `%LOCALAPPDATA%\OpenClaw\deps\portable-node` y lo agrega al PATH del usuario y del proceso actual. Node 22.19+ y 23.11+ siguen siendo compatibles por compatibilidad.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global de npm con el `-Tag` seleccionado, iniciada desde un directorio temporal de instalación escribible para que los shells abiertos en carpetas protegidas como `C:\` sigan funcionando
    - Método `git`: clona/actualiza el repositorio, instala/compila con pnpm e instala el wrapper en `%USERPROFILE%\.local\bin\openclaw.cmd`. Si falta Git, el script inicializa MinGit local del usuario en `%LOCALAPPDATA%\OpenClaw\deps\portable-git` y lo agrega al PATH del usuario y del proceso actual.

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Agrega el directorio bin necesario al PATH del usuario cuando es posible
    - Actualiza un servicio Gateway cargado como mejor esfuerzo (`openclaw gateway install --force`, luego reinicia)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (mejor esfuerzo)

  </Step>
  <Step title="Gestionar fallos">
    Las instalaciones con `iwr ... | iex` y scriptblock informan un error terminante sin cerrar la sesión actual de PowerShell. Las instalaciones directas con `powershell -File` / `pwsh -File` siguen saliendo con código distinto de cero para automatización.
  </Step>
</Steps>

### Ejemplos (install.ps1)

<Tabs>
  <Tab title="Predeterminado">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalación con Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout de GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Directorio git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Ejecución de prueba">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de opciones">

| Opción                      | Descripción                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalación (predeterminado: `npm`)              |
| `-Tag <tag\|version\|spec>` | dist-tag, versión o especificación de paquete de npm (predeterminado: `latest`) |
| `-GitDir <path>`            | Directorio de checkout (predeterminado: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Omite la incorporación                                    |
| `-NoGitUpdate`              | Omite `git pull`                                           |
| `-DryRun`                   | Solo imprime las acciones                                  |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                           | Descripción              |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalación    |
| `OPENCLAW_GIT_DIR=<path>`          | Directorio de checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | Omite la incorporación   |
| `OPENCLAW_GIT_UPDATE=0`            | Deshabilita git pull     |
| `OPENCLAW_DRY_RUN=1`               | Modo de ejecución de prueba |

  </Accordion>
</AccordionGroup>

<Note>
Si se usa `-InstallMethod git` y falta Git, el script intenta inicializar MinGit local del usuario antes de imprimir el enlace de Git for Windows.
</Note>

---

## CI y automatización

Usa opciones/variables de entorno no interactivas para ejecuciones predecibles.

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
    Git es necesario para el método de instalación `git`. Para instalaciones con `npm`, Git también se comprueba/instala para evitar fallos `spawn git ENOENT` cuando las dependencias usan URLs de git.
  </Accordion>

  <Accordion title="¿Por qué npm encuentra EACCES en Linux?">
    Algunas configuraciones de Linux apuntan el prefijo global de npm a rutas propiedad de root. `install.sh` puede cambiar el prefijo a `~/.npm-global` y agregar exportaciones de PATH a los archivos rc del shell (cuando esos archivos existen).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Vuelve a ejecutar el instalador para que pueda inicializar MinGit local del usuario, o instala Git for Windows y vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Ejecuta `npm config get prefix` y agrega ese directorio a tu PATH de usuario (en Windows no se necesita el sufijo `\bin`), luego vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title="Windows: cómo obtener salida detallada del instalador">
    `install.ps1` no expone un modificador `-Verbose`.
    Usa el seguimiento de PowerShell para diagnósticos a nivel de script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw no encontrado después de la instalación">
    Normalmente es un problema de PATH. Consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install)
- [Actualización](/es/install/updating)
- [Desinstalar](/es/install/uninstall)
