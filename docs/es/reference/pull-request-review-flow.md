---
read_when:
    - Seguimiento tras los comentarios de Barnacle o ClawSweeper
    - Solicitar una revisión a ClawSweeper
    - Depuración de Barnacle, ClawSweeper, etiquetas obsoletas o cierres automáticos
sidebarTitle: PR review flow
summary: Cómo los comentarios de Barnacle y ClawSweeper ayudan a que los pull requests de OpenClaw avancen en el proceso de revisión.
title: Flujo de revisión de pull requests
x-i18n:
    generated_at: "2026-07-19T02:05:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e9bec4578d55d2279450e991480467946db7da5ca956f85c35b4221190b2babe
    source_path: reference/pull-request-review-flow.md
    workflow: 16
---

Esta página explica el flujo de revisión después de abrir o actualizar un pull
request de OpenClaw: qué hacen Barnacle y ClawSweeper, cómo mejorar el PR a partir
de sus comentarios y qué comprobar cuando la automatización no responde.

Barnacle y ClawSweeper ayudan a los mantenedores a mantener operativa la cola de
revisión. No sustituyen el criterio de los mantenedores.

## Barnacle

Barnacle realiza una clasificación determinista en GitHub. Busca casos conocidos
de gestión de colas y responde mediante etiquetas, comentarios o cierres.

Barnacle puede actuar cuando:

- el cuerpo de un PR está casi vacío o no incluye el contexto del problema;
- un PR no contiene pruebas útiles;
- un cambio que solo afecta a la documentación, las pruebas, la refactorización, la CI o la infraestructura carece de contexto
  vinculado de un mantenedor;
- un cambio parece corresponder a ClawHub o a un plugin en lugar de al núcleo;
- una rama contiene trabajo no relacionado;
- un autor tiene más de 20 PR abiertos.

Barnacle se ejecuta desde código de flujo de trabajo de confianza del repositorio.
No descarga ni ejecuta código de colaboradores.

La mayoría de las etiquetas de enrutamiento son señales para los mantenedores o
la automatización, por lo que los colaboradores no necesitan añadirlas.

## ClawSweeper

ClawSweeper es el bot de revisión y mantenimiento asistido por IA para los
repositorios de OpenClaw. Puede revisar PR, evaluar pruebas, dejar comentarios
de revisión persistentes y ayudar a los mantenedores con flujos protegidos de
reparación o fusión automática.

Un resultado positivo de ClawSweeper constituye una prueba de apoyo, no la
aprobación de un mantenedor. Los mantenedores siguen decidiendo si un PR está
listo para fusionarse y cuándo hacerlo.

ClawSweeper funciona mediante una cola. No se debe esperar una respuesta
inmediata después de abrir un PR, enviar un commit o añadir una solicitud de
revisión. Las actualizaciones de etiquetas posteriores a una ejecución de
ClawSweeper también pueden tardar.

Los PR nuevos entran en la cola de revisión de ClawSweeper. Los mantenedores
también pueden poner en cola flujos de revisión, reparación o fusión automática
mediante etiquetas o comandos. Para las actualizaciones habituales de los
colaboradores, se debe solicitar otra revisión a ClawSweeper únicamente después
de actualizar la rama, la descripción del PR, las pruebas o el código. Después,
se solicita una nueva revisión mediante un comentario nuevo en el PR:

```text
@clawsweeper re-review
```

Los autores de PR también pueden usar `@clawsweeper re-run`; los usuarios con acceso
de escritura al repositorio pueden usar cualquiera de los dos comandos en
cualquier elemento abierto. El comando `@clawsweeper review` sin modificadores está
reservado a los mantenedores. Se debe tener paciencia: volver a solicitarlo antes
de que estén presentes los cambios requeridos solo añade ruido a la cola.

Cuando ClawSweeper inicia conversaciones de revisión, deben tratarse como
comentarios de revisión normales y se debe utilizar la siguiente lista de
comprobación de seguimiento.

Si un colaborador humano o un mantenedor se ha hecho cargo del PR y está
trabajando activamente en él, no se debe invocar a ClawSweeper ni trabajar de
otro modo en el PR al mismo tiempo. Primero se debe dejar que termine la revisión
o reparación humana. Si la actividad se detiene, se debe comprobar si se pidió
al autor que aportara pruebas o realizara otras actualizaciones.

## Mejorar un PR durante la revisión

Cuando Barnacle, ClawSweeper o un mantenedor respondan, se deben utilizar sus
comentarios como lista de comprobación de los siguientes pasos para el PR.

1. Se deben interpretar los `Rank-up moves:` y `Proof guidance:` de ClawSweeper como la lista de acciones
   para ese PR. Las valoraciones y etiquetas son señales de revisión, no objetivos de fusión fijos.
2. Se debe enviar el cambio solicitado en el código o la documentación y actualizar la descripción del PR cuando
   hayan cambiado el problema, la solución, el impacto para los usuarios o las pruebas.
3. Se deben añadir las pruebas solicitadas y utilizar pruebas que correspondan al cambio.
4. Las conversaciones de revisión atendidas deben resolverse personalmente. Solo se debe responder y dejar una
   conversación abierta cuando se necesite el criterio de un mantenedor o revisor.
5. Solo se debe solicitar una nueva revisión después de que la rama, la descripción del PR, las pruebas y
   los resultados relevantes de CI estén actualizados. Es normal que haya varios ciclos de actualización y revisión entre el
   autor, el mantenedor y ClawSweeper.
6. Siempre que sea posible, la conversación debe mantenerse en el PR. Solo se debe trasladar a `#clawtributors` en Discord
   cuando el PR requiera coordinación con los mantenedores, la automatización parezca bloqueada
   o sea difícil tomar la siguiente decisión en los comentarios de GitHub. Se deben incluir el enlace al PR,
   el estado actual y la pregunta concreta o las pruebas pendientes.

El cuerpo del PR debe mantenerse actualizado. Los comentarios facilitan la
conversación, pero la descripción del PR es el resumen persistente que los
mantenedores y la automatización vuelven a consultar.

`status: ⏳ waiting on author` significa que la siguiente acción corresponde al autor del PR:
debe actualizar la rama, la descripción del PR o las pruebas, o responder con el
contexto que falta antes de solicitar otra revisión.

Entre las pruebas útiles se incluyen resultados de pruebas específicas,
resultados de CI, capturas de pantalla, grabaciones, resultados del terminal,
observaciones en vivo, registros censurados o enlaces a artefactos. Para los
cambios visuales, se deben incluir capturas del antes y el después cuando resulte
práctico. Para los archivos de prueba, es preferible enlazar artefactos de CI,
capturas de pantalla o grabaciones subidas a GitHub, o un breve extracto
censurado de un registro. No se deben incorporar al repositorio archivos de
prueba generados, salvo que formen parte del cambio real en la documentación,
las pruebas o el producto.

La censura de datos confidenciales es responsabilidad del colaborador. Se deben
eliminar secretos, tokens, URL privadas, datos de usuarios y registros no
relacionados antes de publicar pruebas.

OpenClaw también utiliza una automatización independiente para elementos
inactivos. Los problemas y PR sin asignar pueden marcarse como inactivos después
de 14 días sin actividad y cerrarse tras otros 7 días de inactividad. Los PR
asignados se marcan como inactivos 27 días después de su apertura,
independientemente de las actualizaciones posteriores, y se cierran después de
7 días de inactividad sin actividad adicional. Si un PR asignado sigue activo,
se debe coordinar con el mantenedor que trabaja en él.

## Cuando la automatización no responde

La automatización puede no responder cuando un mantenedor ya se está ocupando
del elemento, una solicitud de revisión o reparación sigue en la cola, el evento
es rutinario o el canal de ClawSweeper no está configurado para la acción
solicitada.

También puede evitar actuar cuando un flujo de trabajo de confianza tendría que
ejecutar código no fiable de un colaborador. En ese caso, los mantenedores
utilizan una revisión normal o un flujo de trabajo más seguro.

## Solución de problemas

Si ClawSweeper no responde de inmediato, se debe esperar antes de volver a
intentarlo. El servicio funciona mediante una cola, y los comentarios repetidos
o los cambios de etiquetas pueden dificultar la revisión del hilo sin acelerar
la cola.

Antes de solicitar ayuda, se debe comprobar lo siguiente:

- la descripción del PR está actualizada;
- el commit más reciente contiene el cambio solicitado;
- la CI ha terminado, o el cuerpo del PR explica por qué cualquier fallo pendiente
  no está relacionado con el PR;
- la solicitud de revisión más reciente se realizó como comentario en el PR:
  `@clawsweeper re-review`;
- ningún mantenedor o colaborador está trabajando ya activamente en el PR;
- la solicitud más reciente ya no se encuentra dentro del retraso normal de la cola de ClawSweeper.

Si ClawSweeper sigue sin responder varias horas después de que el PR esté
actualizado, o si el PR parece bloqueado por la automatización, se debe pedir
ayuda en `#clawtributors` en Discord. Se deben incluir el enlace al PR, el
resultado esperado, cuándo se realizó la solicitud y qué ha cambiado desde el
último comentario del bot.

## Bifurcar la automatización

Los proyectos que deseen una automatización de revisión similar pueden estudiar
o bifurcar ClawSweeper:

- [openclaw/clawsweeper](https://github.com/openclaw/clawsweeper)
- [Documentación de ClawSweeper](https://clawsweeper.bot/)

## Contenido relacionado

- [Contribuir](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [Pipeline de CI](/es/ci)
