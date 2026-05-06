---
read_when:
    - Necesita un método de instalación distinto del inicio rápido de Primeros pasos
    - Quieres desplegar en una plataforma en la nube
    - Debe actualizar, migrar o desinstalar
summary: Instalar OpenClaw - script de instalación, npm/pnpm/bun, desde el código fuente, Docker y más
title: Instalar
x-i18n:
    generated_at: "2026-05-06T05:39:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Requisitos del sistema

- **Node 24** (recomendado) o Node 22.14+; el script de instalación se encarga de esto automáticamente
- **macOS, Linux o Windows**; se admiten tanto Windows nativo como WSL2; WSL2 es más estable. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde el código fuente

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu sistema operativo, instala Node si es necesario, instala OpenClaw e inicia la incorporación.

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

Para instalar sin ejecutar la incorporación:

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

Para todas las opciones y opciones de CI/automatización, consulta [funcionamiento interno del instalador](/es/install/installer).

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Úsalo cuando quieras mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node para todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Admite instalaciones con npm de forma predeterminada, además de instalaciones desde un checkout de git bajo el mismo
flujo de prefijo. Referencia completa: [funcionamiento interno del instalador](/es/install/installer#install-clish).

¿Ya está instalado? Alterna entre instalaciones de paquete y git con
`openclaw update --channel dev` y `openclaw update --channel stable`. Consulta
[actualización](/es/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Si ya administras Node por tu cuenta:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm requiere aprobación explícita para los paquetes con scripts de compilación. Ejecuta `pnpm approve-builds -g` después de la primera instalación.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun es compatible con la ruta de instalación global de la CLI. Para el entorno de ejecución del Gateway, Node sigue siendo el entorno de ejecución de daemon recomendado.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  Si `sharp` falla debido a un libvips instalado globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Desde el código fuente

Para colaboradores o cualquier persona que quiera ejecutar desde un checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

O omite el enlace y usa `pnpm openclaw ...` desde dentro del repositorio. Consulta [configuración](/es/start/setup) para ver los flujos de trabajo completos de desarrollo.

### Instalar desde GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Implementaciones en contenedores o sin interfaz gráfica.
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
    Uso solo de CLI mediante el entorno de ejecución Bun.
  </Card>
</CardGroup>

## Verificar la instalación

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Si quieres un inicio administrado después de la instalación:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servicio de usuario systemd mediante los mismos comandos
- Windows nativo: primero Scheduled Task, con un elemento de inicio de sesión en la carpeta de inicio por usuario como alternativa si se deniega la creación de la tarea

## Hospedaje e implementación

Implementa OpenClaw en un servidor en la nube o VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/es/vps">Cualquier VPS Linux</Card>
  <Card title="Docker VM" href="/es/install/docker-vm-runtime">Pasos compartidos de Docker</Card>
  <Card title="Kubernetes" href="/es/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/es/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/es/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/es/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/es/install/azure">Azure</Card>
  <Card title="Railway" href="/es/install/railway">Railway</Card>
  <Card title="Render" href="/es/install/render">Render</Card>
  <Card title="Northflank" href="/es/install/northflank">Northflank</Card>
</CardGroup>

## Actualizar, migrar o desinstalar

<CardGroup cols={3}>
  <Card title="Updating" href="/es/install/updating" icon="refresh-cw">
    Mantén OpenClaw actualizado.
  </Card>
  <Card title="Migrating" href="/es/install/migrating" icon="arrow-right">
    Muévelo a una máquina nueva.
  </Card>
  <Card title="Uninstall" href="/es/install/uninstall" icon="trash-2">
    Elimina OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: no se encuentra `openclaw`

Si la instalación se realizó correctamente pero no se encuentra `openclaw` en tu terminal:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Si `$(npm prefix -g)/bin` no está en tu `$PATH`, agrégalo al archivo de inicio de tu shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Luego abre una terminal nueva. Consulta [configuración de Node](/es/install/node) para obtener más detalles.
