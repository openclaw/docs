---
read_when:
    - Necesitas un método de instalación distinto del inicio rápido de Primeros pasos
    - Quieres desplegar en una plataforma en la nube
    - Necesitas actualizar, migrar o desinstalar
summary: 'Instalar OpenClaw: script de instalación, npm/pnpm/bun, desde el código fuente, Docker y más'
title: Instalar
x-i18n:
    generated_at: "2026-04-26T11:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## Requisitos del sistema

- **Node 24** (recomendado) o Node 22.14+ — el script de instalación se encarga de esto automáticamente
- **macOS, Linux o Windows** — tanto Windows nativo como WSL2 son compatibles; WSL2 es más estable. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde el código fuente

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu SO, instala Node si hace falta, instala OpenClaw e inicia el onboarding.

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

Para instalar sin ejecutar onboarding:

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

Para ver todas las flags y opciones de CI/automatización, consulta [Internals del instalador](/es/install/installer).

## Métodos alternativos de instalación

### Instalador de prefijo local (`install-cli.sh`)

Úsalo cuando quieras mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node en todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Admite instalaciones con npm de forma predeterminada, además de instalaciones desde checkout de git dentro del mismo flujo
de prefijo. Referencia completa: [Internals del instalador](/es/install/installer#install-clish).

¿Ya está instalado? Cambia entre instalaciones desde paquete y desde git con
`openclaw update --channel dev` y `openclaw update --channel stable`. Consulta
[Actualización](/es/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Si ya gestionas Node por tu cuenta:

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
    pnpm requiere aprobación explícita para paquetes con scripts de compilación. Ejecuta `pnpm approve-builds -g` después de la primera instalación.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun es compatible para la ruta de instalación global de la CLI. Para el entorno de ejecución del Gateway, Node sigue siendo el entorno recomendado para el daemon.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Solución de problemas: errores de compilación de sharp (npm)">
  Si `sharp` falla debido a una libvips instalada globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Desde el código fuente

Para contribuidores o cualquiera que quiera ejecutarlo desde un checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

O omite el link y usa `pnpm openclaw ...` desde dentro del repo. Consulta [Setup](/es/start/setup) para ver flujos completos de desarrollo.

### Instalar desde GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Despliegues en contenedor o sin interfaz.
  </Card>
  <Card title="Podman" href="/es/install/podman" icon="container">
    Alternativa de contenedor rootless a Docker.
  </Card>
  <Card title="Nix" href="/es/install/nix" icon="snowflake">
    Instalación declarativa mediante flake de Nix.
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
openclaw --version      # confirma que la CLI está disponible
openclaw doctor         # comprueba si hay problemas de configuración
openclaw gateway status # verifica que el Gateway esté en ejecución
```

Si quieres inicio gestionado después de instalar:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servicio de usuario systemd mediante los mismos comandos
- Windows nativo: Scheduled Task primero, con respaldo mediante elemento de inicio de sesión en la carpeta Startup por usuario si se deniega la creación de la tarea

## Hosting y despliegue

Despliega OpenClaw en un servidor cloud o VPS:

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
  <Card title="Actualización" href="/es/install/updating" icon="refresh-cw">
    Mantén OpenClaw actualizado.
  </Card>
  <Card title="Migración" href="/es/install/migrating" icon="arrow-right">
    Muévete a una máquina nueva.
  </Card>
  <Card title="Desinstalar" href="/es/install/uninstall" icon="trash-2">
    Elimina OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: `openclaw` no encontrado

Si la instalación tuvo éxito pero `openclaw` no se encuentra en tu terminal:

```bash
node -v           # ¿Node instalado?
npm prefix -g     # ¿Dónde están los paquetes globales?
echo "$PATH"      # ¿Está el directorio bin global en PATH?
```

Si `$(npm prefix -g)/bin` no está en tu `$PATH`, agrégalo a tu archivo de inicio del shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Luego abre una terminal nueva. Consulta [Configuración de Node](/es/install/node) para más detalles.
