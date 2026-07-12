---
read_when:
    - Necesitas un método de instalación distinto del inicio rápido de primeros pasos
    - Quieres implementar en una plataforma en la nube
    - Necesitas actualizar, migrar o desinstalar
summary: 'Instalar OpenClaw: script de instalación, npm/pnpm/bun, desde el código fuente, Docker y más'
title: Instalar
x-i18n:
    generated_at: "2026-07-11T23:13:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Requisitos del sistema

- **Node 22.19+, 23.11+ o 24+**: Node 24 es el objetivo predeterminado; el script de instalación se encarga de esto automáticamente.
- **macOS, Linux o Windows**: los usuarios de Windows pueden comenzar con la aplicación nativa Windows Hub, el instalador de la CLI para PowerShell o un Gateway en WSL2. Consulta [Windows](/es/platforms/windows).
- `pnpm` solo es necesario si compilas desde el código fuente.

## Recomendado: script de instalación

La forma más rápida de instalar. Detecta tu sistema operativo, instala Node si es necesario, instala OpenClaw e inicia la configuración inicial.

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

Para consultar todas las opciones y las alternativas de CI/automatización, consulta [Detalles internos del instalador](/es/install/installer).

## Métodos de instalación alternativos

### Instalador con prefijo local (`install-cli.sh`)

Utiliza esta opción cuando quieras mantener OpenClaw y Node bajo un prefijo local como
`~/.openclaw`, sin depender de una instalación de Node para todo el sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

De forma predeterminada, admite instalaciones mediante npm, además de instalaciones
desde una copia de trabajo de Git con el mismo flujo de prefijo. Referencia completa:
[Detalles internos del instalador](/es/install/installer#install-clish).

¿Ya está instalado? Alterna entre instalaciones desde paquetes y desde Git con
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
    El instalador alojado elimina los filtros de antigüedad de npm, como `min-release-age`,
    para instalar el paquete de OpenClaw. Si realizas la instalación manualmente con npm,
    se seguirá aplicando tu propia política de npm.
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
    Bun es compatible con la instalación global de la CLI. Para ejecutar el Gateway, Node sigue siendo el entorno de ejecución recomendado para el daemon.
    </Note>

  </Tab>
</Tabs>

### Desde el código fuente

Para colaboradores o cualquier persona que quiera ejecutar OpenClaw desde una copia de trabajo local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

También puedes omitir el enlace y utilizar `pnpm openclaw ...` desde el repositorio. Consulta [Configuración](/es/start/setup) para conocer los flujos de trabajo de desarrollo completos.

### Instalación desde la rama principal de GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Contenedores y gestores de paquetes

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="container">
    Implementaciones en contenedores o sin interfaz gráfica.
  </Card>
  <Card title="Podman" href="/es/install/podman" icon="container">
    Alternativa a Docker para contenedores sin privilegios de usuario raíz.
  </Card>
  <Card title="Nix" href="/es/install/nix" icon="snowflake">
    Instalación declarativa mediante un flake de Nix.
  </Card>
  <Card title="Ansible" href="/es/install/ansible" icon="server">
    Aprovisionamiento automatizado de flotas.
  </Card>
  <Card title="Bun" href="/es/install/bun" icon="zap">
    Uso exclusivo de la CLI mediante el entorno de ejecución Bun.
  </Card>
</CardGroup>

## Verificar la instalación

```bash
openclaw --version      # confirmar que la CLI está disponible
openclaw doctor         # comprobar si hay problemas de configuración
openclaw gateway status # verificar que el Gateway esté en ejecución
```

Si quieres que el inicio se gestione automáticamente después de la instalación:

- macOS: LaunchAgent mediante `openclaw onboard --install-daemon` u `openclaw gateway install`
- Linux/WSL2: servicio de usuario de systemd mediante los mismos comandos
- Windows nativo: primero, una tarea programada; si se deniega su creación, se utiliza como alternativa un elemento de inicio de sesión por usuario en la carpeta de inicio

## Alojamiento e implementación

Implementa OpenClaw en un servidor en la nube o VPS. Consulta [Servidor Linux](/es/vps) para ver el
selector completo de proveedores (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi y otros), o realiza una implementación declarativa en
[Render](/es/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/es/vps">
    Elige un proveedor.
  </Card>
  <Card title="Máquina virtual con Docker" href="/es/install/docker-vm-runtime">
    Pasos compartidos para Docker.
  </Card>
  <Card title="Kubernetes" href="/es/install/kubernetes">
    Implementación en K8s.
  </Card>
</CardGroup>

## Actualizar, migrar o desinstalar

<CardGroup cols={3}>
  <Card title="Actualización" href="/es/install/updating" icon="refresh-cw">
    Mantén OpenClaw actualizado.
  </Card>
  <Card title="Migración" href="/es/install/migrating" icon="arrow-right">
    Traslada OpenClaw a un equipo nuevo.
  </Card>
  <Card title="Desinstalación" href="/es/install/uninstall" icon="trash-2">
    Elimina OpenClaw por completo.
  </Card>
</CardGroup>

## Solución de problemas: no se encuentra `openclaw`

Casi siempre se debe a un problema con PATH: el directorio global de ejecutables de npm no está incluido en el `PATH` del shell. Consulta [Solución de problemas de Node.js](/es/install/node#troubleshooting) para ver la solución completa, incluida la ruta de Windows.

```bash
node -v           # ¿Está instalado Node?
npm prefix -g     # ¿Dónde están los paquetes globales?
echo "$PATH"      # ¿Está el directorio global de ejecutables en PATH?
```
