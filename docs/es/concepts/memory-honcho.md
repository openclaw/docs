---
read_when:
    - Quieres memoria persistente que funcione entre sesiones y canales
    - Quieres recuperación de memoria y modelado de usuario con IA
summary: Memoria entre sesiones nativa de IA mediante el plugin Honcho
title: Memoria de Honcho
x-i18n:
    generated_at: "2026-07-05T11:12:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) añade memoria nativa de IA a OpenClaw mediante un
Plugin externo. Persiste las conversaciones en un servicio dedicado y crea
modelos de usuario y agente con el tiempo, lo que da a tu agente contexto entre
sesiones que va más allá de los archivos Markdown del espacio de trabajo.

## Qué proporciona

- **Memoria entre sesiones** - las conversaciones persisten después de cada turno, por lo que
  el contexto se conserva entre reinicios de sesión, Compaction y cambios de canal.
- **Modelado de usuario** - Honcho mantiene un perfil para cada usuario (preferencias,
  datos, estilo de comunicación) y para el agente (personalidad, comportamientos
  aprendidos).
- **Búsqueda semántica** - busca en observaciones de conversaciones pasadas, no
  solo en la sesión actual.
- **Conciencia multiagente** - los agentes principales rastrean automáticamente los
  subagentes generados, con los principales añadidos como observadores en las sesiones secundarias.

## Herramientas disponibles

Honcho registra herramientas que el agente puede usar durante la conversación:

**Recuperación de datos (rápida, sin llamada al LLM):**

| Herramienta                 | Qué hace                                               |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | Representación completa del usuario entre sesiones     |
| `honcho_search_conclusions` | Búsqueda semántica en conclusiones almacenadas         |
| `honcho_search_messages`    | Encuentra mensajes entre sesiones (filtra por remitente, fecha) |
| `honcho_session`            | Historial y resumen de la sesión actual                |

**Preguntas y respuestas (con tecnología LLM):**

| Herramienta  | Qué hace                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Pregunta sobre el usuario. `depth='quick'` para datos, `'thorough'` para síntesis |

## Primeros pasos

Instala el Plugin y ejecuta la configuración:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

El comando de configuración solicita tus credenciales de API, escribe la configuración y
opcionalmente migra los archivos de memoria existentes del espacio de trabajo.

<Info>
Honcho puede ejecutarse completamente en local (autoalojado) o mediante la API administrada en
`api.honcho.dev`. No se requieren dependencias externas para la opción autoalojada.
</Info>

## Configuración

Los ajustes se encuentran en `plugins.entries["openclaw-honcho"].config`:

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

Para instancias autoalojadas, apunta `baseUrl` a tu servidor local (por ejemplo,
`http://localhost:8000`) y omite la clave de API.

## Migrar memoria existente

Si tienes archivos de memoria existentes del espacio de trabajo (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` los detecta y
ofrece migrarlos.

<Info>
La migración no es destructiva: los archivos se suben a Honcho. Los originales
nunca se eliminan ni se mueven.
</Info>

## Cómo funciona

Después de cada turno de IA, la conversación se persiste en Honcho. Se observan tanto los mensajes del usuario como
los del agente, lo que permite a Honcho crear y refinar sus modelos con
el tiempo.

Durante la conversación, las herramientas de Honcho consultan el servicio durante el hook de Plugin
`before_prompt_build` de OpenClaw, inyectando contexto relevante antes de que el modelo
vea el prompt.

## Honcho frente a la memoria integrada

|                   | Integrada / QMD              | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Almacenamiento** | Archivos Markdown del espacio de trabajo | Servicio dedicado (local o alojado) |
| **Entre sesiones** | Mediante archivos de memoria | Automático, integrado               |
| **Modelado de usuario** | Manual (escribir en MEMORY.md) | Perfiles automáticos                |
| **Búsqueda**      | Vectorial + palabra clave (híbrida) | Semántica sobre observaciones       |
| **Multiagente**   | No rastreado                 | Conciencia principal/secundario     |
| **Dependencias**  | Ninguna (integrada) o binario QMD | Instalación de Plugin               |

Honcho y el sistema de memoria integrado pueden funcionar juntos. Cuando QMD está
configurado, hay herramientas adicionales disponibles para buscar en archivos Markdown
locales junto con la memoria entre sesiones de Honcho.

## Comandos de CLI

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Lecturas adicionales

- [Código fuente del Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentación de Honcho](https://docs.honcho.dev)
- [Guía de integración de Honcho con OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Motor de memoria QMD](/es/concepts/memory-qmd)
- [Motores de contexto](/es/concepts/context-engine)
