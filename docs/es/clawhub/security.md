---
read_when:
    - Comprender los resultados de escaneo y moderación de ClawHub
    - Informar sobre una habilidad o un paquete
    - Recuperación de un listado retenido, oculto o bloqueado
summary: Comportamiento de ClawHub en materia de confianza, escaneo, informes y moderación.
x-i18n:
    generated_at: "2026-05-12T12:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad + Moderación

ClawHub está abierto a la publicación, pero los listados públicos siguen pasando por controles de confianza,
escaneo, denuncias y moderación. El objetivo es práctico: ayudar a los usuarios
a inspeccionar lo que instalan, dar a los publicadores una vía de recuperación ante falsos positivos
y mantener los paquetes abusivos fuera del descubrimiento público.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar una skill o plugin, revisa su listado de ClawHub para ver:

- propietario y atribución de la fuente
- versión más reciente y registro de cambios
- variables de entorno o permisos requeridos
- metadatos de compatibilidad para plugins
- estado de escaneo o moderación
- denuncias, comentarios, estrellas, descargas y señales de instalación donde se muestren

Instala solo contenido que entiendas y en el que confíes.

## Estados de escaneo

ClawHub puede mostrar resultados de escaneo o moderación en páginas públicas y diagnósticos
visibles para el propietario.

Los resultados comunes incluyen:

- `clean`: no se encontró ningún problema bloqueante.
- `suspicious`: la versión requiere cautela o revisión.
- `malicious`: la versión se considera insegura.
- `pending`: las comprobaciones aún no han finalizado.
- `held`, `quarantined`, `revoked` o `hidden`: la versión no está completamente
  disponible en superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una
versión está retenida o bloqueada, los usuarios no deberían instalarla hasta que el propietario resuelva
el problema o la moderación la restaure.

## Skills

Los escaneos de Skills revisan el paquete de skill publicado, los metadatos, los requisitos
declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que una skill declara y
lo que parece hacer. Por ejemplo, una skill que hace referencia a una clave de API requerida
debería declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes
de instalarla.

Los hallazgos de escaneo se basan en artefactos. El comportamiento esperado del proveedor, como las
credenciales de API declaradas, callbacks OAuth de localhost, limpieza de desinstalación con alcance definido, codificación de Basic Auth
o cargas de archivos seleccionadas por el usuario al proveedor indicado, se trata
de forma diferente al reenvío oculto de credenciales, el acceso amplio a archivos privados,
destinos de red no relacionados o el abuso encubierto del navegador.

Consulta [Formato de Skill](/es/clawhub/skill-format).

## Plugins

Las versiones de plugins incluyen metadatos del paquete, atribución de la fuente, campos de compatibilidad
e información de integridad de artefactos.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquetes
también pueden exponer metadatos de resumen para que OpenClaw pueda verificar los
artefactos descargados. ClawScan incluye metadatos de entorno/configuración declarados en `openclaw.environment` del paquete
al revisar versiones de plugins, de modo que los requisitos de ejecución declarados se
comparan con el comportamiento observado.

## Denuncias

Los usuarios con sesión iniciada pueden denunciar skills, paquetes y comentarios.

Las denuncias deben ser específicas y accionables. El abuso de las denuncias puede llevar por sí mismo a
acciones sobre la cuenta.

Ejemplos de denuncias:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

## Notas de ClawScan para publicadores

Los publicadores pueden proporcionar una nota opcional de ClawScan al publicar una skill o
plugin. Esta nota da contexto a ClawScan sobre comportamientos que, de otro modo, podrían parecer
inusuales, como acceso de red, acceso a host nativo o credenciales específicas del
proveedor.

## Retenciones de moderación

Cuando el escáner estático marca una skill subida como maliciosa, el publicador queda
automáticamente bajo una retención de moderación (`requiresModerationAt` establecido en el
usuario). Esto oculta todas las skills del publicador, hace que futuras publicaciones
empiecen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para los moderadores,
pero no ocultan contenido ni deciden por sí solos el veredicto público de escaneo.
Las nuevas subidas permanecen en estado de revisión/pendiente hasta que se resuelve la revisión de LLM. El
escaneo estático solo bloquea de inmediato por firmas maliciosas. Los aciertos del motor de
VirusTotal siguen siendo evidencia de seguridad visible, pero los veredictos de VirusTotal Code Insight/Palm
son orientativos y no ocultan skills por sí solos. Las revisiones de LLM de ClawScan
mantienen notas alineadas con el propósito como guía. Los hallazgos de revisión medios siguen siendo visibles en
el artefacto, mientras que el filtro sospechoso se reserva para preocupaciones de LLM de alto impacto,
hallazgos maliciosos o detecciones corroboradas de motores AV.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto limpia `requiresModerationAt` y `requiresModerationReason`, restaura
las skills ocultas por la retención a nivel de usuario y escribe una entrada de registro de auditoría
`user.moderation.lift`. Las skills ocultas por otros motivos, o cuyo propio escaneo estático sigue siendo
malicioso, permanecen ocultas.

## Bloqueos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. El abuso grave
puede dar lugar a bloqueos de cuenta, revocación de tokens, contenido oculto o listados
eliminados.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el estado
de la cuenta. Si el inicio de sesión o el acceso normal por CLI está bloqueado, contacta con
security@openclaw.ai para una revisión de recuperación.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén exactos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- añade una nota de ClawScan para el publicador cuando una versión tenga un comportamiento inusual pero intencional
- evita comandos de instalación ofuscados
- enlaza a la fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan por el comportamiento del paquete
