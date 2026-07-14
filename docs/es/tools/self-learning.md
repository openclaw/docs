---
read_when:
    - Quiere que OpenClaw aprenda procedimientos reutilizables a partir de conversaciones completadas
    - Está decidiendo si habilitar las propuestas autónomas de Skills
    - Necesita comprender la seguridad, el coste, los requisitos o la resolución de problemas del autoaprendizaje
sidebarTitle: Self-learning
summary: Permite que OpenClaw proponga Skills reutilizables a partir de correcciones y trabajos sustanciales completados
title: Autoaprendizaje
x-i18n:
    generated_at: "2026-07-14T14:12:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b5e6de2452a6f7dfb0042d6185b09fc1fa82dcfd0bc73d4f4cf0632b7900056c
    source_path: tools/self-learning.md
    workflow: 16
---

El autoaprendizaje permite que OpenClaw convierta evidencias útiles de las conversaciones en propuestas pendientes de
[Skill Workshop](/es/tools/skill-workshop). No entrena los pesos del modelo,
edita Skills activas ni cambia silenciosamente el comportamiento del agente. Cada
procedimiento aprendido permanece pendiente hasta que un operador lo revisa y aplica.

El autoaprendizaje está **deshabilitado de forma predeterminada**. Habilítelo solo cuando una ejecución
adicional del modelo en segundo plano y la revisión de la transcripción sean apropiadas para el espacio de trabajo.

## Habilitar el autoaprendizaje

En la interfaz de control, abra **Plugins → Workshop** y active **Self-learning**. El
cambio surte efecto inmediatamente; cuando otro proceso de escritura de configuración ha actualizado el
archivo, la interfaz de control actualiza la instantánea de configuración y vuelve a intentar cambiar la opción sin
recargar la página ni el Gateway.

Use la CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

O edite `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Vuelva a deshabilitarlo con:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

La creación de Skills solicitada por el usuario, `/learn` y las operaciones manuales de Skill Workshop
siguen funcionando mientras el autoaprendizaje está deshabilitado.

## Revisar manualmente sesiones anteriores

La revisión manual del historial es la alternativa conservadora a la captura autónoma.
Abra **Plugins → Workshop** en la interfaz de control y seleccione **Find skill ideas**.
Esto no cambia `skills.workshop.autonomous.enabled`.

Cada análisis:

- comienza con las sesiones no revisadas más recientes y retrocede;
- revisa hasta 20 sesiones sustanciales con al menos seis turnos del modelo;
- omite sesiones de cron, heartbeat, enlaces, subagentes, ACP, propiedad de plugins y revisión interna;
- censura los secretos reconocidos y limita el paquete de transcripciones antes de enviarlo
  al modelo configurado del agente seleccionado;
- aplica el mismo criterio exigente que la revisión autónoma de experiencias; y
- puede crear o revisar como máximo tres propuestas pendientes, nunca Skills activas.

Workshop informa del número acumulado de sesiones, la cobertura de fechas y las ideas encontradas.
Seleccione **Scan earlier work** para acceder a la siguiente ventana anterior. Cuando el cursor llega
al principio del historial apto, la acción cambia a **Scan new work**.
OpenClaw conserva únicamente el cursor y los metadatos de cobertura en la base de datos de estado compartida;
no crea un segundo archivo de transcripciones.

Las sesiones solo se analizan cuando OpenClaw puede demostrar su propiedad y excluir
el contenido de enlaces externos. Tras una actualización, la transcripción actual anterior a la actualización puede
clasificarse localmente, pero se omiten las transcripciones rotadas anteriores a la actualización que carezcan de procedencia
por ejecución. Las transcripciones nuevas conservan esta procedencia después de la rotación.

Los análisis manuales siguen generando costes del proveedor del modelo y envían el contenido apto de la conversación
al proveedor configurado. Úselos solo cuando dicha revisión satisfaga los
requisitos de privacidad y tratamiento de datos del espacio de trabajo.

## Qué puede aprender OpenClaw

El autoaprendizaje tiene dos vías conservadoras:

1. **Instrucciones directas y correcciones.** OpenClaw detecta expresiones duraderas
   como «a partir de ahora», «la próxima vez» y correcciones de un método fallido.
   Con el autoaprendizaje habilitado, puede convertir esas señales en propuestas pendientes
   sin esperar otra indicación. Esta vía determinista puede agrupar instrucciones
   relacionadas en hasta tres propuestas, dirigirse a una Skill editable del espacio de trabajo
   o revisar su propia propuesta pendiente relacionada. También se ejecuta después de turnos fallidos
   porque captura las instrucciones del usuario en lugar de evaluar la finalización.
2. **Revisión de experiencias.** Después de un turno en primer plano correcto y sustancial,
   OpenClaw puede revisar el trabajo completado para encontrar una técnica de recuperación reutilizable o
   un procedimiento estable que eliminaría al menos dos futuros ciclos de ida y vuelta
   del modelo o de las herramientas.

Entre los buenos candidatos se incluyen:

- una recuperación fiable después de fallos repetidos de las herramientas o del modelo;
- una restricción de orden no evidente que evitó un error recurrente;
- un flujo de trabajo estable de varios pasos que requirió búsquedas repetidas; o
- una comprobación previa reutilizable que evitaría varias llamadas futuras.

El revisor debe abstenerse en trabajos correctos rutinarios, solicitudes puntuales,
datos personales, preferencias sencillas, fallos transitorios del entorno, consejos
genéricos, afirmaciones negativas sin respaldo y secretos.

## Cuándo se ejecuta la revisión de experiencias

La revisión de experiencias se retrasa y limita deliberadamente:

- El turno en primer plano debe finalizar correctamente.
- El turno actual debe contener al menos diez iteraciones del modelo.
- Se excluyen las sesiones de cron, heartbeat, memoria, desbordamiento, enlaces, subagentes y revisión.
- La ejecución en primer plano debe haber resuelto un proveedor y un modelo y debe haber tenido realmente
  acceso a `skill_workshop`.
- OpenClaw espera 30 segundos tras la finalización. Una finalización posterior en primer plano dentro de
  la misma sesión reinicia ese período de inactividad.
- Si alguna ejecución de agente o respuesta sigue activa, la revisión espera otros 30 segundos.
- Solo se ejecuta una revisión de experiencias a la vez.
- La revisión retrasada es trabajo del Gateway local al proceso. El Gateway debe seguir ejecutándose
  durante todo el intervalo de inactividad; los entornos de ejecución locales de una sola operación y los respaldados por la CLI no conservan
  suficiente contexto de trayectoria y disponibilidad de herramientas para programarla.

La respuesta en primer plano nunca se retrasa por el aprendizaje. Un turno fallido o no apto
no inicia la revisión de experiencias, aunque las correcciones directas del usuario
pueden seguir ofreciéndose como sugerencia cuando la autonomía está deshabilitada.

## Qué recibe el revisor

El revisor en segundo plano recibe únicamente el turno actual, a partir de su
mensaje de usuario más reciente. La trayectoria renderizada se limita a 60,000 caracteres;
cuando es necesario, OpenClaw conserva el primer mensaje y la evidencia más reciente y
marca la parte central omitida.

El revisor reutiliza el proveedor y el modelo resueltos. Reutiliza el perfil de
autenticación en primer plano cuando esa identidad está disponible y deshabilita las alternativas del modelo. Por tanto, la
revisión inicia una ejecución adicional del modelo en el proveedor configurado.
Esa ejecución puede realizar más de una solicitud al proveedor cuando inspecciona o redacta una
propuesta. Se aplican los precios y las condiciones de tratamiento de datos del proveedor, igual que en el
turno en primer plano.

Antes de comenzar, OpenClaw vuelve a cargar la configuración actual del entorno de ejecución y comprueba de nuevo la
zona de pruebas y la política de herramientas efectivas de la conversación original. Si la ejecución está
en una zona de pruebas, la política ya no permite `skill_workshop` o faltan datos necesarios
del entorno de ejecución, la revisión se cierra de forma segura y no crea nada.

<Warning>
  Habilitar el autoaprendizaje permite que el contenido apto de las conversaciones, incluidas las entradas
  y los resultados de las herramientas del turno actual, se envíe al proveedor del modelo
  seleccionado para una revisión adicional. No lo habilite en un espacio de trabajo donde
  dicha revisión infringiría los requisitos de tratamiento de datos.
</Warning>

## Seguridad de las propuestas

El revisor se ejecuta en una sesión aislada con un conjunto de herramientas
deliberadamente limitado:

- Solo puede enumerar o inspeccionar propuestas de Workshop y crear o revisar una
  propuesta pendiente.
- No puede actualizar una Skill activa, aplicar una propuesta, rechazar una propuesta, poner en cuarentena
  una propuesta, enviar un mensaje ni utilizar herramientas generales del agente.
- Se comparte un único presupuesto de modificación entre los reintentos del modelo, por lo que una revisión puede crear o
  revisar como máximo una propuesta.
- La trayectoria revisada se trata como evidencia no fiable, no como instrucciones
  para el agente en segundo plano.
- Skill Workshop analiza el contenido de las propuestas y rechaza las credenciales literales
  reconocidas antes de escribir el estado de la propuesta.

Se siguen aplicando los límites normales de Workshop, incluidos `maxPending`, `maxSkillBytes`,
las restricciones de archivos auxiliares, las comprobaciones del analizador y las escrituras exclusivas en el espacio de trabajo. La
opción `approvalPolicy: "auto"` no concede al revisor en segundo plano acceso
a las acciones del ciclo de vida.

## Revisar las propuestas aprendidas

El autoaprendizaje genera las mismas propuestas pendientes que el uso manual de Workshop.
Inspecciónelas antes de aplicarlas:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Revise, rechace o ponga en cuarentena las propuestas que sean útiles pero aún no estén listas:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Demasiado específica"
openclaw skills workshop quarantine <proposal-id> --reason "Requiere una revisión de seguridad"
```

Aplicar es la única operación que escribe una `SKILL.md` activa. Consulte
[Skill Workshop](/es/tools/skill-workshop) para obtener información sobre el ciclo de vida completo y el modelo
de almacenamiento.

## Configuración

| Ajuste                                     | Valor predeterminado | Efecto del autoaprendizaje                                                                                                        |
| ------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`     | Habilita la captura directa de correcciones y la revisión retrasada de experiencias.                                               |
| `skills.workshop.approvalPolicy`           | `"pending"` | Controla las solicitudes de aprobación de las acciones normales del ciclo de vida iniciadas por agentes; no amplía los permisos del revisor en segundo plano. |
| `skills.workshop.maxPending`               | `50`        | Limita las propuestas pendientes y en cuarentena por espacio de trabajo.                                                          |
| `skills.workshop.maxSkillBytes`            | `40000`     | Limita el tamaño del cuerpo de las propuestas en bytes.                                                                           |
| `skills.workshop.allowSymlinkTargetWrites` | `false`     | Solo afecta al comportamiento de aplicación; el propio autoaprendizaje escribe el estado de las propuestas, no los destinos de Skills activas. |

Para consultar el esquema completo, los intervalos y las opciones relacionadas con Skills, consulte
[Configuración de Skills](/es/tools/skills-config#workshop-skills-workshop).

## Solución de problemas

### No aparece ninguna propuesta después de un turno largo

Compruebe todo lo siguiente:

1. `skills.workshop.autonomous.enabled` es `true` en la configuración activa del Gateway.
2. El turno finalizó correctamente e incluyó al menos diez iteraciones del modelo después del
   mensaje de usuario más reciente.
3. La conversación fue una ejecución normal en primer plano, no una ejecución programada, de memoria,
   de enlace ni de subagente.
4. La ejecución original tenía acceso a `skill_workshop` y no estaba en una zona de pruebas.
5. El sistema permaneció inactivo el tiempo suficiente para realizar la revisión retrasada.
6. El proceso de larga duración del Gateway permaneció activo durante todo el intervalo de inactividad; un
   comando local de una sola operación no espera a la revisión retrasada.

Es posible que una revisión apta no genere ninguna propuesta. Abstenerse es el resultado
esperado cuando la evidencia no alcanza el nivel exigido para un procedimiento reutilizable.

### Doctor informa de que la herramienta Workshop está oculta

Cuando el autoaprendizaje está habilitado, `openclaw doctor` comprueba si la política
de herramientas efectiva del agente predeterminado permite `skill_workshop`. Siga el cambio
`tools.allow` o `tools.alsoAllow` indicado, o deshabilite el autoaprendizaje.

### Aparecen demasiadas propuestas de poco valor

Deshabilite el autoaprendizaje y continúe utilizando `/learn` o solicitudes explícitas de Workshop:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Las propuestas pendientes siguen pudiendo revisarse después de deshabilitar la función. Deshabilitar
el autoaprendizaje no las aplica, rechaza ni elimina.

## Contenido relacionado

- [Taller de Skills](/es/tools/skill-workshop) para la revisión, aprobación y
  almacenamiento de propuestas
- [Creación de Skills](/es/tools/creating-skills) para Skills creadas manualmente y la
  estructura de `SKILL.md`
- [Configuración de Skills](/es/tools/skills-config) para todos los ajustes de `skills.*`
- [CLI de Skills](/es/cli/skills) para los comandos del Taller y del curador
