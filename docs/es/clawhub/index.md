---
read_when:
    - Explicación de qué es ClawHub
    - Buscar, instalar o actualizar Skills o plugins
    - Publicar Skills o Plugins en el registro
    - Elegir entre los flujos de CLI de openclaw y clawhub
sidebarTitle: ClawHub
summary: Descripción general pública de ClawHub para descubrimiento, instalación, publicación, seguridad y la CLI de clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T05:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub es el registro público para Skills y plugins de OpenClaw.

- Usa comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, y para instalar plugins desde ClawHub.
- Usa la CLI `clawhub` separada para autenticación del registro, publicación y flujos de trabajo de eliminación/restauración.

Sitio: [clawhub.ai](https://clawhub.ai)

## Inicio rápido

Busca e instala Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Busca e instala plugins con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instala la CLI de ClawHub cuando quieras flujos de trabajo autenticados en el registro, como
publicar o eliminar/restaurar:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Qué aloja ClawHub

| Superficie      | Qué almacena                                                   | Comando típico                               |
| --------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Skills          | Paquetes de texto versionados con `SKILL.md` y archivos de apoyo | `openclaw skills install @openclaw/demo`     |
| Plugins de código | Paquetes de plugins de OpenClaw con metadatos de compatibilidad | `openclaw plugins install clawhub:<package>` |
| Plugins de paquete | Paquetes de plugins empaquetados para la distribución de OpenClaw | `clawhub package publish <source>`           |

ClawHub rastrea versiones semver, etiquetas como `latest`, registros de cambios, archivos,
descargas, estrellas y resúmenes de análisis de seguridad. Las páginas públicas muestran el estado
actual del registro para que los usuarios puedan inspeccionar una Skill o un plugin antes de instalarlo.

## Flujos nativos de OpenClaw

Los comandos nativos de OpenClaw instalan en el espacio de trabajo activo de OpenClaw y conservan
metadatos de origen para que los comandos de actualización posteriores puedan seguir usando ClawHub.

Usa `clawhub:<package>` cuando la instalación de un plugin deba resolverse mediante ClawHub.
Las especificaciones de plugins compatibles con npm sin prefijo pueden resolverse mediante npm durante los cambios de lanzamiento, y
`npm:<package>` sigue siendo solo npm cuando una fuente debe ser explícita.

Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y `minGatewayVersion`
antes de que se ejecute la instalación del archivo. Cuando una versión de paquete publica un
artefacto ClawPack, OpenClaw prefiere el `.tgz` exacto de npm-pack cargado, verifica
el encabezado de resumen de ClawHub y los bytes descargados, y registra metadatos del artefacto para
actualizaciones posteriores.

## CLI de ClawHub

La CLI de ClawHub es para trabajo autenticado en el registro:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

La CLI también tiene comandos de instalación/actualización de Skills para flujos directos del registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>`: nombre de URL de la Skill publicada.
- `--name <name>`: nombre para mostrar.
- `--version <version>`: versión semver.
- `--changelog <text>`: texto del registro de cambios.
- `--tags <tags>`: etiquetas separadas por comas, con valor predeterminado `latest`.

Publica plugins desde una carpeta local, `owner/repo`, `owner/repo@ref` o una URL de GitHub:

```bash
clawhub package publish <source>
```

Usa `--dry-run` para crear el plan de publicación exacto sin cargar, y `--json`
para una salida adecuada para CI.

Los plugins de código deben incluir los metadatos de compatibilidad requeridos de OpenClaw en
`package.json`, incluidos `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`. Consulta [CLI](/es/clawhub/cli) para la referencia completa de comandos
y [Formato de Skill](/clawhub/skill-format) para los metadatos de Skills.

## Seguridad y moderación

ClawHub es abierto de forma predeterminada: cualquiera puede cargar contenido, pero publicar requiere una cuenta de GitHub
con antigüedad suficiente para pasar la puerta de carga. Las páginas públicas de detalle resumen el
estado del análisis más reciente antes de instalar o descargar.

ClawHub ejecuta comprobaciones automatizadas sobre Skills publicadas y lanzamientos de plugins. Los lanzamientos retenidos por análisis
o bloqueados pueden desaparecer del catálogo público y de las superficies de instalación mientras
siguen visibles para su propietario en `/dashboard`.

Los usuarios que hayan iniciado sesión pueden denunciar Skills y paquetes. Los moderadores pueden revisar denuncias,
ocultar o restaurar contenido y bloquear cuentas abusivas. Consulta
[Seguridad](/clawhub/security),
[Auditorías de seguridad](/es/clawhub/security-audits),
[Moderación y seguridad de cuentas](/clawhub/moderation), y
[Uso aceptable](/clawhub/acceptable-usage) para detalles de políticas y aplicación.

## Telemetría y entorno

Cuando ejecutas `clawhub install` con sesión iniciada, la CLI puede enviar un evento de instalación
de mejor esfuerzo para que ClawHub pueda calcular recuentos agregados de instalaciones. Desactívalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Sobrescrituras útiles de entorno:

| Variable                      | Efecto                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `CLAWHUB_SITE`                | Sobrescribe la URL del sitio usada para iniciar sesión en el navegador. |
| `CLAWHUB_REGISTRY`            | Sobrescribe la URL de la API del registro.                   |
| `CLAWHUB_CONFIG_PATH`         | Sobrescribe dónde almacena la CLI el estado de token/configuración. |
| `CLAWHUB_WORKDIR`             | Sobrescribe el directorio de trabajo predeterminado.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría de instalación.                      |

Consulta [Telemetría](/es/clawhub/telemetry), [API HTTP](/clawhub/http-api), y
[Solución de problemas](/clawhub/troubleshooting) para material de referencia más detallado.
