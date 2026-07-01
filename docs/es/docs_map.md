---
read_when: Finding which docs page covers a topic before reading the page
summary: Mapa de encabezados generado para las páginas de documentación de OpenClaw
title: Mapa de la documentación
x-i18n:
    generated_at: "2026-07-01T07:51:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4432132487530461411880c0d073c223e02b550cb2deb874fae2f7cfe737888
    source_path: docs_map.md
    workflow: 16
---

# Mapa de documentación de OpenClaw

Este archivo se genera a partir de los encabezados de `docs/**/*.md` y `docs/**/*.mdx` para ayudar a los agentes a navegar el árbol de documentación.
No lo edites a mano; ejecuta `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Ruta: /agent-runtime-architecture
- Encabezados:
  - H2: Disposición del runtime
  - H2: Límites
  - H2: Manifiestos
  - H2: Selección del runtime
  - H2: Relacionado

## announcements/bluebubbles-imessage.md

- Ruta: /announcements/bluebubbles-imessage
- Encabezados:
  - H1: Eliminación de BlueBubbles y la ruta de iMessage con imsg
  - H2: Qué cambió
  - H2: Qué hacer
  - H2: Notas de migración
  - H2: Ver también

## auth-credential-semantics.md

- Ruta: /auth-credential-semantics
- Encabezados:
  - H2: Códigos estables de motivo de sondeo
  - H2: Credenciales de token
  - H3: Reglas de elegibilidad
  - H3: Reglas de resolución
  - H2: Portabilidad de copias de agente
  - H2: Rutas de autenticación solo por configuración
  - H2: Filtrado explícito del orden de autenticación
  - H2: Resolución del destino de sondeo
  - H2: Descubrimiento de credenciales de CLI externa
  - H2: Guarda de política OAuth SecretRef
  - H2: Mensajería compatible con legado
  - H2: Relacionado

## automation/auth-monitoring.md

- Ruta: /automation/auth-monitoring
- Encabezados:
  - H2: Relacionado

## automation/clawflow.md

- Ruta: /automation/clawflow
- Encabezados:
  - H2: Relacionado

## automation/cron-jobs.md

- Ruta: /automation/cron-jobs
- Encabezados:
  - H2: Inicio rápido
  - H2: Cómo funciona Cron
  - H2: Tipos de programación
  - H3: Día del mes y día de la semana usan lógica OR
  - H2: Estilos de ejecución
  - H3: Cargas de comando
  - H3: Opciones de carga para trabajos aislados
  - H2: Entrega y salida
  - H2: Idioma de salida
  - H2: Ejemplos de CLI
  - H2: Webhooks
  - H3: Autenticación
  - H2: Integración con Gmail PubSub
  - H3: Configuración con asistente (recomendada)
  - H3: Inicio automático de Gateway
  - H3: Configuración manual de una sola vez
  - H3: Sobrescritura del modelo de Gmail
  - H2: Gestión de trabajos
  - H2: Configuración
  - H2: Solución de problemas
  - H3: Escalera de comandos
  - H2: Relacionado

## automation/cron-vs-heartbeat.md

- Ruta: /automation/cron-vs-heartbeat
- Encabezados:
  - H2: Relacionado

## automation/gmail-pubsub.md

- Ruta: /automation/gmail-pubsub
- Encabezados:
  - H2: Relacionado

## automation/hooks.md

- Ruta: /automation/hooks
- Encabezados:
  - H2: Elige la superficie adecuada
  - H2: Inicio rápido
  - H2: Tipos de evento
  - H2: Escritura de hooks
  - H3: Estructura de hook
  - H3: Formato HOOK.md
  - H3: Implementación del controlador
  - H3: Aspectos destacados del contexto de evento
  - H2: Descubrimiento de hooks
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
  - H2: Mejores prácticas
  - H2: Solución de problemas
  - H3: Hook no descubierto
  - H3: Hook no elegible
  - H3: Hook no se ejecuta
  - H2: Relacionado

## automation/index.md

- Ruta: /automation
- Encabezados:
  - H2: Guía rápida de decisión
  - H3: Tareas programadas (Cron) frente a Heartbeat
  - H2: Conceptos principales
  - H3: Tareas programadas (Cron)
  - H3: Tareas
  - H3: Compromisos inferidos
  - H3: TaskFlow
  - H3: Órdenes permanentes
  - H3: Hooks
  - H3: Heartbeat
  - H2: Cómo funcionan juntos
  - H2: Relacionado

## automation/poll.md

- Ruta: /automation/poll
- Encabezados:
  - H2: Relacionado

## automation/standing-orders.md

- Ruta: /automation/standing-orders
- Encabezados:
  - H2: Por qué usar órdenes permanentes
  - H2: Cómo funcionan
  - H2: Anatomía de una orden permanente
  - H2: Órdenes permanentes más trabajos Cron
  - H2: Ejemplos
  - H3: Ejemplo 1: contenido y redes sociales (ciclo semanal)
  - H3: Ejemplo 2: operaciones financieras (activadas por evento)
  - H3: Ejemplo 3: monitoreo y alertas (continuo)
  - H2: Patrón ejecutar-verificar-informar
  - H2: Arquitectura multiprograma
  - H2: Mejores prácticas
  - H3: Haz
  - H3: Evita
  - H2: Relacionado

## automation/taskflow.md

- Ruta: /automation/taskflow
- Encabezados:
  - H2: Cuándo usar TaskFlow
  - H2: Patrón fiable de flujo de trabajo programado
  - H2: Modos de sincronización
  - H3: Modo gestionado
  - H3: Modo reflejado
  - H2: Estado duradero y seguimiento de revisión
  - H2: Comportamiento de cancelación
  - H2: Comandos de CLI
  - H2: Cómo se relacionan los flujos con las tareas
  - H2: Relacionado

## automation/tasks.md

- Ruta: /automation/tasks
- Encabezados:
  - H2: TL;DR
  - H2: Inicio rápido
  - H2: Qué crea una tarea
  - H2: Ciclo de vida de una tarea
  - H2: Entrega y notificaciones
  - H3: Políticas de notificación
  - H2: Referencia de CLI
  - H2: Tablero de tareas de chat (/tasks)
  - H2: Integración de estado (presión de tareas)
  - H2: Almacenamiento y mantenimiento
  - H3: Dónde viven las tareas
  - H3: Mantenimiento automático
  - H2: Cómo se relacionan las tareas con otros sistemas
  - H2: Relacionado

## automation/troubleshooting.md

- Ruta: /automation/troubleshooting
- Encabezados:
  - H2: Relacionado

## automation/webhook.md

- Ruta: /automation/webhook
- Encabezados:
  - H2: Relacionado

## brave-search.md

- Ruta: /brave-search
- Encabezados:
  - H2: Relacionado

## channels/access-groups.md

- Ruta: /channels/access-groups
- Encabezados:
  - H2: Grupos estáticos de remitentes de mensajes
  - H2: Grupos de referencia desde listas de permitidos
  - H2: Rutas admitidas de canales de mensajes
  - H2: Diagnósticos de Plugin
  - H2: Audiencias de canales de Discord
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
  - H2: Modos de respuesta visibles
  - H2: Historial
  - H2: Solución de problemas
  - H2: Relacionado

## channels/bot-loop-protection.md

- Ruta: /channels/bot-loop-protection
- Encabezados:
  - H1: Protección contra bucles de bot
  - H2: Valores predeterminados
  - H2: Configurar valores predeterminados compartidos
  - H2: Sobrescribir por canal o cuenta
  - H2: Compatibilidad de canales

## channels/broadcast-groups.md

- Ruta: /channels/broadcast-groups
- Encabezados:
  - H2: Resumen
  - H2: Casos de uso
  - H2: Configuración
  - H3: Configuración básica
  - H3: Estrategia de procesamiento
  - H3: Ejemplo completo
  - H2: Cómo funciona
  - H3: Flujo de mensajes
  - H3: Aislamiento de sesión
  - H3: Ejemplo: sesiones aisladas
  - H2: Mejores prácticas
  - H2: Compatibilidad
  - H3: Proveedores
  - H3: Enrutamiento
  - H2: Solución de problemas
  - H2: Ejemplos
  - H2: Referencia de API
  - H3: Esquema de configuración
  - H3: Campos
  - H2: Limitaciones
  - H2: Mejoras futuras
  - H2: Relacionado

## channels/channel-routing.md

- Ruta: /channels/channel-routing
- Encabezados:
  - H1: Canales y enrutamiento
  - H2: Términos clave
  - H2: Prefijos de destino saliente
  - H2: Formas de clave de sesión (ejemplos)
  - H2: Fijación de la ruta de DM principal
  - H2: Registro entrante protegido
  - H2: Reglas de enrutamiento (cómo se elige un agente)
  - H2: Grupos de difusión (ejecutar varios agentes)
  - H2: Resumen de configuración
  - H2: Almacenamiento de sesión
  - H2: Comportamiento de WebChat
  - H2: Contexto de respuesta
  - H2: Relacionado

## channels/clickclack.md

- Ruta: /channels/clickclack
- Encabezados:
  - H2: Configuración rápida
  - H2: Varios bots
  - H2: Destinos
  - H2: Permisos
  - H2: Solución de problemas

## channels/discord.md

- Ruta: /channels/discord
- Encabezados:
  - H2: Configuración rápida
  - H2: Recomendado: configura un espacio de trabajo de guild
  - H2: Modelo de runtime
  - H2: Canales de foro
  - H2: Componentes interactivos
  - H2: Control de acceso y enrutamiento
  - H3: Enrutamiento de agentes basado en roles
  - H2: Comandos nativos y autenticación de comandos
  - H2: Detalles de funciones
  - H2: Herramientas y compuertas de acción
  - H2: Interfaz de usuario de Components v2
  - H2: Voz
  - H3: Canales de voz
  - H3: Seguir usuarios en voz
  - H3: Mensajes de voz
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Seguridad y operaciones
  - H2: Relacionado

## channels/feishu.md

- Ruta: /channels/feishu
- Encabezados:
  - H2: Inicio rápido
  - H2: Control de acceso
  - H3: Mensajes directos
  - H3: Chats de grupo
  - H2: Ejemplos de configuración de grupo
  - H3: Permitir todos los grupos, no se requiere @mención
  - H3: Permitir todos los grupos, aún requerir @mención
  - H3: Permitir solo grupos específicos
  - H3: Restringir remitentes dentro de un grupo
  - H2: Obtener ID de grupo/usuario
  - H3: ID de grupo (chatid, formato: ocxxx)
  - H3: ID de usuario (openid, formato: ouxxx)
  - H2: Comandos comunes
  - H2: Solución de problemas
  - H3: El bot no responde en chats de grupo
  - H3: El bot no recibe mensajes
  - H3: La configuración con QR no reacciona en la app móvil de Feishu
  - H3: App Secret filtrado
  - H2: Configuración avanzada
  - H3: Varias cuentas
  - H3: Límites de mensajes
  - H3: Streaming
  - H3: Optimización de cuota
  - H3: Sesiones ACP
  - H4: Vinculación ACP persistente
  - H4: Generar ACP desde el chat
  - H3: Enrutamiento multiagente
  - H2: Aislamiento de agente por usuario (creación dinámica de agentes)
  - H3: Configuración rápida
  - H3: Cómo funciona
  - H3: Opciones de configuración
  - H3: Alcance de sesión
  - H3: Despliegue multiusuario típico
  - H3: Verificación
  - H3: Notas
  - H2: Referencia de configuración
  - H2: Tipos de mensaje admitidos
  - H3: Recibir
  - H3: Enviar
  - H3: Hilos y respuestas
  - H2: Relacionado

## channels/googlechat.md

- Ruta: /channels/googlechat
- Encabezados:
  - H2: Instalar
  - H2: Configuración rápida (principiante)
  - H2: Agregar a Google Chat
  - H2: URL pública (solo Webhook)
  - H3: Opción A: Tailscale Funnel (recomendado)
  - H3: Opción B: proxy inverso (Caddy)
  - H3: Opción C: Cloudflare Tunnel
  - H2: Cómo funciona
  - H2: Destinos
  - H2: Aspectos destacados de configuración
  - H2: Solución de problemas
  - H3: 405 Method Not Allowed
  - H3: Otros problemas
  - H2: Relacionado

## channels/group-messages.md

- Ruta: /channels/group-messages
- Encabezados:
  - H2: Comportamiento
  - H2: Ejemplo de configuración (WhatsApp)
  - H3: Comando de activación (solo propietario)
  - H2: Cómo usar
  - H2: Pruebas / verificación
  - H2: Consideraciones conocidas
  - H2: Relacionado

## channels/groups.md

- Ruta: /channels/groups
- Encabezados:
  - H2: Introducción para principiantes (2 minutos)
  - H2: Respuestas visibles
  - H2: Visibilidad de contexto y listas de permitidos
  - H2: Claves de sesión
  - H2: Patrón: DM personales + grupos públicos (un solo agente)
  - H2: Etiquetas de visualización
  - H2: Política de grupo
  - H2: Compuerta de menciones (predeterminada)
  - H2: Delimitar patrones de mención configurados
  - H2: Restricciones de herramientas por grupo/canal (opcional)
  - H2: Listas de permitidos de grupos
  - H2: Activación (solo propietario)
  - H2: Campos de contexto
  - H2: Específicos de iMessage
  - H2: Prompts de sistema de WhatsApp
  - H2: Específicos de WhatsApp
  - H2: Relacionado

## channels/imessage-from-bluebubbles.md

- Ruta: /channels/imessage-from-bluebubbles
- Encabezados:
  - H2: Lista de verificación de migración
  - H2: Cuándo tiene sentido esta migración
  - H2: Qué hace imsg
  - H2: Antes de empezar
  - H2: Traducción de configuración
  - H2: Trampa del registro de grupos
  - H2: Paso a paso
  - H2: Paridad de acciones de un vistazo
  - H2: Emparejamiento, sesiones y vinculaciones ACP
  - H2: Sin canal de reversión
  - H2: Relacionado

## channels/imessage.md

- Ruta: /channels/imessage
- Encabezados:
  - H2: Configuración rápida
  - H2: Requisitos y permisos (macOS)
  - H2: Habilitar la API privada de imsg
  - H3: Configuración
  - H3: Cuando no puedes desactivar SIP
  - H2: Control de acceso y enrutamiento
  - H2: Vinculaciones de conversación ACP
  - H2: Patrones de despliegue
  - H2: Multimedia, fragmentación y destinos de entrega
  - H2: Acciones de API privada
  - H2: Escrituras de configuración
  - H2: Agrupación de DM de envío dividido (comando + URL en una composición)
  - H3: Escenarios y lo que ve el agente
  - H2: Recuperación entrante tras reiniciar un puente o Gateway
  - H3: Señal visible para el operador
  - H3: Migración
  - H2: Solución de problemas
  - H2: Punteros de referencia de configuración
  - H2: Relacionado

## channels/index.md

- Ruta: /channels
- Encabezados:
  - H2: Notas de entrega
  - H2: Canales admitidos
  - H2: Notas

## channels/irc.md

- Ruta: /channels/irc
- Encabezados:
  - H2: Inicio rápido
  - H2: Valores predeterminados de seguridad
  - H2: Control de acceso
  - H3: Error común: allowFrom es para DM, no para canales
  - H2: Activación de respuestas (menciones)
  - H2: Nota de seguridad (recomendado para canales públicos)
  - H3: Las mismas herramientas para todos en el canal
  - H3: Herramientas diferentes por remitente (el propietario obtiene más poder)
  - H2: NickServ
  - H2: Variables de entorno
  - H2: Solución de problemas
  - H2: Relacionado

## channels/line.md

- Ruta: /channels/line
- Encabezados:
  - H2: Instalación
  - H2: Configuración
  - H2: Configurar
  - H2: Control de acceso
  - H2: Comportamiento de mensajes
  - H2: Datos del canal (mensajes enriquecidos)
  - H2: Compatibilidad con ACP
  - H2: Medios salientes
  - H2: Solución de problemas
  - H2: Relacionado

## channels/location.md

- Ruta: /channels/location
- Encabezados:
  - H2: Formato de texto
  - H2: Campos de contexto
  - H2: Notas del canal
  - H2: Relacionado

## channels/matrix-migration.md

- Ruta: /channels/matrix-migration
- Encabezados:
  - H2: Qué hace la migración automáticamente
  - H2: Qué no puede hacer la migración automáticamente
  - H2: Flujo de actualización recomendado
  - H2: Cómo funciona la migración cifrada
  - H2: Mensajes comunes y qué significan
  - H3: Mensajes de actualización y detección
  - H3: Mensajes de recuperación de estado cifrado
  - H3: Mensajes de recuperación manual
  - H3: Mensajes de instalación de Plugin personalizado
  - H2: Si el historial cifrado sigue sin volver
  - H2: Si quieres empezar de nuevo para mensajes futuros
  - H2: Relacionado

## channels/matrix-presentation.md

- Ruta: /channels/matrix-presentation
- Encabezados:
  - H2: Contenido del evento
  - H2: Comportamiento de reserva
  - H2: Bloques compatibles
  - H2: Interacciones
  - H2: Relación con los metadatos de aprobación
  - H2: Mensajes multimedia

## channels/matrix-push-rules.md

- Ruta: /channels/matrix-push-rules
- Encabezados:
  - H2: Requisitos previos
  - H2: Pasos
  - H2: Notas sobre múltiples bots
  - H2: Notas del homeserver
  - H2: Relacionado

## channels/matrix.md

- Ruta: /channels/matrix
- Encabezados:
  - H2: Instalación
  - H2: Configuración
  - H3: Configuración interactiva
  - H3: Configuración mínima
  - H3: Unión automática
  - H3: Formatos de destino de lista de permitidos
  - H3: Normalización de ID de cuenta
  - H3: Credenciales en caché
  - H3: Variables de entorno
  - H2: Ejemplo de configuración
  - H2: Previsualizaciones en streaming
  - H2: Mensajes de voz
  - H2: Metadatos de aprobación
  - H3: Reglas push autoalojadas para previsualizaciones finalizadas silenciosas
  - H2: Salas de bot a bot
  - H2: Cifrado y verificación
  - H3: Habilitar cifrado
  - H3: Señales de estado y confianza
  - H3: Verificar este dispositivo con una clave de recuperación
  - H3: Inicializar o reparar la firma cruzada
  - H3: Copia de seguridad de claves de sala
  - H3: Listar, solicitar y responder a verificaciones
  - H3: Notas sobre múltiples cuentas
  - H2: Gestión del perfil
  - H2: Hilos
  - H3: Enrutamiento de sesión (sessionScope)
  - H3: Respuestas en hilo (threadReplies)
  - H3: Herencia de hilos y comandos slash
  - H2: Enlaces de conversación ACP
  - H3: Configuración de enlace de hilo
  - H2: Reacciones
  - H2: Contexto del historial
  - H2: Visibilidad del contexto
  - H2: Política de DM y salas
  - H2: Reparación de sala directa
  - H2: Aprobaciones de ejecución
  - H2: Comandos slash
  - H2: Múltiples cuentas
  - H2: Homeservers privados/LAN
  - H2: Proxy del tráfico de Matrix
  - H2: Resolución de destino
  - H2: Referencia de configuración
  - H3: Cuenta y conexión
  - H3: Cifrado
  - H3: Acceso y política
  - H3: Comportamiento de respuesta
  - H3: Configuración de reacciones
  - H3: Herramientas y anulaciones por sala
  - H3: Configuración de aprobación de ejecución
  - H2: Relacionado

## channels/mattermost.md

- Ruta: /channels/mattermost
- Encabezados:
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Comandos slash nativos
  - H2: Variables de entorno (cuenta predeterminada)
  - H2: Modos de chat
  - H2: Hilos y sesiones
  - H2: Control de acceso (DM)
  - H2: Canales (grupos)
  - H2: Destinos para entrega saliente
  - H2: Reintento de canal de DM
  - H2: Streaming de previsualización
  - H2: Reacciones (herramienta de mensajes)
  - H2: Botones interactivos (herramienta de mensajes)
  - H3: Integración directa con API (scripts externos)
  - H2: Adaptador de directorio
  - H2: Múltiples cuentas
  - H2: Solución de problemas
  - H2: Relacionado

## channels/msteams.md

- Ruta: /channels/msteams
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida
  - H2: Objetivos
  - H2: Escrituras de configuración
  - H2: Control de acceso (DM + grupos)
  - H3: Cómo funciona
  - H3: Paso 1: Crear Azure Bot
  - H3: Paso 2: Obtener credenciales
  - H3: Paso 3: Configurar el endpoint de mensajería
  - H3: Paso 4: Habilitar el canal de Teams
  - H3: Paso 5: Crear el manifiesto de la app de Teams
  - H3: Paso 6: Configurar OpenClaw
  - H3: Paso 7: Ejecutar el Gateway
  - H2: Autenticación federada (certificado más identidad administrada)
  - H3: Opción A: Autenticación basada en certificados
  - H3: Opción B: Identidad administrada de Azure
  - H3: Configuración de AKS Workload Identity
  - H3: Comparación de tipos de autenticación
  - H2: Desarrollo local (tunelización)
  - H2: Probar el bot
  - H2: Variables de entorno
  - H2: Acción de información de miembro
  - H2: Contexto del historial
  - H2: Permisos RSC actuales de Teams (manifiesto)
  - H2: Manifiesto de Teams de ejemplo (redactado)
  - H3: Advertencias del manifiesto (campos obligatorios)
  - H3: Actualizar una app existente
  - H2: Capacidades: solo RSC frente a Graph
  - H3: Solo con Teams RSC (app instalada, sin permisos de Graph API)
  - H3: Con Teams RSC + permisos de aplicación de Microsoft Graph
  - H3: RSC frente a Graph API
  - H2: Medios + historial habilitados por Graph (obligatorio para canales)
  - H2: Limitaciones conocidas
  - H3: Timeouts de Webhook
  - H3: Compatibilidad con la nube de Teams y URL de servicio
  - H3: Formato
  - H2: Configuración
  - H2: Enrutamiento y sesiones
  - H2: Estilo de respuesta: hilos frente a publicaciones
  - H3: Precedencia de resolución
  - H3: Conservación del contexto de hilo
  - H2: Adjuntos e imágenes
  - H2: Enviar archivos en chats de grupo
  - H3: Por qué los chats de grupo necesitan SharePoint
  - H3: Configuración
  - H3: Comportamiento al compartir
  - H3: Comportamiento de reserva
  - H3: Ubicación de archivos almacenados
  - H2: Encuestas (Adaptive Cards)
  - H2: Tarjetas de presentación
  - H2: Formatos de destino
  - H2: Mensajería proactiva
  - H2: IDs de equipo y canal (problema común)
  - H2: Canales privados
  - H2: Solución de problemas
  - H3: Problemas comunes
  - H3: Errores al subir el manifiesto
  - H3: Los permisos RSC no funcionan
  - H2: Referencias
  - H2: Relacionado

## channels/nextcloud-talk.md

- Ruta: /channels/nextcloud-talk
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida (principiante)
  - H2: Notas
  - H2: Control de acceso (DM)
  - H2: Salas (grupos)
  - H2: Capacidades
  - H2: Referencia de configuración (Nextcloud Talk)
  - H2: Relacionado

## channels/nostr.md

- Ruta: /channels/nostr
- Encabezados:
  - H2: Plugin incluido
  - H3: Instalaciones antiguas/personalizadas
  - H3: Configuración no interactiva
  - H2: Configuración rápida
  - H2: Referencia de configuración
  - H2: Metadatos del perfil
  - H2: Control de acceso
  - H3: Políticas de DM
  - H3: Ejemplo de lista de permitidos
  - H2: Formatos de clave
  - H2: Relays
  - H2: Compatibilidad con el protocolo
  - H2: Pruebas
  - H3: Relay local
  - H3: Prueba manual
  - H2: Solución de problemas
  - H3: No se reciben mensajes
  - H3: No se envían respuestas
  - H3: Respuestas duplicadas
  - H2: Seguridad
  - H2: Limitaciones (MVP)
  - H2: Relacionado

## channels/pairing.md

- Ruta: /channels/pairing
- Encabezados:
  - H2: 1) Emparejamiento por DM (acceso a chat entrante)
  - H3: Aprobar un remitente
  - H3: Grupos de remitentes reutilizables
  - H3: Dónde vive el estado
  - H2: 2) Emparejamiento de dispositivo Node (nodos iOS/Android/macOS/sin interfaz)
  - H3: Emparejar mediante Telegram (recomendado para iOS)
  - H3: Aprobar un dispositivo Node
  - H3: Aprobación automática opcional de Node por CIDR de confianza
  - H3: Almacenamiento de estado de emparejamiento de Node
  - H3: Notas
  - H2: Documentos relacionados

## channels/qa-channel.md

- Ruta: /channels/qa-channel
- Encabezados:
  - H2: Qué hace
  - H2: Configuración
  - H2: Ejecutores
  - H2: Relacionado

## channels/qqbot.md

- Ruta: /channels/qqbot
- Encabezados:
  - H2: Instalación
  - H2: Configuración
  - H2: Configurar
  - H3: Configuración de múltiples cuentas
  - H3: Chats de grupo
  - H3: Voz (STT / TTS)
  - H2: Formatos de destino
  - H2: Comandos slash
  - H2: Arquitectura del motor
  - H2: Incorporación con código QR
  - H2: Solución de problemas
  - H2: Relacionado

## channels/raft.md

- Ruta: /channels/raft
- Encabezados:
  - H2: Instalación
  - H2: Requisitos previos
  - H2: Configurar
  - H2: Cómo funciona
  - H2: Verificar
  - H2: Solución de problemas
  - H2: Referencias

## channels/signal.md

- Ruta: /channels/signal
- Encabezados:
  - H2: Requisitos previos
  - H2: Configuración rápida (principiante)
  - H2: Qué es
  - H2: Escrituras de configuración
  - H2: El modelo de número (importante)
  - H2: Ruta de configuración A: enlazar una cuenta de Signal existente (QR)
  - H2: Ruta de configuración B: registrar un número de bot dedicado (SMS, Linux)
  - H2: Modo de daemon externo (httpUrl)
  - H2: Modo de contenedor (bbernhard/signal-cli-rest-api)
  - H2: Control de acceso (DM + grupos)
  - H2: Cómo funciona (comportamiento)
  - H2: Medios + límites
  - H2: Indicadores de escritura + confirmaciones de lectura
  - H2: Reacciones (herramienta de mensajes)
  - H2: Reacciones de aprobación
  - H2: Destinos de entrega (CLI/cron)
  - H2: Solución de problemas
  - H2: Notas de seguridad
  - H2: Referencia de configuración (Signal)
  - H2: Relacionado

## channels/slack.md

- Ruta: /channels/slack
- Encabezados:
  - H2: Elegir Socket Mode o URLs de solicitud HTTP
  - H3: Modo relay
  - H2: Instalación
  - H2: Configuración rápida
  - H2: Ajuste del transporte Socket Mode
  - H2: Lista de verificación de manifiesto y ámbitos
  - H3: Configuración adicional del manifiesto
  - H2: Modelo de token
  - H2: Acciones y puertas
  - H2: Control de acceso y enrutamiento
  - H2: Hilos, sesiones y etiquetas de respuesta
  - H2: Reacciones de confirmación
  - H3: Emoji (ackReaction)
  - H3: Ámbito (messages.ackReactionScope)
  - H2: Streaming de texto
  - H2: Reserva de reacción de escritura
  - H2: Medios, fragmentación y entrega
  - H2: Comandos y comportamiento slash
  - H2: Respuestas interactivas
  - H3: Envíos de modales propiedad del Plugin
  - H2: Aprobaciones nativas en Slack
  - H2: Eventos y comportamiento operativo
  - H2: Referencia de configuración
  - H2: Solución de problemas
  - H2: Referencia de visión de adjuntos
  - H3: Tipos de medios compatibles
  - H3: Canalización entrante
  - H3: Herencia de adjuntos de raíz de hilo
  - H3: Manejo de múltiples adjuntos
  - H3: Límites de tamaño, descarga y modelo
  - H3: Límites conocidos
  - H3: Documentación relacionada
  - H2: Relacionado

## channels/sms.md

- Ruta: /channels/sms
- Encabezados:
  - H2: Antes de empezar
  - H2: Configuración rápida
  - H2: Ejemplos de configuración
  - H3: Archivo de configuración
  - H3: Variables de entorno
  - H3: Token de autenticación SecretRef
  - H3: Número privado solo con lista de permitidos
  - H3: Remitente de Messaging Service
  - H3: Destino saliente predeterminado
  - H2: Control de acceso
  - H2: Enviar SMS
  - H2: Verificar configuración
  - H3: Prueba de extremo a extremo desde macOS iMessage/SMS
  - H2: Seguridad de Webhook
  - H2: Configuración de múltiples cuentas
  - H2: Solución de problemas
  - H3: Twilio devuelve 403 u OpenClaw rechaza el Webhook
  - H3: No aparece ninguna solicitud de emparejamiento
  - H3: Fallan los envíos salientes
  - H3: Llegan mensajes, pero el agente no responde

## channels/synology-chat.md

- Ruta: /channels/synology-chat
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida
  - H2: Variables de entorno
  - H2: Política de DM y control de acceso
  - H2: Entrega saliente
  - H2: Múltiples cuentas
  - H2: Notas de seguridad
  - H2: Solución de problemas
  - H2: Relacionado

## channels/telegram.md

- Ruta: /channels/telegram
- Encabezados:
  - H2: Configuración rápida
  - H2: Configuración del lado de Telegram
  - H2: Control de acceso y activación
  - H3: Identidad del bot en grupo
  - H2: Comportamiento en tiempo de ejecución
  - H2: Referencia de funciones
  - H2: Controles de respuesta de error
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Relacionado

## channels/tlon.md

- Ruta: /channels/tlon
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración
  - H2: Naves privadas/LAN
  - H2: Canales de grupo
  - H2: Control de acceso
  - H2: Propietario y sistema de aprobación
  - H2: Configuración de aceptación automática
  - H2: Destinos de entrega (CLI/cron)
  - H2: Skill incluida
  - H2: Capacidades
  - H2: Solución de problemas
  - H2: Referencia de configuración
  - H2: Notas
  - H2: Relacionado

## channels/troubleshooting.md

- Ruta: /channels/troubleshooting
- Encabezados:
  - H2: Escalera de comandos
  - H2: Después de una actualización
  - H2: WhatsApp
  - H3: Firmas de fallo de WhatsApp
  - H2: Telegram
  - H3: Firmas de fallo de Telegram
  - H2: Discord
  - H3: Firmas de fallo de Discord
  - H2: Slack
  - H3: Firmas de fallo de Slack
  - H2: iMessage
  - H3: Firmas de fallo de iMessage
  - H2: Signal
  - H3: Firmas de fallo de Signal
  - H2: QQ Bot
  - H3: Firmas de fallo de QQ Bot
  - H2: Matrix
  - H3: Firmas de fallo de Matrix
  - H2: Relacionado

## channels/twitch.md

- Ruta: /channels/twitch
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida (principiante)
  - H2: Qué es
  - H2: Configuración (detallada)
  - H3: Generar credenciales
  - H3: Configurar el bot
  - H3: Control de acceso (recomendado)
  - H2: Actualización de tokens (opcional)
  - H2: Soporte multi-cuenta
  - H2: Control de acceso
  - H2: Solución de problemas
  - H2: Configuración
  - H3: Configuración de cuenta
  - H3: Opciones del proveedor
  - H2: Acciones de herramientas
  - H2: Seguridad y operaciones
  - H2: Límites
  - H2: Relacionado

## channels/wechat.md

- Ruta: /channels/wechat
- Encabezados:
  - H2: Nomenclatura
  - H2: Cómo funciona
  - H2: Instalar
  - H2: Iniciar sesión
  - H2: Control de acceso
  - H2: Compatibilidad
  - H2: Proceso sidecar
  - H2: Solución de problemas
  - H2: Documentación relacionada

## channels/whatsapp.md

- Ruta: /channels/whatsapp
- Encabezados:
  - H2: Instalar (bajo demanda)
  - H2: Configuración rápida
  - H2: Patrones de despliegue
  - H2: Modelo de tiempo de ejecución
  - H2: Solicitudes de aprobación
  - H2: Hooks de Plugin y privacidad
  - H2: Control de acceso y activación
  - H2: Vinculaciones ACP configuradas
  - H2: Comportamiento de número personal y autochat
  - H2: Normalización de mensajes y contexto
  - H2: Entrega, fragmentación y medios
  - H2: Cita de respuestas
  - H2: Nivel de reacción
  - H2: Reacciones de acuse de recibo
  - H2: Reacciones de estado del ciclo de vida
  - H2: Multi-cuenta y credenciales
  - H2: Herramientas, acciones y escrituras de configuración
  - H2: Solución de problemas
  - H2: Prompts del sistema
  - H2: Punteros de referencia de configuración
  - H2: Relacionado

## channels/yuanbao.md

- Ruta: /channels/yuanbao
- Encabezados:
  - H2: Inicio rápido
  - H3: Configuración interactiva (alternativa)
  - H2: Control de acceso
  - H3: Mensajes directos
  - H3: Chats de grupo
  - H2: Ejemplos de configuración
  - H3: Configuración básica con política de DM abierta
  - H3: Restringir DM a usuarios específicos
  - H3: Desactivar el requisito de @mención en grupos
  - H3: Optimizar la entrega de mensajes salientes
  - H3: Ajustar la estrategia de combinación de texto
  - H2: Comandos comunes
  - H2: Solución de problemas
  - H3: El bot no responde en chats de grupo
  - H3: El bot no recibe mensajes
  - H3: El bot envía respuestas vacías o de reserva
  - H3: App Secret filtrado
  - H2: Configuración avanzada
  - H3: Varias cuentas
  - H3: Límites de mensajes
  - H3: Streaming
  - H3: Contexto del historial de chats de grupo
  - H3: Modo de respuesta
  - H3: Inyección de pista Markdown
  - H3: Modo de depuración
  - H3: Enrutamiento multiagente
  - H2: Referencia de configuración
  - H2: Tipos de mensaje admitidos
  - H3: Recibir
  - H3: Enviar
  - H3: Hilos y respuestas
  - H2: Relacionado

## channels/zalo.md

- Ruta: /channels/zalo
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida (principiante)
  - H2: Qué es
  - H2: Configuración (ruta rápida)
  - H3: 1) Crear un token de bot (Zalo Bot Platform)
  - H3: 2) Configurar el token (entorno o configuración)
  - H2: Cómo funciona (comportamiento)
  - H2: Límites
  - H2: Control de acceso (DM)
  - H3: Acceso a DM
  - H2: Control de acceso (grupos)
  - H2: Long-polling frente a webhook
  - H2: Tipos de mensaje admitidos
  - H2: Capacidades
  - H2: Destinos de entrega (CLI/cron)
  - H2: Solución de problemas
  - H2: Referencia de configuración (Zalo)
  - H2: Relacionado

## channels/zaloclawbot.md

- Ruta: /channels/zaloclawbot
- Encabezados:
  - H2: Compatibilidad
  - H2: Requisitos previos
  - H2: Instalar con onboard (recomendado)
  - H2: Instalación manual
  - H3: 1. Instalar el plugin
  - H3: 2. Habilitar el plugin en la configuración
  - H3: 3. Generar código QR e iniciar sesión
  - H3: 4. Reiniciar el Gateway
  - H2: Cómo funciona
  - H2: Bajo el capó
  - H2: Solución de problemas

## channels/zalouser.md

- Ruta: /channels/zalouser
- Encabezados:
  - H2: Plugin incluido
  - H2: Configuración rápida (principiante)
  - H2: Qué es
  - H2: Nomenclatura
  - H2: Encontrar ID (directorio)
  - H2: Límites
  - H2: Control de acceso (DM)
  - H2: Acceso a grupos (opcional)
  - H3: Puerta de menciones de grupo
  - H2: Multi-cuenta
  - H2: Variables de entorno
  - H2: Escritura, reacciones y acuses de entrega
  - H2: Solución de problemas
  - H2: Relacionado

## ci.md

- Ruta: /ci
- Encabezados:
  - H2: Resumen del pipeline
  - H2: Orden de fallo rápido
  - H2: Contexto y evidencia de PR
  - H2: Alcance y enrutamiento
  - H2: Reenvío de actividad de ClawSweeper
  - H2: Despachos manuales
  - H2: Runners
  - H2: Presupuesto de registro de runners
  - H2: Equivalentes locales
  - H2: Rendimiento de OpenClaw
  - H2: Validación completa de release
  - H2: Fragmentos en vivo y E2E
  - H2: Aceptación de paquete
  - H3: Jobs
  - H3: Fuentes candidatas
  - H3: Perfiles de suite
  - H3: Ventanas de compatibilidad heredada
  - H3: Ejemplos
  - H2: Smoke de instalación
  - H2: E2E local con Docker
  - H3: Ajustables
  - H3: Flujo de trabajo live/E2E reutilizable
  - H3: Fragmentos de ruta de release
  - H2: Prerelease de Plugin
  - H2: Laboratorio de QA
  - H2: CodeQL
  - H3: Categorías de seguridad
  - H3: Fragmentos de seguridad específicos de plataforma
  - H3: Categorías de calidad crítica
  - H2: Flujos de trabajo de mantenimiento
  - H3: Agente de docs
  - H3: Agente de rendimiento de pruebas
  - H3: PR duplicadas después de fusionar
  - H2: Puertas de comprobación locales y enrutamiento de cambios
  - H2: Validación de Testbox
  - H2: Relacionado

## clawhub/cli.md

- Ruta: /clawhub/cli
- Encabezados:
  - H1: CLI de ClawHub
  - H2: Descubrir e instalar
  - H2: Publicar y mantener
  - H2: Relacionado

## clawhub/publishing.md

- Ruta: /clawhub/publishing
- Encabezados:
  - H1: Publicación en ClawHub
  - H2: Propietarios
  - H2: Skills
  - H2: Plugins
  - H2: Flujo de release
  - H2: Preguntas frecuentes
  - H3: El scope del paquete debe coincidir con el propietario seleccionado

## cli/acp.md

- Ruta: /cli/acp
- Encabezados:
  - H2: Qué no es esto
  - H2: Matriz de compatibilidad
  - H2: Limitaciones conocidas
  - H2: Uso
  - H2: Cliente ACP (depuración)
  - H2: Pruebas smoke de protocolo
  - H2: Cómo usar esto
  - H2: Seleccionar agentes
  - H2: Usar desde acpx (Codex, Claude, otros clientes ACP)
  - H2: Configuración del editor Zed
  - H2: Mapeo de sesiones
  - H2: Opciones
  - H3: opciones del cliente acp
  - H2: Relacionado

## cli/agent.md

- Ruta: /cli/agent
- Encabezados:
  - H1: openclaw agent
  - H2: Opciones
  - H2: Ejemplos
  - H2: Notas
  - H2: Estado de entrega JSON
  - H2: Relacionado

## cli/agents.md

- Ruta: /cli/agents
- Encabezados:
  - H1: openclaw agents
  - H2: Ejemplos
  - H2: Vinculaciones de enrutamiento
  - H3: formato --bind
  - H3: Comportamiento del alcance de vinculación
  - H2: Superficie de comandos
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: Archivos de identidad
  - H2: Establecer identidad
  - H2: Relacionado

## cli/approvals.md

- Ruta: /cli/approvals
- Encabezados:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Comandos comunes
  - H2: Reemplazar aprobaciones desde un archivo
  - H2: Ejemplo "Never prompt" / YOLO
  - H2: Helpers de allowlist
  - H2: Opciones comunes
  - H2: Notas
  - H2: Relacionado

## cli/backup.md

- Ruta: /cli/backup
- Encabezados:
  - H1: openclaw backup
  - H2: Notas
  - H2: De qué se hace copia de seguridad
  - H2: Comportamiento ante configuración no válida
  - H2: Tamaño y rendimiento
  - H2: Relacionado

## cli/browser.md

- Ruta: /cli/browser
- Encabezados:
  - H1: openclaw browser
  - H2: Flags comunes
  - H2: Inicio rápido (local)
  - H2: Solución rápida de problemas
  - H2: Ciclo de vida
  - H2: Si falta el comando
  - H2: Perfiles
  - H2: Pestañas
  - H2: Snapshot / captura de pantalla / acciones
  - H2: Estado y almacenamiento
  - H2: Depuración
  - H2: Chrome existente mediante MCP
  - H2: Control remoto del navegador (proxy de host de nodo)
  - H2: Relacionado

## cli/channels.md

- Ruta: /cli/channels
- Encabezados:
  - H1: openclaw channels
  - H2: Comandos comunes
  - H2: Estado / capacidades / resolver / logs
  - H2: Añadir / eliminar cuentas
  - H2: Inicio y cierre de sesión (interactivo)
  - H2: Solución de problemas
  - H2: Sondeo de capacidades
  - H2: Resolver nombres a ID
  - H2: Relacionado

## cli/clawbot.md

- Ruta: /cli/clawbot
- Encabezados:
  - H1: openclaw clawbot
  - H2: Migración
  - H2: Relacionado

## cli/commitments.md

- Ruta: /cli/commitments
- Encabezados:
  - H2: Uso
  - H2: Opciones
  - H2: Ejemplos
  - H2: Salida
  - H2: Relacionado

## cli/completion.md

- Ruta: /cli/completion
- Encabezados:
  - H1: openclaw completion
  - H2: Uso
  - H2: Opciones
  - H2: Notas
  - H2: Relacionado

## cli/config.md

- Ruta: /cli/config
- Encabezados:
  - H2: Opciones raíz
  - H2: Ejemplos
  - H3: esquema de config
  - H3: Rutas
  - H2: Valores
  - H2: modos de config set
  - H2: config patch
  - H2: Flags del generador de proveedores
  - H2: Simulación
  - H3: Forma de salida JSON
  - H2: Seguridad de escritura
  - H2: Subcomandos
  - H2: Validar
  - H2: Relacionado

## cli/configure.md

- Ruta: /cli/configure
- Encabezados:
  - H1: openclaw configure
  - H2: Opciones
  - H2: Ejemplos
  - H2: Relacionado

## cli/crestodian.md

- Ruta: /cli/crestodian
- Encabezados:
  - H1: openclaw crestodian
  - H2: Qué muestra Crestodian
  - H2: Ejemplos
  - H2: Arranque seguro
  - H2: Operaciones y aprobación
  - H2: Bootstrap de configuración
  - H2: Planificador asistido por modelo
  - H2: Cambiar a un agente
  - H2: Modo de rescate de mensajes
  - H2: Relacionado

## cli/cron.md

- Ruta: /cli/cron
- Encabezados:
  - H1: openclaw cron
  - H2: Crear jobs rápidamente
  - H2: Sesiones
  - H2: Entrega
  - H3: Propiedad de la entrega
  - H3: Entrega de fallos
  - H2: Programación
  - H3: Jobs de una sola ejecución
  - H3: Jobs recurrentes
  - H3: Ejecuciones manuales
  - H2: Modelos
  - H3: Precedencia de modelo cron aislado
  - H3: Modo rápido
  - H3: Reintentos de cambio de modelo en vivo
  - H2: Salida de ejecución y denegaciones
  - H3: Supresión de acuses obsoletos
  - H3: Supresión silenciosa de tokens
  - H3: Denegaciones estructuradas
  - H2: Retención
  - H2: Migrar jobs antiguos
  - H2: Ediciones comunes
  - H2: Comandos administrativos comunes
  - H2: Relacionado

## cli/daemon.md

- Ruta: /cli/daemon
- Encabezados:
  - H1: openclaw daemon
  - H2: Uso
  - H2: Subcomandos
  - H2: Opciones comunes
  - H2: Preferir
  - H2: Relacionado

## cli/dashboard.md

- Ruta: /cli/dashboard
- Encabezados:
  - H1: openclaw dashboard
  - H2: Relacionado

## cli/devices.md

- Ruta: /cli/devices
- Encabezados:
  - H1: openclaw devices
  - H2: Comandos
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Aprobación de primera ejecución de Paperclip / openclawgateway
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: Opciones comunes
  - H2: Notas
  - H2: Lista de verificación de recuperación de desfase de tokens
  - H2: Relacionado

## cli/directory.md

- Ruta: /cli/directory
- Encabezados:
  - H1: openclaw directory
  - H2: Flags comunes
  - H2: Notas
  - H2: Usar resultados con envío de mensajes
  - H2: Formatos de ID (por canal)
  - H2: Yo ("me")
  - H2: Pares (contactos/usuarios)
  - H2: Grupos
  - H2: Relacionado

## cli/dns.md

- Ruta: /cli/dns
- Encabezados:
  - H1: openclaw dns
  - H2: Configuración
  - H2: dns setup
  - H2: Relacionado

## cli/docs.md

- Ruta: /cli/docs
- Encabezados:
  - H1: openclaw docs
  - H2: Uso
  - H2: Ejemplos
  - H2: Cómo funciona
  - H2: Salida
  - H2: Códigos de salida
  - H2: Relacionado

## cli/doctor.md

- Ruta: /cli/doctor
- Encabezados:
  - H1: openclaw doctor
  - H2: Por qué usarlo
  - H2: Ejemplos
  - H2: Opciones
  - H2: Modo lint
  - H2: Comprobaciones de salud estructuradas
  - H2: Selección de comprobaciones
  - H2: Modo posterior a actualización
  - H2: macOS: anulaciones de env de launchctl
  - H2: Relacionado

## cli/flows.md

- Ruta: /cli/flows
- Encabezados:
  - H1: openclaw tasks flow
  - H2: Subcomandos
  - H3: Valores de filtro de estado
  - H2: Ejemplos
  - H2: Relacionado

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
  - H4: Remoto por SSH (paridad con app para Mac)
  - H3: gateway call
  - H2: Gestionar el servicio Gateway
  - H3: Instalar con un wrapper
  - H2: Descubrir gateways (Bonjour)
  - H3: gateway discover
  - H2: Relacionado

## cli/health.md

- Ruta: /cli/health
- Encabezados:
  - H1: openclaw health
  - H2: Opciones
  - H2: Relacionado

## cli/hooks.md

- Route: /cli/hooks
- Encabezados:
  - H1: openclaw hooks
  - H2: Listar todos los hooks
  - H2: Obtener información de un hook
  - H2: Comprobar la elegibilidad de los hooks
  - H2: Habilitar un hook
  - H2: Deshabilitar un hook
  - H2: Notas
  - H2: Instalar paquetes de hooks
  - H2: Actualizar paquetes de hooks
  - H2: Hooks incluidos
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Relacionado

## cli/index.md

- Route: /cli
- Encabezados:
  - H2: Páginas de comandos
  - H2: Flags globales
  - H2: Modos de salida
  - H2: Árbol de comandos
  - H2: Comandos slash del chat
  - H2: Seguimiento de uso
  - H2: Relacionado

## cli/infer.md

- Route: /cli/infer
- Encabezados:
  - H2: Convertir infer en una skill
  - H2: Por qué usar infer
  - H2: Árbol de comandos
  - H2: Tareas comunes
  - H2: Comportamiento
  - H2: Modelo
  - H2: Imagen
  - H2: Audio
  - H2: TTS
  - H2: Vídeo
  - H2: Web
  - H2: Incrustación
  - H2: Salida JSON
  - H2: Errores comunes
  - H2: Notas
  - H2: Relacionado

## cli/logs.md

- Route: /cli/logs
- Encabezados:
  - H1: openclaw logs
  - H2: Opciones
  - H2: Opciones RPC compartidas de Gateway
  - H2: Ejemplos
  - H2: Notas
  - H2: Relacionado

## cli/mcp.md

- Route: /cli/mcp
- Encabezados:
  - H2: Elegir la ruta MCP correcta
  - H2: OpenClaw como servidor MCP
  - H3: Cuándo usar serve
  - H3: Cómo funciona
  - H3: Elegir un modo de cliente
  - H3: Qué expone serve
  - H3: Uso
  - H3: Herramientas de puente
  - H3: Modelo de eventos
  - H3: Notificaciones del canal Claude
  - H3: Configuración del cliente MCP
  - H3: Opciones
  - H3: Seguridad y límite de confianza
  - H3: Pruebas
  - H3: Solución de problemas
  - H2: OpenClaw como registro de clientes MCP
  - H3: Definiciones guardadas de servidores MCP
  - H3: Recetas comunes de servidor
  - H3: Formas de salida JSON
  - H3: Transporte stdio
  - H3: Transporte SSE / HTTP
  - H3: Flujo de trabajo OAuth
  - H3: Transporte HTTP transmitible
  - H2: Interfaz de control
  - H2: Límites actuales
  - H2: Relacionado

## cli/memory.md

- Route: /cli/memory
- Encabezados:
  - H1: openclaw memory
  - H2: Ejemplos
  - H2: Opciones
  - H2: Dreaming
  - H2: Relacionado

## cli/message.md

- Route: /cli/message
- Encabezados:
  - H1: openclaw message
  - H2: Uso
  - H2: Flags comunes
  - H2: Comportamiento de SecretRef
  - H2: Acciones
  - H3: Núcleo
  - H3: Hilos
  - H3: Emojis
  - H3: Stickers
  - H3: Roles / Canales / Miembros / Voz
  - H3: Eventos
  - H3: Moderación (Discord)
  - H3: Difusión
  - H2: Ejemplos
  - H2: Relacionado

## cli/migrate.md

- Route: /cli/migrate
- Encabezados:
  - H1: openclaw migrate
  - H2: Comandos
  - H2: Modelo de seguridad
  - H2: Proveedor Claude
  - H3: Qué importa Claude
  - H3: Estado de archivo y revisión manual
  - H2: Proveedor Codex
  - H3: Qué importa Codex
  - H3: Estado de Codex con revisión manual
  - H2: Proveedor Hermes
  - H3: Qué importa Hermes
  - H3: Claves .env admitidas
  - H3: Estado solo de archivo
  - H3: Después de aplicar
  - H2: Contrato de Plugin
  - H2: Integración de incorporación
  - H2: Relacionado

## cli/models.md

- Route: /cli/models
- Encabezados:
  - H1: openclaw models
  - H2: Comandos comunes
  - H3: Escaneo de modelos
  - H3: Estado de modelos
  - H2: Alias + respaldos
  - H2: Perfiles de autenticación
  - H2: Relacionado

## cli/node.md

- Route: /cli/node
- Encabezados:
  - H1: openclaw node
  - H2: ¿Por qué usar un host de Node?
  - H2: Proxy de navegador (configuración cero)
  - H2: Ejecutar (primer plano)
  - H2: Autenticación de Gateway para host de Node
  - H2: Servicio (segundo plano)
  - H2: Emparejamiento
  - H2: Aprobaciones de ejecución
  - H2: Relacionado

## cli/nodes.md

- Route: /cli/nodes
- Encabezados:
  - H1: openclaw nodes
  - H2: Comandos comunes
  - H2: Invocar
  - H2: Relacionado

## cli/onboard.md

- Route: /cli/onboard
- Encabezados:
  - H1: openclaw onboard
  - H2: Guías relacionadas
  - H2: Ejemplos
  - H2: Configuración regional
  - H3: Opciones de endpoint Z.AI no interactivas
  - H2: Notas del flujo
  - H2: Comandos de seguimiento comunes

## cli/pairing.md

- Route: /cli/pairing
- Encabezados:
  - H1: openclaw pairing
  - H2: Comandos
  - H2: pairing list
  - H2: pairing approve
  - H2: Notas
  - H2: Relacionado

## cli/path.md

- Route: /cli/path
- Encabezados:
  - H1: openclaw path
  - H2: Por qué usarlo
  - H2: Cómo se usa
  - H2: Cómo funciona
  - H2: Subcomandos
  - H2: Flags globales
  - H2: Sintaxis oc://
  - H2: Direccionamiento por tipo de archivo
  - H2: Contrato de mutación
  - H2: Ejemplos
  - H2: Recetas por tipo de archivo
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Referencia de subcomandos
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: Códigos de salida
  - H2: Modo de salida
  - H2: Notas
  - H2: Relacionado

## cli/plugins.md

- Route: /cli/plugins
- Encabezados:
  - H2: Comandos
  - H3: Autor
  - H3: Scaffold de proveedor
  - H3: Instalar
  - H4: Forma abreviada del marketplace
  - H3: Lista
  - H3: Índice de Plugin
  - H3: Desinstalar
  - H3: Actualizar
  - H3: Inspeccionar
  - H3: Doctor
  - H3: Registro
  - H3: Marketplace
  - H2: Relacionado

## cli/policy.md

- Route: /cli/policy
- Encabezados:
  - H1: openclaw policy
  - H2: Inicio rápido
  - H3: Referencia de reglas de política
  - H4: Superposiciones con alcance
  - H4: Canales
  - H4: Servidores MCP
  - H4: Proveedores de modelos
  - H4: Red
  - H4: Ingreso y acceso a canales
  - H4: Gateway
  - H4: Espacio de trabajo del agente
  - H4: Postura de sandbox
  - H4: Manejo de datos
  - H4: Secretos
  - H4: Aprobaciones de ejecución
  - H4: Perfiles de autenticación
  - H4: Metadatos de herramientas
  - H4: Postura de herramientas
  - H2: Configurar política
  - H2: Aceptar estado de política
  - H2: Hallazgos
  - H2: Reparar
  - H2: Códigos de salida
  - H2: Relacionado

## cli/proxy.md

- Route: /cli/proxy
- Encabezados:
  - H1: openclaw proxy
  - H2: Comandos
  - H2: Validar
  - H2: Consultar preajustes
  - H2: Notas
  - H2: Relacionado

## cli/qr.md

- Route: /cli/qr
- Encabezados:
  - H1: openclaw qr
  - H2: Uso
  - H2: Opciones
  - H2: Notas
  - H2: Relacionado

## cli/reset.md

- Route: /cli/reset
- Encabezados:
  - H1: openclaw reset
  - H2: Relacionado

## cli/sandbox.md

- Route: /cli/sandbox
- Encabezados:
  - H2: Resumen
  - H2: Comandos
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Casos de uso
  - H3: Después de actualizar una imagen de Docker
  - H3: Después de cambiar la configuración de sandbox
  - H3: Después de cambiar el destino SSH o el material de autenticación SSH
  - H3: Después de cambiar la fuente, la política o el modo de OpenShell
  - H3: Después de cambiar setupCommand
  - H3: Solo para un agente específico
  - H2: Por qué es necesario
  - H2: Migración de registro
  - H2: Configuración
  - H2: Relacionado

## cli/secrets.md

- Route: /cli/secrets
- Encabezados:
  - H1: openclaw secrets
  - H2: Recargar snapshot de runtime
  - H2: Auditoría
  - H2: Configurar (asistente interactivo)
  - H2: Aplicar un plan guardado
  - H2: Por qué no hay copias de seguridad de rollback
  - H2: Ejemplo
  - H2: Relacionado

## cli/security.md

- Route: /cli/security
- Encabezados:
  - H1: openclaw security
  - H2: Auditoría
  - H2: Salida JSON
  - H2: Qué cambia --fix
  - H2: Relacionado

## cli/sessions.md

- Route: /cli/sessions
- Encabezados:
  - H1: openclaw sessions
  - H2: Mantenimiento de limpieza
  - H2: Compactar una sesión
  - H3: RPC sessions.compact
  - H2: Relacionado

## cli/setup.md

- Route: /cli/setup
- Encabezados:
  - H1: openclaw setup
  - H2: Opciones
  - H3: Modo de referencia
  - H2: Ejemplos
  - H2: Notas
  - H2: Relacionado

## cli/skills.md

- Route: /cli/skills
- Encabezados:
  - H1: openclaw skills
  - H2: Comandos
  - H2: Taller de Skills
  - H2: Relacionado

## cli/status.md

- Route: /cli/status
- Encabezados:
  - H2: Relacionado

## cli/system.md

- Route: /cli/system
- Encabezados:
  - H1: openclaw system
  - H2: Comandos comunes
  - H2: Evento del sistema
  - H2: system heartbeat last|enable|disable
  - H2: Presencia del sistema
  - H2: Notas
  - H2: Relacionado

## cli/tasks.md

- Route: /cli/tasks
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
  - H2: Relacionado

## cli/transcripts.md

- Route: /cli/transcripts
- Encabezados:
  - H1: openclaw transcripts
  - H2: Comandos
  - H2: Salida
  - H2: Muchas reuniones por día
  - H2: Resúmenes faltantes
  - H2: Configuración

## cli/tui.md

- Route: /cli/tui
- Encabezados:
  - H1: openclaw tui
  - H2: Opciones
  - H2: Ejemplos
  - H2: Bucle de reparación de configuración
  - H2: Relacionado

## cli/uninstall.md

- Route: /cli/uninstall
- Encabezados:
  - H1: openclaw uninstall
  - H2: Relacionado

## cli/update.md

- Route: /cli/update
- Encabezados:
  - H1: openclaw update
  - H2: Uso
  - H2: Opciones
  - H2: Estado de actualización
  - H2: Reparación de actualización
  - H2: Asistente de actualización
  - H2: Qué hace
  - H3: Forma de respuesta del plano de control
  - H2: Flujo de checkout de Git
  - H3: Selección de canal
  - H3: Pasos de actualización
  - H2: Forma abreviada --update
  - H2: Relacionado

## cli/voicecall.md

- Route: /cli/voicecall
- Encabezados:
  - H1: openclaw voicecall
  - H2: Subcomandos
  - H2: Configuración y smoke
  - H3: setup
  - H3: smoke
  - H2: Ciclo de vida de llamada
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Logs y métricas
  - H3: tail
  - H3: latency
  - H2: Exponer webhooks
  - H3: expose
  - H2: Relacionado

## cli/webhooks.md

- Route: /cli/webhooks
- Encabezados:
  - H1: openclaw webhooks
  - H2: Subcomandos
  - H2: Configuración de webhooks de Gmail
  - H3: Requerido
  - H3: Opciones de Pub/Sub
  - H3: Opciones de entrega de OpenClaw
  - H3: Opciones de gog watch serve
  - H3: Exposición de Tailscale
  - H3: Salida
  - H2: Ejecutar webhooks de Gmail
  - H2: Flujo de extremo a extremo
  - H2: Relacionado

## cli/wiki.md

- Route: /cli/wiki
- Encabezados:
  - H1: openclaw wiki
  - H2: Para qué sirve
  - H2: Comandos comunes
  - H2: Comandos
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Guía de uso práctico
  - H2: Integraciones de configuración
  - H2: Relacionado

## cli/workboard.md

- Route: /cli/workboard
- Encabezados:
  - H2: Uso
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Paridad de comandos slash
  - H2: Permisos
  - H2: Solución de problemas
  - H3: No aparecen tarjetas
  - H3: Dispatch indica solo datos
  - H3: Dispatch no inicia nada
  - H2: Relacionado

## concepts/active-memory.md

- Route: /concepts/active-memory
- Encabezados:
  - H2: Inicio rápido
  - H2: Recomendaciones de velocidad
  - H3: Configuración de Cerebras
  - H2: Cómo verlo
  - H2: Alternancia de sesión
  - H2: Cuándo se ejecuta
  - H2: Tipos de sesión
  - H2: Dónde se ejecuta
  - H2: Por qué usarlo
  - H2: Cómo funciona
  - H2: Modos de consulta
  - H2: Estilos de prompt
  - H2: Política de fallback de modelo
  - H2: Herramientas de memoria
  - H3: memory-core integrado
  - H3: Memoria de LanceDB
  - H3: Lossless Claw
  - H2: Escotillas de escape avanzadas
  - H2: Persistencia de transcripciones
  - H2: Configuración
  - H2: Configuración recomendada
  - H3: Periodo de gracia de arranque en frío
  - H2: Depuración
  - H2: Problemas comunes
  - H2: Páginas relacionadas

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- Encabezados:
  - H2: Puntos de entrada
  - H2: Cómo funciona (alto nivel)
  - H2: Cola + concurrencia
  - H2: Preparación de sesión + espacio de trabajo
  - H2: Ensamblaje del prompt + prompt del sistema
  - H2: Puntos de hook (donde puedes interceptar)
  - H3: Hooks internos (hooks de Gateway)
  - H3: Hooks de Plugin (ciclo de vida de agente + gateway)
  - H2: Streaming + respuestas parciales
  - H2: Ejecución de herramientas + herramientas de mensajería
  - H2: Moldeado + supresión de respuestas
  - H2: Compaction + reintentos
  - H2: Flujos de eventos (hoy)
  - H2: Gestión de canales de chat
  - H2: Tiempos de espera
  - H2: Dónde pueden terminar las cosas antes de tiempo
  - H2: Relacionado

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- Encabezados:
  - H2: Superficies de Codex
  - H2: Propiedad del runtime
  - H2: Selección de runtime
  - H2: Runtime de agente de GitHub Copilot
  - H2: Contrato de compatibilidad
  - H2: Etiquetas de estado
  - H2: Relacionado

## concepts/agent-workspace.md

- Route: /concepts/agent-workspace
- Encabezados:
  - H2: Ubicación predeterminada
  - H2: Carpetas de espacio de trabajo adicionales
  - H2: Mapa de archivos del espacio de trabajo
  - H2: Qué NO está en el espacio de trabajo
  - H2: Copia de seguridad de Git (recomendada, privada)
  - H2: No confirmes secretos
  - H2: Mover el espacio de trabajo a una máquina nueva
  - H2: Notas avanzadas
  - H2: Relacionado

## concepts/agent.md

- Ruta: /concepts/agent
- Encabezados:
  - H2: Área de trabajo (obligatoria)
  - H2: Archivos de arranque (inyectados)
  - H2: Herramientas integradas
  - H2: Skills
  - H2: Límites de Runtime
  - H2: Sesiones
  - H2: Dirección durante el streaming
  - H2: Referencias de modelo
  - H2: Configuración (mínima)
  - H2: Relacionado

## concepts/architecture.md

- Ruta: /concepts/architecture
- Encabezados:
  - H2: Descripción general
  - H2: Componentes y flujos
  - H3: Gateway (daemon)
  - H3: Clientes (app para Mac / CLI / administrador web)
  - H3: Nodos (macOS / iOS / Android / sin interfaz)
  - H3: WebChat
  - H2: Ciclo de vida de la conexión (cliente único)
  - H2: Protocolo de cable (resumen)
  - H2: Emparejamiento + confianza local
  - H2: Tipado de protocolo y generación de código
  - H2: Acceso remoto
  - H2: Instantánea de operaciones
  - H2: Invariantes
  - H2: Relacionado

## concepts/channel-docking.md

- Ruta: /concepts/channel-docking
- Encabezados:
  - H2: Ejemplo
  - H2: Por qué usarlo
  - H2: Configuración requerida
  - H2: Comandos
  - H2: Qué cambia
  - H2: Qué no cambia
  - H2: Solución de problemas

## concepts/commitments.md

- Ruta: /concepts/commitments
- Encabezados:
  - H2: Habilitar compromisos
  - H2: Cómo funciona
  - H2: Alcance
  - H2: Compromisos frente a recordatorios
  - H2: Gestionar compromisos
  - H2: Privacidad y coste
  - H2: Solución de problemas
  - H2: Relacionado

## concepts/compaction.md

- Ruta: /concepts/compaction
- Encabezados:
  - H2: Cómo funciona
  - H2: Compaction automática
  - H2: Compaction manual
  - H2: Configuración
  - H3: Uso de un modelo diferente
  - H3: Conservación de identificadores
  - H3: Protección de bytes de la transcripción activa
  - H3: Transcripciones sucesoras
  - H3: Avisos de Compaction
  - H3: Volcado de memoria
  - H2: Proveedores de Compaction conectables
  - H2: Compaction frente a poda
  - H2: Solución de problemas
  - H2: Relacionado

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
  - H3: Ajustes de Runtime
  - H3: Requisitos del host
  - H3: Aislamiento de fallos
  - H3: ownsCompaction
  - H2: Referencia de configuración
  - H2: Relación con Compaction y memoria
  - H2: Consejos
  - H2: Relacionado

## concepts/context.md

- Ruta: /concepts/context
- Encabezados:
  - H2: Inicio rápido (inspeccionar contexto)
  - H2: Salida de ejemplo
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Qué cuenta para la ventana de contexto
  - H2: Cómo OpenClaw construye el prompt del sistema
  - H2: Archivos de área de trabajo inyectados (Contexto del proyecto)
  - H2: Skills: inyectadas frente a cargadas bajo demanda
  - H2: Herramientas: hay dos costes
  - H2: Comandos, directivas y "atajos en línea"
  - H2: Sesiones, Compaction y poda (qué persiste)
  - H2: Qué informa realmente /context
  - H2: Relacionado

## concepts/delegate-architecture.md

- Ruta: /concepts/delegate-architecture
- Encabezados:
  - H2: ¿Qué es un delegado?
  - H2: ¿Por qué usar delegados?
  - H2: Niveles de capacidad
  - H3: Nivel 1: solo lectura + borrador
  - H3: Nivel 2: enviar en nombre de alguien
  - H3: Nivel 3: proactivo
  - H2: Requisitos previos: aislamiento y endurecimiento
  - H3: Bloqueos estrictos (no negociables)
  - H3: Restricciones de herramientas
  - H3: Aislamiento de sandbox
  - H3: Rastro de auditoría
  - H2: Configurar un delegado
  - H3: 1. Crear el agente delegado
  - H3: 2. Configurar la delegación del proveedor de identidad
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Vincular el delegado a canales
  - H3: 4. Añadir credenciales al agente delegado
  - H2: Ejemplo: asistente organizativo
  - H2: Patrón de escalado
  - H2: Relacionado

## concepts/dreaming.md

- Ruta: /concepts/dreaming
- Encabezados:
  - H2: Qué escribe Dreaming
  - H2: Modelo de fases
  - H2: Ingesta de transcripciones de sesión
  - H2: Dream Diary
  - H2: Señales de clasificación profunda
  - H2: Cobertura de informes de prueba sombra de QA
  - H2: Programación
  - H2: Inicio rápido
  - H2: Comando de barra
  - H2: Flujo de trabajo de CLI
  - H2: Valores predeterminados clave
  - H2: IU de sueños
  - H2: Dreaming nunca se ejecuta: el estado muestra bloqueado
  - H2: Relacionado

## concepts/experimental-features.md

- Ruta: /concepts/experimental-features
- Encabezados:
  - H2: Flags documentados actualmente
  - H2: Modo ligero de modelo local
  - H3: Por qué estas tres herramientas
  - H3: Cuándo activarlo
  - H3: Cuándo dejarlo desactivado
  - H3: Habilitar
  - H2: Experimental no significa oculto
  - H2: Relacionado

## concepts/features.md

- Ruta: /concepts/features
- Encabezados:
  - H2: Aspectos destacados
  - H2: Lista completa
  - H2: Relacionado

## concepts/mantis-slack-desktop-runbook.md

- Ruta: /concepts/mantis-slack-desktop-runbook
- Encabezados:
  - H2: Modelo de almacenamiento
  - H2: Despacho de GitHub
  - H2: CLI local
  - H2: Modos de hidratación
  - H2: Interpretación de tiempos
  - H2: Lista de verificación de evidencia
  - H2: Manejo de fallos
  - H2: Relacionado

## concepts/mantis.md

- Ruta: /concepts/mantis
- Encabezados:
  - H2: Objetivos
  - H2: No objetivos
  - H2: Propiedad
  - H2: Forma de los comandos
  - H2: Ciclo de vida de la ejecución
  - H2: MVP de Discord
  - H2: Piezas de QA existentes
  - H2: Modelo de evidencia
  - H2: Navegador y VNC
  - H2: Máquinas
  - H2: Secretos
  - H2: Artefactos de GitHub y comentarios de PR
  - H2: Notas de despliegue privado
  - H2: Añadir un escenario
  - H2: Expansión de proveedores
  - H2: Preguntas abiertas

## concepts/markdown-formatting.md

- Ruta: /concepts/markdown-formatting
- Encabezados:
  - H2: Objetivos
  - H2: Canalización
  - H2: Ejemplo de IR
  - H2: Dónde se usa
  - H2: Manejo de tablas
  - H2: Reglas de fragmentación
  - H2: Política de enlaces
  - H2: Spoilers
  - H2: Cómo añadir o actualizar un formateador de canal
  - H2: Problemas habituales
  - H2: Relacionado

## concepts/memory-builtin.md

- Ruta: /concepts/memory-builtin
- Encabezados:
  - H2: Qué proporciona
  - H2: Primeros pasos
  - H2: Proveedores de embeddings compatibles
  - H2: Cómo funciona la indexación
  - H2: Cuándo usarlo
  - H2: Solución de problemas
  - H2: Configuración
  - H2: Relacionado

## concepts/memory-honcho.md

- Ruta: /concepts/memory-honcho
- Encabezados:
  - H2: Qué proporciona
  - H2: Herramientas disponibles
  - H2: Primeros pasos
  - H2: Configuración
  - H2: Migrar memoria existente
  - H2: Cómo funciona
  - H2: Honcho frente a memoria integrada
  - H2: Comandos de CLI
  - H2: Lecturas adicionales
  - H2: Relacionado

## concepts/memory-qmd.md

- Ruta: /concepts/memory-qmd
- Encabezados:
  - H2: Qué añade respecto a la integrada
  - H2: Primeros pasos
  - H3: Requisitos previos
  - H3: Habilitar
  - H2: Cómo funciona el sidecar
  - H2: Rendimiento de búsqueda y compatibilidad
  - H2: Sobrescrituras de modelo
  - H2: Indexar rutas adicionales
  - H2: Indexar transcripciones de sesión
  - H2: Alcance de búsqueda
  - H2: Citas
  - H2: Cuándo usarlo
  - H2: Solución de problemas
  - H2: Configuración
  - H2: Relacionado

## concepts/memory-search.md

- Ruta: /concepts/memory-search
- Encabezados:
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H2: Cómo funciona la búsqueda
  - H2: Mejorar la calidad de búsqueda
  - H3: Decaimiento temporal
  - H3: MMR (diversidad)
  - H3: Habilitar ambos
  - H2: Memoria multimodal
  - H2: Búsqueda en memoria de sesión
  - H2: Solución de problemas
  - H2: Lecturas adicionales
  - H2: Relacionado

## concepts/memory.md

- Ruta: /concepts/memory
- Encabezados:
  - H2: Cómo funciona
  - H2: Qué va dónde
  - H2: Memorias sensibles a acciones
  - H2: Compromisos inferidos
  - H2: Herramientas de memoria
  - H2: Plugin complementario Memory Wiki
  - H2: Búsqueda en memoria
  - H2: Backends de memoria
  - H2: Capa de wiki de conocimiento
  - H2: Volcado automático de memoria
  - H2: Dreaming
  - H2: Relleno fundamentado y promoción en vivo
  - H2: CLI
  - H2: Lecturas adicionales
  - H2: Relacionado

## concepts/message-lifecycle-refactor.md

- Ruta: /concepts/message-lifecycle-refactor
- Encabezados:
  - H2: Problemas
  - H2: Objetivos
  - H2: No objetivos
  - H2: Modelo de referencia
  - H2: Modelo central
  - H2: Términos de mensaje
  - H3: Mensaje
  - H3: Destino
  - H3: Relación
  - H3: Origen
  - H3: Recibo
  - H2: Contexto de recepción
  - H2: Contexto de envío
  - H2: Contexto en vivo
  - H2: Superficie del adaptador
  - H2: Reducción del SDK público
  - H2: Relación con la entrada de canales
  - H2: Barreras de compatibilidad
  - H2: Almacenamiento interno
  - H2: Clases de fallo
  - H2: Mapeo de canales
  - H2: Plan de migración
  - H3: Fase 1: dominio interno de mensajes
  - H3: Fase 2: núcleo de envío duradero
  - H3: Fase 3: puente de entrada de canales
  - H3: Fase 4: puente de despachador preparado
  - H3: Fase 5: ciclo de vida en vivo unificado
  - H3: Fase 6: SDK público
  - H3: Fase 7: todos los remitentes
  - H3: Fase 8: eliminar compatibilidad con nombres de turnos
  - H2: Plan de pruebas
  - H2: Preguntas abiertas
  - H2: Criterios de aceptación
  - H2: Relacionado

## concepts/messages.md

- Ruta: /concepts/messages
- Encabezados:
  - H2: Flujo de mensajes (alto nivel)
  - H2: Deduplicación de entrada
  - H2: Antirrebote de entrada
  - H2: Sesiones y dispositivos
  - H2: Metadatos de resultados de herramientas
  - H2: Cuerpos de entrada y contexto de historial
  - H2: Encolado y seguimientos
  - H2: Propiedad de ejecución de canal
  - H2: Streaming, fragmentación y agrupación
  - H2: Visibilidad del razonamiento y tokens
  - H2: Prefijos, hilos y respuestas
  - H2: Respuestas silenciosas
  - H2: Relacionado

## concepts/model-failover.md

- Ruta: /concepts/model-failover
- Encabezados:
  - H2: Flujo de Runtime
  - H2: Política de fuente de selección
  - H2: Caché de omisión por fallo de autenticación
  - H2: Avisos de fallback visibles para el usuario
  - H2: Almacenamiento de autenticación (claves + OAuth)
  - H2: ID de perfil
  - H2: Orden de rotación
  - H3: Afinidad de sesión (compatible con caché)
  - H3: Suscripción a OpenAI Codex más respaldo con clave de API
  - H2: Enfriamientos
  - H2: Desactivaciones por facturación
  - H2: Fallback de modelo
  - H3: Reglas de cadena de candidatos
  - H3: Qué errores avanzan el fallback
  - H3: Omisión por enfriamiento frente a comportamiento de sondeo
  - H2: Sobrescrituras de sesión y cambio de modelo en vivo
  - H2: Observabilidad y resúmenes de fallos
  - H2: Configuración relacionada

## concepts/model-providers.md

- Ruta: /concepts/model-providers
- Encabezados:
  - H2: Reglas rápidas
  - H2: Comportamiento de proveedor propiedad del Plugin
  - H2: Rotación de claves de API
  - H2: Plugins de proveedor oficiales
  - H3: OpenAI
  - H3: Anthropic
  - H3: OAuth de OpenAI ChatGPT/Codex
  - H3: Otras opciones alojadas de estilo suscripción
  - H3: OpenCode
  - H3: Google Gemini (clave de API)
  - H3: Google Vertex y Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Otros plugins de proveedor incluidos
  - H4: Peculiaridades que conviene conocer
  - H2: Proveedores vía models.providers (URL personalizada/base)
  - H3: Moonshot AI (Kimi)
  - H3: Programación con Kimi
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (internacional)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proxies locales (LM Studio, vLLM, LiteLLM, etc.)
  - H2: Ejemplos de CLI
  - H2: Relacionado

## concepts/models.md

- Ruta: /concepts/models
- Encabezados:
  - H2: Cómo funciona la selección de modelo
  - H2: Fuente de selección y comportamiento de fallback
  - H2: Política rápida de modelos
  - H2: Incorporación (recomendada)
  - H2: Claves de configuración (descripción general)
  - H3: Ediciones seguras de la lista de permitidos
  - H2: "El modelo no está permitido" (y por qué se detienen las respuestas)
  - H2: Cambiar modelos en el chat (/model)
  - H2: Comandos de CLI
  - H3: models list
  - H3: models status
  - H2: Escaneo (modelos gratuitos de OpenRouter)
  - H2: Registro de modelos (models.json)
  - H2: Relacionado

## concepts/multi-agent.md

- Ruta: /concepts/multi-agent
- Encabezados:
  - H2: ¿Qué es "un agente"?
  - H2: Rutas (mapa rápido)
  - H3: Modo de agente único (predeterminado)
  - H2: Auxiliar de agente
  - H2: Inicio rápido
  - H2: Varios agentes = varias personas, varias personalidades
  - H2: Búsqueda de memoria QMD entre agentes
  - H2: Un número de WhatsApp, varias personas (división de DM)
  - H2: Reglas de enrutamiento (cómo los mensajes eligen un agente)
  - H2: Varias cuentas / números de teléfono
  - H2: Conceptos
  - H2: Ejemplos de plataforma
  - H2: Patrones habituales
  - H2: Sandbox por agente y configuración de herramientas
  - H2: Relacionado

## concepts/oauth.md

- Ruta: /concepts/oauth
- Encabezados:
  - H2: El receptor de tokens (por qué existe)
  - H2: Almacenamiento (dónde viven los tokens)
  - H2: Compatibilidad con tokens heredados de Anthropic
  - H2: Migración de Anthropic Claude CLI
  - H2: Intercambio OAuth (cómo funciona el inicio de sesión)
  - H3: setup-token de Anthropic
  - H3: OpenAI Codex (OAuth de ChatGPT)
  - H2: Actualización + caducidad
  - H2: Varias cuentas (perfiles) + enrutamiento
  - H3: 1) Preferido: agentes separados
  - H3: 2) Avanzado: varios perfiles en un agente
  - H2: Relacionado

## concepts/parallel-specialist-lanes.md

- Ruta: /concepts/parallel-specialist-lanes
- Encabezados:
  - H2: Primeros principios
  - H2: Despliegue recomendado
  - H3: Fase 1: contratos de carril + trabajo pesado en segundo plano
  - H3: Fase 2: controles de prioridad y concurrencia
  - H3: Fase 3: coordinador / controlador de tráfico
  - H2: Plantilla mínima de contrato de carril
  - H2: Relacionado

## concepts/personal-agent-benchmark-pack.md

- Ruta: /concepts/personal-agent-benchmark-pack
- Encabezados:
  - H2: Escenarios
  - H2: Modelo de privacidad
  - H2: Ampliar el paquete

## concepts/presence.md

- Ruta: /concepts/presence
- Encabezados:
  - H2: Campos de presencia (lo que se muestra)
  - H2: Productores (de dónde proviene la presencia)
  - H3: 1) Entrada propia de Gateway
  - H3: 2) Conexión WebSocket
  - H4: Por qué los comandos CLI puntuales no se muestran
  - H3: 3) Señales system-event
  - H3: 4) Node se conecta (role: node)
  - H2: Reglas de combinación + deduplicación (por qué importa instanceId)
  - H2: TTL y tamaño acotado
  - H2: Advertencia de remoto/túnel (IP de loopback)
  - H2: Consumidores
  - H3: Pestaña Instancias de macOS
  - H2: Consejos de depuración
  - H2: Relacionado

## concepts/progress-drafts.md

- Ruta: /concepts/progress-drafts
- Encabezados:
  - H2: Inicio rápido
  - H2: Lo que ven los usuarios
  - H2: Elegir un modo
  - H2: Configurar etiquetas
  - H2: Controlar líneas de progreso
  - H2: Comportamiento del canal
  - H2: Finalización
  - H2: Solución de problemas
  - H2: Relacionado

## concepts/qa-e2e-automation.md

- Ruta: /concepts/qa-e2e-automation
- Encabezados:
  - H2: Superficie de comandos
  - H2: Flujo del operador
  - H2: Cobertura de transporte en vivo
  - H2: Referencia de QA para Telegram, Discord, Slack y WhatsApp
  - H3: Flags CLI compartidos
  - H3: QA de Telegram
  - H3: QA de Discord
  - H3: QA de Slack
  - H4: Configurar el workspace de Slack
  - H3: QA de WhatsApp
  - H3: Pool de credenciales de Convex
  - H2: Semillas respaldadas por el repositorio
  - H2: Carriles de mock de proveedor
  - H2: Adaptadores de transporte
  - H3: Agregar un canal
  - H3: Nombres de helpers de escenario
  - H2: Informes
  - H2: Documentos relacionados

## concepts/qa-matrix.md

- Ruta: /concepts/qa-matrix
- Encabezados:
  - H2: Inicio rápido
  - H2: Qué hace el carril
  - H2: CLI
  - H3: Flags comunes
  - H3: Flags de proveedor
  - H2: Perfiles
  - H2: Escenarios
  - H2: Variables de entorno
  - H2: Artefactos de salida
  - H2: Consejos de triaje
  - H2: Contrato de transporte en vivo
  - H2: Relacionado

## concepts/queue-steering.md

- Ruta: /concepts/queue-steering
- Encabezados:
  - H2: Límite de runtime
  - H2: Modos
  - H2: Ejemplo de ráfaga
  - H2: Alcance
  - H2: Debounce
  - H2: Relacionado

## concepts/queue.md

- Ruta: /concepts/queue
- Encabezados:
  - H2: Por qué
  - H2: Cómo funciona
  - H2: Valores predeterminados
  - H2: Modos de cola
  - H2: Opciones de cola
  - H2: Dirigir y streaming
  - H2: Precedencia
  - H2: Overrides por sesión
  - H2: Alcance y garantías
  - H2: Solución de problemas
  - H2: Relacionado

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
  - H2: Relacionado

## concepts/session-pruning.md

- Ruta: /concepts/session-pruning
- Encabezados:
  - H2: Por qué importa
  - H2: Cómo funciona
  - H2: Limpieza de imágenes heredadas
  - H2: Valores predeterminados inteligentes
  - H2: Activar o desactivar
  - H2: Poda frente a Compaction
  - H2: Lecturas adicionales
  - H2: Relacionado

## concepts/session-tool.md

- Ruta: /concepts/session-tool
- Encabezados:
  - H2: Herramientas disponibles
  - H2: Listar y leer sesiones
  - H2: Enviar mensajes entre sesiones
  - H2: Helpers de estado y orquestación
  - H2: Generar subagentes
  - H2: Visibilidad
  - H2: Lecturas adicionales
  - H2: Relacionado

## concepts/session.md

- Ruta: /concepts/session
- Encabezados:
  - H2: Cómo se enrutan los mensajes
  - H2: Aislamiento de DM
  - H3: Canales vinculados al dock
  - H2: Ciclo de vida de la sesión
  - H2: Dónde reside el estado
  - H2: Mantenimiento de sesiones
  - H2: Inspeccionar sesiones
  - H2: Lecturas adicionales
  - H2: Relacionado

## concepts/soul.md

- Ruta: /concepts/soul
- Encabezados:
  - H2: Qué pertenece a SOUL.md
  - H2: Por qué funciona esto
  - H2: El prompt de Molty
  - H2: Cómo se ve algo bueno
  - H2: Una advertencia
  - H2: Relacionado

## concepts/streaming.md

- Ruta: /concepts/streaming
- Encabezados:
  - H2: Streaming por bloques (mensajes de canal)
  - H3: Entrega de medios con streaming por bloques
  - H2: Algoritmo de fragmentación (límites bajo/alto)
  - H2: Coalescencia (combinar bloques transmitidos)
  - H2: Ritmo similar al humano entre bloques
  - H2: "Transmitir fragmentos o todo"
  - H2: Modos de streaming de vista previa
  - H3: Mapeo de canales
  - H3: Comportamiento del runtime
  - H3: Actualizaciones de vista previa de progreso de herramientas
  - H3: Carril de progreso de comentario
  - H2: Relacionado

## concepts/system-prompt.md

- Ruta: /concepts/system-prompt
- Encabezados:
  - H2: Estructura
  - H2: Modos de prompt
  - H2: Snapshots de prompt
  - H2: Inyección de bootstrap del workspace
  - H2: Manejo del tiempo
  - H2: Skills
  - H2: Documentación
  - H2: Relacionado

## concepts/timezone.md

- Ruta: /concepts/timezone
- Encabezados:
  - H2: Tres superficies de zona horaria
  - H2: Configurar la zona horaria del usuario
  - H2: Cuándo hacer override
  - H2: Relacionado

## concepts/typebox.md

- Ruta: /concepts/typebox
- Encabezados:
  - H2: Modelo mental (30 segundos)
  - H2: Dónde residen los esquemas
  - H2: Pipeline actual
  - H2: Cómo se usan los esquemas en runtime
  - H2: Frames de ejemplo
  - H2: Cliente mínimo (Node.js)
  - H2: Ejemplo práctico: agregar un método de extremo a extremo
  - H2: Comportamiento de codegen de Swift
  - H2: Versionado + compatibilidad
  - H2: Patrones y convenciones de esquemas
  - H2: JSON de esquema en vivo
  - H2: Cuando cambias esquemas
  - H2: Relacionado

## concepts/typing-indicators.md

- Ruta: /concepts/typing-indicators
- Encabezados:
  - H2: Valores predeterminados
  - H2: Modos
  - H2: Configuración
  - H2: Notas
  - H2: Relacionado

## concepts/usage-tracking.md

- Ruta: /concepts/usage-tracking
- Encabezados:
  - H2: Qué es
  - H2: Dónde se muestra
  - H2: Modo predeterminado del pie de uso
  - H3: Tres estados de sesión distintos
  - H3: Precedencia
  - H3: Restablecer frente a desactivar
  - H3: Comportamiento del toggle
  - H3: Config
  - H2: Pie completo personalizado de /usage
  - H3: Forma
  - H3: Rutas de contrato
  - H3: Verbos
  - H3: Formas de pieza
  - H3: Ejemplo
  - H2: Proveedores + credenciales
  - H2: Relacionado

## date-time.md

- Ruta: /date-time
- Encabezados:
  - H2: Envoltorios de mensajes (locales de forma predeterminada)
  - H3: Ejemplos
  - H2: Prompt del sistema: fecha y hora actuales
  - H2: Líneas de eventos del sistema (locales de forma predeterminada)
  - H3: Configurar zona horaria + formato del usuario
  - H2: Detección de formato de hora (automática)
  - H2: Payloads de herramientas + conectores (hora sin procesar del proveedor + campos normalizados)
  - H2: Documentos relacionados

## debug/node-issue.md

- Ruta: /debug/node-issue
- Encabezados:
  - H1: Fallo de Node + tsx "\\name is not a function"
  - H2: Resumen
  - H2: Entorno
  - H2: Reproducción (solo Node)
  - H2: Reproducción mínima en el repositorio
  - H2: Comprobación de versión de Node
  - H2: Notas / hipótesis
  - H2: Historial de regresión
  - H2: Soluciones alternativas
  - H2: Referencias
  - H2: Próximos pasos
  - H2: Relacionado

## diagnostics/flags.md

- Ruta: /diagnostics/flags
- Encabezados:
  - H2: Cómo funciona
  - H2: Activar mediante config
  - H2: Override de entorno (puntual)
  - H2: Flags de profiling
  - H2: Artefactos de timeline
  - H2: Dónde van los logs
  - H2: Extraer logs
  - H2: Notas
  - H2: Relacionado

## gateway/authentication.md

- Ruta: /gateway/authentication
- Encabezados:
  - H2: Configuración recomendada (clave de API, cualquier proveedor)
  - H2: Anthropic: compatibilidad de Claude CLI y token
  - H2: Nota de Anthropic
  - H2: Comprobar el estado de autenticación del modelo
  - H2: Comportamiento de rotación de claves de API (gateway)
  - H2: Eliminar la autenticación de proveedor mientras Gateway se ejecuta
  - H2: Controlar qué credencial se usa
  - H3: OpenAI e IDs openai-codex heredados
  - H3: Durante el inicio de sesión (CLI)
  - H3: Por sesión (comando de chat)
  - H3: Por agente (override de CLI)
  - H2: Solución de problemas
  - H3: "No se encontraron credenciales"
  - H3: Token por expirar/expirado
  - H2: Relacionado

## gateway/background-process.md

- Ruta: /gateway/background-process
- Encabezados:
  - H2: herramienta exec
  - H2: Puenteo de procesos secundarios
  - H2: herramienta process
  - H2: Ejemplos
  - H2: Relacionado

## gateway/bonjour.md

- Ruta: /gateway/bonjour
- Encabezados:
  - H2: Bonjour de área amplia (DNS-SD unicast) sobre Tailscale
  - H3: Configuración de Gateway (recomendada)
  - H3: Configuración única del servidor DNS (host de Gateway)
  - H3: Configuración DNS de Tailscale
  - H3: Seguridad del listener de Gateway (recomendada)
  - H2: Qué anuncia
  - H2: Tipos de servicio
  - H2: Claves TXT (pistas no secretas)
  - H2: Depuración en macOS
  - H2: Depuración en logs de Gateway
  - H2: Depuración en node de iOS
  - H2: Cuándo activar Bonjour
  - H2: Cuándo desactivar Bonjour
  - H2: Problemas comunes de Docker
  - H2: Solución de problemas de Bonjour desactivado
  - H2: Modos de fallo comunes
  - H2: Nombres de instancia escapados (\032)
  - H2: Activación / desactivación / configuración
  - H2: Documentos relacionados

## gateway/bridge-protocol.md

- Ruta: /gateway/bridge-protocol
- Encabezados:
  - H2: Por qué existía
  - H2: Transporte
  - H2: Handshake + emparejamiento
  - H2: Frames
  - H2: Eventos de ciclo de vida de exec
  - H2: Uso histórico de tailnet
  - H2: Versionado
  - H2: Relacionado

## gateway/cli-backends.md

- Ruta: /gateway/cli-backends
- Encabezados:
  - H2: Inicio rápido para principiantes
  - H2: Usarlo como fallback
  - H2: Resumen de configuración
  - H3: Configuración de ejemplo
  - H2: Cómo funciona
  - H2: Sesiones
  - H2: Preludio de fallback desde sesiones claude-cli
  - H2: Imágenes (paso directo)
  - H2: Entradas / salidas
  - H2: Valores predeterminados (propiedad del Plugin)
  - H2: Valores predeterminados propiedad del Plugin
  - H2: Propiedad de la Compaction nativa
  - H2: Superposiciones MCP de bundle
  - H2: Límite de reseed de historial
  - H2: Limitaciones
  - H2: Solución de problemas
  - H2: Relacionado

## gateway/config-agents.md

- Ruta: /gateway/config-agents
- Encabezados:
  - H2: Valores predeterminados del agente
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Overrides de perfil de bootstrap por agente
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
  - H3: Política de runtime
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming por bloques
  - H3: Indicadores de escritura
  - H3: agents.defaults.sandbox
  - H3: agents.list (overrides por agente)
  - H2: Enrutamiento multiagente
  - H3: Campos de coincidencia de binding
  - H3: Perfiles de acceso por agente
  - H2: Sesión
  - H2: Mensajes
  - H3: Prefijo de respuesta
  - H3: Reacción de confirmación
  - H3: Debounce entrante
  - H3: TTS (texto a voz)
  - H2: Talk
  - H2: Relacionado

## gateway/config-channels.md

- Ruta: /gateway/config-channels
- Encabezados:
  - H2: Canales
  - H3: Acceso a DM y grupos
  - H3: Overrides de modelo por canal
  - H3: Valores predeterminados de canal y Heartbeat
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
  - H3: Multicuenta (todos los canales)
  - H3: Otros canales de Plugin
  - H3: Control de menciones en chats grupales
  - H4: Límites de historial de DM
  - H4: Modo de chat consigo mismo
  - H3: Comandos (manejo de comandos de chat)
  - H2: Relacionado

## gateway/config-tools.md

- Ruta: /gateway/config-tools
- Encabezados:
  - H2: Herramientas
  - H3: Perfiles de herramientas
  - H3: Grupos de herramientas
  - H3: Herramientas MCP y de plugin dentro de la política de herramientas del sandbox
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
  - H3: Detalles de campos del proveedor
  - H3: Ejemplos de proveedores
  - H2: Relacionado

## gateway/configuration-examples.md

- Ruta: /gateway/configuration-examples
- Encabezados:
  - H2: Inicio rápido
  - H3: Mínimo absoluto
  - H3: Configuración inicial recomendada
  - H2: Ejemplo ampliado (opciones principales)
  - H3: Repositorio de Skills hermano enlazado mediante symlink
  - H2: Patrones comunes
  - H3: Base compartida de Skills con una sobrescritura
  - H3: Configuración multiplataforma
  - H3: Aprobación automática de red de nodos de confianza
  - H3: Modo DM seguro (bandeja de entrada compartida / DM multiusuario)
  - H3: Clave de API de Anthropic + respaldo MiniMax
  - H3: Bot de trabajo (acceso restringido)
  - H3: Solo modelos locales
  - H2: Consejos
  - H2: Relacionado

## gateway/configuration-reference.md

- Ruta: /gateway/configuration-reference
- Encabezados:
  - H2: Canales
  - H2: Valores predeterminados del agente, multiagente, sesiones y mensajes
  - H2: Herramientas y proveedores personalizados
  - H2: Modelos
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Configuración del Plugin del arnés Codex
  - H2: Compromisos
  - H2: Navegador
  - H2: IU
  - H2: Gateway
  - H3: Endpoints compatibles con OpenAI
  - H3: Aislamiento multiinstancia
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooks
  - H3: Integración con Gmail
  - H2: Host del plugin Canvas
  - H2: Descubrimiento
  - H3: mDNS (Bonjour)
  - H3: Área amplia (DNS-SD)
  - H2: Entorno
  - H3: env (variables de entorno en línea)
  - H3: Sustitución de variables de entorno
  - H2: Secretos
  - H3: SecretRef
  - H3: Superficie de credenciales admitida
  - H3: Configuración de proveedores de secretos
  - H2: Almacenamiento de autenticación
  - H3: auth.cooldowns
  - H2: Registro
  - H2: Diagnósticos
  - H2: Actualización
  - H2: ACP
  - H2: CLI
  - H2: Asistente
  - H2: Identidad
  - H2: Puente (heredado, eliminado)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variables de plantilla del modelo de medios
  - H2: Inclusiones de configuración ($include)
  - H2: Relacionado

## gateway/configuration.md

- Ruta: /gateway/configuration
- Encabezados:
  - H2: Configuración mínima
  - H2: Editar configuración
  - H2: Validación estricta
  - H2: Tareas comunes
  - H2: Recarga en caliente de la configuración
  - H3: Modos de recarga
  - H3: Qué se aplica en caliente y qué necesita reinicio
  - H3: Planificación de recarga
  - H2: RPC de configuración (actualizaciones programáticas)
  - H2: Variables de entorno
  - H2: Referencia completa
  - H2: Relacionado

## gateway/diagnostics.md

- Ruta: /gateway/diagnostics
- Encabezados:
  - H2: Inicio rápido
  - H2: Comando de chat
  - H2: Qué contiene la exportación
  - H2: Modelo de privacidad
  - H2: Registrador de estabilidad
  - H2: Opciones útiles
  - H2: Desactivar diagnósticos
  - H2: Relacionado

## gateway/discovery.md

- Ruta: /gateway/discovery
- Encabezados:
  - H2: Términos
  - H2: Por qué conservamos tanto directo como SSH
  - H2: Entradas de descubrimiento (cómo los clientes aprenden dónde está el Gateway)
  - H3: 1) Descubrimiento Bonjour / DNS-SD
  - H4: Detalles del beacon de servicio
  - H3: 2) Tailnet (entre redes)
  - H3: 3) Objetivo manual / SSH
  - H2: Selección de transporte (política del cliente)
  - H2: Emparejamiento + autenticación (transporte directo)
  - H2: Responsabilidades por componente
  - H2: Relacionado

## gateway/doctor.md

- Ruta: /gateway/doctor
- Encabezados:
  - H2: Inicio rápido
  - H3: Modos headless y de automatización
  - H2: Modo lint de solo lectura
  - H2: Qué hace (resumen)
  - H2: Relleno y restablecimiento de la IU de Dreams
  - H2: Comportamiento detallado y justificación
  - H2: Relacionado

## gateway/external-apps.md

- Ruta: /gateway/external-apps
- Encabezados:
  - H2: Qué está disponible hoy
  - H2: Ruta recomendada
  - H2: Código de la app frente a código del plugin
  - H2: Relacionado

## gateway/gateway-lock.md

- Ruta: /gateway/gateway-lock
- Encabezados:
  - H2: Por qué
  - H2: Mecanismo
  - H2: Superficie de error
  - H2: Notas operativas
  - H2: Relacionado

## gateway/health.md

- Ruta: /gateway/health
- Encabezados:
  - H2: Comprobaciones rápidas
  - H2: Diagnósticos profundos
  - H2: Configuración del monitor de estado
  - H2: Monitoreo de tiempo de actividad
  - H3: Ejemplos de configuración de servicios de monitoreo
  - H2: Cuando algo falla
  - H2: Comando dedicado "health"
  - H2: Relacionado

## gateway/heartbeat.md

- Ruta: /gateway/heartbeat
- Encabezados:
  - H2: Inicio rápido (principiante)
  - H2: Valores predeterminados
  - H2: Para qué sirve el prompt de Heartbeat
  - H2: Contrato de respuesta
  - H2: Configuración
  - H3: Alcance y precedencia
  - H3: Heartbeats por agente
  - H3: Ejemplo de horario activo
  - H3: Configuración 24/7
  - H3: Ejemplo multicuenta
  - H3: Notas de campo
  - H2: Comportamiento de entrega
  - H2: Controles de visibilidad
  - H3: Qué hace cada marca
  - H3: Ejemplos por canal frente a por cuenta
  - H3: Patrones comunes
  - H2: HEARTBEAT.md (opcional)
  - H3: Bloques tasks:
  - H3: ¿Puede el agente actualizar HEARTBEAT.md?
  - H2: Activación manual (a demanda)
  - H2: Entrega de razonamiento (opcional)
  - H2: Conciencia de costos
  - H2: Desbordamiento de contexto después del Heartbeat
  - H2: Relacionado

## gateway/index.md

- Ruta: /gateway
- Encabezados:
  - H2: Inicio local en 5 minutos
  - H2: Modelo de runtime
  - H2: Endpoints compatibles con OpenAI
  - H3: Precedencia de puerto y enlace
  - H3: Modos de recarga en caliente
  - H2: Conjunto de comandos del operador
  - H2: Múltiples gateways (mismo host)
  - H2: Acceso remoto
  - H2: Supervisión y ciclo de vida del servicio
  - H2: Ruta rápida del perfil de desarrollo
  - H2: Referencia rápida del protocolo (vista del operador)
  - H2: Comprobaciones operativas
  - H3: Vitalidad
  - H3: Preparación
  - H3: Recuperación de brechas
  - H2: Firmas de fallo comunes
  - H2: Garantías de seguridad
  - H2: Relacionado

## gateway/local-model-services.md

- Ruta: /gateway/local-model-services
- Encabezados:
  - H2: Cómo funciona
  - H2: Forma de la configuración
  - H2: Campos
  - H2: Ejemplo de Inferrs
  - H2: Ejemplo de ds4
  - H2: Notas operativas
  - H2: Relacionado

## gateway/local-models.md

- Ruta: /gateway/local-models
- Encabezados:
  - H2: Hardware mínimo
  - H2: Elige un backend
  - H2: Recomendado: LM Studio + modelo local grande (Responses API)
  - H3: Configuración híbrida: principal hospedado, respaldo local
  - H3: Local primero con red de seguridad hospedada
  - H3: Hospedaje regional / enrutamiento de datos
  - H2: Otros proxies locales compatibles con OpenAI
  - H2: Backends más pequeños o más estrictos
  - H2: Solución de problemas
  - H2: Relacionado

## gateway/logging.md

- Ruta: /gateway/logging
- Encabezados:
  - H1: Registro
  - H2: Registrador basado en archivos
  - H2: Captura de consola
  - H2: Redacción
  - H2: Registros WebSocket del Gateway
  - H3: Estilo de registro WS
  - H2: Formato de consola (registro de subsistemas)
  - H2: Relacionado

## gateway/multiple-gateways.md

- Ruta: /gateway/multiple-gateways
- Encabezados:
  - H2: Mejor configuración recomendada
  - H2: Inicio rápido de Rescue-Bot
  - H2: Por qué funciona
  - H2: Qué cambia --profile rescue onboard
  - H2: Configuración general de múltiples gateways
  - H2: Lista de comprobación de aislamiento
  - H2: Mapeo de puertos (derivado)
  - H2: Notas de navegador/CDP (error común)
  - H2: Ejemplo manual de env
  - H2: Comprobaciones rápidas
  - H2: Relacionado

## gateway/network-model.md

- Ruta: /gateway/network-model
- Encabezados:
  - H2: Relacionado

## gateway/openai-http-api.md

- Ruta: /gateway/openai-http-api
- Encabezados:
  - H2: Autenticación
  - H2: Límite de seguridad (importante)
  - H2: Cuándo usar este endpoint
  - H2: Contrato de modelo agent-first
  - H2: Habilitar el endpoint
  - H2: Deshabilitar el endpoint
  - H2: Comportamiento de sesión
  - H2: Por qué importa esta superficie
  - H2: Lista de modelos y enrutamiento de agentes
  - H2: Streaming (SSE)
  - H2: Contrato de herramientas de chat
  - H3: Campos de solicitud admitidos
  - H3: Variantes no admitidas
  - H3: Forma de respuesta de herramienta sin streaming
  - H3: Forma de respuesta de herramienta con streaming
  - H3: Bucle de seguimiento de herramienta
  - H2: Configuración rápida de Open WebUI
  - H2: Ejemplos
  - H2: Relacionado

## gateway/openresponses-http-api.md

- Ruta: /gateway/openresponses-http-api
- Encabezados:
  - H2: Autenticación, seguridad y enrutamiento
  - H2: Comportamiento de sesión
  - H2: Forma de solicitud (admitida)
  - H2: Elementos (entrada)
  - H3: message
  - H3: functioncalloutput (herramientas por turnos)
  - H3: reasoning e itemreference
  - H2: Herramientas (herramientas de función del lado del cliente)
  - H2: Imágenes (inputimage)
  - H2: Archivos (inputfile)
  - H2: Límites de archivo + imagen (configuración)
  - H2: Streaming (SSE)
  - H2: Uso
  - H2: Errores
  - H2: Ejemplos
  - H2: Relacionado

## gateway/openshell.md

- Ruta: /gateway/openshell
- Encabezados:
  - H2: Requisitos previos
  - H2: Inicio rápido
  - H2: Modos de espacio de trabajo
  - H3: mirror
  - H3: remote
  - H3: Elegir un modo
  - H2: Referencia de configuración
  - H2: Ejemplos
  - H3: Configuración remota mínima
  - H3: Modo mirror con GPU
  - H3: OpenShell por agente con gateway personalizado
  - H2: Gestión del ciclo de vida
  - H3: Cuándo recrear
  - H2: Refuerzo de seguridad
  - H2: Limitaciones actuales
  - H2: Cómo funciona
  - H2: Relacionado

## gateway/opentelemetry.md

- Ruta: /gateway/opentelemetry
- Encabezados:
  - H2: Cómo encaja todo
  - H2: Inicio rápido
  - H2: Señales exportadas
  - H2: Referencia de configuración
  - H3: Variables de entorno
  - H2: Privacidad y captura de contenido
  - H2: Muestreo y vaciado
  - H2: Métricas exportadas
  - H3: Uso del modelo
  - H3: Flujo de mensajes
  - H3: Talk
  - H3: Colas y sesiones
  - H3: Telemetría de vitalidad de sesión
  - H3: Ciclo de vida del arnés
  - H3: Ejecución de herramientas
  - H3: Exec
  - H3: Internos de diagnóstico (memoria y bucle de herramientas)
  - H2: Spans exportados
  - H2: Catálogo de eventos de diagnóstico
  - H2: Sin un exportador
  - H2: Desactivar
  - H2: Relacionado

## gateway/operator-scopes.md

- Ruta: /gateway/operator-scopes
- Encabezados:
  - H2: Roles
  - H2: Niveles de alcance
  - H2: El alcance del método es solo la primera puerta
  - H2: Aprobaciones de emparejamiento de dispositivos
  - H2: Aprobaciones de emparejamiento de nodos
  - H2: Autenticación por secreto compartido

## gateway/pairing.md

- Ruta: /gateway/pairing
- Encabezados:
  - H2: Conceptos
  - H2: Cómo funciona el emparejamiento
  - H2: Flujo de trabajo CLI (apto para headless)
  - H2: Superficie de API (protocolo Gateway)
  - H2: Control de comandos de Node (2026.3.31+)
  - H2: Límites de confianza de eventos de Node (2026.3.31+)
  - H2: Aprobación automática (app de macOS)
  - H2: Aprobación automática de dispositivos Trusted-CIDR
  - H2: Aprobación automática por actualización de metadatos
  - H2: Ayudantes de emparejamiento QR
  - H2: Localidad y encabezados reenviados
  - H2: Almacenamiento (local, privado)
  - H2: Comportamiento de transporte
  - H2: Relacionado

## gateway/prometheus.md

- Ruta: /gateway/prometheus
- Encabezados:
  - H2: Inicio rápido
  - H2: Métricas exportadas
  - H2: Política de etiquetas
  - H2: Recetas PromQL
  - H2: Elegir entre Prometheus y exportación de OpenTelemetry
  - H2: Solución de problemas
  - H2: Relacionado

## gateway/protocol.md

- Ruta: /gateway/protocol
- Encabezados:
  - H2: Transporte
  - H2: Handshake (conexión)
  - H3: Ejemplo de Node
  - H2: Framing
  - H2: Roles + alcances
  - H3: Roles
  - H3: Alcances (operador)
  - H3: Caps/comandos/permisos (nodo)
  - H2: Presencia
  - H3: Evento de Node vivo en segundo plano
  - H2: Delimitación de eventos de difusión
  - H2: Familias comunes de métodos RPC
  - H3: Familias comunes de eventos
  - H3: Métodos auxiliares de Node
  - H3: RPC del libro mayor de tareas
  - H3: Métodos auxiliares del operador
  - H3: Vistas models.list
  - H2: Aprobaciones de exec
  - H2: Fallback de entrega de agentes
  - H2: Versionado
  - H3: Constantes del cliente
  - H2: Autenticación
  - H2: Identidad de dispositivo + emparejamiento
  - H3: Diagnósticos de migración de autenticación de dispositivos
  - H2: TLS + pinning
  - H2: Alcance
  - H2: Relacionado

## gateway/remote-gateway-readme.md

- Ruta: /gateway/remote-gateway-readme
- Encabezados:
  - H1: Ejecutar OpenClaw.app con un Gateway remoto
  - H2: Resumen
  - H2: Configuración rápida
  - H3: Paso 1: Añadir configuración SSH
  - H3: Paso 2: Copiar clave SSH
  - H3: Paso 3: Configurar autenticación del Gateway remoto
  - H3: Paso 4: Iniciar túnel SSH
  - H3: Paso 5: Reiniciar OpenClaw.app
  - H2: Iniciar túnel automáticamente al iniciar sesión
  - H3: Crear el archivo PLIST
  - H3: Cargar el agente Launch
  - H2: Solución de problemas
  - H2: Cómo funciona
  - H2: Relacionado

## gateway/remote.md

- Ruta: /gateway/remote
- Encabezados:
  - H2: La idea central
  - H2: Configuraciones comunes de VPN y tailnet
  - H3: Gateway siempre activo en tu tailnet
  - H3: El escritorio de casa ejecuta el Gateway
  - H3: El portátil ejecuta el Gateway
  - H2: Flujo de comandos (qué se ejecuta dónde)
  - H2: Túnel SSH (CLI + herramientas)
  - H2: Valores predeterminados remotos de la CLI
  - H2: Prioridad de credenciales
  - H2: Acceso remoto a la interfaz de chat
  - H2: Modo remoto de la app de macOS
  - H2: Reglas de seguridad (remoto/VPN)
  - H3: macOS: túnel SSH persistente mediante LaunchAgent
  - H4: Paso 1: añadir configuración SSH
  - H4: Paso 2: copiar clave SSH (una sola vez)
  - H4: Paso 3: configurar el token del gateway
  - H4: Paso 4: crear el LaunchAgent
  - H4: Paso 5: cargar el LaunchAgent
  - H4: Solución de problemas
  - H2: Relacionado

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Ruta: /gateway/sandbox-vs-tool-policy-vs-elevated
- Encabezados:
  - H2: Depuración rápida
  - H2: Sandbox: dónde se ejecutan las herramientas
  - H3: Montajes vinculados (comprobación rápida de seguridad)
  - H2: Política de herramientas: qué herramientas existen/pueden invocarse
  - H3: Grupos de herramientas (atajos)
  - H2: Elevado: "ejecutar en el host" solo para exec
  - H2: Correcciones comunes para la "jaula del sandbox"
  - H3: "Herramienta X bloqueada por la política de herramientas del sandbox"
  - H3: "Pensé que esto era main, ¿por qué está en sandbox?"
  - H2: Relacionado

## gateway/sandboxing.md

- Ruta: /gateway/sandboxing
- Encabezados:
  - H2: Qué se ejecuta en sandbox
  - H2: Modos
  - H2: Alcance
  - H2: Backend
  - H3: Elegir un backend
  - H3: Backend de Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Modos de workspace
  - H4: Ciclo de vida de OpenShell
  - H2: Acceso al workspace
  - H2: Montajes vinculados personalizados
  - H2: Imágenes y configuración
  - H2: setupCommand (configuración única del contenedor)
  - H2: Política de herramientas y vías de escape
  - H2: Sobrescrituras multiagente
  - H2: Ejemplo mínimo de activación
  - H2: Relacionado

## gateway/secrets-plan-contract.md

- Ruta: /gateway/secrets-plan-contract
- Encabezados:
  - H2: Forma del archivo de plan
  - H2: Upserts y eliminaciones de proveedor
  - H2: Alcance de destino admitido
  - H2: Comportamiento del tipo de destino
  - H2: Reglas de validación de rutas
  - H2: Comportamiento ante fallos
  - H2: Comportamiento de consentimiento del proveedor exec
  - H2: Notas de alcance de runtime y auditoría
  - H2: Comprobaciones del operador
  - H2: Documentos relacionados

## gateway/secrets.md

- Ruta: /gateway/secrets
- Encabezados:
  - H2: Objetivos y modelo de runtime
  - H2: Límite de acceso del agente
  - H2: Filtrado de superficie activa
  - H2: Diagnósticos de superficie de autenticación del Gateway
  - H2: Verificación previa de referencia de onboarding
  - H2: Contrato SecretRef
  - H2: Configuración del proveedor
  - H2: Claves de API respaldadas por archivo
  - H2: Ejemplos de integración exec
  - H2: Variables de entorno del servidor MCP
  - H2: Material de autenticación SSH del sandbox
  - H2: Superficie de credenciales admitida
  - H2: Comportamiento requerido y prioridad
  - H2: Desencadenadores de activación
  - H2: Señales degradadas y recuperadas
  - H2: Resolución de rutas de comandos
  - H2: Flujo de trabajo de auditoría y configuración
  - H2: Política de seguridad unidireccional
  - H2: Notas de compatibilidad de autenticación heredada
  - H2: Nota sobre la interfaz web
  - H2: Relacionado

## gateway/security/audit-checks.md

- Ruta: /gateway/security/audit-checks
- Encabezados:
  - H2: Relacionado

## gateway/security/exposure-runbook.md

- Ruta: /gateway/security/exposure-runbook
- Encabezados:
  - H2: Elegir el patrón de exposición
  - H2: Inventario previo
  - H2: Comprobaciones de referencia
  - H2: Línea base segura mínima
  - H2: Exposición de DM y grupos
  - H2: Comprobaciones de proxy inverso
  - H2: Revisión de herramientas y sandbox
  - H2: Validación posterior al cambio
  - H2: Plan de reversión
  - H2: Lista de comprobación de revisión

## gateway/security/index.md

- Ruta: /gateway/security
- Encabezados:
  - H2: Primero el alcance: modelo de seguridad del asistente personal
  - H2: Comprobación rápida: openclaw security audit
  - H3: Bloqueo de dependencias del paquete publicado
  - H3: Confianza en despliegue y host
  - H3: Operaciones de archivo seguras
  - H3: Workspace compartido de Slack: riesgo real
  - H3: Agente compartido en la empresa: patrón aceptable
  - H2: Concepto de confianza de Gateway y nodo
  - H2: Matriz de límites de confianza
  - H2: No son vulnerabilidades por diseño
  - H2: Línea base reforzada en 60 segundos
  - H2: Regla rápida para bandeja de entrada compartida
  - H2: Modelo de visibilidad del contexto
  - H2: Qué comprueba la auditoría (alto nivel)
  - H2: Mapa de almacenamiento de credenciales
  - H2: Lista de comprobación de auditoría de seguridad
  - H2: Glosario de auditoría de seguridad
  - H2: Interfaz de control por HTTP
  - H2: Resumen de flags inseguros o peligrosos
  - H2: Configuración de proxy inverso
  - H2: Notas sobre HSTS y origen
  - H2: Los logs de sesión locales viven en disco
  - H2: Ejecución en Node (system.run)
  - H2: Skills dinámicas (watcher / nodos remotos)
  - H2: El modelo de amenazas
  - H2: Concepto central: control de acceso antes que inteligencia
  - H2: Modelo de autorización de comandos
  - H2: Riesgo de herramientas del plano de control
  - H2: Plugins
  - H2: Modelo de acceso a DM: emparejamiento, lista de permitidos, abierto, deshabilitado
  - H2: Aislamiento de sesiones de DM (modo multiusuario)
  - H3: Modo de DM seguro (recomendado)
  - H2: Listas de permitidos para DM y grupos
  - H2: Inyección de prompts (qué es y por qué importa)
  - H2: Saneamiento de tokens especiales en contenido externo
  - H2: Flags de omisión insegura para contenido externo
  - H3: La inyección de prompts no requiere DM públicos
  - H3: Backends LLM autoalojados
  - H3: Potencia del modelo (nota de seguridad)
  - H2: Razonamiento y salida detallada en grupos
  - H2: Ejemplos de refuerzo de configuración
  - H3: Permisos de archivos
  - H3: Exposición de red (bind, puerto, firewall)
  - H3: Publicación de puertos de Docker con UFW
  - H3: Detección mDNS/Bonjour
  - H3: Bloquear el WebSocket del Gateway (autenticación local)
  - H3: Encabezados de identidad de Tailscale Serve
  - H3: Control del navegador mediante host de nodo (recomendado)
  - H3: Secretos en disco
  - H3: Archivos .env del workspace
  - H3: Logs y transcripciones (redacción y retención)
  - H3: DM: emparejamiento por defecto
  - H3: Grupos: exigir mención en todas partes
  - H3: Números separados (WhatsApp, Signal, Telegram)
  - H3: Modo de solo lectura (mediante sandbox y herramientas)
  - H3: Línea base segura (copiar/pegar)
  - H2: Sandboxing (recomendado)
  - H3: Guardarraíl para delegación a subagentes
  - H2: Riesgos del control del navegador
  - H3: Política SSRF del navegador (estricta por defecto)
  - H2: Perfiles de acceso por agente (multiagente)
  - H3: Ejemplo: acceso completo (sin sandbox)
  - H3: Ejemplo: herramientas de solo lectura + workspace de solo lectura
  - H3: Ejemplo: sin acceso al sistema de archivos/shell (mensajería de proveedor permitida)
  - H2: Respuesta a incidentes
  - H3: Contener
  - H3: Rotar (asumir compromiso si se filtraron secretos)
  - H3: Auditar
  - H3: Recopilar para un informe
  - H2: Escaneo de secretos
  - H2: Informar problemas de seguridad

## gateway/security/secure-file-operations.md

- Ruta: /gateway/security/secure-file-operations
- Encabezados:
  - H2: Predeterminado: sin helper de Python
  - H2: Qué permanece protegido sin Python
  - H2: Qué añade Python
  - H2: Guía para Plugin y core

## gateway/security/shrinkwrap.md

- Ruta: /gateway/security/shrinkwrap
- Encabezados:
  - H2: La versión fácil
  - H2: Por qué OpenClaw lo usa
  - H2: Detalles técnicos

## gateway/tailscale.md

- Ruta: /gateway/tailscale
- Encabezados:
  - H2: Modos
  - H2: Autenticación
  - H2: Ejemplos de configuración
  - H3: Solo tailnet (Serve)
  - H3: Solo tailnet (vincular a la IP de Tailnet)
  - H3: Internet pública (Funnel + contraseña compartida)
  - H2: Ejemplos de CLI
  - H2: Notas
  - H2: Control del navegador (Gateway remoto + navegador local)
  - H2: Requisitos previos y límites de Tailscale
  - H2: Más información
  - H2: Relacionado

## gateway/tools-invoke-http-api.md

- Ruta: /gateway/tools-invoke-http-api
- Encabezados:
  - H2: Autenticación
  - H2: Límite de seguridad (importante)
  - H2: Cuerpo de la solicitud
  - H2: Comportamiento de política + enrutamiento
  - H2: Respuestas
  - H2: Ejemplo
  - H2: Relacionado

## gateway/troubleshooting.md

- Ruta: /gateway/troubleshooting
- Encabezados:
  - H2: Escalera de comandos
  - H2: Después de una actualización
  - H2: Instalaciones con cerebro dividido y guarda de configuración más nueva
  - H2: Incompatibilidad de protocolo después de revertir
  - H2: Symlink de Skill omitido como escape de ruta
  - H2: Anthropic 429 requiere uso extra para contexto largo
  - H2: Respuestas upstream 403 bloqueadas
  - H2: Backend local compatible con OpenAI pasa sondas directas pero fallan las ejecuciones de agente
  - H2: Sin respuestas
  - H2: Conectividad de la interfaz de control del panel
  - H3: Mapa rápido de códigos de detalle de autenticación
  - H2: El servicio Gateway no se está ejecutando
  - H2: Gateway en macOS deja de responder silenciosamente y luego se reanuda cuando tocas el panel
  - H2: Gateway sale durante un uso elevado de memoria
  - H2: Gateway rechazó una configuración inválida
  - H2: Advertencias de sonda de Gateway
  - H2: Canal conectado, mensajes sin fluir
  - H2: Entrega de Cron y Heartbeat
  - H2: Nodo emparejado, la herramienta falla
  - H2: La herramienta de navegador falla
  - H2: Si actualizaste y algo se rompió de repente
  - H2: Relacionado

## gateway/trusted-proxy-auth.md

- Ruta: /gateway/trusted-proxy-auth
- Encabezados:
  - H2: Cuándo usarlo
  - H2: Cuándo NO usarlo
  - H2: Cómo funciona
  - H2: Comportamiento de emparejamiento de la interfaz de control
  - H2: Configuración
  - H3: Referencia de configuración
  - H2: Terminación TLS y HSTS
  - H3: Guía de despliegue gradual
  - H2: Ejemplos de configuración de proxy
  - H2: Configuración mixta de tokens
  - H2: Encabezado de alcances de operador
  - H2: Lista de comprobación de seguridad
  - H2: Auditoría de seguridad
  - H2: Solución de problemas
  - H2: Migración desde autenticación con token
  - H2: Relacionado

## help/debugging.md

- Ruta: /help/debugging
- Encabezados:
  - H2: Sobrescrituras de depuración de runtime
  - H2: Salida de traza de sesión
  - H2: Traza del ciclo de vida del Plugin
  - H2: Arranque de la CLI y perfilado de comandos
  - H2: Modo de observación de Gateway
  - H2: Perfil dev + gateway dev (--dev)
  - H2: Registro de flujo sin procesar (OpenClaw)
  - H2: Registro de fragmentos sin procesar compatibles con OpenAI
  - H2: Notas de seguridad
  - H2: Depuración en VSCode
  - H3: Configuración
  - H3: Notas
  - H2: Relacionado

## help/environment.md

- Ruta: /help/environment
- Encabezados:
  - H2: Prioridad (mayor → menor)
  - H2: Credenciales de proveedor y .env del workspace
  - H2: Bloque env de configuración
  - H2: Importación de env de shell
  - H2: Instantáneas de shell exec
  - H2: Variables de entorno inyectadas por runtime
  - H2: Variables de entorno de la interfaz
  - H2: Sustitución de variables de entorno en config
  - H2: Referencias secretas frente a cadenas ${ENV}
  - H2: Variables de entorno relacionadas con rutas
  - H2: Registro
  - H3: OPENCLAWHOME
  - H2: Usuarios de nvm: fallos de TLS de webfetch
  - H2: Variables de entorno heredadas
  - H2: Relacionado

## help/faq-first-run.md

- Ruta: /help/faq-first-run
- Encabezados:
  - H2: Inicio rápido y configuración de primera ejecución
  - H2: Relacionado

## help/faq-models.md

- Ruta: /help/faq-models
- Encabezados:
  - H2: Modelos: valores predeterminados, selección, alias, cambio
  - H2: Failover de modelo y "Todos los modelos fallaron"
  - H2: Perfiles de autenticación: qué son y cómo gestionarlos
  - H2: Relacionado

## help/faq.md

- Ruta: /help/faq
- Encabezados:
  - H2: Primeros 60 segundos si algo está roto
  - H2: Inicio rápido y configuración de primera ejecución
  - H2: ¿Qué es OpenClaw?
  - H2: Skills y automatización
  - H2: Sandboxing y memoria
  - H2: Dónde viven las cosas en disco
  - H2: Aspectos básicos de configuración
  - H2: Gateways y nodos remotos
  - H2: Variables de entorno y carga de .env
  - H2: Sesiones y múltiples chats
  - H2: Modelos, failover y perfiles de autenticación
  - H2: Gateway: puertos, "ya en ejecución" y modo remoto
  - H2: Registro y depuración
  - H2: Medios y adjuntos
  - H2: Seguridad y control de acceso
  - H2: Comandos de chat, cancelar tareas y "no se detiene"
  - H2: Miscelánea
  - H2: Relacionado

## help/index.md

- Ruta: /help
- Encabezados:
  - H2: Preguntas frecuentes
  - H2: Diagnósticos
  - H2: Pruebas
  - H2: Comunidad y metainformación

## help/scripts.md

- Ruta: /help/scripts
- Encabezados:
  - H2: Convenciones
  - H2: Scripts de monitoreo de autenticación
  - H2: Helper de lectura de GitHub
  - H2: Al añadir scripts
  - H2: Relacionado

## help/testing-live.md

- Ruta: /help/testing-live
- Encabezados:
  - H2: En vivo: comandos locales de prueba de humo
  - H2: En vivo: barrido de capacidades de nodo Android
  - H2: En vivo: prueba de humo de modelos (claves de perfil)
  - H3: Capa 1: finalización directa del modelo (sin gateway)
  - H3: Capa 2: Gateway + prueba de humo del agente de desarrollo (lo que realmente hace "@openclaw")
  - H2: En vivo: prueba de humo del backend CLI (Claude, Gemini u otras CLI locales)
  - H2: En vivo: accesibilidad del proxy HTTP/2 de APNs
  - H2: En vivo: prueba de humo de enlace ACP (/acp spawn ... --bind here)
  - H2: En vivo: prueba de humo del arnés app-server de Codex
  - H3: Recetas en vivo recomendadas
  - H2: En vivo: matriz de modelos (lo que cubrimos)
  - H3: Conjunto moderno de pruebas de humo (llamadas a herramientas + imagen)
  - H3: Línea base: llamadas a herramientas (Read + Exec opcional)
  - H3: Visión: envío de imagen (adjunto → mensaje multimodal)
  - H3: Agregadores / gateways alternativos
  - H2: Credenciales (nunca confirmar)
  - H2: Deepgram en vivo (transcripción de audio)
  - H2: Plan de codificación BytePlus en vivo
  - H2: Medios de flujo de trabajo ComfyUI en vivo
  - H2: Generación de imágenes en vivo
  - H2: Generación de música en vivo
  - H2: Generación de video en vivo
  - H2: Arnés de medios en vivo
  - H2: Relacionado

## help/testing-updates-plugins.md

- Ruta: /help/testing-updates-plugins
- Encabezados:
  - H2: Lo que protegemos
  - H2: Prueba local durante el desarrollo
  - H2: Carriles de Docker
  - H2: Aceptación de paquetes
  - H2: Valor predeterminado de lanzamiento
  - H2: Compatibilidad heredada
  - H2: Agregar cobertura
  - H2: Triage de fallos

## help/testing.md

- Ruta: /help/testing
- Encabezados:
  - H2: Inicio rápido
  - H2: Directorios temporales de pruebas
  - H2: Ejecutores específicos de QA
  - H3: Credenciales compartidas de Telegram mediante Convex (v1)
  - H3: Agregar un canal a QA
  - H2: Suites de pruebas (qué se ejecuta dónde)
  - H3: Unidad / integración (predeterminado)
  - H3: Estabilidad (gateway)
  - H3: E2E (agregado del repositorio)
  - H3: E2E (prueba de humo del gateway)
  - H3: E2E (navegador simulado de Control UI)
  - H3: E2E: prueba de humo del backend OpenShell
  - H3: En vivo (proveedores reales + modelos reales)
  - H2: ¿Qué suite debería ejecutar?
  - H2: Pruebas en vivo (con acceso a la red)
  - H2: Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")
  - H2: Sanidad de la documentación
  - H2: Regresión sin conexión (segura para CI)
  - H2: Evaluaciones de confiabilidad del agente (skills)
  - H2: Pruebas de contrato (forma de Plugin y canal)
  - H3: Comandos
  - H3: Contratos de canal
  - H3: Contratos de estado de proveedor
  - H3: Contratos de proveedor
  - H3: Cuándo ejecutar
  - H2: Agregar regresiones (guía)
  - H2: Relacionado

## help/troubleshooting.md

- Ruta: /help/troubleshooting
- Encabezados:
  - H2: Primeros 60 segundos
  - H2: El asistente se siente limitado o le faltan herramientas
  - H2: Contexto largo de Anthropic 429
  - H2: El backend local compatible con OpenAI funciona directamente pero falla en OpenClaw
  - H2: La instalación del Plugin falla porque faltan extensiones de openclaw
  - H2: La política de instalación bloquea instalaciones o actualizaciones de plugins
  - H2: Plugin presente pero bloqueado por propiedad sospechosa
  - H2: Árbol de decisiones
  - H2: Relacionado

## index.md

- Ruta: /
- Encabezados:
  - H1: OpenClaw 🦞
  - H2: ¿Qué es OpenClaw?
  - H2: Cómo funciona
  - H2: Capacidades clave
  - H2: Inicio rápido
  - H2: Panel
  - H2: Configuración (opcional)
  - H2: Empieza aquí
  - H2: Más información

## install/ansible.md

- Ruta: /install/ansible
- Encabezados:
  - H2: Requisitos previos
  - H2: Lo que obtienes
  - H2: Inicio rápido
  - H2: Lo que se instala
  - H2: Configuración posterior a la instalación
  - H3: Comandos rápidos
  - H2: Arquitectura de seguridad
  - H2: Instalación manual
  - H2: Actualización
  - H2: Solución de problemas
  - H2: Configuración avanzada
  - H2: Relacionado

## install/azure.md

- Ruta: /install/azure
- Encabezados:
  - H2: Qué harás
  - H2: Qué necesitas
  - H2: Configurar la implementación
  - H2: Implementar recursos de Azure
  - H2: Instalar OpenClaw
  - H2: Consideraciones de costo
  - H2: Limpieza
  - H2: Próximos pasos
  - H2: Relacionado

## install/bun.md

- Ruta: /install/bun
- Encabezados:
  - H2: Instalar
  - H2: Scripts de ciclo de vida
  - H2: Advertencias
  - H2: Relacionado

## install/clawdock.md

- Ruta: /install/clawdock
- Encabezados:
  - H2: Instalar
  - H2: Lo que obtienes
  - H3: Operaciones básicas
  - H3: Acceso al contenedor
  - H3: Web UI y emparejamiento
  - H3: Configuración y mantenimiento
  - H3: Utilidades
  - H2: Flujo de primera vez
  - H2: Configuración y secretos
  - H2: Relacionado

## install/development-channels.md

- Ruta: /install/development-channels
- Encabezados:
  - H2: Cambiar de canales
  - H2: Apuntar a una versión o etiqueta puntual
  - H2: Ejecución de prueba
  - H2: Plugins y canales
  - H2: Comprobar el estado actual
  - H2: Buenas prácticas de etiquetado
  - H2: Disponibilidad de la app de macOS
  - H2: Relacionado

## install/digitalocean.md

- Ruta: /install/digitalocean
- Encabezados:
  - H2: Requisitos previos
  - H2: Configuración
  - H2: Persistencia y copias de seguridad
  - H2: Consejos para 1 GB de RAM
  - H2: Solución de problemas
  - H2: Próximos pasos
  - H2: Relacionado

## install/docker-vm-runtime.md

- Ruta: /install/docker-vm-runtime
- Encabezados:
  - H2: Incluir los binarios requeridos en la imagen
  - H2: Compilar e iniciar
  - H2: Qué persiste y dónde
  - H2: Actualizaciones
  - H2: Relacionado

## install/docker.md

- Ruta: /install/docker
- Encabezados:
  - H2: ¿Docker es adecuado para mí?
  - H2: Requisitos previos
  - H2: Gateway en contenedor
  - H3: Flujo manual
  - H3: Variables de entorno
  - H3: Observabilidad
  - H3: Comprobaciones de estado
  - H3: LAN frente a loopback
  - H3: Proveedores locales del host
  - H3: Backend Claude CLI en Docker
  - H3: Bonjour / mDNS
  - H3: Almacenamiento y persistencia
  - H3: Ayudantes de shell (opcional)
  - H3: ¿Ejecutando en un VPS?
  - H2: Sandbox del agente
  - H3: Activación rápida
  - H2: Solución de problemas
  - H2: Relacionado

## install/exe-dev.md

- Ruta: /install/exe-dev
- Encabezados:
  - H2: Ruta rápida para principiantes
  - H2: Qué necesitas
  - H2: Instalación automatizada con Shelley
  - H2: Instalación manual
  - H2: 1) Crear la VM
  - H2: 2) Instalar requisitos previos (en la VM)
  - H2: 3) Instalar OpenClaw
  - H2: 4) Configurar nginx para que haga proxy de OpenClaw al puerto 8000
  - H2: 5) Acceder a OpenClaw y conceder privilegios
  - H2: Configuración de canal remoto
  - H2: Acceso remoto
  - H2: Actualización
  - H2: Relacionado

## install/fly.md

- Ruta: /install/fly
- Encabezados:
  - H2: Qué necesitas
  - H2: Ruta rápida para principiantes
  - H2: Solución de problemas
  - H3: "La app no está escuchando en la dirección esperada"
  - H3: Fallan las comprobaciones de estado / conexión rechazada
  - H3: OOM / Problemas de memoria
  - H3: Problemas de bloqueo del Gateway
  - H3: La configuración no se lee
  - H3: Escribir configuración mediante SSH
  - H3: El estado no persiste
  - H2: Actualizaciones
  - H3: Actualizar comando de máquina
  - H2: Implementación privada (reforzada)
  - H3: Cuándo usar implementación privada
  - H3: Configuración
  - H3: Acceder a una implementación privada
  - H3: Webhooks con implementación privada
  - H3: Beneficios de seguridad
  - H2: Notas
  - H2: Costo
  - H2: Próximos pasos
  - H2: Relacionado

## install/gcp.md

- Ruta: /install/gcp
- Encabezados:
  - H2: ¿Qué estamos haciendo (en términos simples)?
  - H2: Ruta rápida (operadores experimentados)
  - H2: Qué necesitas
  - H2: Solución de problemas
  - H2: Cuentas de servicio (buena práctica de seguridad)
  - H2: Próximos pasos
  - H2: Relacionado

## install/hetzner.md

- Ruta: /install/hetzner
- Encabezados:
  - H2: Objetivo
  - H2: ¿Qué estamos haciendo (en términos simples)?
  - H2: Ruta rápida (operadores experimentados)
  - H2: Qué necesitas
  - H2: Infraestructura como código (Terraform)
  - H2: Próximos pasos
  - H2: Relacionado

## install/hostinger.md

- Ruta: /install/hostinger
- Encabezados:
  - H2: Requisitos previos
  - H2: Opción A: OpenClaw con 1 clic
  - H2: Opción B: OpenClaw en VPS
  - H2: Verificar tu configuración
  - H2: Solución de problemas
  - H2: Próximos pasos
  - H2: Relacionado

## install/index.md

- Ruta: /install
- Encabezados:
  - H2: Requisitos del sistema
  - H2: Recomendado: script de instalación
  - H2: Métodos de instalación alternativos
  - H3: Instalador con prefijo local (install-cli.sh)
  - H3: npm, pnpm o bun
  - H3: Desde el código fuente
  - H3: Instalar desde el checkout main de GitHub
  - H3: Contenedores y gestores de paquetes
  - H2: Verificar la instalación
  - H2: Hosting e implementación
  - H2: Actualizar, migrar o desinstalar
  - H2: Solución de problemas: openclaw no encontrado

## install/installer.md

- Ruta: /install/installer
- Encabezados:
  - H2: Comandos rápidos
  - H2: install.sh
  - H3: Flujo (install.sh)
  - H3: Detección de checkout de origen
  - H3: Ejemplos (install.sh)
  - H2: install-cli.sh
  - H3: Flujo (install-cli.sh)
  - H3: Ejemplos (install-cli.sh)
  - H2: install.ps1
  - H3: Flujo (install.ps1)
  - H3: Ejemplos (install.ps1)
  - H2: CI y automatización
  - H2: Solución de problemas
  - H2: Relacionado

## install/kubernetes.md

- Ruta: /install/kubernetes
- Encabezados:
  - H2: ¿Por qué no Helm?
  - H2: Qué necesitas
  - H2: Inicio rápido
  - H2: Pruebas locales con Kind
  - H2: Paso a paso
  - H3: 1) Implementar
  - H3: 2) Acceder al gateway
  - H2: Qué se implementa
  - H2: Personalización
  - H3: Instrucciones del agente
  - H3: Configuración del Gateway
  - H3: Agregar proveedores
  - H3: Espacio de nombres personalizado
  - H3: Imagen personalizada
  - H3: Exponer más allá de port-forward
  - H2: Volver a implementar
  - H2: Desmontaje
  - H2: Notas de arquitectura
  - H2: Estructura de archivos
  - H2: Relacionado

## install/macos-vm.md

- Ruta: /install/macos-vm
- Encabezados:
  - H2: Valor predeterminado recomendado (la mayoría de los usuarios)
  - H2: Opciones de VM de macOS
  - H3: VM local en tu Mac Apple Silicon (Lume)
  - H3: Proveedores de Mac hospedados (nube)
  - H2: Ruta rápida (Lume, usuarios experimentados)
  - H2: Qué necesitas (Lume)
  - H2: 1) Instalar Lume
  - H2: 2) Crear la VM de macOS
  - H2: 3) Completar el Asistente de configuración
  - H2: 4) Obtener la dirección IP de la VM
  - H2: 5) Conectarse por SSH a la VM
  - H2: 6) Instalar OpenClaw
  - H2: 7) Configurar canales
  - H2: 8) Ejecutar la VM sin interfaz gráfica
  - H2: Bono: integración con iMessage
  - H2: Guardar una imagen maestra
  - H2: Ejecución 24/7
  - H2: Solución de problemas
  - H2: Documentos relacionados

## install/migrating-claude.md

- Ruta: /install/migrating-claude
- Encabezados:
  - H2: Dos formas de importar
  - H2: Qué se importa
  - H2: Qué queda solo como archivo
  - H2: Selección de origen
  - H2: Flujo recomendado
  - H2: Manejo de conflictos
  - H2: Salida JSON para automatización
  - H2: Solución de problemas
  - H2: Relacionado

## install/migrating-hermes.md

- Ruta: /install/migrating-hermes
- Encabezados:
  - H2: Dos formas de importar
  - H2: Qué se importa
  - H2: Qué queda solo como archivo
  - H2: Flujo recomendado
  - H2: Manejo de conflictos
  - H2: Secretos
  - H2: Salida JSON para automatización
  - H2: Solución de problemas
  - H2: Relacionado

## install/migrating.md

- Ruta: /install/migrating
- Encabezados:
  - H2: Importar desde otro sistema de agentes
  - H2: Mover OpenClaw a una máquina nueva
  - H3: Pasos de migración
  - H3: Errores comunes
  - H3: Lista de verificación
  - H2: Actualizar un Plugin in situ
  - H2: Relacionado

## install/nix.md

- Ruta: /install/nix
- Encabezados:
  - H2: Lo que obtienes
  - H2: Inicio rápido
  - H2: Comportamiento del runtime en modo Nix
  - H3: Qué cambia en modo Nix
  - H3: Rutas de configuración y estado
  - H3: Detección de PATH del servicio
  - H2: Relacionado

## install/node.md

- Ruta: /install/node
- Encabezados:
  - H2: Comprobar tu versión
  - H2: Instalar Node
  - H2: Solución de problemas
  - H3: openclaw: comando no encontrado
  - H3: Errores de permisos en npm install -g (Linux)
  - H2: Relacionado

## install/northflank.mdx

- Ruta: /install/northflank
- Encabezados:
  - H1: Northflank
  - H2: Cómo empezar
  - H2: Lo que obtienes
  - H2: Conectar un canal
  - H2: Próximos pasos

## install/oracle.md

- Ruta: /install/oracle
- Encabezados:
  - H2: Requisitos previos
  - H2: Configuración
  - H2: Verificar la postura de seguridad
  - H2: Notas de ARM
  - H2: Persistencia y copias de seguridad
  - H2: Alternativa: túnel SSH
  - H2: Solución de problemas
  - H2: Próximos pasos
  - H2: Relacionado

## install/podman.md

- Ruta: /install/podman
- Encabezados:
  - H2: Requisitos previos
  - H2: Inicio rápido
  - H2: Podman y Tailscale
  - H2: Systemd (Quadlet, opcional)
  - H2: Configuración, env y almacenamiento
  - H2: Comandos útiles
  - H2: Solución de problemas
  - H2: Relacionado

## install/railway.mdx

- Ruta: /install/railway
- Encabezados:
  - H1: Railway
  - H2: Lista de verificación rápida (usuarios nuevos)
  - H2: Implementación con un clic
  - H2: Lo que obtienes
  - H2: Configuración requerida de Railway
  - H3: Redes públicas
  - H3: Volumen (obligatorio)
  - H3: Variables
  - H2: Conectar un canal
  - H2: Copias de seguridad y migración
  - H2: Próximos pasos

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
  - H1: Render
  - H2: Requisitos previos
  - H2: Implementar con un Blueprint de Render
  - H2: Comprender el Blueprint
  - H2: Elegir un plan
  - H2: Después de la implementación
  - H3: Acceder a la IU de control
  - H2: Funciones del panel de Render
  - H3: Registros
  - H3: Acceso de shell
  - H3: Variables de entorno
  - H3: Despliegue automático
  - H2: Dominio personalizado
  - H2: Escalado
  - H2: Copias de seguridad y migración
  - H2: Solución de problemas
  - H3: El servicio no se inicia
  - H3: Arranques en frío lentos (nivel gratuito)
  - H3: Pérdida de datos después de volver a implementar
  - H3: Errores de comprobación de estado
  - H2: Siguientes pasos

## install/uninstall.md

- Ruta: /install/uninstall
- Encabezados:
  - H2: Ruta fácil (CLI aún instalada)
  - H2: Eliminación manual del servicio (CLI no instalada)
  - H3: macOS (launchd)
  - H3: Linux (unidad de usuario systemd)
  - H3: Windows (tarea programada)
  - H2: Instalación normal frente a checkout de código fuente
  - H3: Instalación normal (install.sh / npm / pnpm / bun)
  - H3: Checkout de código fuente (git clone)
  - H2: Relacionado

## install/updating.md

- Ruta: /install/updating
- Encabezados:
  - H2: Recomendado: openclaw update
  - H2: Cambiar entre instalaciones con npm y git
  - H2: Alternativa: volver a ejecutar el instalador
  - H2: Alternativa: npm, pnpm o bun manual
  - H3: Temas avanzados de instalación con npm
  - H2: Actualizador automático
  - H2: Después de actualizar
  - H3: Ejecutar doctor
  - H3: Reiniciar el Gateway
  - H3: Verificar
  - H2: Reversión
  - H3: Fijar una versión (npm)
  - H3: Fijar un commit (código fuente)
  - H2: Si te quedas atascado
  - H2: Relacionado

## install/upstash.md

- Ruta: /install/upstash
- Encabezados:
  - H2: Requisitos previos
  - H2: Crear una Box
  - H2: Conectar con un túnel SSH
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
  - H3: CLI: seguimiento en vivo (recomendado)
  - H3: IU de control (web)
  - H3: Registros solo de canal
  - H2: Formatos de registro
  - H3: Registros de archivo (JSONL)
  - H3: Salida de consola
  - H3: Registros WebSocket del Gateway
  - H2: Configurar el registro
  - H3: Niveles de registro
  - H3: Diagnósticos dirigidos del transporte de modelos
  - H3: Correlación de trazas
  - H3: Tamaño y tiempo de llamadas al modelo
  - H3: Estilos de consola
  - H3: Redacción
  - H2: Diagnósticos y OpenTelemetry
  - H2: Consejos para solucionar problemas
  - H2: Relacionado

## maturity/scorecard.md

- Ruta: /maturity/scorecard
- Encabezados:
  - H1: Cuadro de puntuación de madurez
  - H2: Para qué sirve esta página
  - H2: De un vistazo
  - H2: Bandas de puntuación
  - H2: Explorador de superficies
  - H2: Resumen de evidencia de QA
  - H3: Preparación por área

## maturity/taxonomy.md

- Ruta: /maturity/taxonomy
- Encabezados:
  - H1: Taxonomía de madurez
  - H2: Cómo leer esta página
  - H2: Niveles de madurez
  - H2: Áreas de producto
  - H2: Detalles
  - H3: Núcleo
  - H3: Plataforma
  - H3: Canal
  - H3: Proveedor y herramienta

## network.md

- Ruta: /network
- Encabezados:
  - H2: Modelo central
  - H2: Emparejamiento + identidad
  - H2: Descubrimiento + transportes
  - H2: Nodes + transportes
  - H2: Seguridad
  - H2: Relacionado

## nodes/audio.md

- Ruta: /nodes/audio
- Encabezados:
  - H2: Qué funciona
  - H2: Detección automática (predeterminada)
  - H2: Ejemplos de configuración
  - H3: Proveedor + alternativa de CLI (OpenAI + Whisper CLI)
  - H3: Solo proveedor con control por alcance
  - H3: Solo proveedor (Deepgram)
  - H3: Solo proveedor (Mistral Voxtral)
  - H3: Solo proveedor (SenseAudio)
  - H3: Enviar transcripción al chat (opt-in)
  - H2: Notas y límites
  - H3: Compatibilidad con entorno proxy
  - H2: Detección de menciones en grupos
  - H2: Problemas habituales
  - H2: Relacionado

## nodes/camera.md

- Ruta: /nodes/camera
- Encabezados:
  - H2: Node iOS
  - H3: Ajuste de usuario (activado de forma predeterminada)
  - H3: Comandos (mediante Gateway node.invoke)
  - H3: Requisito de primer plano
  - H3: Ayudante de CLI
  - H2: Node Android
  - H3: Ajuste de usuario de Android (activado de forma predeterminada)
  - H3: Permisos
  - H3: Requisito de primer plano de Android
  - H3: Comandos de Android (mediante Gateway node.invoke)
  - H3: Protección de carga útil
  - H2: Aplicación macOS
  - H3: Ajuste de usuario (desactivado de forma predeterminada)
  - H3: Ayudante de CLI (node invoke)
  - H2: Seguridad + límites prácticos
  - H2: Video de pantalla de macOS (nivel de SO)
  - H2: Relacionado

## nodes/images.md

- Ruta: /nodes/images
- Encabezados:
  - H2: Objetivos
  - H2: Superficie de CLI
  - H2: Comportamiento del canal WhatsApp Web
  - H2: Canalización de respuesta automática
  - H2: Medios entrantes a comandos
  - H2: Límites y errores
  - H2: Notas para pruebas
  - H2: Relacionado

## nodes/index.md

- Ruta: /nodes
- Encabezados:
  - H2: Emparejamiento + estado
  - H2: Host de Node remoto (system.run)
  - H3: Qué se ejecuta dónde
  - H3: Iniciar un host de Node (primer plano)
  - H3: Gateway remoto mediante túnel SSH (enlace loopback)
  - H3: Iniciar un host de Node (servicio)
  - H3: Emparejar + nombrar
  - H3: Permitir los comandos
  - H3: Apuntar exec al Node
  - H2: Invocar comandos
  - H2: Política de comandos
  - H2: Configuración (openclaw.json)
  - H2: Capturas de pantalla (instantáneas de canvas)
  - H3: Controles de canvas
  - H3: A2UI (Canvas)
  - H2: Fotos + videos (cámara de Node)
  - H2: Grabaciones de pantalla (Nodes)
  - H2: Ubicación (Nodes)
  - H2: SMS (Nodes Android)
  - H2: Comandos de dispositivo Android + datos personales
  - H2: Comandos del sistema (host de Node / Node Mac)
  - H2: Vinculación de Node exec
  - H2: Mapa de permisos
  - H2: Host de Node sin interfaz gráfica (multiplataforma)
  - H2: Modo Node de Mac

## nodes/location-command.md

- Ruta: /nodes/location-command
- Encabezados:
  - H2: TL;DR
  - H2: Por qué un selector (no solo un interruptor)
  - H2: Modelo de configuración
  - H2: Asignación de permisos (node.permissions)
  - H2: Comando: location.get
  - H2: Comportamiento en segundo plano
  - H2: Integración de modelo/herramientas
  - H2: Texto de UX (sugerido)
  - H2: Relacionado

## nodes/media-understanding.md

- Ruta: /nodes/media-understanding
- Encabezados:
  - H2: Objetivos
  - H2: Comportamiento de alto nivel
  - H2: Resumen de configuración
  - H3: Entradas de modelo
  - H3: Credenciales de proveedor (apiKey)
  - H2: Valores predeterminados y límites
  - H3: Detectar automáticamente la comprensión de medios (predeterminado)
  - H3: Compatibilidad con entorno proxy (modelos de proveedor)
  - H2: Capacidades (opcional)
  - H2: Matriz de soporte de proveedores (integraciones de OpenClaw)
  - H2: Guía de selección de modelo
  - H2: Política de adjuntos
  - H2: Ejemplos de configuración
  - H2: Salida de estado
  - H2: Notas
  - H2: Relacionado

## nodes/talk.md

- Ruta: /nodes/talk
- Encabezados:
  - H2: Comportamiento (macOS)
  - H2: Directivas de voz en respuestas
  - H2: Configuración (/.openclaw/openclaw.json)
  - H2: IU de macOS
  - H2: IU de Android
  - H2: Notas
  - H2: Relacionado

## nodes/troubleshooting.md

- Ruta: /nodes/troubleshooting
- Encabezados:
  - H2: Escalera de comandos
  - H2: Requisitos de primer plano
  - H2: Matriz de permisos
  - H2: Emparejamiento frente a aprobaciones
  - H2: Códigos de error comunes de Node
  - H2: Bucle de recuperación rápida
  - H2: Relacionado

## nodes/voicewake.md

- Ruta: /nodes/voicewake
- Encabezados:
  - H2: Almacenamiento (host del Gateway)
  - H2: Protocolo
  - H3: Métodos
  - H3: Métodos de enrutamiento (activador → destino)
  - H3: Eventos
  - H2: Comportamiento del cliente
  - H3: Aplicación macOS
  - H3: Node iOS
  - H3: Node Android
  - H2: Relacionado

## openclaw-agent-runtime.md

- Ruta: /openclaw-agent-runtime
- Encabezados:
  - H2: Comprobación de tipos y linting
  - H2: Ejecutar pruebas de Agent Runtime
  - H2: Pruebas manuales
  - H2: Restablecimiento desde cero
  - H2: Referencias
  - H2: Relacionado

## perplexity.md

- Ruta: /perplexity
- Encabezados:
  - H2: Relacionado

## plan/codex-context-engine-harness.md

- Ruta: /plan/codex-context-engine-harness
- Encabezados:
  - H2: Estado
  - H2: Objetivo
  - H2: No objetivos
  - H2: Arquitectura actual
  - H2: Brecha actual
  - H2: Comportamiento deseado
  - H2: Restricciones de diseño
  - H3: El app-server de Codex sigue siendo canónico para el estado nativo de hilos
  - H3: El ensamblaje del motor de contexto debe proyectarse en entradas de Codex
  - H3: La estabilidad de la caché de prompts importa
  - H3: La semántica de selección de runtime no cambia
  - H2: Plan de implementación
  - H3: 1. Exportar o reubicar ayudantes reutilizables de intentos del motor de contexto
  - H3: 2. Agregar un ayudante de proyección de contexto de Codex
  - H3: 3. Conectar bootstrap antes del inicio del hilo de Codex
  - H3: 4. Conectar assemble antes de thread/start / thread/resume y turn/start
  - H3: 5. Conservar el formato estable para la caché de prompts
  - H3: 6. Conectar post-turn después de duplicar la transcripción
  - H3: 7. Normalizar uso y contexto de runtime de la caché de prompts
  - H3: 8. Política de Compaction
  - H4: /compact y Compaction explícita de OpenClaw
  - H4: Eventos nativos contextCompaction de Codex durante el turno
  - H3: 9. Restablecimiento de sesión y comportamiento de vinculación
  - H3: 10. Manejo de errores
  - H2: Plan de pruebas
  - H3: Pruebas unitarias
  - H3: Pruebas existentes que actualizar
  - H3: Pruebas de integración / en vivo
  - H2: Observabilidad
  - H2: Migración / compatibilidad
  - H2: Preguntas abiertas
  - H2: Criterios de aceptación

## plan/ui-channels.md

- Ruta: /plan/ui-channels
- Encabezados:
  - H2: Estado
  - H2: Problema
  - H2: Objetivos
  - H2: No objetivos
  - H2: Modelo objetivo
  - H2: Metadatos de entrega
  - H2: Contrato de capacidad de runtime
  - H2: Asignación de canales
  - H2: Pasos de refactorización
  - H2: Pruebas
  - H2: Preguntas abiertas
  - H2: Relacionado

## platforms/android.md

- Ruta: /platforms/android
- Encabezados:
  - H2: Instantánea de soporte
  - H2: Control del sistema
  - H2: Runbook de conexión
  - H3: Requisitos previos
  - H3: 1) Iniciar el Gateway
  - H3: 2) Verificar el descubrimiento (opcional)
  - H4: Descubrimiento de Tailnet (Viena ⇄ Londres) mediante DNS-SD unicast
  - H3: 3) Conectarse desde Android
  - H3: Beacons de presencia activa
  - H3: 4) Aprobar emparejamiento (CLI)
  - H3: 5) Verificar que el Node está conectado
  - H3: 6) Chat + historial
  - H3: 7) Canvas + cámara
  - H4: Host de Canvas del Gateway (recomendado para contenido web)
  - H3: 8) Voz + superficie ampliada de comandos de Android
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
  - H2: Aplicación Compose
  - H2: Configurar OpenClaw
  - H2: Verificar
  - H2: Actualizaciones y copias de seguridad
  - H2: Solución de problemas

## platforms/index.md

- Ruta: /platforms
- Encabezados:
  - H2: Elige tu SO
  - H2: VPS y hosting
  - H2: Enlaces comunes
  - H2: Instalación del servicio Gateway (CLI)
  - H2: Relacionado

## platforms/ios.md

- Ruta: /platforms/ios
- Encabezados:
  - H2: Qué hace
  - H2: Requisitos
  - H2: Inicio rápido (emparejar + conectar)
  - H2: Push respaldado por relay para builds oficiales
  - H2: Beacons activos en segundo plano
  - H2: Flujo de autenticación y confianza
  - H2: Rutas de descubrimiento
  - H3: Bonjour (LAN)
  - H3: Tailnet (entre redes)
  - H3: Host/puerto manual
  - H2: Canvas + A2UI
  - H2: Relación con Computer Use
  - H3: Eval / instantánea de Canvas
  - H2: Activación por voz + modo de habla
  - H2: Errores comunes
  - H2: Documentos relacionados

## platforms/linux.md

- Ruta: /platforms/linux
- Encabezados:
  - H2: Ruta rápida para principiantes (VPS)
  - H2: Instalar
  - H2: Gateway
  - H2: Instalación del servicio Gateway (CLI)
  - H2: Control del sistema (unidad de usuario systemd)
  - H2: Presión de memoria y terminaciones OOM
  - H2: Relacionado

## platforms/mac/bundled-gateway.md

- Ruta: /platforms/mac/bundled-gateway
- Encabezados:
  - H2: Instalar la CLI (obligatorio para modo local)
  - H2: Launchd (Gateway como LaunchAgent)
  - H2: Compatibilidad de versiones
  - H2: Directorio de estado en macOS
  - H2: Depurar conectividad de la aplicación
  - H2: Comprobación rápida
  - H2: Relacionado

## platforms/mac/canvas.md

- Ruta: /platforms/mac/canvas
- Encabezados:
  - H2: Dónde reside Canvas
  - H2: Comportamiento del panel
  - H2: Superficie de API del agente
  - H2: A2UI en Canvas
  - H3: Comandos A2UI (v0.8)
  - H2: Activar ejecuciones de agente desde Canvas
  - H2: Notas de seguridad
  - H2: Relacionado

## platforms/mac/child-process.md

- Ruta: /platforms/mac/child-process
- Encabezados:
  - H2: Comportamiento predeterminado (launchd)
  - H2: Builds de desarrollo sin firmar
  - H2: Modo solo adjuntar
  - H2: Modo remoto
  - H2: Por qué preferimos launchd
  - H2: Relacionado

## platforms/mac/dev-setup.md

- Ruta: /platforms/mac/dev-setup
- Encabezados:
  - H1: configuración de desarrollo de macOS
  - H2: Requisitos previos
  - H2: 1. Instalar dependencias
  - H2: 2. Compilar y empaquetar la aplicación
  - H2: 3. Instalar la CLI
  - H2: Solución de problemas
  - H3: La compilación falla: incompatibilidad de toolchain o SDK
  - H3: La aplicación falla al conceder permisos
  - H3: Gateway "Iniciando..." indefinidamente
  - H2: Relacionado

## platforms/mac/health.md

- Ruta: /platforms/mac/health
- Encabezados:
  - H1: Comprobaciones de estado en macOS
  - H2: Barra de menús
  - H2: Configuración
  - H2: Cómo funciona la sonda
  - H2: En caso de duda
  - H2: Relacionado

## platforms/mac/icon.md

- Ruta: /platforms/mac/icon
- Encabezados:
  - H1: Estados del icono de la barra de menús
  - H2: Relacionado

## platforms/mac/logging.md

- Ruta: /platforms/mac/logging
- Encabezados:
  - H1: Registro (macOS)
  - H2: Registro continuo de archivo de diagnóstico (panel de depuración)
  - H2: Datos privados del registro unificado en macOS
  - H2: Habilitar para OpenClaw (ai.openclaw)
  - H2: Deshabilitar después de depurar
  - H2: Relacionado

## platforms/mac/menu-bar.md

- Ruta: /platforms/mac/menu-bar
- Encabezados:
  - H2: Qué se muestra
  - H2: Modelo de estado
  - H2: Enumeración IconState (Swift)
  - H3: ActivityKind → glifo
  - H3: Asignación visual
  - H2: Submenú de contexto
  - H2: Texto de la fila de estado (menú)
  - H2: Ingesta de eventos
  - H2: Anulación de depuración
  - H2: Lista de verificación de pruebas
  - H2: Relacionado

## platforms/mac/peekaboo.md

- Ruta: /platforms/mac/peekaboo
- Encabezados:
  - H2: Qué es esto (y qué no es)
  - H2: Relación con Computer Use
  - H2: Habilitar el puente
  - H2: Orden de detección del cliente
  - H2: Seguridad y permisos
  - H2: Comportamiento de instantáneas (automatización)
  - H2: Solución de problemas
  - H2: Relacionado

## platforms/mac/permissions.md

- Ruta: /platforms/mac/permissions
- Encabezados:
  - H2: Requisitos para permisos estables
  - H2: Concesiones de accesibilidad para runtimes de Node y CLI
  - H2: Lista de verificación de recuperación cuando desaparecen las solicitudes
  - H2: Permisos de archivos y carpetas (Escritorio/Documentos/Descargas)
  - H2: Relacionado

## platforms/mac/remote.md

- Ruta: /platforms/mac/remote
- Encabezados:
  - H2: Modos
  - H2: Transportes remotos
  - H2: Requisitos previos en el host remoto
  - H2: Configuración de la aplicación macOS
  - H2: Chat web
  - H2: Permisos
  - H2: Notas de seguridad
  - H2: Flujo de inicio de sesión de WhatsApp (remoto)
  - H2: Solución de problemas
  - H2: Sonidos de notificación
  - H2: Relacionado

## platforms/mac/signing.md

- Ruta: /platforms/mac/signing
- Encabezados:
  - H1: firma de mac (compilaciones de depuración)
  - H2: Uso
  - H3: Nota sobre firma ad hoc
  - H2: Metadatos de compilación para Acerca de
  - H2: Por qué
  - H2: Relacionado

## platforms/mac/skills.md

- Ruta: /platforms/mac/skills
- Encabezados:
  - H2: Fuente de datos
  - H2: Acciones de instalación
  - H2: Claves de entorno/API
  - H2: Modo remoto
  - H2: Relacionado

## platforms/mac/voice-overlay.md

- Ruta: /platforms/mac/voice-overlay
- Encabezados:
  - H1: Ciclo de vida de la superposición de voz (macOS)
  - H2: Intención actual
  - H2: Implementado (9 de dic. de 2025)
  - H2: Próximos pasos
  - H2: Lista de verificación de depuración
  - H2: Pasos de migración (sugeridos)
  - H2: Relacionado

## platforms/mac/voicewake.md

- Ruta: /platforms/mac/voicewake
- Encabezados:
  - H1: Activación por voz y pulsar para hablar
  - H2: Requisitos
  - H2: Modos
  - H2: Comportamiento en runtime (palabra de activación)
  - H2: Invariantes del ciclo de vida
  - H2: Modo de fallo de superposición persistente (anterior)
  - H2: Detalles de pulsar para hablar
  - H2: Configuración visible para el usuario
  - H2: Comportamiento de reenvío
  - H2: Carga útil de reenvío
  - H2: Verificación rápida
  - H2: Relacionado

## platforms/mac/webchat.md

- Ruta: /platforms/mac/webchat
- Encabezados:
  - H2: Inicio y depuración
  - H2: Cómo está conectado
  - H2: Superficie de seguridad
  - H2: Limitaciones conocidas
  - H2: Relacionado

## platforms/mac/xpc.md

- Ruta: /platforms/mac/xpc
- Encabezados:
  - H1: Arquitectura IPC de OpenClaw en macOS
  - H2: Objetivos
  - H2: Cómo funciona
  - H3: Gateway + transporte de node
  - H3: Servicio de Node + IPC de aplicación
  - H3: PeekabooBridge (automatización de IU)
  - H2: Flujos operativos
  - H2: Notas de endurecimiento
  - H2: Relacionado

## platforms/macos.md

- Ruta: /platforms/macos
- Encabezados:
  - H2: Descargar
  - H2: Primera ejecución
  - H2: Elegir un modo de Gateway
  - H2: Lo que posee la aplicación
  - H2: Páginas de detalles de macOS
  - H2: Relacionado

## platforms/oracle.md

- Ruta: /platforms/oracle
- Encabezados:
  - H2: Relacionado

## platforms/raspberry-pi.md

- Ruta: /platforms/raspberry-pi
- Encabezados:
  - H2: Relacionado

## platforms/windows.md

- Ruta: /platforms/windows
- Encabezados:
  - H2: Recomendado: Windows Hub
  - H3: Qué incluye Windows Hub
  - H3: Primer inicio
  - H2: Modo de nodo de Windows
  - H2: Modo MCP local
  - H2: CLI y Gateway nativos de Windows
  - H2: Gateway de WSL2
  - H2: Inicio automático de Gateway antes del inicio de sesión de Windows
  - H2: Exponer servicios de WSL en LAN
  - H2: Solución de problemas
  - H3: El icono de la bandeja no aparece
  - H3: La configuración local falla
  - H3: La aplicación indica que se requiere emparejamiento
  - H3: El chat web no puede acceder a un Gateway remoto
  - H3: Los comandos screen.snapshot, camera o audio fallan
  - H3: Falla la conectividad de Git o GitHub
  - H2: Relacionado

## plugins/adding-capabilities.md

- Ruta: /plugins/adding-capabilities
- Encabezados:
  - H2: Cuándo crear una capacidad
  - H2: La secuencia estándar
  - H2: Qué va dónde
  - H2: Límites de proveedor y harness
  - H2: Lista de verificación de archivos
  - H2: Ejemplo práctico: generación de imágenes
  - H2: Proveedores de embeddings
  - H2: Lista de verificación de revisión
  - H2: Relacionado

## plugins/admin-http-rpc.md

- Ruta: /plugins/admin-http-rpc
- Encabezados:
  - H2: Antes de habilitarlo
  - H2: Habilitar
  - H2: Verificar la ruta
  - H2: Autenticación
  - H2: Modelo de seguridad
  - H2: Solicitud
  - H2: Respuesta
  - H2: Métodos permitidos
  - H2: Comparación con WebSocket
  - H2: Solución de problemas
  - H2: Relacionado

## plugins/agent-tools.md

- Ruta: /plugins/agent-tools
- Encabezados:
  - H2: Relacionado

## plugins/architecture-internals.md

- Ruta: /plugins/architecture-internals
- Encabezados:
  - H2: Canalización de carga
  - H3: Comportamiento con prioridad del manifiesto
  - H3: Límite de caché de Plugin
  - H2: Modelo de registro
  - H2: Callbacks de vinculación de conversación
  - H2: Hooks de runtime del proveedor
  - H3: Orden y uso de hooks
  - H3: Ejemplo de proveedor
  - H3: Ejemplos integrados
  - H2: Helpers de runtime
  - H3: api.runtime.imageGeneration
  - H2: Rutas HTTP de Gateway
  - H2: Rutas de importación del SDK de Plugin
  - H2: Esquemas de herramientas de mensajes
  - H2: Resolución de destinos de canal
  - H2: Directorios respaldados por configuración
  - H2: Catálogos de proveedores
  - H2: Inspección de canales de solo lectura
  - H2: Paquetes de paquetes
  - H3: Metadatos del catálogo de canales
  - H2: Plugins del motor de contexto
  - H2: Añadir una nueva capacidad
  - H3: Lista de verificación de capacidades
  - H3: Plantilla de capacidad
  - H2: Relacionado

## plugins/architecture.md

- Ruta: /plugins/architecture
- Encabezados:
  - H2: Modelo público de capacidades
  - H3: Postura de compatibilidad externa
  - H3: Formas de Plugin
  - H3: Hooks heredados
  - H3: Señales de compatibilidad
  - H2: Descripción general de la arquitectura
  - H3: Instantánea de metadatos de Plugin y tabla de búsqueda
  - H3: Planificación de activación
  - H3: Plugins de canal y herramienta de mensajes compartida
  - H2: Modelo de propiedad de capacidades
  - H3: Capas de capacidad
  - H3: Ejemplo de Plugin de empresa con varias capacidades
  - H3: Ejemplo de capacidad: comprensión de video
  - H2: Contratos y cumplimiento
  - H3: Qué pertenece a un contrato
  - H2: Modelo de ejecución
  - H2: Límite de exportación
  - H2: Internos y referencia
  - H2: Relacionado

## plugins/building-extensions.md

- Ruta: /plugins/building-extensions
- Encabezados:
  - H2: Relacionado

## plugins/building-plugins.md

- Ruta: /plugins/building-plugins
- Encabezados:
  - H2: Requisitos
  - H2: Elegir la forma del plugin
  - H2: Inicio rápido
  - H2: Registrar herramientas
  - H2: Convenciones de importación
  - H2: Lista de verificación previa al envío
  - H2: Probar con versiones beta
  - H2: Próximos pasos
  - H2: Relacionado

## plugins/bundles.md

- Ruta: /plugins/bundles
- Encabezados:
  - H2: Por qué existen los bundles
  - H2: Instalar un bundle
  - H2: Qué asigna OpenClaw desde bundles
  - H3: Compatible ahora
  - H4: Contenido de Skill
  - H4: Paquetes de hooks
  - H4: MCP para OpenClaw embebido
  - H4: Configuración de OpenClaw embebido
  - H4: LSP de OpenClaw embebido
  - H3: Detectado pero no ejecutado
  - H2: Formatos de bundle
  - H2: Precedencia de detección
  - H2: Dependencias de runtime y limpieza
  - H2: Seguridad
  - H2: Solución de problemas
  - H2: Relacionado

## plugins/cli-backend-plugins.md

- Ruta: /plugins/cli-backend-plugins
- Encabezados:
  - H2: Qué posee el plugin
  - H2: Plugin de backend mínimo
  - H2: Forma de configuración
  - H2: Hooks avanzados de backend
  - H3: ownsNativeCompaction: exclusión de la Compaction de OpenClaw
  - H2: Puente de herramientas MCP
  - H2: Configuración de usuario
  - H2: Verificación
  - H2: Lista de verificación
  - H2: Relacionado

## plugins/codex-computer-use.md

- Ruta: /plugins/codex-computer-use
- Encabezados:
  - H2: OpenClaw.app y Peekaboo
  - H2: Aplicación iOS
  - H2: MCP cua-driver directo
  - H2: Configuración rápida
  - H2: Comandos
  - H2: Opciones de marketplace
  - H2: Marketplace de macOS incluido
  - H2: Límite del catálogo remoto
  - H2: Referencia de configuración
  - H2: Qué comprueba OpenClaw
  - H2: Permisos de macOS
  - H2: Solución de problemas
  - H2: Relacionado

## plugins/codex-harness-reference.md

- Ruta: /plugins/codex-harness-reference
- Encabezados:
  - H2: Superficie de configuración del Plugin
  - H2: Transporte del servidor de aplicación
  - H2: Modos de aprobación y sandbox
  - H2: Ejecución nativa en sandbox
  - H2: Aislamiento de autenticación y entorno
  - H2: Herramientas dinámicas
  - H2: Tiempos de espera
  - H2: Detección de modelos
  - H2: Archivos de arranque del espacio de trabajo
  - H2: Anulaciones de entorno
  - H2: Relacionado

## plugins/codex-harness-runtime.md

- Ruta: /plugins/codex-harness-runtime
- Encabezados:
  - H2: Descripción general
  - H2: Vinculaciones de hilos y cambios de modelo
  - H2: Respuestas visibles y Heartbeats
  - H2: Límites de hooks
  - H2: Contrato de soporte V1
  - H2: Permisos nativos y solicitudes MCP
  - H2: Dirección de cola
  - H2: Carga de comentarios de Codex
  - H2: Compaction y espejo de transcripción
  - H2: Medios y entrega
  - H2: Relacionado

## plugins/codex-harness.md

- Ruta: /plugins/codex-harness
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Configuración
  - H2: Verificar el runtime de Codex
  - H2: Enrutamiento y selección de modelo
  - H2: Patrones de implementación
  - H3: Implementación básica de Codex
  - H3: Implementación con proveedores mixtos
  - H3: Implementación de Codex con cierre seguro
  - H2: Política de servidor de aplicación
  - H2: Comandos y diagnósticos
  - H3: Inspeccionar hilos de Codex localmente
  - H2: Plugins nativos de Codex
  - H2: Computer Use
  - H2: Límites de runtime
  - H2: Solución de problemas
  - H2: Relacionado

## plugins/codex-native-plugins.md

- Ruta: /plugins/codex-native-plugins
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Gestionar plugins desde el chat
  - H2: Cómo funciona la configuración de Plugin nativo
  - H2: Límite de soporte V1
  - H2: Inventario y propiedad de aplicaciones
  - H2: Configuración de aplicación de hilo
  - H2: Política de acciones destructivas
  - H2: Solución de problemas
  - H2: Relacionado

## plugins/community.md

- Ruta: /plugins/community
- Encabezados:
  - H2: Buscar plugins
  - H2: Publicar plugins
  - H2: Relacionado

## plugins/compatibility.md

- Ruta: /plugins/compatibility
- Encabezados:
  - H2: Registro de compatibilidad
  - H2: Paquete inspector de Plugin
  - H3: Línea de aceptación del mantenedor
  - H2: Política de desuso
  - H2: Áreas de compatibilidad actuales
  - H3: Alias planos de callback entrante de WhatsApp
  - H3: Campos de admisión entrante de WhatsApp
  - H2: Notas de la versión

## plugins/copilot.md

- Ruta: /plugins/copilot
- Encabezados:
  - H2: Requisitos
  - H2: Instalación de Plugin
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H2: BYOK
  - H2: Autenticación
  - H2: Superficie de configuración
  - H2: Compaction
  - H2: Espejado de transcripción
  - H2: Preguntas secundarias (/btw)
  - H2: Doctor
  - H2: Limitaciones
  - H2: Permisos y askuser
  - H3: Token de GitHub a nivel de sesión
  - H2: Relacionado

## plugins/dependency-resolution.md

- Ruta: /plugins/dependency-resolution
- Encabezados:
  - H2: División de responsabilidades
  - H2: Raíces de instalación
  - H2: Plugins locales
  - H2: Inicio y recarga
  - H2: Plugins incluidos
  - H2: Limpieza heredada

## plugins/google-meet.md

- Ruta: /plugins/google-meet
- Encabezados:
  - H2: Inicio rápido
  - H3: Gateway local + Chrome de Parallels
  - H2: Notas de instalación
  - H2: Transportes
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth y comprobación previa
  - H3: Crear credenciales de Google
  - H3: Emitir el token de actualización
  - H3: Verificar OAuth con doctor
  - H2: Configuración
  - H2: Herramienta
  - H2: Modos de agente y bidi
  - H2: Lista de comprobación de prueba en vivo
  - H2: Solución de problemas
  - H3: El agente no puede ver la herramienta de Google Meet
  - H3: No hay ningún nodo compatible con Google Meet conectado
  - H3: El navegador se abre pero el agente no puede unirse
  - H3: La creación de la reunión falla
  - H3: El agente se une pero no habla
  - H3: Las comprobaciones de configuración de Twilio fallan
  - H3: La llamada de Twilio empieza pero nunca entra en la reunión
  - H2: Notas
  - H2: Relacionado

## plugins/hooks.md

- Ruta: /plugins/hooks
- Encabezados:
  - H2: Inicio rápido
  - H2: Catálogo de hooks
  - H2: Depurar hooks de tiempo de ejecución
  - H2: Política de llamadas a herramientas
  - H3: Hook de entorno de ejecución
  - H3: Persistencia del resultado de herramienta
  - H2: Hooks de prompt y modelo
  - H3: Extensiones de sesión e inyecciones del siguiente turno
  - H2: Hooks de mensajes
  - H2: Hooks de instalación
  - H2: Ciclo de vida del Gateway
  - H2: Próximas obsolescencias
  - H2: Relacionado

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
  - H2: Tiempo de ejecución nativo

## plugins/manage-plugins.md

- Ruta: /plugins/manage-plugins
- Encabezados:
  - H2: Listar y buscar plugins
  - H2: Instalar plugins
  - H2: Reiniciar e inspeccionar
  - H2: Actualizar plugins
  - H2: Desinstalar plugins
  - H2: Elegir una fuente
  - H2: Publicar plugins
  - H2: Relacionado

## plugins/manifest.md

- Ruta: /plugins/manifest
- Encabezados:
  - H2: Qué hace este archivo
  - H2: Ejemplo mínimo
  - H2: Ejemplo enriquecido
  - H2: Referencia de campos de nivel superior
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
  - H2: Referencia de mediaUnderstandingProviderMetadata
  - H2: Referencia de channelConfigs
  - H3: Sustituir otro Plugin de canal
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
  - H2: Precedencia de descubrimiento (ids de plugin duplicados)
  - H2: Requisitos de JSON Schema
  - H2: Comportamiento de validación
  - H2: Notas
  - H2: Relacionado

## plugins/memory-lancedb.md

- Ruta: /plugins/memory-lancedb
- Encabezados:
  - H2: Instalación
  - H2: Inicio rápido
  - H2: Embeddings respaldados por proveedor
  - H2: Embeddings de Ollama
  - H2: Proveedores compatibles con OpenAI
  - H2: Límites de recuperación y captura
  - H2: Comandos
  - H2: Almacenamiento
  - H2: Dependencias de tiempo de ejecución
  - H2: Solución de problemas
  - H3: La longitud de entrada supera la longitud de contexto
  - H3: Modelo de embedding no compatible
  - H3: El Plugin se carga pero no aparece ningún recuerdo
  - H2: Relacionado

## plugins/memory-wiki.md

- Ruta: /plugins/memory-wiki
- Encabezados:
  - H2: Qué añade
  - H2: Cómo encaja con la memoria
  - H2: Patrón híbrido recomendado
  - H2: Modos de bóveda
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Diseño de la bóveda
  - H2: Importaciones de Open Knowledge Format
  - H2: Afirmaciones y evidencias estructuradas
  - H2: Metadatos de entidad orientados al agente
  - H2: Pipeline de compilación
  - H2: Paneles y reportes de estado
  - H2: Búsqueda y recuperación
  - H2: Herramientas de agente
  - H2: Comportamiento de prompt y contexto
  - H2: Configuración
  - H3: Ejemplo: QMD + modo bridge
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
  - H2: Mapeo de proveedores
  - H2: Presentación frente a InteractiveReply
  - H2: Anclaje de entrega
  - H2: Lista de comprobación para autores de Plugin
  - H2: Documentación relacionada

## plugins/oc-path.md

- Ruta: /plugins/oc-path
- Encabezados:
  - H2: Por qué habilitarlo
  - H2: Dónde se ejecuta
  - H2: Habilitar
  - H2: Dependencias
  - H2: Qué proporciona
  - H2: Relación con otros plugins
  - H2: Seguridad
  - H2: Relacionado

## plugins/plugin-inventory.md

- Ruta: /plugins/plugin-inventory
- Encabezados:
  - H1: Inventario de plugins
  - H2: Definiciones
  - H2: Instalar un plugin
  - H2: Paquete npm principal
  - H2: Paquetes externos oficiales
  - H2: Solo checkout de código fuente

## plugins/plugin-permission-requests.md

- Ruta: /plugins/plugin-permission-requests
- Encabezados:
  - H2: Elegir la puerta correcta
  - H2: Solicitar aprobación antes de una llamada a herramienta
  - H2: Comportamiento de decisión
  - H2: Enrutar solicitudes de aprobación
  - H2: Permisos nativos de Codex
  - H2: Solución de problemas
  - H2: Relacionado

## plugins/reference.md

- Ruta: /plugins/reference
- Encabezados:
  - H1: Referencia de Plugin

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
  - H1: Plugin Browser
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

## plugins/reference/codex-supervisor.md

- Ruta: /plugins/reference/codex-supervisor
- Encabezados:
  - H1: Plugin Codex Supervisor
  - H2: Distribución
  - H2: Superficie
  - H2: Listado de sesiones

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
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Distribución
  - H2: Superficie

## plugins/reference/diagnostics-prometheus.md

- Ruta: /plugins/reference/diagnostics-prometheus
- Encabezados:
  - H1: Plugin Diagnostics Prometheus
  - H2: Distribución
  - H2: Superficie

## plugins/reference/diffs-language-pack.md

- Ruta: /plugins/reference/diffs-language-pack
- Encabezados:
  - H1: Plugin Diffs Language Pack
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
  - H1: Plugin Document Extract
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
  - H1: Plugin File Transfer
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
  - H1: Plugin de Fireworks
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/github-copilot.md

- Ruta: /plugins/reference/github-copilot
- Encabezados:
  - H1: Plugin de GitHub Copilot
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/gmi.md

- Ruta: /plugins/reference/gmi
- Encabezados:
  - H1: Plugin de Gmi
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/google-meet.md

- Ruta: /plugins/reference/google-meet
- Encabezados:
  - H1: Plugin de Google Meet
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/google.md

- Ruta: /plugins/reference/google
- Encabezados:
  - H1: Plugin de Google
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/googlechat.md

- Ruta: /plugins/reference/googlechat
- Encabezados:
  - H1: Plugin de Google Chat
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/gradium.md

- Ruta: /plugins/reference/gradium
- Encabezados:
  - H1: Plugin de Gradium
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/groq.md

- Ruta: /plugins/reference/groq
- Encabezados:
  - H1: Plugin de Groq
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/huggingface.md

- Ruta: /plugins/reference/huggingface
- Encabezados:
  - H1: Plugin de Hugging Face
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/imessage.md

- Ruta: /plugins/reference/imessage
- Encabezados:
  - H1: Plugin de iMessage
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/inworld.md

- Ruta: /plugins/reference/inworld
- Encabezados:
  - H1: Plugin de Inworld
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/irc.md

- Ruta: /plugins/reference/irc
- Encabezados:
  - H1: Plugin de IRC
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/kilocode.md

- Ruta: /plugins/reference/kilocode
- Encabezados:
  - H1: Plugin de Kilocode
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/kimi.md

- Ruta: /plugins/reference/kimi
- Encabezados:
  - H1: Plugin de Kimi
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/line.md

- Ruta: /plugins/reference/line
- Encabezados:
  - H1: Plugin de LINE
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/litellm.md

- Ruta: /plugins/reference/litellm
- Encabezados:
  - H1: Plugin de LiteLLM
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/llama-cpp.md

- Ruta: /plugins/reference/llama-cpp
- Encabezados:
  - H1: Plugin de Llama Cpp
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/llm-task.md

- Ruta: /plugins/reference/llm-task
- Encabezados:
  - H1: Plugin de LLM Task
  - H2: Distribución
  - H2: Superficie

## plugins/reference/lmstudio.md

- Ruta: /plugins/reference/lmstudio
- Encabezados:
  - H1: Plugin de LM Studio
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/lobster.md

- Ruta: /plugins/reference/lobster
- Encabezados:
  - H1: Plugin de Lobster
  - H2: Distribución
  - H2: Superficie

## plugins/reference/matrix.md

- Ruta: /plugins/reference/matrix
- Encabezados:
  - H1: Plugin de Matrix
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/mattermost.md

- Ruta: /plugins/reference/mattermost
- Encabezados:
  - H1: Plugin de Mattermost
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/memory-core.md

- Ruta: /plugins/reference/memory-core
- Encabezados:
  - H1: Plugin de Memory Core
  - H2: Distribución
  - H2: Superficie

## plugins/reference/memory-lancedb.md

- Ruta: /plugins/reference/memory-lancedb
- Encabezados:
  - H1: Plugin de Memory Lancedb
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/memory-wiki.md

- Ruta: /plugins/reference/memory-wiki
- Encabezados:
  - H1: Plugin de Memory Wiki
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/microsoft-foundry.md

- Ruta: /plugins/reference/microsoft-foundry
- Encabezados:
  - H1: Plugin de Microsoft Foundry
  - H2: Distribución
  - H2: Superficie
  - H2: Requisitos
  - H2: Modelos de chat
  - H2: Generación de imágenes MAI
  - H2: Solución de problemas

## plugins/reference/microsoft.md

- Ruta: /plugins/reference/microsoft
- Encabezados:
  - H1: Plugin de Microsoft
  - H2: Distribución
  - H2: Superficie

## plugins/reference/migrate-claude.md

- Ruta: /plugins/reference/migrate-claude
- Encabezados:
  - H1: Plugin de Migrate Claude
  - H2: Distribución
  - H2: Superficie

## plugins/reference/migrate-hermes.md

- Ruta: /plugins/reference/migrate-hermes
- Encabezados:
  - H1: Plugin de Migrate Hermes
  - H2: Distribución
  - H2: Superficie

## plugins/reference/minimax.md

- Ruta: /plugins/reference/minimax
- Encabezados:
  - H1: Plugin de MiniMax
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/mistral.md

- Ruta: /plugins/reference/mistral
- Encabezados:
  - H1: Plugin de Mistral
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/moonshot.md

- Ruta: /plugins/reference/moonshot
- Encabezados:
  - H1: Plugin de Moonshot
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/msteams.md

- Ruta: /plugins/reference/msteams
- Encabezados:
  - H1: Plugin de Microsoft Teams
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/nextcloud-talk.md

- Ruta: /plugins/reference/nextcloud-talk
- Encabezados:
  - H1: Plugin de Nextcloud Talk
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/nostr.md

- Ruta: /plugins/reference/nostr
- Encabezados:
  - H1: Plugin de Nostr
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/novita.md

- Ruta: /plugins/reference/novita
- Encabezados:
  - H1: Plugin de Novita
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/nvidia.md

- Ruta: /plugins/reference/nvidia
- Encabezados:
  - H1: Plugin de NVIDIA
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/oc-path.md

- Ruta: /plugins/reference/oc-path
- Encabezados:
  - H1: Plugin de Oc Path
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/ollama.md

- Ruta: /plugins/reference/ollama
- Encabezados:
  - H1: Plugin de Ollama
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/open-prose.md

- Ruta: /plugins/reference/open-prose
- Encabezados:
  - H1: Plugin de Open Prose
  - H2: Distribución
  - H2: Superficie

## plugins/reference/openai.md

- Ruta: /plugins/reference/openai
- Encabezados:
  - H1: Plugin de OpenAI
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/opencode-go.md

- Ruta: /plugins/reference/opencode-go
- Encabezados:
  - H1: Plugin de OpenCode Go
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/opencode.md

- Ruta: /plugins/reference/opencode
- Encabezados:
  - H1: Plugin de OpenCode
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/openrouter.md

- Ruta: /plugins/reference/openrouter
- Encabezados:
  - H1: Plugin de OpenRouter
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/openshell.md

- Ruta: /plugins/reference/openshell
- Encabezados:
  - H1: Plugin de Openshell
  - H2: Distribución
  - H2: Superficie

## plugins/reference/perplexity.md

- Ruta: /plugins/reference/perplexity
- Encabezados:
  - H1: Plugin de Perplexity
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/pixverse.md

- Ruta: /plugins/reference/pixverse
- Encabezados:
  - H1: Plugin de PixVerse
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/policy.md

- Ruta: /plugins/reference/policy
- Encabezados:
  - H1: Plugin de Policy
  - H2: Distribución
  - H2: Superficie
  - H2: Comportamiento
  - H2: Documentación relacionada

## plugins/reference/qa-channel.md

- Ruta: /plugins/reference/qa-channel
- Encabezados:
  - H1: Plugin de QA Channel
  - H2: Distribución
  - H2: Superficie
  - H2: Documentación relacionada

## plugins/reference/qa-lab.md

- Ruta: /plugins/reference/qa-lab
- Encabezados:
  - H1: Plugin de QA Lab
  - H2: Distribución
  - H2: Superficie

## plugins/reference/qa-matrix.md

- Ruta: /plugins/reference/qa-matrix
- Encabezados:
  - H1: Plugin de QA Matrix
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
  - H1: Plugin de Sms
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
  - H1: Plugin de TTS Local CLI
  - H2: Distribución
  - H2: Superficie

## plugins/reference/twitch.md

- Ruta: /plugins/reference/twitch
- Encabezados:
  - H1: Plugin de Twitch
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
  - H1: Plugin de Web Readability
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
  - H2: Qué sigue siendo propiedad del núcleo
  - H2: Registrar un arnés
  - H2: Política de selección
  - H2: Emparejamiento de proveedor y arnés
  - H3: Middleware de resultados de herramientas
  - H3: Clasificación del resultado terminal
  - H3: Efectos secundarios al finalizar el agente
  - H3: Entrada de usuario y superficies de herramientas
  - H3: Modo de arnés nativo de Codex
  - H2: Rigor del runtime
  - H2: Sesiones nativas y réplica de transcripción
  - H2: Resultados de herramientas y medios
  - H2: Limitaciones actuales
  - H2: Relacionado

## plugins/sdk-channel-inbound.md

- Ruta: /plugins/sdk-channel-inbound
- Encabezados:
  - H2: Helpers del núcleo
  - H2: Migración

## plugins/sdk-channel-ingress.md

- Ruta: /plugins/sdk-channel-ingress
- Encabezados:
  - H1: API de entrada de canal
  - H2: Resolutor de runtime
  - H2: Resultado
  - H2: Grupos de acceso
  - H2: Modos de evento
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
  - H2: Adaptadores de salida existentes
  - H2: Envíos duraderos
  - H2: Despacho de compatibilidad

## plugins/sdk-channel-plugins.md

- Ruta: /plugins/sdk-channel-plugins
- Encabezados:
  - H2: Cómo funcionan los plugins de canal
  - H2: Aprobaciones y capacidades de canal
  - H2: Política de menciones entrantes
  - H2: Recorrido guiado
  - H2: Estructura de archivos
  - H2: Temas avanzados
  - H2: Siguientes pasos
  - H2: Relacionado

## plugins/sdk-channel-turn.md

- Ruta: /plugins/sdk-channel-turn
- Encabezados: ninguno

## plugins/sdk-entrypoints.md

- Ruta: /plugins/sdk-entrypoints
- Encabezados:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Modo de registro
  - H2: Formas de Plugin
  - H2: Relacionado

## plugins/sdk-migration.md

- Ruta: /plugins/sdk-migration
- Encabezados:
  - H2: Qué está cambiando
  - H2: Por qué cambió esto
  - H2: Plan de migración de conversación y voz en tiempo real
  - H2: Política de compatibilidad
  - H2: Cómo migrar
  - H2: Referencia de rutas de importación
  - H2: Desaprobaciones activas
  - H2: Cronograma de eliminación
  - H2: Suprimir temporalmente las advertencias
  - H2: Relacionado

## plugins/sdk-overview.md

- Ruta: /plugins/sdk-overview
- Encabezados:
  - H2: Convención de importación
  - H2: Referencia de subrutas
  - H2: API de registro
  - H3: Registro de capacidades
  - H3: Herramientas y comandos
  - H3: Infraestructura
  - H3: Hooks del host para plugins de flujo de trabajo
  - H3: Registro de descubrimiento de Gateway
  - H3: Metadatos de registro de CLI
  - H3: Registro de backend de CLI
  - H3: Slots exclusivos
  - H3: Adaptadores obsoletos de incrustaciones de memoria
  - H3: Eventos y ciclo de vida
  - H3: Semántica de decisión de hooks
  - H3: Campos del objeto API
  - H2: Convención de módulos internos
  - H2: Relacionado

## plugins/sdk-provider-plugins.md

- Ruta: /plugins/sdk-provider-plugins
- Encabezados:
  - H2: Recorrido guiado
  - H2: Publicar en ClawHub
  - H2: Estructura de archivos
  - H2: Referencia del orden del catálogo
  - H2: Siguientes pasos
  - H2: Relacionado

## plugins/sdk-runtime.md

- Ruta: /plugins/sdk-runtime
- Encabezados:
  - H2: Carga y escrituras de configuración
  - H2: Utilidades de runtime reutilizables
  - H2: Espacios de nombres de runtime
  - H2: Almacenar referencias de runtime
  - H2: Otros campos api de nivel superior
  - H2: Relacionado

## plugins/sdk-setup.md

- Ruta: /plugins/sdk-setup
- Encabezados:
  - H2: Metadatos del paquete
  - H3: Campos openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Carga completa diferida
  - H2: Manifiesto del Plugin
  - H2: Publicación en ClawHub
  - H2: Entrada de configuración
  - H3: Importaciones estrechas de helpers de configuración
  - H3: Promoción de cuenta única propiedad del canal
  - H2: Esquema de configuración
  - H3: Crear esquemas de configuración de canal
  - H2: Asistentes de configuración
  - H2: Publicar e instalar
  - H2: Relacionado

## plugins/sdk-subpaths.md

- Ruta: /plugins/sdk-subpaths
- Encabezados:
  - H2: Entrada de Plugin
  - H3: Compatibilidad obsoleta y helpers de prueba
  - H3: Subrutas reservadas de helpers para plugins incluidos
  - H2: Relacionado

## plugins/sdk-testing.md

- Ruta: /plugins/sdk-testing
- Encabezados:
  - H2: Utilidades de prueba
  - H3: Exportaciones disponibles
  - H3: Tipos
  - H2: Probar la resolución de destino
  - H2: Patrones de prueba
  - H3: Probar contratos de registro
  - H3: Probar acceso a la configuración de runtime
  - H3: Pruebas unitarias de un plugin de canal
  - H3: Pruebas unitarias de un plugin de proveedor
  - H3: Simular el runtime de plugins
  - H3: Probar con stubs por instancia
  - H2: Pruebas de contrato (plugins del repositorio)
  - H3: Ejecutar pruebas acotadas
  - H2: Aplicación de lint (plugins del repositorio)
  - H2: Configuración de pruebas
  - H2: Relacionado

## plugins/tool-plugins.md

- Ruta: /plugins/tool-plugins
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Escribir una herramienta
  - H2: Herramientas opcionales y de fábrica
  - H2: Valores de retorno
  - H2: Configuración
  - H2: Metadatos generados
  - H2: Metadatos del paquete
  - H2: Validar en CI
  - H2: Instalar e inspeccionar localmente
  - H2: Publicar
  - H2: Solución de problemas
  - H3: no se encontró la entrada del plugin: ./dist/index.js
  - H3: la entrada del plugin no expone metadatos defineToolPlugin
  - H3: los metadatos generados de openclaw.plugin.json están obsoletos
  - H3: package.json openclaw.extensions debe incluir ./dist/index.js
  - H3: No se puede encontrar el paquete 'typebox'
  - H3: La herramienta no aparece después de instalar
  - H2: Véase también

## plugins/voice-call.md

- Ruta: /plugins/voice-call
- Encabezados:
  - H2: Inicio rápido
  - H2: Configuración
  - H2: Alcance de sesión
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
  - H3: Comportamiento de inicio de conversación
  - H3: Gracia de desconexión del stream de Twilio
  - H2: Recolector de llamadas obsoletas
  - H2: Seguridad de Webhook
  - H2: CLI
  - H2: Herramienta del agente
  - H2: RPC de Gateway
  - H2: Solución de problemas
  - H3: La configuración falla en la exposición de Webhook
  - H3: Fallan las credenciales del proveedor
  - H3: Las llamadas comienzan, pero los Webhooks del proveedor no llegan
  - H3: Falla la verificación de firma
  - H3: Fallan las uniones de Twilio a Google Meet
  - H3: La llamada en tiempo real no tiene voz
  - H2: Relacionado

## plugins/webhooks.md

- Ruta: /plugins/webhooks
- Encabezados:
  - H2: Dónde se ejecuta
  - H2: Configurar rutas
  - H2: Modelo de seguridad
  - H2: Formato de solicitud
  - H2: Acciones admitidas
  - H3: createflow
  - H3: runtask
  - H2: Forma de respuesta
  - H2: Documentación relacionada

## plugins/workboard.md

- Ruta: /plugins/workboard
- Encabezados:
  - H2: Estado predeterminado
  - H2: Qué contienen las tarjetas
  - H2: Ejecuciones de tarjetas y tareas
  - H2: Coordinación de agentes
  - H3: Selección del worker de despacho
  - H3: Prompt y ciclo de vida del worker
  - H3: Puntos de entrada de despacho
  - H2: CLI y comando de barra
  - H2: Sincronización del ciclo de vida de sesión
  - H2: Flujo de trabajo del panel
  - H2: Permisos
  - H2: Configuración
  - H2: Solución de problemas
  - H3: La pestaña indica que Workboard no está disponible
  - H3: Las tarjetas no se guardan
  - H3: Iniciar una tarjeta no abre la sesión esperada
  - H3: El despacho no inicia un worker
  - H2: Relacionado

## plugins/zalouser.md

- Ruta: /plugins/zalouser
- Encabezados:
  - H2: Nomenclatura
  - H2: Dónde se ejecuta
  - H2: Instalar
  - H3: Opción A: instalar desde npm
  - H3: Opción B: instalar desde una carpeta local (dev)
  - H2: Configuración
  - H2: CLI
  - H2: Herramienta del agente
  - H2: Relacionado

## prose.md

- Ruta: /prose
- Encabezados:
  - H2: Instalar
  - H2: Comando de barra
  - H2: Qué puede hacer
  - H2: Ejemplo: investigación y síntesis en paralelo
  - H2: Mapeo del runtime de OpenClaw
  - H2: Ubicaciones de archivos
  - H2: Backends de estado
  - H2: Seguridad
  - H2: Relacionado

## providers/alibaba.md

- Ruta: /providers/alibaba
- Encabezados:
  - H2: Primeros pasos
  - H2: Modelos Wan integrados
  - H2: Capacidades y límites
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/anthropic.md

- Ruta: /providers/anthropic
- Encabezados:
  - H2: Primeros pasos
  - H2: Valores predeterminados de pensamiento (Claude Fable 5, 4.8 y 4.6)
  - H2: Almacenamiento en caché de prompts
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Relacionado

## providers/arcee.md

- Ruta: /providers/arcee
- Encabezados:
  - H2: Instalar plugin
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Funciones admitidas
  - H2: Relacionado

## providers/azure-speech.md

- Ruta: /providers/azure-speech
- Encabezados:
  - H2: Primeros pasos
  - H2: Opciones de configuración
  - H2: Notas
  - H2: Relacionado

## providers/bedrock-mantle.md

- Ruta: /providers/bedrock-mantle
- Encabezados:
  - H2: Primeros pasos
  - H2: Descubrimiento automático de modelos
  - H3: Regiones admitidas
  - H2: Configuración manual
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/bedrock.md

- Ruta: /providers/bedrock
- Encabezados:
  - H2: Primeros pasos
  - H2: Descubrimiento automático de modelos
  - H2: Configuración rápida (ruta de AWS)
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/cerebras.md

- Ruta: /providers/cerebras
- Encabezados:
  - H2: Instalar plugin
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Configuración manual
  - H2: Relacionado

## providers/chutes.md

- Ruta: /providers/chutes
- Encabezados:
  - H2: Instalar plugin
  - H2: Primeros pasos
  - H2: Comportamiento de descubrimiento
  - H2: Alias predeterminados
  - H2: Catálogo inicial integrado
  - H2: Ejemplo de configuración
  - H2: Relacionado

## providers/claude-max-api-proxy.md

- Ruta: /providers/claude-max-api-proxy
- Encabezados:
  - H2: ¿Por qué usar esto?
  - H2: Cómo funciona
  - H2: Primeros pasos
  - H2: Catálogo integrado
  - H2: Configuración avanzada
  - H2: Notas
  - H2: Relacionado

## providers/cloudflare-ai-gateway.md

- Ruta: /providers/cloudflare-ai-gateway
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Ejemplo no interactivo
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/cohere.md

- Ruta: /providers/cohere
- Encabezados:
  - H2: Primeros pasos
  - H2: Configuración solo mediante entorno
  - H2: Relacionado

## providers/comfy.md

- Ruta: /providers/comfy
- Encabezados:
  - H2: Qué admite
  - H2: Primeros pasos
  - H2: Configuración
  - H3: Claves compartidas
  - H3: Claves por capacidad
  - H2: Detalles del flujo de trabajo
  - H2: Relacionado

## providers/deepgram.md

- Ruta: /providers/deepgram
- Encabezados:
  - H2: Primeros pasos
  - H2: Opciones de configuración
  - H2: STT en streaming para llamadas de voz
  - H2: Notas
  - H2: Relacionado

## providers/deepinfra.md

- Ruta: /providers/deepinfra
- Encabezados:
  - H2: Instalar Plugin
  - H2: Obtener una clave de API
  - H2: Configuración de CLI
  - H2: Fragmento de configuración
  - H2: Superficies compatibles de OpenClaw
  - H2: Modelos disponibles
  - H2: Notas
  - H2: Relacionado

## providers/deepseek.md

- Ruta: /providers/deepseek
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Catálogo integrado
  - H2: Razonamiento y herramientas
  - H2: Pruebas en vivo
  - H2: Ejemplo de configuración
  - H2: Relacionado

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
  - H2: Relacionado

## providers/elevenlabs.md

- Ruta: /providers/elevenlabs
- Encabezados:
  - H2: Autenticación
  - H2: Texto a voz
  - H2: Voz a texto
  - H2: STT en streaming
  - H2: Relacionado

## providers/fal.md

- Ruta: /providers/fal
- Encabezados:
  - H2: Primeros pasos
  - H2: Generación de imágenes
  - H2: Generación de video
  - H2: Generación de música
  - H2: Relacionado

## providers/fireworks.md

- Ruta: /providers/fireworks
- Encabezados:
  - H2: Primeros pasos
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Ids de modelo Fireworks personalizados
  - H2: Relacionado

## providers/github-copilot.md

- Ruta: /providers/github-copilot
- Encabezados:
  - H2: Tres formas de usar Copilot en OpenClaw
  - H2: Flags opcionales
  - H2: Incorporación no interactiva
  - H2: Embeddings de búsqueda de memoria
  - H3: Configuración
  - H3: Cómo funciona
  - H2: Relacionado

## providers/gmi.md

- Ruta: /providers/gmi
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: Cuándo elegir GMI
  - H2: Modelos
  - H2: Solución de problemas
  - H2: Relacionado

## providers/google.md

- Ruta: /providers/google
- Encabezados:
  - H2: Primeros pasos
  - H2: Capacidades
  - H2: Búsqueda web
  - H2: Generación de imágenes
  - H2: Generación de video
  - H2: Generación de música
  - H2: Texto a voz
  - H2: Voz en tiempo real
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/gradium.md

- Ruta: /providers/gradium
- Encabezados:
  - H2: Instalar Plugin
  - H2: Configuración
  - H2: Configuración
  - H2: Voces
  - H3: Anulación de voz por mensaje
  - H2: Salida
  - H2: Orden de selección automática
  - H2: Relacionado

## providers/groq.md

- Ruta: /providers/groq
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H3: Ejemplo de archivo de configuración
  - H2: Catálogo integrado
  - H2: Modelos de razonamiento
  - H2: Transcripción de audio
  - H2: Relacionado

## providers/huggingface.md

- Ruta: /providers/huggingface
- Encabezados:
  - H2: Primeros pasos
  - H3: Configuración no interactiva
  - H2: IDs de modelo
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/index.md

- Ruta: /providers
- Encabezados:
  - H2: Inicio rápido
  - H2: Documentación de proveedores
  - H2: Páginas de resumen compartidas
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
  - H2: Relacionado

## providers/inworld.md

- Ruta: /providers/inworld
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Opciones de configuración
  - H2: Notas
  - H2: Relacionado

## providers/kilocode.md

- Ruta: /providers/kilocode
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Modelo predeterminado
  - H2: Catálogo integrado
  - H2: Ejemplo de configuración
  - H2: Relacionado

## providers/litellm.md

- Ruta: /providers/litellm
- Encabezados:
  - H2: Inicio rápido
  - H2: Configuración
  - H3: Variables de entorno
  - H3: Archivo de configuración
  - H2: Configuración avanzada
  - H3: Generación de imágenes
  - H2: Relacionado

## providers/lmstudio.md

- Ruta: /providers/lmstudio
- Encabezados:
  - H2: Inicio rápido
  - H2: Incorporación no interactiva
  - H2: Configuración
  - H3: Compatibilidad de uso en streaming
  - H3: Compatibilidad de razonamiento
  - H3: Configuración explícita
  - H2: Solución de problemas
  - H3: LM Studio no detectado
  - H3: Errores de autenticación (HTTP 401)
  - H3: Carga de modelos justo a tiempo
  - H3: Host de LM Studio en LAN o tailnet
  - H2: Relacionado

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
  - H3: Generación de video
  - H3: Comprensión de imágenes
  - H3: Búsqueda web
  - H2: Configuración avanzada
  - H2: Notas
  - H2: Solución de problemas
  - H2: Relacionado

## providers/mistral.md

- Ruta: /providers/mistral
- Encabezados:
  - H2: Primeros pasos
  - H2: Catálogo LLM integrado
  - H2: Transcripción de audio (Voxtral)
  - H2: STT en streaming para llamadas de voz
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/models.md

- Ruta: /providers/models
- Encabezados:
  - H2: Inicio rápido (dos pasos)
  - H2: Proveedores compatibles (conjunto inicial)
  - H2: Variantes de proveedor adicionales
  - H2: Relacionado

## providers/moonshot.md

- Ruta: /providers/moonshot
- Encabezados:
  - H2: Catálogo de modelos integrado
  - H2: Primeros pasos
  - H2: Búsqueda web de Kimi
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/novita.md

- Ruta: /providers/novita
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: Cuándo elegir Novita
  - H2: Modelos
  - H2: Solución de problemas
  - H2: Relacionado

## providers/nvidia.md

- Ruta: /providers/nvidia
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogo destacado
  - H2: Nemotron 3 Ultra
  - H2: Catálogo de reserva incluido
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/ollama-cloud.md

- Ruta: /providers/ollama-cloud
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: Cuándo elegir Ollama Cloud
  - H2: Modelos
  - H2: Prueba en vivo
  - H2: Solución de problemas
  - H2: Relacionado

## providers/ollama.md

- Ruta: /providers/ollama
- Encabezados:
  - H2: Reglas de autenticación
  - H2: Primeros pasos
  - H2: Modelos en la nube
  - H2: Descubrimiento de modelos (proveedor implícito)
  - H2: Visión y descripción de imágenes
  - H2: Configuración
  - H2: Recetas comunes
  - H3: Selección de modelo
  - H3: Verificación rápida
  - H2: Ollama Web Search
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Relacionado

## providers/openai.md

- Ruta: /providers/openai
- Encabezados:
  - H2: Elección rápida
  - H2: Mapa de nombres
  - H2: Vista previa limitada de GPT-5.6
  - H2: Cobertura de funciones de OpenClaw
  - H2: Embeddings de memoria
  - H2: Primeros pasos
  - H2: Autenticación nativa del servidor de app de Codex
  - H2: Generación de imágenes
  - H2: Generación de video
  - H2: Contribución al prompt de GPT-5
  - H2: Voz y habla
  - H2: Endpoints de Azure OpenAI
  - H3: Configuración
  - H3: Versión de API
  - H3: Los nombres de modelo son nombres de implementación
  - H3: Disponibilidad regional
  - H3: Diferencias de parámetros
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/opencode-go.md

- Ruta: /providers/opencode-go
- Encabezados:
  - H2: Catálogo integrado
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/opencode.md

- Ruta: /providers/opencode
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogos integrados
  - H3: Zen
  - H3: Go
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/openrouter.md

- Ruta: /providers/openrouter
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Referencias de modelo
  - H2: Generación de imágenes
  - H2: Generación de video
  - H2: Generación de música
  - H2: Texto a voz
  - H2: Voz a texto (audio entrante)
  - H2: Enrutador Fusion
  - H2: Autenticación y encabezados
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/perplexity-provider.md

- Ruta: /providers/perplexity-provider
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Modos de búsqueda
  - H2: Filtrado de API nativa
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/pixverse.md

- Ruta: /providers/pixverse
- Encabezados:
  - H2: Primeros pasos
  - H2: Modos y modelos compatibles
  - H2: Opciones del proveedor
  - H2: Configuración
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/qianfan.md

- Ruta: /providers/qianfan
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Catálogo integrado
  - H2: Ejemplo de configuración
  - H2: Relacionado

## providers/qwen-oauth.md

- Ruta: /providers/qwen-oauth
- Encabezados:
  - H2: Configuración
  - H2: Valores predeterminados
  - H2: En qué se diferencia de Qwen
  - H2: Cuándo elegir Qwen OAuth / Portal
  - H2: Modelos
  - H2: Migración
  - H2: Solución de problemas
  - H2: Relacionado

## providers/qwen.md

- Ruta: /providers/qwen
- Encabezados:
  - H2: Instalar Plugin
  - H2: Primeros pasos
  - H2: Tipos de plan y endpoints
  - H2: Catálogo integrado
  - H2: Controles de razonamiento
  - H2: Complementos multimodales
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/runway.md

- Ruta: /providers/runway
- Encabezados:
  - H2: Primeros pasos
  - H2: Modos y modelos compatibles
  - H2: Configuración
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/senseaudio.md

- Ruta: /providers/senseaudio
- Encabezados:
  - H2: Primeros pasos
  - H2: Opciones
  - H2: Relacionado

## providers/sglang.md

- Ruta: /providers/sglang
- Encabezados:
  - H2: Primeros pasos
  - H2: Descubrimiento de modelos (proveedor implícito)
  - H2: Configuración explícita (modelos manuales)
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/stepfun.md

- Ruta: /providers/stepfun
- Encabezados:
  - H2: Instalar Plugin
  - H2: Resumen de región y endpoint
  - H2: Catálogo integrado
  - H2: Primeros pasos
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/synthetic.md

- Ruta: /providers/synthetic
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogo integrado
  - H2: Relacionado

## providers/tencent.md

- Ruta: /providers/tencent
- Encabezados:
  - H2: Inicio rápido
  - H2: Configuración no interactiva
  - H2: Catálogo integrado
  - H2: Precios por niveles
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/together.md

- Ruta: /providers/together
- Encabezados:
  - H2: Primeros pasos
  - H3: Ejemplo no interactivo
  - H2: Catálogo integrado
  - H2: Generación de video
  - H2: Relacionado

## providers/venice.md

- Ruta: /providers/venice
- Encabezados:
  - H2: Por qué Venice en OpenClaw
  - H2: Modos de privacidad
  - H2: Funciones
  - H2: Primeros pasos
  - H2: Selección de modelo
  - H2: Comportamiento de reproducción de DeepSeek V4
  - H2: Catálogo integrado (41 en total)
  - H2: Descubrimiento de modelos
  - H2: Compatibilidad con streaming y herramientas
  - H2: Precios
  - H3: Venice (anonimizado) frente a API directa
  - H2: Ejemplos de uso
  - H2: Solución de problemas
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/vercel-ai-gateway.md

- Ruta: /providers/vercel-ai-gateway
- Encabezados:
  - H2: Primeros pasos
  - H2: Ejemplo no interactivo
  - H2: Abreviatura de ID de modelo
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/vllm.md

- Ruta: /providers/vllm
- Encabezados:
  - H2: Primeros pasos
  - H2: Descubrimiento de modelos (proveedor implícito)
  - H2: Configuración explícita (modelos manuales)
  - H2: Configuración avanzada
  - H2: Solución de problemas
  - H2: Relacionado

## providers/volcengine.md

- Ruta: /providers/volcengine
- Encabezados:
  - H2: Primeros pasos
  - H2: Proveedores y endpoints
  - H2: Catálogo integrado
  - H2: Texto a voz
  - H2: Configuración avanzada
  - H2: Relacionado

## providers/vydra.md

- Ruta: /providers/vydra
- Encabezados:
  - H2: Configuración
  - H2: Capacidades
  - H2: Relacionado

## providers/xai.md

- Ruta: /providers/xai
- Encabezados:
  - H2: Elige tu ruta de configuración
  - H2: Solución de problemas de OAuth
  - H2: Catálogo integrado
  - H2: Cobertura de funciones de OpenClaw
  - H3: Asignaciones de modo rápido
  - H3: Alias de compatibilidad heredados
  - H2: Funciones
  - H2: Pruebas en vivo
  - H2: Relacionado

## providers/xiaomi.md

- Ruta: /providers/xiaomi
- Encabezados:
  - H2: Primeros pasos
  - H2: Catálogo de pago por uso
  - H2: Catálogo de plan de tokens
  - H2: Texto a voz
  - H2: Ejemplo de configuración
  - H2: Relacionado

## providers/zai.md

- Ruta: /providers/zai
- Encabezados:
  - H2: Modelos GLM
  - H2: Primeros pasos
  - H2: Ejemplo de configuración
  - H2: Catálogo integrado
  - H2: Configuración avanzada
  - H2: Relacionado

## refactor/access.md

- Ruta: /refactor/access
- Encabezados: ninguno

## refactor/acp.md

- Ruta: /refactor/acp
- Encabezados:
  - H2: Objetivos
  - H2: No objetivos
  - H2: Modelo objetivo
  - H3: Identidad de instancia de Gateway
  - H3: Propiedad de sesión ACP
  - H3: Concesiones de proceso ACPX
  - H2: Controlador de ciclo de vida
  - H2: Contrato del contenedor
  - H2: Contrato de visibilidad de sesión
  - H2: Plan de migración
  - H3: Fase 1: Agregar identidad y concesiones
  - H3: Fase 2: Limpieza priorizando concesiones
  - H3: Fase 3: Recolección de inicio priorizando concesiones
  - H3: Fase 4: Filas de propiedad de sesión
  - H3: Fase 5: Eliminar heurísticas heredadas
  - H2: Pruebas
  - H2: Notas de compatibilidad
  - H2: Criterios de éxito

## refactor/canvas.md

- Ruta: /refactor/canvas
- Encabezados:
  - H1: Refactorización del Plugin Canvas
  - H2: Objetivo
  - H2: No objetivos
  - H2: Estado actual de la rama
  - H2: Forma objetivo
  - H2: Pasos de migración
  - H2: Lista de verificación de auditoría
  - H2: Comandos de verificación

## refactor/database-first.md

- Ruta: /refactor/database-first
- Encabezados:
  - H1: Refactorización del estado con prioridad en la base de datos
  - H2: Decisión
  - H2: Contrato estricto
  - H2: Estado objetivo y progreso
  - H3: Objetivo estricto
  - H3: Estados objetivo
  - H3: Estado actual
  - H3: Trabajo restante
  - H3: No retroceder
  - H2: Supuestos de lectura de código
  - H2: Hallazgos de lectura de código
  - H2: Forma actual del código
  - H2: Forma del esquema objetivo
  - H2: Forma de migración de Doctor
  - H2: Inventario de migración
  - H2: Plan de migración
  - H3: Fase 0: Congelar el límite
  - H3: Fase 1: Completar el plano de control global
  - H3: Fase 2: Introducir bases de datos por agente
  - H3: Fase 3: Reemplazar las API de almacén de sesiones
  - H3: Fase 4: Mover transcripciones, flujos ACP, trayectorias y VFS
  - H3: Fase 5: Copia de seguridad, restauración, Vacuum y verificación
  - H3: Fase 6: Runtime de worker
  - H3: Fase 7: Eliminar el mundo antiguo
  - H2: Copia de seguridad y restauración
  - H2: Plan de refactorización del runtime
  - H2: Reglas de rendimiento
  - H2: Prohibiciones estáticas
  - H2: Criterios de finalización

## refactor/ingress-core.md

- Ruta: /refactor/ingress-core
- Encabezados:
  - H1: Plan de eliminación del núcleo de entrada
  - H2: Presupuesto
  - H2: Diagnóstico
  - H2: Puntos críticos
  - H2: Lectura actual del código
  - H2: Límite
  - H2: Regla de aceptación
  - H2: Paquetes de trabajo
  - H2: Olas de eliminación
  - H2: No mover
  - H2: Verificación
  - H2: Criterios de salida

## reference/AGENTS.default.md

- Ruta: /reference/AGENTS.default
- Encabezados:
  - H2: Primera ejecución (recomendado)
  - H2: Valores predeterminados de seguridad
  - H2: Comprobación previa de soluciones existentes
  - H2: Inicio de sesión (obligatorio)
  - H2: Alma (obligatorio)
  - H2: Espacios compartidos (recomendado)
  - H2: Sistema de memoria (recomendado)
  - H2: Herramientas y Skills
  - H2: Consejo de copia de seguridad (recomendado)
  - H2: Qué hace OpenClaw
  - H2: Skills principales (habilitar en Configuración → Skills)
  - H2: Notas de uso
  - H2: Relacionado

## reference/RELEASING.md

- Ruta: /reference/RELEASING
- Encabezados:
  - H2: Nomenclatura de versiones
  - H2: Cadencia de lanzamiento
  - H2: Lista de verificación del operador de lanzamiento
  - H2: Cierre de main estable
  - H2: Comprobación previa de lanzamiento
  - H2: Cajas de prueba de lanzamiento
  - H3: Vitest
  - H3: Docker
  - H3: Laboratorio de QA
  - H3: Paquete
  - H2: Automatización de publicación de lanzamientos
  - H2: Entradas del flujo de trabajo de NPM
  - H2: Secuencia de lanzamiento estable de npm
  - H2: Referencias públicas
  - H2: Relacionado

## reference/api-usage-costs.md

- Ruta: /reference/api-usage-costs
- Encabezados:
  - H2: Dónde aparecen los costos (chat + CLI)
  - H2: Cómo se descubren las claves
  - H2: Funciones que pueden gastar claves
  - H3: 1) Respuestas del modelo principal (chat + herramientas)
  - H3: 2) Comprensión de medios (audio/imagen/video)
  - H3: 3) Generación de imágenes y video
  - H3: 4) Embeddings de memoria + búsqueda semántica
  - H3: 5) Herramienta de búsqueda web
  - H3: 5) Herramienta de obtención web (Firecrawl)
  - H3: 6) Instantáneas de uso del proveedor (estado/salud)
  - H3: 7) Resumen de protección de Compaction
  - H3: 8) Escaneo / prueba de modelo
  - H3: 9) Hablar (voz)
  - H3: 10) Skills (API de terceros)
  - H2: Relacionado

## reference/application-modernization-plan.md

- Ruta: /reference/application-modernization-plan
- Encabezados:
  - H2: Objetivo
  - H2: Principios
  - H2: Fase 1: Auditoría de referencia
  - H2: Fase 2: Limpieza de producto y UX
  - H2: Fase 3: Refuerzo de la arquitectura frontend
  - H2: Fase 4: Rendimiento y fiabilidad
  - H2: Fase 5: Refuerzo de tipos, contratos y pruebas
  - H2: Fase 6: Documentación y preparación para lanzamiento
  - H2: Primera porción recomendada
  - H2: Actualización de Skill frontend

## reference/code-mode.md

- Ruta: /reference/code-mode
- Encabezados:
  - H2: ¿Qué es esto?
  - H2: ¿Por qué es bueno?
  - H2: Cómo habilitarlo
  - H2: Recorrido técnico
  - H2: Estado del runtime
  - H2: Alcance
  - H2: Términos
  - H2: Configuración
  - H2: Activación
  - H2: Herramientas visibles para el modelo
  - H2: exec
  - H2: wait
  - H2: API de runtime invitado
  - H2: Espacios de nombres internos
  - H3: Ciclo de vida del registro
  - H3: Forma de registro
  - H3: Propiedad y visibilidad
  - H3: Reglas de serialización de alcance
  - H3: Prompts
  - H3: Limpieza
  - H3: Lista de verificación de pruebas
  - H2: API de salida
  - H2: Catálogo de herramientas
  - H2: Interacción de búsqueda de herramientas
  - H2: Nombres de herramientas y colisiones
  - H2: Ejecución de herramientas anidadas
  - H2: Estado del runtime
  - H2: Runtime QuickJS-WASI
  - H2: TypeScript
  - H2: Límite de seguridad
  - H2: Códigos de error
  - H2: Telemetría
  - H2: Depuración
  - H2: Diseño de implementación
  - H2: Lista de verificación de validación
  - H2: Plan de pruebas E2E
  - H2: Relacionado

## reference/credits.md

- Ruta: /reference/credits
- Encabezados:
  - H2: El nombre
  - H2: Créditos
  - H2: Colaboradores principales
  - H2: Licencia
  - H2: Relacionado

## reference/device-models.md

- Ruta: /reference/device-models
- Encabezados:
  - H2: Fuente de datos
  - H2: Actualización de la base de datos
  - H2: Relacionado

## reference/full-release-validation.md

- Ruta: /reference/full-release-validation
- Encabezados:
  - H2: Etapas de nivel superior
  - H2: Etapas de comprobaciones de lanzamiento
  - H2: Fragmentos de ruta de lanzamiento de Docker
  - H2: Perfiles de lanzamiento
  - H2: Adiciones solo completas
  - H2: Reejecuciones enfocadas
  - H2: Evidencia que conservar
  - H2: Archivos de flujo de trabajo

## reference/memory-config.md

- Ruta: /reference/memory-config
- Encabezados:
  - H2: Selección de proveedor
  - H3: IDs de proveedores personalizados
  - H3: Resolución de clave de API
  - H2: Configuración de endpoint remoto
  - H2: Configuración específica del proveedor
  - H3: Tiempo de espera de embedding en línea
  - H2: Configuración de búsqueda híbrida
  - H3: Ejemplo completo
  - H2: Rutas de memoria adicionales
  - H2: Memoria multimodal (Gemini)
  - H2: Caché de embeddings
  - H2: Indexación por lotes
  - H2: Búsqueda de memoria de sesión (experimental)
  - H2: Aceleración vectorial de SQLite (sqlite-vec)
  - H2: Almacenamiento de índice
  - H2: Configuración del backend QMD
  - H3: Ejemplo completo de QMD
  - H2: Dreaming
  - H3: Configuración de usuario
  - H3: Ejemplo
  - H2: Relacionado

## reference/prompt-caching.md

- Ruta: /reference/prompt-caching
- Encabezados:
  - H2: Controles principales
  - H3: cacheRetention (valor global predeterminado, modelo y por agente)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat para mantener caliente
  - H2: Comportamiento del proveedor
  - H3: Anthropic (API directa)
  - H3: OpenAI (API directa)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: Modelos OpenRouter
  - H3: Otros proveedores
  - H3: API directa de Google Gemini
  - H3: Uso de Gemini CLI
  - H2: Límite de caché de prompt del sistema
  - H2: Protecciones de estabilidad de caché de OpenClaw
  - H2: Patrones de ajuste
  - H3: Tráfico mixto (valor predeterminado recomendado)
  - H3: Base priorizando el costo
  - H2: Diagnósticos de caché
  - H2: Pruebas de regresión en vivo
  - H3: Expectativas en vivo de Anthropic
  - H3: Expectativas en vivo de OpenAI
  - H3: Configuración de diagnostics.cacheTrace
  - H3: Alternancias de entorno (depuración puntual)
  - H3: Qué inspeccionar
  - H2: Solución rápida de problemas
  - H2: Relacionado

## reference/release-performance-sweep.md

- Ruta: /reference/release-performance-sweep
- Encabezados:
  - H2: Instantánea
  - H2: Cronología de huella de instalación
  - H2: Qué cambió en 5.28
  - H2: Números principales
  - H3: Huella de instalación
  - H3: Tamaño del paquete npm
  - H2: Resumen de turno del agente Kova
  - H2: Pruebas de origen
  - H2: Auditoría de huella de instalación
  - H3: Límite de shrinkwrap
  - H2: Interpretación de cadena de suministro

## reference/rich-output-protocol.md

- Ruta: /reference/rich-output-protocol
- Encabezados:
  - H2: [embed ...]
  - H2: Forma de renderizado almacenada
  - H2: Relacionado

## reference/rpc.md

- Ruta: /reference/rpc
- Encabezados:
  - H2: Patrón A: demonio HTTP (signal-cli)
  - H2: Patrón B: proceso hijo stdio (imsg)
  - H2: Directrices de adaptador
  - H2: Relacionado

## reference/secret-placeholder-conventions.md

- Ruta: /reference/secret-placeholder-conventions
- Encabezados:
  - H1: Convenciones de placeholders de secretos
  - H2: Estilo recomendado
  - H2: Evita estos patrones en la documentación
  - H2: Ejemplo

## reference/secretref-credential-surface.md

- Ruta: /reference/secretref-credential-surface
- Encabezados:
  - H2: Credenciales compatibles
  - H3: destinos de openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: destinos de auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Credenciales no compatibles
  - H2: Relacionado

## reference/session-management-compaction.md

- Ruta: /reference/session-management-compaction
- Encabezados:
  - H2: Fuente de verdad: el Gateway
  - H2: Dos capas de persistencia
  - H2: Ubicaciones en disco
  - H2: Mantenimiento del almacén y controles de disco
  - H2: Sesiones Cron y registros de ejecución
  - H2: Claves de sesión (sessionKey)
  - H2: IDs de sesión (sessionId)
  - H2: Esquema del almacén de sesiones (sessions.json)
  - H2: Estructura de transcripción (.jsonl)
  - H2: Ventanas de contexto frente a tokens rastreados
  - H2: Compaction: qué es
  - H2: Límites de fragmentos de Compaction y emparejamiento de herramientas
  - H2: Cuándo ocurre la Compaction automática (runtime de OpenClaw)
  - H2: Configuración de Compaction (reserveTokens, keepRecentTokens)
  - H2: Proveedores de Compaction conectables
  - H2: Superficies visibles para el usuario
  - H2: Mantenimiento silencioso (NOREPLY)
  - H2: "Volcado de memoria" previo a Compaction (implementado)
  - H2: Lista de verificación de solución de problemas
  - H2: Relacionado

## reference/templates/AGENTS.dev.md

- Ruta: /reference/templates/AGENTS.dev
- Encabezados:
  - H1: AGENTS.md - Espacio de trabajo de OpenClaw
  - H2: Primera ejecución (una vez)
  - H2: Consejo de copia de seguridad (recomendado)
  - H2: Valores predeterminados de seguridad
  - H2: Comprobación previa de soluciones existentes
  - H2: Memoria diaria (recomendado)
  - H2: Heartbeats (opcional)
  - H2: Personalizar
  - H2: Memoria de origen de C-3PO
  - H3: Día de nacimiento: 2026-01-09
  - H3: Verdades principales (de Clawd)
  - H2: Relacionado

## reference/templates/BOOT.md

- Ruta: /reference/templates/BOOT
- Encabezados:
  - H1: BOOT.md
  - H2: Relacionado

## reference/templates/BOOTSTRAP.md

- Ruta: /reference/templates/BOOTSTRAP
- Encabezados:
  - H1: BOOTSTRAP.md - Hola, mundo
  - H2: La conversación
  - H2: Después de saber quién eres
  - H2: Conectar (opcional)
  - H2: Cuando hayas terminado
  - H2: Relacionado

## reference/templates/HEARTBEAT.md

- Ruta: /reference/templates/HEARTBEAT
- Encabezados:
  - H1: Plantilla HEARTBEAT.md
  - H2: Relacionado

## reference/templates/IDENTITY.dev.md

- Ruta: /reference/templates/IDENTITY.dev
- Encabezados:
  - H1: IDENTITY.md - Identidad del agente
  - H2: Rol
  - H2: Alma
  - H2: Relación con Clawd
  - H2: Peculiaridades
  - H2: Lema
  - H2: Relacionado

## reference/templates/IDENTITY.md

- Ruta: /reference/templates/IDENTITY
- Encabezados:
  - H1: IDENTITY.md - ¿Quién soy?
  - H2: Relacionado

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
  - H2: Relacionado

## reference/templates/SOUL.md

- Ruta: /reference/templates/SOUL
- Encabezados:
  - H1: SOUL.md - Quién eres
  - H2: Verdades fundamentales
  - H2: Límites
  - H2: Estilo
  - H2: Continuidad
  - H2: Relacionado

## reference/templates/TOOLS.dev.md

- Ruta: /reference/templates/TOOLS.dev
- Encabezados:
  - H1: TOOLS.md - Notas de herramientas de usuario (editables)
  - H2: Ejemplos
  - H3: imsg
  - H3: sag
  - H2: Relacionado

## reference/templates/TOOLS.md

- Ruta: /reference/templates/TOOLS
- Encabezados:
  - H1: TOOLS.md - Notas locales
  - H2: Qué va aquí
  - H2: Ejemplos
  - H2: ¿Por qué separarlas?
  - H2: Relacionado

## reference/templates/USER.dev.md

- Ruta: /reference/templates/USER.dev
- Encabezados:
  - H1: USER.md - Perfil de usuario
  - H2: Relacionado

## reference/templates/USER.md

- Ruta: /reference/templates/USER
- Encabezados:
  - H1: USER.md - Sobre tu humano
  - H2: Contexto
  - H2: Relacionado

## reference/test.md

- Ruta: /reference/test
- Encabezados:
  - H2: Puerta local de PR
  - H2: Banco de latencia de modelos (claves locales)
  - H2: Banco de inicio de CLI
  - H2: Banco de inicio de Gateway
  - H2: Banco de reinicio de Gateway
  - H2: Onboarding E2E (Docker)
  - H2: Prueba rápida de importación QR (Docker)
  - H2: Relacionado

## reference/token-use.md

- Ruta: /reference/token-use
- Encabezados:
  - H2: Cómo se construye el prompt del sistema
  - H2: Qué cuenta en la ventana de contexto
  - H2: Cómo ver el uso actual de tokens
  - H2: Estimación de costos (cuando se muestra)
  - H2: Impacto del TTL de caché y la poda
  - H3: Ejemplo: mantener caliente una caché de 1 h con Heartbeat
  - H3: Ejemplo: tráfico mixto con estrategia de caché por agente
  - H3: Contexto 1M de Anthropic
  - H2: Consejos para reducir la presión de tokens
  - H2: Relacionado

## reference/transcript-hygiene.md

- Ruta: /reference/transcript-hygiene
- Encabezados:
  - H2: Regla global: el contexto de runtime no es la transcripción del usuario
  - H2: Dónde se ejecuta esto
  - H2: Regla global: saneamiento de imágenes
  - H2: Regla global: llamadas a herramientas malformadas
  - H2: Regla global: turnos incompletos solo de razonamiento
  - H2: Regla global: procedencia de entrada entre sesiones
  - H2: Matriz de proveedores (comportamiento actual)
  - H2: Comportamiento histórico (antes de 2026.1.22)
  - H2: Relacionado

## reference/wizard.md

- Ruta: /reference/wizard
- Encabezados:
  - H2: Detalles del flujo (modo local)
  - H2: Modo no interactivo
  - H3: Agregar agente (no interactivo)
  - H2: RPC del asistente de Gateway
  - H2: Configuración de Signal (signal-cli)
  - H2: Lo que escribe el asistente
  - H2: Documentos relacionados

## releases/2026.6.11.md

- Ruta: /releases/2026.6.11
- Encabezados:
  - H1: Notas de la versión OpenClaw v2026.6.11 (2026-06-30)
  - H2: Aspectos destacados
  - H3: Fiabilidad de entrega de canales
  - H3: Recuperación de proveedores y modelos
  - H3: Continuidad de sesiones, memoria y confianza
  - H3: Modo de retransmisión del enrutador de Slack
  - H3: Puente de activación de Raft External Agent
  - H3: Instalación y reparación de plugins oficiales
  - H2: Canales y mensajería
  - H3: Correcciones adicionales de canales
  - H2: Gateway, seguridad y confianza
  - H3: Recuperación de reinicio y disponibilidad
  - H3: Entrega remota de resultados y medios
  - H2: Clientes e interfaces
  - H3: Envíos de cliente y reconexiones
  - H3: Correcciones de interfaz, ajustes y onboarding
  - H2: Documentos y herramientas de administración
  - H3: Fiabilidad de configuración y comandos
  - H3: Herramientas y trabajo programado

## releases/index.md

- Ruta: /releases
- Encabezados:
  - H1: Notas de la versión
  - H2: Versiones
  - H2: Historial bruto de versiones

## security/CONTRIBUTING-THREAT-MODEL.md

- Ruta: /security/CONTRIBUTING-THREAT-MODEL
- Encabezados:
  - H2: Formas de contribuir
  - H3: Agregar una amenaza
  - H3: Sugerir una mitigación
  - H3: Proponer una cadena de ataque
  - H3: Corregir o mejorar contenido existente
  - H2: Qué usamos
  - H3: Marco MITRE ATLAS
  - H3: Identificadores de amenazas
  - H3: Niveles de riesgo
  - H2: Proceso de revisión
  - H2: Recursos
  - H2: Contacto
  - H2: Reconocimiento
  - H2: Relacionado

## security/THREAT-MODEL-ATLAS.md

- Ruta: /security/THREAT-MODEL-ATLAS
- Encabezados:
  - H2: Marco MITRE ATLAS
  - H3: Atribución del marco
  - H3: Contribuir a este modelo de amenazas
  - H2: 1. Introducción
  - H3: 1.1 Propósito
  - H3: 1.2 Alcance
  - H3: 1.3 Fuera de alcance
  - H2: 2. Arquitectura del sistema
  - H3: 2.1 Límites de confianza
  - H3: 2.2 Flujos de datos
  - H2: 3. Análisis de amenazas por táctica ATLAS
  - H3: 3.1 Reconocimiento (AML.TA0002)
  - H4: T-RECON-001: Descubrimiento de endpoints de agente
  - H4: T-RECON-002: Sondeo de integración de canales
  - H3: 3.2 Acceso inicial (AML.TA0004)
  - H4: T-ACCESS-001: Intercepción de código de emparejamiento
  - H4: T-ACCESS-002: Suplantación de AllowFrom
  - H4: T-ACCESS-003: Robo de tokens
  - H3: 3.3 Ejecución (AML.TA0005)
  - H4: T-EXEC-001: Inyección directa de prompt
  - H4: T-EXEC-002: Inyección indirecta de prompt
  - H4: T-EXEC-003: Inyección de argumentos de herramienta
  - H4: T-EXEC-004: Omisión de aprobación de exec
  - H3: 3.4 Persistencia (AML.TA0006)
  - H4: T-PERSIST-001: Instalación maliciosa de Skill
  - H4: T-PERSIST-002: Envenenamiento de actualización de Skill
  - H4: T-PERSIST-003: Manipulación de configuración de agente
  - H3: 3.5 Evasión de defensas (AML.TA0007)
  - H4: T-EVADE-001: Omisión de patrones de moderación
  - H4: T-EVADE-002: Escape de contenedor de contenido
  - H3: 3.6 Descubrimiento (AML.TA0008)
  - H4: T-DISC-001: Enumeración de herramientas
  - H4: T-DISC-002: Extracción de datos de sesión
  - H3: 3.7 Recopilación y exfiltración (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Robo de datos mediante webfetch
  - H4: T-EXFIL-002: Envío no autorizado de mensajes
  - H4: T-EXFIL-003: Recolección de credenciales
  - H3: 3.8 Impacto (AML.TA0011)
  - H4: T-IMPACT-001: Ejecución no autorizada de comandos
  - H4: T-IMPACT-002: Agotamiento de recursos (DoS)
  - H4: T-IMPACT-003: Daño reputacional
  - H2: 4. Análisis de la cadena de suministro de ClawHub
  - H3: 4.1 Controles de seguridad actuales
  - H3: 4.2 Patrones de marcas de moderación
  - H3: 4.3 Mejoras planificadas
  - H2: 5. Matriz de riesgos
  - H3: 5.1 Probabilidad frente a impacto
  - H3: 5.2 Cadenas de ataque de ruta crítica
  - H2: 6. Resumen de recomendaciones
  - H3: 6.1 Inmediatas (P0)
  - H3: 6.2 A corto plazo (P1)
  - H3: 6.3 A medio plazo (P2)
  - H2: 7. Apéndices
  - H3: 7.1 Mapeo de técnicas ATLAS
  - H3: 7.2 Archivos de seguridad clave
  - H3: 7.3 Glosario
  - H2: Relacionado

## security/formal-verification.md

- Ruta: /security/formal-verification
- Encabezados:
  - H2: Dónde viven los modelos
  - H2: Advertencias importantes
  - H2: Reproducir resultados
  - H3: Exposición de Gateway y configuración incorrecta de gateway abierto
  - H3: Canalización exec de Node (capacidad de mayor riesgo)
  - H3: Almacén de emparejamiento (control de acceso de DM)
  - H3: Control de acceso de entrada (menciones + omisión de comandos de control)
  - H3: Aislamiento de enrutamiento/clave de sesión
  - H2: v1++: modelos acotados adicionales (concurrencia, reintentos, corrección de trazas)
  - H3: Concurrencia / idempotencia del almacén de emparejamiento
  - H3: Correlación de trazas de entrada / idempotencia
  - H3: Precedencia de dmScope de enrutamiento + identityLinks
  - H2: Relacionado

## security/incident-response.md

- Ruta: /security/incident-response
- Encabezados:
  - H2: 1. Detección y triaje
  - H2: 2. Evaluación
  - H2: 3. Respuesta
  - H2: 4. Comunicación
  - H2: 5. Recuperación y seguimiento

## security/network-proxy.md

- Ruta: /security/network-proxy
- Encabezados:
  - H2: Por qué usar un proxy
  - H2: Cómo OpenClaw enruta el tráfico
  - H2: Términos relacionados con proxy
  - H2: Configuración
  - H3: Modo Loopback de Gateway
  - H2: Requisitos del proxy
  - H2: Destinos bloqueados recomendados
  - H2: Validación
  - H2: Confianza en la CA del proxy
  - H2: Límites

## specs/claw-supervisor.md

- Ruta: /specs/claw-supervisor
- Encabezados:
  - H1: Claw Supervisor
  - H2: Objetivo
  - H2: Modelo de producto
  - H2: Arquitectura
  - H2: Contrato de servidor de aplicaciones de Codex
  - H2: Registro de sesiones
  - H2: Superficie MCP para Codex
  - H2: Superficie de control de Claw
  - H2: Flujo de lanzamiento
  - H2: Despliegue
  - H2: Seguridad
  - H2: Plan de implementación
  - H2: Pruebas de aceptación
  - H2: Preguntas abiertas

## start/bootstrapping.md

- Ruta: /start/bootstrapping
- Encabezados:
  - H2: Qué hace el bootstrapping
  - H2: Omitir el bootstrapping
  - H2: Dónde se ejecuta
  - H2: Documentos relacionados

## start/docs-directory.md

- Ruta: /start/docs-directory
- Encabezados:
  - H2: Comienza aquí
  - H2: Proveedores y UX
  - H2: Aplicaciones complementarias
  - H2: Operaciones y seguridad
  - H2: Relacionado

## start/getting-started.md

- Ruta: /start/getting-started
- Encabezados:
  - H2: Qué necesitas
  - H2: Configuración rápida
  - H2: Qué hacer después
  - H2: Relacionado

## start/hubs.md

- Ruta: /start/hubs
- Encabezados:
  - H2: Comienza aquí
  - H2: Instalación + actualizaciones
  - H2: Conceptos principales
  - H2: Proveedores + entrada
  - H2: Gateway + operaciones
  - H2: Herramientas + automatización
  - H2: Nodos, medios, voz
  - H2: Plataformas
  - H2: Aplicación complementaria de macOS (avanzado)
  - H2: Plugins
  - H2: Espacio de trabajo + plantillas
  - H2: Proyecto
  - H2: Pruebas + lanzamiento
  - H2: Relacionado

## start/lore.md

- Ruta: /start/lore
- Encabezados:
  - H1: La historia de OpenClaw 🦞📖
  - H2: La historia de origen
  - H2: La primera muda (27 de enero de 2026)
  - H2: El nombre
  - H2: Los Daleks contra las langostas
  - H2: Personajes clave
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: El Moltiverse
  - H2: Los grandes incidentes
  - H3: El volcado de directorio (3 de dic. de 2025)
  - H3: La gran muda (27 de ene. de 2026)
  - H3: La forma final (30 de enero de 2026)
  - H3: La compra compulsiva del robot (3 de dic. de 2025)
  - H2: Textos sagrados
  - H2: El credo de la langosta
  - H3: La saga de generación del icono (27 de ene. de 2026)
  - H2: El futuro
  - H2: Relacionado

## start/onboarding-overview.md

- Ruta: /start/onboarding-overview
- Encabezados:
  - H2: ¿Qué ruta debo usar?
  - H2: Qué configura el onboarding
  - H2: Onboarding por CLI
  - H2: Onboarding de la aplicación macOS
  - H2: Proveedores personalizados o no listados
  - H2: Relacionado

## start/onboarding.md

- Ruta: /start/onboarding
- Encabezados:
  - H2: Relacionado

## start/openclaw.md

- Ruta: /start/openclaw
- Encabezados:
  - H2: ⚠️ Seguridad primero
  - H2: Prerrequisitos
  - H2: La configuración de dos teléfonos (recomendada)
  - H2: Inicio rápido en 5 minutos
  - H2: Dar al agente un espacio de trabajo (AGENTS)
  - H2: La configuración que lo convierte en "un asistente"
  - H2: Sesiones y memoria
  - H2: Heartbeats (modo proactivo)
  - H2: Medios de entrada y salida
  - H2: Lista de comprobación de operaciones
  - H2: Siguientes pasos
  - H2: Relacionado

## start/quickstart.md

- Ruta: /start/quickstart
- Encabezados:
  - H2: Relacionado

## start/setup.md

- Ruta: /start/setup
- Encabezados:
  - H2: TL;DR
  - H2: Prerrequisitos (desde el código fuente)
  - H2: Estrategia de personalización (para que las actualizaciones no duelan)
  - H2: Ejecutar el Gateway desde este repo
  - H2: Flujo de trabajo estable (aplicación macOS primero)
  - H2: Flujo de trabajo de vanguardia (Gateway en una terminal)
  - H3: 0) (Opcional) Ejecutar también la aplicación macOS desde el código fuente
  - H3: 1) Iniciar el Gateway de desarrollo
  - H3: 2) Apuntar la aplicación macOS a tu Gateway en ejecución
  - H3: 3) Verificar
  - H3: Errores comunes
  - H2: Mapa de almacenamiento de credenciales
  - H2: Actualizar (sin destrozar tu configuración)
  - H2: Linux (servicio de usuario systemd)
  - H2: Documentos relacionados

## start/showcase.md

- Ruta: /start/showcase
- Encabezados:
  - H2: Recién salido de Discord
  - H2: Automatización y flujos de trabajo
  - H2: Conocimiento y memoria
  - H2: Voz y teléfono
  - H2: Infraestructura y despliegue
  - H2: Hogar y hardware
  - H2: Proyectos de la comunidad
  - H2: Envía tu proyecto
  - H2: Relacionado

## start/wizard-cli-automation.md

- Ruta: /start/wizard-cli-automation
- Encabezados:
  - H2: Ejemplo no interactivo base
  - H2: Ejemplos específicos de proveedores
  - H2: Agregar otro agente
  - H2: Documentos relacionados

## start/wizard-cli-reference.md

- Ruta: /start/wizard-cli-reference
- Encabezados:
  - H2: Qué hace el asistente
  - H2: Detalles del flujo local
  - H2: Detalles del modo remoto
  - H2: Opciones de autenticación y modelo
  - H2: Salidas e internals
  - H2: Documentos relacionados

## start/wizard.md

- Ruta: /start/wizard
- Encabezados:
  - H2: Configuración regional
  - H2: QuickStart frente a avanzado
  - H2: Qué configura el onboarding
  - H2: Agregar otro agente
  - H2: Referencia completa
  - H2: Documentos relacionados

## tools/acp-agents-setup.md

- Ruta: /tools/acp-agents-setup
- Encabezados:
  - H2: Compatibilidad con el arnés acpx (actual)
  - H2: Configuración obligatoria
  - H2: Configuración del Plugin para el backend acpx
  - H3: Configuración del comando y la versión de acpx
  - H3: Instalación automática de dependencias
  - H3: Puente MCP de herramientas del Plugin
  - H3: Puente MCP de herramientas de OpenClaw
  - H3: Configuración del tiempo de espera de operaciones en tiempo de ejecución
  - H3: Configuración del agente de sondeo de estado
  - H2: Configuración de permisos
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configuración
  - H2: Relacionado

## tools/acp-agents.md

- Ruta: /tools/acp-agents
- Encabezados:
  - H2: ¿Qué página necesito?
  - H2: ¿Esto funciona sin configuración adicional?
  - H2: Destinos de arnés compatibles
  - H2: Runbook del operador
  - H2: ACP frente a subagentes
  - H2: Cómo ACP ejecuta Claude Code
  - H2: Sesiones vinculadas
  - H3: Modelo mental
  - H3: Vinculaciones de la conversación actual
  - H2: Vinculaciones persistentes de canales
  - H3: Modelo de vinculación
  - H3: Valores predeterminados de tiempo de ejecución por agente
  - H3: Ejemplo
  - H3: Comportamiento
  - H2: Iniciar sesiones ACP
  - H3: Parámetros de sessionsspawn
  - H2: Modos de generación con vinculación e hilo
  - H2: Modelo de entrega
  - H2: Compatibilidad con sandbox
  - H2: Resolución del destino de sesión
  - H2: Controles de ACP
  - H3: Asignación de opciones de tiempo de ejecución
  - H2: Arnés acpx, configuración del Plugin y permisos
  - H2: Solución de problemas
  - H2: Relacionado

## tools/agent-send.md

- Ruta: /tools/agent-send
- Encabezados:
  - H2: Inicio rápido
  - H2: Flags
  - H2: Comportamiento
  - H2: Ejemplos
  - H2: Relacionado

## tools/apply-patch.md

- Ruta: /tools/apply-patch
- Encabezados:
  - H2: Parámetros
  - H2: Notas
  - H2: Ejemplo
  - H2: Relacionado

## tools/brave-search.md

- Ruta: /tools/brave-search
- Encabezados:
  - H2: Obtener una clave de API
  - H2: Ejemplo de configuración
  - H2: Parámetros de la herramienta
  - H2: Notas
  - H2: Relacionado

## tools/browser-control.md

- Ruta: /tools/browser-control
- Encabezados:
  - H2: API de control (opcional)
  - H3: Contrato de errores de /act
  - H3: Requisito de Playwright
  - H4: Instalación de Playwright en Docker
  - H2: Cómo funciona (interno)
  - H2: Referencia rápida de CLI
  - H2: Instantáneas y referencias
  - H2: Mejoras para esperas
  - H2: Flujos de depuración
  - H2: Salida JSON
  - H2: Controles de estado y entorno
  - H2: Seguridad y privacidad
  - H2: Relacionado

## tools/browser-linux-troubleshooting.md

- Ruta: /tools/browser-linux-troubleshooting
- Encabezados:
  - H2: Problema: "Failed to start Chrome CDP on port 18800"
  - H3: Causa raíz
  - H3: Solución 1: Instalar Google Chrome (recomendado)
  - H3: Solución 2: Usar Snap Chromium con modo de solo conexión
  - H3: Verificar que el navegador funciona
  - H3: Referencia de configuración
  - H3: Problema: "No Chrome tabs found for profile=\"user\""
  - H2: Relacionado

## tools/browser-login.md

- Ruta: /tools/browser-login
- Encabezados:
  - H2: Inicio de sesión manual (recomendado)
  - H2: ¿Qué perfil de Chrome se usa?
  - H2: X/Twitter: flujo recomendado
  - H2: Sandboxing + acceso al navegador del host
  - H2: Relacionado

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Ruta: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Encabezados:
  - H2: Primero elige el modo de navegador correcto
  - H3: Opción 1: CDP remoto sin procesar de WSL2 a Windows
  - H3: Opción 2: Chrome MCP local del host
  - H2: Arquitectura funcional
  - H2: Por qué esta configuración es confusa
  - H2: Regla crítica para la interfaz de control
  - H2: Validar por capas
  - H3: Capa 1: Verificar que Chrome ofrece CDP en Windows
  - H3: Capa 2: Verificar que WSL2 puede alcanzar ese endpoint de Windows
  - H3: Capa 3: Configurar el perfil de navegador correcto
  - H3: Capa 4: Verificar la capa de la interfaz de control por separado
  - H3: Capa 5: Verificar el control del navegador de extremo a extremo
  - H2: Errores engañosos comunes
  - H2: Lista rápida de triage
  - H2: Conclusión práctica
  - H2: Relacionado

## tools/browser.md

- Ruta: /tools/browser
- Encabezados:
  - H2: Qué obtienes
  - H2: Inicio rápido
  - H2: Control de Plugin
  - H2: Guía para agentes
  - H2: Falta un comando o una herramienta del navegador
  - H2: Perfiles: openclaw frente a usuario
  - H2: Configuración
  - H3: Visión por captura de pantalla (compatibilidad con modelos de solo texto)
  - H2: Usar Brave u otro navegador basado en Chromium
  - H2: Control local frente a remoto
  - H2: Proxy de navegador de Node (valor predeterminado sin configuración)
  - H2: Browserless (CDP remoto alojado)
  - H3: Docker de Browserless en el mismo host
  - H2: Proveedores CDP de WebSocket directos
  - H3: Browserbase
  - H3: Notte
  - H2: Seguridad
  - H2: Perfiles (varios navegadores)
  - H2: Sesión existente mediante Chrome DevTools MCP
  - H3: Inicio personalizado de Chrome MCP
  - H2: Garantías de aislamiento
  - H2: Selección de navegador
  - H2: API de control (opcional)
  - H2: Solución de problemas
  - H3: Fallo de inicio de CDP frente a bloqueo SSRF de navegación
  - H2: Herramientas del agente + cómo funciona el control
  - H2: Relacionado

## tools/btw.md

- Ruta: /tools/btw
- Encabezados:
  - H2: Qué hace
  - H2: Qué no hace
  - H2: Cómo funciona el contexto
  - H2: Modelo de entrega
  - H2: Comportamiento de la superficie
  - H3: TUI
  - H3: Canales externos
  - H3: Interfaz de control / web
  - H2: Cuándo usar BTW
  - H2: Cuándo no usar BTW
  - H2: Relacionado

## tools/capability-cookbook.md

- Ruta: /tools/capability-cookbook
- Encabezados:
  - H2: Relacionado

## tools/clawhub.md

- Ruta: /tools/clawhub
- Encabezados: ninguno

## tools/code-execution.md

- Ruta: /tools/code-execution
- Encabezados:
  - H2: Configuración
  - H2: Cómo usarlo
  - H2: Errores
  - H2: Límites
  - H2: Relacionado

## tools/creating-skills.md

- Ruta: /tools/creating-skills
- Encabezados:
  - H2: Crea tu primer skill
  - H2: Referencia de SKILL.md
  - H3: Campos obligatorios
  - H3: Claves opcionales de frontmatter
  - H3: Usar {baseDir}
  - H2: Añadir activación condicional
  - H2: Proponer mediante Skill Workshop
  - H2: Publicar en ClawHub
  - H2: Prácticas recomendadas
  - H2: Relacionado

## tools/diffs.md

- Ruta: /tools/diffs
- Encabezados:
  - H2: Inicio rápido
  - H2: Desactivar la guía del sistema integrada
  - H2: Flujo típico del agente
  - H2: Ejemplos de entrada
  - H2: Referencia de entrada de la herramienta
  - H2: Resaltado de sintaxis
  - H2: Contrato de detalles de salida
  - H2: Secciones sin cambios contraídas
  - H2: Valores predeterminados del Plugin
  - H3: Configuración de URL persistente del visor
  - H2: Configuración de seguridad
  - H2: Ciclo de vida y almacenamiento de artefactos
  - H2: URL del visor y comportamiento de red
  - H2: Modelo de seguridad
  - H2: Requisitos del navegador para el modo archivo
  - H2: Solución de problemas
  - H2: Guía operativa
  - H2: Relacionado

## tools/duckduckgo-search.md

- Ruta: /tools/duckduckgo-search
- Encabezados:
  - H2: Configuración
  - H2: Configuración
  - H2: Parámetros de la herramienta
  - H2: Notas
  - H2: Relacionado

## tools/elevated.md

- Ruta: /tools/elevated
- Encabezados:
  - H2: Directivas
  - H2: Cómo funciona
  - H2: Orden de resolución
  - H2: Disponibilidad y listas de permitidos
  - H2: Qué no controla elevated
  - H2: Relacionado

## tools/exa-search.md

- Ruta: /tools/exa-search
- Encabezados:
  - H2: Instalar Plugin
  - H2: Obtener una clave de API
  - H2: Configuración
  - H2: Sobrescritura de URL base
  - H2: Parámetros de la herramienta
  - H3: Extracción de contenido
  - H3: Modos de búsqueda
  - H2: Notas
  - H2: Relacionado

## tools/exec-approvals-advanced.md

- Ruta: /tools/exec-approvals-advanced
- Encabezados:
  - H2: Binarios seguros (solo stdin)
  - H3: Validación de argv y flags denegados
  - H3: Directorios de binarios confiables
  - H3: Encadenamiento de shell, wrappers y multiplexores
  - H3: Binarios seguros frente a lista de permitidos
  - H2: Comandos de intérprete/tiempo de ejecución
  - H3: Comportamiento de entrega de seguimientos
  - H2: Reenvío de aprobaciones a canales de chat
  - H3: Reenvío de aprobaciones de Plugin
  - H3: Aprobaciones en el mismo chat en cualquier canal
  - H3: Entrega de aprobación nativa
  - H3: Flujo IPC de macOS
  - H2: Preguntas frecuentes
  - H3: ¿Cuándo se usarían accountId y threadId en un destino de aprobación?
  - H3: Cuando las aprobaciones se envían a una sesión, ¿cualquiera en esa sesión puede aprobarlas?
  - H2: Relacionado

## tools/exec-approvals.md

- Ruta: /tools/exec-approvals
- Encabezados:
  - H2: Inspeccionar la política efectiva
  - H2: Dónde se aplica
  - H3: Modelo de confianza
  - H3: División de macOS
  - H2: Configuración y almacenamiento
  - H2: Controles de política
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modo YOLO (sin aprobación)
  - H3: Configuración persistente de "never prompt" en host de Gateway
  - H3: Atajo local
  - H3: Host de Node
  - H3: Atajo solo de sesión
  - H2: Lista de permitidos (por agente)
  - H3: Restringir argumentos con argPattern
  - H2: Permitir automáticamente CLI de Skills
  - H2: Binarios seguros y reenvío de aprobaciones
  - H2: Edición en interfaz de control
  - H2: Flujo de aprobación
  - H2: Eventos del sistema
  - H2: Comportamiento de aprobación denegada
  - H2: Implicaciones
  - H2: Relacionado

## tools/exec.md

- Ruta: /tools/exec
- Encabezados:
  - H2: Parámetros
  - H2: Configuración
  - H3: Manejo de PATH
  - H2: Sobrescrituras de sesión (/exec)
  - H2: Modelo de autorización
  - H2: Aprobaciones de ejecución (aplicación complementaria / host de Node)
  - H2: Lista de permitidos + binarios seguros
  - H2: Ejemplos
  - H2: applypatch
  - H2: Relacionado

## tools/firecrawl.md

- Ruta: /tools/firecrawl
- Encabezados:
  - H2: Instalar Plugin
  - H2: Webfetch sin clave y claves de API
  - H2: Configurar la búsqueda de Firecrawl
  - H2: Configurar respaldo de webfetch de Firecrawl
  - H3: Firecrawl autoalojado
  - H2: Herramientas del Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Sigilo / elusión de bots
  - H2: Cómo webfetch usa Firecrawl
  - H2: Relacionado

## tools/gemini-search.md

- Ruta: /tools/gemini-search
- Encabezados:
  - H2: Obtener una clave de API
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Parámetros admitidos
  - H2: Selección de modelo
  - H2: Sobrescrituras de URL base
  - H2: Relacionado

## tools/goal.md

- Ruta: /tools/goal
- Encabezados:
  - H1: Objetivo
  - H2: Inicio rápido
  - H2: Para qué sirven los objetivos
  - H2: Referencia de comandos
  - H2: Estados
  - H2: Presupuestos de tokens
  - H2: Herramientas de modelos
  - H2: TUI
  - H2: Comportamiento de canales
  - H2: Solución de problemas
  - H2: Relacionado

## tools/grok-search.md

- Ruta: /tools/grok-search
- Encabezados:
  - H2: Incorporación y configuración
  - H2: Iniciar sesión u obtener una clave de API
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Parámetros admitidos
  - H2: Sobrescrituras de URL base
  - H2: Relacionado

## tools/image-generation.md

- Ruta: /tools/image-generation
- Encabezados:
  - H2: Inicio rápido
  - H2: Rutas comunes
  - H2: Proveedores compatibles
  - H2: Capacidades de proveedores
  - H2: Parámetros de la herramienta
  - H2: Configuración
  - H3: Selección de modelo
  - H3: Orden de selección de proveedores
  - H3: Edición de imágenes
  - H2: Análisis detallados de proveedores
  - H2: Ejemplos
  - H2: Relacionado

## tools/index.md

- Ruta: /tools
- Encabezados:
  - H2: Empieza aquí
  - H2: Elegir herramientas, Skills o plugins
  - H2: Categorías de herramientas integradas
  - H2: Herramientas proporcionadas por Plugins
  - H2: Configurar acceso y aprobaciones
  - H2: Ampliar capacidades
  - H2: Solucionar herramientas faltantes
  - H2: Relacionado

## tools/kimi-search.md

- Ruta: /tools/kimi-search
- Encabezados:
  - H2: Obtener una clave de API
  - H2: Configuración
  - H2: Cómo funciona
  - H2: Parámetros admitidos
  - H2: Relacionado

## tools/llm-task.md

- Ruta: /tools/llm-task
- Encabezados:
  - H2: Habilitar el Plugin
  - H2: Configuración (opcional)
  - H2: Parámetros de la herramienta
  - H2: Salida
  - H2: Ejemplo: paso de flujo de trabajo de Lobster
  - H3: Limitación importante
  - H2: Notas de seguridad
  - H2: Relacionado

## tools/lobster.md

- Ruta: /tools/lobster
- Encabezados:
  - H2: Hook
  - H2: Por qué
  - H2: ¿Por qué un DSL en lugar de programas simples?
  - H2: Cómo funciona
  - H2: Patrón: CLI pequeña + tuberías JSON + aprobaciones
  - H2: Pasos LLM solo con JSON (llm-task)
  - H3: Limitación importante: Lobster integrado frente a openclaw.invoke
  - H2: Archivos de flujo de trabajo (.lobster)
  - H2: Instalar Lobster
  - H2: Habilitar la herramienta
  - H2: Ejemplo: triage de correo electrónico
  - H2: Parámetros de la herramienta
  - H3: run
  - H3: resume
  - H3: Entradas opcionales
  - H2: Sobre de salida
  - H2: Aprobaciones
  - H2: OpenProse
  - H2: Seguridad
  - H2: Solución de problemas
  - H2: Más información
  - H2: Caso práctico: flujos de trabajo de la comunidad
  - H2: Relacionado

## tools/loop-detection.md

- Ruta: /tools/loop-detection
- Encabezados:
  - H2: Por qué existe esto
  - H2: Bloque de configuración
  - H3: Comportamiento de campos
  - H2: Configuración recomendada
  - H2: Protección posterior a Compaction
  - H2: Registros y comportamiento esperado
  - H2: Relacionado

## tools/media-overview.md

- Ruta: /tools/media-overview
- Encabezados:
  - H2: Capacidades
  - H2: Matriz de capacidades de proveedores
  - H2: Asíncrono frente a síncrono
  - H2: Conversión de voz a texto y llamada de voz
  - H2: Asignaciones de proveedores (cómo los proveedores se dividen entre superficies)
  - H2: Relacionado

## tools/minimax-search.md

- Ruta: /tools/minimax-search
- Encabezados:
  - H2: Obtener una credencial de Token Plan
  - H2: Configuración
  - H2: Selección de región
  - H2: Parámetros compatibles
  - H2: Relacionado

## tools/multi-agent-sandbox-tools.md

- Ruta: /tools/multi-agent-sandbox-tools
- Encabezados:
  - H2: Ejemplos de configuración
  - H2: Precedencia de configuración
  - H3: Configuración de sandbox
  - H3: Restricciones de herramientas
  - H2: Migración desde un solo agente
  - H2: Ejemplos de restricción de herramientas
  - H2: Error común: "non-main"
  - H2: Pruebas
  - H2: Solución de problemas
  - H2: Relacionado

## tools/music-generation.md

- Ruta: /tools/music-generation
- Encabezados:
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H3: Matriz de capacidades
  - H2: Parámetros de herramienta
  - H2: Comportamiento asíncrono
  - H3: Ciclo de vida de tareas
  - H2: Configuración
  - H3: Selección de modelo
  - H3: Orden de selección de proveedor
  - H2: Notas de proveedores
  - H2: Elegir la ruta correcta
  - H2: Modos de capacidad de proveedor
  - H2: Pruebas en vivo
  - H2: Relacionado

## tools/ollama-search.md

- Ruta: /tools/ollama-search
- Encabezados:
  - H2: Configuración inicial
  - H2: Configuración
  - H2: Notas
  - H2: Relacionado

## tools/parallel-search.md

- Ruta: /tools/parallel-search
- Encabezados:
  - H2: Instalar Plugin
  - H2: Clave de API (proveedor de pago)
  - H2: Configuración
  - H2: Sustitución de URL base
  - H2: Parámetros de herramienta
  - H2: Notas
  - H2: Relacionado

## tools/pdf.md

- Ruta: /tools/pdf
- Encabezados:
  - H2: Disponibilidad
  - H2: Referencia de entrada
  - H2: Referencias PDF compatibles
  - H2: Modos de ejecución
  - H3: Modo de proveedor nativo
  - H3: Modo de respaldo de extracción
  - H2: Configuración
  - H2: Detalles de salida
  - H2: Comportamiento ante errores
  - H2: Ejemplos
  - H2: Relacionado

## tools/permission-modes.md

- Ruta: /tools/permission-modes
- Encabezados:
  - H2: Valor predeterminado recomendado
  - H2: Modos de ejecución del host OpenClaw
  - H2: Asignación de Codex Guardian
  - H2: Permisos del arnés ACPX
  - H2: Elegir un modo
  - H2: Relacionado

## tools/perplexity-search.md

- Ruta: /tools/perplexity-search
- Encabezados:
  - H2: Instalar Plugin
  - H2: Obtener una clave de API de Perplexity
  - H2: Compatibilidad con OpenRouter
  - H2: Ejemplos de configuración
  - H3: API nativa de Perplexity Search
  - H3: Compatibilidad de OpenRouter / Sonar
  - H2: Dónde establecer la clave
  - H2: Parámetros de herramienta
  - H3: Reglas de filtro de dominio
  - H2: Notas
  - H2: Relacionado

## tools/plugin.md

- Ruta: /tools/plugin
- Encabezados:
  - H2: Requisitos
  - H2: Inicio rápido
  - H2: Configuración
  - H3: Elegir una fuente de instalación
  - H3: Política de instalación del operador
  - H3: Configurar la política de Plugin
  - H2: Comprender los formatos de Plugin
  - H2: Hooks de Plugin
  - H2: Verificar el Gateway activo
  - H2: Solución de problemas
  - H3: Propiedad bloqueada de ruta de Plugin
  - H3: Configuración lenta de herramientas de Plugin
  - H2: Relacionado

## tools/reactions.md

- Ruta: /tools/reactions
- Encabezados:
  - H2: Cómo funciona
  - H2: Comportamiento del canal
  - H2: Nivel de reacción
  - H2: Relacionado

## tools/searxng-search.md

- Ruta: /tools/searxng-search
- Encabezados:
  - H2: Configuración inicial
  - H2: Configuración
  - H2: Variable de entorno
  - H2: Referencia de configuración de Plugin
  - H2: Notas
  - H2: Relacionado

## tools/skill-workshop.md

- Ruta: /tools/skill-workshop
- Encabezados:
  - H2: Cómo funciona
  - H2: Ciclo de vida
  - H2: Chat
  - H2: CLI
  - H2: Contenido de la propuesta
  - H2: Archivos de soporte
  - H2: Herramienta de agente
  - H2: Aprobación y autonomía
  - H2: Métodos de Gateway
  - H2: Almacenamiento
  - H2: Límites
  - H2: Solución de problemas
  - H2: Relacionado

## tools/skills-config.md

- Ruta: /tools/skills-config
- Encabezados:
  - H2: Carga (skills.load)
  - H2: Instalación (skills.install)
  - H2: Política de instalación del operador (security.installPolicy)
  - H2: Lista de permitidos de Skills incluidos
  - H2: Entradas por Skill (skills.entries)
  - H2: Listas de permitidos de agentes (agents)
  - H2: Workshop (skills.workshop)
  - H2: Raíces de Skills con enlaces simbólicos
  - H2: Skills en sandbox y variables de entorno
  - H2: Recordatorio del orden de carga
  - H2: Relacionado

## tools/skills.md

- Ruta: /tools/skills
- Encabezados:
  - H2: Orden de carga
  - H2: Skills por agente frente a compartidas
  - H2: Listas de permitidos de agentes
  - H2: Plugins y Skills
  - H2: Skill Workshop
  - H2: Instalación desde ClawHub
  - H2: Seguridad
  - H2: Formato de SKILL.md
  - H3: Claves opcionales de frontmatter
  - H2: Control de acceso
  - H3: Especificaciones de instalador
  - H2: Sustituciones de configuración
  - H2: Inyección de entorno
  - H2: Instantáneas y actualización
  - H2: Impacto en tokens
  - H2: Relacionado

## tools/slash-commands.md

- Ruta: /tools/slash-commands
- Encabezados:
  - H2: Tres tipos de comandos
  - H2: Configuración
  - H2: Lista de comandos
  - H3: Comandos principales
  - H3: Comandos de Dock
  - H3: Comandos de Plugins incluidos
  - H3: Comandos de Skills
  - H2: /tools — qué puede usar el agente ahora
  - H2: /model — selección de modelo
  - H2: /config — escrituras de configuración en disco
  - H2: /mcp — configuración del servidor MCP
  - H2: /debug — sustituciones solo en tiempo de ejecución
  - H2: /plugins — gestión de Plugins
  - H2: /trace — salida de trazas de Plugin
  - H2: /btw — preguntas secundarias
  - H2: Notas de superficie
  - H2: Uso y estado de proveedores
  - H2: Relacionado

## tools/steer.md

- Ruta: /tools/steer
- Encabezados:
  - H2: Sesión actual
  - H2: Dirigir frente a poner en cola
  - H2: Subagentes
  - H2: Sesiones ACP
  - H2: Relacionado

## tools/subagents.md

- Ruta: /tools/subagents
- Encabezados:
  - H2: Comando de barra
  - H3: Controles de vinculación de hilos
  - H3: Comportamiento de generación
  - H2: Modos de contexto
  - H2: Herramienta: sessionsspawn
  - H3: Modo de prompt de delegación
  - H3: Parámetros de herramienta
  - H3: Nombres de tareas y direccionamiento
  - H2: Herramienta: sessionsyield
  - H2: Herramienta: subagents
  - H2: Sesiones vinculadas a hilos
  - H3: Canales compatibles con hilos
  - H3: Flujo rápido
  - H3: Controles manuales
  - H3: Conmutadores de configuración
  - H3: Lista de permitidos
  - H3: Detección
  - H3: Archivado automático
  - H2: Subagentes anidados
  - H3: Niveles de profundidad
  - H3: Cadena de anuncios
  - H3: Política de herramientas por profundidad
  - H3: Límite de generación por agente
  - H3: Detención en cascada
  - H2: Autenticación
  - H2: Anuncio
  - H3: Contexto de anuncio
  - H3: Línea de estadísticas
  - H3: Por qué preferir sessionshistory
  - H2: Política de herramientas
  - H3: Sustituir mediante configuración
  - H2: Concurrencia
  - H2: Actividad y recuperación
  - H2: Detención
  - H2: Limitaciones
  - H2: Relacionado

## tools/tavily.md

- Ruta: /tools/tavily
- Encabezados:
  - H2: Primeros pasos
  - H2: Referencia de herramientas
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Elegir la herramienta correcta
  - H2: Configuración avanzada
  - H2: Relacionado

## tools/thinking.md

- Ruta: /tools/thinking
- Encabezados:
  - H2: Qué hace
  - H2: Orden de resolución
  - H2: Establecer un valor predeterminado de sesión
  - H2: Aplicación por agente
  - H2: Modo rápido (/fast)
  - H2: Directivas detalladas (/verbose or /v)
  - H2: Directivas de traza de Plugin (/trace)
  - H2: Visibilidad del razonamiento (/reasoning)
  - H2: Relacionado
  - H2: Heartbeats
  - H2: IU de chat web
  - H2: Perfiles de proveedor

## tools/tokenjuice.md

- Ruta: /tools/tokenjuice
- Encabezados:
  - H2: Habilitar el Plugin
  - H2: Qué cambia tokenjuice
  - H2: Verificar que funciona
  - H2: Deshabilitar el Plugin
  - H2: Relacionado

## tools/tool-search.md

- Ruta: /tools/tool-search
- Encabezados:
  - H2: Cómo se ejecuta un turno
  - H2: Modos
  - H2: Por qué existe esto
  - H2: API
  - H2: Límite de tiempo de ejecución
  - H2: Configuración
  - H2: Prompt y telemetría
  - H2: Validación E2E
  - H2: Comportamiento ante fallos
  - H2: Relacionado

## tools/trajectory.md

- Ruta: /tools/trajectory
- Encabezados:
  - H2: Inicio rápido
  - H2: Acceso
  - H2: Qué se registra
  - H2: Archivos del paquete
  - H2: Ubicación de captura
  - H2: Deshabilitar captura
  - H2: Ajustar tiempo de espera de vaciado
  - H2: Privacidad y límites
  - H2: Solución de problemas
  - H2: Relacionado

## tools/tts.md

- Ruta: /tools/tts
- Encabezados:
  - H2: Inicio rápido
  - H2: Proveedores compatibles
  - H2: Configuración
  - H3: Sustituciones de voz por agente
  - H2: Personas
  - H3: Persona mínima
  - H3: Persona completa (prompt neutral respecto al proveedor)
  - H3: Resolución de persona
  - H3: Cómo usan los proveedores los prompts de persona
  - H3: Política de respaldo
  - H2: Directivas impulsadas por el modelo
  - H2: Comandos de barra
  - H2: Preferencias por usuario
  - H2: Formatos de salida (fijos)
  - H2: Comportamiento de Auto-TTS
  - H2: Formatos de salida por canal
  - H2: Referencia de campos
  - H2: Herramienta de agente
  - H2: RPC de Gateway
  - H2: Enlaces de servicio
  - H2: Relacionado

## tools/video-generation.md

- Ruta: /tools/video-generation
- Encabezados:
  - H2: Inicio rápido
  - H2: Cómo funciona la generación asíncrona
  - H3: Ciclo de vida de tareas
  - H2: Proveedores compatibles
  - H3: Matriz de capacidades
  - H2: Parámetros de herramienta
  - H3: Obligatorio
  - H3: Entradas de contenido
  - H3: Controles de estilo
  - H3: Avanzado
  - H4: Respaldo y opciones tipadas
  - H2: Acciones
  - H2: Selección de modelo
  - H2: Notas de proveedores
  - H2: Modos de capacidad de proveedor
  - H2: Pruebas en vivo
  - H2: Configuración
  - H2: Relacionado

## tools/web-fetch.md

- Ruta: /tools/web-fetch
- Encabezados:
  - H2: Inicio rápido
  - H2: Parámetros de herramienta
  - H2: Cómo funciona
  - H2: Actualizaciones de progreso
  - H2: Configuración
  - H2: Respaldo de Firecrawl
  - H2: Proxy de entorno de confianza
  - H2: Límites y seguridad
  - H2: Perfiles de herramientas
  - H2: Relacionado

## tools/web.md

- Ruta: /tools/web
- Encabezados:
  - H2: Inicio rápido
  - H2: Elegir un proveedor
  - H3: Comparación de proveedores
  - H2: Detección automática
  - H2: Búsqueda web nativa de OpenAI
  - H2: Búsqueda web nativa de Codex
  - H2: Seguridad de red
  - H2: Configurar la búsqueda web
  - H2: Configuración
  - H3: Almacenar claves de API
  - H2: Parámetros de herramienta
  - H2: xsearch
  - H3: Configuración de xsearch
  - H3: Parámetros de xsearch
  - H3: Ejemplo de xsearch
  - H2: Ejemplos
  - H2: Perfiles de herramientas
  - H2: Relacionado

## tts.md

- Ruta: /tts
- Encabezados:
  - H2: Relacionado

## vps.md

- Ruta: /vps
- Encabezados:
  - H2: Elegir un proveedor
  - H2: Cómo funcionan las configuraciones en la nube
  - H2: Reforzar primero el acceso administrativo
  - H2: Agente compartido de empresa en un VPS
  - H2: Usar nodos con un VPS
  - H2: Ajuste de arranque para VM pequeñas y hosts ARM
  - H3: Lista de comprobación de ajuste de systemd (opcional)
  - H2: Relacionado

## web/control-ui.md

- Ruta: /web/control-ui
- Encabezados:
  - H2: Apertura rápida (local)
  - H2: Emparejamiento de dispositivos (primera conexión)
  - H2: Identidad personal (local del navegador)
  - H2: Endpoint de configuración de tiempo de ejecución
  - H2: Compatibilidad de idioma
  - H2: Temas de apariencia
  - H2: Qué puede hacer (hoy)
  - H2: Página MCP
  - H2: Pestaña de actividad
  - H2: Comportamiento de chat
  - H2: Instalación de PWA y push web
  - H2: Inserciones alojadas
  - H2: Ancho de mensajes de chat
  - H2: Acceso Tailnet (recomendado)
  - H2: HTTP no seguro
  - H2: Política de seguridad de contenido
  - H2: Autenticación de ruta de avatar
  - H2: Autenticación de ruta de medios del asistente
  - H2: Compilar la IU
  - H2: Página en blanco de Control UI
  - H2: Depuración/pruebas: servidor de desarrollo + Gateway remoto
  - H2: Relacionado

## web/dashboard.md

- Ruta: /web/dashboard
- Encabezados:
  - H2: Ruta rápida (recomendado)
  - H2: Conceptos básicos de autenticación (local frente a remoto)
  - H2: Si ves "unauthorized" / 1008
  - H2: Relacionado

## web/index.md

- Ruta: /web
- Encabezados:
  - H2: Webhooks
  - H2: RPC HTTP de administración
  - H2: Configuración (activada de forma predeterminada)
  - H2: Acceso con Tailscale
  - H3: Integrated Serve (recomendado)
  - H3: Enlace de Tailnet + token
  - H3: Internet pública (Funnel)
  - H2: Notas de seguridad
  - H2: Compilar la IU

## web/tui.md

- Ruta: /web/tui
- Encabezados:
  - H2: Inicio rápido
  - H3: Modo Gateway
  - H3: Modo local
  - H2: Qué ves
  - H2: Modelo mental: agentes + sesiones
  - H2: Envío + entrega
  - H2: Selectores + superposiciones
  - H2: Atajos de teclado
  - H2: Comandos de barra
  - H2: Comandos de shell local
  - H2: Reparar configuraciones desde la TUI local
  - H2: Salida de herramientas
  - H2: Colores de terminal
  - H2: Historial + streaming
  - H2: Detalles de conexión
  - H2: Opciones
  - H2: Solución de problemas
  - H2: Solución de problemas de conexión
  - H2: Relacionado

## web/webchat.md

- Ruta: /web/webchat
- Encabezados:
  - H2: Qué es
  - H2: Inicio rápido
  - H2: Cómo funciona (comportamiento)
  - H3: Transcripción y modelo de entrega
  - H2: Panel de herramientas de agentes de Control UI
  - H2: Uso remoto
  - H2: Referencia de configuración (WebChat)
  - H2: Relacionado
