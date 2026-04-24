---
read_when:
    - Quieres encontrar Plugins de OpenClaw de terceros
    - Quieres publicar o listar tu propio Plugin
summary: 'Plugins de OpenClaw mantenidos por la comunidad: explorar, instalar y enviar el tuyo propio'
title: Plugins de la comunidad
x-i18n:
    generated_at: "2026-04-24T05:39:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Los Plugins de la comunidad son paquetes de terceros que amplían OpenClaw con nuevos
canales, herramientas, proveedores u otras capacidades. Están creados y mantenidos
por la comunidad, publicados en [ClawHub](/es/tools/clawhub) o npm, e
instalables con un solo comando.

ClawHub es la superficie canónica de descubrimiento para los Plugins de la comunidad. No abras
PR solo de documentación solo para añadir aquí tu Plugin con fines de descubrimiento; publícalo en
ClawHub en su lugar.

```bash
openclaw plugins install <package-name>
```

OpenClaw comprueba primero ClawHub y recurre automáticamente a npm.

## Plugins listados

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
un hilo de Codex, habla con él en texto plano y contrólalo con comandos nativos de chat para reanudar, planificar, revisar, seleccionar modelo, Compaction y más.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integración de robot empresarial usando el modo Stream. Admite texto, imágenes y
mensajes de archivo mediante cualquier cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de Gestión de Contexto sin pérdida para OpenClaw. Resumización de conversaciones basada en DAG
con Compaction incremental: preserva la fidelidad completa del contexto
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

Da a tu agente OpenClaw un avatar Live2D con sincronización labial en tiempo real, expresiones
emocionales y texto a voz. Incluye herramientas de creación para generación de activos con IA
y despliegue con un clic en el Marketplace de Prometheus. Actualmente en alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecta OpenClaw con QQ mediante la API de QQ Bot. Admite chats privados, menciones
de grupo, mensajes de canal y multimedia enriquecida, incluidos voz, imágenes, videos
y archivos.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw del equipo Tencent WeCom. Impulsado por
conexiones persistentes WebSocket de WeCom Bot, admite mensajes directos y chats
grupales, respuestas en streaming, mensajería proactiva, procesamiento de imágenes/archivos, formato
Markdown, control de acceso integrado y Skills de documentos/reuniones/mensajería.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Envía tu Plugin

Damos la bienvenida a Plugins de la comunidad que sean útiles, estén documentados y sean seguros de operar.

<Steps>
  <Step title="Publica en ClawHub o npm">
    Tu Plugin debe poder instalarse mediante `openclaw plugins install \<package-name\>`.
    Publícalo en [ClawHub](/es/tools/clawhub) (preferido) o npm.
    Consulta [Crear Plugins](/es/plugins/building-plugins) para la guía completa.

  </Step>

  <Step title="Aloja en GitHub">
    El código fuente debe estar en un repositorio público con documentación de configuración y un
    rastreador de incidencias.

  </Step>

  <Step title="Usa PR de documentación solo para cambios en la documentación fuente">
    No necesitas un PR de documentación solo para hacer tu Plugin visible. Publícalo
    en ClawHub en su lugar.

    Abre un PR de documentación solo cuando la documentación fuente de OpenClaw necesite un cambio
    real de contenido, como corregir la guía de instalación o añadir documentación
    entre repositorios que pertenezca al conjunto principal de documentación.

  </Step>
</Steps>

## Umbral de calidad

| Requisito                  | Por qué                                          |
| -------------------------- | ------------------------------------------------ |
| Publicado en ClawHub o npm | Los usuarios necesitan que `openclaw plugins install` funcione |
| Repositorio público de GitHub | Revisión del código fuente, seguimiento de incidencias, transparencia |
| Documentación de configuración y uso | Los usuarios necesitan saber cómo configurarlo |
| Mantenimiento activo       | Actualizaciones recientes o atención receptiva a incidencias |

Los contenedores de bajo esfuerzo, propiedad poco clara o paquetes sin mantenimiento pueden ser rechazados.

## Relacionado

- [Instalar y configurar Plugins](/es/tools/plugin) — cómo instalar cualquier Plugin
- [Crear Plugins](/es/plugins/building-plugins) — crea el tuyo propio
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema del manifiesto
