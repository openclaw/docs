---
read_when:
    - Quieres entender `openclaw.ai/install.sh`
    - Quieres automatizar las instalaciones (CI / sin interfaz gráfica)
    - Quieres instalar desde un checkout de GitHub
summary: Cómo funcionan los scripts de instalación (install.sh, install-cli.sh, install.ps1), las marcas y la automatización
title: Componentes internos del instalador
x-i18n:
    generated_at: "2026-06-27T11:48:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw incluye tres scripts de instalación, servidos desde `openclaw.ai`.

| Script                             | Plataforma           | Qué hace                                                                                                               |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node si es necesario, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar la incorporación. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw en un prefijo local (`~/.openclaw`) con modos npm o checkout de git. No requiere root.         |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node si es necesario, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar la incorporación. |

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
  <Step title="Detect OS">
    Compatible con macOS y Linux (incluido WSL).
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Comprueba la versión de Node e instala Node 24 si es necesario (Homebrew en macOS, scripts de configuración de NodeSource en Linux apt/dnf/yum). En macOS, Homebrew se instala solo cuando el instalador lo necesita para Node o Git. OpenClaw sigue siendo compatible con Node 22 LTS, actualmente `22.19+`, por compatibilidad.
    En Alpine/musl Linux, el instalador usa paquetes apk en lugar de NodeSource; los repositorios Alpine configurados deben proporcionar Node `22.19+` (Alpine 3.21 o posterior en el momento de escribir esto).
  </Step>
  <Step title="Ensure Git">
    Instala Git si falta usando el gestor de paquetes detectado, incluidos Homebrew en macOS y apk en Alpine.
  </Step>
  <Step title="Install OpenClaw">
    - Método `npm` (predeterminado): instalación global de npm
    - Método `git`: clona/actualiza el repositorio, instala dependencias con pnpm, compila y luego instala el envoltorio en `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Actualiza un servicio Gateway cargado con el mejor esfuerzo (`openclaw gateway install --force`, luego reinicia)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones de git (mejor esfuerzo)
    - Intenta la incorporación cuando corresponde (TTY disponible, incorporación no deshabilitada y las comprobaciones de bootstrap/configuración pasan)

  </Step>
</Steps>

### Detección de checkout de código fuente

Si se ejecuta dentro de un checkout de OpenClaw (`package.json` + `pnpm-workspace.yaml`), el script ofrece:

- usar checkout (`git`), o
- usar instalación global (`npm`)

Si no hay TTY disponible y no se define ningún método de instalación, el valor predeterminado es `npm` y muestra una advertencia.

El script sale con código `2` para una selección de método no válida o valores `--install-method` no válidos.

### Ejemplos (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Marca                                 | Descripción                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| `--install-method npm\|git`           | Elige el método de instalación (predeterminado: `npm`). Alias: `--method` |
| `--npm`                               | Atajo para el método npm                                       |
| `--git`                               | Atajo para el método git. Alias: `--github`                    |
| `--version <version\|dist-tag\|spec>` | Versión de npm, dist-tag o especificación de paquete (predeterminado: `latest`) |
| `--beta`                              | Usa el dist-tag beta si está disponible; si no, recurre a `latest` |
| `--git-dir <path>`                    | Directorio de checkout (predeterminado: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Omite `git pull` para un checkout existente                    |
| `--no-prompt`                         | Deshabilita los prompts                                        |
| `--no-onboard`                        | Omite la incorporación                                         |
| `--onboard`                           | Habilita la incorporación                                      |
| `--dry-run`                           | Imprime acciones sin aplicar cambios                           |
| `--verbose`                           | Habilita la salida de depuración (`set -x`, registros de npm de nivel notice) |
| `--help`                              | Muestra el uso (`-h`)                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                          | Descripción                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalación                                              |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versión de npm, dist-tag o especificación de paquete               |
| `OPENCLAW_BETA=0\|1`                              | Usa beta si está disponible                                        |
| `OPENCLAW_HOME=<path>`                            | Directorio base para el estado de OpenClaw y rutas predeterminadas de git/incorporación |
| `OPENCLAW_GIT_DIR=<path>`                         | Directorio de checkout                                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Alterna las actualizaciones de git                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Deshabilita los prompts                                            |
| `OPENCLAW_NO_ONBOARD=1`                           | Omite la incorporación                                             |
| `OPENCLAW_DRY_RUN=1`                              | Modo de ejecución de prueba                                        |
| `OPENCLAW_VERBOSE=1`                              | Modo de depuración                                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Nivel de registro de npm                                           |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Diseñado para entornos donde quieres todo bajo un prefijo local
(predeterminado `~/.openclaw`) y sin dependencia del Node del sistema. Admite instalaciones npm
de forma predeterminada, además de instalaciones por checkout de git bajo el mismo flujo de prefijo.
</Info>

### Flujo (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Descarga un tarball de Node LTS compatible fijado (la versión está incrustada en el script y se actualiza de forma independiente) en `<prefix>/tools/node-v<version>` y verifica SHA-256.
    En Alpine/musl Linux, donde Node no publica tarballs compatibles para el runtime fijado, instala `nodejs` y `npm` con `apk` y enlaza ese runtime en la ruta del envoltorio del prefijo. Los repositorios Alpine deben proporcionar Node `22.19+`; usa Alpine 3.21 o posterior si los repositorios anteriores solo proporcionan Node 20 o 21.
  </Step>
  <Step title="Ensure Git">
    Si falta Git, intenta instalarlo mediante apt/dnf/yum/apk en Linux o Homebrew en macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - Método `npm` (predeterminado): instala bajo el prefijo con npm y luego escribe el envoltorio en `<prefix>/bin/openclaw`
    - Método `git`: clona/actualiza un checkout (predeterminado `~/openclaw`) y aun así escribe el envoltorio en `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Si un servicio Gateway ya está cargado desde ese mismo prefijo, el script ejecuta
    `openclaw gateway install --force`, luego `openclaw gateway restart`, y
    sondea la salud del Gateway con el mejor esfuerzo.
  </Step>
</Steps>

### Ejemplos (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Opción                      | Descripción                                                                    |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefijo de instalación (predeterminado: `~/.openclaw`)                         |
| `--install-method npm\|git` | Elegir método de instalación (predeterminado: `npm`). Alias: `--method`         |
| `--npm`                     | Atajo para el método npm                                                        |
| `--git`, `--github`         | Atajo para el método git                                                        |
| `--git-dir <path>`          | Directorio de checkout de Git (predeterminado: `~/openclaw`). Alias: `--dir`   |
| `--version <ver>`           | Versión de OpenClaw o dist-tag (predeterminado: `latest`)                      |
| `--node-version <ver>`      | Versión de Node (predeterminado: `22.22.0`)                                    |
| `--json`                    | Emitir eventos NDJSON                                                           |
| `--onboard`                 | Ejecutar `openclaw onboard` después de la instalación                           |
| `--no-onboard`              | Omitir la configuración inicial (predeterminado)                                |
| `--set-npm-prefix`          | En Linux, forzar el prefijo npm a `~/.npm-global` si el prefijo actual no tiene permisos de escritura |
| `--help`                    | Mostrar uso (`-h`)                                                              |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                    | Descripción                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefijo de instalación                                             |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalación                                              |
| `OPENCLAW_VERSION=<ver>`                    | Versión de OpenClaw o dist-tag                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versión de Node                                                    |
| `OPENCLAW_HOME=<path>`                      | Directorio base para el estado de OpenClaw y rutas predeterminadas de git/configuración inicial |
| `OPENCLAW_GIT_DIR=<path>`                   | Directorio de checkout de Git para instalaciones con git           |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activar o desactivar actualizaciones de git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Omitir la configuración inicial                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nivel de registro de npm                                           |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flujo (install.ps1)

<Steps>
  <Step title="Garantizar un entorno de PowerShell + Windows">
    Requiere PowerShell 5+.
  </Step>
  <Step title="Garantizar Node.js 24 de forma predeterminada">
    Si falta, intenta instalarlo mediante winget, luego Chocolatey y luego Scoop. Si no hay ningún gestor de paquetes disponible, el script descarga el zip oficial de Node.js para Windows en `%LOCALAPPDATA%\OpenClaw\deps\portable-node` y lo agrega al PATH del proceso actual y del usuario. Node 22 LTS, actualmente `22.19+`, sigue siendo compatible por compatibilidad.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global de npm con el `-Tag` seleccionado, iniciada desde un directorio temporal de instalación con permisos de escritura para que los shells abiertos en carpetas protegidas como `C:\` sigan funcionando
    - Método `git`: clona/actualiza el repositorio, instala/compila con pnpm e instala el wrapper en `%USERPROFILE%\.local\bin\openclaw.cmd`. Si falta Git, el script inicializa MinGit local para el usuario en `%LOCALAPPDATA%\OpenClaw\deps\portable-git` y lo agrega al PATH del proceso actual y del usuario.

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Agrega el directorio bin necesario al PATH del usuario cuando sea posible
    - Actualiza un servicio Gateway cargado con el mejor esfuerzo (`openclaw gateway install --force`, luego reinicia)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (mejor esfuerzo)

  </Step>
  <Step title="Gestionar fallos">
    Las instalaciones con `iwr ... | iex` y scriptblock informan un error terminante sin cerrar la sesión actual de PowerShell. Las instalaciones directas con `powershell -File` / `pwsh -File` siguen saliendo con un código distinto de cero para automatización.
  </Step>
</Steps>

### Ejemplos (install.ps1)

<Tabs>
  <Tab title="Predeterminado">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalación con git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout de main en GitHub">
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
  <Tab title="Traza de depuración">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de opciones">

| Opción                      | Descripción                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalación (predeterminado: `npm`)              |
| `-Tag <tag\|version\|spec>` | dist-tag de npm, versión o especificación de paquete (predeterminado: `latest`) |
| `-GitDir <path>`            | Directorio de checkout (predeterminado: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Omitir la configuración inicial                            |
| `-NoGitUpdate`              | Omitir `git pull`                                          |
| `-DryRun`                   | Imprimir solo las acciones                                 |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                           | Descripción                    |
| ---------------------------------- | ------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalación          |
| `OPENCLAW_GIT_DIR=<path>`          | Directorio de checkout         |
| `OPENCLAW_NO_ONBOARD=1`            | Omitir la configuración inicial |
| `OPENCLAW_GIT_UPDATE=0`            | Desactivar git pull            |
| `OPENCLAW_DRY_RUN=1`               | Modo de ejecución de prueba    |

  </Accordion>
</AccordionGroup>

<Note>
Si se usa `-InstallMethod git` y falta Git, el script intenta inicializar MinGit local para el usuario antes de imprimir el enlace de Git for Windows.
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
  <Tab title="install.ps1 (omitir configuración inicial)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solución de problemas

<AccordionGroup>
  <Accordion title="¿Por qué se requiere Git?">
    Git es necesario para el método de instalación `git`. Para instalaciones con `npm`, Git también se comprueba/instala para evitar fallos `spawn git ENOENT` cuando las dependencias usan URL de git.
  </Accordion>

  <Accordion title="¿Por qué npm encuentra EACCES en Linux?">
    Algunas configuraciones de Linux apuntan el prefijo global de npm a rutas propiedad de root. `install.sh` puede cambiar el prefijo a `~/.npm-global` y agregar exportaciones de PATH a los archivos rc del shell (cuando esos archivos existen).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Vuelve a ejecutar el instalador para que pueda inicializar MinGit local para el usuario, o instala Git for Windows y vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Ejecuta `npm config get prefix` y agrega ese directorio al PATH de tu usuario (en Windows no se necesita el sufijo `\bin`), luego vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title="Windows: cómo obtener salida detallada del instalador">
    `install.ps1` actualmente no expone un modificador `-Verbose`.
    Usa el seguimiento de PowerShell para diagnósticos a nivel de script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw no se encuentra después de la instalación">
    Suele ser un problema de PATH. Consulta [solución de problemas de Node.js](/es/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install)
- [Actualización](/es/install/updating)
- [Desinstalación](/es/install/uninstall)
