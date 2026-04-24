---
read_when:
    - Revisar la postura de seguridad o escenarios de amenazas
    - Trabajar en funciones de seguridad o respuestas de auditoría
summary: Modelo de amenazas de OpenClaw asignado al marco MITRE ATLAS
title: Modelo de amenazas (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T05:50:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Modelo de amenazas de OpenClaw v1.0

## Marco MITRE ATLAS

**Versión:** 1.0-draft
**Última actualización:** 2026-02-04
**Metodología:** MITRE ATLAS + diagramas de flujo de datos
**Marco:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atribución del marco

Este modelo de amenazas se basa en [MITRE ATLAS](https://atlas.mitre.org/), el marco estándar del sector para documentar amenazas adversarias a sistemas de IA/ML. ATLAS es mantenido por [MITRE](https://www.mitre.org/) en colaboración con la comunidad de seguridad de IA.

**Recursos clave de ATLAS:**

- [Técnicas ATLAS](https://atlas.mitre.org/techniques/)
- [Tácticas ATLAS](https://atlas.mitre.org/tactics/)
- [Estudios de caso ATLAS](https://atlas.mitre.org/studies/)
- [GitHub de ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuir a ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuir a este modelo de amenazas

Este es un documento vivo mantenido por la comunidad de OpenClaw. Consulta [CONTRIBUTING-THREAT-MODEL.md](/es/security/CONTRIBUTING-THREAT-MODEL) para ver las directrices de contribución:

- Informar de amenazas nuevas
- Actualizar amenazas existentes
- Proponer cadenas de ataque
- Sugerir mitigaciones

---

## 1. Introducción

### 1.1 Propósito

Este modelo de amenazas documenta amenazas adversarias para la plataforma de agentes de IA OpenClaw y el mercado de Skills ClawHub, usando el marco MITRE ATLAS diseñado específicamente para sistemas de IA/ML.

### 1.2 Alcance

| Componente                | Incluido | Notas                                            |
| ------------------------- | -------- | ------------------------------------------------ |
| Runtime del agente OpenClaw | Sí     | Ejecución principal del agente, llamadas a herramientas, sesiones |
| Gateway                   | Sí       | Autenticación, enrutamiento, integración de canales |
| Integraciones de canales  | Sí       | WhatsApp, Telegram, Discord, Signal, Slack, etc. |
| Mercado ClawHub           | Sí       | Publicación, moderación y distribución de Skills |
| Servidores MCP            | Sí       | Proveedores externos de herramientas             |
| Dispositivos de usuario   | Parcial  | Apps móviles, clientes de escritorio             |

### 1.3 Fuera de alcance

No hay nada explícitamente fuera del alcance de este modelo de amenazas.

---

## 2. Arquitectura del sistema

### 2.1 Límites de confianza

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NO CONFIABLE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│          LÍMITE DE CONFIANZA 1: Acceso al canal                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Vinculación de dispositivos (1h DM / 5m periodo de gracia de nodo) │   │
│  │  • Validación AllowFrom / AllowList                      │   │
│  │  • Autenticación por token/contraseña/Tailscale          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          LÍMITE DE CONFIANZA 2: Aislamiento de sesión            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SESIONES DEL AGENTE                       │   │
│  │  • Clave de sesión = agent:channel:peer                  │   │
│  │  • Políticas de herramientas por agente                  │   │
│  │  • Registro de transcripciones                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          LÍMITE DE CONFIANZA 3: Ejecución de herramientas        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               SANDBOX DE EJECUCIÓN                        │   │
│  │  • Sandbox Docker O Host (exec-approvals)                │   │
│  │  • Ejecución remota de nodos                             │   │
│  │  • Protección SSRF (anclaje DNS + bloqueo de IP)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          LÍMITE DE CONFIANZA 4: Contenido externo                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         URL OBTENIDAS / CORREOS / WEBHOOKS               │   │
│  │  • Encapsulado de contenido externo (etiquetas XML)      │   │
│  │  • Inyección de aviso de seguridad                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          LÍMITE DE CONFIANZA 5: Cadena de suministro             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publicación de Skills (semver, SKILL.md obligatorio)  │   │
│  │  • Indicadores de moderación basados en patrones         │   │
│  │  • Escaneo con VirusTotal (próximamente)                 │   │
│  │  • Verificación de antigüedad de cuenta de GitHub        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujos de datos

| Flujo | Origen  | Destino     | Datos              | Protección           |
| ----- | ------- | ----------- | ------------------ | -------------------- |
| F1    | Canal   | Gateway     | Mensajes de usuario | TLS, AllowFrom       |
| F2    | Gateway | Agente      | Mensajes enrutados | Aislamiento de sesión |
| F3    | Agente  | Herramientas | Invocaciones de herramientas | Aplicación de políticas |
| F4    | Agente  | Externo     | solicitudes `web_fetch` | Bloqueo SSRF         |
| F5    | ClawHub | Agente      | Código de Skills   | Moderación, escaneo  |
| F6    | Agente  | Canal       | Respuestas         | Filtrado de salida   |

---

## 3. Análisis de amenazas por táctica ATLAS

### 3.1 Reconocimiento (AML.TA0002)

#### T-RECON-001: Descubrimiento del endpoint del agente

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Escaneo activo                                           |
| **Descripción**         | El atacante escanea en busca de endpoints expuestos del gateway de OpenClaw |
| **Vector de ataque**    | Escaneo de red, consultas a shodan, enumeración DNS                  |
| **Componentes afectados** | Gateway, endpoints API expuestos                                   |
| **Mitigaciones actuales** | Opción de autenticación Tailscale, vinculación a loopback por defecto |
| **Riesgo residual**     | Medio - Los gateways públicos son detectables                        |
| **Recomendaciones**     | Documentar despliegue seguro, añadir limitación de velocidad en endpoints de descubrimiento |

#### T-RECON-002: Sondeo de integración de canales

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Escaneo activo                                           |
| **Descripción**         | El atacante sondea canales de mensajería para identificar cuentas gestionadas por IA |
| **Vector de ataque**    | Envío de mensajes de prueba, observación de patrones de respuesta    |
| **Componentes afectados** | Todas las integraciones de canales                                 |
| **Mitigaciones actuales** | Ninguna específica                                                 |
| **Riesgo residual**     | Bajo - El descubrimiento por sí solo tiene valor limitado            |
| **Recomendaciones**     | Considerar aleatorización del tiempo de respuesta                    |

---

### 3.2 Acceso inicial (AML.TA0004)

#### T-ACCESS-001: Intercepción del código de vinculación

| Atributo                | Valor                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA                                                     |
| **Descripción**         | El atacante intercepta el código de vinculación durante el periodo de gracia de vinculación (1 h para la vinculación DM de canal, 5 min para la vinculación de nodos) |
| **Vector de ataque**    | Observación por encima del hombro, sniffing de red, ingeniería social                                           |
| **Componentes afectados** | Sistema de vinculación de dispositivos                                                                        |
| **Mitigaciones actuales** | Caducidad de 1 h (vinculación DM) / 5 min (vinculación de nodos), códigos enviados a través del canal existente |
| **Riesgo residual**     | Medio - El periodo de gracia es explotable                                                                      |
| **Recomendaciones**     | Reducir el periodo de gracia, añadir un paso de confirmación                                                   |

#### T-ACCESS-002: Suplantación de AllowFrom

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA                     |
| **Descripción**         | El atacante suplanta una identidad de remitente permitida en el canal          |
| **Vector de ataque**    | Depende del canal: suplantación de número de teléfono, suplantación de nombre de usuario |
| **Componentes afectados** | Validación AllowFrom por canal                                                |
| **Mitigaciones actuales** | Verificación de identidad específica del canal                                |
| **Riesgo residual**     | Medio - Algunos canales son vulnerables a la suplantación                      |
| **Recomendaciones**     | Documentar riesgos específicos del canal, añadir verificación criptográfica cuando sea posible |

#### T-ACCESS-003: Robo de tokens

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA  |
| **Descripción**         | El atacante roba tokens de autenticación de archivos de configuración |
| **Vector de ataque**    | Malware, acceso no autorizado al dispositivo, exposición de copias de seguridad de configuración |
| **Componentes afectados** | `~/.openclaw/credentials/`, almacenamiento de configuración |
| **Mitigaciones actuales** | Permisos de archivos                                       |
| **Riesgo residual**     | Alto - Los tokens se almacenan en texto claro               |
| **Recomendaciones**     | Implementar cifrado de tokens en reposo, añadir rotación de tokens |

---

### 3.3 Ejecución (AML.TA0005)

#### T-EXEC-001: Inyección directa de prompts

| Atributo                | Valor                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Inyección de prompts LLM: directa                                         |
| **Descripción**         | El atacante envía prompts diseñados para manipular el comportamiento del agente           |
| **Vector de ataque**    | Mensajes de canal que contienen instrucciones adversarias                                 |
| **Componentes afectados** | LLM del agente, todas las superficies de entrada                                        |
| **Mitigaciones actuales** | Detección de patrones, encapsulado de contenido externo                                 |
| **Riesgo residual**     | Crítico - Solo detección, sin bloqueo; los ataques sofisticados eluden la protección      |
| **Recomendaciones**     | Implementar defensa multinivel, validación de salida, confirmación del usuario para acciones sensibles |

#### T-EXEC-002: Inyección indirecta de prompts

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - Inyección de prompts LLM: indirecta         |
| **Descripción**         | El atacante incrusta instrucciones maliciosas en contenido obtenido |
| **Vector de ataque**    | URL maliciosas, correos envenenados, webhooks comprometidos |
| **Componentes afectados** | `web_fetch`, ingestión de correo, fuentes de datos externas |
| **Mitigaciones actuales** | Encapsulado de contenido con etiquetas XML y aviso de seguridad |
| **Riesgo residual**     | Alto - El LLM puede ignorar las instrucciones del contenedor |
| **Recomendaciones**     | Implementar sanitización de contenido, contextos de ejecución separados |

#### T-EXEC-003: Inyección de argumentos de herramienta

| Atributo                | Valor                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - Inyección de prompts LLM: directa            |
| **Descripción**         | El atacante manipula argumentos de herramientas mediante inyección de prompts |
| **Vector de ataque**    | Prompts diseñados que influyen en los valores de los parámetros de herramientas |
| **Componentes afectados** | Todas las invocaciones de herramientas                      |
| **Mitigaciones actuales** | Aprobaciones de ejecución para comandos peligrosos          |
| **Riesgo residual**     | Alto - Depende del juicio del usuario                        |
| **Recomendaciones**     | Implementar validación de argumentos, llamadas a herramientas parametrizadas |

#### T-EXEC-004: Elusión de aprobaciones de ejecución

| Atributo                | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Crear datos adversarios                        |
| **Descripción**         | El atacante crea comandos que eluden la lista de permitidos de aprobación |
| **Vector de ataque**    | Ofuscación de comandos, explotación de alias, manipulación de rutas |
| **Componentes afectados** | `exec-approvals.ts`, lista de permitidos de comandos      |
| **Mitigaciones actuales** | Lista de permitidos + modo de solicitud                   |
| **Riesgo residual**     | Alto - No hay sanitización de comandos                     |
| **Recomendaciones**     | Implementar normalización de comandos, ampliar la lista de bloqueados |

---

### 3.4 Persistencia (AML.TA0006)

#### T-PERSIST-001: Instalación de Skill maliciosa

| Atributo                | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA    |
| **Descripción**         | El atacante publica una Skill maliciosa en ClawHub                       |
| **Vector de ataque**    | Crear una cuenta, publicar una Skill con código malicioso oculto         |
| **Componentes afectados** | ClawHub, carga de Skills, ejecución del agente                         |
| **Mitigaciones actuales** | Verificación de antigüedad de cuenta de GitHub, indicadores de moderación basados en patrones |
| **Riesgo residual**     | Crítico - Sin sandboxing, revisión limitada                              |
| **Recomendaciones**     | Integración con VirusTotal (en progreso), sandboxing de Skills, revisión comunitaria |

#### T-PERSIST-002: Envenenamiento de actualización de Skill

| Atributo                | Valor                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA |
| **Descripción**         | El atacante compromete una Skill popular y publica una actualización maliciosa |
| **Vector de ataque**    | Compromiso de cuenta, ingeniería social al propietario de la Skill |
| **Componentes afectados** | Versionado de ClawHub, flujos de actualización automática     |
| **Mitigaciones actuales** | Huella digital de versión                                    |
| **Riesgo residual**     | Alto - Las actualizaciones automáticas pueden descargar versiones maliciosas |
| **Recomendaciones**     | Implementar firma de actualizaciones, capacidad de reversión, fijación de versión |

#### T-PERSIST-003: Manipulación de la configuración del agente

| Atributo                | Valor                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromiso de la cadena de suministro: datos    |
| **Descripción**         | El atacante modifica la configuración del agente para conservar el acceso |
| **Vector de ataque**    | Modificación de archivo de configuración, inyección de ajustes  |
| **Componentes afectados** | Configuración del agente, políticas de herramientas            |
| **Mitigaciones actuales** | Permisos de archivos                                          |
| **Riesgo residual**     | Medio - Requiere acceso local                                   |
| **Recomendaciones**     | Verificación de integridad de configuración, registro de auditoría para cambios de configuración |

---

### 3.5 Evasión de defensas (AML.TA0007)

#### T-EVADE-001: Elusión de patrones de moderación

| Atributo                | Valor                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Crear datos adversarios                                    |
| **Descripción**         | El atacante crea contenido de Skill para eludir patrones de moderación |
| **Vector de ataque**    | Homoglifos Unicode, trucos de codificación, carga dinámica             |
| **Componentes afectados** | `moderation.ts` de ClawHub                                           |
| **Mitigaciones actuales** | `FLAG_RULES` basadas en patrones                                     |
| **Riesgo residual**     | Alto - Regex sencillas fáciles de eludir                               |
| **Recomendaciones**     | Añadir análisis de comportamiento (VirusTotal Code Insight), detección basada en AST |

#### T-EVADE-002: Escape del contenedor de contenido

| Atributo                | Valor                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Crear datos adversarios                       |
| **Descripción**         | El atacante crea contenido que escapa del contexto del contenedor XML |
| **Vector de ataque**    | Manipulación de etiquetas, confusión de contexto, anulación de instrucciones |
| **Componentes afectados** | Encapsulado de contenido externo                        |
| **Mitigaciones actuales** | Etiquetas XML + aviso de seguridad                      |
| **Riesgo residual**     | Medio - Se descubren regularmente escapes novedosos      |
| **Recomendaciones**     | Varias capas de contenedor, validación del lado de salida |

---

### 3.6 Descubrimiento (AML.TA0008)

#### T-DISC-001: Enumeración de herramientas

| Atributo                | Valor                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA |
| **Descripción**         | El atacante enumera las herramientas disponibles mediante prompts |
| **Vector de ataque**    | Consultas del estilo "¿Qué herramientas tienes?"      |
| **Componentes afectados** | Registro de herramientas del agente                  |
| **Mitigaciones actuales** | Ninguna específica                                  |
| **Riesgo residual**     | Bajo - Las herramientas suelen estar documentadas     |
| **Recomendaciones**     | Considerar controles de visibilidad de herramientas   |

#### T-DISC-002: Extracción de datos de sesión

| Atributo                | Valor                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA |
| **Descripción**         | El atacante extrae datos sensibles del contexto de la sesión |
| **Vector de ataque**    | Consultas "¿De qué hablamos?" y sondeo del contexto   |
| **Componentes afectados** | Transcripciones de sesión, ventana de contexto       |
| **Mitigaciones actuales** | Aislamiento de sesión por remitente                 |
| **Riesgo residual**     | Medio - Los datos dentro de la sesión son accesibles  |
| **Recomendaciones**     | Implementar redacción de datos sensibles en el contexto |

---

### 3.7 Recopilación y exfiltración (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Robo de datos mediante web_fetch

| Atributo                | Valor                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                               |
| **Descripción**         | El atacante exfiltra datos indicando al agente que los envíe a una URL externa |
| **Vector de ataque**    | Inyección de prompts que hace que el agente envíe datos mediante POST a un servidor del atacante |
| **Componentes afectados** | Herramienta `web_fetch`                                               |
| **Mitigaciones actuales** | Bloqueo SSRF para redes internas                                     |
| **Riesgo residual**     | Alto - Las URL externas están permitidas                              |
| **Recomendaciones**     | Implementar lista de permitidos de URL, conciencia de clasificación de datos |

#### T-EXFIL-002: Envío no autorizado de mensajes

| Atributo                | Valor                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                         |
| **Descripción**         | El atacante hace que el agente envíe mensajes con datos sensibles |
| **Vector de ataque**    | Inyección de prompts que hace que el agente envíe mensajes al atacante |
| **Componentes afectados** | Herramienta de mensajes, integraciones de canales              |
| **Mitigaciones actuales** | Control de mensajería saliente                                  |
| **Riesgo residual**     | Medio - El control puede eludirse                                |
| **Recomendaciones**     | Requerir confirmación explícita para nuevos destinatarios        |

#### T-EXFIL-003: Recolección de credenciales

| Atributo                | Valor                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                |
| **Descripción**         | Una Skill maliciosa recolecta credenciales del contexto del agente |
| **Vector de ataque**    | El código de la Skill lee variables de entorno y archivos de configuración |
| **Componentes afectados** | Entorno de ejecución de Skills                        |
| **Mitigaciones actuales** | Ninguna específica para Skills                        |
| **Riesgo residual**     | Crítico - Las Skills se ejecutan con los privilegios del agente |
| **Recomendaciones**     | Sandboxing de Skills, aislamiento de credenciales       |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Ejecución no autorizada de comandos

| Atributo                | Valor                                               |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA |
| **Descripción**         | El atacante ejecuta comandos arbitrarios en el sistema del usuario |
| **Vector de ataque**    | Inyección de prompts combinada con elusión de aprobación de exec |
| **Componentes afectados** | Herramienta Bash, ejecución de comandos            |
| **Mitigaciones actuales** | Aprobaciones de ejecución, opción de sandbox Docker |
| **Riesgo residual**     | Crítico - Ejecución en el host sin sandbox          |
| **Recomendaciones**     | Usar sandbox por defecto, mejorar la UX de aprobación |

#### T-IMPACT-002: Agotamiento de recursos (DoS)

| Atributo                | Valor                                              |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA |
| **Descripción**         | El atacante agota los créditos de API o los recursos de cómputo |
| **Vector de ataque**    | Inundación automatizada de mensajes, llamadas costosas a herramientas |
| **Componentes afectados** | Gateway, sesiones del agente, proveedor de API    |
| **Mitigaciones actuales** | Ninguna                                           |
| **Riesgo residual**     | Alto - Sin limitación de velocidad                 |
| **Recomendaciones**     | Implementar límites por remitente y presupuestos de coste |

#### T-IMPACT-003: Daño reputacional

| Atributo                | Valor                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA    |
| **Descripción**         | El atacante hace que el agente envíe contenido dañino/ofensivo |
| **Vector de ataque**    | Inyección de prompts que provoca respuestas inapropiadas |
| **Componentes afectados** | Generación de salida, mensajería del canal             |
| **Mitigaciones actuales** | Políticas de contenido del proveedor LLM               |
| **Riesgo residual**     | Medio - Los filtros del proveedor son imperfectos       |
| **Recomendaciones**     | Capa de filtrado de salida, controles de usuario        |

---

## 4. Análisis de la cadena de suministro de ClawHub

### 4.1 Controles de seguridad actuales

| Control                | Implementación               | Eficacia                                                   |
| ---------------------- | ---------------------------- | ---------------------------------------------------------- |
| Antigüedad de cuenta de GitHub | `requireGitHubAccountAge()` | Media - Eleva el listón para atacantes nuevos      |
| Sanitización de rutas  | `sanitizePath()`             | Alta - Evita path traversal                                |
| Validación de tipo de archivo | `isTextFile()`         | Media - Solo archivos de texto, pero siguen pudiendo ser maliciosos |
| Límites de tamaño      | 50 MB de paquete total       | Alta - Evita agotamiento de recursos                       |
| SKILL.md obligatorio   | Readme obligatorio           | Valor de seguridad bajo - Solo informativo                 |
| Moderación por patrones | `FLAG_RULES` en `moderation.ts` | Baja - Fácil de eludir                                   |
| Estado de moderación   | Campo `moderationStatus`     | Media - Posible revisión manual                            |

### 4.2 Patrones de indicadores de moderación

Patrones actuales en `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitaciones:**

- Solo comprueba slug, displayName, summary, frontmatter, metadata y rutas de archivos
- No analiza el contenido real del código de la Skill
- Una regex simple se elude fácilmente con ofuscación
- No hay análisis de comportamiento

### 4.3 Mejoras planificadas

| Mejora                   | Estado                                 | Impacto                                                        |
| ------------------------ | -------------------------------------- | -------------------------------------------------------------- |
| Integración con VirusTotal | En progreso                          | Alto - Análisis de comportamiento con Code Insight             |
| Informes de la comunidad | Parcial (existe la tabla `skillReports`) | Medio                                                       |
| Registro de auditoría    | Parcial (existe la tabla `auditLogs`)  | Medio                                                          |
| Sistema de insignias     | Implementado                           | Medio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matriz de riesgo

### 5.1 Probabilidad frente a impacto

| ID de amenaza | Probabilidad | Impacto  | Nivel de riesgo | Prioridad |
| ------------- | ------------ | -------- | --------------- | --------- |
| T-EXEC-001    | Alta         | Crítico  | **Crítico**     | P0        |
| T-PERSIST-001 | Alta         | Crítico  | **Crítico**     | P0        |
| T-EXFIL-003   | Media        | Crítico  | **Crítico**     | P0        |
| T-IMPACT-001  | Media        | Crítico  | **Alto**        | P1        |
| T-EXEC-002    | Alta         | Alto     | **Alto**        | P1        |
| T-EXEC-004    | Media        | Alto     | **Alto**        | P1        |
| T-ACCESS-003  | Media        | Alto     | **Alto**        | P1        |
| T-EXFIL-001   | Media        | Alto     | **Alto**        | P1        |
| T-IMPACT-002  | Alta         | Medio    | **Alto**        | P1        |
| T-EVADE-001   | Alta         | Medio    | **Medio**       | P2        |
| T-ACCESS-001  | Baja         | Alto     | **Medio**       | P2        |
| T-ACCESS-002  | Baja         | Alto     | **Medio**       | P2        |
| T-PERSIST-002 | Baja         | Alto     | **Medio**       | P2        |

### 5.2 Cadenas de ataque críticas

**Cadena de ataque 1: Robo de datos basado en Skill**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publicar Skill maliciosa) → (Eludir moderación) → (Recolectar credenciales)
```

**Cadena de ataque 2: Inyección de prompts a RCE**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inyectar prompt) → (Eludir aprobación de exec) → (Ejecutar comandos)
```

**Cadena de ataque 3: Inyección indirecta mediante contenido obtenido**

```text
T-EXEC-002 → T-EXFIL-001 → Exfiltración externa
(Envenenar contenido de URL) → (El agente lo obtiene y sigue instrucciones) → (Datos enviados al atacante)
```

---

## 6. Resumen de recomendaciones

### 6.1 Inmediato (P0)

| ID    | Recomendación                                | Aborda                     |
| ----- | -------------------------------------------- | -------------------------- |
| R-001 | Completar la integración con VirusTotal      | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementar sandboxing de Skills             | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Añadir validación de salida para acciones sensibles | T-EXEC-001, T-EXEC-002 |

### 6.2 Corto plazo (P1)

| ID    | Recomendación                                | Aborda        |
| ----- | -------------------------------------------- | ------------- |
| R-004 | Implementar limitación de velocidad          | T-IMPACT-002  |
| R-005 | Añadir cifrado de tokens en reposo           | T-ACCESS-003  |
| R-006 | Mejorar la UX y la validación de aprobación de exec | T-EXEC-004 |
| R-007 | Implementar lista de permitidos de URL para `web_fetch` | T-EXFIL-001 |

### 6.3 Medio plazo (P2)

| ID    | Recomendación                                         | Aborda        |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Añadir verificación criptográfica de canal cuando sea posible | T-ACCESS-002 |
| R-009 | Implementar verificación de integridad de configuración | T-PERSIST-003 |
| R-010 | Añadir firma de actualizaciones y fijación de versión | T-PERSIST-002 |

---

## 7. Apéndices

### 7.1 Asignación de técnicas ATLAS

| ID ATLAS      | Nombre de la técnica             | Amenazas de OpenClaw                                              |
| ------------- | -------------------------------- | ----------------------------------------------------------------- |
| AML.T0006     | Escaneo activo                   | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Recopilación                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Cadena de suministro: software de IA | T-PERSIST-001, T-PERSIST-002                                  |
| AML.T0010.002 | Cadena de suministro: datos      | T-PERSIST-003                                                     |
| AML.T0031     | Erosionar la integridad del modelo de IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                   |
| AML.T0040     | Acceso a la API de inferencia del modelo de IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Crear datos adversarios          | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | Inyección de prompts LLM: directa | T-EXEC-001, T-EXEC-003                                          |
| AML.T0051.001 | Inyección de prompts LLM: indirecta | T-EXEC-002                                                     |

### 7.2 Archivos clave de seguridad

| Ruta                                | Propósito                    | Nivel de riesgo |
| ----------------------------------- | ---------------------------- | --------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprobación de comandos | **Crítico**  |
| `src/gateway/auth.ts`               | Autenticación del Gateway    | **Crítico**     |
| `src/infra/net/ssrf.ts`             | Protección SSRF             | **Crítico**     |
| `src/security/external-content.ts`  | Mitigación de inyección de prompts | **Crítico** |
| `src/agents/sandbox/tool-policy.ts` | Aplicación de políticas de herramientas | **Crítico** |
| `src/routing/resolve-route.ts`      | Aislamiento de sesión        | **Medio**       |

### 7.3 Glosario

| Término              | Definición                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Panorama de amenazas adversarias para sistemas de IA de MITRE |
| **ClawHub**          | Mercado de Skills de OpenClaw                             |
| **Gateway**          | Capa de enrutamiento de mensajes y autenticación de OpenClaw |
| **MCP**              | Model Context Protocol - interfaz de proveedor de herramientas |
| **Inyección de prompts** | Ataque donde se incrustan instrucciones maliciosas en la entrada |
| **Skill**            | Extensión descargable para agentes de OpenClaw            |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Este modelo de amenazas es un documento vivo. Informa de problemas de seguridad a security@openclaw.ai_

## Relacionado

- [Verificación formal](/es/security/formal-verification)
- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
