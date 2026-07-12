---
read_when:
    - Configuración de flujos de trabajo de agentes autónomos que se ejecutan sin indicaciones para cada tarea
    - Definir qué puede hacer el agente de forma independiente y qué requiere aprobación humana
    - Estructuración de agentes multiprograma con límites claros y reglas de escalamiento
summary: Defina la autoridad operativa permanente para programas de agentes autónomos
title: Órdenes permanentes
x-i18n:
    generated_at: "2026-07-11T22:51:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Las órdenes permanentes otorgan a tu agente **autoridad operativa permanente** para programas definidos. En lugar de indicarle al agente cada tarea, defines programas con un alcance, desencadenadores y reglas de escalamiento claros, y el agente actúa de forma autónoma dentro de esos límites: «Eres responsable del informe semanal. Compílalo cada viernes, envíalo y escala la situación solo si algo parece incorrecto».

## Por qué usar órdenes permanentes

**Sin órdenes permanentes:** le indicas al agente cada tarea, el trabajo rutinario se olvida o se retrasa y tú te conviertes en el cuello de botella.

**Con órdenes permanentes:** el agente actúa de forma autónoma dentro de límites definidos, el trabajo rutinario se realiza según lo previsto y tú solo intervienes para gestionar excepciones y aprobaciones.

## Cómo funcionan

Las órdenes permanentes se definen en los archivos de tu [espacio de trabajo del agente](/es/concepts/agent-workspace). El enfoque recomendado consiste en incluirlas directamente en `AGENTS.md` (que se inyecta automáticamente en cada sesión) para que el agente siempre las tenga en contexto. Para configuraciones más amplias, también puedes colocarlas en un archivo dedicado, como `standing-orders.md`, y hacer referencia a él desde `AGENTS.md`.

Cada programa especifica:

1. **Alcance**: qué está autorizado a hacer el agente
2. **Desencadenadores**: cuándo debe ejecutarse (programación, evento o condición)
3. **Puntos de aprobación**: qué requiere la autorización de una persona antes de actuar
4. **Reglas de escalamiento**: cuándo detenerse y pedir ayuda

El agente carga estas instrucciones en cada sesión mediante los archivos de arranque del espacio de trabajo (consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) para ver la lista completa de archivos inyectados automáticamente) y actúa conforme a ellas, en combinación con [tareas Cron](/es/automation/cron-jobs) para garantizar la ejecución basada en el tiempo.

<Tip>
Incluye las órdenes permanentes en `AGENTS.md` para garantizar que se carguen en cada sesión. El arranque del espacio de trabajo inyecta automáticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y `MEMORY.md`, pero no archivos arbitrarios de subdirectorios.
</Tip>

## Anatomía de una orden permanente

```markdown
## Programa: Informe semanal de estado

**Autoridad:** Recopilar datos, generar el informe y entregarlo a las partes interesadas
**Desencadenador:** Cada viernes a las 4 p. m. (garantizado mediante una tarea Cron)
**Punto de aprobación:** Ninguno para los informes estándar. Marcar las anomalías para su revisión por una persona.
**Escalamiento:** Si la fuente de datos no está disponible o las métricas parecen inusuales (>2σ respecto de la norma)

### Pasos de ejecución

1. Obtener las métricas de las fuentes configuradas
2. Compararlas con la semana anterior y los objetivos
3. Generar el informe en Reports/weekly/YYYY-MM-DD.md
4. Entregar el resumen mediante el canal configurado
5. Registrar la finalización en Agent/Logs/

### Qué NO hacer

- No enviar informes a partes externas
- No modificar los datos de origen
- No omitir la entrega si las métricas son desfavorables; informar con precisión
```

## Órdenes permanentes junto con tareas Cron

Las órdenes permanentes definen **qué** está autorizado a hacer el agente. Las [tareas Cron](/es/automation/cron-jobs) definen **cuándo** ocurre. Funcionan en conjunto:

```text
Orden permanente: «Eres responsable de la clasificación diaria de la bandeja de entrada»
    ↓
Tarea Cron (todos los días a las 8 a. m.): «Ejecutar la clasificación de la bandeja de entrada según las órdenes permanentes»
    ↓
Agente: Lee las órdenes permanentes → ejecuta los pasos → informa de los resultados
```

La instrucción de la tarea Cron debe hacer referencia a la orden permanente en lugar de duplicarla:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Ejemplos

### Ejemplo 1: contenido y redes sociales (ciclo semanal)

```markdown
## Programa: Contenido y redes sociales

**Autoridad:** Redactar contenido, programar publicaciones y recopilar informes de interacción
**Punto de aprobación:** Todas las publicaciones requieren la revisión del responsable durante los primeros 30 días; después, se aplica una aprobación permanente
**Desencadenador:** Ciclo semanal (revisión el lunes → borradores a mitad de semana → resumen el viernes)

### Ciclo semanal

- **Lunes:** Revisar las métricas de las plataformas y la interacción de la audiencia
- **Martes a jueves:** Redactar publicaciones para redes sociales y crear contenido para el blog
- **Viernes:** Recopilar el resumen semanal de marketing → entregarlo al responsable

### Reglas de contenido

- El tono debe coincidir con la marca (consulta SOUL.md o la guía de voz de la marca)
- Nunca identificarse como IA en contenido dirigido al público
- Incluir métricas cuando estén disponibles
- Centrarse en el valor para la audiencia, no en la autopromoción
```

### Ejemplo 2: operaciones financieras (desencadenadas por eventos)

```markdown
## Programa: Procesamiento financiero

**Autoridad:** Procesar datos de transacciones, generar informes y enviar resúmenes
**Punto de aprobación:** Ninguno para el análisis. Las recomendaciones requieren la aprobación del responsable.
**Desencadenador:** Se detecta un nuevo archivo de datos O comienza el ciclo mensual programado

### Cuando llegan datos nuevos

1. Detectar el archivo nuevo en el directorio de entrada designado
2. Analizar y clasificar todas las transacciones
3. Compararlas con los objetivos presupuestarios
4. Marcar: elementos inusuales, umbrales superados y nuevos cargos recurrentes
5. Generar el informe en el directorio de salida designado
6. Entregar el resumen al responsable mediante el canal configurado

### Reglas de escalamiento

- Elemento individual > $500: alerta inmediata
- Categoría > presupuesto en un 20 %: marcar en el informe
- Transacción no reconocible: solicitar al responsable que la clasifique
- Error de procesamiento después de 2 reintentos: informar del error, no hacer suposiciones
```

### Ejemplo 3: supervisión y alertas (continuo)

```markdown
## Programa: Supervisión del sistema

**Autoridad:** Comprobar el estado del sistema, reiniciar servicios y enviar alertas
**Punto de aprobación:** Reiniciar los servicios automáticamente. Escalar si el reinicio falla dos veces.
**Desencadenador:** En cada ciclo de Heartbeat

### Comprobaciones

- Los puntos de conexión de estado de los servicios responden
- El espacio en disco está por encima del umbral
- Las tareas pendientes no están obsoletas (>24 horas)
- Los canales de entrega están operativos

### Matriz de respuesta

| Condición               | Acción                            | ¿Escalar?                        |
| ----------------------- | --------------------------------- | -------------------------------- |
| Servicio inactivo       | Reiniciar automáticamente         | Solo si el reinicio falla 2 veces |
| Espacio en disco < 10 % | Alertar al responsable             | Sí                               |
| Tarea obsoleta > 24 h   | Recordárselo al responsable        | No                               |
| Canal sin conexión      | Registrar y reintentar en el próximo ciclo | Si permanece sin conexión > 2 horas |
```

## Patrón ejecutar-verificar-informar

Las órdenes permanentes funcionan mejor cuando se combinan con una disciplina de ejecución estricta. Cada tarea de una orden permanente debe seguir este ciclo:

1. **Ejecutar**: realizar el trabajo propiamente dicho (no limitarse a confirmar la instrucción)
2. **Verificar**: confirmar que el resultado sea correcto (el archivo existe, el mensaje se entregó, los datos se analizaron)
3. **Informar**: comunicar al responsable qué se hizo y qué se verificó

```markdown
### Reglas de ejecución

- Cada tarea sigue el patrón Ejecutar-Verificar-Informar. Sin excepciones.
- «Lo haré» no es ejecución. Hazlo y después informa.
- «Hecho» sin verificación no es aceptable. Demuéstralo.
- Si la ejecución falla: reintentar una vez con un enfoque ajustado.
- Si vuelve a fallar: informar del error con un diagnóstico. Nunca fallar de forma silenciosa.
- Nunca reintentar indefinidamente: 3 intentos como máximo y, después, escalar.
```

Este patrón evita el modo de fallo más común de los agentes: confirmar una tarea sin completarla.

## Arquitectura de varios programas

Para los agentes que gestionan varios ámbitos, organiza las órdenes permanentes como programas independientes con límites claros:

```markdown
## Programa 1: [Ámbito A] (Semanal)

...

## Programa 2: [Ámbito B] (Mensual + bajo demanda)

...

## Programa 3: [Ámbito C] (Según sea necesario)

...

## Reglas de escalamiento (Todos los programas)

- [Criterios comunes de escalamiento]
- [Puntos de aprobación aplicables a todos los programas]
```

Cada programa debe tener:

- Su propia **cadencia de activación** (semanal, mensual, desencadenada por eventos o continua)
- Sus propios **puntos de aprobación** (algunos programas necesitan más supervisión que otros)
- **Límites** claros (el agente debe saber dónde termina un programa y comienza otro)

## Prácticas recomendadas

### Qué hacer

- Comenzar con una autoridad limitada y ampliarla a medida que aumente la confianza
- Definir puntos de aprobación explícitos para las acciones de alto riesgo
- Incluir secciones «Qué NO hacer»: los límites importan tanto como los permisos
- Combinar con tareas Cron para garantizar una ejecución fiable basada en el tiempo
- Revisar semanalmente los registros del agente para verificar que se sigan las órdenes permanentes
- Actualizar las órdenes permanentes a medida que evolucionen tus necesidades: son documentos vivos

### Qué evitar

- Conceder una autoridad amplia desde el primer día («haz lo que consideres mejor»)
- Omitir las reglas de escalamiento: cada programa necesita una cláusula que indique cuándo detenerse y preguntar
- Suponer que el agente recordará las instrucciones verbales: incluirlo todo en el archivo
- Mezclar ámbitos en un solo programa: usar programas independientes para ámbitos distintos
- Olvidar garantizar la ejecución mediante tareas Cron: las órdenes permanentes sin desencadenadores se convierten en sugerencias

## Temas relacionados

- [Automatización](/es/automation): todos los mecanismos de automatización de un vistazo.
- [Tareas Cron](/es/automation/cron-jobs): ejecución programada de las órdenes permanentes.
- [Hooks](/es/automation/hooks): scripts desencadenados por eventos del ciclo de vida del agente.
- [Webhooks](/es/automation/cron-jobs#webhooks): desencadenadores de eventos HTTP entrantes.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): dónde se almacenan las órdenes permanentes, incluida la lista completa de archivos de arranque inyectados automáticamente (`AGENTS.md`, `SOUL.md`, etc.).
