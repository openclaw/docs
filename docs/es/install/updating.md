---
read_when:
    - Actualizar OpenClaw
    - Algo falla después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), más estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-05-02T05:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

Mantén OpenClaw actualizado.

## Recomendado: `openclaw update`

La forma más rápida de actualizar. Detecta tu tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el Gateway.

```bash
openclaw update
```

Para cambiar de canal o apuntar a una versión específica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` prefiere beta, pero el runtime vuelve a stable/latest cuando
falta la etiqueta beta o es anterior a la última versión estable. Usa `--tag beta`
si quieres el dist-tag beta sin procesar de npm para una actualización puntual del paquete.

Consulta [Canales de desarrollo](/es/install/development-channels) para la semántica de los canales.

## Cambiar entre instalaciones npm y git

Usa canales cuando quieras cambiar el tipo de instalación. El actualizador mantiene tu
estado, configuración, credenciales y espacio de trabajo en `~/.openclaw`; solo cambia
qué instalación de código de OpenClaw usan la CLI y el Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Ejecuta primero con `--dry-run` para previsualizar el cambio exacto de modo de instalación:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

El canal `dev` garantiza un checkout de git, lo compila e instala la CLI global
desde ese checkout. Los canales `stable` y `beta` usan instalaciones de paquete. Si el
Gateway ya está instalado, `openclaw update` actualiza los metadatos del servicio
y lo reinicia, salvo que pases `--no-restart`.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Agrega `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico mediante
el instalador, pasa `--install-method git --no-onboard` o
`--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. El instalador no llama al actualizador antiguo; ejecuta directamente la instalación
global del paquete y puede recuperar una instalación npm actualizada parcialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Para fijar la recuperación a una versión o dist-tag específicos, agrega `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manual

```bash
npm i -g openclaw@latest
```

Cuando `openclaw update` gestiona una instalación npm global, primero instala el destino en
un prefijo npm temporal, verifica el inventario `dist` empaquetado y luego intercambia
el árbol de paquete limpio al prefijo global real. Eso evita que npm superponga un
paquete nuevo sobre archivos obsoletos del paquete antiguo. Si el comando de instalación falla,
OpenClaw lo reintenta una vez con `--omit=optional`. Ese reintento ayuda a los hosts donde las
dependencias opcionales nativas no pueden compilarse, mientras mantiene visible el fallo original
si la alternativa también falla.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Temas avanzados de instalación npm

<AccordionGroup>
  <Accordion title="Árbol de paquetes de solo lectura">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en runtime, incluso cuando el directorio global del paquete permite escritura al usuario actual. Las instalaciones de paquetes de plugins residen en raíces npm/git propiedad de OpenClaw bajo el directorio de configuración del usuario, y el inicio del Gateway no modifica el árbol de paquetes de OpenClaw.

    Algunas configuraciones npm de Linux instalan paquetes globales en directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño porque los comandos de instalación/actualización de plugins escriben fuera de ese directorio global del paquete.

  </Accordion>
  <Accordion title="Unidades systemd endurecidas">
    Dale a OpenClaw acceso de escritura a sus raíces de configuración/estado para que las instalaciones explícitas de plugins, las actualizaciones de plugins y la limpieza de doctor puedan conservar sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Comprobación previa de espacio en disco">
    Antes de las actualizaciones de paquetes y las instalaciones explícitas de plugins, OpenClaw intenta una comprobación de espacio en disco de mejor esfuerzo para el volumen de destino. El espacio bajo produce una advertencia con la ruta comprobada, pero no bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real del gestor de paquetes y la verificación posterior a la instalación siguen siendo autoritativas.
  </Accordion>
</AccordionGroup>

## Actualizador automático

El actualizador automático está desactivado de forma predeterminada. Actívalo en `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal    | Comportamiento                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| `stable` | Espera `stableDelayHours` y luego aplica con jitter determinista en `stableJitterHours` (despliegue distribuido). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica de inmediato.                              |
| `dev`    | Sin aplicación automática. Usa `openclaw update` manualmente.                                                           |

El Gateway también registra una sugerencia de actualización al iniciar (desactívala con `update.checkOnStart: false`).
Para una reversión a una versión anterior o recuperación ante incidentes, establece `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Las sugerencias de actualización al iniciar todavía pueden ejecutarse salvo que `update.checkOnStart` también esté desactivado.

Las actualizaciones del gestor de paquetes solicitadas mediante el manejador activo del plano de control del Gateway
fuerzan un reinicio de actualización sin diferimiento ni enfriamiento después del intercambio de paquete. Eso
evita dejar un proceso antiguo en memoria el tiempo suficiente para cargar de forma diferida fragmentos
desde un árbol de paquetes que ya fue reemplazado. El shell `openclaw update`
sigue siendo la ruta preferida para instalaciones supervisadas porque puede detener y
reiniciar el servicio alrededor de la actualización.

## Después de actualizar

<Steps>

### Ejecutar doctor

```bash
openclaw doctor
```

Migra la configuración, audita las políticas de DM y comprueba la salud del Gateway. Detalles: [Doctor](/es/gateway/doctor)

### Reiniciar el Gateway

```bash
openclaw gateway restart
```

### Verificar

```bash
openclaw health
```

</Steps>

## Reversión

### Fijar una versión (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` muestra la versión publicada actual.
</Tip>

### Fijar un commit (código fuente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a la versión más reciente: `git checkout main && git pull`.

## Si estás bloqueado

- Ejecuta `openclaw doctor` de nuevo y lee la salida detenidamente.
- Para `openclaw update --channel dev` en checkouts de código fuente, el actualizador inicializa automáticamente `pnpm` cuando es necesario. Si ves un error de inicialización de pnpm/corepack, instala `pnpm` manualmente (o vuelve a activar `corepack`) y vuelve a ejecutar la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de salud después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración de versiones mayores.
