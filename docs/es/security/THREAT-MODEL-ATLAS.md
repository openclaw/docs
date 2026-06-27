---
read_when:
    - Revisión de la postura de seguridad o de escenarios de amenazas
    - Trabajar en funciones de seguridad o respuestas de auditoría
summary: Modelo de amenazas de OpenClaw mapeado al marco MITRE ATLAS
title: Modelo de amenazas (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:01:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## marco MITRE ATLAS

**Versión:** 1.0-borrador
**Última actualización:** 2026-02-04
**Metodología:** MITRE ATLAS + diagramas de flujo de datos
**Marco:** [MITRE ATLAS](https://atlas.mitre.org/) (panorama de amenazas adversarias para sistemas de IA)

### Atribución del marco

Este modelo de amenazas se basa en [MITRE ATLAS](https://atlas.mitre.org/), el marco estándar de la industria para documentar amenazas adversarias contra sistemas de IA/ML. ATLAS es mantenido por [MITRE](https://www.mitre.org/) en colaboración con la comunidad de seguridad de IA.

**Recursos clave de ATLAS:**

- [Técnicas de ATLAS](https://atlas.mitre.org/techniques/)
- [Tácticas de ATLAS](https://atlas.mitre.org/tactics/)
- [Casos de estudio de ATLAS](https://atlas.mitre.org/studies/)
- [GitHub de ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuir a ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuir a este modelo de amenazas

Este es un documento vivo mantenido por la comunidad de OpenClaw. Consulta [CONTRIBUTING-THREAT-MODEL.md](/es/security/CONTRIBUTING-THREAT-MODEL) para ver las pautas de contribución:

- Informar sobre nuevas amenazas
- Actualizar amenazas existentes
- Proponer cadenas de ataque
- Sugerir mitigaciones

---

## 1. Introducción

### 1.1 Propósito

Este modelo de amenazas documenta amenazas adversarias contra la plataforma de agentes de IA OpenClaw y el mercado de Skills ClawHub, usando el marco MITRE ATLAS diseñado específicamente para sistemas de IA/ML.

### 1.2 Alcance

| Componente             | Incluido | Notas                                             |
| ---------------------- | -------- | ------------------------------------------------- |
| Runtime de agente OpenClaw | Sí       | Ejecución central de agentes, llamadas a herramientas, sesiones |
| Gateway                | Sí       | Autenticación, enrutamiento, integración de canales |
| Integraciones de canales | Sí       | WhatsApp, Telegram, Discord, Signal, Slack, etc. |
| Marketplace de ClawHub | Sí       | Publicación, moderación y distribución de Skills |
| Servidores MCP         | Sí       | Proveedores externos de herramientas             |
| Dispositivos de usuario | Parcial  | Aplicaciones móviles, clientes de escritorio     |

### 1.3 Fuera de alcance

Nada queda explícitamente fuera del alcance de este modelo de amenazas.

---

## 2. Arquitectura del sistema

### 2.1 Límites de confianza

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujos de datos

| Flujo | Origen  | Destino | Datos              | Protección           |
| ----- | ------- | ------- | ------------------ | -------------------- |
| F1    | Canal   | Gateway | Mensajes de usuario | TLS, AllowFrom       |
| F2    | Gateway | Agente  | Mensajes enrutados | Aislamiento de sesión |
| F3    | Agente  | Herramientas | Invocaciones de herramientas | Aplicación de políticas |
| F4    | Agente  | Externo | solicitudes web_fetch | Bloqueo de SSRF      |
| F5    | ClawHub | Agente  | Código de Skills   | Moderación, escaneo  |
| F6    | Agente  | Canal   | Respuestas         | Filtrado de salida   |

---

## 3. Análisis de amenazas por táctica de ATLAS

### 3.1 Reconocimiento (AML.TA0002)

#### T-RECON-001: Detección de endpoints de agentes

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0006 - Escaneo activo                                           |
| **Descripción**         | El atacante escanea endpoints expuestos del gateway de OpenClaw      |
| **Vector de ataque**    | Escaneo de red, consultas de Shodan, enumeración de DNS              |
| **Componentes afectados** | Gateway, endpoints de API expuestos                                |
| **Mitigaciones actuales** | Opción de autenticación con Tailscale, enlace a loopback de forma predeterminada |
| **Riesgo residual**     | Medio - Los gateways públicos son detectables                        |
| **Recomendaciones**     | Documentar el despliegue seguro, añadir limitación de tasa en endpoints de detección |

#### T-RECON-002: Sondeo de integración de canales

| Atributo                | Valor                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0006 - Escaneo activo                                         |
| **Descripción**         | El atacante sondea canales de mensajería para identificar cuentas administradas por IA |
| **Vector de ataque**    | Envío de mensajes de prueba, observación de patrones de respuesta  |
| **Componentes afectados** | Todas las integraciones de canales                               |
| **Mitigaciones actuales** | Ninguna específica                                               |
| **Riesgo residual**     | Bajo - Valor limitado solo con el descubrimiento                   |
| **Recomendaciones**     | Considerar la aleatorización del tiempo de respuesta               |

---

### 3.2 Acceso inicial (AML.TA0004)

#### T-ACCESS-001: Intercepción de código de emparejamiento

| Atributo                | Valor                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia del modelo de IA                                                     |
| **Descripción**         | El atacante intercepta el código de emparejamiento durante el período de gracia de emparejamiento (1 h para el emparejamiento de canal de DM, 5 min para el emparejamiento de Node) |
| **Vector de ataque**    | Mirar por encima del hombro, rastreo de red, ingeniería social                                                 |
| **Componentes afectados** | Sistema de emparejamiento de dispositivos                                                                  |
| **Mitigaciones actuales** | Vencimiento de 1 h (emparejamiento de DM) / vencimiento de 5 min (emparejamiento de Node), códigos enviados mediante el canal existente |
| **Riesgo residual**     | Medio - Período de gracia explotable                                                                          |
| **Recomendaciones**     | Reducir el período de gracia, agregar paso de confirmación                                                     |

#### T-ACCESS-002: Suplantación de AllowFrom

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia del modelo de IA                     |
| **Descripción**         | El atacante suplanta la identidad de remitente permitida en el canal           |
| **Vector de ataque**    | Depende del canal - suplantación de número telefónico, suplantación de nombre de usuario |
| **Componentes afectados** | Validación de AllowFrom por canal                                            |
| **Mitigaciones actuales** | Verificación de identidad específica del canal                               |
| **Riesgo residual**     | Medio - Algunos canales son vulnerables a la suplantación                      |
| **Recomendaciones**     | Documentar riesgos específicos del canal, agregar verificación criptográfica cuando sea posible |

#### T-ACCESS-003: Robo de tokens

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia del modelo de IA  |
| **Descripción**         | El atacante roba tokens de autenticación de archivos de configuración |
| **Vector de ataque**    | Malware, acceso no autorizado al dispositivo, exposición de copias de seguridad de configuración |
| **Componentes afectados** | ~/.openclaw/credentials/, almacenamiento de configuración |
| **Mitigaciones actuales** | Permisos de archivo                                      |
| **Riesgo residual**     | Alto - Tokens almacenados en texto sin formato              |
| **Recomendaciones**     | Implementar cifrado de tokens en reposo, agregar rotación de tokens |

---

### 3.3 Ejecución (AML.TA0005)

#### T-EXEC-001: Inyección directa de instrucciones

| Atributo                | Valor                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0051.000 - Inyección directa de instrucciones en LLM                                  |
| **Descripción**         | El atacante envía instrucciones diseñadas para manipular el comportamiento del agente      |
| **Vector de ataque**    | Mensajes de canal que contienen instrucciones adversarias                                  |
| **Componentes afectados** | LLM del agente, todas las superficies de entrada                                        |
| **Mitigaciones actuales** | Detección de patrones, envoltura de contenido externo                                   |
| **Riesgo residual**     | Crítico - Solo detección, sin bloqueo; los ataques sofisticados la eluden                 |
| **Recomendaciones**     | Implementar defensa multicapa, validación de salida, confirmación del usuario para acciones sensibles |

#### T-EXEC-002: Inyección indirecta de instrucciones

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0051.001 - Inyección indirecta de instrucciones en LLM |
| **Descripción**         | El atacante inserta instrucciones maliciosas en contenido recuperado |
| **Vector de ataque**    | URL maliciosas, correos electrónicos envenenados, Webhooks comprometidos |
| **Componentes afectados** | web_fetch, ingesta de correo electrónico, fuentes de datos externas |
| **Mitigaciones actuales** | Envoltura de contenido con etiquetas XML y aviso de seguridad |
| **Riesgo residual**     | Alto - El LLM puede ignorar las instrucciones de la envoltura |
| **Recomendaciones**     | Implementar saneamiento de contenido, separar contextos de ejecución |

#### T-EXEC-003: Inyección de argumentos de herramientas

| Atributo                | Valor                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0051.000 - Inyección directa de instrucciones en LLM    |
| **Descripción**         | El atacante manipula argumentos de herramientas mediante inyección de instrucciones |
| **Vector de ataque**    | Instrucciones diseñadas que influyen en los valores de parámetros de herramientas |
| **Componentes afectados** | Todas las invocaciones de herramientas                    |
| **Mitigaciones actuales** | Aprobaciones de ejecución para comandos peligrosos         |
| **Riesgo residual**     | Alto - Depende del criterio del usuario                      |
| **Recomendaciones**     | Implementar validación de argumentos, llamadas a herramientas parametrizadas |

#### T-EXEC-004: Omisión de aprobación de ejecución

| Atributo                | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0043 - Crear datos adversarios                        |
| **Descripción**         | El atacante crea comandos que omiten la lista de permitidos de aprobación |
| **Vector de ataque**    | Ofuscación de comandos, explotación de alias, manipulación de rutas |
| **Componentes afectados** | exec-approvals.ts, lista de permitidos de comandos       |
| **Mitigaciones actuales** | Lista de permitidos + modo de solicitud                  |
| **Riesgo residual**     | Alto - Sin saneamiento de comandos                         |
| **Recomendaciones**     | Implementar normalización de comandos, ampliar la lista de bloqueo |

---

### 3.4 Persistencia (AML.TA0006)

#### T-PERSIST-001: Instalación de Skill maliciosa

| Atributo                | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA    |
| **Descripción**         | El atacante publica una Skill maliciosa en ClawHub                       |
| **Vector de ataque**    | Crear cuenta, publicar Skill con código malicioso oculto                 |
| **Componentes afectados** | ClawHub, carga de Skills, ejecución del agente                         |
| **Mitigaciones actuales** | Verificación de antigüedad de cuenta de GitHub, indicadores de moderación basados en patrones |
| **Riesgo residual**     | Crítico - Sin aislamiento, revisión limitada                             |
| **Recomendaciones**     | Integración con VirusTotal (en curso), aislamiento de Skills, revisión comunitaria |

#### T-PERSIST-002: Envenenamiento de actualización de Skill

| Atributo                | Valor                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA |
| **Descripción**         | El atacante compromete una Skill popular e impulsa una actualización maliciosa |
| **Vector de ataque**    | Compromiso de cuenta, ingeniería social del propietario de la Skill |
| **Componentes afectados** | Versionado de ClawHub, flujos de actualización automática    |
| **Mitigaciones actuales** | Huella digital de versión                                    |
| **Riesgo residual**     | Alto - Las actualizaciones automáticas pueden obtener versiones maliciosas |
| **Recomendaciones**     | Implementar firma de actualizaciones, capacidad de reversión, fijación de versión |

#### T-PERSIST-003: Manipulación de configuración del agente

| Atributo                | Valor                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0010.002 - Compromiso de la cadena de suministro: datos    |
| **Descripción**         | El atacante modifica la configuración del agente para persistir el acceso |
| **Vector de ataque**    | Modificación de archivos de configuración, inyección de ajustes |
| **Componentes afectados** | Configuración del agente, políticas de herramientas           |
| **Mitigaciones actuales** | Permisos de archivo                                           |
| **Riesgo residual**     | Medio - Requiere acceso local                                  |
| **Recomendaciones**     | Verificación de integridad de configuración, registro de auditoría para cambios de configuración |

---

### 3.5 Evasión de defensa (AML.TA0007)

#### T-EVADE-001: Omisión de patrones de moderación

| Atributo                | Valor                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0043 - Crear datos adversarios                                    |
| **Descripción**         | El atacante crea contenido de Skill para evadir patrones de moderación |
| **Vector de ataque**    | Homoglifos Unicode, trucos de codificación, carga dinámica             |
| **Componentes afectados** | ClawHub moderation.ts                                                |
| **Mitigaciones actuales** | FLAG_RULES basadas en patrones                                      |
| **Riesgo residual**     | Alto - Expresión regular simple que se elude fácilmente                |
| **Recomendaciones**     | Agregar análisis de comportamiento (VirusTotal Code Insight), detección basada en AST |

#### T-EVADE-002: Escape de envoltura de contenido

| Atributo               | Valor                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Crear datos adversarios                       |
| **Descripción**         | El atacante crea contenido que escapa del contexto del contenedor XML |
| **Vector de ataque**    | Manipulación de etiquetas, confusión de contexto, anulación de instrucciones |
| **Componentes afectados** | Envoltura de contenido externo                          |
| **Mitigaciones actuales** | Etiquetas XML + aviso de seguridad                      |
| **Riesgo residual**     | Medio - Se descubren escapes nuevos con regularidad       |
| **Recomendaciones**     | Varias capas de envoltura, validación del lado de salida  |

---

### 3.6 Descubrimiento (AML.TA0008)

#### T-DISC-001: Enumeración de herramientas

| Atributo               | Valor                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia de modelos de IA |
| **Descripción**         | El atacante enumera las herramientas disponibles mediante indicaciones |
| **Vector de ataque**    | Consultas del estilo "¿Qué herramientas tienes?"      |
| **Componentes afectados** | Registro de herramientas del agente                 |
| **Mitigaciones actuales** | Ninguna específica                                  |
| **Riesgo residual**     | Bajo - Las herramientas suelen estar documentadas     |
| **Recomendaciones**     | Considerar controles de visibilidad de herramientas   |

#### T-DISC-002: Extracción de datos de sesión

| Atributo               | Valor                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia de modelos de IA |
| **Descripción**         | El atacante extrae datos confidenciales del contexto de sesión |
| **Vector de ataque**    | Consultas "¿Qué discutimos?", sondeo de contexto      |
| **Componentes afectados** | Transcripciones de sesión, ventana de contexto      |
| **Mitigaciones actuales** | Aislamiento de sesión por remitente                 |
| **Riesgo residual**     | Medio - Los datos dentro de la sesión son accesibles  |
| **Recomendaciones**     | Implementar censura de datos confidenciales en el contexto |

---

### 3.7 Recopilación y exfiltración (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Robo de datos mediante web_fetch

| Atributo               | Valor                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                               |
| **Descripción**         | El atacante exfiltra datos indicando al agente que los envíe a una URL externa |
| **Vector de ataque**    | Inyección de instrucciones que hace que el agente envíe datos por POST al servidor del atacante |
| **Componentes afectados** | Herramienta web_fetch                                                 |
| **Mitigaciones actuales** | Bloqueo de SSRF para redes internas                                  |
| **Riesgo residual**     | Alto - Se permiten URL externas                                        |
| **Recomendaciones**     | Implementar listas de URL permitidas, conciencia de clasificación de datos |

#### T-EXFIL-002: Envío no autorizado de mensajes

| Atributo               | Valor                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                         |
| **Descripción**         | El atacante hace que el agente envíe mensajes que contienen datos confidenciales |
| **Vector de ataque**    | Inyección de instrucciones que hace que el agente envíe un mensaje al atacante |
| **Componentes afectados** | Herramienta de mensajes, integraciones de canales              |
| **Mitigaciones actuales** | Control de mensajes salientes                                  |
| **Riesgo residual**     | Medio - El control puede omitirse                                |
| **Recomendaciones**     | Exigir confirmación explícita para nuevos destinatarios          |

#### T-EXFIL-003: Recolección de credenciales

| Atributo               | Valor                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                |
| **Descripción**         | Una Skill maliciosa recolecta credenciales del contexto del agente |
| **Vector de ataque**    | El código de la Skill lee variables de entorno y archivos de configuración |
| **Componentes afectados** | Entorno de ejecución de Skills                        |
| **Mitigaciones actuales** | Ninguna específica para Skills                        |
| **Riesgo residual**     | Crítico - Las Skills se ejecutan con privilegios de agente |
| **Recomendaciones**     | Aislamiento de Skills, aislamiento de credenciales      |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Ejecución no autorizada de comandos

| Atributo               | Valor                                               |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA |
| **Descripción**         | El atacante ejecuta comandos arbitrarios en el sistema del usuario |
| **Vector de ataque**    | Inyección de instrucciones combinada con omisión de aprobación de ejecución |
| **Componentes afectados** | Herramienta Bash, ejecución de comandos           |
| **Mitigaciones actuales** | Aprobaciones de ejecución, opción de entorno aislado Docker |
| **Riesgo residual**     | Crítico - Ejecución en el host sin entorno aislado   |
| **Recomendaciones**     | Usar entorno aislado de forma predeterminada, mejorar la experiencia de aprobación |

#### T-IMPACT-002: Agotamiento de recursos (DoS)

| Atributo               | Valor                                              |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA |
| **Descripción**         | El atacante agota créditos de API o recursos de cómputo |
| **Vector de ataque**    | Inundación automatizada de mensajes, llamadas costosas a herramientas |
| **Componentes afectados** | Gateway, sesiones de agente, proveedor de API     |
| **Mitigaciones actuales** | Ninguna                                          |
| **Riesgo residual**     | Alto - Sin limitación de tasa                      |
| **Recomendaciones**     | Implementar límites de tasa por remitente y presupuestos de coste |

#### T-IMPACT-003: Daño reputacional

| Atributo               | Valor                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA    |
| **Descripción**         | El atacante hace que el agente envíe contenido dañino u ofensivo |
| **Vector de ataque**    | Inyección de instrucciones que provoca respuestas inapropiadas |
| **Componentes afectados** | Generación de salida, mensajería de canales           |
| **Mitigaciones actuales** | Políticas de contenido del proveedor de LLM           |
| **Riesgo residual**     | Medio - Los filtros del proveedor son imperfectos       |
| **Recomendaciones**     | Capa de filtrado de salida, controles de usuario        |

---

## 4. Análisis de cadena de suministro de ClawHub

### 4.1 Controles de seguridad actuales

| Control              | Implementación              | Eficacia                                             |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Antigüedad de la cuenta de GitHub | `requireGitHubAccountAge()` | Media - Eleva la barrera para nuevos atacantes      |
| Saneamiento de rutas | `sanitizePath()`            | Alta - Evita el recorrido de rutas                   |
| Validación de tipo de archivo | `isTextFile()`              | Media - Solo archivos de texto, pero aún pueden ser maliciosos |
| Límites de tamaño    | Paquete total de 50 MB      | Alta - Evita el agotamiento de recursos              |
| SKILL.md obligatorio | Léame obligatorio           | Bajo valor de seguridad - Solo informativo           |
| Moderación de patrones | FLAG_RULES en moderation.ts | Baja - Se omite fácilmente                           |
| Estado de moderación | Campo `moderationStatus`    | Media - La revisión manual es posible                |

### 4.2 Patrones de marcas de moderación

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

- Solo comprueba slug, displayName, resumen, frontmatter, metadatos y rutas de archivo
- No analiza el contenido real del código de la Skill
- Las expresiones regulares simples se omiten fácilmente con ofuscación
- Sin análisis de comportamiento

### 4.3 Mejoras planificadas

| Mejora                 | Estado                                | Impacto                                                               |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Integración con VirusTotal | En curso                          | Alto - Análisis de comportamiento de Code Insight                     |
| Informes de la comunidad | Parcial (existe la tabla `skillReports`) | Medio                                                           |
| Registro de auditoría  | Parcial (existe la tabla `auditLogs`) | Medio                                                                |
| Sistema de insignias   | Implementado                          | Medio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matriz de riesgos

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

### 5.2 Cadenas de ataque de ruta crítica

**Cadena de ataque 1: robo de datos basado en Skills**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Cadena de ataque 2: inyección de instrucciones a RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Cadena de ataque 3: inyección indirecta mediante contenido obtenido**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Resumen de recomendaciones

### 6.1 Inmediatas (P0)

| ID    | Recomendación                                      | Aborda                     |
| ----- | -------------------------------------------------- | -------------------------- |
| R-001 | Completar la integración de VirusTotal             | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementar el aislamiento de Skills               | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Agregar validación de salida para acciones sensibles | T-EXEC-001, T-EXEC-002     |

### 6.2 Corto plazo (P1)

| ID    | Recomendación                                      | Aborda       |
| ----- | -------------------------------------------------- | ------------ |
| R-004 | Implementar limitación de tasa                     | T-IMPACT-002 |
| R-005 | Agregar cifrado de tokens en reposo                | T-ACCESS-003 |
| R-006 | Mejorar la UX de aprobación de exec y la validación | T-EXEC-004   |
| R-007 | Implementar lista de permitidos de URL para web_fetch | T-EXFIL-001  |

### 6.3 Mediano plazo (P2)

| ID    | Recomendación                                             | Aborda        |
| ----- | --------------------------------------------------------- | ------------- |
| R-008 | Agregar verificación criptográfica de canal cuando sea posible | T-ACCESS-002  |
| R-009 | Implementar verificación de integridad de la configuración | T-PERSIST-003 |
| R-010 | Agregar firma de actualizaciones y fijación de versiones  | T-PERSIST-002 |

---

## 7. Apéndices

### 7.1 Mapeo de técnicas ATLAS

| ID de ATLAS   | Nombre de la técnica              | Amenazas de OpenClaw                                           |
| ------------- | --------------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Escaneo activo                    | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Recopilación                      | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Cadena de suministro: software de IA | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Cadena de suministro: datos       | T-PERSIST-003                                                    |
| AML.T0031     | Erosionar la integridad del modelo de IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Acceso a la API de inferencia del modelo de IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Crear datos adversariales         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Inyección de prompts en LLM: directa | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Inyección de prompts en LLM: indirecta | T-EXEC-002                                                       |

### 7.2 Archivos de seguridad clave

| Ruta                                | Propósito                        | Nivel de riesgo |
| ----------------------------------- | -------------------------------- | --------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprobación de comandos | **Crítico**     |
| `src/gateway/auth.ts`               | Autenticación de Gateway         | **Crítico**     |
| `src/infra/net/ssrf.ts`             | Protección contra SSRF           | **Crítico**     |
| `src/security/external-content.ts`  | Mitigación de inyección de prompts | **Crítico**   |
| `src/agents/sandbox/tool-policy.ts` | Aplicación de políticas de herramientas | **Crítico** |
| `src/routing/resolve-route.ts`      | Aislamiento de sesiones          | **Medio**       |

### 7.3 Glosario

| Término              | Definición                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Panorama de amenazas adversariales de MITRE para sistemas de IA |
| **ClawHub**          | Marketplace de Skills de OpenClaw                         |
| **Gateway**          | Capa de autenticación y enrutamiento de mensajes de OpenClaw |
| **MCP**              | Protocolo de contexto de modelo: interfaz de proveedor de herramientas |
| **Inyección de prompts** | Ataque en el que se incrustan instrucciones maliciosas en la entrada |
| **Skill**            | Extensión descargable para agentes de OpenClaw            |
| **SSRF**             | Falsificación de solicitudes del lado del servidor        |

---

_Este modelo de amenazas es un documento vivo. Reporta problemas de seguridad a security@openclaw.ai_

## Relacionado

- [Verificación formal](/es/security/formal-verification)
- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
