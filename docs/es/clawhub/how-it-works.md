---
read_when:
    - Descripción de listados, versiones, instalaciones, publicación y moderación
summary: Cómo funcionan los listados, las versiones, las instalaciones, la publicación, los análisis y las actualizaciones de ClawHub.
x-i18n:
    generated_at: "2026-07-19T01:51:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cómo funciona ClawHub

ClawHub es la capa de registro para las Skills y los plugins de OpenClaw. Ofrece a los usuarios un
lugar donde descubrir paquetes, a los editores un lugar donde publicar versiones y
a OpenClaw los metadatos necesarios para instalar y actualizar esos paquetes de forma segura.

## Registros del registro

Cada elemento público es un registro del registro que contiene:

- un propietario y un slug o nombre de paquete
- una o más versiones publicadas
- metadatos, resumen, archivos y atribución de la fuente
- registro de cambios e información de etiquetas, como `latest`
- señales de descargas, instalaciones y estrellas
- estado del análisis de seguridad y la moderación

La página del elemento es el lugar canónico donde los usuarios pueden examinar lo que una Skill o
un plugin afirma hacer antes de instalarlo.

## Skills

Una Skill es un paquete de texto versionado centrado en `SKILL.md`. Puede incluir
archivos auxiliares, ejemplos, plantillas y scripts.

ClawHub lee el frontmatter de `SKILL.md` para conocer el nombre de la Skill,
su descripción, requisitos, variables de entorno y metadatos. Es importante que los
metadatos sean precisos, ya que ayudan a los usuarios a decidir si deben instalar la Skill y
permiten que los análisis automatizados detecten discrepancias entre el comportamiento declarado y el observado.

Consulte [Formato de las Skills](/clawhub/skill-format).

## Plugins

Los plugins son extensiones empaquetadas de OpenClaw. ClawHub almacena metadatos de los paquetes,
información de compatibilidad, enlaces a las fuentes, artefactos y registros de versiones.

Cuando OpenClaw instala un plugin desde ClawHub, comprueba los metadatos de compatibilidad
anunciados antes de instalarlo. Los registros de los paquetes pueden incluir compatibilidad con la API,
versión mínima del Gateway, hosts de destino, requisitos del entorno y resúmenes
criptográficos de los artefactos.

Utilice una fuente de instalación explícita de ClawHub cuando se quiera que el registro sea la
fuente de verdad:

```bash
openclaw plugins install clawhub:<package>
```

## Publicación

La publicación crea un nuevo registro de versión inmutable. Los editores utilizan la CLI
`clawhub` para los flujos de trabajo autenticados del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilice ejecuciones de prueba para previsualizar la carga útil resuelta antes de subirla. A continuación, las páginas
públicas muestran los metadatos publicados, los archivos, la atribución de la fuente y el estado del análisis.

## Instalaciones y actualizaciones

Los comandos de instalación de OpenClaw utilizan ClawHub como fuente de paquetes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra los metadatos de la fuente de instalación para que las actualizaciones puedan localizar posteriormente el mismo
paquete del registro. La CLI de ClawHub también admite flujos de trabajo directos de instalación y
actualización de Skills para los usuarios que quieran carpetas de Skills gestionadas por el registro fuera de un
espacio de trabajo completo de OpenClaw.

## Estado de seguridad

ClawHub permite la publicación abierta, pero las versiones siguen estando sujetas a controles de subida,
comprobaciones automatizadas, informes de los usuarios y medidas de los moderadores.

Las páginas públicas muestran resúmenes de los análisis cuando están disponibles. El contenido retenido, oculto
o bloqueado puede desaparecer de las búsquedas públicas y los flujos de instalación, aunque siga siendo
visible para el propietario con fines de diagnóstico.

Consulte [Seguridad](/clawhub/security), [Auditorías de seguridad](/es/clawhub/security-audits),
[Moderación y seguridad de la cuenta](/clawhub/moderation) y
[Uso aceptable](/clawhub/acceptable-usage).

## Acceso mediante API

ClawHub expone API públicas de lectura para el descubrimiento, la búsqueda, los detalles de los paquetes y
las descargas. Los catálogos de terceros pueden utilizar estas API cuando incluyan un enlace al
elemento canónico de ClawHub, respeten los límites de solicitudes y no den a entender que cuentan con respaldo.

Consulte [API pública](/es/clawhub/api) y [API HTTP](/clawhub/http-api).
