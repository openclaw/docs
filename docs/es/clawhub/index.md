---
read_when:
    - Explicación de qué es ClawHub
    - Buscar, instalar o actualizar Skills o plugins
    - Publicación de Skills o plugins en el registro
    - Elegir entre los flujos de CLI de openclaw y clawhub
sidebarTitle: ClawHub
summary: Descripción general pública de ClawHub para descubrimiento, instalación, publicación, seguridad y la CLI de clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T04:09:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub es el registro público de Skills y plugins de OpenClaw.

- Usa comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, y para instalar plugins desde ClawHub.
- Usa la CLI separada `clawhub` para flujos de autenticación del registro, publicación, eliminación/restauración y sincronización.

Sitio: [clawhub.ai](https://clawhub.ai)

## Inicio rápido

Busca e instala Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Busca e instala plugins con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instala la CLI de ClawHub cuando quieras flujos autenticados con el registro, como
publicar, sincronizar o eliminar/restaurar:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Qué aloja ClawHub

| Superficie     | Qué almacena                                                 | Comando típico                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Paquetes de texto versionados con `SKILL.md` y archivos de apoyo | `openclaw skills install <slug>`             |
| Plugins de código | Paquetes de plugins de OpenClaw con metadatos de compatibilidad | `openclaw plugins install clawhub:<package>` |
| Plugins empaquetados | Paquetes de plugins empaquetados para la distribución de OpenClaw | `clawhub package publish <source>`           |
| Souls          | Paquetes `SOUL.md` mostrados en onlycrabs.ai                 | Flujos de publicación web y API             |

ClawHub registra versiones semver, etiquetas como `latest`, registros de cambios, archivos,
descargas, estrellas y resúmenes de escaneo de seguridad. Las páginas públicas muestran el estado actual del registro
para que los usuarios puedan inspeccionar una Skill o un plugin antes de instalarlo.

## Flujos nativos de OpenClaw

Los comandos nativos de OpenClaw instalan en el espacio de trabajo activo de OpenClaw y conservan
metadatos de origen para que los comandos de actualización posteriores puedan permanecer en ClawHub.

Usa `clawhub:<package>` cuando la instalación de un plugin deba resolverse mediante ClawHub.
Las especificaciones de plugins compatibles con npm sin prefijo pueden resolverse mediante npm durante las transiciones de lanzamiento, y
`npm:<package>` permanece limitado a npm cuando una fuente debe ser explícita.

Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y `minGatewayVersion`
antes de ejecutar la instalación del archivo. Cuando una versión de paquete publica un artefacto
ClawPack, OpenClaw prefiere el `.tgz` exacto de npm-pack subido, verifica
el encabezado de resumen de ClawHub y los bytes descargados, y registra metadatos del artefacto para
actualizaciones posteriores.

## CLI de ClawHub

La CLI de ClawHub es para trabajo autenticado con el registro:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

La CLI también tiene comandos de instalación/actualización de Skills para flujos directos del registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Esos comandos instalan Skills en `./skills` bajo el directorio de trabajo actual
y registran las versiones instaladas en `.clawhub/lock.json`.

## Publicación

Publica Skills desde una carpeta local que contenga `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opciones comunes de publicación:

- `--slug <slug>`: slug de la Skill.
- `--name <name>`: nombre para mostrar.
- `--version <version>`: versión semver.
- `--changelog <text>`: texto del registro de cambios.
- `--tags <tags>`: etiquetas separadas por comas, con `latest` como valor predeterminado.

Publica plugins desde una carpeta local, `owner/repo`, `owner/repo@ref` o una URL de GitHub:

```bash
clawhub package publish <source>
```

Usa `--dry-run` para crear el plan de publicación exacto sin subirlo, y `--json`
para una salida adecuada para CI.

Los plugins de código deben incluir los metadatos de compatibilidad requeridos de OpenClaw en
`package.json`, incluidos `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`. Consulta [CLI](/es/clawhub/cli) para la referencia completa de comandos
y [Formato de Skill](/es/clawhub/skill-format) para los metadatos de Skills.

## Seguridad y moderación

ClawHub está abierto de forma predeterminada: cualquiera puede subir contenido, pero la publicación requiere una cuenta de GitHub
con antigüedad suficiente para superar la puerta de carga. Las páginas públicas de detalle resumen el
estado más reciente del escaneo antes de instalar o descargar.

ClawHub ejecuta comprobaciones automatizadas en Skills publicadas y versiones de plugins. Las versiones
retenidas por escaneo o bloqueadas pueden desaparecer del catálogo público y de las superficies de instalación mientras
siguen siendo visibles para su propietario en `/dashboard`.

Los usuarios con sesión iniciada pueden denunciar Skills y paquetes. Los moderadores pueden revisar denuncias,
ocultar o restaurar contenido, y prohibir cuentas abusivas. Consulta
[Uso aceptable](/es/clawhub/acceptable-usage) y
[Seguridad + moderación](/es/clawhub/security) para conocer las políticas y los detalles de cumplimiento.

## Telemetría y entorno

Cuando ejecutas `clawhub sync` con sesión iniciada, la CLI envía una instantánea mínima para que
ClawHub pueda calcular recuentos de instalaciones. Desactívalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Sobrescrituras útiles del entorno:

| Variable                      | Efecto                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sobrescribe la URL del sitio usada para el inicio de sesión en el navegador. |
| `CLAWHUB_REGISTRY`            | Sobrescribe la URL de la API del registro.        |
| `CLAWHUB_CONFIG_PATH`         | Sobrescribe dónde almacena la CLI el estado de token/configuración. |
| `CLAWHUB_WORKDIR`             | Sobrescribe el directorio de trabajo predeterminado. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría en `sync`.                |

Consulta [Telemetría](/es/clawhub/telemetry), [API HTTP](/es/clawhub/http-api) y
[Solución de problemas](/es/clawhub/troubleshooting) para material de referencia más detallado.
