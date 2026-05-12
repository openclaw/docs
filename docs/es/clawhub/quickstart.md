---
read_when:
    - Primera vez usando ClawHub
    - Instalar una skill o un Plugin desde el registro
    - Publicación en ClawHub
summary: 'Empieza a usar ClawHub: busca, instala, actualiza y publica Skills o plugins.'
x-i18n:
    generated_at: "2026-05-12T23:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Inicio rápido

ClawHub es un registro para Skills y plugins de OpenClaw.

Usa OpenClaw cuando instales elementos en OpenClaw. Usa la CLI `clawhub`
cuando inicies sesión, publiques, gestiones tus propios listados o uses
flujos de trabajo específicos del registro.

## Buscar e instalar una Skill

Busca desde OpenClaw:

```bash
openclaw skills search "calendar"
```

Instala una Skill:

```bash
openclaw skills install <skill-slug>
```

Actualiza las Skills instaladas:

```bash
openclaw skills update --all
```

OpenClaw registra de dónde provino la Skill para que las actualizaciones
posteriores puedan seguir resolviéndose a través de ClawHub.

## Buscar e instalar un Plugin

Busca desde OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instala un Plugin alojado en ClawHub con una fuente ClawHub explícita:

```bash
openclaw plugins install clawhub:<package>
```

Actualiza los plugins instalados:

```bash
openclaw plugins update --all
```

Usa el prefijo `clawhub:` cuando quieras que OpenClaw resuelva el paquete a través
de ClawHub en lugar de npm u otra fuente.

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
  --version 1.0.0 \
  --changelog "Initial release"
```

Antes de publicar, revisa los metadatos en `SKILL.md`. Declara las variables de
entorno, herramientas y permisos requeridos para que los usuarios puedan entender
qué necesita la Skill antes de instalarla. Consulta [Formato de Skill](/es/clawhub/skill-format).

## Publicar un Plugin

Publica un Plugin desde una carpeta local, un repositorio de GitHub, una referencia
de GitHub o un archivo existente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa primero `--dry-run` para previsualizar los metadatos resueltos del paquete,
los campos de compatibilidad, la atribución de origen y el plan de carga sin publicar.

Los plugins de código deben incluir metadatos de compatibilidad de OpenClaw en `package.json`,
incluidos `openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`.

## Sincronizar Skills que mantienes

`sync` escanea carpetas de Skills y publica Skills nuevas o modificadas que aún no
están sincronizadas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Cuando has iniciado sesión, `sync` también puede enviar una instantánea mínima de instalación para
recuentos agregados de instalaciones. Consulta [Telemetría](/es/clawhub/telemetry) para saber qué se reporta
y cómo optar por no participar.

## Inspeccionar antes de instalar

Antes de instalar, usa la página web de ClawHub o los comandos de detalle de la CLI para inspeccionar
metadatos, enlaces de origen, versiones, registros de cambios y estado de escaneo:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Los listados públicos muestran el estado de escaneo más reciente. Las versiones retenidas o bloqueadas por
moderación pueden ocultarse de las superficies de búsqueda e instalación hasta que se resuelvan.
