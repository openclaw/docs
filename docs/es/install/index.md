---
read_when:
    - Necesita un método de instalación distinto del inicio rápido de Primeros pasos
    - Quieres implementar en una plataforma en la nube
    - Es necesario actualizar, migrar o desinstalar
summary: 'Instalar OpenClaw: script de instalación, npm/pnpm/bun, desde el código fuente, Docker y más'
title: Instalar
x-i18n:
    generated_at: "2026-07-14T13:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Requisitos del sistema

- **Node 22.22.3+, 24.15+ o 25.9+** - Node 24 es la versión de destino predeterminada; el script de instalación se encarga de esto automáticamente.
- **macOS, Linux o Windows** - Los usuarios de Windows pueden comenzar con la aplicación nativa Windows Hub, el instalador de la CLI para PowerShell o un Gateway en WSL2. Consulte [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si se compila desde el código fuente.

## Recomendado: script de instalación

La forma más rápida de realizar la instalación. Detecta el sistema operativo, instala Node si es necesario, instala OpenClaw e inicia la configuración inicial.

<Note>
Los usuarios de escritorio de Windows también pueden instalar la aplicación complementaria nativa [Windows Hub](/es/platforms/windows#recommended-windows-hub), que incluye configuración, estado en la bandeja del sistema, chat, modo Node y modo MCP local.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Para instalar sin ejecutar la configuración inicial:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Para consultar todas las opciones y las alternativas para CI y automatización, consulte [Funcionamiento interno del instalador](/es/install/installer).

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Utilice esta opción cuando quiera mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node para todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

De forma predeterminada, admite instalaciones mediante npm, además de instalaciones desde un repositorio git bajo el mismo
flujo de prefijo. Referencia completa: [Funcionamiento interno del instalador](/es/install/installer#install-clish).

¿Ya está instalado? Cambie entre instalaciones de paquete y git con
`openclaw update --channel dev` y `openclaw update --channel stable`. Consulte
[Actualización](/es/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Si ya gestiona Node por su cuenta:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    El instalador alojado elimina los filtros de actualización de npm, como `min-release-age`,
    para instalar el paquete OpenClaw. Si realiza la instalación manualmente con npm, se seguirá
    aplicando su propia política de npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm requiere aprobación explícita para los paquetes que incluyen scripts de compilación. Ejecute `pnpm approve-builds -g` después de la primera instalación.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun puede instalar el paquete global, pero el ejecutable `openclaw` resultante requiere un entorno de ejecución de Node compatible porque el estado de OpenClaw utiliza `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### Desde el código fuente

Para colaboradores o cualquier persona que quiera ejecutar OpenClaw desde una copia local del repositorio:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

También se puede omitir el enlace y utilizar `pnpm openclaw ...` desde el repositorio. Consulte [Configuración](/es/start/setup) para conocer los flujos de trabajo de desarrollo completos.

### Instalación desde la rama main de GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Implementaciones en contenedores o sin interfaz gráfica.
  </Card>
  <Card title="Podman" href="/es/install/podman" icon="container">
    Alternativa de contenedores sin privilegios de administrador a Docker.
  </Card>
  <Card title="Nix" href="/es/install/nix" icon="snowflake">
    Instalación declarativa mediante un flake de Nix.
  </Card>
  <Card title="Ansible" href="/es/install/ansible" icon="server">
    Aprovisionamiento automatizado de flotas.
  </Card>
  <Card title="Bun" href="/es/install/bun" icon="zap">
    Instalador de dependencias y ejecutor de scripts de paquetes opcional.
  </Card>
</CardGroup>

## Verificar la instalación

```bash
openclaw --version      # confirmar que la CLI está disponible
openclaw doctor         # comprobar si hay problemas de configuración
openclaw gateway status # verificar que el Gateway esté en ejecución
```

Si se desea un inicio administrado después de la instalación:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servicio de usuario de systemd mediante los mismos comandos
- Windows nativo: primero se utiliza una tarea programada, con un elemento de inicio de sesión por usuario en la carpeta Inicio como alternativa si se deniega la creación de la tarea

## Alojamiento e implementación

Implemente OpenClaw en un servidor en la nube o VPS. Consulte [Servidor Linux](/es/vps) para acceder al
selector completo de proveedores (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi y más), o impleméntelo de forma declarativa en
[Render](/es/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/es/vps">
    Elija un proveedor.
  </Card>
  <Card title="Máquina virtual con Docker" href="/es/install/docker-vm-runtime">
    Pasos compartidos de Docker.
  </Card>
  <Card title="Kubernetes" href="/es/install/kubernetes">
    Implementación en K8s.
  </Card>
</CardGroup>

## Actualizar, migrar o desinstalar

<CardGroup cols={3}>
  <Card title="Actualización" href="/es/install/updating" icon="refresh-cw">
    Mantenga OpenClaw actualizado.
  </Card>
  <Card title="Migración" href="/es/install/migrating" icon="arrow-right">
    Traslade OpenClaw a una máquina nueva.
  </Card>
  <Card title="Desinstalación" href="/es/install/uninstall" icon="trash-2">
    Elimine OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: no se encuentra `openclaw`

Casi siempre se trata de un problema con PATH: el directorio global de binarios de npm no está incluido en el `PATH` del shell. Consulte [Solución de problemas de Node.js](/es/install/node#troubleshooting) para conocer la solución completa, incluida la ruta de Windows.

```bash
node -v           # ¿Está instalado Node?
npm prefix -g     # ¿Dónde están los paquetes globales?
echo "$PATH"      # ¿Está el directorio global de binarios en PATH?
```
