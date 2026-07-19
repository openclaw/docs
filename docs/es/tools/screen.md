---
read_when:
    - Se desea que un agente divida, enfoque, cierre o navegue por los paneles de la interfaz de control
    - Quieres que un agente muestre u oculte los paneles de la barra lateral, el terminal o el navegador.
    - Necesitas la capacidad ui.command y el contrato de distribución en abanico
sidebarTitle: Screen
summary: Permitir que un agente organice la interfaz de control conectada
title: Pantalla
x-i18n:
    generated_at: "2026-07-19T02:13:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df2215db96af29fa6b0db8abad79a0a2787a194dab6d00f9ef32f45521907ae1
    source_path: tools/screen.md
    workflow: 16
---

La herramienta `screen` permite que un agente organice la interfaz de control basada en el navegador. Es una
superficie tipada de diseño y navegación, no una herramienta de captura de pantalla ni de
automatización del navegador.

La herramienta solo se expone cuando el cliente de origen anuncia la
capacidad `ui-commands`. Al menos una interfaz de control compatible debe seguir
conectada cuando se ejecute la herramienta; de lo contrario, el Gateway devuelve `UNAVAILABLE`.

## Acciones

| Acción                            | Efecto                                     | Entradas opcionales                                |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| `split_right`                     | Divide hacia la derecha el panel de la sesión de destino | `sessionKey` (de forma predeterminada, la sesión actual) |
| `split_down`                      | Divide hacia abajo el panel de la sesión de destino     | `sessionKey` (de forma predeterminada, la sesión actual) |
| `close_pane`                      | Cierra el panel de la sesión de destino              | `sessionKey` (de forma predeterminada, la sesión actual) |
| `focus`                           | Enfoca el panel de la sesión de destino              | `sessionKey` (de forma predeterminada, la sesión actual) |
| `navigate`                        | Abre la sesión de destino                    | `sessionKey` (de forma predeterminada, la sesión actual) |
| `sidebar_show` / `sidebar_hide`   | Muestra u oculta la barra lateral principal              | -                                              |
| `terminal_show` / `terminal_hide` | Muestra u oculta el panel del terminal del operador   | `dock` (`bottom` o `right`) al mostrarlo      |
| `browser_show` / `browser_hide`   | Muestra u oculta el panel del navegador             | `dock` (`bottom` o `right`) al mostrarlo      |

Un comando correcto devuelve `{ "ok": true }` después de que el Gateway transmita
el evento tipado `ui.command`.

## Enrutamiento y seguridad

El protocolo v1 envía intencionadamente el comando a todas las interfaces de control conectadas que
anuncian `ui-commands`; no se dirige a una sola pestaña del navegador. Esto es importante cuando
el mismo operador tiene abiertos varios paneles.

El RPC del Gateway requiere `operator.write`. La herramienta solo puede cambiar el estado
de presentación: no puede leer píxeles, tomar capturas de pantalla, hacer clic en contenido
arbitrario de la página ni eludir los permisos de los paneles de sesión y del operador
seleccionados.

## Contenido relacionado

- [Interfaz de control](/es/web/control-ui)
- [Protocolo del Gateway](/es/gateway/protocol#method-families)
- [Herramienta de navegador](/es/tools/browser)
