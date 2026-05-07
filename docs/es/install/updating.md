---
read_when:
    - Actualizar OpenClaw
    - Algo deja de funcionar después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de una estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-05-07T01:52:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
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

`openclaw update` no acepta `--verbose`. Para diagnósticos de actualización, usa
`--dry-run` para previsualizar las acciones planificadas, `--json` para resultados estructurados, o
`openclaw update status --json` para inspeccionar el estado del canal y la disponibilidad. El
instalador tiene su propia marca `--verbose`, pero esa marca no forma parte de
`openclaw update`.

`--channel beta` prefiere beta, pero el runtime vuelve a stable/latest cuando
la etiqueta beta falta o es más antigua que la última versión estable. Usa `--tag beta`
si quieres el dist-tag beta sin procesar de npm para una actualización puntual del paquete.

OpenClaw todavía no expone un canal de actualización LTS ni de soporte mensual. Estamos
trabajando para ofrecer líneas de soporte mensual compatibles con SemVer, pero hoy los canales
compatibles siguen siendo `stable`, `beta` y `dev`.

Consulta [Canales de desarrollo](/es/install/development-channels) para conocer la semántica de los canales.

## Cambiar entre instalaciones npm y git

Usa canales cuando quieras cambiar el tipo de instalación. El actualizador conserva tu
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
y lo reinicia a menos que pases `--no-restart`.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico mediante
el instalador, pasa `--install-method git --no-onboard` o
`--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. El instalador no llama al actualizador antiguo; ejecuta directamente la
instalación del paquete global y puede recuperar una instalación npm parcialmente actualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Para fijar la recuperación a una versión o dist-tag específico, añade `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manual

```bash
npm i -g openclaw@latest
```

Prefiere `openclaw update` para instalaciones supervisadas porque puede coordinar el
cambio de paquete con el servicio Gateway en ejecución. Si actualizas manualmente mientras se ejecuta un
Gateway administrado, reinicia el Gateway inmediatamente después de que finalice el gestor de paquetes
para que el proceso antiguo no siga sirviendo desde archivos de paquete reemplazados.

Cuando `openclaw update` administra una instalación npm global, primero instala el objetivo en
un prefijo npm temporal, verifica el inventario `dist` empaquetado y luego intercambia
el árbol de paquetes limpio al prefijo global real. Eso evita que npm superponga un
paquete nuevo sobre archivos obsoletos del paquete anterior. Si el comando de instalación falla,
OpenClaw reintenta una vez con `--omit=optional`. Ese reintento ayuda en hosts donde las
dependencias opcionales nativas no pueden compilarse, a la vez que mantiene visible el fallo original
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
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en runtime, incluso cuando el directorio global de paquetes tiene permisos de escritura para el usuario actual. Las instalaciones de paquetes de Plugin viven en raíces npm/git propiedad de OpenClaw bajo el directorio de configuración del usuario, y el arranque del Gateway no muta el árbol de paquetes de OpenClaw.

    Algunas configuraciones npm de Linux instalan paquetes globales bajo directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño porque los comandos de instalación/actualización de Plugin escriben fuera de ese directorio global de paquetes.

  </Accordion>
  <Accordion title="Unidades systemd reforzadas">
    Da a OpenClaw acceso de escritura a sus raíces de configuración/estado para que las instalaciones explícitas de Plugin, las actualizaciones de Plugin y la limpieza de doctor puedan conservar sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Comprobación previa de espacio en disco">
    Antes de actualizaciones de paquetes e instalaciones explícitas de Plugin, OpenClaw intenta una comprobación de espacio en disco de mejor esfuerzo para el volumen objetivo. El espacio bajo produce una advertencia con la ruta comprobada, pero no bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real del gestor de paquetes y la verificación posterior a la instalación siguen siendo autoritativas.
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

| Canal    | Comportamiento                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `stable` | Espera `stableDelayHours` y luego aplica con fluctuación determinista durante `stableJitterHours` (despliegue distribuido). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica inmediatamente.                            |
| `dev`    | Sin aplicación automática. Usa `openclaw update` manualmente.                                                          |

El Gateway también registra una sugerencia de actualización al arrancar (desactívala con `update.checkOnStart: false`).
Para una degradación o recuperación ante incidentes, establece `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Las sugerencias de actualización al arranque aún pueden ejecutarse a menos que `update.checkOnStart` también esté desactivado.

Las actualizaciones del gestor de paquetes solicitadas mediante el controlador del plano de control en vivo del Gateway
fuerzan un reinicio de actualización no diferido y sin periodo de enfriamiento después del cambio de paquete. Eso
evita dejar un proceso antiguo en memoria el tiempo suficiente para cargar de forma diferida fragmentos
desde un árbol de paquetes que ya ha sido reemplazado. El `openclaw update` de shell
sigue siendo la ruta preferida para instalaciones supervisadas porque puede detener y
reiniciar el servicio alrededor de la actualización.

## Después de actualizar

<Steps>

### Ejecutar doctor

```bash
openclaw doctor
```

Migra la configuración, audita políticas de DM y comprueba la salud del Gateway. Detalles: [Doctor](/es/gateway/doctor)

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

### Fijar un commit (fuente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a la versión más reciente: `git checkout main && git pull`.

## Si te atascas

- Ejecuta `openclaw doctor` de nuevo y lee la salida con atención.
- Para `openclaw update --channel dev` en checkouts de fuente, el actualizador autoarranca `pnpm` cuando es necesario. Si ves un error de arranque de pnpm/corepack, instala `pnpm` manualmente (o vuelve a activar `corepack`) y ejecuta de nuevo la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de salud después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración de versiones principales.
