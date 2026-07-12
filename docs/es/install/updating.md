---
read_when:
    - Actualización de OpenClaw
    - Algo deja de funcionar después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de una estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-07-11T23:13:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Mantén OpenClaw actualizado.

Para reemplazar imágenes de Docker, Podman y Kubernetes, consulta
[Actualizar imágenes de contenedores](/es/install/docker#upgrading-container-images). El
Gateway ejecuta tareas de actualización seguras durante el inicio antes de estar listo y se cierra si
el estado montado requiere una reparación manual.

## Recomendado: `openclaw update`

Detecta el tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el Gateway.

```bash
openclaw update
```

Cambia de canal o selecciona una versión específica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # vista previa sin aplicar cambios
```

`openclaw update` no tiene la opción `--verbose` (el instalador sí). Para realizar diagnósticos, usa
`--dry-run` para obtener una vista previa de las acciones planificadas, `--json` para obtener resultados estructurados o
`openclaw update status --json` para inspeccionar el canal y el estado de disponibilidad.

`--channel beta` da preferencia a la etiqueta de distribución beta de npm, pero recurre a stable/latest
cuando falta la etiqueta beta o su versión es anterior a la versión estable
más reciente. En su lugar, usa `--tag beta` para realizar una actualización puntual del paquete fijada a la
etiqueta de distribución beta sin procesar de npm.

`--channel extended-stable` solo admite paquetes y la instalación sigue realizándose
únicamente en primer plano. OpenClaw lee el selector público `extended-stable` de npm,
verifica el paquete exacto seleccionado e instala esa versión exacta. Si faltan datos
del registro o son incoherentes, la operación falla de forma segura; nunca recurre a `latest`.
Si la versión seleccionada es anterior a la instalada, se sigue aplicando la confirmación
normal de cambio a una versión anterior. La CLI conserva el canal después de una
actualización correcta del núcleo; ejecutar directamente `npm install -g openclaw@extended-stable`
no actualiza `update.channel`.
Después de sustituir el núcleo, los plugins oficiales de npm que cumplan los requisitos y tengan una intención
vacía/predeterminada o `latest` convergen a esa versión exacta del núcleo. Las versiones fijadas de forma exacta y las etiquetas explícitas
distintas de `latest`, los plugins de terceros y las fuentes que no sean npm permanecen sin cambios.
Las instalaciones desde el catálogo creadas por versiones actuales de OpenClaw conservan esa intención
predeterminada. Los registros antiguos que solo contienen una versión exacta permanecen fijados porque
OpenClaw no puede distinguir de forma segura una fijación automática antigua de una fijación del usuario; ejecuta
`openclaw plugins update @openclaw/name` una vez en el canal extended-stable
para que ese plugin vuelva a seguir exactamente la versión del núcleo.

`--channel dev` proporciona un checkout persistente y cambiante de `main` en GitHub. Para una actualización
puntual del paquete, `--tag main` se asigna a la especificación de paquete `github:openclaw/openclaw#main`
y la instala directamente mediante el gestor de paquetes de destino (npm/pnpm/bun).

Para los plugins administrados, que falte una versión beta genera una advertencia, no un error: la
actualización del núcleo puede completarse mientras un plugin recurre a su versión
predeterminada/latest registrada.

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

Primero, obtén una vista previa del cambio de modo de instalación:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantiza que exista un checkout de git, lo compila e instala la CLI global desde ese
checkout. Los canales `stable`, `extended-stable` y `beta` usan instalaciones de
paquetes. El canal extended-stable se rechaza en un checkout de git sin modificarlo ni
convertirlo. Si el Gateway ya está instalado, `openclaw update` actualiza
los metadatos del servicio y lo reinicia, salvo que pases `--no-restart`.

En instalaciones de paquetes con un servicio Gateway administrado, `openclaw update` actúa sobre
la raíz del paquete que utiliza ese servicio. Si el comando `openclaw` del shell procede
de otra instalación, el actualizador muestra ambas raíces y la ruta de Node del servicio
administrado, y comprueba esa versión de Node con el requisito
`engines.node` de la versión de destino antes de sustituir el paquete.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico, pasa
`--install-method git --no-onboard` o `--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador. Este no llama al actualizador; ejecuta directamente la instalación global del paquete
y puede recuperar una instalación de npm actualizada parcialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fija la recuperación a una versión o etiqueta de distribución específica con `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manualmente

```bash
npm i -g openclaw@latest
```

Prefiere `openclaw update` para las instalaciones supervisadas: puede coordinar la sustitución del paquete
con el servicio Gateway en ejecución. Si actualizas manualmente una instalación supervisada,
detén primero el Gateway administrado. Los gestores de paquetes sustituyen los archivos
en el mismo lugar y, de lo contrario, un Gateway en ejecución podría intentar cargar archivos del núcleo o de plugins
durante la sustitución. Reinicia el Gateway cuando finalice el gestor de paquetes para que use
la nueva instalación.

En una instalación global del sistema Linux cuyo propietario sea root, si `openclaw update` falla con
`EACCES`, recupérala con el npm del sistema y mantén detenido el Gateway durante la
sustitución manual. Usa las mismas opciones de perfil y variables de entorno que utilizas normalmente para
ese Gateway. Sustituye `/usr/bin/npm` por el npm del sistema que sea propietario del
prefijo global de root en tu host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Después, verifica:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Cuando `openclaw update` administra una instalación global de npm, primero instala el destino
en un prefijo temporal de npm, verifica el inventario `dist` del paquete y después
intercambia el árbol limpio del paquete con el prefijo global real, evitando que npm
superponga un paquete nuevo sobre archivos obsoletos del anterior. Si el comando de
instalación falla, OpenClaw vuelve a intentarlo una vez con `--omit=optional`, lo que ayuda en los hosts
donde las dependencias nativas opcionales no pueden compilarse.

Los comandos de actualización de npm y de plugins administrados por OpenClaw también desactivan la
cuarentena de la cadena de suministro `min-release-age` de npm (o la clave de configuración anterior `before`)
para el proceso npm secundario. Esa política existe como protección general, pero una
actualización explícita de OpenClaw significa «instalar ahora la versión seleccionada».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Temas avanzados de instalación con npm

<AccordionGroup>
  <Accordion title="Árbol de paquetes de solo lectura">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura durante la ejecución, incluso cuando el usuario actual puede escribir en el directorio global de paquetes. Las instalaciones de paquetes de plugins se encuentran en raíces de npm/git propiedad de OpenClaw dentro del directorio de configuración del usuario, y el inicio del Gateway no modifica el árbol de paquetes de OpenClaw.

    Algunas configuraciones de npm en Linux instalan los paquetes globales en directorios cuyo propietario es root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite esa disposición porque los comandos de instalación y actualización de plugins escriben fuera de ese directorio global de paquetes.

  </Accordion>
  <Accordion title="Unidades systemd reforzadas">
    Concede a OpenClaw acceso de escritura a las raíces de configuración y estado para que las instalaciones explícitas de plugins, las actualizaciones de plugins y la limpieza de doctor puedan conservar sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Comprobación previa del espacio en disco">
    Antes de las actualizaciones de paquetes y las instalaciones explícitas de plugins, OpenClaw intenta comprobar, en la medida de lo posible, el espacio en disco del volumen de destino. Si queda poco espacio, se muestra una advertencia con la ruta comprobada, pero no se bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real mediante el gestor de paquetes y la verificación posterior a la instalación siguen siendo la autoridad definitiva.
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

| Canal             | Comportamiento                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Espera `stableDelayHours` (valor predeterminado: 6) y después aplica la actualización con una variación determinista dentro de `stableJitterHours` (valor predeterminado: 12) para distribuir el despliegue. |
| `extended-stable` | Busca una indicación de actualización de solo lectura al iniciar y cada 24 horas cuando `checkOnStart` está activado. Nunca la aplica automáticamente.                |
| `beta`            | Comprueba cada `betaCheckIntervalHours` (valor predeterminado: 1) y aplica la actualización inmediatamente.                                                          |
| `dev`             | No se aplica automáticamente. Usa `openclaw update` manualmente.                                                                                                     |

El Gateway también registra una indicación de actualización al iniciar (desactívala con
`update.checkOnStart: false`). Las selecciones de extended-stable almacenadas usan esta
ruta de indicaciones de solo lectura y el intervalo existente de 24 horas, pero nunca invocan
la instalación automática, el traspaso, el reinicio, el retraso o la variación de stable ni el sondeo de beta.
Para cambiar a una versión anterior o recuperarse de un incidente, establece `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas, incluso cuando `update.auto.enabled` esté configurado. Las indicaciones de actualización al iniciar pueden seguir ejecutándose, salvo que también se desactive `update.checkOnStart`.

Las actualizaciones del gestor de paquetes solicitadas mediante el plano de control del Gateway activo
(`update.run`) no sustituyen el árbol de paquetes dentro del proceso del Gateway
en ejecución. En instalaciones con servicios administrados, el Gateway inicia un traspaso independiente,
se cierra y permite que la ruta normal de la CLI `openclaw update --yes --json` detenga el
servicio, sustituya el paquete, actualice los metadatos del servicio, lo reinicie, verifique la
versión y la accesibilidad del Gateway y, cuando sea posible, recupere un LaunchAgent de macOS
instalado pero no cargado. Si el Gateway no puede realizar ese traspaso de forma segura,
`update.run` muestra un comando de shell seguro en lugar de ejecutar el gestor de
paquetes dentro del proceso.

La tarjeta de actualización de la barra lateral de la interfaz de control inicia este mismo flujo de `update.run`. En la
aplicación firmada de macOS, la tarjeta actualiza primero la aplicación mediante Sparkle; después de reiniciarla,
la aplicación actualiza su Gateway local administrado a la versión correspondiente.

## Después de actualizar

<Steps>

### Ejecuta doctor

```bash
openclaw doctor
```

Migra la configuración, audita las políticas de mensajes directos y comprueba el estado del Gateway. Detalles: [Doctor](/es/gateway/doctor)

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

## Si tienes problemas

- Ejecuta `openclaw doctor` de nuevo y lee detenidamente la salida.
- Para `openclaw update --channel dev` en checkouts del código fuente, el actualizador inicializa automáticamente `pnpm` cuando es necesario. Si aparece un error de inicialización de pnpm/corepack, instala `pnpm` manualmente (o vuelve a activar `corepack`) y ejecuta de nuevo la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Contenido relacionado

- [Descripción general de la instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de estado después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración entre versiones principales.
