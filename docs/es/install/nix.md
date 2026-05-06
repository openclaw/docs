---
read_when:
    - Quieres instalaciones reproducibles y que se puedan revertir
    - Ya estás usando Nix/NixOS/Home Manager
    - Quieres que todo esté fijado y gestionado de forma declarativa
summary: Instalar OpenClaw de forma declarativa con Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T05:39:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Instala OpenClaw de forma declarativa con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, un módulo de Home Manager con todo incluido.

<Info>
El repositorio [nix-openclaw](https://github.com/openclaw/nix-openclaw) es la fuente de referencia para la instalación con Nix. Esta página es un resumen rápido.
</Info>

## Qué obtienes

- Gateway + app de macOS + herramientas (whisper, spotify, cámaras), todo fijado
- Servicio launchd que sobrevive a los reinicios
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
  <Step title="Completar los marcadores de posición de la plantilla y cambiar">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirma que el servicio launchd se esté ejecutando y que tu bot responda a los mensajes.
  </Step>
</Steps>

Consulta el [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas las opciones del módulo y ejemplos.

## Comportamiento en tiempo de ejecución del modo Nix

Cuando `OPENCLAW_NIX_MODE=1` está definido (automático con nix-openclaw), OpenClaw entra en un modo determinista que desactiva los flujos de instalación automática.

También puedes definirlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

En macOS, la app GUI no hereda automáticamente las variables de entorno del shell. Activa el modo Nix mediante defaults en su lugar:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Qué cambia en el modo Nix

- Los flujos de instalación automática y automodificación están desactivados
- Las dependencias faltantes muestran mensajes de corrección específicos de Nix
- La UI muestra un banner de modo Nix de solo lectura

### Rutas de configuración y estado

OpenClaw lee la configuración JSON5 desde `OPENCLAW_CONFIG_PATH` y almacena datos mutables en `OPENCLAW_STATE_DIR`. Cuando se ejecuta con Nix, define estas rutas explícitamente en ubicaciones gestionadas por Nix para que el estado en tiempo de ejecución y la configuración queden fuera del almacén inmutable.

| Variable               | Predeterminado                         |
| ---------------------- | -------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                          |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

### Detección de PATH del servicio

El servicio Gateway de launchd/systemd detecta automáticamente los binarios del perfil de Nix para que los plugins y herramientas que ejecutan comandos de shell hacia ejecutables instalados con `nix` funcionen sin configuración manual de PATH:

- Cuando `NIX_PROFILES` está definido, cada entrada se añade al PATH del servicio con precedencia de derecha a izquierda (coincide con la precedencia del shell de Nix: gana el valor más a la derecha).
- Cuando `NIX_PROFILES` no está definido, `~/.nix-profile/bin` se añade como respaldo.

Esto se aplica tanto a los entornos de servicio launchd de macOS como a los de systemd en Linux.

## Relacionado

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo de Home Manager fuente de referencia y guía completa de configuración.
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
