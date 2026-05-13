---
read_when:
    - Comprender los resultados del escaneo y la moderación de ClawHub
    - Reportar un skill o paquete
    - Recuperación de un listado retenido, oculto o bloqueado
summary: Comportamiento de confianza, escaneo, informes y moderación de ClawHub.
x-i18n:
    generated_at: "2026-05-13T02:51:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad + moderación

ClawHub está abierto a publicaciones, pero las fichas públicas siguen pasando por controles de confianza,
análisis, informes y moderación. El objetivo es práctico: ayudar a los usuarios
a inspeccionar lo que instalan, dar a los publicadores una vía de recuperación ante falsos positivos
y mantener los paquetes abusivos fuera del descubrimiento público.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar un skill o plugin, revisa su ficha de ClawHub para ver:

- atribución del propietario y la fuente
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
- `pending`: las comprobaciones aún no han finalizado.
- `held`, `quarantined`, `revoked` o `hidden`: la versión no está completamente
  disponible en superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una
versión está retenida o bloqueada, los usuarios no deberían instalarla hasta que el propietario resuelva
el problema o moderación la restaure.

## Skills

Los análisis de skills examinan el paquete de skill publicado, los metadatos, los requisitos
declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que declara un skill y
lo que parece hacer. Por ejemplo, un skill que referencia una clave de API requerida
debería declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes de
instalarlo.

Los hallazgos de análisis se basan en artefactos. El comportamiento esperado del proveedor, como credenciales
de API declaradas, callbacks de OAuth en localhost, limpieza de desinstalación con alcance limitado, codificación de Basic Auth
o cargas de archivos seleccionadas por el usuario al proveedor indicado, se trata
de forma distinta al reenvío oculto de credenciales, el acceso amplio a archivos privados,
destinos de red no relacionados o el abuso encubierto del navegador.

Consulta [Formato de skill](/es/clawhub/skill-format).

## Plugins

Las versiones de plugins incluyen metadatos del paquete, atribución de la fuente, campos
de compatibilidad e información de integridad de artefactos.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquetes
también pueden exponer metadatos de digest para que OpenClaw pueda verificar los artefactos
descargados. ClawScan incluye los metadatos declarados de env/config de paquete `openclaw.environment`
al revisar versiones de plugins, de modo que los requisitos de runtime declarados se
comparan con el comportamiento observado.

## Informes

Los usuarios con sesión iniciada pueden denunciar skills, paquetes y comentarios.

Los informes deben ser específicos y accionables. El abuso del sistema de informes puede llevar por sí mismo a
medidas sobre la cuenta.

Ejemplos de informes:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

## Notas de ClawScan del publicador

Los publicadores pueden proporcionar una nota opcional para ClawScan al publicar un skill o
plugin. Esta nota da a ClawScan contexto sobre comportamientos que de otro modo podrían parecer
inusuales, como acceso a la red, acceso a hosts nativos o credenciales específicas
del proveedor.

## Retenciones de moderación

Cuando el analizador estático marca un skill cargado como malicioso, el publicador queda
automáticamente sujeto a una retención de moderación (`requiresModerationAt` establecido en el
usuario). Esto oculta todos los skills del publicador, hace que las publicaciones futuras
comiencen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para moderadores,
pero por sí solos no ocultan contenido ni deciden el veredicto público del análisis.
Las nuevas cargas permanecen en estado de revisión/pendiente hasta que se resuelve la revisión del LLM. El análisis
estático solo bloquea de inmediato por firmas maliciosas. Las coincidencias de motores de
VirusTotal siguen siendo evidencia de seguridad visible, pero los veredictos de VirusTotal Code Insight/Palm
son consultivos y no ocultan skills por sí solos. Las revisiones de ClawScan con LLM
mantienen notas alineadas con el propósito como orientación. Los hallazgos de revisión medios siguen siendo visibles en
el artefacto, mientras que el filtro sospechoso se reserva para inquietudes de alto impacto del LLM,
hallazgos maliciosos o detecciones corroboradas de motores AV.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto limpia `requiresModerationAt` y `requiresModerationReason`, restaura los
skills ocultos por la retención de nivel de usuario y escribe una entrada de registro de auditoría
`user.moderation.lift`. Los skills ocultos por otros motivos, o cuyo propio análisis estático sigue siendo
malicioso, permanecen ocultos.

## Bloqueos y estado de la cuenta

Las cuentas que infringen la política de ClawHub pueden perder acceso de publicación. El abuso grave
puede resultar en bloqueos de cuenta, revocación de tokens, contenido oculto o fichas
eliminadas.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de la API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una medida sobre la cuenta, inicia sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal de la CLI está bloqueado, contacta con
security@openclaw.ai para una revisión de recuperación.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- añade una nota de ClawScan del publicador cuando una versión tenga un comportamiento inusual pero intencional
- evita comandos de instalación ofuscados
- enlaza a la fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan por el comportamiento del paquete
