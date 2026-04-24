---
read_when:
    - Quieres configurar QMD como tu backend de memoria
    - Quieres funciones avanzadas de memoria como reranking o rutas indexadas adicionales
summary: Sidecar de búsqueda local-first con BM25, vectores, reranking y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-04-24T05:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) es un sidecar de búsqueda local-first que se ejecuta
junto a OpenClaw. Combina BM25, búsqueda vectorial y reranking en un único
binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué añade frente al integrado

- **Reranking y expansión de consultas** para una mejor recuperación.
- **Indexar directorios adicionales** -- documentación del proyecto, notas del equipo, cualquier cosa en disco.
- **Indexar transcripciones de sesión** -- recuperar conversaciones anteriores.
- **Totalmente local** -- se ejecuta mediante Bun + node-llama-cpp, descarga automáticamente modelos GGUF.
- **Respaldo automático** -- si QMD no está disponible, OpenClaw recurre al
  motor integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del gateway.
- macOS y Linux funcionan de inmediato. Windows tiene mejor compatibilidad mediante WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio home autocontenido de QMD en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del sidecar -- las colecciones, actualizaciones y ejecuciones de embeddings se gestionan por ti.
Prefiere las formas actuales de colecciones de QMD y consultas de MCP, pero aun así recurre a
los indicadores heredados de colección `--mask` y a nombres antiguos de herramientas MCP cuando hace falta.
La reconciliación al arranque también vuelve a crear colecciones gestionadas obsoletas con sus
patrones canónicos cuando todavía existe una colección más antigua de QMD con el mismo nombre.

## Cómo funciona el sidecar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y de
  cualquier `memory.qmd.paths` configurado, luego ejecuta `qmd update` + `qmd embed` al arrancar
  y periódicamente (cada 5 minutos de forma predeterminada).
- La colección predeterminada del espacio de trabajo sigue `MEMORY.md` más el árbol `memory/`.
  `memory.md` en minúsculas no se indexa como archivo raíz de memoria.
- La actualización al arranque se ejecuta en segundo plano para no bloquear el inicio del chat.
- Las búsquedas usan el `searchMode` configurado (predeterminado: `search`; también admite
  `vsearch` y `query`). Si un modo falla, OpenClaw reintenta con `qmd query`.
- Si QMD falla por completo, OpenClaw recurre al motor integrado de SQLite.

<Info>
La primera búsqueda puede ser lenta -- QMD descarga automáticamente modelos GGUF (~2 GB) para
reranking y expansión de consultas en la primera ejecución de `qmd query`.
</Info>

## Sobrescrituras de modelo

Las variables de entorno de modelo de QMD se transfieren sin cambios desde el proceso
del gateway, por lo que puedes ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de embeddings, vuelve a ejecutar los embeddings para que el índice coincida con el
nuevo espacio vectorial.

## Indexar rutas adicionales

Haz que QMD apunte a directorios adicionales para que se puedan buscar:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Los snippets de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en
los resultados de búsqueda. `memory_get` entiende este prefijo y lee desde la raíz correcta
de la colección.

## Indexar transcripciones de sesión

Habilita la indexación de sesiones para recuperar conversaciones anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Las transcripciones se exportan como turnos saneados de Usuario/Asistente a una colección dedicada de QMD
en `~/.openclaw/agents/<id>/qmd/sessions/`.

## Alcance de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD se muestran en sesiones directas y de canal
(no en grupos). Configura `memory.qmd.scope` para cambiar esto:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Cuando el alcance deniega una búsqueda, OpenClaw registra una advertencia con el canal derivado y el
tipo de chat para que los resultados vacíos sean más fáciles de depurar.

## Citas

Cuando `memory.citations` es `auto` o `on`, los snippets de búsqueda incluyen un
pie `Source: <path#line>`. Establece `memory.citations = "off"` para omitir el pie
mientras se sigue pasando internamente la ruta al agente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reranking para resultados de mayor calidad.
- Buscar documentación del proyecto o notas fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más sencillas, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrate de que el binario esté en el `PATH` del gateway. Si OpenClaw
se ejecuta como servicio, crea un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF en el primer uso. Precaliéntalo
con `qmd query "test"` usando los mismos directorios XDG que usa OpenClaw.

**¿La búsqueda agota el tiempo?** Aumenta `memory.qmd.limits.timeoutMs` (predeterminado: 4000ms).
Establécelo en `120000` para hardware más lento.

**¿Resultados vacíos en chats grupales?** Comprueba `memory.qmd.scope` -- el valor predeterminado solo
permite sesiones directas y de canal.

**¿La búsqueda de memoria raíz se volvió demasiado amplia de repente?** Reinicia el gateway o espera al
siguiente ciclo de reconciliación de inicio. OpenClaw vuelve a crear colecciones gestionadas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando detecta un conflicto
de mismo nombre.

**¿Repositorios temporales visibles desde el espacio de trabajo causan `ENAMETOOLONG` o indexación rota?**
El recorrido de QMD actualmente sigue el comportamiento del escáner subyacente de QMD en lugar de
las reglas integradas de enlaces simbólicos de OpenClaw. Mantén los checkouts temporales de monorepos en
directorios ocultos como `.tmp/` o fuera de las raíces QMD indexadas hasta que QMD exponga
un recorrido seguro frente a ciclos o controles explícitos de exclusión.

## Configuración

Para ver toda la superficie de configuración (`memory.qmd.*`), modos de búsqueda, intervalos
de actualización, reglas de alcance y todos los demás ajustes, consulta la
[Referencia de configuración de Memoria](/es/reference/memory-config).

## Relacionado

- [Descripción general de Memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria Honcho](/es/concepts/memory-honcho)
