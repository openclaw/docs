---
read_when:
    - Quieres configurar QMD como backend de memoria
    - Quieres funciones avanzadas de memoria, como la reclasificación o rutas indexadas adicionales
summary: Servicio auxiliar de búsqueda local con BM25, vectores, reordenación y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-07-11T23:03:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un proceso auxiliar de búsqueda local que se ejecuta
junto con OpenClaw. Combina BM25, búsqueda vectorial y reordenamiento en un único
binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué aporta frente al motor integrado

- **Reordenamiento y expansión de consultas** para mejorar la cobertura.
- **Indexación de directorios adicionales**: documentación de proyectos, notas del equipo o cualquier contenido del disco.
- **Indexación de transcripciones de sesiones**: permite recuperar conversaciones anteriores.
- **Totalmente local**: se ejecuta con el Plugin proveedor oficial de llama.cpp y
  descarga automáticamente los modelos GGUF.
- **Alternativa automática**: si QMD no está disponible, OpenClaw recurre al
  motor integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Una compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan sin configuración adicional. En Windows, se recomienda usar WSL2.

### Activación

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un entorno autónomo de QMD en
`~/.openclaw/agents/<agentId>/qmd/` y administra automáticamente el ciclo de vida
del proceso auxiliar: las colecciones, las actualizaciones y la generación de incrustaciones se gestionan por ti.
Da preferencia a los formatos actuales de las colecciones y consultas MCP de QMD, pero recurre a
opciones alternativas para patrones de colecciones y a nombres antiguos de herramientas MCP cuando es necesario.
La reconciliación durante el inicio también vuelve a crear las colecciones administradas obsoletas con sus
patrones canónicos cuando aún existe una colección antigua de QMD con el mismo nombre.

## Cómo funciona el proceso auxiliar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y de cualquier
  ruta configurada en `memory.qmd.paths`; después, ejecuta `qmd update` cuando se abre el administrador de QMD
  y periódicamente a partir de entonces (`memory.qmd.update.interval`, valor predeterminado:
  `5m`). Las actualizaciones se ejecutan mediante subprocesos de QMD, no mediante un recorrido del sistema
  de archivos dentro del proceso. Los modos de búsqueda semántica también ejecutan `qmd embed`
  (`memory.qmd.update.embedInterval`, valor predeterminado: `60m`).
- La colección predeterminada del espacio de trabajo realiza el seguimiento de `MEMORY.md` y del árbol
  `memory/`. El archivo `memory.md` en minúsculas no se indexa como archivo de memoria raíz.
- El analizador propio de QMD ignora las rutas ocultas y los directorios habituales de dependencias y compilación,
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. De forma predeterminada, el inicio del Gateway no inicializa QMD
  (`memory.qmd.update.startup` tiene como valor predeterminado `off`), por lo que un arranque en frío evita
  importar el entorno de ejecución de memoria o crear el observador persistente antes
  de que se use la memoria por primera vez.
- Establece `memory.qmd.update.startup` en `idle` o `immediate` para inicializar QMD
  durante el inicio del Gateway de todos modos. `memory.qmd.update.onBoot` tiene como valor predeterminado `true` y
  ejecuta la actualización inicial durante el arranque; establécelo en `false` para omitir esa
  actualización inmediata (el administrador persistente sigue abriéndose cuando se configuran intervalos
  de actualización o generación de incrustaciones, por lo que QMD continúa gestionando su observador y sus temporizadores habituales).
- Las búsquedas usan el `searchMode` configurado (valor predeterminado: `search`; también admite
  `vsearch` y `query`). `search` usa exclusivamente BM25, por lo que OpenClaw omite las
  comprobaciones de disponibilidad de vectores semánticos y el mantenimiento de incrustaciones en ese modo. Si un modo
  falla, OpenClaw vuelve a intentarlo con `qmd query`.
- Cuando `searchMode` sea `query`, establece `memory.qmd.rerank` en `false` para usar
  la ruta de consultas híbridas de QMD sin el reordenador (requiere QMD 2.1 o posterior).
  OpenClaw pasa `--no-rerank` a la ruta directa de la CLI de QMD y
  `rerank: false` a la herramienta de consultas MCP de QMD.
- Con las versiones de QMD que anuncian filtros para varias colecciones, OpenClaw agrupa
  las colecciones con la misma fuente en una sola invocación de búsqueda de QMD. Las versiones anteriores de QMD
  mantienen la alternativa compatible de una búsqueda por colección.
- Si QMD falla por completo, OpenClaw recurre al motor SQLite integrado.
  Tras un fallo de apertura, los intentos repetidos durante los turnos de chat se ralentizan brevemente para que
  la ausencia del binario o una dependencia defectuosa del proceso auxiliar no provoquen una avalancha de reintentos;
  `openclaw memory status` y las comprobaciones puntuales de la CLI siguen verificando QMD
  directamente.

<Info>
La primera búsqueda puede ser lenta: QMD descarga automáticamente modelos GGUF (~2 GB) para
el reordenamiento y la expansión de consultas durante la primera ejecución de `qmd query`.
</Info>

## Rendimiento y compatibilidad de la búsqueda

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con las instalaciones actuales como con las antiguas de QMD.

Durante el inicio, OpenClaw comprueba una vez por administrador el texto de ayuda de QMD instalado. Si
el binario anuncia compatibilidad con varios filtros de colecciones, OpenClaw
busca en todas las colecciones con la misma fuente mediante un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso de QMD por cada colección de memoria persistente.
Las colecciones de transcripciones de sesiones permanecen en su propio grupo de fuentes, por lo que las búsquedas
mixtas de `memory` + `sessions` siguen proporcionando al diversificador de resultados entradas de
ambas fuentes.

Las compilaciones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una
de esas compilaciones, mantiene la ruta de compatibilidad y busca en cada colección
por separado antes de combinar y deduplicar los resultados.

Para inspeccionar manualmente el contrato instalado, ejecuta:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD menciona la posibilidad de usar una o varias colecciones. La ayuda antigua
suele describir una sola colección.

## Sustitución de modelos

Las variables de entorno de los modelos de QMD se transmiten sin cambios desde el proceso del Gateway,
por lo que puedes ajustar QMD globalmente sin añadir configuración nueva de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de incrustaciones, vuelve a generar las incrustaciones para que el índice coincida con el
nuevo espacio vectorial.

## Indexación de rutas adicionales

Configura QMD para usar directorios adicionales y permitir búsquedas en ellos:

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

Los fragmentos de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en los
resultados de búsqueda. `memory_get` reconoce este prefijo y lee desde la
raíz correcta de la colección.

## Indexación de transcripciones de sesiones

Activa la indexación de sesiones para recuperar conversaciones anteriores. QMD necesita tanto la
fuente general de sesiones de `memorySearch` como el exportador de transcripciones de QMD:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Las transcripciones se exportan como turnos saneados de Usuario/Asistente a una colección específica de QMD
en `~/.openclaw/agents/<id>/qmd/sessions/`. Configurar únicamente
`memorySearch.experimental.sessionMemory` no exporta las transcripciones a
QMD.

Los resultados de sesiones siguen filtrándose mediante
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La
visibilidad predeterminada `tree` no expone sesiones no relacionadas del mismo agente. Si una
sesión enviada por el Gateway debe poder recuperarse desde una sesión de mensajes directos independiente,
establece deliberadamente `tools.sessions.visibility: "agent"`.

## Ámbito de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD solo se muestran en sesiones directas, no
en chats de grupo o de canal. Configura `memory.qmd.scope` para cambiarlo:

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

El fragmento anterior es la regla predeterminada real. Cuando el ámbito deniega una búsqueda,
OpenClaw registra una advertencia con el canal y el tipo de chat derivados para facilitar
la depuración de resultados vacíos.

## Citas

Cuando `memory.citations` es `auto` u `on`, se añade a los fragmentos de búsqueda un pie
`Source: <path>#L<line>` (o `#L<start>-L<end>`). En el modo `auto`,
el pie solo se añade a las sesiones de chat directo. Establece
`memory.citations = "off"` para omitir el pie y seguir transmitiendo internamente la ruta al
agente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reordenamiento para obtener resultados de mayor calidad.
- Buscar en documentación de proyectos o notas fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más sencillas, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrate de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, crea un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en tu shell, pero OpenClaw sigue informando de
`spawn qmd ENOENT`, es probable que el proceso del Gateway tenga un `PATH` diferente al
de tu shell interactivo. Especifica el binario de forma explícita:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Usa `command -v qmd` en el entorno donde está instalado QMD y, después, vuelve a comprobarlo
con `openclaw memory status --deep`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF la primera vez que se usa. Prepáralo
con `qmd query "test"` usando los mismos directorios XDG que utiliza OpenClaw.

**¿Se crean muchos subprocesos de QMD durante la búsqueda?** Actualiza QMD si es posible. OpenClaw
usa un solo proceso para búsquedas en varias colecciones con la misma fuente únicamente cuando
el QMD instalado anuncia compatibilidad con varios filtros `-c`; de lo contrario,
mantiene la alternativa anterior de un proceso por colección para garantizar la corrección.

**¿QMD configurado solo para BM25 sigue intentando compilar llama.cpp?** Establece
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como
exclusivamente léxico, omite las comprobaciones del estado vectorial de QMD y el mantenimiento de incrustaciones, y
reserva las comprobaciones de disponibilidad semántica para las configuraciones `vsearch` o `query`.

**¿La búsqueda agota el tiempo de espera?** Aumenta `memory.qmd.limits.timeoutMs` (valor predeterminado:
4000ms). Establécelo en un valor mayor, por ejemplo `120000`, para hardware más lento.

**¿Se obtienen resultados vacíos en chats de grupo o de canal?** Es el comportamiento esperado con el
valor predeterminado de `memory.qmd.scope`, que solo permite sesiones directas. Añade una regla
`allow` para los tipos de chat `group` o `channel` si quieres obtener resultados de QMD
en ellos.

**¿La búsqueda en la memoria raíz se volvió repentinamente demasiado amplia?** Reinicia el Gateway o espera
a la siguiente reconciliación de inicio. OpenClaw vuelve a crear las colecciones administradas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando
detecta un conflicto con el mismo nombre.

**¿Los repositorios temporales visibles desde el espacio de trabajo provocan `ENAMETOOLONG` o errores de indexación?**
El recorrido de QMD sigue el analizador subyacente de QMD en lugar de las
reglas de enlaces simbólicos del motor integrado de OpenClaw. Mantén las copias de trabajo temporales de monorrepositorios en
directorios ocultos como `.tmp/` o fuera de las raíces indexadas de QMD hasta que QMD ofrezca
un recorrido seguro frente a ciclos o controles explícitos de exclusión.

## Configuración

Para consultar toda la superficie de configuración (`memory.qmd.*`), los modos de búsqueda, los intervalos de actualización,
las reglas de ámbito y el resto de opciones, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria de Honcho](/es/concepts/memory-honcho)
