---
read_when:
    - Quieres configurar QMD como backend de memoria
    - Se necesitan funciones de memoria avanzadas, como la reclasificación o rutas indexadas adicionales.
summary: Servicio auxiliar de búsqueda local primero con BM25, vectores, reranking y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-07-19T01:51:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e41e8c0e3b0a0b365fdfc5f00d5f8dd81e90d4cf45c98ea203a64fc9b7d921f0
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un complemento de búsqueda con prioridad local que se ejecuta
junto con OpenClaw. Combina BM25, búsqueda vectorial y reclasificación en un solo
binario, y puede indexar contenido más allá de los archivos de memoria de su espacio de trabajo.

## Qué añade respecto al motor integrado

- **Reclasificación y expansión de consultas** para mejorar la recuperación.
- **Indexación de directorios adicionales**: documentación de proyectos, notas de equipo y cualquier contenido del disco.
- **Indexación de transcripciones de sesiones**: permite recuperar conversaciones anteriores.
- **Totalmente local**: se ejecuta con el Plugin oficial del proveedor llama.cpp y
  descarga automáticamente los modelos GGUF.
- **Retorno automático**: si QMD no está disponible, OpenClaw vuelve al
  motor integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instale QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Una compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan directamente. En Windows, se recomienda WSL2.

### Activación

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio de inicio autónomo de QMD en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del complemento: se encarga de las colecciones, actualizaciones y ejecuciones de embeddings.
Da prioridad a las formas actuales de las colecciones y consultas MCP de QMD, pero recurre a
marcadores alternativos de patrones de colecciones y nombres antiguos de herramientas MCP cuando es necesario.
La reconciliación de inicio también vuelve a crear las colecciones gestionadas obsoletas con sus
patrones canónicos cuando aún existe una colección antigua de QMD con el mismo nombre.

## Cómo funciona el complemento

- OpenClaw crea colecciones a partir de los archivos de memoria de su espacio de trabajo y de cualquier
  `memory.qmd.paths` configurado; después ejecuta `qmd update` cuando se abre el gestor de QMD
  y periódicamente a partir de entonces (`memory.qmd.update.interval`, valor predeterminado:
  `5m`). Las actualizaciones se ejecutan mediante subprocesos de QMD, no mediante un rastreo
  del sistema de archivos dentro del proceso. Los modos de búsqueda semántica también ejecutan `qmd embed`
  (`memory.qmd.update.embedInterval`, valor predeterminado: `60m`).
- QMD continúa gestionando su `index.sqlite`, la configuración YAML de las colecciones y las descargas
  de modelos dentro del directorio de inicio de QMD de cada agente; estos son artefactos de una herramienta externa,
  no tablas de estado de OpenClaw. La coordinación propiedad de OpenClaw reside únicamente en SQLite:
  un arrendamiento compartido limita el trabajo de embeddings entre agentes, mientras que un arrendamiento en cada
  base de datos de agente serializa las escrituras de colecciones, actualizaciones y embeddings de ese agente.
  El entorno de ejecución ya no crea archivos auxiliares de bloqueo de QMD. `openclaw doctor --fix`
  elimina los archivos auxiliares retirados únicamente después de comprobar que el propietario de su proceso anterior está obsoleto.
  Las actualizaciones requieren una transición completa: detenga y reinicie todos los procesos de OpenClaw que
  compartan el directorio de estado antes de usar la versión nueva. No se admite la combinación de escritores
  QMD antiguos y nuevos; el entorno de ejecución no aplica deliberadamente un bloqueo doble a los archivos auxiliares retirados.
- La colección predeterminada del espacio de trabajo rastrea `MEMORY.md` y el árbol `memory/`.
  El archivo `memory.md` en minúsculas no se indexa como archivo de memoria raíz.
- El propio escáner de QMD ignora las rutas ocultas y los directorios habituales de dependencias y compilación,
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. De forma predeterminada, el inicio del Gateway no inicializa QMD
  (`memory.qmd.update.startup` tiene como valor predeterminado `off`), por lo que un arranque en frío evita
  importar el entorno de ejecución de memoria o crear el observador persistente antes de
  usar la memoria por primera vez.
- Establezca `memory.qmd.update.startup` en `idle` o `immediate` para inicializar QMD
  durante el inicio del Gateway de todos modos. `memory.qmd.update.onBoot` tiene como valor predeterminado `true` y
  ejecuta la actualización inicial durante el inicio; establézcalo en `false` para omitir esa
  actualización inmediata (el gestor persistente continúa abriéndose cuando se configuran intervalos de actualización
  o embeddings, por lo que QMD sigue gestionando su observador y temporizadores habituales).
- Las búsquedas utilizan el `searchMode` configurado (valor predeterminado: `search`; también admite
  `vsearch` y `query`). `search` solo utiliza BM25, por lo que OpenClaw omite las comprobaciones
  de preparación vectorial semántica y el mantenimiento de embeddings en ese modo. Si un modo
  falla, OpenClaw vuelve a intentarlo con `qmd query`.
- Cuando `searchMode` sea `query`, establezca `memory.qmd.rerank` en `false` para usar
  la ruta de consulta híbrida de QMD sin el reclasificador (requiere QMD 2.1 o una versión posterior).
  OpenClaw pasa `--no-rerank` a la ruta directa de la CLI de QMD y
  `rerank: false` a la herramienta de consulta MCP de QMD.
- Con las versiones de QMD que anuncian filtros para varias colecciones, OpenClaw agrupa
  las colecciones del mismo origen en una única invocación de búsqueda de QMD. Las versiones anteriores de QMD
  mantienen el retorno compatible por colección.
- Si QMD falla por completo, OpenClaw vuelve al motor SQLite integrado.
  Los intentos repetidos en turnos de chat aplican una breve espera después de un error de apertura para que
  la ausencia de un binario o una dependencia defectuosa del complemento no genere una avalancha de reintentos;
  `openclaw memory status` y las comprobaciones puntuales de la CLI siguen volviendo a comprobar QMD
  directamente.

<Info>
La primera búsqueda puede ser lenta: QMD descarga automáticamente modelos GGUF (~2 GB) para
la reclasificación y expansión de consultas durante la primera ejecución de `qmd query`.
</Info>

## Rendimiento y compatibilidad de la búsqueda

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con instalaciones actuales
como antiguas de QMD.

Durante el inicio, OpenClaw comprueba una vez por gestor el texto de ayuda de QMD instalado. Si
el binario anuncia que admite varios filtros de colecciones, OpenClaw
busca en todas las colecciones del mismo origen con un solo comando:

```bash
qmd search "notas del enrutador" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso de QMD por cada colección de memoria persistente.
Las colecciones de transcripciones de sesiones permanecen en su propio grupo de origen, por lo que las búsquedas
combinadas de `memory` y `sessions` siguen proporcionando al diversificador de resultados datos de
ambos orígenes.

Las compilaciones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta
una de esas compilaciones, mantiene la ruta de compatibilidad y busca en cada colección
por separado antes de combinar y desduplicar los resultados.

Para inspeccionar manualmente el contrato instalado, ejecute:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD menciona la selección de una o varias colecciones. La ayuda antigua
suele describir una sola colección.

## Sustitución de modelos

Las variables de entorno de modelos de QMD se transmiten sin cambios desde el proceso del Gateway,
por lo que es posible ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de embeddings, vuelva a ejecutar los embeddings para que el índice coincida con el
nuevo espacio vectorial.

## Indexación de rutas adicionales

Dirija QMD a directorios adicionales para que se puedan buscar:

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

Los fragmentos de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en
los resultados de búsqueda. `memory_get` reconoce este prefijo y lee desde la
raíz de colección correcta.

## Indexación de transcripciones de sesiones

Active la indexación de sesiones para recuperar conversaciones anteriores. QMD necesita tanto el
origen general de sesiones `memorySearch` como el exportador de transcripciones de QMD:

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

Las transcripciones se exportan como turnos saneados de Usuario/Asistente a una colección dedicada de QMD
en `~/.openclaw/agents/<id>/qmd/sessions/`. Establecer únicamente
`memorySearch.experimental.sessionMemory` no exporta las transcripciones a
QMD.

Los resultados de sesiones siguen filtrándose mediante
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La
visibilidad predeterminada `tree` incluye la sesión actual, las sesiones que genera
y las sesiones de grupo del mismo agente observadas mediante el conocimiento ambiental del grupo. Con
`session.dmScope: "main"`, los usuarios de una configuración de mensajes directos multiusuario comparten la sesión
principal y pueden recuperar contenido de sus grupos observados. Use un
`dmScope` por interlocutor para aislar los mensajes directos, o establezca la visibilidad en `"self"` para excluir
las lecturas ambientales de sesiones observadas. Las demás sesiones no relacionadas del mismo agente siguen requiriendo
la visibilidad `"agent"`.

## Ámbito de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD solo se muestran en sesiones directas (no
en chats de grupo ni de canales). Configure `memory.qmd.scope` para cambiarlo:

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

El fragmento anterior es la regla predeterminada real. Cuando el ámbito rechaza una búsqueda,
OpenClaw registra una advertencia con el canal y el tipo de chat derivados para facilitar
la depuración de resultados vacíos.

## Citas

Cuando `memory.citations` es `auto` o `on`, se añade a los fragmentos de búsqueda un
pie de página `Source: <path>#L<line>` (o `#L<start>-L<end>`). En el modo `auto`,
el pie de página solo se añade en sesiones de chat directo. Establezca
`memory.citations = "off"` para omitir el pie de página y seguir pasando internamente la ruta
al agente.

## Cuándo utilizarlo

Elija QMD cuando necesite:

- Reclasificación para obtener resultados de mayor calidad.
- Buscar documentación de proyectos o notas fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones anteriores.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más sencillas, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrese de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, cree un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en su shell, pero OpenClaw sigue indicando
`spawn qmd ENOENT`, es probable que el proceso del Gateway tenga un `PATH` diferente al
del shell interactivo. Fije explícitamente el binario:

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

Use `command -v qmd` en el entorno donde esté instalado QMD y, después, vuelva a comprobarlo
con `openclaw memory status --deep`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF durante el primer uso. Prepárelo
con `qmd query "test"` utilizando los mismos directorios XDG que usa OpenClaw.

**¿Hay muchos subprocesos de QMD durante la búsqueda?** Actualice QMD si es posible. OpenClaw
utiliza un solo proceso para búsquedas en varias colecciones del mismo origen únicamente cuando el
QMD instalado anuncia que admite varios filtros `-c`; de lo contrario,
mantiene el retorno antiguo por colección para garantizar la corrección.

**¿QMD en modo exclusivo de BM25 sigue intentando compilar llama.cpp?** Establezca
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como
exclusivamente léxico, omite las comprobaciones del estado vectorial de QMD y el mantenimiento de embeddings, y
deja las comprobaciones de preparación semántica a las configuraciones `vsearch` o `query`.

**¿Se agota el tiempo de espera de la búsqueda?** Aumente `memory.qmd.limits.timeoutMs` (valor predeterminado: 4000ms).
Establezca un valor mayor, por ejemplo `120000`, para hardware más lento. Este límite se aplica a
los propios comandos de búsqueda de QMD durante las llamadas `memory_search` del agente; la configuración, la sincronización,
el retorno al motor integrado y el trabajo complementario del corpus mantienen sus propios plazos más breves.

**¿Se obtienen resultados vacíos en chats de grupo o de canales?** Este comportamiento es el esperado con el
`memory.qmd.scope` predeterminado, que solo permite sesiones directas. Añada una
regla `allow` para los tipos de chat `group` o `channel` si desea obtener resultados de QMD
en ellos.

**¿La búsqueda de memoria raíz se ha vuelto demasiado amplia de repente?** Reinicie el Gateway o espere
a la siguiente reconciliación de inicio. OpenClaw vuelve a crear las colecciones gestionadas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando
detecta un conflicto con el mismo nombre.

**¿Los repositorios temporales visibles en el espacio de trabajo provocan `ENAMETOOLONG` o una indexación defectuosa?**
El recorrido de QMD sigue el escáner QMD subyacente en lugar de las
reglas de enlaces simbólicos integradas de OpenClaw. Mantenga las copias temporales
del monorepositorio en directorios ocultos como `.tmp/` o fuera de las raíces QMD
indexadas hasta que QMD ofrezca un recorrido seguro frente a ciclos o controles
de exclusión explícitos.

## Configuración

Para consultar toda la superficie de configuración (`memory.qmd.*`), los modos de búsqueda, los intervalos
de actualización, las reglas de ámbito y todas las demás opciones, consulte la
[referencia de configuración de memoria](/es/reference/memory-config).

## Temas relacionados

- [Descripción general de la memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria de Honcho](/es/concepts/memory-honcho)
