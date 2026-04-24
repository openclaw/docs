---
read_when:
    - Quieres sandboxes gestionados en la nube en lugar de Docker local
    - Estás configurando el Plugin de OpenShell
    - Necesitas elegir entre los modos de espacio de trabajo mirror y remote
summary: Usa OpenShell como backend de sandbox gestionado para agentes de OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T05:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell es un backend de sandbox gestionado para OpenClaw. En lugar de ejecutar
contenedores Docker localmente, OpenClaw delega el ciclo de vida del sandbox al CLI `openshell`,
que aprovisiona entornos remotos con ejecución de comandos basada en SSH.

El Plugin de OpenShell reutiliza el mismo transporte SSH core y el puente de sistema de archivos remoto
que el [backend SSH](/es/gateway/sandboxing#ssh-backend) genérico. Añade
el ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
y un modo opcional de espacio de trabajo `mirror`.

## Requisitos previos

- El CLI `openshell` instalado y en `PATH` (o establecer una ruta personalizada mediante
  `plugins.entries.openshell.config.command`)
- Una cuenta de OpenShell con acceso a sandbox
- OpenClaw Gateway ejecutándose en el host

## Inicio rápido

1. Habilita el Plugin y establece el backend de sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Reinicia el Gateway. En el siguiente turno del agente, OpenClaw crea un
   sandbox OpenShell y enruta la ejecución de herramientas a través de él.

3. Verifica:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de espacio de trabajo

Esta es la decisión más importante al usar OpenShell.

### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **espacio de trabajo local
siga siendo canónico**.

Comportamiento:

- Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el sandbox OpenShell.
- Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al espacio de trabajo local.
- Las herramientas de archivos siguen operando a través del puente de sandbox, pero el espacio de trabajo local
  sigue siendo la fuente de verdad entre turnos.

Ideal para:

- Editas archivos localmente fuera de OpenClaw y quieres que esos cambios sean visibles en el
  sandbox automáticamente.
- Quieres que el sandbox OpenShell se comporte lo más parecido posible al backend Docker.
- Quieres que el espacio de trabajo del host refleje las escrituras del sandbox después de cada turno `exec`.

Contrapartida: coste adicional de sincronización antes y después de cada `exec`.

### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el
**espacio de trabajo de OpenShell pase a ser canónico**.

Comportamiento:

- Cuando se crea el sandbox por primera vez, OpenClaw siembra el espacio de trabajo remoto a partir del
  espacio de trabajo local una vez.
- Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan
  directamente sobre el espacio de trabajo remoto de OpenShell.
- OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local.
- Las lecturas de medios en tiempo de prompt siguen funcionando porque las herramientas de archivos y medios leen a través
  del puente de sandbox.

Ideal para:

- El sandbox debe vivir principalmente en el lado remoto.
- Quieres menor sobrecarga de sincronización por turno.
- No quieres que las ediciones locales del host sobrescriban silenciosamente el estado remoto del sandbox.

Importante: si editas archivos en el host fuera de OpenClaw después de la siembra inicial,
el sandbox remoto **no** ve esos cambios. Usa
`openclaw sandbox recreate` para volver a sembrarlo.

### Elegir un modo

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Espacio de trabajo canónico** | Host local                 | OpenShell remoto          |
| **Dirección de sincronización** | Bidireccional (cada `exec`) | Siembra única             |
| **Sobrecarga por turno** | Mayor (subida + descarga)  | Menor (operaciones remotas directas) |
| **¿Se ven las ediciones locales?** | Sí, en el siguiente `exec` | No, hasta recrear         |
| **Ideal para**           | Flujos de trabajo de desarrollo | Agentes de larga duración, CI   |

## Referencia de configuración

Toda la configuración de OpenShell vive en `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | Description                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"` | `"mirror"`    | Modo de sincronización del espacio de trabajo         |
| `command`                 | `string`                 | `"openshell"` | Ruta o nombre del CLI `openshell`                     |
| `from`                    | `string`                 | `"openclaw"`  | Origen del sandbox para la creación inicial           |
| `gateway`                 | `string`                 | —             | Nombre del gateway OpenShell (`--gateway`)            |
| `gatewayEndpoint`         | `string`                 | —             | URL del endpoint del gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID de política de OpenShell para creación del sandbox |
| `providers`               | `string[]`               | `[]`          | Nombres de proveedores que se adjuntarán al crear el sandbox |
| `gpu`                     | `boolean`                | `false`       | Solicitar recursos de GPU                             |
| `autoProviders`           | `boolean`                | `true`        | Pasar `--auto-providers` durante la creación del sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Espacio de trabajo principal con escritura dentro del sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ruta de montaje del espacio de trabajo del agente (para acceso de solo lectura) |
| `timeoutSeconds`          | `number`                 | `120`         | Tiempo de espera para operaciones del CLI `openshell` |

Los ajustes a nivel de sandbox (`mode`, `scope`, `workspaceAccess`) se configuran bajo
`agents.defaults.sandbox` como con cualquier backend. Consulta
[Sandboxing](/es/gateway/sandboxing) para ver la matriz completa.

## Ejemplos

### Configuración remota mínima

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Modo mirror con GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell por agente con gateway personalizado

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Gestión del ciclo de vida

Los sandboxes de OpenShell se gestionan mediante la CLI normal de sandbox:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Para el modo `remote`, **recreate es especialmente importante**: elimina el espacio de trabajo remoto
canónico para ese alcance. El siguiente uso siembra un espacio de trabajo remoto nuevo a partir
del espacio de trabajo local.

Para el modo `mirror`, recreate principalmente restablece el entorno de ejecución remoto porque
el espacio de trabajo local sigue siendo canónico.

### Cuándo recrear

Recrea después de cambiar cualquiera de estos:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Refuerzo de seguridad

OpenShell fija el fd raíz del espacio de trabajo y vuelve a comprobar la identidad del sandbox antes de cada
lectura, de modo que cambios de symlink o un espacio de trabajo remontado no puedan redirigir lecturas fuera
del espacio de trabajo remoto previsto.

## Limitaciones actuales

- El navegador de sandbox no es compatible con el backend OpenShell.
- `sandbox.docker.binds` no se aplica a OpenShell.
- Los controles específicos de Docker bajo `sandbox.docker.*` se aplican solo al backend
  Docker.

## Cómo funciona

1. OpenClaw llama a `openshell sandbox create` (con banderas `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` según la configuración).
2. OpenClaw llama a `openshell sandbox ssh-config <name>` para obtener detalles de conexión
   SSH del sandbox.
3. El core escribe la configuración SSH en un archivo temporal y abre una sesión SSH usando el
   mismo puente de sistema de archivos remoto que el backend SSH genérico.
4. En modo `mirror`: sincroniza local a remoto antes de exec, ejecuta, sincroniza de vuelta después de exec.
5. En modo `remote`: siembra una vez en la creación y luego opera directamente sobre el
   espacio de trabajo remoto.

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- modos, alcances y comparación de backends
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de herramientas bloqueadas
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente
- [CLI de sandbox](/es/cli/sandbox) -- comandos `openclaw sandbox`
