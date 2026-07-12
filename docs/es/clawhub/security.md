---
read_when:
    - Informar de un problema de seguridad de ClawHub
    - Cómo comprender la divulgación de vulnerabilidades de ClawHub
    - Distinción entre problemas de la plataforma ClawHub y problemas de Skills o Plugins de terceros
sidebarTitle: Security
summary: Cómo informar sobre problemas de seguridad de ClawHub y cuándo se divulgan públicamente las vulnerabilidades.
title: Seguridad
x-i18n:
    generated_at: "2026-07-11T22:57:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad

Los problemas de seguridad de ClawHub se pueden informar mediante los avisos de seguridad de GitHub para
`openclaw/clawhub`.

Utilice los avisos de seguridad de GitHub para las vulnerabilidades del propio ClawHub. Los informes de avisos de
ClawHub adecuados incluyen errores en:

- el sitio web, la API o la CLI de ClawHub
- la publicación en el registro, las descargas, las instalaciones o la integridad de los artefactos
- la autenticación, la autorización o los tokens de API
- el análisis, la moderación o la gestión de informes

No utilice los avisos de ClawHub para vulnerabilidades en el código fuente propio de una Skill o un
plugin de terceros. Infórmelas directamente al editor o al repositorio de
código fuente enlazado desde la ficha de ClawHub.

## Divulgación de vulnerabilidades

Dado que ClawHub es una aplicación alojada en la nube, las vulnerabilidades del servicio
ClawHub no se divulgan públicamente de forma predeterminada. Se divulgan públicamente cuando existen
pruebas de un impacto real en los usuarios o cuando estos deben tomar medidas.

Entre los ejemplos de impacto real en los usuarios se incluyen la explotación confirmada, la exposición de datos
o secretos de los usuarios, la llegada de contenido malicioso a los usuarios debido a un fallo de la plataforma
o cualquier problema que exija a los usuarios rotar credenciales, actualizar el software local o
tomar otras medidas de protección.

Las vulnerabilidades del software instalado por el usuario se divulgan públicamente, como las de
paquetes de la CLI de ClawHub, archivos binarios, bibliotecas u otros artefactos de versiones que los usuarios
deban actualizar localmente.

## Páginas relacionadas

Para obtener información sobre las etiquetas de auditoría durante la instalación, los niveles de riesgo, los hallazgos y su interpretación, consulte
[Auditorías de seguridad](/clawhub/security-audits).

Para obtener información sobre informes del mercado, retenciones por moderación, fichas ocultas, prohibiciones y el
estado de las cuentas, consulte [Moderación y seguridad de las cuentas](/es/clawhub/moderation).
