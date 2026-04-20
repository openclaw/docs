---
read_when:
    - Necesitas un método de instalación distinto del inicio rápido de Primeros pasos
    - Quieres implementar en una plataforma en la nube
    - Necesitas actualizar, migrar o desinstalar
summary: Instalar OpenClaw — script de instalación, npm/pnpm/bun, desde el código fuente, Docker y más
title: Instalar
x-i18n:
    generated_at: "2026-04-20T05:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Instalar

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu sistema operativo, instala Node si hace falta, instala OpenClaw e inicia la configuración guiada.

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

Para instalar sin ejecutar la configuración guiada:

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

Para ver todas las banderas y opciones de CI/automatización, consulta [Detalles internos del instalador](/es/install/installer).

## Requisitos del sistema

- **Node 24** (recomendado) o Node 22.14+ — el script de instalación se encarga de esto automáticamente
- **macOS, Linux o Windows** — se admiten tanto Windows nativo como WSL2; WSL2 es más estable. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde el código fuente

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Úsalo cuando quieras que OpenClaw y Node se mantengan bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node en todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Admite instalaciones con npm de forma predeterminada, además de instalaciones desde una copia de git dentro del mismo flujo de prefijo. Referencia completa: [Detalles internos del instalador](/es/install/installer#install-clish).

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
    pnpm requiere aprobación explícita para paquetes con scripts de compilación. Ejecuta `pnpm approve-builds -g` después de la primera instalación.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun es compatible con la ruta de instalación global de la CLI. Para el runtime de Gateway, Node sigue siendo el runtime recomendado para el daemon.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Solución de problemas: errores de compilación de sharp (npm)">
  Si `sharp` falla debido a una instalación global de libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Desde el código fuente

Para colaboradores o cualquier persona que quiera ejecutar desde una copia local del repositorio:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

O bien, omite el enlace y usa `pnpm openclaw ...` desde dentro del repositorio. Consulta [Configuración](/es/start/setup) para ver los flujos de desarrollo completos.

### Instalar desde GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Implementaciones en contenedores o sin interfaz.
  </Card>
  <Card title="Podman" href="/es/install/podman" icon="container">
    Alternativa de contenedores sin privilegios a Docker.
  </Card>
  <Card title="Nix" href="/es/install/nix" icon="snowflake">
    Instalación declarativa mediante flake de Nix.
  </Card>
  <Card title="Ansible" href="/es/install/ansible" icon="server">
    Aprovisionamiento automatizado de flotas.
  </Card>
  <Card title="Bun" href="/es/install/bun" icon="zap">
    Uso solo de la CLI mediante el runtime de Bun.
  </Card>
</CardGroup>

## Verificar la instalación

```bash
openclaw --version      # confirma que la CLI esté disponible
openclaw doctor         # comprueba si hay problemas de configuración
openclaw gateway status # verifica que Gateway esté en ejecución
```

Si quieres inicio administrado después de la instalación:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servicio de usuario systemd mediante los mismos comandos
- Windows nativo: primero una tarea programada, con un elemento de inicio de sesión en la carpeta de Inicio por usuario como alternativa si se deniega la creación de la tarea

## Hosting e implementación

Implementa OpenClaw en un servidor en la nube o VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/es/vps">Cualquier VPS de Linux</Card>
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
    Muévete a una nueva máquina.
  </Card>
  <Card title="Desinstalar" href="/es/install/uninstall" icon="trash-2">
    Elimina OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: no se encuentra `openclaw`

Si la instalación se completó correctamente pero `openclaw` no se encuentra en tu terminal:

```bash
node -v           # ¿Node está instalado?
npm prefix -g     # ¿Dónde están los paquetes globales?
echo "$PATH"      # ¿El directorio global de binarios está en PATH?
```

Si `$(npm prefix -g)/bin` no está en tu `$PATH`, añádelo a tu archivo de inicio del shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Luego abre una terminal nueva. Consulta [Configuración de Node](/es/install/node) para más detalles.
