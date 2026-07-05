---
read_when:
    - Quieres entornos aislados gestionados en la nube en lugar de Docker local
    - Estás configurando el plugin OpenShell
    - Necesitas elegir entre los modos de espacio de trabajo espejo y remoto
summary: Usar OpenShell como backend de sandbox gestionado para agentes de OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-05T11:19:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell es un backend de sandbox administrado: en lugar de ejecutar contenedores Docker
localmente, OpenClaw delega el ciclo de vida del sandbox a la CLI `openshell`, que
aprovisiona entornos remotos y ejecuta comandos por SSH.

El Plugin reutiliza el mismo transporte SSH y puente de sistema de archivos remoto que el
[backend SSH](/es/gateway/sandboxing#ssh-backend) genérico, y agrega el ciclo de vida de OpenShell
(`sandbox create/get/delete/ssh-config`) más un modo opcional de sincronización de espacio de trabajo
`mirror`.

## Requisitos previos

- Plugin de OpenShell instalado (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` en `PATH` (o una ruta personalizada mediante
  `plugins.entries.openshell.config.command`)
- Una cuenta de OpenShell con acceso a sandbox
- Gateway de OpenClaw ejecutándose en el host

## Inicio rápido

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

Reinicia el Gateway. En el siguiente turno del agente, OpenClaw crea un sandbox de OpenShell
y enruta la ejecución de herramientas a través de él. Verifícalo con:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de espacio de trabajo

Esta es la decisión más importante de OpenShell.

### mirror (predeterminado)

`plugins.entries.openshell.config.mode: "mirror"` mantiene el **espacio de trabajo local
como canónico**:

- Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el sandbox.
- Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al local.
- Las herramientas de archivos pasan por el puente del sandbox, pero lo local sigue siendo la fuente de verdad
  entre turnos.

Ideal para flujos de trabajo de desarrollo: las ediciones locales fuera de OpenClaw aparecen en el
siguiente exec, y el sandbox se comporta de forma similar al backend de Docker.

Compensación: costo de carga y descarga en cada turno de exec.

### remote

`mode: "remote"` hace que el **espacio de trabajo de OpenShell sea canónico**:

- En la primera creación del sandbox, OpenClaw inicializa una vez el espacio de trabajo remoto desde el local.
- Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan
  directamente sobre el espacio de trabajo remoto. OpenClaw **no** sincroniza los cambios remotos
  de vuelta al local.
- Las lecturas de medios durante el prompt siguen funcionando (las herramientas de archivo/medios leen a través del
  puente del sandbox).

Ideal para agentes de larga duración y CI: menor sobrecarga por turno, y las
ediciones locales del host no pueden sobrescribir silenciosamente el estado remoto.

<Warning>
Editar archivos en el host fuera de OpenClaw después de la inicialización inicial es invisible para el sandbox remoto. Ejecuta `openclaw sandbox recreate` para volver a inicializar.
</Warning>

### Elegir un modo

|                          | `mirror`                   | `remote`                         |
| ------------------------ | -------------------------- | -------------------------------- |
| **Espacio de trabajo canónico** | Host local                 | OpenShell remoto                 |
| **Dirección de sincronización** | Bidireccional (cada exec) | Inicialización única             |
| **Sobrecarga por turno** | Mayor (carga + descarga)   | Menor (operaciones remotas directas) |
| **¿Ediciones locales visibles?** | Sí, en el siguiente exec | No, hasta recrear                |
| **Ideal para**           | Flujos de trabajo de desarrollo | Agentes de larga duración, CI   |

## Referencia de configuración

Toda la configuración de OpenShell vive bajo `plugins.entries.openshell.config`:

| Clave                     | Tipo                     | Predeterminado | Descripción                                                                            |
| ------------------------- | ------------------------ | -------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`     | Modo de sincronización del espacio de trabajo                                          |
| `command`                 | `string`                 | `"openshell"`  | Ruta o nombre de la CLI `openshell`                                                    |
| `from`                    | `string`                 | `"openclaw"`   | Origen del sandbox para la primera creación                                            |
| `gateway`                 | `string`                 | sin definir    | Nombre del Gateway de OpenShell (nivel superior `--gateway`)                           |
| `gatewayEndpoint`         | `string`                 | sin definir    | Endpoint del Gateway de OpenShell (nivel superior `--gateway-endpoint`)                |
| `policy`                  | `string`                 | sin definir    | ID de política de OpenShell para la creación del sandbox                               |
| `providers`               | `string[]`               | `[]`           | Nombres de proveedores adjuntos en la creación del sandbox (sin duplicados, una marca `--provider` por entrada) |
| `gpu`                     | `boolean`                | `false`        | Solicitar recursos de GPU (`--gpu`)                                                    |
| `autoProviders`           | `boolean`                | `true`         | Pasar `--auto-providers` (o `--no-auto-providers` cuando sea false) durante la creación |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`   | Espacio de trabajo escribible principal dentro del sandbox                             |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`     | Ruta de montaje del espacio de trabajo del agente (solo lectura cuando el acceso al espacio de trabajo no es `rw`) |
| `timeoutSeconds`          | `number`                 | `120`          | Tiempo de espera para operaciones de la CLI `openshell`                                |

`remoteWorkspaceDir` y `remoteAgentWorkspaceDir` deben ser rutas absolutas y
permanecer bajo las raíces administradas `/sandbox` o `/agent`; se rechazan
otras rutas absolutas.

La configuración de nivel de sandbox (`mode`, `scope`, `workspaceAccess`) vive bajo
`agents.defaults.sandbox` como en cualquier backend. Consulta
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

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Para el modo `remote`, recrear es especialmente importante: elimina el espacio de trabajo
remoto canónico para ese alcance, y el siguiente uso inicializa uno nuevo desde
local. Para el modo `mirror`, recrear principalmente restablece el entorno de ejecución
remoto, ya que lo local sigue siendo canónico.

Recrea después de cambiar cualquiera de estos valores:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Refuerzo de seguridad

El puente de sistema de archivos en modo mirror fija la raíz del espacio de trabajo local y vuelve a comprobar
las rutas canónicas (mediante realpath) antes de cada lectura, escritura, mkdir, eliminación y
cambio de nombre, rechazando enlaces simbólicos en segmentos intermedios de la ruta. Un intercambio de enlace simbólico o un espacio de trabajo remontado
no puede redirigir el acceso a archivos fuera del árbol reflejado.

## Limitaciones actuales

- El navegador de sandbox no es compatible con el backend de OpenShell.
- `sandbox.docker.binds` no se aplica a OpenShell; la creación del sandbox falla
  si hay binds configurados.
- Los controles de runtime específicos de Docker bajo `sandbox.docker.*` (excepto `env`)
  se aplican solo al backend de Docker.

## Cómo funciona

1. OpenClaw ejecuta `sandbox get` para el nombre del sandbox (con cualquier
   `--gateway`/`--gateway-endpoint` configurado); si eso falla, crea uno con
   `sandbox create`, pasando `--name`, `--from`, `--policy` cuando esté definido, `--gpu`
   cuando esté habilitado, `--auto-providers`/`--no-auto-providers`, y una marca
   `--provider` por cada proveedor configurado.
2. OpenClaw ejecuta `sandbox ssh-config` para el nombre del sandbox a fin de obtener los
   detalles de conexión SSH.
3. Core escribe la configuración SSH en un archivo temporal y abre una sesión SSH a través del
   mismo puente de sistema de archivos remoto que el backend SSH genérico.
4. En modo `mirror`: sincroniza local a remoto antes de exec, ejecuta, y sincroniza de vuelta después.
5. En modo `remote`: inicializa una vez al crear y luego opera directamente sobre el espacio de trabajo
   remoto.

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) - modos, alcances y comparación de backends
- [Sandbox frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) - depuración de herramientas bloqueadas
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) - anulaciones por agente
- [CLI de Sandbox](/es/cli/sandbox) - comandos `openclaw sandbox`
