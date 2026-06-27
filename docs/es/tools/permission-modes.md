---
read_when:
    - Elegir auto, ask, allowlist, full o deny para los permisos de comandos
    - Configuración de aprobaciones revisadas por Codex Guardian mediante tools.exec.mode
    - Comparación de las aprobaciones de ejecución de OpenClaw con los permisos del arnés ACPX
summary: Modos de permiso para exec del host, aprobaciones de Codex Guardian y sesiones de arnés ACPX
title: Modos de permisos
x-i18n:
    generated_at: "2026-06-27T13:07:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Los modos de permisos deciden cuánta autoridad tiene un agente antes de poder ejecutar comandos del host, escribir archivos o pedir acceso adicional a un arnés de backend. Empieza con `tools.exec.mode: "auto"` cuando quieras que OpenClaw use primero listas de permitidos y luego la revisión automática nativa de Codex o una ruta de aprobación humana para los casos no coincidentes.

<Note>
  El modo de permisos es independiente de `tools.exec.host=auto`. `tools.exec.host`
  elige dónde se ejecuta un comando. `tools.exec.mode` elige cómo se aprueba
  el exec del host.
</Note>

## Valor predeterminado recomendado

Usa `auto` para agentes de codificación que necesitan acceso útil al host sin convertir cada caso no coincidente en una solicitud humana:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Luego verifica la política efectiva:

```bash
openclaw exec-policy show
```

En modo `auto`, OpenClaw ejecuta directamente las coincidencias deterministas de la lista de permitidos. Los casos de aprobación no coincidentes pasan primero por el revisor automático nativo de OpenClaw y luego recurren a la ruta de aprobación humana configurada cuando es necesario.

## Modos de exec de host de OpenClaw

`tools.exec.mode` es la superficie de política normalizada para `exec` del host.

| Modo        | Comportamiento                                      | Úsalo cuando                                             |
| ----------- | --------------------------------------------------- | -------------------------------------------------------- |
| `deny`      | Bloquea el exec del host.                           | No se permite ningún comando del host.                   |
| `allowlist` | Ejecuta solo comandos en la lista de permitidos.    | Tienes un conjunto de comandos conocido como seguro.     |
| `ask`       | Ejecuta coincidencias de la lista y pregunta si no coinciden. | Un humano debe revisar comandos nuevos.          |
| `auto`      | Ejecuta coincidencias de la lista y luego usa revisión automática. | Las sesiones de codificación necesitan acceso práctico y protegido. |
| `full`      | Ejecuta exec del host sin solicitudes.              | Este host/sesión de confianza debe omitir las puertas de aprobación. |

Para la política completa de exec del host, el archivo local de aprobaciones, el esquema de lista de permitidos, los binarios seguros y el comportamiento de reenvío, consulta [Aprobaciones de exec](/es/tools/exec-approvals).

## Asignación de Codex Guardian

Para sesiones nativas del servidor de aplicación de Codex, `tools.exec.mode: "auto"` se asigna a aprobaciones revisadas por Codex Guardian cuando los requisitos locales de Codex lo permiten. OpenClaw suele enviar:

| Campo de Codex      | Valor típico      |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

En modo `auto`, OpenClaw no conserva anulaciones inseguras heredadas de Codex, como `approvalPolicy: "never"` o `sandbox: "danger-full-access"`. Usa `tools.exec.mode: "full"` solo cuando quieras intencionalmente la postura sin aprobación.

Para la configuración del servidor de aplicación, el orden de autenticación y los detalles del runtime nativo de Codex, consulta [Arnés de Codex](/es/plugins/codex-harness).

## Permisos del arnés ACPX

Las sesiones ACPX no son interactivas, por lo que no pueden hacer clic en una solicitud de permiso de TTY. ACPX usa ajustes separados a nivel de arnés en `plugins.entries.acpx.config`:

| Ajuste                      | Valor común     | Significado                                  |
| --------------------------- | --------------- | -------------------------------------------- |
| `permissionMode`            | `approve-reads` | Aprueba automáticamente solo las lecturas.   |
| `permissionMode`            | `approve-all`   | Aprueba automáticamente escrituras y comandos de shell. |
| `permissionMode`            | `deny-all`      | Deniega todas las solicitudes de permiso.    |
| `nonInteractivePermissions` | `fail`          | Aborta cuando una solicitud sería necesaria. |
| `nonInteractivePermissions` | `deny`          | Deniega la solicitud y continúa cuando sea posible. |

Configura los permisos de ACPX por separado de las aprobaciones de exec de OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Usa `approve-all` como el equivalente de emergencia de ACPX para una sesión de arnés sin solicitudes. Para detalles de configuración y modos de fallo, consulta [Configuración de agentes ACP](/es/tools/acp-agents-setup#permission-configuration).

## Elegir un modo

| Objetivo                                      | Configura                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| Bloquear completamente los comandos del host  | `tools.exec.mode: "deny"`                                   |
| Permitir solo comandos conocidos como seguros | `tools.exec.mode: "allowlist"`                              |
| Preguntar a un humano por cada forma nueva de comando | `tools.exec.mode: "ask"`                             |
| Usar revisión automática de Codex/OpenClaw antes de humanos | `tools.exec.mode: "auto"`                         |
| Omitir por completo las aprobaciones de exec del host | `tools.exec.mode: "full"` más el archivo de aprobaciones del host correspondiente |
| Hacer que las sesiones ACPX no interactivas escriban/ejecuten | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Si un comando sigue mostrando una solicitud o falla después de cambiar el modo, inspecciona ambas capas:

```bash
openclaw approvals get
openclaw exec-policy show
```

El exec del host usa el resultado más estricto entre la configuración de OpenClaw y el archivo de aprobaciones local del host. Los permisos del arnés ACPX no relajan las aprobaciones de exec del host, y las aprobaciones de exec del host no relajan las solicitudes del arnés ACPX.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Aprobaciones de exec: avanzado](/es/tools/exec-approvals-advanced)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup#permission-configuration)
