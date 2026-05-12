---
read_when:
    - Comprender los resultados del escaneo y la moderación de ClawHub
    - Informar sobre una Skill o un paquete
    - Recuperación de un listado retenido, oculto o bloqueado
summary: Comportamiento de confianza, escaneo, informes y moderación de ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:44:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad + moderación

ClawHub está abierto a la publicación, pero los listados públicos aún pasan por controles de confianza,
análisis, informes y moderación. El objetivo es práctico: ayudar a los usuarios
a inspeccionar lo que instalan, dar a los publicadores una vía de recuperación ante falsos positivos
y mantener los paquetes abusivos fuera del descubrimiento público.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar una skill o un plugin, revisa su listado de ClawHub para ver:

- atribución de propietario y fuente
- versión más reciente y registro de cambios
- variables de entorno o permisos requeridos
- metadatos de compatibilidad para plugins
- estado de análisis o moderación
- informes, comentarios, estrellas, descargas y señales de instalación cuando se muestren

Instala solo contenido que entiendas y en el que confíes.

## Estados de análisis

ClawHub puede mostrar resultados de análisis o moderación en páginas públicas y diagnósticos
visibles para el propietario.

Los resultados comunes incluyen:

- `clean`: no se encontró ningún problema bloqueante.
- `suspicious`: la versión requiere cautela o revisión.
- `malicious`: la versión se considera insegura.
- `pending`: las comprobaciones aún no han terminado.
- `held`, `quarantined`, `revoked` o `hidden`: la versión no está completamente
  disponible en las superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una
versión está retenida o bloqueada, los usuarios no deberían instalarla hasta que el propietario resuelva
el problema o moderación la restaure.

## Skills

Los análisis de Skills revisan el paquete de skill publicado, los metadatos, los requisitos
declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que declara una skill y
lo que parece hacer. Por ejemplo, una skill que referencia una clave de API requerida
debería declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes de
instalarla.

Los hallazgos de análisis se basan en artefactos. El comportamiento esperado del proveedor, como credenciales
de API declaradas, callbacks OAuth de localhost, limpieza de desinstalación acotada, codificación de Basic Auth
o cargas de archivos seleccionadas por el usuario al proveedor indicado, se trata
de forma distinta al reenvío oculto de credenciales, el acceso amplio a archivos privados,
destinos de red no relacionados o el abuso sigiloso del navegador.

Consulta [Formato de Skill](/es/clawhub/skill-format).

## Plugins

Las versiones de plugins incluyen metadatos del paquete, atribución de fuente, campos
de compatibilidad e información de integridad del artefacto.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquetes
también pueden exponer metadatos de resumen para que OpenClaw pueda verificar los
artefactos descargados. ClawScan incluye metadatos de entorno/configuración `openclaw.environment` declarados
en el paquete al revisar versiones de plugins, de modo que los requisitos de ejecución declarados se
comparan con el comportamiento observado.

## Informes

Los usuarios con sesión iniciada pueden reportar Skills, paquetes y comentarios.

Los informes deben ser específicos y accionables. El abuso de los informes puede dar lugar
a medidas sobre la cuenta.

Ejemplos de informes:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

## Notas de ClawScan del publicador

Los publicadores pueden proporcionar una nota opcional de ClawScan al publicar una skill o
un plugin. Esta nota da a ClawScan contexto sobre comportamientos que, de otro modo, podrían parecer
inusuales, como acceso de red, acceso al host nativo o credenciales específicas
del proveedor.

## Retenciones de moderación

Cuando el analizador estático marca una skill cargada como maliciosa, el publicador queda
automáticamente sujeto a una retención de moderación (`requiresModerationAt` establecido en el
usuario). Esto oculta todas las Skills del publicador, hace que las publicaciones futuras
comiencen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para los moderadores,
pero no ocultan contenido ni deciden por sí solos el veredicto público del análisis.
Las nuevas cargas permanecen en estado de revisión/pendiente hasta que se resuelve la revisión del LLM. El análisis
estático solo bloquea de inmediato las firmas maliciosas. Los aciertos del motor de
VirusTotal siguen siendo evidencia de seguridad visible, pero los veredictos de VirusTotal Code Insight/Palm
son orientativos y no ocultan Skills por sí solos. Las revisiones LLM de ClawScan
mantienen las notas alineadas con el propósito como guía. Los hallazgos de revisión medios siguen visibles en
el artefacto, mientras que el filtro sospechoso se reserva para inquietudes LLM
de alto impacto, hallazgos maliciosos o detecciones corroboradas por motores AV.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto borra `requiresModerationAt` y `requiresModerationReason`, restaura
las Skills ocultas por la retención a nivel de usuario y escribe una entrada de registro de auditoría
`user.moderation.lift`. Las Skills ocultas por otros motivos, o cuyo propio análisis estático siga siendo
malicioso, permanecen ocultas.

## Bloqueos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves
pueden dar lugar a bloqueos de cuenta, revocación de tokens, contenido oculto o listados
eliminados.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de CLI
empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal de CLI está bloqueado, contacta con
security@openclaw.ai para una revisión de recuperación.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- añade una nota de ClawScan del publicador cuando una versión tenga un comportamiento inusual pero intencional
- evita comandos de instalación ofuscados
- enlaza a la fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento del paquete
