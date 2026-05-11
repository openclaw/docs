---
read_when:
    - Comprender los resultados del escaneo y la moderación de ClawHub
    - Reportar una skill o un paquete
    - Recuperarse de un listado retenido, oculto o bloqueado
summary: Comportamiento de confianza, escaneo, informes y moderación de ClawHub.
x-i18n:
    generated_at: "2026-05-11T22:20:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad + Moderación

ClawHub está abierto a la publicación, pero los listados públicos siguen pasando por controles de confianza,
análisis, reportes y moderación. El objetivo es práctico: ayudar a los usuarios
a inspeccionar lo que instalan, dar a los publicadores una vía de recuperación ante falsos positivos
y mantener los paquetes abusivos fuera del descubrimiento público.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar una skill o plugin, revisa su listado de ClawHub para ver:

- atribución de propietario y fuente
- versión más reciente y registro de cambios
- variables de entorno o permisos requeridos
- metadatos de compatibilidad para plugins
- estado de análisis o moderación
- reportes, comentarios, estrellas, descargas y señales de instalación cuando se muestren

Instala solo contenido que entiendas y en el que confíes.

## Estados de análisis

ClawHub puede mostrar resultados de análisis o moderación en páginas públicas y diagnósticos
visibles para el propietario.

Los resultados comunes incluyen:

- `clean`: no se encontró ningún problema bloqueante.
- `suspicious`: la publicación requiere cautela o revisión.
- `malicious`: la publicación se considera insegura.
- `pending`: las comprobaciones aún no han finalizado.
- `held`, `quarantined`, `revoked` o `hidden`: la publicación no está plenamente
  disponible en las superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una
publicación está retenida o bloqueada, los usuarios no deben instalarla hasta que el propietario resuelva
el problema o la moderación la restaure.

## Skills

Los análisis de Skills examinan el paquete de skill publicado, los metadatos, los requisitos
declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que una skill declara y
lo que parece hacer. Por ejemplo, una skill que referencia una clave de API requerida
debe declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes de
instalarla.

Los hallazgos de análisis se basan en artefactos. El comportamiento esperado del proveedor, como
credenciales de API declaradas, callbacks OAuth de localhost, limpieza de desinstalación delimitada, codificación de Basic Auth
o cargas de archivos seleccionadas por el usuario al proveedor indicado, se trata
de forma diferente al reenvío oculto de credenciales, el acceso amplio a archivos privados,
destinos de red no relacionados o el abuso encubierto del navegador.

Consulta [Formato de skill](/es/clawhub/skill-format).

## Plugins

Las publicaciones de plugins incluyen metadatos del paquete, atribución de fuente, campos de compatibilidad
e información de integridad del artefacto.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquetes
también pueden exponer metadatos de resumen para que OpenClaw pueda verificar los
artefactos descargados. ClawScan incluye metadatos de entorno/configuración declarados en `openclaw.environment` del paquete
al revisar publicaciones de plugins, de modo que los requisitos declarados en tiempo de ejecución se
comparen con el comportamiento observado.

## Reportes

Los usuarios con sesión iniciada pueden reportar Skills, paquetes y comentarios.

Los reportes deben ser específicos y accionables. El abuso de los reportes puede derivar
en acciones contra la cuenta.

Ejemplos de reportes:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación
- registros de mala fe o uso indebido de marcas registradas
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

## Notas de ClawScan para publicadores

Los publicadores pueden proporcionar una nota opcional de ClawScan al publicar una skill o
plugin. Esta nota da a ClawScan contexto sobre comportamientos que, de otro modo, podrían parecer
inusuales, como acceso de red, acceso a host nativo o credenciales específicas
del proveedor.

## Retenciones de moderación

Cuando el analizador estático marca una skill subida como maliciosa, el publicador es
colocado automáticamente bajo una retención de moderación (`requiresModerationAt` establecido en el
usuario). Esto oculta todas las Skills del publicador, hace que las publicaciones futuras
empiecen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para moderadores,
pero por sí solos no ocultan contenido ni deciden el veredicto público del análisis.
Las nuevas subidas permanecen en estado de revisión/pendiente hasta que se resuelva la revisión LLM. El análisis estático
solo bloquea de inmediato por firmas maliciosas. Los aciertos del motor de VirusTotal
siguen siendo evidencia de seguridad visible, pero los veredictos de VirusTotal Code Insight/Palm
son consultivos y no ocultan Skills por sí solos. Las revisiones LLM de ClawScan
mantienen las notas alineadas con el propósito como orientación. Los hallazgos de revisión medios permanecen visibles en
el artefacto, mientras que el filtro sospechoso se reserva para preocupaciones LLM de alto impacto,
hallazgos maliciosos o detecciones corroboradas de motores AV.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto borra `requiresModerationAt` y `requiresModerationReason`, restaura
las Skills ocultas por la retención a nivel de usuario y escribe una entrada de registro de auditoría
`user.moderation.lift`. Las Skills ocultas por otros motivos, o cuyo propio análisis estático siga
siendo malicioso, permanecen ocultas.

## Bloqueos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves
pueden dar lugar a bloqueos de cuenta, revocación de tokens, contenido oculto o listados
eliminados.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de la API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la
cuenta. Si el inicio de sesión o el acceso normal por CLI están bloqueados, contacta con
security@openclaw.ai para una revisión de recuperación.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- añade una nota de ClawScan del publicador cuando una publicación tenga un comportamiento inusual pero intencional
- evita comandos de instalación ofuscados
- enlaza a la fuente cuando sea posible
- usa ejecuciones en seco antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento del paquete
