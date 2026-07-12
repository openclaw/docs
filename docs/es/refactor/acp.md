---
read_when:
    - Refactorización del ciclo de vida de las sesiones ACP o de la limpieza de procesos ACPX
    - Depuración de procesos huérfanos de ACPX, reutilización de PID o seguridad de limpieza con múltiples Gateway
    - Cambiar la visibilidad de sessions_list para las sesiones de ACP o de subagentes generadas
    - Diseño de metadatos de propiedad para tareas en segundo plano, sesiones ACP o concesiones de procesos
sidebarTitle: ACP lifecycle refactor
summary: Plan de migración para explicitar la propiedad de la sesión ACP y del proceso ACPX
title: Refactorización del ciclo de vida de ACP
x-i18n:
    generated_at: "2026-07-11T23:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

El ciclo de vida de ACP funciona actualmente, pero una parte excesiva se infiere a posteriori.
La limpieza de procesos reconstruye la propiedad a partir de los PID, las cadenas de comandos, las rutas de los wrappers
y la tabla de procesos activos. La visibilidad de las sesiones reconstruye la propiedad
a partir de las cadenas de claves de sesión más consultas secundarias `sessions.list({ spawnedBy })`.
Esto permite correcciones específicas, pero también facilita que se omitan casos límite:
la reutilización de PID, los comandos entrecomillados, los procesos nietos del adaptador, las raíces de estado de varios Gateway,
`cancel` frente a `close`, y la visibilidad `tree` frente a `all` se convierten en lugares distintos
donde redescubrir las mismas reglas de propiedad.

Esta refactorización convierte la propiedad en un concepto de primer nivel. El objetivo no es una nueva superficie de producto ACP,
sino un contrato interno más seguro para el comportamiento existente de ACP y ACPX.

## Objetivos

- La limpieza nunca envía señales a un proceso salvo que la evidencia activa actual coincida con un
  arrendamiento propiedad de OpenClaw.
- `cancel`, `close` y la recolección al inicio tienen intenciones de ciclo de vida distintas.
- `sessions_list`, `sessions_history`, `sessions_send` y las comprobaciones de estado usan
  el mismo modelo de sesiones propiedad del solicitante.
- Las instalaciones con varios Gateway no pueden recolectar los wrappers ACPX de las demás.
- Los registros antiguos de sesiones ACPX siguen funcionando durante la migración.
- El entorno de ejecución sigue siendo propiedad del Plugin; el núcleo no conoce los detalles del paquete ACPX.

## Fuera de alcance

- Sustituir ACPX o cambiar la superficie pública del comando `/acp`.
- Mover al núcleo el comportamiento del adaptador ACP específico del proveedor.
- Exigir que los usuarios limpien manualmente el estado antes de actualizar.
- Hacer que `cancel` cierre sesiones ACP reutilizables.

## Modelo objetivo

### Identidad de la instancia de Gateway

Cada proceso de Gateway debe tener un identificador estable de instancia del entorno de ejecución:

```ts
type GatewayInstanceId = string;
```

Puede generarse al iniciar Gateway y persistirse en el estado durante la vida de
esa instalación. No es un secreto de seguridad; es un discriminador de propiedad que se usa
para evitar confundir los procesos ACP de un Gateway con los de otro.

### Propiedad de sesiones ACP

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

Gateway debe devolver estos campos en las filas de sesión cuando se conozcan.
El filtrado de visibilidad debe ser una comprobación pura sobre los metadatos de la fila:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Esto elimina de las comprobaciones de visibilidad las llamadas secundarias ocultas a `sessions.list({ spawnedBy })`.
Una sesión ACP secundaria iniciada entre agentes es propiedad del solicitante porque
la fila así lo indica, no porque una segunda consulta resulte encontrarla.

### Arrendamientos de procesos ACPX

Cada inicio de wrapper generado debe crear un registro de arrendamiento:

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

El proceso del wrapper debe recibir el identificador del arrendamiento y el identificador de la instancia de Gateway en su
entorno:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Cuando la plataforma lo permita, la verificación debe priorizar metadatos del proceso activo
que no puedan confundirse por el entrecomillado de comandos:

- el PID raíz sigue existiendo
- la ruta activa del wrapper está bajo `wrapperRoot`
- el grupo de procesos coincide con el arrendamiento cuando está disponible
- el entorno contiene el identificador de arrendamiento esperado cuando se puede leer
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

`cancelTurn` solo solicita la cancelación del turno. No debe recolectar procesos de wrappers
ni de adaptadores reutilizables.

`closeSession` puede recolectarlos, pero solo después de cargar el registro de la sesión,
cargar el arrendamiento y verificar que el árbol de procesos activo sigue perteneciendo a ese
arrendamiento.

`reapStartupOrphans` parte de los arrendamientos abiertos del estado. Puede usar la tabla de procesos
para encontrar descendientes, pero no debe buscar primero comandos arbitrarios
que parezcan de ACP y luego decidir que probablemente son nuestros.

## Contrato del wrapper

Los wrappers generados deben seguir siendo pequeños. Deben:

- iniciar el adaptador en un grupo de procesos cuando sea compatible
- reenviar las señales normales de terminación al grupo de procesos
- detectar la muerte del proceso padre
- cuando muera el padre, enviar SIGTERM y mantener después el wrapper activo hasta que se ejecute
  el mecanismo alternativo con SIGKILL
- comunicar el PID raíz y el identificador del grupo de procesos al controlador del ciclo de vida cuando
  estén disponibles

Los wrappers no deben decidir la política de las sesiones. Solo aplican la limpieza local del árbol de procesos
para su propio grupo de adaptadores.

## Contrato de visibilidad de sesiones

La visibilidad debe usar la propiedad normalizada de las filas:

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
- `tree`: la sesión del solicitante más las filas que son propiedad del solicitante o se iniciaron desde ella.
- `all`: todas las filas del mismo agente, las filas entre agentes permitidas por a2a y las filas iniciadas entre agentes
  que sean propiedad del solicitante, incluso cuando a2a general esté deshabilitado.
- `agent`: solo el mismo agente, salvo que una relación de propiedad explícita indique que la fila
  pertenece al solicitante.

Esto hace que `tree` y `all` sean monótonos: `all` no debe ocultar una sesión secundaria propia que
`tree` mostraría.

## Plan de migración

### Fase 1: añadir identidad y arrendamientos

- Añadir `gatewayInstanceId` al estado de Gateway.
- Añadir un almacén de arrendamientos ACPX bajo el directorio de estado de ACPX.
- Escribir un arrendamiento antes de iniciar un wrapper generado.
- Almacenar `leaseId` en los nuevos registros de sesiones ACPX.
- Conservar los campos existentes de PID y comando para los registros antiguos.

### Fase 2: limpieza que prioriza los arrendamientos

- Cambiar la limpieza al cerrar para cargar primero `leaseId`.
- Verificar la propiedad del proceso activo respecto al arrendamiento antes de enviar señales.
- Conservar el mecanismo alternativo actual basado en el PID raíz y la raíz del wrapper solo para registros heredados.
- Marcar los arrendamientos como `closed` después de una limpieza verificada.
- Marcar los arrendamientos como `lost` cuando el proceso haya desaparecido antes de la limpieza.

### Fase 3: recolección al inicio que prioriza los arrendamientos

- La recolección al inicio examina los arrendamientos abiertos.
- Para cada arrendamiento, verificar el proceso raíz y recopilar los descendientes.
- Recolectar los árboles verificados empezando por los procesos secundarios.
- Caducar los arrendamientos `closed` y `lost` antiguos con un periodo de retención limitado.
- Conservar la búsqueda por marcadores de comandos solo como mecanismo alternativo heredado temporal, protegido por
  la raíz del wrapper y la instancia de Gateway cuando sea posible.

### Fase 4: filas de propiedad de sesiones

- Añadir metadatos de propiedad a las filas de sesiones de Gateway.
- Hacer que ACPX, los subagentes, las tareas en segundo plano y los escritores del almacén de sesiones rellenen
  `ownerSessionKey` o `spawnedBy`.
- Convertir las comprobaciones de visibilidad de sesiones para que usen los metadatos de las filas.
- Eliminar de las comprobaciones de visibilidad las consultas secundarias a `sessions.list({ spawnedBy })`.

### Fase 5: eliminar las heurísticas heredadas

Después de un ciclo de publicación:

- dejar de depender de las cadenas almacenadas del comando raíz para la limpieza de ACPX no heredada
- eliminar las búsquedas de marcadores de comandos al inicio
- eliminar las consultas de lista alternativas para la visibilidad
- conservar el comportamiento defensivo de fallo seguro para arrendamientos ausentes o no verificables

## Pruebas

Añadir dos conjuntos de pruebas basadas en tablas.

Simulador del ciclo de vida de procesos:

- PID reutilizado por un proceso no relacionado
- PID reutilizado por la raíz del wrapper de otro Gateway
- el comando almacenado del wrapper está entrecomillado para el shell, pero el comando activo de `ps` no
- el proceso secundario del adaptador termina, pero el proceso nieto permanece en el grupo de procesos
- el mecanismo alternativo SIGTERM tras la muerte del padre llega a SIGKILL
- el listado de procesos no está disponible
- arrendamiento obsoleto cuyo proceso no existe
- proceso huérfano al inicio con wrapper, proceso secundario del adaptador y proceso nieto

Matriz de visibilidad de sesiones:

- `self`, `tree`, `agent`, `all`
- a2a habilitado y deshabilitado
- fila del mismo agente
- fila entre agentes
- fila ACP iniciada entre agentes y propiedad del solicitante
- solicitante en entorno aislado limitado a `tree`
- acciones de listado, historial, envío y estado

La invariante importante: una sesión secundaria iniciada y propiedad del solicitante es visible siempre que
la visibilidad configurada incluya el árbol de sesiones del solicitante, y `all` no tiene
menos capacidades que `tree`.

## Notas de compatibilidad

Es posible que los registros de sesiones antiguos no tengan `leaseId`. Deben usar la ruta de limpieza heredada
de fallo seguro:

- exigir un proceso raíz activo
- exigir la propiedad de la raíz del wrapper cuando se espere un wrapper generado
- exigir que los comandos coincidan para las raíces que no sean wrappers
- nunca enviar señales basándose únicamente en metadatos obsoletos del PID almacenado

Si no se puede verificar un registro heredado, no modificarlo. La limpieza de arrendamientos al inicio y
el siguiente ciclo de publicación deberían retirar finalmente el mecanismo alternativo.

## Criterios de éxito

- Cerrar una sesión ACPX antigua u obsoleta no puede terminar el proceso de otro Gateway.
- La muerte del padre no deja procesos nietos persistentes del adaptador en ejecución.
- `cancel` anula el turno activo sin cerrar las sesiones reutilizables.
- `sessions_list` puede mostrar sesiones ACP secundarias entre agentes y propiedad del solicitante tanto con
  `tree` como con `all`.
- La limpieza al inicio se basa en arrendamientos, no en búsquedas amplias de cadenas de comandos.
- Las pruebas específicas de las matrices de procesos y visibilidad cubren todos los casos límite que
  anteriormente requerían correcciones puntuales durante la revisión.
