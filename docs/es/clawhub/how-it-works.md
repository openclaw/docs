---
read_when:
    - Comprender los listados, las versiones, las instalaciones, la publicación y la moderación
summary: Cómo funcionan los listados, las versiones, las instalaciones, la publicación, los análisis y las actualizaciones de ClawHub.
x-i18n:
    generated_at: "2026-07-11T22:57:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cómo funciona ClawHub

ClawHub es la capa de registro para las Skills y los plugins de OpenClaw. Ofrece a los usuarios un lugar donde descubrir paquetes, a los publicadores un lugar donde publicar versiones y proporciona a OpenClaw suficientes metadatos para instalar y actualizar esos paquetes de forma segura.

## Registros del catálogo

Cada ficha pública es un registro del catálogo que incluye:

- un propietario y un identificador corto o nombre de paquete
- una o más versiones publicadas
- metadatos, resumen, archivos y atribución de origen
- información del registro de cambios y de etiquetas como `latest`
- indicadores de descargas, instalaciones y favoritos
- estado del análisis de seguridad y de la moderación

La página de la ficha es el lugar de referencia para que los usuarios examinen lo que una Skill o un plugin afirma hacer antes de instalarlo.

## Skills

Una Skill es un paquete de texto versionado centrado en `SKILL.md`. Puede incluir archivos complementarios, ejemplos, plantillas y scripts.

ClawHub lee el frontmatter de `SKILL.md` para conocer el nombre, la descripción, los requisitos, las variables de entorno y los metadatos de la Skill. La precisión de los metadatos es importante porque ayuda a los usuarios a decidir si deben instalar la Skill y permite que los análisis automatizados detecten discrepancias entre el comportamiento declarado y el observado.

Consulta [Formato de las Skills](/clawhub/skill-format).

## Plugins

Los plugins son extensiones empaquetadas de OpenClaw. ClawHub almacena metadatos de los paquetes, información de compatibilidad, enlaces al código fuente, artefactos y registros de versiones.

Cuando OpenClaw instala un plugin desde ClawHub, comprueba los metadatos de compatibilidad declarados antes de instalarlo. Los registros de paquetes pueden incluir compatibilidad con la API, versión mínima del Gateway, plataformas de destino, requisitos del entorno y resúmenes criptográficos de los artefactos.

Usa una fuente de instalación explícita de ClawHub cuando quieras que el catálogo sea la fuente de referencia:

```bash
openclaw plugins install clawhub:<package>
```

## Publicación

La publicación crea un nuevo registro de versión inmutable. Los publicadores usan la CLI `clawhub` para los flujos de trabajo autenticados del catálogo:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa ejecuciones de prueba para previsualizar la carga útil resuelta antes de subirla. A continuación, las páginas públicas muestran los metadatos publicados, los archivos, la atribución de origen y el estado del análisis.

## Instalaciones y actualizaciones

Los comandos de instalación de OpenClaw usan ClawHub como fuente de paquetes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra los metadatos de la fuente de instalación para que las actualizaciones puedan resolver más adelante el mismo paquete del catálogo. La CLI de ClawHub también admite flujos de trabajo de instalación y actualización directa de Skills para los usuarios que quieran carpetas de Skills gestionadas por el catálogo fuera de un espacio de trabajo completo de OpenClaw.

## Estado de seguridad

ClawHub permite la publicación abierta, pero las versiones siguen sujetas a controles de carga, comprobaciones automatizadas, denuncias de usuarios y medidas de moderación.

Las páginas públicas muestran resúmenes de los análisis cuando están disponibles. El contenido retenido, oculto o bloqueado puede desaparecer de las búsquedas públicas y de los flujos de instalación, pero seguir siendo visible para el propietario con fines de diagnóstico.

Consulta [Seguridad](/es/clawhub/security), [Auditorías de seguridad](/clawhub/security-audits), [Moderación y seguridad de las cuentas](/es/clawhub/moderation) y [Uso aceptable](/clawhub/acceptable-usage).

## Acceso a la API

ClawHub ofrece API públicas de lectura para el descubrimiento, la búsqueda, los detalles de los paquetes y las descargas. Los catálogos de terceros pueden usar estas API siempre que incluyan un enlace a la ficha canónica de ClawHub, respeten los límites de frecuencia y eviten dar a entender que cuentan con su respaldo.

Consulta [API pública](/clawhub/api) y [API HTTP](/clawhub/http-api).
