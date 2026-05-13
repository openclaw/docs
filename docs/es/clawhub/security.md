---
read_when:
    - Comprender los resultados del análisis y la moderación de ClawHub
    - Reportar una Skill o un paquete
    - Recuperación de un listado retenido, oculto o bloqueado
summary: Comportamiento de confianza, escaneo, informes y moderación de ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad + moderación

ClawHub está abierto a la publicación, pero los listados públicos aun así pasan por controles de confianza, escaneo, informes y moderación. El objetivo es práctico: ayudar a los usuarios a inspeccionar lo que instalan, dar a los editores una vía de recuperación para falsos positivos y mantener los paquetes abusivos fuera del descubrimiento público.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar un skill o plugin, revisa su listado de ClawHub para ver:

- propietario y atribución de origen
- versión más reciente y registro de cambios
- variables de entorno o permisos requeridos
- metadatos de compatibilidad para plugins
- estado de escaneo o moderación
- informes, comentarios, estrellas, descargas y señales de instalación cuando se muestren

Instala solo contenido que entiendas y en el que confíes.

## Estados de escaneo

ClawHub puede mostrar resultados de escaneo o moderación en páginas públicas y diagnósticos visibles para el propietario.

Los resultados comunes incluyen:

- `clean`: no se encontró ningún problema bloqueante.
- `suspicious`: la versión requiere cautela o revisión.
- `malicious`: la versión se considera insegura.
- `pending`: las comprobaciones aún no han terminado.
- `held`, `quarantined`, `revoked` o `hidden`: la versión no está completamente disponible en las superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una versión está retenida o bloqueada, los usuarios no deben instalarla hasta que el propietario resuelva el problema o moderación la restaure.

## Skills

Los escaneos de skills revisan el paquete de skill publicado, los metadatos, los requisitos declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que declara un skill y lo que parece hacer. Por ejemplo, un skill que hace referencia a una clave de API requerida debe declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes de instalarlo.

Los hallazgos de escaneo se basan en artefactos. El comportamiento esperado del proveedor, como credenciales de API declaradas, devoluciones de llamada OAuth a localhost, limpieza de desinstalación delimitada, codificación de Basic Auth o cargas de archivos seleccionadas por el usuario al proveedor indicado, se trata de forma diferente al reenvío oculto de credenciales, el acceso amplio a archivos privados, destinos de red no relacionados o abuso sigiloso del navegador.

Consulta [Formato de skill](/es/clawhub/skill-format).

## Plugins

Las versiones de plugins incluyen metadatos del paquete, atribución de origen, campos de compatibilidad e información de integridad del artefacto.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquetes también pueden exponer metadatos de resumen para que OpenClaw pueda verificar los artefactos descargados. ClawScan incluye los metadatos de entorno/configuración declarados del paquete `openclaw.environment` al revisar versiones de plugins, de modo que los requisitos de tiempo de ejecución declarados se comparen con el comportamiento observado.

## Informes

Los usuarios con sesión iniciada pueden informar sobre skills, paquetes y comentarios.

Los informes deben ser específicos y accionables. El abuso del sistema de informes puede dar lugar a acciones sobre la cuenta.

Ejemplos de informes:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación de identidad
- registros de mala fe o uso indebido de marcas registradas
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

## Notas de ClawScan del editor

Los editores pueden proporcionar una nota opcional de ClawScan al publicar un skill o plugin. Esta nota da a ClawScan contexto sobre comportamientos que de otro modo podrían parecer inusuales, como acceso a la red, acceso al host nativo o credenciales específicas del proveedor.

## Retenciones de moderación

Cuando el escáner estático marca un skill cargado como malicioso, el editor queda automáticamente bajo una retención de moderación (`requiresModerationAt` establecido en el usuario). Esto oculta todos los skills del editor, hace que las publicaciones futuras comiencen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para los moderadores, pero no ocultan contenido ni deciden por sí solos el veredicto de escaneo público. Las nuevas cargas permanecen en estado de revisión/pendiente hasta que se resuelve la revisión del LLM. El escaneo estático solo bloquea de inmediato por firmas maliciosas. Las detecciones de motores de VirusTotal permanecen visibles como evidencia de seguridad, pero los veredictos de VirusTotal Code Insight/Palm son orientativos y no ocultan skills por sí solos. Las revisiones LLM de ClawScan mantienen como guía las notas alineadas con el propósito. Los hallazgos de revisión medios permanecen visibles en el artefacto, mientras que el filtro de sospecha se reserva para preocupaciones LLM de alto impacto, hallazgos maliciosos o detecciones corroboradas por motores antivirus.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto borra `requiresModerationAt` y `requiresModerationReason`, restaura los skills ocultados por la retención a nivel de usuario y escribe una entrada de registro de auditoría `user.moderation.lift`. Los skills ocultos por otros motivos, o cuyo propio escaneo estático sigue siendo malicioso, permanecen ocultos.

## Suspensiones y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves pueden dar lugar a suspensiones de cuenta, revocación de tokens, contenido oculto o listados eliminados.

Las cuentas eliminadas, suspendidas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta. Si el inicio de sesión o el acceso normal de la CLI están bloqueados, contacta con security@openclaw.ai para una revisión de recuperación.

## Guía para editores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- añade una nota de ClawScan del editor cuando una versión tenga un comportamiento inusual pero intencional
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento del paquete
