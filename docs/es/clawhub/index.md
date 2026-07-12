---
read_when:
    - Explicación de qué es ClawHub
    - Buscar, instalar o actualizar Skills o plugins
    - Publicación de Skills o plugins en el registro
    - Elección entre los flujos de la CLI de OpenClaw y ClawHub
sidebarTitle: ClawHub
summary: Descripción general pública de ClawHub para descubrir, instalar, publicar, gestionar la seguridad y usar la CLI de clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T14:20:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub es el registro público de Skills y plugins de OpenClaw.

- Use los comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, así como para instalar plugins desde ClawHub.
- Use la CLI independiente `clawhub` para la autenticación en el registro, la publicación y los flujos de eliminación/restauración.

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
publicar o eliminar/restaurar:

```bash
npm i -g clawhub
# o
pnpm add -g clawhub
```

## Qué aloja ClawHub

| Superficie       | Qué almacena                                                          | Comando habitual                             |
| ---------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Skills           | Paquetes de texto versionados con `SKILL.md` y archivos auxiliares    | `openclaw skills install @openclaw/demo`     |
| Plugins de código | Paquetes de plugins de OpenClaw con metadatos de compatibilidad       | `openclaw plugins install clawhub:<package>` |
| Plugins en paquete | Paquetes de plugins empaquetados para la distribución de OpenClaw     | `clawhub package publish <source>`           |

ClawHub registra versiones semver, etiquetas como `latest`, registros de cambios, archivos,
descargas, estrellas y resúmenes de análisis de seguridad. Las páginas públicas muestran el estado actual del
registro para que los usuarios puedan examinar una Skill o un plugin antes de instalarlo.

## Flujos nativos de OpenClaw

Los comandos nativos de OpenClaw realizan la instalación en el espacio de trabajo activo de OpenClaw y conservan
los metadatos de origen para que los comandos de actualización posteriores puedan seguir usando ClawHub.

Use `clawhub:<package>` cuando la instalación de un plugin deba resolverse mediante ClawHub.
Las especificaciones de plugins sin prefijo que sean válidas para npm pueden resolverse mediante npm durante las transiciones de lanzamiento, y
`npm:<package>` sigue siendo exclusivo de npm cuando el origen debe indicarse explícitamente.

Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y `minGatewayVersion`
antes de ejecutar la instalación del archivo. Cuando una versión de un paquete publica un
artefacto ClawPack, OpenClaw prioriza el archivo `.tgz` exacto subido mediante npm-pack, verifica
la cabecera de resumen de ClawHub y los bytes descargados, y registra los metadatos del artefacto para
actualizaciones posteriores.

## CLI de ClawHub

La CLI de ClawHub se utiliza para operaciones autenticadas en el registro:

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

La CLI también incluye comandos de instalación y actualización de Skills para flujos directos con el registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Esos comandos instalan Skills en `./skills`, dentro del directorio de trabajo actual,
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
- `--tags <tags>`: etiquetas separadas por comas; el valor predeterminado es `latest`.

Publique plugins desde una carpeta local, `owner/repo`, `owner/repo@ref` o una URL de
GitHub:

```bash
clawhub package publish <source>
```

Use `--dry-run` para generar el plan de publicación exacto sin subirlo y `--json`
para obtener una salida adecuada para CI.

Los plugins de código deben incluir los metadatos de compatibilidad requeridos por OpenClaw en
`package.json`, incluidos `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`. Consulte [CLI](/es/clawhub/cli) para obtener la referencia completa de
comandos y [Formato de Skills](/clawhub/skill-format) para conocer los metadatos de las Skills.

## Seguridad y moderación

ClawHub es abierto de forma predeterminada: cualquiera puede subir contenido, pero para publicar se requiere una cuenta de
GitHub con suficiente antigüedad para superar el control de carga. Las páginas públicas de detalles resumen el
estado del análisis más reciente antes de la instalación o la descarga.

ClawHub ejecuta comprobaciones automatizadas sobre las Skills y las versiones de plugins publicadas. Las versiones retenidas
por análisis o bloqueadas pueden desaparecer del catálogo público y de las superficies de instalación, aunque
seguirán siendo visibles para sus propietarios en `/dashboard`.

Los usuarios que hayan iniciado sesión pueden denunciar Skills y paquetes. Los moderadores pueden revisar las denuncias,
ocultar o restaurar contenido y bloquear cuentas abusivas. Consulte
[Seguridad](/es/clawhub/security),
[Auditorías de seguridad](/clawhub/security-audits),
[Moderación y seguridad de las cuentas](/clawhub/moderation) y
[Uso aceptable](/clawhub/acceptable-usage) para obtener detalles sobre las políticas y su aplicación.

## Telemetría y entorno

Cuando ejecuta `clawhub install` con una sesión iniciada, la CLI puede enviar, según disponibilidad,
un evento de instalación para que ClawHub pueda calcular recuentos agregados de instalaciones. Desactive esta función con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Sobrescrituras de entorno útiles:

| Variable                      | Efecto                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| `CLAWHUB_SITE`                | Sobrescribe la URL del sitio usada para iniciar sesión en el navegador. |
| `CLAWHUB_REGISTRY`            | Sobrescribe la URL de la API del registro.                     |
| `CLAWHUB_CONFIG_PATH`         | Sobrescribe la ubicación donde la CLI almacena el estado del token y la configuración. |
| `CLAWHUB_WORKDIR`             | Sobrescribe el directorio de trabajo predeterminado.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría de instalación.                        |

Consulte [Telemetría](/clawhub/telemetry), [API HTTP](/clawhub/http-api) y
[Solución de problemas](/es/clawhub/troubleshooting) para obtener material de referencia más detallado.
