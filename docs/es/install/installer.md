---
read_when:
    - Quieres entender `openclaw.ai/install.sh`
    - Quieres automatizar las instalaciones (CI / sin interfaz gráfica)
    - Deseas instalar desde una copia de trabajo de GitHub
summary: Cómo funcionan los scripts de instalación (install.sh, install-cli.sh, install.ps1), las opciones y la automatización
title: Aspectos internos del instalador
x-i18n:
    generated_at: "2026-04-30T05:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw incluye tres scripts de instalación, servidos desde `openclaw.ai`.

| Script                             | Plataforma           | Qué hace                                                                                                      |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node si es necesario, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar la incorporación. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw en un prefijo local (`~/.openclaw`) con modos de npm o checkout de git. No requiere root. |
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
  <Step title="Detectar el sistema operativo">
    Compatible con macOS y Linux (incluido WSL). Si se detecta macOS, instala Homebrew si falta.
  </Step>
  <Step title="Garantizar Node.js 24 de forma predeterminada">
    Comprueba la versión de Node e instala Node 24 si es necesario (Homebrew en macOS, scripts de configuración de NodeSource en Linux apt/dnf/yum). OpenClaw sigue siendo compatible con Node 22 LTS, actualmente `22.14+`, por compatibilidad.
  </Step>
  <Step title="Garantizar Git">
    Instala Git si falta.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global con npm
    - Método `git`: clona/actualiza el repositorio, instala dependencias con pnpm, compila y luego instala el wrapper en `~/.local/bin/openclaw`

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Actualiza con el máximo esfuerzo un servicio de Gateway cargado (`openclaw gateway install --force`, luego reinicio)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (máximo esfuerzo)
    - Intenta la incorporación cuando corresponde (TTY disponible, incorporación no deshabilitada y comprobaciones de bootstrap/config superadas)
    - Establece `SHARP_IGNORE_GLOBAL_LIBVIPS=1` de forma predeterminada

  </Step>
</Steps>

### Detección de checkout de código fuente

Si se ejecuta dentro de un checkout de OpenClaw (`package.json` + `pnpm-workspace.yaml`), el script ofrece:

- usar checkout (`git`), o
- usar instalación global (`npm`)

Si no hay TTY disponible y no se estableció ningún método de instalación, el valor predeterminado es `npm` y muestra una advertencia.

El script sale con el código `2` si se selecciona un método no válido o si los valores de `--install-method` no son válidos.

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
  <Tab title="main de GitHub mediante npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Ejecución de prueba">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de flags">

| Flag                                  | Descripción                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Elige el método de instalación (predeterminado: `npm`). Alias: `--method` |
| `--npm`                               | Atajo para el método npm                                   |
| `--git`                               | Atajo para el método git. Alias: `--github`                |
| `--version <version\|dist-tag\|spec>` | Versión de npm, dist-tag o especificación de paquete (predeterminado: `latest`) |
| `--beta`                              | Usa el dist-tag beta si está disponible; de lo contrario, recurre a `latest` |
| `--git-dir <path>`                    | Directorio de checkout (predeterminado: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Omite `git pull` para un checkout existente                |
| `--no-prompt`                         | Deshabilita los prompts                                    |
| `--no-onboard`                        | Omite la incorporación                                     |
| `--onboard`                           | Habilita la incorporación                                  |
| `--dry-run`                           | Imprime acciones sin aplicar cambios                       |
| `--verbose`                           | Habilita la salida de depuración (`set -x`, registros de npm a nivel notice) |
| `--help`                              | Muestra el uso (`-h`)                                      |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                                | Descripción                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Método de instalación                         |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versión de npm, dist-tag o especificación de paquete |
| `OPENCLAW_BETA=0\|1`                                    | Usa beta si está disponible                   |
| `OPENCLAW_GIT_DIR=<path>`                               | Directorio de checkout                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Alterna las actualizaciones de git            |
| `OPENCLAW_NO_PROMPT=1`                                  | Deshabilita los prompts                       |
| `OPENCLAW_NO_ONBOARD=1`                                 | Omite la incorporación                        |
| `OPENCLAW_DRY_RUN=1`                                    | Modo de ejecución de prueba                   |
| `OPENCLAW_VERBOSE=1`                                    | Modo de depuración                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Nivel de registro de npm                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controla el comportamiento de sharp/libvips (predeterminado: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Diseñado para entornos donde quieres que todo esté bajo un prefijo local
(predeterminado `~/.openclaw`) y sin dependencia de Node del sistema. Admite instalaciones con npm
de forma predeterminada, además de instalaciones con checkout de git bajo el mismo flujo de prefijo.
</Info>

### Flujo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime local de Node">
    Descarga un tarball fijado y compatible de Node LTS (la versión está incrustada en el script y se actualiza de forma independiente) en `<prefix>/tools/node-v<version>` y verifica SHA-256.
  </Step>
  <Step title="Garantizar Git">
    Si falta Git, intenta instalarlo mediante apt/dnf/yum en Linux o Homebrew en macOS.
  </Step>
  <Step title="Instalar OpenClaw bajo el prefijo">
    - Método `npm` (predeterminado): instala bajo el prefijo con npm y luego escribe el wrapper en `<prefix>/bin/openclaw`
    - Método `git`: clona/actualiza un checkout (predeterminado `~/openclaw`) y aun así escribe el wrapper en `<prefix>/bin/openclaw`

  </Step>
  <Step title="Actualizar el servicio de Gateway cargado">
    Si ya hay un servicio de Gateway cargado desde ese mismo prefijo, el script ejecuta
    `openclaw gateway install --force`, luego `openclaw gateway restart`, y
    sondea la salud del Gateway con el máximo esfuerzo.
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

| Flag                        | Descripción                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefijo de instalación (predeterminado: `~/.openclaw`)                          |
| `--install-method npm\|git` | Elige el método de instalación (predeterminado: `npm`). Alias: `--method`       |
| `--npm`                     | Atajo para el método npm                                                        |
| `--git`, `--github`         | Atajo para el método git                                                        |
| `--git-dir <path>`          | Directorio de checkout de Git (predeterminado: `~/openclaw`). Alias: `--dir`    |
| `--version <ver>`           | Versión de OpenClaw o dist-tag (predeterminado: `latest`)                       |
| `--node-version <ver>`      | Versión de Node (predeterminado: `22.22.0`)                                     |
| `--json`                    | Emite eventos NDJSON                                                            |
| `--onboard`                 | Ejecuta `openclaw onboard` después de la instalación                            |
| `--no-onboard`              | Omite la incorporación (predeterminado)                                         |
| `--set-npm-prefix`          | En Linux, fuerza el prefijo de npm a `~/.npm-global` si el prefijo actual no tiene permisos de escritura |
| `--help`                    | Muestra el uso (`-h`)                                                           |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                    | Descripción                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefijo de instalación                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalación                         |
| `OPENCLAW_VERSION=<ver>`                    | Versión de OpenClaw o dist-tag                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versión de Node                               |
| `OPENCLAW_GIT_DIR=<path>`                   | Directorio de checkout de Git para instalaciones con git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activa o desactiva las actualizaciones de git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Omitir la incorporación                       |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nivel de registro de npm                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controlar el comportamiento de sharp/libvips (predeterminado: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flujo (install.ps1)

<Steps>
  <Step title="Asegurar el entorno de PowerShell + Windows">
    Requiere PowerShell 5+.
  </Step>
  <Step title="Asegurar Node.js 24 de forma predeterminada">
    Si falta, intenta instalarlo mediante winget, luego Chocolatey y luego Scoop. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible por compatibilidad.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (predeterminado): instalación global de npm usando el `-Tag` seleccionado
    - Método `git`: clona/actualiza el repositorio, instala/compila con pnpm e instala el wrapper en `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Agrega el directorio bin necesario al PATH del usuario cuando es posible
    - Actualiza un servicio de Gateway cargado en modo de mejor esfuerzo (`openclaw gateway install --force`, luego reinicia)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (mejor esfuerzo)

  </Step>
  <Step title="Gestionar fallos">
    Las instalaciones con `iwr ... | iex` y scriptblock informan un error terminante sin cerrar la sesión actual de PowerShell. Las instalaciones directas con `powershell -File` / `pwsh -File` siguen saliendo con código distinto de cero para la automatización.
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
  <Tab title="GitHub main mediante npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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
  <Accordion title="Referencia de flags">

| Flag                        | Descripción                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalación (predeterminado: `npm`)              |
| `-Tag <tag\|version\|spec>` | dist-tag, versión o especificación de paquete de npm (predeterminado: `latest`) |
| `-GitDir <path>`            | Directorio de checkout (predeterminado: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Omitir la incorporación                                   |
| `-NoGitUpdate`              | Omitir `git pull`                                         |
| `-DryRun`                   | Imprimir solo las acciones                                |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                           | Descripción        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalación |
| `OPENCLAW_GIT_DIR=<path>`          | Directorio de checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Omitir la incorporación |
| `OPENCLAW_GIT_UPDATE=0`            | Desactivar git pull |
| `OPENCLAW_DRY_RUN=1`               | Modo de ejecución de prueba |

  </Accordion>
</AccordionGroup>

<Note>
Si se usa `-InstallMethod git` y falta Git, el script sale e imprime el enlace de Git for Windows.
</Note>

---

## CI y automatización

Usa flags/variables de entorno no interactivos para ejecuciones predecibles.

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
    Git es obligatorio para el método de instalación `git`. Para instalaciones con `npm`, Git aún se comprueba/instala para evitar fallos `spawn git ENOENT` cuando las dependencias usan URL de git.
  </Accordion>

  <Accordion title="¿Por qué npm encuentra EACCES en Linux?">
    Algunas configuraciones de Linux apuntan el prefijo global de npm a rutas propiedad de root. `install.sh` puede cambiar el prefijo a `~/.npm-global` y agregar exportaciones de PATH a archivos rc del shell (cuando esos archivos existen).
  </Accordion>

  <Accordion title="Problemas con sharp/libvips">
    Los scripts establecen de forma predeterminada `SHARP_IGNORE_GLOBAL_LIBVIPS=1` para evitar que sharp se compile contra libvips del sistema. Para anularlo:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instala Git for Windows, vuelve a abrir PowerShell y vuelve a ejecutar el instalador.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Ejecuta `npm config get prefix` y agrega ese directorio a tu PATH de usuario (no se necesita el sufijo `\bin` en Windows), luego vuelve a abrir PowerShell.
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

  <Accordion title="openclaw no encontrado después de instalar">
    Normalmente es un problema de PATH. Consulta [solución de problemas de Node.js](/es/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install)
- [Actualización](/es/install/updating)
- [Desinstalar](/es/install/uninstall)
