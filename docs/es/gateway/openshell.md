---
read_when:
    - Quieres entornos aislados administrados en la nube en lugar de Docker local
    - Estás configurando el plugin OpenShell
    - Debes elegir entre los modos de espacio de trabajo reflejado y remoto.
summary: Usa OpenShell como backend de entorno aislado administrado para los agentes de OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-11T23:08:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell es un backend gestionado de entornos aislados: en lugar de ejecutar contenedores Docker
localmente, OpenClaw delega el ciclo de vida del entorno aislado a la CLI `openshell`, que
aprovisiona entornos remotos y ejecuta comandos mediante SSH.

El plugin reutiliza el mismo transporte SSH y puente del sistema de archivos remoto que el
[backend SSH genérico](/es/gateway/sandboxing#ssh-backend), y añade el ciclo de vida de OpenShell
(`sandbox create/get/delete/ssh-config`), además de un modo opcional `mirror`
de sincronización del espacio de trabajo.

## Requisitos previos

- Plugin de OpenShell instalado (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` en `PATH` (o una ruta personalizada mediante
  `plugins.entries.openshell.config.command`)
- Una cuenta de OpenShell con acceso a entornos aislados
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

Reinicia el Gateway. En el siguiente turno del agente, OpenClaw crea un entorno aislado de OpenShell
y dirige la ejecución de herramientas a través de él. Verifícalo con:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos del espacio de trabajo

Esta es la decisión más importante al usar OpenShell.

### mirror (predeterminado)

`plugins.entries.openshell.config.mode: "mirror"` mantiene el **espacio de trabajo local
como canónico**:

- Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el entorno aislado.
- Después de `exec`, OpenClaw vuelve a sincronizar el espacio de trabajo remoto con el local.
- Las herramientas de archivos operan mediante el puente del entorno aislado, pero el entorno local sigue siendo la fuente de verdad
  entre turnos.

Es la mejor opción para los flujos de trabajo de desarrollo: las ediciones locales realizadas fuera de OpenClaw aparecen en la
siguiente ejecución, y el entorno aislado se comporta de forma similar al backend de Docker.

Desventaja: el coste de carga y descarga en cada turno de ejecución.

### remote

`mode: "remote"` hace que el **espacio de trabajo de OpenShell sea canónico**:

- Cuando se crea por primera vez el entorno aislado, OpenClaw inicializa una vez el espacio de trabajo remoto a partir del local.
- Después, `exec`, `read`, `write`, `edit` y `apply_patch` operan
  directamente en el espacio de trabajo remoto. OpenClaw **no** sincroniza los cambios remotos
  con el entorno local.
- La lectura de contenido multimedia durante la preparación del prompt sigue funcionando (las herramientas de archivos y contenido multimedia leen mediante el
  puente del entorno aislado).

Es la mejor opción para agentes de larga duración y CI: reduce la sobrecarga por turno y las
ediciones locales del host no pueden sobrescribir silenciosamente el estado remoto.

<Warning>
Las ediciones de archivos realizadas en el host fuera de OpenClaw después de la inicialización no son visibles para el entorno aislado remoto. Ejecuta `openclaw sandbox recreate` para volver a inicializarlo.
</Warning>

### Elegir un modo

|                              | `mirror`                              | `remote`                                |
| ---------------------------- | ------------------------------------- | --------------------------------------- |
| **Espacio de trabajo canónico** | Host local                         | OpenShell remoto                        |
| **Dirección de sincronización** | Bidireccional (en cada ejecución)  | Inicialización única                    |
| **Sobrecarga por turno**        | Mayor (carga y descarga)           | Menor (operaciones remotas directas)    |
| **¿Se ven las ediciones locales?** | Sí, en la siguiente ejecución   | No, hasta volver a crear el entorno     |
| **Opción idónea para**          | Flujos de trabajo de desarrollo    | Agentes de larga duración, CI           |

## Referencia de configuración

Toda la configuración de OpenShell se encuentra en `plugins.entries.openshell.config`:

| Clave                     | Tipo                       | Valor predeterminado | Descripción                                                                                       |
| ------------------------- | -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`    | `"mirror"`           | Modo de sincronización del espacio de trabajo                                                     |
| `command`                 | `string`                   | `"openshell"`        | Ruta o nombre de la CLI `openshell`                                                               |
| `from`                    | `string`                   | `"openclaw"`         | Origen del entorno aislado durante la primera creación                                            |
| `gateway`                 | `string`                   | sin definir          | Nombre del gateway de OpenShell (`--gateway` de nivel superior)                                   |
| `gatewayEndpoint`         | `string`                   | sin definir          | Endpoint del gateway de OpenShell (`--gateway-endpoint` de nivel superior)                        |
| `policy`                  | `string`                   | sin definir          | ID de política de OpenShell para crear el entorno aislado                                         |
| `providers`               | `string[]`                 | `[]`                 | Nombres de proveedores asociados al crear el entorno aislado (sin duplicados, una opción `--provider` por entrada) |
| `gpu`                     | `boolean`                  | `false`              | Solicita recursos de GPU (`--gpu`)                                                                |
| `autoProviders`           | `boolean`                  | `true`               | Pasa `--auto-providers` (o `--no-auto-providers` cuando es falso) durante la creación              |
| `remoteWorkspaceDir`      | `string`                   | `"/sandbox"`         | Espacio de trabajo principal con permisos de escritura dentro del entorno aislado                 |
| `remoteAgentWorkspaceDir` | `string`                   | `"/agent"`           | Ruta de montaje del espacio de trabajo del agente (solo lectura cuando el acceso no es `rw`)       |
| `timeoutSeconds`          | `number`                   | `120`                | Tiempo de espera de las operaciones de la CLI `openshell`                                         |

`remoteWorkspaceDir` y `remoteAgentWorkspaceDir` deben ser rutas absolutas y
permanecer bajo las raíces gestionadas `/sandbox` o `/agent`; se rechazan otras rutas
absolutas.

Los ajustes del entorno aislado (`mode`, `scope`, `workspaceAccess`) se encuentran en
`agents.defaults.sandbox`, como con cualquier backend. Consulta
[Entornos aislados](/es/gateway/sandboxing) para ver la matriz completa.

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

### Modo espejo con GPU

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

### OpenShell por agente con un gateway personalizado

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

En el modo `remote`, volver a crear el entorno es especialmente importante: elimina el espacio de trabajo
remoto canónico de ese ámbito, y el siguiente uso inicializa uno nuevo a partir del
entorno local. En el modo `mirror`, volver a crearlo principalmente restablece el entorno de ejecución
remoto, ya que el entorno local sigue siendo canónico.

Vuelve a crear el entorno después de cambiar cualquiera de los siguientes valores:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Refuerzo de la seguridad

El puente del sistema de archivos del modo espejo fija la raíz del espacio de trabajo local y vuelve a comprobar
las rutas canónicas (mediante realpath) antes de cada lectura, escritura, creación de directorio, eliminación y
cambio de nombre, y rechaza los enlaces simbólicos en puntos intermedios de la ruta. Un intercambio de enlaces simbólicos o un espacio de trabajo
montado de nuevo no puede redirigir el acceso a archivos fuera del árbol reflejado.

## Limitaciones actuales

- El navegador del entorno aislado no es compatible con el backend de OpenShell.
- `sandbox.docker.binds` no se aplica a OpenShell; la creación del entorno aislado falla
  si se configuran montajes.
- Los ajustes de ejecución específicos de Docker en `sandbox.docker.*` (excepto `env`)
  solo se aplican al backend de Docker.

## Cómo funciona

1. OpenClaw ejecuta `sandbox get` para el nombre del entorno aislado (con cualquier
   `--gateway`/`--gateway-endpoint` configurado); si falla, crea uno con
   `sandbox create`, pasando `--name`, `--from`, `--policy` cuando esté configurado, `--gpu`
   cuando esté habilitado, `--auto-providers`/`--no-auto-providers` y una
   opción `--provider` por cada proveedor configurado.
2. OpenClaw ejecuta `sandbox ssh-config` para el nombre del entorno aislado y obtiene los
   detalles de conexión SSH.
3. El núcleo escribe la configuración SSH en un archivo temporal y abre una sesión SSH mediante
   el mismo puente del sistema de archivos remoto que el backend SSH genérico.
4. En el modo `mirror`: sincroniza del entorno local al remoto antes de la ejecución, ejecuta y vuelve a sincronizar después.
5. En el modo `remote`: inicializa una vez al crear el entorno y después opera directamente en el espacio de trabajo
   remoto.

## Contenido relacionado

- [Entornos aislados](/es/gateway/sandboxing) - modos, ámbitos y comparación de backends
- [Entorno aislado frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) - depuración de herramientas bloqueadas
- [Entornos aislados y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) - anulaciones por agente
- [CLI de entornos aislados](/es/cli/sandbox) - comandos de `openclaw sandbox`
