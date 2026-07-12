---
read_when:
    - Crear o reorganizar pestañas y widgets del espacio de trabajo
    - Permitir que un agente componga un espacio de trabajo
    - Revisión del modelo de aprobación y aislamiento de widgets personalizados
summary: Espacios de trabajo componibles por agentes en la interfaz de control
title: Espacios de trabajo
x-i18n:
    generated_at: "2026-07-12T14:55:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

La pestaña **Espacios de trabajo** de la [interfaz de control](/es/web/control-ui) es una superficie que usted y sus
agentes organizan conjuntamente. Las pestañas, los widgets, sus posiciones en una cuadrícula de 12 columnas y sus
enlaces de datos se encuentran en un único documento. Cualquier elemento que pueda editar ese documento puede componer
el espacio de trabajo: usted, la CLI `openclaw workspaces` o un agente que invoque herramientas `workspace_*`.

Cada escritura pasa por la misma ruta validada, por lo que el diseño de una persona y el de un agente
no pueden divergir. Cada escritura aceptada incrementa una versión y transmite
`plugin.workspaces.changed`, de modo que la edición de un agente aparece en un navegador que ya esté abierto sin
necesidad de recargar.

## Habilitar los espacios de trabajo

El Plugin de espacios de trabajo incluido está deshabilitado de forma predeterminada. En la interfaz de control, abra **Plugins**,
busque **Espacios de trabajo** y seleccione **Habilitar**. También puede habilitarlo desde la CLI:

```sh
openclaw plugins enable workspaces
```

Al habilitar el Plugin, se añade la pestaña **Espacios de trabajo** y pasan a estar disponibles la CLI
`openclaw workspaces` y las herramientas de agente `workspace_*`. Al deshabilitarlo, se eliminan esas superficies sin
borrar la base de datos de espacios de trabajo ni los recursos de los widgets.

## El espacio de trabajo predeterminado

En la primera carga, se obtiene un espacio de trabajo de **Resumen general**: tarjetas de costes y tokens, estado de la instancia,
sesiones, estado de Cron y un canal de actividad. Es contenido normal del espacio de trabajo: puede arrastrarlo,
contraerlo, ocultarlo o eliminarlo.

## Widgets integrados

El Plugin incluye nueve widgets de confianza que se representan como interfaz propia:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Los widgets declaran los datos mediante **enlaces**; nunca los obtienen por sí mismos:

| Enlace   | Se resuelve como                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | Un valor literal almacenado en el documento (8 KB como máximo).                                           |
| `file`   | Un archivo JSON, Markdown o CSV ubicado en `<stateDir>/workspaces/data/`, opcionalmente delimitado mediante un puntero JSON. |
| `rpc`    | Uno de los métodos de Gateway de solo lectura de una lista fija de permitidos, resuelto por la interfaz de control de confianza. |

El enlace `file` es la forma más sencilla de incorporar sus propios números a un espacio de trabajo: escriba un
archivo JSON en el directorio de datos y haga que una `stat-card` apunte a él.

## Procedencia

Las pestañas y los widgets incluyen una marca `createdBy` —`user`, `system` o `agent:<id>`— definida según
quien haya realizado la escritura. El invocador no puede proporcionarla, por lo que un agente no puede atribuirle
su trabajo, y la insignia «IA» de un widget creado por un agente siempre significa exactamente eso.

## Widgets personalizados

Un agente puede crear un widget HTML real con `workspace_widget_scaffold` (o puede hacerlo usted con
`openclaw workspaces widget-scaffold <name>`). El código creado por agentes se considera hostil:

- Un widget generado se incorpora al registro como **pendiente**. No se crea ningún iframe y la
  ruta de recursos devuelve 404 para sus archivos hasta que un operador lo aprueba.
- La aprobación es una decisión independiente de la edición de un diseño: `workspaces.widget.approve`
  requiere el ámbito `operator.approvals`, el mismo que protege las aprobaciones de ejecución.
- Un widget aprobado se representa en un `<iframe sandbox="allow-scripts">` —nunca
  `allow-same-origin`—, por lo que su origen es opaco y no puede acceder al DOM,
  almacenamiento ni cookies del elemento padre.
- Sus recursos se sirven con `connect-src 'none'`, lo que bloquea las conexiones de red desde scripts, como
  `fetch`, XHR y WebSockets. No contiene credenciales y nunca se comunica con el Gateway.
- Los datos solo le llegan mediante un puente `postMessage` con versión. El código personalizado puede recibir
  los enlaces `static` declarados, que ya son valores del espacio de trabajo creados por un agente
  o un operador. Los enlaces RPC y de archivos permanecen en los widgets integrados de confianza: los navegadores permiten que un
  elemento hijo en un entorno aislado navegue por su propio marco, por lo que los datos privilegiados nunca se envían al
  HTML creado por agentes.

El envío de una indicación al chat desde un widget requiere además una capacidad en el manifiesto, una
confirmación por invocación que cite el texto exacto y está sujeto a un límite de frecuencia.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` necesita un dispositivo emparejado con el ámbito `operator.approvals`; la aprobación desde
la interfaz de control no lo necesita, porque el navegador ya dispone de ese ámbito.

## Almacenamiento

El documento del espacio de trabajo, el registro de widgets personalizados y un historial circular de 20 entradas para deshacer se almacenan en
`<stateDir>/workspaces/workspaces.sqlite`. Los recursos de widgets creados por agentes permanecen en el disco, en
`<stateDir>/workspaces/widgets/<name>/`, y los datos de enlaces de archivos, en
`<stateDir>/workspaces/data/`, porque un agente los crea mediante herramientas de archivos normales y
la ruta del widget sirve sus bytes.
