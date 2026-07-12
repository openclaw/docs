---
read_when:
    - Necesita encontrar algo que se trató en una sesión anterior
    - Quieres comprender la privacidad o la indexación de la búsqueda de sesiones
summary: Busca en las transcripciones de sesiones anteriores y vuelve a abrir el contexto coincidente
title: Búsqueda de sesiones
x-i18n:
    generated_at: "2026-07-12T14:26:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Búsqueda de sesiones

`sessions_search` busca el texto del usuario y del asistente en las sesiones anteriores propias. Cada resultado
incluye una `sessionKey`, una marca de tiempo, un rol y un breve fragmento coincidente. Pase la
`sessionKey` devuelta a `sessions_history` cuando necesite la conversación circundante.

## Visibilidad y salida

La búsqueda utiliza las mismas reglas de visibilidad de sesiones que `sessions_history`. Los resultados fuera del
árbol de sesiones visible para el llamador se eliminan antes de aplicar los límites de resultados. Los agentes en zona protegida siguen estando limitados
a las sesiones que iniciaron cuando está habilitada la visibilidad de las sesiones iniciadas.

Los fragmentos se redactan antes de devolverse al modelo. Los resultados también están limitados por cantidad, longitud
del fragmento y tamaño total de la respuesta.

## Ciclo de vida del índice

OpenClaw almacena un índice de texto completo junto a las filas de transcripción en la base de datos SQLite de cada agente.
Los mensajes nuevos del usuario y del asistente se indexan en la misma transacción que los conserva, por lo que el
índice nunca queda rezagado respecto de las conversaciones activas; se excluyen los resultados de herramientas, los bloques de razonamiento y las imágenes.
Solo se puede buscar en la rama activa de la transcripción.

Las transcripciones anteriores a la creación del índice (por ejemplo, las sesiones importadas por `openclaw doctor`) y
las sesiones cuya rama activa se haya rebobinado se vuelven a indexar mediante una conciliación en segundo plano que comienza
con la siguiente búsqueda. Por lo tanto, una respuesta con `indexing: true` puede estar incompleta; vuelva a intentarlo después de que
termine la indexación. Al eliminar una sesión, sus entradas del índice se eliminan en la misma transacción.

Actualmente, la búsqueda utiliza el tokenizador de palabras Unicode de SQLite con eliminación de diacríticos. La tokenización por trigramas
para la coincidencia de subcadenas CJK es una mejora futura.

## Búsqueda de sesiones frente a búsqueda en memoria

Use `sessions_search` para buscar palabras o frases exactas en las transcripciones sin procesar de las sesiones. Use
[`memory_search`](/es/concepts/memory-search) para archivos de memoria persistente y recuperación semántica. El
corpus experimental de memoria de sesiones es el complemento semántico de esta búsqueda exacta en transcripciones.
