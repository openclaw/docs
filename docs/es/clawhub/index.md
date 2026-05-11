---
read_when:
    - Explicación de qué es ClawHub
    - Buscar, instalar o actualizar Skills o plugins
    - Publicar Skills o plugins en el registro
    - Elegir entre los flujos de CLI de openclaw y clawhub
sidebarTitle: ClawHub
summary: Resumen público de ClawHub para descubrimiento, instalación, publicación, seguridad y la CLI de clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub es el registro público de Skills y plugins de OpenClaw.

- Usa comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, y para instalar plugins desde ClawHub.
- Usa la CLI `clawhub` independiente para flujos de trabajo de autenticación del registro, publicación, eliminación/restauración, nuevos análisis y sincronización.

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

Instala la CLI de ClawHub cuando quieras flujos de trabajo autenticados en el registro, como
publicar, sincronizar, eliminar/restaurar o ejecutar nuevos análisis solicitados por el propietario:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Qué aloja ClawHub

| Superficie     | Qué almacena                                                 | Comando típico                              |
| -------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Skills         | Paquetes de texto versionados con `SKILL.md` y archivos de apoyo | `openclaw skills install <slug>`            |
| Plugins de código | Paquetes de plugins de OpenClaw con metadatos de compatibilidad | `openclaw plugins install clawhub:<package>` |
| Plugins de paquete | Paquetes de plugins empaquetados para la distribución de OpenClaw | `clawhub package publish <source>`          |
| Souls          | Paquetes `SOUL.md` mostrados en onlycrabs.ai                 | Flujos de publicación web y de API          |

ClawHub registra versiones semver, etiquetas como `latest`, registros de cambios, archivos,
descargas, estrellas y resúmenes de análisis de seguridad. Las páginas públicas muestran el estado
actual del registro para que los usuarios puedan inspeccionar una Skill o plugin antes de instalarlo.

## Flujos nativos de OpenClaw

Los comandos nativos de OpenClaw instalan en el espacio de trabajo activo de OpenClaw y conservan
los metadatos de origen para que los comandos de actualización posteriores puedan seguir usando ClawHub.

Usa `clawhub:<package>` cuando una instalación de plugin deba resolverse mediante ClawHub.
Las especificaciones de plugins simples compatibles con npm pueden resolverse mediante npm durante transiciones de lanzamiento, y
`npm:<package>` sigue siendo exclusivo de npm cuando una fuente debe ser explícita.

Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y `minGatewayVersion`
antes de que se ejecute la instalación del archivo. Cuando una versión de paquete publica un artefacto
ClawPack, OpenClaw prefiere el `.tgz` exacto de npm-pack subido, verifica
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
clawhub sync --all
```

La CLI también tiene comandos de instalación/actualización de Skills para flujos directos con el registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Esos comandos instalan Skills en `./skills` dentro del directorio de trabajo actual
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

Usa `--dry-run` para crear el plan de publicación exacto sin subir nada, y `--json`
para una salida adecuada para CI.

Los plugins de código deben incluir los metadatos de compatibilidad requeridos de OpenClaw en
`package.json`, incluidos `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`. Consulta [CLI](/es/clawhub/cli) para la referencia completa de comandos
y [Formato de Skill](/es/clawhub/skill-format) para los metadatos de Skills.

## Seguridad y moderación

ClawHub es abierto por defecto: cualquiera puede subir contenido, pero publicar requiere una cuenta de GitHub
con antigüedad suficiente para superar la puerta de subida. Las páginas públicas de detalles resumen el
estado del análisis más reciente antes de instalar o descargar.

ClawHub ejecuta comprobaciones automatizadas en Skills publicadas y versiones de plugins. Las versiones retenidas
por análisis o bloqueadas pueden desaparecer del catálogo público y de las superficies de instalación, aunque
sigan siendo visibles para su propietario en `/dashboard`.

Los propietarios pueden solicitar nuevos análisis limitados para recuperarse de falsos positivos. Los moderadores
y administradores de la plataforma pueden solicitar nuevos análisis para cualquier Skill o paquete al gestionar
informes de soporte:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Los usuarios con sesión iniciada pueden reportar Skills y paquetes. Los moderadores pueden revisar reportes,
ocultar o restaurar contenido, resolver apelaciones y prohibir cuentas abusivas. Consulta
[Uso aceptable](/es/clawhub/acceptable-usage) y
[Seguridad + moderación](/es/clawhub/security) para detalles sobre políticas y aplicación.

## Telemetría y entorno

Cuando ejecutas `clawhub sync` con sesión iniciada, la CLI envía una instantánea mínima para que
ClawHub pueda calcular recuentos de instalaciones. Desactívalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Sobrescrituras de entorno útiles:

| Variable                      | Efecto                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sobrescribe la URL del sitio usada para el inicio de sesión en el navegador. |
| `CLAWHUB_REGISTRY`            | Sobrescribe la URL de la API del registro.        |
| `CLAWHUB_CONFIG_PATH`         | Sobrescribe dónde almacena la CLI el estado de token/configuración. |
| `CLAWHUB_WORKDIR`             | Sobrescribe el directorio de trabajo predeterminado. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría en `sync`.                |

Consulta [Telemetría](/es/clawhub/telemetry), [API HTTP](/es/clawhub/http-api) y
[Solución de problemas](/es/clawhub/troubleshooting) para material de referencia más detallado.
