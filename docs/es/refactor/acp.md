---
read_when:
    - Refactorización del ciclo de vida de las sesiones de ACP o de la limpieza de procesos de ACPX
    - Depuración de procesos huérfanos de ACPX, reutilización de PID o seguridad de la limpieza con múltiples gateways
    - Cambiar la visibilidad de sessions_list para sesiones de ACP o de subagentes generadas
    - Diseño de metadatos de propiedad para tareas en segundo plano, sesiones ACP o arrendamientos de procesos
sidebarTitle: ACP lifecycle refactor
summary: Plan de migración para explicitar la propiedad de las sesiones ACP y los procesos ACPX
title: Refactorización del ciclo de vida de ACP
x-i18n:
    generated_at: "2026-07-22T10:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bda66f0acc93216c3d9386ca3ebf7f544efd306cd7f53386391f0c48e5dc8f06
    source_path: refactor/acp.md
    workflow: 16
---

El ciclo de vida de ACP funciona actualmente, pero una parte excesiva se infiere a posteriori.
La limpieza de procesos reconstruye la propiedad a partir de PID, cadenas de comandos, rutas de
wrappers y la tabla de procesos activos. La visibilidad de las sesiones reconstruye la propiedad
a partir de cadenas de claves de sesión y consultas secundarias de `sessions.list({ spawnedBy })`.
Esto permite realizar correcciones específicas, pero también facilita que se omitan casos extremos:
la reutilización de PID, los comandos entrecomillados, los procesos nietos del adaptador, las raíces de estado
con varios Gateway, `cancel` frente a `close` y la visibilidad de `tree` frente a `all` se convierten en lugares
independientes donde redescubrir las mismas reglas de propiedad.

Esta refactorización convierte la propiedad en un concepto de primera clase. El objetivo no es una nueva
superficie de producto de ACP, sino un contrato interno más seguro para el comportamiento existente de ACP y ACPX.

## Objetivos

- La limpieza nunca envía señales a un proceso, salvo que la evidencia activa actual coincida con un
  arrendamiento propiedad de OpenClaw.
- `cancel`, `close` y la recolección al iniciar tienen intenciones de ciclo de vida distintas.
- `sessions_list`, `sessions_history`, `sessions_send` y las comprobaciones de estado utilizan
  el mismo modelo de sesiones propiedad del solicitante.
- Las instalaciones con varios Gateway no pueden recolectar los wrappers de ACPX de otras instalaciones.
- Los registros antiguos de sesiones ACPX siguen funcionando durante la migración.
- El entorno de ejecución sigue siendo propiedad del plugin; el núcleo no conoce los detalles del paquete ACPX.

## Fuera de alcance

- Sustituir ACPX o cambiar la superficie pública del comando `/acp`.
- Trasladar al núcleo el comportamiento de los adaptadores ACP específico de proveedores.
- Exigir que los usuarios limpien manualmente el estado antes de actualizar.
- Hacer que `cancel` cierre sesiones ACP reutilizables.

## Modelo objetivo

### Identidad de instancia del Gateway

Cada proceso del Gateway debe tener un identificador estable de instancia del entorno de ejecución:

```ts
type GatewayInstanceId = string;
```

Puede generarse al iniciar el Gateway y persistirse en el estado durante la vida útil de
esa instalación. No es un secreto de seguridad; es un discriminador de propiedad utilizado
para evitar confundir los procesos ACP de un Gateway con los procesos de otro Gateway.

### Propiedad de las sesiones ACP

Cada sesión ACP iniciada debe tener metadatos de propiedad normalizados:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

El Gateway debe devolver estos campos en las filas de sesión donde se conozcan.
El filtrado de visibilidad debe ser una comprobación pura sobre los metadatos de la fila:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Esto elimina las llamadas secundarias ocultas a `sessions.list({ spawnedBy })` de
las comprobaciones de visibilidad. Una sesión ACP hija entre agentes iniciada pertenece al solicitante porque
así lo indica la fila, no porque una segunda consulta consiga encontrarla.

### Arrendamientos de procesos ACPX

Cada ejecución de un wrapper generado debe crear un registro de arrendamiento:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

El proceso del wrapper recibe el identificador del arrendamiento y el identificador de instancia del Gateway como
argumentos portables:

```sh
--openclaw-acpx-lease-id ... --openclaw-gateway-instance-id ...
```

Cuando la plataforma lo permita, la verificación debe priorizar metadatos del proceso activo
que no puedan confundirse debido al entrecomillado de comandos:

- el PID raíz todavía existe
- la ruta activa del wrapper se encuentra bajo `wrapperRoot`
- el grupo de procesos coincide con el arrendamiento cuando está disponible
- los argumentos contienen el identificador de arrendamiento esperado
- el hash del comando o la ruta del ejecutable coincide con el arrendamiento

Si no se puede verificar el proceso activo, la limpieza falla de forma segura.

## Controlador del ciclo de vida

Introducir un único controlador del ciclo de vida de ACPX que sea propietario de los arrendamientos de procesos y de la política
de limpieza:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` solo solicita la cancelación del turno. Nunca debe recolectar procesos reutilizables del wrapper
ni del adaptador.

`closeSession` puede realizar la recolección, pero solo después de cargar el registro de sesión,
cargar el arrendamiento y verificar que el árbol de procesos activo sigue perteneciendo a dicho
arrendamiento.

`reapStartupOrphans` parte de los arrendamientos abiertos en el estado. Puede utilizar la tabla de
procesos para encontrar descendientes, pero no debe examinar primero comandos arbitrarios que parezcan de ACP
y decidir después que probablemente sean propios.

## Contrato del wrapper

Los wrappers generados deben seguir siendo pequeños. Deben:

- iniciar el adaptador en un grupo de procesos cuando sea compatible
- reenviar las señales normales de terminación al grupo de procesos
- detectar la muerte del proceso padre
- cuando muera el proceso padre, enviar SIGTERM y mantener activo el wrapper hasta que se ejecute
  el mecanismo alternativo SIGKILL
- comunicar el PID raíz y el identificador del grupo de procesos al controlador del ciclo de vida cuando
  estén disponibles

Los wrappers no deben decidir la política de sesiones. Solo aplican la limpieza local del árbol de
procesos para su propio grupo de adaptadores.

## Contrato de visibilidad de sesiones

La visibilidad debe utilizar la propiedad normalizada de las filas:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Reglas:

- `self`: solo la sesión del solicitante.
- `tree`: la sesión del solicitante y las filas que le pertenecen o que se iniciaron desde ella.
- `all`: todas las filas del mismo agente, las filas entre agentes permitidas por a2a y las filas
  entre agentes iniciadas que pertenecen al solicitante, incluso cuando a2a general está deshabilitado.
- `agent`: solo el mismo agente, salvo que una relación explícita de propiedad indique que la fila
  pertenece al solicitante.

Esto hace que `tree` y `all` sean monótonos: `all` no debe ocultar una sesión hija propia que
`tree` mostraría.

## Plan de migración

### Fase 1: añadir identidad y arrendamientos

- Añadir `gatewayInstanceId` al estado del Gateway.
- Añadir un almacén de arrendamientos de ACPX bajo el directorio de estado de ACPX.
- Escribir un arrendamiento antes de iniciar un wrapper generado.
- Almacenar `leaseId` en los nuevos registros de sesiones ACPX.
- Conservar los campos existentes de PID y comando para los registros antiguos.

### Fase 2: limpieza basada primero en arrendamientos

- Cambiar la limpieza de cierre para cargar primero `leaseId`.
- Verificar la propiedad del proceso activo con respecto al arrendamiento antes de enviar señales.
- Conservar el mecanismo alternativo actual de PID raíz y raíz del wrapper solo para los registros heredados.
- Marcar los arrendamientos como `closed` después de una limpieza verificada.
- Marcar los arrendamientos como `lost` cuando el proceso haya desaparecido antes de la limpieza.

### Fase 3: recolección al iniciar basada primero en arrendamientos

- La recolección al iniciar examina los arrendamientos abiertos.
- Para cada arrendamiento, verificar el proceso raíz y recopilar los descendientes.
- Recolectar los árboles verificados comenzando por los procesos hijos.
- Expirar los arrendamientos antiguos `closed` y `lost` con un periodo de retención limitado.
- Conservar el análisis de marcadores de comandos solo como mecanismo alternativo heredado temporal, protegido por
  la raíz del wrapper y la instancia del Gateway cuando sea posible.

### Fase 4: filas de propiedad de sesiones

- Añadir metadatos de propiedad a las filas de sesiones del Gateway.
- Adaptar los escritores de ACPX, subagentes, tareas en segundo plano y almacenes de sesiones para que rellenen
  `ownerSessionKey` o `spawnedBy`.
- Convertir las comprobaciones de visibilidad de sesiones para que utilicen los metadatos de las filas.
- Eliminar las consultas secundarias a `sessions.list({ spawnedBy })` durante las comprobaciones de visibilidad.

### Fase 5: eliminar las heurísticas heredadas

Después de un ciclo de lanzamiento:

- dejar de depender de las cadenas almacenadas de comandos raíz para la limpieza de ACPX no heredada
- eliminar los análisis de marcadores de comandos al iniciar
- eliminar las consultas alternativas de listas durante las comprobaciones de visibilidad
- conservar el comportamiento defensivo de fallo seguro para los arrendamientos ausentes o no verificables

## Pruebas

Añadir dos conjuntos de pruebas basados en tablas.

Simulador del ciclo de vida de procesos:

- PID reutilizado por un proceso no relacionado
- PID reutilizado por la raíz del wrapper de otro Gateway
- el comando almacenado del wrapper está entrecomillado para el shell, pero el comando activo de `ps` no
- el proceso hijo del adaptador termina, pero el nieto permanece en el grupo de procesos
- el mecanismo alternativo SIGTERM por muerte del proceso padre llega hasta SIGKILL
- el listado de procesos no está disponible
- arrendamiento obsoleto con proceso ausente
- proceso huérfano al iniciar con wrapper, proceso hijo del adaptador y nieto

Matriz de visibilidad de sesiones:

- `self`, `tree`, `agent`, `all`
- a2a habilitado y deshabilitado
- fila del mismo agente
- fila entre agentes
- fila ACP entre agentes iniciada y propiedad del solicitante
- solicitante en entorno aislado limitado a `tree`
- acciones de listado, historial, envío y estado

La invariante importante: una sesión hija iniciada que pertenece al solicitante es visible siempre que
la visibilidad configurada incluya el árbol de sesiones del solicitante, y `all` no tiene
menos capacidades que `tree`.

## Notas de compatibilidad

Es posible que los registros antiguos de sesiones no tengan `leaseId`. Deben utilizar la ruta de limpieza
heredada de fallo seguro:

- exigir un proceso raíz activo
- exigir la propiedad de la raíz del wrapper cuando se espere un wrapper generado
- exigir concordancia de comandos para raíces que no sean wrappers
- nunca enviar señales basándose únicamente en metadatos obsoletos de PID almacenados

Si no se puede verificar un registro heredado, debe dejarse intacto. La limpieza de arrendamientos al iniciar y
el siguiente ciclo de lanzamiento deberían retirar finalmente el mecanismo alternativo.

## Criterios de éxito

- Cerrar una sesión ACPX antigua u obsoleta no puede terminar el proceso de otro Gateway.
- La muerte del proceso padre no deja en ejecución procesos nietos persistentes del adaptador.
- `cancel` cancela el turno activo sin cerrar las sesiones reutilizables.
- `sessions_list` puede mostrar sesiones ACP hijas entre agentes que pertenecen al solicitante tanto bajo
  `tree` como bajo `all`.
- La limpieza al iniciar se controla mediante arrendamientos, no mediante análisis amplios de cadenas de comandos.
- Las pruebas específicas de la matriz de procesos y visibilidad cubren todos los casos extremos que
  anteriormente requerían correcciones puntuales durante la revisión.
