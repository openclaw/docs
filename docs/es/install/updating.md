---
read_when:
    - Actualización de OpenClaw
    - Algo se rompe después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde código fuente), además de estrategia de reversión
title: Actualizando
x-i18n:
    generated_at: "2026-07-06T10:50:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9b71b9d6897b37edd4fd6bdbe8a09e3c9855fd76495fc1d68c76bdc2b5026d
    source_path: install/updating.md
    workflow: 16
---

Mantén OpenClaw actualizado.

## Recomendado: `openclaw update`

Detecta tu tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el Gateway.

```bash
openclaw update
```

Cambia de canales o apunta a una versión específica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` no tiene una marca `--verbose` (el instalador sí). Para diagnósticos, usa
`--dry-run` para previsualizar las acciones planificadas, `--json` para obtener resultados estructurados, o
`openclaw update status --json` para inspeccionar el canal y el estado de disponibilidad.

`--channel beta` prefiere el dist-tag beta de npm, pero recurre a estable/latest
cuando falta la etiqueta beta o su versión es anterior a la versión estable
más reciente. Usa `--tag beta` para una actualización puntual de paquete fijada al dist-tag
beta sin procesar de npm.

`--channel extended-stable` es solo para paquetes y solo en primer plano. OpenClaw lee
el selector público `extended-stable` de npm, verifica el paquete exacto seleccionado
e instala esa versión exacta. Los datos del registro ausentes o incoherentes fallan
de forma cerrada; nunca recurre a `latest`. Si la versión seleccionada es anterior a
la versión instalada, se sigue aplicando la confirmación normal de degradación.
Después del intercambio del núcleo, los plugins npm oficiales elegibles con intención
bare/default o `latest` convergen a esa versión exacta del núcleo. Los pines exactos y las etiquetas explícitas
distintas de `latest`, los plugins de terceros y las fuentes no npm permanecen sin cambios.
Las instalaciones desde catálogo creadas por versiones actuales de OpenClaw conservan esa intención
predeterminada. Los registros más antiguos que contienen solo una versión exacta permanecen fijados porque
OpenClaw no puede distinguir de forma segura un pin automático antiguo de un pin de usuario; ejecuta
`openclaw plugins update @openclaw/name` una vez en el canal extended-stable
para que ese plugin vuelva a optar por el seguimiento exacto del núcleo.

`--channel dev` proporciona un checkout persistente y móvil de GitHub `main`. Para una actualización
puntual de paquete, `--tag main` se asigna a la especificación de paquete `github:openclaw/openclaw#main`
y la instala directamente mediante el gestor de paquetes de destino (npm/pnpm/bun).

Para plugins gestionados, una versión beta ausente es una advertencia, no un fallo: la
actualización del núcleo aún puede completarse mientras un plugin recurre a su versión registrada
predeterminada/latest.

Consulta [Canales de lanzamiento](/es/install/development-channels) para la semántica de los canales.

## Cambiar entre instalaciones npm y git

Usa canales para cambiar el tipo de instalación. El actualizador conserva tu estado, configuración,
credenciales y espacio de trabajo en `~/.openclaw`; solo cambia qué instalación de código de OpenClaw
usan la CLI y el Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Previsualiza primero el cambio de modo de instalación:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantiza un checkout de git, lo compila e instala la CLI global desde ese
checkout. Los canales `stable`, `extended-stable` y `beta` usan instalaciones de paquete.
Extended-stable se rechaza en un checkout de git sin mutarlo ni
convertirlo. Si el Gateway ya está instalado, `openclaw update` actualiza
los metadatos del servicio y lo reinicia salvo que pases `--no-restart`.

Para instalaciones de paquete con un servicio Gateway gestionado, `openclaw update` apunta
a la raíz del paquete usada por ese servicio. Si el comando de shell `openclaw` proviene
de una instalación diferente, el actualizador imprime ambas raíces y la ruta de Node
del servicio gestionado, y comprueba esa versión de Node frente al requisito
`engines.node` de la versión de destino antes de reemplazar el paquete.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para forzar un tipo de instalación específico, pasa
`--install-method git --no-onboard` o `--install-method npm --no-onboard`.

Si `openclaw update` falla después de la fase de instalación del paquete npm, vuelve a ejecutar el
instalador en su lugar. No llama al actualizador; ejecuta directamente la instalación
del paquete global y puede recuperar una instalación npm parcialmente actualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fija la recuperación a una versión o dist-tag específico con `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manual

```bash
npm i -g openclaw@latest
```

Prefiere `openclaw update` para instalaciones supervisadas: puede coordinar el intercambio
del paquete con el servicio Gateway en ejecución. Si actualizas manualmente en una instalación
supervisada, detén primero el Gateway gestionado. Los gestores de paquetes reemplazan archivos in
situ, y un Gateway en ejecución podría intentar cargar archivos del núcleo o de plugins
a mitad del intercambio. Reinicia el Gateway después de que el gestor de paquetes termine para que recoja
la nueva instalación.

Para una instalación global de sistema Linux propiedad de root, si `openclaw update` falla con
`EACCES`, recupérala con el npm del sistema manteniendo el Gateway detenido durante el
reemplazo manual. Usa las mismas marcas/entorno de perfil que usas normalmente para
ese Gateway. Sustituye `/usr/bin/npm` por el npm del sistema que posee el
prefijo global propiedad de root en tu host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Luego verifica:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Cuando `openclaw update` gestiona una instalación npm global, instala primero el destino
en un prefijo npm temporal, verifica el inventario `dist` empaquetado y luego
intercambia el árbol de paquete limpio en el prefijo global real, evitando que npm
superponga un paquete nuevo sobre archivos obsoletos del anterior. Si el comando de instalación
falla, OpenClaw reintenta una vez con `--omit=optional`, lo que ayuda en hosts
donde las dependencias opcionales nativas no pueden compilarse.

Los comandos de actualización npm y de actualización de plugins gestionados por OpenClaw también eliminan la cuarentena
de cadena de suministro `min-release-age` de npm (o la clave de configuración anterior `before`)
para el proceso npm hijo. Esa política existe para protección general, pero una
actualización explícita de OpenClaw significa "instala ahora la versión seleccionada".

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Temas avanzados de instalación npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en tiempo de ejecución, incluso cuando el directorio global del paquete puede ser escrito por el usuario actual. Las instalaciones de paquetes de plugins viven en raíces npm/git propiedad de OpenClaw bajo el directorio de configuración del usuario, y el inicio del Gateway no muta el árbol de paquetes de OpenClaw.

    Algunas configuraciones npm de Linux instalan paquetes globales bajo directorios propiedad de root, como `/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño porque los comandos de instalación/actualización de plugins escriben fuera de ese directorio global de paquetes.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Da a OpenClaw acceso de escritura a sus raíces de configuración/estado para que las instalaciones explícitas de plugins, las actualizaciones de plugins y la limpieza de doctor puedan persistir sus cambios:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Antes de las actualizaciones de paquetes y las instalaciones explícitas de plugins, OpenClaw intenta una comprobación de espacio en disco de mejor esfuerzo para el volumen de destino. Poco espacio produce una advertencia con la ruta comprobada, pero no bloquea la actualización porque las cuotas del sistema de archivos, las instantáneas y los volúmenes de red pueden cambiar después de la comprobación. La instalación real del gestor de paquetes y la verificación posterior a la instalación siguen siendo autoritativas.
  </Accordion>
</AccordionGroup>

## Actualizador automático

Desactivado de forma predeterminada. Actívalo en `~/.openclaw/openclaw.json`:

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

| Canal             | Comportamiento                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Espera `stableDelayHours` (predeterminado: 6), luego aplica con jitter determinista a lo largo de `stableJitterHours` (predeterminado: 12) para un despliegue distribuido. |
| `extended-stable` | Sin comprobación de inicio ni aplicación automática. Usa `openclaw update` o `openclaw update status` manualmente.                          |
| `beta`            | Comprueba cada `betaCheckIntervalHours` (predeterminado: 1) y aplica inmediatamente.                                                         |
| `dev`             | Sin aplicación automática. Usa `openclaw update` manualmente.                                                                                |

El Gateway también registra una sugerencia de actualización al iniciar (desactívala con `update.checkOnStart: false`).
Las selecciones extended-stable almacenadas omiten por completo la resolución de inicio y en segundo plano.
Para degradación o recuperación de incidentes, define `OPENCLAW_NO_AUTO_UPDATE=1` en el entorno del Gateway para bloquear las aplicaciones automáticas incluso cuando `update.auto.enabled` esté configurado. Las sugerencias de actualización al inicio aún pueden ejecutarse salvo que `update.checkOnStart` también esté desactivado.

Las actualizaciones del gestor de paquetes solicitadas mediante el plano de control del Gateway en vivo
(`update.run`) no reemplazan el árbol de paquetes dentro del proceso del Gateway en ejecución.
En instalaciones de servicio gestionado, el Gateway inicia una transferencia desacoplada,
sale y deja que la ruta normal de CLI `openclaw update --yes --json` detenga el
servicio, reemplace el paquete, actualice los metadatos del servicio, reinicie, verifique la
versión y alcanzabilidad del Gateway, y recupere cuando sea posible un LaunchAgent de macOS
instalado pero no cargado. Si el Gateway no puede hacer esa transferencia de forma segura,
`update.run` informa de un comando de shell seguro en lugar de ejecutar el gestor de paquetes
dentro del proceso.

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

Para volver a la más reciente: `git checkout main && git pull`.

## Si te quedas bloqueado

- Ejecuta `openclaw doctor` de nuevo y lee la salida con atención.
- Para `openclaw update --channel dev` en checkouts de código fuente, el actualizador arranca automáticamente `pnpm` cuando es necesario. Si ves un error de arranque de pnpm/corepack, instala `pnpm` manualmente (o vuelve a activar `corepack`) y vuelve a ejecutar la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobaciones de salud después de las actualizaciones.
- [Migración](/es/install/migrating): guías de migración de versiones mayores.
