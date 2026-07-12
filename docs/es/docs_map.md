---
read_when: Finding which docs page covers a topic before reading the page
summary: Mapa de encabezados generado para las páginas de documentación de OpenClaw
title: Mapa de la documentación
x-i18n:
    generated_at: "2026-07-12T14:27:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 691c999d749d88c4c350c4b6dd197a57418dd915587a73e1bbeb6d54b45061de
    source_path: docs_map.md
    workflow: 16
---

# Mapa de la documentación de OpenClaw

Este archivo se genera a partir de los encabezados de `docs/**/*.md` y `docs/**/*.mdx` para ayudar a los agentes a navegar por el árbol de documentación.
No lo edite manualmente; ejecute `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Ruta: /agent-runtime-architecture
- Encabezados:
  - H2: Disposición del entorno de ejecución
  - H2: Límites
  - H2: Manifiestos
  - H2: Selección del entorno de ejecución
  - H2: Contenido relacionado

## announcements/bluebubbles-imessage.md

- Ruta: /announcements/bluebubbles-imessage
- Encabezados:
  - H1: Eliminación de BlueBubbles y la vía de imsg para iMessage
  - H2: Qué cambió
  - H2: Qué hacer
  - H2: Notas de migración
  - H2: Véase también

## auth-credential-semantics.md

- Ruta: /auth-credential-semantics
- Encabezados:
  - H2: Códigos estables de motivo de sondeo
  - H2: Credenciales de token
  - H3: Reglas de elegibilidad
  - H3: Reglas de resolución
  - H2: Portabilidad de copias de agentes
  - H2: Rutas de autenticación exclusivas de la configuración
  - H2: Filtrado explícito del orden de autenticación
  - H2: Resolución del destino del sondeo
  - H2: Detección de credenciales de CLI externas
  - H2: Protección de políticas SecretRef para secretos de OAuth
  - H2: Mensajería compatible con versiones heredadas
  - H2: Contenido relacionado

## automation/auth-monitoring.md

- Ruta: /automation/auth-monitoring
- Encabezados:
  - H2: Contenido relacionado

## automation/clawflow.md

- Ruta: /automation/clawflow
- Encabezados:
  - H2: Contenido relacionado

## automation/cron-jobs.md

- Ruta: /automation/cron-jobs
- Encabezados:
  - H2: Inicio rápido
  - H2: Cómo funciona Cron
  - H2: Tipos de programación
  - H3: El día del mes y el día de la semana usan lógica OR
  - H2: Desencadenadores de eventos (observadores de condiciones)
  - H2: Cargas útiles
  - H3: Opciones de turno del agente
  - H3: Cargas útiles de comandos
  - H2: Estilos de ejecución
  - H2: Entrega y salida
  - H3: Notificaciones de errores
  - H3: Idioma de salida
  - H2: Ejemplos de CLI
  - H2: Gestión de trabajos
  - H2: Webhooks
  - H3: Autenticación
  - H2: Integración con Gmail PubSub
  - H3: Configuración mediante asistente (recomendada)
  - H3: Inicio automático del Gateway
  - H3: Configuración manual única
  - H3: Reemplazo del modelo de Gmail
  - H2: Configuración
  - H2: Solución de problemas
  - H3: Secuencia de comandos
  - H2: Contenido relacionado

## automation/cron-vs-heartbeat.md

- Ruta: /automation/cron-vs-heartbeat
- Encabezados:
  - H2: Contenido relacionado

## automation/gmail-pubsub.md

- Ruta: /automation/gmail-pubsub
- Encabezados:
  - H2: Contenido relacionado

## automation/hooks.md

- Ruta: /automation/hooks
- Encabezados:
  - H2: Elegir la superficie adecuada
  - H2: Inicio rápido
  - H2: Tipos de eventos
  - H2: Escritura de hooks
  - H3: Estructura de un hook
  - H3: Formato de HOOK.md
  - H3: Implementación del controlador
  - H3: Aspectos destacados del contexto del evento
  - H2: Detección de hooks
  - H3: Paquetes de hooks
  - H2: Hooks incluidos
  - H3: Detalles de session-memory
  - H3: Configuración de bootstrap-extra-files
  - H3: Detalles de command-logger
  - H3: Detalles de compaction-notifier
  - H3: Detalles de boot-md
  - H2: Hooks de Plugin
  - H2: Configuración
  - H2: Referencia de CLI
  - H2: Prácticas recomendadas
  - H2: Solución de problemas
  - H3: Hook no detectado
  - H3: Hook no apto
  - H3: Hook no ejecutado
  - H2: Contenido relacionado

## automation/index.md

- Ruta: /automation
- Encabezados:
  - H2: Guía rápida para tomar decisiones
  - H3: Tareas programadas (Cron) frente a Heartbeat
  - H2: Conceptos fundamentales
  - H3: Tareas programadas (Cron)
  - H3: Tareas
  - H3: Compromisos inferidos
  - H3: Flujo de tareas
  - H3: Órdenes permanentes
  - H3: Hooks
  - H3: Heartbeat
  - H2: Cómo funcionan en conjunto
  - H2: Contenido relacionado

## automation/poll.md

- Ruta: /automation/poll
- Encabezados:
  - H2: Contenido relacionado

## automation/standing-orders.md

- Ruta: /automation/standing-orders
- Encabezados:
  - H2: Por qué usar órdenes permanentes
  - H2: Cómo funcionan
  - H2: Anatomía de una orden permanente
  - H2: Órdenes permanentes junto con trabajos de Cron
  - H2: Ejemplos
  - H3: Ejemplo 1: contenido y redes sociales (ciclo semanal)
  - H3: Ejemplo 2: operaciones financieras (desencadenadas por eventos)
  - H3: Ejemplo 3: supervisión y alertas (continuas)
  - H2: Patrón ejecutar-verificar-informar
  - H2: Arquitectura multiprograma
  - H2: Prácticas recomendadas
  - H3: Recomendaciones
  - H3: Qué evitar
  - H2: Contenido relacionado

## automation/taskflow.md

- Ruta: /automation/taskflow
- Encabezados:
  - H2: Cuándo usar el flujo de tareas
  - H2: Modos de sincronización
  - H3: Modo administrado
  - H3: Modo reflejado
  - H2: Estados del flujo
  - H2: Estado duradero y seguimiento de revisiones
  - H2: Comportamiento de cancelación
  - H2: Comandos de CLI
  - H2: Patrón fiable de flujo de trabajo programado
  - H2: Cómo se relacionan los flujos con las tareas
  - H2: Contenido relacionado

## automation/tasks.md

- Ruta: /automation/tasks
- Encabezados:
  - H2: Resumen
  - H2: Inicio rápido
  - H2: Qué crea una tarea
  - H2: Ciclo de vida de las tareas
  - H2: Entrega y notificaciones
  - H3: Políticas de notificación
  - H2: Referencia de CLI
  - H2: Tablero de tareas del chat (/tasks)
  - H3: Interfaz de control
  - H2: Integración del estado (presión de tareas)
  - H2: Almacenamiento y mantenimiento
  - H3: Dónde se encuentran las tareas
  - H3: Mantenimiento automático
  - H2: Cómo se relacionan las tareas con otros sistemas
  - H2: Contenido relacionado

## automation/troubleshooting.md

- Ruta: /automation/troubleshooting
- Encabezados:
  - H2: Contenido relacionado

## automation/webhook.md

- Ruta: /automation/webhook
- Encabezados:
  - H2: Contenido relacionado

## brave-search.md

- Ruta: /brave-search
- Encabezados:
  - H2: Contenido relacionado

## channels/access-groups.md

- Ruta: /channels/access-groups
- Encabezados:
  - H2: Grupos estáticos de remitentes de mensajes
  - H2: Grupos de referencia de listas de permitidos
  - H2: Rutas de canales de mensajes compatibles
  - H2: Audiencias de canales de Discord
  - H2: Diagnósticos de Plugin
  - H2: Notas de seguridad
  - H2: Solución de problemas

## channels/ambient-room-events.md

- Ruta: /channels/ambient-room-events
- Encabezados:
  - H2: Configuración recomendada
  - H2: Qué cambia
  - H2: Ejemplo de Discord
  - H2: Ejemplo de Slack
  - H2: Ejemplo de Telegram
  - H2: Política específica del agente
  - H2: Modos de respuesta visible
  - H2: Historial
  - H2: Solución de problemas
  - H2: Contenido relacionado

## channels/bot-loop-protection.md

- Ruta: /channels/bot-loop-protection
- Encabezados:
  - H2: Valores predeterminados
  - H2: Configurar valores predeterminados compartidos
  - H2: Reemplazar por canal, cuenta o sala
  - H2: Compatibilidad de canales

## channels/broadcast-groups.md

- Ruta: /channels/broadcast-groups
- Encabezados:
  - H2: Descripción general
  - H2: Configuración
  - H3: Configuración básica
  - H3: Estrategia de procesamiento
  - H3: Ejemplo completo
  - H2: Cómo funciona
  - H3: Flujo de mensajes
  - H3: Aislamiento de sesiones
  - H3: Ejemplo: sesiones aisladas
  - H2: Casos de uso
  - H2: Prácticas recomendadas
  - H2: Compatibilidad
  - H3: Proveedores
  - H3: Enrutamiento
  - H2: Solución de problemas
  - H2: Ejemplos
  - H2: Referencia de la API
  - H3: Esquema de configuración
  - H3: Campos
  - H2: Limitaciones
  - H2: Contenido relacionado

## channels/channel-routing.md

- Ruta: /channels/channel-routing
- Encabezados:
  - H1: Canales y enrutamiento
  - H2: Términos clave
  - H2: Prefijos de destinos salientes
  - H2: Formas de las claves de sesión (ejemplos)
  - H2: Fijación de la ruta principal de mensajes directos
  - H2: Registro protegido de mensajes entrantes
  - H2: Reglas de enrutamiento (cómo se elige un agente)
  - H2: Grupos de difusión (ejecutar varios agentes)
  - H2: Descripción general de la configuración
  - H2: Almacenamiento de sesiones
  - H2: Comportamiento de WebChat
  - H2: Contexto de respuesta
  - H2: Contenido relacionado

## channels/clickclack.md

- Ruta: /channels/clickclack
- Encabezados:
  - H2: Configuración rápida
  - H3: Claves de configuración de la cuenta
  - H2: Varios bots
  - H2: Modos de respuesta
  - H2: Filas de actividad del agente
  - H2: Destinos
  - H2: Permisos
  - H2: Solución de problemas

## channels/discord.md

- Ruta: /channels/discord
- Encabezados:
  - H2: Configuración rápida
  - H2: Recomendación: configurar un espacio de trabajo de servidor
  - H2: Modelo del entorno de ejecución
  - H2: Canales de foro
  - H2: Componentes interactivos
  - H2: Control de acceso y enrutamiento
  - H3: Enrutamiento de agentes basado en roles
  - H2: Comandos nativos y autenticación de comandos
  - H2: Detalles de las funciones
  - H2: Herramientas y controles de acciones
  - H2: Interfaz de componentes v2
  - H2: Voz
  - H3: Canales de voz
  - H3: Seguir a usuarios en canales de voz
  - H3: Mensajes de voz
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Seguridad y operaciones
  - H2: Contenido relacionado

## channels/feishu.md

- Ruta: /channels/feishu
- Encabezados:
  - H2: Inicio rápido
  - H2: Control de acceso
  - H3: Mensajes directos
  - H3: Chats grupales
  - H2: Ejemplos de configuración de grupos
  - H3: Permitir todos los grupos sin requerir @mención
  - H3: Permitir todos los grupos, pero seguir requiriendo @mención
  - H3: Permitir solo grupos específicos
  - H3: Restringir remitentes dentro de un grupo
  - H2: Obtener los identificadores de grupos/usuarios
  - H3: Identificadores de grupos (chatid, formato: ocxxx)
  - H3: Identificadores de usuarios (openid, formato: ouxxx)
  - H2: Comandos habituales
  - H2: Solución de problemas
  - H3: El bot no responde en los chats grupales
  - H3: El bot no recibe mensajes
  - H3: La configuración mediante QR no responde en la aplicación móvil de Feishu
  - H3: App Secret filtrado
  - H2: Configuración avanzada
  - H3: Varias cuentas
  - H3: Límites de mensajes
  - H3: Transmisión
  - H3: Optimización de cuotas
  - H3: Ámbito de las sesiones grupales e hilos temáticos
  - H3: Herramientas del espacio de trabajo de Feishu
  - H3: Sesiones de ACP
  - H4: Vinculación persistente de ACP
  - H4: Iniciar ACP desde el chat
  - H3: Enrutamiento multiagente
  - H2: Aislamiento de agentes por usuario (creación dinámica de agentes)
  - H3: Configuración rápida
  - H3: Cómo funciona
  - H3: Opciones de configuración
  - H3: Ámbito de la sesión
  - H3: Implementación multiusuario típica
  - H3: Verificación
  - H3: Notas
  - H2: Referencia de configuración
  - H2: Tipos de mensajes compatibles
  - H3: Recepción
  - H3: Envío
  - H3: Hilos y respuestas
  - H2: Contenido relacionado

## channels/googlechat.md

- Ruta: /channels/googlechat
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida (principiantes)
  - H2: Añadir a Google Chat
  - H2: URL pública (solo Webhook)
  - H3: Opción A: Tailscale Funnel (recomendada)
  - H3: Opción B: proxy inverso (Caddy)
  - H3: Opción C: Cloudflare Tunnel
  - H2: Cómo funciona
  - H2: Destinos
  - H2: Aspectos destacados de la configuración
  - H2: Solución de problemas
  - H3: 405 Método no permitido
  - H3: Otros problemas
  - H2: Contenido relacionado

## channels/group-messages.md

- Ruta: /channels/group-messages
- Encabezados:
  - H2: Comportamiento
  - H2: Ejemplo de configuración (WhatsApp)
  - H3: Comando de activación (solo propietario)
  - H2: Cómo utilizarlo
  - H2: Pruebas/verificación
  - H2: Consideraciones conocidas
  - H2: Contenido relacionado

## channels/groups.md

- Ruta: /channels/groups
- Encabezados:
  - H2: Introducción para principiantes (2 minutos)
  - H2: Respuestas visibles
  - H2: Visibilidad del contexto y listas de permitidos
  - H2: Claves de sesión
  - H2: Patrón: mensajes directos personales + grupos públicos (un solo agente)
  - H2: Etiquetas de visualización
  - H2: Política de grupos
  - H2: Control mediante menciones (predeterminado)
  - H2: Delimitar los patrones de menciones configurados
  - H2: Restricciones de herramientas por grupo/canal (opcional)
  - H2: Listas de grupos permitidos
  - H2: Activación (solo propietario)
  - H2: Campos de contexto
  - H2: Particularidades de iMessage
  - H2: Indicaciones del sistema de WhatsApp
  - H2: Particularidades de WhatsApp
  - H2: Contenido relacionado

## channels/imessage-from-bluebubbles.md

- Ruta: /channels/imessage-from-bluebubbles
- Encabezados:
  - H2: Lista de comprobación para la migración
  - H2: Qué hace imsg
  - H2: Antes de empezar
  - H2: Traducción de la configuración
  - H2: Riesgo del registro de grupos
  - H2: Procedimiento paso a paso
  - H2: Paridad de acciones de un vistazo
  - H2: Emparejamiento, sesiones y vinculaciones de ACP
  - H2: Sin canal de reversión
  - H2: Contenido relacionado

## channels/imessage.md

- Ruta: /channels/imessage
- Encabezados:
  - H2: Configuración rápida
  - H2: Requisitos y permisos (macOS)
  - H2: Activación de la API privada de imsg
  - H3: Configuración
  - H3: Cuando SIP permanece activado
  - H2: Control de acceso y enrutamiento
  - H2: Vinculaciones de conversaciones de ACP
  - H2: Patrones de implementación
  - H2: Contenido multimedia, fragmentación y destinos de entrega
  - H2: Acciones de la API privada
  - H2: Escrituras de configuración
  - H2: Agrupación de mensajes directos enviados por separado (comando + URL en una sola composición)
  - H3: Escenarios y lo que ve el agente
  - H2: Recuperación de mensajes entrantes tras reiniciar un puente o el Gateway
  - H3: Señal visible para el operador
  - H3: Migración
  - H2: Solución de problemas
  - H2: Referencias de configuración
  - H2: Contenido relacionado

## channels/index.md

- Ruta: /channels
- Encabezados:
  - H2: Canales compatibles
  - H2: Notas de entrega
  - H2: Notas

## channels/irc.md

- Ruta: /channels/irc
- Encabezados:
  - H2: Inicio rápido
  - H2: Ajustes de conexión
  - H2: Valores predeterminados de seguridad
  - H2: Control de acceso
  - H3: Error habitual: allowFrom es para mensajes directos, no para canales
  - H2: Activación de respuestas (menciones)
  - H2: Nota de seguridad (recomendada para canales públicos)
  - H3: Las mismas herramientas para todos los participantes del canal
  - H3: Herramientas distintas según el remitente (el propietario obtiene más capacidad)
  - H2: NickServ
  - H2: Variables de entorno
  - H2: Solución de problemas
  - H2: Contenido relacionado

## channels/line.md

- Ruta: /channels/line
- Encabezados:
  - H2: Instalación
  - H2: Configuración inicial
  - H2: Configuración
  - H2: Control de acceso
  - H2: Comportamiento de los mensajes
  - H2: Datos del canal (mensajes enriquecidos)
  - H2: Compatibilidad con ACP
  - H2: Contenido multimedia saliente
  - H2: Solución de problemas
  - H2: Temas relacionados

## channels/location.md

- Ruta: /channels/location
- Encabezados:
  - H2: Formato de texto
  - H2: Campos de contexto
  - H2: Cargas útiles salientes
  - H2: Notas del canal
  - H2: Temas relacionados

## channels/matrix-migration.md

- Ruta: /channels/matrix-migration
- Encabezados:
  - H2: Qué hace automáticamente la migración
  - H2: Actualización desde versiones de OpenClaw anteriores a 2026.4
  - H2: Flujo de actualización recomendado
  - H2: Mensajes comunes y su significado
  - H3: Mensajes de recuperación manual
  - H2: Si el historial cifrado sigue sin recuperarse
  - H2: Si se desea empezar desde cero para los mensajes futuros
  - H2: Temas relacionados

## channels/matrix-presentation.md

- Ruta: /channels/matrix-presentation
- Encabezados:
  - H2: Contenido de los eventos
  - H2: Comportamiento alternativo
  - H2: Bloques compatibles
  - H2: Interacciones
  - H2: Relación con los metadatos de aprobación
  - H2: Mensajes multimedia

## channels/matrix-push-rules.md

- Ruta: /channels/matrix-push-rules
- Encabezados:
  - H2: Requisitos previos
  - H2: Pasos
  - H2: Notas sobre varios bots
  - H2: Notas sobre el servidor doméstico
  - H2: Temas relacionados

## channels/matrix.md

- Ruta: /channels/matrix
- Encabezados:
  - H2: Instalación
  - H2: Configuración inicial
  - H3: Configuración interactiva
  - H3: Configuración mínima
  - H3: Unión automática
  - H3: Formatos de destino de la lista de permitidos
  - H3: Normalización del ID de cuenta
  - H3: Credenciales almacenadas en caché
  - H3: Variables de entorno
  - H2: Ejemplo de configuración
  - H2: Vistas previas en streaming
  - H2: Mensajes de voz
  - H2: Metadatos de aprobación
  - H3: Reglas push autoalojadas para vistas previas finalizadas silenciosas
  - H2: Salas entre bots
  - H2: Cifrado y verificación
  - H3: Activación del cifrado
  - H3: Señales de estado y confianza
  - H3: Verificación de este dispositivo con una clave de recuperación
  - H3: Inicialización o reparación de la firma cruzada
  - H3: Copia de seguridad de las claves de sala
  - H3: Listado, solicitud y respuesta a verificaciones
  - H3: Notas sobre varias cuentas
  - H2: Gestión del perfil
  - H2: Hilos
  - H3: Enrutamiento de sesiones (sessionScope)
  - H3: Respuestas en hilos (threadReplies)
  - H3: Herencia de hilos y comandos con barra
  - H2: Vinculaciones de conversaciones ACP
  - H3: Configuración de vinculación de hilos
  - H2: Reacciones
  - H2: Contexto del historial
  - H2: Visibilidad del contexto
  - H2: Política de mensajes directos y salas
  - H2: Reparación de salas directas
  - H2: Aprobaciones de ejecución
  - H2: Comandos con barra
  - H2: Varias cuentas
  - H2: Servidores domésticos privados o de LAN
  - H2: Uso de proxy para el tráfico de Matrix
  - H2: Resolución de destinos
  - H2: Referencia de configuración
  - H3: Cuenta y conexión
  - H3: Cifrado
  - H3: Acceso y políticas
  - H3: Comportamiento de las respuestas
  - H3: Configuración de reacciones
  - H3: Herramientas y anulaciones por sala
  - H3: Configuración de aprobaciones de ejecución
  - H2: Temas relacionados

## channels/mattermost.md

- Ruta: /channels/mattermost
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Comandos con barra nativos
  - H2: Variables de entorno (cuenta predeterminada)
  - H2: Modos de chat
  - H2: Hilos y sesiones
  - H2: Control de acceso (mensajes directos)
  - H2: Canales (grupos)
  - H2: Destinos para la entrega saliente
  - H2: Reintento del canal de mensajes directos
  - H2: Streaming de vistas previas
  - H2: Reacciones (herramienta de mensajes)
  - H2: Botones interactivos (herramienta de mensajes)
  - H3: Integración directa con la API (scripts externos)
  - H2: Adaptador de directorio
  - H2: Varias cuentas
  - H2: Solución de problemas
  - H2: Temas relacionados

## channels/msteams.md

- Ruta: /channels/msteams
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida
  - H2: Objetivos
  - H2: Escrituras de configuración
  - H2: Control de acceso (mensajes directos y grupos)
  - H3: Cómo funciona
  - H3: Paso 1: Crear un bot de Azure
  - H3: Paso 2: Obtener las credenciales
  - H3: Paso 3: Configurar el extremo de mensajería
  - H3: Paso 4: Habilitar el canal de Teams
  - H3: Paso 5: Crear el manifiesto de la aplicación de Teams
  - H3: Paso 6: Configurar OpenClaw
  - H3: Paso 7: Ejecutar el Gateway
  - H2: Autenticación federada (certificado más identidad administrada)
  - H3: Opción A: Autenticación basada en certificados
  - H3: Opción B: Identidad administrada de Azure
  - H3: Configuración de AKS Workload Identity
  - H3: Comparación de tipos de autenticación
  - H2: Desarrollo local (túnel)
  - H2: Prueba del bot
  - H2: Variables de entorno
  - H2: Acción de información de miembros
  - H2: Contexto del historial
  - H2: Permisos RSC actuales de Teams (manifiesto)
  - H2: Ejemplo de manifiesto de Teams (censurado)
  - H3: Consideraciones del manifiesto (campos obligatorios)
  - H3: Actualización de una aplicación existente
  - H2: Capacidades: solo RSC frente a Graph
  - H3: Solo con RSC de Teams (aplicación instalada, sin permisos de la API de Graph)
  - H3: Con RSC de Teams y permisos de aplicación de Microsoft Graph
  - H3: RSC frente a la API de Graph
  - H2: Contenido multimedia e historial con Graph habilitado
  - H3: Recuperación de archivos de canales o grupos (graphMediaFallback)
  - H2: Limitaciones conocidas
  - H3: Tiempos de espera de Webhook
  - H3: Compatibilidad con la nube de Teams y la URL del servicio
  - H3: Formato
  - H2: Configuración
  - H2: Enrutamiento y sesiones
  - H2: Estilo de respuesta: hilos frente a publicaciones
  - H3: Precedencia de resolución
  - H3: Conservación del contexto del hilo
  - H2: Archivos adjuntos e imágenes
  - H2: Envío de archivos en chats grupales
  - H3: Por qué los chats grupales necesitan SharePoint
  - H3: Configuración inicial
  - H3: Comportamiento al compartir
  - H3: Comportamiento alternativo
  - H3: Ubicación de los archivos almacenados
  - H2: Encuestas (tarjetas adaptables)
  - H2: Tarjetas de presentación
  - H2: Formatos de destino
  - H2: Mensajería proactiva
  - H2: Identificadores de equipos y canales (error común)
  - H2: Canales privados
  - H2: Solución de problemas
  - H3: Problemas comunes
  - H3: Errores al cargar el manifiesto
  - H3: Los permisos RSC no funcionan
  - H2: Referencias
  - H2: Temas relacionados

## channels/nextcloud-talk.md

- Ruta: /channels/nextcloud-talk
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida (principiantes)
  - H2: Notas
  - H2: Control de acceso (mensajes directos)
  - H2: Salas (grupos)
  - H2: Capacidades
  - H2: Referencia de configuración (Nextcloud Talk)
  - H2: Temas relacionados

## channels/nostr.md

- Ruta: /channels/nostr
- Encabezados:
  - H2: Instalación
  - H3: Configuración no interactiva
  - H2: Configuración rápida
  - H2: Referencia de configuración
  - H2: Metadatos del perfil
  - H2: Control de acceso
  - H3: Políticas de mensajes directos
  - H3: Ejemplo de lista de permitidos
  - H2: Formatos de claves
  - H2: Relés
  - H2: Compatibilidad con protocolos
  - H2: Pruebas
  - H3: Relé local
  - H3: Prueba manual
  - H2: Solución de problemas
  - H3: No se reciben mensajes
  - H3: No se envían respuestas
  - H3: Respuestas duplicadas
  - H2: Seguridad
  - H2: Limitaciones (MVP)
  - H2: Temas relacionados

## channels/pairing.md

- Ruta: /channels/pairing
- Encabezados:
  - H2: 1) Emparejamiento de mensajes directos (acceso al chat entrante)
  - H3: Aprobación de un remitente
  - H3: Grupos de remitentes reutilizables
  - H3: Ubicación del estado
  - H2: 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz)
  - H3: Emparejamiento desde la interfaz de control (recomendado)
  - H3: Emparejamiento mediante Telegram
  - H3: Aprobación de un dispositivo Node
  - H3: Aprobación automática opcional de nodos de CIDR de confianza
  - H3: Almacenamiento del estado de emparejamiento de Node
  - H3: Notas
  - H2: Documentación relacionada

## channels/qa-channel.md

- Ruta: /channels/qa-channel
- Encabezados:
  - H2: Qué hace
  - H2: Configuración
  - H2: Ejecutores
  - H2: Temas relacionados

## channels/qqbot.md

- Ruta: /channels/qqbot
- Encabezados:
  - H2: Instalación
  - H2: Configuración inicial
  - H2: Configuración
  - H3: Política de acceso
  - H3: Configuración de varias cuentas
  - H3: Chats grupales
  - H3: Voz (STT/TTS)
  - H2: Formatos de destino
  - H2: Comandos con barra
  - H2: Contenido multimedia y almacenamiento
  - H2: Solución de problemas
  - H2: Temas relacionados

## channels/raft.md

- Ruta: /channels/raft
- Encabezados:
  - H2: Instalación
  - H2: Requisitos previos
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Verificación
  - H2: Solución de problemas
  - H2: Referencias

## channels/signal.md

- Ruta: /channels/signal
- Encabezados:
  - H2: El modelo de números (leer primero)
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Qué es
  - H2: Ruta de configuración A: vincular una cuenta de Signal existente (QR)
  - H2: Ruta de configuración B: registrar un número exclusivo para el bot (SMS, Linux)
  - H2: Modo de demonio externo (httpUrl)
  - H2: Modo de contenedor (bbernhard/signal-cli-rest-api)
  - H2: Control de acceso (mensajes directos y grupos)
  - H2: Cómo funciona (comportamiento)
  - H2: Contenido multimedia y límites
  - H2: Indicadores de escritura y confirmaciones de lectura
  - H2: Reacciones de estado del ciclo de vida
  - H2: Reacciones (herramienta de mensajes)
  - H2: Reacciones de aprobación
  - H2: Destinos de entrega (CLI/cron)
  - H2: Alias
  - H2: Solución de problemas
  - H2: Notas de seguridad
  - H2: Referencia de configuración (Signal)
  - H2: Temas relacionados

## channels/slack.md

- Ruta: /channels/slack
- Encabezados:
  - H2: Elección de un transporte
  - H3: Modo relé
  - H3: Instalaciones en toda la organización de Enterprise Grid
  - H4: Socket Mode
  - H4: HTTP Request URLs
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Ajuste del transporte de Socket Mode
  - H2: Lista de comprobación del manifiesto y los ámbitos
  - H3: Configuración adicional del manifiesto
  - H2: Modelo de tokens
  - H2: Acciones y controles
  - H2: Control de acceso y enrutamiento
  - H2: Hilos, sesiones y etiquetas de respuesta
  - H2: Reacciones de confirmación
  - H3: Emoji (ackReaction)
  - H3: Ámbito (messages.ackReactionScope)
  - H2: Streaming de texto
  - H2: Alternativa de reacción de escritura
  - H2: Entrada de voz
  - H2: Contenido multimedia, fragmentación y entrega
  - H2: Comandos y comportamiento de la barra
  - H2: Gráficos nativos
  - H2: Tablas nativas
  - H2: Respuestas interactivas
  - H3: Envíos de formularios modales gestionados por el Plugin
  - H2: Aprobaciones nativas en Slack
  - H2: Eventos y comportamiento operativo
  - H2: Referencia de configuración
  - H2: Solución de problemas
  - H2: Referencia de contenido multimedia adjunto
  - H3: Tipos de contenido multimedia compatibles
  - H3: Flujo de entrada
  - H3: Herencia de archivos adjuntos de la raíz del hilo
  - H3: Gestión de varios archivos adjuntos
  - H3: Límites de tamaño, descarga y modelo
  - H3: Límites conocidos
  - H3: Documentación relacionada
  - H2: Temas relacionados

## channels/sms.md

- Ruta: /channels/sms
- Encabezados:
  - H2: Antes de comenzar
  - H2: Configuración rápida
  - H2: Ejemplos de configuración
  - H3: Archivo de configuración
  - H3: Variables de entorno
  - H3: Token de autenticación SecretRef
  - H3: Remitente de Messaging Service
  - H3: Destino saliente predeterminado
  - H2: Control de acceso
  - H2: Envío de SMS
  - H2: Verificación de la configuración
  - H3: Prueba integral desde iMessage/SMS de macOS
  - H2: Seguridad del Webhook
  - H2: Configuración de varias cuentas
  - H2: Solución de problemas
  - H3: Twilio devuelve 403 u OpenClaw rechaza el Webhook
  - H3: No aparece ninguna solicitud de emparejamiento
  - H3: Los envíos salientes fallan
  - H3: Los mensajes llegan, pero el agente no responde

## channels/synology-chat.md

- Ruta: /channels/synology-chat
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Variables de entorno
  - H2: Política de mensajes directos y control de acceso
  - H2: Entrega saliente
  - H2: Varias cuentas
  - H2: Notas de seguridad
  - H2: Solución de problemas
  - H2: Temas relacionados

## channels/telegram.md

- Ruta: /channels/telegram
- Encabezados:
  - H2: Configuración rápida
  - H2: Configuración en Telegram
  - H2: Miniaplicación del panel
  - H2: Control de acceso y activación
  - H3: Identidad del bot del grupo
  - H2: Comportamiento en tiempo de ejecución
  - H2: Referencia de funcionalidades
  - H2: Controles de respuestas de error
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Temas relacionados

## channels/tlon.md

- Ruta: /channels/tlon
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración inicial
  - H2: Naves privadas o de LAN
  - H2: Canales grupales
  - H2: Control de acceso
  - H2: Sistema de propietarios y aprobaciones
  - H2: Configuración de aceptación automática
  - H2: Recarga en caliente mediante el almacén de configuración de Urbit
  - H2: Destinos de entrega (CLI/cron)
  - H2: Skill incluida
  - H2: Capacidades
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Notas
  - H2: Temas relacionados

## channels/troubleshooting.md

- Ruta: /channels/troubleshooting
- Encabezados:
  - H2: Secuencia de comandos
  - H2: Después de una actualización
  - H2: WhatsApp
  - H3: Indicadores de fallos de WhatsApp
  - H2: Telegram
  - H3: Indicadores de fallos de Telegram
  - H2: Discord
  - H3: Indicadores de fallos de Discord
  - H2: Slack
  - H3: Indicadores de fallos de Slack
  - H2: iMessage
  - H3: Indicadores de fallos de iMessage
  - H2: Signal
  - H3: Indicadores de fallos de Signal
  - H2: QQ Bot
  - H3: Indicadores de fallos de QQ Bot
  - H2: Matrix
  - H3: Indicadores de fallos de Matrix
  - H2: Temas relacionados

## channels/twitch.md

- Ruta: /channels/twitch
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Qué es
  - H2: Renovación del token (opcional)
  - H2: Compatibilidad con varias cuentas
  - H2: Control de acceso
  - H2: Solución de problemas
  - H2: Configuración
  - H3: Configuración de la cuenta
  - H3: Opciones del proveedor
  - H2: Acciones de herramientas
  - H2: Seguridad y operaciones
  - H2: Límites
  - H2: Contenido relacionado

## channels/wechat.md

- Ruta: /channels/wechat
- Encabezados:
  - H2: Nomenclatura
  - H2: Cómo funciona
  - H2: Instalación
  - H2: Inicio de sesión
  - H2: Control de acceso
  - H2: Compatibilidad
  - H2: Proceso auxiliar
  - H2: Solución de problemas
  - H2: Documentación relacionada

## channels/whatsapp.md

- Ruta: /channels/whatsapp
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Patrones de despliegue
  - H2: Modelo de ejecución
  - H2: Llamar al solicitante actual con MeowCaller (experimental)
  - H2: Solicitudes de aprobación
  - H2: Hooks de Plugin y privacidad
  - H2: Control de acceso y activación
  - H2: Vinculaciones ACP configuradas
  - H2: Comportamiento con números personales y chats con uno mismo
  - H2: Normalización de mensajes y contexto
  - H2: Entrega, fragmentación y contenido multimedia
  - H2: Citas en las respuestas
  - H2: Nivel de reacciones
  - H2: Reacciones de confirmación
  - H2: Reacciones de estado del ciclo de vida
  - H2: Varias cuentas y credenciales
  - H2: Herramientas, acciones y escrituras de configuración
  - H2: Solución de problemas
  - H2: Prompts del sistema
  - H2: Referencias de configuración
  - H2: Contenido relacionado

## channels/yuanbao.md

- Ruta: /channels/yuanbao
- Encabezados:
  - H2: Inicio rápido
  - H3: Configuración interactiva (alternativa)
  - H2: Control de acceso
  - H3: Mensajes directos
  - H3: Chats grupales
  - H2: Ejemplos de configuración
  - H2: Comandos habituales
  - H2: Solución de problemas
  - H2: Configuración avanzada
  - H3: Varias cuentas
  - H3: Límites de mensajes
  - H3: Transmisión
  - H3: Contexto del historial del chat grupal
  - H3: Modo de respuesta
  - H3: Inserción de sugerencias de Markdown
  - H3: Modo de depuración
  - H3: Enrutamiento multiagente
  - H2: Referencia de configuración
  - H2: Tipos de mensajes compatibles
  - H2: Contenido relacionado

## channels/zalo.md

- Ruta: /channels/zalo
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida
  - H2: Qué es
  - H2: Cómo funciona
  - H2: Límites
  - H2: Control de acceso
  - H3: Mensajes directos
  - H3: Grupos
  - H2: Sondeo prolongado frente a Webhook
  - H2: Tipos de mensajes compatibles
  - H2: Capacidades
  - H2: Destinos de entrega (CLI/cron)
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Contenido relacionado

## channels/zaloclawbot.md

- Ruta: /channels/zaloclawbot
- Encabezados:
  - H2: Compatibilidad
  - H2: Requisitos previos
  - H2: Instalación mediante onboard (recomendada)
  - H2: Instalación manual
  - H3: 1. Instalar el Plugin
  - H3: 2. Habilitar el Plugin en la configuración
  - H3: 3. Generar un código QR e iniciar sesión
  - H3: 4. Reiniciar el Gateway
  - H2: Cómo funciona
  - H2: Funcionamiento interno
  - H2: Solución de problemas
  - H2: Contenido relacionado

## channels/zalouser.md

- Ruta: /channels/zalouser
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Qué es
  - H2: Nomenclatura
  - H2: Búsqueda de identificadores (directorio)
  - H2: Límites
  - H2: Control de acceso (mensajes directos)
  - H2: Acceso a grupos (opcional)
  - H3: Restricción por menciones en grupos
  - H2: Varias cuentas
  - H2: Variables de entorno
  - H2: Indicadores de escritura, reacciones y confirmaciones de entrega
  - H2: Solución de problemas
  - H2: Contenido relacionado

## ci.md

- Ruta: /ci
- Encabezados:
  - H2: Descripción general de la canalización
  - H2: Orden de interrupción rápida
  - H2: Contexto y evidencia de la PR
  - H2: Alcance y enrutamiento
  - H2: Reenvío de la actividad de ClawSweeper
  - H2: Ejecuciones manuales
  - H2: Ejecutores
  - H2: Presupuesto de registro de ejecutores
  - H2: Equivalentes locales
  - H2: Rendimiento de OpenClaw
  - H2: Validación completa de la versión
  - H2: Fragmentos en vivo y E2E
  - H2: Aceptación del paquete
  - H3: Trabajos
  - H3: Fuentes de candidatos
  - H3: Perfiles de suites
  - H3: Periodos de compatibilidad heredada
  - H3: Ejemplos
  - H2: Prueba rápida de instalación
  - H2: E2E local con Docker
  - H3: Parámetros ajustables
  - H3: Flujo de trabajo reutilizable en vivo/E2E
  - H3: Fragmentos de la ruta de publicación
  - H2: Versión preliminar del Plugin
  - H2: Laboratorio de control de calidad
  - H2: CodeQL
  - H3: Categorías de seguridad
  - H3: Fragmentos de seguridad específicos de la plataforma
  - H3: Categorías críticas de calidad
  - H2: Flujos de trabajo de mantenimiento
  - H3: Agente de documentación
  - H3: Agente de rendimiento de pruebas
  - H3: PR duplicadas después de la fusión
  - H2: Comprobaciones locales y enrutamiento de cambios
  - H2: Validación con Testbox
  - H2: Contenido relacionado

## clawhub/cli.md

- Ruta: /clawhub/cli
- Encabezados:
  - H1: CLI de ClawHub
  - H2: Descubrir e instalar
  - H3: Confianza en la versión
  - H2: Publicar y mantener
  - H2: Contenido relacionado

## clawhub/publishing.md

- Ruta: /clawhub/publishing
- Encabezados:
  - H1: Publicación en ClawHub
  - H2: Propietarios
  - H2: Skills
  - H2: Plugins
  - H2: Flujo de publicación
  - H2: Preguntas frecuentes
  - H3: El ámbito del paquete debe coincidir con el propietario seleccionado

## cli/acp.md

- Ruta: /cli/acp
- Encabezados:
  - H2: Lo que esto no es
  - H2: Matriz de compatibilidad
  - H2: Limitaciones conocidas
  - H2: Uso
  - H2: Cliente ACP (depuración)
  - H2: Prueba rápida del protocolo
  - H2: Cómo usarlo
  - H2: Selección de agentes
  - H2: Uso desde acpx (Codex, Claude y otros clientes ACP)
  - H2: Configuración del editor Zed
  - H2: Asignación de sesiones
  - H2: Opciones
  - H3: Opciones del cliente acp
  - H2: Contenido relacionado

## cli/agent.md

- Ruta: /cli/agent
- Encabezados:
  - H1: openclaw agent
  - H2: Opciones
  - H2: Ejemplos
  - H2: Notas
  - H2: Estado de entrega JSON
  - H2: Contenido relacionado

## cli/agents.md

- Ruta: /cli/agents
- Encabezados:
  - H1: openclaw agents
  - H2: Ejemplos
  - H2: Superficie de comandos
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents set-identity
  - H3: agents delete &lt;id&gt;
  - H2: Vinculaciones de enrutamiento
  - H3: Formato de --bind
  - H3: Comportamiento del ámbito de las vinculaciones
  - H2: Archivos de identidad
  - H2: Establecer la identidad
  - H2: Contenido relacionado

## cli/approvals.md

- Ruta: /cli/approvals
- Encabezados:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Comandos habituales
  - H2: Reemplazar las aprobaciones desde un archivo
  - H2: Ejemplo de «Never prompt» / YOLO
  - H2: Utilidades para la lista de permitidos
  - H2: Opciones habituales
  - H2: Notas
  - H2: Contenido relacionado

## cli/attach.md

- Ruta: /cli/attach
- Encabezados: ninguno

## cli/audit.md

- Ruta: /cli/audit
- Encabezados:
  - H1: openclaw audit
  - H2: Filtros
  - H2: Eventos registrados
  - H2: RPC del Gateway
  - H2: Contenido relacionado

## cli/backup.md

- Ruta: /cli/backup
- Encabezados:
  - H1: openclaw backup
  - H2: Notas
  - H2: Qué se incluye en la copia de seguridad
  - H2: Comportamiento con una configuración no válida
  - H2: Tamaño y rendimiento
  - H2: Contenido relacionado

## cli/browser.md

- Ruta: /cli/browser
- Encabezados:
  - H1: openclaw browser
  - H2: Indicadores habituales
  - H2: Inicio rápido (local)
  - H2: Solución rápida de problemas
  - H2: Ciclo de vida
  - H2: Si falta el comando
  - H2: Perfiles
  - H2: Pestañas
  - H2: Instantánea / captura de pantalla / acciones
  - H2: Estado y almacenamiento
  - H2: Depuración
  - H2: Chrome existente mediante MCP
  - H2: Control remoto del navegador (proxy del host Node)
  - H2: Contenido relacionado

## cli/channels.md

- Ruta: /cli/channels
- Encabezados:
  - H1: openclaw channels
  - H2: Comandos habituales
  - H2: Estado / capacidades / resolución / registros
  - H2: Añadir / eliminar cuentas
  - H2: Inicio y cierre de sesión (interactivo)
  - H2: Solución de problemas
  - H2: Sondeo de capacidades
  - H2: Resolver nombres en identificadores
  - H2: Contenido relacionado

## cli/clawbot.md

- Ruta: /cli/clawbot
- Encabezados:
  - H1: openclaw clawbot
  - H2: Migración
  - H2: Contenido relacionado

## cli/commitments.md

- Ruta: /cli/commitments
- Encabezados:
  - H2: Uso
  - H2: Opciones
  - H2: Ejemplos
  - H2: Salida
  - H2: Contenido relacionado

## cli/completion.md

- Ruta: /cli/completion
- Encabezados:
  - H1: openclaw completion
  - H2: Uso
  - H2: Opciones
  - H2: Flujo de instalación
  - H2: Notas
  - H2: Contenido relacionado

## cli/config.md

- Ruta: /cli/config
- Encabezados:
  - H2: Opciones raíz
  - H2: Ejemplos
  - H3: Rutas
  - H3: config get
  - H3: config file
  - H3: config schema
  - H3: config validate
  - H2: Valores
  - H2: Modos de config set
  - H3: Indicadores del generador de proveedores
  - H2: config patch
  - H2: Simulación
  - H3: Estructura de la salida JSON
  - H2: Aplicación de cambios
  - H2: Seguridad de escritura
  - H2: Bucle de reparación
  - H2: Contenido relacionado

## cli/configure.md

- Ruta: /cli/configure
- Encabezados:
  - H1: openclaw configure
  - H2: Opciones
  - H2: Sección del modelo
  - H2: Sección web
  - H2: Otras notas
  - H2: Contenido relacionado

## cli/crestodian.md

- Ruta: /cli/crestodian
- Encabezados:
  - H1: openclaw crestodian
  - H2: Cuándo se inicia
  - H2: Qué muestra Crestodian
  - H2: Ejemplos
  - H2: Operaciones y aprobación
  - H3: Cambio a la configuración de canales enmascarados
  - H2: Inicialización de la configuración
  - H2: Conversación con IA
  - H3: Modelo de confianza del entorno de CLI
  - H2: Cambio a un agente
  - H2: Modo de rescate de mensajes
  - H2: Contenido relacionado

## cli/cron.md

- Ruta: /cli/cron
- Encabezados:
  - H1: openclaw cron
  - H2: Crear trabajos rápidamente
  - H2: Sesiones
  - H2: Entrega
  - H3: Propiedad de la entrega
  - H3: Entrega en caso de fallo
  - H2: Programación
  - H3: Trabajos de una sola ejecución
  - H3: Trabajos recurrentes
  - H3: Ejecuciones manuales
  - H2: Modelos
  - H3: Precedencia del modelo Cron aislado
  - H3: Modo rápido
  - H3: Reintentos del cambio de modelo en vivo
  - H2: Salida de ejecución y denegaciones
  - H3: Supresión de confirmaciones obsoletas
  - H3: Supresión de tokens silenciosos
  - H3: Denegaciones estructuradas
  - H2: Retención
  - H2: Migración de trabajos antiguos
  - H2: Ediciones habituales
  - H2: Comandos administrativos habituales
  - H2: Contenido relacionado

## cli/daemon.md

- Ruta: /cli/daemon
- Encabezados:
  - H1: openclaw daemon
  - H2: Uso
  - H2: Subcomandos y opciones
  - H2: Notas
  - H2: Contenido relacionado

## cli/dashboard.md

- Ruta: /cli/dashboard
- Encabezados:
  - H1: openclaw dashboard
  - H2: Contenido relacionado

## cli/devices.md

- Ruta: /cli/devices
- Encabezados:
  - H1: openclaw devices
  - H2: Opciones habituales
  - H2: Comandos
  - H3: openclaw devices list
  - H3: openclaw devices approve [requestId] [--latest]
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Notas
  - H2: Lista de comprobación para recuperar la desincronización del token
  - H2: Aprobación de la primera ejecución de Paperclip / openclawgateway
  - H2: Contenido relacionado

## cli/directory.md

- Ruta: /cli/directory
- Encabezados:
  - H1: openclaw directory
  - H2: Indicadores habituales
  - H2: Notas
  - H2: Uso de los resultados con message send
  - H2: Formatos de identificadores por canal
  - H2: Uno mismo ("me")
  - H2: Pares (contactos/usuarios)
  - H2: Grupos
  - H2: Contenido relacionado

## cli/dns.md

- Ruta: /cli/dns
- Encabezados:
  - H1: openclaw dns
  - H2: dns setup
  - H2: Contenido relacionado

## cli/docs.md

- Ruta: /cli/docs
- Encabezados:
  - H1: openclaw docs
  - H2: Uso
  - H2: Ejemplos
  - H2: Cómo funciona
  - H2: Salida
  - H2: Códigos de salida
  - H2: Contenido relacionado

## cli/doctor.md

- Ruta: /cli/doctor
- Encabezados:
  - H1: openclaw doctor
  - H2: Posturas
  - H2: Ejemplos
  - H2: Opciones
  - H2: Modo de análisis estático
  - H2: Comprobaciones de estado estructuradas
  - H2: Selección de comprobaciones
  - H2: Modo posterior a la actualización
  - H2: Compaction de SQLite del estado compartido
  - H2: Migración de sesiones a SQLite
  - H3: Reversión a una versión anterior tras la migración de sesiones a SQLite
  - H2: Notas
  - H2: macOS: anulaciones de variables de entorno de launchctl
  - H2: Contenido relacionado

## cli/fleet.md

- Ruta: /cli/fleet
- Encabezados:
  - H1: openclaw fleet
  - H2: Inicio rápido
  - H2: Identificadores de inquilino
  - H2: fleet create
  - H3: Opciones de creación
  - H3: Fijación por resumen
  - H3: Límites de disco
  - H3: Política de salida
  - H2: fleet list
  - H2: fleet status
  - H2: fleet logs
  - H2: fleet start, fleet stop y fleet restart
  - H2: fleet upgrade
  - H2: fleet backup y fleet restore
  - H2: fleet doctor
  - H2: fleet rm
  - H2: Distribución del almacenamiento y los contenedores
  - H2: Perfil de seguridad
  - H2: Gestión de tokens
  - H2: Contenido relacionado

## cli/flows.md

- Ruta: /cli/flows
- Encabezados:
  - H1: openclaw tasks flow
  - H2: Subcomandos
  - H3: Valores del filtro de estado
  - H2: Ejemplos
  - H2: Contenido relacionado

## cli/gateway.md

- Ruta: /cli/gateway
- Encabezados:
  - H2: Ejecutar el Gateway
  - H3: Opciones
  - H2: Reiniciar el Gateway
  - H3: Perfilado del Gateway
  - H2: Consultar un Gateway en ejecución
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Acceso remoto mediante SSH (equivalencia con la aplicación para Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Administrar el servicio del Gateway
  - H3: Instalar con un contenedor
  - H2: Detectar gateways (Bonjour)
  - H3: gateway discover
  - H2: Contenido relacionado

## cli/health.md

- Ruta: /cli/health
- Encabezados:
  - H1: openclaw health
  - H2: Opciones
  - H2: Comportamiento
  - H2: Contenido relacionado

## cli/hooks.md

- Ruta: /cli/hooks
- Encabezados:
  - H1: openclaw hooks
  - H2: Enumerar hooks
  - H2: Obtener información de un hook
  - H2: Comprobar la elegibilidad
  - H2: Habilitar un hook
  - H2: Deshabilitar un hook
  - H2: Instalar y actualizar paquetes de hooks
  - H2: Hooks incluidos
  - H3: Archivo de registro de command-logger
  - H2: Notas
  - H2: Contenido relacionado

## cli/index.md

- Ruta: /cli
- Encabezados:
  - H2: Páginas de comandos
  - H2: Indicadores globales
  - H2: Modos de salida
  - H2: Paleta de colores
  - H2: Árbol de comandos
  - H2: Comandos de barra del chat
  - H2: Seguimiento del uso
  - H2: Contenido relacionado

## cli/infer.md

- Ruta: /cli/infer
- Encabezados:
  - H2: Convertir infer en una skill
  - H2: Árbol de comandos
  - H2: Tareas habituales
  - H2: Comportamiento
  - H2: Modelo
  - H2: Imagen
  - H2: Audio
  - H2: TTS
  - H2: Vídeo
  - H2: Web
  - H2: Incrustación
  - H2: Salida JSON
  - H2: Errores habituales
  - H2: Contenido relacionado

## cli/logs.md

- Ruta: /cli/logs
- Encabezados:
  - H1: openclaw logs
  - H2: Opciones
  - H2: Opciones compartidas de RPC del Gateway
  - H2: Ejemplos
  - H2: Comportamiento de reserva y recuperación
  - H2: Contenido relacionado

## cli/mcp.md

- Ruta: /cli/mcp
- Encabezados:
  - H2: Elegir la ruta de MCP adecuada
  - H2: OpenClaw como servidor MCP
  - H3: Cuándo usar serve
  - H3: Cómo funciona
  - H3: Elegir un modo de cliente
  - H3: Qué expone serve
  - H3: Uso
  - H3: Herramientas de puente
  - H3: Modelo de eventos
  - H3: Notificaciones del canal de Claude
  - H3: Configuración del cliente MCP
  - H3: Opciones
  - H3: Límite de seguridad y confianza
  - H3: Pruebas
  - H3: Solución de problemas
  - H2: OpenClaw como registro de clientes MCP
  - H3: Definiciones guardadas de servidores MCP
  - H3: Configuraciones habituales de servidores
  - H3: Formas de salida JSON
  - H3: Transporte stdio
  - H3: Transporte SSE / HTTP
  - H3: Flujo de trabajo de OAuth
  - H3: Transporte HTTP transmisible
  - H2: Interfaz de control
  - H2: Aplicaciones MCP
  - H2: Limitaciones actuales
  - H2: Contenido relacionado

## cli/memory.md

- Ruta: /cli/memory
- Encabezados:
  - H1: openclaw memory
  - H2: memory status
  - H2: memory index
  - H2: memory search
  - H2: memory promote
  - H2: memory promote-explain
  - H2: memory rem-harness
  - H2: memory rem-backfill
  - H2: Dreaming
  - H2: Dependencia de SecretRef en el Gateway
  - H2: Contenido relacionado

## cli/message.md

- Ruta: /cli/message
- Encabezados:
  - H1: openclaw message
  - H2: Selección de canal
  - H2: Formatos de destino (-t, --target)
  - H2: Indicadores habituales
  - H2: Resolución de SecretRef
  - H2: Acciones
  - H3: Núcleo
  - H3: Envío
  - H3: Encuesta
  - H3: Hilos
  - H3: Emojis
  - H3: Adhesivos
  - H3: Roles, canales, voz y eventos (Discord)
  - H3: Moderación (Discord)
  - H3: Difusión
  - H2: Contenido relacionado

## cli/migrate.md

- Ruta: /cli/migrate
- Encabezados:
  - H1: openclaw migrate
  - H2: Comandos
  - H2: Modelo de seguridad
  - H2: Proveedor Claude
  - H3: Qué importa Claude
  - H3: Estado de archivo y revisión manual
  - H2: Proveedor Codex
  - H3: Qué importa Codex
  - H3: Estado de Codex para revisión manual
  - H2: Proveedor Hermes
  - H3: Qué importa Hermes
  - H3: Claves de .env compatibles
  - H3: Estado exclusivo de archivo
  - H3: Después de aplicar
  - H2: Contrato del Plugin
  - H2: Integración con la incorporación
  - H2: Contenido relacionado

## cli/models.md

- Ruta: /cli/models
- Encabezados:
  - H1: openclaw models
  - H2: Comandos habituales
  - H3: Estado
  - H3: Lista
  - H3: Establecer el modelo predeterminado / de imagen
  - H3: Exploración
  - H2: Alias
  - H2: Alternativas
  - H2: Perfiles de autenticación
  - H2: Contenido relacionado

## cli/node.md

- Ruta: /cli/node
- Encabezados:
  - H1: openclaw node
  - H2: ¿Por qué usar un host de Node?
  - H2: Proxy del navegador (sin configuración)
  - H2: Ejecución (en primer plano)
  - H2: Autenticación del Gateway para el host de Node
  - H2: Servicio (en segundo plano)
  - H2: Vinculación
  - H3: Estado de identidad y vinculación
  - H2: Aprobaciones de ejecución
  - H2: Contenido relacionado

## cli/nodes.md

- Ruta: /cli/nodes
- Encabezados:
  - H1: openclaw nodes
  - H2: Estado
  - H2: Vinculación
  - H2: Invocación
  - H2: Notificación, envío, ubicación y pantalla
  - H2: Contenido relacionado

## cli/onboard.md

- Ruta: /cli/onboard
- Encabezados:
  - H1: openclaw onboard
  - H2: Ejemplos
  - H2: Flujo guiado
  - H2: Restablecimiento
  - H2: Configuración regional
  - H2: Configuración no interactiva
  - H3: Autenticación del Gateway (no interactiva)
  - H3: Estado del gateway local
  - H3: Modo de referencias interactivo
  - H3: Opciones de endpoint de Z.AI
  - H2: Indicadores no interactivos adicionales
  - H2: Filtrado previo de proveedores
  - H2: Seguimientos de búsqueda web
  - H2: Otros comportamientos
  - H2: Comandos de seguimiento habituales

## cli/pairing.md

- Ruta: /cli/pairing
- Encabezados:
  - H1: openclaw pairing
  - H2: Comandos
  - H2: pairing list
  - H2: pairing approve
  - H3: Inicialización del propietario
  - H2: Contenido relacionado

## cli/path.md

- Ruta: /cli/path
- Encabezados:
  - H1: openclaw path
  - H2: Por qué usarlo
  - H2: Cómo se utiliza
  - H2: Cómo funciona
  - H2: Subcomandos
  - H2: Indicadores globales
  - H2: Sintaxis de oc://
  - H2: Direccionamiento por tipo de archivo
  - H2: Contrato de modificación
  - H2: Ejemplos
  - H2: Procedimientos por tipo de archivo
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Referencia de subcomandos
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Códigos de salida
  - H2: Modo de salida
  - H2: Notas
  - H2: Contenido relacionado

## cli/plugins.md

- Ruta: /cli/plugins
- Encabezados:
  - H2: Comandos
  - H2: Creación
  - H3: Estructura inicial del proveedor
  - H2: Instalación
  - H3: Notación abreviada del mercado
  - H2: Lista
  - H3: Índice de plugins
  - H2: Desinstalación
  - H2: Actualización
  - H2: Inspección
  - H2: Diagnóstico
  - H2: Registro
  - H2: Mercado
  - H2: Contenido relacionado

## cli/policy.md

- Ruta: /cli/policy
- Encabezados:
  - H1: openclaw policy
  - H2: Inicio rápido
  - H3: Referencia de reglas de políticas
  - H4: Superposiciones con ámbito
  - H4: Canales
  - H4: Servidores MCP
  - H4: Proveedores de modelos
  - H4: Red
  - H4: Acceso de entrada y a canales
  - H4: Gateway
  - H4: Espacio de trabajo del agente
  - H4: Postura del entorno aislado
  - H4: Tratamiento de datos
  - H4: Secretos
  - H4: Aprobaciones de ejecución
  - H4: Perfiles de autenticación
  - H4: Metadatos de herramientas
  - H4: Postura de herramientas
  - H2: Ejecutar comprobaciones
  - H2: Configurar la política
  - H2: Aceptar el estado de la política
  - H2: Hallazgos
  - H2: Reparación
  - H2: Códigos de salida
  - H2: Contenido relacionado

## cli/promos.md

- Ruta: /cli/promos
- Encabezados:
  - H1: openclaw promos
  - H2: Comandos
  - H2: openclaw promos list
  - H2: openclaw promos claim &lt;slug&gt;
  - H2: Detección pasiva en la lista de modelos

## cli/proxy.md

- Ruta: /cli/proxy
- Encabezados:
  - H1: openclaw proxy
  - H2: Validación
  - H3: Opciones
  - H2: Depuración del proxy
  - H2: Contenido relacionado

## cli/qr.md

- Ruta: /cli/qr
- Encabezados:
  - H1: openclaw qr
  - H2: Opciones
  - H2: Contenido del código de configuración
  - H2: Resolución de la URL del Gateway
  - H2: Resolución de autenticación (sin --remote)
  - H2: Resolución de autenticación (--remote)
  - H2: Contenido relacionado

## cli/reset.md

- Ruta: /cli/reset
- Encabezados:
  - H1: openclaw reset
  - H2: Opciones
  - H2: Ámbitos
  - H2: Notas
  - H2: Contenido relacionado

## cli/sandbox.md

- Ruta: /cli/sandbox
- Encabezados:
  - H2: Comandos
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H3: openclaw sandbox explain
  - H2: Por qué es necesaria la recreación
  - H2: Desencadenantes habituales
  - H2: Migración del registro
  - H2: Configuración
  - H2: Contenido relacionado

## cli/secrets.md

- Ruta: /cli/secrets
- Encabezados:
  - H1: openclaw secrets
  - H2: Recargar la instantánea del entorno de ejecución
  - H2: Auditoría
  - H2: Configuración (asistente interactivo)
  - H3: Seguridad del proveedor de ejecución
  - H2: Aplicar un plan guardado
  - H3: Por qué no hay copias de seguridad para reversión
  - H2: Ejemplo
  - H2: Contenido relacionado

## cli/security.md

- Ruta: /cli/security
- Encabezados:
  - H1: openclaw security
  - H2: Modos de auditoría
  - H2: Qué comprueba
  - H2: Comportamiento de SecretRef
  - H2: Supresiones
  - H2: Salida JSON
  - H2: Qué modifica --fix
  - H2: Contenido relacionado

## cli/sessions.md

- Ruta: /cli/sessions
- Encabezados:
  - H1: openclaw sessions
  - H2: Seguir el progreso de la trayectoria
  - H2: Exportar un paquete de trayectoria
  - H2: Mantenimiento de limpieza
  - H2: Compactar una sesión
  - H3: RPC sessions.compact
  - H2: Contenido relacionado

## cli/setup.md

- Ruta: /cli/setup
- Encabezados:
  - H1: openclaw setup
  - H2: Opciones
  - H3: Modo de referencia
  - H2: Ejemplos
  - H2: Notas
  - H2: Contenido relacionado

## cli/skills.md

- Ruta: /cli/skills
- Encabezados:
  - H1: openclaw skills
  - H2: Comandos
  - H2: Taller de skills
  - H2: Contenido relacionado

## cli/status.md

- Ruta: /cli/status
- Encabezados:
  - H2: Resolución de sesión y modelo
  - H2: Uso y cuota
  - H2: Resumen y estado de actualización
  - H2: Secretos
  - H2: Memoria
  - H2: Contenido relacionado

## cli/system.md

- Ruta: /cli/system
- Encabezados:
  - H1: openclaw system
  - H2: Comandos habituales
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Notas
  - H2: Contenido relacionado

## cli/tasks.md

- Ruta: /cli/tasks
- Encabezados:
  - H2: Uso
  - H2: Opciones raíz
  - H2: Subcomandos
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Contenido relacionado

## cli/transcripts.md

- Ruta: /cli/transcripts
- Encabezados:
  - H1: openclaw transcripts
  - H2: Comandos
  - H2: Salida
  - H2: Muchas sesiones por día
  - H2: Resúmenes ausentes
  - H2: Configuración

## cli/tui.md

- Ruta: /cli/tui
- Encabezados:
  - H1: openclaw tui
  - H2: Opciones
  - H2: Notas
  - H2: Ejemplos
  - H2: Bucle de reparación de la configuración
  - H2: Contenido relacionado

## cli/uninstall.md

- Ruta: /cli/uninstall
- Encabezados:
  - H1: openclaw uninstall
  - H2: Opciones
  - H2: Ejemplos
  - H2: Notas
  - H2: Contenido relacionado

## cli/update.md

- Ruta: /cli/update
- Encabezados:
  - H1: openclaw update
  - H2: Uso
  - H2: Opciones
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Qué hace
  - H3: Transferencia del reinicio
  - H3: Forma de la respuesta del plano de control
  - H2: Flujo de checkout de Git
  - H3: Selección de canal
  - H3: Pasos de actualización
  - H3: Detalles de sincronización de plugins
  - H2: Contenido relacionado

## cli/voicecall.md

- Ruta: /cli/voicecall
- Encabezados:
  - H1: openclaw voicecall
  - H2: Subcomandos
  - H2: Configuración y prueba rápida
  - H3: setup
  - H3: smoke
  - H2: Ciclo de vida de las llamadas
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Registros y métricas
  - H3: tail
  - H3: latency
  - H2: Exposición de webhooks
  - H3: expose
  - H2: Contenido relacionado

## cli/webhooks.md

- Ruta: /cli/webhooks
- Encabezados:
  - H1: openclaw webhooks
  - H2: Subcomandos
  - H2: webhooks gmail setup
  - H3: Requisitos
  - H3: Opciones de Pub/Sub
  - H3: Opciones de entrega de OpenClaw
  - H3: Opciones de gog watch serve
  - H3: Exposición mediante Tailscale
  - H3: Salida
  - H2: webhooks gmail run
  - H2: Contenido relacionado

## cli/wiki.md

- Ruta: /cli/wiki
- Encabezados:
  - H1: openclaw wiki
  - H2: Comandos habituales
  - H2: Selección de agente
  - H2: Comandos
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki chatgpt import
  - H3: wiki chatgpt rollback &lt;run-id&gt;
  - H3: wiki obsidian ...
  - H2: Orientación práctica de uso
  - H2: Vinculaciones de configuración
  - H2: Contenido relacionado

## cli/workboard.md

- Ruta: /cli/workboard
- Encabezados:
  - H2: Uso
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Equivalencia con comandos de barra
  - H2: Permisos
  - H2: Solución de problemas
  - H3: No aparece ninguna tarjeta
  - H3: dispatch indica que solo admite datos
  - H3: dispatch no inicia nada
  - H2: Contenido relacionado

## concepts/active-memory.md

- Ruta: /concepts/active-memory
- Encabezados:
  - H2: Inicio rápido
  - H2: Cómo funciona
  - H2: Cuándo se ejecuta
  - H3: Tipos de sesión
  - H2: Alternancia de sesión
  - H2: Cómo verlo
  - H2: Modos de consulta
  - H2: Estilos de prompt
  - H2: Política de respaldo de modelos
  - H3: Recomendaciones de velocidad
  - H4: Configuración de Cerebras
  - H2: Herramientas de memoria
  - H3: memory-core integrado
  - H3: Memoria de LanceDB
  - H3: Lossless Claw
  - H2: Vías de escape avanzadas
  - H2: Persistencia de transcripciones
  - H2: Configuración
  - H2: Configuración recomendada
  - H3: Período de gracia de arranque en frío
  - H2: Depuración
  - H2: Problemas comunes
  - H2: Páginas relacionadas

## concepts/agent-loop.md

- Ruta: /concepts/agent-loop
- Encabezados:
  - H2: Puntos de entrada
  - H2: Secuencia de ejecución
  - H2: Colas y concurrencia
  - H2: Preparación de la sesión y del espacio de trabajo
  - H2: Ensamblaje del prompt
  - H2: Hooks
  - H3: Hooks internos (hooks del Gateway)
  - H3: Hooks de Plugin
  - H2: Transmisión
  - H2: Ejecución de herramientas
  - H2: Conformación de respuestas
  - H2: Compaction y reintentos
  - H2: Flujos de eventos
  - H2: Gestión de canales de chat
  - H2: Tiempos de espera
  - H3: Diagnóstico de sesiones bloqueadas
  - H2: Dónde puede finalizar anticipadamente
  - H2: Contenido relacionado

## concepts/agent-runtimes.md

- Ruta: /concepts/agent-runtimes
- Encabezados:
  - H2: Superficies de Codex
  - H2: Propiedad del entorno de ejecución
  - H2: Selección del entorno de ejecución
  - H2: Entorno de ejecución del agente de GitHub Copilot
  - H2: Contrato de compatibilidad
  - H2: Etiquetas de estado
  - H2: Contenido relacionado

## concepts/agent-workspace.md

- Ruta: /concepts/agent-workspace
- Encabezados:
  - H2: Ubicación predeterminada
  - H2: Carpetas adicionales del espacio de trabajo
  - H2: Mapa de archivos del espacio de trabajo
  - H2: Qué NO está en el espacio de trabajo
  - H2: Copia de seguridad con Git (recomendada, privada)
  - H2: No confirmar secretos
  - H2: Trasladar el espacio de trabajo a una máquina nueva
  - H2: Notas avanzadas
  - H2: Contenido relacionado

## concepts/agent.md

- Ruta: /concepts/agent
- Encabezados:
  - H2: Espacio de trabajo (obligatorio)
  - H2: Archivos de arranque (inyectados)
  - H2: Herramientas integradas
  - H2: Skills
  - H2: Límites del entorno de ejecución
  - H2: Sesiones
  - H2: Orientación durante la transmisión
  - H2: Referencias de modelos
  - H2: Configuración (mínima)
  - H2: Contenido relacionado

## concepts/architecture.md

- Ruta: /concepts/architecture
- Encabezados:
  - H2: Descripción general
  - H2: Componentes y flujos
  - H3: Gateway (demonio)
  - H3: Clientes (aplicación para Mac / CLI / administración web)
  - H3: Nodes (macOS / iOS / Android / sin interfaz)
  - H3: WebChat
  - H2: Ciclo de vida de la conexión (un solo cliente)
  - H2: Protocolo de comunicación (resumen)
  - H2: Emparejamiento y confianza local
  - H2: Tipado del protocolo y generación de código
  - H2: Acceso remoto
  - H2: Instantánea de operaciones
  - H2: Invariantes
  - H2: Contenido relacionado

## concepts/channel-docking.md

- Ruta: /concepts/channel-docking
- Encabezados:
  - H2: Ejemplo
  - H2: Por qué usarlo
  - H2: Configuración obligatoria
  - H2: Comandos
  - H2: Qué cambia
  - H2: Qué no cambia
  - H2: Solución de problemas

## concepts/commitments.md

- Ruta: /concepts/commitments
- Encabezados:
  - H2: Activar compromisos
  - H2: Cómo funciona
  - H2: Ámbito
  - H2: Compromisos frente a recordatorios
  - H2: Administrar compromisos
  - H2: Privacidad y coste
  - H2: Solución de problemas
  - H2: Contenido relacionado

## concepts/compaction.md

- Ruta: /concepts/compaction
- Encabezados:
  - H2: Cómo funciona
  - H2: Compaction automática
  - H2: Compaction manual
  - H2: Configuración
  - H3: Uso de un modelo diferente
  - H3: Conservación de identificadores
  - H3: Protección por bytes de la transcripción activa
  - H3: Transcripciones sucesoras
  - H3: Avisos de Compaction
  - H3: Vaciado de memoria
  - H2: Proveedores de Compaction conectables
  - H2: Compaction frente a poda
  - H2: Solución de problemas
  - H2: Contenido relacionado

## concepts/context-engine.md

- Ruta: /concepts/context-engine
- Encabezados:
  - H2: Inicio rápido
  - H2: Cómo funciona
  - H3: Ciclo de vida del subagente (opcional)
  - H3: Adición al prompt del sistema
  - H2: El motor heredado
  - H2: Motores de Plugin
  - H3: La interfaz ContextEngine
  - H3: Ajustes del entorno de ejecución
  - H3: Requisitos del host
  - H3: Aislamiento de fallos
  - H3: ownsCompaction
  - H2: Referencia de configuración
  - H2: Relación con la Compaction y la memoria
  - H2: Consejos
  - H2: Contenido relacionado

## concepts/context.md

- Ruta: /concepts/context
- Encabezados:
  - H2: Inicio rápido (inspeccionar el contexto)
  - H2: Ejemplo de salida
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Qué cuenta para la ventana de contexto
  - H2: Cómo crea OpenClaw el prompt del sistema
  - H2: Archivos inyectados del espacio de trabajo (contexto del proyecto)
  - H2: Skills: inyectadas frente a cargadas bajo demanda
  - H2: Herramientas: hay dos costes
  - H2: Comandos, directivas y «atajos en línea»
  - H2: Sesiones, Compaction y poda (qué persiste)
  - H2: Qué informa realmente /context
  - H2: Contenido relacionado

## concepts/delegate-architecture.md

- Ruta: /concepts/delegate-architecture
- Encabezados:
  - H2: Qué es un delegado
  - H2: Por qué usar delegados
  - H2: Niveles de capacidad
  - H3: Nivel 1: solo lectura + borrador
  - H3: Nivel 2: envío en nombre de terceros
  - H3: Nivel 3: proactivo
  - H2: Requisitos previos: aislamiento y refuerzo
  - H3: Bloqueos estrictos (no negociables)
  - H3: Restricciones de herramientas
  - H3: Aislamiento del entorno aislado
  - H3: Registro de auditoría
  - H2: Configuración de un delegado
  - H3: 1. Crear el agente delegado
  - H3: 2. Configurar la delegación del proveedor de identidad
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Vincular el delegado a canales
  - H3: 4. Añadir credenciales al agente delegado
  - H2: Ejemplo: asistente organizativo
  - H2: Patrón de escalabilidad
  - H2: Contenido relacionado

## concepts/dreaming.md

- Ruta: /concepts/dreaming
- Encabezados:
  - H2: Qué escribe Dreaming
  - H2: Modelo de fases
  - H2: Ingesta de transcripciones de sesión
  - H2: Diario de sueños
  - H2: Señales de clasificación profunda
  - H3: Cobertura del informe de pruebas en paralelo de control de calidad
  - H2: Programación
  - H2: Inicio rápido
  - H2: Comando con barra
  - H2: Flujo de trabajo de la CLI
  - H2: Valores predeterminados principales
  - H2: Interfaz de sueños
  - H2: Contenido relacionado

## concepts/experimental-features.md

- Ruta: /concepts/experimental-features
- Encabezados:
  - H2: Indicadores documentados actualmente
  - H2: Modo ligero de modelos locales
  - H3: Por qué estas herramientas
  - H3: Cuándo activarlo
  - H3: Cuándo dejarlo desactivado
  - H3: Activación
  - H2: Experimental no significa oculto
  - H2: Contenido relacionado

## concepts/features.md

- Ruta: /concepts/features
- Encabezados:
  - H2: Aspectos destacados
  - H2: Lista completa
  - H2: Contenido relacionado

## concepts/managed-worktrees.md

- Ruta: /concepts/managed-worktrees
- Encabezados:
  - H2: Diseño y nombres
  - H2: Aprovisionamiento de archivos ignorados
  - H2: Ejecución de la configuración del repositorio
  - H2: Árboles de trabajo de sesión
  - H2: Instantáneas, limpieza y restauración
  - H2: CLI
  - H2: Métodos del Gateway
  - H2: Espacios de trabajo del tablero

## concepts/mantis-slack-desktop-runbook.md

- Ruta: /concepts/mantis-slack-desktop-runbook
- Encabezados:
  - H2: Modelo de almacenamiento
  - H2: Despacho de GitHub
  - H2: CLI local
  - H2: Modos de hidratación
  - H2: Interpretación de tiempos
  - H2: Lista de comprobación de evidencias
  - H2: Gestión de fallos
  - H2: Contenido relacionado

## concepts/mantis.md

- Ruta: /concepts/mantis
- Encabezados:
  - H2: Propiedad
  - H2: Comandos de la CLI
  - H3: discord-smoke
  - H3: run
  - H3: desktop-browser-smoke
  - H3: slack-desktop-smoke
  - H3: telegram-desktop-builder
  - H2: Manifiesto de evidencias
  - H2: Automatización de GitHub
  - H2: Máquinas y secretos
  - H2: Resultados de ejecución
  - H2: Adición de un escenario
  - H2: Preguntas abiertas

## concepts/markdown-formatting.md

- Ruta: /concepts/markdown-formatting
- Encabezados:
  - H2: Canalización
  - H2: Ejemplo de representación intermedia
  - H2: Gestión de tablas
  - H2: Reglas de fragmentación
  - H2: Política de enlaces
  - H2: Contenido oculto
  - H2: Adición o actualización del formateador de un canal
  - H2: Errores comunes
  - H2: Contenido relacionado

## concepts/memory-builtin.md

- Ruta: /concepts/memory-builtin
- Encabezados:
  - H2: Qué proporciona
  - H2: Primeros pasos
  - H2: Proveedores de incrustaciones compatibles
  - H2: Cómo funciona la indexación
  - H2: Cuándo usarlo
  - H2: Solución de problemas
  - H2: Configuración
  - H2: Contenido relacionado

## concepts/memory-honcho.md

- Ruta: /concepts/memory-honcho
- Encabezados:
  - H2: Qué proporciona
  - H2: Herramientas disponibles
  - H2: Primeros pasos
  - H2: Configuración
  - H2: Migración de la memoria existente
  - H2: Cómo funciona
  - H2: Honcho frente a la memoria integrada
  - H2: Comandos de la CLI
  - H2: Lecturas adicionales
  - H2: Contenido relacionado

## concepts/memory-qmd.md

- Ruta: /concepts/memory-qmd
- Encabezados:
  - H2: Qué añade respecto a la opción integrada
  - H2: Primeros pasos
  - H3: Requisitos previos
  - H3: Activación
  - H2: Cómo funciona el proceso auxiliar
  - H2: Rendimiento y compatibilidad de la búsqueda
  - H2: Anulaciones de modelos
  - H2: Indexación de rutas adicionales
  - H2: Indexación de transcripciones de sesiones
  - H2: Ámbito de búsqueda
  - H2: Citas
  - H2: Cuándo usarlo
  - H2: Solución de problemas
  - H2: Configuración
  - H2: Contenido relacionado

## concepts/memory-search.md

- Ruta: /concepts/memory-search
- Encabezados:
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H2: Cómo funciona la búsqueda
  - H2: Mejora de la calidad de búsqueda
  - H3: Decaimiento temporal
  - H3: MMR (diversidad)
  - H3: Activar ambos
  - H2: Memoria multimodal
  - H2: Búsqueda en la memoria de sesiones
  - H2: Solución de problemas
  - H2: Contenido relacionado

## concepts/memory.md

- Ruta: /concepts/memory
- Encabezados:
  - H2: Cómo funciona
  - H2: Qué se almacena dónde
  - H2: Memorias sensibles a las acciones
  - H2: Compromisos inferidos
  - H2: Herramientas de memoria
  - H2: Búsqueda en memoria
  - H2: Sistemas de almacenamiento de memoria
  - H2: Capa wiki de conocimiento
  - H2: Vaciado automático de memoria
  - H2: Dreaming
  - H2: Relleno fundamentado y promoción en vivo
  - H2: CLI
  - H2: Lecturas adicionales

## concepts/message-lifecycle-refactor.md

- Ruta: /concepts/message-lifecycle-refactor
- Encabezados:
  - H2: Por qué se realizó esta refactorización
  - H2: Qué se publicó
  - H3: Contexto de envío
  - H3: Contexto de recepción
  - H3: Vista previa en vivo
  - H3: Confirmaciones persistentes
  - H3: Reducción del SDK público
  - H2: En qué difirió la implementación del diseño original
  - H2: Riesgos concretos de migración (aún relevantes)
  - H2: Clasificación de fallos
  - H2: Preguntas abiertas
  - H2: Contenido relacionado

## concepts/messages.md

- Ruta: /concepts/messages
- Encabezados:
  - H2: Desduplicación de entrada
  - H2: Antirrebote de entrada
  - H2: Sesiones y dispositivos
  - H2: Cuerpos de prompts y contexto del historial
  - H2: Metadatos de resultados de herramientas
  - H2: Colas y seguimientos
  - H2: Propiedad de ejecución del canal
  - H2: Transmisión, fragmentación y procesamiento por lotes
  - H2: Visibilidad del razonamiento y tokens
  - H2: Prefijos, hilos y respuestas
  - H2: Respuestas silenciosas
  - H2: Contenido relacionado

## concepts/model-failover.md

- Ruta: /concepts/model-failover
- Encabezados:
  - H2: Flujo del entorno de ejecución
  - H2: Política de origen de selección
  - H2: Caché de omisión por fallos de autenticación
  - H2: Avisos de respaldo visibles para el usuario
  - H2: Almacenamiento de autenticación (claves + OAuth)
  - H2: Identificadores de perfiles
  - H2: Orden de rotación
  - H3: Afinidad de sesión (propicia para la caché)
  - H3: Suscripción a OpenAI Codex con respaldo mediante clave de API
  - H2: Períodos de espera
  - H2: Desactivaciones por facturación
  - H2: Respaldo de modelos
  - H3: Reglas de la cadena de candidatos
  - H3: Qué errores hacen avanzar el respaldo
  - H3: Comportamiento de omisión frente a sondeo durante el período de espera
  - H2: Anulaciones de sesión y cambio de modelo en vivo
  - H2: Observabilidad y resúmenes de fallos
  - H2: Configuración relacionada

## concepts/model-providers.md

- Ruta: /concepts/model-providers
- Encabezados:
  - H2: Reglas rápidas
  - H2: Comportamiento de proveedores gestionado por el Plugin
  - H2: Rotación de claves de API
  - H2: Plugins oficiales de proveedores
  - H3: OpenAI
  - H3: Anthropic
  - H3: OAuth de OpenAI ChatGPT/Codex
  - H3: Otras opciones alojadas mediante suscripción
  - H3: OpenCode
  - H3: Google Gemini (clave de API)
  - H3: Google Vertex y CLI de Gemini
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Otros Plugins de proveedores incluidos
  - H4: Particularidades que conviene conocer
  - H2: Proveedores mediante models.providers (URL personalizada/base)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi Coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (internacional)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proxies locales (LM Studio, vLLM, LiteLLM, etc.)
  - H2: Ejemplos de la CLI
  - H2: Contenido relacionado

## concepts/models.md

- Ruta: /concepts/models
- Encabezados:
  - H2: Orden de selección
  - H2: Origen de selección y rigurosidad del respaldo
  - H2: Política rápida de modelos
  - H2: Incorporación
  - H2: «El modelo no está permitido» (y por qué se detienen las respuestas)
  - H2: /model en el chat
  - H2: CLI
  - H2: Registro de modelos (models.json)
  - H2: Contenido relacionado

## concepts/multi-agent.md

- Ruta: /concepts/multi-agent
- Encabezados:
  - H2: Qué es un agente
  - H2: Rutas
  - H3: Modo de agente único (predeterminado)
  - H2: Asistente del agente
  - H2: Inicio rápido
  - H2: Varios agentes, varias identidades
  - H2: Bóvedas de la wiki de memoria por agente
  - H2: Búsqueda de memoria QMD entre agentes
  - H2: Un número de WhatsApp, varias personas (división de mensajes directos)
  - H2: Reglas de enrutamiento
  - H2: Varias cuentas o números de teléfono
  - H2: Conceptos
  - H2: Ejemplos de plataformas
  - H2: Patrones comunes
  - H2: Configuración del entorno aislado y las herramientas por agente
  - H2: Contenido relacionado

## concepts/oauth.md

- Ruta: /concepts/oauth
- Encabezados:
  - H2: El receptor de tokens (por qué existe)
  - H2: Almacenamiento (dónde se guardan los tokens)
  - H2: Reutilización de la CLI de Anthropic Claude
  - H2: Intercambio de OAuth (cómo funciona el inicio de sesión)
  - H3: Token de configuración de Anthropic
  - H3: OpenAI Codex (OAuth de ChatGPT)
  - H2: Renovación y caducidad
  - H2: Varias cuentas (perfiles) y enrutamiento
  - H3: 1) Opción recomendada: agentes separados
  - H3: 2) Opción avanzada: varios perfiles en un agente
  - H2: Contenido relacionado

## concepts/parallel-specialist-lanes.md

- Ruta: /concepts/parallel-specialist-lanes
- Encabezados:
  - H2: Principios fundamentales
  - H2: Implementación gradual recomendada
  - H3: Fase 1: contratos de carril y trabajo pesado en segundo plano
  - H3: Fase 2: controles de prioridad y concurrencia
  - H3: Fase 3: coordinador o controlador de tráfico
  - H2: Plantilla mínima de contrato de carril
  - H2: Contenido relacionado

## concepts/personal-agent-benchmark-pack.md

- Ruta: /concepts/personal-agent-benchmark-pack
- Encabezados:
  - H2: Escenarios
  - H2: Modelo de privacidad
  - H2: Ampliación del paquete

## concepts/presence.md

- Ruta: /concepts/presence
- Encabezados:
  - H2: Campos de presencia (qué se muestra)
  - H2: Productores (de dónde procede la presencia)
  - H3: 1) Entrada propia del Gateway
  - H3: 2) Conexión de WebSocket
  - H4: Por qué no aparecen las conexiones efímeras del plano de control
  - H3: 3) Balizas de eventos del sistema
  - H3: 4) Conexiones de Node (rol: node)
  - H2: Reglas de combinación y eliminación de duplicados (por qué importa instanceId)
  - H2: TTL y tamaño limitado
  - H2: Advertencia sobre conexiones remotas o túneles (direcciones IP de bucle invertido)
  - H2: Consumidores
  - H3: Página Dispositivos de la interfaz de control
  - H3: Pestaña Instancias de macOS
  - H2: Consejos de depuración
  - H2: Contenido relacionado

## concepts/progress-drafts.md

- Ruta: /concepts/progress-drafts
- Encabezados:
  - H2: Inicio rápido
  - H2: Qué ven los usuarios
  - H2: Elección de un modo
  - H2: Configuración de etiquetas
  - H2: Control de las líneas de progreso
  - H3: Modo detallado
  - H3: Texto de comandos y ejecución
  - H3: Carril de comentarios
  - H3: Estado narrado
  - H3: Límites de líneas
  - H3: Representación enriquecida (Slack)
  - H3: Ocultar líneas de herramientas y tareas
  - H2: Comportamiento del canal
  - H2: Finalización
  - H2: Solución de problemas
  - H2: Contenido relacionado

## concepts/qa-e2e-automation.md

- Ruta: /concepts/qa-e2e-automation
- Encabezados:
  - H2: Superficie de comandos
  - H3: Ejecución de control de calidad respaldada por un perfil
  - H2: Flujo del operador
  - H3: Pruebas rápidas de observabilidad
  - H3: Carriles de pruebas rápidas de Matrix
  - H3: Escenarios de Discord con Mantis
  - H3: Ejecutores de escritorio y tareas visuales de Mantis para Slack
  - H3: Comprobación del estado del grupo de credenciales
  - H2: Cobertura del transporte en vivo
  - H2: Referencia de control de calidad para Discord, Slack, Telegram y WhatsApp
  - H3: Indicadores compartidos de la CLI
  - H3: Control de calidad de Telegram
  - H3: Control de calidad de Discord
  - H3: Control de calidad de Slack
  - H4: Configuración del espacio de trabajo de Slack
  - H3: Control de calidad de WhatsApp
  - H3: Grupo de credenciales de Convex
  - H2: Datos iniciales respaldados por el repositorio
  - H2: Carriles de simulación de proveedores
  - H2: Adaptadores de transporte
  - H3: Adición de un canal
  - H3: Nombres de asistentes para escenarios
  - H2: Informes
  - H2: Documentación relacionada

## concepts/qa-matrix.md

- Ruta: /concepts/qa-matrix
- Encabezados:
  - H2: Inicio rápido
  - H2: Qué hace el carril
  - H2: CLI
  - H3: Indicadores comunes
  - H3: Indicadores de proveedores
  - H2: Perfiles
  - H2: Escenarios
  - H2: Variables de entorno
  - H2: Artefactos de salida
  - H2: Consejos de triaje
  - H2: Contrato de transporte en vivo
  - H2: Contenido relacionado

## concepts/queue-steering.md

- Ruta: /concepts/queue-steering
- Encabezados:
  - H2: Límite del entorno de ejecución
  - H2: Modos
  - H2: Ejemplo de ráfaga
  - H2: Ámbito
  - H2: Antirrebote
  - H2: Contenido relacionado

## concepts/queue.md

- Ruta: /concepts/queue
- Encabezados:
  - H2: Motivo
  - H2: Cómo funciona
  - H2: Valores predeterminados
  - H2: Modos de cola
  - H2: Opciones de cola
  - H2: Dirección y transmisión
  - H2: Precedencia
  - H2: Anulaciones por sesión
  - H2: Cancelación de turnos en cola
  - H2: Ámbito y garantías
  - H2: Solución de problemas
  - H2: Contenido relacionado

## concepts/retry.md

- Ruta: /concepts/retry
- Encabezados:
  - H2: Objetivos
  - H2: Valores predeterminados
  - H2: Comportamiento
  - H3: Proveedores de modelos
  - H3: Discord
  - H3: Telegram
  - H2: Configuración
  - H2: Notas
  - H2: Contenido relacionado

## concepts/session-pruning.md

- Ruta: /concepts/session-pruning
- Encabezados:
  - H2: Por qué es importante
  - H2: Cómo funciona
  - H2: Limpieza de imágenes heredadas
  - H2: Valores predeterminados inteligentes
  - H2: Activación o desactivación
  - H2: Poda frente a Compaction
  - H2: Lecturas adicionales
  - H2: Contenido relacionado

## concepts/session-search.md

- Ruta: /concepts/session-search
- Encabezados:
  - H1: Búsqueda de sesiones
  - H2: Visibilidad y salida
  - H2: Ciclo de vida del índice
  - H2: Búsqueda de sesiones frente a búsqueda de memoria

## concepts/session-tool.md

- Ruta: /concepts/session-tool
- Encabezados:
  - H2: Herramientas disponibles
  - H2: Listado y lectura de sesiones
  - H2: Envío de mensajes entre sesiones
  - H2: Asistentes de estado y orquestación
  - H2: Cambios de estado de las sesiones
  - H2: Creación de subagentes
  - H2: Visibilidad
  - H2: Lecturas adicionales
  - H2: Contenido relacionado

## concepts/session.md

- Ruta: /concepts/session
- Encabezados:
  - H2: Cómo se enrutan los mensajes
  - H2: Aislamiento de mensajes directos
  - H3: Acoplamiento de canales vinculados
  - H2: Ciclo de vida de las sesiones
  - H2: Dónde se guarda el estado
  - H2: Mantenimiento de sesiones
  - H2: Inspección de sesiones
  - H2: Lecturas adicionales
  - H2: Contenido relacionado

## concepts/soul.md

- Ruta: /concepts/soul
- Encabezados:
  - H2: Qué debe incluirse en SOUL.md
  - H2: Por qué funciona
  - H2: El prompt de Molty
  - H2: Aspecto de un buen resultado
  - H2: Una advertencia
  - H2: Contenido relacionado

## concepts/streaming.md

- Ruta: /concepts/streaming
- Encabezados:
  - H2: Transmisión por bloques (mensajes de canal)
  - H3: Entrega de contenido multimedia con transmisión por bloques
  - H2: Algoritmo de fragmentación (límites inferior/superior)
  - H2: Fusión (combinar bloques transmitidos)
  - H2: Ritmo similar al humano entre bloques
  - H2: "Transmitir fragmentos o todo"
  - H2: Modos de transmisión de vista previa
  - H3: Asignación de canales
  - H3: Migración de claves heredadas
  - H2: Comportamiento en tiempo de ejecución
  - H3: Telegram
  - H3: Discord
  - H3: Slack
  - H3: Mattermost
  - H3: Matrix
  - H2: Actualizaciones de vista previa del progreso de herramientas
  - H2: Representación del borrador de progreso
  - H3: Canal de progreso de comentarios
  - H2: Contenido relacionado

## concepts/system-prompt.md

- Ruta: /concepts/system-prompt
- Encabezados:
  - H2: Estructura
  - H2: Modos del prompt
  - H2: Instantáneas del prompt
  - H2: Inyección de inicialización del espacio de trabajo
  - H2: Gestión del tiempo
  - H2: Skills
  - H2: Documentación
  - H2: Contenido relacionado

## concepts/timezone.md

- Ruta: /concepts/timezone
- Encabezados:
  - H2: Tres superficies de zona horaria
  - H2: Configuración de la zona horaria del usuario
  - H2: Valores de zona horaria del sobre
  - H2: Cuándo sobrescribir
  - H2: Contenido relacionado

## concepts/typebox.md

- Ruta: /concepts/typebox
- Encabezados:
  - H2: Modelo mental (30 segundos)
  - H2: Dónde se encuentran los esquemas
  - H2: Canalización actual
  - H2: Cómo se utilizan los esquemas en tiempo de ejecución
  - H2: Ejemplos de tramas
  - H2: Cliente mínimo (Node.js)
  - H2: Ejemplo práctico: añadir un método de extremo a extremo
  - H2: Comportamiento de la generación de código Swift
  - H2: Versionado y compatibilidad
  - H2: Patrones y convenciones de los esquemas
  - H2: JSON del esquema en vivo
  - H2: Cuando se modifican los esquemas
  - H2: Contenido relacionado

## concepts/typing-indicators.md

- Ruta: /concepts/typing-indicators
- Encabezados:
  - H2: Valores predeterminados
  - H2: Modos
  - H2: Configuración
  - H2: Notas
  - H2: Contenido relacionado

## concepts/usage-tracking.md

- Ruta: /concepts/usage-tracking
- Encabezados:
  - H2: Qué es
  - H2: Dónde aparece
  - H2: Historial de costes de Anthropic y OpenAI
  - H2: Modo predeterminado del pie de uso
  - H3: Tres estados de sesión distintos
  - H3: Precedencia
  - H3: Restablecer frente a desactivar
  - H3: Comportamiento de alternancia
  - H3: Configuración
  - H2: Pie completo personalizado de /usage
  - H3: Forma
  - H3: Rutas de contrato
  - H3: Verbos
  - H3: Formas de las piezas
  - H3: Ejemplo
  - H2: Proveedores y credenciales
  - H2: Contenido relacionado

## date-time.md

- Ruta: /date-time
- Encabezados:
  - H2: Sobres de mensajes (locales de forma predeterminada)
  - H3: Ejemplos
  - H2: Prompt del sistema: fecha y hora actuales
  - H2: Líneas de eventos del sistema (locales de forma predeterminada)
  - H3: Configurar la zona horaria y el formato del usuario
  - H2: Detección del formato de hora (automática)
  - H2: Cargas útiles de herramientas y conectores (hora sin procesar del proveedor y campos normalizados)
  - H2: Documentación relacionada

## debug/node-issue.md

- Ruta: /debug/node-issue
- Encabezados:
  - H1: Fallo de Node + tsx "\\name is not a function"
  - H2: Estado
  - H2: Síntoma original
  - H2: Causa
  - H2: Comprobación de reproducción actual
  - H2: Soluciones alternativas (si el fallo vuelve a producirse)
  - H2: Referencias
  - H2: Contenido relacionado

## diagnostics/flags.md

- Ruta: /diagnostics/flags
- Encabezados:
  - H2: Cómo funciona
  - H2: Indicadores conocidos
  - H2: Habilitar mediante la configuración
  - H2: Sobrescritura mediante variable de entorno (puntual)
  - H2: Indicadores del generador de perfiles
  - H2: Artefactos de la cronología
  - H2: Dónde se guardan los registros
  - H2: Extraer registros
  - H2: Notas
  - H2: Contenido relacionado

## gateway/audit.md

- Ruta: /gateway/audit
- Encabezados:
  - H1: Historial de auditoría
  - H2: Familias de registros
  - H2: Eventos del ciclo de vida de los mensajes
  - H3: Clasificación del tipo de conversación
  - H2: Modelo de privacidad
  - H2: Límites de cobertura y comprobación
  - H2: Almacenamiento, retención y migración
  - H2: Consultas
  - H2: Contenido relacionado

## gateway/authentication.md

- Ruta: /gateway/authentication
- Encabezados:
  - H2: Configuración recomendada: clave de API (cualquier proveedor)
  - H2: Anthropic: reutilización de Claude CLI
  - H2: Introducción manual del token
  - H3: Credenciales respaldadas por SecretRef
  - H2: Comprobación del estado de autenticación del modelo
  - H2: Rotación de claves de API (gateway)
  - H2: Eliminación de la autenticación del proveedor mientras el gateway está en ejecución
  - H2: Control de qué credencial se utiliza
  - H3: OpenAI e identificadores heredados de openai-codex
  - H3: Durante el inicio de sesión (CLI)
  - H3: Por sesión (comando de chat)
  - H3: Por agente (sobrescritura mediante CLI)
  - H2: Solución de problemas
  - H3: "No se encontraron credenciales"
  - H3: Token próximo a caducar o caducado
  - H2: Contenido relacionado

## gateway/background-process.md

- Ruta: /gateway/background-process
- Encabezados:
  - H2: Herramienta exec
  - H3: Sobrescrituras mediante variables de entorno
  - H3: Configuración (preferida frente a las sobrescrituras mediante variables de entorno)
  - H2: Puente de procesos secundarios
  - H2: Herramienta process
  - H2: Ejemplos
  - H2: Contenido relacionado

## gateway/bonjour.md

- Ruta: /gateway/bonjour
- Encabezados:
  - H2: Bonjour de área extensa (DNS-SD unidifusión) mediante Tailscale
  - H3: Configuración del gateway
  - H3: Configuración única del servidor DNS (host del gateway, solo macOS)
  - H3: Configuración de DNS de Tailscale
  - H3: Seguridad del agente de escucha del gateway
  - H2: Qué se anuncia
  - H2: Tipos de servicio
  - H2: Claves TXT (indicaciones no secretas)
  - H2: Depuración en macOS
  - H2: Depuración en los registros del gateway
  - H2: Depuración en el nodo iOS
  - H2: Cuándo habilitar Bonjour
  - H2: Cuándo deshabilitar Bonjour
  - H2: Particularidades de Docker
  - H2: Solución de problemas de Bonjour deshabilitado
  - H2: Modos de fallo comunes
  - H2: Nombres de instancia con caracteres de escape (\032)
  - H2: Habilitación, deshabilitación y configuración
  - H2: Documentación relacionada

## gateway/bridge-protocol.md

- Ruta: /gateway/bridge-protocol
- Encabezados:
  - H2: Por qué existía
  - H2: Transporte
  - H2: Negociación inicial y emparejamiento
  - H2: Tramas
  - H2: Eventos del ciclo de vida de exec
  - H2: Uso histórico de la red de Tailscale
  - H2: Versionado
  - H2: Contenido relacionado

## gateway/cli-backends.md

- Ruta: /gateway/cli-backends
- Encabezados:
  - H2: Inicio rápido
  - H2: Uso como alternativa
  - H2: Configuración
  - H2: Cómo funciona
  - H3: Particularidades de Claude CLI
  - H2: Sesiones
  - H2: Preámbulo alternativo de las sesiones de claude-cli
  - H2: Imágenes
  - H2: Entradas y salidas
  - H2: Valores predeterminados propiedad del Plugin
  - H2: Capas de transformación de texto
  - H2: Propiedad de Compaction nativa
  - H2: Capas MCP del paquete
  - H2: Límite del historial de reinicialización
  - H2: Limitaciones
  - H2: Solución de problemas
  - H2: Contenido relacionado

## gateway/config-agents.md

- Ruta: /gateway/config-agents
- Encabezados:
  - H2: Valores predeterminados de los agentes
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Reemplazos del perfil de arranque por agente
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Mapa de propiedad del presupuesto de contexto
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Política de ejecución
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Transmisión por bloques
  - H3: Indicadores de escritura
  - H3: agents.defaults.sandbox
  - H3: agents.list (reemplazos por agente)
  - H2: Enrutamiento multiagente
  - H3: Campos de coincidencia de vinculaciones
  - H3: Perfiles de acceso por agente
  - H2: Sesión
  - H2: Mensajes
  - H3: Prefijo de respuesta
  - H3: Reacción de acuse de recibo
  - H3: Cola
  - H3: Antirrebote de entrada
  - H3: Otras claves de mensajes
  - H3: TTS (texto a voz)
  - H2: Conversación
  - H2: Contenido relacionado

## gateway/config-channels.md

- Ruta: /gateway/config-channels
- Encabezados:
  - H2: Canales
  - H3: Acceso a mensajes directos y grupos
  - H3: Reemplazos de modelo por canal
  - H3: Valores predeterminados de los canales y Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Varias cuentas (todos los canales)
  - H3: Otros canales de Plugin
  - H3: Control por menciones en chats grupales
  - H4: Límites del historial de mensajes directos
  - H4: Modo de chat personal
  - H3: Comandos (gestión de comandos de chat)
  - H2: Contenido relacionado

## gateway/config-tools.md

- Ruta: /gateway/config-tools
- Encabezados:
  - H2: Herramientas
  - H3: Perfiles de herramientas
  - H3: Grupos de herramientas
  - H3: Herramientas de MCP y Plugin dentro de la política de herramientas del entorno aislado
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Proveedores personalizados y URL base
  - H3: Detalles de los campos del proveedor
  - H3: Ejemplos de proveedores
  - H2: Contenido relacionado

## gateway/configuration-examples.md

- Ruta: /gateway/configuration-examples
- Encabezados:
  - H2: Inicio rápido
  - H3: Mínimo absoluto
  - H3: Configuración inicial recomendada
  - H2: Ejemplo ampliado (opciones principales)
  - H3: Repositorio hermano de Skills enlazado simbólicamente
  - H2: Patrones comunes
  - H3: Base compartida de Skills con un reemplazo
  - H3: Configuración multiplataforma
  - H3: Aprobación automática de una red de Node de confianza
  - H3: Modo seguro de mensajes directos (bandeja de entrada compartida/mensajes directos multiusuario)
  - H3: Clave de API de Anthropic y MiniMax como alternativa
  - H3: Bot de trabajo (acceso restringido)
  - H3: Solo modelos locales
  - H2: Consejos
  - H2: Contenido relacionado

## gateway/configuration-reference.md

- Ruta: /gateway/configuration-reference
- Encabezados:
  - H2: Canales
  - H2: Valores predeterminados de los agentes, multiagente, sesiones y mensajes
  - H2: Herramientas y proveedores personalizados
  - H2: Modelos
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Configuración del Plugin del entorno de ejecución de Codex
  - H2: Compromisos
  - H2: Navegador
  - H2: Interfaz de usuario
  - H2: Gateway
  - H3: Endpoints compatibles con OpenAI
  - H3: Aislamiento de varias instancias
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Entornos de trabajadores en la nube
  - H3: Perfil de Crabbox
  - H3: Perfil de desarrollo SSH estático
  - H2: Hooks
  - H3: Integración con Gmail
  - H2: Host del Plugin de Canvas
  - H2: Descubrimiento
  - H3: mDNS (Bonjour)
  - H3: Área extensa (DNS-SD)
  - H2: Entorno
  - H3: env (variables de entorno insertadas)
  - H3: Sustitución de variables de entorno
  - H2: Secretos
  - H3: SecretRef
  - H3: Superficie de credenciales compatible
  - H3: Configuración de proveedores de secretos
  - H2: Almacenamiento de autenticación
  - H3: auth.cooldowns
  - H2: Auditoría
  - H2: Registro
  - H2: Diagnósticos
  - H2: Actualización
  - H2: ACP
  - H2: CLI
  - H2: Asistente
  - H2: Identidad
  - H2: Puente (obsoleto, eliminado)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variables de plantilla del modelo multimedia
  - H2: Inclusiones de configuración ($include)
  - H2: Contenido relacionado

## gateway/configuration.md

- Ruta: /gateway/configuration
- Encabezados:
  - H2: Configuración mínima
  - H2: Edición de la configuración
  - H2: Validación estricta
  - H2: Tareas comunes
  - H2: Recarga en caliente de la configuración
  - H3: Modos de recarga
  - H3: Qué se aplica en caliente y qué requiere un reinicio
  - H3: Planificación de la recarga
  - H2: RPC de configuración (actualizaciones programáticas)
  - H2: Variables de entorno
  - H2: Referencia completa
  - H2: Contenido relacionado

## gateway/diagnostics.md

- Ruta: /gateway/diagnostics
- Encabezados:
  - H2: Inicio rápido
  - H2: Comando de chat
  - H2: Contenido de la exportación
  - H2: Modelo de privacidad
  - H2: Registrador de estabilidad
  - H2: Opciones útiles
  - H2: Desactivar los diagnósticos
  - H2: Contenido relacionado

## gateway/discovery.md

- Ruta: /gateway/discovery
- Encabezados:
  - H2: Términos
  - H2: Por qué existen tanto la conexión directa como SSH
  - H2: Fuentes de detección
  - H3: 1) Bonjour / DNS-SD
  - H4: Detalles del anuncio del servicio
  - H3: 2) Tailnet (entre redes)
  - H3: 3) Destino manual / SSH
  - H2: Selección del transporte (política del cliente)
  - H2: Emparejamiento y autenticación (transporte directo)
  - H2: Responsabilidades por componente
  - H2: Contenido relacionado

## gateway/doctor.md

- Ruta: /gateway/doctor
- Encabezados:
  - H2: Inicio rápido
  - H3: Modos sin interfaz y de automatización
  - H2: Modo de análisis de solo lectura
  - H2: Qué hace (resumen)
  - H2: Restauración y restablecimiento de la interfaz de Dreams
  - H2: Comportamiento detallado y justificación
  - H2: Contenido relacionado

## gateway/external-apps.md

- Ruta: /gateway/external-apps
- Encabezados:
  - H2: Qué está disponible actualmente
  - H2: Ruta recomendada
  - H2: Suspensión cooperativa del host
  - H2: Código de la aplicación frente al código del plugin
  - H2: Contenido relacionado

## gateway/gateway-lock.md

- Ruta: /gateway/gateway-lock
- Encabezados:
  - H2: Motivo
  - H2: Dos capas
  - H3: Bloqueo de archivo
  - H3: Vinculación del socket
  - H2: Notas operativas
  - H2: Contenido relacionado

## gateway/health.md

- Ruta: /gateway/health
- Encabezados:
  - H2: Comprobaciones rápidas
  - H2: Diagnósticos exhaustivos
  - H2: Configuración del monitor de estado
  - H2: Supervisión del tiempo de actividad
  - H3: Ejemplos de configuración del servicio de supervisión
  - H2: Cuando algo falla
  - H2: Comando dedicado «health»
  - H2: Contenido relacionado

## gateway/heartbeat.md

- Ruta: /gateway/heartbeat
- Encabezados:
  - H2: Inicio rápido (principiantes)
  - H2: Valores predeterminados
  - H2: Para qué sirve el prompt de Heartbeat
  - H2: Contrato de respuesta
  - H2: Configuración
  - H3: Ámbito y precedencia
  - H3: Heartbeats por agente
  - H3: Ejemplo de horario activo
  - H3: Configuración 24/7
  - H3: Ejemplo con varias cuentas
  - H3: Notas sobre los campos
  - H2: Comportamiento de entrega
  - H2: Controles de visibilidad
  - H3: Qué hace cada indicador
  - H3: Ejemplos por canal y por cuenta
  - H3: Patrones comunes
  - H2: HEARTBEAT.md (opcional)
  - H3: Bloques tasks:
  - H3: ¿Puede el agente actualizar HEARTBEAT.md?
  - H2: Activación manual (bajo demanda)
  - H2: Entrega del razonamiento (opcional)
  - H2: Consideraciones sobre los costos
  - H2: Desbordamiento del contexto después del Heartbeat
  - H2: Contenido relacionado

## gateway/index.md

- Ruta: /gateway
- Encabezados:
  - H2: Inicio local en 5 minutos
  - H2: Modelo de ejecución
  - H2: Endpoints compatibles con OpenAI
  - H3: Precedencia del puerto y la vinculación
  - H3: Modos de recarga en caliente
  - H2: Conjunto de comandos del operador
  - H2: Varios gateways (mismo host)
  - H2: Acceso remoto
  - H2: Supervisión y ciclo de vida del servicio
  - H2: Ruta rápida para el perfil de desarrollo
  - H2: Referencia rápida del protocolo (vista del operador)
  - H2: Comprobaciones operativas
  - H3: Estado activo
  - H3: Estado preparado
  - H3: Recuperación de interrupciones
  - H2: Indicadores comunes de fallos
  - H2: Garantías de seguridad
  - H2: Contenido relacionado

## gateway/local-model-services.md

- Ruta: /gateway/local-model-services
- Encabezados:
  - H2: Cómo funciona
  - H2: Estructura de la configuración
  - H2: Campos
  - H2: Ejemplo de Inferrs
  - H2: Ejemplo de ds4
  - H2: Contenido relacionado

## gateway/local-models.md

- Ruta: /gateway/local-models
- Encabezados:
  - H2: Requisitos mínimos de hardware
  - H2: Elegir un backend
  - H2: LM Studio + modelo local grande (API Responses)
  - H3: Configuración híbrida: servicio alojado como principal y local como alternativa
  - H3: Alojamiento regional y enrutamiento de datos
  - H2: Otros proxies locales compatibles con OpenAI
  - H2: Backends más pequeños o estrictos
  - H2: Solución de problemas
  - H2: Contenido relacionado

## gateway/logging.md

- Ruta: /gateway/logging
- Encabezados:
  - H1: Registro
  - H2: Registrador basado en archivos
  - H3: Modo detallado frente a niveles de registro
  - H2: Captura de la consola
  - H2: Censura de datos
  - H2: Registros de WebSocket del Gateway
  - H3: Estilo de los registros de WS
  - H2: Formato de la consola (registro por subsistema)
  - H2: Contenido relacionado

## gateway/multi-tenant-hosting.md

- Ruta: /gateway/multi-tenant-hosting
- Encabezados:
  - H1: Alojamiento multiinquilino
  - H2: Por qué cada inquilino necesita una celda
  - H2: Arquitectura
  - H2: Límite de confianza
  - H2: Niveles de aislamiento
  - H2: Inicio rápido
  - H2: Elementos aplazados del MVP
  - H2: Contenido relacionado

## gateway/multiple-gateways.md

- Ruta: /gateway/multiple-gateways
- Encabezados:
  - H2: Inicio rápido del bot de rescate
  - H3: Qué cambia al incorporar --profile rescue
  - H2: Configuración general de múltiples gateways
  - H2: Lista de comprobación de aislamiento
  - H2: Asignación de puertos (derivada)
  - H2: Notas sobre el navegador/CDP (error común)
  - H2: Ejemplo manual de variables de entorno
  - H2: Comprobaciones rápidas
  - H2: Contenido relacionado

## gateway/network-model.md

- Ruta: /gateway/network-model
- Encabezados:
  - H2: Relacionado

## gateway/openai-http-api.md

- Ruta: /gateway/openai-http-api
- Encabezados:
  - H2: Habilitación del endpoint
  - H2: Límite de seguridad (importante)
  - H2: Autenticación
  - H2: Cuándo usar este endpoint
  - H2: Contrato de modelo centrado en el agente
  - H2: Comportamiento de la sesión
  - H2: Límites de solicitudes (configuración)
  - H2: Contrato de herramientas de chat
  - H3: Campos de solicitud compatibles
  - H3: Variantes no compatibles
  - H3: Estructura de la respuesta de herramientas sin streaming
  - H3: Estructura de la respuesta de herramientas con streaming
  - H3: Bucle de seguimiento de herramientas
  - H2: Streaming (SSE)
  - H2: Configuración rápida de Open WebUI
  - H2: Ejemplos
  - H2: Contenido relacionado

## gateway/openresponses-http-api.md

- Ruta: /gateway/openresponses-http-api
- Encabezados:
  - H2: Autenticación, seguridad y enrutamiento
  - H2: Comportamiento de la sesión
  - H2: Estructura de la solicitud
  - H2: Elementos (entrada)
  - H3: message
  - H3: functioncalloutput (herramientas por turnos)
  - H3: reasoning e itemreference
  - H2: Herramientas (herramientas de función del lado del cliente)
  - H2: Imágenes (inputimage)
  - H2: Archivos (inputfile)
  - H2: Límites de archivos e imágenes (configuración)
  - H2: Transmisión (SSE)
  - H2: Uso
  - H2: Errores
  - H2: Ejemplos
  - H2: Contenido relacionado

## gateway/openshell.md

- Ruta: /gateway/openshell
- Encabezados:
  - H2: Requisitos previos
  - H2: Inicio rápido
  - H2: Modos del espacio de trabajo
  - H3: mirror (predeterminado)
  - H3: remote
  - H3: Elección de un modo
  - H2: Referencia de configuración
  - H2: Ejemplos
  - H3: Configuración remota mínima
  - H3: Modo mirror con GPU
  - H3: OpenShell por agente con un Gateway personalizado
  - H2: Gestión del ciclo de vida
  - H2: Refuerzo de la seguridad
  - H2: Limitaciones actuales
  - H2: Cómo funciona
  - H2: Contenido relacionado

## gateway/opentelemetry.md

- Ruta: /gateway/opentelemetry
- Encabezados:
  - H2: Inicio rápido
  - H2: Señales exportadas
  - H2: Referencia de configuración
  - H3: Variables de entorno
  - H2: Privacidad y captura de contenido
  - H2: Muestreo y vaciado
  - H2: Métricas exportadas
  - H3: Uso del modelo
  - H3: Flujo de mensajes
  - H3: Conversación
  - H3: Colas y sesiones
  - H3: Telemetría de actividad de las sesiones
  - H3: Ciclo de vida del arnés
  - H3: Ejecución de herramientas y detección de bucles
  - H3: Exec
  - H3: Funcionamiento interno del diagnóstico (memoria, cargas útiles, estado del exportador)
  - H2: Intervalos exportados
  - H2: Catálogo de eventos de diagnóstico
  - H2: Sin un exportador
  - H2: Desactivación
  - H2: Contenido relacionado

## gateway/operator-scopes.md

- Ruta: /gateway/operator-scopes
- Encabezados:
  - H2: Roles
  - H2: Niveles de ámbito
  - H2: El ámbito del método es solo la primera barrera
  - H2: Aprobaciones de emparejamiento de dispositivos
  - H2: Aprobaciones de emparejamiento de nodos
  - H2: Autenticación mediante secreto compartido

## gateway/pairing.md

- Ruta: /gateway/pairing
- Encabezados:
  - H2: Cómo funciona la aprobación de capacidades
  - H2: Flujo de trabajo de la CLI (apto para entornos sin interfaz gráfica)
  - H2: Superficie de API (protocolo del Gateway)
  - H2: Restricción de comandos de Node (2026.3.31+)
  - H2: Límites de confianza de eventos de Node (2026.3.31+)
  - H2: Aprobación automática de dispositivos verificados mediante SSH (predeterminada)
  - H2: Aprobación automática (aplicación para macOS)
  - H2: Aprobación automática de dispositivos mediante CIDR de confianza
  - H2: Limpieza silenciosa de emparejamientos reemplazados
  - H2: Aprobación automática de actualizaciones de metadatos
  - H2: Utilidades de emparejamiento mediante QR
  - H2: Localidad y encabezados reenviados
  - H2: Almacenamiento (local y privado)
  - H2: Comportamiento del transporte
  - H2: Temas relacionados

## gateway/prometheus.md

- Ruta: /gateway/prometheus
- Encabezados:
  - H2: Inicio rápido
  - H2: Métricas exportadas
  - H2: Política de etiquetas
  - H2: Recetas de PromQL
  - H2: Elección entre la exportación de Prometheus y OpenTelemetry
  - H2: Solución de problemas
  - H2: Temas relacionados

## gateway/protocol.md

- Ruta: /gateway/protocol
- Encabezados:
  - H2: Transporte y delimitación de mensajes
  - H2: Negociación inicial
  - H3: Rol de trabajador y protocolo cerrado
  - H3: Capacidades del cliente
  - H3: Ejemplo de conexión de Node
  - H2: Roles y ámbitos
  - H3: Capacidades, comandos y permisos (Node)
  - H2: Presencia
  - H3: Evento de actividad en segundo plano de Node
  - H2: Ámbito de los eventos de difusión
  - H2: Familias de métodos RPC
  - H3: Familias de eventos comunes
  - H3: Métodos auxiliares de Node
  - H2: RPC del registro de auditoría
  - H2: RPC del registro de tareas
  - H2: Métodos auxiliares del operador
  - H3: Vistas de models.list
  - H2: Aprobaciones de ejecución
  - H2: Alternativa para la entrega del agente
  - H2: Control de versiones
  - H3: Constantes del cliente
  - H2: Autenticación
  - H2: Identidad y emparejamiento de dispositivos
  - H3: Diagnósticos de migración de la autenticación de dispositivos
  - H2: TLS y fijación
  - H2: Ámbito
  - H2: Temas relacionados

## gateway/remote-gateway-readme.md

- Ruta: /gateway/remote-gateway-readme
- Encabezados:
  - H1: Ejecución de OpenClaw.app con un Gateway remoto
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Temas relacionados

## gateway/remote.md

- Ruta: /gateway/remote
- Encabezados:
  - H2: La idea fundamental
  - H2: Opciones de topología
  - H2: Flujo de comandos (qué se ejecuta y dónde)
  - H2: Túnel SSH (CLI y herramientas)
  - H2: Valores predeterminados remotos de la CLI
  - H2: Precedencia de credenciales
  - H2: Acceso remoto a la interfaz de chat
  - H2: Modo remoto de la aplicación para macOS
  - H2: Reglas de seguridad (remoto/VPN)
  - H3: macOS: túnel SSH persistente mediante LaunchAgent
  - H4: Paso 1: añadir la configuración de SSH
  - H4: Paso 2: copiar la clave SSH (una sola vez)
  - H4: Paso 3: configurar el token del Gateway
  - H4: Paso 4: crear el LaunchAgent
  - H4: Paso 5: cargar el LaunchAgent
  - H4: Solución de problemas
  - H2: Temas relacionados

## gateway/restart-recovery.md

- Ruta: /gateway/restart-recovery
- Encabezados:
  - H2: Qué se conserva tras un reinicio
  - H2: Los reinicios controlados esperan primero a que finalice el trabajo en curso
  - H2: Cómo se detecta el trabajo interrumpido
  - H2: Reanudación automática
  - H3: Subagentes
  - H3: Tareas en segundo plano
  - H3: Reinicios solicitados por el agente
  - H2: Mecanismos de seguridad y observabilidad
  - H2: Qué no se reanuda

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Ruta: /gateway/sandbox-vs-tool-policy-vs-elevated
- Encabezados:
  - H2: Depuración rápida
  - H2: Entorno aislado: dónde se ejecutan las herramientas
  - H3: Montajes enlazados (comprobación rápida de seguridad)
  - H2: Política de herramientas: qué herramientas existen o se pueden invocar
  - H3: Grupos de herramientas (abreviaturas)
  - H2: Modo elevado: «ejecutar en el anfitrión» solo para ejecución
  - H2: Soluciones habituales para el «confinamiento del entorno aislado»
  - H3: «La herramienta X está bloqueada por la política de herramientas del entorno aislado»
  - H3: «Creía que este era el agente principal; ¿por qué está en un entorno aislado?»
  - H2: Temas relacionados

## gateway/sandboxing.md

- Ruta: /gateway/sandboxing
- Encabezados:
  - H2: Qué se ejecuta en un entorno aislado
  - H2: Modos, ámbito y backend
  - H2: Backend de Docker
  - H3: Navegador en entorno aislado
  - H2: Backend de SSH
  - H2: Backend de OpenShell
  - H2: Acceso al espacio de trabajo
  - H2: Montajes enlazados personalizados
  - H2: Imágenes y configuración
  - H2: setupCommand (configuración única del contenedor)
  - H2: Política de herramientas y vías de escape
  - H2: Sustituciones para varios agentes
  - H2: Ejemplo de habilitación mínima
  - H2: Temas relacionados

## gateway/secrets-plan-contract.md

- Ruta: /gateway/secrets-plan-contract
- Encabezados:
  - H2: Estructura del archivo del plan
  - H2: Inserciones o actualizaciones y eliminaciones de proveedores
  - H2: Ámbito de destino compatible
  - H2: Comportamiento del tipo de destino
  - H2: Reglas de validación de rutas
  - H2: Comportamiento ante fallos
  - H2: Comportamiento del consentimiento del proveedor de ejecución
  - H2: Notas sobre el ámbito de ejecución y auditoría
  - H2: Comprobaciones del operador
  - H2: Documentación relacionada

## gateway/secrets.md

- Ruta: /gateway/secrets
- Encabezados:
  - H2: Modelo de ejecución
  - H2: Inyección en el momento de la salida (centinelas)
  - H2: Límite de acceso del agente
  - H2: Filtrado de superficies activas
  - H2: Diagnósticos de la superficie de autenticación del Gateway
  - H2: Comprobación previa de referencias durante la incorporación
  - H2: Contrato de SecretRef
  - H2: Configuración de proveedores
  - H2: Claves de API respaldadas por archivos
  - H2: Ejemplos de integración de ejecución
  - H2: Variables de entorno del servidor MCP
  - H2: Material de autenticación SSH del entorno aislado
  - H2: Superficie de credenciales compatible
  - H2: Comportamiento requerido y precedencia
  - H2: Desencadenadores de activación
  - H2: Señales de degradación y recuperación
  - H2: Resolución de rutas de comandos
  - H2: Flujo de trabajo de auditoría y configuración
  - H2: Política de seguridad unidireccional
  - H2: Notas sobre la compatibilidad con la autenticación heredada
  - H2: Nota sobre la interfaz web
  - H2: Temas relacionados

## gateway/security/audit-checks.md

- Ruta: /gateway/security/audit-checks
- Encabezados:
  - H2: Temas relacionados

## gateway/security/exposure-runbook.md

- Ruta: /gateway/security/exposure-runbook
- Encabezados:
  - H2: Elección del patrón de exposición
  - H2: Inventario previo
  - H2: Comprobaciones de referencia
  - H2: Referencia mínima segura
  - H2: Exposición mediante mensajes directos y grupos
  - H2: Comprobaciones del proxy inverso
  - H2: Revisión de herramientas y del entorno aislado
  - H2: Validación posterior al cambio
  - H2: Plan de reversión
  - H2: Lista de comprobación para la revisión

## gateway/security/index.md

- Ruta: /gateway/security
- Encabezados:
  - H2: Ámbito: modelo de seguridad del asistente personal
  - H2: Auditoría de seguridad de openclaw
  - H3: Qué comprueba la auditoría (a grandes rasgos)
  - H3: Orden de prioridad al clasificar los hallazgos
  - H2: Configuración de referencia reforzada en 60 segundos
  - H2: Matriz de límites de confianza
  - H2: Elementos que no son vulnerabilidades por diseño
  - H2: Confianza en el Gateway y los nodos
  - H2: Modelo de amenazas
  - H2: Acceso a mensajes directos: emparejamiento, lista de permitidos, abierto y deshabilitado
  - H3: Listas de permitidos (dos capas)
  - H3: Aislamiento de sesiones de mensajes directos (modo multiusuario)
  - H2: Visibilidad del contexto frente a autorización de desencadenadores
  - H2: Inyección de instrucciones
  - H3: Contenido externo y encapsulado de entradas no confiables
  - H3: Indicadores de omisión (mantener desactivados en producción)
  - H3: Razonamiento y salida detallada en grupos
  - H2: Autorización de comandos
  - H2: Herramientas del plano de control
  - H2: Ejecución en nodos (system.run)
  - H2: Skills dinámicas (observador/nodos remotos)
  - H2: Plugins
  - H2: Entornos aislados
  - H3: Mecanismo de protección para la delegación en subagentes
  - H3: Modo de solo lectura
  - H2: Perfiles de acceso por agente (varios agentes)
  - H3: Acceso completo (sin entorno aislado)
  - H3: Herramientas de solo lectura y espacio de trabajo de solo lectura
  - H3: Sin acceso al sistema de archivos ni al intérprete de comandos (se permite la mensajería del proveedor)
  - H2: Riesgos del control del navegador
  - H3: Política de SSRF del navegador (estricta de forma predeterminada)
  - H2: Exposición de red
  - H3: Dirección de escucha, puerto y cortafuegos
  - H3: Publicación de puertos de Docker con UFW
  - H3: Detección mediante mDNS/Bonjour
  - H3: Autenticación WebSocket del Gateway
  - H3: Encabezados de identidad de Tailscale Serve
  - H3: Configuración del proxy inverso
  - H3: Notas sobre HSTS y el origen
  - H3: Interfaz de control mediante HTTP
  - H3: Indicadores inseguros o peligrosos
  - H2: Confianza en el despliegue y el anfitrión
  - H2: Secretos almacenados en disco
  - H3: Mapa de almacenamiento de credenciales
  - H3: Permisos de archivos
  - H3: Archivos .env del espacio de trabajo
  - H3: Registros y transcripciones
  - H2: Configuración de referencia segura (copiar y pegar)
  - H3: Números separados (WhatsApp, Signal, Telegram)
  - H2: Respuesta ante incidentes
  - H3: Contención
  - H3: Rotación (suponer que existe una vulneración si se filtran secretos)
  - H3: Auditoría
  - H3: Recopilación de datos para un informe
  - H2: Análisis de secretos
  - H2: Notificación de problemas de seguridad

## gateway/security/secure-file-operations.md

- Ruta: /gateway/security/secure-file-operations
- Encabezados:
  - H2: Valor predeterminado: sin utilidad de Python
  - H2: Qué permanece protegido sin Python
  - H2: Qué aporta Python
  - H2: Directrices para Plugins y el núcleo

## gateway/security/shrinkwrap.md

- Ruta: /gateway/security/shrinkwrap
- Encabezados:
  - H2: Por qué es importante
  - H2: Generación y comprobación
  - H2: Inspección de un paquete publicado

## gateway/tailscale.md

- Ruta: /gateway/tailscale
- Encabezados:
  - H2: Modos
  - H2: Ejemplos de configuración
  - H3: Solo Tailnet (Serve)
  - H3: Solo Tailnet (vinculación a la IP de Tailnet)
  - H3: Internet pública (Funnel y contraseña compartida)
  - H2: Ejemplos de la CLI
  - H2: Autenticación
  - H3: Encabezados de identidad de Tailscale (solo Serve)
  - H2: Notas
  - H3: Requisitos previos y límites de Tailscale
  - H2: Control del navegador (Gateway remoto y navegador local)
  - H2: Más información
  - H2: Temas relacionados

## gateway/tools-invoke-http-api.md

- Ruta: /gateway/tools-invoke-http-api
- Encabezados:
  - H2: Autenticación
  - H2: Límite de seguridad (importante)
  - H2: Cuerpo de la solicitud
  - H2: Comportamiento de políticas y enrutamiento
  - H2: Respuestas
  - H2: Ejemplo
  - H2: Temas relacionados

## gateway/troubleshooting.md

- Ruta: /gateway/troubleshooting
- Encabezados:
  - H2: Secuencia de comandos
  - H2: Después de una actualización
  - H2: Instalaciones divergentes y protección frente a configuraciones más recientes
  - H2: Incompatibilidad del protocolo tras una reversión
  - H2: Enlace simbólico de Skill omitido por escapar de la ruta
  - H2: El error 429 de Anthropic requiere uso adicional para contextos largos
  - H2: Respuestas bloqueadas con el error 403 del servicio ascendente
  - H2: El backend local compatible con OpenAI supera las pruebas directas, pero las ejecuciones del agente fallan
  - H2: No hay respuestas
  - H2: Conectividad de la interfaz de control del panel
  - H3: Mapa rápido de códigos detallados de autenticación
  - H2: El servicio del Gateway no se está ejecutando
  - H2: El Gateway de macOS deja de responder silenciosamente y se reanuda al interactuar con el panel
  - H2: Bucle del supervisor launchd de macOS con LaunchAgents duplicados del Gateway o del nodo
  - H2: El Gateway se cierra durante un uso elevado de memoria
  - H2: El Gateway rechazó una configuración no válida
  - H2: Advertencias de las pruebas del Gateway
  - H2: Canal conectado, pero los mensajes no circulan
  - H2: Entrega de Cron y Heartbeat
  - H2: Nodo emparejado, pero la herramienta falla
  - H2: La herramienta del navegador falla
  - H2: Si se realizó una actualización y algo dejó de funcionar de repente
  - H2: Temas relacionados

## gateway/trusted-proxy-auth.md

- Ruta: /gateway/trusted-proxy-auth
- Encabezados:
  - H2: Cuándo utilizarlo
  - H2: Cuándo NO utilizarlo
  - H2: Cómo funciona
  - H2: Configuración
  - H3: Referencia de configuración
  - H2: Comportamiento de emparejamiento de la interfaz de control
  - H2: Encabezado de ámbitos del operador
  - H2: Terminación de TLS y HSTS
  - H3: Directrices para el despliegue
  - H2: Ejemplos de configuración del proxy
  - H2: Configuración mixta de tokens
  - H2: Lista de comprobación de seguridad
  - H2: Auditoría de seguridad
  - H2: Solución de problemas
  - H2: Migración desde la autenticación mediante token
  - H2: Temas relacionados

## help/debugging.md

- Ruta: /help/debugging
- Encabezados:
  - H2: Sustituciones de depuración en tiempo de ejecución
  - H2: Salida de seguimiento de sesiones
  - H2: Seguimiento del ciclo de vida de Plugins
  - H2: Perfilado del inicio y los comandos de la CLI
  - H2: Modo de observación del Gateway
  - H2: Perfil de desarrollo y Gateway de desarrollo (--dev)
  - H2: Registro de flujos sin procesar
  - H2: Notas de seguridad
  - H2: Depuración en VSCode
  - H3: Configuración
  - H3: Notas
  - H2: Temas relacionados

## help/environment.md

- Ruta: /help/environment
- Encabezados:
  - H2: Precedencia (de mayor a menor)
  - H2: Credenciales de proveedores y archivo .env del espacio de trabajo
  - H2: Bloque de variables de entorno de la configuración
  - H2: Importación de variables de entorno del intérprete de comandos
  - H2: Instantáneas del entorno del intérprete de ejecución
  - H2: Variables de entorno inyectadas en tiempo de ejecución
  - H2: Variables de entorno de la interfaz
  - H2: Sustitución de variables de entorno en la configuración
  - H2: Referencias a secretos frente a cadenas ${ENV}
  - H2: Variables de entorno relacionadas con rutas
  - H2: Registro
  - H3: OPENCLAWHOME
  - H2: Usuarios de nvm: fallos de TLS de webfetch
  - H2: Variables de entorno heredadas
  - H2: Temas relacionados

## help/faq-first-run.md

- Ruta: /help/faq-first-run
- Encabezados:
  - H2: Inicio rápido y configuración de la primera ejecución
  - H2: Temas relacionados

## help/faq-models.md

- Ruta: /help/faq-models
- Encabezados:
  - H2: Modelos: valores predeterminados, selección, alias y cambio
  - H2: Conmutación por error de modelos y «Todos los modelos fallaron»
  - H2: Perfiles de autenticación: qué son y cómo administrarlos
  - H2: Temas relacionados

## help/faq.md

- Ruta: /help/faq
- Encabezados:
  - H2: Primeros 60 segundos si algo no funciona
  - H2: Inicio rápido y configuración de la primera ejecución
  - H2: ¿Qué es OpenClaw?
  - H2: Skills y automatización
  - H2: Aislamiento y memoria
  - H2: Dónde se almacenan los elementos en el disco
  - H2: Conceptos básicos de configuración
  - H2: Gateways y nodos remotos
  - H2: Variables de entorno y carga de .env
  - H2: Sesiones y varios chats
  - H2: Modelos, conmutación por error y perfiles de autenticación
  - H2: Gateway: puertos, "ya está en ejecución" y modo remoto
  - H2: Registro y depuración
  - H2: Contenido multimedia y archivos adjuntos
  - H2: Seguridad y control de acceso
  - H2: Comandos de chat, cancelación de tareas y "no se detiene"
  - H2: Varios
  - H2: Contenido relacionado

## help/index.md

- Ruta: /help
- Encabezados:
  - H2: Preguntas frecuentes
  - H2: Diagnóstico
  - H2: Pruebas
  - H2: Comunidad y metainformación

## help/scripts.md

- Ruta: /help/scripts
- Encabezados:
  - H2: Convenciones
  - H2: Scripts de supervisión de autenticación
  - H2: Asistente de lectura de GitHub
  - H2: Al añadir scripts
  - H2: Contenido relacionado

## help/testing-live.md

- Ruta: /help/testing-live
- Encabezados:
  - H2: En vivo: comandos locales de comprobación rápida
  - H2: En vivo: revisión de las capacidades del nodo Android
  - H2: En vivo: comprobación rápida del modelo (claves de perfil)
  - H3: Capa 1: finalización directa del modelo (sin Gateway)
  - H3: Capa 2: Gateway + comprobación rápida del agente de desarrollo (lo que realmente hace "@openclaw")
  - H2: En vivo: comprobación rápida del backend de CLI (Claude, Gemini u otras CLI locales)
  - H2: En vivo: accesibilidad del proxy HTTP/2 de APNs
  - H2: En vivo: comprobación rápida de vinculación de ACP (/acp spawn ... --bind here)
  - H2: En vivo: comprobación rápida del arnés de app-server de Codex
  - H3: Procedimientos en vivo recomendados
  - H2: En vivo: matriz de modelos (qué abarcamos)
  - H3: Agregadores / Gateways alternativos
  - H2: Credenciales (nunca deben confirmarse en el repositorio)
  - H2: Deepgram en vivo (transcripción de audio)
  - H2: Plan de programación de BytePlus en vivo
  - H2: Contenido multimedia del flujo de trabajo de ComfyUI en vivo
  - H2: Generación de imágenes en vivo
  - H2: Generación de música en vivo
  - H2: Generación de vídeo en vivo
  - H2: Arnés de contenido multimedia en vivo
  - H2: Contenido relacionado

## help/testing-updates-plugins.md

- Ruta: /help/testing-updates-plugins
- Encabezados:
  - H2: Qué protegemos
  - H2: Verificación local durante el desarrollo
  - H2: Vías de Docker
  - H2: Aceptación de paquetes
  - H2: Valor predeterminado de la versión
  - H2: Compatibilidad con versiones anteriores
  - H2: Adición de cobertura
  - H2: Diagnóstico de errores

## help/testing.md

- Ruta: /help/testing
- Encabezados:
  - H2: Inicio rápido
  - H2: Directorios temporales de pruebas
  - H2: Flujos de trabajo en vivo y de Docker/Parallels
  - H2: Ejecutores específicos de control de calidad
  - H3: Credenciales compartidas de Telegram mediante Convex (v1)
  - H3: Adición de un canal al control de calidad
  - H2: Conjuntos de pruebas (qué se ejecuta y dónde)
  - H3: Unitarias / integración (predeterminado)
  - H3: Estabilidad (Gateway)
  - H3: E2E (conjunto del repositorio)
  - H3: E2E (comprobación rápida del Gateway)
  - H3: E2E (navegador simulado de la interfaz de control)
  - H3: E2E: comprobación rápida del backend de OpenShell
  - H3: En vivo (proveedores reales + modelos reales)
  - H2: ¿Qué conjunto debo ejecutar?
  - H2: Pruebas en vivo (con acceso a la red)
  - H2: Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")
  - H2: Comprobación de coherencia de la documentación
  - H2: Regresión sin conexión (segura para CI)
  - H2: Evaluaciones de fiabilidad del agente (Skills)
  - H2: Pruebas de contrato (estructura de plugins y canales)
  - H3: Comandos
  - H3: Contratos de canales
  - H3: Contratos de proveedores
  - H3: Cuándo ejecutar
  - H2: Adición de regresiones (orientación)
  - H2: Contenido relacionado

## help/troubleshooting.md

- Ruta: /help/troubleshooting
- Encabezados:
  - H2: Primeros 60 segundos
  - H2: El asistente parece limitado o le faltan herramientas
  - H2: Error 429 de contexto largo de Anthropic
  - H2: El backend local compatible con OpenAI funciona directamente, pero falla en OpenClaw
  - H2: La instalación del plugin falla porque faltan extensiones de openclaw
  - H2: La política de instalación bloquea la instalación o actualización de plugins
  - H2: El plugin está presente, pero se bloquea debido a una propiedad sospechosa
  - H2: Árbol de decisiones
  - H2: Contenido relacionado

## index.md

- Ruta: /
- Encabezados:
  - H1: OpenClaw 🦞
  - H2: Explorar la documentación
  - H2: ¿Qué es OpenClaw?
  - H2: Cómo funciona
  - H2: Capacidades principales
  - H2: Inicio rápido
  - H2: Panel de control
  - H2: Configuración (opcional)
  - H2: Comenzar aquí
  - H2: Más información

## install/ansible.md

- Ruta: /install/ansible
- Encabezados:
  - H2: Requisitos previos
  - H2: Qué se obtiene
  - H2: Inicio rápido
  - H2: Qué se instala
  - H2: Configuración posterior a la instalación
  - H3: Comandos rápidos
  - H2: Arquitectura de seguridad
  - H2: Instalación manual
  - H2: Actualización
  - H2: Solución de problemas
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## install/azure.md

- Ruta: /install/azure
- Encabezados:
  - H2: Qué se hará
  - H2: Qué se necesita
  - H2: Configuración de la implementación
  - H2: Implementación de recursos de Azure
  - H2: Instalación de OpenClaw
  - H2: Consideraciones de costos
  - H2: Limpieza
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/bun.md

- Ruta: /install/bun
- Encabezados:
  - H2: Instalación
  - H2: Scripts del ciclo de vida
  - H2: Advertencias
  - H2: Contenido relacionado

## install/clawdock.md

- Ruta: /install/clawdock
- Encabezados:
  - H2: Instalación
  - H2: Qué se obtiene
  - H3: Operaciones básicas
  - H3: Acceso al contenedor
  - H3: Interfaz web y emparejamiento
  - H3: Configuración y mantenimiento
  - H3: Utilidades
  - H2: Flujo de la primera ejecución
  - H2: Configuración y secretos
  - H2: Contenido relacionado

## install/development-channels.md

- Ruta: /install/development-channels
- Encabezados:
  - H2: Cambio de canales
  - H2: Selección puntual de una versión o etiqueta
  - H2: Simulación
  - H2: Plugins y canales
  - H2: Comprobación del estado actual
  - H2: Prácticas recomendadas de etiquetado
  - H2: Disponibilidad de la aplicación para macOS
  - H2: Contenido relacionado

## install/digitalocean.md

- Ruta: /install/digitalocean
- Encabezados:
  - H2: Requisitos previos
  - H2: Configuración
  - H2: Persistencia y copias de seguridad
  - H2: Consejos para 1 GB de RAM
  - H2: Solución de problemas
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/docker-vm-runtime.md

- Ruta: /install/docker-vm-runtime
- Encabezados:
  - H2: Incorporación de los binarios necesarios en la imagen
  - H2: Compilación e inicio
  - H2: Qué persiste y dónde
  - H2: Actualizaciones
  - H2: Contenido relacionado

## install/docker.md

- Ruta: /install/docker
- Encabezados:
  - H2: Requisitos previos
  - H2: Gateway en contenedor
  - H3: Flujo manual
  - H3: Actualización de imágenes de contenedor
  - H3: Variables de entorno
  - H3: Imágenes compiladas desde el código fuente con plugins seleccionados
  - H3: Observabilidad
  - H3: Comprobaciones de estado
  - H3: LAN frente a loopback
  - H3: Proveedores locales del host
  - H3: Backend de la CLI de Claude en Docker
  - H3: Bonjour / mDNS
  - H3: Almacenamiento y persistencia
  - H3: Asistentes del shell (opcionales)
  - H3: ¿Se ejecuta en un VPS?
  - H2: Entorno aislado del agente
  - H3: Activación rápida
  - H2: Solución de problemas
  - H2: Contenido relacionado

## install/exe-dev.md

- Ruta: /install/exe-dev
- Encabezados:
  - H2: Qué se necesita
  - H2: Ruta rápida para principiantes
  - H2: Instalación automatizada con Shelley
  - H2: Instalación manual
  - H2: Configuración de canales remotos
  - H2: Acceso remoto
  - H2: Actualización
  - H2: Contenido relacionado

## install/fly.md

- Ruta: /install/fly
- Encabezados:
  - H2: Qué se necesita
  - H2: Ruta rápida para principiantes
  - H2: Solución de problemas
  - H3: "La aplicación no escucha en la dirección esperada"
  - H3: Fallan las comprobaciones de estado / conexión rechazada
  - H3: OOM / problemas de memoria
  - H3: Problemas de bloqueo del Gateway
  - H3: No se lee la configuración
  - H3: Escritura de la configuración mediante SSH
  - H3: El estado no persiste
  - H2: Actualización
  - H3: Actualización del comando de la máquina
  - H2: Implementación privada (reforzada)
  - H3: Cuándo utilizar la implementación privada
  - H3: Configuración
  - H3: Acceso a una implementación privada
  - H3: Webhooks con una implementación privada
  - H3: Equilibrios de seguridad
  - H2: Notas
  - H2: Costo
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/gcp.md

- Ruta: /install/gcp
- Encabezados:
  - H2: Qué se necesita
  - H2: Ruta rápida
  - H2: Solución de problemas
  - H2: Cuentas de servicio (práctica recomendada de seguridad)
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/hetzner.md

- Ruta: /install/hetzner
- Encabezados:
  - H2: Qué se necesita
  - H2: Ruta rápida
  - H2: Infraestructura como código (Terraform)
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/hostinger.md

- Ruta: /install/hostinger
- Encabezados:
  - H2: Requisitos previos
  - H2: Opción A: OpenClaw con 1 clic
  - H2: Opción B: OpenClaw en un VPS
  - H2: Verificación de la configuración
  - H2: Solución de problemas
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/index.md

- Ruta: /install
- Encabezados:
  - H2: Requisitos del sistema
  - H2: Recomendado: script de instalación
  - H2: Métodos de instalación alternativos
  - H3: Instalador con prefijo local (install-cli.sh)
  - H3: npm, pnpm o bun
  - H3: Desde el código fuente
  - H3: Instalación desde la copia de trabajo de la rama principal de GitHub
  - H3: Contenedores y gestores de paquetes
  - H2: Verificación de la instalación
  - H2: Alojamiento e implementación
  - H2: Actualización, migración o desinstalación
  - H2: Solución de problemas: no se encuentra openclaw

## install/installer.md

- Ruta: /install/installer
- Encabezados:
  - H2: Comandos rápidos
  - H2: install.sh
  - H3: Flujo (install.sh)
  - H3: Detección de la copia de trabajo del código fuente
  - H3: Ejemplos (install.sh)
  - H2: install-cli.sh
  - H3: Flujo (install-cli.sh)
  - H3: Ejemplos (install-cli.sh)
  - H2: install.ps1
  - H3: Flujo (install.ps1)
  - H3: Ejemplos (install.ps1)
  - H2: CI y automatización
  - H2: Solución de problemas
  - H2: Contenido relacionado

## install/kubernetes.md

- Ruta: /install/kubernetes
- Encabezados:
  - H2: Por qué no Helm
  - H2: Qué se necesita
  - H2: Inicio rápido
  - H2: Pruebas locales con Kind
  - H2: Paso a paso
  - H3: 1) Implementación
  - H3: 2) Acceso al Gateway
  - H2: Qué se implementa
  - H2: Personalización
  - H3: Instrucciones del agente
  - H3: Configuración del Gateway
  - H3: Adición de proveedores
  - H3: Espacio de nombres personalizado
  - H3: Imagen personalizada
  - H3: Exposición más allá del reenvío de puertos
  - H2: Reimplementación
  - H2: Desmantelamiento
  - H2: Notas de arquitectura
  - H2: Estructura de archivos
  - H2: Contenido relacionado

## install/macos-vm.md

- Ruta: /install/macos-vm
- Encabezados:
  - H2: Opción predeterminada recomendada (para la mayoría de los usuarios)
  - H2: Opciones de máquinas virtuales de macOS
  - H3: Máquina virtual local en un Mac con Apple Silicon (Lume)
  - H3: Proveedores de Mac alojados (nube)
  - H2: Ruta rápida (Lume, usuarios experimentados)
  - H2: Qué se necesita (Lume)
  - H2: 1) Instalación de Lume
  - H2: 2) Creación de la máquina virtual de macOS
  - H2: 3) Finalización del Asistente de Configuración
  - H2: 4) Obtención de la dirección IP de la máquina virtual
  - H2: 5) Conexión por SSH a la máquina virtual
  - H2: 6) Instalación de OpenClaw
  - H2: 7) Configuración de canales
  - H2: 8) Ejecución de la máquina virtual sin interfaz gráfica
  - H2: Adicional: integración con iMessage
  - H2: Guardado de una imagen maestra
  - H2: Ejecución ininterrumpida
  - H2: Solución de problemas
  - H2: Documentación relacionada

## install/migrating-claude.md

- Ruta: /install/migrating-claude
- Encabezados:
  - H2: Dos formas de importar
  - H2: Qué se importa
  - H2: Qué permanece solo en el archivo
  - H2: Selección del origen
  - H2: Flujo recomendado
  - H2: Gestión de conflictos
  - H2: Salida JSON para automatización
  - H2: Solución de problemas
  - H2: Contenido relacionado

## install/migrating-hermes.md

- Ruta: /install/migrating-hermes
- Encabezados:
  - H2: Dos formas de importar
  - H2: Qué se importa
  - H2: Qué permanece solo en el archivo
  - H2: Flujo recomendado
  - H2: Gestión de conflictos
  - H2: Secretos
  - H2: Salida JSON para automatización
  - H2: Solución de problemas
  - H2: Contenido relacionado

## install/migrating.md

- Ruta: /install/migrating
- Encabezados:
  - H2: Importación desde otro sistema de agentes
  - H2: Traslado de OpenClaw a una máquina nueva
  - H3: Pasos de migración
  - H3: Errores comunes
  - H3: Lista de comprobación de verificación
  - H2: Actualización de un plugin en el lugar
  - H2: Contenido relacionado

## install/nix.md

- Ruta: /install/nix
- Encabezados:
  - H2: Qué se obtiene
  - H2: Inicio rápido
  - H2: Comportamiento del entorno de ejecución en modo Nix
  - H3: Qué cambia en el modo Nix
  - H3: Rutas de configuración y estado
  - H3: Detección de PATH del servicio
  - H2: Contenido relacionado

## install/node.md

- Ruta: /install/node
- Encabezados:
  - H2: Comprobación de la versión
  - H2: Instalación de Node
  - H2: Solución de problemas
  - H3: openclaw: comando no encontrado
  - H3: Errores de permisos en npm install -g (Linux)
  - H2: Contenido relacionado

## install/northflank.mdx

- Ruta: /install/northflank
- Encabezados:
  - H2: Cómo comenzar
  - H2: Qué se obtiene
  - H2: Conexión de un canal
  - H2: Pasos siguientes

## install/oracle.md

- Ruta: /install/oracle
- Encabezados:
  - H2: Requisitos previos
  - H2: Configuración
  - H2: Verificación de la postura de seguridad
  - H2: Notas sobre ARM
  - H2: Persistencia y copias de seguridad
  - H2: Alternativa: túnel SSH
  - H2: Solución de problemas
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## install/podman.md

- Ruta: /install/podman
- Encabezados:
  - H2: Requisitos previos
  - H2: Inicio rápido
  - H2: Podman y Tailscale
  - H2: Systemd (Quadlet, opcional)
  - H2: Configuración, entorno y almacenamiento
  - H2: Actualización de imágenes
  - H2: Comandos útiles
  - H2: Solución de problemas
  - H2: Relacionado

## install/railway.mdx

- Ruta: /install/railway
- Encabezados:
  - H2: Despliegue con un clic
  - H2: Qué se obtiene
  - H2: Conectar un canal
  - H2: Copias de seguridad y migración
  - H2: Siguientes pasos

## install/raspberry-pi.md

- Ruta: /install/raspberry-pi
- Encabezados:
  - H2: Compatibilidad de hardware
  - H2: Requisitos previos
  - H2: Configuración
  - H2: Consejos de rendimiento
  - H2: Configuración de modelo recomendada
  - H2: Notas sobre binarios ARM
  - H2: Persistencia y copias de seguridad
  - H2: Solución de problemas
  - H2: Siguientes pasos
  - H2: Relacionado

## install/render.mdx

- Ruta: /install/render
- Encabezados:
  - H2: Requisitos previos
  - H2: Despliegue
  - H2: El Blueprint
  - H2: Elegir un plan
  - H2: Después del despliegue
  - H3: Acceder a la interfaz de control
  - H3: Registros
  - H3: Acceso al shell
  - H3: Variables de entorno
  - H3: Despliegue automático
  - H2: Dominio personalizado
  - H2: Escalado
  - H2: Copias de seguridad y migración
  - H2: Solución de problemas
  - H3: El servicio no se inicia
  - H3: Arranques en frío lentos (nivel gratuito)
  - H3: Pérdida de datos después de volver a desplegar
  - H3: Errores en las comprobaciones de estado
  - H2: Siguientes pasos

## install/uninstall.md

- Ruta: /install/uninstall
- Encabezados:
  - H2: Método sencillo (la CLI sigue instalada)
  - H2: Eliminación manual del servicio (la CLI no está instalada)
  - H3: macOS (launchd)
  - H3: Linux (unidad de usuario de systemd)
  - H3: Windows (tarea programada)
  - H2: Instalación normal frente a copia de trabajo del código fuente
  - H3: Instalación normal (install.sh / npm / pnpm / bun)
  - H3: Copia de trabajo del código fuente (git clone)
  - H2: Relacionado

## install/updating.md

- Ruta: /install/updating
- Encabezados:
  - H2: Recomendado: openclaw update
  - H2: Cambiar entre instalaciones mediante npm y git
  - H2: Alternativa: volver a ejecutar el instalador
  - H2: Alternativa: uso manual de npm, pnpm o bun
  - H3: Temas avanzados de instalación con npm
  - H2: Actualizador automático
  - H2: Después de actualizar
  - H3: Ejecutar doctor
  - H3: Reiniciar el Gateway
  - H3: Verificar
  - H2: Reversión
  - H3: Fijar una versión (npm)
  - H3: Fijar un commit (código fuente)
  - H2: Si se produce un bloqueo
  - H2: Relacionado

## install/upstash.md

- Ruta: /install/upstash
- Encabezados:
  - H2: Requisitos previos
  - H2: Crear un Box
  - H2: Conectarse mediante un túnel SSH
  - H2: Instalar OpenClaw
  - H2: Ejecutar la incorporación
  - H2: Iniciar el Gateway
  - H2: Reinicio automático
  - H2: Solución de problemas
  - H2: Relacionado

## logging.md

- Ruta: /logging
- Encabezados:
  - H2: Dónde se almacenan los registros
  - H2: Cómo leer los registros
  - H3: CLI: seguimiento en tiempo real (recomendado)
  - H3: Interfaz de control (web)
  - H3: Registros exclusivos del canal
  - H2: Formatos de registro
  - H3: Registros de archivo (JSONL)
  - H3: Salida de consola
  - H3: Registros de WebSocket del Gateway
  - H2: Configuración de los registros
  - H3: Niveles de registro
  - H3: Diagnóstico específico del transporte del modelo
  - H3: Correlación de trazas
  - H3: Tamaño y duración de las llamadas al modelo
  - H3: Estilos de consola
  - H3: Censura
  - H2: Diagnóstico y OpenTelemetry
  - H2: Consejos para solucionar problemas
  - H2: Relacionado

## maturity/scorecard.md

- Ruta: /maturity/scorecard
- Encabezados:
  - H1: Cuadro de evaluación de madurez
  - H2: Finalidad de esta página
  - H2: Vista general
  - H2: Rangos de puntuación
  - H2: Explorador de superficies
  - H2: Resumen de evidencias de control de calidad
  - H3: Preparación por área

## maturity/taxonomy.md

- Ruta: /maturity/taxonomy
- Encabezados:
  - H1: Taxonomía de madurez
  - H2: Cómo leer esta página
  - H2: Niveles de madurez
  - H2: Áreas del producto
  - H2: Detalles
  - H3: Núcleo
  - H3: Plataforma
  - H3: Canal
  - H3: Proveedor y herramienta

## network.md

- Ruta: /network
- Encabezados:
  - H2: Modelo central
  - H2: Emparejamiento e identidad
  - H2: Detección y transportes
  - H2: Nodes y transportes
  - H2: Seguridad
  - H2: Relacionado

## nodes/audio.md

- Ruta: /nodes/audio
- Encabezados:
  - H2: Qué hace
  - H2: Detección automática (predeterminada)
  - H2: Ejemplos de configuración
  - H3: Proveedor y alternativa mediante CLI (OpenAI y Whisper CLI)
  - H3: Solo proveedor con restricción por ámbito
  - H3: Solo proveedor (Deepgram)
  - H3: Solo proveedor (Mistral Voxtral)
  - H3: Solo proveedor (SenseAudio)
  - H3: Reproducir la transcripción en el chat (opcional)
  - H2: Notas y límites
  - H3: STT local residente
  - H3: Compatibilidad con entornos de proxy
  - H2: Detección de menciones en grupos
  - H2: Aspectos importantes
  - H2: Relacionado

## nodes/camera.md

- Ruta: /nodes/camera
- Encabezados:
  - H2: Node de iOS
  - H3: Ajuste de usuario de iOS
  - H3: Comandos de iOS (mediante Gateway node.invoke)
  - H3: Requisito de primer plano en iOS
  - H3: Herramienta auxiliar de la CLI
  - H2: Node de Android
  - H3: Ajuste de usuario de Android
  - H3: Permisos
  - H3: Requisito de primer plano en Android
  - H3: Comandos de Android (mediante Gateway node.invoke)
  - H2: Aplicación para macOS
  - H3: Ajuste de usuario de macOS
  - H3: Herramienta auxiliar de la CLI (node invoke)
  - H2: Seguridad y límites prácticos
  - H2: Vídeo de la pantalla de macOS (a nivel del sistema operativo)
  - H2: Relacionado

## nodes/computer-use.md

- Ruta: /nodes/computer-use
- Encabezados:
  - H2: Requisitos
  - H2: La herramienta del agente informático
  - H2: El comando de Node computer.act
  - H2: Habilitar y preparar
  - H2: Seguridad
  - H2: Relación con otras vías de control del escritorio

## nodes/images.md

- Ruta: /nodes/images
- Encabezados:
  - H2: Objetivos
  - H2: Superficie de la CLI
  - H2: Comportamiento del canal web de WhatsApp
  - H2: Canalización de respuesta automática
  - H2: Contenido multimedia entrante hacia comandos
  - H2: Límites y errores
  - H2: Notas para las pruebas
  - H2: Relacionado

## nodes/index.md

- Ruta: /nodes
- Encabezados:
  - H2: Emparejamiento y estado
  - H2: Diferencias de versión y orden de actualización
  - H2: Host de Node remoto (system.run)
  - H3: Iniciar un host de Node (en primer plano)
  - H3: Gateway remoto mediante un túnel SSH (vinculación a loopback)
  - H3: Iniciar un host de Node (servicio)
  - H3: Emparejar y asignar nombre
  - H3: Servidores MCP alojados en Nodes
  - H3: Skills alojadas en Nodes
  - H3: Estado de identidad sin interfaz gráfica
  - H3: Añadir los comandos a la lista de permitidos
  - H3: Dirigir exec al Node
  - H3: Inferencia local del modelo
  - H3: Sesiones y transcripciones de Codex
  - H3: Sesiones y transcripciones de Claude
  - H2: Invocación de comandos
  - H2: Política de comandos
  - H2: Configuración (openclaw.json)
  - H2: Capturas de pantalla (instantáneas del lienzo)
  - H3: Controles del lienzo
  - H3: A2UI (lienzo)
  - H2: Fotos y vídeos (cámara del Node)
  - H2: Grabaciones de pantalla (Nodes)
  - H2: Ubicación (Nodes)
  - H2: SMS (Nodes de Android)
  - H2: Comandos de datos personales y del dispositivo
  - H2: Comandos del sistema (host de Node / Node de Mac)
  - H2: Vinculación del Node de ejecución
  - H2: Mapa de permisos
  - H2: Host de Node sin interfaz gráfica (multiplataforma)
  - H2: Modo Node de Mac

## nodes/location-command.md

- Ruta: /nodes/location-command
- Encabezados:
  - H2: En resumen
  - H2: Por qué un selector (y no solo un interruptor)
  - H2: Modelo de ajustes
  - H2: Asignación de permisos (node.permissions)
  - H2: Comando: location.get
  - H2: Comportamiento en segundo plano
  - H2: Integración con el modelo y las herramientas
  - H2: Texto de la experiencia de usuario (sugerido)
  - H2: Relacionado

## nodes/media-understanding.md

- Ruta: /nodes/media-understanding
- Encabezados:
  - H2: Cómo funciona
  - H2: Configuración
  - H3: Entradas de modelos
  - H3: Credenciales del proveedor
  - H2: Reglas y comportamiento
  - H3: Detección automática (predeterminada)
  - H3: Compatibilidad con proxy (llamadas a proveedores de audio/vídeo)
  - H2: Capacidades
  - H2: Matriz de compatibilidad de proveedores
  - H2: Orientación para seleccionar modelos
  - H2: Política de archivos adjuntos
  - H3: Extracción de archivos adjuntos
  - H2: Ejemplos de configuración
  - H2: Salida de estado
  - H2: Notas
  - H2: Relacionado

## nodes/presence.md

- Ruta: /nodes/presence
- Encabezados:
  - H2: Requisitos
  - H2: Comprobar el equipo activo
  - H2: Cómo se convierte la actividad en presencia
  - H2: Privacidad y contexto del modelo
  - H2: Cómo se enrutan las alertas de conexión
  - H2: Solución de problemas
  - H2: Relacionado

## nodes/talk.md

- Ruta: /nodes/talk
- Encabezados:
  - H2: Comportamiento (macOS)
  - H2: Directivas de voz en las respuestas
  - H2: Configuración (/.openclaw/openclaw.json)
  - H2: Interfaz de macOS
  - H2: Interfaz de Android
  - H2: Notas
  - H2: Relacionado

## nodes/troubleshooting.md

- Ruta: /nodes/troubleshooting
- Encabezados:
  - H2: Secuencia de comandos
  - H2: Requisitos de primer plano
  - H2: Matriz de permisos
  - H2: Emparejamiento frente a aprobaciones
  - H2: Códigos de error habituales de los Nodes
  - H2: Bucle de recuperación rápida
  - H2: Relacionado

## nodes/voicewake.md

- Ruta: /nodes/voicewake
- Encabezados:
  - H2: Almacenamiento
  - H2: Protocolo
  - H3: Lista de activadores
  - H3: Enrutamiento (del activador al destino)
  - H3: Eventos
  - H2: Comportamiento del cliente
  - H2: Relacionado

## openclaw-agent-runtime.md

- Ruta: /openclaw-agent-runtime
- Encabezados:
  - H2: Comprobación de tipos y análisis estático
  - H2: Ejecución de las pruebas del entorno de ejecución del agente
  - H2: Pruebas manuales
  - H2: Restablecimiento desde cero
  - H2: Referencias
  - H2: Relacionado

## perplexity.md

- Ruta: /perplexity
- Encabezados:
  - H2: Relacionado

## plan/cloud-workers.md

- Ruta: /plan/cloud-workers
- Encabezados:
  - H2: Estado
  - H2: Problema
  - H2: Objetivos
  - H2: Objetivos excluidos (v1)
  - H2: Trabajo previo (qué copiamos y qué invertimos)
  - H2: Decisión de arquitectura: bucle en el trabajador e inferencia mediante el Gateway
  - H2: Componentes
  - H3: 1. Máquina de estados del entorno y contrato del proveedor
  - H3: 2. Inicialización del trabajador: instalar OpenClaw en el equipo
  - H3: 3. Transporte: todo mediante SSH
  - H3: 4. Protocolo del trabajador (específico; no es el protocolo de Node)
  - H3: 5. RPC del backend de sesiones
  - H3: 6. Sincronización del espacio de trabajo
  - H3: 7. Máquina de estados de asignación, sesiones e interfaz de usuario
  - H2: Despacho y transferencia
  - H2: Modelo de seguridad
  - H2: Capacidad
  - H2: Ciclo de vida
  - H2: Superficie de configuración
  - H2: Hitos
  - H2: Preguntas abiertas

## plan/path3-sqlite-session-artifact-family.md

- Ruta: /plan/path3-sqlite-session-artifact-family
- Encabezados:
  - H1: Familia de artefactos de sesión de SQLite de la ruta 3
  - H2: Familia autoritativa
  - H2: Artefactos ajenos a la familia después del cambio
  - H2: Puntos de modificación
  - H2: Pruebas específicas

## plan/ui-channels.md

- Ruta: /plan/ui-channels
- Encabezados:
  - H2: Estado
  - H2: Problema
  - H2: Objetivos
  - H2: Objetivos excluidos
  - H2: Modelo objetivo
  - H2: Metadatos de entrega
  - H2: Contrato de capacidades del entorno de ejecución
  - H2: Asignación de canales
  - H2: Pasos de refactorización
  - H2: Pruebas
  - H2: Preguntas abiertas
  - H2: Relacionado

## platforms/android.md

- Ruta: /platforms/android
- Encabezados:
  - H2: Resumen de compatibilidad
  - H2: Instalación fuera de Google Play
  - H2: Duplicar y controlar Android desde un Mac remoto
  - H3: Antes de comenzar
  - H3: Habilitar ADB mediante TCP
  - H3: Permitir solo el Mac controlador
  - H3: Conectar e iniciar la duplicación
  - H3: Solución de problemas
  - H2: Guía operativa de conexión
  - H3: Requisitos previos
  - H3: 1. Iniciar el Gateway
  - H3: 2. Verificar la detección (opcional)
  - H4: Detección entre redes mediante DNS-SD unidifusión
  - H3: 3. Conectarse desde Android
  - H3: Varios Gateways
  - H3: Balizas de presencia activa
  - H3: 4. Aprobar el emparejamiento (CLI)
  - H3: 5. Verificar que el Node está conectado
  - H3: 6. Chat e historial
  - H3: 7. Lienzo y cámara
  - H4: Host del lienzo del Gateway (recomendado para contenido web)
  - H3: 8. Voz y superficie ampliada de comandos de Android
  - H3: 9. Archivos del espacio de trabajo (solo lectura)
  - H2: Revisar las aprobaciones de comandos
  - H2: Puntos de entrada del asistente
  - H2: Reenvío de notificaciones
  - H2: Relacionado

## platforms/digitalocean.md

- Ruta: /platforms/digitalocean
- Encabezados:
  - H2: Relacionado

## platforms/easyrunner.md

- Ruta: /platforms/easyrunner
- Encabezados:
  - H2: Antes de comenzar
  - H2: Aplicación de Compose
  - H2: Configurar OpenClaw
  - H2: Verificar
  - H2: Actualizaciones y copias de seguridad
  - H2: Solución de problemas

## platforms/index.md

- Ruta: /platforms
- Encabezados:
  - H2: Elegir el sistema operativo
  - H2: VPS y alojamiento
  - H2: Enlaces habituales
  - H2: Instalación del servicio Gateway (CLI)
  - H2: Relacionado

## platforms/ios.md

- Ruta: /platforms/ios
- Encabezados:
  - H2: Qué hace
  - H2: Requisitos
  - H2: Inicio rápido (emparejar y conectar)
  - H2: Revisar las aprobaciones de comandos
  - H2: Node directo de Apple Watch opcional
  - H2: Notificaciones push respaldadas por relé para compilaciones oficiales
  - H2: Balizas de actividad en segundo plano
  - H2: Flujo de autenticación y confianza
  - H2: Vías de detección
  - H3: Bonjour (LAN)
  - H3: Tailnet (entre redes)
  - H3: Host/puerto manual
  - H2: Varios Gateways
  - H2: Lienzo y A2UI
  - H2: Relación con el uso del equipo
  - H3: Evaluación/instantánea del lienzo
  - H2: Activación por voz y modo de conversación
  - H2: Errores habituales
  - H2: Documentación relacionada

## platforms/linux.md

- Ruta: /platforms/linux
- Encabezados:
  - H2: Ruta rápida (VPS)
  - H2: Instalación
  - H2: Servicio Gateway (systemd)
  - H2: Presión de memoria y finalizaciones por OOM
  - H2: Temas relacionados

## platforms/mac/bundled-gateway.md

- Ruta: /platforms/mac/bundled-gateway
- Encabezados:
  - H2: Configuración automática
  - H2: Recuperación manual
  - H2: Launchd (Gateway como LaunchAgent)
  - H2: Compatibilidad de versiones
  - H2: Directorio de estado en macOS
  - H2: Depuración de la conectividad de la aplicación
  - H2: Comprobación rápida
  - H2: Temas relacionados

## platforms/mac/canvas.md

- Ruta: /platforms/mac/canvas
- Encabezados:
  - H2: Ubicación de Canvas
  - H2: Comportamiento del panel
  - H2: Superficie de la API del agente
  - H2: A2UI en Canvas
  - H3: Comandos de A2UI (v0.8)
  - H2: Activación de ejecuciones del agente desde Canvas
  - H2: Notas de seguridad
  - H2: Temas relacionados

## platforms/mac/child-process.md

- Ruta: /platforms/mac/child-process
- Encabezados:
  - H2: Comportamiento predeterminado (launchd)
  - H2: Compilaciones de desarrollo sin firmar
  - H2: Modo de solo conexión
  - H2: Modo remoto
  - H2: Por qué se prefiere launchd
  - H2: Temas relacionados

## platforms/mac/dev-setup.md

- Ruta: /platforms/mac/dev-setup
- Encabezados:
  - H1: Configuración de desarrollo para macOS
  - H2: Requisitos previos
  - H2: 1. Instalar las dependencias
  - H2: 2. Compilar y empaquetar la aplicación
  - H2: 3. Instalar la CLI y el Gateway
  - H2: Solución de problemas
  - H3: Error de compilación: incompatibilidad de la cadena de herramientas o el SDK
  - H3: La aplicación se bloquea al conceder permisos
  - H3: El Gateway permanece indefinidamente en "Starting..."
  - H2: Temas relacionados

## platforms/mac/health.md

- Ruta: /platforms/mac/health
- Encabezados:
  - H1: Comprobaciones de estado en macOS
  - H2: Barra de menús
  - H2: Configuración
  - H2: Funcionamiento de la sonda
  - H2: En caso de duda
  - H2: Temas relacionados

## platforms/mac/icon.md

- Ruta: /platforms/mac/icon
- Encabezados:
  - H1: Estados del icono de la barra de menús
  - H2: Estados
  - H2: Orejas de activación por voz
  - H2: Formas y tamaños
  - H2: Notas de comportamiento
  - H2: Temas relacionados

## platforms/mac/logging.md

- Ruta: /platforms/mac/logging
- Encabezados:
  - H1: Registro (macOS)
  - H2: Registro rotativo de diagnósticos en archivo (panel de depuración)
  - H2: Datos privados del registro unificado en macOS
  - H2: Activación para OpenClaw (ai.openclaw)
  - H2: Desactivación después de la depuración
  - H2: Temas relacionados

## platforms/mac/menu-bar.md

- Ruta: /platforms/mac/menu-bar
- Encabezados:
  - H2: Qué se muestra
  - H2: Modelo de estados
  - H2: Enumeración IconState (Swift)
  - H3: ActivityKind -&gt; símbolo del distintivo
  - H3: Correspondencia visual
  - H2: Submenú contextual
  - H2: Texto de la fila de estado (menú)
  - H2: Ingesta de eventos
  - H2: Anulación para depuración
  - H2: Lista de comprobación de pruebas
  - H2: Temas relacionados

## platforms/mac/peekaboo.md

- Ruta: /platforms/mac/peekaboo
- Encabezados:
  - H2: Qué es (y qué no es)
  - H2: Relación con otras vías de control del escritorio
  - H2: Activación del puente
  - H2: Orden de detección de clientes
  - H2: Seguridad y permisos
  - H2: Comportamiento de las instantáneas (automatización)
  - H2: Solución de problemas
  - H2: Temas relacionados

## platforms/mac/permissions.md

- Ruta: /platforms/mac/permissions
- Encabezados:
  - H2: Requisitos para permisos estables
  - H2: Permisos de accesibilidad para los entornos de ejecución de Node y la CLI
  - H2: Lista de comprobación de recuperación cuando desaparecen las solicitudes
  - H2: Permisos de archivos y carpetas (Desktop/Documents/Downloads)
  - H2: Temas relacionados

## platforms/mac/remote.md

- Ruta: /platforms/mac/remote
- Encabezados:
  - H2: Modos
  - H2: Transportes remotos
  - H2: Requisitos previos en el host remoto
  - H2: Configuración de la aplicación para macOS
  - H2: Chat web
  - H2: Permisos
  - H2: Notas de seguridad
  - H2: Flujo de inicio de sesión de WhatsApp (remoto)
  - H2: Solución de problemas
  - H2: Sonidos de notificación
  - H2: Temas relacionados

## platforms/mac/signing.md

- Ruta: /platforms/mac/signing
- Encabezados:
  - H1: Firma para Mac (compilaciones de depuración)
  - H2: Uso
  - H3: Nota sobre la firma ad hoc
  - H2: Metadatos de compilación para Acerca de
  - H2: Temas relacionados

## platforms/mac/skills.md

- Ruta: /platforms/mac/skills
- Encabezados:
  - H2: Fuente de datos
  - H2: Acciones de instalación
  - H2: Variables de entorno/claves de API
  - H2: Modo remoto
  - H2: Temas relacionados

## platforms/mac/voice-overlay.md

- Ruta: /platforms/mac/voice-overlay
- Encabezados:
  - H1: Ciclo de vida de la superposición de voz (macOS)
  - H2: Comportamiento
  - H2: Implementación
  - H2: Registro
  - H2: Lista de comprobación de depuración
  - H2: Temas relacionados

## platforms/mac/voicewake.md

- Ruta: /platforms/mac/voicewake
- Encabezados:
  - H1: Activación por voz y pulsar para hablar
  - H2: Requisitos
  - H2: Modos
  - H2: Comportamiento en tiempo de ejecución (palabra de activación)
  - H2: Invariantes del ciclo de vida
  - H2: Detalles específicos de pulsar para hablar
  - H2: Configuración orientada al usuario
  - H2: Comportamiento del reenvío
  - H2: Carga útil del reenvío
  - H2: Verificación rápida
  - H2: Temas relacionados

## platforms/mac/webchat.md

- Ruta: /platforms/mac/webchat
- Encabezados:
  - H2: Inicio y depuración
  - H2: Cómo está conectado
  - H2: Superficie de seguridad
  - H2: Limitaciones conocidas
  - H2: Temas relacionados

## platforms/mac/xpc.md

- Ruta: /platforms/mac/xpc
- Encabezados:
  - H1: Arquitectura IPC de OpenClaw para macOS
  - H2: Objetivos
  - H2: Funcionamiento
  - H3: Transporte de Gateway + Node
  - H3: Servicio Node + IPC de la aplicación
  - H3: PeekabooBridge (automatización de la interfaz de usuario)
  - H2: Flujos operativos
  - H2: Notas de refuerzo de seguridad
  - H2: Temas relacionados

## platforms/macos.md

- Ruta: /platforms/macos
- Encabezados:
  - H2: Descarga
  - H2: Primera ejecución
  - H2: Actualizaciones
  - H2: Apertura de enlaces del panel
  - H2: Importación de inicios de sesión del navegador
  - H2: Elección de un modo de Gateway
  - H2: Qué administra la aplicación
  - H2: Páginas de detalles de macOS
  - H2: Temas relacionados

## platforms/oracle.md

- Ruta: /platforms/oracle
- Encabezados:
  - H2: Temas relacionados

## platforms/raspberry-pi.md

- Ruta: /platforms/raspberry-pi
- Encabezados:
  - H2: Temas relacionados

## platforms/windows.md

- Ruta: /platforms/windows
- Encabezados:
  - H2: Recomendado: Windows Hub
  - H3: Qué incluye Windows Hub
  - H3: Primer inicio
  - H2: Modo de Node para Windows
  - H2: Modo MCP local
  - H2: CLI y Gateway nativos de Windows
  - H2: Gateway de WSL2
  - H2: Inicio automático del Gateway antes de iniciar sesión en Windows
  - H2: Exposición de servicios de WSL mediante la LAN
  - H2: Solución de problemas
  - H3: El icono de la bandeja no aparece
  - H3: La configuración local falla
  - H3: La aplicación indica que se requiere vinculación
  - H3: El chat web no puede acceder a un Gateway remoto
  - H3: Los comandos screen.snapshot, camera o audio fallan
  - H3: La conectividad con Git o GitHub falla
  - H2: Temas relacionados

## plugins/adding-capabilities.md

- Ruta: /plugins/adding-capabilities
- Encabezados:
  - H2: Cuándo crear una capacidad
  - H2: Secuencia estándar
  - H2: Qué corresponde a cada lugar
  - H2: Puntos de integración del proveedor y el entorno
  - H2: Lista de comprobación de archivos
  - H2: Ejemplo práctico: generación de imágenes
  - H2: Proveedores de incrustaciones
  - H2: Lista de comprobación de revisión
  - H2: Temas relacionados

## plugins/admin-http-rpc.md

- Ruta: /plugins/admin-http-rpc
- Encabezados:
  - H2: Antes de activarlo
  - H2: Activación
  - H2: Verificación de la ruta
  - H2: Autenticación
  - H2: Modelo de seguridad
  - H2: Solicitud
  - H2: Respuesta
  - H2: Métodos permitidos
  - H2: Comparación con WebSocket
  - H2: Solución de problemas
  - H2: Temas relacionados

## plugins/agent-tools.md

- Ruta: /plugins/agent-tools
- Encabezados:
  - H2: Temas relacionados

## plugins/architecture-internals.md

- Ruta: /plugins/architecture-internals
- Encabezados:
  - H2: Canalización de carga
  - H3: Comportamiento que prioriza el manifiesto
  - H3: Límite de la caché de plugins
  - H2: Modelo del registro
  - H2: Retrollamadas de vinculación de conversaciones
  - H2: Enlaces del entorno de ejecución del proveedor
  - H3: Orden y uso de los enlaces
  - H3: Ejemplo de proveedor
  - H3: Ejemplos integrados
  - H2: Ayudantes del entorno de ejecución
  - H3: api.runtime.imageGeneration
  - H2: Rutas HTTP del Gateway
  - H2: Rutas de importación del SDK de plugins
  - H2: Esquemas de herramientas de mensajes
  - H2: Resolución de destinos de canal
  - H2: Directorios respaldados por la configuración
  - H2: Catálogos de proveedores
  - H2: Inspección de canales de solo lectura
  - H2: Paquetes
  - H3: Metadatos del catálogo de canales
  - H2: Plugins del motor de contexto
  - H2: Adición de una capacidad nueva
  - H3: Lista de comprobación de capacidades
  - H3: Plantilla de capacidad
  - H2: Temas relacionados

## plugins/architecture.md

- Ruta: /plugins/architecture
- Encabezados:
  - H2: Modelo público de capacidades
  - H3: Postura sobre la compatibilidad externa
  - H3: Formas de los plugins
  - H3: Enlaces heredados
  - H3: Señales de compatibilidad
  - H2: Descripción general de la arquitectura
  - H3: Instantánea de metadatos de plugins y tabla de consulta
  - H3: Planificación de la activación
  - H3: Plugins de canal y herramienta compartida de mensajes
  - H2: Modelo de propiedad de capacidades
  - H3: Organización por capas de las capacidades
  - H3: Ejemplo de plugin empresarial con varias capacidades
  - H3: Ejemplo de capacidad: comprensión de vídeo
  - H2: Contratos y aplicación
  - H3: Qué debe incluir un contrato
  - H2: Modelo de ejecución
  - H2: Límite de exportación
  - H2: Aspectos internos y referencia
  - H2: Temas relacionados

## plugins/building-extensions.md

- Ruta: /plugins/building-extensions
- Encabezados:
  - H2: Temas relacionados

## plugins/building-plugins.md

- Ruta: /plugins/building-plugins
- Encabezados:
  - H2: Requisitos
  - H2: Elección de la forma del plugin
  - H2: Inicio rápido
  - H2: Registro de herramientas
  - H2: Convenciones de importación
  - H2: Lista de comprobación previa al envío
  - H2: Pruebas con versiones beta
  - H2: Siguientes pasos
  - H2: Temas relacionados

## plugins/bundles.md

- Ruta: /plugins/bundles
- Encabezados:
  - H2: Por qué existen los paquetes
  - H2: Instalación de un paquete
  - H2: Qué asigna OpenClaw a partir de los paquetes
  - H3: Compatibilidad actual
  - H4: Contenido de Skills
  - H4: Paquetes de enlaces
  - H4: MCP para OpenClaw integrado
  - H4: Configuración de OpenClaw integrado
  - H4: LSP de OpenClaw integrado
  - H3: Detectado, pero no ejecutado
  - H2: Formatos de paquetes
  - H2: Precedencia de detección
  - H2: Dependencias del entorno de ejecución y limpieza
  - H2: Seguridad
  - H2: Solución de problemas
  - H2: Temas relacionados

## plugins/cli-backend-plugins.md

- Ruta: /plugins/cli-backend-plugins
- Encabezados:
  - H2: Qué administra el plugin
  - H2: Plugin de backend mínimo
  - H2: Forma de la configuración
  - H2: Enlaces avanzados del backend
  - H3: ownsNativeCompaction: exclusión de la Compaction de OpenClaw
  - H2: Puente de herramientas MCP
  - H2: Configuración del usuario
  - H2: Verificación
  - H2: Lista de comprobación
  - H2: Temas relacionados

## plugins/codex-computer-use.md

- Ruta: /plugins/codex-computer-use
- Encabezados:
  - H2: OpenClaw.app y Peekaboo
  - H2: Aplicación para iOS
  - H2: MCP directo de cua-driver
  - H2: Configuración rápida
  - H2: Comandos
  - H2: Opciones del mercado
  - H2: Mercado de macOS incluido
  - H3: Caché compartida de plugins
  - H2: Límite del catálogo remoto
  - H2: Referencia de configuración
  - H2: Qué comprueba OpenClaw
  - H2: Permisos de macOS
  - H2: Solución de problemas
  - H2: Temas relacionados

## plugins/codex-harness-reference.md

- Ruta: /plugins/codex-harness-reference
- Encabezados:
  - H2: Superficie de configuración del plugin
  - H2: Supervisión
  - H2: Transporte del servidor de aplicaciones
  - H2: Modos de aprobación y aislamiento
  - H2: Ejecución nativa aislada
  - H2: Aislamiento de la autenticación y el entorno
  - H2: Herramientas dinámicas
  - H2: Tiempos de espera
  - H2: Detección de modelos
  - H2: Archivos de inicialización del espacio de trabajo
  - H2: Anulaciones del entorno
  - H2: Temas relacionados

## plugins/codex-harness-runtime.md

- Ruta: /plugins/codex-harness-runtime
- Encabezados:
  - H2: Descripción general
  - H2: Vinculaciones de hilos y cambios de modelo
  - H2: Supervisión y continuación segura
  - H2: Respuestas visibles y Heartbeat
  - H2: Límites de los enlaces
  - H2: Contrato de compatibilidad con V1
  - H2: Permisos nativos y solicitudes de MCP
  - H2: Dirección de la cola
  - H2: Carga de comentarios de Codex
  - H2: Compaction y réplica de la transcripción
  - H2: Contenido multimedia y entrega
  - H2: Temas relacionados

## plugins/codex-harness.md

- Ruta: /plugins/codex-harness
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Uso compartido de hilos con Codex Desktop y la CLI
  - H2: Supervisión de sesiones de Codex
  - H2: Configuración
  - H3: Compaction
  - H2: Verificación del entorno de ejecución de Codex
  - H2: Enrutamiento y selección de modelos
  - H2: Patrones de implementación
  - H3: Implementación básica de Codex
  - H3: Implementación con proveedores mixtos
  - H3: Implementación de Codex con cierre ante fallos
  - H2: Política del servidor de aplicaciones
  - H2: Comandos y diagnósticos
  - H3: Inspección local de hilos de Codex
  - H3: Orden de autenticación
  - H3: Aislamiento del entorno
  - H3: Herramientas dinámicas y búsqueda web
  - H3: Campos de configuración
  - H3: Tiempos de espera de las llamadas a herramientas dinámicas
  - H3: Anulaciones locales del entorno de pruebas
  - H2: Plugins nativos de Codex
  - H2: Uso del ordenador
  - H2: Límites del entorno de ejecución
  - H2: Solución de problemas
  - H2: Temas relacionados

## plugins/codex-native-plugins.md

- Ruta: /plugins/codex-native-plugins
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Gestionar plugins desde el chat
  - H2: Cómo funciona la configuración de plugins nativos
  - H2: Límites de compatibilidad de V1
  - H2: Inventario y propiedad de aplicaciones
  - H2: Aplicaciones de cuentas conectadas
  - H2: Configuración de aplicaciones del hilo
  - H2: Política de acciones destructivas
  - H2: Solución de problemas
  - H2: Contenido relacionado

## plugins/codex-supervision.md

- Ruta: /plugins/codex-supervision
- Encabezados:
  - H2: Antes de comenzar
  - H2: Activar la supervisión
  - H2: Usar la CLI del operador
  - H2: Crear una rama desde una sesión local
  - H2: Archivar una sesión local
  - H2: Comprender los límites de los nodos emparejados
  - H2: Metadatos y permisos
  - H3: Herramientas de compatibilidad
  - H2: Solución de problemas
  - H2: Contenido relacionado

## plugins/community.md

- Ruta: /plugins/community
- Encabezados:
  - H2: Buscar plugins
  - H2: Publicar plugins
  - H2: Contenido relacionado

## plugins/compatibility.md

- Ruta: /plugins/compatibility
- Encabezados:
  - H2: Registro de compatibilidad
  - H2: Política de obsolescencia
  - H2: Áreas de compatibilidad actuales
  - H3: Alias planos de devoluciones de llamada entrantes de WhatsApp
  - H3: Campos de admisión entrante de WhatsApp
  - H2: Paquete de inspección de plugins
  - H3: Vía de aceptación para mantenedores
  - H2: Notas de la versión

## plugins/copilot.md

- Ruta: /plugins/copilot
- Encabezados:
  - H2: Requisitos
  - H2: Instalación
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H2: BYOK
  - H2: Autenticación
  - H2: Superficie de configuración
  - H2: Compaction
  - H2: Replicación de transcripciones
  - H2: Preguntas secundarias (/btw)
  - H2: Doctor
  - H2: Limitaciones
  - H2: Permisos y askuser
  - H3: Token de GitHub de nivel de sesión
  - H2: Contenido relacionado

## plugins/dependency-resolution.md

- Ruta: /plugins/dependency-resolution
- Encabezados:
  - H2: División de responsabilidades
  - H2: Raíces de instalación
  - H2: Plugins locales
  - H2: Inicio y recarga
  - H2: Plugins incluidos
  - H2: Limpieza de elementos heredados

## plugins/google-meet.md

- Ruta: /plugins/google-meet
- Encabezados:
  - H2: Inicio rápido
  - H3: Crear una reunión
  - H3: Unirse solo como observador
  - H3: Estado de la sesión en tiempo real
  - H2: Gateway local y Chrome en Parallels
  - H3: Comprobaciones de errores comunes
  - H2: Notas de instalación
  - H2: Transportes
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth y comprobaciones previas
  - H3: Crear credenciales de Google
  - H3: Generar el token de actualización
  - H3: Verificar OAuth con doctor
  - H3: Resolver, realizar comprobaciones previas y leer artefactos
  - H3: Prueba de humo en vivo
  - H3: Crear ejemplos
  - H2: Configuración
  - H3: Valores predeterminados
  - H3: Anulaciones opcionales
  - H2: Herramienta
  - H2: Modos de agente y bidireccional
  - H2: Lista de comprobación para pruebas en vivo
  - H2: Solución de problemas
  - H3: El agente no puede ver la herramienta de Google Meet
  - H3: No hay ningún Node conectado compatible con Google Meet
  - H3: El navegador se abre, pero el agente no puede unirse
  - H3: No se puede crear la reunión
  - H3: El agente se une, pero no habla
  - H3: Las comprobaciones de configuración de Twilio fallan
  - H3: La llamada de Twilio comienza, pero nunca entra en la reunión
  - H2: Notas
  - H2: Contenido relacionado

## plugins/hooks.md

- Ruta: /plugins/hooks
- Encabezados:
  - H2: Inicio rápido
  - H2: Catálogo de hooks
  - H3: Solicitudes de emparejamiento de canales
  - H2: Depurar hooks en tiempo de ejecución
  - H2: Política de llamadas a herramientas
  - H3: Hook del entorno de ejecución
  - H3: Persistencia de los resultados de herramientas
  - H2: Hooks de prompts y modelos
  - H3: Extensiones de sesión e inyecciones en el siguiente turno
  - H2: Hooks de mensajes
  - H2: Hooks de instalación
  - H2: Ciclo de vida del Gateway
  - H3: Proyección segura de cron externo
  - H2: Próximas obsolescencias
  - H2: Contenido relacionado

## plugins/install-overrides.md

- Ruta: /plugins/install-overrides
- Encabezados:
  - H2: Entorno
  - H2: Comportamiento
  - H2: E2E de paquetes

## plugins/llama-cpp.md

- Ruta: /plugins/llama-cpp
- Encabezados:
  - H2: Configuración
  - H2: Entorno de ejecución nativo
  - H2: Diagnóstico del entorno de ejecución
  - H2: Solución de problemas

## plugins/logbook.md

- Ruta: /plugins/logbook
- Encabezados:
  - H2: Antes de comenzar
  - H2: Inicio rápido
  - H2: Cómo funciona
  - H2: Flujo del modelo y los datos
  - H2: Configuración
  - H3: Selección del modelo de visión
  - H2: Pestaña del panel
  - H2: Métodos del Gateway
  - H2: Notas de privacidad
  - H2: Solución de problemas
  - H3: Falta la pestaña Logbook
  - H3: La captura informa de un error
  - H3: Las capturas se realizan correctamente, pero no aparecen tarjetas
  - H2: Contenido relacionado

## plugins/manage-plugins.md

- Ruta: /plugins/manage-plugins
- Encabezados:
  - H2: Usar la interfaz de control
  - H2: Enumerar y buscar plugins
  - H2: Activar y desactivar plugins
  - H2: Instalar plugins
  - H2: Reiniciar e inspeccionar
  - H2: Actualizar plugins
  - H2: Desinstalar plugins
  - H2: Elegir una fuente
  - H2: Publicar plugins
  - H2: Contenido relacionado

## plugins/manifest.md

- Ruta: /plugins/manifest
- Encabezados:
  - H2: Qué hace este archivo
  - H2: Ejemplo mínimo
  - H2: Ejemplo completo
  - H2: Referencia de campos de nivel superior
  - H2: Referencia de catalog
  - H2: Referencia de metadatos del proveedor de generación
  - H2: Referencia de metadatos de herramientas
  - H2: Referencia de providerAuthChoices
  - H2: Referencia de commandAliases
  - H2: Referencia de activation
  - H2: Referencia de qaRunners
  - H2: Referencia de setup
  - H3: Referencia de setup.providers
  - H3: Campos de setup
  - H2: Referencia de uiHints
  - H2: Referencia de contracts
  - H2: Referencia de configContracts
  - H2: Referencia de mediaUnderstandingProviderMetadata
  - H2: Referencia de channelConfigs
  - H3: Sustituir otro plugin de canal
  - H2: Referencia de modelSupport
  - H2: Referencia de modelCatalog
  - H2: Referencia de modelIdNormalization
  - H2: Referencia de providerEndpoints
  - H2: Referencia de providerRequest
  - H2: Referencia de secretProviderIntegrations
  - H2: Referencia de modelPricing
  - H3: Índice de proveedores de OpenClaw
  - H2: Manifiesto frente a package.json
  - H3: Campos de package.json que afectan al descubrimiento
  - H2: Precedencia de descubrimiento (identificadores de plugin duplicados)
  - H2: Requisitos de JSON Schema
  - H2: Comportamiento de validación
  - H2: Notas
  - H2: Contenido relacionado

## plugins/memory-lancedb.md

- Ruta: /plugins/memory-lancedb
- Encabezados:
  - H2: Instalación
  - H2: Inicio rápido
  - H2: Configuración de embeddings
  - H3: Dimensiones
  - H2: Embeddings de Ollama
  - H2: Límites de recuperación y captura
  - H2: Comandos
  - H2: Almacenamiento
  - H2: Dependencias del entorno de ejecución y compatibilidad con plataformas
  - H2: Solución de problemas
  - H3: La longitud de la entrada supera la longitud del contexto
  - H3: Modelo de embeddings no compatible
  - H3: El plugin se carga, pero no aparece ningún recuerdo
  - H2: Contenido relacionado

## plugins/memory-wiki.md

- Ruta: /plugins/memory-wiki
- Encabezados:
  - H2: Modos de la bóveda
  - H2: Estructura de la bóveda
  - H2: Importaciones de Open Knowledge Format
  - H2: Afirmaciones estructuradas y pruebas
  - H2: Metadatos de entidades para agentes
  - H2: Canalización de compilación
  - H2: Paneles e informes de estado
  - H2: Búsqueda y recuperación
  - H2: Herramientas del agente
  - H2: Comportamiento del prompt y del contexto
  - H2: Configuración
  - H3: Bóvedas por agente
  - H3: Ejemplo: QMD y modo puente
  - H2: CLI
  - H2: Compatibilidad con Obsidian
  - H2: Flujo de trabajo recomendado
  - H2: Documentación relacionada

## plugins/message-presentation.md

- Ruta: /plugins/message-presentation
- Encabezados:
  - H2: Contrato
  - H2: Ejemplos de productores
  - H2: Contrato del renderizador
  - H2: Flujo de renderizado del núcleo
  - H2: Reglas de degradación
  - H3: Visibilidad del valor alternativo del botón
  - H2: Asignación de proveedores
  - H2: Presentación frente a InteractiveReply
  - H2: Fijación de entrega
  - H2: Lista de comprobación para autores de plugins
  - H2: Documentación relacionada

## plugins/oc-path.md

- Ruta: /plugins/oc-path
- Encabezados:
  - H2: Por qué activarlo
  - H2: Dónde se ejecuta
  - H2: Activación
  - H2: Dependencias
  - H2: Qué proporciona
  - H2: Relación con otros plugins
  - H2: Seguridad
  - H2: Contenido relacionado

## plugins/plugin-inventory.md

- Ruta: /plugins/plugin-inventory
- Encabezados:
  - H1: Inventario de plugins
  - H2: Definiciones
  - H2: Instalar un plugin
  - H2: Paquete npm del núcleo
  - H2: Paquetes externos oficiales
  - H2: Solo disponible mediante una copia del código fuente

## plugins/plugin-permission-requests.md

- Ruta: /plugins/plugin-permission-requests
- Encabezados:
  - H2: Elegir el control adecuado
  - H2: Solicitar aprobación antes de llamar a una herramienta
  - H2: Comportamiento de las decisiones
  - H2: Enrutar solicitudes de aprobación
  - H2: Permisos nativos de Codex
  - H2: Solución de problemas
  - H2: Contenido relacionado

## plugins/reference.md

- Ruta: /plugins/reference
- Encabezados:
  - H1: Referencia de plugins

## plugins/reference/acpx.md

- Ruta: /plugins/reference/acpx
- Encabezados:
  - H1: Plugin ACPx
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/admin-http-rpc.md

- Ruta: /plugins/reference/admin-http-rpc
- Encabezados:
  - H1: Plugin Admin Http Rpc
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/alibaba.md

- Ruta: /plugins/reference/alibaba
- Encabezados:
  - H1: Plugin Alibaba
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/amazon-bedrock-mantle.md

- Ruta: /plugins/reference/amazon-bedrock-mantle
- Encabezados:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/amazon-bedrock.md

- Ruta: /plugins/reference/amazon-bedrock
- Encabezados:
  - H1: Plugin Amazon Bedrock
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/anthropic-vertex.md

- Ruta: /plugins/reference/anthropic-vertex
- Encabezados:
  - H1: Plugin Anthropic Vertex
  - H2: Distribución
  - H2: Superficie
  - H2: Claude Fable 5
  - H2: Claude Sonnet 5

## plugins/reference/anthropic.md

- Ruta: /plugins/reference/anthropic
- Encabezados:
  - H1: Plugin Anthropic
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/arcee.md

- Ruta: /plugins/reference/arcee
- Encabezados:
  - H1: Plugin Arcee
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/azure-speech.md

- Ruta: /plugins/reference/azure-speech
- Encabezados:
  - H1: Plugin Azure Speech
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/bonjour.md

- Ruta: /plugins/reference/bonjour
- Encabezados:
  - H1: Plugin Bonjour
  - H2: Distribución
  - H2: Superficie

## plugins/reference/brave.md

- Ruta: /plugins/reference/brave
- Encabezados:
  - H1: Plugin Brave
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/browser.md

- Ruta: /plugins/reference/browser
- Encabezados:
  - H1: Plugin de navegador
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/byteplus.md

- Ruta: /plugins/reference/byteplus
- Encabezados:
  - H1: Plugin BytePlus
  - H2: Distribución
  - H2: Superficie

## plugins/reference/canvas.md

- Ruta: /plugins/reference/canvas
- Encabezados:
  - H1: Plugin Canvas
  - H2: Distribución
  - H2: Superficie

## plugins/reference/cerebras.md

- Ruta: /plugins/reference/cerebras
- Encabezados:
  - H1: Plugin Cerebras
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/chutes.md

- Ruta: /plugins/reference/chutes
- Encabezados:
  - H1: Plugin Chutes
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/clawrouter.md

- Ruta: /plugins/reference/clawrouter
- Encabezados:
  - H1: Plugin ClawRouter
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/clickclack.md

- Ruta: /plugins/reference/clickclack
- Encabezados:
  - H1: Plugin Clickclack
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/cloudflare-ai-gateway.md

- Ruta: /plugins/reference/cloudflare-ai-gateway
- Encabezados:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/codex.md

- Ruta: /plugins/reference/codex
- Encabezados:
  - H1: Plugin Codex
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/cohere.md

- Ruta: /plugins/reference/cohere
- Encabezados:
  - H1: Plugin Cohere
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/comfy.md

- Ruta: /plugins/reference/comfy
- Encabezados:
  - H1: Plugin ComfyUI
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/copilot-proxy.md

- Ruta: /plugins/reference/copilot-proxy
- Encabezados:
  - H1: Plugin Copilot Proxy
  - H2: Distribución
  - H2: Superficie

## plugins/reference/copilot.md

- Ruta: /plugins/reference/copilot
- Encabezados:
  - H1: Plugin Copilot
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/crabbox.md

- Ruta: /plugins/reference/crabbox
- Encabezados:
  - H1: Plugin Crabbox
  - H2: Distribución
  - H2: Superficie
  - H2: Configuración

## plugins/reference/deepgram.md

- Ruta: /plugins/reference/deepgram
- Encabezados:
  - H1: Plugin Deepgram
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/deepinfra.md

- Ruta: /plugins/reference/deepinfra
- Encabezados:
  - H1: Plugin DeepInfra
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/deepseek.md

- Ruta: /plugins/reference/deepseek
- Encabezados:
  - H1: Plugin DeepSeek
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/diagnostics-otel.md

- Ruta: /plugins/reference/diagnostics-otel
- Encabezados:
  - H1: Plugin de diagnóstico OpenTelemetry
  - H2: Distribución
  - H2: Superficie

## plugins/reference/diagnostics-prometheus.md

- Ruta: /plugins/reference/diagnostics-prometheus
- Encabezados:
  - H1: Plugin de diagnóstico Prometheus
  - H2: Distribución
  - H2: Superficie

## plugins/reference/diffs-language-pack.md

- Ruta: /plugins/reference/diffs-language-pack
- Encabezados:
  - H1: Plugin del paquete de idiomas de Diffs
  - H2: Distribución
  - H2: Superficie
  - H2: Idiomas añadidos

## plugins/reference/diffs.md

- Ruta: /plugins/reference/diffs
- Encabezados:
  - H1: Plugin Diffs
  - H2: Distribución
  - H2: Superficie

## plugins/reference/discord.md

- Ruta: /plugins/reference/discord
- Encabezados:
  - H1: Plugin Discord
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/document-extract.md

- Ruta: /plugins/reference/document-extract
- Encabezados:
  - H1: Plugin de extracción de documentos
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/duckduckgo.md

- Ruta: /plugins/reference/duckduckgo
- Encabezados:
  - H1: Plugin DuckDuckGo
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/elevenlabs.md

- Ruta: /plugins/reference/elevenlabs
- Encabezados:
  - H1: Plugin Elevenlabs
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/exa.md

- Ruta: /plugins/reference/exa
- Encabezados:
  - H1: Plugin Exa
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/fal.md

- Ruta: /plugins/reference/fal
- Encabezados:
  - H1: Plugin fal
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/featherless.md

- Ruta: /plugins/reference/featherless
- Encabezados:
  - H1: Plugin Featherless
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/feishu.md

- Ruta: /plugins/reference/feishu
- Encabezados:
  - H1: Plugin Feishu
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/file-transfer.md

- Ruta: /plugins/reference/file-transfer
- Encabezados:
  - H1: Plugin de transferencia de archivos
  - H2: Distribución
  - H2: Superficie

## plugins/reference/firecrawl.md

- Ruta: /plugins/reference/firecrawl
- Encabezados:
  - H1: Plugin Firecrawl
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/fireworks.md

- Ruta: /plugins/reference/fireworks
- Encabezados:
  - H1: Plugin Fireworks
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/github-copilot.md

- Ruta: /plugins/reference/github-copilot
- Encabezados:
  - H1: Plugin GitHub Copilot
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/gmi.md

- Ruta: /plugins/reference/gmi
- Encabezados:
  - H1: Plugin Gmi
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/google-meet.md

- Ruta: /plugins/reference/google-meet
- Encabezados:
  - H1: Plugin Google Meet
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/google.md

- Ruta: /plugins/reference/google
- Encabezados:
  - H1: Plugin Google
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/googlechat.md

- Ruta: /plugins/reference/googlechat
- Encabezados:
  - H1: Plugin Google Chat
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/gradium.md

- Ruta: /plugins/reference/gradium
- Encabezados:
  - H1: Plugin Gradium
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/groq.md

- Ruta: /plugins/reference/groq
- Encabezados:
  - H1: Plugin Groq
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/huggingface.md

- Ruta: /plugins/reference/huggingface
- Encabezados:
  - H1: Plugin Hugging Face
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/imessage.md

- Ruta: /plugins/reference/imessage
- Encabezados:
  - H1: Plugin iMessage
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/inworld.md

- Ruta: /plugins/reference/inworld
- Encabezados:
  - H1: Plugin Inworld
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/irc.md

- Ruta: /plugins/reference/irc
- Encabezados:
  - H1: Plugin IRC
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/kilocode.md

- Ruta: /plugins/reference/kilocode
- Encabezados:
  - H1: Plugin Kilocode
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/kimi.md

- Ruta: /plugins/reference/kimi
- Encabezados:
  - H1: Plugin Kimi
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/line.md

- Ruta: /plugins/reference/line
- Encabezados:
  - H1: Plugin LINE
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/litellm.md

- Ruta: /plugins/reference/litellm
- Encabezados:
  - H1: Plugin LiteLLM
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/llama-cpp.md

- Ruta: /plugins/reference/llama-cpp
- Encabezados:
  - H1: Plugin Llama Cpp
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/llm-task.md

- Ruta: /plugins/reference/llm-task
- Encabezados:
  - H1: Plugin de tareas de LLM
  - H2: Distribución
  - H2: Superficie

## plugins/reference/lmstudio.md

- Ruta: /plugins/reference/lmstudio
- Encabezados:
  - H1: Plugin LM Studio
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/lobster.md

- Ruta: /plugins/reference/lobster
- Encabezados:
  - H1: Plugin Lobster
  - H2: Distribución
  - H2: Superficie

## plugins/reference/logbook.md

- Ruta: /plugins/reference/logbook
- Encabezados:
  - H1: Plugin de registro
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/longcat.md

- Ruta: /plugins/reference/longcat
- Encabezados:
  - H1: Plugin LongCat
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/matrix.md

- Ruta: /plugins/reference/matrix
- Encabezados:
  - H1: Plugin Matrix
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/mattermost.md

- Ruta: /plugins/reference/mattermost
- Encabezados:
  - H1: Plugin Mattermost
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/memory-core.md

- Ruta: /plugins/reference/memory-core
- Encabezados:
  - H1: Plugin del núcleo de memoria
  - H2: Distribución
  - H2: Superficie

## plugins/reference/memory-lancedb.md

- Ruta: /plugins/reference/memory-lancedb
- Encabezados:
  - H1: Plugin de memoria Lancedb
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/memory-wiki.md

- Ruta: /plugins/reference/memory-wiki
- Encabezados:
  - H1: Plugin de memoria Wiki
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/meta.md

- Ruta: /plugins/reference/meta
- Encabezados:
  - H1: Plugin Meta
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/microsoft-foundry.md

- Ruta: /plugins/reference/microsoft-foundry
- Encabezados:
  - H1: Plugin Microsoft Foundry
  - H2: Distribución
  - H2: Superficie
  - H2: Requisitos
  - H2: Modelos de chat
  - H2: Generación de imágenes con MAI
  - H2: Solución de problemas

## plugins/reference/microsoft.md

- Ruta: /plugins/reference/microsoft
- Encabezados:
  - H1: Plugin Microsoft
  - H2: Distribución
  - H2: Superficie

## plugins/reference/migrate-claude.md

- Ruta: /plugins/reference/migrate-claude
- Encabezados:
  - H1: Plugin de migración de Claude
  - H2: Distribución
  - H2: Superficie

## plugins/reference/migrate-hermes.md

- Ruta: /plugins/reference/migrate-hermes
- Encabezados:
  - H1: Plugin de migración de Hermes
  - H2: Distribución
  - H2: Superficie

## plugins/reference/minimax.md

- Ruta: /plugins/reference/minimax
- Encabezados:
  - H1: Plugin MiniMax
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/mistral.md

- Ruta: /plugins/reference/mistral
- Encabezados:
  - H1: Plugin Mistral
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/moonshot.md

- Ruta: /plugins/reference/moonshot
- Encabezados:
  - H1: Plugin Moonshot
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/msteams.md

- Ruta: /plugins/reference/msteams
- Encabezados:
  - H1: Plugin Microsoft Teams
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/nextcloud-talk.md

- Ruta: /plugins/reference/nextcloud-talk
- Encabezados:
  - H1: Plugin Nextcloud Talk
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/nostr.md

- Ruta: /plugins/reference/nostr
- Encabezados:
  - H1: Plugin Nostr
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/novita.md

- Ruta: /plugins/reference/novita
- Encabezados:
  - H1: Plugin Novita
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/nvidia.md

- Ruta: /plugins/reference/nvidia
- Encabezados:
  - H1: Plugin NVIDIA
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/oc-path.md

- Ruta: /plugins/reference/oc-path
- Encabezados:
  - H1: Plugin Oc Path
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/ollama.md

- Ruta: /plugins/reference/ollama
- Encabezados:
  - H1: Plugin Ollama
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/open-prose.md

- Ruta: /plugins/reference/open-prose
- Encabezados:
  - H1: Plugin Open Prose
  - H2: Distribución
  - H2: Superficie

## plugins/reference/openai.md

- Ruta: /plugins/reference/openai
- Encabezados:
  - H1: Plugin OpenAI
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/opencode-go.md

- Ruta: /plugins/reference/opencode-go
- Encabezados:
  - H1: Plugin OpenCode Go
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/opencode.md

- Ruta: /plugins/reference/opencode
- Encabezados:
  - H1: Plugin OpenCode
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/openrouter.md

- Ruta: /plugins/reference/openrouter
- Encabezados:
  - H1: Plugin OpenRouter
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/openshell.md

- Ruta: /plugins/reference/openshell
- Encabezados:
  - H1: Plugin Openshell
  - H2: Distribución
  - H2: Superficie

## plugins/reference/perplexity.md

- Ruta: /plugins/reference/perplexity
- Encabezados:
  - H1: Plugin Perplexity
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/pixverse.md

- Ruta: /plugins/reference/pixverse
- Encabezados:
  - H1: Plugin PixVerse
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/policy.md

- Ruta: /plugins/reference/policy
- Encabezados:
  - H1: Plugin de políticas
  - H2: Distribución
  - H2: Superficie
  - H2: Comportamiento
  - H2: Documentación relacionada

## plugins/reference/qa-channel.md

- Ruta: /plugins/reference/qa-channel
- Encabezados:
  - H1: Plugin del canal de control de calidad
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/qa-lab.md

- Ruta: /plugins/reference/qa-lab
- Encabezados:
  - H1: Plugin del laboratorio de control de calidad
  - H2: Distribución
  - H2: Superficie

## plugins/reference/qa-matrix.md

- Ruta: /plugins/reference/qa-matrix
- Encabezados:
  - H1: Plugin de matriz de control de calidad
  - H2: Distribución
  - H2: Superficie

## plugins/reference/qianfan.md

- Ruta: /plugins/reference/qianfan
- Encabezados:
  - H1: Plugin de Qianfan
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/qqbot.md

- Ruta: /plugins/reference/qqbot
- Encabezados:
  - H1: Plugin de QQ Bot
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/qwen.md

- Ruta: /plugins/reference/qwen
- Encabezados:
  - H1: Plugin de Qwen
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/raft.md

- Ruta: /plugins/reference/raft
- Encabezados:
  - H1: Plugin de Raft
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/runway.md

- Ruta: /plugins/reference/runway
- Encabezados:
  - H1: Plugin de Runway
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/searxng.md

- Ruta: /plugins/reference/searxng
- Encabezados:
  - H1: Plugin de SearXNG
  - H2: Distribución
  - H2: Superficie

## plugins/reference/senseaudio.md

- Ruta: /plugins/reference/senseaudio
- Encabezados:
  - H1: Plugin de Senseaudio
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/sglang.md

- Ruta: /plugins/reference/sglang
- Encabezados:
  - H1: Plugin de SGLang
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/signal.md

- Ruta: /plugins/reference/signal
- Encabezados:
  - H1: Plugin de Signal
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/slack.md

- Ruta: /plugins/reference/slack
- Encabezados:
  - H1: Plugin de Slack
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/sms.md

- Ruta: /plugins/reference/sms
- Encabezados:
  - H1: Plugin de SMS
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/stepfun.md

- Ruta: /plugins/reference/stepfun
- Encabezados:
  - H1: Plugin de StepFun
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/synology-chat.md

- Ruta: /plugins/reference/synology-chat
- Encabezados:
  - H1: Plugin de Synology Chat
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/synthetic.md

- Ruta: /plugins/reference/synthetic
- Encabezados:
  - H1: Plugin de Synthetic
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/tavily.md

- Ruta: /plugins/reference/tavily
- Encabezados:
  - H1: Plugin de Tavily
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/telegram.md

- Ruta: /plugins/reference/telegram
- Encabezados:
  - H1: Plugin de Telegram
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/tencent.md

- Ruta: /plugins/reference/tencent
- Encabezados:
  - H1: Plugin de Tencent
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/tlon.md

- Ruta: /plugins/reference/tlon
- Encabezados:
  - H1: Plugin de Tlon
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/together.md

- Ruta: /plugins/reference/together
- Encabezados:
  - H1: Plugin de Together
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/tokenjuice.md

- Ruta: /plugins/reference/tokenjuice
- Encabezados:
  - H1: Plugin de Tokenjuice
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/tts-local-cli.md

- Ruta: /plugins/reference/tts-local-cli
- Encabezados:
  - H1: Plugin de CLI local de TTS
  - H2: Distribución
  - H2: Superficie

## plugins/reference/twitch.md

- Ruta: /plugins/reference/twitch
- Encabezados:
  - H1: Plugin de Twitch
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/vault.md

- Ruta: /plugins/reference/vault
- Encabezados:
  - H1: Plugin de Vault
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/venice.md

- Ruta: /plugins/reference/venice
- Encabezados:
  - H1: Plugin de Venice
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/vercel-ai-gateway.md

- Ruta: /plugins/reference/vercel-ai-gateway
- Encabezados:
  - H1: Plugin de Vercel AI Gateway
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/vllm.md

- Ruta: /plugins/reference/vllm
- Encabezados:
  - H1: Plugin de vLLM
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/voice-call.md

- Ruta: /plugins/reference/voice-call
- Encabezados:
  - H1: Plugin de llamadas de voz
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/volcengine.md

- Ruta: /plugins/reference/volcengine
- Encabezados:
  - H1: Plugin de Volcengine
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/voyage.md

- Ruta: /plugins/reference/voyage
- Encabezados:
  - H1: Plugin de Voyage
  - H2: Distribución
  - H2: Superficie

## plugins/reference/vydra.md

- Ruta: /plugins/reference/vydra
- Encabezados:
  - H1: Plugin de Vydra
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/web-readability.md

- Ruta: /plugins/reference/web-readability
- Encabezados:
  - H1: Plugin de legibilidad web
  - H2: Distribución
  - H2: Superficie

## plugins/reference/webhooks.md

- Ruta: /plugins/reference/webhooks
- Encabezados:
  - H1: Plugin de Webhooks
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/whatsapp.md

- Ruta: /plugins/reference/whatsapp
- Encabezados:
  - H1: Plugin de WhatsApp
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/workboard.md

- Ruta: /plugins/reference/workboard
- Encabezados:
  - H1: Plugin de Workboard
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/workspaces.md

- Ruta: /plugins/reference/workspaces
- Encabezados:
  - H1: Plugin de espacios de trabajo
  - H2: Distribución
  - H2: Superficie

## plugins/reference/xai.md

- Ruta: /plugins/reference/xai
- Encabezados:
  - H1: Plugin de xAI
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/xiaomi.md

- Ruta: /plugins/reference/xiaomi
- Encabezados:
  - H1: Plugin de Xiaomi
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/zai.md

- Ruta: /plugins/reference/zai
- Encabezados:
  - H1: Plugin de Z.AI
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/zalo.md

- Ruta: /plugins/reference/zalo
- Encabezados:
  - H1: Plugin de Zalo
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/zalouser.md

- Ruta: /plugins/reference/zalouser
- Encabezados:
  - H1: Plugin de Zalo Personal
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/sdk-agent-harness.md

- Ruta: /plugins/sdk-agent-harness
- Encabezados:
  - H2: Cuándo usar un arnés
  - H2: Qué sigue siendo responsabilidad del núcleo
  - H3: Inicialización de autenticación propiedad del arnés
  - H3: Artefactos verificados del entorno de ejecución de configuración
  - H3: Contrato de transporte de solicitudes
  - H2: Registrar un arnés
  - H3: Ejecución delegada
  - H2: Política de selección
  - H2: Emparejamiento de proveedor y arnés
  - H3: Middleware de resultados de herramientas
  - H3: Clasificación de resultados terminales
  - H3: Efectos secundarios al finalizar el agente
  - H3: Entrada del usuario y superficies de herramientas
  - H3: Modo de arnés nativo de Codex
  - H2: Rigurosidad del entorno de ejecución
  - H2: Sesiones nativas y réplica de transcripciones
  - H2: Resultados de herramientas y medios
  - H2: Limitaciones actuales
  - H2: Contenido relacionado

## plugins/sdk-channel-inbound.md

- Ruta: /plugins/sdk-channel-inbound
- Encabezados:
  - H2: Utilidades del núcleo
  - H2: Migración

## plugins/sdk-channel-ingress.md

- Ruta: /plugins/sdk-channel-ingress
- Encabezados:
  - H2: Solucionador del entorno de ejecución
  - H2: Resultado
  - H2: Grupos de acceso
  - H2: Modos de eventos
  - H2: Rutas y activación
  - H2: Redacción
  - H2: Verificación

## plugins/sdk-channel-message.md

- Ruta: /plugins/sdk-channel-message
- Encabezados: ninguno

## plugins/sdk-channel-outbound.md

- Ruta: /plugins/sdk-channel-outbound
- Encabezados:
  - H2: Adaptador
  - H2: Saneamiento de texto sin formato
  - H2: Evidencia de entrega
  - H2: Adaptadores de salida existentes
  - H2: Envíos duraderos
  - H2: Admisión de entrega diferida
  - H2: Despacho de compatibilidad

## plugins/sdk-channel-plugins.md

- Ruta: /plugins/sdk-channel-plugins
- Encabezados:
  - H2: Responsabilidades de su plugin
  - H2: Adaptador de mensajes
  - H3: Entrada de mensajes entrantes (experimental)
  - H3: Indicadores de escritura
  - H3: Parámetros de origen de medios
  - H3: Conformación de cargas útiles nativas
  - H3: Gramática de conversaciones de sesión
  - H3: Compatibilidad con la vinculación de conversaciones por cuenta
  - H2: Aprobaciones y capacidades del canal
  - H3: Autenticación de aprobaciones
  - H3: Ciclo de vida de la carga útil y orientación de configuración
  - H3: Entrega nativa de aprobaciones
  - H3: Subrutas más específicas del entorno de ejecución de aprobaciones
  - H3: Subrutas de configuración
  - H3: Otras subrutas específicas del canal
  - H2: Política de menciones entrantes
  - H2: Tutorial
  - H2: Estructura de archivos
  - H2: Temas avanzados
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## plugins/sdk-channel-turn.md

- Ruta: /plugins/sdk-channel-turn
- Encabezados: ninguno

## plugins/sdk-entrypoints.md

- Ruta: /plugins/sdk-entrypoints
- Encabezados:
  - H2: Entradas del paquete
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Modo de registro
  - H2: Formas de los plugins
  - H2: Contenido relacionado

## plugins/sdk-migration.md

- Ruta: /plugins/sdk-migration
- Encabezados:
  - H2: Qué cambió
  - H3: Motivo
  - H2: Política de compatibilidad
  - H2: Cómo migrar
  - H2: Referencia de rutas de importación
  - H2: Obsolescencias activas
  - H2: Migración de conversación y voz en tiempo real
  - H2: Cronograma de eliminación
  - H2: Supresión temporal de las advertencias
  - H2: Contenido relacionado

## plugins/sdk-overview.md

- Ruta: /plugins/sdk-overview
- Encabezados:
  - H2: Convención de importación
  - H2: Referencia de subrutas
  - H2: API de registro
  - H3: Registro de capacidades
  - H3: Herramientas y comandos
  - H3: Infraestructura
  - H3: Enlaces del host para plugins de flujo de trabajo
  - H3: Registro de descubrimiento del Gateway
  - H3: Metadatos de registro de la CLI
  - H3: Registro del backend de la CLI
  - H3: Ranuras exclusivas
  - H3: Adaptadores obsoletos de incrustación de memoria
  - H3: Eventos y ciclo de vida
  - H3: Semántica de decisión de los enlaces
  - H3: Campos del objeto de la API
  - H2: Convención de módulos internos
  - H2: Contenido relacionado

## plugins/sdk-provider-plugins.md

- Ruta: /plugins/sdk-provider-plugins
- Encabezados:
  - H2: Tutorial
  - H2: Publicar en ClawHub
  - H2: Estructura de archivos
  - H2: Referencia del orden del catálogo
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## plugins/sdk-runtime.md

- Ruta: /plugins/sdk-runtime
- Encabezados:
  - H2: Carga y escritura de la configuración
  - H2: Utilidades reutilizables del entorno de ejecución
  - H2: Espacios de nombres del entorno de ejecución
  - H2: Almacenamiento de referencias del entorno de ejecución
  - H2: Otros campos de nivel superior de la API
  - H2: Contenido relacionado

## plugins/sdk-setup.md

- Ruta: /plugins/sdk-setup
- Encabezados:
  - H2: Metadatos del paquete
  - H3: Campos de openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Carga completa diferida
  - H2: Manifiesto del plugin
  - H2: Publicación en ClawHub
  - H2: Entrada de configuración
  - H3: Importaciones específicas de utilidades de configuración
  - H3: Promoción de cuenta única propiedad del canal
  - H2: Esquema de configuración
  - H3: Creación de esquemas de configuración de canales
  - H2: Asistentes de configuración
  - H2: Publicación e instalación
  - H2: Contenido relacionado

## plugins/sdk-subpaths.md

- Ruta: /plugins/sdk-subpaths
- Encabezados:
  - H2: Entrada del plugin
  - H3: Utilidades obsoletas de compatibilidad y pruebas
  - H3: Subrutas reservadas de utilidades para plugins incluidos
  - H2: Contenido relacionado

## plugins/sdk-testing.md

- Ruta: /plugins/sdk-testing
- Encabezados:
  - H2: Utilidades de prueba
  - H3: Exportaciones disponibles
  - H3: Tipos
  - H2: Pruebas de resolución de objetivos
  - H2: Patrones de prueba
  - H3: Pruebas de contratos de registro
  - H3: Pruebas de acceso a la configuración del entorno de ejecución
  - H3: Pruebas unitarias de un plugin de canal
  - H3: Pruebas unitarias de un plugin de proveedor
  - H3: Simulación del entorno de ejecución del plugin
  - H3: Pruebas con stubs por instancia
  - H2: Pruebas de contrato (plugins del repositorio)
  - H3: Ejecución de pruebas específicas
  - H2: Aplicación del lint (plugins del repositorio)
  - H2: Configuración de pruebas
  - H2: Contenido relacionado

## plugins/tool-plugins.md

- Ruta: /plugins/tool-plugins
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Escribir una herramienta
  - H2: Herramientas opcionales y de fábrica
  - H2: Valores devueltos
  - H2: Configuración
  - H2: Metadatos generados
  - H2: Metadatos del paquete
  - H2: Validar en CI
  - H2: Instalar e inspeccionar localmente
  - H2: Publicar
  - H2: Solución de problemas
  - H3: no se encontró la entrada del plugin: ./dist/index.js
  - H3: la entrada del plugin no expone metadatos de defineToolPlugin
  - H3: los metadatos generados de openclaw.plugin.json están obsoletos
  - H3: openclaw.extensions de package.json debe incluir ./dist/index.js
  - H3: No se puede encontrar el paquete 'typebox'
  - H3: La herramienta no aparece después de la instalación
  - H2: Véase también

## plugins/vault.md

- Ruta: /plugins/vault
- Encabezados:
  - H1: SecretRefs de Vault
  - H2: Antes de comenzar
  - H2: Almacenar una clave de proveedor en Vault
  - H2: Hacer que Vault sea visible para el Gateway
  - H2: Generar y aplicar un plan de SecretRef
  - H2: Configurar más claves de proveedores
  - H2: Formato del identificador de SecretRef
  - H2: Qué almacena OpenClaw
  - H2: Contenedores y despliegues administrados
  - H2: Contenido relacionado

## plugins/voice-call.md

- Ruta: /plugins/voice-call
- Encabezados:
  - H2: Inicio rápido
  - H2: Configuración
  - H3: Referencia de configuración
  - H2: Ámbito de la sesión
  - H2: Conversaciones de voz en tiempo real
  - H3: Política de herramientas
  - H3: Contexto de voz del agente
  - H3: Ejemplos de proveedores en tiempo real
  - H2: Transcripción en streaming
  - H3: Ejemplos de proveedores de streaming
  - H2: TTS para llamadas
  - H3: Ejemplos de TTS
  - H2: Llamadas entrantes
  - H3: Enrutamiento por número
  - H3: Contrato de salida hablada
  - H3: Comportamiento al iniciar la conversación
  - H3: Periodo de gracia para la desconexión del flujo de Twilio
  - H2: Limpiador de llamadas obsoletas
  - H2: Seguridad del Webhook
  - H2: CLI
  - H2: Herramienta del agente
  - H2: RPC del Gateway
  - H2: Solución de problemas
  - H3: La configuración no logra exponer el Webhook
  - H3: Fallan las credenciales del proveedor
  - H3: Las llamadas se inician, pero los webhooks del proveedor no llegan
  - H3: Falla la verificación de la firma
  - H3: Fallan las incorporaciones de Google Meet mediante Twilio
  - H3: La llamada en tiempo real no tiene voz
  - H2: Contenido relacionado

## plugins/webhooks.md

- Ruta: /plugins/webhooks
- Encabezados:
  - H2: Configurar rutas
  - H2: Modelo de seguridad
  - H2: Formato de la solicitud
  - H2: Acciones compatibles
  - H3: createflow
  - H3: runtask
  - H2: Estructura de la respuesta
  - H2: Contenido relacionado

## plugins/workboard.md

- Ruta: /plugins/workboard
- Encabezados:
  - H2: Habilitarlo
  - H2: Configuración
  - H2: Campos de las tarjetas
  - H2: Iniciar el trabajo desde una tarjeta
  - H2: Herramientas del agente
  - H2: Despacho
  - H3: Selección de trabajadores
  - H3: Puntos de entrada
  - H2: CLI y comando de barra diagonal
  - H2: Sincronización del ciclo de vida de la sesión
  - H2: Flujo de trabajo del panel
  - H2: Diagnóstico
  - H2: Permisos
  - H2: Almacenamiento
  - H2: Solución de problemas
  - H2: Contenido relacionado

## plugins/zalouser.md

- Ruta: /plugins/zalouser
- Encabezados:
  - H2: Nomenclatura
  - H2: Dónde se ejecuta
  - H2: Instalación
  - H3: Desde npm
  - H3: Desde una carpeta local (desarrollo)
  - H2: Configuración
  - H2: CLI
  - H2: Herramienta del agente
  - H2: Contenido relacionado

## prose.md

- Ruta: /prose
- Encabezados:
  - H2: Instalación
  - H2: Comando de barra diagonal
  - H2: Qué puede hacer
  - H2: Ejemplo: investigación y síntesis en paralelo
  - H2: Correspondencia con el entorno de ejecución de OpenClaw
  - H2: Ubicaciones de archivos
  - H2: Backends de estado
  - H2: Seguridad
  - H2: Contenido relacionado

## providers/alibaba.md

- Ruta: /providers/alibaba
- Encabezados:
  - H2: Primeros pasos
  - H2: Modelos Wan integrados
  - H2: Capacidades y límites
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/anthropic.md

- Ruta: /providers/anthropic
- Encabezados:
  - H2: Seguimiento del uso y los costes
  - H2: Primeros pasos
  - H2: Sesiones de Claude entre equipos
  - H2: Valores predeterminados de razonamiento (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 y 4.6)
  - H2: Alternativa ante rechazos de seguridad (Claude Fable 5)
  - H3: Por qué existe
  - H3: Cómo funciona
  - H3: Observabilidad y facturación
  - H3: Ámbito
  - H2: Caché de prompts
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/arcee.md

- Ruta: /providers/arcee
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Funciones compatibles
  - H2: Contenido relacionado

## providers/azure-speech.md

- Ruta: /providers/azure-speech
- Encabezados:
  - H2: Primeros pasos
  - H2: Opciones de configuración
  - H2: Notas
  - H2: Contenido relacionado

## providers/bedrock-mantle.md

- Ruta: /providers/bedrock-mantle
- Encabezados:
  - H2: Primeros pasos
  - H2: Detección automática de modelos
  - H3: Regiones compatibles
  - H2: Configuración manual
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/bedrock.md

- Ruta: /providers/bedrock
- Encabezados:
  - H2: Primeros pasos
  - H2: Detección automática de modelos
  - H2: Configuración rápida (ruta de AWS)
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/cerebras.md

- Ruta: /providers/cerebras
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Configuración manual
  - H2: Contenido relacionado

## providers/chutes.md

- Ruta: /providers/chutes
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Comportamiento de detección
  - H2: Alias predeterminados
  - H2: Catálogo inicial integrado
  - H2: Ejemplo de configuración
  - H2: Contenido relacionado

## providers/claude-max-api-proxy.md

- Ruta: /providers/claude-max-api-proxy
- Encabezados:
  - H2: Por qué usarlo
  - H2: Cómo funciona
  - H2: Primeros pasos
  - H2: Configuración avanzada
  - H2: Notas
  - H2: Contenido relacionado

## providers/clawrouter.md

- Ruta: /providers/clawrouter
- Encabezados:
  - H2: Primeros pasos
  - H2: Despliegue administrado no interactivo
  - H2: Preparación y prueba en vivo
  - H2: Detección de modelos
  - H2: Plugins de protocolo y proveedor
  - H2: Cuotas y uso
  - H2: Solución de problemas
  - H2: Comportamiento de seguridad
  - H2: Contenido relacionado

## providers/cloudflare-ai-gateway.md

- Ruta: /providers/cloudflare-ai-gateway
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Ejemplo no interactivo
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/cohere.md

- Ruta: /providers/cohere
- Encabezados:
  - H2: Catálogo integrado
  - H2: Primeros pasos
  - H2: Configuración solo mediante el entorno
  - H2: Contenido relacionado

## providers/comfy.md

- Ruta: /providers/comfy
- Encabezados:
  - H2: Qué admite
  - H2: Primeros pasos
  - H2: Configuración
  - H3: Claves compartidas
  - H3: Claves por capacidad
  - H2: Detalles del flujo de trabajo
  - H2: Contenido relacionado

## providers/deepgram.md

- Ruta: /providers/deepgram
- Encabezados:
  - H2: Primeros pasos
  - H2: Opciones de configuración
  - H2: STT en streaming para Voice Call
  - H2: Notas
  - H2: Contenido relacionado

## providers/deepinfra.md

- Ruta: /providers/deepinfra
- Encabezados:
  - H2: Instalar el plugin
  - H2: Obtener una clave de API
  - H2: Configuración mediante CLI
  - H2: Fragmento de configuración
  - H2: Superficies compatibles
  - H2: Modelos disponibles
  - H2: Notas
  - H2: Contenido relacionado

## providers/deepseek.md

- Ruta: /providers/deepseek
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Catálogo integrado
  - H2: Razonamiento y herramientas
  - H2: Pruebas en vivo
  - H2: Ejemplo de configuración
  - H2: Contenido relacionado

## providers/ds4.md

- Ruta: /providers/ds4
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Configuración completa
  - H2: Inicio bajo demanda
  - H2: Think Max
  - H2: Prueba
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/elevenlabs.md

- Ruta: /providers/elevenlabs
- Encabezados:
  - H2: Autenticación
  - H2: Texto a voz
  - H2: Voz a texto
  - H2: STT en streaming
  - H2: Contenido relacionado

## providers/fal.md

- Ruta: /providers/fal
- Encabezados:
  - H2: Primeros pasos
  - H2: Generación de imágenes
  - H2: Generación de vídeos
  - H2: Generación de música
  - H2: Contenido relacionado

## providers/featherless.md

- Ruta: /providers/featherless
- Encabezados:
  - H2: Configuración
  - H2: Modelo predeterminado
  - H2: Otros modelos de Featherless
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/fireworks.md

- Ruta: /providers/fireworks
- Encabezados:
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Identificadores de modelos personalizados de Fireworks
  - H2: Contenido relacionado

## providers/github-copilot.md

- Ruta: /providers/github-copilot
- Encabezados:
  - H2: Tres formas de usar Copilot en OpenClaw
  - H2: GitHub Enterprise (residencia de datos)
  - H2: Indicadores opcionales
  - H2: Incorporación no interactiva
  - H2: Embeddings para la búsqueda en memoria
  - H3: Configuración
  - H3: Cómo funciona
  - H2: Contenido relacionado

## providers/gmi.md

- Ruta: /providers/gmi
- Encabezados:
  - H2: Configuración
  - H2: Cuándo elegir GMI
  - H2: Modelos
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/google.md

- Ruta: /providers/google
- Encabezados:
  - H2: Primeros pasos
  - H2: Capacidades
  - H2: Búsqueda web
  - H2: Generación de imágenes
  - H2: Generación de vídeos
  - H2: Generación de música
  - H2: Texto a voz
  - H2: Voz en tiempo real
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/gradium.md

- Ruta: /providers/gradium
- Encabezados:
  - H2: Instalar el plugin
  - H2: Configuración
  - H2: Configuración
  - H2: Voces
  - H3: Sustitución de voz por mensaje
  - H2: Salida
  - H2: Orden de selección automática
  - H2: Contenido relacionado

## providers/groq.md

- Ruta: /providers/groq
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H3: Ejemplo de archivo de configuración
  - H2: Catálogo integrado
  - H2: Modelos de razonamiento
  - H2: Transcripción de audio
  - H2: Contenido relacionado

## providers/huggingface.md

- Ruta: /providers/huggingface
- Encabezados:
  - H2: Primeros pasos
  - H3: Configuración no interactiva
  - H2: Identificadores de modelos
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/index.md

- Ruta: /providers
- Encabezados:
  - H2: Inicio rápido
  - H2: Documentación de proveedores
  - H2: Páginas de descripción general compartidas
  - H2: Proveedores de transcripción
  - H2: Herramientas de la comunidad

## providers/inferrs.md

- Ruta: /providers/inferrs
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración completa
  - H2: Inicio bajo demanda
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/inworld.md

- Ruta: /providers/inworld
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Opciones de configuración
  - H2: Notas
  - H2: Contenido relacionado

## providers/kilocode.md

- Ruta: /providers/kilocode
- Encabezados:
  - H2: Instalar el plugin
  - H2: Configuración
  - H2: Modelo y catálogo predeterminados
  - H2: Ejemplo de configuración
  - H2: Notas sobre el comportamiento
  - H2: Contenido relacionado

## providers/litellm.md

- Ruta: /providers/litellm
- Encabezados:
  - H2: Inicio rápido
  - H2: Configuración
  - H2: Generación de imágenes
  - H2: Opciones avanzadas
  - H2: Contenido relacionado

## providers/lmstudio.md

- Ruta: /providers/lmstudio
- Encabezados:
  - H2: Inicio rápido
  - H2: Incorporación no interactiva
  - H2: Configuración
  - H3: Compatibilidad del uso en streaming
  - H3: Compatibilidad del razonamiento
  - H3: Configuración explícita
  - H3: Deshabilitar la precarga
  - H3: Host de LAN o tailnet
  - H2: Solución de problemas
  - H3: LM Studio no detectado
  - H3: Errores de autenticación (HTTP 401)
  - H2: Contenido relacionado

## providers/longcat.md

- Ruta: /providers/longcat
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H3: Configuración no interactiva
  - H2: Comportamiento del razonamiento
  - H2: Precios
  - H2: LongCat-2.0 autoalojado
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/meta.md

- Ruta: /providers/meta
- Encabezados:
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Configuración manual
  - H2: Prueba rápida
  - H2: Contenido relacionado

## providers/minimax.md

- Ruta: /providers/minimax
- Encabezados:
  - H2: Catálogo integrado
  - H2: Primeros pasos
  - H2: Configurar mediante openclaw configure
  - H2: Capacidades
  - H3: Generación de imágenes
  - H3: Texto a voz
  - H3: Generación de música
  - H3: Generación de vídeos
  - H3: Comprensión de imágenes
  - H3: Búsqueda web
  - H2: Configuración avanzada
  - H2: Notas
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/mistral.md

- Ruta: /providers/mistral
- Encabezados:
  - H2: Primeros pasos
  - H2: Catálogo de LLM integrado
  - H2: Transcripción de audio (Voxtral)
  - H2: STT en streaming para Voice Call
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/models.md

- Ruta: /providers/models
- Encabezados:
  - H2: Inicio rápido (dos pasos)
  - H2: Proveedores compatibles (conjunto inicial)
  - H2: Variantes adicionales de proveedores
  - H2: Contenido relacionado

## providers/moonshot.md

- Ruta: /providers/moonshot
- Encabezados:
  - H2: Catálogo de modelos integrado
  - H2: Primeros pasos
  - H2: Búsqueda web de Kimi
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/novita.md

- Ruta: /providers/novita
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: Catálogo de modelos incluido
  - H2: Cuándo elegir Novita
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/nvidia.md

- Ruta: /providers/nvidia
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogo destacado
  - H2: Nemotron 3 Ultra
  - H2: Catálogo alternativo incluido
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/ollama-cloud.md

- Ruta: /providers/ollama-cloud
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: Cuándo elegir Ollama Cloud
  - H2: Modelos
  - H2: Prueba en vivo
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/ollama.md

- Ruta: /providers/ollama
- Encabezados:
  - H2: Reglas de autenticación
  - H2: Primeros pasos
  - H2: Modelos en la nube mediante un host local
  - H2: Detección de modelos (proveedor implícito)
  - H3: Pruebas de humo
  - H2: Inferencia local del Node
  - H2: Visión y descripción de imágenes
  - H2: Configuración
  - H2: Recetas habituales
  - H3: Selección de modelos
  - H3: Verificación rápida
  - H2: Búsqueda web de Ollama
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/openai.md

- Ruta: /providers/openai
- Encabezados:
  - H2: Seguimiento del uso y los costes
  - H2: Elección rápida
  - H2: Mapa de nombres
  - H2: Entorno de ejecución implícito del agente
  - H2: Vista previa limitada de GPT-5.6
  - H2: Cobertura de funcionalidades de OpenClaw
  - H2: Incrustaciones de memoria
  - H2: Primeros pasos
  - H2: Autenticación nativa del servidor de aplicaciones de Codex
  - H2: Generación de imágenes
  - H2: Generación de vídeo
  - H2: Contribución al prompt de GPT-5
  - H2: Voz y habla
  - H2: Endpoints de Azure OpenAI
  - H3: Configuración
  - H3: Versión de la API
  - H3: Los nombres de los modelos son nombres de implementación
  - H3: Disponibilidad regional
  - H3: Diferencias entre parámetros
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/opencode-go.md

- Ruta: /providers/opencode-go
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogo integrado
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/opencode.md

- Ruta: /providers/opencode
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogos integrados
  - H3: Zen
  - H3: Go
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/openrouter.md

- Ruta: /providers/openrouter
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Referencias de modelos
  - H2: Generación de imágenes
  - H2: Generación de vídeo
  - H2: Generación de música
  - H2: Conversión de texto a voz
  - H2: Conversión de voz a texto (audio entrante)
  - H2: Enrutador de fusión
  - H2: Autenticación y encabezados
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/perplexity-provider.md

- Ruta: /providers/perplexity-provider
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Modos de búsqueda
  - H2: Filtrado de la API nativa
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/pixverse.md

- Ruta: /providers/pixverse
- Encabezados:
  - H2: Primeros pasos
  - H2: Modos y modelos compatibles
  - H2: Opciones del proveedor
  - H2: Configuración
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/qianfan.md

- Ruta: /providers/qianfan
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Catálogo integrado
  - H2: Ejemplo de configuración
  - H2: Contenido relacionado

## providers/qwen-oauth.md

- Ruta: /providers/qwen-oauth
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: Diferencias respecto a Qwen
  - H2: Modelos
  - H2: Migración
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/qwen.md

- Ruta: /providers/qwen
- Encabezados:
  - H2: Instalar el plugin
  - H2: Primeros pasos
  - H2: Tipos de planes y endpoints
  - H2: Catálogo integrado
  - H3: Catálogo del plan de tokens
  - H2: Controles de razonamiento
  - H2: Complementos multimodales
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/runway.md

- Ruta: /providers/runway
- Encabezados:
  - H2: Primeros pasos
  - H2: Modos y modelos compatibles
  - H2: Configuración
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/senseaudio.md

- Ruta: /providers/senseaudio
- Encabezados:
  - H2: Primeros pasos
  - H2: Opciones
  - H2: Contenido relacionado

## providers/sglang.md

- Ruta: /providers/sglang
- Encabezados:
  - H2: Primeros pasos
  - H2: Detección de modelos (proveedor implícito)
  - H2: Configuración explícita (modelos manuales)
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/stepfun.md

- Ruta: /providers/stepfun
- Encabezados:
  - H2: Instalar el plugin
  - H2: Resumen de regiones y endpoints
  - H2: Catálogo integrado
  - H2: Primeros pasos
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/synthetic.md

- Ruta: /providers/synthetic
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogo integrado
  - H2: Contenido relacionado

## providers/tencent.md

- Ruta: /providers/tencent
- Encabezados:
  - H2: Inicio rápido
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/together.md

- Ruta: /providers/together
- Encabezados:
  - H2: Primeros pasos
  - H3: Ejemplo no interactivo
  - H2: Catálogo integrado
  - H2: Generación de vídeo
  - H2: Contenido relacionado

## providers/venice.md

- Ruta: /providers/venice
- Encabezados:
  - H2: Modos de privacidad
  - H2: Primeros pasos
  - H2: Selección de modelos
  - H2: Catálogo integrado (38 modelos)
  - H2: Detección de modelos
  - H2: Comportamiento de reproducción de DeepSeek V4
  - H2: Compatibilidad con streaming y herramientas
  - H2: Precios
  - H2: Ejemplos de uso
  - H2: Solución de problemas
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/vercel-ai-gateway.md

- Ruta: /providers/vercel-ai-gateway
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo no interactivo
  - H2: Forma abreviada del ID del modelo
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/vllm.md

- Ruta: /providers/vllm
- Encabezados:
  - H2: Primeros pasos
  - H2: Detección de modelos (proveedor implícito)
  - H2: Configuración explícita
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Contenido relacionado

## providers/volcengine.md

- Ruta: /providers/volcengine
- Encabezados:
  - H2: Primeros pasos
  - H2: Proveedores y endpoints
  - H2: Catálogo integrado
  - H2: Conversión de texto a voz
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## providers/vydra.md

- Ruta: /providers/vydra
- Encabezados:
  - H2: Configuración
  - H2: Capacidades
  - H2: Contenido relacionado

## providers/xai.md

- Ruta: /providers/xai
- Encabezados:
  - H2: Configuración
  - H2: Solución de problemas de OAuth
  - H2: Catálogo integrado
  - H2: Cobertura de funcionalidades
  - H3: Compatibilidad con el modo rápido heredado
  - H3: Compatibilidad heredada y alias cambiantes
  - H2: Funcionalidades
  - H2: Pruebas en vivo
  - H2: Contenido relacionado

## providers/xiaomi.md

- Ruta: /providers/xiaomi
- Encabezados:
  - H2: Primeros pasos
  - H2: Catálogo de pago por uso
  - H2: Catálogo del plan de tokens
  - H2: Modelos de razonamiento
  - H2: Conversión de texto a voz
  - H2: Ejemplo de configuración
  - H2: Contenido relacionado

## providers/zai.md

- Ruta: /providers/zai
- Encabezados:
  - H2: Modelos GLM
  - H2: Primeros pasos
  - H3: Endpoints
  - H2: Ejemplo de configuración
  - H2: Catálogo integrado
  - H2: Niveles de razonamiento
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## refactor/acp.md

- Ruta: /refactor/acp
- Encabezados:
  - H2: Objetivos
  - H2: Aspectos excluidos
  - H2: Modelo objetivo
  - H3: Identidad de la instancia del Gateway
  - H3: Propiedad de la sesión de ACP
  - H3: Arrendamientos de procesos ACPX
  - H2: Controlador del ciclo de vida
  - H2: Contrato del contenedor
  - H2: Contrato de visibilidad de las sesiones
  - H2: Plan de migración
  - H3: Fase 1: Añadir identidad y arrendamientos
  - H3: Fase 2: Limpieza basada primero en los arrendamientos
  - H3: Fase 3: Recolección al inicio basada primero en los arrendamientos
  - H3: Fase 4: Filas de propiedad de las sesiones
  - H3: Fase 5: Eliminar las heurísticas heredadas
  - H2: Pruebas
  - H2: Notas de compatibilidad
  - H2: Criterios de éxito

## refactor/canvas.md

- Ruta: /refactor/canvas
- Encabezados:
  - H1: Refactorización del plugin Canvas
  - H2: Objetivo
  - H2: Aspectos excluidos
  - H2: Estado de la rama actual
  - H2: Estructura objetivo
  - H2: Pasos de la migración
  - H2: Lista de comprobación de la auditoría
  - H2: Comandos de verificación

## refactor/database-first.md

- Ruta: /refactor/database-first
- Encabezados:
  - H1: Refactorización del estado centrada primero en la base de datos
  - H2: Decisión
  - H2: Contrato estricto
  - H2: Estado objetivo y progreso
  - H3: Objetivo estricto
  - H3: Estados objetivo
  - H3: Estado actual
  - H3: Trabajo pendiente
  - H3: No introducir regresiones
  - H2: Suposiciones derivadas de la lectura del código
  - H2: Hallazgos derivados de la lectura del código
  - H2: Estructura actual del código
  - H2: Estructura objetivo del esquema
  - H2: Estructura de la migración de Doctor
  - H2: Inventario de migración
  - H2: Plan de migración
  - H3: Fase 0: Inmovilizar el límite
  - H3: Fase 1: Completar el plano de control global
  - H3: Fase 2: Introducir bases de datos por agente
  - H3: Fase 3: Sustituir las API del almacén de sesiones
  - H3: Fase 4: Trasladar transcripciones, flujos de ACP, trayectorias y VFS
  - H3: Fase 5: Copia de seguridad, restauración, compactación y verificación
  - H3: Fase 6: Entorno de ejecución de trabajadores
  - H3: Fase 7: Eliminar el sistema anterior
  - H2: Copia de seguridad y restauración
  - H2: Plan de refactorización del entorno de ejecución
  - H2: Reglas de rendimiento
  - H2: Prohibiciones estáticas
  - H2: Criterios de finalización

## refactor/operator-approvals.md

- Ruta: /refactor/operator-approvals
- Encabezados:
  - H1: Aprobaciones del operador en múltiples superficies
  - H2: Objetivos
  - H2: Aspectos excluidos
  - H2: Referencia previa al despliegue y mapa de evidencias
  - H2: Soluciones anteriores
  - H2: Arquitectura y propiedad
  - H2: Registro persistente
  - H2: Máquina de estados y comparación y asignación
  - H2: API del Gateway
  - H2: Eventos y acciones portátiles
  - H2: Interfaz de control
  - H2: Autorización y privacidad
  - H2: Proyección de la audiencia
  - H2: Convergencia de las superficies de entrega
  - H2: Semántica del reinicio, el tiempo de espera y las rutas
  - H2: Plan de compatibilidad
  - H2: Despliegue
  - H3: PR 1: ciclo de vida duradero
  - H3: PR 2: acciones tipadas y devoluciones de llamada de los canales
  - H3: PR 3: enlace profundo de la interfaz de control
  - H3: PR 4: clientes nativos
  - H3: PR 5: propagación del ciclo de vida de los ancestros
  - H3: PR 6: comportamiento de cierre ante fallos
  - H3: Seguimiento: limpieza duradera de mensajes remotos
  - H2: Pruebas
  - H2: Observabilidad
  - H2: Decisiones pendientes

## reference/AGENTS.default.md

- Ruta: /reference/AGENTS.default
- Encabezados:
  - H2: Primera ejecución (recomendado)
  - H2: Valores predeterminados de seguridad
  - H2: Comprobación previa de soluciones existentes
  - H2: Inicio de sesión (obligatorio)
  - H2: Identidad (obligatorio)
  - H2: Espacios compartidos (recomendado)
  - H2: Sistema de memoria (recomendado)
  - H2: Herramientas y Skills
  - H2: Consejo sobre copias de seguridad (recomendado)
  - H2: Qué hace OpenClaw
  - H2: Skills principales (activar en Settings → Skills)
  - H2: Notas de uso
  - H2: Contenido relacionado

## reference/RELEASING.md

- Ruta: /reference/RELEASING
- Encabezados:
  - H2: Nomenclatura de versiones
  - H2: Frecuencia de publicación
  - H2: Publicación mensual de estabilidad extendida solo en npm
  - H2: Lista de comprobación del operador para publicaciones periódicas
  - H2: Cierre estable de la rama principal
  - H2: Comprobaciones previas a la publicación
  - H2: Entornos de prueba para publicaciones
  - H3: Vitest
  - H3: Docker
  - H3: Laboratorio de control de calidad
  - H3: Paquete
  - H2: Automatización de la publicación periódica
  - H2: Entradas del flujo de trabajo de NPM
  - H2: Secuencia periódica de publicación beta/estable más reciente
  - H2: Referencias públicas
  - H2: Contenido relacionado

## reference/api-usage-costs.md

- Ruta: /reference/api-usage-costs
- Encabezados:
  - H2: Dónde aparecen los costes
  - H2: Cómo se detectan las claves
  - H2: Funcionalidades que pueden consumir claves
  - H3: Respuestas del modelo principal (chat + herramientas)
  - H3: Comprensión de contenido multimedia (audio/imagen/vídeo)
  - H3: Generación de imágenes y vídeo
  - H3: Incrustaciones de memoria y búsqueda semántica
  - H3: Herramienta de búsqueda web
  - H3: Herramienta de obtención web (Firecrawl)
  - H3: Instantáneas de uso del proveedor (estado/salud)
  - H3: Resumen de protección de Compaction
  - H3: Exploración/sondeo de modelos
  - H3: Conversación (voz)
  - H3: Skills (API de terceros)
  - H2: Contenido relacionado

## reference/code-mode.md

- Ruta: /reference/code-mode
- Encabezados:
  - H2: Qué hace
  - H2: Por qué usarlo
  - H2: Habilitarlo
  - H2: Recorrido técnico
  - H2: Estado del entorno de ejecución
  - H2: Ámbito
  - H2: Términos
  - H2: Configuración
  - H2: Activación
  - H2: Herramientas visibles para el modelo
  - H2: exec
  - H2: wait
  - H2: API del entorno de ejecución invitado
  - H2: Espacios de nombres internos
  - H3: Ciclo de vida del registro
  - H3: Estructura del registro
  - H3: Propiedad y visibilidad
  - H3: Reglas de serialización del ámbito
  - H3: Prompts
  - H3: Limpieza
  - H3: Lista de comprobación de pruebas
  - H2: API de salida
  - H2: Catálogo de herramientas
  - H2: Interacción con la búsqueda de herramientas
  - H2: Nombres de herramientas y colisiones
  - H2: Ejecución anidada de herramientas
  - H2: Ciclo de vida de la ejecución y la instantánea
  - H2: Entorno de ejecución QuickJS-WASI
  - H2: TypeScript
  - H2: Límite de seguridad
  - H2: Códigos de error
  - H2: Telemetría
  - H2: Depuración
  - H2: Estructura de la implementación
  - H2: Lista de comprobación de validación
  - H2: Plan de pruebas E2E
  - H2: Contenido relacionado

## reference/credits.md

- Ruta: /reference/credits
- Encabezados:
  - H2: Créditos
  - H2: Colaboradores principales
  - H2: Licencia
  - H2: Contenido relacionado

## reference/device-models.md

- Ruta: /reference/device-models
- Encabezados:
  - H2: Fuente de datos
  - H2: Actualización de la base de datos
  - H2: Contenido relacionado

## reference/full-release-validation.md

- Ruta: /reference/full-release-validation
- Encabezados:
  - H2: Etapas de nivel superior
  - H2: Etapas de comprobación de la versión
  - H2: Bloques de la ruta de publicación de Docker
  - H2: Perfiles de publicación
  - H2: Elementos adicionales exclusivos de la validación completa
  - H2: Reejecuciones específicas
  - H2: Evidencia que se debe conservar
  - H2: Archivos de flujo de trabajo

## reference/memory-config.md

- Ruta: /reference/memory-config
- Encabezados:
  - H2: Selección del proveedor
  - H3: Identificadores de proveedor personalizados
  - H3: Resolución de claves de API
  - H2: Configuración del endpoint remoto
  - H2: Configuración específica del proveedor
  - H3: Tiempo de espera de embeddings en línea
  - H2: Comportamiento de la indexación
  - H2: Configuración de la búsqueda híbrida
  - H3: Ejemplo completo
  - H2: Rutas de memoria adicionales
  - H2: Memoria multimodal (Gemini)
  - H2: Caché de embeddings
  - H2: Indexación por lotes
  - H2: Búsqueda en la memoria de sesión (experimental)
  - H2: Aceleración vectorial de SQLite (sqlite-vec)
  - H2: Almacenamiento del índice
  - H2: Configuración del backend QMD
  - H3: Integración con mcporter
  - H3: Ejemplo completo de QMD
  - H2: Dreaming
  - H3: Configuración del usuario
  - H3: Ejemplo
  - H2: Contenido relacionado

## reference/openclaw-ai.md

- Ruta: /reference/openclaw-ai
- Encabezados:
  - H2: Inicio rápido
  - H2: Contrato de diseño
  - H2: Exportaciones de subrutas

## reference/path3-live-sqlite-e2e-harness.md

- Ruta: /reference/path3-live-sqlite-e2e-harness
- Encabezados:
  - H2: Estructura del comando
  - H2: Prueba aislada de la CLI compilada
  - H2: Comprobación previa
  - H2: Escenario dirigido por el agente
  - H2: Aserciones por paso
  - H2: Artefacto de evidencia
  - H2: Reglas de seguridad
  - H2: Resultado satisfactorio

## reference/prompt-caching.md

- Ruta: /reference/prompt-caching
- Encabezados:
  - H2: Controles principales
  - H3: cacheRetention
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Mantenimiento activo mediante Heartbeat
  - H2: Comportamiento del proveedor
  - H3: Anthropic (API directa y Vertex AI)
  - H3: OpenAI (API directa)
  - H3: Amazon Bedrock
  - H3: OpenRouter
  - H3: Google Gemini (API directa)
  - H3: Proveedores del arnés de CLI (Claude Code, Gemini CLI)
  - H3: Otros proveedores
  - H2: Límite de la caché del prompt del sistema
  - H2: Protecciones de estabilidad de la caché de OpenClaw
  - H2: Patrones de ajuste
  - H3: Tráfico mixto (opción predeterminada recomendada)
  - H3: Configuración de referencia centrada en el coste
  - H2: Pruebas de regresión en vivo
  - H3: Expectativas en vivo de Anthropic
  - H3: Expectativas en vivo de OpenAI
  - H2: Configuración de diagnostics.cacheTrace
  - H3: Conmutadores de entorno (depuración puntual)
  - H3: Qué inspeccionar
  - H2: Solución rápida de problemas
  - H2: Contenido relacionado

## reference/release-performance-sweep.md

- Ruta: /reference/release-performance-sweep
- Encabezados:
  - H2: Instantánea
  - H2: Qué cambió en 5.28
  - H2: Cifras principales
  - H3: Espacio ocupado por la instalación
  - H3: Tamaño del paquete npm
  - H2: Resumen del turno del agente Kova
  - H2: Sondeos del código fuente
  - H2: Auditoría del espacio ocupado por la instalación
  - H3: Límite del archivo shrinkwrap
  - H2: Interpretación de la cadena de suministro

## reference/rich-output-protocol.md

- Ruta: /reference/rich-output-protocol
- Encabezados:
  - H2: Archivos multimedia adjuntos
  - H2: [embed ...]
  - H2: Estructura de renderización almacenada
  - H2: Contenido relacionado

## reference/rpc.md

- Ruta: /reference/rpc
- Encabezados:
  - H2: Patrón A: demonio HTTP (signal-cli)
  - H2: Patrón B: proceso secundario mediante stdio (imsg)
  - H2: Directrices para adaptadores
  - H2: Contenido relacionado

## reference/secret-placeholder-conventions.md

- Ruta: /reference/secret-placeholder-conventions
- Encabezados:
  - H1: Convenciones de marcadores de posición para secretos
  - H2: Estilo recomendado
  - H2: Patrones que se deben evitar en la documentación
  - H2: Ejemplo

## reference/secretref-credential-surface.md

- Ruta: /reference/secretref-credential-surface
- Encabezados:
  - H2: Credenciales compatibles
  - H3: Destinos de openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Destinos de auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Credenciales no compatibles
  - H2: Contenido relacionado

## reference/session-management-compaction.md

- Ruta: /reference/session-management-compaction
- Encabezados:
  - H2: Dos capas de persistencia
  - H2: Ubicaciones en disco
  - H2: Mantenimiento del almacén y controles de disco
  - H3: Reversión a una versión anterior tras la migración a SQLite
  - H2: Sesiones de Cron y registros de ejecución
  - H2: Claves de sesión (sessionKey)
  - H2: Identificadores de sesión (sessionId)
  - H2: Esquema del almacén de sesiones
  - H2: Estructura de eventos de la transcripción
  - H2: Ventanas de contexto frente a tokens registrados
  - H2: Compaction: qué es
  - H3: Límites de los bloques y emparejamiento de herramientas
  - H2: Cuándo se produce la compactación automática
  - H2: Configuración de Compaction
  - H2: Proveedores conectables de Compaction
  - H2: Superficies visibles para el usuario
  - H2: Mantenimiento silencioso (NOREPLY)
  - H2: Vaciado de la memoria previo a Compaction
  - H2: Lista de comprobación para solucionar problemas
  - H2: Contenido relacionado

## reference/templates/AGENTS.dev.md

- Ruta: /reference/templates/AGENTS.dev
- Encabezados:
  - H1: AGENTS.md - Espacio de trabajo de OpenClaw
  - H2: Tu identidad está preconfigurada
  - H2: Consejo sobre copias de seguridad (recomendado)
  - H2: Valores predeterminados de seguridad
  - H2: Comprobación previa de soluciones existentes
  - H2: Memoria diaria (recomendada)
  - H2: Heartbeats (opcionales)
  - H2: Personalización
  - H2: Memoria de origen de C-3PO
  - H3: Fecha de nacimiento: 2026-01-09
  - H3: Verdades fundamentales (de Clawd)
  - H2: Contenido relacionado

## reference/templates/BOOT.md

- Ruta: /reference/templates/BOOT
- Encabezados:
  - H1: BOOT.md
  - H2: Contenido relacionado

## reference/templates/BOOTSTRAP.md

- Ruta: /reference/templates/BOOTSTRAP
- Encabezados:
  - H1: BOOTSTRAP.md - Hola, mundo
  - H2: La conversación
  - H2: Después de saber quién eres
  - H2: Conexión (opcional)
  - H2: Cuando hayas terminado
  - H2: Contenido relacionado

## reference/templates/HEARTBEAT.md

- Ruta: /reference/templates/HEARTBEAT
- Encabezados:
  - H1: Plantilla HEARTBEAT.md
  - H2: Contenido relacionado

## reference/templates/IDENTITY.dev.md

- Ruta: /reference/templates/IDENTITY.dev
- Encabezados:
  - H1: IDENTITY.md - Identidad del agente
  - H2: Rol
  - H2: Alma
  - H2: Relación con Clawd
  - H2: Peculiaridades
  - H2: Frase característica
  - H2: Contenido relacionado

## reference/templates/IDENTITY.md

- Ruta: /reference/templates/IDENTITY
- Encabezados:
  - H1: IDENTITY.md - ¿Quién soy?
  - H2: Contenido relacionado

## reference/templates/SOUL.dev.md

- Ruta: /reference/templates/SOUL.dev
- Encabezados:
  - H1: SOUL.md - El alma de C-3PO
  - H2: Quién soy
  - H2: Mi propósito
  - H2: Cómo opero
  - H2: Mis peculiaridades
  - H2: Mi relación con Clawd
  - H2: Lo que no haré
  - H2: La regla de oro
  - H2: Contenido relacionado

## reference/templates/SOUL.md

- Ruta: /reference/templates/SOUL
- Encabezados:
  - H1: SOUL.md - Quién eres
  - H2: Verdades fundamentales
  - H2: Límites
  - H2: Estilo
  - H2: Continuidad
  - H2: Contenido relacionado

## reference/templates/TOOLS.dev.md

- Ruta: /reference/templates/TOOLS.dev
- Encabezados:
  - H1: TOOLS.md - Notas sobre herramientas del usuario (editables)
  - H2: Ejemplos
  - H3: imsg
  - H3: sag
  - H2: Contenido relacionado

## reference/templates/TOOLS.md

- Ruta: /reference/templates/TOOLS
- Encabezados:
  - H1: TOOLS.md - Notas locales
  - H2: Ejemplos
  - H2: ¿Por qué mantenerlas separadas?
  - H2: Contenido relacionado

## reference/templates/USER.dev.md

- Ruta: /reference/templates/USER.dev
- Encabezados:
  - H1: USER.md - Perfil del usuario
  - H2: Contenido relacionado

## reference/templates/USER.md

- Ruta: /reference/templates/USER
- Encabezados:
  - H1: USER.md - Acerca de tu humano
  - H2: Contexto
  - H2: Contenido relacionado

## reference/test.md

- Ruta: /reference/test
- Encabezados:
  - H2: Configuración predeterminada del agente
  - H2: Orden local habitual
  - H2: Comandos principales
  - H2: Estado compartido de las pruebas y ayudantes de procesos
  - H2: Vías de Control UI, TUI y extensiones
  - H2: Gateway y E2E
  - H2: Conjunto completo de Docker (pnpm test:docker:all)
  - H3: Vías destacadas de Docker
  - H2: Comprobación local de PR
  - H2: Herramientas de rendimiento de pruebas
  - H2: Pruebas comparativas
  - H2: E2E de incorporación (Docker)
  - H2: Prueba rápida de importación mediante QR (Docker)
  - H2: Contenido relacionado

## reference/token-use.md

- Ruta: /reference/token-use
- Encabezados:
  - H2: Cómo se construye el prompt del sistema
  - H2: Qué cuenta en la ventana de contexto
  - H2: Cómo consultar el uso actual de tokens
  - H2: Estimación de costes (cuando se muestra)
  - H2: Impacto del TTL de la caché y de la poda
  - H3: Ejemplo: mantener activa la caché de 1h con Heartbeat
  - H3: Ejemplo: tráfico mixto con una estrategia de caché por agente
  - H3: Contexto de 1M de Anthropic
  - H2: Consejos para reducir la presión de tokens
  - H2: Contenido relacionado

## reference/transcript-hygiene.md

- Ruta: /reference/transcript-hygiene
- Encabezados:
  - H2: Regla global: el contexto del entorno de ejecución no es la transcripción del usuario
  - H2: Dónde se ejecuta
  - H2: Regla global: saneamiento de imágenes
  - H2: Regla global: llamadas a herramientas con formato incorrecto
  - H2: Regla global: turnos incompletos que solo contienen razonamiento
  - H2: Regla global: procedencia de entradas entre sesiones
  - H2: Matriz de proveedores (comportamiento actual)
  - H2: Comportamiento histórico (anterior a 2026.1.22)
  - H2: Contenido relacionado

## reference/wizard.md

- Ruta: /reference/wizard
- Encabezados:
  - H2: Detalles del flujo (modo local)
  - H2: Modo no interactivo
  - H3: Añadir agente (no interactivo)
  - H2: RPC del asistente de Gateway
  - H2: Configuración de Signal (signal-cli)
  - H2: Qué escribe el asistente
  - H2: Documentación relacionada

## releases/2026.6.11.md

- Ruta: /releases/2026.6.11
- Encabezados:
  - H1: Notas de la versión OpenClaw v2026.6.11 (2026-06-30)
  - H2: Aspectos destacados
  - H3: Fiabilidad de la entrega en canales
  - H3: Recuperación de proveedores y modelos
  - H3: Continuidad de sesiones, memoria y confianza
  - H3: Modo de retransmisión del enrutador de Slack
  - H3: Puente de activación del agente externo de Raft
  - H3: Instalación y reparación de plugins oficiales
  - H2: Canales y mensajería
  - H3: Correcciones adicionales de canales
  - H2: Gateway, seguridad y confianza
  - H3: Recuperación tras reinicios y de la disponibilidad
  - H3: Entrega remota de resultados y contenido multimedia
  - H2: Clientes e interfaces
  - H3: Envíos y reconexiones de clientes
  - H3: Correcciones de la interfaz, la configuración y la incorporación
  - H2: Documentación y herramientas de administración
  - H3: Fiabilidad de la configuración y los comandos
  - H3: Herramientas y trabajo programado

## releases/index.md

- Ruta: /releases
- Encabezados:
  - H1: Notas de la versión
  - H2: Versiones
  - H2: Historial sin procesar de versiones

## security/CONTRIBUTING-THREAT-MODEL.md

- Ruta: /security/CONTRIBUTING-THREAT-MODEL
- Encabezados:
  - H2: Formas de contribuir
  - H2: Referencia del marco
  - H2: Proceso de revisión
  - H2: Recursos
  - H2: Contacto
  - H2: Reconocimiento
  - H2: Contenido relacionado

## security/THREAT-MODEL-ATLAS.md

- Ruta: /security/THREAT-MODEL-ATLAS
- Encabezados:
  - H2: 1. Alcance
  - H2: 2. Arquitectura del sistema
  - H3: 2.1 Límites de confianza
  - H3: 2.2 Flujos de datos
  - H2: 3. Análisis de amenazas por táctica de ATLAS
  - H3: 3.1 Reconocimiento (AML.TA0002)
  - H4: T-RECON-001: Detección de endpoints del agente
  - H4: T-RECON-002: Sondeo de integraciones de canales
  - H3: 3.2 Acceso inicial (AML.TA0004)
  - H4: T-ACCESS-001: Interceptación del código de emparejamiento
  - H4: T-ACCESS-002: Suplantación de AllowFrom
  - H4: T-ACCESS-003: Robo de tokens
  - H3: 3.3 Ejecución (AML.TA0005)
  - H4: T-EXEC-001: Inyección directa de prompts
  - H4: T-EXEC-002: Inyección indirecta de prompts
  - H4: T-EXEC-003: Inyección de argumentos de herramientas
  - H4: T-EXEC-004: Omisión de la aprobación de ejecución
  - H3: 3.4 Persistencia (AML.TA0006)
  - H4: T-PERSIST-001: Instalación de Skills maliciosas
  - H4: T-PERSIST-002: Contaminación de actualizaciones de Skills
  - H4: T-PERSIST-003: Manipulación de la configuración del agente
  - H3: 3.5 Evasión de defensas (AML.TA0007)
  - H4: T-EVADE-001: Omisión de patrones de moderación
  - H4: T-EVADE-002: Escape de envoltorios de contenido
  - H3: 3.6 Descubrimiento (AML.TA0008)
  - H4: T-DISC-001: Enumeración de herramientas
  - H4: T-DISC-002: Extracción de datos de sesiones
  - H3: 3.7 Recopilación y exfiltración (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Robo de datos mediante webfetch
  - H4: T-EXFIL-002: Envío no autorizado de mensajes
  - H4: T-EXFIL-003: Obtención fraudulenta de credenciales
  - H3: 3.8 Impacto (AML.TA0011)
  - H4: T-IMPACT-001: Ejecución no autorizada de comandos
  - H4: T-IMPACT-002: Agotamiento de recursos (DoS)
  - H4: T-IMPACT-003: Daño reputacional
  - H2: 4. Análisis de la cadena de suministro de ClawHub
  - H3: 4.1 Controles de seguridad actuales
  - H3: 4.2 Limitaciones de la moderación
  - H3: 4.3 Insignias
  - H2: 5. Matriz de riesgos
  - H3: 5.1 Probabilidad frente a impacto
  - H3: 5.2 Cadenas de ataque de ruta crítica
  - H2: 6. Resumen de recomendaciones
  - H3: 6.1 Inmediatas (P0)
  - H3: 6.2 A corto plazo (P1)
  - H3: 6.3 A medio plazo (P2)
  - H2: 7. Apéndices
  - H3: 7.1 Correspondencia de técnicas de ATLAS
  - H3: 7.2 Archivos de seguridad clave
  - H3: 7.3 Glosario
  - H2: Contenido relacionado

## security/formal-verification.md

- Ruta: /security/formal-verification
- Encabezados:
  - H2: Qué es esto
  - H2: Dónde se encuentran los modelos
  - H2: Advertencias
  - H2: Reproducción de resultados
  - H2: Afirmaciones y objetivos
  - H3: Exposición del Gateway y configuración incorrecta de un Gateway abierto
  - H3: Canalización de ejecución de Node (capacidad de mayor riesgo)
  - H3: Almacén de emparejamientos (control de acceso a mensajes directos)
  - H3: Control de acceso de entrada (menciones y omisión de comandos de control)
  - H3: Enrutamiento y aislamiento de claves de sesión
  - H2: Modelos v1++: concurrencia, reintentos y corrección de trazas
  - H3: Concurrencia e idempotencia del almacén de emparejamientos
  - H3: Correlación e idempotencia de trazas de entrada
  - H3: Precedencia de dmScope en el enrutamiento e identityLinks
  - H2: Contenido relacionado

## security/incident-response.md

- Ruta: /security/incident-response
- Encabezados:
  - H2: 1. Detección y triaje
  - H2: 2. Gravedad
  - H2: 3. Respuesta
  - H2: 4. Comunicación y divulgación
  - H2: 5. Recuperación y seguimiento
  - H2: Contenido relacionado

## security/network-proxy.md

- Ruta: /security/network-proxy
- Encabezados:
  - H2: Configuración
  - H3: Endpoint de proxy HTTPS con una CA privada
  - H2: Cómo funciona el enrutamiento
  - H3: Modo de bucle invertido del Gateway
  - H3: Contenedores
  - H2: Términos relacionados con proxies
  - H2: Validación del proxy
  - H2: Destinos bloqueados recomendados
  - H2: Límites

## specs/codex-supervision.md

- Ruta: /specs/codex-supervision
- Encabezados:
  - H1: Supervisión de Codex
  - H2: Objetivo
  - H2: Límite del producto
  - H2: Responsabilidad
  - H2: Flujo del catálogo
  - H2: Límite de la CLI del operador
  - H2: Continuación local
  - H2: Comportamiento del archivo
  - H2: Seguridad de los hilos activos
  - H2: Límite de nodos emparejados
  - H2: Permisos
  - H2: Compatibilidad
  - H2: Trabajo futuro
  - H2: Pruebas de aceptación

## start/bootstrapping.md

- Ruta: /start/bootstrapping
- Encabezados:
  - H2: Qué sucede
  - H2: Ejecuciones de modelos integrados y locales
  - H2: Omisión de la inicialización
  - H2: Dónde se ejecuta
  - H2: Documentación relacionada

## start/docs-directory.md

- Ruta: /start/docs-directory
- Encabezados:
  - H2: Comience aquí
  - H2: Canales y experiencia de usuario
  - H2: Aplicaciones complementarias
  - H2: Operaciones y seguridad
  - H2: Contenido relacionado

## start/getting-started.md

- Ruta: /start/getting-started
- Encabezados:
  - H2: Qué se necesita
  - H2: Configuración rápida
  - H2: Qué hacer a continuación
  - H2: Contenido relacionado

## start/hubs.md

- Ruta: /start/hubs
- Encabezados:
  - H2: Comience aquí
  - H2: Instalación y actualizaciones
  - H2: Conceptos fundamentales
  - H2: Proveedores y entrada
  - H2: Gateway y operaciones
  - H2: Herramientas y automatización
  - H2: Nodos, contenido multimedia y voz
  - H2: Plataformas
  - H2: Aplicación complementaria para macOS (avanzado)
  - H2: Plugins
  - H2: Espacio de trabajo y plantillas
  - H2: Proyecto
  - H2: Pruebas y publicación
  - H2: Contenido relacionado

## start/lore.md

- Ruta: /start/lore
- Encabezados:
  - H1: La leyenda de OpenClaw 🦞📖
  - H2: La historia del origen
  - H2: La primera muda (27 de enero de 2026)
  - H2: El nombre
  - H2: Los Daleks contra las langostas
  - H2: Personajes principales
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: El Moltiverso
  - H2: Los grandes incidentes
  - H3: El volcado del directorio (3 de diciembre de 2025)
  - H3: La gran muda (27 de enero de 2026)
  - H3: La forma final (30 de enero de 2026)
  - H3: La juerga de compras del robot (3 de diciembre de 2025)
  - H2: Textos sagrados
  - H2: El credo de la langosta
  - H3: La saga de generación de iconos (27 de enero de 2026)
  - H2: El futuro
  - H2: Contenido relacionado

## start/onboarding-overview.md

- Ruta: /start/onboarding-overview
- Encabezados:
  - H2: ¿Qué ruta conviene usar?
  - H2: Qué configura la incorporación
  - H2: Incorporación mediante la CLI
  - H2: Incorporación mediante la aplicación de macOS
  - H2: Proveedores personalizados o no incluidos
  - H2: Contenido relacionado

## start/onboarding.md

- Ruta: /start/onboarding
- Encabezados:
  - H2: Contenido relacionado

## start/openclaw.md

- Ruta: /start/openclaw
- Encabezados:
  - H2: La seguridad ante todo
  - H2: Requisitos previos
  - H2: Configuración con dos teléfonos (recomendada)
  - H2: Inicio rápido en 5 minutos
  - H2: Proporcionar un espacio de trabajo al agente (AGENTS)
  - H2: La configuración que lo convierte en «un asistente»
  - H2: Sesiones y memoria
  - H2: Heartbeats (modo proactivo)
  - H2: Entrada y salida de contenido multimedia
  - H2: Lista de comprobación operativa
  - H2: Pasos siguientes
  - H2: Contenido relacionado

## start/quickstart.md

- Ruta: /start/quickstart
- Encabezados:
  - H2: Contenido relacionado

## start/setup.md

- Ruta: /start/setup
- Encabezados:
  - H2: Resumen
  - H2: Requisitos previos (desde el código fuente)
  - H2: Estrategia de personalización (para que las actualizaciones no causen problemas)
  - H2: Ejecutar el Gateway desde este repositorio
  - H2: Flujo de trabajo estable (primero la aplicación de macOS)
  - H2: Flujo de trabajo de última generación (Gateway en un terminal)
  - H3: 0) (Opcional) Ejecutar también la aplicación de macOS desde el código fuente
  - H3: 1) Iniciar el Gateway de desarrollo
  - H3: 2) Dirigir la aplicación de macOS al Gateway en ejecución
  - H3: 3) Verificar
  - H3: Errores comunes
  - H2: Mapa de almacenamiento de credenciales
  - H2: Actualización (sin estropear la configuración)
  - H2: Linux (servicio de usuario de systemd)
  - H2: Documentación relacionada

## start/showcase.md

- Ruta: /start/showcase
- Encabezados:
  - H2: Recién llegado de Discord
  - H2: Automatización y flujos de trabajo
  - H2: Conocimiento y memoria
  - H2: Voz y teléfono
  - H2: Infraestructura y despliegue
  - H2: Hogar y hardware
  - H2: Proyectos de la comunidad
  - H2: Envíe su proyecto
  - H2: Contenido relacionado

## start/wizard-cli-automation.md

- Ruta: /start/wizard-cli-automation
- Encabezados:
  - H2: Ejemplo básico no interactivo
  - H2: Ejemplos específicos de proveedores
  - H2: Añadir otro agente
  - H2: Documentación relacionada

## start/wizard-cli-reference.md

- Ruta: /start/wizard-cli-reference
- Encabezados:
  - H2: Qué hace el asistente
  - H2: Detalles del flujo local
  - H2: Detalles del modo remoto
  - H2: Opciones de autenticación y modelo
  - H2: Resultados y funcionamiento interno
  - H2: Configuración no interactiva
  - H2: RPC del asistente del Gateway
  - H2: Comportamiento de la configuración de Signal
  - H2: Documentación relacionada

## start/wizard.md

- Ruta: /start/wizard
- Encabezados:
  - H2: Configuración regional
  - H2: Opción guiada predeterminada
  - H2: Asistente clásico: inicio rápido frente a avanzado
  - H2: Qué configura la incorporación clásica
  - H2: Añadir otro agente
  - H2: Referencia completa
  - H2: Documentación relacionada

## tools/acp-agents-setup.md

- Ruta: /tools/acp-agents-setup
- Encabezados:
  - H2: Compatibilidad con el entorno de acpx (actual)
  - H2: Configuración obligatoria
  - H2: Configuración del Plugin para el backend de acpx
  - H3: Sondeo de inicio del entorno de ejecución de acpx
  - H3: Descarga automática del adaptador
  - H3: Puente MCP de herramientas del Plugin
  - H3: Puente MCP de herramientas de OpenClaw
  - H3: Configuración del tiempo de espera de las operaciones del entorno de ejecución
  - H3: Configuración del agente de sondeo de estado
  - H2: Configuración de permisos
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configuración
  - H2: Contenido relacionado

## tools/acp-agents.md

- Ruta: /tools/acp-agents
- Encabezados:
  - H2: ¿Qué página se necesita?
  - H2: ¿Funciona directamente?
  - H2: Destinos de entorno compatibles
  - H2: Manual de operaciones
  - H2: ACP frente a subagentes
  - H2: Cómo ejecuta ACP Claude Code
  - H2: Sesiones vinculadas
  - H3: Modelo mental
  - H3: Vinculaciones de la conversación actual
  - H2: Vinculaciones persistentes de canales
  - H3: Modelo de vinculación
  - H3: Valores predeterminados del entorno de ejecución por agente
  - H3: Ejemplo
  - H3: Comportamiento
  - H2: Iniciar sesiones de ACP
  - H3: Parámetros de sessionsspawn
  - H2: Modos de creación, vinculación e hilo
  - H2: Modelo de entrega
  - H2: Compatibilidad con el entorno aislado
  - H2: Resolución del destino de la sesión
  - H2: Controles de ACP
  - H3: Correspondencia de opciones del entorno de ejecución
  - H2: Entorno de acpx, configuración del Plugin y permisos
  - H2: Solución de problemas
  - H2: Contenido relacionado

## tools/agent-send.md

- Ruta: /tools/agent-send
- Encabezados:
  - H2: Inicio rápido
  - H2: Indicadores
  - H2: Comportamiento
  - H2: Ejemplos
  - H2: Contenido relacionado

## tools/apply-patch.md

- Ruta: /tools/apply-patch
- Encabezados:
  - H2: Parámetros
  - H2: Notas
  - H2: Ejemplo
  - H2: Contenido relacionado

## tools/brave-search.md

- Ruta: /tools/brave-search
- Encabezados:
  - H2: Obtener una clave de API
  - H2: Ejemplo de configuración
  - H2: Parámetros de la herramienta
  - H2: Notas
  - H2: Contenido relacionado

## tools/browser-control.md

- Ruta: /tools/browser-control
- Encabezados:
  - H2: API de control (opcional)
  - H3: Contrato de errores de /act
  - H3: Requisito de Playwright
  - H4: Instalación de Playwright en Docker
  - H2: Cómo funciona (internamente)
  - H2: Referencia rápida de la CLI
  - H2: Instantáneas y referencias
  - H2: Opciones avanzadas de espera
  - H2: Flujos de trabajo de depuración
  - H2: Salida JSON
  - H2: Controles de estado y entorno
  - H2: Seguridad y privacidad
  - H2: Contenido relacionado

## tools/browser-linux-troubleshooting.md

- Ruta: /tools/browser-linux-troubleshooting
- Encabezados:
  - H2: Problema: no se pudo iniciar Chrome CDP en el puerto 18800
  - H3: Causa raíz
  - H3: Solución 1: instalar Google Chrome (recomendada)
  - H3: Solución 2: usar Chromium mediante snap en modo de solo conexión
  - H3: Verificar que el navegador funciona
  - H3: Referencia de configuración
  - H3: Problema: no se encontraron pestañas de Chrome para profile="user"
  - H2: Contenido relacionado

## tools/browser-login.md

- Ruta: /tools/browser-login
- Encabezados:
  - H2: Inicio de sesión manual (recomendado)
  - H2: ¿Qué perfil de Chrome se utiliza?
  - H2: Aislamiento: permitir el acceso al navegador del host
  - H2: Contenido relacionado

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Ruta: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Encabezados:
  - H2: Elegir primero el modo de navegador adecuado
  - H3: Opción 1: CDP remoto directo desde WSL2 hacia Windows
  - H3: Opción 2: MCP de Chrome local en el host
  - H2: Arquitectura funcional
  - H2: Regla crítica para la interfaz de control
  - H2: Validar por capas
  - H3: Capa 1: verificar que Chrome proporciona CDP en Windows
  - H4: Diagnosticar IPv4 e IPv6 antes de cambiar portproxy
  - H3: Capa 2: verificar que WSL2 puede acceder a ese endpoint de Windows
  - H3: Capa 3: configurar el perfil de navegador correcto
  - H3: Capa 4: verificar por separado la capa de la interfaz de control
  - H3: Capa 5: verificar el control integral del navegador
  - H2: Errores engañosos comunes
  - H2: Lista de comprobación para un triaje rápido
  - H2: Contenido relacionado

## tools/browser.md

- Ruta: /tools/browser
- Encabezados:
  - H2: Qué se obtiene
  - H2: Inicio rápido
  - H2: Control del Plugin
  - H2: Orientación para el agente
  - H2: Comando o herramienta de navegador ausente
  - H2: Perfiles: openclaw, user, chrome
  - H2: Configuración
  - H3: Visión mediante capturas de pantalla (compatibilidad con modelos de solo texto)
  - H2: Usar Brave u otro navegador basado en Chromium
  - H2: Control local frente a remoto
  - H2: Proxy de navegador del Node (valor predeterminado sin configuración)
  - H2: Browserless (CDP remoto alojado)
  - H3: Docker de Browserless en el mismo host
  - H2: Proveedores directos de CDP mediante WebSocket
  - H3: Browserbase
  - H3: Notte
  - H2: Seguridad
  - H2: Perfiles (varios navegadores)
  - H2: Sesión existente mediante Chrome DevTools MCP
  - H3: Inicio personalizado de Chrome MCP
  - H2: Garantías de aislamiento
  - H2: Selección del navegador
  - H2: API de control (opcional)
  - H2: Solución de problemas
  - H3: Fallo de inicio de CDP frente a bloqueo SSRF de navegación
  - H2: Herramientas del agente y funcionamiento del control
  - H2: Contenido relacionado

## tools/btw.md

- Ruta: /tools/btw
- Encabezados:
  - H2: Qué hace
  - H2: Qué no hace
  - H2: Modelo de entrega
  - H2: Comportamiento de la interfaz
  - H2: Ventana emergente de selección (interfaz de control)
  - H2: Cuándo usarlo
  - H2: Contenido relacionado

## tools/capability-cookbook.md

- Ruta: /tools/capability-cookbook
- Encabezados:
  - H2: Contenido relacionado

## tools/chrome-extension.md

- Ruta: /tools/chrome-extension
- Encabezados:
  - H1: Extensión de Chrome
  - H2: Cómo funciona
  - H2: Instalar y emparejar
  - H2: Usarla
  - H2: Acceso remoto o entre máquinas
  - H2: Diagnóstico
  - H2: Modelo de seguridad

## tools/clawhub.md

- Ruta: /tools/clawhub
- Encabezados: ninguno

## tools/code-execution.md

- Ruta: /tools/code-execution
- Encabezados:
  - H2: Configuración
  - H2: Cómo usarlo
  - H2: Errores
  - H2: Contenido relacionado

## tools/creating-skills.md

- Ruta: /tools/creating-skills
- Encabezados:
  - H2: Crear la primera skill
  - H2: Referencia de SKILL.md
  - H3: Campos obligatorios
  - H3: Claves opcionales del frontmatter
  - H3: Uso de {baseDir}
  - H2: Añadir activación condicional
  - H2: Proponer mediante el taller de skills
  - H2: Publicar en ClawHub
  - H2: Prácticas recomendadas
  - H2: Contenido relacionado

## tools/diffs.md

- Ruta: /tools/diffs
- Encabezados:
  - H2: Inicio rápido
  - H2: Desactivar la orientación integrada del sistema
  - H2: Referencia de entrada de la herramienta
  - H2: Resaltado de sintaxis
  - H2: Contrato de detalles de salida
  - H3: Secciones sin cambios contraídas
  - H3: Navegación entre varios archivos
  - H2: Valores predeterminados del Plugin
  - H3: Configuración de URL persistente del visor
  - H2: Configuración de seguridad
  - H2: Ciclo de vida y almacenamiento de artefactos
  - H2: URL del visor y comportamiento de red
  - H2: Modelo de seguridad
  - H2: Requisitos del navegador para el modo de archivo
  - H2: Solución de problemas
  - H2: Orientación operativa
  - H2: Contenido relacionado

## tools/duckduckgo-search.md

- Ruta: /tools/duckduckgo-search
- Encabezados:
  - H2: Configuración
  - H2: Configuración
  - H2: Parámetros de la herramienta
  - H2: Notas
  - H2: Contenido relacionado

## tools/elevated.md

- Ruta: /tools/elevated
- Encabezados:
  - H2: Directivas
  - H2: Cómo funciona
  - H2: Orden de resolución
  - H2: Disponibilidad y listas de permitidos
  - H2: Qué no controla el modo elevado
  - H2: Contenido relacionado

## tools/exa-search.md

- Ruta: /tools/exa-search
- Encabezados:
  - H2: Instalar el Plugin
  - H2: Obtener una clave de API
  - H2: Configuración
  - H2: Sustitución de la URL base
  - H2: Parámetros de la herramienta
  - H3: Extracción de contenido
  - H3: Modos de búsqueda
  - H2: Notas
  - H2: Contenido relacionado

## tools/exec-approvals-advanced.md

- Ruta: /tools/exec-approvals-advanced
- Encabezados:
  - H2: Binarios seguros (solo stdin)
  - H3: Validación de argv y opciones denegadas
  - H3: Directorios de binarios de confianza
  - H3: Encadenamiento de shell, envoltorios y multiplexores
  - H3: Binarios seguros frente a lista de permitidos
  - H2: Comandos de intérprete o entorno de ejecución
  - H3: Comportamiento de entrega del seguimiento
  - H2: Reenvío de aprobaciones a canales de chat
  - H3: Reenvío de aprobaciones del Plugin
  - H3: Aprobaciones en el mismo chat en cualquier canal
  - H3: Entrega nativa de aprobaciones
  - H3: Aplicaciones móviles oficiales para operadores
  - H3: Flujo IPC de macOS
  - H2: Preguntas frecuentes
  - H3: ¿Cuándo se usarían accountId y threadId en un destino de aprobación?
  - H3: Cuando se envían aprobaciones a una sesión, ¿puede aprobarlas cualquier persona de esa sesión?
  - H2: Contenido relacionado

## tools/exec-approvals.md

- Ruta: /tools/exec-approvals
- Encabezados:
  - H2: Dónde se aplica
  - H3: Modelo de confianza
  - H3: División en macOS
  - H2: Inspección de la política efectiva
  - H2: Configuración y almacenamiento
  - H2: Controles de políticas
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modo YOLO (sin aprobación)
  - H3: Configuración persistente de «no preguntar nunca» en el host del Gateway
  - H3: Atajo local
  - H3: Host del Node
  - H3: Atajo solo para la sesión
  - H2: Lista de permitidos (por agente)
  - H3: Restricción de argumentos con argPattern
  - H2: Permitir automáticamente las CLI de las skills
  - H2: Binarios seguros y reenvío de aprobaciones
  - H2: Edición en la interfaz de control
  - H2: Flujo de aprobación
  - H2: Eventos del sistema y denegaciones
  - H2: Implicaciones
  - H2: Contenido relacionado

## tools/exec.md

- Ruta: /tools/exec
- Encabezados:
  - H2: Parámetros
  - H2: Configuración
  - H3: Modos
  - H3: Evaluación en línea (strictInlineEval)
  - H3: Gestión de PATH
  - H2: Sustituciones de la sesión (/exec)
  - H2: Aprobaciones de ejecución (aplicación complementaria/host del Node)
  - H2: Lista de permitidos y binarios seguros
  - H2: Ejemplos
  - H2: applypatch
  - H2: Contenido relacionado

## tools/firecrawl.md

- Ruta: /tools/firecrawl
- Encabezados:
  - H2: Instalar el Plugin
  - H2: webfetch sin clave y claves de API
  - H2: Configurar la búsqueda de Firecrawl
  - H2: Configurar Firecrawl como alternativa de webfetch
  - H3: Firecrawl autoalojado
  - H2: Herramientas del Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Sigilo y evasión de bots
  - H2: Cómo usa webfetch Firecrawl
  - H2: Contenido relacionado

## tools/gemini-search.md

- Ruta: /tools/gemini-search
- Encabezados:
  - H2: Obtener una clave de API
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Parámetros compatibles
  - H2: Selección del modelo
  - H2: Sustituciones de la URL base
  - H2: Contenido relacionado

## tools/goal.md

- Ruta: /tools/goal
- Encabezados:
  - H1: Objetivo
  - H2: Inicio rápido
  - H2: Para qué sirven los objetivos
  - H2: Referencia de comandos
  - H2: Estados
  - H2: Presupuestos de tokens
  - H2: Herramientas del modelo
  - H2: Contexto del objetivo en cada turno
  - H2: Interfaz de control
  - H2: TUI
  - H2: Comportamiento del canal
  - H2: Solución de problemas
  - H2: Contenido relacionado

## tools/grok-search.md

- Ruta: /tools/grok-search
- Encabezados:
  - H2: Incorporación y configuración
  - H2: Iniciar sesión u obtener una clave de API
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Parámetros compatibles
  - H2: Sustituciones de la URL base
  - H2: Contenido relacionado

## tools/image-generation.md

- Ruta: /tools/image-generation
- Encabezados:
  - H2: Inicio rápido
  - H2: Rutas comunes
  - H2: Proveedores compatibles
  - H2: Capacidades de los proveedores
  - H2: Parámetros de la herramienta
  - H2: Configuración
  - H3: Selección del modelo
  - H3: Orden de selección de proveedores
  - H3: Edición de imágenes
  - H2: Análisis detallados de proveedores
  - H2: Ejemplos
  - H2: Contenido relacionado

## tools/index.md

- Ruta: /tools
- Encabezados:
  - H2: Empezar aquí
  - H2: Elegir herramientas, skills o plugins
  - H2: Categorías de herramientas integradas
  - H2: Herramientas proporcionadas por plugins
  - H2: Configurar el acceso y las aprobaciones
  - H2: Ampliar las capacidades
  - H2: Solucionar problemas de herramientas ausentes
  - H2: Contenido relacionado

## tools/kimi-search.md

- Ruta: /tools/kimi-search
- Encabezados:
  - H2: Configuración
  - H2: Configuración
  - H2: Requisito de fundamentación
  - H2: Parámetros de la herramienta
  - H2: Contenido relacionado

## tools/llm-task.md

- Ruta: /tools/llm-task
- Encabezados:
  - H2: Habilitar
  - H2: Configuración (opcional)
  - H2: Parámetros de la herramienta
  - H2: Salida
  - H2: Ejemplo: paso de flujo de trabajo de Lobster
  - H3: Limitación importante
  - H2: Notas de seguridad
  - H2: Contenido relacionado

## tools/lobster.md

- Ruta: /tools/lobster
- Encabezados:
  - H2: Por qué
  - H2: Cómo funciona
  - H2: Habilitar
  - H2: Patrón: CLI pequeña, canalizaciones JSON y aprobaciones
  - H2: Pasos de LLM solo con JSON (llm-task)
  - H3: Limitación importante: Lobster integrado frente a openclaw.invoke
  - H2: Archivos de flujo de trabajo (.lobster)
  - H2: Parámetros de la herramienta
  - H3: run
  - H3: resume
  - H3: Modo de flujo de tareas administrado
  - H2: Envoltorio de salida
  - H2: Aprobaciones
  - H2: OpenProse
  - H2: Seguridad
  - H2: Solución de problemas
  - H2: Más información
  - H2: Caso práctico: flujos de trabajo de la comunidad
  - H2: Contenido relacionado

## tools/loop-detection.md

- Ruta: /tools/loop-detection
- Encabezados:
  - H2: Por qué existe
  - H2: Bloque de configuración
  - H3: Comportamiento de los campos
  - H2: Configuración recomendada
  - H2: Protección posterior a Compaction
  - H2: Registros y comportamiento esperado
  - H2: Contenido relacionado

## tools/media-overview.md

- Ruta: /tools/media-overview
- Encabezados:
  - H2: Capacidades
  - H2: Matriz de capacidades de proveedores
  - H2: Asíncrono frente a síncrono
  - H2: Conversión de voz a texto y llamada de voz
  - H2: Asignaciones de proveedores (cómo se distribuyen los proveedores entre interfaces)
  - H2: Contenido relacionado

## tools/minimax-search.md

- Ruta: /tools/minimax-search
- Encabezados:
  - H2: Obtener una credencial de Token Plan
  - H2: Configuración
  - H2: Selección de región
  - H2: Parámetros compatibles
  - H2: Contenido relacionado

## tools/multi-agent-sandbox-tools.md

- Ruta: /tools/multi-agent-sandbox-tools
- Encabezados:
  - H2: Ejemplos de configuración
  - H2: Precedencia de la configuración
  - H3: Configuración del entorno aislado
  - H3: Restricciones de herramientas
  - H2: Migración desde un solo agente
  - H2: Ejemplos de restricciones de herramientas
  - H2: Error común: "non-main"
  - H2: Pruebas
  - H2: Solución de problemas
  - H2: Contenido relacionado

## tools/music-generation.md

- Ruta: /tools/music-generation
- Encabezados:
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H3: Matriz de capacidades
  - H2: Parámetros de la herramienta
  - H2: Comportamiento asíncrono
  - H3: Ciclo de vida de la tarea
  - H2: Configuración
  - H3: Selección del modelo
  - H3: Orden de selección de proveedores
  - H2: Notas sobre los proveedores
  - H2: Elegir la ruta adecuada
  - H2: Modos de capacidad de los proveedores
  - H2: Pruebas en vivo
  - H2: Contenido relacionado

## tools/ollama-search.md

- Ruta: /tools/ollama-search
- Encabezados:
  - H2: Configuración
  - H2: Configuración
  - H2: Autenticación y enrutamiento de solicitudes
  - H2: Contenido relacionado

## tools/parallel-search.md

- Ruta: /tools/parallel-search
- Encabezados:
  - H2: Instalar el Plugin
  - H2: Clave de API (proveedor de pago)
  - H2: Configuración
  - H2: Sustitución de la URL base
  - H2: Parámetros de la herramienta
  - H2: Notas
  - H2: Contenido relacionado

## tools/pdf.md

- Ruta: /tools/pdf
- Encabezados:
  - H2: Disponibilidad
  - H2: Referencia de entrada
  - H2: Referencias PDF compatibles
  - H2: Modos de ejecución
  - H3: Modo nativo del proveedor
  - H3: Modo alternativo de extracción
  - H2: Configuración
  - H2: Detalles de salida
  - H2: Comportamiento ante errores
  - H2: Ejemplos
  - H2: Contenido relacionado

## tools/permission-modes.md

- Ruta: /tools/permission-modes
- Encabezados:
  - H2: Valor predeterminado recomendado
  - H2: Modos de ejecución del host de OpenClaw
  - H2: Asignación de Codex Guardian
  - H2: Permisos del entorno de ACPX
  - H2: Elegir un modo
  - H2: Contenido relacionado

## tools/perplexity-search.md

- Ruta: /tools/perplexity-search
- Encabezados:
  - H2: Instalar el Plugin
  - H2: Obtener una clave de API de Perplexity
  - H2: Compatibilidad con OpenRouter
  - H2: Ejemplos de configuración
  - H3: API nativa de Perplexity Search
  - H3: Compatibilidad con OpenRouter/Sonar
  - H2: Dónde establecer la clave
  - H2: Parámetros de la herramienta
  - H3: Reglas de filtrado de dominios
  - H2: Notas
  - H2: Contenido relacionado

## tools/plugin.md

- Ruta: /tools/plugin
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Configuración
  - H3: Elegir una fuente de instalación
  - H3: Política de instalación del operador
  - H3: Configurar la política del Plugin
  - H2: Comprender los formatos de plugins
  - H2: Hooks de plugins
  - H2: Verificar el Gateway activo
  - H2: Solución de problemas
  - H3: Propiedad de la ruta del Plugin bloqueada
  - H3: Configuración lenta de herramientas del Plugin
  - H2: Contenido relacionado

## tools/reactions.md

- Ruta: /tools/reactions
- Encabezados:
  - H2: Cómo funciona
  - H2: Comportamiento del canal
  - H2: Nivel de reacción
  - H2: Contenido relacionado

## tools/searxng-search.md

- Ruta: /tools/searxng-search
- Encabezados:
  - H2: Configuración
  - H2: Configuración
  - H2: Variable de entorno
  - H2: Referencia de configuración del Plugin
  - H2: Notas
  - H2: Contenido relacionado

## tools/show-widget.md

- Ruta: /tools/show-widget
- Encabezados:
  - H2: Usar la herramienta
  - H2: Seguridad y almacenamiento
  - H2: Contenido relacionado

## tools/skill-workshop.md

- Ruta: /tools/skill-workshop
- Encabezados:
  - H2: Cómo funciona
  - H2: Ciclo de vida
  - H2: Curación del ciclo de vida
  - H2: Chat
  - H3: Aprender del trabajo reciente
  - H2: CLI
  - H2: Contenido de la propuesta
  - H2: Archivos auxiliares
  - H2: Herramienta del agente
  - H2: Skills sugeridas
  - H2: Aprobación y autonomía
  - H2: Métodos del Gateway
  - H2: Almacenamiento
  - H2: Límites
  - H2: Solución de problemas
  - H3: Diagnóstico de políticas de herramientas
  - H2: Contenido relacionado

## tools/skills-config.md

- Ruta: /tools/skills-config
- Encabezados:
  - H2: Carga (skills.load)
  - H2: Instalación (skills.install)
  - H2: Política de instalación del operador (security.installPolicy)
  - H2: Lista de permitidas de Skills incluidas
  - H2: Entradas por Skill (skills.entries)
  - H2: Listas de permitidas de agentes (agents)
  - H2: Taller (skills.workshop)
  - H2: Raíces de Skills con enlaces simbólicos
  - H2: Skills en entorno aislado y variables de entorno
  - H2: Recordatorio del orden de carga
  - H2: Contenido relacionado

## tools/skills.md

- Ruta: /tools/skills
- Encabezados:
  - H2: Orden de carga
  - H2: Skills alojadas en Node
  - H2: Skills por agente frente a compartidas
  - H2: Listas de permitidas de agentes
  - H2: Plugins y Skills
  - H2: Taller de Skills
  - H2: Instalación desde ClawHub
  - H2: Seguridad
  - H2: Formato de SKILL.md
  - H3: Claves opcionales del frontmatter
  - H2: Control de acceso
  - H3: Especificaciones del instalador
  - H2: Anulaciones de configuración
  - H2: Inyección de entorno
  - H2: Instantáneas y actualización
  - H2: Impacto en los tokens
  - H2: Contenido relacionado

## tools/slash-commands.md

- Ruta: /tools/slash-commands
- Encabezados:
  - H2: Tres tipos de comandos
  - H2: Configuración
  - H2: Lista de comandos
  - H3: Comandos principales
  - H3: Comandos del panel acoplable
  - H3: Comandos de Plugins incluidos
  - H3: Comandos de Skills
  - H2: /tools: qué puede usar ahora el agente
  - H2: /model: selección del modelo
  - H2: /config: escrituras de configuración en disco
  - H2: /mcp: configuración del servidor MCP
  - H2: /debug: anulaciones solo en tiempo de ejecución
  - H2: /plugins: gestión de Plugins
  - H2: /trace: salida de seguimiento de Plugins
  - H2: /btw: preguntas secundarias
  - H2: Notas sobre las superficies
  - H2: Uso y estado del proveedor
  - H2: Contenido relacionado

## tools/steer.md

- Ruta: /tools/steer
- Encabezados:
  - H2: Sesión actual
  - H2: Dirección frente a cola
  - H2: Subagentes
  - H2: Sesiones de ACP
  - H2: Contenido relacionado

## tools/subagents.md

- Ruta: /tools/subagents
- Encabezados:
  - H2: Comando con barra diagonal
  - H3: Controles de vinculación de hilos
  - H3: Comportamiento de creación
  - H2: Modos de contexto
  - H2: Herramienta: sessionsspawn
  - H3: Modo de solicitud de delegación
  - H3: Parámetros de la herramienta
  - H3: Nombres y selección de destino de las tareas
  - H2: Herramienta: sessionsyield
  - H2: Herramienta: subagents
  - H2: Sesiones vinculadas a hilos
  - H3: Canales compatibles con hilos
  - H3: Flujo rápido
  - H3: Controles manuales
  - H3: Conmutadores de configuración
  - H3: Lista de permitidos
  - H3: Descubrimiento
  - H3: Archivado automático
  - H2: Subagentes anidados
  - H3: Niveles de profundidad
  - H3: Cadena de anuncios
  - H3: Política de herramientas por profundidad
  - H3: Límite de creación por agente
  - H3: Detención en cascada
  - H2: Autenticación
  - H2: Anuncio
  - H3: Contexto del anuncio
  - H3: Línea de estadísticas
  - H3: Por qué se prefiere sessionshistory
  - H2: Política de herramientas
  - H3: Anulación mediante configuración
  - H2: Concurrencia
  - H2: Disponibilidad y recuperación
  - H2: Detención
  - H2: Limitaciones
  - H2: Contenido relacionado

## tools/tavily.md

- Ruta: /tools/tavily
- Encabezados:
  - H2: Primeros pasos
  - H2: Referencia de herramientas
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Elección de la herramienta adecuada
  - H2: Configuración avanzada
  - H2: Contenido relacionado

## tools/thinking.md

- Ruta: /tools/thinking
- Encabezados:
  - H2: Qué hace
  - H2: Orden de resolución
  - H2: Configuración de un valor predeterminado para la sesión
  - H2: Aplicación por agente
  - H2: Modo rápido (/fast)
  - H2: Directivas detalladas (/verbose o /v)
  - H2: Directivas de seguimiento de Plugins (/trace)
  - H2: Visibilidad del razonamiento (/reasoning)
  - H2: Contenido relacionado
  - H2: Heartbeats
  - H2: Interfaz de chat web
  - H2: Perfiles de proveedores

## tools/tokenjuice.md

- Ruta: /tools/tokenjuice
- Encabezados:
  - H2: Activar el Plugin
  - H2: Qué cambia Tokenjuice
  - H2: Verificar que funciona
  - H2: Desactivar el Plugin
  - H2: Contenido relacionado

## tools/tool-search.md

- Ruta: /tools/tool-search
- Encabezados:
  - H2: Cómo se ejecuta un turno
  - H2: Modos
  - H2: Por qué existe
  - H2: API
  - H2: Límite del entorno de ejecución
  - H2: Configuración
  - H2: Prompt y telemetría
  - H2: Validación E2E
  - H2: Comportamiento ante fallos
  - H2: Contenido relacionado

## tools/trajectory.md

- Ruta: /tools/trajectory
- Encabezados:
  - H2: Inicio rápido
  - H2: Acceso
  - H2: Qué se registra
  - H2: Archivos del paquete
  - H2: Almacenamiento de capturas
  - H2: Desactivar la captura
  - H2: Ajustar el tiempo de espera de vaciado
  - H2: Privacidad y límites
  - H2: Solución de problemas
  - H2: Contenido relacionado

## tools/tts.md

- Ruta: /tools/tts
- Encabezados:
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H2: Configuración
  - H3: Anulaciones de voz por agente
  - H2: Personas
  - H3: Persona mínima
  - H3: Persona completa (prompt independiente del proveedor)
  - H3: Resolución de personas
  - H3: Cómo usan los proveedores los prompts de persona
  - H3: Política de respaldo
  - H2: Directivas controladas por el modelo
  - H2: Comandos con barra diagonal
  - H2: Preferencias por usuario
  - H2: Formatos de salida
  - H2: Comportamiento de TTS automático
  - H2: Referencia de campos
  - H2: Herramienta del agente
  - H2: RPC del Gateway
  - H2: Enlaces de servicio
  - H2: Contenido relacionado

## tools/video-generation.md

- Ruta: /tools/video-generation
- Encabezados:
  - H2: Inicio rápido
  - H2: Cómo funciona la generación asíncrona
  - H3: Ciclo de vida de las tareas
  - H2: Proveedores compatibles
  - H3: Matriz de capacidades
  - H2: Parámetros de la herramienta
  - H3: Obligatorios
  - H3: Entradas de contenido
  - H3: Controles de estilo
  - H3: Opciones avanzadas
  - H4: Respaldo y opciones tipadas
  - H2: Acciones
  - H2: Selección del modelo
  - H2: Notas de los proveedores
  - H2: Modos de capacidad de los proveedores
  - H2: Pruebas en vivo
  - H2: Configuración
  - H2: Contenido relacionado

## tools/web-fetch.md

- Ruta: /tools/web-fetch
- Encabezados:
  - H2: Inicio rápido
  - H2: Parámetros de la herramienta
  - H2: Cómo funciona
  - H2: Actualizaciones de progreso
  - H2: Configuración
  - H2: Respaldo de Firecrawl
  - H2: Proxy de entorno de confianza
  - H2: Límites y seguridad
  - H2: Perfiles de herramientas
  - H2: Contenido relacionado

## tools/web.md

- Ruta: /tools/web
- Encabezados:
  - H2: Inicio rápido
  - H2: Elección de un proveedor
  - H3: Comparación de proveedores
  - H2: Detección automática
  - H2: Búsqueda web nativa de OpenAI
  - H2: Búsqueda web nativa de Codex
  - H2: Seguridad de red
  - H2: Configuración
  - H3: Almacenamiento de claves de API
  - H2: Parámetros de la herramienta
  - H2: xsearch
  - H3: Configuración de xsearch
  - H3: Parámetros de xsearch
  - H3: Ejemplo de xsearch
  - H2: Ejemplos
  - H2: Perfiles de herramientas
  - H2: Contenido relacionado

## tts.md

- Ruta: /tts
- Encabezados:
  - H2: Contenido relacionado

## vps.md

- Ruta: /vps
- Encabezados:
  - H2: Elección de un proveedor
  - H2: Cómo funcionan las configuraciones en la nube
  - H2: Proteger primero el acceso administrativo
  - H2: Agente empresarial compartido en un VPS
  - H2: Uso de Nodes con un VPS
  - H2: Ajuste del inicio para máquinas virtuales pequeñas y hosts ARM
  - H3: Lista de comprobación para ajustar systemd (opcional)
  - H2: Contenido relacionado

## web/control-ui.md

- Ruta: /web/control-ui
- Encabezados:
  - H2: Apertura rápida (local)
  - H2: Emparejamiento de dispositivos (primera conexión)
  - H2: Emparejar un dispositivo móvil
  - H2: Identidad personal (local al navegador)
  - H2: Endpoint de configuración del entorno de ejecución
  - H2: Estado del host del Gateway
  - H2: Compatibilidad de idiomas
  - H2: Temas de apariencia
  - H2: Gestionar Plugins
  - H2: Navegación de la barra lateral
  - H2: Página de nueva sesión
  - H2: Qué puede hacer (actualmente)
  - H2: Página de MCP
  - H2: Pestaña de actividad
  - H2: Terminal del operador
  - H2: Panel del navegador
  - H2: Comportamiento del chat
  - H2: Pérdida de conexión y reconexión
  - H2: Instalación de PWA y notificaciones web push
  - H2: Contenido incrustado alojado
  - H2: Ancho de los mensajes del chat
  - H2: Acceso a la red de Tailscale (recomendado)
  - H2: HTTP no seguro
  - H2: Política de seguridad de contenido
  - H2: Autenticación de la ruta de avatares
  - H2: Autenticación de la ruta de contenido multimedia del asistente
  - H2: Enlaces de aprobación
  - H2: Página en blanco de la interfaz de control
  - H2: Depuración y pruebas: servidor de desarrollo + Gateway remoto
  - H2: Contenido relacionado

## web/dashboard.md

- Ruta: /web/dashboard
- Encabezados:
  - H2: Vía rápida (recomendada)
  - H2: Conceptos básicos de autenticación (local frente a remota)
  - H2: Abrir en Telegram
  - H2: Si aparece "unauthorized" / 1008
  - H2: Contenido relacionado

## web/index.md

- Ruta: /web
- Encabezados:
  - H2: Configuración (activada de forma predeterminada)
  - H2: Webhooks
  - H2: RPC HTTP de administración
  - H2: Acceso mediante Tailscale
  - H2: Notas de seguridad
  - H2: Compilación de la interfaz

## web/lobster.md

- Ruta: /web/lobster
- Encabezados:
  - H2: Qué se muestra
  - H2: Cuándo aparece
  - H2: Qué se puede hacer
  - H2: Desactivar las visitas (o volver a activarlas)
  - H2: El Lobsterdex
  - H2: Notas de campo
  - H2: Privacidad

## web/tui.md

- Ruta: /web/tui
- Encabezados:
  - H2: Inicio rápido
  - H3: Modo Gateway
  - H3: Modo local
  - H2: Qué se muestra
  - H2: Modelo mental: agentes + sesiones
  - H2: Envío + entrega
  - H2: Selectores + superposiciones
  - H2: Atajos de teclado
  - H2: Comandos con barra diagonal
  - H2: Comandos del shell local
  - H2: Asistente de configuración y reparación de Crestodian
  - H2: Salida de herramientas
  - H2: Colores del terminal
  - H2: Historial + transmisión
  - H2: Detalles de conexión
  - H2: Opciones
  - H2: Solución de problemas
  - H2: Solución de problemas de conexión
  - H2: Contenido relacionado

## web/webchat.md

- Ruta: /web/webchat
- Encabezados:
  - H2: Qué es
  - H2: Inicio rápido
  - H2: Cómo funciona
  - H3: Modelo de transcripción y entrega
  - H2: Panel de herramientas de agentes de la interfaz de control
  - H2: Uso remoto
  - H2: Referencia de configuración (WebChat)
  - H2: Contenido relacionado

## web/workspaces.md

- Ruta: /web/workspaces
- Encabezados:
  - H2: Activar espacios de trabajo
  - H2: Espacio de trabajo predeterminado
  - H2: Widgets integrados
  - H2: Procedencia
  - H2: Widgets personalizados
  - H2: CLI
  - H2: Almacenamiento
