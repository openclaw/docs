---
read_when:
    - Reportar una skill, un plugin o un paquete
    - Recuperarse de una publicación retenida, oculta o bloqueada
    - Comprender la moderación, los bloqueos o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los informes de ClawHub, las retenciones de moderación, los listados ocultos, los baneos y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-03T09:21:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de la cuenta

ClawHub está abierto a la publicación, pero las superficies públicas de descubrimiento e instalación aún
necesitan protecciones. Los informes, las retenciones de moderación, los listados ocultos y las acciones sobre cuentas
ayudan a proteger a los usuarios cuando una versión o cuenta parece insegura, engañosa o fuera
de la política.

Esta página cubre la moderación y el estado de la cuenta. Para etiquetas de auditoría como
`Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulta
[Auditorías de seguridad](/clawhub/security-audits).

Consulta también [Seguridad](/clawhub/security) y
[Uso aceptable](/clawhub/acceptable-usage). Para inquietudes sobre derechos de autor u otros derechos de contenido,
usa [Solicitudes de derechos de contenido](/clawhub/content-rights).

## Informes

Los usuarios con sesión iniciada pueden informar sobre Skills, plugins y paquetes.

Usa los informes de ClawHub solo para contenido inseguro del marketplace, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas registradas
- contenido que infringe el [Uso aceptable](/clawhub/acceptable-usage)

Usa el botón **Informar Skill** en una página de Skill, o el comando/API de informes
de paquetes para paquetes.

No uses los informes de ClawHub para vulnerabilidades en el código fuente propio de un Skill o
plugin de terceros. Infórmalas directamente al editor o al repositorio de origen
enlazado desde el listado. ClawHub no mantiene ni corrige
código de Skills o plugins de terceros.

Los GitHub Security Advisories para `openclaw/clawhub` son para vulnerabilidades en
ClawHub en sí. Los ejemplos incluyen errores en el sitio web, la API, la CLI, el registro, la autenticación,
el escaneo, la moderación o los límites de confianza de descarga/instalación. No uses los advisories de ClawHub
para vulnerabilidades en Skills o plugins de terceros.

Los buenos informes son específicos y accionables. El abuso de los informes puede provocar por sí mismo
acciones sobre la cuenta.

## Reclamaciones de organización y namespace

Las disputas sobre la propiedad de organizaciones, marcas, alcances de paquete, identificadores de propietario o namespaces deben
usar el proceso de [Reclamaciones de organización y namespace](/clawhub/namespace-claims), no el
flujo de informes dentro del producto ni el formulario de apelación de cuenta.

Usa ese proceso cuando necesites que el personal de ClawHub revise pruebas no sensibles de que un
namespace debería reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, asignarse como alias
o revisarse de otro modo. No incluyas secretos, documentos privados, archivos legales privados,
documentos de identidad personales, tokens de API ni tokens de desafío DNS en un
issue público.

## Retenciones de moderación

Algunos hallazgos graves o problemas de política pueden poner a un editor o listado bajo una
retención de moderación. Cuando esto sucede, el contenido afectado puede ocultarse del
descubrimiento público o las publicaciones futuras pueden empezar ocultas hasta que se revise el problema.

Las retenciones de moderación están pensadas para proteger a los usuarios mientras ClawHub resuelve casos
de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no disponible de otro modo en
superficies públicas de instalación.

Si ves uno de estos estados, no instales la versión a menos que el propietario
resuelva el problema o moderación la restaure.

Los propietarios aún pueden ver diagnósticos para sus propios listados retenidos u ocultos. Estos
diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que el
listado pueda volver a las superficies públicas.

## Bloqueos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. El abuso grave puede
derivar en bloqueos de cuenta, revocación de tokens, contenido oculto o listados eliminados.
Las señales de presión por abuso de editores se revisan a diario. Las señales que alcanzan
el umbral de posible bloqueo de ClawHub pueden activar una advertencia automática. Si el siguiente
escaneo elegible después de la fecha límite de advertencia aún coloca al editor en el
umbral de posible bloqueo, ClawHub puede aplicar la acción sobre la cuenta automáticamente.
Las señales de revisión temporal de menor confianza y acotadas quedan fuera de la
aplicación automática.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal por CLI está bloqueado por una cuenta bloqueada o deshabilitada,
usa el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para la revisión de recuperación.

Si un correo electrónico activado por el escáner nombra una versión de Skill o plugin como maliciosa,
descarga los resultados de escaneo almacenados para la versión enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, añade
`--kind plugin`. Revisa la salida del escaneo, corrige el listado, incrementa el número de versión
y sube la versión corregida.

## Guía para editores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén exactos los nombres, resúmenes, etiquetas y changelogs
- declara las variables de entorno y los permisos requeridos
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento de una versión
