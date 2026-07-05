---
read_when:
    - Actualizando OpenClaw
    - Algo se rompe después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de la estrategia de reversión
title: Actualizando
x-i18n:
    generated_at: "2026-07-05T01:56:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaab9de5c41b8a9ce087a182b9cabe34fbf2e6d14524b10248c5403a2644208a
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
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` no acepta `--verbose`. Para diagnósticos de actualización, usa
`--dry-run` para previsualizar las acciones planificadas, `--json` para resultados estructurados, o
`openclaw update status --json` para inspeccionar el estado del canal y de disponibilidad. El
instalador tiene su propia marca `--verbose`, pero esa marca no forma parte de
`openclaw update`.

`--channel beta` prefiere beta, pero el runtime recurre a stable/latest cuando
falta la etiqueta beta o es más antigua que la versión estable más reciente. Usa `--tag beta`
si quieres la dist-tag beta sin procesar de npm para una actualización puntual del paquete.

`--channel extended-stable` es solo para paquetes y solo en primer plano. OpenClaw lee
el selector público `extended-stable` de npm, verifica el paquete exacto seleccionado
e instala esa versión exacta. Los datos del registro ausentes o inconsistentes fallan
de forma cerrada; nunca recurre a `latest`. Si la versión seleccionada es anterior a
la versión instalada, se sigue aplicando la confirmación normal de degradación.

Usa `--channel dev` para un checkout persistente y móvil de `main` en GitHub. Para
actualizaciones de paquetes, `--tag main` se asigna a `github:openclaw/openclaw#main` para una ejecución, y
las especificaciones de origen de GitHub/git se empaquetan en un tarball temporal antes de la instalación
npm preparada.

Para plugins administrados, la alternativa del canal beta es una advertencia: la actualización del núcleo aún puede
completarse correctamente mientras un plugin usa su versión predeterminada/latest registrada porque no
hay beta del plugin disponible.

Consulta [Canales de desarrollo](/es/install/development-channels) para la semántica de los canales.

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

Ejecútalo primero con `--dry-run` para previsualizar el cambio exacto de modo de instalación:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

El canal `dev` garantiza un checkout de git, lo compila e instala la CLI global
desde ese checkout. Los canales `stable`, `extended-stable` y `beta` usan
instalaciones de paquetes. Extended-stable se rechaza en un checkout de Git sin
mutarlo ni convertirlo. Si el
Gateway ya está instalado, `openclaw update` actualiza los metadatos del servicio
y lo reinicia salvo que pases `--no-restart`.

Para instalaciones de paquetes con un servicio Gateway administrado, `openclaw update` apunta
a la raíz del paquete usada por ese servicio. Si el comando de shell `openclaw` proviene
de una instalación diferente, el actualizador imprime ambas raíces y la ruta de Node del servicio
administrado. La actualización del paquete usa el gestor de paquetes propietario de la raíz
del servicio y comprueba el Node del servicio administrado frente al motor de la versión objetivo
antes de sustituir el paquete.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico mediante
el instalador, pasa `--install-method git --no-onboard` o
`--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. El instalador no llama al actualizador antiguo; ejecuta directamente la instalación
global del paquete y puede recuperar una instalación npm parcialmente actualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Para fijar la recuperación a una versión o dist-tag específica, añade `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manual

```bash
npm i -g openclaw@latest
```

Prefiere `openclaw update` para instalaciones supervisadas porque puede coordinar el
intercambio del paquete con el servicio Gateway en ejecución. Si actualizas manualmente en una
instalación supervisada, detén el Gateway administrado antes de que el gestor de paquetes empiece.
Los gestores de paquetes reemplazan archivos en su ubicación, y un Gateway en ejecución podría intentar
cargar archivos del núcleo o de plugins mientras el árbol de paquetes está temporalmente a medio sustituir.
Reinicia el Gateway después de que el gestor de paquetes termine para que el servicio recoja
la nueva instalación.

Para una instalación global de sistema en Linux propiedad de root, si `openclaw update` falla con
`EACCES` y te recuperas con npm del sistema, mantén el Gateway detenido durante la
sustitución manual del paquete. Usa las mismas marcas de perfil de `openclaw` o el entorno
que usas normalmente para ese Gateway. Sustituye `/usr/bin/npm` por el npm del sistema
propietario del prefijo global propiedad de root en tu host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Luego verifica el servicio:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Cuando `openclaw update` administra una instalación global de npm, primero instala el objetivo en
un prefijo npm temporal, verifica el inventario `dist` empaquetado y luego intercambia
el árbol de paquete limpio al prefijo global real. Eso evita que npm superponga un
paquete nuevo sobre archivos obsoletos del paquete anterior. Si el comando de instalación falla,
OpenClaw reintenta una vez con `--omit=optional`. Ese reintento ayuda en hosts donde las
dependencias opcionales nativas no pueden compilar, manteniendo visible el fallo original
si la alternativa también falla.

Los comandos de actualización npm administrados por OpenClaw y de actualización de plugins también limpian la cuarentena
`min-release-age` de npm para el proceso npm hijo. npm puede informar esa
política como un límite derivado `before`; ambos son útiles para políticas generales de cuarentena
de la cadena de suministro, pero una actualización explícita de OpenClaw significa "instalar ahora la versión
seleccionada de OpenClaw."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Temas avanzados de instalación npm

<AccordionGroup>
  <Accordion title="Árbol de paquetes de solo lectura">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en runtime, incluso cuando el directorio global del paquete puede ser escrito por el usuario actual. Las instalaciones de paquetes de plugins viven en raíces npm/git propiedad de OpenClaw bajo el directorio de configuración del usuario, y el arranque del Gateway no muta el árbol de paquetes de OpenClaw.

    Algunas configuraciones npm de Linux instalan paquetes globales bajo directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño porque los comandos de instalación/actualización de plugins escriben fuera de ese directorio global de paquetes.

  </Accordion>
  <Accordion title="Unidades systemd endurecidas">
    Da a OpenClaw acceso de escritura a sus raíces de configuración/estado para que las instalaciones explícitas de plugins, las actualizaciones de plugins y la limpieza de doctor puedan persistir sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Comprobación previa de espacio en disco">
    Antes de las actualizaciones de paquetes y las instalaciones explícitas de plugins, OpenClaw intenta una comprobación de espacio en disco de mejor esfuerzo para el volumen objetivo. El espacio bajo produce una advertencia con la ruta comprobada, pero no bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real del gestor de paquetes y la verificación posterior a la instalación siguen siendo la autoridad.
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

| Canal             | Comportamiento                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `stable`          | Espera `stableDelayHours` y luego aplica con fluctuación determinista a lo largo de `stableJitterHours` (despliegue distribuido). |
| `extended-stable` | Sin comprobación de arranque ni aplicación automática. Usa `openclaw update` o `openclaw update status` manualmente.              |
| `beta`            | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica inmediatamente.                              |
| `dev`             | Sin aplicación automática. Usa `openclaw update` manualmente.                                                           |

El Gateway también registra una sugerencia de actualización al arrancar (desactívala con `update.checkOnStart: false`).
Las selecciones extended-stable almacenadas omiten por completo la resolución de arranque y en segundo plano.
Para recuperación por degradación o incidente, define `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Las sugerencias de actualización al arrancar aún pueden ejecutarse salvo que `update.checkOnStart` también esté desactivado.

Las actualizaciones del gestor de paquetes solicitadas mediante el manejador del plano de control del Gateway en vivo
no reemplazan el árbol de paquetes dentro del proceso Gateway en ejecución. En instalaciones de servicio
administradas, el Gateway inicia una transferencia desvinculada, sale y deja que la
ruta normal de CLI `openclaw update --yes --json` detenga el servicio, reemplace el
paquete, actualice los metadatos del servicio, reinicie, verifique la versión y
alcanzabilidad del Gateway, y recupere un LaunchAgent de macOS instalado pero no cargado cuando
sea posible. Si el Gateway no puede hacer esa transferencia de forma segura, `update.run` informa un
comando de shell seguro en lugar de ejecutar el gestor de paquetes dentro del proceso.

## Después de actualizar

<Steps>

### Ejecuta doctor

```bash
openclaw doctor
```

Migra la configuración, audita políticas de DM y comprueba la salud del Gateway. Detalles: [Doctor](/es/gateway/doctor)

### Reinicia el Gateway

```bash
openclaw gateway restart
```

### Verifica

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

Para volver a la más reciente: `git checkout main && git pull`.

## Si estás bloqueado

- Ejecuta `openclaw doctor` de nuevo y lee atentamente la salida.
- Para `openclaw update --channel dev` en checkouts de código fuente, el actualizador inicializa automáticamente `pnpm` cuando es necesario. Si ves un error de bootstrap de pnpm/corepack, instala `pnpm` manualmente (o reactiva `corepack`) y vuelve a ejecutar la actualización.
- Comprueba: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de salud después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración de versiones principales.
