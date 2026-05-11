---
read_when:
    - Comprender listados, versiones, instalaciones, publicación y moderación
summary: Cómo funcionan los listados, las versiones, las instalaciones, la publicación, los análisis y las actualizaciones de ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cómo Funciona ClawHub

ClawHub es la capa de registro para Skills y plugins de OpenClaw. Ofrece a los usuarios un
lugar para descubrir paquetes, a los publicadores un lugar para publicar versiones, y
a OpenClaw suficientes metadatos para instalar y actualizar esos paquetes de forma segura.

## Registros del registro

Cada listado público es un registro del registro con:

- un propietario y un slug o nombre de paquete
- una o más versiones publicadas
- metadatos, resumen, archivos y atribución de origen
- información de registro de cambios y etiquetas como `latest`
- señales de descarga, instalación, estrella y comentario
- estado de análisis de seguridad y moderación

La página del listado es el lugar canónico para que los usuarios inspeccionen lo que una skill o
plugin afirma hacer antes de instalarlo.

## Skills

Una skill es un paquete de texto versionado centrado en `SKILL.md`. Puede incluir
archivos de apoyo, ejemplos, plantillas y scripts.

ClawHub lee el frontmatter de `SKILL.md` para entender el nombre de la skill,
la descripción, los requisitos, las variables de entorno y los metadatos. Los
metadatos precisos son importantes porque ayudan a los usuarios a decidir si instalar la skill y
ayudan a los análisis automatizados a detectar discrepancias entre el comportamiento declarado y el observado.

Consulta [Formato de skill](/es/clawhub/skill-format).

## Plugins

Los plugins son extensiones empaquetadas de OpenClaw. ClawHub almacena metadatos de paquetes,
información de compatibilidad, enlaces de origen, artefactos y registros de versiones.

Cuando OpenClaw instala un plugin desde ClawHub, comprueba los metadatos de compatibilidad
anunciados antes de instalar. Los registros de paquete pueden incluir compatibilidad de API,
versión mínima de gateway, destinos de host, requisitos de entorno y resúmenes de artefactos.

Usa una fuente de instalación explícita de ClawHub cuando quieras que el registro sea la
fuente de verdad:

```bash
openclaw plugins install clawhub:<package>
```

## Publicación

La publicación crea un nuevo registro de versión inmutable. Los publicadores usan la CLI `clawhub`
para flujos de trabajo de registro autenticados:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa ejecuciones de prueba para previsualizar la carga útil resuelta antes de subirla. Luego las páginas públicas
muestran los metadatos publicados, los archivos, la atribución de origen y el estado de análisis.

## Instalaciones y actualizaciones

Los comandos de instalación de OpenClaw usan ClawHub como fuente de paquetes:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registra metadatos de la fuente de instalación para que las actualizaciones puedan resolver el mismo
paquete del registro más adelante. La CLI de ClawHub también admite flujos de trabajo directos de instalación y
actualización de skills para usuarios que quieren carpetas de skills gestionadas por el registro fuera de un
espacio de trabajo completo de OpenClaw.

## Estado de seguridad

ClawHub está abierto a la publicación, pero las versiones siguen sujetas a controles de subida,
comprobaciones automatizadas, informes de usuarios y acciones de moderadores.

Las páginas públicas muestran resúmenes de análisis cuando están disponibles. El contenido que está retenido, oculto
o bloqueado puede desaparecer de los flujos públicos de búsqueda e instalación mientras sigue siendo
visible para el propietario para diagnóstico o apelación.

Consulta [Seguridad + moderación](/es/clawhub/security) y
[Uso aceptable](/es/clawhub/acceptable-usage).

## Acceso a la API

ClawHub expone API públicas de lectura para descubrimiento, búsqueda, detalles de paquetes y
descargas. Los catálogos de terceros pueden usar estas API cuando enlacen de vuelta al
listado canónico de ClawHub, respeten los límites de tasa y eviten insinuar respaldo.

Consulta [API pública](/es/clawhub/api) y [API HTTP](/es/clawhub/http-api).
