---
read_when:
    - Quieres entender `openclaw.ai/install.sh`
    - Quieres automatizar instalaciones (CI / headless)
    - Quieres instalar desde un checkout de GitHub
summary: Cómo funcionan los scripts del instalador (`install.sh`, `install-cli.sh`, `install.ps1`), sus flags y la automatización
title: Componentes internos del instalador
x-i18n:
    generated_at: "2026-04-24T05:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc54080bb93ffab3dc7827f568a0a44cda89c6d3c5f9d485c6dde7ca42837807
    source_path: install/installer.md
    workflow: 15
---

OpenClaw incluye tres scripts de instalación, servidos desde `openclaw.ai`.

| Script                             | Plataforma           | Qué hace                                                                                                      |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node si hace falta, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar la incorporación. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw en un prefijo local (`~/.openclaw`) con modos npm o checkout de git. No requiere root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node si hace falta, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar la incorporación. |

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
Si la instalación tiene éxito pero `openclaw` no aparece en una nueva terminal, consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para la mayoría de instalaciones interactivas en macOS/Linux/WSL.
</Tip>

### Flujo (install.sh)

<Steps>
  <Step title="Detectar el SO">
    Admite macOS y Linux (incluido WSL). Si detecta macOS, instala Homebrew si falta.
  </Step>
  <Step title="Asegurar Node.js 24 de forma predeterminada">
    Comprueba la versión de Node e instala Node 24 si hace falta (Homebrew en macOS, scripts de configuración de NodeSource en Linux apt/dnf/yum). OpenClaw sigue siendo compatible con Node 22 LTS, actualmente `22.14+`, por compatibilidad.
  </Step>
  <Step title="Asegurar Git">
    Instala Git si falta.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (predeterminado): instalación global con npm
    - método `git`: clona/actualiza el repositorio, instala dependencias con pnpm, compila y luego instala el wrapper en `~/.local/bin/openclaw`
  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Actualiza un servicio de gateway cargado en modo best-effort (`openclaw gateway install --force`, luego reinicio)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones por git (best effort)
    - Intenta la incorporación cuando corresponde (TTY disponible, incorporación no deshabilitada y comprobaciones de bootstrap/configuración superadas)
    - Usa `SHARP_IGNORE_GLOBAL_LIBVIPS=1` de forma predeterminada
  </Step>
</Steps>

### Detección de checkout del código fuente

Si se ejecuta dentro de un checkout de OpenClaw (`package.json` + `pnpm-workspace.yaml`), el script ofrece:

- usar el checkout (`git`), o
- usar la instalación global (`npm`)

Si no hay TTY disponible y no se ha configurado ningún método de instalación, usa `npm` de forma predeterminada y muestra una advertencia.

El script sale con código `2` si la selección del método no es válida o si los valores de `--install-method` no son válidos.

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
  <Tab title="Instalación con git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main mediante npm">
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

| Flag                                  | Descripción                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| `--install-method npm\|git`           | Elegir método de instalación (predeterminado: `npm`). Alias: `--method` |
| `--npm`                               | Atajo para el método npm                                      |
| `--git`                               | Atajo para el método git. Alias: `--github`                  |
| `--version <version\|dist-tag\|spec>` | Versión de npm, dist-tag o especificación de paquete (predeterminado: `latest`) |
| `--beta`                              | Usar dist-tag beta si está disponible; si no, recurrir a `latest` |
| `--git-dir <path>`                    | Directorio de checkout (predeterminado: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Omitir `git pull` para un checkout existente                 |
| `--no-prompt`                         | Deshabilitar prompts                                          |
| `--no-onboard`                        | Omitir incorporación                                          |
| `--onboard`                           | Habilitar incorporación                                       |
| `--dry-run`                           | Mostrar acciones sin aplicar cambios                         |
| `--verbose`                           | Habilitar salida de depuración (`set -x`, registros npm a nivel notice) |
| `--help`                              | Mostrar uso (`-h`)                                            |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                                | Descripción                                    |
| ------------------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Método de instalación                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versión de npm, dist-tag o especificación de paquete |
| `OPENCLAW_BETA=0\|1`                                    | Usar beta si está disponible                   |
| `OPENCLAW_GIT_DIR=<path>`                               | Directorio de checkout                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Activar/desactivar actualizaciones de git      |
| `OPENCLAW_NO_PROMPT=1`                                  | Deshabilitar prompts                           |
| `OPENCLAW_NO_ONBOARD=1`                                 | Omitir incorporación                           |
| `OPENCLAW_DRY_RUN=1`                                    | Modo de ejecución de prueba                    |
| `OPENCLAW_VERBOSE=1`                                    | Modo de depuración                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Nivel de registro de npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controlar el comportamiento de sharp/libvips (predeterminado: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Diseñado para entornos en los que quieres que todo quede bajo un prefijo local
(predeterminado `~/.openclaw`) y sin dependencia de Node del sistema. Admite instalaciones con npm
de forma predeterminada, además de instalaciones desde checkout de git bajo el mismo flujo de prefijo.
</Info>

### Flujo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime local de Node">
    Descarga un tarball fijado de una versión compatible de Node LTS (la versión está incrustada en el script y se actualiza de forma independiente) en `<prefix>/tools/node-v<version>` y verifica SHA-256.
  </Step>
  <Step title="Asegurar Git">
    Si falta Git, intenta instalarlo mediante apt/dnf/yum en Linux o Homebrew en macOS.
  </Step>
  <Step title="Instalar OpenClaw bajo el prefijo">
    - método `npm` (predeterminado): instala bajo el prefijo con npm y luego escribe el wrapper en `<prefix>/bin/openclaw`
    - método `git`: clona/actualiza un checkout (predeterminado `~/openclaw`) y aun así escribe el wrapper en `<prefix>/bin/openclaw`
  </Step>
  <Step title="Actualizar el servicio de gateway cargado">
    Si ya hay un servicio de gateway cargado desde ese mismo prefijo, el script ejecuta
    `openclaw gateway install --force`, luego `openclaw gateway restart`, y
    prueba el estado del gateway en modo best-effort.
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
  <Tab title="Instalación con git">
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

| Flag                        | Descripción                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| `--prefix <path>`           | Prefijo de instalación (predeterminado: `~/.openclaw`)                        |
| `--install-method npm\|git` | Elegir método de instalación (predeterminado: `npm`). Alias: `--method`       |
| `--npm`                     | Atajo para el método npm                                                      |
| `--git`, `--github`         | Atajo para el método git                                                      |
| `--git-dir <path>`          | Directorio del checkout de git (predeterminado: `~/openclaw`). Alias: `--dir` |
| `--version <ver>`           | Versión o dist-tag de OpenClaw (predeterminado: `latest`)                     |
| `--node-version <ver>`      | Versión de Node (predeterminado: `22.22.0`)                                   |
| `--json`                    | Emitir eventos NDJSON                                                         |
| `--onboard`                 | Ejecutar `openclaw onboard` después de la instalación                         |
| `--no-onboard`              | Omitir incorporación (predeterminado)                                         |
| `--set-npm-prefix`          | En Linux, forzar el prefijo npm a `~/.npm-global` si el prefijo actual no es escribible |
| `--help`                    | Mostrar uso (`-h`)                                                            |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                    | Descripción                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefijo de instalación                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalación                         |
| `OPENCLAW_VERSION=<ver>`                    | Versión o dist-tag de OpenClaw                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versión de Node                               |
| `OPENCLAW_GIT_DIR=<path>`                   | Directorio del checkout de git para instalaciones git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activar/desactivar actualizaciones de git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Omitir incorporación                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nivel de registro de npm                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controlar el comportamiento de sharp/libvips (predeterminado: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flujo (install.ps1)

<Steps>
  <Step title="Asegurar PowerShell + entorno Windows">
    Requiere PowerShell 5+.
  </Step>
  <Step title="Asegurar Node.js 24 de forma predeterminada">
    Si falta, intenta instalarlo mediante winget, luego Chocolatey y después Scoop. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible por compatibilidad.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (predeterminado): instalación global con npm usando `-Tag` seleccionado
    - método `git`: clona/actualiza el repositorio, instala/compila con pnpm e instala el wrapper en `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Añade el directorio bin necesario al PATH del usuario cuando es posible
    - Actualiza un servicio de gateway cargado en modo best-effort (`openclaw gateway install --force`, luego reinicio)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones git (best effort)
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
    # install.ps1 aún no tiene una flag -Verbose específica.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de flags">

| Flag                        | Descripción                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalación (predeterminado: `npm`)                 |
| `-Tag <tag\|version\|spec>` | Dist-tag, versión o especificación de paquete npm (predeterminado: `latest`) |
| `-GitDir <path>`            | Directorio de checkout (predeterminado: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Omitir incorporación                                          |
| `-NoGitUpdate`              | Omitir `git pull`                                             |
| `-DryRun`                   | Mostrar solo las acciones                                     |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                           | Descripción              |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalación    |
| `OPENCLAW_GIT_DIR=<path>`          | Directorio de checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | Omitir incorporación     |
| `OPENCLAW_GIT_UPDATE=0`            | Deshabilitar git pull    |
| `OPENCLAW_DRY_RUN=1`               | Modo de ejecución de prueba |

  </Accordion>
</AccordionGroup>

<Note>
Si se usa `-InstallMethod git` y falta Git, el script sale e imprime el enlace de Git for Windows.
</Note>

---

## CI y automatización

Usa flags/variables de entorno no interactivas para ejecuciones predecibles.

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
    Git es obligatorio para el método de instalación `git`. En instalaciones `npm`, Git sigue comprobándose/instalándose para evitar fallos `spawn git ENOENT` cuando las dependencias usan URL de git.
  </Accordion>

  <Accordion title="¿Por qué npm da EACCES en Linux?">
    Algunas configuraciones de Linux apuntan el prefijo global de npm a rutas propiedad de root. `install.sh` puede cambiar el prefijo a `~/.npm-global` y añadir exportaciones de PATH a archivos rc del shell (cuando esos archivos existen).
  </Accordion>

  <Accordion title="Problemas con sharp/libvips">
    Los scripts usan por defecto `SHARP_IGNORE_GLOBAL_LIBVIPS=1` para evitar que sharp se compile contra libvips del sistema. Para sobrescribirlo:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instala Git for Windows, vuelve a abrir PowerShell y vuelve a ejecutar el instalador.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Ejecuta `npm config get prefix` y añade ese directorio a tu PATH de usuario (en Windows no hace falta el sufijo `\bin`), luego vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title="Windows: cómo obtener salida detallada del instalador">
    `install.ps1` actualmente no expone un interruptor `-Verbose`.
    Usa trazado de PowerShell para diagnósticos a nivel de script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw no se encuentra después de instalar">
    Normalmente es un problema de PATH. Consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install)
- [Actualización](/es/install/updating)
- [Desinstalación](/es/install/uninstall)
