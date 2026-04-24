---
read_when:
    - Necesitas un método de instalación distinto del inicio rápido de Getting Started
    - Quieres implementar en una plataforma en la nube
    - Necesitas actualizar, migrar o desinstalar
summary: Instalar OpenClaw — script de instalación, npm/pnpm/bun, desde código fuente, Docker y más
title: Instalación
x-i18n:
    generated_at: "2026-04-24T05:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## Requisitos del sistema

- **Node 24** (recomendado) o Node 22.14+ — el script de instalación se encarga de esto automáticamente
- **macOS, Linux o Windows** — se admiten tanto Windows nativo como WSL2; WSL2 es más estable. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde código fuente

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu SO, instala Node si es necesario, instala OpenClaw e inicia la incorporación.

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

Para ver todos los indicadores y las opciones de CI/automatización, consulta [Internos del instalador](/es/install/installer).

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Úsalo cuando quieras mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node global del sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Admite instalaciones con npm de forma predeterminada, además de instalaciones desde checkout de git bajo el mismo
flujo de prefijo. Referencia completa: [Internos del instalador](/es/install/installer#install-clish).

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
    Bun es compatible con la ruta de instalación global de la CLI. Para el entorno de ejecución del Gateway, Node sigue siendo el entorno de daemon recomendado.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Solución de problemas: errores de compilación de sharp (npm)">
  Si `sharp` falla debido a una libvips instalada globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Desde código fuente

Para colaboradores o cualquiera que quiera ejecutar desde un checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

O bien omite el link y usa `pnpm openclaw ...` desde dentro del repositorio. Consulta [Setup](/es/start/setup) para ver los flujos completos de desarrollo.

### Instalar desde GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Implementaciones en contenedor o sin interfaz.
  </Card>
  <Card title="Podman" href="/es/install/podman" icon="container">
    Alternativa de contenedor rootless a Docker.
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
openclaw --version      # confirmar que la CLI está disponible
openclaw doctor         # comprobar problemas de configuración
openclaw gateway status # verificar que el Gateway está en ejecución
```

Si quieres inicio gestionado después de instalar:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servicio de usuario systemd mediante los mismos comandos
- Windows nativo: primero Tarea programada, con respaldo de elemento de inicio de sesión por usuario en la carpeta Startup si se deniega la creación de la tarea

## Alojamiento e implementación

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

## Solución de problemas: no se encuentra `openclaw`

Si la instalación se completó correctamente pero `openclaw` no aparece en tu terminal:

```bash
node -v           # ¿Node instalado?
npm prefix -g     # ¿Dónde están los paquetes globales?
echo "$PATH"      # ¿Está el directorio global bin en PATH?
```

Si `$(npm prefix -g)/bin` no está en tu `$PATH`, añádelo a tu archivo de inicio del shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Luego abre una terminal nueva. Consulta [Configuración de Node](/es/install/node) para más detalles.
