---
read_when:
    - Quieres instalaciones reproducibles y reversibles
    - Ya utilizas Nix/NixOS/Home Manager
    - Quieres que todo esté fijado y gestionado de forma declarativa
summary: Instala OpenClaw de forma declarativa con Nix
title: Nix
x-i18n:
    generated_at: "2026-07-11T23:13:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Instala OpenClaw de forma declarativa con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, el módulo oficial de Home Manager que incluye todo lo necesario.

<Info>
El repositorio [nix-openclaw](https://github.com/openclaw/nix-openclaw) es la fuente de referencia para la instalación con Nix. Esta página ofrece una descripción general rápida.
</Info>

## Qué obtienes

- Gateway + aplicación para macOS + herramientas (whisper, spotify, cámaras), todo con versiones fijadas
- Servicio launchd que se mantiene tras los reinicios
- Sistema de Plugins con configuración declarativa
- Reversión instantánea: `home-manager switch --rollback`

## Inicio rápido

<Steps>
  <Step title="Instalar Determinate Nix">
    Si Nix aún no está instalado, sigue las instrucciones del [instalador de Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crear un flake local">
    Usa la plantilla orientada a agentes del repositorio nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copia templates/agent-first/flake.nix desde el repositorio nix-openclaw
    ```
  </Step>
  <Step title="Configurar secretos">
    Configura el token de tu bot de mensajería y la clave de API del proveedor de modelos. Los archivos de texto sin formato en `~/.secrets/` funcionan correctamente.
  </Step>
  <Step title="Completar los marcadores de posición de la plantilla y aplicar">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirma que el servicio launchd esté en ejecución y que tu bot responda a los mensajes.
  </Step>
</Steps>

Consulta el [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas las opciones y ejemplos del módulo.

## Comportamiento del entorno de ejecución en modo Nix

Cuando se establece `OPENCLAW_NIX_MODE=1` (automáticamente con nix-openclaw), OpenClaw entra en un modo determinista para las instalaciones administradas por Nix. Otros paquetes de Nix pueden establecer el mismo modo; nix-openclaw es la referencia oficial.

También puedes establecerlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

En macOS, la aplicación con interfaz gráfica no hereda las variables de entorno del shell. En su lugar, activa el modo Nix mediante `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Qué cambia en el modo Nix

- Los flujos de instalación automática y modificación propia están desactivados.
- `openclaw.json` se considera inmutable. Los valores predeterminados derivados durante el inicio solo se mantienen en el entorno de ejecución, y los procesos que escriben la configuración (configuración inicial, incorporación, `openclaw update` con modificaciones, instalación/actualización/desinstalación/activación de Plugins, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) se niegan a editar el archivo.
- Edita la fuente de Nix en su lugar. Para nix-openclaw, utiliza el [inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes y establece la configuración en `programs.openclaw.config` o `instances.<name>.config`.
- Las dependencias que faltan generan mensajes de corrección específicos de Nix.
- La interfaz de usuario muestra un aviso de modo Nix de solo lectura.

### Rutas de configuración y estado

OpenClaw lee la configuración JSON5 desde `OPENCLAW_CONFIG_PATH` y almacena los datos mutables en `OPENCLAW_STATE_DIR`. En Nix, establece estas rutas explícitamente en ubicaciones administradas por Nix para que el estado del entorno de ejecución y la configuración permanezcan fuera del almacén inmutable.

| Variable               | Valor predeterminado                    |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Detección de PATH del servicio

El servicio Gateway de launchd/systemd detecta automáticamente los binarios de los perfiles de Nix para que los Plugins y las herramientas que invocan ejecutables instalados con `nix` funcionen sin configurar manualmente PATH:

- Cuando se establece `NIX_PROFILES`, cada entrada se añade al PATH del servicio con precedencia de derecha a izquierda (coincide con la precedencia del shell de Nix: prevalece la entrada situada más a la derecha).
- Cuando `NIX_PROFILES` no está establecido, se añade `~/.nix-profile/bin` como alternativa.

Esto se aplica tanto a los entornos de servicio launchd de macOS como a los de systemd de Linux.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo de Home Manager de referencia y guía de configuración completa.
  </Card>
  <Card title="Asistente de configuración" href="/es/start/wizard" icon="wand-magic-sparkles">
    Guía paso a paso para la configuración mediante la CLI sin Nix.
  </Card>
  <Card title="Docker" href="/es/install/docker" icon="docker">
    Configuración en contenedores como alternativa sin Nix.
  </Card>
  <Card title="Actualización" href="/es/install/updating" icon="arrow-up-right-from-square">
    Actualización de las instalaciones administradas por Home Manager junto con el paquete.
  </Card>
</CardGroup>
