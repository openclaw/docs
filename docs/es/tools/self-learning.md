---
read_when:
    - Quieres que OpenClaw aprenda procedimientos reutilizables a partir de conversaciones completadas
    - Está decidiendo si habilitar las propuestas autónomas de Skills
    - Necesita comprender la seguridad, el coste, la elegibilidad o la solución de problemas del autoaprendizaje
sidebarTitle: Self-learning
summary: Permite que OpenClaw proponga Skills reutilizables a partir de correcciones y trabajos sustanciales completados
title: Autoaprendizaje
x-i18n:
    generated_at: "2026-07-16T12:00:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

El autoaprendizaje permite que OpenClaw convierta evidencias útiles de las conversaciones en propuestas pendientes de
[Skill Workshop](/es/tools/skill-workshop). No entrena los pesos del modelo,
edita Skills activas ni cambia silenciosamente el comportamiento del agente. Cada procedimiento
aprendido permanece pendiente hasta que un operador lo revisa y aplica.

El autoaprendizaje está **deshabilitado de forma predeterminada**. Habilítelo solo cuando una ejecución
adicional del modelo en segundo plano y la revisión de la transcripción sean apropiadas para su espacio de trabajo.

## Habilitar el autoaprendizaje

En la interfaz de control, abra **Plugins → Workshop** y active **Self-learning**. El
cambio surte efecto inmediatamente; cuando otro proceso de escritura de configuración haya actualizado el
archivo, la interfaz de control actualiza la instantánea de configuración y vuelve a intentar cambiar el estado sin
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

- comienza por las sesiones no revisadas más recientes y avanza hacia atrás;
- revisa hasta 20 sesiones sustanciales con al menos seis turnos del modelo;
- omite sesiones de Cron, Heartbeat, enlaces, subagentes, ACP, pertenecientes a Plugins y de revisión
  interna;
- oculta los secretos reconocidos y limita el conjunto de transcripciones antes de enviarlo
  al modelo configurado del agente seleccionado;
- aplica el mismo criterio estricto que la revisión autónoma de experiencias; y
- puede crear o revisar como máximo tres propuestas pendientes, nunca Skills activas.

Workshop informa del recuento acumulado de sesiones, la cobertura de fechas y las ideas encontradas.
Seleccione **Scan earlier work** para consultar el siguiente intervalo anterior. Cuando el cursor alcanza
el principio del historial elegible, la acción cambia a **Scan new work**.
OpenClaw solo conserva los metadatos del cursor y la cobertura en la base de datos de estado compartida;
no crea un segundo archivo de transcripciones.

Las sesiones solo se analizan cuando OpenClaw puede demostrar su propiedad y excluir
el contenido de enlaces externos. Después de una actualización, la transcripción actual anterior a la actualización puede
clasificarse localmente, pero se omiten las transcripciones rotadas anteriores a la actualización sin procedencia
por ejecución. Las transcripciones nuevas conservan esta procedencia tras la rotación.

Los análisis manuales también generan costes del proveedor del modelo y envían el contenido elegible
de las conversaciones al proveedor configurado. Úselos solo cuando esa revisión cumpla los
requisitos de privacidad y tratamiento de datos del espacio de trabajo.

## Qué puede aprender OpenClaw

El autoaprendizaje tiene dos vías conservadoras:

1. **Instrucciones directas y correcciones.** OpenClaw detecta expresiones duraderas
   como «a partir de ahora», «la próxima vez» y correcciones de un enfoque fallido.
   Con el autoaprendizaje habilitado, puede convertir esas señales en propuestas pendientes
   sin esperar otra instrucción. Esta vía determinista puede agrupar instrucciones relacionadas
   en hasta tres propuestas, dirigirlas a una Skill editable del espacio de trabajo
   o revisar su propia propuesta pendiente relacionada. También se ejecuta después de turnos fallidos
   porque captura las instrucciones del usuario en lugar de evaluar su finalización.
2. **Revisión de experiencias.** Después de un turno en primer plano correcto y sustancial,
   OpenClaw puede revisar el trabajo completado en busca de una técnica de recuperación reutilizable o
   un procedimiento estable que elimine al menos dos futuras interacciones de ida y vuelta
   con el modelo o las herramientas.

Entre los buenos candidatos se incluyen:

- una recuperación fiable tras fallos repetidos de herramientas o modelos;
- una restricción de orden no evidente que evitó un error recurrente;
- un flujo de trabajo estable de varios pasos que requirió búsquedas repetidas; o
- una comprobación preliminar reutilizable que evitaría varias llamadas futuras.

El revisor debe abstenerse ante trabajos rutinarios completados correctamente, solicitudes puntuales,
datos personales, preferencias simples, fallos transitorios del entorno, consejos
genéricos, afirmaciones negativas sin fundamento y secretos.

## Cuándo se ejecuta la revisión de experiencias

La revisión de experiencias se retrasa y limita deliberadamente:

- El turno en primer plano debe finalizar correctamente.
- El turno actual debe contener al menos diez iteraciones del modelo.
- Se excluyen las sesiones de Cron, Heartbeat, memoria, desbordamiento, enlaces, subagentes y revisión.
- La ejecución en primer plano debe haber resuelto un proveedor y un modelo, y debe haber tenido realmente
  acceso a `skill_workshop`.
- OpenClaw espera 30 segundos después de finalizar. Una finalización posterior en primer plano dentro
  de la misma sesión reinicia ese período de inactividad.
- Si alguna ejecución de agente o respuesta sigue activa, la revisión espera otros 30 segundos.
- Solo se ejecuta una revisión de experiencias a la vez.
- La revisión retrasada es trabajo local del proceso del Gateway. El Gateway debe seguir ejecutándose
  durante el período de inactividad; los entornos de ejecución locales de una sola ejecución y los basados en la CLI no conservan
  suficiente contexto de la trayectoria y la disponibilidad de herramientas para programarla.

La respuesta en primer plano nunca se retrasa por el aprendizaje. Un turno fallido o no elegible
no inicia la revisión de experiencias, aunque las correcciones directas del usuario pueden
seguir ofreciéndose como sugerencia cuando la autonomía está deshabilitada.

## Qué recibe el revisor

El revisor en segundo plano solo recibe el turno actual, a partir de su mensaje de usuario
más reciente. La trayectoria renderizada se limita a 60,000 caracteres;
cuando es necesario, OpenClaw conserva el primer mensaje y las evidencias más recientes, y
marca el contenido intermedio omitido.

El revisor reutiliza el proveedor y el modelo resueltos. Reutiliza el perfil de
autenticación en primer plano cuando esa identidad está disponible y deshabilita los modelos alternativos. Por tanto, la
revisión inicia una ejecución adicional del modelo en el proveedor configurado.
Esa ejecución puede realizar más de una solicitud al proveedor cuando inspecciona o redacta una
propuesta. Se aplican los precios y las condiciones de tratamiento de datos del proveedor, igual que en el
turno en primer plano.

Antes de comenzar, OpenClaw vuelve a cargar la configuración actual del entorno de ejecución y comprueba de nuevo la
zona protegida efectiva y la política de herramientas de la conversación original. Si la ejecución se realiza
en una zona protegida, la política ya no permite `skill_workshop` o faltan datos necesarios
del entorno de ejecución, la revisión aplica un cierre seguro y no crea nada.

<Warning>
  Habilitar el autoaprendizaje permite que el contenido elegible de la conversación, incluidas las entradas
  y los resultados de las herramientas del turno actual, se envíe al proveedor del modelo seleccionado
  para una revisión adicional. No lo habilite en un espacio de trabajo donde
  esa revisión incumpla los requisitos de tratamiento de datos.
</Warning>

## Seguridad de las propuestas

El revisor se ejecuta en una sesión aislada con un conjunto de herramientas deliberadamente
limitado:

- Solo puede enumerar o inspeccionar propuestas de Workshop y crear o revisar una
  propuesta pendiente.
- No puede actualizar una Skill activa, aplicar una propuesta, rechazarla, ponerla en cuarentena,
  enviar un mensaje ni utilizar herramientas generales del agente.
- Las reanudaciones del modelo comparten un único presupuesto de mutación, por lo que una revisión puede crear o
  revisar como máximo una propuesta.
- La trayectoria revisada se trata como evidencia no fiable, no como instrucciones
  para el agente en segundo plano.
- Skill Workshop analiza el contenido de las propuestas y rechaza las credenciales
  literales reconocidas antes de escribir el estado de la propuesta.

Se siguen aplicando los límites normales de Workshop, incluidos `maxPending`, `maxSkillBytes`,
las restricciones de archivos auxiliares, las comprobaciones del analizador y las escrituras exclusivas en el espacio de trabajo. La
configuración `approvalPolicy: "auto"` no concede al revisor en segundo plano acceso
a las acciones del ciclo de vida.

## Revisar las propuestas aprendidas

El autoaprendizaje produce las mismas propuestas pendientes que el uso manual de Workshop.
Inspecciónelas antes de aplicarlas:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Revise, rechace o ponga en cuarentena las propuestas que sean útiles pero aún no estén listas:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Aplicar es la única operación que escribe una `SKILL.md` activa. Consulte
[Skill Workshop](/es/tools/skill-workshop) para conocer el ciclo de vida y el modelo de almacenamiento
completos.

## Configuración

| Configuración                              | Valor predeterminado | Efecto del autoaprendizaje                                                                                                        |
| ------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Habilita la captura directa de correcciones y la revisión retrasada de experiencias.                                               |
| `skills.workshop.approvalPolicy`           | `"auto"` | Controla las solicitudes de aprobación para las acciones normales del ciclo de vida iniciadas por el agente; no amplía los permisos del revisor en segundo plano. |
| `skills.workshop.maxPending`               | `50`     | Limita las propuestas pendientes y en cuarentena por espacio de trabajo.                                                          |
| `skills.workshop.maxSkillBytes`            | `40000`  | Limita el tamaño del cuerpo de la propuesta en bytes.                                                                              |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Solo afecta al comportamiento de aplicación; el autoaprendizaje escribe el estado de la propuesta, no destinos de Skills activas. |

Para consultar el esquema exhaustivo, los intervalos y la configuración relacionada con las Skills, consulte
[Configuración de Skills](/es/tools/skills-config#workshop-skills-workshop).

## Solución de problemas

### No aparece ninguna propuesta después de un turno largo

Compruebe todo lo siguiente:

1. `skills.workshop.autonomous.enabled` es `true` en la configuración activa del Gateway.
2. El turno finalizó correctamente e incluyó al menos diez iteraciones del modelo después del mensaje
   de usuario más reciente.
3. La conversación fue una ejecución normal en primer plano, no una ejecución programada, de memoria,
   de enlace ni de subagente.
4. La ejecución original tenía acceso a `skill_workshop` y no se realizó en una zona protegida.
5. El sistema permaneció inactivo el tiempo suficiente para la revisión retrasada.
6. El proceso de larga duración del Gateway se mantuvo activo durante el período de inactividad; un
   comando local de una sola ejecución no espera a la revisión retrasada.

Una revisión que reúna los requisitos puede no producir ninguna propuesta. La abstención es el resultado
esperado cuando las evidencias no alcanzan el umbral de procedimiento reutilizable.

### Doctor informa de que la herramienta Workshop está oculta

Cuando el autoaprendizaje está habilitado, `openclaw doctor` comprueba si la política efectiva
de herramientas del agente predeterminado permite `skill_workshop`. Aplique el cambio indicado
en `tools.allow` o `tools.alsoAllow`, o deshabilite el autoaprendizaje.

### Aparecen demasiadas propuestas de poco valor

Deshabilite el autoaprendizaje y continúe utilizando `/learn` o solicitudes explícitas de Workshop:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Las propuestas pendientes siguen disponibles para su revisión después de deshabilitar la función. Deshabilitar
el autoaprendizaje no las aplica, rechaza ni elimina.

## Temas relacionados

- [Taller de Skills](/es/tools/skill-workshop) para la revisión, aprobación y
  almacenamiento de propuestas
- [Creación de Skills](/es/tools/creating-skills) para Skills creadas manualmente y
  la estructura de `SKILL.md`
- [Configuración de Skills](/es/tools/skills-config) para todos los ajustes de `skills.*`
- [CLI de Skills](/es/cli/skills) para los comandos del Taller y del curador
