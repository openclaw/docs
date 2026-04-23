---
read_when:
    - Quiere sandboxes gestionados en la nube en lugar de Docker local
    - Está configurando el Plugin de OpenShell
    - Necesita elegir entre los modos de espacio de trabajo mirror y remote
summary: Use OpenShell como backend de sandbox gestionado para agentes de OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T14:03:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell es un backend de sandbox gestionado para OpenClaw. En lugar de ejecutar contenedores Docker localmente, OpenClaw delega el ciclo de vida del sandbox al CLI `openshell`,
que aprovisiona entornos remotos con ejecución de comandos basada en SSH.

El Plugin de OpenShell reutiliza el mismo transporte SSH central y el mismo
puente de sistema de archivos remoto que el [backend SSH](/es/gateway/sandboxing#ssh-backend) genérico. Añade
el ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
y un modo opcional de espacio de trabajo `mirror`.

## Requisitos previos

- El CLI `openshell` instalado y en `PATH` (o configure una ruta personalizada mediante
  `plugins.entries.openshell.config.command`)
- Una cuenta de OpenShell con acceso a sandbox
- OpenClaw Gateway ejecutándose en el host

## Inicio rápido

1. Habilite el plugin y configure el backend de sandbox:

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

2. Reinicie el Gateway. En el siguiente turno del agente, OpenClaw crea un
   sandbox de OpenShell y enruta la ejecución de herramientas a través de él.

3. Verifique:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de espacio de trabajo

Esta es la decisión más importante al usar OpenShell.

### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` cuando quiera que el **espacio de trabajo local
siga siendo el canónico**.

Comportamiento:

- Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el sandbox de OpenShell.
- Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al espacio de trabajo local.
- Las herramientas de archivos siguen operando mediante el puente del sandbox, pero el espacio de trabajo local
  sigue siendo la fuente de verdad entre turnos.

Mejor para:

- Edita archivos localmente fuera de OpenClaw y quiere que esos cambios sean visibles en el
  sandbox automáticamente.
- Quiere que el sandbox de OpenShell se comporte lo más parecido posible al backend de Docker.
- Quiere que el espacio de trabajo del host refleje las escrituras del sandbox después de cada turno de `exec`.

Desventaja: coste adicional de sincronización antes y después de cada `exec`.

### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` cuando quiera que el
**espacio de trabajo de OpenShell pase a ser el canónico**.

Comportamiento:

- Cuando se crea el sandbox por primera vez, OpenClaw inicializa el espacio de trabajo remoto a partir del
  espacio de trabajo local una sola vez.
- Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan
  directamente sobre el espacio de trabajo remoto de OpenShell.
- OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local.
- Las lecturas de medios en tiempo de prompt siguen funcionando porque las herramientas de archivos y medios leen mediante
  el puente del sandbox.

Mejor para:

- El sandbox debe residir principalmente en el lado remoto.
- Quiere menor sobrecarga de sincronización por turno.
- No quiere que ediciones locales del host sobrescriban silenciosamente el estado remoto del sandbox.

Importante: si edita archivos en el host fuera de OpenClaw después de la inicialización inicial,
el sandbox remoto **no** verá esos cambios. Use
`openclaw sandbox recreate` para volver a inicializar.

### Elegir un modo

|                          | `mirror`                          | `remote`                    |
| ------------------------ | --------------------------------- | --------------------------- |
| **Espacio de trabajo canónico** | Host local                        | OpenShell remoto            |
| **Dirección de sincronización** | Bidireccional (cada `exec`)       | Inicialización única        |
| **Sobrecarga por turno**        | Mayor (subida + descarga)         | Menor (ops remotas directas) |
| **¿Ediciones locales visibles?** | Sí, en el siguiente `exec`        | No, hasta `recreate`        |
| **Mejor para**                  | Flujos de trabajo de desarrollo   | Agentes de larga duración, CI |

## Referencia de configuración

Toda la configuración de OpenShell vive bajo `plugins.entries.openshell.config`:

| Clave                     | Tipo                     | Predeterminado | Descripción                                           |
| ------------------------- | ------------------------ | -------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`     | Modo de sincronización del espacio de trabajo         |
| `command`                 | `string`                 | `"openshell"`  | Ruta o nombre del CLI `openshell`                     |
| `from`                    | `string`                 | `"openclaw"`   | Origen del sandbox para la primera creación           |
| `gateway`                 | `string`                 | —              | Nombre del Gateway de OpenShell (`--gateway`)         |
| `gatewayEndpoint`         | `string`                 | —              | URL del endpoint del Gateway de OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —              | ID de política de OpenShell para la creación del sandbox |
| `providers`               | `string[]`               | `[]`           | Nombres de proveedores que se adjuntan al crear el sandbox |
| `gpu`                     | `boolean`                | `false`        | Solicita recursos GPU                                 |
| `autoProviders`           | `boolean`                | `true`         | Pasa `--auto-providers` durante `sandbox create`      |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`   | Espacio de trabajo principal con escritura dentro del sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`     | Ruta de montaje del espacio de trabajo del agente (para acceso de solo lectura) |
| `timeoutSeconds`          | `number`                 | `120`          | Tiempo de espera para operaciones del CLI `openshell` |

Los ajustes a nivel de sandbox (`mode`, `scope`, `workspaceAccess`) se configuran bajo
`agents.defaults.sandbox` como con cualquier backend. Consulte
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

### OpenShell por agente con Gateway personalizado

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

Los sandboxes de OpenShell se gestionan mediante el CLI normal de sandbox:

```bash
# Lista todos los entornos de sandbox (Docker + OpenShell)
openclaw sandbox list

# Inspecciona la política efectiva
openclaw sandbox explain

# Recrea (elimina el espacio de trabajo remoto, reinicializa en el siguiente uso)
openclaw sandbox recreate --all
```

Para el modo `remote`, **recreate es especialmente importante**: elimina el espacio de trabajo remoto
canónico para ese alcance. El siguiente uso inicializa un espacio de trabajo remoto nuevo a partir
del espacio de trabajo local.

Para el modo `mirror`, recreate principalmente restablece el entorno de ejecución remoto porque
el espacio de trabajo local sigue siendo canónico.

### Cuándo recrear

Recree después de cambiar cualquiera de estos:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Fortalecimiento de seguridad

OpenShell fija el fd raíz del espacio de trabajo y vuelve a comprobar la identidad del sandbox antes de cada
lectura, de modo que intercambios de symlinks o un espacio de trabajo remontado no puedan redirigir lecturas fuera del
espacio de trabajo remoto previsto.

## Limitaciones actuales

- El navegador de sandbox no es compatible con el backend OpenShell.
- `sandbox.docker.binds` no se aplica a OpenShell.
- Los ajustes de ejecución específicos de Docker bajo `sandbox.docker.*` se aplican solo al backend
  de Docker.

## Cómo funciona

1. OpenClaw llama a `openshell sandbox create` (con los indicadores `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` según la configuración).
2. OpenClaw llama a `openshell sandbox ssh-config <name>` para obtener los detalles de conexión SSH
   del sandbox.
3. El núcleo escribe la configuración SSH en un archivo temporal y abre una sesión SSH usando el
   mismo puente de sistema de archivos remoto que el backend SSH genérico.
4. En modo `mirror`: sincroniza de local a remoto antes de exec, ejecuta, sincroniza de vuelta después de exec.
5. En modo `remote`: inicializa una vez al crear, luego opera directamente sobre el
   espacio de trabajo remoto.

## Véase también

- [Sandboxing](/es/gateway/sandboxing) -- modos, alcances y comparación de backends
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de herramientas bloqueadas
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- sobrescrituras por agente
- [CLI de sandbox](/es/cli/sandbox) -- comandos `openclaw sandbox`
