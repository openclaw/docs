---
read_when:
    - Elegir auto, ask, allowlist, full o deny para los permisos de comandos
    - Configuración de aprobaciones revisadas por Codex Guardian mediante tools.exec.mode
    - Comparación de las aprobaciones de ejecución de OpenClaw con los permisos del arnés ACPX
summary: Modos de permiso para host exec, aprobaciones de Codex Guardian y sesiones de harness ACPX
title: Modos de permiso
x-i18n:
    generated_at: "2026-07-05T11:48:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Los modos de permiso deciden cuánta autoridad tiene un agente antes de ejecutar comandos del host, escribir archivos o pedir acceso adicional a un arnés de backend.

<Note>
  El modo de permiso es independiente de `tools.exec.host=auto`. `tools.exec.host`
  elige dónde se ejecuta un comando. `tools.exec.mode` elige cómo se aprueba
  la ejecución host.
</Note>

## Valor predeterminado recomendado

Usa `auto` para agentes de código que necesitan acceso útil al host sin convertir cada fallo en una solicitud humana:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Luego verifica la política efectiva:

```bash
openclaw exec-policy show
```

## Modos de ejecución host de OpenClaw

`tools.exec.mode` es la superficie de política normalizada para `exec` del host. Cada modo se resuelve en un par subyacente de `security` (rigurosidad de la lista de permitidos) y `ask` (solicitar al fallar):

| Modo        | security / ask          | Comportamiento                                                                               | Úsalo cuando                                           |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `deny`      | `deny` / `off`          | Bloquea por completo la ejecución host.                                                       | No se permiten comandos del host.                     |
| `allowlist` | `allowlist` / `off`     | Ejecuta solo comandos en la lista de permitidos; deniega silenciosamente los fallos.          | Tienes un conjunto de comandos conocido como seguro.  |
| `ask`       | `allowlist` / `on-miss` | Ejecuta coincidencias de la lista de permitidos; pregunta a un humano en los fallos.          | Un humano debe revisar cada comando nuevo.            |
| `auto`      | `allowlist` / `on-miss` | Ejecuta coincidencias de la lista de permitidos; envía los fallos a revisión automática antes de recurrir a la aprobación humana. | Las sesiones de código necesitan acceso práctico y protegido. |
| `full`      | `full` / `off`          | Ejecuta `exec` del host sin solicitudes.                                                      | Este host/sesión de confianza debe omitir las puertas de aprobación. |

`ask` y `auto` comparten la misma configuración de lista de permitidos/solicitud; `auto` además habilita el auto-revisor nativo, que decide los fallos por sí mismo y solo delega a la ruta de aprobación humana configurada cuando no puede aprobar de forma segura.

Para la política completa de ejecución host, el archivo local de aprobaciones, el esquema de la lista de permitidos, los binarios seguros y el comportamiento de reenvío, consulta [Aprobaciones de exec](/es/tools/exec-approvals).

## Asignación de Codex Guardian

Para sesiones nativas del servidor de aplicaciones de Codex, `tools.exec.mode: "auto"` orienta Codex hacia aprobaciones revisadas por Guardian cuando los requisitos locales de Codex lo permiten. Valores resultantes típicos:

| Campo de Codex       | Valor típico      |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

El modo `auto` impone esta política sobre cualquier anulación configurada de sandbox/aprobación de Codex, por lo que no preserva combinaciones heredadas inseguras como `approvalPolicy: "never"` con `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` y `"allowlist"` bloquean por completo la ejecución local del servidor de aplicaciones de Codex. Usa `tools.exec.mode: "full"` solo cuando quieras intencionalmente la postura sin aprobación.

Para la configuración del servidor de aplicaciones, el orden de autenticación y los detalles del runtime nativo de Codex, consulta [Arnés de Codex](/es/plugins/codex-harness).

## Permisos del arnés ACPX

Las sesiones ACPX no son interactivas, por lo que no pueden hacer clic en una solicitud de permiso de TTY. ACPX usa configuraciones separadas a nivel de arnés bajo `plugins.entries.acpx.config`:

| Configuración               | Valores         | Significado                                |
| --------------------------- | --------------- | ------------------------------------------ |
| `permissionMode`            | `approve-reads` | Aprueba automáticamente solo lecturas.     |
| `permissionMode`            | `approve-all`   | Aprueba automáticamente escrituras y comandos de shell. |
| `permissionMode`            | `deny-all`      | Deniega todas las solicitudes de permiso.  |
| `nonInteractivePermissions` | `fail`          | Aborta cuando se requeriría una solicitud. |
| `nonInteractivePermissions` | `deny`          | Deniega la solicitud y continúa cuando sea posible. |

Configura los permisos de ACPX por separado de las aprobaciones de `exec` de OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Usa `approve-all` como el equivalente de emergencia de ACPX para una sesión de arnés sin solicitudes. Para detalles de configuración y modos de fallo, consulta [Configuración de agentes ACP](/es/tools/acp-agents-setup#permission-configuration).

## Elegir un modo

| Objetivo                                      | Configura                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| Bloquear por completo los comandos del host   | `tools.exec.mode: "deny"`                                   |
| Permitir solo comandos conocidos como seguros | `tools.exec.mode: "allowlist"`                              |
| Preguntar a un humano por cada nueva forma de comando | `tools.exec.mode: "ask"`                             |
| Usar la revisión automática de Codex/OpenClaw antes que humanos | `tools.exec.mode: "auto"`                    |
| Omitir por completo las aprobaciones de ejecución host | `tools.exec.mode: "full"` más el archivo de aprobaciones del host correspondiente |
| Hacer que las sesiones ACPX no interactivas escriban/ejecuten | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Si un comando aún solicita aprobación o falla después de cambiar el modo, inspecciona ambas capas:

```bash
openclaw approvals get
openclaw exec-policy show
```

La ejecución host usa el resultado más estricto entre la configuración de OpenClaw y el archivo de aprobaciones local del host. Los permisos del arnés ACPX no relajan las aprobaciones de ejecución host, y las aprobaciones de ejecución host no relajan las solicitudes del arnés ACPX.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Aprobaciones de exec: avanzado](/es/tools/exec-approvals-advanced)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup#permission-configuration)
