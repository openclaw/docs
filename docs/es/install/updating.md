---
read_when:
    - Actualizar OpenClaw
    - Algo se rompe después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde código fuente), además de estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-04-24T05:36:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

Mantén OpenClaw actualizado.

## Recomendado: `openclaw update`

La forma más rápida de actualizar. Detecta tu tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el gateway.

```bash
openclaw update
```

Para cambiar de canal o apuntar a una versión específica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # vista previa sin aplicar
```

`--channel beta` prefiere beta, pero el entorno de ejecución usa como respaldo stable/latest cuando
la etiqueta beta falta o es más antigua que la última versión estable. Usa `--tag beta`
si quieres la dist-tag beta sin procesar de npm para una actualización puntual del paquete.

Consulta [Canales de desarrollo](/es/install/development-channels) para la semántica de canales.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para instalaciones desde código fuente, pasa `--install-method git --no-onboard`.

## Alternativa: npm, pnpm o bun manual

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalaciones globales de npm propiedad de root

Algunas configuraciones de npm en Linux instalan paquetes globales bajo directorios propiedad de root como
`/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño: el paquete instalado
se trata como de solo lectura en tiempo de ejecución, y las dependencias de entorno de ejecución
de Plugins integrados se preparan en un directorio escribible de entorno de ejecución en lugar de mutar
el árbol del paquete.

Para unidades systemd reforzadas, establece un directorio de preparación escribible que esté incluido en
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` no está configurado, OpenClaw usa `$STATE_DIRECTORY` cuando
systemd lo proporciona y, si no, usa como respaldo `~/.openclaw/plugin-runtime-deps`.

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
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| `stable` | Espera `stableDelayHours`, luego aplica con jitter determinista a lo largo de `stableJitterHours` (despliegue escalonado). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica inmediatamente.                        |
| `dev`    | Sin aplicación automática. Usa `openclaw update` manualmente.                                                       |

El gateway también registra una sugerencia de actualización al iniciar (desactívala con `update.checkOnStart: false`).

## Después de actualizar

<Steps>

### Ejecutar doctor

```bash
openclaw doctor
```

Migra la configuración, audita políticas de mensajes directos y comprueba el estado del gateway. Detalles: [Doctor](/es/gateway/doctor)

### Reiniciar el gateway

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

Consejo: `npm view openclaw version` muestra la versión publicada actual.

### Fijar un commit (código fuente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a latest: `git checkout main && git pull`.

## Si estás atascado

- Ejecuta `openclaw doctor` de nuevo y lee cuidadosamente la salida.
- Para `openclaw update --channel dev` en checkouts de código fuente, el actualizador inicia automáticamente `pnpm` cuando hace falta. Si ves un error de inicio de pnpm/corepack, instala `pnpm` manualmente (o vuelve a habilitar `corepack`) y vuelve a ejecutar la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Doctor](/es/gateway/doctor) — comprobaciones de estado después de actualizaciones
- [Migración](/es/install/migrating) — guías de migración de versiones principales
