---
read_when:
    - Quieres instalaciones reproducibles y reversibles
    - Ya usas Nix/NixOS/Home Manager
    - Quiere que todo esté fijado y gestionado de forma declarativa
summary: Instalar OpenClaw de forma declarativa con Nix
title: Nix
x-i18n:
    generated_at: "2026-07-05T11:27:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Instala OpenClaw de forma declarativa con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, el módulo oficial de Home Manager con todo incluido.

<Info>
El repositorio [nix-openclaw](https://github.com/openclaw/nix-openclaw) es la fuente de verdad para la instalación con Nix. Esta página es un resumen rápido.
</Info>

## Qué obtienes

- Gateway + app de macOS + herramientas (whisper, spotify, cameras), todo fijado
- Servicio launchd que sobrevive a reinicios
- Sistema de Plugin con configuración declarativa
- Reversión instantánea: `home-manager switch --rollback`

## Inicio rápido

<Steps>
  <Step title="Instalar Determinate Nix">
    Si Nix aún no está instalado, sigue las instrucciones del [instalador de Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crear un flake local">
    Usa la plantilla centrada en agentes del repositorio nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configurar secretos">
    Configura el token de tu bot de mensajería y la clave de API del proveedor de modelos. Los archivos simples en `~/.secrets/` funcionan bien.
  </Step>
  <Step title="Rellenar los marcadores de posición de la plantilla y cambiar">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirma que el servicio launchd esté en ejecución y que tu bot responda a los mensajes.
  </Step>
</Steps>

Consulta el [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas las opciones y ejemplos del módulo.

## Comportamiento de runtime en modo Nix

Cuando se establece `OPENCLAW_NIX_MODE=1` (automático con nix-openclaw), OpenClaw entra en un modo determinista para instalaciones gestionadas por Nix. Otros paquetes de Nix pueden establecer el mismo modo; nix-openclaw es la referencia oficial.

También puedes establecerlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

En macOS, la app GUI no hereda las variables de entorno del shell. En su lugar, habilita el modo Nix mediante `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Qué cambia en modo Nix

- Los flujos de autoinstalación y automutación están deshabilitados.
- `openclaw.json` se trata como inmutable. Los valores predeterminados derivados del inicio permanecen solo en runtime, y los escritores de configuración (configuración inicial, onboarding, `openclaw update` mutante, instalación/actualización/desinstalación/habilitación de Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) se niegan a editar el archivo.
- Edita la fuente de Nix en su lugar. Para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en agentes y establece la configuración en `programs.openclaw.config` o `instances.<name>.config`.
- Las dependencias faltantes muestran mensajes de remediación específicos de Nix.
- La UI muestra un banner de modo Nix de solo lectura.

### Rutas de configuración y estado

OpenClaw lee la configuración JSON5 desde `OPENCLAW_CONFIG_PATH` y almacena datos mutables en `OPENCLAW_STATE_DIR`. En Nix, establécelas explícitamente en ubicaciones gestionadas por Nix para que el estado de runtime y la configuración queden fuera del almacén inmutable.

| Variable               | Valor predeterminado                    |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Descubrimiento de PATH del servicio

El servicio Gateway de launchd/systemd descubre automáticamente los binarios de perfiles de Nix para que los Plugins y herramientas que invocan ejecutables instalados con `nix` mediante shell funcionen sin configurar PATH manualmente:

- Cuando `NIX_PROFILES` está establecido, cada entrada se añade al PATH del servicio con precedencia de derecha a izquierda (coincide con la precedencia del shell de Nix: gana el de más a la derecha).
- Cuando `NIX_PROFILES` no está establecido, `~/.nix-profile/bin` se añade como alternativa.

Esto se aplica tanto a los entornos de servicio launchd de macOS como systemd de Linux.

## Relacionado

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo de Home Manager fuente de verdad y guía completa de configuración.
  </Card>
  <Card title="Asistente de configuración" href="/es/start/wizard" icon="wand-magic-sparkles">
    Recorrido de configuración de CLI sin Nix.
  </Card>
  <Card title="Docker" href="/es/install/docker" icon="docker">
    Configuración en contenedor como alternativa sin Nix.
  </Card>
  <Card title="Actualización" href="/es/install/updating" icon="arrow-up-right-from-square">
    Actualización de instalaciones gestionadas por Home Manager junto con el paquete.
  </Card>
</CardGroup>
