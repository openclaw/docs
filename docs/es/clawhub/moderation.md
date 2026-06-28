---
read_when:
    - Informar sobre una skill, plugin o paquete
    - Recuperación de un listado retenido, oculto o bloqueado
    - Comprender la moderación, los baneos o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los informes de ClawHub, las retenciones de moderación, los listados ocultos, las prohibiciones y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-06-28T05:07:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de la cuenta

ClawHub está abierto a la publicación, pero las superficies de descubrimiento público e instalación aún
necesitan barreras de protección. Los reportes, las retenciones de moderación, las fichas ocultas y las acciones de cuenta
ayudan a proteger a los usuarios cuando un lanzamiento o una cuenta parece inseguro, engañoso o fuera
de política.

Esta página cubre la moderación y el estado de la cuenta. Para etiquetas de auditoría como
`Pass`, `Review`, `Warn`, `Malicious` y nivel de riesgo, consulta
[Auditorías de seguridad](/es/clawhub/security-audits).

Consulta también [Seguridad](/es/clawhub/security) y
[Uso aceptable](/es/clawhub/acceptable-usage). Para inquietudes sobre derechos de autor u otros
derechos de contenido, usa [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Reportes

Los usuarios con sesión iniciada pueden reportar habilidades, plugins y paquetes.

Usa los reportes de ClawHub solo para contenido inseguro del marketplace, como:

- fichas maliciosas
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infrinja el [Uso aceptable](/es/clawhub/acceptable-usage)

Usa el botón **Reportar habilidad** en una página de habilidad, o el
comando/API de reporte de paquetes para paquetes.

No uses los reportes de ClawHub para vulnerabilidades en el código fuente propio
de una habilidad o plugin de terceros. Repórtalas directamente al publicador o al
repositorio fuente enlazado desde la ficha. ClawHub no mantiene ni parchea
código de habilidades o plugins de terceros.

Los avisos de seguridad de GitHub para `openclaw/clawhub` son para vulnerabilidades en
ClawHub mismo. Los ejemplos incluyen errores en el sitio web, la API, la CLI, el registro, la autenticación,
el escaneo, la moderación o los límites de confianza de descarga/instalación. No uses los avisos de
ClawHub para vulnerabilidades en habilidades o plugins de terceros.

Los buenos reportes son específicos y accionables. El abuso del sistema de reportes puede llevar por sí mismo a
acciones de cuenta.

## Reclamaciones de organización y espacio de nombres

Las disputas de propiedad sobre organizaciones, marcas, ámbitos de paquete, identificadores de propietario o espacios de nombres deberían
usar el proceso de [Reclamaciones de organización y espacio de nombres](/es/clawhub/namespace-claims), no el
flujo de reporte dentro del producto ni el formulario de apelación de cuenta.

Usa ese proceso cuando necesites que el personal de ClawHub revise pruebas no sensibles de que un
espacio de nombres debería reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias
o revisarse de otro modo. No incluyas secretos, documentos privados, archivos legales privados,
documentos de identidad personal, tokens de API ni tokens de desafío DNS en un
issue público.

## Retenciones de moderación

Algunos hallazgos graves o problemas de política pueden poner a un publicador o una ficha bajo una
retención de moderación. Cuando esto ocurre, el contenido afectado puede quedar oculto del descubrimiento
público, o las publicaciones futuras pueden comenzar ocultas hasta que se revise el problema.

Las retenciones de moderación están pensadas para proteger a los usuarios mientras ClawHub resuelve casos de alto riesgo.
También pueden levantarse cuando se confirma un falso positivo.

## Fichas ocultas o bloqueadas

Una ficha puede estar retenida, oculta, en cuarentena, revocada o no disponible de otra manera en
superficies públicas de instalación.

Si ves uno de estos estados, no instales el lanzamiento a menos que el propietario
resuelva el problema o moderación lo restaure.

Los propietarios aún pueden ver diagnósticos de sus propias fichas retenidas u ocultas. Estos
diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que la
ficha pueda volver a las superficies públicas.

## Prohibiciones y estado de cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. El abuso grave puede
resultar en prohibiciones de cuenta, revocación de tokens, contenido oculto o fichas eliminadas.
Las señales de presión por abuso de publicadores se revisan a diario. Las señales que alcanzan
el umbral de posible prohibición de ClawHub pueden activar una advertencia automática. Si el siguiente
escaneo elegible después del plazo de la advertencia aún coloca al publicador en el
umbral de posible prohibición, ClawHub puede aplicar la acción de cuenta automáticamente.
Las señales de revisión temporal acotadas y de menor confianza quedan fuera de la
aplicación automática.

Las cuentas eliminadas, prohibidas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una acción de cuenta, inicia sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal a la CLI está bloqueado por una prohibición o una cuenta deshabilitada,
usa el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para la revisión de recuperación.

Si un correo electrónico activado por el escáner nombra una versión de habilidad o plugin como maliciosa,
descarga los resultados de escaneo almacenados para la versión enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, agrega
`--kind plugin`. Revisa la salida del escaneo, corrige la ficha, incrementa el número de versión
y sube la versión corregida.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza del usuario:

- mantén nombres, resúmenes, etiquetas y registros de cambios precisos
- declara las variables de entorno y permisos requeridos
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento de un lanzamiento
