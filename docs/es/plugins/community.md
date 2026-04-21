---
read_when:
    - Quieres encontrar plugins de terceros para OpenClaw
    - Quieres publicar o incluir tu propio Plugin
summary: 'Plugins de OpenClaw mantenidos por la comunidad: explora, instala y envía el tuyo'
title: Plugins de la comunidad
x-i18n:
    generated_at: "2026-04-21T05:16:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugins de la comunidad

Los plugins de la comunidad son paquetes de terceros que amplían OpenClaw con
nuevos canales, tools, proveedores u otras capacidades. Son creados y mantenidos
por la comunidad, publicados en [ClawHub](/es/tools/clawhub) o npm, e
instalables con un solo comando.

ClawHub es la superficie canónica de descubrimiento para plugins de la comunidad. No abras
PRs solo de documentación solo para agregar aquí tu Plugin por visibilidad; publícalo en
ClawHub en su lugar.

```bash
openclaw plugins install <package-name>
```

OpenClaw comprueba primero ClawHub y recurre a npm automáticamente.

## Plugins incluidos

### Apify

Extrae datos de cualquier sitio web con más de 20.000 extractores listos para usar. Deja que tu agente
extraiga datos de Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sitios de comercio electrónico y más, con solo pedirlo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Puente independiente de OpenClaw para conversaciones de Codex App Server. Vincula un chat a
un hilo de Codex, habla con él usando texto sin formato y contrólalo con comandos
nativos del chat para reanudación, planificación, revisión, selección de modelo,
Compaction y más.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integración de robot empresarial usando modo Stream. Admite texto, imágenes y
mensajes de archivo mediante cualquier cliente de DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gestión de contexto sin pérdidas para OpenClaw. Resumen de conversaciones
basado en DAG con Compaction incremental: preserva toda la fidelidad del contexto
mientras reduce el uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta trazas del agente a Opik. Supervisa el comportamiento del agente,
coste, tokens, errores y más.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dale a tu agente de OpenClaw un avatar Live2D con sincronización labial en tiempo real,
expresiones emocionales y conversión de texto a voz. Incluye tools para creadores para generación de recursos con IA
y despliegue con un clic en Prometheus Marketplace. Actualmente está en alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecta OpenClaw a QQ mediante la API de QQ Bot. Admite chats privados, menciones
en grupos, mensajes de canal y contenido multimedia enriquecido, incluidos voz, imágenes, videos
y archivos.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw del equipo de Tencent WeCom. Impulsado por
conexiones persistentes WebSocket de WeCom Bot, admite mensajes directos y chats
de grupo, respuestas en streaming, mensajería proactiva, procesamiento de imágenes/archivos, formato
Markdown, control de acceso integrado y Skills de documentos/reuniones/mensajería.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Envía tu Plugin

Damos la bienvenida a plugins de la comunidad que sean útiles, estén documentados y sean seguros de operar.

<Steps>
  <Step title="Publica en ClawHub o npm">
    Tu Plugin debe poder instalarse mediante `openclaw plugins install \<package-name\>`.
    Publícalo en [ClawHub](/es/tools/clawhub) (preferido) o en npm.
    Consulta [Crear Plugins](/es/plugins/building-plugins) para ver la guía completa.

  </Step>

  <Step title="Alojalo en GitHub">
    El código fuente debe estar en un repositorio público con documentación de configuración y un
    rastreador de incidencias.

  </Step>

  <Step title="Usa PRs de documentación solo para cambios en la documentación fuente">
    No necesitas un PR de documentación solo para que tu Plugin sea visible. Publícalo
    en ClawHub en su lugar.

    Abre un PR de documentación solo cuando la documentación fuente de OpenClaw necesite un cambio
    real de contenido, como corregir la guía de instalación o agregar
    documentación entre repositorios que pertenezca al conjunto principal de documentación.

  </Step>
</Steps>

## Criterio de calidad

| Requisito                  | Motivo                                          |
| -------------------------- | ----------------------------------------------- |
| Publicado en ClawHub o npm | Los usuarios necesitan que `openclaw plugins install` funcione |
| Repositorio público en GitHub | Revisión del código fuente, seguimiento de incidencias, transparencia |
| Documentación de configuración y uso | Los usuarios necesitan saber cómo configurarlo |
| Mantenimiento activo       | Actualizaciones recientes o gestión receptiva de incidencias |

Los envoltorios de bajo esfuerzo, la propiedad poco clara o los paquetes sin mantenimiento pueden ser rechazados.

## Relacionado

- [Instalar y configurar Plugins](/es/tools/plugin) — cómo instalar cualquier Plugin
- [Crear Plugins](/es/plugins/building-plugins) — crea el tuyo
- [Manifest de Plugin](/es/plugins/manifest) — esquema del manifest
