---
read_when:
    - Quieres configurar QMD como tu backend de memoria
    - Quieres funciones avanzadas de memoria, como reordenamiento o rutas indexadas adicionales
summary: Sidecar de búsqueda local-first con BM25, vectores, reranking y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-06-27T11:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) es un proceso auxiliar de búsqueda de prioridad local que se ejecuta
junto a OpenClaw. Combina BM25, búsqueda vectorial y reordenación en un único
binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué agrega sobre el motor integrado

- **Reordenación y expansión de consultas** para mejorar la recuperación.
- **Indexar directorios adicionales** -- documentación del proyecto, notas del equipo, cualquier cosa en disco.
- **Indexar transcripciones de sesión** -- recupera conversaciones anteriores.
- **Totalmente local** -- se ejecuta con el Plugin de proveedor oficial llama.cpp y
  descarga automáticamente modelos GGUF.
- **Respaldo automático** -- si QMD no está disponible, OpenClaw vuelve al motor
  integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del Gateway.
- macOS y Linux funcionan directamente. Windows tiene mejor soporte mediante WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un inicio de QMD autónomo en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona automáticamente el ciclo de vida
del proceso auxiliar -- las colecciones, las actualizaciones y las ejecuciones de incrustación se manejan por ti.
Prefiere las formas actuales de colección QMD y consulta MCP, pero aún recurre a
marcas de patrones de colección alternativas y nombres de herramientas MCP más antiguos cuando hace falta.
La reconciliación al arrancar también recrea las colecciones gestionadas obsoletas
con sus patrones canónicos cuando todavía existe una colección QMD más antigua
con el mismo nombre.

## Cómo funciona el proceso auxiliar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y cualquier
  `memory.qmd.paths` configurado, luego ejecuta `qmd update` cuando se abre el gestor de QMD
  y periódicamente después (cada 5 minutos de forma predeterminada). Estas actualizaciones
  se ejecutan mediante subprocesos de QMD, no mediante un recorrido del sistema de archivos dentro del proceso. Los modos semánticos
  también ejecutan `qmd embed`.
- La colección predeterminada del espacio de trabajo rastrea `MEMORY.md` más el árbol
  `memory/`. `memory.md` en minúsculas no se indexa como archivo raíz de memoria.
- El escáner propio de QMD ignora rutas ocultas y directorios comunes de dependencias/compilación
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` y
  `build`. El arranque del Gateway no inicializa QMD de forma predeterminada, por lo que el arranque en frío
  evita importar el entorno de ejecución de memoria o crear el observador de larga duración antes de que
  la memoria se use por primera vez.
- Si quieres que QMD se inicialice al iniciar el Gateway de todos modos, define
  `memory.qmd.update.startup` como `idle` o `immediate`. Con
  `memory.qmd.update.onBoot: true`, el arranque ejecuta la actualización inicial. Con
  `onBoot: false`, el arranque omite esa actualización inmediata, pero aun así abre el
  gestor de larga duración cuando se configuran intervalos de actualización o incrustación, para que QMD pueda
  gestionar su observador y temporizadores regulares.
- Las búsquedas usan el `searchMode` configurado (predeterminado: `search`; también admite
  `vsearch` y `query`). `search` solo usa BM25, por lo que OpenClaw omite las pruebas de disponibilidad
  vectorial semántica y el mantenimiento de incrustaciones en ese modo. Si un modo
  falla, OpenClaw reintenta con `qmd query`.
- Cuando `searchMode` es `query`, define `memory.qmd.rerank` como `false` para usar la ruta
  de consulta híbrida de QMD sin el reordenador. OpenClaw pasa `--no-rerank` a la
  ruta directa de la CLI de QMD y `rerank: false` a la herramienta de consulta MCP de QMD. Esta opción
  requiere QMD 2.1 o posterior.
- Con versiones de QMD que anuncian filtros multicolectión, OpenClaw agrupa
  colecciones de la misma fuente en una sola invocación de búsqueda QMD. Las versiones más antiguas de QMD
  mantienen el respaldo compatible por colección.
- Si QMD falla por completo, OpenClaw vuelve al motor SQLite integrado.
  Los intentos repetidos en turnos de chat retroceden brevemente después de un fallo de apertura para que un
  binario ausente o una dependencia rota del proceso auxiliar no cree una tormenta de reintentos;
  `openclaw memory status` y las pruebas puntuales de CLI aún vuelven a comprobar QMD directamente.

<Info>
La primera búsqueda puede ser lenta -- QMD descarga automáticamente modelos GGUF (~2 GB) para
reordenación y expansión de consultas en la primera ejecución de `qmd query`.
</Info>

## Rendimiento de búsqueda y compatibilidad

OpenClaw mantiene la ruta de búsqueda de QMD compatible tanto con instalaciones actuales como antiguas de QMD.

Al iniciar, OpenClaw comprueba el texto de ayuda de QMD instalado una vez por gestor. Si el
binario anuncia compatibilidad con varios filtros de colección, OpenClaw busca en todas las
colecciones de la misma fuente con un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Esto evita iniciar un subproceso de QMD por cada colección de memoria duradera.
Las colecciones de transcripciones de sesión permanecen en su propio grupo de fuente, por lo que las búsquedas mixtas
`memory` + `sessions` aún aportan al diversificador de resultados entrada de ambas
fuentes.

Las compilaciones antiguas de QMD solo aceptan un filtro de colección. Cuando OpenClaw detecta una
de esas compilaciones, mantiene la ruta de compatibilidad y busca en cada colección
por separado antes de fusionar y desduplicar resultados.

Para inspeccionar manualmente el contrato instalado, ejecuta:

```bash
qmd --help | grep -i collection
```

La ayuda actual de QMD dice que los filtros de colección pueden dirigirse a una o más colecciones.
La ayuda antigua suele describir una sola colección.

## Sobrescrituras de modelos

Las variables de entorno de modelos QMD pasan sin cambios desde el proceso del Gateway,
por lo que puedes ajustar QMD globalmente sin agregar nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de incrustaciones, vuelve a ejecutar las incrustaciones para que el índice coincida con el
nuevo espacio vectorial.

## Indexar rutas adicionales

Apunta QMD a directorios adicionales para que se puedan buscar:

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
resultados de búsqueda. `memory_get` entiende este prefijo y lee desde la raíz de colección
correcta.

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

Las transcripciones se exportan como turnos Usuario/Asistente saneados a una colección QMD
dedicada en `~/.openclaw/agents/<id>/qmd/sessions/`.

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

Cuando el alcance deniega una búsqueda, OpenClaw registra una advertencia con el canal derivado y
el tipo de chat para facilitar la depuración de resultados vacíos.

## Citas

Cuando `memory.citations` es `auto` u `on`, los fragmentos de búsqueda incluyen un pie
`Source: <path#line>`. Define `memory.citations = "off"` para omitir el pie
mientras se sigue pasando la ruta al agente internamente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reordenación para resultados de mayor calidad.
- Buscar documentación o notas del proyecto fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones pasadas.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más sencillas, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿No se encuentra QMD?** Asegúrate de que el binario esté en el `PATH` del Gateway. Si OpenClaw
se ejecuta como servicio, crea un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` funciona en tu shell pero OpenClaw aún informa
`spawn qmd ENOENT`, probablemente el proceso del Gateway tiene un `PATH` diferente al de tu
shell interactiva. Fija el binario explícitamente:

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

Usa `command -v qmd` en el entorno donde QMD está instalado y luego vuelve a comprobar
con `openclaw memory status --deep`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF en el primer uso. Precalienta
con `qmd query "test"` usando los mismos directorios XDG que usa OpenClaw.

**¿Muchos subprocesos de QMD durante la búsqueda?** Actualiza QMD si es posible. OpenClaw usa
un proceso para búsquedas multicolectión de la misma fuente solo cuando el QMD instalado
anuncia compatibilidad con varios filtros `-c`; de lo contrario mantiene el respaldo anterior
por colección por corrección.

**¿QMD solo con BM25 sigue intentando compilar llama.cpp?** Define
`memory.qmd.searchMode = "search"`. OpenClaw trata ese modo como solo léxico,
no ejecuta pruebas de estado vectorial de QMD ni mantenimiento de incrustaciones, y deja
las comprobaciones de disponibilidad semántica a configuraciones `vsearch` o `query`.

**¿La búsqueda agota el tiempo de espera?** Aumenta `memory.qmd.limits.timeoutMs` (predeterminado: 4000ms).
Defínelo como `120000` para hardware más lento.

**¿Resultados vacíos en chats de grupo?** Revisa `memory.qmd.scope` -- el valor predeterminado solo
permite sesiones directas y de canal.

**¿La búsqueda de memoria raíz se volvió demasiado amplia de repente?** Reinicia el Gateway o espera a
la próxima reconciliación de arranque. OpenClaw recrea las colecciones gestionadas obsoletas
con los patrones canónicos `MEMORY.md` y `memory/` cuando detecta un conflicto
con el mismo nombre.

**¿Repositorios temporales visibles en el espacio de trabajo causan `ENAMETOOLONG` o indexación rota?**
Actualmente el recorrido de QMD sigue el comportamiento del escáner QMD subyacente en lugar de
las reglas de enlaces simbólicos integradas de OpenClaw. Mantén los checkouts temporales de monorepos en
directorios ocultos como `.tmp/` o fuera de las raíces QMD indexadas hasta que QMD exponga
recorrido seguro ante ciclos o controles de exclusión explícitos.

## Configuración

Para toda la superficie de configuración (`memory.qmd.*`), modos de búsqueda, intervalos de actualización,
reglas de alcance y todos los demás controles, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria Honcho](/es/concepts/memory-honcho)
