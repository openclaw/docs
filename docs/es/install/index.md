---
read_when:
    - Necesitas un método de instalación distinto del inicio rápido de Primeros pasos.
    - Quieres implementar en una plataforma en la nube
    - Necesitas actualizar, migrar o desinstalar
summary: Instalar OpenClaw - script de instalación, npm/pnpm/bun, desde el código fuente, Docker y más
title: Instalar
x-i18n:
    generated_at: "2026-07-05T11:28:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Requisitos del sistema

- **Node 22.19+, 23.11+ o 24+** - Node 24 es el objetivo predeterminado; el script de instalación se encarga de esto automáticamente.
- **macOS, Linux o Windows** - Los usuarios de Windows pueden empezar con la aplicación nativa Windows Hub, el instalador de CLI para PowerShell o un Gateway WSL2. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde el código fuente.

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu sistema operativo, instala Node si es necesario, instala OpenClaw e inicia la incorporación.

<Note>
Los usuarios de escritorio de Windows también pueden instalar la aplicación complementaria nativa [Windows Hub](/es/platforms/windows#recommended-windows-hub), que incluye configuración, estado en la bandeja, chat, modo nodo y modo MCP local.
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

Para todas las marcas y opciones de CI/automatización, consulta [Detalles internos del instalador](/es/install/installer).

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Usa esto cuando quieras mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node en todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Admite instalaciones con npm de forma predeterminada, además de instalaciones desde checkout de git bajo el mismo
flujo de prefijo. Referencia completa: [Detalles internos del instalador](/es/install/installer#install-clish).

¿Ya está instalado? Cambia entre instalaciones de paquete y git con
`openclaw update --channel dev` y `openclaw update --channel stable`. Consulta
[Actualización](/es/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Si ya gestionas Node tú mismo:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    El instalador alojado borra filtros de frescura de npm como `min-release-age`
    para la instalación del paquete OpenClaw. Si instalas manualmente con npm, tu propia
    política de npm sigue aplicándose.
    </Note>

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
    Bun es compatible con la ruta de instalación global de la CLI. Para el runtime del Gateway, Node sigue siendo el runtime de demonio recomendado.
    </Note>

  </Tab>
</Tabs>

### Desde el código fuente

Para colaboradores o cualquiera que quiera ejecutar desde un checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

O omite el enlace y usa `pnpm openclaw ...` desde dentro del repositorio. Consulta [Configuración](/es/start/setup) para ver los flujos de trabajo completos de desarrollo.

### Instalar desde el checkout main de GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
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
    Uso solo de CLI mediante el runtime Bun.
  </Card>
</CardGroup>

## Verificar la instalación

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Si quieres un inicio gestionado después de la instalación:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` u `openclaw gateway install`
- Linux/WSL2: servicio de usuario systemd mediante los mismos comandos
- Windows nativo: Scheduled Task primero, con un elemento de inicio de sesión en la carpeta de Inicio por usuario como alternativa si se deniega la creación de la tarea

## Alojamiento y despliegue

Despliega OpenClaw en un servidor en la nube o VPS. Consulta [Servidor Linux](/es/vps) para ver el selector completo
de proveedores (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi y más), o despliega de forma declarativa en
[Render](/es/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/es/vps">
    Elige un proveedor.
  </Card>
  <Card title="Docker VM" href="/es/install/docker-vm-runtime">
    Pasos compartidos de Docker.
  </Card>
  <Card title="Kubernetes" href="/es/install/kubernetes">
    Despliegue de K8s.
  </Card>
</CardGroup>

## Actualizar, migrar o desinstalar

<CardGroup cols={3}>
  <Card title="Actualización" href="/es/install/updating" icon="refresh-cw">
    Mantén OpenClaw actualizado.
  </Card>
  <Card title="Migración" href="/es/install/migrating" icon="arrow-right">
    Traslada a una máquina nueva.
  </Card>
  <Card title="Desinstalar" href="/es/install/uninstall" icon="trash-2">
    Elimina OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: no se encuentra `openclaw`

Casi siempre es un problema de PATH: el directorio bin global de npm no está en el `PATH` de tu shell. Consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting) para ver la solución completa, incluida la ruta de Windows.

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```
