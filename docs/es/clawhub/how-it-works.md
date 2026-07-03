---
read_when:
    - Comprender listados, versiones, instalaciones, publicación y moderación
summary: Cómo funcionan los listados, las versiones, las instalaciones, la publicación, los análisis y las actualizaciones de ClawHub.
x-i18n:
    generated_at: "2026-07-03T02:41:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cómo funciona ClawHub

ClawHub es la capa de registro para las habilidades y plugins de OpenClaw. Da a los usuarios un
lugar para descubrir paquetes, da a los publicadores un lugar para publicar versiones y
da a OpenClaw metadatos suficientes para instalar y actualizar esos paquetes de forma segura.

## Registros del registro

Cada publicación pública es un registro del registro con:

- un propietario y un slug o nombre de paquete
- una o más versiones publicadas
- metadatos, resumen, archivos y atribución de origen
- información de registro de cambios y etiquetas, como `latest`
- señales de descarga, instalación y estrellas
- estado de análisis de seguridad y moderación

La página de publicación es el lugar canónico para que los usuarios inspeccionen qué afirma hacer una habilidad o
plugin antes de instalarlo.

## Skills

Una habilidad es un paquete de texto versionado centrado en `SKILL.md`. Puede incluir
archivos de apoyo, ejemplos, plantillas y scripts.

ClawHub lee el frontmatter de `SKILL.md` para entender el nombre de la habilidad,
la descripción, los requisitos, las variables de entorno y los metadatos. Los
metadatos precisos importan porque ayudan a los usuarios a decidir si instalar la habilidad y
ayudan a los análisis automatizados a detectar discrepancias entre el comportamiento declarado y el observado.

Consulta [Formato de habilidad](/es/clawhub/skill-format).

## Plugins

Los plugins son extensiones empaquetadas de OpenClaw. ClawHub almacena metadatos de paquete,
información de compatibilidad, enlaces de origen, artefactos y registros de versión.

Cuando OpenClaw instala un plugin desde ClawHub, comprueba los metadatos de compatibilidad
anunciados antes de instalar. Los registros de paquete pueden incluir compatibilidad de API,
versión mínima de Gateway, destinos de host, requisitos de entorno y resúmenes criptográficos de artefactos.

Usa una fuente de instalación explícita de ClawHub cuando quieras que el registro sea la
fuente de verdad:

```bash
openclaw plugins install clawhub:<package>
```

## Publicación

Publicar crea un nuevo registro de versión inmutable. Los publicadores usan la CLI `clawhub`
para flujos de trabajo autenticados del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa ejecuciones de prueba para previsualizar la carga útil resuelta antes de subirla. Luego, las páginas públicas
muestran los metadatos publicados, los archivos, la atribución de origen y el estado de análisis.

## Instalaciones y actualizaciones

Los comandos de instalación de OpenClaw usan ClawHub como fuente de paquetes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra metadatos de la fuente de instalación para que las actualizaciones puedan resolver el mismo
paquete del registro más adelante. La CLI de ClawHub también admite flujos de trabajo directos de instalación y
actualización de habilidades para usuarios que quieren carpetas de habilidades gestionadas por el registro fuera de un
workspace completo de OpenClaw.

## Estado de seguridad

ClawHub está abierto a la publicación, pero las versiones siguen sujetas a controles de subida,
comprobaciones automatizadas, informes de usuarios y acciones de moderadores.

Las páginas públicas muestran resúmenes de análisis cuando están disponibles. El contenido retenido, oculto
o bloqueado puede desaparecer de la búsqueda pública y de los flujos de instalación, aunque siga siendo
visible para el propietario con fines de diagnóstico.

Consulta [Seguridad](/clawhub/security), [Auditorías de seguridad](/clawhub/security-audits),
[Moderación y seguridad de la cuenta](/es/clawhub/moderation) y
[Uso aceptable](/clawhub/acceptable-usage).

## Acceso a la API

ClawHub expone APIs públicas de lectura para descubrimiento, búsqueda, detalles de paquetes y
descargas. Los catálogos de terceros pueden usar estas APIs cuando enlazan de vuelta a la
publicación canónica de ClawHub, respetan los límites de frecuencia y evitan insinuar respaldo.

Consulta [API pública](/es/clawhub/api) y [API HTTP](/clawhub/http-api).
