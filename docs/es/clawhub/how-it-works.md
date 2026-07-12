---
read_when:
    - Descripción de los listados, las versiones, las instalaciones, la publicación y la moderación
summary: Cómo funcionan los listados, las versiones, las instalaciones, la publicación, los análisis y las actualizaciones de ClawHub.
x-i18n:
    generated_at: "2026-07-12T14:23:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cómo funciona ClawHub

ClawHub es la capa de registro para las Skills y los plugins de OpenClaw. Ofrece a los usuarios un
lugar donde descubrir paquetes, a los publicadores un lugar donde publicar versiones y
proporciona a OpenClaw suficientes metadatos para instalar y actualizar esos paquetes de forma segura.

## Registros del registro

Cada ficha pública es un registro del registro que contiene:

- un propietario y un slug o nombre de paquete
- una o más versiones publicadas
- metadatos, resumen, archivos y atribución de la fuente
- información del registro de cambios y de etiquetas, como `latest`
- indicadores de descargas, instalaciones y estrellas
- estado del análisis de seguridad y de moderación

La página de la ficha es el lugar canónico donde los usuarios pueden consultar lo que una Skill o un
plugin afirma hacer antes de instalarlo.

## Skills

Una Skill es un paquete de texto versionado centrado en `SKILL.md`. Puede incluir
archivos auxiliares, ejemplos, plantillas y scripts.

ClawHub lee el frontmatter de `SKILL.md` para conocer el nombre de la Skill,
su descripción, requisitos, variables de entorno y metadatos. La precisión de los
metadatos es importante porque ayuda a los usuarios a decidir si deben instalar la Skill y
ayuda a los análisis automatizados a detectar discrepancias entre el comportamiento declarado y el observado.

Consulte [Formato de las Skills](/es/clawhub/skill-format).

## Plugins

Los plugins son extensiones empaquetadas de OpenClaw. ClawHub almacena metadatos del paquete,
información de compatibilidad, enlaces a las fuentes, artefactos y registros de versiones.

Cuando OpenClaw instala un plugin desde ClawHub, comprueba los metadatos de compatibilidad
indicados antes de instalarlo. Los registros de paquetes pueden incluir compatibilidad con la API,
versión mínima del Gateway, hosts de destino, requisitos del entorno y resúmenes criptográficos
de los artefactos.

Use una fuente de instalación explícita de ClawHub cuando quiera que el registro sea la
fuente de referencia:

```bash
openclaw plugins install clawhub:<package>
```

## Publicación

La publicación crea un nuevo registro de versión inmutable. Los publicadores usan la CLI
`clawhub` para los flujos de trabajo autenticados del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use ejecuciones de prueba para obtener una vista previa de la carga útil resuelta antes de subirla. Después, las páginas
públicas muestran los metadatos publicados, los archivos, la atribución de la fuente y el estado del análisis.

## Instalaciones y actualizaciones

Los comandos de instalación de OpenClaw usan ClawHub como fuente de paquetes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra los metadatos de la fuente de instalación para que las actualizaciones puedan resolver posteriormente el mismo
paquete del registro. La CLI de ClawHub también admite flujos de trabajo directos de instalación y
actualización de Skills para los usuarios que quieran carpetas de Skills gestionadas por el registro fuera de un
espacio de trabajo completo de OpenClaw.

## Estado de seguridad

ClawHub permite la publicación abierta, pero las versiones siguen estando sujetas a controles de carga,
comprobaciones automatizadas, informes de usuarios y acciones de los moderadores.

Las páginas públicas muestran resúmenes de los análisis cuando están disponibles. El contenido retenido, oculto
o bloqueado puede desaparecer de los flujos públicos de búsqueda e instalación, aunque siga
siendo visible para el propietario con fines de diagnóstico.

Consulte [Seguridad](/clawhub/security), [Auditorías de seguridad](/clawhub/security-audits),
[Moderación y seguridad de las cuentas](/es/clawhub/moderation) y
[Uso aceptable](/clawhub/acceptable-usage).

## Acceso a la API

ClawHub ofrece API públicas de lectura para el descubrimiento, la búsqueda, los detalles de los paquetes y
las descargas. Los catálogos de terceros pueden usar estas API si incluyen un enlace a la
ficha canónica de ClawHub, respetan los límites de frecuencia y evitan insinuar que cuentan con su respaldo.

Consulte [API pública](/clawhub/api) y [API HTTP](/clawhub/http-api).
