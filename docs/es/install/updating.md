---
read_when:
    - Actualizar OpenClaw
    - Algo deja de funcionar después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de una estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-04-30T05:48:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Mantén OpenClaw actualizado.

## Recomendado: `openclaw update`

La forma más rápida de actualizar. Detecta tu tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el Gateway.

```bash
openclaw update
```

Para cambiar de canales o apuntar a una versión específica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` prefiere beta, pero el runtime vuelve a stable/latest cuando
falta la etiqueta beta o es más antigua que la última versión estable. Usa `--tag beta`
si quieres el dist-tag beta sin procesar de npm para una actualización puntual del paquete.

Consulta [Canales de desarrollo](/es/install/development-channels) para ver la semántica de los canales.

## Cambiar entre instalaciones npm y git

Usa canales cuando quieras cambiar el tipo de instalación. El actualizador conserva tu
estado, configuración, credenciales y workspace en `~/.openclaw`; solo cambia
qué instalación del código de OpenClaw usan la CLI y el Gateway.

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

Agrega `--no-onboard` para omitir el onboarding. Para forzar un tipo de instalación específico mediante
el instalador, pasa `--install-method git --no-onboard` o
`--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. El instalador no llama al actualizador antiguo; ejecuta directamente la
instalación del paquete global y puede recuperar una instalación npm parcialmente actualizada.

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

Cuando `openclaw update` gestiona una instalación global de npm, primero instala el destino en
un prefijo temporal de npm, verifica el inventario `dist` empaquetado y luego intercambia
el árbol limpio del paquete al prefijo global real. Eso evita que npm superponga un
paquete nuevo sobre archivos obsoletos del paquete anterior. Si el comando de instalación falla,
OpenClaw lo reintenta una vez con `--omit=optional`. Ese reintento ayuda en hosts donde las
dependencias opcionales nativas no pueden compilarse, mientras mantiene visible el fallo original
si el fallback también falla.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Temas avanzados de instalación npm

<AccordionGroup>
  <Accordion title="Árbol de paquetes de solo lectura">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en runtime, incluso cuando el directorio global del paquete es escribible por el usuario actual. Las dependencias de runtime de Plugin incluidos se preparan en un directorio de runtime escribible en lugar de mutar el árbol del paquete. Esto evita que `openclaw update` compita con un Gateway o un agente local en ejecución que esté reparando dependencias de Plugin durante la misma instalación.

    Algunas configuraciones de npm en Linux instalan paquetes globales bajo directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño mediante la misma ruta externa de preparación.

  </Accordion>
  <Accordion title="Unidades systemd reforzadas">
    Define un directorio de preparación escribible que esté incluido en `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` también acepta una lista de rutas. OpenClaw resuelve las dependencias de runtime de Plugin incluidos de izquierda a derecha en las raíces listadas, trata las raíces anteriores como capas preinstaladas de solo lectura e instala o repara solo en la raíz escribible final:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Si `OPENCLAW_PLUGIN_STAGE_DIR` no está configurado, OpenClaw usa `$STATE_DIRECTORY` cuando systemd lo proporciona, y luego vuelve a `~/.openclaw/plugin-runtime-deps`. El paso de reparación trata esa etapa como una raíz local de paquetes propiedad de OpenClaw e ignora el prefijo npm del usuario y la configuración global, por lo que la configuración npm de instalación global no redirige las dependencias de Plugin incluidos a `~/node_modules` ni al árbol global del paquete.

  </Accordion>
  <Accordion title="Comprobación previa de espacio en disco">
    Antes de actualizaciones de paquetes y reparaciones de dependencias de runtime incluidas, OpenClaw intenta una comprobación de espacio en disco de mejor esfuerzo para el volumen de destino. El espacio bajo produce una advertencia con la ruta comprobada, pero no bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación npm real, la copia y la verificación posterior a la instalación siguen siendo la autoridad.
  </Accordion>
  <Accordion title="Dependencias de runtime de Plugin incluidos">
    Las instalaciones empaquetadas mantienen las dependencias de runtime de Plugin incluidos fuera del árbol de paquetes de solo lectura. Al iniciar y durante `openclaw doctor --fix`, OpenClaw repara las dependencias de runtime solo para los Plugin incluidos que están activos en la configuración, activos mediante configuración de canal heredada o habilitados por el valor predeterminado de su manifiesto incluido. El estado de autenticación de canal persistido por sí solo no activa la reparación de dependencias de runtime al iniciar el Gateway.

    La deshabilitación explícita prevalece. Un Plugin o canal deshabilitado no recibe reparación de sus dependencias de runtime solo porque exista en el paquete. Los Plugin externos y las rutas de carga personalizadas siguen usando `openclaw plugins install` u `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

## Actualizador automático

El actualizador automático está desactivado de forma predeterminada. Habilítalo en `~/.openclaw/openclaw.json`:

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
| `stable` | Espera `stableDelayHours` y luego aplica con jitter determinista durante `stableJitterHours` (despliegue distribuido). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica inmediatamente.                         |
| `dev`    | No aplica automáticamente. Usa `openclaw update` manualmente.                                                       |

El Gateway también registra una sugerencia de actualización al iniciar (desactívala con `update.checkOnStart: false`).
Para una degradación o recuperación ante incidente, configura `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Las sugerencias de actualización al iniciar pueden seguir ejecutándose salvo que `update.checkOnStart` también esté desactivado.

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

## Revertir

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

## Si te quedas bloqueado

- Ejecuta `openclaw doctor` otra vez y lee la salida con atención.
- Para `openclaw update --channel dev` en checkouts de código fuente, el actualizador auto-inicializa `pnpm` cuando hace falta. Si ves un error de bootstrap de pnpm/corepack, instala `pnpm` manualmente (o vuelve a habilitar `corepack`) y vuelve a ejecutar la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de salud después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración de versiones principales.
