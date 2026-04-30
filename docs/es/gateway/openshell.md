---
read_when:
    - Quieres entornos aislados gestionados en la nube en lugar de Docker local
    - Está configurando el Plugin OpenShell
    - Debe elegir entre los modos de espejo y de espacio de trabajo remoto
summary: Usar OpenShell como backend de entorno aislado gestionado para agentes de OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T05:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell es un backend de sandbox gestionado para OpenClaw. En lugar de ejecutar contenedores Docker localmente, OpenClaw delega el ciclo de vida del sandbox en la CLI `openshell`, que aprovisiona entornos remotos con ejecución de comandos basada en SSH.

El Plugin de OpenShell reutiliza el mismo transporte SSH central y el puente de sistema de archivos remoto que el [backend SSH](/es/gateway/sandboxing#ssh-backend) genérico. Añade ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) y un modo de espacio de trabajo `mirror` opcional.

## Requisitos previos

- La CLI `openshell` instalada y en `PATH` (o define una ruta personalizada mediante `plugins.entries.openshell.config.command`)
- Una cuenta de OpenShell con acceso a sandbox
- OpenClaw Gateway ejecutándose en el host

## Inicio rápido

1. Habilita el Plugin y define el backend de sandbox:

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

2. Reinicia el Gateway. En el siguiente turno del agente, OpenClaw crea un sandbox de OpenShell y enruta la ejecución de herramientas a través de él.

3. Verifica:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de espacio de trabajo

Esta es la decisión más importante al usar OpenShell.

### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **espacio de trabajo local siga siendo canónico**.

Comportamiento:

- Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el sandbox de OpenShell.
- Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al espacio de trabajo local.
- Las herramientas de archivos siguen operando mediante el puente de sandbox, pero el espacio de trabajo local sigue siendo la fuente de verdad entre turnos.

Ideal para:

- Editas archivos localmente fuera de OpenClaw y quieres que esos cambios sean visibles automáticamente en el sandbox.
- Quieres que el sandbox de OpenShell se comporte de la forma más parecida posible al backend de Docker.
- Quieres que el espacio de trabajo del host refleje las escrituras del sandbox después de cada turno de exec.

Contrapartida: coste de sincronización adicional antes y después de cada exec.

### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **espacio de trabajo de OpenShell pase a ser canónico**.

Comportamiento:

- Cuando se crea el sandbox por primera vez, OpenClaw inicializa una vez el espacio de trabajo remoto a partir del espacio de trabajo local.
- Después, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente sobre el espacio de trabajo remoto de OpenShell.
- OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local.
- Las lecturas de medios en tiempo de prompt siguen funcionando porque las herramientas de archivos y medios leen mediante el puente de sandbox.

Ideal para:

- El sandbox debe residir principalmente en el lado remoto.
- Quieres menor sobrecarga de sincronización por turno.
- No quieres que las ediciones locales del host sobrescriban silenciosamente el estado del sandbox remoto.

<Warning>
Si editas archivos en el host fuera de OpenClaw después de la inicialización inicial, el sandbox remoto **no** ve esos cambios. Usa `openclaw sandbox recreate` para volver a inicializarlo.
</Warning>

### Elegir un modo

|                          | `mirror`                         | `remote`                       |
| ------------------------ | -------------------------------- | ------------------------------ |
| **Espacio de trabajo canónico** | Host local                       | OpenShell remoto               |
| **Dirección de sincronización** | Bidireccional (cada exec)        | Inicialización única           |
| **Sobrecarga por turno** | Mayor (subida + descarga)        | Menor (operaciones remotas directas) |
| **¿Ediciones locales visibles?** | Sí, en el siguiente exec         | No, hasta recrear              |
| **Ideal para**           | Flujos de desarrollo             | Agentes de larga duración, CI  |

## Referencia de configuración

Toda la configuración de OpenShell se encuentra en `plugins.entries.openshell.config`:

| Clave                     | Tipo                     | Predeterminado | Descripción                                           |
| ------------------------- | ------------------------ | -------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`     | Modo de sincronización del espacio de trabajo         |
| `command`                 | `string`                 | `"openshell"`  | Ruta o nombre de la CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`   | Fuente del sandbox para la primera creación           |
| `gateway`                 | `string`                 | —              | Nombre del gateway de OpenShell (`--gateway`)         |
| `gatewayEndpoint`         | `string`                 | —              | URL del endpoint del gateway de OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —              | ID de política de OpenShell para la creación del sandbox |
| `providers`               | `string[]`               | `[]`           | Nombres de proveedores que se adjuntan al crear el sandbox |
| `gpu`                     | `boolean`                | `false`        | Solicitar recursos de GPU                             |
| `autoProviders`           | `boolean`                | `true`         | Pasar `--auto-providers` durante la creación del sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`   | Espacio de trabajo principal con escritura dentro del sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`     | Ruta de montaje del espacio de trabajo del agente (para acceso de solo lectura) |
| `timeoutSeconds`          | `number`                 | `120`          | Tiempo de espera para operaciones de la CLI `openshell` |

Los ajustes de nivel de sandbox (`mode`, `scope`, `workspaceAccess`) se configuran en `agents.defaults.sandbox`, como con cualquier backend. Consulta [Sandboxing](/es/gateway/sandboxing) para ver la matriz completa.

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

Los sandboxes de OpenShell se gestionan mediante la CLI de sandbox normal:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Para el modo `remote`, **recrear es especialmente importante**: elimina el espacio de trabajo remoto canónico de ese ámbito. El siguiente uso inicializa un espacio de trabajo remoto nuevo a partir del espacio de trabajo local.

Para el modo `mirror`, recrear principalmente restablece el entorno de ejecución remoto porque el espacio de trabajo local sigue siendo canónico.

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

OpenShell fija el fd raíz del espacio de trabajo y vuelve a comprobar la identidad del sandbox antes de cada lectura, por lo que los cambios de enlaces simbólicos o un espacio de trabajo vuelto a montar no pueden redirigir lecturas fuera del espacio de trabajo remoto previsto.

## Limitaciones actuales

- El navegador de sandbox no es compatible con el backend de OpenShell.
- `sandbox.docker.binds` no se aplica a OpenShell.
- Los ajustes de runtime específicos de Docker en `sandbox.docker.*` solo se aplican al backend de Docker.

## Cómo funciona

1. OpenClaw llama a `openshell sandbox create` (con los flags `--from`, `--gateway`, `--policy`, `--providers`, `--gpu` según la configuración).
2. OpenClaw llama a `openshell sandbox ssh-config <name>` para obtener los detalles de conexión SSH del sandbox.
3. Core escribe la configuración SSH en un archivo temporal y abre una sesión SSH usando el mismo puente de sistema de archivos remoto que el backend SSH genérico.
4. En modo `mirror`: sincroniza local a remoto antes de exec, ejecuta y sincroniza de vuelta después de exec.
5. En modo `remote`: inicializa una vez al crear y luego opera directamente sobre el espacio de trabajo remoto.

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- modos, ámbitos y comparación de backend
- [Sandbox vs Política de herramientas vs Elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de herramientas bloqueadas
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente
- [CLI de sandbox](/es/cli/sandbox) -- comandos `openclaw sandbox`
