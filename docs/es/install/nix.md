---
read_when:
    - Quieres instalaciones reproducibles y que se puedan revertir
    - Ya usas Nix/NixOS/Home Manager
    - Quieres que todo esté fijado y gestionado de forma declarativa
summary: Instalar OpenClaw de forma declarativa con Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
---

Instala OpenClaw declarativamente con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**: el módulo Home Manager oficial y con todo incluido.

<Info>
El repositorio [nix-openclaw](https://github.com/openclaw/nix-openclaw) es la fuente de referencia para la instalación con Nix. Esta página es un resumen rápido.
</Info>

## Qué obtienes

- Gateway + app de macOS + herramientas (whisper, spotify, cameras), todo fijado
- Servicio launchd que sobrevive a los reinicios
- Sistema de Plugin con configuración declarativa
- Reversión instantánea: `home-manager switch --rollback`

## Inicio rápido

<Steps>
  <Step title="Instalar Determinate Nix">
    Si Nix aún no está instalado, sigue las instrucciones del [instalador Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crear un flake local">
    Usa la plantilla agent-first del repositorio nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configurar secretos">
    Configura el token de tu bot de mensajería y la clave de API del proveedor de modelos. Los archivos planos en `~/.secrets/` funcionan bien.
  </Step>
  <Step title="Completar los marcadores de posición de la plantilla y cambiar">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirma que el servicio launchd esté en ejecución y que tu bot responda a los mensajes.
  </Step>
</Steps>

Consulta el [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas las opciones y ejemplos del módulo.

## Comportamiento de ejecución en modo Nix

Cuando se establece `OPENCLAW_NIX_MODE=1` (automático con nix-openclaw), OpenClaw entra en un modo determinista para instalaciones administradas por Nix. Otros paquetes de Nix pueden establecer el mismo modo; nix-openclaw es la referencia oficial.

También puedes establecerlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

En macOS, la app de GUI no hereda automáticamente las variables de entorno del shell. Habilita el modo Nix mediante defaults en su lugar:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Qué cambia en el modo Nix

- Los flujos de instalación automática y automodificación están deshabilitados
- `openclaw.json` se trata como inmutable. Los valores predeterminados derivados del arranque permanecen solo en tiempo de ejecución, y los escritores de configuración como setup, onboarding, `openclaw update` mutante, instalación/actualización/desinstalación/habilitación de Plugin, `doctor --fix`, `doctor --generate-gateway-token` y `openclaw config set` se niegan a editar el archivo.
- Los agentes deben editar la fuente de Nix en su lugar. Para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first y define la configuración en `programs.openclaw.config` o `instances.<name>.config`.
- Las dependencias faltantes muestran mensajes de corrección específicos de Nix
- La UI muestra un banner de modo Nix de solo lectura

### Rutas de configuración y estado

OpenClaw lee la configuración JSON5 desde `OPENCLAW_CONFIG_PATH` y almacena datos mutables en `OPENCLAW_STATE_DIR`. Al ejecutarse bajo Nix, establece estas rutas explícitamente en ubicaciones administradas por Nix para que el estado de ejecución y la configuración queden fuera del almacén inmutable.

| Variable               | Predeterminado                         |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Detección de PATH del servicio

El servicio Gateway de launchd/systemd descubre automáticamente los binarios del perfil de Nix para que los plugins y herramientas que invocan ejecutables instalados con `nix` mediante shell funcionen sin configurar PATH manualmente:

- Cuando `NIX_PROFILES` está establecido, cada entrada se añade al PATH del servicio con precedencia de derecha a izquierda (coincide con la precedencia del shell de Nix: gana el elemento más a la derecha).
- Cuando `NIX_PROFILES` no está establecido, `~/.nix-profile/bin` se añade como alternativa.

Esto se aplica tanto a los entornos de servicio launchd de macOS como systemd de Linux.

## Relacionado

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo Home Manager de referencia y guía completa de configuración.
  </Card>
  <Card title="Asistente de configuración" href="/es/start/wizard" icon="wand-magic-sparkles">
    Guía paso a paso de configuración de CLI sin Nix.
  </Card>
  <Card title="Docker" href="/es/install/docker" icon="docker">
    Configuración en contenedor como alternativa sin Nix.
  </Card>
  <Card title="Actualización" href="/es/install/updating" icon="arrow-up-right-from-square">
    Actualización de instalaciones administradas por Home Manager junto con el paquete.
  </Card>
</CardGroup>
