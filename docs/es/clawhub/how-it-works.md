---
read_when:
    - Comprender listados, versiones, instalaciones, publicación y moderación
summary: Cómo funcionan los listados, las versiones, las instalaciones, la publicación, los escaneos y las actualizaciones de ClawHub.
x-i18n:
    generated_at: "2026-06-28T07:41:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cómo funciona ClawHub

ClawHub es la capa de registro para Skills y plugins de OpenClaw. Ofrece a los usuarios un
lugar para descubrir paquetes, a los publicadores un lugar para lanzar versiones y
a OpenClaw metadatos suficientes para instalar y actualizar esos paquetes de forma segura.

## Registros del registro

Cada publicación pública es un registro del registro con:

- un propietario y un slug o nombre de paquete
- una o más versiones publicadas
- metadatos, resumen, archivos y atribución de origen
- información de changelog y etiquetas como `latest`
- señales de descarga, instalación y estrellas
- estado de análisis de seguridad y moderación

La página de publicación es el lugar canónico donde los usuarios pueden inspeccionar lo que una Skill o
Plugin afirma hacer antes de instalarlo.

## Skills

Una Skill es un paquete de texto versionado centrado en `SKILL.md`. Puede incluir
archivos de apoyo, ejemplos, plantillas y scripts.

ClawHub lee el frontmatter de `SKILL.md` para comprender el nombre de la Skill,
la descripción, los requisitos, las variables de entorno y los metadatos. Los
metadatos precisos importan porque ayudan a los usuarios a decidir si instalar la Skill y
ayudan a los análisis automatizados a detectar discrepancias entre el comportamiento declarado y el observado.

Consulta [Formato de Skill](/es/clawhub/skill-format).

## Plugins

Los plugins son extensiones empaquetadas de OpenClaw. ClawHub almacena metadatos del paquete,
información de compatibilidad, enlaces de origen, artefactos y registros de versión.

Cuando OpenClaw instala un Plugin desde ClawHub, comprueba los metadatos de compatibilidad
anunciados antes de instalar. Los registros de paquetes pueden incluir compatibilidad de API,
versión mínima de Gateway, destinos de host, requisitos de entorno y resúmenes
de artefactos.

Usa una fuente de instalación explícita de ClawHub cuando quieras que el registro sea la
fuente de verdad:

```bash
openclaw plugins install clawhub:<package>
```

## Publicación

Publicar crea un nuevo registro de versión inmutable. Los publicadores usan la CLI de `clawhub`
para flujos de trabajo autenticados del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa ejecuciones de prueba para previsualizar la carga resuelta antes de subirla. Luego, las páginas públicas
muestran los metadatos publicados, los archivos, la atribución de origen y el estado del análisis.

## Instalaciones y actualizaciones

Los comandos de instalación de OpenClaw usan ClawHub como fuente de paquetes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra los metadatos de la fuente de instalación para que las actualizaciones puedan resolver el mismo
paquete del registro más adelante. La CLI de ClawHub también admite flujos de trabajo directos de instalación y
actualización de Skills para usuarios que quieren carpetas de Skills gestionadas por el registro fuera de un
workspace completo de OpenClaw.

## Estado de seguridad

ClawHub está abierto a la publicación, pero los lanzamientos siguen sujetos a controles de subida,
comprobaciones automatizadas, informes de usuarios y acciones de moderadores.

Las páginas públicas muestran resúmenes de análisis cuando están disponibles. El contenido retenido, oculto
o bloqueado puede desaparecer de la búsqueda pública y de los flujos de instalación, aunque permanezca
visible para el propietario con fines de diagnóstico.

Consulta [Seguridad](/es/clawhub/security), [Auditorías de seguridad](/es/clawhub/security-audits),
[Moderación y seguridad de la cuenta](/es/clawhub/moderation) y
[Uso aceptable](/es/clawhub/acceptable-usage).

## Acceso a la API

ClawHub expone API públicas de lectura para descubrimiento, búsqueda, detalles de paquetes y
descargas. Los catálogos de terceros pueden usar estas API cuando enlazan a la publicación
canónica de ClawHub, respetan los límites de frecuencia y evitan insinuar respaldo.

Consulta [API pública](/es/clawhub/api) y [API HTTP](/es/clawhub/http-api).
