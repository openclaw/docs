---
read_when:
    - Refactorización del ciclo de vida de la sesión ACP o limpieza de procesos ACPX
    - Depuración de procesos huérfanos de ACPX, reutilización de PID o seguridad de limpieza en múltiples Gateway
    - Cambiar la visibilidad de sessions_list para sesiones de ACP o de subagentes generadas
    - Diseño de metadatos de propiedad para tareas en segundo plano, sesiones ACP o concesiones de proceso
sidebarTitle: ACP lifecycle refactor
summary: Plan de migración para hacer explícita la propiedad de la sesión ACP y del proceso ACPX
title: Refactorización del ciclo de vida de ACP
x-i18n:
    generated_at: "2026-05-07T13:24:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

ACP lifecycle funciona actualmente, pero demasiado se infiere después de los hechos.
La limpieza de procesos reconstruye la propiedad a partir de PID, cadenas de comandos, rutas de envoltorios y la tabla de procesos en vivo. La visibilidad de sesiones reconstruye la propiedad a partir de cadenas de claves de sesión más consultas secundarias `sessions.list({ spawnedBy })`.
Eso hace posibles las correcciones estrechas, pero también facilita pasar por alto casos límite:
reutilización de PID, comandos entrecomillados, nietos de adaptadores, raíces de estado de múltiples Gateway,
`cancel` frente a `close`, y visibilidad `tree` frente a `all` se convierten en lugares separados
donde redescubrir las mismas reglas de propiedad.

Esta refactorización convierte la propiedad en un concepto de primera clase. El objetivo no es una nueva superficie de producto ACP;
es un contrato interno más seguro para el comportamiento ACP y ACPX existente.

## Objetivos

- La limpieza nunca envía una señal a un proceso a menos que la evidencia viva actual coincida con un arrendamiento propiedad de OpenClaw.
- `cancel`, `close` y la recolección al inicio tienen intenciones de ciclo de vida distintas.
- `sessions_list`, `sessions_history`, `sessions_send` y las comprobaciones de estado usan
  el mismo modelo de sesión propiedad del solicitante.
- Las instalaciones con múltiples Gateway no pueden recolectar los envoltorios ACPX de otras.
- Los registros antiguos de sesiones ACPX siguen funcionando durante la migración.
- El runtime sigue siendo propiedad del Plugin; core no aprende detalles del paquete ACPX.

## No objetivos

- Reemplazar ACPX o cambiar la superficie pública del comando `/acp`.
- Mover comportamiento de adaptadores ACP específico de proveedores a core.
- Exigir que los usuarios limpien manualmente el estado antes de actualizar.
- Hacer que `cancel` cierre sesiones ACP reutilizables.

## Modelo objetivo

### Identidad de instancia de Gateway

Cada proceso Gateway debería tener un id de instancia de runtime estable:

```ts
type GatewayInstanceId = string;
```

Puede generarse al iniciar Gateway y persistirse en el estado durante la vida de
esa instalación. No es un secreto de seguridad; es un discriminador de propiedad usado
para evitar confundir los procesos ACP de un Gateway con los procesos de otro Gateway.

### Propiedad de sesión ACP

Toda sesión ACP creada debería tener metadatos de propiedad normalizados:

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

El Gateway debería devolver estos campos en las filas de sesión donde se conozcan.
El filtrado de visibilidad debería ser una comprobación pura sobre los metadatos de fila:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Eso elimina llamadas secundarias ocultas `sessions.list({ spawnedBy })` de las
comprobaciones de visibilidad. Un hijo ACP entre agentes generado es propiedad del solicitante porque
la fila lo dice, no porque una segunda consulta lo encuentre por casualidad.

### Arrendamientos de procesos ACPX

Cada lanzamiento de envoltorio generado debería crear un registro de arrendamiento:

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

El proceso del envoltorio debería recibir el id de arrendamiento y el id de instancia de Gateway en su
entorno:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Cuando la plataforma lo permita, la verificación debería preferir metadatos de proceso en vivo
que no puedan confundirse por el entrecomillado de comandos:

- el PID raíz aún existe
- la ruta del envoltorio en vivo está bajo `wrapperRoot`
- el grupo de procesos coincide con el arrendamiento cuando está disponible
- el entorno contiene el id de arrendamiento esperado cuando puede leerse
- el hash del comando o la ruta del ejecutable coincide con el arrendamiento

Si el proceso en vivo no puede verificarse, la limpieza falla cerrada.

## Controlador de ciclo de vida

Introduce un único controlador de ciclo de vida ACPX que posea los arrendamientos de procesos y la
política de limpieza:

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

`cancelTurn` solicita únicamente la cancelación del turno. No debe recolectar procesos
reutilizables de envoltorio o adaptador.

`closeSession` puede recolectar, pero solo después de cargar el registro de sesión,
cargar el arrendamiento y verificar que el árbol de procesos en vivo aún pertenece a ese
arrendamiento.

`reapStartupOrphans` comienza desde arrendamientos abiertos en el estado. Puede usar la tabla de procesos
para encontrar descendientes, pero no debería escanear primero comandos arbitrarios con aspecto ACP
y luego decidir que probablemente son nuestros.

## Contrato del envoltorio

Los envoltorios generados deberían mantenerse pequeños. Deberían:

- iniciar el adaptador en un grupo de procesos donde sea compatible
- reenviar señales normales de terminación al grupo de procesos
- detectar la muerte del padre
- al morir el padre, enviar SIGTERM y luego mantener vivo el envoltorio hasta que se ejecute
  la alternativa SIGKILL
- informar el PID raíz y el id del grupo de procesos al controlador de ciclo de vida cuando
  eso esté disponible

Los envoltorios no deberían decidir la política de sesión. Solo aplican la limpieza local del árbol de procesos
para su propio grupo de adaptador.

## Contrato de visibilidad de sesiones

La visibilidad debería usar propiedad de fila normalizada:

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

- `self`: solo la sesión solicitante.
- `tree`: la sesión solicitante más las filas propiedad del solicitante o generadas desde él.
- `all`: todas las filas del mismo agente, filas entre agentes permitidas por a2a y filas entre agentes
  generadas propiedad del solicitante incluso cuando a2a general está deshabilitado.
- `agent`: solo el mismo agente, salvo que una relación explícita de propietario indique que la fila
  pertenece al solicitante.

Esto hace que `tree` y `all` sean monotónicos: `all` no debe ocultar un hijo propio que
`tree` mostraría.

## Plan de migración

### Fase 1: añadir identidad y arrendamientos

- Añadir `gatewayInstanceId` al estado de Gateway.
- Añadir un almacén de arrendamientos ACPX bajo el directorio de estado de ACPX.
- Escribir un arrendamiento antes de generar un envoltorio.
- Almacenar `leaseId` en los nuevos registros de sesiones ACPX.
- Conservar los campos de PID y comando existentes para registros antiguos.

### Fase 2: limpieza basada primero en arrendamientos

- Cambiar la limpieza de cierre para cargar primero `leaseId`.
- Verificar la propiedad del proceso en vivo contra el arrendamiento antes de enviar señales.
- Conservar el fallback actual de PID raíz y raíz de envoltorio solo para registros heredados.
- Marcar los arrendamientos como `closed` después de una limpieza verificada.
- Marcar los arrendamientos como `lost` cuando el proceso desaparezca antes de la limpieza.

### Fase 3: recolección de inicio basada primero en arrendamientos

- La recolección al inicio escanea arrendamientos abiertos.
- Para cada arrendamiento, verificar el proceso raíz y recopilar descendientes.
- Recolectar árboles verificados de hijos a padre.
- Expirar arrendamientos antiguos `closed` y `lost` con una ventana de retención acotada.
- Conservar el escaneo por marcadores de comando solo como un fallback heredado temporal, protegido por
  la raíz del envoltorio y la instancia de Gateway cuando sea posible.

### Fase 4: filas de propiedad de sesión

- Añadir metadatos de propiedad a las filas de sesión de Gateway.
- Enseñar a los escritores de ACPX, subagente, tarea en segundo plano y almacén de sesiones a poblar
  `ownerSessionKey` o `spawnedBy`.
- Convertir las comprobaciones de visibilidad de sesión para que usen metadatos de fila.
- Eliminar las consultas secundarias `sessions.list({ spawnedBy })` en tiempo de visibilidad.

### Fase 5: eliminar heurísticas heredadas

Después de una ventana de lanzamiento:

- dejar de depender de cadenas de comandos raíz almacenadas para limpieza ACPX no heredada
- eliminar los escaneos de inicio por marcadores de comando
- eliminar las consultas de lista de fallback de visibilidad
- mantener el comportamiento defensivo de fallo cerrado para arrendamientos faltantes o no verificables

## Pruebas

Añade dos suites basadas en tablas.

Simulador de ciclo de vida de procesos:

- PID reutilizado por un proceso no relacionado
- PID reutilizado por la raíz de envoltorio de otro Gateway
- el comando de envoltorio almacenado está entrecomillado por shell, el comando `ps` en vivo no
- el hijo del adaptador sale, el nieto permanece en el grupo de procesos
- el fallback SIGTERM por muerte del padre llega a SIGKILL
- listado de procesos no disponible
- arrendamiento obsoleto con proceso faltante
- huérfano de inicio con envoltorio, hijo adaptador y nieto

Matriz de visibilidad de sesiones:

- `self`, `tree`, `agent`, `all`
- a2a habilitado y deshabilitado
- fila del mismo agente
- fila entre agentes
- fila ACP entre agentes generada propiedad del solicitante
- solicitante en sandbox limitado a `tree`
- acciones de lista, historial, envío y estado

La invariante importante: un hijo generado propiedad del solicitante es visible donde la visibilidad
configurada incluya el árbol de sesión del solicitante, y `all` no es menos capaz que `tree`.

## Notas de compatibilidad

Los registros de sesiones antiguos pueden no tener `leaseId`. Deberían usar la ruta de limpieza heredada
de fallo cerrado:

- requerir un proceso raíz en vivo
- requerir propiedad de raíz de envoltorio cuando se espera un envoltorio generado
- requerir concordancia de comando para raíces que no son envoltorios
- nunca enviar señales basándose solo en metadatos de PID almacenados obsoletos

Si un registro heredado no puede verificarse, déjalo sin cambios. La limpieza de arrendamientos al inicio y
la siguiente ventana de lanzamiento deberían retirar finalmente el fallback.

## Criterios de éxito

- Cerrar una sesión ACPX antigua u obsoleta no puede matar el proceso de otro Gateway.
- La muerte del padre no deja nietos de adaptador persistentes en ejecución.
- `cancel` aborta el turno activo sin cerrar sesiones reutilizables.
- `sessions_list` puede mostrar hijos ACP entre agentes propiedad del solicitante bajo `tree` y `all`.
- La limpieza al inicio está impulsada por arrendamientos, no por escaneos amplios de cadenas de comandos.
- Las pruebas enfocadas de matriz de procesos y visibilidad cubren cada caso límite que
  anteriormente requería correcciones de revisión puntuales.
