---
read_when:
    - Quieres una memoria persistente que funcione entre sesiones y canales
    - Quieres recuperación de información y modelado de usuarios con tecnología de IA
summary: Memoria nativa de IA entre sesiones mediante el plugin Honcho
title: Memoria de Honcho
x-i18n:
    generated_at: "2026-07-11T22:59:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) añade memoria nativa para IA a OpenClaw mediante un
plugin externo. Conserva las conversaciones en un servicio dedicado y crea
modelos del usuario y del agente con el tiempo, lo que proporciona al agente
contexto entre sesiones que va más allá de los archivos Markdown del espacio de trabajo.

## Qué proporciona

- **Memoria entre sesiones** - las conversaciones se conservan después de cada turno, por lo que
  el contexto se mantiene tras reinicios de sesión, Compaction y cambios de canal.
- **Modelado del usuario** - Honcho mantiene un perfil para cada usuario (preferencias,
  datos, estilo de comunicación) y para el agente (personalidad, comportamientos
  aprendidos).
- **Búsqueda semántica** - permite buscar entre observaciones de conversaciones anteriores, no
  solo en la sesión actual.
- **Conocimiento de múltiples agentes** - los agentes principales realizan automáticamente el seguimiento de los
  subagentes generados, y se añaden como observadores en las sesiones secundarias.

## Herramientas disponibles

Honcho registra herramientas que el agente puede utilizar durante la conversación:

**Recuperación de datos (rápida, sin llamadas a un LLM):**

| Herramienta                  | Qué hace                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| `honcho_context`             | Representación completa del usuario entre sesiones              |
| `honcho_search_conclusions`  | Búsqueda semántica entre las conclusiones almacenadas           |
| `honcho_search_messages`     | Busca mensajes entre sesiones (por remitente o fecha)           |
| `honcho_session`             | Historial y resumen de la sesión actual                         |

**Preguntas y respuestas (con tecnología LLM):**

| Herramienta  | Qué hace                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `honcho_ask` | Consulta información sobre el usuario. `depth='quick'` para datos, `'thorough'` para síntesis |

## Primeros pasos

Instala el plugin y ejecuta la configuración:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

El comando de configuración solicita las credenciales de la API, escribe la configuración y
permite migrar, de forma opcional, los archivos de memoria existentes del espacio de trabajo.

<Info>
Honcho puede ejecutarse completamente en local (con alojamiento propio) o mediante la API gestionada en
`api.honcho.dev`. La opción con alojamiento propio no requiere
dependencias externas.
</Info>

## Configuración

Los ajustes se encuentran en `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omitir para alojamiento propio
          workspaceId: "openclaw", // aislamiento de la memoria
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

En las instancias con alojamiento propio, establece `baseUrl` en el servidor local (por ejemplo,
`http://localhost:8000`) y omite la clave de API.

## Migración de la memoria existente

Si tienes archivos de memoria existentes en el espacio de trabajo (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` los detecta y
ofrece migrarlos.

<Info>
La migración no es destructiva: los archivos se cargan en Honcho. Los originales
nunca se eliminan ni se mueven.
</Info>

## Cómo funciona

Después de cada turno de la IA, la conversación se conserva en Honcho. Se observan tanto los mensajes del usuario como
los del agente, lo que permite a Honcho crear y perfeccionar sus modelos con
el tiempo.

Durante la conversación, las herramientas de Honcho consultan el servicio mediante el hook del plugin
`before_prompt_build` de OpenClaw e incorporan el contexto pertinente antes de que el modelo
vea el prompt.

## Honcho frente a la memoria integrada

|                   | Integrada/QMD                             | Honcho                                 |
| ----------------- | ----------------------------------------- | -------------------------------------- |
| **Almacenamiento** | Archivos Markdown del espacio de trabajo | Servicio dedicado (local o alojado)    |
| **Entre sesiones** | Mediante archivos de memoria             | Automático e integrado                 |
| **Modelado del usuario** | Manual (escribir en MEMORY.md)    | Perfiles automáticos                   |
| **Búsqueda**       | Vectores + palabras clave (híbrida)      | Semántica entre observaciones          |
| **Múltiples agentes** | Sin seguimiento                       | Conocimiento de relaciones principal/secundario |
| **Dependencias**   | Ninguna (integrada) o binario de QMD      | Instalación del plugin                 |

Honcho y el sistema de memoria integrado pueden funcionar juntos. Cuando QMD está
configurado, hay herramientas adicionales disponibles para buscar en archivos Markdown
locales junto con la memoria entre sesiones de Honcho.

## Comandos de la CLI

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Lecturas adicionales

- [Código fuente del plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentación de Honcho](https://docs.honcho.dev)
- [Guía de integración de Honcho con OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Temas relacionados

- [Descripción general de la memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Motor de memoria QMD](/es/concepts/memory-qmd)
- [Motores de contexto](/es/concepts/context-engine)
