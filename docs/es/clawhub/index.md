---
read_when:
    - Explicación de qué es ClawHub
    - Buscar, instalar o actualizar Skills o plugins
    - Publicación de Skills o plugins en el registro
    - Elegir entre los flujos de la CLI de OpenClaw y ClawHub
sidebarTitle: ClawHub
summary: Descripción general pública de ClawHub para descubrir, instalar, publicar, gestionar la seguridad y usar la CLI de clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T11:25:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub es el registro público de Skills y plugins de OpenClaw.

- Use comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, así como para instalar plugins desde ClawHub.
- Use la CLI independiente `clawhub` para la autenticación en el registro, la publicación y los flujos de eliminación y restauración.

Sitio: [clawhub.ai](https://clawhub.ai)

## Inicio rápido

Busque e instale Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Busque e instale plugins con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instale la CLI de ClawHub cuando necesite flujos autenticados en el registro, como
publicar, eliminar o restaurar:

```bash
npm i -g clawhub
# o
pnpm add -g clawhub
```

## Qué aloja ClawHub

| Superficie     | Qué almacena                                                  | Comando habitual                              |
| -------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Skills         | Paquetes de texto con versiones, con `SKILL.md` y archivos auxiliares | `openclaw skills install @openclaw/demo`     |
| Plugins de código | Paquetes de plugins de OpenClaw con metadatos de compatibilidad | `openclaw plugins install clawhub:<package>` |
| Plugins agrupados | Paquetes de plugins empaquetados para su distribución con OpenClaw | `clawhub package publish <source>`           |

ClawHub registra versiones semver, etiquetas como `latest`, registros de cambios, archivos,
descargas, estrellas y resúmenes de análisis de seguridad. Las páginas públicas muestran el estado
actual del registro para que los usuarios puedan examinar una Skill o un plugin antes de instalarlo.

## Flujos nativos de OpenClaw

Los comandos nativos de OpenClaw realizan la instalación en el espacio de trabajo activo de OpenClaw y conservan
los metadatos de origen para que los comandos de actualización posteriores puedan seguir usando ClawHub.

Use `clawhub:<package>` cuando la instalación de un plugin deba resolverse mediante ClawHub.
Las especificaciones de plugins sin prefijo compatibles con npm pueden resolverse mediante npm durante las transiciones de lanzamiento, y
`npm:<package>` permanece reservado para npm cuando el origen debe indicarse explícitamente.

Las instalaciones de plugins validan la compatibilidad anunciada mediante `pluginApi` y `minGatewayVersion`
antes de iniciar la instalación del archivo. Cuando una versión de un paquete publica un artefacto
ClawPack, OpenClaw prefiere el `.tgz` exacto de npm-pack que se haya subido, verifica
la cabecera de resumen de ClawHub y los bytes descargados, y registra los metadatos del artefacto para
actualizaciones posteriores.

## CLI de ClawHub

La CLI de ClawHub está destinada a operaciones autenticadas en el registro:

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

La CLI también dispone de comandos para instalar y actualizar Skills mediante flujos directos del registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Estos comandos instalan las Skills en `./skills` dentro del directorio de trabajo actual
y registran las versiones instaladas en `.clawhub/lock.json`.

## Publicación

Publique Skills desde una carpeta local que contenga `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opciones de publicación habituales:

- `--slug <slug>`: nombre de la URL de la Skill publicada.
- `--name <name>`: nombre para mostrar.
- `--version <version>`: versión semver.
- `--changelog <text>`: texto del registro de cambios.
- `--tags <tags>`: etiquetas separadas por comas, con `latest` como valor predeterminado.

Publique plugins desde una carpeta local, `owner/repo`, `owner/repo@ref` o una URL de
GitHub:

```bash
clawhub package publish <source>
```

Use `--dry-run` para generar el plan de publicación exacto sin subir archivos y `--json`
para obtener una salida adecuada para CI.

Los plugins de código deben incluir los metadatos de compatibilidad obligatorios de OpenClaw en
`package.json`, incluidos `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`. Consulte [CLI](/es/clawhub/cli) para obtener la referencia completa de los
comandos y [Formato de las Skills](/clawhub/skill-format) para los metadatos de las Skills.

## Seguridad y moderación

ClawHub es abierto de forma predeterminada: cualquiera puede subir contenido, pero para publicar se necesita una cuenta de
GitHub con la antigüedad suficiente para superar el requisito de subida. Las páginas públicas de detalles resumen el
estado del análisis más reciente antes de la instalación o la descarga.

ClawHub ejecuta comprobaciones automatizadas sobre las Skills y las versiones de plugins publicadas. Las versiones
retenidas por los análisis o bloqueadas pueden desaparecer del catálogo público y de las superficies de instalación,
aunque sigan siendo visibles para sus propietarios en `/dashboard`.

Los usuarios que hayan iniciado sesión pueden denunciar Skills y paquetes. Los moderadores pueden revisar las denuncias,
ocultar o restaurar contenido y bloquear cuentas abusivas. Consulte
[Seguridad](/es/clawhub/security),
[Auditorías de seguridad](/clawhub/security-audits),
[Moderación y seguridad de las cuentas](/clawhub/moderation) y
[Uso aceptable](/clawhub/acceptable-usage) para obtener información sobre las políticas y su aplicación.

## Telemetría y entorno

Cuando se ejecuta `clawhub install` después de iniciar sesión, la CLI puede enviar un evento de
instalación sin garantía de entrega para que ClawHub pueda calcular el recuento agregado de instalaciones. Desactívelo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Variables de entorno útiles para sustituir valores predeterminados:

| Variable                      | Efecto                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sustituye la URL del sitio usada para iniciar sesión en el navegador. |
| `CLAWHUB_REGISTRY`            | Sustituye la URL de la API del registro.          |
| `CLAWHUB_CONFIG_PATH`         | Sustituye la ubicación donde la CLI almacena el estado de tokens y configuración. |
| `CLAWHUB_WORKDIR`             | Sustituye el directorio de trabajo predeterminado. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría de instalación.           |

Consulte [Telemetría](/clawhub/telemetry), [API HTTP](/clawhub/http-api) y
[Solución de problemas](/es/clawhub/troubleshooting) para obtener material de referencia más detallado.
