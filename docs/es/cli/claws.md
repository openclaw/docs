---
read_when:
    - Quieres validar un manifiesto de Claw agrupado
    - Quieres previsualizar o añadir un agente desde un Claw
    - Necesita inspeccionar la propiedad, las desviaciones o el comportamiento de limpieza de Claw
summary: Añadir, inspeccionar y eliminar paquetes experimentales de agentes Claw
title: Garras
x-i18n:
    generated_at: "2026-07-22T10:28:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb1dddea9c6c7d6cb91b661e93be83d58f9c91cb289da7e3a70058847fa4ec31
    source_path: cli/claws.md
    workflow: 16
---

# `openclaw claws`

Un Claw es una configuración versionada para un nuevo agente de OpenClaw. Puede describir la
configuración del agente, los archivos del espacio de trabajo, las Skills, los plugins, los servidores MCP y los trabajos
de Cron que necesita ese agente. Un Claw no reemplaza ni modifica un agente existente.

Los Claws son experimentales. Su esquema, la salida de los comandos y su ciclo de vida pueden cambiar.
Habilite explícitamente la superficie de comandos:

```bash
export OPENCLAW_EXPERIMENTAL_CLAWS=1
```

La CLI actual lee un directorio de paquete local o un manifiesto JSON agrupado.
La publicación, búsqueda e instalación de Claws completos mediante ClawHub pertenecen a una
vía de registro independiente y aún no forman parte de esta superficie de comandos.

## Crear un manifiesto agrupado

Comience con un manifiesto JSON de versión 1:

```json
{
  "schemaVersion": 1,
  "agent": {
    "id": "incident-triage",
    "name": "Incident triage",
    "tools": { "deny": ["exec"] }
  },
  "workspace": { "bootstrapFiles": {} },
  "packages": [],
  "mcpServers": {},
  "cronJobs": []
}
```

Las rutas del paquete y del espacio de trabajo deben permanecer dentro de la raíz del paquete. Los manifiestos están
limitados a 1 MiB, los metadatos del paquete a 256 KiB y las fuentes del espacio de trabajo aplican
límites independientes por archivo y agregados. Las fuentes del espacio de trabajo también rechazan
directorios superiores que sean enlaces simbólicos.

Los archivos del espacio de trabajo se declaran por ruta y se leen de archivos auxiliares del paquete. Los archivos de arranque
como `SOUL.md` utilizan entradas con nombre; los archivos adicionales utilizan fuentes relativas
al paquete y destinos relativos al espacio de trabajo:

```json
{
  "workspace": {
    "bootstrapFiles": {
      "SOUL.md": { "source": "workspace/SOUL.md" }
    },
    "files": [
      {
        "source": "workspace/reference/policy.md",
        "path": "reference/policy.md"
      }
    ]
  }
}
```

Las Skills y los plugins utilizan versiones exactas de ClawHub:

```json
{
  "packages": [
    {
      "kind": "skill",
      "source": "clawhub",
      "ref": "incident-triage",
      "version": "1.0.0"
    },
    {
      "kind": "plugin",
      "source": "clawhub",
      "ref": "@acme/audit-plugin",
      "version": "2.0.0"
    }
  ]
}
```

La ejecución de prueba utiliza las rutas de comprobación previa existentes de Skills y plugins para resolver el
artefacto exacto, su integridad y cualquier advertencia de confianza de ClawHub antes del consentimiento. La
advertencia permanece visible en el plan vinculado a la integridad. La aplicación instala los artefactos ausentes
o reutiliza los que coinciden y registra si el Claw introdujo cada recurso o hizo referencia a él.
Los plugins siguen siendo capacidades de OpenClaw para todo el proceso, en lugar de
instalaciones por agente.

## Inspeccionar y previsualizar

Valide la fuente sin planificar cambios locales:

```bash
openclaw claws inspect ./incident-triage.claw.json
```

Previsualice todas las acciones propuestas del ciclo de vida:

```bash
openclaw claws add ./incident-triage.claw.json --dry-run --json
```

El plan informa del agente y el espacio de trabajo derivados, todas las acciones propuestas,
los requisitos previos, los bloqueos, las distintas elevaciones de capacidades y un resumen
`planIntegrity`. Los registros de capacidades muestran el efecto exacto sobre el paquete, MCP, el trabajo programado, el entorno aislado,
las herramientas o Heartbeat. Revise el plan antes de crear el agente:

```bash
openclaw claws add ./incident-triage.claw.json \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

`--yes` por sí solo no es suficiente. OpenClaw reconstruye el plan y rechaza el consentimiento
cuando la fuente, el destino o la configuración activa han cambiado después de la previsualización. Utilice
`--agent-id` o `--workspace` tanto durante la previsualización como durante la aplicación cuando los valores
predeterminados del paquete entren en conflicto con el estado local.

Añadir un Claw crea el nuevo agente y la configuración del espacio de trabajo, escribe los archivos
declarados del espacio de trabajo, instala o reutiliza los artefactos declarados de Skills y plugins, y
registra la procedencia. Los archivos existentes no se sobrescriben y los reintentos se cierran de forma segura
cuando el contenido gestionado ha cambiado. Las etapas posteriores de Claws añaden otros recursos declarados.

## Inspeccionar el estado instalado

```bash
openclaw claws status
openclaw claws status incident-triage --json
```

`status` compara el agente instalado y la procedencia registrada de su espacio de trabajo y sus paquetes
con el estado actual. Informa de instalaciones incompletas, recursos
ausentes y divergencias sin cambiar el estado local.

La procedencia del Claw distingue dos relaciones:

- **Gestionado:** el Claw introdujo el recurso y actualmente lo gestiona. Es un
  candidato para la limpieza cuando no ha cambiado y no queda ningún propietario en conflicto.
- **Referenciado:** el recurso existía de forma independiente o está compartido. La eliminación
  libera la referencia de este Claw y conserva el recurso de forma predeterminada.

Esto no es un recuento de referencias. Los comandos normales de plugins, Skills y agentes mantienen
su comportamiento existente; los Claws añaden procedencia y operaciones protegidas del ciclo de vida
por encima.

## Eliminar un Claw instalado

Previsualice la eliminación antes de seleccionar la limpieza:

```bash
openclaw claws remove incident-triage --dry-run --json
openclaw claws remove incident-triage \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

La opción predeterminada elimina el estado gestionado apto y libera el estado referenciado.
Los archivos modificados y los recursos con otro propietario actual se conservan o
se bloquean. Las opciones de limpieza forman parte del resumen del plan; `--yes` nunca las
amplía. Los plugins instalados globalmente se conservan mientras se libera la referencia de este Claw;
utilice por separado el ciclo de vida normal de los plugins cuando pretenda
desinstalar un plugin para todo el proceso.

Para eliminar referencias sin modificar introducidas por el Claw que no tengan ningún otro
propietario actual, incluya `--remove-unused` tanto en la previsualización como en la aplicación. Para seleccionar en su lugar
recursos referenciados exactos, repita `--remove-referenced`:

```bash
openclaw claws remove incident-triage \
  --dry-run \
  --remove-referenced 'plugin:@acme/audit-plugin@2.0.0'
```

Utilice `--force-referenced` solo después de revisar los dependientes mostrados,
los propietarios independientes y el origen preexistente. Permite la limpieza seleccionada a pesar de
esos conflictos; no omite el consentimiento de integridad del plan.

## Referencia de comandos

| Comando                        | Propósito                                             |
| ------------------------------ | --------------------------------------------------- |
| `claws inspect <source>`       | Validar un directorio de paquete o un manifiesto JSON.      |
| `claws add <source>`           | Previsualizar o crear un nuevo agente y espacio de trabajo.      |
| `claws status [claw-or-agent]` | Informar del estado instalado, la propiedad y las divergencias.       |
| `claws remove <claw-or-agent>` | Previsualizar o eliminar el agente y los recursos aptos. |

Utilice `--json` para obtener una salida experimental legible por máquinas.

## Véase también

- [Agentes](/es/cli/agents)
- [Skills](/es/tools/skills)
- [Plugins](/es/tools/plugin)
