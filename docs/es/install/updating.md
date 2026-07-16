---
read_when:
    - Actualización de OpenClaw
    - Algo deja de funcionar después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de una estrategia de reversión
title: Actualizando
x-i18n:
    generated_at: "2026-07-16T11:43:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Mantén OpenClaw actualizado.

Para reemplazar imágenes de Docker, Podman y Kubernetes, consulta
[Actualización de imágenes de contenedor](/es/install/docker#upgrading-container-images). El
Gateway ejecuta tareas de actualización seguras para el inicio antes de estar listo y se cierra si el
estado montado requiere reparación manual.

## Recomendado: `openclaw update`

Detecta el tipo de instalación (npm, pnpm, Bun o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el Gateway.

```bash
openclaw update
```

Cambia de canal o selecciona una versión específica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # vista previa sin aplicar
```

`openclaw update` no tiene la opción `--verbose` (el instalador sí). Para realizar diagnósticos, usa
`--dry-run` para obtener una vista previa de las acciones previstas, `--json` para obtener resultados estructurados o
`openclaw update status --json` para inspeccionar el canal y el estado de disponibilidad.

`--channel beta` prefiere la etiqueta de distribución beta de npm, pero recurre a stable/latest
cuando falta la etiqueta beta o su versión es anterior a la versión estable más
reciente. En su lugar, usa `--tag beta` para realizar una actualización puntual del paquete fijada a la
etiqueta de distribución beta sin procesar de npm.

`--channel extended-stable` solo afecta al paquete y la instalación sigue
ejecutándose únicamente en primer plano. OpenClaw lee el selector público `extended-stable` de npm,
verifica el paquete exacto seleccionado e instala esa versión exacta. Si los
datos del registro faltan o son incoherentes, se produce un fallo seguro; nunca se recurre a `latest`.
Si la versión seleccionada es anterior a la instalada, se sigue aplicando la
confirmación normal de reversión a una versión anterior. La CLI conserva el canal después de una
actualización correcta del núcleo; ejecutar directamente `npm install -g openclaw@extended-stable`
no actualiza `update.channel`.
Después de sustituir el núcleo, los plugins npm oficiales aptos con intención
predeterminada/sin especificar o `latest` convergen en esa versión exacta del núcleo. Las versiones fijadas exactas y las etiquetas explícitas
distintas de `latest`, los plugins de terceros y las fuentes que no sean npm permanecen sin cambios.
Las instalaciones desde el catálogo creadas por las versiones actuales de OpenClaw conservan esa intención
predeterminada. Los registros antiguos que solo contienen una versión exacta permanecen fijados porque
OpenClaw no puede distinguir de forma segura una versión fijada automáticamente en el pasado de una fijada por el usuario; ejecuta
`openclaw plugins update @openclaw/name` una vez en el canal extended-stable
para que ese plugin vuelva a seguir la versión exacta del núcleo.

`--channel dev` proporciona un checkout móvil y persistente de `main` en GitHub. Para realizar una
actualización puntual de un paquete, `--tag main` se asigna a la especificación de paquete `github:openclaw/openclaw#main`
y la instala directamente mediante el gestor de paquetes de destino (npm/pnpm/bun).

En los plugins gestionados, la ausencia de una versión beta genera una advertencia, no un fallo: la
actualización del núcleo puede completarse aunque un plugin recurra a su versión
predeterminada/más reciente registrada.

Consulta [Canales de publicación](/es/install/development-channels) para conocer la semántica de los canales.

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

Obtén primero una vista previa del cambio del modo de instalación:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantiza que exista un checkout de git, lo compila e instala la CLI global desde ese
checkout. Los canales `stable`, `extended-stable` y `beta` utilizan instalaciones de
paquetes. Extended-stable se rechaza en un checkout de git sin modificarlo ni
convertirlo. Si el Gateway ya está instalado, `openclaw update` actualiza
los metadatos del servicio y lo reinicia, salvo que se pase `--no-restart`.

En las instalaciones de paquetes con un servicio Gateway gestionado, `openclaw update` apunta
a la raíz del paquete que utiliza ese servicio. Si el comando `openclaw` del shell procede
de una instalación distinta, el actualizador muestra ambas raíces y la ruta de Node del
servicio gestionado, y comprueba esa versión de Node con respecto al requisito
`engines.node` de la versión de destino antes de reemplazar el paquete.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico, pasa
`--install-method git --no-onboard` o `--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. Este no llama al actualizador; ejecuta directamente la instalación global del
paquete y puede recuperar una instalación de npm parcialmente actualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fija la recuperación a una versión o etiqueta de distribución específica mediante `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manualmente

```bash
npm i -g openclaw@latest
```

Para instalaciones supervisadas, es preferible usar `openclaw update`: puede coordinar la sustitución del paquete
con el servicio Gateway en ejecución. Si se actualiza manualmente una instalación supervisada,
detén primero el Gateway gestionado. Los gestores de paquetes reemplazan los archivos
en el mismo lugar y, de lo contrario, un Gateway en ejecución podría intentar cargar archivos del núcleo o de plugins
durante la sustitución. Reinicia el Gateway cuando termine el gestor de paquetes para que utilice
la nueva instalación.

En una instalación global del sistema Linux propiedad de root, si `openclaw update` falla con
`EACCES`, recupérala con el npm del sistema manteniendo el Gateway detenido durante la
sustitución manual. Usa las mismas opciones de perfil y el mismo entorno que se utilizan normalmente para
ese Gateway. Reemplaza `/usr/bin/npm` por el npm del sistema propietario del
prefijo global de root en el host:

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

Cuando `openclaw update` gestiona una instalación global de npm, instala primero el destino
en un prefijo temporal de npm. El paquete candidato valida la versión de Node
del host durante `preinstall`; solo entonces OpenClaw verifica el inventario
`dist` empaquetado y sustituye el árbol limpio del paquete en el prefijo global real. Se
omite una protección de finalización empaquetada del inventario esperado y solo se elimina
después de que `preinstall` se complete correctamente, por lo que la omisión de scripts de ciclo de vida también provoca un fallo antes de la
sustitución. En npm 12 y versiones posteriores, el actualizador solo aprueba el ciclo de vida del OpenClaw
candidato; los scripts de las dependencias transitivas permanecen bloqueados. Esto evita que npm
superponga un paquete nuevo sobre archivos obsoletos del anterior. Si el comando de
instalación falla, OpenClaw lo reintenta una vez con `--omit=optional`, lo que ayuda en hosts
donde no pueden compilarse dependencias nativas opcionales.

Los comandos de actualización de npm y de plugins gestionados por OpenClaw también eliminan la
cuarentena de la cadena de suministro `min-release-age` de npm (o la clave de configuración anterior `before`)
para el proceso npm secundario. Esa política existe como protección general, pero una
actualización explícita de OpenClaw significa «instalar ahora la versión seleccionada».

```bash
pnpm add -g openclaw@latest
```

Si pnpm 11 instaló OpenClaw 2026.7.1, ejecuta ese comando manual una vez. Esa
versión es anterior al diseño aislado de paquetes globales de pnpm 11, por lo que su actualizador puede
confundir otra instalación de npm con la CLI en ejecución. Las versiones posteriores conservan
la propiedad de pnpm y siguen la raíz del paquete de reemplazo durante las actualizaciones. También
utilizan el directorio binario global indicado por el gestor propietario y se detienen antes de
realizar cambios cuando el comando pnpm disponible indica otra raíz global o versión principal,
o cuando el paquete invocador está huérfano o no es la única instalación activa de OpenClaw
en esa ubicación.

Si OpenClaw comparte un grupo de instalación global de pnpm 11 con otro paquete, el
actualizador automático se detiene antes de modificar el grupo. Actualiza manualmente el grupo original
separado por comas para mantener intactos sus paquetes relacionados y su política de
compilación.

```bash
bun add -g openclaw@latest
```

### Temas avanzados sobre la instalación con npm

<AccordionGroup>
  <Accordion title="Árbol de paquetes de solo lectura">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura durante la ejecución, incluso cuando el usuario actual puede escribir en el directorio global de paquetes. Las instalaciones de paquetes de plugins se almacenan en raíces npm/git propiedad de OpenClaw dentro del directorio de configuración del usuario, y el inicio del Gateway no modifica el árbol de paquetes de OpenClaw.

    Algunas configuraciones de npm en Linux instalan los paquetes globales en directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite este diseño porque los comandos de instalación y actualización de plugins escriben fuera de ese directorio global de paquetes.

  </Accordion>
  <Accordion title="Unidades de systemd reforzadas">
    Concede a OpenClaw acceso de escritura a sus raíces de configuración y estado para que las instalaciones explícitas de plugins, las actualizaciones de plugins y la limpieza del doctor puedan conservar sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Comprobación previa del espacio en disco">
    Antes de las actualizaciones de paquetes y las instalaciones explícitas de plugins, OpenClaw intenta realizar una comprobación de mejor esfuerzo del espacio en disco del volumen de destino. Si queda poco espacio, se genera una advertencia con la ruta comprobada, pero no se bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real mediante el gestor de paquetes y la verificación posterior a la instalación siguen siendo la fuente autoritativa.
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

| Canal             | Comportamiento                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Espera `stableDelayHours` (valor predeterminado: 6) y después aplica la actualización con una variación determinista durante `stableJitterHours` (valor predeterminado: 12) para desplegarla de forma escalonada. |
| `extended-stable` | Comprueba si hay un aviso de actualización de solo lectura al iniciar y cada 24 horas cuando `checkOnStart` está activado. Nunca la aplica automáticamente. |
| `beta`            | Comprueba cada `betaCheckIntervalHours` (valor predeterminado: 1) y la aplica inmediatamente.                                                        |
| `dev`             | No se aplica automáticamente. Usa `openclaw update` manualmente.                                                                              |

El Gateway también registra un aviso de actualización al iniciarse (se desactiva con
`update.checkOnStart: false`). Las selecciones extended-stable almacenadas utilizan esta
ruta de avisos de solo lectura y el intervalo existente de 24 horas, pero nunca invocan
la instalación automática, el traspaso, el reinicio, el retraso o la variación de stable ni el sondeo de beta.
Para revertir a una versión anterior o recuperarse de un incidente, establece `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Los avisos de actualización al inicio pueden seguir ejecutándose salvo que `update.checkOnStart` también esté desactivado.

Las actualizaciones del gestor de paquetes solicitadas mediante el plano de control del Gateway activo
(`update.run`) no reemplazan el árbol de paquetes dentro del proceso del Gateway
en ejecución. En instalaciones con servicios gestionados, el Gateway inicia un traspaso independiente,
se cierra y permite que la ruta normal de la CLI `openclaw update --yes --json` detenga el
servicio, reemplace el paquete, actualice los metadatos del servicio, reinicie, verifique la
versión y la accesibilidad del Gateway, y recupere cuando sea posible un LaunchAgent de macOS
instalado pero no cargado. Si el Gateway no puede realizar ese traspaso de forma segura,
`update.run` muestra un comando de shell seguro en lugar de ejecutar el gestor de
paquetes dentro del proceso.

La tarjeta de actualización de la barra lateral de la interfaz de control muestra **Actualizar Gateway** cuando iniciará
directamente este flujo `update.run`. Esto abarca la interfaz de control alojada en el navegador, los
Gateways remotos y los Gateways locales administrados manualmente.

En la aplicación firmada para macOS, un Gateway local administrado por la aplicación cambia esa tarjeta a
**Actualizar la aplicación para Mac + Gateway**. Sparkle actualiza primero la aplicación; tras reiniciarse, la
aplicación ejecuta `openclaw update --tag <app-version> --json`, reinicia su Gateway
y verifica su estado en una ventana de progreso similar a la de configuración. La ventana aparece solo
cuando ese Gateway administrado necesita una actualización, reparación o instalación; las actualizaciones exclusivas de la aplicación la reinician
directamente. Los detalles de los errores permanecen visibles con las acciones Reintentar, [Guía de actualización](/es/install/updating) y
[Discord](https://discord.gg/clawd). La aplicación nunca utiliza esta ruta coordinada
para un Gateway remoto o administrado externamente, nunca instala una versión anterior de un
Gateway más reciente y nunca anula la fijación de un canal `extended-stable`.

Cuando la actualización se realiza correctamente, la aplicación pone en cola un evento de bienvenida único para la
sesión directa de nivel superior más reciente que tenga una interacción real con un usuario o canal. Las ejecuciones de Cron,
los Heartbeats y las actualizaciones de sesiones exclusivamente en segundo plano no cambian esa selección. En
modo remoto, la aplicación actualiza únicamente el entorno de ejecución de su Node local de Mac y envía el evento
solo cuando el Gateway remoto conectado es al menos tan reciente como la aplicación.

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

La reversión tiene dos niveles:

1. Reinstalar código anterior de OpenClaw conservando el estado actual.
2. Restaurar el estado anterior a la actualización solo cuando el código anterior no pueda usar una
   configuración o base de datos migrada.

Comience con una reversión únicamente del código. Restaurar el estado descarta los cambios realizados después
de la copia de seguridad.

### Antes de actualizar: crear una copia de seguridad verificada

`openclaw update` conserva una copia automática de la configuración anterior a la actualización, pero no
crea un punto de recuperación completo del estado. Antes de una actualización importante, cree uno
explícitamente:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

El manifiesto del archivo registra la versión de OpenClaw y las rutas de origen incluidas
en la copia de seguridad. El archivo puede contener credenciales, perfiles de autenticación y estado de
canales, por lo que debe almacenarse con permisos exclusivos para el propietario y la misma protección que el
directorio de estado activo. Consulte [Copia de seguridad](/es/cli/backup) para conocer los archivos incluidos y los omitidos
deliberadamente.

Para obtener un punto de recuperación idéntico byte por byte que incluya los artefactos volátiles omitidos en
el archivo portátil, detenga el Gateway y utilice una instantánea del sistema de archivos, volumen o máquina virtual
proporcionada por la plataforma.

### Revertir la instalación de un paquete

Enumere las versiones publicadas y, a continuación, previsualice e instale la versión que se sabe que funciona correctamente:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

Se prefiere `openclaw update --tag` en lugar de una instalación directa mediante el gestor de paquetes. Esta opción
detecta la instalación de una versión anterior, solicita confirmación, ejecuta la convergencia de plugins administrados
y las comprobaciones de compatibilidad con el destino instalado, actualiza los metadatos del servicio,
reinicia el Gateway y verifica la versión en ejecución. Si el canal almacenado es `extended-stable`, utilice
`--channel stable --tag <known-good-version>`, ya que las etiquetas exactas de uso único no pueden
combinarse con el selector `extended-stable`.

Las actualizaciones de paquetes preparan y verifican la versión candidata antes de activarla. Si falla el
intercambio del sistema de archivos o la sustitución del enlace de comandos, OpenClaw restaura automáticamente el
paquete anterior. Tras un intercambio correcto, si posteriormente falla la comprobación de estado del Gateway,
se informa de la versión anterior y se proporcionan instrucciones para la reversión manual, en lugar de
volver a sustituir automáticamente el paquete.

Si la ruta de actualización de la CLI no está disponible, utilice el mismo gestor de paquetes y el mismo
ámbito de instalación a los que pertenece el Gateway actual:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Sustituya `npm` por `pnpm` o `bun` cuando ese gestor sea el propietario de la instalación. Durante
la recuperación de un incidente, evite que un actualizador automático habilitado aplique inmediatamente una
versión más reciente configurando `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway.

### Revertir un repositorio de código fuente

Utilice un repositorio limpio y seleccione una etiqueta o confirmación que se sepa que funciona correctamente:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a la versión más reciente: `git checkout main && git pull`.

El actualizador devuelve automáticamente un repositorio de Git a su rama y
SHA anteriores cuando la instalación de dependencias, la compilación, la compilación de la interfaz de usuario o doctor fallan después de iniciarse una
actualización de Git. La selección manual sigue siendo necesaria cuando se elige intencionadamente
una confirmación anterior.

### Instalar una versión anterior al migrar las sesiones a SQLite

Antes de iniciar una versión anterior de OpenClaw basada en archivos, utilice la CLI actual para
restaurar los artefactos archivados de transcripciones heredadas:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Esto no elimina los datos de SQLite. Las sesiones creadas después de la migración a SQLite
solo existen en SQLite y no aparecerán en el entorno de ejecución anterior. Consulte
[Instalación de una versión anterior tras la migración de sesiones a SQLite](/es/cli/doctor#downgrading-after-session-sqlite-migration).

### Restaurar el estado solo cuando sea necesario

Si el código anterior no puede leer una configuración o un esquema de base de datos más recientes, detenga el
Gateway y restaure la instantánea verificada del sistema de archivos, volumen o máquina virtual anterior a la actualización.
Conserve por separado el estado actual antes de restaurar, ya que esta operación elimina
los cambios realizados después de la instantánea.

Los archivos generales `openclaw backup create` permiten su creación y verificación, pero
no su activación completa in situ. Extraiga un archivo general en un directorio
de preparación y utilice su asignación `manifest.json` de origen a archivo para realizar una restauración
sin conexión. De igual modo, `openclaw backup sqlite restore` escribe una base de datos verificada
en un destino nuevo; la activación de ese destino sigue siendo un paso explícito y sin conexión
a cargo del operador.

### Verificar la reversión

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Si surgen problemas

- Ejecute `openclaw doctor` de nuevo y lea atentamente la salida.
- Para `openclaw update --channel dev` en repositorios de código fuente, el actualizador inicia automáticamente `pnpm` cuando es necesario. Si aparece un error de inicio de pnpm/corepack, instale `pnpm` manualmente (o vuelva a habilitar `corepack`) y ejecute de nuevo la actualización.
- Consulte: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunte en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Descripción general de la instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de estado después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración entre versiones principales.
