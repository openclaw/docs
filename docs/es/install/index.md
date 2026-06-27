---
read_when:
    - Necesitas un método de instalación distinto del inicio rápido de Primeros pasos
    - Desea desplegar en una plataforma en la nube
    - Necesitas actualizar, migrar o desinstalar
summary: 'Instalar OpenClaw: script instalador, npm/pnpm/bun, desde el código fuente, Docker y más'
title: Instalar
x-i18n:
    generated_at: "2026-06-27T11:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Requisitos del sistema

- **Node 24** (recomendado) o Node 22.19+ - el script de instalación lo gestiona automáticamente
- **macOS, Linux o Windows** - los usuarios de Windows pueden empezar con la aplicación nativa Windows Hub, el instalador de CLI para PowerShell o un Gateway WSL2. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde el código fuente

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu sistema operativo, instala Node si es necesario, instala OpenClaw e inicia la configuración inicial.

<Note>
Los usuarios de escritorio de Windows también pueden instalar la aplicación complementaria nativa [Windows Hub](/es/platforms/windows#recommended-windows-hub), que incluye configuración, estado en la bandeja, chat, modo de nodo y modo MCP local.
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

Para todas las opciones y las opciones de CI/automatización, consulta [Detalles internos del instalador](/es/install/installer).

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Úsalo cuando quieras mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node para todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Admite instalaciones con npm de forma predeterminada, además de instalaciones desde un checkout de git bajo el mismo
flujo de prefijo. Referencia completa: [Detalles internos del instalador](/es/install/installer#install-clish).

¿Ya está instalado? Cambia entre instalaciones de paquete y de git con
`openclaw update --channel dev` y `openclaw update --channel stable`. Consulta
[Actualización](/es/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Si ya administras Node por tu cuenta:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    El instalador alojado desactiva filtros de frescura de npm como `min-release-age`
    para la instalación del paquete OpenClaw. Si instalas manualmente con npm, se sigue aplicando tu propia
    política de npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm requiere aprobación explícita para paquetes con scripts de compilación. Ejecuta `pnpm approve-builds -g` después de la primera instalación.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun es compatible con la ruta de instalación global de la CLI. Para el runtime del Gateway, Node sigue siendo el runtime de daemon recomendado.
    </Note>

  </Tab>
</Tabs>

### Desde el código fuente

Para contribuidores o cualquiera que quiera ejecutar desde un checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

O puedes omitir el enlace y usar `pnpm openclaw ...` desde dentro del repositorio. Consulta [Configuración](/es/start/setup) para ver los flujos de trabajo de desarrollo completos.

### Instalar desde el checkout de main en GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Despliegues en contenedores o sin interfaz gráfica.
  </Card>
  <Card title="Podman" href="/es/install/podman" icon="container">
    Alternativa de contenedores sin root a Docker.
  </Card>
  <Card title="Nix" href="/es/install/nix" icon="snowflake">
    Instalación declarativa mediante Nix flake.
  </Card>
  <Card title="Ansible" href="/es/install/ansible" icon="server">
    Aprovisionamiento automatizado de flotas.
  </Card>
  <Card title="Bun" href="/es/install/bun" icon="zap">
    Uso solo de CLI mediante el runtime Bun.
  </Card>
</CardGroup>

## Verificar la instalación

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Si quieres un inicio administrado después de la instalación:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` u `openclaw gateway install`
- Linux/WSL2: servicio de usuario systemd mediante los mismos comandos
- Windows nativo: primero Scheduled Task, con un elemento de inicio de sesión por usuario en la carpeta Startup como alternativa si se deniega la creación de la tarea

## Alojamiento y despliegue

Despliega OpenClaw en un servidor en la nube o VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/es/vps">
    Cualquier VPS Linux.
  </Card>
  <Card title="Docker VM" href="/es/install/docker-vm-runtime">
    Pasos compartidos de Docker.
  </Card>
  <Card title="Kubernetes" href="/es/install/kubernetes">
    Despliegue en K8s.
  </Card>
  <Card title="Fly.io" href="/es/install/fly">
    Despliega en Fly.io.
  </Card>
  <Card title="Hetzner" href="/es/install/hetzner">
    Despliegue en Hetzner.
  </Card>
  <Card title="GCP" href="/es/install/gcp">
    Despliegue en Google Cloud.
  </Card>
  <Card title="Azure" href="/es/install/azure">
    Despliegue en Azure.
  </Card>
  <Card title="Railway" href="/es/install/railway">
    Despliegue en Railway.
  </Card>
  <Card title="Render" href="/es/install/render">
    Despliegue en Render.
  </Card>
  <Card title="Northflank" href="/es/install/northflank">
    Despliegue en Northflank.
  </Card>
</CardGroup>

## Actualizar, migrar o desinstalar

<CardGroup cols={3}>
  <Card title="Updating" href="/es/install/updating" icon="refresh-cw">
    Mantén OpenClaw actualizado.
  </Card>
  <Card title="Migrating" href="/es/install/migrating" icon="arrow-right">
    Traslada a una máquina nueva.
  </Card>
  <Card title="Uninstall" href="/es/install/uninstall" icon="trash-2">
    Elimina OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: no se encuentra `openclaw`

Si la instalación se completó correctamente pero no se encuentra `openclaw` en tu terminal:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Si `$(npm prefix -g)/bin` no está en tu `$PATH`, añádelo al archivo de inicio de tu shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Luego abre una terminal nueva. Consulta [Configuración de Node](/es/install/node) para obtener más detalles.
