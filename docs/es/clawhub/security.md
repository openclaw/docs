---
read_when:
    - Cómo informar de un problema de seguridad de ClawHub
    - Comprender la divulgación de vulnerabilidades de ClawHub
    - Distinguir los problemas de la plataforma ClawHub de los problemas de Skills o plugins de terceros
sidebarTitle: Security
summary: Cómo informar de problemas de seguridad de ClawHub y cuándo se divulgan públicamente las vulnerabilidades.
title: Seguridad
x-i18n:
    generated_at: "2026-07-19T01:49:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad

Los problemas de seguridad de ClawHub pueden notificarse mediante los avisos de seguridad de GitHub para
`openclaw/clawhub`.

Use los avisos de seguridad de GitHub para las vulnerabilidades del propio ClawHub. Los informes de avisos de ClawHub adecuados incluyen errores en:

- el sitio web, la API o la CLI de ClawHub
- la publicación en el registro, las descargas, las instalaciones o la integridad de los artefactos
- la autenticación, la autorización o los tokens de API
- el análisis, la moderación o la gestión de informes

No use los avisos de ClawHub para las vulnerabilidades presentes en el código fuente de una skill o un plugin de terceros. Notifíquelas directamente al publicador o al repositorio de código fuente enlazado desde la ficha de ClawHub.

## Divulgación de vulnerabilidades

Dado que ClawHub es una aplicación alojada en la nube, las vulnerabilidades del servicio ClawHub no se divulgan públicamente de forma predeterminada. Se divulgan públicamente cuando existen pruebas de un impacto real en los usuarios o cuando estos deben tomar medidas.

Entre los ejemplos de impacto real en los usuarios se incluyen la explotación confirmada, la exposición de datos o secretos de los usuarios, la llegada de contenido malicioso a los usuarios debido a un fallo de la plataforma o cualquier problema que obligue a los usuarios a rotar credenciales, actualizar software local o adoptar otras medidas de protección.

Las vulnerabilidades del software instalado por los usuarios se divulgan públicamente, como las de los paquetes, binarios, bibliotecas u otros artefactos de publicación de la CLI de ClawHub que los usuarios deban actualizar localmente.

## Páginas relacionadas

Para obtener información sobre las etiquetas de auditoría durante la instalación, los niveles de riesgo, los hallazgos y su interpretación, consulte [Auditorías de seguridad](/clawhub/security-audits).

Para obtener información sobre los informes del marketplace, las retenciones por moderación, las fichas ocultas, las prohibiciones y el estado de las cuentas, consulte [Moderación y seguridad de las cuentas](/clawhub/moderation).
