---
read_when:
    - Actualización de OpenClaw
    - Algo deja de funcionar después de una actualización
summary: Actualización segura de OpenClaw (instalación global o desde el código fuente), además de una estrategia de reversión
title: Actualizando
x-i18n:
    generated_at: "2026-07-12T14:37:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Mantén OpenClaw actualizado.

Para reemplazar imágenes de Docker, Podman y Kubernetes, consulta
[Actualización de imágenes de contenedor](/es/install/docker#upgrading-container-images). El
Gateway ejecuta durante el inicio las tareas de actualización que son seguras antes de quedar listo y se cierra si el
estado montado requiere reparación manual.

## Recomendado: `openclaw update`

Detecta el tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el Gateway.

```bash
openclaw update
```

Cambia de canal o elige una versión específica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # vista previa sin aplicar
```

`openclaw update` no tiene la opción `--verbose` (el instalador sí). Para el diagnóstico, usa
`--dry-run` para obtener una vista previa de las acciones previstas, `--json` para obtener resultados estructurados o
`openclaw update status --json` para inspeccionar el canal y el estado de disponibilidad.

`--channel beta` prefiere la etiqueta de distribución beta de npm, pero recurre a stable/latest
cuando falta la etiqueta beta o su versión es anterior a la versión estable más reciente.
En su lugar, usa `--tag beta` para realizar una actualización puntual del paquete fijada a la
etiqueta de distribución beta sin procesar de npm.

`--channel extended-stable` solo admite paquetes y la instalación continúa
ejecutándose únicamente en primer plano. OpenClaw lee el selector público `extended-stable` de npm,
verifica el paquete exacto seleccionado e instala esa versión exacta. Si faltan
datos del registro o estos son incoherentes, el proceso falla de forma segura; nunca recurre a `latest`.
Si la versión seleccionada es anterior a la versión instalada, se sigue aplicando la
confirmación de degradación normal. La CLI conserva el canal después de una
actualización correcta del núcleo; una ejecución directa de `npm install -g openclaw@extended-stable`
no actualiza `update.channel`.
Después de sustituir el núcleo, los plugins oficiales de npm aptos con una intención
vacía/predeterminada o `latest` convergen en esa versión exacta del núcleo. Las versiones fijadas exactas y las
etiquetas explícitas distintas de `latest`, los plugins de terceros y las fuentes que no sean npm permanecen sin cambios.
Las instalaciones del catálogo creadas por las versiones actuales de OpenClaw conservan esa intención
predeterminada. Los registros anteriores que solo contienen una versión exacta permanecen fijados porque
OpenClaw no puede distinguir de forma segura entre una fijación automática anterior y una fijación del usuario; ejecuta
`openclaw plugins update @openclaw/name` una vez en el canal extended-stable
para volver a habilitar el seguimiento de la versión exacta del núcleo para ese plugin.

`--channel dev` proporciona un checkout persistente y móvil de `main` de GitHub. Para una actualización puntual
del paquete, `--tag main` se asigna a la especificación de paquete `github:openclaw/openclaw#main`
y la instala directamente mediante el gestor de paquetes de destino (npm/pnpm/bun).

En el caso de los plugins administrados, la ausencia de una versión beta es una advertencia, no un error: la
actualización del núcleo puede completarse aunque un plugin recurra a su versión
predeterminada/más reciente registrada.

Consulta [Canales de versiones](/es/install/development-channels) para conocer la semántica de los canales.

## Cambiar entre instalaciones de npm y git

Usa los canales para cambiar el tipo de instalación. El actualizador conserva el estado, la configuración,
las credenciales y el espacio de trabajo en `~/.openclaw`; solo cambia qué instalación del código de OpenClaw
utilizan la CLI y el Gateway.

```bash
# instalación del paquete npm -> checkout de git editable
openclaw update --channel dev

# checkout de git -> instalación del paquete npm
openclaw update --channel stable
```

Obtén primero una vista previa del cambio de modo de instalación:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantiza que haya un checkout de git, lo compila e instala la CLI global desde ese
checkout. Los canales `stable`, `extended-stable` y `beta` usan instalaciones de
paquetes. Extended-stable se rechaza en un checkout de git sin modificarlo ni
convertirlo. Si el Gateway ya está instalado, `openclaw update` actualiza
los metadatos del servicio y lo reinicia, salvo que se pase `--no-restart`.

En las instalaciones de paquetes con un servicio Gateway administrado, `openclaw update` utiliza como destino
la raíz del paquete usada por ese servicio. Si el comando `openclaw` del shell procede
de una instalación distinta, el actualizador muestra ambas raíces y la ruta de Node del
servicio administrado, y comprueba esa versión de Node con respecto al requisito
`engines.node` de la versión de destino antes de sustituir el paquete.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo específico de instalación, pasa
`--install-method git --no-onboard` o `--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. Este no llama al actualizador; ejecuta directamente la instalación global del
paquete y puede recuperar una instalación de npm actualizada parcialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fija la recuperación a una versión o etiqueta de distribución específica con `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuales

```bash
npm i -g openclaw@latest
```

Prefiere `openclaw update` para instalaciones supervisadas: puede coordinar la sustitución del paquete
con el servicio Gateway en ejecución. Si actualizas manualmente una instalación supervisada,
detén primero el Gateway administrado. Los gestores de paquetes sustituyen los archivos en el
mismo lugar y, de lo contrario, un Gateway en ejecución podría intentar cargar archivos del núcleo o de plugins
durante la sustitución. Reinicia el Gateway después de que finalice el gestor de paquetes para que utilice
la nueva instalación.

En una instalación global del sistema Linux propiedad de root, si `openclaw update` falla con
`EACCES`, recupérala con el npm del sistema manteniendo el Gateway detenido durante la
sustitución manual. Usa las mismas opciones de perfil y el mismo entorno que utilizas normalmente para
ese Gateway. Sustituye `/usr/bin/npm` por el npm del sistema que sea propietario del
prefijo global propiedad de root en el host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

A continuación, verifica:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Cuando `openclaw update` administra una instalación global de npm, primero instala el destino
en un prefijo temporal de npm, verifica el inventario `dist` empaquetado y, a continuación,
sustituye el árbol de paquetes limpio en el prefijo global real, con lo que evita que npm
superponga un paquete nuevo sobre archivos obsoletos del anterior. Si el comando de
instalación falla, OpenClaw vuelve a intentarlo una vez con `--omit=optional`, lo que ayuda en hosts
donde no se pueden compilar dependencias opcionales nativas.

Los comandos de actualización de npm y de plugins administrados por OpenClaw también eliminan la
cuarentena de la cadena de suministro `min-release-age` de npm (o la clave de configuración anterior `before`)
para el proceso npm secundario. Esa política existe como protección general, pero una
actualización explícita de OpenClaw significa «instalar ahora la versión seleccionada».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Temas avanzados de instalación de npm

<AccordionGroup>
  <Accordion title="Árbol de paquetes de solo lectura">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura durante la ejecución, aunque el directorio global de paquetes permita la escritura al usuario actual. Las instalaciones de paquetes de plugins se encuentran en raíces npm/git propiedad de OpenClaw dentro del directorio de configuración del usuario, y el inicio del Gateway no modifica el árbol de paquetes de OpenClaw.

    Algunas configuraciones de npm en Linux instalan paquetes globales en directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite esta disposición porque los comandos de instalación y actualización de plugins escriben fuera de ese directorio global de paquetes.

  </Accordion>
  <Accordion title="Unidades de systemd reforzadas">
    Concede a OpenClaw acceso de escritura a sus raíces de configuración/estado para que las instalaciones explícitas de plugins, las actualizaciones de plugins y la limpieza de doctor puedan conservar sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Comprobación previa del espacio en disco">
    Antes de las actualizaciones de paquetes y las instalaciones explícitas de plugins, OpenClaw intenta realizar una comprobación razonable del espacio en disco del volumen de destino. Si queda poco espacio, se genera una advertencia con la ruta comprobada, pero no se bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real mediante el gestor de paquetes y la verificación posterior a la instalación siguen siendo la fuente de autoridad.
  </Accordion>
</AccordionGroup>

## Actualizador automático

Está desactivado de forma predeterminada. Actívalo en `~/.openclaw/openclaw.json`:

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

| Canal             | Comportamiento                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Espera `stableDelayHours` (valor predeterminado: 6) y, a continuación, aplica con una variación determinista durante `stableJitterHours` (valor predeterminado: 12) para realizar un despliegue escalonado. |
| `extended-stable` | Busca una indicación de actualización de solo lectura al iniciar y cada 24 horas cuando `checkOnStart` está activado. Nunca la aplica automáticamente.                |
| `beta`            | Comprueba cada `betaCheckIntervalHours` (valor predeterminado: 1) y la aplica inmediatamente.                                                                          |
| `dev`             | No se aplica automáticamente. Usa `openclaw update` manualmente.                                                                                                      |

El Gateway también registra una indicación de actualización al iniciar (se desactiva con
`update.checkOnStart: false`). Las selecciones extended-stable almacenadas usan esta
ruta de indicación de solo lectura y el intervalo de indicaciones existente de 24 horas, pero nunca invocan
la instalación automática, la transferencia, el reinicio, el retraso/variación de stable ni el sondeo de beta.
Para realizar una degradación o recuperarse de un incidente, establece `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Las indicaciones de actualización al iniciar pueden seguir ejecutándose, salvo que también se desactive `update.checkOnStart`.

Las actualizaciones del gestor de paquetes solicitadas mediante el plano de control del Gateway activo
(`update.run`) no sustituyen el árbol de paquetes dentro del proceso del Gateway
en ejecución. En las instalaciones de servicios administrados, el Gateway inicia una transferencia independiente,
sale y permite que la ruta normal de la CLI `openclaw update --yes --json` detenga el
servicio, sustituya el paquete, actualice los metadatos del servicio, reinicie, verifique la
versión y accesibilidad del Gateway y, cuando sea posible, recupere un LaunchAgent de macOS
instalado pero no cargado. Si el Gateway no puede realizar esa transferencia de forma segura,
`update.run` informa de un comando de shell seguro en lugar de ejecutar el gestor de
paquetes dentro del proceso.

La tarjeta de actualización de la barra lateral de la interfaz de control inicia este mismo flujo de `update.run`. En la
aplicación firmada de macOS, la tarjeta actualiza primero la aplicación mediante Sparkle; después de reiniciarla,
la aplicación actualiza su Gateway local administrado a la versión correspondiente.

## Después de actualizar

<Steps>

### Ejecutar doctor

```bash
openclaw doctor
```

Migra la configuración, audita las políticas de mensajes directos y comprueba el estado del Gateway. Detalles: [Doctor](/es/gateway/doctor)

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
`npm view openclaw version` muestra la versión publicada actualmente.
</Tip>

### Fijar un commit (código fuente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a la versión más reciente: `git checkout main && git pull`.

## Si surgen problemas

- Vuelve a ejecutar `openclaw doctor` y lee detenidamente la salida.
- Para `openclaw update --channel dev` en checkouts del código fuente, el actualizador inicializa automáticamente `pnpm` cuando es necesario. Si aparece un error de inicialización de pnpm/corepack, instala `pnpm` manualmente (o vuelve a activar `corepack`) y ejecuta de nuevo la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Contenido relacionado

- [Descripción general de la instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de estado después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración entre versiones principales.
