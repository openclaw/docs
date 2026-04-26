---
read_when:
    - Quieres entender `openclaw.ai/install.sh`
    - Quieres automatizar instalaciones (CI / sin interfaz)
    - Quieres instalar desde un checkout de GitHub
summary: Cómo funcionan los scripts de instalación (`install.sh`, `install-cli.sh`, `install.ps1`), las flags y la automatización
title: Internals del instalador
x-i18n:
    generated_at: "2026-04-26T11:32:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw incluye tres scripts de instalación, servidos desde `openclaw.ai`.

| Script                             | Plataforma           | Qué hace                                                                                                         |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node si hace falta, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw en un prefijo local (`~/.openclaw`) con modos npm o checkout de git. No requiere root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node si hace falta, instala OpenClaw mediante npm (predeterminado) o git, y puede ejecutar onboarding. |

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
Si la instalación tiene éxito pero `openclaw` no se encuentra en una terminal nueva, consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting).
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
    Compatible con macOS y Linux (incluido WSL). Si se detecta macOS, instala Homebrew si falta.
  </Step>
  <Step title="Garantizar Node.js 24 por defecto">
    Comprueba la versión de Node e instala Node 24 si hace falta (Homebrew en macOS, scripts de configuración de NodeSource en Linux apt/dnf/yum). OpenClaw sigue siendo compatible con Node 22 LTS, actualmente `22.14+`, por compatibilidad.
  </Step>
  <Step title="Garantizar Git">
    Instala Git si falta.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (predeterminado): instalación global con npm
    - método `git`: clona/actualiza el repo, instala dependencias con pnpm, compila y luego instala el wrapper en `~/.local/bin/openclaw`
  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Actualiza un servicio de gateway cargado con mejor esfuerzo (`openclaw gateway install --force`, luego reinicio)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (mejor esfuerzo)
    - Intenta el onboarding cuando corresponde (TTY disponible, onboarding no deshabilitado y las comprobaciones de bootstrap/configuración pasan)
    - Usa por defecto `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Detección de checkout del código fuente

Si se ejecuta dentro de un checkout de OpenClaw (`package.json` + `pnpm-workspace.yaml`), el script ofrece:

- usar el checkout (`git`), o
- usar instalación global (`npm`)

Si no hay TTY disponible y no se ha establecido ningún método de instalación, usa `npm` por defecto y muestra una advertencia.

El script sale con código `2` para selección de método no válida o valores `--install-method` no válidos.

### Ejemplos (install.sh)

<Tabs>
  <Tab title="Predeterminado">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Omitir onboarding">
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
  <Tab title="Simulación">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referencia de flags">

| Flag                                  | Descripción                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Elegir método de instalación (predeterminado: `npm`). Alias: `--method` |
| `--npm`                               | Atajo para el método npm                                   |
| `--git`                               | Atajo para el método git. Alias: `--github`                |
| `--version <version\|dist-tag\|spec>` | versión npm, dist-tag o especificación de paquete (predeterminado: `latest`) |
| `--beta`                              | Usar dist-tag beta si está disponible; si no, usar `latest` |
| `--git-dir <path>`                    | Directorio de checkout (predeterminado: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Omitir `git pull` para checkout existente                  |
| `--no-prompt`                         | Deshabilitar prompts                                       |
| `--no-onboard`                        | Omitir onboarding                                          |
| `--onboard`                           | Habilitar onboarding                                       |
| `--dry-run`                           | Imprimir acciones sin aplicar cambios                      |
| `--verbose`                           | Habilitar salida de depuración (`set -x`, logs npm de nivel notice) |
| `--help`                              | Mostrar uso (`-h`)                                         |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                                | Descripción                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Método de instalación                         |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | versión npm, dist-tag o especificación de paquete |
| `OPENCLAW_BETA=0\|1`                                    | Usar beta si está disponible                  |
| `OPENCLAW_GIT_DIR=<path>`                               | Directorio de checkout                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Activar/desactivar actualizaciones de git     |
| `OPENCLAW_NO_PROMPT=1`                                  | Deshabilitar prompts                          |
| `OPENCLAW_NO_ONBOARD=1`                                 | Omitir onboarding                             |
| `OPENCLAW_DRY_RUN=1`                                    | Modo de simulación                            |
| `OPENCLAW_VERBOSE=1`                                    | Modo de depuración                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Nivel de logs de npm                          |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controlar comportamiento de sharp/libvips (predeterminado: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Diseñado para entornos donde quieres todo bajo un prefijo local
(predeterminado `~/.openclaw`) y sin dependencia de Node del sistema. Admite instalaciones con npm
por defecto, además de instalaciones desde checkout de git dentro del mismo flujo de prefijo.
</Info>

### Flujo (install-cli.sh)

<Steps>
  <Step title="Instalar entorno de ejecución local de Node">
    Descarga un tarball LTS compatible fijado de Node (la versión está incrustada en el script y se actualiza de forma independiente) a `<prefix>/tools/node-v<version>` y verifica SHA-256.
  </Step>
  <Step title="Garantizar Git">
    Si Git falta, intenta instalarlo mediante apt/dnf/yum en Linux o Homebrew en macOS.
  </Step>
  <Step title="Instalar OpenClaw bajo el prefijo">
    - método `npm` (predeterminado): instala bajo el prefijo con npm y luego escribe el wrapper en `<prefix>/bin/openclaw`
    - método `git`: clona/actualiza un checkout (predeterminado `~/openclaw`) y sigue escribiendo el wrapper en `<prefix>/bin/openclaw`
  </Step>
  <Step title="Actualizar servicio de gateway cargado">
    Si ya hay un servicio de gateway cargado desde ese mismo prefijo, el script ejecuta
    `openclaw gateway install --force`, luego `openclaw gateway restart`, y
    comprueba la salud del gateway con mejor esfuerzo.
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
  <Tab title="Ejecutar onboarding">
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
| `--install-method npm\|git` | Elegir método de instalación (predeterminado: `npm`). Alias: `--method`         |
| `--npm`                     | Atajo para el método npm                                                        |
| `--git`, `--github`         | Atajo para el método git                                                        |
| `--git-dir <path>`          | Directorio del checkout de git (predeterminado: `~/openclaw`). Alias: `--dir`   |
| `--version <ver>`           | Versión o dist-tag de OpenClaw (predeterminado: `latest`)                       |
| `--node-version <ver>`      | Versión de Node (predeterminado: `22.22.0`)                                     |
| `--json`                    | Emitir eventos NDJSON                                                           |
| `--onboard`                 | Ejecutar `openclaw onboard` después de la instalación                           |
| `--no-onboard`              | Omitir onboarding (predeterminado)                                              |
| `--set-npm-prefix`          | En Linux, forzar el prefijo npm a `~/.npm-global` si el prefijo actual no es escribible |
| `--help`                    | Mostrar uso (`-h`)                                                              |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                                    | Descripción                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefijo de instalación                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalación                         |
| `OPENCLAW_VERSION=<ver>`                    | Versión o dist-tag de OpenClaw                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versión de Node                               |
| `OPENCLAW_GIT_DIR=<path>`                   | Directorio de checkout de git para instalaciones git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activar/desactivar actualizaciones git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Omitir onboarding                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nivel de logs de npm                          |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controlar comportamiento de sharp/libvips (predeterminado: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flujo (install.ps1)

<Steps>
  <Step title="Garantizar PowerShell + entorno Windows">
    Requiere PowerShell 5+.
  </Step>
  <Step title="Garantizar Node.js 24 por defecto">
    Si falta, intenta instalarlo mediante winget, luego Chocolatey y después Scoop. Node 22 LTS, actualmente `22.14+`, sigue siendo compatible por compatibilidad.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (predeterminado): instalación global con npm usando `-Tag` seleccionado
    - método `git`: clona/actualiza el repo, instala/compila con pnpm e instala el wrapper en `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Tareas posteriores a la instalación">
    - Agrega el directorio bin necesario al PATH del usuario cuando es posible
    - Actualiza un servicio de gateway cargado con mejor esfuerzo (`openclaw gateway install --force`, luego reinicio)
    - Ejecuta `openclaw doctor --non-interactive` en actualizaciones e instalaciones con git (mejor esfuerzo)
  </Step>
  <Step title="Manejar fallos">
    `iwr ... | iex` y las instalaciones con scriptblock informan un error terminante sin cerrar la sesión actual de PowerShell. Las instalaciones directas con `powershell -File` / `pwsh -File` siguen saliendo con código distinto de cero para automatización.
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
  <Tab title="Simulación">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Trazado de depuración">
    ```powershell
    # install.ps1 aún no tiene una flag -Verbose dedicada.
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
| `-Tag <tag\|version\|spec>` | dist-tag de npm, versión o especificación de paquete (predeterminado: `latest`) |
| `-GitDir <path>`            | Directorio de checkout (predeterminado: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Omitir onboarding                                          |
| `-NoGitUpdate`              | Omitir `git pull`                                          |
| `-DryRun`                   | Solo imprimir acciones                                     |

  </Accordion>

  <Accordion title="Referencia de variables de entorno">

| Variable                           | Descripción        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalación |
| `OPENCLAW_GIT_DIR=<path>`          | Directorio de checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Omitir onboarding  |
| `OPENCLAW_GIT_UPDATE=0`            | Deshabilitar git pull |
| `OPENCLAW_DRY_RUN=1`               | Modo de simulación |

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
  <Tab title="install.ps1 (omitir onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solución de problemas

<AccordionGroup>
  <Accordion title="¿Por qué se requiere Git?">
    Git es obligatorio para el método de instalación `git`. Para instalaciones `npm`, Git igualmente se comprueba/instala para evitar fallos `spawn git ENOENT` cuando las dependencias usan URL de git.
  </Accordion>

  <Accordion title="¿Por qué npm da EACCES en Linux?">
    Algunas configuraciones de Linux apuntan el prefijo global de npm a rutas propiedad de root. `install.sh` puede cambiar el prefijo a `~/.npm-global` y anexar exportaciones PATH a los archivos rc del shell (cuando esos archivos existen).
  </Accordion>

  <Accordion title="Problemas con sharp/libvips">
    Los scripts usan por defecto `SHARP_IGNORE_GLOBAL_LIBVIPS=1` para evitar que sharp compile contra libvips del sistema. Para sobrescribirlo:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instala Git for Windows, vuelve a abrir PowerShell y vuelve a ejecutar el instalador.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Ejecuta `npm config get prefix` y agrega ese directorio a tu PATH de usuario (sin sufijo `\bin` en Windows), luego vuelve a abrir PowerShell.
  </Accordion>

  <Accordion title="Windows: cómo obtener salida detallada del instalador">
    `install.ps1` actualmente no expone un modificador `-Verbose`.
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
- [Desinstalar](/es/install/uninstall)
