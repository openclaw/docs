---
read_when:
    - Primera vez que usas ClawHub
    - Instalar una skill o un plugin desde el registro
    - Publicación en ClawHub
summary: 'Empieza a usar ClawHub: busca, instala, actualiza y publica Skills o plugins.'
x-i18n:
    generated_at: "2026-07-11T22:54:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Inicio rápido

ClawHub es un registro de Skills y plugins para OpenClaw.

Use OpenClaw cuando instale elementos en OpenClaw. Use la CLI `clawhub`
cuando inicie sesión, publique, gestione sus propios listados o utilice
flujos de trabajo específicos del registro.

## Buscar e instalar una Skill

Busque desde OpenClaw:

```bash
openclaw skills search "calendar"
```

Instale una Skill:

```bash
openclaw skills install @openclaw/demo
```

Actualice las Skills instaladas:

```bash
openclaw skills update --all
```

OpenClaw registra el origen de la Skill para que las actualizaciones posteriores puedan seguir
resolviéndose mediante ClawHub.

## Buscar e instalar un Plugin

Busque desde OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instale un Plugin alojado en ClawHub con una fuente de ClawHub explícita:

```bash
openclaw plugins install clawhub:<package>
```

Actualice los plugins instalados:

```bash
openclaw plugins update --all
```

Use el prefijo `clawhub:` cuando quiera que OpenClaw resuelva el paquete mediante
ClawHub en lugar de npm u otra fuente.

## Iniciar sesión para publicar

Instale la CLI de ClawHub:

```bash
npm i -g clawhub
# o
pnpm add -g clawhub
```

Inicie sesión con GitHub:

```bash
clawhub login
clawhub whoami
```

Los entornos sin interfaz gráfica pueden usar un token de API de la interfaz web de ClawHub:

```bash
clawhub login --token clh_...
```

## Publicar una Skill

Una Skill es una carpeta con un archivo obligatorio `SKILL.md` y archivos auxiliares
opcionales.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

El comando omite el contenido que no ha cambiado. Las Skills nuevas comienzan en `1.0.0`; los cambios posteriores
publican automáticamente la siguiente versión de parche. Use `--dry-run` para obtener una vista previa o
`--version` para elegir una versión explícita.

Antes de publicar, compruebe los metadatos de `SKILL.md`. Declare las
variables de entorno, herramientas y permisos necesarios para que los usuarios puedan comprender qué
necesita la Skill antes de instalarla. Consulte [Formato de las Skills](/es/clawhub/skill-format).

En los repositorios que contienen varias Skills, el flujo de trabajo reutilizable de GitHub llama a
`skill publish` para cada carpeta de Skill inmediata dentro de `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publicar un Plugin

Publique un Plugin desde una carpeta local, un repositorio de GitHub, una referencia de GitHub o un
archivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use primero `--dry-run` para obtener una vista previa de los metadatos resueltos del paquete, los campos de
compatibilidad, la atribución de la fuente y el plan de carga sin publicar.

Los plugins de código deben incluir metadatos de compatibilidad con OpenClaw en `package.json`,
incluidos `openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`.

## Inspeccionar antes de instalar

Antes de instalar, use la página web de ClawHub o los comandos de detalles de la CLI para inspeccionar
los metadatos, los enlaces de origen, las versiones, los registros de cambios y el estado del análisis:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Los listados públicos muestran el estado más reciente del análisis. Las versiones retenidas o bloqueadas por
moderación pueden permanecer ocultas en las interfaces de búsqueda e instalación hasta que se resuelva la situación.
