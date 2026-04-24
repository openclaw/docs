---
read_when:
    - Quieres memoria persistente que funcione entre sesiones y canales
    - Quieres recuperación y modelado de usuario impulsados por IA
summary: Memoria nativa de IA entre sesiones mediante el Plugin Honcho
title: Memoria Honcho
x-i18n:
    generated_at: "2026-04-24T05:25:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
---

[Honcho](https://honcho.dev) agrega memoria nativa de IA a OpenClaw. Conserva
las conversaciones en un servicio dedicado y construye modelos de usuario y agente con el tiempo,
dando a tu agente contexto entre sesiones que va más allá de los archivos Markdown
del espacio de trabajo.

## Qué proporciona

- **Memoria entre sesiones** -- las conversaciones se conservan después de cada turno, por lo que
  el contexto se mantiene entre restablecimientos de sesión, Compaction y cambios de canal.
- **Modelado de usuario** -- Honcho mantiene un perfil para cada usuario (preferencias,
  hechos, estilo de comunicación) y para el agente (personalidad, comportamientos
  aprendidos).
- **Búsqueda semántica** -- búsqueda sobre observaciones de conversaciones pasadas, no
  solo sobre la sesión actual.
- **Conciencia de múltiples agentes** -- los agentes padre rastrean automáticamente los
  subagentes generados, y los padres se agregan como observadores en las sesiones hijas.

## Herramientas disponibles

Honcho registra herramientas que el agente puede usar durante la conversación:

**Recuperación de datos (rápida, sin llamada al LLM):**

| Herramienta | Qué hace |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context` | Representación completa del usuario entre sesiones |
| `honcho_search_conclusions` | Búsqueda semántica sobre conclusiones almacenadas |
| `honcho_search_messages` | Buscar mensajes entre sesiones (filtrar por remitente, fecha) |
| `honcho_session` | Historial y resumen de la sesión actual |

**Preguntas y respuestas (impulsado por LLM):**

| Herramienta | Qué hace |
| ------------ | ------------------------------------------------------------------------- |
| `honcho_ask` | Hacer preguntas sobre el usuario. `depth='quick'` para hechos, `'thorough'` para síntesis |

## Primeros pasos

Instala el Plugin y ejecuta la configuración:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

El comando de configuración solicita tus credenciales de API, escribe la configuración y
opcionalmente migra archivos de memoria existentes del espacio de trabajo.

<Info>
Honcho puede ejecutarse completamente en local (autoalojado) o mediante la API gestionada en
`api.honcho.dev`. No se requieren dependencias externas para la opción
autoalojada.
</Info>

## Configuración

Los ajustes viven bajo `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Para instancias autoalojadas, apunta `baseUrl` a tu servidor local (por ejemplo
`http://localhost:8000`) y omite la clave API.

## Migrar memoria existente

Si tienes archivos de memoria existentes del espacio de trabajo (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` los detecta y
ofrece migrarlos.

<Info>
La migración no es destructiva -- los archivos se cargan en Honcho. Los originales
nunca se eliminan ni se mueven.
</Info>

## Cómo funciona

Después de cada turno de IA, la conversación se conserva en Honcho. Tanto los mensajes del usuario como los
del agente se observan, lo que permite a Honcho construir y perfeccionar sus modelos con el tiempo.

Durante la conversación, las herramientas de Honcho consultan el servicio en la fase `before_prompt_build`,
inyectando contexto relevante antes de que el modelo vea el prompt. Esto garantiza
límites de turno precisos y una recuperación relevante.

## Honcho frente a la memoria integrada

|                   | Integrada / QMD              | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Almacenamiento** | Archivos Markdown del espacio de trabajo | Servicio dedicado (local o alojado) |
| **Entre sesiones** | Mediante archivos de memoria | Automático, integrado               |
| **Modelado de usuario** | Manual (escribir en `MEMORY.md`) | Perfiles automáticos                |
| **Búsqueda** | Vector + palabra clave (híbrida) | Semántica sobre observaciones       |
| **Múltiples agentes** | Sin seguimiento             | Conciencia padre/hijo               |
| **Dependencias** | Ninguna (integrada) o binario QMD | Instalación de Plugin               |

Honcho y el sistema de memoria integrado pueden funcionar juntos. Cuando QMD está configurado,
se habilitan herramientas adicionales para buscar en archivos Markdown locales junto con la
memoria entre sesiones de Honcho.

## Comandos CLI

```bash
openclaw honcho setup                        # Configurar clave API y migrar archivos
openclaw honcho status                       # Comprobar estado de conexión
openclaw honcho ask <question>               # Consultar a Honcho sobre el usuario
openclaw honcho search <query> [-k N] [-d D] # Búsqueda semántica sobre la memoria
```

## Más información

- [Código fuente del Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentación de Honcho](https://docs.honcho.dev)
- [Guía de integración de Honcho con OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/es/concepts/memory) -- resumen de memoria de OpenClaw
- [Context Engines](/es/concepts/context-engine) -- cómo funcionan los motores de contexto del Plugin

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Motor de memoria QMD](/es/concepts/memory-qmd)
