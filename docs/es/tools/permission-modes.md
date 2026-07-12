---
read_when:
    - Elegir auto, ask, allowlist, full o deny para los permisos de comandos
    - Configuración de aprobaciones revisadas por Codex Guardian mediante tools.exec.mode
    - Comparación de las aprobaciones de ejecución de OpenClaw con los permisos del entorno ACPX
summary: Modos de permisos para la ejecución en el host, las aprobaciones de Codex Guardian y las sesiones del entorno ACPX
title: Modos de permisos
x-i18n:
    generated_at: "2026-07-11T23:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Los modos de permisos determinan cuánta autoridad tiene un agente antes de ejecutar comandos en el host, escribir archivos o solicitar acceso adicional a un entorno de ejecución de backend.

<Note>
  El modo de permisos es independiente de `tools.exec.host=auto`. `tools.exec.host`
  elige dónde se ejecuta un comando. `tools.exec.mode` determina cómo se aprueba
  la ejecución en el host.
</Note>

## Opción predeterminada recomendada

Use `auto` para agentes de programación que necesiten un acceso útil al host sin convertir cada comando no reconocido en una solicitud a una persona:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

A continuación, compruebe la política efectiva:

```bash
openclaw exec-policy show
```

## Modos de ejecución en el host de OpenClaw

`tools.exec.mode` es la interfaz de política normalizada para `exec` en el host. Cada modo se resuelve en un par subyacente de `security` (nivel de restricción de la lista de permitidos) y `ask` (solicitud cuando no hay coincidencia):

| Modo        | security / ask          | Comportamiento                                                                                                                    | Cuándo usarlo                                                    |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Bloquea por completo la ejecución en el host.                                                                                      | No se permite ningún comando en el host.                         |
| `allowlist` | `allowlist` / `off`     | Ejecuta únicamente los comandos incluidos en la lista de permitidos; deniega silenciosamente los demás.                           | Tiene un conjunto de comandos cuya seguridad conoce.             |
| `ask`       | `allowlist` / `on-miss` | Ejecuta las coincidencias de la lista de permitidos y consulta a una persona cuando no hay coincidencia.                           | Una persona debe revisar cada comando nuevo.                     |
| `auto`      | `allowlist` / `on-miss` | Ejecuta las coincidencias de la lista de permitidos y envía las demás a revisión automática antes de solicitar aprobación humana. | Las sesiones de programación necesitan acceso práctico y seguro. |
| `full`      | `full` / `off`          | Ejecuta comandos en el host sin solicitudes de aprobación.                                                                        | Este host o sesión de confianza debe omitir los controles.       |

`ask` y `auto` comparten la misma configuración de lista de permitidos y solicitudes; `auto` también habilita el revisor automático nativo, que decide por sí mismo sobre los comandos sin coincidencia y solo recurre a la ruta de aprobación humana configurada cuando no puede aprobarlos de forma segura.

Para consultar la política completa de ejecución en el host, el archivo local de aprobaciones, el esquema de la lista de permitidos, los binarios seguros y el comportamiento de reenvío, consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Correspondencia con Codex Guardian

En las sesiones nativas del servidor de aplicaciones de Codex, `tools.exec.mode: "auto"` orienta a Codex hacia aprobaciones revisadas por Guardian cuando los requisitos locales de Codex lo permiten. Valores resultantes habituales:

| Campo de Codex       | Valor habitual    |
| -------------------- | ----------------- |
| `approvalPolicy`     | `on-request`      |
| `approvalsReviewer`  | `auto_review`     |
| `sandbox`            | `workspace-write` |

El modo `auto` impone esta política sobre cualquier anulación configurada del entorno aislado o las aprobaciones de Codex, por lo que no conserva combinaciones inseguras heredadas como `approvalPolicy: "never"` con `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` y `"allowlist"` bloquean por completo la ejecución local del servidor de aplicaciones de Codex. Use `tools.exec.mode: "full"` solo cuando desee intencionadamente una configuración sin aprobaciones.

Para obtener información sobre la configuración del servidor de aplicaciones, el orden de autenticación y el entorno de ejecución nativo de Codex, consulte [Entorno de ejecución de Codex](/es/plugins/codex-harness).

## Permisos del entorno de ejecución ACPX

Las sesiones ACPX no son interactivas, por lo que no pueden aceptar una solicitud de permisos en una TTY. ACPX utiliza una configuración independiente en el nivel del entorno de ejecución, bajo `plugins.entries.acpx.config`:

| Configuración               | Valores         | Significado                                                     |
| --------------------------- | --------------- | --------------------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Aprueba automáticamente solo las lecturas.                      |
| `permissionMode`            | `approve-all`   | Aprueba automáticamente las escrituras y los comandos de shell. |
| `permissionMode`            | `deny-all`      | Deniega todas las solicitudes de permisos.                      |
| `nonInteractivePermissions` | `fail`          | Interrumpe la ejecución cuando se requeriría una solicitud.      |
| `nonInteractivePermissions` | `deny`          | Deniega la solicitud y continúa cuando sea posible.             |

Configure los permisos de ACPX por separado de las aprobaciones de ejecución de OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Use `approve-all` como equivalente de emergencia de ACPX para una sesión del entorno de ejecución sin solicitudes. Para obtener información sobre la configuración y los modos de fallo, consulte [Configuración de agentes ACP](/es/tools/acp-agents-setup#permission-configuration).

## Elección de un modo

| Objetivo                                               | Configuración                                                |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| Bloquear por completo los comandos en el host          | `tools.exec.mode: "deny"`                                    |
| Permitir solo comandos conocidos como seguros          | `tools.exec.mode: "allowlist"`                               |
| Consultar a una persona por cada comando nuevo         | `tools.exec.mode: "ask"`                                     |
| Usar la revisión automática de Codex/OpenClaw primero  | `tools.exec.mode: "auto"`                                    |
| Omitir por completo las aprobaciones de ejecución      | `tools.exec.mode: "full"` más el archivo de aprobaciones correspondiente del host |
| Permitir escritura y ejecución en sesiones ACPX no interactivas | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Si un comando sigue solicitando aprobación o falla después de cambiar el modo, inspeccione ambas capas:

```bash
openclaw approvals get
openclaw exec-policy show
```

La ejecución en el host aplica el resultado más restrictivo entre la configuración de OpenClaw y el archivo local de aprobaciones del host. Los permisos del entorno de ejecución ACPX no flexibilizan las aprobaciones de ejecución en el host, y estas aprobaciones tampoco flexibilizan las solicitudes del entorno de ejecución ACPX.

## Contenido relacionado

- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Aprobaciones de ejecución: configuración avanzada](/es/tools/exec-approvals-advanced)
- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup#permission-configuration)
