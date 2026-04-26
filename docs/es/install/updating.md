---
read_when:
    - Actualizar OpenClaw
    - Algo falla después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-04-26T11:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
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
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # vista previa sin aplicar
```

`--channel beta` prefiere beta, pero el runtime vuelve a stable/latest cuando
falta la etiqueta beta o es más antigua que la última versión estable. Usa `--tag beta`
si quieres la dist-tag beta sin procesar de npm para una actualización puntual del paquete.

Consulta [Canales de desarrollo](/es/install/development-channels) para la semántica de los canales.

## Cambiar entre instalaciones npm y git

Usa canales cuando quieras cambiar el tipo de instalación. El actualizador conserva tu
estado, configuración, credenciales y espacio de trabajo en `~/.openclaw`; solo cambia
qué instalación de código de OpenClaw usan la CLI y el gateway.

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
desde ese checkout. Los canales `stable` y `beta` usan instalaciones de paquetes. Si el
gateway ya está instalado, `openclaw update` actualiza la metadata del servicio
y lo reinicia salvo que pases `--no-restart`.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico desde
el instalador, pasa `--install-method git --no-onboard` o
`--install-method npm --no-onboard`.

## Alternativa: npm, pnpm o bun manuales

```bash
npm i -g openclaw@latest
```

Cuando `openclaw update` gestiona una instalación global de npm, primero ejecuta el comando normal
de instalación global. Si ese comando falla, OpenClaw vuelve a intentarlo una vez con
`--omit=optional`. Ese reintento ayuda en hosts donde las dependencias opcionales nativas
no pueden compilarse, manteniendo visible el fallo original si la alternativa también
falla.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalaciones globales de npm y dependencias de runtime

OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en tiempo de ejecución, incluso cuando el
directorio global del paquete puede escribirse con el usuario actual. Las dependencias de runtime
de Plugin incluidas se preparan en un directorio de runtime escribible en lugar de modificar
el árbol del paquete. Esto evita que `openclaw update` entre en conflicto con un gateway en ejecución o un
agente local que esté reparando dependencias de Plugin durante la misma instalación.

Algunas configuraciones de npm en Linux instalan paquetes globales bajo directorios propiedad de root como
`/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño mediante la
misma ruta de preparación externa.

Para unidades systemd reforzadas, configura un directorio de preparación escribible que esté incluido en
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` no está configurado, OpenClaw usa `$STATE_DIRECTORY` cuando
systemd lo proporciona y luego recurre a `~/.openclaw/plugin-runtime-deps`.
El paso de reparación trata esa zona de preparación como una raíz de paquete local propiedad de OpenClaw y
omite la configuración de npm global/prefix del usuario, por lo que la configuración npm de instalación global no
redirige las dependencias de Plugin incluidas a `~/node_modules` ni al árbol global de paquetes.

Antes de actualizaciones de paquetes y reparaciones de dependencias de runtime incluidas, OpenClaw intenta
una comprobación de espacio en disco de mejor esfuerzo para el volumen de destino. El poco espacio produce una advertencia
con la ruta comprobada, pero no bloquea la actualización porque las cuotas del sistema de archivos,
las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real de npm,
la copia y la verificación posterior a la instalación siguen siendo autoritativas.

### Dependencias de runtime de Plugin incluidas

Las instalaciones empaquetadas mantienen las dependencias de runtime de Plugin incluidas fuera del árbol
de paquetes de solo lectura. En el arranque y durante `openclaw doctor --fix`, OpenClaw repara
las dependencias de runtime solo para los plugins incluidos que están activos en la configuración, activos
mediante configuración heredada de canal o habilitados por el valor predeterminado del manifiesto incluido.
El estado persistido de autenticación de canal por sí solo no activa la reparación de dependencias de runtime
en el arranque del Gateway.

La desactivación explícita prevalece. Un plugin o canal desactivado no recibe reparación de sus
dependencias de runtime solo porque exista en el paquete. Los plugins externos y rutas de carga personalizadas siguen usando `openclaw plugins install` o
`openclaw plugins update`.

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

| Canal    | Comportamiento                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Espera `stableDelayHours`, luego aplica con jitter determinista a lo largo de `stableJitterHours` (despliegue escalonado). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica inmediatamente.                  |
| `dev`    | No hay aplicación automática. Usa `openclaw update` manualmente.                                               |

El gateway también registra una sugerencia de actualización al arrancar (desactívala con `update.checkOnStart: false`).

## Después de actualizar

<Steps>

### Ejecutar doctor

```bash
openclaw doctor
```

Migra la configuración, audita políticas de DM y comprueba la salud del gateway. Detalles: [Doctor](/es/gateway/doctor)

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

### Fijar un commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a la última: `git checkout main && git pull`.

## Si estás bloqueado

- Ejecuta `openclaw doctor` otra vez y lee con atención la salida.
- Para `openclaw update --channel dev` en checkouts de source, el actualizador inicializa automáticamente `pnpm` cuando hace falta. Si ves un error de inicialización de pnpm/corepack, instala `pnpm` manualmente (o vuelve a habilitar `corepack`) y repite la actualización.
- Consulta: [Resolución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Descripción general de la instalación](/es/install) — todos los métodos de instalación
- [Doctor](/es/gateway/doctor) — comprobaciones de salud después de las actualizaciones
- [Migración](/es/install/migrating) — guías de migración de versiones principales
