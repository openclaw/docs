---
read_when:
    - Primera vez usando ClawHub
    - Instalar un Skill o Plugin desde el registro
    - Publicación en ClawHub
summary: 'Empieza a usar ClawHub: busca, instala, actualiza y publica Skills o plugins.'
x-i18n:
    generated_at: "2026-07-03T13:15:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Inicio rápido

ClawHub es un registro de Skills y plugins de OpenClaw.

Usa OpenClaw cuando instales cosas en OpenClaw. Usa la CLI `clawhub`
cuando inicies sesión, publiques, administres tus propios listados o uses
flujos de trabajo específicos del registro.

## Buscar e instalar una Skill

Buscar desde OpenClaw:

```bash
openclaw skills search "calendar"
```

Instalar una Skill:

```bash
openclaw skills install @openclaw/demo
```

Actualizar Skills instaladas:

```bash
openclaw skills update --all
```

OpenClaw registra de dónde provino la Skill para que las actualizaciones
posteriores puedan seguir resolviéndose a través de ClawHub.

## Buscar e instalar un Plugin

Buscar desde OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instalar un Plugin alojado en ClawHub con una fuente explícita de ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Actualizar plugins instalados:

```bash
openclaw plugins update --all
```

Usa el prefijo `clawhub:` cuando quieras que OpenClaw resuelva el paquete a
través de ClawHub en lugar de npm u otra fuente.

## Iniciar sesión para publicar

Instala la CLI de ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Inicia sesión con GitHub:

```bash
clawhub login
clawhub whoami
```

Los entornos sin interfaz pueden usar un token de API desde la interfaz web de ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar una Skill

Una Skill es una carpeta con un archivo `SKILL.md` obligatorio y archivos de
soporte opcionales.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

El comando omite el contenido sin cambios. Las Skills nuevas empiezan en `1.0.0`;
los cambios posteriores publican automáticamente la siguiente versión de parche.
Usa `--dry-run` para previsualizar o `--version` para elegir una versión explícita.

Antes de publicar, revisa los metadatos en `SKILL.md`. Declara las variables de
entorno, herramientas y permisos requeridos para que los usuarios puedan entender
qué necesita la Skill antes de instalarla. Consulta [Formato de Skill](/es/clawhub/skill-format).

Para repositorios que contienen varias Skills, el flujo de trabajo reutilizable de GitHub llama a
`skill publish` para cada carpeta de Skill inmediata bajo `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publicar un Plugin

Publica un Plugin desde una carpeta local, un repositorio de GitHub, una ref de GitHub o un
archivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa primero `--dry-run` para previsualizar los metadatos del paquete resuelto, los
campos de compatibilidad, la atribución de la fuente y el plan de carga sin publicar.

Los plugins de código deben incluir metadatos de compatibilidad con OpenClaw en `package.json`,
incluidos `openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`.

## Inspeccionar antes de instalar

Antes de instalar, usa la página web de ClawHub o los comandos de detalle de la CLI para inspeccionar
metadatos, enlaces de origen, versiones, registros de cambios y estado de escaneo:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Los listados públicos muestran el estado de escaneo más reciente. Las versiones que estén retenidas o bloqueadas por
moderación pueden ocultarse de las superficies de búsqueda e instalación hasta que se resuelvan.
