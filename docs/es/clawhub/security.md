---
read_when:
    - Comprender los resultados de escaneo y moderación de ClawHub
    - Informar sobre una habilidad o un paquete
    - Recuperación de un listado retenido, oculto o bloqueado
summary: Comportamiento de confianza, escaneo, informes y moderación de ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad + moderación

ClawHub está abierto a publicaciones, pero los listados públicos siguen pasando por controles de confianza, análisis, reportes y moderación. El objetivo es práctico: ayudar a los usuarios a inspeccionar lo que instalan, dar a los publicadores una vía de recuperación ante falsos positivos y mantener los paquetes abusivos fuera de la visibilidad pública.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar una skill o un plugin, revisa su listado de ClawHub para ver:

- propietario y atribución de origen
- versión más reciente y registro de cambios
- variables de entorno o permisos requeridos
- metadatos de compatibilidad para plugins
- estado de análisis o moderación
- reportes, comentarios, estrellas, descargas y señales de instalación cuando se muestren

Instala solo contenido que entiendas y en el que confíes.

## Estados de análisis

ClawHub puede mostrar resultados de análisis o moderación en páginas públicas y diagnósticos visibles para el propietario.

Los resultados comunes incluyen:

- `clean`: no se encontró ningún problema bloqueante.
- `suspicious`: la versión requiere cautela o revisión.
- `malicious`: la versión se considera insegura.
- `pending`: las comprobaciones aún no han terminado.
- `held`, `quarantined`, `revoked` o `hidden`: la versión no está completamente disponible en las superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una versión está retenida o bloqueada, los usuarios no deben instalarla hasta que el propietario resuelva el problema o moderación la restaure.

## Skills

Los análisis de Skills revisan el paquete de skill publicado, los metadatos, los requisitos declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que una skill declara y lo que parece hacer. Por ejemplo, una skill que referencia una clave de API requerida debe declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes de instalarla.

Los hallazgos del análisis se basan en artefactos. El comportamiento esperado del proveedor, como credenciales de API declaradas, callbacks de OAuth en localhost, limpieza de desinstalación con alcance definido, codificación de Basic Auth o cargas de archivos seleccionadas por el usuario al proveedor indicado, se trata de forma diferente al reenvío oculto de credenciales, el acceso amplio a archivos privados, los destinos de red no relacionados o el abuso encubierto del navegador.

Consulta [Formato de skill](/es/clawhub/skill-format).

## Plugins

Las versiones de plugins incluyen metadatos del paquete, atribución de origen, campos de compatibilidad e información de integridad del artefacto.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquete también pueden exponer metadatos de resumen para que OpenClaw pueda verificar los artefactos descargados. ClawScan incluye metadatos declarados de entorno/configuración `openclaw.environment` del paquete al revisar versiones de plugins para comparar los requisitos de runtime declarados con el comportamiento observado.

## Reportes

Los usuarios que hayan iniciado sesión pueden reportar Skills, paquetes y comentarios.

Los reportes deben ser específicos y accionables. El abuso de los reportes puede derivar en medidas sobre la cuenta.

Ejemplos de reportes:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

## Notas de ClawScan para publicadores

Los publicadores pueden proporcionar una nota opcional de ClawScan al publicar una skill o un plugin. Esta nota da a ClawScan contexto sobre comportamientos que de otro modo podrían parecer inusuales, como acceso a la red, acceso al host nativo o credenciales específicas de un proveedor.

## Retenciones de moderación

Cuando el analizador estático marca una skill cargada como maliciosa, el publicador queda automáticamente bajo una retención de moderación (`requiresModerationAt` establecido en el usuario). Esto oculta todas las Skills del publicador, hace que las publicaciones futuras comiencen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para los moderadores, pero por sí solos no ocultan contenido ni deciden el veredicto público del análisis. Las nuevas cargas permanecen en estado de revisión/pendiente hasta que finaliza la revisión del LLM. El análisis estático solo bloquea inmediatamente en caso de firmas maliciosas. Las detecciones de motores de VirusTotal siguen siendo evidencia de seguridad visible, pero los veredictos de VirusTotal Code Insight/Palm son orientativos y no ocultan Skills por sí solos. Las revisiones LLM de ClawScan conservan notas alineadas con el propósito como guía. Los hallazgos de revisión medios permanecen visibles en el artefacto, mientras que el filtro sospechoso se reserva para preocupaciones de alto impacto del LLM, hallazgos maliciosos o detecciones corroboradas de motores AV.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto borra `requiresModerationAt` y `requiresModerationReason`, restaura las Skills ocultas por la retención a nivel de usuario y escribe una entrada de registro de auditoría `user.moderation.lift`. Las Skills ocultas por otros motivos, o cuyo propio análisis estático siga siendo malicioso, permanecen ocultas.

## Vetos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves pueden provocar vetos de cuenta, revocación de tokens, contenido oculto o listados eliminados.

Las cuentas eliminadas, vetadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI empieza a fallar después de una medida sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta. Si el inicio de sesión o el acceso normal por CLI están bloqueados, contacta con security@openclaw.ai para una revisión de recuperación.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- añade una nota de ClawScan del publicador cuando una versión tenga un comportamiento inusual pero intencional
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan por el comportamiento del paquete
