---
read_when:
    - Comprender los resultados del escaneo y la moderación de ClawHub
    - Informar sobre una Skill o un paquete
    - Recuperación de un listado retenido, oculto o bloqueado
summary: Comportamiento de confianza, escaneo, denuncias, apelaciones y moderación de ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad y moderación

ClawHub está abierto a la publicación, pero los listados públicos siguen pasando por controles de confianza,
escaneo, reportes y moderación. El objetivo es práctico: ayudar a los usuarios
a inspeccionar lo que instalan, dar a los publicadores una vía de recuperación ante falsos positivos
y mantener los paquetes abusivos fuera de la detección pública.

Consulta también [Uso aceptable](/es/clawhub/acceptable-usage).

## Qué pueden inspeccionar los usuarios

Antes de instalar un skill o plugin, revisa su listado de ClawHub para ver:

- atribución de propietario y fuente
- versión más reciente y registro de cambios
- variables de entorno o permisos requeridos
- metadatos de compatibilidad para plugins
- estado de escaneo o moderación
- reportes, comentarios, estrellas, descargas y señales de instalación cuando se muestren

Instala solo contenido que entiendas y en el que confíes.

## Estados de escaneo

ClawHub puede mostrar resultados de escaneo o moderación en páginas públicas y diagnósticos
visibles para el propietario.

Los resultados comunes incluyen:

- `clean`: no se encontró ningún problema bloqueante.
- `suspicious`: la versión requiere precaución o revisión.
- `malicious`: la versión se considera insegura.
- `pending`: las comprobaciones aún no han finalizado.
- `held`, `quarantined`, `revoked` o `hidden`: la versión no está completamente
  disponible en superficies públicas de instalación.

La redacción exacta puede variar según la superficie, pero el significado práctico es el mismo: si una
versión está retenida o bloqueada, los usuarios no deberían instalarla hasta que el propietario resuelva
el problema o moderación la restaure.

## Skills

Los escaneos de Skills examinan el paquete de skill publicado, los metadatos, los requisitos
declarados y las instrucciones sospechosas.

ClawHub presta especial atención a las discrepancias entre lo que declara un skill y
lo que parece hacer. Por ejemplo, un skill que referencia una clave de API requerida
debería declarar ese requisito en `SKILL.md` para que los usuarios puedan verlo antes de
instalarlo.

Los hallazgos de escaneo se basan en artefactos. El comportamiento esperado del proveedor, como
credenciales de API declaradas, callbacks OAuth en localhost, limpieza de desinstalación acotada, codificación de Basic Auth
o cargas de archivos seleccionados por el usuario al proveedor indicado, se trata
de forma distinta a la redirección oculta de credenciales, el acceso amplio a archivos privados,
destinos de red no relacionados o el abuso encubierto del navegador.

Consulta [Formato de Skill](/es/clawhub/skill-format).

## Plugins

Las versiones de Plugins incluyen metadatos del paquete, atribución de fuente, campos de compatibilidad
e información de integridad del artefacto.

OpenClaw comprueba la compatibilidad antes de instalar plugins alojados en ClawHub. Los registros de paquetes
también pueden exponer metadatos de digest para que OpenClaw pueda verificar los artefactos
descargados. ClawScan incluye metadatos env/config declarados en `openclaw.environment` del paquete
al revisar versiones de plugins, de modo que los requisitos de runtime declarados se
comparan con el comportamiento observado.

## Reportes

Los usuarios con sesión iniciada pueden reportar Skills, paquetes y comentarios.

Los reportes deben ser específicos y accionables. El abuso de los reportes puede derivar también en
acciones sobre la cuenta.

Ejemplos de reportes:

- metadatos engañosos
- requisitos de credenciales o permisos no declarados
- instrucciones de instalación sospechosas
- comentarios fraudulentos o suplantación
- registros de mala fe o uso indebido de marcas registradas
- contenido que infringe [Uso aceptable](/es/clawhub/acceptable-usage)

## Reportes de mala fe o marcas registradas

ClawHub usa el mismo canal de reportes y moderación del equipo para registros de mala fe,
suplantación y disputas relacionadas con marcas registradas. Estos reportes necesitan
suficiente contexto para que el equipo identifique al reclamante, el listado disputado y
la acción solicitada.

Incluye:

- la URL canónica del skill o paquete de ClawHub y el identificador del propietario
- la marca registrada, proyecto, empresa o nombre de producto en cuestión
- evidencia pública de la propiedad o autoridad del reclamante
- por qué el propietario actual no está autorizado a publicar con ese nombre
- la acción solicitada, como ocultar pendiente de revisión, transferir la propiedad, renombrar
  o eliminar

No incluyas secretos privados ni documentos legales sensibles en reportes públicos. Abre
un issue de GitHub con evidencia no sensible y pide a los mantenedores una vía privada
de traspaso cuando sea necesario.

## Apelaciones y nuevos escaneos

Los propietarios pueden solicitar un nuevo escaneo cuando crean que un skill o paquete fue retenido
o marcado incorrectamente. Los moderadores y administradores de la plataforma pueden solicitar nuevos escaneos para cualquier
skill o paquete mientras gestionan reportes o solicitudes de soporte:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Para contenido moderado, los propietarios pueden poder enviar una apelación desde las superficies de ClawHub
visibles para el propietario. Las apelaciones deben explicar qué cambió o por qué la
marca es incorrecta.

## Retenciones de moderación

Cuando el escáner estático marca un skill subido como malicioso, el publicador queda
automáticamente bajo una retención de moderación (`requiresModerationAt` configurado en el
usuario). Esto oculta todos los Skills del publicador, hace que las publicaciones futuras
empiecen ocultas y crea una entrada de registro de auditoría `user.moderation.auto`.

Los hallazgos estáticos sospechosos se conservan como evidencia de archivo/línea para los moderadores,
pero no ocultan contenido ni deciden por sí solos el veredicto de escaneo público.
Las nuevas subidas permanecen en estado de revisión/pendiente hasta que la revisión LLM se resuelve. El escaneo
estático solo bloquea inmediatamente firmas maliciosas. Las coincidencias del motor de VirusTotal
siguen visibles como evidencia de seguridad, pero los veredictos de VirusTotal Code Insight/Palm
son orientativos y no ocultan Skills por sí solos. Las revisiones LLM de ClawScan
mantienen notas alineadas con el propósito como orientación. Los hallazgos de revisión medios permanecen visibles en
el artefacto, mientras que el filtro sospechoso se reserva para preocupaciones LLM de alto impacto,
hallazgos maliciosos o detecciones corroboradas por motores AV.

Los administradores pueden levantar una retención por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Esto limpia `requiresModerationAt` y `requiresModerationReason`, restaura
los Skills ocultos por la retención a nivel de usuario y escribe una entrada de registro de auditoría
`user.moderation.lift`. Los Skills ocultos por otros motivos, o cuyo propio escaneo estático siga
siendo malicioso, permanecen ocultos.

## Bloqueos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves
pueden resultar en bloqueos de cuenta, revocación de tokens, contenido oculto o listados
eliminados.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta
o contacta con los mantenedores mediante el canal de soporte esperado del proyecto.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- evita comandos de instalación ofuscados
- enlaza a la fuente cuando sea posible
- usa simulacros antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento del paquete
